import argparse
import contextlib
import io
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import metrics
import studio_docs

from tests.test_effort import scenario

REPO = Path(__file__).resolve().parents[3]
PRETTIER = REPO / "node_modules" / ".bin" / "prettier"


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
        write_events(self.home, scenario())
        patch = mock_env(
            STUDIO_HOME=str(self.home),
            STUDIO_DOCS=str(self.docs),
            STUDIO_TRANSCRIPTS=str(self.transcripts),
        )
        patch.__enter__()
        self.addCleanup(patch.__exit__, None, None, None)

    def run_cli(self, *args, formatter=lambda path: None):
        # ohne echten Prettier-Aufruf (langsam); test_main_formats_written_file prüft ihn
        buffer = io.StringIO()
        with (
            contextlib.redirect_stdout(buffer),
            mock.patch.object(metrics, "format_markdown", formatter, create=True),
        ):
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
        self.assertIn("```json", text)

    def test_history_reads_file(self):
        self.out = Path(self.tmp.name) / "docs" / "metriken"
        self.run_cli("--session", "s1")
        raw = studio_docs.metrics_history(Path(self.tmp.name) / "docs")[0]
        self.assertEqual(raw["kind"], "session")
        self.assertEqual(raw["totals"]["output"], 50)
        self.assertEqual(raw["quality"]["first_pass_rate"], 1.0)
        self.assertIsNone(raw["handbook_version"])

    def test_milestone_without_records_warns(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err):
            self.run_cli("--milestone", "M404")
        self.assertIn("M404", err.getvalue())
        self.assertTrue((self.out / "M404.md").exists())

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
        self.assertEqual(raw["agents"], 4)
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

    @unittest.skipUnless(shutil.which("npx") and PRETTIER.exists(), "ohne npx")
    def test_render_is_prettier_clean(self):
        _, raw = metrics.build(metrics_args(session="s1"))
        text = metrics.render(raw)
        result = subprocess.run(
            ["npx", "--no-install", "prettier", "--stdin-filepath", "metrik.md"],
            input=text,
            capture_output=True,
            text=True,
            cwd=REPO,
            timeout=60,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, text)

    def test_main_formats_written_file(self):
        calls = []
        self.run_cli("--session", "s1", formatter=calls.append)
        self.assertEqual(calls, [self.out / "S-2026-09-30-s1.md"])

    def test_format_markdown_never_raises(self):
        path = self.out / "x.md"
        with mock.patch.object(metrics.subprocess, "run", side_effect=OSError("npx")):
            metrics.format_markdown(path)
        with mock.patch.object(
            metrics.subprocess,
            "run",
            side_effect=subprocess.TimeoutExpired("npx", 30),
        ):
            metrics.format_markdown(path)

    def test_estimate_minutes_rounded(self):
        raw = metrics.build(metrics_args(session="s1"))[1]
        raw["estimate_vs_actual"] = {
            "count": 2,
            "estimated_min": 0.6 + 0.7,
            "actual_min": 1.25,
            "deviation_pct": 1.0,
        }
        text = metrics.render(raw)
        self.assertIn("Geschätzt: 1.3 min, Ist: 1.2 min", text)

    def test_transcript_dir(self):
        with mock_env(STUDIO_TRANSCRIPTS=""):
            os.environ.pop("STUDIO_TRANSCRIPTS")
            path = metrics.transcript_dir(Path("/a/b_c"))
        self.assertEqual(path.name, "-a-b-c")
        self.assertEqual(path.parent.name, "projects")
        with mock_env(STUDIO_TRANSCRIPTS="/x"):
            self.assertEqual(metrics.transcript_dir(Path("/a")), Path("/x"))


def metrics_args(session=None, milestone=None):
    return argparse.Namespace(session=session, milestone=milestone, out=None)


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


class SessionStartTest(unittest.TestCase):
    def test_ignores_ci_pseudo_session(self):
        events = [
            {"ts": "2026-10-05T10:00:00Z", "session_id": "ci"},
            {"ts": "2026-10-08T10:00:00Z", "session_id": "abc"},
            {"ts": "2026-10-08T10:05:00Z", "session_id": "abc"},
            {"ts": "2026-10-08T10:09:00Z", "session_id": "ci"},
        ]
        start = metrics._session_start(events)
        self.assertEqual(start.isoformat(), "2026-10-08T10:00:00+00:00")
        self.assertIsNone(metrics._session_start([]))
