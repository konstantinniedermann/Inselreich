import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { PALETTE, rgbOfCss } from '../../src/render/palette';
import { drawBody, roofColors, wallColors } from '../../src/render/sprites';
import type { Building, BuildingDefId, Tier } from '../../src/sim/types';
import { fakeCtx } from './fakeCtx';

const src = (f: string): string => readFileSync(`src/render/${f}`, 'utf8');
const blueShare = (c: string): number => {
  const [r, g, b] = rgbOfCss(c);
  return b / (r + g + b);
};
const parse = (css: string): [number, number, number, number] | null => {
  if (css.startsWith('#')) {
    const [r, g, b] = rgbOfCss(css);
    return [r, g, b, 1];
  }
  const m = /^rgba?\(([^)]*)\)$/.exec(css);
  if (!m) return null;
  const v = m[1]!.split(',').map(Number);
  return [v[0]!, v[1]!, v[2]!, v[3] ?? 1];
};

describe('H-R10 S1 Quelltext: ein Licht, keine Schwarz-/Weiss-Mischung', () => {
  for (const f of ['sprites.ts', 'trees.ts'])
    it(`S1-Quelltext ${f}: kein #000000, #ffffff, rgba(0,0,0, keine lokale Lichtrichtung; LIGHT aus ./light`, () => {
      const t = src(f);
      expect(t).not.toMatch(/#000000|#ffffff/i);
      expect(t).not.toContain('rgba(0,0,0');
      expect(t).not.toContain('Math.sqrt(10)');
      expect(t).toMatch(/import\s*\{[^}]*\bLIGHT\b[^}]*\}\s*from\s*'\.\/light'/);
    });
});

describe('H-R10 Schattenseite kühler', () => {
  const walls = [PALETTE.wallLime, PALETTE.wallTimber, PALETTE.wallStone, PALETTE.earthEdge];
  const roofs = [
    PALETTE.roofThatch,
    PALETTE.roofTerracotta,
    PALETTE.roofTerracottaDark,
    PALETTE.roofWood,
    PALETTE.roofSlate,
    PALETTE.roofTimber,
    PALETTE.roofCopper,
  ];
  it('S1-Farbe Wandfarben: Blauanteil Schattenseite > Lichtseite, kein Schwarz/Weiss', () => {
    for (const w of walls) {
      const c = wallColors(w);
      expect(blueShare(c.right), w).toBeGreaterThan(blueShare(c.left));
      for (const x of [c.left, c.right]) {
        const [r, g, b] = rgbOfCss(x);
        // Guard: kein (fast) reines Schwarz
        expect(Math.max(r, g, b)).toBeGreaterThanOrEqual(30);
        expect(Math.min(r, g, b)).toBeGreaterThan(0);
      }
    }
  });
  it('S1-Farbe Dachfarben: Blauanteil Schattenseite > Lichtseite, kein Schwarz/Weiss', () => {
    for (const r0 of roofs) {
      const c = roofColors(r0);
      expect(blueShare(c.shade), r0).toBeGreaterThan(blueShare(c.light));
      for (const x of [c.light, c.shade]) {
        const [r, g, b] = rgbOfCss(x);
        // Guard: kein (fast) reines Schwarz
        expect(Math.max(r, g, b)).toBeGreaterThanOrEqual(30);
        expect(Math.min(r, g, b)).toBeGreaterThan(0);
      }
    }
  });
  it('S1-Farbe Gebäude (Variante 0 und 2): keine Strich-/Füllfarbe schwarz, Konturen nicht das alte EDGE/OUTLINE', () => {
    const ids = Object.keys(BUILDING_DEFS) as BuildingDefId[];
    for (const variant of [0, 2])
      for (const id of ids) {
        const tiers: (Tier | undefined)[] = id === 'house' ? [1, 2, 3, 4] : [undefined];
        for (const tier of tiers) {
          const b = {
            id: 3,
            defId: id,
            x: 10,
            y: 10,
            connected: true,
            progress: 0,
            state: 'ok',
            ...(tier ? { house: { tier } } : {}),
          } as unknown as Building;
          const f = fakeCtx();
          drawBody(f.ctx, { x: 0, y: 0, zoom: 1 }, BUILDING_DEFS[id], b, 0, undefined, variant);
          for (const e of f.log.events) {
            if (e.op !== 'fill' && e.op !== 'stroke') continue;
            const c = parse(e.style);
            expect(c, `${id} ${e.style}`).not.toBeNull();
            expect(
              Math.max(c![0], c![1], c![2]),
              `${id}${tier ?? ''} v${variant} ${e.style}`,
            ).toBeGreaterThanOrEqual(30);
            expect(e.style).not.toMatch(/^rgba\(0,0,0/);
            expect(e.style).not.toBe('rgb(255,255,255)');
            if (e.op === 'stroke') {
              // echte Rot-Probe: weder das alte EDGE von main noch die alte schwarze Kontur
              expect(e.style, id).not.toBe('rgb(41,27,17)');
              expect(e.style, id).not.toBe('rgba(0,0,0,0.6)');
            }
          }
        }
      }
  });
});
