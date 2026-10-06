import { describe, expect, it } from 'vitest';
import { rgbOfCss } from '../../src/render/palette';
import { crownGeom, crownsFor, paintStamp } from '../../src/render/trees';
import { ISO_W, TREE_VARIANTS } from '../../src/render/iso';

interface Ell {
  fill: string;
  x: number;
  y: number;
  rx: number;
  ry: number;
}
/** Zeichnet einen Stempel auf einen Protokoll-Kontext; liefert die gefüllten Ellipsen in Zeichenreihenfolge. */
function ellipses(seed: number, variant: number): Ell[] {
  const out: Ell[] = [];
  let fillStyle = '';
  let pend: Omit<Ell, 'fill'> | null = null;
  const ctx = {
    save() {},
    restore() {},
    scale() {},
    translate() {},
    beginPath() {
      pend = null;
    },
    rect() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    ellipse(x: number, y: number, rx: number, ry: number) {
      pend = { x, y, rx, ry };
    },
    fill() {
      if (pend) out.push({ ...pend, fill: fillStyle });
      pend = null;
    },
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(v: string) {
      fillStyle = v;
    },
  } as unknown as CanvasRenderingContext2D;
  paintStamp(ctx, seed, variant, 1);
  return out;
}
const lum = (c: string): number => {
  const [r, g, b] = rgbOfCss(c);
  return 0.3 * r + 0.59 * g + 0.11 * b;
};
const blue = (c: string): number => {
  const [r, g, b] = rgbOfCss(c);
  return b / (r + g + b);
};

/** Ellipsen von `ellipses` je Krone zerlegt: n Schattenlappen, n Mittenlappen, 1–2 Kappen (L1: Lappenkronen). */
function perCrown(seed: number, v: number): { shade: Ell[]; mid: Ell[]; cap: Ell[] }[] {
  const e = ellipses(seed, v);
  const out: { shade: Ell[]; mid: Ell[]; cap: Ell[] }[] = [];
  let i = 0;
  const order = [...crownsFor(seed, v)].sort((a, b) => a.cx + a.cy - (b.cx + b.cy)); // wie paintStamp: hinten zuerst
  for (const c of order.filter((k) => !(k.kind === 1 && !k.bush))) {
    const n = crownGeom(c).lobes.length;
    const m = Math.min(n, c.bush ? 1 : 2);
    out.push({
      shade: e.slice(i, i + n),
      mid: e.slice(i + n, i + 2 * n),
      cap: e.slice(i + 2 * n, i + 2 * n + m),
    });
    i += 2 * n + m;
  }
  expect(i).toBe(e.length);
  return out;
}

describe('H-R10 Kronen in 3 Tönen', () => {
  it('c) je Lappenkrone drei verschiedene Füllungen: Schatten bläulicher als Mitte, Kappe heller als Mitte', () => {
    let checked = 0;
    for (let seed = 1; seed <= 6; seed++)
      for (let v = 0; v < TREE_VARIANTS; v++)
        for (const { shade, mid, cap } of perCrown(seed, v)) {
          expect(new Set([shade[0]!.fill, mid[0]!.fill, cap[0]!.fill]).size).toBe(3);
          expect(blue(shade[0]!.fill)).toBeGreaterThan(blue(mid[0]!.fill));
          expect(lum(cap[0]!.fill)).toBeGreaterThan(lum(mid[0]!.fill));
          expect(lum(shade[0]!.fill)).toBeLessThan(lum(mid[0]!.fill));
          checked++;
        }
    expect(checked).toBeGreaterThan(100);
  });
  it('c) Kappe sitzt zum Licht (x < 0, y < 0 gegenüber ihrem Lappen), Schattenmond vom Licht weg', () => {
    for (let v = 0; v < TREE_VARIANTS; v++)
      for (const { shade, mid, cap } of perCrown(2, v)) {
        shade.forEach((s, i) => {
          expect(s.x - mid[i]!.x).toBeGreaterThan(0);
          expect(s.y - mid[i]!.y).toBeGreaterThan(0);
        });
        for (const c of cap) {
          // die Kappe gehört zu einem Lappen: gegenüber dessen Mitte sitzt sie links oben, nahe am Lappenradius
          const m = mid.filter((q) => c.x - q.x < 0 && c.y - q.y < 0 && Math.abs(c.x - q.x) < q.rx);
          expect(m.length).toBeGreaterThan(0);
          expect(Math.abs(c.x - m[0]!.x)).toBeLessThan(ISO_W);
        }
      }
  });
});
