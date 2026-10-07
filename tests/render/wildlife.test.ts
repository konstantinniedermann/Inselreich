import { fieldWorld } from '../../src/render/terrainField';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { centerOn, visibleTileRange, type TileRange } from '../../src/render/camera';
import { phaseAt } from '../../src/render/daynight';
import { CAPS } from '../../src/render/limits';
import { ISO_H, ISO_W } from '../../src/render/iso';
import { PALETTE, SIGNAL_NAMES, rgbOfCss } from '../../src/render/palette';
import { render, type RenderFx } from '../../src/render/renderer';
import { coastField } from '../../src/render/terrainField';
import { resetTreeCache, setCanvasFactory } from '../../src/render/trees';
import {
  DOLPHIN_COLOR,
  DOLPHIN_EPISODE_MS,
  DOLPHIN_LIGHT,
  dolphinsAt,
  BIRD_COLOR,
  FISH_SHIMMER,
  WHALE_EPISODE_MS,
  WHALE_VISIBLE_MS,
  WHALE_COLOR,
  WHALE_GLOSS,
  WHALE_UNDER,
  FISH_SILVER,
  drawWaterLife,
  type WhalePose,
  type WildlifeHit,
  fishAnchors,
  flockAnchors,
  flockPose,
  whaleAt,
  wildlifeAt,
  type WildlifeEnv,
} from '../../src/render/wildlife';
import { seaClearance, seaContext } from '../../src/render/decor';
import { shipTile } from '../../src/render/ship';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { home, center, createWorld } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { deltaE2000, hexToLab, rgbToLab } from './deltaE';
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

const SIGNALS = SIGNAL_NAMES.map((n) => PALETTE[n].toLowerCase());
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
  const k = world.buildings[home(world).kontorId]!;
  const c = center(BUILDING_DEFS.kontor, k.x, k.y);
  const cam = { x: 0, y: 0, zoom };
  centerOn(cam, c.cx, c.cy, VIEW, { w: home(world).width, h: home(world).height });
  const { ctx, log } = fakeCtx();
  h.calls.length = 0;
  render(ctx, world, cam, layer, null, null, VIEW, { timeMs: 1000, ...fx });
  return log.events;
}
const kontorRange = (world: World, zoom: number): TileRange => {
  const k = world.buildings[home(world).kontorId]!;
  const c = center(BUILDING_DEFS.kontor, k.x, k.y);
  const cam = { x: 0, y: 0, zoom };
  centerOn(cam, c.cx, c.cy, VIEW, { w: home(world).width, h: home(world).height });
  return visibleTileRange(cam, VIEW, { w: home(world).width, h: home(world).height });
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
      const f = coastField(fieldWorld(world));
      const s = (x: number, y: number) => f.v[Math.floor(y) * f.w + Math.floor(x)]!;
      for (const hit of wildlifeAt(world, FULL, 5000, DAY).filter((x) => x.kind === 'fish')) {
        fish++;
        expect(-s(hit.x, hit.y)).toBeGreaterThanOrEqual(1);
        expect(-s(hit.x, hit.y)).toBeLessThan(4);
      }
      for (const a of flockAnchors(world, DAY.phase!, false)) {
        flocks++;
        expect(['forest', 'grass']).toContain(
          home(world).tiles[a.ty * home(world).width + a.tx]!.terrain,
        );
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
    expect(CAPS.fish).toEqual([20, 6]);
    expect(CAPS.whales).toEqual([1, 1]);
    expect(CAPS.flocks).toEqual([4, 2]);
    const reduce0 = true;
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      for (const reduce of [false, true]) {
        const env = { ...DAY, reduce };
        const hits = wildlifeAt(world, FULL, 7000, env);
        const n = (k: string) => hits.filter((x) => x.kind === k).length;
        expect(n('fish')).toBeLessThanOrEqual(CAPS.fish[reduce ? 1 : 0]);
        expect(n('whale')).toBeLessThanOrEqual(1);
        expect(n('birds')).toBeLessThanOrEqual(CAPS.flocks[reduce ? 1 : 0]);
      }
      // Kappe je Welt: die globale Anker-Liste hängt nicht vom Bereich ab
      expect(fishAnchors(world, reduce0).length).toBeLessThanOrEqual(CAPS.fish[1]);
      expect(fishAnchors(world, false).length).toBeLessThanOrEqual(CAPS.fish[0]);
      expect(flockAnchors(world, 'day', false).length).toBeLessThanOrEqual(CAPS.flocks[0]);
    }
  });

  it('RF-3b Kappe unabhängig vom Bereich: sich überlappende Bereiche liefern im Schnitt identische Treffer, kleiner Bereich ist Teilmenge', () => {
    const inR = (r: TileRange, x: number, y: number) =>
      x >= r.x0 && x < r.x1 + 1 && y >= r.y0 && y < r.y1 + 1;
    const key = (hit: { kind: string; x: number; y: number }) => `${hit.kind}@${hit.x},${hit.y}`;
    let compared = 0;
    for (const seed of SEEDS)
      for (const reduce of [true, false]) {
        const world = worldOf(seed);
        const env = { ...DAY, reduce };
        const a: TileRange = { x0: 0, y0: 0, x1: 40, y1: 63 };
        const b: TileRange = { x0: 24, y0: 0, x1: 63, y1: 63 };
        const cut: TileRange = { x0: 24, y0: 0, x1: 40, y1: 63 };
        const t = 9100;
        const ha = wildlifeAt(world, a, t, env).filter((x) => inR(cut, x.x, x.y));
        const hb = wildlifeAt(world, b, t, env).filter((x) => inR(cut, x.x, x.y));
        expect(JSON.stringify(ha)).toBe(JSON.stringify(hb));
        compared += ha.length;
        const full = new Set(wildlifeAt(world, FULL, t, env).map(key));
        for (const hit of wildlifeAt(world, FULL, t, env)) {
          const small: TileRange = {
            x0: Math.floor(hit.x) - 1,
            y0: Math.floor(hit.y) - 1,
            x1: Math.floor(hit.x) + 1,
            y1: Math.floor(hit.y) + 1,
          };
          const got = wildlifeAt(world, small, t, env);
          expect(got.map(key)).toContain(key(hit));
          for (const g of got) expect(full.has(key(g))).toBe(true);
        }
      }
    expect(compared).toBeGreaterThan(0);
  });

  it('RF-3c Wal ist vom Schiff unabhängig: gleiche Bahn mit und ohne Schiff, nur die Sichtbarkeit ändert sich; nie näher als 3 Kacheln', () => {
    let seen = 0;
    for (const seed of SEEDS) {
      const world = createWorld(seed);
      for (let e = 0; e < 120; e++)
        for (let t = 0; t < WHALE_EPISODE_MS; t += 1000) {
          const ms = e * WHALE_EPISODE_MS + t;
          world.order = null;
          const free = whaleAt(world, ms);
          world.order = { period: 1, good: 'wood', amount: 5, reward: 100, due: 999 };
          const ship = shipTile(world)!;
          const withShip = whaleAt(world, ms);
          if (!free) {
            expect(withShip).toBeNull();
            continue;
          }
          const near = Math.hypot(free.x - (ship.x + 0.5), free.y - (ship.y + 0.5)) < 3;
          if (near) {
            expect(withShip).toBeNull();
          } else {
            expect(withShip).toEqual(free);
            seen++;
          }
        }
    }
    expect(seen).toBeGreaterThan(0);
  });

  it('RF-3d Vogelschwarm bleibt über Land: Schwarmmitte über 200 Zeitpunkte mit s > 0', () => {
    let n = 0;
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      const f = coastField(fieldWorld(world));
      for (const a of flockAnchors(world, 'day', false))
        for (let i = 0; i < 200; i++) {
          const p = flockPose(a, seed, i * 997, false);
          expect(f.v[Math.floor(p.y) * f.w + Math.floor(p.x)]!).toBeGreaterThan(0);
          n++;
        }
    }
    expect(n).toBeGreaterThan(0);
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
    const names = {
      fish: 'Fischschwarm',
      whale: 'Wal',
      birds: 'Vogelschwarm',
      dolphins: 'Delfine',
    } as const;
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
          expect(hit.r).toBe({ fish: 0.6, whale: 1.0, birds: 1.2, dolphins: 1.5 }[hit.kind]);
          expect(hit.kind === 'birds' ? hit.z > 0 : hit.z === 0).toBe(true);
        }
    }
    expect([...kinds].sort()).toEqual(['birds', 'dolphins', 'fish', 'whale']);
  });

  it('RF-8 Wal Ablauf in 12 s: Auftauchen, Schwimmen, Abtauchen, Fluke; Fontäne nur beim Auftauchen; wildlifeAt liefert Wal in allen Phasen', () => {
    const seen = new Set<string>();
    let found = 0;
    for (const seed of SEEDS) {
      const world = createWorld(seed);
      let t0 = -1;
      for (let t = 0; t < 600000 && t0 < 0; t += 50) if (whaleAt(world, t)) t0 = t;
      if (t0 < 0) continue;
      found++;
      const at = (dt: number) => whaleAt(world, t0 + dt)!;
      expect(at(500).phase).toBe('surface');
      expect(at(1500).phase).toBe('surface');
      expect(at(4000).phase).toBe('swim');
      expect(at(9000).phase).toBe('dive');
      expect(at(11000).phase).toBe('fluke');
      expect(at(500).lift).toBeLessThan(at(1500).lift);
      expect(at(4000).lift).toBeGreaterThan(0.75);
      expect(at(8500).lift).toBeGreaterThan(at(9800).lift);
      expect(at(11000).lift).toBe(0);
      expect(at(11000).fluke).toBeGreaterThan(0);
      expect(at(4000).fluke).toBe(-1);
      expect(at(1500).spout).toBeGreaterThanOrEqual(0);
      for (let dt = 0; dt < WHALE_VISIBLE_MS; dt += 50) {
        const p = whaleAt(world, t0 + dt);
        if (!p) continue;
        seen.add(p.phase);
        if (p.spout >= 0) expect(p.phase).toBe('surface');
        const hit = wildlifeAt(world, FULL, t0 + dt, DAY).find((x) => x.kind === 'whale');
        expect(hit?.name).toBe('Wal');
      }
    }
    expect(found).toBeGreaterThan(0);
    expect([...seen].sort()).toEqual(['dive', 'fluke', 'surface', 'swim']);
  });

  it('RF-9 Wal gezeichnet: gewölbter Rücken (Buckel), Fluke steigt über den Rücken, Farben, keine Ringe, Masse', () => {
    const cam = (zoom: number) => ({ x: 0, y: 0, zoom });
    const pose = (over: Partial<WhalePose>): WildlifeHit => ({
      kind: 'whale',
      name: 'Wal',
      x: 10,
      y: 10,
      z: 0,
      r: 1,
      pose: {
        x: 10,
        y: 10,
        heading: 0.5,
        phase: 'swim',
        lift: 1,
        spout: -1,
        fluke: -1,
        fade: 1,
        swell: 0,
        curl: 0,
        ...over,
      },
    });
    const draw = (hit: WildlifeHit, zoom: number) => {
      const { ctx, log } = fakeCtx();
      drawWaterLife(ctx as unknown as CanvasRenderingContext2D, cam(zoom), [hit]);
      return log.events;
    };
    const ext = (pts: { x: number; y: number }[]) => ({
      w: Math.max(...pts.map((p) => p.x)) - Math.min(...pts.map((p) => p.x)),
      top: Math.min(...pts.map((p) => p.y)),
      bottom: Math.max(...pts.map((p) => p.y)),
    });
    for (const zoom of [0.75, 1.5]) {
      const swim = draw(pose({}), zoom);
      const bodyFill = swim.find((e) => e.op === 'fill' && e.style === WHALE_COLOR)!;
      const body = ext(bodyFill.points);
      expect(body.w).toBeGreaterThanOrEqual(1.6 * (ISO_W / 2) * zoom - 1);
      expect(body.w).toBeLessThanOrEqual(2 * (ISO_W / 2) * zoom + 1);
      expect(body.bottom - body.top).toBeGreaterThanOrEqual(0.35 * ISO_H * zoom - 0.5); // Buckel
      // Rückenfinne: lokaler Höcker hinter der Mitte (heading 0.5 blickt nach rechts, also links der Mitte)
      const top = bodyFill.points.slice(0, -2);
      const midX = (Math.min(...top.map((q) => q.x)) + Math.max(...top.map((q) => q.x))) / 2;
      const bump = top.some((q, i) => {
        if (i === 0 || i === top.length - 1 || q.x >= midX) return false;
        const a = top[i - 1]!,
          c = top[i + 1]!;
        return (a.y + c.y) / 2 - q.y >= 0.08 * ISO_H * zoom && q.y < a.y && q.y < c.y;
      });
      expect(bump).toBe(true);
      const fl = draw(pose({ phase: 'fluke', lift: 0, fluke: 1 }), zoom);
      const flukeFill = fl.find((e) => e.op === 'fill' && e.style === WHALE_COLOR)!;
      const fext = ext(flukeFill.points);
      expect(fext.top).toBeLessThan(body.top); // Spitze über dem Rücken
      expect(fext.w).toBeGreaterThanOrEqual(0.55 * ISO_W * zoom);
      expect(flukeFill.points.length).toBeGreaterThanOrEqual(8); // V mit Kerbe, gefüllt
      for (const ev of [swim, fl, draw(pose({ phase: 'surface', spout: 0.5 }), zoom)]) {
        expect(ev.filter((e) => e.op === 'stroke' && e.style === PALETTE.foam)).toHaveLength(0);
        expect(ev.filter((e) => SIGNALS.includes(e.style.toLowerCase()))).toHaveLength(0);
        expect(ev.some((e) => e.op === 'stroke' && e.style.startsWith('rgba(244,241,230'))).toBe(
          true,
        ); // Schaumrand
      }
      const spout = draw(pose({ phase: 'surface', spout: 0.5 }), zoom).filter(
        (e) => e.op === 'fill' && e.style.startsWith('rgba(244,241,230'),
      );
      expect(spout.length).toBeGreaterThanOrEqual(3);
      expect(
        draw(pose({}), zoom).filter(
          (e) => e.style.startsWith('rgba(244,241,230') && e.op === 'fill',
        ),
      ).toHaveLength(0);
    }
  });

  it('RF-11 Farbkonstanten gültig (kein verschachteltes mixHex): endlich, nicht Schwarz; Wal dunkles Blaugrau mit Glanz', () => {
    const luma = (c: string) => {
      const [r, g, b] = rgbOfCss(c);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };
    for (const c of [WHALE_COLOR, WHALE_UNDER, WHALE_GLOSS, FISH_SILVER, BIRD_COLOR]) {
      const rgb = rgbOfCss(c);
      expect(rgb.every((v) => Number.isFinite(v))).toBe(true);
      expect(rgb.join(',')).not.toBe('0,0,0');
      expect(c).not.toContain('NaN');
    }
    expect(luma(WHALE_COLOR)).toBeGreaterThanOrEqual(0.22);
    expect(luma(WHALE_COLOR)).toBeLessThanOrEqual(0.35);
    expect(luma(WHALE_UNDER)).toBeLessThan(luma(WHALE_COLOR));
    expect(luma(WHALE_GLOSS)).toBeGreaterThan(luma(WHALE_COLOR));
    const [br, bg, bb] = rgbOfCss(WHALE_COLOR);
    expect(bb).toBeGreaterThan(br); // blaugrau, nicht rötlich
    expect(
      deltaE2000(rgbToLab(rgbOfCss(WHALE_COLOR)), hexToLab(PALETTE.waterDeep)),
    ).toBeGreaterThan(8);
    expect(bg).toBeGreaterThan(0);
  });

  it('RF-10 Startansicht am Kontor (Zoom 1, 980×650) zeigt bei Tag und klar Fische und Vögel, Seeds 1 bis 40', () => {
    const view = { w: 980, h: 650 };
    const bad: number[] = [];
    for (let seed = 1; seed <= 40; seed++) {
      const world = createWorld(seed);
      const k = world.buildings[home(world).kontorId]!;
      const c = center(BUILDING_DEFS[k.defId], k.x, k.y);
      const cam = { x: 0, y: 0, zoom: 1 };
      const map = { w: home(world).width, h: home(world).height };
      centerOn(cam, c.cx, c.cy, view, map);
      const r = visibleTileRange(cam, view, map);
      for (const t of [3000, 17000, 41000, 77000]) {
        const hits = wildlifeAt(world, r, t, DAY);
        if (!hits.some((x) => x.kind === 'fish') || !hits.some((x) => x.kind === 'birds'))
          bad.push(seed * 1e6 + t);
      }
    }
    expect(bad).toEqual([]);
  });

  it('RF-7 Einbindung: Wasserleben vor Schiff und Objekten, Vögel danach und vor dem Multiply-Durchgang, keine Signalfarbe, reduceMotion weniger', () => {
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
      expect(animals.filter((e) => SIGNALS.includes(e.style.toLowerCase()))).toHaveLength(0);
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

describe('Delfine (ART-STIL-02 L7 E5)', () => {
  const SEEDS50 = Array.from({ length: 50 }, (_, i) => i + 1);
  const dolphinEpisodes = (world: World, reduce = false) => {
    const out: { t: number; pose: NonNullable<ReturnType<typeof dolphinsAt>> }[] = [];
    for (let e = 0; e < 40; e++)
      for (let dt = 0; dt < 45000; dt += 250) {
        const t = e * DOLPHIN_EPISODE_MS + dt;
        const pose = dolphinsAt(world, t, reduce);
        if (pose) out.push({ t, pose });
      }
    return out;
  };

  it('E5 Determinismus, Kappe [3, 0], Episoden: sichtbar ≤ 9 s je Episode, reduziert keine', () => {
    let groups = 0,
      withSeed = 0;
    for (const seed of SEEDS50) {
      const world = createWorld(seed);
      const a = dolphinEpisodes(world);
      expect(JSON.stringify(dolphinEpisodes(world))).toBe(JSON.stringify(a));
      if (a.length > 0) withSeed++;
      for (const { t, pose } of a) {
        groups++;
        expect(pose.dolphins.length).toBeLessThanOrEqual(CAPS.dolphins[0]);
        expect(t % DOLPHIN_EPISODE_MS).toBeLessThan(DOLPHIN_EPISODE_MS);
      }
      expect(dolphinEpisodes(world, true)).toEqual([]);
    }
    expect(CAPS.dolphins).toEqual([3, 0]);
    expect(groups).toBeGreaterThan(0);
    // S-Art: nur auf einem Teil der Inseln (Los 0,45 nach der Eignung)
    expect(withSeed).toBeGreaterThan(5);
    expect(withSeed).toBeLessThan(50);
  });

  it('E5 nie im R4-Sperrbereich (Seeds 1–50): Tiefwasser, seaClearance ≥ 0, auch Spritzringe; ≥ 3 Kacheln vom Schiff', () => {
    let checked = 0;
    for (const seed of SEEDS50) {
      const world = createWorld(seed);
      world.order = { period: 1, good: 'wood', amount: 5, reward: 100, due: 999 };
      const ctx = seaContext(world);
      const f = coastField(fieldWorld(world));
      const ship = shipTile(world);
      for (const { pose } of dolphinEpisodes(world))
        for (const p of [...pose.dolphins, ...pose.splash]) {
          checked++;
          expect(
            seaClearance(ctx, p.x, p.y, 0),
            `seed ${seed} @${p.x},${p.y}`,
          ).toBeGreaterThanOrEqual(0);
          expect(f.v[Math.floor(p.y) * f.w + Math.floor(p.x)]!).toBeLessThanOrEqual(-4);
          if (ship)
            expect(Math.hypot(p.x - (ship.x + 0.5), p.y - (ship.y + 0.5))).toBeGreaterThanOrEqual(
              3,
            );
        }
    }
    expect(checked).toBeGreaterThan(100);
  });

  it('E5 springen nacheinander in Bögen: Höhe ≤ 0,45 · ISO_H, Verlauf 0…1, mehrere Tiere zu verschiedenen Zeiten', () => {
    let jumps = 0;
    let hmax = 0;
    for (const seed of SEEDS) {
      const world = worldOf(seed);
      for (const { pose } of dolphinEpisodes(world))
        for (const d of pose.dolphins) {
          jumps++;
          hmax = Math.max(hmax, d.z);
          expect(d.t).toBeGreaterThanOrEqual(0);
          expect(d.t).toBeLessThan(1);
          expect(d.z).toBeGreaterThanOrEqual(0);
        }
    }
    expect(jumps).toBeGreaterThan(0);
    expect(hmax).toBeLessThanOrEqual(0.45 * ISO_H + 1e-9);
    expect(hmax).toBeGreaterThan(0.2 * ISO_H);
    // zwei Tiere einer Gruppe sind nie gleichzeitig am Scheitel
    for (const seed of SEEDS)
      for (const { pose } of dolphinEpisodes(worldOf(seed)))
        expect(pose.dolphins.filter((d) => d.t > 0.45 && d.t < 0.55).length).toBeLessThanOrEqual(2);
  });

  it('E5 wildlifeAt: Name „Delfine“, Radius 1,5, nicht nachts und nicht bei Sturm, erst ab Zoom 0,5, reduziert keine', () => {
    let found = 0;
    for (const seed of SEEDS50) {
      const world = createWorld(seed);
      const ep = dolphinEpisodes(world)[0];
      if (!ep) continue;
      found++;
      const at = (env: WildlifeEnv) =>
        wildlifeAt(world, FULL, ep.t, env).filter((x) => x.kind === 'dolphins');
      const hits = at({ phase: 'day', weather: 'clear' });
      expect(hits).toHaveLength(1);
      expect(hits[0]!.name).toBe('Delfine');
      expect(hits[0]!.r).toBe(1.5);
      expect(hits[0]!.z).toBe(0);
      expect(at({ phase: 'night', weather: 'clear' })).toHaveLength(0);
      expect(at({ phase: 'morning', weather: 'rain' })).toHaveLength(1);
      expect(at({ phase: 'day', weather: 'storm' })).toHaveLength(0);
      expect(at({ phase: 'day', zoom: 0.4 })).toHaveLength(0);
      expect(at({ phase: 'day', zoom: 0.5 })).toHaveLength(1);
      expect(at({ phase: 'day', reduce: true })).toHaveLength(0);
      if (found >= 6) break;
    }
    expect(found).toBeGreaterThan(0);
  });

  it('E5 Wal bleibt unverändert: dieselbe Bahn, unabhängig von den Delfinen', () => {
    // Der Wal hängt nur von Seed, Episode und Tiefwasser ab: gleiche Aufrufe, gleiche Pose (kein gemeinsamer Zustand)
    for (const seed of SEEDS) {
      const world = createWorld(seed);
      const a = JSON.stringify(
        [...Array(80).keys()].map((e) => whaleAt(world, e * WHALE_EPISODE_MS + 5000)),
      );
      dolphinEpisodes(world);
      expect(
        JSON.stringify(
          [...Array(80).keys()].map((e) => whaleAt(world, e * WHALE_EPISODE_MS + 5000)),
        ),
      ).toBe(a);
    }
  });

  it('E5 gezeichnet: Schiefer-Wasser, heller als der Wal, ΔE ≥ 20 zu den Signalfarben, keine schwarze oder weisse Linie, save/restore ausgeglichen', () => {
    const hit = {
      kind: 'dolphins',
      name: 'Delfine',
      x: 20.5,
      y: 20.5,
      z: 0,
      r: 1.5,
      pose: {
        dolphins: [0.1, 0.5, 0.9].map((t, i) => ({
          x: 20.5 + i,
          y: 20.5,
          z: 4 * t * (1 - t) * 14,
          t,
          heading: 0.4 + i,
        })),
        splash: [{ x: 20.5, y: 20.5, age: 0.4 }],
      },
    } as unknown as WildlifeHit;
    const { ctx, log } = fakeCtx();
    drawWaterLife(ctx, { x: 0, y: 0, zoom: 1.5 }, [hit]);
    expect(log.events.filter((e) => e.op === 'fill').length).toBeGreaterThan(0);
    expect(log.saves).toBe(log.restores);
    expect(log.underflow).toBe(0);
    expect(log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
    const luma = (c: string) => {
      const [r, g, b] = rgbOfCss(c);
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };
    expect(luma(DOLPHIN_COLOR)).toBeGreaterThan(luma(WHALE_COLOR));
    for (const col of [DOLPHIN_COLOR, DOLPHIN_LIGHT])
      for (const sig of SIGNAL_NAMES)
        expect(deltaE2000(rgbToLab(rgbOfCss(col)), hexToLab(PALETTE[sig]))).toBeGreaterThanOrEqual(
          20,
        );
    for (const op of ['fill', 'stroke'] as const)
      for (const style of new Set(log.events.filter((e) => e.op === op).map((e) => e.style))) {
        const c = rgbOfCss(style);
        for (const sig of SIGNAL_NAMES)
          expect(
            deltaE2000(rgbToLab(c), hexToLab(PALETTE[sig])),
            `${op} ${style}`,
          ).toBeGreaterThanOrEqual(20);
        if (op === 'stroke') {
          expect(luma(style)).toBeGreaterThanOrEqual(0.08);
          expect(c.every((v) => v >= 250)).toBe(false);
        }
      }
  });
});
