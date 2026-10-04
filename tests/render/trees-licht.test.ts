import { describe, expect, it } from 'vitest';
import { rgbOfCss } from '../../src/render/palette';
import { crownsFor, paintStamp } from '../../src/render/trees';
import { ISO_W } from '../../src/render/iso';

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

describe('H-R10 Kronen in 3 Tönen', () => {
  it('c) je Laubkrone drei verschiedene Füllungen: Schatten bläulicher als Mitte, Kappe heller als Mitte', () => {
    let checked = 0;
    for (let seed = 1; seed <= 6; seed++)
      for (let v = 0; v < 8; v++) {
        const e = ellipses(seed, v);
        const laub = crownsFor(seed, v).filter((c) => c.kind !== 1).length;
        expect(e.length).toBe(laub * 3);
        for (let i = 0; i < e.length; i += 3) {
          const [shade, mid, cap] = [e[i]!, e[i + 1]!, e[i + 2]!];
          expect(new Set([shade.fill, mid.fill, cap.fill]).size).toBe(3);
          expect(blue(shade.fill)).toBeGreaterThan(blue(mid.fill));
          expect(lum(cap.fill)).toBeGreaterThan(lum(mid.fill));
          expect(lum(shade.fill)).toBeLessThan(lum(mid.fill));
          checked++;
        }
      }
    expect(checked).toBeGreaterThan(20);
  });
  it('c) Kappe sitzt zum Licht (x < 0, y < 0 gegenüber der Kronenmitte), Schattenmond vom Licht weg', () => {
    for (let v = 0; v < 8; v++) {
      const e = ellipses(2, v);
      for (let i = 0; i < e.length; i += 3) {
        const [shade, mid, cap] = [e[i]!, e[i + 1]!, e[i + 2]!];
        expect(cap.x - mid.x).toBeLessThan(0);
        expect(cap.y - mid.y).toBeLessThan(0);
        expect(shade.x - mid.x).toBeGreaterThan(0);
        expect(shade.y - mid.y).toBeGreaterThan(0);
        expect(Math.abs(cap.x - mid.x)).toBeLessThan(ISO_W);
      }
    }
  });
});
