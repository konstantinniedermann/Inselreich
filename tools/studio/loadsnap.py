"""Lastprotokoll bei Abbruch (R588 V3): 1-min-Load, Top-5-Prozesse nach CPU, Vitest-Worker.

Gemeinsam für ``tools/testlock/testlock.ts`` (per CLI) und ``pushcheck.py`` (direkt).
CLI: python3 tools/studio/loadsnap.py --reason <grund> --source <quelle> [--load X]
Druckt eine Zeile auf stderr und schreibt das Event ``load_abort``. Fehler beenden nie mit Fehlercode.

Je Top-Prozess zusätzlich ``script`` (erstes Argument nach dem Interpreter als Basename, sonst
Basename des Programms; nie weitere Argumente) und ``klasse`` (``eigen`` = Repo-Pfad oder bekanntes
Studio-Werkzeug im Befehlsstring, sonst ``fremd``). Je Probe ``cpu_eigen``/``cpu_fremd``: CPU-Summe
über alle geparsten Prozesse, auf 1 Nachkommastelle gerundet. Die alten Felder bleiben unverändert.
``LOADSNAP_PS_FIXTURE`` (ps-Ausgabe pid,pcpu,command aus Datei) gibt es nur für Tests (R378).
"""

from __future__ import annotations

import argparse
import os
import re
import subprocess
import sys
from pathlib import Path

import paths

CMD_MAX = 60
TOP_N = 5
REPO_ROOT = "/Users/KN/CAS/projekte/anno-clone"
_INTERPRETER = re.compile(r"^(python[\d.]*|node|bash|sh|zsh|ruby|perl|deno|bun|tsx)$", re.I)
_TOOL = re.compile(r"(?<![\w-])(vitest|vite|render-qa|testlock|pushcheck|loadsnap|unittest|testrun)(?![\w-])")
_LINE = re.compile(r"^\s*(\d+)\s+(\d+(?:[.,]\d+)?)\s+(.*\S)\s*$")


_SCRIPT_EXT = (".py", ".js", ".mjs", ".cjs", ".ts", ".sh")


def script_name(cmd: str) -> str:
    """Skriptname eines Befehls (Basename), nie Optionen oder weitere Argumente."""
    tokens = cmd.split()
    if not tokens:
        return ""
    program = tokens[0].rsplit("/", 1)[-1]
    if not _INTERPRETER.match(program):
        if ".app/" in cmd:  # Pfad mit Leerzeichen: Programmteil bis zur ersten Option
            return cmd.split(" -", 1)[0].rsplit("/", 1)[-1].strip()
        return program
    rest = tokens[1:]
    for i, token in enumerate(rest):
        if token == "-c":
            return "-c"
        if token == "-m":
            return rest[i + 1].rsplit("/", 1)[-1] if i + 1 < len(rest) else "-m"
        if not token.startswith("-") and (token.endswith(_SCRIPT_EXT) or "/" in token):
            return token.rsplit("/", 1)[-1]
    if rest and not rest[0].startswith("-"):  # direkt nach dem Interpreter: Skript ohne Endung
        return rest[0].rsplit("/", 1)[-1]
    return program


def classify(cmd: str, repo_root: str | None = None) -> str:
    """``eigen`` (Repo-Pfad oder Studio-Werkzeug) oder ``fremd``; nur der Befehlsstring."""
    root = REPO_ROOT if repo_root is None else repo_root
    tokens = cmd.split()
    program = tokens[0].rsplit("/", 1)[-1] if tokens else ""
    if root and root in cmd:
        return "eigen"
    if program == "make" or _TOOL.search(cmd):
        return "eigen"
    if "chrom" in cmd.lower() and (".studio" in cmd or "anno-clone" in cmd):
        return "eigen"
    return "fremd"


def parse_snapshot(ps_text: str, load: float | None) -> dict:
    """Parst ``ps -A -o pid=,pcpu=,command=`` zu {load, top5, vitest_workers}."""
    procs: list[dict] = []
    for line in ps_text.splitlines():
        match = _LINE.match(line)
        if not match:
            continue
        procs.append(
            {
                "pid": int(match.group(1)),
                "cpu": float(match.group(2).replace(",", ".")),
                "cmd": match.group(3),
            }
        )
    workers = sum(1 for p in procs if "vitest" in p["cmd"])
    top = sorted(procs, key=lambda p: -p["cpu"])[:TOP_N]
    cpu = {"eigen": 0.0, "fremd": 0.0}
    for p in procs:
        p["klasse"] = classify(p["cmd"])
        cpu[p["klasse"]] += p["cpu"]
    for p in top:
        p["script"] = script_name(p["cmd"])
        p["cmd"] = p["cmd"][:CMD_MAX]
    return {
        "load": load,
        "top5": top,
        "vitest_workers": workers,
        "cpu_eigen": round(cpu["eigen"], 1),
        "cpu_fremd": round(cpu["fremd"], 1),
    }


def format_line(snap: dict) -> str:
    load = snap["load"]
    shown = "unbekannt" if load is None else f"{load:.2f}"
    top = "; ".join(f"{p['pid']} {p['cpu']:.1f}% {p['script']} [{p['klasse']}]" for p in snap["top5"])
    return (
        f"Lastprotokoll: Load {shown} · Top {TOP_N} CPU: {top or 'keine Daten'}"
        f" · Vitest-Worker: {snap['vitest_workers']}"
        f" · CPU eigen {snap.get('cpu_eigen', 0.0):.1f}% / fremd {snap.get('cpu_fremd', 0.0):.1f}%"
    )


def real_snapshot(load: float | None = None) -> dict:
    """Liest ps (oder die Test-Fixture); ps-Fehler ergeben einen leeren Schnappschuss."""
    if load is None:
        try:
            load = os.getloadavg()[0]
        except OSError:
            load = None
    fixture = os.environ.get("LOADSNAP_PS_FIXTURE")  # nur für Tests (R378)
    try:
        if fixture is not None:
            text = Path(fixture).read_text(encoding="utf-8", errors="replace")
        else:
            text = subprocess.run(
                ["ps", "-A", "-o", "pid=,pcpu=,command="],
                capture_output=True,
                text=True,
                errors="replace",
                timeout=10,
                check=True,
            ).stdout
    except (OSError, subprocess.SubprocessError):
        text = ""
    return parse_snapshot(text, load)


def record(reason: str, source: str, snap: dict) -> None:
    paths.append_event(
        {
            "ts": paths.now_iso(),
            "session_id": os.environ.get("CLAUDE_CODE_SESSION_ID", "manual"),
            "kind": "load_abort",
            "source": source,
            "reason": reason,
            "load": snap["load"],
            "top5": snap["top5"],
            "vitest_workers": snap["vitest_workers"],
            "cpu_eigen": snap.get("cpu_eigen"),
            "cpu_fremd": snap.get("cpu_fremd"),
        }
    )


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reason", required=True)
    parser.add_argument("--source", required=True)
    parser.add_argument("--load", type=float, default=None)
    args = parser.parse_args(argv)
    snap = real_snapshot(args.load)
    print(format_line(snap), file=sys.stderr)
    try:
        record(args.reason, args.source, snap)
    except Exception as error:  # noqa: BLE001 - Protokoll darf den Abbruch nie ändern
        print(f"loadsnap: Ereignis nicht geschrieben ({error})", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
