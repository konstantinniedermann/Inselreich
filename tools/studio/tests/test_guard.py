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
            "sh -c \"rm -rf ~/x\"",
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
            "export D=/Users/x/y; rm -rf \"$D\"",
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
