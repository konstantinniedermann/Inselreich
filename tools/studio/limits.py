"""Nutzungslimit-Sensor: Werte aus der Claude-Code-Statuszeile (Ruling R68).

Reine Funktionen, nur Stdlib. Hooks erhalten diese Werte nicht; die Statuszeile
schreibt sie nach ``.studio/limits.json``, Hook und Dashboard lesen sie dort.
"""

from __future__ import annotations

import json
import math
import os
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path

YELLOW_FROM = 60
RED_FROM = 80
WEEK_HIGH_ABOVE = 80
CONTEXT_HANDOVER_FROM = 50
HOOK_MAX_AGE = 600
VALUE_KEYS = (
    "five_hour_pct",
    "seven_day_pct",
    "context_pct",
)


def _number(value: object) -> float | int | None:
    """Endliche Zahl; bool, None, Text und NaN/Inf werden abgewiesen."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return None
    return value if math.isfinite(value) else None


def _percent(value: object) -> float | int | None:
    number = _number(value)
    return None if number is None else max(0, min(100, number))


def _section(source: object, key: str) -> dict:
    found = source.get(key) if isinstance(source, dict) else None
    return found if isinstance(found, dict) else {}


def _reset(value: object) -> float | int | None:
    number = _number(value)
    return number if number is not None and number > 0 else None


def parse(payload: object, now: float | None = None) -> dict:
    """Extrahiert die Limit-Werte; Fehlendes oder Ungültiges wird ``None``."""
    root = payload if isinstance(payload, dict) else {}
    rate = _section(root, "rate_limits")
    five = _section(rate, "five_hour")
    seven = _section(rate, "seven_day")
    context = _section(root, "context_window")
    session = root.get("session_id")
    return {
        "ts": time.time() if now is None else now,
        "session_id": session if isinstance(session, str) else "",
        "five_hour_pct": _percent(five.get("used_percentage")),
        "five_hour_resets_at": _reset(five.get("resets_at")),
        "seven_day_pct": _percent(seven.get("used_percentage")),
        "seven_day_resets_at": _reset(seven.get("resets_at")),
        "context_pct": _percent(context.get("used_percentage")),
    }


def has_values(data: dict) -> bool:
    return any(data.get(key) is not None for key in VALUE_KEYS)


def write_atomic(path: Path | str, data: dict) -> None:
    """Schreibt JSON über eine Temp-Datei im selben Ordner und ``os.replace``."""
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    handle, tmp_name = tempfile.mkstemp(dir=target.parent, prefix=".limits-")
    try:
        with os.fdopen(handle, "w", encoding="utf-8") as tmp:
            json.dump(data, tmp, ensure_ascii=False)
        os.replace(tmp_name, target)
    except BaseException:
        try:
            os.unlink(tmp_name)
        except OSError:
            pass
        raise


def read_fresh(
    path: Path | str, now: float, max_age: float = HOOK_MAX_AGE
) -> dict | None:
    """Liest die Datei; ``None`` bei Fehlern oder wenn ``ts`` älter als ``max_age`` ist."""
    try:
        data = json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    if not isinstance(data, dict):
        return None
    ts = _number(data.get("ts"))
    if ts is None or now - ts > max_age:
        return None
    return data


def light(five_hour_pct: float | None) -> str | None:
    if five_hour_pct is None:
        return None
    if five_hour_pct >= RED_FROM:
        return "rot"
    if five_hour_pct >= YELLOW_FROM:
        return "gelb"
    return "grün"


def _pct_text(value: float) -> str:
    return f"{int(value)} %"


def reset_time(epoch: float | None) -> str:
    """Lokale Uhrzeit HH:MM oder leer."""
    if epoch is None:
        return ""
    try:
        return (
            datetime.fromtimestamp(epoch, tz=timezone.utc)
            .astimezone()
            .strftime("%H:%M")
        )
    except (OverflowError, OSError, ValueError):
        return ""


def suffix(data: dict) -> str:
    pct = data.get("five_hour_pct")
    return "" if pct is None else f"5h {_pct_text(pct)}"


def _parts(data: dict) -> list[str]:
    parts = []
    five = data.get("five_hour_pct")
    if five is not None:
        text = f"5h {_pct_text(five)}"
        reset = reset_time(data.get("five_hour_resets_at"))
        parts.append(f"{text} (Reset {reset})" if reset else text)
    if data.get("seven_day_pct") is not None:
        parts.append(f"Woche {_pct_text(data['seven_day_pct'])}")
    if data.get("context_pct") is not None:
        parts.append(f"Kontext L0 {_pct_text(data['context_pct'])}")
    return parts


def _hints(data: dict, lamp: str | None) -> list[str]:
    hints = []
    if lamp == "rot":
        hints.append("keine neuen Starts, Session-Ende-Routine")
    elif lamp == "gelb":
        hints.append("keine neuen Wellen")
    week = data.get("seven_day_pct")
    if week is not None and week > WEEK_HIGH_ABOVE:
        hints.append("Wochenfenster hoch: Parallelität halbieren")
    context = data.get("context_pct")
    if context is not None and context >= CONTEXT_HANDOVER_FROM:
        hints.append("Kontext >= 50 %: Übergabe über state.md")
    return hints


def summary(data: dict, now: float) -> str:
    """Eine Zeile für L0; leer, wenn kein Wert vorhanden ist."""
    parts = _parts(data)
    if not parts:
        return ""
    lamp = light(data.get("five_hour_pct"))
    text = "Limit: " + ", ".join(parts)
    if lamp:
        text += f" → Ampel {lamp}"
    hints = _hints(data, lamp)
    return text + (". " + "; ".join(hints) if hints else "")
