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
