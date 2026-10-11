# M14-E1 · Stränge, Datei-Ownership, Budget

Gehört zum [Index](../2026-10-11-m14-e1-inselcharakter.md).

## Stränge

| Strang | Worktree               | Branch           | Abzweig                                            | Tasks                             | Umsetzer            |
| ------ | ---------------------- | ---------------- | -------------------------------------------------- | --------------------------------- | ------------------- |
| SIM    | `.worktrees/m14-e1`    | `feat/m14-e1`    | Basis nach T00 (`9113e574` oder Release-Stand M13) | T01 → T02 → T03 → T04 → T05 → T07 | `tech-sim-engineer` |
| UI     | `.worktrees/m14-e1-ui` | `feat/m14-e1-ui` | abgenommener T03-Commit (Ledger-Hash)              | T06                               | `tech-ui-engineer`  |

Parallel laufen nur **T04/T05 (SIM)** und **T06 (UI)**: getrennte Dateien (Tabelle unten). Vor T07 merged der
Controller den abgenommenen T06-Hash in `feat/m14-e1` (Merge-Commit, kein Rebase). Nie zwei Umsetzer im selben Baum.

## Datei-Ownership

| Datei                                                                                                                                                                                                             | Task (Eigentümer)                                               | Hinweis                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| `src/sim/defs/sea.ts`                                                                                                                                                                                             | T01, dann T02, T03                                              | seriell im Strang SIM                                 |
| `src/sim/levels.ts`, `src/sim/production.ts`, `src/sim/flow.ts`                                                                                                                                                   | T01                                                             |                                                       |
| `src/sim/islands.ts`                                                                                                                                                                                              | T02, dann T03                                                   |                                                       |
| `src/sim/save.ts`, `src/sim/types.ts`, `src/sim/world.ts`                                                                                                                                                         | T03 (T04 nur bei Befund)                                        |                                                       |
| `src/ui/hover.ts`, `src/ui/panelView.ts`, `src/render/ring.ts`, `src/render/errands.ts`                                                                                                                           | T01 **mechanisch** (Tech-B1), danach T06                        | Ownership-Ausnahme; T06 erst nach T03                 |
| `src/ui/islandCard.ts`, `tests/ui/islandCard.test.ts`                                                                                                                                                             | T01 (Möweninsel, Felsbucht), danach T06 (Weidenau, `traitLine`) | Ownership-Ausnahme, seriell                           |
| `src/ui/inspect.ts`, `src/ui/buildMenu.ts`, `src/ui/seaMapView.ts`, `src/ui/goal.ts`, `src/ui/islandJump.ts`, `src/render/seaMap.ts`                                                                              | T06                                                             |                                                       |
| `tests/ui/islandJump.test.ts`                                                                                                                                                                                     | T03 (Liste, Gruppe C), danach T06                               | seriell (T06 zweigt nach T03 ab)                      |
| `tests/ui/*` übrige, `tests/render/seaMap*.test.ts`                                                                                                                                                               | T06                                                             |                                                       |
| `tests/render/renderer.test.ts`, `tests/render/seaKorridor.test.ts`, `tests/render/limits.test.ts`                                                                                                                | T03 (Pins Gruppe C/D)                                           | T06 fasst sie nicht an                                |
| `tests/sim/islandTraits.test.ts`                                                                                                                                                                                  | T01, T03                                                        |                                                       |
| `tests/sim/islands-seeds-a.test.ts`, `-b.test.ts`, `fixtures/m14e1-ab-hashes.json`                                                                                                                                | T01, T03 (grün halten), T05                                     |                                                       |
| `tests/sim/islands-c.test.ts`                                                                                                                                                                                     | T02, T03                                                        |                                                       |
| `tests/sim/save-v13.test.ts`, `tests/sim/helpers.test.ts`                                                                                                                                                         | T03, T04                                                        |                                                       |
| `tests/sim/helpers.ts`                                                                                                                                                                                            | T03 (T04 nur bei Befund)                                        | Hot Spot: nur `foldBackToV12`, Schlüssellisten, Kette |
| Bestands-Pins Gruppe C (`save*.test.ts`, `islands-gen.test.ts`, `seaGolden.test.ts`, `reserve-bitgleich.test.ts`, `buyPct*.test.ts`, `scenario-saves.test.ts`, `unlocks.test.ts`, `tests/tools/renderqa.test.ts`) | T03                                                             | nur mechanisch nach E5                                |
| `tests/sim/scenarios.ts`, `tests/sim/islandTraits-controller.test.ts`, `fixtures/save-v12-felsbucht.json`                                                                                                         | T05                                                             |                                                       |
| `README.md`, `docs/arc42.md`, Hauptspec-Verweis                                                                                                                                                                   | T07                                                             | D1 ausdrücklich erlaubt (E-017)                       |
| `.studio/qa/m14-e1/`                                                                                                                                                                                              | T08                                                             |                                                       |

## Budgetantrag (Stufe voll, `templates/budgetantrag.md`)

- Pakete: **M14-E1-SIM** (T01–T05, T07) und **M14-E1-UI** (T06). Arbeiter-Starts: 7 Umsetzer-Tasks × 2
  (Umsetzer + `qa-code-reviewer`) = 14; QA-Checks: 1 `qa-playtester` (T08); Final-Review 1 (`qa-code-reviewer` opus,
  über `lead-qa`). Summe 16, + 30 % Puffer = 20,8 → **21 Starts**.
- Fix-Runden, Nachprüfungen und Delta-Review per SendMessage (kein neuer Start). Controller-Instanzen (je ≤ 4 Tasks,
  R167/R190): **2** (A: T00–T03 und T04 bis Übergabe; B: T05–T08), Start durch L0, nicht in den 21 enthalten.
- **Parallelität 2** (T04/T05 ‖ T06), sonst 1.
- **Aufwand (Tools, Schätzung):** T01 50, T02 30, T03 75, T04 35, T05 40, T06 55, T07 20, T08 35; Reviews je ≈ 15
  (7 × 15 = 105), Final 40; Controller ≈ 2 × 60. Summe ≈ 600 Tools (Spec §13 schätzte 180–210 ohne Reviews,
  Controller und die in E5 gefundene Pin-Nachführung).
- Modelle: Umsetzer, Reviewer, Playtester, Controller `sonnet`; Final-Review `opus`.
