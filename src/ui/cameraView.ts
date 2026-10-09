import { centerOn, clampToRect, type Camera, type TileRect } from '../render/camera';

/**
 * Kartenhöhe, die der Kamera-Grenze zugrunde liegt: die Bauleisten-Einträge liegen als Overlay über dem unteren
 * Kartenrand und verdecken ihn, also zählt nur der freie Teil (die Overlay-Höhe kommt aus dem DOM).
 */
export function visibleViewHeight(canvasH: number, overlayH: number): number {
  return Math.max(1, canvasH - Math.max(0, overlayH));
}

/** Liefert eine Funktion, die die sichtbare Höhe bei jedem Aufruf neu aus Canvas und Overlay bestimmt (kein Zwischenspeicher). */
export function makeVisibleHeight(
  canvas: { readonly clientHeight: number },
  overlayH: () => number,
): () => number {
  return () => visibleViewHeight(canvas.clientHeight, overlayH());
}

/** Klemmt die Kamera in den Rahmen, gerechnet mit der sichtbaren Höhe (alle Masse in CSS-Pixeln). */
export function clampVisible(
  cam: Camera,
  bounds: TileRect,
  viewW: number,
  canvasH: number,
  overlayH: number,
): void {
  clampToRect(cam, bounds, viewW, visibleViewHeight(canvasH, overlayH));
}

/** Zentriert auf eine Kachel-Position in der Mitte des sichtbaren Teils (über dem Overlay) und klemmt. */
export function centerOnVisible(
  cam: Camera,
  fx: number,
  fy: number,
  viewW: number,
  canvasH: number,
  overlayH: number,
  bounds: TileRect,
): void {
  centerOn(cam, fx, fy, { w: viewW, h: visibleViewHeight(canvasH, overlayH) }, bounds);
}
