import { describe, expect, it } from 'vitest';
import {
  SAUM_LEVEL,
  saumAt,
  woodBase,
  woodBlur,
  woodNoise,
  type WoodMask,
} from '../../src/render/woodField';

// woodField.test.ts — WALD-02 Saumfeld S(x, y): geglättete Waldmaske plus Randrauschen (reine Mathematik).

const W = 30;
/** Maske aus einer Prädikatfunktion über W × W Kacheln. */
const mask = (f: (x: number, y: number) => boolean): WoodMask => {
  const m = new Uint8Array(W * W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) m[y * W + x] = f(x, y) ? 1 : 0;
  return woodBlur(W, W, m);
};
/** Rechteckwald x 10…19, y 10…19. */
const rect = mask((x, y) => x >= 10 && x < 20 && y >= 10 && y < 20);

describe('WALD-02 Saumfeld', () => {
  it('RF-W-1 deterministisch: gleiche Maske und gleicher Seed ergeben dasselbe S', () => {
    const a = mask((x, y) => (x * 7 + y * 3) % 5 < 2);
    const b = mask((x, y) => (x * 7 + y * 3) % 5 < 2);
    for (let i = 0; i < 200; i++) {
      const fx = 3 + (i % 20) * 1.13,
        fy = 2 + Math.floor(i / 20) * 2.31;
      expect(saumAt(7, a, fx, fy)).toBe(saumAt(7, b, fx, fy));
    }
  });

  it('RF-W-1 Glättung: an einer geraden Kante 0,5, eine Kachel innen ≥ 0,7, eine Kachel aussen ≤ 0,3; tief innen 1, weit aussen 0', () => {
    expect(woodBase(rect, 15, 10)).toBeCloseTo(0.5, 5);
    expect(woodBase(rect, 15, 11)).toBeGreaterThanOrEqual(0.7);
    expect(woodBase(rect, 15, 9)).toBeLessThanOrEqual(0.3);
    expect(woodBase(rect, 15, 15)).toBeCloseTo(1, 5);
    expect(woodBase(rect, 4, 4)).toBe(0);
  });

  it('RF-W-1 Ecken: die konvexe Maskenecke ist gerundet (S der Ecke < 0,35), die konkave gefüllt (> 0,65)', () => {
    // konvex: äussere Ecke des Rechtecks
    expect(woodBase(rect, 10, 10)).toBeLessThan(0.35);
    expect(woodBase(rect, 20, 20)).toBeLessThan(0.35);
    // konkav: L-förmiger Wald, innere Ecke bei (15, 15)
    const l = mask((x, y) => x >= 5 && x < 25 && y >= 5 && y < 25 && !(x >= 15 && y >= 15));
    expect(woodBase(l, 15, 15)).toBeGreaterThan(0.65);
  });

  it('RF-W-1 Rauschen: in [−1; 1], Mittel nahe 0, und es wellt nur nahe am Rand (tief innen und weit aussen bleibt S unverändert)', () => {
    let sum = 0,
      lo = Infinity,
      hi = -Infinity;
    for (let i = 0; i < 2000; i++) {
      const n = woodNoise(5, (i % 50) * 0.37, Math.floor(i / 50) * 0.41);
      sum += n;
      lo = Math.min(lo, n);
      hi = Math.max(hi, n);
    }
    expect(lo).toBeGreaterThanOrEqual(-1);
    expect(hi).toBeLessThanOrEqual(1);
    expect(Math.abs(sum / 2000)).toBeLessThan(0.15);
    expect(hi - lo).toBeGreaterThan(0.8);
    for (const seed of [1, 2, 5, 7]) {
      expect(saumAt(seed, rect, 15.3, 15.6)).toBeCloseTo(1, 5);
      expect(saumAt(seed, rect, 3.3, 4.6)).toBe(0);
    }
  });

  it('RF-W-1 Saumlinie wellt: entlang einer geraden Kante (10 Kacheln) wandert die Höhenlinie S = SAUM_LEVEL mit SD ≥ 0,15 Kachel', () => {
    for (const seed of [1, 2, 5, 7, 11, 14]) {
      const pos: number[] = [];
      for (let x = 10.25; x < 20; x += 0.5) {
        // von aussen (y = 7) nach innen suchen
        let y = 7;
        while (y < 14 && saumAt(seed, rect, x, y) < SAUM_LEVEL) y += 0.02;
        pos.push(y);
      }
      const m = pos.reduce((a, b) => a + b, 0) / pos.length;
      const sd = Math.sqrt(pos.reduce((a, b) => a + (b - m) ** 2, 0) / pos.length);
      expect(sd, `Seed ${seed}`).toBeGreaterThanOrEqual(0.15);
      // im Mittel nahe an der Maskenkante (nach innen weicht der lichte Rand weiter zurück als nach aussen, A3)
      expect(Math.abs(m - 10), `Seed ${seed}`).toBeLessThan(1);
    }
  });
});
