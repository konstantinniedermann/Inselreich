import os
import subprocess
import tempfile
import unittest
from pathlib import Path

import merge_append

MODULE = Path(merge_append.__file__).resolve()
HEAD = "# Beobachtungen\n\n## A alt\ntext\n"


def marks(size=7):
    return ("<" * size, "|" * size, "=" * size, ">" * size)


def block(ours, base, theirs, size=7, eol="\n"):
    s, m, e, g = marks(size)
    return f"{s} ours{eol}{ours}{m} base{eol}{base}{e}{eol}{theirs}{g} theirs{eol}"


class ResolveTest(unittest.TestCase):
    def test_empty_base_block_becomes_ours_then_theirs(self):
        text = HEAD + block("## B ours\n", "", "## C theirs\n")
        self.assertEqual(
            merge_append.resolve(text, 7), (HEAD + "## B ours\n## C theirs\n", 0)
        )

    def test_one_solvable_one_open(self):
        open_block = block("neu\n", "alt\n", "anders\n")
        text = block("o1\n", "", "t1\n") + "mitte\n" + open_block
        merged, left = merge_append.resolve(text, 7)
        self.assertEqual(left, 1)
        self.assertEqual(merged, "o1\nt1\nmitte\n" + open_block)
        self.assertIn("alt\n", merged)  # Basisinhalt bleibt, nichts kehrt zurück

    def test_marker_size_nine(self):
        text = block("x\n", "", "y\n", size=9)
        self.assertEqual(merge_append.resolve(text, 9), ("x\ny\n", 0))
        self.assertEqual(merge_append.resolve(text, 7)[1], 0)  # 7er-Suche: kein Block

    def test_no_trailing_newline_kept(self):
        text = block("x\n", "", "y\n") + "ende"
        self.assertEqual(merge_append.resolve(text, 7), ("x\ny\nende", 0))

    def test_crlf_preserved(self):
        text = block("x\r\n", "", "y\r\n", eol="\r\n")
        self.assertEqual(merge_append.resolve(text, 7), ("x\r\ny\r\n", 0))

    def test_text_without_block_unchanged(self):
        self.assertEqual(merge_append.resolve(HEAD, 7), (HEAD, 0))


def git(cwd, *args, check=True, env=None):
    full = dict(
        os.environ, GIT_CONFIG_GLOBAL="/dev/null", GIT_CONFIG_SYSTEM="/dev/null"
    )
    full.update(env or {})
    return subprocess.run(
        ["git", *args], cwd=cwd, capture_output=True, text=True, check=check, env=full
    )


class MainTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.dir = Path(tmp.name)

    def files(self, base, ours, theirs):
        paths = []
        for name, content in (("O", base), ("A", ours), ("B", theirs)):
            path = self.dir / name
            path.write_text(content, encoding="utf-8", newline="")
            paths.append(str(path))
        return paths

    def test_pure_appends_resolved(self):
        o, a, b = self.files(HEAD, HEAD + "## B\n", HEAD + "## C\n")
        self.assertEqual(merge_append.main([o, a, b, "7", "f"]), 0)
        self.assertEqual((self.dir / "A").read_text(), HEAD + "## B\n## C\n")

    def test_identical_appends_once(self):
        o, a, b = self.files(HEAD, HEAD + "## B\n", HEAD + "## B\n")
        self.assertEqual(merge_append.main([o, a, b, "7", "f"]), 0)
        self.assertEqual((self.dir / "A").read_text().count("## B"), 1)

    def test_change_conflict_keeps_markers_exit_one(self):
        o, a, b = self.files(
            HEAD, HEAD.replace("text", "mein"), HEAD.replace("text", "dein")
        )
        self.assertEqual(merge_append.main([o, a, b, "7", "f"]), 1)
        result = (self.dir / "A").read_text()
        self.assertIn("<" * 7 + " ours", result)
        self.assertIn("text", result)  # Basisteil bleibt stehen

    def test_deleted_line_stays_conflict_not_restored(self):
        base = HEAD + "## Z\nz\n"
        o, a, b = self.files(base, base + "## B\n", HEAD + "## C\n")
        self.assertEqual(merge_append.main([o, a, b, "7", "f"]), 1)
        result = (self.dir / "A").read_text()
        self.assertIn("<" * 7 + " ours", result)
        self.assertIn("||||||| base\n## Z\nz\n=======", result)

    def test_own_failure_leaves_a_untouched(self):
        a = self.dir / "A"
        a.write_text("unveraendert\n")
        self.assertEqual(
            merge_append.main([str(self.dir / "fehlt"), str(a), str(a), "7", "f"]), 1
        )
        self.assertEqual(a.read_text(), "unveraendert\n")
        self.assertEqual(merge_append.main(["nur-ein-arg"]), 1)


class GitIntegrationTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.repo = Path(tmp.name) / "repo"
        self.repo.mkdir()
        git(self.repo, "init", "-q", "-b", "main")
        git(self.repo, "config", "user.name", "T")
        git(self.repo, "config", "user.email", "t@example.com")
        (self.repo / ".gitattributes").write_text(
            "docs/beobachtungen.md merge=beob-append\n"
        )
        (self.repo / "docs").mkdir()
        self.file = self.repo / "docs" / "beobachtungen.md"
        self.file.write_text(HEAD)
        git(self.repo, "add", "-A")
        git(self.repo, "commit", "-qm", "base")
        for name in ("a", "b"):
            git(self.repo, "checkout", "-qb", name, "main")
            self.file.write_text(HEAD + f"## Zugang {name}\n{name}\n")
            git(self.repo, "commit", "-qam", name)
        git(self.repo, "checkout", "-q", "a")

    def set_driver(self):
        git(self.repo, "config", "merge.beob-append.name", "Beobachtungen (E-059)")
        git(
            self.repo,
            "config",
            "merge.beob-append.driver",
            f"python3 {MODULE} %O %A %B %L %P",
        )

    def test_merge_without_conflict(self):
        self.set_driver()
        result = git(self.repo, "merge", "b", "-m", "m", check=False)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        text = self.file.read_text()
        self.assertEqual(text, HEAD + "## Zugang a\na\n## Zugang b\nb\n")
        self.assertNotIn("<" * 7, text)

    def test_merge_from_linked_worktree(self):
        self.set_driver()
        git(self.repo, "checkout", "-q", "main")
        tree = self.repo.parent / "wt"
        git(self.repo, "worktree", "add", "-q", str(tree), "a")
        result = git(tree, "merge", "b", "-m", "m", check=False)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertEqual(
            (tree / "docs" / "beobachtungen.md").read_text().count("## Zugang"), 2
        )

    def test_without_config_normal_conflict(self):
        result = git(self.repo, "merge", "b", "-m", "m", check=False)
        self.assertNotEqual(result.returncode, 0)
        self.assertIn("<" * 7, self.file.read_text())


if __name__ == "__main__":
    unittest.main()
