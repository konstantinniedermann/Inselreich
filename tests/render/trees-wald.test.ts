import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import { TEX, project } from '../../src/render/iso';
import { crownPolys } from '../../src/render/life';
import { fieldWorld } from '../../src/render/terrainField';
import { buildGrid, paintPixels } from '../../src/render/terrain';
import { forestClearing, forestType, woodLayout, type TileClass } from '../../src/render/forest';
import { SAUM_LEVEL, saumAt, woodBlur } from '../../src/render/woodField';
import {
  GIANT_SCALE,
  TREE_H,
  crownGeom,
  crownScreen,
  paintCrown,
  type Crown,
} from '../../src/render/trees';
import { valueNoise } from '../../src/sim/noise';
import { forceRect } from '../sim/helpers';
import { fakeCtx } from './fakeCtx';
import { treeItems, treesOf, woodWorld } from './woodHelpers';

// trees-wald.test.ts — ART-STIL-02 L1 „Wald organisch", WALD-02 „gewachsen statt gestempelt": Kronen, Waldboden,
// Licht-Verdeckung und Formen auf echten Karten.

const SEEDS = [1, 2, 5, 7];
const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;

/** Kronenart je Waldtyp über 40 Seeds, schnell auf einem kleinen Rauschraster. */
function kindsOf(seed: number): Set<number> {
  const N = 24;
  const f = (x: number, y: number) => valueNoise(seed + 77, x / 5, y / 5) > 0.45;
  const L = woodLayout({
    seed,
    w: N,
    h: N,
    terrainForest: f,
    cls: (x, y): TileClass =>
      x < 0 || y < 0 || x >= N || y >= N ? 'blocked' : f(x, y) ? 'forest' : 'meadow',
  });
  return new Set(
    L.cells.flatMap((c) => c.crowns.filter((k) => !k.bush && !k.dead).map((k) => k.kind)),
  );
}

describe('L1-T2 Überhang nur auf Wald und freie Wiese', () => {
  it('L1-T2 kein Kronenfuss (Mitte ± Radius) auf Gebäude-, Weg- oder Sandkacheln', () => {
    for (const seed of SEEDS) {
      const world = createWorld(seed);
      const isl = home(world);
      const k = world.buildings[isl.kontorId]!;
      const x0 = k.x + 3,
        y0 = k.y + 3;
      forceRect(world, x0 - 2, y0 - 2, 22, 14, 'grass');
      forceRect(world, x0, y0, 18, 10, 'forest');
      // Weg quer durch den Wald (Spalte), Sand am Waldrand (Zeile), ein Haus am Waldrand
      for (let y = y0; y < y0 + 10; y++) isl.tiles[y * isl.width + x0 + 9]!.road = true;
      for (let x = x0 + 2; x < x0 + 8; x++) isl.tiles[(y0 + 9) * isl.width + x]!.terrain = 'sand';
      isl.tiles[(y0 + 3) * isl.width + x0]!.buildingId = k.id;
      let checked = 0;
      for (const c of treesOf(world)) {
        if (c.giant) continue;
        for (const fx of [c.fx - c.r + 1e-9, c.fx + c.r - 1e-9])
          for (const fy of [c.fy - c.r + 1e-9, c.fy + c.r - 1e-9]) {
            // Ecken der Hüllbox nur, wenn sie in der Fussscheibe liegen; sonst die Achsenpunkte
            const px =
              Math.abs(fx - c.fx) > 0 && Math.abs(fy - c.fy) > 0
                ? c.fx + (fx - c.fx) * Math.SQRT1_2
                : fx;
            const py =
              Math.abs(fx - c.fx) > 0 && Math.abs(fy - c.fy) > 0
                ? c.fy + (fy - c.fy) * Math.SQRT1_2
                : fy;
            for (const [qx, qy] of [
              [px, py],
              [fx, c.fy],
              [c.fx, fy],
            ] as const) {
              const tile = isl.tiles[Math.floor(qy) * isl.width + Math.floor(qx)]!;
              const ok =
                tile.buildingId === null &&
                !tile.road &&
                (tile.terrain === 'forest' || tile.terrain === 'grass');
              expect(
                ok,
                `Seed ${seed} Krone ${c.fx.toFixed(2)},${c.fy.toFixed(2)} auf ${Math.floor(qx)},${Math.floor(qy)}`,
              ).toBe(true);
              checked++;
            }
          }
      }
      expect(checked).toBeGreaterThan(500);
    }
  }, 15_000); // H-T7: lokal 1,3 s, Timeout >= 8 x lokal (R270)
});

describe('L1-T5 Licht-Verdeckung folgt den Kronen', () => {
  it('L1-T5 je Objekt: ein Vieleck je lebender Krone, Mitte auf der gezeichneten Krone (± 0,5 px bei Zoom 1)', () => {
    const cam = { x: 0, y: 0, zoom: 1 };
    for (const seed of [7, 2]) {
      const items = treeItems(woodWorld(seed));
      for (const t of items.filter((_, i) => i % 9 === 0)) {
        const polys = crownPolys(cam, t, seed);
        const crowns = t.crowns.filter((c) => !c.dead);
        expect(polys).toHaveLength(crowns.length);
        const o = project(t.fp.x + 0.5, t.fp.y + 0.5);
        crowns.forEach((c, i) => {
          const sc = crownScreen(c);
          const { ctx, log } = fakeCtx();
          paintCrown(ctx, c, sc.x, sc.y);
          const pts = log.allPoints;
          const x = (Math.min(...pts.map((p) => p.x)) + Math.max(...pts.map((p) => p.x))) / 2;
          const y = (Math.min(...pts.map((p) => p.y)) + Math.max(...pts.map((p) => p.y))) / 2;
          const poly = polys[i]!;
          const px = (Math.min(...poly.map((p) => p.x)) + Math.max(...poly.map((p) => p.x))) / 2;
          const py = (Math.min(...poly.map((p) => p.y)) + Math.max(...poly.map((p) => p.y))) / 2;
          expect(Math.abs(px - o.x - x)).toBeLessThanOrEqual(0.5);
          expect(Math.abs(py - o.y - y)).toBeLessThanOrEqual(0.5);
        });
      }
    }
  });
});

describe('L1-T6 Determinismus und Waldtyp', () => {
  it('L1-T6 gleicher Seed: identische Wald-Objekte über zwei Aufbauten', () => {
    for (const seed of SEEDS) {
      const pick = (w: ReturnType<typeof createWorld>) =>
        treeItems(w).map((t) => [t.id, t.fp.x, t.fp.y, t.own, t.crowns]);
      expect(pick(createWorld(seed))).toEqual(pick(createWorld(seed)));
    }
  });

  it('L1-T6 die Kronenart folgt dem Waldtyp: Pinie nur im Pinienwald, Laub und Nadel im Mischwald, Ahorn oder Birke als Akzent', () => {
    let maple = 0,
      birch = 0;
    for (let s = 1; s <= 40; s++) {
      const k = kindsOf(s);
      if (forestType(s) === 3) expect(k.has(3), `Seed ${s}`).toBe(true);
      else expect(k.has(3), `Seed ${s}`).toBe(false);
      if (forestType(s) === 0) {
        expect(k.has(0) && k.has(1), `Seed ${s}`).toBe(true);
        if (k.has(4)) maple++;
        if (k.has(2)) birch++;
      }
    }
    expect(maple).toBeGreaterThan(0);
    expect(birch).toBeGreaterThan(0);
  });
});

describe('L1-T7 kein Math.random', () => {
  it('L1-T7 trees.ts, forest.ts, crown.ts und woodField.ts enthalten kein Math.random', () => {
    for (const f of ['trees', 'forest', 'crown', 'woodField'])
      expect(readFileSync(`src/render/${f}.ts`, 'utf8')).not.toMatch(/Math\.random/);
  });
});

describe('AK Höhe und Form (echte Karten)', () => {
  it('AK Höhe: keine Krone über TREE_H über ihrem Fuss (ausser Riesenbaum ≤ 1,8 × TREE_H)', () => {
    for (const seed of [...SEEDS, 11, 14]) {
      const cs = treesOf(woodWorld(seed));
      for (const c of cs) {
        const s = crownScreen(c);
        const foot = ((c.cx + c.cy - 1) * 32) / 2;
        expect(foot - (s.y - s.ry), `Seed ${seed}`).toBeLessThanOrEqual(
          (c.giant ? GIANT_SCALE : 1) * TREE_H + 1e-6,
        );
      }
    }
  });

  it('AK Laubkronen bestehen aus ≥ 3 Lappen in 3 Tonstufen, Nadelbäume aus ≥ 3 Etagen', () => {
    let laub = 0,
      nadel = 0;
    for (const seed of SEEDS)
      for (const c of treesOf(woodWorld(seed)).filter((_, i) => i % 5 === 0)) {
        if (c.dead) continue;
        const g = crownGeom(c);
        const { ctx, log } = fakeCtx();
        paintCrown(ctx, c, 0, 0);
        const fills = log.events.filter((e) => e.op === 'fill');
        if (c.kind === 1 && !c.bush) {
          expect(g.tiers.length).toBeGreaterThanOrEqual(3);
          expect(fills.filter((e) => e.points.length === 3).length).toBeGreaterThanOrEqual(9);
          nadel++;
        } else {
          expect(g.lobes.length).toBeGreaterThanOrEqual(3);
          expect(fills.length).toBeGreaterThanOrEqual(2 * g.lobes.length + 1);
          expect(new Set(fills.map((e) => e.style)).size).toBe(3);
          laub++;
        }
      }
    expect(laub).toBeGreaterThan(100);
    expect(nadel).toBeGreaterThan(20);
  });

  it('Fix-3 Laub-Jungbäume: Stamm höchstens 1/3 der Gesamthöhe sichtbar, Krone breiter als hoch', () => {
    let n = 0;
    for (const seed of SEEDS)
      for (const c of treesOf(woodWorld(seed))) {
        if (!c.young || c.bush || c.dead || c.kind === 1 || c.kind === 3) continue;
        const g = crownGeom(c);
        expect((c.h - g.hh) / (c.h + g.hh), `Seed ${seed}`).toBeLessThanOrEqual(1 / 3 + 1e-6);
        expect(g.hh / g.hw).toBeLessThan(0.85);
        n++;
      }
    expect(n).toBeGreaterThan(50);
  });

  it('Fix-4 Pinie: Schirm aus 3–5 überlappenden Lappen, kurzer Stamm', () => {
    let n = 0;
    for (const seed of [2, 5])
      for (const c of treesOf(woodWorld(seed))) {
        if (c.kind !== 3 || c.bush || c.dead) continue;
        const g = crownGeom(c);
        expect(g.lobes.length).toBeGreaterThanOrEqual(3);
        expect(g.lobes.length).toBeLessThanOrEqual(5);
        g.lobes.forEach((l, i) =>
          expect(
            g.lobes.some(
              (m, j) => j !== i && Math.hypot(m.x - l.x, (m.y - l.y) * 2) < (l.rx + m.rx) * 0.9,
            ),
          ).toBe(true),
        );
        expect(c.h - g.hh).toBeLessThanOrEqual(1.2 * g.hh + 1e-6);
        n++;
      }
    expect(n).toBeGreaterThan(20);
  });

  it('Fix-4 Nadelkern: im Mittel 3–12 Bäume je Kernkachel; Altfichten breit (Höhe : Breite im Median 1,6–2,6), Jungfichten schlank (Median ≥ 2,6) und kleiner, 3–5 Etagen', () => {
    for (const seed of [7, 14]) {
      const w = woodWorld(seed);
      const isl = home(w);
      const per = new Map<number, number>();
      const asp: number[] = [],
        aspY: number[] = [],
        rA: number[] = [],
        rY: number[] = [];
      const tiersN = new Set<number>();
      for (const c of treesOf(w)) {
        if (c.dead || c.bush) continue;
        const k = Math.floor(c.fy) * isl.width + Math.floor(c.fx);
        per.set(k, (per.get(k) ?? 0) + 1);
        if (c.kind === 1) {
          const g = crownGeom(c);
          (c.young ? aspY : asp).push(g.hh / g.hw);
          (c.young ? rY : rA).push(c.r);
          tiersN.add(g.tiers.length);
        }
      }
      let n = 0,
        sum = 0;
      for (let y = 2; y < isl.height - 2; y++)
        for (let x = 2; x < isl.width - 2; x++) {
          let core = true;
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++)
              core &&= isl.tiles[(y + dy) * isl.width + x + dx]!.terrain === 'forest';
          if (!core) continue;
          n++;
          sum += per.get(y * isl.width + x) ?? 0;
        }
      expect(n).toBeGreaterThan(10);
      expect(sum / n).toBeGreaterThanOrEqual(3);
      expect(sum / n).toBeLessThanOrEqual(12);
      const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)]!;
      expect(med(asp)).toBeGreaterThanOrEqual(1.6);
      expect(med(asp)).toBeLessThanOrEqual(2.6);
      expect(med(aspY)).toBeGreaterThanOrEqual(2.6);
      expect(med(rY)).toBeLessThan(med(rA));
      expect([...tiersN].sort()).toEqual([3, 4, 5]);
    }
  });
});

/** Anteil der Rautenfläche einer Kachel (Bildraum), der unter Kronen liegt (echte Formen, alle Kronen ringsum). */
function coverage(crowns: (Crown & { fx: number; fy: number })[], x: number, y: number): number {
  const near = crowns
    .filter((c) => !c.dead && Math.abs(c.fx - x - 0.5) < 2 && Math.abs(c.fy - y - 0.5) < 2)
    .map((c) => {
      const p = project(c.fx, c.fy);
      return { c, g: crownGeom(c), x: p.x, y: p.y - c.h };
    });
  let hit = 0,
    n = 0;
  for (let i = 0; i < 12; i++)
    for (let j = 0; j < 12; j++) {
      const q = project(x + (i + 0.5) / 12, y + (j + 0.5) / 12);
      n++;
      const covered = near.some(({ g, x: cx, y: cy }) => {
        const dx = q.x - cx,
          dy = q.y - cy;
        if (g.tiers.length > 0)
          return g.tiers.some((t) => {
            const yy = dy - t.ay,
              hgt = t.by - t.ay;
            if (yy < 0 || yy > hgt) return false;
            const k = yy / hgt;
            return Math.abs(dx - (t.ax + (t.bx - t.ax) * k)) <= t.hw * k;
          });
        return g.lobes.some((l) => ((dx - l.x) / l.rx) ** 2 + ((dy - l.y) / l.ry) ** 2 <= 1);
      });
      if (covered) hit++;
    }
  return hit / n;
}

describe('Fix 1 Kronendeckung', () => {
  it('Fix-1 Kronendeckung im Kern (S ≥ SAUM_LEVEL + 0,4, keine Lichtung): im Mittel ≥ 80 % (Pinien- und Nadelwald ≥ 68 %; junge Bestände zeigen Boden zwischen den Fichten, B1), Lücken unter 50 % Deckung in höchstens 6 % der Kacheln', () => {
    for (const seed of [7, 14, 1, 2]) {
      const w = woodWorld(seed);
      const isl = home(w);
      const m = new Uint8Array(isl.width * isl.height);
      isl.tiles.forEach((t, i) => (m[i] = t.terrain === 'forest' ? 1 : 0));
      const mask = woodBlur(isl.width, isl.height, m);
      const cs = treesOf(w);
      const cov: number[] = [];
      for (let y = 1; y < isl.height - 1; y++)
        for (let x = 1; x < isl.width - 1; x++) {
          if (isl.tiles[y * isl.width + x]!.terrain !== 'forest') continue;
          if (saumAt(w.seed, mask, x + 0.5, y + 0.5) < SAUM_LEVEL + 0.4) continue;
          if (forestClearing(w.seed, x + 0.5, y + 0.5) > 0.05) continue;
          cov.push(coverage(cs, x, y));
        }
      expect(cov.length, `Seed ${seed}`).toBeGreaterThan(10);
      expect(cov.reduce((a, b) => a + b, 0) / cov.length, `Seed ${seed}`).toBeGreaterThanOrEqual(
        forestType(seed) === 3 || forestType(seed) === 1 ? 0.68 : 0.8, // Pinienhain und Bergwald mit lichten Partien (Fix-Runden 1/2)
      );
      // Lücken (B3) bleiben selten: höchstens 6 % der Kernkacheln unter 50 % Deckung (Nadel- und Pinienwald 20 %)
      expect(cov.filter((c) => c < 0.5).length / cov.length, `Seed ${seed}`).toBeLessThanOrEqual(
        forestType(seed) === 1 || forestType(seed) === 3 ? 0.2 : 0.06, // Bergwald: lichte Partien mit Boden (Fix-Runde 2)
      );
    }
  });
});

describe('WALD-02 Waldboden folgt dem Saumfeld (terrain.ts, Waldzweig und Waldgewichtung)', () => {
  it('RF-W-10 nahe am Rand ist der Boden innerhalb der Saumlinie dunkler als ausserhalb, auf Wald- wie auf Graskacheln', () => {
    const world = createWorld(7, { unlockAll: true });
    const grid = buildGrid(fieldWorld(world));
    const isl = home(world);
    const m = new Uint8Array(isl.width * isl.height);
    isl.tiles.forEach((t, i) => (m[i] = t.terrain === 'forest' ? 1 : 0));
    const mask = woodBlur(isl.width, isl.height, m);
    const acc = { in: [0, 0], out: [0, 0] };
    for (let y = 1; y < isl.height - 1; y++)
      for (let x = 1; x < isl.width - 1; x++) {
        const t = isl.tiles[y * isl.width + x]!.terrain;
        if (t !== 'forest' && t !== 'grass') continue;
        for (let k = 0; k < 4; k++) {
          const u = 0.15 + (0.7 * ((k * 7) % 4)) / 3,
            v = 0.15 + (0.7 * ((k * 5 + 1) % 4)) / 3;
          const s = saumAt(world.seed, mask, x + u, y + v);
          if (Math.abs(s - SAUM_LEVEL) < 0.12 || s < SAUM_LEVEL - 0.3 || s > SAUM_LEVEL + 0.3)
            continue;
          const px = paintPixels(
            grid,
            1,
            Math.floor((x + u) * TEX),
            Math.floor((y + v) * TEX),
            1,
            1,
          );
          const b = s > SAUM_LEVEL ? acc.in : acc.out;
          b[0]! += lum(px[0]!, px[1]!, px[2]!);
          b[1]!++;
        }
      }
    expect(acc.in[1]).toBeGreaterThan(50);
    expect(acc.out[1]).toBeGreaterThan(50);
    expect(acc.out[0]! / acc.out[1]! - acc.in[0]! / acc.in[1]!).toBeGreaterThan(15);
  });

  it('RF-W-10 die Bodenkante folgt nicht der Kachelkante: entlang eines geraden Waldrands (12 Kacheln) wandert die Hell-Dunkel-Grenze mit SD ≥ 0,15 Kachel', () => {
    for (const seed of [1, 2, 5, 7]) {
      const world = createWorld(seed);
      const x0 = 20,
        y0 = 20;
      forceRect(world, x0 - 3, y0 - 4, 18, 14, 'grass');
      forceRect(world, x0, y0, 12, 6, 'forest');
      const grid = buildGrid(fieldWorld(world));
      const pos: number[] = [];
      for (let x = x0 + 0.25; x < x0 + 12; x += 0.5) {
        // von aussen (y0 − 2) nach innen: erste Stelle, an der der Boden deutlich dunkler ist als die Wiese
        const ref = paintPixels(grid, 1, Math.floor(x * TEX), (y0 - 3) * TEX, 1, 1);
        const l0 = lum(ref[0]!, ref[1]!, ref[2]!);
        let y = y0 - 2;
        for (; y < y0 + 2; y += 1 / 16) {
          const p = paintPixels(grid, 1, Math.floor(x * TEX), Math.floor(y * TEX), 1, 1);
          if (lum(p[0]!, p[1]!, p[2]!) < l0 - 25) break;
        }
        pos.push(y);
      }
      const mean = pos.reduce((a, b) => a + b, 0) / pos.length;
      const sd = Math.sqrt(pos.reduce((a, b) => a + (b - mean) ** 2, 0) / pos.length);
      expect(sd, `Seed ${seed}`).toBeGreaterThanOrEqual(0.15);
    }
  }, 30_000); // H-T7: lokal 2,4 s, Timeout >= 8 x lokal (R270)

  it('RF-W-11 Lesbarkeit: unter ≥ 95 % der Waldkacheln ist der Boden in der Kachelmitte dunkler als die Wiese (Mittel, ≥ 15 Luma), auch an dünnen Waldstreifen', () => {
    for (const seed of [11, 7]) {
      const world = createWorld(seed, { unlockAll: true });
      const grid = buildGrid(fieldWorld(world));
      const isl = home(world);
      const mean = (x: number, y: number): number => {
        const px = paintPixels(grid, 1, x * TEX + 12, y * TEX + 12, 8, 8);
        let l = 0;
        for (let k = 0; k < 64; k++) l += lum(px[k * 4]!, px[k * 4 + 1]!, px[k * 4 + 2]!);
        return l / 64;
      };
      let g = 0,
        ng = 0;
      const forest: number[] = [];
      for (let y = 1; y < isl.height - 1; y++)
        for (let x = 1; x < isl.width - 1; x++) {
          const t = isl.tiles[y * isl.width + x]!.terrain;
          if (t === 'forest') forest.push(mean(x, y));
          else if (t === 'grass' && (x + y) % 3 === 0) {
            g += mean(x, y);
            ng++;
          }
        }
      const meadow = g / ng;
      const dark = forest.filter((l) => l < meadow - 15).length;
      expect(dark / forest.length, `Seed ${seed}`).toBeGreaterThanOrEqual(0.95);
    }
  }, 15_000); // H-T7: lokal 1,6 s, Timeout >= 8 x lokal (R270)

  it('RF-L1-7 Lichtungsfeld: im Kern ist der Waldboden dort heller, wo forestClearing ≥ 0,5', () => {
    const world = createWorld(7, { unlockAll: true });
    const grid = buildGrid(fieldWorld(world));
    const isl = home(world);
    const acc = { clear: [0, 0], dense: [0, 0] };
    for (let y = 2; y < isl.height - 2; y++)
      for (let x = 2; x < isl.width - 2; x++) {
        let all = true;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            if (isl.tiles[(y + dy) * isl.width + x + dx]!.terrain !== 'forest') all = false;
        if (!all) continue;
        const c = forestClearing(world.seed, x + 0.5, y + 0.5);
        if (c > 0.05 && c < 0.9) continue;
        const px = paintPixels(grid, 1, x * TEX + 8, y * TEX + 8, 16, 16);
        let l = 0;
        for (let k = 0; k < 256; k++) l += lum(px[k * 4]!, px[k * 4 + 1]!, px[k * 4 + 2]!);
        const bin = c >= 0.9 ? acc.clear : acc.dense;
        bin[0]! += l / 256;
        bin[1]!++;
      }
    expect(acc.clear[1]).toBeGreaterThan(1);
    expect(acc.dense[1]).toBeGreaterThan(20);
    expect(acc.clear[0]! / acc.clear[1]!).toBeGreaterThan(acc.dense[0]! / acc.dense[1]! + 3);
  });
});
