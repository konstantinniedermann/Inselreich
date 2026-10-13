// M14-E1 T03: Save v13 (Insel C «Weidenau»). Rundlauf (AK-20), Migration v12 → v13 (AK-21, Tech-B2, Tech-B3).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ISLAND_GAP_MIN } from '../../src/sim/defs/sea';
import { recomputeConnectivity } from '../../src/sim/roads';
import {
  SAVE_VERSION,
  deserialize,
  migrateV11ToV12,
  migrateV7ToV8,
  migrateV8ToV9,
  serialize,
} from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { friendlyReason } from '../../src/ui/hints';
import { foldBackToV12, putBuilding } from './helpers';
import { foundKontor2Literal, shipLiteral } from './seaHelpers';

const FELS = 2;
const WEIDEN = 3;

const loaded = (json: string): World => {
  const r = deserialize(json);
  if (!r.ok) throw new Error(r.reason);
  return r.world;
};

function v12Of(w: World): Record<string, unknown> {
  return foldBackToV12(JSON.parse(serialize(w)) as Record<string, unknown>);
}

/** Welt mit Kontor II und Steinbruch auf der Felsbucht (Seed 3), wie AK-M14E1-21 verlangt. */
function felsWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  const k = foundKontor2Literal(w, FELS);
  putBuilding(w, FELS, 'quarry', k.x + 4, k.y);
  w.money = 12_345;
  recomputeConnectivity(w);
  return w;
}

describe('M14-E1 Save v13', () => {
  it('createWorld trägt SAVE_VERSION', () => {
    expect(createWorld(3).version).toBe(SAVE_VERSION);
  });

  it('AK-M14E1-20: Rundlauf mit Gebäuden und Lager auf Weidenau', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = foundKontor2Literal(w, WEIDEN);
    putBuilding(w, WEIDEN, 'canefarm', k.x + 4, k.y);
    putBuilding(w, WEIDEN, 'sheepfarm', k.x + 7, k.y);
    w.islands[WEIDEN]!.stock.cane = 7;
    recomputeConnectivity(w);
    const back = loaded(serialize(w));
    expect(back).toEqual(w);
    expect(back.islands[WEIDEN]!.stock.cane).toBe(7);
  });

  it('AK-M14E1-21: Migration v12 → v13 ergänzt Weidenau, Rest unverändert', () => {
    const w = felsWorld();
    const old = v12Of(w);
    expect(old.version).toBe(12);
    expect((old.islands as unknown[]).length).toBe(3);
    const reference = loaded(serialize(w));
    const m = loaded(JSON.stringify(old));
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.islands).toHaveLength(4);
    expect(JSON.stringify(m.islands[3])).toBe(JSON.stringify(createWorld(3).islands[3]));
    expect(m.islands.slice(0, 3)).toEqual(reference.islands.slice(0, 3));
    expect(m.buildings).toEqual(reference.buildings);
    expect(m.ships).toEqual(reference.ships);
    expect(m.money).toBe(12_345);
  });

  it('Tech-B3: verschobene gespeicherte Möweninsel → C ohne Überlappung, kein Wurf', () => {
    const old = v12Of(felsWorld());
    const stored = (old.islands as Record<string, number>[])[1]!;
    stored.ox = stored.ox! + 3;
    const m = loaded(JSON.stringify(old));
    expect(m.islands).toHaveLength(4);
    const c = m.islands[3]!;
    for (const o of m.islands.slice(0, 3)) {
      const gx = Math.max(o.ox - (c.ox + c.width), c.ox - (o.ox + o.width));
      const gy = Math.max(o.oy - (c.oy + c.height), c.oy - (o.oy + o.height));
      expect(Math.max(gx, gy)).toBeGreaterThanOrEqual(ISLAND_GAP_MIN);
    }
  });

  it('Tech-B2: save.ts importiert weder createWorld noch world.ts', () => {
    const src = readFileSync('src/sim/save.ts', 'utf8');
    expect(src).not.toMatch(/from '\.\/world'/);
    expect(src).not.toMatch(/createWorld\(/);
  });

  it('Tech-B3: ohne Verschiebung bleibt C wie in createWorld, mit Verschiebung rückt sie ab', () => {
    const plain = loaded(JSON.stringify(v12Of(felsWorld()))).islands[3]!;
    expect(plain.ox).toBe(createWorld(3).islands[3]!.ox);
    const old = v12Of(felsWorld());
    const stored = (old.islands as Record<string, number>[])[1]!;
    stored.ox = stored.ox! + 3;
    const moved = loaded(JSON.stringify(old)).islands[3]!;
    expect([moved.ox, moved.oy]).not.toEqual([plain.ox, plain.oy]);
  });
});

const readFixture = (f: string): string => readFileSync(`tests/sim/fixtures/${f}`, 'utf8');
const rawFixture = (f: string): Record<string, unknown> =>
  JSON.parse(readFixture(f)) as Record<string, unknown>;

const FIXTURES = [
  ...[1, 2, 3, 4, 5, 6, 7, 8, 11].map((n) => `save-v${n}.json`),
  'see-route-start-v9.json',
  'z3-scenario-v9.json',
];

describe('AK-M14E1-22: Fixture-Kette', () => {
  it.each(FIXTURES)('%s → Version 13, vier Inseln, Insel 3 «C»', (f) => {
    const w = loaded(readFixture(f));
    expect(w.version).toBe(SAVE_VERSION);
    expect(w.islands).toHaveLength(4);
    expect(w.islands[3]!.kind).toBe('C');
  });

  it('migrateV7ToV8 legt A, B und C an', () => {
    const raw = rawFixture('save-v7.json');
    migrateV7ToV8(raw);
    expect((raw.islands as unknown[]).length).toBe(4);
  });

  it('Tech-B8: Gewürz und Sperrbestand laufen über Insel C', () => {
    const raw = rawFixture('save-v7.json');
    migrateV7ToV8(raw);
    migrateV8ToV9(raw);
    const c = (raw.islands as { kind: string; stock: Record<string, number> }[])[3]!;
    expect(c.kind).toBe('C');
    expect(c.stock.spice).toBe(0);
    migrateV11ToV12(raw);
    expect((raw.islands as { reserve: unknown }[])[3]!.reserve).toEqual({ wood: 0, stone: 0 });
  });
});

type Json = Record<string, unknown>;
const islandsOf = (j: Json): Json[] => j.islands as Json[];
const v13Json = (): Json => JSON.parse(serialize(felsWorld())) as Json;
const reasonOf = (j: Json): string => {
  const r = deserialize(JSON.stringify(j));
  return r.ok ? 'ok' : r.reason;
};
const DAMAGED = 'Beschädigter Spielstand';

describe('AK-M14E1-23: Ladeprüfung', () => {
  it('Ausgangsstand ist gültig', () => {
    expect(reasonOf(v13Json())).toBe('ok');
  });

  it('23a: drei Inseln bei Version 13', () => {
    const j = v13Json();
    islandsOf(j).pop();
    expect(reasonOf(j)).toBe(DAMAGED);
  });

  it('23b: fünf Inseln (Insel 3 doppelt)', () => {
    const j = v13Json();
    islandsOf(j).push(structuredClone(islandsOf(j)[3]!));
    expect(reasonOf(j)).toBe(DAMAGED);
  });

  it('23c: Insel 3 als «B» und vertauschte Inseln 2 und 3', () => {
    const a = v13Json();
    islandsOf(a)[3]!.kind = 'B';
    expect(reasonOf(a)).toBe(DAMAGED);
    const b = v13Json();
    const isl = islandsOf(b);
    [isl[2], isl[3]] = [isl[3]!, isl[2]!];
    expect(reasonOf(b)).toBe(DAMAGED);
  });

  it('23d: Insel 3 mit Breite 36', () => {
    const j = v13Json();
    islandsOf(j)[3]!.width = 36;
    expect(reasonOf(j)).toBe(DAMAGED);
  });

  it('23e: Gebäude mit Insel 4', () => {
    const j = v13Json();
    const quarry = Object.values(j.buildings as Record<string, Json>).find(
      (b) => b.defId === 'quarry',
    )!;
    quarry.island = 4;
    expect(reasonOf(j)).toBe(DAMAGED);
  });

  it('23f: Vorversion mit Inseln kein Array oder Heimat ohne anchor, kein Wurf', () => {
    const a = v12Of(felsWorld());
    a.islands = 'x';
    expect(reasonOf(a)).toBe(DAMAGED);
    const b = v12Of(felsWorld());
    delete islandsOf(b)[0]!.anchor;
    expect(reasonOf(b)).toBe(DAMAGED);
  });
});

describe('AK-M14E1-24: Rückfaltung, Fehlerfälle', () => {
  it('24b: unbekannter Weltschlüssel', () => {
    const j = v13Json();
    j.foo = 1;
    expect(() => foldBackToV12(j)).toThrow('foldBackToV12: unbekannter Schlüssel foo');
  });

  it('24c: Insel 3 mit Kontor', () => {
    const j = v13Json();
    islandsOf(j)[3]!.kontorId = 5;
    expect(() => foldBackToV12(j)).toThrow('foldBackToV12: Insel C nicht rückfaltbar');
  });

  it('24d: Insel 3 mit Zuckerrohr im Lager', () => {
    const j = v13Json();
    (islandsOf(j)[3]!.stock as Record<string, number>).cane = 1;
    expect(() => foldBackToV12(j)).toThrow('foldBackToV12: Insel C nicht rückfaltbar');
  });

  it('24e: Weg auf Insel 3; Gebäude mit Insel 3', () => {
    const a = v13Json();
    (islandsOf(a)[3]!.tiles as Json[])[0]!.road = true;
    expect(() => foldBackToV12(a)).toThrow('foldBackToV12: Insel C nicht rückfaltbar');
    const b = v13Json();
    (Object.values(b.buildings as Record<string, Json>)[0] as Json).island = 3;
    expect(() => foldBackToV12(b)).toThrow('foldBackToV12: Insel C nicht rückfaltbar');
  });

  it('24f: Schiff mit Route 1–3', () => {
    const w = felsWorld();
    shipLiteral(w, { route: { a: 1, b: 3, ab: [], ba: [] } });
    const j = JSON.parse(serialize(w)) as Json;
    expect(() => foldBackToV12(j)).toThrow('foldBackToV12: Insel C nicht rückfaltbar');
  });

  it('24g: Zusatzschlüssel entfällt, abweichende Schlüsselfolge bleibt', () => {
    const j = v13Json();
    const isl = islandsOf(j);
    isl[1]!.x = 0;
    const reversed = Object.fromEntries(Object.entries(isl[2]!).reverse());
    isl[2] = reversed;
    const out = islandsOf(foldBackToV12(j));
    expect('x' in out[1]!).toBe(false);
    expect(Object.keys(out[2]!)).toEqual(Object.keys(reversed));
  });
});

describe('AK-M14E1-25: Unbekannte Version, Ungültiges Format', () => {
  it('Version 14 wird abgewiesen', () => {
    const j = v13Json();
    j.version = SAVE_VERSION + 1;
    expect(reasonOf(j)).toBe('Unbekannte Version');
  });

  it('abgeschnittener Text', () => {
    expect(deserialize('{"version": ')).toEqual({ ok: false, reason: 'Ungültiges Format' });
  });

  it('Migration mit kaputter Heimat wirft nicht', () => {
    const a = v12Of(felsWorld());
    islandsOf(a)[0] = null as unknown as Json;
    expect(reasonOf(a)).toBe(DAMAGED);
    const b = v12Of(felsWorld());
    islandsOf(b)[0]!.anchor = 'x';
    expect(reasonOf(b)).toBe(DAMAGED);
  });

  it.each(['Ungültiges Format', 'Unbekannte Version', DAMAGED])(
    'friendlyReason(%s) ist nicht leer',
    (reason) => {
      expect(friendlyReason(createWorld(3), reason).length).toBeGreaterThan(0);
    },
  );
});

describe('AK-M14E1-42: Schiff unterwegs über Rückfaltung', () => {
  const WAY = 6;
  const sailing = (): World => {
    const w = createWorld(3, { unlockAll: true });
    foundKontor2Literal(w, 1);
    shipLiteral(w, {
      port: 0,
      to: 1,
      left: WAY,
      cargo: { wood: 3 },
      route: { a: 0, b: 1, ab: [{ good: 'wood', reserve: 0 }], ba: [] },
      homing: false,
    });
    return w;
  };

  it('Schiff bleibt tief gleich und kommt im selben Tick an', () => {
    const original = sailing();
    const back = loaded(JSON.stringify(foldBackToV12(JSON.parse(serialize(original)) as Json)));
    const ship = back.ships[0]!;
    const ref = original.ships[0]!;
    expect(ship.to).not.toBeNull();
    expect(ship.left).toBeGreaterThan(0);
    expect(ship).toEqual(ref);
    for (let i = 1; i < WAY; i++) {
      step(original);
      step(back);
      expect(back.ships[0]!.to).toBe(1);
      expect(back.ships[0]!.left).toBe(original.ships[0]!.left);
    }
    step(original);
    step(back);
    expect(back.ships[0]!.to).not.toBe(1);
    expect(back.ships[0]).toEqual(original.ships[0]);
    expect(back.islands[1]!.stock).toEqual(original.islands[1]!.stock);
    expect(back.ships[0]!.cargo).toEqual(original.ships[0]!.cargo);
  });
});
