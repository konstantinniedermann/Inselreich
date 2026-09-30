import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { totalUpkeep } from '../../src/sim/economy';
import { tickProduction } from '../../src/sim/production';
import { step } from '../../src/sim/tick';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, BuildingDefId, World } from '../../src/sim/types';
import { prepareEast } from './helpers';

let w: World;
let nextTestId = 9000;

/** Legt ein Gebäude direkt an und setzt connected (Anbindung ist in roads.test.ts getestet); bewusst ohne Kacheln. */
function connectedBuilding(world: World, defId: BuildingDefId): Building {
  const b: Building = {
    id: nextTestId++,
    defId,
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
  };
  world.buildings[b.id] = b;
  return b;
}

function ticks(world: World, n: number): void {
  for (let i = 0; i < n; i++) tickProduction(world);
}

beforeEach(() => {
  w = createWorld(3);
});

describe('tickProduction', () => {
  it('lumberjack produces 1 wood per 30 ticks when connected', () => {
    const lj = connectedBuilding(w, 'lumberjack');
    const before = w.stock.wood;
    ticks(w, 29);
    expect(w.stock.wood).toBe(before);
    ticks(w, 1);
    expect(w.stock.wood).toBe(before + 1);
    expect(lj.progress).toBe(0);
    expect(lj.state).toBe('ok');
  });

  it('does nothing when not connected and keeps progress', () => {
    const lj = connectedBuilding(w, 'lumberjack');
    const before = w.stock.wood;
    ticks(w, 10);
    expect(lj.progress).toBe(10);
    lj.connected = false;
    ticks(w, 50);
    expect(lj.progress).toBe(10);
    expect(lj.state).toBe('notConnected');
    expect(w.stock.wood).toBe(before);
  });

  it('weaver waits for wool, takes 1 wool at cycle start, outputs cloth at cycle end', () => {
    const wv = connectedBuilding(w, 'weaver');
    const cycle = BUILDING_DEFS.weaver.cycle!;
    w.stock.wool = 0;
    w.stock.cloth = 0;
    ticks(w, 10);
    expect(wv.progress).toBe(0);
    expect(wv.state).toBe('waitingInput');
    expect(w.stock.cloth).toBe(0);

    w.stock.wool = 1;
    ticks(w, 1);
    expect(w.stock.wool).toBe(0);
    expect(wv.progress).toBe(1);
    expect(wv.state).toBe('ok');

    ticks(w, cycle - 1);
    expect(w.stock.cloth).toBe(1);
    expect(wv.progress).toBe(0);

    // Verbindung verlieren, dann wieder anbinden (Reconnect-Regel setzt 'ok'); Wolle fehlt weiter.
    wv.connected = false;
    ticks(w, 1);
    expect(wv.state).toBe('notConnected');
    wv.connected = true;
    wv.state = 'ok';
    ticks(w, 1);
    expect(wv.state).toBe('waitingInput');
  });

  it('drops output when storage is full and marks storageFull', () => {
    const lj = connectedBuilding(w, 'lumberjack');
    w.stock.wood = 100;
    ticks(w, 30);
    expect(w.stock.wood).toBe(100);
    expect(lj.state).toBe('storageFull');
    expect(lj.progress).toBe(0);
    ticks(w, 5);
    expect(lj.state).toBe('storageFull');
    w.stock.wood = 50;
    ticks(w, BUILDING_DEFS.lumberjack.cycle!);
    expect(w.stock.wood).toBe(51);
    expect(lj.state).toBe('ok');
  });
});

describe('step', () => {
  it('runs production then economy and increments tick', () => {
    prepareEast(w, w.buildings[w.kontorId]!);
    const k = w.buildings[w.kontorId]!;
    for (let i = 0; i < 4; i++) expect(placeRoad(w, k.x + 2 + i, k.y).ok).toBe(true);
    const res = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
    expect(res.ok).toBe(true);
    expect(w.buildings[res.id!]!.connected).toBe(true);

    const wood = w.stock.wood;
    const money = w.money;
    const upkeep = totalUpkeep(w);
    for (let i = 0; i < 300; i++) step(w);

    expect(w.tick).toBe(300);
    expect(w.stock.wood).toBe(wood + 10);
    expect(w.money).toBe(money - 3 * upkeep);
  });
});
