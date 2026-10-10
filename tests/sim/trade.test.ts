import { beforeEach, describe, expect, it } from 'vitest';
import { beginCrisis } from '../../src/sim/crises';
import { BOOM_PCT } from '../../src/sim/defs/crises';
import { GOODS, GOOD_IDS, ORDER_PREMIUM } from '../../src/sim/defs/goods';
import { deliverOrder } from '../../src/sim/orders';
import { createWorld, home } from '../../src/sim/world';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import { buy, buyPrice, sell, sellPrice, tickMarket } from '../../src/sim/trade';
import type { GoodId, World } from '../../src/sim/types';
import { foundKontor2Literal, seaWorld } from './seaHelpers';

let w: World;

beforeEach(() => {
  w = createWorld(3, { unlockAll: true });
});

describe('buy', () => {
  it('buys 10 tools: money -400, tools +10', () => {
    expect(buy(w, 'tools', 10)).toEqual({ ok: true });
    expect(w.money).toBe(4600);
    expect(home(w).stock.tools).toBe(30);
  });

  it('fails with Lager voll and changes nothing', () => {
    home(w).stock.tools = 95;
    expect(buy(w, 'tools', 10)).toEqual({ ok: false, reason: 'Lager voll' });
    expect(home(w).stock.tools).toBe(95);
    expect(w.money).toBe(5000);
  });

  it('fails with Zu wenig Geld', () => {
    w.money = 30;
    expect(buy(w, 'tools', 1)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    expect(w.money).toBe(30);
    expect(home(w).stock.tools).toBe(20);
  });

  it('fails with Kein Geld when money is negative', () => {
    w.money = -5;
    expect(buy(w, 'tools', 1)).toEqual({ ok: false, reason: 'Kein Geld' });
    expect(w.money).toBe(-5);
  });

  it('Lager voll takes precedence over Zu wenig Geld', () => {
    w.money = 30;
    home(w).stock.tools = 95;
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
    expect(home(w).stock.food).toBe(20);
    expect(w.money).toBe(5000);
  });

  it('sells 10 food: money +28, food 10', () => {
    expect(sell(w, 'food', 10)).toEqual({ ok: true });
    expect(w.money).toBe(5028); // Abschlag 1: 3 × (100 + … + 91) / 100
    expect(home(w).stock.food).toBe(10);
  });

  it('is allowed with negative money', () => {
    w.money = -100;
    expect(sell(w, 'food', 10)).toEqual({ ok: true });
    expect(w.money).toBe(-72);
  });

  it('rejects non-integer amounts', () => {
    expect(sell(w, 'food', 1.5)).toEqual({ ok: false, reason: 'Ungültige Menge' });
    expect(sell(w, 'food', 0)).toEqual({ ok: false, reason: 'Ungültige Menge' });
    expect(home(w).stock.food).toBe(20);
  });
});

describe('prices', () => {
  it('computes totals from the goods table', () => {
    expect(buyPrice(w, 'tools', 10)).toBe(400);
    expect(sellPrice(w, 'rum', 3)).toBe(53);
  });
});

describe('Verkaufssättigung', () => {
  it('AK-S2-01 Abschlag 1: 10 Holz bringen +38, 100 Holz +219', () => {
    home(w).stock.wood = 100;
    w.sellPct.wood = 100;
    const m0 = w.money;
    expect(sell(w, 'wood', 10).ok).toBe(true);
    expect(w.money - m0).toBe(38); // Abschlag 2 ergäbe 36
    expect(w.sellPct.wood).toBe(90);
    for (let i = 0; i < 100; i++) step(w);
    expect(w.sellPct.wood).toBe(100);
    home(w).stock.wood = 100;
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
    const wood = home(w).stock.wood;
    expect(sell(w, 'wood', 0).ok).toBe(false);
    expect(sell(w, 'wood', wood + 1)).toEqual({ ok: false, reason: 'Nicht genug Ware' });
    expect(w.sellPct.wood).toBe(80);
    expect(w.money).toBe(money);
    expect(home(w).stock.wood).toBe(wood);
  });
});

/** Boom auf `good` ab world.tick = 2400 (Periode 0, Stufe normal). */
function boom(good: GoodId): void {
  w.crisisLevel = 'normal';
  w.tick = 2400;
  beginCrisis(w, 0, { kind: 'boom', good });
}

describe('M6 Boom', () => {
  it('AK-S3-03 Rum-Boom: 10 Rum 257 statt 171, Sättigung wie gewohnt; Holz unberührt', () => {
    home(w).stock.rum = 10;
    const plain = sellPrice(w, 'rum', 10);
    boom('rum');
    expect(plain).toBe(171);
    expect(sellPrice(w, 'rum', 10)).toBe(257);
    const m0 = w.money;
    expect(sell(w, 'rum', 10)).toEqual({ ok: true });
    expect(w.money - m0).toBe(257);
    expect(w.sellPct.rum).toBe(90);
    expect(sellPrice(w, 'wood', 10)).toBe(38);
  });

  it('AK-S3-04 Aufschlag bei world.tick T und T+299, nach Schritt T+300 nicht mehr', () => {
    boom('rum');
    expect(sellPrice(w, 'rum', 1)).toBe(27);
    while (w.tick < 2699) step(w);
    expect(sellPrice(w, 'rum', 1)).toBe(27);
    step(w);
    expect(w.tick).toBe(2700);
    expect(sellPrice(w, 'rum', 1)).toBe(18);
  });

  it('AK-S3-05 Invariante: Boompreis < Auftragsprämie < Kaufpreis; Kaufen und im Boom verkaufen verliert', () => {
    for (const g of GOOD_IDS) {
      const { buy: b, sell: s } = GOODS[g];
      expect((s * BOOM_PCT) / 100, g).toBeLessThan(Math.floor(b * ORDER_PREMIUM));
      expect(Math.floor(b * ORDER_PREMIUM), g).toBeLessThan(b);
      w = createWorld(3, { unlockAll: true });
      boom(g);
      home(w).stock[g] = 0;
      const m0 = w.money;
      expect(buy(w, g, 1).ok).toBe(true);
      expect(sell(w, g, 1).ok).toBe(true);
      expect(w.money, g).toBeLessThan(m0);
    }
  });

  it('AK-S3-06 Sättigung im Boom: sellPct 30 → +81 statt +54, bleibt 30', () => {
    home(w).stock.rum = 10;
    w.sellPct.rum = 30;
    expect(sellPrice(w, 'rum', 10)).toBe(54);
    boom('rum');
    const m0 = w.money;
    expect(sell(w, 'rum', 10).ok).toBe(true);
    expect(w.money - m0).toBe(81);
    expect(w.sellPct.rum).toBe(30);
  });

  it('AK-S3-07 ohne Boom bitgleich; Auftragsprämie im Boom unverändert', () => {
    expect(sellPrice(w, 'rum', 3)).toBe(53);
    expect(sellPrice(w, 'wood', 10)).toBe(38);
    boom('wood');
    w.order = { period: 2, good: 'wood', amount: 25, reward: 175, due: 3000 }; // Angebot 2400
    home(w).stock.wood = 25;
    const m0 = w.money;
    expect(deliverOrder(w)).toEqual({ ok: true });
    expect(w.money - m0).toBe(175);
  });
});

describe('M12 E2 Handel je Insel (AK-E2-04)', () => {
  it('Kauf auf Insel 2 bucht dort, Heimat unverändert; Grenze 100 je Insel', () => {
    const s = seaWorld();
    foundKontor2Literal(s, 2);
    s.money = 100_000;
    const homeWood = home(s).stock.wood;
    expect(buy(s, 'wood', 10, 2)).toEqual({ ok: true });
    expect(s.islands[2]!.stock.wood).toBe(10);
    expect(home(s).stock.wood).toBe(homeWood);
    s.islands[2]!.stock.wood = 95;
    expect(buy(s, 'wood', 10, 2)).toEqual({ ok: false, reason: 'Lager voll' });
    expect(s.islands[2]!.stock.wood).toBe(95);
  });
  it('Verkauf Heimat + Insel 2 senkt sellPct global um 20 Punkte', () => {
    const s = seaWorld();
    foundKontor2Literal(s, 2);
    const start = s.sellPct.tools;
    home(s).stock.tools = 10;
    s.islands[2]!.stock.tools = 10;
    expect(sell(s, 'tools', 10)).toEqual({ ok: true });
    expect(sell(s, 'tools', 10, 2)).toEqual({ ok: true });
    expect(s.islands[2]!.stock.tools).toBe(0);
    expect(s.sellPct.tools).toBe(start - 20);
  });
  it('ohne Kontor: Kein Kontor auf Möweninsel, Welt unverändert', () => {
    const s = seaWorld();
    s.money = 100_000;
    const before = serialize(s);
    expect(buy(s, 'wood', 1, 1)).toEqual({ ok: false, reason: 'Kein Kontor auf Möweninsel' });
    expect(sell(s, 'wood', 1, 1)).toEqual({ ok: false, reason: 'Kein Kontor auf Möweninsel' });
    expect(serialize(s)).toBe(before);
  });
});
