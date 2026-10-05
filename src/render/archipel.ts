// archipel.ts — Archipel-Mathematik (Spec M12 Anhang 02 D/F). Darstellungswerte, keine Spielwerte; rein, ohne Weltzugriff.
import type { Island } from '../sim/types';
import { screenToTileF, type Camera, type TileRect, type View } from './camera';
import { H_TOWER, project } from './iso';

export type ArchipelView = 'sea' | 'jump';
export const ARCHIPEL_VIEW: ArchipelView = 'sea'; // Streichvariante B: 'jump'
export const CAMERA_MARGIN = 8; // Kacheln um den Archipel-Rahmen
export type Placed = Pick<Island, 'ox' | 'oy' | 'width' | 'height'>;
export type { TileRect };

/** Kamera, mit der Insel `isl` in Inselkoordinaten gezeichnet wird (project ist linear). */
export function islandCam(c: Camera, isl: Placed): Camera {
  const p = project(isl.ox, isl.oy);
  return { x: c.x - p.x, y: c.y - p.y, zoom: c.zoom };
}

function isVisible(c: Camera, view: View, isl: Placed): boolean {
  const ps = [
    project(isl.ox, isl.oy),
    project(isl.ox + isl.width, isl.oy),
    project(isl.ox, isl.oy + isl.height),
    project(isl.ox + isl.width, isl.oy + isl.height),
  ];
  const xs = ps.map((p) => p.x),
    ys = ps.map((p) => p.y);
  const x0 = Math.min(...xs),
    x1 = Math.max(...xs),
    y0 = Math.min(...ys) - H_TOWER,
    y1 = Math.max(...ys);
  return x1 >= c.x && x0 <= c.x + view.w / c.zoom && y1 >= c.y && y0 <= c.y + view.h / c.zoom;
}

/** Indizes der sichtbaren Inseln, nach `ox + oy` aufsteigend (Tiefenfolge), dann Index. */
export function visibleIslands(
  c: Camera,
  view: View,
  islands: readonly Placed[],
  active = 0,
  mode: ArchipelView = ARCHIPEL_VIEW,
): number[] {
  if (mode === 'jump') {
    const a = islands[active];
    return a && isVisible(c, view, a) ? [active] : [];
  }
  return islands
    .map((isl, i) => ({ isl, i }))
    .filter(({ isl }) => isVisible(c, view, isl))
    .sort((p, q) => p.isl.ox + p.isl.oy - (q.isl.ox + q.isl.oy) || p.i - q.i)
    .map(({ i }) => i);
}

/** Insel und Kachel (Inselkoordinaten) unter dem Bildpunkt, sonst null (Meer). */
export function pickArchipel(
  c: Camera,
  sx: number,
  sy: number,
  islands: readonly Placed[],
  active = 0,
  mode: ArchipelView = ARCHIPEL_VIEW,
): { island: number; x: number; y: number } | null {
  const f = screenToTileF(c, sx, sy);
  const hit = (i: number): { island: number; x: number; y: number } | null => {
    const isl = islands[i];
    if (!isl) return null;
    const x = f.x - isl.ox,
      y = f.y - isl.oy;
    if (x < 0 || y < 0 || x >= isl.width || y >= isl.height) return null;
    return { island: i, x: Math.floor(x), y: Math.floor(y) };
  };
  if (mode === 'jump') return hit(active);
  for (let i = 0; i < islands.length; i++) {
    const r = hit(i);
    if (r) return r;
  }
  return null;
}

/** Umschliessendes Rechteck aller Inseln in Archipel-Kacheln. */
export function archipelRect(islands: readonly Placed[]): TileRect {
  if (islands.length === 0) return { x0: 0, y0: 0, x1: 0, y1: 0 };
  return {
    x0: Math.min(...islands.map((i) => i.ox)),
    y0: Math.min(...islands.map((i) => i.oy)),
    x1: Math.max(...islands.map((i) => i.ox + i.width)),
    y1: Math.max(...islands.map((i) => i.oy + i.height)),
  };
}

/** Bereich, in dem die Bildmitte der Kamera liegen darf. */
export function cameraBounds(
  islands: readonly Placed[],
  active = 0,
  mode: ArchipelView = ARCHIPEL_VIEW,
): TileRect {
  if (mode === 'jump') return archipelRect(islands[active] ? [islands[active]] : []);
  const r = archipelRect(islands);
  return {
    x0: r.x0 - CAMERA_MARGIN,
    y0: r.y0 - CAMERA_MARGIN,
    x1: r.x1 + CAMERA_MARGIN,
    y1: r.y1 + CAMERA_MARGIN,
  };
}
