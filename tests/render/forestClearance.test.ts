import { describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import type { Building, World } from '../../src/sim/types';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { placeBuilding } from '../../src/sim/build';
import { canPlace } from '../../src/sim/placement';
import { bodyHull, sortedObjects } from '../../src/render/iso';
import type { TreeItem } from '../../src/render/trees';
import { crownPolys } from '../../src/render/life';
import type { Camera } from '../../src/render/camera';
import { homeBuildings } from '../../src/render/homeBuildings';
import { treesOf } from './woodHelpers';

// forestClearance.test.ts — WALD-02 Fix-Runde 3 A: Bäume am Gebäude im Wald. Kein Stammfuss auf dem Footprint; die
// Kronen davor decken die Fassade nicht stärker als auf main (Bäume vor Gebäuden bleiben: Verdeckung, Fensterlicht).

/** Welt wie die Galerie: Holzfällerhütte so nah wie möglich an der dichtesten Waldstelle (7 × 7). */
function worldWithHut(seed: number): World {
  const w = createWorld(seed, { unlockAll: true });
  w.money = 1e6;
  const isl = home(w);
  for (const k of Object.keys(isl.stock)) (isl.stock as Record<string, number>)[k] = 400;
  const W = isl.width,
    H = isl.height;
  let best = [0, 0],
    bs = -1;
  for (let y = 3; y < H - 3; y++)
    for (let x = 3; x < W - 3; x++) {
      let n = 0;
      for (let dy = -3; dy <= 3; dy++)
        for (let dx = -3; dx <= 3; dx++)
          if (isl.tiles[(y + dy) * W + x + dx]!.terrain === 'forest') n++;
      if (n > bs) {
        bs = n;
        best = [x, y];
      }
    }
  let at: number[] | null = null,
    bd = Infinity;
  for (let y = 2; y < H - 2; y++)
    for (let x = 2; x < W - 2; x++) {
      if (!canPlace(w, 'lumberjack', x, y).ok) continue;
      const d = Math.hypot(x - best[0]!, y - best[1]!);
      if (d < bd) {
        bd = d;
        at = [x, y];
      }
    }
  expect(at).not.toBeNull();
  expect(placeBuilding(w, 'lumberjack', at![0]!, at![1]!).ok).toBe(true);
  return w;
}

type P = { x: number; y: number };
const inPoly = (poly: readonly P[], x: number, y: number): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!,
      b = poly[j]!;
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};
/** Anteil der Körperhülle, den die Kronenumrisse (`crownPolys`) der davor gezeichneten Wald-Objekte decken. */
function coverage(w: World, b: Building): number {
  const items = sortedObjects(w);
  const hull = bodyHull(BUILDING_DEFS[b.defId], b);
  const bi = items.findIndex((i) => i.kind === 'building' && i.id === b.id);
  const cam = { x: 0, y: 0, zoom: 1, viewW: 0, viewH: 0 } as unknown as Camera;
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  for (const p of hull) {
    x0 = Math.min(x0, p.x);
    x1 = Math.max(x1, p.x);
    y0 = Math.min(y0, p.y);
    y1 = Math.max(y1, p.y);
  }
  const polys = items
    .slice(bi + 1)
    .filter((i): i is TreeItem => i.kind === 'tree')
    .flatMap((i) => crownPolys(cam, i, w.seed))
    .filter((p) => p.some((q) => q.x > x0 - 40 && q.x < x1 + 40 && q.y > y0 - 60 && q.y < y1 + 60));
  let n = 0,
    c = 0;
  for (let y = Math.floor(y0) + 0.5; y < y1; y++)
    for (let x = Math.floor(x0) + 0.5; x < x1; x++) {
      if (!inPoly(hull, x, y)) continue;
      n++;
      if (polys.some((p) => inPoly(p, x, y))) c++;
    }
  return c / n;
}

/** Deckung auf main (Kronenstempel vor WALD-02), gleiche Messung: Seed → Gebäudetyp → Anteil. */
const MAIN_COVER: Record<number, Record<string, number>> = {
  1: { kontor: 0.0, lumberjack: 0.041 },
  11: { kontor: 0.006, lumberjack: 0.018 },
};

describe('WALD-02 Fix-Runde 3 A: Bäume am Gebäude', () => {
  it('RF-W-12 kein Stammfuss auf einer Gebäudekachel; Kronen decken ≤ 30 % der Körperhülle und ≤ main + 5 Prozentpunkte (Seed 1 Hütte, Seed 11 Kontor)', () => {
    let front = 0;
    for (const seed of [1, 11]) {
      const w = worldWithHut(seed);
      const isl = home(w);
      const bs = homeBuildings(w);
      expect(bs.map((b) => b.defId)).toEqual(expect.arrayContaining(['kontor', 'lumberjack']));
      for (const c of treesOf(w)) {
        const t = isl.tiles[Math.floor(c.fy) * isl.width + Math.floor(c.fx)]!;
        expect(t.buildingId, `Seed ${seed}: Fuss ${c.fx.toFixed(2)},${c.fy.toFixed(2)}`).toBeNull();
      }
      for (const b of bs) {
        const cov = coverage(w, b);
        const label = `Seed ${seed}: ${b.defId}@${b.x},${b.y} ${(cov * 100).toFixed(1)} %`;
        expect(cov, label).toBeLessThanOrEqual(0.3);
        expect(cov, label).toBeLessThanOrEqual((MAIN_COVER[seed]![b.defId] ?? 0.25) + 0.05);
        // Bäume stehen weiter vor dem Haus (Verdeckung bleibt möglich)
        for (const c of treesOf(w)) {
          const dx = Math.floor(c.fx) - b.x,
            dy = Math.floor(c.fy) - b.y;
          const def = BUILDING_DEFS[b.defId];
          if (dx >= 0 && dy >= 0 && dx <= def.w && dy <= def.h && (dx === def.w || dy === def.h))
            front++;
        }
      }
    }
    expect(front).toBeGreaterThan(0);
  });
});
