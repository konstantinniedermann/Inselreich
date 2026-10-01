// life.ts — Leben (Spec 5.6, ISO §5 Ebenen 5 bis 7): Spaziergänger, Möwen, Herdrauch, Fensterlicht-Hilfen.
// Kosmetisch und deterministisch aus `timeMs` und dem Welt-Zustand; kein Zustand ausser Caches je Welt, kein
// Schreibzugriff auf die Welt. Die Mathematik (Weggraph, Positionen, Anker) ist rein; die Zeichner sind dünn.
import { hash2 } from '../sim/noise';
import { layoutKey } from '../sim/queries';
import type { Building, BuildingDef, World } from '../sim/types';
import { worldToScreen, type Camera, type TileRange } from './camera';
import type { Phase } from './daynight';
import { ISO_H, ISO_W, project, type Pt } from './iso';
import { cap } from './limits';
import { PALETTE, mixHex, rgbOfCss, rgbaOf } from './palette';
import { lightAnchors, type LightAnchor } from './sprites';
import { coastField, type Field } from './terrainField';

/** `rgba(…)` aus einer Palettenfarbe oder einem `mixHex`-Ton (`rgb(…)`). */
const rgbaCss = (css: string, alpha: number): string => `rgba(${rgbOfCss(css).join(',')},${alpha})`;

// --- Spaziergänger -------------------------------------------------------------------------------------

export const WALK_SPEED = 1.2; // Kacheln/s (Spec 5.6)
export const SEG_MS = 1000 / WALK_SPEED;
export const EPISODE_SEGMENTS = 32;
export const EPISODE_MS = EPISODE_SEGMENTS * SEG_MS;
export const FADE_MS = 300;
/** Einwohner je Figur (Setzung Spec 5.6). */
const INHABITANTS_PER_WALKER = 4;

/** Wegkacheln und ihre 4er-Nachbarn (Kachel-Indizes `y · width + x`). */
export interface RoadGraph {
  width: number;
  nodes: number[];
  nbrs: Map<number, number[]>;
}

/** Weggraph der Welt (Cache je Welt und `layoutKey`; eine Welt, ein Eintrag). */
const graphs = new WeakMap<World, { key: string; graph: RoadGraph }>();
export function roadGraph(world: World): RoadGraph {
  const key = layoutKey(world);
  const hit = graphs.get(world);
  if (hit && hit.key === key) return hit.graph;
  const { width: w, height: h } = world;
  const road = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < w && y < h && world.tiles[y * w + x]!.road === true;
  const nodes: number[] = [];
  const nbrs = new Map<number, number[]>();
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!road(x, y)) continue;
      const i = y * w + x;
      nodes.push(i);
      const list: number[] = [];
      if (road(x, y - 1)) list.push(i - w);
      if (road(x + 1, y)) list.push(i + 1);
      if (road(x, y + 1)) list.push(i + w);
      if (road(x - 1, y)) list.push(i - 1);
      nbrs.set(i, list);
    }
  const graph = { width: w, nodes, nbrs };
  graphs.set(world, { key, graph });
  return graph;
}

/** Anzahl Figuren: `min(CAP_WALKERS, floor(Einwohner / 4))`. */
export function walkerCount(inhabitants: number, reduce = false): number {
  if (!Number.isFinite(inhabitants) || inhabitants <= 0) return 0;
  return Math.min(cap('walkers', reduce), Math.floor(inhabitants / INHABITANTS_PER_WALKER));
}

/** Summe der Einwohner aller Häuser. */
export function totalInhabitants(world: World): number {
  let n = 0;
  for (const b of Object.values(world.buildings)) n += b.house?.inhabitants ?? 0;
  return n;
}

export interface WalkerPose {
  x: number;
  y: number;
  alpha: number;
}

/**
 * Position der Figur `i` zur Zeit `timeMs` im Kachelraum (Mitte der Kachel = +0,5). Die Zeit ist in Episoden zu
 * 32 Segmenten geteilt; jede Episode setzt neu an einer gewürfelten Wegkachel an und rechnet höchstens
 * 32 Schritte (AK-R4-07). Ohne Wege `null`. `alpha` blendet den Sprung zwischen Episoden über `FADE_MS` aus und ein.
 */
export function walkerAt(
  g: RoadGraph,
  i: number,
  timeMs: number,
  seed: number,
  stats?: { steps: number },
): WalkerPose | null {
  const n = g.nodes.length;
  if (n === 0) return null;
  const t = Number.isFinite(timeMs) ? Math.max(0, timeMs) : 0;
  const e = Math.floor(t / EPISODE_MS),
    tIn = t - e * EPISODE_MS;
  const k = Math.min(EPISODE_SEGMENTS - 1, Math.floor(tIn / SEG_MS)),
    frac = (tIn - k * SEG_MS) / SEG_MS;
  let prev = -1,
    cur = g.nodes[Math.min(n - 1, Math.floor(hash2(seed + i, e, 1) * n))]!,
    next = cur;
  for (let s = 0; s <= k; s++) {
    const all = g.nbrs.get(cur) ?? [];
    const opts = all.length > 1 ? all.filter((q) => q !== prev) : all; // umkehren nur in der Sackgasse
    next = opts.length
      ? opts[
          Math.min(
            opts.length - 1,
            Math.floor(hash2(seed + i, e * EPISODE_SEGMENTS + s, 0) * opts.length),
          )
        ]!
      : cur;
    if (stats) stats.steps++;
    if (s < k) {
      prev = cur;
      cur = next;
    }
  }
  const cx = (cur % g.width) + 0.5,
    cy = Math.floor(cur / g.width) + 0.5;
  const nx = (next % g.width) + 0.5,
    ny = Math.floor(next / g.width) + 0.5;
  const alpha = Math.max(0, Math.min(1, tIn / FADE_MS, (EPISODE_MS - tIn) / FADE_MS));
  return { x: cx + (nx - cx) * frac, y: cy + (ny - cy) * frac, alpha };
}

/** Schattenrichtung (+3, +1) normiert, wie Schiff und Gebäude (D-11). */
const SHADOW_DIR = { x: 3 / Math.sqrt(10), y: 1 / Math.sqrt(10) };

/** Schattenellipse im Kachelraum, nach rechts unten um `shift` versetzt; gleiche Orientierung wie `shipShadow`. */
function ellipsePoly(cx: number, cy: number, a: number, b: number, shift: number, n: number): Pt[] {
  const mx = cx + SHADOW_DIR.x * shift,
    my = cy + SHADOW_DIR.y * shift;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const u = Math.cos(t) * a,
      v = Math.sin(t) * b;
    out.push({
      x: mx + SHADOW_DIR.x * u - SHADOW_DIR.y * v,
      y: my + SHADOW_DIR.y * u + SHADOW_DIR.x * v,
    });
  }
  return out;
}

/** Figurenschatten im Kachelraum (Schattenpfad, Ebene 5). */
export const walkerShadow = (p: { x: number; y: number }): Pt[] =>
  ellipsePoly(p.x, p.y, 0.1, 0.06, 0.06, 6);

/** Höhe und Breite der Figur (Spec 5.6: 0,18 Kachel breit, 0,6 · ISO_H hoch). */
export const WALKER_H = 0.6 * ISO_H;
export const WALKER_W = 0.18 * (ISO_W / 2);
/** Kleiderfarben (aus der Palette, keine Signalfarbe). */
export const CLOTHES: readonly string[] = [
  PALETTE.roofSlate,
  PALETTE.roofTerracotta,
  PALETTE.grassDark,
  PALETTE.roofThatch,
];
const SKIN = mixHex(PALETTE.wallLime, PALETTE.earth, 0.45);
const OUTLINE = rgbaCss(mixHex(PALETTE.wallTimber, '#000000', 0.55), 0.8);

/** Kleiderfarbe der Figur `i`. */
export const clothesOf = (seed: number, i: number): string =>
  CLOTHES[Math.min(CLOTHES.length - 1, Math.floor(hash2(seed + 7, i, 5) * CLOTHES.length))]!;

/** Figur (Bildraum): Körper als Trapez, Kopfpunkt, dünner Umriss; Deckkraft `alpha`. */
export function drawWalker(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  pose: WalkerPose,
  color: string,
): void {
  const base = worldToScreen(cam, project(pose.x, pose.y));
  const z = cam.zoom,
    h = WALKER_H * z,
    w = WALKER_W * z;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, pose.alpha));
  ctx.beginPath();
  ctx.moveTo(base.x - w / 2, base.y);
  ctx.lineTo(base.x + w / 2, base.y);
  ctx.lineTo(base.x + 0.4 * w, base.y - 0.66 * h);
  ctx.lineTo(base.x - 0.4 * w, base.y - 0.66 * h);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(base.x, base.y - 0.83 * h, 0.17 * h, 0, Math.PI * 2);
  ctx.fillStyle = SKIN;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

// --- Möwen ---------------------------------------------------------------------------------------------

const GULL_PHASES: readonly Phase[] = ['morning', 'day', 'evening'];
/** Möwen kreisen nur über Wasser nahe der Küste (`−s < GULL_BAND`). */
const GULL_BAND = 2;

export interface GullAnchor {
  tx: number;
  ty: number;
  /** Sortierschlüssel `hash2(seed + 31, x, y)`. */
  key: number;
}

/** Kantenlänge der festen Zellen (Kacheln), je Zelle höchstens eine Möwe. */
export const GULL_CELL = 8;
/**
 * Füllung des Möwenbudgets: Von den Zellen im Bereich dürfen so viele eine Möwe tragen (Zellen-Hash unter der
 * Schwelle), dass im Mittel `GULL_FILL · cap` Zellen zugelassen sind (nur Küstenzellen liefern wirklich eine). Die Schwelle hängt nur von der Bereichsgrösse ab, nicht
 * von der Lage; so greift die Kappung auf `cap` beim Scrollen selten und Möwen springen nicht.
 */
const GULL_FILL = 1.5;

/**
 * Kreismittelpunkte der Möwen: Die Karte ist in feste Zellen zu 8×8 Kacheln geteilt. Je Zelle, die den Bereich
 * schneidet, gilt die Wasserkachel mit `−s < 2` und kleinstem Schlüssel `hash2(seed + 31, x, y)` (die ganze Zelle
 * wird gelesen, nicht nur der sichtbare Teil), sofern der Zellen-Hash es erlaubt; davon die `cap('gulls')` mit den
 * kleinsten Schlüsseln. So springen Möwen beim Scrollen nicht. In der Nacht leer.
 */
export function gullAnchors(
  field: Field,
  range: TileRange,
  seed: number,
  phase: Phase,
  reduce = false,
): GullAnchor[] {
  const limit = cap('gulls', reduce);
  if (!GULL_PHASES.includes(phase) || limit <= 0) return [];
  if (range.x1 < range.x0 || range.y1 < range.y0) return [];
  const cx0 = Math.floor(Math.max(0, range.x0) / GULL_CELL),
    cx1 = Math.floor(Math.min(field.w - 1, range.x1) / GULL_CELL),
    cy0 = Math.floor(Math.max(0, range.y0) / GULL_CELL),
    cy1 = Math.floor(Math.min(field.h - 1, range.y1) / GULL_CELL);
  const share = Math.min(1, (GULL_FILL * limit) / ((cx1 - cx0 + 1) * (cy1 - cy0 + 1)));
  const winners: GullAnchor[] = [];
  for (let cy = cy0; cy <= cy1; cy++)
    for (let cx = cx0; cx <= cx1; cx++) {
      if (hash2(seed + 32, cx, cy) >= share) continue;
      let best: GullAnchor | null = null;
      const x1 = Math.min(field.w, (cx + 1) * GULL_CELL),
        y1 = Math.min(field.h, (cy + 1) * GULL_CELL);
      for (let y = cy * GULL_CELL; y < y1; y++)
        for (let x = cx * GULL_CELL; x < x1; x++) {
          const v = field.v[y * field.w + x]!;
          if (!(v < 0 && -v < GULL_BAND)) continue;
          const key = hash2(seed + 31, x, y);
          if (!best || key < best.key) best = { tx: x, ty: y, key };
        }
      if (best) winners.push(best);
    }
  return winners.sort((a, b) => a.key - b.key).slice(0, limit);
}

export interface GullPose {
  /** Bodenpunkt im Kachelraum. */
  x: number;
  y: number;
  /** Flughöhe in Weltpixeln. */
  z: number;
  /** Flügelausschlag −1…1. */
  flap: number;
}

/** Ellipsenbahn und Flügelschlag der Möwe, rein aus Anker, Seed und `timeMs`. */
export function gullPose(a: GullAnchor, seed: number, timeMs: number): GullPose {
  const h = (salt: number): number => hash2(seed + 41 + salt, a.tx, a.ty);
  const cx = a.tx + 0.5 + (h(0) - 0.5) * 0.8,
    cy = a.ty + 0.5 + (h(1) - 0.5) * 0.8;
  const rx = 0.7 + h(2) * 0.9,
    ry = 0.4 + h(3) * 0.5,
    tilt = h(4) * Math.PI;
  const period = 9000 + h(5) * 7000;
  const th = (timeMs / period + h(6)) * Math.PI * 2;
  const u = Math.cos(th) * rx,
    v = Math.sin(th) * ry;
  return {
    x: cx + Math.cos(tilt) * u - Math.sin(tilt) * v,
    y: cy + Math.sin(tilt) * u + Math.cos(tilt) * v,
    z: (0.9 + 0.35 * h(7) + 0.1 * Math.sin(th * 2)) * ISO_H,
    flap: Math.sin(timeMs / (170 + h(8) * 60) + h(9) * 6.28),
  };
}

/** Schatten der Möwe auf dem Wasser (Kachelraum), mit der Flughöhe nach rechts unten versetzt. */
export const gullShadow = (p: GullPose): Pt[] =>
  ellipsePoly(p.x, p.y, 0.16, 0.07, 0.15 + (0.4 * p.z) / ISO_H, 6);

const GULL_SPAN = 0.3 * ISO_H; // halbe Spannweite in Weltpixeln
const GULL_COLOR = PALETTE.foam;
const GULL_UNDER = rgbaOf(PALETTE.rockDark, 0.45);

/** Möwe (Luft): Flügelschlag als Linienzug aus 2 Segmenten, Körperpunkt; heller Strich über dunklem Saum. */
export function drawGull(ctx: CanvasRenderingContext2D, cam: Camera, pose: GullPose): void {
  const p = project(pose.x, pose.y);
  const c = worldToScreen(cam, { x: p.x, y: p.y - pose.z });
  const z = cam.zoom,
    span = GULL_SPAN * z,
    lift = pose.flap * 0.35 * span;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [style, width] of [
    [GULL_UNDER, 3 * z],
    [GULL_COLOR, 1.5 * z],
  ] as const) {
    ctx.strokeStyle = style;
    ctx.lineWidth = Math.max(1, width);
    ctx.beginPath();
    ctx.moveTo(c.x - span, c.y - lift);
    ctx.lineTo(c.x, c.y + 0.1 * span);
    ctx.lineTo(c.x + span, c.y - lift);
    ctx.stroke();
  }
  ctx.restore();
}

// --- Herdrauch -----------------------------------------------------------------------------------------

/** Herdrauch gibt es nur in Morgen und Abend und nur bei Bewohnern (Spec 5.6). */
export function hearthSmoke(phase: Phase, inhabitants: number): boolean {
  return (phase === 'morning' || phase === 'evening') && inhabitants > 0;
}

/** Rauchpuffs je Haus (zählen gegen `cap('smoke')`). */
export const HEARTH_PUFFS = 2;
const HEARTH_PERIOD_MS = 3600;
export const HEARTH_COLOR = mixHex(PALETTE.wallLime, PALETTE.foam, 0.5);

/** Dünne, helle Rauchfäden über der Kaminmündung `at` (Bildpunkt). */
export function drawHearthSmoke(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  at: Pt,
  id: number,
  timeMs: number,
  puffs: number,
): void {
  const n = Math.min(HEARTH_PUFFS, Math.floor(puffs));
  if (n <= 0) return;
  const z = cam.zoom;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const a = (timeMs / HEARTH_PERIOD_MS + i / n + (id % 5) / 5) % 1;
    const fadeIn = Math.min(1, a / 0.12);
    ctx.fillStyle = rgbaCss(HEARTH_COLOR, Number((0.42 * (1 - a) * fadeIn).toFixed(3)));
    ctx.beginPath();
    ctx.arc(
      at.x + (Math.sin(a * 6 + id) * 1.6 + a * 5) * z,
      at.y - a * 0.75 * ISO_H * z,
      (0.8 + 1.6 * a) * z,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  ctx.restore();
}

// --- Küstenfeld und Fensteranker (Caches) -------------------------------------------------------------

/** Küstenfeld je Welt (das Terrain ändert sich im Spiel nicht; wie die Wasser-Ebene). */
const coasts = new WeakMap<World, Field>();
export function coastFor(world: World): Field {
  let f = coasts.get(world);
  if (!f) {
    f = coastField(world);
    coasts.set(world, f);
  }
  return f;
}

/**
 * Fensteranker nach Typ und Stufe. Sie liegen als Anteile von `spriteBounds` fest und hängen nur von Typ und
 * Haustufe ab, nicht von der Lage; der Cache hat damit höchstens (Typen × 3) Einträge.
 */
const anchorCache = new Map<string, readonly LightAnchor[]>();
export function anchorsFor(def: BuildingDef, b: Building): readonly LightAnchor[] {
  const key = def.id === 'house' ? `house:${b.house?.tier ?? 1}` : def.id;
  let a = anchorCache.get(key);
  if (!a) {
    a = lightAnchors(def, b);
    anchorCache.set(key, a);
  }
  return a;
}
/** Anzahl Einträge des Anker-Caches (Test der Obergrenze). */
export const anchorCacheSize = (): number => anchorCache.size;

/** Fenster- und Laternenanker eines Gebäudes in Bildpunkten (`x`, `y`, Breite, Höhe in CSS-Pixeln). */
export function anchorRects(
  cam: Camera,
  box: { x: number; y: number; w: number; h: number },
  anchors: readonly LightAnchor[],
): { x: number; y: number; w: number; h: number; always: boolean }[] {
  const o = worldToScreen(cam, { x: box.x, y: box.y });
  return anchors.map((a) => ({
    x: o.x + a.x * box.w * cam.zoom,
    y: o.y + a.y * box.h * cam.zoom,
    w: a.w * box.w * cam.zoom,
    h: a.h * box.h * cam.zoom,
    always: a.always === true,
  }));
}

// --- Fensterlicht (Spec 6.2, ISO D-20) ----------------------------------------------------------------

/** Radius des weichen Scheins: 0,6 · ISO_H · Zoom (D-20). */
export const GLOW_RADIUS = 0.6 * ISO_H;
/** Deckkraft des Scheins bei `windows = 1`. */
export const GLOW_ALPHA = 0.35;
/** Ringe des weichen Scheins (Radius-Anteil), jeder als ein Pfad mit eigener Füllung: summiert sich additiv. */
const GLOW_RINGS = [1, 0.66, 0.33] as const;

export interface LightRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Additiver Lichtdurchgang für eine Gruppe von Fenstern der Stärke `k` (0…1): ein Pfad mit allen Fensterflächen
 * in `window`, dazu der Schein als konzentrische Kreise im Bildraum (Radius 0,6 · ISO_H · Zoom, Deckkraft
 * 0,35 · k insgesamt). Der Aufrufer hat `'lighter'` gesetzt und steht zwischen `save` und `restore`.
 */
export function drawWindowLight(
  ctx: CanvasRenderingContext2D,
  zoom: number,
  rects: readonly LightRect[],
  k: number,
): void {
  const s = Math.max(0, Math.min(1, k));
  if (rects.length === 0 || s <= 0) return;
  ctx.beginPath();
  for (const r of rects) ctx.rect(r.x, r.y, r.w, r.h);
  ctx.fillStyle = rgbaOf(PALETTE.window, Number(s.toFixed(3)));
  ctx.fill();
  const radius = GLOW_RADIUS * zoom;
  const alpha = Number(((GLOW_ALPHA * s) / GLOW_RINGS.length).toFixed(4));
  ctx.fillStyle = rgbaOf(PALETTE.window, alpha);
  for (const ring of GLOW_RINGS) {
    ctx.beginPath();
    for (const r of rects) {
      const cx = r.x + r.w / 2,
        cy = r.y + r.h / 2;
      ctx.moveTo(cx + radius * ring, cy);
      ctx.arc(cx, cy, radius * ring, 0, Math.PI * 2);
    }
    ctx.fill();
  }
}
