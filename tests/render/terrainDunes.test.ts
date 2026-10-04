import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { TEX } from '../../src/render/iso';
import { DUNE_ONSET, DUNE_TONE_FLAT } from '../../src/render/dunes';
import {
  buildGrid,
  paintPixels,
  patchGrid,
  terrainCodes,
  terrainPatchRect,
} from '../../src/render/terrain';
import { LAND, terrainFields } from '../../src/render/terrainField';

// H-R12 — Dünen im Sandzweig des Terrains (Stilrahmen D7, S2, S6).

const NODES = TEX / 4; // Knoten je Kachel (RASTER = 4)
const SAND = LAND.indexOf('sand');
const worlds = [1, 7].map((seed) => {
  const world = createWorld(seed, { unlockAll: true });
  return { seed, world, grid: buildGrid(world) };
});
const stepOf = (v: number): number => Math.floor(v + 0.5);

describe('H-R12 Dünen im Terrain', () => {
  it('H-R12 S6 auf Sandkacheln ändert sich die Tonstufe der Düne innerhalb einer Kachel um höchstens 1 (Seeds 1, 7)', () => {
    let tiles = 0,
      violations = 0,
      lit = 0;
    for (const { world, grid } of worlds)
      for (let y = 0; y < world.height; y++)
        for (let x = 0; x < world.width; x++) {
          if (world.tiles[y * world.width + x]!.terrain !== 'sand') continue;
          let lo = 99,
            hi = -99;
          for (let j = 0; j <= NODES; j++)
            for (let i = 0; i <= NODES; i++) {
              const s = stepOf(grid.dtone[(y * NODES + j) * grid.nx + x * NODES + i]!);
              lo = Math.min(lo, s);
              hi = Math.max(hi, s);
            }
          tiles++;
          if (hi - lo > 1) violations++;
          if (hi > DUNE_TONE_FLAT) lit++;
        }
    expect(tiles).toBeGreaterThan(100);
    expect(violations).toBe(0);
    expect(lit).toBeGreaterThan(5); // es gibt Dünen
  });

  it('H-R12 D7 kein Dünenansatz im Saum: Höhe 0 für s < WET_SAND + 1, und Dünen existieren dahinter (Seeds 1, 7)', () => {
    let before = 0,
      after = 0,
      maxBefore = 0,
      maxAfter = 0;
    for (const { grid } of worlds)
      for (let k = 0; k < grid.cls.length; k++) {
        if (grid.cls[k] !== 1 + SAND) continue;
        if (grid.smooth[k]! < DUNE_ONSET) {
          before++;
          maxBefore = Math.max(maxBefore, grid.dune[k]!);
        } else {
          after++;
          maxAfter = Math.max(maxAfter, grid.dune[k]!);
        }
      }
    expect(before).toBeGreaterThan(200);
    expect(after).toBeGreaterThan(50);
    expect(maxBefore).toBe(0);
    expect(maxAfter).toBeGreaterThan(0.5);
  });

  it('H-R12 Tonobergrenze im Bild: die Düne hellt Sand höchstens um eine Stufe auf (Seeds 1, 7, Strand bei 7,32)', () => {
    let litAll = 0;
    for (const { world, grid } of worlds) {
      const x0 = 2,
        y0 = 26,
        w = 14,
        h = 12;
      const flat = {
        ...grid,
        dtone: grid.dtone.map(() => DUNE_TONE_FLAT) as Float32Array,
        rip: grid.rip.map(() => 0) as Float32Array,
      };
      const a = paintPixels(grid, 1, x0 * TEX, y0 * TEX, w * TEX, h * TEX);
      const b = paintPixels(flat, 1, x0 * TEX, y0 * TEX, w * TEX, h * TEX);
      let sandPx = 0,
        lit = 0,
        maxRatio = 0;
      for (let y = 0; y < h * TEX; y += 2)
        for (let x = 0; x < w * TEX; x += 2) {
          const tile = world.tiles[(y0 + ((y / TEX) | 0)) * world.width + x0 + ((x / TEX) | 0)]!;
          if (tile.terrain !== 'sand') continue;
          sandPx++;
          const o = (y * w * TEX + x) * 4;
          const r = (a[o]! + a[o + 1]! + a[o + 2]!) / (b[o]! + b[o + 1]! + b[o + 2]! + 1e-6);
          maxRatio = Math.max(maxRatio, r);
          if (r > 1.05) lit++;
        }
      expect(sandPx).toBeGreaterThan(500);
      // eine Stufe: +8,5 % Helligkeit und warmer Ton (≈ +4 %), dazu Rippeln ±3 %: höchstens +17 %
      expect(maxRatio).toBeLessThan(1.17);
      litAll += lit;
    }
    expect(litAll).toBeGreaterThan(50); // Luvseiten sind heller
  });

  it('H-R12 Sandwechsel: patchGrid gleicht im Rechteck dem Neuaufbau (dtone, dune, rip, rwarp, dtn), der sandRest-Cache wird verworfen', () => {
    const { world: w0 } = worlds[1]!; // Seed 7
    const at = (w: typeof w0, x: number, y: number) => w.tiles[y * w.width + x]!;
    const sandNear = (x: number, y: number): boolean =>
      [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ].some(([dx, dy]) => at(w0, x + dx!, y + dy!).terrain === 'sand');
    let checked = 0,
      withDune = 0;
    for (let y = 2; y < w0.height - 2 && checked < 6; y++)
      for (let x = 2; x < w0.width - 2 && checked < 6; x++) {
        if (at(w0, x, y).terrain !== 'grass' || !sandNear(x, y)) continue;
        const w = createWorld(7, { unlockAll: true });
        const fields = terrainFields(w);
        const grid = buildGrid(w, fields); // füllt den Cache mit dem Abstand vor dem Wechsel
        const prev = terrainCodes(w);
        at(w, x, y).terrain = 'sand';
        const next = terrainCodes(w);
        const rect = terrainPatchRect(prev, next, w.width, w.height)!;
        patchGrid(w, fields, grid, prev, next, rect);
        const full = buildGrid(w);
        for (const f of ['dtone', 'dune', 'rip', 'rwarp', 'dtn'] as const)
          for (let j = rect.y0 * NODES; j <= (rect.y1 + 1) * NODES; j++)
            for (let i = rect.x0 * NODES; i <= (rect.x1 + 1) * NODES; i++) {
              const k = j * grid.nx + i;
              expect(grid[f][k], `${f} Kachel ${x},${y} Knoten ${i},${j}`).toBe(full[f][k]);
              if (f === 'dune' && full.dune[k]! > 0) withDune++;
            }
        checked++;
      }
    expect(checked).toBe(6);
    expect(withDune).toBeGreaterThan(0); // der Vergleich trifft wirklich Dünenknoten
  }, 60_000);
});
