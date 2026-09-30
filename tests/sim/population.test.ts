import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import {
  allNeedsMet,
  GROWTH_INTERVAL,
  isSupplied,
  serviceAvailable,
  tickPopulation,
  tryUpgrade,
  UPGRADE_WAIT,
  upgradeStatus,
} from '../../src/sim/population';
import { buy } from '../../src/sim/trade';
import { step } from '../../src/sim/tick';
import { TIERS } from '../../src/sim/defs/tiers';
import type { Building, World } from '../../src/sim/types';
import { forceGrass, forceRect, houseFar, houseNearKontor, placeService } from './helpers';

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
    forceRect(w, far.x + 1, far.y, 2, 2, 'grass');
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

describe('serviceAvailable', () => {
  it('faith needs a connected chapel within radius 10', () => {
    const h = houseNearKontor(w);
    // Hausmitte x+0.5; Kapellenmitte x+1: Abstand ~9.51 bei +9, ~10.51 bei +10
    const chapel = placeService(w, 'chapel', h.x + 9, h.y);
    expect(serviceAvailable(w, h, 'faith')).toBe(true);
    expect(serviceAvailable(w, h, 'school')).toBe(false);
    chapel.connected = false;
    expect(serviceAvailable(w, h, 'faith')).toBe(false);
  });

  it('is false for a chapel just beyond radius 10', () => {
    const h = houseNearKontor(w);
    placeService(w, 'chapel', h.x + 10, h.y);
    expect(serviceAvailable(w, h, 'faith')).toBe(false);
  });
});

/** Haus bereit für den Aufstieg von Stufe 1: max. Einwohner, 300 Ticks erfüllt, Kapelle, 1 Stoff. */
function readyPioneer(): { house: Building; chapel: Building } {
  const house = houseNearKontor(w);
  const chapel = placeService(w, 'chapel', house.x + 9, house.y);
  w.tick = 400;
  house.house!.inhabitants = TIERS[1].maxInhabitants;
  run(w, 1);
  w.stock.cloth = 1;
  house.house!.satisfiedSince = w.tick - UPGRADE_WAIT;
  return { house, chapel };
}

describe('tryUpgrade', () => {
  it('upgrades pioneer house to settler when all conditions hold', () => {
    const { house } = readyPioneer();
    expect(house.house!.satisfied.food).toBe(true);
    const { money, stock } = { money: w.money, stock: { ...w.stock } };
    expect(upgradeStatus(w, house)).toEqual({ ok: true, reasons: [] });
    expect(tryUpgrade(w, house)).toBe(true);
    expect(house.house!.tier).toBe(2);
    expect(w.money).toBe(money - 100);
    expect(w.stock.wood).toBe(stock.wood - 5);
    expect(w.stock.tools).toBe(stock.tools - 2);
    expect(w.stock.stone).toBe(stock.stone);
    expect(house.house!.demand.cloth).toBe(1);
    expect(house.house!.satisfiedSince).toBe(w.tick);
  });

  function expectBlocked(house: Building, reason: string): void {
    const money = w.money;
    expect(upgradeStatus(w, house).ok).toBe(false);
    expect(upgradeStatus(w, house).reasons).toContain(reason);
    expect(tryUpgrade(w, house)).toBe(false);
    expect(house.house!.tier).toBe(1);
    expect(w.money).toBe(money);
  }

  it('does not upgrade without cloth in stock', () => {
    const { house } = readyPioneer();
    w.stock.cloth = 0;
    expectBlocked(house, 'Kein Stoff im Lager');
  });

  it('does not upgrade without a chapel in reach', () => {
    const { house, chapel } = readyPioneer();
    chapel.connected = false;
    expectBlocked(house, 'Kapelle fehlt in Reichweite');
  });

  it('does not upgrade before 300 ticks of satisfaction', () => {
    const { house } = readyPioneer();
    house.house!.satisfiedSince = w.tick - (UPGRADE_WAIT - 1);
    expectBlocked(house, `Bedürfnisse noch nicht ${UPGRADE_WAIT} Ticks erfüllt`);
  });

  it('does not upgrade below max inhabitants', () => {
    const { house } = readyPioneer();
    house.house!.inhabitants = 3;
    expectBlocked(house, 'Haus nicht voll belegt');
  });

  it('does not upgrade when unaffordable', () => {
    const { house } = readyPioneer();
    w.money = 50;
    expectBlocked(house, 'Zu wenig Geld');
  });

  it('lists all unmet reasons, not just the first', () => {
    const { house, chapel } = readyPioneer();
    w.stock.cloth = 0;
    chapel.connected = false;
    house.house!.inhabitants = 3;
    expect(upgradeStatus(w, house).reasons).toEqual([
      'Haus nicht voll belegt',
      'Kapelle fehlt in Reichweite',
      'Kein Stoff im Lager',
    ]);
  });

  it('settler to citizen needs faith, school and rum', () => {
    const { house, chapel } = readyPioneer();
    const hs = house.house!;
    hs.tier = 2;
    hs.inhabitants = TIERS[2].maxInhabitants;
    w.stock.rum = 1;
    expectSettlerBlocked(house);
    const school = placeService(w, 'school', house.x + 9, house.y + 2);
    chapel.connected = true; // Platzieren berechnet die Anbindung neu und setzt sie zurück
    const money = w.money;
    const stone = w.stock.stone;
    expect(school.connected).toBe(true);
    expect(upgradeStatus(w, house)).toEqual({ ok: true, reasons: [] });
    expect(tryUpgrade(w, house)).toBe(true);
    expect(hs.tier).toBe(3);
    expect(w.money).toBe(money - 300);
    expect(w.stock.stone).toBe(stone - 5);
    expect(hs.demand.rum).toBe(1);
    expect(hs.satisfiedSince).toBe(w.tick);
  });

  function expectSettlerBlocked(house: Building): void {
    const money = w.money;
    expect(upgradeStatus(w, house).reasons).toEqual(['Schule fehlt in Reichweite']);
    expect(tryUpgrade(w, house)).toBe(false);
    expect(house.house!.tier).toBe(2);
    expect(w.money).toBe(money);
  }

  it('citizen house has no further upgrade', () => {
    const { house } = readyPioneer();
    house.house!.tier = 3;
    house.house!.inhabitants = 15;
    expect(tryUpgrade(w, house)).toBe(false);
    expect(upgradeStatus(w, house)).toEqual({ ok: false, reasons: ['Höchste Stufe erreicht'] });
    expect(house.house!.tier).toBe(3);
  });

  it('is attempted in the growth tick only', () => {
    const { house } = readyPioneer();
    w.tick = 347;
    house.house!.satisfiedSince = 47;
    run(w, 2);
    expect(house.house!.tier).toBe(1);
    run(w, 1);
    expect(w.tick % GROWTH_INTERVAL).toBe(0);
    expect(house.house!.tier).toBe(2);
  });
});

describe('satisfiedSince at build time', () => {
  it('a house built late must wait the full UPGRADE_WAIT before upgrading', () => {
    const first = houseNearKontor(w);
    const chapel = placeService(w, 'chapel', first.x + 5, first.y);
    w.stock.cloth = 5;
    w.stock.food = 100;
    for (let i = 0; i < 400; i++) step(w);
    expect(w.tick).toBe(400);

    // Zweites Haus, gleiche Kontor-Nähe, andere Kachel; Ressourcen für den Aufstieg bereitstellen
    forceGrass(w, first.x, first.y + 1);
    w.money = 1_000_000;
    for (const good of Object.keys(w.stock) as (keyof typeof w.stock)[]) w.stock[good] = 100;
    const r = placeBuilding(w, 'house', first.x, first.y + 1);
    expect(r.ok).toBe(true);
    // Bauen berechnet die Anbindung neu; die Kapelle hat in diesem Test keinen Weg
    chapel.connected = true;
    const second = w.buildings[r.id!]!;
    expect(second.house!.satisfiedSince).toBe(400);

    for (let i = 0; i < 200; i++) step(w);
    expect(second.house!.tier).toBe(1);
    expect(second.house!.inhabitants).toBe(4);
    expect(upgradeStatus(w, second).reasons).toContain(
      `Bedürfnisse noch nicht ${UPGRADE_WAIT} Ticks erfüllt`,
    );

    for (let i = 0; i < 200; i++) step(w);
    expect(second.house!.tier).toBe(2);
  });
});

describe('smoke: scripted colony', () => {
  it('reaches settlers within 3000 steps', () => {
    const k = w.buildings[w.kontorId]!;
    const { x: kx, y: ky } = k;
    forceRect(w, kx + 2, ky - 3, 12, 8, 'grass');
    forceRect(w, kx + 3, ky - 4, 4, 1, 'water');
    expect(buy(w, 'wood', 40).ok).toBe(true);

    const roads: [number, number][] = [];
    for (let dx = 2; dx <= 9; dx++) roads.push([kx + dx, ky]);
    for (let dy = 1; dy <= 3; dy++) roads.push([kx + 4, ky - dy]);
    for (const [x, y] of roads) expect(placeRoad(w, x, y).ok).toBe(true);

    const plan = [
      ['fisher', kx + 3, ky - 3],
      ['fisher', kx + 5, ky - 3],
      ['sheepfarm', kx + 6, ky + 1],
      ['weaver', kx + 8, ky + 1],
      ['chapel', kx + 6, ky - 2],
      ['house', kx + 2, ky + 1],
      ['house', kx + 2, ky + 2],
    ] as const;
    for (const [defId, x, y] of plan) {
      const r = placeBuilding(w, defId, x, y);
      expect(r.ok, `${defId} at ${x},${y}`).toBe(true);
    }

    for (let i = 0; i < 3000; i++) step(w);

    const tiers = Object.values(w.buildings).flatMap((b) => (b.house ? [b.house.tier] : []));
    expect(Math.max(...tiers)).toBeGreaterThanOrEqual(2);
    expect(w.tick).toBe(3000);
    expect(w.money).toBeGreaterThan(-5000);
  });
});
