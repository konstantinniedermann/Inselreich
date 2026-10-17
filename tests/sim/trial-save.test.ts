// I-132 T01: Save-Feld `trial`, SAVE_VERSION 18, Migration v17 → v18 (AK 12).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SAVE_VERSION, deserialize, migrateV17ToV18, serialize } from '../../src/sim/save';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';

const json = (w: World): Record<string, unknown> => JSON.parse(serialize(w));

function load(text: string): World {
  const r = deserialize(text);
  if (!r.ok) throw new Error(r.reason);
  return r.world;
}

const START = { active: null, ticks: 0, e0: 0, passed: [] };

/** Stand der Version 17: ohne `trial`. */
function v17Of(w: World): Record<string, unknown> {
  const raw = json(w);
  delete raw.trial;
  raw.version = 17;
  return raw;
}

describe('AK-12 Rundreise', () => {
  const states = [
    START,
    { active: 'selfSupply', ticks: 1234, e0: 75, passed: [] },
    { active: null, ticks: 0, e0: 75, passed: [{ id: 'selfSupply', tick: 20000 }] },
  ];
  it.each(states)('serialize → deserialize → serialize gleich: %j', (t) => {
    const w = createWorld(3);
    w.trial = JSON.parse(JSON.stringify(t)) as World['trial'];
    const text = serialize(w);
    expect(serialize(load(text))).toBe(text);
    expect(load(text).trial).toEqual(t);
  });
});

describe('AK-12 Migration v17 → v18', () => {
  it('v17 lädt mit SAVE_VERSION und Startwerten', () => {
    const m = load(JSON.stringify(v17Of(createWorld(3))));
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.trial).toEqual(START);
  });

  it('migrateV17ToV18 wirft nie', () => {
    const raw: Record<string, unknown> = { version: 17 };
    expect(() => migrateV17ToV18(raw)).not.toThrow();
    expect(raw.version).toBe(18);
    expect(raw.trial).toEqual(START);
  });

  it('älterer Fixture-Stand (v11) läuft die Kette bis SAVE_VERSION', () => {
    const m = load(readFileSync('tests/sim/fixtures/save-v11.json', 'utf8'));
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.trial).toEqual(START);
  });

  it('migrate → serialize → deserialize → serialize ist gleich', () => {
    const first = serialize(load(JSON.stringify(v17Of(createWorld(3)))));
    expect(serialize(load(first))).toBe(first);
  });
});

describe('AK-12 Abweisen', () => {
  const damaged = { ok: false, reason: 'Beschädigter Spielstand' };
  const sel = 'selfSupply';
  const cases: [string, (raw: Record<string, unknown>) => void][] = [
    ['trial fehlt', (r) => delete r.trial],
    ['trial null', (r) => (r.trial = null)],
    ['trial Array', (r) => (r.trial = [])],
    ['active unbekannt', (r) => (r.trial = { ...START, active: 'genuegsam' })],
    ['active toString', (r) => (r.trial = { ...START, active: 'toString' })],
    ['ticks 9000', (r) => (r.trial = { ...START, active: sel, e0: 5, ticks: 9000 })],
    ['ticks -1', (r) => (r.trial = { ...START, active: sel, e0: 5, ticks: -1 })],
    ['ticks 1.5', (r) => (r.trial = { ...START, active: sel, e0: 5, ticks: 1.5 })],
    ['active null, ticks 5', (r) => (r.trial = { ...START, ticks: 5 })],
    ['e0 -1', (r) => (r.trial = { ...START, e0: -1 })],
    ['e0 2.5', (r) => (r.trial = { ...START, e0: 2.5 })],
    ['active ohne e0', (r) => (r.trial = { ...START, active: sel, e0: 0 })],
    ['passed Objekt', (r) => (r.trial = { ...START, passed: {} })],
    ['passed [5]', (r) => (r.trial = { ...START, passed: [5] })],
    ['passed unbekannte Id', (r) => (r.trial = { ...START, passed: [{ id: 'x', tick: 1 }] })],
    ['passed tick -1', (r) => (r.trial = { ...START, passed: [{ id: sel, tick: -1 }] })],
    [
      'passed doppelt',
      (r) =>
        (r.trial = {
          ...START,
          passed: [
            { id: sel, tick: 1 },
            { id: sel, tick: 2 },
          ],
        }),
    ],
    [
      'active und passed',
      (r) => (r.trial = { active: sel, ticks: 0, e0: 5, passed: [{ id: sel, tick: 1 }] }),
    ],
  ];

  it('SAVE_VERSION + 1 wird abgewiesen', () => {
    const raw = { ...json(createWorld(3)), version: SAVE_VERSION + 1 };
    expect(deserialize(JSON.stringify(raw))).toEqual({ ok: false, reason: 'Unbekannte Version' });
  });

  it.each(cases)('%s: Beschädigter Spielstand, kein Wurf', (_n, mutate) => {
    const raw = json(createWorld(3));
    mutate(raw);
    const text = JSON.stringify(raw);
    expect(() => deserialize(text)).not.toThrow();
    expect(deserialize(text)).toEqual(damaged);
  });
});
