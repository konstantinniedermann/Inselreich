import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import {
  generateMap,
  generateTerrain,
  meetsPostconditions,
  MAP_H,
  MAP_W,
} from '../../src/sim/mapgen';
import {
  createWorld,
  tileAt,
  adjacentOf,
  isLand,
  footprint,
  tilesInRadius,
} from '../../src/sim/world';

const count = (t: string[], k: string) => t.filter((x) => x === k).length;

describe('generateMap', () => {
  it('is deterministic', () => {
    expect(generateMap(1)).toEqual(generateMap(1));
  });
  it('fulfils the postconditions for many seeds', () => {
    for (let s = 1; s <= 20; s++) {
      const m = generateMap(s);
      expect(m.terrain).toHaveLength(MAP_W * MAP_H);
      const land = m.terrain.filter(isLand).length;
      expect(land).toBeGreaterThanOrEqual(800);
      expect(count(m.terrain, 'forest')).toBeGreaterThanOrEqual(40);
      expect(count(m.terrain, 'mountain')).toBeGreaterThanOrEqual(10);
      expect(m.seedUsed).toBeGreaterThanOrEqual(s);
    }
  });
  it('retries with seed + i and round-trips the used seed', () => {
    let s = 1;
    while (s <= 200 && meetsPostconditions(generateTerrain(s, MAP_W, MAP_H), MAP_W, MAP_H)) s++;
    if (s > 200) {
      throw new Error('no seed in 1..200 fails the postconditions; retry path is untested');
    }
    const m = generateMap(s);
    expect(m.seedUsed).toBeGreaterThan(s);
    expect(createWorld(m.seedUsed).tiles).toEqual(createWorld(s).tiles);
  });
  it('round-trips the seed of a created world', () => {
    expect(createWorld(createWorld(5).seed).tiles).toEqual(createWorld(5).tiles);
  });
  it('keeps the border water', () => {
    const m = generateMap(5);
    for (let x = 0; x < MAP_W; x++) {
      expect(m.terrain[x]).toBe('water');
      expect(m.terrain[(MAP_H - 1) * MAP_W + x]).toBe('water');
    }
  });
});

describe('createWorld', () => {
  it('places the kontor on land next to water', () => {
    const w = createWorld(3);
    const k = w.buildings[w.kontorId]!;
    expect(k.defId).toBe('kontor');
    for (let dy = 0; dy < 2; dy++)
      for (let dx = 0; dx < 2; dx++) {
        const t = tileAt(w, k.x + dx, k.y + dy)!;
        expect(isLand(t.terrain)).toBe(true);
        expect(t.buildingId).toBe(k.id);
      }
    const waterAdj = adjacentOf(w, k.x, k.y, 2, 2).some(
      (p) => tileAt(w, p.x, p.y)!.terrain === 'water',
    );
    expect(waterAdj).toBe(true);
    expect(w.money).toBe(5000);
    expect(w.stock.wood).toBe(40);
    expect(w.seed).toBeGreaterThanOrEqual(3);
  });
});

describe('world helpers', () => {
  it('footprint of a 2x2 def returns 4 positions', () => {
    expect(footprint(BUILDING_DEFS.market, 5, 7)).toHaveLength(4);
  });
  it('adjacentOf a 2x2 returns the 8 edge neighbours, no corners, none inside', () => {
    const w = createWorld(3);
    const adj = adjacentOf(w, 10, 10, 2, 2);
    expect(adj).toHaveLength(8);
    for (const p of adj) {
      const inside = p.x >= 10 && p.x <= 11 && p.y >= 10 && p.y <= 11;
      const corner = (p.x === 9 || p.x === 12) && (p.y === 9 || p.y === 12);
      expect(inside).toBe(false);
      expect(corner).toBe(false);
    }
  });
  it('tilesInRadius stays in bounds and includes the centre tile', () => {
    const w = createWorld(3);
    const near = tilesInRadius(w, 0, 0, 3);
    expect(near.every((p) => p.x >= 0 && p.y >= 0 && p.x < w.width && p.y < w.height)).toBe(true);
    expect(near).toContainEqual({ x: 0, y: 0 });
  });
  it('tilesInRadius is symmetric around a tile centre', () => {
    const w = createWorld(3);
    const set = new Set(tilesInRadius(w, 10.5, 10.5, 2).map((p) => `${p.x - 10},${p.y - 10}`));
    expect(set.has('0,0')).toBe(true);
    for (const k of set) {
      const [dx, dy] = k.split(',').map(Number) as [number, number];
      expect(set.has(`${-dx},${-dy}`)).toBe(true);
      expect(set.has(`${-dx},${dy}`)).toBe(true);
    }
    expect(set.has('-2,0') && set.has('2,0')).toBe(true);
  });
});
