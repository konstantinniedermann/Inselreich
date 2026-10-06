"""Start-Kontext für die Hauptsession (SessionStart-Hook): kompakt, hart begrenzt."""

from __future__ import annotations

import re
from pathlib import Path

from studio_docs import experiments as read_experiments
from studio_docs import queue_entries, read_text, read_version

LIMIT = 9500
STATE_MAX = 3500
LERNEN_MAX = 2500
LIST_MAX = 8
LINE_MAX = 300
OBS_LIMIT = 30  # R288: mehr ungesichtete Einträge → Auswertung ist das erste Paket
OBS_MARK_RE = re.compile(
    r"^[\s>*_-]*Letzte Auswertung:?\**\s*(\d{4}-\d{2}-\d{2})", re.IGNORECASE
)
OBS_HEAD_RE = re.compile(r"^(#{2,3})\s+(\S.*)$")
QUEUE_SHOWN = ("offen", "beantwortet")
EXPERIMENT_SHOWN = ("laufend", "vorgeschlagen")
START_ROUTINE = (
    "Start-Routine: Deine erste Textausgabe ist die Dashboard-URL und der "
    "Start-Bericht in höchstens 10 Zeilen (Stand, seit letzter Session erledigt, "
    "laufend, offene Nutzerentscheide) — auch wenn der erste Prompt bereits einen "
    "Auftrag enthält. Bevor du ein Werkzeug für den Auftrag benutzt oder "
    "delegierst: zuerst den Start-Bericht als Text ausgeben; Lesen des Kontexts ist "
    "erlaubt. Stand, Warteschlange und offene Vorfälle stehen unten. Danach: Neue "
    "Anweisung = Auftrag; sonst den Plan aus state.md selbstständig fortsetzen "
    "(nie untätig warten)."
)


def shorten(text: str, limit: int, name: str) -> str:
    text = text.strip()
    if len(text) <= limit:
        return text
    note = f"… (gekürzt, siehe docs/studio/{name})"
    return text[: max(limit - len(note), 0)].rstrip() + note


def observation_status(path: Path) -> tuple[int, str | None]:
    """(Anzahl Einträge unter der Marke „Letzte Auswertung: JJJJ-MM-TT“, Datum).

    Eintrag = Überschrift der Ebene 2/3 ausser den Abschnittsköpfen „Offen …“ und
    „Ausgewertet …“. Alles unter „Ausgewertet …“ zählt nicht, bis zur nächsten
    Überschrift derselben oder einer höheren Ebene. Ohne Marke zählen alle Einträge,
    das Datum ist ``None``.
    """
    lines = read_text(path).splitlines()
    mark_at, date = -1, None
    for index, line in enumerate(lines):
        found = OBS_MARK_RE.match(line)
        if found:
            mark_at, date = index, found.group(1)  # letzte Marke gilt
    count, skip_level = 0, 0  # skip_level > 0: innerhalb „Ausgewertet …“
    for line in lines[mark_at + 1 :]:
        head = OBS_HEAD_RE.match(line)
        if not head:
            continue
        level, title = len(head.group(1)), head.group(2)
        if re.match(r"Ausgewertet\b", title):
            skip_level = level
        elif re.match(r"Offen\b", title):
            skip_level = 0
        elif not skip_level or level <= skip_level:
            skip_level = 0
            count += 1
    return count, date


def observations_line(path: Path) -> str:
    if not path.is_file():
        return "Beobachtungen: docs/beobachtungen.md fehlt."
    count, date = observation_status(path)
    if date is None:
        head = f"Beobachtungen: Marke fehlt, alle {count} Einträge zählen"
    else:
        head = f"Beobachtungen: {count} Einträge seit der letzten Auswertung ({date})"
    if count > OBS_LIMIT:
        return (
            f"PFLICHT (R288): {head}, Schwelle {OBS_LIMIT}. Die Auswertung "
            "(lead-production, Skill beobachtungen-auswerten) ist das erste Paket "
            "der Session; bis sie fertig ist, keine neue Funktionsarbeit (Ausnahme: "
            "Hotfix für einen Live-Fehler)."
        )
    return head + "."


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
        observations_line(docs.parent / "beobachtungen.md"),
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
