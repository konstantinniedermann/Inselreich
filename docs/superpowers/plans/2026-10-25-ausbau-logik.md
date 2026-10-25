# Plan AUSBAU-LOGIK · Ausbau-Bedingungen der Produktionsbetriebe (Stufe voll)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (Controller `lead-tech` auf `sonnet`, höchstens 4 Tasks je Instanz, R167/R190). Schritte mit `- [ ]`. Arbeiter bekommen nur ihre Task-Datei, die AK-IDs und die Prüfpflichten unten (wörtlich).

Owner `lead-tech` · Meilenstein M14 · **Spec:** `docs/superpowers/specs/2026-10-25-ausbau-logik-design.md` mit Anhang 01 (Typtabellen) und **Anhang 02 (geht der Spec vor)**, Rechnung `…-ausbau-logik-rechnung.md` (`design/ausbau-logik` @ `3856e396`, in diesen Plan-Branch gemergt). Gate Spec BEDENKEN (`.studio/handoffs/2026-10-25-lead-qa-gate-spec-ausbau-logik.md`), Gegenlesen mit 4 Plan-Notizen (`…-lead-qa-gegenlesen-ausbau-logik.md`). Rulings R896, R908, R909, R914, R918, R920, R924. Task-Dateien in [`2026-10-25-ausbau-logik/`](2026-10-25-ausbau-logik/).

**Ziel:** Ein Betrieb steigt nur auf, wenn Wissen, Baustoff, Fachkräfte in der Nähe und ein passender Standort da sind; fehlt eine Dauerbedingung, läuft er sichtbar «wie Stufe k» mit Grund. Neue Stufe 4, «Gleiches bauen» mit Stufe, Merkmal je Stufe.

**Spielerwirkung (R896 (0)):** Die Ausbau-Karte ist eine Checkliste mit nachzählbaren Zahlen; Knopf-Tooltip, Zustandschip und `upgradeBuilding` nennen denselben ersten Grund.

## Architektur (≤ 15 Zeilen)

- Werte nur in `src/sim/defs/levels.ts`: `LevelDef { cycle, upkeep, cost, extra?, workforceTier, site? }`, `LevelSite`, `WORKFORCE_RADIUS`, `LEVEL_RECHECK_TICKS`; `THROTTLED_UPKEEP_PCT` in `defs/buildings.ts`.
- **Blattmodul `src/sim/levelRules.ts`** (laufende Stufe): `workforceOk`, `siteOk`, `runningLevel(world, b)`. Importiert nur `./defs/*`, `./types`, `./world`, `./coverage`, `./council`, `./terrainCount`, `./fireCover` (Strukturtest), weil `levels.ts` es liest und `crises`, `unlocks`, `economy`, `placement` `levels` erreichen (Import-Analyse beim Planen).
- `src/sim/terrainCount.ts` (neu): `countTerrain`, `countFreeTerrain` aus `placement.ts` verschoben; `src/sim/fireCover.ts` (neu): `isProtected` aus `crises.ts` verschoben, `crises.ts` re-exportiert.
- **`src/sim/levelChecks.ts`** (neu): `levelChecks(world, b, level): LevelCheck[]` in R7-Ordnung (N3) mit Sperrgrund-Texten (N5), `levelChipText`, `levelChipDetail`; importiert `levelRules`, `unlocks`, `economy`. Eine Textquelle für Sim, Karte, Chip, Tooltip.
- **k beim Lesen** (R5 Option «Lesen», N = 1): `cycleOf` liest `LEVELS[defId][k − 2]`; g = 1 liefert k = 1 ohne Suche. Kein Cache, kein Save-Feld; Determinismus folgt aus der Reinheit.
- `buildingUpkeep(world, b)` (neue Signatur): Pause vor Drossel vor u(g) (R6); `upkeepOf(b)` bleibt u(g).
- `upgradeBuilding`: Schritte 1–3 eigen, ab Schritt 4 Text der ersten ✗-Zeile aus `levelChecks`; `placeBuilding(…, level?)` summiert Neubau + Stufen (R8).
- UI rendert nur: `src/ui/levelChecklist.ts` (DOM-frei) für Karte, Tooltip, Chip; `Tool.level` ist UI-Zustand.
- Render: `src/render/levelMarks.ts` + `levelMarksWork.ts` (`drawLevelMark(p, defId, level, anchor)`); `drawLevelTopper` in `sprites.ts` delegiert nur. Liest `b.level` (g), nie k.
- Save: kein neues Feld; `level` 4 und `'U7'` neu gültig; `SAVE_VERSION` = main + 1 beim Merge von Etappe 2, Versionsschritt ohne Inhaltsänderung (P-1).

## Entscheide des Plans (Entwurf für das Gate Plan)

- **P-1 Save Variante A (ladbar):** Der Inhalt ändert sich nicht (k abgeleitet, Stufe 2/3 bleiben gültig). Migrationsschritt `SAVE_VERSION − 1 → SAVE_VERSION` setzt nur `version`. AK-AL-35 erzeugt den Vorgängerstand im Test aus `serialize` mit `version: SAVE_VERSION − 1` (kein eingefrorenes JSON; gleichwertig, weil der Inhalt identisch ist, und robust gegen andere Glieder der Save-Kette). Nummer erst in T18 (Nachzug direkt vor dem Final-Review Etappe 2): main mergen, `SAVE_VERSION` = main + 1, Migration danach benennen (R909).
- **P-2 Etappen und Merges:** Etappe 1 = AL-1, AL-2a, AL-2b, AL-3 (ein Merge: k ohne Checkliste wäre nicht erklärbar, R896 (0)); Etappe 2 = AL-4, AL-5 und Strang R (AL-6a/6b) mit Save-Sprung (ein Merge). Kein Teil-Merge nach main zwischen T01 und T10.
- **P-3 Leistung k (Spec offen 2):** Messung in T04 (Wand an Wand, «Last ≤ 4 nötig»): (a) `balance-upgrade.test.ts`, (b) neue Stress-Szene `tests/sim/levelStress.test.ts` (≈ 60 Betriebe g 3, 300 Gebäude, 1 800 Ticks; nutzt nur API, die auf main existiert, Dauer aus dem JSON-Reporter, keine Uhr im Test). Schwellen: (a) ≤ +10 % Median, (b) ≤ +50 % (R921-Logik). Darüber Rückfall 1: Häuser und Wachen je Insel einmal je Schritt sammeln (Muster `buildCoverage`, lebt nur im Aufruf); Rückfall 2 (Index über Schritte) nur mit ADR und Schatten-Test (Index = frische Rechnung in jedem Tick) als Befund an L0.
- **P-4 `LEVEL_RECHECK_TICKS` = 10** bleibt in den Defs als vertragliche Obergrenze (AK-14/45 lesen sie); die Umsetzung erfüllt sie mit N = 1. Keine tote Konstante: der Strukturtest nennt sie als Vertragswert.
- **P-5 Texte der Sperrgründe in `src/sim/levelChecks.ts`** (wie alle `fail`-Texte der Sim), UI übernimmt sie unverändert; Zahlen darin nur aus Defs und Welt.
- **P-6 AK-AL-49 neu gefasst (R924):** ohne Zukauf-Voraussetzung. Wächter: `M = W(Stufe) − n × W1 > 0` mit `W` aus `GOODS[g].buy` (Formel Rechnung 0/e2), `n = c1/c(Stufe) − c1/c(Vorstufe)`. Stufe 2/3 in T01 (alle Eingänge sind Defs), Stufe 4 in T11. Ändert später ein Paket Kaufpreise, wird der Test rot → Rückfall N6.
- **P-7 AK-AL-24 geteilt:** T03 Zeilen, Reihenfolge, `have`/`need`, `ceil(distance)`; der Vergleich «`ok` ⇔ Ausbau scheitert nicht an diesem Schritt» in T05 (erst dort prüft `upgradeBuilding` Fachkräfte und Standort).
- **P-8 Teil 4** (AK-04, 07, 08, 09, 10, 11, 12 und 01) in T11; AK-41/43 Teil 4 in T13 (Gegenlese-Notiz 3); AK-11 ohne Teil 4 in T04 mit Glashütte g 3, k 2.
- **P-9 M-15 rot zwischen T04 und T06:** Ab T04 wirken Fachkräfte und Fischgrund; `balance-upgrade.test.ts` darf bis T06 rot sein (Ledger mit gemessenem Wert), wird nie abgeschwächt. T06 misst neu und beantragt den Pin per Ruling (E9); Merge-Gate 1 erst grün.
- **P-10 Szenen S1–S4 als Code:** `tests/ui/ausbauScenes.ts` baut die Welten; `tests/ui/ausbauScenes.test.ts` prüft ihre Eigenschaften und schreibt nur mit `AUSBAU_SCENES_OUT=<dir>` je `serialize` als JSON. Browser: per CDP `localStorage.setItem('inselreich.save.v1', json)`, dann «Laden».
- **P-11 Render-Anker (Schnittstelle GEBAEUDE-VARIANZ):** `drawLevelMark` bekommt den Anker als Parameter; AL-6 übergibt den heutigen Ankerpunkt, GV S5/S6 übergibt den Anker `stufe` der Gestalt samt Drehung. «In jeder Drehung» (AK-AL-31) prüft der Browser-Check von GV S5/S6 zusammen mit AK-GV-17.
- **P-12 Mock-Tests getrennt:** `vi.mock` der Defs (AK-AL-46) in `tests/sim/levelDefsMock.test.ts`, damit andere Tests echte Werte sehen.
- **P-14 AK-AL-04 zweiter Satz (Spec-Befund):** «g = 3, k = 2 und Stufe-4-Bedingungen erfüllt → `ok`» ist wegen Monotonie (R4) mit N = 1 nicht herstellbar (erfüllte Zielstufe ⇒ k = g). Geprüft wird die Absicht: Ein gedrosselter Betrieb baut im selben Tick aus, in dem die Ursache wegfällt, und `upgrade.ts` liest `runningLevel` nicht (T05, Teil 4 in T11).
- **P-13 Doku-Tasks** (T10, T17) ohne eigenen Task-Review; sie liegen im Final-Review der Etappe (Präzedenz I-201 T08).

## Errata Spec (im Plan-Branch nachgezogen, R924)

- Spec Z. 405 (E4 «`SAVE_VERSION` 19, v18 ladbar») ersetzt durch «main + 1 beim Merge, Variante A» (P-1).
- AK-AL-49: Voraussetzung «Zukaufpreis auf main» entfällt (R918/R924, P-6); Spec Z. 380/436 und N2 sind insoweit überholt.
- AK-AL-24 gehört zu AL-2a (Gegenlese-Notiz 1), AK-AL-37 Sim-Teil AL-2b, Tooltip-Teil AL-3 (Notiz 2).

## Abhängigkeiten und Merge-Reihenfolge

| Paket                                                                              | Berührung                                                                                              | Regel                                                                                                             |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Save-Kette (SEERECHT, INSELPROBEN, GV S1, FLAECHE FL-3, HAFEN S3/S4, I-210, I-214) | `save.ts`, `SAVE_VERSION`                                                                              | Nummer per Merge-Reihenfolge, je main + 1 (R909); AL nur Etappe 2, Nachzug T18                                    |
| GEBAEUDE-VARIANZ                                                                   | `drawLevelTopper`, Anker                                                                               | Etappe 2 (mit AL-6) vor GV S5/S6; GV S1–S4 unabhängig; AK-31 Drehung in GV S5/S6 (P-11)                           |
| I-210 Bittschrift                                                                  | `cycleOf` (Taktlohn nach `effectiveCycle`), `economy.ts` (`storageCap`, `buildingUpkeep`-Aufruf), Save | AL ändert nur die Eingabe von `effectiveCycle` (Stufenzyklus k); wer zweit merged, löst nach Symbol               |
| I-201 Festanlass (pausiert, R921)                                                  | `cycleOf` (Erntefest auf Ergebnis)                                                                     | Nachzug T19 nach I-201-Merge (AK-AL-11 Erntefest-Teil, AK-02 mit I-201 AK-FE7)                                    |
| FLAECHE                                                                            | `placement.ts` (Zählfunktionen), Weide/Wald-Zahlen                                                     | **Vorbedingung T02 Standortteil Wald/Gras: Entscheid E-P1**; `countFreeTerrain` liegt danach in `terrainCount.ts` |

## Dateimatrix (Ownership)

| Datei                                                                                                                  | T01          | T02 | T03 | T04                 | T05 | T06 | T07 | T08 | T10 | T11 | T12 | T13 | T14                         | T15 | T17 | T20/21 |
| ---------------------------------------------------------------------------------------------------------------------- | ------------ | --- | --- | ------------------- | --- | --- | --- | --- | --- | --- | --- | --- | --------------------------- | --- | --- | ------ |
| `src/sim/defs/levels.ts`                                                                                               | ja           | ja  |     |                     |     |     |     |     |     | ja  |     |     |                             |     |     |        |
| `src/sim/defs/unlocks.ts`, `src/sim/types.ts`                                                                          | ja (Tipps)   |     |     |                     |     |     |     |     |     | ja  |     |     |                             |     |     |        |
| `src/sim/upgrade.ts`                                                                                                   | ja           |     |     |                     | ja  |     |     |     |     | ja  |     |     | ja (`levelCostSum`)         |     |     |        |
| `src/sim/terrainCount.ts`, `fireCover.ts`, `levelRules.ts` (neu), `placement.ts`, `crises.ts`                          |              | ja  |     |                     |     |     |     |     |     |     |     |     | ja (`levelRules` Position)  |     |     |        |
| `src/sim/levelChecks.ts` (neu)                                                                                         |              |     | ja  | ja (Chip-Unterhalt) | ja  |     |     |     |     | ja  |     |     | ja                          |     |     |        |
| `src/sim/levels.ts`, `economy.ts`, `defs/buildings.ts`                                                                 |              |     |     | ja                  |     |     |     |     |     |     |     |     |                             |     |     |        |
| `src/sim/save.ts`                                                                                                      |              |     |     |                     |     |     |     |     |     |     | ja  |     |                             |     |     |        |
| `src/sim/build.ts`                                                                                                     |              |     |     |                     |     |     |     |     |     |     |     |     | ja                          |     |     |        |
| `src/ui/panelView.ts`, `inspect.ts`, `upkeepRank.ts`                                                                   | ja (fee)     |     |     | ja (Signatur)       |     |     | ja  |     |     |     |     | ja  |                             | ja  |     |        |
| `src/ui/levelChecklist.ts` (neu), `src/style.css`                                                                      |              |     |     |                     |     |     | ja  |     |     |     |     | ja  |                             |     |     |        |
| `src/ui/pipette.ts`, `app.ts`, `goal.ts`, `src/render/renderer.ts` (`Tool`)                                            |              |     |     |                     |     |     |     |     |     |     |     |     |                             | ja  |     |        |
| `src/render/levelMarks*.ts` (neu), `sprites.ts` (nur `drawLevelTopper`)                                                |              |     |     |                     |     |     |     |     |     |     |     |     |                             |     |     | ja     |
| `tests/sim/levelRules.test.ts`, `levelChecks.test.ts`, `levelDefsMock.test.ts`, `levelDominance.test.ts` (neu)         | ja           | ja  | ja  | ja                  | ja  |     |     |     |     | ja  |     |     |                             |     |     |        |
| `tests/sim/upgrade.test.ts`, `levels.test.ts`, `defs.test.ts`, `pause.test.ts`, `imports.test.ts`                      | ja           | ja  |     | ja                  | ja  |     |     |     |     | ja  |     |     |                             |     |     |        |
| `tests/sim/levelStress.test.ts` (neu)                                                                                  |              |     |     | ja                  |     |     |     |     |     |     |     |     |                             |     |     |        |
| `tests/sim/balance-upgrade.test.ts`, `balance-ausbau.test.ts` (neu)                                                    | ja (`extra`) |     |     |                     |     | ja  |     |     |     |     |     |     |                             |     |     |        |
| `tests/ui/ausbauScenes*.ts` (neu)                                                                                      |              |     |     |                     |     |     |     | ja  |     |     |     |     | ja (`ids.max`, Galerie `G`) |     |     |        |
| `tests/ui/levelChecklist.test.ts` (neu), `panelView`, `inspect`, `levelReads`, `upkeepRank`, `hints`, `balancePreview` | ja           |     |     | ja                  | ja  |     | ja  |     |     |     |     | ja  |                             |     |     |        |
| `tests/sim/save-ausbau.test.ts` (neu), `unlock-timeline.test.ts`                                                       |              |     |     |                     |     |     |     |     |     | ja  | ja  |     |                             |     |     |        |
| `tests/sim/placeLevel.test.ts` (neu), `tests/ui/pipette.test.ts`                                                       |              |     |     |                     |     |     |     |     |     |     |     |     | ja                          | ja  |     |        |
| `tests/render/levelMarks.test.ts` (neu), `tests/render/ring.test.ts`                                                   | ja (ring)    |     |     |                     |     |     |     |     |     |     |     |     |                             |     |     | ja     |
| `README.md`, `docs/spielwerte.md`, `docs/arc42.md`                                                                     |              |     |     |                     |     |     |     |     | ja  |     |     |     |                             |     | ja  |        |

Nicht angefasst: `tests/sim/balance.test.ts` und Baselines, `docs/studio/` (insbesondere `rulings.md`), Specs (ausser Errata hier). `tests/sim/controller.ts` nur in T06 und nur nach Ruling (Rückfall 32b), Balancing bitgleich.

## Tasks

| Task | Titel                                      | Datei                     | AK-IDs                                        | Strang | blocked-by            | Modell | Tools | Persona                  | Last      |
| ---- | ------------------------------------------ | ------------------------- | --------------------------------------------- | ------ | --------------------- | ------ | ----- | ------------------------ | --------- |
| T00  | Testzeiten auf main, Worktree, Basis       | `T00-vorab.md`            | –                                             | A      | Gate Plan             | sonnet | 15    | `tech-sim-engineer`      | ≤ 4 nötig |
| T01  | AL-1 Defs: `extra`, Kosten 2/3, Dominanz   | `T01-defs.md`             | 01, 02, 05, 32a, 49 (je 2/3)                  | A      | T00                   | sonnet | 55    | `tech-sim-engineer`      |           |
| T02  | AL-2a Blattmodule, `runningLevel`          | `T02-levelrules.md`       | 03, 06, 07, 08, 09, 46 (Radius), 47           | A      | T01, E-P1 (Wald/Gras) | sonnet | 70    | `tech-sim-engineer`      |           |
| T03  | AL-2a `levelChecks`, Chiptexte             | `T03-levelchecks.md`      | 24 (Zeilen)                                   | A      | T02                   | sonnet | 50    | `tech-sim-engineer`      |           |
| T04  | AL-2b k wirkt: Zyklus, Unterhalt, Laufzeit | `T04-k-wirkt.md`          | 10, 11, 12, 13–17, 44, 45, 46 (Unterhalt)     | A      | T03                   | sonnet | 75    | `tech-sim-engineer`      | ≤ 4 nötig |
| T05  | AL-2b Ausbau verlangt Bedingungen          | `T05-ausbau.md`           | 04, 18, 21, 24 (Vergleich), 37 (Sim)          | A      | T04                   | sonnet | 55    | `tech-sim-engineer`      |           |
| T06  | AL-2b Messungen M-15 und Spirale           | `T06-messung.md`          | 32b, 48                                       | B      | T05                   | sonnet | 70    | `tech-sim-engineer`      | ≤ 4 nötig |
| T07  | AL-3 UI Checkliste, Chip, Tooltip          | `T07-ui.md`               | 37 (Tooltip), 38–42, 43 (ohne 4), 29 (Vitest) | C      | T05                   | sonnet | 75    | `tech-ui-engineer`       |           |
| T08  | Szenen S1–S4                               | `T08-szenen.md`           | N7                                            | A      | T05                   | sonnet | 35    | `tech-sim-engineer`      |           |
| T09  | Browser-Check Etappe 1                     | `T09-browser-1.md`        | 29                                            | A      | T06, T07, T08         | sonnet | 40    | `qa-playtester`          |           |
| T10  | Doku Etappe 1                              | `T10-doku-1.md`           | 34                                            | C      | T09                   | sonnet | 20    | `tech-ui-engineer`       |           |
| T11  | AL-4 Stufe 4, U7, Ausbau 3 → 4             | `T11-stufe4.md`           | 01, 04, 07–12 (Teil 4), 19, 20, 49 (4)        | A2     | Merge-Gate 1          | sonnet | 70    | `tech-sim-engineer`      |           |
| T12  | AL-4 Save                                  | `T12-save.md`             | 35, 36                                        | A2     | T11                   | sonnet | 45    | `tech-sim-engineer`      |           |
| T13  | AL-4 UI Teil 4                             | `T13-ui-stufe4.md`        | 41, 43 (Teil 4)                               | C2     | T11                   | sonnet | 35    | `tech-ui-engineer`       |           |
| T14  | AL-5 `placeBuilding` mit Stufe             | `T14-place-level.md`      | 25, 26, 27                                    | A2     | T12                   | sonnet | 50    | `tech-sim-engineer`      |           |
| T15  | AL-5 Werkzeug mit Stufe, Pipette           | `T15-ui-werkzeug.md`      | 28, 30 (Vitest)                               | C2     | T13, T14              | sonnet | 55    | `tech-ui-engineer`       |           |
| T16  | Browser-Check Etappe 2                     | `T16-browser-2.md`        | 30, 43 (4), 41 (4)                            | A2     | T15                   | sonnet | 40    | `qa-playtester`          |           |
| T17  | Doku Etappe 2                              | `T17-doku-2.md`           | 34 (Stufe 4)                                  | C2     | T16                   | sonnet | 20    | `tech-ui-engineer`       |           |
| T18  | Save-Nachzug vor Final-Review 2            | `T18-save-nachzug.md`     | 35, 36                                        | A2     | T17                   | sonnet | 20    | `tech-sim-engineer`      | ≤ 4 nötig |
| T19  | Nachzug I-201 (bedingt)                    | `T19-nachzug-i201.md`     | 02 (FE7), 11 (Erntefest)                      | A/A2   | I-201 auf main        | sonnet | 25    | `tech-sim-engineer`      |           |
| T20  | AL-6a Merkmale Rohstoffbetriebe            | `T20-merkmale-roh.md`     | 31 (Vitest, 7 Typen)                          | R      | T01                   | sonnet | 70    | `art-rendering-engineer` |           |
| T21  | AL-6b Merkmale Werkstätten                 | `T21-merkmale-werk.md`    | 31 (Vitest, 4 Typen)                          | R      | T20                   | sonnet | 50    | `art-rendering-engineer` |           |
| T22  | Browser-Check Merkmale                     | `T22-browser-merkmale.md` | 31 (Browser, ohne Drehung)                    | R      | T21, T14              | sonnet | 35    | `qa-playtester`          |           |

Summe ≈ 1 095 Tools. Je Umsetzungs-Task (T01–T08, T11–T15, T20, T21) ein `qa-code-reviewer` (sonnet, OK/BEDENKEN/ZURÜCK); je Etappe ein **Final-Review `model: opus`** über die ganze Branch (an `lead-qa`), Etappe 2 einschliesslich Strang R und T18; bei ZURÜCK Delta-Review desselben Reviewers per `SendMessage` (R553).

## Stränge und Worktrees

- **A** `.worktrees/ausbau-logik`, `feat/ausbau-logik` von main (T00 merged `plan/ausbau-logik` hinein). **B** `.worktrees/ausbau-mess`, `feat/ausbau-mess` von A @ T05. **C** `.worktrees/ausbau-ui`, `feat/ausbau-ui` von A @ T05. T08 läuft in A parallel zu B und C (Dateien disjunkt). Rückführung B, C → A per Merge vor T09.
- **A2/C2** nach Merge-Gate 1: `.worktrees/ausbau-logik-2` (`feat/ausbau-logik-2` von main) und `.worktrees/ausbau-ui-2` (von A2 @ T11). **R** `.worktrees/ausbau-merkmale`, `feat/ausbau-merkmale` von A @ T01; R → A2 per Merge nach T21, vor T22.
- Kein Rebase, kein `reset --hard`, kein Force-Push; Rückführungen per Merge mit Teilbeleg.

## AK-Zuordnung (46 aktive AK; 22, 23, 33 ersetzt)

| AK             | Task                            | AK         | Task                      | AK             | Task                                    |
| -------------- | ------------------------------- | ---------- | ------------------------- | -------------- | --------------------------------------- |
| 01             | T01 (2/3), T11 (4)              | 17         | T04                       | 35             | T12, T18                                |
| 02             | T01, T19 (FE7)                  | 18         | T05                       | 36             | T12, T18                                |
| 03             | T02 (T11 wiederholt)            | 19         | T11                       | 37             | T05 (Sim), T07 (Tooltip)                |
| 04             | T05, T11 (4)                    | 20         | T11                       | 38, 39, 40, 42 | T07                                     |
| 05             | T01                             | 21         | T05                       | 41, 43         | T07, T13 (4), T16                       |
| 06, 47         | T02                             | 24         | T03, T05 (P-7)            | 44, 45         | T04                                     |
| 07, 08, 09     | T02, T11 (4)                    | 25, 26, 27 | T14                       | 46             | T02 (Radius, Struktur), T04 (Unterhalt) |
| 10, 12         | T04, T11 (4)                    | 28         | T15                       | 48             | T06                                     |
| 11             | T04, T11 (4), T19 (Ernte)       | 29         | T07 (Vitest), T09         | 49             | T01 (2/3), T11 (4)                      |
| 13, 14, 15, 16 | T04                             | 30         | T15 (Vitest), T16         | 32a / 32b      | T01 / T06                               |
| 31             | T20, T21, T22; Drehung GV S5/S6 | 34         | T10 (`rg`), T17 (Stufe 4) | N7-Szenen      | T08                                     |

## Review Focus (Eingaben ohne eigenes AK; Test im genannten Task)

1. Wohnhaus im Arbeitsweg **brennt** zählt; **abgerissen im selben Tick** zählt nicht mehr → T04.
2. Feuerwache **nicht angebunden** schützt nicht und erfüllt die Bedingung nicht (eine Funktion `isProtected`) → T02.
3. Fischer zählt **stillgelegte und brennende** Nachbarhütten; Hütte auf anderer Insel mit gleichen Koordinaten nicht → T02.
4. `levelChecks` an einem Betrieb ohne `LEVELS` oder auf Höchststufe liefert `[]`; Karte zeigt «Höchste Stufe erreicht» → T03/T07.
5. `buildingUpkeep` bei brennendem Betrieb mit k < g: Drossel gilt (Brand ≠ Pause, R6) → T04.

## Budget (Starts-Antrag)

Etappe 1: Umsetzer A1 (T00–T03) 1, A2 (T04, T05, T08) 1, B (T06) 1, C (T07, T10) 1, `qa-playtester` T09 1, Reviews T01–T08 8, Final opus 1 = **14**. Etappe 2: A3 (T11, T12, T14, T18) 1, C2 (T13, T15, T17) 1, `qa-playtester` T16 1, Reviews T11–T15 5, Final opus 1 = **9**. Strang R: Umsetzer (T20, T21) 1, Reviews 2, `qa-playtester` T22 1 = **4**. Nachzug T19: 2. **Summe 29, mit 30 % Puffer 38 Starts.** Parallelität 3 Arbeiter (A2/T08, B, C bzw. R), **höchstens 2 gleichzeitige Testläufe**; Mess-Tasks (T00, T04-Messung, T06, T18) nur bei Last ≤ 4 und freiem Messfenster (`make messfenster`). Controller-Instanzen (L0-Starts, sonnet): ≈ 6 (je ≤ 4 Tasks). Nicht enthalten: Urteil `lead-art` zu den Merkmalen (AK-31 Screenshot), 1 Start aus dem Art-Budget. Fix-Runden und Delta-Reviews per `SendMessage` zählen nicht.

## Prüfpflichten (Umsetzer-Briefing wörtlich)

- **Testsperre (R380):** Tests nur bei 1-min-Load ≤ 4 und ohne fremden `vitest`/`make check`-Lauf, sonst `waiting`. Mess-Tasks: «Last ≤ 4 nötig» (R920 V1), vorher `make messfenster; echo EXIT=$?`.
- **Rot zuerst:** je neuem Test der Lauf vor der Umsetzung mit Exit ≠ 0 (`…; echo EXIT=$?`, nie in eine Pipe), im Ledger. Charakterisierung bestehender Tests (grün vor und nach) als solche benennen.
- **Teilbeleg je Task:** gezielte Tests (Befehl in der Task-Datei), `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`. Nie `make check` je Task.
- **Balancing:** `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` grün in T01, T04, T05 und vor T09/T16, ohne Änderung an Test, Controller oder Baseline (Ausnahme P-9 für `balance-upgrade.test.ts`).
- **Zeiten (R392/R905):** kein bestehender Test neu > 500 ms; Tests schon > 500 ms auf main höchstens +50 % gegen T00.
- **Save:** Tests nur über `SAVE_VERSION`, `SAVE_VERSION − 1`, `SAVE_VERSION + 1`, nie mit Zahlenliteral (R909).
- **Doku-Commits:** `make docs-check; echo EXIT=$?` mit Exit 0 vor jedem Commit unter `docs/` oder `README.md`.
- **Keine Uhr in neuen Tests** (R270); Volltextsuche mit `rg <muster> <pfad>` (R683); Dateien > 30 KB nur abschnittsweise (E-057: `save.ts` 42 KB, `inspect.ts` 45 KB, `sprites.ts` 96 KB, `save.test.ts` 86 KB, `helpers.ts` 29 KB nicht vergrössern).
- **Gezielt stagen**, Präfixe `feat:`/`test:`/`docs:`/`refactor:`; kein Rebase, kein `reset --hard`, kein Force-Push. Melde dein Ergebnis per `SendMessage` an den Controller (agentId im Briefing), nie an main.

## Risiken

- **Abwärtsspirale und Arbeitsweg (N6, R553):** nur analytisch belegt. T06 misst (AK-48, ≥ 2 Seeds); Rückfall nur als Wert in den Defs per Ruling (`THROTTLED_UPKEEP_PCT`, `WORKFORCE_RADIUS` 8 → 10), nie neues Design.
- **M-15 (AK-M11B-01):** Greift «baut Fischer aus» nach Fachkräften/Fischgrund nicht mehr, baut die Variante ein Fachkräfte-Haus dazu oder die Greift-Bedingung ändert sich per Ruling; `balance.test.ts` bleibt bitgleich.
- **Laufzeit k:** heute schon prüft `forestOk` je Tick `tilesInRadius` (Präzedenz); neu ist die Haus-Suche je ausgebautem Betrieb (O(Gebäude)). Messung und Rückfall P-3.
- **Drei Pakete an `cycleOf`** (AL, I-201, I-210): jede Änderung bleibt in einer Zeile (Eingabe bzw. Ergebnis von `effectiveCycle`); Konflikte nach Symbol lösen.

## Entscheidungsbedarf (Entwürfe an L0, R471)

- **E-P1 Wald- und Weidezahlen gegen FLAECHE (Vorbedingung T02, nur Typen Holzfäller, Jagd, Schäferei, Rohr, Rind):** FLAECHE (R926) misst exklusive Fläche mit `need` konstant über Stufen; AUSBAU zählt nicht-exklusiv freie Kacheln mit steigender Mindestzahl. Beides zugleich zeigt dem Spieler zwei Zahlen für dieselbe Weide (R896 (0)). Empfehlung: AL-2a setzt die Spec-Werte jetzt (Daten in Defs, Tausch kostet Defs plus Testwerte); FL-2 ersetzt die Stufenbedingung dieser fünf Typen durch die Flächenregel («Fläche voll belegt»), Zahlen per Ruling auf Vorschlag `lead-design`. Alternative: `lead-design` stimmt vor T02 ab (1 Start), T02 wartet nur im Wald/Gras-Teil.
- **E-P2** P-1 bis P-13 annehmen; Budget 38 Starts, Parallelität 3, Testläufe ≤ 2.
