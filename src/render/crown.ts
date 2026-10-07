import { hash2 } from '../sim/noise';
import { ISO_H, ISO_W } from './isoBase';

// crown.ts — Form einer Baumkrone (ISO §6, Spec 2.1.4), reine Geometrie ohne Canvas (WALD-02: aus trees.ts gelöst,
// damit die Platzierung in forest.ts sie ohne Import-Zyklus nutzen kann). Zeichnen, Atlas und Box stehen in trees.ts.
// WALD-02 Fix-Runde 1: Baumgruppen (`group`): ein Atlas-Eintrag aus 3–6 Bäumen, Lage und Grösse der Bäume aus der
// Gruppenform; Fichten mit 3–5 Etagen, schlank bis breit, ungleichen Etagenkanten, gebrochener oder lichter Spitze;
// Pinienschirme verschieden flach, geneigt und ungleich.

/** Baumart: 0 Laubbaum, 1 Nadelbaum, 2 Birke (hell), 3 Pinie (schirmförmig), 4 Ahorn (gedecktes Rostrot). */
export type CrownKind = 0 | 1 | 2 | 3 | 4;
/** Totholz (B3): 1 Baumstumpf, 2 toter, entasteter Stamm. */
export type DeadKind = 1 | 2;
/**
 * Eine Krone: Art, Fusspunkt (`cx`, `cy`) in Kacheln relativ zur Kachel des Wald-Objekts (darf ausserhalb von 0…1
 * liegen), Fussradius `r` in Kacheln (Breite der Krone = r × ISO_W), Höhe des Kronenmittelpunkts über dem Fuss in
 * Weltpixeln, Busch-Flag und Formwert `s` (0…1). Eine Gruppe (`group`) steht für mehrere Bäume: `r` ist dann der
 * Radius, in dem alle ihre Fussscheiben liegen.
 */
export interface Crown {
  kind: CrownKind;
  cx: number;
  cy: number;
  r: number;
  h: number;
  bush: boolean;
  s: number;
  /** Jungbaum (Saum, Vorwald, Eng): breiter als hoch, tief ansetzende Krone (kein „Lutscher"). */
  young?: boolean;
  /** Form gespiegelt (Geometrie, nicht Bild: das Licht kommt weiter von links oben). */
  mirror?: boolean;
  /** Tonklasse des Kronendachs (B2): −1 dunkler, 0, +1 heller; Bäume einer Gruppe streuen um ±½ Stufe. */
  tone?: number;
  /** Totholz statt Krone. */
  dead?: DeadKind;
  /** Krone wirft einen eigenen Schatten (Vorwald, Saum ausserhalb der Saumlinie); sonst liegt er im Boden. */
  cast?: boolean;
  /** Uralter Riesenbaum (B3), wird direkt gezeichnet. */
  giant?: boolean;
  /** Baumgruppe: Formindex 0 … GROUP_SHAPES − 1 (Bäume aus `groupMembers`). */
  group?: number;
}

/** Höchste Krone über ihrem Fuss (Weltpixel); nur der Riesenbaum ragt höher. */
export const TREE_H = 1.1 * ISO_H;
/** Der Riesenbaum (B3) ist 1,8-mal so hoch und gross. */
export const GIANT_SCALE = 1.8;
export const CROWN_RY = 0.85; // Kronenhöhe im Verhältnis zur Breite
const CONIFER_TOP = 1.6; // Spitze des Nadelbaums über dem Kronenmittelpunkt, in Kronenhöhen (ry)
const CONIFER_BOTTOM = 0.9;
const PINE_FLAT = 0.55; // Pinienschirm: Höhe im Verhältnis zur Breite, je Form + bis 0,4
const BUSH_FLAT = 0.7;
const YOUNG_FLAT = 0.7;
/** Formen je Art (die Hälfte gespiegelt): der Kronen-Atlas rastert `s` auf diese Stufen. */
export const SHAPES = 8;
/** Formstufe eines Formwerts. */
export const shapeIndex = (s: number): number => Math.min(SHAPES - 1, Math.floor(s * SHAPES));
/** Formwert einer Formstufe: Mitte der Stufe (der Atlas zeichnet genau diese Form). */
export const shapeValue = (i: number): number => (i + 0.5) / SHAPES;
/** Gruppenformen je Art. */
export const GROUP_SHAPES = 6;

export interface Lobe {
  x: number;
  y: number;
  rx: number;
  ry: number;
}
export interface Tier {
  ax: number; // Spitze
  ay: number;
  hw: number; // halbe Basisbreite (grössere Seite, für Hüllen)
  hl: number; // halbe Basisbreite links und rechts (ungleiche Etagenkanten)
  hr: number;
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
  /** Mitte der Hüllbox waagerecht gegen den Fuss (Weltpixel; nur Gruppen ≠ 0). */
  ox?: number;
}

/**
 * Form einer Krone aus (Art, Radius, Formwert, Busch, Jung, Spiegelung); eine reine Funktion, kein Seed nötig. Alle
 * Masse sind linear in `r`: eine Form bei Radius r ist die Form bei r₀, mit r / r₀ skaliert (Kronen-Atlas, trees.ts).
 * Gruppen: Vereinigung der Formen ihrer Bäume, Mittelpunkt = Mitte der Hüllbox (`ox` waagerecht gegen den Fuss).
 */
export function crownGeom(
  c: Pick<Crown, 'kind' | 'r' | 's' | 'bush' | 'young' | 'mirror' | 'group'>,
): CrownGeom {
  if (c.group !== undefined) return groupGeom(c);
  const q = (i: number, j: number): number => hash2(513 + Math.floor(c.s * 65536), i, j);
  const rx0 = c.r * ISO_W;
  const lobes: Lobe[] = [];
  const tiers: Tier[] = [];
  if (c.kind === 1 && !c.bush) {
    // Fichte: 3–5 Etagen, schlank bis breit (Breite : Höhe ≈ 1 : 1,7 … 1 : 3,8), ungleiche Etagenkanten, leicht schiefe
    // Spitze; einzelne Formen mit gebrochener oder lichter Spitze
    const ry0 = rx0 * CROWN_RY;
    const n = 3 + Math.floor(q(5, 21) * 3);
    const el = 1.35 + 0.6 * q(0, 10); // Streckung der Höhe
    const slim = 0.62 + 0.38 * q(0, 8);
    const odd = q(6, 23); // < 0,14 gebrochen, < 0,28 licht
    const gapF = odd >= 0.14 && odd < 0.28 ? 0.72 : 0.55;
    const span = (CONIFER_TOP + CONIFER_BOTTOM) * ry0 * el;
    const th = span / (1 + gapF * (n - 1));
    for (let i = 0; i < n; i++) {
      const top = i === n - 1;
      const by = CONIFER_BOTTOM * ry0 - i * gapF * th;
      let hw = rx0 * slim * (1 - 0.15 * i) * (0.72 + 0.26 * q(i, 5));
      let tth = th;
      if (top && odd < 0.14) {
        hw *= 0.55; // gebrochene Spitze: stumpf und schmal
        tth *= 0.55;
      } else if (odd >= 0.14 && odd < 0.28) hw *= 0.85;
      const lean = (q(i, 6) - 0.5) * rx0 * (top ? 0.6 : 0.24); // leicht schiefe Spitze
      const hl = hw * (1 + 0.24 * (q(i, 12) - 0.5)),
        hr = hw * (1 + 0.24 * (q(i, 13) - 0.5));
      tiers.push({
        ax: lean,
        ay: by - tth,
        hw: Math.max(hl, hr),
        hl,
        hr,
        bx: (q(i, 7) - 0.5) * 0.1 * hw,
        by,
        th: tth,
      });
    }
  } else {
    const flat =
      c.kind === 3
        ? PINE_FLAT + 0.4 * q(0, 9)
        : c.bush
          ? BUSH_FLAT
          : c.young
            ? YOUNG_FLAT
            : CROWN_RY;
    const ry0 = rx0 * flat;
    if (c.kind === 3) {
      // Schirm aus 3–5 überlappenden Lappen, ungleich breit, leicht geneigt (Neigung je Form) und asymmetrisch
      const n = 3 + Math.floor(q(0, 1) * 3);
      const tilt = (q(0, 14) - 0.5) * 0.5;
      const spread = 0.32 + 0.16 * q(0, 15);
      for (let i = 0; i < n; i++) {
        const x = ((i / (n - 1)) * 2 - 1) * spread * rx0 + (q(i, 16) - 0.5) * 0.12 * rx0;
        const rr = 0.44 + 0.16 * q(i, 4);
        lobes.push({
          x,
          y: (q(i, 3) - 0.5) * 0.45 * ry0 + (i % 2 === 0 ? 0.08 : -0.08) * ry0 + tilt * x * flat,
          rx: rr * rx0,
          ry: rr * ry0 * (0.85 + 0.3 * q(i, 17)),
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
  if (c.mirror) {
    for (const l of lobes) l.x = -l.x;
    for (const t of tiers) {
      t.ax = -t.ax;
      t.bx = -t.bx;
      [t.hl, t.hr] = [t.hr, t.hl];
    }
  }
  return center(lobes, tiers);
}

/** Hüllbox bestimmen und die Form so verschieben, dass ihre Mitte im Mittelpunkt liegt; `mx`/`my` = alte Mitte. */
function center(lobes: Lobe[], tiers: Tier[]): CrownGeom & { mx: number; my: number } {
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
    x0 = Math.min(x0, t.bx - t.hl, t.ax);
    x1 = Math.max(x1, t.bx + t.hr, t.ax);
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
  return { lobes, tiers, hw: (x1 - x0) / 2, hh: (y1 - y0) / 2, mx, my };
}

/**
 * Stammhöhe je Formklasse (Kronenmittelpunkt über dem Fuss in Kronen-Halbhöhen): eine feste Zahl je Art, Flag und
 * Formstufe, damit eine Atlas-Kachel (Krone plus Stamm) für alle Radien gilt. Nadel tief angesetzt (Rock bis zum
 * Boden), Birke und Jungbaum mit sichtbarem Stamm, Busch am Boden, Pinie je Form in acht Höhen.
 */
export function heightFactor(c: Pick<Crown, 'kind' | 'bush' | 'young'> & { s?: number }): number {
  if (c.bush) return 0.55;
  if (c.young) return c.kind === 1 ? 0.95 : 1.15;
  if (c.kind === 3) return c.s === undefined ? PINE_HF_MAX : PINE_HF[shapeIndex(c.s)]!;
  return [0.95, 0.72, 1.2, 0.85, 0.95][c.kind]!;
}
const PINE_HF = [0.8, 1.32, 0.98, 1.55, 1.12, 0.88, 1.42, 1.22] as const;
const PINE_HF_MAX = Math.max(...PINE_HF);

/** Höhe des Kronenmittelpunkts über dem Fuss (Weltpixel) aus der Form; Gruppen: Mitte ihrer Hüllbox. */
export function crownHeight(
  c: Pick<Crown, 'kind' | 'r' | 's' | 'bush' | 'young' | 'mirror' | 'group'>,
): number {
  if (c.group !== undefined) return groupLayout(c).h;
  return heightFactor(c) * crownGeom(c).hh;
}

/** Halbhöhe der Krone je Kachel Radius (`hh / r`) für einen Formwert, ohne Formwert höchstens über alle Formen. */
const hhUnitCache = new Map<string, number>();
export function hhPerRadius(c: Pick<Crown, 'kind' | 'bush' | 'young'> & { s?: number }): number {
  const key = `${c.kind}|${c.bush ? 1 : 0}|${c.young ? 1 : 0}|${c.s === undefined ? '-' : shapeIndex(c.s)}`;
  let v = hhUnitCache.get(key);
  if (v === undefined) {
    v = 0;
    if (c.s !== undefined) v = crownGeom({ ...c, r: 1, s: shapeValue(shapeIndex(c.s)) }).hh;
    else
      for (let i = 0; i < SHAPES; i++)
        v = Math.max(v, crownGeom({ ...c, r: 1, s: shapeValue(i) }).hh);
    hhUnitCache.set(key, v);
  }
  return v;
}

const groupMaxR = new Map<string, number>();
/** Grösster Radius, bei dem Krone samt Stamm unter `top` Weltpixeln über ihrem Fuss bleibt (Gruppe: jeder Baum). */
export function maxRadius(
  c: Pick<Crown, 'kind' | 'bush' | 'young'> & { s?: number; group?: number; mirror?: boolean },
  top = TREE_H,
): number {
  if (c.group !== undefined) {
    const key = `${c.kind}|${c.group}|${c.mirror ? 1 : 0}|${top}`;
    const hit = groupMaxR.get(key);
    if (hit !== undefined) return hit;
    let worst = 0;
    for (const m of groupMembers({
      kind: c.kind,
      r: 1,
      s: c.s ?? 0.5,
      bush: false,
      group: c.group,
      mirror: c.mirror,
    }))
      worst = Math.max(worst, ((heightFactor(m) + 1) * hhPerRadius(m) * m.r) / 1);
    groupMaxR.set(key, top / worst);
    return top / worst;
  }
  return top / ((heightFactor(c) + 1) * hhPerRadius(c));
}

// ---------------------------------------------------------------------------------------------------------------
// Baumgruppen

/**
 * Bäume einer Gruppe: Fusspunkte (`cx`, `cy`) relativ zum Gruppenfuss in Kacheln, alle Fussscheiben im Radius `r` der
 * Gruppe, Grösse, Form, Spiegelung und Ton (±½ Stufe um den Ton der Gruppe) je Baum aus der Gruppenform; nach Tiefe
 * sortiert (hinten zuerst). Fichten 4–5 Bäume, Laub 3–4 (Pinien stehen einzeln). Seed-frei (Atlas über alle Inseln).
 */
const membersCache = new Map<string, Crown[]>();
export function groupMembers(
  c: Pick<Crown, 'kind' | 'r' | 's' | 'bush' | 'group' | 'mirror' | 'tone'>,
): Crown[] {
  const key = `${c.kind}|${c.group}|${c.mirror ? 1 : 0}|${c.tone ?? 0}|${c.r}`;
  const hit = membersCache.get(key);
  if (hit) return hit;
  const out = buildMembers(c);
  if (membersCache.size > 8192) membersCache.clear();
  membersCache.set(key, out);
  return out;
}
function buildMembers(
  c: Pick<Crown, 'kind' | 'r' | 's' | 'bush' | 'group' | 'mirror' | 'tone'>,
): Crown[] {
  const g = c.group ?? 0;
  const q = (i: number, j: number): number => hash2(619 + g * 97 + c.kind * 13, i, j);
  const n = c.kind === 1 ? 4 + Math.floor(q(0, 0) * 2) : 3 + Math.floor(q(0, 0) * 2);
  const rMem = c.kind === 1 ? 0.4 : 0.48; // Baumradius je Gruppenradius
  const out: Crown[] = [];
  const pts: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const ri = rMem * (0.55 + 0.65 * q(i, 1)) * (i === 0 ? 1.15 : 1);
    const lim = 1 - ri; // Fussscheibe im Gruppenradius
    let best: [number, number] = [0, 0],
      bd = -1;
    for (let a = 0; a < 12; a++) {
      const ang = q(i, 10 + a) * Math.PI * 2,
        rad = Math.sqrt(q(i, 30 + a)) * lim;
      const p: [number, number] = [Math.cos(ang) * rad, Math.sin(ang) * rad];
      const d = pts.reduce(
        (m, o) => Math.min(m, Math.hypot(p[0] - o[0], p[1] - o[1]) - 0.8 * (ri + o[2])),
        9,
      );
      if (d > bd) {
        bd = d;
        best = p;
      }
      if (d >= 0) break;
    }
    pts.push([best[0], best[1], ri]);
    const mx = c.mirror ? -1 : 1;
    out.push({
      kind: c.kind,
      cx: ((best[0] * mx + best[1]) / Math.SQRT2) * c.r, // Spiegelung an der Bildsenkrechten: x ↔ y
      cy: ((-best[0] * mx + best[1]) / Math.SQRT2) * c.r,
      r: ri * c.r,
      h: 0,
      bush: false,
      s: shapeValue(Math.floor(q(i, 2) * SHAPES)),
      mirror: q(i, 3) < 0.5,
      tone: (c.tone ?? 0) + (q(i, 4) - 0.5),
    });
  }
  for (const m of out) m.h = heightFactor(m) * crownGeom(m).hh;
  out.sort((a, b) => a.cx + a.cy - (b.cx + b.cy) || a.cx - b.cx);
  return out;
}

/** Gruppe im Bild: Bäume, Mitte der Kronen-Hüllbox gegen den Fuss (`ox`, Höhe `h`), vereinigte Form um diese Mitte. */
interface GroupLayout {
  members: Crown[];
  /** Kronenmitte je Baum gegen die Gruppenmitte (Weltpixel). */
  at: { x: number; y: number }[];
  geom: CrownGeom;
  h: number;
}
const layoutCache = new Map<string, GroupLayout>();
function groupLayout(
  c: Pick<Crown, 'kind' | 'r' | 's' | 'bush' | 'group' | 'mirror' | 'tone'>,
): GroupLayout {
  const key = `${c.kind}|${c.group}|${c.mirror ? 1 : 0}|${c.tone ?? 0}|${c.r}`;
  let L = layoutCache.get(key);
  if (L) return L;
  const members = groupMembers(c);
  const lobes: Lobe[] = [],
    tiers: Tier[] = [];
  const centers = members.map((m) => ({
    x: (m.cx - m.cy) * (ISO_W / 2),
    y: (m.cx + m.cy) * (ISO_H / 2) - m.h,
  }));
  members.forEach((m, i) => {
    const g = crownGeom(m);
    const o = centers[i]!;
    for (const l of g.lobes) lobes.push({ ...l, x: l.x + o.x, y: l.y + o.y });
    for (const t of g.tiers)
      tiers.push({ ...t, ax: t.ax + o.x, bx: t.bx + o.x, ay: t.ay + o.y, by: t.by + o.y });
  });
  const g = center(lobes, tiers);
  L = {
    members,
    at: centers.map((o) => ({ x: o.x - g.mx, y: o.y - g.my })),
    geom: { lobes: g.lobes, tiers: g.tiers, hw: g.hw, hh: g.hh, ox: g.mx },
    h: -g.my,
  };
  if (layoutCache.size > 4096) layoutCache.clear();
  layoutCache.set(key, L);
  return L;
}
function groupGeom(c: Pick<Crown, 'kind' | 'r' | 's' | 'bush' | 'group' | 'mirror'>): CrownGeom {
  const g = groupLayout(c).geom;
  return {
    lobes: g.lobes.map((l) => ({ ...l })),
    tiers: g.tiers.map((t) => ({ ...t })),
    hw: g.hw,
    hh: g.hh,
    ox: g.ox ?? 0,
  };
}
/** Bäume einer Gruppe mit ihrer Kronenmitte gegen die Gruppenmitte (zum Malen, trees.ts). */
export function groupParts(c: Crown): { members: Crown[]; at: { x: number; y: number }[] } {
  const L = groupLayout(c);
  return { members: L.members, at: L.at };
}
