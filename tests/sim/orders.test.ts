import { beforeEach, describe, expect, it } from 'vitest';
import v1Json from './fixtures/save-v1.json?raw';
import { GOODS, GOOD_IDS, ORDER_PREMIUM } from '../../src/sim/defs/goods';
import { ORDER_DURATION, ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { deliverOrder, nextOrderTick, orderForPeriod, tickOrders } from '../../src/sim/orders';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Tier, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';

let w: World;

beforeEach(() => {
  w = createWorld(3);
});

function runTo(world: World, tick: number): void {
  while (world.tick < tick) step(world);
}

describe('Handelsaufträge', () => {
  it('AK-S2-05 erster Auftrag bei Tick 600, deterministisch je Seed', () => {
    const a = createWorld(3);
    const b = createWorld(3);
    runTo(a, 599);
    expect(a.order).toBeNull();
    runTo(a, 600);
    runTo(b, 600);
    expect(a.order).not.toBeNull();
    const o = a.order!;
    expect(o.period).toBe(0);
    expect(['wood', 'food']).toContain(o.good);
    const def = GOODS[o.good].order!;
    expect(o.amount).toBeGreaterThanOrEqual(def.min);
    expect(o.amount).toBeLessThanOrEqual(def.max);
    expect(o.reward).toBe(o.amount * Math.floor(0.75 * GOODS[o.good].buy));
    expect(o.due).toBe(1200);
    expect(b.order).toEqual(o);
  });

  it('AK-S2-06 zu wenig Ware oder kein Auftrag: fail, nichts verändert', () => {
    expect(deliverOrder(w)).toEqual({ ok: false, reason: 'Kein Auftrag' });
    w.order = { period: 0, good: 'wood', amount: 20, reward: 140, due: 1200 };
    w.stock.wood = 19;
    const money = w.money;
    const before = JSON.stringify(w);
    expect(deliverOrder(w)).toEqual({ ok: false, reason: 'Nicht genug Ware' });
    expect(JSON.stringify(w)).toBe(before);
    expect(w.money).toBe(money);
  });

  it('AK-S2-07 volles Lager: Liefern zieht amount ab, bucht reward, sellPct unverändert', () => {
    w.tick = 700;
    w.order = { period: 0, good: 'wood', amount: 25, reward: 175, due: 1200 };
    w.stock.wood = 100;
    w.sellPct.wood = 77;
    const money = w.money;
    expect(deliverOrder(w)).toEqual({ ok: true });
    expect(w.stock.wood).toBe(75);
    expect(w.money).toBe(money + 175);
    expect(w.order).toBeNull();
    expect(w.sellPct.wood).toBe(77);
  });

  it('AK-S2-08 bei due noch lieferbar, bei due + 1 verfallen, nächster Auftrag bei 1500', () => {
    runTo(w, 1200);
    expect(w.order).not.toBeNull();
    const copy = deserialize(serialize(w));
    expect(copy.ok).toBe(true);
    if (copy.ok) {
      copy.world.stock[copy.world.order!.good] = 100;
      expect(deliverOrder(copy.world)).toEqual({ ok: true });
    }
    w.tick = 1201;
    const money = w.money;
    tickOrders(w);
    expect(w.order).toBeNull();
    expect(w.money).toBe(money);
    w.tick = 1499;
    tickOrders(w);
    expect(w.order).toBeNull();
    w.tick = 1500;
    tickOrders(w);
    expect(w.order?.period).toBe(1);
    expect(w.order?.due).toBe(2100);
  });

  it('AK-S2-09 Eigenschaft: Pool, Menge und Prämie für k 0..199 und Höchststufe 1..3', () => {
    for (const tier of [1, 2, 3] as Tier[]) {
      for (let k = 0; k < 200; k++) {
        const o = orderForPeriod(3, k, tier);
        const def = GOODS[o.good].order;
        expect(def).toBeDefined();
        expect(def!.tier).toBeLessThanOrEqual(tier);
        expect(o.amount).toBeGreaterThanOrEqual(def!.min);
        expect(o.amount).toBeLessThanOrEqual(def!.max);
        const unit = Math.floor(GOODS[o.good].buy * ORDER_PREMIUM);
        expect(unit).toBeGreaterThan(GOODS[o.good].sell);
        expect(unit).toBeLessThanOrEqual(0.8 * GOODS[o.good].buy);
        expect(o.reward).toBe(o.amount * unit);
      }
    }
    expect(GOOD_IDS.length).toBeGreaterThan(0);
  });

  it('AK-S2-10 v1-Spielstand: kein Nachholauftrag, Auftrag Periode 1 bei Tick 1500', () => {
    const r = deserialize(v1Json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const old = r.world;
    expect(old.tick).toBe(1000);
    expect(old.order).toBeNull();
    runTo(old, 1499);
    expect(old.order).toBeNull();
    runTo(old, 1500);
    expect(old.order?.period).toBe(1);
  });

  it('AK-S2-11 nach dem Sieg entstehen weiter Aufträge, Liefern klappt, won bleibt', () => {
    w.won = true;
    w.tick = 1499;
    step(w);
    expect(w.tick).toBe(1500);
    expect(w.order?.period).toBe(1);
    w.stock[w.order!.good] = 100;
    expect(deliverOrder(w)).toEqual({ ok: true });
    expect(w.won).toBe(true);
  });

  it('AK-S2-12 Determinismus über Speichern und Laden', () => {
    const a = createWorld(3);
    for (let i = 0; i < 3000; i++) step(a);
    const b0 = createWorld(3);
    for (let i = 0; i < 1000; i++) step(b0);
    expect(b0.order).not.toBeNull();
    const r = deserialize(serialize(b0));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const b = r.world;
    for (let i = 1000; i < 3000; i++) step(b);
    expect(serialize(b)).toBe(serialize(a));
  });

  it('AK-S2-16 nextOrderTick', () => {
    w.tick = 0;
    expect(nextOrderTick(w)).toBe(600);
    w.tick = 600;
    expect(nextOrderTick(w)).toBe(1500);
    w.tick = 1499;
    expect(nextOrderTick(w)).toBe(1500);
  });

  it('RF-3b deliverOrder ist bei negativem Geld erlaubt', () => {
    w.order = { period: 0, good: 'wood', amount: 20, reward: 140, due: w.tick + 10 };
    w.stock.wood = 20;
    w.money = -100;
    expect(deliverOrder(w)).toEqual({ ok: true });
    expect(w.money).toBe(40);
  });

  it('Takt-Konstanten stimmen mit der Spec überein', () => {
    expect([ORDER_FIRST_TICK, ORDER_PERIOD, ORDER_DURATION]).toEqual([600, 900, 600]);
    expect(ORDER_PREMIUM).toBe(0.75);
  });
});
