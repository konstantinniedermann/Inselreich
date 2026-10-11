"""Findet zerrissene Markdown-Tabellen: python3 tools/studio/tablecheck.py [Pfade...].

Ein unmaskiertes ``|`` in einem Code-Span einer Tabellenzelle teilt die Zelle in GFM;
Prettier meldet das nicht. Gemeldet wird je Verstoss ``Datei:Zeile: Grund`` (Exit 1):
(1) Datenzeile mit mehr Zellen als der Kopf, (2) Zelle mit offenem Backtick.
Ohne Pfade: alle ``*.md`` unter ``docs/``, ``.claude/`` und ``README.md``.
"""

from __future__ import annotations

import re
import sys
from itertools import pairwise
from pathlib import Path

DEFAULT_ROOTS = ("docs", ".claude")
DEFAULT_FILES = ("README.md",)
FENCE = re.compile(r"^\s*(`{3,}|~{3,})(.*)$")
BACKTICKS = re.compile(r"(?<!\\)`+")
QUOTE = re.compile(r"^(\s*>)+")
DELIMITER_CELL = re.compile(r"^\s*:?-+:?\s*$")


def _unescaped_pipes(text: str) -> list[int]:
    return [i for i, char in enumerate(text) if char == "|" and text[i - 1 : i] != "\\"]


def split_cells(line: str) -> list[str]:
    """Zellen einer Tabellenzeile; Trenner sind alle unmaskierten ``|``."""
    text = line.strip()
    cuts = _unescaped_pipes(text)
    bounds = [-1, *cuts, len(text)]
    cells = [text[a + 1 : b] for a, b in pairwise(bounds)]
    if text.startswith("|"):
        cells = cells[1:]
    if text.endswith("|") and not text.endswith("\\|"):
        cells = cells[:-1]
    return cells


def _is_delimiter(line: str, columns: int) -> bool:
    if "|" not in line and columns > 1:
        return False
    cells = split_cells(line)
    return len(cells) == columns and all(DELIMITER_CELL.match(c) for c in cells)


def _open_backtick(cell: str) -> bool:
    """Backtick-Folge ohne gleich lange Schlussfolge (CommonMark-Code-Span)."""
    lengths = [len(m.group()) for m in BACKTICKS.finditer(cell)]
    index = 0
    while index < len(lengths):
        try:
            partner = lengths.index(lengths[index], index + 1)
        except ValueError:
            return True
        index = partner + 1
    return False


def _row_problem(cells: list[str], columns: int | None) -> str | None:
    if columns is not None and len(cells) > columns:
        return f"{len(cells)} Zellen statt {columns} (unmaskiertes | in Zelle?)"
    if any(_open_backtick(c) for c in cells):
        return "Zelle mit offenem Backtick"
    return None


def _fence_marker(line: str, open_fence: str) -> str | None:
    """Zaun-Zeile: oeffnend (Marker) oder schliessend (gleiches Zeichen, mind. gleiche Laenge)."""
    match = FENCE.match(line)
    if not match:
        return None
    run, rest = match.groups()
    if open_fence:
        closes = run[0] == open_fence[0] and len(run) >= len(open_fence)
        return run if closes and not rest.strip() else None
    return None if run[0] == "`" and "`" in rest else run


def _content(raw: str) -> str:
    return QUOTE.sub("", raw).strip()


def check_text(name: str, text: str) -> list[str]:
    """Verstösse eines Markdown-Textes als ``Datei:Zeile: Grund``."""
    found: list[str] = []
    lines = text.splitlines()
    fence = ""  # offener Zaun: Zeichen mal Laenge, sonst leer
    columns: int | None = None
    for number, raw in enumerate(lines, start=1):
        marker = _fence_marker(QUOTE.sub("", raw), fence)
        if marker is not None:
            fence, columns = ("" if fence else marker), None
            continue
        in_fence = bool(fence)
        line = _content(raw)
        if in_fence or "|" not in line:
            columns = None
            continue
        if columns is None:
            following = _content(lines[number]) if number < len(lines) else ""
            head = split_cells(line)
            if _is_delimiter(following, len(head)):
                columns = len(head)
                problem = _row_problem(head, None)
            else:
                problem = None
        elif _is_delimiter(line, columns):
            problem = None
        else:
            problem = _row_problem(split_cells(line), columns)
        if problem:
            found.append(f"{name}:{number}: {problem}")
    return found


def _default_paths() -> list[Path]:
    paths = [Path(f) for f in DEFAULT_FILES if Path(f).is_file()]
    for root in DEFAULT_ROOTS:
        paths += sorted(Path(root).rglob("*.md"))
    return paths


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    paths = [Path(a) for a in args] or _default_paths()
    failed = False
    for path in paths:
        try:
            text = path.read_text(encoding="utf-8")
        except (OSError, UnicodeDecodeError) as error:
            print(f"tablecheck: Hinweis: {path} nicht lesbar ({error})")
            continue
        for problem in check_text(str(path), text):
            print(problem)
            failed = True
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
