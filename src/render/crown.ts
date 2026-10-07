import { hash2 } from '../sim/noise';
import { ISO_H, ISO_W } from './isoBase';

// crown.ts — Form einer Baumkrone (ISO §6, Spec 2.1.4), reine Geometrie ohne Canvas (WALD-02: aus trees.ts gelöst,
// damit die Platzierung in forest.ts sie ohne Import-Zyklus nutzen kann). Zeichnen, Atlas und Box stehen in trees.ts.

/** Baumart: 0 Laubbaum, 1 Nadelbaum, 2 Birke (hell), 3 Pinie (schirmförmig), 4 Ahorn (gedecktes Rostrot). */
export type CrownKind = 0 | 1 | 2 | 3 | 4;
/** Totholz (B3): 1 Baumstumpf, 2 toter, entasteter Stamm. */
export type DeadKind = 1 | 2;
/**
 * Eine Krone: Art, Fusspunkt (`cx`, `cy`) in Kacheln relativ zur Kachel des Wald-Objekts (darf ausserhalb von 0…1
 * liegen), Fussradius `r` in Kacheln (Breite der Krone = r × ISO_W), Höhe des Kronenmittelpunkts über dem Fuss in
 * Weltpixeln, Busch-Flag und Formwert `s` (0…1).
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
  /** Tonklasse des Kronendachs (B2): −1 dunkler, 0, +1 heller. */
  tone?: -1 | 0 | 1;
  /** Totholz statt Krone. */
  dead?: DeadKind;
  /** Krone wirft einen eigenen Schatten (Vorwald, Saum ausserhalb der Saumlinie); sonst liegt er im Boden. */
  cast?: boolean;
  /** Uralter Riesenbaum (B3), wird direkt gezeichnet. */
  giant?: boolean;
}

/** Höchste Krone über ihrem Fuss (Weltpixel); nur der Riesenbaum ragt höher. */
export const TREE_H = 1.1 * ISO_H;
/** Der Riesenbaum (B3) ist 1,8-mal so hoch und gross. */
export const GIANT_SCALE = 1.8;
export const CROWN_RY = 0.85; // Kronenhöhe im Verhältnis zur Breite
const CONIFER_TOP = 1.6; // Spitze des Nadelbaums über dem Kronenmittelpunkt, in Kronenhöhen (ry)
const CONIFER_BOTTOM = 0.9;
const PINE_FLAT = 0.64; // Pinienschirm: Höhe im Verhältnis zur Breite
const BUSH_FLAT = 0.7;
const YOUNG_FLAT = 0.7;

export interface Lobe {
  x: number;
  y: number;
  rx: number;
  ry: number;
}
export interface Tier {
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

/**
 * Form einer Krone aus (Art, Radius, Formwert, Busch, Jung, Spiegelung); eine reine Funktion, kein Seed nötig. Alle
 * Masse sind linear in `r`: eine Form bei Radius r ist die Form bei r₀, mit r / r₀ skaliert (Kronen-Atlas, trees.ts).
 */
export function crownGeom(
  c: Pick<Crown, 'kind' | 'r' | 's' | 'bush' | 'young' | 'mirror'>,
): CrownGeom {
  const q = (i: number, j: number): number => hash2(513 + Math.floor(c.s * 65536), i, j);
  const rx0 = c.r * ISO_W;
  const lobes: Lobe[] = [];
  const tiers: Tier[] = [];
  if (c.kind === 1 && !c.bush) {
    const ry0 = rx0 * CROWN_RY;
    const n = 3 + (q(0, 0) > 0.5 ? 1 : 0);
    const span = (CONIFER_TOP + CONIFER_BOTTOM) * ry0;
    const slim = 0.78 + 0.34 * q(0, 8); // WALD-02: schlanke und breite Fichten je Form
    const th = span / (1 + 0.55 * (n - 1));
    for (let i = 0; i < n; i++) {
      const by = CONIFER_BOTTOM * ry0 - i * 0.55 * th;
      const hw = rx0 * slim * (1 - 0.17 * i) * (0.74 + 0.22 * q(i, 5));
      const lean = (q(i, 6) - 0.5) * rx0 * (i === n - 1 ? 0.5 : 0.22); // leicht schiefe Spitze
      tiers.push({ ax: lean, ay: by - th, hw, bx: (q(i, 7) - 0.5) * 0.08 * hw, by, th });
    }
  } else {
    // WALD-02: Pinienschirme je Form verschieden flach (gleich flache Schirme stapelten sich zu Bändern)
    const flat =
      c.kind === 3
        ? PINE_FLAT + 0.22 * q(0, 9)
        : c.bush
          ? BUSH_FLAT
          : c.young
            ? YOUNG_FLAT
            : CROWN_RY;
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
  if (c.mirror) {
    for (const l of lobes) l.x = -l.x;
    for (const t of tiers) {
      t.ax = -t.ax;
      t.bx = -t.bx;
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

/**
 * Stammhöhe je Formklasse (Kronenmittelpunkt über dem Fuss in Kronen-Halbhöhen): eine feste Zahl je Art und Flag,
 * damit eine Atlas-Kachel (Krone plus Stamm) für alle Radien gilt. Nadel tief angesetzt (Rock bis zum Boden),
 * Birke und Jungbaum mit sichtbarem Stamm, Busch am Boden.
 */
export function heightFactor(c: Pick<Crown, 'kind' | 'bush' | 'young'> & { s?: number }): number {
  if (c.bush) return 0.55;
  if (c.young) return c.kind === 1 ? 0.95 : 1.15;
  // Pinie: Stammhöhe je Form (5 Stufen), damit die Schirme nicht in einer Ebene liegen und sich zu Bändern stapeln;
  // ohne Formwert gilt die höchste Stufe (Höhengrenze)
  if (c.kind === 3)
    return c.s === undefined ? PINE_HF[3]! : PINE_HF[Math.min(4, Math.floor(c.s * 5))]!;
  return [0.95, 0.72, 1.2, 0.85, 0.95][c.kind]!;
}
const PINE_HF = [0.8, 1.25, 0.95, 1.45, 1.1] as const;

/** Halbhöhe der Krone je Kachel Radius (`hh / r`), höchstens über alle Formwerte: für die Höhengrenze. */
const hhUnitCache = new Map<string, number>();
export function hhPerRadius(c: Pick<Crown, 'kind' | 'bush' | 'young'>): number {
  const key = `${c.kind}|${c.bush ? 1 : 0}|${c.young ? 1 : 0}`;
  let v = hhUnitCache.get(key);
  if (v === undefined) {
    v = 0;
    for (let i = 0; i < 16; i++) v = Math.max(v, crownGeom({ ...c, r: 1, s: (i + 0.5) / 16 }).hh);
    hhUnitCache.set(key, v);
  }
  return v;
}

/** Grösster Radius, bei dem Krone samt Stamm unter `top` Weltpixeln bleibt. */
export const maxRadius = (
  c: Pick<Crown, 'kind' | 'bush' | 'young'> & { s?: number },
  top = TREE_H,
): number => top / ((heightFactor(c) + 1) * hhPerRadius(c));
