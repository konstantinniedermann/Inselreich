import { describe, expect, it, vi } from 'vitest';

const calls = { layoutKey: 0 };
vi.mock('../../src/sim/queries', async (orig) => {
  const m = await orig<typeof import('../../src/sim/queries')>();
  return {
    ...m,
    layoutKey: (w: Parameters<typeof m.layoutKey>[0]) => {
      calls.layoutKey++;
      return m.layoutKey(w);
    },
  };
});

import { errandsFrom } from '../../src/render/errands';
import { home, createWorld, idx } from '../../src/sim/world';
import type { Building } from '../../src/sim/types';

describe('H-R4 Fix: Weggraph je Frame', () => {
  it('RF-8 errandsFrom holt den Weggraph (layoutKey) genau einmal, nicht je Betrieb', () => {
    const world = createWorld(3);
    for (let y = 30; y <= 50; y++)
      for (let x = 30; x <= 60; x++) home(world).tiles[idx(home(world), x, y)]!.terrain = 'grass';
    for (let i = 0; i < 10; i++) {
      const b: Building = {
        id: 4000 + i,
        defId: 'lumberjack',
        x: 31 + i * 2,
        y: 32,
        connected: true,
        progress: 15,
        state: 'ok',
      };
      world.buildings[b.id] = b;
      home(world).tiles[idx(home(world), b.x, b.y)]!.buildingId = b.id;
      home(world).tiles[idx(home(world), b.x + 1, b.y)]!.terrain = 'forest';
    }
    calls.layoutKey = 0;
    const poses = errandsFrom(world, { x0: 0, y0: 0, x1: 63, y1: 63 }, { frac: 0, fast: false });
    expect(poses.length).toBeGreaterThan(5);
    expect(calls.layoutKey).toBe(1);
  });
});
