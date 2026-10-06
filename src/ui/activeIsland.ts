// activeIsland.ts — rein: welche Insel der Spieler gerade ansieht (UI-Zustand, nicht im Spielstand; M12 E2).
import type { World } from '../sim/types';

/** Insel im Archipel in Kacheln; `x1`/`y1` exklusiv. */
export interface IslandRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/**
 * Aktive Insel aus der Bildmitte `center` (Archipel-Kacheln). Liegt die Mitte in einem Rechteck, ist es diese
 * Insel, sonst die mit der nächsten Mitte (Gleichstand: kleinerer Index). D-143: ohne `seafaring` immer 0.
 */
export function activeIsland(
  rects: readonly IslandRect[],
  center: { x: number; y: number },
  seafaring: boolean,
): number {
  if (!seafaring || rects.length === 0) return 0;
  const inside = rects.findIndex(
    (r) => center.x >= r.x0 && center.x < r.x1 && center.y >= r.y0 && center.y < r.y1,
  );
  if (inside >= 0) return inside;
  let best = 0;
  let bestDist = Infinity;
  rects.forEach((r, i) => {
    const d = Math.sqrt(((r.x0 + r.x1) / 2 - center.x) ** 2 + ((r.y0 + r.y1) / 2 - center.y) ** 2);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

/** Rechteck je Insel in Archipel-Kacheln (Lage `ox`/`oy`, Grösse `width`/`height`). */
export function islandRects(world: World): IslandRect[] {
  return world.islands.map((i) => ({
    x0: i.ox,
    y0: i.oy,
    x1: i.ox + i.width,
    y1: i.oy + i.height,
  }));
}
