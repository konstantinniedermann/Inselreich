import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { placeRoad } from '../../src/sim/build';
import { FIRE_OUTAGE } from '../../src/sim/defs/timing';
import { SAVE_VERSION, deserialize, migrateV10ToV11, serialize } from '../../src/sim/save';
import type { Building, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { foldBackToV10, foldBackToV9, placeTownhall, prepareEast, putBuilding } from './helpers';

const BAD = { ok: false, reason: 'Beschädigter Spielstand' };

/** Heimat mit Amtsstube, Ziel erreicht und einem angebundenen Fischer; Rückgabe: Welt und Fischer. */
function edictWorld(): { w: World; fisher: Building } {
  const w = createWorld(3, { unlockAll: true });
  const k = w.buildings[home(w).kontorId]!;
  prepareEast(w, k);
  w.won = true;
  placeTownhall(w);
  if (!placeRoad(w, k.x + 2, k.y).ok) throw new Error('Weg');
  const fisher = putBuilding(w, 0, 'fisher', k.x + 2, k.y + 1);
  return { w, fisher };
}

function tampered(world: World, edit: (raw: Record<string, unknown>) => void): string {
  const raw = JSON.parse(serialize(world)) as Record<string, unknown>;
  edit(raw);
  return JSON.stringify(raw);
}

const onBuilding =
  (id: number, k: string, val: unknown) =>
  (r: Record<string, unknown>): void => {
    (r.buildings as Record<string, Record<string, unknown>>)[String(id)]![k] = val;
  };

function v10Of(w: World): Record<string, unknown> {
  return foldBackToV10(JSON.parse(serialize(w)) as Record<string, unknown>);
}

describe('M13-E1 Save v11', () => {
  it('AK-M13E1-01 createWorld schreibt die zwei Felder am Ende, version 11', () => {
    const w = createWorld(3);
    expect(w.edict).toBeNull();
    expect(w.edictLockedUntil).toBe(0);
    expect(Object.keys(w).slice(-2)).toEqual(['edict', 'edictLockedUntil']);
    expect(w.version).toBe(11);
    expect(SAVE_VERSION).toBe(11);
  });

  describe('AK-M13E1-22 foldBackToV10', () => {
    it('ohne Edikt: v10-Schlüssel, version 10, gleiche Zeichenkette wie von Hand gebaut', () => {
      const w = createWorld(3);
      const v11 = JSON.parse(serialize(w)) as Record<string, unknown>;
      const out = foldBackToV10(v11);
      expect(Object.keys(out)).not.toContain('edict');
      expect(Object.keys(out)).not.toContain('edictLockedUntil');
      expect(out.version).toBe(10);
      const hand: Record<string, unknown> = {};
      for (const k of Object.keys(v11))
        if (k !== 'edict' && k !== 'edictLockedUntil') hand[k] = v11[k];
      hand.version = 10;
      expect(JSON.stringify(out)).toBe(JSON.stringify(hand));
    });
    it('Edikt gesetzt wirft', () => {
      const v11 = { ...JSON.parse(serialize(createWorld(3))), edict: 'trade' };
      expect(() => foldBackToV10(v11)).toThrow('foldBackToV10: Edikt nicht rückfaltbar');
    });
    it('Sperre gesetzt wirft', () => {
      const v11 = { ...JSON.parse(serialize(createWorld(3))), edictLockedUntil: 1 };
      expect(() => foldBackToV10(v11)).toThrow('foldBackToV10: Edikt nicht rückfaltbar');
    });
    it('stillgelegtes Gebäude wirft', () => {
      const { w, fisher } = edictWorld();
      fisher.paused = true;
      const v11 = JSON.parse(serialize(w)) as Record<string, unknown>;
      expect(() => foldBackToV10(v11)).toThrow('foldBackToV10: Stilllegung nicht rückfaltbar');
    });
    it('unbekannter Schlüssel wirft', () => {
      const v11 = { ...JSON.parse(serialize(createWorld(3))), foo: 1 };
      expect(() => foldBackToV10(v11)).toThrow('foldBackToV10: unbekannter Schlüssel foo');
    });
    it('foldBackToV9 auf v11 = foldBackToV9(foldBackToV10(x))', () => {
      const v11 = JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
      expect(foldBackToV9(v11)).toEqual(foldBackToV9(foldBackToV10(v11)));
    });
  });

  it('AK-M13E1-23 Rundlauf mit Edikt und stillgelegtem Fischer', () => {
    const { w, fisher } = edictWorld();
    w.edict = 'trade';
    w.edictLockedUntil = 4000;
    fisher.paused = true;
    fisher.state = 'paused';
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world).toEqual(w);
    expect(r.world.buildings[fisher.id]!.state).toBe('paused');
  });

  describe('AK-M13E1-24 Migration', () => {
    it('v10 mit won true', () => {
      const { w } = edictWorld();
      const r = deserialize(JSON.stringify(v10Of(w)));
      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.world.version).toBe(11);
      expect(r.world.edict).toBeNull();
      expect(r.world.edictLockedUntil).toBe(0);
      expect(r.world.won).toBe(true);
    });
    it('alle Fixtures v1 bis v9', () => {
      const files = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `save-v${n}.json`);
      files.push('see-route-start-v9.json', 'z3-scenario-v9.json');
      for (const f of files) {
        const r = deserialize(readFileSync(`tests/sim/fixtures/${f}`, 'utf8'));
        expect(r.ok, f).toBe(true);
        if (!r.ok) continue;
        expect(r.world.version, f).toBe(11);
        expect(r.world.edict, f).toBeNull();
        expect(r.world.edictLockedUntil, f).toBe(0);
      }
    });
    it('migrateV10ToV11 lässt vorhandene Werte stehen', () => {
      const raw: Record<string, unknown> = { version: 10, edict: 'x' };
      migrateV10ToV11(raw);
      expect(raw.version).toBe(11);
      expect(raw.edict).toBe('x');
      expect(raw.edictLockedUntil).toBe(0);
    });
  });

  describe('AK-M13E1-25 Ladeprüfung', () => {
    it('25a unbekanntes Edikt', () => {
      const { w } = edictWorld();
      expect(deserialize(tampered(w, (r) => (r.edict = 'tax')))).toEqual(BAD);
    });
    it('25b ungültige Sperre', () => {
      const { w } = edictWorld();
      for (const v of [-1, 1.5, '300'])
        expect(deserialize(tampered(w, (r) => (r.edictLockedUntil = v))), String(v)).toEqual(BAD);
      expect(deserialize(tampered(w, (r) => delete r.edictLockedUntil))).toEqual(BAD);
    });
    it('25c Edikt ohne Ziel', () => {
      const { w } = edictWorld();
      const json = tampered(w, (r) => {
        r.edict = 'saving';
        r.won = false;
      });
      expect(deserialize(json)).toEqual(BAD);
    });
    it('25d Edikt ohne Amtsstube', () => {
      const w = createWorld(3);
      w.won = true;
      expect(deserialize(tampered(w, (r) => (r.edict = 'saving')))).toEqual(BAD);
    });
    it('25e ungültiges paused', () => {
      const { w, fisher } = edictWorld();
      const house = putBuilding(w, 0, 'house', 5, 5);
      const chapel = putBuilding(w, 0, 'chapel', 8, 8);
      const kontorId = home(w).kontorId;
      const cases: [string, number, unknown][] = [
        ['false', fisher.id, false],
        ['1', fisher.id, 1],
        ['Wohnhaus', house.id, true],
        ['Kapelle', chapel.id, true],
        ['Kontor', kontorId, true],
      ];
      for (const [name, id, val] of cases)
        expect(deserialize(tampered(w, onBuilding(id, 'paused', val))), name).toEqual(BAD);
    });
    it('25f state paused ohne paused', () => {
      const { w, fisher } = edictWorld();
      expect(deserialize(tampered(w, onBuilding(fisher.id, 'state', 'paused')))).toEqual(BAD);
    });
    it('25g paused mit burning ist gültig', () => {
      const { w, fisher } = edictWorld();
      fisher.paused = true;
      fisher.state = 'burning';
      fisher.outageUntil = w.tick + FIRE_OUTAGE;
      expect(deserialize(serialize(w)).ok).toBe(true);
    });
    it('25h v10 mit edict x', () => {
      const { w } = edictWorld();
      const v10 = { ...v10Of(w), edict: 'x' };
      expect(deserialize(JSON.stringify(v10))).toEqual(BAD);
    });
  });

  it('AK-M13E1-26 unbekannte Version und abgeschnittener Text', () => {
    const w = createWorld(3);
    expect(deserialize(tampered(w, (r) => (r.version = 12)))).toEqual({
      ok: false,
      reason: 'Unbekannte Version',
    });
    expect(deserialize('{"version": 11')).toEqual({ ok: false, reason: 'Ungültiges Format' });
  });
});
