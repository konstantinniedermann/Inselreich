// limits.ts — Obergrenzen der Darstellung (Spec 12.2). Darstellungswerte, keine Spielwerte.
/** Setzung Spec 12.2: [normal, reduziert]. */
export const CAPS = {
  walkers: [40, 12],
  gulls: [8, 3],
  smoke: [150, 50],
  rain: [350, 100],
  fire: [24, 8],
  clouds: [6, 0],
  glitter: [30, 0],
  fish: [20, 6],
  whales: [1, 1],
  flocks: [4, 2],
} as const;
export type CapName = keyof typeof CAPS;
export const cap = (name: CapName, reduce = false): number => CAPS[name][reduce ? 1 : 0];

/**
 * Gebirgsmassiv (H-R9, A6): Obergrenze des Teilstück-Caches (Summe der Offscreen-Flächen, RGBA-Bytes; Richtwert der
 * Spec 48 MB) und höchstens so viele neue Flächen je Frame, solange eine andere Zoomstufe als Ersatz bereitliegt
 * (verteilt den Aufbau nach einem Zoomwechsel auf mehrere Frames; gemessen ≈ 0,8 ms je Teilstück). Darstellungswerte.
 */
export const MASSIF_CACHE_MAX_BYTES = 48 * 1024 * 1024;
export const MASSIF_BUILDS_PER_FRAME = 8;
/**
 * Höchstens so viele Flächenpixel je Weltpixel und Achse (Zoomstufe × DPR gedeckelt): bei Zoom 2 und DPR 2 wird die
 * Fläche mit Faktor 2 gemalt und doppelt so gross gestempelt. Ohne Deckel passt ein bildfüllendes Massiv (gemessen
 * ≈ 59 MB bei 1920 × 1080) nicht unter die Bytegrenze und würde jeden Frame neu gerastert. Zoom 1 bei DPR 2
 * (Faktor 2) bleibt voll scharf. Entscheid lead-art H-R9 Runde 1.
 */
export const MASSIF_MAX_SCALE = 2;

const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

/** Anzahl Regenschlieren zur Stärke `w` (≤ w × CAP_RAIN). */
export const rainStreaks = (w: number, reduce = false): number =>
  Math.floor(clamp01(w) * cap('rain', reduce));

/** Anzahl Flammenzungen eines Feuers; bei `flames = 0` keine. */
export const fireTongues = (flames: number, reduce = false): number =>
  clamp01(flames) > 0 ? Math.ceil(clamp01(flames) * cap('fire', reduce)) : 0;

/** Obergrenze des Gebäude-Sprite-Caches (H-R6): Summe der Offscreen-Flächen in Bytes (RGBA), Darstellungswert. */
export const SPRITE_CACHE_MAX_BYTES = 64 * 1024 * 1024;
/** Obergrenze eines einzelnen Sprites (RGBA-Bytes); grössere Körper gehen den ungecachten Weg. */
export const SPRITE_MAX_BYTES = 4 * 1024 * 1024;
