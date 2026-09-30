# Studio 1.5 — Projektleiter, Autonomie, Messung, Verbesserungsschleife — Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jede Session startet als Projektleiter, arbeitet autonom mit Warteschlange und Guard, misst Aufwand ehrlich, zeigt alles im Dashboard und verbessert sich über Coach-Retros und Experimente.

**Architecture:** Neue Python-Module unter `tools/studio/` (nur Standardbibliothek): `studio_docs.py` (Parser/Schreiber der Studio-Dokumente), `guard.py` (PreToolUse-Verbote), `usage.py` (Tokens aus Transkripten), `context.py` (SessionStart-Kontext), `effort.py` (reine Aggregation), `metrics.py` (Verdichtung), `ci.py` (CI-Läufe). Bestehende `hook.py`, `log.py`, `model.py`, `server.py`, Dashboard werden additiv erweitert. Regeln in `docs/studio/` (Verfassung, Handbuch, Changelog, Warteschlange, Experimente, lernen), L0-Rolle über Output-Style.

**Tech Stack:** Python 3 Standardbibliothek (`unittest`), reines HTML/CSS/JS (ES-Module), Markdown.

**Spec:** `docs/superpowers/specs/2026-09-30-studio-autonomie-design.md`

## Global Constraints

- Nur Python-Standardbibliothek und reines HTML/CSS/JS; keine neuen Abhängigkeiten (auch keine npm-Pakete).
- `src/`, `tests/`, `public/` bleiben unverändert (Spiel unangetastet).
- Hooks (`hook.py`, `guard.py`) werfen nie; jeder Fehler endet mit Exit 0.
- Ruff-kompatibles Python (Zeilenlänge 88, doppelte Anführungszeichen); Prettier-kompatibles JS/CSS/Markdown.
- Dashboard setzt Daten nur per `textContent`/Attribut, nie per `innerHTML`.
- Tests: `make studio-test` (`python3 -m unittest discover -s tools/studio/tests -t tools/studio`); am Ende jeder Task `make check` grün.
- Commit-Präfixe `feat:`, `fix:`, `docs:`, `refactor:`, `test:`; Commit-Nachricht endet mit
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` und
  `Claude-Session: https://claude.ai/code/session_01F8xVXpsyDZS295tvnaTppM`.
- Texte deutsch (Schweizer Schreibweise, „ss" statt „ß").
- Messwerte nie schätzen: fehlt eine Messung, steht `None` im Datensatz und „nicht gemessen" in der Anzeige.

## Review Focus

- Guard-Fehlalarme bei normaler Arbeit: `git merge --no-ff --no-commit`, `git merge --abort`, `git worktree add/remove` (ohne `--force`), `git branch -d`, `git push origin main`, `rm -rf node_modules`, `rm` im Scratchpad unter `/private/tmp/...`, Heredoc-Texte mit verbotenen Wörtern — alles erlaubt (Tests in Task 2).
- Alte Events ohne neue Felder (`package` statt `package_id`, kein `usage`) dürfen das Dashboard nicht brechen (Test in Task 5).
- Fehlende/kaputte Transkripte oder Doku-Dateien liefern leere Teile statt Absturz (Tests in Task 1, 3, 6).
- `/archiv/`-Route: Pfad-Traversal (`../`), Symlinks, fremde Endungen → 404 (Test in Task 8).
- SessionStart-Kontext bleibt unter 9 500 Zeichen, auch bei langen Dateien (Test in Task 6).

---

## Dateistruktur

| Datei | Verantwortung |
| --- | --- |
| `tools/studio/studio_docs.py` (neu) | Lesen/Schreiben von VERFASSUNG, STUDIO-Version, CHANGELOG, Warteschlange, Experimente, lernen, Metrik-JSON, Persona-Frontmatter |
| `tools/studio/guard.py` (neu) | PreToolUse-Verbote (irreversibel, Verfassung) und Freigabe-Marke (UserPromptSubmit) |
| `tools/studio/usage.py` (neu) | Tokens je Modell aus Transkripten, inkrementell; `cost-state` |
| `tools/studio/context.py` (neu) | SessionStart-Kontext (≤ 9 500 Zeichen) |
| `tools/studio/effort.py` (neu) | Reine Aggregation: Delegationen, Aufwand, Qualität, Vorfälle |
| `tools/studio/metrics.py` (neu) | CLI: Verdichtung nach `docs/studio/metriken/<kennung>.md` |
| `tools/studio/ci.py` (neu) | CLI: CI-Läufe über `gh` als Events |
| `tools/studio/hook.py` | neue Event-Felder, Archiv, Usage, Kontext, Vorfall-Hinweis |
| `tools/studio/log.py` | neue Arten `result`, `milestone`, `retro`, `queue`; `package_id`; Archivordner |
| `tools/studio/model.py` | neue Knotenfelder und Handler; `records` und Effort-Ausgabe |
| `tools/studio/server.py` | Doku-Bündel, Effort, `/archiv/` |
| `tools/studio/dashboard/*` | Reiter und neue Ansichten |
| `docs/studio/*` | Verfassung, Handbuch 1.0, CHANGELOG, Warteschlange, Experimente, lernen, retros/, metriken/, Vorlagen |
| `.claude/output-styles/projektleiter.md`, `.claude/settings.json` | L0 als Standard, Guard-Hooks |
| `.claude/agents/*.md` | `version: 1.0`, neue Persona `studio-coach` |

---

### Task 1: `studio_docs.py` — Studio-Dokumente lesen und schreiben

**Files:**
- Create: `tools/studio/studio_docs.py`
- Test: `tools/studio/tests/test_studio_docs.py`

**Interfaces:**
- Produces (alle Pfade als `Path`, `docs` = Verzeichnis `docs/studio`):
  - `read_version(path: Path) -> str` — Wert der Zeile `Version: X.Y` in den ersten 15 Zeilen, sonst `""`.
  - `persona_meta(agents: Path) -> dict[str, dict]` — `name → {"version", "model", "description", "tools"}` aus Frontmatter (fehlende Werte `""`; `model` fehlt → `"inherit"`).
  - `changelog(docs: Path) -> list[dict]` — `[{"date", "subject", "version", "lines": [str]}]` in Dateireihenfolge.
  - `experiments(docs: Path) -> list[dict]` — `[{"id", "status", "title", "fields": {str: str}}]`.
  - `queue_entries(docs: Path) -> list[dict]` — `[{"id", "status", "date", "title", "fields": {str: str}}]`.
  - `queue_add(docs, entry_id, title, question, recommendation, reason, cost, blocks, source, date) -> None` — wirft `ValueError`, wenn die ID existiert.
  - `queue_update(docs, entry_id, *, answer: str | None = None, status: str | None = None) -> bool`.
  - `content_lines(text: str) -> int` — Zeilen, die nicht leer, keine Überschrift (`#`) und kein HTML-Kommentar sind.
  - `read_text(path: Path) -> str` — Inhalt oder `""`.
  - `metrics_history(docs: Path) -> list[dict]` — JSON-Blöcke aus `docs/metriken/*.md` (Abschnitt `## Rohwerte`, erster ```` ```json ````-Block), sortiert nach `created`.
  - `bundle(docs: Path, agents: Path) -> dict` — `{"handbook_version", "constitution_version", "changelog", "experiments", "queue", "lernen", "personas", "history"}`; jeder Teil einzeln abgesichert (Fehler → leerer Wert).
  - Konstanten: `QUEUE_STATUSES = ("offen", "beantwortet", "umgesetzt")`, `EXPERIMENT_STATUSES = ("vorgeschlagen", "laufend", "behalten", "angepasst", "zurückgenommen", "abgelehnt")`.

Formate (exakt):

```markdown
## N-001 · offen · 2026-09-30 · Kurztitel
- Frage: …
- Empfehlung: …
- Begründung: …
- Kosten des Wartens: …
- Blockiert: M5-03
- Von: lead-tech
- Antwort: –
```

```markdown
## E-001 · laufend · Kurztitel
- Hypothese: …
- Messgrösse: …
- Zeitraum: …
- Rückfall: …
- Ruling: R40
- Start: Handbuch 1.1
- Bewertung: –
```

```markdown
## 2026-09-30 · Handbuch 1.0
## 2026-10-02 · Persona lead-tech 1.1
```

- [ ] **Step 1: Failing tests schreiben** — `tools/studio/tests/test_studio_docs.py`:

```python
import json
import tempfile
import unittest
from pathlib import Path

import studio_docs as sd

QUEUE_HEAD = "# Warteschlange\n\nText.\n\n---\n"


class DocsTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.docs = Path(self.tmp.name) / "docs"
        self.docs.mkdir()
        self.agents = Path(self.tmp.name) / "agents"
        self.agents.mkdir()

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, name, text):
        path = self.docs / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, "utf-8")
        return path

    def test_read_version(self):
        path = self.write("STUDIO.md", "# Handbuch\n\nVersion: 1.2 · Stand x\n")
        self.assertEqual(sd.read_version(path), "1.2")
        self.assertEqual(sd.read_version(self.docs / "fehlt.md"), "")

    def test_persona_meta(self):
        (self.agents / "lead-qa.md").write_text(
            "---\nname: lead-qa\ndescription: 'QA: x'\ntools: Read, Bash\n"
            "model: opus\nversion: 1.1\n---\nText\n",
            "utf-8",
        )
        (self.agents / "kaputt.md").write_text("kein frontmatter", "utf-8")
        meta = sd.persona_meta(self.agents)
        self.assertEqual(list(meta), ["lead-qa"])
        self.assertEqual(meta["lead-qa"]["version"], "1.1")
        self.assertEqual(meta["lead-qa"]["description"], "QA: x")

    def test_changelog(self):
        self.write(
            "CHANGELOG.md",
            "# Changelog\n\n## 2026-10-02 · Persona lead-tech 1.1\n- Anlass: a\n\n"
            "## 2026-09-30 · Handbuch 1.0\n- Anlass: Start\n",
        )
        log = sd.changelog(self.docs)
        self.assertEqual(
            [(e["subject"], e["version"]) for e in log],
            [("Persona lead-tech", "1.1"), ("Handbuch", "1.0")],
        )
        self.assertEqual(log[1]["lines"], ["- Anlass: Start"])

    def test_queue_roundtrip(self):
        self.write("warteschlange.md", QUEUE_HEAD)
        sd.queue_add(
            self.docs, "N-001", "Neue Abhängigkeit", "Paket x?", "Nein", "weil",
            "M5-03 wartet", "M5-03", "lead-tech", "2026-09-30",
        )
        with self.assertRaises(ValueError):
            sd.queue_add(self.docs, "N-001", "t", "q", "r", "b", "c", "", "x", "d")
        entry = sd.queue_entries(self.docs)[0]
        self.assertEqual((entry["id"], entry["status"]), ("N-001", "offen"))
        self.assertEqual(entry["fields"]["Blockiert"], "M5-03")
        self.assertTrue(sd.queue_update(self.docs, "N-001", answer="Ja, ok"))
        entry = sd.queue_entries(self.docs)[0]
        self.assertEqual(entry["status"], "beantwortet")
        self.assertEqual(entry["fields"]["Antwort"], "Ja, ok")
        self.assertTrue(sd.queue_update(self.docs, "N-001", status="umgesetzt"))
        self.assertEqual(sd.queue_entries(self.docs)[0]["status"], "umgesetzt")
        self.assertFalse(sd.queue_update(self.docs, "N-999", answer="x"))
        self.assertIn("Text.", (self.docs / "warteschlange.md").read_text("utf-8"))

    def test_experiments_and_content_lines(self):
        self.write(
            "experimente.md",
            "# Experimente\n\n## E-001 · laufend · Kürzere Briefings\n"
            "- Hypothese: h\n- Messgrösse: m\n",
        )
        exp = sd.experiments(self.docs)
        self.assertEqual((exp[0]["id"], exp[0]["status"]), ("E-001", "laufend"))
        self.assertEqual(exp[0]["fields"]["Messgrösse"], "m")
        self.assertEqual(sd.content_lines("# T\n\n<!-- k -->\n- a\n- b\n"), 2)

    def test_metrics_history(self):
        block = json.dumps({"kennung": "M5", "created": "2026-10-01T00:00:00Z"})
        self.write("metriken/M5.md", f"# M\n\n## Rohwerte\n\n```json\n{block}\n```\n")
        self.write("metriken/kaputt.md", "## Rohwerte\n\n```json\n{kaputt\n```\n")
        self.assertEqual([h["kennung"] for h in sd.metrics_history(self.docs)], ["M5"])

    def test_bundle_tolerates_missing_files(self):
        data = sd.bundle(self.docs, self.agents)
        self.assertEqual(data["queue"], [])
        self.assertEqual(data["handbook_version"], "")
        self.assertEqual(data["personas"], [])
```

- [ ] **Step 2: Tests laufen lassen** — `make studio-test` → FAIL (`No module named 'studio_docs'`).

- [ ] **Step 3: Implementieren** — `tools/studio/studio_docs.py`:

```python
"""Studio-Dokumente unter docs/studio lesen und schreiben (Formate: STUDIO.md)."""

from __future__ import annotations

import json
import re
from pathlib import Path

QUEUE_STATUSES = ("offen", "beantwortet", "umgesetzt")
EXPERIMENT_STATUSES = (
    "vorgeschlagen",
    "laufend",
    "behalten",
    "angepasst",
    "zurückgenommen",
    "abgelehnt",
)
VERSION_RE = re.compile(r"^Version:\s*(\d+\.\d+)")
QUEUE_RE = re.compile(r"^## (N-\d+) · (\S+) · (\d{4}-\d{2}-\d{2}) · (.+?)\s*$")
EXPERIMENT_RE = re.compile(r"^## (E-\d+) · (\S+) · (.+?)\s*$")
CHANGELOG_RE = re.compile(
    r"^## (\d{4}-\d{2}-\d{2}) · (Handbuch|Persona [a-z0-9-]+) (\d+\.\d+)\s*$"
)
FIELD_RE = re.compile(r"^- ([^:]+):\s?(.*)$")
QUEUE_FIELDS = (
    "Frage",
    "Empfehlung",
    "Begründung",
    "Kosten des Wartens",
    "Blockiert",
    "Von",
    "Antwort",
)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError:
        return ""


def read_version(path: Path) -> str:
    for line in read_text(path).splitlines()[:15]:
        match = VERSION_RE.match(line.strip())
        if match:
            return match.group(1)
    return ""


def _frontmatter(text: str) -> dict[str, str]:
    lines = text.splitlines()
    if not lines or lines[0].strip() != "---":
        return {}
    meta: dict[str, str] = {}
    for line in lines[1:]:
        if line.strip() == "---":
            return meta
        key, sep, value = line.partition(":")
        if sep:
            meta[key.strip()] = value.strip().strip("'\"")
    return {}


def persona_meta(agents: Path) -> dict[str, dict]:
    result: dict[str, dict] = {}
    if not agents.is_dir():
        return result
    for path in sorted(agents.glob("*.md")):
        meta = _frontmatter(read_text(path))
        if not meta.get("name"):
            continue
        result[meta["name"]] = {
            "version": meta.get("version", ""),
            "model": meta.get("model") or "inherit",
            "description": meta.get("description", ""),
            "tools": meta.get("tools", ""),
        }
    return result


def _sections(text: str, pattern: re.Pattern) -> list[tuple[re.Match, list[str]]]:
    sections: list[tuple[re.Match, list[str]]] = []
    for line in text.splitlines():
        match = pattern.match(line)
        if match:
            sections.append((match, []))
        elif line.startswith("## "):
            sections.append((None, []))  # fremde Überschrift beendet den Abschnitt
        elif sections:
            sections[-1][1].append(line)
    return [(m, body) for m, body in sections if m is not None]


def _fields(body: list[str]) -> dict[str, str]:
    fields: dict[str, str] = {}
    for line in body:
        match = FIELD_RE.match(line.strip())
        if match:
            fields[match.group(1).strip()] = match.group(2).strip()
    return fields


def changelog(docs: Path) -> list[dict]:
    text = read_text(docs / "CHANGELOG.md")
    return [
        {
            "date": m.group(1),
            "subject": m.group(2),
            "version": m.group(3),
            "lines": [line for line in body if line.strip()],
        }
        for m, body in _sections(text, CHANGELOG_RE)
    ]


def experiments(docs: Path) -> list[dict]:
    text = read_text(docs / "experimente.md")
    return [
        {"id": m.group(1), "status": m.group(2), "title": m.group(3), "fields": _fields(b)}
        for m, b in _sections(text, EXPERIMENT_RE)
    ]


def queue_entries(docs: Path) -> list[dict]:
    text = read_text(docs / "warteschlange.md")
    return [
        {
            "id": m.group(1),
            "status": m.group(2),
            "date": m.group(3),
            "title": m.group(4),
            "fields": _fields(b),
        }
        for m, b in _sections(text, QUEUE_RE)
    ]


def _one_line(text: str) -> str:
    return " ".join(str(text or "").split()) or "–"


def queue_add(
    docs: Path,
    entry_id: str,
    title: str,
    question: str,
    recommendation: str,
    reason: str,
    cost: str,
    blocks: str,
    source: str,
    date: str,
) -> None:
    if any(e["id"] == entry_id for e in queue_entries(docs)):
        raise ValueError(f"{entry_id} existiert bereits")
    path = docs / "warteschlange.md"
    values = (question, recommendation, reason, cost, blocks or "nichts", source, "–")
    lines = [f"## {entry_id} · offen · {date} · {_one_line(title)}"]
    lines += [f"- {k}: {_one_line(v)}" for k, v in zip(QUEUE_FIELDS, values)]
    text = read_text(path).rstrip("\n")
    path.write_text(text + "\n\n" + "\n".join(lines) + "\n", encoding="utf-8")


def queue_update(
    docs: Path,
    entry_id: str,
    *,
    answer: str | None = None,
    status: str | None = None,
) -> bool:
    path = docs / "warteschlange.md"
    lines = read_text(path).splitlines()
    found, inside = False, False
    new_status = status or ("beantwortet" if answer is not None else None)
    for index, line in enumerate(lines):
        match = QUEUE_RE.match(line)
        if match or line.startswith("## "):
            inside = bool(match and match.group(1) == entry_id)
            if inside:
                found = True
                if new_status:
                    lines[index] = (
                        f"## {entry_id} · {new_status} · {match.group(3)} · "
                        f"{match.group(4)}"
                    )
            continue
        if inside and answer is not None and line.strip().startswith("- Antwort:"):
            lines[index] = f"- Antwort: {_one_line(answer)}"
    if found:
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return found


def content_lines(text: str) -> int:
    count, in_comment = 0, False
    for raw in text.splitlines():
        line = raw.strip()
        if in_comment:
            in_comment = "-->" not in line
            continue
        if line.startswith("<!--"):
            in_comment = "-->" not in line
            continue
        if line and not line.startswith("#"):
            count += 1
    return count


def metrics_history(docs: Path) -> list[dict]:
    items = []
    folder = docs / "metriken"
    if not folder.is_dir():
        return items
    for path in sorted(folder.glob("*.md")):
        text = read_text(path)
        _, _, tail = text.partition("## Rohwerte")
        match = re.search(r"```json\n(.*?)\n```", tail, re.S)
        if not match:
            continue
        try:
            data = json.loads(match.group(1))
        except ValueError:
            continue
        if isinstance(data, dict):
            data["file"] = path.name
            items.append(data)
    return sorted(items, key=lambda d: str(d.get("created", "")))


def bundle(docs: Path, agents: Path) -> dict:
    def safe(func, default):
        try:
            return func()
        except Exception:  # noqa: BLE001 — eine kaputte Datei kippt nicht alles
            return default

    personas = safe(lambda: persona_meta(agents), {})
    return {
        "handbook_version": safe(lambda: read_version(docs / "STUDIO.md"), ""),
        "constitution_version": safe(lambda: read_version(docs / "VERFASSUNG.md"), ""),
        "changelog": safe(lambda: changelog(docs), []),
        "experiments": safe(lambda: experiments(docs), []),
        "queue": safe(lambda: queue_entries(docs), []),
        "lernen": safe(lambda: read_text(docs / "lernen.md"), ""),
        "personas": [{"name": k, **v} for k, v in personas.items()],
        "history": safe(lambda: metrics_history(docs), []),
    }
```

- [ ] **Step 4: Tests grün** — `make studio-test` → PASS.
- [ ] **Step 5: Commit** — `git add tools/studio/studio_docs.py tools/studio/tests/test_studio_docs.py && git commit -m "feat: Studio-Dokumente parsen und schreiben (studio_docs.py)"`

---

### Task 2: `guard.py` — verbotene Aktionen und Verfassungs-Schutz

**Files:**
- Create: `tools/studio/guard.py`
- Modify: `.claude/settings.json` (neue Hook-Einträge)
- Test: `tools/studio/tests/test_guard.py`

**Interfaces:**
- Consumes: `paths.repo_root()`, `paths.studio_home()`.
- Produces:
  - `bash_reason(command: str, root: Path, cwd: Path, env: Mapping[str, str], allow_constitution: bool) -> str | None` — Grund bei Verbot, sonst `None`.
  - `file_reason(path: str, allow_constitution: bool) -> str | None` — für Edit/Write/MultiEdit/NotebookEdit.
  - `decide(payload: dict, root: Path, marker_dir: Path, env) -> str | None`.
  - `CONSTITUTION = "docs/studio/VERFASSUNG.md"`, `APPROVAL_PHRASE = "VERFASSUNG ÄNDERN"`.
  - Ausgabe bei Verbot (stdout, Exit 0):
    `{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": "<Grund> (Verfassung §6)"}}`.

Regeln (siehe Spec, Abschnitt „Verbotene irreversible Aktionen" und „Verfassungs-Schutz"):

1. Heredoc-Körper entfernen (`<<-?\s*['"]?(\w+)['"]?` bis zur Zeile, die nur den Begrenzer enthält), Zeilenumbrüche durch ` ; ` ersetzen, dann `shlex.shlex(command, posix=True, punctuation_chars=True)` mit `whitespace_split = True`; bei `ValueError` → `None` (erlauben).
2. In Segmente an `;`, `&&`, `||`, `|`, `&` zerlegen; führende `VAR=wert`, `sudo`, `env`, `command`, `nohup`, `time` überspringen.
3. `git`: globale Optionen (`-C <x>`, `-c <x>`, `--git-dir=…`, `--work-tree=…`, `--no-pager`) überspringen; dann je Unterbefehl:
   - `push`: Verbot bei `--force*`, `--mirror`, `--delete`, `-d`, `-f`, Kurzflag-Bündel mit `f` oder `d` (z. B. `-fu`), Argument mit `+`-Präfix oder `:`-Präfix (Länge > 1).
   - `branch`: `-D`, Bündel mit `D`, oder (`-d`/`--delete`/Bündel mit `d`) zusammen mit (`-f`/`--force`/Bündel mit `f`).
   - `rebase`: erlaubt nur mit `--abort`, `--quit`, `--continue`.
   - `reset` mit `--hard`; `filter-branch`; `filter-repo`; `update-ref` mit `-d`; `reflog expire|delete`; `stash clear|drop`; `clean` mit `-f`/`--force`/Bündel mit `f`; `worktree remove` mit `-f`/`--force`; `gc` mit `--prune=now`.
   - Verfassung (nur wenn `allow_constitution` falsch): `checkout`, `restore`, `rm`, `mv` mit einem Argument, das auf `VERFASSUNG.md` endet.
4. `rm`, `rmdir`, `unlink`, `shred`: jedes Nicht-Options-Argument auflösen (`~` und `$VAR` per `os.path.expanduser`/`os.path.expandvars` mit `env`; relativ gegen `cwd`); Verbot, wenn ausserhalb `root` und nicht unter `/tmp`, `/private/tmp`, `/var/folders`, `/private/var/folders` oder `env["TMPDIR"]`. Zusätzlich Verfassung: Ziel endet auf `VERFASSUNG.md`.
5. `find` mit `-delete` oder `-exec rm`: Pfad-Argumente (vor dem ersten Argument, das mit `-`, `(` oder `!` beginnt) wie unter 4.
6. Verfassung schreibend (nur ohne Freigabe): Umleitung `>`/`>>` auf ein Ziel, das auf `VERFASSUNG.md` endet; `tee`, `truncate`, `dd` mit solchem Argument; `sed`/`perl` mit `-i`/`-pi`/Bündel mit `i` und solchem Argument; `mv` mit solchem Argument; `cp` mit solchem Ziel (letztes Argument).
7. `file_reason`: Pfad (normalisiert, `/`-Trenner) endet auf `docs/studio/VERFASSUNG.md` und keine Freigabe → Grund.
8. `bash`, `sh`, `zsh` mit `-c <text>` und `eval <text…>`: `<text>` rekursiv mit denselben Regeln prüfen (Tiefe ≤ 3).
9. Mitgeschützt wie die Verfassung (nur mit Freigabe): Schreiben auf `tools/studio/guard.py` (Edit/Write und Bash-Schreibmuster aus 6), jeder Bash-Befehl, der `verfassung-ok` enthält und nicht rein lesend ist (`ls`, `cat`, `test`), und `claude` mit einem Argument, das `APPROVAL_PHRASE` enthält (immer verboten, auch mit Freigabe).
10. Freigabe gilt nur, wenn der PreToolUse-Payload **kein** `agent_id` hat (Hauptsession).
11. Wurzel: `root = paths.repo_root()` (Hauptrepo, auch aus Worktrees); `cwd = payload["cwd"]` oder `root`.
12. Freigabe setzen: `UserPromptSubmit` ohne `agent_id`, Prompt beginnt nicht mit `<task-notification>` oder `<agent-message` und enthält `APPROVAL_PHRASE` → Marke `marker_dir/<session_id>` anlegen (Session-ID nur `[A-Za-z0-9_-]+`). `decide` liest die Marke.

- [ ] **Step 1: Failing tests** — `tools/studio/tests/test_guard.py`:

```python
import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

import guard

ROOT = Path("/repo")
ENV = {"HOME": "/Users/x", "TMPDIR": "/var/folders/ab/T/"}


def reason(cmd, allow=False, cwd=ROOT):
    return guard.bash_reason(cmd, ROOT, cwd, ENV, allow)


class BashTest(unittest.TestCase):
    def test_allowed_everyday_work(self):
        for cmd in [
            "git status && git diff --stat",
            "git merge --no-ff --no-commit feat/x",
            "git merge --abort",
            "git worktree add .worktrees/m5 -b feat/m5",
            "git worktree remove .worktrees/m5",
            "git branch -d feat/m5",
            "git push origin main",
            "git push -u origin feat/x",
            "git rebase --abort",
            "git reset --soft HEAD~1",
            "rm -rf node_modules dist",
            "rm -f /private/tmp/claude-501/x/scratch.txt",
            "rm -rf $TMPDIR/probe",
            "find . -name '*.pyc' -delete",
            "rm -rf /repo/.studio/qa/M5-03",
            "git -C .worktrees/m5 status",
            "cat docs/studio/VERFASSUNG.md",
            "cp docs/studio/VERFASSUNG.md /tmp/v.md",
            "cat > notes.md <<'EOF'\ngit push --force\nrm -rf /\nEOF",
            'git commit -m "docs: nie git reset --hard"',
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNone(reason(cmd))

    def test_forbidden_irreversible(self):
        for cmd in [
            "git push --force origin main",
            "git push -f",
            "git push -fu origin x",
            "git push --force-with-lease",
            "git push origin +main",
            "git push origin :feat/x",
            "git push origin --delete feat/x",
            "git -C /repo push --mirror",
            "git branch -D feat/x",
            "git branch -df feat/x",
            "git rebase main",
            "git reset --hard origin/main",
            "git filter-branch --tree-filter x",
            "git filter-repo --path x",
            "git reflog expire --all",
            "git stash clear",
            "git clean -fdx",
            "git worktree remove --force .worktrees/x",
            "rm -rf ~/Documents",
            "rm -rf /Users/x/other",
            "rm -rf ../other-repo",
            "cd /tmp && rm -r $HOME/x",
            "find /Users/x -name y -delete",
            "echo ok; git push --force",
            "git -C .worktrees/m5 reset --hard",
            "git -c core.x=1 push --force",
            "bash -c 'git push --force'",
            "sh -c \"rm -rf ~/x\"",
            "git status\ngit branch -D x",
            "claude -p 'VERFASSUNG ÄNDERN'",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNotNone(reason(cmd))

    def test_constitution_bash(self):
        for cmd in [
            "echo x > docs/studio/VERFASSUNG.md",
            "sed -i '' 's/a/b/' docs/studio/VERFASSUNG.md",
            "tee docs/studio/VERFASSUNG.md < x",
            "git checkout -- docs/studio/VERFASSUNG.md",
            "mv x docs/studio/VERFASSUNG.md",
            "rm docs/studio/VERFASSUNG.md",
            "touch .studio/verfassung-ok/s1",
            "echo x >> tools/studio/guard.py",
        ]:
            with self.subTest(cmd=cmd):
                self.assertIsNotNone(reason(cmd))
                self.assertIsNone(reason(cmd, allow=True))

    def test_unparsable_is_allowed(self):
        self.assertIsNone(reason("echo 'offen"))

    def test_worktree_cwd(self):
        cwd = Path("/repo/.worktrees/m5")
        self.assertIsNone(reason("rm -rf ../../.studio/qa/x", cwd=cwd))
        self.assertIsNotNone(reason("rm -rf ../../../elsewhere", cwd=cwd))


class FileTest(unittest.TestCase):
    def test_constitution_file(self):
        path = "/repo/.worktrees/x/docs/studio/VERFASSUNG.md"
        self.assertIsNotNone(guard.file_reason(path, False))
        self.assertIsNone(guard.file_reason(path, True))
        self.assertIsNone(guard.file_reason("/repo/docs/studio/STUDIO.md", False))


class HookTest(unittest.TestCase):
    def run_hook(self, payload, home):
        env = {**os.environ, "STUDIO_HOME": home}
        result = subprocess.run(
            [sys.executable, str(Path(guard.__file__))],
            input=json.dumps(payload),
            capture_output=True,
            text=True,
            env=env,
            check=False,
        )
        self.assertEqual(result.returncode, 0)
        return json.loads(result.stdout) if result.stdout.strip() else None

    def test_deny_output_and_approval(self):
        with tempfile.TemporaryDirectory() as home:
            edit = {
                "hook_event_name": "PreToolUse",
                "session_id": "s1",
                "tool_name": "Edit",
                "tool_input": {"file_path": "/r/docs/studio/VERFASSUNG.md"},
            }
            out = self.run_hook(edit, home)
            decision = out["hookSpecificOutput"]
            self.assertEqual(decision["permissionDecision"], "deny")
            note = {
                "hook_event_name": "UserPromptSubmit",
                "session_id": "s1",
                "prompt": "<task-notification>VERFASSUNG ÄNDERN",
            }
            self.assertIsNone(self.run_hook(note, home))
            self.assertIsNotNone(self.run_hook(edit, home))
            ok = {**note, "prompt": "Bitte §7 anpassen. VERFASSUNG ÄNDERN"}
            self.run_hook(ok, home)
            self.assertIsNone(self.run_hook(edit, home))
            sub = {**edit, "agent_id": "a1"}
            self.assertIsNotNone(self.run_hook(sub, home))  # nur Hauptsession
            guard_edit = {**edit, "tool_input": {"file_path": "/r/tools/studio/guard.py"}}
            self.assertIsNone(self.run_hook(guard_edit, home))
            other = {**guard_edit, "session_id": "s2"}
            self.assertIsNotNone(self.run_hook(other, home))

    def test_garbage_input(self):
        with tempfile.TemporaryDirectory() as home:
            env = {**os.environ, "STUDIO_HOME": home}
            result = subprocess.run(
                [sys.executable, str(Path(guard.__file__))],
                input="kein json",
                capture_output=True,
                text=True,
                env=env,
                check=False,
            )
            self.assertEqual((result.returncode, result.stdout), (0, ""))
```

- [ ] **Step 2: Tests laufen lassen** → FAIL (`No module named 'guard'`).
- [ ] **Step 3: `guard.py` implementieren** nach den Regeln oben. Gerüst:

```python
"""PreToolUse-Guard: verbietet irreversible Aktionen und schützt die Verfassung.

Regeln: docs/studio/VERFASSUNG.md §6 und §1. Best effort; Fehler lassen zu.
"""

from __future__ import annotations

import json
import os
import re
import shlex
import sys
from collections.abc import Mapping
from pathlib import Path

from paths import repo_root, studio_home

CONSTITUTION = "docs/studio/VERFASSUNG.md"
APPROVAL_PHRASE = "VERFASSUNG ÄNDERN"
AGENT_MESSAGE_PREFIXES = ("<task-notification>", "<agent-message")
FILE_TOOLS = ("Edit", "Write", "MultiEdit", "NotebookEdit")
SEPARATORS = {";", "&&", "||", "|", "&", ";;"}
PREFIXES = {"sudo", "env", "command", "nohup", "time"}
TEMP_ROOTS = ("/tmp", "/private/tmp", "/var/folders", "/private/var/folders")
HEREDOC = re.compile(r"<<-?\s*['\"]?(\w+)['\"]?")
FORBIDDEN = "Irreversible Aktion ist verboten (Verfassung §6)"
PROTECTED = "Die Verfassung ändert nur der Nutzer (Verfassung §1); Vorschlag in die Warteschlange"


def strip_heredocs(command: str) -> str:
    out, lines, index = [], command.split("\n"), 0
    while index < len(lines):
        line = lines[index]
        out.append(line)
        match = HEREDOC.search(line)
        index += 1
        if match:
            end = match.group(1)
            while index < len(lines) and lines[index].strip() != end:
                index += 1
            index += 1
    return "\n".join(out)


def segments(command: str) -> list[list[str]]:
    lexer = shlex.shlex(
        strip_heredocs(command).replace("\n", " ; "), posix=True, punctuation_chars=True
    )
    lexer.whitespace_split = True
    parts: list[list[str]] = [[]]
    for token in lexer:
        if token in SEPARATORS:
            parts.append([])
        else:
            parts[-1].append(token)
    result = []
    for words in parts:
        while words and ("=" in words[0].split("/")[0] or words[0] in PREFIXES):
            if "=" in words[0] and not words[0].startswith("="):
                words = words[1:]
            elif words[0] in PREFIXES:
                words = words[1:]
            else:
                break
        if words:
            result.append(words)
    return result
```

Weitere Funktionen: `_short_flags(args) -> set[str]` (Buchstaben aller Argumente der Form `-abc`, nicht `--`), `_is_constitution(arg) -> bool` (`arg.replace("\\", "/").endswith("VERFASSUNG.md")`), `_outside(arg, root, cwd, env) -> bool`, `_git_reason(args, allow) -> str | None`, `bash_reason(...)` (je Segment `cd <ziel>` verfolgen: `cwd` für folgende Segmente setzen), `file_reason`, `decide`, `main` (liest stdin; bei `UserPromptSubmit` Marke anlegen; bei `PreToolUse` `decide` und Deny-JSON ausgeben; alles in `try/except Exception: return 0`).

- [ ] **Step 4: Tests grün** — `make studio-test` → PASS.
- [ ] **Step 5:** (Registrierung in `.claude/settings.json` erst in Task 11, damit L0 die Verfassung bis zum Final-Review noch anpassen kann.)

- [ ] **Step 6: Manuelle Probe** — `echo '{"hook_event_name":"PreToolUse","session_id":"s","tool_name":"Bash","tool_input":{"command":"git push --force"}}' | python3 tools/studio/guard.py` → Deny-JSON.
- [ ] **Step 7: Commit** — `feat: Guard verbietet irreversible Aktionen und schützt die Verfassung`

---

### Task 3: `usage.py` — Tokens aus Transkripten

**Files:**
- Create: `tools/studio/usage.py`
- Test: `tools/studio/tests/test_usage.py`

**Interfaces:**
- Produces:
  - `class Accumulator` mit `feed_line(raw: bytes | str, main_only: bool = False) -> None`, `summary() -> dict[str, dict]` (`model → {"input", "cache_write", "cache_read", "output", "messages", "complete"}`), `to_json() -> dict`, `Accumulator.from_json(data) -> Accumulator`. Je Message-ID werden die Maxima der Felder gehalten; `complete` zählt Messages mit `stop_reason`. `main_only=True` überspringt Einträge mit `isSidechain: true`.
  - `transcript_usage(path: Path, main_only: bool = False) -> dict` — ganze Datei; fehlt/kaputt → `{}`.
  - `incremental_usage(path: Path, cache: Path) -> dict` — liest ab dem gespeicherten Byte-Offset (nur vollständige Zeilen), speichert `{"offset", "inode", "acc"}` in `cache`; bei anderem Inode oder kleinerer Datei von vorn; `main_only=True`.
  - `subagent_transcript(transcript_path: str, agent_id: str) -> Path` — `Path(tp).with_suffix("") / "subagents" / f"agent-{agent_id}.jsonl"`; liegt `tp` bereits in einem `subagents`-Ordner, dessen Geschwisterdatei.
  - `session_cost(path: Path) -> dict | None` — letzter `{"type": "cost-state"}`-Eintrag: `{"total_usd", "duration_ms", "models": {model: {"input", "output", "cache_read", "cache_write", "usd"}}}`.
  - `is_lower_bound(summary: dict) -> bool` — `True`, wenn irgendein Modell `complete < messages`.

- [ ] **Step 1: Failing tests** — `tools/studio/tests/test_usage.py`:

```python
import json
import tempfile
import unittest
from pathlib import Path

import usage


def msg(mid, out, stop=None, model="claude-opus-5-5", side=False, cr=100):
    return json.dumps(
        {
            "type": "assistant",
            "isSidechain": side,
            "message": {
                "id": mid,
                "model": model,
                "stop_reason": stop,
                "usage": {
                    "input_tokens": 2,
                    "cache_creation_input_tokens": 10,
                    "cache_read_input_tokens": cr,
                    "output_tokens": out,
                },
            },
        }
    )


class UsageTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.dir = Path(self.tmp.name)

    def tearDown(self):
        self.tmp.cleanup()

    def test_dedupe_and_lower_bound(self):
        path = self.dir / "t.jsonl"
        path.write_text(
            "\n".join(
                [
                    msg("m1", 8),
                    msg("m1", 328, stop="tool_use"),
                    msg("m2", 16),
                    json.dumps({"type": "user"}),
                    "kaputt",
                    msg("m3", 5, model="claude-sonnet-5-5", stop="end_turn"),
                ]
            )
            + "\n",
            "utf-8",
        )
        summary = usage.transcript_usage(path)
        opus = summary["claude-opus-5-5"]
        self.assertEqual(
            (opus["output"], opus["messages"], opus["complete"], opus["cache_read"]),
            (344, 2, 1, 200),
        )
        self.assertTrue(usage.is_lower_bound(summary))
        self.assertEqual(summary["claude-sonnet-5-5"]["output"], 5)
        self.assertEqual(usage.transcript_usage(self.dir / "fehlt.jsonl"), {})

    def test_incremental_main_only(self):
        path, cache = self.dir / "main.jsonl", self.dir / "cache.json"
        path.write_text(msg("a", 10, stop="end_turn") + "\n", "utf-8")
        first = usage.incremental_usage(path, cache)
        self.assertEqual(first["claude-opus-5-5"]["output"], 10)
        with open(path, "a", encoding="utf-8") as handle:
            handle.write(msg("b", 5, stop="end_turn") + "\n")
            handle.write(msg("c", 99, side=True) + "\n")
            handle.write(msg("d", 7)[:20])  # halbe Zeile
        second = usage.incremental_usage(path, cache)
        self.assertEqual(second["claude-opus-5-5"]["output"], 15)
        self.assertEqual(second["claude-opus-5-5"]["messages"], 2)

    def test_subagent_path_and_cost(self):
        tp = "/p/proj/abc.jsonl"
        self.assertEqual(
            usage.subagent_transcript(tp, "a1"),
            Path("/p/proj/abc/subagents/agent-a1.jsonl"),
        )
        inner = "/p/proj/abc/subagents/agent-a0.jsonl"
        self.assertEqual(
            usage.subagent_transcript(inner, "a1"),
            Path("/p/proj/abc/subagents/agent-a1.jsonl"),
        )
        path = self.dir / "s.jsonl"
        cost = {
            "type": "cost-state",
            "totalCostUSD": 1.5,
            "totalDuration": 1000,
            "modelUsage": {
                "claude-opus-5-5": {
                    "inputTokens": 1,
                    "outputTokens": 2,
                    "cacheReadInputTokens": 3,
                    "cacheCreationInputTokens": 4,
                    "costUSD": 1.5,
                }
            },
        }
        path.write_text(json.dumps(cost) + "\n", "utf-8")
        result = usage.session_cost(path)
        self.assertEqual(result["total_usd"], 1.5)
        self.assertEqual(result["models"]["claude-opus-5-5"]["cache_write"], 4)
        self.assertIsNone(usage.session_cost(self.dir / "fehlt.jsonl"))
```

- [ ] **Step 2: FAIL prüfen.**
- [ ] **Step 3: Implementieren** (JSON je Zeile mit `json.loads`, Fehler überspringen; Cache-Datei atomar via `tmp` + `os.replace`; Datei-Lesen in Binärmodus, nur bis zum letzten `\n`).
- [ ] **Step 4: PASS prüfen.**
- [ ] **Step 5: Commit** — `feat: Token-Messung aus Transkripten (usage.py)`

---

### Task 4: `log.py` erweitern und `ci.py`

**Files:**
- Modify: `tools/studio/log.py`, `tools/studio/paths.py`
- Create: `tools/studio/ci.py`
- Test: `tools/studio/tests/test_log.py` (erweitern), `tools/studio/tests/test_ci.py`

**Interfaces:**
- Consumes: `studio_docs.read_version`, `studio_docs.queue_add`, `studio_docs.queue_update`.
- Produces:
  - `paths.docs_dir() -> Path` — `STUDIO_DOCS` (Env) oder `repo_root()/docs/studio`.
  - `paths.archive_dir() -> Path` — `studio_home()/"archiv"`.
  - Jedes `log.py`-Event trägt `handbook_version` (aus `docs_dir()/"STUDIO.md"`).
  - `status` und `package`: Option `--package`/`--id` schreibt Feld `package_id` (nicht mehr `package`); `status` bekommt `--milestone`.
  - Neue Arten (Felder exakt so):
    - `result --role R --package P --outcome {angenommen,nacharbeit,verworfen} --review-rounds N [--worker W] [--milestone M]` → `{"kind": "result", "role", "package_id", "outcome", "review_rounds": int, "worker", "milestone"}`.
    - `milestone --id M --status {start,done} [--title T]` → `{"kind": "milestone", "milestone", "status", "title"}`.
    - `retro --id ID --kind {meilenstein,session,adhoc} [--triggers a,b] [--report PFAD]` → `{"kind": "retro", "retro_id", "retro_kind", "triggers": [..], "report"}`.
    - `queue --id N-001 --title T --question Q --recommendation E --reason B --cost K [--blocks P] [--from R]` → Datei-Eintrag + Event `{"kind": "queue", "queue_id", "action": "add", "question", "blocks", "role"}`; `queue --id N-001 --answer "…"` → `action: "answer"`; `queue --id N-001 --done "…"` → Status `umgesetzt`, `action: "done"`, `summary`. Unbekannte ID → Exit 2 mit Meldung.
  - `decision --for user …` → Exit 2, Meldung „Nutzerentscheide gehen in die Warteschlange: log.py queue …", kein Event.
  - `archive` verschiebt nach `archive_dir()/"events"/events-<stamp>.jsonl`.
  - `ci.py`: `collect(runner, seen: set[str]) -> list[dict]` (reine Funktion; `runner()` liefert die JSON-Liste von `gh run list --branch main --limit 20 --json databaseId,conclusion,status,createdAt,headSha,workflowName,headBranch`), `main()` → Events `{"kind": "ci", "run_id", "conclusion", "branch", "sha", "workflow", "created", "source": "ci"}` für abgeschlossene, noch nicht gesehene Läufe; gesehene IDs in `studio_home()/"ci-seen.json"`. Ohne `gh` oder bei Fehler: Exit 0, keine Events.

- [ ] **Step 1: Failing tests** in `test_log.py` ergänzen (Muster der bestehenden Tests; `STUDIO_DOCS` auf ein Temp-Verzeichnis mit `STUDIO.md` „Version: 1.0" und `warteschlange.md` setzen):

```python
    def test_result_milestone_retro(self):
        self.run_log("result", "--role", "lead-tech", "--package", "M5-02",
                     "--outcome", "nacharbeit", "--review-rounds", "2",
                     "--worker", "tech-sim-engineer")
        self.run_log("milestone", "--id", "M5", "--status", "start", "--title", "Handel")
        self.run_log("retro", "--id", "RETRO-1", "--kind", "adhoc",
                     "--triggers", "ci:1,runden:M5-02")
        result, ms, retro = self.events()
        self.assertEqual((result["outcome"], result["review_rounds"]), ("nacharbeit", 2))
        self.assertEqual(result["package_id"], "M5-02")
        self.assertEqual(result["handbook_version"], "1.0")
        self.assertEqual((ms["milestone"], ms["status"]), ("M5", "start"))
        self.assertEqual(retro["triggers"], ["ci:1", "runden:M5-02"])

    def test_queue_lifecycle(self):
        code, _, _ = self.run_log(
            "queue", "--id", "N-001", "--title", "Lib x", "--question", "Darf x rein?",
            "--recommendation", "Nein", "--reason", "ADR-001", "--cost", "M5-03 wartet",
            "--blocks", "M5-03", "--from", "lead-tech")
        self.assertEqual(code, 0)
        self.assertEqual(self.run_log("queue", "--id", "N-001", "--answer", "Nein")[0], 0)
        self.assertEqual(self.run_log("queue", "--id", "N-001", "--done", "verworfen")[0], 0)
        self.assertEqual(self.run_log("queue", "--id", "N-404", "--answer", "x")[0], 2)
        text = (Path(self.docs) / "warteschlange.md").read_text("utf-8")
        self.assertIn("## N-001 · umgesetzt", text)
        self.assertEqual([e["action"] for e in self.events()], ["add", "answer", "done"])

    def test_decision_for_user_redirects(self):
        code, _, err = self.run_log("decision", "--id", "D-1", "--for", "user",
                                    "--question", "x")
        self.assertEqual(code, 2)
        self.assertIn("Warteschlange", err)
        self.assertEqual(self.events(), [])
```

Bestehende Tests, die `package` erwarten, auf `package_id` umstellen; Archiv-Test auf `archiv/events/` umstellen. `test_ci.py`:

```python
import unittest

import ci

RUNS = [
    {"databaseId": 1, "conclusion": "failure", "status": "completed",
     "createdAt": "2026-09-30T10:00:00Z", "headSha": "abc", "workflowName": "CI",
     "headBranch": "main"},
    {"databaseId": 2, "conclusion": "", "status": "in_progress",
     "createdAt": "2026-09-30T11:00:00Z", "headSha": "def", "workflowName": "CI",
     "headBranch": "main"},
]


class CiTest(unittest.TestCase):
    def test_collect_only_new_completed(self):
        events = ci.collect(lambda: RUNS, set())
        self.assertEqual([(e["run_id"], e["conclusion"]) for e in events], [("1", "failure")])
        self.assertEqual(ci.collect(lambda: RUNS, {"1"}), [])

    def test_runner_failure(self):
        def boom():
            raise OSError("gh fehlt")
        self.assertEqual(ci.collect(boom, set()), [])
```

- [ ] **Step 2: FAIL prüfen.**
- [ ] **Step 3: Implementieren.** `log.py`: Parser um die Unterbefehle ergänzen; `make_event` je Art; `queue` ruft `studio_docs` mit `docs_dir()` und heutigem Datum (`datetime.now().date().isoformat()`); `archive()` nutzt `archive_dir()/"events"`. `ci.py`: `subprocess.run(["gh", ...], capture_output=True, text=True, timeout=20, check=True)`; `collect` fängt jede Ausnahme und liefert `[]`.
- [ ] **Step 4: PASS prüfen** (`make studio-test`).
- [ ] **Step 5: Commit** — `feat: log.py kennt Ergebnis, Meilenstein, Retro und Warteschlange; ci.py`

---

### Task 5: `model.py` und `effort.py` — Datensätze, Aufwand, Qualität, Vorfälle

**Files:**
- Create: `tools/studio/effort.py`
- Modify: `tools/studio/model.py`
- Test: `tools/studio/tests/test_effort.py`, `tools/studio/tests/test_model.py` (erweitern)

**Interfaces:**
- Consumes: Events aus Task 4 und Task 6 (Felder siehe Spec-Tabelle „Event-Schema").
- Produces in `model.py`:
  - Knoten zusätzlich: `persona_version`, `handbook_version`, `milestone`, `estimate` (dict oder `None`), `briefing`, `report`, `usage` (dict), `tool_calls` (Zahl der PreToolUse-Events des Agenten: `heartbeat`, `bind`, `spawn`), `reported` (`{"duration_ms", "tool_count", "resolved_model"}` aus `spawned`), `resumes` (erneute Starts), `max_gap` (grösste Lücke zwischen zwei Lebenszeichen, solange der Status in `LIVE` war), `delegated_at`.
  - Spawn-Entry und `assign()` übernehmen `estimate`, `milestone`, `briefing`, `persona_version`, `ts`.
  - Neue Handler: `on_usage` (L0-Knoten `usage`, Session `cost`), `on_result`, `on_milestone`, `on_retro`, `on_ci`, `on_queue`; `package_id` wird überall wie `package` gelesen (`event.get("package_id") or event.get("package")`).
  - `build_state(...)` liefert zusätzlich: `records`, `delegations`, `effort`, `quality`, `incidents`, `milestones`, `session_costs` — jeweils für die gewählten Sessions (`scope`); `incidents` immer über alle Sessions.
  - `pending_incidents(events: list[dict], now: float, inactive_after: float = INACTIVE_DEFAULT) -> list[dict]`.
- Produces in `effort.py` (rein, keine I/O):
  - `record(node: dict, nodes: dict[str, dict]) -> dict` mit Schlüsseln `key, session_id, agent_id, role, level, department, delegated_by, lead, package, milestone, model, persona_version, handbook_version, started, stopped, status, duration_s, tool_calls, tokens, output_lower_bound, estimate, briefing, report, resumes, max_gap_s, delegated_at, reported`. `duration_s` = Summe der Läufe (offener Lauf bis `now` zählt nicht: `None`, solange der Agent lebt und keine abgeschlossenen Läufe hat). `lead` = Rolle des L1-Vorfahren (für L1 sich selbst, für L0 `studio-director`).
  - `delegations(records) -> list[dict]` — nur Datensätze mit `delegated_at`, neueste zuerst, Felder `t, from, to, package, milestone, model, briefing, report, estimate, duration_s, tool_calls, tokens_in, tokens_out, output_lower_bound, outcome, status`.
  - `aggregate(records, results) -> dict` — `by_role`, `by_package`, `by_lead`, `by_milestone`, `by_model`, `estimate_vs_actual`. Zeilen: `{"key", "agents", "duration_s", "tool_calls", "input", "cache_write", "cache_read", "output", "output_lower_bound"}`. `by_lead` summiert den ganzen Teilbaum (Feld `lead`). `by_model` aus `tokens`. `estimate_vs_actual`: `{"count", "estimated_min", "actual_min", "deviation_pct", "estimated_tools", "actual_tools"}` nur über Datensätze mit Schätzung und gemessener Dauer; ohne solche → `count: 0`, Rest `None`.
  - `quality(records, results, ci_runs, escalations) -> dict` — `results, unchecked` (Ergebnisse mit `review_rounds == 0`), `first_pass_rate` (= `angenommen` und `review_rounds == 1` / Ergebnisse mit `review_rounds ≥ 1`), review_rounds_mean, review_rounds_max, rework, rework_share, rejected, ci_runs, ci_failures, escalations, failed_agents, gap_agents` (`None` statt 0, wo nichts erfasst ist: Quoten ohne Ergebnisse, CI ohne Läufe).
  - `incidents(records, results, ci_runs, budgets, milestones, acknowledged, inactive_keys) -> list[dict]` — `{"id", "kind", "text", "t"}` nach Spec (IDs `failed:<key>`, `inaktiv:<key>`, `ci:<run_id>` nur `failure` auf `main`, `budget:<lead>:<phase>` bei `used > 1.5 * granted > 0`, `runden:<paket>` bei `review_rounds > 3`, `meilenstein:<id>` bei Status `done`), ohne bereits quittierte IDs.
  - `GAP_DEFAULT = 300.0`.

- [ ] **Step 1: Failing tests** `tools/studio/tests/test_effort.py` — baue Events mit den Helfern aus `test_model.py` (kopieren: `ts`, `ev`, `spawn`, `start`, `stop`) für: L0 → `lead-qa` (spawn mit `persona="lead-qa"`, `package_id="P1"`, `milestone="M9"`, `estimate={"minutes": 10, "tools": 20}`, `briefing="briefings/x.md"`) → `qa-code-reviewer` (spawn aus `a1`), Heartbeats (3 für `a2`), `agent_stop` für `a2` mit `usage={"claude-sonnet-5-5": {"input": 2, "cache_write": 10, "cache_read": 100, "output": 50, "messages": 2, "complete": 1}}` und `report="berichte/y.md"`, `result` (lead-qa, P1, angenommen, 1), `ci` failure run 7 auf main, `budget` lead-qa grant 1 und 3 Starts (Überschreitung > 50 %), `retro` mit `triggers=["ci:7"]`. Prüfen:

```python
        state = model.build_state(events, T0 + 600, MODELS, session="all")
        rec = {r["role"]: r for r in state["records"]}
        self.assertEqual(rec["qa-code-reviewer"]["tool_calls"], 3)
        self.assertEqual(rec["qa-code-reviewer"]["lead"], "lead-qa")
        self.assertTrue(rec["qa-code-reviewer"]["output_lower_bound"])
        self.assertEqual(rec["lead-qa"]["estimate"], {"minutes": 10, "tools": 20})
        first = state["delegations"][-1]
        self.assertEqual((first["from"], first["to"]), ("studio-director", "lead-qa"))
        self.assertEqual(first["briefing"], "briefings/x.md")
        lead_row = next(r for r in state["effort"]["by_lead"] if r["key"] == "lead-qa")
        self.assertEqual(lead_row["output"], 50)
        self.assertEqual(state["quality"]["first_pass_rate"], 1.0)
        self.assertEqual(state["quality"]["ci_failures"], 1)
        ids = {i["id"] for i in state["incidents"]}
        self.assertNotIn("ci:7", ids)  # quittiert
        self.assertIn("budget:lead-qa:P", ids)
```

Zusätzlich in `test_model.py`: alte Events mit `package` statt `package_id` landen im Board und im Knoten; ein Event mit unbekannter Art bricht nichts; `quality` ohne Ergebnisse liefert `first_pass_rate is None`; `estimate_vs_actual["count"] == 0` ohne Schätzungen; Lücke: Agent aktiv, Heartbeats bei 0 und 400 s → `max_gap_s == 400` und `gap_agents == 1`.

- [ ] **Step 2: FAIL prüfen.**
- [ ] **Step 3: Implementieren** — `effort.py` (reine Funktionen wie oben) und `model.py`: neue Felder im Knoten-Konstruktor, `_touch(node, ts)` berechnet `max_gap` vor dem Aktualisieren von `last_seen` (nur wenn Status in `LIVE`), Zählung `tool_calls` in `on_heartbeat`, `on_bind`, `on_spawn` (für den Aufrufer), `on_agent_start` zählt `resumes` bei `_started`, `on_spawned` übernimmt `duration_ms`/`tool_count`/`resolved_model`, `on_agent_stop` übernimmt `usage`/`report`/`persona_version`, `result()` ruft `effort.*` auf. `PUBLIC` um `persona_version` und `milestone` erweitern.
- [ ] **Step 4: PASS prüfen** (`make studio-test`, alle alten Modell-Tests grün).
- [ ] **Step 5: Commit** — `feat: Aufwand, Delegationen, Qualität und Vorfälle im Studio-Modell`

---

### Task 6: `hook.py` und `context.py` — neue Felder, Archiv, Usage, Start-Kontext

**Files:**
- Create: `tools/studio/context.py`
- Modify: `tools/studio/hook.py`
- Test: `tools/studio/tests/test_context.py`, `tools/studio/tests/test_hook.py` (erweitern)

**Interfaces:**
- Consumes: `studio_docs` (Task 1), `usage` (Task 3), `paths.docs_dir()`/`archive_dir()` (Task 4), `model.pending_incidents`, `model.EventStore` (Task 5).
- Produces:
  - `context.build_context(docs: Path, incidents: list[dict], port: str) -> str` — Abschnitte in dieser Reihenfolge: Rollenzeile (Projektleiter/L0, Verfassung vX, Handbuch vY, „fragt nicht zurück; Vorbehalte → Warteschlange"), `Dashboard: http://127.0.0.1:<port>/`, Start-Routine (eine Zeile), `## state.md` (≤ 3 500 Zeichen), `## lernen.md` (≤ 2 500), `## Warteschlange` (Einträge `offen`/`beantwortet`, je Zeile `- N-001 · offen · Titel — Empfehlung: … · Blockiert: …`, höchstens 8), `## Laufende Experimente` (Status `laufend`/`vorgeschlagen`), `## Fällige Retros` (Vorfälle, höchstens 8). Gekürzte Teile enden mit `… (gekürzt, siehe docs/studio/<datei>)`. Gesamtlänge hart ≤ `LIMIT = 9500`.
  - `hook.header_text(text: str, key: str) -> str` (voller Wert der Kopfzeile), `hook.parse_estimate(value: str) -> dict | None` (`{"minutes": int | None, "tools": int | None}`; nichts gefunden → `None`).
  - `hook.to_event` (rein) ergänzt: `handbook_version` (alle Events), bei `spawn`: `package_id`, `milestone`, `estimate`, `persona_version`; bei `agent_start`/`agent_stop`: `persona_version`; bei `spawned`: `duration_ms`, `tool_count`, `resolved_model` aus `tool_response` (`totalDurationMs`, `totalToolUseCount`, `resolvedModel`, nur wenn vorhanden). Das Feld `package` entfällt zugunsten `package_id`. Für Versionen erhält `to_event` optionale Parameter `handbook: str = ""`, `personas: dict | None = None`.
  - `hook.enrich(event: dict, payload: dict) -> list[dict]` (I/O): bei `spawn` vollen Prompt archivieren (`archiv/briefings/<YYYYmmdd-HHMMSS>-<persona>-<tool_use_id[-8:]>.md`, Feld `briefing` = relativer Pfad ab `archiv/`); bei `agent_stop` volle Schlussmeldung archivieren (`archiv/berichte/<stamp>-<rolle>-<agent_id>.md`, Feld `report`) und `usage` aus `usage.subagent_transcript(...)` (bzw. `agent_transcript_path`, falls im Payload); bei `turn_end` und `session_end` der Hauptsession zusätzliches Event `{"kind": "usage", "agent_id": "main", "usage": …}` aus `usage.incremental_usage(transcript, studio_home()/"usage"/f"{sid}.json")`, bei `session_end` zusätzlich `session_cost`. Rückgabe: Liste der zu schreibenden Events (erstes = `event`). Jede Teiloperation einzeln abgesichert.
  - SessionStart: `additionalContext` = `context.build_context(...)`; Server losgelöst starten (`launch_detached(["bash", start_sh])`) und `ci.py` losgelöst starten — ausser `STUDIO_NO_SERVER=1`.
  - UserPromptSubmit der Hauptsession: offene Vorfälle, für die in dieser Session noch keine Marke `studio_home()/"notified"/<sid>/<sha1(id)[:12]>` existiert → `additionalContext` „Ad-hoc-Retro fällig (Handbuch, Verbesserungsschleife): <Liste>"; Marken anlegen.

- [ ] **Step 1: Failing tests** — `test_context.py`:

```python
import tempfile
import unittest
from pathlib import Path

import context


class ContextTest(unittest.TestCase):
    def test_sections_and_limit(self):
        with tempfile.TemporaryDirectory() as tmp:
            docs = Path(tmp)
            (docs / "STUDIO.md").write_text("# H\nVersion: 1.0\n", "utf-8")
            (docs / "VERFASSUNG.md").write_text("# V\nVersion: 1.0\n", "utf-8")
            (docs / "state.md").write_text("# Stand\n" + "x" * 20000, "utf-8")
            (docs / "lernen.md").write_text("# Lernen\n- kurz\n", "utf-8")
            (docs / "warteschlange.md").write_text(
                "# W\n\n## N-001 · offen · 2026-09-30 · Lib x\n- Empfehlung: Nein\n"
                "- Blockiert: M5-03\n\n## N-002 · umgesetzt · 2026-09-30 · alt\n",
                "utf-8",
            )
            text = context.build_context(
                docs, [{"id": "ci:1", "text": "CI rot auf main"}], "8765"
            )
            self.assertLessEqual(len(text), context.LIMIT)
            self.assertIn("Projektleiter", text)
            self.assertIn("http://127.0.0.1:8765/", text)
            self.assertIn("gekürzt, siehe docs/studio/state.md", text)
            self.assertIn("N-001", text)
            self.assertNotIn("N-002", text)
            self.assertIn("CI rot auf main", text)

    def test_missing_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            text = context.build_context(Path(tmp), [], "8765")
            self.assertIn("Projektleiter", text)
```

Fixture `tools/studio/tests/fixtures/agent_tool_response.json` (gekürzt aus einem echten Transkript-`toolUseResult`, ohne Prompt-/Berichtstext): `{"status": "completed", "agentId": "a58c1ea80f25eef92", "agentType": "lead-qa", "resolvedModel": "claude-opus-5-5", "totalDurationMs": 482927, "totalTokens": 44701, "totalToolUseCount": 11}` — Beleg, dass diese Felder existieren; `totalTokens` ist nur der Kontext der letzten Antwort und wird **nicht** verwendet.

In `test_hook.py` ergänzen: `parse_estimate("20 min, 30 Tools") == {"minutes": 20, "tools": 30}`, `parse_estimate("unklar") is None`; spawn mit Prompt `"Persona: lead-qa\nPaket: P1\nMeilenstein: M9\nSchätzung: 15 min\n…"` liefert `package_id == "P1"`, `milestone == "M9"`, `estimate == {"minutes": 15, "tools": None}`, `persona_version` aus übergebenem `personas`; `spawned` mit `tool_response={"agentId": "a1", "totalDurationMs": 5000, "totalToolUseCount": 7, "resolvedModel": "claude-opus-5-5"}` liefert die drei Felder; `enrich` im Temp-`STUDIO_HOME` legt Briefing- und Berichtsdatei an und setzt die Pfade; `enrich` bei `agent_stop` mit Transkript-Fixture (Datei `…/abc/subagents/agent-a1.jsonl`, eine Assistant-Zeile) setzt `usage`; Subprozess-Test SessionStart mit `STUDIO_NO_SERVER=1` gibt JSON mit `additionalContext`, das „Projektleiter" enthält.

- [ ] **Step 2: FAIL prüfen.**
- [ ] **Step 3: Implementieren** — `context.py` neu; in `hook.py`: `START_CONTEXT` durch `context.build_context` ersetzen (Rückfall bei Fehler: bisheriger kurzer Text), `to_event`-Erweiterungen, `enrich`, Server-Start, Vorfall-Hinweis. `main()` schreibt alle Events aus `enrich`.
- [ ] **Step 4: PASS prüfen**; zusätzlich manuell: `echo '{"hook_event_name":"SessionStart","session_id":"t","source":"startup"}' | STUDIO_NO_SERVER=1 python3 tools/studio/hook.py | python3 -m json.tool | head -40`.
- [ ] **Step 5: Commit** — `feat: Hook archiviert Briefings und Berichte, misst Tokens, lädt Start-Kontext`

---

### Task 7: `metrics.py` — Verdichtung je Session und Meilenstein

**Files:**
- Create: `tools/studio/metrics.py`
- Modify: `Makefile` (Ziel `studio-metrics`)
- Test: `tools/studio/tests/test_metrics.py`

**Interfaces:**
- Consumes: `model.build_state`, `model.read_agent_models`, `usage.session_cost`, `studio_docs.read_version`, `paths.*`.
- Produces:
  - `load_events(home: Path) -> list[dict]` — `events.jsonl` + `archiv/events/*.jsonl` + `archive/*.jsonl` (alt).
  - `transcript_dir(root: Path) -> Path` — `STUDIO_TRANSCRIPTS` oder `~/.claude/projects/<re.sub(r"[^A-Za-z0-9]", "-", str(root))>`.
  - `summarize(state: dict, kind: str, kennung: str, handbook: str, cost: dict | None, created: str) -> dict` — Rohwerte `{"kennung", "kind", "created", "handbook_version", "sessions", "agents", "delegations", "totals": {"duration_s", "tool_calls", "input", "cache_write", "cache_read", "output", "output_lower_bound"}, "by_lead", "by_model", "estimate_vs_actual", "quality", "incidents_open", "session_cost"}`.
  - `render(raw: dict) -> str` — Markdown: Titel `# Metriken <kennung>`, Kopfzeile (erzeugt, Art, Handbuch), `## Aufwand` (Summen; Tabelle je Lead; Tabelle je Modell; Schätzung vs. Ist), `## Qualität` (Liste; `None` → „nicht erfasst"), `## Vorfälle`, `## Grenzen der Messung` (Output-Untergrenze, fehlende Sitzungskosten → „nicht gemessen"), `## Rohwerte` mit ```` ```json ```` (eingerückt 2, `ensure_ascii=False`, Schlüssel sortiert).
  - CLI: `metrics.py --session <id|latest>` → Kennung `S-<YYYY-MM-DD>-<sid[:8]>` (Datum des Session-Starts, lokal); `metrics.py --milestone <id>` → Kennung = ID, Datensätze mit `milestone == id` über alle Sessions; `--out <verzeichnis>` (Standard `docs_dir()/"metriken"`); druckt den geschriebenen Pfad.
  - Makefile: `studio-metrics: ## Studio-Metriken der letzten Session verdichten` → `@python3 tools/studio/metrics.py --session latest`.

- [ ] **Step 1: Failing tests** — mit Events wie in Task 5 (Session `s1`, Meilenstein `M9`) in einem Temp-`STUDIO_HOME`; prüfen: `--session s1 --out <tmp>` erzeugt `S-2026-09-30-s1.md`, die Datei enthält `## Rohwerte`, `studio_docs.metrics_history` liest sie (`kind == "session"`), `totals["output"]` stimmt, `quality["first_pass_rate"] == 1.0`; `--milestone M9` erzeugt `M9.md` mit `agents == 2`; fehlendes Transkript → Text „nicht gemessen" im Abschnitt Grenzen; zweiter Lauf überschreibt (gleicher Inhalt ausser `created`).
- [ ] **Step 2: FAIL prüfen.**
- [ ] **Step 3: Implementieren.**
- [ ] **Step 4: PASS prüfen**, dann `make studio-metrics` gegen echte Daten (darf „nicht gemessen" zeigen) und das Ergebnis ansehen; die erzeugte Datei **nicht** committen (Probedaten).
- [ ] **Step 5: Commit** — `feat: metrics.py verdichtet Studio-Metriken je Session und Meilenstein`

---

### Task 8: `server.py` — Doku-Bündel, Effort, Archiv-Route

**Files:**
- Modify: `tools/studio/server.py`
- Test: `tools/studio/tests/test_server.py` (erweitern)

**Interfaces:**
- Consumes: `studio_docs.bundle`, `build_state` (mit neuen Feldern), `paths.docs_dir()`, `paths.archive_dir()`.
- Produces:
  - `make_server(port, events_path, agents, inactive_after, dashboard=DASHBOARD, docs: Path | None = None, archive: Path | None = None)`.
  - `/api/state` enthält zusätzlich `docs` (Bündel aus Task 1) und die neuen Felder aus Task 5.
  - `GET /archiv/<rel>`: nur Dateien mit Endung `.md`, `.jsonl`, `.txt` innerhalb `archive` (aufgelöst, keine Symlinks nach aussen, `..` abgewiesen) → `200 text/plain; charset=utf-8`; sonst 404. Host-Prüfung wie bisher.

- [ ] **Step 1: Failing tests** — `setUp` um `docs` (mit `STUDIO.md` „Version: 1.0" und `warteschlange.md` mit einem Eintrag) und `archive` (mit `briefings/a.md`, Inhalt „Brief") erweitern; Tests: `/api/state` → `docs.handbook_version == "1.0"`, `len(docs.queue) == 1`, Schlüssel `delegations`, `effort`, `quality`, `incidents` vorhanden; `/archiv/briefings/a.md` → 200, Body „Brief", `Content-Type` beginnt mit `text/plain`; `/archiv/../events.jsonl`, `/archiv/%2e%2e/events.jsonl`, `/archiv/x.html` und ein Symlink auf eine Datei ausserhalb → 404.
- [ ] **Step 2: FAIL prüfen.**
- [ ] **Step 3: Implementieren.**
- [ ] **Step 4: PASS prüfen.**
- [ ] **Step 5: Commit** — `feat: Dashboard-Server liefert Studio-Dokumente, Aufwand und Archiv`

---

### Task 9: Dashboard — Reiter und neue Ansichten

**Files:**
- Modify: `tools/studio/dashboard/index.html`, `tools/studio/dashboard/app.js`, `tools/studio/dashboard/style.css`
- Optional: `tools/studio/tests/fixtures/make_demo.py` (Demo-Events um neue Arten ergänzen, damit Screenshots Inhalt zeigen)

**Interfaces:**
- Consumes: `/api/state` (Task 8): `tree`, `counts`, `decisions`, `budgets`, `board`, `pulse`, `chronicle`, `feed`, `records`, `delegations`, `effort`, `quality`, `incidents`, `milestones`, `session_costs`, `docs`.

Vorgaben (Sichtprüfung per Screenshot, R16):

1. **Reiterleiste** unter der Kopfzeile: `Live`, `Delegation`, `Aufwand`, `Qualität`, `Studio` als `<nav>` mit `<a href="#live">` usw., `aria-current="page"` am aktiven Reiter; Abschnitte tragen `data-tab`; Wechsel über `hashchange`; Standard `#live`. Mobile-first: Reiterleiste horizontal scrollbar, Karten im bestehenden Grid.
2. **Live**: bestehende Karten; zusätzlich Karte **„Nutzerentscheide (Warteschlange)"** (aus `docs.queue`, Status `offen` und `beantwortet`; je Eintrag ID-Chip, Titel, Frage, Empfehlung, Kosten des Wartens, Blockiert, Status-Badge) und oben ein **Banner** „Retro fällig: n Vorfälle" (Link auf `#qualitaet`), sichtbar nur bei `incidents.length > 0`. Die Karte „Offene Entscheide" heisst „Entscheide für L0".
3. **Delegation**: Zeitachse als Liste (neueste oben): Uhrzeit, `von → an` (Rollen-Chips mit Bereichsfarbe), Paket, Meilenstein, Modell, Schätzung („keine Schätzung", wenn leer), Ist (Dauer mm:ss oder „läuft", Tool-Aufrufe, Tokens ein/aus; Output mit „≥", wenn Untergrenze), Ergebnis-Badge, Links „Briefing" und „Bericht" (`href = "/archiv/" + encodeURI(pfad)`, `target="_blank"`, `rel="noopener"`, nur wenn Pfad vorhanden und nicht mit `/` oder `.` beginnt).
4. **Aufwand**: Umschalter „je Agent | Paket | Lead | Meilenstein | Modell" (`<select>` wie im Chronik-Filter, Auswahl in `localStorage`), Tabelle mit Spalten Schlüssel, Agenten, Dauer, Tool-Aufrufe, Tokens ein (Input + Cache-Schreiben + Cache-Lesen, Tooltip mit Aufteilung), Tokens aus; darunter Kachel „Schätzung vs. Ist" (Minuten, Tools, Abweichung %, oder „keine Schätzungen erfasst") und — falls vorhanden — Sitzungskosten je Modell aus `session_costs` in USD mit Hinweis „Sitzungssumme laut Claude Code". Tabelle mobil als Karten (wie Board).
5. **Qualität**: Kacheln Annahmequote erster Wurf, Review-Runden Ø/Max, Nacharbeit, verworfen, CI-Fehlschläge, Eskalationen, gescheiterte Agenten, Agenten mit Lücke (`null` → „nicht erfasst"/„nicht gemessen"); Liste offener Vorfälle; **Verlauf** über `docs.history` mit `kind == "milestone"` als Tabelle (Kennung, Datum, Annahmequote, Review-Runden Ø, Nacharbeit, CI rot, Tokens aus) plus kleine SVG-Linie für Annahmequote und Tokens aus (nur wenn ≥ 2 Punkte, sonst Hinweis „Verlauf ab zwei Meilensteinen").
6. **Studio**: Kacheln Verfassung vX, Handbuch vY; Liste Experimente (ID, Status-Badge, Titel, Messgrösse, Zeitraum); CHANGELOG (neueste 10: Datum, Gegenstand, Version, erste Zeile); `lernen.md` als vorformatierter Text (`<pre>`, `textContent`); **Organigramm** aus `docs.personas`: L0 → L1 (Leads und `studio-*`) → L2 nach Bereich (Ebene/Bereich wie `classify` in `model.py`: `lead-<x>` L1, `studio-<x>` ausser Direktor L1 Bereich `studio`, sonst Präfix), je Karte Name, `v<version>`, Modell-Chip.
7. Alle Werte per `textContent`; leere Daten → bestehende `empty()`-Hinweise; ein Fehler in einer Ansicht darf die anderen nicht verhindern (jede `render*` in eigenem `try/catch`, Fehler als Hinweis in der Karte).

- [ ] **Step 1:** Demo-Events erweitern (`make_demo.py`: je ein `result`, `ci`, `milestone`, `retro`, `usage`, Spawns mit `estimate`/`briefing`) und `STUDIO_HOME` auf ein Temp-Verzeichnis zeigen lassen.
- [ ] **Step 2:** Umsetzen (HTML-Struktur, JS-Renderer, CSS). `npx prettier --check tools/studio/dashboard` grün.
- [ ] **Step 3:** Server mit Demo-Daten starten (`STUDIO_HOME=<tmp> STUDIO_PORT=8799 python3 tools/studio/server.py --port 8799 &`), Screenshots je Reiter in 1280×900 und 390×844 per `"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --screenshot=<scratchpad>/<reiter>.png --window-size=1280,900 "http://127.0.0.1:8799/#<reiter>"` und ansehen; Konsolenfehler per `--enable-logging=stderr --v=0` prüfen.
- [ ] **Step 4:** Server stoppen; `make check` grün.
- [ ] **Step 5: Commit** — `feat: Dashboard mit Reitern für Delegation, Aufwand, Qualität und Studio`

---

### Task 10: Verfassung, Handbuch 1.0, Changelog, Warteschlange, Experimente, lernen, Vorlagen, Konsistenztest

**Files:**
- Create: `docs/studio/VERFASSUNG.md`, `docs/studio/CHANGELOG.md`, `docs/studio/warteschlange.md`, `docs/studio/experimente.md`, `docs/studio/lernen.md`, `docs/studio/retros/README.md`, `docs/studio/metriken/README.md`, `docs/studio/templates/retro.md`, `docs/studio/templates/experiment.md`, `tools/studio/tests/test_docs.py`
- Modify: `docs/studio/STUDIO.md`, `docs/studio/state.md`, `docs/studio/templates/briefing.md`, `docs/studio/templates/bericht.md`, `docs/studio/gates.md` (Verweise)

**Interfaces:**
- Consumes: `studio_docs` (Task 1) im Test.
- Produces: Dateien in den Formaten aus Task 1; Handbuch `Version: 1.0`.

Inhalt (verbindlich):

**`VERFASSUNG.md`** — Text von L0 (liegt dem Implementierer als Datei `docs/studio/VERFASSUNG.md` im Branch bereits vor, siehe Task-Notiz unten) — Paragrafen §1–§10 laut Spec.

> Notiz: Die Verfassung schreibt L0 selbst (Nutzer-Dokument, nicht Team-Arbeit) und committet sie vor dem Start dieser Task mit `docs: Verfassung des Studios (Entwurf zur Bestätigung durch den Nutzer)`. Der Implementierer ändert sie nicht (der Guard verhindert es ohnehin).

**`STUDIO.md`** (Handbuch):

- Kopf: `# Studio-Handbuch Inselreich`, Zeile `Version: 1.0 · Stand: 2026-09-30 · Änderungen nur über den Verbesserungsprozess (siehe unten), Verlauf in [CHANGELOG.md](CHANGELOG.md)`; Einleitung: Rangfolge Verfassung > Handbuch > Persona > Briefing; Begleitdokumente um VERFASSUNG, CHANGELOG, warteschlange, experimente, lernen, retros/, metriken/ ergänzen.
- Organigramm und Lead-Tabelle: `studio-coach` als L1-Stabsstelle direkt unter L0 (Mermaid-Knoten `C[studio-coach]`, Kante `L0 --> C`), Tabellenzeile „`studio-coach` · Auswertung, Retros, Experimente, lernen.md · keine Arbeiter".
- Befugnistabelle: Zeile **Nutzer** ersetzen durch Verweis „Vorbehalte laut Verfassung §5 (Warteschlange)"; Zeile **L0** um „Auslegung von Nutzer-Anweisungen (Ruling), Experimente annehmen/ablehnen" ergänzen; neue Zeile `studio-coach`: entscheidet Retro-Format und Auswertungsmethode; muss L0 fragen: jede Regeländerung.
- Briefing-Standard: Kopfzeilen `Persona`, `Paket`, neu `Meilenstein` und `Schätzung: <n> min, <m> Tools` (Pflicht bei jeder Delegation; Schätzung ist eine Schätzung); Feste-Regeln-Block ersetzt durch Satz „Den Block ‚Feste Regeln' aus [VERFASSUNG.md §3](VERFASSUNG.md#3-feste-regeln) wörtlich in jedes Briefing kopieren."
- Abschnitt **„Feste Regeln"** und **„Asset- und Inspirationsregeln"** und **„Was den Nutzer betrifft"** entfallen; stattdessen Abschnitt **„Autonomie"**: Ablauf ohne Rückfrage (Auslegung → Ruling), Warteschlange mit `log.py queue` (Beispiel-Aufrufe add/answer/done), blockiertes Paket `--status blocked --blocked-by N-001`, nächstes ungeblocktes Paket vorziehen; Antworten des Nutzers in jeder Session umsetzen; Guard (was er verbietet, wie die Verfassungs-Freigabe geht).
- Abschnitt **„Messung und Aufwand"**: Tabelle „was wie gemessen wird" aus der Spec (Messung), Liste „nicht messbar", Archiv `.studio/archiv/`, `log.py result` (wer, wann: abnehmender Lead nach jedem Arbeitsergebnis, auch L0 nach jedem Lead-Bericht), `log.py milestone start|done`, `make studio-metrics` und `metrics.py --milestone`, Dashboard-Reiter.
- Abschnitt **„Verbesserungsschleife"**: Coach, Auslöser (Meilenstein Pflicht, Session-Ende kurz, Vorfälle mit IDs), Ablauf 1–5 mit Experiment-Vorlage, Versionierung (Handbuch Minor je Experiment, Major bei Organisations-Umbau; Persona Minor), CHANGELOG-Format, Leitplanken (Verfassung tabu, ≤ 3 laufend, Datenbasis, Messbarkeit), `log.py retro … --triggers` quittiert Vorfälle, lernen.md ≤ 40 Zeilen, Kostenrahmen (Kurz-Retro ≤ 1 Start, ≤ 15 Tool-Aufrufe).
- Logging-Pflicht: Befehlsreferenz um `result`, `milestone`, `retro`, `queue` erweitern, `decision` nur noch `--for l0`; Tabelle „Wann wer loggt" um Abnahme (`result`), Meilenstein, Retro, Warteschlange ergänzen; Dashboard-Befehle um `make studio-metrics`.
- **Session-Start** (ersetzt bisherigen Abschnitt): 1. Kontext kommt vom SessionStart-Hook (bei Bedarf Dateien nachlesen); 2. `log.py status --role studio-director --status active --task "Session-Start"`; 3. Dashboard-URL nennen (Hook hat den Server gestartet; sonst `make studio`); 4. Bericht ≤ 10 Zeilen: Stand · seit letzter Session erledigt · laufend · offene Nutzerentscheide; 5. Neue Anweisung = Auftrag (Auslegung als Ruling), sonst Plan aus state.md fortsetzen; beantwortete Warteschlangen-Einträge zuerst umsetzen; offene Vorfälle → Ad-hoc-Retro.
- **Session-Ende** (ersetzt): Schritte 1–5 der Spec, danach Skill `session-wrap-up`, Push laut Verfassung §7.
- Budget-Abschnitt: zusätzlich „Der Coach bekommt je Retro 1 Start (Stabsstelle, ohne Arbeiter)".

**`CHANGELOG.md`**: Kopf mit Formatbeschreibung; Eintrag `## 2026-09-30 · Handbuch 1.0` (Anlass: Session 1.5 — Trennung Verfassung/Handbuch, Autonomie, Messung, Verbesserungsschleife; Datenbasis: Auftrag des Nutzers; Ruling: R22–R33; Änderungen: Stichworte).

**`warteschlange.md`**: Kopf (Zweck, Format aus Task 1, Status, wie der Nutzer antwortet: „in einer beliebigen Session schreiben ‚N-001: <Antwort>' oder die Zeile ‚Antwort' hier ausfüllen"), Trennlinie `---`, keine Einträge.

**`experimente.md`**: Kopf (Zweck, Format aus Task 1, Statuswerte, höchstens 3 `laufend`), keine Einträge.

**`lernen.md`**: Kopf-Kommentar `<!-- Kuratiert vom studio-coach, höchstens 40 Inhaltszeilen; Veraltetes streichen. -->`, Startinhalt aus bisherigen Erfahrungen (je eine Zeile): Leads im Vordergrund starten lassen (ADR-007); Fortsetzen per SendMessage statt Neustart; Modell im Agent-Aufruf explizit setzen; Implementierer mit Edit/Write statt Shell-Einzeilern (Befund M2); neue Personas: Datei-Überwachung lädt sie in laufenden Sessions, ausser `.claude/agents/` fehlte beim Session-Start; Inaktiv-Anzeige ist bei langen Bash-Aufrufen ohne Heartbeat erwartbar.

**`retros/README.md`**, **`metriken/README.md`**: Zweck, Dateinamen (`retros/<datum>-<art>-<kurz>.md`; `metriken/<kennung>.md`), wer schreibt.

**`templates/retro.md`**: Kopf (Datum, Art, Auslöser/Vorfall-IDs, Datenbasis mit Pfaden), Abschnitte Befunde (je Befund: Beobachtung, Beleg, Wirkung), Befragung der Leads (Kurzfassung), Vorschläge (≤ 3, je als Experiment nach `templates/experiment.md`), Bewertung laufender Experimente, lernen.md-Änderungen.

**`templates/experiment.md`**: Eintrag im Format von Task 1 mit Erklärung je Feld; Pflichtfelder Hypothese, Messgrösse (mit Schwelle, z. B. „Annahmequote erster Wurf ≥ 70 % über ≥ 4 Ergebnisse"), Zeitraum, Rückfall (exakter Zustand/Version), betroffene Dateien, Ruling, Start (Handbuch-Version), Bewertung; Prüffrage „verschlechtert das Experiment die Messbarkeit seiner Wirkung?".

**`templates/briefing.md`**: Kopfzeilen `Meilenstein:` und `Schätzung: <n> min, <m> Tools` ergänzen (im Muster und im Beispiel), Feste-Regeln-Block mit Hinweis „wörtlich aus VERFASSUNG.md §3", Logging-Block um `result` (nur Leads) ergänzen.

**`templates/bericht.md`**: Zeile `Aufwand: <Dauer, Tool-Aufrufe> (Dashboard misst genauer)` ergänzen.

**`state.md`**: Abschnitt „Seit letzter Session erledigt" (hinter „Aktuelles Projekt und Phase"); Nächste Schritte: 1. `lead-production` wertet `docs/beobachtungen.md` mit dem Skill `beobachtungen-auswerten` aus; 2. L0 wählt danach den nächsten Meilenstein selbst aus dem Spielkonzept (Ruling, kein Nutzer-Vorbehalt), startet ihn mit `log.py milestone --status start` und gibt Design ein Budget frei.

**`gates.md`**: Verweise auf „Feste Regeln"/„Asset-Regeln" in STUDIO.md auf VERFASSUNG.md umbiegen; Final-Review-Pflicht mit Verweis auf Verfassung §9.

**Konsistenztest `tools/studio/tests/test_docs.py`** (gegen das echte Repo, `REPO = Path(__file__).resolve().parents[3]`):

```python
import unittest
from pathlib import Path

import studio_docs as sd

REPO = Path(__file__).resolve().parents[3]
DOCS = REPO / "docs" / "studio"
AGENTS = REPO / ".claude" / "agents"
PARAGRAPHS = [f"## §{n} " for n in range(1, 11)]


class DocsConsistencyTest(unittest.TestCase):
    def test_handbook_version_matches_changelog(self):
        version = sd.read_version(DOCS / "STUDIO.md")
        entries = [e for e in sd.changelog(DOCS) if e["subject"] == "Handbuch"]
        self.assertTrue(version)
        self.assertEqual(entries[0]["version"], version)

    def test_persona_versions(self):
        meta = sd.persona_meta(AGENTS)
        latest = {}
        for entry in sd.changelog(DOCS):
            if entry["subject"].startswith("Persona "):
                latest.setdefault(entry["subject"][len("Persona "):], entry["version"])
        for name, info in meta.items():
            with self.subTest(persona=name):
                self.assertTrue(info["version"])
                self.assertEqual(info["version"], latest.get(name, "1.0"))

    def test_experiments_limit(self):
        running = [e for e in sd.experiments(DOCS) if e["status"] == "laufend"]
        self.assertLessEqual(len(running), 3)
        for e in sd.experiments(DOCS):
            self.assertIn(e["status"], sd.EXPERIMENT_STATUSES)

    def test_lernen_length(self):
        self.assertLessEqual(sd.content_lines(sd.read_text(DOCS / "lernen.md")), 40)

    def test_constitution_complete(self):
        text = sd.read_text(DOCS / "VERFASSUNG.md")
        self.assertTrue(sd.read_version(DOCS / "VERFASSUNG.md"))
        for heading in PARAGRAPHS:
            self.assertIn(heading, text)

    def test_queue_parses(self):
        for entry in sd.queue_entries(DOCS):
            self.assertIn(entry["status"], sd.QUEUE_STATUSES)

    def test_fixed_rules_block_matches_constitution(self):
        def block(text):
            start = text.index("Feste Regeln (unverändert, gelten immer):")
            lines = text[start:].splitlines()[1:]
            return [line for line in lines[: next(
                i for i, line in enumerate(lines) if not line.startswith("- ")
            )]]

        constitution = sd.read_text(DOCS / "VERFASSUNG.md")
        template = sd.read_text(DOCS / "templates" / "briefing.md")
        self.assertEqual(block(template), block(constitution))

    def test_no_decision_for_user(self):
        paths = [*AGENTS.glob("*.md"), *(DOCS / "templates").glob("*.md"), DOCS / "STUDIO.md"]
        for path in paths:
            with self.subTest(path=path.name):
                self.assertNotIn("--for user", sd.read_text(path))

    def test_session_start_hook_all_sources(self):
        import json

        settings = json.loads(sd.read_text(REPO / ".claude" / "settings.json"))
        for entry in settings["hooks"]["SessionStart"]:
            self.assertNotIn("matcher", entry)  # startup, resume, clear, compact
        self.assertEqual(settings.get("outputStyle"), "Projektleiter")
```

(`test_session_start_hook_all_sources` wird erst mit Task 11 grün: in Task 10 mit `@unittest.skipUnless((REPO / ".claude/output-styles/projektleiter.md").exists(), "Task 11")` versehen und in Task 11 den Skip entfernen.) In Task 10 zusätzlich alle `--for user`-Stellen in Personas, Vorlagen und STUDIO.md auf `log.py queue …` umstellen.

- [ ] **Step 1:** Test schreiben, laufen lassen → FAIL (Dateien fehlen).
- [ ] **Step 2:** Dateien anlegen bzw. ändern wie oben (Personas bekommen `version` erst in Task 11 — bis dahin `test_persona_versions` rot? Nein: Task 10 setzt in allen 13 bestehenden Persona-Dateien die Frontmatter-Zeile `version: 1.0` nach `model:` gleich mit, ohne weiteren Inhalt zu ändern).
- [ ] **Step 3:** `make check` grün; Links prüfen (`grep -o '](.*)' docs/studio/STUDIO.md` gegen vorhandene Dateien).
- [ ] **Step 4: Commit** — `docs: Handbuch 1.0 mit Autonomie, Messung und Verbesserungsschleife; Changelog, Warteschlange, Experimente, lernen`

---

### Task 11: Studio-Coach, Output-Style, CLAUDE.md, Roster, Rulings, ADR, README

**Files:**
- Create: `.claude/agents/studio-coach.md`, `.claude/output-styles/projektleiter.md`, `docs/adr/ADR-009-studio-autonomie-und-lernen.md`
- Modify: `.claude/settings.json` (`"outputStyle": "Projektleiter"`), `CLAUDE.md`, `docs/studio/roster.md`, `docs/studio/rulings.md`, `docs/adr/ADR-008-studio-telemetrie.md`, `docs/index.md`, `README.md`, `docs/arc42.md` (ADR-Tabelle), `tools/studio/model.py` (`classify`: `studio-<rolle>` ausser Direktor → L1, Bereich `studio`), `tools/studio/tests/test_model.py`, `docs/studio/CHANGELOG.md` (Eintrag `Persona studio-coach 1.0` nicht nötig — Neuanlage steht im Handbuch-1.0-Eintrag)

**Interfaces:**
- Produces: Persona `studio-coach` (Frontmatter: `name: studio-coach`, `description: 'Studio-Coach des Inselreich-Studios: einsetzen für Retros (Meilenstein, Session-Ende, Vorfall), Auswertung der Metriken, Experiment-Vorschläge und -Bewertungen, Pflege von lernen.md und experimente.md und das Umsetzen von L0 angenommener Handbuch-Änderungen; nicht für Spiel, Code oder Projektdoku.'`, `tools: Read, Grep, Glob, Bash, Write, Edit, SendMessage`, `model: opus`, `version: 1.0`).

Inhalte:

- **studio-coach.md** nach `templates/persona.md`: Persona (erfahrener Agile Coach und Datenanalyst für Entwicklungsteams; unabhängig von Production; misstraut Einzelfällen; trennt Beobachtung und Deutung); Verantwortung und Grenzen (darf ändern: `docs/studio/lernen.md`, `experimente.md`, `retros/`, `metriken/`, und **nach L0-Ruling** `STUDIO.md`, `CHANGELOG.md`, `templates/`, `.claude/agents/*.md`, `roster.md`; nie: `VERFASSUNG.md`, `src/`, `tests/`, Spiel-Doku; startet keine Agenten; entscheidet keine Änderung selbst); Arbeitsweise: 1. `make studio-metrics` (bzw. `--milestone`), 2. Archiv-Berichte und Rulings lesen, 3. Leads per SendMessage befragen (Agent-IDs nennt L0; höchstens 3 Fragen je Lead), 4. Retro-Bericht nach `templates/retro.md` unter `docs/studio/retros/`, 5. ≤ 3 Experimente mit Status `vorgeschlagen` in `experimente.md`, 6. Bericht an L0 mit Entscheidungsbedarf je Vorschlag, 7. nach Ruling umsetzen: Datei ändern, Version hochzählen, CHANGELOG-Eintrag (Datum, Gegenstand, Version, Anlass, Datenbasis, Ruling, Änderungen), Experiment `laufend`, `make check`, Commit `docs: …`; 8. Bewertung nach Zeitraum gegen die festgelegte Schwelle; `log.py retro --triggers …` quittiert die Vorfälle; Qualitätsmassstab (jede Aussage mit Beleg aus Metrik-Datei/Archiv; Vorschläge messbar; Messbarkeit nicht verschlechtern; lernen.md ≤ 40 Zeilen; Verfassungsvorschläge nur via `log.py queue`); Bericht und Logging (wie andere Leads, Rolle `studio-coach`).
- **projektleiter.md** (Output-Style):

```markdown
---
name: Projektleiter
description: Hauptsession als Projektleiter (Studio-Direktor, L0) des Inselreich-Studios
keep-coding-instructions: true
---

# Rolle: Projektleiter (L0) des Inselreich-Studios

Du bist in dieser Session der Projektleiter (Studio-Direktor, L0) nach docs/studio/STUDIO.md und die
einzige Ansprechperson des Nutzers. Verbindlich: docs/studio/VERFASSUNG.md (nur der Nutzer ändert
sie), dann das Handbuch docs/studio/STUDIO.md.

- Du fragst nicht zurück. Mehrdeutige Anweisungen legst du plausibel aus, hältst die Auslegung als
  Ruling fest und handelst. Was laut Verfassung §5 den Nutzer braucht, kommt mit Empfehlung,
  Begründung und Kosten des Wartens in die Warteschlange (`log.py queue`); die Arbeit läuft um den
  Punkt herum weiter. Du wartest nie untätig.
- Irreversible Aktionen sind verboten (Verfassung §6), nicht nachzufragen.
- Du machst keine inhaltliche Arbeit selbst; du delegierst an Leads mit Briefing
  (Kopfzeilen Persona, Paket, Meilenstein, Schätzung) und entscheidest Gates.
- **Erste Antwort jeder Session** (egal, was der Nutzer schreibt): Dashboard-URL nennen, dann in
  höchstens 10 Zeilen Stand, seit letzter Session erledigt, laufend, offene Nutzerentscheide. Danach:
  neue Anweisung = Auftrag; sonst den Plan aus docs/studio/state.md selbstständig fortsetzen.
- **Session-Ende:** Agenten abschliessen, `make studio-metrics`, Kurz-Retro durch `studio-coach`,
  state.md und lernen.md nachführen, Kurzbericht (erledigt, Aufwand, Handbuch-Änderungen, offene
  Nutzerentscheide).
- Berichte an den Nutzer: kurz, Fachbegriffe erklärt, nächste Schritte genannt.
```

- **settings.json**: Schlüssel `"outputStyle": "Projektleiter"` auf oberster Ebene (neben `hooks`); Guard registrieren — bei `PreToolUse` ein Eintrag **vor** dem bestehenden `*`-Eintrag und bei `UserPromptSubmit` ein zweiter Hook:

```json
{
  "matcher": "Bash|Edit|Write|MultiEdit|NotebookEdit",
  "hooks": [
    {
      "type": "command",
      "command": "python3 \"$CLAUDE_PROJECT_DIR/tools/studio/guard.py\" 2>/dev/null || true",
      "timeout": 5
    }
  ]
}
```

  Prüfen: `python3 -c "import json;json.load(open('.claude/settings.json'))"`.
- **Warteschlange**: Eintrag `N-001 · offen · 2026-09-30 · Verfassung 1.0 bestätigen` per `log.py queue` (Frage: „Bestätigst du die Verfassung 1.0 (docs/studio/VERFASSUNG.md), insbesondere §5 Autonomie mit Vorrang vor ../CLAUDE.md und §7 Push auf main nach grünem Check?"; Empfehlung: bestätigen; Begründung: Nutzerauftrag Session 1.5; Kosten des Wartens: keine — gilt vorläufig; Blockiert: nichts; Von: studio-director). Das Event dieses Aufrufs vorher mit `STUDIO_HOME=<scratchpad>` ins Leere schreiben (nur die Datei zählt).
- **CLAUDE.md** (Projekt), Abschnitt „Arbeitsweise: Studio" ersetzen durch Dauerregeln: Hauptsession ist immer der Projektleiter (L0) — technisch: Output-Style `Projektleiter` + SessionStart-Hook; Rangfolge Verfassung > Handbuch; **In diesem Repo ersetzt die Autonomie-Regel der Verfassung (§5) das Nachfragen und Warten aus `../CLAUDE.md` („Entwickler-Kontext", „Beim Start" Punkt 3): L0 fragt nicht zurück, Vorbehalte gehen in `docs/studio/warteschlange.md`**; Verfassung nur durch den Nutzer; Start- und Ende-Routine: Verweis auf STUDIO.md (ohne Wiederholung). Context-Scope „Studio" um `.claude/output-styles/` ergänzen.
- **roster.md**: Namensschema um Stabsstelle `studio-<rolle>` (L1, direkt unter L0, ohne Arbeiter) ergänzen; aktive Personas: Spalte `Version` (alle `1.0`), Zeile `studio-coach`; Hinweis „Claude Code lädt neue Agent-Dateien erst in der nächsten Session" ersetzen durch „Die Datei-Überwachung lädt neue oder geänderte Agent-Dateien nach wenigen Sekunden; nur wenn `.claude/agents/` beim Session-Start fehlte, erst in der nächsten Session (dann Rückfall `general-purpose` mit Persona-Text)"; Persona-Versionierung: Frontmatter `version`, Erhöhung nur über Verbesserungsschleife mit CHANGELOG.
- **rulings.md**: R22–R33 im bestehenden Format (Datum 2026-09-30, Entscheider L0, Anlass Session 1.5), Inhalte laut Spec-Liste; R11 wird durch R28 erweitert („ergänzt R11"); R18 durch R23 abgelöst („löst R18 ab": CLAUDE.md verweist nur noch).
- **ADR-009** „Studio-Autonomie, Verfassung und Selbstverbesserung": Kontext (Nutzerauftrag, Konflikt mit Rückfragen-Regel, Messbarkeit), Optionen je Frage (L0-Mechanismus: `agent`-Setting / `--append-system-prompt` / Output-Style / nur Hook; Schutz: Konvention / Guard-Hook; Messung: OpenTelemetry / Transkripte / Schätzung), Entscheidung, Konsequenzen und Grenzen.
- **ADR-008** Abschnitt „Konsequenzen": Archiv-Ordner `.studio/archiv/`, Messung (Verweis STUDIO.md), Datenschutz um Briefings und Berichte im Klartext ergänzen.
- **docs/index.md**: Studio-Liste um VERFASSUNG, CHANGELOG, warteschlange, experimente, lernen, retros/, metriken/, ADR-009, Spec und Plan dieser Session.
- **README.md** Studio-Abschnitt: `make studio-metrics`, Hinweis auf Warteschlange und Verfassung (2–4 Zeilen).
- **arc42.md**: Zeile „Studio-Autonomie und Lernen | ADR-009" in der ADR-Tabelle.
- **model.py `classify`** + Test: `classify("studio-coach") == (1, "studio")`, `classify("studio-director") == (0, "studio")`.

- [ ] **Step 1:** Test für `classify` schreiben → FAIL; `classify` anpassen → PASS.
- [ ] **Step 2:** Dateien wie oben anlegen/ändern.
- [ ] **Step 3:** `make check` grün (inkl. `test_docs.py`; `studio-coach` hat `version: 1.0`).
- [ ] **Step 4: Commit** — `feat: Studio-Coach, Projektleiter-Output-Style, Rulings R22–R33, ADR-009`

---

### Task 12: Probelauf (L0 selbst, kein Implementierer)

- [ ] **Step 1:** Vorher: `git status` sauber. Alle Probe-Sessions laufen mit `STUDIO_HOME=<scratchpad>/probe-home`, `STUDIO_PORT=8799`, `STUDIO_NO_BROWSER=1` (eigene Events, eigener Server).
- [ ] **Step 2:** Neue headless Session: `cd <repo> && STUDIO_HOME=… STUDIO_PORT=8799 STUDIO_NO_BROWSER=1 claude -p "wir starten" --dangerously-skip-permissions --output-format json > <scratchpad>/probe-1.json`. Prüfen: Antwort nennt Dashboard-URL, ≤ 10 Zeilen Bericht, keine Frage an den Nutzer. (Setzt der Plan fort, Session nach dem Bericht nicht weiterlaufen lassen: Prompt-Zusatz „Nur Start-Bericht, dann Ende" in einem zweiten Lauf, falls nötig.)
- [ ] **Step 3:** Zweite headless Session mit Probe-Auftrag (Datei `<scratchpad>/probelauf.md`): L0 startet `lead-qa` (Paket PROBE-A, Meilenstein PROBE, Schätzung) → `qa-code-reviewer` liest `docs/studio/state.md` (rein lesend), Lead loggt `result`; L0 legt `N-900` an (blockiert PROBE-B), setzt PROBE-B auf blocked und erledigt PROBE-C (`lead-production` zählt die Personas, rein lesend); L0 versucht `VERFASSUNG.md` per Edit zu ändern (erwartet: Deny); L0 startet `studio-coach` für eine Mini-Retro (metrics, ein Experiment `E-900`); L0 nimmt es per Ruling an; Coach setzt Handbuch 1.1 + CHANGELOG-Eintrag (ohne Commit).
- [ ] **Step 4:** Dashboard prüfen: `make studio`, Screenshots aller Reiter (Desktop und Mobil) per Headless-Chrome nach `<scratchpad>/probe-<reiter>.png`; Delegation über zwei Ebenen mit Dauer/Tools/Tokens sichtbar; Warteschlange zeigt N-900; Studio-Reiter zeigt Handbuch 1.1 und E-900.
- [ ] **Step 5:** Protokoll `docs/studio/probelauf/2026-09-30.md` mit Ergebnis je Prüfpunkt (1–5, Guard, Dashboard, `/clear`/`/compact`-Hinweis) und ausgewählten Screenshots (`docs/studio/probelauf/*.png`, je ≤ 300 KB) schreiben und committen.
- [ ] **Step 6:** Aufräumen: Probe-`STUDIO_HOME` per `STUDIO_HOME=… python3 tools/studio/log.py archive` archivieren, Probe-Server stoppen; `git checkout -- docs/studio/STUDIO.md docs/studio/CHANGELOG.md docs/studio/warteschlange.md docs/studio/experimente.md docs/studio/lernen.md docs/studio/rulings.md docs/studio/state.md`; Probe-Dateien unter `docs/studio/retros/` und `docs/studio/metriken/` löschen (nur die im Probelauf erzeugten, per `git status --porcelain` ermittelt); `git status` sauber; Handbuch-Version 1.0.
- [ ] **Step 7:** Befunde des Probelaufs: Trivial-Fixes als eigene Commits, Rest nach `docs/beobachtungen.md`.

### Task 13: Final-Review und Merge

- [ ] **Step 1:** Final-Review (`opus`, Persona `qa-code-reviewer`) über `git diff main...feat/studio-autonomie` gegen Spec und Plan, inkl. `git diff main -- src/ tests/ public/` leer; Befunde abarbeiten (Fortsetzung desselben Implementierers).
- [ ] **Step 2:** Gate Merge (Ruling), `make check`, `git checkout main && git merge --no-ff feat/studio-autonomie`, `make check`, `git push origin main`, CI prüfen (`gh run list --branch main --limit 3`), `python3 tools/studio/ci.py`.
- [ ] **Step 3:** `state.md` nachführen, Branch mit `git branch -d feat/studio-autonomie` löschen (gemergt).
