import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { checkWin, step } from '../../src/sim/tick';
import { WIN_CITIZENS } from '../../src/sim/defs/tiers';
import type { Building, World } from '../../src/sim/types';
import { forceGrass, prepareEast } from './helpers';

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
  w = createWorld(3);
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
    prepareEast(w, w.buildings[w.kontorId]!);
    const k = w.buildings[w.kontorId]!;
    for (let i = 0; i < 4; i++) expect(placeRoad(w, k.x + 2 + i, k.y).ok).toBe(true);
    const lj = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
    expect(lj.ok).toBe(true);
    forceGrass(w, k.x, k.y - 1);
    const placed = placeBuilding(w, 'house', k.x, k.y - 1);
    expect(placed.ok).toBe(true);
    const house = w.buildings[placed.id!]!;
    house.house!.inhabitants = 4;

    const wood = w.stock.wood;
    const food = w.stock.food;
    const m0 = w.money;
    for (let i = 0; i < 100; i++) step(w);

    expect(w.tick).toBe(100);
    expect(w.stock.wood).toBeGreaterThan(wood);
    expect(w.stock.food).toBeLessThan(food);
    expect(w.stats.taxes).toBeGreaterThan(0);
    expect(w.stats.upkeep).toBeGreaterThan(0);
    expect(w.money).toBe(m0 + w.stats.taxes - w.stats.upkeep);
  });
});
