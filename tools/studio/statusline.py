"""Statuszeilen-Wrapper: schreibt die Limit-Werte und reicht an das Nutzer-Skript durch.

Hooks erhalten ``rate_limits`` nicht, die Statuszeile schon (Ruling R68). Der Wrapper
lässt die Ausgabe des Nutzer-Skripts unverändert und hängt nur ein Suffix an die
erste Zeile. Fehler enden still; Exit immer 0.
"""

from __future__ import annotations

import contextlib
import json
import os
import shlex
import subprocess
import sys

import limits
from paths import studio_home

DEFAULT_CMD = "bash ~/.claude/hooks/statusline.sh"
TIMEOUT_S = 5


def record(raw: bytes) -> dict | None:
    """Schreibt limits.json, falls Werte vorhanden sind; liefert die Daten oder None."""
    try:
        data = limits.parse(json.loads(raw.decode("utf-8")))
        if not limits.has_values(data):
            return None
    except Exception:  # noqa: BLE001 — der Wrapper darf die Statuszeile nie kippen
        return None
    with contextlib.suppress(Exception):  # Anzeige klappt auch ohne Datei
        limits.write_atomic(studio_home() / "limits.json", data)
    return data


def user_command(env: dict) -> list[str]:
    text = env.get("STUDIO_STATUSLINE_CMD") or DEFAULT_CMD
    try:
        words = shlex.split(text)
    except ValueError:
        return []
    return [os.path.expanduser(word) for word in words]


def user_output(raw: bytes, env: dict) -> str:
    """Stdout des Nutzer-Skripts; bei Fehler oder Zeitüberschreitung, was da ist."""
    try:
        proc = subprocess.run(
            user_command(env),
            input=raw,
            capture_output=True,
            timeout=TIMEOUT_S,
            check=False,
        )
        return proc.stdout.decode("utf-8", errors="replace")
    except subprocess.TimeoutExpired as error:
        return (error.stdout or b"").decode("utf-8", errors="replace")
    except Exception:  # noqa: BLE001
        return ""


def compose(output: str, data: dict | None) -> str:
    tail = limits.suffix(data) if data else ""
    if not tail:
        return output
    if not output.strip():
        return tail + "\n"
    first, sep, rest = output.partition("\n")
    return f"{first} | {tail}{sep}{rest}"


def main() -> int:
    with contextlib.suppress(Exception):
        raw = sys.stdin.buffer.read()
        data = record(raw)
        text = compose(user_output(raw, dict(os.environ)), data)
        sys.stdout.write(text)
        sys.stdout.flush()
    return 0


if __name__ == "__main__":
    sys.exit(main())
