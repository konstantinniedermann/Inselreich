import { describe, expect, it } from 'vitest';
import type { TileRange } from '../../src/render/camera';
import { MAX_FOCUS_MARKS, drawFocusMarks } from '../../src/render/focusMarks';
import { PALETTE } from '../../src/render/palette';
import { createWorld } from '../../src/sim/world';
import type { Building, BuildingDefId, World } from '../../src/sim/types';
import { fakeCtx } from './fakeCtx';

const FULL: TileRange = { x0: 0, y0: 0, x1: 63, y1: 63 };
const CAM = { x: 0, y: 0, zoom: 1 };
const paths = {
  footprint: (ctx: CanvasRenderingContext2D, _c: unknown, x: number, y: number) => {
    ctx.moveTo(x, y);
    ctx.lineTo(x + 1, y + 1);
  },
  hull: (ctx: CanvasRenderingContext2D, _c: unknown, b: Building) => {
    ctx.moveTo(b.x, b.y);
    ctx.lineTo(b.x + 2, b.y + 2);
  },
};

function worldWith(list: [BuildingDefId, number, number][]): World {
  const world = createWorld(3);
  let id = 1000;
  for (const [defId, x, y] of list) {
    const b: Building = {
      id: ++id,
      defId,
      x,
      y,
      connected: true,
      progress: 0,
      state: 'ok',
      island: 0,
    };
    world.buildings[b.id] = b;
  }
  return world;
}
const run = (v: World, focus: Parameters<typeof drawFocusMarks>[2], range = FULL) => {
  const { ctx, log } = fakeCtx();
  const n = drawFocusMarks(ctx, { v, ci: CAM, range }, focus, paths as never);
  return { n, strokes: log.events.filter((e) => e.op === 'stroke') };
};
const many = (def: BuildingDefId, n: number, y: number): [BuildingDefId, number, number][] =>
  Array.from({ length: n }, (_, i) => [def, i, y]);

describe('Gut-Fokus Konturen (AK-GC-11)', () => {
  it('focus null: nichts gezeichnet', () => {
    const { n, strokes } = run(worldWith([['lumberjack', 5, 5]]), null);
    expect(n).toBe(0);
    expect(strokes).toHaveLength(0);
  });

  it('nur Gebäude innerhalb der Sichtweite', () => {
    const v = worldWith([
      ['lumberjack', 5, 5],
      ['lumberjack', 50, 50],
    ]);
    const { n } = run(v, { good: 'wood', island: 0 }, { x0: 0, y0: 0, x1: 10, y1: 10 });
    expect(n).toBe(1);
  });

  it('Erzeuger durchgezogen, Verbraucher gestrichelt, Farbe signalFocus, Breite 3', () => {
    const v = worldWith([
      ['lumberjack', 5, 5],
      ['toolmaker', 8, 8],
    ]);
    const { n, strokes } = run(v, { good: 'wood', island: 0 });
    expect(n).toBe(2);
    expect(strokes[0]!.dash).toBeUndefined();
    expect(strokes[1]!.dash).toEqual([6, 4]);
    for (const s of strokes) {
      expect(s.style).toBe(PALETTE.signalFocus);
      expect(s.style).not.toBe(PALETTE.signalYellow);
      expect(s.lineWidth).toBe(3);
    }
  });

  it('50 Erzeuger + 10 Verbraucher: genau MAX, alle Erzeuger', () => {
    const v = worldWith([...many('lumberjack', 50, 1), ...many('toolmaker', 10, 3)]);
    const { n, strokes } = run(v, { good: 'wood', island: 0 });
    expect(n).toBe(MAX_FOCUS_MARKS);
    expect(strokes).toHaveLength(MAX_FOCUS_MARKS);
    expect(strokes.every((s) => s.dash === undefined)).toBe(true);
  });

  it('30 Erzeuger + 30 Verbraucher: 30 + 10', () => {
    const v = worldWith([...many('lumberjack', 30, 1), ...many('toolmaker', 30, 3)]);
    const { strokes } = run(v, { good: 'wood', island: 0 });
    expect(strokes).toHaveLength(MAX_FOCUS_MARKS);
    expect(strokes.filter((s) => s.dash === undefined)).toHaveLength(30);
    expect(strokes.filter((s) => s.dash !== undefined)).toHaveLength(10);
  });

  it('Häuser, Kontor, andere Güter: keine Kontur', () => {
    const v = worldWith([
      ['house', 2, 2],
      ['quarry', 4, 4],
      ['weaver', 6, 6],
    ]);
    const { n } = run(v, { good: 'wood', island: 0 });
    expect(n).toBe(0);
    expect(Object.values(v.buildings).some((b) => b.defId === 'kontor')).toBe(true);
  });

  it('schreibt nie in die Welt', () => {
    const v = worldWith([
      ['lumberjack', 5, 5],
      ['toolmaker', 8, 8],
    ]);
    const before = JSON.stringify(v);
    run(v, { good: 'wood', island: 0 });
    expect(JSON.stringify(v)).toBe(before);
  });
});
