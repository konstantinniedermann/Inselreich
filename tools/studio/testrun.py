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
LOAD_CAP = 8.0  # ab dieser 1-min-Last begrenzt testrun die Vitest-Worker
WORKER_CAP = 4
WORKERS_ENV = "VITEST_MAX_WORKERS"
MAX_NAMES = 50
MAX_NAME_LEN = 200
MAX_MESSAGE_LEN = 200
MESSAGE_RE = re.compile(r"^\s*(?:(?:\w+\.)*\w*(?:Error|Exception)\b|Test timed out)")
UNITTEST_RE = re.compile(r"^(FAIL|ERROR): (\S+) \((.+)\)$")
VITEST_RE = re.compile(
    r"^\s*FAIL\s+(?:\|[^|]+\|\s+)?(tests/\S+\.test\.ts)(?:\s+>\s+(.+?)|\s+\[.*\])?\s*$"
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


def _is_message(line: str) -> bool:
    return MESSAGE_RE.match(line) is not None


def parse_messages(lines: list[str], suite: str) -> dict[str, str]:
    """Name -> erste Fehlerzeile (Error/Exception/Timeout) vor dem nächsten Namen.

    Wirft nie; nicht erkennbare Meldungen fehlen einfach (``names`` bleibt gültig).
    """
    find = _vitest_name if suite == "vitest" else _unittest_name
    messages: dict[str, str] = {}
    current: str | None = None
    try:
        for raw in lines:
            line = raw.rstrip("\n")
            name = find(line)
            if name is not None:
                current = name[:MAX_NAME_LEN]
            elif current is not None and _is_message(line):
                if current not in messages and len(messages) < MAX_NAMES:
                    messages[current] = line.strip()[:MAX_MESSAGE_LEN]
                current = None
    except Exception:  # noqa: BLE001 - testrun wirft nie
        return messages  # bisher gefundene Meldungen bleiben gültig
    return messages


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


def _tree() -> str | None:
    """Arbeitsbaum relativ zur Hauptrepo-Wurzel (``.`` oder ``.worktrees/x``); Fehler: None."""
    try:
        top = os.path.realpath(_git("rev-parse", "--show-toplevel").decode().strip())
        common = os.path.realpath(
            _git("rev-parse", "--git-common-dir").decode().strip()
        )
        return os.path.relpath(top, os.path.dirname(common))
    except Exception:  # noqa: BLE001 - testrun wirft nie
        return None


def _base_event(suite: str, kind: str) -> dict:
    event = {
        "ts": paths.now_iso(),
        "session_id": os.environ.get("CLAUDE_CODE_SESSION_ID", "manual"),
        "agent_id": "",
        "source": "make",
        "kind": kind,
        "suite": suite,
        "commit": _git("rev-parse", "--short", "HEAD").decode().strip(),
        "diff": _diff_hash(),
    }
    tree = _tree()
    if tree is not None:
        event["tree"] = tree
    return event


def _start_load() -> float | None:
    try:
        return round(os.getloadavg()[0], 1)
    except OSError:
        return None


def _plan_workers(suite: str, load: float | None) -> tuple[dict, int | None]:
    """Umgebung fürs Kind und Workerzahl im Event (nur Vitest)."""
    env = dict(os.environ)
    if suite != "vitest":
        return env, None
    if WORKERS_ENV not in env and load is not None and load >= LOAD_CAP:
        env[WORKERS_ENV] = str(WORKER_CAP)
    try:
        return env, int(env[WORKERS_ENV])
    except (KeyError, ValueError):
        return env, max(1, (os.cpu_count() or 2) - 1)


def build_event(
    suite: str,
    code: int,
    lines: list[str],
    load: float | None = None,
    workers: int | None = None,
) -> dict:
    event = _base_event(suite, "test_passed" if code == 0 else "test_failed")
    if load is not None:
        event["load"] = load
    if workers is not None:
        event["workers"] = workers
    if code != 0:
        event["names"] = parse_names(lines, suite)
        messages = parse_messages(lines, suite)
        if messages:
            event["messages"] = messages
        event["exit"] = code
    return event


def _record(
    suite: str,
    code: int,
    lines: list[str],
    skip_exit: int | None,
    load: float | None = None,
    workers: int | None = None,
) -> None:
    if os.environ.get("CI") or code == skip_exit:
        return
    try:
        paths.append_event(build_event(suite, code, lines, load, workers))
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
    """SIGTERM an die Gruppe, nach GRACE SIGKILL; Kind und Enkel sind danach tot.

    Unterbrechungsfest: weitere Interrupts während der Eskalation werden ignoriert,
    und das SIGKILL läuft in jedem Fall.
    """
    pgid = proc.pid  # start_new_session=True: Gruppen-ID = PID des Kindes
    old_mask = _block_interrupts()  # Fenster bis SIG_IGN gesetzt ist schliessen
    previous = _ignore_interrupts()
    try:
        _signal_group(pgid, signal.SIGTERM)
        deadline = time.monotonic() + GRACE
        while time.monotonic() < deadline:
            proc.poll()  # reapt das Kind, sonst bleibt die Gruppe als Zombie sichtbar
            if not _group_alive(pgid):
                break
            time.sleep(POLL)
    finally:
        _signal_group(pgid, signal.SIGKILL)  # nach Frist; sonst wirkungslos
        try:
            proc.wait()
        finally:
            # Maske zuerst: wartende Signale treffen noch SIG_IGN und verfallen
            _restore_mask(old_mask)
            _restore_handlers(previous)


def _interrupt_signals(source=signal) -> tuple:
    """SIGINT, SIGTERM und SIGHUP; fehlende Signale (Windows) entfallen, der Import bricht nie."""
    names = ("SIGINT", "SIGTERM", "SIGHUP")
    return tuple(s for s in (getattr(source, n, None) for n in names) if s is not None)


_INTERRUPTS = _interrupt_signals()


def _block_interrupts() -> set | None:
    """Blockiert die Interrupt-Signale; liefert die alte Maske (None: nicht möglich)."""
    try:
        return signal.pthread_sigmask(signal.SIG_BLOCK, _INTERRUPTS)
    except (AttributeError, ValueError, OSError):  # Windows/kein Hauptthread: fail-open
        return None


def _restore_mask(old_mask: set | None) -> None:
    if old_mask is None:
        return
    try:
        signal.pthread_sigmask(signal.SIG_SETMASK, old_mask)
    except (AttributeError, ValueError, OSError):
        pass


def _ignore_interrupts() -> dict:
    previous = {}
    for sig in _INTERRUPTS:
        try:
            previous[sig] = signal.signal(sig, signal.SIG_IGN)
        except ValueError:  # nicht im Hauptthread
            break
    return previous


def _restore_handlers(previous: dict) -> None:
    for sig, handler in previous.items():
        signal.signal(sig, handler)


def _run(command: list[str], env: dict | None = None) -> tuple[int, list[str]]:
    lines: list[str] = []
    with subprocess.Popen(
        command,
        env=env,
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
    for sig in (s for s in _INTERRUPTS if s != signal.SIGINT):
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
    load = _start_load()
    env, workers = _plan_workers(args.suite, load)
    previous = _install_interrupt_handlers()
    try:
        code, lines = _run(command, env)
    except OSError as error:
        print(f"testrun: Befehl nicht startbar ({error})", file=sys.stderr)
        return 127
    except KeyboardInterrupt:  # Ctrl-C/SIGTERM: Gruppe ist beendet, kein Ergebnis
        _record_aborted(args.suite)
        print("testrun: abgebrochen", file=sys.stderr)
        return INTERRUPTED
    finally:
        _restore_handlers(previous)
    _record(args.suite, code, lines, args.skip_exit, load, workers)
    return code


if __name__ == "__main__":
    sys.exit(main())
