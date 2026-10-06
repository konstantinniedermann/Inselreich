import { hash2, valueNoise } from '../sim/noise';
import type { GroundElement } from './decor';
import { forestEdgeShift } from './forest';
import { LIGHT, ROCK_TONES } from './light';
import { LIGHT_TONE, PALETTE, mixHex, rgbOf, rgbOfCss, toInk, toLight } from './palette';

// groundDecor.ts — Deko auf Graskacheln: Blumenwiesen und Büsche am Waldrand (R149, Bodenbild).
// Reine Helfer ohne Canvas; Lage in Kachel-Anteilen, deterministisch aus `hash2`/`valueNoise`.
// Seed-Versätze: Blumen 60 (Rauschen) und 66–82, Büsche 90–100 (k = 0, 1 mit Schritt 5). Frei von 11, 13, 17, 19,
// 31–34, 41, 51, 52, 101–112 (H-R9: Wiesenwärme, Flecken, Mottling, Kuppen, Dünen in terrain.ts), den Terrainrauschen 23 (Felskorn), 27 (Fels, 2. Oktave), 29 (Gebirgskuppen), 61/62 in terrain.ts,
// 301–319 (Gebirgsmassiv in massif.ts: Grate, Verbeulung, Geröll, Tönung, Schichtversatz, Bewuchs) und 321 (Felskorn
// des Massivs in rocks.ts) und trees.ts (seed + 68 mit Argumenten `variant, k`, keine Kollision).
// ART-STIL-02 (Spec 4 R1, Anhang 0.2): 500 Inselcharakter `hash2(seed + 500, 0, k)` (k 0 Waldtyp, L1 in forest.ts) ·
// 501–519 L1 Wald: 501 Akzentart, 502/503 Bestandsfelder, 504/505/514 Randversatz, 506/507 Kern-Streuung, 508 Lichtung,
// 509/510 Riesenbaum, 511 Formreihenfolge (alle forest.ts), 512 Kronen je Variante, 513 Kronenform (trees.ts) ·
// 520–539 L2 · 540–559 L4 (decor.ts, groundDecor.ts, decorStamps.ts) · 560–574 L5 · 575–584 L6 · 585–594 L7 · 595–599 L8.
// L4 im Einzelnen: 540 Solitärbaum je Kachel · 541 Wiesenart A2 · 542 Buschgruppe A3 · 543 Kiesel A4 · 544 Findling A4 ·
// 545 Lesesteinhaufen A7 · 546 Maulwurfshügel A11 · 547 Binsen A12 · 548 Pilze B6 · 549 Totholz B7 · 550 Farnsaum B8 ·
// 551 Wahl des Boden-Elements je Kachel · 552 Stempelvariante · 553 Buschdichte A3 und Zusatzblüten A1 · 554 Steinkreis A8 · 555 Blütenteppich A13 ·
// 556 Mauerreste A14 · 557 Obstbaum A6 · 558 Menhir A9 · 559 Pilzring A10. Dazu die Blütenpalette je Insel über
// `hash2(seed + 500, 0, 1)` (Inselcharakter k = 1, Anhang 0.2).

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

// ---------- ART-STIL-02 L4: Blütenpalette (A1) und Formen der Boden-Elemente ----------

const BLOOM_SLATE = mixHex(PALETTE.roofSlate, PALETTE.roofTerracotta, 0.22);
/** Mohn: gedämpftes Terrakotta-Rot mit Erdstich (ΔE2000 ≥ 20 zu signalRed und signalWarn). */
export const POPPY = mixHex(PALETTE.roofTerracotta, PALETTE.grassDark, 0.2);
/** Kornblume: kühles Blauviolett, hell genug, damit sie nie als Wasser liest (ΔE2000 ≥ 10 zu den Wassertönen). */
export const CORNFLOWER = mixHex(BLOOM_SLATE, PALETTE.wallLime, 0.12);
/** Lavendel: helles, gedämpftes Violett. */
export const LAVENDER = mixHex(BLOOM_SLATE, PALETTE.wallLime, 0.5);
/** Butterblume: Gelb als Mischung aus Stroh und Sand (ΔE2000 ≥ 20 zu signalYellow). */
export const BUTTERCUP = mixHex(PALETTE.roofThatch, PALETTE.roofTerracotta, 0.15);

/** Blütenpaletten je Insel (Spec 3.7): 0 Kalk und Stroh (bisher) · 1 Mohn und Kornblume · 2 Lavendel und Kalk · 3 Butterblume und Kalk. */
export const FLOWER_PALETTES: readonly (readonly [string, string, string])[] = [
  FLOWER_TONES,
  [POPPY, CORNFLOWER, PALETTE.wallLime],
  [LAVENDER, mixHex(LAVENDER, PALETTE.wallLime, 0.5), PALETTE.wallLime],
  [BUTTERCUP, mixHex(BUTTERCUP, PALETTE.roofWood, 0.3), PALETTE.wallLime],
];
/** Blütenpalette der Insel 0…3 aus `hash2(seed + 500, 0, 1)`; für die Heimat und jede Inselansicht mit ihrem Ansicht-Seed. */
export const flowerPalette = (seed: number): number =>
  Math.min(3, Math.floor(hash2(seed + 500, 0, 1) * 4));
export const flowerTonesFor = (seed: number): readonly [string, string, string] =>
  FLOWER_PALETTES[flowerPalette(seed)]!;

const rockCss = (i: number): string => `rgb(${ROCK_TONES[i]!.map((v) => Math.round(v)).join(',')})`;

/** Töne der Boden-Elemente (Mischungen aus `palette.ts`); Test: ΔE2000 ≥ 20 zu den Signalfarben. */
export const DECOR_TONES = {
  tallDark: mixHex(PALETTE.grassDark, PALETTE.crown, 0.35),
  tallLight: PALETTE.grass,
  clover: mixHex(PALETTE.grassDark, PALETTE.crown, 0.55),
  dryDark: mixHex(PALETTE.grass, PALETTE.roofThatch, 0.45),
  dryLight: mixHex(PALETTE.grassLight, PALETTE.roofThatch, 0.35),
  shrubDark: mixHex(mixHex(SHRUB_TONES[0], PALETTE.grassDark, 0.35), PALETTE.grass, 0.3),
  shrubMid: mixHex(SHRUB_TONES[1], PALETTE.grassLight, 0.2),
  shrubEdge: mixHex(mixHex(SHRUB_TONES[1], PALETTE.grassLight, 0.2), LIGHT_TONE, 0.35),
  rockDark: rockCss(0),
  rockShade: rockCss(1),
  rockMid: rockCss(2),
  rockLight: rockCss(3),
  ringDark: mixHex(PALETTE.grass, PALETTE.grassDark, 0.55),
  ringDot: mixHex(PALETTE.wallLime, PALETTE.sandWet, 0.3),
  earth: PALETTE.earth,
  earthLight: toLight(PALETTE.earth, 0.3),
  reed: mixHex(PALETTE.grassDark, PALETTE.waterDeep, 0.2),
  reedLight: mixHex(PALETTE.grass, PALETTE.waterDeep, 0.1),
  toadstool: mixHex(PALETTE.roofTerracotta, PALETTE.roofTerracottaDark, 0.5),
  toadstoolStem: mixHex(PALETTE.wallLime, PALETTE.sandWet, 0.4),
  wood: PALETTE.roofWood,
  woodDark: PALETTE.roofTimber,
  woodLight: toLight(PALETTE.roofWood, 0.3),
  woodEnd: toInk(PALETTE.roofTimber, 0.25),
  fern: mixHex(PALETTE.grass, PALETTE.roofThatch, 0.15),
  shrubShadow: toInk(mixHex(SHRUB_TONES[0], PALETTE.grassDark, 0.35), 0.12),
  earthDark: PALETTE.earthEdge,
  fernDark: mixHex(PALETTE.grass, PALETTE.grassDark, 0.4),
} as const;

/**
 * Zeichenelement einer Boden-Deko in Kachelkoordinaten (x, y; ganz innerhalb des Fussabdrucks). Grössen in Kacheln
 * (1 Texturpixel = 1/32). `z` ordnet die Lagen (0 Körper, 1 Licht/Detail); gezeichnet wird je (z, Farbe) ein Pfad.
 */
export type Prim =
  | { k: 'rect'; c: string; z: number; x: number; y: number; w: number; h: number }
  | { k: 'ell'; c: string; z: number; x: number; y: number; rx: number; ry: number }
  | { k: 'poly'; c: string; z: number; pts: readonly number[] };

const PX = 1 / 32;
/** Schmales Blatt von (x0, y0) nach (x1, y1) als Vieleck: Breite `wpx` Texturpixel am Fuss, Spitze in (x1, y1). */
function blade(
  c: string,
  z: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  wpx: number,
): Prim {
  const dx = x1 - x0,
    dy = y1 - y0,
    len = Math.hypot(dx, dy) || 1;
  const nx = (-dy / len) * wpx * PX * 0.5,
    ny = (dx / len) * wpx * PX * 0.5;
  return { k: 'poly', c, z, pts: [x0 - nx, y0 - ny, x1, y1, x0 + nx, y0 + ny] };
}
const dot = (c: string, z: number, x: number, y: number, sizePx: number): Prim => ({
  k: 'rect',
  c,
  z,
  x,
  y,
  w: sizePx * PX,
  h: sizePx * PX,
});

/**
 * Formen eines Boden-Elements (Katalog A2–A4, A7, A8, A10–A13, B6–B8), deterministisch aus Seed und Kachel
 * (Salze 541–550, 554, 555, 559). Licht kommt von links oben: helle Kanten oben links, Schatten unten rechts.
 */
export function groundShapes(el: GroundElement, seed: number): Prim[] {
  const out: Prim[] = [];
  const { x: tx, y: ty } = el;
  const rnd = (salt: number, k: number): number => hash2(seed + salt, tx * 64 + k, ty);
  const D = DECOR_TONES;
  switch (el.kind) {
    case 'tuftTall': {
      // hohes Gras: 2 Gruppen aus je 3 langen Halmen (A2 feucht)
      for (let g = 0; g < 2; g++) {
        const bx = tx + 0.22 + 0.56 * hash2(seed + 541, tx * 64 + g * 3, ty),
          by = ty + 0.55 + 0.35 * hash2(seed + 541, tx * 64 + g * 3 + 1, ty);
        for (let b = -1; b <= 1; b++) {
          const lean = b * 0.045 + 0.02 * (rnd(541, 10 + g * 3 + b) - 0.5);
          out.push(
            blade(
              D.tallDark,
              0,
              bx + b * 0.02,
              by,
              bx + lean,
              by - 0.2 - 0.07 * rnd(541, 20 + g * 3 + b),
              1.5,
            ),
          );
        }
        out.push(blade(D.tallLight, 1, bx, by, bx + 0.01, by - 0.18, 1));
      }
      break;
    }
    case 'clover': {
      // Kleegruppe: 3 runde Punkte in dunklem Grün
      const bx = tx + 0.25 + 0.5 * rnd(541, 0),
        by = ty + 0.3 + 0.4 * rnd(541, 1);
      for (const [dx, dy] of [
        [0, 0],
        [0.07, 0.02],
        [0.035, -0.05],
      ] as const)
        out.push({ k: 'ell', c: D.clover, z: 0, x: bx + dx, y: by + dy, rx: 0.035, ry: 0.03 });
      break;
    }
    case 'tuftDry': {
      // Trockenrasen: kürzere, strohstichige, lichtere Büschel
      const bx = tx + 0.25 + 0.5 * rnd(541, 0),
        by = ty + 0.5 + 0.35 * rnd(541, 1);
      for (const b of [-1, 0, 1])
        out.push(
          blade(
            b === 0 ? D.dryLight : D.dryDark,
            0,
            bx + b * 0.025,
            by,
            bx + b * 0.05,
            by - 0.1 - 0.03 * rnd(541, 4 + b),
            1.3,
          ),
        );
      break;
    }
    case 'shrubs': {
      // Gruppe aus 1–3 runden Büschen (Radius 0,10–0,16, in Dreiergruppen ≤ 0,12): Körper, 2 Lappen, Kontaktschatten
      // unten, Lichtkante aus LIGHT oben links (nie Kronenfarbe)
      const n = 1 + Math.floor(rnd(542, 0) * 3);
      const rMax = n === 3 ? 0.12 : 0.16;
      const cx = tx + 0.5 + 0.1 * (rnd(542, 1) - 0.5),
        cy = ty + 0.55 + 0.1 * (rnd(542, 2) - 0.5);
      for (let i = 0; i < n; i++) {
        const r = 0.1 + (rMax - 0.1) * rnd(542, 3 + i * 6);
        const off = n === 1 ? 0 : (i - (n - 1) / 2) * 0.27;
        const x = Math.min(
          tx + 1 - r * 1.3 - 0.02,
          Math.max(tx + r * 1.3 + 0.02, cx + off + 0.03 * (rnd(542, 4 + i * 6) - 0.5)),
        );
        const y = Math.min(
          ty + 1 - r * 0.8 - 0.05,
          Math.max(ty + r * 0.9 + 0.04, cy + 0.06 * (rnd(542, 5 + i * 6) - 0.5) + (i % 2) * 0.05),
        );
        const c = rnd(542, 6 + i * 6) < 0.5 ? D.shrubDark : D.shrubMid;
        out.push({
          k: 'ell',
          c: D.shrubShadow,
          z: 0,
          x: x + r * 0.12,
          y: y + r * 0.45,
          rx: r * 1.15,
          ry: r * 0.5,
        });
        out.push({ k: 'ell', c, z: 0, x, y, rx: r, ry: r * 0.8 });
        for (const side of [-1, 1])
          out.push({
            k: 'ell',
            c,
            z: 0,
            x: x + side * r * 0.55,
            y: y - r * 0.2,
            rx: r * 0.6,
            ry: r * 0.5,
          });
        out.push({
          k: 'ell',
          c: D.shrubEdge,
          z: 1,
          x: x + LIGHT.x * r * 0.45,
          y: y + LIGHT.y * r * 0.9 - r * 0.15,
          rx: r * 0.55,
          ry: r * 0.3,
        });
      }
      break;
    }
    case 'pebble': {
      const n = 1 + Math.floor(rnd(543, 0) * 2);
      for (let i = 0; i < n; i++) {
        const x = tx + 0.15 + 0.7 * rnd(543, 1 + i * 3),
          y = ty + 0.15 + 0.7 * rnd(543, 2 + i * 3);
        const s = 1 + Math.floor(rnd(543, 3 + i * 3) * 2); // 1–2 px
        out.push(dot(rnd(543, 7 + i) < 0.5 ? D.rockMid : D.rockShade, 0, x, y, s));
        out.push(dot(D.rockLight, 1, x, y, 1));
      }
      break;
    }
    case 'boulder': {
      // Findling ≤ 0,3 Kachel: Körper, helle Lichtseite oben links, dunkle Kontur unten rechts
      const r = 0.07 + 0.07 * rnd(544, 0); // Halbbreite ≤ 0,14 → Breite ≤ 0,28
      const x = tx + 0.2 + 0.6 * rnd(544, 1),
        y = ty + 0.3 + 0.4 * rnd(544, 2);
      out.push({
        k: 'ell',
        c: D.rockDark,
        z: 0,
        x: x + r * 0.12,
        y: y + r * 0.12,
        rx: r,
        ry: r * 0.72,
      });
      out.push({ k: 'ell', c: D.rockMid, z: 0, x, y, rx: r * 0.92, ry: r * 0.66 });
      out.push({
        k: 'ell',
        c: D.rockLight,
        z: 1,
        x: x - r * 0.3,
        y: y - r * 0.28,
        rx: r * 0.5,
        ry: r * 0.3,
      });
      break;
    }
    case 'stoneHeap': {
      // Lesesteinhaufen: 5–8 Steine in ≤ 0,35 Kachel
      const n = 5 + Math.floor(rnd(545, 0) * 4);
      const cx = tx + 0.5,
        cy = ty + 0.55;
      for (let i = 0; i < n; i++) {
        const a = rnd(545, 1 + i * 3) * Math.PI * 2,
          d = 0.085 * Math.sqrt(rnd(545, 2 + i * 3));
        const x = cx + Math.cos(a) * d * 1.4,
          y = cy + Math.sin(a) * d;
        const r = 0.025 + 0.02 * rnd(545, 3 + i * 3);
        out.push({ k: 'ell', c: i % 2 ? D.rockShade : D.rockMid, z: 0, x, y, rx: r, ry: r * 0.75 });
        out.push({
          k: 'ell',
          c: D.rockLight,
          z: 1,
          x: x - r * 0.3,
          y: y - r * 0.35,
          rx: r * 0.45,
          ry: r * 0.25,
        });
      }
      break;
    }
    case 'stoneCircle': {
      // Steinkreis: 7–9 Steine im Ring (Radius 0,45–0,6) um die Mitte des 2 × 2-Fussabdrucks
      const n = 7 + Math.floor(rnd(554, 0) * 3);
      const R = 0.45 + 0.15 * rnd(554, 1);
      const cx = tx + 1,
        cy = ty + 1,
        ph = rnd(554, 2) * Math.PI * 2;
      for (let i = 0; i < n; i++) {
        const a = ph + (i / n) * Math.PI * 2 + 0.12 * (rnd(554, 3 + i * 2) - 0.5);
        const x = cx + Math.cos(a) * R,
          y = cy + Math.sin(a) * R * 0.8;
        const r = 0.035 + 0.02 * rnd(554, 4 + i * 2);
        out.push({
          k: 'ell',
          c: D.rockDark,
          z: 0,
          x: x + r * 0.15,
          y: y + r * 0.15,
          rx: r,
          ry: r * 0.8,
        });
        out.push({ k: 'ell', c: D.rockMid, z: 0, x, y, rx: r * 0.9, ry: r * 0.7 });
        out.push({
          k: 'ell',
          c: D.rockLight,
          z: 1,
          x: x - r * 0.3,
          y: y - r * 0.3,
          rx: r * 0.5,
          ry: r * 0.3,
        });
      }
      break;
    }
    case 'mushRing': {
      // Pilzring: dunklerer Grasring, 8–12 helle 1-px-Punkte (Radius ≈ 0,3)
      const cx = tx + 0.5,
        cy = ty + 0.5;
      const m = 14;
      for (let i = 0; i < m; i++) {
        const a = (i / m) * Math.PI * 2;
        out.push({
          k: 'ell',
          c: D.ringDark,
          z: 0,
          x: cx + Math.cos(a) * 0.3,
          y: cy + Math.sin(a) * 0.3 * 0.8,
          rx: 0.045,
          ry: 0.036,
        });
      }
      const n = 8 + Math.floor(rnd(559, 0) * 5);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + 0.2 * rnd(559, 1 + i);
        out.push(dot(D.ringDot, 1, cx + Math.cos(a) * 0.3, cy + Math.sin(a) * 0.3 * 0.8, 1));
      }
      break;
    }
    case 'molehills': {
      // 3–5 runde Erdhügel dicht beieinander: dunkler Fuss, Erdton, hellere Kuppe oben links
      const n = 3 + Math.floor(rnd(546, 0) * 3);
      const cx = tx + 0.5,
        cy = ty + 0.5;
      for (let i = 0; i < n; i++) {
        const x = cx + (rnd(546, 1 + i * 2) - 0.5) * 0.5,
          y = cy + (rnd(546, 2 + i * 2) - 0.5) * 0.36;
        const r = 0.055 + 0.02 * rnd(546, 12 + i);
        out.push({
          k: 'ell',
          c: D.earthDark,
          z: 0,
          x: x + r * 0.1,
          y: y + r * 0.3,
          rx: r * 1.15,
          ry: r * 0.75,
        });
        out.push({ k: 'ell', c: D.earth, z: 0, x, y, rx: r, ry: r * 0.8 });
        out.push({
          k: 'ell',
          c: D.earthLight,
          z: 1,
          x: x - r * 0.3,
          y: y - r * 0.3,
          rx: r * 0.5,
          ry: r * 0.35,
        });
      }
      break;
    }
    case 'reeds': {
      // Binsen: dunkle, kühle Grünstriche, keine Fläche
      const n = 4 + Math.floor(rnd(547, 0) * 4);
      const cx = tx + 0.3 + 0.4 * rnd(547, 1),
        cy = ty + 0.55 + 0.3 * rnd(547, 2);
      for (let i = 0; i < n; i++) {
        const bx = cx + (rnd(547, 3 + i * 3) - 0.5) * 0.3,
          by = cy + (rnd(547, 4 + i * 3) - 0.5) * 0.12;
        out.push(
          blade(
            i % 3 ? D.reed : D.reedLight,
            0,
            bx,
            by,
            bx + 0.02 * ((i % 3) - 1),
            by - 0.13 - 0.08 * rnd(547, 5 + i * 3),
            1,
          ),
        );
      }
      break;
    }
    case 'carpet': {
      // Blütenteppich: dicht, eine Farbe (Ton der Blütenpalette)
      const c = flowerTonesFor(seed)[el.arg === 1 ? 1 : 0];
      const n = 9 + Math.floor(hash2(seed + 555, tx * 64, ty) * 6);
      for (let i = 0; i < n; i++)
        out.push(
          dot(
            c,
            0,
            tx + 0.06 + 0.84 * hash2(seed + 555, tx * 64 + 1 + i * 2, ty),
            ty + 0.06 + 0.84 * hash2(seed + 555, tx * 64 + 2 + i * 2, ty),
            1 + (i % 3 === 0 ? 0.5 : 0),
          ),
        );
      break;
    }
    case 'toadstools': {
      // Pilze: Terrakotta-Punkte an der Waldkante
      const n = 2 + Math.floor(rnd(548, 0) * 3);
      const [sx, sy] = sidePoint(el.arg, rnd(548, 1), 0.25);
      for (let i = 0; i < n; i++) {
        const x = Math.min(
            tx + 0.92,
            Math.max(tx + 0.05, tx + sx + (rnd(548, 2 + i * 2) - 0.5) * 0.2),
          ),
          y = Math.min(ty + 0.92, Math.max(ty + 0.05, ty + sy + (rnd(548, 3 + i * 2) - 0.5) * 0.2));
        out.push(dot(D.toadstoolStem, 0, x, y + 1.5 * PX, 1));
        out.push(dot(D.toadstool, 1, x, y, 2));
      }
      break;
    }
    case 'deadwood': {
      // liegender Stamm 0,4–0,7 Kachel: zwei Brauntöne, Lichtkante oben, dunkle Stirnseite
      const len = 0.4 + 0.3 * rnd(549, 0),
        a = (rnd(549, 1) - 0.5) * 1.0;
      const [sx, sy] = sidePoint(el.arg, rnd(549, 2), 0.3);
      const cx = Math.min(tx + 0.62, Math.max(tx + 0.38, tx + sx)),
        cy = Math.min(ty + 0.7, Math.max(ty + 0.3, ty + sy));
      const ux = Math.cos(a) * len * 0.5,
        uy = Math.sin(a) * len * 0.5 * 0.8;
      const th = 0.05; // halbe Dicke
      out.push({
        k: 'poly',
        c: D.woodDark,
        z: 0,
        pts: [
          cx - ux,
          cy - uy - th * 0.2,
          cx + ux,
          cy + uy - th * 0.2,
          cx + ux,
          cy + uy + th,
          cx - ux,
          cy - uy + th,
        ],
      });
      out.push({
        k: 'poly',
        c: D.wood,
        z: 0,
        pts: [
          cx - ux,
          cy - uy - th,
          cx + ux,
          cy + uy - th,
          cx + ux,
          cy + uy + th * 0.3,
          cx - ux,
          cy - uy + th * 0.3,
        ],
      });
      out.push({
        k: 'poly',
        c: D.woodLight,
        z: 1,
        pts: [
          cx - ux,
          cy - uy - th,
          cx + ux,
          cy + uy - th,
          cx + ux,
          cy + uy - th * 0.45,
          cx - ux,
          cy - uy - th * 0.45,
        ],
      });
      out.push({
        k: 'ell',
        c: D.woodEnd,
        z: 1,
        x: cx + ux,
        y: cy + uy,
        rx: th * 0.45,
        ry: th * 0.95,
      });
      break;
    }
    case 'ferns': {
      // Farnsaum B8: Büschel aus 2–5 Wedeln auf der Grasseite der Waldkante, nie als Linie an der Kachelkante
      for (const c of fringeClusters(seed, tx, ty, el.arg)) {
        const n = c.n;
        for (let i = 0; i < n; i++) {
          const u = Math.min(0.97, Math.max(0.03, c.u + (n === 1 ? 0 : (i / (n - 1) - 0.5) * c.w)));
          const len = c.len * (0.6 + 0.8 * hash2(seed + 550, tx * 64 + c.k * 8 + i + 20, ty));
          const a =
            (n === 1 ? 0 : (i / (n - 1) - 0.5) * 1.1) +
            0.2 * (hash2(seed + 550, tx * 64 + c.k * 8 + i + 30, ty) - 0.5);
          const [bx, by, ax, ay] =
            c.side === 1
              ? [tx + c.d, ty + u, 1, 0]
              : c.side === 2
                ? [tx + 1 - c.d, ty + u, -1, 0]
                : c.side === 4
                  ? [tx + u, ty + c.d, 0, 1]
                  : [tx + u, ty + 1 - c.d, 0, -1];
          const ca = Math.cos(a),
            sa = Math.sin(a);
          const dx = ax * ca - ay * sa,
            dy = ax * sa + ay * ca;
          const ex = Math.min(tx + 0.98, Math.max(tx + 0.02, bx + dx * len)),
            ey = Math.min(ty + 0.98, Math.max(ty + 0.02, by + dy * len));
          out.push(blade(i % 2 ? D.fernDark : D.fern, 0, bx, by, ex, ey, 1.6));
        }
      }
      break;
    }
  }
  return out;
}

/** Punkt am Waldrand einer Kachel (`mask` = Waldseiten) und Richtung weg vom Wald: [x, y, dx, dy] in Kachelanteilen. */
function sidePoint(mask: number, t: number, inset: number): [number, number, number, number] {
  const along = 0.15 + 0.7 * t;
  if (mask & 1) return [inset * 0.4, along, 1, 0];
  if (mask & 2) return [1 - inset * 0.4, along, -1, 0];
  if (mask & 4) return [along, inset * 0.5, 0, 1];
  return [along, 1 - inset * 0.5, 0, -1];
}

/**
 * A1 Zusatzblüten: im Kern der Blumenflecks bis 4 weitere Blüten je Kachel (zusammen mit `flowersFor` bis 8), Grösse
 * 1,5–2 Texturpixel; bei Zoom 1 ein farbiger Schleier, bei Zoom 2 einzelne Blüten. Salz 553, gleiche Töne und Fleckenfeld.
 */
export function extraFlowersFor(seed: number, x: number, y: number): Flower[] {
  const dens = flowerVeil(seed, x + 0.5, y + 0.5);
  if (dens < 0.25) return [];
  const n = Math.min(4, Math.floor(dens * (0.6 + 4.4 * hash2(seed + 553, x * 64, y))));
  const out: Flower[] = [];
  for (let k = 0; k < n; k++)
    out.push({
      x: 0.06 + 0.88 * hash2(seed + 553, x * 64 + 1 + k * 3, y),
      y: 0.06 + 0.88 * hash2(seed + 553, x * 64 + 2 + k * 3, y),
      size: 1.5 + 0.5 * hash2(seed + 553, x * 64 + 3 + k * 3, y),
      tone: Math.min(2, Math.floor(hash2(seed + 553, x * 64 + 40 + k, y) * 3)) as 0 | 1 | 2,
    });
  return out;
}

/** Büschel des Farnsaums (B8) an einer Waldseite einer Kachel. `u` Lage entlang der Kante (0…1), `d` Abstand zur Kante. */
export interface FringeCluster {
  side: 1 | 2 | 4 | 8;
  k: number;
  u: number;
  d: number;
  /** Zahl der Wedel (2–5), Breite des Büschels entlang der Kante und Wedellänge in Kacheln. */
  n: number;
  w: number;
  len: number;
}
/**
 * Die Farnbüschel einer Kachel. `arg` = Waldseiten (Bits 1, 2, 4, 8) plus Bit 4 + 2 · Seitenindex + Ende: die Kante setzt
 * sich über dieses Ende (0 = kleinere Koordinate, 1 = grössere) fort. An Ecken der Treppe, wo sie endet, bleibt der
 * Rand ausgespart. Je Seite 3 Plätze mit Lücke (Anteil 0,4), der Abstand zur Kante folgt `forestEdgeShift` (0,05–0,35).
 */
export function fringeClusters(seed: number, tx: number, ty: number, arg: number): FringeCluster[] {
  const out: FringeCluster[] = [];
  const r = (k: number): number => hash2(seed + 550, tx * 64 + k, ty);
  [1, 2, 4, 8].forEach((side, si) => {
    if (!(arg & side)) return;
    for (let k = 0; k < 3; k++) {
      const q = si * 10 + k;
      if (r(60 + q) < 0.4) continue; // Lücke
      const u = 0.17 + 0.33 * k + 0.2 * (r(70 + q) - 0.5);
      if (u < 0.3 && !(arg & (1 << (4 + si * 2)))) continue;
      if (u > 0.7 && !(arg & (1 << (5 + si * 2)))) continue;
      const fx = side < 4 ? tx + 0.5 : tx + u,
        fy = side < 4 ? ty + u : ty + 0.5;
      const t = (forestEdgeShift(seed, fx, fy) + 0.3) / 0.6; // 0…1
      const d = 0.05 + 0.3 * Math.min(1, Math.max(0, 0.5 + 2 * (0.4 * t + 0.6 * r(80 + q) - 0.5)));
      const n = 2 + Math.floor(r(90 + q) * 4);
      out.push({
        side: side as 1 | 2 | 4 | 8,
        k: q,
        u,
        d,
        n,
        w: 0.05 + 0.025 * n,
        len: 0.08 + 0.08 * r(100 + q),
      });
    }
  });
  return out;
}
