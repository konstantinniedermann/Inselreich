// camera.ts — alles, was eine Kamera braucht (Setzung Spec D-03 bis D-06, ISO §4)
import { H_TOWER, ISO_H, ISO_W, ZOOM_STEPS, project, unproject, type Pt } from './iso';
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
/** Archipel-Kacheln, x1/y1 exklusiv. */
export interface TileRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  /** Konvexe Hülle (gegen den Uhrzeigersinn), in der die Bildmitte zusätzlich bleiben muss. */
  hull?: readonly Pt[];
}
/** Konvexe Hülle (Monotone Chain), gegen den Uhrzeigersinn; Duplikate und kollineare Punkte entfallen. */
export function convexHull(points: readonly Pt[]): Pt[] {
  const pts = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const u = pts.filter((p, i) => i === 0 || p.x !== pts[i - 1]!.x || p.y !== pts[i - 1]!.y);
  if (u.length < 3) return u.map((p) => ({ x: p.x, y: p.y }));
  const cross = (o: Pt, a: Pt, b: Pt): number =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const half = (seq: readonly Pt[]): Pt[] => {
    const h: Pt[] = [];
    for (const p of seq) {
      while (h.length >= 2 && cross(h[h.length - 2]!, h[h.length - 1]!, p) <= 0) h.pop();
      h.push(p);
    }
    h.pop();
    return h;
  };
  return [...half(u), ...half([...u].reverse())].map((p) => ({ x: p.x, y: p.y }));
}
/** Punkt innen bleibt, aussen der nächste Randpunkt der konvexen Hülle (gegen den Uhrzeigersinn). */
export function clampToPolygon(p: Pt, hull: readonly Pt[]): Pt {
  const n = hull.length;
  if (n === 0) return p;
  if (
    n >= 3 &&
    hull.every((a, i) => {
      const b = hull[(i + 1) % n]!;
      return (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x) >= 0;
    })
  )
    return p;
  let best = hull[0]!,
    bestD = Infinity;
  for (let i = 0; i < n; i++) {
    const a = hull[i]!,
      b = hull[(i + 1) % n]!;
    const dx = b.x - a.x,
      dy = b.y - a.y,
      l = dx * dx + dy * dy;
    const t = l === 0 ? 0 : Math.min(1, Math.max(0, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l));
    const q = { x: a.x + t * dx, y: a.y + t * dy };
    const d = (p.x - q.x) ** 2 + (p.y - q.y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = q;
    }
  }
  return { x: best.x, y: best.y };
}
export function clampToRect(c: Camera, r: TileRect, viewW: number, viewH: number): void {
  const hw = viewW / 2 / c.zoom,
    hh = viewH / 2 / c.zoom;
  const t = unproject(c.x + hw, c.y + hh);
  let fx = Number.isFinite(t.x) ? Math.min(Math.max(t.x, r.x0), r.x1) : (r.x0 + r.x1) / 2;
  let fy = Number.isFinite(t.y) ? Math.min(Math.max(t.y, r.y0), r.y1) : (r.y0 + r.y1) / 2;
  if (r.hull && r.hull.length > 0) ({ x: fx, y: fy } = clampToPolygon({ x: fx, y: fy }, r.hull));
  const p = project(fx, fy);
  c.x = p.x - hw;
  c.y = p.y - hh;
}
export function clampToMap(c: Camera, map: MapSize, viewW: number, viewH: number): void {
  clampToRect(c, { x0: 0, y0: 0, x1: map.w, y1: map.h }, viewW, viewH);
}
const asRect = (b: MapSize | TileRect): TileRect =>
  'x0' in b ? b : { x0: 0, y0: 0, x1: b.w, y1: b.h };
export function zoomAt(
  c: Camera,
  f: number,
  sx: number,
  sy: number,
  view: View,
  bounds: MapSize | TileRect,
): void {
  const nz = Math.min(ZOOM_STEPS.at(-1)!, Math.max(ZOOM_STEPS[0], c.zoom * f));
  const w = screenToWorld(c, sx, sy);
  c.zoom = Number.isFinite(nz) ? nz : 1;
  c.x = w.x - sx / c.zoom;
  c.y = w.y - sy / c.zoom;
  clampToRect(c, asRect(bounds), view.w, view.h);
}
export function centerOn(
  c: Camera,
  fx: number,
  fy: number,
  view: View,
  bounds: MapSize | TileRect,
): void {
  const p = project(fx, fy);
  c.x = p.x - view.w / 2 / c.zoom;
  c.y = p.y - view.h / 2 / c.zoom;
  clampToRect(c, asRect(bounds), view.w, view.h);
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
