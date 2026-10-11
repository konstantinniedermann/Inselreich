import { describe, expect, it } from 'vitest';
import v1Json from './fixtures/save-v1.json?raw';
import v2Json from './fixtures/save-v2.json?raw';
import v3Json from './fixtures/save-v3.json?raw';
import v4Json from './fixtures/save-v4.json?raw';
import v5Json from './fixtures/save-v5.json?raw';
import v6Json from './fixtures/save-v6.json?raw';
import v6LocksJson from './fixtures/save-v6-locks.json?raw';
import v7Json from './fixtures/save-v7.json?raw';
import v8Json from './fixtures/save-v8.json?raw';
import v9RouteJson from './fixtures/see-route-start-v9.json?raw';
import v9ScenarioJson from './fixtures/z3-scenario-v9.json?raw';
import v11Json from './fixtures/save-v11.json?raw';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { SAVE_VERSION, deserialize, serialize } from '../../src/sim/save';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';

/** Serialisiert, lässt `edit` am rohen Objekt manipulieren und gibt wieder JSON zurück. */
function tampered(world: World, edit: (raw: Record<string, unknown>) => void): string {
  const raw = JSON.parse(serialize(world)) as Record<string, unknown>;
  edit(raw);
  return JSON.stringify(raw);
}

const buyPctOf = (raw: Record<string, unknown>): Record<string, unknown> =>
  raw.buyPct as Record<string, unknown>;

describe('AK-ZK-16 Rundlauf', () => {
  it('buyPct {tools 137, spice 160, sonst 100} übersteht Speichern und Laden', () => {
    const w = createWorld(3);
    w.buyPct.tools = 137;
    w.buyPct.spice = 160;
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.world).toEqual(w);
  });
});

describe('AK-ZK-17 Migration', () => {
  it('v11-Stand lädt mit buyPct 100 und behält sellPct', () => {
    const r = deserialize(v11Json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.version).toBe(SAVE_VERSION);
    expect(GOOD_IDS.every((g) => r.world.buyPct[g] === 100)).toBe(true);
    expect(r.world.sellPct.wood).toBe(55); // Fixture: sellPct.wood = 55 vor dem Speichern gesetzt
  });

  it('die Kette v1 bis v10 lädt weiter, buyPct überall 100', () => {
    const all = [
      v1Json,
      v2Json,
      v3Json,
      v4Json,
      v5Json,
      v6Json,
      v6LocksJson,
      v7Json,
      v8Json,
      v9RouteJson,
      v9ScenarioJson,
    ];
    for (const json of all) {
      const r = deserialize(json);
      expect(r.ok).toBe(true);
      if (r.ok) expect(GOOD_IDS.every((g) => r.world.buyPct[g] === 100)).toBe(true);
    }
  });
});

describe('AK-ZK-18 Abweisen', () => {
  const w = createWorld(3);
  const bad: [string, (raw: Record<string, unknown>) => void][] = [
    ['tools 99', (r) => (buyPctOf(r).tools = 99)],
    ['tools 161', (r) => (buyPctOf(r).tools = 161)],
    ['tools 120.5', (r) => (buyPctOf(r).tools = 120.5)],
    ["tools '120'", (r) => (buyPctOf(r).tools = '120')],
    ['Gut fehlt', (r) => delete buyPctOf(r).glass],
    ['buyPct fehlt', (r) => delete r.buyPct],
    ['buyPct null', (r) => (r.buyPct = null)],
  ];

  for (const [name, edit] of bad)
    it(`weist ${name} ab, ohne zu werfen`, () => {
      expect(deserialize(tampered(w, edit))).toEqual({
        ok: false,
        reason: 'Beschädigter Spielstand',
      });
    });

  it('weist eine neuere Version ab', () => {
    const json = tampered(w, (r) => (r.version = SAVE_VERSION + 1));
    expect(deserialize(json)).toEqual({ ok: false, reason: 'Unbekannte Version' });
  });
});
