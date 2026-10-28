// I-091 T02: Save-Feld `contract.deliveries` (AK-TR-13a, -14, -15).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { SAVE_VERSION, deserialize, migrateV15ToV16, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { HOME, createWorld } from '../../src/sim/world';
import {
  foldBackSeerecht,
  foldBackPetitions,
  foldBackTithe,
  foldBackCouncil,
  foldBackTrial,
  foldBackDeliveries,
  foldBackFarOrders,
} from './helpers';

declare const process: { env: Record<string, string | undefined> };

const json = (w: World): Record<string, unknown> => JSON.parse(serialize(w));

function load(w: World): World {
  const r = deserialize(serialize(w));
  if (!r.ok) throw new Error(r.reason);
  return r.world;
}

function withContract(n: number): World {
  const w = createWorld(3, { unlockAll: true });
  w.order = null;
  w.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries: n };
  return w;
}

function stepToNextPeriod(w: World): void {
  const k = Math.floor((w.tick - ORDER_FIRST_TICK) / ORDER_PERIOD) + 1;
  const target = ORDER_FIRST_TICK + k * ORDER_PERIOD;
  while (w.tick < target) step(w);
}

describe('AK-TR-13a Roundtrip', () => {
  it('deliveries bleibt erhalten und zählt in beiden Welten gleich weiter', () => {
    const w = withContract(3);
    w.islands[HOME]!.stock.rum = 10;
    const copy = load(w);
    expect(copy.contract!.deliveries).toBe(3);
    stepToNextPeriod(w);
    stepToNextPeriod(copy);
    expect(w.contract!.deliveries).toBe(4);
    expect(copy.contract!.deliveries).toBe(4);
    expect(serialize(copy)).toBe(serialize(w));
  });
});

describe('AK-TR-14 Migration', () => {
  const oldRaw = (): Record<string, unknown> =>
    foldBackDeliveries(
      foldBackCouncil(
        foldBackTrial(foldBackSeerecht(foldBackTithe(foldBackPetitions(json(withContract(3)))))),
      ),
    );

  it('14a: migrateV15ToV16 setzt deliveries 0 am Schlüsselende, null bleibt, wirft nie', () => {
    const raw = oldRaw();
    expect(raw.version).toBe(SAVE_VERSION - 6);
    migrateV15ToV16(raw);
    const c = raw.contract as Record<string, unknown>;
    expect(c.deliveries).toBe(0);
    expect(raw.version).toBe(SAVE_VERSION - 5);
    expect(Object.keys(c)).toEqual(['good', 'amount', 'price', 'island', 'deliveries']);
    expect(() => migrateV15ToV16(raw)).not.toThrow();
    const none = foldBackDeliveries(
      foldBackCouncil(
        foldBackTrial(foldBackSeerecht(foldBackTithe(foldBackPetitions(json(createWorld(3)))))),
      ),
    );
    migrateV15ToV16(none);
    expect(none.contract).toBeNull();
  });

  it('14b: Kette über deserialize', () => {
    const r = deserialize(JSON.stringify(oldRaw()));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.contract!.deliveries).toBe(0);
  });

  it('14c: echtes v14-Fixture lädt mit deliveries 0', () => {
    const text = readFileSync('tests/sim/fixtures/save-v14-contract.json', 'utf8');
    expect((JSON.parse(text) as { version: number }).version).toBe(14); // historisch, einzige erlaubte Zahl
    const r = deserialize(text);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.version).toBe(SAVE_VERSION);
    expect(r.world.contract).toEqual({
      good: 'rum',
      amount: 5,
      price: 27,
      island: HOME,
      deliveries: 0,
    });
    expect(r.world.farOffer).toBeNull();
    expect(r.world.farSkip).toBeNull();
  });
});

describe('AK-TR-15 Validierung', () => {
  const damaged = { ok: false, reason: 'Beschädigter Spielstand' };
  const cases: [string, (c: Record<string, unknown>) => void][] = [
    ['fehlt', (c) => delete c.deliveries],
    ['null', (c) => (c.deliveries = null)],
    ['negativ', (c) => (c.deliveries = -1)],
    ['nicht ganzzahlig', (c) => (c.deliveries = 2.5)],
    ['String', (c) => (c.deliveries = '3')],
  ];
  for (const [name, mutate] of cases) {
    it(`deliveries ${name}: abgewiesen ohne Ausnahme`, () => {
      const raw = json(withContract(3));
      mutate(raw.contract as Record<string, unknown>);
      const text = JSON.stringify(raw);
      expect(() => deserialize(text)).not.toThrow();
      expect(deserialize(text)).toEqual(damaged);
    });
  }

  it('höhere Version wird abgewiesen', () => {
    const raw = { ...json(withContract(3)), version: SAVE_VERSION + 1 };
    expect(deserialize(JSON.stringify(raw))).toEqual({ ok: false, reason: 'Unbekannte Version' });
  });

  it('deliveries 99 lädt', () => {
    // bewusst ohne Obergrenze, Spec §4
    const raw = json(withContract(99));
    const r = deserialize(JSON.stringify(raw));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.world.contract!.deliveries).toBe(99);
  });
});

// Erzeugt das v14-Fixture; nur mit FIXTURE_OUT.
it.skipIf(!process.env.FIXTURE_OUT)('schreibt save-v14-contract.json', () => {
  const w = withContract(0);
  const x = foldBackFarOrders(
    foldBackDeliveries(
      foldBackCouncil(foldBackTrial(foldBackSeerecht(foldBackTithe(foldBackPetitions(json(w)))))),
    ),
  );
  expect(x.version).toBe(14);
  const out = process.env.FIXTURE_OUT!;
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'save-v14-contract.json'), JSON.stringify(x));
});
