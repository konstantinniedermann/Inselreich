# Abdeckung AK → Task und Dateimatrix (Seefahrt-Bündel E2+E3+E4)

Zum [Index](index.md). Jede AK aus Anhang 04 (E2, E3, E4, gemeinsam B1–B5), Anhang 05 H (AK-Z3) und die Auflagen
(Anhang 04 letzter Abschnitt, Anhang 05 I/J) haben einen Eigentümer-Task. „+" = weiterer Task prüft mit.

## AK → Task

| AK / Auflage                                                                                       | Task                                           | Datei (Test)                                          |
| -------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------- |
| AK-M12-B1                                                                                          | alle, T14                                      | `git diff main -- tests/sim/balance.test.ts` leer     |
| AK-M12-B2                                                                                          | T01, T14                                       | `balance-crises.test.ts` (`normalized` + v9-Felder)   |
| AK-M12-B3                                                                                          | T05 (vorl.), T14                               | `balance-merchants.test.ts`                           |
| AK-M12-B4                                                                                          | T00 (Pins), T04, T05, T14                      | `seePins.ts`, `orders.test.ts`, `fire.test.ts`        |
| AK-M12-B5                                                                                          | T01, T14                                       | `save.test.ts` (Kette v1 … v8 → v9, v10 unbekannt)    |
| AK-E2-01                                                                                           | T03 (+T13 Browser)                             | `kontor2.test.ts`                                     |
| AK-E2-02                                                                                           | T03 (+T13)                                     | `kontor2.test.ts`                                     |
| AK-E2-03                                                                                           | T03 (Sim), T14 (Save)                          | `kontor2.test.ts`, `save.test.ts`                     |
| AK-E2-04                                                                                           | T04 (+T13)                                     | `trade.test.ts`                                       |
| AK-E2-05                                                                                           | T04 (+T13)                                     | `orders.test.ts`                                      |
| AK-E2-06                                                                                           | T04                                            | `flow.test.ts`                                        |
| AK-E2-07                                                                                           | T04 (Pins T00)                                 | `fire.test.ts`                                        |
| AK-E2-08                                                                                           | T04                                            | `storm.test.ts`, `fire.test.ts`                       |
| AK-E2-09                                                                                           | T02                                            | `unlocks.test.ts`                                     |
| AK-E2-10                                                                                           | T12                                            | `tests/ui/activeIsland.test.ts`                       |
| AK-E2-11                                                                                           | T12 (Browser)                                  | `.studio/qa/M12-SEE/T12/`                             |
| AK-E2-12, AK-E2-13                                                                                 | T03                                            | `kontor2.test.ts`                                     |
| AK-E2-14                                                                                           | T04                                            | `orders.test.ts`                                      |
| AK-E3-01                                                                                           | T01 (Gut), T02 (`spicefarm`), T05 (`TIERS[4]`) | `defs.test.ts`                                        |
| AK-E3-02                                                                                           | T02 (Platz), T05 (Produktion)                  | `placement.test.ts`, `spice.test.ts`                  |
| AK-E3-03                                                                                           | T05                                            | `spice.test.ts`, `taxes.test.ts` (`taxUnits`)         |
| AK-E3-04                                                                                           | T00 (Pins), T05                                | `orders.test.ts`                                      |
| AK-E3-05                                                                                           | T05 (vorl.), T14 (endgültig)                   | `balance-merchants.test.ts` + Pin-Liste Anhang 03 D   |
| AK-E3-06                                                                                           | T01                                            | `save.test.ts`                                        |
| AK-E3-07                                                                                           | T01 (+T13 Browser Lade-Meldung)                | `save.test.ts`                                        |
| AK-E4-01, -02, -07, -16                                                                            | T08                                            | `ships.test.ts`                                       |
| AK-E4-03 … -06, -08, -17 … -19                                                                     | T09                                            | `ships.test.ts` (Testwelt `SEED_D37`, T00)            |
| AK-E4-09                                                                                           | T09, T14 (Gewürz)                              | `tick.test.ts`                                        |
| AK-E4-10                                                                                           | T09                                            | `ships.test.ts`, `ships-rng.test.ts`                  |
| AK-E4-11                                                                                           | T14                                            | `save.test.ts`                                        |
| AK-E4-12, AK-E4-15                                                                                 | T11                                            | `tests/render/shipLane.test.ts`, `renderer.test.ts`   |
| AK-E4-13, AK-E4-14                                                                                 | T15 (Browser; Fixture T14)                     | `.studio/qa/M12-SEE/T15/`                             |
| AK-Z3-01                                                                                           | T02                                            | `defs.test.ts`                                        |
| AK-Z3-02 … -08                                                                                     | T06 (+T14 mit `tickShips`)                     | `goal3.test.ts`                                       |
| AK-Z3-09                                                                                           | T01                                            | `save.test.ts`                                        |
| AK-Z3-10                                                                                           | T06                                            | `queries.test.ts`                                     |
| AK-Z3-11, AK-Z3-12                                                                                 | T07                                            | `tests/ui/goal.test.ts`                               |
| AK-Z3-13                                                                                           | T06 (Teil), T14                                | `balance-merchants.test.ts`, `balance-crises.test.ts` |
| AK-Z3-14                                                                                           | T15 (Browser; Fixture T06)                     | `.studio/qa/M12-SEE/T15/`                             |
| B3 (`k = 0`; Start AK-E4-13; kein `replaceChildren` je Tick)                                       | T09; T14/T15; T15                              | `ships.test.ts`; Browser; Review                      |
| B4 (Migration idempotent, `GOOD_IDS`)                                                              | T01                                            | `save.test.ts`                                        |
| B5 (ADR-005-Nachtrag)                                                                              | T16                                            | `docs/adr/`                                           |
| lead-qa Teil B: Fixture je Version, Kette                                                          | T00, T01                                       | `save.test.ts`                                        |
| lead-qa Teil B: feste Testwelt `d`                                                                 | T00, T09                                       | `seePins.ts` `SEED_D37`                               |
| lead-qa Teil B: AK-E4-11 Round-trip mit Schiffen                                                   | T14                                            | `save.test.ts`                                        |
| lead-qa Teil B: Steuer über `taxUnits`; M8:AK-B1-02/-04 mit `feedSpice`                            | T05                                            | `taxes.test.ts`, `balance-merchants.test.ts`          |
| lead-qa Teil B: Browser Gewürz-Chip, Hilfe C.11                                                    | T12                                            | Browser                                               |
| R230: AK-E2-03 Schiff in Felsbucht; Rezept `save-v8.json`; Übergang ab v7; Lade-Meldung Browser    | T14; T00; T01; T13                             |                                                       |
| Anhang 03 D Pins E3 (M8:AK-S1-01/-05/-07/-08/-10, AK-B2-01, AK-B1-01/-02/-04, AK-BAS-02, AK-E0-18) | T05, T14                                       | Pin-Liste                                             |
| Anhang 03 D Pins E2 (M8:AK-S1-01 U6, M11:AK-U1-08)                                                 | T02, T07                                       | `unlocks.test.ts`, `goal.test.ts`                     |
| Anhang 05 I (AK-S3-03, AK-U1-01, RF-4, AK-M12-B2)                                                  | T06, T07, T07, T01                             |                                                       |
| Anhang 05 J.1 (Controller nicht erweitert)                                                         | T05, T14                                       | Review `merchantsController.ts`                       |
| Anhang 05 J.2 (Neupin auf Integrationsbranch)                                                      | T05, T06, T14                                  | P-8                                                   |
| Anhang 05 J.3 (rein lesend), J.4 (Reihenfolge), J.5 (Szenario, Fixture)                            | T06; T06/T09/T16; T06                          |                                                       |
| Anhang 03 C.11 (Hilfe), C.12 (Beobachtung)                                                         | T12; T16                                       |                                                       |
| E1-Übergabe R-6 (Gebäude in `islandView`), P-3 (Plätze per `canPlace`)                             | T10; T02                                       |                                                       |

## Dateimatrix je Task (Parallelität)

| Datei                                                                    | T00 | T01 | T02 | T03 | T04 | T05 | T06 | T07 | T08 | T09 | T10 | T11 | T12 | T13 | T14 | T15 | T16 |
| ------------------------------------------------------------------------ | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `src/sim/types.ts`, `save.ts`, `defs/goods.ts`                           |     | x   | x   |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| `src/sim/defs/buildings.ts`, `unlocks.ts`, `sea.ts`                      |     | (x) | x   |     |     |     |     |     |     |     |     |     |     |     |     |     |     |
| `src/sim/defs/tiers.ts`                                                  |     |     | x   |     |     | x   |     |     |     |     |     |     |     |     |     |     |     |
| `src/sim/world.ts`, `islands.ts`                                         |     | x   | x   | x   |     |     |     |     |     |     |     |     |     |     |     |     |     |
| `src/sim/placement.ts`, `build.ts`, `forest.ts`, `roads.ts`, `supply.ts` |     |     | (x) | x   |     |     |     |     |     |     |     |     |     |     |     |     |     |
| `src/sim/trade.ts`, `orders.ts`, `flow.ts`, `population.ts`, `crises.ts` |     | (x) |     |     | x   |     |     |     |     |     |     |     |     |     |     |     |     |
| `src/sim/tick.ts`                                                        |     |     |     |     |     |     | x   |     |     | x   |     |     |     |     | (M) |     |     |
| `src/sim/queries.ts`, neu `goal3.ts`                                     |     |     |     |     |     |     | x   |     |     |     |     |     |     |     |     |     |     |
| neu `src/sim/ships.ts`, `economy.ts`                                     |     |     |     |     |     |     |     |     | x   | x   |     |     |     |     |     |     |     |
| `src/render/archipel.ts`, `renderer.ts`, `overlays.ts`                   |     |     | (x) |     |     |     |     |     |     |     | x   | x   |     |     |     |     |     |
| neu `src/render/shipLane.ts`, `ship.ts`                                  |     |     |     |     |     |     |     |     |     |     |     | x   |     |     |     |     |     |
| `src/ui/goal.ts`                                                         |     |     |     |     |     |     | (x) | x   |     |     |     |     |     |     |     |     |     |
| `src/ui/app.ts`, `hud.ts`, `hotkeys.ts`, `hover.ts`, `guide.ts`          |     |     | (x) |     |     |     |     |     |     |     |     |     | x   | x   |     | x   |     |
| `src/ui/input.ts`, `trade.ts`, `order.ts`, `storage.ts`                  |     |     |     |     |     |     |     |     |     |     |     |     |     | x   |     |     |     |
| `src/ui/inspect.ts`                                                      |     |     |     |     |     |     |     |     |     |     |     |     |     | x   |     | x   |     |
| neu `src/ui/activeIsland.ts`, `islandJump.ts`                            |     |     |     |     |     |     |     |     |     |     |     |     | x   |     |     |     |     |
| neu `src/ui/ships.ts`                                                    |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     | x   |     |
| `tests/sim/helpers.ts`, `seaHelpers.ts`, `save.test.ts`                  | x   | x   | x   |     |     |     |     |     |     |     |     |     |     |     | x   |     |     |
| `tests/sim/merchantsController.ts`, `balance-merchants.test.ts`          | (x) |     |     |     |     | x   | x   |     |     |     |     |     |     |     | x   |     |     |
| Doku (ADR-005, arc42, README, beobachtungen)                             |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     |     | x   |

(x) = nur Einträge/Brücke laut Task-Datei; (M) = nur Merge. Tasks mit `x` in derselben Zeile laufen nacheinander,
mit einer Ausnahme: T06 (`checkWin`) und T09 (`step`) ändern `tick.ts` parallel in getrennten Funktionen; T14 führt
sie per Merge zusammen. T13 und T15 (`inspect.ts`, `app.ts`) sind durch T14 getrennt.
