import { beforeAll, describe, expect, it, vi } from 'vitest';
import { centerOn, visibleTileRange, type TileRange } from '../../src/render/camera';
import { phaseAt } from '../../src/render/daynight';
import { CAPS } from '../../src/render/limits';
import { PALETTE, SIGNAL_NAMES } from '../../src/render/palette';
import { render, type RenderFx } from '../../src/render/renderer';
import { coastField } from '../../src/render/terrainField';
import { resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import {
  BIRD_COLOR,
  FISH_SHIMMER,
  WHALE_EPISODE_MS,
  WHALE_VISIBLE_MS,
  fishAnchors,
  flockAnchors,
  whaleAt,
  wildlifeAt,
  type WildlifeEnv,
} from '../../src/render/wildlife';
import { shipTile } from '../../src/render/ship';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { center, createWorld } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { fakeCtx, type Ev } from './fakeCtx';

const h = vi.hoisted(() => ({ calls: [] as { kind: string; at: number }[] }));
const at = (ctx: unknown): number => (ctx as { events: unknown[] }).events.length;
vi.mock('../../src/render/sprites', async (orig) => {
  const m = await orig<typeof import('../../src/render/sprites')>();
  return {
    ...m,
    drawBody: (...a: Parameters<typeof m.drawBody>) => {
      h.calls.push({ kind: 'body', at: at(a[0]) });
      return m.drawBody(...a);
    },
  };
});
vi.mock('../../src/render/ship', async (orig) => {
  const m = await orig<typeof import('../../src/render/ship')>();
  return {
    ...m,
    drawShip: (...a: Parameters<typeof m.drawShip>) => {
      h.calls.push({ kind: 'ship', at: at(a[0]) });
      return m.drawShip(...a);
    },
  };
});
vi.mock('../../src/render/terrain', async (orig) => {
  const m = await orig<typeof import('../../src/render/terrain')>();
  return {
    ...m,
    terrainScale: () => 1,
    updateTerrainLayer: () => ({ redrawn: false, ms: 0 }),
    halfLayer: (l: HTMLCanvasElement) => l,
  };
});

const VIEW = { w: 1280, h: 720 };
const layer = { width: 64 * 32, height: 64 * 32 } as unknown as HTMLCanvasElement;
const DAY: WildlifeEnv = { phase: 'day', weather: 'clear', reduce: false };
const FULL: TileRange = { x0: 0, y0: 0, x1: 63, y1: 63 };
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8];

beforeAll(() => {
  setCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetTreeCache();
});

const worlds = new Map<number, World>();
const worldOf = (seed: number): World => {
  let w = worlds.get(seed);
  if (!w) worlds.set(seed, (w = createWorld(seed)));
  return w;
};

function frame(world: World, zoom: number, fx: Partial<RenderFx>): Ev[] {
  const k = world.buildings[world.kontorId]!;
  const c = center(BUILDING_DEFS.kontor, k.x, k.y);
  const cam = { x: 0, y: 0, zoom };
  centerOn(cam, c.cx, c.cy, VIEW, { w: world.width, h: world.height });
  const { ctx, log } = fakeCtx();
  h.calls.length = 0;
  render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 1000, ...fx });
  return log.events;
}
const kontorRange = (world: World, zoom: number): TileRange => {
  const k = world.buildings[world.kontorId]!;
  const c = center(BUILDING_DEFS.kontor, k.x, k.y);
  const cam = { x: 0, y: 0, zoom };
  centerOn(cam, c.cx, c.cy, VIEW, { w: world.width, h: world.height });
  return visibleTileRange(cam, VIEW, { w: world.width, h: world.height });
};

const gullStrokes = (ev: Ev[]) =>
  ev.filter((e) => e.op === 'stroke' && e.style === PALETTE.foam && e.lineWidth === 1.5);

describe('Möwen und Wetter (Trivial-Fix H-R2)', () => {
  it('RF-1 Möwen bei clear/cloudy am Tag, bei rain und storm keine', () => {
    const world = worldOf(3);
    world.tick = 0;
    const seen = (kind: 'clear' | 'cloudy' | 'rain' | 'storm') =>
      gullStrokes(frame(world, 1, { weather: { kind, w: 0.8 } })).length;
    expect(seen('clear')).toBeGreaterThan(0);
    expect(seen('cloudy')).toBeGreaterThan(0);
    expect(seen('rain')).toBe(0);
    expect(seen('storm')).toBe(0);
  });
});

describe('Wasser- und Luftleben (H-R2)', () => {
  it('RF-1 Determinismus: gleiche Eingaben gleiche Treffer, anderer Seed anderes Bild, kein Math.random, Welt unverändert', () => {
    const world = worldOf(3);
    const before = JSON.stringify(world);
    const rnd = vi.spyOn(Math, 'random');
    const a = wildlifeAt(world, FULL, 12345, DAY);
    const b = wildlifeAt(world, FULL, 12345, DAY);
    expect(rnd).not.toHaveBeenCalled();
    rnd.mockRestore();
    expect(a.length).toBeGreaterThan(0);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(JSON.stringify(world)).toBe(before);
    const other = JSON.stringify(wildlifeAt(worldOf(4), FULL, 12345, DAY));
    expect(other).not.toBe(JSON.stringify(a));
  });

  it('RF-2 Orte: Fische nur auf 1 ≤ −s < 4, Wal nur auf −s ≥ 5, Vogelanker nur über Wald oder Wiese mit s ≥ 2', () => {
    let fish = 0,
      flocks = 0,
      whales = 0;
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      const f = coastField(world);
      const s = (x: number, y: number) => f.v[Math.floor(y) * f.w + Math.floor(x)]!;
      for (const hit of wildlifeAt(world, FULL, 5000, DAY).filter((x) => x.kind === 'fish')) {
        fish++;
        expect(-s(hit.x, hit.y)).toBeGreaterThanOrEqual(1);
        expect(-s(hit.x, hit.y)).toBeLessThan(4);
      }
      for (const a of flockAnchors(world, f, FULL, DAY.phase!, false)) {
        flocks++;
        expect(['forest', 'grass']).toContain(world.tiles[a.ty * world.width + a.tx]!.terrain);
        expect(s(a.tx, a.ty)).toBeGreaterThanOrEqual(2);
      }
      for (let e = 0; e < 60; e++)
        for (let t = 0; t < WHALE_EPISODE_MS; t += 3000) {
          const p = whaleAt(world, e * WHALE_EPISODE_MS + t);
          if (!p) continue;
          whales++;
          expect(-s(p.x, p.y)).toBeGreaterThanOrEqual(5);
        }
    }
    expect(fish).toBeGreaterThan(0);
    expect(flocks).toBeGreaterThan(0);
    expect(whales).toBeGreaterThan(0);
  });

  it('RF-3 Kappen normal und reduziert; Scrollen ändert die Anker im Überlappungsbereich nicht', () => {
    expect(CAPS.fish).toEqual([12, 4]);
    expect(CAPS.whales).toEqual([1, 1]);
    expect(CAPS.flocks).toEqual([3, 1]);
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      const f = coastField(world);
      for (const reduce of [false, true]) {
        const env = { ...DAY, reduce };
        const hits = wildlifeAt(world, FULL, 7000, env);
        const n = (k: string) => hits.filter((x) => x.kind === k).length;
        expect(n('fish')).toBeLessThanOrEqual(CAPS.fish[reduce ? 1 : 0]);
        expect(n('whale')).toBeLessThanOrEqual(1);
        expect(n('birds')).toBeLessThanOrEqual(CAPS.flocks[reduce ? 1 : 0]);
      }
      const a: TileRange = { x0: 0, y0: 0, x1: 40, y1: 63 };
      const b: TileRange = { x0: 20, y0: 0, x1: 63, y1: 63 };
      const inside = (r: TileRange, p: { x: number; y: number }) =>
        p.x >= r.x0 && p.x < r.x1 + 1 && p.y >= r.y0 && p.y < r.y1 + 1;
      const fa = fishAnchors(f, a, seed, false).filter((p) => p.tx >= 24 && p.tx <= 40);
      const fb = fishAnchors(f, b, seed, false).filter((p) => p.tx >= 24 && p.tx <= 40);
      if (fishAnchors(f, FULL, seed, false).length < CAPS.fish[0]) expect(fa).toEqual(fb);
      expect(inside(a, { x: 1, y: 1 })).toBe(true);
    }
  });

  it('RF-4 Phase und Wetter: nachts, bei Regen und Sturm keine Vögel; im Sturm keine Sprünge; Wal unabhängig', () => {
    let birdsDay = 0,
      jumps = 0;
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      const count = (env: WildlifeEnv, t: number, kind: string) =>
        wildlifeAt(world, FULL, t, env).filter((x) => x.kind === kind).length;
      birdsDay += count(DAY, 3000, 'birds');
      expect(count({ ...DAY, phase: 'night' }, 3000, 'birds')).toBe(0);
      expect(count({ ...DAY, weather: 'rain' }, 3000, 'birds')).toBe(0);
      expect(count({ ...DAY, weather: 'storm' }, 3000, 'birds')).toBe(0);
      expect(count({ ...DAY, weather: 'cloudy' }, 3000, 'birds')).toBe(count(DAY, 3000, 'birds'));
      for (let t = 0; t < 14000; t += 50) {
        for (const hit of wildlifeAt(world, FULL, t, DAY))
          if (hit.kind === 'fish' && 'jump' in hit.pose && hit.pose.jump) jumps++;
        for (const hit of wildlifeAt(world, FULL, t, { ...DAY, weather: 'storm' }))
          if (hit.kind === 'fish' && 'jump' in hit.pose) {
            expect(hit.pose.jump).toBeNull();
            expect(hit.pose.splash).toHaveLength(0);
          }
      }
      for (const t of [0, 20000, 50000, 90000, 130000]) {
        const w = (env: WildlifeEnv) => count(env, t, 'whale');
        expect(w({ phase: 'night', weather: 'storm' })).toBe(w(DAY));
      }
    }
    expect(birdsDay).toBeGreaterThan(0);
    expect(jumps).toBeGreaterThan(0);
  });

  it('RF-5 Wal: 25 bis 45 % der Episoden sichtbar, nie näher als 3 Kacheln am Schiff', () => {
    let seen = 0,
      total = 0,
      checked = 0;
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      world.order = { period: 1, good: 'wood', amount: 5, reward: 100, due: 999 };
      const ship = shipTile(world);
      expect(ship).not.toBeNull();
      for (let e = 0; e < 200; e++) {
        let any = false;
        for (let t = 0; t < WHALE_EPISODE_MS; t += 500) {
          const p = whaleAt(world, e * WHALE_EPISODE_MS + t);
          if (!p) continue;
          any = true;
          checked++;
          expect(Math.hypot(p.x - (ship!.x + 0.5), p.y - (ship!.y + 0.5))).toBeGreaterThanOrEqual(
            3,
          );
        }
        if (any) seen++;
        total++;
      }
      world.order = null;
    }
    expect(checked).toBeGreaterThan(0);
    expect(seen / total).toBeGreaterThanOrEqual(0.25);
    expect(seen / total).toBeLessThanOrEqual(0.45);
    expect(WHALE_VISIBLE_MS).toBe(12000);
  });

  it('RF-6 wildlifeAt: Namen, leerer Bereich gibt [], Treffer liegen im Bereich, wirft nicht', () => {
    const names = { fish: 'Fischschwarm', whale: 'Wal', birds: 'Vogelschwarm' } as const;
    const kinds = new Set<string>();
    const empty: TileRange = { x0: 5, y0: 5, x1: 4, y1: 4 };
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      expect(wildlifeAt(world, empty, 1000, DAY)).toEqual([]);
      expect(() =>
        wildlifeAt(world, { x0: -50, y0: -50, x1: 500, y1: 500 }, NaN, {}),
      ).not.toThrow();
      const r = FULL;
      for (let t = 0; t < 190000; t += 5000)
        for (const hit of wildlifeAt(world, r, t, DAY)) {
          kinds.add(hit.kind);
          expect(hit.name).toBe(names[hit.kind]);
          expect(hit.x).toBeGreaterThanOrEqual(r.x0);
          expect(hit.x).toBeLessThan(r.x1 + 1);
          expect(hit.y).toBeGreaterThanOrEqual(r.y0);
          expect(hit.y).toBeLessThan(r.y1 + 1);
          expect(hit.r).toBe({ fish: 0.6, whale: 1.0, birds: 1.2 }[hit.kind]);
          expect(hit.kind === 'birds' ? hit.z > 0 : hit.z === 0).toBe(true);
        }
    }
    expect([...kinds].sort()).toEqual(['birds', 'fish', 'whale']);
  });

  it('RF-7 Einbindung: Wasserleben vor Schiff und Objekten, Vögel danach und vor dem Multiply-Durchgang, keine Signalfarbe, reduceMotion weniger', () => {
    const signals = SIGNAL_NAMES.map((n) => PALETTE[n].toLowerCase());
    let done = false;
    for (const seed of SEEDS) {
      const world = createWorld(seed);
      world.tick = 4700;
      world.order = { period: 1, good: 'wood', amount: 5, reward: 100, due: 999 };
      const range = kontorRange(world, 0.5);
      const hits = wildlifeAt(world, range, 1000, { ...DAY, phase: phaseAt(4700) });
      if (!hits.some((x) => x.kind === 'fish') || !hits.some((x) => x.kind === 'birds')) continue;
      const ev = frame(world, 0.5, { dayNight: true });
      const body = h.calls.filter((c) => c.kind === 'body');
      const ship = h.calls.find((c) => c.kind === 'ship');
      expect(body.length).toBeGreaterThan(0);
      const firstBody = Math.min(...body.map((c) => c.at), ship ? ship.at : Infinity);
      const lastBody = Math.max(...body.map((c) => c.at));
      const mul = ev.findIndex((e) => e.composite === 'multiply');
      const idxOf = (pred: (e: Ev) => boolean) =>
        ev.map((e, i) => (pred(e) ? i : -1)).filter((i) => i >= 0);
      const fishIdx = idxOf((e) => e.op === 'stroke' && e.style === FISH_SHIMMER);
      const birdIdx = idxOf((e) => e.op === 'stroke' && e.style === BIRD_COLOR);
      expect(fishIdx.length).toBeGreaterThan(0);
      expect(birdIdx.length).toBeGreaterThan(0);
      expect(Math.max(...fishIdx)).toBeLessThan(firstBody);
      expect(Math.min(...birdIdx)).toBeGreaterThan(lastBody);
      expect(Math.max(...birdIdx)).toBeLessThan(mul);
      const animals = [...fishIdx, ...birdIdx].map((i) => ev[i]!);
      expect(animals.filter((e) => signals.includes(e.style.toLowerCase()))).toHaveLength(0);
      const pts = (e2: Ev[], st: string) =>
        e2
          .filter((e) => e.op === 'stroke' && e.style === st)
          .reduce((n, e) => n + e.points.length, 0);
      const red = frame(world, 0.5, { dayNight: true, reduceMotion: true });
      expect(pts(red, FISH_SHIMMER)).toBeLessThan(pts(ev, FISH_SHIMMER));
      expect(pts(red, BIRD_COLOR)).toBeLessThan(pts(ev, BIRD_COLOR));
      done = true;
      break;
    }
    expect(done).toBe(true);
  });
});
