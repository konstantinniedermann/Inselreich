# T07 · Fahrzeit A2 aus einer Quelle, Seerecht, Frist-Invariante (S3, R10–R13)

Umsetzer `tech-sim-engineer` · ≈ 60 Tools · AK-HF-15, -16, -17, -18 (Fahrt-Teil), -19, -20, -22 (Tick-Teil) · blocked-by: T06 · Worktree `.worktrees/hafen-route` · Spec §3.3,
Anhang 01 D, H · Index P-7, P-8, P-13

## Dateien

- ändern: `src/sim/islands.ts` (`laneTicks`, `laneTicksOf`), `src/sim/defs/sea.ts` (`LEGACY_SEA_TILE_TICKS`, `SHIP_DOCK_TICKS` anlegen, Kommentar `ROUTE_*` «spielrelevant»),
  `src/sim/council.ts` (Rückfallwert, `rescaleVoyages` klemmen), `src/sim/defs/council.ts` (Seerecht 8 → 2.32), `src/sim/save.ts` (**nur** Typ im `laneTicks`-Aufruf von
  `isValidShip`), `src/render/shipLane.ts` (nur falls Typ nötig)
- Tests: `tests/sim/islands.test.ts`, `tests/sim/council.test.ts`, `tests/sim/seerecht.test.ts`, `tests/sim/farOrder-defs.test.ts`, Tick-Pins laut Liste
- nicht ändern: `src/ui/*` (T08; `travelTicks`/`travelTicksOf` bleiben bis T08 mit `@deprecated` stehen), Save-Version (T09), `tickShips`-Ablauf (T10)

## Interfaces

```ts
/** Fahrzeit a → b in Ticks: max(1, ceil(L · perTile)), L = Länge der seaRoute-Polylinie Anker → Anker; a === b oder fehlende Insel → 0. */
export function laneTicks(islands: readonly RouteIsland[], a: number, b: number, perTile: number = SHIP_TICKS_PER_ROUTE_TILE): number;
export const laneTicksOf = (world: Pick<World, 'islands' | 'council'>, a: number, b: number): number; // perTile = seaTileTicks(world)
// src/sim/defs/sea.ts
export const LEGACY_SEA_TILE_TICKS = { base: 10, seerecht: 8 } as const; // nur Migration (T09), ersetzt SHIP_TICKS_PER_SEA_TILE
export const SHIP_DOCK_TICKS = 30; // R15; wirkt ab S4 (T10), hier nur für die Frist-Invariante AK-HF-20
```

## Verhalten

- `seaTileTicks(world)` = Hebel oder `SHIP_TICKS_PER_ROUTE_TILE` (R12). `COUNCIL[4].C.lever.value = 2.32`; Kartentext unverändert.
- **P-8:** `rescaleVoyages(world, alt, neu)`: `left = min(laneTicksOf(world, port, to), max(1, ceil(left · neu / alt)))` — sonst kann `left` um 1 über `T_neu` liegen
  und der eigene Spielstand wird beim Laden abgewiesen.
- Notanker: liefert `seaRoute` die Gerade, ist L ihre Länge, `T ≥ 1`.
- `depart`, `routeBalance`, `shipLane.cachedTicks`, `isValidShip` lesen schon `laneTicksOf`/`laneTicks` (SEERECHT) und folgen von selbst.
- Kommentar `defs/sea.ts` «reine Darstellung, beeinflusst … Fahrzeit nicht» → «bestimmt die Fahrzeit (R10)»; `SHIP_TICKS_PER_SEA_TILE` entfällt (alle Leser umstellen).

## Steps

- [ ] **Tests rot** `tests/sim/islands.test.ts`, `describe('HAFEN S3 Fahrzeit')`:
  - AK-HF-15: `SHIP_TICKS_PER_ROUTE_TILE === 2.9`; Seeds 1–40, jede Lane (beide Richtungen): `laneTicks = ceil(routeLength(seaRoute) · 2.9)`.
  - AK-HF-16: dieselben Lanes: `|L/T − 1/k| < 1/(k · T)`. Rot heute (1,2–9,0 Ticks je Kachel).
  - AK-HF-17: synthetische Zwei-Insel-Liste ohne Wasserweg (Wasser ganz umschlossen): Route = Gerade, `T = ceil(|Gerade| · 2.9) ≥ 1`.
- [ ] **Tests rot** `tests/sim/council.test.ts` / `seerecht.test.ts`: AK-HF-18 (Fahrt): Hebel `2.32`, mit `'C'` `laneTicksOf = ceil(L · 2.32)`; Beschluss während Fahrt:
      `left` per `ceil` umgerechnet und ≤ `T_neu` (P-8, Fall `left = T_alt`), Pose springt höchstens um eine Tickstrecke (`M14:AK-SR-15` neu). AK-HF-19 (`M14:AK-SR-7`/`-8` neu):
      Formel `cap × 100 / (2 · ceil(k · L) + 2 · D)`: L 110 → Umlauf 698/572, 7,16/8,74; L 90 → 8,59 ohne Seerecht (Werte aus Defs gerechnet, nicht als Literal hart).
- [ ] **Test rot** `tests/sim/farOrder-defs.test.ts` «Frist-Invariante» (AK-HF-20): `600 + 2 · (ceil(2.9 · lMax_B) + SHIP_DOCK_TICKS) ≤ FAR_ORDER_DURATION`; zusätzlich
      Seeds 1–40 jede Heimat-Lane inkl. Ersatzlagen `600 + 2 · (T + 30) ≤ 1700` (600 aus den Defs, nicht hart).
- [ ] **Lauf rot**, dann **Umsetzen**, dann **Lauf grün**.
- [ ] **Neu-Pins AK-HF-22 (Tick-Teil, per Name):** Probe «Ticks» (T00) plus Anhang 01 H plus SEERECHT-Tests:
  - `tests/sim/ships.test.ts`: AK-E4-03 «Abfahrt sofort, Ankunft nach 370, Rundreise 740» (neue Zahl, `M12:AK-E4-03` im Namen behalten), AK-E4-05 (2), AK-E4-08, AK-E4-17;
  - `tests/sim/farOrder-defs.test.ts` «Seed 3 Seewege … laneTicks gepinnt»; `tests/sim/farOrder-sea.test.ts` AK-H2-27 Fall A/B × A, B, C;
  - `tests/sim/seaGolden.test.ts` Seeds 7/13/42 (Ticks-Teil); `tests/sim/routeBalance.test.ts` (Fälle mit `cycleTicks`, falls rot);
  - `tests/sim/ships-rng.test.ts`, `tests/sim/seerecht.test.ts` AK-SR-7/-8, `tests/sim/council*.test.ts` (Seerecht-Fälle).
    UI-Pins (`homeTravel` «d = 25 ergibt 250», `islandCard` 3 Fälle) erst in T08. Commit je Gruppe mit Name, alt → neu, «A2 R10, E4 R913».
- [ ] Kandidatenliste grün bis auf T08-Dateien (benennen); Teilbeleg laut Index; `git diff main -- tests/sim/balance.test.ts` leer; `balance*` grün.
- [ ] **Commit:** `feat: Fahrzeit aus der Fahrlinie, Seerecht 2,32 (HAFEN S3, AK-HF-15..20)`.

## Bericht

Exit-Codes; Rot-Ausgaben; Pin-Liste; Fall P-8 (vorher/nachher); max. `600 + 2 · (T + 30)` über Seeds 1–40 (erwartet ≤ 1404 mit K2, Anhang 01 H).
