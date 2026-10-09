"""Git-pre-commit: Prettier-Check der gestagten Dateien (R417 V2, TOOL-PRETTIER-HOOK).

Aufruf über tools/githooks/pre-commit (aktiv nach `make hooks`). Ein Prettier-Lauf über
alle gestagten Pfade; Ablehnung mit Exit 1 und Event `commit_rejected`. Grenze: Prettier
liest den Arbeitsbaum, nicht den Index-Stand (`git add -p`). Fehlt Prettier oder scheitert
git, lässt der Hook den Commit zu.
"""

from __future__ import annotations

import os
import subprocess
import sys
from collections.abc import Callable, Mapping, Sequence
from pathlib import Path

from paths import append_event, now_iso, repo_root

FILES_MAX = 20
Runner = Callable[[Sequence[str]], subprocess.CompletedProcess]


def run(args: Sequence[str]) -> subprocess.CompletedProcess:
    return subprocess.run(list(args), capture_output=True, text=True, check=False)


def staged_files(runner: Runner = run) -> list[str]:
    done = runner(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]
    )
    if done.returncode != 0:
        return []
    return [name for name in done.stdout.split("\0") if name]


def prettier_bin(top: Path, main: Path) -> Path | None:
    for base in (top, main):
        candidate = base / "node_modules" / ".bin" / "prettier"
        if candidate.is_file():
            return candidate
    return None


def check(
    files: list[str], prettier: Path, runner: Runner = run
) -> tuple[int, list[str], str]:
    args = [str(prettier), "--list-different", "--ignore-unknown"]
    args += ["--no-error-on-unmatched-pattern", "--", *files]
    done = runner(args)
    failing = [line.strip() for line in done.stdout.splitlines() if line.strip()]
    return done.returncode, failing, done.stderr


def message(files: list[str], detail: str) -> str:
    lines = ["pre-commit: Commit abgelehnt, Prettier-Format fehlt (R417):"]
    lines += [f"  {name}" for name in files]
    if detail.strip():
        lines.append(detail.strip())
    lines.append(
        "Beheben: npx prettier --write <dateien>, neu stagen, erneut committen."
    )
    return "\n".join(lines)


def record(files: list[str], top: Path, env: Mapping[str, str]) -> None:
    event = {
        "ts": now_iso(),
        "session_id": env.get("CLAUDE_CODE_SESSION_ID", "manual"),
        "agent_id": "",
        "source": "log",
        "kind": "commit_rejected",
        "summary": f"Prettier: {len(files)} Datei(en) nicht formatiert",
        "files": files[:FILES_MAX],
        "worktree": str(top),
    }
    try:
        append_event(event)
    except OSError:
        pass  # Ablehnung gilt auch ohne Log


def main(runner: Runner = run, env: Mapping[str, str] = os.environ) -> int:
    try:
        files = staged_files(runner)
        if not files:
            return 0
        top = Path(
            runner(["git", "rev-parse", "--show-toplevel"]).stdout.strip() or "."
        )
        prettier = prettier_bin(top, repo_root())
        if prettier is None:
            print(
                "pre-commit: Prettier fehlt (npm ci?), Check übersprungen.",
                file=sys.stderr,
            )
            return 0
        code, failing, detail = check(files, prettier, runner)
    except OSError as exc:
        print(f"pre-commit: Check übersprungen ({exc}).", file=sys.stderr)
        return 0
    if code == 0:
        return 0
    shown = failing or files
    print(message(shown, detail), file=sys.stderr)
    record(shown, top, env)
    return 1


if __name__ == "__main__":
    sys.exit(main())
