import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

import efficiency
import metrics


def assistant(mid, model, inp=0, cc5=0, cc1=0, cr=0, out=0, tools=()):
    content = [
        {"type": "tool_use", "id": tid, "name": name, "input": data}
        for tid, name, data in tools
    ]
    return {
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

    def test_cli_efficiency_prints_only_section(self):
        env = {"STUDIO_TRANSCRIPTS": str(self.root)}
        buffer = io.StringIO()
        with unittest_env(env), redirect_stdout(buffer):
            code = metrics.main(["--efficiency"])
        self.assertEqual(code, 0)
        out = buffer.getvalue()
        self.assertTrue(out.startswith("## Effizienz"))
        self.assertNotIn("## Aufwand", out)

    def test_cli_sessions_limit(self):
        write(self.root / "s0.jsonl", [assistant("z", "claude-opus-4", out=1)])
        env = {"STUDIO_TRANSCRIPTS": str(self.root)}
        (self.root / "s0.jsonl").touch()  # neuester
        buffer = io.StringIO()
        with unittest_env(env), redirect_stdout(buffer):
            metrics.main(["--efficiency", "--sessions", "1"])
        self.assertIn("1 Session", buffer.getvalue())

    def test_cli_without_transcripts(self):
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


if __name__ == "__main__":
    unittest.main()
