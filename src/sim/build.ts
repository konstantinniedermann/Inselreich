import { BUILDING_DEFS, ROAD_COST_OBJ } from './defs/buildings';
import { checkAfford, grantRefund, pay, refundCost } from './economy';
import { newHouseState } from './population';
import { canPlace, canPlaceRoad } from './placement';
import { recomputeConnectivity } from './roads';
import type { Building, BuildingDefId, Result, World } from './types';
import { fail, ok } from './types';
import { paidCost } from './upgrade';
import { footprint, tileAt } from './world';

export function placeRoad(world: World, x: number, y: number): Result {
  const res = canPlaceRoad(world, x, y);
  if (!res.ok) return res;
  const afford = checkAfford(world, ROAD_COST_OBJ);
  if (!afford.ok) return afford;
  pay(world, ROAD_COST_OBJ);
  tileAt(world, x, y)!.road = true;
  recomputeConnectivity(world);
  return ok;
}

export function removeRoad(world: World, x: number, y: number): Result {
  const tile = tileAt(world, x, y);
  if (!tile?.road) return fail('Kein Weg');
  tile.road = false;
  grantRefund(world, refundCost(ROAD_COST_OBJ));
  recomputeConnectivity(world);
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
  const afford = checkAfford(world, BUILDING_DEFS[defId].cost);
  if (!afford.ok) return afford;
  pay(world, BUILDING_DEFS[defId].cost);
  const id = world.nextBuildingId++;
  const building: Building = { id, defId, x, y, connected: false, progress: 0, state: 'ok' };
  if (defId === 'house') {
    building.house = newHouseState(world);
  }
  world.buildings[id] = building;
  for (const p of footprint(BUILDING_DEFS[defId], x, y)) tileAt(world, p.x, p.y)!.buildingId = id;
  recomputeConnectivity(world);
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
  grantRefund(world, refundCost(paidCost(b)));
  recomputeConnectivity(world);
  return ok;
}
