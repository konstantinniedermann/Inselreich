"""Git-Merge-Treiber für docs/beobachtungen.md: reine Anhänge selbst auflösen (E-059).

Aufruf durch Git: `python3 tools/studio/merge_append.py %O %A %B %L %P`.
`git merge-file --diff3` liefert Konfliktblöcke; Blöcke mit leerem Basis-Teil
(beide Seiten haben nur hinzugefügt) werden zu ours + theirs. Blöcke mit
Basis-Inhalt bleiben als Konflikt stehen, nichts Gestrichenes kehrt zurück.
Eigene Fehler lassen `%A` unverändert und enden mit Exit 1 (Git meldet Konflikt).
"""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

LABELS = ("ours", "base", "theirs")


def resolve(text: str, marker_size: int) -> tuple[str, int]:
    """Löst Blöcke mit leerer Basis auf; Rückgabe (Text, Anzahl offener Blöcke)."""
    start = "<" * marker_size + " " + LABELS[0]
    mid = "|" * marker_size + " " + LABELS[1]
    sep = "=" * marker_size
    end = ">" * marker_size + " " + LABELS[2]
    out: list[str] = []
    open_blocks = 0
    block: list[str] | None = None  # Rohzeilen seit dem Startmarker
    for line in text.splitlines(keepends=True):
        bare = line.rstrip("\r\n")
        if block is None:
            if bare == start:
                block = [line]
            else:
                out.append(line)
            continue
        block.append(line)
        if bare != end:
            continue
        raw = block
        block = None
        parts = _split(raw, mid, sep)
        merged = _merge_appends(*parts) if parts is not None else None
        if merged is not None:
            out.extend(merged)
        else:
            out.extend(raw)
            open_blocks += 1
    if block is not None:  # unvollständiger Block: unverändert lassen
        out.extend(block)
        open_blocks += 1
    return "".join(out), open_blocks


def _merge_appends(ours: list[str], base: list[str], theirs: list[str]):
    """Beide Seiten haben nur angehängt: ours-Rest + theirs-Rest, sonst None.

    Die Basis darf nicht leer sein (letzte Basiszeile im Block, REL-30): beide Seiten
    müssen sie unverändert behalten; die Basis erscheint genau einmal.
    """
    n = len(base)
    if n and not (_starts_with(ours, base) and _starts_with(theirs, base)):
        return None
    head = base if n else []
    tail_o, tail_t = ours[n:], theirs[n:]
    if head and not head[-1].endswith("\n") and (tail_o or tail_t):
        head = head[:-1] + [head[-1] + "\n"]
    if tail_o and not tail_o[-1].endswith("\n"):
        tail_o = tail_o[:-1] + [tail_o[-1] + "\n"]
    return head + tail_o + tail_t


def _starts_with(side: list[str], base: list[str]) -> bool:
    """side beginnt mit den Zeilen von base (Zeilenende der letzten Zeile egal)."""
    if len(side) < len(base):
        return False
    pairs = list(zip(side, base))
    return all(a == b for a, b in pairs[:-1]) and (
        pairs[-1][0].rstrip("\r\n") == pairs[-1][1].rstrip("\r\n")
    )


def _split(raw: list[str], mid: str, sep: str):
    """(ours, base, theirs) eines Blocks aus Rohzeilen oder None bei fremdem Aufbau."""
    inner = raw[1:-1]
    bares = [x.rstrip("\r\n") for x in inner]
    if mid not in bares:
        return None
    i = bares.index(mid)
    if sep not in bares[i + 1 :]:
        return None
    j = bares.index(sep, i + 1)
    return inner[:i], inner[i + 1 : j], inner[j + 1 :]


def main(argv: list[str]) -> int:
    """argv = [%O, %A, %B, %L, %P]; schreibt das Ergebnis nach %A, wirft nie."""
    try:
        base, ours, theirs, size = argv[0], argv[1], argv[2], int(argv[3])
        proc = subprocess.run(
            [
                "git",
                "merge-file",
                "-p",
                "--diff3",
                "-L",
                LABELS[0],
                "-L",
                LABELS[1],
                "-L",
                LABELS[2],
                f"--marker-size={size}",
                ours,
                base,
                theirs,
            ],
            check=False,
            capture_output=True,
            timeout=60,
        )
        if proc.returncode < 0 or proc.returncode > 127:
            return 1
        text = proc.stdout.decode("utf-8", errors="surrogateescape")
        merged, left = resolve(text, size)
        Path(ours).write_bytes(merged.encode("utf-8", errors="surrogateescape"))
        return 0 if left == 0 else 1
    except (
        OSError,
        subprocess.SubprocessError,
        ValueError,
        IndexError,
    ):  # Treiber darf nie werfen; %A bleibt unverändert
        return 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
