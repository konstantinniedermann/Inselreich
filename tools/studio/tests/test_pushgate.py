import io
import json
import os
import subprocess
import sys
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path
from unittest import mock

import pushgate


def git(cwd, *args):
    env = {
        **os.environ,
        "GIT_AUTHOR_NAME": "t",
        "GIT_AUTHOR_EMAIL": "t@t",
        "GIT_COMMITTER_NAME": "t",
        "GIT_COMMITTER_EMAIL": "t@t",
    }
    done = subprocess.run(
        ["git", *args], cwd=cwd, env=env, capture_output=True, text=True, check=True
    )
    return done.stdout.strip()


class GateCase(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        base = Path(tmp.name)
        self.repo = base / "repo"
        self.repo.mkdir()
        git(self.repo, "init", "-b", "main")
        git(self.repo, "commit", "--allow-empty", "-m", "eins")
        self.head = git(self.repo, "rev-parse", "HEAD")
        self.home = base / "studio"
        self.home.mkdir()
        patcher = mock.patch.dict(os.environ, {"STUDIO_HOME": str(self.home)})
        patcher.start()
        self.addCleanup(patcher.stop)

    def event(self, head, code, kind="push_check"):
        line = json.dumps({"kind": kind, "head": head, "exit": code})
        with open(self.home / "events.jsonl", "a", encoding="utf-8") as handle:
            handle.write(line + "\n")

    def reason(self, command, agent_id=None):
        payload = {"tool_name": "Bash", "tool_input": {"command": command}}
        if agent_id:
            payload["agent_id"] = agent_id
        return pushgate.bash_reason(payload, str(self.repo))


class DecisionTest(GateCase):
    def test_exit_zero_allows(self):
        self.event(self.head, 0)
        self.assertIsNone(self.reason("git push origin HEAD:main"))

    def test_other_exits_or_missing_event_deny(self):
        self.assertIsNotNone(self.reason("git push origin HEAD:main"))
        for code in (1, 2):
            with self.subTest(code=code):
                self.event(self.head, code)
                text = self.reason("git push origin HEAD:main")
                self.assertIn(f"Exit {code}", text)
                self.assertIn(self.head[:7], text)

    def test_event_for_other_hash_denies(self):
        self.event("a" * 40, 0)
        self.assertIsNotNone(self.reason("git push origin HEAD:main"))

    def test_last_event_for_same_hash_wins(self):
        self.event(self.head, 1)
        self.event(self.head, 0)
        self.assertIsNone(self.reason("git push origin HEAD:main"))
        self.event(self.head, 1)
        self.assertIsNotNone(self.reason("git push origin HEAD:main"))

    def test_broken_lines_and_other_kinds_are_skipped(self):
        self.event(self.head, 0)
        self.event(self.head, 1, kind="other")
        with open(self.home / "events.jsonl", "a", encoding="utf-8") as handle:
            handle.write("{kaputt\n")
        self.assertIsNone(self.reason("git push origin HEAD:main"))


class TargetTest(GateCase):
    def test_main_forms_are_checked(self):
        short = self.head[:7]
        for command in (
            "git push origin HEAD:main",
            "git push origin HEAD:refs/heads/main",
            f"git push origin {short}:main",
            f"git -C {self.repo} push origin {short}:main",
            "git push -u --no-verify origin main",
            "git push origin main",
            "git push origin HEAD~0:main",
        ):
            with self.subTest(command=command):
                self.assertIsNotNone(self.reason(command))

    def test_resolved_forms_pass_with_event(self):
        self.event(self.head, 0)
        for command in (
            "git push origin HEAD:main",
            "git push origin HEAD:refs/heads/main",
            f"git push origin {self.head[:7]}:main",
            f"git -C {self.repo} push origin {self.head[:7]}:main",
            "git push origin HEAD~0:main",
            "git push origin main",
        ):
            with self.subTest(command=command):
                self.assertIsNone(self.reason(command))

    def test_other_branch_allowed(self):
        self.assertIsNone(self.reason("git push origin feat/x"))
        self.assertIsNone(self.reason("git push origin HEAD:feat/x"))

    def test_without_refspec_depends_on_current_branch(self):
        self.assertIsNotNone(self.reason("git push"))
        git(self.repo, "checkout", "-b", "feat/x")
        self.assertIsNone(self.reason("git push"))
        self.assertIsNone(self.reason("git push -u origin"))

    def test_compound_command_is_checked(self):
        self.assertIsNotNone(self.reason("make push-check; git push origin HEAD:main"))

    def test_text_is_not_a_command(self):
        self.assertIsNone(self.reason('echo "git push origin main"'))

    def test_unresolvable_hash_denies(self):
        text = self.reason("git push origin nichtda:main")
        self.assertIn("nicht auflösbar", text)

    def test_no_push_is_ignored(self):
        self.assertIsNone(self.reason("git status"))
        self.assertIsNone(self.reason("make push-check"))


class MainTest(GateCase):
    def run_main(self, command):
        payload = {
            "hook_event_name": "PreToolUse",
            "tool_name": "Bash",
            "tool_input": {"command": command},
            "cwd": str(self.repo),
            "session_id": "s",
        }
        out = io.StringIO()
        with (
            mock.patch.object(sys, "stdin", io.StringIO(json.dumps(payload))),
            redirect_stdout(out),
        ):
            code = pushgate.main()
        return code, out.getvalue()

    def test_deny_json_and_block_event(self):
        code, out = self.run_main("git push origin HEAD:main")
        self.assertEqual(code, 0)
        data = json.loads(out)["hookSpecificOutput"]
        self.assertEqual(data["permissionDecision"], "deny")
        self.assertIn("push-check", data["permissionDecisionReason"])
        events = (self.home / "events.jsonl").read_text(encoding="utf-8")
        self.assertIn('"rule":"push-gate"', events)

    def test_allowed_prints_nothing(self):
        self.event(self.head, 0)
        self.assertEqual(self.run_main("git push origin HEAD:main"), (0, ""))

    def test_garbage_input_allows(self):
        with mock.patch.object(sys, "stdin", io.StringIO("kein json")):
            self.assertEqual(pushgate.main(), 0)


class ApprovalTest(GateCase):
    def approve(self, text):
        (self.home / "push-freigabe").write_text(text, encoding="utf-8")

    def kinds(self):
        lines = (self.home / "events.jsonl").read_text(encoding="utf-8").splitlines()
        return [json.loads(line) for line in lines]

    def test_short_hash_allows_and_is_consumed(self):
        self.approve(f"{self.head[:7]} R900 Hotfix\n")
        self.assertIsNone(self.reason("git push origin HEAD:main"))
        self.assertFalse((self.home / "push-freigabe").exists())
        used = [e for e in self.kinds() if e["kind"] == "push_freigabe"]
        self.assertEqual(used[0]["head"], self.head)
        self.assertIn("R900", used[0]["reason"])
        self.assertTrue(used[0]["used"])

    def test_second_push_of_same_hash_is_denied(self):
        self.approve(f"{self.head} R900\n")
        self.assertIsNone(self.reason("git push origin HEAD:main"))
        self.assertIsNotNone(self.reason("git push origin HEAD:main"))

    def test_other_hash_or_broken_file_has_no_effect(self):
        for text in ("a" * 40 + " R1\n", "", "kaputt\n", f"{self.head[:6]} zu kurz\n"):
            with self.subTest(text=text):
                self.approve(text)
                self.assertIsNotNone(self.reason("git push origin HEAD:main"))
                self.assertTrue((self.home / "push-freigabe").exists())

    def test_passing_check_does_not_consume_approval(self):
        self.event(self.head, 0)
        self.approve(f"{self.head} R900\n")
        self.assertIsNone(self.reason("git push origin HEAD:main"))
        self.assertTrue((self.home / "push-freigabe").exists())

    def test_delete_failure_still_allows(self):
        self.approve(f"{self.head} R900\n")
        with mock.patch.object(Path, "unlink", side_effect=OSError):
            self.assertIsNone(self.reason("git push origin HEAD:main"))
        used = [e for e in self.kinds() if e["kind"] == "push_freigabe"]
        self.assertFalse(used[0]["used"])


class SelfProtectionTest(GateCase):
    def protect(self, tool, data, agent_id=None):
        payload = {"tool_name": tool, "tool_input": data}
        if agent_id:
            payload["agent_id"] = agent_id
        return pushgate.protect_reason(payload)

    def test_agent_naming_the_file_in_bash_is_denied(self):
        found = self.protect(
            "Bash", {"command": "echo x > .studio/push-freigabe"}, agent_id="a1"
        )
        self.assertIn("nur L0", found)
        self.assertIn("kein Schutz gegen Absicht", found)

    def test_agent_writing_the_file_is_denied(self):
        for tool in ("Write", "Edit", "MultiEdit"):
            with self.subTest(tool=tool):
                data = {"file_path": "/x/.studio/push-freigabe"}
                self.assertIsNotNone(self.protect(tool, data, agent_id="a1"))

    def test_l0_without_agent_id_may_write(self):
        data = {"command": "echo x > .studio/push-freigabe"}
        self.assertIsNone(self.protect("Bash", data))
        self.assertIsNone(self.protect("Write", {"file_path": "a/push-freigabe"}))

    def test_unrelated_agent_calls_pass(self):
        self.assertIsNone(self.protect("Bash", {"command": "ls"}, agent_id="a1"))

    def test_main_denies_agent_write_even_for_non_bash_tools(self):
        payload = {
            "hook_event_name": "PreToolUse",
            "tool_name": "Write",
            "tool_input": {"file_path": ".studio/push-freigabe"},
            "agent_id": "a1",
            "cwd": str(self.repo),
        }
        out = io.StringIO()
        with (
            mock.patch.object(sys, "stdin", io.StringIO(json.dumps(payload))),
            redirect_stdout(out),
        ):
            pushgate.main()
        data = json.loads(out.getvalue())["hookSpecificOutput"]
        self.assertEqual(data["permissionDecision"], "deny")


class RegistrationTest(unittest.TestCase):
    def test_settings_register_pushgate_and_keep_guard(self):
        root = Path(__file__).resolve().parents[3]
        settings = json.loads((root / ".claude/settings.json").read_text("utf-8"))
        entries = settings["hooks"]["PreToolUse"]
        commands = {
            hook["command"]: entry["matcher"]
            for entry in entries
            for hook in entry["hooks"]
        }
        gate = [c for c in commands if "pushgate.py" in c]
        self.assertEqual(len(gate), 1)
        self.assertEqual(commands[gate[0]], "Bash|Write|Edit|MultiEdit")
        self.assertTrue(any("guard.py" in c and "pushgate" not in c for c in commands))


class ReviewFixTest(GateCase):
    def other_repo(self, branch="feat/x"):
        other = self.repo.parent / "other"
        other.mkdir(exist_ok=True)
        git(other, "init", "-b", branch)
        git(other, "commit", "--allow-empty", "-m", "zwei")
        return other

    def test_bare_head_and_at_map_to_current_branch(self):
        for command in (
            "git push origin HEAD",
            "git push -u origin HEAD",
            "git push origin @",
        ):
            with self.subTest(command=command):
                self.assertIsNotNone(self.reason(command))
        git(self.repo, "checkout", "-b", "feat/x")
        self.assertIsNone(self.reason("git push origin HEAD"))
        self.assertIsNone(self.reason("git push origin @"))

    def test_cd_between_segments_is_followed(self):
        other = self.other_repo()
        self.assertIsNotNone(self.reason(f"cd {self.repo} && git push origin HEAD"))
        self.assertIsNone(self.reason(f"cd {other} && git push"))
        git(self.repo, "checkout", "-b", "feat/y")
        self.assertIsNotNone(
            self.reason(f"cd {self.repo.parent} && cd repo && git push origin main")
        )

    def test_tags_only_is_not_a_main_push(self):
        self.assertIsNone(self.reason("git push --tags"))
        self.assertIsNone(self.reason("git push origin --tags"))
        self.assertIsNotNone(self.reason("git push origin main --tags"))

    def test_all_and_mirror_push_main_too(self):
        git(self.repo, "checkout", "-b", "feat/x")
        for command in ("git push --all origin", "git push origin --mirror"):
            with self.subTest(command=command):
                self.assertIsNotNone(self.reason(command))

    def test_valued_options_do_not_shift_positionals(self):
        git(self.repo, "checkout", "-b", "feat/x")
        for command in (
            "git push --repo origin main",
            "git push --receive-pack=x origin main",
            "git push --receive-pack x origin main",
            "git push -o ci.skip origin main",
            "git push --push-option ci.skip origin main",
        ):
            with self.subTest(command=command):
                self.assertIsNotNone(self.reason(command))
        self.assertIsNone(self.reason("git push -o main origin feat/x"))

    def test_git_calls_stay_within_hook_budget(self):
        self.assertLessEqual(2 * pushgate.GIT_TIMEOUT, 4)

    def test_shell_c_is_checked_recursively(self):
        self.assertIsNotNone(self.reason("bash -c 'git push origin main'"))
        self.assertIsNotNone(self.reason('sh -c "cd . && git push origin HEAD"'))
        self.assertIsNone(self.reason("bash -c 'echo hallo'"))

    def test_git_is_recognised_by_basename_and_prefix(self):
        for command in (
            "/usr/bin/git push origin main",
            "command git push origin main",
            "env FOO=1 git push origin main",
            "sudo /usr/bin/git -C . push origin main",
        ):
            with self.subTest(command=command):
                self.assertIsNotNone(self.reason(command))
        self.assertIsNone(self.reason("/usr/bin/git push origin feat/x"))


if __name__ == "__main__":
    unittest.main()
