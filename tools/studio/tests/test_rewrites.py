import io
import tempfile
import unittest
from contextlib import redirect_stdout
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest import mock

import efficiency
import metrics

from tests.test_efficiency import agent, assistant, prompt, write

T0 = datetime(2026, 10, 8, 10, 0, tzinfo=UTC)
BASH = ("b1", "Bash", {"command": "make check"})
OPUS = "claude-opus-4"


def at(seconds, entry):
    stamp = (T0 + timedelta(seconds=seconds)).isoformat().replace("+00:00", "Z")
    return {**entry, "timestamp": stamp}


class FamilyTest(unittest.TestCase):
    def test_package_family(self):
        cases = {
            "ART-03": "Grafik",
            "art02": "Grafik",
            "WALD-1": "Grafik",
            "h-r2": "Grafik",
            "M5": "Funktion",
            "M10-FIX": "Funktion",
            "REL-07": "Release",
            "INT-2": "Release",
            "TOOL-AMPEL": "Betrieb",
            "RETRO-X": "Betrieb",
            "XYZ": "Sonstiges",
            None: "Sonstiges",
        }
        for pkg, family in cases.items():
            self.assertEqual(efficiency.package_family(pkg), family, pkg)


class RewriteFixture(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        write(
            self.root / "s1.jsonl",
            [
                at(0, assistant("m1", OPUS, cc5=30000, tools=[BASH])),
                at(301, assistant("m2", OPUS, cc5=30000)),  # zählt
                at(600, assistant("m3", OPUS, cc5=30000)),  # 299 s: nein
                at(1000, assistant("m4", OPUS, cc5=10000)),  # < 20k: nein
                at(1400, assistant("m5", OPUS, cc5=15000, cc1=10000)),  # 5m + 1h: ja
            ],
        )
        agent(
            self.root,
            "s1",
            "a1",
            {"agentType": "general-purpose"},
            [
                at(0, prompt("Persona: tech-sim-engineer\nPaket: TOOL-AMPEL")),
                at(1, assistant("e1", "claude-sonnet-5", cc5=1000, tools=[BASH])),
                at(401, assistant("e2", "claude-sonnet-5", cc5=25000)),
            ],
        )
        self.data = efficiency.compute([self.root / "s1.jsonl"])
        self.stats = self.data["rewrite_stats"]

    def test_counts_only_pauses_over_300s(self):
        self.assertEqual(self.stats["count"], 3)
        by_role = {r["role"]: r for r in self.stats["by_role"]}
        self.assertEqual(by_role["L0"]["count"], 2)
        self.assertEqual(by_role["tech-sim-engineer"]["count"], 1)

    def test_weight_uses_kind_and_model_factor(self):
        by_role = {r["role"]: r for r in self.stats["by_role"]}
        self.assertAlmostEqual(
            by_role["L0"]["weight"], 30000 * 1.25 + (15000 * 1.25 + 10000 * 2.0)
        )
        self.assertAlmostEqual(
            by_role["tech-sim-engineer"]["weight"], 25000 * 1.25 * 0.6
        )

    def test_bash_before_and_median_pause(self):
        by_role = {r["role"]: r for r in self.stats["by_role"]}
        self.assertAlmostEqual(by_role["L0"]["bash_share"], 0.5)
        self.assertAlmostEqual(by_role["L0"]["median_pause_min"], (301 + 400) / 2 / 60)
        self.assertAlmostEqual(by_role["tech-sim-engineer"]["bash_share"], 1.0)

    def test_family_and_total_share(self):
        fam = {f["family"]: f for f in self.stats["by_family"]}
        self.assertEqual(fam["Betrieb"]["count"], 1)
        self.assertEqual(fam["Sonstiges"]["count"], 2)
        self.assertGreater(self.stats["total_cost"], self.stats["weight"])

    def test_json_safe(self):
        self.assertIsNotNone(efficiency.json_safe(self.data))

    def test_render(self):
        text = efficiency.render_rewrites(self.data)
        self.assertIn("Neuschreibungen nach Pause > 5 min", text)
        self.assertIn("tech-sim-engineer", text)
        self.assertIn("Betrieb", text)
        self.assertIn("3 ", text)

    def test_render_limits_rows(self):
        stats = dict(self.stats)
        stats["by_role"] = [
            {**self.stats["by_role"][0], "role": f"r{i}"} for i in range(20)
        ]
        text = efficiency.render_rewrites({**self.data, "rewrite_stats": stats})
        self.assertEqual(text.count("| r"), efficiency.REWRITE_ROWS)


class RewriteEmptyTest(unittest.TestCase):
    def test_not_measured(self):
        self.assertIn(efficiency.NOT_MEASURED, efficiency.render_rewrites(None))
        self.assertIn(efficiency.NOT_MEASURED, efficiency.render_rewrites({}))

    def test_no_timestamps_gives_zero_events(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "s.jsonl"
            write(
                path,
                [assistant("m1", OPUS, cc5=30000), assistant("m2", OPUS, cc5=30000)],
            )
            data = efficiency.compute([path])
        self.assertEqual(data["rewrite_stats"]["count"], 0)
        self.assertIn("keine", efficiency.render_rewrites(data))

    def test_cli_prints_section(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "s.jsonl"
            write(
                path,
                [
                    at(0, assistant("m1", OPUS, cc5=30000)),
                    at(400, assistant("m2", OPUS, cc5=30000)),
                ],
            )
            out = io.StringIO()
            with (
                mock.patch.object(metrics, "latest_transcripts", return_value=[path]),
                mock.patch.object(metrics, "load_events", return_value=[]),
                mock.patch.object(metrics.actions, "run_gh", side_effect=OSError),
                redirect_stdout(out),
            ):
                metrics.main(["--efficiency"])
        self.assertIn("Neuschreibungen nach Pause > 5 min", out.getvalue())


STATUS = ("s1", "Bash", {"command": "python3 tools/studio/log.py status --role x"})
OTHER = ("o1", "Read", {"file_path": "a"})
LEAD_PROMPT = "Persona: lead-tech\nPaket: TOOL-AMPEL-M1"


class TurnEndTest(unittest.TestCase):
    def stats_for(self, first_tools):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "s.jsonl"
            write(
                path,
                [
                    at(0, assistant("m1", OPUS, cc5=1000, tools=first_tools)),
                    at(301, assistant("m2", OPUS, cc5=30000)),
                ],
            )
            return efficiency.compute([path])["rewrite_stats"]

    def test_no_tool_is_turn_end(self):
        row = self.stats_for([])["by_role"][0]
        self.assertAlmostEqual(row["turn_end_share"], 1.0)
        self.assertAlmostEqual(row["bash_share"], 0.0)

    def test_bash_is_not_turn_end(self):
        row = self.stats_for([BASH])["by_role"][0]
        self.assertAlmostEqual(row["turn_end_share"], 0.0)
        self.assertAlmostEqual(row["bash_share"], 1.0)

    def test_total_turn_end_weight_share(self):
        stats = self.stats_for([])
        self.assertAlmostEqual(stats["turn_end_weight_share"], 1.0)
        self.assertIn(
            "vorher Turn-Ende", efficiency.render_rewrites({"rewrite_stats": stats})
        )


class LeadTableTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        write(
            self.root / "s1.jsonl",
            [at(0, assistant("m1", OPUS, cc5=1000, tools=[BASH]))],
        )
        agent(
            self.root,
            "s1",
            "a1",
            {"agentType": "general-purpose"},
            [
                at(0, prompt(LEAD_PROMPT)),
                at(1, assistant("l1", OPUS, cc5=1000, tools=[STATUS])),  # Status
                at(2, assistant("l2", OPUS, cc5=1000, tools=[STATUS, OTHER])),  # nein
                at(3, assistant("l3", OPUS, cc5=1000, tools=[BASH])),  # nein
                at(4, assistant("l4", OPUS, cc5=1000)),  # Turn ohne Tool
            ],
        )
        agent(
            self.root,
            "s1",
            "a2",
            {"agentType": "general-purpose"},
            [
                at(0, prompt("Persona: tech-sim-engineer\nPaket: X")),
                at(1, assistant("e1", OPUS, cc5=1000, tools=[STATUS])),
            ],
        )
        self.data = efficiency.compute([self.root / "s1.jsonl"])
        self.leads = self.data["lead_stats"]

    def test_only_leads(self):
        self.assertEqual([r["role"] for r in self.leads["rows"]], ["lead-tech"])

    def test_turns_and_status_turns(self):
        row = self.leads["rows"][0]
        self.assertEqual(row["package"], "TOOL-AMPEL-M1")
        self.assertEqual(row["turns"], 4)
        self.assertEqual(row["status_turns"], 1)
        self.assertEqual(self.leads["instances"], 1)
        self.assertEqual(self.leads["turns"], 4)
        self.assertEqual(self.leads["status_turns"], 1)

    def test_render_and_json(self):
        text = efficiency.render_rewrites(self.data)
        self.assertIn("Lead-Instanzen", text)
        self.assertIn("lead-tech", text)
        self.assertNotIn("| tech-sim-engineer | X", text)
        self.assertIsNotNone(efficiency.json_safe(self.data))

    def test_row_limit(self):
        rows = [{**self.leads["rows"][0], "role": f"lead-{i}"} for i in range(20)]
        text = efficiency.render_rewrites(
            {**self.data, "lead_stats": {**self.leads, "rows": rows}}
        )
        self.assertEqual(text.count("| lead-"), efficiency.LEAD_ROWS)

    def test_empty(self):
        self.assertIn(
            efficiency.NOT_MEASURED, efficiency.render_rewrites({"rewrite_stats": None})
        )
        text = efficiency.render_rewrites(
            {"rewrite_stats": {"count": 0}, "lead_stats": None}
        )
        self.assertIn("keine", text)
