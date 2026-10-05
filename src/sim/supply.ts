import { BUILDING_DEFS } from './defs/buildings';
import type { Building, World } from './types';
import { center } from './world';

/** Versorgende Gebäude einer Insel: ihr Kontor immer, Märkte der Insel nur, wenn sie angebunden sind. */
export function supplyBuildings(world: World, island: number): Building[] {
  const kontorId = world.islands[island]?.kontorId;
  return Object.values(world.buildings).filter(
    (b) =>
      b.island === island &&
      ((b.defId === 'kontor' && b.id === kontorId) || (b.defId === 'market' && b.connected)),
  );
}

/** Liegt (cx, cy) im Versorgungsradius (Mitte zu Mitte) eines versorgenden Gebäudes der Insel? */
export function inSupplyRange(world: World, island: number, cx: number, cy: number): boolean {
  return supplyBuildings(world, island).some((b) => {
    const def = BUILDING_DEFS[b.defId];
    const c = center(def, b.x, b.y);
    return Math.hypot(cx - c.cx, cy - c.cy) <= (def.supplyRadius ?? 0);
  });
}
