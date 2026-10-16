import { describe, expect, it } from 'vitest';
import { GOODS, GOOD_IDS } from '../../src/sim/defs/goods';
import { SHIP } from '../../src/sim/defs/sea';
import { UPKEEP_INTERVAL } from '../../src/sim/defs/timing';
import { goodsBalance } from '../../src/sim/flow';
import { laneTicks } from '../../src/sim/islands';
import { routeBalance } from '../../src/sim/routeBalance';
import type { GoodId, Route, World } from '../../src/sim/types';
import { foundKontor2Literal, seaWorld } from './seaHelpers';

type Balances = Map<number, ReturnType<typeof goodsBalance>>;

function twoIslands(): World {
  const w = seaWorld();
  foundKontor2Literal(w, 1);
  return w;
}

/** Bilanz mit vorgegebenem Netto je Gut (Rest 0); steuert den Überschuss ohne Betriebsaufbau. */
function balanceWith(net: Partial<Record<GoodId, number>>): ReturnType<typeof goodsBalance> {
  const out = {} as ReturnType<typeof goodsBalance>;
  for (const g of GOOD_IDS) out[g] = { produced: net[g] ?? 0, consumed: 0, net: net[g] ?? 0 };
  return out;
}

const route = (ab: GoodId[], ba: GoodId[]): Route => ({
  a: 0,
  b: 1,
  ab: ab.map((good) => ({ good, reserve: 0 })),
  ba: ba.map((good) => ({ good, reserve: 0 })),
});

const cycle = (w: World): number => laneTicks(w.islands, 0, 1) + laneTicks(w.islands, 1, 0);
const BIG = 1_000_000;

describe('I-103 routeBalance', () => {
  it('AK-B1 ein Gut je Richtung, grosser Überschuss: Kapazität je Richtung', () => {
    const w = twoIslands();
    const bal: Balances = new Map([
      [0, balanceWith({ wood: BIG })],
      [1, balanceWith({ spice: BIG })],
    ]);
    const r = routeBalance(w, route(['wood'], ['spice']), bal)!;
    const T = cycle(w);
    const value = SHIP.capacity * GOODS.wood.sell + SHIP.capacity * GOODS.spice.sell;
    expect(r.cycleTicks).toBe(T);
    expect(r.goodsPer100).toBe((value * 100) / T);
  });

  it('AK-B2 zwei Güter einer Richtung teilen die Kapazität', () => {
    const w = twoIslands();
    const bal: Balances = new Map([
      [0, balanceWith({ wood: BIG, stone: BIG })],
      [1, balanceWith({})],
    ]);
    const r = routeBalance(w, route(['wood', 'stone'], []), bal)!;
    const q = Math.floor(SHIP.capacity / 2);
    const value = q * GOODS.wood.sell + q * GOODS.stone.sell;
    expect(r.goodsPer100).toBe((value * 100) / cycle(w));
  });

  it('AK-B3 Überschuss 0 oder negativ: Menge 0, Bilanz = -Unterhalt', () => {
    const w = twoIslands();
    const bal: Balances = new Map([
      [0, balanceWith({ wood: 0, stone: -5 })],
      [1, balanceWith({ spice: -1 })],
    ]);
    const r = routeBalance(w, route(['wood', 'stone'], ['spice']), bal)!;
    expect(r.goodsPer100).toBe(0);
    expect(r.net100).toBe(-SHIP.upkeep);
  });

  it('AK-B4 kleiner Überschuss deckelt die Menge auf ⌊net × T ÷ 100⌋', () => {
    const w = twoIslands();
    const T = cycle(w);
    const net = 0.7;
    const q = Math.floor((net * T) / 100);
    expect(q).toBeGreaterThan(0);
    expect(q).toBeLessThan(SHIP.capacity);
    const bal: Balances = new Map([
      [0, balanceWith({ wood: net })],
      [1, balanceWith({})],
    ]);
    const r = routeBalance(w, route(['wood'], []), bal)!;
    expect(r.goodsPer100).toBe((q * GOODS.wood.sell * 100) / T);
  });

  it('AK-B5a Unterhalt je 100 Ticks und Netto', () => {
    const w = twoIslands();
    const bal: Balances = new Map([
      [0, balanceWith({ wood: BIG })],
      [1, balanceWith({})],
    ]);
    const r = routeBalance(w, route(['wood'], []), bal)!;
    expect(r.upkeepPer100).toBe(SHIP.upkeep);
    expect(UPKEEP_INTERVAL).toBe(100);
    expect(r.net100).toBe(r.goodsPer100 - r.upkeepPer100);
  });

  it('AK-B6 schreibt nie in die Welt, Memo ändert das Ergebnis nicht, ein Eintrag je Quellinsel', () => {
    const w = twoIslands();
    const rt = route(['wood'], ['spice']);
    const before = JSON.stringify(w);
    const memo: Balances = new Map();
    const first = routeBalance(w, rt, memo);
    expect(memo.size).toBe(2);
    expect([...memo.keys()].sort()).toEqual([0, 1]);
    const second = routeBalance(w, rt, memo);
    const fresh = routeBalance(w, rt);
    expect(second).toEqual(first);
    expect(fresh).toEqual(first);
    expect(JSON.stringify(w)).toBe(before);
  });

  it('Z1 ohne Lane: null, kein Wurf', () => {
    const w = twoIslands();
    const rt: Route = { ...route(['wood'], []), b: 99 };
    expect(() => routeBalance(w, rt)).not.toThrow();
    expect(routeBalance(w, rt)).toBeNull();
  });
});
