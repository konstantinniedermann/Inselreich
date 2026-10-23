"""PreToolUse-Hook: Leads starten keine Warte-Agenten und kein `sleep` im Hintergrund (R646, R647).

Regel A: `Agent`/`Task` durch einen Lead mit kurzem reinem Warte-Prompt (ohne Auftrag).
Regel B: `Bash` mit `run_in_background`, dessen Segment mit `sleep <zahl>` beginnt.
Regel C (R854): `Agent`/`Task` mit `run_in_background: true` durch Lead oder anderen Subagenten.
A und B betreffen nur Aufrufer mit `agent_type` «lead-*»; C jeden nicht leeren `agent_type`
(die Hauptsession hat keinen). Fehlt das Feld, wird zugelassen.
Eigenes Modul statt guard.py: guard.py ist verfassungsgeschützt (§1.3), die Regel ist Handbuch.
Fehler lassen zu (Hooks werfen nie). Plan: docs/superpowers/plans/2026-10-14-tool-guard-warteagent.md
"""

from __future__ import annotations

import contextlib
import json
import re
import sys
from collections.abc import Mapping

MODE = "deny"  # Rückfall "warn": Hinweis statt Block (Entscheid per Ruling von L0)
AGENT_TOOLS = ("Agent", "Task")
SKIP_TYPES = {"fork"}
HEADER_LINES = 15
HEADER_KEYS = {
    "persona",
    "paket",
    "modell",
    "budget",
    "meilenstein",
    "schätzung",
    "prozessstufe",
}
MAX_CHARS = 200
MAX_WORDS = 30
SUFFIX = " (waitguard, R646/R647)"
BACKGROUND_REASON = (
    "R854: Arbeiter im Vordergrund starten (run_in_background: false); parallel = "
    "mehrere Agent-Aufrufe in einer Nachricht. Das Ergebnis kommt so direkt zum Auftraggeber."
)

HEADER = re.compile(r"^[-*#>\s]*\**\s*([^:*]{1,30}?)\s*\**\s*:")
SENTENCE = re.compile(r"[.!?;\n]+")
WAIT = re.compile(
    r"\b(warte\w*|wait\w*|sleep|poll\w*|abwarten|ok|okay|ping|status abfragen)\b"
    r"|pr(ü|ue)fe? ob .* fertig|schau nach ob .* (fertig|durch)|bis .* (fertig|durch|grün)",
    re.IGNORECASE,
)
WORK = re.compile(
    r"\b(schreib\w*|implementier\w*|review\w*|teste?|baue?|migrier\w*|erstelle?|lies|analysier\w*)\b"
    r"|pr(ü|ue)fe? (den|die|das) (diff|code|branch)"
    r"|/|\.(py|ts|md)\b|\bT\d+\b|\bAK-\d",
    re.IGNORECASE,
)
SEGMENTS = re.compile(r";|&&|\|\||\||\n")
SLEEP = re.compile(r"^(?:(?:timeout|nice|env)\s+(?:[-\w=.]+\s+)*?)?sleep\s+\d")
LOOP_START = re.compile(r"(until|while|for)\s")
LOOP_BODY = ("do ", "then ", "else ")


def body(prompt: str) -> str:
    """Prompt ohne Kopfzeilen (`Persona:`, `Paket:` …) der ersten Zeilen."""
    lines = prompt.splitlines()
    kept = []
    for index, raw in enumerate(lines):
        found = HEADER.match(raw) if index < HEADER_LINES else None
        if found and found.group(1).strip().casefold() in HEADER_KEYS:
            continue
        kept.append(raw)
    return " ".join(" ".join(kept).split())


def agent_reason(tool_input: Mapping) -> str | None:
    """Regel A: Grund für den Block oder None."""
    if str(tool_input.get("subagent_type") or "") in SKIP_TYPES:
        return None
    text = body(str(tool_input.get("prompt") or ""))
    if text:
        if len(text) > MAX_CHARS or len(text.split()) > MAX_WORDS:
            return None
        if WORK.search(text):
            return None
        sentences = [s for s in SENTENCE.split(text) if s.strip()]
        if not all(WAIT.search(s) for s in sentences):
            return None
    return (
        "Warte-Agent ohne Auftrag (Regel A): Ein Agent-Start braucht einen konkreten Auftrag. "
        "Warten bedeutet: Monitor mit until-Schleife oder Hintergrund-Bash, dann auf die "
        "Benachrichtigung reagieren, nicht einen Agenten starten" + SUFFIX
    )


def bash_reason(tool_input: Mapping) -> str | None:
    """Regel B: Grund für den Block oder None."""
    if not tool_input.get("run_in_background"):
        return None
    depth = 0  # Schleifentiefe über die Segmente: until/while/for … done
    for raw in SEGMENTS.split(str(tool_input.get("command") or "")):
        segment = raw.strip()
        if LOOP_START.match(segment):
            depth += 1
        elif re.match(r"done\b", segment):
            depth = max(0, depth - 1)
        if depth or segment.startswith(LOOP_BODY):
            continue
        if SLEEP.match(segment):
            return (
                "`sleep` im Hintergrund (Regel B): Auf ein Ereignis wartet ein Monitor mit "
                "`until <Bedingung>; do sleep 2; done`, nicht ein Hintergrund-`sleep`"
                + SUFFIX
            )
    return None


def background_reason(tool_input: Mapping) -> str | None:
    """Regel C: Grund für den Block oder None (Aufrufer ist vorab als Subagent geprüft)."""
    if tool_input.get("run_in_background") is not True:
        return None
    if str(tool_input.get("subagent_type") or "") in SKIP_TYPES:
        return None
    return BACKGROUND_REASON


def main() -> int:
    try:
        from paths import append_event, now_iso

        payload = json.loads(sys.stdin.read() or "null")
        if (
            not isinstance(payload, dict)
            or payload.get("hook_event_name") != "PreToolUse"
        ):
            return 0
        data = payload.get("tool_input")
        tool = payload.get("tool_name")
        caller = str(payload.get("agent_type") or "")
        if not caller or not isinstance(data, dict):
            return 0
        if tool in AGENT_TOOLS and background_reason(data):
            rule, found = "C", background_reason(data)
        elif not caller.startswith("lead-"):
            return 0
        elif tool in AGENT_TOOLS:
            rule, found = "A", agent_reason(data)
        elif tool == "Bash":
            rule, found = "B", bash_reason(data)
        else:
            return 0
        if not found:
            return 0
        block = MODE == "deny"
        with contextlib.suppress(Exception):
            append_event(
                {
                    "ts": now_iso(),
                    "session_id": str(payload.get("session_id") or ""),
                    "agent_id": str(payload.get("agent_id") or "main"),
                    "source": "hook",
                    "kind": "wait_guard",
                    "mode": MODE,
                    "rule": rule,
                    "persona": caller,
                    "summary": found[:160],
                    "blocked": block,
                }
            )
        if block:
            out = {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": found,
            }
            print(json.dumps({"hookSpecificOutput": out}, ensure_ascii=False))
        else:
            out = {"hookEventName": "PreToolUse", "additionalContext": found}
            print(
                json.dumps(
                    {"hookSpecificOutput": out, "systemMessage": found},
                    ensure_ascii=False,
                )
            )
    except Exception:  # noqa: BLE001 - Hooks werfen nie
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
