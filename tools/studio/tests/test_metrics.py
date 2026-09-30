import contextlib
import io
import json
import os
import tempfile
import unittest
from pathlib import Path

import metrics
import studio_docs
from tests.test_effort import scenario


def write_events(home: Path, events: list[dict]) -> None:
    home.mkdir(parents=True, exist_ok=True)
    lines = [json.dumps(e, ensure_ascii=False) for e in events]
    (home / "events.jsonl").write_text("\n".join(lines) + "\n", encoding="utf-8")


class MetricsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        base = Path(self.tmp.name)
        self.home = base / "home"
        self.out = base / "out"
        self.docs = base / "docs"
        self.transcripts = base / "transcripts"
        self.transcripts.mkdir()
        events = scenario()
        for event in events:  # der Reviewer gehört ebenfalls zu M9
            if event.get("subagent_type") == "qa-code-reviewer":
                event["milestone"] = "M9"
        write_events(self.home, events)
        patch = mock_env(
            STUDIO_HOME=str(self.home),
            STUDIO_DOCS=str(self.docs),
            STUDIO_TRANSCRIPTS=str(self.transcripts),
        )
        patch.__enter__()
        self.addCleanup(patch.__exit__, None, None, None)

    def run_cli(self, *args):
        buffer = io.StringIO()
        with contextlib.redirect_stdout(buffer):
            code = metrics.main([*args, "--out", str(self.out)])
        return code, buffer.getvalue().strip()

    def test_session_file_and_raw_values(self):
        code, printed = self.run_cli("--session", "s1")
        self.assertEqual(code, 0)
        path = self.out / "S-2026-09-30-s1.md"
        self.assertEqual(printed, str(path))
        text = path.read_text(encoding="utf-8")
        self.assertIn("# Metriken S-2026-09-30-s1", text)
        self.assertIn("## Rohwerte", text)
        self.assertIn("## Grenzen der Messung", text)
        history = studio_docs.metrics_history(self.out.parent)
        self.assertEqual(history, [])  # Ordner heisst hier "out", nicht "metriken"

    def test_history_reads_file(self):
        self.out = Path(self.tmp.name) / "docs" / "metriken"
        self.run_cli("--session", "s1")
        raw = studio_docs.metrics_history(Path(self.tmp.name) / "docs")[0]
        self.assertEqual(raw["kind"], "session")
        self.assertEqual(raw["totals"]["output"], 50)
        self.assertEqual(raw["quality"]["first_pass_rate"], 1.0)
        self.assertEqual(raw["handbook_version"], "")

    def test_latest_resolves_session(self):
        self.run_cli("--session", "latest")
        self.assertTrue((self.out / "S-2026-09-30-s1.md").exists())

    def test_milestone_file(self):
        self.run_cli("--milestone", "M9")
        text = (self.out / "M9.md").read_text(encoding="utf-8")
        self.assertIn("# Metriken M9", text)
        block = text.split("## Rohwerte")[1].split("```json\n")[1].split("\n```")[0]
        raw = json.loads(block)
        self.assertEqual(raw["kind"], "milestone")
        self.assertEqual(raw["agents"], 2)
        self.assertEqual(raw["quality"]["first_pass_rate"], 1.0)
        self.assertIsNone(raw["quality"]["ci_runs"])

    def test_missing_transcript_is_not_measured(self):
        self.run_cli("--session", "s1")
        text = (self.out / "S-2026-09-30-s1.md").read_text(encoding="utf-8")
        grenzen = text.split("## Grenzen der Messung")[1].split("## Rohwerte")[0]
        self.assertIn("nicht gemessen", grenzen)

    def test_none_is_not_zero(self):
        raw = {
            "kennung": "X",
            "kind": "session",
            "created": "c",
            "handbook_version": "1.0",
            "sessions": 1,
            "agents": 0,
            "delegations": 0,
            "totals": {
                "duration_s": None,
                "tool_calls": None,
                "input": None,
                "cache_write": None,
                "cache_read": None,
                "output": None,
                "output_lower_bound": False,
            },
            "by_lead": [],
            "by_model": [],
            "estimate_vs_actual": {"count": 0, "estimated_min": None},
            "quality": {"first_pass_rate": None, "results": 0},
            "incidents_open": 0,
            "session_cost": None,
        }
        text = metrics.render(raw)
        self.assertIn("nicht gemessen", text)
        self.assertIn("nicht erfasst", text)

    def test_lower_bound_marker(self):
        self.run_cli("--session", "s1")
        text = (self.out / "S-2026-09-30-s1.md").read_text(encoding="utf-8")
        self.assertIn("≥", text)

    def test_second_run_overwrites(self):
        self.run_cli("--session", "s1")
        path = self.out / "S-2026-09-30-s1.md"

        def body(text):
            return [line for line in text.splitlines() if "erzeugt" not in line]

        first = path.read_text(encoding="utf-8")
        self.run_cli("--session", "s1")
        self.assertEqual(body(first), body(path.read_text(encoding="utf-8")))

    def test_load_events_reads_archives(self):
        (self.home / "archiv" / "events").mkdir(parents=True)
        (self.home / "archive").mkdir()
        (self.home / "archiv" / "events" / "a.jsonl").write_text('{"kind":"x"}\n')
        (self.home / "archive" / "b.jsonl").write_text('{"kind":"y"}\nkaputt\n')
        kinds = [e.get("kind") for e in metrics.load_events(self.home)]
        self.assertIn("x", kinds)
        self.assertIn("y", kinds)
        self.assertEqual(len(kinds), len(scenario()) + 2)

    def test_transcript_dir(self):
        with mock_env(STUDIO_TRANSCRIPTS=""):
            os.environ.pop("STUDIO_TRANSCRIPTS")
            path = metrics.transcript_dir(Path("/a/b_c"))
        self.assertEqual(path.name, "-a-b-c")
        self.assertEqual(path.parent.name, "projects")
        with mock_env(STUDIO_TRANSCRIPTS="/x"):
            self.assertEqual(metrics.transcript_dir(Path("/a")), Path("/x"))


@contextlib.contextmanager
def mock_env(**values):
    old = {k: os.environ.get(k) for k in values}
    os.environ.update(values)
    try:
        yield
    finally:
        for key, value in old.items():
            if value is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = value


if __name__ == "__main__":
    unittest.main()
