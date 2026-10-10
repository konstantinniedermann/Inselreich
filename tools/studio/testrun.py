"""Testlauf mit Event: python3 tools/studio/testrun.py --suite <studio|vitest> -- <befehl>.

Reicht Ausgabe und Exit-Code des Befehls unverändert durch und schreibt je Lauf
ein Event ``test_failed`` (mit Testnamen) oder ``test_passed`` (R450 V1).
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import signal
import subprocess
import sys

import paths

MAX_NAMES = 50
MAX_NAME_LEN = 200
UNITTEST_RE = re.compile(r"^(FAIL|ERROR): (\S+) \((.+)\)$")
VITEST_RE = re.compile(
    r"^\s*FAIL\s+(?:\|[^|]+\|\s+)?(tests/\S+\.test\.ts)(?:\s+>\s+(.+?))?\s*$"
)


def _unittest_name(line: str) -> str | None:
    match = UNITTEST_RE.match(line)
    if not match:
        return None
    return ".".join(match.group(3).split(".")[-2:])


def _vitest_name(line: str) -> str | None:
    match = VITEST_RE.match(line)
    if not match:
        return None
    file, rest = match.groups()
    return f"{file} > {rest}" if rest else file


def parse_names(lines: list[str], suite: str) -> list[str]:
    """Namen roter Tests in Fundreihenfolge, ohne Duplikate, begrenzt."""
    find = _vitest_name if suite == "vitest" else _unittest_name
    names: list[str] = []
    for line in lines:
        name = find(line.rstrip("\n"))
        if name is None:
            continue
        name = name[:MAX_NAME_LEN]
        if name not in names:
            names.append(name)
        if len(names) >= MAX_NAMES:
            break
    return names


def _git(*args: str) -> bytes:
    return subprocess.run(["git", *args], check=True, capture_output=True).stdout


INTERRUPTED = 128 + int(signal.SIGINT)


def _diff_hash() -> str:
    # erfasst ungetrackte Dateien nicht (git diff HEAD kennt nur Getracktes)
    diff = _git("diff", "HEAD", "--binary")
    return hashlib.sha1(diff).hexdigest()[:12] if diff else ""


def build_event(suite: str, code: int, lines: list[str]) -> dict:
    event = {
        "ts": paths.now_iso(),
        "session_id": os.environ.get("CLAUDE_CODE_SESSION_ID", "manual"),
        "agent_id": "",
        "source": "make",
        "kind": "test_passed" if code == 0 else "test_failed",
        "suite": suite,
        "commit": _git("rev-parse", "--short", "HEAD").decode().strip(),
        "diff": _diff_hash(),
    }
    if code != 0:
        event["names"] = parse_names(lines, suite)
        event["exit"] = code
        event["load"] = round(os.getloadavg()[0], 1)
    return event


def _record(suite: str, code: int, lines: list[str], skip_exit: int | None) -> None:
    if os.environ.get("CI") or code == skip_exit:
        return
    try:
        paths.append_event(build_event(suite, code, lines))
    except Exception as error:  # noqa: BLE001 - testrun wirft nie
        print(f"testrun: Event nicht geschrieben ({error})", file=sys.stderr)


def _run(command: list[str]) -> tuple[int, list[str]]:
    lines: list[str] = []
    with subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        errors="replace",
    ) as proc:
        assert proc.stdout is not None
        try:
            for line in proc.stdout:
                sys.stdout.write(line)
                sys.stdout.flush()
                lines.append(line)
        except KeyboardInterrupt:
            proc.terminate()  # Kind nicht verwaist zurücklassen
            raise
    return _shell_exit(proc.returncode), lines


def _shell_exit(returncode: int) -> int:
    """Wie die Shell: Tod durch Signal N ergibt 128+N (statt negativem Code)."""
    return 128 - returncode if returncode < 0 else returncode


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="testrun.py", description=__doc__)
    parser.add_argument("--suite", required=True, choices=["studio", "vitest"])
    parser.add_argument("--skip-exit", type=int, default=None)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args(argv)
    command = args.command[1:] if args.command[:1] == ["--"] else args.command
    if not command:
        parser.error("Befehl fehlt (nach --)")
    try:
        code, lines = _run(command)
    except OSError as error:
        print(f"testrun: Befehl nicht startbar ({error})", file=sys.stderr)
        return 127
    except (
        KeyboardInterrupt
    ):  # Ctrl-C: Kind wurde vom with-Block beendet, kein Ergebnis
        print("testrun: abgebrochen", file=sys.stderr)
        return INTERRUPTED
    _record(args.suite, code, lines, args.skip_exit)
    return code


if __name__ == "__main__":
    sys.exit(main())
