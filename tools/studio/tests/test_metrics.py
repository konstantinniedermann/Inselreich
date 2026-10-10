import argparse
import contextlib
import io
import json
import os
import shutil
import subprocess
import tempfile
import unittest
from datetime import UTC, datetime
from pathlib import Path
from unittest import mock

import clock
import metrics
import paths
import studio_docs

import tests.test_efficiency as eff
from tests.test_effort import ev, scenario

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

    SINCE = "2026-09-30T12:00:30Z"  # Events des scenario liegen vor und nach t=30 s

    def since_day(self):
        since = datetime.fromisoformat(self.SINCE)
        return since.astimezone().strftime("%Y-%m-%d")

    def test_since_filters_events_and_names_file(self):
        code, _ = self.run_cli("--session", "s1", "--since", self.SINCE)
        self.assertEqual(code, 0)
        path = self.out / f"S-{self.since_day()}-s1.md"
        text = path.read_text(encoding="utf-8")
        self.assertIn("- Ab: 2026-09-30T12:00:30+00:00 (Studio-Session, R434)", text)
        self.run_cli("--session", "s1")
        plain = (self.out / "S-2026-09-30-s1.md").read_text(encoding="utf-8")
        self.assertNotIn("- Ab:", plain)
        self.assertIn("Agenten: 2,", text)  # a1 und a2 liegen vor t=30 s

    def test_since_cost_is_delta(self):
        extra = [
            ev(
                "usage",
                20,
                session_cost={"total_usd": 1.0, "models": {"m": {"usd": 1}}},
            ),
            ev(
                "usage",
                40,
                session_cost={"total_usd": 3.5, "models": {"m": {"usd": 3}}},
            ),
        ]
        write_events(self.home, scenario() + extra)
        result = metrics.build(
            metrics_args("s1", since=datetime.fromisoformat(self.SINCE))
        )
        cost = result[1]["session_cost"]
        self.assertEqual(cost["total_usd"], 2.5)
        self.assertEqual(cost["models"]["m"]["usd"], 2)

    def test_cost_delta_rules(self):
        self.assertEqual(
            metrics._cost_delta({"a": 5, "b": None}, {"a": 2}), {"a": 3, "b": None}
        )
        self.assertEqual(metrics._cost_delta({"a": 5}, None), {"a": 5})
        self.assertIsNone(metrics._cost_delta(None, {"a": 1}))

    def test_efficiency_shows_flake_suspect(self):
        eff.write(
            self.transcripts / "s1.jsonl",
            [eff.assistant("m1", "claude-opus-4", out=10)],
        )
        base = {"suite": "studio", "commit": "abc1234", "diff": ""}
        write_events(
            self.home,
            [
                *scenario(),
                {
                    **ev("test_failed", 1, source="make", names=["K.test_a"], **base),
                },
                ev("test_passed", 2, source="make", **base),
            ],
        )
        with mock.patch.object(metrics.actions, "render", return_value=""):
            code, out = self.run_cli("--efficiency")
        self.assertEqual(code, 0)
        self.assertIn("Flake-Verdacht: K.test_a", out)

    def test_efficiency_flake_not_measured_without_test_events(self):
        eff.write(
            self.transcripts / "s1.jsonl",
            [eff.assistant("m1", "claude-opus-4", out=10)],
        )
        with mock.patch.object(metrics.actions, "render", return_value=""):
            code, out = self.run_cli("--efficiency")
        self.assertEqual(code, 0)
        flake = next(x for x in out.splitlines() if "Flake-Verdacht)" in x)
        self.assertIn("nicht gemessen", flake)

    def test_since_invalid_exit_2(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err), self.assertRaises(SystemExit) as cm:
            metrics.main(["--session", "latest", "--since", "gestern"])
        self.assertEqual(cm.exception.code, 2)
        self.assertIn("ungültiger Zeitpunkt", err.getvalue())

    def test_since_with_milestone_rejected(self):
        err = io.StringIO()
        with contextlib.redirect_stderr(err), self.assertRaises(SystemExit) as cm:
            metrics.main(["--milestone", "M9", "--since", self.SINCE])
        self.assertEqual(cm.exception.code, 2)
        self.assertIn("nur mit --session oder --efficiency", err.getvalue())

    def test_parse_since_variants(self):
        self.assertEqual(
            metrics._parse_since("2026-10-10T06:30:00Z").isoformat(),
            "2026-10-10T06:30:00+00:00",
        )
        naive = metrics._parse_since("2026-10-10T06:30:00")
        self.assertEqual(
            naive, datetime.fromisoformat("2026-10-10T06:30:00").astimezone()
        )

    def test_default_out_is_worktree(self):
        wt = Path(self.tmp.name).resolve() / "wt"
        wt.mkdir()
        (wt / ".git").write_text("gitdir: /irgendwo/.git/worktrees/wt\n", "utf-8")
        old = Path.cwd()
        os.chdir(wt)
        self.addCleanup(os.chdir, old)
        base = Path(self.tmp.name).resolve()
        seen: list[Path] = []
        real_read_version = studio_docs.read_version

        def spy(path):
            seen.append(Path(path))
            return real_read_version(path)

        buffer = io.StringIO()
        with (
            mock.patch.dict(os.environ),
            contextlib.redirect_stdout(buffer),
            mock.patch.object(metrics, "format_markdown", lambda path: None),
            mock.patch.object(paths, "repo_root", lambda start=None: base),
            mock.patch.object(studio_docs, "read_version", spy),
        ):
            os.environ.pop("STUDIO_DOCS")
            code = metrics.main(["--session", "s1"])
        self.assertEqual(code, 0)
        self.assertTrue(seen)
        self.assertTrue(all(str(p).startswith(str(base)) for p in seen))
        self.assertTrue(
            (wt / "docs" / "studio" / "metriken" / "S-2026-09-30-s1.md").exists()
        )

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
        # Uhr springt zwischen den Läufen eine Sekunde weiter (Sekundengrenze in CI)
        ticks = iter(range(1, 1000))

        def ticking():
            return datetime(2026, 9, 30, 12, 0, next(ticks), tzinfo=UTC)

        self.run_cli("--session", "s1")
        path = self.out / "S-2026-09-30-s1.md"

        def body(text):
            # Zeitstempel steht als "erzeugt" im Text und als "created" im JSON-Block
            return [
                line
                for line in text.splitlines()
                if "erzeugt" not in line and '"created"' not in line
            ]

        with clock.frozen(ticking):
            self.run_cli("--session", "s1")
            first = path.read_text(encoding="utf-8")
            self.run_cli("--session", "s1")
        self.assertNotEqual(first, path.read_text(encoding="utf-8"))
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


class PhasesTest(unittest.TestCase):
    """Phase der Freigabe kommt aus den ungefilterten Events (R441 B1)."""

    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        base = Path(tmp.name)
        self.out = base / "out"
        self.transcripts = base / "transcripts"
        events = [
            ev("session_start", 0, agent_id="main", status="idle"),
            ev(
                "budget",
                10,
                agent_id="",
                source="log",
                role="lead-tech",
                budget={"granted": 4, "parallel": 1, "phase": "plan-REL-15"},
            ),
            ev("agent_start", 100, agent_id="a9", role="lead-tech", status="active"),
            ev("agent_stop", 200, agent_id="a9", role="lead-tech", status="done"),
        ]
        write_events(base / "home", events)
        self.write_transcripts()
        patch = mock_env(
            STUDIO_HOME=str(base / "home"),
            STUDIO_DOCS=str(base / "docs"),
            STUDIO_TRANSCRIPTS=str(self.transcripts),
        )
        patch.__enter__()
        self.addCleanup(patch.__exit__, None, None, None)

    def write_transcripts(self):
        main = self.transcripts / "s1.jsonl"
        eff.write(main, [eff.assistant("m1", "claude-opus-4", out=100)])
        eff.agent(
            self.transcripts,
            "s1",
            "a9",
            {"agentType": "lead-tech"},
            [
                eff.prompt("Persona: lead-tech\nPaket: REL-15\nBudget: 4 Starts"),
                eff.assistant("x", "claude-opus-4", out=200),
            ],
        )

    def args(self, **kw):
        return argparse.Namespace(
            session="s1", milestone=None, out=None, **{"since": None, **kw}
        )

    def test_phases_without_since(self):
        result = metrics.build(self.args())
        grund = result[1]["efficiency"]["steuerung_heraus_grund"]
        self.assertGreater(grund["plan"], 0)

    def test_phases_from_unfiltered_events_with_since(self):
        # Freigabe (t=10) vor since (t=50), Lead-Start (t=100) danach,
        # kein früherer session_cost-Stand
        since = datetime(2026, 9, 30, 12, 0, 50, tzinfo=UTC)
        result = metrics.build(self.args(since=since))
        grund = result[1]["efficiency"]["steuerung_heraus_grund"]
        self.assertGreater(grund["plan"], 0)

    def test_session_file_uses_lead_phases(self):
        buffer = io.StringIO()
        with (
            contextlib.redirect_stdout(buffer),
            mock.patch.object(metrics, "format_markdown", lambda path: None),
        ):
            code = metrics.main(["--session", "s1", "--out", str(self.out)])
        self.assertEqual(code, 0)
        text = next(self.out.glob("S-*.md")).read_text(encoding="utf-8")
        line = next(x for x in text.splitlines() if "Steuerungsanteil bereinigt" in x)
        self.assertIn("Plan ", line)
        self.assertNotIn("Plan 0.0 %", line)


def metrics_args(session=None, milestone=None, since=None):
    return argparse.Namespace(
        session=session, milestone=milestone, out=None, since=since
    )


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
