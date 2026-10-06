import { BUILDING_DEFS, ROAD_COST_OBJ } from './defs/buildings';
import { grantRefund, pay, refundCost } from './economy';
import { newHouseState } from './population';
import { affordBuild, canPlace, canPlaceRoad, islandAt } from './placement';
import { effectiveRefund } from './queries';
import { recomputeConnectivity } from './roads';
import type { Building, BuildingDefId, Result, World } from './types';
import { fail, ok } from './types';
import { paidCost } from './upgrade';
import { HOME, footprint, home, islandOf, tileAt } from './world';

export function placeRoad(world: World, x: number, y: number, island: number = HOME): Result {
  const res = canPlaceRoad(world, x, y, island);
  if (!res.ok) return res;
  const isl = islandAt(world, island)!;
  const afford = affordBuild(world, island, ROAD_COST_OBJ);
  if (!afford.ok) return afford;
  pay(world, isl, ROAD_COST_OBJ);
  tileAt(isl, x, y)!.road = true;
  recomputeConnectivity(world);
  return ok;
}

export function removeRoad(world: World, x: number, y: number, island: number = HOME): Result {
  const isl = islandAt(world, island);
  if (isl === null) return fail('Unbekannte Insel');
  const tile = tileAt(isl, x, y);
  if (!tile?.road) return fail('Kein Weg');
  tile.road = false;
  grantRefund(world, isl, refundCost(ROAD_COST_OBJ));
  recomputeConnectivity(world);
  return ok;
}

export function placeBuilding(
  world: World,
  defId: BuildingDefId,
  x: number,
  y: number,
  island: number = HOME,
): Result & { id?: number } {
  const res = canPlace(world, defId, x, y, island);
  if (!res.ok) return res;
  const isl = islandAt(world, island)!;
  const cost = BUILDING_DEFS[defId].cost;
  const fromHome = defId === 'kontor2';
  const afford = affordBuild(world, island, cost, fromHome);
  if (!afford.ok) return afford;
  pay(world, fromHome ? home(world) : isl, cost);
  const id = world.nextBuildingId++;
  const building: Building = {
    id,
    defId,
    x,
    y,
    connected: false,
    progress: 0,
    state: 'ok',
    island,
  };
  if (defId === 'house') {
    building.house = newHouseState(world);
  }
  world.buildings[id] = building;
  for (const p of footprint(BUILDING_DEFS[defId], x, y)) tileAt(isl, p.x, p.y)!.buildingId = id;
  if (fromHome) isl.kontorId = id;
  recomputeConnectivity(world);
  return { ok: true, id };
}

/** Ein Schiff mit Route über `island` oder Ziel `island` braucht das Kontor; ein Hafen allein nicht. */
function shipNeedsIsland(world: World, island: number): boolean {
  return world.ships.some((s) => s.route?.a === island || s.route?.b === island || s.to === island);
}

export function demolish(world: World, id: number): Result {
  const b = world.buildings[id];
  if (!b) return fail('Gebäude nicht gefunden');
  if (b.defId === 'kontor') return fail('Kontor kann nicht abgerissen werden');
  const isFar = b.defId === 'kontor2';
  if (isFar && shipNeedsIsland(world, b.island)) return fail('Erst Route auflösen');
  for (const p of footprint(BUILDING_DEFS[b.defId], b.x, b.y)) {
    const tile = tileAt(islandOf(world, b), p.x, p.y);
    if (tile) tile.buildingId = null;
  }
  delete world.buildings[id];
  if (isFar) {
    const isl = world.islands[b.island]!;
    if (isl.kontorId === b.id) isl.kontorId = null;
    grantRefund(world, home(world), effectiveRefund(world, paidCost(b)));
  } else grantRefund(world, islandOf(world, b), refundCost(paidCost(b)));
  recomputeConnectivity(world);
  return ok;
}
