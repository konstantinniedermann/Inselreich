import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { isLit, lightAt, phaseAt } from '../../src/render/daynight';
import { faunaAt } from '../../src/render/fauna';
import { SMOKE_COLOR } from '../../src/render/fx';
import { weatherMul } from '../../src/render/weather';
import { TEX, sortedObjects, spriteBounds } from '../../src/render/iso';
import { PALETTE, SHADOW, rgbOfCss, rgbaOf } from '../../src/render/palette';
import { resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import {
  decorCacheClears,
  decorCacheSeed,
  resetDecorCache,
  setDecorCanvasFactory,
  type DecorItem,
} from '../../src/render/decorStamps';
import { centerOn, groundMatrix, visibleTileRange } from '../../src/render/camera';
import { islandCam, islandView } from '../../src/render/archipel';
import { tileToScreen } from '../../src/render/camera';
import { foundKontor2Literal, seaWorld, shipLiteral } from '../sim/seaHelpers';
import { seaShipAfter, shipPose, shipScale } from '../../src/render/shipLane';
import { drawShip } from '../../src/render/ship';
import { lumberjackLiteral } from './seaRender';
import { project } from '../../src/render/iso';
import {
  render,
  renderStats,
  waterSides,
  type Hover,
  type RenderFx,
} from '../../src/render/renderer';
import {
  HEARTH_COLOR,
  HEARTH_PUFFS,
  anchorsFor,
  walkerAt,
  roadGraph,
  walkerCount,
  EPISODE_MS,
  GLOW_RADIUS,
  GLOW_RING_COUNT,
} from '../../src/render/life';
import { DIM_FIRE } from '../../src/render/renderer';
import { LIGHT_COLORS, mixRgb } from '../../src/render/light';
import { AIR_COLORS } from '../../src/render/sprites';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { placeBuilding } from '../../src/sim/build';
import { home, center, createWorld, idx } from '../../src/sim/world';
import type { BuildingDefId, World } from '../../src/sim/types';
import { readFileSync } from 'node:fs';
import { deserialize } from '../../src/sim/save';
import { fnv1a32, forceRect } from '../sim/helpers';
import { fakeCtx, type Ev, type Mat } from './fakeCtx';

interface Call {
  kind: 'body' | 'air' | 'tree' | 'ship' | 'walker';
  id: number;
  at: number;
  /** Nur Figuren: Kachelposition der Pose. */
  pose?: { x: number; y: number };
}
const h = vi.hoisted(() => ({
  calls: [] as Call[],
  bodyCams: new Map<number, { x: number; y: number; zoom: number }>(),
  treeSeeds: [] as number[],
  decorCalls: [] as { id: number; stamp: string; seed: number; zoom: number }[],
  decorShadows: [] as number[],
  shipScales: [] as number[],
  terrain: {
    scale: 1,
    patch: { redrawn: false, ms: 0 },
    halfCalls: 0,
    quarter: { width: 512, height: 512 },
  },
}));
const at = (ctx: unknown): number => (ctx as { events: unknown[] }).events.length;

vi.mock('../../src/render/sprites', async (orig) => {
  const m = await orig<typeof import('../../src/render/sprites')>();
  return {
    ...m,
    drawBody: (...a: Parameters<typeof m.drawBody>) => {
      h.calls.push({ kind: 'body', id: a[3].id, at: at(a[0]) });
      h.bodyCams.set(a[3].id, { ...a[1] });
      return m.drawBody(...a);
    },
    drawAir: (...a: Parameters<typeof m.drawAir>) => {
      h.calls.push({ kind: 'air', id: a[3].id, at: at(a[0]) });
      return m.drawAir(...a);
    },
  };
});
vi.mock('../../src/render/life', async (orig) => {
  const m = await orig<typeof import('../../src/render/life')>();
  return {
    ...m,
    drawWalker: (...a: Parameters<typeof m.drawWalker>) => {
      h.calls.push({ kind: 'walker', id: -1, at: at(a[0]), pose: { x: a[2].x, y: a[2].y } });
      return m.drawWalker(...a);
    },
  };
});
vi.mock('../../src/render/trees', async (orig) => {
  const m = await orig<typeof import('../../src/render/trees')>();
  return {
    ...m,
    drawTreeStamp: (...a: Parameters<typeof m.drawTreeStamp>) => {
      h.calls.push({ kind: 'tree', id: a[2].id, at: at(a[0]) });
      h.treeSeeds.push(a[3]);
      return m.drawTreeStamp(...a);
    },
  };
});
vi.mock('../../src/render/decorStamps', async (orig) => {
  const m = await orig<typeof import('../../src/render/decorStamps')>();
  return {
    ...m,
    drawDecorStamp: (...a: Parameters<typeof m.drawDecorStamp>) => {
      h.decorCalls.push({ id: a[2].id, stamp: a[2].stamp, seed: a[3], zoom: a[1].zoom });
      return m.drawDecorStamp(...a);
    },
    decorShadow: (...a: Parameters<typeof m.decorShadow>) => {
      h.decorShadows.push(a[0].id);
      return m.decorShadow(...a);
    },
  };
});
vi.mock('../../src/render/ship', async (orig) => {
  const m = await orig<typeof import('../../src/render/ship')>();
  return {
    ...m,
    drawShip: (...a: Parameters<typeof m.drawShip>) => {
      h.calls.push({ kind: 'ship', id: 0, at: at(a[0]) });
      h.shipScales.push(a[4] ?? 1);
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
    quarterLayer: () => h.terrain.quarter,
  };
});

const VIEW = { w: 1280, h: 720 };
const BASE = (dpr: number): Mat => [dpr, 0, 0, dpr, 0, 0];
const isBase = (m: Mat): boolean => m.every((v, i) => v === BASE(1)[i]);
const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;

/** Erdpfad eines Wegs: Strich in `earthEdge` oder `earth` unter der Bodenmatrix (unabhängig von der Steinchen-Dichte). */
const isRoadStroke = (e: Ev): boolean =>
  e.op === 'stroke' &&
  (e.style === PALETTE.earthEdge || e.style === PALETTE.earth) &&
  !isBase(e.matrix) &&
  e.matrix[0] !== 1;

/** Welt mit Kontor, Haus, Markt, Weberei (roh gesetzt, raucht) und einem Weg (ISO §5: Wege vor den Körpern). */
function scene(): { world: World; ids: Record<string, number> } {
  const world = createWorld(3, { unlockAll: true });
  const k = world.buildings[home(world).kontorId]!;
  forceRect(world, k.x + 3, k.y + 3, 6, 6, 'grass');
  world.money = 100000;
  for (const g of Object.keys(home(world).stock) as (keyof ReturnType<typeof home>['stock'])[])
    home(world).stock[g] = 1000;
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
    island: 0,
  };
  for (const p of [0, 1, 2, 3])
    home(world).tiles[(k.y + 6 + (p >> 1)) * home(world).width + k.x + 6 + (p & 1)]!.buildingId = w;
  ids.weaver = w;
  for (let y = 3; y < 9; y++) home(world).tiles[idx(home(world), k.x + 5, k.y + y)]!.road = true; // Weg
  return { world, ids };
}
const camFor = (world: World, zoom: number) => {
  const k = world.buildings[home(world).kontorId]!;
  const c = center(BUILDING_DEFS.kontor, k.x, k.y);
  const cam = { x: 0, y: 0, zoom };
  centerOn(cam, c.cx + 3, c.cy + 3, VIEW, { w: home(world).width, h: home(world).height });
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
  // ebenso für die Deko-Stempel (ART-STIL-02 L4)
  setDecorCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetDecorCache();
});
beforeEach(() => {
  h.calls.length = 0;
  h.decorCalls.length = 0;
  h.decorShadows.length = 0;
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
          const k = world.buildings[home(world).kontorId]!;
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
  }, 20_000);

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
    const roads = ev.map((e, i) => (isRoadStroke(e) && i > img ? i : -1)).filter((i) => i >= 0);
    expect(roads.length).toBeGreaterThanOrEqual(2); // äusserer und innerer Erdpfad
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
    // die Brand-Abdunklung (DIM_FIRE) multipliziert je Gebäude lokal und ist nicht die Tönung
    const mul = ev.findIndex((e) => e.composite === 'multiply' && e.style !== DIM_FIRE);
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
    const k = world.buildings[home(world).kontorId]!;
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
    const k = world.buildings[home(world).kontorId]!;
    forceRect(world, k.x + 9, k.y + 2, 4, 4, 'forest');
    forceRect(world, k.x > 32 ? 1 : 58, k.y > 32 ? 1 : 58, 3, 3, 'forest'); // ausserhalb des Bildes
    const cam = camFor(world, 1);
    const range = visibleTileRange(cam, VIEW, { w: home(world).width, h: home(world).height });
    const { ctx } = fakeCtx();
    render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0 });
    const seq = h.calls.filter((c) => c.kind !== 'air');
    const ship = seq.filter((c) => c.kind === 'ship');
    expect(ship).toHaveLength(1);
    const items = sortedObjects(world, []).filter(
      (i) =>
        i.kind === 'building' ||
        (i.kind === 'tree' &&
          i.fp.x >= range.x0 - 2 &&
          i.fp.x <= range.x1 + 2 &&
          i.fp.y >= range.y0 - 2 &&
          i.fp.y <= range.y1 + 2),
    );
    expect(items.filter((i) => i.kind === 'tree').length).toBeGreaterThanOrEqual(16);
    expect(seq.filter((c) => c.kind !== 'ship').map((c) => `${c.kind}${c.id}`)).toEqual(
      items.map((i) => `${i.kind === 'tree' ? 'tree' : 'body'}${i.id}`),
    );
  });

  it('L1-Befund Culling (WALD-02): die Kronen einer Waldkachel eine Kachel hinter dem Kachelbereich werden gezeichnet, die vier Kacheln dahinter nicht', () => {
    const { world } = scene();
    const cam = camFor(world, 1);
    const isl = home(world);
    const range = visibleTileRange(cam, VIEW, { w: isl.width, h: isl.height });
    const y = Math.floor((range.y0 + range.y1) / 2);
    // rechts oder links des Kachelbereichs, je nachdem wo die Karte Platz hat
    const right = range.x1 + 4 < isl.width;
    const at = (d: number) => (right ? range.x1 + d : range.x0 - d);
    expect(right || range.x0 - 4 >= 0).toBe(true);
    forceRect(world, Math.min(at(1), at(4)), y, 4, 1, 'grass');
    for (const d of [1, 4]) forceRect(world, at(d), y, 1, 1, 'forest');
    const { ctx } = fakeCtx();
    render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0 });
    const drawn = new Set(h.calls.filter((c) => c.kind === 'tree').map((c) => c.id));
    const holders = (tx: number) =>
      sortedObjects(world, [])
        .filter(
          (i) =>
            i.kind === 'tree' &&
            i.crowns.some(
              (c) => Math.floor(i.fp.x + c.cx) === tx && Math.floor(i.fp.y + c.cy) === y,
            ),
        )
        .map((i) => i.id);
    expect(holders(at(1)).length).toBeGreaterThan(0);
    for (const id of holders(at(1))) expect(drawn.has(id)).toBe(true);
    expect(holders(at(4)).length).toBeGreaterThan(0);
    for (const id of holders(at(4))) expect(drawn.has(id)).toBe(false);
  });

  it('ISO §5 (N2) Bruchprobe-Szene: der Weg liegt vor dem ersten Körper — nach den Körpern gezeichnete Wege würden diesen Test röten', () => {
    const { world } = scene();
    const cam = camFor(world, 1);
    const { ctx, log } = fakeCtx();
    render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0 });
    const firstBody = h.calls.find((c) => c.kind === 'body')!.at;
    const roadFills = log.events.map((e, i) => ({ e, i })).filter(({ e }) => isRoadStroke(e));
    expect(roadFills.length).toBeGreaterThanOrEqual(2);
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
    const k = world.buildings[home(world).kontorId]!;
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

  it('Spec 5.5 waterSides wertet alle vier Seiten aus: Wasser nur hinten → nur hinten, vorn → vorn, keins → keine', () => {
    const { world } = scene();
    const k = world.buildings[home(world).kontorId]!;
    forceRect(world, k.x - 2, k.y - 2, 6, 6, 'grass');
    for (const y of [k.y, k.y + 1]) home(world).tiles[idx(home(world), k.x, y)]!.buildingId = k.id;
    const set = (x: number, y: number) =>
      (home(world).tiles[idx(home(world), x, y)]!.terrain = 'water');
    const none = { waterLeft: false, waterRight: false, waterU0: false, waterV0: false };
    expect(waterSides(world, k)).toEqual(none);
    set(k.x - 1, k.y);
    expect(waterSides(world, k)).toEqual({ ...none, waterU0: true });
    forceRect(world, k.x - 1, k.y, 1, 1, 'grass');
    set(k.x + 1, k.y - 1);
    expect(waterSides(world, k)).toEqual({ ...none, waterV0: true });
    forceRect(world, k.x + 1, k.y - 1, 1, 1, 'grass');
    set(k.x + 2, k.y + 1);
    expect(waterSides(world, k)).toEqual({ ...none, waterRight: true });
    forceRect(world, k.x + 2, k.y + 1, 1, 1, 'grass');
    set(k.x, k.y + 2);
    expect(waterSides(world, k)).toEqual({ ...none, waterLeft: true });
  });

  it('ISO §5 Schatten: Gebäude knapp ausserhalb des Bildes werfen ihren Schatten noch ins Bild (Culling um die Schattenlänge erweitert)', () => {
    const { world, ids } = scene();
    world.order = null;
    world.tick = 3000; // Nacht: keine Möwen und ihre Schatten im Zähler
    // keine Baum- und Felsschatten (H-R8) im Zähler
    for (const t of home(world).tiles)
      if (t.terrain === 'forest' || t.terrain === 'mountain') t.terrain = 'grass';
    // und keine Deko-Stempel-Schatten (L4): Stempel stehen nur auf Gras, also bleibt kein freies Gras
    for (const t of home(world).tiles)
      if (t.terrain === 'grass' && t.buildingId === null) t.terrain = 'sand';
    const keep = world.buildings[ids.market!]!;
    world.buildings = { [keep.id]: keep };
    const box = spriteBounds(BUILDING_DEFS.market, keep);
    const shadowPoints = (gap: number): number => {
      const cam = { x: box.x + box.w + gap, y: box.y - 100, zoom: 1 };
      const { ctx, log } = fakeCtx();
      render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0 });
      return log.events.filter((e) => e.style === SHADOW).reduce((n, e) => n + e.points.length, 0);
    };
    expect(shadowPoints(10)).toBeGreaterThan(0); // Körper links ausserhalb, Schatten im Rand
    expect(shadowPoints(400)).toBe(0);
    h.calls.length = 0;
    const cam = { x: box.x + box.w + 10, y: box.y - 100, zoom: 1 };
    render(fakeCtx().ctx, world, cam, layer, null, null, VIEW, { timeMs: 0 });
    expect(h.calls.filter((c) => c.kind === 'body')).toHaveLength(0); // gezeichnet wird er nicht
  });

  describe('M7-R3 Wetter und Krisen-Effekte', () => {
    const storm = { kind: 'storm' as const, w: 1 };
    const rainStyle = rgbaOf(PALETTE.foam, 0.25);
    const first = (world: World) =>
      sortedObjects(world, []).filter((i) => i.kind === 'building')[0]!.id;
    const DARK = DIM_FIRE;
    function frame(fx: Partial<RenderFx>, mk?: (w: World) => void, tick = 3000) {
      const { world, ids } = scene();
      world.order = order;
      world.tick = tick;
      mk?.(world);
      const cam = camFor(world, 1);
      const { ctx, log } = fakeCtx();
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 900, ...fx });
      return { world, ids, log, ev: log.events };
    }

    it('M7-R3 Sturm mit dayNight false: weiter genau ein Multiply mit der Wettertönung', () => {
      const { ev } = frame({ weather: storm, dayNight: false });
      const mul = ev.filter((e) => e.op === 'fillRect' && e.composite === 'multiply');
      expect(mul).toHaveLength(1);
      expect(renderStats.multiplyFills).toBe(1);
      expect(mul[0]!.style).toBe(
        `rgb(${weatherMul(storm)
          .map((c) => Math.round(c * 255))
          .join(',')})`,
      );
      const day = frame({ weather: storm, dayNight: true });
      expect(day.ev.filter((e) => e.composite === 'multiply')).toHaveLength(1);
    });

    it('M7-R3 clear ohne Licht: kein Multiply; Wetter-Klemmen durch pickWeather (w = 7 → 1)', () => {
      expect(frame({ dayNight: false }).ev.filter((e) => e.composite === 'multiply')).toHaveLength(
        0,
      );
      const wild = frame({ weather: { kind: 'storm', w: 7 }, dayNight: false });
      const calm = frame({ weather: storm, dayNight: false });
      expect(wild.ev.filter((e) => e.composite === 'multiply')[0]!.style).toBe(
        calm.ev.filter((e) => e.composite === 'multiply')[0]!.style,
      );
    });

    it('AK-R3-02 Regen: ein Pfad in foam 0,25 im Bildraum, w × CAP_RAIN Schlieren, reduziert 100, nur bei rain/storm', () => {
      const streaks = (ev: Ev[]) => ev.filter((e) => e.op === 'stroke' && e.style === rainStyle);
      const full = streaks(frame({ weather: storm, dayNight: false }).ev);
      expect(full).toHaveLength(1);
      expect(full[0]!.points).toHaveLength(2 * 350);
      expect(isBase(full[0]!.matrix) || full[0]!.matrix[0] === 2).toBe(true);
      const half = streaks(frame({ weather: { kind: 'rain', w: 0.5 } }).ev);
      expect(half[0]!.points).toHaveLength(2 * 175);
      const red = streaks(frame({ weather: storm, reduceMotion: true }).ev);
      expect(red[0]!.points).toHaveLength(2 * 100);
      expect(streaks(frame({ weather: { kind: 'cloudy', w: 1 } }).ev)).toHaveLength(0);
      expect(streaks(frame({}).ev)).toHaveLength(0);
    });

    it('AK-R3-02 Regen liegt nach dem Multiply (Ebene 11) und ist deterministisch', () => {
      const a = frame({ weather: storm });
      const b = frame({ weather: storm });
      const idx = (ev: Ev[]) => ({
        rain: ev.findIndex((e) => e.op === 'stroke' && e.style === rainStyle),
        mul: ev.findIndex((e) => e.composite === 'multiply'),
      });
      expect(idx(a.ev).rain).toBeGreaterThan(idx(a.ev).mul);
      expect(a.ev.filter((e) => e.style === rainStyle)[0]!.points).toEqual(
        b.ev.filter((e) => e.style === rainStyle)[0]!.points,
      );
    });

    it('M7-R3 Sturm-Randschatten (Ebene 8) vor dem Multiply, normales source-over', () => {
      const { ev } = frame({ weather: storm, dayNight: false });
      // die Brand-Abdunklung (DIM_FIRE) multipliziert je Gebäude lokal und ist nicht die Tönung
      const mul = ev.findIndex((e) => e.composite === 'multiply' && e.style !== DIM_FIRE);
      const edge = ev
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.op === 'fillRect' && e.style.startsWith('gradient('));
      expect(edge).toHaveLength(1);
      expect(edge[0]!.i).toBeLessThan(mul);
      expect(edge[0]!.e.composite).toBe('source-over');
      expect(
        frame({ weather: { kind: 'rain', w: 1 }, dayNight: false }).ev.filter((e) =>
          e.style.startsWith('gradient('),
        ),
      ).toHaveLength(0);
    });

    it('M7-R3 Abdunklung: zwischen dem Körper des brennenden Gebäudes und dem nächsten Objekt', () => {
      const sc = scene();
      sc.world.order = order;
      sc.world.tick = 3000;
      const id = first(sc.world);
      const { ctx, log } = fakeCtx();
      ctx.setTransform(2, 0, 0, 2, 0, 0);
      h.calls.length = 0;
      render(ctx, sc.world, camFor(sc.world, 1), layer, null, null, VIEW, {
        timeMs: 900,
        fire: [{ id, flames: 1, smoke: 1 }],
      });
      const bodies = h.calls.filter((c) => c.kind === 'body');
      const burning = bodies[0]!,
        next = bodies[1]!;
      expect(burning.id).toBe(id);
      const dark = log.events
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.op === 'fill' && e.style === DARK);
      expect(dark).toHaveLength(1);
      expect(dark[0]!.e.composite).toBe('multiply');
      expect(log.events[dark[0]!.i + 1]?.composite ?? 'source-over').toBe('source-over');
      expect(ctx.globalCompositeOperation).toBe('source-over');
      expect(dark[0]!.i).toBeGreaterThan(burning.at);
      expect(dark[0]!.i).toBeLessThan(next.at);
    });

    it('M7-R3 Abdunklung nur bei flames > 0; unbekannte Id wird übersprungen', () => {
      const dim = (fire: { id: number; flames: number; smoke: number }[]) =>
        frame({ fire }, undefined).ev.filter((e) => e.style === DARK).length;
      const { world } = scene();
      const id = first(world);
      expect(dim([{ id, flames: 0, smoke: 1 }])).toBe(0);
      expect(dim([{ id, flames: 0.5, smoke: 0 }])).toBe(1);
      expect(() => dim([{ id: 99999, flames: 1, smoke: 1 }])).not.toThrow();
      expect(dim([{ id: 99999, flames: 1, smoke: 1 }])).toBe(0);
    });

    it('ISO §5 Feuer in der Luft (Ebene 7): nach dem letzten Körper, vor der Tönung; Glühen additiv, höchstens ein Block', () => {
      const sc = scene();
      const id = first(sc.world);
      const { ev, log } = frame(
        {
          dayNight: true,
          fire: [
            { id, flames: 1, smoke: 1 },
            { id: 99999, flames: 1, smoke: 1 },
          ],
        },
        undefined,
        3000,
      );
      const grad = ev
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.op === 'fill' && e.style.startsWith('gradient('));
      expect(grad).toHaveLength(1); // Flammen des einen bekannten Gebäudes
      // die Brand-Abdunklung (DIM_FIRE) multipliziert je Gebäude lokal und ist nicht die Tönung
      const mul = ev.findIndex((e) => e.composite === 'multiply' && e.style !== DIM_FIRE);
      const lastBody = h.calls.filter((c) => c.kind === 'body').pop()!;
      expect(grad[0]!.i).toBeGreaterThan(lastBody.at);
      expect(grad[0]!.i).toBeLessThan(mul);
      expect(log.compositeSet.filter((c) => c === 'lighter')).toHaveLength(1);
      const add = ev.findIndex((e) => e.composite === 'lighter');
      expect(add).toBeGreaterThan(mul);
      // Bodenschein skaliert die Matrix (transform); die Verläufe des Glühens füllt nur fillRect
      expect(
        ev
          .filter((e) => e.composite === 'lighter' && e.style.startsWith('gradient('))
          .every((e) => e.op === 'fillRect'),
      ).toBe(true);
    });

    it('M7-R3 Rauchbudget begrenzt nur den Rauch: 20 sichtbare Feuer → Rauch ≤ 150 (reduziert ≤ 50), alle 20 Flammen', () => {
      const smokeStyle = `rgba(${SMOKE_COLOR.join(',')},`;
      for (const reduce of [false, true]) {
        const sc = scene();
        sc.world.order = order;
        sc.world.tick = 3000;
        const k = sc.world.buildings[home(sc.world).kontorId]!;
        const fire = [];
        for (let i = 0; i < 20; i++) {
          const id = sc.world.nextBuildingId++;
          sc.world.buildings[id] = {
            id,
            defId: 'house',
            x: k.x + 3 + (i % 5),
            y: k.y + 3 + Math.floor(i / 5),
            connected: true,
            progress: 0,
            state: 'ok',
            island: 0,
          };
          fire.push({ id, flames: 1, smoke: 1 });
        }
        const { ctx, log } = fakeCtx();
        render(ctx, sc.world, camFor(sc.world, 1), layer, null, null, VIEW, {
          timeMs: 900,
          reduceMotion: reduce,
          fire,
        });
        const smoke = log.events.filter(
          (e) => e.op === 'fill' && e.style.startsWith(smokeStyle) && e.points.length === 4,
        ).length;
        const flames = log.events.filter(
          (e) => e.op === 'fill' && e.style.startsWith('gradient('),
        ).length;
        expect(smoke).toBeGreaterThan(0);
        expect(smoke).toBeLessThanOrEqual(reduce ? 50 : 150);
        expect(flames).toBe(20);
      }
    });

    it('M7-R3 ohne Feuer kein additiver Durchgang; mit flames = 0 (Nachlauf) auch keiner', () => {
      expect(frame({}, undefined, 0).log.compositeSet).not.toContain('lighter');
      const { world } = scene();
      const id = first(world);
      expect(
        frame({ fire: [{ id, flames: 0, smoke: 1 }] }, undefined, 0).log.compositeSet,
      ).not.toContain('lighter');
      expect(
        frame({ fire: [{ id, flames: 1, smoke: 1 }] }, undefined, 0).log.compositeSet,
      ).toContain('lighter');
    });

    it('AK-R3-03 Warnring und Boom-Münze in den Signalen: nach dem Multiply, ungetönt, im Bildraum', () => {
      const sc = scene();
      const id = first(sc.world);
      const { ev, world } = frame({
        fire: [{ id, flames: 1, smoke: 1 }],
        boom: true,
        weather: storm,
        timeMs: 100, // Plateau: volle Deckkraft
      });
      // die Brand-Abdunklung (DIM_FIRE) multipliziert je Gebäude lokal und ist nicht die Tönung
      const mul = ev.findIndex((e) => e.composite === 'multiply' && e.style !== DIM_FIRE);
      const ring = ev
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.op === 'strokeRect' && e.style === PALETTE.signalWarn);
      expect(ring).toHaveLength(1);
      expect(ring[0]!.i).toBeGreaterThan(mul);
      expect(ring[0]!.e.composite).toBe('source-over');
      expect(ring[0]!.e.alpha).toBe(1);
      expect(ring[0]!.e.matrix).toEqual([2, 0, 0, 2, 0, 0]);
      const coin = ev
        .map((e, i) => ({ e, i }))
        .filter(({ e }) => e.op === 'fill' && e.style === PALETTE.roofThatch);
      expect(coin.length).toBeGreaterThan(0);
      expect(coin[coin.length - 1]!.i).toBeGreaterThan(mul);
      // Münze über dem Kontor: Bildbox-Mitte x
      const k = world.buildings[home(world).kontorId]!;
      const box = spriteBounds(BUILDING_DEFS.kontor, k);
      const cam = camFor(world, 1);
      const cx = (box.x + box.w / 2 - cam.x) * cam.zoom;
      const pts = coin[coin.length - 1]!.e.points;
      expect(Math.abs(pts.reduce((a, p) => a + p.x, 0) / pts.length - cx * 2)).toBeLessThan(40);
    });

    it('M7-R3 Warnring nur bei flames > 0; ohne boom keine Münze', () => {
      const { world } = scene();
      const id = first(world);
      const rings = (fx: Partial<RenderFx>) =>
        frame(fx).ev.filter((e) => e.op === 'strokeRect' && e.style === PALETTE.signalWarn).length;
      expect(rings({ fire: [{ id, flames: 0, smoke: 1 }] })).toBe(0);
      expect(rings({ fire: [{ id, flames: 0.2, smoke: 0 }] })).toBe(1);
      expect(frame({}).ev.some((e) => e.style === PALETTE.roofThatch && e.op === 'fill')).toBe(
        false,
      );
    });

    it('RF-7 mit Sturm, Feuer, Boom, reduceMotion: save/restore ausgeglichen, Matrix wie vorher (Zoom 0,5 und 2)', () => {
      for (const zoom of [0.5, 2])
        for (const reduceMotion of [true, false]) {
          const { world } = scene();
          world.order = order;
          world.tick = 3000;
          const cam = camFor(world, zoom);
          const { ctx, log } = fakeCtx();
          ctx.setTransform(2, 0, 0, 2, 0, 0);
          render(ctx, world, cam, layer, null, null, VIEW, {
            timeMs: 777,
            dayNight: true,
            weather: storm,
            fire: [{ id: first(world), flames: 1, smoke: 1 }],
            boom: true,
            reduceMotion,
          });
          expect(log.saves).toBe(log.restores);
          expect(log.underflow).toBe(0);
          expect(log.matrix).toEqual(BASE(2));
        }
    });

    it('M7-R3 Signalfarben kommen in Wetter und Feuer nicht vor (ausser dem Warnring)', () => {
      const { world } = scene();
      const { ev } = frame({
        weather: storm,
        fire: [{ id: first(world), flames: 1, smoke: 1 }],
        dayNight: true,
      });
      const names: string[] = [
        PALETTE.signalRed,
        PALETTE.signalYellow,
        PALETTE.signalOk,
        PALETTE.signalWarn,
      ];
      // die Brand-Abdunklung (DIM_FIRE) multipliziert je Gebäude lokal und ist nicht die Tönung
      const mul = ev.findIndex((e) => e.composite === 'multiply' && e.style !== DIM_FIRE);
      expect(mul).toBeGreaterThan(0);
      // vor der Tönung (Terrain, Gebäude, Leben, Wetter) keine Signalfarbe; danach nur Signale
      expect(ev.slice(0, mul).filter((e) => names.includes(e.style.toLowerCase()))).toHaveLength(0);
    });
  });

  describe('M7-R4 Leben und Fensterlicht', () => {
    const SIGNALS: string[] = [
      PALETTE.signalRed,
      PALETTE.signalYellow,
      PALETTE.signalOk,
      PALETTE.signalWarn,
    ];
    /** Szene mit 40 Einwohnern im ersten Haus (10 Figuren auf dem Weg), Tick und Zeit wählbar. */
    function life(
      fx: Partial<RenderFx> = {},
      tick = 0,
      mk?: (w: World, ids: Record<string, number>) => void,
    ) {
      const { world, ids } = scene();
      world.tick = tick;
      const home = Object.values(world.buildings).find((b) => b.defId === 'house')!;
      home.house!.inhabitants = 40;
      mk?.(world, ids);
      const cam = camFor(world, 1);
      const { ctx, log } = fakeCtx();
      h.calls.length = 0;
      render(ctx, world, cam, layer, null, null, VIEW, { timeMs: EPISODE_MS / 2, ...fx });
      return { world, ids, log, ev: log.events, home };
    }
    const lighter = (ev: Ev[]) => ev.filter((e) => e.composite === 'lighter');

    it('AK-R4-02 Figuren: Anzahl nach Einwohnern, Reihenfolge wie sortedObjects, weiter genau eine Schattenfüllung, RF-7', () => {
      for (const [inh, reduce] of [
        [40, false],
        [400, false],
        [400, true],
      ] as const) {
        const { world, log, ev } = life({ reduceMotion: reduce, dayNight: true }, 3000, (w) => {
          Object.values(w.buildings).find((b) => b.defId === 'house')!.house!.inhabitants = inh;
        });
        const want = walkerCount(inh, reduce);
        const g = roadGraph(world);
        const poses = Array.from({ length: want }, (_, i) => ({
          i,
          p: walkerAt(g, i, EPISODE_MS / 2, world.seed)!,
        }));
        const drawn = h.calls.filter((c) => c.kind === 'walker');
        expect(drawn).toHaveLength(want);
        // Reihenfolge: Körper und Figuren zusammen wie sortedObjects
        const key = (x: number, y: number) => `${x.toFixed(6)},${y.toFixed(6)}`;
        const expected = sortedObjects(
          world,
          poses.map(({ i, p }) => ({ kind: 'walker' as const, id: i, cx: p.x, cy: p.y })),
        )
          .filter((it) => it.kind === 'building' || it.kind === 'walker')
          .map((it) =>
            it.kind === 'walker' ? `walker@${key(it.cx, it.cy)}` : `${it.kind}${it.id}`,
          );
        const got = h.calls
          .filter((c) => c.kind === 'body' || c.kind === 'walker')
          .map((c) =>
            c.kind === 'body' ? `building${c.id}` : `walker@${key(c.pose!.x, c.pose!.y)}`,
          );
        expect(got).toEqual(expected);
        expect(ev.filter((e) => e.style === SHADOW)).toHaveLength(1);
        expect(renderStats.shadowFills).toBe(1);
        expect(log.saves).toBe(log.restores);
        expect(log.underflow).toBe(0);
        expect(log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
      }
      expect(h.calls.filter((c) => c.kind === 'walker')).toHaveLength(12);
    });

    it('AK-R4-02 Figurenschatten stehen im einen Schattenpfad (mehr Punkte als ohne Einwohner); ohne Weg keine Figur', () => {
      const withWalkers = life({}, 0).ev.find((e) => e.style === SHADOW)!;
      const none = life({}, 0, (w) => {
        for (const b of Object.values(w.buildings)) if (b.house) b.house.inhabitants = 0;
      });
      expect(h.calls.some((c) => c.kind === 'walker')).toBe(false);
      expect(withWalkers.points.length).toBeGreaterThan(
        none.ev.find((e) => e.style === SHADOW)!.points.length,
      );
      life({}, 0, (w) => {
        for (const t of home(w).tiles) t.road = false;
      });
      expect(h.calls.some((c) => c.kind === 'walker')).toBe(false);
    });

    it('Spec 5.6 Figuren tragen keine Signalfarbe und stehen vor der Tönung; Episodenrand blendet aus (keine Figur bei alpha 0)', () => {
      const { ev } = life({ dayNight: true }, 3000);
      // die Brand-Abdunklung (DIM_FIRE) multipliziert je Gebäude lokal und ist nicht die Tönung
      const mul = ev.findIndex((e) => e.composite === 'multiply' && e.style !== DIM_FIRE);
      expect(ev.slice(0, mul).filter((e) => SIGNALS.includes(e.style.toLowerCase()))).toHaveLength(
        0,
      );
      life({ timeMs: 0 }, 0); // alpha 0 zu Beginn der Episode
      expect(h.calls.filter((c) => c.kind === 'walker')).toHaveLength(0);
    });

    it('AK-R4-03 Möwen nur am Tag/Morgen/Abend: Schatten und Flügelstriche; nachts keine; reduziert 3', () => {
      const gullStrokes = (ev: Ev[]) =>
        ev.filter((e) => e.op === 'stroke' && e.style === PALETTE.foam && e.lineWidth === 1.5);
      const day = life({ dayNight: false }, 0);
      const night = life({ dayNight: false }, 3000);
      const red = life({ dayNight: false, reduceMotion: true }, 0);
      expect(gullStrokes(day.ev).length).toBeGreaterThan(0);
      expect(gullStrokes(day.ev).length).toBeLessThanOrEqual(8);
      expect(gullStrokes(night.ev)).toHaveLength(0);
      expect(gullStrokes(red.ev).length).toBeGreaterThan(0);
      expect(gullStrokes(red.ev).length).toBeLessThanOrEqual(3);
      expect(day.ev.filter((e) => e.style === SHADOW)).toHaveLength(1);
      expect(night.ev.filter((e) => e.style === SHADOW)).toHaveLength(1);
    });

    it('AK-R4-03 Herdrauch nur Morgen und Abend, nur bewohnte Häuser; Rauch-Budget gilt über Betriebe, Herd und Feuer', () => {
      const hearth = `rgba(${rgbOfCss(HEARTH_COLOR).join(',')},`;
      const count = (ev: Ev[], prefix: string) =>
        ev.filter((e) => e.op === 'fill' && e.style.startsWith(prefix) && e.points.length === 4)
          .length;
      for (const [tick, expected] of [
        [4700, true],
        [2300, true],
        [0, false],
        [3000, false],
      ] as const) {
        const { ev, world } = life({}, tick);
        const inhabited = Object.values(world.buildings).filter(
          (b) => (b.house?.inhabitants ?? 0) > 0,
        ).length;
        expect(inhabited).toBeGreaterThan(0);
        expect(count(ev, hearth), `Tick ${tick}`).toBe(expected ? HEARTH_PUFFS * inhabited : 0);
      }
      // Budget: viele bewohnte Häuser, laufende Betriebe, 20 Feuer
      for (const reduce of [false, true]) {
        const total = reduce ? 50 : 150;
        const many = (fire: boolean) => {
          const fireList: { id: number; flames: number; smoke: number }[] = []; // je Aufruf frisch
          return life({ reduceMotion: reduce, fire: fire ? fireList : [] }, 4700, (w) => {
            const k = w.buildings[home(w).kontorId]!;
            for (let i = 0; i < 80; i++) {
              const id = w.nextBuildingId++;
              w.buildings[id] = {
                id,
                defId: i % 2 ? 'house' : 'weaver',
                x: k.x + 3 + (i % 8),
                y: k.y + 3 + Math.floor(i / 8) * 1,
                connected: true,
                progress: 0,
                state: 'ok',
                island: 0,
                ...(i % 2
                  ? {
                      house: {
                        tier: 1,
                        inhabitants: 5,
                        demand: {},
                        satisfied: {},
                        services: {},
                        satisfiedSince: 0,
                        supplied: true,
                      },
                    }
                  : {}),
              };
              if (i < 20) fireList.push({ id, flames: 1, smoke: 1 });
            }
          });
        };
        const smokeStyles = [hearth, `rgba(${AIR_COLORS.smoke},`, `rgba(${SMOKE_COLOR.join(',')},`];
        const noFire = many(false).ev;
        const sum = (ev: Ev[]) => smokeStyles.reduce((n, p) => n + count(ev, p), 0);
        expect(sum(noFire)).toBeLessThanOrEqual(total);
        // Betriebe haben vor dem Herdrauch Vorrang: reduziert verbrauchen sie das ganze Budget
        expect(count(noFire, hearth) > 0).toBe(!reduce);
        expect(sum(noFire)).toBe(total);
        const withFire = many(true).ev;
        expect(sum(withFire)).toBeLessThanOrEqual(total);
        expect(count(withFire, `rgba(${SMOKE_COLOR.join(',')},`)).toBeGreaterThan(0); // Feuer behält Vorrang
      }
    }, 20_000);

    it('AK-R4-05 Fensterlicht: ein additiver Block nach dem Multiply; nur bewohnte Häuser und Betriebe ok; Laternen immer', () => {
      const night = (mk?: Parameters<typeof life>[2], fx: Partial<RenderFx> = {}) =>
        life({ dayNight: true, ...fx }, 3000, mk);
      const rects = (ev: Ev[]) =>
        lighter(ev).filter((e) => e.op === 'fill' && e.style === rgbaOf(PALETTE.window, 1));
      const expectedWindows = (world: World): number =>
        Object.values(world.buildings)
          .filter((b) => isLit(BUILDING_DEFS[b.defId], b))
          .reduce(
            (n, b) => n + anchorsFor(BUILDING_DEFS[b.defId], b).filter((a) => !a.always).length,
            0,
          );
      const base = night();
      expect(base.log.compositeSet.filter((c) => c === 'lighter')).toHaveLength(1);
      expect(base.ev.findIndex((e) => e.composite === 'lighter')).toBeGreaterThan(
        base.ev.findIndex((e) => e.composite === 'multiply'),
      );
      // Fensterrechtecke und Laternen können über Clip-Gruppen verteilt sein (BUG-LICHT): Punkte summieren
      const n = expectedWindows(base.world);
      expect(n).toBeGreaterThan(3);
      expect(rects(base.ev).reduce((sum, e) => sum + e.points.length, 0)).toBe(4 * n + 4 * 2); // Kontor und Marktplatz
      // Radius des Scheins: 0,6 · ISO_H · Zoom
      const ring = lighter(base.ev).find(
        (e) =>
          e.op === 'fill' &&
          e.style === rgbaOf(PALETTE.window, Number((0.35 / GLOW_RING_COUNT).toFixed(4))),
      )!;
      const ringFills = lighter(base.ev).filter(
        (e) =>
          e.op === 'fill' &&
          e.style === rgbaOf(PALETTE.window, Number((0.35 / GLOW_RING_COUNT).toFixed(4))),
      );
      expect(ringFills.length).toBeGreaterThanOrEqual(2 * GLOW_RING_COUNT);
      expect(ringFills.length % GLOW_RING_COUNT).toBe(0); // je Gruppe ein Pfad je Ring
      const first = ring.points.slice(0, 5);
      expect(
        (Math.max(...first.map((p) => p.x)) - Math.min(...first.map((p) => p.x))) / 2,
      ).toBeCloseTo(GLOW_RADIUS, 6);
      // Stillstand: unbewohntes Haus (Einwohner 0) und Betrieb in waitingInput bleiben dunkel
      const dark = night((w, ids) => {
        w.buildings[ids.weaver!]!.state = 'waitingInput';
        for (const b of Object.values(w.buildings)) if (b.house) b.house.inhabitants = 0;
      });
      const nDark = expectedWindows(dark.world);
      expect(nDark).toBe(3); // nur das Kontor (ok)
      expect(rects(dark.ev)[0]!.points).toHaveLength(4 * nDark);
      // Laternen folgen `windows` (R114): bei dayNight false und am Tag kein additiver Durchgang
      expect(life({ dayNight: false }, 3000).log.compositeSet).not.toContain('lighter');
      expect(life({ dayNight: true }, 0).log.compositeSet).not.toContain('lighter');
      // Abend (Tick 2520, windows 0,6): Laternen auch ohne bewohntes Haus, mit Stärke 0,6
      const dusk = life({ dayNight: true }, 2520, (w) => {
        for (const b of Object.values(w.buildings)) if (b.house) b.house.inhabitants = 0;
      });
      expect(
        lighter(dusk.ev).some((e) => e.op === 'fill' && e.style === rgbaOf(PALETTE.window, 0.6)),
      ).toBe(true);
    });

    it('ISO §5 Licht: Signale nach dem Licht, ungetönt; save/restore ausgeglichen (Zoom 0,5 und 2, leere Welt)', () => {
      for (const zoom of [0.5, 2])
        for (const empty of [false, true]) {
          const { world } = scene();
          world.tick = 3000;
          Object.values(world.buildings).find((b) => b.defId === 'house')!.house!.inhabitants = 40;
          const cam = camFor(world, zoom);
          if (empty) {
            world.buildings = {};
            world.nextBuildingId = 2;
          }
          const { ctx, log } = fakeCtx();
          ctx.setTransform(2, 0, 0, 2, 0, 0);
          render(ctx, world, cam, layer, null, null, VIEW, {
            timeMs: 5000,
            dayNight: true,
            boom: true,
          });
          expect(log.saves).toBe(log.restores);
          expect(log.underflow).toBe(0);
          expect(log.matrix).toEqual(BASE(2));
          expect(log.compositeSet.filter((c) => c === 'lighter').length).toBeLessThanOrEqual(1);
          expect(log.compositeSet.filter((c) => c === 'multiply').length).toBeLessThanOrEqual(1);
        }
    });

    it('Spec 6.2 Anker-Cache hat eine Obergrenze (Typen × 3 Stufen)', async () => {
      const { anchorCacheSize } = await import('../../src/render/life');
      life({ dayNight: true }, 3000);
      expect(anchorCacheSize()).toBeGreaterThan(0);
      expect(anchorCacheSize()).toBeLessThanOrEqual(Object.keys(BUILDING_DEFS).length + 2);
    });
  });

  it('AK-U3-06 wildlifeEnvOf: Phase aus dem Tick, Wetter geklemmt, reduce nur bei true', async () => {
    const { wildlifeEnvOf } = await import('../../src/render/renderer');
    const w = createWorld(3);
    expect(wildlifeEnvOf(w, { timeMs: 0 })).toEqual({
      phase: lightAt(w.tick).phase,
      weather: 'clear',
      reduce: false,
    });
    expect(
      wildlifeEnvOf(w, { timeMs: 0, weather: { kind: 'storm', w: 1 }, reduceMotion: true }),
    ).toMatchObject({ weather: 'storm', reduce: true });
  });
});

describe('S1-Rest DIM_FIRE', () => {
  const rgb = (c: string): number[] => /\d+/g[Symbol.match](c)!.map(Number);
  it('S1-Rest DIM_FIRE: kein Schwarz/Weiss, Luma-Faktor 0,62–0,68, Blau mindestens 0,08 über Rot', () => {
    const [r, g, b] = rgb(DIM_FIRE).map((v) => v / 255) as [number, number, number];
    expect(r + g + b).toBeGreaterThan(0);
    expect(Math.min(r, g, b)).toBeGreaterThan(0.3);
    expect(Math.max(r, g, b)).toBeLessThan(1);
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    expect(luma).toBeGreaterThanOrEqual(0.62);
    expect(luma).toBeLessThanOrEqual(0.68);
    expect(b - r).toBeGreaterThanOrEqual(0.08);
  });
  it('S1-Rest DIM_FIRE: Farbstich in Richtung des Lichtton-Schattens (dark/cool)', () => {
    const t = mixRgb(LIGHT_COLORS.dark, LIGHT_COLORS.cool, 0.6);
    const f = rgb(DIM_FIRE);
    // gleiche Rangfolge der Kanäle wie der Schattenton
    expect(f[2]! > f[1]! && f[1]! > f[0]!).toBe(t[2] > t[1] && t[1] > t[0]);
  });
});

describe('M12 E1 Heimat-Aufrufliste (AK-E1-10)', () => {
  // Bewusst neu gepinnt (ART-STIL-02 L4): Baum-Culling mit 1 Kachel Zuschlag (+520 Zeichen) und die Deko-Stempel, deren
  // Zeichen- und Schattenaufrufe die Ereignisreihenfolge (`at`) der Aufrufe verschieben; mehr Deko-Ereignisse durch
  // G-Anzahl (b537908).
  // WALD-02 (auch Fix-Runden 1–3, Baumgruppen, Nadelwald-Rotten, Nachsetzen unter dunklem Boden): bewusst neu gepinnt (beide Pins): Wald-Objekte sind Tiefenband-Zellen aus einzelnen Kronen (andere Ids und
  // Anzahl, Reihenfolge nach Fusstiefe) und das Baum-Culling hat 2 Kacheln Zuschlag.
  // L5: Palmen, Meer-Stempel und ihr Schaum (Heimat der Fixtur) verschieben die Ereignisreihenfolge weiter.
  // L7-Merge (main mit REL-06 + L5): neu gepinnt, L3-Bildmodus und L5-Meer-Stempel zusammen.
  // REL-07 (int/rel-07, WALD-02 + L7 mit L5): neu gepinnt, WALD-02-Kronenzellen und L5-Meer-Stempel zusammen.
  // L6 B2: Farnbüschel auf Lichtungen sind zusätzliche drawImage-Ereignisse; die Positionen `at` der folgenden Aufrufe
  // verschieben sich (ART-STIL-02 L6).
  // REL-07 (+ L6): Farn auf WALD-02 übertragen, Büschel in der Tiefenfolge der Kronenzellen; HOME_ORDER neu, weil eine
  // Tiefenband-Zelle ohne Krone (Kachel 25/54) nur für zwei Farnbüschel als Wald-Objekt dazukommt (tree332).
  const HOME_CALLS = { hash: 802371235, length: 19050 };
  // Zusätzlicher Pin ohne `at`: nur Art und Id der Aufrufe in Reihenfolge (davon unberührt von Deko-Ereignissen)
  const HOME_ORDER = { hash: 3471626267, length: 5152 };
  // REL-06: HOME_CALLS im Kandidaten neu gepinnt (L3 + L4 zusammen, reiner Hash-Pin); HOME_ORDER unverändert.
  // L3: Ereignisindex `at` je Körper wächst mit dem Bildmodus (Kontur, Kontakt, Gras); Reihenfolge und Ids unverändert.
  const V1280 = { w: 1280, h: 800 };
  /** Die gemerkten Zeichenaufrufe (Körper, Luft, Bäume, Schiff, Figuren) eines Frames auf der Heimat. */
  const callList = (world: World, cam: ReturnType<typeof camFor>, view: typeof V1280): Call[] => {
    h.calls.length = 0;
    const { ctx } = fakeCtx();
    render(ctx, world, cam, layer, null, null, view, { timeMs: 5000, dayNight: true });
    return h.calls.slice();
  };
  it('Heimat-Aufrufliste bei 1280 × 800, Zoom 1 und 2 unverändert (vor dem Terrain-Merge gepinnt)', () => {
    const loaded = deserialize(readFileSync('tests/sim/fixtures/save-v7.json', 'utf8'));
    if (!loaded.ok) throw new Error(loaded.reason);
    const world = loaded.world;
    const hm = home(world);
    const all: Call[][] = [];
    for (const zoom of [1, 2]) {
      const cam = { x: 0, y: 0, zoom };
      centerOn(cam, hm.width / 2, hm.height / 2, V1280, { w: hm.width, h: hm.height });
      const r = visibleTileRange(cam, V1280, { w: hm.width, h: hm.height });
      for (const v of [r.x0, r.y0, r.x1, r.y1]) expect(v).toBeGreaterThanOrEqual(4);
      for (const v of [r.x1, r.y1]) expect(v).toBeLessThanOrEqual(59);
      all.push(callList(world, cam, V1280));
    }
    const json = JSON.stringify(all);
    expect({ hash: fnv1a32(json), length: json.length }).toEqual(HOME_CALLS);
    const seq = JSON.stringify(all.map((l) => l.map((c) => `${c.kind}${c.id}`)));
    expect({ hash: fnv1a32(seq), length: seq.length }).toEqual(HOME_ORDER);
  });
});

describe('M12 E1 Renderer', () => {
  const V = { w: 1280, h: 800 };
  const camOn = (fx: number, fy: number, zoom: number): { x: number; y: number; zoom: number } => {
    const p = project(fx, fy);
    return { x: p.x - V.w / 2 / zoom, y: p.y - V.h / 2 / zoom, zoom };
  };
  const stubs = new Map<number, HTMLCanvasElement>();
  const layers = {
    get: (i: number): HTMLCanvasElement | null => {
      if (i === 0) return layer;
      if (!stubs.has(i))
        stubs.set(i, { width: 36 * 32, height: 36 * 32 } as unknown as HTMLCanvasElement);
      return stubs.get(i)!;
    },
  };
  const run = (world: World, cam: ReturnType<typeof camOn>, fx: Partial<RenderFx> = {}) => {
    h.calls.length = 0;
    h.treeSeeds.length = 0;
    h.decorCalls.length = 0;
    h.decorShadows.length = 0;
    const f = fakeCtx();
    render(f.ctx, world, cam, layers, null, null, V, { timeMs: 5000, dayNight: true, ...fx });
    return { calls: h.calls.slice(), log: f.log };
  };
  const homeOnly = (w: World): World => ({ ...w, islands: [w.islands[0]!] });

  it('AK-E1-10 Kamera über der Heimat: Aufrufliste gleich der Welt ohne Fremdinseln', () => {
    const { world } = scene();
    // L7: Robben und Kormorane stehen auf Fels und Sandbank des Meer-Plans, und der hängt von den Fahrlinien und damit
    // von den Fremdinseln ab (`seaContext`); ohne Fremdinseln ist es eine andere Meerlage. Nachts (tick 3000) sind die Meer-Tiere
    // aus, der Rest des Bildes bleibt der Prüfgegenstand dieses Tests.
    world.tick = 3000;
    const cam = camFor(world, 1);
    const a = run(world, cam);
    const b = run(homeOnly(world), cam);
    expect(a.calls).toEqual(b.calls);
    expect(a.log.events.length).toBe(b.log.events.length);
    expect(renderStats.islandsDrawn).toBe(1);
  });

  it('AK-E1-10 Tag (Phase day, Fauna und Delfine im Bild): Aufrufliste (ohne Ereignisindex) gleich der Welt ohne Fremdinseln, Land-Tiere gleich', () => {
    const { world } = scene();
    world.tick = 600;
    expect(phaseAt(world.tick)).toBe('day');
    const cam = camFor(world, 1);
    const a = run(world, cam);
    const drawnA = renderStats.faunaDrawn;
    const b = run(homeOnly(world), cam);
    // Die Aufrufliste (Körper, Luft, Bäume, Schiff, Figuren) ist am Tag dieselbe, nur der Ereignisindex `at` verschiebt
    // sich um die Zeichenereignisse der Meer-Tiere. Robben, Kormorane und Delfine hängen
    // vom Meer-Plan und damit von den Fahrlinien der Fremdinseln ab (`seaContext`): ihre Zeichenereignisse (a.log) und
    // `faunaDrawn` sind ohne Fremdinseln andere, darum werden die Land-Tiere über `faunaAt` verglichen (Meer-Arten
    // ausgenommen) und das Tagbild über Aufrufliste und Land-Tiere gepinnt.
    const noAt = (l: typeof a.calls): unknown[] =>
      l.map((c) => ({ kind: c.kind, id: c.id, pose: c.pose }));
    expect(noAt(a.calls)).toEqual(noAt(b.calls));
    const env = { phase: 'day' as const, zoom: 1 };
    const range = { x0: 0, y0: 0, x1: 255, y1: 255 };
    const land = (w: World): string[] =>
      faunaAt(w, range, 5000, env)
        .filter((x) => x.id !== 'seal' && x.id !== 'cormorant')
        .map((x) => `${x.id}@${x.tx},${x.ty}`);
    expect(land(world)).toEqual(land(homeOnly(world)));
    expect(land(world).length).toBeGreaterThan(0);
    expect(drawnA).toBeGreaterThan(0);
    expect(renderStats.islandsDrawn).toBe(1);
  });

  it('AK-E1-10 Kamera über Insel A: genau eine Insel, erste Bildquelle ist ihre Ebene', () => {
    const { world } = scene();
    const a = world.islands[1]!;
    const cam = camOn(a.ox + a.width / 2, a.oy + a.height / 2, 2);
    const { log } = run(world, cam);
    expect(renderStats.islandsDrawn).toBe(1);
    expect(log.images[0]).toBe(layers.get(1));
  });

  it('L4-T1 Cache-Thrash über den Renderer: 10 Frames abwechselnd über Heimat und Fremdinsel leeren den Deko-Cache höchstens einmal, gefüllt nur mit dem Heimat-Seed', () => {
    const { world } = scene();
    const stamp = sortedObjects(world).find((i) => i.kind === 'decor')!;
    expect(stamp, 'die Szene hat einen Deko-Stempel').toBeDefined();
    const a = world.islands[1]!;
    const camHome = camOn(stamp.fp.x + 0.5, stamp.fp.y + 0.5, 1);
    const camFar = camOn(a.ox + a.width / 2, a.oy + a.height / 2, 2);
    const base = decorCacheClears();
    const seeds: number[] = [];
    for (let frame = 0; frame < 10; frame++) {
      run(world, frame % 2 === 0 ? camHome : camFar);
      seeds.push(...h.decorCalls.map((c) => c.seed));
      expect(renderStats.islandsDrawn).toBe(1);
    }
    expect(decorCacheClears() - base).toBeLessThanOrEqual(1);
    expect(renderStats.decorClears).toBe(decorCacheClears());
    expect(seeds.length).toBeGreaterThan(0);
    for (const sd of seeds) expect(sd).toBe(world.seed); // nie ein Ansicht-Seed
    expect(decorCacheSeed()).toBe(world.seed);
    expect(renderStats.decorBytes).toBeGreaterThan(0);
  });

  it(
    'L4 Deko-Culling: eine Kachel hinter range gezeichnet, zwei nicht; unter Zoom 0,5 kein A5/A6, unter 0,75 kein A9/A14; Schatten im gemeinsamen Pfad',
    { timeout: 120000 },
    () => {
      const MIN = {
        solitaire: 0.5,
        orchard: 0.5,
        menhir: 0.75,
        ruin: 0.75,
        palm: 0.5, // L5 D1
        wreck: 0.25, // L5 E1
        seaRock: 0.25, // L5 E3
        islet: 0.25, // L5 E8
        shorePine: 0.5, // L8 Strandkiefer
      } as const;
      let plusOne = 0,
        plusTwo = 0;
      const kindsDrawn = new Map<number, Set<string>>();
      for (const seed of [3, 7]) {
        const world = createWorld(seed, { unlockAll: true });
        const dims = { w: home(world).width, h: home(world).height };
        const items = sortedObjects(world).filter((i) => i.kind === 'decor') as DecorItem[];
        for (const zoom of [1, 0.6, 0.4]) {
          const step = zoom === 1 ? 3 : 7;
          for (let cy = 4; cy <= 60; cy += step)
            for (let cx = 4; cx <= 60; cx += step) {
              const cam = camOn(cx, cy, zoom);
              const range = visibleTileRange(cam, V, dims);
              run(world, cam);
              const drawn = new Set(h.decorCalls.map((c) => c.id));
              const want = new Set<number>();
              for (const it of items) {
                if (zoom < MIN[it.stamp]) continue;
                const dx = Math.max(range.x0 - it.fp.x, it.fp.x - range.x1),
                  dy = Math.max(range.y0 - it.fp.y, it.fp.y - range.y1);
                if (Math.max(dx, dy) <= 1) want.add(it.id);
                if (zoom === 1 && Math.max(dx, dy) === 1) plusOne++;
                if (zoom === 1 && Math.max(dx, dy) === 2 && !drawn.has(it.id)) plusTwo++;
              }
              expect([...drawn].sort(), `Seed ${seed} Zoom ${zoom} @${cx},${cy}`).toEqual(
                [...want].sort(),
              );
              for (const c of h.decorCalls) {
                expect(zoom).toBeGreaterThanOrEqual(MIN[c.stamp as keyof typeof MIN]);
                if (!kindsDrawn.has(zoom)) kindsDrawn.set(zoom, new Set());
                kindsDrawn.get(zoom)!.add(c.stamp);
              }
              // Schatten: genau ein gemeinsamer Pfad, A5/A6 darin, Menhir und Mauerreste nicht
              expect(
                [...new Set(h.decorShadows)].sort(),
                'Schatten für alle gezeichneten Stempel',
              ).toEqual([...want].sort());
              expect(renderStats.shadowFills).toBeLessThanOrEqual(renderStats.islandsDrawn); // ein gemeinsamer Pfad je Insel
            }
        }
      }
      expect(plusOne, 'ein Stempel eine Kachel hinter range wurde geprüft').toBeGreaterThan(0);
      expect(plusTwo, 'ein Stempel zwei Kacheln hinter range wurde geprüft').toBeGreaterThan(0);
      // L5: Palmen (ab 0,5) und die Meer-Stempel (ab 0,25) kommen zu den L4-Stempeln dazu: exakte Listen je Zoom
      const got = (z: number): string[] => [...(kindsDrawn.get(z) ?? [])].sort();
      expect(got(1)).toEqual([
        'menhir',
        'orchard',
        'palm',
        'ruin',
        'seaRock',
        'shorePine',
        'solitaire',
      ]);
      expect(got(0.6)).toEqual(['orchard', 'palm', 'seaRock', 'shorePine', 'solitaire']);
      expect(got(0.4)).toEqual(['seaRock']);
    },
  );

  it('AK-E1-12 jump, aktive Insel 0, Zoom 0,125 über der Rahmenmitte: Aufrufliste gleich der Heimat-Welt', () => {
    const { world } = scene();
    const cam = camOn(10, 20, 0.125);
    const a = run(world, cam, { archipelView: 'jump', activeIsland: 0 });
    const b = run(homeOnly(world), cam, { archipelView: 'jump', activeIsland: 0 });
    expect(a.calls).toEqual(b.calls);
    expect(renderStats.islandsDrawn).toBe(1);
  });

  it('AK-E1-22 Detailstufe: bei Zoom 0,25 und 0,125 keine Figuren, Tiere, Rauch, Wellen; Boden aus quarterLayer', () => {
    for (const zoom of [0.25, 0.125]) {
      const { world } = scene();
      world.order = order;
      Object.values(world.buildings)
        .filter((b) => b.defId === 'house')
        .forEach((b) => (b.house!.inhabitants = 40));
      const cam = camFor(world, zoom);
      const { log } = run(world, cam, { timeMs: EPISODE_MS / 2 });
      expect(renderStats.walkersDrawn).toBe(0);
      expect(renderStats.wildDrawn).toBe(0);
      expect(renderStats.smokeDrawn).toBe(0);
      expect(renderStats.wavesDrawn).toBe(0);
      expect(renderStats.errands).toBe(0);
      expect(log.images[0]).toBe(h.terrain.quarter);
    }
  });

  it('AK-E1-22 Detailstufe: Möwen (Flügelstriche) und Vogelschwärme fallen weg, bei Zoom 0,5 sind die Möwen da', () => {
    const gullStrokes = (
      events: readonly { op?: string; style?: unknown; lineWidth?: number }[],
      z: number,
    ) =>
      events.filter(
        (e) =>
          e.op === 'stroke' && e.style === PALETTE.foam && e.lineWidth === Math.max(1, 1.5 * z),
      );
    const { world } = scene();
    world.tick = 0; // Tag: Möwen fliegen
    const half = run(world, camFor(world, 0.5), { dayNight: false });
    expect(gullStrokes(half.log.events, 0.5).length).toBeGreaterThan(0); // Gegenprobe: Möwen sind im Bild
    for (const zoom of [0.25, 0.125]) {
      const { log } = run(world, camFor(world, zoom), { dayNight: false });
      expect(gullStrokes(log.events, zoom)).toHaveLength(0);
      expect(renderStats.wildDrawn).toBe(0);
    }
  });

  it('AK-E1-22 Zoom 0,5 wie heute: Figuren, Rauch, Wellen gezeichnet, Boden aus halfLayer', () => {
    const { world } = scene();
    world.order = order;
    Object.values(world.buildings)
      .filter((b) => b.defId === 'house')
      .forEach((b) => (b.house!.inhabitants = 40));
    const { log } = run(world, camFor(world, 0.5), { timeMs: EPISODE_MS / 2 });
    expect(renderStats.walkersDrawn).toBeGreaterThan(0);
    expect(renderStats.smokeDrawn).toBeGreaterThan(0);
    expect(renderStats.wavesDrawn).toBe(1);
    expect(h.terrain.halfCalls).toBeGreaterThan(0);
    expect(log.images[0]).toBe(layer);
  });

  it('AK-E1-22 Inselansicht ist nur lesend: Welt bleibt unverändert', () => {
    const { world } = scene();
    const before = JSON.stringify(world);
    const a = world.islands[1]!;
    run(world, camOn(a.ox + a.width / 2, a.oy + a.height / 2, 1));
    run(world, camOn(0, 0, 0.125));
    expect(JSON.stringify(world)).toBe(before);
  });

  it('R3 Übersicht bei Zoom 0,125: höchstens doppelt so viele Zeichenereignisse wie die Heimat allein', () => {
    const { world } = scene();
    const cam = camOn(-5, 40, 0.125);
    const all = run(world, cam);
    expect(renderStats.islandsDrawn).toBe(3);
    const solo = run(homeOnly(world), cam);
    expect(all.log.events.length).toBeLessThanOrEqual(2 * solo.log.events.length);
    const t = (w: World): number => {
      const t0 = performance.now();
      for (let k = 0; k < 20; k++) run(w, cam);
      return performance.now() - t0;
    };
    t(world);
    const ratio = t(world) / Math.max(1, t(homeOnly(world)));
    console.info('R3 Zeitverhältnis Archipel/Heimat bei Zoom 0,125:', ratio.toFixed(2));
    expect(ratio).toBeLessThan(4); // CI-Reserve: Vorgabe 2, Messung siehe Bericht
  });

  it('islandView: Heimat ist die Welt, Fremdinsel folgt dem Tick, zweimal dieselbe Identität', () => {
    const { world } = scene();
    expect(islandView(world, 0)).toBe(world);
    const v = islandView(world, 1);
    expect(islandView(world, 1)).toBe(v);
    expect(v.islands).toEqual([world.islands[1]]);
    expect(v.buildings).toEqual({});
    world.tick += 5;
    expect(v.tick).toBe(world.tick);
    expect(islandCam({ x: 0, y: 0, zoom: 1 }, world.islands[0]!)).toEqual({ x: 0, y: 0, zoom: 1 });
  });

  it('Fremdinsel-Bäume nutzen den Seed der echten Welt, nicht den der Inselansicht', () => {
    const { world } = scene();
    const a = world.islands[1]!;
    run(world, camOn(a.ox + a.width / 2, a.oy + a.height / 2, 1));
    expect(h.treeSeeds.length).toBeGreaterThan(0);
    expect(islandView(world, 1).seed).not.toBe(world.seed);
    expect(new Set(h.treeSeeds)).toEqual(new Set([world.seed]));
  });
});

describe('M12 E2 Render Fremdinseln', () => {
  const V = { w: 1280, h: 800 };
  const camOn = (fx: number, fy: number, zoom: number): { x: number; y: number; zoom: number } => {
    const p = project(fx, fy);
    return { x: p.x - V.w / 2 / zoom, y: p.y - V.h / 2 / zoom, zoom };
  };
  const layers = {
    get: (i: number): HTMLCanvasElement | null =>
      i === 0 ? layer : ({ width: 36 * 32, height: 36 * 32 } as unknown as HTMLCanvasElement),
  };
  const HOVER_OK = rgbaOf(PALETTE.signalOk, 0.35);
  const withIsland2 = () => {
    const { world } = scene();
    const kontor = foundKontor2Literal(world, 2);
    const lj = lumberjackLiteral(world, 2);
    return { world, kontor, lj, isl: world.islands[2]! };
  };
  const draw = (
    world: World,
    cam: { x: number; y: number; zoom: number },
    hover: Hover | null = null,
    selected: number | null = null,
  ) => {
    h.calls.length = 0;
    h.bodyCams.clear();
    const f = fakeCtx();
    render(f.ctx, world, cam, layers, hover, selected, V, { timeMs: 5000, dayNight: true });
    return { calls: h.calls.slice(), events: f.log.events };
  };

  it('(a) Heimat gleich: Gebäude auf Insel 2 ausserhalb des Bildes ändern die Aufrufliste nicht', () => {
    const plain = scene().world;
    const before = draw(plain, camFor(plain, 1)).calls;
    const { world } = withIsland2();
    expect(draw(world, camFor(world, 1)).calls).toEqual(before);
    expect(renderStats.islandsDrawn).toBe(1);
  });

  it('(b) Kamera auf Insel 2: Kontor und Holzfäller werden mit islandCam gezeichnet', () => {
    const { world, kontor, lj, isl } = withIsland2();
    const cam = camOn(isl.ox + (lj.x + kontor.x) / 2, isl.oy + (lj.y + kontor.y) / 2, 1);
    const { calls } = draw(world, cam);
    expect(renderStats.islandsDrawn).toBe(1);
    const bodies = calls.filter((c) => c.kind === 'body').map((c) => c.id);
    expect(bodies).toContain(lj.id);
    expect(bodies).toContain(kontor.id);
    const ic = islandCam(cam, isl);
    expect(h.bodyCams.get(lj.id)).toEqual(ic);
    // Bildposition der Holzfäller-Raute folgt aus der Inselkamera
    const p = tileToScreen(ic, lj.x, lj.y);
    const q = tileToScreen(cam, isl.ox + lj.x, isl.oy + lj.y);
    expect(p.x).toBeCloseTo(q.x, 6);
    expect(p.y).toBeCloseTo(q.y, 6);
    // Welt bleibt unverändert
    expect(world.buildings[lj.id]!.island).toBe(2);
  });

  it('(c) hover mit island 2: Vorschau-Rahmen an der Inselposition, keiner in der Heimat; ohne island wie vorher', () => {
    const { world, isl } = withIsland2();
    const cam = camOn(isl.ox + isl.width / 2, isl.oy + isl.height / 2, 2);
    const ic = islandCam(cam, isl);
    const hover: Hover = {
      island: 2,
      x: 4,
      y: 5,
      tool: { kind: 'build', defId: 'lumberjack' },
      ok: true,
    };
    const fills = (ev: readonly Ev[]) => ev.filter((e) => e.op === 'fill' && e.style === HOVER_OK);
    const on = draw(world, cam, hover).events;
    const rahmen = fills(on);
    expect(rahmen).toHaveLength(1);
    const o = tileToScreen(ic, 4, 5);
    expect(rahmen[0]!.points[0]!.x).toBeCloseTo(o.x, 6);
    expect(rahmen[0]!.points[0]!.y).toBeCloseTo(o.y, 6);
    // Kamera über der Heimat, hover auf der Heimat ohne island: Rahmen an Heimatposition
    const hc = camFor(world, 1);
    const homeHover: Hover = { x: 4, y: 5, tool: { kind: 'build', defId: 'lumberjack' }, ok: true };
    const hr = fills(draw(world, hc, homeHover).events);
    expect(hr).toHaveLength(1);
    expect(hr[0]!.points[0]).toEqual(tileToScreen(hc, 4, 5));
    // hover.island 2 bei Kamera über der Heimat: kein Rahmen (Insel 2 nicht im Bild)
    expect(fills(draw(world, hc, { ...homeHover, island: 2 }).events)).toHaveLength(0);
    // hover auf Insel 2 bei Kamera auf Insel 2: kein Heimat-Rahmen an der Heimat-Kachel
    expect(fills(draw(world, cam, { ...hover, island: 0 }).events)).toHaveLength(0);
  });

  it('Auswahl eines Gebäudes auf Insel 2 hebt es in der Ansicht von Insel 2 hervor', () => {
    const { world, lj, isl } = withIsland2();
    const cam = camOn(isl.ox + isl.width / 2, isl.oy + isl.height / 2, 2);
    const strokes = (sel: number | null) =>
      draw(world, cam, null, sel).events.filter(
        (e) => e.op === 'stroke' && e.style === PALETTE.signalYellow,
      );
    expect(strokes(null)).toHaveLength(0);
    const sel = strokes(lj.id);
    expect(sel).toHaveLength(1);
    const o = tileToScreen(islandCam(cam, isl), lj.x, lj.y);
    expect(
      sel[0]!.points.some((p) => Math.abs(p.x - o.x) < 1e-6 && Math.abs(p.y - o.y) < 1e-6),
    ).toBe(true);
  });
});

describe('M12 E4 Schiffe im Renderer (AK-E4-15)', () => {
  it('AK-E4-15 (a) Schiff im Rechteck der Heimat zwischen zwei Gebäuden: Gebäude kleiner Tiefe, Schiff, Gebäude grösserer Tiefe', () => {
    const { world } = scene();
    const k = world.buildings[home(world).kontorId]!;
    const isl = home(world);
    isl.anchor = { x: k.x + 4, y: k.y + 5 }; // Tiefe der Schiffsmitte: 2 · (ax + ay + 1)
    shipLiteral(world, { port: 0, to: null });
    const shipKey = 2 * (isl.anchor.x + isl.anchor.y + 1);
    const keyOf = (id: number): number => {
      const b = world.buildings[id]!;
      const d = BUILDING_DEFS[b.defId];
      return 2 * b.x + d.w + 2 * b.y + d.h;
    };
    h.calls.length = 0;
    const f = fakeCtx();
    render(f.ctx, world, camFor(world, 1), layer, null, null, VIEW, { timeMs: 0 });
    const calls = h.calls.slice();
    const i = calls.findIndex((c) => c.kind === 'ship');
    expect(i).toBeGreaterThanOrEqual(0);
    const before = calls.slice(0, i).filter((c) => c.kind === 'body');
    const after = calls.slice(i + 1).filter((c) => c.kind === 'body');
    expect(before.some((c) => keyOf(c.id) < shipKey)).toBe(true);
    expect(after.some((c) => keyOf(c.id) > shipKey)).toBe(true);
    for (const c of before) expect(keyOf(c.id)).toBeLessThanOrEqual(shipKey); // Gleichstand: Gebäude zuerst (RANK)
    for (const c of after) expect(keyOf(c.id)).toBeGreaterThanOrEqual(shipKey);
  });

  it('AK-E4-15 (b) Schiff auf See: nach Insel 1 gezeichnet genau dann, wenn seaShipAfter', () => {
    const w = seaWorld();
    const k2 = foundKontor2Literal(w, 1);
    const isl = w.islands[1]!;
    const V = { w: 1280, h: 800 };
    const layers = {
      get: (i: number): HTMLCanvasElement | null =>
        i === 0 ? layer : ({ width: 36 * 32, height: 36 * 32 } as unknown as HTMLCanvasElement),
    };
    const p = project(isl.ox + isl.width / 2, isl.oy + isl.height / 2);
    const cam = { x: p.x - V.w / 2 / 0.25, y: p.y - V.h / 2 / 0.25, zoom: 0.25 };
    const seen = { after: 0, before: 0 };
    for (const from of [0, 2]) {
      for (let left = 5; left < 400; left += 7) {
        w.ships.length = 0;
        const ship = shipLiteral(w, { port: from, to: 1, left });
        const pose = shipPose(w, ship);
        if (pose.island !== null) continue;
        h.calls.length = 0;
        render(fakeCtx().ctx, w, cam, layers, null, null, V, { timeMs: 0 });
        const calls = h.calls.slice();
        const si = calls.findIndex((c) => c.kind === 'ship');
        const bi = calls.findIndex((c) => c.kind === 'body' && c.id === k2.id);
        if (si < 0 || bi < 0) continue; // nicht im Bild
        const after = si > bi;
        expect(after).toBe(seaShipAfter(pose, isl));
        seen[after ? 'after' : 'before']++;
      }
    }
    expect(seen.after + seen.before).toBeGreaterThan(0);
  });

  it('AK-E4-15 (c) Mindestgrösse: Schiff bei Zoom 0,25 und 0,125 mindestens 12 CSS-px breit, bei Zoom 1 Faktor 1', () => {
    for (const z of [0.25, 0.125]) {
      const f = fakeCtx();
      drawShip(f.ctx, { x: 0, y: 0, zoom: z }, { x: 0, y: 0 }, 0, shipScale(z));
      const xs = f.log.events
        .filter((e) => e.op === 'fill')
        .flatMap((e) => e.points.map((p) => p.x));
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(12);
    }
    expect(shipScale(1)).toBe(1);
    const w = seaWorld();
    shipLiteral(w, { port: 0, to: null });
    const cam = { x: 0, y: 0, zoom: 0.125 };
    const a = home(w).anchor;
    const pt = project(a.x + 0.5, a.y + 0.5);
    cam.x = pt.x - 640 / 0.125;
    cam.y = pt.y - 400 / 0.125;
    h.calls.length = 0;
    h.shipScales.length = 0;
    render(fakeCtx().ctx, w, cam, layer, null, null, { w: 1280, h: 800 }, { timeMs: 0 });
    expect(h.shipScales).toEqual([shipScale(0.125)]);
  });
});
