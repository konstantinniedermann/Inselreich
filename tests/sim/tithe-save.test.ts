// I-223 T01: Zehnt-Felder im Save, Migration, Strukturprüfung (AK-ZE-08, AK-ZE-27).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TITHE_CARRY_DIVISOR } from '../../src/sim/defs/tiers';
import { SAVE_VERSION, deserialize, serialize } from '../../src/sim/save';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';

const json = (w: World): Record<string, unknown> => JSON.parse(serialize(w));
const START = {
  titheOn: { 1: false, 2: false },
  titheLockedUntil: { 1: 0, 2: 0 },
  titheCarry: { tools: 0, stone: 0 },
};
const BAD = { ok: false, reason: 'Beschädigter Spielstand' };

describe('AK-ZE-08 Rundlauf', () => {
  it('Felder bleiben nach Serialisieren und Laden gleich', () => {
    const w = createWorld(3);
    w.titheOn = { 1: true, 2: false };
    w.titheLockedUntil = { 1: 2400, 2: 0 };
    w.titheCarry = { tools: 1_760_000, stone: 3 };
    w.tick = 700;
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.titheOn).toEqual(w.titheOn);
    expect(r.world.titheLockedUntil).toEqual(w.titheLockedUntil);
    expect(r.world.titheCarry).toEqual(w.titheCarry);
  });
});

describe('AK-ZE-08/27 Migration', () => {
  it('Vorgängerstand ohne Zehntfelder bekommt Startwerte', () => {
    const native = createWorld(3);
    const raw = json(native);
    delete raw.titheOn;
    delete raw.titheLockedUntil;
    delete raw.titheCarry;
    raw.version = SAVE_VERSION - 1;
    const r = deserialize(JSON.stringify(raw));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.version).toBe(SAVE_VERSION);
    expect(r.world.titheOn).toEqual(START.titheOn);
    expect(r.world.titheLockedUntil).toEqual(START.titheLockedUntil);
    expect(r.world.titheCarry).toEqual(START.titheCarry);
    expect(serialize(r.world)).toBe(serialize(native));
  });
});

describe('AK-ZE-08 Abweisen', () => {
  const cases: [string, (raw: Record<string, unknown>) => void][] = [
    ['titheOn[1] kein Boolean', (r) => ((r.titheOn as Record<string, unknown>)['1'] = 'ja')],
    ['titheOn mit Schlüssel 3', (r) => ((r.titheOn as Record<string, unknown>)['3'] = false)],
    ['titheOn fehlt', (r) => delete r.titheOn],
    [
      'titheLockedUntil[2] negativ',
      (r) => ((r.titheLockedUntil as Record<string, unknown>)['2'] = -1),
    ],
    [
      'titheLockedUntil[2] gebrochen',
      (r) => ((r.titheLockedUntil as Record<string, unknown>)['2'] = 1.5),
    ],
    [
      'titheCarry.tools = Teiler',
      (r) => ((r.titheCarry as Record<string, unknown>).tools = TITHE_CARRY_DIVISOR),
    ],
    ['titheCarry.stone fehlt', (r) => delete (r.titheCarry as Record<string, unknown>).stone],
  ];
  it.each(cases)('%s', (_n, mutate) => {
    const raw = json(createWorld(3));
    mutate(raw);
    const text = JSON.stringify(raw);
    expect(() => deserialize(text)).not.toThrow();
    expect(deserialize(text)).toEqual(BAD);
  });
  it('Grenze: titheCarry.tools = Teiler − 1 wird geladen', () => {
    const raw = json(createWorld(3));
    (raw.titheCarry as Record<string, unknown>).tools = TITHE_CARRY_DIVISOR - 1;
    expect(deserialize(JSON.stringify(raw)).ok).toBe(true);
  });
});

describe('AK-ZE-08 Version', () => {
  it('neuere Version wird abgewiesen', () => {
    const raw = json(createWorld(3));
    raw.version = SAVE_VERSION + 1;
    expect(deserialize(JSON.stringify(raw))).toEqual({ ok: false, reason: 'Unbekannte Version' });
  });
});

describe('AK-ZE-27 Quellscan', () => {
  it('kein Versionsliteral in dieser Datei', () => {
    const lines = readFileSync(new URL(import.meta.url).pathname, 'utf8').split('\n');
    const own = lines.filter((l) => !l.includes('/version:') && !l.includes('toBe\\('));
    expect(own.some((l) => /version:\s*\d/.test(l))).toBe(false);
    expect(own.filter((l) => /version/.test(l)).some((l) => /toBe\(\d+\)/.test(l))).toBe(false);
  });
});
