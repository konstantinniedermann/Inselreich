import { hash2, valueNoise } from '../sim/noise';
import {
  GIANT_SCALE,
  TREE_H,
  crownGeom,
  heightFactor,
  maxRadius,
  type Crown,
  type CrownKind,
} from './crown';
import { ISO_W } from './isoBase';
import { rotNoise } from './light';
import { SAUM_LEVEL, saumAt, woodBlur, woodNoise, type WoodMask } from './woodField';

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
// 527 Form und Spiegelung · 528 Horstfeld · 529 frei.
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

// ---------------------------------------------------------------------------------------------------------------
// Darstellungswerte der Platzierung

/** Kandidaten je Waldkachel und je Vorwaldkachel. */
const CAND_FOREST = 14,
  CAND_MEADOW = 6;
/** Breite des lichten Randes in S-Einheiten (innen): von SAUM_LEVEL bis SAUM_LEVEL + CORE_SPAN wächst das Dach zu. */
const CORE_SPAN = 0.35;
/** Annahme je Kandidat: lichter Rand, voller Kern, hinter der Saumlinie (Waldkachel). */
const ACCEPT_EDGE = 0.45,
  ACCEPT_CORE = 0.97,
  ACCEPT_BEHIND = 0.3;
/** Vorwald: Band unter der Saumlinie (S-Einheiten), höchste Annahme, Anteil Büsche. */
const VORWALD_BAND = 0.35,
  VORWALD_ACCEPT = 0.85,
  VORWALD_BUSH = 0.55;
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
/** Beimischung (B3): Anteil Kronen einer anderen Art. */
const ADMIX_P = 0.09;
/**
 * Abstand: Mindestabstand der Fusspunkte als Anteil der Radiensumme je Art (Laub, Nadel, Birke, Pinie, Ahorn; Laub
 * schliesst dichter), für Büsche und Totholz, und absolut (Kacheln).
 */
const SPACING_KIND = [0.62, 0.78, 0.68, 0.56, 0.62] as const;
const SPACING_BUSH = 0.65,
  SPACING_MIN = 0.17;
/** Grösster Radius auf einer Eng-Kachel (Nachbar eines Objekts). */
const TIGHT_R = 0.2;
/** Kronen höchstens so weit über die eigene Kachel (Spec 2.1.1). */
export const OVERHANG = 0.35;
/** Vorwald: Gehölze höchstens 0,6 × TREE_H hoch. */
export const VORWALD_TOP = 0.6 * TREE_H;
/** Vorwald: höchstens so viele Gehölze je Wiesenkachel. */
export const VORWALD_MAX = 2;
/** Vorwald höchstens so viele Kacheln vor dem Wald (Chebyshev). */
export const VORWALD_REACH = 2;
/** Mindestzahl Kronen je freier Waldkachel (Spec 2.1.5). */
export const MIN_CROWNS = 2;
/** Formen je Art (die Hälfte gespiegelt): der Kronen-Atlas rastert `s` auf diese Stufen. */
export const SHAPES = 5;
/** Tonfeld (B2): Merkmal in Kacheln, Schwellen für −1/+1, Anteil Einzelwurf. */
const TONE_PERIOD = 7,
  TONE_LO = 0.42,
  TONE_HI = 0.58,
  TONE_FLIP = 0.1;
/** Totholz (B3): Anteil je Kandidat in Lücken und im lichten Kern. */
const DEAD_P = 0.015;

/** Formwert einer Formstufe: Mitte der Stufe (der Atlas zeichnet genau diese Form). */
export const shapeValue = (i: number): number => (i + 0.5) / SHAPES;

export interface WoodInput {
  seed: number;
  w: number;
  h: number;
  /** Geländewald je Kachel (für das Saumfeld; Gebäude und Wege auf Wald zählen mit). */
  terrainForest: (x: number, y: number) => boolean;
  /** Klasse je Kachel für die Kronen. */
  cls: (x: number, y: number) => TileClass;
}

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
  c: Crown;
  forest: boolean;
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
  const at = (x: number, y: number): TileClass =>
    x < 0 || y < 0 || x >= w || y >= h ? 'blocked' : cls(x, y);
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
  const open = (x: number, y: number): boolean => {
    const c = at(x, y);
    return c === 'forest' || c === 'meadow';
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
        const c = f === 1 ? forestCrown(fx, fy, x, y, j) : vorwaldCrown(fx, fy, x, y, j);
        const cand: Cand = {
          fx,
          fy,
          tx: x,
          ty: y,
          p: rnd(x, y, j, 2),
          c: c.crown,
          forest: f === 1,
        };
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
  function forestCrown(
    fx: number,
    fy: number,
    x: number,
    y: number,
    j: number,
  ): { ok: boolean; crown: Crown } {
    const s = S(fx, fy);
    const core = smooth01((s - SAUM_LEVEL) / CORE_SPAN);
    const inside = s >= SAUM_LEVEL;
    const gap = core > 0.6 ? forestClearing(seed, fx, fy) : 0;
    let accept = inside ? ACCEPT_EDGE + (ACCEPT_CORE - ACCEPT_EDGE) * core : ACCEPT_BEHIND;
    accept *= 1 - 0.85 * gap;
    // Horste und kleine Bestandslücken im Kern (Merkmal ≈ 2,5 Kacheln): das Dach ist kein Teppich
    accept *=
      1 - HORST_DEPTH * core * smooth01((0.55 - rotNoise(seed + 528, fx, fy, 1 / 2.5, 1.9)) / 0.3);
    // Totholz (B3) in Lücken und im lichten Kern
    if (rnd(x, y, j, 7) < DEAD_P * (0.3 + 2 * gap) && core > 0.5) {
      const dead = rnd(x, y, j, 8) < 0.7 ? 1 : 2;
      const c = makeCrown(0, dead === 1 ? 0.07 : 0.09, x, y, j, {}, TREE_H);
      c.dead = dead;
      c.h = 0;
      return { ok: true, crown: c };
    }
    const slot = slotAt(seed, type, fx, fy);
    let kind = slotKind(seed, slot);
    if (rnd(x, y, j, 3) < ADMIX_P)
      kind = slotKind(seed, (slot + 1 + (rnd(x, y, j, 4) < 0.5 ? 1 : 0)) % 3);
    const stand = STAND_LO + (STAND_HI - STAND_LO) * standAt(seed, fx, fy);
    const jitter = kind === 1 ? CONIFER_JITTER : SIZE_JITTER;
    let size = stand * (0.62 + 0.38 * core) * (1 + jitter * (2 * rnd(x, y, j, 5) - 1));
    const young = !inside || (core < 0.3 && rnd(x, y, j, 6) < 0.5);
    if (!young && core > 0.5 && rnd(x, y, j, 11) < EMERGENT_P) size *= EMERGENT_F;
    const c = makeCrown(kind, R_KIND[kind] * size, x, y, j, { young }, TREE_H);
    c.tone = toneAt(fx, fy, x, y, j);
    if (!inside) c.cast = true;
    return { ok: rnd(x, y, j, 12) < accept, crown: c };
  }
  function vorwaldCrown(
    fx: number,
    fy: number,
    x: number,
    y: number,
    j: number,
  ): { ok: boolean; crown: Crown } {
    const s = S(fx, fy);
    const v = smooth01((s - (SAUM_LEVEL - VORWALD_BAND)) / VORWALD_BAND);
    const mod = 0.3 + 0.7 * valueNoise(seed + 526, fx / 4, fy / 4);
    const accept = VORWALD_ACCEPT * v * mod;
    const bush = rnd(x, y, j, 3) < VORWALD_BUSH;
    const slot = slotAt(seed, type, fx, fy);
    const kind: CrownKind = bush ? 0 : slotKind(seed, rnd(x, y, j, 4) < 0.7 ? slot : 2);
    const r = bush ? 0.07 + 0.06 * rnd(x, y, j, 5) : 0.1 + 0.07 * rnd(x, y, j, 5);
    const c = makeCrown(kind, r, x, y, j, bush ? { bush } : { young: true }, VORWALD_TOP);
    c.tone = toneAt(fx, fy, x, y, j);
    c.cast = true;
    return { ok: s < SAUM_LEVEL + 0.15 && rnd(x, y, j, 12) < accept, crown: c };
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
              : Math.min(SPACING_KIND[q.c.kind], SPACING_KIND[o.c.kind]);
          const d = Math.max(minD, k * (q.c.r + o.c.r));
          if ((q.fx - o.fx) ** 2 + (q.fy - o.fy) ** 2 < d * d) return true;
        }
      }
    return false;
  };
  const accepted: Cand[] = [];
  const put = (q: Cand): void => {
    const k = keyOf(Math.floor(q.fx), Math.floor(q.fy));
    const l = grid.get(k);
    if (l) l.push(q);
    else grid.set(k, [q]);
    accepted.push(q);
  };
  const meadowN = new Map<number, number>();
  for (const q of cands) {
    if (conflicts(q, SPACING_MIN)) continue;
    if (!q.forest) {
      // Vorwald: höchstens VORWALD_MAX Gehölze je Wiesenkachel (Wiese bleibt Wiese)
      const k = q.ty * w + q.tx;
      const n = meadowN.get(k) ?? 0;
      if (n >= VORWALD_MAX) continue;
      meadowN.set(k, n + 1);
    }
    put(q);
  }
  // Mindestens MIN_CROWNS lebende Kronen je freier Waldkachel (kleine Jungbäume, wenn der Saum hier zurückweicht)
  const count = new Map<number, number>();
  for (const q of accepted)
    if (q.forest && !q.c.dead) count.set(q.ty * w + q.tx, (count.get(q.ty * w + q.tx) ?? 0) + 1);
  for (const [k, list] of byTile) {
    if (free[k] !== 1) continue;
    let n = count.get(k) ?? 0;
    if (n >= MIN_CROWNS) continue;
    const order = [...list].sort((a, b) => b.p - a.p);
    for (const relax of [SPACING_MIN, 0]) {
      for (const q of order) {
        if (n >= MIN_CROWNS) break;
        if (accepted.includes(q) || q.c.dead) continue;
        const c = q.c;
        c.r = Math.min(c.r, 0.16);
        c.young = true;
        c.r = Math.min(c.r, maxRadius(c));
        if (relax > 0 && conflicts(q, relax)) continue;
        put(q);
        n++;
      }
    }
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
      giant = { fx: x + 0.5, fy: y + 0.5, tx: x, ty: y, p: 2, c, forest: true };
    }
  }
  let all = accepted;
  if (giant) {
    // die Kronen vor dem Riesen und dicht um ihn entfallen (er steht frei im Dach)
    const g = giant;
    all = accepted.filter(
      (q) =>
        !(q.tx === g.tx && q.ty === g.ty && q.fx + q.fy > g.fx + g.fy) &&
        (q.fx - g.fx) ** 2 + (q.fy - g.fy) ** 2 >= 0.3 ** 2,
    );
    all.push(g);
  }

  // Fussscheibe nie über gesperrte Kacheln; Eng (Nachbar eines Objekts): ganz in der eigenen Kachel. Höhe aus der Form.
  const cells = new Map<string, WoodCell>();
  for (const q of all) {
    const c = q.c;
    const k = q.ty * w + q.tx;
    let u = q.fx - q.tx,
      v = q.fy - q.ty;
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
    const fx = q.tx + u,
      fy = q.ty + v;
    if (c.dead) c.h = 0;
    else {
      const hh = crownGeom(c).hh;
      c.h = c.giant
        ? Math.min((c.kind === 1 ? 1.05 : 1.7) * hh, GIANT_SCALE * TREE_H - hh)
        : heightFactor(c) * hh;
    }
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
