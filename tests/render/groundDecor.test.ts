import { describe, expect, it } from 'vitest';
import {
  FLOWER_TONES,
  SHRUB_TONES,
  flowersFor,
  shrubsFor,
  tuftColor,
  type ForestSides,
} from '../../src/render/groundDecor';
import { PALETTE, SIGNAL_NAMES, rgbOfCss } from '../../src/render/palette';
import { paintDecor } from '../../src/render/terrain';
import type { World } from '../../src/sim/types';
import { deltaE2000, rgbToLab } from './deltaE';
import { fakeCtx } from './fakeCtx';

const lab = (css: string) => rgbToLab(rgbOfCss(css));
const none: ForestSides = { left: false, right: false, up: false, down: false };

describe('Boden-Deko: Blumen', () => {
  it('R149 flowersFor ist deterministisch, 0–4 Blüten in 0,1…0,9, Grösse 1–1,5 Texturpixel', () => {
    let total = 0,
      max = 0,
      zero = 0;
    for (let y = 0; y < 40; y++)
      for (let x = 0; x < 40; x++) {
        const f = flowersFor(3, x, y);
        expect(flowersFor(3, x, y)).toEqual(f);
        expect(f.length).toBeLessThanOrEqual(4);
        total += f.length;
        max = Math.max(max, f.length);
        if (f.length === 0) zero++;
        for (const p of f) {
          for (const v of [p.x, p.y]) {
            expect(v).toBeGreaterThanOrEqual(0.1);
            expect(v).toBeLessThanOrEqual(0.9);
          }
          expect(p.size).toBeGreaterThanOrEqual(1);
          expect(p.size).toBeLessThanOrEqual(1.5);
          expect([0, 1, 2]).toContain(p.tone);
        }
      }
    expect(total).toBeGreaterThan(50);
    expect(max).toBeGreaterThanOrEqual(3);
    expect(zero).toBeGreaterThan(400); // Blumenwiesen statt Gleichverteilung: viele leere Kacheln
  });

  it('R149 Blumentöne: ΔE2000 ≥ 20 zu jeder Signalfarbe (AK-R1-03)', () => {
    for (const t of FLOWER_TONES)
      for (const n of SIGNAL_NAMES)
        expect(deltaE2000(lab(t), lab(PALETTE[n])), `${t} ~ ${n}`).toBeGreaterThanOrEqual(20);
  });

  it('R149 Blumen sind gehäuft: Nachbarkacheln einer vollen Kachel sind im Mittel voller als der Rest', () => {
    let nbSum = 0,
      nbN = 0,
      allSum = 0,
      allN = 0;
    for (let y = 1; y < 59; y++)
      for (let x = 1; x < 59; x++) {
        const c = flowersFor(3, x, y).length;
        allSum += c;
        allN++;
        if (c >= 3) {
          nbSum += flowersFor(3, x + 1, y).length;
          nbN++;
        }
      }
    expect(nbN).toBeGreaterThan(0);
    expect(nbSum / nbN).toBeGreaterThan(allSum / allN);
  });
});

describe('Boden-Deko: Büsche', () => {
  it('R149 shrubsFor: ohne Waldseite nichts, sonst höchstens 2, klein, deterministisch', () => {
    let total = 0;
    for (let y = 0; y < 30; y++)
      for (let x = 0; x < 30; x++) {
        expect(shrubsFor(3, x, y, none)).toEqual([]);
        const s = shrubsFor(3, x, y, { left: true, right: true, up: true, down: true });
        expect(shrubsFor(3, x, y, { left: true, right: true, up: true, down: true })).toEqual(s);
        expect(s.length).toBeLessThanOrEqual(2);
        total += s.length;
        for (const b of s) {
          expect(b.r).toBeGreaterThan(0);
          expect(b.r).toBeLessThanOrEqual(0.06);
          expect(b.x - b.r).toBeGreaterThanOrEqual(0);
          expect(b.x + b.r).toBeLessThanOrEqual(1);
          expect(b.y - b.r).toBeGreaterThanOrEqual(0);
          expect(b.y + b.r).toBeLessThanOrEqual(1);
        }
      }
    expect(total).toBeGreaterThan(100);
  });

  it('R149 Büsche liegen nur auf der Waldseite', () => {
    const sides: [keyof ForestSides, (b: { x: number; y: number }) => boolean][] = [
      ['left', (b) => b.x < 0.5],
      ['right', (b) => b.x > 0.5],
      ['up', (b) => b.y < 0.5],
      ['down', (b) => b.y > 0.5],
    ];
    for (const [side, ok] of sides) {
      let n = 0;
      for (let y = 0; y < 30; y++)
        for (let x = 0; x < 30; x++)
          for (const b of shrubsFor(3, x, y, { ...none, [side]: true })) {
            n++;
            expect(ok(b), `${side} ${x},${y}`).toBe(true);
          }
      expect(n, side).toBeGreaterThan(10);
    }
  });

  it('R149 Buschtöne unterscheiden sich von den Baumkronen (ΔE2000 ≥ 5) und von Signalfarben (≥ 20)', () => {
    for (const t of SHRUB_TONES) {
      expect(deltaE2000(lab(t), lab(PALETTE.crown))).toBeGreaterThanOrEqual(5);
      expect(deltaE2000(lab(t), lab(PALETTE.crownLight))).toBeGreaterThanOrEqual(5);
      for (const n of SIGNAL_NAMES)
        expect(deltaE2000(lab(t), lab(PALETTE[n]))).toBeGreaterThanOrEqual(20);
    }
  });
});

describe('Boden-Deko: paintDecor', () => {
  const mk = (terrain: string): World => {
    const n = 12;
    const tiles = Array.from({ length: n * n }, () => ({
      terrain,
      buildingId: null,
      road: false,
    }));
    return { width: n, height: n, seed: 3, tiles } as unknown as World;
  };
  const rect = { x0: 0, y0: 0, x1: 11, y1: 11 };

  it('R149 unbelegtes Gras bekommt Deko, belegte Kacheln und Nicht-Gras nichts', () => {
    const w = mk('grass');
    const free = fakeCtx();
    paintDecor(free.ctx, w, new Uint8Array(144), 1, rect);
    expect(
      free.log.events.filter((e) => e.op === 'stroke' || e.op === 'fill').length,
    ).toBeGreaterThan(0);
    expect(free.log.saves).toBe(free.log.restores);

    const occ = fakeCtx();
    paintDecor(occ.ctx, w, new Uint8Array(144).fill(1), 1, rect);
    expect(occ.log.allPoints.length).toBe(0);

    const forest = fakeCtx();
    paintDecor(forest.ctx, mk('forest'), new Uint8Array(144), 1, rect);
    expect(forest.log.allPoints.length).toBe(0);
  });

  it('R149 Büsche nur auf Gras neben Wald', () => {
    const w = mk('grass');
    // Wald in Spalte 6: Büsche erscheinen auf Gras der Spalten 5 und 7
    for (let y = 0; y < 12; y++) w.tiles[y * 12 + 6]!.terrain = 'forest';
    const a = fakeCtx();
    paintDecor(a.ctx, w, new Uint8Array(144), 1, rect);
    const b = fakeCtx();
    const w2 = mk('grass');
    paintDecor(b.ctx, w2, new Uint8Array(144), 1, rect);
    // mit Wald gibt es Pfade in Farben, die nur Büsche nutzen
    const shrubFills = a.log.events.filter((e) => SHRUB_TONES.includes(e.style));
    expect(shrubFills.length).toBeGreaterThan(0);
    expect(b.log.events.filter((e) => SHRUB_TONES.includes(e.style)).length).toBe(0);
  });
});

describe('H-R11 Büschel-Ton', () => {
  it('H-R11 tuftColor koppelt die Farbe an die Tonstufe: Schattenseite dunkler und kühler, Lichtseite heller und wärmer', () => {
    for (const tone of [0, 1] as const) {
      const shade = rgbOfCss(tuftColor(tone, 1)),
        mid = rgbOfCss(tuftColor(tone, 2)),
        light = rgbOfCss(tuftColor(tone, 3));
      const l = (c: number[]): number => 0.299 * c[0]! + 0.587 * c[1]! + 0.114 * c[2]!;
      expect(l(shade)).toBeLessThan(l(mid));
      expect(l(mid)).toBeLessThan(l(light));
      const blue = (c: number[]): number => c[2]! / (c[0]! + c[1]! + c[2]!);
      expect(blue(shade)).toBeGreaterThan(blue(light));
    }
    // helles Büschel bleibt heller als dunkles
    const l = (c: number[]): number => 0.299 * c[0]! + 0.587 * c[1]! + 0.114 * c[2]!;
    expect(l(rgbOfCss(tuftColor(0, 2)))).toBeGreaterThan(l(rgbOfCss(tuftColor(1, 2))));
  });

  it('H-R11 paintDecor setzt Büschelfarben je Tonstufe: mehr als zwei Strichfarben auf hügeliger Wiese, Dichte unverändert', () => {
    const n = 24;
    const tiles = Array.from({ length: n * n }, () => ({
      terrain: 'grass',
      buildingId: null,
      road: false,
    }));
    const w = { width: n, height: n, seed: 3, tiles } as unknown as World;
    const f = fakeCtx();
    paintDecor(f.ctx, w, new Uint8Array(n * n), 1, { x0: 0, y0: 0, x1: n - 1, y1: n - 1 });
    const colors = new Set(f.log.strokeSet);
    expect(colors.size).toBeGreaterThan(2);
    expect(colors.size).toBeLessThanOrEqual(6);
  });
});
