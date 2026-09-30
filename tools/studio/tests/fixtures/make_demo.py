"""Demo-Events fürs Studio-Dashboard erzeugen (Screenshot und Handprobe).

Aufruf: python3 tools/studio/tests/fixtures/make_demo.py [ziel.jsonl]
Ohne Ziel wird demo_events.jsonl neben diesem Skript geschrieben. Die Zeitstempel
liegen relativ zu „jetzt", damit die Inaktiv-Markierung sichtbar ist — die Datei
also kurz vor dem Anschauen frisch erzeugen.
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

NOW = time.time()
SESSION = "5f3c9a1e-7b2d-4c8e-9f10-2a6b3c4d5e6f"
OLD = "0a9d8c7b-6e5f-4a3b-8c2d-1e0f9a8b7c6d"
XSS = "<img src=x onerror=alert(1)>"


def ts(minutes_ago: float) -> str:
    stamp = datetime.fromtimestamp(NOW - minutes_ago * 60, timezone.utc)
    return stamp.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def hook(kind: str, ago: float, agent: str = "main", sid: str = SESSION, **kw):
    return {
        "ts": ts(ago),
        "session_id": sid,
        "agent_id": agent,
        "source": "hook",
        "kind": kind,
        **kw,
    }


def log(kind: str, ago: float, sid: str = SESSION, **kw):
    return {
        "ts": ts(ago),
        "session_id": sid,
        "agent_id": "",
        "source": "log",
        "kind": kind,
        **kw,
    }


def agent(parent, child, typ, ago, task, model, tid, package="", **spawn):
    """Spawn, Bestätigung und Start eines Subagenten (spawn: estimate, briefing …)."""
    return [
        hook(
            "spawn",
            ago,
            parent,
            subagent_type=typ,
            description=task,
            model=model,
            package=package,
            tool_use_id=tid,
            **spawn,
        ),
        hook("spawned", ago - 0.05, parent, child_id=child, tool_use_id=tid),
        hook("agent_start", ago - 0.1, child, role=typ, status="active"),
    ]


def heartbeats(child, start, end, step, tools):
    beats = []
    ago, i = start, 0
    while ago >= end:
        beats.append(hook("heartbeat", ago, child, tool=tools[i % len(tools)]))
        ago -= step
        i += 1
    return beats


def old_session():
    return [
        hook("session_start", 190, sid=OLD, status="idle", model="opus"),
        hook("prompt", 189, sid=OLD, status="active", task="Playtest M4 auswerten"),
        *[
            {**e, "session_id": OLD}
            for e in agent(
                "main",
                "op1",
                "qa-playtester",
                188,
                "Speichern/Laden durchspielen",
                "sonnet",
                "o1",
            )
        ],
        *[
            {**e, "session_id": OLD}
            for e in heartbeats("op1", 187, 170, 3, ["Bash", "Read"])
        ],
        hook(
            "agent_stop",
            168,
            "op1",
            sid=OLD,
            role="qa-playtester",
            status="done",
            summary="Laden nach Neustart ok, ein Rundungsfehler im Lager",
        ),
        hook("turn_end", 166, sid=OLD, status="idle", summary="Befund notiert"),
        hook("session_end", 160, sid=OLD, status="ended", summary="exit"),
    ]


def current_session():
    events = [
        hook("session_start", 52, status="idle", model="opus"),
        hook(
            "prompt",
            51,
            status="active",
            task="Meilenstein 5: Handel und Schiffe planen und umsetzen",
        ),
        log(
            "budget",
            50,
            role="lead-design",
            budget={"granted": 1, "parallel": 1, "phase": "Spec"},
        ),
        log(
            "budget",
            50,
            role="lead-tech",
            budget={"granted": 1, "parallel": 1, "phase": "Umsetzung"},
        ),
        log(
            "budget",
            50,
            role="lead-qa",
            budget={"granted": 2, "parallel": 0, "phase": "Review"},
        ),
        log(
            "package",
            49,
            package="M5-00",
            title="Spec Handelsrouten",
            owner="lead-design",
            status="done",
            blocked_by=[],
            milestone="M5",
        ),
        log(
            "package",
            49,
            package="M5-01",
            title="Handelsrouten-Simulation",
            owner="tech-sim-engineer",
            status="active",
            blocked_by=[],
            milestone="M5",
        ),
        log(
            "package",
            49,
            package="M5-02",
            title="Handelsfenster und Routenplaner",
            owner="tech-ui-engineer",
            status="blocked",
            blocked_by=["M5-01"],
            milestone="M5",
        ),
        log(
            "package",
            49,
            package="M5-03",
            title="Playtest Handel",
            owner="lead-qa",
            status="open",
            blocked_by=["M5-01", "M5-02"],
            milestone="M5",
        ),
        # Design: Lead plant, Worker schreibt Spec, beide fertig
        *agent(
            "main",
            "ad1",
            "lead-design",
            48,
            "Spec Handelsrouten",
            "opus",
            "t1",
            milestone="M5",
            estimate={"minutes": 12, "tools": 25},
            briefing="briefings/M5-lead-design.md",
        ),
        *agent(
            "ad1",
            "de1",
            "design-economy-designer",
            46,
            "Preise und Zölle für Handelswaren",
            "sonnet",
            "t2",
            "M5-00",
            milestone="M5",
            estimate={"minutes": 8, "tools": 15},
            briefing="briefings/M5-00.md",
        ),
        *heartbeats("de1", 45, 36, 1.5, ["Read", "Write", "Edit"]),
        hook(
            "agent_stop",
            35,
            "de1",
            role="design-economy-designer",
            status="done",
            summary="Preistabelle für 8 Waren, Zoll 10 % je Hafen",
            usage={
                "claude-sonnet-5-5": {
                    "input": 1200,
                    "cache_write": 8000,
                    "cache_read": 64000,
                    "output": 3400,
                    "messages": 18,
                    "complete": 18,
                }
            },
            report="berichte/M5-00.md",
        ),
        hook(
            "agent_stop",
            33,
            "ad1",
            role="lead-design",
            status="done",
            summary="Spec Handelsrouten abgenommen: 3 Routen, Werte in defs",
            usage={
                "claude-opus-4-7": {
                    "input": 400,
                    "cache_write": 6000,
                    "cache_read": 20000,
                    "output": 2100,
                    "messages": 6,
                    "complete": 6,
                }
            },
        ),
        # Tech: Lead delegiert an zwei Worker
        *agent(
            "main",
            "at1",
            "lead-tech",
            32,
            "M5 technisch umsetzen",
            "opus",
            "t3",
            milestone="M5",
            briefing="briefings/M5-lead-tech.md",
        ),
        *agent(
            "at1",
            "ts1",
            "tech-sim-engineer",
            30,
            "Handelsrouten-Simulation in src/sim/trade.ts",
            "sonnet",
            "t4",
            "M5-01",
            milestone="M5",
            estimate={"minutes": 20, "tools": 40},
            briefing="briefings/M5-01.md",
        ),
        *heartbeats("ts1", 29, 0.2, 1.25, ["Read", "Edit", "Bash", "Edit"]),
        *agent(
            "at1",
            "tu1",
            "tech-ui-engineer",
            28,
            "Handelsfenster vorbereiten",
            "sonnet",
            "t5",
            "M5-02",
            milestone="M5",
            briefing="briefings/M5-02.md",
        ),
        *heartbeats("tu1", 27, 10, 2, ["Read", "Grep"]),
        # Review Focus 4: HTML im Task muss als Text erscheinen
        log(
            "status",
            8,
            role="tech-ui-engineer",
            status="active",
            task=XSS,
            package="M5-02",
        ),
        # QA: Review fertig, Lead wartet auf M5-01
        *agent("main", "aq1", "lead-qa", 26, "Qualität M5 sichern", "opus", "t6"),
        *agent(
            "aq1",
            "qr1",
            "qa-code-reviewer",
            25,
            "Review Spec und Datenmodell",
            "sonnet",
            "t7",
            milestone="M5",
            estimate={"minutes": 6},
            briefing="briefings/M5-review.md",
        ),
        *heartbeats("qr1", 24, 17, 1.5, ["Read", "Grep"]),
        hook(
            "agent_stop",
            16,
            "qr1",
            role="qa-code-reviewer",
            status="done",
            summary="Datenmodell ok, zwei Hinweise zu Rundung",
            usage={
                "claude-sonnet-5-5": {
                    "input": 900,
                    "cache_write": 5000,
                    "cache_read": 30000,
                    "output": 1500,
                    "messages": 10,
                    "complete": 8,
                }
            },
            report="berichte/M5-review.md",
        ),
        log(
            "status",
            2,
            role="lead-qa",
            status="waiting",
            task="Wartet auf M5-01 für den Playtest",
        ),
        # Ergebnisse, CI, Meilensteine, Retro, Sitzungskosten
        log(
            "result",
            34,
            package="M5-00",
            worker="design-economy-designer",
            role="lead-design",
            outcome="angenommen",
            review_rounds=1,
            milestone="M5",
        ),
        log(
            "result",
            15,
            package="M5-00",
            worker="qa-code-reviewer",
            role="lead-qa",
            outcome="nacharbeit",
            review_rounds=2,
            milestone="M5",
        ),
        log(
            "ci",
            20,
            run_id="9001",
            conclusion="failure",
            branch="main",
            sha="a1b2c3d",
            workflow="CI",
            created=ts(20),
        ),
        log(
            "ci",
            10,
            run_id="9002",
            conclusion="success",
            branch="main",
            sha="d4e5f6a",
            workflow="CI",
            created=ts(10),
        ),
        log(
            "milestone", 51, milestone="M5", status="start", title="Handel und Schiffe"
        ),
        log(
            "retro",
            5,
            retro_id="R-01",
            retro_kind="adhoc",
            triggers=["failed:none"],
            report="berichte/retro-1.md",
        ),
        hook(
            "usage",
            3,
            "main",
            usage={
                "claude-opus-4-7": {
                    "input": 300,
                    "cache_write": 4000,
                    "cache_read": 90000,
                    "output": 2500,
                    "messages": 12,
                    "complete": 12,
                }
            },
            session_cost={
                "total_usd": 4.87,
                "duration_ms": 3100000,
                "models": {
                    "claude-opus-4-7": {"usd": 3.9},
                    "claude-sonnet-5-5": {"usd": 0.97},
                },
            },
        ),
        # Entscheide: einer erledigt, zwei offen
        log(
            "decision",
            40,
            decision_id="D-01",
            role="lead-design",
            **{"for": "l0", "question": "Drei oder vier Handelsrouten?"},
            recommendation="Drei",
        ),
        log("decision", 38, decision_id="D-01", role="studio-director", resolution="3"),
        log(
            "decision",
            12,
            decision_id="D-02",
            role="lead-design",
            **{
                "for": "user",
                "question": "Sollen Schiffe an fremden Häfen Zoll zahlen?",
            },
            recommendation="Ja, 10 % je Hafen — macht Routenwahl interessant",
        ),
        log(
            "decision",
            6,
            decision_id="D-03",
            role="lead-tech",
            **{
                "for": "l0",
                "question": "Zweiten UI-Engineer für M5-02 starten?",
            },
            recommendation="Nein, erst Blockade durch M5-01 lösen",
        ),
    ]
    return events


def main(argv: list[str]) -> int:
    target = Path(argv[0]) if argv else Path(__file__).with_name("demo_events.jsonl")
    events = old_session() + current_session()
    lines = [json.dumps(e, ensure_ascii=False, separators=(",", ":")) for e in events]
    target.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(events)} Events nach {target}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
