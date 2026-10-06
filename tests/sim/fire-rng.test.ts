import { describe, expect, it, vi } from 'vitest';

/** Zählt alle Ziehungen aller `createRng`-Instanzen (Spion um den echten RNG; Verhalten unverändert). */
const draws = vi.hoisted(() => ({ n: 0 }));
vi.mock('../../src/sim/rng', async (orig) => {
  const real = await orig<typeof import('../../src/sim/rng')>();
  return {
    ...real,
    createRng: (seed: number) => {
      const r = real.createRng(seed);
      return () => {
        draws.n++;
        return r();
      };
    },
  };
});

import { CRISIS_FIRST_TICK } from '../../src/sim/defs/timing';
import { tickCrises } from '../../src/sim/crises';
import { fireWorld } from './fixtureV8';
import { foundKontor2Literal } from './seaHelpers';
import { putBuilding } from './helpers';

describe('M12 E2 Brandziehung (AK-E2-07)', () => {
  it('Periode mit Brand zieht mit zwei Inseln genauso oft wie mit einer (Art, x, y)', () => {
    const one = fireWorld(1);
    one.tick = CRISIS_FIRST_TICK + 600; // Seed 1, k = 1 ist ein Brand (FIRE_PINS)
    draws.n = 0;
    tickCrises(one);
    expect(one.crisis!.kind).toBe('fire');
    const base = draws.n;
    expect(base).toBe(3);

    const two = fireWorld(1);
    const k2 = foundKontor2Literal(two, 2);
    putBuilding(two, 2, 'weaver', k2.x + 3, k2.y);
    two.tick = CRISIS_FIRST_TICK + 600;
    draws.n = 0;
    tickCrises(two);
    expect(two.crisis!.kind).toBe('fire');
    expect(draws.n).toBe(base);
  });
});
