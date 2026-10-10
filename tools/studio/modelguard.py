"""PreToolUse-Hook: Persona-Starts gegen die Modelltabelle (E-038, R420 V1).

Basis ist das Persona-Frontmatter; Ausnahmen stehen nur in der Tabelle «Modellwahl» in
docs/studio/STUDIO.md. Ein stärkeres Modell braucht die Kopfzeile `Modell: <alias> (<Einsatz>)`.
Eigenes Modul statt guard.py: guard.py ist verfassungsgeschützt (§1.3), diese Regel ist Handbuch.
Fehler lassen zu.
"""

from __future__ import annotations

import contextlib
import json
import re
import sys
from collections.abc import Mapping

MODE = "deny"  # aktiv seit TOOL-AKTIVIERUNG (ADR-014, R428); Startzustand war "warn"
AGENT_TOOLS = ("Agent", "Task")
SKIP_TYPES = {"fork"}
SECTION = "## Modellwahl"
ROW = re.compile(r"^\|[^|]+\|\s*`?([a-z]+)`?\s*\|(.+)\|\s*$")
PAREN = re.compile(r"\((.*)\)")  # erste «(» bis letzte «)» der Zeile
COMMA = re.compile(r",\s*(?![^()]*\))")  # Komma ausserhalb von Klammern
HEADER_LINES = 15
SUFFIX = " (E-038, R420; STUDIO.md Modellwahl)"


def _norm(text: str) -> str:
    return " ".join(text.replace("`", "").split()).casefold()


def model_table(text: str) -> list[tuple[str, list[str]]]:
    """[(Alias, [Einsatz, …])] von stark nach klein; leer ohne Abschnitt."""
    rows: list[tuple[str, list[str]]] = []
    inside = False
    for line in text.splitlines():
        if line.startswith("## "):
            inside = line.strip() == SECTION
            continue
        match = ROW.match(line.strip()) if inside else None
        if match:
            parts = COMMA.split(match.group(2))
            uses = [" ".join(p.replace("`", "").split()) for p in parts]
            rows.append((match.group(1), [u for u in uses if u]))
    return rows


def _header(prompt: str, key: str) -> str:
    """Wert der Kopfzeile `key` in den ersten Zeilen (wie hook.header_text, ohne Import)."""
    for raw in prompt.splitlines()[:HEADER_LINES]:
        line = raw.strip().lstrip("-*#> ").replace("**", "").strip()
        name, sep, value = line.partition(":")
        if sep and name.strip().casefold() == key.casefold():
            return value.strip().strip("`").strip()
    return ""


def _persona(tool_input: Mapping) -> str:
    kind = str(tool_input.get("subagent_type") or "general-purpose")
    if kind == "general-purpose":
        prompt = str(tool_input.get("prompt") or "")
        return (_header(prompt, "Persona").split() or [""])[0]
    return kind


def reason(tool_input: Mapping, personas: Mapping[str, Mapping], table) -> str | None:
    kind = str(tool_input.get("subagent_type") or "general-purpose")
    prompt = str(tool_input.get("prompt") or "")
    if kind in SKIP_TYPES or not table:
        return None
    persona = _persona(tool_input)
    if persona not in personas:
        return None
    ranks = {alias: index for index, (alias, _) in enumerate(table)}
    base = str(personas[persona].get("model") or "inherit")
    wanted = str(tool_input.get("model") or base)
    if base not in ranks:
        return None
    if wanted not in ranks:
        return None  # unbekannter Alias: zulassen, Hinweis über unknown_alias()
    if ranks[wanted] >= ranks[base]:
        return None
    uses = dict(table)[wanted]
    line = _header(prompt, "Modell")
    paren = PAREN.search(line)
    if _norm(line).split()[:1] == [wanted] and paren:
        given = _norm(paren.group(1))
        if any(given.startswith(_norm(use)) for use in uses):
            return None
    return (
        f"Start über der Modelltabelle: {persona} hat `{base}`, der Aufruf will `{wanted}`. "
        f"Nur mit Kopfzeile `Modell: {wanted} (<Einsatz>)`, Einsatz aus: {', '.join(uses)}; "
        "sonst `model` weglassen" + SUFFIX
    )


def unknown_alias(tool_input: Mapping, table) -> str | None:
    alias = str(tool_input.get("model") or "")
    if alias and table and alias not in {a for a, _ in table}:
        return f"Modell `{alias}` nicht in der Modelltabelle" + SUFFIX
    return None


def main() -> int:
    try:
        from paths import agents_dir, append_event, docs_dir, now_iso
        from studio_docs import persona_meta, read_text

        payload = json.loads(sys.stdin.read() or "null")
        if (
            not isinstance(payload, dict)
            or payload.get("hook_event_name") != "PreToolUse"
        ):
            return 0
        data = payload.get("tool_input")
        if payload.get("tool_name") not in AGENT_TOOLS or not isinstance(data, dict):
            return 0
        table = model_table(read_text(docs_dir() / "STUDIO.md"))
        found = reason(data, persona_meta(agents_dir()), table)
        note = unknown_alias(data, table)  # unbekannter Alias: nur Event, nie deny
        if not found and not note:
            return 0
        with contextlib.suppress(Exception):
            append_event(
                {
                    "ts": now_iso(),
                    "session_id": str(payload.get("session_id") or ""),
                    "agent_id": str(payload.get("agent_id") or "main"),
                    "source": "hook",
                    "kind": "model_guard",
                    "mode": MODE,
                    "persona": _persona(data),
                    "model": str(data.get("model") or ""),
                    "summary": (found or note or "")[:160],
                }
            )
        if found and MODE == "deny":
            out = {
                "hookEventName": "PreToolUse",
                "permissionDecision": "deny",
                "permissionDecisionReason": found,
            }
            print(json.dumps({"hookSpecificOutput": out}, ensure_ascii=False))
    except Exception:  # noqa: BLE001 - Hooks werfen nie
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
