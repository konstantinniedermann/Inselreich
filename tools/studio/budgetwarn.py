"""Budget-Warnung beim Lead-Start (E-055, R443): Start mit `Budget: <n>` ohne passende Freigabe.

Rein bis auf das Lesen der Event-Datei; warnt nur, blockiert nie. Fehler lassen zu.
"""

from __future__ import annotations

import json
import re
from collections.abc import Iterable, Mapping

from modelguard import SKIP_TYPES, _header, _persona

NUMBER = re.compile(r"\d+")


def budget_count(prompt: str) -> int | None:
    """Erste ganze Zahl der Kopfzeile `Budget:`; None bei «keins» oder 0."""
    found = NUMBER.search(_header(prompt, "Budget"))
    return int(found.group()) or None if found else None


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


def warning(tool_input: Mapping, given: Iterable[Mapping]) -> str | None:
    role = _persona(tool_input)
    if str(tool_input.get("subagent_type")) in SKIP_TYPES or not role.startswith(
        "lead-"
    ):
        return None
    prompt = str(tool_input.get("prompt") or "")
    count = budget_count(prompt)
    if count is None:
        return None
    own = [g for g in given if g.get("role") == role]
    prefix = "Budget-Warnung (E-055): "
    if not own:
        return (
            f"{prefix}{role} startet mit „Budget: {count}“, in dieser Session gibt es "
            f"keine Freigabe. Vor dem Start: python3 tools/studio/log.py budget "
            f"--lead {role} --grant {count} --phase <Paket> …"
        )
    package = _header(prompt, "Paket")
    phases = [_phase(g) for g in own]
    if not package or package.casefold() in {p.casefold() for p in phases}:
        return None
    return (
        f"{prefix}Freigabe für Phase {package} fehlt (vorhanden: {', '.join(phases)}); "
        "das Dashboard zählt den Start sonst auf die jüngste Freigabe (E-013)."
    )
