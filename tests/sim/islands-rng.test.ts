import { describe, expect, it, vi } from 'vitest';
import { ISLANDS_SALT } from '../../src/sim/defs/sea';
import { generateMap } from '../../src/sim/mapgen';
import { step } from '../../src/sim/tick';
import { createWorld, home } from '../../src/sim/world';

const seen: number[] = [];

vi.mock('../../src/sim/rng', async (orig) => {
  const real = await orig<typeof import('../../src/sim/rng')>();
  return {
    ...real,
    createRng: (seed: number) => {
      seen.push(seed);
      return real.createRng(seed);
    },
  };
});

describe('M12 E1 Inselstrom (AK-E1-03)', () => {
  it('createWorld ruft createRng genau einmal mit (seed ^ ISLANDS_SALT) >>> 0', () => {
    seen.length = 0;
    const w = createWorld(3);
    expect(seen).toEqual([(w.seed ^ ISLANDS_SALT) >>> 0]);
  });

  it('6000 step normal ziehen den Inselstrom nie', () => {
    const w = createWorld(3, { crisisLevel: 'normal' });
    const salted = (w.seed ^ ISLANDS_SALT) >>> 0;
    seen.length = 0;
    for (let i = 0; i < 6000; i++) step(w);
    expect(seen).not.toContain(salted);
  });

  it('zweimal createWorld(3) tief gleich; Heimat-tiles = generateMap(3).terrain', () => {
    const a = createWorld(3);
    const b = createWorld(3);
    expect(a).toEqual(b);
    expect(home(a).tiles.map((t) => t.terrain)).toEqual(generateMap(3).terrain);
  });
});
