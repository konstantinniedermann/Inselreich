import { describe, expect, it } from 'vitest';
import { countFreeTerrain, countTerrain, countTerrainAround } from '../../src/sim/terrainCount';
import { createWorld, footprint, home, idx, tilesInRadius } from '../../src/sim/world';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Terrain } from '../../src/sim/types';

describe('countTerrainAround entspricht tilesInRadius + countTerrain/countFreeTerrain', () => {
  const w = createWorld(7, { unlockAll: true });
  const isl = home(w);
  // Gemischtes Gelände, Wege und Gebäude-Belegung.
  const kinds: Terrain[] = ['grass', 'forest', 'water', 'mountain'];
  isl.tiles.forEach((t, i) => {
    t.terrain = kinds[(i * 7 + Math.floor(i / isl.width)) % kinds.length]!;
    t.road = i % 11 === 0;
    t.buildingId = i % 13 === 0 ? 1 : null;
  });
  const def = BUILDING_DEFS.lumberjack;

  it('liefert für viele Positionen, Radien und Gelände dieselben Zahlen', () => {
    let checked = 0;
    for (const [x, y] of [
      [0, 0],
      [1, 3],
      [10, 10],
      [isl.width - 2, isl.height - 2],
      [20, 7],
    ] as const) {
      const cx = x + def.w / 2;
      const cy = y + def.h / 2;
      for (const r of [1, 2, 3, 4.5]) {
        for (const terrain of kinds) {
          const tiles = tilesInRadius(isl, cx, cy, r);
          expect(countTerrainAround(isl, cx, cy, r, terrain)).toBe(
            countTerrain(isl, tiles, terrain),
          );
          expect(countTerrainAround(isl, cx, cy, r, terrain, { x, y, w: def.w, h: def.h })).toBe(
            countFreeTerrain(isl, tiles, terrain, footprint(def, x, y)),
          );
          checked++;
        }
      }
    }
    expect(checked).toBe(80);
    expect(idx(isl, 0, 0)).toBe(0);
  });
});
