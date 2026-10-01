import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { lightAt } from '../../src/render/daynight';
import { TEX, sortedObjects } from '../../src/render/iso';
import { PALETTE, SHADOW } from '../../src/render/palette';
import { resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import { centerOn, groundMatrix, visibleTileRange } from '../../src/render/camera';
import { render, renderStats, type Hover } from '../../src/render/renderer';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { placeBuilding } from '../../src/sim/build';
import { center, createWorld, idx } from '../../src/sim/world';
import type { BuildingDefId, World } from '../../src/sim/types';
import { forceRect } from '../sim/helpers';
import { fakeCtx, type Ev, type Mat } from './fakeCtx';

interface Call {
  kind: 'body' | 'air' | 'tree' | 'ship';
  id: number;
  at: number;
}
const h = vi.hoisted(() => ({
  calls: [] as Call[],
  terrain: { scale: 1, patch: { redrawn: false, ms: 0 }, halfCalls: 0 },
}));
const at = (ctx: unknown): number => (ctx as { events: unknown[] }).events.length;

vi.mock('../../src/render/sprites', async (orig) => {
  const m = await orig<typeof import('../../src/render/sprites')>();
  return {
    ...m,
    drawBody: (...a: Parameters<typeof m.drawBody>) => {
      h.calls.push({ kind: 'body', id: a[3].id, at: at(a[0]) });
      return m.drawBody(...a);
    },
    drawAir: (...a: Parameters<typeof m.drawAir>) => {
      h.calls.push({ kind: 'air', id: a[3].id, at: at(a[0]) });
      return m.drawAir(...a);
    },
  };
});
vi.mock('../../src/render/trees', async (orig) => {
  const m = await orig<typeof import('../../src/render/trees')>();
  return {
    ...m,
    drawTreeStamp: (...a: Parameters<typeof m.drawTreeStamp>) => {
      h.calls.push({ kind: 'tree', id: a[2].id, at: at(a[0]) });
      return m.drawTreeStamp(...a);
    },
  };
});
vi.mock('../../src/render/ship', async (orig) => {
  const m = await orig<typeof import('../../src/render/ship')>();
  return {
    ...m,
    drawShip: (...a: Parameters<typeof m.drawShip>) => {
      h.calls.push({ kind: 'ship', id: 0, at: at(a[0]) });
      return m.drawShip(...a);
    },
  };
});
vi.mock('../../src/render/terrain', async (orig) => {
  const m = await orig<typeof import('../../src/render/terrain')>();
  return {
    ...m,
    terrainScale: () => h.terrain.scale,
    updateTerrainLayer: () => h.terrain.patch,
    halfLayer: (l: HTMLCanvasElement) => {
      h.terrain.halfCalls++;
      return l;
    },
  };
});

const VIEW = { w: 1280, h: 720 };
const BASE = (dpr: number): Mat => [dpr, 0, 0, dpr, 0, 0];
const isBase = (m: Mat): boolean => m.every((v, i) => v === BASE(1)[i]);
const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;

/** Welt mit Kontor, Haus, Markt, Weberei (roh gesetzt, raucht) und einem Weg (ISO §5: Wege vor den Körpern). */
function scene(): { world: World; ids: Record<string, number> } {
  const world = createWorld(3);
  const k = world.buildings[world.kontorId]!;
  forceRect(world, k.x + 3, k.y + 3, 6, 6, 'grass');
  world.money = 100000;
  for (const g of Object.keys(world.stock) as (keyof World['stock'])[]) world.stock[g] = 1000;
  const ids: Record<string, number> = {};
  const put = (d: BuildingDefId, x: number, y: number): void => {
    const r = placeBuilding(world, d, k.x + x, k.y + y);
    expect(r.ok, `${d}`).toBe(true);
    ids[d] = r.id!;
  };
  put('market', 3, 3);
  put('house', 6, 3);
  put('house', 3, 6);
  const w = world.nextBuildingId++;
  world.buildings[w] = {
    id: w,
    defId: 'weaver',
    x: k.x + 6,
    y: k.y + 6,
    connected: true,
    progress: 0,
    state: 'ok',
  };
  for (const p of [0, 1, 2, 3])
    world.tiles[(k.y + 6 + (p >> 1)) * world.width + k.x + 6 + (p & 1)]!.buildingId = w;
  ids.weaver = w;
  for (let y = 3; y < 9; y++) world.tiles[idx(world, k.x + 5, k.y + y)]!.road = true; // Weg
  return { world, ids };
}
const camFor = (world: World, zoom: number) => {
  const k = world.buildings[world.kontorId]!;
  const c = center(BUILDING_DEFS.kontor, k.x, k.y);
  const cam = { x: 0, y: 0, zoom };
  centerOn(cam, c.cx + 3, c.cy + 3, VIEW, { w: world.width, h: world.height });
  return cam;
};
const order = { period: 1, good: 'wood' as const, amount: 5, reward: 100, due: 999 };

beforeAll(() => {
  // Node hat kein document: Offscreen-Canvas der Baumstempel durch einen Fake ersetzen
  setCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetTreeCache();
});
beforeEach(() => {
  h.calls.length = 0;
  h.terrain.scale = 1;
  h.terrain.patch = { redrawn: false, ms: 0 };
  h.terrain.halfCalls = 0;
});

describe('Renderer', () => {
  it('RF-7 nach render(): save/restore ausgeglichen, Matrix wie vor dem Aufruf (Zoom 0,5 und 2, mit raster)', () => {
    for (const zoom of [0.5, 2])
      for (const raster of [true, false])
        for (const empty of [false, true]) {
          const { world, ids } = scene();
          world.order = order;
          world.tick = 3000;
          const cam = camFor(world, zoom);
          const k = world.buildings[world.kontorId]!;
          if (empty) {
            world.buildings = {};
            world.nextBuildingId = 2;
          }
          const hover: Hover = {
            x: k.x,
            y: k.y,
            tool: { kind: 'build', defId: 'market' },
            ok: true,
          };
          for (const hv of [hover, { ...hover, tool: { kind: 'select' as const } }, null]) {
            const { ctx, log } = fakeCtx();
            ctx.setTransform(2, 0, 0, 2, 0, 0);
            render(ctx, world, cam, layer, hv, empty ? null : ids.market!, VIEW, {
              timeMs: 1234,
              dayNight: true,
              raster,
            });
            expect(log.saves).toBe(log.restores);
            expect(log.underflow).toBe(0);
            expect(log.matrix).toEqual(BASE(2));
          }
        }
  });

  it('AK-R1-05 genau ein fillRect mit multiply am Abend, keiner mit dayNight false oder bei Tick 0', () => {
    const { world } = scene();
    world.tick = 2300;
    const cam = camFor(world, 1);
    const multiply = (evs: Ev[]) =>
      evs.filter((e) => e.op === 'fillRect' && e.composite === 'multiply');
    let { ctx, log } = fakeCtx();
    render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0, dayNight: true });
    expect(multiply(log.events)).toHaveLength(1);
    expect(renderStats.multiplyFills).toBe(1);
    const want = lightAt(2300).mul.map((c) => Math.round(c * 255));
    expect(multiply(log.events)[0]!.style).toBe(`rgb(${want.join(',')})`);
    ({ ctx, log } = fakeCtx());
    render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0, dayNight: false });
    expect(log.events.filter((e) => e.composite === 'multiply')).toHaveLength(0);
    expect(renderStats.multiplyFills).toBe(0);
    world.tick = 0; // neutral: Durchgang entfällt
    ({ ctx, log } = fakeCtx());
    render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0, dayNight: true });
    expect(log.events.filter((e) => e.composite === 'multiply')).toHaveLength(0);
    expect(log.compositeSet.filter((c) => c === 'lighter').length).toBeLessThanOrEqual(1);
  });

  it('ISO §5 Ebenen: Hintergrund, Boden, Wege, ein Schattenpfad, Körper in sortedObjects-Reihenfolge, Luft, Tönung, Signale', () => {
    const { world, ids } = scene();
    world.order = order;
    world.tick = 3000; // Nacht: Tönung sichtbar
    const cam = camFor(world, 1);
    const { ctx, log } = fakeCtx();
    render(ctx, world, cam, layer, null, ids.house!, VIEW, { timeMs: 500, dayNight: true });
    const ev = log.events;
    // 1 Hintergrund
    expect(ev[0]!.op).toBe('fillRect');
    expect(ev[0]!.style).toBe(PALETTE.waterDeep);
    // 2 Boden unter der Bodenmatrix
    const img = ev.findIndex((e) => e.op === 'drawImage');
    expect(img).toBeGreaterThanOrEqual(0);
    expect(isBase(ev[img]!.matrix)).toBe(false);
    // 4 Wege: Bodenfüllungen nach dem Boden (der Weg des Szenarios) …
    const ground = (e: Ev): boolean => !isBase(e.matrix) && e.op !== 'transform';
    const roads = ev
      .map((e, i) => (e.op === 'fillRect' && ground(e) && i > img ? i : -1))
      .filter((i) => i >= 0);
    expect(roads.length).toBeGreaterThan(0);
    // 5 genau eine Schattenfüllung, unter der Bodenmatrix, nach den Wegen
    const shadows = ev
      .map((e, i) => (e.op === 'fill' && e.style === SHADOW ? i : -1))
      .filter((i) => i >= 0);
    expect(shadows).toHaveLength(1);
    expect(ground(ev[shadows[0]!]!)).toBe(true);
    expect(renderStats.shadowFills).toBe(1);
    expect(shadows[0]!).toBeGreaterThan(Math.max(...roads));
    // 6 Körper in sortedObjects-Reihenfolge (nach dem Schatten), Arbeitszeichen/Rauch gehören nicht dazu
    const bodies = h.calls.filter((c) => c.kind === 'body');
    const expected = sortedObjects(world, [])
      .filter((i) => i.kind === 'building')
      .map((i) => i.id);
    expect(bodies.map((c) => c.id)).toEqual(expected);
    expect(bodies[0]!.at).toBeGreaterThan(shadows[0]!);
    // ISO §5: alles unter der Bodenmatrix (Textur, Wellen, Wege, Schatten) kommt vor dem ersten Körper
    const lastGround = ev.map((e) => ground(e)).lastIndexOf(true);
    expect(lastGround).toBeLessThan(bodies[0]!.at);
    // 7 Luft nach dem letzten Körper, vor der Tönung
    const airs = h.calls.filter((c) => c.kind === 'air');
    expect(airs.length).toBeGreaterThan(0);
    const mul = ev.findIndex((e) => e.composite === 'multiply');
    expect(mul).toBeGreaterThan(0);
    for (const a of airs) {
      expect(a.at).toBeGreaterThanOrEqual(bodies[bodies.length - 1]!.at);
      expect(a.at).toBeLessThan(mul);
    }
    // 9 Tönung: ein Durchgang, danach Signale ungetönt und im Bildraum
    expect(ev.filter((e) => e.composite === 'multiply')).toHaveLength(1);
    const sel = ev.findIndex((e) => e.op === 'stroke' && e.style === PALETTE.signalYellow);
    expect(sel).toBeGreaterThan(mul);
    expect(ev[sel]!.composite).toBe('source-over');
    for (const e of ev)
      if (e.style === PALETTE.signalYellow || e.style === '#fff')
        expect(isBase(e.matrix)).toBe(true);
    expect(log.saves).toBe(log.restores);
  });

  it('ISO §5 Schatten: ein Pfad mit Gebäuden, Baumstempeln und Schiff', () => {
    const { world } = scene();
    world.order = order;
    const k = world.buildings[world.kontorId]!;
    forceRect(world, k.x + 9, k.y + 2, 2, 1, 'forest');
    const cam = camFor(world, 1);
    const run = (w: World) => {
      const { ctx, log } = fakeCtx();
      render(ctx, w, cam, layer, null, null, VIEW, { timeMs: 0 });
      return log.events.filter((e) => e.style === SHADOW);
    };
    const full = run(world);
    expect(full).toHaveLength(1);
    const noShip = { ...world, order: null } as World;
    const few = run(noShip);
    expect(few).toHaveLength(1);
    expect(full[0]!.points.length).toBeGreaterThan(few[0]!.points.length); // Schiff steht im selben Pfad
    expect(h.calls.some((c) => c.kind === 'tree')).toBe(true);
  });

  it('ISO D-09 (AK-ISO-10) Baumstempel im sortierten Durchgang: Reihenfolge wie sortedObjects, nur sichtbare Kacheln', () => {
    const { world } = scene();
    world.order = order;
    const k = world.buildings[world.kontorId]!;
    forceRect(world, k.x + 9, k.y + 2, 4, 4, 'forest');
    forceRect(world, k.x > 32 ? 1 : 58, k.y > 32 ? 1 : 58, 3, 3, 'forest'); // ausserhalb des Bildes
    const cam = camFor(world, 1);
    const range = visibleTileRange(cam, VIEW, { w: world.width, h: world.height });
    const { ctx } = fakeCtx();
    render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0 });
    const seq = h.calls.filter((c) => c.kind !== 'air');
    const ship = seq.filter((c) => c.kind === 'ship');
    expect(ship).toHaveLength(1);
    const items = sortedObjects(world, []).filter(
      (i) =>
        i.kind === 'building' ||
        (i.kind === 'tree' &&
          i.fp.x >= range.x0 &&
          i.fp.x <= range.x1 &&
          i.fp.y >= range.y0 &&
          i.fp.y <= range.y1),
    );
    expect(items.filter((i) => i.kind === 'tree').length).toBeGreaterThanOrEqual(16);
    expect(seq.filter((c) => c.kind !== 'ship').map((c) => `${c.kind}${c.id}`)).toEqual(
      items.map((i) => `${i.kind === 'tree' ? 'tree' : 'body'}${i.id}`),
    );
  });

  it('ISO §5 (N2) Bruchprobe-Szene: der Weg liegt vor dem ersten Körper — nach den Körpern gezeichnete Wege würden diesen Test röten', () => {
    const { world } = scene();
    const cam = camFor(world, 1);
    const { ctx, log } = fakeCtx();
    render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0 });
    const firstBody = h.calls.find((c) => c.kind === 'body')!.at;
    const roadFills = log.events
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => e.op === 'fillRect' && !isBase(e.matrix) && e.matrix[0] !== 1);
    expect(roadFills.length).toBeGreaterThan(0);
    for (const { i } of roadFills) expect(i).toBeLessThan(firstBody);
  });

  it('AK-R1-06 Teil-Neuzeichnung wird je Frame angestossen und gezählt (terrainPatches, terrainPatchMs)', () => {
    const { world } = scene();
    const cam = camFor(world, 1);
    const before = renderStats.terrainPatches;
    h.terrain.patch = { redrawn: true, ms: 3.5 };
    render(fakeCtx().ctx, world, cam, layer, null, null, VIEW, { timeMs: 0 });
    expect(renderStats.terrainPatches).toBe(before + 1);
    expect(renderStats.terrainPatchMs).toBe(3.5);
    h.terrain.patch = { redrawn: false, ms: 0 };
    render(fakeCtx().ctx, world, cam, layer, null, null, VIEW, { timeMs: 0 });
    expect(renderStats.terrainPatches).toBe(before + 1);
  });

  it('ISO §5 Boden: Faktor aus der Ebene, bei Zoom ≤ 0,5 die halbe Kopie (halfDraws)', () => {
    const { world } = scene();
    for (const scale of [1, 2]) {
      h.terrain.scale = scale;
      const cam = camFor(world, 1);
      const { ctx, log } = fakeCtx();
      render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0 });
      const img = log.events.find((e) => e.op === 'drawImage')!;
      expect(img.matrix).toEqual(groundMatrix(cam, TEX * scale));
    }
    h.terrain.scale = 2;
    const half = camFor(world, 0.5);
    const d0 = renderStats.halfDraws;
    const { ctx, log } = fakeCtx();
    render(ctx, world, half, layer, null, null, VIEW, { timeMs: 0 });
    expect(renderStats.halfDraws).toBe(d0 + 1);
    expect(log.events.find((e) => e.op === 'drawImage')!.matrix).toEqual(groundMatrix(half, TEX));
    render(fakeCtx().ctx, world, camFor(world, 0.75), layer, null, null, VIEW, { timeMs: 0 });
    expect(renderStats.halfDraws).toBe(d0 + 1);
  });

  it('AK-R1-07 Signale nach dem Licht: Geist (Deckkraft 0,5), Auswahl, rote Punkte; Bedarfssymbole stehen in badges', () => {
    const { world, ids } = scene();
    world.tick = 3000;
    const cam = camFor(world, 1);
    const k = world.buildings[world.kontorId]!;
    world.buildings[ids.weaver!]!.connected = false;
    const hover: Hover = {
      x: k.x + 3,
      y: k.y + 3,
      tool: { kind: 'build', defId: 'house' },
      ok: true,
    };
    const { ctx, log } = fakeCtx();
    render(ctx, world, cam, layer, hover, ids.house!, VIEW, { timeMs: 0, dayNight: true });
    const mul = log.events.findIndex((e) => e.composite === 'multiply');
    const ghost = log.events
      .map((e, i) => (e.alpha === 0.5 && e.op === 'fill' ? i : -1))
      .filter((i) => i >= 0);
    expect(ghost.length).toBeGreaterThan(5);
    for (const i of ghost) expect(i).toBeGreaterThan(mul);
    expect(
      log.events.every(
        (e, i) => i <= mul || e.alpha === 1 || ghost.includes(i) || e.op === 'stroke',
      ),
    ).toBe(true);
    const red = log.events.findIndex((e) => e.op === 'fill' && e.style === PALETTE.signalRed);
    expect(red).toBeGreaterThan(mul);
    expect(log.globalAlpha).toBe(1);
    // Signalfarben kommen vor der Tönung nicht vor
    const before = log.events.slice(0, mul);
    const signals: string[] = [
      PALETTE.signalRed,
      PALETTE.signalYellow,
      PALETTE.signalWarn,
      PALETTE.signalOk,
    ];
    for (const e of before) expect(signals).not.toContain(e.style);
    expect(renderStats.badges.some((b) => b.kind === 'unconnected' && b.id === ids.weaver)).toBe(
      true,
    );
  });
});
