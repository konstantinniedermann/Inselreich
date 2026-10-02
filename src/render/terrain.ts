import { hash2, valueNoise } from '../sim/noise';
import { layoutKey } from '../sim/queries';
import type { World } from '../sim/types';
import { TEX } from './iso';
import { FLOWER_TONES, SHRUB_TONES, flowersFor, shrubsFor } from './groundDecor';
import { FOREST_FLOOR, PALETTE, mixHex, rgbOf, rgbOfCss } from './palette';
import {
  COAST_BAND,
  EDGE_BAND,
  LAND,
  sampleField,
  terrainFields,
  warp,
  type TerrainFields,
} from './terrainField';

// terrain.ts — Terrain-Ebene (Spec 5.1, ISO §6). Keine Baumkronen: die kommen als Stempel aus trees.ts (D-08).
export const RASTER = 4; // Texturpixel (Faktor 1) je Rechenknoten (Setzung Spec 5.1)
const CHUNK = 512; // Ebenen-Pixel je ImageData-Block (begrenzt den Speicher)
const LIGHT = { x: -3 / Math.sqrt(10), y: -1 / Math.sqrt(10) }; // Richtung zum Licht im Kachelraum (D-11)
// R149: Abweichung zu M7-Spec 5.1 — Gebirge ±12 %, sonst ±8 %
const SHADE_MAX = 0.08;
const SHADE_MAX_MOUNTAIN = 0.12;
const SHADE_GAIN = 0.075; // Darstellungswert: Helligkeit je Höhengefälle pro Kachel (R149: mehr Plastik)
const FOOT_HEIGHT = 1.4; // Höhenanstieg am Gebirgsfuss (Bilinearfeld des Gebirgs-Indikators)
const MEADOW_WAVE = 0.3; // Amplitude der sanften Wiesenwelle in der Höhe
// Flecken im Pixelfeld (R149): Schwellen auf den gespreizten Rauschfeldern 0..1
const CLOVER_MAX = 0.75; // höchstens 60 % Mischung zum Kleegrün
const DRY_MAX = 0.35; // höchstens 35 % Mischung zu sandDry (darf nicht wie ein Weg aussehen)
const MOSS_MAX = 0.55;
const CLEARING_MAX = 0.5;
const FOREST_EDGE_LIGHT = 0.3; // Aufhellung des Waldbodens am Rand (Indikator ~0,5)
const WET_SAND = 0.18; // Spec 5.1: sandWet bei 0 ≤ s < 0,18
const FOAM_STATIC = 0.12; // Spec 5.1: statischer Schaumsaum bei −s < 0,12
const ROCK_EDGE: [number, number] = [0.5, 0.6]; // Spec 5.1: Kantenband des Fels-Indikators

export interface TileRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
} // inklusive

// ---------- reine Helfer ----------

/** 1 für Kacheln mit Gebäude oder Weg. */
export function occupancy(world: Pick<World, 'width' | 'height' | 'tiles'>): Uint8Array {
  const occ = new Uint8Array(world.width * world.height);
  for (let i = 0; i < occ.length; i++) {
    const t = world.tiles[i]!;
    occ[i] = t.buildingId !== null || t.road ? 1 : 0;
  }
  return occ;
}

/** Geänderte Kacheln plus 1 Kachel Rand, auf die Karte geklemmt; null, wenn nichts geändert ist. */
export function dirtyRect(
  prev: Uint8Array,
  next: Uint8Array,
  w: number,
  h: number,
): TileRect | null {
  let x0 = w,
    y0 = h,
    x1 = -1,
    y1 = -1;
  for (let i = 0; i < w * h; i++)
    if (prev[i] !== next[i]) {
      const x = i % w,
        y = (i / w) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  if (x1 < 0) return null;
  return {
    x0: Math.max(0, x0 - 1),
    y0: Math.max(0, y0 - 1),
    x1: Math.min(w - 1, x1 + 1),
    y1: Math.min(h - 1, y1 + 1),
  };
}

/** Teil-Neuzeichnung nur für dieselbe Welt und bei geändertem Layout-Schlüssel (RF-2). */
export function shouldPatch(
  meta: { world: unknown; key: string },
  world: unknown,
  key: string,
): boolean {
  return meta.world === world && key !== meta.key;
}

/** Grösse der Ebene und ihrer halben Kopie in Pixeln (AK-ISO-19). */
export function terrainLayerSize(
  world: Pick<World, 'width' | 'height'>,
  scale: number,
): { w: number; h: number }[] {
  const w = Math.round(world.width * TEX * scale),
    h = Math.round(world.height * TEX * scale);
  return [
    { w, h },
    { w: Math.ceil(w / 2), h: Math.ceil(h / 2) },
  ];
}

/** Büschel einer Grasskachel in Kachel-Anteilen (0,1…0,9), deterministisch; `tone` 0 hell, 1 dunkel. */
export function tuftsFor(
  seed: number,
  x: number,
  y: number,
): { x: number; y: number; tone: 0 | 1 }[] {
  const n = Math.floor(hash2(seed + 31, x, y) * 3); // 0..2
  const out: { x: number; y: number; tone: 0 | 1 }[] = [];
  for (let k = 0; k < n; k++)
    out.push({
      x: 0.1 + 0.8 * hash2(seed + 32 + k * 3, x, y),
      y: 0.1 + 0.8 * hash2(seed + 33 + k * 3, x, y),
      tone: hash2(seed + 34 + k * 3, x, y) < 0.5 ? 0 : 1,
    });
  return out;
}

// ---------- Knotengitter und Pixel ----------

export type World3 = Pick<World, 'width' | 'height' | 'tiles' | 'seed'>;
export interface TerrainGrid {
  seed: number;
  nx: number;
  ny: number;
  sharp: Float32Array; // Küstenwert mit Plateau (Klassifikation Wasser/Land)
  smooth: Float32Array; // Küstenwert bilinear (Tiefe, Strand)
  ind: Float32Array[]; // Land-Indikatoren in der Reihenfolge von LAND
  grass: Float32Array; // Grasmischung 0..1
  rock: Float32Array; // Felsrauschen 0..1
  shade: Float32Array; // Relief −0,08…0,08 (Gebirgsknoten −0,12…0,12, R149)
  /**
   * Fleckenfeld −1…1 (R149, vorgeformt, Rauschen um 0 gespreizt): positiv Klee auf Gras bzw. Moos im Wald, negativ
   * trockene Stellen auf Gras bzw. Lichtungen im Wald. Ein Feld statt zwei spart Rechenzeit im Frame-Budget.
   */
  patch: Float32Array;
  cls: Uint8Array; // 0 Wasser, 1 + Index in LAND
}

const smoothstepClamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Rechnet alle Felder auf dem groben Raster (alle `RASTER` Texturpixel ein Knoten). */
export function buildGrid(
  world: World3,
  fields: TerrainFields = terrainFields(world),
): TerrainGrid {
  const nx = (world.width * TEX) / RASTER + 1,
    ny = (world.height * TEX) / RASTER + 1;
  const n = nx * ny;
  const sharp = new Float32Array(n),
    smooth = new Float32Array(n),
    grass = new Float32Array(n),
    rock = new Float32Array(n),
    shade = new Float32Array(n),
    patch = new Float32Array(n),
    height = new Float32Array(n),
    cls = new Uint8Array(n);
  const ind = LAND.map(() => new Float32Array(n));
  const seed = world.seed;
  const mt = LAND.indexOf('mountain');
  const step = RASTER / TEX;
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const k = j * nx + i;
      const fx = i * step,
        fy = j * step;
      const [wx, wy] = warp(seed, fx, fy);
      sharp[k] = sampleField(fields.coast, wx, wy, COAST_BAND);
      smooth[k] = sampleField(fields.coast, wx, wy);
      let best = 0,
        bestV = -Infinity;
      for (let t = 0; t < LAND.length; t++) {
        const v = sampleField(fields.types[LAND[t]!], wx, wy, EDGE_BAND);
        ind[t]![k] = v;
        if (v > bestV) {
          bestV = v;
          best = t;
        }
      }
      cls[k] = sharp[k]! <= 0 ? 0 : 1 + best;
      const m =
        0.65 * valueNoise(seed + 11, fx * 0.35, fy * 0.35) +
        0.35 * valueNoise(seed + 13, fx * 1.1, fy * 1.1);
      grass[k] = smoothstepClamp((m - 0.5) * 1.8 + 0.5); // Spreizung: das Rauschen liegt eng um 0,5
      // Felsrauschen: gespreizt (das Rauschen liegt eng um 0,5) und mit ~1,7 Merkmalen je Kachel, damit jede Felskachel Licht und Schatten zeigt
      rock[k] = smoothstepClamp((valueNoise(seed + 19, fx * 1.7, fy * 1.7) - 0.5) * 2.4 + 0.5);
      // R149: sanfter Anstieg am Gebirgsfuss (bilinear über eine ganze Kachel) und tiefe Wiesenwelle
      const foot = sampleField(fields.types.mountain, wx, wy);
      if (cls[k] !== 0) {
        // nur an Landknoten (Wasser braucht keine Flecken); Wert schon geformt, das Pixelfeld interpoliert nur
        patch[k] = Math.max(
          -1,
          Math.min(1, (valueNoise(seed + 62, fx * 1.4, fy * 1.4) - 0.5) * 10),
        );
      }
      height[k] =
        smooth[k]! +
        2 * ind[mt]![k]! +
        FOOT_HEIGHT * foot +
        0.5 * valueNoise(seed + 17, fx * 0.5, fy * 0.5) +
        MEADOW_WAVE * valueNoise(seed + 61, fx * 0.3, fy * 0.3);
    }
  // Relief: Gefälle von h gegen die Lichtrichtung (links oben im Kachelraum)
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++) {
      const il = Math.max(0, i - 1),
        ir = Math.min(nx - 1, i + 1),
        ju = Math.max(0, j - 1),
        jd = Math.min(ny - 1, j + 1);
      const gx = (height[j * nx + ir]! - height[j * nx + il]!) / ((ir - il) * step);
      const gy = (height[jd * nx + i]! - height[ju * nx + i]!) / ((jd - ju) * step);
      const lit = -(gx * LIGHT.x + gy * LIGHT.y);
      const lim = cls[j * nx + i] === mt + 1 ? SHADE_MAX_MOUNTAIN : SHADE_MAX;
      shade[j * nx + i] = Math.max(-lim, Math.min(lim, lit * SHADE_GAIN));
    }
  return { seed, nx, ny, sharp, smooth, ind, grass, rock, shade, patch, cls };
}

const rgb = (hex: string): [number, number, number] => rgbOf(hex);
const C = {
  deep: rgb(PALETTE.waterDeep),
  mid: rgb(PALETTE.waterMid),
  shallow: rgb(PALETTE.waterShallow),
  foam: rgb(PALETTE.foam),
  sandDry: rgb(PALETTE.sandDry),
  sandWet: rgb(PALETTE.sandWet),
  grassLight: rgb(PALETTE.grassLight),
  grass: rgb(PALETTE.grass),
  grassDark: rgb(PALETTE.grassDark),
  wood: rgbOfCss(FOREST_FLOOR),
  clover: rgbOfCss(mixHex(PALETTE.grass, PALETTE.waterShallow, 0.3)), // kühleres Grün (R149)
  moss: rgbOfCss(mixHex(FOREST_FLOOR, PALETTE.crown, 0.55)),
  clearing: rgbOfCss(mixHex(FOREST_FLOOR, PALETTE.sandDry, 0.45)),
  edgeLight: rgb(PALETTE.sandWet), // warmes Hell am Waldrand: bleibt fern vom alten Waldgrund #3d7a3a
  rock: rgb(PALETTE.rock),
  rockLight: rgb(PALETTE.rockLight),
  rockDark: rgb(PALETTE.rockDark),
};
const mix3 = (a: number[], b: number[], t: number, o: number[]): void => {
  o[0] = a[0]! + (b[0]! - a[0]!) * t;
  o[1] = a[1]! + (b[1]! - a[1]!) * t;
  o[2] = a[2]! + (b[2]! - a[2]!) * t;
};

/** Wasserfarbe nach Tiefe `d` in Kacheln: < 1 flach, 3 mittel, ab 6 tief, dazwischen linear (Spec 5.1). */
function waterColor(d: number, o: number[]): void {
  if (d <= 1) mix3(C.shallow, C.shallow, 0, o);
  else if (d < 3) mix3(C.shallow, C.mid, (d - 1) / 2, o);
  else if (d < 6) mix3(C.mid, C.deep, (d - 3) / 3, o);
  else mix3(C.deep, C.deep, 0, o);
  if (d < FOAM_STATIC) mix3(o, C.foam, 0.6, o);
}

/**
 * Pixel eines Ausschnitts der Ebene (RGBA). `px0/py0/w/h` in Ebenenpixeln, `scale` = Auflösungsfaktor. Rein, ohne Canvas.
 */
export function paintPixels(
  g: TerrainGrid,
  scale: number,
  px0: number,
  py0: number,
  w: number,
  h: number,
  out: Uint8ClampedArray = new Uint8ClampedArray(w * h * 4),
): Uint8ClampedArray {
  const { nx, ny, sharp, smooth, ind, grass, rock, shade, patch, cls } = g;
  const fo = LAND.indexOf('forest');
  const col = [0, 0, 0];
  const mt = LAND.indexOf('mountain');
  for (let py = 0; py < h; py++) {
    const gy = (py0 + py + 0.5) / scale / RASTER;
    const j = Math.min(Math.max(Math.floor(gy), 0), ny - 2);
    const ty = Math.min(Math.max(gy - j, 0), 1);
    for (let px = 0; px < w; px++) {
      const gx = (px0 + px + 0.5) / scale / RASTER;
      const i = Math.min(Math.max(Math.floor(gx), 0), nx - 2);
      const tx = Math.min(Math.max(gx - i, 0), 1);
      const a = j * nx + i,
        b = a + 1,
        c = a + nx,
        d = c + 1;
      const w00 = (1 - tx) * (1 - ty),
        w10 = tx * (1 - ty),
        w01 = (1 - tx) * ty,
        w11 = tx * ty;
      const lerp = (f: Float32Array): number =>
        f[a]! * w00 + f[b]! * w10 + f[c]! * w01 + f[d]! * w11;
      let type: number; // -1 Wasser, sonst Index in LAND
      const c0 = cls[a]!;
      if (c0 === cls[b] && c0 === cls[c] && c0 === cls[d]) type = c0 - 1;
      else if (lerp(sharp) <= 0) type = -1;
      else {
        let best = 0,
          bestV = -Infinity;
        for (let t = 0; t < LAND.length; t++) {
          const v = lerp(ind[t]!);
          if (v > bestV) {
            bestV = v;
            best = t;
          }
        }
        type = best;
      }
      if (type < 0) {
        waterColor(Math.max(0, -lerp(smooth)), col);
      } else {
        let sh = lerp(shade);
        if (LAND[type] !== 'mountain') sh = Math.max(-SHADE_MAX, Math.min(SHADE_MAX, sh)); // R149: Rand trägt keine 12 %
        switch (LAND[type]) {
          case 'sand': {
            const s = lerp(smooth);
            mix3(C.sandWet, C.sandDry, smoothstepClamp((s - WET_SAND) / 0.06), col);
            break;
          }
          case 'grass': {
            const m = lerp(grass);
            if (m < 0.4) mix3(C.grassDark, C.grass, m / 0.4, col);
            else mix3(C.grass, C.grassLight, (m - 0.4) / 0.6, col);
            const p = lerp(patch);
            if (p > 0.1) mix3(col, C.clover, (p - 0.1) * CLOVER_MAX, col);
            else if (p < -0.1) mix3(col, C.sandDry, (-0.1 - p) * DRY_MAX, col);
            break;
          }
          case 'forest': {
            const p = lerp(patch);
            const edge = smoothstepClamp((1 - lerp(ind[fo]!)) * 2); // innen 0, Rand ~1 (Indikator ~0,5)
            if (p > 0) mix3(C.wood, C.moss, p * MOSS_MAX, col);
            else mix3(C.wood, C.clearing, -p * CLEARING_MAX, col);
            if (edge > 0) mix3(col, C.edgeLight, edge * FOREST_EDGE_LIGHT, col);
            break;
          }
          default: {
            const im = lerp(ind[mt]!);
            const n = lerp(rock);
            if (im >= ROCK_EDGE[0] && im < ROCK_EDGE[1])
              mix3(sh >= 0 ? C.rockLight : C.rockDark, sh >= 0 ? C.rockLight : C.rockDark, 0, col);
            else if (n > 0.62) mix3(C.rock, C.rockLight, smoothstepClamp((n - 0.62) / 0.2), col);
            else if (n < 0.38) mix3(C.rock, C.rockDark, smoothstepClamp((0.38 - n) / 0.2), col);
            else mix3(C.rock, C.rock, 0, col);
          }
        }
        const f = 1 + sh;
        col[0] = col[0]! * f;
        col[1] = col[1]! * f;
        col[2] = col[2]! * f;
      }
      const o = (py * w + px) * 4;
      out[o] = col[0]!;
      out[o + 1] = col[1]!;
      out[o + 2] = col[2]!;
      out[o + 3] = 255;
    }
  }
  return out;
}

// ---------- Canvas-Hülle ----------

interface TerrainMeta {
  world: World;
  scale: number;
  grid: TerrainGrid;
  occ: Uint8Array;
  key: string;
  half: HTMLCanvasElement | null;
  buildMs: number;
}
const meta = new WeakMap<HTMLCanvasElement, TerrainMeta>();

function paintRegion(
  ctx: CanvasRenderingContext2D,
  grid: TerrainGrid,
  scale: number,
  px0: number,
  py0: number,
  w: number,
  h: number,
): void {
  for (let y = 0; y < h; y += CHUNK) {
    const ch = Math.min(CHUNK, h - y);
    const img = ctx.createImageData(w, ch);
    paintPixels(grid, scale, px0, py0 + y, w, ch, img.data);
    ctx.putImageData(img, px0, py0 + y);
  }
}

/** Kachel ist unbelegtes Gras. */
const isFreeGrass = (world: World, occ: Uint8Array, x: number, y: number): boolean => {
  const i = y * world.width + x;
  return world.tiles[i]!.terrain === 'grass' && occ[i] !== 1;
};

/**
 * Deko auf unbelegten Grasskacheln im Rechteck (Texturpixel × `scale`): Büschel, Büsche am Waldrand, Blumen.
 * Je Farbe ein Pfad; belegte Kacheln und Nicht-Gras bekommen nichts (R149).
 */
export function paintDecor(
  ctx: CanvasRenderingContext2D,
  world: World,
  occ: Uint8Array,
  scale: number,
  r: TileRect,
): void {
  const { width: w, height: h, seed } = world;
  const forestAt = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < w && y < h && world.tiles[y * w + x]!.terrain === 'forest';
  ctx.save();
  ctx.scale(scale, scale);
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  const tones = [PALETTE.grassLight, mixHex(PALETTE.grassDark, PALETTE.grass, 0.4)];
  for (const tone of [0, 1] as const) {
    ctx.beginPath();
    for (let y = r.y0; y <= r.y1; y++)
      for (let x = r.x0; x <= r.x1; x++) {
        if (!isFreeGrass(world, occ, x, y)) continue;
        for (const t of tuftsFor(seed, x, y)) {
          if (t.tone !== tone) continue;
          const px = (x + t.x) * TEX,
            py = (y + t.y) * TEX;
          ctx.moveTo(px - 1.5, py);
          ctx.lineTo(px - 0.5, py - 3.5);
          ctx.moveTo(px, py);
          ctx.lineTo(px, py - 4.5);
          ctx.moveTo(px + 1.5, py);
          ctx.lineTo(px + 0.5, py - 3.5);
        }
      }
    ctx.strokeStyle = tones[tone]!;
    ctx.stroke();
  }
  // flache Büsche auf der Waldseite
  for (const tone of [0, 1] as const) {
    ctx.beginPath();
    let any = false;
    for (let y = r.y0; y <= r.y1; y++)
      for (let x = r.x0; x <= r.x1; x++) {
        if (!isFreeGrass(world, occ, x, y)) continue;
        const sides = {
          left: forestAt(x - 1, y),
          right: forestAt(x + 1, y),
          up: forestAt(x, y - 1),
          down: forestAt(x, y + 1),
        };
        if (!(sides.left || sides.right || sides.up || sides.down)) continue;
        for (const b of shrubsFor(seed, x, y, sides)) {
          if (b.tone !== tone) continue;
          const px = (x + b.x) * TEX,
            py = (y + b.y) * TEX,
            rx = b.r * TEX;
          ctx.moveTo(px + rx, py);
          ctx.ellipse(px, py, rx, rx * 0.6, 0, 0, Math.PI * 2);
          any = true;
        }
      }
    if (!any) continue;
    ctx.fillStyle = SHRUB_TONES[tone]!;
    ctx.fill();
  }
  // Blumen: kleine Punkte
  for (const tone of [0, 1, 2] as const) {
    ctx.beginPath();
    let any = false;
    for (let y = r.y0; y <= r.y1; y++)
      for (let x = r.x0; x <= r.x1; x++) {
        if (!isFreeGrass(world, occ, x, y)) continue;
        for (const f of flowersFor(seed, x, y))
          if (f.tone === tone) {
            ctx.rect((x + f.x) * TEX, (y + f.y) * TEX, f.size, f.size);
            any = true;
          }
      }
    if (!any) continue;
    ctx.fillStyle = FLOWER_TONES[tone]!;
    ctx.fill();
  }
  ctx.restore();
}

/** Standard-Auflösungsfaktor aus dem `devicePixelRatio` (Spec 5.1, Tech B3): ab 1,5 doppelt, sonst einfach. */
export const defaultTerrainScale = (
  dpr: number | undefined = (globalThis as { devicePixelRatio?: number }).devicePixelRatio,
): number => ((dpr ?? 1) >= 1.5 ? 2 : 1);

/** Baut die Terrain-Ebene einmal je Welt: Canvas `width·TEX·scale`; Aufbau gemessen. */
export function buildTerrainLayer(world: World, scale = defaultTerrainScale()): HTMLCanvasElement {
  const t0 = performance.now();
  const { w, h } = terrainLayerSize(world, scale)[0]!;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D-Kontext nicht verfügbar');
  const grid = buildGrid(world);
  paintRegion(ctx, grid, scale, 0, 0, w, h);
  const occ = occupancy(world);
  paintDecor(ctx, world, occ, scale, { x0: 0, y0: 0, x1: world.width - 1, y1: world.height - 1 });
  const buildMs = performance.now() - t0;
  meta.set(canvas, { world, scale, grid, occ, key: layoutKey(world), half: null, buildMs });
  if (import.meta.env.DEV)
    console.info('[terrain] Aufbau', Math.round(buildMs), 'ms, Faktor', scale);
  return canvas;
}

export const terrainScale = (layer: HTMLCanvasElement): number => meta.get(layer)?.scale ?? 1;
export const terrainBuildMs = (layer: HTMLCanvasElement): number => meta.get(layer)?.buildMs ?? 0;

/**
 * Zeichnet bei geänderter Belegung (Gebäude, Wege) nur die betroffenen Kacheln plus 1 Kachel Rand neu.
 * Eine fremde Welt auf dieser Ebene zeichnet nichts neu (RF-2).
 */
export function updateTerrainLayer(
  layer: HTMLCanvasElement,
  world: World,
): { redrawn: boolean; ms: number } {
  const m = meta.get(layer);
  if (!m) return { redrawn: false, ms: 0 };
  const key = layoutKey(world);
  if (!shouldPatch(m, world, key)) return { redrawn: false, ms: 0 };
  const t0 = performance.now();
  const next = occupancy(world);
  const rect = dirtyRect(m.occ, next, world.width, world.height);
  m.key = key;
  m.occ = next;
  if (!rect) return { redrawn: false, ms: performance.now() - t0 };
  const ctx = layer.getContext('2d');
  if (!ctx) return { redrawn: false, ms: 0 };
  const s = TEX * m.scale;
  const px = Math.round(rect.x0 * s),
    py = Math.round(rect.y0 * s);
  const pw = Math.round((rect.x1 + 1) * s) - px,
    ph = Math.round((rect.y1 + 1) * s) - py;
  paintRegion(ctx, m.grid, m.scale, px, py, pw, ph);
  paintDecor(ctx, world, next, m.scale, rect);
  if (m.half) {
    const hc = m.half.getContext('2d');
    if (hc) {
      hc.imageSmoothingQuality = 'high';
      hc.clearRect(px / 2, py / 2, pw / 2, ph / 2);
      hc.drawImage(layer, px, py, pw, ph, px / 2, py / 2, pw / 2, ph / 2);
    }
  }
  return { redrawn: true, ms: performance.now() - t0 };
}

/** Einmal vorskalierte Kopie mit halber Kantenlänge (Zoom ≤ 0,5, AK-ISO-19). */
export function halfLayer(layer: HTMLCanvasElement): HTMLCanvasElement {
  const m = meta.get(layer);
  if (m?.half) return m.half;
  const half = document.createElement('canvas');
  half.width = Math.ceil(layer.width / 2);
  half.height = Math.ceil(layer.height / 2);
  const ctx = half.getContext('2d');
  if (ctx) {
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(layer, 0, 0, layer.width, layer.height, 0, 0, half.width, half.height);
  }
  if (m) m.half = half;
  return half;
}
