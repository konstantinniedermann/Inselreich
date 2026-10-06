import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { sortedObjects } from '../../src/render/iso';
import { crownsFor, type TreeItem } from '../../src/render/trees';
import { forceRect } from '../sim/helpers';

// trees-wald.test.ts — L1 „Wald organisch" (ART-STIL-02): Platzierung und Form des Waldes.

/** Welt mit geradem Waldrand: Wald x0 … x0+11, y0 … y0+5; ringsum freie Wiese. Der Rand zeigt nach +y. */
function straightEdgeWorld(seed: number): { world: World; x0: number; y0: number } {
  const world = createWorld(seed);
  const x0 = 20,
    y0 = 20;
  forceRect(world, x0 - 3, y0 - 3, 18, 12, 'grass');
  forceRect(world, x0, y0, 12, 6, 'forest');
  return { world, x0, y0 };
}
const trees = (w: World): TreeItem[] =>
  sortedObjects(w).filter((i): i is TreeItem => i.kind === 'tree');
const sd = (v: number[]): number => {
  const m = v.reduce((a, b) => a + b, 0) / v.length;
  return Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length);
};

describe('L1 Kronenlage aus einem Feld', () => {
  it('Kronenlage aus einem Feld: Entlang eines geraden Waldrands von 10 Kacheln streut der Abstand der äussersten Krone zur Kachelkante mit SD ≥ 0,12 Kachel', () => {
    for (const seed of [1, 2, 5, 7]) {
      const { world, x0, y0 } = straightEdgeWorld(seed);
      const row = trees(world).filter(
        (t) => t.fp.y === y0 + 5 && t.fp.x >= x0 + 1 && t.fp.x <= x0 + 10,
      );
      expect(row).toHaveLength(10);
      // Abstand der äussersten Krone zur Kachelkante (+y-Seite) in Kacheln, inklusive Stempelversatz
      const dist = row.map((t) => {
        const oy = (t as { oy?: number }).oy ?? 0;
        return Math.max(...crownsFor(world.seed, t.variant).map((c) => c.cy + c.r + oy)) - 1;
      });
      expect(sd(dist), `Seed ${seed}`).toBeGreaterThanOrEqual(0.12);
    }
  });
});

// ---------------------------------------------------------------------------------------------------------------
// Anhang L1: L1-T1 … L1-T7 und die AK aus Spec 7 „L1 Wald"
import { readFileSync } from 'node:fs';
import { ISO_W, TEX, TREE_VARIANTS, ZOOM_STEPS, project, depthKey } from '../../src/render/iso';
import { crownPolys } from '../../src/render/life';
import { forestClearing, forestEdgeShift, forestType, variantParts } from '../../src/render/forest';
import { buildGrid, paintPixels } from '../../src/render/terrain';
import { fieldWorld } from '../../src/render/terrainField';
import {
  crownGeom,
  crownScreen,
  drawTreeStamp,
  paintCrown,
  paintStamp,
  resetTreeCache,
  setCanvasFactory,
  treeBounds,
  treeCacheSize,
  TREE_H,
} from '../../src/render/trees';
import { home } from '../../src/sim/world';
import { fakeCtx } from './fakeCtx';

const SEEDS = [1, 2, 5, 7];
const mk = (_seed: number, variant: number, ox = 0, oy = 0, giant = false): TreeItem => ({
  kind: 'tree',
  id: 0,
  fp: { x: 10, y: 7, w: 1, h: 1 },
  key: depthKey({ x: 10, y: 7, w: 1, h: 1 }),
  variant,
  ox,
  oy,
  giant,
});

describe('L1-T1 Stempelbox', () => {
  it('L1-T1 jeder Pfadpunkt jedes Stempels (alle Varianten, Seeds 1/2/5/7, mit Versatz, Riesenbaum) liegt in treeBounds', () => {
    for (const seed of SEEDS)
      for (const step of [0.5, 1, 2])
        for (let v = 0; v < TREE_VARIANTS; v++)
          for (const giant of v % 8 === 0 ? [false, true] : [false]) {
            const role = variantParts(v).role;
            const o = role === 1 ? 0.3 : role === 0 ? 0.08 : 0; // grösster Versatz der Rolle
            const t = mk(seed, v, o, -o, giant);
            const { ctx, log } = fakeCtx();
            paintStamp(ctx, seed, v, step, giant);
            const box = treeBounds(t);
            const c = project(10.5 + o, 7.5 - o);
            expect(log.allPoints.length).toBeGreaterThan(8);
            for (const p of log.allPoints) {
              const wx = c.x + p.x / step - 56; // Stempelpixel → Weltpixel (Ursprung bei STAMP_W / 2, TREE_H)
              const wy = c.y + p.y / step - TREE_H;
              expect(wx, `v${v} Seed ${seed}`).toBeGreaterThanOrEqual(box.x - 1e-6);
              expect(wx, `v${v} Seed ${seed}`).toBeLessThanOrEqual(box.x + box.w + 1e-6);
              expect(wy, `v${v} Seed ${seed}`).toBeGreaterThanOrEqual(box.y - 1e-6);
              expect(wy, `v${v} Seed ${seed}`).toBeLessThanOrEqual(box.y + box.h + 1e-6);
            }
          }
  });

  it('L1-T1 die Box wächst mit: Eng bleibt in der Kachelbreite, Kern ist breiter, der Riesenbaum höher', () => {
    const eng = treeBounds(mk(3, 7)),
      kern = treeBounds(mk(3, 0)),
      rand = treeBounds(mk(3, 3)),
      giant = treeBounds(mk(3, 0, 0, 0, true));
    expect(eng.w).toBe(ISO_W);
    expect(rand.w).toBeGreaterThan(eng.w);
    expect(kern.w).toBeGreaterThanOrEqual(rand.w);
    expect(kern.w).toBeLessThanOrEqual(ISO_W * (1 + 2 * 0.35) + 2 * 0.3 * ISO_W + 1e-6);
    expect(giant.y).toBeLessThan(kern.y - 0.7 * TREE_H);
    const moved = treeBounds(mk(3, 0, 0.3, 0));
    expect(moved.x).toBeCloseTo(kern.x + project(0.3, 0).x, 9);
  });
});

describe('L1-T2 Überhang nur auf Wald und freie Wiese', () => {
  it('L1-T2 kein Kronenfuss (Mitte ± Radius, mit Versatz) auf Gebäude-, Weg- oder Sandkacheln', () => {
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
      isl.tiles[(y0 + 3) * isl.width + x0]!.buildingId = k.id; // Gebäude-Kennung genügt der Prüfung
      let checked = 0;
      for (const t of trees(world)) {
        const crowns = crownsFor(world.seed, t.variant, t.giant === true);
        for (const c of crowns) {
          const xs = [
            t.fp.x + c.cx + (t.ox ?? 0) - c.r + 1e-9,
            t.fp.x + c.cx + (t.ox ?? 0) + c.r - 1e-9,
          ];
          const ys = [
            t.fp.y + c.cy + (t.oy ?? 0) - c.r + 1e-9,
            t.fp.y + c.cy + (t.oy ?? 0) + c.r - 1e-9,
          ];
          for (const fx of xs)
            for (const fy of ys) {
              const tile = isl.tiles[Math.floor(fy) * isl.width + Math.floor(fx)]!;
              const ok =
                tile.buildingId === null &&
                !tile.road &&
                (tile.terrain === 'forest' || tile.terrain === 'grass');
              expect(
                ok,
                `Seed ${seed} Baum ${t.fp.x},${t.fp.y} Krone auf ${Math.floor(fx)},${Math.floor(fy)}`,
              ).toBe(true);
              checked++;
            }
        }
      }
      expect(checked).toBeGreaterThan(500);
    }
  });
});

describe('L1-T3 Tiefensortierung', () => {
  it('L1-T3 genau ein Stempel je freier Waldkachel, depthKey der eigenen Kachel', () => {
    for (const seed of SEEDS) {
      const world = createWorld(seed);
      const isl = home(world);
      const free = isl.tiles.filter(
        (t) => t.terrain === 'forest' && t.buildingId === null && !t.road,
      );
      const ts = trees(world);
      expect(ts).toHaveLength(free.length);
      for (const t of ts) expect(t.key).toBe(depthKey(t.fp));
      expect(new Set(ts.map((t) => t.id)).size).toBe(ts.length);
    }
  });
});

describe('L1-T4 Cache-Grenzen', () => {
  it('L1-T4 TREE_VARIANTS ≤ 24; nach allen Varianten × 200 Zoomwerten in [0,125; 2] gilt treeCacheSize ≤ TREE_VARIANTS × ZOOM_STEPS.length', () => {
    expect(TREE_VARIANTS).toBeLessThanOrEqual(24);
    setCanvasFactory(() => {
      const { ctx } = fakeCtx();
      return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
    });
    resetTreeCache();
    let s = 99;
    const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
    const { ctx } = fakeCtx();
    for (let v = 0; v < TREE_VARIANTS; v++)
      for (let i = 0; i < 200; i++)
        drawTreeStamp(ctx, { x: 0, y: 0, zoom: 0.125 + rnd() * 1.875 }, mk(3, v), 3);
    expect(treeCacheSize()).toBeGreaterThan(0);
    expect(treeCacheSize()).toBeLessThanOrEqual(TREE_VARIANTS * ZOOM_STEPS.length);
    resetTreeCache();
  });

  it('L1-T4 der Riesenbaum wird direkt gezeichnet und füllt den Cache nicht', () => {
    setCanvasFactory(() => {
      const { ctx } = fakeCtx();
      return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
    });
    resetTreeCache();
    const { ctx, log } = fakeCtx();
    drawTreeStamp(ctx, { x: 0, y: 0, zoom: 1 }, mk(3, 0, 0, 0, true), 3);
    expect(treeCacheSize()).toBe(0);
    expect(log.images).toHaveLength(0);
    expect(log.saves).toBe(log.restores);
    expect(log.allPoints.length).toBeGreaterThan(20);
  });
});

describe('L1-T5 Licht-Verdeckung folgt dem Stempel', () => {
  it('L1-T5 je Variante und Versatz: ein Vieleck je Krone, Mitte auf der gezeichneten Krone (± 0,5 px bei Zoom 1)', () => {
    const cam = { x: 0, y: 0, zoom: 1 };
    for (const seed of SEEDS)
      for (let v = 0; v < TREE_VARIANTS; v++)
        for (const [ox, oy, giant] of [
          [0, 0, false],
          [0.21, -0.17, false],
          [0, 0, v % 8 === 0],
        ] as const) {
          const t = mk(seed, v, ox, oy, giant);
          const polys = crownPolys(cam, t, seed);
          const crowns = crownsFor(seed, v, giant);
          expect(polys).toHaveLength(crowns.length);
          const o = project(10.5 + ox, 7.5 + oy);
          crowns.forEach((c, i) => {
            // gezeichnete Krone: Hüllbox der Füllungen von paintCrown an ihrem Platz im Stempel
            const sc = crownScreen(c);
            const { ctx, log } = fakeCtx();
            paintCrown(ctx, c, sc.x, sc.y);
            const pts = log.allPoints;
            const x = (Math.min(...pts.map((p) => p.x)) + Math.max(...pts.map((p) => p.x))) / 2;
            const y = (Math.min(...pts.map((p) => p.y)) + Math.max(...pts.map((p) => p.y))) / 2;
            const poly = polys[i]!;
            const px = (Math.min(...poly.map((p) => p.x)) + Math.max(...poly.map((p) => p.x))) / 2;
            const py = (Math.min(...poly.map((p) => p.y)) + Math.max(...poly.map((p) => p.y))) / 2;
            expect(px - o.x, `Seed ${seed} v${v} Krone ${i}`).toBeCloseTo(x, 0);
            expect(py - o.y, `Seed ${seed} v${v} Krone ${i}`).toBeCloseTo(y, 0);
            expect(Math.abs(px - o.x - x)).toBeLessThanOrEqual(0.5);
            expect(Math.abs(py - o.y - y)).toBeLessThanOrEqual(0.5);
          });
        }
  });
});

describe('L1-T6 Determinismus', () => {
  it('L1-T6 gleicher Seed: identische Liste (Variante, Versatz, Riese) über zwei Aufbauten', () => {
    for (const seed of SEEDS) {
      const pick = (w: World) => trees(w).map((t) => [t.id, t.variant, t.ox, t.oy, t.giant]);
      expect(pick(createWorld(seed))).toEqual(pick(createWorld(seed)));
    }
  });

  it('L1-T6 Waldtyp aus hash2(seed + 500, 0, 0): über Seeds 1–40 mindestens 3 der 4 Typen, und die Kronenart folgt ihm', () => {
    const types = new Set<number>();
    for (let s = 1; s <= 40; s++) types.add(forestType(s));
    expect(types.size).toBeGreaterThanOrEqual(3);
    const kinds = (seed: number): Set<number> => {
      const k = new Set<number>();
      for (let v = 0; v < TREE_VARIANTS; v++)
        for (const c of crownsFor(seed, v)) if (!c.bush) k.add(c.kind);
      return k;
    };
    for (let s = 1; s <= 40; s++) {
      const k = kinds(s);
      if (forestType(s) === 3)
        expect(k.has(3), `Seed ${s}`).toBe(true); // Pinie
      else expect(k.has(3), `Seed ${s}`).toBe(false);
      if (forestType(s) === 0) expect(k.has(0) && k.has(1), `Seed ${s}`).toBe(true);
    }
  });
});

describe('L1-T7 kein Math.random', () => {
  it('L1-T7 trees.ts und forest.ts enthalten kein Math.random', () => {
    for (const f of ['src/render/trees.ts', 'src/render/forest.ts'])
      expect(readFileSync(f, 'utf8')).not.toMatch(/Math\.random/);
  });
});

describe('AK L1 Bestände, Radien, Nachbarpaare (echte Karten)', () => {
  it('AK Nachbarpaare ≥ 90 % verschiedene Stempel; gleiche Hauptart ≥ 65 %', () => {
    for (const seed of SEEDS) {
      const w = createWorld(seed);
      const byId = new Map(trees(w).map((t) => [t.id, t]));
      const W = home(w).width;
      let pairs = 0,
        diff = 0,
        same = 0;
      for (const t of byId.values())
        for (const n of [byId.get(t.id + 1), byId.get(t.id + W)]) {
          if (!n || (n.fp.x === 0 && n.id === t.id + 1)) continue;
          pairs++;
          if (n.variant !== t.variant) diff++;
          if (variantParts(n.variant).slot === variantParts(t.variant).slot) same++;
        }
      expect(pairs, `Seed ${seed}`).toBeGreaterThan(50);
      expect(diff / pairs, `Seed ${seed} verschieden`).toBeGreaterThanOrEqual(0.9);
      expect(same / pairs, `Seed ${seed} Art`).toBeGreaterThanOrEqual(0.65);
    }
  });

  it('AK Radien je Insel: max/min ≥ 2,5; mittlerer Randradius ≤ 0,8 × Kern', () => {
    for (const seed of [1, 2, 5, 7, 11]) {
      const w = createWorld(seed);
      const rs: number[] = [],
        kern: number[] = [],
        rand: number[] = [];
      for (const t of trees(w)) {
        const role = variantParts(t.variant).role;
        for (const c of crownsFor(w.seed, t.variant, t.giant === true)) {
          if (c.r > 0.3) continue; // Riesenbaum zählt nicht
          rs.push(c.r);
          if (role === 0) kern.push(c.r);
          if (role === 1) rand.push(c.r);
        }
      }
      const mean = (a: number[]) => a.reduce((p, q) => p + q, 0) / a.length;
      expect(Math.max(...rs) / Math.min(...rs), `Seed ${seed}`).toBeGreaterThanOrEqual(2.5);
      expect(mean(rand), `Seed ${seed}`).toBeLessThanOrEqual(0.8 * mean(kern));
    }
  });

  it('AK Höhe: keine Krone über TREE_H (ausser Riesenbaum ≤ 1,8 × TREE_H); Lichtung ≥ 2 Kronen', () => {
    for (const seed of SEEDS)
      for (let v = 0; v < TREE_VARIANTS; v++) {
        const cs = crownsFor(seed, v);
        expect(cs.length, `Variante ${v}`).toBeGreaterThanOrEqual(2);
        for (const c of cs) {
          const s = crownScreen(c);
          expect(-(s.y - s.ry)).toBeLessThanOrEqual(TREE_H + 1e-6);
        }
        for (const c of crownsFor(seed, v, true)) {
          const s = crownScreen(c);
          expect(-(s.y - s.ry)).toBeLessThanOrEqual(1.8 * TREE_H + 1e-6);
        }
      }
  });
});

describe('AK L1 Kronenform: keine reine Ellipse, kein reines Dreieck', () => {
  it('AK Laubkronen bestehen aus ≥ 3 Lappen in 3 Tonstufen, Nadelbäume aus ≥ 3 Etagen', () => {
    let laub = 0,
      nadel = 0;
    for (const seed of SEEDS)
      for (let v = 0; v < TREE_VARIANTS; v++)
        for (const c of crownsFor(seed, v)) {
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

  it('AK die Baumarten sind Palettenmischungen: Ahorn und Pinie ΔE2000 ≥ 20 zu allen Signalfarben', () => {
    // die Prüfung steht in trees.test.ts (AK-R1-03); hier nur die Art-Abdeckung je Waldtyp
    const kindsOf = (seed: number): Set<number> => {
      const k = new Set<number>();
      for (let v = 0; v < TREE_VARIANTS; v++) for (const c of crownsFor(seed, v)) k.add(c.kind);
      return k;
    };
    let maple = 0,
      birch = 0;
    for (let s = 1; s <= 40; s++)
      if (forestType(s) === 0) {
        const k = kindsOf(s);
        if (k.has(4)) maple++;
        if (k.has(2)) birch++;
      }
    expect(maple).toBeGreaterThan(0);
    expect(birch).toBeGreaterThan(0);
  });
});

describe('L1 Waldboden folgt den Kronen (terrain.ts, nur Waldzweig)', () => {
  it('RF-L1-7 der Waldboden an der Kante folgt dem Randversatz: weicht der Rand zurück (a kleiner), wird der Boden dort heller', () => {
    // dieselbe Welt, zwei Felder (anderer Salz-Seed der Gitter); je Kachel zählt die Änderung von a und der Helligkeit
    const world = createWorld(7, { unlockAll: true });
    const gridA = buildGrid(fieldWorld(world));
    const gridB = { ...gridA, seed: gridA.seed + 1000 };
    const isl = home(world);
    const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
    let sxy = 0,
      sxx = 0,
      n = 0;
    for (let y = 1; y < isl.height - 1; y++)
      for (let x = 1; x < isl.width - 1; x++) {
        const t = (xx: number, yy: number) => isl.tiles[yy * isl.width + xx]!.terrain;
        if (t(x, y) !== 'forest') continue;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          if (t(x + dx, y + dy) !== 'grass') continue;
          // Streifen an der Kante zur Wiese, mittlere 40 % der Kante, bis 0,45 Kachel tief
          const lo = Math.round(0.02 * TEX),
            hi = Math.round(0.45 * TEX),
            m0 = Math.round(0.3 * TEX),
            m1 = Math.round(0.7 * TEX);
          const w = dx !== 0 ? hi - lo : m1 - m0,
            h = dx !== 0 ? m1 - m0 : hi - lo;
          const ox = dx === 0 ? m0 : dx > 0 ? TEX - hi : lo,
            oy = dy === 0 ? m0 : dy > 0 ? TEX - hi : lo;
          const mean = (g: typeof gridA): number => {
            const px = paintPixels(g, 1, x * TEX + ox, y * TEX + oy, w, h);
            let l = 0;
            for (let k = 0; k < w * h; k++) l += lum(px[k * 4]!, px[k * 4 + 1]!, px[k * 4 + 2]!);
            return l / (w * h);
          };
          const cx = x + 0.5 + dx * 0.3,
            cy = y + 0.5 + dy * 0.3;
          const da = forestEdgeShift(gridA.seed, cx, cy) - forestEdgeShift(gridB.seed, cx, cy);
          const dl = mean(gridA) - mean(gridB);
          sxy += da * dl;
          sxx += da * da;
          n++;
        }
      }
    expect(n).toBeGreaterThan(100);
    expect(sxy / sxx, 'Steigung Helligkeit je Randversatz').toBeLessThan(-4);
  });

  it('RF-L1-7 Lichtungsfeld: im Kern ist der Waldboden dort heller, wo forestClearing ≥ 0,5', () => {
    const world = createWorld(7, { unlockAll: true });
    const grid = buildGrid(fieldWorld(world));
    const isl = home(world);
    const lum = (r: number, g: number, b: number) => 0.299 * r + 0.587 * g + 0.114 * b;
    const acc = { clear: [0, 0], dense: [0, 0] };
    for (let y = 2; y < isl.height - 2; y++)
      for (let x = 2; x < isl.width - 2; x++) {
        let all = true;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++)
            if (isl.tiles[(y + dy) * isl.width + x + dx]!.terrain !== 'forest') all = false;
        if (!all) continue;
        const c = forestClearing(world.seed, x + 0.5, y + 0.5);
        if (c > 0.05 && c < 0.95) continue;
        const px = paintPixels(grid, 1, x * TEX + 8, y * TEX + 8, 16, 16);
        let l = 0;
        for (let k = 0; k < 256; k++) l += lum(px[k * 4]!, px[k * 4 + 1]!, px[k * 4 + 2]!);
        const bin = c >= 0.95 ? acc.clear : acc.dense;
        bin[0]! += l / 256;
        bin[1]!++;
      }
    expect(acc.clear[1]).toBeGreaterThan(3);
    expect(acc.dense[1]).toBeGreaterThan(20);
    expect(acc.clear[0]! / acc.clear[1]!).toBeGreaterThan(acc.dense[0]! / acc.dense[1]! + 3);
  });
});
