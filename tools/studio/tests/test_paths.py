import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import paths


class RepoRootTest(unittest.TestCase):
    def test_plain_repo(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            (root / ".git").mkdir()
            (root / "tools" / "studio").mkdir(parents=True)
            self.assertEqual(paths.repo_root(root / "tools" / "studio" / "x.py"), root)

    def test_worktree_resolves_to_main_repo(self):
        with tempfile.TemporaryDirectory() as tmp:
            main = Path(tmp).resolve() / "main"
            gitdir = main / ".git" / "worktrees" / "wt"
            gitdir.mkdir(parents=True)
            (gitdir / "commondir").write_text("../..\n", encoding="utf-8")
            wt = main / ".worktrees" / "wt"
            (wt / "tools").mkdir(parents=True)
            (wt / ".git").write_text(f"gitdir: {gitdir}\n", encoding="utf-8")
            self.assertEqual(paths.repo_root(wt / "tools" / "hook.py"), main)

    def test_studio_home_env_override(self):
        with mock.patch.dict(os.environ, {"STUDIO_HOME": "/tmp/xyz-studio"}):
            self.assertEqual(paths.studio_home(), Path("/tmp/xyz-studio"))
            self.assertEqual(paths.events_file(), Path("/tmp/xyz-studio/events.jsonl"))

    def test_append_event_writes_one_json_line(self):
        with (
            tempfile.TemporaryDirectory() as tmp,
            mock.patch.dict(os.environ, {"STUDIO_HOME": tmp}),
        ):
            paths.append_event({"kind": "status", "task": "ä"})
            paths.append_event({"kind": "status"})
            lines = (Path(tmp) / "events.jsonl").read_text("utf-8").splitlines()
        self.assertEqual(len(lines), 2)
        self.assertIn('"task":"ä"', lines[0])

    def test_now_iso_is_utc_millis(self):
        self.assertRegex(paths.now_iso(), r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$")


class WorktreeDocsTest(unittest.TestCase):
    def make_worktree(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        wt = Path(tmp.name).resolve() / "wt"
        (wt / "a" / "b").mkdir(parents=True)
        (wt / ".git").write_text("gitdir: /irgendwo/.git/worktrees/wt\n", "utf-8")
        return wt

    def test_worktree_root_with_git_file(self):
        wt = self.make_worktree()
        self.assertEqual(paths.worktree_root(wt / "a" / "b"), wt)

    def test_worktree_root_none_without_git(self):
        with tempfile.TemporaryDirectory() as tmp:
            self.assertIsNone(paths.worktree_root(Path(tmp).resolve()))

    def test_worktree_docs_dir_override_and_fallback(self):
        wt = self.make_worktree()
        with mock.patch.dict(os.environ, {"STUDIO_DOCS": "/x/docs"}):
            self.assertEqual(paths.worktree_docs_dir(), Path("/x/docs"))
        env = {k: v for k, v in os.environ.items() if k != "STUDIO_DOCS"}
        with mock.patch.dict(os.environ, env, clear=True):
            self.assertEqual(paths.worktree_docs_dir(wt / "a"), wt / "docs" / "studio")
            with mock.patch.object(paths, "worktree_root", return_value=None):
                self.assertEqual(paths.worktree_docs_dir(), paths.docs_dir())


if __name__ == "__main__":
    unittest.main()
