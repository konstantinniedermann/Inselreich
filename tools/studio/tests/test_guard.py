import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import guard

ROOT = Path("/repo")
ENV = {"HOME": "/Users/x", "TMPDIR": "/var/folders/ab/T/"}


def reason(cmd, allow=False, cwd=ROOT):
    return guard.bash_reason(cmd, ROOT, cwd, ENV, allow)


class BashTest(unittest.TestCase):
    def test_stash_blocked_except_list_show(self):
        for cmd in [
            "git stash",
            "git stash push -m x",
            "git stash pop",
            "git stash apply",
            "git stash save x",
            "git stash drop",
            "git -C .worktrees/x stash",
            "git stash -u",
        ]:
            with self.subTest(cmd=cmd):
                found = reason(cmd)
                self.assertIsNotNone(found)
                self.assertIn("wip:", found)
        for cmd in ["git stash list", "git stash show -p", "git -C x stash list"]:
            with self.subTest(cmd=cmd):
                self.assertIsNone(reason(cmd))

    def test_allowed_everyday_work(self):
        for cmd in [
            "git status && git diff --stat",
            "git merge --no-ff --no-commit feat/x",
            "git merge --abort",
            "git worktree add .worktrees/m5 -b feat/m5",
            "git worktree remove .worktrees/m5",
            "git branch -d feat/m5",
            "git push origin main",
            "git push -u origin feat/x",
            "git rebase --abort",
            "git reset --soft HEAD~1",
            "rm -rf node_modules dist",
            "rm -f /private/tmp/claude-501/x/scratch.txt",
            "rm -rf $TMPDIR/probe",
            "find . -name '*.pyc' -delete",
            "rm -rf /repo/.studio/qa/M5-03",
            "git -C .worktrees/m5 status",
            "cat docs/studio/VERFASSUNG.md",
            "cp docs/studio/VERFASSUNG.md /tmp/v.md",
            "cat > notes.md <<'EOF'\ngit push --force\nrm -rf /\nEOF",
            'git commit -m "docs: nie git reset --hard"',
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNone(reason(cmd))

    def test_forbidden_irreversible(self):
        for cmd in [
            "git push --force origin main",
            "git push -f",
            "git push -fu origin x",
            "git push --force-with-lease",
            "git push origin +main",
            "git push origin :feat/x",
            "git push origin --delete feat/x",
            "git -C /repo push --mirror",
            "git branch -D feat/x",
            "git branch -df feat/x",
            "git rebase main",
            "git reset --hard origin/main",
            "git filter-branch --tree-filter x",
            "git filter-repo --path x",
            "git reflog expire --all",
            "git stash clear",
            "git clean -fdx",
            "git worktree remove --force .worktrees/x",
            "rm -rf ~/Documents",
            "rm -rf /Users/x/other",
            "rm -rf ../other-repo",
            "cd /tmp && rm -r $HOME/x",
            "find /Users/x -name y -delete",
            "echo ok; git push --force",
            "git -C .worktrees/m5 reset --hard",
            "git -c core.x=1 push --force",
            "bash -c 'git push --force'",
            'sh -c "rm -rf ~/x"',
            "git status\ngit branch -D x",
            "claude -p 'VERFASSUNG ÄNDERN'",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNotNone(reason(cmd))

    def test_constitution_bash(self):
        for cmd in [
            "echo x > docs/studio/VERFASSUNG.md",
            "sed -i '' 's/a/b/' docs/studio/VERFASSUNG.md",
            "tee docs/studio/VERFASSUNG.md < x",
            "git checkout -- docs/studio/VERFASSUNG.md",
            "mv x docs/studio/VERFASSUNG.md",
            "rm docs/studio/VERFASSUNG.md",
            "touch .studio/verfassung-ok/s1",
            "echo x >> tools/studio/guard.py",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNotNone(reason(cmd))
                self.assertIsNone(reason(cmd, allow=True))

    def test_kill_by_name_forbidden(self):
        """R263, R303: fremde Prozesse nie per Namen beenden, eigene nur per PID."""
        for cmd in [
            "pkill -f 'vitest run'",
            "pkill vite",
            "killall node",
            "sudo pkill -9 chrome",
            "timeout 5 killall -m perf",
            "echo x && pkill -f perf.mjs",
            "bash -c 'pkill -f mess.sh'",
            "/usr/bin/pkill -f x",
            "ls | xargs pkill",
            "ls | xargs -n1 killall",
            "nice pkill x",
            "find . -exec killall x \\;",
            "ssh h pkill x",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNotNone(reason(cmd))
                self.assertIsNotNone(reason(cmd, allow=True))
        for cmd in [
            "kill 42157",
            "kill -TERM 123 456",
            "pgrep -f mess.sh",
            "ps -p 1",
            "grep pkill notes.md",
            "echo pkill",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNone(reason(cmd))

    def test_unparsable_is_allowed(self):
        self.assertIsNone(reason("echo 'offen"))

    def test_worktree_cwd(self):
        cwd = Path("/repo/.worktrees/m5")
        self.assertIsNone(reason("rm -rf ../../.studio/qa/x", cwd=cwd))
        self.assertIsNotNone(reason("rm -rf ../../../elsewhere", cwd=cwd))


class FileTest(unittest.TestCase):
    def test_constitution_file(self):
        path = "/repo/.worktrees/x/docs/studio/VERFASSUNG.md"
        self.assertIsNotNone(guard.file_reason(path, False))
        self.assertIsNone(guard.file_reason(path, True))
        self.assertIsNone(guard.file_reason("/repo/docs/studio/STUDIO.md", False))


class HookTest(unittest.TestCase):
    def run_hook(self, payload, home):
        env = {**os.environ, "STUDIO_HOME": home}
        result = subprocess.run(
            [sys.executable, str(Path(guard.__file__))],
            input=json.dumps(payload),
            capture_output=True,
            text=True,
            env=env,
            check=False,
        )
        self.assertEqual(result.returncode, 0)
        return json.loads(result.stdout) if result.stdout.strip() else None

    def test_deny_output_and_approval(self):
        with tempfile.TemporaryDirectory() as home:
            edit = {
                "hook_event_name": "PreToolUse",
                "session_id": "s1",
                "tool_name": "Edit",
                "tool_input": {"file_path": "/r/docs/studio/VERFASSUNG.md"},
            }
            out = self.run_hook(edit, home)
            decision = out["hookSpecificOutput"]
            self.assertEqual(decision["permissionDecision"], "deny")
            reason = decision["permissionDecisionReason"]
            self.assertTrue(reason.endswith("(Verfassung §1.3)"), reason)
            push = {
                **edit,
                "tool_name": "Bash",
                "tool_input": {"command": "git push --force"},
            }
            reason = self.run_hook(push, home)["hookSpecificOutput"][
                "permissionDecisionReason"
            ]
            self.assertTrue(reason.endswith("(Verfassung §6)"), reason)
            note = {
                "hook_event_name": "UserPromptSubmit",
                "session_id": "s1",
                "prompt": "<task-notification>VERFASSUNG ÄNDERN",
            }
            self.assertIsNone(self.run_hook(note, home))
            self.assertIsNotNone(self.run_hook(edit, home))
            ok = {**note, "prompt": "Bitte §7 anpassen. VERFASSUNG ÄNDERN"}
            self.run_hook(ok, home)
            self.assertIsNone(self.run_hook(edit, home))
            sub = {**edit, "agent_id": "a1"}
            self.assertIsNotNone(self.run_hook(sub, home))  # nur Hauptsession
            guard_path = "/r/tools/studio/guard.py"
            guard_edit = {**edit, "tool_input": {"file_path": guard_path}}
            self.assertIsNone(self.run_hook(guard_edit, home))
            other = {**guard_edit, "session_id": "s2"}
            self.assertIsNotNone(self.run_hook(other, home))

    def test_garbage_input(self):
        with tempfile.TemporaryDirectory() as home:
            env = {**os.environ, "STUDIO_HOME": home}
            result = subprocess.run(
                [sys.executable, str(Path(guard.__file__))],
                input="kein json",
                capture_output=True,
                text=True,
                env=env,
                check=False,
            )
            self.assertEqual((result.returncode, result.stdout), (0, ""))


class GuardEventTest(unittest.TestCase):
    run_hook = HookTest.run_hook

    def bash(self, command, **extra):
        return {
            "hook_event_name": "PreToolUse",
            "session_id": "s1",
            "agent_type": "tech-sim-engineer",
            "tool_name": "Bash",
            "tool_input": {"command": command},
            **extra,
        }

    def events(self, home):
        path = Path(home) / "events.jsonl"
        if not path.exists():
            return []
        return [json.loads(line) for line in path.read_text("utf-8").splitlines()]

    def test_deny_writes_one_event(self):
        with tempfile.TemporaryDirectory() as home:
            out = self.run_hook(self.bash("git stash push -m x"), home)
            self.assertEqual(out["hookSpecificOutput"]["permissionDecision"], "deny")
            events = self.events(home)
            self.assertEqual(len(events), 1)
            event = events[0]
            self.assertEqual(event["kind"], "guard_block")
            self.assertEqual(event["source"], "hook")
            self.assertEqual(event["rule"], "stash")
            self.assertEqual(event["tool"], "Bash")
            self.assertEqual(event["command"], "git stash push -m x")
            self.assertEqual(event["persona"], "tech-sim-engineer")
            self.assertEqual(event["session_id"], "s1")
            self.assertTrue(event["summary"].startswith(guard.FORBIDDEN))

    def test_allowed_writes_nothing(self):
        with tempfile.TemporaryDirectory() as home:
            self.assertIsNone(self.run_hook(self.bash("git status"), home))
            self.assertEqual(self.events(home), [])
            prompt = {"hook_event_name": "UserPromptSubmit", "session_id": "s1"}
            self.run_hook({**prompt, "prompt": "git stash"}, home)
            self.assertEqual(self.events(home), [])

    def test_long_command_is_shortened_to_one_line(self):
        with tempfile.TemporaryDirectory() as home:
            command = "git stash push -m " + "x" * 300 + "\necho zwei"
            self.run_hook(self.bash(command), home)
            shown = self.events(home)[0]["command"]
            self.assertEqual(len(shown), 160)
            self.assertNotIn("\n", shown)

    def test_file_tool_and_agent_command_fields(self):
        with tempfile.TemporaryDirectory() as home:
            edit = {
                "hook_event_name": "PreToolUse",
                "session_id": "s1",
                "tool_name": "Edit",
                "tool_input": {"file_path": "/r/docs/studio/VERFASSUNG.md"},
            }
            self.run_hook(edit, home)
            event = self.events(home)[0]
            self.assertEqual(event["rule"], "constitution")
            self.assertEqual(event["command"], "/r/docs/studio/VERFASSUNG.md")
            self.assertEqual(event["persona"], "")

    def test_write_failure_keeps_deny(self):
        with tempfile.TemporaryDirectory() as home:
            (Path(home) / "events.jsonl").mkdir()
            out = self.run_hook(self.bash("git stash"), home)
            self.assertEqual(out["hookSpecificOutput"]["permissionDecision"], "deny")

    def test_rule_of(self):
        cases = {
            f"{guard.FORBIDDEN}: git stash push" + guard.STASH_HINT: "stash",
            f"{guard.FORBIDDEN}: git push --force": "force-push",
            f"{guard.FORBIDDEN}: git push mit Refspec +x": "force-push",
            f"{guard.FORBIDDEN}: git rebase": "rebase",
            f"{guard.FORBIDDEN}: git pull --rebase": "rebase",
            f"{guard.FORBIDDEN}: git reset --hard": "reset-hard",
            f"{guard.FORBIDDEN}: Löschen ausserhalb des Repos (/x)": "delete",
            guard.PROTECTED: "constitution",
            guard.MODEL_MISSING: "model",
            guard.KILL_BY_NAME_REASON: "kill-by-name",
            "etwas ganz anderes": "other",
        }
        for found, rule in cases.items():
            with self.subTest(found=found):
                self.assertEqual(guard.rule_of(found), rule)


class FixRoundTest(unittest.TestCase):
    def test_allowed(self):
        for cmd in [
            'D=/tmp/probe; rm -rf "$D"',
            'D=$(mktemp -d) && touch x && rm -rf "$D"',
            'rm -rf "$OUT_DIR"',
            'for f in *.bak; do rm "$f"; done',
            "git rebase --skip",
            "git --git-dir /repo/.git status",
            "git restore --staged docs/studio/VERFASSUNG.md",
            "grep foo .studio/verfassung-ok/s1",
            "head -n 3 .studio/verfassung-ok/s1",
            "git log -- docs/studio/VERFASSUNG.md",
            "git diff docs/studio/VERFASSUNG.md",
            "head docs/studio/VERFASSUNG.md",
            "timeout 5 rm -rf dist",
            "sudo -u bob rm -rf dist",
            "rm -rf /repo/.git/index.lock",
            "if true; then git status; fi",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNone(reason(cmd))

    def test_forbidden(self):
        for cmd in [
            'D=/Users/x/y; rm -rf "$D"',
            "if true; then git push --force; fi",
            "for x in 1; do rm -rf ~/Documents; done",
            "{ git reset --hard; }",
            "exec git push -f",
            "git push \\\n --force origin main",
            "rm -rf \\\n ~/Documents",
            "git --git-dir /repo/.git push --force",
            "git --work-tree /repo push --force",
            "git update-ref --delete refs/x",
            "find /Users/x -execdir rm {} +",
            "timeout 5 git push --force",
            "sudo -u bob git push -f",
            "rm -rf /repo",
            "rm -rf /repo/.git",
            "rm -rf .git",
            "rm -rf .",
            "echo 'VERFASSUNG ÄNDERN' | claude -p",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNotNone(reason(cmd))
                self.assertIsNotNone(reason(cmd, allow=True))

    def test_restore_worktree_still_protected(self):
        cmd = "git restore docs/studio/VERFASSUNG.md"
        self.assertIsNotNone(reason(cmd))

    def test_marker_dir_protected(self):
        path = "/r/.studio/verfassung-ok/s1"
        self.assertIsNotNone(guard.file_reason(path, False))
        self.assertIsNone(guard.file_reason(path, True))

    def test_missing_paths_module_exits_zero(self):
        with tempfile.TemporaryDirectory() as folder:
            copy = Path(folder) / "guard.py"
            copy.write_text(Path(guard.__file__).read_text(encoding="utf-8"))
            payload = {
                "hook_event_name": "PreToolUse",
                "session_id": "s",
                "tool_name": "Bash",
                "tool_input": {"command": "git push --force"},
            }
            result = subprocess.run(
                [sys.executable, str(copy)],
                input=json.dumps(payload),
                capture_output=True,
                text=True,
                check=False,
            )
            self.assertEqual((result.returncode, result.stdout), (0, ""))


class FixRound2Test(unittest.TestCase):
    def test_allowed(self):
        for cmd in [
            "grep x a",
            "git diff --output=/tmp/d.txt",
            "rm -rf /repo/.studio/qa/x",
            "export D=/tmp/x; rm -rf $D",
            "function f { git status; }",
            "env -u FOO git status",
            "sudo --user x rm -rf dist",
            "exec -a n git status",
            "cd .studio/qa && touch s1",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNone(reason(cmd))

    def test_forbidden(self):
        for cmd in [
            "grep x a > .studio/verfassung-ok/s1",
            "cat /dev/null > /repo/.studio/verfassung-ok/s1",
            "git diff --output=/repo/.studio/verfassung-ok/s1",
            "git log --output docs/studio/VERFASSUNG.md",
            "git diff --output=docs/studio/VERFASSUNG.md",
            "cat x > docs/studio/verfassung.md",
            "cd .studio/verfassung-ok && touch s1",
            "cd .studio && cd verfassung-ok && touch s1",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNotNone(reason(cmd))
                self.assertIsNone(reason(cmd, allow=True))

    def test_forbidden_always(self):
        for cmd in [
            'export D=/Users/x/y; rm -rf "$D"',
            "declare -x D=/Users/x/y; rm -rf $D",
            "local D=/Users/x/y; rm -rf $D",
            "readonly D=/Users/x/y; rm -rf $D",
            "typeset D=/Users/x/y && rm -rf $D",
            "rm -rf ~bob/x",
            'rm -rf "${UNKNOWN}/x"',
            "find .git -delete",
            "find /repo/.git -exec rm {} +",
            "function f { git push --force; }",
            "env -u FOO git push --force",
            "sudo --user x git push -f",
            "exec -a n git push -f",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNotNone(reason(cmd, allow=True))

    def test_file_reason_normalized(self):
        for path in [
            "/r/docs/studio/../studio/VERFASSUNG.md",
            "/r/docs/studio/verfassung.md",
            "/r/.studio/x/../verfassung-ok/s1",
        ]:
            with self.subTest(path=path):
                self.assertIsNotNone(guard.file_reason(path, False))


class FixRound3Test(unittest.TestCase):
    def test_allowed(self):
        for cmd in [
            "echo x > a-verfassung.md",
            "rm -rf build/$X",
            'rm -rf "$NOPE"',
            "D=/Users/x; D=$(mktemp -d); rm -rf $D",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNone(reason(cmd))

    def test_forbidden(self):
        for cmd in [
            "touch .studio/Verfassung-OK/s1",
            "mkdir -p .studio/VERFASSUNG-OK && touch .studio/VERFASSUNG-OK/s1",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNotNone(reason(cmd))
                self.assertIsNone(reason(cmd, allow=True))
        for cmd in ["rm -rf $NOPE/Users", 'rm -rf "$NOPE"/']:
            with self.subTest(cmd=cmd):
                self.assertIsNotNone(reason(cmd, allow=True))

    def test_constitution_in_docs_studio(self):
        cwd = Path("/repo/docs/studio")
        self.assertIsNotNone(reason("echo x > VERFASSUNG.md", cwd=cwd))
        self.assertIsNone(reason("echo x > VERFASSUNG.md", allow=True, cwd=cwd))


class PullRebaseTest(unittest.TestCase):
    """N-92: `git pull --rebase` und Rebase-Konfiguration sind Rebase (Verfassung §6.3)."""

    def test_allowed(self):
        for cmd in [
            "git pull --ff-only",
            "git pull --no-rebase origin main",
            "git pull --rebase=false",
            "git pull",
            "git config pull.rebase false",
            "git config --get pull.rebase",
            "git config pull.ff only",
            "git pull -Xours",
            "git pull -Xtheirs origin main",
            "git pull -s recursive -X ours",
            "git pull -v",
            "git -c core.editor=vim pull",
            "git -c pull.rebase=false pull",
            "git config --unset pull.rebase",
            "git config set pull.rebase false",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNone(reason(cmd))

    def test_forbidden(self):
        for cmd in [
            "git pull --rebase",
            "git pull -r",
            "git pull -r origin main",
            "git pull -rv",
            "git pull -vr",
            "git config set pull.rebase true",
            "git -cpull.rebase=true pull",
            "git pull --rebase=merges",
            "git pull --rebase=interactive origin main",
            "git -C /repo pull --rebase",
            "git -c pull.rebase=true pull",
            "git config pull.rebase true",
            "git config --global pull.rebase true",
            "git config branch.main.rebase true",
            "git config rebase.autoStash true && git pull --rebase",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNotNone(reason(cmd))
                self.assertIsNotNone(reason(cmd, allow=True))


class PersonaModelTest(unittest.TestCase):
    """N-93: Persona-Start als general-purpose braucht `model` (R167)."""

    def payload(self, **tool_input):
        return {"tool_name": "Agent", "tool_input": tool_input}

    def decide(self, payload):
        return guard.decide(payload, ROOT, Path("/nope"), ENV)

    def test_forbidden_without_model(self):
        prompt = "Persona: design-genre-researcher\nPaket: X\n..."
        for tool_input in [
            {"subagent_type": "general-purpose", "prompt": prompt},
            {"prompt": prompt},
            {"subagent_type": "general-purpose", "prompt": prompt, "model": ""},
        ]:
            with self.subTest(tool_input=tool_input):
                found = self.decide(self.payload(**tool_input))
                self.assertIsNotNone(found)
                self.assertIn("model", found)
        task = {"tool_name": "Task", "tool_input": {"prompt": prompt}}
        self.assertIsNotNone(self.decide(task))

    def test_allowed(self):
        prompt = "Persona: design-genre-researcher\nPaket: X"
        for tool_input in [
            {"subagent_type": "general-purpose", "prompt": prompt, "model": "sonnet"},
            {"subagent_type": "lead-art", "prompt": prompt},
            {"subagent_type": "general-purpose", "prompt": "Suche X im Repo"},
            {"subagent_type": "Explore", "prompt": prompt},
            {"subagent_type": "general-purpose", "prompt": "Persona:\n\nkeine Rolle"},
        ]:
            with self.subTest(tool_input=tool_input):
                self.assertIsNone(self.decide(self.payload(**tool_input)))

    def test_deny_text_cites_ruling(self):
        found = self.decide(self.payload(prompt="Persona: x"))
        text = guard.deny_text(found)
        self.assertIn("R167", text)
        self.assertNotIn("Verfassung §6", text)


class RedactTest(unittest.TestCase):
    """Secrets werden vor dem Kürzen aus dem protokollierten Befehl geschwärzt."""

    def shown(self, command):
        return guard._shown_command(
            {"tool_name": "Bash", "tool_input": {"command": command}}
        )

    def assertRedacted(self, command, secret):
        out = self.shown(command)
        self.assertNotIn(secret, out)
        self.assertIn("[REDACTED]", out)
        return out

    def test_github_tokens(self):
        for prefix in ("ghp_", "gho_", "ghu_", "ghs_", "ghr_"):
            secret = prefix + "x" * 36
            out = self.assertRedacted(f"git push https://x/{secret} now", secret)
            self.assertTrue(out.startswith("git push"))
            self.assertTrue(out.endswith(" now"))

    def test_github_pat(self):
        secret = "github_pat_" + "A1b2" * 10
        self.assertRedacted(f"export T={secret}", secret)

    def test_sk_tokens(self):
        for secret in ("sk-" + "x" * 30, "sk-ant-" + "x" * 30):
            self.assertRedacted(f"curl -H key:{secret} host", secret)

    def test_slack_tokens(self):
        for secret in ("xoxb-" + "1" * 12 + "-abc", "xoxp-" + "1" * 12 + "-abc"):
            self.assertRedacted(f"echo {secret}", secret)

    def test_aws_key(self):
        secret = "AKIA" + "ABCD1234" * 2
        self.assertRedacted(f"aws --key {secret}", secret)

    def test_bearer(self):
        out = self.assertRedacted(
            "curl -H 'Authorization: Bearer abc123.def-456' host", "abc123"
        )
        self.assertIn("Bearer", out)

    def test_token_flag(self):
        self.assertRedacted("tool --token=geheim123 run", "geheim123")
        self.assertRedacted("tool --token geheim123 run", "geheim123")
        self.assertIn("run", self.shown("tool --token geheim123 run"))

    def test_key_value_assignments(self):
        for name in ("password", "PASSWORD", "passwd", "secret", "api_key", "Api_Key"):
            self.assertRedacted(f"run {name}=geheim123 --x", "geheim123")

    def test_attached_p_password(self):
        self.assertRedacted("mysql -u root -pgeheim db", "geheim")
        self.assertEqual(self.shown("mysql -p db"), "mysql -p db")
        self.assertEqual(self.shown("git log -p"), "git log -p")

    def test_url_credentials(self):
        out = self.assertRedacted(
            "git clone https://alice:geheim@host.example/r.git", "geheim"
        )
        self.assertIn("host.example/r.git", out)
        self.assertEqual(
            self.shown("git clone https://host.example/r.git"),
            "git clone https://host.example/r.git",
        )

    def test_harmless_unchanged(self):
        for command in ("git status", "ls -la src", "npm run build", "ls -a  -l"):
            self.assertEqual(self.shown(command), " ".join(command.split()))

    def test_redact_before_truncate(self):
        secret = "ghp_" + "x" * 36
        command = "a" * 145 + " " + secret
        out = self.assertRedacted(command, secret)
        self.assertNotIn("ghp_", out)
        self.assertNotIn("xxxx", out)
        self.assertLessEqual(len(out), guard.COMMAND_LIMIT)


class RedactHardeningTest(unittest.TestCase):
    """Unter-Schwärzung ist inakzeptabel, Über-Schwärzung hinnehmbar."""

    shown = RedactTest.shown
    assertRedacted = RedactTest.assertRedacted

    def test_curl_user(self):
        for cmd in (
            "curl -u alice:geheim123 host",
            "curl --user alice:geheim123 host",
            "curl --user=alice:geheim123 host",
            "curl -u 'alice:geheim123' host",
        ):
            self.assertRedacted(cmd, "geheim123")
            self.assertTrue(self.shown(cmd).endswith("host"))
        self.assertEqual(
            self.shown("git push -u origin main"), "git push -u origin main"
        )

    def test_authorization_header(self):
        cases = (
            ("curl -H 'Authorization: Basic Zm9vOmJhcg==' h", "Zm9vOmJhcg=="),
            ('curl -H "authorization: Token geheim123" h', "geheim123"),
            ("curl -H 'AUTHORIZATION: Bearer geheim123' h", "geheim123"),
            ("curl -H 'Authorization: Basic geheim123' h", "geheim123"),
        )
        for cmd, secret in cases:
            out = self.assertRedacted(cmd, secret)
            self.assertTrue(out.endswith(" h"))

    def test_key_value_case_insensitive(self):
        for name in ("token", "TOKEN", "Api_Key", "SECRET", "Password"):
            self.assertRedacted(f"run {name}=geheim123 x", "geheim123")

    def test_env_assignments(self):
        for name in ("GITHUB_TOKEN", "AWS_SECRET", "MY_KEY", "DB_PASSWORD"):
            out = self.assertRedacted(f"{name}=geheim123 npm run build", "geheim123")
            self.assertTrue(out.endswith("npm run build"))

    def test_quoted_values(self):
        cases = (
            ("mysql -p 'geheim 123' db", "geheim"),
            ('mysql -p "geheim 123" db', "geheim"),
            ("mysql -p'geheim 123' db", "geheim"),
            ('tool --password "geheim 123" go', "geheim"),
            ("tool password='geheim 123' go", "geheim"),
            ("tool --token 'geheim 123' go", "geheim"),
            ('tool --token="geheim 123" go', "geheim"),
        )
        for cmd, secret in cases:
            out = self.assertRedacted(cmd, secret)
            self.assertNotIn("123", out)
            self.assertTrue(out.split()[-1] in ("db", "go"), out)

    def test_p_flag_unchanged(self):
        self.assertEqual(self.shown("mysql -p db"), "mysql -p db")
        self.assertEqual(self.shown("git log -p"), "git log -p")

    def test_word_boundary_for_prefixes(self):
        harmless = "run task-" + "x" * 30 + " and mygh_" + "y" * 30
        self.assertEqual(self.shown(harmless), harmless)
        self.assertRedacted("run sk-" + "x" * 30, "sk-xxx")
        self.assertRedacted("run (ghp_" + "x" * 36 + ")", "ghp_")


class RedactReviewTest(unittest.TestCase):
    """Review-Nachträge: Doppelpunkt-Form, -uuser:pw, apikey, weitere Präfixe."""

    shown = RedactTest.shown
    assertRedacted = RedactTest.assertRedacted

    def test_colon_form(self):
        cases = (
            ("echo password: hunter2 x", "hunter2"),
            ("echo SECRET: hunter2 x", "hunter2"),
            ("echo token: hunter2 x", "hunter2"),
            ("echo api_key: hunter2 x", "hunter2"),
            ("echo passwd: hunter2 x", "hunter2"),
            ('echo {"password": "hunter2 x"} y', "hunter2"),
            ('echo \'{"secret": "hunter2"}\' y', "hunter2"),
            ("curl -H 'X-API-Key: hunter2' h", "hunter2"),
        )
        for cmd, secret in cases:
            out = self.assertRedacted(cmd, secret)
            self.assertNotIn("hunter2 x", out)

    def test_u_attached(self):
        self.assertRedacted("curl -uuser:geheim123 h", "geheim123")
        self.assertRedacted("curl -u'user:geheim123' h", "geheim123")

    def test_apikey_variants(self):
        for cmd in (
            "run apikey=geheim123 x",
            "run api-key=geheim123 x",
            "run --apikey geheim123 x",
            "run --api-key geheim123 x",
            "run --secret-key geheim123 x",
            "run --pass geheim123 x",
            "run --passwd geheim123 x",
            "run --api-key 'geheim 123' x",
        ):
            out = self.assertRedacted(cmd, "geheim")
            self.assertTrue(out.endswith(" x"), out)

    def test_more_prefixes(self):
        for secret in (
            "xoxa-" + "1" * 12,
            "xoxs-" + "1" * 12,
            "xapp-" + "1" * 12 + "-abc",
            "glpat-" + "x" * 20,
            "sk_live_" + "x" * 20,
            "sk_test_" + "x" * 20,
        ):
            self.assertRedacted(f"echo {secret} end", secret)

    def test_harmless_unchanged(self):
        for cmd in (
            "git push -u origin main",
            "echo keyboard=3",
            "python tokenizer.py",
            "ls -la",
            "git commit -m 'fix: token handling'",
            "npm run build --silent",
            "git log --pretty=format:%h",
            "git push origin main:main",
        ):
            self.assertEqual(self.shown(cmd), cmd)

    def test_no_redos(self):
        import time

        size = 500_000
        inputs = (
            "a-" * (size // 2),
            "-u " * (size // 3),
            "token " * (size // 6),
            'password=" ' * (size // 11),
            "--a-" * (size // 4),
            "sk-" * (size // 3),
            "password" * (size // 8),
            "x: " * (size // 3),
        )
        for text in inputs:
            start = time.perf_counter()
            guard.redact(text)
            self.assertLess(time.perf_counter() - start, 1.0, text[:20])
