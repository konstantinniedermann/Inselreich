import { valueNoise } from '../sim/noise';
import type { Island, Terrain, World } from '../sim/types';
import { home } from '../sim/world';

export type FieldWorld = Pick<Island, 'width' | 'height' | 'tiles'> & Pick<World, 'seed'>;
type SeededIsland = Island & Pick<World, 'seed'>;
const views = new WeakMap<World, SeededIsland>();
/**
 * Heimatinsel samt Welt-Seed als Eingabe der Geländefelder: flache Kopie der Inselfelder (schneller Zugriff in den
 * Schleifen), je Welt einmal angelegt (stabiler Cache-Schlüssel) und neu gebildet, sobald die Kacheln wechseln.
 */
export function fieldWorld(world: World): SeededIsland {
  const isl = home(world);
  let v = views.get(world);
  if (!v || v.tiles !== isl.tiles || v.width !== isl.width || v.height !== isl.height) {
    v = { ...isl, seed: world.seed };
    views.set(world, v);
  }
  return v;
}
/** Ein Wert je Kachelmitte. */
export interface Field {
  w: number;
  h: number;
  v: Float32Array;
}
export type Land = Exclude<Terrain, 'water'>;
export const LAND: readonly Land[] = ['sand', 'grass', 'forest', 'mountain'];
export interface TerrainFields {
  seed: number;
  coast: Field;
  types: Record<Land, Field>;
}

export const MAX_DIST = 16; // Kacheln; tiefer als waterDeep (6) unterscheidet niemand
export const WARP = 0.08; // Verschiebung höchstens ±WARP Kacheln je Achse (Spec 5.1 erlaubt ±0,12)
/**
 * Rauschfrequenz je Kachel (Darstellungswert). Die Verschiebung ist linear geformt: Eine Wurzelformung sprang an
 * den Nulldurchgängen und erzeugte Treppen an der Küste; mit linearer Form und Frequenz 1 wellt die Küste sanft.
 */
const WARP_FREQ = 1.0;
/**
 * Übergangsband der Land-Typen je Kante in Kacheln (Plan-Setzung zu Spec 4.3.5): Bis EDGE_BAND vor der Kante zählt
 * nur die eigene Kachel; 0,5 wäre reines Bilinear. 0,29 ist der grösste Wert, bei dem AK-R1-02 auf 40 Seeds hält
 * (0,3 scheitert an Kachel 50,30 von Seed 100).
 */
export const EDGE_BAND = 0.29;
/**
 * Übergangsband nur für das Küstenfeld: breiter als EDGE_BAND, damit konvexe Küstenecken sichtbar abgeschnitten
 * werden statt als Kachelecke zu enden. Zusammen mit WARP bleibt jede Kachel zu ≥ 75 % ihres Typs (AK-R1-02).
 */
export const COAST_BAND = 0.35;

/** s = +Abstand Land→nächstes Wasser, −Abstand Wasser→nächstes Land (Kacheln, 8er-Breitensuche, gekappt). */
export function coastField(isl: FieldWorld): Field {
  const { width: w, height: h } = isl;
  const n = w * h;
  const isLand = (i: number) => isl.tiles[i]!.terrain !== 'water';
  const distTo = (sourceIsLand: boolean): Float32Array => {
    const d = new Float32Array(n).fill(MAX_DIST);
    const q = new Int32Array(n);
    let head = 0,
      tail = 0;
    for (let i = 0; i < n; i++)
      if (isLand(i) === sourceIsLand) {
        d[i] = 0;
        q[tail++] = i;
      }
    while (head < tail) {
      const i = q[head++]!,
        x = i % w,
        y = (i / w) | 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx,
            ny = y + dy;
          if ((dx === 0 && dy === 0) || nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (d[j]! > d[i]! + 1) {
            d[j] = d[i]! + 1;
            q[tail++] = j;
          }
        }
    }
    return d;
  };
  const toWater = distTo(false),
    toLand = distTo(true);
  const v = new Float32Array(n);
  for (let i = 0; i < n; i++)
    v[i] = isLand(i) ? Math.min(toWater[i]!, MAX_DIST) : -Math.min(toLand[i]!, MAX_DIST);
  return { w, h, v };
}

export function terrainFields(isl: FieldWorld): TerrainFields {
  const n = isl.width * isl.height;
  const types = {} as Record<Land, Field>;
  for (const t of LAND) {
    const v = new Float32Array(n);
    for (let i = 0; i < n; i++) v[i] = isl.tiles[i]!.terrain === t ? 1 : 0;
    types[t] = { w: isl.width, h: isl.height, v };
  }
  return { seed: isl.seed, coast: coastField(isl), types };
}

function ramp(t: number, band: number): number {
  if (band >= 0.5) return t;
  const g = (t - (0.5 - band)) / (2 * band);
  return g < 0 ? 0 : g > 1 ? 1 : g;
}

/** Bilinear zwischen Kachelmitten (Kachel i hat die Mitte i + 0,5), mit Plateau `band`; Ränder geklemmt. */
export function sampleField(f: Field, fx: number, fy: number, band = 0.5): number {
  const u = Math.min(Math.max(fx - 0.5, 0), f.w - 1);
  const v = Math.min(Math.max(fy - 0.5, 0), f.h - 1);
  const x0 = Math.floor(u),
    y0 = Math.floor(v);
  const x1 = Math.min(x0 + 1, f.w - 1),
    y1 = Math.min(y0 + 1, f.h - 1);
  const tx = ramp(u - x0, band),
    ty = ramp(v - y0, band);
  const at = (x: number, y: number) => f.v[y * f.w + x]!;
  return (
    (at(x0, y0) * (1 - tx) + at(x1, y0) * tx) * (1 - ty) +
    (at(x0, y1) * (1 - tx) + at(x1, y1) * tx) * ty
  );
}

/** Rauschverschiebung ±WARP je Achse, linear geformt. */
export function warp(seed: number, fx: number, fy: number): [number, number] {
  const n = (k: number) => {
    const r = valueNoise(seed + k, fx * WARP_FREQ, fy * WARP_FREQ) * 2 - 1;
    return r * WARP;
  };
  return [fx + n(701), fy + n(709)];
}

/** Scharfes Küstenfeld nach der Verschiebung: ≤ 0 ist Wasser, 0 die gezeichnete Küste. */
export function coastValue(f: TerrainFields, fx: number, fy: number): number {
  const [wx, wy] = warp(f.seed, fx, fy);
  return sampleField(f.coast, wx, wy, COAST_BAND);
}

export function terrainAt(f: TerrainFields, fx: number, fy: number): Terrain {
  const [wx, wy] = warp(f.seed, fx, fy);
  if (sampleField(f.coast, wx, wy, COAST_BAND) <= 0) return 'water';
  let best: Land = 'sand',
    bestV = -Infinity;
  for (const t of LAND) {
    const v = sampleField(f.types[t], wx, wy, EDGE_BAND);
    if (v > bestV) {
      bestV = v;
      best = t;
    }
  }
  return best;
}

/** Wassertiefe in Kacheln (geglättet, ≥ 0) für den Farbverlauf und den Schaum. */
export function depthAt(f: TerrainFields, fx: number, fy: number): number {
  const [wx, wy] = warp(f.seed, fx, fy);
  return Math.max(0, -sampleField(f.coast, wx, wy));
}

/**
 * Gewicht der Meerkante (M12 E1): 0 in den äussersten 2 Kacheln der Inselansicht, bis 4 Kacheln Abstand linear auf 1.
 * `fx`/`fy` in Kacheln, `w`/`h` Kantenlänge der Ansicht in Kacheln.
 */
export const rimWeight = (fx: number, fy: number, w: number, h: number): number =>
  Math.min(1, Math.max(0, (Math.min(fx, fy, w - fx, h - fy) - 2) / 2));
