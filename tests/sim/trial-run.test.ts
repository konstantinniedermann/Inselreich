import { beforeAll, describe, expect, it } from 'vitest';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { TRIAL_DURATION_TICKS, TRIAL_FAIL_POP_PCT } from '../../src/sim/defs/trials';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import { startTrial, trialPopulation } from '../../src/sim/trial';
import type { World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { layoutFor, startColony } from './controller';
import { placeTownhall } from './helpers';
import { newMerchantTrajectory, runMerchants } from './merchantsController';

// I-132 T02: Referenzstand K'-arm wie balance-monument.test.ts Phase 1/2 (Seed 3).
// AK 6 emuliert den Sollfluss eigener Ketten und belegt den Ausbaupfad nicht.

const SEEDS = [3, 1] as const;
const MAX_STEPS = 1200;
const SOLL_INTERVAL = 100;
const SOLL_AMOUNT = 6;

const log = (label: string, data: unknown): void => {
  console.info(`[trial-run] ${label}`, JSON.stringify(data));
};

const saves = new Map<number, string>();

beforeAll(() => {
  for (const seed of SEEDS) {
    const w = createWorld(seed);
    const { layout } = startColony(w);
    expect(runMerchants(w, layout, newMerchantTrajectory(), (x) => x.won)).toBe(true);
    placeTownhall(w);
    runMerchants(w, layoutFor(w), newMerchantTrajectory());
    while (w.tick % 200 !== 0) step(w);
    saves.set(seed, serialize(w));
  }
}, 15_000); // Messwert 0,6 s für beide Seeds, Faktor 25

function trialWorld(seed: number): World {
  const r = deserialize(saves.get(seed)!);
  if (!r.ok) throw new Error(r.reason);
  const w = r.world;
  w.monumentDone = true;
  w.crisisLevel = 'off';
  expect(startTrial(w, 'selfSupply')).toEqual({ ok: true });
  return w;
}

describe.each(SEEDS)("K'-arm Seed %i", (seed) => {
  it('AK-7 ohne Zufuhr scheitert', () => {
    const w = trialWorld(seed);
    const { e0 } = w.trial;
    const start = w.tick;
    let min = trialPopulation(w);
    let prev = min;
    let n = 0;
    while (w.trial.active !== null && n < MAX_STEPS) {
      prev = trialPopulation(w);
      step(w);
      n += 1;
      min = Math.min(min, trialPopulation(w));
    }
    const pop = trialPopulation(w);
    log(`AK-7 Seed ${seed}`, {
      endeTickRelativ: w.tick - start,
      abstandZurSchwelle: pop * 100 - e0 * TRIAL_FAIL_POP_PCT,
      minEinwohner: min,
      e0,
    });
    expect(w.trial.active).toBeNull();
    expect(pop * 100).toBeLessThan(e0 * TRIAL_FAIL_POP_PCT);
    expect(prev * 100).toBeGreaterThanOrEqual(e0 * TRIAL_FAIL_POP_PCT);
    expect(w.trial.passed).toEqual([]);
  });
});

describe("K'-arm Seed 3", () => {
  it('AK-6 mit Sollzufuhr besteht', () => {
    const w = trialWorld(3);
    const start = w.tick;
    let min = trialPopulation(w);
    const run = (n: number): void => {
      for (let i = 0; i < n; i++) {
        if (w.tick % SOLL_INTERVAL === 0) {
          const s = home(w).stock;
          s.spice = Math.min(STORAGE_CAP, s.spice + SOLL_AMOUNT);
          s.stone = Math.min(STORAGE_CAP, s.stone + SOLL_AMOUNT);
        }
        step(w);
        min = Math.min(min, trialPopulation(w));
      }
    };
    run(TRIAL_DURATION_TICKS - 1);
    expect(w.trial.active).toBe('selfSupply');
    run(1);
    log('AK-6 Seed 3', { minEinwohner: min, e0: w.trial.e0 });
    expect(w.trial.passed[0]).toEqual({ id: 'selfSupply', tick: start + TRIAL_DURATION_TICKS });
  }, 10_000); // Messwert 0,33 s, Faktor 30
});
