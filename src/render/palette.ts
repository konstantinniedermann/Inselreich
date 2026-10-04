// palette.ts — alle Farben des Renders (Spec 4.2). Andere Module leiten Zwischentöne daraus ab.
export const PALETTE = {
  waterDeep: '#1f5a7a',
  waterMid: '#2f7f9a',
  waterShallow: '#4fb3b0',
  foam: '#f4f1e6',
  sandDry: '#e3cf98',
  sandWet: '#c9b27a',
  grassLight: '#8cbf5a',
  grass: '#6fa84a',
  grassDark: '#557f3a',
  crown: '#2f6b35',
  crownLight: '#4a8a44',
  rock: '#8f8676',
  rockLight: '#b8ad98',
  rockDark: '#5f584d',
  earth: '#a07a4f',
  earthEdge: '#7d5d3a',
  roofThatch: '#c9a24f',
  roofTerracotta: '#a65b3f',
  roofTerracottaDark: '#8a4a3a',
  roofWood: '#8a6a3f',
  roofSlate: '#4f6478',
  roofTimber: '#6b4a2b',
  roofCopper: '#5e9488', // M8 R1: Kupferdach mit Grünspan (Kaufmannshaus)
  wallLime: '#efe6d2',
  wallTimber: '#5a3d25',
  wallStone: '#b9ad97',
  lightMorning: '#ffd9a0',
  lightEvening: '#ff9f5a',
  lightNight: '#2a3a6a',
  window: '#ffb65c',
  signalRed: '#ff3b5c',
  signalYellow: '#ffe000',
  signalWarn: '#ff6726',
  signalOk: '#2ee6a8',
} as const;
export type PaletteName = keyof typeof PALETTE;

/** Schlagschatten (Spec 4.2, `shadow`); kein Hex, deshalb nicht in `PALETTE`. */
export const SHADOW = 'rgba(20,35,20,0.35)';

export const SIGNAL_NAMES = ['signalRed', 'signalYellow', 'signalWarn', 'signalOk'] as const;
export const SURFACE_NAMES = [
  'waterDeep',
  'waterMid',
  'waterShallow',
  'foam',
  'sandDry',
  'sandWet',
  'grassLight',
  'grass',
  'grassDark',
  'crown',
  'crownLight',
  'rock',
  'rockLight',
  'rockDark',
  'earth',
  'earthEdge',
  'roofThatch',
  'roofTerracotta',
  'roofTerracottaDark',
  'roofWood',
  'roofSlate',
  'roofTimber',
  'roofCopper',
  'wallLime',
  'wallTimber',
  'wallStone',
] as const satisfies readonly PaletteName[];

export function rgbOf(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mixHex(a: string, b: string, t: number): string {
  const p = rgbOfCss(a),
    q = rgbOfCss(b),
    k = Math.min(1, Math.max(0, t));
  return `rgb(${p.map((v, i) => Math.round(v + (q[i]! - v) * k)).join(',')})`;
}
export function rgbaOf(hex: string, alpha: number): string {
  const [r, g, b] = rgbOf(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Farbe aus `rgb(r,g,b)` bzw. `#rrggbb` als Tripel (für Zwischentöne aus `mixHex`). */
export function rgbOfCss(css: string): [number, number, number] {
  if (css.startsWith('#')) return rgbOf(css);
  const m = /(\d+),(\d+),(\d+)/.exec(css);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
}

/** Waldboden (Spec 4.4 I5: nicht farbnah zum alten Waldgrund #3d7a3a): moosig-erdiges Dunkelgrün aus Palettenfarben. */
export const FOREST_FLOOR = mixHex(PALETTE.crown, PALETTE.wallTimber, 0.4);

// --- Ein Licht (H-R10, R211): warme Lichter und kühle Schatten statt Weiss und Schwarz (Stilrahmen S1, S4) ---

/** Lichtton (warm): Lichtseiten, Oberflächen und Kronenkappen mischen hierhin, nie zu Weiss. */
export const LIGHT_TONE = PALETTE.sandDry;
/** Schattenton (kühl): Mischung aus `waterDeep` und `rockDark` (Startwert 50/50), nie Schwarz. */
export const SHADE_TONE = mixHex(PALETTE.waterDeep, PALETTE.rockDark, 0.5);
/** Tiefer Eigenton für Fenster, Türen, Öffnungen und Silhouetten: SHADE_TONE auf 45 % Helligkeit, nie Schwarz. */
export const INK_TONE = `rgb(${rgbOfCss(SHADE_TONE)
  .map((v) => Math.round(v * 0.45))
  .join(',')})`;
/** Mischt `color` (`#rrggbb` oder `rgb(r,g,b)`) um den Anteil `t` zum warmen Lichtton. */
export const toLight = (color: string, t: number): string => mixHex(color, LIGHT_TONE, t);
/** Mischt `color` um den Anteil `t` zum kühlen Schattenton. */
export const toShade = (color: string, t: number): string => mixHex(color, SHADE_TONE, t);
/** Mischt `color` um den Anteil `t` zum tiefen Eigenton (dunkle Details, Kontur). */
export const toInk = (color: string, t: number): string => mixHex(color, INK_TONE, t);
/** Schattenseite einer Fläche: kühler Schattenton plus ein Hauch tiefer Eigenton, damit auch dunkle Töne dunkler werden. */
export const shadeSide = (color: string, t: number): string => toShade(toInk(color, 0.12), t);
