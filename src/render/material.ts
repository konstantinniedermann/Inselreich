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

/** Fugenlinien eines Vierecks, parallel zum längeren Kantenpaar. */
function courses(pts: readonly Pt[], step: number, path: Pt[][]): void {
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
    path.push([lerp(a, b, END_GAP), lerp(a, b, 1 - END_GAP)]);
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

  const joints: Pt[][] = [];
  const dark: Pt[][] = [];
  const light: Pt[][] = [];
  const cracks: Pt[][] = [];
  let widest: BodyFace | null = null;

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
    if (wall && (!widest || a > area(widest.pts))) widest = f;
    if (straw && !wall) {
      const n = Math.min(MAX_STRAW, Math.floor(a / (zoom * zoom * 40)));
      for (let i = 0; i < n; i++) {
        const x = minX + hash2(salt + fi, i, 1) * (maxX - minX),
          y = minY + hash2(salt + fi, i, 2) * (maxY - minY);
        const dx = (hash2(salt + fi, i, 3) - 0.5) * 2.4 * zoom,
          dy = 3 * zoom;
        if (inPoly(pts, x, y) && inPoly(pts, x + dx, y + dy))
          ((i & 1) === 0 ? dark : light).push([
            { x, y },
            { x: x + dx, y: y + dy },
          ]);
      }
    } else if (pts.length === 4) courses(pts, step, joints);
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
    if (line.length >= 2) cracks.push(line);
  }

  const groups: [Pt[][], string][] = [
    [joints, JOINT],
    [dark, STRAW_DARK],
    [light, STRAW_LIGHT],
    [cracks, CRACK],
  ];
  if (groups.every(([g]) => g.length === 0)) return;
  ctx.save();
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const [g, color] of groups) {
    if (g.length === 0) continue;
    ctx.beginPath();
    for (const l of g) {
      ctx.moveTo(l[0]!.x, l[0]!.y);
      for (let i = 1; i < l.length; i++) ctx.lineTo(l[i]!.x, l[i]!.y);
    }
    ctx.strokeStyle = color;
    ctx.stroke();
  }
  ctx.restore();
}
