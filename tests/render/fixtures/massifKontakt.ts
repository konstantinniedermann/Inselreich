import { fieldWorld } from '../../../src/render/terrainField';
import { ISO_H, ISO_W } from '../../../src/render/iso';
import {
  SUB,
  heightAtF,
  massifData,
  massifFeatures,
  massifPieces,
} from '../../../src/render/massif';
import { massifBounds, rasterPiece } from '../../../src/render/rocks';
import { PALETTE, rgbOf } from '../../../src/render/palette';
import { createWorld } from '../../../src/sim/world';
import { crc32, deflateSync } from 'node:zlib';

// Mess-Helfer ART-STIL-02 L6: Ausschnitte des Massivs um ein Entdeckungs-Element, PNG-Kodierung ohne Abhängigkeit.

export type KontaktArt = 'see' | 'wasserfall' | 'hoehle' | 'steinmaennchen';
const NX = ISO_W / 2 / SUB,
  NY = ISO_H / 2 / SUB;

/** Mittelpunkt (Weltpixel) des Elements dieser Art auf der Karte des Seeds, oder null. */
export function elementPunkt(
  seed: number,
  art: KontaktArt,
): { x: number; y: number; w: number; h: number } | null {
  const data = massifData(fieldWorld(createWorld(seed, { unlockAll: true })));
  const m = massifFeatures(data);
  const pt = (I: number, J: number, h: number) => ({ x: (I - J) * NX, y: (I + J) * NY - h });
  if (art === 'see' && m.lake) {
    const l = m.lake;
    return { ...pt(l.cx * SUB, l.cy * SUB, heightAtF(l.comp, l.cx, l.cy)), w: 70, h: 50 };
  }
  if (art === 'wasserfall' && m.fall) {
    // der ganze Lauf samt Tümpel am Fuss
    const ps = m.fall.path.map((q) => pt(q.I, q.J, q.h));
    const x0 = Math.min(...ps.map((q) => q.x)),
      x1 = Math.max(...ps.map((q) => q.x)),
      y0 = Math.min(...ps.map((q) => q.y)),
      y1 = Math.max(...ps.map((q) => q.y));
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, w: x1 - x0 + 40, h: y1 - y0 + 30 };
  }
  if (art === 'hoehle' && m.cave) return { ...pt(m.cave.I, m.cave.J, m.cave.h), w: 70, h: 50 };
  if (art === 'steinmaennchen' && m.cairn) {
    const c = m.cairn;
    const q = pt(c.I, c.J, c.h);
    return { x: q.x, y: q.y - c.height / 2, w: 70, h: 50 };
  }
  return null;
}

/** RGBA-Ausschnitt (w × h Pixel bei Faktor f) um den Weltpunkt (cx, cy), Teilstücke über einem Wiesenton. */
export function ausschnitt(
  seed: number,
  cx: number,
  cy: number,
  w: number,
  h: number,
  f: number,
): Uint8Array {
  const world = createWorld(seed, { unlockAll: true });
  const isl = fieldWorld(world);
  const out = new Uint8Array(w * h * 4);
  const bg = rgbOf(PALETTE.grass);
  for (let i = 0; i < w * h; i++) {
    out[i * 4] = bg[0];
    out[i * 4 + 1] = bg[1];
    out[i * 4 + 2] = bg[2];
    out[i * 4 + 3] = 255;
  }
  const wx0 = cx - w / 2 / f,
    wy0 = cy - h / 2 / f;
  for (const p of massifPieces(isl)) {
    const b = massifBounds({ piece: p });
    if (b.x + b.w < wx0 || b.x > wx0 + w / f || b.y + b.h < wy0 || b.y > wy0 + h / f) continue;
    const pw = Math.round((ISO_W / 2) * f),
      ph = Math.ceil(b.h * f);
    const buf = rasterPiece({ piece: p }, pw, ph, f);
    const ox = Math.round((b.x - wx0) * f),
      oy = Math.round((b.y - wy0) * f);
    for (let y = 0; y < ph; y++)
      for (let x = 0; x < pw; x++) {
        const X = x + ox,
          Y = y + oy;
        if (X < 0 || Y < 0 || X >= w || Y >= h) continue;
        const a = buf[(y * pw + x) * 4 + 3]! / 255;
        if (a === 0) continue;
        for (let k = 0; k < 3; k++)
          out[(Y * w + X) * 4 + k] =
            buf[(y * pw + x) * 4 + k]! * a + out[(Y * w + X) * 4 + k]! * (1 - a);
      }
  }
  return out;
}

const u32 = (n: number): number[] => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
function chunk(type: string, data: Uint8Array): number[] {
  const t = Array.from(type, (c) => c.charCodeAt(0));
  const body = Uint8Array.from([...t, ...data]);
  return [...u32(data.length), ...body, ...u32(crc32(body))];
}
/** PNG (8 Bit RGBA, ohne Filter) mit `node:zlib`. */
export function pngRgba(w: number, h: number, rgba: Uint8Array): Uint8Array {
  const raw = new Uint8Array((w * 4 + 1) * h);
  for (let y = 0; y < h; y++)
    raw.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), y * (w * 4 + 1) + 1);
  const ihdr = Uint8Array.from([...u32(w), ...u32(h), 8, 6, 0, 0, 0]);
  return Uint8Array.from([
    137,
    80,
    78,
    71,
    13,
    10,
    26,
    10,
    ...chunk('IHDR', ihdr),
    ...chunk('IDAT', deflateSync(raw)),
    ...chunk('IEND', new Uint8Array(0)),
  ]);
}

/** Kontaktbogen: Ausschnitte nebeneinander (Spalten `cols`), Lücken 4 px dunkel. */
export function bogen(
  tiles: Uint8Array[],
  tw: number,
  th: number,
  cols: number,
): { w: number; h: number; data: Uint8Array } {
  const gap = 4;
  const rows = Math.ceil(tiles.length / cols);
  const w = cols * tw + (cols + 1) * gap,
    h = rows * th + (rows + 1) * gap;
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = 30;
    data[i * 4 + 1] = 30;
    data[i * 4 + 2] = 34;
    data[i * 4 + 3] = 255;
  }
  tiles.forEach((t, n) => {
    const ox = gap + (n % cols) * (tw + gap),
      oy = gap + Math.floor(n / cols) * (th + gap);
    for (let y = 0; y < th; y++)
      data.set(t.subarray(y * tw * 4, (y + 1) * tw * 4), ((oy + y) * w + ox) * 4);
  });
  return { w, h, data };
}
