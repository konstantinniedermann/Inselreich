import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { createWorld, footprint, home } from '../../src/sim/world';
import type { GoodId, World } from '../../src/sim/types';
import { groundElements, stampPlacements } from '../../src/render/decor';
import { occupancy } from '../../src/render/terrain';

/** Welt mit Wohnhäusern und Wegen auf Gras rund um die Inselmitte (Gebäude- und Wegkacheln für die Deko-Regeln). */
function settled(seed: number): World {
  const w = createWorld(seed, { unlockAll: true });
  w.money = 1e9;
  for (const k of Object.keys(home(w).stock)) home(w).stock[k as GoodId] = 500;
  const isl = home(w);
  const cx = isl.width >> 1,
    cy = isl.height >> 1;
  let houses = 0;
  for (let d = 0; d < 24 && houses < 8; d++)
    for (let y = cy - d; y <= cy + d && houses < 8; y++)
      for (let x = cx - d; x <= cx + d && houses < 8; x++) {
        if (Math.max(Math.abs(x - cx), Math.abs(y - cy)) !== d) continue;
        if (placeBuilding(w, 'house', x, y).ok) {
          houses++;
          for (let k = 0; k < 3; k++) placeRoad(w, x + k, y + 2);
        }
      }
  return w;
}

describe('L4 Deko-Fundament: Belegung (R3)', () => {
  it('Keine Deko auf Gebäude- oder Wegkacheln; kein Stempel auf (+x, +y, +x+y) vor Gebäuden', () => {
    for (const seed of [1, 7, 14]) {
      const w = settled(seed);
      const isl = home(w);
      const occ = occupancy(isl);
      expect(
        occ.reduce((a, b) => a + b, 0),
        `Seed ${seed}: Fixture belegt Kacheln`,
      ).toBeGreaterThan(8);
      const at = (x: number, y: number) => isl.tiles[y * isl.width + x]!;
      for (const el of groundElements(w.seed, isl, occ))
        for (let y = el.y; y < el.y + el.h; y++)
          for (let x = el.x; x < el.x + el.w; x++)
            expect(
              occ[y * isl.width + x],
              `Seed ${seed}: ${el.kind} auf belegter Kachel ${x},${y}`,
            ).toBe(0);
      const front = new Set<number>();
      for (const b of Object.values(w.buildings))
        for (const p of footprint(BUILDING_DEFS[b.defId], b.x, b.y))
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
            [1, 1],
          ] as const)
            front.add((p.y + dy) * isl.width + p.x + dx);
      const stamps = stampPlacements(w.seed, isl);
      for (const s of stamps) {
        const t = at(s.x, s.y);
        expect(t.buildingId, `Seed ${seed}: Stempel ${s.kind} auf Gebäude`).toBeNull();
        expect(t.road, `Seed ${seed}: Stempel ${s.kind} auf Weg`).toBe(false);
        expect(
          front.has(s.y * isl.width + s.x),
          `Seed ${seed}: Stempel ${s.kind} vor Gebäude ${s.x},${s.y}`,
        ).toBe(false);
      }
    }
  });
});
