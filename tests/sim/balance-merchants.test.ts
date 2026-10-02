import { describe, expect, it } from 'vitest';
import { merchants } from '../../src/sim/population';
import { deserialize, serialize } from '../../src/sim/save';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { layoutFor, startColony } from './controller';
import {
  MERCHANT_TICK_LIMIT,
  newMerchantTrajectory,
  runMerchants,
  type MerchantTrajectory,
} from './merchantsController';

/** Sieg-Tick des Bürger-Controllers (balance.test.ts, Spec 16.1). */
const WIN_TICK = 6050;
/** Seed 3, Krisen aus: Startphase des Bürger-Controllers, dann Merchant-Schleife bis zum zweiten Ziel. */
function run(): { w: World; t: MerchantTrajectory } {
  const w = createWorld(3);
  const { layout } = startColony(w);
  const t = newMerchantTrajectory();
  expect(runMerchants(w, layout, t)).toBe(false);
  return { w, t };
}

/** Laufdaten: `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-merchants.test.ts --silent=false`. */
function log(label: string, w: World, t: MerchantTrajectory): void {
  if (import.meta.env.VITE_BALANCE_LOG)
    console.log({ case: label, ...t, tick: w.tick, money: w.money, merchants: merchants(w) });
}

describe('M8 B1 Szenario-Lauf bis zum zweiten Ziel', () => {
  it('AK-B1-01 Sieg 6050, zweites Ziel bis 12 000, Geld > 0, won', () => {
    const { w, t } = run();
    log('standard', w, t);
    expect(t.winTick).toBe(WIN_TICK);
    expect(w.won).toBe(true);
    expect(w.wonMerchants).toBe(true);
    expect(t.wonMerchantsTick).not.toBeNull();
    expect(t.wonMerchantsTick!).toBeLessThanOrEqual(MERCHANT_TICK_LIMIT);
    expect(w.money).toBeGreaterThan(0);
  });

  it('AK-B1-02 Messwerte vollständig: Endzustand, erster Kaufmann, zweites Ziel, Gebäudezahlen', () => {
    const { t } = run();
    expect(t.endStateTick).not.toBeNull();
    expect(t.endStateTick!).toBeGreaterThan(WIN_TICK);
    expect(t.firstMerchantTick).not.toBeNull();
    expect(t.firstMerchantTick!).toBeGreaterThan(t.endStateTick!);
    expect(t.wonMerchantsTick!).toBeGreaterThan(t.firstMerchantTick!);
    expect(t.minMoneyAfterWin).not.toBeNull();
    expect(t.buildings.bathhouse).toBe(1);
    expect(t.buildings.glassworks).toBe(3);
  });

  it('AK-B1-04 Laden beim ersten Kaufmann: gleicher Endzustand, gleicher wonMerchantsTick', () => {
    const a = run();
    let w = createWorld(3);
    const { layout } = startColony(w);
    const t = newMerchantTrajectory();
    expect(runMerchants(w, layout, t, (x) => merchants(x) > 0)).toBe(true);
    expect(w.tick).toBe(a.t.firstMerchantTick);
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error(r.reason);
    w = r.world;
    expect(runMerchants(w, layoutFor(w), t)).toBe(false);
    expect(serialize(w)).toBe(serialize(a.w));
    expect(t.wonMerchantsTick).toBe(a.t.wonMerchantsTick);
  });
});
