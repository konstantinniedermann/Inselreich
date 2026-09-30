import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { placeBuilding } from '../../src/sim/build';
import { allNeedsMet, GROWTH_INTERVAL, isSupplied, tickPopulation } from '../../src/sim/population';
import { step } from '../../src/sim/tick';
import { TIERS } from '../../src/sim/defs/tiers';
import type { Building, World } from '../../src/sim/types';
import { houseFar, houseNearKontor } from './helpers';

let w: World;

beforeEach(() => {
  w = createWorld(3);
});

function run(world: World, n: number): void {
  for (let i = 0; i < n; i++) {
    world.tick += 1;
    tickPopulation(world);
  }
}

describe('tickPopulation', () => {
  it('new house pulls food immediately and is satisfied', () => {
    const h = houseNearKontor(w);
    run(w, 1);
    expect(w.stock.food).toBe(19);
    expect(h.house!.satisfied.food).toBe(true);
    expect(h.house!.supplied).toBe(true);
  });

  it('consumes inhabitants*rate/100 per tick', () => {
    const h = houseNearKontor(w);
    h.house!.inhabitants = 4;
    run(w, 1);
    expect(w.stock.food).toBe(19);
    run(w, 48);
    expect(w.stock.food).toBe(19);
    run(w, 2);
    expect(w.stock.food).toBe(18);
  });

  it('unsatisfied when stock empty, demand capped at 1', () => {
    const h = houseNearKontor(w);
    w.stock.food = 0;
    run(w, 30);
    expect(h.house!.satisfied.food).toBe(false);
    expect(h.house!.demand.food).toBeLessThanOrEqual(1);
  });

  it('grows every 50 ticks when satisfied, shrinks otherwise, min 1 max 4', () => {
    const h = houseNearKontor(w);
    expect(GROWTH_INTERVAL).toBe(50);
    w.tick = 49;
    run(w, 1);
    expect(h.house!.inhabitants).toBe(2);
    run(w, 49);
    expect(h.house!.inhabitants).toBe(2);
    run(w, 1);
    expect(h.house!.inhabitants).toBe(3);
    run(w, 100);
    expect(h.house!.inhabitants).toBe(4);
    run(w, 50);
    expect(h.house!.inhabitants).toBe(4);
    w.stock.food = 0;
    run(w, 400);
    expect(h.house!.inhabitants).toBe(1);
  });

  it('house outside supply radius never consumes and never grows', () => {
    const h = houseFar(w);
    const food = w.stock.food;
    run(w, 200);
    expect(h.house!.supplied).toBe(false);
    expect(w.stock.food).toBe(food);
    expect(h.house!.inhabitants).toBe(1);
    expect(h.house!.satisfied.food).toBe(false);
  });

  it('market supplies only when connected', () => {
    const far = houseFar(w);
    const m = placeBuilding(w, 'market', far.x + 1, far.y);
    expect(m.ok).toBe(true);
    const market: Building = w.buildings[m.id!]!;
    expect(market.connected).toBe(false);
    expect(isSupplied(w, far)).toBe(false);
    run(w, 1);
    expect(far.house!.supplied).toBe(false);
    market.connected = true;
    expect(isSupplied(w, far)).toBe(true);
    run(w, 1);
    expect(far.house!.supplied).toBe(true);
  });

  it('satisfiedSince resets on any unmet need', () => {
    const h = houseNearKontor(w);
    run(w, 10);
    expect(h.house!.satisfiedSince).toBe(0);
    w.stock.food = 0;
    h.house!.demand.food = 1;
    run(w, 1);
    expect(h.house!.satisfiedSince).toBe(w.tick);
    w.stock.food = 5;
    run(w, 1);
    expect(h.house!.satisfiedSince).toBe(w.tick - 1);
    expect(allNeedsMet(h.house!, TIERS[1])).toBe(true);
    expect(allNeedsMet({ ...h.house!, supplied: false }, TIERS[1])).toBe(false);
    expect(allNeedsMet(h.house!, TIERS[2])).toBe(false);
  });

  it('is called from step', () => {
    houseNearKontor(w);
    step(w);
    expect(w.stock.food).toBe(19);
  });
});
