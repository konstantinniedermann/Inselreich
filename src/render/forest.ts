import { hash2, valueNoise } from '../sim/noise';
import {
  GIANT_SCALE,
  GROUP_SHAPES,
  SHAPES,
  TREE_H,
  crownGeom,
  crownHeight,
  groupMembers,
  maxRadius,
  shapeValue,
  type Crown,
  type CrownKind,
} from './crown';
import { ISO_W } from './isoBase';
import { rotNoise } from './light';
import { SAUM_LEVEL, floorShare, saumAt, woodBlur, woodNoise, type WoodMask } from './woodField';

// forest.ts — reine Platzierung des Waldes (ART-STIL-02 L1, WALD-02; Spec 2.1, 3.2 B1–B5, 3.7). Kein Canvas, kein DOM.
//
// WALD-02: Jede Krone wird einzeln gesetzt, nicht mehr als Stempel je Kachel. Kandidaten je Kachel (Lage, Rang) sind
// eine reine Funktion von (Seed, Kachel); das Saumfeld S (`woodField.ts`) entscheidet an der Lage jeder Krone, ob sie
// steht, wie gross sie ist und welche Rolle sie hat (Kern, lichter Rand, Vorwald auf der Wiese). Ein Blue-Noise-Ausdünnen
// über Kachelgrenzen hinweg (Rangfolge, Mindestabstand aus den Radien) verhindert jedes Kachelraster. Gezeichnet wird je
// Tiefenband-Zelle ein Objekt (`WoodCell`), siehe `bandCell`.
//
// Salze (Block 500–599, Kopf von groundDecor.ts): 500 Waldtyp · 501 Akzentart · 502 Bestandsfeld · 503 Akzentfeld ·
// 508 Lichtungsfeld · 509 Riesenbaum-Wahl je Kachel · 510 Riesenbaum ja/nein (alle L1) ·
// WALD-02: 518/519/520 Randrauschen des Saumfelds (woodField.ts, auch `forestEdgeShift`) · 521 Kandidaten je Kachel
// (Lage, Rang, Einzelwurf) · 522 Grössen-/Altersfeld · 523 Tonfeld · 524 Beimischung · 525 Totholz · 526 Vorwalddichte ·
// 527 Form und Spiegelung · 528 Horstfeld · 529 Rottenfeld (Dichtestaffel im Nadelwald).
// Nicht mehr benutzt (WALD-02): 504, 505, 506, 507, 511, 514, 515, 516, 517 (alte Stempelplatzierung).
//
// Schnittstellen für L6 (Lichtung, trees.ts): `woodLayout` liefert die Zellen samt Kronen; `forestClearing` ist das
// Lichtungsfeld (Boden in terrain.ts, Ausdünnung hier); `slotKind` die Art eines Bestands.

/** Art-Slot: Platz 0 ist die Hauptart des Waldtyps, 1 die Nebenart, 2 der Akzent. */
export type Slot = 0 | 1 | 2;
/** Waldtyp (Spec 3.7): 0 Mischwald, 1 Nadelwald, 2 Birken- und Hellholzwald, 3 Pinienwald. */
export type ForestType = 0 | 1 | 2 | 3;
/**
 * Klasse einer Kachel für die Platzierung: freier Wald, freie Wiese (Vorwald erlaubt), `quiet` freie Wiese ohne
 * Vorwald (direkt vor einem Gebäude), `object` Gebäude, Weg oder Deko-Stempel (Nachbarn bleiben in ihrer Kachel),
 * `blocked` sonst (Sand, Fels, Wasser, ausserhalb).
 */
export type TileClass = 'forest' | 'meadow' | 'quiet' | 'object' | 'blocked';

/**
 * Waldtyp je Karte aus `hash2(seed + 500, 0, 0)`. Der Stempel-Seed (`env.seed`, Weltseed) und der Seed der
 * Inselansicht sind für die Heimatinsel gleich; gilt der Typ je Karte, kommt er immer aus dem Stempel-Seed.
 */
export const forestType = (seed: number): ForestType =>
  (Math.floor(hash2(seed + 500, 0, 0) * 4) % 4) as ForestType;
/** Mischwald: Akzentart ist Ahorn (B5) statt Birke (B4)? */
export const accentIsMaple = (seed: number): boolean => hash2(seed + 501, 0, 0) < 0.5;

/** Baumart je Art-Slot und Waldtyp (Spec 3.7); `null` im Mischwald steht für den Akzent (Birke oder Ahorn). */
const SLOT_KINDS: readonly (readonly (CrownKind | null)[])[] = [
  [0, 1, null], // Mischwald
  [1, 0, 2], // Nadelwald
  [2, 0, 1], // Birken- und Hellholzwald
  [3, 1, 0], // Pinienwald
];
/** Baumart eines Slots (Waldtyp aus dem Seed, Akzent im Mischwald je Seed Birke oder Ahorn). */
export function slotKind(seed: number, slot: number): CrownKind {
  const k = SLOT_KINDS[forestType(seed)]![slot]!;
  return k ?? (accentIsMaple(seed) ? 4 : 2);
}

/** Art-Slot an einem Punkt aus einem tieffrequenten Bestandsfeld (Merkmal ≈ 6 Kacheln), Schwellen je Waldtyp. */
export function slotAt(seed: number, type: ForestType, fx: number, fy: number): Slot {
  const d = valueNoise(seed + 502, fx / 6, fy / 6);
  if (type === 0) {
    // Akzent selten: kleine Gruppen aus einem eigenen, höher gefrequenten Feld
    if (valueNoise(seed + 503, fx / 3.5, fy / 3.5) > 0.76) return 2;
    return d < 0.5 ? 0 : 1;
  }
  return d < 0.6 ? 0 : d < 0.86 ? 1 : 2;
}

/** Betrag des Bodenversatzes (`forestEdgeShift`). */
const FLOOR_AMP = 0.3;
/**
 * Randversatz für den Farnsaum (groundDecor.ts), in [−0,3; +0,3] Kacheln: WALD-02 nimmt dafür das Randrauschen des
 * Saumfelds — positiv, wo die Waldkante nach aussen wellt. Signatur unverändert.
 */
export const forestEdgeShift = (seed: number, fx: number, fy: number): number =>
  FLOOR_AMP * woodNoise(seed, fx, fy);

/** Lichtungsfeld 0…1 (Merkmal ≈ 5 Kacheln); ab 0,5 lichtet sich der Kern. */
export const forestClearing = (seed: number, fx: number, fy: number): number => {
  const n = valueNoise(seed + 508, fx / 5, fy / 5);
  const t = clamp((n - 0.78) / 0.1, 0, 1);
  return t * t * (3 - 2 * t);
};

/** Grössen- und Altersfeld 0…1 des Bestands (B1, Merkmal ≈ 6 Kacheln): 0 junger, 1 alter Bestand. */
export const standAt = (seed: number, fx: number, fy: number): number =>
  smooth01((rotNoise(seed + 522, fx, fy, 1 / 6, 0.9) - 0.3) / 0.4);

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const smooth01 = (t: number): number => {
  const u = clamp(t, 0, 1);
  return u * u * (3 - 2 * u);
};

/** Rottenfeld des Nadelwalds 0…1 (Salz 529, Merkmal ROTTE_PERIOD): 1 dichte Rotte, 0 lichte Partie. */
const rotteField = (seed: number, fx: number, fy: number): number =>
  smooth01((rotNoise(seed + 529, fx, fy, 1 / ROTTE_PERIOD, 2.4) - 0.36) / 0.28);
/** Horste und kleine Bestandslücken im Kern (Salz 528, Merkmal ≈ 2,5 Kacheln): Faktor auf die Annahme. */
const horstFactor = (seed: number, fx: number, fy: number, core: number): number =>
  1 - HORST_DEPTH * core * smooth01((0.55 - rotNoise(seed + 528, fx, fy, 1 / 2.5, 1.9)) / 0.3);
/**
 * Fix-Runde 3 B: Bestandsdichte 0…1 am Punkt mit Saumwert `s`: dieselben Faktoren (Lichtung im Kern, Rotten des
 * Nadelwalds, Horste), die die Annahme der Kronen senken. 1 dichtes Dach, klein in lichten Partien.
 */
export function standDensity(seed: number, fx: number, fy: number, s: number): number {
  const core = smooth01((s - SAUM_LEVEL) / CORE_SPAN);
  const gap = core > 0.6 ? forestClearing(seed, fx, fy) : 0;
  const conifer = slotKind(seed, slotAt(seed, forestType(seed), fx, fy)) === 1;
  const light = conifer ? LIGHT_ACCEPT + (1 - LIGHT_ACCEPT) * rotteField(seed, fx, fy) : 1;
  return (1 - 0.85 * gap) * light * horstFactor(seed, fx, fy, core);
}
/** Fix-Runde 3 B: Waldboden je Bestandsdichte: unter DENSE_LO nur FLOOR_LIGHT des Bodens, ab DENSE_HI voll. */
const FLOOR_LIGHT = 0.35,
  DENSE_LO = 0.3,
  DENSE_HI = 0.75,
  /** erst ab diesem Anteil des lichten Randes (CORE_SPAN) wirkt die Dichte: der Saum selbst bleibt unverändert */
  FLOOR_INNER = 0.3;
/**
 * Faktor auf den Waldbodenanteil (`floorShare`) am Punkt mit Saumwert `s`: lichte Partien im Innern sind zur Wiese
 * gemischt (Bestandsdichte unter DENSE_LO: nur FLOOR_LIGHT); am Saum (bis FLOOR_INNER · CORE_SPAN) bleibt der Boden.
 */
export function floorFactor(seed: number, fx: number, fy: number, s: number): number {
  const inner = smooth01(
    (s - SAUM_LEVEL - FLOOR_INNER * CORE_SPAN) / ((1 - FLOOR_INNER) * CORE_SPAN),
  );
  if (inner <= 0) return 1;
  const d = standDensity(seed, fx, fy, s);
  const k = FLOOR_LIGHT + (1 - FLOOR_LIGHT) * smooth01((d - DENSE_LO) / (DENSE_HI - DENSE_LO));
  return 1 - (1 - k) * inner;
}

// ---------------------------------------------------------------------------------------------------------------
// Darstellungswerte der Platzierung

/** Kandidaten je Waldkachel und je Vorwaldkachel. */
const CAND_FOREST = 12,
  CAND_MEADOW = 5;
/** Breite des lichten Randes in S-Einheiten (innen): von SAUM_LEVEL bis SAUM_LEVEL + CORE_SPAN wächst das Dach zu. */
const CORE_SPAN = 0.35;
/** Annahme je Kandidat: lichter Rand, voller Kern, hinter der Saumlinie (Waldkachel). */
const ACCEPT_EDGE = 0.45,
  ACCEPT_CORE = 0.97,
  ACCEPT_BEHIND = 0.3;
/** Vorwald: Band unter der Saumlinie (S-Einheiten), höchste Annahme, Anteil Büsche. */
const VORWALD_BAND = 0.45,
  VORWALD_ACCEPT = 0.7,
  VORWALD_BUSH = 0.55,
  VORWALD_BUSH_CONIFER = 0.35;
/** Grundradius (Kacheln) je Baumart bei Grössenfeld 1: Laub, Nadel, Birke, Pinie, Ahorn. */
const R_KIND = [0.27, 0.25, 0.22, 0.32, 0.26] as const;
/** Grössenfeld (Alter des Bestands, Merkmal ≈ 6 Kacheln): Spanne; Einzelwurf ±; Überhälter: Anteil und Faktor. */
const STAND_LO = 0.6,
  STAND_HI = 1.25,
  SIZE_JITTER = 0.3,
  EMERGENT_P = 0.06,
  EMERGENT_F = 1.3;
/** Nadelbäume streuen stärker (die Höhe folgt dem Radius; kein Nagelbrett). */
const CONIFER_JITTER = 0.42;
/** Horste: Ausdünnung im Kern, wo das Horstfeld tief liegt (Anteil). */
const HORST_DEPTH = 0.3;
/** Grösse der Bäume hinter der Saumlinie (Jungwuchs) gegen den Kern. */
const BEHIND_SIZE = 0.6;
/**
 * Dichtestaffel im Nadelwald (Fix-Runde 2): Rottenfeld (Salz 529, Merkmal ≈ 6,5 Kacheln) 0 licht … 1 dicht; Annahme in
 * lichten Partien `LIGHT_ACCEPT`; unter `ROTTE_GROUP` meist Jungwuchs-Gruppen (`YOUNG_GROUP_P`, Radius × `YOUNG_GROUP_R`).
 */
const ROTTE_PERIOD = 6.5,
  LIGHT_ACCEPT = 0.3,
  ROTTE_GROUP = 0.45,
  YOUNG_GROUP_P = 0.7,
  YOUNG_GROUP_R = 0.72;
/** Beimischung in Gruppen: Feld (Salz 524) über der Schwelle (≈ 15–20 % der Fläche), Merkmal in Kacheln. */
const ADMIX_FIELD = 0.66,
  ADMIX_PERIOD = 1.9;
/** Beimischung (B3): Anteil Kronen einer anderen Art. */
const ADMIX_P = 0.03,
  ADMIX_PINE = 0.16;
/**
 * Baumgruppen im Kern (Fix-Runde 1, Perf): ab Kernanteil GROUP_FROM mit Anteil bis GROUP_P; Gruppenradius
 * GROUP_R + GROUP_R_STAND × Bestandsalter (±GROUP_JITTER), höchstens GROUP_R_MAX; Abstand zweier Gruppen
 * SPACING_GROUP × Radiensumme.
 */
const GROUP_FROM = 0.05,
  GROUP_P = 0.9,
  GROUP_R = 0.3,
  GROUP_R_STAND = 0.2,
  GROUP_JITTER = 0.12,
  GROUP_R_MAX = 0.5,
  SPACING_GROUP = 0.6,
  SPACING_GROUP_SINGLE = 0.82;
/**
 * Abstand: Mindestabstand der Fusspunkte als Anteil der Radiensumme je Art (Laub, Nadel, Birke, Pinie, Ahorn; Laub
 * schliesst dichter), für Büsche und Totholz, und absolut (Kacheln).
 */
const SPACING_KIND = [0.62, 0.78, 0.68, 0.68, 0.62] as const;
const SPACING_BUSH = 0.65,
  SPACING_MIN = 0.17;
/** Grösster Radius auf einer Eng-Kachel (Nachbar eines Objekts). */
const TIGHT_R = 0.2;
/** Kronen höchstens so weit über die eigene Kachel (Spec 2.1.1). */
export const OVERHANG = 0.35;
/** Vorwald: Gehölze höchstens 0,6 × TREE_H hoch. */
export const VORWALD_TOP = 0.6 * TREE_H;
/** Vorwald: höchstens so viele Gehölze je Wiesenkachel. */
export const VORWALD_MAX = 3;
/** Vorwald höchstens so viele Kacheln vor dem Wald (Chebyshev). */
export const VORWALD_REACH = 2;
/** Mindestzahl Kronen je freier Waldkachel (Spec 2.1.5). */
export const MIN_CROWNS = 3;
export { SHAPES, shapeValue } from './crown';
/** Tonfeld (B2): Merkmal in Kacheln, Schwellen für −1/+1, Anteil Einzelwurf. */
const TONE_PERIOD = 7,
  TONE_LO = 0.42,
  TONE_HI = 0.58,
  TONE_FLIP = 0.1;
/** Totholz (B3): Anteil je Kandidat in Lücken und im lichten Kern. */
const DEAD_P = 0.015;

export interface WoodInput {
  seed: number;
  w: number;
  h: number;
  /** Geländewald je Kachel (für das Saumfeld; Gebäude und Wege auf Wald zählen mit). */
  terrainForest: (x: number, y: number) => boolean;
  /** Klasse je Kachel für die Kronen. */
  cls: (x: number, y: number) => TileClass;
  /** Fix-Runde 3 A: Footprint-Kachel eines Gebäudes? (kein Stammfuss darauf, kleine Bäume davor) */
  building?: (x: number, y: number) => boolean;
}
/**
 * Fix-Runde 3 A: Bäume auf den Kacheln vor einem Gebäude (+x, +y, +x+y) und im Bild seitlich daneben (+x−y, −x+y)
 * sind Jungbäume mit Radius ≤ FRONT_R,
 * ihr Fuss steht in der vom Haus abgewandten Kachelhälfte (Anteil ≥ FRONT_SET): die Fassade bleibt lesbar, Bäume
 * davor gibt es weiter (Verdeckung, Fensterlicht).
 */
const FRONT_R = 0.12,
  FRONT_SET = 0.5;
/**
 * Fix-Runde 3 B: Nachsetzen unter dunklem Boden. Ab Waldbodenanteil FILL_DARK gilt der Boden als dunkel; Abtastung
 * FILL_STEPS × FILL_STEPS je Kachel; Kronenrand höchstens FILL_REACH (Kacheln) entfernt (Ziel ≤ 0,3 im Bild, mit Reserve
 * für die Rasterung des Bodens). Lage und Form aus den Kandidaten-Würfen (Salz 521) mit Indizes jenseits der
 * Kandidaten (j ab FILL_J0 = CAND_FOREST, Wurf k ab 8): keine eigene Periodik, kein neues Salz.
 */
const FILL_DARK = 0.42,
  FILL_STEPS = 5,
  FILL_REACH = 0.2,
  /** auf Wiesenkacheln etwas weiter (Wiese bleibt Wiese: höchstens 1,5 Gehölze je Vorwaldkachel, RF-W-3) */
  FILL_REACH_MEADOW = 0.26,
  FILL_J0 = 12;

/** Ein Wald-Objekt: Kachel (für Sortierung und Culling) und seine Kronen, Fusspunkte relativ zur Kachel. */
export interface WoodCell {
  x: number;
  y: number;
  /** Eigene Kachel (Nachbar eines Objekts): alle Kronen liegen ganz in der Kachel. Sonst Tiefenband-Zelle. */
  own: boolean;
  crowns: Crown[];
}
export interface WoodLayout {
  mask: WoodMask;
  cells: WoodCell[];
}

/**
 * Tiefenband-Zelle eines Fusspunkts: Kachel (x, y) mit x + y = ⌊fx + fy − 0,5⌋ und x − y am nächsten an fx − fy. Die
 * Kronen einer Zeile x + y = k haben Tiefe in [k + 0,5; k + 1,5), die Objektreihenfolge nach `depthKey` ist damit über
 * die Zeilen hinweg die Tiefe der Kronen (B5: keine Kachelbänder aus falsch sortierten Nachbarstempeln).
 */
export function bandCell(fx: number, fy: number): { x: number; y: number } {
  const k = Math.floor(fx + fy - 0.5);
  const t = fx - fy;
  const tt = k + 2 * Math.round((t - k) / 2);
  return { x: (k + tt) / 2, y: (k - tt) / 2 };
}

interface Cand {
  fx: number;
  fy: number;
  tx: number;
  ty: number;
  p: number;
  /** Krone; bei abgelehnten Kandidaten erst gebaut, wenn sie als Mindestkrone gebraucht wird (`mk`). */
  c: Crown;
  mk?: () => Crown;
  forest: boolean;
}

/** Höhe des Kronenmittelpunkts über dem Fuss aus der Form (Totholz 0, Riesenbaum gedeckelt). */
function heightOf(c: Crown): number {
  if (c.dead) return 0;
  if (!c.giant) return crownHeight(c);
  const hh = crownGeom(c).hh;
  return Math.min((c.kind === 1 ? 1.05 : 1.7) * hh, GIANT_SCALE * TREE_H - hh);
}

/**
 * Platzierung aller Kronen einer w × h-Karte. Kandidaten je freier Wald- und Vorwaldkachel, Annahme und Grösse aus dem
 * Saumfeld, Blue-Noise-Ausdünnung nach Rang, mindestens `MIN_CROWNS` je freier Waldkachel, Fussscheibe nie über einer
 * gesperrten Kachel, Riesenbaum (B3). Ergebnis nach Zellen, Kronen je Zelle nach Tiefe sortiert.
 */
export function woodLayout(inp: WoodInput): WoodLayout {
  const { seed, w, h, cls } = inp;
  const type = forestType(seed);
  const m = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) m[y * w + x] = inp.terrainForest(x, y) ? 1 : 0;
  const mask = woodBlur(w, h, m);
  const S = (fx: number, fy: number): number => saumAt(seed, mask, fx, fy);
  // Klassen einmal je Kachel abfragen (die Nachbarschaftsschleifen lesen sie oft)
  const clsArr: TileClass[] = new Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) clsArr[y * w + x] = cls(x, y);
  const at = (x: number, y: number): TileClass =>
    x < 0 || y < 0 || x >= w || y >= h ? 'blocked' : clsArr[y * w + x]!;
  const free = new Uint8Array(w * h); // 1 freier Wald, 2 Vorwald-Wiese
  const tight = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = at(x, y);
      if (c !== 'forest' && c !== 'meadow') continue;
      let near = c === 'forest';
      let obj = false;
      for (let dy = -VORWALD_REACH; dy <= VORWALD_REACH; dy++)
        for (let dx = -VORWALD_REACH; dx <= VORWALD_REACH; dx++) {
          const n = at(x + dx, y + dy);
          if (n === 'forest') near = true;
          if (n === 'object' && Math.abs(dx) <= 1 && Math.abs(dy) <= 1) obj = true;
        }
      if (!near) continue;
      free[y * w + x] = c === 'forest' ? 1 : 2;
      tight[y * w + x] = obj ? 1 : 0;
    }
  /** Darf eine Fussscheibe über die Kachel (x, y) ragen? Nur über Wald und Vorwald-Wiese. */
  const openTile = (x: number, y: number): boolean => {
    const c = at(x, y);
    return c === 'forest' || c === 'meadow';
  };

  // Fix-Runde 3 A: Gebäude-Footprints und die Kacheln davor, seitlich und dahinter (Lage des Hauses: 1 = −x, 2 = −y,
  // 4 = Ecke −x−y, 8 = +x−y, 16 = −x+y; dahinter 32 = +x, 64 = +y)
  const bld = new Uint8Array(w * h);
  if (inp.building)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) bld[y * w + x] = inp.building(x, y) ? 1 : 0;
  const bAt = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < w && y < h && bld[y * w + x] === 1;
  const front = new Uint8Array(w * h);
  if (inp.building)
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++)
        if (!bld[y * w + x])
          front[y * w + x] =
            (bAt(x - 1, y) ? 1 : 0) |
            (bAt(x, y - 1) ? 2 : 0) |
            (bAt(x - 1, y - 1) ? 4 : 0) |
            (bAt(x + 1, y - 1) ? 8 : 0) | // im Bild links neben dem Haus
            (bAt(x - 1, y + 1) ? 16 : 0) | // im Bild rechts neben dem Haus
            (bAt(x + 1, y) ? 32 : 0) | // hinter der linken Wand
            (bAt(x, y + 1) ? 64 : 0); // hinter der rechten Wand
  /** Fix-Runde 3 A: kein Stammfuss (auch keiner eines Gruppenbaums) auf einer Gebäudekachel, keine Gruppe davor. */
  const clearOf = (fx: number, fy: number, c: Crown): boolean => {
    if (!inp.building) return true;
    if (c.group !== undefined) {
      if (front[Math.floor(fy) * w + Math.floor(fx)]) return false;
      return groupMembers(c).every((m) => !bAt(Math.floor(fx + m.cx), Math.floor(fy + m.cy)));
    }
    return !bAt(Math.floor(fx), Math.floor(fy));
  };

  const rnd = (x: number, y: number, j: number, k: number): number =>
    hash2(seed + 521, (x * 32 + j) * 16 + k, y);
  const cands: Cand[] = [];
  const byTile = new Map<number, Cand[]>();
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const f = free[y * w + x]!;
      if (!f) continue;
      const list: Cand[] = [];
      const n = f === 1 ? CAND_FOREST : CAND_MEADOW;
      for (let j = 0; j < n; j++) {
        const fx = x + rnd(x, y, j, 0),
          fy = y + rnd(x, y, j, 1);
        const res = f === 1 ? forestCrown(fx, fy, x, y, j) : vorwaldCrown(fx, fy, x, y, j);
        const cand: Cand = {
          fx,
          fy,
          tx: x,
          ty: y,
          p: rnd(x, y, j, 2),
          c: (res.ok ? res.make() : null) as unknown as Crown,
          forest: f === 1,
        };
        if (!res.ok) cand.mk = res.make;
        const c = res;
        list.push(cand);
        if (c.ok) cands.push(cand);
      }
      byTile.set(y * w + x, list);
    }

  function makeCrown(
    kind: CrownKind,
    r: number,
    x: number,
    y: number,
    j: number,
    flags: { bush?: boolean; young?: boolean },
    top: number,
  ): Crown {
    const shape = Math.floor(hash2(seed + 527, x * 32 + j, y) * SHAPES);
    const mirror = hash2(seed + 527, x * 32 + j, y + 4096) < 0.5;
    const c: Crown = {
      kind,
      cx: 0,
      cy: 0,
      r: Math.min(
        r,
        OVERHANG,
        maxRadius(
          { kind, bush: flags.bush === true, young: flags.young === true, s: shapeValue(shape) },
          top,
        ),
      ),
      h: 0,
      bush: flags.bush === true,
      s: shapeValue(shape),
      mirror,
    };
    if (flags.young) c.young = true;
    return c;
  }
  function toneAt(fx: number, fy: number, x: number, y: number, j: number): -1 | 0 | 1 {
    const t = rotNoise(seed + 523, fx, fy, 1 / TONE_PERIOD, 0.42);
    let tone: -1 | 0 | 1 = t < TONE_LO ? -1 : t > TONE_HI ? 1 : 0;
    if (rnd(x, y, j, 9) < TONE_FLIP) tone = rnd(x, y, j, 10) < 0.5 ? -1 : 1;
    return tone;
  }
  function rotteAt(fx: number, fy: number): number {
    return rotteField(seed, fx, fy);
  }
  function forestCrown(
    fx: number,
    fy: number,
    x: number,
    y: number,
    j: number,
  ): { ok: boolean; make: () => Crown } {
    const s = S(fx, fy);
    const core = smooth01((s - SAUM_LEVEL) / CORE_SPAN);
    const inside = s >= SAUM_LEVEL;
    const gap = core > 0.6 ? forestClearing(seed, fx, fy) : 0;
    let accept = inside ? ACCEPT_EDGE + (ACCEPT_CORE - ACCEPT_EDGE) * core : ACCEPT_BEHIND;
    accept *= 1 - 0.85 * gap;
    // Fix-Runde 2: Nadelwald mit Dichtestaffel (Merkmal ≈ 6,5 Kacheln): dichte, dunkle Rotten und lichte Partien
    const slot = slotAt(seed, type, fx, fy);
    const conifer = slotKind(seed, slot) === 1;
    const rotte = conifer ? rotteAt(fx, fy) : 1;
    accept *= LIGHT_ACCEPT + (1 - LIGHT_ACCEPT) * rotte;
    // Horste und kleine Bestandslücken im Kern (Merkmal ≈ 2,5 Kacheln): das Dach ist kein Teppich
    accept *= horstFactor(seed, fx, fy, core);
    // Totholz (B3) in Lücken und im lichten Kern
    if (rnd(x, y, j, 7) < DEAD_P * (0.3 + 2 * gap) && core > 0.5) {
      const dead = rnd(x, y, j, 8) < 0.7 ? 1 : 2;
      return {
        ok: true,
        make: () => {
          const c = makeCrown(0, dead === 1 ? 0.07 : 0.09, x, y, j, {}, TREE_H);
          c.dead = dead;
          c.h = 0;
          return c;
        },
      };
    }
    // die Krone selbst nur bauen, wenn sie gebraucht wird (angenommen oder als Mindestkrone)
    return {
      ok: rnd(x, y, j, 12) < accept,
      make: () => buildForest(fx, fy, x, y, j, slot, core, inside, rotte),
    };
  }
  function buildForest(
    fx: number,
    fy: number,
    x: number,
    y: number,
    j: number,
    slot: Slot,
    core: number,
    inside: boolean,
    rotte: number,
  ): Crown {
    let kind = slotKind(seed, slot);
    // Beimischung (B3): in Gruppen aus einem eigenen Feld (Merkmal ≈ 2 Kacheln), dazu selten einzeln
    const patch = rotNoise(seed + 524, fx, fy, 1 / ADMIX_PERIOD, 0.7) > ADMIX_FIELD;
    const admixed = !patch && rnd(x, y, j, 3) < (type === 3 ? ADMIX_PINE : ADMIX_P);
    if (patch)
      kind = slotKind(
        seed,
        (slot + 1 + (rotNoise(seed + 524, fx, fy, 1 / 3.7, 2.1) < 0.5 ? 1 : 0)) % 3,
      );
    else if (admixed) kind = slotKind(seed, (slot + 1 + (rnd(x, y, j, 4) < 0.5 ? 1 : 0)) % 3);
    const stand01 = standAt(seed, fx, fy);
    // Baumgruppe im Kern (Fix-Runde 1): ein Atlas-Eintrag für 3–6 Bäume, spart Zeichenaufrufe
    if (
      !admixed &&
      kind !== 3 && // Pinien stehen einzeln (Schirme verschieden hoch, Durchblick)
      !tight[y * w + x] &&
      core >= GROUP_FROM &&
      rnd(x, y, j, 13) < GROUP_P * smooth01((core - GROUP_FROM) / 0.2)
    ) {
      const group = Math.floor(rnd(x, y, j, 14) * GROUP_SHAPES);
      const mirror = rnd(x, y, j, 15) < 0.5;
      // lichte Partien des Nadelwalds: Jungwuchs-Gruppen (kleine, schlanke Fichten)
      const youngG = rotte < ROTTE_GROUP && rnd(x, y, j, 17) < YOUNG_GROUP_P;
      const gr =
        (GROUP_R + GROUP_R_STAND * stand01) *
        (1 + GROUP_JITTER * (2 * rnd(x, y, j, 5) - 1)) *
        (youngG ? YOUNG_GROUP_R : 1);
      const c: Crown = {
        kind,
        cx: 0,
        cy: 0,
        r: Math.min(
          gr,
          GROUP_R_MAX,
          maxRadius({ kind, bush: false, young: youngG, group, mirror }),
        ),
        h: 0,
        bush: false,
        s: shapeValue(0),
        mirror,
        group,
        ...(youngG ? { young: true } : {}),
        tone: Math.min(toneAt(fx, fy, x, y, j), rotte > 0.75 && rnd(x, y, j, 16) < 0.5 ? -1 : 1),
      };
      return c;
    }
    const stand = STAND_LO + (STAND_HI - STAND_LO) * stand01;
    const jitter = kind === 1 ? CONIFER_JITTER : SIZE_JITTER;
    let size = stand * (0.75 + 0.25 * core) * (1 + jitter * (2 * rnd(x, y, j, 5) - 1));
    // Jungwuchs: hinter der Saumlinie, im lichten Rand, und in den lichten Partien des Nadelwalds
    const young =
      !inside || (core < 0.3 && rnd(x, y, j, 6) < 0.5) || (rotte < 0.4 && rnd(x, y, j, 6) < 0.55);
    if (young && rotte < 0.4 && inside) size *= 0.7;
    if (!inside) size *= BEHIND_SIZE; // hinter der Saumlinie: niedriger Jungwuchs
    if (!young && core > 0.5 && rnd(x, y, j, 11) < EMERGENT_P) size *= EMERGENT_F;
    const c = makeCrown(kind, R_KIND[kind] * size, x, y, j, { young }, TREE_H);
    c.tone = toneAt(fx, fy, x, y, j);
    if (!inside) c.cast = true;
    return c;
  }
  function vorwaldCrown(
    fx: number,
    fy: number,
    x: number,
    y: number,
    j: number,
  ): { ok: boolean; make: () => Crown } {
    const s = S(fx, fy);
    const v = smooth01((s - (SAUM_LEVEL - VORWALD_BAND)) / VORWALD_BAND);
    const mod = 0.3 + 0.7 * valueNoise(seed + 526, fx / 4, fy / 4);
    const accept = VORWALD_ACCEPT * v * mod;
    return {
      ok: s < SAUM_LEVEL + 0.15 && rnd(x, y, j, 12) < accept,
      make: () => buildVorwald(fx, fy, x, y, j),
    };
  }
  function buildVorwald(fx: number, fy: number, x: number, y: number, j: number): Crown {
    const slot = slotAt(seed, type, fx, fy);
    // vor Nadelwald mehr Jungfichten als Gebüsch (Fix-Runde 2: der Vorwald löst gerade Kanten auf)
    const bush =
      rnd(x, y, j, 3) < (slotKind(seed, slot) === 1 ? VORWALD_BUSH_CONIFER : VORWALD_BUSH);
    const kind: CrownKind = bush ? 0 : slotKind(seed, rnd(x, y, j, 4) < 0.7 ? slot : 2);
    const r = bush ? 0.07 + 0.06 * rnd(x, y, j, 5) : 0.1 + 0.07 * rnd(x, y, j, 5);
    const c = makeCrown(kind, r, x, y, j, bush ? { bush } : { young: true }, VORWALD_TOP);
    c.tone = toneAt(fx, fy, x, y, j);
    c.cast = true;
    return c;
  }

  // Blue-Noise-Ausdünnung: nach Rang, Mindestabstand aus den Radien (Raster je Kachel für die Nachbarsuche)
  cands.sort((a, b) => b.p - a.p || a.fy - b.fy || a.fx - b.fx);
  const grid = new Map<number, Cand[]>();
  const keyOf = (x: number, y: number): number => y * (w + 8) + x;
  const conflicts = (q: Cand, minD: number): boolean => {
    const x0 = Math.floor(q.fx),
      y0 = Math.floor(q.fy);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        for (const o of grid.get(keyOf(x0 + dx, y0 + dy)) ?? []) {
          const k =
            q.c.bush || o.c.bush || q.c.dead || o.c.dead
              ? SPACING_BUSH
              : q.c.group !== undefined && o.c.group !== undefined
                ? SPACING_GROUP
                : q.c.group !== undefined || o.c.group !== undefined
                  ? SPACING_GROUP_SINGLE
                  : Math.min(SPACING_KIND[q.c.kind], SPACING_KIND[o.c.kind]);
          const d = Math.max(minD, k * (q.c.r + o.c.r));
          if ((q.fx - o.fx) ** 2 + (q.fy - o.fy) ** 2 < d * d) return true;
        }
      }
    return false;
  };
  /** Fussscheibe nie über gesperrte Kacheln; Eng (Nachbar eines Objekts): ganz in der eigenen Kachel. */
  function clampFoot(q: Cand): void {
    const c = q.c;
    const k = q.ty * w + q.tx;
    let u = q.fx - q.tx,
      v = q.fy - q.ty;
    const fb = front[k]!;
    const fr = fb & 31;
    // hinter dem Haus: grosse Bäume bleiben, ihr Fuss rückt von der Wand ab (keine Fichte an der Wand)
    if (fb & 32 && c.group === undefined) u = Math.min(u, 1 - FRONT_SET);
    if (fb & 64 && c.group === undefined) v = Math.min(v, 1 - FRONT_SET);
    if (fr && c.group === undefined && !c.giant) {
      // vor einem Gebäude: Jungbaum, Fuss in der abgewandten Kachelhälfte
      if (!c.dead) {
        c.young = true;
        c.r = Math.min(c.r, FRONT_R, maxRadius(c));
      }
      if (fr & 1) u = Math.max(u, FRONT_SET);
      if (fr & 2) v = Math.max(v, FRONT_SET);
      if (fr === 4) {
        u = Math.max(u, FRONT_SET * 0.7);
        v = Math.max(v, FRONT_SET * 0.7);
      }
      // seitlich: vom Haus weg (links: −x, +y; rechts: +x, −y), nicht an die Wand
      if (fr & 8 && !(fr & 3)) {
        u = Math.min(u, 1 - FRONT_SET);
        v = Math.max(v, FRONT_SET);
      }
      if (fr & 16 && !(fr & 3)) {
        u = Math.max(u, FRONT_SET);
        v = Math.min(v, 1 - FRONT_SET);
      }
    }
    const r = c.r;
    if (tight[k]) {
      // Eng: Fussscheibe in der Kachel, und im Bild in der Spaltenbreite der Kachel (|u − v| · ISO_W/2 + hw ≤ ISO_W/2)
      c.r = Math.min(c.r, TIGHT_R);
      u = clamp(u, c.r, 1 - c.r);
      v = clamp(v, c.r, 1 - c.r);
      const room = 1 - crownGeom(c).hw / (ISO_W / 2);
      const t = u - v;
      if (Math.abs(t) > room) {
        const d = (Math.abs(t) - room) / 2;
        u -= Math.sign(t) * d;
        v += Math.sign(t) * d;
      }
    } else if (!c.giant) {
      // Gruppen nur über Wald (ihre Bäume sind hoch; auf der Wiese steht nur Vorwald)
      const open =
        c.group !== undefined ? (x: number, y: number) => at(x, y) === 'forest' : openTile;
      if (!open(q.tx - 1, q.ty)) u = Math.max(u, r);
      if (!open(q.tx + 1, q.ty)) u = Math.min(u, 1 - r);
      if (!open(q.tx, q.ty - 1)) v = Math.max(v, r);
      if (!open(q.tx, q.ty + 1)) v = Math.min(v, 1 - r);
      for (const [dx, dy] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const) {
        if (open(q.tx + dx, q.ty + dy)) continue;
        const ex = dx < 0 ? u : 1 - u,
          ey = dy < 0 ? v : 1 - v; // Abstand zur Ecke je Achse
        const d = Math.hypot(ex, ey);
        if (d >= r) continue;
        const f = d > 1e-6 ? r / d : 0;
        const nx = d > 1e-6 ? ex * f : r * Math.SQRT1_2,
          ny = d > 1e-6 ? ey * f : r * Math.SQRT1_2;
        u = dx < 0 ? nx : 1 - nx;
        v = dy < 0 ? ny : 1 - ny;
      }
      u = clamp(u, 0, 1 - 1e-6);
      v = clamp(v, 0, 1 - 1e-6);
    }
    q.fx = q.tx + u;
    q.fy = q.ty + v;
  }
  const accepted: Cand[] = [];
  const isAccepted = new Set<Cand>();
  const put = (q: Cand): boolean => {
    clampFoot(q);
    if (!clearOf(q.fx, q.fy, q.c)) return false;
    const k = keyOf(Math.floor(q.fx), Math.floor(q.fy));
    const l = grid.get(k);
    if (l) l.push(q);
    else grid.set(k, [q]);
    accepted.push(q);
    isAccepted.add(q);
    return true;
  };
  const meadowN = new Map<number, number>();
  for (const q of cands) {
    if (conflicts(q, SPACING_MIN)) continue;
    if (!q.forest) {
      // Vorwald: höchstens VORWALD_MAX Gehölze je Wiesenkachel (Wiese bleibt Wiese)
      const k = q.ty * w + q.tx;
      const n = meadowN.get(k) ?? 0;
      if (n >= VORWALD_MAX) continue;
      if (put(q)) meadowN.set(k, n + 1);
      continue;
    }
    put(q);
  }
  // Riesenbaum (B3): in etwa der Hälfte der Karten genau einer, in der tiefsten Kernkachel (dichteste 5 × 5-Umgebung)
  let giant: Cand | null = null;
  if (hash2(seed + 510, 0, 0) < 0.5) {
    const coreT = (x: number, y: number): number => {
      if (at(x, y) !== 'forest') return 0;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) if (at(x + dx, y + dy) !== 'forest') return 0;
      return 1;
    };
    let best = -1,
      bestScore = 8;
    for (let y = 2; y < h - 2; y++)
      for (let x = 2; x < w - 2; x++) {
        if (!coreT(x, y) || forestClearing(seed, x + 0.5, y + 0.5) >= 0.5) continue;
        let s = 0;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) s += coreT(x + dx, y + dy);
        const score = s + hash2(seed + 509, x, y) * 0.5;
        if (s >= 9 && score > bestScore) {
          bestScore = score;
          best = y * w + x;
        }
      }
    if (best >= 0) {
      const x = best % w,
        y = Math.floor(best / w);
      const c: Crown = {
        kind: slotKind(seed, slotAt(seed, type, x + 0.5, y + 0.5)),
        cx: 0,
        cy: 0,
        r: 0.17 * GIANT_SCALE,
        h: 0,
        bush: false,
        s: shapeValue(2),
        giant: true,
      };
      if (clearOf(x + 0.5, y + 0.5, c))
        giant = { fx: x + 0.5, fy: y + 0.5, tx: x, ty: y, p: 2, c, forest: true };
    }
  }
  let all = accepted;
  if (giant) {
    const g = giant;
    // nur die Kronen unmittelbar am Riesen entfallen (Gruppen mit ihrem Radius); die Kachel behält ihre Nachbarn
    all = accepted.filter(
      (q) =>
        (q.fx - g.fx) ** 2 + (q.fy - g.fy) ** 2 >=
        (0.22 + (q.c.group !== undefined ? q.c.r * 0.6 : 0)) ** 2,
    );
    all.push(g);
  }
  // die Mindestzahl gilt nach dem Riesenbaum (er räumt seine Umgebung frei): Raster und Liste neu aufbauen
  if (all !== accepted) {
    grid.clear();
    accepted.length = 0;
    for (const q of all) {
      if (q.c.giant) continue;
      const k = keyOf(Math.floor(q.fx), Math.floor(q.fy));
      const l = grid.get(k);
      if (l) l.push(q);
      else grid.set(k, [q]);
      accepted.push(q);
    }
    if (giant) {
      const k = keyOf(Math.floor(giant.fx), Math.floor(giant.fy));
      const l = grid.get(k);
      if (l) l.push(giant);
      else grid.set(k, [giant]);
    }
  }
  // Mindestens MIN_CROWNS lebende Kronen je freier Waldkachel (kleine Jungbäume, wenn der Saum hier zurückweicht)
  const count = new Map<number, number>();
  const bump = (tx: number, ty: number): void => {
    if (tx >= 0 && ty >= 0 && tx < w && ty < h)
      count.set(ty * w + tx, (count.get(ty * w + tx) ?? 0) + 1);
  };
  for (const q of accepted) {
    if (q.c.dead) continue;
    // Gruppen zählen mit jedem Baum auf der Kachel seines Fusses
    if (q.c.group !== undefined)
      for (const m of groupMembers(q.c)) bump(Math.floor(q.fx + m.cx), Math.floor(q.fy + m.cy));
    else if (q.forest) bump(q.tx, q.ty);
  }
  for (const [k, list] of byTile) {
    if (free[k] !== 1) continue;
    let n = count.get(k) ?? 0;
    if (n >= MIN_CROWNS) continue;
    const order = [...list].sort((a, b) => b.p - a.p);
    for (const relax of [SPACING_MIN, 0]) {
      for (const q of order) {
        if (n >= MIN_CROWNS) break;
        if (isAccepted.has(q)) continue;
        if (!q.c) q.c = q.mk!();
        if (q.c.dead) continue;
        const c = q.c;
        const sapling = c.cast === true; // hinter der Saumlinie: Jungwuchs; sonst ein Baum des lichten Randes
        if (c.group !== undefined) {
          // als Einzelbaum (Jungbaum) nachsetzen
          delete c.group;
          c.s = shapeValue(Math.floor(rnd(q.tx, q.ty, 0, 15) * SHAPES));
        }
        c.r = sapling ? Math.min(c.r, 0.16) : Math.max(0.15, Math.min(c.r, 0.22));
        if (sapling) c.young = true;
        c.r = Math.min(c.r, maxRadius(c));
        if (relax > 0 && conflicts(q, relax)) continue;
        if (put(q)) n++;
      }
    }
  }

  // Fix-Runde 3 B: kein dunkler Boden ohne Bäume. Wo der Boden dunkel ist (Waldbodenanteil wie terrain.ts), steht
  // eine Krone höchstens FILL_REACH entfernt; jede Kachel mit dunkler Mitte trägt einen Altbaum oder zwei Jungbäume.
  const floorAt = (fx: number, fy: number): number => {
    const sv = S(fx, fy);
    const f = floorShare(sv);
    return f < FILL_DARK ? f : f * floorFactor(seed, fx, fy, sv);
  };
  const gapTo = (fx: number, fy: number): number => {
    const x0 = Math.floor(fx),
      y0 = Math.floor(fy);
    let d = Infinity;
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        for (const o of grid.get(keyOf(x0 + dx, y0 + dy)) ?? [])
          if (!o.c.dead) d = Math.min(d, Math.hypot(o.fx - fx, o.fy - fy) - o.c.r);
    return d;
  };
  /** Würfel des Abtastpunkts `i` (0…24) einer Kachel, Komponente `comp` (0, 1). */
  const fillRnd = (tx: number, ty: number, i: number, comp: number): number =>
    rnd(tx, ty, FILL_J0 + (i % 20), 8 + 2 * Math.floor(i / 20) + comp);
  const fill = (fx: number, fy: number, tx: number, ty: number, i: number): boolean => {
    const k = ty * w + tx;
    const j = FILL_J0 + (i % 20);
    const meadow = free[k] === 2;
    const kind = slotKind(seed, slotAt(seed, type, fx, fy));
    // auf der Wiese niedriger Jungwuchs (Vorwaldhöhe), im Wald ein kleiner Altbaum
    const c = meadow
      ? makeCrown(kind, 0.14 + 0.04 * rnd(tx, ty, j, 5), tx, ty, j, { young: true }, VORWALD_TOP)
      : makeCrown(kind, 0.14 + 0.05 * rnd(tx, ty, j, 5), tx, ty, j, {}, TREE_H);
    c.tone = toneAt(fx, fy, tx, ty, j);
    if (meadow) c.cast = true;
    return put({ fx, fy, tx, ty, p: 0, c, forest: !meadow });
  };
  for (let ty = 0; ty < h; ty++)
    for (let tx = 0; tx < w; tx++) {
      const k = ty * w + tx;
      if (!free[k]) continue;
      // Kachel mit dunkler Mitte: ein Altbaum oder zwei Jungbäume
      if (floorAt(tx + 0.5, ty + 0.5) >= FILL_DARK) {
        let adult = 0,
          young = 0;
        for (const o of grid.get(keyOf(tx, ty)) ?? []) {
          if (o.c.dead) continue;
          if (o.c.group !== undefined) adult += 2;
          else if (o.c.young || o.c.bush) young++;
          else adult++;
        }
        for (let i = 0; adult < 1 && young < 2 && i < 4; i++) {
          const u = 0.3 + 0.4 * fillRnd(tx, ty, 20 + i, 0),
            v = 0.3 + 0.4 * fillRnd(tx, ty, 20 + i, 1);
          if (!fill(tx + u, ty + v, tx, ty, 20 + i)) continue;
          if (free[k] === 2) young++;
          else adult++;
        }
      }
      // dunkler Boden ohne Krone in der Nähe: nachsetzen
      for (let b = 0; b < FILL_STEPS; b++)
        for (let a = 0; a < FILL_STEPS; a++) {
          // Abtastpunkt im Fach (a, b), im Fach gewürfelt: nachgesetzte Kronen liegen nicht auf einem Raster
          const i = b * FILL_STEPS + a;
          const fx = tx + (a + 0.15 + 0.7 * fillRnd(tx, ty, i, 0)) / FILL_STEPS,
            fy = ty + (b + 0.15 + 0.7 * fillRnd(tx, ty, i, 1)) / FILL_STEPS;
          if (gapTo(fx, fy) <= (free[k] === 2 ? FILL_REACH_MEADOW : FILL_REACH)) continue;
          if (floorAt(fx, fy) < FILL_DARK) continue;
          fill(fx, fy, tx, ty, i);
        }
    }

  all = giant ? [...accepted, giant] : accepted;
  // Höhe aus der Form, Tiefenband-Zelle
  const cells = new Map<string, WoodCell>();
  for (const q of all) {
    const c = q.c;
    const k = q.ty * w + q.tx;
    const fx = q.fx,
      fy = q.fy;
    c.h = heightOf(c);
    const cell = tight[k] ? { x: q.tx, y: q.ty } : bandCell(fx, fy);
    const key = `${tight[k] ? 1 : 0}|${cell.x}|${cell.y}`;
    let wc = cells.get(key);
    if (!wc) cells.set(key, (wc = { x: cell.x, y: cell.y, own: tight[k] === 1, crowns: [] }));
    c.cx = fx - cell.x;
    c.cy = fy - cell.y;
    wc.crowns.push(c);
  }
  const out = [...cells.values()];
  for (const wc of out) wc.crowns.sort((a, b) => a.cx + a.cy - (b.cx + b.cy) || a.cx - b.cx);
  out.sort((a, b) => a.y - b.y || a.x - b.x || Number(a.own) - Number(b.own));
  return { mask, cells: out };
}
