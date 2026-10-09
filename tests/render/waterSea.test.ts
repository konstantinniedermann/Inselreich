import { beforeAll, describe, expect, it } from 'vitest';
import { PALETTE, rgbOf } from '../../src/render/palette';
import {
  FOAM_ALPHA,
  FOAM_CORE_ALPHA,
  FOAM_PERIOD_MS,
  drawWaves,
  SEA_ELEMENT_MIN_ZOOM,
  seaFoam,
} from '../../src/render/water';
import { seaContext, seaPlan } from '../../src/render/decor';
import type { World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { fakeCtx } from './fakeCtx';

const foamRgb = rgbOf(PALETTE.foam).join(',');
const alphaOf = (css: string): number => Number(/,([\d.]+)\)$/.exec(css)![1]);
const isFoam = (css: string) => css.startsWith(`rgba(${foamRgb},`);
type R = { x0: number; y0: number; x1: number; y1: number };
const frame = (w: World, range: R, t: number, reduce = false) => {
  const f = fakeCtx();
  drawWaves(f.ctx, w, range, t, undefined, reduce);
  return f.log.events.filter(
    (e) => e.op === 'stroke' && isFoam(e.style) && alphaOf(e.style) >= 0.3,
  );
};
/** Eine Welt mit Felseiland im Mittelwasser: dort gibt es keinen Küstenschaum, nur den Ring. */
function isletWorld(): { w: World; x: number; y: number } {
  for (let seed = 1; seed <= 200; seed++) {
    const w = createWorld(seed);
    const p = seaPlan(seed, home(w), seaContext(w));
    if (p.islet) return { w, x: p.islet.x, y: p.islet.y };
  }
  throw new Error('kein Felseiland in Seeds 1–200');
}

describe('L5-T4 Schaum an Riff, Wrack, Fels und Eiland', () => {
  const { w, x, y } = isletWorld();
  const around: R = { x0: x - 1, y0: y - 1, x1: x + 1, y1: y + 1 };
  const farAway: R = { x0: x + 20, y0: y + 20, x1: x + 22, y1: y + 22 };

  it('seaFoam: je Welt gehalten; Ringstücke direkt am Objekt (≤ Fussabdruck + 0,15), nie geschlossen, Radien und Längen streuen', () => {
    const f = seaFoam(w);
    expect(seaFoam(w)).toBe(f);
    const plan = seaPlan(w.seed, home(w), seaContext(w));
    expect(f.rings.length).toBe((plan.wreck ? 1 : 0) + plan.rocks.length + 1);
    for (const r of f.rings) {
      expect(r.pieces.length).toBeGreaterThanOrEqual(3);
      expect(r.pieces.length).toBeLessThanOrEqual(5);
      const radii = r.pieces.map((p) => p.r);
      for (const p of r.pieces) {
        expect(p.r, 'dicht am Objekt').toBeLessThanOrEqual(r.fp + 0.15);
        expect(p.r).toBeGreaterThanOrEqual(r.fp + 0.02);
        expect(p.a1).toBeGreaterThan(p.a0);
      }
      expect(Math.max(...radii) / Math.min(...radii), 'Radien streuen').toBeGreaterThanOrEqual(1.2);
      const lens = r.pieces.map((p) => p.a1 - p.a0);
      expect(Math.max(...lens) / Math.min(...lens), 'Längen streuen').toBeGreaterThanOrEqual(1.3);
      expect(
        lens.reduce((a, b) => a + b, 0),
        'nie ein geschlossener Kreis',
      ).toBeLessThan(Math.PI * 1.7);
    }
  });

  // Gemeinsamer Aufbau (Welten, Plan, Schaum) ausserhalb der Testzeit; Aussage, Seeds und Schwellen unverändert.
  const reefWorlds = new Map<number, ReturnType<typeof createWorld>>();
  beforeAll(() => {
    for (let seed = 1; seed <= 30; seed++) {
      const wo = createWorld(seed);
      reefWorlds.set(seed, wo);
      seaFoam(wo);
      seaPlan(seed, home(wo), seaContext(wo));
    }
  }, 30_000);

  it('Riffschaum: gebogene Sicheln (nie gerade), gestreute Längen, weiche Lage an der Seeseite je Riffkachel', () => {
    let n = 0;
    const lens: number[] = [];
    for (let seed = 1; seed <= 30; seed++) {
      const wo = reefWorlds.get(seed)!;
      const f = seaFoam(wo);
      const plan = seaPlan(seed, home(wo), seaContext(wo));
      const tiles = plan.reefs.reduce((k, a) => k + a.tiles.length, 0);
      expect(f.reefs.length, `Seed ${seed}`).toBeLessThanOrEqual(2 * tiles);
      for (const c of f.reefs) {
        n++;
        const cross = (c.cx - c.x0) * (c.y1 - c.y0) - (c.cy - c.y0) * (c.x1 - c.x0);
        expect(Math.abs(cross), 'gebogen').toBeGreaterThan(0.004);
        lens.push(Math.hypot(c.x1 - c.x0, c.y1 - c.y0));
      }
    }
    expect(n).toBeGreaterThan(100);
    expect(Math.max(...lens) / Math.min(...lens), 'Längen streuen').toBeGreaterThanOrEqual(1.8);
    // keine zwei Stücke mit genau gleicher Länge in Folge (kein Raster)
    let equal = 0;
    for (let i = 1; i < lens.length; i++) if (Math.abs(lens[i]! - lens[i - 1]!) < 1e-6) equal++;
    expect(equal).toBe(0);
  });

  it('Schaum nur im Bereich der Elemente: ohne Element im range keine Schaumlinie, mit Eiland im range Linien', () => {
    expect(frame(w, around, 500).length).toBeGreaterThan(0);
    expect(frame(w, farAway, 500)).toHaveLength(0);
  });

  it('Deckkraft liegt im Band FOAM_ALPHA (Saum) und FOAM_CORE_ALPHA (Kern); Linien blinken nie (kein harter Ein/Aus)', () => {
    let prev: number | null = null;
    for (let t = 0; t <= 2 * FOAM_PERIOD_MS; t += 100) {
      const ev = frame(w, around, t);
      expect(ev.length, `t=${t}: immer da`).toBeGreaterThan(0);
      for (const e of ev) {
        const a = alphaOf(e.style);
        const inSeam = a >= FOAM_ALPHA[0] - 1e-3 && a <= FOAM_ALPHA[1] + 1e-3;
        const inCore = a >= FOAM_CORE_ALPHA[0] - 1e-3 && a <= FOAM_CORE_ALPHA[1] + 1e-3;
        expect(inSeam || inCore, `${e.style}`).toBe(true);
      }
      const a0 = alphaOf(ev[0]!.style);
      if (prev !== null) expect(Math.abs(a0 - prev)).toBeLessThanOrEqual(0.12);
      prev = a0;
    }
  });

  it('Periode FOAM_PERIOD_MS: nach einer Periode dasselbe Bild; Linien wandern gleitend (kleine Schritte)', () => {
    const sig = (t: number) =>
      JSON.stringify(
        frame(w, around, t).map((e) => [
          e.style,
          e.points.map((p) => [p.x.toFixed(3), p.y.toFixed(3)]),
        ]),
      );
    expect(sig(700)).toBe(sig(700 + FOAM_PERIOD_MS));
    expect(sig(0)).not.toBe(sig(FOAM_PERIOD_MS / 2));
    const pt = (t: number) => frame(w, around, t)[0]!.points[0]!;
    const a = pt(1000),
      b = pt(1050);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThan(5); // Bildpunkte bei Matrix 1: wenig Bewegung je 50 ms
  });

  it('reduceMotion: statischer Schaum, unabhängig von der Zeit', () => {
    const sig = (t: number) =>
      JSON.stringify(frame(w, around, t, true).map((e) => [e.style, e.points]));
    expect(sig(0)).toBe(sig(1234));
    expect(sig(0)).toBe(sig(FOAM_PERIOD_MS / 2));
    expect(frame(w, around, 0, true).length).toBeGreaterThan(0);
  });

  it('Riff: Schaum liegt an der Seeseite, nur für Riffkacheln im range', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const wo = createWorld(seed);
      const f = seaFoam(wo);
      const t = f.reefs[0];
      if (!t) continue;
      const [tx, ty] = [t.tx, t.ty];
      const inR = { x0: tx, y0: ty, x1: tx, y1: ty };
      expect(frame(wo, inR, 0).length, `Seed ${seed}`).toBeGreaterThan(0);
      return;
    }
    throw new Error('kein Riff');
  });

  it('REL-07: Schaum an Wrack und Felseiland nur ab SEA_ELEMENT_MIN_ZOOM; Fels bleibt', () => {
    const { w: iw, x, y } = isletWorld();
    const at = { x0: x - 2, y0: y - 2, x1: x + 2, y1: y + 2 };
    const n = (zoom: number) => {
      const f = fakeCtx();
      drawWaves(f.ctx, iw, at, 0, undefined, false, true, zoom);
      return f.log.events.filter(
        (e) => e.op === 'stroke' && isFoam(e.style) && alphaOf(e.style) >= 0.3,
      ).length;
    };
    expect(SEA_ELEMENT_MIN_ZOOM).toBe(0.5);
    expect(n(1)).toBeGreaterThan(0);
    expect(n(0.5)).toBe(n(1));
    expect(n(0.25)).toBe(0);
    expect(n(0.125)).toBe(n(0.25));
  });
});
