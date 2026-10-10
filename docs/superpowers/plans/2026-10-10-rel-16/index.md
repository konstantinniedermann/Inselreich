# REL-16 „Ruhiges Bauschild, sauberer Neustart“ und TOOL-BUENDEL-3 — Implementation Plan (Index)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (UI) Das Bauschild nennt über Wasser, Gebirge und belegten Kacheln den tatsächlichen Grund, und `dispose` meldet die `document`-Listener des Inselmenüs ab. (TOOL) Budget-Warnung beim Lead-Start (E-055), fünf Werkzeug-Kandidaten aus „Ausgewertet 2026-10-10“, dazu R450 V1 (`test_failed`), V2 (gemeinsame Uhr) und V3 (schmale Prüfung je Task).

**Architecture:** siehe Abschnitt «Architektur». **Tech Stack:** TypeScript, Vitest (UI); Python 3 Standardbibliothek, unittest, Ruff über `uvx` (Studio); Node-Skript mit Headless-Chrome (nur Werkzeug). Keine neue Abhängigkeit.

**Grundlage:** R444 (Auswahl), R443 V1 / `docs/studio/experimente.md` E-055, R450 (Retro `docs/studio/retros/2026-10-10-release-rel15-prozess.md` V1–V3), `docs/beobachtungen.md` „Ausgewertet 2026-10-10“ (Paket-Kandidaten). Keine Spec-Datei: UI-REL16 Stufe leicht ohne Kurzdesign (Wortlaut Entscheid E1), TOOL-BUENDEL-3 Werkzeug-Paket.

Planbasis `main` @ `9a3483a1` (enthält Merge HOTFIX-CI-01 `e158a3a1` und Handbuch 1.42, R450 V4) · Umsetzungsbasis aktueller `main` · Format E-010: dieser Index plus je Task eine Datei ≤ 10 KB. Arbeiter und Task-Reviewer lesen nur ihre Task-Datei und die dort genannten AK-IDs (Tabelle unten).

## Global Constraints

- Keine Laufzeit-Abhängigkeit (ADR-001), `dep-guard` nie umgehen. `src/sim/` und `tests/sim/` bleiben byte-gleich zu `main` (kein Spielwert, keine `SAVE_VERSION`, kein Balancing-Bezug).
- `tools/studio/guard.py`, `docs/studio/VERFASSUNG.md`, `docs/studio/STUDIO.md`, `docs/studio/templates/`, `.claude/`, `docs/ideen.md` bleiben **unverändert**. Hooks werfen nie (Exit 0, Fehler lassen zu).
- **Prüfregel V3 (R450) für alle TOOL-Tasks (T05–T11):** je Task nur `make studio-test`, `make studio-lint`, `npx tsc --noEmit`, `make lint`, bei TS-/MJS-Werkzeugen `npx vitest run tests/tools`, plus die in der Task genannte Einzelprobe. Voller `make check` **einmal** am Strang-Ende (T10, Controller), dann beim Merge und im Push-Gate (Verfassung §7 unverändert).
- UI-Tasks (T01–T03): gezielte Läufe `npx vitest run <Dateien>`, `npx tsc --noEmit`, `make lint`; `make check` einmal am Strang-Ende durch den Controller (Testsperre, Exit 3 = später erneut, `waiting` loggen).
- Last: vor jedem vollen Lauf `uptime`; Einzelproben sparsam (L0-Hinweis R450). Studioweit höchstens 1 Browser-Lauf zugleich in diesem Plan.
- Code mit Edit/Write, nicht per sed/perl; Exit-Codes `…; echo EXIT=$?`, nie in eine Pipe; Commit-Präfixe `feat:`/`fix:`/`test:`/`refactor:`/`docs:`; vor Doku-Commits `make docs-check` Exit 0; kein Rebase, kein Force-Push, `main` per Merge holen.
- `.worktrees/integrate` nicht anfassen. Grosse Dateien abschnittsweise lesen (`efficiency.py` 1014 Z., `model.py` 1385 Z., `app.ts` 1323 Z.).

## Architektur (≤ 15 Zeilen)

1. **Bauschild (T01):** Die Sim bleibt unverändert (`checkGround` liefert schon `Kein Bauland` vor `Bereits bebaut`). `ReasonCtx` in `src/ui/hints.ts` bekommt `at?: { x, y, w, h }`; die Zeilen `Kein Bauland` und `Bereits bebaut` der `REASON_TABLE` lesen damit den Grundriss (nur lesen) und nennen Gelände bzw. Belegung. `placementHint` und die Klick-Fehler in `app.ts` (Bauen, Weg) geben `at` mit; ohne `at` bleiben die alten Texte.
2. **Listener (T02):** `hud.ts` exportiert `unbindIslandMenu(header)` (bricht den `AbortController` aus `islandMenuAbort` ab und löscht den Eintrag); `dispose` ruft es vor `hudEl.replaceChildren()`.
3. **Budget-Warnung (T05):** neues reines Modul `tools/studio/budgetwarn.py`, aufgerufen aus `modelguard.main` (gleicher PreToolUse-Hook `Agent|Task`, keine neue Hook-Zeile in `.claude/settings.json`). Liest `budget`-Events der Session per Textvorfilter; Ausgabe `additionalContext` + `systemMessage` + Event `budget_warn`, nie `deny`.
4. **`test_failed` (T08):** `tools/studio/testrun.py -- <Befehl>` umhüllt `make test` und `make studio-test`, reicht Ausgabe und Exit durch und schreibt `test_failed` (Namen, Suite, Commit, Load) bzw. `test_passed`; `metrics.py --efficiency` gibt die Events an eine neue Ampelzeile in `efficiency.py`.
5. **Uhr (T09):** `tools/studio/clock.py` (`now()`, `timestamp()`, `frozen()` nur für Tests) und `clock.py --check` als Warnschritt in `make studio-lint` (Exit bleibt 0).

## Befund Geisterbau auf der NW-Nachbarkachel (Playtest T06 REL-15) — kein eigener Fehler

Probe gegen Seed 7 (Szene `.studio/qa/REL-15/ui/t06.mjs`): Haus (39, 35) liefert `Bereits bebaut` → Schild „Hier steht schon ein Gebäude oder Weg“; die Kachel (38, 35) ist **Gebirge** → `Kein Bauland`. Das Skript hat in Schritt 2.4 die Karte um (+40, +20) px gezogen (Auswahl-Werkzeug schwenkt ab 4 px) und danach mit den alten Pixeln `p0` weitergemessen; der Zeiger lag damit über (38, 35), eine Kachel „links oben“ am Bildschirm. Schild und Geisterbau zeigten also dieselbe, richtige Zielkachel (Bodenkachel unter dem Zeiger, ISO-Spec D-13/D-14). Der Grund wirkte falsch, weil die Gebirgskachel am Bergfuss im Bild wie Wiese aussieht (Beobachtung an `lead-art`, eingetragen mit diesem Plan). Daraus folgt T01: Das Schild nennt das Gelände („Kein Bauland: Gebirge“), statt nur „nur auf Land bauen“.

## Stränge, Worktrees, Datei-Ownership

| Strang | Branch / Worktree                       | Tasks                       | Umsetzer            | Dateien (exklusiv)                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------ | --------------------------------------- | --------------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui`   | `fix/rel-16-ui`, `.worktrees/rel-16-ui` | T01, T02, T03 (seriell)     | `tech-ui-engineer`  | `src/ui/hints.ts`, `src/ui/app.ts`, `src/ui/hud.ts`, `tests/ui/hints.test.ts`, `tests/ui/hud.test.ts`, `README.md`, `docs/beobachtungen.md`, `docs/arc42.md` **nur** Abschnitte Bausteine `src/ui` (Zeilen `hud.ts`, `hints.ts`), „Cursor-Hinweis“ und „Laden und «Neu» … `dispose()`“                                                                                                                                                               |
| `py`   | `tool/b3-py`, `.worktrees/b3-py`        | T05, T06+T07, T08, T09, T10 | `tech-sim-engineer` | `tools/studio/budgetwarn.py` (neu), `modelguard.py`, `efficiency.py`, `metrics.py`, `testrun.py` (neu), `clock.py` (neu), `paths.py`, `log.py`, `actions.py`, `limits.py`, `hook.py`, `server.py`, `tools/studio/tests/` (alle berührten), `Makefile`, `vite.config.ts`, `docs/adr/ADR-014-studio-riegel.md`, `docs/studio/experimente.md` (nur E-055), `docs/arc42.md` **nur** Abschnitt „Studio-Werkzeuge“ (Verteilungssicht, Liste „Entwicklung“) |
| `qa`   | `tool/b3-qa`, `.worktrees/b3-qa`        | T11                         | `tech-ui-engineer`  | `tools/render-qa/seekarte.mjs`, `tools/render-qa/README.md`                                                                                                                                                                                                                                                                                                                                                                                          |

**Geteilte Datei `docs/arc42.md` (Entscheid E4):** abschnittsweise Ownership; die Abschnitte liegen > 80 Zeilen auseinander, Git führt sie konfliktfrei zusammen. Konfliktprobe beim Merge durch den Integrator. **`docs/beobachtungen.md`** gehört nur `ui`; Befunde der TOOL-Stränge stehen im Bericht und im Handoff, L0 trägt sie nach.

**Parallelität:** `ui`, `py` und `qa` teilen keine Datei ausser arc42 (s. o.). Welle 1: T01+T02 (`ui`) ‖ T05 (`py`) ‖ T11 (`qa`). Danach je Strang seriell. T10 holt `tool/b3-qa` per `git merge --no-ff` in `tool/b3-py`, damit der Integrator eine TOOL-Branch merged. Höchstens **3 Arbeiter zugleich** (je Strang einer), dazu die Controller. `Makefile` ändern T07, T08, T09 nacheinander im selben Baum (verschiedene Ziele). **Vermerk (Präzedenz R441 B3):** T10 hat kein eigenes Task-Review; das Final-Review T12 deckt T10 ausdrücklich ab. T03 prüft derselbe Reviewer wie T01+T02 per SendMessage.

## Task-Tabelle

| ID  | Titel                                            | Datei                                        | AK-IDs        | Strang | blocked-by                         | Modell | Grösse      |
| --- | ------------------------------------------------ | -------------------------------------------- | ------------- | ------ | ---------------------------------- | ------ | ----------- |
| T00 | Worktrees anlegen (je Controller)                | dieser Index                                 | –             | alle   | Gate Plan                          | sonnet | –           |
| T01 | Schild nennt Gelände und Belegung                | [T01-schild.md](T01-schild.md)               | AK-R16-01…04  | ui     | T00                                | sonnet | S (≈ 25 T.) |
| T02 | `dispose` meldet Inselmenü-Listener ab           | [T02-dispose.md](T02-dispose.md)             | AK-R16-05, 06 | ui     | T01 (gleicher Umsetzer, `app.ts`)  | sonnet | S (≈ 12 T.) |
| T03 | Doku UI, Beobachtungen, Release-Notiz            | [T03-doku-ui.md](T03-doku-ui.md)             | AK-R16-07     | ui     | T01+T02 (Review OK)                | sonnet | S (≈ 10 T.) |
| T04 | Release-Check Browser (im Release-Lauf)          | [T04-release-check.md](T04-release-check.md) | AK-R16-08…10  | ui     | T03, Kandidat REL-16               | sonnet | S (1 Lauf)  |
| T05 | Budget-Warnung beim Lead-Start (E-055)           | [T05-budget-warn.md](T05-budget-warn.md)     | AK-TB3-01…04  | py     | T00                                | sonnet | S (≈ 30 T.) |
| T06 | `scan` nach `since`, `test_metrics` abgeschottet | [T06-scan-metrics.md](T06-scan-metrics.md)   | AK-TB3-05, 06 | py     | T05 (Review OK), mit T07 gebündelt | sonnet | S (≈ 12 T.) |
| T07 | `ZEITTESTS` in beide Richtungen                  | [T07-zeittests.md](T07-zeittests.md)         | AK-TB3-07, 08 | py     | mit T06 gebündelt                  | sonnet | S (≈ 8 T.)  |
| T08 | `test_failed`-Event und Ampelzeile (R450 V1)     | [T08-test-failed.md](T08-test-failed.md)     | AK-TB3-09…12  | py     | T06+T07 (Review OK)                | sonnet | M (≈ 30 T.) |
| T09 | Gemeinsame Uhr und Lint-Warnung (R450 V2)        | [T09-clock.md](T09-clock.md)                 | AK-TB3-13…15  | py     | T08 (Review OK)                    | sonnet | M (≈ 30 T.) |
| T10 | Doku TOOL, Zusammenführung, `make check`         | [T10-doku-tool.md](T10-doku-tool.md)         | AK-TB3-16     | py     | T09, T11 (Review OK)               | sonnet | S (≈ 15 T.) |
| T11 | `seekarte.mjs`: Rand, Readback, Namensschema     | [T11-seekarte.md](T11-seekarte.md)           | AK-TB3-17…19  | qa     | T00                                | sonnet | S (≈ 20 T.) |
| T12 | Final-Review TOOL-BUENDEL-3                      | [T12-final-tool.md](T12-final-tool.md)       | AK-TB3-01…19  | –      | T10                                | opus   | M (≈ 50 T.) |

**T00:** `git worktree list`, `git status` (R329); UI-Controller `git worktree add .worktrees/rel-16-ui -b fix/rel-16-ui main`, TOOL-Controller `… .worktrees/b3-py -b tool/b3-py main` und `… .worktrees/b3-qa -b tool/b3-qa main`. **Testzeit-Ausgang (R392, E-052) für `ui`**, gemessen bei der Planung (`npx vitest related --run src/ui/hints.ts src/ui/app.ts src/ui/hud.ts`, Load 1,4, 22 Dateien, 365 Tests, 1,76 s): Tests > 200 ms: `tests/ui/time.test.ts` AK-UX-13 832 ms, `tests/render/geisterbauten.test.ts` Kontrolle 298 ms, `tests/ui/cursorHint.test.ts` RF-4 243 ms, `tests/ui/islandTools.test.ts` foreignBuildingHover 237 ms. Abnahme: dieselben Dateien A/B main/Branch nacheinander, kein bestehender Test > 500 ms (ausser time.test.ts: ≤ +50 %).

## AK-Liste (Nummern zur Bestätigung im Gate)

| AK        | Inhalt                                                                                                                                                                                                                              |
| --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AK-R16-01 | Bau- und Weg-Werkzeug: liegt im Grundriss Wasser oder Gebirge, sagt das Schild „Kein Bauland: Wasser“, „Kein Bauland: Gebirge“ bzw. „Kein Bauland: Wasser und Gebirge“.                                                             |
| AK-R16-02 | Bau- und Weg-Werkzeug über belegter Kachel: „Platz belegt: <Gebäudename>“ (z. B. „Platz belegt: Wohnhaus“) bzw. „Platz belegt: Weg“; massgeblich ist die erste belegte Kachel des Grundrisses (Zeile für Zeile, wie `checkGround`). |
| AK-R16-03 | Klick-Fehler beim Bauen und beim einzelnen Weg-Klick zeigen denselben Text wie das Schild an derselben Stelle.                                                                                                                      |
| AK-R16-04 | Ohne Ortsangabe bleiben „Kein Bauland — nur auf Land bauen“ und „Hier steht schon ein Gebäude oder Weg“; AK-UX-03 (Vollständigkeit) grün; `git diff main -- src/sim/ tests/sim/` leer.                                              |
| AK-R16-05 | `unbindIslandMenu(header)` bricht alle Dokument-Listener des Inselmenüs dieser Kopfzeile ab; zweiter Aufruf und Aufruf ohne vorheriges Binden werfen nicht; erneutes Binden danach funktioniert.                                    |
| AK-R16-06 | `dispose` ruft `unbindIslandMenu(hudEl)` vor `hudEl.replaceChildren()` (Quelltext-Test, `app.ts` ist ohne DOM nicht startbar).                                                                                                      |
| AK-R16-07 | README (Cursor-Hinweis) nennt die neuen Texte; arc42 `hints.ts`/`hud.ts`/`dispose` nachgeführt; Release-Notiz-Entwurf im Bericht; neue Befunde in `docs/beobachtungen.md`.                                                          |
| AK-R16-08 | Browser 1280×720 und 1920×1080: Schild über Gebirge, Wasser, Haus und Weg mit den Texten aus AK-R16-01/02; Screenshots `<fall>-<B>x<H>.png`.                                                                                        |
| AK-R16-09 | Browser: Klick an denselben Stellen zeigt denselben Text als Meldung; nichts wird gebaut.                                                                                                                                           |
| AK-R16-10 | Browser: `seekarte.mjs --leck` (zwei Neustarts → ein Listener-Satz), `smoke.mjs --paket REL-16` bestanden, Konsole ohne Fehler aus `src/`.                                                                                          |
| AK-TB3-01 | Lead-Start (`subagent_type` `lead-*` oder `Persona: lead-*`) mit Kopfzeile `Budget: <n>` (n > 0) ohne `budget`-Event derselben Rolle in derselben Session: Warnung an den Aufrufer, Event `budget_warn`, Start läuft.               |
| AK-TB3-02 | Freigabe der Rolle vorhanden, aber keine mit `phase` = Kopfzeile `Paket:`: Warnung „Freigabe für Phase <Paket> fehlt“ (E-013).                                                                                                      |
| AK-TB3-03 | Keine Warnung bei `Budget: keins`/`0`/ohne Budgetzeile, bei Nicht-Leads, `fork` und Folge-Controllern mit vorhandener Freigabe (R433); kaputte Eingabe → Exit 0 ohne Ausgabe.                                                       |
| AK-TB3-04 | Ein `deny` des Modell-Guards hat Vorrang (eine Ausgabe, kein doppeltes JSON); `MODE`, Tabelle und Texte des Modell-Guards unverändert.                                                                                              |
| AK-TB3-05 | `efficiency.scan`: `tool_use` vor `since` und `tool_result` ab `since` → der Lesevorgang zählt; beide vor `since` → nicht.                                                                                                          |
| AK-TB3-06 | `test_default_out_is_worktree` lenkt `paths.repo_root` auf das Testverzeichnis um und belegt, dass nichts im echten Repo gelesen oder geschrieben wird.                                                                             |
| AK-TB3-07 | `ZEITTESTS` ohne `tests/render/seaMap.test.ts`; die Datei läuft im Projekt `parallel`.                                                                                                                                              |
| AK-TB3-08 | `make zeittests` meldet zusätzlich jeden `ZEITTESTS`-Eintrag ohne `performance.now(`/`Date.now(` (Exit 1).                                                                                                                          |
| AK-TB3-09 | `make studio-test` und `make test` schreiben bei Exit ≠ 0 `test_failed` (Suite, Testnamen, Commit, Load, Exit), bei Exit 0 `test_passed`; Exit und Ausgabe unverändert; Testsperre-Abbruch (Exit 3) ist kein `test_failed`.         |
| AK-TB3-10 | `testrun.py` wirft nie und schreibt unter `CI=true` kein Event.                                                                                                                                                                     |
| AK-TB3-11 | `metrics.py --efficiency`: Ampelzeile „Tests rot, beim gleichen Commit später grün (Flake-Verdacht)“ = Anzahl Testnamen; gelb ≥ 1, rot ≥ 3; Namen in einer Detailzeile.                                                             |
| AK-TB3-12 | Ohne Test-Events steht die Zeile auf „nicht gemessen“; bestehende Ampelzeilen, Schwellen und Labels unverändert.                                                                                                                    |
| AK-TB3-13 | `clock.py`: `now()` (UTC, zeitzonenbewusst), `timestamp()`, `frozen(dt)` als Kontextmanager „nur für Tests (R378)“.                                                                                                                 |
| AK-TB3-14 | `make studio-lint` warnt je direktem `datetime.now(`/`time.time(` in `tools/studio/*.py` ausserhalb `clock.py` mit Datei:Zeile; Exit bleibt 0.                                                                                      |
| AK-TB3-15 | Umgestellt mindestens `paths.now_iso`, `metrics.py` (3 Stellen), `log.py` (2); Warnungen vorher 12, nachher im Bericht; `test_metrics` (HOTFIX-Uhr) friert über `clock` ein; Testanzahl `studio-test` nicht kleiner.                |
| AK-TB3-16 | arc42 „Studio-Werkzeuge“ (Budget-Warnung, `test_failed`, Uhr, Modell-Guard „deny“), ADR-014 Nachtrag, E-055 „übernommen als Werkzeug“, Makefile-Hilfetexte.                                                                         |
| AK-TB3-17 | `seekarte.mjs` liest `SEA_MAP_PAD` aus `src/ui/seaMapView.ts` (Rückfall 12 für ältere Stände) statt `12 * d`.                                                                                                                       |
| AK-TB3-18 | Pixelprobe liest aus einer eigenen Kopie mit `willReadFrequently: true`; ein Lauf `--size 1280x720 --dpr 1` zeigt die Readback-Warnung nicht mehr — oder der Bericht belegt, dass sie aus `src/` stammt.                            |
| AK-TB3-19 | `tools/render-qa/README.md` legt das Namensschema `<fall>-<B>x<H>[-dpr<d>].png` für Playtest-Screenshots fest.                                                                                                                      |

## Review Focus

1. Haus- oder Weg-Werkzeug am Bergfuss (Seed 7, Kachel (38, 35)): Schild und Klick-Meldung „Kein Bauland: Gebirge“; über Haus (39, 35) „Platz belegt: Wohnhaus“ (T01, T04).
2. Neustart nach Startfehler: Kein `document`-Listener der alten Kopfzeile bleibt aktiv (T02, Quelltext-Test plus `unbindIslandMenu`-Test).
3. Budget-Warnung: `Budget: keins` und Folge-Controller warnen nie; Ausgabe nie `deny` (T05 Gegenprobe E-055).
4. `testrun.py` verändert weder Exit noch Ausgabe von `make test`/`make studio-test`; CI schreibt nichts (T08).
5. Uhr: `frozen()` wirkt in allen umgestellten Modulen; der HOTFIX-Test bleibt zeitfest (T09).

## Budgetantrag (Formel Handbuch 1.41) — je Paket eine Freigabe

**UI-REL16:** Pakete 2 (T01+T02 gebündelt, T03) × 2 = 4 + QA-Checks 0 + Final-Review 0 = 4; + 30 % = 5,2 → **6 Starts**, Parallelität 1. Browser-Lauf (T04) und `opus`-Review laufen im Ein-Paket-Release in einem `lead-qa`-Start (R444, R429; Entscheid E2), nicht in diesem Budget. Geplant **2**: `tech-ui-engineer` (T01, T02, T03 per SendMessage), `qa-code-reviewer` (T01+T02, T03 per SendMessage).

**TOOL-BUENDEL-3:** Pakete 6 (T05, T06+T07, T08, T09, T10, T11) × 2 = 12 + QA-Checks 0 + Final-Review 1 = 13; + 30 % = 16,9 → **17 Starts**, Parallelität **2** (Strang `py` und `qa`). Geplant **8**: Controller 1 startet `tech-sim-engineer` A (T05, T06+T07 per SendMessage), `qa-code-reviewer` A, `tech-ui-engineer` Q (T11), `qa-code-reviewer` Q (4); Controller 2 (eigene `lead-tech`-Instanz, ohne eigene `budget`-Zeile, R433) startet `tech-sim-engineer` B (T08, T09, T10 per SendMessage), `qa-code-reviewer` B, T12 `qa-code-reviewer` `opus` (3); dazu Controller 2 selbst (1).

| Paket          | Rolle (Starts)                                                 | Modell | Tools (Schätzung)       |
| -------------- | -------------------------------------------------------------- | ------ | ----------------------- |
| UI-REL16       | `tech-ui-engineer` (1), `qa-code-reviewer` (1), Controller     | sonnet | 47 + 20 + 30 = **≈ 97** |
| TOOL-BUENDEL-3 | Umsetzer A (1), Reviewer A (1), Umsetzer Q (1), Reviewer Q (1) | sonnet | 50 + 22 + 20 + 8        |
| TOOL-BUENDEL-3 | Umsetzer B (1), Reviewer B (1), Controller 1 + 2               | sonnet | 75 + 30 + 2 × 35        |
| TOOL-BUENDEL-3 | T12 Final-Review (1)                                           | opus   | 50 → Summe **≈ 325**    |

**Schätzung gesamt:** ≈ 420 Tools ≈ 70 min (Tools ÷ 6, R433); Wandzeit ≈ 45 min (UI ≈ 20 min parallel zu TOOL). Fix-Runden per SendMessage zählen nicht. **Kontrollerregel:** UI-Controller 3 Tasks; TOOL-Controller 1 T05, T06, T07, T11 (4 Tasks, 4 Starts), Übergabe per Ledger `.superpowers/sdd/tool-buendel-3/ledger.md` und einem Satz Status; Controller 2 T08, T09, T10, T12.

## Entscheide fürs Gate

- **E1 Wortlaut Schild (UI):** „Kein Bauland: Wasser|Gebirge|Wasser und Gebirge“ und „Platz belegt: <Name>|Weg“, ohne Ortsangabe die alten Texte. Die Sim bleibt unverändert (die Gründe sind Tabellenschlüssel der `REASON_TABLE`; Detail ist Darstellung). Alternative: eigener Sim-Grund je Gelände (berührt `tests/sim/placement.test.ts`, `kontor2.test.ts`, ≈ +10 Tools). Wortlaut ohne Kurzdesign; `lead-design` kann im Gate übersteuern (nur Strings in `hints.ts`). Empfehlung: annehmen.
- **E2 Ein Browser-Lauf am Kandidaten:** T04 läuft als Release-Check im `lead-qa`-Start des Ein-Paket-Releases (R444) statt als eigener Häppchen-Check; Kandidat = `fix/rel-16-ui` auf `main`, kein zweites Häppchen. Spart 1 Playtester-Start (≈ 45 Tools). Alternative: eigener Check durch den UI-Controller (+1 Start). Empfehlung: annehmen.
- **E3 Budget-Warnung im Modell-Guard-Prozess** statt in `hook.py` (E-055 nennt `hook.py`): `hook.py` läuft bei jedem Werkzeugaufruf (`PreToolUse *`), der Modell-Guard nur bei `Agent|Task`; keine neue Hook-Zeile. Prüfung Rolle **und** Phase (= `Paket:`), weil eine Freigabe unter anderer Phase im Dashboard auf die jüngste Freigabe zählt (E-013). Kanal: `additionalContext` (für den Aufrufer) plus `systemMessage` (für den Nutzer sichtbar), damit die Warnung auch ohne `additionalContext`-Unterstützung bei PreToolUse ankommt. Empfehlung: annehmen.
- **E4 arc42 abschnittsweise** in zwei Strängen (s. Ownership). Alternative: arc42 nur in `py`, UI-Absätze nachträglich (Abhängigkeit über Strang- und Release-Grenze). Empfehlung: abschnittsweise.
- **E5 Ampelzeile Flake-Verdacht** (T08): gelb ≥ 1, rot ≥ 3 Testnamen; über `LIGHT_LABELS` greift die bestehende Vorfallregel (rot in zwei Sessions in Folge). Alternative: Zeile ohne Ampel (nur Info). Empfehlung: mit Ampel.
- **E6 Uhr-Umstellung (T09):** alle 12 Stellen, die ohne Testumbau gehen; `hook.py`/`server.py` nur, wenn ihre Tests nicht umgebaut werden müssen, sonst bleibt die Warnung stehen (R450 „soweit billig“). Empfehlung: annehmen.
- **E7 Namensschema (T11)** im `tools/render-qa/README.md`; die Persona `qa-playtester` ändert `lead-qa` (Vorschlag im Bericht T11), nicht dieses Paket. Empfehlung: annehmen.
- **Release und Push:** REL-16 als Ein-Paket-Release (Gate Merge Release, R444); TOOL-BUENDEL-3 über Gate Merge; beide mit dem Push der nächsten Studio-Session (R335).
