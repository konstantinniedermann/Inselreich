import { generateTerrain } from '../sim/mapgen';
import { hash2, valueNoise } from '../sim/noise';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { seaLanes } from '../sim/islands';
import type { Island, World } from '../sim/types';
import { LIGHT, rotNoise } from './light';
import { meadowWarmth } from './groundDecor';

// decor.ts — reine Platzierung der Deko (ART-STIL-02 L4, Spec 3.1/3.2/3.6, R1–R6). Kein Canvas, kein DOM, keine Welt-
// Schreibzugriffe. Eine Liste je Insel für Boden-Elemente (`groundElements`) und Stempel (`stampPlacements`).
// L5 (Küste/Meer) und L8 (Seltenheitsband) erweitern `RARE_POOL`; L6/L7 lesen. Salze 540–559 (Kopf von groundDecor.ts):
// 540 Solitärbaum je Kachel (Los und Rang) · 541 Wiesenart A2 (Variante) · 542 Buschgruppe A3 · 543 Kiesel A4 ·
// 544 Findling A4 · 545 Lesesteinhaufen A7 · 546 Maulwurfshügel A11 · 547 Binsen A12 · 548 Pilze B6 · 549 Totholz B7 ·
// 550 Farnsaum B8 · 551 Wahl des Boden-Elements je Kachel · 552 Stempelvariante · 553 Buschdichte A3 und Zusatzblüten A1 · 554–559 Los und Ort der
// S/E-Elemente (A8, A13, A14, A6, A9, A10).
//
// Invarianten (Design-Entscheid L0, machen den Patch lokal):
//  D1 Statische Eignung: Ort und Los von S/E- und Mehrkachel-Elementen hängen nur vom statischen Gelände ab (Land/Wasser,
//     Sand, Gebirge, „Grünland“ = Gras ∪ Wald, Hügelfeld, Küsten-/Gebirgs-/Grünlandabstand, Kontor-Lage). Belegung und
//     der Wechsel Gras/Wald gehen nie ein. Einziger Ort, der in der Sim das Gelände ändert: `src/sim/forest.ts`
//     (`clearForest`/`plantForest`, Wald ↔ Weide); Gebäude und Wege ändern nur `buildingId`/`road`.
//  D2 Sichtbarkeit: ob ein Element gezeigt wird, entscheidet der eigene Fussabdruck (≤ 2 × 2) plus höchstens
//     `DECOR_REACH` Kachel Rand und nur für 1 × 1-Elemente; belegt oder kein Gras → das ganze Element entfällt.
//  D3 Seltenheit: Los `hash2(seed + salt, 0, 0) < p` nach der Eignungsprüfung, E höchstens 1, höchstens `RARE_CAP` je Insel.
//     Urwald-Schätzer (Bild-Fix 1): Die Heimatinsel entsteht in `src/sim/mapgen.ts` aus `generateTerrain(seed + i, …)`;
//     dort ist Wald `valueNoise(seed + 3, x / 5, y / 5) > 0,62`. Das Salz 3 ist ein Sim-Salz und wird hier nur gelesen
//     (über `generateTerrain` selbst, mit dem Versatz `i`, dessen statische Klassen zur Karte passen). Das Ergebnis ist eine
//     reine Funktion von Seed und Kachel, also statisch (D1): S/E- und Mehrkachel-Orte meiden diesen Wald, auch wenn er
//     später gerodet wird. Fremdinseln und unpassende Karten haben keinen Schätzer.
//  D4 Fremdinseln: gilt für jeden Ansicht-Seed; Stempel zeigt der Aufrufer (`iso.ts`) nur auf der Heimat.
//  D5 Salze 540–559 (L4) und 560–569 (L5, Meer und Palmen: 560 Palmen, 566 Wrack, 567 Meeresfels und Felsnadel, 568 Felseiland,
//     569 Wasserflächen Sandbank/Riff/Tang); Zufall nur über `hash2`/`valueNoise`.
//     Salze 595–597 (L8): Zweitlos der Land-Arten (`planRare`), wenn Land-Orte plus Meer-Lose unter `RARE_MIN` bleiben.
//     Salz 598 (L8): Strandkiefern der Kiefernküste (`planPalms`: Zahl, Rang, Form). Salz 599: reserviert für L8 (noch frei).
//     Salze 9100 und 9101: terrain.ts, Abtastverwerfung WARP, ART-WALD-RAUTEN (hier nur eingetragen, nicht benutzt).
//  D6 Meer (L5): `seaPlan` ist wie alles Statische eine reine Funktion von Seed, Gelände und `SeaContext` (Lanes, Anker, Kontor);
//     R4 (`seaKeepOut`) gilt für jede Kachel jedes Meer-Elements. Die seltenen Meer-Elemente (Wrack, Eiland, Felsnadel) laufen
//     NICHT über `RARE_POOL` (Land-Orte), sondern über eigene Lose; `rareBudget` (L8) zählt diese Lose (nicht ihre Eignung) und
//     senkt die Land-Kappe von `planRare` auf `RARE_CAP − Meer-Lose`; das Budget hängt nie von `SeaContext` ab.

/** Reichweite der Sichtbarkeitsprüfung über den Fussabdruck hinaus in Kacheln (= Rand von `dirtyRect`). */
export const DECOR_REACH = 1;
/** Obergrenze der S/E-Elemente je Insel (Land-Orte plus bestandene Meer-Lose, L8: Band 3–6). */
export const RARE_CAP = 6;
/** Untergrenze des Bands: reicht die Summe nicht, rücken Land-Arten per Zweitlos (Salze 595–597) nach. */
export const RARE_MIN = 3;
/** Zweitlos je Land-Art und Runde (Salze 595–597): Losgrenze = `RARE_SECOND_K` · `p` der Art, damit die Quoten nahe `p` bleiben. */
const RARE_SECOND_K = 1;
/** Salze des Zweitloses je Runde (D5). */
const RARE_SECOND_SALTS = [595, 596, 597] as const;
/** R6: höchstens ein Stempel je so viele Landkacheln und höchstens so viele je Insel. */
export const STAMP_PER_LAND = 6;
export const STAMP_MAX = 300;
/** Solitärbaum (A5): Mindestabstand zum Wald (Kacheln, Chebyshev), Abstand zwischen Stempeln und Obergrenze je Insel. */
export const SOLITAIRE_FOREST_GAP = 2;
export const STAMP_SPACING = 3;
export const SOLITAIRE_MAX = 8;
/** G-Elemente (Katalog: 2–12 je Insel): Zahl der statischen Kandidaten je Insel liegt in [G_MIN, G_MAX]. */
export const G_MIN = 3;
export const G_MAX = 12;
/** Mindestabstand der Kandidaten gleicher Art (Kacheln, Chebyshev) bei den Boden-G-Elementen. */
const G_SPACING = 4;
/**
 * Zahl der Kandidaten einer G-Art je Insel: `G_MIN`…`max` aus `hash2(seed + salt, 977 + 131 · k, 613 + 31 · seed)`; `k` ist der Artindex
 * (A5 = 0, `G_KINDS` = 1…4), so sind die Zahlen verschiedener Arten nicht nur gegeneinander verschoben.
 */
export const gCount = (seed: number, salt: number, k: number, max = G_MAX): number =>
  G_MIN + Math.floor(hash2(seed + salt, 977 + 131 * k, 613 + 31 * seed) * (max - G_MIN + 1));
/** Mauerreste (A14): Mindestabstand zum Kontor in Kacheln. */
export const RUIN_KONTOR_GAP = 8;

export interface TileRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
} // inklusive
export type DecorIsland = Pick<Island, 'width' | 'height' | 'tiles'>;
export interface Pos {
  x: number;
  y: number;
}

/** Boden-Elemente (Katalog A2–A4, A7, A8, A10–A13, B6–B8); A1 bleibt das Blumenfeld in `groundDecor.ts`. */
export type GroundKind =
  | 'tuftTall' // A2 feucht: hohes Gras
  | 'clover' // A2 Mitte: Kleegruppe
  | 'tuftDry' // A2 warm: Trockenrasen
  | 'shrubs' // A3
  | 'pebble' // A4 Kiesel
  | 'boulder' // A4 Findling
  | 'stoneHeap' // A7
  | 'stoneCircle' // A8 (2 × 2)
  | 'mushRing' // A10
  | 'molehills' // A11
  | 'reeds' // A12
  | 'carpet' // A13 (eine Kachel des Teppichs)
  | 'toadstools' // B6
  | 'deadwood' // B7
  | 'ferns' // B8
  | 'beachStone' // D2 (L5): Steine am Strand
  | 'driftwood' // D3: Treibholz am Spülsaum
  | 'shell' // D4: Muscheln und Seesterne (arg 0 Muschel, 1 Seestern)
  | 'beachGrass' // D5: Strandhafer auf den Dünen
  | 'tidePool' // D6: Gezeitentümpel zwischen Strandsteinen
  | 'crate'; // D9: Kiste (arg 0) bzw. Flaschenpost (arg 1) am Spülsaum

export interface GroundElement {
  kind: GroundKind;
  /** Kachel links oben des Fussabdrucks. */
  x: number;
  y: number;
  /** Fussabdruck in Kacheln (1 oder 2). */
  w: 1 | 2;
  h: 1 | 2;
  /** Bildbox in Kacheln (inklusive); ganz innerhalb des Fussabdrucks. */
  box: TileRect;
  /** Zusatzwert: A13 Ton der Blütenpalette (0/1), B6–B8 Maske der Waldseiten (1 links, 2 rechts, 4 oben, 8 unten). */
  arg: number;
}

/** Stempel (A5, A6, A9, A14), im sortierten Durchgang gezeichnet; Fussabdruck 1 × 1. */
export type StampKind =
  | 'solitaire'
  | 'orchard'
  | 'menhir'
  | 'ruin'
  | 'palm' // D1 (L5), auf Sand
  | 'wreck' // E1 (L5), im Wasser
  | 'seaRock' // E3 (L5), im Wasser; Varianten 6/7 = Felsnadel
  | 'islet' // E8 (L5), im Wasser
  | 'shorePine'; // L8 Strandkiefer der Kiefernküste, auf Sand
export interface StampPlacement {
  kind: StampKind;
  x: number;
  y: number;
  /** Form-Variante: 0…3 (L4-Stempel); `palm` 0…11 (Form × 4 + Neigungsrichtung), `wreck` 0…3, `seaRock` 0…7, `islet` 0…3, `shorePine` 0…3 (Richtung zur See). */
  variant: number;
  /** `y * Breite + x`. */
  id: number;
}

// ---------- statisches Gelände ----------

/** Statische Klasse je Kachel: 0 Wasser, 1 Sand, 2 Grünland (Gras ∪ Wald), 3 Gebirge. Roden und Aufforsten ändern sie nie. */
export function staticClasses(isl: DecorIsland): Uint8Array {
  const out = new Uint8Array(isl.width * isl.height);
  for (let i = 0; i < out.length; i++) {
    const t = isl.tiles[i]!.terrain;
    out[i] = t === 'water' ? 0 : t === 'sand' ? 1 : t === 'mountain' ? 3 : 2;
  }
  return out;
}

const DIST_CAP = 16;
/** Chebyshev-Abstand (8er-Nachbarschaft) zur nächsten Quellkachel, gekappt; Quellen haben 0. */
function chebDist(w: number, h: number, isSource: (i: number) => boolean): Uint8Array {
  const d = new Uint8Array(w * h).fill(DIST_CAP);
  const q = new Int32Array(w * h);
  let head = 0,
    tail = 0;
  for (let i = 0; i < d.length; i++)
    if (isSource(i)) {
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
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (d[j]! > d[i]! + 1) {
          d[j] = d[i]! + 1;
          q[tail++] = j;
        }
      }
  }
  return d;
}

/** Wertfeld der Hügel: gleiche Formel wie `meadowHill` in terrain.ts (dort nicht importierbar: Zyklus); Test hält sie gleich. */
export function decorHill(seed: number, fx: number, fy: number): number {
  return (
    0.62 * rotNoise(seed + 105, fx, fy, 0.23, 0.77) +
    0.38 * rotNoise(seed + 106, fx, fy, 0.51, 1.31)
  );
}
/** Anstieg des Hügelfelds gegen das Licht (> 0: Lichtseite, die Hügel steigen vom Licht weg), je Kachel. */
export function hillLit(seed: number, fx: number, fy: number): number {
  const d = 0.5;
  const gx = (decorHill(seed, fx + d, fy) - decorHill(seed, fx - d, fy)) / (2 * d);
  const gy = (decorHill(seed, fx, fy + d) - decorHill(seed, fx, fy - d)) / (2 * d);
  return -(gx * LIGHT.x + gy * LIGHT.y);
}

// ---------- S/E-Pool (D3) ----------

export type RareId =
  'steinkreis' | 'bluetenteppich' | 'mauerreste' | 'obstbaum' | 'menhir' | 'pilzring';
export interface RareDef {
  id: RareId;
  /** Salz (540–559) für Los (`hash2(seed + salt, 0, 0)`) und Ortswahl (`hash2(seed + salt, x + 1, y + 1)`). */
  salt: number;
  /** Losgrenze: das Element kommt vor, wenn `hash2(seed + salt, 0, 0) < p` (nach der Eignungsprüfung). */
  p: number;
  /** Höchstzahl je Insel (E = 1). */
  max: number;
  /** Fussabdruck in Kacheln. */
  size: 1 | 2;
}
/** Feste Reihenfolge; L5/L8 hängen hinten an. Spec 3.6: A8 0,25 · A13 0,30 · A14 0,20 · A6/A9/A10 0,45. */
export const RARE_POOL: readonly RareDef[] = [
  { id: 'steinkreis', salt: 554, p: 0.25, max: 1, size: 2 },
  { id: 'bluetenteppich', salt: 555, p: 0.3, max: 1, size: 1 },
  { id: 'mauerreste', salt: 556, p: 0.2, max: 1, size: 1 },
  { id: 'obstbaum', salt: 557, p: 0.45, max: 2, size: 1 },
  { id: 'menhir', salt: 558, p: 0.45, max: 2, size: 1 },
  { id: 'pilzring', salt: 559, p: 0.45, max: 2, size: 1 },
];

/** D3: Los eines S/E-Elements (vor der Eignung gezogen, aber erst nach ihr gezählt). Rein aus Seed und Salz. */
export function rareLot(seed: number, def: RareDef): boolean {
  return hash2(seed + def.salt, 0, 0) < def.p;
}
/** Zahl der Exemplare nach bestandenem Los: E immer 1, S 1 oder 2 (zweites Exemplar mit Wahrscheinlichkeit 0,4). */
export function rareCount(seed: number, def: RareDef): number {
  return def.max > 1 && hash2(seed + def.salt, -1, -1) < 0.4 ? 2 : 1;
}

/**
 * L8 Seltenheitsbudget: Zahl der bestandenen Meer-Lose (Kiste 565, Wrack 566, Felsnadel 567, Felseiland 568). Reine Funktion
 * von Seed und Salz: zählt die Lose, nicht die Eignung, und kennt weder `SeaContext` noch Fahrlinie.
 */
export function rareBudget(seed: number): number {
  return (
    Number(hash2(seed + 565, 0, 0) < CRATE_P) +
    Number(hash2(seed + 566, 0, 0) < WRECK_P) +
    Number(hash2(seed + 567, -1, -1) < NEEDLE_P) +
    Number(hash2(seed + 568, 0, 0) < ISLET_P)
  );
}

export interface RareSite {
  id: RareId;
  /** Kachel links oben des Fussabdrucks. */
  x: number;
  y: number;
  size: 1 | 2;
  /** Nummer des Exemplars (0, 1). */
  n: number;
  /** Teppich: Radius in Kacheln (2–4) und Ton der Blütenpalette (0/1). */
  radius: number;
  tone: number;
}

interface StaticPlan {
  seed: number;
  cls: Uint8Array;
  kontor: Pos | null;
  /** Abstand zu Wasser (Kacheln, Wasser 0), zu Gebirge, zu Nicht-Grünland (Kartenrand zählt als Nicht-Grünland). */
  coast: Uint8Array;
  mtn: Uint8Array;
  green: Uint8Array;
  /** Wald der Erzeugung (Urwald-Schätzer), 1 = Wald; null ohne passende Erzeugung. */
  wild: Uint8Array | null;
  sites: RareSite[];
  /** Statische Stempelliste (D1): Kandidaten, Reihenfolge, Abstand und Deckel nur aus dem statischen Gelände. */
  stamps: StampPlacement[];
  /** Palmen (D1, L5): statisch aus dem Gelände; `stampPlacements` hängt sie nur mit `sea` an. */
  palms: StampPlacement[];
  /** Statische Kandidaten der Boden-G-Elemente je Kachel (0 keiner, sonst 1 + Index in `G_KINDS`). */
  g: Uint8Array;
  /** Zahl der statisch zulässigen Kacheln je G-Art (für Tests: „das Gelände lässt es zu“). */
  gEligible: number[];
  /** 0 frei, sonst 1 + Index in `sites` (Fussabdruck bzw. Teppichkacheln). */
  reserved: Uint8Array;
  /** Strand (L5): Kiste/Flaschenpost D9 (E, höchstens eine) und Gezeitentümpel D6 (G) je Kachel (1 = Tümpel). */
  crate: Pos | null;
  pool: Uint8Array;
}

/** Eignung eines Ankers für ein S/E-Element: nur statisches Gelände (D1). */
function rareEligible(id: RareId, p: StaticPlan, w: number, x: number, y: number): boolean {
  const i = y * w + x;
  if (p.cls[i] !== 2) return false;
  const seed = p.seed;
  switch (id) {
    case 'steinkreis': {
      const g = Math.min(p.green[i]!, p.green[i + 1]!, p.green[i + w]!, p.green[i + w + 1]!);
      if (g < 3 || p.mtn[i]! < 3) return false;
      for (const [dx, dy] of [
        [0, 0],
        [1, 0],
        [0, 1],
        [1, 1],
      ] as const)
        if (p.cls[(y + dy) * w + x + dx] !== 2 || p.reserved[(y + dy) * w + x + dx]) return false;
      // flache Wiese: Hügelfeld über die Ringpunkte um die Mitte (Ring Radius 0,6) schwankt wenig
      const cx = x + 1,
        cy = y + 1;
      let lo = Infinity,
        hi = -Infinity;
      for (const [dx, dy] of [
        [0, 0],
        [0.7, 0],
        [-0.7, 0],
        [0, 0.7],
        [0, -0.7],
      ] as const) {
        const v = decorHill(seed, cx + dx, cy + dy);
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
      return hi - lo < 0.07;
    }
    case 'bluetenteppich':
      return p.green[i]! >= 4 && p.mtn[i]! >= 3;
    case 'mauerreste': {
      if (p.green[i]! < 2 || p.mtn[i]! < 2 || p.reserved[i]) return false;
      const k = p.kontor;
      return !k || Math.hypot(k.x - x, k.y - y) >= RUIN_KONTOR_GAP;
    }
    case 'obstbaum':
      return (
        p.green[i]! >= 2 &&
        p.mtn[i]! >= 3 &&
        !p.reserved[i] &&
        hillLit(seed, x + 0.5, y + 0.5) > 0.02
      );
    case 'menhir': {
      if (p.green[i]! < 2 || p.mtn[i]! < 3 || p.reserved[i]) return false;
      const c = decorHill(seed, x + 0.5, y + 0.5);
      for (let dy = -2; dy <= 2; dy++)
        for (let dx = -2; dx <= 2; dx++)
          if ((dx || dy) && decorHill(seed, x + 0.5 + dx, y + 0.5 + dy) >= c) return false;
      return true;
    }
    case 'pilzring':
      return p.green[i]! >= 2 && !p.reserved[i] && meadowWarmth(seed, x + 0.5, y + 0.5) < -0.15;
  }
}

/**
 * Nach Eignung und Los: die Orte der S/E-Elemente. Reihenfolge fest; Land-Kappe `RARE_CAP − rareBudget(seed)` (L8, die Meer-Lose
 * zählen mit). Bleibt die Summe aus Land-Orten und Meer-Losen unter `RARE_MIN`, rücken Land-Arten mit gescheitertem Los per
 * Zweitlos (Salze 595–597, je eine Runde) hinten an; die Einträge davor bleiben unverändert.
 */
function planRare(p: StaticPlan, w: number, h: number): void {
  const seed = p.seed;
  const sea = rareBudget(seed);
  const cap = RARE_CAP - sea;
  const sites: RareSite[] = [];
  /** Setzt Exemplar `k` von `def`; false, wenn kein Ort passt. */
  const place = (def: RareDef, k: number, taken: Pos[]): boolean => {
    let best = -1,
      bestScore = -1;
    const span = def.size;
    for (let y = 0; y + span <= h; y++)
      for (let x = 0; x + span <= w; x++) {
        if (!rareEligible(def.id, p, w, x, y)) continue;
        if (taken.some((t) => Math.max(Math.abs(t.x - x), Math.abs(t.y - y)) < 8)) continue;
        let score = hash2(seed + def.salt, x + 1, y + 1);
        // Teppich: das statisch innerste Grünland zuerst, dann der Würfel
        if (def.id === 'bluetenteppich') score += p.green[y * w + x]!;
        if (score > bestScore) {
          bestScore = score;
          best = y * w + x;
        }
      }
    if (best < 0) return false;
    const x = best % w,
      y = (best / w) | 0;
    taken.push({ x, y });
    const site: RareSite = {
      id: def.id,
      x,
      y,
      size: def.size,
      n: k,
      radius: 2 + Math.floor(hash2(seed + def.salt, -2, -2) * 3),
      tone: hash2(seed + def.salt, -3, -3) < 0.5 ? 0 : 1,
    };
    sites.push(site);
    const si = sites.length;
    if (def.id === 'bluetenteppich') {
      // Teppichkacheln: Scheibe mit rauer Kante, nur statisches Grünland, nicht über schon Reserviertes
      const r = site.radius;
      for (let yy = Math.max(0, y - r - 1); yy <= Math.min(h - 1, y + r + 1); yy++)
        for (let xx = Math.max(0, x - r - 1); xx <= Math.min(w - 1, x + r + 1); xx++) {
          const dd = Math.hypot(xx - x, yy - y);
          const edge = r + 0.8 * (hash2(seed + def.salt, xx + 7, yy + 7) - 0.5);
          if (
            dd <= edge &&
            p.cls[yy * w + xx] === 2 &&
            p.wild?.[yy * w + xx] !== 1 &&
            !p.reserved[yy * w + xx]
          )
            p.reserved[yy * w + xx] = si;
        }
    } else
      for (let dy = 0; dy < span; dy++)
        for (let dx = 0; dx < span; dx++) p.reserved[(y + dy) * w + x + dx] = si;
    return true;
  };
  for (const def of RARE_POOL) {
    if (!rareLot(seed, def)) continue;
    const taken: Pos[] = [];
    const n = rareCount(seed, def);
    for (let k = 0; k < n && sites.length < cap; k++) if (!place(def, k, taken)) break;
  }
  // Zweitlos (Salze 595–597): nur Arten, deren Erstlos scheiterte; eine Runde je Salz, ein Exemplar
  for (let r = 0; r < RARE_SECOND_SALTS.length && sites.length + sea < RARE_MIN; r++)
    RARE_POOL.forEach((def, di) => {
      if (sites.length + sea >= RARE_MIN || sites.length >= cap) return;
      if (rareLot(seed, def) || sites.some((t) => t.id === def.id)) return;
      if (hash2(seed + RARE_SECOND_SALTS[r]!, di + 1, 0) < RARE_SECOND_K * def.p) place(def, 0, []);
    });
  p.sites = sites;
}

/**
 * Urwald-Schätzer: der Wald, den `generateTerrain` für die Heimatinsel erzeugt hat. Gesucht wird der Versatz `i`
 * (`generateMap` probiert `seed + i`), dessen Wasser-, Sand-, Gebirgs- und Grünlandkacheln mit den statischen Klassen
 * der Insel übereinstimmen; ohne exakte Übereinstimmung gibt es keinen Schätzer.
 */
export function wildForest(seed: number, isl: DecorIsland, cls: Uint8Array): Uint8Array | null {
  const kind = (isl as { kind?: string }).kind;
  if (kind && kind !== 'home') return null;
  const n = isl.width * isl.height;
  for (let i = 0; i < 50; i++) {
    const t = generateTerrain(seed + i, isl.width, isl.height);
    let same = true;
    for (let k = 0; k < n && same; k++) {
      const c = t[k] === 'water' ? 0 : t[k] === 'sand' ? 1 : t[k] === 'mountain' ? 3 : 2;
      if (c !== cls[k]) same = false;
    }
    if (!same) continue;
    const out = new Uint8Array(n);
    for (let k = 0; k < n; k++) if (t[k] === 'forest') out[k] = 1;
    return out;
  }
  return null;
}

const plans = new WeakMap<object, StaticPlan>();
const sameBytes = (a: Uint8Array, b: Uint8Array): boolean => {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
};

/**
 * Statische Grundlage einer Insel (Abstandsfelder, S/E-Orte), je Insel einmal gehalten (Obergrenze: ein Eintrag je
 * Inselobjekt, fällt mit ihr weg) und neu gebildet, sobald sich Seed, statische Klassen oder Kontor ändern.
 * Wald ↔ Weide ändert die Klassen nicht (D1).
 */
export function staticPlan(seed: number, isl: DecorIsland, kontor: Pos | null = null): StaticPlan {
  const cls = staticClasses(isl);
  const c = plans.get(isl);
  if (
    c &&
    c.seed === seed &&
    sameBytes(c.cls, cls) &&
    c.kontor?.x === kontor?.x &&
    c.kontor?.y === kontor?.y
  )
    return c;
  const { width: w, height: h } = isl;
  const wild = wildForest(seed, isl, cls);
  const green = chebDist(w, h, (i) => cls[i] !== 2 || wild?.[i] === 1);
  for (let i = 0; i < green.length; i++) {
    const x = i % w,
      y = (i / w) | 0;
    green[i] = Math.min(green[i]!, 1 + Math.min(x, y, w - 1 - x, h - 1 - y));
  }
  const p: StaticPlan = {
    seed,
    cls,
    kontor,
    coast: chebDist(w, h, (i) => cls[i] === 0),
    mtn: chebDist(w, h, (i) => cls[i] === 3),
    green,
    wild,
    sites: [],
    stamps: [],
    palms: [],
    g: new Uint8Array(w * h),
    gEligible: [0, 0, 0, 0],
    reserved: new Uint8Array(w * h),
    crate: null,
    pool: new Uint8Array(w * h),
  };
  planRare(p, w, h);
  planStamps(p, w, h);
  planPalms(p, w, h);
  planGround(p, w, h);
  planBeach(p, w, h);
  plans.set(isl, p);
  return p;
}

/** Die S/E-Orte der Insel (Eignung und Los nur aus dem statischen Gelände, D1). */
export function rareSites(
  seed: number,
  isl: DecorIsland,
  kontor: Pos | null = null,
): readonly RareSite[] {
  return staticPlan(seed, isl, kontor).sites;
}

/** Lage des Kontors der Insel (feste Position nach der Gründung; statische Eignung von A14), `null` ohne Kontor. */
export function kontorPos(
  isl: { kontorId?: number | null; kind?: string },
  buildings: Record<number, { x: number; y: number } | undefined> | undefined,
): Pos | null {
  // nur die Heimat: das Kontor einer Fremdinsel entsteht erst im Spiel und dürfte die statische Eignung nicht ändern
  const b =
    isl.kontorId == null || (isl.kind && isl.kind !== 'home')
      ? undefined
      : buildings?.[isl.kontorId];
  return b ? { x: b.x, y: b.y } : null;
}

// ---------- Regeln R3 / R5 / R6 als reine Funktionen ----------

/** R3: Kachel gehört zu keinem Gebäude und keinem Weg. */
export const tileFree = (isl: DecorIsland, x: number, y: number): boolean => {
  const t = isl.tiles[y * isl.width + x];
  return !!t && t.buildingId === null && !t.road;
};
/** R3: ein Stempel entfällt auf belegten Kacheln und auf den Kacheln (+x, +y, +x+y) vor einer Gebäudekachel. */
export function stampBlocked(isl: DecorIsland, x: number, y: number): boolean {
  if (!tileFree(isl, x, y)) return true;
  const b = (px: number, py: number): boolean =>
    px >= 0 && py >= 0 && isl.tiles[py * isl.width + px]!.buildingId !== null;
  return b(x - 1, y) || b(x, y - 1) || b(x - 1, y - 1);
}
/** R3/D2: alle Kacheln des Fussabdrucks sind unbelegtes Gras (`occ`: 1 = Gebäude oder Weg). */
export function footprintFree(
  isl: DecorIsland,
  occ: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
): boolean {
  for (let yy = y; yy < y + h; yy++)
    for (let xx = x; xx < x + w; xx++) {
      if (xx >= isl.width || yy >= isl.height) return false;
      const i = yy * isl.width + xx;
      if (isl.tiles[i]!.terrain !== 'grass' || occ[i] === 1) return false;
    }
  return true;
}
/** R5: Solitärbaum steht mindestens `SOLITAIRE_FOREST_GAP` Kacheln (Chebyshev) vom Wald. */
export function solitaireClear(isl: DecorIsland, x: number, y: number): boolean {
  const g = SOLITAIRE_FOREST_GAP;
  for (let dy = -g; dy <= g; dy++)
    for (let dx = -g; dx <= g; dx++) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= isl.width || ny >= isl.height) continue;
      if (isl.tiles[ny * isl.width + nx]!.terrain === 'forest') return false;
    }
  return true;
}
/** R6: Obergrenze der Stempel (ohne Bäume) einer Insel mit `land` Landkacheln. */
export const stampLimit = (land: number): number =>
  Math.min(STAMP_MAX, Math.floor(land / STAMP_PER_LAND));

// ---------- Stempel ----------

const STAMP_OF: Partial<Record<RareId, StampKind>> = {
  obstbaum: 'orchard',
  menhir: 'menhir',
  mauerreste: 'ruin',
};

/**
 * Statische Stempelliste (D1): S/E-Stempel (A6, A9, A14) an ihren Orten, dann Solitärbäume (A5) nach Los und Rang.
 * Kandidaten, Reihenfolge, Mindestabstand `STAMP_SPACING` (≤ 1 je 3 × 3) und Deckel (R6, `SOLITAIRE_MAX`) hängen nur am
 * statischen Gelände (Grünland, Urwald-Schätzer, Kontor). Belegung und aktueller Wald blenden später nur aus; ein
 * ausgeblendeter Platz wird nie durch einen anderen ersetzt (`stampPlacements`).
 */
function planStamps(p: StaticPlan, w: number, h: number): void {
  const seed = p.seed;
  const limit = stampLimit(p.cls.reduce((n, c) => n + (c !== 0 ? 1 : 0), 0));
  const out: StampPlacement[] = [];
  const near = (x: number, y: number): boolean =>
    out.some((s) => Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) < STAMP_SPACING);
  const add = (kind: StampKind, x: number, y: number): void => {
    out.push({ kind, x, y, variant: Math.floor(hash2(seed + 552, x, y) * 4), id: y * w + x });
  };
  for (const s of p.sites) {
    const kind = STAMP_OF[s.id];
    if (!kind || out.length >= limit || near(s.x, s.y)) continue;
    add(kind, s.x, s.y);
  }
  const cand: { x: number; y: number; r: number }[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      // statisch: Grünland ohne Urwald (Abstand ≥ SOLITAIRE_FOREST_GAP + 1 zum Nicht-Grünland bzw. Urwald), nicht reserviert
      if (p.reserved[i] || p.cls[i] !== 2 || p.green[i]! < SOLITAIRE_FOREST_GAP + 1) continue;
      cand.push({ x, y, r: hash2(seed + 540, x, y) });
    }
  cand.sort((a, b) => a.r - b.r);
  // G (2–12 je Insel): feste Zahl von Kandidaten aus dem Rang, nicht aus einem Los je Kachel
  const target = gCount(seed, 540, 0, SOLITAIRE_MAX);
  let solitaires = 0;
  for (const c of cand) {
    if (solitaires >= target || out.length >= limit) break;
    if (near(c.x, c.y)) continue;
    add('solitaire', c.x, c.y);
    solitaires++;
  }
  p.stamps = out.sort((a, b) => a.id - b.id);
}

// ---------- Palmen (D1, L5) ----------

/** Küstencharakter je Insel (Spec 3.7, `hash2(seed + 500, 0, 2)`): Palmenküste, Kiefernküste, kahle Dünenküste. */
export type CoastKind = 'palm' | 'pine' | 'dune';
export function coastKind(seed: number): CoastKind {
  const u = hash2(seed + 500, 0, 2);
  return u < 0.5 ? 'palm' : u < 0.75 ? 'pine' : 'dune';
}
/** Abstand der Palmengruppen (Chebyshev) und Zahl der Formen; Richtungen 0 = +x, 1 = +y, 2 = −x, 3 = −y (Kachelraum). */
const PALM_GROUP_GAP = 3;
/** Palmenküste: eine Palme je so viele geeignete Strandkacheln (Ziel, R6 deckelt). */
export const PALM_PER_TILES = 4;
export const PALM_SHAPES = 3;

/** Richtung (0…3) vom Land zum nächsten Wasser, auf die 4 Kachelachsen gerundet (= die 4 Iso-Richtungen). */
function seaward(p: StaticPlan, w: number, h: number, x: number, y: number): number {
  let best = Infinity,
    bx = 1,
    by = 0;
  for (let dy = -6; dy <= 6; dy++)
    for (let dx = -6; dx <= 6; dx++) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || p.cls[ny * w + nx] !== 0) continue;
      const d = dx * dx + dy * dy + 0.01 * hash2(p.seed + 560, nx, ny);
      if (d < best) {
        best = d;
        bx = dx;
        by = dy;
      }
    }
  return Math.abs(bx) >= Math.abs(by) ? (bx >= 0 ? 0 : 2) : by >= 0 ? 1 : 3;
}

/**
 * Palmen (D1): einzeln oder in Gruppen zu 2–3 auf trockenem Sand mit Wasserabstand ≥ 2 (≥ 1 Kachel Abstand zum Saum). Die
 * Küstenvariante bestimmt die Zahl der Gruppen: Palmenküste 3–10, Kiefernküste höchstens eine, Dünenküste keine. Statisch (D1):
 * nur Gelände, Seed und Küstenvariante; Belegung blendet in `stampPlacements` aus. Variante = Form · 4 + Richtung zur See.
 * Auf der Kiefernküste kommen zusätzlich 2–5 Strandkiefern (`planShorePines`, Salz 598) in dieselbe Liste.
 */
function planPalms(p: StaticPlan, w: number, h: number): void {
  const seed = p.seed;
  const kind = coastKind(seed);
  p.palms = [];
  if (kind === 'dune') return;
  const cand: { x: number; y: number; r: number }[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (p.cls[i] === 1 && p.coast[i]! >= 2) cand.push({ x, y, r: hash2(seed + 560, x, y) });
    }
  cand.sort((a, b) => a.r - b.r);
  // Palmenküste: ≥ 1 Palme je ~4 geeignete Strandkacheln (locker bewaldet), Gruppen zu 2–3 häufiger als Einzelne;
  // Kiefernküste: höchstens eine kleine Gruppe
  const target =
    kind === 'palm'
      ? Math.max(gCount(seed, 560, 0, 10), Math.ceil(cand.length / PALM_PER_TILES))
      : Math.floor(hash2(seed + 560, -5, -5) * 2) * 2;
  const gap = kind === 'palm' ? PALM_GROUP_GAP : PALM_GROUP_GAP + 3;
  const used = new Set<number>();
  const centres: Pos[] = [];
  for (const c of cand) {
    if (p.palms.length >= target) break;
    if (centres.some((t) => Math.max(Math.abs(t.x - c.x), Math.abs(t.y - c.y)) < gap)) continue;
    centres.push(c);
    const u = hash2(seed + 560, c.x * 64 + 1, c.y);
    const size = u < 0.2 ? 1 : u < 0.6 ? 2 : 3; // Gruppen 2–3 häufiger als einzeln
    const members = [c];
    for (const m of cand) {
      if (members.length >= size) break;
      if (m === c || Math.max(Math.abs(m.x - c.x), Math.abs(m.y - c.y)) !== 1) continue;
      members.push(m);
    }
    for (const m of members) {
      const id = m.y * w + m.x;
      if (used.has(id)) continue;
      used.add(id);
      const shape = Math.floor(hash2(seed + 560, m.x * 64 + 2, m.y) * PALM_SHAPES);
      p.palms.push({
        kind: 'palm',
        x: m.x,
        y: m.y,
        variant: shape * 4 + seaward(p, w, h, m.x, m.y),
        id,
      });
    }
  }
  if (kind === 'pine') planShorePines(p, w, h, used);
  p.palms.sort((a, b) => a.id - b.id);
}

/** Strandkiefern (L8, Salz 598): Zahl, Rang und Form nur aus Seed und Gelände (D1). */
export const SHORE_PINE_MIN = 2;
export const SHORE_PINE_MAX = 5;
/** Mindestabstand (Chebyshev) der Strandkiefern zueinander in Kacheln. */
export const SHORE_PINE_GAP = 3;
const SHORE_PINE_SALT = 598;
/**
 * Kiefernküste: 2–5 Strandkiefern auf trockenem Sand (Wasserabstand ≥ 2), ≥ `SHORE_PINE_GAP` Kacheln auseinander, nicht auf
 * Palmenkacheln. Variante = Richtung zur See (windschief wie die Palmen; die Kronenform folgt der Richtung).
 */
function planShorePines(p: StaticPlan, w: number, h: number, used: Set<number>): void {
  const seed = p.seed;
  const want =
    SHORE_PINE_MIN +
    Math.floor(hash2(seed + SHORE_PINE_SALT, -1, -1) * (SHORE_PINE_MAX - SHORE_PINE_MIN + 1));
  const cand: { x: number; y: number; r: number }[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (p.cls[i] === 1 && p.coast[i]! >= 2 && !used.has(i))
        cand.push({ x, y, r: hash2(seed + SHORE_PINE_SALT, x, y) });
    }
  cand.sort((a, b) => a.r - b.r);
  const placed: Pos[] = [];
  for (const c of cand) {
    if (placed.length >= want) break;
    if (placed.some((t) => Math.max(Math.abs(t.x - c.x), Math.abs(t.y - c.y)) < SHORE_PINE_GAP))
      continue;
    placed.push(c);
    p.palms.push({
      kind: 'shorePine',
      x: c.x,
      y: c.y,
      variant: seaward(p, w, h, c.x, c.y),
      id: c.y * w + c.x,
    });
  }
}

/** Boden-G-Elemente mit statischer Kandidatenliste: A7, A11, A12, B7 (Salze 545, 546, 547, 549). */
export const G_KINDS = ['stoneHeap', 'molehills', 'reeds', 'deadwood'] as const;
const G_SALTS = [545, 546, 547, 549] as const;

/**
 * Statische Kandidaten der Boden-G-Elemente (D1): je Art die `gCount` besten zulässigen Grünlandkacheln nach Rang
 * `hash2(seed + salt, x * 64 + 63, y)` mit Abstand `G_SPACING`. Zulässig: A7/A11 im Inneren der Wiese (ohne Urwald), A12
 * nahe der Küste (Abstand 1–3 zum Wasser), B7 an Kacheln mit Urwald als Nachbar. Ob ein Kandidat gezeigt wird, entscheiden
 * Belegung und aktueller Wald (`tileKind`); ein ausgeblendeter Platz wird nie ersetzt.
 */
function planGround(p: StaticPlan, w: number, h: number): void {
  const seed = p.seed;
  const wild = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < w && y < h && p.wild?.[y * w + x] === 1;
  G_KINDS.forEach((kind, ki) => {
    const salt = G_SALTS[ki]!;
    const cand: { i: number; x: number; y: number; r: number }[] = [];
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (p.cls[i] !== 2 || p.wild?.[i] === 1 || p.reserved[i] || p.g[i]) continue;
        const ok =
          kind === 'reeds'
            ? p.coast[i]! >= 1 && p.coast[i]! <= 3
            : kind === 'deadwood'
              ? wild(x - 1, y) || wild(x + 1, y) || wild(x, y - 1) || wild(x, y + 1)
              : p.green[i]! >= 3;
        if (ok) cand.push({ i, x, y, r: hash2(seed + salt, x * 64 + 63, y) });
      }
    p.gEligible[ki] = cand.length;
    cand.sort((a, b) => a.r - b.r);
    const n = gCount(seed, salt, ki + 1);
    const taken: { x: number; y: number }[] = [];
    for (const c of cand) {
      if (taken.length >= n) break;
      if (taken.some((t) => Math.max(Math.abs(t.x - c.x), Math.abs(t.y - c.y)) < G_SPACING))
        continue;
      taken.push(c);
      p.g[c.i] = ki + 1;
    }
  });
}

// ---------- Strand (D2–D6, D9; L5) ----------

/** Eintrittswahrscheinlichkeit je Sandkachel (Würfel je Art, Salze 561–564): nasser Saum und trockener Sand. */
const BEACH_BAND = {
  wood: 0.03,
  shell: 0.07,
  stoneWet: 0.08,
  stoneDry: 0.025,
  /** Strandhafer auf Dünenkämmen: je nach Küstenvariante; Rauschschwelle des Kamms und Anteil auf dem Kamm. */
  grass: { palm: [0.58, 0.3], pine: [0.52, 0.4], dune: [0.3, 0.55] },
} as const;
export const CRATE_P = 0.15;
export const TIDEPOOL_MAX = 6;
/** Tümpel brauchen Felsküste: Gebirge höchstens so viele Kacheln entfernt. */
const POOL_MTN_REACH = 6;

/**
 * Statische Strand-Kandidaten (D1): Kiste D9 (Los `hash2(seed + 565, 0, 0) < CRATE_P`, Ort = bester Rang unter den nassen
 * Sandkacheln, nie zweimal) und Gezeitentümpel D6 (nasser Sand mit Gebirge in der Nähe, Abstand ≥ 4, höchstens
 * `TIDEPOOL_MAX`). Ob sie gezeigt werden, entscheidet nur die Belegung (`groundElements`).
 */
function planBeach(p: StaticPlan, w: number, h: number): void {
  const seed = p.seed;
  const wet: { x: number; y: number; i: number }[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (p.cls[i] === 1 && p.coast[i] === 1) wet.push({ x, y, i });
    }
  if (hash2(seed + 565, 0, 0) < CRATE_P && wet.length) {
    let best = wet[0]!,
      bs = -1;
    for (const c of wet) {
      const r = hash2(seed + 565, c.x + 1, c.y + 1);
      if (r > bs) {
        bs = r;
        best = c;
      }
    }
    p.crate = { x: best.x, y: best.y };
  }
  const cand = wet
    .filter(
      (c) => p.mtn[c.i]! <= POOL_MTN_REACH && !(p.crate && p.crate.x === c.x && p.crate.y === c.y),
    )
    .map((c) => ({ ...c, r: hash2(seed + 561, c.x * 64 + 63, c.y) }))
    .sort((a, b) => a.r - b.r);
  const n = Math.min(TIDEPOOL_MAX, gCount(seed, 561, 6, TIDEPOOL_MAX));
  const taken: { x: number; y: number }[] = [];
  for (const c of cand) {
    if (taken.length >= n) break;
    if (taken.some((t) => Math.max(Math.abs(t.x - c.x), Math.abs(t.y - c.y)) < G_SPACING)) continue;
    taken.push(c);
    p.pool[c.i] = 1;
  }
}

/** Das Strand-Element einer freien Sandkachel (höchstens eines), `null` ohne. Nur Kachel und Küstenvariante (D2). */
function sandKind(
  seed: number,
  plan: StaticPlan,
  w: number,
  x: number,
  y: number,
): { kind: GroundKind; arg: number } | null {
  const i = y * w + x;
  if (plan.crate && plan.crate.x === x && plan.crate.y === y)
    return { kind: 'crate', arg: hash2(seed + 565, -1, -1) < 0.4 ? 1 : 0 };
  if (plan.pool[i]) return { kind: 'tidePool', arg: 0 };
  const c = plan.coast[i]!;
  if (c === 1) {
    if (hash2(seed + 562, x, y) < BEACH_BAND.wood) return { kind: 'driftwood', arg: 0 };
    if (hash2(seed + 563, x, y) < BEACH_BAND.shell)
      return { kind: 'shell', arg: hash2(seed + 563, x + 77, y) < 0.3 ? 1 : 0 };
    if (hash2(seed + 561, x, y) < BEACH_BAND.stoneWet) return { kind: 'beachStone', arg: 0 };
    return null;
  }
  if (hash2(seed + 561, x + 31, y) < BEACH_BAND.stoneDry) return { kind: 'beachStone', arg: 0 };
  const [thr, share] = BEACH_BAND.grass[coastKind(seed)];
  if (
    c <= 6 &&
    valueNoise(seed + 564, (x + 0.5) / 3.5, (y + 0.5) / 3.5) > thr &&
    hash2(seed + 564, x, y) < share
  )
    return { kind: 'beachGrass', arg: 0 };
  return null;
}

/** Statisch zulässige Kacheln je Boden-G-Art in der Reihenfolge von `G_KINDS` (Test: „das Gelände lässt es zu“). */
export const groundEligible = (
  seed: number,
  isl: DecorIsland,
  kontor: Pos | null = null,
): number[] => staticPlan(seed, isl, kontor).gEligible.slice();

/**
 * Stempel der Insel: die statische Liste (`planStamps`), ausgeblendet wo der Fuss kein unbelegtes Gras ist, auf Kacheln vor
 * einem Gebäude liegt (R3) oder ein Solitär weniger als `SOLITAIRE_FOREST_GAP` Kacheln vom jetzigen Wald steht (R5).
 * Nichts rückt nach: ein Haus, ein Weg oder eine Rodung entfernt höchstens Stempel an Ort und Stelle. Sortiert nach `id`.
 * Mit `sea` (nur die Heimat, `iso.ts`) kommen Palmen (D1, auf Sand, R3 wie die übrigen) und die Meer-Stempel (Wrack, Felsen,
 * Eiland aus `seaPlan`) dazu; R6 (≤ 1 je 6 Landkacheln, ≤ 300) zählt sie mit. Ohne `sea` bleibt alles wie in L4.
 */
export function stampPlacements(
  seed: number,
  isl: DecorIsland,
  kontor: Pos | null = null,
  sea?: SeaContext,
): StampPlacement[] {
  const w = isl.width;
  const p = staticPlan(seed, isl, kontor);
  const base = p.stamps.filter(
    (s) =>
      isl.tiles[s.y * w + s.x]!.terrain === 'grass' &&
      !stampBlocked(isl, s.x, s.y) &&
      (s.kind !== 'solitaire' || solitaireClear(isl, s.x, s.y)),
  );
  if (!sea) return base;
  const room = stampLimit(p.cls.reduce((n, c) => n + (c !== 0 ? 1 : 0), 0)) - base.length;
  const extra: StampPlacement[] = [
    ...seaStamps(seed, seaPlan(seed, isl, sea), w).filter(
      (s) =>
        !seaKontorBlocked(
          sea,
          s.x,
          s.y,
          s.kind === 'wreck' ? SEA_PAD.wreck : s.kind === 'islet' ? SEA_PAD.islet : 0,
        ),
    ),
    ...p.palms.filter(
      (s) => isl.tiles[s.y * w + s.x]!.terrain === 'sand' && !stampBlocked(isl, s.x, s.y),
    ),
  ];
  return [...base, ...extra.slice(0, Math.max(0, room))].sort((a, b) => a.id - b.id);
}

// ---------- Meer (E1, E2, E3, E6, E8, D11; R4) ----------

/** Wassertiefe = Chebyshev-Abstand zum Land: flach 1–2, mittel 3–6. */
export const SEA_SHALLOW_MAX = 2;
export const SEA_MID_MAX = 6;
/** R4: Mindestabstand zur Lane, zu Anker und Kontor (Kacheln), Halbwinkel des Anfahrtskegels (Grad). */
export const SEA_LANE_GAP = 3;
export const SEA_ANCHOR_GAP = 4;
export const SEA_CONE_DEG = 30;
/** Lose der seltenen Meer-Elemente (Spec 3.5): Wrack 40 %, Felseiland 15 %, Felsnadel (S) 30 %. */
export const WRECK_P = 0.4;
export const ISLET_P = 0.15;
export const NEEDLE_P = 0.3;

/** Alles, was die Schifffahrt von der Heimatinsel aus festlegt, in Kachelkoordinaten der Heimat (Mitte der Kachel = x + 0,5). */
export interface SeaContext {
  /** Fahrlinien der Heimat (vom Anker weg), Polylinien. */
  lanes: Pos[][];
  anchor: Pos;
  /**
   * Das Start-Kontor (kleinste id auf der Heimat): Teil der Planung. Ein später gebautes Kontor verschiebt oder würfelt nichts
   * neu (der Plan ist statisch, D1).
   */
  kontors: KontorRect[];
  /**
   * Alle jetzigen Kontore der Heimat (Start-Kontor eingeschlossen): R4 gilt für jedes als Sichtbarkeitsfilter (`seaKontorBlocked`,
   * wie D2 in L4): Meer-Stempel und ihr Schaum entfallen, solange eins < 4 Kacheln entfernt ist.
   */
  live: KontorRect[];
}
export interface KontorRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const seaContexts = new WeakMap<World, { sig: string; ctx: SeaContext }>();

/**
 * Seekontext der Heimat (rein lesend): `seaLanes` mit Heimat-Index in Heimat-Kacheln (minus `ox`/`oy`), Anker, Kontore. Je
 * Welt einmal gehalten (WeakMap, fällt mit der Welt weg); neu gebildet nur, wenn sich die Kontorliste ändert (Inseln sind ab
 * Weltbau fest).
 */
export function seaContext(world: World): SeaContext {
  const hi = Math.max(
    0,
    world.islands.findIndex((i) => i.kind === 'home'),
  );
  const isl = world.islands[hi]!;
  const found = Object.values(world.buildings)
    .filter((b) => b.island === hi && (b.defId === 'kontor' || b.defId === 'kontor2'))
    .sort((a, b) => a.id - b.id)
    .map((b) => {
      const d = BUILDING_DEFS[b.defId];
      return { x: b.x, y: b.y, w: d.w, h: d.h };
    });
  const live = found;
  const kontors = found.slice(0, 1);
  const sig = JSON.stringify(live);
  const c = seaContexts.get(world);
  if (c && c.sig === sig) return c.ctx;
  const lanes: Pos[][] = [];
  for (const l of seaLanes(world.islands)) {
    if (l.a !== hi && l.b !== hi) continue;
    const pts = l.a === hi ? l.points : [...l.points].reverse();
    lanes.push(pts.map((q) => ({ x: q.x - isl.ox, y: q.y - isl.oy })));
  }
  const ctx: SeaContext = {
    lanes,
    anchor: { x: isl.anchor.x + 0.5, y: isl.anchor.y + 0.5 },
    kontors,
    live,
  };
  seaContexts.set(world, { sig, ctx });
  return ctx;
}

function distToSeg(px: number, py: number, a: Pos, b: Pos): number {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l2));
  return Math.hypot(px - (a.x + t * dx), py - (a.y + t * dy));
}

/**
 * R4: Kachel (`x`, `y`) ist für Meer-Elemente gesperrt, wenn ihre Mitte < `SEA_LANE_GAP` Kacheln von einer Lane, <
 * `SEA_ANCHOR_GAP` vom Anker oder von einem Kontor (Abstand zum Rechteck) liegt oder im Anfahrtskegel (±`SEA_CONE_DEG` um
 * die Fahrtrichtung vom Anker weg, je Lane) steht. `pad` vergrössert die Abstände für Elemente über eine Kachel hinaus.
 * Die „Richtung Anker → nächster Lane-Punkt“ ist die Richtung des ersten Lane-Abschnitts (Lanes sind Geraden Anker → Anker).
 */
export function seaKeepOut(ctx: SeaContext, x: number, y: number, pad = 0): boolean {
  return seaClearance(ctx, x + 0.5, y + 0.5, pad) < 0;
}

/**
 * Abstand in Kacheln zur R4-Grenze am Punkt (`cx`, `cy`, Kachelraum): kleinster Spielraum über Lane (− 3), Anker (− 4), Start-Kontor
 * (− 4) und Anfahrtskegel (Abstand zum Kegelrand); negativ = gesperrt. Die Tönung der Wasserfelder (`seaFields.ts`) läuft damit
 * pixelgenau bei 0 aus.
 */
export function seaClearance(ctx: SeaContext, cx: number, cy: number, pad = 0): number {
  let c = Infinity;
  for (const l of ctx.lanes)
    for (let i = 1; i < l.length; i++)
      c = Math.min(c, distToSeg(cx, cy, l[i - 1]!, l[i]!) - SEA_LANE_GAP - pad);
  const vx = cx - ctx.anchor.x,
    vy = cy - ctx.anchor.y;
  const vl = Math.hypot(vx, vy);
  c = Math.min(c, vl - SEA_ANCHOR_GAP - pad);
  for (const k of ctx.kontors) c = Math.min(c, kontorDist(k, cx, cy) - SEA_ANCHOR_GAP - pad);
  if (vl > 1e-9) {
    const rad = (SEA_CONE_DEG * Math.PI) / 180;
    for (const l of ctx.lanes) {
      const t = l.find((q) => Math.hypot(q.x - ctx.anchor.x, q.y - ctx.anchor.y) > 1e-6);
      if (!t) continue;
      const tx = t.x - ctx.anchor.x,
        ty = t.y - ctx.anchor.y;
      const ang = Math.acos(
        Math.max(-1, Math.min(1, (vx * tx + vy * ty) / (vl * Math.hypot(tx, ty)))),
      );
      c = Math.min(
        c,
        ang < rad
          ? -vl * Math.sin(rad - ang) - 1e-9
          : vl * Math.sin(Math.min(ang - rad, Math.PI / 2)),
      );
    }
  }
  return c;
}

const kontorDist = (k: KontorRect, cx: number, cy: number): number =>
  Math.hypot(Math.max(k.x - cx, 0, cx - (k.x + k.w)), Math.max(k.y - cy, 0, cy - (k.y + k.h)));

/**
 * R4 als Sichtbarkeitsfilter (wie D2 in L4): ein Meer-Stempel an Kachel (`x`, `y`) samt Schaum entfällt, solange irgendein
 * jetziges Kontor (`ctx.live`) < `SEA_ANCHOR_GAP` + `pad` Kacheln entfernt ist. Nach einem Abriss kommt er zurück. Die Flächen
 * (Sandbank, Riff, Tang) bleiben, weil sie nur Bodentönung sind, nie gepatcht werden und daher nicht je Kontor neu entstehen.
 */
export function seaKontorBlocked(ctx: SeaContext, x: number, y: number, pad = 0): boolean {
  return ctx.live.some((k) => kontorDist(k, x + 0.5, y + 0.5) < SEA_ANCHOR_GAP + pad);
}
/** Zuschlag für den Fussabdruck über eine Kachel hinaus (Wrack ≤ 1,5 Kacheln, Eiland mit Sandring). */
export const SEA_PAD = { wreck: 0.5, islet: 1, rock: 0 } as const;

export interface SeaRock extends Pos {
  /** Felsnadel (S): schmal und hoch, Variante 6/7. */
  needle: boolean;
}
/** Wasserfläche (D11, E2, E6): ihre Kacheln; in Teil 2 von `terrain.ts`/`water.ts` gezeichnet, nicht von den Stempeln. */
export interface SeaArea {
  tiles: Pos[];
}
export interface SeaPlan {
  wreck: Pos | null;
  rocks: SeaRock[];
  islet: Pos | null;
  sandbanks: SeaArea[];
  reefs: SeaArea[];
  kelp: SeaArea[];
}
export interface SeaTile extends Pos {
  kind: 'wreck' | 'rock' | 'islet' | 'sandbank' | 'reef' | 'kelp';
}
/** Alle Kacheln aller Meer-Elemente (für R4-Prüfung, L7 und die Flächenzeichner). */
export function seaElementTiles(plan: SeaPlan): SeaTile[] {
  const out: SeaTile[] = [];
  if (plan.wreck) out.push({ kind: 'wreck', ...plan.wreck });
  for (const r of plan.rocks) out.push({ kind: 'rock', x: r.x, y: r.y });
  if (plan.islet) out.push({ kind: 'islet', ...plan.islet });
  for (const [kind, list] of [
    ['sandbank', plan.sandbanks],
    ['reef', plan.reefs],
    ['kelp', plan.kelp],
  ] as const)
    for (const a of list) for (const t of a.tiles) out.push({ kind, x: t.x, y: t.y });
  return out;
}

const seaPlans = new WeakMap<object, { seed: number; key: string; plan: SeaPlan }>();
const ctxKeys = new WeakMap<SeaContext, string>();
const ctxKey = (c: SeaContext): string => {
  let k = ctxKeys.get(c);
  if (k === undefined)
    ctxKeys.set(c, (k = JSON.stringify({ lanes: c.lanes, anchor: c.anchor, kontors: c.kontors })));
  return k;
};

/** Wasser, das mit dem Kartenrand zusammenhängt (4er-Nachbarschaft): das Meer; Binnenseen zählen nicht. */
function seaMask(cls: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(w * h);
  const q: number[] = [];
  const push = (x: number, y: number): void => {
    const i = y * w + x;
    if (x < 0 || y < 0 || x >= w || y >= h || out[i] || cls[i] !== 0) return;
    out[i] = 1;
    q.push(i);
  };
  for (let x = 0; x < w; x++) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    push(0, y);
    push(w - 1, y);
  }
  for (let k = 0; k < q.length; k++) {
    const i = q[k]!,
      x = i % w,
      y = (i / w) | 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
  return out;
}

/**
 * Meer-Plan der Heimat (statisch, D1): Wrack (E1), Meeresfelsen (E3, selten Felsnadel), Felseiland (E8) und die Flächen
 * Sandbank (D11), Riff (E2), Seetang (E6). Nur Gelände, Seed und `SeaContext`; jede Kachel besteht `seaKeepOut` (R4), kein Element
 * überlappt ein anderes (Punkt-Elemente halten Abstand ≥ 3, Flächen belegen ihre Kacheln samt Rand). Einmal je Insel gehalten.
 */
export function seaPlan(seed: number, isl: DecorIsland, ctx: SeaContext): SeaPlan {
  const key = ctxKey(ctx);
  const hit = seaPlans.get(isl);
  if (hit && hit.seed === seed && hit.key === key) return hit.plan;
  const { width: w, height: h } = isl;
  const cls = staticClasses(isl);
  const sea = seaMask(cls, w, h);
  const shore = chebDist(w, h, (i) => cls[i] !== 0);
  const mtn = chebDist(w, h, (i) => cls[i] === 3);
  const blocked = new Uint8Array(w * h);
  const plan: SeaPlan = { wreck: null, rocks: [], islet: null, sandbanks: [], reefs: [], kelp: [] };
  const inRect = (x: number, y: number): boolean => x >= 2 && y >= 2 && x < w - 2 && y < h - 2;
  const ok = (x: number, y: number, lo: number, hi: number, pad = 0): boolean => {
    if (!inRect(x, y)) return false;
    const i = y * w + x;
    return (
      !!sea[i] && !blocked[i] && shore[i]! >= lo && shore[i]! <= hi && !seaKeepOut(ctx, x, y, pad)
    );
  };
  const claim = (x: number, y: number, r: number): void => {
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx,
          ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h) blocked[ny * w + nx] = 1;
      }
  };
  /** Die Kacheln im Tiefenband nach Rang `hash2(seed + salt, x + 100 · k, y)`, bester zuerst. */
  const ranked = (salt: number, k: number, lo: number, hi: number, pad = 0): Pos[] => {
    const c: { x: number; y: number; r: number }[] = [];
    for (let y = 2; y < h - 2; y++)
      for (let x = 2; x < w - 2; x++) {
        const i = y * w + x;
        if (sea[i] && shore[i]! >= lo && shore[i]! <= hi && !seaKeepOut(ctx, x, y, pad))
          c.push({ x, y, r: hash2(seed + salt, x + 100 * k, y) });
      }
    return c.sort((a, b) => a.r - b.r);
  };

  // E1 Wrack
  if (hash2(seed + 566, 0, 0) < WRECK_P) {
    const c = ranked(566, 1, 1, 5, SEA_PAD.wreck).find((t) => ok(t.x, t.y, 1, 5, SEA_PAD.wreck));
    if (c) {
      plan.wreck = { x: c.x, y: c.y };
      claim(c.x, c.y, 2);
    }
  }
  // E8 Felseiland: Mittelwasser ≥ 4 Kacheln zur Küste
  if (hash2(seed + 568, 0, 0) < ISLET_P) {
    const c = ranked(568, 2, 4, SEA_MID_MAX, SEA_PAD.islet).find((t) =>
      ok(t.x, t.y, 4, SEA_MID_MAX, SEA_PAD.islet),
    );
    if (c) {
      plan.islet = { x: c.x, y: c.y };
      claim(c.x, c.y, 2);
    }
  }
  // E3 Meeresfelsen (G), selten eine Felsnadel (S)
  const nRocks = gCount(seed, 567, 5, 9);
  for (const c of ranked(567, 3, 1, 5)) {
    if (plan.rocks.length >= nRocks) break;
    if (!ok(c.x, c.y, 1, 5)) continue;
    plan.rocks.push({ x: c.x, y: c.y, needle: false });
    claim(c.x, c.y, 2);
  }
  if (plan.rocks.length && hash2(seed + 567, -1, -1) < NEEDLE_P)
    plan.rocks[Math.floor(hash2(seed + 567, -2, -2) * plan.rocks.length)]!.needle = true;

  // Flächen: wachsen aus einem Startpunkt über 4er-Nachbarn; jede Kachel prüft R4 und Belegung
  const grow = (
    salt: number,
    k: number,
    start: Pos,
    n: number,
    lo: number,
    hi: number,
    walk: boolean,
  ): Pos[] => {
    const tiles: Pos[] = [start];
    const has = (x: number, y: number): boolean => tiles.some((t) => t.x === x && t.y === y);
    let step: Pos | null = null;
    while (tiles.length < n) {
      const from = walk ? [tiles[tiles.length - 1]!] : tiles;
      const cand: { x: number; y: number; r: number }[] = [];
      for (const t of from)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue;
            if (!walk && dx && dy) continue;
            const x = t.x + dx,
              y = t.y + dy;
            if (has(x, y) || !ok(x, y, lo, hi)) continue;
            let r = hash2(seed + salt, x + 100 * k, y);
            if (walk && step && dx === step.x && dy === step.y) r -= 0.6; // Streifen: Richtung halten
            cand.push({ x, y, r });
          }
      if (!cand.length) break;
      const best = cand.reduce((a, b) => (b.r < a.r ? b : a));
      if (walk) {
        const last = tiles[tiles.length - 1]!;
        step = { x: best.x - last.x, y: best.y - last.y };
      }
      tiles.push({ x: best.x, y: best.y });
    }
    return tiles;
  };
  const areas = (
    k: number,
    max: number,
    lo: number,
    hi: number,
    sizeLo: number,
    sizeHi: number,
    walk: boolean,
    near?: (i: number) => boolean,
  ): SeaArea[] => {
    const out: SeaArea[] = [];
    const n = gCount(seed, 569, k, max);
    for (const c of ranked(569, k, lo, hi)) {
      if (out.length >= n) break;
      if (!ok(c.x, c.y, lo, hi) || (near && !near(c.y * w + c.x))) continue;
      const size =
        sizeLo + Math.floor(hash2(seed + 569, c.x + 100 * k, c.y + 977) * (sizeHi - sizeLo + 1));
      const tiles = grow(569, k, { x: c.x, y: c.y }, size, lo, hi, walk);
      if (tiles.length < Math.min(3, sizeLo)) continue;
      for (const t of tiles) claim(t.x, t.y, 1);
      out.push({ tiles });
    }
    return out;
  };
  plan.reefs = areas(1, 6, 3, 4, 4, 9, true); // E2: Streifen im Mittelwasser, dicht an einer Tiefenlinie
  plan.sandbanks = areas(0, 6, 1, SEA_SHALLOW_MAX, 3, 8, false); // D11: Flachwasser
  plan.kelp = areas(2, 6, 1, SEA_SHALLOW_MAX, 4, 9, false, (i) => mtn[i]! <= 5); // E6: Flachwasser vor Felsküste
  seaPlans.set(isl, { seed, key, plan });
  return plan;
}

/** Stempel des Meer-Plans: Wrack (Variante 0…3), Felsen (0…5 Haufen, 6/7 Nadel), Eiland (0…3). Fläche sind keine Stempel. */
export function seaStamps(seed: number, plan: SeaPlan, w: number): StampPlacement[] {
  const out: StampPlacement[] = [];
  const add = (kind: StampKind, t: Pos, variant: number): void =>
    void out.push({ kind, x: t.x, y: t.y, variant, id: t.y * w + t.x });
  if (plan.wreck)
    add('wreck', plan.wreck, Math.floor(hash2(seed + 566, plan.wreck.x, plan.wreck.y) * 4));
  if (plan.islet)
    add('islet', plan.islet, Math.floor(hash2(seed + 568, plan.islet.x, plan.islet.y) * 4));
  for (const r of plan.rocks) {
    const u = hash2(seed + 567, r.x, r.y);
    add('seaRock', r, r.needle ? 6 + Math.floor(u * 2) : Math.floor(u * 6));
  }
  return out;
}

// ---------- Boden-Elemente ----------

/** Breite der Auswahlbänder je Kachel (Anteil der Kacheln); Summe auf offener Wiese ≈ 0,3 (Akzent, nicht Textur). */
const BAND = {
  tuft: 0.16,
  pebble: 0.06,
  pebbleMtn: 0.16,
  boulder: 0.03,
  boulderMtn: 0.1,
  boulderHill: 0.04,
  toadstools: 0.08,
} as const;

const forestAt = (isl: DecorIsland, x: number, y: number): boolean =>
  x >= 0 &&
  y >= 0 &&
  x < isl.width &&
  y < isl.height &&
  isl.tiles[y * isl.width + x]!.terrain === 'forest';

/** Maske der Waldseiten einer Kachel (1 links, 2 rechts, 4 oben, 8 unten). */
export const forestSides = (isl: DecorIsland, x: number, y: number): number =>
  (forestAt(isl, x - 1, y) ? 1 : 0) |
  (forestAt(isl, x + 1, y) ? 2 : 0) |
  (forestAt(isl, x, y - 1) ? 4 : 0) |
  (forestAt(isl, x, y + 1) ? 8 : 0);

/**
 * Dichte der Buschgruppen (A3) je Kachel: gehäuft über ein Rauschfeld (Salz 553), im Mittel ≈ 1 Gruppe je 6–7 freie
 * Wiesenkacheln, im Kern der Flecken dichter, dazwischen leer.
 */
export function shrubDensity(seed: number, x: number, y: number): number {
  const f = valueNoise(seed + 553, (x + 0.5) / 3.5, (y + 0.5) / 3.5);
  return Math.min(0.6, Math.max(0, (f - 0.25) * 1.0));
}

/**
 * Fortsetzung der Waldkante über die Enden der Kachel (Bits 4 + 2 · Seitenindex + Ende, Seitenindex 0 links, 1 rechts, 2 oben,
 * 3 unten): die Nachbarkachel entlang der Kante ist Nicht-Wald und hat denselben Wald an derselben Seite. Sonst endet die
 * Kante (Ecke der Treppe) und der Farnsaum spart sie aus. Hängt nur an Kachel und Nachbarn (D2).
 */
export function fringeEnds(isl: DecorIsland, x: number, y: number, sides: number): number {
  let m = 0;
  const cont = (nx: number, ny: number, dx: number, dy: number): boolean =>
    nx >= 0 &&
    ny >= 0 &&
    nx < isl.width &&
    ny < isl.height &&
    !forestAt(isl, nx, ny) &&
    forestAt(isl, nx + dx, ny + dy);
  const dirs: [number, number][] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ]; // Richtung zum Wald je Seite
  dirs.forEach(([dx, dy], si) => {
    if (!(sides & (1 << si))) return;
    // Enden der Kante: entlang y (links/rechts) bzw. x (oben/unten), kleinere und grössere Koordinate
    const along: [number, number][] =
      si < 2
        ? [
            [0, -1],
            [0, 1],
          ]
        : [
            [-1, 0],
            [1, 0],
          ];
    along.forEach(([ax, ay], e) => {
      if (cont(x + ax, y + ay, dx, dy)) m |= 1 << (4 + si * 2 + e);
    });
  });
  return m;
}

/** A2 nach `meadowWarmth`: feucht = hohes Gras, Mitte = Klee, warm = Trockenrasen. */
export function tuftKind(seed: number, x: number, y: number): 'tuftTall' | 'clover' | 'tuftDry' {
  const m = meadowWarmth(seed, x + 0.5, y + 0.5);
  return m < -0.25 ? 'tuftTall' : m > 0.25 ? 'tuftDry' : 'clover';
}

/**
 * Das Boden-Element einer freien Graskachel (höchstens eines): ein Würfel `hash2(seed + 551, x, y)` wählt in festen
 * Bändern. Nur 1 × 1-Elemente; sie hängen von der Kachel und ihren 8 Nachbarn ab (D2, `DECOR_REACH`).
 */
function tileKind(
  seed: number,
  isl: DecorIsland,
  occ: Uint8Array,
  plan: StaticPlan,
  x: number,
  y: number,
): GroundKind | null {
  const w = isl.width,
    i = y * w + x;
  const u = hash2(seed + 551, x, y);
  let acc = 0;
  const hit = (p: number): boolean => {
    acc += p;
    return u < acc;
  };
  const edge4 =
    forestAt(isl, x - 1, y) ||
    forestAt(isl, x + 1, y) ||
    forestAt(isl, x, y - 1) ||
    forestAt(isl, x, y + 1);
  // statischer G-Kandidat dieser Kachel (A7, A11, A12, B7): B7 braucht jetzt Wald als Nachbarn, sonst entfällt er
  const g = plan.g[i]!;
  if (g && (G_KINDS[g - 1] !== 'deadwood' || edge4)) return G_KINDS[g - 1]!;
  // L8 T4: jedes bedingte Band rückt den Zähler immer vor (auch ungenutzt), damit eine Nachbarschaftsänderung
  // (Neubau, Wald) die Kachel nur leert, nie die Art wechselt
  const toadHit = hit(BAND.toadstools);
  if (toadHit) return edge4 ? 'toadstools' : null;
  // A3 braucht rundum Abstand zu Weg/Gebäude und zum Wald
  let ringFree = true;
  for (let dy = -DECOR_REACH; dy <= DECOR_REACH && ringFree; dy++)
    for (let dx = -DECOR_REACH; dx <= DECOR_REACH; dx++) {
      const nx = x + dx,
        ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= isl.height) continue;
      if (occ[ny * w + nx] === 1 || forestAt(isl, nx, ny)) {
        ringFree = false;
        break;
      }
    }
  const shrubHit = hit(shrubDensity(seed, x, y));
  if (shrubHit) return ringFree ? 'shrubs' : null;
  const pm = plan.mtn[i]! <= 5 ? (6 - plan.mtn[i]!) / 5 : 0; // am Gebirge häufiger
  const hill = decorHill(seed, x + 0.5, y + 0.5) > 0.62 ? BAND.boulderHill : 0; // Kuppen
  if (hit(BAND.boulder + BAND.boulderMtn * pm + hill)) return 'boulder';
  if (hit(BAND.pebble + BAND.pebbleMtn * pm)) return 'pebble';
  if (hit(BAND.tuft)) return tuftKind(seed, x, y);
  return null;
}

const boxOf = (x: number, y: number, w: number, h: number): TileRect => ({
  x0: x,
  y0: y,
  x1: x + w - 1,
  y1: y + h - 1,
});
const hits = (a: TileRect, r: TileRect): boolean =>
  a.x0 <= r.x1 && a.x1 >= r.x0 && a.y0 <= r.y1 && a.y1 >= r.y0;

/**
 * Sichtbare Boden-Elemente einer Insel (Aufruf mit `rect`: nur solche, deren Bildbox das Rechteck schneidet), in fester
 * Reihenfolge: zuerst die S/E-Orte, dann zeilenweise je Kachel. `occ`: 1 = Gebäude oder Weg. Das Ergebnis im Rechteck
 * ist stets gleich dem entsprechenden Ausschnitt des vollen Plans (die Auswahl hängt nur an Kachel und Nachbarn).
 */
export function groundElements(
  seed: number,
  isl: DecorIsland,
  occ: Uint8Array,
  rect?: TileRect,
  kontor: Pos | null = null,
): GroundElement[] {
  const { width: w, height: h } = isl;
  const plan = staticPlan(seed, isl, kontor);
  const r: TileRect = rect ?? { x0: 0, y0: 0, x1: w - 1, y1: h - 1 };
  const out: GroundElement[] = [];
  for (const s of plan.sites) {
    if (s.id === 'bluetenteppich' || (s.id !== 'steinkreis' && s.id !== 'pilzring')) continue;
    const box = boxOf(s.x, s.y, s.size, s.size);
    if (!hits(box, r) || !footprintFree(isl, occ, s.x, s.y, s.size, s.size)) continue;
    out.push({
      kind: s.id === 'steinkreis' ? 'stoneCircle' : 'mushRing',
      x: s.x,
      y: s.y,
      w: s.size,
      h: s.size,
      box,
      arg: 0,
    });
  }
  const sites = plan.sites;
  for (let y = Math.max(0, r.y0); y <= Math.min(h - 1, r.y1); y++)
    for (let x = Math.max(0, r.x0); x <= Math.min(w - 1, r.x1); x++) {
      const i = y * w + x;
      if (!footprintFree(isl, occ, x, y, 1, 1)) {
        // L5: freier Sand (kein Gebäude, kein Weg) trägt Strand-Elemente
        if (isl.tiles[i]!.terrain === 'sand' && occ[i] !== 1) {
          const sk = sandKind(seed, plan, w, x, y);
          if (sk)
            out.push({ kind: sk.kind, x, y, w: 1, h: 1, box: boxOf(x, y, 1, 1), arg: sk.arg });
        }
        continue;
      }
      const res = plan.reserved[i]!;
      if (res) {
        const s = sites[res - 1]!;
        if (s.id === 'bluetenteppich')
          out.push({ kind: 'carpet', x, y, w: 1, h: 1, box: boxOf(x, y, 1, 1), arg: s.tone });
        continue;
      }
      // B8: durchgehender Farnsaum auf der Grasseite jeder Waldkante (zusätzlich zum einen Element der Kachel)
      const sides = forestSides(isl, x, y);
      if (sides)
        out.push({
          kind: 'ferns',
          x,
          y,
          w: 1,
          h: 1,
          box: boxOf(x, y, 1, 1),
          arg: sides | fringeEnds(isl, x, y, sides),
        });
      const kind = tileKind(seed, isl, occ, plan, x, y);
      if (kind)
        out.push({ kind, x, y, w: 1, h: 1, box: boxOf(x, y, 1, 1), arg: forestSides(isl, x, y) });
    }
  return out;
}
