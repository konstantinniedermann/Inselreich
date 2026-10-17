# T01 Fahrzeit-Helfer mit injizierbarem Lane-Cache (AK-F1, AK-F2)

Dateien (Ownership): `src/ui/homeTravel.ts` (neu), `src/ui/islandCard.ts` (Cache raus), `tests/ui/homeTravel.test.ts` (neu). Sonst nichts.
Vorab: Pflicht «Zeitbasis messen» aus dem Index.

## Soll

```ts
type Lanes = (world: World) => Lane[]; // Lane aus '../sim/islands'
export function createLaneCache(compute: Lanes = (w) => seaLanes(w.islands)): Lanes; // WeakMap<World, Lane[]>
export const laneCache: Lanes = createLaneCache();
export function homeTravelTicks(
  world: World,
  island: number,
  lanes: Lanes = laneCache,
): number | null;
```

`null` bei `island === HOME`, fehlender Insel oder fehlender Lane `{a: HOME, b: island}`; sonst `travelTicks(lane.d)`. DOM-frei, liest nur die Welt, kein Wert in `defs/`. `islandCard` ruft `homeTravelTicks`/`lane.d` über denselben Cache (die Zeile `Fahrzeit 0:27` bleibt zeichengleich; `formatIslandCard`-Signatur unverändert).

## Schritte

- [ ] **Test zuerst** `tests/ui/homeTravel.test.ts` (rot, weil Datei fehlt):
  - AK-F1: Welt `createWorld(3, { unlockAll: true })`; für jede Fremdinsel `i`: `homeTravelTicks(w, i) === laneTicks(w.islands, 0, i)`; fester Golden-Wert: bei einer Lane mit `d = 25` → `250` (Welt mit Handbau-Inseln über `twoIslandWorld` oder Lane-Provider mit `[{a:0,b:1,d:25}]`).
  - `homeTravelTicks(w, 0) === null`, `homeTravelTicks(w, 99) === null`, Provider ohne Lane → `null`.
  - AK-F2: `let n = 0; const lanes = createLaneCache((w) => { n++; return seaLanes(w.islands); });` zwei Aufrufe `homeTravelTicks(w, 1, lanes)` → `n === 1`; zweite Welt `createWorld(4, …)` → `n === 2`.
- [ ] Rot-Beleg der neuen Tests ausgeben, dann `homeTravel.ts` schreiben, `islandCard.ts` umstellen (WeakMap entfällt).
- [ ] Grün: `npx vitest run tests/ui/homeTravel.test.ts tests/ui/islandCard.test.ts` (Pfad der vorhandenen Inselkarten-Tests per `rg islandCard tests/ui` klären).
- [ ] Je-Task-Prüfungen aus dem Index (tsc, lint, zeittests, conflicts), Commit `feat: I-136 T01 Fahrzeit-Helfer mit Lane-Cache`.
