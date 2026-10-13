"""Warnung, wenn state.md dem Ruling-Stand in rulings.md hinterherhinkt (E-065).

Reine Funktion plus kleiner CLI-Einstieg; wirft nie, Exit immer 0.
"""

from __future__ import annotations

import contextlib
import re
import sys
from pathlib import Path

THRESHOLD = 5
R_RE = re.compile(r"\bR(\d+)")


def _highest(text: str) -> int | None:
    numbers = [int(n) for n in R_RE.findall(text)]
    return max(numbers) if numbers else None


def stale_warning(docs: Path, threshold: int = THRESHOLD) -> str:
    """Warntext oder '' (Dateien fehlen, kein R im Stand, Differenz <= Schwelle)."""
    try:
        state = (docs / "state.md").read_text(encoding="utf-8")
        rulings = (docs / "rulings.md").read_text(encoding="utf-8")
    except OSError:
        return ""
    stand = next((ln for ln in state.splitlines() if ln.startswith("Stand:")), "")
    seen, latest = _highest(stand), _highest(rulings)
    if seen is None or latest is None or latest - seen <= threshold:
        return ""
    return (
        f"Warnung: state.md nennt im Stand nur bis R{seen}, rulings.md hat R{latest} "
        f"(Differenz {latest - seen} > {threshold}); state.md nachziehen."
    )


def main(argv: list[str]) -> int:
    default = Path(__file__).resolve().parents[2] / "docs" / "studio"
    with contextlib.suppress(Exception):
        text = stale_warning(Path(argv[1]) if len(argv) > 1 else default)
        if text:
            print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
