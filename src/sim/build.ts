import { BUILDING_DEFS } from './defs/buildings';
import { canPlace, canPlaceRoad } from './placement';
import type { Building, BuildingDefId, Result, World } from './types';
import { fail, ok } from './types';
import { footprint, tileAt } from './world';

// Keine Kosten in M1 — Bezahlen und Refund kommen mit M2.

export function placeRoad(world: World, x: number, y: number): Result {
  const res = canPlaceRoad(world, x, y);
  if (!res.ok) return res;
  tileAt(world, x, y)!.road = true;
  return ok;
}

export function removeRoad(world: World, x: number, y: number): Result {
  const tile = tileAt(world, x, y);
  if (!tile?.road) return fail('Kein Weg');
  tile.road = false;
  return ok;
}

export function placeBuilding(
  world: World,
  defId: BuildingDefId,
  x: number,
  y: number,
): Result & { id?: number } {
  const res = canPlace(world, defId, x, y);
  if (!res.ok) return res;
  const id = world.nextBuildingId++;
  const building: Building = { id, defId, x, y, connected: false, progress: 0, state: 'ok' };
  if (defId === 'house') {
    building.house = {
      tier: 1,
      inhabitants: 1,
      demand: {},
      satisfied: {},
      satisfiedSince: 0,
      supplied: false,
    };
  }
  world.buildings[id] = building;
  for (const p of footprint(BUILDING_DEFS[defId], x, y)) tileAt(world, p.x, p.y)!.buildingId = id;
  return { ok: true, id };
}

export function demolish(world: World, id: number): Result {
  const b = world.buildings[id];
  if (!b) return fail('Gebäude nicht gefunden');
  if (b.defId === 'kontor') return fail('Kontor kann nicht abgerissen werden');
  for (const p of footprint(BUILDING_DEFS[b.defId], b.x, b.y)) {
    const tile = tileAt(world, p.x, p.y);
    if (tile) tile.buildingId = null;
  }
  delete world.buildings[id];
  return ok;
}
