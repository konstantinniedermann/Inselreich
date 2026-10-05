import { beforeEach, describe, expect, it } from 'vitest';
import { placeBuilding } from '../../src/sim/build';
import { ROAD_COST } from '../../src/sim/defs/buildings';
import { connectPath } from '../../src/sim/connect';
import { adjacentOf, createWorld, idx } from '../../src/sim/world';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, World } from '../../src/sim/types';
import { connectView } from '../../src/ui/connect';
import { forceGrass, prepareEast } from '../sim/helpers';

let w: World;
let k: Building;
let lj: Building;

beforeEach(() => {
  w = createWorld(3);
  k = w.buildings[w.kontorId]!;
  prepareEast(w, k);
  const res = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
  if (!res.ok || res.id === undefined) throw new Error('lumberjack not placed');
  lj = w.buildings[res.id]!;
  w.money = 1000;
});

describe('connectView (AK-08)', () => {
  it('is null for kontor and house', () => {
    expect(connectView(w, k)).toBeNull();
    const h = placeBuilding(w, 'house', k.x - 3, k.y);
    if (h.ok && h.id !== undefined) expect(connectView(w, w.buildings[h.id]!)).toBeNull();
  });

  it('is null for a connected building', () => {
    lj.connected = true;
    expect(connectView(w, lj)).toBeNull();
  });

  it('shows plural label, cost and path when affordable', () => {
    const p = connectPath(w, lj.id);
    if (!p.ok) throw new Error('no path');
    const n = p.tiles.length;
    expect(n).toBeGreaterThan(1);
    const v = connectView(w, lj)!;
    expect(v.label).toBe(`Anbinden (${n} Wege · ${n * ROAD_COST} Geld)`);
    expect(v.ok).toBe(true);
    expect(v.reason).toBeNull();
    expect(v.tiles).toEqual(p.tiles);
  });

  it('uses the singular for one tile', () => {
    // Weg bis auf eine Kachel vorhanden: Kontor-Ostkante bis zum Betrieb
    const p = connectPath(w, lj.id);
    if (!p.ok) throw new Error('no path');
    for (const t of p.tiles.slice(1)) w.tiles[idx(w, t.x, t.y)]!.road = true;
    const v = connectView(w, lj)!;
    expect(v.label).toBe(`Anbinden (1 Weg · ${ROAD_COST} Geld)`);
    expect(v.tiles).toHaveLength(1);
  });

  it('is not ok with a reason when money is short, preview stays', () => {
    const p = connectPath(w, lj.id);
    if (!p.ok) throw new Error('no path');
    const cost = p.tiles.length * ROAD_COST;
    w.money = 3;
    const v = connectView(w, lj)!;
    expect(v.ok).toBe(false);
    expect(v.reason).toBe(`Zu wenig Geld: ${cost} nötig, 3 vorhanden`);
    expect(v.tiles).toEqual(p.tiles);
  });

  it('reports a missing way', () => {
    const def = BUILDING_DEFS[lj.defId];
    for (const p of adjacentOf(w, lj.x, lj.y, def.w, def.h)) {
      forceGrass(w, p.x, p.y);
      w.tiles[idx(w, p.x, p.y)]!.terrain = 'water';
    }
    expect(connectView(w, lj)).toEqual({
      label: 'Anbinden',
      ok: false,
      reason: 'Kein Weg zum Kontor möglich',
      tiles: [],
    });
  });
});
