import tempfile
import unittest
from pathlib import Path

import context


class ContextTest(unittest.TestCase):
    def test_sections_and_limit(self):
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp)
            (docs / "STUDIO.md").write_text("# H\nVersion: 1.0\n", "utf-8")
            (docs / "VERFASSUNG.md").write_text("# V\nVersion: 1.0\n", "utf-8")
            (docs / "state.md").write_text("# Stand\n" + "x" * 20000, "utf-8")
            (docs / "lernen.md").write_text("# Lernen\n- kurz\n", "utf-8")
            (docs / "warteschlange.md").write_text(
                "# W\n\n## N-001 · offen · 2026-09-30 · Lib x\n- Empfehlung: Nein\n"
                "- Blockiert: M5-03\n\n## N-002 · umgesetzt · 2026-09-30 · alt\n",
                "utf-8",
            )
            text = context.build_context(
                docs, [{"id": "ci:1", "text": "CI rot auf main"}], "8765"
            )
            self.assertLessEqual(len(text), context.LIMIT)
            self.assertIn("Projektleiter", text)
            self.assertIn("http://127.0.0.1:8765/", text)
            self.assertIn("gekürzt, siehe docs/studio/state.md", text)
            self.assertIn("N-001", text)
            self.assertNotIn("N-002", text)
            self.assertIn("CI rot auf main", text)

    def test_missing_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            text = context.build_context(Path(tmp), [], "8765")
            self.assertIn("Projektleiter", text)

    def test_queue_line_format_and_caps(self):
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp)
            entries = "".join(
                f"## N-{i:03d} · offen · 2026-09-30 · T{i}\n- Empfehlung: E{i}\n"
                f"- Blockiert: B{i}\n\n"
                for i in range(1, 13)
            )
            (docs / "warteschlange.md").write_text("# W\n\n" + entries, "utf-8")
            (docs / "experimente.md").write_text(
                "# E\n\n## E-001 · laufend · Test A\n\n## E-002 · behalten · Test B\n",
                "utf-8",
            )
            incidents = [{"id": f"i{i}", "text": f"V{i}"} for i in range(12)]
            text = context.build_context(docs, incidents, "8765")
            self.assertIn("- N-001 · offen · T1 — Empfehlung: E1 · Blockiert: B1", text)
            self.assertIn("N-008", text)
            self.assertNotIn("N-009", text)
            self.assertIn("E-001", text)
            self.assertNotIn("E-002", text)
            self.assertIn("V7", text)
            self.assertNotIn("V8", text)

    def test_answer_shown_even_if_status_open(self):
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp)
            (docs / "warteschlange.md").write_text(
                "# W\n\n## N-001 · offen · 2026-09-30 · Lib x\n\n- Empfehlung: Nein\n"
                "- Blockiert: M5-03\n- Antwort: Ja, aber nur x\n\n"
                "## N-002 · offen · 2026-09-30 · Lib y\n\n- Empfehlung: E\n"
                "- Blockiert: B\n- Antwort: –\n\n"
                "## N-003 · beantwortet · 2026-09-30 · Lib z\n\n- Antwort: Nein\n",
                "utf-8",
            )
            text = context.build_context(docs, [], "8765")
            self.assertIn(
                "- N-001 · beantwortet · Lib x — Antwort: Ja, aber nur x"
                " · Blockiert: M5-03",
                text,
            )
            self.assertIn("- N-002 · offen · Lib y — Empfehlung: E · Blockiert: B", text)
            self.assertIn("- N-003 · beantwortet · Lib z — Antwort: Nein", text)

    def test_start_report_comes_first(self):
        with tempfile.TemporaryDirectory() as tmp:
            text = context.build_context(Path(tmp), [], "8765")
        rule = (
            "Bevor du ein Werkzeug für den Auftrag benutzt oder delegierst: zuerst "
            "den Start-Bericht als Text ausgeben; Lesen des Kontexts ist erlaubt."
        )
        self.assertIn(rule, text)
        self.assertIn("auch wenn der erste Prompt bereits einen Auftrag enthält", text)
        self.assertLess(text.index(rule), text.index("## state.md"))

    def test_start_routine_never_waits(self):
        self.assertIn("Neue Anweisung = Auftrag", context.START_ROUTINE)
        self.assertIn("nie untätig warten", context.START_ROUTINE)
        self.assertNotIn("auf den Auftrag warten", context.START_ROUTINE)

    def test_hard_limit_with_huge_inputs(self):
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp)
            (docs / "state.md").write_text("s" * 50000, "utf-8")
            (docs / "lernen.md").write_text("l" * 50000, "utf-8")
            incidents = [{"id": str(i), "text": "v" * 2000} for i in range(8)]
            text = context.build_context(docs, incidents, "8765")
            self.assertLessEqual(len(text), context.LIMIT)

    def test_incidents_survive_long_docs_with_note(self):
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp)
            (docs / "state.md").write_text("s" * 50000, "utf-8")
            (docs / "lernen.md").write_text("l" * 50000, "utf-8")
            incidents = [
                {"id": str(i), "text": f"VORFALL{i} " + "v" * 1000} for i in range(30)
            ]
            text = context.build_context(docs, incidents, "8765")
            self.assertLessEqual(len(text), context.LIMIT)
            self.assertIn("VORFALL7", text)
            self.assertNotIn("VORFALL8", text)
            self.assertIn("gekürzt, siehe docs/studio/state.md", text)
            self.assertIn("gekürzt, siehe docs/studio/lernen.md", text)


if __name__ == "__main__":
    unittest.main()
