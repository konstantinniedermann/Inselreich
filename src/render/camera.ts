// camera.ts — alles, was eine Kamera braucht (Setzung Spec D-03 bis D-06, ISO §4)
import { H_TOWER, ISO_H, ISO_W, project, unproject, type Pt } from './iso';
export interface Camera {
  x: number;
  y: number;
  zoom: number;
}
export const createCamera = (): Camera => ({ x: 0, y: 0, zoom: 1 });
export interface MapSize {
  w: number;
  h: number;
} // Kacheln
export interface View {
  w: number;
  h: number;
} // CSS-Pixel
export interface TileRange {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
} // inklusive; leer, wenn x1 < x0 oder y1 < y0
export const screenToWorld = (c: Camera, sx: number, sy: number): Pt => ({
  x: c.x + sx / c.zoom,
  y: c.y + sy / c.zoom,
});
export const worldToScreen = (c: Camera, p: Pt): Pt => ({
  x: (p.x - c.x) * c.zoom,
  y: (p.y - c.y) * c.zoom,
});
export const screenToTileF = (c: Camera, sx: number, sy: number): Pt => {
  const w = screenToWorld(c, sx, sy);
  return unproject(w.x, w.y);
};
export const screenToTile = (c: Camera, sx: number, sy: number): Pt => {
  const f = screenToTileF(c, sx, sy);
  return { x: Math.floor(f.x), y: Math.floor(f.y) };
};
/** Obere Ecke der Raute (bzw. Bildpunkt eines Kachelpunkts), gerundet auf ganze Pixel. */
export const tileToScreen = (c: Camera, tx: number, ty: number): Pt => {
  const p = project(tx, ty);
  return { x: Math.round((p.x - c.x) * c.zoom), y: Math.round((p.y - c.y) * c.zoom) };
};
/** Oben, rechts, unten, links; Nachbarrauten teilen ihre Ecken pixelgleich. */
export const tileCorners = (c: Camera, tx: number, ty: number): [Pt, Pt, Pt, Pt] => [
  tileToScreen(c, tx, ty),
  tileToScreen(c, tx + 1, ty),
  tileToScreen(c, tx + 1, ty + 1),
  tileToScreen(c, tx, ty + 1),
];
export function clampToMap(c: Camera, map: MapSize, viewW: number, viewH: number): void {
  const hw = viewW / 2 / c.zoom,
    hh = viewH / 2 / c.zoom;
  const t = unproject(c.x + hw, c.y + hh);
  const fx = Number.isFinite(t.x) ? Math.min(Math.max(t.x, 0), map.w) : map.w / 2;
  const fy = Number.isFinite(t.y) ? Math.min(Math.max(t.y, 0), map.h) : map.h / 2;
  const p = project(fx, fy);
  c.x = p.x - hw;
  c.y = p.y - hh;
}
export function zoomAt(
  c: Camera,
  f: number,
  sx: number,
  sy: number,
  view: View,
  map: MapSize,
): void {
  const nz = Math.min(2, Math.max(0.5, c.zoom * f));
  const w = screenToWorld(c, sx, sy);
  c.zoom = Number.isFinite(nz) ? nz : 1;
  c.x = w.x - sx / c.zoom;
  c.y = w.y - sy / c.zoom;
  clampToMap(c, map, view.w, view.h);
}
export function centerOn(c: Camera, fx: number, fy: number, view: View, map: MapSize): void {
  const p = project(fx, fy);
  c.x = p.x - view.w / 2 / c.zoom;
  c.y = p.y - view.h / 2 / c.zoom;
  clampToMap(c, map, view.w, view.h);
}
export function visibleTileRange(c: Camera, view: View, map: MapSize): TileRange {
  const x0 = c.x,
    x1 = c.x + view.w / c.zoom,
    y0 = c.y,
    y1 = c.y + view.h / c.zoom + H_TOWER; // hohe Sprites ragen von unten ins Bild
  const q = [unproject(x0, y0), unproject(x1, y0), unproject(x0, y1), unproject(x1, y1)];
  const xs = q.map((p) => p.x),
    ys = q.map((p) => p.y);
  return {
    x0: Math.max(0, Math.floor(Math.min(...xs))),
    y0: Math.max(0, Math.floor(Math.min(...ys))),
    x1: Math.min(map.w - 1, Math.floor(Math.max(...xs))),
    y1: Math.min(map.h - 1, Math.floor(Math.max(...ys))),
  };
}
/** Bodenmatrix für `ctx.transform`: Texturpixel (T je Kachel) → CSS-Pixel (D-06). */
export function groundMatrix(
  c: Camera,
  texPerTile: number,
): [number, number, number, number, number, number] {
  const a = (c.zoom * (ISO_W / 2)) / texPerTile,
    b = (c.zoom * (ISO_H / 2)) / texPerTile;
  return [a, b, -a, b, -c.x * c.zoom, -c.y * c.zoom];
}
