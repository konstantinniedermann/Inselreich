import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { TEX } from '../../src/render/iso';
import { terrainFields } from '../../src/render/terrainField';
import {
  buildGrid,
  foothillField,
  foothillProx,
  foothillRise,
  groundHeight,
  paintPixels,
  patchGrid,
  terrainCodes,
  terrainPatchRect,
} from '../../src/render/terrain';

// H-R13 — Vorberge und Gebirgsfuss (Stilrahmen D6, S6): stetiges Nähefeld statt Kachel-Gate.

const NODES = TEX / 4;
const SEEDS = [1, 2, 3, 5, 14];
const setups = SEEDS.map((seed) => {
  const world = createWorld(seed, { unlockAll: true });
  const fields = terrainFields(world);
  return { seed, world, fields, grid: buildGrid(world, fields), near: foothillField(fields) };
});
const terr = (
  w: { width: number; height: number; tiles: { terrain: string }[] },
  x: number,
  y: number,
) =>
  x < 0 || y < 0 || x >= w.width || y >= w.height ? 'water' : w.tiles[y * w.width + x]!.terrain;
const mdist = (w: Parameters<typeof terr>[0], x: number, y: number): number => {
  let best = 99;
  for (let dy = -8; dy <= 8; dy++)
    for (let dx = -8; dx <= 8; dx++)
      if (terr(w, x + dx, y + dy) === 'mountain') best = Math.min(best, Math.hypot(dx, dy));
  return best;
};

describe('H-R13 Nähefeld (B3 stetig)', () => {
  it('H-R13 B3 foothillProx ist stetig: Schritte von 1/16 Kachel ändern es um höchstens 0,06 (Seeds 1, 2, 3, 5, 14)', () => {
    let maxStep = 0,
      n = 0,
      high = 0;
    for (const { world, near } of setups)
      for (let y = 2; y < world.height - 2; y += 0.37) {
        let prev = foothillProx(near, 2, y);
        for (let x = 2 + 1 / 16; x < world.width - 2; x += 1 / 16) {
          const v = foothillProx(near, x, y);
          maxStep = Math.max(maxStep, Math.abs(v - prev));
          if (v > 0.2 && v < 0.8) n++;
          if (v > 0.9) high++;
          prev = v;
        }
      }
    expect(n).toBeGreaterThan(500); // es gibt Übergangswerte (kein 0/1-Gate)
    expect(high).toBeGreaterThan(500);
    expect(maxStep).toBeLessThanOrEqual(0.06);
  });

  it('H-R13 foothillProx: 0 ab 6 Kacheln Abstand, am Gebirgsrand nahe 1', () => {
    for (const { world, near } of setups) {
      let far = 0,
        edge = 0,
        edgeSum = 0;
      for (let y = 1; y < world.height - 1; y++)
        for (let x = 1; x < world.width - 1; x++) {
          const d = mdist(world, x, y);
          const v = foothillProx(near, x + 0.5, y + 0.5);
          if (d >= 6) {
            far++;
            expect(v, `Seed ${world.seed} ${x},${y}`).toBe(0);
          }
          if (d === 1 && terr(world, x, y) !== 'mountain') {
            edge++;
            edgeSum += v;
          }
        }
      expect(far).toBeGreaterThan(100);
      expect(edge).toBeGreaterThan(5);
      expect(edgeSum / edge, `Seed ${world.seed}`).toBeGreaterThan(0.4);
    }
  });

  it('H-R13 B3 Schuttanteil der Wiese ist stetig: Nachbarknoten unterscheiden sich um höchstens 0,2 und er bleibt vor dem Fuss', () => {
    for (const { world, grid } of setups) {
      let max = 0,
        sum = 0,
        farSum = 0;
      for (let j = 0; j < grid.ny; j++)
        for (let i = 0; i < grid.nx - 1; i++) {
          const k = j * grid.nx + i;
          max = Math.max(max, Math.abs(grid.scree[k + 1]! - grid.scree[k]!));
          const tx = Math.floor(i / NODES),
            ty = Math.floor(j / NODES);
          if (mdist(world, tx, ty) >= 6) farSum += grid.scree[k]!;
          else sum += grid.scree[k]!;
        }
      expect(max, `Seed ${world.seed}`).toBeLessThanOrEqual(0.2);
      expect(sum, `Seed ${world.seed}`).toBeGreaterThan(5);
      expect(farSum, `Seed ${world.seed}`).toBe(0);
    }
  });
});

describe('H-R13 Vorberge', () => {
  it('H-R13 B2 Vorberge: das Gelände 1–3 Kacheln vor dem Massiv liegt im Mittel mindestens 0,4 Kachelhöhen über dem fernen (≥ 8 Kacheln)', () => {
    let seen = 0;
    for (const { seed, world, near } of setups) {
      let nearS = 0,
        nearN = 0,
        farS = 0,
        farN = 0;
      for (let y = 0; y < world.height; y++)
        for (let x = 0; x < world.width; x++) {
          if (terr(world, x, y) !== 'grass') continue;
          const d = mdist(world, x, y);
          if (d > 3 && d < 8) continue;
          const h = groundHeight(
            seed,
            x + 0.5,
            y + 0.5,
            foothillProx(near, x + 0.5, y + 0.5),
            foothillRise(near, x + 0.5, y + 0.5),
          );
          if (d <= 3) {
            nearS += h;
            nearN++;
          } else {
            farS += h;
            farN++;
          }
        }
      if (nearN < 30 || farN < 30) continue;
      seen++;
      expect(nearS / nearN - farS / farN, `Seed ${seed}`).toBeGreaterThanOrEqual(0.4);
    }
    expect(seen).toBeGreaterThanOrEqual(3);
  });

  it('H-R13 S6 Hanggrenze: in der Vorbergzone ändert sich die Tonstufe auf bebaubaren Kacheln innerhalb einer Kachel um höchstens 1', () => {
    let tiles = 0;
    for (const { world, grid } of setups)
      for (let y = 0; y < world.height; y++)
        for (let x = 0; x < world.width; x++) {
          const t = terr(world, x, y);
          if (t !== 'grass' && t !== 'forest' && t !== 'sand') continue;
          if (mdist(world, x, y) > 5) continue;
          let lo = 99,
            hi = -99;
          for (let j = 0; j <= NODES; j++)
            for (let i = 0; i <= NODES; i++) {
              const s = Math.floor(grid.tone[(y * NODES + j) * grid.nx + x * NODES + i]! + 0.5);
              lo = Math.min(lo, s);
              hi = Math.max(hi, s);
            }
          tiles++;
          expect(hi - lo, `Seed ${world.seed} Kachel ${x},${y} ${t}`).toBeLessThanOrEqual(1);
        }
    expect(tiles).toBeGreaterThan(300);
  });

  it('H-R13 B1 Massivkern (2 Kacheln nach innen) hängt weder vom Bodenton noch vom Schuttanteil ab', () => {
    const { world, grid } = setups[0]!;
    let checked = 0;
    for (let y = 2; y < world.height - 2 && checked < 4; y++)
      for (let x = 2; x < world.width - 2 && checked < 4; x++) {
        let core = true;
        for (let dy = -2; dy <= 2 && core; dy++)
          for (let dx = -2; dx <= 2; dx++)
            if (terr(world, x + dx, y + dy) !== 'mountain') core = false;
        if (!core) continue;
        checked++;
        const a = paintPixels(grid, 1, x * TEX, y * TEX, TEX, TEX);
        const flat = {
          ...grid,
          tone: grid.tone.map(() => 2) as Float32Array,
          scree: grid.scree.map(() => 0) as Float32Array,
        };
        const b = paintPixels(flat, 1, x * TEX, y * TEX, TEX, TEX);
        expect(Array.from(a)).toEqual(Array.from(b));
        x += 4;
      }
    expect(checked).toBeGreaterThan(0);
  });
});

describe('H-R13 Teil-Neuzeichnung', () => {
  it('H-R13 patchGrid am Gebirgsfuss ergibt für scree/tint/shade/tone dasselbe Raster wie der Vollaufbau; Pixel im Rechteck gleich', () => {
    for (const seed of [14, 1]) {
      const w = createWorld(seed, { unlockAll: true });
      // Wiesenkachel mit Gebirge in 1–2 Kacheln Abstand, die bebaubar ist (Roden/Aufforsten: Gras → Wald)
      let tx = -1,
        ty = -1;
      for (let y = 2; y < w.height - 2 && tx < 0; y++)
        for (let x = 2; x < w.width - 2 && tx < 0; x++)
          if (terr(w, x, y) === 'grass' && mdist(w, x, y) <= 2 && mdist(w, x, y) >= 1)
            [tx, ty] = [x, y];
      expect(tx, `Seed ${seed}`).toBeGreaterThanOrEqual(0);
      const fields = terrainFields(w);
      const grid = buildGrid(w, fields);
      const prev = terrainCodes(w);
      w.tiles[ty * w.width + tx]!.terrain = 'forest';
      const next = terrainCodes(w);
      const rect = terrainPatchRect(prev, next, w.width, w.height)!;
      // Rechteck vorher verderben: ohne Abgleich im Patch bliebe es falsch
      const k = TEX / 4;
      for (const f of ['scree', 'tint', 'shade', 'tone'] as const)
        for (let j = rect.y0 * k; j <= (rect.y1 + 1) * k; j++)
          for (let i = rect.x0 * k; i <= (rect.x1 + 1) * k; i++) grid[f][j * grid.nx + i] = 9;
      patchGrid(w, fields, grid, prev, next, rect);
      const full = buildGrid(w);
      for (const f of ['scree', 'tint', 'shade', 'tone'] as const)
        expect(firstDiff(grid[f], full[f]), `Seed ${seed} ${f}`).toBe(-1);
      const x0 = rect.x0 * TEX,
        y0 = rect.y0 * TEX,
        pw = (rect.x1 - rect.x0 + 1) * TEX,
        ph = (rect.y1 - rect.y0 + 1) * TEX;
      expect(
        firstDiff(paintPixels(grid, 1, x0, y0, pw, ph), paintPixels(full, 1, x0, y0, pw, ph)),
        `Seed ${seed} Pixel`,
      ).toBe(-1);
    }
  }, 30000);
});

const firstDiff = (a: ArrayLike<number>, b: ArrayLike<number>): number => {
  if (a.length !== b.length) return 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return i;
  return -1;
};
