import { lightAt, type Weather, type WeatherKind } from './daynight';

// weather.ts — Wettertönung und Wettervorrang (Spec 6.4). Rein, ohne Kontext.
export const CLEAR: Weather = { kind: 'clear', w: 0 };
/** Stimmungswetter bleibt bei w ≤ 0,4 (Setzung Spec). */
export const MOOD_MAX_W = 0.4;

const K: Record<WeatherKind, [number, number, number]> = {
  clear: [1, 1, 1],
  cloudy: [0.92, 0.93, 0.96],
  rain: [0.85, 0.87, 0.92],
  storm: [0.8, 0.82, 0.88],
};
const clamp01 = (v: number): number => (Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 0);

/** Zusätzlicher Multiply-Faktor des Wetters: `mix(1, K, w)`; `w` wird auf 0…1 geklemmt (NaN → 0). */
export function weatherMul(weather: Weather): [number, number, number] {
  const k = K[weather.kind] ?? K.clear,
    w = clamp01(weather.w);
  return [1 + (k[0] - 1) * w, 1 + (k[1] - 1) * w, 1 + (k[2] - 1) * w];
}

/** Gesamttönung: Tageslicht (nur mit `dayNight`) mal Wettertönung. */
export function gradeAt(
  tick: number,
  weather: Weather = CLEAR,
  dayNight = true,
): [number, number, number] {
  const l = dayNight ? lightAt(tick).mul : ([1, 1, 1] as const),
    m = weatherMul(weather);
  return [l[0] * m[0], l[1] * m[1], l[2] * m[2]];
}

/** Krisenwetter geht immer vor; Stimmung nur als `cloudy` mit w ≤ `MOOD_MAX_W`; sonst `clear`. */
export function pickWeather(
  crisis: Weather | null | undefined,
  mood: Weather | null | undefined,
): Weather {
  if (crisis) return { kind: crisis.kind, w: clamp01(crisis.w) };
  if (mood?.kind === 'cloudy') return { kind: 'cloudy', w: Math.min(MOOD_MAX_W, clamp01(mood.w)) };
  return CLEAR;
}
