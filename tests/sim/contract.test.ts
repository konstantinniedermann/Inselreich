import { describe, expect, it } from 'vitest';
import {
  CONTRACT_MIN_TIER,
  CONTRACT_PENALTY_PCT,
  CONTRACT_PREMIUM,
  GOODS,
  GOOD_IDS,
  STORAGE_CAP,
} from '../../src/sim/defs/goods';
import { TIER_IDS } from '../../src/sim/defs/tiers';
import { contractPenalty, contractUnitPrice, orderUnitReward } from '../../src/sim/orders';
import { buy } from '../../src/sim/trade';
import { HOME, createWorld, home } from '../../src/sim/world';
import { placeTownhall } from './helpers';
import type { GoodId } from '../../src/sim/types';

const ORDER_GOODS = GOOD_IDS.filter((g) => GOODS[g].order !== undefined);

describe('AK-SK-26 Werte und Invarianten', () => {
  it('Konstanten', () => {
    expect(CONTRACT_PREMIUM).toBe(0.68);
    expect(CONTRACT_PENALTY_PCT).toBe(100);
    expect(CONTRACT_PENALTY_PCT).toBeGreaterThanOrEqual(1);
    expect(CONTRACT_MIN_TIER).toBe(3);
    expect(TIER_IDS).toContain(CONTRACT_MIN_TIER);
  });

  for (const g of ORDER_GOODS) {
    it(`${g}: Preis, Menge, Wert, Strafe`, () => {
      const p = contractUnitPrice(g);
      expect(p).toBe(Math.floor(GOODS[g].buy * CONTRACT_PREMIUM));
      expect(p).toBeLessThan(orderUnitReward(g));
      expect(p).toBeLessThan(0.8 * GOODS[g].buy);
      const m = GOODS[g].order!.contract;
      expect(Number.isInteger(m)).toBe(true);
      expect(m).toBeGreaterThanOrEqual(1);
      expect(m).toBeLessThanOrEqual(STORAGE_CAP);
      expect(m * p).toBeGreaterThanOrEqual(135);
      expect(m * p).toBeLessThanOrEqual(140);
      expect(contractPenalty({ good: g, amount: m, price: p, island: HOME })).toBe(
        Math.ceil((m * p * CONTRACT_PENALTY_PCT) / 100),
      );
    });
  }

  it('Mengen-Pin', () => {
    const pin: Partial<Record<GoodId, number>> = {};
    for (const g of ORDER_GOODS) pin[g] = GOODS[g].order!.contract;
    expect(pin).toEqual({
      wood: 23,
      food: 28,
      stone: 14,
      wool: 17,
      cloth: 7,
      cane: 17,
      rum: 5,
      glass: 4,
    });
  });

  it('Rum-Beispiel', () => {
    const p = contractUnitPrice('rum');
    expect(p).toBe(27);
    expect(5 * p).toBe(135);
    expect(contractPenalty({ good: 'rum', amount: 5, price: p, island: HOME })).toBe(135);
  });

  it('Werkzeug und Gewürz sind keine Vertragsgüter', () => {
    expect(GOODS.tools.order).toBeUndefined();
    expect(GOODS.spice.order).toBeUndefined();
  });
});

describe('AK-SK-27 Kaufen und Liefern nie Gewinn', () => {
  for (const g of ORDER_GOODS) {
    it(`${g}: Verlust zwischen 24 und 46`, () => {
      const w = createWorld(3, { unlockAll: true });
      placeTownhall(w);
      w.edict = 'trade';
      w.money = 10_000;
      home(w).stock[g] = 0;
      const m = GOODS[g].order!.contract;
      const before = w.money;
      expect(buy(w, g, m).ok).toBe(true);
      w.money += m * contractUnitPrice(g);
      expect(w.money).toBeLessThan(before);
      expect(before - w.money).toBeGreaterThanOrEqual(24);
      expect(before - w.money).toBeLessThanOrEqual(46);
    });
  }
});
