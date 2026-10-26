// I-112 T02: Save-Feld `council`, SAVE_VERSION 17, Migration v16 → v17 (AK 9, Ruling R711 R-4).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { decree } from '../../src/sim/council';
import {
  SAVE_VERSION,
  deserialize,
  migrateV16ToV17,
  migrateV18ToV19,
  serialize,
} from '../../src/sim/save';
import type { CouncilState, Tier, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { putBuilding, sortedJson } from './helpers';
import { laneWorld, shipLiteral } from './seaHelpers';

const json = (w: World): Record<string, unknown> => JSON.parse(serialize(w));

function load(text: string): World {
  const r = deserialize(text);
  if (!r.ok) throw new Error(r.reason);
  return r.world;
}

/** Stand der Version 16: ohne `council`. */
function v16Of(w: World): Record<string, unknown> {
  const raw = json(w);
  delete raw.council;
  delete raw.trial;
  raw.version = 16;
  return raw;
}

function addHouse(w: World, tier: Tier, island: number): void {
  const k = w.buildings[w.islands[island]!.kontorId ?? -1];
  const h = putBuilding(w, island, 'house', (k?.x ?? 3) + 3, k?.y ?? 3);
  h.house!.tier = tier;
}

describe('AK-9 (R-4) Rundreise', () => {
  const states: CouncilState[] = [null, 'open', 'A', 'B'];
  for (const s of states) {
    it(`serialize → deserialize → serialize gleich, council[3] = ${String(s)}`, () => {
      const w = createWorld(3);
      w.council = { 2: s, 3: s, 4: s };
      const text = serialize(w);
      expect(serialize(load(text))).toBe(text);
      expect(load(text).council).toEqual({ 2: s, 3: s, 4: s });
    });
  }
});

describe('AK-9 (R-4) Migration v16 → v17', () => {
  it('kein Haus: alle null', () => {
    const m = load(JSON.stringify(v16Of(createWorld(3))));
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.council).toEqual({ 2: null, 3: null, 4: null });
  });

  it('Stufe-2-Haus: nur 2 offen', () => {
    const w = createWorld(3);
    addHouse(w, 2, 0);
    expect(load(JSON.stringify(v16Of(w))).council).toEqual({ 2: 'open', 3: null, 4: null });
  });

  it('Stufe-3-Haus: 2 und 3 offen', () => {
    const w = createWorld(3);
    addHouse(w, 3, 0);
    expect(load(JSON.stringify(v16Of(w))).council).toEqual({ 2: 'open', 3: 'open', 4: null });
  });

  it('Stufe-4-Haus auf der zweiten Insel: alle offen', () => {
    const w = createWorld(3);
    w.won = true; // Stufe 4 ist laut Ladeprüfung nur nach dem Sieg zulässig
    addHouse(w, 4, 1);
    expect(load(JSON.stringify(v16Of(w))).council).toEqual({ 2: 'open', 3: 'open', 4: 'open' });
  });

  it('migrateV16ToV17 wirft nie, auch bei kaputten Gebäuden', () => {
    const raw: Record<string, unknown> = { version: 16, buildings: null };
    expect(() => migrateV16ToV17(raw)).not.toThrow();
    expect(raw.version).toBe(17);
    expect(raw.council).toEqual({ 2: null, 3: null, 4: null });
  });

  it('älterer Fixture-Stand (v11) läuft die Kette bis SAVE_VERSION mit gültigem council', () => {
    const m = load(readFileSync('tests/sim/fixtures/save-v11.json', 'utf8'));
    expect(m.version).toBe(SAVE_VERSION);
    expect(Object.keys(m.council)).toEqual(['2', '3', '4']);
    for (const t of [2, 3, 4] as const) expect([null, 'open']).toContain(m.council[t]);
  });

  it('migrate → serialize → deserialize → serialize ist gleich', () => {
    const w = createWorld(3);
    addHouse(w, 3, 0);
    const first = serialize(load(JSON.stringify(v16Of(w))));
    expect(serialize(load(first))).toBe(first);
  });
});

describe('AK-9 (R-4) Abweisen', () => {
  it('SAVE_VERSION liegt nicht unter 17 und SAVE_VERSION + 1 wird abgewiesen', () => {
    expect(SAVE_VERSION).toBeGreaterThanOrEqual(17);
    const raw = { ...json(createWorld(3)), version: SAVE_VERSION + 1 };
    expect(deserialize(JSON.stringify(raw))).toEqual({ ok: false, reason: 'Unbekannte Version' });
  });

  it('council fehlt oder council[3] = "X": Beschädigter Spielstand, kein Wurf', () => {
    const damaged = { ok: false, reason: 'Beschädigter Spielstand' };
    const missing = json(createWorld(3));
    delete missing.council;
    expect(deserialize(JSON.stringify(missing))).toEqual(damaged);
    const bad = json(createWorld(3));
    (bad.council as Record<string, unknown>)['3'] = 'X';
    expect(() => deserialize(JSON.stringify(bad))).not.toThrow();
    expect(deserialize(JSON.stringify(bad))).toEqual(damaged);
    for (const key of ['constructor', 'toString', '__proto__']) {
      const proto = json(createWorld(3));
      (proto.council as Record<string, unknown>)['2'] = key;
      expect(deserialize(JSON.stringify(proto))).toEqual(damaged);
    }
  });
});

describe('I-153 Seerecht Save', () => {
  const d = 30;
  const BAD = { ok: false, reason: 'Beschädigter Spielstand' };

  function sailing(left: number, c4: CouncilState = null) {
    const { w, island } = laneWorld(d);
    w.council[4] = c4;
    shipLiteral(w, { to: island, left });
    return w;
  }

  it('AK-SR-11 Runde: Beschluss C rechnet um, Stand lädt und bleibt gleich', () => {
    const { w, island } = laneWorld(d);
    w.council[4] = 'open';
    shipLiteral(w, { to: island, left: 10 * d });
    shipLiteral(w, { to: island, left: 10 * d - 1 });
    expect(decree(w, 4, 'C').ok).toBe(true);
    expect(w.ships[0]!.left).toBe(8 * d);
    expect(w.ships[1]!.left).toBeLessThanOrEqual(8 * d);
    const text = serialize(w);
    const r = deserialize(text);
    expect(r.ok).toBe(true);
    if (r.ok) expect(sortedJson(r.world)).toBe(sortedJson(w));
  });

  it('AK-SR-13: C nur auf Stufe 4', () => {
    for (const tier of [2, 3] as const) {
      const w = createWorld(3);
      w.council[tier] = 'C';
      let r: ReturnType<typeof deserialize> | undefined;
      expect(() => (r = deserialize(serialize(w)))).not.toThrow();
      expect(r).toEqual(BAD);
    }
    const w = createWorld(3);
    w.council[4] = 'C';
    expect(deserialize(serialize(w)).ok).toBe(true);
  });

  it('AK-SR-14 streng: Fahrzeit nach wirksamem Feldwert', () => {
    expect(deserialize(serialize(sailing(10 * d, 'C')))).toEqual(BAD);
    expect(deserialize(serialize(sailing(8 * d, 'C'))).ok).toBe(true);
    expect(deserialize(serialize(sailing(8 * d + 1, 'C')))).toEqual(BAD);
    expect(deserialize(serialize(sailing(10 * d))).ok).toBe(true);
  });

  it('AK-SR-14 Reihenfolge: manipuliertes council weist ab, ohne Wurf', () => {
    const bad: unknown[] = [
      null,
      [],
      'C',
      { 2: null, 3: null },
      { 2: null, 3: null, 4: null, 5: null },
      { 2: 'C', 3: null, 4: 'C' },
    ];
    for (const c of bad) {
      const raw = json(sailing(10 * d));
      raw.council = c;
      let r: ReturnType<typeof deserialize> | undefined;
      expect(() => (r = deserialize(JSON.stringify(raw)))).not.toThrow();
      expect(r).toEqual(BAD);
    }
  });
});

describe('I-153 Seerecht Save-Version (F3)', () => {
  const PRE_SEERECHT_VERSION = 18;

  it('AK-SR-12 SAVE_VERSION ist der Stand vor Seerecht plus 1 (plus 1 für Bittschrift, I-210)', () => {
    expect(SAVE_VERSION).toBe(PRE_SEERECHT_VERSION + 1 + 1);
  });

  it('AK-SR-12 v18-Stand lädt als aktuelle Version, council und ships bleiben gleich', () => {
    const w = createWorld(3);
    const raw = json(w);
    raw.version = PRE_SEERECHT_VERSION;
    const m = load(JSON.stringify(raw));
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.council).toEqual(w.council);
    expect(m.ships).toEqual(w.ships);
  });

  it('AK-SR-12 migrateV18ToV19 ändert nur die Version und wirft nie', () => {
    const raw = { ...json(createWorld(3)), version: 18 };
    const copy = structuredClone(raw);
    migrateV18ToV19(raw);
    expect(raw.version).toBe(19);
    expect({ ...raw, version: 0 }).toEqual({ ...copy, version: 0 });
    const empty: Record<string, unknown> = {};
    expect(() => migrateV18ToV19(empty)).not.toThrow();
  });

  it('F3 älterer Build weist Seerecht-Stand über die Version ab', () => {
    const { w } = laneWorld(30);
    w.council[4] = 'C';
    const raw = json(w);
    expect(raw.version).toBe(SAVE_VERSION);
    raw.version = SAVE_VERSION + 1;
    expect(deserialize(JSON.stringify(raw))).toEqual({ ok: false, reason: 'Unbekannte Version' });
  });
});
