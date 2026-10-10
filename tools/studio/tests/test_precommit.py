import contextlib
import io
import json
import os
import shutil
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest import mock

import model
import precommit
from paths import repo_root

SCRIPT = Path(precommit.__file__)
PRETTIER = repo_root() / "node_modules" / ".bin" / "prettier"


class FakeRunner:
    def __init__(self, staged: str, prettier_code=0, prettier_out=""):
        self.calls: list[list[str]] = []
        self.staged, self.code, self.out = staged, prettier_code, prettier_out

    def __call__(self, args):
        self.calls.append(list(args))
        if args[:2] == ["git", "diff"]:
            return subprocess.CompletedProcess(args, 0, self.staged, "")
        if args[:2] == ["git", "rev-parse"]:
            return subprocess.CompletedProcess(args, 0, "/wt\n", "")
        return subprocess.CompletedProcess(args, self.code, self.out, "")

    def prettier_calls(self):
        return [c for c in self.calls if c[0] != "git"]


class StagedTest(unittest.TestCase):
    def test_staged_files_nul_separated(self):
        run = FakeRunner("a b.md\0ü.ts\0dir/c.json\0")
        self.assertEqual(precommit.staged_files(run), ["a b.md", "ü.ts", "dir/c.json"])
        self.assertIn("--diff-filter=ACMR", run.calls[0])
        self.assertIn("-z", run.calls[0])


class MainTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.home = Path(tmp.name)
        patcher = mock.patch.dict(os.environ, {"STUDIO_HOME": tmp.name})
        patcher.start()
        self.addCleanup(patcher.stop)
        bin_patch = mock.patch.object(
            precommit, "prettier_bin", return_value=Path("/x/prettier")
        )
        bin_patch.start()
        self.addCleanup(bin_patch.stop)

    def events(self):
        path = self.home / "events.jsonl"
        if not path.exists():
            return []
        return [json.loads(line) for line in path.read_text("utf-8").splitlines()]

    def test_nothing_staged_runs_no_prettier(self):
        run = FakeRunner("")
        self.assertEqual(precommit.main(run, {}), 0)
        self.assertEqual(run.prettier_calls(), [])

    def test_passes_exactly_staged_paths_once(self):
        run = FakeRunner("a.ts\0b.md\0")
        self.assertEqual(precommit.main(run, {}), 0)
        calls = run.prettier_calls()
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0][-2:], ["a.ts", "b.md"])
        self.assertIn("--list-different", calls[0])
        self.assertIn("--ignore-unknown", calls[0])

    def test_rejects_and_logs_event(self):
        run = FakeRunner("a.ts\0b.md\0", prettier_code=1, prettier_out="a.ts\n")
        env = {"CLAUDE_CODE_SESSION_ID": "s-42"}
        self.assertEqual(precommit.main(run, env), 1)
        [event] = self.events()
        self.assertEqual(event["kind"], "commit_rejected")
        self.assertEqual(event["session_id"], "s-42")
        self.assertEqual(event["files"], ["a.ts"])
        self.assertEqual(event["source"], "log")

    def test_prettier_error_rejects_with_all_files(self):
        run = FakeRunner("a.ts\0", prettier_code=2, prettier_out="")
        self.assertEqual(precommit.main(run, {}), 1)
        self.assertEqual(self.events()[0]["files"], ["a.ts"])

    def test_missing_prettier_allows(self):
        with mock.patch.object(precommit, "prettier_bin", return_value=None):
            self.assertEqual(precommit.main(FakeRunner("a.ts\0"), {}), 0)

    def test_decode_error_allows_commit(self):
        def broken(args):
            raise UnicodeDecodeError("utf-8", b"\xff", 0, 1, "invalid start byte")

        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            self.assertEqual(precommit.main(broken, {}), 0)
        self.assertIn("übersprungen", stderr.getvalue())

    def test_unexpected_error_allows_commit(self):
        def broken(args):
            raise RuntimeError("unerwartet")

        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            self.assertEqual(precommit.main(broken, {}), 0)
        self.assertIn("übersprungen", stderr.getvalue())

    def test_git_failure_warns_on_stderr_and_allows(self):
        def failing(args):
            return subprocess.CompletedProcess(args, 128, "", "fatal: kaputt")

        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            self.assertEqual(precommit.main(failing, {}), 0)
        self.assertIn("git", stderr.getvalue())
        self.assertIn("kaputt", stderr.getvalue())

    def test_record_without_session_uses_manual_session(self):
        precommit.record(["a.ts"], Path("/wt"), {})
        self.assertEqual(self.events()[0]["session_id"], model.MANUAL_SESSION)

    def test_old_python_allows_silently(self):
        run = FakeRunner("a.ts\0", prettier_code=1, prettier_out="a.ts\n")
        stderr = io.StringIO()
        with contextlib.redirect_stderr(stderr):
            code = precommit.main(run, {}, version=(3, 10))
        self.assertEqual(code, 0)
        self.assertEqual(run.calls, [])
        self.assertIn("3.11", stderr.getvalue())

    def test_event_does_not_break_dashboard_model(self):
        run = FakeRunner("a.ts\0", prettier_code=1, prettier_out="a.ts\n")
        precommit.main(run, {"CLAUDE_CODE_SESSION_ID": "s1"})
        state = model.build_state(self.events(), time.time(), {})
        self.assertIn("tree", state)


HOOK = Path(__file__).resolve().parents[2] / "githooks" / "pre-commit"


class HookShellTest(unittest.TestCase):
    def test_hook_is_executable(self):
        self.assertTrue(os.access(HOOK, os.X_OK))

    def test_hook_without_python3_allows(self):
        if not os.path.exists("/bin/sh"):
            self.skipTest("/bin/sh fehlt")
        git = shutil.which("git")
        if git is None:
            self.skipTest("git fehlt")
        with tempfile.TemporaryDirectory() as tmp:
            bin_dir = Path(tmp, "bin")
            bin_dir.mkdir()
            Path(bin_dir, "git").symlink_to(git)
            done = subprocess.run(
                ["/bin/sh", str(HOOK)],
                cwd=HOOK.parent,
                env={"PATH": str(bin_dir), "HOME": tmp},
                capture_output=True,
                text=True,
                check=False,
            )
        self.assertEqual(done.returncode, 0, done.stderr)
        self.assertIn("python3 fehlt", done.stderr)


@unittest.skipUnless(PRETTIER.is_file(), "node_modules fehlt")
class RealRunTest(unittest.TestCase):
    def run_hook(self, repo, env):
        return subprocess.run(
            [sys.executable, str(SCRIPT)],
            cwd=repo,
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )

    def test_real_repo_rejects_then_accepts(self):
        with (
            tempfile.TemporaryDirectory() as repo,
            tempfile.TemporaryDirectory() as home,
        ):
            env = {**os.environ, "STUDIO_HOME": home}
            subprocess.run(["git", "init", "-q"], cwd=repo, check=True)
            Path(repo, "bad.ts").write_text("const  a=1\n", "utf-8")
            subprocess.run(["git", "add", "bad.ts"], cwd=repo, check=True)
            done = self.run_hook(repo, env)
            self.assertEqual(done.returncode, 1, done.stderr)
            self.assertIn("bad.ts", done.stderr)
            Path(repo, "bad.ts").write_text("const a = 1;\n", "utf-8")
            subprocess.run(["git", "add", "bad.ts"], cwd=repo, check=True)
            done = self.run_hook(repo, env)
            self.assertEqual(done.returncode, 0, done.stderr)
