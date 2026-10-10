import { BUILDING_DEFS } from './defs/buildings';
import type { Building, BuildingDefId, World } from './types';
import { adjacentOf, HOME, idx, inBounds, isKontor } from './world';

/** Wegkacheln (Tile-Indizes), die 4er-angrenzend an den Kontor-Footprint liegen. */
export function kontorRoadRoots(world: World, island: number = HOME): number[] {
  const isl = world.islands[island];
  if (!isl) return [];
  const kontor = isl.kontorId === null ? undefined : world.buildings[isl.kontorId];
  if (!kontor) return [];
  const def = BUILDING_DEFS[kontor.defId];
  return adjacentOf(isl, kontor.x, kontor.y, def.w, def.h)
    .map((p) => idx(isl, p.x, p.y))
    .filter((i) => isl.tiles[i]!.road);
}

/** BFS über Wegkacheln ab den Kontor-Roots. Das Set ist lokal und wird nicht im World gespeichert. */
export function reachableRoads(world: World, island: number = HOME): Set<number> {
  const isl = world.islands[island];
  const seen = new Set<number>(kontorRoadRoots(world, island));
  if (!isl) return seen;
  const queue = [...seen];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head]!;
    const cx = cur % isl.width;
    const cy = Math.floor(cur / isl.width);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inBounds(isl, nx, ny)) continue;
      const ni = idx(isl, nx, ny);
      if (seen.has(ni) || !isl.tiles[ni]!.road) continue;
      seen.add(ni);
      queue.push(ni);
    }
  }
  return seen;
}

export function isBuildingConnected(world: World, b: Building, roads: Set<number>): boolean {
  if (isKontor(b.defId)) return true;
  if (b.defId === 'house') return false; // Versorgung läuft über Radius (M3), nicht über Wege
  const isl = world.islands[b.island]!;
  const def = BUILDING_DEFS[b.defId];
  return adjacentOf(isl, b.x, b.y, def.w, def.h).some((p) => roads.has(idx(isl, p.x, p.y)));
}

/** Ob ein Gebäudetyp einen Weg zum Kontor braucht (Betriebe, Dienste, Versorger ausser Kontor). */
export function needsConnection(defId: BuildingDefId): boolean {
  const def = BUILDING_DEFS[defId];
  return (
    def.produces !== undefined ||
    def.service !== undefined ||
    def.serviceRadius !== undefined ||
    (def.supplyRadius !== undefined && !isKontor(defId))
  );
}

export function recomputeConnectivity(world: World): void {
  const roads = world.islands.map((_, i) => reachableRoads(world, i));
  for (const b of Object.values(world.buildings)) {
    b.connected = isBuildingConnected(world, b, roads[b.island]!);
    if (!needsConnection(b.defId)) continue;
    if (b.outageUntil !== undefined) b.state = 'burning';
    else if (b.paused === true) b.state = 'paused';
    else if (!b.connected) b.state = 'notConnected';
    else if (b.state === 'notConnected') b.state = 'ok';
  }
}
