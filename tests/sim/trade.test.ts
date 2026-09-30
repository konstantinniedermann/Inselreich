import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { buy, buyPrice, sell, sellPrice } from '../../src/sim/trade';
import type { World } from '../../src/sim/types';

let w: World;

beforeEach(() => {
  w = createWorld(3);
});

describe('buy', () => {
  it('buys 10 tools: money -400, tools +10', () => {
    expect(buy(w, 'tools', 10)).toEqual({ ok: true });
    expect(w.money).toBe(4600);
    expect(w.stock.tools).toBe(30);
  });

  it('fails with Lager voll and changes nothing', () => {
    w.stock.tools = 95;
    expect(buy(w, 'tools', 10)).toEqual({ ok: false, reason: 'Lager voll' });
    expect(w.stock.tools).toBe(95);
    expect(w.money).toBe(5000);
  });

  it('fails with Zu wenig Geld', () => {
    w.money = 30;
    expect(buy(w, 'tools', 1)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    expect(w.money).toBe(30);
    expect(w.stock.tools).toBe(20);
  });

  it('fails with Kein Geld when money is negative', () => {
    w.money = -5;
    expect(buy(w, 'tools', 1)).toEqual({ ok: false, reason: 'Kein Geld' });
    expect(w.money).toBe(-5);
  });

  it('Lager voll takes precedence over Zu wenig Geld', () => {
    w.money = 30;
    w.stock.tools = 95;
    expect(buy(w, 'tools', 10)).toEqual({ ok: false, reason: 'Lager voll' });
  });

  it('rejects non-positive or non-integer amounts', () => {
    expect(buy(w, 'tools', 0)).toEqual({ ok: false, reason: 'Ungültige Menge' });
    expect(buy(w, 'tools', -2)).toEqual({ ok: false, reason: 'Ungültige Menge' });
    expect(buy(w, 'tools', 1.5)).toEqual({ ok: false, reason: 'Ungültige Menge' });
    expect(w.money).toBe(5000);
  });
});

describe('sell', () => {
  it('fails with Nicht genug Ware and changes nothing', () => {
    expect(sell(w, 'food', 25)).toEqual({ ok: false, reason: 'Nicht genug Ware' });
    expect(w.stock.food).toBe(20);
    expect(w.money).toBe(5000);
  });

  it('sells 10 food: money +30, food 10', () => {
    expect(sell(w, 'food', 10)).toEqual({ ok: true });
    expect(w.money).toBe(5030);
    expect(w.stock.food).toBe(10);
  });

  it('is allowed with negative money', () => {
    w.money = -100;
    expect(sell(w, 'food', 10)).toEqual({ ok: true });
    expect(w.money).toBe(-70);
  });

  it('rejects non-integer amounts', () => {
    expect(sell(w, 'food', 1.5)).toEqual({ ok: false, reason: 'Ungültige Menge' });
    expect(sell(w, 'food', 0)).toEqual({ ok: false, reason: 'Ungültige Menge' });
    expect(w.stock.food).toBe(20);
  });
});

describe('prices', () => {
  it('computes totals from the goods table', () => {
    expect(buyPrice('tools', 10)).toBe(400);
    expect(sellPrice('rum', 3)).toBe(54);
  });
});
