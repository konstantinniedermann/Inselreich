"""Studio-Dokumente unter docs/studio lesen und schreiben (Formate: STUDIO.md)."""

from __future__ import annotations

import json
import re
from pathlib import Path

QUEUE_STATUSES = ("offen", "beantwortet", "umgesetzt")
EXPERIMENT_STATUSES = (
    "vorgeschlagen",
    "laufend",
    "behalten",
    "angepasst",
    "zurückgenommen",
    "abgelehnt",
)
VERSION_RE = re.compile(r"^Version:\s*(\d+\.\d+)")
QUEUE_RE = re.compile(r"^## (N-\d+) · (\S+) · (\d{4}-\d{2}-\d{2}) · (.+?)\s*$")
EXPERIMENT_RE = re.compile(r"^## (E-\d+) · (\S+) · (.+?)\s*$")
CHANGELOG_RE = re.compile(
    r"^## (\d{4}-\d{2}-\d{2}) · (Handbuch|Persona [a-z0-9-]+) (\d+\.\d+)\s*$"
)
FIELD_RE = re.compile(r"^- ([^:]+):\s?(.*)$")
QUEUE_FIELDS = (
    "Frage",
    "Empfehlung",
    "Begründung",
    "Kosten des Wartens",
    "Blockiert",
    "Von",
    "Antwort",
)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return ""


def read_version(path: Path) -> str:
    for line in read_text(path).splitlines()[:15]:
        match = VERSION_RE.match(line.strip())
        if match:
            return match.group(1)
    return ""


def _frontmatter(text: str) -> dict[str, str]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    meta: dict[str, str] = {}
    for line in lines[1:]:
        if line.strip() == "---":
            return meta
        key, sep, value = line.partition(":")
        if sep:
            meta[key.strip()] = value.strip().strip("'\"")
    return {}


def persona_meta(agents: Path) -> dict[str, dict]:
    result: dict[str, dict] = {}
    if not agents.is_dir():
        return result
    for path in sorted(agents.glob("*.md")):
        meta = _frontmatter(read_text(path))
        if not meta.get("name"):
            continue
        result[meta["name"]] = {
            "version": meta.get("version", ""),
            "model": meta.get("model") or "inherit",
            "description": meta.get("description", ""),
            "tools": meta.get("tools", ""),
            "studio_name": meta.get("studio-name", ""),
            "studio_title": meta.get("studio-title", ""),
            "studio_emoji": meta.get("studio-emoji", ""),
        }
    return result


def _sections(text: str, pattern: re.Pattern) -> list[tuple[re.Match, list[str]]]:
    sections: list[tuple[re.Match | None, list[str]]] = []
    for line in text.splitlines():
        match = pattern.match(line)
        if match:
            sections.append((match, []))
        elif line.startswith("## "):
            sections.append((None, []))  # fremde Überschrift beendet den Abschnitt
        elif sections:
            sections[-1][1].append(line)
    return [(m, body) for m, body in sections if m is not None]


def _fields(body: list[str]) -> dict[str, str]:
    fields: dict[str, str] = {}
    for line in body:
        match = FIELD_RE.match(line.strip())
        if match:
            fields[match.group(1).strip()] = match.group(2).strip()
    return fields


def changelog(docs: Path) -> list[dict]:
    text = read_text(docs / "CHANGELOG.md")
    return [
        {
            "date": m.group(1),
            "subject": m.group(2),
            "version": m.group(3),
            "lines": [line for line in body if line.strip()],
        }
        for m, body in _sections(text, CHANGELOG_RE)
    ]


def experiments(docs: Path) -> list[dict]:
    text = read_text(docs / "experimente.md")
    return [
        {
            "id": m.group(1),
            "status": m.group(2),
            "title": m.group(3),
            "fields": _fields(b),
        }
        for m, b in _sections(text, EXPERIMENT_RE)
    ]


def queue_entries(docs: Path) -> list[dict]:
    text = read_text(docs / "warteschlange.md")
    return [
        {
            "id": m.group(1),
            "status": m.group(2),
            "date": m.group(3),
            "title": m.group(4),
            "fields": _fields(b),
        }
        for m, b in _sections(text, QUEUE_RE)
    ]


def _one_line(text: str) -> str:
    return " ".join(str(text or "").split()) or "–"


def queue_add(
    docs: Path,
    entry_id: str,
    title: str,
    question: str,
    recommendation: str,
    reason: str,
    cost: str,
    blocks: str,
    source: str,
    date: str,
) -> None:
    if any(e["id"] == entry_id for e in queue_entries(docs)):
        raise ValueError(f"{entry_id} existiert bereits")
    path = docs / "warteschlange.md"
    values = (question, recommendation, reason, cost, blocks or "nichts", source, "–")
    # Leerzeile nach der Überschrift: Prettier-kompatibel (make check prüft die Datei).
    lines = [f"## {entry_id} · offen · {date} · {_one_line(title)}", ""]
    lines += [f"- {k}: {_one_line(v)}" for k, v in zip(QUEUE_FIELDS, values)]
    text = read_text(path).rstrip("\n")
    path.write_text(text + "\n\n" + "\n".join(lines) + "\n", encoding="utf-8")


def queue_update(
    docs: Path,
    entry_id: str,
    *,
    answer: str | None = None,
    status: str | None = None,
) -> bool:
    path = docs / "warteschlange.md"
    lines = read_text(path).splitlines()
    found, inside = False, False
    new_status = status or ("beantwortet" if answer is not None else None)
    for index, line in enumerate(lines):
        match = QUEUE_RE.match(line)
        if match or line.startswith("## "):
            inside = bool(match and match.group(1) == entry_id)
            if inside:
                found = True
                if new_status:
                    lines[index] = (
                        f"## {entry_id} · {new_status} · {match.group(3)} · "
                        f"{match.group(4)}"
                    )
            continue
        if inside and answer is not None and line.strip().startswith("- Antwort:"):
            lines[index] = f"- Antwort: {_one_line(answer)}"
    if found:
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return found


def content_lines(text: str) -> int:
    count, in_comment = 0, False
    for raw in text.splitlines():
        line = raw.strip()
        if in_comment:
            in_comment = "-->" not in line
            continue
        if line.startswith("<!--"):
            in_comment = "-->" not in line
            continue
        if line and not line.startswith("#"):
            count += 1
    return count


def lernen_text(text: str) -> str:
    """lernen.md fürs Dashboard: ohne HTML-Kommentare und ohne H1-Titel."""
    text = re.sub(r"<!--.*?-->", "", text, flags=re.DOTALL)
    lines = [line for line in text.splitlines() if not line.startswith("# ")]
    return "\n".join(line for line in lines if line.strip())


def metrics_history(docs: Path) -> list[dict]:
    items: list[dict] = []
    folder = docs / "metriken"
    if not folder.is_dir():
        return items
    for path in sorted(folder.glob("*.md")):
        text = read_text(path)
        _, _, tail = text.partition("## Rohwerte")
        match = re.search(r"```json\n(.*?)\n```", tail, re.DOTALL)
        if not match:
            continue
        try:
            data = json.loads(match.group(1))
        except ValueError:
            continue
        if isinstance(data, dict):
            data["file"] = path.name
            items.append(data)
    return sorted(items, key=lambda d: str(d.get("created", "")))


def bundle(docs: Path, agents: Path) -> dict:
    def safe(func, default):
        try:
            return func()
        except Exception:  # noqa: BLE001 — eine kaputte Datei kippt nicht alles
            return default

    personas = safe(lambda: persona_meta(agents), {})
    return {
        "handbook_version": safe(lambda: read_version(docs / "STUDIO.md"), ""),
        "constitution_version": safe(lambda: read_version(docs / "VERFASSUNG.md"), ""),
        "changelog": safe(lambda: changelog(docs), []),
        "experiments": safe(lambda: experiments(docs), []),
        "queue": safe(lambda: queue_entries(docs), []),
        "lernen": safe(lambda: lernen_text(read_text(docs / "lernen.md")), ""),
        "personas": [{"name": k, **v} for k, v in personas.items()],
        "history": safe(lambda: metrics_history(docs), []),
    }
