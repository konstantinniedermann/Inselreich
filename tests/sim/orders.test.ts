import { beforeEach, describe, expect, it } from 'vitest';
import v1Json from './fixtures/save-v1.json?raw';
import { GOODS, GOOD_IDS, ORDER_PREMIUM } from '../../src/sim/defs/goods';
import { ORDER_DURATION, ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import {
  acceptFarOrder,
  cancelContract,
  deliverOrder,
  maxHouseTier,
  nextOrderTick,
  orderForPeriod,
  orderPool,
  previewOrder,
  tickOrders,
} from '../../src/sim/orders';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, Tier, World } from '../../src/sim/types';
import { newHouseState } from '../../src/sim/population';
import { createWorld, home } from '../../src/sim/world';
import { foundKontor2Literal, seaWorld } from './seaHelpers';
import { ORDER_PINS, SEE_SEEDS } from './seePins';

let w: World;

beforeEach(() => {
  w = createWorld(3, { unlockAll: true });
});

function runTo(world: World, tick: number): void {
  while (world.tick < tick) step(world);
}

describe('Handelsaufträge', () => {
  it('AK-S2-05 erster Auftrag bei Tick 600, deterministisch je Seed', () => {
    const a = createWorld(3, { unlockAll: true });
    const b = createWorld(3, { unlockAll: true });
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
    home(w).stock.wood = 19;
    const money = w.money;
    const before = JSON.stringify(w);
    expect(deliverOrder(w)).toEqual({ ok: false, reason: 'Nicht genug Ware' });
    expect(JSON.stringify(w)).toBe(before);
    expect(w.money).toBe(money);
  });

  it('AK-S2-07 volles Lager: Liefern zieht amount ab, bucht reward, sellPct unverändert', () => {
    w.tick = 700;
    w.order = { period: 0, good: 'wood', amount: 25, reward: 175, due: 1200 };
    home(w).stock.wood = 100;
    w.sellPct.wood = 77;
    const money = w.money;
    expect(deliverOrder(w)).toEqual({ ok: true });
    expect(home(w).stock.wood).toBe(75);
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
      home(copy.world).stock[copy.world.order!.good] = 100;
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
    home(w).stock[w.order!.good] = 100;
    expect(deliverOrder(w)).toEqual({ ok: true });
    expect(w.won).toBe(true);
  });

  it('AK-S2-12 Determinismus über Speichern und Laden', () => {
    const a = createWorld(3, { unlockAll: true });
    for (let i = 0; i < 3000; i++) step(a);
    const b0 = createWorld(3, { unlockAll: true });
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
    home(w).stock.wood = 20;
    w.money = -100;
    expect(deliverOrder(w)).toEqual({ ok: true });
    expect(w.money).toBe(40);
  });

  it('Takt-Konstanten stimmen mit der Spec überein', () => {
    expect([ORDER_FIRST_TICK, ORDER_PERIOD, ORDER_DURATION]).toEqual([600, 900, 600]);
    expect(ORDER_PREMIUM).toBe(0.75);
  });
});

/** FNV-1a, 32 Bit, über die UTF-16-Codeeinheiten (wie balance-crises.test.ts; Test-Helfer, keine Abhängigkeit). */
function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

// Referenz gemessen auf main 31b5977 (Code vor M8-S1) mit genau diesem Test, Plan M8 Task 1 Schritt 1.
const POOL_REFERENCE = 0xea2c801e;

describe('M8 Auftrags-Pool bitgleich (Spec 5.4)', () => {
  it('AK-S2-13 Referenz: orderForPeriod für Stufe 1 … 3, k 0 … 199, Seeds 1 … 10 bitgleich zum Code vor M8', () => {
    const all: unknown[] = [];
    for (let seed = 1; seed <= 10; seed++)
      for (const t of [1, 2, 3] as Tier[])
        for (let k = 0; k < 200; k++) all.push(orderForPeriod(seed, k, t));
    expect(all).toHaveLength(6000);
    expect(fnv1a32(JSON.stringify(all))).toBe(POOL_REFERENCE);
  });
});

describe('M12 E2 Aufträge je Insel (AK-E2-05, AK-E2-14)', () => {
  const orderWorld = (): World => {
    const s = seaWorld();
    foundKontor2Literal(s, 2);
    s.order = { period: 0, good: 'tools', amount: 10, reward: 500, due: 99_999 };
    home(s).stock.tools = 50;
    return s;
  };
  it('zu wenig im Lager 2: Nicht genug Ware auf Felsbucht', () => {
    const s = orderWorld();
    s.islands[2]!.stock.tools = 5;
    expect(deliverOrder(s, 2)).toEqual({ ok: false, reason: 'Nicht genug Ware auf Felsbucht' });
    expect(s.order).not.toBeNull();
  });
  it('genug im Lager 2: Lager 2 -10, Heimat gleich, Prämie', () => {
    const s = orderWorld();
    s.islands[2]!.stock.tools = 10;
    const m = s.money;
    expect(deliverOrder(s, 2)).toEqual({ ok: true });
    expect(s.islands[2]!.stock.tools).toBe(0);
    expect(home(s).stock.tools).toBe(50);
    expect(s.money).toBe(m + 500);
    expect(s.order).toBeNull();
  });
  it('Heimat behält den Text; Insel ohne Kontor: Kein Kontor auf Möweninsel', () => {
    const s = orderWorld();
    home(s).stock.tools = 5;
    expect(deliverOrder(s)).toEqual({ ok: false, reason: 'Nicht genug Ware' });
    const before = serialize(s);
    expect(deliverOrder(s, 1)).toEqual({ ok: false, reason: 'Kein Kontor auf Möweninsel' });
    expect(serialize(s)).toBe(before);
  });
});

describe('AK-E3-04 Gewürz ist kein Auftrags- und Boomgut', () => {
  it('orderPool für Stufe 0 … 4 enthält nie spice', () => {
    for (const t of [0, 1, 2, 3, 4] as Tier[]) expect(orderPool(t)).not.toContain('spice');
  });
  it('orderForPeriod für SEE_SEEDS × k 0 … 19 bleibt gleich ORDER_PINS', () => {
    for (const seed of SEE_SEEDS)
      expect(
        Array.from({ length: 20 }, (_, k) => {
          const o = orderForPeriod(seed, k, 4);
          return [o.good, o.amount];
        }),
      ).toEqual(ORDER_PINS[seed]);
  });
});

describe('previewOrder (I-102)', () => {
  const addHouse = (world: World, tier: Tier): Building => {
    const id = world.nextBuildingId++;
    const b: Building = {
      id,
      defId: 'house',
      x: 0,
      y: 0,
      connected: true,
      progress: 0,
      state: 'ok',
      island: 0,
      house: { ...newHouseState(world), tier },
    };
    world.buildings[id] = b;
    return b;
  };
  const expected = (world: World): { tick: number; good: string } => {
    const tick = nextOrderTick(world);
    const k = (tick - ORDER_FIRST_TICK) / ORDER_PERIOD;
    return { tick, good: orderForPeriod(world.seed, k, maxHouseTier(world)).good };
  };
  /** Seed, dessen Auftrag der Periode 0 in Stufe 1 und 2 verschieden ist. */
  const tierSensitiveSeed = (): number => {
    for (let seed = 1; seed < 500; seed++)
      if (orderForPeriod(seed, 0, 1).good !== orderForPeriod(seed, 0, 2).good) return seed;
    throw new Error('kein Seed gefunden');
  };

  it('AK-1 Tick und Gut stimmen vor dem ersten Auftrag, in der Lücke und mitten im Auftrag', () => {
    for (const t of [0, 5, ORDER_FIRST_TICK + ORDER_DURATION + 1, ORDER_FIRST_TICK + 10]) {
      const world = createWorld(3, { unlockAll: true });
      world.tick = t;
      expect(previewOrder(world)).toEqual(expected(world));
    }
    const early = createWorld(3, { unlockAll: true });
    expect(previewOrder(early)!.tick).toBe(ORDER_FIRST_TICK);
  });

  it('AK-2 ändert die Welt nicht, ist wiederholbar und sagt das Gut des echten Angebots voraus', () => {
    const before = JSON.stringify(w);
    const a = previewOrder(w);
    const b = previewOrder(w);
    expect(JSON.stringify(w)).toBe(before);
    expect(a).toEqual(b);
    runTo(w, a!.tick);
    expect(w.order!.good).toBe(a!.good);
  });

  it('AK-3 Stufenaufstieg und Abriss ändern die Vorschau; das Angebot nutzt die Stufe zum Angebotszeitpunkt', () => {
    const seed = tierSensitiveSeed();
    const world = createWorld(seed, { unlockAll: true });
    const g1 = previewOrder(world)!.good;
    expect(g1).toBe(orderForPeriod(seed, 0, 1).good);
    const h = addHouse(world, 2);
    expect(previewOrder(world)!.good).toBe(orderForPeriod(seed, 0, 2).good);
    delete world.buildings[h.id];
    expect(previewOrder(world)!.good).toBe(g1);
    addHouse(world, 2);
    runTo(world, ORDER_FIRST_TICK);
    expect(world.order!.good).toBe(orderForPeriod(seed, 0, 2).good);
  });

  it('AK-4 Vertrag, offenes Angebot und Sperre liefern null; nach Kündigung wieder ein Wert', () => {
    w.contract = { good: 'wood', amount: 10, price: 5, island: 0 };
    expect(previewOrder(w)).toBeNull();
    cancelContract(w);
    expect(previewOrder(w)).not.toBeNull();
    w.contractOffer = { good: 'wood', island: 0 };
    expect(previewOrder(w)).toBeNull();
    w.contractOffer = null;
    const locked = createWorld(3);
    expect(previewOrder(locked)).toBeNull();
  });

  it('AK-5 nach Fernauftrag zeigt die Vorschau die übernächste Periode, nicht die gesperrte', () => {
    const s = seaWorld();
    foundKontor2Literal(s, 2);
    s.tick = ORDER_FIRST_TICK;
    s.order = { period: 0, good: 'wood', amount: 5, reward: 50, due: s.tick + ORDER_DURATION };
    s.farOffer = { island: 2, good: 'tools', amount: 5, reward: 100 };
    expect(acceptFarOrder(s)).toEqual({ ok: true });
    const p = previewOrder(s)!;
    expect(p.tick).toBe(ORDER_FIRST_TICK + 2 * ORDER_PERIOD);
    expect(p.good).toBe(orderForPeriod(s.seed, 2, maxHouseTier(s)).good);
    s.order = null;
    expect(previewOrder(s)!.tick).toBe(ORDER_FIRST_TICK + 2 * ORDER_PERIOD);
  });

  it('AK-7a Aufrufe in jedem Schritt ändern den Verlauf nicht (bitgleich)', () => {
    const a = createWorld(3, { unlockAll: true });
    const b = createWorld(3, { unlockAll: true });
    for (let i = 0; i < ORDER_FIRST_TICK + 2 * ORDER_PERIOD; i++) {
      previewOrder(a);
      step(a);
      step(b);
    }
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
