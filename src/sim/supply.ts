import { BUILDING_DEFS } from './defs/buildings';
import type { Building, World } from './types';
import { center } from './world';

/** Versorgende Gebäude: das Kontor immer, Märkte nur, wenn sie angebunden sind. */
export function supplyBuildings(world: World): Building[] {
  return Object.values(world.buildings).filter(
    (b) => b.defId === 'kontor' || (b.defId === 'market' && b.connected),
  );
}

/** Liegt (cx, cy) im Versorgungsradius (Mitte zu Mitte) eines versorgenden Gebäudes? */
export function inSupplyRange(world: World, cx: number, cy: number): boolean {
  return supplyBuildings(world).some((b) => {
    const def = BUILDING_DEFS[b.defId];
    const c = center(def, b.x, b.y);
    return Math.hypot(cx - c.cx, cy - c.cy) <= (def.supplyRadius ?? 0);
  });
}
