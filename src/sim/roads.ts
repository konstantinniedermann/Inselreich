import { BUILDING_DEFS } from './defs/buildings';
import type { Building, BuildingDefId, World } from './types';
import { adjacentOf, idx, inBounds } from './world';

/** Wegkacheln (Tile-Indizes), die 4er-angrenzend an den Kontor-Footprint liegen. */
export function kontorRoadRoots(world: World): number[] {
  const kontor = world.buildings[world.kontorId];
  if (!kontor) return [];
  const def = BUILDING_DEFS[kontor.defId];
  return adjacentOf(world, kontor.x, kontor.y, def.w, def.h)
    .map((p) => idx(world, p.x, p.y))
    .filter((i) => world.tiles[i]!.road);
}

/** BFS über Wegkacheln ab den Kontor-Roots. Das Set ist lokal und wird nicht im World gespeichert. */
export function reachableRoads(world: World): Set<number> {
  const seen = new Set<number>(kontorRoadRoots(world));
  const queue = [...seen];
  for (let head = 0; head < queue.length; head++) {
    const cur = queue[head]!;
    const cx = cur % world.width;
    const cy = Math.floor(cur / world.width);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inBounds(world, nx, ny)) continue;
      const ni = idx(world, nx, ny);
      if (seen.has(ni) || !world.tiles[ni]!.road) continue;
      seen.add(ni);
      queue.push(ni);
    }
  }
  return seen;
}

export function isBuildingConnected(world: World, b: Building, roads: Set<number>): boolean {
  if (b.defId === 'kontor') return true;
  if (b.defId === 'house') return false; // Versorgung läuft über Radius (M3), nicht über Wege
  const def = BUILDING_DEFS[b.defId];
  return adjacentOf(world, b.x, b.y, def.w, def.h).some((p) => roads.has(idx(world, p.x, p.y)));
}

/** Ob ein Gebäudetyp einen Weg zum Kontor braucht (Betriebe, Dienste, Versorger ausser Kontor). */
export function needsConnection(defId: BuildingDefId): boolean {
  const def = BUILDING_DEFS[defId];
  return (
    def.produces !== undefined ||
    def.service !== undefined ||
    def.serviceRadius !== undefined ||
    (def.supplyRadius !== undefined && defId !== 'kontor')
  );
}

export function recomputeConnectivity(world: World): void {
  const roads = reachableRoads(world);
  for (const b of Object.values(world.buildings)) {
    b.connected = isBuildingConnected(world, b, roads);
    if (!needsConnection(b.defId)) continue;
    if (b.outageUntil !== undefined) b.state = 'burning';
    else if (!b.connected) b.state = 'notConnected';
    else if (b.state === 'notConnected') b.state = 'ok';
  }
}
