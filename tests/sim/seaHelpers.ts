// Gemeinsame Testwelt für die Seefahrt-Stränge (M12 T02, P-10). Nur Tests, schreibt keine Saves.
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { generateForeignIslands, type Pt } from '../../src/sim/islands';
import { recomputeConnectivity } from '../../src/sim/roads';
import type { Building, Ship, World } from '../../src/sim/types';
import { createWorld, footprint, home, tileAt } from '../../src/sim/world';
import { SEED_D37 } from './seePins';

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
