import { describe, expect, it } from 'vitest';
import {
  COLORS,
  DOT_R,
  MARK,
  createSilhouetteCache,
  drawSeaMap,
  mapDots,
  mapLayout,
  tileToMap,
  type RasterFactory,
} from '../../src/render/seaMap';
import { lanePoints } from '../../src/render/shipLane';
import { seaWorld, shipLiteral } from '../sim/seaHelpers';
import { fakeCtx } from './fakeCtx';

const factory: RasterFactory = () => ({ ctx: fakeCtx().ctx, image: {} as CanvasImageSource });
const route = { a: 0, b: 1, ab: [], ba: [] };

function draw(w: ReturnType<typeof seaWorld>, hover: number | null = null) {
  const l = mapLayout(w, 360, 240, 12);
  const { ctx, log } = fakeCtx();
  const cache = createSilhouetteCache(factory);
  drawSeaMap(ctx, w, l, cache, { hover, dpr: 1 });
  return { l, log, cache };
}

describe('drawSeaMap Reihenfolge (AK-S7)', () => {
  it('Wasser, Linien, Silhouetten, Punkte; ein drawImage je Insel, kein fillRect je Kachel', () => {
    const w = seaWorld();
    shipLiteral(w, { route, port: 0, to: 1, left: 100 });
    const { log } = draw(w);
    const ops = log.events.map((e) => e.op).filter((o) => o !== 'transform');
    const iStroke = ops.indexOf('stroke');
    const iImg = ops.indexOf('drawImage');
    const iFill = ops.lastIndexOf('fill');
    expect(ops[0]).toBe('fillRect');
    expect(iStroke).toBeGreaterThan(0);
    expect(iStroke).toBeLessThan(iImg);
    expect(iImg).toBeLessThan(iFill);
    expect(ops.filter((o) => o === 'drawImage')).toHaveLength(w.islands.length);
    // Wasserfläche + je Kontor-Marke ein Rechteck, nie je Kachel
    expect(ops.filter((o) => o === 'fillRect').length).toBeLessThanOrEqual(1 + w.islands.length);
  });
  it('zeichnet die gecachte Silhouette, nicht neu gerastert', () => {
    const w = seaWorld();
    const { l, cache } = draw(w);
    const n = cache.rasterCount;
    const { ctx } = fakeCtx();
    drawSeaMap(ctx, w, l, cache, { hover: null, dpr: 1 });
    expect(cache.rasterCount).toBe(n);
  });
});

describe('drawSeaMap Fahrlinien (AK-S8)', () => {
  it('ein Linienzug je Route mit den Punkten von lanePoints im Karten-Raum', () => {
    const w = seaWorld();
    shipLiteral(w, { route, port: 0, to: 1, left: 100 });
    shipLiteral(w, { route, port: 1, to: null });
    const { l, log } = draw(w);
    const strokes = log.events.filter((e) => e.op === 'stroke' && e.style.startsWith('rgba'));
    expect(strokes).toHaveLength(1);
    const pts = lanePoints(w, 0, 1).map((p) => tileToMap(l, p.x, p.y));
    expect(pts.length).toBeGreaterThan(1);
    expect(strokes[0]!.points).toHaveLength(pts.length);
    strokes[0]!.points.forEach((p, i) => {
      expect(p.x).toBeCloseTo(pts[i]!.x, 9);
      expect(p.y).toBeCloseTo(pts[i]!.y, 9);
    });
  });
  it('ist für dieselbe Welt deterministisch', () => {
    const w = seaWorld();
    shipLiteral(w, { route, port: 0, to: 1, left: 100 });
    expect(draw(w).log.events).toEqual(draw(w).log.events);
  });
  it('ohne Route keine Linie und kein Fehler', () => {
    const w = seaWorld();
    shipLiteral(w, { route: null });
    const { log } = draw(w);
    expect(log.events.filter((e) => e.op === 'stroke')).toHaveLength(0);
  });
});

describe('drawSeaMap Punkte und Marken (AK-S9)', () => {
  it('Anzahl arc == mapDots, Schiff ohne Route fehlt', () => {
    const w = seaWorld();
    shipLiteral(w, { route: null });
    shipLiteral(w, { route, port: 0, to: 1, left: 100 });
    shipLiteral(w, { route, port: 1, to: null });
    const { log } = draw(w);
    const dotFills = log.events.filter((e) => e.op === 'fill');
    expect(dotFills).toHaveLength(mapDots(w).length);
    expect(dotFills).toHaveLength(2);
  });
  it('Hover-Insel bekommt einen zusätzlichen Rahmen', () => {
    const w = seaWorld();
    const base = draw(w).log.events.filter((e) => e.op === 'stroke').length;
    const hov = draw(w, 1).log.events.filter((e) => e.op === 'stroke').length;
    expect(hov).toBe(base + 1);
  });
  it('Kontor-Inseln tragen eine Marke', () => {
    const w = seaWorld();
    const a = draw(w).log.events.filter((e) => e.op === 'fillRect').length;
    w.islands[1]!.kontorId = 99;
    const b = draw(w).log.events.filter((e) => e.op === 'fillRect').length;
    expect(b).toBe(a + 1);
  });
  it('schreibt nie in die Welt', () => {
    const w = seaWorld();
    shipLiteral(w, { route, port: 0, to: 1, left: 100 });
    const copy = structuredClone(w);
    draw(w, 1);
    expect(w).toEqual(copy);
  });
});

describe('drawSeaMap Kontor-Marke und dpr (REL-15, UI-SEEKARTE-NACHZUG)', () => {
  type Box = { x0: number; y0: number; x1: number; y1: number };
  const box = (pts: readonly { x: number; y: number }[]): Box => ({
    x0: Math.min(...pts.map((p) => p.x)),
    y0: Math.min(...pts.map((p) => p.y)),
    x1: Math.max(...pts.map((p) => p.x)),
    y1: Math.max(...pts.map((p) => p.y)),
  });
  const disjoint = (a: Box, b: Box): boolean =>
    a.x1 <= b.x0 || b.x1 <= a.x0 || a.y1 <= b.y0 || b.y1 <= a.y0;
  for (const dpr of [1, 2])
    it(`dpr ${dpr}: Marke über dem Hafenpunkt, Grössen und Striche × dpr`, () => {
      const w = seaWorld();
      shipLiteral(w, { route, port: 0, to: null }); // Hafenschiff am Anker der Heimat
      const l = mapLayout(w, 360 * dpr, 240 * dpr, 12 * dpr);
      const { ctx, log } = fakeCtx();
      drawSeaMap(ctx, w, l, createSilhouetteCache(factory), { hover: 1, dpr });
      const h = w.islands[0]!;
      const a = tileToMap(l, h.ox + h.anchor.x + 0.5, h.oy + h.anchor.y + 0.5);
      const ev = (op: string, style: string) =>
        log.events.filter((e) => e.op === op && e.style === style);
      const dist = (b: Box) => Math.hypot((b.x0 + b.x1) / 2 - a.x, (b.y0 + b.y1) / 2 - a.y);
      const mark = ev('fillRect', COLORS.kontor)
        .map((e) => box(e.points))
        .sort((p, q) => dist(p) - dist(q))[0]!;
      const dots = ev('fill', COLORS.dot);
      expect(dots).toHaveLength(1);
      const dot = box(dots[0]!.points);
      expect(mark.x1 - mark.x0).toBeCloseTo(MARK * dpr, 6);
      expect(mark.y1 - mark.y0).toBeCloseTo(MARK * dpr, 6);
      expect(dot.x1 - dot.x0).toBeCloseTo(2 * DOT_R * dpr, 6);
      expect(disjoint(mark, dot), 'Marke vom Hafenpunkt verdeckt').toBe(true);
      expect(mark.y1, 'Marke über dem Anker').toBeLessThan(a.y);
      expect(ev('stroke', COLORS.dotEdge)[0]!.lineWidth).toBe(dpr);
      expect(ev('stroke', COLORS.hover)[0]!.lineWidth).toBe(2 * dpr);
      const lanes = ev('stroke', COLORS.lane);
      expect(lanes.length).toBeGreaterThan(0);
      for (const e of lanes) expect(e.lineWidth).toBe(dpr);
    });
});
