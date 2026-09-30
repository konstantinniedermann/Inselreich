import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import { buy, buyPrice, sell, sellPrice, tickMarket } from '../../src/sim/trade';
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

  it('sells 10 food: money +28, food 10', () => {
    expect(sell(w, 'food', 10)).toEqual({ ok: true });
    expect(w.money).toBe(5028); // Abschlag 1: 3 × (100 + … + 91) / 100
    expect(w.stock.food).toBe(10);
  });

  it('is allowed with negative money', () => {
    w.money = -100;
    expect(sell(w, 'food', 10)).toEqual({ ok: true });
    expect(w.money).toBe(-72);
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
    expect(sellPrice(w, 'rum', 3)).toBe(53);
  });
});

describe('Verkaufssättigung', () => {
  it('AK-S2-01 Abschlag 1: 10 Holz bringen +38, 100 Holz +219', () => {
    w.stock.wood = 100;
    w.sellPct.wood = 100;
    const m0 = w.money;
    expect(sell(w, 'wood', 10).ok).toBe(true);
    expect(w.money - m0).toBe(38); // Abschlag 2 ergäbe 36
    expect(w.sellPct.wood).toBe(90);
    for (let i = 0; i < 100; i++) step(w);
    expect(w.sellPct.wood).toBe(100);
    w.stock.wood = 100;
    const m1 = w.money; // step bucht Unterhalt/Steuern: Geld direkt vor dem Verkauf merken
    expect(sell(w, 'wood', 100).ok).toBe(true);
    expect(w.money - m1).toBe(219);
    expect(w.sellPct.wood).toBe(30);
  });

  it('AK-S2-02 sellPrice ist rein und bleibt am Boden bei 30 Prozent', () => {
    const before = JSON.stringify(w);
    expect(sellPrice(w, 'rum', 3)).toBe(53);
    expect(JSON.stringify(w)).toBe(before);
    w.sellPct.wood = 30;
    expect(sellPrice(w, 'wood', 10)).toBe(Math.floor((10 * 4 * 30) / 100));
    expect(sellPrice(w, 'wood', 50)).toBe(Math.floor((50 * 4 * 30) / 100));
  });

  it('AK-S2-03 Erholung nur bei tick % 10 === 0, höchstens 100; buy ändert sellPct nicht', () => {
    w.sellPct.wood = 50;
    w.tick = 0;
    tickMarket(w);
    expect(w.sellPct.wood).toBe(50);
    w.tick = 7;
    tickMarket(w);
    expect(w.sellPct.wood).toBe(50);
    w.tick = 10;
    tickMarket(w);
    expect(w.sellPct.wood).toBe(51);
    expect(w.sellPct.rum).toBe(100);
    w.sellPct.wood = 100;
    w.tick = 20;
    tickMarket(w);
    expect(w.sellPct.wood).toBe(100);
    const money = w.money;
    w.sellPct.food = 60;
    expect(buy(w, 'food', 5).ok).toBe(true);
    expect(w.sellPct.food).toBe(60);
    tickMarket(w);
    expect(w.money).toBe(money - 40);
  });

  it('AK-S2-04 Sättigung überlebt Speichern und Laden, Erholung läuft gleich weiter', () => {
    w.sellPct.wood = 60;
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.sellPct.wood).toBe(60);
    for (let i = 0; i < 100; i++) {
      step(w);
      step(r.world);
    }
    expect(r.world.sellPct.wood).toBe(70);
    expect(w.sellPct.wood).toBe(70);
  });

  it('AK-S2-14 erfolgloses sell ändert sellPct, Geld und Lager nicht', () => {
    w.sellPct.wood = 80;
    const money = w.money;
    const wood = w.stock.wood;
    expect(sell(w, 'wood', 0).ok).toBe(false);
    expect(sell(w, 'wood', wood + 1)).toEqual({ ok: false, reason: 'Nicht genug Ware' });
    expect(w.sellPct.wood).toBe(80);
    expect(w.money).toBe(money);
    expect(w.stock.wood).toBe(wood);
  });
});
