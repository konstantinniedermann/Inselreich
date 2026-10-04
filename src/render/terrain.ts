import { hash2, valueNoise } from '../sim/noise';
import { DEBRIS, LIGHT, LIGHT_COLORS, mixRgb, rotNoise, toneHalfWidth, toneStep } from './light';
import { layoutKey } from '../sim/queries';
import type { World } from '../sim/types';
import { TEX } from './iso';
import {
  FLOWER_TONES,
  SHRUB_TONES,
  flowerVeil,
  flowersFor,
  meadowWarmth,
  shrubsFor,
  tuftColor,
} from './groundDecor';
import { FOREST_FLOOR, PALETTE, mixHex, rgbOf, rgbOfCss } from './palette';
import {
  COAST_BAND,
  EDGE_BAND,
  LAND,
  WARP,
  coastField,
  sampleField,
  terrainFields,
  warp,
  type TerrainFields,
} from './terrainField';

// terrain.ts — Terrain-Ebene (Spec 5.1, ISO §6). Keine Baumkronen: die kommen als Stempel aus trees.ts (D-08).
export const RASTER = 4; // Texturpixel (Faktor 1) je Rechenknoten (Setzung Spec 5.1)
const CHUNK = 512; // Ebenen-Pixel je ImageData-Block (begrenzt den Speicher)
// R149: Abweichung zu M7-Spec 5.1 — Gebirge ±12 %, sonst ±8 %
const SHADE_MAX = 0.08;
const SHADE_MAX_MOUNTAIN = 0.12;
// H-R9 B1: Wiese und Strand tragen mit dem Mikrorelief bis ±14 %; Wald bleibt bei ±8 % (Bäume lesbar)
const SHADE_MAX_FLUR = 0.2; // H-R9 R3: ±20 % (Playtest: Wiese bei Zoom 1 kaum von main zu unterscheiden)
const HOLLOW_GAIN = 2.5; // Senke: Anteil des kühlen Tons je umgewandelter Schattierung (0,12 → 30 %)
const HOLLOW_FROM = 0; // ab dieser Abdunklung (hier: jeder) wird …
const HOLLOW_SHARE = 0.6; // … dieser Anteil der weiteren Abdunklung zum kühlen Farbton statt dunkler
const RELIEF_GAIN = 0.6; // Helligkeit je Höhengefälle des Mikroreliefs (R3: verdoppelt, Hangbeleuchtung sichtbar)
const HILL_AMP = 2.1; // Höhe der Wiesenkuppen (Merkmale ~0,23 und ~0,5 je Kachel, 2 Oktaven)
const DUNE_AMP = 1.3; // Höhe der Dünenrücken auf trockenem Sand (R3: weniger Fläche, dafür lesbar)
const DUNE_RAMP = 0.5; // Küstenwert-Breite (Kacheln), über die die Dünen hinter dem nassen Saum einsetzen
// H-R9 B3: Wiesenfarbe — Stärke der Mischungen (Anteile 0..1 bei Feldwert ±1)
const WARM_ON = 0.55; // H-R9 R4: Warm-/Kühlton erst ab |Feld| > 0,55 (rund 30 % der Wiese je Seite höchstens)
const WARM_MAX = 0.25; // warm/trocken: Mischung zu Strohgrün (R3: weniger, sonst wirkt die Wiese ausgeblichen)
const COOL_MAX = 0.25; // kühl/satt: Mischung zu Tiefgrün (R3: Senken über den Farbton statt dunkler, I5)
const VEIL_MAX = 0.05; // Blumenschleier: Mischung zu Kalkgrün (passend zu flowersFor)
const MOTTLE_AMP = 0.01; // feines Mottling ±3,5 % Helligkeit (Spec ±3–4 %); die Varianz tragen die grossen und mittleren Flecken
const SHADE_GAIN = 0.075; // Darstellungswert: Helligkeit je Höhengefälle pro Kachel (R149: mehr Plastik)
const FOOT_HEIGHT = 3.4; // R170: Gebirgshöhe nur aus dem Bilinearfeld (kein Plateau-Sprung an der Kachelkante)
/** H-R9 Runde 3: Anteil der Gebirgsfuss-Schattierung, der an Nicht-Gebirgsknoten auf der Schattenseite entfällt. */
const FOOT_DAMP = 1;
/** … auch an Gebirgsknoten im Übergangsband (Indikator darunter): dort ragt die Geländeebene unter dem Massiv hervor. */
const FOOT_DAMP_IND = 0.95;
/** H-R9 Runde 3: Fels im Übergangsband (Indikator < 1) läuft zum hellen Schutt des Massivfusses statt dunkel. */
const ROCK_EDGE_DEBRIS = 0.8;
const ROCK_EDGE_REACH = 2.5; // voll ab Gebirgsanteil 0,6 (≈ 0,1 Kachel innerhalb einer geraden Kante, an Ecken tiefer)
const HILL_HEIGHT = 1.6; // R170: sanfte Kuppen im Gebirge (tieffrequent, gedreht), trägt die Plastik im Inneren
const MEADOW_WAVE = 0.3; // Amplitude der sanften Wiesenwelle in der Höhe
const HEIGHT_BLUR = 3; // R170: Box-Radius in Knoten (2 Durchgänge ≈ Gauss über ~0,7 Kachel), glättet Knicke der Bilinearfelder
// Flecken im Pixelfeld (R149): Schwellen auf den gespreizten Rauschfeldern 0..1
const CLOVER_MAX = 0.4; // höchstens 67,5 % Mischung zum Kleegrün ((1 − 0,1) · 0,75 bei Fleckwert 1)
const DRY_MAX = 0.2; // höchstens 31,5 % Mischung zu sandDry ((1 − 0,1) · 0,35; darf nicht wie ein Weg aussehen)
const MOSS_MAX = 0.55;
const MOSS_EDGE_FADE = 0.7; // R170: Moosanteil am Waldrand (Indikator ≤ 0,5) auf 30 %
const CLEARING_MAX = 0.5;
const PATCH_SPREAD = 2.8; // H-R11 D8: Gewinn vor tanh (vorher 5 mit hartem Klemmen)
const PATCH_FREQ = 0.95,
  PATCH_FREQ2 = 1.7; // Rauschfrequenzen je Kachel der beiden Oktaven
const FOREST_EDGE_LIGHT = 0.3; // Aufhellung des Waldbodens am Rand (Indikator ~0,5)
const WET_SAND = 0.18; // Spec 5.1: sandWet bei 0 ≤ s < 0,18
const FOAM_STATIC = 0.12; // Spec 5.1: statischer Schaumsaum bei −s < 0,12
/**
 * R170: Typ-Übergang. Gewicht je Typ = Indikator^TYPE_BLEND_POW (normiert); der stärkste Typ bleibt der von
 * `terrainAt` (AK-R1-02), die Farbe läuft aber über das Plateau-Band weich in den Nachbartyp statt hart zu springen.
 */
const TYPE_BLEND_POW = 2;
// R170: Abweichung zu M7-Spec 5.1 — kein Kantenband des Fels-Indikators mehr (wirkte als harte Pseudo-3D-Kontur)
const ROCK_AMP = 0.7; // R170: Fels mischt höchstens 70 % zu rockLight/rockDark, stetig statt drei Stufen
const ROCK_GRAIN = 0.05; // R170: Pixelkorn im Fels ±2,5 % Helligkeit (feinkörnig, ohne Flecken)
// Rauschdrehungen (rad): Wertrauschen ist achsparallel; gedreht laufen Flecken nicht entlang der Kachelkanten (R170)
const ROT_PATCH = 1.07,
  ROT_ROCK = 0.41,
  ROT_ROCK2 = 1.23,
  ROT_HILL = 0.33,
  ROT_RELIEF = 0.77,
  ROT_RELIEF2 = 1.31,
  ROT_DUNE2 = 0.41,
  ROT_MOTTLE = 0.93,
  ROT_WARM = 0.6,
  ROT_PATCH2 = 2.17;

// ---------- H-R11: Bodenrelief in gestuften Tonflächen (Stilrahmen S2, S5, S6) ----------
/** Mitte der Tonleiter: ebener Boden (Stufe 2 von 0…4). */
export const GROUND_FLAT = 2;
/**
 * Wellen des Bodenhöhenfelds: Wellenlänge (Kacheln; Hügelgrösse = halbe Wellenlänge, also 2–4 Kacheln), Winkel zur
 * Lichtachse und Tonamplitude in Stufen. Die Welle hat ein Dreiecksprofil im Licht (Parabelbögen in der Höhe): das
 * Gefälle des Tonwerts ist konstant `4 · amp / λ`, die Summe bleibt unter 0,7 Stufen je Kachel (S6: höchstens eine
 * Stufe je Kachel). Rauschen nur als langsame Phasenverschiebung und Amplitudenmodulation.
 */
const GROUND_WAVES: readonly { lambda: number; dAng: number; amp: number }[] = [
  { lambda: 8, dAng: 0.35, amp: 0.55 },
  { lambda: 5.6, dAng: -0.95, amp: 0.3 },
  { lambda: 4, dAng: 0.7, amp: 0.15 },
];
const GROUND_SWIRL = 0.9; // Domain-Warp: Verschiebung ± die Hälfte, in Kacheln
const LIGHT_ANGLE = Math.atan2(LIGHT.y, LIGHT.x);
/** Parabelprofil, dessen Ableitung ein Dreieck ist (−1…1, Periode 1): glatte Kuppen und Mulden. */
const waveProfile = (u: number): number => {
  const f = u - Math.floor(u);
  return f < 0.5 ? -f + 2 * f * f : -2 * f * f + 3 * f - 1;
};
const GROUND_MICRO = 0.05;
const GROUND_MICRO_FREQ = 2.2;
/** Stufen je Einheit Licht auf dem Hang (−∇H · LIGHT, pro Kachel). */
/** Weiche Sättigung der Abweichung von der Ebene (Stufen): steile Kuppen und Mulden laufen nicht über die Rampe hinaus. */
const GROUND_SPAN = 1.1;
/** Tonkanten des Bodens: Helligkeit und Anteil des kühlen bzw. warmen Lichttons je Stufe ±1 (e = (Stufe − 2)). */
/** Kantenbreite der Bodentöne in Ebenenpixeln: schmaler als im Massiv, weil die Ebene beim Zeichnen weich skaliert wird (Zoom 2: ≤ 2 CSS-px). */
const GROUND_EDGE_PX = 0.4;
/** Pixelkorn des Bodens: ± die Hälfte, also ±2,5 % Helligkeit (wie ROCK_GRAIN im Fels). */
const GROUND_GRAIN = 0.05;
const TONE_DARK_MUL = 0.08;
const TONE_COOL_MIX = 0.145;
const TONE_LIGHT_MUL = 0.085;
const TONE_WARM_MIX = 0.136;
/** Wiese: Mischung zum Oliv gleicher Helligkeit (Sättigung des Bodens unter Gebäuden und Bäumen, S5). */
/** Anteil der weichen Grundfarb-Streuung (grassDark … grassLight) an der Wiese; der Rest ist die Mittelfarbe. */
const GRASS_FIELD_KEEP = 0.5;
const MEADOW_OLIVE_MIX = 0.72;
const C_GRASS = rgbOf(PALETTE.grass);
const OLIVE: readonly [number, number, number] = rgbOfCss(
  mixHex(PALETTE.grassDark, PALETTE.sandDry, 0.35),
);
/** Helligkeit der Wiese vor den Tonstufen: die Grundfarbe `grass`. */
const GRASS_LUMA = 0.299 * C_GRASS[0] + 0.587 * C_GRASS[1] + 0.114 * C_GRASS[2];
const OLIVE_LUMA = 0.299 * OLIVE[0] + 0.587 * OLIVE[1] + 0.114 * OLIVE[2];
/** Wiesenfarbe entsättigt Richtung Oliv, Helligkeit bleibt (S5: Boden ist der ruhigste Bildteil). */
export function meadowTint(c: readonly [number, number, number]): [number, number, number] {
  const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const lo = 0.299 * OLIVE[0] + 0.587 * OLIVE[1] + 0.114 * OLIVE[2];
  const k = lo > 0 ? l / lo : 1;
  const t = MEADOW_OLIVE_MIX;
  return [
    c[0] + (OLIVE[0] * k - c[0]) * t,
    c[1] + (OLIVE[1] * k - c[1]) * t,
    c[2] + (OLIVE[2] * k - c[2]) * t,
  ];
}
const TONE_COOL = mixRgb(LIGHT_COLORS.cool, LIGHT_COLORS.dark, 0.5);

export interface TileRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
} // inklusive

// ---------- reine Helfer ----------

/** 1 für Kacheln mit Gebäude oder Weg. */
export function occupancy(world: Pick<World, 'width' | 'height' | 'tiles'>): Uint8Array {
  const occ = new Uint8Array(world.width * world.height);
  for (let i = 0; i < occ.length; i++) {
    const t = world.tiles[i]!;
    occ[i] = t.buildingId !== null || t.road ? 1 : 0;
  }
  return occ;
}

/** Geänderte Kacheln plus `border` Kacheln Rand (Vorgabe 1), auf die Karte geklemmt; null, wenn nichts geändert ist. */
export function dirtyRect(
  prev: Uint8Array,
  next: Uint8Array,
  w: number,
  h: number,
  border = 1,
): TileRect | null {
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let i = 0; i < w * h; i++)
    if (prev[i] !== next[i]) {
      const x = i % w,
        y = (i / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  if (x1 < 0) return null;
  return {
    x0: Math.max(0, x0 - border),
    y0: Math.max(0, y0 - border),
    x1: Math.min(w - 1, x1 + border),
    y1: Math.min(h - 1, y1 + border),
  };
}

/**
 * Randbreite der Feld-Glättung in Kacheln (M10 Spec 7): Eine Kachel wirkt über das Bilinearfeld bis zur Nachbarmitte
 * (1 Kachel) plus Rauschverschiebung `WARP`, dazu der Höhen-Weichzeichner (zwei Durchgänge Radius `HEIGHT_BLUR` Knoten)
 * und ein Knoten fürs Gefälle. Aufgerundet.
 */
export const SMOOTH_BORDER = Math.ceil(1 + WARP + (2 * HEIGHT_BLUR + 1) * (RASTER / TEX));

/** Geländeart je Kachel (0 Wasser, 1 + Index in `LAND`); das Abbild, an dem die Teil-Neuzeichnung Wechsel erkennt. */
export function terrainCodes(world: Pick<World, 'width' | 'height' | 'tiles'>): Uint8Array {
  const codes = new Uint8Array(world.width * world.height);
  for (let i = 0; i < codes.length; i++) {
    const t = world.tiles[i]!.terrain;
    codes[i] = t === 'water' ? 0 : LAND.indexOf(t) + 1;
  }
  return codes;
}

/** Geänderte Geländekacheln plus Glättungsrand (`SMOOTH_BORDER`), geklemmt; null, wenn das Gelände gleich ist. */
export function terrainPatchRect(
  prev: Uint8Array,
  next: Uint8Array,
  w: number,
  h: number,
): TileRect | null {
  return dirtyRect(prev, next, w, h, SMOOTH_BORDER);
}

/** Dev-Zähler: Dauer der letzten Teil-Neuzeichnungen (ms > 0), höchstens 20 Werte. */
export const terrainStats: { lastPatchMs: number; patches: number[] } = {
  lastPatchMs: 0,
  patches: [],
};
const STATS_MAX = 20;

/** Teil-Neuzeichnung nur für dieselbe Welt und bei geändertem Layout-Schlüssel (RF-2). */
export function shouldPatch(
  meta: { world: unknown; key: string },
  world: unknown,
  key: string,
): boolean {
  return meta.world === world && key !== meta.key;
}

/** Grösse der Ebene und ihrer halben Kopie in Pixeln (AK-ISO-19). */
export function terrainLayerSize(
  world: Pick<World, 'width' | 'height'>,
  scale: number,
): { w: number; h: number }[] {
  const w = Math.round(world.width * TEX * scale),
    h = Math.round(world.height * TEX * scale);
  return [
    { w, h },
    { w: Math.ceil(w / 2), h: Math.ceil(h / 2) },
  ];
}

/** Büschel einer Grasskachel in Kachel-Anteilen (0,1…0,9), deterministisch; `tone` 0 hell, 1 dunkel. */
export function tuftsFor(
  seed: number,
  x: number,
  y: number,
  lush = 0.5,
): { x: number; y: number; tone: 0 | 1 }[] {
  // H-R9 B3: satter Boden (lush 1) trägt bis 3, trockener (0) meist 0–1 Büschel; 0,5 = bisherige 0–2
  const n = Math.min(3, Math.floor(hash2(seed + 31, x, y) * (3 + 1.8 * (lush - 0.5))));
  const out: { x: number; y: number; tone: 0 | 1 }[] = [];
  for (let k = 0; k < n; k++)
    out.push({
      x: 0.1 + 0.8 * hash2(seed + 32 + k * 3, x, y),
      y: 0.1 + 0.8 * hash2(seed + 33 + k * 3, x, y),
      tone: hash2(seed + 34 + k * 3, x, y) < 0.5 ? 0 : 1,
    });
  return out;
}

// ---------- Knotengitter und Pixel ----------

export type World3 = Pick<World, 'width' | 'height' | 'tiles' | 'seed'>;
export interface TerrainGrid {
  seed: number;
  nx: number;
  ny: number;
  sharp: Float32Array; // Küstenwert mit Plateau (Klassifikation Wasser/Land)
  smooth: Float32Array; // Küstenwert bilinear (Tiefe, Strand)
  ind: Float32Array[]; // Land-Indikatoren in der Reihenfolge von LAND
  grass: Float32Array; // Grasmischung 0..1
  rock: Float32Array; // Felsrauschen 0..1
  /** H-R11: Tonwert des Bodens 0…4 (stetig; die Stufung folgt je Pixel in `paintPixels`). */
  tone: Float32Array;
  shade: Float32Array; // Relief −0,08…0,08 (Gebirgsknoten −0,12…0,12, R149)
  /**
   * Fleckenfeld −1…1 (R149, vorgeformt, Rauschen um 0 gespreizt): positiv Klee auf Gras bzw. Moos im Wald, negativ
   * trockene Stellen auf Gras bzw. Lichtungen im Wald. Ein Feld statt zwei spart Rechenzeit im Frame-Budget.
   */
  patch: Float32Array;
  /** H-R9 R3: Gebirgsanteil rein bilinear (ohne Plateau) — Schutt am Gebirgsrand, wo das Massiv die Ecke rundet. */
  mfoot: Float32Array;
  /** H-R9: Wiesenton −1 satt/kühl … +1 trocken/warm (grosser Verlauf, mittlere Flecken, Kuppen trockener). */
  warm: Float32Array;
  /** H-R9: feines gedrehtes Mottling −1…1. */
  mottle: Float32Array;
  /** H-R9: Blumenschleier 0…1 (dieselbe Verteilung wie `flowersFor`). */
  veil: Float32Array;
  cls: Uint8Array; // 0 Wasser, 1 + Index in LAND
}

const smoothstepClamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** H-R9 B1: ungewichtete Wiesenkuppe 0…1 am Kachelpunkt (Merkmale ~0,23 und ~0,5 je Kachel, gedreht). */
export function meadowHill(seed: number, fx: number, fy: number): number {
  return (
    0.62 * rotNoise(seed + 105, fx, fy, 0.23, ROT_RELIEF) +
    0.38 * rotNoise(seed + 106, fx, fy, 0.51, ROT_RELIEF2)
  );
}
/**
 * H-R11: Höhenfeld des Bodens (Wiese und Wald) in Kachelhöhen: Hügel von 2–4 Kacheln (`meadowHill`) plus Mikro-
 * Unebenheit von 0,3–0,6 Kachel. Es steht nur im Bild (S6), nie in der Geometrie.
 */
export function groundHeight(seed: number, fx0: number, fy0: number): number {
  // G1: tieffrequenter Domain-Warp der Eingangskoordinaten (gedreht, Merkmal ≈ 2–3 Kacheln): die Tonkanten laufen
  // Bögen statt gerader Facettenkanten. Rauschen nur hier, einmal je Punkt (nicht je Welle und nicht je Pixel).
  const fx = fx0 + GROUND_SWIRL * (rotNoise(seed + 127, fx0, fy0, 0.5, ROT_RELIEF) - 0.5),
    fy = fy0 + GROUND_SWIRL * (rotNoise(seed + 128, fx0, fy0, 0.5, ROT_RELIEF2) - 0.5);
  const mod = 0.85 + 0.3 * rotNoise(seed + 126, fx0, fy0, 0.1, ROT_PATCH);
  let h = 0;
  for (let k = 0; k < GROUND_WAVES.length; k++) {
    const w = GROUND_WAVES[k]!;
    const ang = LIGHT_ANGLE + w.dAng + 0.26 * (hash2(seed + 120, k, 0) - 0.5);
    const lam = w.lambda * (0.9 + 0.2 * hash2(seed + 121, k, 0));
    const u = (Math.cos(ang) * fx + Math.sin(ang) * fy) / lam + hash2(seed + 122, k, 0);
    // Höhe der Welle: ihr Licht (Tonwert) soll die Amplitude `w.amp` Stufen haben, a = amp · λ / |n · L|
    const nl = Math.max(0.35, Math.abs(Math.cos(ang - LIGHT_ANGLE)));
    h += mod * ((w.amp * lam) / nl) * waveProfile(u);
  }
  return h;
}
/** H-R11: Mikro-Unebenheit des Tonwerts (Merkmale 0,3–0,6 Kachel) in Stufen, ± halbe Amplitude; wirkt als Korn der Kanten. */
const groundMicro = (seed: number, fx: number, fy: number): number =>
  GROUND_MICRO * (rotNoise(seed + 113, fx, fy, GROUND_MICRO_FREQ, ROT_MOTTLE) - 0.5);
const toneOf = (hx: number, hy: number, micro: number): number =>
  GROUND_FLAT + GROUND_SPAN * Math.tanh((-(hx * LIGHT.x + hy * LIGHT.y) + micro) / GROUND_SPAN);
/** H-R11: stetiger Tonwert 0…4 (Stufen) des Bodens an einem Kachelpunkt; Lichtseite links oben (LIGHT). */
export function groundToneAt(seed: number, fx: number, fy: number): number {
  const d = RASTER / TEX; // Knotenabstand in Kacheln: dieselbe Differenz wie im Raster
  const hx = (groundHeight(seed, fx + d, fy) - groundHeight(seed, fx - d, fy)) / (2 * d);
  const hy = (groundHeight(seed, fx, fy + d) - groundHeight(seed, fx, fy - d)) / (2 * d);
  return toneOf(hx, hy, groundMicro(seed, fx, fy));
}

/** H-R9 B2 (R3): Dünenmaske 0…1 — etwa die Hälfte des trockenen Strands bleibt ohne Dünen. */
export const duneMask = (seed: number, fx: number, fy: number): number =>
  smoothstepClamp((rotNoise(seed + 111, fx, fy, 0.1, ROT_RELIEF) - 0.515) * 5);
/**
 * H-R9 B2 (R3): ungewichteter Dünenrücken 0…1 — einzelne gestreckte Kuppen statt durchgehender Bänder: Richtung
 * (±0,55 rad) und Wellenlänge (Faktor 0,7–1,3) variieren tieffrequent, die Rücken setzen längs aus (Hüllkurve) und
 * nur etwa die Hälfte des trockenen Strands trägt überhaupt Dünen (Maske).
 */
export function duneRidge(seed: number, fx: number, fy: number): number {
  const mask = duneMask(seed, fx, fy);
  if (mask <= 0) return 0;
  // Richtung π/4 ± 0,55 rad: auf dem Bild waagrecht ± 30°, nie entlang der Kachelachsen (0 bzw. π/2)
  const ang = Math.PI / 4 + 1.1 * (rotNoise(seed + 110, fx, fy, 0.12, ROT_RELIEF) - 0.5);
  const q = 0.7 + 0.6 * rotNoise(seed + 112, fx, fy, 0.07, ROT_RELIEF2);
  const c = Math.cos(ang),
    sn = Math.sin(ang);
  const u = c * fx - sn * fy,
    v = sn * fx + c * fy;
  // längs kurze Kuppen (≈ 3 Kacheln), je Rücken versetzt
  const env = smoothstepClamp((valueNoise(seed + 109, u * 0.33, v * 0.28 * q) - 0.45) * 4);
  const crest = 1 - Math.abs(2 * valueNoise(seed + 107, u * 0.12, v * 0.5 * q + ROT_DUNE2) - 1);
  return mask * env * crest * crest;
}
/** H-R9 B2: Dünengewicht nach Küstenwert: 0 am nassen Saum (< WET_SAND), voll DUNE_RAMP Kacheln dahinter. */
export const duneWeight = (smooth: number): number =>
  smoothstepClamp((smooth - WET_SAND) / DUNE_RAMP);
/** Höhe der Wiesenkuppen bzw. Dünenrücken (Faktoren auf `meadowHill`/`duneRidge`, für Tests). */
export const RELIEF_AMP = { hill: HILL_AMP, dune: DUNE_AMP } as const;

/** Separabler Box-Weichzeichner mit Radius `r` (Knoten), Ränder geklemmt; `tmp` gleich gross wie `f`. */
function boxBlur(f: Float32Array, nx: number, ny: number, r: number, tmp: Float32Array): void {
  const span = 2 * r + 1;
  for (let j = 0; j < ny; j++) {
    const row = j * nx;
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += f[row + Math.min(nx - 1, Math.max(0, k))]!;
    for (let i = 0; i < nx; i++) {
      tmp[row + i] = acc / span;
      acc += f[row + Math.min(nx - 1, i + r + 1)]! - f[row + Math.max(0, i - r)]!;
    }
  }
  for (let i = 0; i < nx; i++) {
    let acc = 0;
    for (let k = -r; k <= r; k++) acc += tmp[Math.min(ny - 1, Math.max(0, k)) * nx + i]!;
    for (let j = 0; j < ny; j++) {
      f[j * nx + i] = acc / span;
      acc += tmp[Math.min(ny - 1, j + r + 1) * nx + i]! - tmp[Math.max(0, j - r) * nx + i]!;
    }
  }
}

/** Knotenfenster (inklusive) im globalen Gitter. */
interface NodeWindow {
  i0: number;
  j0: number;
  i1: number;
  j1: number;
}

/** Rechnet alle Felder auf dem groben Raster (alle `RASTER` Texturpixel ein Knoten). */
export function buildGrid(
  world: World3,
  fields: TerrainFields = terrainFields(world),
): TerrainGrid {
  return computeWindow(world, fields, {
    i0: 0,
    j0: 0,
    i1: (world.width * TEX) / RASTER,
    j1: (world.height * TEX) / RASTER,
  });
}

/** Wie `buildGrid`, aber nur im Knotenfenster; `nx`/`ny` des Ergebnisses sind die Fenstermasse. */
function computeWindow(world: World3, fields: TerrainFields, win: NodeWindow): TerrainGrid {
  const nx = win.i1 - win.i0 + 1,
    ny = win.j1 - win.j0 + 1;
  const n = nx * ny;
  const sharp = new Float32Array(n),
    smooth = new Float32Array(n),
    grass = new Float32Array(n),
    rock = new Float32Array(n),
    shade = new Float32Array(n),
    tone = new Float32Array(n).fill(GROUND_FLAT),
    groundH = new Float32Array(n),
    groundM = new Float32Array(n),
    patch = new Float32Array(n),
    warm = new Float32Array(n),
    mfoot = new Float32Array(n),
    mottle = new Float32Array(n),
    veil = new Float32Array(n),
    gwArr = new Float32Array(n),
    swArr = new Float32Array(n),
    hillRaw = new Float32Array(n), // ungewichtet: das Gewicht darf selbst kein Gefälle erzeugen
    duneRaw = new Float32Array(n),
    height = new Float32Array(n),
    footH = new Float32Array(n), // Gebirgsanteil der Höhe (für die Dämpfung des Hofs an der Grasseite)
    cls = new Uint8Array(n);
  const ind = LAND.map(() => new Float32Array(n));
  const seed = world.seed;
  const mt = LAND.indexOf('mountain');
  const gr = LAND.indexOf('grass');
  const sa = LAND.indexOf('sand');
  const step = RASTER / TEX;
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const fx = (win.i0 + i) * step,
        fy = (win.j0 + j) * step;
      const [wx, wy] = warp(seed, fx, fy);
      sharp[k] = sampleField(fields.coast, wx, wy, COAST_BAND);
      smooth[k] = sampleField(fields.coast, wx, wy);
      let best = 0,
        bestV = -Infinity;
      for (let t = 0; t < LAND.length; t++) {
        const v = sampleField(fields.types[LAND[t]!], wx, wy, EDGE_BAND);
        ind[t]![k] = v;
        if (v > bestV) {
          bestV = v;
          best = t;
        }
      }
      cls[k] = sharp[k]! <= 0 ? 0 : 1 + best;
      const m =
        0.65 * valueNoise(seed + 11, fx * 0.35, fy * 0.35) +
        0.35 * valueNoise(seed + 13, fx * 1.1, fy * 1.1);
      grass[k] = smoothstepClamp((m - 0.5) * 1.8 + 0.5); // Spreizung: das Rauschen liegt eng um 0,5
      // R170: Felsstruktur feinkörnig (~3,2 und ~4,3 Merkmale je Kachel, zwei Drehungen), stetig gespreizt
      const r =
        0.7 * rotNoise(seed + 19, fx, fy, 3.2, ROT_ROCK) +
        0.3 * rotNoise(seed + 27, fx, fy, 4.3, ROT_ROCK2);
      rock[k] = smoothstepClamp((r - 0.5) * 2.2 + 0.5);
      // R149/R170: Gebirgshöhe aus dem Bilinearfeld (sanfter Fuss) plus Kuppen im Gebirge
      const foot = sampleField(fields.types.mountain, wx, wy);
      mfoot[k] = foot;
      if (cls[k] !== 0) {
        // nur an Landknoten (Wasser braucht keine Flecken); Wert schon geformt, das Pixelfeld interpoliert nur
        // H-R11 D8: zwei gedrehte Oktaven und weiche Sättigung (tanh) statt hartem Klemmen des 5-fach gespreizten
        // Wertrauschens: Plateaus mit Randlinien sahen wie eckige, kachelparallele Flecken aus
        patch[k] = Math.tanh(
          (0.6 * rotNoise(seed + 62, fx, fy, PATCH_FREQ, ROT_PATCH) +
            0.4 * rotNoise(seed + 114, fx, fy, PATCH_FREQ2, ROT_PATCH2) -
            0.5) *
            PATCH_SPREAD,
        );
      }
      // H-R9 B1/B2: Mikrorelief nur auf Gras (Kuppen) und trockenem Sand (Dünen); Wald, Fels, nasser Saum bleiben 0
      const gw = cls[k] === 0 ? 0 : ind[gr]![k]!;
      const sw = cls[k] === 0 ? 0 : ind[sa]![k]! * duneWeight(smooth[k]!);
      // H-R11: Bodenhöhe etwas weiter ins Wasser, damit der Tonwert am Ufer keinen Sprung durch fehlende Nachbarn hat
      if (smooth[k]! > -1.5) {
        groundH[k] = groundHeight(seed, fx, fy);
        groundM[k] = groundMicro(seed, fx, fy);
      }
      if (smooth[k]! > -0.5) {
        hillRaw[k] = meadowHill(seed, fx, fy);
        duneRaw[k] = duneRidge(seed, fx, fy);
      }
      const hill = hillRaw[k]!;
      if (gw > 0) {
        warm[k] = Math.max(
          -1,
          Math.min(
            1,
            2 * meadowWarmth(seed, fx, fy) +
              6 * (rotNoise(seed + 102, fx, fy, 0.35, ROT_WARM) - 0.5) +
              (hill - 0.5) * 0.5,
          ),
        );
        mottle[k] = Math.max(
          -1,
          Math.min(1, (rotNoise(seed + 103, fx, fy, 2.4, ROT_MOTTLE) - 0.5) * 3),
        );
        veil[k] = flowerVeil(seed, fx, fy);
      }
      gwArr[k] = gw;
      swArr[k] = sw;
      footH[k] =
        FOOT_HEIGHT * foot + HILL_HEIGHT * foot * rotNoise(seed + 29, fx, fy, 0.9, ROT_HILL);
      height[k] =
        smooth[k]! +
        footH[k]! +
        // H-R9 R3: gedreht (die Hangbeleuchtung ist kräftiger, achsparallele Wellen zeigten das Kachelraster)
        0.5 * rotNoise(seed + 17, fx, fy, 0.5, ROT_HILL) +
        MEADOW_WAVE * rotNoise(seed + 61, fx, fy, 0.3, ROT_PATCH);
    }
  // R170: Knicke der Bilinearfelder (Kachelmitten) weichzeichnen, bevor das Gefälle das Relief bestimmt
  const tmp = new Float32Array(n);
  boxBlur(height, nx, ny, HEIGHT_BLUR, tmp);
  boxBlur(height, nx, ny, HEIGHT_BLUR, tmp);
  boxBlur(footH, nx, ny, HEIGHT_BLUR, tmp);
  boxBlur(footH, nx, ny, HEIGHT_BLUR, tmp);
  // Relief: Gefälle von h gegen die Lichtrichtung (links oben im Kachelraum)
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const il = Math.max(0, i - 1),
        ir = Math.min(nx - 1, i + 1),
        ju = Math.max(0, j - 1),
        jd = Math.min(ny - 1, j + 1);
      const gx = (height[j * nx + ir]! - height[j * nx + il]!) / ((ir - il) * step);
      const gy = (height[jd * nx + i]! - height[ju * nx + i]!) / ((jd - ju) * step);
      let lit = -(gx * LIGHT.x + gy * LIGHT.y);
      const c0 = cls[j * nx + i];
      if (c0 !== mt + 1 || ind[mt]![j * nx + i]! < FOOT_DAMP_IND) {
        // H-R9 Runde 3: der Gebirgsfuss wirft an der Grasseite keinen dunklen Hof (das Massiv trägt das Relief)
        const fgx = (footH[j * nx + ir]! - footH[j * nx + il]!) / ((ir - il) * step);
        const fgy = (footH[jd * nx + i]! - footH[ju * nx + i]!) / ((jd - ju) * step);
        const litFoot = -(fgx * LIGHT.x + fgy * LIGHT.y);
        if (litFoot < 0) lit -= FOOT_DAMP * litFoot;
      }
      const lim = c0 === mt + 1 ? SHADE_MAX_MOUNTAIN : SHADE_MAX;
      let sh = Math.max(-lim, Math.min(lim, lit * SHADE_GAIN));
      // H-R9: Mikrorelief aus dem eigenen Höhenfeld (ungeglättet, rauscht nicht), Grenze je Knotentyp
      const hx = (hillRaw[j * nx + ir]! - hillRaw[j * nx + il]!) / ((ir - il) * step);
      const hy = (hillRaw[jd * nx + i]! - hillRaw[ju * nx + i]!) / ((jd - ju) * step);
      // H-R11: Tonwert des Bodens aus dem Gefälle des Bodenhöhenfelds (gleiche Differenz wie `groundToneAt`)
      tone[j * nx + i] = toneOf(
        (groundH[j * nx + ir]! - groundH[j * nx + il]!) / ((ir - il) * step),
        (groundH[jd * nx + i]! - groundH[ju * nx + i]!) / ((jd - ju) * step),
        groundM[j * nx + i]!,
      );
      const dx = (duneRaw[j * nx + ir]! - duneRaw[j * nx + il]!) / ((ir - il) * step);
      const dy = (duneRaw[jd * nx + i]! - duneRaw[ju * nx + i]!) / ((jd - ju) * step);
      sh +=
        -(
          gwArr[j * nx + i]! * HILL_AMP * (hx * LIGHT.x + hy * LIGHT.y) +
          swArr[j * nx + i]! * DUNE_AMP * (dx * LIGHT.x + dy * LIGHT.y)
        ) * RELIEF_GAIN;
      const cap =
        c0 === mt + 1 ? SHADE_MAX_MOUNTAIN : c0 === FOREST + 1 ? SHADE_MAX : SHADE_MAX_FLUR;
      shade[j * nx + i] = Math.max(-cap, Math.min(cap, sh));
    }
  return {
    seed,
    nx,
    ny,
    sharp,
    smooth,
    ind,
    grass,
    rock,
    shade,
    tone,
    patch,
    warm,
    mfoot,
    mottle,
    veil,
    cls,
  };
}

const rgb = (hex: string): [number, number, number] => rgbOf(hex);
const C = {
  deep: rgb(PALETTE.waterDeep),
  mid: rgb(PALETTE.waterMid),
  shallow: rgb(PALETTE.waterShallow),
  foam: rgb(PALETTE.foam),
  sandDry: rgb(PALETTE.sandDry),
  sandWet: rgb(PALETTE.sandWet),
  grassLight: rgb(PALETTE.grassLight),
  grass: rgb(PALETTE.grass),
  grassDark: rgb(PALETTE.grassDark),
  wood: rgbOfCss(FOREST_FLOOR),
  clover: rgbOfCss(mixHex(PALETTE.grass, PALETTE.waterShallow, 0.3)), // kühleres Grün (R149)
  moss: rgbOfCss(mixHex(FOREST_FLOOR, PALETTE.crown, 0.55)),
  dryTone: rgbOfCss(mixHex(PALETTE.grass, PALETTE.roofThatch, 0.45)), // H-R9 R4: Goldgrün, satt (Farbton, Helligkeit bleibt)
  hollow: rgbOfCss(mixHex(PALETTE.grass, PALETTE.waterShallow, 0.4)), // H-R9 R3: Senke kühl und satt (ΔE fern vom alten Waldgrund)
  lushTone: rgbOfCss(mixHex(PALETTE.grass, PALETTE.crown, 0.5)), // H-R9 R4: sattes Tiefgrün als Farbton (Helligkeit bleibt)
  veilTone: rgbOfCss(mixHex(PALETTE.grassLight, PALETTE.wallLime, 0.5)), // H-R9: Blumenschleier
  clearing: rgbOfCss(mixHex(FOREST_FLOOR, PALETTE.sandDry, 0.45)),
  edgeLight: rgb(PALETTE.sandWet), // warmes Hell am Waldrand: bleibt fern vom alten Waldgrund #3d7a3a
  rock: rgb(PALETTE.rock),
  rockLight: rgb(PALETTE.rockLight),
  rockDark: rgb(PALETTE.rockDark),
  debris: [...DEBRIS], // Schutt am Gebirgsfuss wie im Massiv (light.ts)
};
const mix3 = (a: readonly number[], b: readonly number[], t: number, o: number[]): void => {
  o[0] = a[0]! + (b[0]! - a[0]!) * t;
  o[1] = a[1]! + (b[1]! - a[1]!) * t;
  o[2] = a[2]! + (b[2]! - a[2]!) * t;
};

/** Wasserfarbe nach Tiefe `d` in Kacheln: < 1 flach, 3 mittel, ab 6 tief, dazwischen linear (Spec 5.1). */
function waterColor(d: number, o: number[]): void {
  if (d <= 1) mix3(C.shallow, C.shallow, 0, o);
  else if (d < 3) mix3(C.shallow, C.mid, (d - 1) / 2, o);
  else if (d < 6) mix3(C.mid, C.deep, (d - 3) / 3, o);
  else mix3(C.deep, C.deep, 0, o);
  if (d < FOAM_STATIC) mix3(o, C.foam, 0.6, o);
}

const FOREST = LAND.indexOf('forest');
const GRASS = LAND.indexOf('grass');
const SAND = LAND.indexOf('sand');

/** Farbe eines Land-Typs `t` an einem Pixel (ohne Relief); `lerp` interpoliert ein Knotenfeld. */
function landColor(
  g: TerrainGrid,
  t: number,
  lerp: (f: Float32Array) => number,
  grain: number,
  o: number[],
): void {
  switch (LAND[t]) {
    case 'sand': {
      const s = lerp(g.smooth);
      mix3(C.sandWet, C.sandDry, smoothstepClamp((s - WET_SAND) / 0.06), o);
      break;
    }
    case 'grass': {
      const m = lerp(g.grass);
      if (m < 0.4) mix3(C.grassDark, C.grass, m / 0.4, o);
      else mix3(C.grass, C.grassLight, (m - 0.4) / 0.6, o);
      // H-R11 S3/S5: die weiche Helligkeitsstreuung der Grundfarbe tritt zurück, das Licht tragen die scharfen Tonstufen
      mix3(C.grass, o, GRASS_FIELD_KEEP, o);
      const p = lerp(g.patch);
      if (p > 0.1) mix3(o, C.clover, (p - 0.1) * CLOVER_MAX, o);
      else if (p < -0.1) mix3(o, C.sandDry, (-0.1 - p) * DRY_MAX, o);
      // H-R9 B3: grosser Warm/Kühl-Verlauf mit Flecken und Kuppen, Blumenschleier
      const wm = lerp(g.warm);
      // nur in Teilflächen (|wm| > WARM_ON)
      const wa = Math.max(0, (Math.abs(wm) - WARM_ON) / (1 - WARM_ON));
      if (wm > 0) mix3(o, C.dryTone, wa * WARM_MAX, o);
      else mix3(o, C.lushTone, wa * COOL_MAX, o);
      mix3(o, C.veilTone, lerp(g.veil) * VEIL_MAX, o);
      // H-R11 F1: die Farbvariation ist luminanzneutral (nur Farbton), Helligkeit kommt aus den Tonstufen und dem Korn;
      // ein Rest von ±MOTTLE_AMP bleibt als feines Mottling
      const lw = 0.299 * o[0]! + 0.587 * o[1]! + 0.114 * o[2]!;
      const mf = (lw > 0 ? GRASS_LUMA / lw : 1) * (1 + lerp(g.mottle) * MOTTLE_AMP);
      o[0] = o[0]! * mf;
      o[1] = o[1]! * mf;
      o[2] = o[2]! * mf;
      // H-R11 S5: Richtung Oliv entsättigt, Helligkeit bleibt
      const kOl = ((0.299 * o[0]! + 0.587 * o[1]! + 0.114 * o[2]!) / OLIVE_LUMA) * MEADOW_OLIVE_MIX;
      const keep = 1 - MEADOW_OLIVE_MIX;
      o[0] = o[0]! * keep + OLIVE[0] * kOl;
      o[1] = o[1]! * keep + OLIVE[1] * kOl;
      o[2] = o[2]! * keep + OLIVE[2] * kOl;
      break;
    }
    case 'forest': {
      const p = lerp(g.patch);
      const edge = smoothstepClamp((1 - lerp(g.ind[FOREST]!)) * 2); // innen 0, Rand ~1
      // R170: am sonnigen Rand weniger Moos — sonst ergibt Moos + Klee im Übergang einen Kronenton
      if (p > 0) mix3(C.wood, C.moss, p * MOSS_MAX * (1 - MOSS_EDGE_FADE * edge), o);
      else mix3(C.wood, C.clearing, -p * CLEARING_MAX, o);
      if (edge > 0) mix3(o, C.edgeLight, edge * FOREST_EDGE_LIGHT, o);
      break;
    }
    default: {
      // R170: stetige Felsstruktur ohne Kantenband; Korn je Pixel statt Flecken
      const n = (lerp(g.rock) - 0.5) * 2;
      if (n >= 0) mix3(C.rock, C.rockLight, n * ROCK_AMP, o);
      else mix3(C.rock, C.rockDark, -n * ROCK_AMP, o);
      const out = 1 - lerp(g.mfoot);
      if (out > 0) mix3(o, C.debris, Math.min(1, out * ROCK_EDGE_REACH) * ROCK_EDGE_DEBRIS, o);
      const f = 1 + grain * ROCK_GRAIN;
      o[0] = o[0]! * f;
      o[1] = o[1]! * f;
      o[2] = o[2]! * f;
    }
  }
}

/**
 * Anteil je Land-Typ (Reihenfolge `LAND`, Summe 1; alles 0 im Wasser) an einem Kachelpunkt (fx, fy): dieselben
 * Gewichte (Indikator^TYPE_BLEND_POW), mit denen `paintPixels` die Farben mischt. Für Prüfungen (Waldboden-Hof).
 */
export function landShares(g: TerrainGrid, fx: number, fy: number): number[] {
  const gx = (fx * TEX) / RASTER,
    gy = (fy * TEX) / RASTER;
  const i = Math.min(Math.max(Math.floor(gx), 0), g.nx - 2),
    j = Math.min(Math.max(Math.floor(gy), 0), g.ny - 2);
  const tx = Math.min(Math.max(gx - i, 0), 1),
    ty = Math.min(Math.max(gy - j, 0), 1);
  const a = j * g.nx + i;
  const out = LAND.map((_, t) => {
    const f = g.ind[t]!;
    const v =
      f[a]! * (1 - tx) * (1 - ty) +
      f[a + 1]! * tx * (1 - ty) +
      f[a + g.nx]! * (1 - tx) * ty +
      f[a + g.nx + 1]! * tx * ty;
    return v > 0 ? v ** TYPE_BLEND_POW : 0;
  });
  const sum = out.reduce((p, q) => p + q, 0);
  return sum > 0 ? out.map((q) => q / sum) : out;
}

/**
 * Pixel eines Ausschnitts der Ebene (RGBA). `px0/py0/w/h` in Ebenenpixeln, `scale` = Auflösungsfaktor. Rein, ohne Canvas.
 * R170: Land-Typen mischen ihre Farben nach Gewichten (Indikator^TYPE_BLEND_POW); reine Zellen rechnen nur einen Typ.
 */
export function paintPixels(
  g: TerrainGrid,
  scale: number,
  px0: number,
  py0: number,
  w: number,
  h: number,
  out: Uint8ClampedArray = new Uint8ClampedArray(w * h * 4),
): Uint8ClampedArray {
  const { nx, ny, sharp, smooth, ind, shade, tone, cls } = g;
  const gradScale = 1 / (scale * RASTER); // Knoteneinheiten → Ausgabepixel
  const col = [0, 0, 0],
    tc = [0, 0, 0];
  const mt = LAND.indexOf('mountain');
  const wt = new Array<number>(LAND.length).fill(0);
  const grainSeed = g.seed + 23;
  for (let py = 0; py < h; py++) {
    const gy = (py0 + py + 0.5) / scale / RASTER;
    const j = Math.min(Math.max(Math.floor(gy), 0), ny - 2);
    const ty = Math.min(Math.max(gy - j, 0), 1);
    for (let px = 0; px < w; px++) {
      const gx = (px0 + px + 0.5) / scale / RASTER;
      const i = Math.min(Math.max(Math.floor(gx), 0), nx - 2);
      const tx = Math.min(Math.max(gx - i, 0), 1);
      const a = j * nx + i,
        b = a + 1,
        c = a + nx,
        d = c + 1;
      const w00 = (1 - tx) * (1 - ty),
        w10 = tx * (1 - ty),
        w01 = (1 - tx) * ty,
        w11 = tx * ty;
      const lerp = (f: Float32Array): number =>
        f[a]! * w00 + f[b]! * w10 + f[c]! * w01 + f[d]! * w11;
      const c0 = cls[a]!;
      // reine Zelle: vier gleiche Klassen, und an Land trägt jeder Knoten nur seinen Typ (Indikator 1)
      const uniform = c0 === cls[b] && c0 === cls[c] && c0 === cls[d];
      const own = c0 === 0 ? null : ind[c0 - 1]!;
      const pure =
        uniform && (own === null || (own[a] === 1 && own[b] === 1 && own[c] === 1 && own[d] === 1));
      const water = uniform ? c0 === 0 : lerp(sharp) <= 0;
      if (water) {
        waterColor(Math.max(0, -lerp(smooth)), col);
      } else {
        const grain = hash2(grainSeed, px0 + px, py0 + py) - 0.5;
        let wMt: number,
          wFlur: number,
          wSum = 1;
        if (pure) {
          landColor(g, c0 - 1, lerp, grain, col);
          wMt = c0 - 1 === mt ? 1 : 0;
          wFlur = c0 - 1 === GRASS || c0 - 1 === SAND ? 1 : 0;
        } else {
          let sum = 0;
          for (let t = 0; t < LAND.length; t++) {
            const v = lerp(ind[t]!);
            const q = v > 0 ? v ** TYPE_BLEND_POW : 0;
            wt[t] = q;
            sum += q;
          }
          col[0] = col[1] = col[2] = 0;
          for (let t = 0; t < LAND.length; t++) {
            const q = wt[t]! / sum;
            if (q <= 0) continue;
            landColor(g, t, lerp, grain, tc);
            col[0] += tc[0]! * q;
            col[1] += tc[1]! * q;
            col[2] += tc[2]! * q;
          }
          wSum = sum;
          wMt = wt[mt]! / sum;
          wFlur = (wt[GRASS]! + wt[SAND]!) / sum;
        }
        // R149: ±12 % nur im Gebirge; R170 stetig: Pixel mit Gebirgsanteil ≤ 50 % tragen höchstens ±8 %
        // H-R9: Gras und Strand bis ±14 %, Wald weiter ±8 %; der Grenzwert läuft mit den Typgewichten
        const lim =
          SHADE_MAX +
          (SHADE_MAX_MOUNTAIN - SHADE_MAX) * smoothstepClamp((wMt - 0.5) * 2) +
          (SHADE_MAX_FLUR - SHADE_MAX) * wFlur;
        // H-R11: auf Gras und Wald trägt die gestufte Tonleiter das Licht (unten), die weiche Schattierung entfällt dort
        const wTone = pure
          ? c0 - 1 === GRASS || c0 - 1 === FOREST
            ? 1
            : 0
          : (wt[GRASS]! + wt[FOREST]!) / wSum;
        let sh = Math.max(-lim, Math.min(lim, lerp(shade))) * (1 - wTone);
        // H-R9 R3: Senken auf Gras/Strand ab HOLLOW_FROM nur noch teils dunkler, sonst kühler und satter (I5: reine
        // Abdunklung rückt das Gras an den alten Waldgrund)
        const deep = sh < -HOLLOW_FROM ? (-HOLLOW_FROM - sh) * wFlur * HOLLOW_SHARE : 0;
        if (deep > 0) {
          sh += deep;
          mix3(col, C.hollow, Math.min(1, deep * HOLLOW_GAIN), col);
        }
        const f = 1 + sh;
        col[0] = col[0]! * f;
        col[1] = col[1]! * f;
        col[2] = col[2]! * f;
        if (wTone > 0) {
          // Stufung je Pixel nach der Interpolation (S2); Kantenbreite aus dem Gefälle des Tonwerts je Ausgabepixel
          const tA = tone[a]!,
            tB = tone[b]!,
            tC = tone[c]!,
            tD = tone[d]!;
          const gxT = (tB - tA) * (1 - ty) + (tD - tC) * ty,
            gyT = (tC - tA) * (1 - tx) + (tD - tB) * tx;
          const hw = toneHalfWidth(Math.sqrt(gxT * gxT + gyT * gyT) * gradScale, GROUND_EDGE_PX);
          const e = Math.max(
            -1.5,
            Math.min(1.5, toneStep(tA * w00 + tB * w10 + tC * w01 + tD * w11, hw) - GROUND_FLAT),
          );
          if (e < 0) {
            const k = -e * wTone;
            const m = 1 - TONE_DARK_MUL * k;
            col[0] = col[0]! * m;
            col[1] = col[1]! * m;
            col[2] = col[2]! * m;
            mix3(col, TONE_COOL, TONE_COOL_MIX * k, col);
          } else if (e > 0) {
            const k = e * wTone;
            const m = 1 + TONE_LIGHT_MUL * k;
            col[0] = col[0]! * m;
            col[1] = col[1]! * m;
            col[2] = col[2]! * m;
            mix3(col, LIGHT_COLORS.warm, TONE_WARM_MIX * k, col);
          }
          // H-R11 F2: Pixelkorn (1 Ebenenpixel, deterministisch aus dem Hash) auf Wiese und Waldboden
          const gm = 1 + grain * GROUND_GRAIN * wTone;
          col[0] = col[0]! * gm;
          col[1] = col[1]! * gm;
          col[2] = col[2]! * gm;
        }
      }
      const o = (py * w + px) * 4;
      out[o] = col[0]!;
      out[o + 1] = col[1]!;
      out[o + 2] = col[2]!;
      out[o + 3] = 255;
    }
  }
  return out;
}

// ---------- Canvas-Hülle ----------

interface TerrainMeta {
  world: World;
  scale: number;
  grid: TerrainGrid;
  fields: TerrainFields;
  occ: Uint8Array;
  codes: Uint8Array;
  key: string;
  half: HTMLCanvasElement | null;
  buildMs: number;
}
const meta = new WeakMap<HTMLCanvasElement, TerrainMeta>();

function paintRegion(
  ctx: CanvasRenderingContext2D,
  grid: TerrainGrid,
  scale: number,
  px0: number,
  py0: number,
  w: number,
  h: number,
): void {
  for (let y = 0; y < h; y += CHUNK) {
    const ch = Math.min(CHUNK, h - y);
    const img = ctx.createImageData(w, ch);
    paintPixels(grid, scale, px0, py0 + y, w, ch, img.data);
    ctx.putImageData(img, px0, py0 + y);
  }
}

/** Kachel ist unbelegtes Gras. */
const isFreeGrass = (world: World, occ: Uint8Array, x: number, y: number): boolean => {
  const i = y * world.width + x;
  return world.tiles[i]!.terrain === 'grass' && occ[i] !== 1;
};

/**
 * Deko auf unbelegten Grasskacheln im Rechteck (Texturpixel × `scale`): Büschel, Büsche am Waldrand, Blumen.
 * Je Farbe ein Pfad; belegte Kacheln und Nicht-Gras bekommen nichts (R149).
 */
export function paintDecor(
  ctx: CanvasRenderingContext2D,
  world: World,
  occ: Uint8Array,
  scale: number,
  r: TileRect,
): void {
  const { width: w, height: h, seed } = world;
  const forestAt = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < w && y < h && world.tiles[y * w + x]!.terrain === 'forest';
  ctx.save();
  ctx.scale(scale, scale);
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  // H-R11: Farbe nach der Tonstufe des Bodens darunter (Schatten 1, eben 2, Licht 3), Dichte unverändert
  for (const tone of [0, 1] as const)
    for (const st of [1, 2, 3] as const) {
      ctx.beginPath();
      let any = false;
      for (let y = r.y0; y <= r.y1; y++)
        for (let x = r.x0; x <= r.x1; x++) {
          if (!isFreeGrass(world, occ, x, y)) continue;
          const lush = 0.5 - 0.5 * meadowWarmth(seed, x + 0.5, y + 0.5);
          for (const t of tuftsFor(seed, x, y, lush)) {
            if (t.tone !== tone) continue;
            const level = Math.max(
              1,
              Math.min(3, Math.floor(groundToneAt(seed, x + t.x, y + t.y) + 0.5)),
            );
            if (level !== st) continue;
            const px = (x + t.x) * TEX,
              py = (y + t.y) * TEX;
            ctx.moveTo(px - 1.5, py);
            ctx.lineTo(px - 0.5, py - 3.5);
            ctx.moveTo(px, py);
            ctx.lineTo(px, py - 4.5);
            ctx.moveTo(px + 1.5, py);
            ctx.lineTo(px + 0.5, py - 3.5);
            any = true;
          }
        }
      if (!any) continue;
      ctx.strokeStyle = tuftColor(tone, st);
      ctx.stroke();
    }
  // flache Büsche auf der Waldseite
  for (const tone of [0, 1] as const) {
    ctx.beginPath();
    let any = false;
    for (let y = r.y0; y <= r.y1; y++)
      for (let x = r.x0; x <= r.x1; x++) {
        if (!isFreeGrass(world, occ, x, y)) continue;
        const sides = {
          left: forestAt(x - 1, y),
          right: forestAt(x + 1, y),
          up: forestAt(x, y - 1),
          down: forestAt(x, y + 1),
        };
        if (!(sides.left || sides.right || sides.up || sides.down)) continue;
        for (const b of shrubsFor(seed, x, y, sides)) {
          if (b.tone !== tone) continue;
          const px = (x + b.x) * TEX,
            py = (y + b.y) * TEX,
            rx = b.r * TEX;
          ctx.moveTo(px + rx, py);
          ctx.ellipse(px, py, rx, rx * 0.6, 0, 0, Math.PI * 2);
          any = true;
        }
      }
    if (!any) continue;
    ctx.fillStyle = SHRUB_TONES[tone]!;
    ctx.fill();
  }
  // Blumen: kleine Punkte
  for (const tone of [0, 1, 2] as const) {
    ctx.beginPath();
    let any = false;
    for (let y = r.y0; y <= r.y1; y++)
      for (let x = r.x0; x <= r.x1; x++) {
        if (!isFreeGrass(world, occ, x, y)) continue;
        for (const f of flowersFor(seed, x, y))
          if (f.tone === tone) {
            ctx.rect((x + f.x) * TEX, (y + f.y) * TEX, f.size, f.size);
            any = true;
          }
      }
    if (!any) continue;
    ctx.fillStyle = FLOWER_TONES[tone]!;
    ctx.fill();
  }
  ctx.restore();
}

/** Standard-Auflösungsfaktor aus dem `devicePixelRatio` (Spec 5.1, Tech B3): ab 1,5 doppelt, sonst einfach. */
export const defaultTerrainScale = (
  dpr: number | undefined = (globalThis as { devicePixelRatio?: number }).devicePixelRatio,
): number => ((dpr ?? 1) >= 1.5 ? 2 : 1);

/** Baut die Terrain-Ebene einmal je Welt: Canvas `width·TEX·scale`; Aufbau gemessen. */
export function buildTerrainLayer(world: World, scale = defaultTerrainScale()): HTMLCanvasElement {
  const t0 = performance.now();
  const { w, h } = terrainLayerSize(world, scale)[0]!;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D-Kontext nicht verfügbar');
  const fields = terrainFields(world);
  const grid = buildGrid(world, fields);
  paintRegion(ctx, grid, scale, 0, 0, w, h);
  const occ = occupancy(world);
  paintDecor(ctx, world, occ, scale, { x0: 0, y0: 0, x1: world.width - 1, y1: world.height - 1 });
  const buildMs = performance.now() - t0;
  const codes = terrainCodes(world);
  meta.set(canvas, {
    world,
    scale,
    grid,
    fields,
    occ,
    codes,
    key: layoutKey(world),
    half: null,
    buildMs,
  });
  if (import.meta.env.DEV)
    console.info('[terrain] Aufbau', Math.round(buildMs), 'ms, Faktor', scale);
  return canvas;
}

export const terrainScale = (layer: HTMLCanvasElement): number => meta.get(layer)?.scale ?? 1;
export const terrainBuildMs = (layer: HTMLCanvasElement): number => meta.get(layer)?.buildMs ?? 0;

/**
 * Gleicht Felder und Raster mit dem neuen Gelände ab, nur im Rechteck `r` (Kacheln). Typfelder ändern sich nur an den
 * geänderten Kacheln; das Küstenfeld (Breitensuche über die Karte) nur, wenn Wasser und Land wechseln (nicht bei Wald ↔ Weide).
 */
export function patchGrid(
  world: World3,
  fields: TerrainFields,
  g: TerrainGrid,
  prev: Uint8Array,
  next: Uint8Array,
  r: TileRect,
): void {
  let coastChanged = false;
  for (let i = 0; i < next.length; i++) {
    if (prev[i] === next[i]) continue;
    if ((prev[i] === 0) !== (next[i] === 0)) coastChanged = true;
    for (let t = 0; t < LAND.length; t++) fields.types[LAND[t]!].v[i] = next[i] === t + 1 ? 1 : 0;
  }
  if (coastChanged) fields.coast = coastField(world);
  const k = TEX / RASTER; // Knoten je Kachel
  const margin = 2 * HEIGHT_BLUR + 1; // Reichweite von Weichzeichner und Gefälle in Knoten
  const inner = { i0: r.x0 * k, j0: r.y0 * k, i1: (r.x1 + 1) * k, j1: (r.y1 + 1) * k };
  const win = {
    i0: Math.max(0, inner.i0 - margin),
    j0: Math.max(0, inner.j0 - margin),
    i1: Math.min(g.nx - 1, inner.i1 + margin),
    j1: Math.min(g.ny - 1, inner.j1 + margin),
  };
  const part = computeWindow(world, fields, win);
  const copy = (dst: ArrayLike<number> & { [i: number]: number }, src: ArrayLike<number>): void => {
    for (let j = inner.j0; j <= inner.j1; j++)
      for (let i = inner.i0; i <= inner.i1; i++)
        dst[j * g.nx + i] = src[(j - win.j0) * part.nx + (i - win.i0)]!;
  };
  for (const f of [
    'sharp',
    'smooth',
    'grass',
    'rock',
    'shade',
    'tone',
    'patch',
    'mfoot',
    'warm',
    'mottle',
    'veil',
  ] as const)
    copy(g[f], part[f]);
  copy(g.cls, part.cls);
  for (let t = 0; t < LAND.length; t++) copy(g.ind[t]!, part.ind[t]!);
}

/**
 * Zeichnet bei geänderter Belegung (Gebäude, Wege) die betroffenen Kacheln plus 1 Kachel Rand neu, bei Geländewechsel
 * (Roden, Aufforsten) das Raster und die Kacheln samt Glättungsrand. Ein Rechteck, kein Vollaufbau.
 * Eine fremde Welt auf dieser Ebene zeichnet nichts neu (RF-2).
 */
export function updateTerrainLayer(
  layer: HTMLCanvasElement,
  world: World,
): { redrawn: boolean; ms: number } {
  const m = meta.get(layer);
  if (!m) return { redrawn: false, ms: 0 };
  const key = layoutKey(world);
  if (!shouldPatch(m, world, key)) return { redrawn: false, ms: 0 };
  const t0 = performance.now();
  const next = occupancy(world);
  const occRect = dirtyRect(m.occ, next, world.width, world.height);
  const codes = terrainCodes(world);
  const terRect = terrainPatchRect(m.codes, codes, world.width, world.height);
  const rect = unionRect(occRect, terRect);
  m.key = key;
  m.occ = next;
  if (!rect) return { redrawn: false, ms: performance.now() - t0 };
  if (terRect) {
    patchGrid(world, m.fields, m.grid, m.codes, codes, terRect);
    m.codes = codes;
  }
  const ctx = layer.getContext('2d');
  if (!ctx) return { redrawn: false, ms: 0 };
  const s = TEX * m.scale;
  const px = Math.round(rect.x0 * s),
    py = Math.round(rect.y0 * s);
  const pw = Math.round((rect.x1 + 1) * s) - px,
    ph = Math.round((rect.y1 + 1) * s) - py;
  paintRegion(ctx, m.grid, m.scale, px, py, pw, ph);
  paintDecor(ctx, world, next, m.scale, rect);
  if (m.half) {
    const hc = m.half.getContext('2d');
    if (hc) {
      hc.imageSmoothingQuality = 'high';
      hc.clearRect(px / 2, py / 2, pw / 2, ph / 2);
      hc.drawImage(layer, px, py, pw, ph, px / 2, py / 2, pw / 2, ph / 2);
    }
  }
  const ms = performance.now() - t0;
  if (terRect && ms > 0) {
    terrainStats.lastPatchMs = ms;
    terrainStats.patches.push(ms);
    if (terrainStats.patches.length > STATS_MAX) terrainStats.patches.shift();
  }
  return { redrawn: true, ms };
}

const unionRect = (a: TileRect | null, b: TileRect | null): TileRect | null =>
  !a || !b
    ? (a ?? b)
    : {
        x0: Math.min(a.x0, b.x0),
        y0: Math.min(a.y0, b.y0),
        x1: Math.max(a.x1, b.x1),
        y1: Math.max(a.y1, b.y1),
      };

/** Einmal vorskalierte Kopie mit halber Kantenlänge (Zoom ≤ 0,5, AK-ISO-19). */
export function halfLayer(layer: HTMLCanvasElement): HTMLCanvasElement {
  const m = meta.get(layer);
  if (m?.half) return m.half;
  const half = document.createElement('canvas');
  half.width = Math.ceil(layer.width / 2);
  half.height = Math.ceil(layer.height / 2);
  const ctx = half.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, half.width, half.height);
  }
  if (m) m.half = half;
  return half;
}
