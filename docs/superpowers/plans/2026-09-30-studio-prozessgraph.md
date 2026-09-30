# Prozess-Graph und vereinfachte Organigramm-Kacheln — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Das Studio-Dashboard zeigt je Session einen Prozess-Graphen (wer lief wie lange, wer sprach mit wem, wer untersteht wem) und vereinfachte Organigramm-Kacheln mit Name, Titel, Emoji-Status und Kurzaufgabe; Klick-Fokus verbindet beide.

**Architecture:** `hook.py` schreibt für `SendMessage` ein neues Event `message`. `model.py` führt beim Durchlauf eine Ereignisliste je Session (Art, Zeit, zum Eventzeitpunkt aufgelöster Knoten) und übergibt sie im Nachlauf an das neue reine Modul `graph.py`, das Zeilen, Läufe, Spalten, Spuren, Instanznummern und das Feld `graph` in `/api/state` berechnet. Das Dashboard zeichnet nur: `dashboard/graph.js` (SVG plus HTML-Zeilen), `dashboard/focus.js` (Fokus und offene Kacheln über das Neuzeichnen), Kacheln in `app.js`, Status-Tabelle in `dom.js`.

**Tech Stack:** Python 3 Standardbibliothek (`unittest`), reines HTML/CSS/JS (ES-Module), Headless-Chrome per CDP für den Playtest. Keine neuen Pakete.

**Spec:** `docs/superpowers/specs/2026-09-30-studio-prozessgraph-design.md` (Gate Spec OK; P1–P39 und alle Abnahmekriterien verbindlich).

**Status dieses Dokuments:** Gate Plan OK unter Auflage (R43); gegen `main` `2ad2d3e` nachgeführt (Auflage erfüllt). Abgelegt als `docs/superpowers/plans/2026-09-30-studio-prozessgraph.md`, Paket G, Meilenstein „Studio-Graph". Nachführung gegenüber dem Gate-Stand: Basis-Drift `47ea200` → `74017fb` (u. a. `on_status` mit Meilenstein-Stempel, `make studio-lint`), L0-Entscheide aus R43, `make studio-lint` in jeder DoD, Final-Review durch `lead-qa`.

**Basis:** `main` `2ad2d3e` (nach Merge von `feat/studio-autonomie`). Alle Code-Stücke wurden in einer Kopie dieses Stands als Prototyp ausgeführt: 275 Studio-Tests grün (216 der Basis + 59 neue), `make studio-lint` (Ruff check und format) grün, ESLint und Prettier grün, Headless-Chrome-Darstellung der Fixture-Session G ohne Fehler. Task 0 prüft die Annahmen noch einmal im Worktree.

## Global Constraints

- Keine neuen Abhängigkeiten: nur Python-Standardbibliothek und reines HTML/CSS/JS, kein npm-/pip-Paket, kein CDN (ADR-001, ADR-008).
- „`model.py` rechnet, `app.js` zeichnet nur" — übertragen: Berechnung in `model.py` + `graph.py`, Zeichnen in `dashboard/*.js` (Übertragung Ü3, Ü4).
- Kein Code unter `src/`, keine Werte in `src/sim/defs/`; der Balancing-Test bleibt unberührt.
- `make check` (lint = ESLint + Prettier über das ganze Repo inkl. `.md`, test, studio-test, build) ist nach jedem Task grün. Jede geänderte `.js`, `.css`, `.html`, `.md` mit `npx prettier --write <datei>` formatieren.
- Python: `make studio-lint` (Ruff check + format über `tools/studio`) ist nach jedem Python-Task grün; geänderte `.py` mit `uvx ruff format <datei>` formatieren (die Basis ist sauber). Import-Block in `test_model.py`: `from tests.fixtures import make_demo` steht durch eine Leerzeile getrennt nach `import graph` / `import model` (Ruff-Isort).
- Konstanten exakt: `hook.py` `MESSAGE_TOOL = "SendMessage"`, `MESSAGE_TEXT_MAX = 160`, `MESSAGE_TO_MAX = 120`; `graph.py` `GRAPH_ROWS = 300`, `PAUSE_GAP = 300.0`, `MESSAGE_TEXT_MAX = 160`, `FOLD_WINDOW = 30.0` (= `model.BIND_WINDOW`); `model.py` `SHORT_TASK = 30`, `DIRECTOR_NAME = ("Boss Bruno", "Projektleiter", "🎬")`, `FOREIGN_NAME = "Aushilfe"`, `FOREIGN_EMOJI = "🧑‍🔧"`; `graph.js` `GRAPH_COL_PX = 14`, `GRAPH_ROW_PX = 28`.
- Status-Tabelle K4 exakt: active 🔨 arbeitet · delegated 📣 lässt arbeiten · waiting ⏳ wartet · blocked 🚧 steckt fest · idle ☕ bereit · done ✅ fertig · failed 💥 gescheitert · ended 🌙 Feierabend · inaktiv 💤 döst seit n min.
- Namensliste T3 exakt, dazu `studio-coach` = Coach-Carla / Studio-Coach / 🧭 (R43); Direktor-Titel „Projektleiter" (R43).
- Sicherheit: alle Texte (`label`, `text`, `to`, Namen) nur per `textContent`/`setAttribute`/`title`, nie `innerHTML` (G12).
- Kleinster Breakpoint `720px`; darunter Spurbereich höchstens `120px` breit mit eigenem `overflow-x: auto`.
- Hooks werfen nie und blockieren nie; ein kaputtes Event kippt nie den ganzen Zustand.
- Dokumente Deutsch, Schweizer Schreibweise („ss"); Mermaid ohne `\n` in Labels.
- Commits: Präfix `feat:`/`fix:`/`docs:`/`refactor:`/`test:`, je Task mindestens ein Commit, Schluss mit
  `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` und
  `Claude-Session: https://claude.ai/code/session_017Jk9jiS524UFUH5GLiugjF`.
- Arbeitsverzeichnis aller Tasks: Worktree `/Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph`, Branch `feat/studio-prozessgraph`. Einzeltests aus `/Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph/tools/studio` mit `python3 -m unittest tests.<modul>.<Klasse>.<test> -v`; alle Studio-Tests mit `make studio-test` im Worktree.

## Review Focus

1. **Echte Sessions voller Fortschritts-Helfer** (`agent_stop` ohne Rolle, in einer echten Session 70 von 104 Knoten) → keine Zeile, keine Spalte, keine Kachel, nicht in `counts`, nicht in der Chronik. Tests: `StopOnlyTest` (Task 3, erweitert in Task 6b), `GateSpecFixesTest.test_chronicle_skips_stop_only_nodes` (Task 4), Fixture-Event 36a (Task 7).
2. **SendMessage ist kein Heartbeat mehr** → die Aufwandsmessung (`tool_calls`, Reiter Aufwand) darf keinen Tool-Aufruf verlieren. Test: `GraphTest.test_message_is_heartbeat_of_sender` prüft `tool_calls == 1` (Task 3).
3. **Doppelte oder verwaiste Events** (zweiter `agent_stop` ohne offenen Lauf, `spawn`, dessen Kind nie startet) → keine Ausnahme, keine Geisterzeile. Test: `GraphTest.test_duplicate_stop_and_unassigned_spawn_are_quiet` (Task 6b).
4. **Poll alle 2 s zerstört Bedienzustand** (offene Kachel, Fokus, Scrollposition, Hinweis) → alles bleibt stehen. Prüfung: Playtest K-S4, G-S8, G-S9, G-S13 und Code-Review P35 (Task 8, 9).
5. **Fremde `to`-Werte** (Zahl, 130 Zeichen, Objekt, leer, Anzeigename mit Leerraum) → Hook kürzt und stringifiziert, Modell zeigt „?" statt zu raten. Tests: `MessageEventTest` T1d/T1f (Task 1), `test_recipient_by_unique_role_or_name`, `test_empty_recipient_is_unresolved` (Task 6b).

## Übertragungen auf die Struktur nach `feat/studio-autonomie` (von L0 entschieden, R43)

| Nr. | Spec sagt                                                                        | Plan macht                                                                                                                                                                                                                          | Entscheid                                                                          |
| --- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Ü1  | Basis `main`                                                                     | Basis `main` `2ad2d3e` nach dem Merge von `feat/studio-autonomie`; Task 0 prüft die Annahmen                                                                                                                                        | umgesetzt (R43)                                                                    |
| Ü2  | Graph-Karte „direkt unter dem Organigramm"                                       | im Reiter **Live** direkt unter der Karte „Organigramm" (beide im selben Reiter, Klick-Fokus verbindet sie)                                                                                                                         | Ermessen `lead-tech` (Designabsicht gewahrt)                                       |
| Ü3  | Status-Tabelle, Fokus und Zeichnen „in `app.js`"                                 | Status-Tabelle in `dom.js` (dort liegt `STATUS_LABEL`), Fokus in neuem `dashboard/focus.js`, Graph in neuem `dashboard/graph.js`; Kacheln bleiben in `app.js`                                                                       | bestätigt (R43)                                                                    |
| Ü4  | Graph-Berechnung und Konstanten „in `model.py`"                                  | reines Modul `tools/studio/graph.py`; `model.py` liefert Ereignisliste und Knoten und re-exportiert `GRAPH_ROWS`, `PAUSE_GAP`, `MESSAGE_TEXT_MAX`; Tests bleiben wie in der Spec in `test_model.py`                                 | bestätigt (R43)                                                                    |
| Ü5  | 13 Persona-Dateien, Namensliste mit 14 Einträgen                                 | 14 Persona-Dateien: `studio-coach` = **Coach-Carla / Studio-Coach / 🧭**                                                                                                                                                            | entschieden (R43)                                                                  |
| Ü6  | Frontmatter-Felder ergänzen                                                      | je Persona `version: 1.0` → `1.1` und je Persona ein Eintrag `## 2026-09-30 · Persona <name> 1.1` in `docs/studio/CHANGELOG.md` (14 Einträge, weil Format und `test_docs.test_persona_versions` einen Eintrag je Persona verlangen) | entschieden (R43); 14 statt 1 Eintrag = Ermessen `lead-tech` nach CHANGELOG-Format |
| Ü7  | eigener Frontmatter-Parser `read_agent_names`                                    | `read_agent_names` nutzt `studio_docs.persona_meta`, erweitert um `studio_name/title/emoji`                                                                                                                                         | Ermessen `lead-tech` (DRY)                                                         |
| Ü8  | Direktor-Titel „Studio-Direktor"                                                 | `DIRECTOR_NAME = ("Boss Bruno", "Projektleiter", "🎬")`                                                                                                                                                                             | entschieden (R43)                                                                  |
| Ü9  | `STUDIO.md`: Onboarding-Hinweis                                                  | Onboarding steht in `roster.md` („Neue Persona anlegen") → Hinweis dort; `STUDIO.md` nur Reiter-Tabelle (Live: „Prozess-Graph")                                                                                                     | Ermessen `lead-tech`                                                               |
| Ü10 | T1i: `PreToolUse`-Matcher `"*"`                                                  | `PreToolUse` hat zwei Gruppen (Guard mit Werkzeug-Liste, Hook mit `"*"`); Test sucht die Gruppe `"*"` mit `hook.py`                                                                                                                 | Ermessen `lead-tech`                                                               |
| Ü11 | stop-only-Filter: Graph, Organigramm, Zähler (+ Chronik per L0-Ruling Gate Spec) | Reiter Aufwand/Qualität (`records`, `effort`, Vorfälle) zählen stop-only-Knoten weiter                                                                                                                                              | Beobachtung, nicht in diesem Plan (R43); Eintrag durch Task 10                     |
| Ü12 | Playtest schmal = 390×2400 per Fenstergrösse                                     | schmale Ansichten per CDP `Emulation.setDeviceMetricsOverride` (390×2400, `mobile: true`); Task 0 prüft, ob die Basis bei 390 px schon waagrecht überläuft (dann Beobachtung, kein Befund dieses Pakets)                            | Ermessen `lead-tech`                                                               |

Hinweis ohne Planänderung: Der Reiter „Delegation" zeigt bereits eine Zeitachse „wer → wen". Der Prozess-Graph ersetzt sie nicht; ob beide bleiben, ist eine Designfrage für `lead-design` nach dem Paket.

## Tasks, Datei-Ownership, Reihenfolge

Ein Strang, ein Worktree, streng seriell (nie zwei Implementierer gleichzeitig im Baum). Jede Datei gehört je Task genau einem Implementierer; spätere Tasks dürfen dieselbe Datei nur in ihrem eigenen Task ändern.

| Task | Titel                                                      | Implementierer                                                    | Dateien (Ownership im Task)                                                                                                                                                                                                   | blocked-by                    | QA                | Schätzung        |
| ---- | ---------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ----------------- | ---------------- |
| 0    | Worktree und Basisprüfung                                  | `lead-tech` (Controller)                                          | keine Änderung                                                                                                                                                                                                                | Merge `feat/studio-autonomie` | —                 | 10 min, 15 Tools |
| 1    | Hook: `message`-Event                                      | `production-studio-ops`                                           | `tools/studio/hook.py`, `tools/studio/tests/test_hook.py`                                                                                                                                                                     | 0                             | Review            | 20 min, 25 Tools |
| 2    | Fix A: Session nach Neustart wieder laufend                | `production-studio-ops`                                           | `tools/studio/model.py`, `tools/studio/tests/test_model.py`                                                                                                                                                                   | 0                             | Review            | 10 min, 12 Tools |
| 3    | Modell: stop-only, Lebenszeichen `message`                 | `production-studio-ops`                                           | `model.py`, `test_model.py`                                                                                                                                                                                                   | 2                             | Review            | 25 min, 30 Tools |
| 4    | Fix B: Chronik ohne stop-only-Knoten                       | `production-studio-ops`                                           | `model.py`, `test_model.py`                                                                                                                                                                                                   | 3                             | Review            | 10 min, 12 Tools |
| 5    | Namen, Titel, Emoji, Kurzaufgabe, Frontmatter, Persona 1.1 | `production-studio-ops`                                           | `model.py`, `studio_docs.py`, `server.py`, `test_model.py`, `.claude/agents/*.md` (14), `docs/studio/CHANGELOG.md`                                                                                                            | 4                             | Review            | 35 min, 45 Tools |
| 6a   | Graph-Kern I: Ereignisliste, Läufe, Instanzen              | `production-studio-ops`                                           | neu `tools/studio/graph.py`; `model.py`, `test_model.py`                                                                                                                                                                      | 5                             | Review            | 40 min, 45 Tools |
| 6b   | Graph-Kern II: Spalten, Spuren, `graph` in der API         | `production-studio-ops`                                           | `graph.py`, `model.py`, `test_model.py`                                                                                                                                                                                       | 6a                            | Review            | 45 min, 50 Tools |
| 7    | Fixture G, W, `--append-g9` und Referenztests              | `production-studio-ops`                                           | `tests/fixtures/make_demo.py`, neu `tests/fixtures/__init__.py`, `test_model.py` (Fixes an `graph.py`/`model.py` nur bei Referenzabweichung)                                                                                  | 6b                            | Review            | 30 min, 35 Tools |
| 8    | UI: Kacheln, Status-Tabelle, Kachel-Fokus                  | `tech-ui-engineer`                                                | `dashboard/dom.js`, neu `dashboard/focus.js`, `dashboard/app.js`, `dashboard/style.css`                                                                                                                                       | 7                             | Review + Playtest | 40 min, 45 Tools |
| 9    | UI: Prozess-Graph-Karte                                    | `tech-ui-engineer`                                                | neu `dashboard/graph.js`, `dashboard/index.html`, `dashboard/app.js`, `dashboard/focus.js`, `dashboard/style.css`                                                                                                             | 8                             | Review + Playtest | 60 min, 70 Tools |
| 10   | Doku                                                       | `production-studio-ops`                                           | `docs/adr/ADR-008-studio-telemetrie.md`, `docs/studio/roster.md`, `docs/studio/STUDIO.md`, `docs/studio/templates/persona.md`, `docs/superpowers/specs/2026-09-30-studio-design.md`, `docs/index.md`, `docs/beobachtungen.md` | 9                             | Review            | 25 min, 30 Tools |
| 11   | Final-Review (`opus`)                                      | `lead-qa` (startet `qa-code-reviewer` auf `opus`, eigenes Budget) | keine                                                                                                                                                                                                                         | 10, Bericht `lead-tech` an L0 | Final-Review      | —                |

**Wahl des Python-Implementierers:** `production-studio-ops` (Rolle auf Abruf laut `roster.md`: „Wartet die Studio-Werkzeuge (Dashboard, Hooks, `log.py`, Make-Ziele)"), gestartet als `subagent_type: general-purpose`, `model: sonnet`, Kopfzeile `Persona: production-studio-ops`, Persona-Text unten. Grund: `tech-sim-engineer` ist in seiner Persona-Datei auf `src/sim/`, TypeScript, Vitest und Save-Migrationen festgelegt; diese Regeln passen nicht zu `tools/studio/` (Python, `unittest`) und würden als falscher Qualitätsmassstab ins Review wirken. `production-studio-ops` ist genau für diese Dateien gedacht. Kosten: `general-purpose` hat das `Agent`-Werkzeug — das Briefing verbietet Starts ausdrücklich, die Telemetrie zeigt Verstösse. Die Rolle gehört zu `lead-production`; `lead-tech` leiht sie für dieses Paket (keine Persona-Datei, kein Roster-Eintrag nötig).

Persona-Text für das Briefing (`production-studio-ops`, nach `templates/persona.md`):

```text
Persona und Expertise: Du bist Studio-Ops-Entwickler: 10 Jahre kleine, robuste Werkzeuge in Python
ohne Frameworks (Standardbibliothek, unittest, http.server) und schlankes HTML/JS. Du schreibst
zuerst den Test, der rot ist, dann den kleinsten Code, der ihn grün macht. Hooks und Server dürfen
nie werfen; kaputte Eingaben werden still übersprungen.
Verantwortung und Grenzen: Du änderst nur die Dateien deines Tasks (Plan-Tabelle „Tasks,
Datei-Ownership"). Du startest keine Agenten, mergst nicht, fügst keine Abhängigkeit hinzu.
Befunde ausserhalb Scope meldest du im Bericht.
Qualitätsmassstab: neuer Test vorher rot, danach grün; make studio-test und make check grün;
make studio-lint grün; Code und Kommentare auf Deutsch wie im Bestand.
```

## Budgetantrag

```text
Lead: lead-tech
Phase: G-umsetzung (Meilenstein Studio-Graph)
Pakete:
- G-1 Hook message-Event (nein)
- G-2 Fix A Session-Neustart (nein)
- G-3 Modell stop-only und message (nein)
- G-4 Fix B Chronik ohne stop-only (nein)
- G-5 Namen, Kurzaufgabe, Frontmatter (nein)
- G-6a Graph-Kern I (nein)
- G-6b Graph-Kern II (nein)
- G-7 Fixture und Referenz (nein)
- G-8 UI Kacheln und Status (ja)
- G-9 UI Prozess-Graph (ja)
- G-10 Doku (nein)
Formel: 11 × 2 + 2 + 1 Final-Review = 25 → × 1,3 = 32,5 → aufgerundet 33
Parallelität: 2 (ein Worktree; parallel laufen nur Code-Review und Playtest desselben UI-Tasks, beide lesend)
Bisher frei/verbraucht: —
Begründung Mehrbedarf: —
Beantragt: 33 Starts, Parallelität 2 (davon 1 Final-Review auf opus) — freigegeben: 32 lead-tech, 1 lead-qa (R43)
```

Freigabe (R43): 32 Starts an `lead-tech`, Parallelität 2; 1 Start an `lead-qa` für das Final-Review (Handbuch, Stufe voll). Die Formel ohne Final-Review ergibt 24 Starts für `lead-tech`; der Rest ist Puffer für Neustarts und Zusatzprüfungen. Fix-Runden laufen per `SendMessage` im selben Arbeiter und zählen nicht.

## Controller-Ablauf je Task (lead-tech)

1. `python3 tools/studio/log.py package --id G-<n> --title "<Titel>" --owner lead-tech --status active --blocked-by <vorgänger> --milestone Studio-Graph` und `python3 tools/studio/log.py status --role lead-tech --status delegated --package G-<n>` (je eigener Bash-Aufruf).
2. Implementierer im Vordergrund starten, Briefing nach `docs/studio/templates/briefing.md` (Kopfzeilen `Persona`, `Paket: G-<n>`, `Meilenstein: Studio-Graph`, `Schätzung` aus der Tabelle, `Budget: keins, keine Agenten starten`, `Prozessstufe: voll`; Kontext = dieser Plan, Task-Abschnitt, plus die dort genannten Dateien; Ownership aus der Tabelle; Feste Regeln und Logging wörtlich).
3. Nach dem Commit des Implementierers: `qa-code-reviewer` mit Commit-Bereich (`git -C /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph log --oneline <vorher>..HEAD`), Task-Abschnitt und Spec-IDs; bei UI-Tasks gleichzeitig `qa-playtester` mit der Playtest-Liste des Tasks.
4. Urteil BEDENKEN/ZURÜCK → derselbe Implementierer per `SendMessage` mit den Befunden; danach derselbe Reviewer per `SendMessage` (kein neuer Start). Erst bei OK: `log.py result --role lead-tech --package G-<n> --worker <arbeiter> --outcome angenommen --review-rounds <n> --milestone Studio-Graph` und `log.py package … --status done --milestone Studio-Graph`.

---

### Task 0 (Controller): Worktree von `main` und Basisprüfung

**Files:** keine Änderung.

- [ ] **Step 1: Worktree anlegen** (`feat/studio-autonomie` ist gemergt, `main` = `2ad2d3e` + Plan-Commit)

```bash
git -C /Users/KN/CAS/projekte/anno-clone log --oneline -1 main
git -C /Users/KN/CAS/projekte/anno-clone worktree add /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph -b feat/studio-prozessgraph main
```

- [ ] **Step 2: Basis grün**

```bash
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph && make check && make studio-lint
```

Expected: alle Ziele grün. Rot → Task 0 stoppt, Bericht an L0 (Basisfehler, nicht dieses Paket).

- [ ] **Step 3: Annahmen des Plans prüfen**

```bash
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph && grep -n "export const STATUS_LABEL" tools/studio/dashboard/dom.js
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph && grep -n "\['org', renderOrg\]" tools/studio/dashboard/app.js
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph && grep -n "def persona_meta" tools/studio/studio_docs.py
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph && grep -n "def on_session_start\|def on_agent_start\|def result\|def build_state" tools/studio/model.py
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph && ls .claude/agents/ | wc -l
```

Expected: jede Zeile gefunden; 14 Persona-Dateien. Fehlt etwas oder sind es mehr Personas → Plan-Nachtrag (Namensliste, Anker) vor Task 1.

- [ ] **Step 4: Schmale Ansicht der Basis prüfen (Ü12)**

Fixture der Basis erzeugen, Server starten, per CDP mit `Emulation.setDeviceMetricsOverride` (390×2400, `mobile: true`) die Live-Ansicht laden und `document.documentElement.scrollWidth > window.innerWidth` abfragen. `true` → vorbestehender Überlauf: Eintrag in `docs/beobachtungen.md` durch Task 10, K-S6 und G-S4 prüfen dann nur, dass dieses Paket keinen zusätzlichen Überlauf erzeugt.

- [ ] **Step 5: Paket-Log**

```bash
python3 tools/studio/log.py package --id G-0 --title "Worktree Prozess-Graph" --owner lead-tech --status done --milestone Studio-Graph
```

### Task 1: Hook — `message`-Event für `SendMessage` (T1, P1, P27)

**Files:**

- Modify: `tools/studio/hook.py` (Konstanten, neue Funktion `message_fields`, neuer Zweig in `to_event`)
- Test: `tools/studio/tests/test_hook.py` (neue Klasse `MessageEventTest`; je ein Test in `MainTest` und `SettingsTest`)

**Interfaces:**

- Produces: Event `{"kind": "message", "to": str, "text": str, …Grundfelder}` in `.studio/events.jsonl`; `hook.message_fields(tool_input: dict) -> dict`.

- [ ] **Step 1: Failing tests schreiben**

In `tools/studio/tests/test_hook.py` vor `class HeaderTest` einfügen:

```python
class MessageEventTest(unittest.TestCase):
    def send(self, tool_input, **kw):
        return hook.to_event(
            payload("PreToolUse", tool_name="SendMessage", tool_input=tool_input, **kw)
        )

    def test_send_message_creates_message_event(self):
        event = self.send(
            {"to": "g-ts1", "message": "Bitte Befunde beheben", "summary": "Fix"},
            agent_id="g-lt",
            agent_type="lead-tech",
        )
        self.assertEqual(
            (
                event["kind"],
                event["agent_id"],
                event["role"],
                event["to"],
                event["text"],
            ),
            ("message", "g-lt", "lead-tech", "g-ts1", "Bitte Befunde beheben"),
        )
        self.assertNotIn("tool", event)

    def test_main_is_sender_without_agent_id(self):
        self.assertEqual(self.send({"to": "a1", "message": "x"})["agent_id"], "main")

    def test_message_text_collapsed_and_cut_at_160(self):
        spaced = self.send({"to": "a", "message": "a  b\t c"})["text"]
        self.assertEqual(spaced, "a b c")
        long = self.send({"to": "a", "message": "x" * 161})["text"]
        self.assertEqual(long, "x" * 160 + "…")
        exact = self.send({"to": "a", "message": "y" * 160})["text"]
        self.assertEqual(exact, "y" * 160)

    def test_to_cut_at_120_and_stringified(self):
        self.assertEqual(
            self.send({"to": "z" * 130, "message": "x"})["to"], "z" * 120 + "…"
        )
        self.assertEqual(self.send({"to": 42, "message": "x"})["to"], "42")

    def test_first_line_only_and_summary_not_stored(self):
        event = self.send({"to": "a", "summary": "Kurzfassung"})
        self.assertEqual(event["text"], "")
        self.assertNotIn("summary", event)
        self.assertNotIn("Kurzfassung", json.dumps(event, ensure_ascii=False))
        multi = self.send({"to": "a", "message": "\n\n  Erste Zeile\nZweite Zeile"})
        self.assertEqual(multi["text"], "Erste Zeile")

    def test_malformed_send_message_does_not_raise(self):
        for tool_input in ({"to": "a", "message": {"typ": "x"}}, None, "text", [1]):
            with self.subTest(tool_input=tool_input):
                event = self.send(tool_input)
                self.assertEqual(event["kind"], "message")
                if not isinstance(tool_input, dict):
                    self.assertEqual((event["to"], event["text"]), ("", ""))
        event = hook.to_event(payload("PreToolUse", tool_name="SendMessage"))
        self.assertEqual((event["to"], event["text"]), ("", ""))

    def test_other_tools_stay_heartbeat(self):
        for tool in ("Read", "Grep", "WebFetch", "ListAgents"):
            event = hook.to_event(payload("PreToolUse", tool_name=tool, tool_input={}))
            self.assertEqual((event["kind"], event["tool"]), ("heartbeat", tool))
```

In `class MainTest` vor `test_main_survives_garbage` einfügen:

```python
    def test_main_writes_message_event(self):
        stdin = json.dumps(
            payload(
                "PreToolUse",
                agent_id="g-lt",
                tool_name="SendMessage",
                tool_input={"to": "main", "message": "Fertig"},
            )
        )
        proc, lines = self.run_hook(stdin)
        self.assertEqual(proc.returncode, 0)
        self.assertEqual(len(lines), 1)
        event = json.loads(lines[0])
        self.assertEqual(
            (event["kind"], event["to"], event["text"]), ("message", "main", "Fertig")
        )
```

In `class SettingsTest` vor `test_guard_registered` einfügen (Ü10):

```python
    def test_pretooluse_matcher_covers_send_message(self):
        path = Path(__file__).resolve().parents[3] / ".claude" / "settings.json"
        groups = json.loads(path.read_text())["hooks"]["PreToolUse"]
        covering = [
            g
            for g in groups
            if g.get("matcher") == "*"
            and any("tools/studio/hook.py" in h["command"] for h in g["hooks"])
        ]
        self.assertEqual(len(covering), 1)
```

- [ ] **Step 2: Rot prüfen**

```bash
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph/tools/studio && python3 -m unittest tests.test_hook.MessageEventTest tests.test_hook.MainTest.test_main_writes_message_event -v
```

Expected: FAIL (`KeyError: 'to'` bzw. `kind == 'heartbeat'`). `SettingsTest.test_pretooluse_matcher_covers_send_message` ist schon grün (Matcher existiert; Regressionsschutz).

- [ ] **Step 3: Implementieren**

In `hook.py` die Konstanten direkt unter `AGENT_TOOLS` ergänzen:

```python
AGENT_TOOLS = ("Agent", "Task")
MESSAGE_TOOL = "SendMessage"
MESSAGE_TEXT_MAX = 160
MESSAGE_TO_MAX = 120
```

Neue Funktion direkt vor `def log_args(`:

```python
def message_fields(tool_input: dict) -> dict:
    """Empfänger und erste Zeile einer SendMessage; ``summary`` wird nie gespeichert."""
    raw_to = tool_input.get("to")
    to = "" if raw_to is None else cut(str(raw_to), MESSAGE_TO_MAX)
    message = tool_input.get("message")
    first = message.strip().split("\n", 1)[0] if isinstance(message, str) else ""
    return {"to": to, "text": cut(" ".join(first.split()), MESSAGE_TEXT_MAX)}
```

In `to_event` den allgemeinen Heartbeat-Zweig ersetzen durch (Zweig steht vor dem Heartbeat):

```python
    elif name == "PreToolUse" and tool == MESSAGE_TOOL:
        event.update(kind="message", **message_fields(tool_input))
    elif name == "PreToolUse":
        event.update(kind="heartbeat", tool=str(tool))
```

- [ ] **Step 4: Grün prüfen**

```bash
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph/tools/studio && python3 -m unittest tests.test_hook -v
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph && make studio-test && make studio-lint
```

Expected: PASS; keine neuen Ruff-Befunde.

- [ ] **Step 5: Commit**

```bash
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph && git add tools/studio/hook.py tools/studio/tests/test_hook.py && git commit -m "feat: Hook schreibt message-Event für SendMessage"
```

### Task 2: Fix A — Session nach Neustart wieder laufend (L0-Ruling Gate Spec)

Die Spec schliesst die Korrektur von `sessions[].ended` aus; das L0-Ruling Gate Spec holt sie als Trivial-Fix herein. Die Auswahl zeigt die Session danach ohne „(beendet)".

**Files:**

- Modify: `tools/studio/model.py` (`on_session_start`)
- Test: `tools/studio/tests/test_model.py` (neue Klasse `GateSpecFixesTest`)

**Interfaces:**

- Produces: `state["sessions"][i]["ended"] is None`, sobald nach einem `session_end` wieder ein `session_start` derselben Session kommt.

- [ ] **Step 1: Failing test** — am Ende von `test_model.py` vor `if __name__ == "__main__":` einfügen:

```python
class GateSpecFixesTest(unittest.TestCase):
    def test_session_restart_clears_ended(self):
        events = [
            ev("session_start", 0, status="idle"),
            ev("session_end", 10, status="ended"),
            ev("session_start", 20, status="idle"),
        ]
        self.assertIsNone(build(events)["sessions"][0]["ended"])
        self.assertIsNotNone(build(events[:2])["sessions"][0]["ended"])
```

- [ ] **Step 2: Rot prüfen**

```bash
cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph/tools/studio && python3 -m unittest tests.test_model.GateSpecFixesTest -v
```

Expected: FAIL (`ended` ist eine Zahl).

- [ ] **Step 3: Implementieren** — erste Zeile in `on_session_start`:

```python
    def on_session_start(self, event, ts, sid):
        self.sessions[sid]["ended"] = None  # Neustart: Session läuft wieder
        main = self.node(sid, "main", ts)
```

- [ ] **Step 4: Grün prüfen** — `python3 -m unittest tests.test_model -v`, `make studio-test`, `make studio-lint`. Expected: PASS.

- [ ] **Step 5: Commit** — `git add tools/studio/model.py tools/studio/tests/test_model.py && git commit -m "fix: Session gilt nach Neustart wieder als laufend"`

### Task 3: Modell — stop-only-Knoten (P31) und `message` als Lebenszeichen (T2a)

**Files:**

- Modify: `tools/studio/model.py` (Knotenfeld `_signal`, Methoden `signal`, `hidden`, `on_message`; Aufrufe in `apply`, `on_spawned`, `on_status`; Filter in `result`)
- Test: `tools/studio/tests/test_model.py` (Hilfen `message`, `lead`; Klassen `GraphTest`, `StopOnlyTest`)

**Interfaces:**

- Produces: `_Builder.hidden(key: str) -> bool` (von Task 4, 6a, 6b genutzt); Knotenfeld `_signal: bool`; `_Builder.on_message(event, ts, sid)`.

- [ ] **Step 1: Failing tests** — vor `if __name__ == "__main__":` (und vor `GateSpecFixesTest`) einfügen:

```python
# --- Prozess-Graph (Spec 2026-09-30-studio-prozessgraph-design.md) ----------


def message(t, sender, to, text="Hallo", **kw):
    return ev("message", t, agent_id=sender, to=to, text=text, **kw)


def lead(t=1, aid="a1", typ="lead-qa", **kw):
    return [spawn(t, "main", typ, description="Auftrag", **kw), start(t + 1, aid, typ)]


class GraphTest(unittest.TestCase):
    def test_message_is_heartbeat_of_sender(self):
        state = build([*lead(), message(50, "a1", "main")])
        node = flat(state)["s1:a1"]
        self.assertEqual(node["last_seen"], T0 + 50)
        self.assertEqual(node["status"], "active")
        record = next(r for r in state["records"] if r["key"] == "s1:a1")
        self.assertEqual(record["tool_calls"], 1)  # SendMessage zählt als Tool-Aufruf


HELPER = {"agent_id": "h1", "status": "done", "summary": "Fortschritt: 3 von 5"}


class StopOnlyTest(unittest.TestCase):
    def test_hidden_in_graph_tree_and_counts(self):
        state = build(
            [ev("session_start", 0, status="idle"), ev("agent_stop", 5, **HELPER)]
        )
        self.assertNotIn("s1:h1", flat(state))
        self.assertNotIn("done", state["counts"])

    def test_role_or_other_event_keeps_node_visible(self):
        with_role = ev("agent_stop", 5, role="Explore", **HELPER)
        self.assertIn("s1:h1", flat(build([with_role])))
        beat = ev("heartbeat", 4, agent_id="h1", tool="Read")
        state = build([beat, ev("agent_stop", 5, **HELPER)])
        self.assertIn("s1:h1", flat(state))
```

- [ ] **Step 2: Rot prüfen** — `python3 -m unittest tests.test_model.GraphTest tests.test_model.StopOnlyTest -v`. Expected: FAIL (`s1:h1` im Baum, `done` gezählt; `tool_calls` ist 0, weil `message` noch nichts zählt).

- [ ] **Step 3: Implementieren**

Im Knoten-Dict in `node()` nach `"_pulse": ts,`:

```python
                "_signal": is_main,
```

Direkt vor `def apply(`:

```python
    def signal(self, event: dict, sid: str) -> None:
        """Jedes Event ausser agent_stop ohne Rolle macht einen Knoten sichtbar (P31)."""
        if event.get("source") == "log":
            return
        if event.get("kind") == "agent_stop" and not event.get("role"):
            return
        node = self.nodes.get(f"{sid}:{event.get('agent_id') or 'main'}")
        if node is not None:
            node["_signal"] = True

    def hidden(self, key: str) -> bool:
        """stop-only-Knoten: nur ein agent_stop ohne Rolle, sonst nichts (P31)."""
        node = self.nodes[key]
        return node["agent_id"] != "main" and not node["_signal"]
```

In `apply` nach dem Handler-Aufruf, vor `self.add_feed(event, ts, sid)`:

```python
        if handler is not None:
            handler(event, ts, sid)
        self.signal(event, sid)
        self.add_feed(event, ts, sid)
```

In `on_spawned` nach `child["_confirmed"] = True`: `child["_signal"] = True`. In `on_status` direkt nach dem `self.resolve(…)`-Aufruf: `node["_signal"] = True`.

Neue Methode direkt vor `def on_heartbeat(`:

```python
    def on_message(self, event, ts, sid):
        sender = self.agent(event, ts, sid)  # Lebenszeichen wie ein Heartbeat (T2)
        self.count_tool(sender)  # SendMessage bleibt ein Tool-Aufruf (Aufwand)
```

In `result()` die Kinder im Baum und die Zähler filtern:

```python
        def tree(key: str) -> dict:
            node = dict(views[key])
            children = sorted(
                (k for k in self.nodes[key]["children"] if not self.hidden(k)),
                key=lambda k: self.nodes[k]["started"],
            )
            node["children"] = [tree(k) for k in children]
            return node
```

```python
        in_scope = [
            v
            for k, v in views.items()
            if v["session_id"] in scope and not self.hidden(k)
        ]
```

- [ ] **Step 4: Grün prüfen** — `python3 -m unittest tests.test_model -v`, `make studio-test`, `make studio-lint`. Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "feat: Modell blendet stop-only-Knoten aus und zählt message als Lebenszeichen"`

### Task 4: Fix B — Chronik ohne stop-only-Knoten (L0-Ruling Gate Spec)

**Files:**

- Modify: `tools/studio/model.py` (`add_chronicle`, Chronik in `result`)
- Test: `tools/studio/tests/test_model.py` (`GateSpecFixesTest`)

**Interfaces:**

- Consumes: `_Builder.hidden(key)` aus Task 3.
- Produces: Chronik-Einträge ohne internes Feld `_key` in der API.

- [ ] **Step 1: Failing test** — in `class GateSpecFixesTest` anhängen:

```python
    def test_chronicle_skips_stop_only_nodes(self):
        helper = ev(
            "agent_stop", 5, agent_id="h1", status="done", summary="Fortschritt"
        )
        self.assertEqual(build([helper])["chronicle"], [])
        real = ev(
            "agent_stop",
            6,
            agent_id="x1",
            role="Explore",
            status="done",
            summary="Gefunden",
        )
        texts = [c["text"] for c in build([helper, real])["chronicle"]]
        self.assertEqual(texts, ["Gefunden"])
        self.assertNotIn("_key", build([real])["chronicle"][0])
```

- [ ] **Step 2: Rot prüfen** — `python3 -m unittest tests.test_model.GateSpecFixesTest -v`. Expected: FAIL (Chronik enthält „Fortschritt").

- [ ] **Step 3: Implementieren** — in `add_chronicle` im angehängten Dict nach `"text": _short(text, 400),` die Zeile `"_key": node["key"],`; in `result()`:

```python
        chronicle = [
            {k: v for k, v in c.items() if k != "_key"}
            for c in self.chronicle
            if c["session_id"] in scope and not self.hidden(c["_key"])
        ]
```

- [ ] **Step 4: Grün prüfen** — `make studio-test`, `make studio-lint`. Expected: PASS.

- [ ] **Step 5: Commit** — `git commit -m "fix: Chronik ohne Fortschritts-Helfer"`

### Task 5: Namen, Titel, Emoji, Kurzaufgabe und Persona-Frontmatter (T3, T6, P10, P12, P19, P20)

**Files:**

- Modify: `tools/studio/studio_docs.py` (`persona_meta` liefert `studio_name`, `studio_title`, `studio_emoji`)
- Modify: `tools/studio/model.py` (Import `studio_docs`, Konstanten, `PUBLIC`, Knotenfelder, `read_agent_names`, `identity`, `_Builder(…, agent_names)`, `identities()`, `build_state(…, agent_names=None)`)
- Modify: `tools/studio/server.py` (Namen je Anfrage lesen)
- Modify: `.claude/agents/*.md` (14 Dateien: `studio-name`, `studio-title`, `studio-emoji`; `version: 1.1`)
- Modify: `docs/studio/CHANGELOG.md` (14 Einträge `Persona <name> 1.1`, R43)
- Test: `tools/studio/tests/test_model.py` (`NAMES`, `named`, `PERSONA_NAMES`, Klasse `NamesTest`)

**Interfaces:**

- Produces: `model.read_agent_names(agents_dir: Path) -> dict[str, dict]` (Einträge nur mit vorhandenen Feldern `name`/`title`/`emoji`); `model.identity(role: str, names: dict) -> tuple[str, str, str]`; `build_state(…, agent_names: dict[str, dict] | None = None)`; öffentliche Knotenfelder `name`, `title`, `emoji`, `task_short`; internes Feld `_base_name` (von Task 6a gelesen).

- [ ] **Step 1: Failing tests** — nach den Hilfen aus Task 3 einfügen:

```python
NAMES = {
    "lead-qa": {"name": "Prüf-Peter", "title": "QA-Chef", "emoji": "🔍"},
    "lead-tech": {"name": "Technik-Toni", "title": "Tech-Chef", "emoji": "🔧"},
    "lead-art": {"name": "Pinsel-Pia", "title": "Kunst-Chefin", "emoji": "🎨"},
    "tech-sim-engineer": {
        "name": "Logik-Lars",
        "title": "Spiellogik-Entwickler",
        "emoji": "⚙️",
    },
    "qa-playtester": {"name": "Zocker-Zoe", "title": "Spieltesterin", "emoji": "🎮"},
    "qa-code-reviewer": {
        "name": "Review-Rita",
        "title": "Code-Prüferin",
        "emoji": "👓",
    },
    "design-genre-researcher": {"name": "Genre-Gina"},
}


def named(events, **kw):
    return build(events, agent_names=NAMES, **kw)


PERSONA_NAMES = {
    "lead-production": {
        "name": "Planungs-Paula",
        "title": "Produktionschefin",
        "emoji": "📋",
    },
    "lead-design": {"name": "Ideen-Ida", "title": "Design-Chefin", "emoji": "💡"},
    "lead-tech": {"name": "Technik-Toni", "title": "Tech-Chef", "emoji": "🔧"},
    "lead-art": {"name": "Pinsel-Pia", "title": "Kunst-Chefin", "emoji": "🎨"},
    "lead-qa": {"name": "Prüf-Peter", "title": "QA-Chef", "emoji": "🔍"},
    "production-integrator": {
        "name": "Merge-Moritz",
        "title": "Zusammenführer",
        "emoji": "🔀",
    },
    "design-spec-author": {
        "name": "Spec-Sabine",
        "title": "Spec-Schreiberin",
        "emoji": "📝",
    },
    "design-economy-designer": {
        "name": "Taler-Theo",
        "title": "Wirtschaftsplaner",
        "emoji": "💰",
    },
    "tech-sim-engineer": {
        "name": "Logik-Lars",
        "title": "Spiellogik-Entwickler",
        "emoji": "⚙️",
    },
    "tech-ui-engineer": {
        "name": "UI-Ursula",
        "title": "Oberflächen-Entwicklerin",
        "emoji": "🖱️",
    },
    "art-license-checker": {
        "name": "Paragraphen-Paul",
        "title": "Lizenzprüfer",
        "emoji": "⚖️",
    },
    "qa-code-reviewer": {
        "name": "Review-Rita",
        "title": "Code-Prüferin",
        "emoji": "👓",
    },
    "qa-playtester": {"name": "Zocker-Zoe", "title": "Spieltesterin", "emoji": "🎮"},
    "studio-coach": {"name": "Coach-Carla", "title": "Studio-Coach", "emoji": "🧭"},
}
```

und vor `GateSpecFixesTest`:

```python
class NamesTest(unittest.TestCase):
    def test_all_personas_have_names(self):
        agents = Path(__file__).resolve().parents[3] / ".claude" / "agents"
        self.assertEqual({p.stem for p in agents.glob("*.md")}, set(PERSONA_NAMES))
        self.assertEqual(model.read_agent_names(agents), PERSONA_NAMES)

    def test_read_agent_names_from_frontmatter(self):
        with tempfile.TemporaryDirectory() as tmp:
            folder = Path(tmp)
            (folder / "lead-qa.md").write_text(
                '---\nname: lead-qa\nmodel: opus\nstudio-name: "Prüf-Peter"\n'
                "studio-title: 'QA-Chef'\n---\nText\n",
                "utf-8",
            )
            (folder / "lead-art.md").write_text("---\nname: lead-art\n---\n", "utf-8")
            names = model.read_agent_names(folder)
        self.assertEqual(names, {"lead-qa": {"name": "Prüf-Peter", "title": "QA-Chef"}})
        node = flat(build(lead(), agent_names=names))["s1:a1"]
        self.assertEqual(
            (node["name"], node["title"], node["emoji"]),
            ("Prüf-Peter", "QA-Chef", model.FOREIGN_EMOJI),
        )

    def test_director_and_foreign_fallbacks(self):
        nodes = flat(named([start(1, "x1", "Explore")]))
        main, helper = nodes["s1:main"], nodes["s1:x1"]
        self.assertEqual(
            (main["name"], main["title"], main["emoji"]),
            ("Boss Bruno", "Projektleiter", "🎬"),
        )
        self.assertEqual(
            (helper["name"], helper["title"], helper["emoji"]),
            ("Aushilfe", "Explore", "🧑‍🔧"),
        )

    def test_name_follows_final_role(self):
        events = [
            spawn(
                1,
                "main",
                "general-purpose",
                persona="design-genre-researcher",
                tool_use_id="t1",
            ),
            spawn(2, "main", "general-purpose", tool_use_id="t2"),
            start(3, "g1", "general-purpose"),
            start(4, "g2", "general-purpose"),
            ev("spawned", 5, agent_id="main", child_id="g2", tool_use_id="t1"),
            ev("spawned", 6, agent_id="main", child_id="g1", tool_use_id="t2"),
        ]
        nodes = flat(named(events))
        self.assertEqual(nodes["s1:g2"]["name"], "Genre-Gina")
        self.assertEqual(nodes["s1:g1"]["name"], "Aushilfe")

    def test_task_short(self):
        exact, longer = "x" * 30, "y" * 31
        events = [
            ev("prompt", 1, status="active", task="Erste Zeile des Auftrags"),
            spawn(2, "main", "lead-qa", description=exact),
            start(3, "a1", "lead-qa"),
            spawn(4, "main", "lead-tech", description=longer),
            start(5, "a2", "lead-tech"),
        ]
        nodes = flat(named(events))
        self.assertEqual(nodes["s1:a1"]["task_short"], exact)
        self.assertEqual(nodes["s1:a2"]["task_short"], "y" * 30 + "…")
        self.assertEqual(nodes["s1:main"]["task_short"], "Erste Zeile des Auftrags")
```

- [ ] **Step 2: Rot prüfen** — `python3 -m unittest tests.test_model.NamesTest -v`. Expected: FAIL (`AttributeError: read_agent_names`, `TypeError: agent_names`).

- [ ] **Step 3: Implementieren**

`studio_docs.persona_meta` — im Ergebnis-Dict nach `"tools": …`:

```python
            "studio_name": meta.get("studio-name", ""),
            "studio_title": meta.get("studio-title", ""),
            "studio_emoji": meta.get("studio-emoji", ""),
```

`model.py` — Import nach `import effort`: `import studio_docs`. Konstanten nach `TEXT_MAX = 160`:

```python
SHORT_TASK = 30
DIRECTOR_NAME = ("Boss Bruno", "Projektleiter", "🎬")
FOREIGN_NAME = "Aushilfe"
FOREIGN_EMOJI = "🧑‍🔧"
```

(`FOREIGN_EMOJI` ist 🧑 + Zero-Width-Joiner U+200D + 🔧, also genau „🧑‍🔧"; Titel „Projektleiter" nach R43.)

`PUBLIC` am Ende um `"name", "title", "emoji", "task_short",` ergänzen. Im Knoten-Dict nach `"last_seen": ts,`:

```python
                "name": "",
                "title": "",
                "emoji": "",
                "task_short": "",
                "_base_name": "",
```

Neue Funktionen direkt vor `def read_agent_models(`:

```python
def read_agent_names(agents_dir: Path) -> dict[str, dict]:
    """rolle → {name, title, emoji} aus studio-name/-title/-emoji der Frontmatter."""
    names: dict[str, dict] = {}
    for role, meta in studio_docs.persona_meta(agents_dir).items():
        entry = {
            field: meta[f"studio_{field}"]
            for field in ("name", "title", "emoji")
            if meta.get(f"studio_{field}")
        }
        if entry:
            names[role] = entry
    return names


def identity(role: str, names: dict[str, dict]) -> tuple[str, str, str]:
    """(Name, Titel, Emoji) einer Rolle; Rückfall je Feld (T3)."""
    if role in (DIRECTOR, "main"):
        fallback = DIRECTOR_NAME
    else:
        fallback = (FOREIGN_NAME, role, FOREIGN_EMOJI)
    entry = names.get(role) or {}
    return (
        entry.get("name") or fallback[0],
        entry.get("title") or fallback[1],
        entry.get("emoji") or fallback[2],
    )
```

`_Builder.__init__` bekommt den Parameter und merkt ihn:

```python
    def __init__(
        self,
        agent_models: dict[str, str],
        now: float,
        agent_names: dict[str, dict] | None = None,
    ) -> None:
        self.models = agent_models
        self.names = agent_names or {}
        self.now = now
```

Neue Methode direkt nach `hidden()` (aus Task 3):

```python
    def identities(self) -> None:
        """Name, Titel, Emoji und Kurzaufgabe je sichtbarem Knoten (T3, T6)."""
        for key, node in self.nodes.items():
            if self.hidden(key):
                continue
            name, node["title"], node["emoji"] = identity(node["role"], self.names)
            node["name"] = node["_base_name"] = name
            node["task_short"] = _short(node["task"], SHORT_TASK)
```

In `result()` direkt nach `self.finalize()`: `self.identities()`. `build_state` bekommt als letzten Parameter `agent_names: dict[str, dict] | None = None` und ruft `_Builder(agent_models, now, agent_names)`. `pending_incidents` bleibt unverändert (Rückfallwerte).

`server.py`: Import `read_agent_names` aus `model` ergänzen und in `send_state` an `build_state` `agent_names=read_agent_names(self.agents),` übergeben.

Frontmatter: in jeder der 14 Dateien unter `.claude/agents/` direkt vor der schliessenden `---`-Zeile drei Zeilen nach `PERSONA_NAMES` (ohne Anführungszeichen), z. B. `lead-tech.md`:

```yaml
studio-name: Technik-Toni
studio-title: Tech-Chef
studio-emoji: 🔧
```

Persona-Versionen (Ü6, R43): in denselben 14 Dateien `version: 1.0` → `version: 1.1`. In `docs/studio/CHANGELOG.md` direkt über `## 2026-09-30 · Handbuch 1.0` je Persona (alphabetisch) ein Eintrag im Format der Datei, z. B.:

```markdown
## 2026-09-30 · Persona art-license-checker 1.1

- Anlass: Paket G (Prozess-Graph), Anzeige-Namen im Dashboard
- Datenbasis: Auftrag (Spec 2026-09-30-studio-prozessgraph-design.md, Namensliste T3)
- Ruling: R43
- Änderungen: Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji`; kein Verhalten geändert
```

- [ ] **Step 4: Grün prüfen** — `python3 -m unittest tests.test_model tests.test_studio_docs tests.test_docs tests.test_server -v`, `make studio-test`, `make studio-lint`, `npx prettier --check docs/studio/CHANGELOG.md`. Expected: PASS (`test_docs.test_persona_versions` prüft 1.1 gegen die CHANGELOG-Einträge).

- [ ] **Step 5: Commit** — `git add tools/studio .claude/agents docs/studio/CHANGELOG.md && git commit -m "feat: Namen, Titel, Emoji und Kurzaufgabe je Agent"`

### Task 6a: Graph-Kern I — Ereignisliste, Läufe (P37) und Instanznummern (P9, P21)

**Files:**

- Create: `tools/studio/graph.py` (Klasse `Layout` Durchlauf 1, Funktion `instances`)
- Modify: `tools/studio/model.py` (Import `graph`, Ereignisliste, Knotenfelder `instance`/`_first`, `record()` in sieben Handlern, `graph_record`, `layouts`)
- Test: `tools/studio/tests/test_model.py` (Import `graph`; `NamesTest` um sechs Methoden)

**Interfaces:**

- Consumes: `hidden()` (Task 3), `_base_name` (Task 5).
- Produces: `graph.Layout(sid: str, records: list[dict], info: dict[str, dict])` mit `rows`, `runs`, `resolve(to: str) -> str | None`, `run_times() -> dict[str, list[tuple[float, float | None]]]`; `graph.instances(info, run_times) -> dict[str, int]`; `graph.short(text, limit=160) -> str`; `graph.clock(t) -> str`; `_Builder.layouts() -> dict[str, graph.Layout]`; Knotenfeld `instance: int`, `name` mit „ (n)" ab Instanz 2. Ereignis-Eintrag: `{"i", "kind", "t", "ts", "key", …}` mit `kind` ∈ `session_start`, `session_end`, `spawn` (`entry`, `description`), `agent_start` (`resume`), `agent_stop` (`summary`), `message` (`to`, `text`), `status` (`status`, `task`, `summary`). `info[key]` = `{"agent_id", "role", "department", "parent", "base_name", "task", "first": (t, ts, i), "log_only"}`.

- [ ] **Step 1: Failing tests** — `import graph` vor `import model` ergänzen; in `class NamesTest` anhängen:

```python
    def test_fold_window_matches_bind_window(self):
        self.assertEqual(graph.FOLD_WINDOW, model.BIND_WINDOW)

    def sims(self, *spans):
        """Je (start, stop) ein tech-sim-engineer-Lauf w1, w2, … (stop None = offen)."""
        events = []
        for n, (a, b) in enumerate(spans, 1):
            events.append(start(a, f"w{n}", "tech-sim-engineer"))
            if b is not None:
                events.append(stop(b, f"w{n}", "tech-sim-engineer"))
        return flat(named(events, now=200))

    def test_second_instance_gets_suffix(self):
        nodes = self.sims((1, None), (2, None))
        self.assertEqual(
            [(nodes[k]["name"], nodes[k]["instance"]) for k in ("s1:w1", "s1:w2")],
            [("Logik-Lars", 1), ("Logik-Lars (2)", 2)],
        )

    def test_instance_number_rule(self):
        nodes = self.sims((1, 10), (2, 30), (20, 40), (50, None))
        numbers = [nodes[f"s1:w{n}"]["instance"] for n in (1, 2, 3, 4)]
        self.assertEqual(numbers, [1, 2, 3, 1])

    def test_paused_node_holds_no_instance(self):
        events = [
            start(1, "w1", "tech-sim-engineer"),
            stop(5, "w1", "tech-sim-engineer"),
            start(10, "w2", "tech-sim-engineer"),
            message(15, "main", "w1"),
            start(20, "w1", "tech-sim-engineer"),
        ]
        nodes = flat(named(events))
        self.assertEqual(
            (nodes["s1:w1"]["instance"], nodes["s1:w2"]["instance"]), (1, 1)
        )

    def test_log_only_and_foreign_second_instance(self):
        events = [
            start(1, "x1", "Explore"),
            start(2, "x2", "Explore"),
            log_status(3, "lead-art", "blocked", task="Lizenz"),
        ]
        nodes = flat(named(events))
        self.assertEqual(nodes["s1:x2"]["name"], "Aushilfe (2)")
        self.assertEqual(nodes["s1:log:lead-art"]["name"], "Pinsel-Pia")
```

- [ ] **Step 2: Rot prüfen** — `python3 -m unittest tests.test_model.NamesTest -v`. Expected: FAIL (`ModuleNotFoundError: graph`).

- [ ] **Step 3: `tools/studio/graph.py` anlegen** (Durchlauf 1; Durchlauf 2 folgt in Task 6b):

```python
"""Prozess-Graph einer Session: Zeilen, Läufe, Spalten und Spuren.

Regeln: docs/superpowers/specs/2026-09-30-studio-prozessgraph-design.md (P3–P7,
P21–P25, P31–P38). Reine Funktionen ohne Zugriff auf Dateien oder Uhrzeit.
"""

from __future__ import annotations

from datetime import datetime, timezone

GRAPH_ROWS = 300
PAUSE_GAP = 300.0
MESSAGE_TEXT_MAX = 160
FOLD_WINDOW = 30.0  # gleich wie model.BIND_WINDOW
ROW_STATUSES = frozenset({"done", "blocked", "waiting", "failed"})


def short(text: object, limit: int = MESSAGE_TEXT_MAX) -> str:
    text = " ".join(str(text or "").split())
    return text if len(text) <= limit else text[:limit] + "…"


def clock(t: float) -> str:
    return datetime.fromtimestamp(t, timezone.utc).astimezone().strftime("%H:%M")


class Layout:
    """Zeilen und Läufe einer Session (Durchlauf 1, ohne Namen und Spalten).

    ``records``: Ereignisliste des Modells in Event-Reihenfolge, je Eintrag
    ``{"i", "kind", "t", "ts", "key", …}``. ``info``: sichtbare Knoten der Session
    (ohne stop-only-Knoten) mit ``agent_id``, ``role``, ``department``, ``parent``,
    ``base_name``, ``task``, ``first`` = (t, ts, i).
    """

    def __init__(self, sid: str, records: list[dict], info: dict[str, dict]) -> None:
        self.sid = sid
        self.info = info
        self.main = f"{sid}:main"
        self.rows: list[dict] = []
        self.runs: dict[str, list[list]] = {key: [] for key in info}
        self._last_message: dict[str, int] = {}
        self._used_for_resume: set[int] = set()
        self._build(records)

    # --- Empfänger (P2, P38) --------------------------------------------------

    def resolve(self, to: str) -> str | None:
        target = str(to or "").strip()
        if not target:
            return None
        if target == "main":
            return self.main
        head = target.split(" [", 1)[0].strip()
        if f"{self.sid}:{head}" in self.info:
            return f"{self.sid}:{head}"
        hits = [
            key
            for key, node in self.info.items()
            if head in (node["role"], node["base_name"])
        ]
        return hits[0] if len(hits) == 1 else None

    # --- Durchlauf 1: Zeilen und Läufe (P3, P22, P32, P37) -------------------

    def _build(self, records: list[dict]) -> None:
        records = [r for r in records if r["key"] in self.info]
        folded_status, stop_text = self._done_folds(records)
        ordered = self._children_with_order(records)
        first_start = {}
        for rec in records:
            if rec["kind"] == "agent_start" and not rec.get("resume"):
                first_start.setdefault(rec["key"], rec["i"])
        for rec in self._with_first_events(records, ordered, first_start):
            kind, key = rec["kind"], rec["key"]
            if kind == "session_start":
                self._session_start(rec)
            elif kind == "session_end":
                self._session_end(rec)
            elif kind == "spawn":
                self._spawn(rec)
            elif kind == "agent_start":
                self._agent_start(rec, key in ordered)
            elif kind == "first":
                self._first_row(rec)
            elif kind == "agent_stop":
                self._agent_stop(rec, stop_text.get(rec["i"]))
            elif kind == "message":
                self._message(rec)
            elif kind == "status" and rec["i"] not in folded_status:
                self._status(rec)
        for key, node in self.info.items():
            if node["log_only"]:
                self._close_log_only(key)

    def _children_with_order(self, records: list[dict]) -> set[str]:
        return {
            r["child"]
            for r in records
            if r["kind"] == "spawn" and r.get("child") in self.info
        }

    def _with_first_events(
        self, records: list[dict], ordered: set[str], first_start: dict[str, int]
    ) -> list[dict]:
        """Knoten ohne agent_start und ohne Auftrag bekommen eine start-Zeile (P22)."""
        extra = []
        for key, node in self.info.items():
            if key == self.main or node["log_only"]:
                continue
            if key in ordered or key in first_start:
                continue
            t, ts, i = node["first"]
            extra.append({"i": i, "kind": "first", "t": t, "ts": ts, "key": key})
        return sorted(records + extra, key=lambda r: (r["i"], r["kind"] != "first"))

    def _done_folds(self, records: list[dict]) -> tuple[set[int], dict[int, str]]:
        """status done ≤ 30 s vor dem agent_stop desselben Knotens faltet (P3)."""
        folded: set[int] = set()
        texts: dict[int, str] = {}
        for stop in records:
            if stop["kind"] != "agent_stop":
                continue
            candidates = [
                r
                for r in records
                if r["kind"] == "status"
                and r["key"] == stop["key"]
                and r.get("status") == "done"
                and r["i"] < stop["i"]
                and 0 <= stop["t"] - r["t"] <= FOLD_WINDOW
                and r["i"] not in folded
            ]
            if candidates:
                done = candidates[-1]
                folded.add(done["i"])
                texts[stop["i"]] = done.get("summary") or done.get("task") or ""
        return folded, texts

    def _add(self, rec: dict, kind: str, key: str, **fields) -> int:
        row = {
            "kind": kind,
            "t": rec["t"],
            "ts": rec["ts"],
            "aid": rec.get("aid") or self.info[key]["agent_id"],
            "from": key,
            "to": None,
            "text": "",
            "status": "",
            **fields,
        }
        self.rows.append(row)
        index = len(self.rows) - 1
        if not self.runs[self.main]:
            self.runs[self.main].append([index, None])  # P22: Spalte 0 ab erster Zeile
        return index

    def _open_run(self, key: str, index: int) -> None:
        runs = self.runs[key]
        if not runs or runs[-1][1] is not None:
            runs.append([index, None])

    def _is_open(self, key: str) -> bool:
        runs = self.runs[key]
        return bool(runs) and runs[-1][1] is None

    def _close(self, key: str, index: int) -> None:
        if self._is_open(key):
            self.runs[key][-1][1] = index

    def _start_text(self, key: str) -> str:
        return self.info[key]["task"] or "Start"

    def _first_row(self, rec: dict) -> None:
        key = rec["key"]
        self._open_run(key, self._add(rec, "start", key, text=self._start_text(key)))

    def _session_start(self, rec: dict) -> None:
        if not self.runs[self.main]:
            index = self._add(rec, "start", self.main, text="Session beginnt")
            self._open_run(self.main, index)
        elif not self._is_open(self.main):
            index = self._add(rec, "resume", self.main, text="Fortsetzung")
            self._open_run(self.main, index)

    def _session_end(self, rec: dict) -> None:
        index = self._add(rec, "end", self.main, text="Session beendet")
        for key in self.runs:
            if not self.info[key]["log_only"]:
                self._close(key, index)

    def _spawn(self, rec: dict) -> None:
        child = rec.get("child")
        if child not in self.info or self._is_open(child):
            return
        parent = self.info[child]["parent"] or self.main
        index = self._add(
            rec,
            "order",
            parent if parent in self.info else self.main,
            to=child,
            text=rec.get("description") or "",
            aid=self.info[rec["key"]]["agent_id"],
        )
        self._open_run(child, index)

    def _agent_start(self, rec: dict, has_order: bool) -> None:
        key = rec["key"]
        if not rec.get("resume"):
            if not has_order and not self._is_open(key):
                index = self._add(rec, "start", key, text=self._start_text(key))
                self._open_run(key, index)
            return
        if self._is_open(key):
            return
        message = self._last_message.get(key)
        if (
            message is not None
            and message not in self._used_for_resume
            and 0 <= rec["t"] - self.rows[message]["t"] <= FOLD_WINDOW
        ):
            self._used_for_resume.add(message)
            self._open_run(key, message)
            return
        self._open_run(key, self._add(rec, "resume", key, text="Fortsetzung"))

    def _agent_stop(self, rec: dict, folded_text: str | None) -> None:
        key = rec["key"]
        if not self._is_open(key):
            return
        parent = self.info[key]["parent"] or self.main
        index = self._add(
            rec,
            "report",
            key,
            to=parent if parent in self.info else self.main,
            text=folded_text or rec.get("summary") or "fertig",
        )
        self._close(key, index)

    def _message(self, rec: dict) -> None:
        target = self.resolve(rec.get("to", ""))
        index = self._add(
            rec,
            "message",
            rec["key"],
            to=target or "?",
            text=rec.get("text") or "",
            raw_to=str(rec.get("to") or "").strip(),
        )
        if target is not None:
            self._last_message[target] = index

    def _status(self, rec: dict) -> None:
        key, status = rec["key"], rec.get("status") or ""
        text = rec.get("task") or rec.get("summary") or ""
        if self.info[key]["log_only"] and not self.runs[key]:
            if status in ROW_STATUSES:
                index = self._add(rec, "status", key, text=text, status=status)
            else:
                index = self._add(rec, "start", key, text=text or "Start")
            self._open_run(key, index)
            return
        if status in ROW_STATUSES:
            index = self._add(rec, "status", key, text=text, status=status)
            if self.info[key]["log_only"]:
                self._open_run(key, index)

    def _close_log_only(self, key: str) -> None:
        own = [i for i, row in enumerate(self.rows) if row["from"] == key]
        if own:
            self.runs[key] = [[own[0], own[-1]]]

    # --- Zeiten für die Instanznummern (P21) ---------------------------------

    def run_times(self) -> dict[str, list[tuple[float, float | None]]]:
        return {
            key: [
                (self.rows[a]["t"], None if b is None else self.rows[b]["t"])
                for a, b in runs
            ]
            for key, runs in self.runs.items()
        }


def instances(info: dict[str, dict], run_times: dict[str, list]) -> dict[str, int]:
    """Feste Instanznummer je Knoten (P9, P21), Läufe nach P37."""

    def first(key: str) -> float:
        runs = run_times.get(key) or []
        return runs[0][0] if runs else info[key]["first"][0]

    def holds(key: str, t: float) -> bool:
        return any(a <= t and (b is None or t < b) for a, b in run_times.get(key) or [])

    numbers: dict[str, int] = {}
    for key in sorted(info, key=lambda k: (first(k), k)):
        if info[key]["agent_id"] == "main":
            numbers[key] = 1
            continue
        t, role = first(key), info[key]["role"]
        held = {
            numbers[other]
            for other in numbers
            if info[other]["role"] == role
            and info[other]["agent_id"] != "main"
            and holds(other, t)
        }
        number = 1
        if held:
            number = 2
            while number in held:
                number += 1
        numbers[key] = number
    return numbers
```

- [ ] **Step 4: `model.py` anbinden**

Import nach `import effort`: `import graph`. In `_Builder.__init__` am Ende:

```python
        self.trace: dict[str, list[dict]] = {}
        self.index = 0
        self.current_ts = ""
```

`PUBLIC` um `"instance",` ergänzen (nach `"emoji"`). Knoten-Dict: nach `"emoji": "",` → `"instance": 1,`; nach `"_signal": is_main,` → `"_first": (ts, self.current_ts, self.index),`.

Vor `def signal(`:

```python
    def record(self, sid: str, kind: str, ts: float, key: str, **fields) -> None:
        """Ereignisliste für den Graph-Nachlauf (P37)."""
        self.trace.setdefault(sid, []).append(
            {"i": self.index, "kind": kind, "t": ts, "ts": self.current_ts, "key": key}
            | fields
        )
```

`apply` beginnt mit:

```python
    def apply(self, event: dict) -> None:
        self.index += 1
        self.current_ts = str(event.get("ts") or "")
        ts = parse_ts(event.get("ts"))
```

`record()`-Aufrufe in den Handlern (je Anker genau eine Einfügung):

- `on_session_start`: nach `main = self.node(sid, "main", ts)` → `self.record(sid, "session_start", ts, main["key"])`
- `on_session_end`: die Zeile `self.node(sid, "main", ts)` ersetzen durch `self.record(sid, "session_end", ts, self.node(sid, "main", ts)["key"])`
- `on_agent_start`: direkt vor `if node["_started"]:  # Fortsetzen per SendMessage` → `self.record(sid, "agent_start", ts, node["key"], resume=node["_started"])`
- `on_agent_stop`: direkt nach `node = self.agent(event, ts, sid)` → `self.record(sid, "agent_stop", ts, node["key"], summary=event.get("summary"))`
- `on_spawn` (nach `self.pending.setdefault(sid, []).append(entry)`), `on_message` (am Ende) und `on_status` (nach `node["_signal"] = True`):

```python
        # on_spawn
        self.record(
            sid, "spawn", ts, parent["key"], entry=entry, description=entry["task"]
        )

        # on_message
        self.record(
            sid,
            "message",
            ts,
            sender["key"],
            to=str(event.get("to") or ""),
            text=str(event.get("text") or ""),
        )

        # on_status
        self.record(
            sid,
            "status",
            ts,
            node["key"],
            status=event.get("status") or "",
            task=event.get("task") or "",
            summary=event.get("summary") or "",
        )
```

Nach `hidden()`:

```python
    def graph_record(self, record: dict) -> dict:
        if record["kind"] != "spawn":
            return record
        child = record["entry"]["child"]
        return {k: v for k, v in record.items() if k != "entry"} | {
            "child": child["key"] if child is not None else None
        }

    def layouts(self) -> dict[str, graph.Layout]:
        """Je Session das Graph-Layout; daraus die Instanznummern (P9, P21)."""
        result: dict[str, graph.Layout] = {}
        for sid in self.sessions:
            info = {
                key: {
                    "agent_id": node["agent_id"],
                    "role": node["role"],
                    "department": node["department"],
                    "parent": node["parent"],
                    "base_name": node["_base_name"],
                    "task": node["task"],
                    "first": node["_first"],
                    "log_only": node["agent_id"].startswith("log:"),
                }
                for key, node in self.nodes.items()
                if node["session_id"] == sid and not self.hidden(key)
            }
            records = [self.graph_record(r) for r in self.trace.get(sid, [])]
            layout = graph.Layout(sid, records, info)
            for key, number in graph.instances(info, layout.run_times()).items():
                node = self.nodes[key]
                node["instance"] = number
                suffix = f" ({number})" if number > 1 else ""
                node["name"] = node["_base_name"] + suffix
            result[sid] = layout
        return result
```

In `result()` nach `self.identities()`: `self.layouts()` (Rückgabewert nutzt erst Task 6b).

- [ ] **Step 5: Grün prüfen** — `python3 -m unittest tests.test_model -v`, `make studio-test`, `make studio-lint`. Expected: PASS.

- [ ] **Step 6: Commit** — `git add tools/studio && git commit -m "feat: Graph-Kern mit Ereignisliste, Läufen und Instanznummern"`

### Task 6b: Graph-Kern II — Spalten, Spuren, Punkte, Pfeile, Pausen und `graph` in `/api/state` (T4, P3–P8, P22–P25, P32, P34, P36, P38)

**Files:**

- Modify: `tools/studio/graph.py` (Durchlauf 2 in `Layout`)
- Modify: `tools/studio/model.py` (Re-Export der Konstanten, Feed-Text für `message`, `message_texts`, `graph_view`, Feld `graph`)
- Test: `tools/studio/tests/test_model.py` (`SYMBOL`, `graph_rows`, `ups`, `downs`, `bind`; `GraphTest` um 30 Tests und die Hilfe `workers`; `StopOnlyTest` um Graph-Prüfungen)

**Interfaces:**

- Consumes: `Layout`, `instances`, `layouts()` aus Task 6a.
- Produces: `Layout.render(names: dict[str, str], limit: int = GRAPH_ROWS) -> dict` im Schema T4 (`session`, `columns`, `truncated`, `rows[]` mit `id`, `t`, `time`, `kind`, `from`, `to`, `label`, `text`, `status`, `lanes[{key, department, up, down}]`, `dot`, `arrow{from_col, to_col, style}`); `state["graph"]` (null für `all` und ohne Sessions; leere Zeilenliste für unbekannte Session-ID); Feed-Text „✉ → <Name>: <Text>" bzw. „✉ → ? <to>: <Text>".

- [ ] **Step 1: Failing tests** — Hilfen nach `named` einfügen:

```python
SYMBOL = {"solid": "S", "dashed": "D", "none": "."}


def graph_rows(state):
    """Graph-Zeilen chronologisch (die API liefert neueste zuerst)."""
    return list(reversed(state["graph"]["rows"]))


def ups(row):
    return "".join(SYMBOL[lane["up"]] for lane in row["lanes"])


def downs(row):
    return "".join(SYMBOL[lane["down"]] for lane in row["lanes"])


def bind(t, aid, role, **kw):
    return ev("bind", t, agent_id=aid, role=role, **kw)
```

In `class GraphTest` nach `test_message_is_heartbeat_of_sender` anhängen:

```python
    def test_message_feed_text(self):
        events = [
            *lead(typ="lead-tech"),
            message(10, "main", "a1", text="Bitte starten"),
            message(11, "main", "zoll-helfer", text="Wer bist du?"),
        ]
        texts = [f["text"] for f in named(events)["feed"] if f["kind"] == "message"]
        self.assertEqual(
            texts,
            ["✉ → ? zoll-helfer: Wer bist du?", "✉ → Technik-Toni: Bitte starten"],
        )

    def test_graph_only_for_single_session(self):
        events = [ev("session_start", 0, status="idle"), *lead()]
        self.assertEqual(named(events, session="s1")["graph"]["session"], "s1")
        self.assertEqual(named(events)["graph"]["session"], "s1")
        self.assertIsNone(named(events, session="all")["graph"])
        self.assertIsNone(named([])["graph"])

    def test_order_row_merges_spawn_and_start(self):
        rows = graph_rows(named(lead()))
        self.assertEqual([r["kind"] for r in rows], ["order"])
        self.assertEqual(rows[0]["t"], T0 + 1)
        self.assertTrue(rows[0]["id"].startswith("order:s1:main:"))
        self.assertEqual(rows[0]["label"], "Boss Bruno → Prüf-Peter")
        self.assertEqual(rows[0]["dot"], 1)
        self.assertEqual(
            rows[0]["arrow"], {"from_col": 0, "to_col": 1, "style": "branch"}
        )

    def test_report_row_ends_lane(self):
        rows = graph_rows(named([*lead(), stop(5, "a1", "lead-qa", summary="Fertig")]))
        report = rows[-1]
        self.assertEqual(report["kind"], "report")
        self.assertEqual((report["from"], report["to"]), ("s1:a1", "s1:main"))
        self.assertEqual(
            report["arrow"], {"from_col": 1, "to_col": 0, "style": "merge"}
        )
        self.assertEqual((ups(report), downs(report)), ("S.", "SS"))

    def test_message_to_running_agent(self):
        row = graph_rows(named([*lead(), message(5, "main", "a1")]))[-1]
        self.assertEqual(row["to"], "s1:a1")
        self.assertEqual(row["arrow"], {"from_col": 0, "to_col": 1, "style": "message"})
        self.assertEqual(row["label"], "Boss Bruno → Prüf-Peter")

    def test_resume_folds_into_message_row(self):
        events = [
            *lead(),
            stop(5, "a1", "lead-qa"),
            message(10, "main", "a1"),
            start(20, "a1", "lead-qa"),
        ]
        rows = graph_rows(named(events))
        self.assertEqual([r["kind"] for r in rows], ["order", "report", "message"])
        self.assertEqual(rows[2]["lanes"][1]["down"], "dashed")
        self.assertEqual(rows[2]["lanes"][1]["up"], "solid")
        self.assertEqual(rows[2]["arrow"]["to_col"], 1)

    def test_resume_without_message_has_own_row(self):
        base = [*lead(), stop(5, "a1", "lead-qa")]
        rows = graph_rows(named([*base, start(20, "a1", "lead-qa")]))
        self.assertEqual([r["kind"] for r in rows], ["order", "report", "resume"])
        self.assertEqual(rows[-1]["text"], "Fortsetzung")
        late = [*base, message(10, "main", "a1"), start(50, "a1", "lead-qa")]
        kinds = [r["kind"] for r in graph_rows(named(late))]
        self.assertEqual(kinds, ["order", "report", "message", "resume"])

    def test_message_to_main(self):
        row = graph_rows(named([*lead(), message(5, "a1", "main")]))[-1]
        self.assertEqual(row["to"], "s1:main")
        self.assertEqual(row["arrow"], {"from_col": 1, "to_col": 0, "style": "message"})

    def test_recipient_bracket_form(self):
        events = [*lead(typ="lead-tech"), message(5, "main", "a1 [lead-tech]")]
        self.assertEqual(graph_rows(named(events))[-1]["to"], "s1:a1")

    def test_recipient_by_unique_role_or_name(self):
        for to in ("lead-tech", "Technik-Toni", "  Technik-Toni  "):
            events = [*lead(typ="lead-tech"), message(5, "main", to)]
            self.assertEqual(graph_rows(named(events))[-1]["to"], "s1:a1", to)
        stop_only = ev("agent_stop", 3, agent_id="h1", status="done", summary="x")
        events = [start(1, "x1", "Explore"), stop_only, message(5, "main", "Aushilfe")]
        self.assertEqual(graph_rows(named(events))[-1]["to"], "s1:x1")

    def test_recipient_ambiguous_is_unresolved(self):
        events = [
            *lead(typ="lead-tech"),
            spawn(3, "a1", "tech-sim-engineer", tool_use_id="w1"),
            start(4, "w1", "tech-sim-engineer"),
            spawn(5, "a1", "tech-sim-engineer", tool_use_id="w2"),
            start(6, "w2", "tech-sim-engineer"),
            message(7, "a1", "tech-sim-engineer"),
            message(8, "a1", "Logik-Lars"),
        ]
        rows = graph_rows(named(events))
        self.assertEqual([r["to"] for r in rows[-2:]], ["?", "?"])

    def test_unresolvable_recipient_keeps_row(self):
        row = graph_rows(named([*lead(), message(5, "a1", "zoll-helfer")]))[-1]
        self.assertEqual((row["kind"], row["to"]), ("message", "?"))
        self.assertIsNone(row["arrow"]["to_col"])
        self.assertEqual(row["label"], "Prüf-Peter → ? zoll-helfer")

    def test_empty_recipient_is_unresolved(self):
        row = graph_rows(named([*lead(), message(5, "a1", "")]))[-1]
        self.assertEqual(
            (row["kind"], row["to"], row["label"]), ("message", "?", "Prüf-Peter → ?")
        )

    def test_message_target_without_lane(self):
        events = [*lead(), stop(5, "a1", "lead-qa"), message(10, "main", "a1")]
        row = graph_rows(named(events))[-1]
        self.assertEqual(row["to"], "s1:a1")
        self.assertIsNone(row["arrow"]["to_col"])
        self.assertEqual(row["label"], "Boss Bruno → Prüf-Peter")
        own = graph_rows(named([*lead(), message(5, "a1", "a1")]))[-1]
        self.assertIsNone(own["arrow"])
        self.assertEqual(own["dot"], 1)

    def workers(self, resume):
        events = [
            *lead(),
            spawn(3, "a1", "qa-playtester", tool_use_id="b1"),
            start(4, "b1", "qa-playtester"),
            stop(5, "b1", "qa-playtester"),
            spawn(6, "a1", "qa-code-reviewer", tool_use_id="b2"),
            start(7, "b2", "qa-code-reviewer"),
        ]
        if resume:
            events += [message(8, "a1", "b1"), start(9, "b1", "qa-playtester")]
        return graph_rows(named(events))

    def test_column_reuse_after_finish(self):
        rows = self.workers(resume=False)
        self.assertEqual(rows[-1]["kind"], "order")
        self.assertEqual(rows[-1]["dot"], 2)

    def test_reserved_dashed_column_until_resume(self):
        rows = self.workers(resume=True)
        order_b2 = rows[3]
        self.assertEqual((order_b2["kind"], order_b2["dot"]), ("order", 3))
        self.assertEqual(order_b2["lanes"][2]["key"], "b1")
        self.assertEqual(order_b2["lanes"][2]["up"], "dashed")
        self.assertEqual(rows[-1]["lanes"][2]["up"], "solid")

    def test_pause_separator(self):
        rows = graph_rows(
            named([*lead(), message(301, "main", "a1"), message(721, "main", "a1")])
        )
        self.assertEqual(
            [r["kind"] for r in rows], ["order", "message", "pause", "message"]
        )
        pause = rows[2]
        self.assertEqual(pause["text"], "… 7 min …")
        self.assertEqual(
            (pause["dot"], pause["arrow"], pause["label"]), (None, None, "")
        )
        self.assertEqual((ups(pause), downs(pause)), ("SS", "SS"))
        self.assertTrue(pause["id"].startswith("pause:s1:-:"))

    def test_status_rows_and_done_folding(self):
        events = [*lead()]
        for t, status, extra in (
            (10, "blocked", {"task": "Wartet auf X"}),
            (20, "waiting", {"task": "Wartet auf Y"}),
            (30, "active", {"task": "Weiter"}),
            (40, "failed", {"summary": "Kaputt"}),
            (50, "done", {"summary": "Zwischenstand"}),
            (100, "done", {"summary": "Alles fertig"}),
        ):
            events += [
                bind(t - 1, "a1", "lead-qa"),
                log_status(t, "lead-qa", status, **extra),
            ]
        events.append(stop(110, "a1", "lead-qa", summary="Fertig."))
        rows = graph_rows(named(events))
        statuses = [r["status"] for r in rows if r["kind"] == "status"]
        self.assertEqual(statuses, ["blocked", "waiting", "failed", "done"])
        self.assertEqual(rows[1]["text"], "Wartet auf X")
        self.assertEqual(
            (rows[-1]["kind"], rows[-1]["text"]), ("report", "Alles fertig")
        )

    def test_silent_events_make_no_rows(self):
        events = [
            ev("session_start", 0, status="idle"),
            ev("prompt", 1, status="active", task="Los"),
            ev("heartbeat", 2, tool="Read"),
            bind(3, "main", "studio-director"),
            ev("turn_end", 4, status="idle"),
            spawn(5, "main", "lead-qa", tool_use_id="q"),
            ev("spawned", 6, child_id="a1", tool_use_id="q"),
            start(7, "a1", "lead-qa"),
            ev("heartbeat", 8, agent_id="a1", tool="Grep"),
        ]
        self.assertEqual(
            [r["kind"] for r in graph_rows(named(events))], ["start", "order"]
        )

    def test_session_end_closes_all_lanes(self):
        events = [*lead(), ev("session_end", 10, status="ended")]
        end = graph_rows(named(events))[-1]
        self.assertEqual(
            (end["kind"], end["dot"], end["text"]), ("end", 0, "Session beendet")
        )
        self.assertEqual((ups(end), downs(end)), ("..", "SS"))

    def test_truncation_keeps_lanes(self):
        events = [ev("session_start", 0, status="idle"), *lead()]
        events += [message(3 + i, "a1", "main", text=f"m{i}") for i in range(318)]
        graph = named(events, now=400)["graph"]
        self.assertTrue(graph["truncated"])
        self.assertEqual((graph["columns"], len(graph["rows"])), (2, 300))
        oldest = graph["rows"][-1]
        self.assertEqual(oldest["text"], "m18")
        self.assertEqual((ups(oldest), downs(oldest)), ("SS", "SS"))
        self.assertTrue(all(len(r["lanes"]) == 2 for r in graph["rows"]))

    def test_row_ids_stable(self):
        events = [
            ev("session_start", 0, status="idle"),
            *lead(),
            message(5, "a1", "main"),
        ]
        first = [r["id"] for r in named(events)["graph"]["rows"]]
        self.assertEqual(first, [r["id"] for r in named(events)["graph"]["rows"]])
        later = [
            r["id"] for r in named([*events, message(9, "main", "a1")])["graph"]["rows"]
        ]
        self.assertEqual(later[1:], first)
        self.assertEqual(len(set(later)), len(later))

    def test_row_id_changes_only_by_p34_exceptions(self):
        events = [
            *lead(),
            bind(49, "a1", "lead-qa"),
            log_status(50, "lead-qa", "done", summary="Gut"),
        ]
        before = {r["id"] for r in named(events)["graph"]["rows"]}
        after = {
            r["id"]
            for r in named([*events, stop(60, "a1", "lead-qa")])["graph"]["rows"]
        }
        self.assertEqual(len(before - after), 1)
        self.assertTrue(next(iter(before - after)).startswith("status:s1:a1:"))
        self.assertTrue(next(iter(after - before)).startswith("report:s1:a1:"))

    def test_late_correction_relayouts(self):
        events = [
            *lead(aid="L1"),
            spawn(3, "main", "lead-tech", tool_use_id="lt"),
            start(4, "L2", "lead-tech"),
            spawn(5, "L1", "qa-playtester", description="Eins", tool_use_id="t1"),
            spawn(6, "L2", "qa-playtester", description="Zwei", tool_use_id="t2"),
            start(7, "W2", "qa-playtester"),
            start(8, "W1", "qa-playtester"),
        ]

        def order(state):
            return next(r for r in graph_rows(state) if r["text"] == "Eins")

        self.assertEqual(order(named(events))["to"], "s1:W2")
        fixed = [
            *events,
            ev("spawned", 9, agent_id="L2", child_id="W2", tool_use_id="t2"),
            ev("spawned", 10, agent_id="L1", child_id="W1", tool_use_id="t1"),
        ]
        self.assertEqual(order(named(fixed))["to"], "s1:W1")

    def test_log_only_and_startless_lanes(self):
        events = [
            ev("session_start", 0, status="idle"),
            log_status(10, "lead-art", "active", task="Assets sichten"),
            log_status(20, "lead-art", "blocked", task="Lizenz unklar"),
            log_status(30, "lead-art", "waiting", task="Antwort"),
            ev("heartbeat", 40, agent_id="x1", tool="Read"),
            stop(50, "x1", "Explore", summary="Gefunden"),
        ]
        rows = graph_rows(named(events))
        self.assertEqual(
            [(r["kind"], r["from"]) for r in rows],
            [
                ("start", "s1:main"),
                ("start", "s1:log:lead-art"),
                ("status", "s1:log:lead-art"),
                ("status", "s1:log:lead-art"),
                ("start", "s1:x1"),
                ("report", "s1:x1"),
            ],
        )
        self.assertEqual(rows[1]["text"], "Assets sichten")
        self.assertEqual(
            (rows[1]["lanes"][1]["up"], rows[3]["lanes"][1]["up"]), ("solid", "none")
        )
        self.assertEqual(rows[1]["label"], "Pinsel-Pia")

    def test_text_limit_lane_width_json(self):
        events = [
            ev("session_start", 0, status="idle"),
            *lead(),
            message(5, "a1", "main", text="x" * 300),
        ]
        graph = named(events)["graph"]
        self.assertEqual(graph["rows"][0]["text"], "x" * 160 + "…")
        self.assertTrue(all(len(r["lanes"]) == graph["columns"] for r in graph["rows"]))
        json.dumps(graph)

    def test_session_restart_resumes_director(self):
        events = [
            ev("session_start", 0, status="idle"),
            ev("session_end", 10, status="ended"),
            ev("session_start", 20, status="idle"),
            ev("session_start", 30, status="idle"),
        ]
        rows = graph_rows(named(events))
        self.assertEqual([r["kind"] for r in rows], ["start", "end", "resume"])
        self.assertEqual(rows[1]["lanes"][0]["up"], "dashed")
        self.assertEqual((rows[2]["dot"], rows[2]["text"]), (0, "Fortsetzung"))
        self.assertEqual(rows[2]["lanes"][0]["down"], "dashed")

    def test_log_final_status_does_not_end_lane(self):
        for status in ("done", "failed"):
            events = [
                *lead(),
                bind(39, "a1", "lead-qa"),
                log_status(40, "lead-qa", status, summary="Ende"),
                stop(100, "a1", "lead-qa"),
            ]
            rows = graph_rows(named(events))
            self.assertEqual(rows[1]["kind"], "status", status)
            self.assertEqual(rows[1]["lanes"][1]["up"], "solid", status)
            self.assertEqual(rows[2]["lanes"][1]["down"], "solid", status)

    def test_duplicate_stop_and_unassigned_spawn_are_quiet(self):
        events = [
            *lead(),
            stop(5, "a1", "lead-qa", summary="Erster Bericht"),
            stop(6, "a1", "lead-qa", summary="Doppelt"),
            spawn(7, "main", "qa-playtester", tool_use_id="nie-gestartet"),
        ]
        rows = graph_rows(named(events))
        self.assertEqual([r["kind"] for r in rows], ["order", "report"])
        self.assertEqual(rows[-1]["text"], "Erster Bericht")

    def test_status_row_uses_event_time_resolution(self):
        events = [
            *lead(),
            bind(9, "a1", "lead-qa"),
            log_status(10, "lead-qa", "blocked", task="Hängt"),
            spawn(20, "main", "lead-qa", tool_use_id="q2"),
            start(21, "a2", "lead-qa"),
        ]
        status = next(r for r in graph_rows(named(events)) if r["kind"] == "status")
        self.assertEqual(status["from"], "s1:a1")
        self.assertTrue(status["id"].startswith("status:s1:a1:"))
```

In `StopOnlyTest.test_hidden_in_graph_tree_and_counts` am Ende:

```python
        self.assertEqual([r["kind"] for r in graph_rows(state)], ["start"])
        self.assertEqual(state["graph"]["columns"], 1)
```

In `StopOnlyTest.test_role_or_other_event_keeps_node_visible` am Ende:

```python
        self.assertEqual([r["kind"] for r in graph_rows(state)], ["start", "report"])
```

- [ ] **Step 2: Rot prüfen** — `python3 -m unittest tests.test_model.GraphTest tests.test_model.StopOnlyTest -v`. Expected: FAIL (`KeyError: 'graph'`).

- [ ] **Step 3: Durchlauf 2** — in `class Layout` nach `run_times()` einfügen:

```python
    # --- Durchlauf 2: Spalten, Spuren, Punkte, Pfeile (P5–P7, P23–P25) --------

    def render(self, names: dict[str, str], limit: int = GRAPH_ROWS) -> dict:
        columns = self._columns()
        width = max(columns.values(), default=-1) + 1
        by_column: dict[int, list[str]] = {}
        for key, col in columns.items():
            by_column.setdefault(col, []).append(key)
        out: list[dict] = []
        seen: dict[str, int] = {}
        for r, row in enumerate(self.rows):
            if r and row["t"] - self.rows[r - 1]["t"] > PAUSE_GAP:
                out.append(self._pause(r - 1, by_column, width, seen))
            out.append(self._row(r, row, columns, by_column, width, names, seen))
        out.reverse()
        return {
            "session": self.sid,
            "columns": width,
            "truncated": len(out) > limit,
            "rows": out[:limit],
        }

    def _columns(self) -> dict[str, int]:
        spans = {k: (runs[0][0], runs[-1][1]) for k, runs in self.runs.items() if runs}
        columns: dict[str, int] = {}
        busy: list[int | None] = [None]  # Spalte 0 gehört dem Direktor (P5)
        if self.main in spans:
            columns[self.main] = 0
        others = sorted(
            (k for k in spans if k != self.main), key=lambda k: (spans[k][0], k)
        )
        for key in others:
            start, end = spans[key]
            col = next(
                (
                    c
                    for c in range(1, len(busy))
                    if busy[c] is not None and busy[c] < start
                ),
                len(busy),
            )
            if col == len(busy):
                busy.append(end)
            else:
                busy[col] = end
            columns[key] = col
        return columns

    def _segment(self, key: str, r: int) -> str:
        """Spurstück zwischen Zeile r und r + 1 (r + 1 ist neuer)."""
        runs = self.runs[key]
        if any(a <= r and (b is None or b >= r + 1) for a, b in runs):
            return "solid"
        if runs and runs[0][0] <= r and (runs[-1][1] is None or runs[-1][1] >= r + 1):
            return "dashed"
        return "none"

    def _occupant(self, keys: list[str], r: int) -> str | None:
        for key in keys:
            runs = self.runs[key]
            if runs[0][0] <= r and (runs[-1][1] is None or runs[-1][1] >= r):
                return key
        return None

    def _lane(self, key: str | None, up: str, down: str) -> dict:
        if key is None:
            return {"key": None, "department": None, "up": "none", "down": "none"}
        node = self.info[key]
        return {
            "key": node["agent_id"],
            "department": node["department"],
            "up": up,
            "down": down,
        }

    def _row(self, r, row, columns, by_column, width, names, seen) -> dict:
        lanes, holders = [], {}
        for col in range(width):
            key = self._occupant(by_column.get(col, []), r)
            if key is not None:
                holders[key] = col
                lanes.append(
                    self._lane(key, self._segment(key, r), self._segment(key, r - 1))
                )
            else:
                lanes.append(self._lane(None, "none", "none"))
        kind, source, target = row["kind"], row["from"], row["to"]
        dot = holders.get(target if kind == "order" else source)
        if kind == "end":
            dot = 0
        arrow = None
        if kind in ("order", "report", "message") and target != source:
            style = {"order": "branch", "report": "merge", "message": "message"}[kind]
            if source in holders:
                arrow = {
                    "from_col": holders[source],
                    "to_col": holders.get(target),
                    "style": style,
                }

        def name(key: str) -> str:
            return names.get(key) or self.info[key]["base_name"]

        if kind in ("order", "report", "message"):
            if target == "?":
                label = f"{name(source)} → ? {row.get('raw_to', '')}".rstrip()
            else:
                label = f"{name(source)} → {name(target)}"
        else:
            label = name(source)
        return {
            "id": self._id(kind, row["aid"], row["ts"], seen),
            "t": row["t"],
            "time": clock(row["t"]),
            "kind": kind,
            "from": source,
            "to": target,
            "label": label,
            "text": short(row["text"]),
            "status": row["status"],
            "lanes": lanes,
            "dot": dot,
            "arrow": arrow,
        }

    def _pause(self, r, by_column, width, seen) -> dict:
        lanes = []
        for col in range(width):
            key = self._occupant(by_column.get(col, []), r)
            state = self._segment(key, r) if key is not None else "none"
            lanes.append(self._lane(key if state != "none" else None, state, state))
        older = self.rows[r]
        minutes = int((self.rows[r + 1]["t"] - older["t"]) // 60)
        return {
            "id": self._id("pause", "-", older["ts"], seen),
            "t": older["t"],
            "time": "",
            "kind": "pause",
            "from": None,
            "to": None,
            "label": "",
            "text": f"… {minutes} min …",
            "status": "",
            "lanes": lanes,
            "dot": None,
            "arrow": None,
        }

    def _id(self, kind: str, aid: str, ts: str, seen: dict[str, int]) -> str:
        base = f"{kind}:{self.sid}:{aid}:{ts}"
        seen[base] = seen.get(base, 0) + 1
        return base if seen[base] == 1 else f"{base}#{seen[base]}"
```

- [ ] **Step 4: `model.py`**

Re-Export nach `import graph`:

```python
from graph import GRAPH_ROWS, MESSAGE_TEXT_MAX, PAUSE_GAP  # noqa: F401
```

In `add_feed` nach dem `self.feed.append(…)`:

```python
        if event.get("kind") == "message":  # Text erst im Nachlauf (Namen, P2)
            self.feed[-1]["_to"] = str(event.get("to") or "")
            self.feed[-1]["_text"] = str(event.get("text") or "")
```

In `result()`: `layouts = self.layouts()` statt `self.layouts()`; nach `feed = [...]` die Zeile `self.message_texts(feed, layouts)`; im Rückgabe-Dict am Ende `"graph": self.graph_view(chosen, layouts),`. Neue Methoden nach `layouts()`:

```python
    def message_texts(self, feed: list[dict], layouts: dict) -> None:
        """Feed-Zeile „✉ → <Empfänger>: <Text>" (T2)."""
        for entry in feed:
            if entry["kind"] != "message" or entry["session_id"] not in layouts:
                continue
            target = layouts[entry["session_id"]].resolve(entry.get("_to", ""))
            who = self.nodes[target]["name"] if target else f"? {entry.get('_to', '')}"
            entry["text"] = _short(f"✉ → {who.strip()}: {entry.get('_text', '')}", 140)

    def graph_view(self, chosen: str | None, layouts: dict) -> dict | None:
        if chosen in (None, "all"):
            return None
        if chosen not in layouts:
            return {"session": chosen, "columns": 0, "truncated": False, "rows": []}
        names = {
            k: n["name"] for k, n in self.nodes.items() if n["session_id"] == chosen
        }
        return layouts[chosen].render(names)
```

- [ ] **Step 5: Grün prüfen** — `python3 -m unittest tests.test_model -v`, `make studio-test`, `make studio-lint`. Expected: PASS.

- [ ] **Step 6: Commit** — `git commit -m "feat: Prozess-Graph mit Spalten, Spuren und Pfeilen in /api/state"`

### Task 7: Fixture-Sessions G und W, `--append-g9`, Referenztests (T5, T5b, T5c, P39)

**Files:**

- Modify: `tools/studio/tests/fixtures/make_demo.py` (`GRAPH`, `WIDE`, `LANG`, `stamp_at`, `graph_session`, `wide_session`, `append_g9`, neues `main`)
- Create: `tools/studio/tests/fixtures/__init__.py` (leer)
- Test: `tools/studio/tests/test_model.py` (Imports `contextlib`, `io`, `from tests.fixtures import make_demo`; Klasse `GraphFixtureTest`)
- Nur bei Referenzabweichung: `graph.py`/`model.py` (Befund im Bericht nennen; die Referenz der Spec gilt)

**Interfaces:**

- Produces: `make_demo.graph_session(start: float) -> list[dict]`, `make_demo.wide_session(start: float) -> list[dict]`, `make_demo.append_g9(path: Path) -> list[dict]`, `make_demo.GRAPH`, `make_demo.WIDE`, `make_demo.LANG`; CLI `make_demo.py <ziel>` (hängt G mit `NOW − 22 min` und W mit `NOW − 3 min` an) und `make_demo.py --append-g9 <datei>`. Der Playtest (Task 8, 9) nutzt diese Befehle.

- [ ] **Step 1: Failing tests** — Imports oben ergänzen (`import contextlib`, `import io`, nach `import model` durch eine Leerzeile getrennt: `from tests.fixtures import make_demo`) und vor `GateSpecFixesTest` einfügen:

```python
class GraphFixtureTest(unittest.TestCase):
    # (kind, label, text, dot, arrow, Spuren oben) laut Spec, Tabelle „Erwartete Graph-Zeilen"
    REFERENCE = (
        ("start", "Boss Bruno", "Session beginnt", 0, None, "S...."),
        (
            "order",
            "Boss Bruno → Technik-Toni",
            "Handelsrouten umsetzen",
            1,
            (0, 1, "branch"),
            "SS...",
        ),
        (
            "order",
            "Technik-Toni → Logik-Lars",
            "Routen-Simulation",
            2,
            (1, 2, "branch"),
            "SSS..",
        ),
        (
            "order",
            "Technik-Toni → Logik-Lars (2)",
            "Zollberechnung",
            3,
            (1, 3, "branch"),
            "SSSS.",
        ),
        (
            "order",
            "Boss Bruno → Aushilfe",
            "Bestehende Handelsdateien suchen",
            4,
            (0, 4, "branch"),
            "SSSSS",
        ),
        (
            "report",
            "Aushilfe → Boss Bruno",
            "3 Dateien gefunden: trade.ts, ships.ts, ports.ts",
            4,
            (4, 0, "merge"),
            "SSSS.",
        ),
        ("status", "Logik-Lars (2)", "Zollsatz fehlt in defs", 3, None, "SSSS."),
        (
            "message",
            "Logik-Lars (2) → Boss Bruno",
            "Zollsatz fehlt in src/sim/defs — 10 % oder 15 %?",
            3,
            (3, 0, "message"),
            "SSSS.",
        ),
        (
            "message",
            "Boss Bruno → Technik-Toni",
            "Zoll 10 %, bitte an Logik-Lars (2) weitergeben",
            0,
            (0, 1, "message"),
            "SSSS.",
        ),
        (
            "message",
            "Technik-Toni → ? zoll-helfer",
            "<img src=x onerror=alert(1)>",
            1,
            (1, None, "message"),
            "SSSS.",
        ),
        (
            "status",
            "Logik-Lars (2)",
            "Zollberechnung abgebrochen, Werte fehlen",
            3,
            None,
            "SSSS.",
        ),
        (
            "report",
            "Logik-Lars (2) → Technik-Toni",
            "Abgebrochen",
            3,
            (3, 1, "merge"),
            "SSS..",
        ),
        (
            "report",
            "Logik-Lars → Technik-Toni",
            "Routen-Simulation fertig, 12 Tests grün",
            2,
            (2, 1, "merge"),
            "SSD..",
        ),
        (
            "order",
            "Technik-Toni → Review-Rita",
            "Review Routen-Simulation",
            3,
            (1, 3, "branch"),
            "SSDS.",
        ),
        ("status", "Technik-Toni", "Wartet auf Review", 1, None, "SSDS."),
        (
            "report",
            "Review-Rita → Technik-Toni",
            "2 Befunde: Rundung in trade.ts, fehlender Test",
            3,
            (3, 1, "merge"),
            "SSD..",
        ),
        ("pause", "", "… 7 min …", None, None, "SSD.."),
        ("message", "Technik-Toni → Logik-Lars", None, 1, (1, 2, "message"), "SSS.."),
        (
            "report",
            "Logik-Lars → Technik-Toni",
            "Befunde behoben, 14 Tests grün",
            2,
            (2, 1, "merge"),
            "SS...",
        ),
        (
            "status",
            "Technik-Toni",
            "Handelsrouten umgesetzt und geprüft",
            1,
            None,
            "SS...",
        ),
        (
            "report",
            "Technik-Toni → Boss Bruno",
            "Handelsrouten fertig",
            1,
            (1, 0, "merge"),
            "S....",
        ),
    )

    def state(self, events, now, session):
        return model.build_state(
            events, now, MODELS, session=session, agent_names=self.names()
        )

    @staticmethod
    def names():
        agents = Path(__file__).resolve().parents[3] / ".claude" / "agents"
        return model.read_agent_names(agents)

    def test_fixture_matches_reference(self):
        state = self.state(make_demo.graph_session(T0), T0 + 22 * 60, make_demo.GRAPH)
        graph = state["graph"]
        self.assertEqual((graph["columns"], graph["truncated"]), (5, False))
        rows = graph_rows(state)
        self.assertEqual(len(rows), len(self.REFERENCE))
        long_text = make_demo.LANG[:160] + "…"
        for row, (kind, label, text, dot, arrow, lanes) in zip(rows, self.REFERENCE):
            with self.subTest(row=row["id"]):
                got_arrow = row["arrow"] and tuple(row["arrow"].values())
                self.assertEqual(
                    (
                        row["kind"],
                        row["label"],
                        row["text"],
                        row["dot"],
                        got_arrow,
                        ups(row),
                    ),
                    (kind, label, text or long_text, dot, arrow, lanes),
                )
        self.assertEqual(rows[9]["to"], "?")
        self.assertEqual(
            (rows[17]["lanes"][2]["down"], rows[17]["lanes"][2]["up"]),
            ("dashed", "solid"),
        )
        self.assertEqual(
            (rows[12]["lanes"][2]["down"], rows[12]["lanes"][2]["up"]),
            ("solid", "dashed"),
        )
        self.assertEqual(rows[13]["lanes"][3]["down"], "none")
        older_ts = rows[15]["id"].split(":", 3)[3]
        self.assertEqual(rows[16]["id"], f"pause:{make_demo.GRAPH}:-:{older_ts}")

    def test_fixture_nodes_and_counts(self):
        state = self.state(make_demo.graph_session(T0), T0 + 22 * 60, make_demo.GRAPH)
        nodes = flat(state)
        g = make_demo.GRAPH
        self.assertNotIn(f"{g}:g-help", nodes)
        self.assertEqual(state["counts"].get("done"), 4)
        self.assertEqual(state["counts"].get("failed"), 1)
        self.assertEqual(state["counts"].get("idle"), 1)
        main = nodes[f"{g}:main"]
        self.assertEqual(main["task_short"], "Handelsrouten umsetzen und prü…")
        ts2 = nodes[f"{g}:g-ts2"]
        self.assertEqual(
            (ts2["name"], ts2["status"], ts2["task"]),
            ("Logik-Lars (2)", "failed", "Zollsatz fehlt in defs"),
        )
        self.assertEqual(nodes[f"{g}:g-ex"]["title"], "Explore")

    def test_old_session_retrospective(self):
        state = self.state(make_demo.old_session(), make_demo.NOW, make_demo.OLD)
        rows = graph_rows(state)
        self.assertEqual(
            [(r["kind"], r["label"], r["text"]) for r in rows],
            [
                ("start", "Boss Bruno", "Session beginnt"),
                ("order", "Boss Bruno → Zocker-Zoe", "Speichern/Laden durchspielen"),
                ("pause", "", "… 20 min …"),
                (
                    "report",
                    "Zocker-Zoe → Boss Bruno",
                    "Laden nach Neustart ok, ein Rundungsfehler im Lager",
                ),
                ("pause", "", "… 8 min …"),
                ("end", "Boss Bruno", "Session beendet"),
            ],
        )
        self.assertEqual(ups(rows[-1]), "..")

    def test_wide_session_columns(self):
        state = self.state(make_demo.wide_session(T0), T0 + 180, make_demo.WIDE)
        rows = graph_rows(state)
        self.assertEqual((state["graph"]["columns"], len(rows)), (10, 10))
        self.assertEqual(ups(rows[-1]), "S" * 10)
        self.assertEqual(rows[1]["label"], "Boss Bruno → Prüf-Peter")
        self.assertEqual(
            [(r["label"], r["text"], r["dot"]) for r in rows[2:4]],
            [
                ("Prüf-Peter → Review-Rita", "Review Teil 1", 2),
                ("Prüf-Peter → Review-Rita (2)", "Review Teil 2", 3),
            ],
        )
        nodes = flat(state)
        w = make_demo.WIDE
        self.assertEqual(
            [nodes[f"{w}:w-r{k}"]["instance"] for k in range(1, 9)], list(range(1, 9))
        )
        self.assertEqual(nodes[f"{w}:w-r8"]["name"], "Review-Rita (8)")

    def test_append_g9_adds_two_rows_without_pause(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "events.jsonl"
            with contextlib.redirect_stdout(io.StringIO()):
                make_demo.main([str(path)])
                make_demo.main(["--append-g9", str(path)])
            events = [json.loads(line) for line in path.read_text("utf-8").splitlines()]
        state = self.state(events, make_demo.NOW, make_demo.GRAPH)
        rows = state["graph"]["rows"]
        self.assertEqual(len(rows), 23)
        self.assertEqual(
            [(r["label"], r["to"], r["arrow"]["to_col"]) for r in rows[:2]],
            [
                ("Boss Bruno → ? unbekannt-7", "?", None),
                ("Boss Bruno → Aushilfe", f"{make_demo.GRAPH}:g-ex", None),
            ],
        )
        self.assertEqual([r["kind"] for r in rows[:3]].count("pause"), 0)
```

- [ ] **Step 2: Rot prüfen** — `python3 -m unittest tests.test_model.GraphFixtureTest -v`. Expected: FAIL (`ImportError: tests.fixtures` bzw. `AttributeError: graph_session`).

- [ ] **Step 3: Implementieren** — leere Datei `tools/studio/tests/fixtures/__init__.py`; in `make_demo.py` die bestehende Funktion `main` ersetzen durch:

```python
GRAPH = "7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f"
WIDE = "3e4f5a6b-7c8d-4e9f-a0b1-c2d3e4f5a6b7"
LANG = (
    "Bitte die zwei Review-Befunde beheben: erstens die Rundung in trade.ts auf "
    "ganze Taler umstellen, zweitens einen Test für leere Lager ergänzen; danach "
    "make check laufen lassen und kurz berichten, welche Tests neu dazugekommen sind."
)


def stamp_at(t: float) -> str:
    stamp = datetime.fromtimestamp(t, timezone.utc)
    return stamp.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def graph_session(start: float) -> list[dict]:
    """Session G „alle Fälle" (Spec Prozess-Graph, Fixture-Tabelle Nr. 1–44)."""

    def at(mmss: str) -> str:
        minutes, seconds = mmss.split(":")
        return stamp_at(start + int(minutes) * 60 + int(seconds))

    def h(kind: str, mmss: str, agent: str = "main", **kw) -> dict:
        return {
            "ts": at(mmss),
            "session_id": GRAPH,
            "agent_id": agent,
            "source": "hook",
            "kind": kind,
            **kw,
        }

    def lg(mmss: str, **kw) -> dict:
        return {
            "ts": at(mmss),
            "session_id": GRAPH,
            "agent_id": "",
            "source": "log",
            "kind": "status",
            **kw,
        }

    def beats(agent: str, first: str, last: str, step: int, tools: list[str]):
        a, b = (
            sum(int(x) * f for x, f in zip(v.split(":"), (60, 1)))
            for v in (first, last)
        )
        return [
            h(
                "heartbeat",
                f"{t // 60:02d}:{t % 60:02d}",
                agent,
                tool=tools[i % len(tools)],
            )
            for i, t in enumerate(range(a, b + 1, step))
        ]

    def spawn(mmss, agent, typ, desc, tid, **kw):
        return h(
            "spawn",
            mmss,
            agent,
            subagent_type=typ,
            description=desc,
            tool_use_id=tid,
            **kw,
        )

    ts1 = "tech-sim-engineer"
    return [
        h("session_start", "00:00", status="idle", model="opus"),
        h("prompt", "00:05", status="active", task="Handelsrouten umsetzen und prüfen"),
        spawn(
            "00:30", "main", "lead-tech", "Handelsrouten umsetzen", "g1", model="opus"
        ),
        h("spawned", "00:31", child_id="g-lt", tool_use_id="g1"),
        h("agent_start", "00:32", "g-lt", role="lead-tech", status="active"),
        spawn(
            "01:00",
            "g-lt",
            ts1,
            "Routen-Simulation",
            "g2",
            package="G-1",
            model="sonnet",
        ),
        h("spawned", "01:01", "g-lt", child_id="g-ts1", tool_use_id="g2"),
        h("agent_start", "01:02", "g-ts1", role=ts1, status="active"),
        spawn(
            "01:10", "g-lt", ts1, "Zollberechnung", "g3", package="G-2", model="sonnet"
        ),
        h("spawned", "01:11", "g-lt", child_id="g-ts2", tool_use_id="g3"),
        h("agent_start", "01:12", "g-ts2", role=ts1, status="active"),
        spawn("01:40", "main", "Explore", "Bestehende Handelsdateien suchen", "g4"),
        h("spawned", "01:41", child_id="g-ex", tool_use_id="g4"),
        h("agent_start", "01:42", "g-ex", role="Explore", status="active"),
        *beats("g-ts1", "01:30", "05:30", 30, ["Read", "Edit", "Bash"]),
        *beats("g-ts2", "01:30", "03:00", 30, ["Read", "Edit"]),
        *beats("g-ex", "01:50", "02:50", 20, ["Grep", "Glob", "Read"]),
        h(
            "agent_stop",
            "03:00",
            "g-ex",
            role="Explore",
            status="done",
            summary="3 Dateien gefunden: trade.ts, ships.ts, ports.ts",
        ),
        h("bind", "03:30", "g-ts2", role=ts1, package="G-2"),
        lg(
            "03:31",
            role=ts1,
            status="blocked",
            task="Zollsatz fehlt in defs",
            package="G-2",
        ),
        h(
            "message",
            "04:00",
            "g-ts2",
            role=ts1,
            to="main",
            text="Zollsatz fehlt in src/sim/defs — 10 % oder 15 %?",
        ),
        h(
            "message",
            "04:30",
            to="g-lt [lead-tech]",
            text="Zoll 10 %, bitte an Logik-Lars (2) weitergeben",
        ),
        h("message", "05:00", "g-lt", role="lead-tech", to="zoll-helfer", text=XSS),
        h("bind", "05:29", "g-ts2", role=ts1, package="G-2"),
        lg(
            "05:30",
            role=ts1,
            status="failed",
            summary="Zollberechnung abgebrochen, Werte fehlen",
            package="G-2",
        ),
        h(
            "agent_stop",
            "05:40",
            "g-ts2",
            role=ts1,
            status="done",
            summary="Abgebrochen",
        ),
        h("bind", "05:59", "g-ts1", role=ts1, package="G-1"),
        lg(
            "06:00",
            role=ts1,
            status="done",
            summary="Routen-Simulation fertig, 12 Tests grün",
            package="G-1",
        ),
        h("agent_stop", "06:10", "g-ts1", role=ts1, status="done", summary="Fertig."),
        spawn(
            "06:30",
            "g-lt",
            "qa-code-reviewer",
            "Review Routen-Simulation",
            "g5",
            package="G-1",
            model="sonnet",
        ),
        h("spawned", "06:31", "g-lt", child_id="g-qr", tool_use_id="g5"),
        h("agent_start", "06:32", "g-qr", role="qa-code-reviewer", status="active"),
        *beats("g-qr", "06:40", "08:50", 30, ["Read", "Grep"]),
        h("bind", "07:00", "g-lt", role="lead-tech"),
        lg("07:01", role="lead-tech", status="waiting", task="Wartet auf Review"),
        h(
            "agent_stop",
            "09:00",
            "g-qr",
            role="qa-code-reviewer",
            status="done",
            summary="2 Befunde: Rundung in trade.ts, fehlender Test",
        ),
        h(
            "agent_stop",
            "12:00",
            "g-help",
            status="done",
            summary="Fortschritt: 3 von 5 Schritten",
        ),
        h("message", "16:00", "g-lt", role="lead-tech", to="g-ts1", text=LANG),
        h("agent_start", "16:05", "g-ts1", role=ts1, status="active"),
        *beats("g-ts1", "16:30", "19:00", 30, ["Edit", "Bash"]),
        h(
            "agent_stop",
            "19:30",
            "g-ts1",
            role=ts1,
            status="done",
            summary="Befunde behoben, 14 Tests grün",
        ),
        h("bind", "19:59", "g-lt", role="lead-tech"),
        lg(
            "20:00",
            role="lead-tech",
            status="done",
            summary="Handelsrouten umgesetzt und geprüft",
        ),
        h(
            "agent_stop",
            "21:00",
            "g-lt",
            role="lead-tech",
            status="done",
            summary="Handelsrouten fertig",
        ),
        h("turn_end", "21:10", status="idle", summary="Handelsrouten fertig"),
    ]


def wide_session(start: float) -> list[dict]:
    """Session W: 10 gleichzeitige Spalten für die Handybreite (P39)."""

    def h(kind: str, seconds: float, agent: str = "main", **kw) -> dict:
        return {
            "ts": stamp_at(start + seconds),
            "session_id": WIDE,
            "agent_id": agent,
            "source": "hook",
            "kind": kind,
            **kw,
        }

    events = [
        h("session_start", 0, status="idle", model="opus"),
        h("prompt", 5, status="active", task="Grosses Review aller Pakete"),
        h(
            "spawn",
            10,
            subagent_type="lead-qa",
            description="Review koordinieren",
            model="opus",
            tool_use_id="w0",
        ),
        h("spawned", 11, child_id="w-lq", tool_use_id="w0"),
        h("agent_start", 12, "w-lq", role="lead-qa", status="active"),
    ]
    for k in range(1, 9):
        t = 30 + (k - 1) * 5
        events += [
            h(
                "spawn",
                t,
                "w-lq",
                subagent_type="qa-code-reviewer",
                description=f"Review Teil {k}",
                model="sonnet",
                tool_use_id=f"w{k}",
            ),
            h("spawned", t + 1, "w-lq", child_id=f"w-r{k}", tool_use_id=f"w{k}"),
            h(
                "agent_start",
                t + 2,
                f"w-r{k}",
                role="qa-code-reviewer",
                status="active",
            ),
        ]
    return events


def append_g9(path: Path) -> list[dict]:
    """Zwei Nachrichten nach dem jüngsten Event der Session G (G-S9, zeitunabhängig)."""
    events = [json.loads(line) for line in path.read_text("utf-8").splitlines() if line]
    latest = max(
        datetime.fromisoformat(e["ts"].replace("Z", "+00:00")).timestamp()
        for e in events
        if e.get("session_id") == GRAPH
    )
    extra = [
        {
            "ts": stamp_at(latest + 20),
            "session_id": GRAPH,
            "agent_id": "main",
            "source": "hook",
            "kind": "message",
            "to": "g-ex",
            "text": "Danke für die Suche",
        },
        {
            "ts": stamp_at(latest + 30),
            "session_id": GRAPH,
            "agent_id": "main",
            "source": "hook",
            "kind": "message",
            "to": "unbekannt-7",
            "text": "Test",
        },
    ]
    lines = [json.dumps(e, ensure_ascii=False, separators=(",", ":")) for e in extra]
    with open(path, "a", encoding="utf-8") as handle:
        handle.writelines(line + "\n" for line in lines)
    return extra


def main(argv: list[str]) -> int:
    if argv[:1] == ["--append-g9"] and len(argv) == 2:
        extra = append_g9(Path(argv[1]))
        print(f"{len(extra)} Events an {argv[1]} angehängt")
        return 0
    target = Path(argv[0]) if argv else Path(__file__).with_name("demo_events.jsonl")
    events = (
        old_session()
        + current_session()
        + graph_session(NOW - 22 * 60)
        + wide_session(NOW - 3 * 60)
    )
    lines = [json.dumps(e, ensure_ascii=False, separators=(",", ":")) for e in events]
    target.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"{len(events)} Events nach {target}")
    return 0
```

- [ ] **Step 4: Grün prüfen** — `python3 -m unittest tests.test_model.GraphFixtureTest -v`, `make studio-test`, `make studio-lint`, `python3 tools/studio/tests/fixtures/make_demo.py "$(mktemp -d)/e.jsonl"` (Ausgabe „… Events nach …"). Expected: PASS. Weicht eine Referenzzeile ab, zuerst gegen die Spec-Tabelle prüfen; nur der Code wird angepasst, nie die Referenz.

- [ ] **Step 5: Commit** — `git commit -m "test: Fixture-Sessions G und W mit Referenz für den Prozess-Graphen"`

### Task 8: UI — Status-Tabelle, vereinfachte Kacheln, Kachel-Fokus (K1–K7, P13, P14, P28)

**Files:**

- Modify: `tools/studio/dashboard/dom.js` (`STATUS`, `INACTIVE`, `statusText` ersetzen `STATUS_LABEL`; `knownStatus`, `statusBadge`)
- Create: `tools/studio/dashboard/focus.js` (offene Kacheln und genau ein Fokus; die Zeilen-Funktionen nutzt Task 9)
- Modify: `tools/studio/dashboard/app.js` (Imports, `render`, `nodeCard`, `renderCounts`, Klick auf `#org`)
- Modify: `tools/studio/dashboard/style.css` (Kachel-Rand in Bereichsfarbe, Kachel-Regeln; tote Regeln `.node-head`, `.node-head .role`, `.level`, `.persona`, `.inactive-note` entfernen)

**Interfaces:**

- Consumes: Knotenfelder `name`, `title`, `emoji`, `task_short`, `key` (Task 5, 6a); `state.graph.rows[].id` (Task 6b).
- Produces: `dom.js` exportiert `STATUS`, `INACTIVE`, `statusText(status, idleSeconds = null)`; `focus.js` exportiert `openNodes`, `toggleNode(key)`, `toggleRow(id)`, `dropMissing(agentKeys, rowIds)`, `applyFocus()`; Kacheln sind `<details class="node dep-<bereich> …" data-key="<session>:<agent_id>">`; `applyFocus()` liest im Graphen `#graph .graph-row[data-id][data-agents]` und `#graph [data-agents]` (Task 9 erzeugt sie).

- [ ] **Step 1: Browser-Check als Test-first** — vor der Änderung mit der Basis die Kachel-Checks K-S1 und K-S2 laufen lassen (Aufbau unten); Expected: FAIL (Rollennamen statt „🔧 Technik-Toni", L0/L1/L2-Marken sichtbar). Den Screenshot als `.studio/qa/G/K-vorher.png` im Hauptrepo ablegen.

- [ ] **Step 2: `dom.js`** — `STATUS_LABEL` ersetzen durch:

```js
// Eine Status-Tabelle für Kacheln, Status-Karte, Feed und Prozess-Graph (Spec Prozess-Graph, K4).
export const STATUS = {
  active: { emoji: '🔨', label: 'arbeitet' },
  delegated: { emoji: '📣', label: 'lässt arbeiten' },
  waiting: { emoji: '⏳', label: 'wartet' },
  blocked: { emoji: '🚧', label: 'steckt fest' },
  idle: { emoji: '☕', label: 'bereit' },
  done: { emoji: '✅', label: 'fertig' },
  failed: { emoji: '💥', label: 'gescheitert' },
  ended: { emoji: '🌙', label: 'Feierabend' },
};
export const INACTIVE = { emoji: '💤', label: 'döst' };
```

`knownStatus` ersetzen und `statusText` ergänzen:

```js
export function knownStatus(status) {
  return Object.hasOwn(STATUS, status) ? status : 'idle';
}

// „✅ fertig"; mit idleSeconds (inaktiver Knoten) „💤 döst seit n min" (P13).
export function statusText(status, idleSeconds = null) {
  if (idleSeconds !== null) {
    return `${INACTIVE.emoji} ${INACTIVE.label} seit ${Math.floor(idleSeconds / 60)} min`;
  }
  if (!Object.hasOwn(STATUS, status)) return status || '–';
  return `${STATUS[status].emoji} ${STATUS[status].label}`;
}
```

`statusBadge` ersetzen:

```js
export function statusBadge(status) {
  return el('span', { class: `badge st-${knownStatus(status)}` }, statusText(status));
}
```

- [ ] **Step 3: `focus.js` anlegen**

```js
// Fokus und offene Kacheln über das Neuzeichnen hinweg (Spec Prozess-Graph, P14, P28).
// Genau ein Fokus: ein Agent (Kachel-Klick) oder eine Graph-Zeile (Zeilen-Klick).

export const openNodes = new Set();
let focus = null; // { type: 'agent' | 'row', key }

// Kachel-Klick: zugeklappt → aufklappen und Agent-Fokus; aufgeklappt → zuklappen,
// Fokus nur aufheben, wenn diese Kachel ihn hatte.
export function toggleNode(key) {
  if (openNodes.has(key)) {
    openNodes.delete(key);
    if (focus?.type === 'agent' && focus.key === key) focus = null;
  } else {
    openNodes.add(key);
    focus = { type: 'agent', key };
  }
  applyFocus();
}

// Zeilen-Klick: Zeilen-Fokus setzen oder (gleiche Zeile) aufheben; Kacheln bleiben offen.
export function toggleRow(id) {
  focus = focus?.type === 'row' && focus.key === id ? null : { type: 'row', key: id };
  applyFocus();
}

// Verschwundene Schlüssel still verwerfen (K6, P34).
export function dropMissing(agentKeys, rowIds) {
  for (const key of [...openNodes]) if (!agentKeys.has(key)) openNodes.delete(key);
  if (focus?.type === 'agent' && !agentKeys.has(focus.key)) focus = null;
  if (focus?.type === 'row' && !rowIds.has(focus.key)) focus = null;
}

// Klassen setzen: .open-Zustand, .highlight (Kacheln einer fokussierten Zeile),
// .focused (Zeile), .dim (alles ausser dem fokussierten Agenten, G8).
export function applyFocus() {
  const agent = focus?.type === 'agent' ? focus.key : null;
  const rowId = focus?.type === 'row' ? focus.key : null;
  const involved = new Set();
  for (const row of document.querySelectorAll('#graph .graph-row')) {
    const hit = rowId !== null && row.dataset.id === rowId;
    row.classList.toggle('focused', hit);
    if (hit) for (const key of row.dataset.agents.split(' ')) involved.add(key);
  }
  for (const card of document.querySelectorAll('#org .node')) {
    card.open = openNodes.has(card.dataset.key);
    card.classList.toggle('highlight', involved.has(card.dataset.key));
  }
  for (const item of document.querySelectorAll('#graph [data-agents]')) {
    const mine = item.dataset.agents.split(' ').includes(agent);
    item.classList.toggle('dim', agent !== null && !mine);
  }
}
```

- [ ] **Step 4: `app.js`**

Imports: aus `./dom.js` `LEVEL_LABEL` und `STATUS_LABEL` entfernen, `INACTIVE`, `STATUS`, `statusText` ergänzen; neu `import { applyFocus, dropMissing, openNodes, toggleNode } from './focus.js';`. `render` (Schleifenrumpf unverändert):

```js
function treeKeys(nodes, keys = new Set()) {
  for (const node of nodes || []) {
    keys.add(node.key);
    treeKeys(node.children, keys);
  }
  return keys;
}

function render(state) {
  const rowIds = new Set(((state.graph && state.graph.rows) || []).map((r) => r.id));
  dropMissing(treeKeys(state.tree), rowIds);
  for (const [id, view] of VIEWS) {
    // … unverändert (try/catch je Ansicht) …
  }
  applyFocus(); // Kacheln und Graph sind neu gezeichnet: Fokus-Klassen wieder setzen
}
```

`nodeCard` ersetzen:

```js
// Kachel (K1–K3): zugeklappt Emoji + Name, Titel, Status + Kurzaufgabe; Details aufgeklappt.
function nodeCard(node, showSession) {
  const status = knownStatus(node.status);
  const idle = Number(node.idle_seconds) || 0;
  const classes = [
    'node',
    `st-${status}`,
    `dep-${knownDepartment(node.department)}`,
    node.inactive ? 'inactive' : '',
  ]
    .join(' ')
    .trim();
  const state = statusText(node.status, node.inactive ? idle : null);
  const meta = [
    node.model,
    node.package,
    showSession ? `Session ${String(node.session_id).slice(0, 8)}` : '',
  ]
    .filter(Boolean)
    .join(' · ');
  const card = el(
    'details',
    {
      class: classes,
      'data-level': String(node.level),
      'data-key': node.key,
      open: openNodes.has(node.key) ? '' : null,
    },
    el(
      'summary',
      { class: 'node-summary' },
      el('span', { class: 'node-name' }, `${node.emoji || ''} ${node.name || node.role}`.trim()),
      el('span', { class: 'node-title' }, node.title || node.role || ''),
      el(
        'span',
        { class: 'node-status' },
        node.task_short ? `${state} · ${node.task_short}` : state,
      ),
    ),
    el(
      'div',
      { class: 'node-details' },
      meta ? el('p', { class: 'node-meta' }, meta) : null,
      node.task ? el('p', { class: 'task' }, node.task) : null,
      node.summary ? el('p', { class: 'summary' }, `Ergebnis: ${node.summary}`) : null,
      el('p', { class: 'seen' }, `Lebenszeichen ${ago(idle)}`),
    ),
  );
  if (node.inactive) card.style.animationDelay = `-${Date.now() % INACTIVE_PULSE_MS}ms`;
  return card;
}
```

`renderCounts` ersetzen:

```js
function renderCounts(state) {
  const counts = state.counts || {};
  const tiles = Object.keys(STATUS).map((status) =>
    countTile(`st-${status}`, statusText(status), counts[status] || 0),
  );
  tiles.push(
    countTile('tile-inactive', `${INACTIVE.emoji} ${INACTIVE.label}`, counts.inactive || 0),
  );
  document.getElementById('counts').replaceChildren(...tiles);
}
```

Nach `window.addEventListener('hashchange', showTab);`:

```js
// Kachel-Klick = Agent fokussieren (K5, P28); das native Auf-/Zuklappen übernimmt focus.js.
document.getElementById('org').addEventListener('click', (event) => {
  const summary = event.target.closest('summary');
  if (!summary) return;
  event.preventDefault();
  toggleNode(summary.parentElement.dataset.key);
});
```

- [ ] **Step 5: `style.css`** — in der Regel `.node` `border-left: 4px solid var(--st, var(--st-idle));` ersetzen durch `border-left: 4px solid var(--dep, var(--border));` und am Ende anhängen:

```css
/* --- Kacheln: zugeklappt / aufgeklappt (Spec Prozess-Graph, K1–K3) ----------- */

.node > summary {
  display: grid;
  gap: 2px;
  list-style: none;
  cursor: pointer;
}

.node > summary::-webkit-details-marker {
  display: none;
}

.node-name {
  font-weight: 700;
}

.node[data-level='0'] .node-name,
.node[data-level='1'] .node-name {
  font-size: 1.05rem;
}

.node-title {
  font-size: 0.8rem;
  color: var(--muted);
}

.node-status {
  font-size: 0.85rem;
}

.node-details {
  display: grid;
  gap: 6px;
  margin-top: 8px;
  overflow-wrap: anywhere;
}

.node-meta {
  font-size: 0.8rem;
  color: var(--muted);
}

.node.highlight {
  outline: 3px solid var(--dep, var(--border));
  outline-offset: 2px;
}
```

- [ ] **Step 6: Lint und Tests** — `cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph && npx prettier --write tools/studio/dashboard && make check`. Expected: grün.

- [ ] **Step 7: Commit** — `git commit -m "feat: Organigramm-Kacheln mit Name, Emoji-Status und Kurzaufgabe"`

- [ ] **Step 8: Playtest (`qa-playtester`, parallel zum Code-Review)** — Aufbau:

```bash
TMP=$(mktemp -d)
python3 /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph/tools/studio/tests/fixtures/make_demo.py "$TMP/events.jsonl"
STUDIO_HOME="$TMP" STUDIO_NO_SERVER=1 python3 /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph/tools/studio/server.py --port 8799 &
# G: http://127.0.0.1:8799/?session=7c1d2e3f-4a5b-4c6d-8e9f-0a1b2c3d4e5f&theme=light#live
# W: http://127.0.0.1:8799/?session=3e4f5a6b-7c8d-4e9f-a0b1-c2d3e4f5a6b7&theme=light#live
# D: http://127.0.0.1:8799/?session=5f3c9a1e-7b2d-4c8e-9f10-2a6b3c4d5e6f&theme=light#live
# Alt: http://127.0.0.1:8799/?session=0a9d8c7b-6e5f-4a3b-8c2d-1e0f9a8b7c6d&theme=light#live
```

Checks laut Spec: **K-S1** (URL G, breit, hell), **K-S2** (URL D, Status-Karte), **K-S3** (URL D, „🖱️ UI-Ursula" döst, XSS-Kurzaufgabe als Text), **K-S6** (schmal, dunkel, eine Kachel aufgeklappt). Breit = Fenster 1280×2000; schmal per CDP `Emulation.setDeviceMetricsOverride` 390×2400, `mobile: true` (Ü12); Klicks per CDP (P29). Screenshots unter `/Users/KN/CAS/projekte/anno-clone/.studio/qa/G/`, Bericht nach `docs/studio/templates/playtest-report.md`. Zusätzlich: CDP-Klick auf eine Kachel, 5 s warten → Kachel bleibt offen (K6; Vorstufe von K-S4).

Code-Review-Schwerpunkte: kein `innerHTML`; `details` wird nicht nativ umgeschaltet (Klick → `preventDefault` → `toggleNode`); P28-Regeln in `focus.js`; `views.js` nutzt `STATUS_LABEL` nicht (sonst mitziehen).

### Task 9: UI — Prozess-Graph-Karte (G1–G13, P15–P17, P30, P33, P35, P36)

**Files:**

- Create: `tools/studio/dashboard/graph.js`
- Modify: `tools/studio/dashboard/index.html` (Karte im Reiter Live direkt nach „Organigramm", Ü2)
- Modify: `tools/studio/dashboard/app.js` (Import, Eintrag in `VIEWS`, `setupGraph()`)
- Modify: `tools/studio/dashboard/style.css` (Graph-Regeln)
- `focus.js` nur, falls der Playtest einen Fokus-Fehler zeigt

**Interfaces:**

- Consumes: `state.graph` (Task 6b), `focus.js` (Task 8), `dom.js` `STATUS`, `el`, `svg`, `clock`, `empty`, `knownDepartment`.
- Produces: `graph.js` exportiert `GRAPH_COL_PX = 14`, `GRAPH_ROW_PX = 28`, `renderGraph(state)`, `setupGraph()`; DOM: `#graph.graph-body` (Scroll-Container), `.graph-row[data-id][data-agents]` je Zeile (`data-agents` = volle Knotenschlüssel `from`/`to`), SVG-Elemente mit `data-agents` = `graph.session + ":" + lane.key` (P36); Hinweis `#graph-new`.

- [ ] **Step 1: Browser-Check als Test-first** — G-S1 und G-S10 mit dem Stand nach Task 8 laufen lassen; Expected: FAIL (keine Karte „Prozess-Graph").

- [ ] **Step 2: `graph.js` anlegen**

```js
// Prozess-Graph: zeichnet state.graph (Spalten, Spuren, Punkte, Pfeile, Zeilen).
// Das Modell rechnet alles; hier wird nur gezeichnet (Spec Prozess-Graph, Abschnitt G).
// Sicherheit: Texte nur per textContent/Attribut (G12).

import { STATUS, clock, el, empty, knownDepartment, svg } from './dom.js';
import { applyFocus, toggleRow } from './focus.js';

export const GRAPH_COL_PX = 14;
export const GRAPH_ROW_PX = 28;
const LANE_PAD = 4; // Rand links und rechts: Breite = Spalten × 14 + 8 (G3)

let signature = '';
let shownSession = null;
let knownIds = new Set();
let pendingNew = 0;

function laneX(col) {
  return LANE_PAD + GRAPH_COL_PX * col + GRAPH_COL_PX / 2;
}

function agentKey(graph, lane) {
  return lane && lane.key !== null ? `${graph.session}:${lane.key}` : '';
}

function depClass(lane) {
  return `dep-${knownDepartment(lane ? lane.department : null)}`;
}

function arrowShape(graph, row, mid) {
  const { from_col: from, to_col: to, style } = row.arrow;
  const x1 = laneX(from);
  const attrs = {
    class: `arrow ${style} ${depClass(row.lanes[from])}`,
    'data-agents': [row.from, row.to].filter(Boolean).join(' '),
  };
  if (to === null) {
    // Stummel: Ziel ohne Spur; „?" nur bei unzuordenbarem Empfänger (G5, P23)
    const stub = { x1, y1: mid, x2: x1 + GRAPH_COL_PX, y2: mid };
    if (style === 'message') stub['marker-end'] = 'url(#graph-arrow)';
    const parts = [svg('line', stub)];
    if (row.to === '?') {
      parts.push(
        svg('text', { class: 'graph-unknown', x: x1 + GRAPH_COL_PX + 3, y: mid + 4 }, '?'),
      );
    }
    return svg('g', attrs, ...parts);
  }
  const x2 = laneX(to);
  if (style === 'message') {
    const end = x2 - Math.sign(x2 - x1) * 5;
    return svg('line', {
      ...attrs,
      x1,
      y1: mid,
      x2: end,
      y2: mid,
      'marker-end': 'url(#graph-arrow)',
    });
  }
  const half = GRAPH_ROW_PX / 2;
  const d =
    style === 'branch'
      ? `M ${x1} ${mid} Q ${x2} ${mid} ${x2} ${mid - half}`
      : `M ${x1} ${mid + half} Q ${x1} ${mid} ${x2} ${mid}`;
  return svg('path', { ...attrs, d });
}

function drawRow(canvas, graph, row, r) {
  const top = GRAPH_ROW_PX * r;
  const mid = top + GRAPH_ROW_PX / 2;
  row.lanes.forEach((lane, col) => {
    for (const [style, y1, y2] of [
      [lane.up, top, mid],
      [lane.down, mid, top + GRAPH_ROW_PX],
    ]) {
      if (style === 'none') continue;
      const cls = `lane ${depClass(lane)}${style === 'dashed' ? ' dashed' : ''}`;
      const x = laneX(col);
      canvas.append(
        svg('line', {
          class: cls,
          x1: x,
          y1,
          x2: x,
          y2,
          'data-agents': agentKey(graph, lane),
        }),
      );
    }
  });
  if (row.arrow) canvas.append(arrowShape(graph, row, mid));
  if (row.dot !== null) {
    const lane = row.lanes[row.dot];
    canvas.append(
      svg('circle', {
        class: `graph-dot ${depClass(lane)}`,
        cx: laneX(row.dot),
        cy: mid,
        r: 4,
        'data-agents': agentKey(graph, lane),
      }),
    );
  }
}

function rowItem(row) {
  if (row.kind === 'pause') {
    return el('li', { class: 'graph-row pause', 'data-id': row.id, 'data-agents': '' }, row.text);
  }
  const known = row.kind === 'status' && Object.hasOwn(STATUS, row.status);
  const prefix = known ? `${STATUS[row.status].emoji} ${STATUS[row.status].label} · ` : '';
  return el(
    'li',
    {
      class: `graph-row kind-${row.kind}`,
      'data-id': row.id,
      'data-agents': [row.from, row.to].filter(Boolean).join(' '),
    },
    el('time', { title: clock(row.t) }, row.time),
    el('span', { class: 'g-label' }, row.label),
    el('span', { class: 'g-text', title: row.text }, prefix + row.text),
  );
}

function graphView(graph) {
  const rows = graph.rows;
  const width = graph.columns * GRAPH_COL_PX + 2 * LANE_PAD;
  const height = rows.length * GRAPH_ROW_PX;
  const canvas = svg(
    'svg',
    {
      class: 'graph-svg',
      width,
      height,
      viewBox: `0 0 ${width} ${height}`,
      'aria-hidden': 'true',
    },
    svg(
      'defs',
      {},
      svg(
        'marker',
        {
          id: 'graph-arrow',
          viewBox: '0 0 6 6',
          refX: 5,
          refY: 3,
          markerWidth: 6,
          markerHeight: 6,
          orient: 'auto',
        },
        svg('path', { class: 'graph-arrowhead', d: 'M0,0 L6,3 L0,6 z' }),
      ),
    ),
  );
  rows.forEach((row, r) => drawRow(canvas, graph, row, r));
  return el(
    'div',
    { class: 'graph-grid' },
    el('div', { class: 'graph-lanes' }, canvas),
    el('ol', { class: 'graph-rows' }, ...rows.map(rowItem)),
  );
}

// P33: oberste sichtbare Zeile und ihr Abstand zum oberen Rand.
function captureAnchor(body) {
  if (body.scrollTop <= 0) return null;
  for (const item of body.querySelectorAll('.graph-row')) {
    if (item.offsetTop + GRAPH_ROW_PX > body.scrollTop) {
      return { id: item.dataset.id, offset: item.offsetTop - body.scrollTop };
    }
  }
  return null;
}

function restoreAnchor(body, anchor, oldRows, rows) {
  const t = (oldRows.find((r) => r.id === anchor.id) || {}).t;
  const target =
    rows.find((r) => r.id === anchor.id) || rows.find((r) => t !== undefined && r.t <= t);
  if (!target) return;
  for (const item of body.querySelectorAll('.graph-row')) {
    if (item.dataset.id === target.id) {
      body.scrollTop = item.offsetTop - anchor.offset;
      return;
    }
  }
}

function updateHint() {
  const hint = document.getElementById('graph-new');
  hint.hidden = pendingNew === 0;
  hint.textContent = `▲ ${pendingNew} neue Ereignisse`;
}

let lastRows = [];

export function renderGraph(state) {
  const body = document.getElementById('graph');
  const graph = state.graph;
  if (!graph) {
    signature = '';
    shownSession = null;
    knownIds = new Set();
    lastRows = [];
    pendingNew = 0;
    updateHint();
    body.replaceChildren(
      empty('Prozess-Graph nur für eine einzelne Session — oben eine Session wählen'),
    );
    return;
  }
  const rows = graph.rows || [];
  const sameSession = graph.session === shownSession;
  const next = JSON.stringify(graph);
  if (sameSession && next === signature) {
    applyFocus(); // P35: nur Fokus-Klassen auffrischen
    return;
  }
  const anchor = sameSession ? captureAnchor(body) : null;
  const fresh = sameSession ? rows.filter((r) => !knownIds.has(r.id)).length : 0;
  body.replaceChildren(rows.length ? graphView(graph) : empty('Noch keine Ereignisse'));
  if (graph.truncated) {
    body.append(
      el('p', { class: 'graph-note' }, 'Ältere Ereignisse ausgeblendet (höchstens 300 Zeilen)'),
    );
  }
  if (!sameSession) {
    body.scrollTop = 0; // G7: Sessionwechsel ohne Hinweis
    pendingNew = 0;
  } else if (anchor) {
    restoreAnchor(body, anchor, lastRows, rows);
    pendingNew += fresh;
  } else {
    pendingNew = 0;
  }
  signature = next;
  shownSession = graph.session;
  knownIds = new Set(rows.map((r) => r.id));
  lastRows = rows;
  updateHint();
  applyFocus();
}

export function setupGraph() {
  const body = document.getElementById('graph');
  body.addEventListener('click', (event) => {
    const item = event.target.closest('.graph-row');
    if (item && !item.classList.contains('pause')) toggleRow(item.dataset.id);
  });
  body.addEventListener('scroll', () => {
    if (body.scrollTop === 0 && pendingNew) {
      pendingNew = 0;
      updateHint();
    }
  });
  document.getElementById('graph-new').addEventListener('click', () => {
    body.scrollTop = 0;
    pendingNew = 0;
    updateHint();
  });
}
```

- [ ] **Step 3: `index.html`** — direkt nach der schliessenden `</section>` der Karte „Organigramm" im Reiter Live:

```html
<section class="card wide" aria-labelledby="h-graph">
  <div class="card-head">
    <h2 id="h-graph">Prozess-Graph</h2>
    <button id="graph-new" class="graph-new" type="button" hidden>▲ 0 neue Ereignisse</button>
  </div>
  <div id="graph" class="graph-body"></div>
</section>
```

- [ ] **Step 4: `app.js`** — `import { renderGraph, setupGraph } from './graph.js';`; in `VIEWS` nach `['org', renderOrg],` die Zeile `['graph', renderGraph],`; nach dem Klick-Listener auf `#org` die Zeile `setupGraph();`.

- [ ] **Step 5: `style.css`** — am Ende anhängen:

```css
/* --- Prozess-Graph (Spec Prozess-Graph, Abschnitt G) ------------------------ */

.graph-body {
  position: relative; /* Bezug für offsetTop der Zeilen (Scroll-Anker, P33) */
  height: 60vh;
  overflow-y: auto;
}

.graph-grid {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  column-gap: 20px; /* Platz für Stummel und „?" rechts der letzten Spalte */
}

.graph-svg {
  display: block;
  overflow: visible;
}

.graph-svg .lane {
  stroke: var(--dep);
  stroke-width: 2;
}

.graph-svg .lane.dashed {
  stroke-dasharray: 4 3;
}

.graph-svg .graph-dot {
  fill: var(--dep);
}

.graph-svg .arrow {
  fill: none;
  stroke: var(--dep);
  stroke-width: 1.5;
}

.graph-svg .arrow.message {
  stroke-dasharray: 1 3;
}

.graph-svg .graph-arrowhead {
  fill: var(--muted);
}

.graph-svg .graph-unknown {
  fill: var(--text);
  stroke: none;
  font-size: 11px;
  font-weight: 700;
}

.graph-rows {
  list-style: none;
  margin: 0;
  padding: 0;
}

.graph-row {
  display: grid;
  grid-template-columns: 3rem minmax(0, 14rem) minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  height: 28px; /* = GRAPH_ROW_PX */
  font-size: 0.85rem;
  cursor: pointer;
}

.graph-row time {
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.graph-row .g-label,
.graph-row .g-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.graph-row .g-label {
  font-weight: 600;
}

.graph-row.pause {
  display: flex;
  justify-content: center;
  color: var(--muted);
  background: color-mix(in srgb, var(--muted) 12%, transparent);
  cursor: default;
}

.graph-row.focused {
  background: color-mix(in srgb, var(--dep-studio) 16%, transparent);
}

.graph-body .dim {
  opacity: 0.3;
}

.graph-new {
  font-size: 0.8rem;
}

.graph-note {
  margin-top: 8px;
  color: var(--muted);
  font-size: 0.8rem;
}

@media (max-width: 719.98px) {
  .graph-lanes {
    max-width: 120px; /* höchstens 8 Spalten sichtbar (G11, P30) */
    overflow-x: auto;
    overflow-y: hidden;
  }

  .graph-row {
    grid-template-columns: 2.6rem minmax(0, 8rem) minmax(0, 1fr);
    gap: 6px;
  }
}
```

- [ ] **Step 6: Lint und Tests** — `npx prettier --write tools/studio/dashboard && make check`. Expected: grün.

- [ ] **Step 7: Commit** — `git commit -m "feat: Prozess-Graph im Reiter Live"`

- [ ] **Step 8: Playtest (`qa-playtester`, parallel zum Code-Review)** — Aufbau wie Task 8, danach alle Checks der Spec: **G-S1 bis G-S13**, **K-S4**, **K-S5**. Hinweise: G-S4/G-S5 nutzen URL W; G-S7 liest `title` des Elements `.g-text` der Zeile 16:00; G-S9 erst Fixture frisch erzeugen, Server starten, 200 px scrollen, dann `python3 /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph/tools/studio/tests/fixtures/make_demo.py --append-g9 "$TMP/events.jsonl"`; G-S13 wechselt die Session per `change`-Event auf `#session`. G-S6: zusätzlich `Page.javascriptDialogOpening` abonnieren. Bericht und Screenshots wie Task 8.

Code-Review-Schwerpunkte: **G-CR1** (Texte „Ältere Ereignisse ausgeblendet (höchstens 300 Zeilen)" und „Noch keine Ereignisse" per `textContent`); P35 (`JSON.stringify(graph)`-Vergleich, Fokus trotzdem je Poll); P33 (Anker über `data-id`, Rückfall nächstältere Zeile nach `t`); kein `innerHTML`; keine neuen Browser-Globals ausser den in `eslint.config.js` erlaubten.

### Task 10: Doku nachführen (Abschnitt „Nachzuführende Dokumente", übertragen)

**Files:**

- Modify: `docs/adr/ADR-008-studio-telemetrie.md` — zweiter Nachtrag „Prozess-Graph": Event `message` aus `PreToolUse(SendMessage)` mit `to` (≤ 120 Zeichen) und nur der ersten Zeile der Nachricht (≤ 160 Zeichen); `summary` wird nie gespeichert; lokal, gitignored. Datenschutz-Absatz der Konsequenzen um diesen Satz ergänzen.
- Modify: `docs/studio/roster.md` — Tabelle „Aktive Personas" um Spalten Name, Titel, Emoji und Spalte Version auf 1.1 (Werte laut `PERSONA_NAMES`, Direktor „Boss Bruno" im Namensschema-Abschnitt); Namensregel (Alliteration, Präfix = Arbeitswort); in „Neue Persona anlegen" Schritt 1 die Frontmatter-Felder `studio-name`, `studio-title`, `studio-emoji` nennen (Ü9).
- Modify: `docs/studio/STUDIO.md` — Reiter-Tabelle „Dashboard-Reiter", Zeile Live: „Organigramm, Prozess-Graph, …" (Ü9); keine Regeländerung, keine Versionsänderung.
- Modify: `docs/studio/templates/persona.md` — Frontmatter-Vorlage um die drei Felder.
- Modify: `docs/superpowers/specs/2026-09-30-studio-design.md` — Verweis auf die Prozess-Graph-Spec bei „Ansichten" und `kind` `message` im Event-Schema.
- Modify: `docs/index.md` — Eintrag der Prozess-Graph-Spec (und nach L0-Commit des Plans den Plan) in der Spec- bzw. Planliste.
- Modify: `docs/beobachtungen.md` — Eintrag Ü11 (stop-only-Knoten in Aufwand/Qualität) und ggf. Ü12 (Basis-Überlauf bei 390 px).
- Nicht ändern (geprüft): `README.md` (keine Ansichten beschrieben), `docs/arc42.md` (Studio nur in der ADR-Tabelle), `docs/studio/herkunft.md` (nur Darstellungsidee von `git log --graph`).

- [ ] **Step 1: Check als Test-first** — ```bash
      cd /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph && grep -c "message" docs/adr/ADR-008-studio-telemetrie.md; grep -c "studio-name" docs/studio/roster.md docs/studio/templates/persona.md; grep -c "Prozess-Graph" docs/studio/STUDIO.md docs/index.md docs/superpowers/specs/2026-09-30-studio-design.md

```
Expected vorher: 0 bei `roster.md`, `persona.md`, `STUDIO.md`, `index.md`, Studio-Spec.
- [ ] **Step 2: Änderungen schreiben** (Inhalt laut Liste oben; Mermaid ohne `\n`).
- [ ] **Step 3: Prüfen** — derselbe grep (jede Zahl ≥ 1), `npx prettier --write <geänderte .md>`, `make check` (inkl. `test_docs`: Handbuch-Version und Persona-Versionen unverändert).
- [ ] **Step 4: Commit** — `git commit -m "docs: Prozess-Graph in ADR-008, Roster, Handbuch und Spec-Index"`

### Task 11: Final-Review auf `opus` durch `lead-qa` (nicht `lead-tech`, R43)

- [ ] **Step 0: Übergabe** — `lead-tech` berichtet nach Task 10 an L0 (Branch-HEAD, `make check`/`make studio-lint`, Budget) und mergt nicht, pusht nicht. L0 startet `lead-qa`.
- [ ] **Step 1: Final-Review** — `lead-qa` startet `qa-code-reviewer`, `model: opus`, Kopfzeile `Modell: opus`, über die ganze Branch: `git -C /Users/KN/CAS/projekte/anno-clone/.worktrees/studio-graph diff main...feat/studio-prozessgraph`. Prüft Spec-Konformität (alle T-, G-, K-Kriterien und P1–P39), die Übertragungen Ü1–Ü12 laut L0-Entscheid, `make check` selbst ausführen, Doku-Konsistenz (README, arc42, ADR-008, Roster), keine Secrets, OWASP (XSS, keine schreibenden Endpunkte), Commit-Konvention. Urteil OK/BEDENKEN/ZURÜCK.
- [ ] **Step 2: Befunde** — L0 leitet BEDENKEN/ZURÜCK an `lead-tech`; Fix-Runden per `SendMessage` an den zuständigen Implementierer.
- [ ] **Step 3: Merge-Gate** — L0 entscheidet; `production-integrator` mergt.

## Selbstprüfung gegen die Spec

- T1a–T1i → Task 1 · T2a → Task 3 · T2b → Task 6b · T3a, T3b, T3g, T6a → Task 5 · T3c–T3f → Task 6a · T4a–T4y → Task 6b (T4v Teil Baum/Zähler in Task 3) · T5, T5b, T5c → Task 7 · G-S1–G-S13, K-S4, K-S5, G-CR1 → Task 9 · K-S1–K-S3, K-S6 → Task 8 · Nachzuführende Dokumente → Task 10 (Frontmatter in Task 5, weil der Playtest die Namen braucht) · L0-Ruling Gate Spec (Fix A, Fix B) → Task 2, 4.
- Nicht abgedeckt, bewusst: stop-only in Aufwand/Qualität (Ü11, Beobachtung).
```
