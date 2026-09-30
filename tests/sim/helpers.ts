import { placeBuilding } from '../../src/sim/build';
import { newHouseState } from '../../src/sim/population';
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

export function forceGrass(world: World, x: number, y: number): void {
  const t = world.tiles[idx(world, x, y)]!;
  t.terrain = 'grass';
  t.buildingId = null;
  t.road = false;
}

/** Erzwingt ein w×h-Rechteck aus Gelände `terrain` (frei, ohne Weg), ab (x0, y0). */
export function forceRect(
  world: World,
  x0: number,
  y0: number,
  w: number,
  h: number,
  terrain: 'grass' | 'water',
): void {
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) {
      forceGrass(world, x, y);
      world.tiles[idx(world, x, y)]!.terrain = terrain;
    }
  }
}

/**
 * Platziert Kapelle oder Schule auf erzwungenem Gras und setzt `connected` manuell (Anbindung ist
 * in roads.test.ts getestet). Geld und Lager bleiben unverändert, damit Tests sauber vergleichen.
 */
export function placeService(
  world: World,
  defId: 'chapel' | 'school',
  x: number,
  y: number,
): Building {
  const money = world.money;
  const stock = { ...world.stock };
  forceRect(world, x, y, BUILDING_DEFS[defId].w, BUILDING_DEFS[defId].h, 'grass');
  // Ausreichend Mittel für die Baukosten (Schule braucht mehr Stein als das Startlager)
  world.money = 1_000_000;
  for (const good of Object.keys(world.stock) as (keyof typeof world.stock)[])
    world.stock[good] = 100;
  const r = placeBuilding(world, defId, x, y);
  if (!r.ok || r.id === undefined) throw new Error(`${defId} not placed`);
  world.money = money;
  world.stock = stock;
  const b = world.buildings[r.id]!;
  b.connected = true;
  return b;
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
 * Wird direkt eingefügt, ohne `placeBuilding`: die Platzierung verweigert unversorgte Orte zu Recht.
 */
export function houseFar(world: World): Building {
  const k = world.buildings[world.kontorId]!;
  const kc = center(BUILDING_DEFS.kontor, k.x, k.y);
  const supplyRadius = BUILDING_DEFS.kontor.supplyRadius ?? 0;
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const h = center(BUILDING_DEFS.house, x, y);
      if (Math.hypot(h.cx - kc.cx, h.cy - kc.cy) <= supplyRadius + 1) continue;
      if (world.tiles[idx(world, x, y)]!.buildingId !== null) continue;
      forceGrass(world, x, y);
      const id = world.nextBuildingId++;
      const house: Building = {
        id,
        defId: 'house',
        x,
        y,
        connected: false,
        progress: 0,
        state: 'ok',
        house: newHouseState(world),
      };
      world.buildings[id] = house;
      world.tiles[idx(world, x, y)]!.buildingId = id;
      return house;
    }
  }
  throw new Error('no far tile');
}
