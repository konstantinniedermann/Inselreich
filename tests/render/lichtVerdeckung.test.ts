import { beforeAll, describe, expect, it } from 'vitest';
import { centerOn, type Camera } from '../../src/render/camera';
import { isLit } from '../../src/render/daynight';
import { spriteBounds } from '../../src/render/iso';
import { anchorRects, anchorsFor, type LightRect } from '../../src/render/life';
import { render } from '../../src/render/renderer';
import { bodyPolygons } from '../../src/render/sprites';
import { resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, World } from '../../src/sim/types';
import { tileAt } from '../../src/sim/world';
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
): { log: FakeCtx; cam: Camera } {
  w.tick = tick;
  const h = at(VERDECKUNG.H);
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
      e.op === 'fill' && e.composite === 'lighter' && e.points.some((p) => near(p, { x: r.x, y: r.y })),
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
});
