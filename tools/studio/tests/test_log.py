import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock

import log


class LogTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.docs = os.path.join(self.tmp.name, "docs")
        os.makedirs(self.docs)
        Path(self.docs, "STUDIO.md").write_text("Version: 1.0\n", "utf-8")
        Path(self.docs, "warteschlange.md").write_text("# Warteschlange\n", "utf-8")
        env = {
            "STUDIO_HOME": self.tmp.name,
            "STUDIO_DOCS": self.docs,
            "CLAUDE_CODE_SESSION_ID": "s-1",
        }
        self.env = mock.patch.dict(os.environ, env)
        self.env.start()

    def tearDown(self):
        self.env.stop()
        self.tmp.cleanup()

    def run_log(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            try:
                code = log.main(list(argv))
            except SystemExit as exc:
                code = exc.code
        return code, out.getvalue(), err.getvalue()

    def events(self):
        path = Path(self.tmp.name) / "events.jsonl"
        if not path.exists():
            return []
        return [json.loads(x) for x in path.read_text("utf-8").splitlines()]

    def test_status_event(self):
        code, _, _ = self.run_log(
            "status",
            "--role",
            "lead-qa",
            "--status",
            "active",
            "--task",
            "Probelauf",
            "--package",
            "P-1",
        )
        self.assertEqual(code, 0)
        ev = self.events()[0]
        self.assertEqual(ev["kind"], "status")
        self.assertEqual(ev["source"], "log")
        self.assertEqual(ev["session_id"], "s-1")
        self.assertEqual(ev["role"], "lead-qa")
        self.assertEqual(ev["status"], "active")
        self.assertEqual(ev["task"], "Probelauf")
        self.assertEqual(ev["package_id"], "P-1")
        self.assertEqual(ev["handbook_version"], "1.0")
        self.assertEqual(ev["agent_id"], "")
        self.assertIn("ts", ev)

    def test_invalid_status_exits_2(self):
        code, _, _ = self.run_log("status", "--role", "x", "--status", "busy")
        self.assertEqual(code, 2)
        self.assertEqual(self.events(), [])

    def test_session_defaults_to_manual(self):
        with mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("CLAUDE_CODE_SESSION_ID")
            self.run_log("status", "--role", "lead-qa", "--status", "idle")
        self.assertEqual(self.events()[0]["session_id"], "manual")

    def test_budget_event(self):
        self.run_log(
            "budget",
            "--lead",
            "lead-qa",
            "--grant",
            "4",
            "--parallel",
            "2",
            "--phase",
            "Probelauf",
        )
        ev = self.events()[0]
        self.assertEqual(ev["kind"], "budget")
        self.assertEqual(ev["role"], "lead-qa")
        self.assertEqual(
            ev["budget"], {"granted": 4, "parallel": 2, "phase": "Probelauf"}
        )

    def test_package_event_splits_blocked_by(self):
        self.run_log(
            "package",
            "--id",
            "M5-T2",
            "--title",
            "Speichern v2",
            "--owner",
            "lead-tech",
            "--status",
            "blocked",
            "--blocked-by",
            "M5-T1, M5-T0",
            "--milestone",
            "M5",
        )
        ev = self.events()[0]
        self.assertEqual(ev["blocked_by"], ["M5-T1", "M5-T0"])
        self.assertEqual(ev["status"], "blocked")

    def test_package_rejects_unknown_status(self):
        code, _, _ = self.run_log(
            "package", "--id", "A", "--title", "t", "--owner", "o", "--status", "x"
        )
        self.assertEqual(code, 2)

    def test_result_milestone_retro(self):
        self.run_log(
            "result",
            "--role",
            "lead-tech",
            "--package",
            "M5-02",
            "--outcome",
            "nacharbeit",
            "--review-rounds",
            "2",
            "--worker",
            "tech-sim-engineer",
        )
        self.run_log(
            "milestone", "--id", "M5", "--status", "start", "--title", "Handel"
        )
        self.run_log(
            "retro",
            "--id",
            "RETRO-1",
            "--kind",
            "adhoc",
            "--triggers",
            "ci:1,runden:M5-02",
        )
        result, ms, retro = self.events()
        self.assertEqual(
            (result["outcome"], result["review_rounds"]), ("nacharbeit", 2)
        )
        self.assertEqual(result["package_id"], "M5-02")
        self.assertEqual(result["handbook_version"], "1.0")
        self.assertEqual((ms["milestone"], ms["status"]), ("M5", "start"))
        self.assertEqual(retro["triggers"], ["ci:1", "runden:M5-02"])
        self.assertEqual(retro["retro_kind"], "adhoc")

    def test_queue_lifecycle(self):
        code, _, _ = self.run_log(
            "queue",
            "--id",
            "N-001",
            "--title",
            "Lib x",
            "--question",
            "Darf x rein?",
            "--recommendation",
            "Nein",
            "--reason",
            "ADR-001",
            "--cost",
            "M5-03 wartet",
            "--blocks",
            "M5-03",
            "--from",
            "lead-tech",
        )
        self.assertEqual(code, 0)
        answer = self.run_log("queue", "--id", "N-001", "--answer", "Nein")
        self.assertEqual(answer[0], 0)
        done = self.run_log("queue", "--id", "N-001", "--done", "verworfen")
        self.assertEqual(done[0], 0)
        self.assertEqual(self.run_log("queue", "--id", "N-404", "--answer", "x")[0], 2)
        text = (Path(self.docs) / "warteschlange.md").read_text("utf-8")
        self.assertIn("## N-001 \u00b7 umgesetzt", text)
        self.assertIn("- Antwort: Nein", text)
        events = self.events()
        self.assertEqual([e["action"] for e in events], ["add", "answer", "done"])
        self.assertEqual(events[2]["summary"], "verworfen")

    def test_queue_id_format(self):
        for bad in ("N-", "n-001", "N-001x", "X-1", "N-1 ", "../N-1"):
            with self.subTest(bad=bad):
                code, _, err = self.run_log("queue", "--id", bad, "--title", "t")
                self.assertEqual(code, 2)
                self.assertIn("N-<Nummer>", err)
        self.assertEqual(self.events(), [])
        self.assertEqual(self.run_log("queue", "--id", "N-7", "--title", "t")[0], 0)

    def test_decision_for_user_redirects(self):
        code, _, err = self.run_log(
            "decision", "--id", "D-1", "--for", "user", "--question", "x"
        )
        self.assertEqual(code, 2)
        self.assertIn("Warteschlange", err)
        self.assertEqual(self.events(), [])

    def test_decision_open_and_resolved(self):
        self.run_log(
            "decision",
            "--id",
            "D-1",
            "--for",
            "l0",
            "--question",
            "Neue Dependency?",
            "--recommendation",
            "Nein",
            "--from",
            "lead-tech",
        )
        self.run_log("decision", "--id", "D-1", "--resolution", "Abgelehnt")
        first, second = self.events()
        self.assertEqual(first["for"], "l0")
        self.assertEqual(first["role"], "lead-tech")
        self.assertEqual(second["resolution"], "Abgelehnt")

    def test_decision_needs_question_or_resolution(self):
        code, _, _ = self.run_log("decision", "--id", "D-2", "--for", "l0")
        self.assertEqual(code, 2)

    def test_archive_moves_file(self):
        self.run_log("status", "--role", "lead-qa", "--status", "idle")
        code, out, _ = self.run_log("archive")
        self.assertEqual(code, 0)
        self.assertFalse((Path(self.tmp.name) / "events.jsonl").exists())
        folder = Path(self.tmp.name) / "archiv" / "events"
        archived = list(folder.glob("events-*.jsonl"))
        self.assertEqual(len(archived), 1)
        self.assertIn("archiviert", out)

    def test_archive_twice_keeps_both(self):
        for _ in range(2):
            self.run_log("status", "--role", "lead-qa", "--status", "idle")
            code, _, _ = self.run_log("archive")
            self.assertEqual(code, 0)
        folder = Path(self.tmp.name) / "archiv" / "events"
        archived = list(folder.glob("events-*.jsonl"))
        self.assertEqual(len(archived), 2)

    def test_archive_without_file(self):
        code, out, _ = self.run_log("archive")
        self.assertEqual(code, 0)
        self.assertIn("keine Events", out)


if __name__ == "__main__":
    unittest.main()
