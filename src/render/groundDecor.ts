import { hash2, valueNoise } from '../sim/noise';
import { PALETTE, mixHex, rgbOf, rgbOfCss } from './palette';

// groundDecor.ts — Deko auf Graskacheln: Blumenwiesen und Büsche am Waldrand (R149, Bodenbild).
// Reine Helfer ohne Canvas; Lage in Kachel-Anteilen, deterministisch aus `hash2`/`valueNoise`.
// Seed-Versätze: Blumen 60 (Rauschen) und 66–82, Büsche 90–100 (k = 0, 1 mit Schritt 5). Frei von 11, 13, 17, 19,
// 31–34, 41, 51, 52, 101–112 (H-R9: Wiesenwärme, Flecken, Mottling, Kuppen, Dünen in terrain.ts), den Terrainrauschen 23 (Felskorn), 27 (Fels, 2. Oktave), 29 (Gebirgskuppen), 61/62 in terrain.ts,
// 301–319 (Gebirgsmassiv in massif.ts: Grate, Verbeulung, Geröll, Tönung, Schichtversatz, Bewuchs) und 321 (Felskorn
// des Massivs in rocks.ts) und trees.ts (seed + 68 mit Argumenten `variant, k`, keine Kollision).

const clamp01 = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Blütentöne: Kalk, ein rötliches Stroh und ein helles Terrakotta; alle ΔE2000 ≥ 20 zu den Signalfarben. */
export const FLOWER_TONES: readonly [string, string, string] = [
  PALETTE.wallLime,
  mixHex(PALETTE.roofThatch, PALETTE.roofTerracotta, 0.2),
  mixHex(PALETTE.roofTerracotta, PALETTE.wallLime, 0.6),
];
/** Buschtöne: dunkles, leicht gelbstichiges Grün, nie die Kronenfarben. */
export const SHRUB_TONES: readonly [string, string] = [
  mixHex(PALETTE.crown, PALETTE.grassDark, 0.7),
  mixHex(PALETTE.crown, PALETTE.grassDark, 0.85),
];

/**
 * H-R11: Büschelfarbe je Tonstufe des Bodens darunter (Stilrahmen S2/S3). `tone` 0 hell, 1 dunkel; `st` ist die
 * Tonstufe 0…4 (2 = eben). Schattenseiten mischen kühl (waterDeep/rockDark), Lichtseiten warm (sandDry), nie Schwarz
 * oder Weiss. Akzent statt Textur: die Büschel tragen die Stufe, in der sie stehen.
 */
export function tuftColor(tone: 0 | 1, st: number): string {
  const base = rgbOfCss(
    tone === 0 ? PALETTE.grassLight : mixHex(PALETTE.grassDark, PALETTE.grass, 0.4),
  );
  const e = Math.max(-1, Math.min(1, (st - 2) / 2));
  const mix = (a: readonly number[], b: readonly number[], t: number): number[] =>
    a.map((v, i) => v + (b[i]! - v) * t);
  const c =
    e < 0
      ? mix(mix(base, rgbOf(PALETTE.rockDark), 0.2 * -e), rgbOf(PALETTE.waterDeep), 0.3 * -e)
      : mix(base, rgbOf(PALETTE.sandDry), 0.35 * e);
  return `rgb(${c.map((v) => Math.round(v)).join(',')})`;
}

export interface Flower {
  x: number;
  y: number;
  /** Kantenlänge in Texturpixeln (1–1,5). */
  size: number;
  tone: 0 | 1 | 2;
}

/** 0–4 Blüten einer Graskachel, gehäuft über ein tief frequentes Rauschfeld (Blumenwiesen). */
export function flowersFor(seed: number, x: number, y: number): Flower[] {
  const field = clamp01((valueNoise(seed + 60, x * 0.18, y * 0.18) - 0.5) * 2.6 + 0.5);
  const dens = Math.max(0, (field - 0.55) / 0.45);
  const n = Math.min(4, Math.floor(dens * (0.8 + 3.2 * hash2(seed + 66, x, y))));
  const out: Flower[] = [];
  for (let k = 0; k < n; k++)
    out.push({
      x: 0.1 + 0.8 * hash2(seed + 67 + k * 4, x, y),
      y: 0.1 + 0.8 * hash2(seed + 68 + k * 4, x, y),
      size: 1 + 0.5 * hash2(seed + 69 + k * 4, x, y),
      tone: Math.min(2, Math.floor(hash2(seed + 70 + k * 4, x, y) * 3)) as 0 | 1 | 2,
    });
  return out;
}

/** Welche 4er-Nachbarn der Kachel Wald sind (Richtung im Kachelraum: left = x − 1, up = y − 1). */
export interface ForestSides {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
}
export interface Shrub {
  x: number;
  y: number;
  /** Radius in Kacheln (≤ 0,06). */
  r: number;
  tone: 0 | 1;
}

/** Höchstens 2 kleine, flache Büsche auf der Waldseite einer Graskachel. */
export function shrubsFor(seed: number, x: number, y: number, sides: ForestSides): Shrub[] {
  const active = (['left', 'right', 'up', 'down'] as const).filter((s) => sides[s]);
  if (active.length === 0) return [];
  const n = Math.floor(hash2(seed + 90, x, y) * 3); // 0..2
  const out: Shrub[] = [];
  for (let k = 0; k < n; k++) {
    const side = active[Math.floor(hash2(seed + 91 + k * 5, x, y) * active.length)]!;
    const r = 0.035 + 0.025 * hash2(seed + 92 + k * 5, x, y);
    const along = 0.15 + 0.7 * hash2(seed + 93 + k * 5, x, y);
    const across = r + 0.02 + 0.18 * hash2(seed + 94 + k * 5, x, y); // Abstand zur Waldkante
    const horizontal = side === 'left' || side === 'right';
    const near = side === 'left' || side === 'up' ? across : 1 - across;
    out.push({
      x: horizontal ? near : along,
      y: horizontal ? along : near,
      r,
      tone: hash2(seed + 95 + k * 5, x, y) < 0.5 ? 0 : 1,
    });
  }
  return out;
}

/**
 * Grosser Warm/Kühl-Verlauf der Wiese −1…1 (H-R9 B3, ~0,09 Merkmale je Kachel); `terrain.ts` färbt damit den Boden,
 * die Büschel-Dichte folgt ihm (trockene Stellen karger). Rein, an Kachelkoordinaten (Kommazahlen erlaubt).
 */
export function meadowWarmth(seed: number, fx: number, fy: number): number {
  return Math.max(-1, Math.min(1, (valueNoise(seed + 101, fx * 0.09, fy * 0.09) - 0.5) * 3.6));
}

/** Blumenschleier 0…1: die Verteilung von `flowersFor` als stetiges Feld (Dichte über 0,55 des Rauschens). */
export function flowerVeil(seed: number, fx: number, fy: number): number {
  const field = clamp01((valueNoise(seed + 60, fx * 0.18, fy * 0.18) - 0.5) * 2.6 + 0.5);
  return Math.max(0, (field - 0.55) / 0.45);
}
