import json
import tempfile
import unittest
from pathlib import Path

import studio_docs as sd

QUEUE_HEAD = "# Warteschlange\n\nText.\n\n---\n"


class DocsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.docs = Path(self.tmp.name) / "docs"
        self.docs.mkdir()
        self.agents = Path(self.tmp.name) / "agents"
        self.agents.mkdir()

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, name, text):
        path = self.docs / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, "utf-8")
        return path

    def test_read_version(self):
        path = self.write("STUDIO.md", "# Handbuch\n\nVersion: 1.2 · Stand x\n")
        self.assertEqual(sd.read_version(path), "1.2")
        self.assertEqual(sd.read_version(self.docs / "fehlt.md"), "")

    def test_persona_meta(self):
        (self.agents / "lead-qa.md").write_text(
            "---\nname: lead-qa\ndescription: 'QA: x'\ntools: Read, Bash\n"
            "model: opus\nversion: 1.1\n---\nText\n",
            "utf-8",
        )
        (self.agents / "kaputt.md").write_text("kein frontmatter", "utf-8")
        meta = sd.persona_meta(self.agents)
        self.assertEqual(list(meta), ["lead-qa"])
        self.assertEqual(meta["lead-qa"]["version"], "1.1")
        self.assertEqual(meta["lead-qa"]["description"], "QA: x")

    def test_changelog(self):
        self.write(
            "CHANGELOG.md",
            "# Changelog\n\n## 2026-10-02 · Persona lead-tech 1.1\n- Anlass: a\n\n"
            "## 2026-09-30 · Handbuch 1.0\n- Anlass: Start\n",
        )
        log = sd.changelog(self.docs)
        self.assertEqual(
            [(e["subject"], e["version"]) for e in log],
            [("Persona lead-tech", "1.1"), ("Handbuch", "1.0")],
        )
        self.assertEqual(log[1]["lines"], ["- Anlass: Start"])

    def test_queue_roundtrip(self):
        self.write("warteschlange.md", QUEUE_HEAD)
        sd.queue_add(
            self.docs,
            "N-001",
            "Neue Abhängigkeit",
            "Paket x?",
            "Nein",
            "weil",
            "M5-03 wartet",
            "M5-03",
            "lead-tech",
            "2026-09-30",
        )
        with self.assertRaises(ValueError):
            sd.queue_add(self.docs, "N-001", "t", "q", "r", "b", "c", "", "x", "d")
        entry = sd.queue_entries(self.docs)[0]
        self.assertEqual((entry["id"], entry["status"]), ("N-001", "offen"))
        self.assertEqual(entry["fields"]["Blockiert"], "M5-03")
        self.assertTrue(sd.queue_update(self.docs, "N-001", answer="Ja, ok"))
        entry = sd.queue_entries(self.docs)[0]
        self.assertEqual(entry["status"], "beantwortet")
        self.assertEqual(entry["fields"]["Antwort"], "Ja, ok")
        self.assertTrue(sd.queue_update(self.docs, "N-001", status="umgesetzt"))
        self.assertEqual(sd.queue_entries(self.docs)[0]["status"], "umgesetzt")
        self.assertFalse(sd.queue_update(self.docs, "N-999", answer="x"))
        self.assertIn("Text.", (self.docs / "warteschlange.md").read_text("utf-8"))

    def test_experiments_and_content_lines(self):
        self.write(
            "experimente.md",
            "# Experimente\n\n## E-001 · laufend · Kürzere Briefings\n"
            "- Hypothese: h\n- Messgrösse: m\n",
        )
        exp = sd.experiments(self.docs)
        self.assertEqual((exp[0]["id"], exp[0]["status"]), ("E-001", "laufend"))
        self.assertEqual(exp[0]["fields"]["Messgrösse"], "m")
        self.assertEqual(sd.content_lines("# T\n\n<!-- k -->\n- a\n- b\n"), 2)

    def test_metrics_history(self):
        block = json.dumps({"kennung": "M5", "created": "2026-10-01T00:00:00Z"})
        self.write("metriken/M5.md", f"# M\n\n## Rohwerte\n\n```json\n{block}\n```\n")
        self.write("metriken/kaputt.md", "## Rohwerte\n\n```json\n{kaputt\n```\n")
        self.assertEqual([h["kennung"] for h in sd.metrics_history(self.docs)], ["M5"])

    def test_bundle_lernen_without_comments_and_title(self):
        self.write(
            "lernen.md",
            "# Was das Studio gelernt hat\n\n<!-- Kuratiert, höchstens 40 -->\n\n"
            "- Erste Lehre\n<!-- mehr-\nzeilig -->\n- Zweite Lehre\n## Abschnitt\n",
        )
        text = sd.bundle(self.docs, self.agents)["lernen"]
        self.assertEqual(text, "- Erste Lehre\n- Zweite Lehre\n## Abschnitt")
        self.write("lernen.md", "# Nur Titel\n<!-- x -->\n")
        self.assertEqual(sd.bundle(self.docs, self.agents)["lernen"], "")

    def test_bundle_tolerates_missing_files(self):
        data = sd.bundle(self.docs, self.agents)
        self.assertEqual(data["queue"], [])
        self.assertEqual(data["handbook_version"], "")
        self.assertEqual(data["personas"], [])
