import { screenToTileF, screenToWorld, type Camera } from '../render/camera';
import { buildingHulls, footprintOrigin, pickBuilding, type Pt } from '../render/iso';
import type { Tool } from '../render/renderer';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { home, inBounds } from '../sim/world';
import type { World } from '../sim/types';

/**
 * Zielkachel unter einem Bildschirmpunkt (ISO D-13, D-14, §8); rein und DOM-frei.
 * Auswählen/Abreissen: Ursprung des Gebäudes, dessen Körperhülle getroffen wird, sonst Bodenkachel.
 * Bauen: Ursprung, bei dem der Cursor über der Footprint-Mitte liegt. Weg: immer die Bodenkachel.
 * `null` ausserhalb der Karte. Beim Bauen kann der Ursprung Teile ausserhalb der Karte haben;
 * das lehnt die Sim (`canPlace`) ab.
 */
export function targetTile(
  world: World,
  cam: Camera,
  tool: Tool,
  sx: number,
  sy: number,
): Pt | null {
  if (tool.kind === 'select' || tool.kind === 'demolish') {
    const w = screenToWorld(cam, sx, sy);
    const id = pickBuilding(buildingHulls(world), w.x, w.y);
    const b = id === null ? undefined : world.buildings[id];
    if (b) return { x: b.x, y: b.y };
  }
  const f = screenToTileF(cam, sx, sy);
  const t = { x: Math.floor(f.x), y: Math.floor(f.y) };
  if (!inBounds(home(world), t.x, t.y)) return null;
  if (tool.kind === 'build') {
    const def = BUILDING_DEFS[tool.defId];
    return footprintOrigin(f.x, f.y, def.w, def.h);
  }
  return t;
}
