// Gemeinsame Testwelt für die Seefahrt-Stränge (M12 T02, P-10). Nur Tests, schreibt keine Saves.
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { dockFor, generateForeignIslands, laneTicks, type Pt } from '../../src/sim/islands';
import { SHIP_TICKS_PER_SEA_TILE } from '../../src/sim/defs/sea';
import { recomputeConnectivity } from '../../src/sim/roads';
import type { Building, Ship, World } from '../../src/sim/types';
import { createWorld, footprint, home, tileAt } from '../../src/sim/world';
import { ISLAND_D30, ISLAND_D35, SEED_D30, SEED_D35, SEED_D37 } from './seePins';

/** Welt mit allen Freischaltungen; Standard-Seed mit bekanntem Seeweg (T00). */
export function seaWorld(seed: number = SEED_D37): World {
  return createWorld(seed, { unlockAll: true });
}

/** Erzeugte Fremdinsel `island` (1 = A, 2 = B) aus dem Generator. */
function placedIsland(w: World, island: number) {
  return generateForeignIslands(w.seed, home(w))[island - 1]!;
}

/** Legt `kontor2` am Kontorplatz der Insel als Literal an, ohne Kosten (bis T03 der einzige Weg). */
export function foundKontor2Literal(w: World, island: number): Building {
  const site = placedIsland(w, island).kontorSite;
  const id = w.nextBuildingId++;
  const building: Building = {
    id,
    defId: 'kontor2',
    x: site.x,
    y: site.y,
    connected: false,
    progress: 0,
    state: 'ok',
    island,
  };
  const isl = w.islands[island]!;
  w.buildings[id] = building;
  for (const p of footprint(BUILDING_DEFS.kontor2, site.x, site.y))
    tileAt(isl, p.x, p.y)!.buildingId = id;
  isl.kontorId = id;
  // Spiegelt R3 aus placeBuilding: Anker an die Anlegestelle, neues Inselarray (Caches fallen).
  isl.anchor = dockFor(
    isl.tiles.map((t) => t.terrain),
    isl.width,
    isl.height,
    site,
  );
  w.islands = w.islands.slice();
  recomputeConnectivity(w);
  return building;
}

/** Hängt ein Schiff als Literal an; Standard: im Hafen 0, ohne Ziel, leer, ohne Route. */
export function shipLiteral(w: World, part: Partial<Ship> = {}): Ship {
  const ship: Ship = {
    id: w.nextShipId++,
    port: 0,
    to: null,
    left: 0,
    cargo: {},
    route: null,
    homing: false,
    ...part,
  };
  w.ships.push(ship);
  return ship;
}

/** Plantagenplätze der Insel aus dem Generator (für T05, T06). */
export function plantationSites(w: World, island: number): Pt[] {
  return placedIsland(w, island).plantationSites;
}

/** Gepinnte (Seed, Insel) je Seeweg-Länge d; Pins aus tests/sim/seePins.ts (keine Suche zur Laufzeit). */
const LANE_PINS: Readonly<Record<number, readonly [number, number]>> = {
  30: [SEED_D30, ISLAND_D30],
  35: [SEED_D35, ISLAND_D35],
};

/** Welt mit Kontor auf der Insel `island` (≥ 1), deren Seeweg von der Heimat genau `d` Felder lang ist. */
export function laneWorld(d: number): { w: World; island: number } {
  const pin = LANE_PINS[d];
  if (pin === undefined) throw new Error(`laneWorld: kein Pin für d ${d}`);
  const [seed, island] = pin;
  const w = seaWorld(seed);
  const got = laneTicks(w.islands, 0, island);
  if (got !== SHIP_TICKS_PER_SEA_TILE * d)
    throw new Error(
      `laneWorld: Pin passt nicht mehr, d ${d} erwartet, ${got / SHIP_TICKS_PER_SEA_TILE} gemessen`,
    );
  foundKontor2Literal(w, island);
  return { w, island };
}
