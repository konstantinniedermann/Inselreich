import { describe, expect, it, beforeEach } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import { demolish, placeBuilding } from '../../src/sim/build';
import { step } from '../../src/sim/tick';
import { tickTaxes } from '../../src/sim/population';
import { forceGrass } from './helpers';
import {
  addStock,
  takeStock,
  checkAfford,
  pay,
  refundCost,
  grantRefund,
  totalUpkeep,
  tickEconomy,
  UPKEEP_INTERVAL,
} from '../../src/sim/economy';
import type { Building, BuildingDefId, World } from '../../src/sim/types';

let w: World;
beforeEach(() => {
  w = createWorld(3, { unlockAll: true });
});

describe('stock', () => {
  it('caps at 100 and reports accepted amount', () => {
    home(w).stock.wood = 95;
    expect(addStock(home(w), 'wood', 10)).toBe(5);
    expect(home(w).stock.wood).toBe(100);
    expect(addStock(home(w), 'wood', 1)).toBe(0);
  });
  it('adds zero and fills exactly to the cap', () => {
    expect(addStock(home(w), 'wood', 0)).toBe(0);
    home(w).stock.wood = 90;
    expect(addStock(home(w), 'wood', 10)).toBe(10);
    expect(home(w).stock.wood).toBe(100);
  });
  it('refuses negative takes', () => {
    home(w).stock.food = 3;
    expect(takeStock(home(w), 'food', -1)).toBe(false);
    expect(home(w).stock.food).toBe(3);
  });
  it('takes only if enough', () => {
    home(w).stock.food = 3;
    expect(takeStock(home(w), 'food', 4)).toBe(false);
    expect(home(w).stock.food).toBe(3);
    expect(takeStock(home(w), 'food', 3)).toBe(true);
    expect(home(w).stock.food).toBe(0);
  });
});

describe('afford/pay/refund', () => {
  const cost = { money: 100, wood: 5, tools: 2, stone: 1 };
  it('checks in order money, wood, tools, stone', () => {
    expect(checkAfford(w, home(w), cost)).toEqual({ ok: true });
    w.money = 50;
    expect(checkAfford(w, home(w), cost)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    w.money = 5000;
    home(w).stock.wood = 0;
    expect(checkAfford(w, home(w), cost)).toEqual({ ok: false, reason: 'Zu wenig Holz' });
    home(w).stock.wood = 5;
    home(w).stock.tools = 1;
    expect(checkAfford(w, home(w), cost)).toEqual({ ok: false, reason: 'Zu wenig Werkzeug' });
    home(w).stock.tools = 2;
    home(w).stock.stone = 0;
    expect(checkAfford(w, home(w), cost)).toEqual({ ok: false, reason: 'Zu wenig Stein' });
  });
  it('blocks everything when money is negative', () => {
    w.money = -1;
    expect(checkAfford(w, home(w), { money: 0, wood: 0, tools: 0, stone: 0 })).toEqual({
      ok: false,
      reason: 'Kein Geld',
    });
  });
  it('reports Kein Geld before cost checks when money is negative', () => {
    w.money = -5;
    expect(checkAfford(w, home(w), cost)).toEqual({ ok: false, reason: 'Kein Geld' });
  });
  it('pays and refunds half rounded down, capped by storage', () => {
    pay(w, home(w), cost);
    expect(w.money).toBe(4900);
    expect(home(w).stock).toMatchObject({ wood: 35, tools: 18, stone: 9 });
    expect(refundCost({ money: 101, wood: 5, tools: 1, stone: 0 })).toEqual({
      money: 50,
      wood: 2,
      tools: 0,
      stone: 0,
    });
    home(w).stock.wood = 99;
    grantRefund(w, home(w), { money: 10, wood: 5, tools: 0, stone: 0 });
    expect(w.money).toBe(4910);
    expect(home(w).stock.wood).toBe(100);
  });
});

describe('upkeep', () => {
  it('sums building upkeep and books it per step with carry (M11 S10)', () => {
    // Kapelle irgendwo auf Gras platzieren
    const spot = findGrass(w);
    expect(placeBuilding(w, 'chapel', spot.x, spot.y).ok).toBe(true);
    expect(totalUpkeep(w)).toBe(15);
    const m0 = w.money;
    // Anhang 02 D: money = m0 - floor((n * upkeep + u0) / 100), unabhängig von w.tick
    w.tick = 1;
    tickEconomy(w);
    expect(w.money).toBe(m0);
    expect(w.stats.upkeep).toBe(15);
    for (let i = 1; i < UPKEEP_INTERVAL; i++) tickEconomy(w);
    expect(w.money).toBe(m0 - 15);
    expect(w.upkeepCarry).toBe(0);
    w.tick = 0;
    tickEconomy(w);
    expect(w.money).toBe(m0 - 15); // 101 Schritte: floor(1515 / 100) = 15
    expect(w.upkeepCarry).toBe(15);
  });
});

function findGrass(w: World): { x: number; y: number } {
  for (let y = 1; y < w.height - 2; y++)
    for (let x = 1; x < w.width - 2; x++) {
      let ok = true;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const t = home(w).tiles[(y + dy) * w.width + x + dx]!;
          if (t.terrain !== 'grass' || t.buildingId !== null || t.road) ok = false;
        }
      if (ok) return { x, y };
    }
  throw new Error('no grass');
}

/** Betrieb ohne Kacheln (Muster addHouse in taxes.test.ts); zählt für Unterhalt und Bilanz. */
function addRaw(world: World, defId: BuildingDefId): Building {
  const id = world.nextBuildingId++;
  const b: Building = { id, defId, x: 0, y: 0, connected: true, progress: 0, state: 'ok' };
  world.buildings[id] = b;
  return b;
}
const SET_115 = [
  'fisher',
  'weaver',
  'distillery',
  'toolmaker',
  'school',
  'chapel',
  'market',
] as const; // 5+15+20+25+25+15+10

describe('M11 Unterhalt je Tick (Spec 3.1)', () => {
  it('AK-P1-04 Unterhalt Σ 115 ohne Häuser: je Schritt −1 oder −2, nach 100 genau −115; upkeepCarry 0 … 99', () => {
    for (const id of SET_115) addRaw(w, id);
    expect(totalUpkeep(w)).toBe(115);
    const d: number[] = [];
    for (let i = 0; i < 100; i++) {
      const m = w.money;
      tickEconomy(w);
      d.push(m - w.money);
      expect(Number.isInteger(w.upkeepCarry) && w.upkeepCarry >= 0 && w.upkeepCarry < 100).toBe(
        true,
      );
    }
    expect(new Set(d)).toEqual(new Set([1, 2]));
    expect(d.reduce((a, b) => a + b, 0)).toBe(115);
  });
  it('AK-P1-06 Abriss eines Fischers bei upkeepCarry 50: Übertrag bleibt, nächster Schritt ohne die 5', () => {
    for (const id of SET_115) addRaw(w, id);
    const fisher = Object.values(w.buildings).find((b) => b.defId === 'fisher')!;
    w.upkeepCarry = 50;
    expect(demolish(w, fisher.id).ok).toBe(true);
    expect(w.upkeepCarry).toBe(50);
    const m = w.money;
    tickEconomy(w);
    expect(w.stats.upkeep).toBe(110);
    expect([m - w.money, w.upkeepCarry]).toEqual([1, 60]); // floor(160 / 100), Rest 60
  });
  it('AK-P1-07 Geld 10, Unterhalt 115, ohne Häuser: nach 20 Schritten < 0, „Kein Geld"; Steuer bucht weiter', () => {
    const k = w.buildings[home(w).kontorId]!;
    forceGrass(w, k.x + 2, k.y);
    for (const id of SET_115) addRaw(w, id);
    w.money = 10;
    for (let i = 0; i < 20; i++) step(w);
    expect(w.money).toBe(-13); // 10 − floor(20 × 115 / 100)
    expect(placeBuilding(w, 'house', k.x + 2, k.y)).toEqual({ ok: false, reason: 'Kein Geld' });
    const id = w.nextBuildingId++;
    w.buildings[id] = {
      ...{ id, defId: 'house', x: k.x + 2, y: k.y, connected: true, progress: 0, state: 'ok' },
      house: {
        tier: 1,
        inhabitants: 4,
        demand: {},
        satisfied: { food: true },
        services: {},
        satisfiedSince: 0,
        supplied: true,
      },
    };
    const m = w.money;
    for (let i = 0; i < 100; i++) tickTaxes(w);
    expect(w.money - m).toBe(8); // 4 EW × 2 × TAX_UNIT 2 × pct 100 × 100 / 20 000
  });
});
