import tempfile
import unittest
from pathlib import Path

import stampcheck


def make(root, state, rulings):
    (root / "state.md").write_text(state, encoding="utf-8")
    (root / "rulings.md").write_text(rulings, encoding="utf-8")


class StampCheckTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)

    def test_under_threshold_silent(self):
        make(self.root, "Stand: 2026 (R564–R577; Ende)\n", "## R579\n## R582\n")
        self.assertEqual(stampcheck.stale_warning(self.root), "")

    def test_over_threshold_warns(self):
        make(self.root, "Stand: 2026 (R564–R577; Ende)\n", "## R578\n## R583\n")
        text = stampcheck.stale_warning(self.root)
        self.assertIn("R583", text)
        self.assertIn("R577", text)

    def test_missing_or_no_r_silent(self):
        self.assertEqual(stampcheck.stale_warning(self.root), "")
        make(self.root, "Stand: heute\n", "## R900\n")
        self.assertEqual(stampcheck.stale_warning(self.root), "")
        make(self.root, "Stand: R1\n", "kein ruling")
        self.assertEqual(stampcheck.stale_warning(self.root), "")

    def test_word_anchor_ignores_pr_and_cr(self):
        make(self.root, "Stand: PR12 CR5 (R570)\n", "## R575\n PR900 CR901\n")
        self.assertEqual(stampcheck.stale_warning(self.root), "")
        make(self.root, "Stand: PR1 (R570)\n", "## R575\n")
        self.assertEqual(stampcheck._highest("PR12 CR5 R3"), 3)
        self.assertIsNone(stampcheck._highest("PR12 CR5"))


if __name__ == "__main__":
    unittest.main()
