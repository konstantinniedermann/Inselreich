// Handel 2 T06: gesperrte Folgeperiode, nextOrderTick, Rundreise und Determinismus (AK-H2-16 bis 19, 23).
import { describe, expect, it } from 'vitest';
import { FAR_ORDER_DURATION, ORDER_DURATION, ORDER_PERIOD } from '../../src/sim/defs/timing';
import {
  acceptContract,
  acceptFarOrder,
  contractPenalty,
  deliverOrder,
  maxHouseTier,
  nextOrderTick,
  orderForPeriod,
} from '../../src/sim/orders';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { farWorld, islandOf, periodStart, stepAt } from './farHelpers';

const P = periodStart(1);

/** Welt mit angenommenem Fernauftrag Rum nach Felsbucht (Periode 1). */
function acceptedWorld(): World {
  const w = farWorld(3, ['B']);
  stepAt(w, P);
  expect(acceptFarOrder(w)).toEqual({ ok: true });
  return w;
}

/** Früh geliefert (Tick P + 100); Rum bleibt nach Lieferung bei `rest` auf B. */
function earlyDelivered(rest = 0): World {
  const w = acceptedWorld();
  const B = islandOf(w, 'B');
  w.islands[B]!.stock.rum = 15 + rest;
  stepAt(w, P + 100);
  expect(deliverOrder(w, B)).toEqual({ ok: true });
  return w;
}

describe('AK-H2-16 Fernauftrag trägt über die gesperrte Periode', () => {
  it('Auftrag bleibt, kein Angebot, Frist P + 1700, Periode 3 normal', () => {
    const w = acceptedWorld();
    const B = islandOf(w, 'B');
    stepAt(w, periodStart(2));
    expect(w.order?.island).toBe(B);
    expect(w.farOffer).toBeNull();
    expect(w.farSkip).toBeNull();

    stepAt(w, P + FAR_ORDER_DURATION);
    const copy = structuredClone(w);
    copy.islands[B]!.stock.rum = 15;
    expect(deliverOrder(copy, B)).toEqual({ ok: true });

    stepAt(w, P + FAR_ORDER_DURATION + 1);
    expect(w.order).toBeNull();

    stepAt(w, periodStart(3));
    expect(w.order).toEqual({
      period: 3,
      ...orderForPeriod(3, 3, maxHouseTier(w)),
      due: periodStart(3) + ORDER_DURATION,
    });
    expect(w.farOffer).not.toBeNull();
  });
});

describe('AK-H2-17 früh geliefert, Folgeperiode bleibt gesperrt', () => {
  it('nextOrderTick überspringt die Sperre, Periode 3 bietet an', () => {
    const w = earlyDelivered();
    expect(nextOrderTick(w)).toBe(periodStart(3));
    stepAt(w, periodStart(2));
    expect(w.order).toBeNull();
    expect(w.farOffer).toBeNull();
    expect(w.farSkip).toBeNull();
    stepAt(w, periodStart(3));
    expect(w.order).toMatchObject({ period: 3 });
  });
});

describe('AK-H2-18 Vertrag nach früher Lieferung', () => {
  it('Bruch in der gesperrten Periode: Strafe, kein Auftrag, kein Angebot', () => {
    const w = earlyDelivered();
    expect(w.contractOffer).not.toBeNull();
    expect(acceptContract(w)).toEqual({ ok: true });
    const c = w.contract!;
    expect(w.islands[islandOf(w, 'B')]!.stock.rum).toBe(0);
    const ref = structuredClone(w);
    ref.contract = null;
    const r = stepAt(w, periodStart(2));
    stepAt(ref, periodStart(2));
    expect(r.contract).toMatchObject({ kind: 'broken', penalty: contractPenalty(c) });
    expect(w.money).toBe(ref.money - contractPenalty(c));
    expect(w.order).toBeNull();
    expect(w.farOffer).toBeNull();
    stepAt(w, periodStart(3));
    expect(w.order).toMatchObject({ period: 3 });
  });

  it('genug Rum: Lieferung wie I-047', () => {
    const w = earlyDelivered(100);
    expect(acceptContract(w)).toEqual({ ok: true });
    const r = stepAt(w, periodStart(2));
    expect(r.contract).toMatchObject({ kind: 'delivered' });
    expect(w.order).toBeNull();
    expect(w.farOffer).toBeNull();
  });
});

describe('AK-H2-19 Rundreise Speichern und Laden', () => {
  const states: [string, () => World][] = [
    [
      '1 offenes Fernangebot',
      () => {
        const w = farWorld(3, ['B']);
        stepAt(w, P);
        expect(w.farOffer).not.toBeNull();
        return w;
      },
    ],
    ['2 laufender Fernauftrag', acceptedWorld],
    [
      '3 farSkip nach früher Lieferung',
      () => {
        const w = earlyDelivered();
        expect(w.farSkip).toBe(2);
        return w;
      },
    ],
    [
      '4 A3 farSkip und Vertrag',
      () => {
        const w = earlyDelivered(100);
        acceptContract(w);
        stepAt(w, P + 500);
        expect(w.farSkip).toBe(2);
        expect(w.contract).not.toBeNull();
        return w;
      },
    ],
    [
      '5 A3 Vertrag mitten in der gesperrten Periode',
      () => {
        const w = earlyDelivered(100);
        acceptContract(w);
        stepAt(w, periodStart(2));
        stepAt(w, periodStart(2) + 450);
        expect(w.contract).not.toBeNull();
        expect(w.order).toBeNull();
        return w;
      },
    ],
  ];
  it.each(states)('%s', (_name, make) => {
    const x = make();
    const r = deserialize(serialize(x));
    if (!r.ok) throw new Error(r.reason);
    expect(serialize(r.world)).toBe(serialize(x));
    const end = x.tick + 3 * ORDER_PERIOD;
    while (x.tick < end) {
      step(x);
      step(r.world);
    }
    expect(serialize(r.world)).toBe(serialize(x));
  });
});

describe('AK-H2-23 Determinismus', () => {
  function script(seed: number): string {
    const w = farWorld(3, ['B'], seed);
    const B = islandOf(w, 'B');
    stepAt(w, P);
    expect(acceptFarOrder(w).ok).toBe(true);
    w.islands[B]!.stock.rum = 15;
    expect(deliverOrder(w, B).ok).toBe(true);
    while (w.tick < periodStart(3)) step(w);
    expect(acceptFarOrder(w).ok).toBe(true);
    while (w.tick < periodStart(7)) step(w);
    return serialize(w);
  }
  it('zwei Läufe gleiches serialize', () => {
    expect(script(3)).toBe(script(3));
  });
});
