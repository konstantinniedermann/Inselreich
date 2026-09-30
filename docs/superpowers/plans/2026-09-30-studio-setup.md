# Studio-Setup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ein virtuelles, hierarchisches Game-Dev-Studio (L0 Direktor → 5 Leads → Arbeiter) mit Handbuch, Personas, Vorlagen, Asset-Policy und einem Live-Dashboard einrichten — ohne das Spiel zu ändern.

**Architecture:** Claude-Code-Hooks und eine kleine Log-CLI schreiben append-only Events nach `.studio/events.jsonl`; ein Python-Modell leitet daraus Organigramm, Budget, Board usw. ab; ein lokaler stdlib-HTTP-Server liefert JSON und ein statisches Dashboard. Organisation und Regeln stehen in `docs/studio/`, Personas in `.claude/agents/`.

**Tech Stack:** Python 3 Standardbibliothek (unittest, http.server, argparse), reines HTML/CSS/JS, Markdown/Mermaid. Keine neuen Pakete.

**Spec:** `docs/superpowers/specs/2026-09-30-studio-design.md`

## Global Constraints

- Nur Python-Standardbibliothek und reines HTML/CSS/JS; keine neuen npm- oder pip-Pakete.
- Kein Code unter `src/`, keine Spielinhalte; `npm test` bleibt bei 112 grünen Tests.
- `make check` (lint, test, studio-test, build) muss grün sein; Prettier formatiert alle neuen `.md`, `.html`, `.css`, `.js`, `.json` (`npx prettier --write <dateien>`).
- Python Ruff-kompatibel: `uvx ruff check tools/studio` und `uvx ruff format --check tools/studio` grün (Zeilenlänge Standard 88).
- Server bindet ausschliesslich an `127.0.0.1`, Standard-Port `8765` (`STUDIO_PORT` überschreibt).
- Events: `.studio/events.jsonl` im **Hauptrepo** (auch aus Worktrees); `STUDIO_HOME` überschreibt das Verzeichnis.
- Inaktiv-Schwelle `STUDIO_INACTIVE_SECONDS`, Standard `300`.
- Status-Werte exakt: `active`, `delegated`, `waiting`, `blocked`, `idle`, `done`, `failed`, `ended`.
- Namensschema: L1 `lead-<bereich>`, L2 `<bereich>-<rolle>`, Bereiche `production`, `design`, `tech`, `art`, `qa`; L0-Rolle `studio-director`.
- Modellstufen: stark = `opus`, mittel = `sonnet`, klein = `haiku`.
- Dokumente auf Deutsch (Schweizer Schreibweise „ss", kein „ß"); kein `\n` in Mermaid-Labels.
- Commits mit Präfix `feat:`/`fix:`/`docs:`/`refactor:`/`test:`/`chore:` und den Zeilen
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` und
  `Claude-Session: https://claude.ai/code/session_01F8xVXpsyDZS295tvnaTppM`.
- Arbeitsverzeichnis: Worktree `/Users/KN/CAS/projekte/anno-clone/.worktrees/studio`, Branch `feat/studio`.

## Review Focus

1. Hook bekommt kaputtes oder unvollständiges JSON (kein Objekt, fehlende Felder, `tool_response` als String) → Exit 0, keine Ausnahme, keine Zeile. Test in Task 1 (`test_main_survives_garbage`, `test_spawned_needs_dict_response`).
2. Zwei parallele Spawns gleichen Typs von verschiedenen Eltern → jedes Kind beim richtigen Elternteil. Test in Task 2 (`test_parallel_same_type_spawned_corrects_parent`).
3. `events.jsonl` enthält eine kaputte oder halb geschriebene Zeile → übersprungen, Dashboard läuft weiter. Test in Task 2 (`test_event_store_skips_corrupt_and_partial`).
4. Event-Texte mit HTML (`<img src=x onerror=alert(1)>`) → im Dashboard als Text sichtbar, nicht ausgeführt. Prüfung in Task 4 (Fixture + Screenshot).
5. `events.jsonl` wird archiviert/ersetzt, während der Server läuft → Store liest neu, kein Absturz. Test in Task 2 (`test_event_store_resets_on_replace`).

---

### Task 1: Telemetrie-Schreibseite (paths, log, hook) und Repo-Einbindung

**Files:**

- Create: `tools/studio/paths.py`, `tools/studio/log.py`, `tools/studio/hook.py`
- Create: `tools/studio/tests/__init__.py` (leer), `tools/studio/tests/test_paths.py`, `tools/studio/tests/test_log.py`, `tools/studio/tests/test_hook.py`
- Create: `.claude/settings.json`
- Modify: `.gitignore`, `.prettierignore`, `eslint.config.js` (ignores), `Makefile` (studio-test, check, help-Breite)

**Interfaces:**

- Produces: `paths.repo_root(start: Path | None = None) -> Path`, `paths.studio_home() -> Path`, `paths.events_file() -> Path`, `paths.agents_dir() -> Path`, `paths.now_iso() -> str`, `paths.append_event(event: dict) -> None`; `log.main(argv: list[str] | None = None) -> int`, `log.STATUSES`, `log.PACKAGE_STATUSES`; `hook.to_event(payload: dict) -> dict | None`, `hook.main() -> int`, `hook.START_CONTEXT`.

- [ ] **Step 1: Tests schreiben**

`tools/studio/tests/test_paths.py`:

```python
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import paths


class RepoRootTest(unittest.TestCase):
    def test_plain_repo(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp).resolve()
            (root / ".git").mkdir()
            (root / "tools" / "studio").mkdir(parents=True)
            self.assertEqual(paths.repo_root(root / "tools" / "studio" / "x.py"), root)

    def test_worktree_resolves_to_main_repo(self):
        with tempfile.TemporaryDirectory() as tmp:
            main = Path(tmp).resolve() / "main"
            gitdir = main / ".git" / "worktrees" / "wt"
            gitdir.mkdir(parents=True)
            (gitdir / "commondir").write_text("../..\n", encoding="utf-8")
            wt = main / ".worktrees" / "wt"
            (wt / "tools").mkdir(parents=True)
            (wt / ".git").write_text(f"gitdir: {gitdir}\n", encoding="utf-8")
            self.assertEqual(paths.repo_root(wt / "tools" / "hook.py"), main)

    def test_studio_home_env_override(self):
        with mock.patch.dict(os.environ, {"STUDIO_HOME": "/tmp/xyz-studio"}):
            self.assertEqual(paths.studio_home(), Path("/tmp/xyz-studio"))
            self.assertEqual(paths.events_file(), Path("/tmp/xyz-studio/events.jsonl"))

    def test_append_event_writes_one_json_line(self):
        with tempfile.TemporaryDirectory() as tmp:
            with mock.patch.dict(os.environ, {"STUDIO_HOME": tmp}):
                paths.append_event({"kind": "status", "task": "ä"})
                paths.append_event({"kind": "status"})
                lines = (Path(tmp) / "events.jsonl").read_text("utf-8").splitlines()
        self.assertEqual(len(lines), 2)
        self.assertIn('"task":"ä"', lines[0])

    def test_now_iso_is_utc_millis(self):
        self.assertRegex(paths.now_iso(), r"^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$")


if __name__ == "__main__":
    unittest.main()
```

`tools/studio/tests/test_log.py`:

```python
import io
import json
import os
import tempfile
import unittest
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from unittest import mock

import log


class LogTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        env = {"STUDIO_HOME": self.tmp.name, "CLAUDE_CODE_SESSION_ID": "s-1"}
        self.env = mock.patch.dict(os.environ, env)
        self.env.start()

    def tearDown(self):
        self.env.stop()
        self.tmp.cleanup()

    def run_log(self, *argv):
        out, err = io.StringIO(), io.StringIO()
        with redirect_stdout(out), redirect_stderr(err):
            try:
                code = log.main(list(argv))
            except SystemExit as exc:
                code = exc.code
        return code, out.getvalue(), err.getvalue()

    def events(self):
        path = Path(self.tmp.name) / "events.jsonl"
        if not path.exists():
            return []
        return [json.loads(x) for x in path.read_text("utf-8").splitlines()]

    def test_status_event(self):
        code, _, _ = self.run_log(
            "status", "--role", "lead-qa", "--status", "active",
            "--task", "Probelauf", "--package", "P-1",
        )
        self.assertEqual(code, 0)
        ev = self.events()[0]
        self.assertEqual(ev["kind"], "status")
        self.assertEqual(ev["source"], "log")
        self.assertEqual(ev["session_id"], "s-1")
        self.assertEqual(ev["role"], "lead-qa")
        self.assertEqual(ev["status"], "active")
        self.assertEqual(ev["task"], "Probelauf")
        self.assertEqual(ev["package"], "P-1")
        self.assertEqual(ev["agent_id"], "")
        self.assertIn("ts", ev)

    def test_invalid_status_exits_2(self):
        code, _, _ = self.run_log("status", "--role", "x", "--status", "busy")
        self.assertEqual(code, 2)
        self.assertEqual(self.events(), [])

    def test_session_defaults_to_manual(self):
        with mock.patch.dict(os.environ, {}, clear=False):
            os.environ.pop("CLAUDE_CODE_SESSION_ID")
            self.run_log("status", "--role", "lead-qa", "--status", "idle")
        self.assertEqual(self.events()[0]["session_id"], "manual")

    def test_budget_event(self):
        self.run_log(
            "budget", "--lead", "lead-qa", "--grant", "4",
            "--parallel", "2", "--phase", "Probelauf",
        )
        ev = self.events()[0]
        self.assertEqual(ev["kind"], "budget")
        self.assertEqual(ev["role"], "lead-qa")
        self.assertEqual(ev["budget"], {"granted": 4, "parallel": 2, "phase": "Probelauf"})

    def test_package_event_splits_blocked_by(self):
        self.run_log(
            "package", "--id", "M5-T2", "--title", "Speichern v2",
            "--owner", "lead-tech", "--status", "blocked",
            "--blocked-by", "M5-T1, M5-T0", "--milestone", "M5",
        )
        ev = self.events()[0]
        self.assertEqual(ev["blocked_by"], ["M5-T1", "M5-T0"])
        self.assertEqual(ev["status"], "blocked")

    def test_package_rejects_unknown_status(self):
        code, _, _ = self.run_log(
            "package", "--id", "A", "--title", "t", "--owner", "o", "--status", "x"
        )
        self.assertEqual(code, 2)

    def test_decision_open_and_resolved(self):
        self.run_log(
            "decision", "--id", "D-1", "--for", "user",
            "--question", "Neue Dependency?", "--recommendation", "Nein",
            "--from", "lead-tech",
        )
        self.run_log("decision", "--id", "D-1", "--resolution", "Abgelehnt")
        first, second = self.events()
        self.assertEqual(first["for"], "user")
        self.assertEqual(first["role"], "lead-tech")
        self.assertEqual(second["resolution"], "Abgelehnt")

    def test_decision_needs_question_or_resolution(self):
        code, _, _ = self.run_log("decision", "--id", "D-2", "--for", "l0")
        self.assertEqual(code, 2)

    def test_archive_moves_file(self):
        self.run_log("status", "--role", "lead-qa", "--status", "idle")
        code, out, _ = self.run_log("archive")
        self.assertEqual(code, 0)
        self.assertFalse((Path(self.tmp.name) / "events.jsonl").exists())
        archived = list((Path(self.tmp.name) / "archive").glob("events-*.jsonl"))
        self.assertEqual(len(archived), 1)
        self.assertIn("archiviert", out)

    def test_archive_without_file(self):
        code, out, _ = self.run_log("archive")
        self.assertEqual(code, 0)
        self.assertIn("keine Events", out)


if __name__ == "__main__":
    unittest.main()
```

`tools/studio/tests/test_hook.py`:

```python
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import hook

HOOK = Path(__file__).resolve().parents[1] / "hook.py"


def payload(name, **kw):
    return {"hook_event_name": name, "session_id": "s-1", **kw}


class ToEventTest(unittest.TestCase):
    def test_session_events(self):
        start = hook.to_event(payload("SessionStart", source="startup", model="opus"))
        self.assertEqual(start["kind"], "session_start")
        self.assertEqual(start["agent_id"], "main")
        self.assertEqual(start["model"], "opus")
        end = hook.to_event(payload("SessionEnd", reason="other"))
        self.assertEqual((end["kind"], end["status"]), ("session_end", "ended"))

    def test_prompt_and_turn_end(self):
        ev = hook.to_event(payload("UserPromptSubmit", prompt="Baue M5\nmehr Text"))
        self.assertEqual((ev["kind"], ev["status"], ev["task"]), ("prompt", "active", "Baue M5"))
        note = hook.to_event(payload("UserPromptSubmit", prompt="<task-notification>x"))
        self.assertEqual(note["task"], "Meldung eines Agenten")
        stop = hook.to_event(payload("Stop", last_assistant_message="fertig"))
        self.assertEqual((stop["kind"], stop["status"], stop["summary"]), ("turn_end", "idle", "fertig"))

    def test_subagent_start_stop(self):
        start = hook.to_event(payload("SubagentStart", agent_id="a1", agent_type="lead-qa"))
        self.assertEqual((start["kind"], start["agent_id"], start["role"]), ("agent_start", "a1", "lead-qa"))
        stop = hook.to_event(
            payload("SubagentStop", agent_id="a1", agent_type="lead-qa", last_assistant_message="x" * 900)
        )
        self.assertEqual(stop["kind"], "agent_stop")
        self.assertLessEqual(len(stop["summary"]), 601)

    def test_spawn_parses_persona_and_package(self):
        prompt = "Persona: `design-genre-researcher`\nPaket: M5-R1\n" + "y" * 1000
        ev = hook.to_event(
            payload(
                "PreToolUse", agent_id="a1", agent_type="lead-design", tool_name="Agent",
                tool_use_id="t1",
                tool_input={"description": "Recherche", "prompt": prompt, "model": "sonnet"},
            )
        )
        self.assertEqual(ev["kind"], "spawn")
        self.assertEqual(ev["subagent_type"], "general-purpose")
        self.assertEqual(ev["persona"], "design-genre-researcher")
        self.assertEqual(ev["package"], "M5-R1")
        self.assertEqual(ev["model"], "sonnet")
        self.assertLessEqual(len(ev["prompt_head"]), 401)

    def test_bind_from_log_call(self):
        cmd = 'python3 tools/studio/log.py status --role qa-playtester --status active --package "P 1"'
        ev = hook.to_event(
            payload("PreToolUse", agent_id="a2", agent_type="qa-playtester", tool_name="Bash",
                    tool_input={"command": cmd})
        )
        self.assertEqual((ev["kind"], ev["role"], ev["package"]), ("bind", "qa-playtester", "P 1"))

    def test_heartbeat(self):
        ev = hook.to_event(payload("PreToolUse", agent_id="a2", tool_name="Read", tool_input={}))
        self.assertEqual((ev["kind"], ev["tool"]), ("heartbeat", "Read"))

    def test_spawned_needs_dict_response(self):
        ok = hook.to_event(
            payload("PostToolUse", agent_id="a1", tool_name="Agent", tool_input={},
                    tool_response={"agentId": "c9", "status": "completed"})
        )
        self.assertEqual((ok["kind"], ok["child_id"]), ("spawned", "c9"))
        self.assertIsNone(
            hook.to_event(payload("PostToolUse", tool_name="Agent", tool_response="text"))
        )

    def test_unknown_event_ignored(self):
        self.assertIsNone(hook.to_event(payload("Notification", message="x")))


class MainTest(unittest.TestCase):
    def run_hook(self, stdin):
        with tempfile.TemporaryDirectory() as tmp:
            env = {**os.environ, "STUDIO_HOME": tmp}
            proc = subprocess.run(
                [sys.executable, str(HOOK)], input=stdin, env=env,
                capture_output=True, text=True, timeout=10,
            )
            path = Path(tmp) / "events.jsonl"
            lines = path.read_text("utf-8").splitlines() if path.exists() else []
        return proc, lines

    def test_main_survives_garbage(self):
        for stdin in ["", "nicht json", "[1,2]", '{"hook_event_name": 5}']:
            proc, lines = self.run_hook(stdin)
            self.assertEqual(proc.returncode, 0, stdin)
            self.assertEqual(proc.stdout, "", stdin)
            self.assertEqual(lines, [], stdin)

    def test_session_start_emits_context(self):
        proc, lines = self.run_hook(json.dumps(payload("SessionStart", source="startup")))
        self.assertEqual(proc.returncode, 0)
        out = json.loads(proc.stdout)
        self.assertEqual(out["hookSpecificOutput"]["hookEventName"], "SessionStart")
        self.assertIn("STUDIO.md", out["hookSpecificOutput"]["additionalContext"])
        self.assertEqual(len(lines), 1)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Tests laufen lassen, Fehlschlag prüfen**

Run: `python3 -m unittest discover -s tools/studio/tests -t tools/studio`
Expected: FAIL/ERROR (`ModuleNotFoundError: No module named 'paths'` o. ä.)

- [ ] **Step 3: `tools/studio/paths.py` schreiben**

```python
"""Pfade des Studios: Hauptrepo-Wurzel (auch aus Worktrees) und .studio-Dateien."""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from pathlib import Path


def repo_root(start: Path | None = None) -> Path:
    """Wurzel des Hauptrepos; aus einem Worktree über .git-Datei und commondir."""
    here = (start or Path(__file__)).resolve()
    for folder in [here, *here.parents]:
        git = folder / ".git"
        if git.is_dir():
            return folder
        if git.is_file():
            text = git.read_text(encoding="utf-8").strip()
            if not text.startswith("gitdir:"):
                return folder
            gitdir = Path(text.split(":", 1)[1].strip())
            if not gitdir.is_absolute():
                gitdir = (folder / gitdir).resolve()
            common = gitdir / "commondir"
            if common.is_file():
                target = Path(common.read_text(encoding="utf-8").strip())
                if not target.is_absolute():
                    target = (gitdir / target).resolve()
                return target.parent
            return folder
    return here.parent


def studio_home() -> Path:
    override = os.environ.get("STUDIO_HOME")
    return Path(override) if override else repo_root() / ".studio"


def events_file() -> Path:
    return studio_home() / "events.jsonl"


def agents_dir() -> Path:
    return repo_root() / ".claude" / "agents"


def now_iso() -> str:
    stamp = datetime.now(timezone.utc).isoformat(timespec="milliseconds")
    return stamp.replace("+00:00", "Z")


def append_event(event: dict) -> None:
    """Hängt ein Event als eine JSON-Zeile an (ein write-Aufruf, append-only)."""
    path = events_file()
    path.parent.mkdir(parents=True, exist_ok=True)
    line = json.dumps(event, ensure_ascii=False, separators=(",", ":")) + "\n"
    with open(path, "a", encoding="utf-8") as handle:
        handle.write(line)


if __name__ == "__main__":
    print(studio_home())
```

- [ ] **Step 4: `tools/studio/log.py` schreiben**

```python
"""Explizite Studio-Events: python3 tools/studio/log.py <art> [optionen].

Aufrufe stehen in docs/studio/STUDIO.md (Abschnitt Logging-Pflicht).
"""

from __future__ import annotations

import argparse
import os
import sys
from datetime import datetime

from paths import append_event, events_file, now_iso, studio_home

STATUSES = ("active", "delegated", "waiting", "blocked", "idle", "done", "failed", "ended")
PACKAGE_STATUSES = ("open", "active", "review", "blocked", "done")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="log.py", description="Studio-Events schreiben")
    sub = parser.add_subparsers(dest="kind", required=True)

    status = sub.add_parser("status", help="Statuswechsel eines Agenten")
    status.add_argument("--role", required=True)
    status.add_argument("--status", required=True, choices=STATUSES)
    status.add_argument("--task", default="")
    status.add_argument("--summary", default="")
    status.add_argument("--package", default="")

    budget = sub.add_parser("budget", help="Budgetfreigabe durch L0")
    budget.add_argument("--lead", required=True)
    budget.add_argument("--grant", required=True, type=int)
    budget.add_argument("--parallel", type=int, default=0)
    budget.add_argument("--phase", default="Standard")

    package = sub.add_parser("package", help="Paket auf dem Meilenstein-Board")
    package.add_argument("--id", required=True)
    package.add_argument("--title", required=True)
    package.add_argument("--owner", required=True)
    package.add_argument("--status", required=True, choices=PACKAGE_STATUSES)
    package.add_argument("--blocked-by", default="")
    package.add_argument("--milestone", default="")

    decision = sub.add_parser("decision", help="Offene oder gelöste Entscheidung")
    decision.add_argument("--id", required=True)
    decision.add_argument("--for", dest="target", choices=("l0", "user"))
    decision.add_argument("--question", default="")
    decision.add_argument("--recommendation", default="")
    decision.add_argument("--from", dest="source_role", default="")
    decision.add_argument("--resolution", default="")

    sub.add_parser("archive", help="events.jsonl archivieren (Dashboard startet leer)")
    return parser


def make_event(args: argparse.Namespace) -> dict:
    event = {
        "ts": now_iso(),
        "session_id": os.environ.get("CLAUDE_CODE_SESSION_ID", "manual"),
        "agent_id": "",
        "source": "log",
        "kind": args.kind,
    }
    if args.kind == "status":
        event.update(
            role=args.role, status=args.status, task=args.task,
            summary=args.summary, package=args.package,
        )
    elif args.kind == "budget":
        event.update(
            role=args.lead,
            budget={"granted": args.grant, "parallel": args.parallel, "phase": args.phase},
        )
    elif args.kind == "package":
        blocked = [x.strip() for x in args.blocked_by.split(",") if x.strip()]
        event.update(
            package=args.id, title=args.title, owner=args.owner, status=args.status,
            blocked_by=blocked, milestone=args.milestone,
        )
    elif args.kind == "decision":
        event.update(decision_id=args.id, role=args.source_role)
        if args.resolution:
            event["resolution"] = args.resolution
        else:
            event.update(
                {"for": args.target, "question": args.question,
                 "recommendation": args.recommendation}
            )
    return event


def archive() -> int:
    source = events_file()
    if not source.exists():
        print("studio-log: keine Events zum Archivieren")
        return 0
    target_dir = studio_home() / "archive"
    target_dir.mkdir(parents=True, exist_ok=True)
    target = target_dir / f"events-{datetime.now():%Y%m%d-%H%M%S}.jsonl"
    source.rename(target)
    print(f"studio-log: archiviert nach {target}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.kind == "archive":
        return archive()
    if args.kind == "decision" and not args.resolution:
        if not (args.target and args.question):
            parser.error("decision braucht --for und --question oder --resolution")
    append_event(make_event(args))
    print(f"studio-log: {args.kind} geschrieben")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

- [ ] **Step 5: `tools/studio/hook.py` schreiben**

```python
"""Claude-Code-Hook: übersetzt Hook-Payloads in Studio-Events.

Wirft nie und blockiert nie; Fehler enden still mit Exit 0.
"""

from __future__ import annotations

import json
import shlex
import sys

from paths import append_event, now_iso

PROMPT_HEAD = 400
MESSAGE_MAX = 600
TASK_MAX = 120
LOG_MARK = "tools/studio/log.py"
AGENT_TOOLS = ("Agent", "Task")
START_CONTEXT = (
    "Studio-Modus: Diese Hauptsession ist der Studio-Direktor (L0) nach "
    "docs/studio/STUDIO.md. Lies docs/studio/STUDIO.md und docs/studio/state.md; "
    "Dashboard mit `make studio` starten und die URL nennen."
)


def cut(text: object, limit: int) -> str:
    if not isinstance(text, str):
        return ""
    return text if len(text) <= limit else text[:limit] + "…"


def header_value(text: str, key: str) -> str:
    """Wert einer Kopfzeile wie 'Persona: x' oder '- **Paket:** M5-T1'."""
    for raw in text.splitlines():
        line = raw.strip().lstrip("-*#> ").replace("**", "").strip()
        name, sep, value = line.partition(":")
        if sep and name.strip().lower() == key.lower():
            words = value.strip().strip("`").split()
            return words[0].strip("`") if words else ""
    return ""


def log_args(command: str) -> dict:
    try:
        words = shlex.split(command)
    except ValueError:
        return {"role": "", "package": ""}
    found = {"role": "", "package": ""}
    for index, word in enumerate(words[:-1]):
        if word in ("--role", "--package"):
            found[word[2:]] = words[index + 1]
    return found


def to_event(p: dict) -> dict | None:
    name = p.get("hook_event_name")
    event = {
        "ts": now_iso(),
        "session_id": str(p.get("session_id") or ""),
        "agent_id": str(p.get("agent_id") or "main"),
        "source": "hook",
    }
    if p.get("agent_type"):
        event["role"] = str(p["agent_type"])
    tool = p.get("tool_name", "")
    tool_input = p.get("tool_input") if isinstance(p.get("tool_input"), dict) else {}

    if name == "SessionStart":
        event.update(kind="session_start", status="idle", model=str(p.get("model") or ""))
    elif name == "SessionEnd":
        event.update(kind="session_end", status="ended", summary=str(p.get("reason") or ""))
    elif name == "UserPromptSubmit":
        prompt = p.get("prompt") if isinstance(p.get("prompt"), str) else ""
        if prompt.startswith("<task-notification>"):
            task = "Meldung eines Agenten"
        else:
            task = cut(prompt.strip().split("\n", 1)[0], TASK_MAX)
        event.update(kind="prompt", status="active", task=task)
    elif name == "Stop":
        event.update(
            kind="turn_end", status="idle",
            summary=cut(p.get("last_assistant_message"), MESSAGE_MAX),
        )
    elif name == "SubagentStart":
        event.update(kind="agent_start", status="active")
    elif name == "SubagentStop":
        event.update(
            kind="agent_stop", status="done",
            summary=cut(p.get("last_assistant_message"), MESSAGE_MAX),
        )
    elif name == "PreToolUse" and tool in AGENT_TOOLS:
        prompt = tool_input.get("prompt") if isinstance(tool_input.get("prompt"), str) else ""
        event.update(
            kind="spawn",
            subagent_type=str(tool_input.get("subagent_type") or "general-purpose"),
            description=cut(tool_input.get("description"), TASK_MAX),
            prompt_head=cut(prompt, PROMPT_HEAD),
            persona=header_value(prompt, "Persona"),
            package=header_value(prompt, "Paket"),
            model=str(tool_input.get("model") or ""),
            tool_use_id=str(p.get("tool_use_id") or ""),
            background=bool(tool_input.get("run_in_background")),
        )
    elif name == "PreToolUse" and tool == "Bash" and LOG_MARK in str(tool_input.get("command", "")):
        event.update(kind="bind", **log_args(str(tool_input["command"])))
    elif name == "PreToolUse":
        event.update(kind="heartbeat", tool=str(tool))
    elif name == "PostToolUse" and tool in AGENT_TOOLS:
        response = p.get("tool_response")
        child = response.get("agentId") if isinstance(response, dict) else None
        if not child:
            return None
        event.update(kind="spawned", child_id=str(child), tool_use_id=str(p.get("tool_use_id") or ""))
    else:
        return None
    return event


def main() -> int:
    try:
        payload = json.loads(sys.stdin.read() or "null")
        if not isinstance(payload, dict) or not isinstance(payload.get("hook_event_name"), str):
            return 0
        event = to_event(payload)
        if event:
            append_event(event)
        if payload["hook_event_name"] == "SessionStart":
            output = {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": START_CONTEXT,
                }
            }
            print(json.dumps(output, ensure_ascii=False))
    except Exception:  # noqa: BLE001 — ein Hook darf die Session nie stören
        return 0
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

Hinweis: Zeilen über 88 Zeichen mit `uvx ruff format tools/studio` umbrechen lassen; die Tests selbst ebenfalls formatieren.

- [ ] **Step 6: Tests laufen lassen**

Run: `python3 -m unittest discover -s tools/studio/tests -t tools/studio -v`
Expected: alle Tests OK.

- [ ] **Step 7: Hooks registrieren — `.claude/settings.json`**

```json
{
  "hooks": {
    "SessionStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/tools/studio/hook.py\"",
            "timeout": 5
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/tools/studio/hook.py\"",
            "timeout": 5
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/tools/studio/hook.py\"",
            "timeout": 5
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/tools/studio/hook.py\"",
            "timeout": 5
          }
        ]
      }
    ],
    "SubagentStart": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/tools/studio/hook.py\"",
            "timeout": 5
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/tools/studio/hook.py\"",
            "timeout": 5
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/tools/studio/hook.py\"",
            "timeout": 5
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Agent|Task",
        "hooks": [
          {
            "type": "command",
            "command": "python3 \"$CLAUDE_PROJECT_DIR/tools/studio/hook.py\"",
            "timeout": 5
          }
        ]
      }
    ]
  }
}
```

Danach `npx prettier --write .claude/settings.json` und prüfen: `python3 -c "import json;json.load(open('.claude/settings.json'))"`.

- [ ] **Step 8: Ignore-Dateien, ESLint, Makefile**

`.gitignore`: Zeile `node_modules/` durch `node_modules` ersetzen (deckt den Symlink im Worktree ab) und am Ende ergänzen:

```
.studio/
.worktrees/
__pycache__/
```

`.prettierignore` ergänzen: `.studio`, `.worktrees`.

`eslint.config.js`: `ignores` wird zu `['dist/**', 'node_modules/**', 'coverage/**', '.studio/**', '.worktrees/**']`.

`Makefile`: `.PHONY` um `studio-test` erweitern; im `help`-Ziel `%-10s` → `%-16s`; neues Ziel und `check` anpassen:

```make
studio-test: ## Tests der Studio-Werkzeuge (Python unittest)
	python3 -m unittest discover -s tools/studio/tests -t tools/studio

check: lint test studio-test build ## Gleich wie CI: lint, test, studio-test, build
```

- [ ] **Step 9: Gesamtprüfung**

Run: `make check && uvx ruff check tools/studio && uvx ruff format --check tools/studio`
Expected: alles grün; `npm test` weiterhin 112 Tests.

- [ ] **Step 10: Commit**

```bash
git add tools/studio .claude/settings.json .gitignore .prettierignore eslint.config.js Makefile
git commit -m "feat: Studio-Telemetrie Schreibseite — Hook, Log-CLI, Pfade"
```

---

### Task 2: Zustandsmodell (`model.py`)

**Files:**

- Create: `tools/studio/model.py`
- Test: `tools/studio/tests/test_model.py`

**Interfaces:**

- Consumes: Event-Felder aus Task 1 (`kind`, `ts`, `session_id`, `agent_id`, `role`, `status`, `task`, `summary`, `package`, `subagent_type`, `persona`, `model`, `description`, `child_id`, `budget`, `title`, `owner`, `blocked_by`, `milestone`, `decision_id`, `for`, `question`, `recommendation`, `resolution`, `tool`, `source`).
- Produces: `model.build_state(events: list[dict], now: float, agent_models: dict[str, str], session: str | None = None, inactive_after: float = 300.0) -> dict`, `model.read_agent_models(agents_dir: Path) -> dict[str, str]`, `model.EventStore(path: Path).events() -> list[dict]`, `model.classify(role: str) -> tuple[int, str]`, `model.parse_ts(value) -> float`.
- Rückgabe von `build_state` (Task 3/4 verlassen sich darauf):

```text
{
  "now": float,
  "session": str | "all" | None,          # gewählte Session
  "sessions": [{"id", "started", "last", "ended"}],   # neueste zuerst (Zeiten float)
  "tree": [node],                         # je Session in Sicht ein L0-Wurzelknoten
  "counts": {status: int, ..., "inactive": int},
  "chronicle": [{"ts", "t", "session_id", "department", "role", "text"}],  # neueste oben
  "budgets": [{"lead", "phase", "granted", "parallel", "used", "parallel_used",
               "overrun", "model_mix": {model: int}}],
  "board": [{"id", "title", "owner", "status", "blocked_by", "blocks", "milestone", "ts"}],
  "decisions": [{"id", "for", "question", "recommendation", "from", "ts"}],  # nur offene
  "feed": [{"ts", "t", "session_id", "role", "department", "kind", "status", "text"}],
  "pulse": [{"minute": "HH:MM", "total": int, "by": {department: int}}],       # 60 Einträge
  "departments": ["studio", "production", "design", "tech", "art", "qa", "extern"]
}
node = {"key", "session_id", "agent_id", "role", "persona", "level", "department", "model",
        "status", "inactive", "task", "summary", "package", "started", "stopped",
        "last_seen", "idle_seconds", "children": [node]}
```

- [ ] **Step 1: Tests schreiben — `tools/studio/tests/test_model.py`**

```python
import json
import os
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

import model

T0 = datetime(2026, 9, 30, 12, 0, tzinfo=timezone.utc).timestamp()
MODELS = {"lead-qa": "opus", "qa-code-reviewer": "sonnet", "qa-playtester": "sonnet",
          "lead-tech": "opus", "tech-sim-engineer": "sonnet"}


def ts(offset):
    stamp = datetime.fromtimestamp(T0 + offset, timezone.utc).isoformat(timespec="milliseconds")
    return stamp.replace("+00:00", "Z")


def ev(kind, t, agent_id="main", session="s1", **kw):
    return {"kind": kind, "ts": ts(t), "session_id": session, "agent_id": agent_id,
            "source": kw.pop("source", "hook"), **kw}


def spawn(t, parent, typ, **kw):
    return ev("spawn", t, agent_id=parent, subagent_type=typ, **kw)


def start(t, aid, typ, **kw):
    return ev("agent_start", t, agent_id=aid, role=typ, status="active", **kw)


def stop(t, aid, typ, summary="", **kw):
    return ev("agent_stop", t, agent_id=aid, role=typ, status="done", summary=summary, **kw)


def log_status(t, role, status, session="s1", **kw):
    return ev("status", t, agent_id="", session=session, role=role, status=status,
              source="log", **kw)


def flat(state):
    out = {}

    def walk(node):
        out[node["key"]] = node
        for child in node["children"]:
            walk(child)

    for root in state["tree"]:
        walk(root)
    return out


def build(events, now=None, **kw):
    return model.build_state(events, T0 + (now if now is not None else 100), MODELS, **kw)


class TreeTest(unittest.TestCase):
    def base(self):
        return [
            ev("session_start", 0, status="idle"),
            ev("prompt", 1, status="active", task="Probelauf"),
            spawn(2, "main", "lead-qa", description="QA-Lauf"),
            start(3, "a1", "lead-qa"),
            spawn(4, "a1", "qa-code-reviewer", description="Datei lesen", package="P-1"),
            start(5, "b1", "qa-code-reviewer"),
        ]

    def test_nested_tree_levels_and_delegated(self):
        nodes = flat(build(self.base()))
        main, lead, worker = nodes["s1:main"], nodes["s1:a1"], nodes["s1:b1"]
        self.assertEqual([c["key"] for c in main["children"]], ["s1:a1"])
        self.assertEqual([c["key"] for c in lead["children"]], ["s1:b1"])
        self.assertEqual((main["level"], lead["level"], worker["level"]), (0, 1, 2))
        self.assertEqual((lead["department"], worker["department"]), ("qa", "qa"))
        self.assertEqual(lead["status"], "delegated")
        self.assertEqual(worker["status"], "active")
        self.assertEqual(worker["task"], "Datei lesen")
        self.assertEqual(worker["package"], "P-1")
        self.assertEqual(worker["model"], "sonnet")
        self.assertEqual(main["role"], "studio-director")

    def test_spawn_model_overrides_frontmatter(self):
        events = self.base()
        events[4]["model"] = "haiku"
        self.assertEqual(flat(build(events))["s1:b1"]["model"], "haiku")

    def test_parallel_same_type_spawned_corrects_parent(self):
        events = [
            spawn(1, "main", "lead-qa"), start(2, "L1", "lead-qa"),
            spawn(3, "main", "lead-tech"), start(4, "L2", "lead-tech"),
            spawn(5, "L2", "tech-sim-engineer"), spawn(6, "L1", "tech-sim-engineer"),
            start(7, "W1", "tech-sim-engineer"), start(8, "W2", "tech-sim-engineer"),
            ev("spawned", 9, agent_id="L1", child_id="W1"),
            ev("spawned", 10, agent_id="L2", child_id="W2"),
        ]
        nodes = flat(build(events))
        self.assertEqual([c["key"] for c in nodes["s1:L1"]["children"]], ["s1:W1"])
        self.assertEqual([c["key"] for c in nodes["s1:L2"]["children"]], ["s1:W2"])

    def test_spawned_before_start(self):
        events = [
            spawn(1, "main", "lead-qa"), start(2, "L1", "lead-qa"),
            spawn(3, "L1", "qa-playtester"),
            ev("spawned", 4, agent_id="L1", child_id="W1"),
            start(4.1, "W1", "qa-playtester"),
        ]
        nodes = flat(build(events))
        self.assertEqual(nodes["s1:W1"]["role"], "qa-playtester")
        self.assertEqual([c["key"] for c in nodes["s1:L1"]["children"]], ["s1:W1"])

    def test_persona_line_sets_role(self):
        events = [
            spawn(1, "main", "general-purpose", persona="design-genre-researcher"),
            start(2, "g1", "general-purpose"),
        ]
        node = flat(build(events))["s1:g1"]
        self.assertEqual((node["role"], node["level"], node["department"]),
                         ("design-genre-researcher", 2, "design"))

    def test_unknown_role_is_extern(self):
        node = flat(build([start(1, "x1", "Explore")]))["s1:x1"]
        self.assertEqual((node["level"], node["department"]), (2, "extern"))


class StatusTest(unittest.TestCase):
    def test_stop_done_and_chronicle(self):
        state = build([spawn(1, "main", "lead-qa"), start(2, "a1", "lead-qa"),
                       stop(3, "a1", "lead-qa", summary="Alles geprüft")])
        self.assertEqual(flat(state)["s1:a1"]["status"], "done")
        self.assertEqual(state["chronicle"][0]["text"], "Alles geprüft")
        self.assertEqual(state["chronicle"][0]["department"], "qa")

    def test_failed_survives_stop(self):
        events = [start(1, "a1", "lead-qa"), log_status(2, "lead-qa", "failed"),
                  stop(3, "a1", "lead-qa")]
        self.assertEqual(flat(build(events))["s1:a1"]["status"], "failed")

    def test_turn_end_sets_main_idle(self):
        events = [ev("prompt", 1, status="active"), ev("turn_end", 2, status="idle")]
        self.assertEqual(flat(build(events))["s1:main"]["status"], "idle")

    def test_session_end_marks_ended(self):
        events = [start(1, "a1", "lead-qa"), ev("session_end", 2, status="ended")]
        nodes = flat(build(events))
        self.assertEqual(nodes["s1:a1"]["status"], "ended")
        self.assertEqual(nodes["s1:main"]["status"], "ended")

    def test_inactive_rules(self):
        events = [
            ev("turn_end", 0, status="idle"),
            spawn(1, "main", "lead-qa"), start(2, "a1", "lead-qa"),
            spawn(3, "a1", "qa-playtester"), start(4, "b1", "qa-playtester"),
            ev("heartbeat", 5, agent_id="b1", tool="Bash"),
        ]
        state = build(events, now=5 + 301)
        nodes = flat(state)
        self.assertTrue(nodes["s1:b1"]["inactive"])
        self.assertFalse(nodes["s1:a1"]["inactive"])  # hat aktives Kind
        self.assertFalse(nodes["s1:main"]["inactive"])  # idle
        self.assertEqual(state["counts"]["inactive"], 1)
        self.assertFalse(flat(build(events, now=5 + 299))["s1:b1"]["inactive"])

    def test_status_via_bind(self):
        events = [
            start(1, "r1", "qa-code-reviewer"), start(2, "r2", "qa-code-reviewer"),
            ev("bind", 10, agent_id="r1", role="qa-code-reviewer", package=""),
            log_status(10.5, "qa-code-reviewer", "blocked", task="wartet"),
        ]
        nodes = flat(build(events))
        self.assertEqual(nodes["s1:r1"]["status"], "blocked")
        self.assertEqual(nodes["s1:r2"]["status"], "active")

    def test_status_without_bind_prefers_package(self):
        events = [
            spawn(1, "main", "tech-sim-engineer", package="A"), start(2, "w1", "tech-sim-engineer"),
            spawn(3, "main", "tech-sim-engineer", package="B"), start(4, "w2", "tech-sim-engineer"),
            log_status(5, "tech-sim-engineer", "waiting", package="A"),
        ]
        nodes = flat(build(events))
        self.assertEqual(nodes["s1:w1"]["status"], "waiting")
        self.assertEqual(nodes["s1:w2"]["status"], "active")

    def test_director_status_goes_to_main(self):
        events = [log_status(1, "studio-director", "waiting", task="Gate Spec")]
        self.assertEqual(flat(build(events))["s1:main"]["task"], "Gate Spec")

    def test_explicit_done_summary_kept_and_not_duplicated(self):
        events = [
            start(1, "a1", "lead-qa"),
            log_status(2, "lead-qa", "done", summary="Kurzbericht"),
            stop(3, "a1", "lead-qa", summary="lange Schlussnachricht"),
        ]
        state = build(events)
        self.assertEqual(flat(state)["s1:a1"]["summary"], "Kurzbericht")
        self.assertEqual([c["text"] for c in state["chronicle"]], ["Kurzbericht"])

    def test_log_without_agent_creates_node(self):
        nodes = flat(build([log_status(1, "lead-design", "active", task="Recherche")]))
        node = next(n for n in nodes.values() if n["role"] == "lead-design")
        self.assertEqual((node["level"], node["task"]), (1, "Recherche"))


class BudgetBoardDecisionTest(unittest.TestCase):
    def grant(self, t, lead, granted, parallel, phase="P1"):
        return ev("budget", t, agent_id="", role=lead, source="log",
                  budget={"granted": granted, "parallel": parallel, "phase": phase})

    def test_budget_usage_overrun_and_model_mix(self):
        events = [
            self.grant(0, "lead-qa", 1, 1),
            start(1, "a1", "lead-qa"),
            spawn(2, "a1", "qa-code-reviewer"), start(3, "b1", "qa-code-reviewer"),
            spawn(4, "a1", "qa-playtester", model="haiku"), start(5, "b2", "qa-playtester"),
            stop(6, "b1", "qa-code-reviewer"),
        ]
        budget = build(events)["budgets"][0]
        self.assertEqual((budget["lead"], budget["granted"], budget["used"]), ("lead-qa", 1, 2))
        self.assertEqual(budget["parallel_used"], 2)
        self.assertTrue(budget["overrun"])
        self.assertEqual(budget["model_mix"], {"sonnet": 1, "haiku": 1})

    def test_budget_same_phase_adds_new_phase_resets(self):
        events = [
            self.grant(0, "lead-qa", 2, 1), start(1, "a1", "lead-qa"),
            spawn(2, "a1", "qa-playtester"), start(3, "b1", "qa-playtester"),
            stop(4, "b1", "qa-playtester"),
            self.grant(5, "lead-qa", 2, 1),
        ]
        budget = build(events)["budgets"][0]
        self.assertEqual((budget["granted"], budget["used"], budget["overrun"]), (4, 1, False))
        events.append(self.grant(6, "lead-qa", 3, 2, phase="P2"))
        budget = build(events)["budgets"][0]
        self.assertEqual((budget["phase"], budget["granted"], budget["used"]), ("P2", 3, 0))

    def test_starts_without_grant_are_overrun(self):
        events = [start(1, "a1", "lead-tech"), spawn(2, "a1", "tech-sim-engineer"),
                  start(3, "w1", "tech-sim-engineer")]
        budget = build(events)["budgets"][0]
        self.assertEqual((budget["lead"], budget["granted"], budget["overrun"]),
                         ("lead-tech", 0, True))

    def test_board_blocks(self):
        events = [
            ev("package", 1, agent_id="", source="log", package="T1", title="Modell",
               owner="lead-tech", status="active", blocked_by=[], milestone="M5"),
            ev("package", 2, agent_id="", source="log", package="T2", title="UI",
               owner="lead-tech", status="blocked", blocked_by=["T1"], milestone="M5"),
            ev("package", 3, agent_id="", source="log", package="T1", title="Modell",
               owner="lead-tech", status="done", blocked_by=[], milestone="M5"),
        ]
        board = {p["id"]: p for p in build(events)["board"]}
        self.assertEqual(board["T1"]["status"], "done")
        self.assertEqual(board["T1"]["blocks"], ["T2"])
        self.assertEqual(board["T2"]["blocked_by"], ["T1"])

    def test_decisions_open_until_resolved(self):
        events = [
            ev("decision", 1, agent_id="", source="log", decision_id="D1", role="lead-tech",
               question="Dependency?", recommendation="nein", **{"for": "user"}),
            ev("decision", 2, agent_id="", source="log", decision_id="D2", role="lead-qa",
               question="Merge?", recommendation="ja", **{"for": "l0"}),
            ev("decision", 3, agent_id="", source="log", decision_id="D2", role="",
               resolution="gemergt"),
        ]
        decisions = build(events)["decisions"]
        self.assertEqual([(d["id"], d["for"], d["from"]) for d in decisions],
                         [("D1", "user", "lead-tech")])


class ViewTest(unittest.TestCase):
    def test_session_filter_latest_default_and_all(self):
        events = [ev("prompt", 1, session="old", status="active"),
                  ev("prompt", 50, session="new", status="active"),
                  start(51, "n1", "lead-qa", session="new")]
        latest = build(events)
        self.assertEqual(latest["session"], "new")
        self.assertEqual([r["session_id"] for r in latest["tree"]], ["new"])
        self.assertEqual([s["id"] for s in latest["sessions"]], ["new", "old"])
        both = build(events, session="all")
        self.assertEqual(len(both["tree"]), 2)
        only_old = build(events, session="old")
        self.assertEqual([r["session_id"] for r in only_old["tree"]], ["old"])

    def test_feed_newest_first_and_labels(self):
        events = [start(1, "a1", "lead-qa"),
                  ev("heartbeat", 2, agent_id="a1", tool="Read"),
                  log_status(3, "lead-qa", "active", task="Lesen")]
        feed = build(events)["feed"]
        self.assertEqual(feed[0]["kind"], "status")
        self.assertEqual(feed[1]["text"], "Read")
        self.assertEqual(feed[1]["role"], "lead-qa")

    def test_pulse_has_60_minutes_and_counts(self):
        events = [start(1, "a1", "lead-qa"), ev("heartbeat", 2, agent_id="a1", tool="Read")]
        pulse = build(events, now=30)["pulse"]
        self.assertEqual(len(pulse), 60)
        self.assertEqual(pulse[-1]["total"], 2)
        self.assertEqual(pulse[-1]["by"], {"qa": 2})

    def test_output_is_json_serializable(self):
        json.dumps(build([start(1, "a1", "lead-qa")]))


class StoreAndModelsTest(unittest.TestCase):
    def test_event_store_skips_corrupt_and_partial(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "events.jsonl"
            path.write_text('{"kind":"a"}\nkaputt\n[1]\n{"kind":"b"}\n{"kind":"hal', "utf-8")
            store = model.EventStore(path)
            self.assertEqual([e["kind"] for e in store.events()], ["a", "b"])
            with open(path, "a", encoding="utf-8") as handle:
                handle.write('b"}\n')
            self.assertEqual([e["kind"] for e in store.events()], ["a", "b", "halb"])

    def test_event_store_resets_on_replace(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "events.jsonl"
            path.write_text('{"kind":"a"}\n{"kind":"b"}\n', "utf-8")
            store = model.EventStore(path)
            self.assertEqual(len(store.events()), 2)
            os.rename(path, Path(tmp) / "old.jsonl")
            self.assertEqual(store.events(), [])
            path.write_text('{"kind":"c"}\n{"kind":"d"}\n{"kind":"e"}\n', "utf-8")
            self.assertEqual([e["kind"] for e in store.events()], ["c", "d", "e"])

    def test_read_agent_models(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "lead-qa.md").write_text(
                "---\nname: lead-qa\ndescription: x\nmodel: opus\n---\nText\n", "utf-8")
            (folder / "kaputt.md").write_text("kein frontmatter", "utf-8")
            self.assertEqual(model.read_agent_models(folder), {"lead-qa": "opus"})
            self.assertEqual(model.read_agent_models(folder / "fehlt"), {})


if __name__ == "__main__":
    unittest.main()
```

Hinweis zu `test_event_store_resets_on_replace`: nach dem Umbenennen existiert die Datei nicht → leere Liste; die neue Datei hat eine andere Inode → von vorn lesen.

- [ ] **Step 2: Tests laufen lassen, Fehlschlag prüfen**

Run: `python3 -m unittest tools/studio/tests/test_model.py` (aus `tools/studio`: `cd tools/studio && python3 -m unittest tests.test_model`)
Expected: ERROR `No module named 'model'`

- [ ] **Step 3: `tools/studio/model.py` schreiben**

```python
"""Studio-Telemetrie: Events → Zustand fürs Dashboard.

Regeln: docs/superpowers/specs/2026-09-30-studio-design.md, Abschnitt
„Zuordnungsregeln". Bis auf EventStore und read_agent_models reine Funktionen.
"""

from __future__ import annotations

import json
import threading
from collections import Counter
from datetime import datetime
from pathlib import Path

INACTIVE_DEFAULT = 300.0
BIND_WINDOW = 30.0
FEED_SIZE = 80
PULSE_MINUTES = 60
CHRONICLE_SIZE = 200
TEXT_MAX = 160
LIVE = frozenset({"active", "delegated", "waiting", "blocked"})
FINAL = frozenset({"done", "failed", "ended"})
DEPARTMENTS = ("production", "design", "tech", "art", "qa")
DIRECTOR = "studio-director"
PUBLIC = (
    "key", "session_id", "agent_id", "role", "persona", "level", "department", "model",
    "task", "summary", "package", "started", "stopped", "last_seen",
)


def parse_ts(value: object) -> float:
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00")).timestamp()
    except ValueError:
        return 0.0


def classify(role: str) -> tuple[int, str]:
    """Ebene und Bereich aus dem Rollennamen (Namensschema, Spec R11)."""
    if role in ("main", DIRECTOR):
        return 0, "studio"
    if role.startswith("lead-"):
        department = role[len("lead-") :]
        return 1, department if department in DEPARTMENTS else "extern"
    prefix = role.split("-", 1)[0]
    return 2, prefix if prefix in DEPARTMENTS else "extern"


def read_agent_models(agents_dir: Path) -> dict[str, str]:
    """name → model aus der Frontmatter von .claude/agents/*.md."""
    models: dict[str, str] = {}
    if not agents_dir.is_dir():
        return models
    for path in sorted(agents_dir.glob("*.md")):
        lines = path.read_text(encoding="utf-8").splitlines()
        if not lines or lines[0].strip() != "---":
            continue
        meta: dict[str, str] = {}
        for line in lines[1:]:
            if line.strip() == "---":
                break
            key, sep, value = line.partition(":")
            if sep:
                meta[key.strip()] = value.strip()
        if meta.get("name"):
            models[meta["name"]] = meta.get("model") or "inherit"
    return models


class EventStore:
    """Liest events.jsonl inkrementell; kaputte und halbe Zeilen werden übersprungen."""

    def __init__(self, path: Path) -> None:
        self.path = path
        self._offset = 0
        self._inode = None
        self._events: list[dict] = []
        self._lock = threading.Lock()

    def events(self) -> list[dict]:
        with self._lock:
            try:
                info = self.path.stat()
            except OSError:
                self._offset, self._inode, self._events = 0, None, []
                return []
            if info.st_ino != self._inode or info.st_size < self._offset:
                self._offset, self._inode, self._events = 0, info.st_ino, []
            with open(self.path, "rb") as handle:
                handle.seek(self._offset)
                chunk = handle.read()
            end = chunk.rfind(b"\n") + 1
            for raw in chunk[:end].splitlines():
                try:
                    event = json.loads(raw)
                except ValueError:
                    continue
                if isinstance(event, dict):
                    self._events.append(event)
            self._offset += end
            return list(self._events)


def _short(text: object, limit: int = TEXT_MAX) -> str:
    text = " ".join(str(text or "").split())
    return text if len(text) <= limit else text[:limit] + "…"


class _Builder:
    def __init__(self, agent_models: dict[str, str], now: float) -> None:
        self.models = agent_models
        self.now = now
        self.nodes: dict[str, dict] = {}
        self.sessions: dict[str, dict] = {}
        self.pending: dict[str, list[dict]] = {}
        self.binds: dict[str, list[tuple[float, str, str]]] = {}
        self.budgets: dict[str, dict] = {}
        self.board: dict[str, dict] = {}
        self.decisions: dict[str, dict] = {}
        self.chronicle: list[dict] = []
        self.feed: list[dict] = []

    # --- Knoten -------------------------------------------------------------

    def node(self, sid: str, agent_id: str, ts: float, role: str = "") -> dict:
        key = f"{sid}:{agent_id}"
        node = self.nodes.get(key)
        if node is None:
            is_main = agent_id == "main"
            node = {
                "key": key, "session_id": sid, "agent_id": agent_id,
                "parent": None, "children": [], "role": "", "persona": "",
                "level": 0, "department": "studio", "model": "",
                "status": "idle" if is_main else "active", "task": "", "summary": "",
                "package": "", "started": ts, "stopped": None, "last_seen": ts,
                "_confirmed": False, "_chron": False,
            }
            self.nodes[key] = node
            self.set_role(node, DIRECTOR if is_main else (role or "unbekannt"))
            if not is_main:
                self.reparent(node, self.node(sid, "main", ts)["key"])
        node["last_seen"] = max(node["last_seen"], ts)
        return node

    def set_role(self, node: dict, role: str) -> None:
        node["role"] = role
        node["level"], node["department"] = classify(role)
        if node["agent_id"] != "main":
            node["model"] = self.models.get(role, node["model"] or "inherit")

    def reparent(self, node: dict, parent_key: str) -> None:
        if node["parent"] == parent_key:
            return
        if node["parent"] in self.nodes:
            siblings = self.nodes[node["parent"]]["children"]
            if node["key"] in siblings:
                siblings.remove(node["key"])
        node["parent"] = parent_key
        self.nodes[parent_key]["children"].append(node["key"])

    def add_chronicle(self, node: dict, ts: float, text: str) -> None:
        if not text:
            return
        node["_chron"] = True
        self.chronicle.append({
            "ts": datetime.fromtimestamp(ts).isoformat(timespec="seconds"), "t": ts,
            "session_id": node["session_id"], "department": node["department"],
            "role": node["role"], "text": _short(text, 400),
        })

    # --- Events -------------------------------------------------------------

    def apply(self, event: dict) -> None:
        ts = parse_ts(event.get("ts"))
        sid = str(event.get("session_id") or "unbekannt")
        session = self.sessions.setdefault(
            sid, {"id": sid, "started": ts, "last": ts, "ended": None}
        )
        session["last"] = max(session["last"], ts)
        handler = getattr(self, "on_" + str(event.get("kind", "")), None)
        if handler is not None:
            handler(event, ts, sid)
        self.add_feed(event, ts, sid)

    def agent(self, event: dict, ts: float, sid: str) -> dict:
        return self.node(sid, str(event.get("agent_id") or "main"), ts, event.get("role", ""))

    def on_session_start(self, event, ts, sid):
        main = self.node(sid, "main", ts)
        main["status"] = "idle"
        main["model"] = event.get("model") or main["model"]

    def on_prompt(self, event, ts, sid):
        main = self.node(sid, "main", ts)
        main["status"] = "active"
        main["task"] = event.get("task") or main["task"]

    def on_turn_end(self, event, ts, sid):
        main = self.node(sid, "main", ts)
        main["status"] = "idle"
        main["summary"] = event.get("summary") or main["summary"]

    def on_session_end(self, event, ts, sid):
        self.sessions[sid]["ended"] = ts
        self.node(sid, "main", ts)
        for node in self.nodes.values():
            if node["session_id"] == sid and node["status"] not in FINAL:
                node["status"], node["stopped"] = "ended", ts

    def on_spawn(self, event, ts, sid):
        parent = self.agent(event, ts, sid)
        self.pending.setdefault(sid, []).append({
            "parent": parent["key"],
            "type": event.get("subagent_type") or "general-purpose",
            "persona": event.get("persona") or "", "package": event.get("package") or "",
            "model": event.get("model") or "", "task": event.get("description") or "",
            "matched": False,
        })

    def on_spawned(self, event, ts, sid):
        parent = self.agent(event, ts, sid)
        child = self.node(sid, str(event.get("child_id")), ts)
        self.reparent(child, parent["key"])
        child["_confirmed"] = True

    def on_agent_start(self, event, ts, sid):
        typ = event.get("role") or "general-purpose"
        node = self.node(sid, str(event.get("agent_id")), ts, typ)
        node["status"], node["started"] = "active", ts
        candidates = [
            p for p in self.pending.get(sid, []) if not p["matched"] and p["type"] == typ
        ]
        if node["_confirmed"]:
            own = [p for p in candidates if p["parent"] == node["parent"]]
            candidates = own or candidates
        spawn = candidates[0] if candidates else None
        self.set_role(node, typ)
        if spawn is None:
            return
        spawn["matched"] = True
        if not node["_confirmed"]:
            self.reparent(node, spawn["parent"])
        if spawn["persona"]:
            node["persona"] = spawn["persona"]
            self.set_role(node, spawn["persona"])
        node["package"] = spawn["package"] or node["package"]
        node["task"] = spawn["task"] or node["task"]
        node["model"] = spawn["model"] or node["model"]

    def on_agent_stop(self, event, ts, sid):
        node = self.agent(event, ts, sid)
        node["status"] = "failed" if node["status"] == "failed" else "done"
        node["stopped"] = ts
        if not node["summary"]:
            node["summary"] = event.get("summary") or ""
        if not node["_chron"]:
            self.add_chronicle(node, ts, node["summary"] or node["task"])

    def on_heartbeat(self, event, ts, sid):
        self.agent(event, ts, sid)

    def on_bind(self, event, ts, sid):
        node = self.agent(event, ts, sid)
        role = event.get("role") or ""
        if role:
            self.binds.setdefault(sid, []).append((ts, role, node["key"]))
        node["package"] = node["package"] or event.get("package") or ""

    def resolve(self, sid: str, role: str, package: str, ts: float) -> dict:
        if role in (DIRECTOR, "main"):
            return self.node(sid, "main", ts)
        for bind_ts, bind_role, key in reversed(self.binds.get(sid, [])):
            if bind_role == role and 0 <= ts - bind_ts <= BIND_WINDOW:
                return self.nodes[key]
        candidates = [
            n for n in self.nodes.values()
            if n["session_id"] == sid and n["agent_id"] != "main"
            and n["role"] == role and n["status"] not in FINAL
        ]
        if package:
            candidates = [n for n in candidates if n["package"] == package] or candidates
        if candidates:
            return max(candidates, key=lambda n: n["started"])
        return self.node(sid, f"log:{role}", ts, role)

    def on_status(self, event, ts, sid):
        node = self.resolve(sid, event.get("role") or "", event.get("package") or "", ts)
        node["last_seen"] = max(node["last_seen"], ts)
        status = event.get("status") or ""
        if status:
            node["status"] = status
            if status in FINAL:
                node["stopped"] = ts
        for field in ("task", "summary", "package"):
            if event.get(field):
                node[field] = event[field]
        if status == "done" and event.get("summary"):
            self.add_chronicle(node, ts, event["summary"])

    def on_budget(self, event, ts, sid):
        lead = event.get("role") or ""
        grant = event.get("budget") or {}
        phase = grant.get("phase") or "Standard"
        current = self.budgets.get(lead)
        if current is None or current["phase"] != phase:
            current = {"lead": lead, "phase": phase, "granted": 0, "parallel": 0, "since": ts}
            self.budgets[lead] = current
        current["granted"] += int(grant.get("granted") or 0)
        if grant.get("parallel"):
            current["parallel"] = int(grant["parallel"])

    def on_package(self, event, ts, sid):
        key = str(event.get("package") or "")
        item = self.board.setdefault(key, {"id": key})
        for field in ("title", "owner", "status", "milestone"):
            if event.get(field):
                item[field] = event[field]
        item["blocked_by"] = list(event.get("blocked_by") or [])
        item["ts"] = event.get("ts", "")

    def on_decision(self, event, ts, sid):
        key = str(event.get("decision_id") or "")
        item = self.decisions.setdefault(key, {"id": key, "resolved": None})
        if event.get("resolution"):
            item["resolved"] = event["resolution"]
            return
        item.update({
            "for": event.get("for") or "l0", "question": event.get("question") or "",
            "recommendation": event.get("recommendation") or "",
            "from": event.get("role") or "", "ts": event.get("ts", ""), "resolved": None,
        })

    def add_feed(self, event: dict, ts: float, sid: str) -> None:
        if event.get("source") == "log" and event.get("role"):
            role = event["role"]
            department = classify(role)[1]
        else:
            node = self.nodes.get(f"{sid}:{event.get('agent_id') or 'main'}")
            role = node["role"] if node else (event.get("role") or DIRECTOR)
            department = node["department"] if node else classify(role)[1]
        text = next(
            (event[f] for f in ("tool", "task", "summary", "description", "question",
                                "resolution", "title") if event.get(f)),
            "",
        )
        if event.get("kind") == "spawn":
            target = event.get("persona") or event.get("subagent_type") or ""
            text = f"→ {target}: {event.get('description') or ''}"
        self.feed.append({
            "ts": event.get("ts", ""), "t": ts, "session_id": sid, "role": role,
            "department": department, "kind": event.get("kind", ""),
            "status": event.get("status", ""), "text": _short(text, 140),
        })

    # --- Ergebnis -----------------------------------------------------------

    def result(self, session: str | None, inactive_after: float) -> dict:
        ordered = sorted(self.sessions.values(), key=lambda s: s["last"], reverse=True)
        if session in (None, "", "latest"):
            chosen = ordered[0]["id"] if ordered else None
            scope = {chosen} if chosen else set()
        elif session == "all":
            chosen, scope = "all", {s["id"] for s in ordered}
        else:
            chosen, scope = session, {session}

        views = {key: self.view(node, inactive_after) for key, node in self.nodes.items()}

        def tree(key: str) -> dict:
            node = dict(views[key])
            children = sorted(self.nodes[key]["children"],
                              key=lambda k: self.nodes[k]["started"])
            node["children"] = [tree(k) for k in children]
            return node

        roots = [tree(f"{s['id']}:main") for s in ordered
                 if s["id"] in scope and f"{s['id']}:main" in self.nodes]
        in_scope = [v for v in views.values() if v["session_id"] in scope]
        counts = Counter(v["status"] for v in in_scope)
        counts["inactive"] = sum(1 for v in in_scope if v["inactive"])
        feed = [f for f in self.feed if f["session_id"] in scope]
        chronicle = [c for c in self.chronicle if c["session_id"] in scope]
        return {
            "now": self.now,
            "session": chosen,
            "sessions": ordered,
            "tree": roots,
            "counts": dict(counts),
            "chronicle": sorted(chronicle, key=lambda c: c["t"], reverse=True)[:CHRONICLE_SIZE],
            "budgets": self.budget_view(),
            "board": self.board_view(),
            "decisions": sorted(
                ({k: d.get(k, "") for k in ("id", "for", "question", "recommendation",
                                             "from", "ts")}
                 for d in self.decisions.values() if not d.get("resolved")),
                key=lambda d: d["ts"],
            ),
            "feed": sorted(feed, key=lambda f: f["t"], reverse=True)[:FEED_SIZE],
            "pulse": self.pulse(feed),
            "departments": ["studio", *DEPARTMENTS, "extern"],
        }

    def view(self, node: dict, inactive_after: float) -> dict:
        live_children = [c for c in node["children"] if self.nodes[c]["status"] in LIVE]
        status = node["status"]
        if status == "active" and live_children:
            status = "delegated"
        quiet = self.now - node["last_seen"]
        inactive = status in LIVE and not live_children and quiet > inactive_after
        view = {field: node[field] for field in PUBLIC}
        view.update(status=status, inactive=inactive, idle_seconds=round(max(quiet, 0)))
        return view

    def budget_view(self) -> list[dict]:
        leads = set(self.budgets)
        leads |= {
            n["role"] for n in self.nodes.values() if n["level"] == 1 and n["children"]
        }
        rows = []
        for lead in sorted(leads):
            plan = self.budgets.get(
                lead, {"phase": "ohne Freigabe", "granted": 0, "parallel": 0, "since": 0.0}
            )
            children = [
                self.nodes[c]
                for n in self.nodes.values() if n["role"] == lead
                for c in n["children"]
                if self.nodes[c]["started"] >= plan["since"]
            ]
            spans = sorted(
                (c["started"], c["stopped"] if c["stopped"] is not None else self.now)
                for c in children
            )
            peak = 0
            for start, _ in spans:
                peak = max(peak, sum(1 for s, e in spans if s <= start < e))
            used = len(children)
            rows.append({
                "lead": lead, "phase": plan["phase"], "granted": plan["granted"],
                "parallel": plan["parallel"], "used": used, "parallel_used": peak,
                "overrun": used > plan["granted"] or peak > plan["parallel"],
                "model_mix": dict(Counter(c["model"] or "inherit" for c in children)),
            })
        return rows

    def board_view(self) -> list[dict]:
        items = []
        for item in self.board.values():
            row = {
                "id": item["id"], "title": item.get("title", ""),
                "owner": item.get("owner", ""), "status": item.get("status", "open"),
                "blocked_by": item.get("blocked_by", []),
                "milestone": item.get("milestone", ""), "ts": item.get("ts", ""),
            }
            row["blocks"] = sorted(
                other["id"] for other in self.board.values()
                if item["id"] in other.get("blocked_by", [])
            )
            items.append(row)
        return sorted(items, key=lambda r: (r["milestone"], r["id"]))

    def pulse(self, feed: list[dict]) -> list[dict]:
        last = int(self.now // 60)
        buckets = {m: Counter() for m in range(last - PULSE_MINUTES + 1, last + 1)}
        for entry in feed:
            minute = int(entry["t"] // 60)
            if minute in buckets:
                buckets[minute][entry["department"]] += 1
        return [
            {"minute": datetime.fromtimestamp(m * 60).strftime("%H:%M"),
             "total": sum(c.values()), "by": dict(c)}
            for m, c in buckets.items()
        ]


def build_state(
    events: list[dict],
    now: float,
    agent_models: dict[str, str],
    session: str | None = None,
    inactive_after: float = INACTIVE_DEFAULT,
) -> dict:
    builder = _Builder(agent_models, now)
    ordered = sorted(
        (e for e in events if isinstance(e, dict)), key=lambda e: parse_ts(e.get("ts"))
    )
    for event in ordered:
        builder.apply(event)
    return builder.result(session, inactive_after)
```

- [ ] **Step 4: Tests laufen lassen**

Run: `make studio-test`
Expected: alle Tests OK. Schlägt ein Test fehl, den Code korrigieren, nicht den Test (die Tests sind die Spezifikation der Zuordnungsregeln). Nur bei nachweislich widersprüchlichem Test: Befund im Bericht nennen.

- [ ] **Step 5: Lint und Commit**

Run: `uvx ruff format tools/studio && uvx ruff check tools/studio && make check`

```bash
git add tools/studio/model.py tools/studio/tests/test_model.py
git commit -m "feat: Studio-Zustandsmodell — Organigramm, Budget, Board, Entscheide, Feed, Puls"
```

---

### Task 3: Server, Startskript, Make-Ziele

**Files:**

- Create: `tools/studio/server.py`, `tools/studio/start.sh`, `tools/studio/dashboard/index.html` (Platzhalter, Task 4 ersetzt ihn)
- Test: `tools/studio/tests/test_server.py`
- Modify: `Makefile`

**Interfaces:**

- Consumes: `model.EventStore`, `model.build_state`, `model.read_agent_models`, `paths.events_file`, `paths.agents_dir`.
- Produces: `server.make_server(port: int, events_path: Path, agents: Path, inactive_after: float) -> ThreadingHTTPServer` (bindet 127.0.0.1); `GET /api/state?session=<latest|all|id>` → JSON aus Task 2; `GET /` und Dateien aus `tools/studio/dashboard/`.

- [ ] **Step 1: Test schreiben — `tools/studio/tests/test_server.py`**

```python
import http.client
import json
import tempfile
import threading
import unittest
from pathlib import Path

import server


class ServerTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        events = Path(self.tmp.name) / "events.jsonl"
        events.write_text(
            '{"kind":"agent_start","ts":"2026-09-30T12:00:00.000Z","session_id":"s1",'
            '"agent_id":"a1","role":"lead-qa","source":"hook"}\n',
            "utf-8",
        )
        self.httpd = server.make_server(0, events, Path(self.tmp.name), 300.0)
        self.port = self.httpd.server_address[1]
        threading.Thread(target=self.httpd.serve_forever, daemon=True).start()

    def tearDown(self):
        self.httpd.shutdown()
        self.httpd.server_close()
        self.tmp.cleanup()

    def get(self, path):
        conn = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        conn.request("GET", path)
        response = conn.getresponse()
        body = response.read()
        conn.close()
        return response.status, response.getheader("Content-Type", ""), body

    def test_binds_localhost_only(self):
        self.assertEqual(self.httpd.server_address[0], "127.0.0.1")

    def test_api_state(self):
        status, ctype, body = self.get("/api/state?session=all")
        self.assertEqual(status, 200)
        self.assertIn("application/json", ctype)
        state = json.loads(body)
        self.assertEqual(state["tree"][0]["children"][0]["role"], "lead-qa")

    def test_index_served(self):
        status, _, body = self.get("/")
        self.assertEqual(status, 200)
        self.assertIn(b"<html", body.lower())

    def test_no_path_outside_dashboard(self):
        for path in ("/../server.py", "/%2e%2e/server.py", "/../../.claude/settings.json"):
            status, _, _ = self.get(path)
            self.assertEqual(status, 404, path)

    def test_no_directory_listing(self):
        status, _, _ = self.get("/nichtda/")
        self.assertEqual(status, 404)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Test laufen lassen, Fehlschlag prüfen**

Run: `make studio-test` → ERROR `No module named 'server'`

- [ ] **Step 3: `tools/studio/server.py` schreiben**

```python
"""Lokaler Dashboard-Server (nur 127.0.0.1): /api/state und statische Dateien."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

from model import INACTIVE_DEFAULT, EventStore, build_state, read_agent_models
from paths import agents_dir, events_file

DASHBOARD = Path(__file__).resolve().parent / "dashboard"
HOST = "127.0.0.1"


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, store, agents, inactive_after, **kwargs):
        self.store = store
        self.agents = agents
        self.inactive_after = inactive_after
        super().__init__(*args, directory=str(DASHBOARD), **kwargs)

    def do_GET(self):  # noqa: N802 — Name von http.server vorgegeben
        url = urlparse(self.path)
        if url.path == "/api/state":
            self.send_state(parse_qs(url.query).get("session", ["latest"])[0])
            return
        target = (DASHBOARD / unquote(url.path).lstrip("/")).resolve()
        if url.path != "/" and (DASHBOARD not in target.parents or not target.is_file()):
            self.send_error(404)
            return
        super().do_GET()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def send_state(self, session: str) -> None:
        state = build_state(
            self.store.events(), time.time(), read_agent_models(self.agents),
            session=session, inactive_after=self.inactive_after,
        )
        body = json.dumps(state, ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header(
            "Content-Security-Policy",
            "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:",
        )
        super().end_headers()

    def log_message(self, format, *args):  # noqa: A002 — Signatur von http.server
        return


def make_server(
    port: int, events_path: Path, agents: Path, inactive_after: float
) -> ThreadingHTTPServer:
    handler = partial(
        Handler, store=EventStore(events_path), agents=agents,
        inactive_after=inactive_after,
    )
    return ThreadingHTTPServer((HOST, port), handler)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Studio-Dashboard-Server")
    parser.add_argument("--port", type=int, default=int(os.environ.get("STUDIO_PORT", "8765")))
    args = parser.parse_args(argv)
    inactive = float(os.environ.get("STUDIO_INACTIVE_SECONDS", INACTIVE_DEFAULT))
    httpd = make_server(args.port, events_file(), agents_dir(), inactive)
    print(f"Studio-Dashboard: http://{HOST}:{args.port}/", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

Platzhalter `tools/studio/dashboard/index.html`:

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <title>Studio-Dashboard</title>
  </head>
  <body>
    <p>Studio-Dashboard (Platzhalter)</p>
  </body>
</html>
```

- [ ] **Step 4: `tools/studio/start.sh` schreiben (ausführbar, `chmod +x`)**

```bash
#!/usr/bin/env bash
# Studio-Dashboard starten (idempotent) oder stoppen: tools/studio/start.sh [stop]
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STUDIO_DIR="$(python3 "$DIR/paths.py")"
PORT="${STUDIO_PORT:-8765}"
URL="http://127.0.0.1:${PORT}/"
PID_FILE="$STUDIO_DIR/server.pid"
mkdir -p "$STUDIO_DIR"

running() {
  [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE")" 2>/dev/null
}

if [ "${1:-}" = "stop" ]; then
  if running; then
    kill "$(cat "$PID_FILE")"
    rm -f "$PID_FILE"
    echo "Studio-Dashboard gestoppt."
  else
    rm -f "$PID_FILE"
    echo "Studio-Dashboard läuft nicht."
  fi
  exit 0
fi

if running; then
  echo "Studio-Dashboard läuft bereits: $URL"
  exit 0
fi

nohup python3 "$DIR/server.py" --port "$PORT" >"$STUDIO_DIR/server.log" 2>&1 &
echo $! >"$PID_FILE"
for _ in $(seq 1 20); do
  if python3 -c "import urllib.request; urllib.request.urlopen('${URL}api/state', timeout=1)" 2>/dev/null; then
    echo "Studio-Dashboard: $URL"
    exit 0
  fi
  sleep 0.25
done
echo "Studio-Dashboard startet nicht — siehe $STUDIO_DIR/server.log" >&2
exit 1
```

- [ ] **Step 5: Makefile ergänzen**

`.PHONY` um `studio studio-stop studio-archive` erweitern und nach `studio-test` einfügen:

```make
studio: ## Studio-Dashboard starten (gibt die URL aus)
	@bash tools/studio/start.sh

studio-stop: ## Studio-Dashboard stoppen
	@bash tools/studio/start.sh stop

studio-archive: ## Studio-Events archivieren (Dashboard startet leer)
	@python3 tools/studio/log.py archive
```

- [ ] **Step 6: Tests und Handprobe**

Run: `make studio-test` → OK.
Handprobe mit Test-Verzeichnis:

```bash
export STUDIO_HOME="$(mktemp -d)" STUDIO_PORT=8799
python3 tools/studio/log.py status --role lead-qa --status active --task "Handprobe"
make studio && curl -s http://127.0.0.1:8799/api/state | head -c 300; echo
make studio && make studio-stop
```

Expected: URL-Ausgabe, JSON mit `"tree"`, zweiter Start meldet „läuft bereits", Stop meldet „gestoppt".

- [ ] **Step 7: Lint und Commit**

Run: `uvx ruff format tools/studio && uvx ruff check tools/studio && make check`

```bash
git add tools/studio Makefile
git commit -m "feat: Studio-Dashboard-Server, Startskript und Make-Ziele"
```

---

### Task 4: Dashboard-Oberfläche

**Files:**

- Replace: `tools/studio/dashboard/index.html`
- Create: `tools/studio/dashboard/app.js`, `tools/studio/dashboard/style.css`
- Create: `tools/studio/tests/fixtures/demo_events.jsonl` (Demo-Daten für Screenshot und Handprobe; keine Unit-Tests)
- Modify: `eslint.config.js`

**Interfaces:**

- Consumes: `GET /api/state?session=…` (Form in Task 2, „Rückgabe von build_state").
- Produces: Oberfläche für den Nutzer; keine Code-Schnittstelle.

Gestaltung: Card-UI, CSS Grid, mobile-first (eine Spalte < 720 px, zwei ab 720 px, drei ab 1200 px; Organigramm spannt die volle Breite). Farben als CSS-Variablen auf `:root`, Dunkelmodus über `@media (prefers-color-scheme: dark)` und `:root[data-theme="dark"]`/`[data-theme="light"]` (Umschalter speichert in `localStorage`, jeder Zugriff in `try/catch`). Statusfarben (Variablen): active grün, delegated blau, waiting gelb, blocked orange, idle grau, done gedämpftes Grün, failed rot, ended grau gestrichelt; `inactive` = rote pulsierende Umrandung plus Text „inaktiv seit X min". Bereichsfarben für Feed/Puls: studio, production, design, tech, art, qa, extern (7 unterscheidbare, in beiden Modi lesbare Töne). Schrift: System-Font-Stack. Zeitangaben relativ („vor 12 s", „vor 4 min").

- [ ] **Step 1: `index.html`**

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Studio-Dashboard</title>
    <link rel="stylesheet" href="style.css" />
    <script type="module" src="app.js"></script>
  </head>
  <body>
    <header class="topbar">
      <h1>Inselreich-Studio</h1>
      <label
        >Session
        <select id="session"></select
      ></label>
      <span id="conn" class="conn">verbinde …</span>
      <button id="theme" type="button" aria-label="Hell/Dunkel umschalten">◐</button>
    </header>
    <main class="grid">
      <section class="card wide" aria-labelledby="h-org">
        <h2 id="h-org">Organigramm</h2>
        <div id="org"></div>
      </section>
      <section class="card" aria-labelledby="h-counts">
        <h2 id="h-counts">Status</h2>
        <div id="counts" class="counts"></div>
      </section>
      <section class="card" aria-labelledby="h-decisions">
        <h2 id="h-decisions">Offene Entscheide</h2>
        <div id="decisions"></div>
      </section>
      <section class="card" aria-labelledby="h-budget">
        <h2 id="h-budget">Budget je Lead</h2>
        <div id="budgets"></div>
      </section>
      <section class="card wide" aria-labelledby="h-board">
        <h2 id="h-board">Meilenstein-Board</h2>
        <div id="board"></div>
      </section>
      <section class="card" aria-labelledby="h-pulse">
        <h2 id="h-pulse">Aktivität (60 min)</h2>
        <div id="pulse"></div>
      </section>
      <section class="card" aria-labelledby="h-chron">
        <h2 id="h-chron">Chronik</h2>
        <label
          >Bereich
          <select id="chron-dept"></select
        ></label>
        <ol id="chronicle" class="list"></ol>
      </section>
      <section class="card" aria-labelledby="h-feed">
        <h2 id="h-feed">Live-Feed</h2>
        <ol id="feed" class="list feed"></ol>
      </section>
    </main>
  </body>
</html>
```

- [ ] **Step 2: `app.js` — Grundgerüst (vollständig ausbauen, Muster beibehalten)**

```js
// Studio-Dashboard: pollt /api/state alle 2 s und zeichnet alle Ansichten neu.
// Sicherheit: Daten ausschliesslich per textContent/Attribut, nie per innerHTML.

const POLL_MS = 2000;
const STATUS_LABEL = {
  active: 'aktiv',
  delegated: 'delegiert',
  waiting: 'wartet',
  blocked: 'blockiert',
  idle: 'bereit',
  done: 'fertig',
  failed: 'fehlgeschlagen',
  ended: 'beendet',
};
const LEVEL_LABEL = ['L0', 'L1', 'L2'];

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'class') node.className = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) {
    node.append(child instanceof Node ? child : document.createTextNode(String(child ?? '')));
  }
  return node;
}

function ago(seconds) {
  if (seconds < 60) return `vor ${Math.round(seconds)} s`;
  if (seconds < 3600) return `vor ${Math.round(seconds / 60)} min`;
  return `vor ${Math.round(seconds / 3600)} h`;
}

function storageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Speicher gesperrt: Einstellung gilt nur bis zum Neuladen */
  }
}

let selectedSession = storageGet('studio.session') || 'latest';
let chronDept = 'all';

async function poll() {
  const conn = document.getElementById('conn');
  try {
    const res = await fetch(`/api/state?session=${encodeURIComponent(selectedSession)}`, {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error(String(res.status));
    const state = await res.json();
    render(state);
    conn.textContent = `live · ${new Date().toLocaleTimeString('de-CH')}`;
    conn.dataset.ok = 'true';
  } catch {
    conn.textContent = 'keine Verbindung zum Server';
    conn.dataset.ok = 'false';
  } finally {
    setTimeout(poll, POLL_MS);
  }
}

function render(state) {
  renderSessions(state);
  renderOrg(state);
  renderCounts(state);
  renderDecisions(state);
  renderBudgets(state);
  renderBoard(state);
  renderPulse(state);
  renderChronicle(state);
  renderFeed(state);
}

// renderSessions: <select> mit "Neueste" (latest), "Alle" (all) und je Session
//   `${id.slice(0, 8)} · ${Uhrzeit von last}` + " (beendet)" falls ended; Auswahl in localStorage.
// renderOrg: rekursive <ul class="org">-Liste ab state.tree; je Knoten eine Karte mit
//   Ebene (L0/L1/L2), Rolle, Modell, Status-Badge (Farbe + Text), Task, Paket,
//   "Lebenszeichen vor …" (idle_seconds) und bei inactive Klasse "inactive" + Text
//   "inaktiv seit X min". Leerer Zustand: "Noch keine Aktivität".
// renderCounts: Kacheln je Status (in der Reihenfolge von STATUS_LABEL) plus "inaktiv"; Zahl gross.
// renderDecisions: zwei Gruppen "Wartet auf dich" (for=user) und "Wartet auf L0" (for=l0);
//   je Eintrag ID, Frage, Empfehlung, von wem, wann. Leer: "Keine offenen Entscheide".
// renderBudgets: je Lead Balken verbraucht/frei (Breite = used/max(granted,1), rot bei overrun),
//   Text "used / granted Starts · parallel parallel_used / parallel · Phase",
//   Modellmix als kleine Chips "sonnet 3".
// renderBoard: Tabelle Paket · Titel · Owner · Status · blockiert durch · blockiert;
//   auf schmalen Bildschirmen als Kartenliste (CSS). Leer: "Keine Pakete".
// renderPulse: Inline-SVG (viewBox 0 0 600 120), 60 gestapelte Balken je Bereich
//   (Farben aus CSS-Variablen via getComputedStyle), x-Achse Beschriftung erste/letzte Minute,
//   <title> je Balken mit Minute und Zahl. Erstellung mit document.createElementNS.
// renderChronicle: Bereichsfilter (<select id="chron-dept">, "Alle" + state.departments),
//   Liste neueste oben: Zeit, Bereich-Chip, Rolle, Text.
// renderFeed: letzte Events: Zeit (HH:MM:SS), Bereich-Farbpunkt, Rolle, kind, status, text.

function setupTheme() {
  const saved = storageGet('studio.theme');
  if (saved === 'light' || saved === 'dark') document.documentElement.dataset.theme = saved;
  document.getElementById('theme').addEventListener('click', () => {
    const dark =
      document.documentElement.dataset.theme === 'dark' ||
      (!document.documentElement.dataset.theme &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    storageSet('studio.theme', next);
  });
}

document.getElementById('session').addEventListener('change', (event) => {
  selectedSession = event.target.value;
  storageSet('studio.session', selectedSession);
  poll();
});
document.getElementById('chron-dept').addEventListener('change', (event) => {
  chronDept = event.target.value;
});
setupTheme();
poll();
```

Alle `render*`-Funktionen gemäss den Kommentaren umsetzen. Jede ersetzt den Inhalt ihres Containers mit `replaceChildren(...)`. Beim Neuzeichnen von `<select>` die aktuelle Auswahl beibehalten. Achtung: `poll()` im `change`-Handler darf keine zweite Poll-Schleife starten — die Schleife über ein Flag oder einen gespeicherten Timer (`clearTimeout`) führen.

- [ ] **Step 3: `style.css`** gemäss Gestaltung oben (Variablen, Grid, Karten, Badges, `.inactive` mit `@keyframes`, `@media (prefers-reduced-motion: reduce)` ohne Pulsieren, Tabellen responsive).

- [ ] **Step 4: ESLint-Block** in `eslint.config.js` vor `prettier` einfügen:

```js
  {
    files: ['tools/studio/dashboard/**/*.js'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        localStorage: 'readonly',
        getComputedStyle: 'readonly',
        Node: 'readonly',
      },
    },
  },
```

- [ ] **Step 5: Demo-Events** `tools/studio/tests/fixtures/demo_events.jsonl` erzeugen (ein kleines Python-Skript in der Shell, nicht einchecken): eine Session mit L0, `lead-design` (fertig, Chronik), `lead-tech` delegiert an `tech-sim-engineer` (aktiv) und `tech-ui-engineer` (inaktiv, letztes Lebenszeichen vor 8 min), `lead-qa` wartet; Budget-Freigaben (eine überschritten); drei Pakete mit Blockade; zwei offene Entscheide (user, l0); eine ältere, beendete Session. **Ein Event enthält als `task` den Text `<img src=x onerror=alert(1)>`** (Review Focus 4). Die Zeitstempel relativ zu „jetzt" erzeugen, damit die Inaktiv-Markierung sichtbar ist; deshalb die Datei beim Screenshot frisch erzeugen (Skript im Bericht zeigen).

- [ ] **Step 6: Sichtprüfung per Headless-Chrome**

```bash
export STUDIO_HOME="$(mktemp -d)" STUDIO_PORT=8798
cp tools/studio/tests/fixtures/demo_events.jsonl "$STUDIO_HOME/events.jsonl"
make studio
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1400,2200 \
  --virtual-time-budget=6000 --screenshot="$STUDIO_HOME/light.png" http://127.0.0.1:8798/
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=1400,2200 \
  --force-dark-mode --blink-settings=preferredColorScheme=0 \
  --virtual-time-budget=6000 --screenshot="$STUDIO_HOME/dark.png" http://127.0.0.1:8798/
"$CHROME" --headless=new --disable-gpu --hide-scrollbars --window-size=390,2600 \
  --virtual-time-budget=6000 --screenshot="$STUDIO_HOME/mobile.png" http://127.0.0.1:8798/
make studio-stop
```

Screenshots mit dem Read-Tool ansehen. Prüfen: alle 8 Ansichten gefüllt, Inaktiv-Markierung sichtbar, überschrittenes Budget rot, der `<img …>`-Text erscheint als Text, Dunkelmodus lesbar, mobil keine horizontale Scrollleiste. Die Screenshot-Pfade im Bericht nennen.

- [ ] **Step 7: Lint und Commit**

Run: `npx prettier --write tools/studio/dashboard tools/studio/tests/fixtures eslint.config.js && make check`

```bash
git add tools/studio/dashboard tools/studio/tests/fixtures eslint.config.js
git commit -m "feat: Studio-Dashboard — Organigramm, Budget, Board, Entscheide, Chronik, Feed, Puls"
```

---

### Task 5: Asset-Policy umstellen

**Files:**

- Create: `docs/adr/ADR-006-offene-lizenzen.md`, `docs/CREDITS.md`, `docs/licenses/README.md`
- Modify: `docs/adr/ADR-004-eigene-assets.md` (nur Statuszeile), `CLAUDE.md:7-8`, `docs/arc42.md:16,41,337`

**Interfaces:** Produces: ADR-006 als Referenz für STUDIO.md (Task 6) und `art-license-checker` (Task 7).

- [ ] **Step 1: ADR-006** im Stil der bestehenden ADRs (siehe `docs/adr/ADR-004-eigene-assets.md`: Titel, `Status: akzeptiert · Datum: 2026-09-30`, Kontext, Entscheidung, Konsequenzen). Inhalt:
  - Kontext: ADR-004 erlaubte nur Eigenes; für Grafik, Animation, Wetter, Musik und Sound fehlt die Kapazität, alles prozedural zu erzeugen; offen lizenzierte Werke sind rechtlich sauber nutzbar, wenn der Nachweis stimmt.
  - Entscheidung: „Eigene oder offen lizenzierte Inhalte mit Nachweis". Mechaniken, Regeln, Ideen anderer Spiele frei. Nie übernommen: Grafiken, Musik, Sounds, Texte, Namen, Marken aus kommerziellen oder nicht frei lizenzierten Spielen. Erlaubt: CC0, CC-BY, CC-BY-SA, MIT, OFL oder vergleichbar Freies. Nicht erlaubt: NC, ND, GPL-Zwang für Assets, „free for personal use". Lizenz vor dem Einbau prüfen (`art-license-checker`, Vetorecht). Nachweis in `docs/CREDITS.md` (Quelle, Autor, Lizenz, Link), Lizenztexte in `docs/licenses/`, Attribution im Spiel (Info-Panel, spätere Projektarbeit). Assets unter `public/`, Gesamtgrösse im Blick. Ohne passende Quelle: prozedurale Grafik und synthetisches Audio. Titel „Inselreich" bleibt eigen.
  - Konsequenzen: Asset-Import-Workflow nötig; CC-BY-SA-Assets stehen unter Share-Alike (nur das Asset selbst, nicht der Code — im ADR nennen); Lizenz-Grenzfälle entscheidet der Nutzer.
  - Status-Zeile ADR-004 ändern zu: `Status: abgelöst durch [ADR-006](ADR-006-offene-lizenzen.md) · Datum: 2026-09-29`.
- [ ] **Step 2: `docs/CREDITS.md`**: Einleitung (Zweck, Pflichtfelder, Verweis ADR-006), leere Tabelle `| Datei | Quelle | Autor | Lizenz | Link | geprüft von / am |` mit Zeile „_noch keine fremden Assets_".
- [ ] **Step 3: `docs/licenses/README.md`**: Ablage-Konvention (je Lizenz eine Datei `CC-BY-4.0.txt` usw., vollständiger Lizenztext; bei Autoren-spezifischen Hinweisen `<asset>-NOTICE.txt`), Verweis auf CREDITS.
- [ ] **Step 4: CLAUDE.md** Zeilen 7–8 ersetzen durch: `Aufbau-Strategiespiel im Stil von Anno 1602 im Browser (TypeScript, Canvas 2D). Eigener Titel, eigene Spielwerte; Grafik und Audio eigen oder offen lizenziert mit Nachweis (ADR-006).`
- [ ] **Step 5: arc42**: Zeile 16 Verweis `(ADR-004)` → `(ADR-006)` mit sinngemäss „eigenständig oder offen lizenziert mit Nachweis"; Tabellenzeile 41 („Eigene Inhalte") umformulieren auf ADR-006; ADR-Tabelle (um Zeile 337) um ADR-006, ADR-007, ADR-008 ergänzen und ADR-004 als „abgelöst" kennzeichnen. ADR-007/008 existieren erst nach Task 6 — Links trotzdem setzen (Dateinamen `ADR-007-studio-hierarchie.md`, `ADR-008-studio-telemetrie.md`).
- [ ] **Step 6: Prettier + check + Commit**

```bash
npx prettier --write docs/adr/ADR-006-offene-lizenzen.md docs/adr/ADR-004-eigene-assets.md docs/CREDITS.md docs/licenses/README.md docs/arc42.md CLAUDE.md
make check
git add docs CLAUDE.md
git commit -m "docs: Asset-Policy — eigene oder offen lizenzierte Inhalte mit Nachweis (ADR-006)"
```

---

### Task 6: Studio-Handbuch, Gates, Roster, Ledger, Übergabe, Herkunft, ADR-007/008, Vorlagen

**Files:**

- Create: `docs/studio/STUDIO.md`, `docs/studio/gates.md`, `docs/studio/roster.md`, `docs/studio/rulings.md`, `docs/studio/state.md`, `docs/studio/herkunft.md`
- Create: `docs/studio/templates/briefing.md`, `bericht.md`, `ruling.md`, `budgetantrag.md`, `uebergabe.md`, `persona.md`, `playtest-report.md`
- Create: `docs/adr/ADR-007-studio-hierarchie.md`, `docs/adr/ADR-008-studio-telemetrie.md`

**Interfaces:**

- Consumes: Spec (Organisation, Rulings R1–R11, Machbarkeit), `log.py`-Befehle aus Task 1, Make-Ziele aus Task 3, ADR-006.
- Produces: Pfade und Abschnittsnamen, auf die Personas (Task 7) und CLAUDE.md (Task 8) verweisen: `STUDIO.md` mit den Abschnitten `## Organisation`, `## Entscheidungsbefugnisse`, `## Kommunikation`, `## Briefing-Standard`, `## Modellwahl`, `## Budget`, `## Gates und Dokumentation`, `## Prozessstufen`, `## Umsetzungszyklus`, `## Feste Regeln`, `## Asset- und Inspirationsregeln`, `## Logging-Pflicht`, `## Was den Nutzer betrifft`, `## Session-Start und -Ende`.

Rohmaterial (nur lesen): CCGS-Dateien unter `/private/tmp/claude-501/-Users-KN-CAS-projekte-anno-clone/3fe665e3-a7ba-4640-9fb8-0a48ce9a4cd0/scratchpad/ccgs/` — `.claude/docs/director-gates/*.md` (Gate-Aufbau), `.claude/docs/coordination-rules.md`, `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md`. Nur Ideen und Struktur übernehmen, auf Deutsch neu formulieren, keine Engine-Bezüge.

- [ ] **Step 1: `STUDIO.md`** — verbindliche Betriebsanleitung, knapp und handlungsleitend (Ziel ≤ ~350 Zeilen). Inhalt je Abschnitt aus der Spec („Organisation (Kern von STUDIO.md)", „Kommunikation", „Briefing-Standard", „Feste Regeln", „Asset- und Inspirationsregeln", „Gates", Rulings R2/R7/R9/R10/R11) plus:
  - `## Organisation`: Mermaid-Organigramm (L0 → 5 Leads → deren Arbeiter, ohne `\n` in Labels), Tabelle Lead · Bereich · Arbeiter aktiv · auf Abruf (Verweis roster.md).
  - `## Entscheidungsbefugnisse`: Tabelle aus der Spec (L2/L1/L0/Nutzer).
  - `## Kommunikation`: Berichtsweg, **Vordergrund-Regel** („Leads starten Arbeiter immer mit `run_in_background: false`; parallel = mehrere Agent-Aufrufe in einer Nachricht; Arbeiter starten keine Agenten; L0 darf Leads im Hintergrund starten"), Querabstimmung (Übergabe unter `.studio/handoffs/<datum>-<von>-<an>.md`, `SendMessage` nur an laufende Agenten), Eskalation, Berichtsformat (≤ ~15 Zeilen; Vorlage `templates/bericht.md`).
  - `## Briefing-Standard`: die 8 Punkte, Kopfzeilen `Persona: <rolle>` und `Paket: <id>`, Vorlage `templates/briefing.md`; „Die festen Regeln stehen in jedem Briefing wörtlich."
  - `## Modellwahl`: Tabelle Stufe → Alias → Einsatz (stark `opus`: Leads, Design, Lizenzprüfung, Final-Reviews; mittel `sonnet`: spezifizierte Umsetzung, Recherche, Task-Reviews; klein `haiku`: mechanische Prüfungen). Modell immer explizit im Agent-Aufruf angeben, wenn es von der Persona abweicht.
  - `## Budget`: Einheit = L2-Starts und maximale Parallelität; L0 gibt pro Phase frei (`log.py budget`), Leads verteilen; Formel Umsetzung `Pakete × 2 + QA-Checks + 1 Final-Review`, darauf 30 % Puffer, aufgerundet — mit Rechenbeispiel (4 Pakete, 2 UI-Checks: 8 + 2 + 1 = 11 → 14,3 → 15); Mehrbedarf per `templates/budgetantrag.md` an L0; das Dashboard zählt Starts automatisch über die Hooks.
  - `## Gates und Dokumentation`: vier Gates, Verweis gates.md; jede Entscheidung als Ruling in `rulings.md` (Format `Ruling: <was> — <warum> — <Kosten bei Irrtum>`), ADR wo es ein „Warum" mit Bestand gibt; superpowers-Ledger unter `.superpowers/sdd/` bleibt Arbeitsdatei, Rulings daraus überträgt der Tech-Lead beim Abschluss nach `rulings.md`.
  - `## Prozessstufen`: leicht/voll wie Spec (R2), wer einstuft (L0), Hochstufen jederzeit.
  - `## Umsetzungszyklus`: Ablauf Meilenstein (6 Schritte der Spec), Worktrees `.worktrees/<strang>` je parallelem Strang (R7) mit Datei-Ownership im Plan, Implementierer + `qa-code-reviewer` je Task (superpowers:subagent-driven-development, Tech-Lead als Controller), `qa-playtester` je UI-Task, Final-Review durch QA auf `opus`, Merge seriell durch `production-integrator` nach L0-Merge-Gate mit `make check`, CI-Status (`gh run list --branch main --limit 3`) und Pages-Deploy-Prüfung.
  - `## Feste Regeln`: die fünf Regeln wörtlich aus der Spec als Block zum Kopieren.
  - `## Asset- und Inspirationsregeln`: wörtlich aus der Spec, Verweis ADR-006, CREDITS, licenses.
  - `## Logging-Pflicht`: Befehlsreferenz `log.py` (alle Unterbefehle mit Beispiel) und wann wer loggt: jeder Agent beim Start (`status active --task`), bei Delegation (`delegated`), Warten (`waiting`/`blocked`), Abschluss (`done --summary` bzw. `failed`); L0 bei Budgetfreigaben, Paketen, Entscheiden; Hooks erfassen Start/Stop/Heartbeat automatisch; Dashboard `make studio`, Archiv `make studio-archive`.
  - `## Was den Nutzer betrifft`: L0 fragt nur bei neuen Laufzeit-Abhängigkeiten, Folgeissues, Lizenz-Grenzfällen und bei Entscheiden, die laut Befugnistabelle dem Nutzer gehören; alles andere entscheidet L0 und berichtet; offene Nutzer-Entscheide als `log.py decision --for user`.
  - `## Session-Start und -Ende`: Start- und Ende-Routine (wie Task 8 für CLAUDE.md) ausführlich, inkl. state.md-Pflege.
- [ ] **Step 2: `gates.md`** — je Gate (Brainstorming, Spec, Plan, Merge) ein Abschnitt im CCGS-Aufbau: prüfende Rolle(n) mit Modell, Auslöser, Kontext (Dateien), Prüffragen (3–6, konkret für Inselreich: Spielerlebnis-Säulen, Determinismus, Save-Kompatibilität, Balancing-Test, Testbarkeit der Abnahmekriterien, Datei-Ownership, Budget, Lizenzen), Urteile **OK / BEDENKEN [Liste] / ZURÜCK [Grund]**, Entscheidung durch L0 + Ruling. Kopfzeile: „Aufbau nach CCGS director-gates (MIT), siehe herkunft.md".
- [ ] **Step 3: `roster.md`** — Namensschema (R11), Tabelle aktive Personas (Name, Ebene, Bereich, Modell, Zweck) gemäss Spec „Personas", Tabelle „auf Abruf" mit Einzeiler je Rolle (die 11 Namen aus der Spec) und Anlage-Anleitung (Lead legt `.claude/agents/<name>.md` nach `templates/persona.md` an, Production-Lead committet; bis zur nächsten Session `general-purpose` mit `Persona:`-Kopfzeile und Persona-Text im Briefing).
- [ ] **Step 4: `rulings.md`** — Kopf (Zweck, Format, neueste unten), dann die Rulings R1–R11 aus der Spec als erste Einträge (Datum 2026-09-30, „Setup-Session") im Format `Ruling: … — … — …`.
- [ ] **Step 5: `state.md`** — Abschnitte: Aktuelles Projekt und Phase (Inselreich, MVP M1–M4 fertig, Studio eingerichtet, nächster Meilenstein offen), Laufende Pakete (keine), Pausierte Pakete (keine), Budget (keine Freigaben), Offene Entscheide L0 / Nutzer (aus dem Setup, falls vorhanden: „keine"), Nächste Schritte (Playtest-Befund in `docs/beobachtungen.md` sichten, Nutzer nach dem nächsten Ziel fragen), Stand-Datum.
- [ ] **Step 6: `herkunft.md`** — Tabelle Baustein · Quelle · Lizenz · Commit/Version · was übernommen · was angepasst: CCGS (`https://github.com/Donchitos/Claude-Code-Game-Studios`, MIT, Commit `b21fa0f7f289fc3e726cf36fb12b9bc1e7a51e4d`): director-gates → gates.md; Persona-Texte (Liste) → `.claude/agents/`; `log-agent.sh`/`log-agent-stop.sh` → Idee für hook.py; `pre-compact.sh`/`post-compact.sh` + `session-state/active.md` → SessionStart-Kontext + state.md; Rigor-Messung → Prozessstufen. disler/claude-code-hooks-multi-agent-observability (keine Lizenz → **nur Idee, kein Code**): Hooks → Server → Live-UI, Event-Feed, Aktivitäts-Puls, Session-Filter. MIT-Hinweis: Copyright-Zeile von CCGS zitieren. Regel: Upstream-Änderungen nie blind nachziehen.
- [ ] **Step 7: ADR-007 Studio-Hierarchie** (Kontext: Wunsch nach L0/L1/L2; Machbarkeitstests mit Ergebnissen aus der Spec-Tabelle; Optionen Nativ / A / B / Agent Teams; Entscheidung Nativ mit Vordergrund-Regel; Rückfall B mit Auslöser „Verschachtelung oder Vordergrund-Warten funktioniert nach einem Claude-Code-Update nicht mehr → L1 schreibt Briefings nach `.studio/handoffs/`, L0 startet 1:1"; Konsequenzen: Tiefe 2 von 3 genutzt, Parallelität nur innerhalb eines Leads per Mehrfachaufruf, L0-Kontext bleibt klein). ADR-008 Studio-Telemetrie (Kontext: Live-Status darf nicht von Agenten-Disziplin abhängen; Optionen: disler-Architektur mit HTTP-POST, SQLite, WebSocket, Bun/Vue vs. JSONL + stdlib; Entscheidung R5/R6; Konsequenzen und bekannte Grenzen: kein Heartbeat während langer Denkphasen ohne Tool-Aufruf; Agent kennt eigene ID nicht → bind-Heuristik; Datei wächst → Archiv; nur lokal).
- [ ] **Step 8: Vorlagen** unter `docs/studio/templates/` — jede kurz, mit Platzhaltern in `<spitzen Klammern>` und einem ausgefüllten Mini-Beispiel am Ende:
  - `briefing.md`: Kopfzeilen `Persona:`, `Paket:`, `Modell:`, `Budget:`; dann die 8 Punkte; Block „Feste Regeln" (wörtlich); Block „Logging" mit den konkreten `log.py`-Aufrufen für diese Persona; Block „Bericht" (Format).
  - `bericht.md`: ≤ 15 Zeilen: Ergebnis · Entscheidungsbedarf (mit Empfehlung) · Risiken · Befunde ausserhalb Scope (→ beobachtungen.md) · Budget verbraucht/frei · Status.
  - `ruling.md`: `Ruling: <was> — <warum> — <Kosten bei Irrtum>` + Datum, Entscheider, Anlass, ggf. ADR-Link.
  - `budgetantrag.md`: Lead, Phase, Pakete-Liste, Formelrechnung, Parallelität, Begründung Mehrbedarf.
  - `uebergabe.md`: von/an, Anlass, Ergebnis/Artefakte, offene Fragen, erwartete Antwort bis.
  - `persona.md`: Frontmatter-Muster (`name`, `description`, `tools`, `model`) und Pflichtabschnitte (Persona und Expertise, Verantwortung und Grenzen, Qualitätsmassstab, Bericht und Logging, Verweis STUDIO.md).
  - `playtest-report.md`: Build/Commit, Szenario, Schritte, Beobachtungen, Screenshots (Pfad), Befunde nach Schwere, Empfehlung (inspiriert von CCGS-Playtest-Report).
- [ ] **Step 9: Prettier + check + Commit**

```bash
npx prettier --write docs/studio docs/adr/ADR-007-studio-hierarchie.md docs/adr/ADR-008-studio-telemetrie.md
make check
git add docs/studio docs/adr
git commit -m "docs: Studio-Handbuch, Gates, Roster, Ledger, Übergabe, Vorlagen, ADR-007/008"
```

---

### Task 7: Personas (`.claude/agents/`)

**Files:**

- Create: `.claude/agents/lead-production.md`, `lead-design.md`, `lead-tech.md`, `lead-art.md`, `lead-qa.md`, `production-integrator.md`, `design-spec-author.md`, `design-economy-designer.md`, `tech-sim-engineer.md`, `tech-ui-engineer.md`, `art-license-checker.md`, `qa-code-reviewer.md`, `qa-playtester.md`

**Interfaces:**

- Consumes: `docs/studio/STUDIO.md` (Abschnittsnamen aus Task 6), `docs/studio/roster.md`, `docs/studio/templates/briefing.md`, `log.py`-Befehle.
- Produces: Agent-Typen mit exakt diesen `name`-Werten (das Dashboard leitet Ebene/Bereich daraus ab).

Frontmatter exakt (YAML, Tools kommagetrennt):

| Datei                     | tools                                                                  | model  |
| ------------------------- | ---------------------------------------------------------------------- | ------ |
| `lead-production`         | Agent, Read, Grep, Glob, Write, Edit, Bash, Skill                      | opus   |
| `lead-design`             | Agent, Read, Grep, Glob, Write, Edit, Bash, Skill, WebSearch, WebFetch | opus   |
| `lead-tech`               | Agent, Read, Grep, Glob, Write, Edit, Bash, Skill                      | opus   |
| `lead-art`                | Agent, Read, Grep, Glob, Write, Edit, Bash, Skill, WebSearch, WebFetch | opus   |
| `lead-qa`                 | Agent, Read, Grep, Glob, Write, Edit, Bash, Skill                      | opus   |
| `production-integrator`   | Read, Grep, Glob, Bash                                                 | sonnet |
| `design-spec-author`      | Read, Grep, Glob, Write, Edit, Bash                                    | opus   |
| `design-economy-designer` | Read, Grep, Glob, Write, Edit, Bash                                    | opus   |
| `tech-sim-engineer`       | Read, Grep, Glob, Write, Edit, Bash                                    | sonnet |
| `tech-ui-engineer`        | Read, Grep, Glob, Write, Edit, Bash                                    | sonnet |
| `art-license-checker`     | Read, Grep, Glob, Write, Edit, Bash, WebSearch, WebFetch               | opus   |
| `qa-code-reviewer`        | Read, Grep, Glob, Bash                                                 | sonnet |
| `qa-playtester`           | Read, Grep, Glob, Bash, Write                                          | sonnet |

`description`: ein Satz „wann einsetzen" auf Deutsch, beginnend mit der Rolle (z. B. „Tech-Lead des Inselreich-Studios: einsetzen für Architektur, Implementierungspläne und die Steuerung der Umsetzung; …"). Keine Doppelpunkte am Anfang, YAML-sicher (Beschreibung in Anführungszeichen, wenn sie `:` enthält).

- [ ] **Step 1: Die 5 Leads schreiben** (je ~80–140 Zeilen). Pflichtabschnitte:
  1. `## Persona und Expertise` — erfahrener Profi (z. B. Tech-Lead: 15 Jahre Engine-/Tools-Entwicklung, deterministische Simulationen, TypeScript; Design-Lead: Wirtschaftssimulationen und Aufbauspiele; Production-Lead: Studio-Produzent; Art-&-Audio-Lead: Art Direction und Audio für 2D-Strategie, Lizenzrecht-bewusst; QA-Lead: Testmanagement, Regression, Determinismus). Rohmaterial: CCGS-Personas im Scratchpad (`…/scratchpad/ccgs/.claude/agents/`): producer → Production, game-designer/systems-designer/economy-designer → Design, technical-director/lead-programmer → Tech, art-director/audio-director → Art, qa-lead → QA. Nur Haltung, Qualitätsmassstäbe und Prüffragen übernehmen, auf Deutsch, knapp, ohne Engine-Bezüge und ohne die CCGS-Regel „frage vor jedem Schreiben" (im Studio entscheidet L0).
  2. `## Verantwortung und Grenzen` — Bereich laut STUDIO.md; was der Lead nie tut (Code selbst schreiben beim Tech-Lead ausser Plan-Dokumenten; Merges ausser Production; Gates entscheiden).
  3. `## Deine Arbeiter` — Tabelle Persona · wofür · Modell (aktive + auf Abruf aus roster.md); wie briefen: `docs/studio/templates/briefing.md`, Kopfzeilen `Persona:`/`Paket:`; **Vordergrund-Regel** wörtlich: „Starte Arbeiter immer mit `run_in_background: false`. Parallel = mehrere Agent-Aufrufe in derselben Nachricht. Warte auf alle Ergebnisse, nimm sie ab, dann berichte."; Budget einhalten, Mehrbedarf an L0.
  4. `## Arbeitsweise` — Tech: superpowers:writing-plans und superpowers:subagent-driven-development als Controller im Worktree, Reviewer = `qa-code-reviewer`, UI-Task-Checks = `qa-playtester`; Design: superpowers:brainstorming (L0 ist Gesprächspartner; Fragen und Designvorschlag im Bericht an L0, nicht an den Nutzer), Spec nach `docs/superpowers/specs/`; QA: Final-Review auf `opus` mit superpowers:requesting-code-review, Determinismus (gleicher Seed → gleicher Zustand), Balancing-Test; Art: Asset-Scouting, Lizenz-Veto über `art-license-checker`, CREDITS; Production: Board/Dashboard, state.md-Entwurf für L0, `production-integrator` für Merges, Onboarding-Briefing neuer Personas.
  5. `## Qualitätsmassstab` — 4–6 prüfbare Punkte je Bereich.
  6. `## Bericht und Logging` — Bericht nach `templates/bericht.md` (≤ 15 Zeilen); konkrete Aufrufe: `python3 tools/studio/log.py status --role <name> --status active --task "<Auftrag>"` beim Start, `--status delegated` vor dem Starten von Arbeitern, `--status waiting`/`blocked` mit Grund, `--status done --summary "<Ergebnis>"` am Ende; Pakete: `log.py package …`; offene Fragen an L0/Nutzer: `log.py decision --for l0|user …`.
  7. Schlusszeile: „Verbindlich ist `docs/studio/STUDIO.md`; bei Widerspruch gilt das Handbuch."
- [ ] **Step 2: Die 8 Arbeiter schreiben** (je ~40–80 Zeilen) mit den Abschnitten 1, 2, 5, 6, 7 (ohne „Deine Arbeiter"). Besonderheiten:
  - `production-integrator`: merged nur nach L0-Merge-Gate, seriell, `git merge --no-ff`, vorher/nachher `make check`, danach Push nur wenn laut Briefing freigegeben, dann CI (`gh run list --branch main --limit 3`, `gh run watch`) und Pages-Deploy prüfen; bei Konflikten stoppen und melden, nie `--force`, nie `reset --hard`.
  - `design-spec-author`: schreibt Specs im Stil der bestehenden (`docs/superpowers/specs/`), Werte nur in `src/sim/defs/` vorgesehen, Abnahmekriterien testbar.
  - `design-economy-designer`: Produktionsketten, Kreisläufe, Steuern/Unterhalt; rechnet Bilanzen je Einwohner wie in `docs/superpowers/specs/2026-09-30-balancing-design.md`; Balancing-Test bleibt Regressionsschutz, Änderungen als Ruling begründen.
  - `tech-sim-engineer`: `src/sim/` DOM-frei, deterministisch, Aktionen liefern `{ ok, reason }`, Werte nur in `src/sim/defs/`, Zufall nur über seeded RNG, TDD mit Vitest, Save-Format versionieren + Migrationstest.
  - `tech-ui-engineer`: `src/ui/`, `src/render/`, Card-UI, CSS Grid, mobile-first, keine Laufzeit-Abhängigkeiten, Canvas 2D, manuelle Browser-Prüfung dokumentieren.
  - `art-license-checker`: prüft jede Quelle gegen die Positivliste (CC0, CC-BY, CC-BY-SA, MIT, OFL o. ä.) und Negativliste (NC, ND, GPL-Zwang für Assets, „free for personal use"); dokumentiert Lizenzseite, Autor, Link, Datum; **Veto** schriftlich mit Grund; Grenzfälle → `log.py decision --for user`; trägt in `docs/CREDITS.md` ein und legt Lizenztext in `docs/licenses/` ab.
  - `qa-code-reviewer`: prüft Diff gegen Brief/Spec (Spec-Konformität ✅/❌ + Qualität), Architektur-Regeln aus CLAUDE.md, Tests aussagekräftig, keine Secrets, OWASP; Urteil OK / BEDENKEN / ZURÜCK; ändert keinen Code.
  - `qa-playtester`: startet `make dev` bzw. `npx vite --port <frei>` im Hintergrund, prüft per Headless-Chrome (`"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=… --window-size=…`) oder CDP (`--remote-debugging-port`), legt Screenshots unter `.studio/qa/<paket>/` ab, Bericht nach `templates/playtest-report.md`; beendet gestartete Prozesse.
- [ ] **Step 3: Prüfen**

```bash
python3 - <<'EOF'
import pathlib, sys
sys.path.insert(0, "tools/studio")
from model import read_agent_models, classify
models = read_agent_models(pathlib.Path(".claude/agents"))
print(len(models), models)
for name in models:
    print(name, classify(name))
EOF
```

Expected: 13 Einträge; Leads Ebene 1, Arbeiter Ebene 2, kein Bereich `extern`. Dann `npx prettier --write .claude/agents && make check`.

- [ ] **Step 4: Commit**

```bash
git add .claude/agents
git commit -m "feat: Studio-Personas — 5 Leads und 8 Arbeiter"
```

---

### Task 8: Einstieg (CLAUDE.md, docs/index.md, README)

**Files:**

- Modify: `CLAUDE.md` (neuer Abschnitt nach „Über das Projekt"), `docs/index.md`, `README.md` (Entwicklungs-Abschnitt)

**Interfaces:** Consumes: Pfade aus Task 3/6.

- [ ] **Step 1: CLAUDE.md** — neuer Abschnitt, nur Anweisungen, die immer gelten (Aufnahmeregel in `../CLAUDE.md`):

```markdown
## Arbeitsweise: Studio

- Die Hauptsession in diesem Repo ist immer der **Studio-Direktor (L0)** nach `docs/studio/STUDIO.md`.
  L0 macht keine inhaltliche Arbeit selbst, sondern setzt Leads ein (`.claude/agents/lead-*`).
- **Session-Start** (zusätzlich zur gemeinsamen Start-Routine in `../CLAUDE.md`):
  1. `docs/studio/STUDIO.md` und `docs/studio/state.md` lesen.
  2. `make studio` ausführen und dem Nutzer die Dashboard-URL nennen.
  3. In wenigen Zeilen Stand, laufende Arbeit und offene Entscheide zeigen.
  4. Auf den Auftrag warten oder den laufenden Plan fortsetzen.
- **Session-Ende:** laufende Agenten abschliessen oder pausieren und loggen; `docs/studio/state.md`
  nachführen; Kurzbericht an den Nutzer.
```

Context-Scopes-Tabelle um eine Zeile ergänzen: `| Studio | docs/studio/, .claude/agents/, tools/studio/ | Arbeitsweise, Personas, Dashboard |`.

- [ ] **Step 2: docs/index.md** — neuer Abschnitt „Studio (Arbeitsweise)" mit Links: STUDIO.md, gates.md, roster.md, rulings.md, state.md, herkunft.md, templates/; ADR-Liste um ADR-006/007/008 ergänzen und ADR-004 als „abgelöst durch ADR-006" markieren; Specs um die Studio-Spec, Pläne um diesen Plan; Abschnitt „Assets": CREDITS.md, licenses/.
- [ ] **Step 3: README.md** — im Entwicklungs-/Befehle-Abschnitt (falls vorhanden, sonst am Ende einen kurzen Abschnitt „Entwicklung: Studio-Dashboard") die Ziele `make studio`, `make studio-stop`, `make studio-archive`, `make studio-test` je in einer Zeile; Hinweis „lokal, nicht Teil des Spiels". Spielanleitung unverändert.
- [ ] **Step 4: Prettier + check + Commit**

```bash
npx prettier --write CLAUDE.md docs/index.md README.md
make check
git add CLAUDE.md docs/index.md README.md
git commit -m "docs: Einstieg ins Studio — CLAUDE.md, Doku-Index, README"
```

---

### Task 9 (Controller): Final-Review, Probelauf, Merge

Vom Controller (Setup-Session) ausgeführt, nicht an einen Implementierer delegiert.

- [ ] Final-Review der ganzen Branch auf `opus` (superpowers:requesting-code-review), Befunde in einem Fix-Durchgang beheben.
- [ ] Probelauf gemäss Spec „Probelauf" als headless Session im Worktree (lädt `.claude/settings.json` und `.claude/agents/` des Branches); Dashboard parallel mit Headless-Chrome screenshotten (vor und nach 5 min); Events prüfen (Organigramm, Status, Inaktiv, Budget, Berichtsweg, Hooks).
- [ ] Befunde fixen, dann `make studio-archive`.
- [ ] Merge `feat/studio` → `main` (`--no-ff`), `make check` auf main, Push, CI und Pages grün prüfen.
