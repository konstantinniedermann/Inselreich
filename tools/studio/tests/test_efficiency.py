import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from datetime import UTC, datetime
from pathlib import Path
from unittest import mock

import actions
import efficiency
import effort
import metrics


def assistant(mid, model, inp=0, cc5=0, cc1=0, cr=0, out=0, tools=(), ts=None):
    content = [
        {"type": "tool_use", "id": tid, "name": name, "input": data}
        for tid, name, data in tools
    ]
    entry = {
        "type": "assistant",
        "message": {
            "id": mid,
            "model": model,
            "content": content,
            "usage": {
                "input_tokens": inp,
                "cache_creation_input_tokens": cc5 + cc1,
                "cache_creation": {
                    "ephemeral_5m_input_tokens": cc5,
                    "ephemeral_1h_input_tokens": cc1,
                },
                "cache_read_input_tokens": cr,
                "output_tokens": out,
            },
        },
    }
    if ts:
        entry["timestamp"] = ts
    return entry


def result(tid, content):
    block = {"type": "tool_result", "tool_use_id": tid, "content": content}
    return {"type": "user", "message": {"role": "user", "content": [block]}}


def prompt(text):
    return {"type": "user", "message": {"role": "user", "content": text}}


def write(path: Path, lines: list) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    body = [x if isinstance(x, str) else json.dumps(x) for x in lines]
    path.write_text("\n".join(body) + "\n", encoding="utf-8")


def agent(root: Path, sid: str, name: str, meta: dict, lines: list) -> None:
    folder = root / sid / "subagents"
    write(folder / f"agent-{name}.jsonl", lines)
    (folder / f"agent-{name}.meta.json").write_text(json.dumps(meta), "utf-8")


class Fixture(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)
        read = ("t1", "Read", {"file_path": "/r/docs/big.md"})
        cat = ("t2", "Bash", {"command": "cat docs/other.md"})
        img = ("t3", "Read", {"file_path": "/r/shot.png"})
        write(
            self.root / "s1.jsonl",
            [
                assistant(
                    "m1", "claude-opus-4", cr=1000, out=40, tools=[read, cat, img]
                ),
                assistant(
                    "m1", "claude-opus-4", cr=1000, out=100
                ),  # gleiche ID: nur einmal
                result("t1", "x" * 5000),
                result("t2", [{"type": "text", "text": "y" * 300}]),
                result("t3", [{"type": "image", "source": {"data": "z" * 99999}}]),
                assistant("m2", "claude-opus-4", cr=50000, cc5=30000),
                "kaputte zeile",
            ],
        )
        meta_lead = {"agentType": "lead-tech"}
        agent(
            self.root,
            "s1",
            "a1",
            meta_lead,
            [
                prompt("Persona: lead-tech"),
                assistant("l1", "claude-opus-4", out=300),
            ],
        )
        meta_gp = {"agentType": "general-purpose"}
        agent(
            self.root,
            "s1",
            "a2",
            meta_gp,
            [
                prompt("Persona: tech-sim-engineer\nPaket: X"),
                assistant("g1", "claude-opus-4", out=100),
            ],
        )
        agent(
            self.root,
            "s1",
            "a3",
            {"agentType": "tech-sim-engineer"},
            [assistant("e1", "claude-sonnet-5", out=1000)],
        )
        agent(
            self.root,
            "s1",
            "a4",
            {"agentType": "general-purpose"},
            [
                prompt(
                    "Suche etwas\n1\n2\n3\n4\n5\nPersona: nicht-in-den-ersten-zeilen"
                ),
                assistant("p1", "claude-haiku-4", out=10),
            ],
        )
        persona_models = {"tech-sim-engineer": "sonnet"}  # Frontmatter-Modell
        self.data = efficiency.compute([self.root / "s1.jsonl"], persona_models)


class ComputeTest(Fixture):
    def test_classes_and_weights(self):
        # Gewichte: Output 5, Cache-Write 5 min 1,25, Cache-Read 0,1; sonnet 0,6, haiku 0,2
        l0 = 100 * 5 + 1000 * 0.1 + 30000 * 1.25 + 50000 * 0.1
        leads = 300 * 5
        builders = 1000 * 5 * 0.6 + 100 * 5
        other = 10 * 5 * 0.2
        total = l0 + leads + builders + other
        shares = self.data["class_share"]
        self.assertAlmostEqual(shares["L0"], l0 / total)
        self.assertAlmostEqual(shares["Leads"], leads / total)
        self.assertAlmostEqual(shares["Umsetzer"], builders / total)
        self.assertAlmostEqual(shares["Sonstiges"], other / total)
        self.assertEqual(shares["Review/QA/Merge"], 0)
        self.assertAlmostEqual(self.data["steuerung"], (l0 + leads) / total)
        self.assertAlmostEqual(self.data["umsetzer"], builders / total)

    def test_dedupe_per_message_id_takes_max(self):
        l0 = next(r for r in self.data["roles"] if r["role"] == "L0")
        self.assertEqual(l0["instances"], 1)
        self.assertEqual(self.data["calls"], 6)

    def test_persona_in_general_purpose_counts_as_role(self):
        names = {r["role"] for r in self.data["roles"]}
        self.assertIn("tech-sim-engineer", names)
        sim = next(r for r in self.data["roles"] if r["role"] == "tech-sim-engineer")
        self.assertEqual(sim["instances"], 2)

    def test_persona_only_counts_in_first_lines(self):
        names = {r["role"] for r in self.data["roles"]}
        self.assertIn("general-purpose", names)
        self.assertNotIn("nicht-in-den-ersten-zeilen", names)

    def test_persona_starts_on_opus(self):
        self.assertEqual(self.data["persona_opus"], 1)

    def test_five_minute_rewrite_after_first_call(self):
        l0 = next(r for r in self.data["roles"] if r["role"] == "L0")
        self.assertEqual(l0["rewrites"], 1)
        self.assertEqual(l0["start_ctx"], 1000)
        self.assertEqual(l0["ctx_mean"], 40500)
        self.assertEqual(l0["ctx_max"], 80000)

    def test_cost_kinds_sum_to_one(self):
        self.assertAlmostEqual(sum(self.data["kind_share"].values()), 1.0)
        self.assertGreater(self.data["kind_share"]["cache_write_5m"], 0)

    def test_opus_share(self):
        cache = 30000 * 1.25 + 50000 * 0.1 + 1000 * 0.1
        opus = 500 + 1500 + 500 + cache
        total = opus + 3000 + 10
        self.assertAlmostEqual(self.data["opus_share"], opus / total)

    def test_largest_reads_text_only(self):
        top = self.data["top_reads"]
        self.assertEqual([t["chars"] for t in top], [5000, 300])
        self.assertEqual(top[0]["path"], "/r/docs/big.md")
        self.assertEqual(top[1]["path"], "docs/other.md")

    def test_lead_context_median(self):
        self.assertEqual(self.data["lead_ctx_median"], 0)


class MedianAndEdgeTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.root = Path(tmp.name)

    def test_lead_context_is_median_of_instance_means(self):
        write(self.root / "s.jsonl", [assistant("m", "claude-opus-4", cr=10)])
        # Instanz-Mittel: 100k, 100k, 400k (Median 100k, arithmetisches Mittel 200k)
        for name, ctx in (("a", 100_000), ("b", 100_000), ("c", 400_000)):
            lines = [prompt("Start"), assistant(f"x{name}", "claude-opus-4", cr=ctx)]
            agent(self.root, "s", name, {"agentType": "lead-qa"}, lines)
        data = efficiency.compute([self.root / "s.jsonl"])
        self.assertEqual(data["lead_ctx_median"], 100_000)
        lead = next(r for r in data["roles"] if r["role"] == "lead-qa")
        self.assertEqual((lead["instances"], lead["ctx_mean"]), (3, 100_000))

    def test_dedupe_keeps_maximum_even_when_first_line_is_larger(self):
        write(
            self.root / "s.jsonl",
            [
                assistant("m", "claude-opus-4", out=100, cr=50),
                assistant("m", "claude-opus-4", out=7, cr=20),
            ],
        )
        calls = efficiency.scan(self.root / "s.jsonl")["calls"]
        self.assertEqual(len(calls), 1)
        self.assertEqual((calls[0]["output"], calls[0]["cache_read"]), (100, 50))

    def test_streaming_placeholder_output_is_not_counted(self):
        write(
            self.root / "s.jsonl",
            [
                assistant("m", "claude-opus-4", out=3),
                assistant("m", "claude-opus-4", out=900),
            ],
        )
        calls = efficiency.scan(self.root / "s.jsonl")["calls"]
        self.assertEqual(calls[0]["output"], 900)

    def test_no_l0_data_is_not_measured(self):
        write(self.root / "s.jsonl", [prompt("nur Text")])
        agent(
            self.root,
            "s",
            "a",
            {"agentType": "lead-qa"},
            [assistant("x", "claude-opus-4", out=5)],
        )
        data = efficiency.compute([self.root / "s.jsonl"])
        self.assertIsNone(data["l0_ctx_max"])
        text = efficiency.render_section(data)
        self.assertIn(
            "NICHT GEMESSEN: L0-Kontext Max",
            text.replace("nicht gemessen", "NICHT GEMESSEN"),
        )

    def test_unhashable_tool_use_id_is_ignored(self):
        read = ("t1", "Read", {"file_path": "/r/a.md"})
        write(
            self.root / "s.jsonl",
            [
                assistant("m", "claude-opus-4", out=5, tools=[read]),
                result(["liste"], "x"),
                result("t1", "y" * 2048),
            ],
        )
        data = efficiency.compute([self.root / "s.jsonl"])
        self.assertEqual(data["top_reads"], [{"path": "/r/a.md", "chars": 2048}])
        text = efficiency.render_section(data)
        self.assertIn("2.0 KB", text)

    def test_compute_never_raises(self):
        from unittest import mock

        write(self.root / "s.jsonl", [assistant("m", "claude-opus-4", out=5)])
        with mock.patch.object(efficiency, "_summary", side_effect=RuntimeError):
            self.assertIsNone(efficiency.compute([self.root / "s.jsonl"]))

    def test_largest_read_is_measured_in_kb(self):
        self.assertEqual(efficiency.ampel("largest_read", 40), "grün")
        self.assertEqual(efficiency.ampel("largest_read", 41), "gelb")
        self.assertEqual(efficiency.ampel("largest_read", 101), "rot")


class MissingTest(unittest.TestCase):
    def test_missing_and_broken_do_not_crash(self):
        with tempfile.TemporaryDirectory() as tmp:
            bad = Path(tmp) / "bad.jsonl"
            bad.write_text("{{{\n\xff", encoding="utf-8")
            self.assertIsNone(efficiency.compute([Path(tmp) / "fehlt.jsonl"]))
            self.assertIsNone(efficiency.compute([]))
            self.assertIsNone(efficiency.compute([bad]))
            text = efficiency.render_section(None)
            self.assertIn("## Effizienz", text)
            self.assertIn("nicht gemessen", text)


class AmpelTest(unittest.TestCase):
    def test_greater_than(self):
        self.assertEqual(efficiency.ampel("steuerung", 0.40), "grün")
        self.assertEqual(efficiency.ampel("steuerung", 0.41), "gelb")
        self.assertEqual(efficiency.ampel("steuerung", 0.50), "gelb")
        self.assertEqual(efficiency.ampel("steuerung", 0.51), "rot")

    def test_less_than(self):
        self.assertEqual(efficiency.ampel("umsetzer", 0.15), "grün")
        self.assertEqual(efficiency.ampel("umsetzer", 0.14), "gelb")
        self.assertEqual(efficiency.ampel("umsetzer", 0.07), "rot")

    def test_greater_equal(self):
        self.assertEqual(efficiency.ampel("persona_opus", 0), "grün")
        self.assertEqual(efficiency.ampel("persona_opus", 1), "gelb")
        self.assertEqual(efficiency.ampel("persona_opus", 5), "rot")

    def test_not_measured(self):
        self.assertEqual(efficiency.ampel("steuerung", None), "nicht gemessen")

    def test_thresholds_constants(self):
        t = efficiency.THRESHOLDS
        self.assertEqual(
            (t["cache_write_5m"]["gelb"], t["cache_write_5m"]["rot"]), (0.15, 0.25)
        )
        self.assertEqual(
            (t["lead_ctx"]["gelb"], t["lead_ctx"]["rot"]), (80_000, 150_000)
        )
        self.assertEqual(
            (t["l0_ctx_max"]["gelb"], t["l0_ctx_max"]["rot"]), (250_000, 500_000)
        )
        self.assertEqual((t["opus"]["gelb"], t["opus"]["rot"]), (0.60, 0.80))
        self.assertEqual(
            (t["largest_read"]["gelb"], t["largest_read"]["rot"]), (40, 100)
        )


class RenderTest(Fixture):
    def test_section_content(self):
        text = efficiency.render_section(self.data)
        for needle in (
            "## Effizienz",
            "Steuerungsanteil (L0 + Leads)",
            "Umsetzeranteil",
            "Cache-Write 5 min",
            "Lead-Kontext Median",
            "L0-Kontext Max",
            "opus-Anteil",
            "Persona-Starts als general-purpose auf opus (Instanzen)",
            "Grösste gelesene Datei",
            "/r/docs/big.md",
            "tech-sim-engineer",
        ):
            self.assertIn(needle, text)
        self.assertNotIn("shot.png", text)

    def no_gh(self):
        patch = mock.patch.object(actions, "run_gh", side_effect=OSError)
        patch.start()
        self.addCleanup(patch.stop)

    def test_cli_efficiency_prints_actions_lines(self):
        self.no_gh()
        buffer = io.StringIO()
        with (
            unittest_env({"STUDIO_TRANSCRIPTS": str(self.root)}),
            redirect_stdout(buffer),
        ):
            metrics.main(["--efficiency"])
        self.assertIn("nicht erfasst: Inselreich-Minuten", buffer.getvalue())

    def test_cli_efficiency_prints_only_section(self):
        self.no_gh()
        env = {"STUDIO_TRANSCRIPTS": str(self.root)}
        buffer = io.StringIO()
        with unittest_env(env), redirect_stdout(buffer):
            code = metrics.main(["--efficiency"])
        self.assertEqual(code, 0)
        out = buffer.getvalue()
        self.assertTrue(out.startswith("## Effizienz"))
        self.assertNotIn("## Aufwand", out)

    def test_cli_sessions_limit(self):
        self.no_gh()
        write(self.root / "s0.jsonl", [assistant("z", "claude-opus-4", out=1)])
        env = {"STUDIO_TRANSCRIPTS": str(self.root)}
        (self.root / "s0.jsonl").touch()  # neuester
        buffer = io.StringIO()
        with unittest_env(env), redirect_stdout(buffer):
            metrics.main(["--efficiency", "--sessions", "1"])
        self.assertIn("1 Session", buffer.getvalue())

    def test_cli_without_transcripts(self):
        self.no_gh()
        env = {"STUDIO_TRANSCRIPTS": str(self.root / "leer")}
        buffer = io.StringIO()
        with unittest_env(env), redirect_stdout(buffer):
            code = metrics.main(["--efficiency"])
        self.assertEqual(code, 0)
        self.assertIn("nicht gemessen", buffer.getvalue())


def unittest_env(values: dict):
    from unittest import mock

    return mock.patch.dict("os.environ", values)


def pkg(ts, pid, status, owner="lead-art"):
    return {
        "kind": "package",
        "ts": ts,
        "package_id": pid,
        "status": status,
        "owner": owner,
    }


class IdleGapTest(unittest.TestCase):
    def test_gap_review_to_next_first_active(self):
        events = [
            pkg("2026-10-03T10:00:00Z", "A", "active"),
            pkg("2026-10-03T10:30:00Z", "A", "review"),
            pkg("2026-10-03T10:37:30Z", "B", "active"),
        ]
        gaps = efficiency.idle_gaps(events)
        self.assertEqual(len(gaps), 1)
        self.assertEqual((gaps[0]["from"], gaps[0]["to"]), ("A", "B"))
        self.assertAlmostEqual(gaps[0]["minutes"], 7.5)

    def test_parallel_start_has_no_gap(self):
        events = [
            pkg("2026-10-03T10:00:00Z", "A", "active"),
            pkg("2026-10-03T10:00:01Z", "B", "active"),
            pkg("2026-10-03T10:30:00Z", "A", "review"),
        ]
        self.assertEqual(efficiency.idle_gaps(events), [])

    def test_other_owner_is_other_strand(self):
        events = [
            pkg("2026-10-03T10:30:00Z", "A", "review", "lead-art"),
            pkg("2026-10-03T10:31:00Z", "B", "active", "lead-tech"),
        ]
        self.assertEqual(efficiency.idle_gaps(events), [])

    def test_reactivation_is_not_a_new_start(self):
        events = [
            pkg("2026-10-03T10:00:00Z", "A", "active"),
            pkg("2026-10-03T10:10:00Z", "A", "review"),
            pkg("2026-10-03T10:20:00Z", "A", "active"),
        ]
        self.assertEqual(efficiency.idle_gaps(events), [])

    def test_session_break_is_excluded(self):
        events = [
            pkg("2026-10-03T10:00:00Z", "A", "review"),
            pkg("2026-10-04T08:00:00Z", "B", "active"),
        ]
        self.assertEqual(efficiency.idle_gaps(events), [])

    def test_owner_taken_from_first_active(self):
        events = [
            pkg("2026-10-03T10:00:00Z", "A", "active", "lead-design"),
            pkg("2026-10-03T10:30:00Z", "A", "review", "lead-qa"),
            pkg("2026-10-03T10:35:00Z", "B", "active", "lead-design"),
        ]
        gaps = efficiency.idle_gaps(events)
        self.assertEqual(len(gaps), 1)
        self.assertEqual(gaps[0]["owner"], "lead-design")
        self.assertAlmostEqual(gaps[0]["minutes"], 5.0)

    def test_prefix_filters_both_sides(self):
        events = [
            pkg("2026-10-03T09:00:00Z", "H-A", "active"),
            pkg("2026-10-03T10:00:00Z", "H-A", "review"),
            pkg("2026-10-03T10:05:00Z", "X-B", "active"),
            pkg("2026-10-03T10:09:00Z", "H-C", "active"),
        ]
        gaps = efficiency.idle_gaps(events, "H-")
        self.assertEqual([(g["from"], g["to"]) for g in gaps], [("H-A", "H-C")])

    def test_render_line(self):
        events = [
            pkg("2026-10-03T09:00:00Z", "A", "active"),
            pkg("2026-10-03T10:00:00Z", "A", "review"),
            pkg("2026-10-03T10:04:00Z", "B", "active"),
            pkg("2026-10-03T10:20:00Z", "B", "review"),
            pkg("2026-10-03T10:30:00Z", "C", "active"),
        ]
        text = efficiency.render_idle(efficiency.idle_gaps(events))
        self.assertIn("Median 7", text)
        self.assertIn("A → B", text)

    def test_render_without_data(self):
        self.assertIn("nicht gemessen", efficiency.render_idle([]))


class AdjustedControlTest(unittest.TestCase):
    def build(self, lead_prompts):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        write(root / "s1.jsonl", [assistant("m1", "claude-opus-4", out=100)])
        for index, text in enumerate(lead_prompts):
            agent(
                root,
                "s1",
                f"l{index}",
                {"agentType": "lead-tech"},
                [prompt(text), assistant(f"x{index}", "claude-opus-4", out=200)],
            )
        agent(
            root,
            "s1",
            "w1",
            {"agentType": "tech-sim-engineer"},
            [
                prompt(
                    "Persona: tech-sim-engineer\nBudget: keins, keine Agenten starten"
                ),
                assistant("w", "claude-sonnet-5", out=500),
            ],
        )
        return efficiency.compute([root / "s1.jsonl"], {})

    def test_budget_keins_lead_is_removed(self):
        data = self.build(
            [
                "Persona: lead-tech\nPaket: P\nModell: opus\nBudget: keins, keine Agenten starten",
                "Persona: lead-tech\nPaket: Q\nBudget: 4 Starts / Parallelität 2",
            ]
        )
        self.assertEqual(data["steuerung_heraus_n"], 1)
        self.assertGreater(data["steuerung_heraus"], 0)
        self.assertLess(data["steuerung_bereinigt"], data["steuerung"])
        self.assertAlmostEqual(
            data["steuerung"],
            data["steuerung_bereinigt"] + data["steuerung_heraus"],
            places=9,
        )

    def test_markdown_header_and_case(self):
        data = self.build(["- **Persona:** lead-tech\n- **Budget:** KEINS"])
        self.assertEqual(data["steuerung_heraus_n"], 1)

    def test_budget_line_outside_header_block_counts_as_control(self):
        text = "Persona: lead-tech\n" + "x\n" * 12 + "Budget: keins"
        data = self.build([text])
        self.assertEqual(data["steuerung_heraus_n"], 0)
        self.assertEqual(data["steuerung_bereinigt"], data["steuerung"])

    def test_other_budget_line_and_worker_stay_control(self):
        # Umsetzer w1 hat in jedem Aufbau „Budget: keins“ und zählt nie mit
        data = self.build(
            ["Persona: lead-tech\nBudget: 1 Start (lead-tech, Phase plan-X)"]
        )
        self.assertEqual(data["steuerung_heraus_n"], 0)

    def test_lead_rows_carry_flag(self):
        data = self.build(["Persona: lead-tech\nBudget: keins"])
        self.assertEqual([r["budget_none"] for r in data["lead_stats"]["rows"]], [True])

    def test_render_line_without_ampel_prefix(self):
        data = self.build(["Persona: lead-tech\nBudget: keins"])
        text = efficiency.render_section(data)
        line = next(x for x in text.splitlines() if "Steuerungsanteil bereinigt" in x)
        self.assertTrue(line.startswith("- Steuerungsanteil bereinigt (E-049"))
        self.assertIn("roh = bereinigt + herausgerechnet", line)
        self.assertIn("Steuerungsanteil (L0 + Leads)", text)  # Rohzeile bleibt

    def test_line_never_creates_ampel_incident(self):
        data = self.build(["Persona: lead-tech\nBudget: keins"])
        text = "- erzeugt: 2026-10-09T10:00:00Z\n" + efficiency.render_section(data)
        self.assertIn("Steuerungsanteil bereinigt", text)  # rot vor der Umsetzung
        red = text.replace("Bewertung grün", "Bewertung rot").replace(
            "Bewertung gelb", "Bewertung rot"
        )
        keep = [x for x in red.splitlines() if "Steuerungsanteil bereinigt" not in x]
        with_line = effort.parse_ampel_session("x", red)
        without = effort.parse_ampel_session("x", "\n".join(keep))
        self.assertIsNotNone(with_line)
        self.assertEqual(
            with_line["red"], without["red"]
        )  # Zeile ändert die Rot-Menge nie


class PhaseAdjustTest(unittest.TestCase):
    PROMPT = "Persona: lead-tech\nPaket: P\nBudget: 4 Starts"

    def build(self, leads, phases=None):
        """leads: Liste (name, prompt-Text); phases: Dict oder None."""
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        write(root / "s1.jsonl", [assistant("m1", "claude-opus-4", out=100)])
        for name, text in leads:
            agent(
                root,
                "s1",
                name,
                {"agentType": "lead-tech"},
                [prompt(text), assistant(f"x{name}", "claude-opus-4", out=200)],
            )
        agent(
            root,
            "s1",
            "w1",
            {"agentType": "tech-sim-engineer"},
            [
                prompt("Persona: tech-sim-engineer\nPaket: P"),
                assistant("w", "claude-sonnet-5", out=500),
            ],
        )
        return efficiency.compute([root / "s1.jsonl"], {}, phases=phases)

    def test_plan_phase_lead_is_removed(self):
        data = self.build([("l1", self.PROMPT)], {"s1:l1": "plan-REL-15"})
        self.assertEqual(data["steuerung_heraus_n"], 1)
        self.assertGreater(data["steuerung_heraus_grund"]["plan"], 0)
        self.assertAlmostEqual(
            data["steuerung"],
            data["steuerung_bereinigt"] + data["steuerung_heraus"],
            places=9,
        )

    def test_impl_phase_and_no_phase_count_as_control(self):
        data = self.build(
            [("l1", self.PROMPT), ("l2", self.PROMPT)], {"s1:l1": "impl-REL-15"}
        )
        self.assertEqual(data["steuerung_heraus_n"], 0)
        self.assertEqual(data["steuerung_bereinigt"], data["steuerung"])

    def test_phase_prefix_case_insensitive(self):
        data = self.build([("l1", self.PROMPT)], {"s1:l1": "Gate-plan-TOOL"})
        self.assertGreater(data["steuerung_heraus_grund"]["gate"], 0)
        self.assertEqual(data["steuerung_heraus_grund"]["plan"], 0)

    def test_design_phase(self):
        data = self.build([("l1", self.PROMPT)], {"s1:l1": "design-X"})
        self.assertGreater(data["steuerung_heraus_grund"]["design"], 0)

    def test_phase_and_budget_none_counted_once(self):
        text = "Persona: lead-tech\nBudget: keins, keine Agenten starten"
        data = self.build([("l1", text)], {"s1:l1": "plan-X"})
        self.assertEqual(data["steuerung_heraus_n"], 1)
        self.assertGreater(data["steuerung_heraus_grund"]["plan"], 0)
        self.assertEqual(data["steuerung_heraus_grund"]["budget_keins"], 0)

    def test_budget_none_without_phase_reason(self):
        text = "Persona: lead-tech\nBudget: keins"
        data = self.build([("l1", text)], None)
        self.assertGreater(data["steuerung_heraus_grund"]["budget_keins"], 0)
        self.assertAlmostEqual(
            sum(data["steuerung_heraus_grund"].values()),
            data["steuerung_heraus"],
            places=9,
        )

    def test_without_phases_unchanged(self):
        text = "Persona: lead-tech\nBudget: keins"
        data = self.build([("l1", text), ("l2", self.PROMPT)], None)
        self.assertEqual(data["steuerung_heraus_n"], 1)

    def test_raw_and_classes_unchanged(self):
        leads = [("l1", self.PROMPT)]
        plain = self.build(leads, None)
        phased = self.build(leads, {"s1:l1": "plan-X"})
        self.assertEqual(plain["class_share"], phased["class_share"])
        self.assertEqual(plain["steuerung"], phased["steuerung"])

    def test_render_adjusted_line_reasons(self):
        data = self.build([("l1", self.PROMPT)], {"s1:l1": "plan-X"})
        lines = efficiency.render_section(data).splitlines()
        line = next(x for x in lines if "bereinigt" in x and "E-049" in x)
        self.assertIn("Plan ", line)
        self.assertIn("%", line.split("Plan ", 1)[1])
        for prefix in ("- ROT:", "- GELB:", "- GRÜN:"):
            self.assertFalse(line.startswith(prefix))

    def test_lead_rows_have_phase(self):
        data = self.build([("l1", self.PROMPT)], {"s1:l1": "plan-X"})
        self.assertEqual(data["lead_stats"]["rows"][0]["phase"], "plan-X")
        self.assertIn("plan-X", efficiency.render_rewrites(data))


class SinceTest(unittest.TestCase):
    EARLY = "2026-10-10T06:00:00Z"
    LATE = "2026-10-10T07:00:00Z"
    SINCE = datetime(2026, 10, 10, 6, 30, tzinfo=UTC)

    def transcript(self, lead_prompt=None, times=(EARLY, LATE)):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        lines = [prompt(lead_prompt)] if lead_prompt else []
        for index, when in enumerate(times):
            lines.append(assistant(f"m{index}", "claude-opus-4", out=10, ts=when))
        write(root / "s1.jsonl", lines)
        return root / "s1.jsonl"

    def test_only_calls_since_count(self):
        main = self.transcript()
        self.assertEqual(efficiency.compute([main])["calls"], 2)
        self.assertEqual(efficiency.compute([main], since=self.SINCE)["calls"], 1)

    def test_since_boundary_inclusive(self):
        main = self.transcript(times=("2026-10-10T06:30:00Z",))
        self.assertEqual(efficiency.compute([main], since=self.SINCE)["calls"], 1)

    def test_reads_before_since_are_skipped(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        main = Path(tmp.name) / "s1.jsonl"
        read = ("t1", "Read", {"file_path": "/r/docs/big.md"})
        early = result("t1", "x" * 100)
        early["timestamp"] = self.EARLY
        write(
            main,
            [
                assistant("m0", "claude-opus-4", out=1, tools=[read], ts=self.EARLY),
                early,
                assistant("m1", "claude-opus-4", out=1, ts=self.LATE),
            ],
        )
        self.assertEqual(len(efficiency.compute([main])["top_reads"]), 1)
        self.assertEqual(efficiency.compute([main], since=self.SINCE)["top_reads"], [])

    def read_pair(self, use_at, result_at):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        main = Path(tmp.name) / "s1.jsonl"
        read = ("t1", "Read", {"file_path": "docs/x.md"})
        late = result("t1", "x" * 3000)
        late["timestamp"] = result_at
        write(
            main,
            [
                assistant("m0", "claude-opus-4", out=1, tools=[read], ts=use_at),
                late,
                assistant("m1", "claude-opus-4", out=1, ts=self.LATE),
            ],
        )
        return main

    def test_since_read_result_after_boundary_counts(self):
        main = self.read_pair("2026-10-10T06:00:00Z", "2026-10-10T06:45:00Z")
        found = efficiency.scan(main, since=self.SINCE)
        self.assertEqual(found["reads"], [{"path": "docs/x.md", "chars": 3000}])

    def test_since_read_before_boundary_is_skipped(self):
        main = self.read_pair("2026-10-10T06:00:00Z", "2026-10-10T06:10:00Z")
        self.assertEqual(efficiency.scan(main, since=self.SINCE)["reads"], [])

    def test_since_call_before_boundary_not_counted(self):
        main = self.read_pair("2026-10-10T06:00:00Z", "2026-10-10T06:45:00Z")
        self.assertEqual(len(efficiency.scan(main, since=self.SINCE)["calls"]), 1)

    def test_prompt_before_since_keeps_role(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        write(
            root / "s1.jsonl", [assistant("m0", "claude-opus-4", out=1, ts=self.LATE)]
        )
        agent(
            root,
            "s1",
            "w1",
            {"agentType": "general-purpose"},
            [
                prompt("Persona: lead-tech\nPaket: P"),
                assistant("w0", "claude-opus-4", out=1, ts=self.EARLY),
                assistant("w1", "claude-opus-4", out=1, ts=self.LATE),
            ],
        )
        data = efficiency.compute([root / "s1.jsonl"], since=self.SINCE)
        self.assertEqual(data["lead_stats"]["rows"][0]["role"], "lead-tech")
        self.assertEqual(data["lead_stats"]["rows"][0]["turns"], 1)

    def test_instance_without_calls_since_drops_out(self):
        main = self.transcript(times=(self.EARLY,))
        self.assertIsNone(efficiency.compute([main], since=self.SINCE))


if __name__ == "__main__":
    unittest.main()
