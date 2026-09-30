import json
import os
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

import model

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


if __name__ == "__main__":
    unittest.main()
