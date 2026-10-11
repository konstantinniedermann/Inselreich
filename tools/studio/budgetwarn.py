"""Budget-Prüfung beim Lead-Start (E-055, R443; Block E-060): Start mit `Budget: <n>` ohne passende Freigabe.

Rein bis auf das Lesen der Event-Datei. `check` liefert den Blocktext (E-060),
`warning` den Hinweis des Rückfallmodus (E-055). Fehler lassen zu.
"""

from __future__ import annotations

import json
import re
from collections.abc import Iterable, Mapping

from model import _package_token, package_names, phase_matches
from modelguard import SKIP_TYPES, header, persona

NUMBER = re.compile(r"\d+")
FOLLOW_UP = re.compile(r"\d+\s+verbleibend", re.IGNORECASE)


def budget_count(prompt: str) -> int | None:
    """Erste ganze Zahl der Kopfzeile `Budget:`; None bei «keins» oder 0."""
    found = NUMBER.search(header(prompt, "Budget"))
    return int(found.group()) or None if found else None


def follow_up(prompt: str) -> bool:
    """Folge-Controller (R543): Kopfzeile `Budget: <n> verbleibende …` braucht keine Freigabe."""
    return bool(FOLLOW_UP.match(header(prompt, "Budget")))


def grants(text: str, session_id: str) -> list[dict]:
    """Budget-Freigaben der Session in Dateireihenfolge."""
    found = []
    for line in text.splitlines():
        if '"budget"' not in line:  # Vorfilter: die Datei hat Zehntausende Zeilen
            continue
        try:
            event = json.loads(line)
        except ValueError:
            continue
        if (
            isinstance(event, dict)
            and event.get("kind") == "budget"
            and event.get("session_id") == session_id
        ):
            found.append(event)
    return found


def _phase(event: Mapping) -> str:
    budget = event.get("budget")
    return str(budget.get("phase") or "").strip() if isinstance(budget, dict) else ""


def _matches(package: str, phases: Iterable[str]) -> bool:
    """Passt eine Freigabe-Phase zu den Namen der Kopfzeile `Paket:` (inkl. Praefix-Regel)?"""
    names = package_names(package)
    return any(phase_matches(p, n) for p in phases for n in names)


def _lead_start(tool_input: Mapping) -> tuple[str, int, str] | None:
    """(Rolle, Budget, Prompt) eines Lead-Starts mit `Budget: n`; sonst None."""
    role = persona(tool_input)
    if str(tool_input.get("subagent_type")) in SKIP_TYPES or not role.startswith(
        "lead-"
    ):
        return None
    prompt = str(tool_input.get("prompt") or "")
    count = budget_count(prompt)
    if count is None or follow_up(prompt):
        return None
    return (role, count, prompt)


def check(tool_input: Mapping, given: Iterable[Mapping]) -> str | None:
    """Blocktext (E-060) bei Lead-Start ohne passende Freigabe der Rolle, sonst None."""
    start = _lead_start(tool_input)
    if start is None:
        return None
    role, count, prompt = start
    own = [g for g in given if g.get("role") == role]
    package = header(prompt, "Paket")
    phases = [_phase(g) for g in own]
    token = _package_token(package) or "<Paket>"
    if own and (not package or _matches(package, phases)):
        return None
    command = f"python3 tools/studio/log.py budget --lead {role} --grant {count} --phase {token} …"
    prefix = "Budget-Block (E-060): "
    if not own:
        return (
            f"{prefix}{role} startet mit „Budget: {count}“, in dieser Session gibt es "
            f"keine Freigabe. Vor dem Start: {command}"
        )
    return (
        f"{prefix}Freigabe für Phase {package} fehlt (vorhanden: {', '.join(phases)}). "
        f"Vor dem Start: {command}"
    )


def warning(tool_input: Mapping, given: Iterable[Mapping]) -> str | None:
    """Hinweistext des Rückfallmodus (BUDGET_MODE = "warn", E-055)."""
    start = _lead_start(tool_input)
    if start is None:
        return None
    role, count, prompt = start
    own = [g for g in given if g.get("role") == role]
    prefix = "Budget-Warnung (E-055): "
    if not own:
        return (
            f"{prefix}{role} startet mit „Budget: {count}“, in dieser Session gibt es "
            f"keine Freigabe. Vor dem Start: python3 tools/studio/log.py budget "
            f"--lead {role} --grant {count} --phase <Paket> …"
        )
    package = header(prompt, "Paket")
    phases = [_phase(g) for g in own]
    if not package or _matches(package, phases):
        return None
    return (
        f"{prefix}Freigabe für Phase {package} fehlt (vorhanden: {', '.join(phases)}); "
        "das Dashboard zählt den Start sonst auf die jüngste Freigabe (E-013)."
    )
