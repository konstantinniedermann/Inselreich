import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createWorld, home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { ZOOM_STEPS, sortedObjects } from '../../src/render/iso';
import { bandCell, forestClearing, isClearing, type TileClass } from '../../src/render/forest';
import { kontorPos, seaContext, stampPlacements } from '../../src/render/decor';
import { groupMembers } from '../../src/render/crown';
import {
  FERN_FORMS,
  FERN_H,
  FERN_LIGHT,
  FERN_LINE,
  FERN_MID,
  FERN_MIN_ZOOM,
  FERN_SALT,
  TREE_CACHE_MAX_BYTES,
  TREE_H,
  drawTreeStamp,
  fernCacheSize,
  fernTufts,
  itemFerns,
  paintFern,
  resetTreeCache,
  setCanvasFactory,
  treeCacheBytes,
  type TreeItem,
} from '../../src/render/trees';
import { PALETTE, SIGNAL_NAMES, rgbOf, rgbOfCss } from '../../src/render/palette';
import { deltaE2000, hexToLab, rgbToLab } from './deltaE';
import { fakeCtx } from './fakeCtx';

// trees-farn.test.ts — L6 B2 (ART-STIL-02): Farn auf Lichtungen. REL-07: auf WALD-02 übertragen (Kronen einzeln in
// Tiefenband-Zellen statt Stempel je Kachel); jede Prüfung des L6-Stands hat hier ihr Gegenstück.

/** Wald-Objekte einer Welt und ihr Stempel-Seed (`world.seed`, kann vom Kartenseed abweichen). */
const trees = (seed: number): { items: TreeItem[]; ws: number; world: World } => {
  const world = createWorld(seed);
  return {
    items: sortedObjects(world).filter((i): i is TreeItem => i.kind === 'tree'),
    ws: world.seed,
    world,
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

/**
 * Lichtungskacheln, unabhängig vom Renderer bestimmt: freie Waldkachel (kein Gebäude, Weg, Deko-Stempel), alle 8
 * Nachbarn ebenso (Kern, keine Randkachel), Lichtungsfeld ≥ 0,5 in der Kachelmitte.
 */
function layoutClearings(world: World): Set<number> {
  const isl = home(world);
  const stamps = new Set<number>();
  if (!isl.kind || isl.kind === 'home')
    for (const s of stampPlacements(
      world.seed,
      isl,
      kontorPos(isl, world.buildings),
      seaContext(world),
    ))
      stamps.add(s.y * isl.width + s.x);
  const free = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= isl.width || y >= isl.height) return false;
    const t = isl.tiles[y * isl.width + x]!;
    return (
      t.terrain === 'forest' && t.buildingId === null && !t.road && !stamps.has(y * isl.width + x)
    );
  };
  const out = new Set<number>();
  for (let y = 0; y < isl.height; y++)
    for (let x = 0; x < isl.width; x++) {
      let kern = true;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) if (!free(x + dx, y + dy)) kern = false;
      if (kern && forestClearing(world.seed, x + 0.5, y + 0.5) >= 0.5) out.add(y * isl.width + x);
    }
  return out;
}

/** Anzahl Atlas-Bilder eines Objekts ohne Farn: je Krone eines, der Riesenbaum wird direkt gemalt. */
const crownImages = (t: TreeItem): number => t.crowns.filter((c) => !c.giant).length;

describe('L6 B2 Farn auf Lichtungen', () => {
  it('B2 Farn: über Seeds 1–20 zeichnen genau die Lichtungskacheln Farn (Kern, Feld ≥ 0,5), keine Randkachel; jedes Büschel genau einmal', () => {
    setCanvasFactory(factory);
    let total = 0;
    for (let seed = 1; seed <= 20; seed++) {
      resetTreeCache();
      const { items, ws, world } = trees(seed);
      const W = home(world).width;
      const want = layoutClearings(world);
      const drawn = new Map<number, number>();
      for (const t of items) {
        const { ctx, log } = fakeCtx();
        drawTreeStamp(ctx, { x: 0, y: 0, zoom: 1 }, t, ws);
        const ferns = itemFerns(t, ws);
        expect(log.images.length - crownImages(t), `Seed ${seed} Objekt ${t.id}`).toBe(
          ferns.length,
        );
        for (const f of ferns) {
          const k = f.tile.y * W + f.tile.x;
          drawn.set(k, (drawn.get(k) ?? 0) + 1);
        }
      }
      expect(
        [...drawn.keys()].sort((a, b) => a - b),
        `Seed ${seed}`,
      ).toEqual([...want].sort((a, b) => a - b));
      for (const [k, n] of drawn)
        expect(n, `Seed ${seed} Kachel ${k}`).toBe(fernTufts(ws, k % W, Math.floor(k / W)).length);
      total += drawn.size;
    }
    expect(total, 'es gibt Lichtungen über die Seeds').toBeGreaterThan(10);
    resetTreeCache();
  });

  it('B2 2–4 Büschel je Lichtungskachel in deren vorderer Hälfte, in der Tiefenfolge der Zelle; Büschel kleiner als ein Baum; Kachel bleibt Wald (≥ 2 Kronen)', () => {
    let n = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const { items, ws, world } = trees(seed);
      const W = home(world).width;
      const tufts = new Map<number, number>();
      const crownsIn = new Map<number, number>();
      for (const t of items) {
        for (const c of t.crowns) {
          if (c.dead) continue;
          // Gruppen zählen mit jedem Baum auf der Kachel seines Fusses (wie die Mindestzahl in forest.ts)
          const feet = c.group !== undefined ? groupMembers(c) : [{ cx: 0, cy: 0 }];
          for (const m of feet) {
            const k = Math.floor(t.fp.y + c.cy + m.cy) * W + Math.floor(t.fp.x + c.cx + m.cx);
            crownsIn.set(k, (crownsIn.get(k) ?? 0) + 1);
          }
        }
        const ferns = itemFerns(t, ws);
        for (let i = 0; i < ferns.length; i++) {
          const f = ferns[i]!;
          // Fusspunkt in der vorderen Hälfte der Lichtungskachel und in der Tiefenband-Zelle des Objekts
          const fx = t.fp.x + f.cx,
            fy = t.fp.y + f.cy;
          expect(fx - f.tile.x).toBeGreaterThanOrEqual(0.5);
          expect(fx - f.tile.x).toBeLessThanOrEqual(0.95);
          expect(fy - f.tile.y).toBeGreaterThanOrEqual(0.5);
          expect(fy - f.tile.y).toBeLessThanOrEqual(0.95);
          expect(bandCell(fx, fy)).toEqual({ x: t.fp.x, y: t.fp.y });
          if (i > 0)
            expect(f.cx + f.cy).toBeGreaterThanOrEqual(ferns[i - 1]!.cx + ferns[i - 1]!.cy);
          const k = f.tile.y * W + f.tile.x;
          tufts.set(k, (tufts.get(k) ?? 0) + 1);
        }
      }
      for (const [k, c] of tufts) {
        expect(c, `Seed ${seed}`).toBeGreaterThanOrEqual(2);
        expect(c, `Seed ${seed}`).toBeLessThanOrEqual(4);
        expect(crownsIn.get(k) ?? 0, `Seed ${seed} Kachel ${k} bleibt Wald`).toBeGreaterThanOrEqual(
          2,
        );
        n++;
      }
    }
    expect(n).toBeGreaterThan(10);
    expect(FERN_H).toBeLessThan(TREE_H);
  });

  it('B2 Farn ab Zoom 0,5: bei 0,25 keiner, bei 0,5 und 2 da', () => {
    setCanvasFactory(factory);
    const { items, ws } = trees(1);
    const t = items.find((i) => itemFerns(i, ws).length > 0);
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
      expect(log.images.length > crownImages(t!), `Zoom ${zoom}`).toBe(farn);
    }
    resetTreeCache();
  });

  it('B2 Farn-Cache: höchstens FERN_FORMS × ZOOM_STEPS, der Kronen-Atlas bleibt unter seiner Obergrenze', () => {
    setCanvasFactory(factory);
    resetTreeCache();
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
      expect(treeCacheBytes()).toBeLessThanOrEqual(TREE_CACHE_MAX_BYTES);
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
          expect(t.u).toBeGreaterThanOrEqual(0.5);
          expect(t.u).toBeLessThanOrEqual(0.95);
          expect(t.v).toBeGreaterThanOrEqual(0.5);
          expect(t.v).toBeLessThanOrEqual(0.95);
          expect(t.form).toBeGreaterThanOrEqual(0);
          expect(t.form).toBeLessThan(FERN_FORMS);
        }
      }
  });

  it('B2 isClearing: nur Kern (alle 8 Nachbarn Wald) mit Lichtungsfeld ≥ 0,5', () => {
    const forest = (): TileClass => 'forest';
    let hits = 0;
    for (let x = 0; x < 40; x++)
      for (let y = 0; y < 40; y++) {
        const want = forestClearing(9, x + 0.5, y + 0.5) >= 0.5;
        expect(isClearing(9, x, y, forest)).toBe(want);
        if (want) {
          hits++;
          // ein einziger Nachbar ohne Wald macht die Kachel zum Rand
          const rim = (cx: number, cy: number): TileClass =>
            cx === x + 1 && cy === y - 1 ? 'meadow' : 'forest';
          expect(isClearing(9, x, y, rim)).toBe(false);
        }
      }
    expect(hits).toBeGreaterThan(0);
  });

  it('L6-T2 kein Math.random in trees.ts', () => {
    expect(readFileSync('src/render/trees.ts', 'utf8')).not.toMatch(/Math\.random/);
  });
});
