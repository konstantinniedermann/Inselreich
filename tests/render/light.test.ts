import { describe, expect, it } from 'vitest';
import {
  LIGHT_COLORS,
  ROCK_TONES,
  TONE_EDGE_PX,
  mixRgb,
  smoothstep,
  toneColor,
  toneHalfWidth,
  toneStep,
} from '../../src/render/light';
import * as massif from '../../src/render/massif';

describe('H-R11 Tonleiter in light.ts', () => {
  it('H-R11 toneStep: ausserhalb des Übergangs ganzzahlig, Übergang nur um k + 0,5 und 2 · hw breit', () => {
    for (let t = 0; t <= 4; t += 0.01) {
      const hw = 0.1;
      const v = toneStep(t, hw),
        f = t - Math.floor(t);
      if (Math.abs(f - 0.5) > hw) expect(Math.abs(v - Math.round(v))).toBeLessThan(1e-9);
    }
    expect(toneStep(2.3, 0)).toBe(2);
    expect(toneStep(2.7, 0)).toBe(3);
    expect(toneStep(2.5, 0.2)).toBeCloseTo(2.5, 9);
  });

  it('H-R11 Kantenbreite: bei Gefälle g (Stufen je px) ist der Übergang TONE_EDGE_PX (1–2 px) breit', () => {
    expect(TONE_EDGE_PX).toBeGreaterThanOrEqual(1);
    expect(TONE_EDGE_PX).toBeLessThanOrEqual(2);
    for (const g of [0.05, 0.1, 0.3, 0.6]) {
      const hw = toneHalfWidth(g);
      const widthPx = (2 * hw) / g; // Übergang in Stufen / Gefälle
      expect(widthPx).toBeCloseTo(TONE_EDGE_PX, 6);
    }
    // sehr flach: nie ganz hart und nie breiter als eine halbe Stufe
    expect(toneHalfWidth(0)).toBeGreaterThan(0);
    expect(toneHalfWidth(100)).toBeLessThanOrEqual(0.5);
  });

  it('H-R11 toneColor: Rampenfarbe an ganzen Stufen, linear dazwischen, Klemmung', () => {
    for (let k = 0; k < ROCK_TONES.length; k++) expect(toneColor(k)).toEqual([...ROCK_TONES[k]!]);
    const m = toneColor(1.5);
    const mid = mixRgb(ROCK_TONES[1]!, ROCK_TONES[2]!, 0.5);
    for (let i = 0; i < 3; i++) expect(m[i]).toBeCloseTo(mid[i]!, 9);
    expect(toneColor(-3)).toEqual([...ROCK_TONES[0]!]);
    expect(toneColor(99)).toEqual([...ROCK_TONES[ROCK_TONES.length - 1]!]);
  });

  it('H-R11 Lichtsprache: Schatten kühl, Licht warm, nie Schwarz oder Weiss', () => {
    const warmth = (c: readonly number[]): number => c[0]! - c[2]!;
    expect(warmth(ROCK_TONES[0]!)).toBeLessThan(warmth(ROCK_TONES[4]!));
    for (const c of ROCK_TONES)
      for (const v of c) {
        expect(v).toBeGreaterThan(20);
        expect(v).toBeLessThan(240);
      }
    expect(warmth(LIGHT_COLORS.cool)).toBeLessThan(0);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 9);
  });

  it('H-R11 massif.ts führt die Tonleiter weiter aus (gleiche Objekte wie light.ts)', () => {
    expect(massif.toneStep).toBe(toneStep);
    expect(massif.toneColor).toBe(toneColor);
    expect(massif.ROCK_TONES).toBe(ROCK_TONES);
  });
});
