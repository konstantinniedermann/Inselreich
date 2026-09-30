import contextlib
import io
import json
import os
import tempfile
import unittest
import unittest.mock
from datetime import datetime, timezone
from pathlib import Path

import graph
import model

from tests.fixtures import make_demo

T0 = datetime(2026, 9, 30, 12, 0, tzinfo=timezone.utc).timestamp()
MODELS = {
    "lead-qa": "opus",
    "qa-code-reviewer": "sonnet",
    "qa-playtester": "sonnet",
    "lead-tech": "opus",
    "tech-sim-engineer": "sonnet",
}


def ts(offset):
    stamp = datetime.fromtimestamp(T0 + offset, timezone.utc).isoformat(
        timespec="milliseconds"
    )
    return stamp.replace("+00:00", "Z")


def ev(kind, t, agent_id="main", session="s1", **kw):
    return {
        "kind": kind,
        "ts": ts(t),
        "session_id": session,
        "agent_id": agent_id,
        "source": kw.pop("source", "hook"),
        **kw,
    }


def spawn(t, parent, typ, **kw):
    return ev("spawn", t, agent_id=parent, subagent_type=typ, **kw)


def start(t, aid, typ, **kw):
    return ev("agent_start", t, agent_id=aid, role=typ, status="active", **kw)


def stop(t, aid, typ, summary="", **kw):
    return ev(
        "agent_stop", t, agent_id=aid, role=typ, status="done", summary=summary, **kw
    )


def log_status(t, role, status, session="s1", **kw):
    return ev(
        "status",
        t,
        agent_id="",
        session=session,
        role=role,
        status=status,
        source="log",
        **kw,
    )


def flat(state):
    out = {}

    def walk(node):
        out[node["key"]] = node
        for child in node["children"]:
            walk(child)

    for root in state["tree"]:
        walk(root)
    return out


def build(events, now=None, **kw):
    return model.build_state(
        events, T0 + (now if now is not None else 100), MODELS, **kw
    )


class TreeTest(unittest.TestCase):
    def base(self):
        return [
            ev("session_start", 0, status="idle"),
            ev("prompt", 1, status="active", task="Probelauf"),
            spawn(2, "main", "lead-qa", description="QA-Lauf"),
            start(3, "a1", "lead-qa"),
            spawn(
                4, "a1", "qa-code-reviewer", description="Datei lesen", package="P-1"
            ),
            start(5, "b1", "qa-code-reviewer"),
        ]

    def test_nested_tree_levels_and_delegated(self):
        nodes = flat(build(self.base()))
        main, lead, worker = nodes["s1:main"], nodes["s1:a1"], nodes["s1:b1"]
        self.assertEqual([c["key"] for c in main["children"]], ["s1:a1"])
        self.assertEqual([c["key"] for c in lead["children"]], ["s1:b1"])
        self.assertEqual((main["level"], lead["level"], worker["level"]), (0, 1, 2))
        self.assertEqual((lead["department"], worker["department"]), ("qa", "qa"))
        self.assertEqual(lead["status"], "delegated")
        self.assertEqual(worker["status"], "active")
        self.assertEqual(worker["task"], "Datei lesen")
        self.assertEqual(worker["package"], "P-1")
        self.assertEqual(worker["model"], "sonnet")
        self.assertEqual(main["role"], "studio-director")

    def test_spawn_model_overrides_frontmatter(self):
        events = self.base()
        events[4]["model"] = "haiku"
        self.assertEqual(flat(build(events))["s1:b1"]["model"], "haiku")

    def test_parallel_same_type_spawned_corrects_parent(self):
        events = [
            spawn(1, "main", "lead-qa"),
            start(2, "L1", "lead-qa"),
            spawn(3, "main", "lead-tech"),
            start(4, "L2", "lead-tech"),
            spawn(5, "L2", "tech-sim-engineer"),
            spawn(6, "L1", "tech-sim-engineer"),
            start(7, "W1", "tech-sim-engineer"),
            start(8, "W2", "tech-sim-engineer"),
            ev("spawned", 9, agent_id="L1", child_id="W1"),
            ev("spawned", 10, agent_id="L2", child_id="W2"),
        ]
        nodes = flat(build(events))
        self.assertEqual([c["key"] for c in nodes["s1:L1"]["children"]], ["s1:W1"])
        self.assertEqual([c["key"] for c in nodes["s1:L2"]["children"]], ["s1:W2"])

    def test_spawned_before_start(self):
        events = [
            spawn(1, "main", "lead-qa"),
            start(2, "L1", "lead-qa"),
            spawn(3, "L1", "qa-playtester"),
            ev("spawned", 4, agent_id="L1", child_id="W1"),
            start(4.1, "W1", "qa-playtester"),
        ]
        nodes = flat(build(events))
        self.assertEqual(nodes["s1:W1"]["role"], "qa-playtester")
        self.assertEqual([c["key"] for c in nodes["s1:L1"]["children"]], ["s1:W1"])

    def test_persona_line_sets_role(self):
        events = [
            spawn(1, "main", "general-purpose", persona="design-genre-researcher"),
            start(2, "g1", "general-purpose"),
        ]
        node = flat(build(events))["s1:g1"]
        self.assertEqual(
            (node["role"], node["level"], node["department"]),
            ("design-genre-researcher", 2, "design"),
        )

    def test_unknown_role_is_extern(self):
        node = flat(build([start(1, "x1", "Explore")]))["s1:x1"]
        self.assertEqual((node["level"], node["department"]), (2, "extern"))

    def test_classify_studio_staff(self):
        self.assertEqual(model.classify("studio-coach"), (1, "studio"))
        self.assertEqual(model.classify("studio-director"), (0, "studio"))
        self.assertEqual(model.classify("main"), (0, "studio"))
        self.assertEqual(model.classify("studio"), (2, "extern"))


class StatusTest(unittest.TestCase):
    def test_stop_done_and_chronicle(self):
        state = build(
            [
                spawn(1, "main", "lead-qa"),
                start(2, "a1", "lead-qa"),
                stop(3, "a1", "lead-qa", summary="Alles geprüft"),
            ]
        )
        self.assertEqual(flat(state)["s1:a1"]["status"], "done")
        self.assertEqual(state["chronicle"][0]["text"], "Alles geprüft")
        self.assertEqual(state["chronicle"][0]["department"], "qa")

    def test_failed_survives_stop(self):
        events = [
            start(1, "a1", "lead-qa"),
            log_status(2, "lead-qa", "failed"),
            stop(3, "a1", "lead-qa"),
        ]
        self.assertEqual(flat(build(events))["s1:a1"]["status"], "failed")

    def test_turn_end_sets_main_idle(self):
        events = [ev("prompt", 1, status="active"), ev("turn_end", 2, status="idle")]
        self.assertEqual(flat(build(events))["s1:main"]["status"], "idle")

    def test_agent_message_keeps_main_task(self):
        events = [
            ev("prompt", 1, status="active", task="Baue M5"),
            ev("prompt", 2, status="active", task="Meldung eines Agenten"),
        ]
        self.assertEqual(flat(build(events))["s1:main"]["task"], "Baue M5")

    def test_session_end_marks_ended(self):
        events = [start(1, "a1", "lead-qa"), ev("session_end", 2, status="ended")]
        nodes = flat(build(events))
        self.assertEqual(nodes["s1:a1"]["status"], "ended")
        self.assertEqual(nodes["s1:main"]["status"], "ended")

    def test_inactive_rules(self):
        events = [
            ev("turn_end", 0, status="idle"),
            spawn(1, "main", "lead-qa"),
            start(2, "a1", "lead-qa"),
            spawn(3, "a1", "qa-playtester"),
            start(4, "b1", "qa-playtester"),
            ev("heartbeat", 5, agent_id="b1", tool="Bash"),
        ]
        state = build(events, now=5 + 301)
        nodes = flat(state)
        self.assertTrue(nodes["s1:b1"]["inactive"])
        self.assertFalse(nodes["s1:a1"]["inactive"])  # hat aktives Kind
        self.assertFalse(nodes["s1:main"]["inactive"])  # idle
        self.assertEqual(state["counts"]["inactive"], 1)
        self.assertFalse(flat(build(events, now=5 + 299))["s1:b1"]["inactive"])

    def test_status_via_bind(self):
        events = [
            start(1, "r1", "qa-code-reviewer"),
            start(2, "r2", "qa-code-reviewer"),
            ev("bind", 10, agent_id="r1", role="qa-code-reviewer", package=""),
            log_status(10.5, "qa-code-reviewer", "blocked", task="wartet"),
        ]
        nodes = flat(build(events))
        self.assertEqual(nodes["s1:r1"]["status"], "blocked")
        self.assertEqual(nodes["s1:r2"]["status"], "active")

    def test_status_without_bind_prefers_package(self):
        events = [
            spawn(1, "main", "tech-sim-engineer", package="A"),
            start(2, "w1", "tech-sim-engineer"),
            spawn(3, "main", "tech-sim-engineer", package="B"),
            start(4, "w2", "tech-sim-engineer"),
            log_status(5, "tech-sim-engineer", "waiting", package="A"),
        ]
        nodes = flat(build(events))
        self.assertEqual(nodes["s1:w1"]["status"], "waiting")
        self.assertEqual(nodes["s1:w2"]["status"], "active")

    def test_director_status_goes_to_main(self):
        events = [log_status(1, "studio-director", "waiting", task="Gate Spec")]
        self.assertEqual(flat(build(events))["s1:main"]["task"], "Gate Spec")

    def test_explicit_done_summary_kept_and_not_duplicated(self):
        events = [
            start(1, "a1", "lead-qa"),
            log_status(2, "lead-qa", "done", summary="Kurzbericht"),
            stop(3, "a1", "lead-qa", summary="lange Schlussnachricht"),
        ]
        state = build(events)
        self.assertEqual(flat(state)["s1:a1"]["summary"], "Kurzbericht")
        self.assertEqual([c["text"] for c in state["chronicle"]], ["Kurzbericht"])

    def test_log_without_agent_creates_node(self):
        nodes = flat(build([log_status(1, "lead-design", "active", task="Recherche")]))
        node = next(n for n in nodes.values() if n["role"] == "lead-design")
        self.assertEqual((node["level"], node["task"]), (1, "Recherche"))


class BudgetBoardDecisionTest(unittest.TestCase):
    def grant(self, t, lead, granted, parallel, phase="P1"):
        return ev(
            "budget",
            t,
            agent_id="",
            role=lead,
            source="log",
            budget={"granted": granted, "parallel": parallel, "phase": phase},
        )

    def test_budget_usage_overrun_and_model_mix(self):
        events = [
            self.grant(0, "lead-qa", 1, 1),
            start(1, "a1", "lead-qa"),
            spawn(2, "a1", "qa-code-reviewer"),
            start(3, "b1", "qa-code-reviewer"),
            spawn(4, "a1", "qa-playtester", model="haiku"),
            start(5, "b2", "qa-playtester"),
            stop(6, "b1", "qa-code-reviewer"),
        ]
        budget = build(events)["budgets"][0]
        self.assertEqual(
            (budget["lead"], budget["granted"], budget["used"]), ("lead-qa", 1, 2)
        )
        self.assertEqual(budget["parallel_used"], 2)
        self.assertTrue(budget["overrun"])
        self.assertEqual(budget["model_mix"], {"sonnet": 1, "haiku": 1})

    def test_budget_same_phase_adds_new_phase_resets(self):
        events = [
            self.grant(0, "lead-qa", 2, 1),
            start(1, "a1", "lead-qa"),
            spawn(2, "a1", "qa-playtester"),
            start(3, "b1", "qa-playtester"),
            stop(4, "b1", "qa-playtester"),
            self.grant(5, "lead-qa", 2, 1),
        ]
        budget = build(events)["budgets"][0]
        self.assertEqual(
            (budget["granted"], budget["used"], budget["overrun"]), (4, 1, False)
        )
        events.append(self.grant(6, "lead-qa", 3, 2, phase="P2"))
        budget = build(events)["budgets"][0]
        self.assertEqual(
            (budget["phase"], budget["granted"], budget["used"]), ("P2", 3, 0)
        )

    def test_starts_without_grant_are_overrun(self):
        events = [
            start(1, "a1", "lead-tech"),
            spawn(2, "a1", "tech-sim-engineer"),
            start(3, "w1", "tech-sim-engineer"),
        ]
        budget = build(events)["budgets"][0]
        self.assertEqual(
            (budget["lead"], budget["granted"], budget["overrun"]),
            ("lead-tech", 0, True),
        )

    def test_board_blocks(self):
        events = [
            ev(
                "package",
                1,
                agent_id="",
                source="log",
                package="T1",
                title="Modell",
                owner="lead-tech",
                status="active",
                blocked_by=[],
                milestone="M5",
            ),
            ev(
                "package",
                2,
                agent_id="",
                source="log",
                package="T2",
                title="UI",
                owner="lead-tech",
                status="blocked",
                blocked_by=["T1"],
                milestone="M5",
            ),
            ev(
                "package",
                3,
                agent_id="",
                source="log",
                package="T1",
                title="Modell",
                owner="lead-tech",
                status="done",
                blocked_by=[],
                milestone="M5",
            ),
        ]
        board = {p["id"]: p for p in build(events)["board"]}
        self.assertEqual(board["T1"]["status"], "done")
        self.assertEqual(board["T1"]["blocks"], ["T2"])
        self.assertEqual(board["T2"]["blocked_by"], ["T1"])

    def test_decisions_open_until_resolved(self):
        events = [
            ev(
                "decision",
                1,
                agent_id="",
                source="log",
                decision_id="D1",
                role="lead-tech",
                question="Dependency?",
                recommendation="nein",
                **{"for": "user"},
            ),
            ev(
                "decision",
                2,
                agent_id="",
                source="log",
                decision_id="D2",
                role="lead-qa",
                question="Merge?",
                recommendation="ja",
                **{"for": "l0"},
            ),
            ev(
                "decision",
                3,
                agent_id="",
                source="log",
                decision_id="D2",
                role="",
                resolution="gemergt",
            ),
        ]
        decisions = build(events)["decisions"]
        self.assertEqual(
            [(d["id"], d["for"], d["from"]) for d in decisions],
            [("D1", "user", "lead-tech")],
        )


class ViewTest(unittest.TestCase):
    def test_session_filter_latest_default_and_all(self):
        events = [
            ev("prompt", 1, session="old", status="active"),
            ev("prompt", 50, session="new", status="active"),
            start(51, "n1", "lead-qa", session="new"),
        ]
        latest = build(events)
        self.assertEqual(latest["session"], "new")
        self.assertEqual([r["session_id"] for r in latest["tree"]], ["new"])
        self.assertEqual([s["id"] for s in latest["sessions"]], ["new", "old"])
        both = build(events, session="all")
        self.assertEqual(len(both["tree"]), 2)
        only_old = build(events, session="old")
        self.assertEqual([r["session_id"] for r in only_old["tree"]], ["old"])

    def test_feed_newest_first_and_labels(self):
        events = [
            start(1, "a1", "lead-qa"),
            ev("heartbeat", 2, agent_id="a1", tool="Read"),
            log_status(3, "lead-qa", "active", task="Lesen"),
        ]
        feed = build(events)["feed"]
        self.assertEqual(feed[0]["kind"], "status")
        self.assertEqual(feed[1]["text"], "Read")
        self.assertEqual(feed[1]["role"], "lead-qa")

    def test_heartbeats_collapse_per_agent_run(self):
        events = [
            start(1, "a1", "lead-qa"),
            start(1.5, "w1", "lead-tech"),
            ev("heartbeat", 2, agent_id="a1", tool="Read"),
            ev("heartbeat", 3, agent_id="a1", tool="Edit"),
            ev("heartbeat", 4, agent_id="a1", tool="Read"),
            log_status(5, "lead-tech", "active", task="anderer Agent"),
            ev("heartbeat", 6, agent_id="a1", tool="Bash"),
            ev("heartbeat", 7, agent_id="a1", tool="Edit"),
            log_status(8, "lead-qa", "waiting", task="eigenes Event"),
            ev("heartbeat", 9, agent_id="a1", tool="Grep"),
        ]
        feed = build(events)["feed"]
        beats = [f for f in feed if f["kind"] == "heartbeat"]
        self.assertEqual(len(beats), 2)
        last, first = beats
        self.assertEqual(first["text"], "Read, Edit, Bash ×5")
        self.assertEqual(first["count"], 5)
        self.assertEqual(first["first_t"], T0 + 2)
        self.assertEqual(first["t"], T0 + 7)
        self.assertEqual((last["text"], last["count"]), ("Grep", 1))
        self.assertEqual(
            [f["kind"] for f in feed],
            [
                "heartbeat",
                "status",
                "heartbeat",
                "status",
                "agent_start",
                "agent_start",
            ],
        )
        self.assertNotIn("_agent", first)

    def test_heartbeat_tool_names_capped_at_four(self):
        events = [start(1, "a1", "lead-qa")] + [
            ev("heartbeat", 2 + i, agent_id="a1", tool=tool)
            for i, tool in enumerate(["A", "B", "C", "D", "E", "F"])
        ]
        beat = build(events)["feed"][0]
        self.assertEqual(beat["text"], "A, B, C, D, … ×6")

    def test_heartbeats_off_and_cap_after_collapse(self):
        events = [start(1, "a1", "lead-qa"), start(1, "a2", "lead-tech")]
        for i in range(200):
            agent = "a1" if i % 2 else "a2"
            events.append(ev("heartbeat", 2 + i * 0.1, agent_id=agent, tool="Read"))
            if i % 40 == 0:
                events.append(log_status(2 + i * 0.1, "lead-art", "active"))
        meaningful = len(events) - 200
        hidden = build(events, heartbeats=False)
        self.assertNotIn("heartbeat", {f["kind"] for f in hidden["feed"]})
        self.assertEqual(len(hidden["feed"]), meaningful)
        shown = build(events)
        kinds = [f["kind"] for f in shown["feed"]]
        self.assertEqual(len(kinds) - kinds.count("heartbeat"), meaningful)
        self.assertEqual(sum(f.get("count", 0) for f in shown["feed"]), 200)
        self.assertEqual(sum(m["total"] for m in shown["pulse"]), len(events))

    def test_pulse_has_60_minutes_and_counts(self):
        events = [
            start(1, "a1", "lead-qa"),
            ev("heartbeat", 2, agent_id="a1", tool="Read"),
        ]
        pulse = build(events, now=30)["pulse"]
        self.assertEqual(len(pulse), 60)
        self.assertEqual(pulse[-1]["total"], 2)
        self.assertEqual(pulse[-1]["by"], {"qa": 2})

    def test_output_is_json_serializable(self):
        json.dumps(build([start(1, "a1", "lead-qa")]))


class RobustnessTest(unittest.TestCase):
    def test_agent_start_main_after_spawn_keeps_tree(self):
        events = [
            spawn(1, "main", "lead-qa"),
            start(2, "main", "lead-qa"),
            start(3, "a1", "lead-qa"),
        ]
        state = build(events)
        self.assertEqual([c["key"] for c in state["tree"][0]["children"]], ["s1:a1"])
        json.dumps(state)

    def test_spawned_child_equal_to_caller_is_ignored(self):
        events = [
            spawn(1, "main", "lead-qa"),
            start(2, "L1", "lead-qa"),
            ev("spawned", 3, agent_id="L1", child_id="L1"),
            ev("spawned", 4, agent_id="L1", child_id="main"),
        ]
        nodes = flat(build(events))
        self.assertEqual(nodes["s1:L1"]["children"], [])

    def test_cycle_is_refused(self):
        events = [
            start(1, "A", "lead-qa"),
            start(2, "B", "qa-playtester"),
            ev("spawned", 3, agent_id="A", child_id="B"),
            ev("spawned", 4, agent_id="B", child_id="A"),
        ]
        state = build(events)
        json.dumps(state)
        self.assertEqual(len(flat(state)), 3)

    def test_malformed_events_are_skipped(self):
        events = [
            start(1, "a1", "lead-qa"),
            ev("agent_start", 2, agent_id="x1", role=5),
            ev(
                "budget",
                3,
                agent_id="",
                role="lead-qa",
                source="log",
                budget={"granted": "x", "parallel": 1},
            ),
            start(4, "a2", "lead-tech"),
        ]
        state = build(events)
        nodes = flat(state)
        self.assertIn("s1:a1", nodes)
        self.assertIn("s1:a2", nodes)
        self.assertNotIn("s1:x1", nodes)
        self.assertEqual(state["budgets"], [])

    def test_spawned_reassigns_task_package_by_tool_use_id(self):
        events = [
            spawn(1, "main", "lead-qa", tool_use_id="tq"),
            start(2, "L1", "lead-qa"),
            spawn(3, "main", "lead-tech", tool_use_id="tt"),
            start(4, "L2", "lead-tech"),
            spawn(
                5,
                "L2",
                "tech-sim-engineer",
                description="Sim",
                package="P-T",
                tool_use_id="t2",
            ),
            spawn(
                6,
                "L1",
                "tech-sim-engineer",
                description="Test",
                package="P-Q",
                tool_use_id="t1",
            ),
            start(7, "W1", "tech-sim-engineer"),
            start(8, "W2", "tech-sim-engineer"),
            ev("spawned", 9, agent_id="L1", child_id="W1", tool_use_id="t1"),
            ev("spawned", 10, agent_id="L2", child_id="W2", tool_use_id="t2"),
        ]
        nodes = flat(build(events))
        self.assertEqual(
            (nodes["s1:W1"]["task"], nodes["s1:W1"]["package"]), ("Test", "P-Q")
        )
        self.assertEqual(
            (nodes["s1:W2"]["task"], nodes["s1:W2"]["package"]), ("Sim", "P-T")
        )
        self.assertEqual([c["key"] for c in nodes["s1:L1"]["children"]], ["s1:W1"])

    def test_spawned_fixes_persona_role(self):
        events = [
            spawn(
                1,
                "main",
                "general-purpose",
                persona="design-genre-researcher",
                tool_use_id="t1",
            ),
            spawn(2, "main", "general-purpose", tool_use_id="t2"),
            start(3, "g1", "general-purpose"),
            start(4, "g2", "general-purpose"),
            ev("spawned", 5, agent_id="main", child_id="g2", tool_use_id="t1"),
            ev("spawned", 6, agent_id="main", child_id="g1", tool_use_id="t2"),
        ]
        nodes = flat(build(events))
        self.assertEqual(nodes["s1:g2"]["role"], "design-genre-researcher")
        self.assertEqual(nodes["s1:g1"]["role"], "general-purpose")

    def test_parallel_zero_means_unlimited(self):
        events = [
            ev(
                "budget",
                0,
                agent_id="",
                role="lead-qa",
                source="log",
                budget={"granted": 2, "parallel": 0, "phase": "P1"},
            ),
            start(1, "a1", "lead-qa"),
            spawn(2, "a1", "qa-playtester"),
            start(3, "b1", "qa-playtester"),
            spawn(4, "a1", "qa-playtester"),
            start(5, "b2", "qa-playtester"),
        ]
        budget = build(events)["budgets"][0]
        self.assertEqual(budget["parallel_used"], 2)
        self.assertFalse(budget["overrun"])

    def test_child_creation_and_spawned_do_not_bump_last_seen(self):
        events = [
            ev("turn_end", 0, status="idle"),
            ev("prompt", 1, status="active"),
            spawn(2, "main", "lead-qa"),
            start(3, "L1", "lead-qa"),
            ev("spawned", 500, agent_id="L1", child_id="W1"),
        ]
        nodes = flat(build(events, now=600))
        self.assertEqual(nodes["s1:W1"]["idle_seconds"], 100)
        self.assertEqual(nodes["s1:main"]["idle_seconds"], 598)

    def test_spawned_completed_closes_heartbeat_only_node(self):
        events = [
            ev("turn_end", 1, status="idle"),
            ev("heartbeat", 2, agent_id="W1", tool="WebFetch"),
            ev("spawned", 5, child_id="W1", status="completed"),
        ]
        state = build(events, now=5 + 1000)
        node = flat(state)["s1:W1"]
        self.assertEqual(node["status"], "done")
        self.assertIsNotNone(node["stopped"])
        self.assertFalse(node["inactive"])
        self.assertEqual(state["counts"]["inactive"], 0)

    def test_observed_foreground_sequence_ends_at_spawned_ts(self):
        # Spawn (Vordergrund), 2 Heartbeats des Kindes, spawned nach 31 s
        events = [
            ev("turn_end", 0, status="idle"),
            spawn(1, "main", "web-fetch", tool_use_id="t1", background=False),
            ev("heartbeat", 3, agent_id="W1", tool="WebFetch"),
            ev("heartbeat", 20, agent_id="W1", tool="WebFetch"),
            ev(
                "spawned",
                32,
                child_id="W1",
                tool_use_id="t1",
                status="completed",
                duration_ms=31000,
            ),
        ]
        state = build(events, now=32 + 5000)
        nodes = flat(state)
        node = nodes["s1:W1"]
        self.assertEqual(node["status"], "done")  # Punkt 1: done
        self.assertEqual(node["stopped"], T0 + 32)  # stopped == ts von spawned
        self.assertFalse(node["inactive"])  # kein inaktiv-Vorfall
        self.assertEqual(state["counts"]["inactive"], 0)
        rows = [d for d in state["delegations"] if d["to"] == "web-fetch"]
        self.assertEqual(len(rows), 1)  # Dauer endet bei ~31 s, nicht bei now
        self.assertAlmostEqual(rows[0]["duration_s"], 31.0, delta=1.0)

    def test_spawned_completed_keeps_regular_stop_and_failed(self):
        events = [
            spawn(1, "main", "lead-qa"),
            start(2, "L1", "lead-qa"),
            stop(3, "L1", "lead-qa", summary="fertig"),
            ev("spawned", 4, child_id="L1", status="completed"),
        ]
        node = flat(build(events))["s1:L1"]
        self.assertEqual(node["status"], "done")
        self.assertEqual(node["stopped"], T0 + 3)

    def test_spawned_completed_keeps_failed_node(self):
        events = [
            spawn(1, "main", "lead-qa"),
            start(2, "a1", "lead-qa"),
            log_status(3, "lead-qa", "failed"),
            ev("spawned", 4, child_id="a1", status="completed"),
        ]
        node = flat(build(events))["s1:a1"]
        self.assertEqual(node["status"], "failed")
        self.assertEqual(node["stopped"], T0 + 3)

    def test_stop_after_spawned_completed_is_done_without_double_chronicle(self):
        events = [
            ev("turn_end", 0, status="idle"),
            ev("heartbeat", 2, agent_id="W1", tool="WebFetch"),
            ev("spawned", 5, child_id="W1", status="completed"),
            stop(6, "W1", "web-fetch", summary="Seite gelesen"),
        ]
        state = build(events)
        node = flat(state)["s1:W1"]
        self.assertEqual(node["status"], "done")
        self.assertEqual(node["stopped"], T0 + 6)
        self.assertEqual([c["text"] for c in state["chronicle"]], ["Seite gelesen"])

    def test_spawned_async_launched_stays_active(self):
        events = [
            ev("heartbeat", 2, agent_id="W1", tool="Read"),
            ev("spawned", 5, child_id="W1", status="async_launched"),
            ev("spawned", 6, child_id="W2"),
        ]
        nodes = flat(build(events, now=10))
        self.assertIsNone(nodes["s1:W1"]["stopped"])  # Gegenprobe: nicht geschlossen
        self.assertEqual(nodes["s1:W1"]["status"], "active")
        self.assertEqual(nodes["s1:W2"]["status"], "active")

    def test_blocked_by_string_is_split(self):
        events = [
            ev(
                "package",
                1,
                agent_id="",
                source="log",
                package="T3",
                title="x",
                owner="lead-tech",
                status="blocked",
                blocked_by="T1, T2",
            ),
        ]
        self.assertEqual(build(events)["board"][0]["blocked_by"], ["T1", "T2"])


class ResumeTest(unittest.TestCase):
    def events(self):
        return [
            spawn(1, "main", "lead-qa", tool_use_id="q"),
            start(2, "L1", "lead-qa"),
            spawn(3, "L1", "qa-playtester", description="Erst", package="P-1"),
            start(4, "W1", "qa-playtester"),
            stop(5, "W1", "qa-playtester", summary="fertig eins"),
            spawn(6, "main", "lead-tech"),
            start(7, "L2", "lead-tech"),
            spawn(8, "L2", "qa-playtester", description="Neu", package="P-2"),
            ev("heartbeat", 9, agent_id="L1", tool="SendMessage"),
            start(10, "W1", "qa-playtester"),
        ]

    def test_resume_keeps_identity_and_leaves_pending(self):
        events = self.events()
        nodes = flat(build(events))
        w1 = nodes["s1:W1"]
        self.assertEqual(w1["status"], "active")
        self.assertIsNone(w1["stopped"])
        self.assertEqual((w1["task"], w1["package"]), ("Erst", "P-1"))
        self.assertEqual([c["key"] for c in nodes["s1:L1"]["children"]], ["s1:W1"])
        events += [start(11, "W2", "qa-playtester")]
        nodes = flat(build(events))
        self.assertEqual(
            (nodes["s1:W2"]["task"], nodes["s1:W2"]["package"]), ("Neu", "P-2")
        )
        self.assertEqual([c["key"] for c in nodes["s1:L2"]["children"]], ["s1:W2"])
        self.assertEqual(nodes["s1:W1"]["task"], "Erst")

    def test_resume_counts_once_in_budget(self):
        events = [
            ev(
                "budget",
                0,
                agent_id="",
                role="lead-qa",
                source="log",
                budget={"granted": 1, "parallel": 1, "phase": "P1"},
            ),
            *self.events(),
        ]
        budget = build(events)["budgets"][0]
        self.assertEqual(budget["used"], 1)
        self.assertFalse(budget["overrun"])

    def test_resumed_worker_done_after_second_stop(self):
        events = self.events() + [
            stop(11, "W1", "qa-playtester", summary="fertig zwei")
        ]
        state = build(events)
        self.assertEqual(flat(state)["s1:W1"]["status"], "done")
        texts = [c["text"] for c in state["chronicle"] if c["role"] == "qa-playtester"]
        self.assertEqual(texts, ["fertig zwei", "fertig eins"])

    def test_implicit_node_still_gets_first_start(self):
        events = [
            spawn(1, "main", "qa-playtester", description="T", package="P"),
            ev("heartbeat", 2, agent_id="W1", tool="Read", role="qa-playtester"),
            start(3, "W1", "qa-playtester"),
        ]
        node = flat(build(events))["s1:W1"]
        self.assertEqual((node["task"], node["package"]), ("T", "P"))


class ParallelRunsTest(unittest.TestCase):
    def grant(self):
        return ev(
            "budget",
            0,
            agent_id="",
            role="lead-qa",
            source="log",
            budget={"granted": 5, "parallel": 1, "phase": "P1"},
        )

    def test_resume_gap_is_not_parallel(self):
        events = [
            self.grant(),
            start(0.5, "a1", "lead-qa"),
            spawn(1, "a1", "qa-playtester"),
            start(1, "W1", "qa-playtester"),
            stop(3, "W1", "qa-playtester"),
            spawn(4, "a1", "qa-playtester"),
            start(4, "W2", "qa-playtester"),
            stop(6, "W2", "qa-playtester"),
            start(7, "W1", "qa-playtester"),
            stop(9, "W1", "qa-playtester"),
        ]
        budget = build(events)["budgets"][0]
        self.assertEqual((budget["used"], budget["parallel_used"]), (2, 1))
        self.assertFalse(budget["overrun"])

    def test_repeated_start_keeps_single_run(self):
        events = [
            self.grant(),
            start(0.5, "a1", "lead-qa"),
            spawn(1, "a1", "qa-playtester"),
            start(1, "W1", "qa-playtester"),
            start(2, "W1", "qa-playtester"),
            stop(3, "W1", "qa-playtester"),
            spawn(4, "a1", "qa-playtester"),
            start(4, "W2", "qa-playtester"),
            stop(6, "W2", "qa-playtester"),
        ]
        budget = build(events)["budgets"][0]
        self.assertEqual(budget["parallel_used"], 1)
        self.assertFalse(budget["overrun"])

    def test_real_overlap_still_counts(self):
        events = [
            self.grant(),
            start(0.5, "a1", "lead-qa"),
            spawn(1, "a1", "qa-playtester"),
            start(1, "W1", "qa-playtester"),
            spawn(2, "a1", "qa-playtester"),
            start(2, "W2", "qa-playtester"),
            stop(3, "W1", "qa-playtester"),
            stop(4, "W2", "qa-playtester"),
        ]
        budget = build(events)["budgets"][0]
        self.assertEqual(budget["parallel_used"], 2)
        self.assertTrue(budget["overrun"])


class StoreAndModelsTest(unittest.TestCase):
    def test_event_store_skips_corrupt_and_partial(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "events.jsonl"
            path.write_text(
                '{"kind":"a"}\nkaputt\n[1]\n{"kind":"b"}\n{"kind":"hal', "utf-8"
            )
            store = model.EventStore(path)
            self.assertEqual([e["kind"] for e in store.events()], ["a", "b"])
            with open(path, "a", encoding="utf-8") as handle:
                handle.write('b"}\n')
            self.assertEqual([e["kind"] for e in store.events()], ["a", "b", "halb"])

    def test_event_store_resets_on_replace(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "events.jsonl"
            path.write_text('{"kind":"a"}\n{"kind":"b"}\n', "utf-8")
            store = model.EventStore(path)
            self.assertEqual(len(store.events()), 2)
            os.rename(path, Path(tmp) / "old.jsonl")
            self.assertEqual(store.events(), [])
            path.write_text('{"kind":"c"}\n{"kind":"d"}\n{"kind":"e"}\n', "utf-8")
            self.assertEqual([e["kind"] for e in store.events()], ["c", "d", "e"])

    def test_read_agent_models(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "lead-qa.md").write_text(
                "---\nname: lead-qa\ndescription: x\nmodel: opus\n---\nText\n", "utf-8"
            )
            (folder / "kaputt.md").write_text("kein frontmatter", "utf-8")
            self.assertEqual(model.read_agent_models(folder), {"lead-qa": "opus"})
            self.assertEqual(model.read_agent_models(folder / "fehlt"), {})


class MilestoneInheritanceTest(unittest.TestCase):
    def test_worker_inherits_from_delegating_ancestor(self):
        events = [
            spawn(0, "main", "lead-tech", milestone="M9"),
            start(1, "a1", "lead-tech"),
            spawn(2, "a1", "tech-sim-engineer"),
            start(3, "a2", "tech-sim-engineer"),
        ]
        nodes = flat(build(events))
        self.assertEqual(nodes["s1:a2"]["milestone"], "M9")

    def test_status_log_sets_milestone(self):
        events = [log_status(1, "lead-qa", "active", milestone="M7")]
        rec = next(r for r in build(events)["records"] if r["role"] == "lead-qa")
        self.assertEqual(rec["milestone"], "M7")


def ci_event(t, run_id, created=None, conclusion="failure"):
    return ev(
        "ci",
        t,
        agent_id="",
        session="ci",
        source="ci",
        run_id=run_id,
        conclusion=conclusion,
        branch="main",
        workflow="CI",
        created=ts(created if created is not None else t),
    )


class CiScopeTest(unittest.TestCase):
    def events(self):
        return [
            ev("session_start", 0, session="s1"),
            ev("turn_end", 100, session="s1"),
            ev("session_end", 200, session="s1"),
            ev("session_start", 300, session="s2"),
            ev("turn_end", 400, session="s2"),
            ci_event(150, "1"),  # in s1
            ci_event(320, "2", created=180),  # erstellt in s1, erfasst in s2
            ci_event(350, "3"),  # in s2
            ci_event(900, "4", created=250),  # zwischen den Sessions
        ]

    def test_ci_counts_for_session_window(self):
        s1 = build(self.events(), now=1000, session="s1")
        self.assertEqual(s1["quality"]["ci_runs"], 2)
        s2 = build(self.events(), now=1000, session="s2")
        self.assertEqual(s2["quality"]["ci_runs"], 1)
        every = build(self.events(), now=1000, session="all")
        self.assertEqual(every["quality"]["ci_runs"], 4)

    def test_ci_is_no_session(self):
        state = build(self.events(), now=1000)
        self.assertEqual(state["session"], "s2")
        self.assertNotIn("ci", [s["id"] for s in state["sessions"]])
        only_ci = build([ci_event(10, "9")], now=100)
        self.assertEqual(only_ci["sessions"], [])
        self.assertIsNone(only_ci["session"])


class MainDurationTest(unittest.TestCase):
    def test_l0_duration_is_sum_of_turns(self):
        events = [
            ev("session_start", 0),
            ev("prompt", 10, status="active", task="Baue M5"),
            ev("turn_end", 70, status="idle"),
            ev("prompt", 100, status="active", task="Meldung eines Agenten"),
            ev("prompt", 110, status="active", task="Meldung eines Agenten"),
            ev("turn_end", 130, status="idle"),
        ]
        rec = next(r for r in build(events)["records"] if r["agent_id"] == "main")
        self.assertEqual(rec["duration_s"], 90)

    def test_open_turn_closed_by_session_end(self):
        events = [
            ev("prompt", 10, status="active", task="x"),
            ev("session_end", 40, status="ended"),
        ]
        rec = next(r for r in build(events)["records"] if r["agent_id"] == "main")
        self.assertEqual(rec["duration_s"], 30)

    def test_without_turns_not_measured(self):
        rec = build([ev("session_start", 0)])["records"][0]
        self.assertIsNone(rec["duration_s"])


# --- Prozess-Graph (Spec 2026-09-30-studio-prozessgraph-design.md) ----------


def message(t, sender, to, text="Hallo", **kw):
    return ev("message", t, agent_id=sender, to=to, text=text, **kw)


def lead(t=1, aid="a1", typ="lead-qa", **kw):
    return [spawn(t, "main", typ, description="Auftrag", **kw), start(t + 1, aid, typ)]


NAMES = {
    "lead-qa": {"name": "Prüf-Peter", "title": "QA-Chef", "emoji": "🔍"},
    "lead-tech": {"name": "Technik-Toni", "title": "Tech-Chef", "emoji": "🔧"},
    "lead-art": {"name": "Pinsel-Pia", "title": "Kunst-Chefin", "emoji": "🎨"},
    "tech-sim-engineer": {
        "name": "Logik-Lars",
        "title": "Spiellogik-Entwickler",
        "emoji": "⚙️",
    },
    "qa-playtester": {"name": "Zocker-Zoe", "title": "Spieltesterin", "emoji": "🎮"},
    "qa-code-reviewer": {
        "name": "Review-Rita",
        "title": "Code-Prüferin",
        "emoji": "👓",
    },
    "design-genre-researcher": {"name": "Genre-Gina"},
}


def named(events, **kw):
    return build(events, agent_names=NAMES, **kw)


SYMBOL = {"solid": "S", "dashed": "D", "none": "."}


def graph_rows(state):
    """Graph-Zeilen chronologisch (die API liefert neueste zuerst)."""
    return list(reversed(state["graph"]["rows"]))


def ups(row):
    return "".join(SYMBOL[lane["up"]] for lane in row["lanes"])


def downs(row):
    return "".join(SYMBOL[lane["down"]] for lane in row["lanes"])


def bind(t, aid, role, **kw):
    return ev("bind", t, agent_id=aid, role=role, **kw)


PERSONA_NAMES = {
    "lead-production": {
        "name": "Planungs-Paula",
        "title": "Produktionschefin",
        "emoji": "📋",
    },
    "lead-design": {"name": "Ideen-Ida", "title": "Design-Chefin", "emoji": "💡"},
    "lead-tech": {"name": "Technik-Toni", "title": "Tech-Chef", "emoji": "🔧"},
    "lead-art": {"name": "Pinsel-Pia", "title": "Kunst-Chefin", "emoji": "🎨"},
    "lead-qa": {"name": "Prüf-Peter", "title": "QA-Chef", "emoji": "🔍"},
    "production-integrator": {
        "name": "Merge-Moritz",
        "title": "Zusammenführer",
        "emoji": "🔀",
    },
    "design-spec-author": {
        "name": "Spec-Sabine",
        "title": "Spec-Schreiberin",
        "emoji": "📝",
    },
    "design-economy-designer": {
        "name": "Taler-Theo",
        "title": "Wirtschaftsplaner",
        "emoji": "💰",
    },
    "tech-sim-engineer": {
        "name": "Logik-Lars",
        "title": "Spiellogik-Entwickler",
        "emoji": "⚙️",
    },
    "tech-ui-engineer": {
        "name": "UI-Ursula",
        "title": "Oberflächen-Entwicklerin",
        "emoji": "🖱️",
    },
    "art-license-checker": {
        "name": "Paragraphen-Paul",
        "title": "Lizenzprüfer",
        "emoji": "⚖️",
    },
    "qa-code-reviewer": {
        "name": "Review-Rita",
        "title": "Code-Prüferin",
        "emoji": "👓",
    },
    "qa-playtester": {"name": "Zocker-Zoe", "title": "Spieltesterin", "emoji": "🎮"},
    "studio-coach": {"name": "Coach-Carla", "title": "Studio-Coach", "emoji": "🧭"},
}


class GraphTest(unittest.TestCase):
    def test_message_is_heartbeat_of_sender(self):
        state = build([*lead(), message(50, "a1", "main")])
        node = flat(state)["s1:a1"]
        self.assertEqual(node["last_seen"], T0 + 50)
        self.assertEqual(node["status"], "active")
        record = next(r for r in state["records"] if r["key"] == "s1:a1")
        self.assertEqual(record["tool_calls"], 1)  # SendMessage zählt als Tool-Aufruf

    def test_message_feed_text(self):
        events = [
            *lead(typ="lead-tech"),
            message(10, "main", "a1", text="Bitte starten"),
            message(11, "main", "zoll-helfer", text="Wer bist du?"),
        ]
        texts = [f["text"] for f in named(events)["feed"] if f["kind"] == "message"]
        self.assertEqual(
            texts,
            ["✉ → ? zoll-helfer: Wer bist du?", "✉ → Technik-Toni: Bitte starten"],
        )

    def test_graph_only_for_single_session(self):
        events = [ev("session_start", 0, status="idle"), *lead()]
        self.assertEqual(named(events, session="s1")["graph"]["session"], "s1")
        self.assertEqual(named(events)["graph"]["session"], "s1")
        self.assertIsNone(named(events, session="all")["graph"])
        self.assertIsNone(named([])["graph"])

    def test_order_row_merges_spawn_and_start(self):
        rows = graph_rows(named(lead()))
        self.assertEqual([r["kind"] for r in rows], ["order"])
        self.assertEqual(rows[0]["t"], T0 + 1)
        self.assertTrue(rows[0]["id"].startswith("order:s1:main:"))
        self.assertEqual(rows[0]["label"], "Boss Bruno → Prüf-Peter")
        self.assertEqual(rows[0]["dot"], 1)
        self.assertEqual(
            rows[0]["arrow"], {"from_col": 0, "to_col": 1, "style": "branch"}
        )

    def test_report_row_ends_lane(self):
        rows = graph_rows(named([*lead(), stop(5, "a1", "lead-qa", summary="Fertig")]))
        report = rows[-1]
        self.assertEqual(report["kind"], "report")
        self.assertEqual((report["from"], report["to"]), ("s1:a1", "s1:main"))
        self.assertEqual(
            report["arrow"], {"from_col": 1, "to_col": 0, "style": "merge"}
        )
        self.assertEqual((ups(report), downs(report)), ("S.", "SS"))

    def test_spawned_completed_ends_lane(self):
        events = [
            ev("session_start", 0, status="idle"),
            spawn(1, "main", "web-fetch", description="Seite lesen", tool_use_id="w"),
            ev("heartbeat", 2, agent_id="wf", tool="WebFetch"),
            ev(
                "spawned",
                30,
                child_id="wf",
                tool_use_id="w",
                status="completed",
                duration_ms=28000,
            ),
            message(60, "main", "main"),
        ]
        rows = graph_rows(named(events))
        self.assertEqual(
            [r["kind"] for r in rows], ["start", "order", "report", "message"]
        )
        report = rows[2]
        self.assertEqual((report["from"], report["to"]), ("s1:wf", "s1:main"))
        self.assertEqual(report["arrow"]["style"], "merge")
        self.assertEqual(rows[3]["lanes"][1]["up"], "none")
        # späterer echter agent_stop: keine zweite report-Zeile
        late = [*events[:4], stop(40, "wf", "web-fetch"), events[4]]
        kinds = [r["kind"] for r in graph_rows(named(late))]
        self.assertEqual(kinds.count("report"), 1)

    def test_message_to_running_agent(self):
        row = graph_rows(named([*lead(), message(5, "main", "a1")]))[-1]
        self.assertEqual(row["to"], "s1:a1")
        self.assertEqual(row["arrow"], {"from_col": 0, "to_col": 1, "style": "message"})
        self.assertEqual(row["label"], "Boss Bruno → Prüf-Peter")

    def test_resume_folds_into_message_row(self):
        events = [
            *lead(),
            stop(5, "a1", "lead-qa"),
            message(10, "main", "a1"),
            start(20, "a1", "lead-qa"),
        ]
        rows = graph_rows(named(events))
        self.assertEqual([r["kind"] for r in rows], ["order", "report", "message"])
        self.assertEqual(rows[2]["lanes"][1]["down"], "dashed")
        self.assertEqual(rows[2]["lanes"][1]["up"], "solid")
        self.assertEqual(rows[2]["arrow"]["to_col"], 1)

    def test_resume_without_message_has_own_row(self):
        base = [*lead(), stop(5, "a1", "lead-qa")]
        rows = graph_rows(named([*base, start(20, "a1", "lead-qa")]))
        self.assertEqual([r["kind"] for r in rows], ["order", "report", "resume"])
        self.assertEqual(rows[-1]["text"], "Fortsetzung")
        late = [*base, message(10, "main", "a1"), start(50, "a1", "lead-qa")]
        kinds = [r["kind"] for r in graph_rows(named(late))]
        self.assertEqual(kinds, ["order", "report", "message", "resume"])

    def test_message_to_main(self):
        row = graph_rows(named([*lead(), message(5, "a1", "main")]))[-1]
        self.assertEqual(row["to"], "s1:main")
        self.assertEqual(row["arrow"], {"from_col": 1, "to_col": 0, "style": "message"})

    def test_recipient_bracket_form(self):
        events = [*lead(typ="lead-tech"), message(5, "main", "a1 [lead-tech]")]
        self.assertEqual(graph_rows(named(events))[-1]["to"], "s1:a1")

    def test_recipient_by_unique_role_or_name(self):
        for to in ("lead-tech", "Technik-Toni", "  Technik-Toni  "):
            events = [*lead(typ="lead-tech"), message(5, "main", to)]
            self.assertEqual(graph_rows(named(events))[-1]["to"], "s1:a1", to)
        stop_only = ev("agent_stop", 3, agent_id="h1", status="done", summary="x")
        events = [start(1, "x1", "Explore"), stop_only, message(5, "main", "Aushilfe")]
        self.assertEqual(graph_rows(named(events))[-1]["to"], "s1:x1")

    def test_recipient_ambiguous_is_unresolved(self):
        events = [
            *lead(typ="lead-tech"),
            spawn(3, "a1", "tech-sim-engineer", tool_use_id="w1"),
            start(4, "w1", "tech-sim-engineer"),
            spawn(5, "a1", "tech-sim-engineer", tool_use_id="w2"),
            start(6, "w2", "tech-sim-engineer"),
            message(7, "a1", "tech-sim-engineer"),
            message(8, "a1", "Logik-Lars"),
        ]
        rows = graph_rows(named(events))
        self.assertEqual([r["to"] for r in rows[-2:]], ["?", "?"])

    def test_unresolvable_recipient_keeps_row(self):
        row = graph_rows(named([*lead(), message(5, "a1", "zoll-helfer")]))[-1]
        self.assertEqual((row["kind"], row["to"]), ("message", "?"))
        self.assertIsNone(row["arrow"]["to_col"])
        self.assertEqual(row["label"], "Prüf-Peter → ? zoll-helfer")

    def test_empty_recipient_is_unresolved(self):
        row = graph_rows(named([*lead(), message(5, "a1", "")]))[-1]
        self.assertEqual(
            (row["kind"], row["to"], row["label"]), ("message", "?", "Prüf-Peter → ?")
        )

    def test_message_target_without_lane(self):
        events = [*lead(), stop(5, "a1", "lead-qa"), message(10, "main", "a1")]
        row = graph_rows(named(events))[-1]
        self.assertEqual(row["to"], "s1:a1")
        self.assertIsNone(row["arrow"]["to_col"])
        self.assertEqual(row["label"], "Boss Bruno → Prüf-Peter")
        own = graph_rows(named([*lead(), message(5, "a1", "a1")]))[-1]
        self.assertIsNone(own["arrow"])
        self.assertEqual(own["dot"], 1)

    def workers(self, resume):
        events = [
            *lead(),
            spawn(3, "a1", "qa-playtester", tool_use_id="b1"),
            start(4, "b1", "qa-playtester"),
            stop(5, "b1", "qa-playtester"),
            spawn(6, "a1", "qa-code-reviewer", tool_use_id="b2"),
            start(7, "b2", "qa-code-reviewer"),
        ]
        if resume:
            events += [message(8, "a1", "b1"), start(9, "b1", "qa-playtester")]
        return graph_rows(named(events))

    def test_column_reuse_after_finish(self):
        rows = self.workers(resume=False)
        self.assertEqual(rows[-1]["kind"], "order")
        self.assertEqual(rows[-1]["dot"], 2)

    def test_reserved_dashed_column_until_resume(self):
        rows = self.workers(resume=True)
        order_b2 = rows[3]
        self.assertEqual((order_b2["kind"], order_b2["dot"]), ("order", 3))
        self.assertEqual(order_b2["lanes"][2]["key"], "b1")
        self.assertEqual(order_b2["lanes"][2]["up"], "dashed")
        self.assertEqual(rows[-1]["lanes"][2]["up"], "solid")

    def test_pause_separator(self):
        rows = graph_rows(
            named([*lead(), message(301, "main", "a1"), message(721, "main", "a1")])
        )
        self.assertEqual(
            [r["kind"] for r in rows], ["order", "message", "pause", "message"]
        )
        pause = rows[2]
        self.assertEqual(pause["text"], "… 7 min …")
        self.assertEqual(
            (pause["dot"], pause["arrow"], pause["label"]), (None, None, "")
        )
        self.assertEqual((ups(pause), downs(pause)), ("SS", "SS"))
        self.assertTrue(pause["id"].startswith("pause:s1:-:"))

    def test_status_rows_and_done_folding(self):
        events = [*lead()]
        for t, status, extra in (
            (10, "blocked", {"task": "Wartet auf X"}),
            (20, "waiting", {"task": "Wartet auf Y"}),
            (30, "active", {"task": "Weiter"}),
            (40, "failed", {"summary": "Kaputt"}),
            (50, "done", {"summary": "Zwischenstand"}),
            (100, "done", {"summary": "Alles fertig"}),
        ):
            events += [
                bind(t - 1, "a1", "lead-qa"),
                log_status(t, "lead-qa", status, **extra),
            ]
        events.append(stop(110, "a1", "lead-qa", summary="Fertig."))
        rows = graph_rows(named(events))
        statuses = [r["status"] for r in rows if r["kind"] == "status"]
        self.assertEqual(statuses, ["blocked", "waiting", "failed", "done"])
        self.assertEqual(rows[1]["text"], "Wartet auf X")
        self.assertEqual(
            (rows[-1]["kind"], rows[-1]["text"]), ("report", "Alles fertig")
        )

    def test_silent_events_make_no_rows(self):
        events = [
            ev("session_start", 0, status="idle"),
            ev("prompt", 1, status="active", task="Los"),
            ev("heartbeat", 2, tool="Read"),
            bind(3, "main", "studio-director"),
            ev("turn_end", 4, status="idle"),
            spawn(5, "main", "lead-qa", tool_use_id="q"),
            ev("spawned", 6, child_id="a1", tool_use_id="q"),
            start(7, "a1", "lead-qa"),
            ev("heartbeat", 8, agent_id="a1", tool="Grep"),
        ]
        self.assertEqual(
            [r["kind"] for r in graph_rows(named(events))], ["start", "order"]
        )

    def test_session_end_closes_all_lanes(self):
        events = [*lead(), ev("session_end", 10, status="ended")]
        end = graph_rows(named(events))[-1]
        self.assertEqual(
            (end["kind"], end["dot"], end["text"]), ("end", 0, "Session beendet")
        )
        self.assertEqual((ups(end), downs(end)), ("..", "SS"))

    def test_truncation_keeps_lanes(self):
        events = [ev("session_start", 0, status="idle"), *lead()]
        events += [message(3 + i, "a1", "main", text=f"m{i}") for i in range(318)]
        graph = named(events, now=400)["graph"]
        self.assertTrue(graph["truncated"])
        self.assertEqual((graph["columns"], len(graph["rows"])), (2, 300))
        oldest = graph["rows"][-1]
        self.assertEqual(oldest["text"], "m18")
        self.assertEqual((ups(oldest), downs(oldest)), ("SS", "SS"))
        self.assertTrue(all(len(r["lanes"]) == 2 for r in graph["rows"]))

    def test_row_ids_stable(self):
        events = [
            ev("session_start", 0, status="idle"),
            *lead(),
            message(5, "a1", "main"),
        ]
        first = [r["id"] for r in named(events)["graph"]["rows"]]
        self.assertEqual(first, [r["id"] for r in named(events)["graph"]["rows"]])
        later = [
            r["id"] for r in named([*events, message(9, "main", "a1")])["graph"]["rows"]
        ]
        self.assertEqual(later[1:], first)
        self.assertEqual(len(set(later)), len(later))

    def test_row_id_changes_only_by_p34_exceptions(self):
        events = [
            *lead(),
            bind(49, "a1", "lead-qa"),
            log_status(50, "lead-qa", "done", summary="Gut"),
        ]
        before = {r["id"] for r in named(events)["graph"]["rows"]}
        after = {
            r["id"]
            for r in named([*events, stop(60, "a1", "lead-qa")])["graph"]["rows"]
        }
        self.assertEqual(len(before - after), 1)
        self.assertTrue(next(iter(before - after)).startswith("status:s1:a1:"))
        self.assertTrue(next(iter(after - before)).startswith("report:s1:a1:"))

    def test_late_correction_relayouts(self):
        events = [
            *lead(aid="L1"),
            spawn(3, "main", "lead-tech", tool_use_id="lt"),
            start(4, "L2", "lead-tech"),
            spawn(5, "L1", "qa-playtester", description="Eins", tool_use_id="t1"),
            spawn(6, "L2", "qa-playtester", description="Zwei", tool_use_id="t2"),
            start(7, "W2", "qa-playtester"),
            start(8, "W1", "qa-playtester"),
        ]

        def order(state):
            return next(r for r in graph_rows(state) if r["text"] == "Eins")

        self.assertEqual(order(named(events))["to"], "s1:W2")
        fixed = [
            *events,
            ev("spawned", 9, agent_id="L2", child_id="W2", tool_use_id="t2"),
            ev("spawned", 10, agent_id="L1", child_id="W1", tool_use_id="t1"),
        ]
        self.assertEqual(order(named(fixed))["to"], "s1:W1")

    def test_log_only_and_startless_lanes(self):
        events = [
            ev("session_start", 0, status="idle"),
            log_status(10, "lead-art", "active", task="Assets sichten"),
            log_status(20, "lead-art", "blocked", task="Lizenz unklar"),
            log_status(30, "lead-art", "waiting", task="Antwort"),
            ev("heartbeat", 40, agent_id="x1", tool="Read"),
            stop(50, "x1", "Explore", summary="Gefunden"),
        ]
        rows = graph_rows(named(events))
        self.assertEqual(
            [(r["kind"], r["from"]) for r in rows],
            [
                ("start", "s1:main"),
                ("start", "s1:log:lead-art"),
                ("status", "s1:log:lead-art"),
                ("status", "s1:log:lead-art"),
                ("start", "s1:x1"),
                ("report", "s1:x1"),
            ],
        )
        self.assertEqual(rows[1]["text"], "Assets sichten")
        self.assertEqual(
            (rows[1]["lanes"][1]["up"], rows[3]["lanes"][1]["up"]), ("solid", "none")
        )
        self.assertEqual(rows[1]["label"], "Pinsel-Pia")

    def test_text_limit_lane_width_json(self):
        events = [
            ev("session_start", 0, status="idle"),
            *lead(),
            message(5, "a1", "main", text="x" * 300),
        ]
        graph = named(events)["graph"]
        self.assertEqual(graph["rows"][0]["text"], "x" * 160 + "…")
        self.assertTrue(all(len(r["lanes"]) == graph["columns"] for r in graph["rows"]))
        json.dumps(graph)

    def test_session_restart_resumes_director(self):
        events = [
            ev("session_start", 0, status="idle"),
            ev("session_end", 10, status="ended"),
            ev("session_start", 20, status="idle"),
            ev("session_start", 30, status="idle"),
        ]
        rows = graph_rows(named(events))
        self.assertEqual([r["kind"] for r in rows], ["start", "end", "resume"])
        self.assertEqual(rows[1]["lanes"][0]["up"], "dashed")
        self.assertEqual((rows[2]["dot"], rows[2]["text"]), (0, "Fortsetzung"))
        self.assertEqual(rows[2]["lanes"][0]["down"], "dashed")

    def test_log_final_status_does_not_end_lane(self):
        for status in ("done", "failed"):
            events = [
                *lead(),
                bind(39, "a1", "lead-qa"),
                log_status(40, "lead-qa", status, summary="Ende"),
                stop(100, "a1", "lead-qa"),
            ]
            rows = graph_rows(named(events))
            self.assertEqual(rows[1]["kind"], "status", status)
            self.assertEqual(rows[1]["lanes"][1]["up"], "solid", status)
            self.assertEqual(rows[2]["lanes"][1]["down"], "solid", status)

    def test_duplicate_stop_and_unassigned_spawn_are_quiet(self):
        events = [
            *lead(),
            stop(5, "a1", "lead-qa", summary="Erster Bericht"),
            stop(6, "a1", "lead-qa", summary="Doppelt"),
            spawn(7, "main", "qa-playtester", tool_use_id="nie-gestartet"),
        ]
        rows = graph_rows(named(events))
        self.assertEqual([r["kind"] for r in rows], ["order", "report"])
        self.assertEqual(rows[-1]["text"], "Erster Bericht")

    def test_status_with_wrong_type_keeps_graph(self):
        # nur der Graph-Pfad: build_state selbst scheitert bei Listen-Status in view()
        events = [
            *lead(),
            message(8, "a1", "main"),
            bind(9, "a1", "lead-qa"),
            log_status(10, "lead-qa", ["done"], task=["x"], summary={"x": 1}),
        ]
        builder = model._Builder(MODELS, T0 + 100, NAMES)
        for event in events:
            with contextlib.suppress(Exception):  # wie build_state
                builder.apply(event)
        builder.finalize()
        builder.identities()
        kinds = [r["kind"] for r in builder.layouts()["s1"].rows]
        self.assertIn("order", kinds)
        self.assertIn("message", kinds)

    def test_status_row_uses_event_time_resolution(self):
        events = [
            *lead(),
            bind(9, "a1", "lead-qa"),
            log_status(10, "lead-qa", "blocked", task="Hängt"),
            spawn(20, "main", "lead-qa", tool_use_id="q2"),
            start(21, "a2", "lead-qa"),
        ]
        status = next(r for r in graph_rows(named(events)) if r["kind"] == "status")
        self.assertEqual(status["from"], "s1:a1")
        self.assertTrue(status["id"].startswith("status:s1:a1:"))


HELPER = {"agent_id": "h1", "status": "done", "summary": "Fortschritt: 3 von 5"}


class StopOnlyTest(unittest.TestCase):
    def test_hidden_in_graph_tree_and_counts(self):
        state = build(
            [ev("session_start", 0, status="idle"), ev("agent_stop", 5, **HELPER)]
        )
        self.assertNotIn("s1:h1", flat(state))
        self.assertNotIn("done", state["counts"])
        self.assertEqual([r["kind"] for r in graph_rows(state)], ["start"])
        self.assertEqual(state["graph"]["columns"], 1)

    def test_role_or_other_event_keeps_node_visible(self):
        with_role = ev("agent_stop", 5, role="Explore", **HELPER)
        self.assertIn("s1:h1", flat(build([with_role])))
        beat = ev("heartbeat", 4, agent_id="h1", tool="Read")
        state = build([beat, ev("agent_stop", 5, **HELPER)])
        self.assertIn("s1:h1", flat(state))
        self.assertEqual([r["kind"] for r in graph_rows(state)], ["start", "report"])


class NamesTest(unittest.TestCase):
    def test_all_personas_have_names(self):
        agents = Path(__file__).resolve().parents[3] / ".claude" / "agents"
        self.assertEqual({p.stem for p in agents.glob("*.md")}, set(PERSONA_NAMES))
        self.assertEqual(model.read_agent_names(agents), PERSONA_NAMES)

    def test_read_agent_names_from_frontmatter(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "lead-qa.md").write_text(
                '---\nname: lead-qa\nmodel: opus\nstudio-name: "Prüf-Peter"\n'
                "studio-title: 'QA-Chef'\n---\nText\n",
                "utf-8",
            )
            (folder / "lead-art.md").write_text("---\nname: lead-art\n---\n", "utf-8")
            names = model.read_agent_names(folder)
        self.assertEqual(names, {"lead-qa": {"name": "Prüf-Peter", "title": "QA-Chef"}})
        node = flat(build(lead(), agent_names=names))["s1:a1"]
        self.assertEqual(
            (node["name"], node["title"], node["emoji"]),
            ("Prüf-Peter", "QA-Chef", model.FOREIGN_EMOJI),
        )

    def test_director_and_foreign_fallbacks(self):
        nodes = flat(named([start(1, "x1", "Explore")]))
        main, helper = nodes["s1:main"], nodes["s1:x1"]
        self.assertEqual(
            (main["name"], main["title"], main["emoji"]),
            ("Boss Bruno", "Projektleiter", "🎬"),
        )
        self.assertEqual(
            (helper["name"], helper["title"], helper["emoji"]),
            ("Aushilfe", "Explore", "🧑‍🔧"),
        )

    def test_name_follows_final_role(self):
        events = [
            spawn(
                1,
                "main",
                "general-purpose",
                persona="design-genre-researcher",
                tool_use_id="t1",
            ),
            spawn(2, "main", "general-purpose", tool_use_id="t2"),
            start(3, "g1", "general-purpose"),
            start(4, "g2", "general-purpose"),
            ev("spawned", 5, agent_id="main", child_id="g2", tool_use_id="t1"),
            ev("spawned", 6, agent_id="main", child_id="g1", tool_use_id="t2"),
        ]
        nodes = flat(named(events))
        self.assertEqual(nodes["s1:g2"]["name"], "Genre-Gina")
        self.assertEqual(nodes["s1:g1"]["name"], "Aushilfe")

    def test_task_short(self):
        exact, longer = "x" * 30, "y" * 31
        events = [
            ev("prompt", 1, status="active", task="Erste Zeile des Auftrags"),
            spawn(2, "main", "lead-qa", description=exact),
            start(3, "a1", "lead-qa"),
            spawn(4, "main", "lead-tech", description=longer),
            start(5, "a2", "lead-tech"),
        ]
        nodes = flat(named(events))
        self.assertEqual(nodes["s1:a1"]["task_short"], exact)
        self.assertEqual(nodes["s1:a2"]["task_short"], "y" * 30 + "…")
        self.assertEqual(nodes["s1:main"]["task_short"], "Erste Zeile des Auftrags")

    def test_fold_window_matches_bind_window(self):
        self.assertEqual(graph.FOLD_WINDOW, model.BIND_WINDOW)

    def sims(self, *spans):
        """Je (start, stop) ein tech-sim-engineer-Lauf w1, w2, … (stop None = offen)."""
        events = []
        for n, (a, b) in enumerate(spans, 1):
            events.append(start(a, f"w{n}", "tech-sim-engineer"))
            if b is not None:
                events.append(stop(b, f"w{n}", "tech-sim-engineer"))
        return flat(named(events, now=200))

    def test_second_instance_gets_suffix(self):
        nodes = self.sims((1, None), (2, None))
        self.assertEqual(
            [(nodes[k]["name"], nodes[k]["instance"]) for k in ("s1:w1", "s1:w2")],
            [("Logik-Lars", 1), ("Logik-Lars (2)", 2)],
        )

    def test_instance_number_rule(self):
        nodes = self.sims((1, 10), (2, 30), (20, 40), (50, None))
        numbers = [nodes[f"s1:w{n}"]["instance"] for n in (1, 2, 3, 4)]
        self.assertEqual(numbers, [1, 2, 3, 1])

    def test_paused_node_holds_no_instance(self):
        events = [
            start(1, "w1", "tech-sim-engineer"),
            stop(5, "w1", "tech-sim-engineer"),
            start(10, "w2", "tech-sim-engineer"),
            message(15, "main", "w1"),
            start(20, "w1", "tech-sim-engineer"),
        ]
        nodes = flat(named(events))
        self.assertEqual(
            (nodes["s1:w1"]["instance"], nodes["s1:w2"]["instance"]), (1, 1)
        )

    def test_log_only_and_foreign_second_instance(self):
        events = [
            start(1, "x1", "Explore"),
            start(2, "x2", "Explore"),
            log_status(3, "lead-art", "blocked", task="Lizenz"),
        ]
        nodes = flat(named(events))
        self.assertEqual(nodes["s1:x2"]["name"], "Aushilfe (2)")
        self.assertEqual(nodes["s1:log:lead-art"]["name"], "Pinsel-Pia")

    def test_layout_error_keeps_state(self):
        events = [start(1, "w1", "tech-sim-engineer")]
        with unittest.mock.patch.object(
            model.graph, "Layout", side_effect=RuntimeError("kaputt")
        ):
            nodes = flat(named(events))
        self.assertEqual(
            (nodes["s1:w1"]["name"], nodes["s1:w1"]["instance"]), ("Logik-Lars", 1)
        )


class GraphFixtureTest(unittest.TestCase):
    # (kind, label, text, dot, arrow, Spuren oben) laut Spec, Tabelle „Erwartete Graph-Zeilen"
    REFERENCE = (
        ("start", "Boss Bruno", "Session beginnt", 0, None, "S...."),
        (
            "order",
            "Boss Bruno → Technik-Toni",
            "Handelsrouten umsetzen",
            1,
            (0, 1, "branch"),
            "SS...",
        ),
        (
            "order",
            "Technik-Toni → Logik-Lars",
            "Routen-Simulation",
            2,
            (1, 2, "branch"),
            "SSS..",
        ),
        (
            "order",
            "Technik-Toni → Logik-Lars (2)",
            "Zollberechnung",
            3,
            (1, 3, "branch"),
            "SSSS.",
        ),
        (
            "order",
            "Boss Bruno → Aushilfe",
            "Bestehende Handelsdateien suchen",
            4,
            (0, 4, "branch"),
            "SSSSS",
        ),
        (
            "report",
            "Aushilfe → Boss Bruno",
            "3 Dateien gefunden: trade.ts, ships.ts, ports.ts",
            4,
            (4, 0, "merge"),
            "SSSS.",
        ),
        ("status", "Logik-Lars (2)", "Zollsatz fehlt in defs", 3, None, "SSSS."),
        (
            "message",
            "Logik-Lars (2) → Boss Bruno",
            "Zollsatz fehlt in src/sim/defs — 10 % oder 15 %?",
            3,
            (3, 0, "message"),
            "SSSS.",
        ),
        (
            "message",
            "Boss Bruno → Technik-Toni",
            "Zoll 10 %, bitte an Logik-Lars (2) weitergeben",
            0,
            (0, 1, "message"),
            "SSSS.",
        ),
        (
            "message",
            "Technik-Toni → ? zoll-helfer",
            "<img src=x onerror=alert(1)>",
            1,
            (1, None, "message"),
            "SSSS.",
        ),
        (
            "status",
            "Logik-Lars (2)",
            "Zollberechnung abgebrochen, Werte fehlen",
            3,
            None,
            "SSSS.",
        ),
        (
            "report",
            "Logik-Lars (2) → Technik-Toni",
            "Abgebrochen",
            3,
            (3, 1, "merge"),
            "SSS..",
        ),
        (
            "report",
            "Logik-Lars → Technik-Toni",
            "Routen-Simulation fertig, 12 Tests grün",
            2,
            (2, 1, "merge"),
            "SSD..",
        ),
        (
            "order",
            "Technik-Toni → Review-Rita",
            "Review Routen-Simulation",
            3,
            (1, 3, "branch"),
            "SSDS.",
        ),
        ("status", "Technik-Toni", "Wartet auf Review", 1, None, "SSDS."),
        (
            "report",
            "Review-Rita → Technik-Toni",
            "2 Befunde: Rundung in trade.ts, fehlender Test",
            3,
            (3, 1, "merge"),
            "SSD..",
        ),
        ("pause", "", "… 7 min …", None, None, "SSD.."),
        ("message", "Technik-Toni → Logik-Lars", None, 1, (1, 2, "message"), "SSS.."),
        (
            "report",
            "Logik-Lars → Technik-Toni",
            "Befunde behoben, 14 Tests grün",
            2,
            (2, 1, "merge"),
            "SS...",
        ),
        (
            "status",
            "Technik-Toni",
            "Handelsrouten umgesetzt und geprüft",
            1,
            None,
            "SS...",
        ),
        (
            "report",
            "Technik-Toni → Boss Bruno",
            "Handelsrouten fertig",
            1,
            (1, 0, "merge"),
            "S....",
        ),
    )

    def state(self, events, now, session):
        return model.build_state(
            events, now, MODELS, session=session, agent_names=self.names()
        )

    @staticmethod
    def names():
        agents = Path(__file__).resolve().parents[3] / ".claude" / "agents"
        return model.read_agent_names(agents)

    def test_fixture_matches_reference(self):
        state = self.state(make_demo.graph_session(T0), T0 + 22 * 60, make_demo.GRAPH)
        graph = state["graph"]
        self.assertEqual((graph["columns"], graph["truncated"]), (5, False))
        rows = graph_rows(state)
        self.assertEqual(len(rows), len(self.REFERENCE))
        long_text = make_demo.LANG[:160] + "…"
        for row, (kind, label, text, dot, arrow, lanes) in zip(rows, self.REFERENCE):
            with self.subTest(row=row["id"]):
                got_arrow = row["arrow"] and tuple(row["arrow"].values())
                self.assertEqual(
                    (
                        row["kind"],
                        row["label"],
                        row["text"],
                        row["dot"],
                        got_arrow,
                        ups(row),
                    ),
                    (kind, label, text or long_text, dot, arrow, lanes),
                )
        self.assertEqual(rows[9]["to"], "?")
        self.assertEqual(
            (rows[17]["lanes"][2]["down"], rows[17]["lanes"][2]["up"]),
            ("dashed", "solid"),
        )
        self.assertEqual(
            (rows[12]["lanes"][2]["down"], rows[12]["lanes"][2]["up"]),
            ("solid", "dashed"),
        )
        self.assertEqual(rows[13]["lanes"][3]["down"], "none")
        older_ts = rows[15]["id"].split(":", 3)[3]
        self.assertEqual(rows[16]["id"], f"pause:{make_demo.GRAPH}:-:{older_ts}")

    def test_fixture_nodes_and_counts(self):
        state = self.state(make_demo.graph_session(T0), T0 + 22 * 60, make_demo.GRAPH)
        nodes = flat(state)
        g = make_demo.GRAPH
        self.assertNotIn(f"{g}:g-help", nodes)
        self.assertEqual(state["counts"].get("done"), 4)
        self.assertEqual(state["counts"].get("failed"), 1)
        self.assertEqual(state["counts"].get("idle"), 1)
        main = nodes[f"{g}:main"]
        self.assertEqual(main["task_short"], "Handelsrouten umsetzen und prü…")
        ts2 = nodes[f"{g}:g-ts2"]
        self.assertEqual(
            (ts2["name"], ts2["status"], ts2["task"]),
            ("Logik-Lars (2)", "failed", "Zollsatz fehlt in defs"),
        )
        self.assertEqual(nodes[f"{g}:g-ex"]["title"], "Explore")

    def test_old_session_retrospective(self):
        state = self.state(make_demo.old_session(), make_demo.NOW, make_demo.OLD)
        rows = graph_rows(state)
        self.assertEqual(
            [(r["kind"], r["label"], r["text"]) for r in rows],
            [
                ("start", "Boss Bruno", "Session beginnt"),
                ("order", "Boss Bruno → Zocker-Zoe", "Speichern/Laden durchspielen"),
                ("pause", "", "… 20 min …"),
                (
                    "report",
                    "Zocker-Zoe → Boss Bruno",
                    "Laden nach Neustart ok, ein Rundungsfehler im Lager",
                ),
                ("pause", "", "… 8 min …"),
                ("end", "Boss Bruno", "Session beendet"),
            ],
        )
        self.assertEqual(ups(rows[-1]), "..")

    def test_wide_session_columns(self):
        state = self.state(make_demo.wide_session(T0), T0 + 180, make_demo.WIDE)
        rows = graph_rows(state)
        self.assertEqual((state["graph"]["columns"], len(rows)), (10, 10))
        self.assertEqual(ups(rows[-1]), "S" * 10)
        self.assertEqual(rows[1]["label"], "Boss Bruno → Prüf-Peter")
        self.assertEqual(
            [(r["label"], r["text"], r["dot"]) for r in rows[2:4]],
            [
                ("Prüf-Peter → Review-Rita", "Review Teil 1", 2),
                ("Prüf-Peter → Review-Rita (2)", "Review Teil 2", 3),
            ],
        )
        nodes = flat(state)
        w = make_demo.WIDE
        self.assertEqual(
            [nodes[f"{w}:w-r{k}"]["instance"] for k in range(1, 9)], list(range(1, 9))
        )
        self.assertEqual(nodes[f"{w}:w-r8"]["name"], "Review-Rita (8)")

    def test_append_g9_adds_two_rows_without_pause(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "events.jsonl"
            with contextlib.redirect_stdout(io.StringIO()):
                make_demo.main([str(path)])
                make_demo.main(["--append-g9", str(path)])
            events = [json.loads(line) for line in path.read_text("utf-8").splitlines()]
        state = self.state(events, make_demo.NOW, make_demo.GRAPH)
        rows = state["graph"]["rows"]
        self.assertEqual(len(rows), 23)
        self.assertEqual(
            [(r["label"], r["to"], r["arrow"]["to_col"]) for r in rows[:2]],
            [
                ("Boss Bruno → ? unbekannt-7", "?", None),
                ("Boss Bruno → Aushilfe", f"{make_demo.GRAPH}:g-ex", None),
            ],
        )
        self.assertEqual([r["kind"] for r in rows[:3]].count("pause"), 0)
        stamps = [
            datetime.fromisoformat(e["ts"].replace("Z", "+00:00")).timestamp()
            for e in events
        ]
        latest = max(
            stamp
            for stamp, e in zip(stamps[:-2], events[:-2])
            if e["session_id"] == make_demo.GRAPH
        )
        self.assertAlmostEqual(stamps[-2], latest + 20, places=2)
        self.assertAlmostEqual(stamps[-1], latest + 30, places=2)

    def test_append_g9_needs_file(self):
        for argv in (["--append-g9"], ["--append-g9", "a.jsonl", "b.jsonl"]):
            with self.subTest(argv=argv), tempfile.TemporaryDirectory() as tmp:
                err = io.StringIO()
                cwd = os.getcwd()
                os.chdir(tmp)
                try:
                    with contextlib.redirect_stderr(err):
                        code = make_demo.main(argv)
                    created = os.listdir(tmp)
                finally:
                    os.chdir(cwd)
                self.assertEqual(code, 2)
                self.assertIn(
                    "Aufruf: make_demo.py --append-g9 <datei>", err.getvalue()
                )
                self.assertEqual(created, [])


class GateSpecFixesTest(unittest.TestCase):
    def test_session_restart_clears_ended(self):
        events = [
            ev("session_start", 0, status="idle"),
            ev("session_end", 10, status="ended"),
            ev("session_start", 20, status="idle"),
        ]
        self.assertIsNone(build(events)["sessions"][0]["ended"])
        self.assertIsNotNone(build(events[:2])["sessions"][0]["ended"])

    def test_chronicle_skips_stop_only_nodes(self):
        helper = ev(
            "agent_stop", 5, agent_id="h1", status="done", summary="Fortschritt"
        )
        self.assertEqual(build([helper])["chronicle"], [])
        real = ev(
            "agent_stop",
            6,
            agent_id="x1",
            role="Explore",
            status="done",
            summary="Gefunden",
        )
        texts = [c["text"] for c in build([helper, real])["chronicle"]]
        self.assertEqual(texts, ["Gefunden"])
        self.assertNotIn("_key", build([real])["chronicle"][0])


if __name__ == "__main__":
    unittest.main()
