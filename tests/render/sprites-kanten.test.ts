import { describe, expect, it } from 'vitest';
import { drawBody } from '../../src/render/sprites';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, Tier } from '../../src/sim/types';
import { fakeCtx } from './fakeCtx';

const house = (tier: Tier): Building => ({
  id: 3,
  defId: 'house',
  x: 10,
  y: 10,
  connected: true,
  progress: 0,
  state: 'ok',
  island: 0,
  house: { tier } as unknown as Building['house'],
});

describe('L3 Kanten: Silhouette statt Strich je Fläche', () => {
  it('AK-L3-a je Körper höchstens ein Kontur-Strich (Wohnhaus Stufe 2, Zoom 1)', () => {
    const { ctx, log } = fakeCtx();
    drawBody(ctx, { x: 0, y: 0, zoom: 1 }, BUILDING_DEFS.house, house(2), 0);
    const strokes = log.events.filter((e) => e.op === 'stroke');
    expect(strokes.length).toBeLessThanOrEqual(1);
  });
});
