import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { checkWin, step } from '../../src/sim/tick';
import { WIN_CITIZENS } from '../../src/sim/defs/tiers';
import type { Building, World } from '../../src/sim/types';
import { orderForPeriod } from '../../src/sim/orders';
import { UPGRADE_DEFICIT_WAIT_FACTOR } from '../../src/sim/defs/timing';
import { UPGRADE_WAIT } from '../../src/sim/population';
import { TIERS } from '../../src/sim/defs/tiers';
import { forceGrass, houseNearKontor, placeService, prepareEast } from './helpers';

let w: World;
let nextTestId = 9000;

function citizenHouse(world: World, inhabitants: number): Building {
  const id = nextTestId++;
  const b: Building = {
    id,
    defId: 'house',
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    island: 0,
    house: {
      tier: 3,
      inhabitants,
      demand: {},
      satisfied: {},
      services: {},
      satisfiedSince: 0,
      supplied: false,
    },
  };
  world.buildings[id] = b;
  return b;
}

beforeEach(() => {
  w = createWorld(3, { unlockAll: true });
});

describe('checkWin', () => {
  it('wins at exactly 50 citizens and stays won', () => {
    expect(WIN_CITIZENS).toBe(50);
    const a = citizenHouse(w, 25);
    const b = citizenHouse(w, 24);
    checkWin(w);
    expect(w.won).toBe(false);
    b.house!.inhabitants = 25;
    checkWin(w);
    expect(w.won).toBe(true);
    a.house!.inhabitants = 1;
    b.house!.inhabitants = 1;
    checkWin(w);
    expect(w.won).toBe(true);
    step(w);
    expect(w.won).toBe(true);
  });
});

describe('step order', () => {
  it('runs tick, production, population, taxes and economy within 100 steps', () => {
    prepareEast(w, w.buildings[home(w).kontorId]!);
    const k = w.buildings[home(w).kontorId]!;
    for (let i = 0; i < 4; i++) expect(placeRoad(w, k.x + 2 + i, k.y).ok).toBe(true);
    const lj = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
    expect(lj.ok).toBe(true);
    forceGrass(w, k.x, k.y - 1);
    const placed = placeBuilding(w, 'house', k.x, k.y - 1);
    expect(placed.ok).toBe(true);
    const house = w.buildings[placed.id!]!;
    house.house!.inhabitants = 4;

    const wood = home(w).stock.wood;
    const food = home(w).stock.food;
    const m0 = w.money;
    for (let i = 0; i < 100; i++) step(w);

    expect(w.tick).toBe(100);
    expect(home(w).stock.wood).toBeGreaterThan(wood);
    expect(home(w).stock.food).toBeLessThan(food);
    expect(w.stats.taxes).toBeGreaterThan(0);
    expect(w.stats.upkeep).toBeGreaterThan(0);
    expect(w.money).toBe(m0 + w.stats.taxes - w.stats.upkeep);
  });
});

describe('step order: Markt und Aufträge', () => {
  it('AK-S2-13 Aufstieg im selben Tick wie das Angebot öffnet den Stufe-2-Pool (M11 S10)', () => {
    let seed = -1;
    for (let s = 1; s < 500 && seed < 0; s++) {
      const a = orderForPeriod(s, 0, 2);
      const b = orderForPeriod(s, 0, 1);
      if (a.good !== b.good || a.amount !== b.amount) seed = s;
    }
    expect(seed).toBeGreaterThan(0);
    w.seed = seed;
    const house = houseNearKontor(w);
    placeService(w, 'chapel', house.x + 9, house.y);
    w.tick = 599;
    house.house!.inhabitants = TIERS[1].maxInhabitants;
    house.house!.satisfiedSince = w.tick - UPGRADE_WAIT * UPGRADE_DEFICIT_WAIT_FACTOR; // Defizitwelt
    home(w).stock.cloth = 1;
    expect(w.order).toBeNull();
    step(w);
    expect(w.tick).toBe(600);
    expect(house.house!.tier).toBe(2);
    expect(w.order).toMatchObject({ period: 0, ...orderForPeriod(seed, 0, 2) });
  });

  it('AK-S2-03 tickMarket läuft im Schritt: Erholung nach 10 Ticks', () => {
    w.sellPct.wood = 50;
    for (let i = 0; i < 10; i++) step(w);
    expect(w.sellPct.wood).toBe(51);
  });
});

describe('M6 step: Krisen', () => {
  it('AK-S1-13 Krisen laufen nach dem Sieg weiter, won bleibt true', () => {
    const world = createWorld(3, { crisisLevel: 'normal', unlockAll: true });
    world.won = true;
    const at = new Map<number, unknown>();
    while (world.tick < 3600) {
      step(world);
      if ([2400, 3000, 3600].includes(world.tick)) at.set(world.tick, { ...world.crisis });
    }
    expect(at.get(2400)).toMatchObject({ kind: 'storm', period: 0 });
    expect(at.get(3000)).toMatchObject({ kind: 'fire', period: 1, outcome: 'miss' });
    expect(at.get(3600)).toMatchObject({ kind: 'storm', period: 2 });
    expect(world.won).toBe(true);
  });
});
