import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONTRACT_MIN_TIER,
  CONTRACT_PENALTY_PCT,
  CONTRACT_PREMIUM,
  GOODS,
  GOOD_IDS,
  STORAGE_CAP,
} from '../../src/sim/defs/goods';
import { FUNCTION_ENTRY } from '../../src/sim/defs/unlocks';
import { ORDER_DURATION, ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { TIER_IDS } from '../../src/sim/defs/tiers';
import {
  acceptContract,
  cancelContract,
  contractPenalty,
  contractUnitPrice,
  declineContract,
  deliverOrder,
  maxHouseTier,
  nextOrderTick,
  orderForPeriod,
  orderUnitReward,
} from '../../src/sim/orders';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { StepReport } from '../../src/sim/tick';
import { buy } from '../../src/sim/trade';
import { HOME, createWorld, home } from '../../src/sim/world';
import { houseNearKontor, placeTownhall, setHouse } from './helpers';
import { startColony, runColony } from './controller';
import { foundKontor2Literal } from './seaHelpers';
import type { Contract, GoodId, Order, Tier, World } from '../../src/sim/types';

function load(w: World): World {
  const r = deserialize(serialize(w));
  if (!r.ok) throw new Error(r.reason);
  return r.world;
}

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

// ---- Regeln R1-R12 (T03) ----

const periodStart = (k: number): number => ORDER_FIRST_TICK + k * ORDER_PERIOD;

function base(tier: Tier = 3): World {
  const w = createWorld(3, { unlockAll: true });
  setHouse(houseNearKontor(w), tier, 1);
  return w;
}

function orderOf(w: World, good: GoodId, k = 0): Order {
  const amount = GOODS[good].order!.min;
  return {
    period: k,
    good,
    amount,
    reward: amount * orderUnitReward(good),
    due: periodStart(k) + ORDER_DURATION,
  };
}

/** Vergleichslauf: gleiche Welt, aber ohne Vertrag und ohne Angebot. */
function twin(w: World): World {
  const c = JSON.parse(JSON.stringify(w)) as World;
  c.contract = null;
  c.contractOffer = null;
  return c;
}

/** Setzt die Uhr so, dass der nächste Schritt auf Tick `t` fällt, und führt ihn aus. */
function stepAt(w: World, t: number): StepReport {
  w.tick = t - 1;
  return step(w);
}

const RUM = { good: 'rum', amount: 5, price: 27 } as const;
const rumContract = (island = HOME): Contract => ({ ...RUM, island });
const homeRum = (w: World): number => home(w).stock.rum;
const lockOrders = (w: World): void => {
  w.unlocked = w.unlocked.filter((u) => u !== FUNCTION_ENTRY.orders);
};

describe('R1 Angebot nach Lieferung (AK-SK-01..05)', () => {
  it('01 Stufe 3: Lieferung bietet Rum auf der Lieferinsel an', () => {
    const w = base();
    w.tick = periodStart(0) + 1;
    w.order = orderOf(w, 'rum');
    home(w).stock.rum = 10;
    expect(deliverOrder(w).ok).toBe(true);
    expect(w.contractOffer).toEqual({ good: 'rum', island: HOME });

    const v = base();
    foundKontor2Literal(v, 1);
    v.tick = periodStart(0) + 1;
    v.order = orderOf(v, 'rum');
    v.islands[1]!.stock.rum = 10;
    expect(deliverOrder(v, 1).ok).toBe(true);
    expect(v.contractOffer).toEqual({ good: 'rum', island: 1 });
  });

  it('02 Höchststufe 2: kein Angebot', () => {
    const w = base(2);
    w.tick = periodStart(0) + 1;
    w.order = orderOf(w, 'wood');
    home(w).stock.wood = 100;
    expect(deliverOrder(w).ok).toBe(true);
    expect(w.contractOffer).toBeNull();
  });

  it('03 zu wenig Ware: fail, Welt unverändert', () => {
    const w = base();
    w.tick = periodStart(0) + 1;
    w.order = orderOf(w, 'rum');
    home(w).stock.rum = 1;
    const before = serialize(w);
    expect(deliverOrder(w).ok).toBe(false);
    expect(serialize(w)).toBe(before);
  });

  it('04 Angebot gilt bis zum Periodenbeginn, dann Zufallsauftrag', () => {
    const w = base();
    w.tick = periodStart(1) - 300;
    w.order = orderOf(w, 'rum');
    home(w).stock.rum = 10;
    expect(deliverOrder(w).ok).toBe(true);
    while (w.tick < periodStart(1) - 1) {
      step(w);
      expect(w.contractOffer).not.toBeNull();
    }
    step(w);
    expect(w.contractOffer).toBeNull();
    const expected = orderForPeriod(w.seed, 1, maxHouseTier(w));
    expect(w.order).toMatchObject(expected);
  });

  it('05 laufender Vertrag: kein Angebot; Annehmen ohne Angebot scheitert', () => {
    const w = base();
    w.tick = periodStart(0) + 1;
    w.contract = rumContract();
    w.order = orderOf(w, 'rum');
    home(w).stock.rum = 10;
    expect(deliverOrder(w).ok).toBe(true);
    expect(w.contractOffer).toBeNull();
    expect(acceptContract(w)).toEqual({ ok: false, reason: 'Kein Angebot' });
  });
});

describe('R3/R4 Annehmen und Ablehnen (AK-SK-06..08)', () => {
  it('06 Ablehnen', () => {
    const w = base();
    expect(declineContract(w)).toEqual({ ok: false, reason: 'Kein Angebot' });
    w.contractOffer = { good: 'rum', island: HOME };
    const ref = twin(w);
    expect(declineContract(w).ok).toBe(true);
    expect(w.contractOffer).toBeNull();
    expect(serialize(w)).toBe(serialize(ref));
  });

  it('07 Annehmen schreibt Menge und Preis fest', () => {
    const w = base();
    w.contractOffer = { good: 'rum', island: HOME };
    expect(acceptContract(w).ok).toBe(true);
    expect(w.contract).toEqual(rumContract());
    expect(w.contractOffer).toBeNull();
    for (const g of ORDER_GOODS) {
      const v = base();
      v.contractOffer = { good: g, island: HOME };
      expect(acceptContract(v).ok).toBe(true);
      expect(v.contract).toEqual({
        good: g,
        amount: GOODS[g].order!.contract,
        price: contractUnitPrice(g),
        island: HOME,
      });
    }
  });

  it('08 Insel ohne Kontor und gesperrte Funktion', () => {
    const w = base();
    w.contractOffer = { good: 'rum', island: 1 };
    let before = serialize(w);
    const r = acceptContract(w);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/^Kein Kontor auf /);
    expect(serialize(w)).toBe(before);

    const v = base();
    v.contractOffer = { good: 'rum', island: HOME };
    lockOrders(v);
    before = serialize(v);
    expect(acceptContract(v).ok).toBe(false);
    expect(serialize(v)).toBe(before);
  });
});

describe('R6/R7 Periodenbeginn mit Vertrag (AK-SK-09..17)', () => {
  const T = periodStart(2);
  const withRum = (n: number, island = HOME): World => {
    const w = base();
    if (island !== HOME) foundKontor2Literal(w, island);
    w.contract = rumContract(island);
    w.islands[island]!.stock.rum = n;
    w.money = 1000;
    return w;
  };

  it('09 Lieferung: Lager minus Menge, Geld plus Wert, kein Zufallsauftrag', () => {
    const w = withRum(12);
    const ref = twin(w);
    w.tick = T - 1;
    ref.tick = T - 1;
    const report = step(w);
    step(ref);
    expect(homeRum(w)).toBe(homeRum(ref) - 5);
    expect(w.money).toBe(ref.money + 135);
    expect(w.order).toBeNull();
    expect(w.contract).toEqual(rumContract());
    expect(report.contract).toEqual({
      kind: 'delivered',
      good: 'rum',
      amount: 5,
      pay: 135,
      island: HOME,
    });
    const mid = withRum(12);
    const mref = twin(mid);
    mid.tick = T;
    mref.tick = T;
    step(mid);
    step(mref);
    expect(mid.money).toBe(mref.money);
    expect(homeRum(mid)).toBe(homeRum(mref));
  });

  it('09 Inselfall: Lieferung aus dem Lager der Vertragsinsel', () => {
    const w = withRum(12, 1);
    home(w).stock.rum = 0;
    const ref = twin(w);
    stepAt(w, T);
    stepAt(ref, T);
    expect(w.islands[1]!.stock.rum).toBe(ref.islands[1]!.stock.rum - 5);
    expect(homeRum(w)).toBe(homeRum(ref));
  });

  it('10 Lager genau gleich Menge: Lieferung', () => {
    const w = withRum(5);
    const ref = twin(w);
    stepAt(w, T);
    stepAt(ref, T);
    expect(homeRum(w)).toBe(homeRum(ref) - 5);
    expect(w.contract).not.toBeNull();
  });

  it('11 Boom, Edikt und Gütersperre ändern die Zahlung nicht', () => {
    const w = withRum(12);
    w.crisis = { period: 0, kind: 'boom', from: 0, until: 99999, good: 'rum' };
    w.edict = 'trade';
    w.goodLocks = [{ tier: 3, good: 'rum' }];
    const ref = twin(w);
    const sell = { ...w.sellPct };
    const r = stepAt(w, T);
    stepAt(ref, T);
    expect(r.contract).toMatchObject({ kind: 'delivered', pay: 135 });
    expect(w.sellPct).toEqual(sell);
    expect(w.money).toBe(ref.money + 135);
  });

  it('12 Lager 0: Bruch mit Strafe, Zufallsauftrag, kein Angebot', () => {
    const w = withRum(0);
    const ref = twin(w);
    const r = stepAt(w, T);
    stepAt(ref, T);
    expect(w.money).toBe(ref.money - 135);
    expect(w.contract).toBeNull();
    expect(w.contractOffer).toBeNull();
    expect(w.order).toMatchObject(orderForPeriod(w.seed, 2, maxHouseTier(w)));
    expect(r.contract).toEqual({
      kind: 'broken',
      good: 'rum',
      reason: 'stock',
      penalty: 135,
      island: HOME,
    });
  });

  it('13 Lager 4: Bruch, Bestand bleibt', () => {
    const w = withRum(4);
    const ref = twin(w);
    stepAt(w, T);
    stepAt(ref, T);
    expect(homeRum(w)).toBe(homeRum(ref));
    expect(w.contract).toBeNull();
  });

  it('14 Kontor der Vertragsinsel fehlt: Bruch (kontor)', () => {
    const w = withRum(12, 1);
    w.islands[1]!.kontorId = null;
    const ref = twin(w);
    const r = stepAt(w, T);
    stepAt(ref, T);
    expect(r.contract).toMatchObject({ kind: 'broken', reason: 'kontor' });
    expect(w.islands[1]!.stock.rum).toBe(ref.islands[1]!.stock.rum);
  });

  it('15 gesperrte Funktion: Bruch (lock); Kündigen bleibt möglich', () => {
    const w = withRum(0);
    lockOrders(w);
    expect(stepAt(w, T).contract).toMatchObject({ kind: 'broken', reason: 'lock' });
    const v = withRum(0);
    lockOrders(v);
    const money = v.money;
    expect(cancelContract(v).ok).toBe(true);
    expect(v.money).toBe(money);
  });

  it('16 negatives Geld: Strafe voll, Lieferung zahlt', () => {
    const w = withRum(0);
    w.money = -50;
    const ref = twin(w);
    stepAt(w, T);
    stepAt(ref, T);
    expect(w.money).toBe(ref.money - 135);
    expect(w.money).toBeLessThan(0);
    const v = withRum(12);
    v.money = -50;
    const vref = twin(v);
    stepAt(v, T);
    stepAt(vref, T);
    expect(v.money).toBe(vref.money + 135);
  });

  it('Bruchgrund-Priorität: lock > island > kontor > stock', () => {
    const reasonOf = (w: World): string | undefined => {
      const r = stepAt(w, T).contract;
      return r?.kind === 'broken' ? r.reason : undefined;
    };
    const lockIsland = withRum(0);
    lockIsland.contract = { ...rumContract(), island: lockIsland.islands.length };
    lockOrders(lockIsland);
    expect(reasonOf(lockIsland)).toBe('lock');

    const lockStock = withRum(0);
    lockOrders(lockStock);
    expect(reasonOf(lockStock)).toBe('lock');

    const islandStock = withRum(0);
    islandStock.contract = { ...rumContract(), island: islandStock.islands.length };
    expect(reasonOf(islandStock)).toBe('island');

    const kontorStock = withRum(0, 1);
    kontorStock.islands[1]!.kontorId = null;
    expect(reasonOf(kontorStock)).toBe('kontor');
  });

  it('17 Strafe aller Auftragsgüter', () => {
    for (const g of ORDER_GOODS) {
      const w = base();
      const m = GOODS[g].order!.contract;
      const p = contractUnitPrice(g);
      w.contract = { good: g, amount: m, price: p, island: HOME };
      home(w).stock[g] = 0;
      const r = stepAt(w, T);
      expect(r.contract).toMatchObject({
        kind: 'broken',
        penalty: Math.ceil((m * p * CONTRACT_PENALTY_PCT) / 100),
      });
    }
  });
});

describe('R5/R10 Kündigen und Reihenfolge (AK-SK-18..20)', () => {
  const T = periodStart(2);

  it('18 Kündigen mitten in der Periode; Insel ausserhalb bricht ohne Wurf', () => {
    const w = base();
    expect(cancelContract(w)).toEqual({ ok: false, reason: 'Kein Vertrag' });
    w.tick = T - 400;
    w.contract = rumContract();
    const money = w.money;
    expect(cancelContract(w).ok).toBe(true);
    expect(w.money).toBe(money);
    expect(w.order).toBeNull();
    stepAt(w, T);
    expect(w.order).toMatchObject(orderForPeriod(w.seed, 2, maxHouseTier(w)));

    const v = base();
    v.contract = { ...rumContract(), island: v.islands.length };
    const ref = twin(v);
    const r = stepAt(v, T);
    stepAt(ref, T);
    expect(r.contract).toMatchObject({ kind: 'broken', reason: 'island' });
    expect(v.money).toBe(ref.money - 135);
  });

  it('19 Kündigen vor und nach dem Periodenbeginn', () => {
    const w = base();
    w.contract = rumContract();
    home(w).stock.rum = 50;
    w.tick = T - 1;
    const ref = twin(w);
    ref.tick = T - 1;
    expect(cancelContract(w).ok).toBe(true);
    step(w);
    step(ref);
    expect(w.money).toBe(ref.money);
    expect(homeRum(w)).toBe(homeRum(ref));
    expect(w.order).not.toBeNull();

    const v = base();
    v.contract = rumContract();
    home(v).stock.rum = 50;
    const vref = twin(v);
    stepAt(v, T);
    stepAt(vref, T);
    expect(cancelContract(v).ok).toBe(true);
    expect(v.money).toBe(vref.money + 135);
    expect(homeRum(v)).toBe(homeRum(vref) - 5);
    expect(nextOrderTick(v)).toBe(T + ORDER_PERIOD);
    expect(v.order).toBeNull();
  });

  it('20 Stufenabstieg nach dem Annehmen beendet den Vertrag nicht', () => {
    const w = base(3);
    w.contractOffer = { good: 'rum', island: HOME };
    expect(acceptContract(w).ok).toBe(true);
    for (const b of Object.values(w.buildings)) if (b.house) b.house.tier = 2;
    home(w).stock.rum = 12;
    const ref = twin(w);
    stepAt(w, T);
    stepAt(ref, T);
    expect(homeRum(w)).toBe(homeRum(ref) - 5);
    expect(w.contract).not.toBeNull();
  });
});

describe('Determinismus (AK-SK-24)', () => {
  /** Liefern, Annehmen, fünf Perioden, Lager leeren, Bruch, neuer Auftrag, Annehmen, Kündigen. */
  function script(w: World, reload: boolean): World {
    const maybeReload = (x: World): World => (reload ? load(x) : x);
    let x = w;
    x.tick = periodStart(0) + 1;
    x.order = orderOf(x, 'rum');
    home(x).stock.rum = 40;
    expect(deliverOrder(x).ok).toBe(true);
    expect(acceptContract(x).ok).toBe(true);
    x = maybeReload(x);
    while (x.tick < periodStart(2) + 1) step(x);
    x = maybeReload(x);
    while (x.tick < periodStart(5) - 1) step(x);
    home(x).stock.rum = 0;
    step(x);
    expect(x.contract).toBeNull();
    x.order = orderOf(x, 'rum', 5);
    home(x).stock.rum = 40;
    expect(deliverOrder(x).ok).toBe(true);
    expect(acceptContract(x).ok).toBe(true);
    x = maybeReload(x);
    while (x.tick < periodStart(6) - 1) step(x);
    expect(cancelContract(x).ok).toBe(true);
    step(x);
    return x;
  }

  it('24 gleiche Folge, bitgleich; Speichern und Laden mitten im Lauf ändert nichts', () => {
    const outA = serialize(script(base(), false));
    expect(serialize(script(base(), false))).toBe(outA);
    expect(serialize(script(base(), true))).toBe(outA);
  });

  it('24b Zufallsauftrag nach einem Vertrag ist der zustandslose Auftrag der Periode', () => {
    const w = base();
    w.contract = rumContract();
    home(w).stock.rum = 0;
    stepAt(w, periodStart(3));
    expect(w.order).toMatchObject(orderForPeriod(w.seed, 3, maxHouseTier(w)));
  });
});

describe('AK-SK-25 Controller lässt Verträge unberührt', () => {
  it('Controller-Lauf sieht nie Vertrag oder Angebot', () => {
    const w = createWorld(3);
    const { layout, t } = startColony(w);
    let seen = 0;
    runColony(w, layout, t, {}, (x) => {
      if (x.contract !== null || x.contractOffer !== null) seen++;
      return false;
    });
    expect(seen).toBe(0);
    expect(w.contract).toBeNull();
    expect(w.contractOffer).toBeNull();
    const src = readFileSync('tests/sim/controller.ts', 'utf8');
    expect(src).not.toContain('deliverOrder');
    expect(src).not.toContain('acceptContract');
  }, 10_000);
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
      const afterBuy = w.money;
      w.contract = { good: g, amount: m, price: contractUnitPrice(g), island: HOME };
      const ref = twin(w);
      stepAt(w, periodStart(0));
      stepAt(ref, periodStart(0));
      expect(w.money - ref.money).toBe(m * contractUnitPrice(g));
      const loss = before - afterBuy - (w.money - ref.money);
      expect(loss).toBeGreaterThanOrEqual(24);
      expect(loss).toBeLessThanOrEqual(46);
    });
  }
});
