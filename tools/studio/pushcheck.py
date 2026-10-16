"""Push-Gate in einem Schritt: python3 tools/studio/pushcheck.py (make push-check, R488 V1, R503).

Vorprüfungen, Warten auf ruhige Last, genau ein ``make check-push``, strenge Zeitreserve
(``check.ts --push``), höchstens eine Nachmessung der markierten Dateien, ``check-ci-perf``.
Exit 0 grün · 1 rot · 2 kein ruhiges Fenster / nicht belastbar · 3 Testsperre belegt.

Modus ``--gate`` (make zeitreserve-gate, R598 V1): nur die Nachmessung der aktuell
markierten Dateien (``MARKED``), vor dem Push-Gate. Gleiche Exit-Codes, Schlusszeile
``zeitreserve-gate: grün | SUBSTANZ | nicht belastbar``.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
import time
from collections.abc import Callable
from pathlib import Path

import loadsnap
import paths

LOAD_WAIT = 3.0
WAIT_MAX_S = 600
POLL_S = 15
MARKED = Path(".studio/zeitreserve-marked.json")
RETRY_OUT = Path(".studio/zeitreserve-retry.json")
MEASUREMENT = Path(".studio/zeitreserve.json")
CHECK_TS = ["node", "tools/zeitreserve/check.ts", "--push"]
PRECHECKS = [
    ("conflicts", ["make", "conflicts"]),
    ("tsc", ["npx", "tsc", "--noEmit"]),
    ("lint", ["make", "lint"]),
    ("zeittests", ["make", "zeittests"]),
]

Run = Callable[[list[str], dict | None], tuple[int, str]]


def real_run(cmd: list[str], env: dict | None = None) -> tuple[int, str]:
    """Führt den Befehl aus, reicht die Ausgabe durch und liefert Exit-Code und Text."""
    lines: list[str] = []
    full_env = {**os.environ, **env} if env else None
    with subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        errors="replace",
        env=full_env,
    ) as proc:
        assert proc.stdout is not None
        for line in proc.stdout:
            print(line, end="", flush=True)
            lines.append(line)
    return proc.returncode, "".join(lines)


def real_git() -> tuple[str, str]:
    def out(*args: str) -> str:
        return subprocess.run(
            ["git", *args], check=True, capture_output=True, text=True
        ).stdout.strip()

    return out("rev-parse", "HEAD"), out(
        "status", "--porcelain", "--untracked-files=no"
    )


def real_load() -> float:
    return os.getloadavg()[0]


def _say(text: str) -> None:
    print(text, flush=True)


def _mmss(seconds: float) -> str:
    return f"{int(seconds) // 60}:{int(seconds) % 60:02d}"


def _read_list(path: Path) -> list[str] | None:
    """Gültige JSON-Liste von Strings, sonst None (fehlt oder ungültig)."""
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None
    if isinstance(data, list) and all(isinstance(item, str) for item in data):
        return data
    return None


def _load_start(path: Path) -> float | None:
    try:
        value = json.loads(path.read_text(encoding="utf-8")).get("loadStart")
    except (OSError, ValueError, AttributeError):
        return None
    return float(value) if isinstance(value, (int, float)) else None


class Gate:
    def __init__(
        self,
        run: Run,
        load,
        sleep,
        git,
        marked: Path,
        retry_out: Path,
        measurement: Path,
    ):
        self.run, self.load, self.sleep, self.git = run, load, sleep, git
        self.marked, self.retry_out, self.measurement = marked, retry_out, measurement
        self.steps: list[dict] = []
        self.load_errors = 0
        self.full_checks = 0
        self.retry_files = 0
        self.retried = False
        self.d1 = False
        self.main_load_start: float | None = None
        self.gate_note = ""
        self.started = time.monotonic()

    def step(
        self, name: str, cmd: list[str], env: dict | None = None
    ) -> tuple[int, str]:
        load = self._load_now()
        began = time.monotonic()
        code, output = self.run(cmd, env)
        self.steps.append(
            {
                "name": name,
                "exit": code,
                "s": round(time.monotonic() - began, 1),
                "load": load,  # 1-min-Load zu Beginn der Stufe (R514 V2)
            }
        )
        return code, output

    def _load_now(self) -> float | None:
        try:
            return round(self.load(), 1)
        except (OSError, ValueError, TypeError):
            self.load_errors += 1
            return None

    @staticmethod
    def _load_protocol(current: float | None) -> None:
        """Lastprotokoll (R588 V3): Ausgabezeile und Event; Fehler werden geschluckt."""
        try:
            snap = loadsnap.real_snapshot(current)
            _say(f"push-check: {loadsnap.format_line(snap)}")
            loadsnap.record("kein_ruhiges_fenster", "pushcheck", snap)
        except Exception as error:  # noqa: BLE001 - nie wegen des Protokolls abbrechen
            print(
                f"push-check: Lastprotokoll fehlgeschlagen ({error})", file=sys.stderr
            )

    def wait_quiet(self) -> bool:
        waited = 0
        while True:
            try:
                current: float | None = self.load()
            except (OSError, ValueError, TypeError):
                self.load_errors += 1  # Fehler = nicht ruhig, bis die Frist abläuft
                current = None
            shown = "unbekannt" if current is None else f"{current:.1f}"
            if current is not None and current <= LOAD_WAIT:
                return True
            if waited >= WAIT_MAX_S:
                _say(f"push-check: kein ruhiges Fenster nach {waited} s (Load {shown})")
                self._load_protocol(current)
                return False
            if waited % 60 == 0:
                _say(
                    f"push-check: warte auf Load <= {LOAD_WAIT} (jetzt {shown}, {waited} s)"
                )
            self.sleep(POLL_S)
            waited += POLL_S

    def retry(self, files: list[str]) -> int:
        """Nachmessung der markierten Dateien; Exit-Code 0, 1 oder 2."""
        self.retried = True
        self.retry_files = len(files)
        if not self.wait_quiet():
            return 2
        cmd = [
            "node", "tools/testlock/testlock.ts", "npx", "vitest", "run", *files,
            "--reporter=default", "--reporter=./tools/zeitreserve/reporter.ts",
        ]  # fmt: skip
        code, output = self.step(
            "nachmessung", cmd, {"ZEITRESERVE_OUT": str(self.retry_out)}
        )
        if code != 0:
            return 3 if "testlock: ABBRUCH" in output else 1
        code, _ = self.step(
            "zeitreserve-retry", [*CHECK_TS, "--retry", str(self.retry_out)]
        )
        return code if code in (0, 2) else 1

    def zeitreserve(self) -> int:
        code, _ = self.step("zeitreserve", [*CHECK_TS, "--marked", str(self.marked)])
        if code == 0:
            return 0
        start = _load_start(self.measurement)
        self.main_load_start = start
        if code in (1, 2):
            files = _read_list(self.marked)
            if files is None:
                _say(
                    "push-check: Markierungsliste fehlt oder ist ungültig (nicht belastbar)"
                )
                return 2
            if not files:
                self.d1 = code == 2  # D1: nichts nachzumessen
                return 0 if code == 2 else 1
            return self.retry(files)
        return 1

    def gate(self) -> int:
        """Nur Nachmessung der Markierungsliste (kein check-push); Exit 0, 1, 2 oder 3."""
        # Liste immer aus der aktuellen Messung neu berechnen: eine Datei aus einem
        # früheren Lauf passt sonst nicht zu `.studio/zeitreserve.json` (Exit 2 in REL-21).
        # check.ts schreibt die Liste vor jeder Bewertung und löscht sie bei unbrauchbarer Messung.
        self.step("zeitreserve-mark", [*CHECK_TS, "--marked", str(self.marked)])
        files = _read_list(self.marked)
        if files is None:
            self.gate_note = "Markierungsliste fehlt oder ist ungültig"
            return 2
        if not files:
            self.gate_note = "Markierungsliste leer, nichts zu messen"
            return 0
        return self.retry(files)

    def sequence(self) -> int:
        for name, cmd in PRECHECKS:
            if self.step(name, cmd)[0] != 0:
                return 1
        if not self.wait_quiet():
            return 2
        for stale in (self.marked, self.retry_out):
            stale.unlink(missing_ok=True)
        self.full_checks += 1
        code, output = self.step("check-push", ["make", "check-push"])
        if code != 0:
            return 3 if "testlock: ABBRUCH" in output else 1
        code = self.zeitreserve()
        if code != 0:
            return code
        return 0 if self.step("check-ci-perf", ["make", "check-ci-perf"])[0] == 0 else 1


def _d1_note(gate: Gate) -> str:
    if not gate.d1:
        return ""
    last = (
        "unbekannt" if gate.main_load_start is None else f"{gate.main_load_start:.1f}"
    )
    return f" · D1 (Last {last}, leere Liste)"


def main(
    run: Run = real_run,
    load=real_load,
    sleep=time.sleep,
    git=real_git,
    marked: Path = MARKED,
    retry_out: Path = RETRY_OUT,
    measurement: Path = MEASUREMENT,
) -> int:
    gate = Gate(run, load, sleep, git, marked, retry_out, measurement)
    head0, status0 = git()
    code = gate.sequence()
    head1, status1 = git()
    if code == 0 and (head1 != head0 or status1 != status0):
        _say("push-check: Arbeitsbaum verändert, neu starten")
        code = 1
    duration = time.monotonic() - gate.started
    _say(
        f"push-check: EXIT={code} · geprüfter Hash {head0} · check-push {gate.full_checks}× · "
        f"Nachmessung {int(gate.retried)} ({gate.retry_files} Dateien) · {_mmss(duration)}"
        + _d1_note(gate)
    )
    try:
        paths.append_event(
            {
                "ts": paths.now_iso(),
                "session_id": os.environ.get("CLAUDE_CODE_SESSION_ID", "manual"),
                "kind": "push_check",
                "head": head0,
                "exit": code,
                "full_checks": gate.full_checks,
                "retry_files": gate.retry_files,
                "d1": gate.d1,
                "main_load_start": gate.main_load_start,
                "load_errors": gate.load_errors,
                "duration_s": round(duration, 1),
                "steps": gate.steps,
            }
        )
    except Exception as error:  # noqa: BLE001 - push-check wirft nie wegen des Events
        print(f"push-check: Ereignis nicht geschrieben ({error})", file=sys.stderr)
    return code


def main_gate(
    run: Run = real_run,
    load=real_load,
    sleep=time.sleep,
    git=real_git,
    marked: Path = MARKED,
    retry_out: Path = RETRY_OUT,
    measurement: Path = MEASUREMENT,
) -> int:
    """Einstieg für ``--gate``: strenge Zeitreserve nur für die markierten Dateien."""
    gate = Gate(run, load, sleep, git, marked, retry_out, measurement)
    retry_out.unlink(missing_ok=True)
    code = gate.gate()
    duration = time.monotonic() - gate.started
    if code == 0:
        note = f" ({gate.gate_note})" if gate.gate_note else ""
        _say(f"zeitreserve-gate: grün{note}")
    elif code == 1:
        _say(
            f"zeitreserve-gate: SUBSTANZ ({gate.retry_files} Dateien, "
            "Nachmessung bei ruhiger Last bestätigt die Verletzung)"
        )
    elif code == 3:
        _say("zeitreserve-gate: Testsperre belegt (Exit 3), später erneut starten")
    else:
        if gate.gate_note:
            reason = gate.gate_note
        else:
            now = gate._load_now()
            shown = "unbekannt" if now is None else f"{now:.1f}"
            quiet = now is not None and now <= LOAD_WAIT
            reason = (
                f"Last {shown}, check.ts meldet nicht belastbar, Hauptmessung fehlt?"
                if quiet and gate.steps
                else f"Last {shown}, kein ruhiges Fenster"
            )
        _say(f"zeitreserve-gate: nicht belastbar ({reason})")
    try:
        paths.append_event(
            {
                "ts": paths.now_iso(),
                "session_id": os.environ.get("CLAUDE_CODE_SESSION_ID", "manual"),
                "kind": "zeitreserve_gate",
                "exit": code,
                "retry_files": gate.retry_files,
                "steps": gate.steps,
                "duration_s": round(duration, 1),
            }
        )
    except Exception as error:  # noqa: BLE001 - nie wegen des Events abbrechen
        print(
            f"zeitreserve-gate: Ereignis nicht geschrieben ({error})", file=sys.stderr
        )
    return code


if __name__ == "__main__":
    sys.exit(main_gate() if "--gate" in sys.argv[1:] else main())
