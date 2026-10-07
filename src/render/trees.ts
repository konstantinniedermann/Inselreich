import { hash2 } from '../sim/noise';
import { worldToScreen, type Camera } from './camera';
import {
  ISO_H,
  ISO_W,
  TREE_VARIANTS,
  ZOOM_STEPS,
  project,
  zoomStep,
  type Box,
  type Pt,
  type SortedItem,
} from './iso';
import { accentIsMaple, forestType, variantParts, type ForestType } from './forest';
import { LIGHT } from './light';
import { PALETTE, mixHex, shadeSide, toLight } from './palette';

// trees.ts — Baumstempel (ISO §6, D-08, D-12; ART-STIL-02 L1 „Wald organisch"). Die Platzierung (Rolle, Art, Form,
// Versatz) kommt aus `forest.ts`; hier stehen Kronenform, Stempel, Cache, Schatten und Box. Salze 512 (Kronen, auch die
// Blue-Noise-Streuung des Kerns nach R298) und 513 (Kronenform aus dem Formwert `s`) nach der Vergabe im Kopf von
// groundDecor.ts; R298 braucht in trees.ts kein neues Salz.
export type TreeItem = Extract<SortedItem, { kind: 'tree' }>;
/** Baumart: 0 Laubbaum, 1 Nadelbaum, 2 Birke (hell), 3 Pinie (schirmförmig), 4 Ahorn (gedecktes Rostrot). */
export type CrownKind = 0 | 1 | 2 | 3 | 4;
/**
 * Eine Krone: Art, Lage in Kachel-Anteilen (die Mitte des Fusspunkts), Fussradius `r` in Kacheln (Breite der Krone =
 * r × ISO_W), Höhe des Kronenmittelpunkts über dem Boden in Weltpixeln, Busch-Flag und Formwert `s` (0…1).
 */
export interface Crown {
  kind: CrownKind;
  cx: number;
  cy: number;
  r: number;
  h: number;
  bush: boolean;
  s: number;
  /** Jungbaum (Rand, Eng): breiter als hoch, tief ansetzende Krone (kein „Lutscher“). */
  young?: boolean;
}

/** Stempelhöhe über der Rautenmitte (Weltpixel). */
export const TREE_H = 1.1 * ISO_H;
/** Stempelbreite (Kronen dürfen bis 0,35 Kachel über die Kachel hinausragen) und Platz unter der Rautenmitte. */
export const STAMP_W = 1.75 * ISO_W;
export const STAMP_BELOW = 0.75 * ISO_H;
/** Der Riesenbaum (B3) ist 1,8-mal so hoch und gross. */
export const GIANT_SCALE = 1.8;
const OVERHANG = 0.35; // Kronenfuss ragt höchstens so weit über die eigene Kachel
const CROWN_RY = 0.85; // Kronenhöhe im Verhältnis zur Breite
/**
 * Kernkronen (R298): Anzahl, Fenster des Torus-Bilds (Anteile unter `CORE_WIN` rücken um eine Kachel nach vorn),
 * Mindestabstand auf dem Kacheltorus, Radius r0 + rs × Zufall; bis zu `CORE_TRIES` Streuungen, die erste mit
 * Deckung ≥ `CORE_COVER` der eigenen Raute gilt (sonst die beste). Hinten in der Kachel sitzt eine Kernkrone lieber
 * tiefer (Höhe ab `CORE_LOW` × Kronenhalbhöhe) als dass sie schrumpft; sonst wären hintere Kronen je Kachel kleiner
 * und das Dach zeigte Reihen im Kachelabstand.
 */
const CORE_MIN = 6,
  CORE_MAX = 7,
  CORE_WIN = 0.15,
  CORE_DMIN = 0.32,
  CORE_R0 = 0.18,
  CORE_RS = 0.15,
  CORE_COVER = 0.9,
  CORE_TRIES = 4,
  CORE_LOW = 0.6;
const TRUNK_COLOR = mixHex(PALETTE.rockDark, PALETTE.earth, 0.5);
/** Körper des Nadelbaums (R149). */
export const CONIFER_COLOR = mixHex(PALETTE.crown, PALETTE.rockDark, 0.35);
/** Körper des hellen Laubbaums (R149). */
export const LIGHT_CROWN_COLOR = mixHex(PALETTE.crown, PALETTE.grassLight, 0.45);
/** Stamm des hellen Laubbaums, heller als der Standardstamm (R149); Stamm der Birke (B4). */
export const LIGHT_TRUNK_COLOR = mixHex(PALETTE.wallLime, PALETTE.rockDark, 0.55);
/** Pinie (Waldtyp 3): warmes, trockenes Grün. */
export const PINE_COLOR = mixHex(PALETTE.crown, PALETTE.roofThatch, 0.28);
/** Ahorn (B5): gedecktes Rostrot aus Palettenmischungen, ΔE2000 ≥ 20 zu allen Signalfarben. */
export const MAPLE_COLOR = mixHex(PALETTE.roofTerracotta, PALETTE.crown, 0.38);
const BODY: readonly string[] = [
  PALETTE.crown,
  CONIFER_COLOR,
  LIGHT_CROWN_COLOR,
  PINE_COLOR,
  MAPLE_COLOR,
];
/** Körperfarbe je Baumart. */
export const crownBase = (kind: CrownKind): string => BODY[kind]!;
const SHADOW_SHIFT = 0.19; // Kachelraum, Richtung (+3, +1) normiert (D-11)
const SHADOW_A = 0.5,
  SHADOW_B = 0.3;
const DIR = { x: -LIGHT.x, y: -LIGHT.y }; // vom Licht weg (Kachelraum)
/** Richtung zum Licht im Bild (Einheitsvektor, aus `LIGHT` projiziert; links oben). */
const LIGHT_PX = (() => {
  const p = project(LIGHT.x, LIGHT.y);
  const n = Math.hypot(p.x, p.y);
  return { x: p.x / n, y: p.y / n };
})();
/** Kappenversatz in Kronenradien (Richtung Licht) und Anteil des Schattenmonds. */
const CAP_SHIFT = 0.4,
  MOON_SHIFT = 0.14,
  MOON_SHRINK = 0.9;
/** Kronentöne (S2): kühler Schatten, Mitte, warme Kappe. */
export const crownShade = (base: string): string => shadeSide(base, 0.3);
export const crownCap = (base: string): string =>
  toLight(mixHex(base, PALETTE.grassLight, 0.3), 0.2);

// ---------------------------------------------------------------------------------------------------------------
// Kronenform: Lappen (Laub, Birke, Ahorn, Pinie, Busch) bzw. Etagen (Nadel), deterministisch aus dem Formwert `s`.

interface Lobe {
  x: number;
  y: number;
  rx: number;
  ry: number;
}
interface Tier {
  ax: number; // Spitze
  ay: number;
  hw: number; // halbe Basisbreite
  bx: number; // Basismitte
  by: number;
  th: number; // Etagenhöhe
}
/** Form einer Krone relativ zu ihrem Mittelpunkt; `hw`/`hh` sind die halben Masse der Hüllbox (Mitte = Mittelpunkt). */
export interface CrownGeom {
  lobes: Lobe[];
  tiers: Tier[];
  hw: number;
  hh: number;
}
const CONIFER_TOP = 1.6; // Spitze des Nadelbaums über dem Kronenmittelpunkt, in Kronenhöhen (ry)
const CONIFER_BOTTOM = 0.9;
const PINE_FLAT = 0.64; // Pinienschirm: Höhe im Verhältnis zur Breite
const BUSH_FLAT = 0.7;
const YOUNG_FLAT = 0.7;

/** Form einer Krone aus (Art, Radius, Formwert, Busch); eine reine Funktion, kein Seed nötig. */
export function crownGeom(c: Pick<Crown, 'kind' | 'r' | 's' | 'bush' | 'young'>): CrownGeom {
  const q = (i: number, j: number): number => hash2(513 + Math.floor(c.s * 65536), i, j);
  const rx0 = c.r * ISO_W;
  const lobes: Lobe[] = [];
  const tiers: Tier[] = [];
  if (c.kind === 1 && !c.bush) {
    const ry0 = rx0 * CROWN_RY;
    const n = 3 + (q(0, 0) > 0.5 ? 1 : 0);
    const span = (CONIFER_TOP + CONIFER_BOTTOM) * ry0;
    const th = span / (1 + 0.55 * (n - 1));
    for (let i = 0; i < n; i++) {
      const by = CONIFER_BOTTOM * ry0 - i * 0.55 * th;
      const hw = rx0 * (1 - 0.17 * i) * (0.74 + 0.22 * q(i, 5));
      const lean = (q(i, 6) - 0.5) * rx0 * (i === n - 1 ? 0.5 : 0.22); // leicht schiefe Spitze
      tiers.push({ ax: lean, ay: by - th, hw, bx: (q(i, 7) - 0.5) * 0.08 * hw, by, th });
    }
  } else {
    const flat = c.kind === 3 ? PINE_FLAT : c.bush ? BUSH_FLAT : c.young ? YOUNG_FLAT : CROWN_RY;
    const ry0 = rx0 * flat;
    if (c.kind === 3) {
      // Schirm aus 3–5 überlappenden Lappen (Dach), die Lappen sitzen leicht versetzt nebeneinander
      const n = 3 + Math.floor(q(0, 1) * 3);
      for (let i = 0; i < n; i++) {
        const x = ((i / (n - 1)) * 2 - 1) * 0.4 * rx0;
        const rr = 0.5 + 0.07 * q(i, 4);
        lobes.push({
          x,
          y: (q(i, 3) - 0.5) * 0.5 * ry0 + (i % 2 === 0 ? 0.08 : -0.08) * ry0,
          rx: rr * rx0,
          ry: rr * ry0,
        });
      }
    } else {
      const n = c.bush ? 3 : 3 + Math.floor(q(0, 1) * 4); // 3–6 Lappen
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + q(i, 2) * 0.9;
        const d = 0.28 + 0.1 * q(i, 3);
        const rr = 0.52 + 0.1 * q(i, 4);
        lobes.push({
          x: Math.cos(a) * d * rx0,
          y: Math.sin(a) * d * ry0,
          rx: rr * rx0,
          ry: rr * ry0,
        });
      }
    }
  }
  // Hüllbox bestimmen und die Form so verschieben, dass ihre Mitte im Mittelpunkt der Krone liegt
  let x0 = Infinity,
    x1 = -Infinity,
    y0 = Infinity,
    y1 = -Infinity;
  for (const l of lobes) {
    x0 = Math.min(x0, l.x - l.rx);
    x1 = Math.max(x1, l.x + l.rx);
    y0 = Math.min(y0, l.y - l.ry);
    y1 = Math.max(y1, l.y + l.ry);
  }
  for (const t of tiers) {
    x0 = Math.min(x0, t.bx - t.hw, t.ax);
    x1 = Math.max(x1, t.bx + t.hw, t.ax);
    y0 = Math.min(y0, t.ay);
    y1 = Math.max(y1, t.by);
  }
  const mx = (x0 + x1) / 2,
    my = (y0 + y1) / 2;
  for (const l of lobes) {
    l.x -= mx;
    l.y -= my;
  }
  for (const t of tiers) {
    t.ax -= mx;
    t.bx -= mx;
    t.ay -= my;
    t.by -= my;
  }
  return { lobes, tiers, hw: (x1 - x0) / 2, hh: (y1 - y0) / 2 };
}

const geomOf = new WeakMap<Crown, CrownGeom>();
/** `crownGeom` je Kronenobjekt einmal (die Kronen einer Variante sind gecacht); je Frame kein Neuberechnen. */
function geomFor(c: Crown): CrownGeom {
  let g = geomOf.get(c);
  if (!g) geomOf.set(c, (g = crownGeom(c)));
  return g;
}

/** Mittelpunkt und halbe Masse einer Krone im Stempelraum (Pixel, Ursprung = Rautenmitte; y nach unten). */
export function crownScreen(c: Crown): { x: number; y: number; rx: number; ry: number } {
  const g = geomFor(c);
  return {
    x: (c.cx - c.cy) * (ISO_W / 2),
    y: ((c.cx + c.cy - 1) * ISO_H) / 2 - c.h,
    rx: g.hw,
    ry: g.hh,
  };
}

// ---------------------------------------------------------------------------------------------------------------
// Kronen je Variante

/** Baumart je Art-Slot und Waldtyp (Spec 3.7); `null` im Mischwald steht für den Akzent (Birke oder Ahorn). */
const SLOT_KINDS: readonly (readonly (CrownKind | null)[])[] = [
  [0, 1, null], // Mischwald
  [1, 0, 2], // Nadelwald
  [2, 0, 1], // Birken- und Hellholzwald
  [3, 1, 0], // Pinienwald
];
/** Baumart eines Slots (Waldtyp aus dem Seed, Akzent im Mischwald je Seed Birke oder Ahorn). */
export function slotKind(seed: number, slot: number): CrownKind {
  const k = SLOT_KINDS[forestType(seed) as ForestType]![slot]!;
  return k ?? (accentIsMaple(seed) ? 4 : 2);
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);

/** Anteil der eigenen Raute (Bildraum, 12 × 12 Proben), den die Kronen decken; nur beim Aufbau einer Variante. */
function ownCover(crowns: readonly Crown[]): number {
  const cs = crowns.map((c) => ({ s: crownScreen(c), g: geomFor(c) }));
  let hit = 0;
  for (let i = 0; i < 12; i++)
    for (let j = 0; j < 12; j++) {
      const u = (i + 0.5) / 12,
        v = (j + 0.5) / 12;
      const px = (u - v) * (ISO_W / 2),
        py = ((u + v - 1) * ISO_H) / 2;
      const on = cs.some(({ s, g }) => {
        const dx = px - s.x,
          dy = py - s.y;
        if (g.tiers.length > 0)
          return g.tiers.some((t) => {
            const yy = dy - t.ay,
              th = t.by - t.ay;
            if (yy < 0 || yy > th) return false;
            const k = yy / th;
            return Math.abs(dx - (t.ax + (t.bx - t.ax) * k)) <= t.hw * k;
          });
        return g.lobes.some((l) => ((dx - l.x) / l.rx) ** 2 + ((dy - l.y) / l.ry) ** 2 <= 1);
      });
      if (on) hit++;
    }
  return hit / 144;
}

const crownCache = new Map<string, Crown[]>();
const CROWN_CACHE_MAX = 256;

/**
 * Kronen einer Variante (Rolle, Art-Slot und Form aus `variantParts`), deterministisch aus `hash2`. Alle Kronen
 * liegen mit ihrem Fusspunkt (Mitte ± Radius) höchstens 0,35 Kachel über der eigenen Kachel; auf Eng-Kacheln innerhalb.
 * Mit `giant` kommt der Riesenbaum (B3, Krone ×1,8) dazu; die Kronen vor ihm entfallen.
 */
export function crownsFor(seed: number, variant: number, giant = false): Crown[] {
  const key = `${seed}|${variant}|${giant ? 1 : 0}`;
  const hit = crownCache.get(key);
  if (hit) return hit;
  const { slot, role, form } = variantParts(variant);
  const base = slotKind(seed, slot);
  const alt = slotKind(seed, (slot + 1) % 3);
  const rnd = (k: number, j: number): number => hash2(seed + 512, variant * 32 + k, j);
  const out: Crown[] = [];
  const limitTop = TREE_H;
  /** Passt eine Krone unter die Höhenobergrenze: Radius schrumpft, bis Krone und Stamm hineinpassen. */
  const add = (
    kind: CrownKind,
    bush: boolean,
    r0: number,
    px: number,
    py: number,
    hf: number,
    s: number,
    top: number,
    young = false,
  ): void => {
    // Pinienschirme sind breiter, Nadelbäume im Kern ebenfalls (dichtes Dach, kaum Boden dazwischen)
    let r =
      r0 *
      (kind === 3 && !bush
        ? role === 0
          ? 1.55
          : 1.45
        : kind === 1 && role === 0 && !bush
          ? 1.35
          : 1);
    r = Math.min(r, OVERHANG);
    for (let i = 0; i < 8; i++, r *= 0.88) {
      const cx =
        role === 2 && !bush ? clamp(px, r, 1 - r) : clamp(px, r - OVERHANG, 1 + OVERHANG - r);
      const cy =
        role === 2 && !bush ? clamp(py, r, 1 - r) : clamp(py, r - OVERHANG, 1 + OVERHANG - r);
      const g = crownGeom({ kind, r, s, bush, young });
      const ground = ((cx + cy - 1) * ISO_H) / 2;
      const hCap = top - 0.5 - g.hh + ground;
      if (hCap < (bush ? 0.45 : role === 0 ? CORE_LOW : 0.95) * g.hh) continue;
      out.push({ kind, cx, cy, r, h: Math.min(hf * g.hh, hCap), bush, s, young });
      return;
    }
  };
  const spread = (
    n: number,
    k0: number,
    dMin: number,
    lo: number,
    hi: number,
    wrap = false,
  ): [number, number][] => {
    // Abstand auf dem Torus (Periode hi − lo): keine Häufung am Rand des Bereichs, die Nachbarkacheln schliessen an
    const per = hi - lo;
    const dist = (p: [number, number], q: [number, number]): number => {
      let dx = Math.abs(p[0] - q[0]),
        dy = Math.abs(p[1] - q[1]);
      if (wrap) {
        dx = Math.min(dx, per - dx);
        dy = Math.min(dy, per - dy);
      }
      return Math.hypot(dx, dy);
    };
    const pts: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      let best: [number, number] = [0, 0],
        bd = -1;
      for (let a = 0; a < 10; a++) {
        const p: [number, number] = [
          lo + (hi - lo) * rnd(k0 + i, 40 + a * 2),
          lo + (hi - lo) * rnd(k0 + i, 41 + a * 2),
        ];
        const d = pts.reduce((m, q) => Math.min(m, dist(p, q)), 9);
        if (d > bd) {
          bd = d;
          best = p;
        }
        if (d >= dMin) break;
      }
      pts.push(best);
    }
    return pts;
  };
  const jit = (i: number, k: number, d: number): number => (rnd(i, k) - 0.5) * 2 * d;
  const kindFor = (i: number): CrownKind => (role !== 2 && rnd(i, 1) < 0.12 ? alt : base);
  const hfFor = (kind: CrownKind, lo: number, hi: number, i: number): number =>
    kind === 3 ? (role === 0 ? 0.7 : 1.1) + 0.2 * rnd(i, 3) : lo + (hi - lo) * rnd(i, 3); // Pinie: kurzer Stamm
  if (role === 0) {
    // Kern (R298): Blue-Noise-Streuung auf dem Kacheltorus statt fester Anker, damit die Kronen aller Kernkacheln kein
    // gemeinsames Unterraster bilden (Kugelraster, Baumreihen). Über die Kachelgrenze greifen die Kronen mit Radius
    // und Kern-Versatz (±0,2, forest.ts); Anzahl und Grösse streuen.
    const win = (v: number): number => (v < CORE_WIN ? v + 1 : v);
    let best: Crown[] = [],
      bestCover = -1;
    for (let t = 0; t < CORE_TRIES && bestCover < CORE_COVER; t++) {
      out.length = 0;
      const k0 = t * 50;
      const n = CORE_MIN + Math.floor(rnd(30 + t, 0) * (CORE_MAX - CORE_MIN + 1));
      spread(n, k0, CORE_DMIN, 0, 1, true).forEach(([qx, qy], j) => {
        const i = k0 + j;
        const kind = kindFor(i);
        add(
          kind,
          false,
          CORE_R0 + CORE_RS * rnd(i, 2),
          win(qx),
          win(qy),
          hfFor(kind, 0.8, 0.95, i),
          rnd(i, 4),
          limitTop,
        );
      });
      const cover = ownCover(out);
      if (cover > bestCover) {
        bestCover = cover;
        best = [...out];
      }
    }
    out.length = 0;
    out.push(...best);
  } else if (role === 1) {
    // Saum (B1): 1–2 Kronen in Kerngrösse zur Kachelmitte, davor Jungbäume (buschig, tief ansetzend) und Büsche
    const nBig = 2;
    for (let i = 0; i < nBig; i++) {
      const kind = kindFor(i);
      add(
        kind,
        false,
        0.22 + 0.07 * rnd(i, 2),
        (i === 0 ? 0.36 : 0.66) + jit(i, 40, 0.1),
        (i === 0 ? 0.62 : 0.38) + jit(i, 41, 0.1),
        hfFor(kind, 0.8, 0.95, i),
        rnd(i, 4),
        limitTop,
      );
    }
    const yAnchors: [number, number][] = [
      [0.2, 0.25],
      [0.82, 0.22],
      [0.3, 0.9],
      [0.9, 0.86],
    ];
    const young = yAnchors.map(([ax, ay], i): [number, number] => [
      clamp(ax + jit(4 + i, 40, 0.1), 0.05, 0.95),
      clamp(ay + jit(4 + i, 41, 0.1), 0.05, 0.95),
    ]);
    young.forEach(([px, py], i) => {
      const kind = kindFor(4 + i);
      add(
        kind,
        false,
        0.15 + 0.05 * rnd(4 + i, 2),
        px,
        py,
        hfFor(kind, 0.95, 1.25, 4 + i),
        rnd(4 + i, 4),
        limitTop,
        true,
      );
    });
    const nb = 2 + (form % 2);
    for (let i = 0; i < nb; i++) {
      const [tx, ty] = young[i % young.length]!;
      add(
        0,
        true,
        0.055 + 0.025 * rnd(10 + i, 2),
        tx + jit(10 + i, 40, 0.1),
        ty + 0.07 + 0.05 * rnd(10 + i, 41),
        0.55,
        rnd(10 + i, 4),
        limitTop,
      );
    }
  } else {
    // Eng: Kronen innerhalb der eigenen Kachel, buschig
    spread(4 + (form % 2), 0, 0.26, 0, 1).forEach(([px, py], i) => {
      const kind = kindFor(i);
      add(
        kind,
        false,
        0.1 + 0.05 * rnd(i, 2),
        px,
        py,
        hfFor(kind, 1.2, 1.8, i),
        rnd(i, 4),
        limitTop,
        true,
      );
    });
  }
  if (giant) {
    const behind = out.filter((c) => c.cx + c.cy <= 1);
    out.length = 0;
    out.push(...behind);
    add(base, false, 0.17 * GIANT_SCALE, 0.5, 0.5, 1.7, rnd(20, 4), GIANT_SCALE * TREE_H);
  }
  if (crownCache.size >= CROWN_CACHE_MAX) crownCache.clear();
  crownCache.set(key, out);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Box, Schatten

const itemOffset = (item: TreeItem): Pt => project(item.ox ?? 0, item.oy ?? 0);

/** Halbe Breite und Platz unter der Rautenmitte der Bildbox je Rolle (Kern, Rand, Eng); Eng bleibt in der Kachel. */
const BOX_HALF = [56, 46, ISO_W / 2] as const;
const BOX_BELOW = [STAMP_BELOW, 22, ISO_H / 2] as const;

/**
 * Bildbox des Stempels: Kachelmitte plus Versatz; die Breite hängt von der Rolle ab (Eng wie früher eine Kachel,
 * Rand und Kern mit Überhang). Der Riesenbaum ragt 1,8-mal so hoch.
 */
export function treeBounds(item: TreeItem): Box {
  const c = project(item.fp.x + 0.5, item.fp.y + 0.5);
  const o = itemOffset(item);
  const role = variantParts(item.variant % TREE_VARIANTS).role;
  const up = item.giant ? GIANT_SCALE * TREE_H : TREE_H;
  return {
    x: c.x + o.x - BOX_HALF[role],
    y: c.y + o.y - up,
    w: 2 * BOX_HALF[role],
    h: up + BOX_BELOW[role],
  };
}

/**
 * Schattenpolygon im Kachelraum (Ellipse unter der Kronenmasse, nach rechts unten (+3, +1) versetzt, mit Stempelversatz).
 * Er ist kleiner als die Kronendecke, damit er zwischen den Kronen nicht als eigene Fläche erscheint.
 */
export function treeShadow(item: TreeItem): Pt[] {
  const role = variantParts(item.variant % TREE_VARIANTS).role;
  const unit = SHADOW_UNITS[item.giant ? 2 : role === 0 ? 0 : 1]!;
  const mx = item.fp.x + 0.5 + (item.ox ?? 0) + DIR.x * SHADOW_SHIFT,
    my = item.fp.y + 0.5 + (item.oy ?? 0) + DIR.y * SHADOW_SHIFT;
  return unit.map((u) => ({ x: mx + u.x, y: my + u.y }));
}

/** Schattenform je Grösse (Kern, Rand/Eng, Riese) als feste Versätze im Kachelraum; je Frame nur noch verschieben. */
const SHADOW_UNITS: readonly (readonly Pt[])[] = [0.55, 0.5, 1.1].map((k) =>
  Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const u = Math.cos(a) * SHADOW_A * k,
      v = Math.sin(a) * SHADOW_B * k;
    return { x: DIR.x * u - DIR.y * v, y: DIR.y * u + DIR.x * v };
  }),
);

// ---------------------------------------------------------------------------------------------------------------
// Zeichnen

const ellipse = (
  ctx: CanvasRenderingContext2D,
  fill: string,
  x: number,
  y: number,
  rx: number,
  ry: number,
): void => {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
};

/**
 * Zeichnet eine Krone (ohne Stamm) um ihren Mittelpunkt (x, y) im Stempelraum in drei Tonstufen:
 * Laub-artige Kronen als Klumpen aus Lappen (Schattenmond, Mitte, Kappe zum Licht), der Nadelbaum als Etagen.
 */
export function paintCrown(ctx: CanvasRenderingContext2D, c: Crown, x: number, y: number): void {
  const g = geomFor(c);
  const base = crownBase(c.kind);
  if (g.tiers.length > 0) {
    const sd = LIGHT_PX.x > 0 ? -1 : 1; // Seite des Schattens im Bild
    for (const t of g.tiers) {
      const ax = x + t.ax,
        ay = y + t.ay,
        bx = x + t.bx,
        by = y + t.by;
      ctx.fillStyle = base;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx + t.hw, by);
      ctx.lineTo(bx - t.hw, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = crownShade(base);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx + sd * t.hw, by);
      ctx.lineTo(bx, by);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = crownCap(base);
      ctx.beginPath();
      ctx.moveTo(ax - sd * 0.05 * t.hw, ay + 0.08 * t.th);
      ctx.lineTo(ax - sd * 0.05 * t.hw, ay + 0.74 * t.th);
      ctx.lineTo(ax - sd * 0.72 * t.hw, ay + 0.74 * t.th);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }
  const lobes = [...g.lobes].sort((a, b) => a.y - b.y); // hinten zuerst
  // Schattenmond: alle Lappen im kühlen Ton (die gezackte Silhouette)
  for (const l of lobes) ellipse(ctx, crownShade(base), x + l.x, y + l.y, l.rx, l.ry);
  // Mitte: Lappen zum Licht versetzt und etwas kleiner (Pinie: nach oben, die Unterseite bleibt dunkel)
  const pine = c.kind === 3;
  for (const l of lobes)
    ellipse(
      ctx,
      base,
      x + l.x + LIGHT_PX.x * MOON_SHIFT * l.rx,
      y + l.y + (pine ? -0.2 * l.ry : LIGHT_PX.y * MOON_SHIFT * l.ry),
      (pine ? 0.94 : MOON_SHRINK) * l.rx,
      (pine ? 0.8 : MOON_SHRINK) * l.ry,
    );
  // Kappe: die am stärksten zum Licht liegenden Lappen (bei Büschen einer, beim Schirm oben)
  const lit = [...lobes]
    .sort((a, b) => b.x * LIGHT_PX.x + b.y * LIGHT_PX.y - (a.x * LIGHT_PX.x + a.y * LIGHT_PX.y))
    .slice(0, c.bush ? 1 : pine ? 3 : 2);
  for (const l of lit)
    ellipse(
      ctx,
      crownCap(base),
      x + l.x + LIGHT_PX.x * (MOON_SHIFT + CAP_SHIFT) * l.rx,
      y + l.y + (pine ? -0.5 * l.ry : LIGHT_PX.y * (MOON_SHIFT + CAP_SHIFT) * l.ry),
      0.55 * l.rx,
      (pine ? 0.4 : 0.5) * l.ry,
    );
}

/** Zeichnet den Stamm einer Krone: vom Boden (x, ground) bis zum Kronenmittelpunkt. */
function paintTrunk(
  ctx: CanvasRenderingContext2D,
  c: Crown,
  x: number,
  ground: number,
  giant: boolean,
): void {
  if (c.bush) return;
  const w = (c.kind === 2 ? 2.2 : 2.6) * (giant ? 2 : 1) + (c.r > 0.2 ? 0.8 : 0);
  ctx.fillStyle = c.kind === 2 ? LIGHT_TRUNK_COLOR : TRUNK_COLOR;
  ctx.beginPath();
  if (c.kind === 3) {
    // Pinie: leicht geneigter Stamm
    const lean = (c.s - 0.5) * 4;
    ctx.moveTo(x - w / 2, ground);
    ctx.lineTo(x + w / 2, ground);
    ctx.lineTo(x + w / 2 + lean, ground - c.h);
    ctx.lineTo(x - w / 2 + lean, ground - c.h);
    ctx.closePath();
  } else ctx.rect(x - w / 2, ground - c.h, w, c.h);
  ctx.fill();
}

/** Zeichnet den Stempel einer Variante in Stempelpixeln (Faktor `step`); Ursprung = Rautenmitte, `TREE_H` darüber. */
export function paintStamp(
  ctx: CanvasRenderingContext2D,
  seed: number,
  variant: number,
  step: number,
  giant = false,
): void {
  paintStampAt(ctx, seed, variant, step, giant, STAMP_W / 2, TREE_H);
}

/** Wie `paintStamp`, der Ursprung (Rautenmitte) liegt bei (ox, oy) Stempelpixeln (Zuschnitt auf die Inhaltsbox). */
function paintStampAt(
  ctx: CanvasRenderingContext2D,
  seed: number,
  variant: number,
  step: number,
  giant: boolean,
  ox: number,
  oy: number,
): void {
  const crowns = crownsFor(seed, variant, giant)
    .map((c) => ({
      c,
      x: (c.cx - c.cy) * (ISO_W / 2),
      y: ((c.cx + c.cy - 1) * ISO_H) / 2, // Bild-y des Fusspunkts relativ zur Rautenmitte
    }))
    .sort((a, b) => a.y - b.y); // hinten zuerst
  ctx.save();
  ctx.scale(step, step);
  ctx.translate(ox, oy);
  for (const { c, x, y } of crowns) {
    const isGiant = giant && c.r > 0.17 * GIANT_SCALE - 1e-9;
    paintTrunk(ctx, c, x, y, isGiant);
    paintCrown(ctx, c, x, y - c.h);
  }
  ctx.restore();
}

let makeCanvas: () => HTMLCanvasElement = () => document.createElement('canvas');
/** Fabrik für das Offscreen-Canvas; im Node-Test ein Fake. */
export function setCanvasFactory(fn: () => HTMLCanvasElement): void {
  makeCanvas = fn;
}

/** Inhaltsbox eines Stempels in Stempelpixeln relativ zur Rautenmitte (ganze Pixel, 1 px Rand). */
export interface StampBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
const boxCache = new Map<string, StampBox>();
/**
 * Hüllbox aller Kronen und Stämme einer Variante (aus der Kronengeometrie); gibt Breite, Höhe und Ursprung des
 * Stempel-Canvas vor, so dass kein leerer Rand gefüllt wird. Je (Seed, Variante) einmal berechnet.
 */
export function stampBox(seed: number, variant: number): StampBox {
  const key = `${seed}|${variant}`;
  const hit = boxCache.get(key);
  if (hit) return hit;
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const c of crownsFor(seed, variant)) {
    const s = crownScreen(c);
    const ground = ((c.cx + c.cy - 1) * ISO_H) / 2;
    x0 = Math.min(x0, s.x - s.rx);
    x1 = Math.max(x1, s.x + s.rx);
    y0 = Math.min(y0, s.y - s.ry);
    y1 = Math.max(y1, s.y + s.ry, ground);
    if (!c.bush) {
      const half =
        ((c.kind === 2 ? 2.2 : 2.6) + (c.r > 0.2 ? 0.8 : 0)) / 2 + (c.kind === 3 ? 2 : 0);
      x0 = Math.min(x0, s.x - half);
      x1 = Math.max(x1, s.x + half);
    }
  }
  const box = {
    x0: Math.floor(x0) - 1,
    y0: Math.floor(y0) - 1,
    x1: Math.ceil(x1) + 1,
    y1: Math.ceil(y1) + 1,
  };
  if (boxCache.size >= 256) boxCache.clear();
  boxCache.set(key, box);
  return box;
}

/** Cache je Welt-Seed (neue Welt → neuer Cache); höchstens TREE_VARIANTS × ZOOM_STEPS.length Einträge. */
const cache = new Map<number, HTMLCanvasElement>();
let cacheSeed: number | null = null;
export const treeCacheSize = (): number => cache.size;
export function resetTreeCache(): void {
  cache.clear();
  boxCache.clear();
  cacheSeed = null;
}

function stampFor(seed: number, variant: number, step: number): HTMLCanvasElement | null {
  if (cacheSeed !== seed) {
    cache.clear();
    cacheSeed = seed;
  }
  const key = variant * ZOOM_STEPS.length + ZOOM_STEPS.indexOf(step as (typeof ZOOM_STEPS)[number]);
  const hit = cache.get(key);
  if (hit) return hit;
  const b = stampBox(seed, variant);
  const canvas = makeCanvas();
  canvas.width = Math.ceil((b.x1 - b.x0) * step);
  canvas.height = Math.ceil((b.y1 - b.y0) * step);
  const c = canvas.getContext('2d');
  if (!c) return null;
  paintStampAt(c, seed, variant, step, false, -b.x0, -b.y0);
  if (cache.size < TREE_VARIANTS * ZOOM_STEPS.length) cache.set(key, canvas);
  return canvas;
}

/**
 * Zeichnet den Stempel an der Kachelmitte plus Versatz; Zoom-Cache auf `ZOOM_STEPS`, Zielgrösse Faktor
 * `z / zoomStep(z)`. Nur der Riesenbaum (B3, höchstens einer je Karte) wird direkt gezeichnet, nie aus dem Cache.
 */
export function drawTreeStamp(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  item: TreeItem,
  seed: number,
): void {
  const z = cam.zoom,
    step = zoomStep(z);
  const variant = item.variant % TREE_VARIANTS;
  const p = worldToScreen(
    cam,
    project(item.fp.x + 0.5 + (item.ox ?? 0), item.fp.y + 0.5 + (item.oy ?? 0)),
  );
  if (item.giant) {
    ctx.save();
    ctx.translate(p.x - (STAMP_W / 2) * z, p.y - TREE_H * z);
    paintStamp(ctx, seed, variant, z, true);
    ctx.restore();
    return;
  }
  const stamp = stampFor(seed, variant, step);
  if (!stamp) return;
  const f = z / step;
  const b = stampBox(seed, variant);
  ctx.drawImage(stamp, p.x + b.x0 * z, p.y + b.y0 * z, stamp.width * f, stamp.height * f);
}
