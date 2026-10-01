import { describe, expect, it } from 'vitest';
import { NIGHT_COLOR } from '../../src/render/daynight';
import { sortedObjects } from '../../src/render/iso';
import { centerOn } from '../../src/render/camera';
import { render, type Hover } from '../../src/render/renderer';
import { bodyColors } from '../../src/render/sprites';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { placeBuilding } from '../../src/sim/build';
import { center, createWorld } from '../../src/sim/world';
import type { BuildingDefId, Category, World } from '../../src/sim/types';
import { forceRect } from '../sim/helpers';
import { fakeCtx, type Mat } from './fakeCtx';

const VIEW = { w: 1280, h: 720 };
const BASE = (dpr: number): Mat => [dpr, 0, 0, dpr, 0, 0];
const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;
const SEL = '#ffe000';

/** Welt mit Kontor, Haus, Markt und Weberei (roh gesetzt: Betrieb angebunden, damit er raucht). */
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
          for (const h of [hover, { ...hover, tool: { kind: 'select' as const } }, null]) {
            const { ctx, log } = fakeCtx();
            ctx.setTransform(2, 0, 0, 2, 0, 0);
            render(ctx, world, cam, layer, h, empty ? null : ids.market!, VIEW, {
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

  it('ISO §5 Reihenfolge: Boden unter Bodenmatrix vor Körpern; Körper in sortedObjects-Reihenfolge; Signale nach der Tönung', () => {
    const { world, ids } = scene();
    world.order = order;
    world.tick = 3000; // Nacht: Tönung sichtbar
    const cam = camFor(world, 1);
    const { ctx, log } = fakeCtx();
    const base = BASE(1);
    render(ctx, world, cam, layer, null, ids.house!, VIEW, { timeMs: 500, dayNight: true });
    const ev = log.events;
    const isBase = (m: Mat): boolean => m.every((v, i) => v === base[i]);

    // Boden: drawImage unter der Bodenmatrix
    const img = ev.findIndex((e) => e.op === 'drawImage');
    expect(img).toBeGreaterThanOrEqual(0);
    expect(isBase(ev[img]!.matrix)).toBe(false);
    // Körper: Dachflächen im Bildraum, in sortedObjects-Reihenfolge
    const tops = new Map<string, Category>();
    for (const c of ['housing', 'production', 'infrastructure', 'public'] as const)
      tops.set(bodyColors(c).top, c);
    const bodyEv = ev.filter((e) => e.op === 'fill' && tops.has(e.style));
    expect(bodyEv.length).toBeGreaterThanOrEqual(5);
    for (const e of bodyEv) expect(isBase(e.matrix)).toBe(true);
    const expected = sortedObjects(world, [])
      .filter((i) => i.kind === 'building')
      .map((i) => BUILDING_DEFS[world.buildings[i.id]!.defId].category);
    expect(bodyEv.map((e) => tops.get(e.style))).toEqual(expected);
    // alles, was unter der Bodenmatrix liegt (Textur, Wellen, Wege), kommt vor dem ersten Körper
    const firstBody = ev.indexOf(bodyEv[0]!);
    const lastGround = ev.map((e) => !isBase(e.matrix) && e.op !== 'transform').lastIndexOf(true);
    expect(lastGround).toBeGreaterThan(img);
    expect(lastGround).toBeLessThan(firstBody);
    // Tönung: ein Durchgang, danach Signale (Auswahl) ungetönt und im Bildraum
    const tint = ev
      .map((e, i) => (e.op === 'fillRect' && e.style.startsWith(`rgba(${NIGHT_COLOR},`) ? i : -1))
      .filter((i) => i >= 0);
    expect(tint).toHaveLength(1);
    const sel = ev.findIndex((e) => e.op === 'stroke' && e.style === SEL);
    expect(sel).toBeGreaterThan(tint[0]!);
    expect(isBase(ev[sel]!.matrix)).toBe(true);
    // Luft (Rauch der Weberei) liegt nach dem letzten Körper und vor der Tönung
    const smoke = ev.findIndex((e) => e.op === 'fill' && e.style.startsWith('rgba(128,128,128,'));
    expect(smoke).toBeGreaterThan(ev.indexOf(bodyEv[bodyEv.length - 1]!));
    expect(smoke).toBeLessThan(tint[0]!);
    // Signal-Striche nie unter der Bodenmatrix
    for (const e of ev)
      if (e.style === SEL || e.style === '#fff') expect(isBase(e.matrix)).toBe(true);
    // kein Multiply, höchstens ein additiver Durchgang
    expect(log.compositeSet.filter((c) => c === 'multiply')).toHaveLength(0);
    expect(log.compositeSet.filter((c) => c === 'lighter').length).toBeLessThanOrEqual(1);
  });
});
