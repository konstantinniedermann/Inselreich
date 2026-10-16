import { describe, expect, it } from 'vitest';
import {
  COLORS,
  DOT_R,
  MARK,
  createSilhouetteCache,
  drawSeaMap,
  hitIsland,
  mapDots,
  mapLayout,
  tileToMap,
  type MapMark,
  type RasterFactory,
} from '../../src/render/seaMap';
import { lanePoints } from '../../src/render/shipLane';
import { seaWorld, shipLiteral } from '../sim/seaHelpers';
import { createWorld } from '../../src/sim/world';
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

describe('drawSeaMap mit vier Inseln (AK-M14E1-33)', () => {
  it('Layout umfasst alle vier Inseln, vier Silhouetten, Pick auf Land von C liefert 3', () => {
    const w = createWorld(3, { unlockAll: true });
    expect(w.islands).toHaveLength(4);
    const { l, log } = draw(w);
    for (const s of w.islands) {
      for (const [x, y] of [
        [s.ox, s.oy],
        [s.ox + s.width, s.oy + s.height],
      ] as const) {
        const m = tileToMap(l, x, y);
        expect(m.x).toBeGreaterThanOrEqual(11.9);
        expect(m.x).toBeLessThanOrEqual(348.1);
        expect(m.y).toBeGreaterThanOrEqual(11.9);
        expect(m.y).toBeLessThanOrEqual(228.1);
      }
    }
    expect(log.events.filter((e) => e.op === 'drawImage')).toHaveLength(4);
    const c = w.islands[3]!;
    const k = c.tiles.findIndex((t) => t.terrain !== 'water');
    const p = tileToMap(l, c.ox + (k % c.width) + 0.5, c.oy + Math.floor(k / c.width) + 0.5);
    expect(hitIsland(w, l, p.x, p.y)).toBe(3);
  });
});

describe('drawSeaMap Marke Fernangebot/Fernauftrag (I-101 T01, AK-M6/M7)', () => {
  type Call = unknown[];
  interface Rec {
    calls: Call[];
    texts: { text: string; align: string; x: number; y: number; fill: string }[];
    ctx: CanvasRenderingContext2D;
  }
  /** Fake-Kontext mit Aufrufliste, `measureText` (6 px je Zeichen) und `fillText`-Protokoll. */
  function rec(): Rec {
    const inner = fakeCtx().ctx as unknown as Record<string, unknown>;
    const r: Rec = { calls: [], texts: [], ctx: null as never };
    const state: Record<string, unknown> = { textAlign: 'start' };
    r.ctx = new Proxy(inner, {
      get(t, k) {
        if (typeof k !== 'string') return Reflect.get(t, k);
        if (k === 'measureText') return (text: string) => ({ width: text.length * 6 });
        if (k === 'fillText')
          return (text: string, x: number, y: number) => {
            r.calls.push(['fillText', text, x, y]);
            r.texts.push({
              text,
              x,
              y,
              align: String(state.textAlign),
              fill: String(t.fillStyle),
            });
          };
        if (k === 'textAlign') return state.textAlign;
        const v = t[k];
        if (typeof v === 'function')
          return (...a: unknown[]) => {
            r.calls.push([k, ...a]);
            return (v as (...x: unknown[]) => unknown).apply(t, a);
          };
        return v;
      },
      set(t, k, v) {
        if (k === 'textAlign') state.textAlign = v;
        r.calls.push(['set', k, v]);
        return Reflect.set(t, k, v);
      },
    }) as unknown as CanvasRenderingContext2D;
    return r;
  }
  const mk = (over: Partial<MapMark> = {}): MapMark => ({
    island: 1,
    kind: 'offer',
    text: 'Holz 5',
    warn: false,
    ...over,
  });
  function run(
    mark: MapMark | null | undefined,
    lay?: (l: ReturnType<typeof mapLayout>) => ReturnType<typeof mapLayout>,
  ) {
    const w = seaWorld();
    const base = mapLayout(w, 360, 240, 12);
    const l = lay ? lay(base) : base;
    const r = rec();
    const ui = mark === undefined ? { hover: null, dpr: 1 } : { hover: null, dpr: 1, mark };
    drawSeaMap(r.ctx, w, l, createSilhouetteCache(factory), ui);
    return { w, l, r };
  }
  const n = (r: Rec, op: string) => r.calls.filter((c) => c[0] === op).length;

  it('M6a offer: ein arc mehr, ein stroke mehr, ein fillText mit dem Text', () => {
    const a = run(undefined).r;
    const b = run(mk()).r;
    expect(n(b, 'arc')).toBe(n(a, 'arc') + 1);
    expect(n(b, 'stroke')).toBe(n(a, 'stroke') + 1);
    expect(n(b, 'fill')).toBe(n(a, 'fill'));
    expect(b.texts).toHaveLength(1);
    expect(b.texts[0]!.text).toBe('Holz 5');
  });
  it('M6a order: gefüllte Münze (fill statt stroke)', () => {
    const a = run(undefined).r;
    const b = run(mk({ kind: 'order' })).r;
    expect(n(b, 'arc')).toBe(n(a, 'arc') + 1);
    expect(n(b, 'fill')).toBe(n(a, 'fill') + 1);
    expect(n(b, 'stroke')).toBe(n(a, 'stroke'));
  });
  it('M6a warn: Farbe markWarn statt markFill, gleiche Form', () => {
    const ok = run(mk({ kind: 'order' })).r;
    const warn = run(mk({ kind: 'order', warn: true })).r;
    expect(COLORS.markWarn).not.toBe(COLORS.markFill);
    expect(warn.texts[0]!.fill).toBe(COLORS.markWarn);
    expect(ok.texts[0]!.fill).toBe(COLORS.markFill);
    expect(warn.calls.filter((c) => c[0] !== 'set')).toEqual(
      ok.calls.filter((c) => c[0] !== 'set'),
    );
    expect(warn.calls.some((c) => c[0] === 'set' && c[2] === COLORS.markWarn)).toBe(true);
    const off = run(mk({ warn: true })).r;
    expect(
      off.calls.some((c) => c[0] === 'set' && c[1] === 'strokeStyle' && c[2] === COLORS.markWarn),
    ).toBe(true);
  });
  it('M6b ohne Marke und mit mark null: Aufrufliste bitgleich', () => {
    const a = run(undefined).r.calls;
    expect(run(null).r.calls).toEqual(a);
    expect(a.some((c) => c[0] === 'fillText')).toBe(false);
  });
  it('M6b unbekannte Insel: keine Marke', () => {
    expect(run(mk({ island: 99 })).r.calls).toEqual(run(undefined).r.calls);
  });
  it('M6c Marke nahe rechtem Rand: Text links der Münze (textAlign right)', () => {
    const w = seaWorld();
    const base = mapLayout(w, 360, 240, 12);
    const isl = w.islands[1]!;
    const a = tileToMap(base, isl.ox + isl.anchor.x + 0.5, isl.oy + isl.anchor.y + 0.5);
    const { r } = run(mk(), (l) => ({ ...l, w: a.x + 10 }));
    expect(r.texts[0]!.align).toBe('right');
    expect(r.texts[0]!.x).toBeLessThan(a.x);
    const left = run(mk()).r.texts[0]!;
    expect(left.align).not.toBe('right');
    expect(left.x).toBeGreaterThan(a.x);
  });
  it('M6c y bleibt innerhalb [Münzradius, h - Münzradius]', () => {
    const r0 = MARK * 0.9;
    const w = seaWorld();
    const base = mapLayout(w, 360, 240, 12);
    const isl = w.islands[1]!;
    const a = tileToMap(base, isl.ox + isl.anchor.x + 0.5, isl.oy + isl.anchor.y + 0.5);
    const top = run(mk(), (l) => ({ ...l, oy: l.oy - a.y + 1 })).r.texts[0]!;
    expect(top.y).toBeGreaterThanOrEqual(r0 - 1e-9);
    const bot = run(mk(), (l) => ({ ...l, oy: l.oy + 400 })).r.texts[0]!;
    expect(bot.y).toBeLessThanOrEqual(240 - r0 + 1e-9);
    expect(bot.y).toBeGreaterThanOrEqual(r0);
  });
  it('M7 hitIsland ist von der Marke unabhängig', () => {
    const { w, l, r } = run(mk());
    const p = { x: r.texts[0]!.x, y: r.texts[0]!.y };
    const plain = run(undefined);
    expect(hitIsland(w, l, p.x, p.y)).toBe(hitIsland(plain.w, plain.l, p.x, p.y));
    expect(hitIsland.length).toBe(4);
  });
});
