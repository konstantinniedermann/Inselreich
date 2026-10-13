// I-047 T02: Save-Felder `contract` und `contractOffer` (AK-SK-21, -22, -23).
import { describe, expect, it } from 'vitest';
import { ORDER_DURATION, ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { SAVE_VERSION, deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { foldBackToV12, foldBackToV13 } from './helpers';
import { foundKontor2Literal } from './seaHelpers';

const json = (w: World): Record<string, unknown> => JSON.parse(serialize(w));

function load(w: World): World {
  const r = deserialize(serialize(w));
  if (!r.ok) throw new Error(r.reason);
  return r.world;
}

function run(w: World, n: number): void {
  for (let i = 0; i < n; i++) step(w);
}

function withContract(): World {
  const w = createWorld(3, { unlockAll: true });
  foundKontor2Literal(w, 1);
  w.order = null;
  w.contract = { good: 'rum', amount: 5, price: 27, island: 1 };
  return w;
}

function withOffer(): World {
  const w = createWorld(3, { unlockAll: true });
  w.order = null;
  w.contractOffer = { good: 'rum', island: 0 };
  return w;
}

describe('AK-SK-22 Version und Migration', () => {
  it('22a: neue Welt hat Version und zwei leere Felder als letzte Schlüssel', () => {
    const w = createWorld(3);
    expect(w.version).toBe(SAVE_VERSION);
    expect(w.contract).toBeNull();
    expect(w.contractOffer).toBeNull();
    expect(Object.keys(json(w)).slice(-2)).toEqual(['contract', 'contractOffer']);
  });

  it('22b: Stand ohne Felder wird verlustfrei und bitgleich weitergespielt', () => {
    const w = createWorld(3, { unlockAll: true });
    const old = foldBackToV13(json(w));
    expect(old.version).toBe(SAVE_VERSION - 1);
    expect('contract' in old).toBe(false);
    const r = deserialize(JSON.stringify(old));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.contract).toBeNull();
    expect(r.world.contractOffer).toBeNull();
    expect(serialize(r.world)).toBe(serialize(w));
    run(w, 10 * ORDER_PERIOD);
    run(r.world, 10 * ORDER_PERIOD);
    expect(serialize(r.world)).toBe(serialize(w));
  });

  it('22c: unbekannte Version wird abgewiesen', () => {
    const raw = { ...json(createWorld(3)), version: SAVE_VERSION + 1 };
    expect(deserialize(JSON.stringify(raw))).toEqual({ ok: false, reason: 'Unbekannte Version' });
  });
});

describe('AK-SK-21 Roundtrip', () => {
  for (const [name, make] of [
    ['Vertrag', withContract],
    ['Angebot', withOffer],
  ] as const) {
    it(`${name}: serialize/deserialize gleich, danach bitgleich weiter`, () => {
      const w = make();
      const copy = load(w);
      expect(serialize(copy)).toBe(serialize(w));
      run(w, 2 * ORDER_PERIOD);
      run(copy, 2 * ORDER_PERIOD);
      expect(serialize(copy)).toBe(serialize(w));
    });
  }
});

describe('AK-SK-23 Validierung', () => {
  const bad = (mutate: (raw: Record<string, any>) => void): void => {
    const raw = json(withContract()) as Record<string, any>;
    mutate(raw);
    expect(deserialize(JSON.stringify(raw))).toEqual({
      ok: false,
      reason: 'Beschädigter Spielstand',
    });
  };
  const validOrder = (): Record<string, unknown> => {
    const period = 0;
    const due = ORDER_FIRST_TICK + period * ORDER_PERIOD + ORDER_DURATION;
    return { period, good: 'wood', amount: 20, reward: 150, due };
  };

  it('Gut ohne Auftragsgut', () => bad((r) => (r.contract.good = 'tools')));
  it('Menge 0', () => bad((r) => (r.contract.amount = 0)));
  it('Insel ausserhalb', () => bad((r) => (r.contract.island = r.islands.length)));
  it('Preis negativ', () => bad((r) => (r.contract.price = -1)));
  it('Vertrag kein Objekt', () => bad((r) => (r.contract = 5)));
  it('Vertrag und Auftrag zugleich', () => bad((r) => (r.order = validOrder())));
  it('Angebot und Auftrag zugleich', () =>
    bad((r) => {
      r.contract = null;
      r.contractOffer = { good: 'rum', island: 0 };
      r.order = validOrder();
    }));
  it('Vertrag und Angebot zugleich', () =>
    bad((r) => (r.contractOffer = { good: 'rum', island: 0 })));
  it('Angebot mit Gewürz', () =>
    bad((r) => {
      r.contract = null;
      r.contractOffer = { good: 'spice', island: 0 };
    }));
});

describe('Rückfaltung foldBackToV13', () => {
  it('wirft bei Vertrag, Angebot und unbekanntem Schlüssel', () => {
    expect(() => foldBackToV13(json(withContract()))).toThrow(
      'foldBackToV13: Vertrag nicht rückfaltbar',
    );
    expect(() => foldBackToV13(json(withOffer()))).toThrow(
      'foldBackToV13: Vertrag nicht rückfaltbar',
    );
    expect(() => foldBackToV13({ ...json(createWorld(3)), foo: 1 })).toThrow(
      'foldBackToV13: unbekannter Schlüssel foo',
    );
  });

  it('foldBackToV12 läuft über v13 und bleibt auf dem Pin', () => {
    const out = foldBackToV12(json(createWorld(3)));
    expect(out.version).toBe(12);
    expect('contract' in out).toBe(false);
  });
});
