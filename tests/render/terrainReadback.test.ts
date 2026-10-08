import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { World } from '../../src/sim/types';
import {
  buildTerrainLayer,
  halfLayer,
  quarterLayer,
  repaintFarWater,
} from '../../src/render/terrain';

// AK-T03a: willReadFrequently nur an Flächen, die per getImageData zurückgelesen werden (Viertel-Kopie).

interface FakeCanvas {
  width: number;
  height: number;
  ctxArgs: unknown[][];
  getContext: (...a: unknown[]) => unknown;
}

const view = (): World => {
  const tiles = [];
  for (let y = 0; y < 24; y++)
    for (let x = 0; x < 24; x++)
      tiles.push({
        terrain: x >= 4 && x <= 19 && y >= 4 && y <= 19 ? 'grass' : 'water',
        buildingId: null,
        road: false,
      });
  return {
    seed: 5,
    islands: [{ width: 24, height: 24, tiles }],
    buildings: {},
    nextBuildingId: 1,
  } as unknown as World;
};

describe('AK-T03a willReadFrequently', () => {
  const saved = (globalThis as { document?: unknown }).document;
  beforeAll(() => {
    (globalThis as { document?: unknown }).document = {
      createElement: (): FakeCanvas => {
        const ctx = new Proxy(
          {
            createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
            getImageData: (_x: number, _y: number, w: number, h: number) => ({
              data: new Uint8ClampedArray(w * h * 4),
              width: w,
              height: h,
            }),
          } as Record<string, unknown>,
          { get: (t, k: string) => (k in t ? t[k] : () => undefined), set: () => true },
        );
        const c: FakeCanvas = {
          width: 0,
          height: 0,
          ctxArgs: [],
          getContext: (...a) => {
            c.ctxArgs.push(a);
            return ctx;
          },
        };
        return c;
      },
    };
  });
  afterAll(() => {
    (globalThis as { document?: unknown }).document = saved;
  });

  const flagged = (c: HTMLCanvasElement): boolean[] =>
    (c as unknown as FakeCanvas).ctxArgs.map(
      (a) => (a[1] as { willReadFrequently?: boolean } | undefined)?.willReadFrequently === true,
    );

  it('Rücklese-Fläche (Viertel-Kopie) trägt das Flag, Bodenebene und Halbkopie nicht', () => {
    const layer = buildTerrainLayer(view(), 1);
    const half = halfLayer(layer);
    const quarter = quarterLayer(layer);
    repaintFarWater(layer, quarter, { dy: 0, dh: 8 });
    expect(flagged(layer).length).toBeGreaterThan(0);
    expect(flagged(layer).some(Boolean)).toBe(false);
    expect(flagged(half).some(Boolean)).toBe(false);
    expect(flagged(quarter).length).toBeGreaterThan(0);
    expect(flagged(quarter).every(Boolean)).toBe(true);
  });
});
