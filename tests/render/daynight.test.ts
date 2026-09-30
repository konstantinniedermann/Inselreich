import { describe, expect, it } from 'vitest';
import { dayNightAlpha } from '../../src/render/daynight';

describe('dayNightAlpha', () => {
  it('AK-A4-01 Tick 0 ist hell, Tick 3000 ist am dunkelsten (0.2)', () => {
    expect(dayNightAlpha(0)).toBeCloseTo(0, 10);
    expect(dayNightAlpha(3000)).toBeCloseTo(0.2, 10);
    expect(dayNightAlpha(6000)).toBeCloseTo(0, 10);
  });
  it('AK-A4-01 bleibt über 0…12000 zwischen 0 und 0.2', () => {
    for (let t = 0; t <= 12000; t += 7) {
      const a = dayNightAlpha(t);
      expect(a).toBeLessThanOrEqual(0.2 + 1e-12);
      expect(a).toBeGreaterThanOrEqual(-1e-12);
    }
  });
});
