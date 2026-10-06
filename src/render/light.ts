import { valueNoise } from '../sim/noise';
import { PALETTE, rgbOf } from './palette';

// light.ts — gemeinsame Helfer von Geländeebene (`terrain.ts`) und Gebirgsmassiv (`massif.ts`): Lichtrichtung und
// gedrehtes Wertrauschen. Rein, ohne Canvas; Darstellungswerte.

/** Richtung zum Licht im Kachelraum (D-11): Licht von links oben, normiert. */
export const LIGHT = { x: -3 / Math.sqrt(10), y: -1 / Math.sqrt(10) } as const;

/** Wertrauschen an gedrehten Koordinaten (R170: keine achsparallelen Flecken bzw. Grate). */
export function rotNoise(seed: number, fx: number, fy: number, freq: number, rot: number): number {
  const c = Math.cos(rot) * freq,
    s = Math.sin(rot) * freq;
  return valueNoise(seed, c * fx - s * fy, s * fx + c * fy);
}

const mix = (a: readonly number[], b: readonly number[], t: number): [number, number, number] => [
  a[0]! + (b[0]! - a[0]!) * t,
  a[1]! + (b[1]! - a[1]!) * t,
  a[2]! + (b[2]! - a[2]!) * t,
];
/**
 * Geröll-/Schuttband am Gebirgsfuss (Massiv und Geländeebene), L2: warmer Ocker statt kaltem Grau, rockLight mit
 * etwa 30 % earth und 30 % sandDry (Fussband = Wiese mit Kies).
 */
export const DEBRIS: readonly [number, number, number] = mix(
  mix(rgbOf(PALETTE.rockLight), rgbOf(PALETTE.earth), 0.3),
  rgbOf(PALETTE.sandDry),
  0.3,
);
/** Anteil der Schuttfarbe am Massivrand (Netzpunkte in massif.ts, Pixel in rocks.ts). */
export const DEBRIS_MIX = 0.6;

// ---------- Tonleiter (H-R11: aus massif.ts hierher, Gebirge und Boden teilen sie) ----------
//
// Gestufte Tonleiter für Licht auf Form (Stilrahmen S2): Ein stetiger Tonwert T (0…4, in Stufen) wird je Pixel mit
// `toneStep` auf ganze Stufen gerundet; der Übergang ist über `toneHalfWidth` 1–2 Ausgabe-px breit. `toneColor`
// liest die Farbe aus einer Rampe. Schattenstufen sind kühl (waterDeep/rockDark), Lichtstufen warm (sandDry).

export type Rgb = readonly [number, number, number];

/** Weiche Stufe 0…1 zwischen den Kanten `a` und `b` (smoothstep, geklemmt). */
export function smoothstep(a: number, b: number, t: number): number {
  const v = (t - a) / (b - a);
  const c = v < 0 ? 0 : v > 1 ? 1 : v;
  return c * c * (3 - 2 * c);
}
/** Lineare Mischung zweier Farben, `t` auf 0…1 geklemmt. */
export const mixRgb = (a: Rgb, b: Rgb, t: number): Rgb => {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
};
/** Grundfarben der Lichtsprache: Fels hell/mittel/dunkel, kühler Schattenton, warmer Lichtton. */
export const LIGHT_COLORS = {
  rock: rgbOf(PALETTE.rock),
  light: rgbOf(PALETTE.rockLight),
  dark: rgbOf(PALETTE.rockDark),
  cool: rgbOf(PALETTE.waterDeep),
  warm: rgbOf(PALETTE.sandDry),
} as const;
const P = LIGHT_COLORS;
/**
 * Tonstufen des Felses (A3), dunkel nach hell: Schattenseite kühl (rockDark mit waterDeep), Lichtseite warm
 * (rockLight mit sandDry ≤ 20 %).
 */
export const ROCK_TONES: readonly Rgb[] = [
  mixRgb(P.dark, P.cool, 0.22),
  mixRgb(mixRgb(P.dark, P.rock, 0.35), P.cool, 0.12),
  mixRgb(P.rock, P.dark, 0.12),
  mixRgb(mixRgb(P.rock, P.light, 0.55), P.warm, 0.08),
  mixRgb(P.light, P.warm, 0.18),
];
/** Breite der Tonkante in Ausgabepixeln (Pixel der gerasterten Fläche). */
export const TONE_EDGE_PX = 1.5;
/**
 * Halbe Übergangsbreite für `toneStep` (in Stufen) bei einem Gefälle von `g` Stufen je Ausgabepixel, so dass die
 * Kante `TONE_EDGE_PX` Pixel breit ist. Nach unten 0,002 (nie ganz hart, auch auf flachem Hang bleibt die Kante
 * schmal), nach oben 0,5 (steile Hänge). `edgePx` überschreibt die Kantenbreite (Boden: `GROUND_EDGE_PX`).
 */
export const toneHalfWidth = (g: number, edgePx: number = TONE_EDGE_PX): number =>
  Math.min(0.5, Math.max(0.002, 0.5 * edgePx * g));
/**
 * Stufung: T wird auf ganze Stufen gerundet, mit einem weichen Übergang der halben Breite `hw` (in Stufen) um jede
 * Stufengrenze k + 0,5. Der Rasterizer setzt `hw` aus dem Gefälle von T so, dass der Übergang 1–2 px breit ist.
 */
export function toneStep(t: number, hw: number): number {
  const n = Math.floor(t),
    f = t - n;
  return n + (hw <= 0 ? (f >= 0.5 ? 1 : 0) : smoothstep(0.5 - hw, 0.5 + hw, f));
}
/** Farbe zur gestuften Tonstufe `st` (0…Rampenlänge − 1), Rampe `ramp`. */
export function toneColor(st: number, ramp: readonly Rgb[] = ROCK_TONES): Rgb {
  const n = Math.max(0, Math.min(ramp.length - 1, Math.floor(st)));
  return n >= ramp.length - 1 ? ramp[n]! : mixRgb(ramp[n]!, ramp[n + 1]!, st - n);
}
