"""Konsistenz der Studio-Dokumente im echten Repo (Handbuch, Changelog, Personas)."""

import json
import unittest
from pathlib import Path

import studio_docs as sd

REPO = Path(__file__).resolve().parents[3]
DOCS = REPO / "docs" / "studio"
AGENTS = REPO / ".claude" / "agents"
PARAGRAPHS = [f"## §{n} " for n in range(1, 11)]


class DocsConsistencyTest(unittest.TestCase):
    def test_handbook_version_matches_changelog(self):
        version = sd.read_version(DOCS / "STUDIO.md")
        entries = [e for e in sd.changelog(DOCS) if e["subject"] == "Handbuch"]
        self.assertTrue(version)
        self.assertTrue(entries)
        self.assertEqual(entries[0]["version"], version)

    def test_persona_versions(self):
        meta = sd.persona_meta(AGENTS)
        latest = {}
        for entry in sd.changelog(DOCS):
            if entry["subject"].startswith("Persona "):
                latest.setdefault(entry["subject"][len("Persona ") :], entry["version"])
        self.assertTrue(meta)
        for name, info in meta.items():
            with self.subTest(persona=name):
                self.assertTrue(info["version"])
                self.assertEqual(info["version"], latest.get(name, "1.0"))

    def test_experiments_limit(self):
        running = [e for e in sd.experiments(DOCS) if e["status"] == "laufend"]
        self.assertLessEqual(len(running), 3)
        for e in sd.experiments(DOCS):
            self.assertIn(e["status"], sd.EXPERIMENT_STATUSES)

    def test_lernen_length(self):
        text = sd.read_text(DOCS / "lernen.md")
        self.assertTrue(text)
        self.assertLessEqual(sd.content_lines(text), 40)

    def test_constitution_complete(self):
        text = sd.read_text(DOCS / "VERFASSUNG.md")
        self.assertTrue(sd.read_version(DOCS / "VERFASSUNG.md"))
        for heading in PARAGRAPHS:
            self.assertIn(heading, text)

    def test_queue_parses(self):
        self.assertTrue((DOCS / "warteschlange.md").is_file())
        for entry in sd.queue_entries(DOCS):
            self.assertIn(entry["status"], sd.QUEUE_STATUSES)

    def test_fixed_rules_block_matches_constitution(self):
        def block(text):
            start = text.index("Feste Regeln (unverändert, gelten immer):")
            lines = text[start:].splitlines()[1:]
            end = next(i for i, line in enumerate(lines) if not line.startswith("- "))
            return lines[:end]

        constitution = sd.read_text(DOCS / "VERFASSUNG.md")
        template = sd.read_text(DOCS / "templates" / "briefing.md")
        self.assertEqual(block(template), block(constitution))

    def test_no_decision_for_user(self):
        paths = [
            *AGENTS.glob("*.md"),
            *(DOCS / "templates").glob("*.md"),
            DOCS / "STUDIO.md",
        ]
        for path in paths:
            with self.subTest(path=path.name):
                self.assertNotIn("--for user", sd.read_text(path))

    @unittest.skipUnless(
        (REPO / ".claude/output-styles/projektleiter.md").exists(), "Task 11"
    )
    def test_session_start_hook_all_sources(self):
        settings = json.loads(sd.read_text(REPO / ".claude" / "settings.json"))
        for entry in settings["hooks"]["SessionStart"]:
            self.assertNotIn("matcher", entry)  # startup, resume, clear, compact
        self.assertEqual(settings.get("outputStyle"), "Projektleiter")


if __name__ == "__main__":
    unittest.main()
