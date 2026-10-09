import { describe, expect, it } from 'vitest';
import {
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
  drawSeaMap(ctx, w, l, cache, { hover });
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
    drawSeaMap(ctx, w, l, cache, { hover: null });
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
