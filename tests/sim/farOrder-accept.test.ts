// Handel 2 T05: Fernauftrag annehmen und am Fern-Kontor liefern (AK-H2-06 a, 07 bis 15, 26, 32, P1).
import { describe, expect, it } from 'vitest';
import { GOODS } from '../../src/sim/defs/goods';
import { FUNCTION_ENTRY } from '../../src/sim/defs/unlocks';
import { FAR_ORDER_DURATION } from '../../src/sim/defs/timing';
import { islandName } from '../../src/sim/islands';
import { acceptFarOrder, deliverOrder } from '../../src/sim/orders';
import { serialize } from '../../src/sim/save';
import { buy } from '../../src/sim/trade';
import { functionLock } from '../../src/sim/unlocks';
import type { GoodId, World } from '../../src/sim/types';
import { HOME } from '../../src/sim/world';
import { dropKontor, farWorld, islandOf, periodStart, stepAt } from './farHelpers';
import { placeTownhall, setHouse } from './helpers';

const P = periodStart(1);

/** Welt mit Fernangebot Rum/Felsbucht in Periode 1. */
function offerWorld(kinds: Parameters<typeof farWorld>[1] = ['B']): World {
  const w = farWorld(3, kinds);
  stepAt(w, P);
  return w;
}

describe('AK-H2-08 Annehmen ersetzt den Auftrag', () => {
  it('Fernauftrag mit langer Frist, Angebot weg, Folgeperiode gesperrt, nichts kostet', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    const money = w.money;
    const stocks = w.islands.map((i) => ({ ...i.stock }));
    expect(acceptFarOrder(w)).toEqual({ ok: true });
    expect(w.order).toEqual({
      period: 1,
      good: 'rum',
      amount: 15,
      reward: 450,
      due: P + FAR_ORDER_DURATION,
      island: B,
    });
    expect(w.farOffer).toBeNull();
    expect(w.farSkip).toBe(2);
    expect(w.money).toBe(money);
    expect(w.islands.map((i) => i.stock)).toEqual(stocks);
  });
});

describe('AK-H2-09 Fehlfälle in fester Reihenfolge (auch AK-H2-07)', () => {
  const rejects = (w: World, reason: string): void => {
    const snap = serialize(w);
    expect(acceptFarOrder(w)).toEqual({ ok: false, reason });
    expect(serialize(w)).toBe(snap);
  };
  it('Sperre vor fehlendem Angebot', () => {
    const w = offerWorld();
    w.farOffer = null;
    w.unlocked = w.unlocked.filter((u) => u !== FUNCTION_ENTRY.orders);
    rejects(w, functionLock(w, 'orders')!);
  });
  it('kein Angebot', () => {
    const w = offerWorld();
    w.farOffer = null;
    rejects(w, 'Kein Fernangebot');
  });
  it('Vertrag läuft', () => {
    const w = offerWorld();
    w.contract = { good: 'wood', amount: 1, price: 1, island: 0 };
    rejects(w, 'Vertrag läuft');
  });
  it('Angebot ohne Kontor', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    dropKontor(w, B);
    rejects(w, `Kein Kontor auf ${islandName(w, B)}`);
  });
  it('AK-H2-P1: Angebot ohne Auftrag', () => {
    const w = offerWorld();
    w.order = null;
    rejects(w, 'Kein Auftrag');
  });
});

describe('AK-H2-09 Hilfsfall kein Angebot', () => {
  it('Grund Kein Fernangebot', () => {
    const w = offerWorld();
    w.farOffer = null;
    expect(acceptFarOrder(w)).toEqual({ ok: false, reason: 'Kein Fernangebot' });
  });
});

describe('AK-H2-10 Stufenabstieg ändert den Auftrag nicht', () => {
  it('Lieferung zahlt weiter', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    acceptFarOrder(w);
    const order = structuredClone(w.order);
    for (const b of Object.values(w.buildings)) if (b.house !== undefined) setHouse(b, 1, 1);
    expect(w.order).toEqual(order);
    w.islands[B]!.stock.rum = 15;
    const money = w.money;
    expect(deliverOrder(w, B).ok).toBe(true);
    expect(w.money).toBe(money + 450);
  });
});

describe('AK-H2-11 Lieferung am Fern-Kontor', () => {
  it('zahlt, räumt Angebote, lässt sellPct, bietet Vertrag an', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    acceptFarOrder(w);
    w.islands[B]!.stock.rum = 20;
    const money = w.money;
    const sellPct = w.sellPct.rum;
    expect(deliverOrder(w, B)).toEqual({ ok: true });
    expect(w.islands[B]!.stock.rum).toBe(5);
    expect(w.money).toBe(money + 450);
    expect(w.order).toBeNull();
    expect(w.farOffer).toBeNull();
    expect(w.contractOffer).toEqual({ good: 'rum', island: B });
    expect(w.sellPct.rum).toBe(sellPct);
  });
});

describe('AK-H2-12 nur auf der Auftragsinsel', () => {
  it('andere Inseln abgewiesen', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    acceptFarOrder(w);
    w.islands[HOME]!.stock.rum = 50;
    for (const i of [HOME, islandOf(w, 'A'), 9]) {
      const snap = serialize(w);
      expect(deliverOrder(w, i)).toEqual({ ok: false, reason: `Nur auf ${islandName(w, B)}` });
      expect(serialize(w)).toBe(snap);
    }
  });
});

describe('AK-H2-13 Kontor weg, Verfall ohne Strafe', () => {
  it('Lieferung abgewiesen, Verfall kostet nichts', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    acceptFarOrder(w);
    dropKontor(w, B);
    w.islands[B]!.stock.rum = 20;
    expect(deliverOrder(w, B)).toEqual({
      ok: false,
      reason: `Kein Kontor auf ${islandName(w, B)}`,
    });
    const v = structuredClone(w);
    v.order = null;
    const before = w.money;
    const beforeV = v.money;
    stepAt(w, P + FAR_ORDER_DURATION + 1);
    stepAt(v, P + FAR_ORDER_DURATION + 1);
    expect(w.order).toBeNull();
    expect(w.money - before).toBe(v.money - beforeV);
  });
});

describe('AK-H2-14 zu wenig Ware', () => {
  it('keine Teillieferung', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    acceptFarOrder(w);
    w.islands[B]!.stock.rum = 14;
    expect(deliverOrder(w, B)).toEqual({
      ok: false,
      reason: `Nicht genug Ware auf ${islandName(w, B)}`,
    });
    expect(w.islands[B]!.stock.rum).toBe(14);
  });
});

describe('AK-H2-15 Boom, Edikt und Warensperre ändern die Prämie nicht', () => {
  it('Fernauftrag zahlt 450', () => {
    const w = offerWorld();
    const B = islandOf(w, 'B');
    acceptFarOrder(w);
    w.crisis = { period: 0, kind: 'boom', from: w.tick, until: w.tick + 100, good: 'rum' };
    placeTownhall(w);
    w.edict = 'trade';
    w.goodLocks = [{ tier: 1, good: 'rum' }];
    w.islands[B]!.stock.rum = 15;
    const money = w.money;
    expect(deliverOrder(w, B).ok).toBe(true);
    expect(w.money).toBe(money + 450);
  });
  it('Zufallsauftrag lässt sich auf der Möweninsel liefern', () => {
    const w = offerWorld(['A', 'B']);
    const A = islandOf(w, 'A');
    w.islands[A]!.stock[w.order!.good] = w.order!.amount;
    expect(deliverOrder(w, A).ok).toBe(true);
  });
});

describe('AK-H2-06 (a) Zufallsauftrag liefern räumt das Fernangebot', () => {
  it('farOffer null', () => {
    const w = offerWorld();
    expect(w.farOffer).not.toBeNull();
    w.islands[HOME]!.stock[w.order!.good] = w.order!.amount;
    expect(deliverOrder(w).ok).toBe(true);
    expect(w.farOffer).toBeNull();
  });
});

describe('AK-H2-26 Handelsedikt: Einkauf und Lieferung', () => {
  const cases: [string, 'A' | 'B' | 'C', number, GoodId, number][] = [
    ['Stoff', 'A', 2, 'cloth', -40],
    ['Rum', 'B', 3, 'rum', -30],
    ['Glas', 'C', 4, 'glass', -36],
  ];
  for (const [name, kind, tier, good, diff] of cases) {
    it(`${name}: Differenz ${diff}`, () => {
      const w = farWorld(tier as 2 | 3 | 4, [kind]);
      placeTownhall(w);
      stepAt(w, P);
      const i = islandOf(w, kind);
      w.edict = 'trade';
      w.buyPct[good] = 100;
      w.money = 10_000;
      w.islands[i]!.stock[good] = 0;
      expect(w.farOffer?.good).toBe(good);
      expect(acceptFarOrder(w).ok).toBe(true);
      const before = w.money;
      expect(buy(w, good, GOODS[good].order!.far!, i).ok).toBe(true);
      expect(deliverOrder(w, i).ok).toBe(true);
      expect(w.money - before).toBe(diff);
    });
  }
});

describe('AK-H2-32 Annehmen bei Vertrag', () => {
  it('ohne Angebot Kein Fernangebot', () => {
    const w = offerWorld();
    w.farOffer = null;
    w.contract = { good: 'wood', amount: 1, price: 1, island: 0 };
    expect(acceptFarOrder(w)).toEqual({ ok: false, reason: 'Kein Fernangebot' });
  });
});
