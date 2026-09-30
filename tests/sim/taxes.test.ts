import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { UPKEEP_INTERVAL, totalUpkeep } from '../../src/sim/economy';
import { step } from '../../src/sim/tick';
import { citizens, tickTaxes, totalTaxes } from '../../src/sim/population';
import { TIERS } from '../../src/sim/defs/tiers';
import type { GoodId, Tier, World } from '../../src/sim/types';

let w: World;
let nextTestId = 9000;

/** Legt ein Wohnhaus direkt an (ohne Kacheln); `met` bestimmt, ob alle Bedürfnisse erfüllt sind. */
function addHouse(world: World, tier: Tier, inhabitants: number, met: boolean): void {
  const def = TIERS[tier];
  const satisfied: Partial<Record<GoodId, boolean>> = {};
  for (const g of Object.keys(def.needs) as GoodId[]) satisfied[g] = met;
  const id = nextTestId++;
  world.buildings[id] = {
    id,
    defId: 'house',
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    house: {
      tier,
      inhabitants,
      demand: {},
      satisfied,
      services: { faith: met, school: met },
      satisfiedSince: 0,
      supplied: met,
    },
  };
}

beforeEach(() => {
  w = createWorld(3);
});

describe('totalTaxes', () => {
  it('pays full tax when satisfied (4 pioneers = 8)', () => {
    addHouse(w, 1, 4, true);
    expect(totalTaxes(w)).toBe(8);
  });
  it('pays half tax when unsatisfied (4 pioneers = 4)', () => {
    addHouse(w, 1, 4, false);
    expect(totalTaxes(w)).toBe(4);
  });
  it('floors a half-tax sum (3 unsatisfied pioneers = 3)', () => {
    addHouse(w, 1, 3, false);
    expect(totalTaxes(w)).toBe(3);
  });
  it('sums first, floors once (two unsatisfied citizen-tier-2 houses: 1.5 + 1.5 = 3, not 2)', () => {
    addHouse(w, 2, 1, false);
    addHouse(w, 2, 1, false);
    expect(totalTaxes(w)).toBe(3);
  });
});

describe('tickTaxes', () => {
  it('always updates stats but books only every UPKEEP_INTERVAL ticks', () => {
    addHouse(w, 1, 4, true);
    const m0 = w.money;
    w.tick = UPKEEP_INTERVAL - 1;
    tickTaxes(w);
    expect(w.stats.taxes).toBe(8);
    expect(w.money).toBe(m0);
    w.tick = UPKEEP_INTERVAL;
    tickTaxes(w);
    expect(w.money).toBe(m0 + 8);
    w.tick = 0;
    tickTaxes(w);
    expect(w.money).toBe(m0 + 8);
  });
  it('books taxes and upkeep together at tick 100 via step', () => {
    addHouse(w, 1, 4, true);
    const m0 = w.money;
    const upkeep = totalUpkeep(w);
    for (let i = 0; i < UPKEEP_INTERVAL - 1; i++) step(w);
    expect(w.money).toBe(m0);
    step(w);
    expect(w.stats.upkeep).toBe(upkeep);
    expect(w.money).toBe(m0 + w.stats.taxes - w.stats.upkeep);
  });
});

describe('citizens', () => {
  it('counts only inhabitants of tier 3 houses', () => {
    addHouse(w, 1, 4, true);
    addHouse(w, 2, 5, true);
    addHouse(w, 3, 7, true);
    addHouse(w, 3, 2, false);
    expect(citizens(w)).toBe(9);
  });
});
