# Werkzeug-Bündel 4 (TOOL-BUENDEL-4) Implementation Plan — Index

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard-Server ohne Dauerlast und mit ehrlichem `make studio`, `zeitreserve-push` ohne Lastabbruch, `make check` mit `loadStart`, Budget-Zuordnung für Kopfzeilen mit Zusatz und die trivialen Restpunkte R457 und render-qa.

**Architecture:** siehe «Architektur». **Tech Stack:** Python 3 (Standardbibliothek, unittest, Ruff über `uvx`), Bash (`start.sh`), TypeScript/ESM (`tools/zeitreserve`, Vitest), Node-ESM (`tools/render-qa`). Keine neue Abhängigkeit.

**Spec:** keine Spec-Datei (Werkzeug-Paket). Grundlage: R464, Retro `docs/studio/retros/2026-10-10-release-rel16-17-prozess.md` (V2, V3, B5), `docs/beobachtungen.md` (Abschnitte «Dashboard-Server läuft dauerhaft auf 100 % CPU», «Budget-Zuordnung: Paket-Kopfzeile mit Zusatz», «TOOL-BUENDEL-3 (R457): Restpunkte», «REL-16 (R454): render-qa-Werkzeug»).

Prozessstufe voll (Format) · Paket TOOL-BUENDEL-4 · Meilenstein TOOL · Planbasis `main` @ `c5cc51c3` · Format E-010: dieser Index plus je Task eine Datei ≤ 10 KB im Ordner [`2026-10-10-tool-buendel-4/`](2026-10-10-tool-buendel-4/). Arbeiter und Task-Reviewer lesen nur ihre Task-Datei(en) und die genannten AK-IDs. Plan geschrieben von `lead-tech` auf sonnet (E-054, zweiter Fall).

## Global Constraints

- Keine neue Abhängigkeit (ADR-001, `dep-guard` nie umgehen).
- `tools/studio/guard.py`, `docs/studio/VERFASSUNG.md`, `docs/studio/STUDIO.md`, `docs/studio/templates/`, `.claude/`, `src/` bleiben **unverändert**. Handbuch-Zeilen zu `zeitreserve-push` führt in T08 `studio-coach` nach (R465 B2), nicht der Umsetzer.
- Messwerkzeuge werfen nie; Hooks lassen im Zweifel zu.
- Vor jedem Commit an `tools/studio`: `make studio-lint` Exit 0 (ganzer Ordner); danach `make studio-test`. TS/MD/JSON: `make lint` bzw. `make docs-check` Exit 0.
- Testschalter (`STUDIO_HOME`, `STUDIO_DOCS`, `STUDIO_PORT`) nur in Tests gesetzt, im Code als «nur für Tests» kommentiert (R378).
- Grosse Dateien nur abschnittsweise lesen (`model.py` 1385 Z., `test_model.py` ≈ 2400 Z.; R420 V3).
- Exit-Codes immer `…; echo EXIT=$?`, nie in eine Pipe. Gesamtläufe nur über die Testsperre und nur der Controller (`make test`, `make check`); Umsetzer dürfen gezielt `npx vitest run <Dateien>` fahren (R380, R465 B1), nie ohne Dateiangabe; Exit 3 = später erneut, `waiting` loggen. **Steht ein Push an (R464 V1), startet kein Testlauf.**
- Commit-Präfixe `feat:`, `fix:`, `test:`, `docs:`, `refactor:`; kein Rebase, kein Force-Push; Trailer der Session.

## Review Focus

1. **Server hängt nicht an toten Verbindungen (T01):** Ein Client, der mitten in der Antwort trennt, lässt Server-CPU im Leerlauf < 5 % und den nächsten Request normal antworten. Test: `test_client_abort_keeps_server_responsive`.
2. **`make studio` doppelt (T02):** Zweiter Aufruf bei laufendem Server meldet «läuft bereits», Exit 0, kein `Address already in use`. Test: `test_second_start_reports_running`.
3. **Kopfzeile mit Zusatz (T04):** `M13-E1 — UI-Strang, Tasks T09–T12`, `M13-E1: …` und `M13-E1` treffen dieselbe Phase; `M13-E1-b` (anderer Name mit gleichem Anfang) trifft sie **nicht**. Test: `test_header_prefix_needs_delimiter`.
4. **Parallele Controller (T04):** Zwei Leads derselben Rolle, beide `Paket: M13-E1 — …`, zählen auf dieselbe Freigabe (R433), Summe 2 von 36, nicht «2 von 1». Test: `test_parallel_controllers_share_grant`.
5. **`make check` ohne `--push` (T03):** gibt `loadStart` immer aus, ändert aber den Exit-Code nicht. Test in `tests/tools/zeitreserve.test.ts`.

## Architektur (≤ 15 Zeilen)

- **Dashboard-Server (T01):** Erst messen, dann beheben: `build_state` läuft bei jedem `/api/state`-Abruf über alle Events und `bundle()` liest alle Docs; mit grossem Ereignislager und offenem Dashboard-Tab ist das Dauerlast. Zusätzlich beenden `BrokenPipeError`/`ConnectionResetError` im Handler die Anfrage still (heute Trace im `server.log`). Behebung nach Befund: Zustand je `(session, heartbeats)` kurz zwischenspeichern, Schlüssel = Grösse und Änderungszeit der Events-Datei plus ≤ 2 s Alter; Fallback-Hypothese «Schleife im Handler» wird im Test ausgeschlossen oder bestätigt.
- **`start.sh` (T02):** Bereitschaft = HTTP-Antwort auf `/` (statische Datei, billig) statt `/api/state` mit 1 s Timeout, Wartezeit bis 15 s; PID tot → sofort Fehler mit Log. Antwortet schon ein Server auf dem Port, meldet das Skript «läuft bereits».
- **`zeitreserve`/`make check` (T03):** `Makefile` Ziel `zeitreserve-push` ohne `$(TESTLOCK)`; `check.ts` druckt immer `zeitreserve: loadStart <x>`, bei > 4 mit Zusatz «für Push nicht belastbar, `make check` ruhig wiederholen».
- **Budget (T04):** `budget_key` vergleicht zusätzlich das Kopfzeilen-Präfix (Zeichen bis Leerzeichen, `—`, `–`, `:`) mit der Phase; Namenstreffer gilt auch dann, wenn ein anderer Lead derselben Rolle die Freigabe beansprucht (`claims`).
- **Kleinkram (T05, T06):** je eine kleine, getestete Änderung; Rest begründet zurückgestellt.

## Datei-Ownership (ein Strang `tool`, ein Worktree)

Branch `tool/b4`, Worktree `.worktrees/b4`. Zwei Umsetzer **nacheinander** (nie zwei gleichzeitig im Baum): A (`tech-sim-engineer`, Python/Bash) dann B (`tech-ui-engineer`, TS/Node/Doku). Fix-Runden per SendMessage.

| Umsetzer | Tasks    | Dateien                                                                                                                                                                              |
| -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A        | T01, T02 | `tools/studio/server.py`, `tools/studio/start.sh`, Tests `tools/studio/tests/test_server.py`, neu `test_start.py`                                                                    |
| A        | T04      | `tools/studio/model.py` (nur `budget_key`), Test `test_model.py` (Klasse am Dateiende)                                                                                               |
| A        | T05      | `tools/studio/hook.py`, `testrun.py`, `budgetwarn.py`, `modelguard.py`, `clock.py` (nur Kommentar), Tests `test_hook.py`, `test_testrun.py`, `test_budgetwarn.py`, `test_metrics.py` |
| Coach    | T08      | `docs/studio/STUDIO.md` (nur Zeilen zu `zeitreserve-push`, ≈ Z. 367 und 427–430), `docs/studio/CHANGELOG.md` (Handbuch-Minor 1.44)                                                   |
| B        | T03      | `Makefile` (nur Ziel `zeitreserve-push`), `tools/zeitreserve/check.ts`, `tests/tools/zeitreserve.test.ts`                                                                            |
| B        | T06      | `tools/render-qa/sitzung.mjs` (+ ein Test, falls `tools/render-qa` schon Tests hat, sonst reiner Helfer mit Vitest-Test unter `tests/tools/`)                                        |
| B        | T07      | `docs/adr/ADR-014*.md` («Konsequenzen»), `docs/beobachtungen.md` (erledigte Abschnitte entfernen, Rest aktualisieren), `docs/studio/rulings.md` (Ledger-Übernahme)                   |

**Berührung mit M13-E1** (Worktree `.worktrees/m13-e1-*`, ändert `src/`, `tests/`, `docs/`): erwartet **keine**. Gemeinsame Pfade nur `tests/` (hier `tests/tools/`, dort `tests/sim|ui|render`) und `docs/` (hier ADR-014, `beobachtungen.md`, `rulings.md`; dort Plan/Spec/arc42). Konfliktgefahr einzig `docs/beobachtungen.md` und `rulings.md` (Anhänge am Dateiende): T07 läuft zuletzt, vor dem Merge `main` einmal einlesen. Kein `Makefile`-Konflikt erwartet (M13-E1 ändert keine Ziele).

## Budgetantrag (Formel Handbuch 1.39, `docs/studio/templates/budgetantrag.md`)

```text
Lead: lead-tech
Phase: TOOL-BUENDEL-4-umsetzung
Pakete:
- TOOL-BUENDEL-4-A Python/Bash: T01, T02, T04, T05 (nein)
- TOOL-BUENDEL-4-B TS/Node/Doku: T03, T06, T07 (nein)
Formel: 2 × 2 + 0 QA-Checks + 1 Final-Review = 5 → × 1,3 = 6,5 → aufgerundet 7, dazu 1 Start `studio-coach` (T08, R465) = 8
Parallelität: 1 (ein Worktree, gleiche Dateien im Baum nacheinander)
Bisher frei/verbraucht: Plan-Phase getrennt (lead-tech 1, Phase TOOL-BUENDEL-4)
Begründung Mehrbedarf: — (Reviews: A zwei Gruppen, B eine, siehe Tabelle; 8 = 6 Starts + T08-Coach + 1 Puffer)
Beantragt: 8 Starts, Parallelität 1
```

| Start | Rolle               | Modell | Zweck                                                 | Tools (Schätzung) |
| ----- | ------------------- | ------ | ----------------------------------------------------- | ----------------- |
| 1     | `tech-sim-engineer` | sonnet | T01, T02 (V3), dann T04, T05; je Task ein Commit      | 75                |
| 2     | `qa-code-reviewer`  | sonnet | Review T01+T02                                        | 12                |
| 3     | `qa-code-reviewer`  | sonnet | Review T04+T05                                        | 12                |
| 4     | `tech-ui-engineer`  | sonnet | T03, T06, T07                                         | 40                |
| 5     | `qa-code-reviewer`  | sonnet | Review T03+T06+T07                                    | 12                |
| 6     | `qa-code-reviewer`  | opus   | Final-Review über `tool/b4`                           | 40                |
| 7     | `studio-coach`      | sonnet | T08 STUDIO.md-Zeilen zu `zeitreserve-push` (nach T03) | 12                |
| 8     | Puffer              | –      | nur nach Meldung an L0 vor dem Überschreiten          | –                 |

**Controller:** ein `lead-tech` (sonnet), höchstens 4 Tasks je Instanz (R167): Instanz 1 steuert Start 1–3 (T01–T05, 4 Tasks), Instanz 2 Start 4–6 (T03, T06, T07), Übergabe per Ledger `.superpowers/sdd/tool-buendel-4/ledger.md`. Kein UI → kein `qa-playtester`.

**Schätzung gesamt:** Arbeiter ≈ 191 Tools + 2 Controller ≈ 60 Tools = **≈ 250 Tools**; Minuten = Tools ÷ 4 (`richtwerte.md` Z. 18) ≈ **62 min**. Wandzeit seriell (A 19 min → Reviews 6 → B 10 → Review 3 → Final 10 + Übergaben) ≈ **55–65 min**. Läuft kein Push, kann Start 4 parallel zu Start 2/3 in einem zweiten Worktree laufen (T03/T06/T07 teilen keine Datei mit A) und spart ≈ 15 min; Empfehlung: nur bei Bedarf.

## Task-Tabelle

| ID  | Titel                                                              | Datei                                                                | AK-IDs                | Strang | blocked-by | Modell |
| --- | ------------------------------------------------------------------ | -------------------------------------------------------------------- | --------------------- | ------ | ---------- | ------ |
| T01 | Dashboard-Server: Dauerlast messen und beheben                     | [T01-server-cpu.md](2026-10-10-tool-buendel-4/T01-server-cpu.md)     | AK-TB4-01, AK-TB4-02  | tool   | –          | sonnet |
| T02 | `make studio`: Bereitschaftsprüfung, zweiter Aufruf                | [T02-studio-start.md](2026-10-10-tool-buendel-4/T02-studio-start.md) | AK-TB4-03, AK-TB4-04  | tool   | T01        | sonnet |
| T03 | `zeitreserve-push` ohne Testsperre, `loadStart` in `check`         | [T03-zeitreserve.md](2026-10-10-tool-buendel-4/T03-zeitreserve.md)   | AK-TB4-05, AK-TB4-06  | tool   | –          | sonnet |
| T04 | `budget_key`: Kopfzeilen-Präfix, parallele Controller              | [T04-budget-key.md](2026-10-10-tool-buendel-4/T04-budget-key.md)     | AK-TB4-07, AK-TB4-08  | tool   | T02        | sonnet |
| T05 | Restpunkte R457 (1)(2)(3)(4)(6)(7)                                 | [T05-restpunkte.md](2026-10-10-tool-buendel-4/T05-restpunkte.md)     | AK-TB4-09 … AK-TB4-12 | tool   | T04        | sonnet |
| T06 | render-qa: Audio-Warnung filtern, Kamera-Ruhe abwarten             | [T06-render-qa.md](2026-10-10-tool-buendel-4/T06-render-qa.md)       | AK-TB4-13, AK-TB4-14  | tool   | T05        | sonnet |
| T07 | Doku: ADR-014, Beobachtungen, Rulings                              | [T07-doku.md](2026-10-10-tool-buendel-4/T07-doku.md)                 | AK-TB4-15             | tool   | T03, T06   | sonnet |
| T08 | STUDIO.md-Zeilen zu `zeitreserve-push` nachführen (`studio-coach`) | [T08-handbuch.md](2026-10-10-tool-buendel-4/T08-handbuch.md)         | AK-TB4-16             | tool   | T03        | sonnet |

`blocked-by` T02/T04/T05 sind Reihenfolge im selben Baum (Umsetzer A), keine fachliche Abhängigkeit; T03 darf vor T01 laufen, wenn Umsetzer B zuerst startet.

## AK-IDs

- **AK-TB4-01** Server-CPU im Leerlauf mit offenem Tab < 5 % (Messung im Task-Bericht, `ps -o %cpu`). **-02** Abgebrochene Verbindung (`BrokenPipeError`, `ConnectionResetError`) schreibt keinen Trace und blockiert nichts.
- **AK-TB4-03** `start.sh` meldet Erfolg, sobald der Server antwortet (Wartezeit bis 15 s); Fehlstart nur bei totem Prozess oder Zeitablauf. **-04** Zweiter Aufruf: «läuft bereits», Exit 0.
- **AK-TB4-05** `zeitreserve-push` ohne `$(TESTLOCK)`; Exit 2 nur durch `measurementProblem`. **-06** `make check` gibt `zeitreserve: loadStart <x>` aus (Zusatz bei > 4).
- **AK-TB4-07** Kopfzeile `Paket: <Phase> — …` trifft die Phase. **-08** Parallele Controller derselben Freigabe zählen gemeinsam.
- **AK-TB4-09** R457 (1) kein `time.gmtime()` in `hook.py` an der Uhr vorbei. **-10** (2) `TickingClock` ersetzt, (3) `testrun.py` ohne Traceback bei Ctrl-C, Exit `128+N`. **-11** (4) `budgetwarn` ohne private Importe, (6) ADR-014 aktuell. **-12** (7) `clock.py`-Länge als Befund geschlossen.
- **AK-TB4-13** render-qa filtert «AudioContext was not allowed to start». **-14** `tileCenter` erst nach ruhiger Kamera gelesen.
- **AK-TB4-15** Beobachtungen und Rulings nachgeführt, `make docs-check` Exit 0. **-16** `STUDIO.md` nennt `zeitreserve-push` nicht mehr «mit Sperre». T03 ergänzt: halb geschriebene oder fehlende Messdatei → Exit ≠ 0, nie OK.

## Zurückgestellt (begründet)

- **R457 (5) Flake-Matching** (ungetrackte Dateien, leere `names` bei Sammelfehlern): berührt die Zuordnungslogik in `testrun.py`/Metrik, braucht ein eigenes Datenmodell für «Sammelfehler», nicht trivial → bleibt in `beobachtungen.md`, Kandidat für ein späteres Bündel.
- **render-qa**: nur (1) und (2); keine weiteren Funktionen.
