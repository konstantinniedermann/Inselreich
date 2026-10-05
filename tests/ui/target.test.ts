import { describe, expect, it } from 'vitest';
import { targetTile } from '../../src/ui/target';
import { screenToTile, type Camera } from '../../src/render/camera';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import {
  bodyHeight,
  buildingHulls,
  footprintOrigin,
  pickBuilding,
  project,
} from '../../src/render/iso';
import { placeBuilding } from '../../src/sim/build';
import { home, createWorld } from '../../src/sim/world';
import type { Building, World } from '../../src/sim/types';
import { forceRect } from '../sim/helpers';

/** Welt mit freier Grasfläche östlich des Kontors, Geld im Überfluss. */
function buildWorld(): { world: World; o: { x: number; y: number } } {
  const world = createWorld(1, { unlockAll: true });
  const k = world.buildings[home(world).kontorId]!;
  const o = { x: k.x + 3, y: k.y + 3 };
  forceRect(world, o.x, o.y, 5, 5, 'grass');
  world.money = 100000;
  for (const g of Object.keys(home(world).stock) as (keyof World['stock'])[])
    home(world).stock[g] = 1000;
  return { world, o };
}
function place(world: World, defId: Building['defId'], x: number, y: number): Building {
  const r = placeBuilding(world, defId, x, y);
  if (!r.ok || r.id === undefined) throw new Error(`${defId} nicht gebaut`);
  return world.buildings[r.id]!;
}
/** Kamera, die den Weltpunkt (fx, fy) bei Zoom `zoom` in die Fenstermitte (800 × 600) legt. */
const camAt = (fx: number, fy: number, zoom: number): Camera => {
  const p = project(fx, fy);
  return { x: p.x - 400 / zoom, y: p.y - 300 / zoom, zoom };
};
/** Bildschirmpunkt eines Weltpixels. */
const scr = (cam: Camera, wx: number, wy: number): { sx: number; sy: number } => ({
  sx: (wx - cam.x) * cam.zoom,
  sy: (wy - cam.y) * cam.zoom,
});
/** Bildschirmpunkt eines Kachelpunkts (fx, fy). */
const scrT = (cam: Camera, fx: number, fy: number): { sx: number; sy: number } => {
  const p = project(fx, fy);
  return scr(cam, p.x, p.y);
};

describe.each([1, 0.5])('targetTile bei Zoom %s', (zoom) => {
  it('AK-ISO-14 Vorstufe: Bauen 1 × 1 = screenToTile, 2 × 2 = footprintOrigin (Cursor im Footprint)', () => {
    const { world, o } = buildWorld();
    const cam = camAt(o.x + 2, o.y + 2, zoom);
    const tx = o.x + 1,
      ty = o.y + 1;
    // 1 × 1: jede Stichprobe in der Raute trifft die Kachel
    for (const [dx, dy] of [
      [0.5, 0.5],
      [0.1, 0.1],
      [0.9, 0.9],
      [0.1, 0.9],
      [0.9, 0.1],
    ] as const) {
      const { sx, sy } = scrT(cam, tx + dx, ty + dy);
      expect(targetTile(world, cam, { kind: 'build', defId: 'house' }, sx, sy)).toEqual({
        x: tx,
        y: ty,
      });
    }
    // 2 × 2: Ursprung = footprintOrigin und der Cursor liegt im Footprint
    const def = BUILDING_DEFS.market;
    for (const [dx, dy] of [
      [0.5, 0.5],
      [0.05, 0.5],
      [0.95, 0.5],
      [0.5, 0.05],
      [0.5, 0.95],
    ] as const) {
      const { sx, sy } = scrT(cam, tx + dx, ty + dy);
      const org = targetTile(world, cam, { kind: 'build', defId: 'market' }, sx, sy)!;
      expect(org).toEqual(footprintOrigin(tx + dx, ty + dy, def.w, def.h));
      expect(tx).toBeGreaterThanOrEqual(org.x);
      expect(tx).toBeLessThan(org.x + def.w);
      expect(ty).toBeGreaterThanOrEqual(org.y);
      expect(ty).toBeLessThan(org.y + def.h);
    }
  });

  it('AK-ISO-14 Vorstufe: Hover knapp innerhalb einer Rautenkante (2 px) trifft die richtige Kachel', () => {
    const { world, o } = buildWorld();
    const cam = camAt(o.x + 2, o.y + 2, zoom);
    const tx = o.x + 1,
      ty = o.y + 2;
    const d = 2 / zoom; // 2 Bildschirmpixel in Weltpixeln
    const mids = [
      { p: project(tx + 0.5, ty), dx: 0, dy: d }, // obere rechte Kante, nach unten
      { p: project(tx + 0.5, ty + 1), dx: 0, dy: -d }, // untere linke Kante, nach oben
      { p: project(tx, ty + 0.5), dx: d, dy: 0 }, // obere linke Kante, nach rechts
      { p: project(tx + 1, ty + 0.5), dx: -d, dy: 0 }, // untere rechte Kante, nach links
    ];
    for (const m of mids) {
      const { sx, sy } = scr(cam, m.p.x + m.dx, m.p.y + m.dy);
      for (const tool of [{ kind: 'road' }, { kind: 'select' }, { kind: 'demolish' }] as const)
        expect(targetTile(world, cam, tool, sx, sy)).toEqual({ x: tx, y: ty });
      expect(targetTile(world, cam, { kind: 'build', defId: 'house' }, sx, sy)).toEqual({
        x: tx,
        y: ty,
      });
    }
  });

  it('AK-ISO-14 Vorstufe: Auswählen über das Dach über der Kachel dahinter → Ursprung des Gebäudes', () => {
    const { world, o } = buildWorld();
    const b = place(world, 'market', o.x + 2, o.y + 2);
    const cam = camAt(o.x + 2, o.y + 2, zoom);
    const h = bodyHeight(BUILDING_DEFS.market, b);
    const top = project(b.x, b.y);
    const { sx, sy } = scr(cam, top.x, top.y - h / 2); // im Dach, über der oberen Footprint-Ecke
    const ground = screenToTile(cam, sx, sy);
    // Die Bodenkachel unter dem Cursor liegt hinter dem Gebäude, nicht in seinem Footprint
    expect(ground.x < b.x || ground.y < b.y).toBe(true);
    expect(targetTile(world, cam, { kind: 'select' }, sx, sy)).toEqual({ x: b.x, y: b.y });
    expect(targetTile(world, cam, { kind: 'demolish' }, sx, sy)).toEqual({ x: b.x, y: b.y });
  });

  it('AK-ISO-14 Vorstufe Negativfall: Abreissen in der leeren Box-Ecke über einem Weg → die Wegkachel', () => {
    const { world, o } = buildWorld();
    const b = place(world, 'market', o.x + 2, o.y + 2);
    const cam = camAt(o.x + 2, o.y + 2, zoom);
    const def = BUILDING_DEFS.market;
    const h = bodyHeight(def, b);
    const left = project(b.x, b.y + def.h);
    const top = project(b.x, b.y);
    // Ecke oben links der Bildbox: ausserhalb der Körperhülle
    const wx = left.x + 3,
      wy = top.y - h + 3;
    expect(pickBuilding(buildingHulls(world), wx, wy)).toBeNull();
    const { sx, sy } = scr(cam, wx, wy);
    const g = screenToTile(cam, sx, sy);
    home(world).tiles[g.y * home(world).width + g.x]!.road = true;
    expect(targetTile(world, cam, { kind: 'demolish' }, sx, sy)).toEqual(g);
  });

  it('AK-ISO-14 Vorstufe: Auswählen ohne Treffer liefert die Bodenkachel', () => {
    const { world, o } = buildWorld();
    place(world, 'market', o.x + 2, o.y + 2);
    const cam = camAt(o.x + 2, o.y + 2, zoom);
    const { sx, sy } = scrT(cam, o.x + 0.5, o.y + 0.5);
    expect(targetTile(world, cam, { kind: 'select' }, sx, sy)).toEqual({ x: o.x, y: o.y });
  });

  it('AK-ISO-14 Vorstufe: ausserhalb der Kartenraute → null (Bauen, Weg, Auswählen ohne Treffer)', () => {
    const { world, o } = buildWorld();
    const cam = camAt(o.x + 2, o.y + 2, zoom);
    for (const [fx, fy] of [
      [-3.5, 2.5],
      [2.5, -3.5],
      [home(world).width + 2.5, 5.5],
      [5.5, home(world).height + 2.5],
    ] as const) {
      const { sx, sy } = scrT(cam, fx, fy);
      expect(targetTile(world, cam, { kind: 'build', defId: 'house' }, sx, sy)).toBeNull();
      expect(targetTile(world, cam, { kind: 'build', defId: 'market' }, sx, sy)).toBeNull();
      expect(targetTile(world, cam, { kind: 'road' }, sx, sy)).toBeNull();
      expect(targetTile(world, cam, { kind: 'select' }, sx, sy)).toBeNull();
      expect(targetTile(world, cam, { kind: 'demolish' }, sx, sy)).toBeNull();
    }
  });

  it('AK-ISO-14 Vorstufe: Weg ziehen nutzt immer die Bodenkachel, auch über einem Dach', () => {
    const { world, o } = buildWorld();
    const b = place(world, 'market', o.x + 2, o.y + 2);
    const cam = camAt(o.x + 2, o.y + 2, zoom);
    const h = bodyHeight(BUILDING_DEFS.market, b);
    const top = project(b.x, b.y);
    const { sx, sy } = scr(cam, top.x, top.y - h / 2);
    expect(pickBuilding(buildingHulls(world), top.x, top.y - h / 2)).toBe(b.id);
    expect(targetTile(world, cam, { kind: 'road' }, sx, sy)).toEqual(screenToTile(cam, sx, sy));
  });
});
