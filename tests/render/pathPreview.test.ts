import { describe, expect, it } from 'vitest';
import { createCamera, tileCorners } from '../../src/render/camera';
import { drawPathPreview } from '../../src/render/pathPreview';
import { fakeCtx } from './fakeCtx';

describe('drawPathPreview', () => {
  it('draws nothing for an empty list', () => {
    const { ctx, log } = fakeCtx();
    drawPathPreview(ctx, createCamera(), []);
    expect(log.events).toHaveLength(0);
    expect(log.saves).toBe(log.restores);
  });

  it('fills and outlines one rhombus per tile, balanced save/restore', () => {
    const { ctx, log } = fakeCtx();
    const cam = createCamera();
    drawPathPreview(ctx, cam, [
      { x: 3, y: 4 },
      { x: 4, y: 4 },
    ]);
    expect(log.events.filter((e) => e.op === 'fill')).toHaveLength(2);
    expect(log.events.filter((e) => e.op === 'stroke')).toHaveLength(2);
    const first = log.events.find((e) => e.op === 'fill')!;
    expect(first.points).toEqual(tileCorners(cam, 3, 4));
    expect(first.style).toMatch(/^rgba\(.*, 0\.\d+\)$/);
    expect(log.saves).toBeGreaterThan(0);
    expect(log.saves).toBe(log.restores);
    expect(log.underflow).toBe(0);
  });
});
