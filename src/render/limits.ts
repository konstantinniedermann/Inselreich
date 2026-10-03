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
 * Felsstempel je Frame [normal, reduziert] (H-R8). Bei Zoom 0,5 und 1080p sind rund 1000 Gebirgskacheln im Bild; mehr
 * als 600 Stempel verbessern die Lesbarkeit nicht, kosten aber je ein drawImage; reduziert ein Drittel. Eigene
 * Konstante, damit die Setzungen von `CAPS` (Spec 12.2) unverändert bleiben.
 */
export const ROCK_CAP = [600, 200] as const;
export const rockCap = (reduce = false): number => ROCK_CAP[reduce ? 1 : 0];

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
