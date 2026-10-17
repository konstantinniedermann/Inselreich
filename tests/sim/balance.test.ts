import { describe, expect, it } from 'vitest';
import { COUNCIL_TIERS } from '../../src/sim/defs/council';
import { WIN_CITIZENS } from '../../src/sim/defs/tiers';
import { citizens } from '../../src/sim/population';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { buildColony, MAX_TICKS, WIN_TICK_LIMIT } from './controller';

/** AK-11: Der Controller beschliesst nie; `council[n]` ist `'open'` für n ≤ höchste Hausstufe m, sonst `null`. */
function expectNoDecree(w: World): void {
  const tiers = Object.values(w.buildings).map((b) => b.house?.tier ?? 0);
  const m = Math.max(0, ...tiers);
  if (import.meta.env.VITE_BALANCE_LOG) console.log({ hoechsteHausstufe: m });
  for (const n of COUNCIL_TIERS) expect(w.council[n]).toBe(n <= m ? 'open' : null);
}

// AK-B1-01: Controller aus ./controller (M6-B1), Sieg 6050 vor und nach der Auslagerung.
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
    expectNoDecree(w);
    expect(w.trial).toEqual({ active: null, ticks: 0, e0: 0, passed: [] });
  });
});
