"""Start-Kontext für die Hauptsession (SessionStart-Hook): kompakt, hart begrenzt."""

from __future__ import annotations

from pathlib import Path

from studio_docs import experiments as read_experiments
from studio_docs import queue_entries, read_text, read_version

LIMIT = 9500
STATE_MAX = 3500
LERNEN_MAX = 2500
LIST_MAX = 8
LINE_MAX = 300
QUEUE_SHOWN = ("offen", "beantwortet")
EXPERIMENT_SHOWN = ("laufend", "vorgeschlagen")
START_ROUTINE = (
    "Start-Routine: Stand und Warteschlange unten lesen, Dashboard-URL nennen, "
    "offene Vorfälle sichten. Neue Anweisung = Auftrag; sonst den Plan aus state.md "
    "selbstständig fortsetzen (nie untätig warten)."
)


def shorten(text: str, limit: int, name: str) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    note = f"… (gekürzt, siehe docs/studio/{name})"
    return text[: max(limit - len(note), 0)].rstrip() + note


def _line(text: str) -> str:
    text = " ".join(str(text).split())
    return text if len(text) <= LINE_MAX else text[: LINE_MAX - 1] + "…"


def _queue_lines(docs: Path) -> list[str]:
    lines = []
    for entry in queue_entries(docs):
        if entry["status"] not in QUEUE_SHOWN:
            continue
        fields = entry["fields"]
        answer = fields.get("Antwort") or "–"
        # Eine eingetragene Antwort zählt, auch wenn der Status noch «offen» ist
        if answer != "–":
            detail = f"beantwortet · {entry['title']} — Antwort: {answer}"
        else:
            detail = (
                f"{entry['status']} · {entry['title']}"
                f" — Empfehlung: {fields.get('Empfehlung') or '–'}"
            )
        blocks = fields.get("Blockiert") or "–"
        lines.append(_line(f"- {entry['id']} · {detail} · Blockiert: {blocks}"))
    return lines[:LIST_MAX]


def _experiment_lines(docs: Path) -> list[str]:
    return [
        _line(f"- {e['id']} · {e['status']} · {e['title']}")
        for e in read_experiments(docs)
        if e["status"] in EXPERIMENT_SHOWN
    ][:LIST_MAX]


def _section(title: str, lines: list[str]) -> str:
    return f"## {title}\n" + ("\n".join(lines) if lines else "- keine")


def build_context(docs: Path, incidents: list[dict], port: str) -> str:
    constitution = read_version(docs / "VERFASSUNG.md") or "?"
    handbook = read_version(docs / "STUDIO.md") or "?"
    role = (
        f"Du bist der Projektleiter (L0) des Studios. Verfassung v{constitution}, "
        f"Handbuch v{handbook}. Du fragst nicht zurück; Vorbehalte gehören in die "
        "Warteschlange."
    )
    fixed = [
        role,
        f"Dashboard: http://127.0.0.1:{port}/",
        START_ROUTINE,
    ]
    lists = [
        _section("Warteschlange", _queue_lines(docs)),
        _section("Laufende Experimente", _experiment_lines(docs)),
        _section(
            "Fällige Retros",
            [_line(f"- {item.get('text', '')}") for item in incidents[:LIST_MAX]],
        ),
    ]
    used = len("\n\n".join(fixed + lists))
    # Rest nach den Listen (samt Überschriften und Trennern) teilen sich state/lernen
    rest = max(LIMIT - used - 60, 0)
    lernen_max = min(LERNEN_MAX, rest // 3)
    state_max = min(STATE_MAX, rest - lernen_max)
    parts = [
        *fixed,
        "## state.md\n" + shorten(read_text(docs / "state.md"), state_max, "state.md"),
        "## lernen.md\n"
        + shorten(read_text(docs / "lernen.md"), lernen_max, "lernen.md"),
        *lists,
    ]
    text = "\n\n".join(parts)
    if len(text) > LIMIT:  # Sicherheitsnetz
        text = text[: LIMIT - 1].rstrip() + "…"
    return text
