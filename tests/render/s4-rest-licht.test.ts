import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LIGHT } from '../../src/render/light';
import { PALETTE, mixHex, rgbOfCss } from '../../src/render/palette';
import { SHADOW_DIR as SHIP_SHADOW, OUTLINE as SHIP_OUTLINE, HULL } from '../../src/render/ship';
import { SHADOW_DIR as LIFE_SHADOW, OUTLINE as LIFE_OUTLINE } from '../../src/render/life';
import { SMOKE_COLOR } from '../../src/render/fx';

// H-R14 (S4-Rest): Schiff, Figuren, Effekte und Overlay-Marken sprechen die Licht- und Tonsprache der Häuser.

const src = (f: string): string => readFileSync(`src/render/${f}`, 'utf8');
const blueShare = (c: string): number => {
  const [r, g, b] = rgbOfCss(c);
  return b / (r + g + b);
};
const lin = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const lum = (c: readonly number[]): number =>
  0.2126 * lin(c[0]!) + 0.7152 * lin(c[1]!) + 0.0722 * lin(c[2]!);

describe('H-R14 Quelltext: kein Schwarz/Weiss, ein Licht', () => {
  for (const f of ['ship.ts', 'life.ts', 'fx.ts', 'overlays.ts']) {
    it(`H-R14-Quelltext ${f}: kein #000/#fff, kein rgba(0,0,0, kein Math.sqrt(10)`, () => {
      const t = src(f);
      expect(t).not.toMatch(/#000000|#ffffff|'#000'|'#fff'/i);
      expect(t).not.toContain('rgba(0,0,0');
      expect(t).not.toContain('Math.sqrt(10)');
      if (f !== 'overlays.ts') expect(t).not.toContain('rgba(255,255,255');
    });
  }
  for (const f of ['ship.ts', 'life.ts'])
    it(`H-R14-Quelltext ${f}: LIGHT aus ./light`, () => {
      expect(src(f)).toMatch(/import\s*\{[^}]*\bLIGHT\b[^}]*\}\s*from '\.\/light'/);
    });
  it('H-R14-Quelltext overlays.ts: kein EDGE aus ./sprites', () => {
    const m = /import\s*\{([^}]*)\}\s*from '\.\/sprites'/.exec(src('overlays.ts'));
    expect(m?.[1] ?? '').not.toMatch(/\bEDGE\b/);
  });
});

describe('H-R14 Farben', () => {
  const cases: [string, string, string][] = [
    ['Schiffskontur', SHIP_OUTLINE, HULL],
    ['Figurenkontur', LIFE_OUTLINE, PALETTE.wallTimber],
  ];
  for (const [name, outline, own] of cases)
    it(`H-R14-Farbe ${name}: nicht schwarz und kühler als der Eigenton`, () => {
      const rgb = rgbOfCss(outline);
      expect(Math.max(...rgb)).toBeGreaterThanOrEqual(30);
      expect(Math.min(...rgb)).toBeGreaterThan(0);
      expect(blueShare(outline)).toBeGreaterThan(blueShare(own));
    });
  it('H-R14-Farbe Rauch: Luminanz höchstens 0,02 über dem alten Ton, nicht schwarz', () => {
    const old = rgbOfCss(mixHex(PALETTE.rockDark, '#000000', 0.7));
    expect(lum(SMOKE_COLOR)).toBeLessThanOrEqual(lum(old) + 0.02);
    expect(Math.min(...SMOKE_COLOR)).toBeGreaterThan(0);
  });
  it('H-R14-Licht Schattenrichtung von Schiff und Figur = -LIGHT', () => {
    for (const d of [SHIP_SHADOW, LIFE_SHADOW]) {
      expect(d.x).toBeCloseTo(-LIGHT.x, 12);
      expect(d.y).toBeCloseTo(-LIGHT.y, 12);
    }
  });
});
