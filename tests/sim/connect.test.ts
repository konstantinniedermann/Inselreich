import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, adjacentOf, idx, inBounds, home } from '../../src/sim/world';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { BUILDING_DEFS, ROAD_COST } from '../../src/sim/defs/buildings';
import { canPlaceRoad } from '../../src/sim/placement';
import { needsConnection, reachableRoads, recomputeConnectivity } from '../../src/sim/roads';
import { connectBuilding, connectPath } from '../../src/sim/connect';
import type { Building, World } from '../../src/sim/types';
import { forceGrass, houseNearKontor, prepareEast } from './helpers';

let w: World;
let k: Building;
let lj: Building;

/** Holzfäller 4 Kacheln östlich der Kontor-Ostkante, ohne Weg dazwischen. */
beforeEach(() => {
  w = createWorld(3);
  k = w.buildings[home(w).kontorId]!;
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

/** Referenz: Dijkstra mit einfacher Kostenliste, liefert nur die minimale Zahl neuer Kacheln. */
function minNewTiles(world: World, id: number): number | null {
  const b = world.buildings[id]!;
  const def = BUILDING_DEFS[b.defId];
  const targets = reachableRoads(world);
  const kd = BUILDING_DEFS.kontor;
  const kb = world.buildings[home(world).kontorId]!;
  for (const p of adjacentOf(home(world), kb.x, kb.y, kd.w, kd.h))
    targets.add(idx(home(world), p.x, p.y));
  const cost = (x: number, y: number): number =>
    home(world).tiles[idx(home(world), x, y)]!.road ? 0 : canPlaceRoad(world, x, y).ok ? 1 : -1;
  const dist = new Map<number, number>();
  for (const p of adjacentOf(home(world), b.x, b.y, def.w, def.h)) {
    const c = cost(p.x, p.y);
    if (c >= 0) dist.set(idx(home(world), p.x, p.y), c);
  }
  const open = new Set(dist.keys());
  let best: number | null = null;
  while (open.size > 0) {
    let cur = -1;
    for (const i of open) if (cur === -1 || dist.get(i)! < dist.get(cur)!) cur = i;
    open.delete(cur);
    const d = dist.get(cur)!;
    if (targets.has(cur)) best = best === null ? d : Math.min(best, d);
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nx = (cur % world.width) + dx;
      const ny = Math.floor(cur / world.width) + dy;
      if (!inBounds(home(world), nx, ny)) continue;
      const c = cost(nx, ny);
      const ni = idx(home(world), nx, ny);
      if (c < 0 || (dist.has(ni) && dist.get(ni)! <= d + c)) continue;
      dist.set(ni, d + c);
      open.add(ni);
    }
  }
  return best;
}

describe('connectPath is minimal on mixed start costs (AK-01)', () => {
  it('matches a reference search on many seeded layouts of roads and water', () => {
    let seed = 12345;
    const rnd = (): number => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    let checked = 0;
    for (let round = 0; round < 150; round++) {
      const world = createWorld(3);
      const kon = world.buildings[home(world).kontorId]!;
      prepareEast(world, kon);
      const res = placeBuilding(world, 'lumberjack', kon.x + 6, kon.y);
      if (!res.ok || res.id === undefined) continue;
      for (let y = kon.y - 3; y <= kon.y + 4; y++)
        for (let x = kon.x + 2; x <= kon.x + 9; x++) {
          const t = home(world).tiles[idx(home(world), x, y)]!;
          if (t.buildingId !== null) continue;
          t.terrain = 'grass';
          const r = rnd();
          if (r < 0.3) t.road = true;
          else if (r < 0.4) t.terrain = 'water';
        }
      recomputeConnectivity(world);
      const b = world.buildings[res.id]!;
      if (b.connected) continue;
      const path = connectPath(world, res.id);
      const min = minNewTiles(world, res.id);
      if (min === null) expect(path.ok).toBe(false);
      else expect(path.ok && path.tiles.length).toBe(min);
      checked++;
    }
    expect(checked).toBeGreaterThan(30);
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
    for (const p of adjacentOf(home(w), lj.x, lj.y, def.w, def.h)) {
      forceGrass(w, p.x, p.y);
      home(w).tiles[idx(home(w), p.x, p.y)]!.terrain = 'water';
    }
    const before = snapshot(w);
    expect(connectPath(w, lj.id)).toEqual({ ok: false, reason: 'Kein Weg zum Kontor möglich' });
    expect(snapshot(w)).toBe(before);
  });
});

describe('connectPath not applicable (AK-04)', () => {
  it('rejects unknown ids, kontor, house and connected buildings', () => {
    expect(connectPath(w, 99999)).toEqual({ ok: false, reason: 'Kein Gebäude' });
    expect(connectPath(w, home(w).kontorId)).toEqual({ ok: false, reason: 'Braucht keinen Weg' });
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
