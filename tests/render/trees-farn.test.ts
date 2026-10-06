import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createWorld, home } from '../../src/sim/world';
import { ZOOM_STEPS, TREE_VARIANTS, sortedObjects } from '../../src/render/iso';
import { forestLayout, variantParts, type TileClass } from '../../src/render/forest';
import {
  FERN_FORMS,
  FERN_H,
  FERN_LIGHT,
  FERN_LINE,
  FERN_MID,
  FERN_MIN_ZOOM,
  FERN_SALT,
  TREE_H,
  crownsFor,
  drawTreeStamp,
  fernCacheSize,
  fernTufts,
  paintFern,
  resetTreeCache,
  setCanvasFactory,
  treeCacheSize,
  type TreeItem,
} from '../../src/render/trees';
import { PALETTE, SIGNAL_NAMES, rgbOf, rgbOfCss } from '../../src/render/palette';
import { deltaE2000, hexToLab, rgbToLab } from './deltaE';
import { fakeCtx } from './fakeCtx';

// trees-farn.test.ts — L6 B2 (ART-STIL-02): Farn auf Lichtungen, Stempelteil.

/** Baumstempel einer Welt und ihr Stempel-Seed (`world.seed`, kann vom Kartenseed abweichen). */
const trees = (seed: number): { items: TreeItem[]; ws: number } => {
  const world = createWorld(seed);
  return {
    items: sortedObjects(world).filter((i): i is TreeItem => i.kind === 'tree'),
    ws: world.seed,
  };
};
const factory = (): HTMLCanvasElement => {
  const { ctx } = fakeCtx();
  return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
};
const luma = (hex: string): number => {
  const c = rgbOfCss(hex);
  return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
};

/** Kacheln, die `forestLayout` als Lichtung führt: Kernkachel (Rolle 0) mit der lichteren Rand-Form. */
function layoutClearings(seed: number): Set<number> {
  const world = createWorld(seed);
  const isl = home(world);
  const cls = (x: number, y: number): TileClass => {
    if (x < 0 || y < 0 || x >= isl.width || y >= isl.height) return 'blocked';
    const t = isl.tiles[y * isl.width + x]!;
    if (t.buildingId !== null || t.road) return 'blocked';
    return t.terrain === 'forest' ? 'forest' : t.terrain === 'grass' ? 'meadow' : 'blocked';
  };
  const out = new Set<number>();
  forestLayout(world.seed, isl.width, isl.height, cls).forEach((p, i) => {
    if (p && p.role === 0 && variantParts(p.variant).role === 1) out.add(i);
  });
  return out;
}

describe('L6 B2 Farn auf Lichtungen', () => {
  it('B2 Farn: über Seeds 1–20 zeichnen genau die Kacheln Farn, die forestLayout als Lichtung führt (Kernkachel, Feld ≥ 0,5), keine Randkachel', () => {
    setCanvasFactory(factory);
    let total = 0;
    for (let seed = 1; seed <= 20; seed++) {
      resetTreeCache();
      const W = home(createWorld(seed)).width;
      const want = layoutClearings(seed);
      const got = new Set<number>();
      const { items, ws } = trees(seed);
      for (const t of items) {
        const { ctx, log } = fakeCtx();
        drawTreeStamp(ctx, { x: 0, y: 0, zoom: 1 }, t, ws);
        if (log.images.length > 1) got.add(t.fp.y * W + t.fp.x);
      }
      expect(
        [...got].sort((a, b) => a - b),
        `Seed ${seed}`,
      ).toEqual([...want].sort((a, b) => a - b));
      total += got.size;
    }
    expect(total, 'es gibt Lichtungen über die Seeds').toBeGreaterThan(10);
    resetTreeCache();
  });

  it('B2 2–4 Büschel je Kachel, vor dem Baumstempel (zuletzt kommt der Stempel), Kachel bleibt Wald (≥ 2 Kronen)', () => {
    setCanvasFactory(factory);
    let n = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const want = layoutClearings(seed);
      const W = home(createWorld(seed)).width;
      const { items, ws } = trees(seed);
      for (const t of items) {
        if (!want.has(t.fp.y * W + t.fp.x)) continue;
        const { ctx, log } = fakeCtx();
        drawTreeStamp(ctx, { x: 0, y: 0, zoom: 1 }, t, ws);
        const tufts = log.images.length - 1;
        expect(tufts, `Seed ${seed}`).toBeGreaterThanOrEqual(2);
        expect(tufts, `Seed ${seed}`).toBeLessThanOrEqual(4);
        expect(tufts).toBe(fernTufts(ws, t.fp.x, t.fp.y).length);
        const stamp = log.images[log.images.length - 1] as { width: number };
        for (const im of log.images.slice(0, -1))
          expect((im as { width: number }).width, 'Büschel kleiner als der Stempel').toBeLessThan(
            stamp.width,
          );
        expect(crownsFor(ws, t.variant).length).toBeGreaterThanOrEqual(2);
        n++;
      }
    }
    expect(n).toBeGreaterThan(10);
    resetTreeCache();
  });

  it('B2 Farn ab Zoom 0,5: bei 0,25 keiner, bei 0,5 und 2 da', () => {
    setCanvasFactory(factory);
    const seed = 1;
    const W = home(createWorld(seed)).width;
    const want = layoutClearings(seed);
    const { items, ws } = trees(seed);
    const t = items.find((i) => want.has(i.fp.y * W + i.fp.x));
    expect(t).toBeDefined();
    expect(FERN_MIN_ZOOM).toBe(0.5);
    for (const [zoom, farn] of [
      [0.125, false],
      [0.25, false],
      [0.5, true],
      [1, true],
      [2, true],
    ] as const) {
      const { ctx, log } = fakeCtx();
      drawTreeStamp(ctx, { x: 0, y: 0, zoom }, t!, ws);
      expect(log.images.length > 1, `Zoom ${zoom}`).toBe(farn);
    }
    resetTreeCache();
  });

  it('B2 Farn-Cache: höchstens FERN_FORMS × ZOOM_STEPS, TREE_VARIANTS bleibt 24 und sein Cache in der alten Grenze', () => {
    setCanvasFactory(factory);
    resetTreeCache();
    expect(TREE_VARIANTS).toBe(24);
    let s = 5;
    const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
    for (let seed = 1; seed <= 3; seed++) {
      resetTreeCache();
      const { items, ws } = trees(seed);
      for (const t of items) {
        const { ctx } = fakeCtx();
        drawTreeStamp(ctx, { x: 0, y: 0, zoom: 0.125 + rnd() * 1.875 }, t, ws);
        drawTreeStamp(ctx, { x: 0, y: 0, zoom: ZOOM_STEPS[Math.floor(rnd() * 7)]! }, t, ws);
      }
      expect(fernCacheSize()).toBeGreaterThan(0);
      expect(fernCacheSize()).toBeLessThanOrEqual(FERN_FORMS * ZOOM_STEPS.length);
      expect(treeCacheSize()).toBeLessThanOrEqual(TREE_VARIANTS * ZOOM_STEPS.length);
    }
    resetTreeCache();
    expect(fernCacheSize()).toBe(0);
  });

  it('B2 Büschel: Höhe ≤ 0,25 · TREE_H, Fächer aus 5–7 Wedeln, zwei Töne plus dunkle Eigenkontur', () => {
    expect(FERN_H).toBeCloseTo(0.25 * TREE_H, 9);
    for (let form = 0; form < FERN_FORMS; form++) {
      const { ctx, log } = fakeCtx();
      paintFern(ctx, 3, form);
      expect(log.saves).toBe(log.restores);
      const strokes = log.events.filter((e) => e.op === 'stroke');
      const wedel = strokes.length / 2; // eine Kontur- und eine Tonrunde je Wedel
      expect(wedel).toBeGreaterThanOrEqual(5);
      expect(wedel).toBeLessThanOrEqual(7);
      for (const p of log.allPoints) {
        expect(p.y, `Form ${form}`).toBeLessThanOrEqual(1e-9);
        expect(p.y, `Form ${form}`).toBeGreaterThanOrEqual(-FERN_H - 1e-9);
      }
      expect(new Set(strokes.map((e) => e.style))).toEqual(
        new Set([FERN_LINE, FERN_LIGHT, FERN_MID]),
      );
    }
  });

  it('B2 Töne: heller als die Kronen, nichts heller als foam, kein Schwarz oder Weiss, ΔE2000 ≥ 20 zu allen Signalfarben', () => {
    for (const c of [FERN_LIGHT, FERN_MID]) {
      expect(luma(c)).toBeGreaterThan(luma(PALETTE.crown));
      expect(luma(c)).toBeGreaterThan(luma(PALETTE.crownLight));
    }
    for (const c of [FERN_LIGHT, FERN_MID, FERN_LINE]) {
      expect(luma(c)).toBeLessThan(luma(PALETTE.foam));
      expect(luma(c)).toBeGreaterThan(20);
      for (const n of SIGNAL_NAMES)
        expect(
          deltaE2000(rgbToLab(rgbOf(c) as [number, number, number]), hexToLab(PALETTE[n])),
          `${c} ↔ ${n}`,
        ).toBeGreaterThanOrEqual(20);
    }
  });

  it('B2 deterministisch: gleiche (Seed, Kachel) gleiche Büschel, Lage im Innern der Kachel; Salz 584', () => {
    expect(FERN_SALT).toBe(584);
    for (let x = 0; x < 30; x++)
      for (let y = 0; y < 5; y++) {
        const a = fernTufts(7, x, y),
          b = fernTufts(7, x, y);
        expect(a).toEqual(b);
        expect(a.length).toBeGreaterThanOrEqual(2);
        expect(a.length).toBeLessThanOrEqual(4);
        for (const t of a) {
          expect(t.u).toBeGreaterThanOrEqual(0.15);
          expect(t.u).toBeLessThanOrEqual(0.85);
          expect(t.v).toBeGreaterThanOrEqual(0.15);
          expect(t.v).toBeLessThanOrEqual(0.85);
          expect(t.form).toBeGreaterThanOrEqual(0);
          expect(t.form).toBeLessThan(FERN_FORMS);
        }
      }
  });

  it('L6-T2 kein Math.random in trees.ts', () => {
    expect(readFileSync('src/render/trees.ts', 'utf8')).not.toMatch(/Math\.random/);
  });
});
