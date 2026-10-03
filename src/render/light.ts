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
/** Helles Geröll-/Schuttband am Gebirgsfuss (Massiv und Geländeebene): rock/rockLight mit 15 % sandDry. */
export const DEBRIS: readonly [number, number, number] = mix(
  mix(rgbOf(PALETTE.rock), rgbOf(PALETTE.rockLight), 0.6),
  rgbOf(PALETTE.sandDry),
  0.15,
);
/** Anteil der Schuttfarbe am Massivrand (Netzpunkte in massif.ts, Pixel in rocks.ts). */
export const DEBRIS_MIX = 0.9;
