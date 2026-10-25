// M14-E1 T03: Rückfaltung foldBackToV12 (AK-M14E1-24a, 24h).
import { describe, expect, it } from 'vitest';
import { serialize } from '../../src/sim/save';
import { createWorld } from '../../src/sim/world';
import {
  fnv1a32,
  foldBackCouncil,
  foldBackTrial,
  foldBackSeerecht,
  foldBackDeliveries,
  foldBackFarOrders,
  foldBackToV9,
  foldBackToV10,
  foldBackToV11,
  foldBackToV12,
  foldBackToV13,
} from './helpers';

const jsonOf = (seed: number): Record<string, unknown> =>
  JSON.parse(serialize(createWorld(seed))) as Record<string, unknown>;

describe('foldBackToV12', () => {
  it('AK-M14E1-24a: createWorld(3) → v12-Form, Pin auf der Basis 62da7923 gemessen', () => {
    const out = foldBackToV12(jsonOf(3));
    const text = JSON.stringify(out);
    expect(out.version).toBe(12);
    expect((out.islands as unknown[]).length).toBe(3);
    // Basis (main @ 62da7923): serialize(createWorld(3)) = 306608 Zeichen, FNV-1a 2274015653
    expect({ hash: fnv1a32(text), length: text.length }).toEqual({
      hash: 2274015653,
      length: 306608,
    });
  });

  it('AK-M14E1-24h: nur 3 Inseln bei Version 13 → Fehler', () => {
    const x = jsonOf(3);
    (x.islands as unknown[]).pop();
    expect(() => foldBackToV12(x)).toThrow('foldBackToV12: 4 Inseln erwartet');
  });
});

describe('foldBackFarOrders (Handel 2, A4)', () => {
  /** Aktueller Stand ohne `council` (I-112: dessen Faltschritt liegt davor), Version eins tiefer. */
  const current = (): Record<string, unknown> =>
    foldBackCouncil(
      foldBackTrial(
        foldBackSeerecht(JSON.parse(serialize(createWorld(3))) as Record<string, unknown>),
      ),
    );
  /** Stand «eine Version älter», ohne Fernfelder. */
  const plain = (): Record<string, unknown> => {
    const x = current();
    delete x.farOffer;
    delete x.farSkip;
    return { ...x, version: (x.version as number) - 1 };
  };
  /** Aktueller Stand mit leeren Fernfeldern am Ende (Form nach T03). */
  const withFar = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
    ...current(),
    ...extra,
  });
  const chains = [foldBackToV13, foldBackToV12, foldBackToV11, foldBackToV10, foldBackToV9];

  it('ohne Fernschlüssel unverändert', () => {
    const x = plain();
    expect(foldBackFarOrders(x)).toBe(x);
  });
  it('leere Fernfelder: Schlüssel weg, version − 1, Reihenfolge wie vorher', () => {
    expect(JSON.stringify(foldBackFarOrders(withFar()))).toBe(JSON.stringify(plain()));
  });
  it.each([
    ['farOffer', { farOffer: { island: 2, good: 'rum', amount: 15, reward: 450 } }],
    ['farSkip', { farSkip: 3 }],
  ])('nicht leeres %s → Fehler', (_k, extra) => {
    expect(() => foldBackFarOrders(withFar(extra))).toThrow(
      'foldBackFarOrders: Fernzustand nicht rückfaltbar',
    );
  });
  it('Fernauftrag (order.island) → Fehler', () => {
    const order = { period: 0, good: 'rum', amount: 15, reward: 450, due: 2300, island: 2 };
    expect(() => foldBackFarOrders(withFar({ order }))).toThrow(
      'foldBackFarOrders: Fernauftrag nicht rückfaltbar',
    );
  });
  it('nur einer der beiden Schlüssel → Fehler', () => {
    const x = withFar();
    delete x.farSkip;
    expect(() => foldBackFarOrders(x)).toThrow('foldBackFarOrders: Fernzustand nicht rückfaltbar');
  });
  it('Ketten: leere Fernfelder falten wie der Stand ohne sie', () => {
    for (const fold of chains)
      expect(JSON.stringify(fold(withFar()))).toBe(JSON.stringify(fold(plain())));
  });
  it('Ketten: offenes Fernangebot wird nicht still weggefiltert', () => {
    const x = withFar({ farOffer: { island: 2, good: 'rum', amount: 15, reward: 450 } });
    for (const fold of chains) expect(() => fold(x)).toThrow('foldBackFarOrders');
  });
});

describe('foldBackDeliveries (I-091)', () => {
  it('entfernt contract.deliveries ohne Umordnen, senkt version, mutiert nicht', () => {
    const x = jsonOf(3);
    x.contract = { good: 'rum', amount: 5, price: 27, island: 0, deliveries: 3 };
    const before = JSON.stringify(x);
    const out = foldBackDeliveries(x);
    expect(out.contract).toEqual({ good: 'rum', amount: 5, price: 27, island: 0 });
    expect(Object.keys(out.contract as object)).toEqual(['good', 'amount', 'price', 'island']);
    expect(Object.keys(out)).toEqual(Object.keys(x));
    expect(out.version).toBe((x.version as number) - 1);
    expect(JSON.stringify(x)).toBe(before);
  });

  it('contract null: nur version - 1', () => {
    const x = jsonOf(3);
    const out = foldBackDeliveries(x);
    expect(out.version).toBe((x.version as number) - 1);
    expect(JSON.stringify({ ...out, version: x.version })).toBe(JSON.stringify(x));
  });
});
