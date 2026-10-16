import { mkdirSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CONTRACT_LOYAL_AFTER } from '../../src/sim/defs/goods';
import { ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { totalUpkeep } from '../../src/sim/economy';
import { FUNCTION_ENTRY } from '../../src/sim/defs/unlocks';
import {
  acceptContract,
  cancelContract,
  contractUnitPrice,
  maxHouseTier,
  orderForPeriod,
} from '../../src/sim/orders';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { StepReport } from '../../src/sim/tick';
import { HOME, createWorld, home } from '../../src/sim/world';
import { houseNearKontor, setHouse } from './helpers';
import { foundKontor2Literal } from './seaHelpers';
import type { Tier, World } from '../../src/sim/types';

declare const process: { env: Record<string, string | undefined> };

const N = CONTRACT_LOYAL_AFTER;
const periodStart = (k: number): number => ORDER_FIRST_TICK + k * ORDER_PERIOD;

function base(tier: Tier = 3): World {
  const w = createWorld(3, { unlockAll: true });
  setHouse(houseNearKontor(w), tier, 1);
  return w;
}

/** Setzt die Uhr so, dass der nächste Schritt auf Tick `t` fällt, und führt ihn aus. */
function stepAt(w: World, t: number): StepReport {
  w.tick = t - 1;
  return step(w);
}

function withRumContract(tier: Tier = 3): World {
  const w = base(tier);
  w.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries: 0 };
  home(w).stock.rum = 60;
  return w;
}

/** Liefert `count` Mal in aufeinanderfolgenden Perioden. */
function deliver(w: World, count: number): void {
  for (let i = 1; i <= count; i++) stepAt(w, periodStart(i + 1));
}

function expectLoyalSequence(w: World): void {
  for (let i = 1; i <= N + 1; i++) {
    const r = stepAt(w, periodStart(i + 1));
    expect(r.contract).toEqual({
      kind: 'delivered',
      good: 'rum',
      amount: 5,
      pay: 135,
      island: HOME,
      loyal: i >= N,
      becameLoyal: i === N,
    });
    expect(w.contract!.deliveries).toBe(Math.min(i, N));
  }
}

describe('AK-TR-01 Annahme startet bei 0', () => {
  it('acceptContract setzt deliveries 0', () => {
    const w = base();
    w.contractOffer = { good: 'rum', island: HOME };
    expect(acceptContract(w).ok).toBe(true);
    expect(w.contract!.deliveries).toBe(0);
    expect(w.contract).toEqual({
      good: 'rum',
      amount: 5,
      price: contractUnitPrice('rum'),
      island: HOME,
      deliveries: 0,
    });
  });
});

describe('AK-TR-02 Zähler und Bericht', () => {
  it('zählt, sättigt bei N, becameLoyal nur beim Übergang', () => {
    expectLoyalSequence(withRumContract());
  });
});

describe('AK-TR-03 Kündigung setzt zurück', () => {
  it('neuer Vertrag beginnt wieder bei 0, Geld unverändert durch Kündigung', () => {
    const w = withRumContract();
    deliver(w, N);
    expect(w.contract!.deliveries).toBe(N);
    const money = w.money;
    expect(cancelContract(w).ok).toBe(true);
    expect(w.money).toBe(money);
    w.contractOffer = { good: 'rum', island: HOME };
    expect(acceptContract(w).ok).toBe(true);
    expect(w.contract!.deliveries).toBe(0);
  });
});

describe('AK-TR-04 Zähler unabhängig von Boom, Edikt, Stufe', () => {
  it('gleiche Folge bei Boom, Edikt und Stufe 2', () => {
    const w = withRumContract(2);
    w.crisis = { period: 0, kind: 'boom', from: 0, until: 99999, good: 'rum' };
    w.edict = 'trade';
    expectLoyalSequence(w);
  });
});

function loyal(island = HOME, stock = 3): World {
  const w = base();
  if (island !== HOME) foundKontor2Literal(w, island);
  w.order = null;
  w.contract = { good: 'rum', amount: 5, price: 27, island, deliveries: N };
  w.islands[island]!.stock.rum = stock;
  w.money = 1000;
  return w;
}

/** Welt ohne Häuser, Unterhalt und Steuer: die Kasse bewegt sich nur durch den Vertrag. */
function quiet(): World {
  const w = createWorld(3, { unlockAll: true });
  w.order = null;
  w.contractOffer = null;
  w.upkeepCarry = 0;
  w.taxCarry = 0;
  expect(totalUpkeep(w)).toBe(0);
  expect(Object.values(w.buildings).every((b) => b.house === undefined)).toBe(true);
  return w;
}

function quietLoyal(island = HOME, stock = 3): World {
  const w = quiet();
  w.contract = { good: 'rum', amount: 5, price: 27, island, deliveries: N };
  w.islands[island]!.stock.rum = stock;
  return w;
}

const lockOrders = (w: World): void => {
  w.unlocked = w.unlocked.filter((u) => u !== FUNCTION_ENTRY.orders);
};

function load(w: World): World {
  const r = deserialize(serialize(w));
  if (!r.ok) throw new Error(r.reason);
  return r.world;
}

function expectExcused(w: World, reason: 'stock' | 'kontor', island: number, k = 2): void {
  const m0 = w.money;
  const contract = { ...w.contract! };
  const stock = w.islands[island]!.stock.rum;
  const r = stepAt(w, periodStart(k));
  expect(w.money).toBe(m0);
  expect(w.islands[island]!.stock.rum).toBe(stock);
  expect(w.contract).toEqual({ ...contract, deliveries: 0 });
  expect(w.order).toBeNull();
  expect(w.farOffer).toBeNull();
  expect(w.contractOffer).toBeNull();
  expect(r.contract).toEqual({ kind: 'excused', good: 'rum', reason, island });
}

describe('Kulanz', () => {
  it('AK-TR-05 treuer Stammkunde, Fehlbestand: verziehen ohne Geldfluss', () => {
    expectExcused(quietLoyal(HOME, 3), 'stock', HOME);
  });

  it('AK-TR-06 Fremdinsel ohne Kontor: verziehen mit Grund kontor', () => {
    expectExcused(quietLoyal(1, 3), 'kontor', 1);
  });

  it('AK-TR-07 nicht treu (N-1): Bruch mit Strafe und Zufallsauftrag', () => {
    const w = loyal(HOME, 3);
    w.contract!.deliveries = N - 1;
    const r = stepAt(w, periodStart(2));
    expect(r.contract).toMatchObject({ kind: 'broken', penalty: 135 });
    expect(w.money).toBe(1000 - 135);
    expect(w.contract).toBeNull();
    expect(w.order).toMatchObject(orderForPeriod(w.seed, 2, maxHouseTier(w)));
  });

  it('AK-TR-08 zweiter Fehlbestand in Folge bricht', () => {
    const w = loyal(HOME, 3);
    expect(stepAt(w, periodStart(2)).contract!.kind).toBe('excused');
    const r = stepAt(w, periodStart(3));
    expect(r.contract).toMatchObject({ kind: 'broken', penalty: 135 });
    expect(w.contract).toBeNull();
  });

  it('AK-TR-09 Sperre und fehlende Insel werden nie verziehen', () => {
    const a = loyal(HOME, 3);
    lockOrders(a);
    const ra = stepAt(a, periodStart(2));
    expect(ra.contract).toMatchObject({ kind: 'broken', reason: 'lock', penalty: 135 });
    const b = loyal(HOME, 3);
    b.contract!.island = b.islands.length;
    const rb = stepAt(b, periodStart(2));
    expect(rb.contract).toMatchObject({ kind: 'broken', reason: 'island', penalty: 135 });
  });

  it('AK-TR-10 nach Kulanz zählt die Treue neu und ist wieder verdienbar', () => {
    const w = quietLoyal(HOME, 3);
    stepAt(w, periodStart(2));
    for (let i = 1; i <= N; i++) {
      home(w).stock.rum = 60;
      const r = stepAt(w, periodStart(2 + i));
      expect(r.contract).toMatchObject({ kind: 'delivered', loyal: i >= N, becameLoyal: i === N });
    }
    home(w).stock.rum = 3;
    const r = stepAt(w, periodStart(3 + N));
    expect(r.contract).toMatchObject({ kind: 'excused' });
    expect(w.contract!.deliveries).toBe(0);
  });

  it('AK-TR-20 Lieferung nach Kulanz zählt als erste, nicht treu', () => {
    const w = quietLoyal(HOME, 3);
    stepAt(w, periodStart(2));
    home(w).stock.rum = 5;
    const r = stepAt(w, periodStart(3));
    expect(r.contract).toMatchObject({
      kind: 'delivered',
      pay: 135,
      loyal: false,
      becameLoyal: false,
    });
    expect(w.contract!.deliveries).toBe(1);
  });

  it('AK-TR-21 Kulanz verbraucht die Fernsperre und bietet nichts an', () => {
    const w = quietLoyal(HOME, 3);
    w.farSkip = 2;
    const r = stepAt(w, periodStart(2));
    expect(w.farSkip).toBeNull();
    expect(w.order).toBeNull();
    expect(w.farOffer).toBeNull();
    expect(r.contract!.kind).toBe('excused');
  });

  it('AK-TR-22 Kündigen nach Kulanz kostet nichts, Neuabschluss beginnt bei 0', () => {
    const w = quietLoyal(HOME, 3);
    stepAt(w, periodStart(2));
    const m = w.money;
    expect(cancelContract(w).ok).toBe(true);
    expect(w.contract).toBeNull();
    expect(w.money).toBe(m);
    w.contractOffer = { good: 'rum', island: HOME };
    expect(acceptContract(w).ok).toBe(true);
    expect(w.contract!.deliveries).toBe(0);
  });

  it('AK-TR-12 Determinismus: Annehmen, N Lieferungen, Kulanz, Lieferung', () => {
    function script(reload: boolean): { w: World; excused: number } {
      let w = createWorld(7, { unlockAll: true });
      let excused = 0;
      w.contractOffer = { good: 'rum', island: HOME };
      expect(acceptContract(w).ok).toBe(true);
      for (let i = 1; i <= N + 2; i++) {
        home(w).stock.rum = i === N + 1 ? 3 : 60;
        const r = stepAt(w, periodStart(i + 1));
        if (r.contract?.kind === 'excused') excused++;
        if (reload) w = load(w);
      }
      return { w, excused };
    }
    const a = script(false);
    expect(a.excused).toBe(1);
    expect(serialize(script(false).w)).toBe(serialize(a.w));
    const b = script(true);
    expect(b.excused).toBe(1);
    expect(serialize(b.w)).toBe(serialize(a.w));
  });

  it('AK-TR-13b Laden mitten in der Periode ändert die Kulanz nicht', () => {
    const a = quietLoyal(HOME, 3);
    a.tick = periodStart(2) - 100;
    const b = load(a);
    const run = (w: World): StepReport => {
      let r = step(w);
      while (w.tick < periodStart(2)) r = step(w);
      return r;
    };
    expect(run(a).contract!.kind).toBe('excused');
    expect(run(b).contract!.kind).toBe('excused');
    expect(serialize(b)).toBe(serialize(a));
  });

  it.skipIf(!process.env.SCENARIO_OUT)('schreibt i091-kulanz.json', () => {
    const w = quietLoyal(HOME, 0);
    w.money = 5000;
    w.tick = periodStart(3) - 50;
    const json = serialize(w);
    expect(deserialize(json).ok).toBe(true);
    const copy = load(w);
    const kinds: string[] = [];
    while (copy.tick < periodStart(3)) {
      const c = step(copy).contract;
      if (c) kinds.push(c.kind);
    }
    expect(kinds).toEqual(['excused']);
    expect(copy.money).toBe(5000);
    const dir = process.env.SCENARIO_OUT!;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/i091-kulanz.json`, json);
  });
});
