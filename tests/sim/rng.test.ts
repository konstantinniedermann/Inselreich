import { describe, expect, it } from 'vitest';
import { createRng } from '../../src/sim/rng';
import { hash2, valueNoise } from '../../src/sim/noise';

describe('rng', () => {
  it('is deterministic and in [0,1)', () => {
    const a = createRng(42),
      b = createRng(42);
    for (let i = 0; i < 1000; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('differs by seed', () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });
});
describe('noise', () => {
  it('hash2 is deterministic per coordinate', () => {
    expect(hash2(7, 3, 4)).toBe(hash2(7, 3, 4));
    expect(hash2(7, 3, 4)).not.toBe(hash2(7, 4, 3));
  });
  it('valueNoise is continuous-ish and bounded', () => {
    for (let i = 0; i < 200; i++) {
      const v = valueNoise(3, i * 0.37, i * 0.11);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
    expect(Math.abs(valueNoise(3, 5.0, 5.0) - valueNoise(3, 5.01, 5.0))).toBeLessThan(0.05);
  });
});
