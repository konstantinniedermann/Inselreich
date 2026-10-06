import { generateTerrain } from '../sim/mapgen';
import { hash2, valueNoise } from '../sim/noise';
import type { Island } from '../sim/types';
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
//  D5 Salze nur 540–559; Zufall nur über `hash2`/`valueNoise`.

/** Reichweite der Sichtbarkeitsprüfung über den Fussabdruck hinaus in Kacheln (= Rand von `dirtyRect`). */
export const DECOR_REACH = 1;
/** Obergrenze der S/E-Elemente je Insel in fester Reihenfolge (L8 stellt das 3–6-Band scharf). */
export const RARE_CAP = 6;
/** R6: höchstens ein Stempel je so viele Landkacheln und höchstens so viele je Insel. */
export const STAMP_PER_LAND = 6;
export const STAMP_MAX = 300;
/** Solitärbaum (A5): Mindestabstand zum Wald (Kacheln, Chebyshev), Abstand zwischen Stempeln und Obergrenze je Insel. */
export const SOLITAIRE_FOREST_GAP = 2;
export const STAMP_SPACING = 3;
export const SOLITAIRE_MAX = 12;
const SOLITAIRE_P = 0.012;
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
  | 'ferns'; // B8

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
export type StampKind = 'solitaire' | 'orchard' | 'menhir' | 'ruin';
export interface StampPlacement {
  kind: StampKind;
  x: number;
  y: number;
  /** Form-Variante 0…3. */
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
  /** 0 frei, sonst 1 + Index in `sites` (Fussabdruck bzw. Teppichkacheln). */
  reserved: Uint8Array;
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

/** Nach Eignung und Los: die Orte der S/E-Elemente. Reihenfolge fest; höchstens `RARE_CAP`. */
function planRare(p: StaticPlan, w: number, h: number): void {
  const seed = p.seed;
  const sites: RareSite[] = [];
  for (const def of RARE_POOL) {
    if (!rareLot(seed, def)) continue;
    const taken: Pos[] = [];
    const n = rareCount(seed, def);
    for (let k = 0; k < n && sites.length < RARE_CAP; k++) {
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
      if (best < 0) break;
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
    }
  }
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
    reserved: new Uint8Array(w * h),
  };
  planRare(p, w, h);
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
 * Stempel der Insel: S/E-Stempel (A6, A9, A14) an ihren statischen Orten, wenn der Fuss unbelegtes Gras ist, dazu
 * Solitärbäume (A5) nach Los. Alle ausserhalb von Belegung und Kacheln vor Gebäuden (R3), mit Mindestabstand
 * `STAMP_SPACING` (≤ 1 je 3 × 3), nach R6 gedeckelt. Eine reine Funktion von (Seed, Gelände, Belegung); sortiert nach `id`.
 */
export function stampPlacements(
  seed: number,
  isl: DecorIsland,
  kontor: Pos | null = null,
): StampPlacement[] {
  const { width: w, height: h } = isl;
  const plan = staticPlan(seed, isl, kontor);
  const limit = stampLimit(plan.cls.reduce((n, c) => n + (c !== 0 ? 1 : 0), 0));
  const out: StampPlacement[] = [];
  const near = (x: number, y: number): boolean =>
    out.some((s) => Math.max(Math.abs(s.x - x), Math.abs(s.y - y)) < STAMP_SPACING);
  const grassFree = (x: number, y: number): boolean =>
    isl.tiles[y * w + x]!.terrain === 'grass' && !stampBlocked(isl, x, y);
  for (const s of plan.sites) {
    const kind = STAMP_OF[s.id];
    if (!kind || out.length >= limit) continue;
    if (!grassFree(s.x, s.y) || near(s.x, s.y)) continue;
    out.push({
      kind,
      x: s.x,
      y: s.y,
      variant: Math.floor(hash2(seed + 552, s.x, s.y) * 4),
      id: s.y * w + s.x,
    });
  }
  const cand: { x: number; y: number; r: number }[] = [];
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const r = hash2(seed + 540, x, y);
      if (r >= SOLITAIRE_P || plan.reserved[y * w + x]) continue;
      if (grassFree(x, y) && solitaireClear(isl, x, y)) cand.push({ x, y, r });
    }
  cand.sort((a, b) => a.r - b.r);
  let solitaires = 0;
  for (const c of cand) {
    if (solitaires >= SOLITAIRE_MAX || out.length >= limit) break;
    if (near(c.x, c.y)) continue;
    out.push({
      kind: 'solitaire',
      x: c.x,
      y: c.y,
      variant: Math.floor(hash2(seed + 552, c.x, c.y) * 4),
      id: c.y * w + c.x,
    });
    solitaires++;
  }
  return out.sort((a, b) => a.id - b.id);
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
  stoneHeap: 0.004,
  molehills: 0.004,
  reeds: [0.1, 0.07, 0.04] as const,
  toadstools: 0.08,
  deadwood: 0.045,
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
  if (edge4) {
    if (hit(BAND.toadstools)) return 'toadstools';
    if (hit(BAND.deadwood)) return 'deadwood';
  }
  const cd = plan.coast[i]!;
  if (cd >= 1 && cd <= 3 && hit(BAND.reeds[cd - 1]!)) return 'reeds';
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
  if (ringFree && hit(shrubDensity(seed, x, y))) return 'shrubs';
  if (hit(BAND.stoneHeap)) return 'stoneHeap';
  if (hit(BAND.molehills)) return 'molehills';
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
      if (!footprintFree(isl, occ, x, y, 1, 1)) continue;
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
