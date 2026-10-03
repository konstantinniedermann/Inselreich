import { beforeAll, describe, expect, it, vi } from 'vitest';

// R1 läuft vor T07/T09: Stufentabelle gemockt (Fischer Stufe 2: Zyklus 24, Anhang 01 A.4).
vi.mock('../../src/sim/defs/levels', () => {
  const lv = (cycle: number) => ({
    cycle,
    upkeep: 1,
    cost: {},
    fee: { good: 'tools', amount: 1 },
  });
  return { LEVELS: { fisher: [lv(24), lv(16)] } };
});

import { centerOn, type Camera, type TileRange } from '../../src/render/camera';
import { PALETTE } from '../../src/render/palette';
import { MAX_RINGS, drawProgressRings, ringFraction, ringView } from '../../src/render/ring';
import { resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { center, createWorld } from '../../src/sim/world';
import type { Building, BuildingDefId, BuildingState, World } from '../../src/sim/types';
import { fakeCtx } from './fakeCtx';

const VIEW = { w: 1280, h: 720 };
const FULL: TileRange = { x0: 0, y0: 0, x1: 63, y1: 63 };

beforeAll(() => {
  setCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetTreeCache();
});

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

describe('M11 Fortschrittsring (Spec 8)', () => {
  const mk = (defId: BuildingDefId, extra: Partial<Building> = {}): Building => ({
    id: 1,
    defId,
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    ...extra,
  });
  it('AK-RND-04 ringFraction: Fischer progress 20 → 0,5; Stufe 2 progress 12 → 0,5; höchstens 0,99999', () => {
    expect(ringFraction(mk('fisher', { progress: 20 }), 0)).toBe(0.5);
    expect(ringFraction(mk('fisher', { progress: 12, level: 2 }), 0)).toBe(0.5);
    expect(ringFraction(mk('fisher', { progress: 39 }), 1)).toBe(0.99999);
    expect(ringFraction(mk('fisher', { progress: 10 }), 0.5)).toBeCloseTo(10.5 / 40, 12);
    expect(ringFraction(mk('chapel', { progress: 10 }), 0.5)).toBe(0);
  });
  it('AK-RND-04 ringView: läuft nur bei ok und angebunden, sonst eingefroren ohne Bruchteil; ohne produces null', () => {
    expect(ringView(mk('fisher', { progress: 20 }), 0.6)).toEqual({
      fraction: 20.6 / 40,
      running: true,
    });
    expect(ringView(mk('fisher', { progress: 20, state: 'waitingInput' }), 0.6)).toEqual({
      fraction: 0.5,
      running: false,
    });
    expect(ringView(mk('lumberjack', { progress: 15, state: 'noForest' }), 0.6)).toEqual({
      fraction: 0.5,
      running: false,
    });
    expect(ringView(mk('fisher', { progress: 20, connected: false }), 0.6)!.running).toBe(false);
    expect(ringView(mk('chapel'), 0.6)).toBeNull();
  });
  it('AK-RND-04 drawProgressRings: Farben laufend/grau, Culling, MAX_RINGS, save/restore, Welt unverändert', () => {
    const world = worldWith([
      ['fisher', 5, 5, 'ok'],
      ['weaver', 9, 5, 'waitingInput'],
      ['chapel', 13, 5, 'ok'],
    ]);
    world.buildings[1002]!.progress = 10; // eingefrorener Bogen nur sichtbar mit Fortschritt > 0
    const before = JSON.stringify(world);
    const { ctx, log } = fakeCtx();
    expect(drawProgressRings(ctx, world, camAt(world, 1), FULL, 0.5)).toBe(2);
    expect(log.strokeSet).toContain(PALETTE.signalOk);
    expect(log.strokeSet).toContain(PALETTE.rockLight);
    expect(log.saves).toBe(log.restores);
    expect(JSON.stringify(world)).toBe(before);
    const allowed = new Set<string>([...Object.values(PALETTE), 'rgba(255,255,255,0.85)']);
    for (const c of [...log.fillSet, ...log.strokeSet]) expect(allowed.has(c)).toBe(true);

    // Randfälle: ok aber nicht angebunden, und noForest → grau, aber gezeichnet
    const edge = worldWith([
      ['fisher', 5, 5, 'ok'],
      ['lumberjack', 9, 5, 'noForest'],
    ]);
    edge.buildings[1001]!.connected = false;
    edge.buildings[1001]!.progress = 10;
    edge.buildings[1002]!.progress = 10;
    const f1 = fakeCtx();
    expect(drawProgressRings(f1.ctx, edge, camAt(edge, 1), FULL, 0.5)).toBe(2);
    expect(f1.log.strokeSet).toContain(PALETTE.rockLight);
    expect(f1.log.strokeSet).not.toContain(PALETTE.signalOk);

    const none: TileRange = { x0: 40, y0: 40, x1: 41, y1: 41 };
    const f2 = fakeCtx();
    expect(drawProgressRings(f2.ctx, world, camAt(world, 1), none, 0)).toBe(0);

    const many = worldWith(
      Array.from({ length: 80 }, (_, i): [BuildingDefId, number, number, BuildingState] => [
        'fisher',
        (i % 20) * 3,
        Math.floor(i / 20) * 3 + 20,
        'ok',
      ]),
    );
    const f3 = fakeCtx();
    expect(drawProgressRings(f3.ctx, many, camAt(many, 1), FULL, 0)).toBe(MAX_RINGS);
    expect(MAX_RINGS).toBe(60);
    expect(f3.log.saves).toBe(f3.log.restores);
  });
});
