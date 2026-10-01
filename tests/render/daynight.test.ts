import { describe, expect, it } from 'vitest';
import { DAY_TICKS, lightAt, lumaOf, phaseAt } from '../../src/render/daynight';

describe('Tageslicht', () => {
  it('AK-R1-04 Faktoren in [0,1], Luma ≥ 0,75, Tick 0 neutral, Periode 6000', () => {
    expect(lightAt(0).mul).toEqual([1, 1, 1]);
    for (let t = 0; t < DAY_TICKS; t++) {
      const { mul } = lightAt(t);
      for (const c of mul) {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      }
      expect(lumaOf(mul)).toBeGreaterThanOrEqual(0.75);
      expect(lightAt(t + DAY_TICKS)).toEqual(lightAt(t));
    }
  });
  it('AK-R1-04 Phasen an den Ticks 0, 2000, 2700, 4500, 5100', () => {
    expect([0, 2000, 2700, 4500, 5100].map(phaseAt)).toEqual([
      'day',
      'evening',
      'night',
      'morning',
      'day',
    ]);
  });
  it('Spec 6.1 Stützpunkte: Tick 2820 Nacht mit Fenster 1, Tick 2520 Fenster 0,6', () => {
    expect(lightAt(2820).mul).toEqual([0.733, 0.753, 0.813]);
    expect(lightAt(2820).windows).toBe(1);
    expect(lightAt(2520).windows).toBeCloseTo(0.6, 10);
  });
  it('AK-R1-04 negative Ticks laufen periodisch weiter', () => {
    expect(lightAt(-DAY_TICKS + 2820)).toEqual(lightAt(2820));
    expect(phaseAt(-1)).toBe('day');
  });
});
