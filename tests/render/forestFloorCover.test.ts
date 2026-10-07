import { describe, expect, it } from 'vitest';
import { home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { sortedObjects } from '../../src/render/iso';
import { LAND, fieldWorld } from '../../src/render/terrainField';
import { buildGrid, landShares, type TerrainGrid } from '../../src/render/terrain';
import { treesOf, woodWorld } from './woodHelpers';

// forestFloorCover.test.ts — WALD-02 Fix-Runde 3 B: kein Waldboden ohne Bäume. Jede Waldkachel trägt sichtbare Bäume,
// der dunkle Boden reicht höchstens etwa 0,3 Kachel über die äusserste Krone hinaus.

const FOREST = LAND.indexOf('forest');
/** Dunkler Waldboden: Anteil Waldboden an der Bodenfarbe (wie `paintPixels`). */
const DARK = 0.5;
/** Reichweite des dunklen Bodens über den Kronenrand (Kacheln): fast überall ≤ REACH, nirgends über REACH_MAX. */
const REACH = 0.3,
  REACH_MAX = 0.45;

const cache = new Map<
  number,
  { w: World; grid: TerrainGrid; free: (x: number, y: number) => boolean }
>();
function scene(seed: number) {
  let s = cache.get(seed);
  if (s) return s;
  const w = woodWorld(seed);
  const isl = home(w);
  const objects = new Set<number>();
  for (const it of sortedObjects(w))
    if (it.kind === 'decor') objects.add(it.fp.y * isl.width + it.fp.x);
  /** Freie Kachel: kein Gebäude, kein Weg, kein Deko-Stempel. */
  const free = (x: number, y: number): boolean => {
    const t = isl.tiles[y * isl.width + x];
    return !!t && t.buildingId === null && !t.road && !objects.has(y * isl.width + x);
  };
  s = { w, grid: buildGrid(fieldWorld(w)), free };
  cache.set(seed, s);
  return s;
}

describe('WALD-02 Fix-Runde 3 B: Waldboden nur unter Bäumen', () => {
  it('RF-W-13 jede freie Waldkachel (Gelände Wald oder dunkler Boden in der Mitte) trägt ≥ 1 Altbaum oder ≥ 2 Jungbäume (Seeds 7, 14)', () => {
    for (const seed of [7, 14]) {
      const { w, grid, free } = scene(seed);
      const isl = home(w);
      const W = isl.width;
      const adult = new Map<number, number>(),
        young = new Map<number, number>();
      for (const c of treesOf(w)) {
        if (c.dead) continue;
        const k = Math.floor(c.fy) * W + Math.floor(c.fx);
        const m = c.young || c.bush ? young : adult;
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      let n = 0;
      for (let y = 0; y < isl.height; y++)
        for (let x = 0; x < W; x++) {
          if (!free(x, y)) continue;
          const forest =
            isl.tiles[y * W + x]!.terrain === 'forest' ||
            landShares(grid, x + 0.5, y + 0.5)[FOREST]! >= DARK;
          if (!forest) continue;
          n++;
          const k = y * W + x;
          expect(
            (adult.get(k) ?? 0) >= 1 || (young.get(k) ?? 0) >= 2,
            `Seed ${seed}: Kachel ${x},${y} ohne sichtbaren Baum`,
          ).toBe(true);
        }
      expect(n).toBeGreaterThan(200);
    }
  }, 20_000); // H-T7: Timeout >= 8 x lokal (R270)

  it('RF-W-14 dunkler Boden höchstens REACH = 0,3 Kachel über den Kronenrand (99 %), nirgends über 0,45 (Seeds 7, 14)', () => {
    for (const seed of [7, 14]) {
      const { w, grid, free } = scene(seed);
      const isl = home(w);
      const W = isl.width;
      const trees = treesOf(w).filter((c) => !c.dead);
      const byTile = new Map<number, typeof trees>();
      for (const c of trees) {
        const k = Math.floor(c.fy) * W + Math.floor(c.fx);
        const l = byTile.get(k);
        if (l) l.push(c);
        else byTile.set(k, [c]);
      }
      const ds: number[] = [];
      let worst = { d: 0, x: 0, y: 0 };
      for (let fy = 0.05; fy < isl.height; fy += 0.1)
        for (let fx = 0.05; fx < W; fx += 0.1) {
          const tx = Math.floor(fx),
            ty = Math.floor(fy);
          if (!free(tx, ty) || landShares(grid, fx, fy)[FOREST]! < DARK) continue;
          let d = Infinity;
          for (let dy = -2; dy <= 2; dy++)
            for (let dx = -2; dx <= 2; dx++)
              for (const c of byTile.get((ty + dy) * W + tx + dx) ?? [])
                d = Math.min(d, Math.hypot(c.fx - fx, c.fy - fy) - c.r);
          d = Math.max(0, d);
          ds.push(d);
          if (d > worst.d) worst = { d, x: fx, y: fy };
        }
      ds.sort((a, b) => a - b);
      expect(ds.length).toBeGreaterThan(10000);
      const q99 = ds[Math.floor(ds.length * 0.99)]!;
      expect(q99, `Seed ${seed}: 99 %-Wert`).toBeLessThanOrEqual(REACH);
      expect(
        worst.d,
        `Seed ${seed}: dunkler Boden bei ${worst.x.toFixed(2)},${worst.y.toFixed(2)}`,
      ).toBeLessThanOrEqual(REACH_MAX);
    }
  }, 30_000); // H-T7: Timeout >= 8 x lokal (R270)
});
