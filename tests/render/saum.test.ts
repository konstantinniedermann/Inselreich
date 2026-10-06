import { describe, expect, it } from 'vitest';
import { coastField, sampleField, type Field } from '../../src/render/terrainField';
import { euclidCoast, farWaterDepth, FAR_DEPTH_MAX } from '../../src/render/saum';

const island = (n: number, land: (x: number, y: number) => boolean) => ({
  width: n,
  height: n,
  seed: 5,
  tiles: Array.from({ length: n * n }, (_, i) => ({
    terrain: land(i % n, Math.floor(i / n)) ? ('grass' as const) : ('water' as const),
    buildingId: null,
    road: false,
  })),
});

describe('H-R15 Saum der Fernansicht', () => {
  it('RF-1 euclidCoast: Wasserabstand ist euklidisch, Land und Küste stimmen mit coastField überein', () => {
    const isl = island(21, (x, y) => x === 10 && y === 10);
    const e = euclidCoast(isl),
      c = coastField(isl);
    const at = (f: Field, x: number, y: number) => f.v[y * f.w + x]!;
    expect(at(e, 10, 10)).toBe(at(c, 10, 10));
    expect(at(e, 13, 10)).toBeCloseTo(-3, 5);
    expect(at(e, 13, 13)).toBeCloseTo(-3 * Math.SQRT2, 4); // Chebyshev lieferte -3: Raute statt Kreis
  });

  it('RF-2 Abstandslinie ist rund: gleicher Abstand in Achs- und Diagonalrichtung', () => {
    const isl = island(41, (x, y) => x === 20 && y === 20);
    const e = euclidCoast(isl);
    const along = -e.v[20 * 41 + 25]!,
      diag = -e.v[25 * 41 + 25]!;
    expect(diag / along).toBeCloseTo(Math.SQRT2, 3);
    const c = coastField(isl);
    expect(-c.v[25 * 41 + 25]! / -c.v[20 * 41 + 25]!).toBe(1); // heutiges Feld: Raute
  });

  it('RF-3 farWaterDepth: nie flacher als das Küstenfeld, gedeckelt, stetig', () => {
    const isl = island(21, (x, y) => x >= 9 && x <= 11 && y >= 9 && y <= 11);
    const e = euclidCoast(isl);
    let prev = farWaterDepth(e, 5, 5, 20.5);
    for (let x = 5; x < 20; x += 0.05) {
      const d = farWaterDepth(e, 5, x, 20.5);
      expect(Math.abs(d - prev)).toBeLessThan(0.2);
      expect(d).toBeLessThanOrEqual(FAR_DEPTH_MAX);
      expect(d).toBeGreaterThanOrEqual(Math.max(0, -sampleField(coastField(isl), x, 20.5)) - 0.25); // Toleranz: Verschiebung ±WARP
      prev = d;
    }
  });
});
