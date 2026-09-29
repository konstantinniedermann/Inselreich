import { describe, expect, it } from 'vitest';
import { generateMap, MAP_H, MAP_W } from '../../src/sim/mapgen';
import { createWorld, tileAt, adjacentOf, isLand } from '../../src/sim/world';

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
