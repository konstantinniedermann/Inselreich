import { valueNoise } from '../sim/noise';
import type { Terrain, World } from '../sim/types';

export type FieldWorld = Pick<World, 'width' | 'height' | 'tiles' | 'seed'>;
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
 * nur die eigene Kachel; 0,5 wäre reines Bilinear.
 */
export const EDGE_BAND = 0.25;
/**
 * Übergangsband nur für das Küstenfeld: breiter als EDGE_BAND, damit konvexe Küstenecken sichtbar abgeschnitten
 * werden statt als Kachelecke zu enden. Zusammen mit WARP bleibt jede Kachel zu ≥ 75 % ihres Typs (AK-R1-02).
 */
export const COAST_BAND = 0.35;

/** s = +Abstand Land→nächstes Wasser, −Abstand Wasser→nächstes Land (Kacheln, 8er-Breitensuche, gekappt). */
export function coastField(world: FieldWorld): Field {
  const { width: w, height: h } = world;
  const n = w * h;
  const isLand = (i: number) => world.tiles[i]!.terrain !== 'water';
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

export function terrainFields(world: FieldWorld): TerrainFields {
  const n = world.width * world.height;
  const types = {} as Record<Land, Field>;
  for (const t of LAND) {
    const v = new Float32Array(n);
    for (let i = 0; i < n; i++) v[i] = world.tiles[i]!.terrain === t ? 1 : 0;
    types[t] = { w: world.width, h: world.height, v };
  }
  return { seed: world.seed, coast: coastField(world), types };
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
