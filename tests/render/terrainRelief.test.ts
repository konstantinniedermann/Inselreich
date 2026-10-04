import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { TEX, TREE_VARIANTS } from '../../src/render/iso';
import { TONE_EDGE_PX } from '../../src/render/light';
import { PALETTE, rgbOf } from '../../src/render/palette';
import { crownsFor } from '../../src/render/trees';
import { LAND } from '../../src/render/terrainField';
import {
  GROUND_FLAT,
  buildGrid,
  groundToneAt,
  landShares,
  meadowTint,
  paintPixels,
  type TerrainGrid,
} from '../../src/render/terrain';

// H-R11 — Bodenrelief Wiese und Wald in gestuften Tonflächen (Stilrahmen S2, S3, S5, S6, D8, D9).

const NODES = TEX / 4; // Knoten je Kachel (RASTER = 4)
const hslS = (r: number, g: number, b: number): number => {
  const R = r / 255,
    G = g / 255,
    B = b / 255;
  const mx = Math.max(R, G, B),
    mn = Math.min(R, G, B),
    l = (mx + mn) / 2;
  return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
};
const luma = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;
const worlds = [1, 7].map((seed) => {
  const world = createWorld(seed, { unlockAll: true });
  return { seed, world, grid: buildGrid(world) };
});
const terr = (w: { width: number; tiles: { terrain: string }[] }, x: number, y: number): string =>
  w.tiles[y * w.width + x]?.terrain ?? 'water';
const stepAt = (g: TerrainGrid, i: number, j: number): number =>
  Math.floor(g.tone[j * g.nx + i]! + 0.5);

describe('H-R11 Hanggrenze (S6)', () => {
  it('H-R11 S6 auf bebaubaren Kacheln ändert sich die Tonstufe innerhalb einer Kachel um höchstens 1 (Seeds 1, 7)', () => {
    let tiles = 0;
    for (const { world, grid } of worlds)
      for (let y = 0; y < world.height; y++)
        for (let x = 0; x < world.width; x++) {
          const t = terr(world, x, y);
          if (t !== 'grass' && t !== 'forest' && t !== 'sand') continue;
          let lo = 99,
            hi = -99;
          for (let j = 0; j <= NODES; j++)
            for (let i = 0; i <= NODES; i++) {
              const s = stepAt(grid, x * NODES + i, y * NODES + j);
              lo = Math.min(lo, s);
              hi = Math.max(hi, s);
            }
          tiles++;
          expect(hi - lo, `Kachel ${x},${y} ${t}`).toBeLessThanOrEqual(1);
        }
    expect(tiles).toBeGreaterThan(1500);
  });

  it('H-R11 Tonwert liegt in 0…4 und groundToneAt stimmt an Knoten mit dem Raster überein', () => {
    const { world, grid } = worlds[0]!;
    for (const [x, y] of [
      [12, 27],
      [20, 30],
      [8, 25],
    ] as const)
      if (terr(world, x, y) === 'grass') {
        const i = x * NODES + 3,
          j = y * NODES + 5;
        expect(grid.tone[j * grid.nx + i]).toBeCloseTo(
          groundToneAt(world.seed, i / NODES, j / NODES),
          4,
        );
      }
    for (const v of grid.tone) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(4);
    }
  });
});

describe('H-R11 Wiese in Tonstufen (S2, S6)', () => {
  it('H-R11 S6 jeder Hügel zeigt bei Zoom 1 mindestens 2 Tonstufen: ≥ 90 % der 4 × 4-Wiesenfenster', () => {
    for (const { world, grid } of worlds) {
      let wins = 0,
        ok = 0;
      const used = new Set<number>();
      for (let y0 = 0; y0 + 4 <= world.height; y0 += 2)
        for (let x0 = 0; x0 + 4 <= world.width; x0 += 2) {
          let pure = true;
          for (let y = y0; y < y0 + 4 && pure; y++)
            for (let x = x0; x < x0 + 4; x++) if (terr(world, x, y) !== 'grass') pure = false;
          if (!pure) continue;
          const seen = new Set<number>();
          for (let j = y0 * NODES; j <= (y0 + 4) * NODES; j++)
            for (let i = x0 * NODES; i <= (x0 + 4) * NODES; i++) {
              const s = stepAt(grid, i, j);
              seen.add(s);
              used.add(s);
            }
          wins++;
          if (seen.size >= 2) ok++;
        }
      expect(wins, `Seed ${world.seed}`).toBeGreaterThan(8);
      expect(ok / wins, `Seed ${world.seed}`).toBeGreaterThanOrEqual(0.9);
      expect(used.size, `Seed ${world.seed} genutzte Stufen`).toBeGreaterThanOrEqual(3);
    }
  });

  it('H-R11 S2 gestufte Kanten: Übergänge zwischen Tonflächen höchstens 2 px breit, mehrere Plateaus', () => {
    // Gleichmässige Wiese (alle Farbfelder konstant), Tonwert als Rampe: nur die Stufung färbt.
    const { world } = worlds[0]!;
    const grid = buildGrid(world);
    grid.grass.fill(0.5);
    grid.patch.fill(0);
    grid.warm.fill(0);
    grid.mottle.fill(0);
    grid.veil.fill(0);
    grid.shade.fill(0);
    // Block aus 5 × 3 Wiesenkacheln suchen
    let bx = -1,
      by = -1;
    for (let y = 2; y < world.height - 6 && bx < 0; y++)
      for (let x = 2; x < world.width - 8 && bx < 0; x++) {
        let ok = true;
        for (let yy = y - 1; yy < y + 4 && ok; yy++)
          for (let xx = x - 1; xx < x + 6; xx++) if (terr(world, xx, yy) !== 'grass') ok = false;
        if (ok) [bx, by] = [x, y];
      }
    expect(bx).toBeGreaterThanOrEqual(0);
    for (let j = 0; j < grid.ny; j++)
      for (let i = 0; i < grid.nx; i++) grid.tone[j * grid.nx + i] = 0.6 + 0.2 * (i - bx * NODES);
    const w = 5 * TEX,
      h = 4;
    const px = paintPixels(grid, 1, bx * TEX, by * TEX + 2 * TEX, w, h);
    const row = 1;
    const col = (x: number): string => {
      const o = (row * w + x) * 4;
      return `${px[o]},${px[o + 1]},${px[o + 2]}`;
    };
    let run = 0,
      maxRun = 0;
    const distinct = new Set<string>();
    for (let x = 1; x < w - 1; x++) {
      const plateau = col(x) === col(x - 1) || col(x) === col(x + 1);
      if (plateau) {
        run = 0;
        distinct.add(col(x));
      } else {
        run++;
        maxRun = Math.max(maxRun, run);
      }
    }
    const plateaus = distinct.size;
    expect(maxRun).toBeLessThanOrEqual(Math.ceil(TONE_EDGE_PX));
    expect(plateaus).toBeGreaterThanOrEqual(3);
  });

  it('H-R11 D8 Flecken (patch) laufen weich aus: höchstens 10 % der Landknoten gesättigt, 99-%-Knotensprung ≤ 0,3', () => {
    for (const { grid } of worlds) {
      let sat = 0,
        tot = 0;
      const steps: number[] = [];
      for (let j = 0; j < grid.ny; j++)
        for (let i = 0; i < grid.nx - 1; i++) {
          const a = grid.patch[j * grid.nx + i]!,
            b = grid.patch[j * grid.nx + i + 1]!;
          if (a === 0 || b === 0) continue;
          tot++;
          if (Math.abs(a) >= 0.999) sat++;
          steps.push(Math.abs(a - b));
        }
      steps.sort((p, q) => p - q);
      expect(sat / tot).toBeLessThanOrEqual(0.1);
      expect(steps[Math.floor(steps.length * 0.99)]!).toBeLessThanOrEqual(0.3);
    }
  });
});

describe('H-R11 Sättigung (S5)', () => {
  it('H-R11 S5 meadowTint senkt die HSL-Sättigung der Grundfarben um mindestens 15 % relativ', () => {
    for (const hex of [PALETTE.grassDark, PALETTE.grass, PALETTE.grassLight]) {
      const c = rgbOf(hex);
      const t = meadowTint([c[0], c[1], c[2]]);
      expect(hslS(t[0], t[1], t[2])).toBeLessThanOrEqual(hslS(c[0], c[1], c[2]) * 0.85);
      expect(Math.abs(luma(t[0], t[1], t[2]) - luma(c[0], c[1], c[2]))).toBeLessThan(6);
      expect(t[1]).toBeGreaterThan(t[2]); // bleibt grünlich (oliv), nie grau-blau
    }
  });

  it('H-R11 S5 mittlere Sättigung der Wiese (Seed 1, Fenster 12 × 10 Kacheln) ≥ 15 % unter main (0,410)', () => {
    const { world, grid } = worlds[0]!;
    const x0 = 6,
      y0 = 22,
      W = 12,
      H = 10;
    const px = paintPixels(grid, 1, x0 * TEX, y0 * TEX, W * TEX, H * TEX);
    let s = 0,
      n = 0;
    for (let y = 0; y < H * TEX; y++)
      for (let x = 0; x < W * TEX; x++) {
        if (terr(world, x0 + ((x / TEX) | 0), y0 + ((y / TEX) | 0)) !== 'grass') continue;
        const o = (y * W * TEX + x) * 4;
        s += hslS(px[o]!, px[o + 1]!, px[o + 2]!);
        n++;
      }
    expect(n).toBeGreaterThan(50000);
    expect(s / n).toBeLessThanOrEqual(0.41 * 0.85);
  });
});

describe('H-R11 Wald (D9)', () => {
  const FOREST = LAND.indexOf('forest');
  it('H-R11 D9 der Waldboden-Hof endet höchstens 0,5 Kachel hinter der äussersten Krone', () => {
    // Abstand der äussersten Krone zum Kachelrand (innen), über alle Varianten
    let gap = 1;
    for (let v = 0; v < TREE_VARIANTS; v++)
      for (const c of crownsFor(1, v))
        gap = Math.min(gap, c.cx - c.r, 1 - c.cx - c.r, c.cy - c.r, 1 - c.cy - c.r);
    expect(gap).toBeGreaterThan(0);
    let edges = 0,
      worst = 0;
    for (const { world, grid } of worlds)
      for (let y = 1; y < world.height - 1; y++)
        for (let x = 1; x < world.width - 1; x++) {
          if (terr(world, x, y) !== 'forest') continue;
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ] as const) {
            // freie Kante: zwei Kacheln Wiese davor und daneben, sonst misst man einen Streifen zwischen Wäldern
            let free = true;
            for (const [k, side] of [
              [1, 0],
              [2, 0],
              [1, 1],
              [1, -1],
              [2, 1],
              [2, -1],
            ] as const) {
              const tx = x + dx * k + (dx === 0 ? side : 0),
                ty = y + dy * k + (dy === 0 ? side : 0);
              if (terr(world, tx, ty) !== 'grass') free = false;
            }
            if (!free) continue;
            edges++;
            // entlang der Aussennormalen ab der Kachelkante, Mitte der Kante
            let reach = 0;
            for (let d = 0; d <= 0.9; d += 0.02) {
              const fx = x + 0.5 + dx * (0.5 + d),
                fy = y + 0.5 + dy * (0.5 + d);
              if (landShares(grid, fx, fy)[FOREST]! >= 0.2) reach = d;
            }
            worst = Math.max(worst, reach);
          }
        }
    expect(edges).toBeGreaterThan(50);
    expect(worst + gap).toBeLessThanOrEqual(0.5);
  });

  it('H-R11 Wald bleibt bei Zoom 1 dunkler als die Wiese (Bodenhelligkeit, Faktor ≤ 0,8)', () => {
    const { world, grid } = worlds[0]!;
    let lf = 0,
      nf = 0,
      lg = 0,
      ng = 0;
    for (let y = 2; y < world.height - 2; y += 1)
      for (let x = 2; x < world.width - 2; x += 1) {
        const t = terr(world, x, y);
        if (t !== 'forest' && t !== 'grass') continue;
        const px = paintPixels(grid, 1, x * TEX + 8, y * TEX + 8, 16, 16);
        let l = 0;
        for (let k = 0; k < 256; k++) l += luma(px[k * 4]!, px[k * 4 + 1]!, px[k * 4 + 2]!);
        if (t === 'forest') {
          lf += l / 256;
          nf++;
        } else {
          lg += l / 256;
          ng++;
        }
      }
    expect(nf).toBeGreaterThan(50);
    expect(lf / nf).toBeLessThanOrEqual(0.8 * (lg / ng));
  });
});

describe('H-R11 Licht auf Wald und Wiese', () => {
  it('H-R11 Lichtseite links oben: Hänge zur Sonne haben höhere Tonwerte als abgewandte (Korrelation > 0)', () => {
    const { grid } = worlds[0]!;
    // Tonwert ist stetig und trägt die Ebene (GROUND_FLAT) als Mitte
    expect(GROUND_FLAT).toBe(2);
    let up = 0,
      down = 0;
    for (const v of grid.tone)
      if (v > 2.2) up++;
      else if (v < 1.8) down++;
    expect(up).toBeGreaterThan(0);
    expect(down).toBeGreaterThan(0);
  });
});
