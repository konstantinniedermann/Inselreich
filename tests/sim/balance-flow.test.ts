import { describe, expect, it } from 'vitest';
import { WIN_CITIZENS } from '../../src/sim/defs/tiers';
import { citizens } from '../../src/sim/population';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { CONTROL_INTERVAL, control, MAX_TICKS, startColony } from './controller';

const tierSum = (w: World): number =>
  Object.values(w.buildings).reduce((s, b) => s + (b.house?.tier ?? 0), 0);

describe('M11 Fluss im Referenzlauf (Spec 3.1)', () => {
  it('AK-P1-05 Seed 3, Krisen aus: |Δ − (taxes − upkeep) / 100| ≤ 2 in jedem Schritt ohne Aufstieg', () => {
    const w = createWorld(3);
    const { layout } = startColony(w);
    let checked = 0;
    while (w.tick < MAX_TICKS && citizens(w) < WIN_CITIZENS) {
      if (w.tick % CONTROL_INTERVAL === 0) control(w, layout, {});
      const [m0, t0] = [w.money, tierSum(w)];
      step(w);
      if (tierSum(w) > t0) continue; // Aufstieg bezahlt in step (Spec 11.1)
      const d = w.money - m0 - (w.stats.taxes - w.stats.upkeep) / 100;
      expect(Math.abs(d), `Tick ${w.tick}`).toBeLessThanOrEqual(2);
      checked++;
    }
    expect(w.won).toBe(true);
    expect(checked).toBeGreaterThan(6000);
  });
});
