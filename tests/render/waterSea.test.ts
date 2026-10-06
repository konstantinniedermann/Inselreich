import { describe, expect, it } from 'vitest';
import { PALETTE, rgbOf } from '../../src/render/palette';
import {
  FOAM_ALPHA,
  FOAM_CORE_ALPHA,
  FOAM_PERIOD_MS,
  drawWaves,
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

  it('seaFoam: je Welt gehalten; Ringe um Wrack, Fels und Eiland, Riffstücke je Riffkachel an der Seeseite', () => {
    const f = seaFoam(w);
    expect(seaFoam(w)).toBe(f);
    const plan = seaPlan(w.seed, home(w), seaContext(w));
    expect(f.rings.length).toBe((plan.wreck ? 1 : 0) + plan.rocks.length + 1);
    expect(f.reefs.length).toBe(plan.reefs.reduce((n, a) => n + a.tiles.length, 0));
    for (const r of f.rings) expect(r.r).toBeLessThanOrEqual(1.2);
    for (const r of f.reefs) expect(Math.hypot(r.dx, r.dy)).toBeCloseTo(1, 5);
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
      const [tx, ty] = [Math.floor(t.x), Math.floor(t.y)];
      const inR = { x0: tx, y0: ty, x1: tx, y1: ty };
      expect(frame(wo, inR, 0).length, `Seed ${seed}`).toBeGreaterThan(0);
      return;
    }
    throw new Error('kein Riff');
  });
});
