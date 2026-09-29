import { describe, expect, it, beforeEach } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { placeBuilding } from '../../src/sim/build';
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
import type { World } from '../../src/sim/types';

let w: World;
beforeEach(() => {
  w = createWorld(3);
});

describe('stock', () => {
  it('caps at 100 and reports accepted amount', () => {
    w.stock.wood = 95;
    expect(addStock(w, 'wood', 10)).toBe(5);
    expect(w.stock.wood).toBe(100);
    expect(addStock(w, 'wood', 1)).toBe(0);
  });
  it('takes only if enough', () => {
    w.stock.food = 3;
    expect(takeStock(w, 'food', 4)).toBe(false);
    expect(w.stock.food).toBe(3);
    expect(takeStock(w, 'food', 3)).toBe(true);
    expect(w.stock.food).toBe(0);
  });
});

describe('afford/pay/refund', () => {
  const cost = { money: 100, wood: 5, tools: 2, stone: 1 };
  it('checks in order money, wood, tools, stone', () => {
    expect(checkAfford(w, cost)).toEqual({ ok: true });
    w.money = 50;
    expect(checkAfford(w, cost)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    w.money = 5000;
    w.stock.wood = 0;
    expect(checkAfford(w, cost)).toEqual({ ok: false, reason: 'Zu wenig Holz' });
    w.stock.wood = 5;
    w.stock.tools = 1;
    expect(checkAfford(w, cost)).toEqual({ ok: false, reason: 'Zu wenig Werkzeug' });
    w.stock.tools = 2;
    w.stock.stone = 0;
    expect(checkAfford(w, cost)).toEqual({ ok: false, reason: 'Zu wenig Stein' });
  });
  it('blocks everything when money is negative', () => {
    w.money = -1;
    expect(checkAfford(w, { money: 0, wood: 0, tools: 0, stone: 0 })).toEqual({
      ok: false,
      reason: 'Kein Geld',
    });
  });
  it('pays and refunds half rounded down, capped by storage', () => {
    pay(w, cost);
    expect(w.money).toBe(4900);
    expect(w.stock).toMatchObject({ wood: 35, tools: 18, stone: 9 });
    expect(refundCost({ money: 101, wood: 5, tools: 1, stone: 0 })).toEqual({
      money: 50,
      wood: 2,
      tools: 0,
      stone: 0,
    });
    w.stock.wood = 99;
    grantRefund(w, { money: 10, wood: 5, tools: 0, stone: 0 });
    expect(w.money).toBe(4910);
    expect(w.stock.wood).toBe(100);
  });
});

describe('upkeep', () => {
  it('sums building upkeep and books it every 100 ticks', () => {
    const k = w.buildings[w.kontorId]!;
    // Kapelle irgendwo auf Gras platzieren (Kosten in Task 2 — hier noch ohne)
    const spot = findGrass(w);
    expect(placeBuilding(w, 'chapel', spot.x, spot.y).ok).toBe(true);
    expect(totalUpkeep(w)).toBe(15);
    const m0 = w.money;
    w.tick = 1;
    tickEconomy(w);
    expect(w.money).toBe(m0);
    expect(w.stats.upkeep).toBe(15);
    w.tick = UPKEEP_INTERVAL;
    tickEconomy(w);
    expect(w.money).toBe(m0 - 15);
    w.tick = 0;
    tickEconomy(w);
    expect(w.money).toBe(m0 - 15); // Tick 0 bucht nicht
    void k;
  });
});

function findGrass(w: World): { x: number; y: number } {
  for (let y = 1; y < w.height - 2; y++)
    for (let x = 1; x < w.width - 2; x++) {
      let ok = true;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const t = w.tiles[(y + dy) * w.width + x + dx]!;
          if (t.terrain !== 'grass' || t.buildingId !== null || t.road) ok = false;
        }
      if (ok) return { x, y };
    }
  throw new Error('no grass');
}
