import { beforeAll, describe, expect, it } from 'vitest';
import { centerOn, type Camera } from '../../src/render/camera';
import { sortedObjects, spriteBounds } from '../../src/render/iso';
import { PALETTE, rgbaOf } from '../../src/render/palette';
import { anchorRects, anchorsFor, crownPolys, type LightRect } from '../../src/render/life';
import { render } from '../../src/render/renderer';
import { bodyPolygons } from '../../src/render/sprites';
import { resetTreeCache, setCanvasFactory, type TreeItem } from '../../src/render/trees';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, World } from '../../src/sim/types';
import { tileAt } from '../../src/sim/world';
import { forceGrass, forceRect } from '../sim/helpers';
import { VERDECKUNG, verdeckung } from '../sim/scenarios-iso';
import { fakeCtx, type Ev, type FakeCtx, type P } from './fakeCtx';

// RF-LICHT: Licht und Feuer erscheinen nicht über Objekten, die in der Tiefensortierung davor stehen.
const VIEW = { w: 1280, h: 800 };
const NIGHT = 3600;
const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;

let world: World;
const at = (p: { x: number; y: number }): Building => {
  const id = tileAt(world, p.x, p.y)?.buildingId;
  if (id == null) throw new Error(`kein Gebäude bei ${p.x},${p.y}`);
  return world.buildings[id]!;
};

function frame(
  w: World,
  tick: number,
  fire: { id: number; flames: number; smoke: number }[] = [],
  focus: { x: number; y: number } = VERDECKUNG.H2,
): { log: FakeCtx; cam: Camera } {
  w.tick = tick;
  const h = at(focus);
  const cam: Camera = { x: 0, y: 0, zoom: 1 };
  centerOn(cam, h.x + 0.5, h.y + 0.5, VIEW, { w: w.width, h: w.height });
  const { ctx, log } = fakeCtx();
  render(ctx, w, cam, layer, null, null, VIEW, { timeMs: 0, dayNight: true, fire });
  return { log, cam };
}

const windowRects = (cam: Camera, b: Building): LightRect[] => {
  const def = BUILDING_DEFS[b.defId];
  const anchors = anchorsFor(def, b);
  return anchorRects(cam, spriteBounds(def, b), anchors).filter((_, i) => !anchors[i]!.always);
};
const near = (a: P, b: P): boolean => Math.abs(a.x - b.x) < 0.01 && Math.abs(a.y - b.y) < 0.01;
/** `lighter`-Füllung, deren Pfad die linke obere Ecke des Fensters `r` enthält. */
const lightFill = (log: FakeCtx, r: LightRect): Ev | undefined =>
  log.events.find(
    (e) =>
      e.op === 'fill' &&
      e.composite === 'lighter' &&
      e.points.some((p) => near(p, { x: r.x, y: r.y })),
  );
const polysOf = (cam: Camera, b: Building): P[][] =>
  bodyPolygons(BUILDING_DEFS[b.defId], b).map((p) =>
    p.map((q) => ({ x: (q.x - cam.x) * cam.zoom, y: (q.y - cam.y) * cam.zoom })),
  );
const excludes = (e: Ev, poly: P[]): boolean =>
  e.clips.some((c) => c.rule === 'evenodd' && poly.every((p) => c.points.some((q) => near(p, q))));

beforeAll(() => {
  setCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
});

describe('RF-LICHT Fensterlicht hinter Verdeckern', () => {
  it('RF-LICHT-1 Fenster von house#2 hinter chapel#5 stehen in der lighter-Füllung unter einem Clip ohne Kapelle', () => {
    resetTreeCache();
    world = verdeckung();
    const { log, cam } = frame(world, NIGHT);
    const house = at(VERDECKUNG.H2);
    const chapel = at(VERDECKUNG.C);
    const rects = windowRects(cam, house);
    expect(rects.length).toBeGreaterThan(0);
    const fill = lightFill(log, rects[0]!);
    expect(fill, 'Fensterfüllung im lighter-Pfad').toBeDefined();
    const polys = polysOf(cam, chapel);
    expect(polys.length).toBeGreaterThan(0);
    expect(polys.some((p) => excludes(fill!, p))).toBe(true);
  });

  /** Welt mit nur den Gebäuden `keep` (Positionen), ohne Wald: nichts steht davor, ausser was der Test setzt. */
  function isolated(keep: { x: number; y: number }[]): World {
    const w = verdeckung();
    const ids = new Set(keep.map((p) => tileAt(w, p.x, p.y)!.buildingId!));
    ids.add(w.kontorId);
    for (const t of w.tiles) {
      if (t.buildingId !== null && !ids.has(t.buildingId)) t.buildingId = null;
      if (t.terrain === 'forest') t.terrain = 'grass';
    }
    for (const id of Object.keys(w.buildings))
      if (!ids.has(Number(id))) delete w.buildings[Number(id)];
    return w;
  }

  it('RF-LICHT-2 frei stehendes Gebäude: Fenster bleiben gebündelt ohne Clip', () => {
    resetTreeCache();
    world = isolated([VERDECKUNG.F]);
    const { log, cam } = frame(world, NIGHT, [], VERDECKUNG.F);
    const rects = windowRects(cam, at(VERDECKUNG.F));
    expect(rects.length).toBeGreaterThan(0);
    const fill = lightFill(log, rects[0]!);
    expect(fill).toBeDefined();
    expect(fill!.clips).toHaveLength(0);
    expect(fill!.points.length).toBeGreaterThanOrEqual(4 * rects.length);
    expect(log.events.some((e) => e.op === 'clip')).toBe(false);
  });

  it('RF-LICHT-3 am Tag gibt es keinen lighter-Durchgang und keine Clips', () => {
    resetTreeCache();
    world = verdeckung();
    const { log } = frame(world, 0);
    expect(log.compositeSet.filter((c) => c === 'lighter')).toHaveLength(0);
    expect(log.events.some((e) => e.op === 'clip')).toBe(false);
  });

  it('RF-LICHT-4 ein Baum vor dem Fenster verdeckt (Kronen als Clip)', () => {
    resetTreeCache();
    world = isolated([VERDECKUNG.F]);
    const f = at(VERDECKUNG.F);
    forceGrass(world, f.x + 1, f.y + 1);
    forceRect(world, f.x + 1, f.y + 1, 1, 1, 'forest');
    const { log, cam } = frame(world, NIGHT, [], VERDECKUNG.F);
    const tree = sortedObjects(world).find(
      (i): i is TreeItem => i.kind === 'tree' && i.fp.x === f.x + 1,
    )!;
    expect(tree).toBeDefined();
    const fill = lightFill(log, windowRects(cam, f)[0]!);
    expect(fill).toBeDefined();
    const crowns = crownPolys(cam, tree, world.seed);
    expect(crowns.length).toBeGreaterThanOrEqual(3);
    expect(crowns.every((c) => excludes(fill!, c))).toBe(true);
  });

  it('RF-LICHT-5 ein Baum hinter dem Fenster verdeckt nicht', () => {
    resetTreeCache();
    world = isolated([VERDECKUNG.F]);
    const f = at(VERDECKUNG.F);
    forceRect(world, f.x - 1, f.y - 1, 1, 1, 'forest');
    const { log, cam } = frame(world, NIGHT, [], VERDECKUNG.F);
    const fill = lightFill(log, windowRects(cam, f)[0]!);
    expect(fill).toBeDefined();
    expect(fill!.clips).toHaveLength(0);
  });

  it('RF-LICHT-6 brennendes, verdecktes Gebäude: Flammen und Schein unter Clip ohne Kapelle', () => {
    resetTreeCache();
    world = verdeckung();
    const house = at(VERDECKUNG.H2);
    const { log, cam } = frame(world, NIGHT, [{ id: house.id, flames: 1, smoke: 0 }]);
    const polys = polysOf(cam, at(VERDECKUNG.C));
    const gradient = (e: Ev): boolean =>
      e.op === 'fill' && e.style.includes(PALETTE.lightEvening) && e.style.includes('gradient');
    const flames = log.events.filter((e) => gradient(e) && e.composite !== 'lighter');
    expect(flames.length).toBeGreaterThan(0);
    for (const e of flames) expect(polys.some((p) => excludes(e, p))).toBe(true);
    const glow = log.events.filter(
      (e) =>
        e.composite === 'lighter' &&
        (e.op === 'fill' || e.op === 'fillRect') &&
        e.style.includes(rgbaOf(PALETTE.lightEvening, 0)),
    );
    expect(glow.length).toBeGreaterThan(0);
    for (const e of glow) expect(polys.some((p) => excludes(e, p))).toBe(true);
  });

  it('RF-LICHT-7 genau ein lighter-Durchgang, save und restore ausgeglichen, Matrix unverändert', () => {
    resetTreeCache();
    world = verdeckung();
    const house = at(VERDECKUNG.H2);
    const { log } = frame(world, NIGHT, [{ id: house.id, flames: 1, smoke: 1 }]);
    expect(log.compositeSet.filter((c) => c === 'lighter')).toHaveLength(1);
    expect(log.saves).toBe(log.restores);
    expect(log.underflow).toBe(0);
    expect(log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
  });
});
