export const TILE = 32;

export interface Camera {
  x: number;
  y: number;
  zoom: number;
}

export const createCamera = (): Camera => ({ x: 0, y: 0, zoom: 1 });

export function clampCamera(
  c: Camera,
  worldW: number,
  worldH: number,
  viewW: number,
  viewH: number,
): void {
  const maxX = Math.max(0, worldW - viewW / c.zoom);
  const maxY = Math.max(0, worldH - viewH / c.zoom);
  c.x = Math.min(Math.max(0, c.x), maxX);
  c.y = Math.min(Math.max(0, c.y), maxY);
}

export function zoomAt(
  c: Camera,
  f: number,
  sx: number,
  sy: number,
  vw: number,
  vh: number,
  ww: number,
  wh: number,
): void {
  const nz = Math.min(2, Math.max(0.5, c.zoom * f));
  const wx = c.x + sx / c.zoom; // Weltpunkt unter dem Cursor
  const wy = c.y + sy / c.zoom;
  c.zoom = nz;
  c.x = wx - sx / nz;
  c.y = wy - sy / nz;
  clampCamera(c, ww, wh, vw, vh);
}

export const screenToTile = (c: Camera, sx: number, sy: number): { x: number; y: number } => ({
  x: Math.floor((c.x + sx / c.zoom) / TILE),
  y: Math.floor((c.y + sy / c.zoom) / TILE),
});

export const tileToScreen = (c: Camera, tx: number, ty: number): { x: number; y: number } => ({
  x: (tx * TILE - c.x) * c.zoom,
  y: (ty * TILE - c.y) * c.zoom,
});
