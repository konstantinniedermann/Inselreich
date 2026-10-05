import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, idx, home } from '../../src/sim/world';
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
  it('lumberjack produces 1 wood per 30 ticks when connected (M11 S3)', () => {
    const lj = connectedBuilding(w, 'lumberjack');
    home(w).tiles[idx(home(w), 1, 0)]!.terrain = 'forest'; // M11 S3: Holzfäller braucht freien Wald
    const before = home(w).stock.wood;
    ticks(w, 29);
    expect(home(w).stock.wood).toBe(before);
    ticks(w, 1);
    expect(home(w).stock.wood).toBe(before + 1);
    expect(lj.progress).toBe(0);
    expect(lj.state).toBe('ok');
  });

  it('does nothing when not connected and keeps progress (M11 S3)', () => {
    const lj = connectedBuilding(w, 'lumberjack');
    home(w).tiles[idx(home(w), 1, 0)]!.terrain = 'forest'; // M11 S3: Holzfäller braucht freien Wald
    const before = home(w).stock.wood;
    ticks(w, 10);
    expect(lj.progress).toBe(10);
    lj.connected = false;
    ticks(w, 50);
    expect(lj.progress).toBe(10);
    expect(lj.state).toBe('notConnected');
    expect(home(w).stock.wood).toBe(before);
  });

  it('weaver waits for wool, takes 1 wool at cycle start, outputs cloth at cycle end', () => {
    const wv = connectedBuilding(w, 'weaver');
    const cycle = BUILDING_DEFS.weaver.cycle!;
    home(w).stock.wool = 0;
    home(w).stock.cloth = 0;
    ticks(w, 10);
    expect(wv.progress).toBe(0);
    expect(wv.state).toBe('waitingInput');
    expect(home(w).stock.cloth).toBe(0);

    home(w).stock.wool = 1;
    ticks(w, 1);
    expect(home(w).stock.wool).toBe(0);
    expect(wv.progress).toBe(1);
    expect(wv.state).toBe('ok');

    ticks(w, cycle - 1);
    expect(home(w).stock.cloth).toBe(1);
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

  it('drops output when storage is full and marks storageFull (M11 S3)', () => {
    const lj = connectedBuilding(w, 'lumberjack');
    home(w).tiles[idx(home(w), 1, 0)]!.terrain = 'forest'; // M11 S3: Holzfäller braucht freien Wald
    home(w).stock.wood = 100;
    ticks(w, 30);
    expect(home(w).stock.wood).toBe(100);
    expect(lj.state).toBe('storageFull');
    expect(lj.progress).toBe(0);
    ticks(w, 5);
    expect(lj.state).toBe('storageFull');
    home(w).stock.wood = 50;
    ticks(w, BUILDING_DEFS.lumberjack.cycle!);
    expect(home(w).stock.wood).toBe(51);
    expect(lj.state).toBe('ok');
  });
});

describe('step', () => {
  it('runs production then economy and increments tick', () => {
    prepareEast(w, w.buildings[home(w).kontorId]!);
    const k = w.buildings[home(w).kontorId]!;
    for (let i = 0; i < 4; i++) expect(placeRoad(w, k.x + 2 + i, k.y).ok).toBe(true);
    const res = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
    expect(res.ok).toBe(true);
    expect(w.buildings[res.id!]!.connected).toBe(true);

    const wood = home(w).stock.wood;
    const money = w.money;
    const upkeep = totalUpkeep(w);
    for (let i = 0; i < 300; i++) step(w);

    expect(w.tick).toBe(300);
    expect(home(w).stock.wood).toBe(wood + 10);
    expect(w.money).toBe(money - 3 * upkeep);
  });
});

describe('M8 Ein-Input-Betriebe bitgleich (Spec 5.3)', () => {
  it('AK-S2-05 Weberei, Brennerei, Werkzeugmacher mit Input-Liste: Ausstoss und Entnahme wie vor M8', () => {
    const weaver = connectedBuilding(w, 'weaver');
    const distillery = connectedBuilding(w, 'distillery');
    const toolmaker = connectedBuilding(w, 'toolmaker');
    connectedBuilding(w, 'school'); // M10: der Werkzeugmacher arbeitet nur mit Schule in Reichweite (Spec 5.5)
    home(w).stock = { ...home(w).stock, wool: 3, cane: 2, wood: 1, cloth: 0, rum: 0, tools: 0 };
    ticks(w, 200);
    expect([home(w).stock.cloth, home(w).stock.wool, weaver.state]).toEqual([3, 0, 'waitingInput']);
    expect([home(w).stock.rum, home(w).stock.cane, distillery.state]).toEqual([
      2,
      0,
      'waitingInput',
    ]);
    expect([home(w).stock.tools, home(w).stock.wood, toolmaker.state]).toEqual([
      1,
      0,
      'waitingInput',
    ]);
  });
});
