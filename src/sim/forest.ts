import { CLEAR_FOREST_COST, PLANT_FOREST_COST } from './defs/forest';
import { checkAfford, pay } from './economy';
import type { Cost, Result, Terrain, World } from './types';
import { fail, ok } from './types';
import { functionLock } from './unlocks';
import { home, inBounds, tileAt } from './world';

/** Prüfreihenfolge Spec 6: Sperre, Karte, bebaut, Gelände, Geld. Ändert nichts. */
function check(w: World, x: number, y: number, from: Terrain, wrong: string, cost: Cost): Result {
  const lock = functionLock(w, 'forest');
  if (lock !== null) return fail(lock);
  if (!Number.isInteger(x) || !Number.isInteger(y) || !inBounds(home(w), x, y))
    return fail('Ausserhalb der Karte');
  const t = tileAt(home(w), x, y)!;
  if (t.buildingId !== null || t.road) return fail('Bereits bebaut');
  if (t.terrain !== from) return fail(wrong);
  return checkAfford(w, home(w), cost);
}

export function canClearForest(w: World, x: number, y: number): Result {
  return check(w, x, y, 'forest', 'Kein Wald', CLEAR_FOREST_COST);
}
export function canPlantForest(w: World, x: number, y: number): Result {
  return check(w, x, y, 'grass', 'Keine Weide', PLANT_FOREST_COST);
}
function apply(w: World, x: number, y: number, r: Result, to: Terrain, cost: Cost): Result {
  if (!r.ok) return r;
  pay(w, home(w), cost);
  tileAt(home(w), x, y)!.terrain = to;
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
