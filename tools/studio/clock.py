"""Eine Uhr für tools/studio (R450 V2): alle Zeitabfragen laufen über ``clock.now()``.

Lokale Zeit bleibt Sache des Aufrufers: ``clock.now().astimezone()``.
Prüfung: ``python3 tools/studio/clock.py --check <ordner>`` (nur Warnung, Exit 0).
"""

from __future__ import annotations

import argparse
import contextlib
import re
import sys
from collections.abc import Callable, Iterator
from datetime import UTC, datetime
from pathlib import Path

_overrides: list[Callable[[], datetime]] = []
# time.monotonic ist zulässig (Dauern, keine Uhrzeit) und wird von --check nicht gemeldet.
DIRECT_CALL = re.compile(r"datetime\.now\(|time\.time\(")


def now() -> datetime:
    return _overrides[-1]() if _overrides else datetime.now(UTC)


def timestamp() -> float:
    return now().timestamp()


@contextlib.contextmanager
def frozen(at: datetime | Callable[[], datetime]) -> Iterator[None]:
    """Nur für Tests (R378): feste oder springende Uhr, verschachtelbar."""
    _overrides.append(at if callable(at) else lambda: at)
    try:
        yield
    finally:
        _overrides.pop()


def scan(folder: Path) -> list[tuple[str, int, str]]:
    """Direkte Uhraufrufe in ``folder/*.py`` (ohne Unterordner und ohne clock.py)."""
    found = []
    for path in sorted(Path(folder).glob("*.py")):
        if path.name == "clock.py":
            continue
        for number, line in enumerate(path.read_text("utf-8").splitlines(), 1):
            code = line.strip()
            if not code.startswith("#") and DIRECT_CALL.search(code):
                found.append((path.name, number, code))
    return found


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="clock.py", description=__doc__)
    parser.add_argument("--check", type=Path, required=True, metavar="ORDNER")
    found = scan(parser.parse_args(argv).check)
    for name, number, code in found:
        print(f"Warnung: direkter Uhraufruf {name}:{number}: {code}")
    print(f"clock: {len(found)} direkte Uhraufrufe (nur Warnung, R450 V2)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
