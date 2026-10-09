# T01a · Prettier-Check: Modul `precommit.py` (TOOL-PRETTIER-HOOK)

Strang `py` · Worktree `.worktrees/buendel-py` · Branch `tool/buendel-py` · Umsetzer `tech-sim-engineer` (sonnet) · AK-TB01–TB06 · Grundlage R417 V2

**Files:**

- Create: `tools/studio/precommit.py`, `tools/studio/tests/test_precommit.py`
- Danach: [T01b](T01b-hook-aktivierung.md) im selben Start (Hook-Datei, `Makefile`, Echtlauf)

**Interfaces:**

- Produces: `precommit.staged_files(runner) -> list[str]`, `precommit.prettier_bin(top: Path, main: Path) -> Path | None`, `precommit.check(files, prettier, runner) -> tuple[int, list[str], str]`, `precommit.main(runner=run, env=os.environ) -> int`; Event `{"kind": "commit_rejected", "source": "log", "summary", "files", "worktree", "session_id", "agent_id": "", "ts"}`. T06 dokumentiert `make hooks`.
- Consumes: `paths.append_event`, `paths.now_iso`, `paths.repo_root`.

## Schritt 1 · Tests zuerst (rot)

`tools/studio/tests/test_precommit.py`:

```python
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import model
import precommit
from paths import repo_root

SCRIPT = Path(precommit.__file__)
PRETTIER = repo_root() / "node_modules" / ".bin" / "prettier"


class FakeRunner:
    def __init__(self, staged: str, prettier_code=0, prettier_out=""):
        self.calls: list[list[str]] = []
        self.staged, self.code, self.out = staged, prettier_code, prettier_out

    def __call__(self, args):
        self.calls.append(list(args))
        if args[:2] == ["git", "diff"]:
            return subprocess.CompletedProcess(args, 0, self.staged, "")
        if args[:2] == ["git", "rev-parse"]:
            return subprocess.CompletedProcess(args, 0, "/wt\n", "")
        return subprocess.CompletedProcess(args, self.code, self.out, "")

    def prettier_calls(self):
        return [c for c in self.calls if c[0] != "git"]


class StagedTest(unittest.TestCase):
    def test_staged_files_nul_separated(self):
        run = FakeRunner("a b.md\0ü.ts\0dir/c.json\0")
        self.assertEqual(precommit.staged_files(run), ["a b.md", "ü.ts", "dir/c.json"])
        self.assertIn("--diff-filter=ACMR", run.calls[0])
        self.assertIn("-z", run.calls[0])


class MainTest(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.home = Path(tmp.name)
        patcher = mock.patch.dict(os.environ, {"STUDIO_HOME": tmp.name})
        patcher.start()
        self.addCleanup(patcher.stop)
        bin_patch = mock.patch.object(precommit, "prettier_bin", return_value=Path("/x/prettier"))
        bin_patch.start()
        self.addCleanup(bin_patch.stop)

    def events(self):
        path = self.home / "events.jsonl"
        if not path.exists():
            return []
        return [json.loads(line) for line in path.read_text("utf-8").splitlines()]

    def test_nothing_staged_runs_no_prettier(self):
        run = FakeRunner("")
        self.assertEqual(precommit.main(run, {}), 0)
        self.assertEqual(run.prettier_calls(), [])

    def test_passes_exactly_staged_paths_once(self):
        run = FakeRunner("a.ts\0b.md\0")
        self.assertEqual(precommit.main(run, {}), 0)
        calls = run.prettier_calls()
        self.assertEqual(len(calls), 1)
        self.assertEqual(calls[0][-2:], ["a.ts", "b.md"])
        self.assertIn("--list-different", calls[0])
        self.assertIn("--ignore-unknown", calls[0])

    def test_rejects_and_logs_event(self):
        run = FakeRunner("a.ts\0b.md\0", prettier_code=1, prettier_out="a.ts\n")
        env = {"CLAUDE_CODE_SESSION_ID": "s-42"}
        self.assertEqual(precommit.main(run, env), 1)
        [event] = self.events()
        self.assertEqual(event["kind"], "commit_rejected")
        self.assertEqual(event["session_id"], "s-42")
        self.assertEqual(event["files"], ["a.ts"])
        self.assertEqual(event["source"], "log")

    def test_prettier_error_rejects_with_all_files(self):
        run = FakeRunner("a.ts\0", prettier_code=2, prettier_out="")
        self.assertEqual(precommit.main(run, {}), 1)
        self.assertEqual(self.events()[0]["files"], ["a.ts"])

    def test_missing_prettier_allows(self):
        with mock.patch.object(precommit, "prettier_bin", return_value=None):
            self.assertEqual(precommit.main(FakeRunner("a.ts\0"), {}), 0)

    def test_event_does_not_break_dashboard_model(self):
        run = FakeRunner("a.ts\0", prettier_code=1, prettier_out="a.ts\n")
        precommit.main(run, {"CLAUDE_CODE_SESSION_ID": "s1"})
        state = model.build_state(self.events(), 0.0, {})
        self.assertIn("tree", state)


@unittest.skipUnless(PRETTIER.is_file(), "node_modules fehlt")
class RealRunTest(unittest.TestCase):
    def test_real_repo_rejects_then_accepts(self):
        with tempfile.TemporaryDirectory() as repo, tempfile.TemporaryDirectory() as home:
            env = {**os.environ, "STUDIO_HOME": home}
            subprocess.run(["git", "init", "-q"], cwd=repo, check=True)
            Path(repo, "bad.ts").write_text("const  a=1\n", "utf-8")
            subprocess.run(["git", "add", "bad.ts"], cwd=repo, check=True)
            done = subprocess.run([sys.executable, str(SCRIPT)], cwd=repo, env=env, capture_output=True, text=True)
            self.assertEqual(done.returncode, 1, done.stderr)
            self.assertIn("bad.ts", done.stderr)
            Path(repo, "bad.ts").write_text("const a = 1;\n", "utf-8")
            subprocess.run(["git", "add", "bad.ts"], cwd=repo, check=True)
            done = subprocess.run([sys.executable, str(SCRIPT)], cwd=repo, env=env, capture_output=True, text=True)
            self.assertEqual(done.returncode, 0, done.stderr)
```

Hinweis: Signatur `model.build_state(events, now, agent_models, session=None, …)`; für `now` besser `time.time()` statt `0.0` (Import `time`). Zeilen über 88 Zeichen formatiert Ruff. Lauf: `python3 -m unittest discover -s tools/studio/tests -t tools/studio -p 'test_precommit.py'; echo EXIT=$?` → rot (`ModuleNotFoundError: precommit`). Rote Ausgabe in den Bericht (R395).

## Schritt 2 · `tools/studio/precommit.py`

```python
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
    done = runner(["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"])
    if done.returncode != 0:
        return []
    return [name for name in done.stdout.split("\0") if name]


def prettier_bin(top: Path, main: Path) -> Path | None:
    for base in (top, main):
        candidate = base / "node_modules" / ".bin" / "prettier"
        if candidate.is_file():
            return candidate
    return None


def check(files: list[str], prettier: Path, runner: Runner = run) -> tuple[int, list[str], str]:
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
    lines.append("Beheben: npx prettier --write <dateien>, neu stagen, erneut committen.")
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
        top = Path(runner(["git", "rev-parse", "--show-toplevel"]).stdout.strip() or ".")
        prettier = prettier_bin(top, repo_root())
        if prettier is None:
            print("pre-commit: Prettier fehlt (npm ci?), Check übersprungen.", file=sys.stderr)
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
```

## Schritt 3 · Grün und Commit

```bash
python3 -m unittest discover -s tools/studio/tests -t tools/studio -p 'test_precommit.py'; echo EXIT=$?
make studio-lint; echo EXIT=$?
git add tools/studio/precommit.py tools/studio/tests/test_precommit.py
git commit -m "feat: precommit.py prüft gestagte Dateien mit Prettier (R417 V2)"
```

Weiter mit T01b.
