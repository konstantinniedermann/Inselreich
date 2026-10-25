# Plan I-215 · Volllast (Stufe voll)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (Controller `lead-tech` auf `sonnet`). Schritte mit `- [ ]`. Arbeiter bekommen nur ihre Task-Datei und die AK-IDs.

Owner `lead-tech` · Meilenstein M14 · **Spec:** `docs/superpowers/specs/2026-10-25-volllast-design.md` (`design/volllast` @ `add15171`, Anhänge 01 Texte, 02 Testaufbau), Rechnung `…-volllast-rechnung.md`. Gate Spec BEDENKEN, Auflagen 1–9 (`.studio/handoffs/2026-10-25-lead-qa-gate-spec-I-215.md`), Rulings R952, R960, R963, R909.

**Ziel:** Ein Knopf «Volllast» am Betrieb: 3:00 Zyklus 75 % und Unterhalt 150 %, danach 2:00 Ruhe ohne Ausstoss mit Unterhalt 50 %; ein Save-Feld `overtimeAt`.

**Spielerwirkung:** Ware vorziehen mit sichtbarem Preis («Volllast 2:13», «Ruht 1:05»), kein Pflichtklick.

## Architektur (≤ 15 Zeilen)

- Werte: `OVERTIME_CYCLE_PCT` 75, `OVERTIME_UPKEEP_PCT` 150 in `defs/buildings.ts`; `OVERTIME_TICKS` 1800, `OVERTIME_REST_TICKS` 1200 in `defs/timing.ts`; Ruhe-Unterhalt = `PAUSED_UPKEEP_PCT`.
- **Blattmodul `src/sim/overtime.ts`** (importiert nur `./defs/*`, `./types`): `overtimeState`, `overtimeCycle`, `overtimeUpkeep`, `clearExpiredOvertime`, `overtimeBlockReason`, `startOvertime`. Kein Import von `levels`, `production`, `economy`.
- Wirkorte je genau einer: `cycleOf` (Volllast **letzter** Schritt vor `return`), `buildingUpkeep(world, b)` (neue Signatur, gleich wie AUSBAU-LOGIK), `advance` (Phase `rest` → `'resting'` nach `paused`, vor `notConnected`), `tickProduction` (Löschen vor `advance`).
- Neuer Zustand `'resting'` in `BuildingState` und `BUILDING_STATES`; Feld `Building.overtimeAt?: number` neben `feastAt`.
- Save: `isValidOvertime(b, tick)` in `isValidV6Fields`; `SAVE_VERSION` = main + 1 (R909), Kettenschritt ohne Datenänderung (R952).
- UI: DOM-freier Helfer `src/ui/overtime.ts` (`overtimeTooltip`, `overtimeLockText`, `overtimeWarnings`, `overtimeStatusSuffix`, `overtimeUpkeepNote`); Knopf in `inspect.ts` neben «Stilllegen», Aktion in `app.ts`.
- Ohne `overtimeAt` bitgleich: Controller drückt nie, `balance.test.ts` unverändert grün, kein Balancing-Ruling.

## Entscheide des Plans (Entwurf für das Gate Plan)

- **P-1 Stränge:** A Sim (T00–T04, T08) in `.worktrees/i215`, Branch `feat/volllast` von `main`; B UI (T05, T07) in `.worktrees/i215-ui`, Branch `feat/volllast-ui` von A @ T02. B läuft parallel zu T03/T04 (Dateien disjunkt, Matrix). Rückführung B → A per Merge nach T05-Review OK, kein Rebase.
- **P-2 Signatur:** `buildingUpkeep(world: World, b: Building): number`, wörtlich wie AUSBAU-LOGIK (Plan AL, Architektur). Spec Offene Punkte 2 damit entschieden; gleiche Zeilen bei beiden Paketen, Konflikt nur im Rumpf (Konflikttabelle T08).
- **P-3 Mechanische Ownership-Ausnahme:** T01 ergänzt `'resting'` in den erschöpfenden `switch` von `src/ui/panelView.ts` und `src/ui/texts.ts` (Platzhalter «Ruht»), T02 zieht alle Aufrufer von `buildingUpkeep` mit (`economy.ts`, `ui/inspect.ts`, `ui/upkeepRank.ts`, `ui/panelView.ts`, `tests/sim/pause.test.ts`, `tests/ui/upkeepRank.test.ts`, `tests/ui/panelView.test.ts`). Nur Signatur bzw. Fall, kein Verhalten; B zweigt erst danach ab.
- **P-4 Quellscan zweigeteilt:** AK-VL-21 Sim-Teil in `tests/sim/overtime-source.test.ts` (T01–T03), UI-Teil in `tests/ui/overtime-source.test.ts` (T05). Gleicher Dateiname, zweites Verzeichnis, damit A und B nie dieselbe Datei ändern.
- **P-5 Naht-Ausnahme:** `overtime.ts` prüft «hat Zyklus» als `BUILDING_DEFS[b.defId].cycle !== undefined` (darf `levels` nicht importieren). Dafür kommt `overtime.ts` in die Ausnahmeliste des PLAN-NAHT-Tests (`tests/sim/imports.test.ts`, Zeile 28 ff.), nur für die Existenzprüfung; Review-Fokus 1.
- **P-6 Merge-Stand AK-VL-03 (R963, Gate-Auflage 8):** **Mindest-Merge-Stand I-201 auf main** (abgenommen R950, REL-34). T08 merged main in `feat/volllast`, setzt die Volllast-Zeile hinter alle vorhandenen Faktoren und macht für **jeden auf main vorhandenen** Faktor (Erntefest; Taktlohn I-210; Stufe k und Drossel AUSBAU-LOGIK) einen Kombifall in AK-VL-03 bzw. AK-VL-04 verbindlich. Ist I-201 bei T08 nicht auf main: T08 wartet (`waiting`), kein Gate Merge ohne Erntefest-Fall.
- **P-7 Spätere Pakete:** Merged I-210 oder AUSBAU-LOGIK **nach** Volllast, setzt dieses Paket seinen Faktor **vor** `overtimeCycle` bzw. vor `overtimeUpkeep` und ergänzt den Kombifall (Konflikttabelle T08). Betrifft fremde Pläne → Ruling-Entwurf E-VL-1.
- **P-8 Save-Nummer:** T04 setzt `SAVE_VERSION` = Wert auf main + 1 zum T04-Zeitpunkt, T08 gleicht nach dem Merge von main erneut ab (main + 1, Kettenschritt umbenennen). Kein Literal in Tests. Stand Plan: main 18, REL-33-Kandidat 19.
- **P-9 Rot/Grün der Exaktwerte (R963):** AK-VL-19 (47 Stoff, **59** Geld) und AK-VL-14 (60 bzw. 80, Gegenprobe ungerader Start 59) werden in T03 vor der Umsetzung rot und danach grün gelaufen; beide Läufe mit Ist-Werten ins Ledger. Weicht ein Grün-Wert ab: Stopp, Befund an den Controller → L0, Erwartung nie still anpassen.

## Dateimatrix (Ownership)

| Datei                                                                                                                                      | T01 | T02 | T03 | T04 | T05 | T07 | T08 |
| ------------------------------------------------------------------------------------------------------------------------------------------ | --- | --- | --- | --- | --- | --- | --- |
| `src/sim/defs/buildings.ts`, `src/sim/defs/timing.ts`, `src/sim/types.ts`, `src/sim/overtime.ts` (neu; T03 nur `overtime.ts`, falls nötig) | ja  |     | ja  |     |     |     |     |
| `src/ui/panelView.ts`, `src/ui/texts.ts` (T01/T02 nur mechanisch, P-3)                                                                     | ja  | ja  |     |     | ja  |     | ja  |
| `src/sim/levels.ts`, `src/sim/economy.ts`, `src/ui/upkeepRank.ts`, `src/ui/inspect.ts` (T02 nur Signatur)                                  |     | ja  |     |     | ja¹ |     | ja  |
| `src/sim/production.ts`                                                                                                                    |     |     | ja  |     |     |     | ja  |
| `src/sim/save.ts`, `tests/sim/overtime-save.test.ts` (neu)                                                                                 |     |     |     | ja  |     |     | ja  |
| `tests/sim/overtime.test.ts` (neu), `tests/sim/overtime-source.test.ts` (neu), `tests/sim/imports.test.ts`                                 | ja  | ja  | ja  |     |     |     | ja  |
| `tests/sim/pause.test.ts`, `tests/ui/upkeepRank.test.ts`, `tests/ui/panelView.test.ts` (T02 nur Signatur)                                  |     | ja  |     |     | ja  |     | ja  |
| `src/ui/overtime.ts` (neu), `src/ui/app.ts`, `src/ui/hover.ts`, `src/style.css`                                                            |     |     |     |     | ja  |     |     |
| `tests/ui/overtime.test.ts` (neu), `tests/ui/overtime-source.test.ts` (neu)                                                                |     |     |     |     | ja  |     |     |
| `README.md`, `docs/arc42.md`                                                                                                               |     |     |     |     |     | ja  |     |

¹ `inspect.ts` ist in B nur T05; T08 löst dort nur Merge-Konflikte. Nicht angefasst: `tests/sim/balance.test.ts`, `tests/sim/controller.ts`, `tests/sim/helpers.ts` (29 KB, E-057), `src/render/`, `src/audio/`, `docs/studio/` (insbesondere `rulings.md`), Specs.

## Tasks

| Task | Titel                                          | Datei                | AK-IDs (AK-VL-…)                     | Strang | blocked-by        | Modell | Tools | Persona             |
| ---- | ---------------------------------------------- | -------------------- | ------------------------------------ | ------ | ----------------- | ------ | ----- | ------------------- |
| T00  | Vorab: Worktree, Basis, Zeiten, Drift          | `T00-vorab.md`       | –                                    | A      | Gate Plan         | sonnet | 15    | `tech-sim-engineer` |
| T01  | Defs, Typen, Blattmodul `overtime.ts`, Aktion  | `T01-blatt.md`       | 01, 10, 11, 21 (Blatt)               | A      | T00               | sonnet | 40    | `tech-sim-engineer` |
| T02  | `cycleOf` und `buildingUpkeep(world, b)`       | `T02-levels.md`      | 02, 03 (ohne Kombi), 04, 12, 18, 21  | A      | T01               | sonnet | 50    | `tech-sim-engineer` |
| T03  | Produktion: Ruhe, Löschen, Uhr, Exaktwerte     | `T03-produktion.md`  | 05–09, 13, 14, 19, 21 (`production`) | A      | T02               | sonnet | 55    | `tech-sim-engineer` |
| T04  | Save: Feld, Zustand, Version, Kette            | `T04-save.md`        | 15, 16, 17                           | A      | T03               | sonnet | 40    | `tech-sim-engineer` |
| T05  | UI: Helfer, Knopf, Zustand, Unterhaltszeile    | `T05-ui.md`          | 20, 21 (UI), 22 (Vitest-Teil)        | B      | T02               | sonnet | 65    | `tech-ui-engineer`  |
| T08  | Merge-Stand: main holen, Kombifälle, Save-Nr.  | `T08-merge-stand.md` | 03 (Kombi), 04 (Kombi), 17, 18       | A      | T04, T05 (B in A) | sonnet | 35    | `tech-sim-engineer` |
| T06  | Browser-Check Panel und Spielstand             | `T06-playtest.md`    | 22, 23                               | A      | T08               | sonnet | 35    | `qa-playtester`     |
| T07  | Doku README und arc42 (per `SendMessage` an B) | `T07-doku.md`        | –                                    | A      | T06               | sonnet | 12    | `tech-ui-engineer`  |

Reihenfolge: T00 → T01 → T02 → (T03 → T04 ‖ T05) → B in A mergen → T08 → T06 → T07 → Final-Review. Summe ≈ 347 Tools.

## AK-Zuordnung (23 AK)

| AK                | Beleg                                                                          | Task         |
| ----------------- | ------------------------------------------------------------------------------ | ------------ |
| 01, 10, 11        | `tests/sim/overtime.test.ts`                                                   | T01          |
| 02, 04, 12, 18    | `tests/sim/overtime.test.ts`; 18 zusätzlich `balance.test.ts` unverändert      | T02, T08     |
| 03                | `overtime.test.ts`: Glashütte 10 → **8**, Schäferei 25 → 19; Kombifälle P-6    | T02, T08     |
| 05–09, 13, 14, 19 | `tests/sim/overtime.test.ts` (Exaktwerte P-9)                                  | T03          |
| 15–17             | `tests/sim/overtime-save.test.ts`                                              | T04, T08     |
| 20, 22 (Vitest)   | `tests/ui/overtime.test.ts`                                                    | T05          |
| 21                | `tests/sim/overtime-source.test.ts` (T01–T03), `tests/ui/overtime-source…` T05 | T01–T03, T05 |
| 22, 23            | Browser (`.studio/qa/I-215/`)                                                  | T06          |

## Review Focus (Eingaben ohne eigenes AK; Test im genannten Task)

1. Naht-Ausnahme P-5: `overtime.ts` liest `cycle` nur als Existenzprüfung, nie als Wert → T01.
2. Anfahren, Brandende oder Strassenbau während der Ruhe setzen `ok`/`notConnected` (`pause.ts`, `crises.ts:228`, `roads.ts:70`); der nächste Schritt setzt `'resting'` → T03.
3. Volllast-Start bei `progress` > 0 und ohne Eingang: keine zweite Entnahme, Uhr läuft → T03 (zu AK-VL-09).
4. `startOvertime` mit `id` als Nicht-Ganzzahl (1,5) und `NaN` → «Gebäude nicht gefunden» → T01.
5. Zwei Betriebe einer Insel gleichzeitig in Volllast: Uhren unabhängig → T03.

## Ruling-Zuordnung (Gate-Vorprüfliste Punkt 5)

| Ruling bzw. Entwurf          | Inhalt                                                           | Task              |
| ---------------------------- | ---------------------------------------------------------------- | ----------------- |
| R952 E1                      | Vorgängerstand migriert, nur `version`                           | T04, T08          |
| R960 Auflagen 1–9            | AK-VL-07 (abgelaufen bei `paused`/`burning`), -14, -19, -21, -03 | T01–T03, T08      |
| R963                         | Wertgrenzen als Risiko, 59 und 14 in Rot/Grün, Merge-Stand       | T03, T08, Risiken |
| R909                         | Save-Nummer per Merge-Reihenfolge                                | T04, T08          |
| Entwürfe P-1 bis P-9, E-VL-1 | dieses Dokument                                                  | je Entscheid      |

## Budget (Starts-Antrag, Formel)

Pakete mit eigenem Review T01–T05 = 5 → × 2 = 10 · QA-Checks 1 (T06) · Final-Review 1 → 12; + 30 % = 15,6 → **16 Starts**. Geplant 9: Umsetzer A `tech-sim-engineer` 1 (T00–T04, T08 per `SendMessage`) · Umsetzer B `tech-ui-engineer` 1 (T05, T07) · `qa-code-reviewer` T01–T05 5 · `qa-playtester` T06 1 · Final-Review **`model: opus`** 1. Reserve 7 für frische Delta-Reviews. T07 und T08 prüft das Final-Review mit (kein eigener Task-Review, Begründung: Doku bzw. Merge ohne neue Regel; T08-Kombifälle sind Tests). **Parallelität 2** (A und B), höchstens 2 gleichzeitige Testläufe.

## Controller-Briefing (wörtlich übernehmen)

- **Delta-Review nach ZURÜCK oder BEDENKEN: immer frischer Start (opus), nie Fortsetzung desselben Reviewers (R673, R708).**
- Controller auf `sonnet`, höchstens 4 Tasks je Instanz, Übergabe per Ledger bei 200k Kontext oder nach 6 Starts (R167, R190): Instanz 1 T00–T03 (startet B nach T02-Review OK), Instanz 2 T04, T05, T08, T06, Instanz 3 T07, Final-Review, Abschluss.
- Vor dem Start von B: `.studio/limits.json` (Ampel) und `uptime`; bei gelb oder rot kein Start.
- Arbeiter- und Reviewer-Briefings: nur Task-Datei und AK-IDs; Zeile «Melde dein Ergebnis per SendMessage an ‹agentId des Controllers›, nie an main» (R879).

## Prüfpflichten (Umsetzer-Briefing wörtlich)

- **Testsperre (R380): Last ≤ 4 nötig** (1-min-Load) und kein fremder `vitest`/`make check`-Lauf (`make messfenster`), sonst `waiting`.
- **Rot zuerst:** je neuem Test Lauf vor der Umsetzung mit Exit ≠ 0 (`…; echo EXIT=$?`, nie in eine Pipe), im Ledger.
- **Teilbeleg je Task:** gezielte Tests (Befehl in der Task-Datei), `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`. Nie `make check` je Task.
- **Balancing:** `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` grün in T03 und T08; `git diff main -- tests/sim/balance.test.ts` leer.
- Keine Uhr in neuen Tests; Zahlen aus den Defs oder gegen die Spec-Werte; kein Versionsliteral; Dateien > 30 KB nur abschnittsweise (`save.ts` 41 KB, `inspect.ts` 45 KB); Suche mit `rg <muster> <pfad>`.
- Gezielt stagen, Präfixe `feat:`/`test:`/`docs:`; kein Rebase, kein `reset --hard`, kein Force-Push; main per Merge.
- `make docs-check; echo EXIT=$?` Exit 0 vor jedem Commit unter `docs/` oder `README.md`.

## Zeit-Tests (R392/R905, vorab gemessen)

Siehe [`zeiten.md`](zeiten.md): Messung auf main `1de17074` (Last 3,44 beim Start, 9,71 am Ende: Orientierung), `tests/sim/` und `tests/ui/` 120 Tests > 200 ms, davon 50 > 500 ms mit Zeit in der Tabelle; einziger roter Test AK-E0-15a D1 (bekannt, R954). Regel R905: neu > 500 ms verboten; schon auf main > 500 ms höchstens + 50 %. T08 misst nachher (Last ≤ 4) und trägt die Werte nach.

## Risiken

- **Wertgrenzen (Gate-Auflage 9, R963):** Die vier `OVERTIME_*` beruhen auf Rechnung (34 Kombinationen, R937), nicht auf Messung. Rückfall: Stellhebel Spec Regel 1 (`k` 70–75, `m` 150–175, Paare `OT`/`RT`), Schranke `OVERTIME_UPKEEP_PCT` > 133, Bestätigung im Playtest T06; jede Verstellung per Ruling. AK-VL-01/-04/-12/-19 leiten Erwartungen wo möglich aus den Defs ab, die Spec-Zahlen gelten nur bei unveränderten Defs.
- **Konfliktpunkt `levels.ts` (R960):** `cycleOf` und `buildingUpkeep` ändern auch I-201, I-210, AUSBAU-LOGIK. Konflikttabelle und Wächter in T08; Gate Merge prüft die Reihenfolge der Faktoren (Spec Abschnitt «Schnittstelle `cycleOf`»).
- **Save-Kette:** Merged zwischen T08 und Integration ein weiteres Paket mit Save-Schritt, ist `SAVE_VERSION` erneut abzugleichen (Nachzug T08, ein Arbeiter-Fortsetzen); der Integrator merged nicht über einen Konflikt in `save.ts`.
- **AK-VL-17 b:** Ein Stand `SAVE_VERSION − 2` braucht die Faltung des Vorgängerschritts, falls dieser Daten ändert (Seerecht v18 → v19); T04 nutzt die vorhandene Faltungshilfe, sonst Befund.
- **Testlast:** Rechner oft über Last 4 (Plan-Messung musste warten); Wartezeit in T00/T03/T08 einplanen.
