import { BUILDING_DEFS } from './defs/buildings';
import { isSupplySource } from './coverage';
import type { Building, World } from './types';
import { center, isKontor } from './world';

const isOwnKontor = (world: World, b: Building): boolean =>
  isKontor(b.defId) && world.islands[b.island]?.kontorId === b.id;

/** Versorgende Gebäude einer Insel: ihr Kontor (auch Kontor II) immer, Märkte nur, wenn sie angebunden sind. */
export function supplyBuildings(world: World, island: number): Building[] {
  return Object.values(world.buildings).filter(
    (b) => b.island === island && (isSupplySource(world, b) || isOwnKontor(world, b)),
  );
}

/**
 * Liegt (cx, cy) im Versorgungsradius (Mitte zu Mitte) eines versorgenden Gebäudes der Insel?
 * `sources` (aus `buildCoverage`) erspart das Durchsuchen aller Gebäude.
 */
export function inSupplyRange(
  world: World,
  island: number,
  cx: number,
  cy: number,
  sources: Building[] = supplyBuildings(world, island),
): boolean {
  return sources.some((b) => {
    const def = BUILDING_DEFS[b.defId];
    const c = center(def, b.x, b.y);
    return Math.hypot(cx - c.cx, cy - c.cy) <= (def.supplyRadius ?? 0);
  });
}
