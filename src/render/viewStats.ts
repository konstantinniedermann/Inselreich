import { homeBuildings } from './homeBuildings';
// viewStats.ts — Sichtbezug für den Umgebungsklang (Spec 7.2, ISO §4). Reine Funktion, liest die Welt nur.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import type { World } from '../sim/types';
import { home, center } from '../sim/world';
import { visibleTileRange, worldToScreen, type Camera } from './camera';
import { project } from './iso';

export interface ViewStats {
  water: number;
  green: number;
  forest: number;
  rock: number;
  coast: number;
  inhabitants: number;
  zoom: number;
}

const KEY = {
  water: 'water',
  grass: 'green',
  forest: 'forest',
  mountain: 'rock',
  sand: 'coast',
} as const;
const SHARES = ['water', 'green', 'forest', 'rock', 'coast'] as const;

/**
 * Anteile der sichtbaren Kacheln je Terrain (Summe 1) und Einwohner in sichtbaren Häusern. Gezählt wird, was
 * mit der Mitte im Bild liegt; die Box aus `visibleTileRange` ist etwa doppelt so gross und verfälschte sonst
 * die Anteile. Ohne zählbare Kachel (Ausschnitt ausserhalb der Karte) gilt offenes Meer: water 1.
 */
export function viewStats(world: World, cam: Camera, view: { w: number; h: number }): ViewStats {
  const isl = home(world);
  const r = visibleTileRange(cam, view, { w: isl.width, h: isl.height });
  const out: ViewStats = {
    water: 0,
    green: 0,
    forest: 0,
    rock: 0,
    coast: 0,
    inhabitants: 0,
    zoom: cam.zoom,
  };
  const inView = (fx: number, fy: number): boolean => {
    const p = worldToScreen(cam, project(fx, fy));
    return p.x >= 0 && p.x < view.w && p.y >= 0 && p.y < view.h;
  };
  let n = 0;
  for (let y = r.y0; y <= r.y1; y++)
    for (let x = r.x0; x <= r.x1; x++) {
      if (!inView(x + 0.5, y + 0.5)) continue;
      const t = isl.tiles[y * isl.width + x];
      if (!t) continue;
      out[KEY[t.terrain]] += 1;
      n++;
    }
  if (n === 0) return { ...out, water: 1 };
  for (const k of SHARES) out[k] /= n;
  for (const b of homeBuildings(world)) {
    if (!b.house) continue;
    const c = center(BUILDING_DEFS[b.defId], b.x, b.y);
    if (inView(c.cx, c.cy)) out.inhabitants += b.house.inhabitants;
  }
  return out;
}
