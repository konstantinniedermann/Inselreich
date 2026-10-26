import { serviceRadiusOf } from './council';
import { BUILDING_DEFS } from './defs/buildings';
import type { Building, World } from './types';
import { center } from './world';

/** Geschützt: eine angebundene Wache (`fireProtection`) mit Mittenabstand ≤ ihrem `serviceRadius`; `candidates` (Wachen aus dem Level-Kontext) ersetzt nur die Suche über alle Gebäude. */
export function isProtected(world: World, b: Building, candidates?: readonly Building[]): boolean {
  const c = center(BUILDING_DEFS[b.defId], b.x, b.y);
  return (candidates ?? Object.values(world.buildings)).some((s) => {
    const def = BUILDING_DEFS[s.defId];
    if (def.fireProtection !== true || !s.connected || s.island !== b.island) return false;
    const sc = center(def, s.x, s.y);
    return Math.hypot(sc.cx - c.cx, sc.cy - c.cy) <= (serviceRadiusOf(world, s.defId) ?? 0);
  });
}
