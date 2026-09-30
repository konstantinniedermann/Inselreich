import { beforeEach, describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/build';
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
  it('uses version 1', () => {
    expect(SAVE_VERSION).toBe(1);
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
    expectFailure(JSON.stringify({ ...w, version: 2 }), 'Unbekannte Version');
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
