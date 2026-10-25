import type { Island, Terrain } from './types';
import { tileAt, type Pos } from './world';

/** Zählt die Kacheln des Geländes unter `tiles`. */
export const countTerrain = (isl: Island, tiles: Pos[], terrain: Terrain): number =>
  tiles.filter((p) => tileAt(isl, p.x, p.y)?.terrain === terrain).length;

/** Zählt nur Kacheln des Geländes, die unbebaut, ohne Weg und ausserhalb des eigenen Grundrisses sind. */
export function countFreeTerrain(isl: Island, tiles: Pos[], terrain: Terrain, own: Pos[]): number {
  return tiles.filter((p) => {
    const t = tileAt(isl, p.x, p.y);
    if (t === undefined || t.terrain !== terrain || t.buildingId !== null || t.road) return false;
    return !own.some((o) => o.x === p.x && o.y === p.y);
  }).length;
}
