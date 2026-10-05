import { beforeAll, describe, expect, it } from 'vitest';
import { centerOn, type Camera, type TileRange } from '../../src/render/camera';
import {
  ERRAND_ID_BASE,
  FAST_TICK_MS,
  MAX_ERRANDS,
  PLAN_CACHE_MAX,
  drawErrandLoad,
  errandCap,
  errandPlan,
  errandPose,
  errandsFrom,
  planCacheSize,
  pointAlong,
  tickClock,
  walkersLeft,
} from '../../src/render/errands';
import { roadGraph } from '../../src/render/life';
import { CAPS } from '../../src/render/limits';
import { PALETTE, SIGNAL_NAMES } from '../../src/render/palette';
import { render, renderStats } from '../../src/render/renderer';
import { resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { TICK_MS } from '../../src/sim/defs/timing';
import { home, createWorld, idx } from '../../src/sim/world';
import type { Building, BuildingDefId, BuildingState, Terrain, World } from '../../src/sim/types';
import { fakeCtx } from './fakeCtx';

const VIEW = { w: 1280, h: 720 };
const FULL: TileRange = { x0: 0, y0: 0, x1: 63, y1: 63 };
const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;
const CLOCK = { frac: 0, fast: false };

beforeAll(() => {
  setCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetTreeCache();
});

const setTerrain = (w: World, x: number, y: number, t: Terrain): void => {
  home(w).tiles[idx(home(w), x, y)]!.terrain = t;
};
const put = (
  w: World,
  id: number,
  defId: BuildingDefId,
  x: number,
  y: number,
  o: Partial<Building> = {},
): Building => {
  const b: Building = { id, defId, x, y, connected: true, progress: 0, state: 'ok', ...o };
  w.buildings[id] = b;
  const d = BUILDING_DEFS[defId];
  for (let dy = 0; dy < d.h; dy++)
    for (let dx = 0; dx < d.w; dx++) home(w).tiles[idx(home(w), x + dx, y + dy)]!.buildingId = id;
  return b;
};

/** Wiese 30..60 × 30..50; Holzfäller (40,40), Wald rechts davon, Weg y = 40 von x = 41 bis 49, Markt (50,40). */
function scene(opts: { road?: boolean; state?: BuildingState } = {}): {
  world: World;
  lj: Building;
} {
  const world = createWorld(3);
  for (let y = 30; y <= 50; y++) for (let x = 30; x <= 60; x++) setTerrain(world, x, y, 'grass');
  const lj = put(world, 2001, 'lumberjack', 40, 40, { state: opts.state ?? 'ok' });
  for (const [x, y] of [
    [40, 38],
    [41, 38],
    [40, 37],
  ] as const)
    setTerrain(world, x, y, 'forest');
  put(world, 2002, 'market', 50, 40);
  if (opts.road !== false)
    for (let x = 41; x <= 49; x++) home(world).tiles[idx(home(world), x, 40)]!.road = true;
  return { world, lj };
}
const camAt = (world: World, zoom = 1): Camera => {
  const cam = { x: 0, y: 0, zoom };
  centerOn(cam, 44, 40, VIEW, { w: home(world).width, h: home(world).height });
  return cam;
};
const deepFreeze = <T>(o: T): T => {
  if (o && typeof o === 'object') {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
};

describe('H-R4 pointAlong', () => {
  const path = [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
  ];
  it('RF-1 Anfang, Mitte (nach Länge), Ende und Klemmen', () => {
    expect(pointAlong(path, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAlong(path, 0.5)).toEqual({ x: 2, y: 0 });
    expect(pointAlong(path, 0.75)).toEqual({ x: 2, y: 1 });
    expect(pointAlong(path, 1)).toEqual({ x: 2, y: 2 });
    expect(pointAlong(path, -3)).toEqual({ x: 0, y: 0 });
    expect(pointAlong(path, 9)).toEqual({ x: 2, y: 2 });
    expect(pointAlong(path, NaN)).toEqual({ x: 0, y: 0 });
  });
  it('RF-1 ein Punkt oder leerer Pfad', () => {
    expect(pointAlong([{ x: 1, y: 1 }], 0.5)).toEqual({ x: 1, y: 1 });
    expect(pointAlong([], 0.5)).toBeNull();
  });
});

describe('H-R4 errandPlan', () => {
  it('RF-2 Sammler: Ziel ist eine Waldkachel im Radius, Start auf dem Gebäuderand, Welt unverändert', () => {
    const { world, lj } = scene();
    const before = JSON.stringify(world);
    deepFreeze(world);
    const plan = errandPlan(world, lj);
    expect(plan.gather).not.toBeNull();
    const [from, to] = plan.gather!;
    expect(to!.x).toBeGreaterThan(36);
    const t = home(world).tiles[idx(home(world), Math.floor(to!.x), Math.floor(to!.y))]!;
    expect(t.terrain).toBe('forest');
    expect(Math.hypot(to!.x - 40.5, to!.y - 40.5)).toBeLessThanOrEqual(
      BUILDING_DEFS.lumberjack.site[0]!.kind === 'radius' ? 3.5 : 3,
    );
    expect(from!.x).toBeGreaterThanOrEqual(40);
    expect(from!.x).toBeLessThanOrEqual(41);
    expect(from!.y).toBeGreaterThanOrEqual(40);
    expect(from!.y).toBeLessThanOrEqual(41);
    expect(JSON.stringify(world)).toBe(before);
  });
  it('RF-2 Fischer: Ziel ist Land mit Wasser-Nachbar, nie Wasser', () => {
    const { world } = scene();
    for (let x = 30; x <= 60; x++) setTerrain(world, x, 46, 'water');
    const f = put(world, 2010, 'fisher', 45, 45);
    const [, to] = errandPlan(world, f).gather!;
    const tx = Math.floor(to!.x),
      ty = Math.floor(to!.y);
    expect(home(world).tiles[idx(home(world), tx, ty)]!.terrain).not.toBe('water');
    expect([
      home(world).tiles[idx(home(world), tx, ty + 1)]!.terrain,
      home(world).tiles[idx(home(world), tx, ty - 1)]!.terrain,
      home(world).tiles[idx(home(world), tx + 1, ty)]!.terrain,
      home(world).tiles[idx(home(world), tx - 1, ty)]!.terrain,
    ]).toContain('water');
  });
  it('RF-2 ohne passende Zielkachel kein Sammelweg; Betriebe ohne Standortregel (Weber) sammeln nie', () => {
    const { world } = scene();
    const w = put(world, 2020, 'weaver', 35, 35);
    expect(errandPlan(world, w).gather).toBeNull();
    const far = createWorld(3);
    for (let y = 30; y <= 40; y++) for (let x = 30; x <= 40; x++) setTerrain(far, x, y, 'grass');
    const lj = put(far, 2030, 'lumberjack', 35, 35);
    expect(errandPlan(far, lj).gather).toBeNull();
  });
  it('RF-11 Wasser auf der Sammellinie: kein Sammelweg und keine Figur; ohne Wasser wie bisher', () => {
    const dry = scene();
    dry.lj.progress = 15;
    expect(errandPlan(dry.world, dry.lj).gather).not.toBeNull();
    expect(errandsFrom(dry.world, FULL, CLOCK, false).length).toBe(1);
    const wet = scene();
    wet.lj.progress = 15;
    setTerrain(wet.world, 40, 39, 'water');
    setTerrain(wet.world, 41, 39, 'water');
    expect(errandPlan(wet.world, wet.lj).gather).toBeNull();
    expect(errandsFrom(wet.world, FULL, CLOCK, false)).toEqual([]);
    expect(errandPose(wet.world, wet.lj, 0.15)).toBeNull(); // Hin- und Rückweg: dieselbe Linie
    expect(errandPose(wet.world, wet.lj, 0.55)).toBeNull();
  });
  it('RF-11 Träger läuft weiter, wenn nur der Sammelweg nass ist', () => {
    const { world, lj } = scene();
    setTerrain(world, 40, 39, 'water');
    setTerrain(world, 41, 39, 'water');
    expect(errandPose(world, lj, 0.875)!.load).toBe('wood');
  });
  it('RF-3 Träger: Weg folgt den Wegkacheln vom Betrieb zum Markt', () => {
    const { world, lj } = scene();
    const carry = errandPlan(world, lj).carry!;
    expect(carry).not.toBeNull();
    const mid = carry.slice(1, -1);
    expect(mid.map((p) => [Math.floor(p.x), Math.floor(p.y)])).toEqual(
      Array.from({ length: 9 }, (_, i) => [41 + i, 40]),
    );
    expect(carry[0]!.x).toBeLessThanOrEqual(41); // Rand des Betriebs
    expect(carry[carry.length - 1]!.x).toBeGreaterThanOrEqual(49.5); // Rand des Marktes
  });
  it('RF-3 ohne Wegverbindung oder bei connected false: kein Trägerweg', () => {
    const a = scene({ road: false });
    expect(errandPlan(a.world, a.lj).carry).toBeNull();
    const b = scene();
    b.lj.connected = false;
    expect(errandPlan(b.world, b.lj).carry).toBeNull();
  });
  it('RF-3 Markt, der nicht angebunden ist, zählt nicht als Ziel', () => {
    const { world, lj } = scene();
    world.buildings[2002]!.connected = false;
    expect(errandPlan(world, lj).carry).toBeNull();
  });
  it('RF-8 Cache: gleiche Welt gibt dasselbe Objekt; Layoutänderung baut neu; Obergrenze', () => {
    const { world, lj } = scene();
    const p1 = errandPlan(world, lj);
    expect(errandPlan(world, lj)).toBe(p1);
    home(world).tiles[idx(home(world), 49, 40)]!.road = false; // neues Layout
    const p2 = errandPlan(world, lj);
    expect(p2).not.toBe(p1);
    expect(p2.carry).toBeNull();
    const g = roadGraph(world);
    expect(g).toBeDefined();
    for (let i = 0; i < PLAN_CACHE_MAX + 30; i++) errandPlan(world, { ...lj, id: 5000 + i }); // fremde IDs füllen den Cache
    expect(planCacheSize(world)).toBeLessThanOrEqual(PLAN_CACHE_MAX);
  });
});

describe('H-R4 errandPose (Phase)', () => {
  it('RF-4 Phase 0 und kurz vor 1: unsichtbar (alpha 0), nie auf dem Betrieb sichtbar', () => {
    const { world, lj } = scene();
    expect(errandPose(world, lj, 0)!.alpha).toBe(0);
    const end = errandPose(world, lj, 0.9999);
    expect(end === null || end.alpha < 0.01).toBe(true);
  });
  it('RF-4 Sammler: Hinweg ohne Last, am Ziel Arbeit, Rückweg mit Last', () => {
    const { world, lj } = scene();
    const [from, to] = errandPlan(world, lj).gather!;
    const out = errandPose(world, lj, 0.15)!;
    expect(out.load).toBeNull();
    expect(out.alpha).toBe(1);
    expect(out.x).toBeCloseTo((from!.x + to!.x) / 2, 5);
    const work = errandPose(world, lj, 0.35)!;
    expect(work.x).toBeCloseTo(to!.x, 5);
    expect(work.y).toBeCloseTo(to!.y, 5);
    const back = errandPose(world, lj, 0.55)!;
    expect(back.load).toBe('wood');
    expect(back.x).toBeCloseTo((from!.x + to!.x) / 2, 5);
    expect(errandPose(world, lj, 0.72)).toBeNull(); // Lücke zwischen Sammeln und Tragen
  });
  it('RF-4 Träger: Phase 0,75 am Betrieb, 0,875 auf halber Strecke, mit Last; Id = ERRAND_ID_BASE + Betrieb', () => {
    const { world, lj } = scene();
    const carry = errandPlan(world, lj).carry!;
    const mid = errandPose(world, lj, 0.875)!;
    expect(mid.load).toBe('wood');
    expect(mid.id).toBe(ERRAND_ID_BASE + lj.id);
    expect(mid.alpha).toBe(1);
    const p = pointAlong(carry, 0.5)!;
    expect(mid.x).toBeCloseTo(p.x, 5);
    expect(mid.y).toBeCloseTo(p.y, 5);
  });
  it('RF-4 nur bei Zustand ok und angebunden', () => {
    for (const state of ['waitingInput', 'storageFull', 'notConnected', 'burning'] as const) {
      const { world, lj } = scene({ state });
      expect(errandPose(world, lj, 0.5)).toBeNull();
    }
    const { world, lj } = scene();
    lj.connected = false;
    expect(errandPose(world, lj, 0.5)).toBeNull();
  });
  it('RF-4 Betrieb ohne `produces` (Kapelle) oder ohne Zyklus: keine Figur', () => {
    const { world } = scene();
    const c = put(world, 2040, 'chapel', 35, 33);
    expect(errandPose(world, c, 0.5)).toBeNull();
  });
});

describe('H-R4 errandsFrom', () => {
  it('RF-5 Figur im Bild: Betrieb mit progress, Position folgt progress / cycle, Welt unverändert', () => {
    const { world, lj } = scene();
    lj.progress = 15; // Phase 0,5 -> Rückweg mit Last
    const before = JSON.stringify(world);
    deepFreeze(world);
    const poses = errandsFrom(world, FULL, CLOCK, false);
    expect(poses.length).toBe(1);
    expect(poses[0]!.load).toBe('wood');
    expect(JSON.stringify(world)).toBe(before);
  });
  it('RF-5 nur Betriebe im (erweiterten) Bildbereich', () => {
    const { world, lj } = scene();
    lj.progress = 15;
    expect(errandsFrom(world, { x0: 0, y0: 0, x1: 10, y1: 10 }, CLOCK, false)).toEqual([]);
  });
  it('RF-6 Obergrenze: höchstens errandCap, reduziert weniger, CAPS unverändert', () => {
    const { world } = scene();
    for (let i = 0; i < 60; i++) {
      const x = 31 + (i % 14) * 2;
      const y = [31, 34, 43, 46, 49][Math.floor(i / 14)]!;
      if (home(world).tiles[idx(home(world), x, y)]!.buildingId !== null) continue;
      put(world, 3000 + i, 'lumberjack', x, y, { progress: 15 });
      setTerrain(world, x + 1, y, 'forest');
    }
    const n = errandsFrom(world, FULL, CLOCK, false).length;
    const r = errandsFrom(world, FULL, CLOCK, true).length;
    expect(n).toBe(MAX_ERRANDS);
    expect(r).toBe(errandCap(true));
    expect(errandCap(true)).toBeLessThan(MAX_ERRANDS);
    expect(MAX_ERRANDS).toBeLessThanOrEqual(CAPS.walkers[0]);
    expect(errandCap(true)).toBeLessThanOrEqual(CAPS.walkers[1]);
    expect(CAPS.walkers).toEqual([40, 12]);
  });
  it('RF-6 Auswahl über dem Limit: gemischt nach hash2 statt nach ID-Reihenfolge, deterministisch', () => {
    const { world } = scene();
    for (let i = 0; i < 30; i++) {
      put(world, 3200 + i, 'lumberjack', 31 + i, 33, { progress: 15 });
      setTerrain(world, 31 + i, 32, 'forest');
    }
    const a = errandsFrom(world, FULL, CLOCK, false).map((p) => p.id);
    expect(a.length).toBe(MAX_ERRANDS);
    expect(errandsFrom(world, FULL, CLOCK, false).map((p) => p.id)).toEqual(a);
    const firstById = Array.from({ length: MAX_ERRANDS }, (_, i) => ERRAND_ID_BASE + 3200 + i);
    expect([...a].sort((x, y) => x - y)).not.toEqual(firstById);
  });
  it('RF-6 Tempo über 2x: deterministische Teilmenge, nie mehr als bei normalem Tempo', () => {
    const { world } = scene();
    for (let i = 0; i < 12; i++) {
      put(world, 3100 + i, 'lumberjack', 31 + i * 2, 32, { progress: 15 });
      setTerrain(world, 32 + i * 2, 32, 'forest');
    }
    const all = errandsFrom(world, FULL, CLOCK, false);
    const fast = errandsFrom(world, FULL, { frac: 0, fast: true }, false);
    expect(fast.length).toBeGreaterThan(0);
    expect(fast.length).toBeLessThan(all.length);
    expect(errandsFrom(world, FULL, { frac: 0, fast: true }, false)).toEqual(fast);
    const ids = new Set(all.map((p) => p.id));
    for (const p of fast) expect(ids.has(p.id)).toBe(true);
  });
  it('RF-5 deterministisch: gleiche Eingabe, gleiche Posen', () => {
    const { world, lj } = scene();
    lj.progress = 22;
    const a = errandsFrom(world, FULL, { frac: 0.3, fast: false }, false);
    const b = errandsFrom(world, FULL, { frac: 0.3, fast: false }, false);
    expect(b).toEqual(a);
  });
  it('RF-5 frac verschiebt die Phase stetig innerhalb des Ticks', () => {
    const { world, lj } = scene();
    lj.progress = 6;
    const a = errandsFrom(world, FULL, { frac: 0, fast: false }, false)[0]!;
    const b = errandsFrom(world, FULL, { frac: 0.5, fast: false }, false)[0]!;
    expect(b.x !== a.x || b.y !== a.y).toBe(true);
  });
});

describe('H-R4 Figurenlimit', () => {
  it('RF-6 Errands zuerst: Summe mit Spaziergängern höchstens 40, reduziert 12', () => {
    expect(walkersLeft(40, MAX_ERRANDS)).toBe(40 - MAX_ERRANDS);
    expect(MAX_ERRANDS + walkersLeft(40, MAX_ERRANDS)).toBeLessThanOrEqual(40);
    expect(walkersLeft(40, errandCap(true), true) + errandCap(true)).toBeLessThanOrEqual(12);
    expect(walkersLeft(3, 2)).toBe(3);
    expect(walkersLeft(40, 99)).toBe(0);
  });
});

describe('H-R4 tickClock', () => {
  it('RF-7 frac wächst im Tick; Tickwechsel setzt zurück', () => {
    const { world } = scene();
    world.tick = 5;
    expect(tickClock(world, 1000)).toEqual({ frac: 0, fast: false });
    expect(tickClock(world, 1050).frac).toBeCloseTo(0.5, 5);
    world.tick = 6;
    expect(tickClock(world, 1100).frac).toBe(0);
    expect(tickClock(world, 1125).frac).toBeCloseTo(0.25, 5);
  });
  it('RF-7 Pause: frac bleibt bei höchstens 1', () => {
    const { world } = scene();
    world.tick = 1;
    tickClock(world, 0);
    expect(tickClock(world, 99999).frac).toBe(1);
  });
  it('RF-7 Tempo 4x (Tick alle 25 ms) wird als schnell erkannt, 1x und 2x nicht', () => {
    const { world } = scene();
    let t = 0;
    world.tick = 0;
    tickClock(world, t);
    for (let i = 0; i < 8; i++) {
      world.tick++;
      t += TICK_MS / 2;
      expect(tickClock(world, t).fast).toBe(false); // 2x
    }
    let last = false;
    for (let i = 0; i < 8; i++) {
      world.tick++;
      t += TICK_MS / 4;
      last = tickClock(world, t).fast;
    }
    expect(last).toBe(true);
    expect(FAST_TICK_MS).toBeLessThan(TICK_MS / 2);
    expect(FAST_TICK_MS).toBeGreaterThan(TICK_MS / 4);
  });
  it('RF-7 Zeit rückwärts (neue Welt, Neustart): kein Absturz, frac in 0..1', () => {
    const { world } = scene();
    world.tick = 3;
    tickClock(world, 5000);
    const c = tickClock(world, 100);
    expect(c.frac).toBeGreaterThanOrEqual(0);
    expect(c.frac).toBeLessThanOrEqual(1);
  });
});

describe('H-R4 drawErrandLoad', () => {
  it('RF-9 Lastpunkt in Palettenfarbe, kein Signal, save/restore ausgeglichen, Matrix gleich', () => {
    const { world } = scene();
    const { ctx, log } = fakeCtx();
    drawErrandLoad(ctx, camAt(world), { id: 1, x: 40.5, y: 40.5, alpha: 1, load: 'wood' });
    expect(log.events.some((e) => e.op === 'fill')).toBe(true);
    expect(log.saves).toBe(log.restores);
    expect(log.underflow).toBe(0);
    expect(log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
    const signals = SIGNAL_NAMES.map((n) => PALETTE[n].toLowerCase());
    for (const s of [...log.fillSet, ...log.strokeSet])
      expect(signals).not.toContain(s.toLowerCase());
    expect(log.fillSet).toContain(PALETTE.roofWood);
  });
  it('RF-9 ohne Last nichts; Punkt mindestens 2,5 px gross bei Zoom 0,75', () => {
    const { world } = scene();
    const a = fakeCtx();
    drawErrandLoad(a.ctx, camAt(world), { id: 1, x: 40.5, y: 40.5, alpha: 1, load: null });
    expect(a.log.events.length).toBe(0);
    const b = fakeCtx();
    drawErrandLoad(b.ctx, camAt(world, 0.75), { id: 1, x: 40.5, y: 40.5, alpha: 1, load: 'wood' });
    const xs = b.log.allPoints.map((p) => p.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(5 - 1e-6);
  });
  it('RF-9 alpha 0: nichts gezeichnet', () => {
    const { world } = scene();
    const { ctx, log } = fakeCtx();
    drawErrandLoad(ctx, camAt(world), { id: 1, x: 40.5, y: 40.5, alpha: 0, load: 'wood' });
    expect(log.events.length).toBe(0);
  });
});

describe('H-R4 Anschluss im Renderer', () => {
  const draw = (world: World, timeMs: number, reduce = false): ReturnType<typeof fakeCtx> => {
    const f = fakeCtx();
    const cam = camAt(world);
    render(f.ctx, world, cam, layer, null, null, VIEW, { timeMs, reduceMotion: reduce });
    return f;
  };
  it('RF-10 renderStats.errands zählt die Figuren; mit Last wird der Lastpunkt gezeichnet', () => {
    const { world, lj } = scene();
    lj.progress = 15;
    world.tick = 10;
    const f = draw(world, 0);
    expect(renderStats.errands).toBe(1);
    expect(f.log.fillSet).toContain(PALETTE.roofWood);
    expect(f.log.saves).toBe(f.log.restores);
    expect(f.log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
  });
  it('RF-10 ohne Betriebe im Zustand ok: 0 Figuren', () => {
    const { world } = scene({ state: 'burning' });
    draw(world, 0);
    expect(renderStats.errands).toBe(0);
  });
});
