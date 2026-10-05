import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, adjacentOf, idx } from '../../src/sim/world';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { BUILDING_DEFS, ROAD_COST } from '../../src/sim/defs/buildings';
import { needsConnection } from '../../src/sim/roads';
import { connectBuilding, connectPath } from '../../src/sim/connect';
import type { Building, World } from '../../src/sim/types';
import { forceGrass, houseNearKontor, prepareEast } from './helpers';

let w: World;
let k: Building;
let lj: Building;

/** Holzfäller 4 Kacheln östlich der Kontor-Ostkante, ohne Weg dazwischen. */
beforeEach(() => {
  w = createWorld(3);
  k = w.buildings[w.kontorId]!;
  prepareEast(w, k);
  const res = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
  if (!res.ok || res.id === undefined) throw new Error('lumberjack not placed');
  lj = w.buildings[res.id]!;
});

const snapshot = (world: World): string => JSON.stringify(world);

describe('needsConnection', () => {
  it('is false for kontor and house, true for a lumberjack', () => {
    expect(needsConnection('kontor')).toBe(false);
    expect(needsConnection('house')).toBe(false);
    expect(needsConnection('lumberjack')).toBe(true);
  });
});

describe('connectPath (AK-01)', () => {
  it('returns the shortest new tiles ordered from building to network', () => {
    const r = connectPath(w, lj.id);
    expect(r).toEqual({
      ok: true,
      tiles: [
        { x: k.x + 5, y: k.y },
        { x: k.x + 4, y: k.y },
        { x: k.x + 3, y: k.y },
        { x: k.x + 2, y: k.y },
      ],
    });
  });

  it('reuses an existing, not yet connected road piece', () => {
    expect(placeRoad(w, k.x + 4, k.y).ok).toBe(true);
    expect(placeRoad(w, k.x + 5, k.y).ok).toBe(true);
    expect(lj.connected).toBe(false);
    const r = connectPath(w, lj.id);
    expect(r).toEqual({
      ok: true,
      tiles: [
        { x: k.x + 3, y: k.y },
        { x: k.x + 2, y: k.y },
      ],
    });
  });

  it('ends at the existing connected network', () => {
    expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
    expect(placeRoad(w, k.x + 3, k.y).ok).toBe(true);
    const r = connectPath(w, lj.id);
    expect(r).toEqual({
      ok: true,
      tiles: [
        { x: k.x + 5, y: k.y },
        { x: k.x + 4, y: k.y },
      ],
    });
  });
});

describe('connectPath determinism and purity (AK-02)', () => {
  it('gives identical tiles twice and on a JSON copy, and leaves the world untouched', () => {
    const before = snapshot(w);
    const a = connectPath(w, lj.id);
    const b = connectPath(w, lj.id);
    const c = connectPath(JSON.parse(before) as World, lj.id);
    expect(a.ok).toBe(true);
    expect(b).toEqual(a);
    expect(c).toEqual(a);
    expect(snapshot(w)).toBe(before);
  });
});

describe('connectPath without a way (AK-03)', () => {
  it('fails when the building is enclosed by water', () => {
    const def = BUILDING_DEFS[lj.defId];
    for (const p of adjacentOf(w, lj.x, lj.y, def.w, def.h)) {
      forceGrass(w, p.x, p.y);
      w.tiles[idx(w, p.x, p.y)]!.terrain = 'water';
    }
    const before = snapshot(w);
    expect(connectPath(w, lj.id)).toEqual({ ok: false, reason: 'Kein Weg zum Kontor möglich' });
    expect(snapshot(w)).toBe(before);
  });
});

describe('connectPath not applicable (AK-04)', () => {
  it('rejects unknown ids, kontor, house and connected buildings', () => {
    expect(connectPath(w, 99999)).toEqual({ ok: false, reason: 'Kein Gebäude' });
    expect(connectPath(w, w.kontorId)).toEqual({ ok: false, reason: 'Braucht keinen Weg' });
    for (let i = 2; i < 6; i++) expect(placeRoad(w, k.x + i, k.y).ok).toBe(true);
    expect(lj.connected).toBe(true);
    expect(connectPath(w, lj.id)).toEqual({ ok: false, reason: 'Schon angebunden' });
    const house = houseNearKontor(w);
    expect(connectPath(w, house.id)).toEqual({ ok: false, reason: 'Braucht keinen Weg' });
  });
});

describe('connectBuilding (AK-05)', () => {
  it('builds all tiles, charges n x ROAD_COST and connects the building', () => {
    w.money = 1000;
    const r = connectBuilding(w, lj.id);
    expect(r).toEqual({ ok: true, built: 4 });
    expect(w.money).toBe(1000 - 4 * ROAD_COST);
    expect(lj.connected).toBe(true);
  });

  it('passes through the path reason when not applicable', () => {
    expect(connectBuilding(w, 99999)).toEqual({ ok: false, reason: 'Kein Gebäude' });
  });
});

describe('connectBuilding without money (AK-06)', () => {
  it('builds nothing when money is short', () => {
    w.money = 4 * ROAD_COST - 1;
    const before = snapshot(w);
    expect(connectBuilding(w, lj.id)).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    expect(snapshot(w)).toBe(before);
  });

  it('reports no money when negative', () => {
    w.money = -1;
    const before = snapshot(w);
    expect(connectBuilding(w, lj.id)).toEqual({ ok: false, reason: 'Kein Geld' });
    expect(snapshot(w)).toBe(before);
  });
});
