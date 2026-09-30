import { placeBuilding, demolish } from '../../src/sim/build';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { center, idx } from '../../src/sim/world';
import type { Building, World } from '../../src/sim/types';

/** Deterministisches Layout: 6 freie Grasskacheln ab der Ostkante des Kontors, Wald nördlich von Kachel 5. */
export function prepareEast(world: World, kontor: Building): void {
  for (let i = 0; i < 6; i++) {
    const t = world.tiles[idx(world, kontor.x + 2 + i, kontor.y)]!;
    t.terrain = 'grass';
    t.buildingId = null;
    t.road = false;
  }
  world.tiles[idx(world, kontor.x + 2 + 4, kontor.y - 1)]!.terrain = 'forest';
}

function forceGrass(world: World, x: number, y: number): void {
  const t = world.tiles[idx(world, x, y)]!;
  t.terrain = 'grass';
  t.buildingId = null;
  t.road = false;
}

function placedHouse(world: World, x: number, y: number): Building {
  const r = placeBuilding(world, 'house', x, y);
  if (!r.ok || r.id === undefined) throw new Error('house not placed');
  return world.buildings[r.id]!;
}

/** Haus auf einer Kachel, die 4er-angrenzend (Ostseite) am Kontor-Footprint liegt. */
export function houseNearKontor(world: World): Building {
  const k = world.buildings[world.kontorId]!;
  const x = k.x + BUILDING_DEFS.kontor.w;
  forceGrass(world, x, k.y);
  return placedHouse(world, x, k.y);
}

/**
 * Haus mit Mitte-Abstand > 8 vom Kontor, also ausserhalb von dessen Versorgungsradius.
 * Trick: `placeBuilding` verlangt Versorgung. Daher wird kurz ein Markt daneben gebaut,
 * das Haus gesetzt und der Markt wieder abgerissen; Geld und Lager werden danach zurückgesetzt.
 */
export function houseFar(world: World): Building {
  const k = world.buildings[world.kontorId]!;
  const kc = center(BUILDING_DEFS.kontor, k.x, k.y);
  const supplyRadius = BUILDING_DEFS.kontor.supplyRadius ?? 0;
  const money = world.money;
  const stock = { ...world.stock };
  for (let y = 0; y < world.height - 2; y++) {
    for (let x = 0; x < world.width - 3; x++) {
      const h = center(BUILDING_DEFS.house, x, y);
      if (Math.hypot(h.cx - kc.cx, h.cy - kc.cy) <= supplyRadius + 1) continue;
      // Haus (x, y) plus Markt-Footprint (x+1.., y..y+1)
      const tiles = [
        [x, y],
        [x + 1, y],
        [x + 2, y],
        [x + 1, y + 1],
        [x + 2, y + 1],
      ] as const;
      if (!tiles.every(([px, py]) => world.tiles[idx(world, px, py)]!.buildingId === null))
        continue;
      for (const [px, py] of tiles) forceGrass(world, px, py);
      const m = placeBuilding(world, 'market', x + 1, y);
      if (!m.ok || m.id === undefined) throw new Error('helper market not placed');
      const house = placedHouse(world, x, y);
      demolish(world, m.id);
      world.money = money;
      world.stock = stock;
      return house;
    }
  }
  throw new Error('no far tile');
}
