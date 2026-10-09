# Werkzeug-Bündel (TOOL-BUENDEL) Implementation Plan — Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vier Studio-Werkzeuge in einem Bündel: Prettier-Check beim `git commit`, Modell-Guard für Persona-Starts, Studio-Hygiene (Phantom-Vorfall, verwaiste Vitest-Worker) und die E-049-Zeile in `efficiency.py`; dazu das Smoke-Etikett „Save v9“.

**Architecture:** siehe Abschnitt «Architektur». **Tech Stack:** Python 3 (nur Standardbibliothek, unittest, Ruff), TypeScript/ESM für `tools/testlock` und `tools/render-qa` (Node mit Type-Stripping, Vitest), vorhandenes Prettier. Keine neue Abhängigkeit.

**Spec:** keine Spec-Datei (Werkzeug-Paket). Grundlage: R417 (V2), R419 (Smoke-Etikett), R420 (V1, V2), R421, R422; `docs/studio/experimente.md` E-038, E-049; Befunde `docs/beobachtungen.md` (Paket-Kandidat TOOL-STUDIO-HYGIENE, Smoke-Etikett); Retro `docs/studio/retros/2026-10-09-release-rel12-prozess.md` B2.

Prozessstufe voll (Format) · Paket TOOL-BUENDEL · Meilenstein TOOL · Planbasis `main` @ `49498bd`, Umsetzungsbasis aktueller `main` (R428 B7) · Format E-010: dieser Index plus je Task eine Datei ≤ 10 KB im Ordner [`2026-10-09-tool-buendel/`](2026-10-09-tool-buendel/). Arbeiter und Task-Reviewer lesen nur ihre Task-Datei(en) und die genannten AK-IDs (Liste unten). T01 und T02 sind wegen der Grenze je in a/b geteilt; a und b laufen im selben Umsetzer-Start und werden zusammen reviewt.

## Global Constraints

- Keine neue Abhängigkeit (ADR-001, `dep-guard`): kein husky, kein lint-staged; Python nur Standardbibliothek.
- `tools/studio/guard.py`, `docs/studio/VERFASSUNG.md` und die Guard-Einträge in `.claude/settings.json` bleiben **unverändert** (Verfassung §1.3). Neue Hook-Einträge dürfen nur **hinzukommen**.
- Hooks werfen nie: Fehler im Werkzeug lassen zu (Exit 0, ggf. Hinweis auf stderr). Ausnahme ist nur die gewollte Ablehnung (Prettier-Befund; Modell über der Tabelle erst mit `MODE = "deny"`, R428).
- Neue Events gehen über `paths.append_event` nach `.studio/events.jsonl` (`STUDIO_HOME` überschreibbar, Tests nie ins echte Log).
- Python: `make studio-lint` Exit 0 (Ruff check + format). TS/MJS/MD/JSON: `make lint` Exit 0 (ESLint + Prettier).
- Testschalter (`TESTLOCK_PS_FIXTURE`, `STUDIO_HOME`, `STUDIO_DOCS`) sind nur für Tests und als solche kommentiert (R378).
- Commit-Präfixe `feat:`, `fix:`, `test:`, `docs:`, `refactor:`; kein Rebase, kein Force-Push; Trailer der Session.
- R421: Umsetzung erst nach grünem Push-Gate; vorher keine Testläufe.

## Review Focus

1. **Teilweise gestagte Datei** (`git add -p`): Prettier prüft den Arbeitsbaum, nicht den Index-Stand. Erwartung: dokumentierte Grenze (ADR-014, Hook-Kommentar); geprüft wird genau die Liste der gestagten Pfade. Test: T01a `test_passes_exactly_staged_paths_once`.
2. **Dateinamen mit Leerzeichen/Umlauten und Umbenennungen:** Liste per `-z`, `--diff-filter=ACMR`, gelöschte Dateien nie an Prettier. Test: T01a `test_staged_files_nul_separated`.
3. **Kopfzeile in Briefing-Form** (`- **Modell:** opus (Final-Review über die Branch)`, Gross-/Kleinschreibung): wird erkannt; falscher Alias in der Kopfzeile nicht. Test: T02a `test_bold_header_and_prefix_match`.
4. **Echter Agent mit verlorenem `agent_start`:** Ein per `spawned` bestätigter Knoten bleibt sichtbar; nur unbestätigte Knoten verschwinden. Test: T03 `test_confirmed_child_without_start_stays_visible`.
5. **Testsperre bricht ab (Load/Sperre):** Der Waisen-Hinweis erscheint trotzdem, Exit-Code bleibt 3; `ps`-Fehler ändert nichts. Test: T04 `Hinweis auch bei Lastabbruch`.

## Architektur (≤ 15 Zeilen)

- **Prettier-Hook:** `tools/githooks/pre-commit` (sh, 100755) ruft `tools/studio/precommit.py`; ein Prettier-Lauf (`--list-different --ignore-unknown`) über die gestagten Pfade; Ablehnung = Exit 1 + Event `commit_rejected`. Aktiv per `make hooks` (`git config core.hooksPath tools/githooks`, relativ = je Worktree).
- **Modell-Guard:** neues Modul `tools/studio/modelguard.py` als **zusätzlicher** PreToolUse-Hook (Matcher `Agent|Task`) in `.claude/settings.json`, nicht in `guard.py` (Verfassungsschutz §1.3, E1). Startzustand `MODE = "warn"` (nur Event); `deny` setzt TOOL-AKTIVIERUNG (R428 E2). Unbekannter Alias: zulassen mit Event.
- **Zuordnung ohne Doppelpflege:** Basis = Persona-Frontmatter `model` (Handbuch: „Frontmatter legt das Standardmodell fest“); Ausnahme = Tabelle `STUDIO.md` § Modellwahl, maschinell gelesen (Alias je Zeile, Einsätze kommagetrennt). Start über der Basis nur mit Kopfzeile `Modell: <alias> (<Einsatz>)`, Einsatz aus der Zeile des Alias. Keine zweite Liste im Code.
- **Phantom:** `tools/studio/model.py` — Knoten ohne `agent_start` und ohne `spawned`-Bestätigung erzeugen nie den Vorfall „inaktiv“ und werden nach `PHANTOM_AFTER` = 600 s ausgeblendet.
- **Waisen:** `tools/testlock/orphans.ts` (rein, ohne `node:`-Importe) + Aufruf in `testlock.ts` vor der Lastprüfung; nur Hinweis auf stderr.
- **Smoke-Etikett:** `tools/render-qa/saveVersion.mjs` liest `SAVE_VERSION` aus `src/sim/save.ts`.
- **E-049:** `efficiency.py` markiert Instanzen mit `Budget: keins` im Kopfblock; Zeile „Steuerungsanteil bereinigt“ unter der Ampel, ohne Ampel-Präfix (kein Vorfall).

## Datei-Ownership (drei Stränge, je eigener Worktree und Branch)

| Strang  | Branch / Worktree                                | Tasks              | Umsetzer            | Dateien                                                                                                                                                                                                                                                                                                                                                                                              |
| ------- | ------------------------------------------------ | ------------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `py`    | `tool/buendel-py`, `.worktrees/buendel-py`       | T01, T03, T05, T06 | `tech-sim-engineer` | T01: `tools/studio/precommit.py` (neu), `tools/studio/tests/test_precommit.py` (neu), `tools/githooks/pre-commit` (neu), `Makefile`. T03: `tools/studio/model.py`, `tools/studio/tests/test_model.py`. T05: `tools/studio/efficiency.py`, `tools/studio/tests/test_efficiency.py`. T06 (D1, E-017): `docs/adr/ADR-014-studio-riegel.md` (neu), `docs/arc42.md`, `README.md`, `docs/beobachtungen.md` |
| `guard` | `tool/buendel-guard`, `.worktrees/buendel-guard` | T02                | `tech-sim-engineer` | `tools/studio/modelguard.py` (neu), `tools/studio/tests/test_modelguard.py` (neu), `.claude/settings.json` (nur neuer Eintrag)                                                                                                                                                                                                                                                                       |
| `ts`    | `tool/buendel-ts`, `.worktrees/buendel-ts`       | T04                | `tech-ui-engineer`  | `tools/testlock/orphans.ts` (neu), `tools/testlock/testlock.ts`, `tests/tools/testlock.test.ts`, `tools/render-qa/saveVersion.mjs` (neu), `tools/render-qa/smoke.mjs`, `tests/tools/renderqa.test.ts`                                                                                                                                                                                                |

**Dateimatrix / Parallelität:** Die drei Stränge berühren keine gemeinsame Datei → T01 ‖ T02 ‖ T04 parallel (Welle 1). T03 + T05 (gebündelt, R233 V1) und danach T06 (erst nach Merge REL-14 auf `main`, R428) laufen seriell im Worktree `py` (nie zwei Umsetzer im selben Baum). Gesperrt für alle: `tools/studio/guard.py`, `docs/studio/VERFASSUNG.md`, `docs/studio/STUDIO.md`, `docs/studio/templates/`, `.claude/agents/`, `src/`, `tools/studio/hook.py`, `tools/studio/effort.py`. `make check` je Strang läuft über die Testsperre; Exit 3 = später erneut (nie warten, `waiting` loggen).

## Budgetantrag

Formel: Pakete × 2 + QA-Checks + 1 Final-Review = 5 × 2 + 0 + 1 = **11**; + 30 % = 14,3 → **15 Starts**, Parallelität **3**, nach R428 höchstens 2 Arbeiter zugleich, solange REL-14 läuft. Kein UI → kein `qa-playtester`.

| Start | Rolle                                      | Modell | Zweck                                            |
| ----- | ------------------------------------------ | ------ | ------------------------------------------------ |
| 1–3   | `tech-sim-engineer` ×2, `tech-ui-engineer` | sonnet | T01, T02, T04 parallel (Welle 1)                 |
| 4–6   | `qa-code-reviewer` ×3                      | sonnet | Reviews T01, T02, T04                            |
| 7     | `tech-sim-engineer`                        | sonnet | T03 + T05 gebündelt (eine Instanz, zwei Commits) |
| 8     | `qa-code-reviewer`                         | sonnet | Review T03 + T05                                 |
| 9     | `tech-sim-engineer`                        | sonnet | T06 Doku                                         |
| 10    | `qa-code-reviewer`                         | opus   | T07 Final-Review über drei Branches (inkl. Doku) |
| 11–15 | Puffer                                     | –      | nur nach Meldung an L0 vor dem Überschreiten     |

Fix-Runden per SendMessage zählen nicht. **Controller:** Instanz 1 (`lead-tech`, sonnet) führt T01, T02, T04 (Starts 1–6) und übergibt per Ledger `.superpowers/sdd/tool-buendel/ledger.md` und einem Satz Status; Instanz 2 (`lead-tech`, sonnet) führt T03/T05, T06, T07 (Starts 7–10); R428: 2 Controller-Instanzen. Schätzung ≈ 260 Tools, ≈ 55 min Wandzeit.

## Task-Tabelle

| ID  | Titel                                           | Datei                                                                                                                                         | AK-IDs        | Strang | blocked-by                                                     | Modell |
| --- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------ | -------------------------------------------------------------- | ------ |
| T00 | Worktrees anlegen (Controller)                  | dieser Index                                                                                                                                  | –             | alle   | Push-Gate grün (R421), Gate Plan (R428)                        | sonnet |
| T01 | Prettier-Check beim Commit                      | [T01a-precommit.md](2026-10-09-tool-buendel/T01a-precommit.md) + [T01b-hook-aktivierung.md](2026-10-09-tool-buendel/T01b-hook-aktivierung.md) | AK-TB01–TB06  | py     | T00                                                            | sonnet |
| T02 | Modell-Guard für Persona-Starts                 | [T02a-modellregel.md](2026-10-09-tool-buendel/T02a-modellregel.md) + [T02b-hook-eintrag.md](2026-10-09-tool-buendel/T02b-hook-eintrag.md)     | AK-TB08–TB13  | guard  | T00                                                            | sonnet |
| T03 | Phantom-Vorfall ausblenden                      | [T03-phantom.md](2026-10-09-tool-buendel/T03-phantom.md)                                                                                      | AK-TB14       | py     | T01 (Review OK)                                                | sonnet |
| T04 | Waisen-Hinweis Testsperre, Smoke-Etikett        | [T04-ts-werkzeuge.md](2026-10-09-tool-buendel/T04-ts-werkzeuge.md)                                                                            | AK-TB07, TB15 | ts     | T00                                                            | sonnet |
| T05 | E-049: Steuerungsanteil bereinigt nach „Budget“ | [T05-e049.md](2026-10-09-tool-buendel/T05-e049.md)                                                                                            | AK-TB16       | py     | T01 (Review OK); mit T03 gebündelt                             | sonnet |
| T06 | Doku: ADR-014, arc42, README, Beobachtungen     | [T06-doku.md](2026-10-09-tool-buendel/T06-doku.md)                                                                                            | AK-TB17       | py     | T02, T03, T04, T05 (Review OK); Merge REL-14 auf `main` (R428) | sonnet |
| T07 | Final-Review über drei Branches                 | [T07-final.md](2026-10-09-tool-buendel/T07-final.md)                                                                                          | alle          | –      | T06                                                            | opus   |

**T00 (Controller):** nach Gate Plan und grünem Push-Gate im Hauptcheckout `git worktree add .worktrees/buendel-py -b tool/buendel-py main` (aktueller `main`, R428 B7; vorher `git worktree list`/`git status`, R329), ebenso `buendel-guard`, `buendel-ts`. Kein `src/` → keine R392-Basismessung.

## AK-TB01…17 (Nummern bestätigt in R428)

| AK      | Inhalt                                                                                                                                                                                               |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AK-TB01 | Commit mit unformatierter gestagter Datei: Exit 1, Meldung nennt Datei(en) und `npx prettier --write …`.                                                                                             |
| AK-TB02 | Ablehnung schreibt Event `kind: commit_rejected` (session_id aus `CLAUDE_CODE_SESSION_ID`, Dateien ≤ 20, Worktree) nach `.studio/events.jsonl`.                                                      |
| AK-TB03 | Nur gestagte Pfade (ACMR, `-z`), genau ein Prettier-Aufruf; unbekannte Typen und `.prettierignore` übersprungen; nichts gestagt → kein Aufruf.                                                       |
| AK-TB04 | Fehlt Prettier oder scheitert git: Commit erlaubt, Hinweis auf stderr.                                                                                                                               |
| AK-TB05 | < 3 s bei 30 gestagten Dateien (Median aus 3 Echtläufen im Bericht); deterministisch belegt durch „ein Prozess“ (AK-TB03).                                                                           |
| AK-TB06 | `make hooks` setzt `core.hooksPath=tools/githooks`; `tools/githooks/pre-commit` ist 100755.                                                                                                          |
| AK-TB07 | Smoke-Schritt e heisst „Speichern und Laden (Save v<SAVE_VERSION>)“, gelesen aus `src/sim/save.ts`; Test gegen `SAVE_VERSION`.                                                                       |
| AK-TB08 | Persona-Start mit Modell stärker als Frontmatter ohne passende Kopfzeile → `deny` mit Grund, Syntax und Einsatzliste.                                                                                |
| AK-TB09 | `Modell: <alias> (<Einsatz>)` mit Einsatz aus der Tabellenzeile des Alias → erlaubt; anderer Einsatz oder Alias → `deny`.                                                                            |
| AK-TB10 | Tabelle ist einzige Quelle (Parser auf `STUDIO.md`, Test pinnt Aliase und Einsätze); fehlt die Tabelle → zulassen.                                                                                   |
| AK-TB11 | Keine Prüfung bei Nicht-Persona-Typen, `fork`, `inherit`, gleichem oder schwächerem Modell; `general-purpose` mit `Persona:` gegen deren Frontmatter.                                                |
| AK-TB12 | Jede Beanstandung → Event `kind: model_guard`; Startzustand `MODE = "warn"` → nur Event, kein `deny` (Test mit `deny` gepatcht); unbekannter Alias → zulassen mit Event; auch `tool_name == "Task"`. |
| AK-TB13 | Neuer Hook-Eintrag in `.claude/settings.json`; `guard.py` und bestehende Einträge byte-gleich.                                                                                                       |
| AK-TB14 | Knoten ohne `agent_start` und ohne `spawned`: nie Vorfall „inaktiv“, nach 600 s ausgeblendet; echte Agenten unverändert.                                                                             |
| AK-TB15 | Testsperre meldet Vitest-Prozesse mit PPID 1 und ≥ 30 min auf stderr, beendet nichts, Exit-Codes unverändert.                                                                                        |
| AK-TB16 | Zeile „Steuerungsanteil bereinigt“: Lead-Instanzen mit `Budget: keins` im Kopfblock herausgerechnet; roh = bereinigt + herausgerechnet; kein Ampel-Vorfall.                                          |
| AK-TB17 | ADR-014, arc42, README (`make hooks`), Beobachtungen erledigt.                                                                                                                                       |

## Entschieden in R428 (Gate Plan, hier zur Kenntnis)

E1 ja (eigenes Modul). **E2 abweichend: zunächst `warn`**, `deny` + Kopfzeilen-Syntax in `briefing.md`/`STUDIO.md` + `make hooks` im Hauptcheckout im Folgepaket TOOL-AKTIVIERUNG (studio-coach); Rückweg `warn` steht in ADR-014 (T06). E3 → TOOL-AKTIVIERUNG. E4 angenommen. E5 → Session-Retro. Ampelzeile als Nachfolgepunkt in `docs/beobachtungen.md` (T06). Ursprünglicher Text der Entscheide:

- **E1 Ort des Modell-Guards:** eigenes Modul + zusätzlicher Hook (empfohlen) statt `guard.py` (verfassungsgeschützt; Änderung nur per Warteschlange und `VERFASSUNG ÄNDERN` in der Hauptsession, Arbeiter können die Datei gar nicht schreiben). Handbuch-Regeln gehören in ein Handbuch-Werkzeug.
- **E2 blockt oder warnt:** (Vorschlag, in R428 durch `warn` als Start ersetzt) blockt (`MODE = "deny"`). Die Regel stand schon im Handbuch und wurde 10 von 13 Mal verfehlt; eine Warnung erreicht nur das Dashboard, ein `deny` erreicht den Aufrufer sofort mit der Korrektur (≈ 1 Werkzeugaufruf Mehrkosten). Rückweg: eine Konstante.
- **E3 Aktivierung:** Nach dem Merge braucht es vor dem ersten Start auf `opus` die neue Kopfzeilen-Syntax in `templates/briefing.md` und `STUDIO.md` (studio-coach, Handbuch-Minor) und einmal `make hooks` im Hauptcheckout; ebenso fällt die Übergangszeile „`make docs-check` vor Doku-Commits“ weg.
- **E5 Grenze der Zuordnung (zur Kenntnis):** Personas mit Frontmatter `opus` (u. a. `studio-coach`, `lead-art`, `studio-process-coach`) laufen ohne `model` weiter auf `opus`, auch bei einem `sonnet`-Einsatz (Kurz-Retro). Das betraf in fb37ceac 1 von 10 Fällen. Empfehlung: Frontmatter `studio-coach` auf `sonnet` (Persona-Änderung durch den Coach), dann braucht die Meilenstein-Retro die Kopfzeile `Modell: opus (Meilenstein-Retro)`.
- **E4 E-049-Grenze:** Plan-Briefings mit `Budget: 1 Start (lead-tech, …)` zählen weiter als Steuerung. Empfehlung: L0 schreibt für Plan-, Spec- und Gate-Instanzen ohne Arbeiter `Budget: keins`.
