// seaMap.ts — Seekarte (UI-SEEKARTE T1/T2): Layout, Treffer, Schiffspunkte, Silhouetten-Cache, Zeichner.
// Rein und nur lesend: schreibt nie in die Welt. Ausrichtung wie die Hauptansicht (`project`, Iso).
import type { Island, World } from '../sim/types';
import { lanePoints, shipPose } from './shipLane';
import { project, unproject } from './iso';

/** Abbildung Archipel-Kacheln -> Karten-Pixel: `project(x, y) * scale + (ox, oy)`. */
export interface MapLayout {
  w: number;
  h: number;
  scale: number;
  ox: number;
  oy: number;
}

/** Schiffspunkt in Archipel-Kacheln. */
export interface MapDot {
  id: number;
  x: number;
  y: number;
}

/** Darstellungszustand der Karte (nur UI). */
export interface MapUi {
  hover: number | null;
}

/** Gerasterte Land-Maske einer Insel in Draufsicht, `r` Pixel je Kachel. */
export interface Silhouette {
  image: CanvasImageSource;
  w: number;
  h: number;
  r: number;
  /** Anzahl Nicht-Wasser-Kacheln. */
  land: number;
}

export interface RasterTarget {
  ctx: CanvasRenderingContext2D;
  image: CanvasImageSource;
}
export type RasterFactory = (w: number, h: number) => RasterTarget;

export const COLORS = {
  water: '#1d4a66',
  land: '#8aa060',
  lane: 'rgba(255,255,255,0.55)',
  dot: '#ffd34d',
  dotEdge: '#3a2a00',
  kontor: '#ffffff',
  hover: '#ffe08a',
} as const;

/** Karten-Pixel eines Punkts in Archipel-Kacheln. */
export function tileToMap(l: MapLayout, tx: number, ty: number): { x: number; y: number } {
  const p = project(tx, ty);
  return { x: p.x * l.scale + l.ox, y: p.y * l.scale + l.oy };
}

/** Umkehrung von `tileToMap` (Archipel-Kacheln, ungerundet). */
export function mapToTile(l: MapLayout, px: number, py: number): { x: number; y: number } {
  return unproject((px - l.ox) / l.scale, (py - l.oy) / l.scale);
}

/** Massstab und Versatz so, dass alle Inselrechtecke samt Rand `pad` in `w` x `h` passen; hängt nur von der Inselgeometrie ab. */
export function mapLayout(world: World, w: number, h: number, pad: number): MapLayout {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const s of world.islands) {
    for (const [cx, cy] of [
      [s.ox, s.oy],
      [s.ox + s.width, s.oy],
      [s.ox, s.oy + s.height],
      [s.ox + s.width, s.oy + s.height],
    ] as const) {
      const p = project(cx, cy);
      x0 = Math.min(x0, p.x);
      x1 = Math.max(x1, p.x);
      y0 = Math.min(y0, p.y);
      y1 = Math.max(y1, p.y);
    }
  }
  if (!Number.isFinite(x0)) return { w, h, scale: 1, ox: w / 2, oy: h / 2 };
  const bw = Math.max(1e-9, x1 - x0),
    bh = Math.max(1e-9, y1 - y0);
  const scale = Math.max(1e-9, Math.min((w - 2 * pad) / bw, (h - 2 * pad) / bh));
  return {
    w,
    h,
    scale,
    ox: (w - bw * scale) / 2 - x0 * scale,
    oy: (h - bh * scale) / 2 - y0 * scale,
  };
}

function isLand(s: Island, tx: number, ty: number): boolean {
  const t = s.tiles[ty * s.width + tx];
  return t !== undefined && t.terrain !== 'water';
}

/** Insel unter dem Kartenpunkt: Rechteck-Treffer, bei Überlappung gewinnt die Insel mit Land darunter; sonst `null`. */
export function hitIsland(world: World, l: MapLayout, px: number, py: number): number | null {
  const t = mapToTile(l, px, py);
  for (let i = 0; i < world.islands.length; i++) {
    const s = world.islands[i]!;
    const lx = t.x - s.ox,
      ly = t.y - s.oy;
    if (lx < 0 || ly < 0 || lx >= s.width || ly >= s.height) continue;
    if (isLand(s, Math.floor(lx), Math.floor(ly))) return i;
  }
  return null;
}

/** Schiffspunkte (Archipel-Kacheln), nach `id`; Schiffe ohne Route fehlen. */
export function mapDots(world: World): MapDot[] {
  return world.ships
    .filter((s) => s.route !== null)
    .map((s) => {
      const p = shipPose(world, s);
      return { id: s.id, x: p.x, y: p.y };
    })
    .sort((a, b) => a.id - b.id);
}

function domRaster(w: number, h: number): RasterTarget {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { ctx: c.getContext('2d')!, image: c };
}

/** Silhouetten je `Island`-Objekt und Massstab; die Land-Maske ändert sich im Spiel nie (Roden: Land bleibt Land). */
export interface SilhouetteCache {
  /** Anzahl bisheriger Raster-Läufe (Abnahme AK-S5). */
  rasterCount: number;
  get(isl: Island, scale: number): Silhouette;
}

export function createSilhouetteCache(factory: RasterFactory = domRaster): SilhouetteCache {
  const store = new WeakMap<Island, Map<string, Silhouette>>();
  const cache: SilhouetteCache = {
    rasterCount: 0,
    get(isl, scale) {
      let per = store.get(isl);
      if (!per) store.set(isl, (per = new Map()));
      const key = scale.toFixed(5);
      let sil = per.get(key);
      if (sil) return sil;
      cache.rasterCount++;
      // Pixel je Kachel: halbe Rautenbreite im Karten-Massstab, mindestens 1
      const r = Math.max(1, Math.round(32 * scale));
      const tgt = factory(isl.width * r, isl.height * r);
      tgt.ctx.fillStyle = COLORS.land;
      let land = 0;
      for (let y = 0; y < isl.height; y++) {
        let x = 0;
        while (x < isl.width) {
          if (!isLand(isl, x, y)) {
            x++;
            continue;
          }
          const x0 = x;
          while (x < isl.width && isLand(isl, x, y)) x++;
          land += x - x0;
          tgt.ctx.fillRect(x0 * r, y * r, (x - x0) * r, r);
        }
      }
      sil = { image: tgt.image, w: isl.width * r, h: isl.height * r, r, land };
      per.set(key, sil);
      return sil;
    },
  };
  return cache;
}

/** Zeichnet die Karte: Wasser, Fahrlinien, Silhouetten, Kontor-Marken, Hover-Rahmen, Schiffspunkte. Schreibt nie in die Welt. */
export function drawSeaMap(
  ctx: CanvasRenderingContext2D,
  world: World,
  l: MapLayout,
  cache: SilhouetteCache,
  ui: MapUi,
): void {
  ctx.fillStyle = COLORS.water;
  ctx.fillRect(0, 0, l.w, l.h);

  // Fahrlinien: je verschiedener Route genau ein Linienzug
  const seen = new Set<string>();
  ctx.strokeStyle = COLORS.lane;
  ctx.lineWidth = 1;
  for (const ship of world.ships) {
    const r = ship.route;
    if (!r) continue;
    const key = `${Math.min(r.a, r.b)}-${Math.max(r.a, r.b)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const pts = lanePoints(world, r.a, r.b);
    if (pts.length < 2) continue;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const m = tileToMap(l, p.x, p.y);
      if (i === 0) ctx.moveTo(m.x, m.y);
      else ctx.lineTo(m.x, m.y);
    });
    ctx.stroke();
  }

  // Silhouetten: ein drawImage je Insel, Draufsicht-Raster per 2x2-Matrix in die Iso-Lage
  for (const isl of world.islands) {
    const sil = cache.get(isl, l.scale);
    const o = tileToMap(l, isl.ox, isl.oy);
    const k = (32 * l.scale) / sil.r;
    ctx.save();
    ctx.transform(k, k / 2, -k, k / 2, o.x, o.y);
    ctx.drawImage(sil.image, 0, 0, sil.w, sil.h);
    ctx.restore();
  }

  // Kontor-Marke am Anker
  ctx.fillStyle = COLORS.kontor;
  for (const isl of world.islands) {
    if (isl.kontorId === null) continue;
    const m = tileToMap(l, isl.ox + isl.anchor.x + 0.5, isl.oy + isl.anchor.y + 0.5);
    ctx.fillRect(m.x - 2, m.y - 2, 4, 4);
  }

  // Hover: Rahmen um das Inselrechteck
  const hv = ui.hover !== null ? world.islands[ui.hover] : undefined;
  if (hv) {
    ctx.strokeStyle = COLORS.hover;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const c = [
      tileToMap(l, hv.ox, hv.oy),
      tileToMap(l, hv.ox + hv.width, hv.oy),
      tileToMap(l, hv.ox + hv.width, hv.oy + hv.height),
      tileToMap(l, hv.ox, hv.oy + hv.height),
    ];
    ctx.moveTo(c[0]!.x, c[0]!.y);
    for (let i = 1; i < 4; i++) ctx.lineTo(c[i]!.x, c[i]!.y);
    ctx.closePath();
    ctx.stroke();
  }

  // Schiffspunkte
  ctx.fillStyle = COLORS.dot;
  ctx.strokeStyle = COLORS.dotEdge;
  ctx.lineWidth = 1;
  for (const d of mapDots(world)) {
    const m = tileToMap(l, d.x, d.y);
    ctx.beginPath();
    ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
