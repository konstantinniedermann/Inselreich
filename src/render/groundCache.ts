/**
 * Bildschirmraum-Cache für den Boden der Heimat (PERF-L57): Steht die Kamera still, wird der affin gezeichnete
 * Boden einmal in ein Offscreen-Canvas in Zielauflösung gemalt und danach nur noch 1:1 geblittet. Ein Eintrag,
 * Grösse = Zielcanvas. Reine Darstellung, schreibt nie in die Welt; ohne Canvas (Node-Test) wird direkt gezeichnet.
 */
import { ISO_H, ISO_W } from './isoBase';
import { groundMatrix, type Camera } from './camera';

/** Rechteck in Kacheln (inklusive Grenzen), wie `TileRect` im Terrain. */
export interface GroundTileRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Quell-Teilrechteck, Quellpixel je Kachel und Quelle des Bodens. */
export interface GroundSpec {
  /** Terrain-Ebene, zu der Patches gehören (Identität). */
  owner: HTMLCanvasElement;
  /** Gezeichnete Quelle: Ebene, halbe oder Viertel-Kopie. */
  src: HTMLCanvasElement;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  per: number;
}

/** Ränder und Frames; Darstellungswerte, keine Spielwerte. */
export const GROUND_PAD_PX = 4;
export const GROUND_STABLE_FRAMES = 3;

let makeCanvas: (() => HTMLCanvasElement | null) | null = () =>
  typeof document === 'undefined' ? null : document.createElement('canvas');
/** Fabrik für das Offscreen-Canvas; im Node-Test ein Fake (null: direkt zeichnen). */
export function setGroundCanvasFactory(fn: (() => HTMLCanvasElement | null) | null): void {
  makeCanvas = fn;
}

interface Entry {
  sig: string;
  owner: HTMLCanvasElement;
  src: HTMLCanvasElement;
  cam: Camera;
  spec: GroundSpec;
  frames: number;
  canvas: HTMLCanvasElement | null;
  base: DOMMatrix2DInit;
  pending: GroundTileRect[];
}
let entry: Entry | null = null;

/** Dev-Zähler (Test und Messung). */
export const groundStats = { blits: 0, builds: 0, patches: 0, direct: 0 };

export function resetGroundCache(): void {
  entry = null;
  groundStats.blits = groundStats.builds = groundStats.patches = groundStats.direct = 0;
}
/** Grösse des Caches in Einträgen (Obergrenze 1). */
export const groundCacheSize = (): number => (entry?.canvas ? 1 : 0);

function paint(ctx: CanvasRenderingContext2D, cam: Camera, g: GroundSpec): void {
  ctx.save();
  ctx.transform(...groundMatrix(cam, g.per));
  ctx.drawImage(g.src, g.sx, g.sy, g.sw, g.sh, g.sx, g.sy, g.sw, g.sh);
  ctx.restore();
}

/** Bildschirm-Hüllbox (CSS-Pixel) eines Kachelrechtecks samt Rand. */
export function groundScreenBox(
  cam: Camera,
  per: number,
  r: GroundTileRect,
  pad = GROUND_PAD_PX,
): { x: number; y: number; w: number; h: number } {
  const [a, b, c, , e, f] = groundMatrix(cam, per);
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const [tx, ty] of [
    [r.x0, r.y0],
    [r.x1 + 1, r.y0],
    [r.x0, r.y1 + 1],
    [r.x1 + 1, r.y1 + 1],
  ] as const) {
    const u = tx * per,
      v = ty * per;
    const X = a * u + c * v + e,
      Y = b * u + b * v + f;
    x0 = Math.min(x0, X);
    x1 = Math.max(x1, X);
    y0 = Math.min(y0, Y);
    y1 = Math.max(y1, Y);
  }
  const p = pad + cam.zoom * Math.max(ISO_W, ISO_H) * 0.5; // eine halbe Kachel Sicherheit
  return {
    x: Math.floor(x0 - p),
    y: Math.floor(y0 - p),
    w: Math.ceil(x1 - x0 + 2 * p) + 1,
    h: Math.ceil(y1 - y0 + 2 * p) + 1,
  };
}

/** Eine Teil-Neuzeichnung der Ebene `owner` ist passiert; `rect` fehlt: Cache ganz verwerfen. */
export function noteGroundPatch(owner: HTMLCanvasElement, rect?: GroundTileRect | null): void {
  if (!entry || entry.owner !== owner) return;
  // Kopien (Zoom ≤ 0,5) ändern sich mit samt Fernwasser: ganz verwerfen
  if (!rect || entry.src !== owner) {
    entry = null;
    return;
  }
  if (entry.canvas) entry.pending.push(rect);
}

function applyPending(e: Entry, off: HTMLCanvasElement): void {
  const c = off.getContext('2d');
  if (!c) {
    entry = null;
    return;
  }
  for (const r of e.pending) {
    const per = e.spec.per;
    const box = groundScreenBox(e.cam, per, {
      x0: r.x0 - 1,
      y0: r.y0 - 1,
      x1: r.x1 + 1,
      y1: r.y1 + 1,
    });
    c.save();
    c.beginPath();
    c.rect(box.x, box.y, box.w, box.h);
    c.clip();
    c.clearRect(box.x, box.y, box.w, box.h);
    paint(c, e.cam, e.spec);
    c.restore();
    groundStats.patches++;
  }
  e.pending.length = 0;
}

/**
 * Zeichnet den Boden. `cacheable` nur für die Heimat-Ebene (fertig). Beim Schwenken direkt wie bisher; steht
 * der Schlüssel `GROUND_STABLE_FRAMES` Frames gleich, wird gecacht und danach nur geblittet.
 */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  g: GroundSpec,
  cacheable: boolean,
): void {
  const cv = ctx.canvas as HTMLCanvasElement | undefined;
  const t = ctx.getTransform?.();
  if (!cacheable || !cv || !t || !makeCanvas) {
    groundStats.direct++;
    paint(ctx, cam, g);
    return;
  }
  const sig = [
    g.sx,
    g.sy,
    g.sw,
    g.sh,
    g.per,
    cam.x,
    cam.y,
    cam.zoom,
    cv.width,
    cv.height,
    t.a,
    t.b,
    t.c,
    t.d,
    t.e,
    t.f,
  ].join('|');
  let e = entry;
  if (!e || e.owner !== g.owner || e.src !== g.src || e.sig !== sig) {
    entry = e = {
      sig,
      owner: g.owner,
      src: g.src,
      cam: { ...cam },
      spec: { ...g },
      frames: 1,
      canvas: null,
      base: { a: t.a, b: t.b, c: t.c, d: t.d, e: t.e, f: t.f },
      pending: [],
    };
  } else e.frames++;
  if (e.frames < GROUND_STABLE_FRAMES) {
    groundStats.direct++;
    paint(ctx, cam, g);
    return;
  }
  if (!e.canvas) {
    const off = makeCanvas();
    const oc = off?.getContext('2d');
    if (!off || !oc) {
      groundStats.direct++;
      paint(ctx, cam, g);
      return;
    }
    off.width = cv.width;
    off.height = cv.height;
    oc.setTransform(e.base.a!, e.base.b!, e.base.c!, e.base.d!, e.base.e!, e.base.f!);
    oc.imageSmoothingQuality = 'high';
    paint(oc, cam, g);
    e.canvas = off;
    groundStats.builds++;
  } else if (e.pending.length) applyPending(e, e.canvas);
  if (!entry) {
    groundStats.direct++;
    paint(ctx, cam, g);
    return;
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(e.canvas, 0, 0);
  ctx.restore();
  groundStats.blits++;
}
