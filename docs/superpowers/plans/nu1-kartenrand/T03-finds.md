# T03 · Fundstück-Helfer und Wirkorte (F1–F8)

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 70 Tools · blocked-by: T02 · AK-NU1-19, -20, -37, -38, -39 (Lager, Kontor), -40 · Regel R979 N2
Spec §3.9; Anhang 02 §5, §8.1. **Teuerster Punkt des Plans: F7** (vier Sim-Kappungen, Kappung beim Laden).

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

**Files:**

- Create: `src/sim/finds.ts`, `tests/sim/finds.test.ts`, `tests/sim/finds-save.test.ts`, `tests/sim/finds-storage.test.ts`
- Modify (je nur die genannte Stelle): `src/sim/levels.ts` (`effectiveCycle`), `src/sim/islands.ts` (`laneTicksOf`, `travelTicksOf`), `src/sim/council.ts` (`serviceRadiusOf`), `src/sim/supply.ts` (`inSupplyRange`), `src/sim/queries.ts` (Zeilen ≈ 161, 194, 209), `src/sim/economy.ts` (≈ 13), `src/sim/trade.ts` (≈ 127), `src/sim/ships.ts` (≈ 81–82 `validRoute`, ≈ 153 `unload`), `src/sim/save.ts` (`isValidRoute`, Aufruf Kappung), `src/sim/expeditionSave.ts` (`capStockOnLoad`)

**Interfaces:**

- Consumes: `World.finds` (T02), `FINDS`, `FIND_PCT` (T01).
- Produces (`src/sim/finds.ts`, Blatt: importiert nur `./defs/*` und `./types`):

```ts
export const hasFind: (world: Pick<World, 'finds'>, id: FindId) => boolean;
export function findCycle(world: Pick<World, 'finds'>, defId: BuildingDefId, cycle: number): number; // F3/F6/F8: max(1, ceil(cycle × FIND_PCT / 100))
export function findTravel(world: Pick<World, 'finds'>, ticks: number): number; // F1: ticks 0 → 0, sonst max(1, ceil(ticks × FIND_PCT / 100))
export function routeGoodsPerDirection(world: Pick<World, 'finds'>): number; // 2 bzw. 3 (F2)
export function storageCap(world: Pick<World, 'finds'>, good: GoodId): number; // 100 bzw. 120 für spice, food (F7)
export function findServiceRadius(
  world: Pick<World, 'finds'>,
  defId: BuildingDefId,
  r: number | undefined,
): number | undefined; // F4 +1
export function supplyRadiusOf(
  world: Pick<World, 'finds'>,
  defId: BuildingDefId,
): number | undefined; // F5 +1 an kontor2
export function findNote(
  world: Pick<World, 'finds'>,
  lever: FindLever['kind'],
  key?: BuildingDefId | GoodId,
): string | null; // «(Fundstück «Name»)» oder null
// expeditionSave.ts
export function capStockOnLoad(world: World): void; // R979 N2: jede Insel, jedes Gut auf storageCap kappen
```

## Wirkorte (je genau einer, Fundstück immer letzter Faktor)

| Stück    | Ort                                                                       | Form                                                                                                                                                                                                                 |
| -------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F3 F6 F8 | `effectiveCycle` in `levels.ts`                                           | `findCycle(world, defId, islandCycle(…councilCycle(…)))` (P-4; `cycleOf` unverändert)                                                                                                                                |
| F1       | `laneTicksOf`, `travelTicksOf` in `islands.ts`                            | `findTravel(world, …)`; `Pick` um `'finds'` erweitern; keine Umrechnung laufender Fahrten                                                                                                                            |
| F2       | `validRoute` in `ships.ts`, `isValidRoute` in `save.ts`                   | Grenze `routeGoodsPerDirection(world)`; Text «Höchstens ${n} Güter je Richtung»; `save.ts` reicht `routeGoodsPerDirection(raw as Pick<World,'finds'>)` an `isValidRoute` durch (`finds` ist dann schon geprüft, T02) |
| F4       | `serviceRadiusOf` in `council.ts`                                         | `findServiceRadius(world, defId, activeLever(…) ?? def.serviceRadius)`                                                                                                                                               |
| F5       | `inSupplyRange` in `supply.ts`, `queries.ts` ≈ 161 und ≈ 194              | `supplyRadiusOf(world, b.defId)` statt `def.supplyRadius`                                                                                                                                                            |
| F7       | `economy.ts` ≈ 13, `trade.ts` ≈ 127, `ships.ts` ≈ 153, `queries.ts` ≈ 209 | `storageCap(world, good)` statt `STORAGE_CAP`; Import von `STORAGE_CAP` entfällt                                                                                                                                     |

`ships.ts` ist zugleich HAFEN-Gebiet (`.worktrees/hafen`): nur die zwei Stellen ändern, keine Umordnung.

## Tests

- `tests/sim/finds.test.ts`, **AK-19** (je Stück ein `it`, Welt `createWorld(1)`, Stück per `w.finds = ['Fx']`): ohne Stück = Def bzw. Bestand, mit Stück = Prüfwert Anhang 02 §5: F1 `findTravel(w, 300)` 270 und `laneTicksOf` einer Fremdlane = `ceil(ohne × 90/100)`; F2 `routeGoodsPerDirection` 3; F3 Holzfäller Basis 30 → 27 und Stufe 3 12 → 11 über `cycleOf`; F4 `serviceRadiusOf(w,'bathhouse')` 11; F5 `supplyRadiusOf(w,'kontor2')` 9, `'kontor'` 8; F6 Werkzeugmacher 80 → 72; F7 `storageCap` 120 für `spice`, `food`, 100 für `wood`; F8 Schäferei 50 → 45. `structuredClone(BUILDING_DEFS)` vor/nach gleich; `findNote(w, 'travelPct')` = «(Fundstück «Kompassrose»)» mit F1, `null` ohne.
- Ebenda, **AK-20** (Wächter): `FINDS.every(f => ['travelPct','routeGoods','cyclePct','serviceRadius','supplyRadius','storageCap'].includes(f.lever.kind))`; Quelltext `src/sim/finds.ts` ohne `TAX_`, `WIN_`, `.buy`, `.sell`; mit `finds: []` liefert jeder Helper für alle `BUILDING_IDS`/`GOOD_IDS` den Bestand (`effectiveCycle`, `serviceRadiusOf`, `supplyRadiusOf` = Def, `storageCap` = `STORAGE_CAP`, `findTravel(w,t) = t`).
- `tests/sim/finds-save.test.ts`, **AK-37:** Welt mit `wonSpice`, `U7`, `seaRevealed ['wrecks']`, `finds ['F1','F2']`, Fremdkontor und Schiff mit Route `ab` 3 Güter → `serialize`/`deserialize` `ok`, tief gleich; ohne F2 liefert `setRoute` mit 3 Gütern «Höchstens 2 Güter je Richtung», und derselbe Stand mit `finds []`/`seaRevealed []` lädt als «Beschädigter Spielstand».
- Ebenda, **AK-38 (R979 N2, Kappung):** Basiswelt wie AK-37; mit F7 (`seaRevealed ['wrecks','skerries','north']`, `finds ['F1','F6','F7']`) und Heimatlager 120 Gewürz, 120 Nahrung → Rundreise tief gleich; **ohne F7** lädt ein Stand mit 120 Gewürz und 130 Nahrung `ok`, und das Lager ist danach 100/100 (gekappt, nicht abgewiesen); mit F7 und 130 Nahrung → 120. Holz 130 wird in beiden Fällen 100.
- `tests/sim/finds-storage.test.ts`, **AK-39 (Lager, Kontor):** je Gut aus `GOOD_IDS`: Einlagern über `store` (Produktion), Kauf am Markt (`trade.ts`) und Entladen eines Routenschiffs am Fremdkontor und in der Heimat → Grenze 120 für `spice`/`food` mit F7, sonst 100. (Rückkehr der Expedition: T05.)
- Ebenda, **AK-40** (Wächter, Quelltext): alle Dateien unter `src/sim` ausser `src/sim/defs/**` und `src/sim/finds.ts` enthalten weder `STORAGE_CAP` noch `ROUTE_GOODS_PER_DIRECTION` (Liste per `readdirSync` rekursiv).

## Schritte

- [ ] Tests schreiben; **Rot:** `npx vitest run tests/sim/finds.test.ts tests/sim/finds-save.test.ts tests/sim/finds-storage.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] `finds.ts` und Wirkorte umsetzen; `capStockOnLoad` im `try`-Block von `deserialize` nach `recomputeConnectivity`.
- [ ] Vorprüfung Kappung: `rg -n "stock\[[^]]+\] (\+=|=)" src/sim` → nur `economy.ts`, `ships.ts` (Stand Plan); weiterer Schreiber ohne Kappung → Befund an den Controller.
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/sim/imports.test.ts tests/sim/ships.test.ts tests/sim/trade*.test.ts tests/sim/levels.test.ts tests/sim/council*.test.ts tests/sim/supply*.test.ts tests/sim/scenario-saves.test.ts tests/sim/balance.test.ts; echo EXIT=$?` → 0 (fehlende Dateien aus der Liste streichen, Ledger).
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: NU-1 Fundstück-Helfer F1–F8, Lagergrenze je Gut, Kappung beim Laden (T03)`.
