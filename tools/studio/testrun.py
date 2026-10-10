"""Testlauf mit Event: python3 tools/studio/testrun.py --suite <studio|vitest> -- <befehl>.

Reicht Ausgabe und Exit-Code des Befehls unverändert durch und schreibt je Lauf
ein Event ``test_failed`` (mit Testnamen) oder ``test_passed`` (R450 V1).
Das Kommando läuft in einer eigenen Prozessgruppe; Ctrl-C/SIGTERM/SIGHUP beenden die
ganze Gruppe (SIGTERM, nach ``GRACE`` Sekunden SIGKILL) und schreiben ``test_aborted``.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import signal
import subprocess
import sys
import time

import paths

GRACE = 5.0  # Sekunden zwischen SIGTERM und SIGKILL
POLL = 0.02
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


def _untracked_entries() -> bytes:
    """Name, Grösse und mtime_ns ungetrackter, nicht ignorierter Dateien (ohne Inhalt)."""
    try:
        listing = _git("ls-files", "-o", "--exclude-standard", "-z")
    except (OSError, subprocess.SubprocessError):
        return b""  # bisheriges Verhalten: ungetrackte Dateien bleiben unsichtbar
    entries = bytearray()
    for raw in sorted(filter(None, listing.split(b"\0"))):
        try:
            stat = os.stat(raw)
        except OSError:
            continue
        entries += raw + b"\0%d\0%d\0" % (stat.st_size, stat.st_mtime_ns)
    return bytes(entries)


def _diff_hash() -> str:
    material = _git("diff", "HEAD", "--binary") + _untracked_entries()
    return hashlib.sha1(material).hexdigest()[:12] if material else ""


def _base_event(suite: str, kind: str) -> dict:
    return {
        "ts": paths.now_iso(),
        "session_id": os.environ.get("CLAUDE_CODE_SESSION_ID", "manual"),
        "agent_id": "",
        "source": "make",
        "kind": kind,
        "suite": suite,
        "commit": _git("rev-parse", "--short", "HEAD").decode().strip(),
        "diff": _diff_hash(),
    }


def build_event(suite: str, code: int, lines: list[str]) -> dict:
    event = _base_event(suite, "test_passed" if code == 0 else "test_failed")
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


def _record_aborted(suite: str) -> None:
    """Schreibt ``test_aborted`` (nie ``test_failed``); schluckt jeden Fehler."""
    if os.environ.get("CI"):
        return
    try:
        paths.append_event(_base_event(suite, "test_aborted"))
    except Exception as error:  # noqa: BLE001 - testrun wirft nie
        print(f"testrun: Abbruch-Event nicht geschrieben ({error})", file=sys.stderr)


def _group_alive(pgid: int) -> bool:
    try:
        os.killpg(pgid, 0)
    except OSError:
        return False
    return True


def _signal_group(pgid: int, sig: signal.Signals) -> None:
    try:
        os.killpg(pgid, sig)
    except OSError:
        pass  # Gruppe schon weg


def _stop_group(proc: subprocess.Popen) -> None:
    """SIGTERM an die Gruppe, nach GRACE SIGKILL; Kind und Enkel sind danach tot."""
    pgid = proc.pid  # start_new_session=True: Gruppen-ID = PID des Kindes
    _signal_group(pgid, signal.SIGTERM)
    deadline = time.monotonic() + GRACE
    while time.monotonic() < deadline:
        proc.poll()  # reapt das Kind, sonst bleibt die Gruppe als Zombie sichtbar
        if not _group_alive(pgid):
            break
        time.sleep(POLL)
    _signal_group(pgid, signal.SIGKILL)  # nach Frist; sonst wirkungslos
    proc.wait()


def _run(command: list[str]) -> tuple[int, list[str]]:
    lines: list[str] = []
    with subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        errors="replace",
        start_new_session=True,  # Ctrl-C erreicht die Gruppe nicht mehr von selbst
    ) as proc:
        assert proc.stdout is not None
        try:
            for line in proc.stdout:
                sys.stdout.write(line)
                sys.stdout.flush()
                lines.append(line)
        except KeyboardInterrupt:
            _stop_group(proc)  # Kind und Enkel nicht verwaist zurücklassen
            raise
    return _shell_exit(proc.returncode), lines


def _raise_interrupt(signum, frame) -> None:
    raise KeyboardInterrupt


def _install_interrupt_handlers() -> dict:
    """SIGTERM/SIGHUP wie Ctrl-C behandeln, damit die Prozessgruppe nicht verwaist."""
    previous = {}
    for sig in (signal.SIGTERM, signal.SIGHUP):
        try:
            previous[sig] = signal.signal(sig, _raise_interrupt)
        except ValueError:  # nicht im Hauptthread
            break
    return previous


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
    previous = _install_interrupt_handlers()
    try:
        code, lines = _run(command)
    except OSError as error:
        print(f"testrun: Befehl nicht startbar ({error})", file=sys.stderr)
        return 127
    except KeyboardInterrupt:  # Ctrl-C/SIGTERM: Gruppe ist beendet, kein Ergebnis
        _record_aborted(args.suite)
        print("testrun: abgebrochen", file=sys.stderr)
        return INTERRUPTED
    finally:
        for sig, handler in previous.items():
            signal.signal(sig, handler)
    _record(args.suite, code, lines, args.skip_exit)
    return code


if __name__ == "__main__":
    sys.exit(main())
