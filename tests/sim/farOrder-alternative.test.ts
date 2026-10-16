// I-114 T01: zweites Fernangebot zur Wahl (farAlternative, acceptFarOrder mit pick), AK-1 bis AK-9.
import { describe, expect, it } from 'vitest';
import { GOODS } from '../../src/sim/defs/goods';
import { FAR_ORDER_DURATION, ORDER_DURATION } from '../../src/sim/defs/timing';
import { FUNCTION_ENTRY } from '../../src/sim/defs/unlocks';
import {
  acceptFarOrder,
  farAlternative,
  farEligible,
  farGood,
  orderUnitReward,
} from '../../src/sim/orders';
import { SAVE_VERSION, deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { dropKontor, farWorld, islandOf, periodStart, stepAt } from './farHelpers';
import { foundKontor2Literal } from './seaHelpers';

const P = periodStart(1);

/** Welt mit Kontoren A und B (Seed 3, Stufe 4), Fernangebot der Periode 1 liegt. */
function offerWorld(kinds: Parameters<typeof farWorld>[1] = ['A', 'B']): World {
  const w = farWorld(4, kinds);
  stepAt(w, P);
  return w;
}

describe('AK-1 Zweitkarte folgt der Rotation', () => {
  it('e[(k+1) mod n], Formelwerte, andere Insel als das Erstangebot', () => {
    const w = offerWorld();
    const e = farEligible(w);
    expect(e).toHaveLength(2);
    const alt = farAlternative(w)!;
    const island = e[(w.order!.period + 1) % e.length]!;
    const good = farGood(w, island)!;
    const amount = GOODS[good].order!.far!;
    expect(alt).toEqual({ island, good, amount, reward: amount * orderUnitReward(good) });
    expect(alt.island).not.toBe(w.farOffer!.island);
  });
  it('drei Kontore: nie die Erstinsel', () => {
    const w = offerWorld(['A', 'B', 'C']);
    const e = farEligible(w);
    expect(e).toHaveLength(3);
    expect(farAlternative(w)!.island).toBe(e[(w.order!.period + 1) % 3]);
    expect(farAlternative(w)!.island).not.toBe(w.farOffer!.island);
  });
});

describe('AK-2 keine Zweitkarte', () => {
  it('bei nur einem Kontor', () => {
    expect(farAlternative(offerWorld(['B']))).toBeNull();
  });
  it('ohne Angebot', () => {
    const w = offerWorld();
    w.farOffer = null;
    expect(farAlternative(w)).toBeNull();
  });
  it('ohne Auftrag', () => {
    const w = offerWorld();
    w.order = null;
    expect(farAlternative(w)).toBeNull();
  });
  it('bei Vertrag', () => {
    const w = offerWorld();
    w.contract = { good: 'wood', amount: 1, price: 1, island: 0, deliveries: 0 };
    expect(farAlternative(w)).toBeNull();
  });
  it('bei Sperre', () => {
    const w = offerWorld();
    w.unlocked = w.unlocked.filter((u) => u !== FUNCTION_ENTRY.orders);
    expect(farAlternative(w)).toBeNull();
  });
  it('bei Fernauftrag', () => {
    const w = offerWorld();
    expect(acceptFarOrder(w).ok).toBe(true);
    expect(farAlternative(w)).toBeNull();
  });
});

describe('AK-3 reine Lesefunktion', () => {
  it('Welt vorher und nachher gleich', () => {
    const w = offerWorld();
    const before = JSON.stringify(w);
    expect(farAlternative(w)).not.toBeNull();
    expect(JSON.stringify(w)).toBe(before);
  });
});

describe('AK-4 Standardwahl bleibt bitgleich', () => {
  it('acceptFarOrder(w) gleich acceptFarOrder(w, 0)', () => {
    const a = offerWorld();
    const b = structuredClone(a);
    expect(acceptFarOrder(a)).toEqual(acceptFarOrder(b, 0));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

describe('AK-5 Zweitkarte annehmen', () => {
  it('Auftrag der Zweitkarte, due, Angebot weg, Sperre', () => {
    const w = offerWorld();
    const alt = farAlternative(w)!;
    const money = w.money;
    expect(acceptFarOrder(w, 1)).toEqual({ ok: true });
    expect(w.order).toEqual({
      period: 1,
      good: alt.good,
      amount: alt.amount,
      reward: alt.reward,
      due: P + FAR_ORDER_DURATION,
      island: alt.island,
    });
    expect(w.farOffer).toBeNull();
    expect(w.farSkip).toBe(2);
    expect(w.money).toBe(money);
  });
});

describe('AK-6 Fehlfälle bei pick 1', () => {
  it('ohne Zweitangebot: Grund, Welt unverändert', () => {
    const w = offerWorld(['B']);
    const snap = serialize(w);
    expect(acceptFarOrder(w, 1)).toEqual({ ok: false, reason: 'Kein zweites Angebot' });
    expect(serialize(w)).toBe(snap);
  });
  it('Zweitinsel abgerissen: kein Kontor-Handel, Welt unverändert', () => {
    const w = offerWorld();
    dropKontor(w, farAlternative(w)!.island);
    const snap = serialize(w);
    expect(acceptFarOrder(w, 1)).toEqual({ ok: false, reason: 'Kein zweites Angebot' });
    expect(serialize(w)).toBe(snap);
  });
});

describe('AK-7 Kontor nach dem Angebot gegründet (Drift)', () => {
  it('Gleich-Insel-Guard: Rotation fällt wieder auf die Erstinsel, keine Zweitkarte', () => {
    const w = offerWorld(['A', 'C']);
    expect(w.farOffer!.island).toBe(islandOf(w, 'C'));
    expect(farAlternative(w)!.island).toBe(islandOf(w, 'A'));
    foundKontor2Literal(w, islandOf(w, 'B'));
    const e = farEligible(w);
    expect(e).toHaveLength(3);
    expect(e[(w.order!.period + 1) % e.length]).toBe(w.farOffer!.island);
    expect(farAlternative(w)).toBeNull();
    const snap = serialize(w);
    expect(acceptFarOrder(w, 1)).toEqual({ ok: false, reason: 'Kein zweites Angebot' });
    expect(serialize(w)).toBe(snap);
  });
  it('Zweitkarte folgt der neuen Rotation, Erstangebot bleibt', () => {
    const w = offerWorld(['A', 'B']);
    const first = structuredClone(w.farOffer);
    expect(first!.island).toBe(islandOf(w, 'B'));
    expect(farAlternative(w)!.island).toBe(islandOf(w, 'A'));
    foundKontor2Literal(w, islandOf(w, 'C'));
    const alt = farAlternative(w)!;
    expect(alt.island).toBe(islandOf(w, 'C'));
    expect(w.farOffer).toEqual(first);
    expect(acceptFarOrder(w, 1)).toEqual({ ok: true });
    expect(w.order!.island).toBe(islandOf(w, 'C'));
    expect(w.order!.good).toBe(alt.good);
  });
});

describe('AK-8 deterministisch, ohne RNG', () => {
  it('gleiche Eingaben, gleicher Zustand für pick 0 und 1', () => {
    for (const pick of [0, 1] as const) {
      const a = offerWorld();
      const b = offerWorld();
      expect(acceptFarOrder(a, pick)).toEqual(acceptFarOrder(b, pick));
      expect(serialize(a)).toBe(serialize(b));
    }
  });
  it('rng-Zustand durch farAlternative unverändert', () => {
    const w = offerWorld();
    const a = structuredClone(w);
    farAlternative(w);
    for (let n = 0; n < 50; n++) {
      step(a);
      step(w);
    }
    expect(serialize(w)).toBe(serialize(a));
  });
});

describe('AK-9 Save unverändert', () => {
  it('Save unverändert (Version >= 16), Roundtrip mit offenem Fernangebot', () => {
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(16);
    const w = createWorld(3, { unlockAll: true });
    w.tick = P + 10;
    w.order = { period: 1, good: 'wood', amount: 20, reward: 20, due: P + ORDER_DURATION };
    w.farOffer = { island: islandOf(w, 'B'), good: 'rum', amount: 15, reward: 450 };
    const s = serialize(w);
    const r = deserialize(s);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(serialize(r.world)).toBe(s);
  });
});
