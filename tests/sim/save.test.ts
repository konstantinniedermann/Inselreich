import { beforeEach, describe, expect, it } from 'vitest';
import v1Json from './fixtures/save-v1.json?raw';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { GOODS, GOOD_IDS, SELL_FLOOR } from '../../src/sim/defs/goods';
import { SAVE_VERSION, deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { forceGrass, prepareEast } from './helpers';

let w: World;
let k: Building;

beforeEach(() => {
  w = createWorld(42);
  k = w.buildings[w.kontorId]!;
  prepareEast(w, k);
});

/** Serialisiert, lässt `edit` am rohen Objekt manipulieren und gibt wieder JSON zurück. */
function tampered(world: World, edit: (raw: Record<string, unknown>) => void): string {
  const raw = JSON.parse(serialize(world)) as Record<string, unknown>;
  edit(raw);
  return JSON.stringify(raw);
}

function expectFailure(json: string, reason: string): void {
  const r = deserialize(json);
  expect(r).toEqual({ ok: false, reason });
}

describe('save', () => {
  it('uses version 2', () => {
    expect(SAVE_VERSION).toBe(2);
  });

  it('AK-S1-01 createWorld starts with the v2 fields', () => {
    const fresh = createWorld(3);
    expect(fresh.version).toBe(2);
    expect(fresh.taxLevel).toBe('normal');
    expect(fresh.taxLockedUntil).toBe(0);
    expect(GOOD_IDS.every((g) => fresh.sellPct[g] === 100)).toBe(true);
    expect(fresh.order).toBeNull();
  });

  // Fixture erzeugt mit Commit cf9e35e über den temporären Test tests/sim/gen-save-v1.test.ts
  // (GEN_SAVE_V1=1; Seed 3, Weg + Holzfäller + Haus östlich des Kontors, 1000 Ticks), siehe Plan M5 Task S1.
  it('AK-S1-02 lädt einen echten v1-Stand und migriert ihn', () => {
    const before = JSON.parse(v1Json) as Record<string, unknown>;
    expect(before.version).toBe(1);
    const r = deserialize(v1Json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const loaded = r.world;
    expect(loaded.version).toBe(2);
    expect(loaded.taxLevel).toBe('normal');
    expect(loaded.taxLockedUntil).toBe(0);
    expect(GOOD_IDS.every((g) => loaded.sellPct[g] === 100)).toBe(true);
    expect(loaded.order).toBeNull();
    expect(loaded.tick).toBe(before.tick);
    expect(loaded.money).toBe(before.money);
    expect(loaded.stock).toEqual(before.stock);
    expect(Object.keys(loaded.buildings)).toEqual(Object.keys(before.buildings as object));
  });

  it('AK-S1-03 round-trips a v2 world with tax, sell share and order', () => {
    w.taxLevel = 'high';
    w.taxLockedUntil = 450;
    w.sellPct.wood = 73;
    w.order = { period: 0, good: 'wood', amount: 25, reward: 175, due: 1200 };
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world).toEqual(w);
  });

  it('AK-S1-04 weist beschädigte v2-Felder ab', () => {
    const bad: Array<(raw: Record<string, unknown>) => void> = [
      (r) => (r.taxLevel = 'extrem'),
      (r) => ((r.sellPct as Record<string, number>).wood = 29),
      (r) => ((r.sellPct as Record<string, number>).wood = 101),
      (r) => ((r.sellPct as Record<string, number>).wood = 50.5),
      (r) => delete (r.sellPct as Record<string, number>).rum,
      (r) => (r.order = { period: 0, good: 'tools', amount: 5, reward: 0, due: 1200 }),
      (r) => (r.order = { period: 0, good: 'wood', amount: 0, reward: 0, due: 1200 }),
      (r) => (r.order = { period: 0, good: 'wood', amount: 5.5, reward: 0, due: 1200 }),
      (r) => (r.taxLockedUntil = 1.5),
      (r) => (r.taxLockedUntil = -7),
    ];
    for (const edit of bad) expectFailure(tampered(w, edit), 'Beschädigter Spielstand');
    expectFailure(
      tampered(w, (r) => (r.version = 3)),
      'Unbekannte Version',
    );
  });

  it('AK-S1-04 Güter tragen die Auftragsdaten (Spec 5.3), SELL_FLOOR ist 30', () => {
    expect(SELL_FLOOR).toBe(30);
    const table: Record<string, [number, number, number] | undefined> = {
      wood: [1, 20, 40],
      food: [1, 10, 20],
      stone: [2, 10, 20],
      wool: [2, 10, 20],
      cloth: [2, 6, 12],
      cane: [3, 10, 20],
      rum: [3, 6, 12],
      tools: undefined,
    };
    for (const g of GOOD_IDS) {
      const o = GOODS[g].order;
      const want = table[g];
      expect(o === undefined ? undefined : [o.tier, o.min, o.max]).toEqual(want);
    }
  });

  it('round-trips a played world unchanged', () => {
    for (let i = 0; i < 4; i++) expect(placeRoad(w, k.x + 2 + i, k.y).ok).toBe(true);
    const lj = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
    expect(lj.ok).toBe(true);
    forceGrass(w, k.x, k.y - 1);
    const house = placeBuilding(w, 'house', k.x, k.y - 1);
    expect(house.ok).toBe(true);
    for (let i = 0; i < 100; i++) step(w);
    expect(w.buildings[house.id!]!.house!.demand).not.toEqual({});

    const r = deserialize(serialize(w));

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world).toEqual(w);
    expect(r.world.buildings[lj.id!]!.connected).toBe(true);
  });

  it('rejects an unknown version', () => {
    expectFailure(JSON.stringify({ ...w, version: 3 }), 'Unbekannte Version');
  });

  it('rejects invalid JSON', () => {
    expectFailure('{not json', 'Ungültiges Format');
  });

  it('rejects JSON that is not an object', () => {
    expectFailure('42', 'Ungültiges Format');
    expectFailure('null', 'Ungültiges Format');
  });

  it('rejects a stock without every good', () => {
    const json = tampered(w, (raw) => {
      delete (raw.stock as Record<string, unknown>).rum;
    });
    expectFailure(json, 'Beschädigter Spielstand');
  });

  it('rejects a wrong number of tiles', () => {
    const json = tampered(w, (raw) => {
      (raw.tiles as unknown[]).pop();
    });
    expectFailure(json, 'Beschädigter Spielstand');
  });

  it('rejects a tiles array with a null element', () => {
    const json = tampered(w, (raw) => {
      (raw.tiles as unknown[])[0] = null;
    });
    expectFailure(json, 'Beschädigter Spielstand');
  });

  it('rejects a building with an unknown defId', () => {
    const json = tampered(w, (raw) => {
      const b = (raw.buildings as Record<string, Building>)[String(w.kontorId)]!;
      (b as { defId: string }).defId = 'castle';
    });
    expectFailure(json, 'Beschädigter Spielstand');
  });

  it('recomputes connectivity instead of trusting the saved flag', () => {
    const lj = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
    expect(lj.ok).toBe(true);
    const json = tampered(w, (raw) => {
      const b = (raw.buildings as Record<string, Building>)[String(lj.id)]!;
      b.connected = true;
      b.state = 'ok';
    });

    const r = deserialize(json);

    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const loaded = r.world.buildings[lj.id!]!;
    expect(loaded.connected).toBe(false);
    expect(loaded.state).toBe('notConnected');
  });

  it('keeps the victory flag', () => {
    w.won = true;
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.won).toBe(true);
  });

  it('never throws on garbage input', () => {
    for (const json of ['', '{not json', '42', 'null', '[]', '{"version":1}', '"text"']) {
      expect(() => deserialize(json)).not.toThrow();
    }
  });
});
