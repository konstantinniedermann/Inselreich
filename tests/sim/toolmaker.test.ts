import { beforeEach, describe, expect, it } from 'vitest';
import { demolish, placeBuilding, placeRoad } from '../../src/sim/build';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { totalUpkeep } from '../../src/sim/economy';
import { effectiveRefund } from '../../src/sim/queries';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import { sell } from '../../src/sim/trade';
import type { Building, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { forceRect, prepareEast } from './helpers';

let w: World;
let k: Building;

/** Legt einen angebundenen Werkzeugmacher östlich des Kontors an (Weg + 2×2 Gras). */
function placeToolmaker(): Building {
  prepareEast(w, k);
  expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
  forceRect(w, k.x + 3, k.y, 2, 2, 'grass');
  const r = placeBuilding(w, 'toolmaker', k.x + 3, k.y);
  expect(r.ok).toBe(true);
  const b = w.buildings[r.id!]!;
  expect(b.connected).toBe(true);
  return b;
}

beforeEach(() => {
  w = createWorld(3);
  k = w.buildings[w.kontorId]!;
});

describe('Werkzeugmacher (S4)', () => {
  it('AK-S4-01 800 Ticks: Werkzeug 10, Holz 90, Unterhalt 200; Verkauf 10 Werkzeug bringt +143', () => {
    placeToolmaker();
    w.stock.wood = 100;
    w.stock.tools = 0;
    const money = w.money;
    for (let i = 0; i < 800; i++) step(w);
    expect(w.stock.tools).toBe(10);
    expect(w.stock.wood).toBe(90);
    expect(money - w.money).toBe(200);
    const before = w.money;
    expect(sell(w, 'tools', 10).ok).toBe(true);
    expect(w.money - before).toBe(143);
  });

  it('AK-S4-02 ohne Holz: waitingInput, Unterhalt läuft weiter', () => {
    const tm = placeToolmaker();
    w.stock.wood = 0;
    w.stock.tools = 0;
    const money = w.money;
    for (let i = 0; i < 100; i++) step(w);
    expect(tm.state).toBe('waitingInput');
    expect(w.stock.tools).toBe(0);
    expect(money - w.money).toBe(BUILDING_DEFS.toolmaker.upkeep);
  });

  it('AK-S4-03 Abriss während Produktion: Holz verloren, kein Werkzeug, 50 % zurück, kein Unterhalt', () => {
    const tm = placeToolmaker();
    w.stock.wood = 10;
    w.stock.tools = 0;
    for (let i = 0; i < 20; i++) step(w);
    expect(w.stock.wood).toBe(9);
    expect(tm.progress).toBe(20);

    const expected = effectiveRefund(w, BUILDING_DEFS.toolmaker.cost);
    expect(expected).toEqual({ money: 100, wood: 7, tools: 1, stone: 0 });
    const before = { money: w.money, wood: w.stock.wood, tools: w.stock.tools };
    const upkeepBefore = totalUpkeep(w);
    expect(demolish(w, tm.id).ok).toBe(true);
    expect(w.money - before.money).toBe(expected.money);
    expect(w.stock.wood - before.wood).toBe(expected.wood);
    expect(w.stock.tools - before.tools).toBe(expected.tools);
    expect(w.stock.wood).toBe(9 + 7);
    expect(totalUpkeep(w)).toBe(upkeepBefore - BUILDING_DEFS.toolmaker.upkeep);
    for (let i = 0; i < 100; i++) step(w);
    expect(w.stock.tools).toBe(before.tools + expected.tools);
  });

  it('Spielstand mit Werkzeugmacher besteht deserialize (SAVE_VERSION unverändert)', () => {
    placeToolmaker();
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.world).toEqual(w);
  });
});
