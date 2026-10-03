import { beforeAll, describe, expect, it } from 'vitest';
import {
  centerOn,
  visibleTileRange,
  worldToScreen,
  type Camera,
  type TileRange,
} from '../../src/render/camera';
import { spriteBounds } from '../../src/render/iso';
import { isLit } from '../../src/render/daynight';
import { PALETTE } from '../../src/render/palette';
import { render } from '../../src/render/renderer';
import {
  MARK_MIN_PX,
  MAX_MARKS,
  drawStatusMarks,
  statusMarkOf,
} from '../../src/render/statusMarks';
import { resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { center, createWorld } from '../../src/sim/world';
import type { Building, BuildingDefId, BuildingState, World } from '../../src/sim/types';
import { fakeCtx } from './fakeCtx';

const VIEW = { w: 1280, h: 720 };
const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;
const FULL: TileRange = { x0: 0, y0: 0, x1: 63, y1: 63 };

beforeAll(() => {
  setCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetTreeCache();
});

/** Welt mit frei gesetzten Gebäuden (nur für Darstellungstests, keine Sim-Regeln nötig). */
function worldWith(list: [BuildingDefId, number, number, BuildingState][]): World {
  const world = createWorld(3);
  let id = 1000;
  for (const [defId, x, y, state] of list) {
    const b: Building = { id: ++id, defId, x, y, connected: true, progress: 0, state };
    world.buildings[b.id] = b;
  }
  return world;
}
const camAt = (world: World, zoom: number): Camera => {
  const k = world.buildings[world.kontorId]!;
  const c = center(BUILDING_DEFS.kontor, k.x, k.y);
  const cam = { x: 0, y: 0, zoom };
  centerOn(cam, c.cx, c.cy, VIEW, { w: world.width, h: world.height });
  return cam;
};
const kontorXY = (world: World): [number, number] => {
  const k = world.buildings[world.kontorId]!;
  return [k.x, k.y];
};

describe('H-R3 statusMarkOf', () => {
  it('RF-1 waitingInput = Pfeil nach unten, storageFull = Kiste, verschiedene Form', () => {
    expect(statusMarkOf('waitingInput')?.shape).toBe('arrow');
    expect(statusMarkOf('storageFull')?.shape).toBe('crate');
    expect(statusMarkOf('waitingInput')?.color).toBe(PALETTE.signalWarn);
    expect(statusMarkOf('storageFull')?.color).toBe(PALETTE.signalYellow);
  });

  it('RF-1 ok, notConnected, burning: keine Marke', () => {
    for (const s of ['ok', 'notConnected', 'burning']) expect(statusMarkOf(s)).toBeNull();
  });

  it('RF-1 unbekannte Zustände: keine Marke, keine Ausnahme', () => {
    for (const s of ['noService', '', 'toString', '__proto__', 'constructor'])
      expect(statusMarkOf(s as never)).toBeNull();
    expect(statusMarkOf(undefined as never)).toBeNull();
    expect(statusMarkOf(null as never)).toBeNull();
    expect(statusMarkOf(42 as never)).toBeNull();
  });
});

describe('H-R3 drawStatusMarks', () => {
  it('RF-2 Marke für Betriebe, nicht für Haus und Kontor', () => {
    const world = worldWith([
      ['lumberjack', 5, 5, 'waitingInput'],
      ['house', 8, 5, 'waitingInput'],
      ['fisher', 11, 5, 'storageFull'],
    ]);
    world.buildings[world.kontorId]!.state = 'waitingInput';
    const { ctx } = fakeCtx();
    expect(drawStatusMarks(ctx, world, camAt(world, 1), FULL, 0, false)).toBe(2);
  });

  it('RF-2 Marke sitzt über der Sprite-Oberkante und ist bei Zoom 0,75 mindestens MARK_MIN_PX gross', () => {
    const world = worldWith([['lumberjack', 5, 5, 'waitingInput']]);
    const cam = camAt(world, 0.75);
    const { ctx, log } = fakeCtx();
    drawStatusMarks(ctx, world, cam, FULL, 0, true);
    const fills = log.events.filter((e) => e.op === 'fill' && e.style === PALETTE.signalWarn);
    expect(fills.length).toBeGreaterThan(0);
    const pts = fills.flatMap((e) => e.points);
    const w = Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x));
    const h = Math.max(...pts.map((p) => p.y)) - Math.min(...pts.map((p) => p.y));
    expect(MARK_MIN_PX).toBeGreaterThanOrEqual(10);
    expect(Math.max(w, h)).toBeGreaterThanOrEqual(MARK_MIN_PX);
    const lj = Object.values(world.buildings).find((b) => b.defId === 'lumberjack')!;
    const box = spriteBounds(BUILDING_DEFS.lumberjack, lj);
    const top = worldToScreen(cam, { x: box.x + box.w / 2, y: box.y }).y;
    expect(Math.max(...pts.map((p) => p.y))).toBeLessThanOrEqual(top);
  });

  it('RF-2 Pulsieren nur ohne reduce: reduce liefert zu jeder Zeit dasselbe Bild', () => {
    const world = worldWith([['lumberjack', 5, 5, 'storageFull']]);
    const cam = camAt(world, 1);
    const run = (t: number, reduce: boolean) => {
      const { ctx, log } = fakeCtx();
      drawStatusMarks(ctx, world, cam, FULL, t, reduce);
      return JSON.stringify(log.events.map((e) => [e.op, e.points, e.alpha]));
    };
    expect(run(0, true)).toBe(run(777, true));
    expect(run(0, false)).not.toBe(run(300, false));
  });

  it('RF-2 nur Gebäude im Bild: ausserhalb der Kachelreichweite keine Marke', () => {
    const world = worldWith([['lumberjack', 40, 40, 'waitingInput']]);
    const { ctx } = fakeCtx();
    const range: TileRange = { x0: 0, y0: 0, x1: 20, y1: 20 };
    expect(drawStatusMarks(ctx, world, camAt(world, 1), range, 0, false)).toBe(0);
  });

  it('RF-2 Obergrenze MAX_MARKS', () => {
    const list: [BuildingDefId, number, number, BuildingState][] = [];
    for (let i = 0; i < MAX_MARKS + 20; i++)
      list.push(['lumberjack', (i % 25) * 2, Math.floor(i / 25) * 2 + 20, 'waitingInput']);
    const world = worldWith(list);
    const { ctx } = fakeCtx();
    expect(drawStatusMarks(ctx, world, camAt(world, 1), FULL, 0, false)).toBeLessThanOrEqual(
      MAX_MARKS,
    );
  });

  it('RF-2 save/restore ausgeglichen, Matrix unverändert, Welt unverändert, unbekannter Zustand harmlos', () => {
    const world = worldWith([
      ['lumberjack', 5, 5, 'waitingInput'],
      ['fisher', 9, 5, 'noService' as never],
      ['quarry', 13, 5, undefined as never],
    ]);
    const before = JSON.stringify(world);
    const { ctx, log } = fakeCtx();
    const n = drawStatusMarks(ctx, world, camAt(world, 1), FULL, 5, false);
    expect(n).toBe(1);
    expect(log.saves).toBe(log.restores);
    expect(log.underflow).toBe(0);
    expect(log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
    expect(JSON.stringify(world)).toBe(before);
  });

  it('RF-2 Farben nur aus der Palette (plus Weiss und dunkle Kontur)', () => {
    const world = worldWith([
      ['lumberjack', 5, 5, 'waitingInput'],
      ['fisher', 9, 5, 'storageFull'],
    ]);
    const { ctx, log } = fakeCtx();
    drawStatusMarks(ctx, world, camAt(world, 1), FULL, 0, true);
    const ok = new Set(
      Object.values(PALETTE)
        .map((c) => c.toLowerCase())
        .concat(['rgba(255,255,255,0.85)']),
    );
    for (const s of [...log.fillSet, ...log.strokeSet]) expect(ok.has(s.toLowerCase())).toBe(true);
  });
});

describe('H-R3 Anschluss im Renderer', () => {
  it('RF-3 Marke wird nach dem Multiply-Durchgang gezeichnet (ungetönt)', () => {
    const world = worldWith([]);
    const [kx, ky] = kontorXY(world);
    const b: Building = {
      id: 2001,
      defId: 'lumberjack',
      x: kx + 4,
      y: ky,
      connected: true,
      progress: 0,
      state: 'waitingInput',
    };
    world.buildings[b.id] = b;
    const cam = camAt(world, 1);
    const { ctx, log } = fakeCtx();
    render(ctx, world, cam, layer, null, null, VIEW, {
      timeMs: 0,
      weather: { kind: 'rain', w: 1 },
    });
    const mul = log.events.findIndex((e) => e.composite === 'multiply');
    expect(mul).toBeGreaterThanOrEqual(0);
    const mark = log.events.findIndex(
      (e, i) => i > mul && e.op === 'fill' && e.style === PALETTE.signalWarn,
    );
    expect(mark).toBeGreaterThan(mul);
    expect(log.saves).toBe(log.restores);
    expect(visibleTileRange(cam, VIEW, { w: world.width, h: world.height }).x1).toBeGreaterThan(kx);
  });
});

describe('M11 Marke noForest (Spec 8)', () => {
  it('AK-RND-03 noForest: eigene Marke (Form ≠ waitingInput), wird gezeichnet, gilt nachts als stillstehend', () => {
    const m = statusMarkOf('noForest');
    expect(m?.shape).toBe('stump');
    expect(m!.shape).not.toBe(statusMarkOf('waitingInput')!.shape);
    expect(m!.color).toBe(PALETTE.signalRed);
    const world = worldWith([['lumberjack', 5, 5, 'noForest']]);
    const { ctx, log } = fakeCtx();
    expect(drawStatusMarks(ctx, world, camAt(world, 1), FULL, 0, true)).toBe(1);
    expect(log.fillSet).toContain(PALETTE.signalRed);
    const b = world.buildings[1001]!;
    expect(isLit(BUILDING_DEFS.lumberjack, b)).toBe(false);
  });
});
