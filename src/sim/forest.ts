import { CLEAR_FOREST_COST, PLANT_FOREST_COST } from './defs/forest';
import { pay } from './economy';
import type { Cost, Result, Terrain, World } from './types';
import { fail, ok } from './types';
import { functionLock } from './unlocks';
import { affordBuild, islandAt, noKontorReason } from './placement';
import { HOME, inBounds, tileAt } from './world';

/** Prüfreihenfolge Spec 6: Sperre, Karte, bebaut, Gelände, Geld. Ändert nichts. */
function check(
  w: World,
  x: number,
  y: number,
  from: Terrain,
  wrong: string,
  cost: Cost,
  island: number,
): Result {
  const lock = functionLock(w, 'forest');
  if (lock !== null) return fail(lock);
  const isl = islandAt(w, island);
  if (isl === null) return fail('Unbekannte Insel');
  const gate = noKontorReason(w, island);
  if (gate !== null) return fail(gate);
  if (!Number.isInteger(x) || !Number.isInteger(y) || !inBounds(isl, x, y))
    return fail('Ausserhalb der Karte');
  const t = tileAt(isl, x, y)!;
  if (t.buildingId !== null || t.road) return fail('Bereits bebaut');
  if (t.terrain !== from) return fail(wrong);
  return affordBuild(w, island, cost);
}

export function canClearForest(w: World, x: number, y: number, island: number = HOME): Result {
  return check(w, x, y, 'forest', 'Kein Wald', CLEAR_FOREST_COST, island);
}
export function canPlantForest(w: World, x: number, y: number, island: number = HOME): Result {
  return check(w, x, y, 'grass', 'Keine Weide', PLANT_FOREST_COST, island);
}
function apply(
  w: World,
  x: number,
  y: number,
  r: Result,
  to: Terrain,
  cost: Cost,
  island: number,
): Result {
  if (!r.ok) return r;
  const isl = islandAt(w, island)!;
  pay(w, isl, cost);
  tileAt(isl, x, y)!.terrain = to;
  return ok;
}
/** Wald → Weide; kein Holz, kein Zufall (Spec 6). */
export function clearForest(w: World, x: number, y: number, island: number = HOME): Result {
  return apply(w, x, y, canClearForest(w, x, y, island), 'grass', CLEAR_FOREST_COST, island);
}
/** Weide → Wald (Spec 6). */
export function plantForest(w: World, x: number, y: number, island: number = HOME): Result {
  return apply(w, x, y, canPlantForest(w, x, y, island), 'forest', PLANT_FOREST_COST, island);
}
