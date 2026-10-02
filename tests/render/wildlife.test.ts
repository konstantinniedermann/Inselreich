import { beforeAll, describe, expect, it, vi } from 'vitest';
import { centerOn } from '../../src/render/camera';
import { PALETTE } from '../../src/render/palette';
import { render, type RenderFx } from '../../src/render/renderer';
import { resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { center, createWorld } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { fakeCtx, type Ev } from './fakeCtx';

vi.mock('../../src/render/terrain', async (orig) => {
  const m = await orig<typeof import('../../src/render/terrain')>();
  return {
    ...m,
    terrainScale: () => 1,
    updateTerrainLayer: () => ({ redrawn: false, ms: 0 }),
    halfLayer: (l: HTMLCanvasElement) => l,
  };
});

const VIEW = { w: 1280, h: 720 };
const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;

beforeAll(() => {
  setCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetTreeCache();
});

function frame(world: World, zoom: number, fx: Partial<RenderFx>): Ev[] {
  const k = world.buildings[world.kontorId]!;
  const c = center(BUILDING_DEFS.kontor, k.x, k.y);
  const cam = { x: 0, y: 0, zoom };
  centerOn(cam, c.cx, c.cy, VIEW, { w: world.width, h: world.height });
  const { ctx, log } = fakeCtx();
  render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 1000, ...fx });
  return log.events;
}

const gullStrokes = (ev: Ev[]) =>
  ev.filter((e) => e.op === 'stroke' && e.style === PALETTE.foam && e.lineWidth === 1.5);

describe('Möwen und Wetter (Trivial-Fix H-R2)', () => {
  it('RF-1 Möwen bei clear/cloudy am Tag, bei rain und storm keine', () => {
    const world = createWorld(3);
    world.tick = 0;
    const seen = (kind: 'clear' | 'cloudy' | 'rain' | 'storm') =>
      gullStrokes(frame(world, 1, { weather: { kind, w: 0.8 } })).length;
    expect(seen('clear')).toBeGreaterThan(0);
    expect(seen('cloudy')).toBeGreaterThan(0);
    expect(seen('rain')).toBe(0);
    expect(seen('storm')).toBe(0);
  });
});
