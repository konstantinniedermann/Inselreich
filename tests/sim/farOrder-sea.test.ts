// Handel 2 T06: Fristbeleg auf realen Seewegen Seed 3 und Folge-Insel Seed 963 (AK-H2-27, AK-H2-31).
import { describe, expect, it } from 'vitest';
import { ISLANDS, SHIP_TICKS_PER_SEA_TILE } from '../../src/sim/defs/sea';
import type { IslandKind } from '../../src/sim/defs/sea';
import { FAR_ORDER_DURATION } from '../../src/sim/defs/timing';
import { laneTicks } from '../../src/sim/islands';
import { acceptFarOrder, deliverOrder, farGood } from '../../src/sim/orders';
import { buyShip, setRoute, updateRoute } from '../../src/sim/ships';
import { step } from '../../src/sim/tick';
import type { GoodId, World } from '../../src/sim/types';
import { HOME, home } from '../../src/sim/world';
import { farWorld, islandOf, periodStart, stepAt } from './farHelpers';

/** Gemessen in T01 (siehe farOrder-defs.test.ts): Möweninsel (A), Felsbucht (B), Weidenau (C). */
const SEED3_LANES = { A: 260, B: 390, C: 310 };
const P = periodStart(1);

/** Welt mit Fremdkontor `kind`, Periode 1 angeboten, Schiff gekauft, Tick P + 600. */
function seaSetup(kind: IslandKind): { w: World; i: number; good: GoodId; L: number; id: number } {
  const w = farWorld(4, [kind]);
  const i = islandOf(w, kind);
  const L = laneTicks(w.islands, 0, i);
  expect(L).toBe(SEED3_LANES[kind]);
  const good = farGood(w, i)!;
  home(w).stock[good] = 50;
  w.islands[i]!.stock[good] = 0;
  w.money = 1_000_000;
  home(w).stock.wood = 100;
  home(w).stock.tools = 100;
  stepAt(w, P);
  while (w.tick < P + 600) step(w);
  expect(buyShip(w)).toEqual({ ok: true });
  return { w, i, good, L, id: w.ships[0]!.id };
}

/** Schritte bis das Inselager `amount` erreicht; liefert den Tick. */
function tickOfArrival(w: World, i: number, good: GoodId): number {
  const need = w.order!.amount;
  for (let n = 0; n < 3000; n++) {
    step(w);
    if (w.islands[i]!.stock[good] >= need) return w.tick;
  }
  throw new Error('Ware kam nie an');
}

describe('AK-H2-27 Fristbeleg Seed 3', () => {
  for (const kind of ['A', 'B', 'C'] as const) {
    it(`Fall A ${kind}: Schiff nach Hause unterwegs, Ware nach 2 * L`, () => {
      const { w, i, good, L, id } = seaSetup(kind);
      expect(HOME).toBe(0);
      expect(setRoute(w, id, { a: 0, b: i, ab: [{ good, reserve: 0 }], ba: [] }).ok).toBe(true);
      Object.assign(w.ships[0]!, { port: i, to: 0, left: L, cargo: {} });
      expect(acceptFarOrder(w)).toEqual({ ok: true });
      const t = tickOfArrival(w, i, good);
      expect(t).toBe(P + 600 + 2 * L);
      expect(t).toBeLessThanOrEqual(P + FAR_ORDER_DURATION);
      expect(deliverOrder(w, i)).toEqual({ ok: true });
    });

    it(`Fall B ${kind}: Schiff verlässt Heimat leer, Ware nach 3 * L`, () => {
      const { w, i, good, L, id } = seaSetup(kind);
      const ba = [{ good: 'spice' as GoodId, reserve: 0 }];
      expect(setRoute(w, id, { a: 0, b: i, ab: [], ba }).ok).toBe(true);
      Object.assign(w.ships[0]!, { port: 0, to: i, left: L, cargo: {} });
      expect(acceptFarOrder(w)).toEqual({ ok: true });
      const upd = updateRoute(w, id, { a: 0, b: i, ab: [{ good, reserve: 0 }], ba });
      expect(upd.ok).toBe(true);
      const t = tickOfArrival(w, i, good);
      expect(t).toBe(P + 600 + 3 * L);
      // Felsbucht (B) darf die Frist verfehlen (O-4); A und C halten sie.
      expect(t <= P + FAR_ORDER_DURATION).toBe(kind !== 'B');
    });
  }
});

describe('AK-H2-31 Folge-Insel und zwei Kontore', () => {
  it('(a) Seed 963, Stufe 3: Insel C weiter als dMax, Frist trotzdem 1700', () => {
    const w = farWorld(4, ['C'], 963);
    const C = islandOf(w, 'C');
    const dMax = ISLANDS.find((d) => d.kind === 'C')!.dMax;
    expect(laneTicks(w.islands, 0, C) / SHIP_TICKS_PER_SEA_TILE).toBeGreaterThan(dMax);
    stepAt(w, P);
    expect(w.farOffer).toEqual({ island: C, good: 'glass', amount: 12, reward: 444 });
    expect(acceptFarOrder(w)).toEqual({ ok: true });
    expect(w.order!.due).toBe(P + FAR_ORDER_DURATION);

    const win = structuredClone(w);
    win.islands[C]!.stock.glass = 12;
    const before = win.money;
    expect(deliverOrder(win, C)).toEqual({ ok: true });
    expect(win.money).toBe(before + 444);

    const ref = structuredClone(w);
    ref.order = null;
    const m = w.money;
    const mRef = ref.money;
    stepAt(w, P + FAR_ORDER_DURATION + 1);
    stepAt(ref, P + FAR_ORDER_DURATION + 1);
    expect(w.order).toBeNull();
    expect(w.money - m).toBe(ref.money - mRef);
  });

  it('(b) Seed 3, Kontore A und B: Lieferung nur auf Felsbucht', () => {
    const w = farWorld(3, ['A', 'B']);
    const A = islandOf(w, 'A');
    const B = islandOf(w, 'B');
    stepAt(w, P);
    expect(w.farOffer).toMatchObject({ island: B, good: 'rum', amount: 15 });
    expect(acceptFarOrder(w)).toEqual({ ok: true });
    w.money = 1_000_000;
    home(w).stock.wood = 100;
    home(w).stock.tools = 100;
    w.islands[A]!.stock.rum = 15;
    expect(buyShip(w)).toEqual({ ok: true });
    const id = w.ships[0]!.id;
    expect(setRoute(w, id, { a: A, b: B, ab: [{ good: 'rum', reserve: 0 }], ba: [] }).ok).toBe(
      true,
    );
    Object.assign(w.ships[0]!, { port: A, to: null, left: 0 });
    expect(deliverOrder(w, A)).toEqual({ ok: false, reason: 'Nur auf Felsbucht' });
    for (let n = 0; n < 3000 && w.islands[B]!.stock.rum < 15; n++) step(w);
    expect(w.islands[B]!.stock.rum).toBeGreaterThanOrEqual(15);
    expect(deliverOrder(w, B)).toEqual({ ok: true });
  });
});
