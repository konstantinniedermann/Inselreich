import unittest
from datetime import datetime, timezone

import effort
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


def scenario():
    return [
        spawn(
            0,
            "main",
            "lead-qa",
            persona="lead-qa",
            package_id="P1",
            milestone="M9",
            estimate={"minutes": 10, "tools": 20},
            briefing="briefings/x.md",
            persona_version="1.2",
        ),
        start(1, "a1", "lead-qa", persona_version="1.2", handbook_version="2.0"),
        ev(
            "budget",
            2,
            agent_id="",
            source="log",
            role="lead-qa",
            budget={"granted": 1, "parallel": 1, "phase": "P"},
        ),
        spawn(3, "a1", "qa-code-reviewer", package_id="P1"),
        start(4, "a2", "qa-code-reviewer"),
        spawn(5, "a1", "qa-playtester"),
        start(6, "a3", "qa-playtester"),
        spawn(7, "a1", "qa-playtester"),
        start(8, "a4", "qa-playtester"),
        ev("heartbeat", 10, agent_id="a2", tool="Read"),
        ev("heartbeat", 11, agent_id="a2", tool="Read"),
        ev("heartbeat", 12, agent_id="a2", tool="Grep"),
        stop(
            60,
            "a2",
            "qa-code-reviewer",
            report="berichte/y.md",
            usage={
                "claude-sonnet-5-5": {
                    "input": 2,
                    "cache_write": 10,
                    "cache_read": 100,
                    "output": 50,
                    "messages": 2,
                    "complete": 1,
                }
            },
        ),
        ev(
            "result",
            70,
            agent_id="",
            source="log",
            role="lead-qa",
            package_id="P1",
            worker="qa-code-reviewer",
            outcome="angenommen",
            review_rounds=1,
        ),
        ev(
            "ci",
            71,
            agent_id="",
            source="log",
            run_id="7",
            conclusion="failure",
            branch="main",
            workflow="ci",
        ),
        ev(
            "retro",
            80,
            agent_id="",
            source="log",
            retro_id="R1",
            retro_kind="adhoc",
            triggers=["ci:7"],
            report="x.md",
        ),
    ]


class EffortStateTest(unittest.TestCase):
    def test_scenario(self):
        events = scenario()
        state = model.build_state(events, T0 + 600, MODELS, session="all")
        rec = {r["role"]: r for r in state["records"]}
        self.assertEqual(rec["qa-code-reviewer"]["tool_calls"], 3)
        self.assertEqual(rec["qa-code-reviewer"]["lead"], "lead-qa")
        self.assertTrue(rec["qa-code-reviewer"]["output_lower_bound"])
        self.assertEqual(rec["lead-qa"]["estimate"], {"minutes": 10, "tools": 20})
        self.assertEqual(rec["lead-qa"]["persona_version"], "1.2")
        self.assertEqual(rec["lead-qa"]["handbook_version"], "2.0")
        self.assertEqual(rec["qa-code-reviewer"]["report"], "berichte/y.md")
        first = state["delegations"][-1]
        self.assertEqual((first["from"], first["to"]), ("studio-director", "lead-qa"))
        self.assertEqual(first["briefing"], "briefings/x.md")
        lead_row = next(r for r in state["effort"]["by_lead"] if r["key"] == "lead-qa")
        self.assertEqual(lead_row["output"], 50)
        self.assertEqual(state["quality"]["first_pass_rate"], 1.0)
        self.assertEqual(state["quality"]["ci_failures"], 1)
        ids = {i["id"] for i in state["incidents"]}
        self.assertNotIn("ci:7", ids)  # quittiert
        self.assertIn("budget:lead-qa:P", ids)
        self.assertEqual(
            [i["id"] for i in model.pending_incidents(events, T0 + 600)],
            [i["id"] for i in state["incidents"]],
        )

    def test_missing_measurements_are_none(self):
        state = model.build_state(scenario(), T0 + 600, MODELS, session="all")
        rec = {r["role"]: r for r in state["records"]}
        self.assertIsNone(rec["lead-qa"]["duration_s"])
        self.assertEqual(rec["lead-qa"]["tokens"], {})
        self.assertEqual(rec["qa-code-reviewer"]["duration_s"], 56)
        row = next(r for r in state["effort"]["by_role"] if r["key"] == "lead-qa")
        self.assertIsNone(row["output"])
        self.assertIsNone(row["duration_s"])

    def test_estimate_uses_wallclock_and_subtree_tools(self):
        events = scenario() + [
            ev("heartbeat", 20, agent_id="a1", tool="Read"),
            stop(120, "a1", "lead-qa"),
        ]
        state = model.build_state(events, T0 + 600, MODELS, session="all")
        est = state["effort"]["estimate_vs_actual"]
        self.assertEqual(est["count"], 1)
        self.assertEqual(est["estimated_min"], 10)
        self.assertEqual(est["actual_min"], round(119 / 60, 2))
        self.assertEqual(est["estimated_tools"], 20)
        self.assertEqual(est["actual_tools"], 7)  # a1: 3 spawn + 1 Heartbeat, a2: 3

    def test_gap(self):
        events = [
            spawn(0, "main", "qa-code-reviewer"),
            start(0, "a1", "qa-code-reviewer"),
            ev("heartbeat", 400, agent_id="a1", tool="Read"),
        ]
        state = model.build_state(events, T0 + 500, MODELS, session="all")
        rec = next(r for r in state["records"] if r["agent_id"] == "a1")
        self.assertEqual(rec["max_gap_s"], 400)
        self.assertEqual(state["quality"]["gap_agents"], 1)

    def test_quality_rules(self):
        empty = effort.quality([], [], [], [])
        self.assertIsNone(empty["first_pass_rate"])
        self.assertIsNone(empty["ci_runs"])
        results = [
            {"outcome": "angenommen", "review_rounds": 0},
            {"outcome": "angenommen", "review_rounds": 1},
            {"outcome": "nacharbeit", "review_rounds": 1},
        ]
        q = effort.quality([], results, [], [])
        self.assertEqual(q["unchecked"], 1)
        self.assertEqual(q["first_pass_rate"], 0.5)
        only_unchecked = effort.quality([], results[:1], [], [])
        self.assertIsNone(only_unchecked["first_pass_rate"])

    def test_no_estimates(self):
        state = model.build_state(
            [spawn(0, "main", "qa-code-reviewer")], T0 + 5, MODELS, session="all"
        )
        est = state["effort"]["estimate_vs_actual"]
        self.assertEqual(est["count"], 0)
        self.assertIsNone(est["deviation_pct"])

    def test_incident_rules(self):
        rec = {"key": "s:a", "role": "x", "status": "failed", "stopped": 1.0}
        rec["started"] = 0.0
        out = effort.incidents(
            [rec],
            [{"package": "P", "review_rounds": 4}],
            [{"run_id": "9", "conclusion": "failure", "branch": "dev"}],
            [{"lead": "l", "phase": "p", "granted": 2, "used": 3}],
            [{"id": "M1", "status": "done"}],
            {"meilenstein:M1"},
            ["s:b"],
        )
        self.assertEqual(
            {i["id"] for i in out}, {"failed:s:a", "inaktiv:s:b", "runden:P"}
        )

    def test_unknown_event_and_legacy_package(self):
        events = [
            ev("gibtsnicht", 1, foo=1),
            ev("package", 2, agent_id="", source="log", package="OLD", title="t"),
            log_status(3, "lead-qa", "active", package="OLD"),
        ]
        state = model.build_state(events, T0 + 10, MODELS, session="all")
        self.assertEqual([b["id"] for b in state["board"]], ["OLD"])
        node = next(r for r in state["records"] if r["role"] == "lead-qa")
        self.assertEqual(node["package"], "OLD")


def result_ev(t, package, worker, outcome, rounds, role="lead-qa"):
    return ev(
        "result",
        t,
        agent_id="",
        source="log",
        role=role,
        package_id=package,
        worker=worker,
        outcome=outcome,
        review_rounds=rounds,
    )


class FixRoundTest(unittest.TestCase):
    def state(self, events, now=600):
        return model.build_state(events, T0 + now, MODELS, session="all")

    def test_results_deduplicated_latest_wins(self):
        events = [
            result_ev(1, "P1", "qa-code-reviewer", "nacharbeit", 1),
            result_ev(2, "P1", "qa-code-reviewer", "angenommen", 5),
        ]
        state = self.state(events)
        self.assertEqual(state["quality"]["results"], 1)
        self.assertEqual(state["quality"]["rework"], 0)
        self.assertIn("runden:P1", {i["id"] for i in state["incidents"]})

    def test_waiting_lead_has_no_gap(self):
        events = [
            spawn(0, "main", "lead-qa"),
            start(0, "a1", "lead-qa"),
            spawn(1, "a1", "qa-code-reviewer"),
            start(2, "a2", "qa-code-reviewer"),
        ]
        events += [
            ev("heartbeat", t, agent_id="a2", tool="Read") for t in range(50, 600, 50)
        ]
        events += [
            stop(600, "a2", "qa-code-reviewer"),
            ev("heartbeat", 601, agent_id="a1"),
        ]
        state = self.state(events, 700)
        rec = {r["role"]: r for r in state["records"]}
        self.assertLess(rec["lead-qa"]["max_gap_s"], 300)
        self.assertEqual(state["quality"]["gap_agents"], 0)

    def test_outcome_only_for_worker(self):
        events = [
            spawn(0, "main", "lead-qa", package_id="P1"),
            start(1, "a1", "lead-qa"),
            spawn(2, "a1", "qa-code-reviewer", package_id="P1"),
            start(3, "a2", "qa-code-reviewer"),
            result_ev(9, "P1", "qa-code-reviewer", "verworfen", 1),
        ]
        by_to = {d["to"]: d for d in self.state(events)["delegations"]}
        self.assertEqual(by_to["qa-code-reviewer"]["outcome"], "verworfen")
        self.assertIsNone(by_to["lead-qa"]["outcome"])

    def test_non_numeric_estimate_is_dropped(self):
        events = [
            spawn(0, "main", "lead-qa", estimate={"minutes": "10", "tools": True}),
            start(1, "a1", "lead-qa"),
            stop(60, "a1", "lead-qa"),
        ]
        state = self.state(events)
        rec = next(r for r in state["records"] if r["role"] == "lead-qa")
        self.assertIsNone(rec["estimate"])
        self.assertEqual(state["effort"]["estimate_vs_actual"]["count"], 0)
        self.assertEqual(model.pending_incidents(events, T0 + 600), [])

    def test_tool_calls_none_without_hook_events(self):
        events = [log_status(1, "lead-qa", "active")]
        rec = next(r for r in self.state(events)["records"] if r["role"] == "lead-qa")
        self.assertIsNone(rec["tool_calls"])
        rows = self.state(events)["effort"]["by_role"]
        row = next(r for r in rows if r["key"] == "lead-qa")
        self.assertIsNone(row["tool_calls"])

    def test_escalations(self):
        events = [
            ev(
                "decision",
                1,
                agent_id="",
                source="log",
                decision_id="D1",
                question="q",
                **{"for": "l0"},
            ),
            ev(
                "queue",
                2,
                agent_id="",
                source="log",
                queue_id="Q1",
                action="add",
                question="q2",
            ),
        ]
        self.assertEqual(self.state(events)["quality"]["escalations"], 2)


if __name__ == "__main__":
    unittest.main()
