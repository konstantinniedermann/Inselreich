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

/** Rechteck des eigenen Grundrisses (Kachel `x`,`y`, Breite `w`, Höhe `h`). */
export interface OwnRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Wie `tilesInRadius` + `countTerrain` bzw. `countFreeTerrain`, aber ohne Zwischenfelder.
 * Mit `own` zählen nur unbebaute, wegfreie Kacheln ausserhalb des eigenen Grundrisses.
 */
export function countTerrainAround(
  isl: Island,
  cx: number,
  cy: number,
  r: number,
  terrain: Terrain,
  own?: OwnRect,
): number {
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(isl.width - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(isl.height - 1, Math.ceil(cy + r));
  let n = 0;
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > r) continue;
      const t = isl.tiles[y * isl.width + x];
      if (t === undefined || t.terrain !== terrain) continue;
      if (own !== undefined) {
        if (t.buildingId !== null || t.road) continue;
        if (x >= own.x && x < own.x + own.w && y >= own.y && y < own.y + own.h) continue;
      }
      n++;
    }
  }
  return n;
}
