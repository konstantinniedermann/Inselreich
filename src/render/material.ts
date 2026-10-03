import { hash2 } from '../sim/noise';
import type { Building, BuildingDef } from '../sim/types';
import { ISO_W, type Pt } from './iso';
import { PALETTE, rgbOfCss } from './palette';
import type { BodyFace } from './sprites';

// material.ts — Materialschicht des Sprite-Caches (H-R7, G8): Fugen, Risse und Stroh als reine Strich-Pfade.
// Läuft nur beim Füllen einer Cache-Fläche (nie im Frame), liest nur die aufgezeichneten Flächen des Körpers
// (`bodyFaces`) und zeichnet ausschliesslich innerhalb dieser Flächen: kein Clip, kein Verlauf, nichts am Rand der
// Fläche, das `MARGIN` abschneiden könnte. Striche: eine Breite, runde Verbindungen und Enden (geglättet).

/** Strichbreite in CSS-Pixeln der Cache-Fläche (die Matrix der Fläche ist `dpr`, also Gerätepixel = Breite · dpr). */
const LINE_WIDTH = 1;
/** Abstand der Fugen in Weltpixeln (grob / fein). */
const SPACING_COARSE = 6;
const SPACING_FINE = 4;
/** Fugen halten diesen Anteil der Linienlänge an jedem Ende Abstand (kein Anstossen an den Umriss). */
const END_GAP = 0.08;
const MAX_STRAW = 40;

const rgba = (css: string, a: number): string => {
  const [r, g, b] = rgbOfCss(css);
  return `rgba(${r},${g},${b},${a})`;
};
const JOINT = rgba(PALETTE.wallTimber, 0.16);
const STRAW_DARK = rgba(PALETTE.roofTimber, 0.3);
const STRAW_LIGHT = rgba(PALETTE.foam, 0.28);
const CRACK = rgba(PALETTE.rockDark, 0.4);

/**
 * Detailstufe nach Zoom (ISO §16): 0 = kein Material (bei kleinem Zoom wären Fugen unter einem Pixel Abstand),
 * 1 = grobe Fugen, 2 = zusätzlich Stroh, 3 = feine Fugen und Risse.
 */
export function materialDetail(zoom: number): 0 | 1 | 2 | 3 {
  if (zoom < 0.75) return 0;
  if (zoom < 1) return 1;
  if (zoom < 1.5) return 2;
  return 3;
}

const lerp = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
const dist = (a: Pt, b: Pt): number => Math.hypot(b.x - a.x, b.y - a.y);

function area(pts: readonly Pt[]): number {
  let s = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]!,
      b = pts[(i + 1) % pts.length]!;
    s += a.x * b.y - b.x * a.y;
  }
  return Math.abs(s) / 2;
}
function inPoly(poly: readonly Pt[], x: number, y: number): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!,
      b = poly[j]!;
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
/** Wand: Viereck mit zwei senkrechten Kanten (Wandflächen liegen in einer Ebene u = const oder v = const). */
function isWall(pts: readonly Pt[]): boolean {
  if (pts.length !== 4) return false;
  let v = 0;
  for (let i = 0; i < 4; i++) {
    const a = pts[i]!,
      b = pts[(i + 1) % 4]!;
    if (Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) > 1) v++;
  }
  return v >= 2;
}

/** Strecke einer Fläche (Index in der Zeichenreihenfolge). */
interface Seg {
  fi: number;
  a: Pt;
  b: Pt;
}
/** Abstand um eine deckende Fläche, den der Strich frei lässt (Bildpixel): keine Spitzen unter Kanten. */
const COVER_PAD = 0.75;

type Interval = [number, number];

/** Parameterbereiche `t` der Strecke a→b, die im Polygon liegen (exakt über die Kantenschnitte). */
function insideIntervals(a: Pt, b: Pt, poly: readonly Pt[]): Interval[] {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const ts = [0, 1];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!,
      q = poly[(i + 1) % poly.length]!;
    const ex = q.x - p.x,
      ey = q.y - p.y;
    const den = dx * ey - dy * ex;
    if (Math.abs(den) < 1e-12) continue;
    const t = ((p.x - a.x) * ey - (p.y - a.y) * ex) / den;
    const u = ((p.x - a.x) * dy - (p.y - a.y) * dx) / den;
    if (t > 0 && t < 1 && u >= 0 && u <= 1) ts.push(t);
  }
  ts.sort((x, y) => x - y);
  const out: Interval[] = [];
  for (let i = 0; i + 1 < ts.length; i++) {
    const m = (ts[i]! + ts[i + 1]!) / 2;
    if (ts[i + 1]! - ts[i]! > 1e-9 && inPoly(poly, a.x + dx * m, a.y + dy * m)) {
      const last = out[out.length - 1];
      if (last && last[1] >= ts[i]! - 1e-9) last[1] = ts[i + 1]!;
      else out.push([ts[i]!, ts[i + 1]!]);
    }
  }
  return out;
}

/**
 * Deckungsprüfung: Teile der Strecke, die in der eigenen Fläche liegen und von keiner später gezeichneten Fläche
 * (Fenster, Tür, Dach davor, Kamin …) überdeckt sind. Exakt über die Kantenschnitte mit jeder späteren Fläche; um
 * jede deckende Fläche bleibt `COVER_PAD` Pixel frei. Teilstücke unter einem halben Pixel entfallen.
 */
function visibleParts(s: Seg, faces: readonly BodyFace[]): [Pt, Pt][] {
  const len = dist(s.a, s.b);
  if (len < 1e-9) return [];
  const pad = COVER_PAD / len;
  let vis = insideIntervals(s.a, s.b, faces[s.fi]!.pts);
  for (let j = s.fi + 1; j < faces.length && vis.length > 0; j++) {
    const cover = insideIntervals(s.a, s.b, faces[j]!.pts);
    if (cover.length === 0) continue;
    const next: Interval[] = [];
    for (const [v0, v1] of vis) {
      let from = v0;
      for (const [c0, c1] of cover) {
        const lo = c0 - pad,
          hi = c1 + pad;
        if (hi <= from || lo >= v1) continue;
        if (lo > from) next.push([from, lo]);
        from = Math.max(from, hi);
      }
      if (from < v1) next.push([from, v1]);
    }
    vis = next;
  }
  return vis
    .filter(([t0, t1]) => (t1 - t0) * len >= 0.5)
    .map(([t0, t1]) => [lerp(s.a, s.b, t0), lerp(s.a, s.b, t1)]);
}

/** Fugenlinien eines Vierecks, parallel zum längeren Kantenpaar. */
function courses(pts: readonly Pt[], step: number, fi: number, path: Seg[]): void {
  const [p0, p1, p2, p3] = pts as [Pt, Pt, Pt, Pt];
  const along = dist(p0, p1) + dist(p2, p3) >= dist(p1, p2) + dist(p3, p0);
  const [a0, a1, b0, b1, across] = along
    ? [p0, p3, p1, p2, (dist(p0, p3) + dist(p1, p2)) / 2]
    : [p0, p1, p3, p2, (dist(p0, p1) + dist(p3, p2)) / 2];
  const n = Math.floor(across / step);
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 1);
    const a = lerp(a0, a1, t),
      b = lerp(b0, b1, t);
    path.push({ fi, a: lerp(a, b, END_GAP), b: lerp(a, b, 1 - END_GAP) });
  }
}

/**
 * Zeichnet das Material auf `ctx` (Cache-Fläche, Matrix = `dpr`). `faces` liegen schon in Bildpunkten der Fläche
 * (`bodyFaces` mit der Kamera der Fläche), `zoom` ist die Abbildung Welt → Bild.
 */
export function drawMaterial(
  ctx: CanvasRenderingContext2D,
  faces: readonly BodyFace[],
  def: BuildingDef,
  b: Building,
  variant: number,
  zoom: number,
): void {
  const level = materialDetail(zoom);
  if (level === 0 || faces.length === 0) return;
  const tier = b.house?.tier ?? 0;
  const salt = 900 + variant * 31 + tier * 7;
  const straw = def.id === 'house' && tier === 1 && level >= 2;
  const fullWidth = ((def.w + def.h) * ISO_W * zoom) / 2;
  const step = (level >= 3 ? SPACING_FINE : SPACING_COARSE) * zoom;

  const joints: Seg[] = [];
  const dark: Seg[] = [];
  const light: Seg[] = [];
  const cracks: Seg[] = [];
  let widest: BodyFace | null = null;
  let widestIdx = -1;

  faces.forEach((f, fi) => {
    const pts = f.pts;
    const xs = pts.map((p) => p.x),
      ys = pts.map((p) => p.y);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const a = area(pts);
    if (a < 24 * zoom * zoom) return; // Fenster, Türen, Kamine: kein Material
    if (maxX - minX >= 0.93 * fullWidth) return; // Hof (Footprint-Raute)
    const wall = isWall(pts);
    if (wall && (!widest || a > area(widest.pts))) {
      widest = f;
      widestIdx = fi;
    }
    if (straw && !wall) {
      const n = Math.min(MAX_STRAW, Math.floor(a / (zoom * zoom * 40)));
      for (let i = 0; i < n; i++) {
        const x = minX + hash2(salt + fi, i, 1) * (maxX - minX),
          y = minY + hash2(salt + fi, i, 2) * (maxY - minY);
        const dx = (hash2(salt + fi, i, 3) - 0.5) * 2.4 * zoom,
          dy = 3 * zoom;
        if (inPoly(pts, x, y) && inPoly(pts, x + dx, y + dy))
          ((i & 1) === 0 ? dark : light).push({
            fi,
            a: { x, y },
            b: { x: x + dx, y: y + dy },
          });
      }
    } else if (pts.length === 4) courses(pts, step, fi, joints);
  });

  // Risse (nur Stufe 3, nur ab Variante 2): ein Zickzack auf der grössten Wand, jeder Punkt in der Fläche.
  const wf = widest as BodyFace | null;
  if (level >= 3 && variant >= 2 && wf) {
    const pts = wf.pts;
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length,
      cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    let x = cx + (hash2(salt, 1, 1) - 0.5) * 6 * zoom,
      y = cy + (hash2(salt, 1, 2) - 0.5) * 4 * zoom;
    const line: Pt[] = [];
    for (let i = 0; i < 5; i++) {
      if (!inPoly(pts, x, y)) break;
      line.push({ x, y });
      x += (hash2(salt, i, 3) - 0.5) * 3 * zoom;
      y += (1.5 + hash2(salt, i, 4)) * zoom;
    }
    for (let i = 1; i < line.length; i++)
      cracks.push({ fi: widestIdx, a: line[i - 1]!, b: line[i]! });
  }

  const groups: [Seg[], string][] = [
    [joints, JOINT],
    [dark, STRAW_DARK],
    [light, STRAW_LIGHT],
    [cracks, CRACK],
  ];
  const drawn = groups.map(([g, color]): [[Pt, Pt][], string] => [
    g.flatMap((sg) => visibleParts(sg, faces)),
    color,
  ]);
  if (drawn.every(([g]) => g.length === 0)) return;
  ctx.save();
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const [g, color] of drawn) {
    if (g.length === 0) continue;
    ctx.beginPath();
    for (const [p, q] of g) {
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
    }
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  ctx.restore();
}
