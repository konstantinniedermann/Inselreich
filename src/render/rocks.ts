import { worldToScreen, type Camera } from './camera';
import { ISO_H, ISO_W, ZOOM_STEPS, zoomStep, type Box, type Pt, type SortedItem } from './iso';
import { MASSIF_BUILDS_PER_FRAME, MASSIF_CACHE_MAX_BYTES } from './limits';
import { hash2 } from '../sim/noise';
import { SUB, pieceHeight, pieceMesh, type MassifPiece, type MeshCell } from './massif';

// rocks.ts — Canvas-Hülle des Gebirgsmassivs (H-R9 Teil A, A4–A7): projiziert das Netz eines Teilstücks
// (`massif.ts`), malt es einmal je Zoomstufe und Geräte-DPR in eine Offscreen-Fläche (LRU mit Bytegrenze) und
// stempelt sie im sortierten Objektdurchgang auf ihren Halbstreifen. Liest die Welt nur.

export type MassifItem = Extract<SortedItem, { kind: 'massif' }>;

const STRIP = ISO_W / 2; // Bildbreite eines Halbstreifens (Weltpixel)
const NX = ISO_W / 2 / SUB,
  NY = ISO_H / 2 / SUB; // Bildversatz je Knotenschritt
/** Rand der Fläche über und unter der Silhouette (Weltpixel): Platz für die vergrösserten Zellen. */
const PAD = 2;
/** Bildpunkt (Weltpixel) des Knotens (I, J) in Höhe h. */
const nodePt = (I: number, J: number, h: number): Pt => ({ x: (I - J) * NX, y: (I + J) * NY - h });

/** Dreiecke einer Zelle (Eckindizes 0 hinten, 1 rechts, 2 vorn, 3 links), entlang der höheren Diagonale geteilt. */
type Corner = 0 | 1 | 2 | 3;
const cellTris = (n: MeshCell['n']): readonly (readonly [Corner, Corner, Corner])[] =>
  n[1].h + n[3].h >= n[0].h + n[2].h
    ? [
        [3, 0, 1],
        [3, 1, 2],
      ]
    : [
        [0, 1, 2],
        [0, 2, 3],
      ];

/**
 * Zellen eines Teilstücks als Bilddreiecke (Weltpixel), hinten nach vorn. Jede Zelle wird entlang der höheren
 * Diagonale geteilt: ein Grat bleibt gerade Kante, ein Kamm quer zum Raster sägt nicht. `fill` = Mittel der Ecken.
 */
export function pieceQuads(p: MassifPiece): { pts: Pt[]; fill: string; alpha: number }[] {
  const out: { pts: Pt[]; fill: string; alpha: number }[] = [];
  for (const c of pieceMesh(p)) {
    const v = [
      nodePt(c.I, c.J, c.n[0].h),
      nodePt(c.I + 1, c.J, c.n[1].h),
      nodePt(c.I + 1, c.J + 1, c.n[2].h),
      nodePt(c.I, c.J + 1, c.n[3].h),
    ];
    for (const t of cellTris(c.n)) {
      const m = [0, 1, 2].map((k) => (c.n[t[0]].c[k]! + c.n[t[1]].c[k]! + c.n[t[2]].c[k]!) / 3);
      out.push({
        pts: t.map((k) => v[k]!),
        fill: `rgb(${Math.round(m[0]!)},${Math.round(m[1]!)},${Math.round(m[2]!)})`,
        alpha: Math.min(c.n[t[0]].a, c.n[t[1]].a, c.n[t[2]].a),
      });
    }
  }
  return out;
}

const silhouettes = new WeakMap<MassifPiece, Pt[]>();
/**
 * Silhouette eines Teilstücks (Weltpixel): obere und untere Hülle der Knoten auf den fünf Knotenspalten des
 * Halbstreifens. Zwischen zwei Spalten liegt die Netzhülle unter der Sehne, das Polygon umschliesst also das Netz.
 * Für Verdeckung von Licht und Feuer (A7) und als Bildbox; gemerkt je Teilstück.
 */
export function massifSilhouette(item: MassifItem | { piece: MassifPiece }): Pt[] {
  const p = item.piece;
  const hit = silhouettes.get(p);
  if (hit) return hit;
  const W = p.comp.width;
  const top = new Array<number>(SUB + 1).fill(Infinity),
    bot = new Array<number>(SUB + 1).fill(-Infinity);
  for (const t of p.seam >= 0 ? [p.seam, ...p.tiles] : p.tiles) {
    const x = t % W,
      y = (t / W) | 0;
    for (let J = y * SUB; J <= (y + 1) * SUB; J++)
      for (let I = x * SUB; I <= (x + 1) * SUB; I++) {
        const m = I - J - SUB * p.strip;
        if (m < 0 || m > SUB) continue;
        const Y = (I + J) * NY - pieceHeight(p, I, J);
        if (Y < top[m]!) top[m] = Y;
        if (Y > bot[m]!) bot[m] = Y;
      }
  }
  const x0 = p.strip * STRIP;
  const out: Pt[] = [];
  for (let m = 0; m <= SUB; m++) out.push({ x: x0 + m * NX, y: top[m]! });
  for (let m = SUB; m >= 0; m--) out.push({ x: x0 + m * NX, y: bot[m]! });
  silhouettes.set(p, out);
  return out;
}

const boxes = new WeakMap<MassifPiece, Box>();
/** Bildbox eines Teilstücks (Weltpixel): Halbstreifen × Silhouette samt Rand. */
export function massifBounds(item: MassifItem | { piece: MassifPiece }): Box {
  const p = item.piece;
  let b = boxes.get(p);
  if (!b) {
    const s = massifSilhouette(item);
    let y0 = Infinity,
      y1 = -Infinity;
    for (const q of s) {
      y0 = Math.min(y0, q.y);
      y1 = Math.max(y1, q.y);
    }
    b = { x: p.strip * STRIP, y: y0 - PAD, w: STRIP, h: y1 - y0 + 2 * PAD };
    boxes.set(p, b);
  }
  return b;
}

/** Liegt die Bildbox des Teilstücks im Bild? (Culling je Teilstück, A6) */
export function massifOnScreen(
  cam: Pick<Camera, 'x' | 'y' | 'zoom'>,
  view: { w: number; h: number },
  item: MassifItem,
): boolean {
  const b = massifBounds(item);
  return (
    b.x + b.w >= cam.x &&
    b.x <= cam.x + view.w / cam.zoom &&
    b.y + b.h >= cam.y &&
    b.y <= cam.y + view.h / cam.zoom
  );
}

/** Silhouette in Bildschirmpixeln (Verdecker für Licht und Feuer). */
export const massifClips = (cam: Camera, item: MassifItem): Pt[] =>
  massifSilhouette(item).map((q) => worldToScreen(cam, q));

const STRATA = 0.11; // Schichtbänder je Weltpixel Höhe (Phase): alle ≈ 9 px eine feine Linie
const STRATA_DARK = 0.12; // Abdunklung im Band an steilen Wänden
const GRAIN = 0.05; // Pixelkorn ±2,5 % (wie ROCK_GRAIN der Geländeebene)
const TEX_N = 128; // Kantenlänge der Felstextur (Wertrauschen, kachelbar, einmal beim Laden)
const TEX_FINE = 1 / 3.5,
  TEX_COARSE = 1 / 11; // Texturzellen je Weltpixel: feines Korn und gröbere Brocken
const TEX_AMP = 0.16; // Helligkeit ±8 % (fein, an steilen Wänden stärker) plus ±5 % grob
/** Kachelbares Wertrauschen 0…1 (Gitter 16 × 16, geglättet auf TEX_N × TEX_N). */
const ROCK_TEX = (() => {
  const g = 16,
    out = new Float32Array(TEX_N * TEX_N);
  const at = (x: number, y: number): number => hash2(4711, ((x % g) + g) % g, ((y % g) + g) % g);
  for (let y = 0; y < TEX_N; y++)
    for (let x = 0; x < TEX_N; x++) {
      const u = (x / TEX_N) * g,
        v = (y / TEX_N) * g;
      const x0 = Math.floor(u),
        y0 = Math.floor(v);
      const tx = u - x0,
        ty = v - y0;
      const sx = tx * tx * (3 - 2 * tx),
        sy = ty * ty * (3 - 2 * ty);
      const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
      const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
      out[y * TEX_N + x] = a + (b - a) * sy;
    }
  return out;
})();
/** Textur bilinear an (u, v) in Texturpixeln, kachelnd. */
function tex(u: number, v: number): number {
  const x0 = Math.floor(u),
    y0 = Math.floor(v);
  const tx = u - x0,
    ty = v - y0;
  const m = TEX_N - 1;
  const xa = x0 & m,
    xb = (x0 + 1) & m,
    ya = (y0 & m) * TEX_N,
    yb = ((y0 + 1) & m) * TEX_N;
  const a = ROCK_TEX[ya + xa]! + (ROCK_TEX[ya + xb]! - ROCK_TEX[ya + xa]!) * tx;
  const b = ROCK_TEX[yb + xa]! + (ROCK_TEX[yb + xb]! - ROCK_TEX[yb + xa]!) * tx;
  return a + (b - a) * ty;
}

/** Bandform 0…1 je Phase (64 Stufen): schmale dunkle Linie mit weichem Rand. */
const BAND = Float32Array.from({ length: 64 }, (_, i) => {
  const v = 0.5 + 0.5 * Math.cos((i / 64) * 2 * Math.PI);
  return v * v * v * v;
});

/**
 * Rastert ein Teilstück (RGBA, `w` × `h` Pixel, Halbstreifen auf `w` Pixel, senkrecht Faktor `f`): Dreiecke hinten
 * nach vorn mit Gouraud-Farben, je Pixel Schichtbänder nach Höhe an steilen Wänden und Korn. Innenkanten sind lückenlos
 * (Pixelmitten, Kanten inklusive), es gibt keine Antialias-Fugen; die Aussenkante wird bei kleinem Faktor 2 × 2
 * überabgetastet. Rein, ohne Canvas.
 */
export function rasterPiece(
  item: MassifItem | { piece: MassifPiece },
  w: number,
  h: number,
  f: number,
): Uint8ClampedArray {
  const ss = f < 1.5 ? 2 : 1;
  const W = w * ss,
    H = h * ss;
  const b = massifBounds(item);
  const sx = (w / STRIP) * ss,
    sy = f * ss;
  const buf = new Uint8ClampedArray(W * H * 4);
  const seed = item.piece.comp.seed;
  const px = new Float64Array(4),
    py = new Float64Array(4);
  for (const c of pieceMesh(item.piece)) {
    const I = [c.I, c.I + 1, c.I + 1, c.I],
      J = [c.J, c.J, c.J + 1, c.J + 1];
    for (let k = 0; k < 4; k++) {
      px[k] = ((I[k]! - J[k]!) * NX - b.x) * sx;
      py[k] = ((I[k]! + J[k]!) * NY - c.n[k]!.h - b.y) * sy;
    }
    for (const t of cellTris(c.n)) triangle(buf, W, H, px, py, t, c.n, seed, b.x, b.y, sx, sy);
  }
  if (ss === 1) {
    // ImageData erwartet unvormultiplizierte Farben (nur im Sockelband nötig)
    for (let o = 0; o < buf.length; o += 4) {
      const al = buf[o + 3]!;
      if (al > 0 && al < 255) {
        const k = 255 / al;
        buf[o] = buf[o]! * k;
        buf[o + 1] = buf[o + 1]! * k;
        buf[o + 2] = buf[o + 2]! * k;
      }
    }
    return buf;
  }
  const out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let r = 0,
        g = 0,
        bl = 0,
        a = 0;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const i = ((2 * y + dy) * W + 2 * x + dx) * 4;
          r += buf[i]!;
          g += buf[i + 1]!;
          bl += buf[i + 2]!;
          a += buf[i + 3]!;
        }
      const o = (y * w + x) * 4;
      if (a > 0) {
        const k = 255 / a; // Quelle ist vormultipliziert (transparent = 0, 0, 0, 0)
        out[o] = r * k;
        out[o + 1] = g * k;
        out[o + 2] = bl * k;
        out[o + 3] = a / 4;
      }
    }
  return out;
}

/** Ein Dreieck in den Puffer (Pixelmitten inklusive Kante), Gouraud plus Schichtband und Korn. */
function triangle(
  buf: Uint8ClampedArray,
  W: number,
  H: number,
  px: Float64Array,
  py: Float64Array,
  t: readonly [Corner, Corner, Corner],
  n: MeshCell['n'],
  seed: number,
  ox: number,
  oy: number,
  sx: number,
  sy: number,
): void {
  const [i0, i1, i2] = t;
  const x0 = px[i0]!,
    y0 = py[i0]!,
    x1 = px[i1]!,
    y1 = py[i1]!,
    x2 = px[i2]!,
    y2 = py[i2]!;
  const area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  if (Math.abs(area) < 1e-9) return;
  const minX = Math.max(0, Math.floor(Math.min(x0, x1, x2))),
    maxX = Math.min(W - 1, Math.ceil(Math.max(x0, x1, x2))),
    minY = Math.max(0, Math.floor(Math.min(y0, y1, y2))),
    maxY = Math.min(H - 1, Math.ceil(Math.max(y0, y1, y2)));
  const a = n[i0],
    b = n[i1],
    c = n[i2];
  const eps = -1e-7;
  for (let y = minY; y <= maxY; y++) {
    const yc = y + 0.5;
    for (let x = minX; x <= maxX; x++) {
      const xc = x + 0.5;
      const w0 = ((x1 - xc) * (y2 - yc) - (x2 - xc) * (y1 - yc)) / area;
      if (w0 < eps) continue;
      const w1 = ((x2 - xc) * (y0 - yc) - (x0 - xc) * (y2 - yc)) / area;
      if (w1 < eps) continue;
      const w2 = 1 - w0 - w1;
      if (w2 < eps) continue;
      const hh = a.h * w0 + b.h * w1 + c.h * w2;
      const st = a.steep * w0 + b.steep * w1 + c.steep * w2;
      const ph = hh * STRATA + a.warp * w0 + b.warp * w1 + c.warp * w2;
      const band = BAND[Math.floor((ph - Math.floor(ph)) * 64) & 63]!;
      const gr = 1 + (hash2(seed + 23, x, y) - 0.5) * GRAIN;
      // Felstextur in Weltpixeln (stetig über Streifen und Zoomstufen), an steilen Wänden kräftiger
      const wx = ox + xc / sx,
        wy = oy + yc / sy;
      const tf = tex(wx * TEX_FINE * 4, wy * TEX_FINE * 4) - 0.5,
        tc = tex(wx * TEX_COARSE * 4 + 37, wy * TEX_COARSE * 4 + 91) - 0.5;
      const k =
        (1 - STRATA_DARK * st * st * band) * gr * (1 + TEX_AMP * (tf * (0.5 + st) + 0.6 * tc)); // Bänder nur an steilen Wänden
      const o = (y * W + x) * 4;
      const r = (a.c[0] * w0 + b.c[0] * w1 + c.c[0] * w2) * k,
        g = (a.c[1] * w0 + b.c[1] * w1 + c.c[1] * w2) * k,
        bl = (a.c[2] * w0 + b.c[2] * w1 + c.c[2] * w2) * k;
      const al = a.a * w0 + b.a * w1 + c.a * w2;
      if (al >= 0.999) {
        buf[o] = r;
        buf[o + 1] = g;
        buf[o + 2] = bl;
        buf[o + 3] = 255;
      } else {
        // „über“ das schon Gezeichnete (Sockelband): Puffer vormultipliziert
        const keep = 1 - al;
        buf[o] = r * al + buf[o]! * keep;
        buf[o + 1] = g * al + buf[o + 1]! * keep;
        buf[o + 2] = bl * al + buf[o + 2]! * keep;
        buf[o + 3] = 255 * al + buf[o + 3]! * keep;
      }
    }
  }
}

/** Malt ein Teilstück in seine Fläche (`w` × `h` Pixel) über ImageData; ohne ImageData (Fake-Kontext) nichts. */
export function paintPiece(
  ctx: CanvasRenderingContext2D,
  item: MassifItem | { piece: MassifPiece },
  w: number,
  h: number,
  f: number,
): void {
  const img = (
    ctx.createImageData as ((w: number, h: number) => ImageData | undefined) | undefined
  )?.(w, h);
  if (!img) return;
  img.data.set(rasterPiece(item, w, h, f));
  ctx.putImageData(img, 0, 0);
}

let makeCanvas: () => HTMLCanvasElement | null = () =>
  typeof document === 'undefined' ? null : document.createElement('canvas');
/** Fabrik für die Offscreen-Flächen des Standard-Caches; im Node-Test ein Fake (ohne `document` kein Massiv). */
export function setMassifCanvasFactory(fn: () => HTMLCanvasElement | null): void {
  makeCanvas = fn;
}

export interface MassifCacheStats {
  hits: number;
  misses: number;
  /** Aufrufe, die eine Fläche einer anderen Zoomstufe skaliert zeigten (Baubudget des Frames erschöpft). */
  fallbacks: number;
  /** Im letzten Frame gestempelte Teilstücke. */
  draws: number;
  entries: number;
  bytes: number;
}
interface Entry {
  surface: HTMLCanvasElement;
  bytes: number;
  w: number;
  h: number;
  f: number;
  frame: number;
}

/**
 * Cache der Teilstück-Flächen je (Teilstück, Zoomstufe, DPR), LRU mit Bytegrenze (A6). Einträge des laufenden
 * Frames werden nie verdrängt; passt eine neue Fläche nicht mehr unter die Grenze, wird sie gezeichnet und
 * verworfen. Je Frame höchstens `buildsPerFrame` neue Flächen, solange eine andere Zoomstufe als Ersatz da ist.
 */
export function createMassifCache(
  opts: {
    factory?: () => HTMLCanvasElement | null;
    maxBytes?: number;
    buildsPerFrame?: number;
  } = {},
) {
  const maxBytes = opts.maxBytes ?? MASSIF_CACHE_MAX_BYTES;
  const budget = opts.buildsPerFrame ?? MASSIF_BUILDS_PER_FRAME;
  const factory = (): HTMLCanvasElement | null => (opts.factory ?? makeCanvas)();
  const map = new Map<string, Entry>(); // Einfügereihenfolge = LRU
  let bytes = 0,
    frame = 0,
    dpr = 1,
    builds = 0;
  const st = { hits: 0, misses: 0, fallbacks: 0, draws: 0 };
  const keyOf = (p: MassifPiece, step: number): string =>
    `${p.key}|${step}|${Math.round(dpr * 1000)}`;

  function release(e: Entry): void {
    e.surface.width = 0;
    e.surface.height = 0;
  }
  /** Verdrängt die ältesten Einträge ausserhalb des laufenden Frames, bis `room` Bytes passen. */
  function makeRoom(room: number): boolean {
    for (const [k, e] of map) {
      if (bytes + room <= maxBytes) break;
      if (e.frame === frame) continue;
      map.delete(k);
      release(e);
      bytes -= e.bytes;
    }
    return bytes + room <= maxBytes;
  }
  function build(item: MassifItem, step: number): Entry | null {
    const surface = factory();
    if (!surface) return null;
    const f = step * dpr;
    const b = massifBounds(item);
    const w = Math.max(1, Math.round(STRIP * f)),
      h = Math.max(1, Math.ceil(b.h * f));
    surface.width = w;
    surface.height = h;
    const c = surface.getContext('2d');
    if (!c) return null;
    paintPiece(c, item, w, h, f);
    return { surface, bytes: w * h * 4, w, h, f, frame };
  }
  function stamp(ctx: CanvasRenderingContext2D, cam: Camera, item: MassifItem, e: Entry): void {
    // Streifenkanten auf Gerätepixel: Nachbarstreifen teilen ihre Kante exakt, keine Naht beim Zwischenzoom
    const z = cam.zoom,
      b = massifBounds(item);
    const snap = (v: number): number => Math.round(v * z * dpr) / dpr;
    const l = snap(b.x - cam.x),
      r = snap(b.x + STRIP - cam.x),
      t = snap(b.y - cam.y);
    ctx.drawImage(e.surface, l, t, r - l, (e.h / e.f) * z);
    st.draws++;
  }

  return {
    /** Vor den Teilstücken eines Frames, mit der Geräte-DPR des Zielkontexts. */
    beginFrame(d: number): void {
      frame++;
      builds = 0;
      st.draws = 0;
      dpr = d > 0 && Number.isFinite(d) ? d : 1;
    },
    draw(ctx: CanvasRenderingContext2D, cam: Camera, item: MassifItem): void {
      const p = item.piece,
        step = zoomStep(cam.zoom);
      const key = keyOf(p, step);
      let e = map.get(key);
      if (e) {
        map.delete(key);
        map.set(key, e);
        st.hits++;
      } else {
        if (builds >= budget) {
          for (const s of ZOOM_STEPS) {
            const alt = s === step ? undefined : map.get(keyOf(p, s));
            if (alt) {
              alt.frame = frame;
              st.fallbacks++;
              stamp(ctx, cam, item, alt);
              return;
            }
          }
        }
        const made = build(item, step);
        if (!made) return;
        builds++;
        st.misses++;
        if (made.bytes <= maxBytes && makeRoom(made.bytes)) {
          map.set(key, made);
          bytes += made.bytes;
        } else {
          stamp(ctx, cam, item, made);
          release(made);
          return;
        }
        e = made;
      }
      e.frame = frame;
      stamp(ctx, cam, item, e);
    },
    stats(): MassifCacheStats {
      return { ...st, entries: map.size, bytes };
    },
    clear(): void {
      for (const e of map.values()) release(e);
      map.clear();
      bytes = 0;
    },
  };
}

/** Standard-Cache des Renderers. */
export const massifCache = createMassifCache();
