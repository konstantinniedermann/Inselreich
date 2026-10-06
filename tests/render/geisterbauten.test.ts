import { beforeAll, describe, expect, it } from 'vitest';
import {
  centerOn,
  visibleTileRange,
  worldToScreen,
  type Camera,
  type TileRange,
} from '../../src/render/camera';
import { errandsFrom } from '../../src/render/errands';
import { bodyHull, buildingHulls, pickBuilding, sortedObjects } from '../../src/render/iso';
import { islandView } from '../../src/render/archipel';
import { totalInhabitants } from '../../src/render/life';
import { drawNeedSymbols, drawUnconnected } from '../../src/render/overlays';
import { drawProgressRings } from '../../src/render/ring';
import { render, renderStats } from '../../src/render/renderer';
import { drawStatusMarks } from '../../src/render/statusMarks';
import { resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import { viewStats } from '../../src/render/viewStats';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { home, createWorld } from '../../src/sim/world';
import type { Building, World } from '../../src/sim/types';
import { foreignHover, hoverInfo } from '../../src/ui/hover';
import { targetTile } from '../../src/ui/target';
import { SCENARIOS } from '../sim/scenarios';
import { fakeCtx } from './fakeCtx';

const VIEW = { w: 1280, h: 720 };
const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;

beforeAll(() => {
  setCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetTreeCache();
});

/** Stadt der Galerie; `ghost`: alle Gebäude ausser dem Kontor gehören der Fremdinsel 1 (lokale Koordinaten innerhalb der Heimat). */
function city(ghost: boolean): { world: World; ghosts: Building[] } {
  const world = SCENARIOS.galerie!();
  const ghosts: Building[] = [];
  const kontor = home(world).kontorId;
  for (const b of Object.values(world.buildings)) {
    if (b.id === kontor) continue;
    if (ghost) {
      b.island = 1;
      ghosts.push(b);
    }
  }
  return { world, ghosts };
}
const camOver = (world: World, b: Building, zoom = 1): Camera => {
  const cam: Camera = { x: 0, y: 0, zoom };
  centerOn(cam, b.x, b.y, VIEW, { w: home(world).width, h: home(world).height });
  return cam;
};
const rangeOf = (world: World, cam: Camera) =>
  visibleTileRange(cam, VIEW, { w: home(world).width, h: home(world).height });

describe('H-F1 Geisterbauten: Fremdinsel-Gebäude erscheinen nicht auf der Heimat', () => {
  it('Kontrolle: die Stadt ist ohne Fremdinsel-Kennung gross genug für die Fälle', () => {
    const { world } = city(false);
    const houses = Object.values(world.buildings).filter((b) => b.house);
    expect(houses.length).toBeGreaterThan(2);
    expect(sortedObjects(world).filter((i) => i.kind === 'building').length).toBeGreaterThan(5);
    expect(buildingHulls(world).length).toBeGreaterThan(5);
    expect(totalInhabitants(world)).toBeGreaterThan(0);
  });

  it('T1 sortedObjects und buildingHulls enthalten nur Heimat-Gebäude', () => {
    const { world, ghosts } = city(true);
    const ids = new Set(ghosts.map((g) => g.id));
    expect(sortedObjects(world).some((i) => i.kind === 'building' && ids.has(i.id))).toBe(false);
    expect(buildingHulls(world).some((h) => ids.has(h.id))).toBe(false);
    expect(buildingHulls(world).map((h) => h.id)).toEqual([home(world).kontorId]);
  });

  const ghostClick = () => {
    const { world, ghosts } = city(true);
    const g = ghosts.find((b) => b.house)!;
    const cam = camOver(world, g, 2);
    const hull = bodyHull(BUILDING_DEFS[g.defId], g);
    const mid = {
      x: hull.reduce((a, p) => a + p.x, 0) / hull.length,
      y: hull.reduce((a, p) => a + p.y, 0) / hull.length,
    };
    return { world, ghosts, g, cam, mid };
  };

  it('T1 pickBuilding trifft kein Geisterbauwerk, aber das Heimat-Gebäude', () => {
    const { world, mid, g } = ghostClick();
    expect(pickBuilding(buildingHulls(world), mid.x, mid.y)).toBeNull();
    const control = city(false).world;
    expect(pickBuilding(buildingHulls(control), mid.x, mid.y)).toBe(g.id);
  });

  it('T1 targetTile (Auswahl) liefert über Geisterbauten die Kachel, nie deren Ursprung', () => {
    const { world, ghosts, cam } = ghostClick();
    const clean = city(true).world; // frische Welt ohne Geisterbauten (kein Cache)
    for (const b of ghosts) delete clean.buildings[b.id];
    for (const b of ghosts) {
      const hull = bodyHull(BUILDING_DEFS[b.defId], b);
      const top = hull.reduce((m, p) => (p.y < m.y ? p : m));
      const s = worldToScreen(cam, { x: top.x, y: top.y + 6 });
      expect(targetTile(world, cam, { kind: 'select' }, s.x, s.y)).toEqual(
        targetTile(clean, cam, { kind: 'select' }, s.x, s.y),
      );
    }
  });

  it('T1 hover: „versorgt N Häuser" zählt keine Fremdinsel-Häuser', () => {
    const chapel = (w: World): Building => {
      const h = Object.values(w.buildings).find((b) => b.house)!;
      const c: Building = {
        id: 9001,
        defId: 'chapel',
        x: h.x,
        y: h.y + 3,
        connected: true,
        progress: 0,
        state: 'ok',
        island: 0,
      };
      w.buildings[c.id] = c;
      home(w).tiles[c.y * home(w).width + c.x]!.buildingId = c.id;
      return c;
    };
    const ask = (w: World, c: Building) =>
      hoverInfo(w, { x: c.x, y: c.y }, 0, { ship: false, animal: null })!.lines;
    const control = city(false).world;
    const cc = chapel(control);
    expect(ask(control, cc)).not.toContain('versorgt 0 Häuser');
    const { world } = city(true);
    const c = chapel(world);
    expect(ask(world, c)).toContain('versorgt 0 Häuser');
    expect(typeof foreignHover).toBe('function');
  });

  it('T1 viewStats und totalInhabitants zählen keine Einwohner der Fremdinsel', () => {
    const { world, ghosts } = city(true);
    const g = ghosts.find((b) => b.house)!;
    const cam = camOver(world, g, 0.5);
    expect(viewStats(world, cam, { w: 4000, h: 3000 }).inhabitants).toBe(0);
    expect(totalInhabitants(world)).toBe(0);
  });

  const overlayCase = (
    name: string,
    fn: (ctx: CanvasRenderingContext2D, w: World, cam: Camera, r: TileRange) => unknown,
  ) =>
    it(`T1 ${name} zeichnet nichts für Fremdinsel-Gebäude`, () => {
      const { world, ghosts } = city(true);
      for (const b of ghosts) {
        if (b.defId !== 'house' && b.defId !== 'kontor') b.connected = false;
        b.state = 'waitingInput';
      }
      const g = ghosts.find((b) => b.house)!;
      const cam = camOver(world, g, 1);
      const { ctx, log } = fakeCtx();
      fn(ctx, world, cam, rangeOf(world, cam));
      expect(log.events.length).toBe(0);
    });
  overlayCase('drawNeedSymbols', (c, w, cam, r) => drawNeedSymbols(c, w, cam, r));
  overlayCase('drawUnconnected', (c, w, cam, r) => drawUnconnected(c, w, cam, r));
  overlayCase('drawStatusMarks', (c, w, cam, r) => drawStatusMarks(c, w, cam, r, 0, false));
  overlayCase('drawProgressRings', (c, w, cam, r) => drawProgressRings(c, w, cam, r, 0.5));

  it('T1 Kontrolle: dieselben Zeichner zeichnen bei Heimat-Gebäuden', () => {
    const { world } = city(false);
    for (const b of Object.values(world.buildings)) {
      if (b.defId !== 'house' && b.defId !== 'kontor') b.connected = false;
      if (b.defId !== 'house' && b.defId !== 'kontor') b.state = 'waitingInput';
    }
    const g = Object.values(world.buildings).find((b) => b.defId === 'house')!;
    const cam = camOver(world, g, 1);
    const range = rangeOf(world, cam);
    const { ctx, log } = fakeCtx();
    drawUnconnected(ctx, world, cam, range);
    drawStatusMarks(ctx, world, cam, range, 0, false);
    expect(log.events.length).toBeGreaterThan(0);
  });

  it('T1 errandsFrom: keine Wege für Betriebe der Fremdinsel', () => {
    const scene = (island: number): World => {
      const w = createWorld(3);
      const h = home(w);
      for (let y = 30; y <= 50; y++)
        for (let x = 30; x <= 60; x++) h.tiles[y * h.width + x]!.terrain = 'grass';
      for (const [x, y] of [
        [40, 38],
        [41, 38],
        [40, 37],
      ] as const)
        h.tiles[y * h.width + x]!.terrain = 'forest';
      const put = (
        id: number,
        defId: 'lumberjack' | 'market',
        x: number,
        y: number,
        isl: number,
      ) => {
        w.buildings[id] = {
          id,
          defId,
          x,
          y,
          connected: true,
          progress: defId === 'lumberjack' ? 15 : 0,
          state: 'ok',
          island: isl,
        };
        const d = BUILDING_DEFS[defId];
        for (let dy = 0; dy < d.h; dy++)
          for (let dx = 0; dx < d.w; dx++) h.tiles[(y + dy) * h.width + x + dx]!.buildingId = id;
      };
      put(2001, 'lumberjack', 40, 40, island);
      put(2002, 'market', 50, 40, 0);
      for (let x = 41; x <= 49; x++) h.tiles[40 * h.width + x]!.road = true;
      return w;
    };
    const full = { x0: 0, y0: 0, x1: 63, y1: 63 };
    const clock = { frac: 0, fast: false };
    expect(errandsFrom(scene(0), full, clock).length).toBe(1);
    expect(errandsFrom(scene(1), full, clock)).toEqual([]);
  });

  it('T1 renderer: Dev-Abzeichen (badges) nur für Heimat-Gebäude', () => {
    const { world, ghosts } = city(true);
    for (const b of ghosts) if (b.defId !== 'house') b.connected = false;
    const g = ghosts.find((b) => b.house)!;
    const { ctx } = fakeCtx();
    render(ctx, world, camOver(world, g), layer, null, null, VIEW, { timeMs: 0 });
    const ids = new Set(ghosts.map((b) => b.id));
    expect(renderStats.badges.filter((b) => ids.has(b.id))).toEqual([]);
  });

  it('T1 Heimat-Gebäude kommen weiter vor; Fremdinsel-Ansicht zeigt ihre Gebäude unverändert', () => {
    const w = createWorld(3);
    const k = w.buildings[home(w).kontorId]!;
    expect(sortedObjects(w).some((i) => i.kind === 'building' && i.id === k.id)).toBe(true);
    const f: Building = {
      id: 7001,
      defId: 'house',
      x: 5,
      y: 5,
      connected: true,
      progress: 0,
      state: 'ok',
      island: 1,
    };
    w.buildings[f.id] = f;
    const v = islandView(w, 1);
    expect(sortedObjects(v).some((i) => i.kind === 'building' && i.id === f.id)).toBe(true);
    expect(sortedObjects(w).some((i) => i.kind === 'building' && i.id === f.id)).toBe(false);
  });

  it('T1 sortedObjects-Cache: gleiche Instanz bei gleicher Welt, keine Welt-Kopie', () => {
    const { world } = city(true);
    expect(sortedObjects(world)).toBe(sortedObjects(world));
    expect(islandView(world, 0)).toBe(world);
  });
});
