import json
import os
import tempfile
import time
import unittest
from pathlib import Path

import aufraeumen

RELEASES = {
    "releases": [
        {
            "id": "REL-22",
            "status": "live",
            "items": [{"pkg": "UI-AUFRAEUM-3"}, {"pkg": "I-100"}],
        },
        {"id": "REL-24", "status": "planned", "items": [{"pkg": "UI-HAEPPCHEN-D"}]},
    ],
    "pastSummary": "REL-01 … REL-21, M1 – M13",
    "qaAliases": {
        "ui-haeppchen-a": "REL-21",
        "texte": "M13",
        "neu": "REL-24",
        "bogus": "REL-99",
    },
}


def put(path: Path, size: int = 10, age_days: float = 0.0) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(b"x" * size)
    t = time.time() - age_days * 86400
    os.utime(path, (t, t))


class AufraeumenTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        self.studio = self.root / ".studio"
        (self.root / "docs" / "studio").mkdir(parents=True)
        rel = self.root / "docs" / "studio" / "releases.json"
        rel.write_text(json.dumps(RELEASES), encoding="utf-8")
        self.rules = aufraeumen.load_rules(rel)

    def plan(self, **kw):
        return aufraeumen.plan_cleanup(self.studio, self.rules, **kw)

    def test_classify(self):
        c = lambda n: aufraeumen.classify(n, self.rules)
        self.assertEqual(c("ui-aufraeum-3"), "live")
        self.assertEqual(c("I-100"), "live")
        self.assertEqual(c("rel22-delta"), "live")
        self.assertEqual(c("REL-01b"), "live")
        self.assertEqual(c("M7-UX-QA"), "live")
        self.assertEqual(c("m13-e1"), "live")
        self.assertEqual(c("UI-HAEPPCHEN-D"), "open")
        self.assertEqual(c("rel-24"), "open")
        self.assertEqual(c("I-1000"), "unknown")
        self.assertEqual(c("ui-haeppchen-a"), "live")
        self.assertEqual(c("texte-1"), "live")
        self.assertEqual(c("neu"), "unknown")  # Alias auf nicht live Release gilt nicht
        self.assertEqual(c("bogus"), "unknown")
        self.assertEqual(c("m14-e1"), "unknown")
        self.assertEqual(c("rel-hf1"), "unknown")

    def test_live_images_deleted_text_kept(self):
        put(self.studio / "qa" / "ui-aufraeum-3" / "a.PNG", 100)
        put(self.studio / "qa" / "ui-aufraeum-3" / "sub" / "b.webp", 50)
        put(self.studio / "qa" / "ui-aufraeum-3" / "bericht.md")
        put(self.studio / "qa" / "ui-aufraeum-3" / "d.json")
        plan = self.plan()
        self.assertEqual(plan.size, 150)
        self.assertEqual(len(plan.delete), 2)
        self.assertTrue(
            (self.studio / "qa" / "ui-aufraeum-3" / "a.PNG").exists()
        )  # Trockenlauf
        aufraeumen.apply_plan(plan, self.studio)
        base = self.studio / "qa" / "ui-aufraeum-3"
        self.assertFalse((base / "a.PNG").exists())
        self.assertFalse((base / "sub").exists())
        self.assertTrue((base / "bericht.md").exists())
        self.assertTrue((base / "d.json").exists())

    def test_open_package_kept(self):
        put(self.studio / "qa" / "UI-HAEPPCHEN-D" / "a.png", 100, age_days=90)
        self.assertEqual(self.plan().delete, [])

    def test_unknown_by_age(self):
        put(self.studio / "qa" / "alt" / "a.png", 10, age_days=30)
        put(self.studio / "qa" / "neu" / "a.png", 10, age_days=1)
        plan = self.plan()
        self.assertEqual([p.parent.name for p in plan.delete], ["alt"])
        self.assertEqual(len(plan.keep), 1)

    def test_worktree_only_when_reachable(self):
        wt = self.studio / "archiv" / "worktrees" / "b4"
        put(wt / ".git", 5)
        put(wt / "x.txt", 7)
        self.assertEqual(self.plan(reachable=lambda p: False).delete_dirs, [])
        plan = self.plan(reachable=lambda p: True)
        self.assertEqual(plan.delete_dirs, [wt])
        aufraeumen.apply_plan(plan, self.studio)
        self.assertFalse(wt.exists())

    def test_worktree_leftovers_only_images(self):
        put(
            self.studio
            / "archiv"
            / "worktrees"
            / "w"
            / ".studio"
            / "qa"
            / "w"
            / "a.png",
            10,
            age_days=40,
        )
        put(
            self.studio / "archiv" / "worktrees" / "w" / ".superpowers" / "n.md",
            10,
            age_days=40,
        )
        aufraeumen.apply_plan(self.plan(), self.studio)
        self.assertTrue(
            (
                self.studio / "archiv" / "worktrees" / "w" / ".superpowers" / "n.md"
            ).exists()
        )
        self.assertFalse(
            (
                self.studio
                / "archiv"
                / "worktrees"
                / "w"
                / ".studio"
                / "qa"
                / "w"
                / "a.png"
            ).exists()
        )

    def test_refuses_outside(self):
        outside = self.root / "src" / "a.png"
        put(outside)
        plan = aufraeumen.Plan(delete=[outside])
        with self.assertRaises(ValueError):
            aufraeumen.apply_plan(plan, self.studio)
        self.assertTrue(outside.exists())

    def test_main_dry_run_default(self):
        put(self.studio / "qa" / "i-100" / "a.png", 10)
        self.assertEqual(aufraeumen.main(["--root", str(self.root)]), 0)
        self.assertTrue((self.studio / "qa" / "i-100" / "a.png").exists())
        aufraeumen.main(["--root", str(self.root), "--apply"])
        self.assertFalse((self.studio / "qa" / "i-100" / "a.png").exists())


if __name__ == "__main__":
    unittest.main()
