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
} as const;
export type CapName = keyof typeof CAPS;
export const cap = (name: CapName, reduce = false): number => CAPS[name][reduce ? 1 : 0];

const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

/** Anzahl Regenschlieren zur Stärke `w` (≤ w × CAP_RAIN). */
export const rainStreaks = (w: number, reduce = false): number =>
  Math.floor(clamp01(w) * cap('rain', reduce));

/** Anzahl Flammenzungen eines Feuers; bei `flames = 0` keine. */
export const fireTongues = (flames: number, reduce = false): number =>
  clamp01(flames) > 0 ? Math.ceil(clamp01(flames) * cap('fire', reduce)) : 0;
