> **Task-ID:** Task 3 (Paket M10-F1) — Teil 3 von 3
> **AK-IDs:** AK-F1-01 … -08, -09 (a), -10, `RF-3`, BG-1
> **blocked-by:** Task 1 (Review OK)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md) · [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
> **Teile:** [T03a-wald-roden.md](T03a-wald-roden.md) · [T03b-wald-roden.md](T03b-wald-roden.md) · **T03c-wald-roden.md** (diese)

- [ ] **Schritt 2: Rot prüfen.** `npx vitest run tests/sim/forest.test.ts` → FAIL `Cannot find module
'../../src/sim/defs/forest'`.
- [ ] **Schritt 3: Umsetzung.** `src/sim/defs/forest.ts`:

```ts
import type { Cost } from '../types';

/** Roden: Wald → Weide, kein Holz (Spec 6). */
export const CLEAR_FOREST_COST: Cost = { money: 10, wood: 0, tools: 0, stone: 0 };
/** Aufforsten: Weide → Wald (Spec 6). */
export const PLANT_FOREST_COST: Cost = { money: 20, wood: 0, tools: 0, stone: 0 };
```

`src/sim/forest.ts`:

```ts
import { CLEAR_FOREST_COST, PLANT_FOREST_COST } from './defs/forest';
import { checkAfford, pay } from './economy';
import type { Cost, Result, Terrain, World } from './types';
import { fail, ok } from './types';
import { functionLock } from './unlocks';
import { inBounds, tileAt } from './world';

/** Prüfreihenfolge Spec 6: Sperre, Karte, bebaut, Gelände, Geld. Ändert nichts. */
function check(w: World, x: number, y: number, from: Terrain, wrong: string, cost: Cost): Result {
  const lock = functionLock(w, 'forest');
  if (lock !== null) return fail(lock);
  if (!Number.isInteger(x) || !Number.isInteger(y) || !inBounds(w, x, y))
    return fail('Ausserhalb der Karte');
  const t = tileAt(w, x, y)!;
  if (t.buildingId !== null || t.road) return fail('Bereits bebaut');
  if (t.terrain !== from) return fail(wrong);
  return checkAfford(w, cost);
}

export function canClearForest(w: World, x: number, y: number): Result {
  return check(w, x, y, 'forest', 'Kein Wald', CLEAR_FOREST_COST);
}
export function canPlantForest(w: World, x: number, y: number): Result {
  return check(w, x, y, 'grass', 'Keine Weide', PLANT_FOREST_COST);
}
function apply(w: World, x: number, y: number, r: Result, to: Terrain, cost: Cost): Result {
  if (!r.ok) return r;
  pay(w, cost);
  tileAt(w, x, y)!.terrain = to;
  return ok;
}
/** Wald → Weide; kein Holz, kein Zufall (Spec 6). */
export function clearForest(w: World, x: number, y: number): Result {
  return apply(w, x, y, canClearForest(w, x, y), 'grass', CLEAR_FOREST_COST);
}
/** Weide → Wald (Spec 6). */
export function plantForest(w: World, x: number, y: number): Result {
  return apply(w, x, y, canPlantForest(w, x, y), 'forest', PLANT_FOREST_COST);
}
```

`src/sim/queries.ts` `layoutKey`: die Wege-Schleife wird zu einer Schleife über alle Kacheln mit einem Wert je
Kachel (Geländeart und Weg-Bit; feste Länge, eindeutig):

```ts
/** Kodierung der Geländeart im Layout-Schlüssel (kein Spielwert). */
const TERRAIN_CODE: Record<Terrain, number> = {
  water: 0,
  sand: 1,
  grass: 2,
  forest: 3,
  mountain: 4,
};

/** Cache-Schlüssel des Layouts: ändert sich bei Bau, Abriss, Weg, Anbindung und Geländewechsel, nicht durch `step()` allein. */
export function layoutKey(world: World): string {
  const h = new LayoutHash();
  h.add(world.nextBuildingId);
  for (const t of world.tiles) h.add(TERRAIN_CODE[t.terrain] * 2 + (t.road ? 1 : 0));
  h.add(-1);
  /* Gebäude-Schleife unverändert */
}
```

Machbarkeit: 64 × 64 = 4096 Werte je Aufruf, 5 Aufrufer je Frame → rund 20 000 `add` je Frame (je zwei `imul`),
gemessen in der Grössenordnung < 0,1 ms; kein Cache nötig.

- [ ] **Schritt 4: Grün prüfen.** `npx vitest run tests/sim/forest.test.ts tests/sim/queries.test.ts`; `npx vitest run`
      (Render-Caches, die an `layoutKey` hängen, bleiben grün); `make check`. Vor der Umsetzung grün erlaubt: keiner.
- [ ] **Schritt 5: BG-1** (ohne AK-S1-17, das liegt auf `feat/m10-sim`); Testzählbefehl.
- [ ] **Schritt 6: Commit.** `git add src/sim tests/sim && git commit -m "feat: M10-F1 Wald roden und aufforsten, Geländeart im layoutKey (Spec 6, 7)"`

**Integration (Controller, W3):** nach Review OK von Task 2 und Task 3:
`git -C .worktrees/m10-sim merge --no-edit <T3-SHA>`, `make check`, BG-1, push. Konflikte sind nicht zu erwarten
(disjunkte Dateien); falls doch: stoppen, melden.

---
