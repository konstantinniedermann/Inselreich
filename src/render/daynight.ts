import type { Building, BuildingDef } from '../sim/types';

export const DAY_TICKS = 6000; // ein Tag = 10 Minuten bei 1x
export type Phase = 'day' | 'evening' | 'night' | 'morning';
export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'storm';
export interface Weather {
  kind: WeatherKind;
  w: number;
}
type Mul = [number, number, number];
// Setzung Spec 6.1: [t, mul, windows]; linear interpoliert, t = 1 schliesst an t = 0 an.
const STOPS: ReadonlyArray<readonly [number, Mul, number]> = [
  [0, [1, 1, 1], 0],
  [0.28, [1, 1, 1], 0],
  [0.36, [1, 0.887, 0.806], 0],
  [0.42, [0.867, 0.82, 0.81], 0.6],
  [0.47, [0.733, 0.753, 0.813], 1],
  [0.72, [0.733, 0.753, 0.813], 1],
  [0.78, [1, 0.967, 0.918], 0.2],
  [0.86, [1, 1, 1], 0],
  [1, [1, 1, 1], 0],
];
const frac = (tick: number): number => (((tick % DAY_TICKS) + DAY_TICKS) % DAY_TICKS) / DAY_TICKS;

export function phaseAt(tick: number): Phase {
  const t = frac(tick);
  return t < 0.33
    ? 'day'
    : t < 0.45
      ? 'evening'
      : t < 0.75
        ? 'night'
        : t < 0.84
          ? 'morning'
          : 'day';
}

/** Tönung (Multiply-Faktoren), Phase und Fensterlicht (0…1) zu einem Tick; Periode `DAY_TICKS`. */
export function lightAt(tick: number): { mul: Mul; phase: Phase; windows: number } {
  const t = frac(tick);
  let i = 0;
  while (STOPS[i + 1]![0] < t) i++;
  const [t0, m0, w0] = STOPS[i]!,
    [t1, m1, w1] = STOPS[i + 1]!;
  const k = t1 === t0 ? 0 : (t - t0) / (t1 - t0);
  // Stützpunkte exakt treffen (Rundungsfehler von k nahe 0 bzw. 1 würden sonst 0,733000…1 liefern)
  const lerp = (a: number, b: number): number =>
    Math.abs(k) < 1e-9 ? a : Math.abs(k - 1) < 1e-9 ? b : a + (b - a) * k;
  return {
    mul: [lerp(m0[0], m1[0]), lerp(m0[1], m1[1]), lerp(m0[2], m1[2])],
    phase: phaseAt(tick),
    windows: lerp(w0, w1),
  };
}

export const lumaOf = ([r, g, b]: Mul): number => 0.299 * r + 0.587 * g + 0.114 * b;

/**
 * Leuchten die Fenster des Gebäudes nachts (Spec 6.2)? Bewohnte Häuser und Gebäude im Zustand `ok`; unbewohnte
 * Häuser und stillstehende Betriebe (`waitingInput`, `storageFull`, `notConnected`, `burning`, `noService`, `noForest`) bleiben dunkel.
 */
export function isLit(def: BuildingDef, b: Building): boolean {
  if (def.category === 'housing') return (b.house?.inhabitants ?? 0) > 0;
  return b.state === 'ok';
}
