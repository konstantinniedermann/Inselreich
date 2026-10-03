import { valueNoise } from '../sim/noise';

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
