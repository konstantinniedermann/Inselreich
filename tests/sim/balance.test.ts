import { describe, expect, it } from 'vitest';
import { WIN_CITIZENS } from '../../src/sim/defs/tiers';
import { citizens } from '../../src/sim/population';
import { createWorld } from '../../src/sim/world';
import { buildColony, MAX_TICKS, WIN_TICK_LIMIT } from './controller';

describe('balance: scripted colony (Kurz-Spec Balancing)', () => {
  it('reaches 50 citizens within 9000 ticks and ends with positive money', () => {
    const w = createWorld(3);
    const t = buildColony(w);
    if (import.meta.env.VITE_BALANCE_LOG)
      console.log({ ...t, tick: w.tick, citizens: citizens(w) });

    expect(citizens(w)).toBeGreaterThanOrEqual(WIN_CITIZENS);
    expect(w.tick).toBeLessThanOrEqual(MAX_TICKS);
    expect(w.money).toBeGreaterThan(0);
    expect(w.won).toBe(true);
    expect(t.winTick).not.toBeNull();
    expect(t.winTick!).toBeLessThanOrEqual(WIN_TICK_LIMIT);
  });
});
