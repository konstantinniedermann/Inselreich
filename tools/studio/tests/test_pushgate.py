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


if __name__ == "__main__":
    unittest.main()
