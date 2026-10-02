import { mkdirSync, writeFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { centerOn, worldToScreen, type Camera } from '../../src/render/camera';
import {
  ISO_H,
  bodyHeight,
  bodyHull,
  buildingHulls,
  depthKey,
  pickBuilding,
  project,
  sortedObjects,
} from '../../src/render/iso';
import { PALETTE } from '../../src/render/palette';
import { render, renderStats } from '../../src/render/renderer';
import { BODY_INSET, bodyPolygons } from '../../src/render/sprites';
import {
  resetTreeCache,
  setCanvasFactory,
  treeBounds,
  type TreeItem,
} from '../../src/render/trees';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { houseDiagnosis } from '../../src/sim/queries';
import type { Building, World } from '../../src/sim/types';
import { tileAt } from '../../src/sim/world';
import { VERDECKUNG, verdeckung } from '../sim/scenarios-iso';
import { SCENARIOS } from '../sim/scenarios';
import { fakeCtx, inHull, type P } from './fakeCtx';

declare const process: { env: Record<string, string | undefined> };
const VIEW = { w: 1280, h: 800 };
const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;
let world: World;
const at = (p: { x: number; y: number }): Building => {
  const id = tileAt(world, p.x, p.y)?.buildingId;
  if (id == null) throw new Error(`kein Gebäude bei ${p.x},${p.y}`);
  return world.buildings[id]!;
};
const hullOf = (b: Building): P[] => bodyHull(BUILDING_DEFS[b.defId], b);
const key = (b: Building): number => {
  const d = BUILDING_DEFS[b.defId];
  return depthKey({ x: b.x, y: b.y, w: d.w, h: d.h });
};
const cameraOnH = (): Camera => {
  const h = at(VERDECKUNG.H);
  const cam: Camera = { x: 0, y: 0, zoom: 1 };
  centerOn(cam, h.x + 0.5, h.y + 0.5, VIEW, { w: world.width, h: world.height });
  return cam;
};
const trees = (): TreeItem[] =>
  sortedObjects(world).filter((i): i is TreeItem => i.kind === 'tree');

beforeAll(() => {
  world = verdeckung();
  setCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetTreeCache();
});

describe('Szenario verdeckung (ISO §14, §16)', () => {
  it('verdeckung: ist unter SCENARIOS eingetragen und baut dieselbe Welt', () => {
    expect(Object.keys(SCENARIOS)).toContain('verdeckung');
    expect(SCENARIOS.verdeckung!()).toEqual(verdeckung());
  });

  it('verdeckung: H und P liegen hinter F (depthKey kleiner) mit echt überlappender Bildspalte', () => {
    const F = at(VERDECKUNG.F);
    for (const o of [at(VERDECKUNG.H), at(VERDECKUNG.P)]) {
      expect(key(o)).toBeLessThan(key(F));
      const hf = hullOf(F),
        ho = hullOf(o);
      const lo = Math.max(Math.min(...hf.map((p) => p.x)), Math.min(...ho.map((p) => p.x)));
      const hi = Math.min(Math.max(...hf.map((p) => p.x)), Math.max(...ho.map((p) => p.x)));
      expect(hi - lo).toBeGreaterThanOrEqual(16);
    }
  });

  it('verdeckung: bodyHeight(F) > bodyHeight(H) und > bodyHeight(P); H hat Diagnose good, P ist nicht angebunden', () => {
    const F = at(VERDECKUNG.F),
      H = at(VERDECKUNG.H),
      P = at(VERDECKUNG.P);
    expect(F.defId).toBe('house');
    expect(F.house?.tier).toBe(3);
    expect(H.house?.tier).toBe(1);
    expect(P.defId).toBe('lumberjack');
    const d = (b: Building) => bodyHeight(BUILDING_DEFS[b.defId], b);
    expect(d(F)).toBeGreaterThan(d(H));
    expect(d(F)).toBeGreaterThan(d(P));
    expect(houseDiagnosis(world, H)[0]?.kind).toBe('good');
    expect(P.connected).toBe(false);
    expect(at(VERDECKUNG.L1).connected).toBe(true);
    expect(at(VERDECKUNG.L2).connected).toBe(true);
  });

  it('verdeckung: T-vor hat grösseren, T-hinter kleineren depthKey als L1; L2 frei stehend', () => {
    const L1 = at(VERDECKUNG.L1);
    const forest = new Set(trees().map((t) => `${t.fp.x},${t.fp.y}`));
    for (const t of VERDECKUNG.tVor) {
      expect(forest.has(`${t.x},${t.y}`)).toBe(true);
      expect(depthKey({ x: t.x, y: t.y, w: 1, h: 1 })).toBeGreaterThan(key(L1));
    }
    for (const t of VERDECKUNG.tHinter) {
      expect(forest.has(`${t.x},${t.y}`)).toBe(true);
      expect(depthKey({ x: t.x, y: t.y, w: 1, h: 1 })).toBeLessThan(key(L1));
    }
    const L2 = at(VERDECKUNG.L2);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const t = tileAt(world, L2.x + dx, L2.y + dy)!;
        expect(t.buildingId, `Nachbar ${dx},${dy}`).toBeNull();
        expect(t.terrain).not.toBe('forest');
      }
  });

  it('verdeckung: Hover-Punkt von H liegt in bodyHull(H) und höchstens in einer 3-px-Randzone der Hülle von F (nicht ≥ 3 px innen)', () => {
    const cam = cameraOnH();
    const pt = hoverPoint(cam);
    const wp = { x: pt.sx / cam.zoom + cam.x, y: pt.sy / cam.zoom + cam.y };
    expect(inHull(hullOf(at(VERDECKUNG.H)), wp.x, wp.y)).toBe(true);
    expect(inHull(hullOf(at(VERDECKUNG.F)), wp.x, wp.y, -3)).toBe(false);
  });

  it('verdeckung: Messpunkt linke Wand von L1 liegt ausserhalb aller treeBounds von T-vor und T-hinter', () => {
    const m = wallPoint(at(VERDECKUNG.L1));
    const near = trees().filter((t) =>
      [...VERDECKUNG.tVor, ...VERDECKUNG.tHinter].some((v) => v.x === t.fp.x && v.y === t.fp.y),
    );
    expect(near).toHaveLength(VERDECKUNG.tVor.length + VERDECKUNG.tHinter.length);
    for (const t of near) {
      const b = treeBounds(t);
      const out = m.x + 2 < b.x || m.x - 2 > b.x + b.w || m.y + 2 < b.y || m.y - 2 > b.y + b.h;
      expect(out, `Baum ${t.fp.x},${t.fp.y}`).toBe(true);
    }
    // gleicher Punkt am freistehenden L2 (relativ zur Kachel)
    const L1 = at(VERDECKUNG.L1),
      L2 = at(VERDECKUNG.L2);
    const a = wallPoint(L2),
      b1 = project(L1.x, L1.y),
      b2 = project(L2.x, L2.y);
    expect(a.x - b2.x).toBeCloseTo(m.x - b1.x, 9);
    expect(a.y - b2.y).toBeCloseTo(m.y - b1.y, 9);
  });

  it('AK-ISO-15 badges: Bedarfssymbol von H und roter Punkt von P stehen im letzten Frame mit Bildpunkt in der Liste', () => {
    const cam = cameraOnH();
    const { ctx, log } = fakeCtx();
    render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0, dayNight: true });
    const H = at(VERDECKUNG.H),
      P = at(VERDECKUNG.P);
    const need = renderStats.badges.find((b) => b.id === H.id)!;
    const dot = renderStats.badges.find((b) => b.id === P.id)!;
    expect(need.kind).toBe('need');
    expect(dot.kind).toBe('unconnected');
    expect([need.x, need.y]).toEqual([H.x, H.y]);
    const box = hullOf(H);
    const top = worldToScreen(cam, { x: box[0]!.x, y: Math.min(...box.map((p) => p.y)) });
    expect(need.sx).toBeCloseTo(top.x, 6);
    expect(need.sy).toBeCloseTo(top.y, 6);
    // roter Punkt: Füllung signalRed liegt am gemeldeten Mittelpunkt
    const red = log.events.find((e) => e.op === 'fill' && e.style === PALETTE.signalRed)!;
    expect(red).toBeDefined();
    expect(renderStats.badges.every((b) => b.kind === 'need' || b.kind === 'unconnected')).toBe(
      true,
    );
  });

  it('AK-ISO-15 (R2) Kapelle C steht vor H2: depthKey(H2) < depthKey(C), Bildspalte überlappt echt, C ist höher (Turm)', () => {
    const C = at(VERDECKUNG.C),
      H2 = at(VERDECKUNG.H2);
    expect(C.defId).toBe('chapel');
    expect(H2.defId).toBe('house');
    expect(H2.house?.tier).toBe(1);
    expect(key(H2)).toBeLessThan(key(C));
    const hc = hullOf(C),
      ho = hullOf(H2);
    const lo = Math.max(Math.min(...hc.map((p) => p.x)), Math.min(...ho.map((p) => p.x)));
    const hi = Math.min(Math.max(...hc.map((p) => p.x)), Math.max(...ho.map((p) => p.x)));
    expect(hi - lo).toBeGreaterThanOrEqual(16);
    const d = (b: Building) => bodyHeight(BUILDING_DEFS[b.defId], b);
    expect(d(C)).toBeGreaterThan(d(H2));
    expect(d(C)).toBeGreaterThan(2 * ISO_H); // Turmkörper
    expect(houseDiagnosis(world, H2)[0]?.kind).toBe('good');
    expect(C.connected).toBe(true); // kein roter Punkt auf der Kapelle
  });

  it('AK-ISO-15 (R2) Hover-Punkt von H2 liegt in bodyHull(H2) und höchstens in einer 3-px-Randzone der Kapellenhülle (nicht ≥ 3 px innen), im Bild', () => {
    const cam = cameraOnH();
    const C = at(VERDECKUNG.C),
      H2 = at(VERDECKUNG.H2);
    const pt = hoverPoint(cam, H2, C);
    expect(pt.sx).toBeGreaterThanOrEqual(0);
    expect(pt.sx).toBeLessThan(VIEW.w);
    expect(pt.sy).toBeGreaterThanOrEqual(0);
    expect(pt.sy).toBeLessThan(VIEW.h);
    const wp = { x: pt.sx / cam.zoom + cam.x, y: pt.sy / cam.zoom + cam.y };
    expect(inHull(hullOf(H2), wp.x, wp.y)).toBe(true);
    expect(inHull(hullOf(C), wp.x, wp.y, -3)).toBe(false);
    for (const o of [at(VERDECKUNG.F), at(VERDECKUNG.H), at(VERDECKUNG.P)])
      expect(inHull(hullOf(o), wp.x, wp.y, -3), `${o.defId} ${o.id}`).toBe(false);
  });

  it('AK-ISO-15 (R2) Bedarfssymbol von H2 steht im letzten Frame mit Bildpunkt in der Liste, C hat keinen roten Punkt', () => {
    const cam = cameraOnH();
    const { ctx } = fakeCtx();
    render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 0, dayNight: true });
    const H2 = at(VERDECKUNG.H2),
      C = at(VERDECKUNG.C);
    const need = renderStats.badges.find((b) => b.id === H2.id)!;
    expect(need.kind).toBe('need');
    const box = hullOf(H2);
    const top = worldToScreen(cam, { x: box[0]!.x, y: Math.min(...box.map((p) => p.y)) });
    expect(need.sx).toBeCloseTo(top.x, 6);
    expect(need.sy).toBeCloseTo(top.y, 6);
    expect(renderStats.badges.some((b) => b.id === C.id)).toBe(false);
  });

  it('AK-ISO-15 (R113) Auswahl über gezeichnete Silhouetten: hoverH2 wählt H2, sichtbare Wand-/Dachstellen von F und H wählen F bzw. H, Kapellenkörper die Kapelle', () => {
    const cam = cameraOnH();
    const hulls = buildingHulls(world);
    const C = at(VERDECKUNG.C),
      H2 = at(VERDECKUNG.H2);
    const pickAt = (p: P): number | null => pickBuilding(hulls, p.x, p.y);
    const hp = hoverPoint(cam, H2, C);
    expect(pickAt({ x: hp.sx / cam.zoom + cam.x, y: hp.sy / cam.zoom + cam.y })).toBe(H2.id);
    expect(pickAt(cBodyPoint(C))).toBe(C.id);
    // Stellen von F und H, die in der Hülle der Kapelle liegen, aber nicht in ihrer Silhouette
    const polysOf = (b: Building): P[][] => bodyPolygons(BUILDING_DEFS[b.defId], b);
    const inside = (polys: P[][], x: number, y: number): boolean =>
      polys.some((poly) => {
        let r = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
          const a = poly[i]!,
            b = poly[j]!;
          if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) r = !r;
        }
        return r;
      });
    const cPolys = polysOf(C);
    const frontOf = (b: Building) =>
      Object.values(world.buildings).filter((o) => o.id !== b.id && key(o) > key(b));
    for (const target of [at(VERDECKUNG.F), at(VERDECKUNG.H)]) {
      const own = polysOf(target);
      const fronts = frontOf(target).map(polysOf);
      const hull = hullOf(target);
      const xs = hull.map((q) => q.x),
        ys = hull.map((q) => q.y);
      const hits: P[] = [];
      for (let y = Math.min(...ys); y <= Math.max(...ys); y += 1)
        for (let x = Math.min(...xs); x <= Math.max(...xs); x += 1)
          if (
            inHull(hullOf(C), x, y, 2) &&
            !inside(cPolys, x, y) &&
            inside(own, x, y) &&
            !fronts.some((f) => inside(f, x, y))
          )
            hits.push({ x, y });
      expect(
        hits.length,
        `${target.defId} ${target.id}: Stellen unter der Kapellenhülle`,
      ).toBeGreaterThan(0);
      for (const q of hits) expect(pickAt(q), `${target.id} ${q.x},${q.y}`).toBe(target.id);
    }
  });

  it('verdeckung: schreibt (mit SCENARIO_OUT) verdeckung.points.json mit den Bildpunkten für QA-SLICE', () => {
    const cam = cameraOnH();
    const L1 = at(VERDECKUNG.L1),
      L2 = at(VERDECKUNG.L2),
      F = at(VERDECKUNG.F);
    const toScreen = (p: P): { sx: number; sy: number } => {
      const s = worldToScreen(cam, p);
      return { sx: s.x, sy: s.y };
    };
    const points = {
      view: VIEW,
      zoom: 1,
      center: { x: at(VERDECKUNG.H).x, y: at(VERDECKUNG.H).y },
      hoverH: hoverPoint(cam),
      wallL1: toScreen(wallPoint(L1)),
      wallL2: toScreen(wallPoint(L2)),
      hoverH2: hoverPoint(cam, at(VERDECKUNG.H2), at(VERDECKUNG.C)),
      bodyC: toScreen(cBodyPoint(at(VERDECKUNG.C))),
      bodyF: toScreen(fBodyPoint(F)),
    };
    for (const p of [
      points.hoverH,
      points.hoverH2,
      points.wallL1,
      points.wallL2,
      points.bodyC,
      points.bodyF,
    ]) {
      expect(p.sx).toBeGreaterThanOrEqual(0);
      expect(p.sx).toBeLessThan(VIEW.w);
      expect(p.sy).toBeGreaterThanOrEqual(0);
      expect(p.sy).toBeLessThan(VIEW.h);
    }
    // Stelle 1: der F-Punkt liegt in der Bildspalte von H und in F's Hülle
    const hx = hullOf(at(VERDECKUNG.H)).map((p) => p.x);
    const fp = fBodyPoint(F);
    expect(fp.x).toBeGreaterThan(Math.min(...hx));
    expect(fp.x).toBeLessThan(Math.max(...hx));
    expect(inHull(hullOf(F), fp.x, fp.y)).toBe(true);
    // Stelle 1 mit Turm: der C-Punkt liegt in der Bildspalte von H2 und in C's Hülle
    const hx2 = hullOf(at(VERDECKUNG.H2)).map((p) => p.x);
    const cp = cBodyPoint(at(VERDECKUNG.C));
    expect(cp.x).toBeGreaterThan(Math.min(...hx2));
    expect(cp.x).toBeLessThan(Math.max(...hx2));
    expect(inHull(hullOf(at(VERDECKUNG.C)), cp.x, cp.y)).toBe(true);
    const out = process.env.SCENARIO_OUT;
    if (out) {
      mkdirSync(out, { recursive: true });
      writeFileSync(`${out}/verdeckung.points.json`, JSON.stringify(points, null, 2));
    }
  });
});

/**
 * Erster Treffer von oben: Punkt in der Hülle von `target`, der höchstens in einer 3-px-Randzone der Hülle von `front`
 * liegt. `inHull(hf, x, y, -3)` mit negativer Toleranz heisst „≥ 3 px innerhalb", das Ergebnis `false` also „ausserhalb
 * oder in den äussersten 3 px" (1-px-Abtastung); der Punkt kann den Rand von `front` berühren, ist aber nie tief darin.
 */
function hoverPoint(
  cam: Camera,
  target: Building = at(VERDECKUNG.H),
  front: Building = at(VERDECKUNG.F),
): { sx: number; sy: number } {
  const hh = hullOf(target),
    hf = hullOf(front);
  const x0 = Math.floor(Math.min(...hh.map((p) => p.x))),
    x1 = Math.ceil(Math.max(...hh.map((p) => p.x)));
  const y0 = Math.floor(Math.min(...hh.map((p) => p.y))),
    y1 = Math.ceil(Math.max(...hh.map((p) => p.y)));
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++)
      if (inHull(hh, x, y) && !inHull(hf, x, y, -3)) {
        const s = worldToScreen(cam, { x, y });
        return { sx: s.x, sy: s.y };
      }
  throw new Error(`kein sichtbarer Punkt von ${target.defId} ${target.id}`);
}

/** Mitte der linken Wand, so tief wie nötig, damit 3 × 3 px frei von allen Baumboxen bleiben (Weltpixel). */
function wallPoint(b: Building): P {
  const near = trees().filter((t) =>
    [...VERDECKUNG.tVor, ...VERDECKUNG.tHinter].some((v) => v.x === t.fp.x && v.y === t.fp.y),
  );
  const base = project(b.x + 0.5, b.y + 1 - BODY_INSET); // Mitte der linken Wand am Boden
  for (let z = 3; z < 0.8 * ISO_H; z += 0.5) {
    const p = { x: base.x, y: base.y - z };
    const free = near.every((t) => {
      const bb = treeBounds(t);
      return p.x + 2 < bb.x || p.x - 2 > bb.x + bb.w || p.y + 2 < bb.y || p.y - 2 > bb.y + bb.h;
    });
    if (free) return p;
  }
  throw new Error('kein freier Wandpunkt');
}

/** Punkt in F's rechter Wand (Stelle 1 von AK-ISO-16), Weltpixel. */
function fBodyPoint(f: Building): P {
  const base = project(f.x + 1 - BODY_INSET, f.y + 0.5); // rechte Wand
  return { x: base.x, y: base.y - 0.3 * ISO_H };
}

/** Punkt in der rechten Wand der Kapelle (Stelle 1 von AK-ISO-16 mit Turm), Weltpixel, in H2's Bildspalte. */
function cBodyPoint(c: Building): P {
  const base = project(c.x + 2 - BODY_INSET, c.y + 0.9); // rechte Wand des Schiffs
  return { x: base.x, y: base.y - 0.3 * ISO_H };
}
