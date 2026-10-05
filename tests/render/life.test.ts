import { describe, expect, it } from 'vitest';
import { lightAt } from '../../src/render/daynight';
import { ISO_H, pointBounds } from '../../src/render/iso';
import {
  CLOTHES,
  EPISODE_MS,
  EPISODE_SEGMENTS,
  GULL_CELL,
  FADE_MS,
  HEARTH_PUFFS,
  SEG_MS,
  WALKER_H,
  WALK_SPEED,
  clothesOf,
  drawGull,
  drawHearthSmoke,
  drawWalker,
  gullAnchors,
  gullPose,
  gullShadow,
  hearthSmoke,
  roadGraph,
  totalInhabitants,
  walkerAt,
  walkerCount,
  walkerShadow,
} from '../../src/render/life';
import { CAPS } from '../../src/render/limits';
import { PALETTE, SIGNAL_NAMES } from '../../src/render/palette';
import { coastField } from '../../src/render/terrainField';
import { home, createWorld, idx } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { fakeCtx } from './fakeCtx';

/** Welt mit einem Weg-Kreuz und einer Schleife; liefert die Wegkacheln. */
function worldWithRoads(): { world: World; roads: Set<number> } {
  const world = createWorld(3);
  const k = world.buildings[home(world).kontorId]!;
  const roads = new Set<number>();
  const put = (x: number, y: number): void => {
    const i = idx(home(world), x, y);
    home(world).tiles[i]!.road = true;
    roads.add(i);
  };
  for (let d = 0; d < 8; d++) {
    put(k.x + 3 + d, k.y + 6);
    put(k.x + 6, k.y + 3 + d);
  }
  put(k.x + 3, k.y + 5); // Sackgasse
  return { world, roads };
}
const onOrBetween = (world: World, roads: Set<number>, x: number, y: number): boolean => {
  const tx = Math.floor(x),
    ty = Math.floor(y);
  if (roads.has(idx(home(world), tx, ty))) return true;
  // zwischen zwei Mitten: eine Koordinate ist Kachelmitte, die andere liegt auf einer Wegkachel-Kante
  const near = (v: number): number[] =>
    Math.abs(v - Math.round(v - 0.5) - 0.5) < 1e-9
      ? [Math.floor(v)]
      : [Math.floor(v - 0.5), Math.floor(v + 0.5)];
  return near(x).every((a) => near(y).every((b) => roads.has(idx(home(world), a, b))));
};

describe('Spaziergänger (Spec 5.6)', () => {
  it('AK-R4-02 Anzahl nach Bevölkerung', () => {
    expect(walkerCount(0)).toBe(0);
    expect(walkerCount(3)).toBe(0);
    expect(walkerCount(40)).toBe(10);
    expect(walkerCount(400)).toBe(40);
    expect(walkerCount(400, true)).toBe(12);
    expect(walkerCount(NaN)).toBe(0);
    expect(walkerCount(-5)).toBe(0);
    expect(walkerCount(1e9)).toBe(CAPS.walkers[0]);
  });

  it('AK-R4-02 totalInhabitants summiert nur Häuser und schreibt nichts', () => {
    const { world } = worldWithRoads();
    const snap = JSON.stringify(world);
    expect(totalInhabitants(world)).toBe(0);
    expect(JSON.stringify(world)).toBe(snap);
  });

  it('AK-R4-01 walkerAt deterministisch, auf oder zwischen Wegkacheln, ohne Weg keine Figur', () => {
    const { world, roads } = worldWithRoads();
    const g = roadGraph(world);
    expect(g.nodes.length).toBe(roads.size);
    for (let i = 0; i < 40; i++)
      for (const t of [0, 1234, 99999, 5.5e6]) {
        const p = walkerAt(g, i, t, 3)!;
        expect(walkerAt(g, i, t, 3)).toEqual(p);
        expect(onOrBetween(world, roads, p.x, p.y), `${i} ${t} ${p.x},${p.y}`).toBe(true);
      }
    expect(walkerAt(roadGraph(createWorld(3)), 0, 0, 3)).toBeNull();
  });

  it('AK-R4-01 Weggraph: Cache je Welt, neu bei neuem Weg', () => {
    const { world } = worldWithRoads();
    const g = roadGraph(world);
    expect(roadGraph(world)).toBe(g);
    const k = world.buildings[home(world).kontorId]!;
    home(world).tiles[idx(home(world), k.x + 9, k.y + 7)]!.road = true;
    const g2 = roadGraph(world);
    expect(g2).not.toBe(g);
    expect(g2.nodes.length).toBe(g.nodes.length + 1);
  });

  it('AK-R4-01 keine Umkehr ausser in der Sackgasse', () => {
    const { world } = worldWithRoads();
    const g = roadGraph(world);
    const w = g.width;
    for (let i = 0; i < 10; i++) {
      let prevTile = -1,
        prevPrev = -1;
      for (let s = 0; s < EPISODE_SEGMENTS; s++) {
        // Anfang des Segments s der Episode 0: die Figur steht (fast) auf der Mitte ihrer Kachel
        const p = walkerAt(g, i, s * SEG_MS + 1, 3)!;
        const tile = Math.floor(p.y) * w + Math.floor(p.x);
        if (tile !== prevTile) {
          if (tile === prevPrev) {
            const options = g.nbrs.get(prevTile)!;
            expect(options.length, 'Umkehr nur in der Sackgasse').toBe(1);
          }
          prevPrev = prevTile;
          prevTile = tile;
        }
      }
    }
  });

  it('AK-R4-07 höchstens 32 Segmentschritte bei 0, 1 h und 100 h; stetig innerhalb der Episode', () => {
    const { world } = worldWithRoads();
    const g = roadGraph(world);
    for (const t of [0, 3.6e6, 3.6e8, EPISODE_MS - 1, EPISODE_MS * 7 + 12345]) {
      const stats = { steps: 0 };
      walkerAt(g, 5, t, 3, stats);
      expect(stats.steps).toBeLessThanOrEqual(32);
      expect(stats.steps).toBeGreaterThan(0);
    }
    for (const t0 of [1000, 20000, EPISODE_MS * 3 + 777]) {
      const a = walkerAt(g, 5, t0, 3)!,
        b = walkerAt(g, 5, t0 + 16, 3)!;
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThanOrEqual(0.05);
    }
    expect(WALK_SPEED).toBe(1.2);
  });

  it('AK-R4-07 40 Figuren je Frame rechnen höchstens 40 · 32 Schritte (unabhängig von timeMs)', () => {
    const { world } = worldWithRoads();
    const g = roadGraph(world);
    for (const t of [0, 3.6e8]) {
      const stats = { steps: 0 };
      for (let i = 0; i < 40; i++) walkerAt(g, i, t, 3, stats);
      expect(stats.steps).toBeLessThanOrEqual(40 * EPISODE_SEGMENTS);
    }
  });

  it('Spec 5.6 Episodensprung wird ausgeblendet: alpha 0 am Rand, 1 in der Mitte, stetig', () => {
    const { world } = worldWithRoads();
    const g = roadGraph(world);
    expect(walkerAt(g, 1, 0, 3)!.alpha).toBe(0);
    expect(walkerAt(g, 1, EPISODE_MS * 4, 3)!.alpha).toBe(0);
    expect(walkerAt(g, 1, FADE_MS, 3)!.alpha).toBe(1);
    expect(walkerAt(g, 1, EPISODE_MS / 2, 3)!.alpha).toBe(1);
    expect(walkerAt(g, 1, EPISODE_MS - FADE_MS / 2, 3)!.alpha).toBeCloseTo(0.5, 6);
    for (let t = 0; t < 2 * EPISODE_MS; t += 37) {
      const a = walkerAt(g, 1, t, 3)!.alpha;
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
    }
  });

  it('Spec 5.6 Figur: Kleider aus der Palette ohne Signalfarbe; zeichnet in save/restore und in pointBounds (AK-ISO-10 optional)', () => {
    const signals = SIGNAL_NAMES.map((n) => PALETTE[n]);
    for (const c of CLOTHES) {
      expect(Object.values(PALETTE)).toContain(c);
      expect(signals).not.toContain(c);
    }
    const seen = new Set<string>();
    for (let i = 0; i < 60; i++) seen.add(clothesOf(3, i));
    expect(seen.size).toBe(4);
    for (const zoom of [0.5, 1, 2])
      for (const [x, y] of [
        [10.5, 10.5],
        [10.5, 11],
        [20.2, 7.5],
      ] as const) {
        const { ctx, log } = fakeCtx();
        const cam = { x: 0, y: 0, zoom };
        drawWalker(ctx, cam, { x, y, alpha: 0.5 }, CLOTHES[0]!);
        expect(log.saves).toBe(log.restores);
        expect(log.globalAlpha).toBe(1);
        expect(log.alphaSet).toContain(0.5);
        const box = pointBounds(x, y, WALKER_H);
        for (const p of log.allPoints) {
          expect(p.x / zoom).toBeGreaterThanOrEqual(box.x - 1e-6);
          expect(p.x / zoom).toBeLessThanOrEqual(box.x + box.w + 1e-6);
          expect(p.y / zoom).toBeGreaterThanOrEqual(box.y - 1e-6);
          expect(p.y / zoom).toBeLessThanOrEqual(box.y + box.h + 1e-6);
        }
      }
  });

  it('RF-6b walkerShadow: Polygon im Kachelraum, gleiche Orientierung wie die übrigen Schatten, rechts unten versetzt', () => {
    const poly = walkerShadow({ x: 10.5, y: 10.5 });
    const area =
      poly.reduce(
        (s, p, i) =>
          s + (p.x * poly[(i + 1) % poly.length]!.y - poly[(i + 1) % poly.length]!.x * p.y),
        0,
      ) / 2;
    expect(area).toBeGreaterThan(0);
    const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length,
      cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
    expect(cx).toBeGreaterThan(10.5);
    expect(cy).toBeGreaterThan(10.5);
  });
});

describe('Möwen und Herdrauch (Spec 5.6)', () => {
  const world = createWorld(7);
  const field = coastField(world);
  const full = { x0: 0, y0: 0, x1: home(world).width - 1, y1: home(world).height - 1 };

  it('AK-R4-03 Herdrauch nur Morgen/Abend und nur bewohnt', () => {
    expect(hearthSmoke('morning', 3)).toBe(true);
    expect(hearthSmoke('evening', 1)).toBe(true);
    expect(hearthSmoke('day', 3)).toBe(false);
    expect(hearthSmoke('night', 3)).toBe(false);
    expect(hearthSmoke('evening', 0)).toBe(false);
    expect(hearthSmoke('morning', 0)).toBe(false);
  });

  it('AK-R4-03 Möwen nur über Wasser mit −s < 2, höchstens CAP_GULLS, nie nachts', () => {
    for (const reduce of [false, true]) {
      const a = gullAnchors(field, full, 3, 'day', reduce);
      expect(a.length).toBeGreaterThan(0);
      expect(a.length).toBeLessThanOrEqual(CAPS.gulls[reduce ? 1 : 0]);
      for (const g of a) {
        const s = field.v[g.ty * field.w + g.tx]!;
        expect(s).toBeLessThan(0);
        expect(-s).toBeLessThan(2);
      }
    }
    expect(gullAnchors(field, full, 3, 'night', false)).toEqual([]);
    for (const ph of ['morning', 'day', 'evening'] as const)
      expect(gullAnchors(field, full, 3, ph, false).length).toBeGreaterThan(0);
  });

  it('AK-R4-03 Möwen: deterministisch, je Zelle 8×8 höchstens eine, nach Schlüssel sortiert; leerer Bereich keine', () => {
    const range = { x0: 5, y0: 5, x1: 40, y1: 40 };
    const a = gullAnchors(field, range, 3, 'day', false);
    expect(gullAnchors(field, range, 3, 'day', false)).toEqual(a);
    const cells = new Set(
      a.map((g) => `${Math.floor(g.tx / GULL_CELL)},${Math.floor(g.ty / GULL_CELL)}`),
    );
    expect(cells.size).toBe(a.length);
    for (let i = 1; i < a.length; i++) expect(a[i]!.key).toBeGreaterThanOrEqual(a[i - 1]!.key);
    expect(gullAnchors(field, { x0: 5, y0: 5, x1: 4, y1: 4 }, 3, 'day', false)).toEqual([]);
    expect(gullAnchors(field, { x0: -50, y0: -50, x1: -40, y1: -40 }, 3, 'day', false)).toEqual([]);
  });

  it('AK-R4-03 (R114) Kamera um wenige Kacheln verschieben ändert die Möwen im inneren Bildbereich nicht', () => {
    for (const seed of [3, 7, 11]) {
      const w = createWorld(seed);
      const f = coastField(w);
      const inner = { x0: 20, y0: 20, x1: 44, y1: 44 };
      const inInner = (g: { tx: number; ty: number }): boolean =>
        g.tx >= inner.x0 && g.tx <= inner.x1 && g.ty >= inner.y0 && g.ty <= inner.y1;
      const base = gullAnchors(f, { x0: 10, y0: 10, x1: 54, y1: 54 }, seed, 'day', false).filter(
        inInner,
      );
      for (const dx of [-5, -3, -1, 0, 1, 2, 3, 5])
        for (const dy of [-5, -2, 0, 1, 3, 5]) {
          const moved = gullAnchors(
            f,
            { x0: 10 + dx, y0: 10 + dy, x1: 54 + dx, y1: 54 + dy },
            seed,
            'day',
            false,
          ).filter(inInner);
          expect(moved, `Seed ${seed} Verschiebung ${dx},${dy}`).toEqual(base);
        }
    }
  });

  it('Spec 5.6 gullPose: Bahn um den Anker, Flügelschlag −1…1, Schatten rechts unten; Zeichnen ausgeglichen', () => {
    const anchor = gullAnchors(field, full, 3, 'day', false)[0]!;
    for (let t = 0; t < 40000; t += 777) {
      const p = gullPose(anchor, 3, t);
      expect(Math.hypot(p.x - anchor.tx - 0.5, p.y - anchor.ty - 0.5)).toBeLessThan(2.6);
      expect(Math.abs(p.flap)).toBeLessThanOrEqual(1);
      expect(p.z).toBeGreaterThan(0.4 * ISO_H);
      expect(p.z).toBeLessThan(1.6 * ISO_H);
      expect(gullPose(anchor, 3, t)).toEqual(p);
      const sh = gullShadow(p);
      expect(sh.length).toBeGreaterThanOrEqual(4);
      expect(sh.reduce((s, q) => s + q.x, 0) / sh.length).toBeGreaterThan(p.x);
    }
    const a = gullPose(anchor, 3, 0),
      b = gullPose(anchor, 3, 4000);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(0.05); // bewegt sich
    const { ctx, log } = fakeCtx();
    drawGull(ctx, { x: 0, y: 0, zoom: 1 }, a);
    expect(log.saves).toBe(log.restores);
    expect(log.events.filter((e) => e.op === 'stroke').length).toBe(2);
  });

  it('Spec 5.6 Herdrauch zeichnet höchstens die erlaubten Puffs, dünn und hell', () => {
    for (const puffs of [0, 1, HEARTH_PUFFS, 99]) {
      const { ctx, log } = fakeCtx();
      drawHearthSmoke(ctx, { x: 0, y: 0, zoom: 1 }, { x: 100, y: 100 }, 4, 1234, puffs);
      expect(log.events.filter((e) => e.op === 'fill').length).toBe(Math.min(HEARTH_PUFFS, puffs));
      expect(log.saves).toBe(log.restores);
      for (const p of log.allPoints) expect(p.y).toBeLessThanOrEqual(100 + 1e-9);
    }
  });

  it('Spec 6.1 Phase aus lightAt: Tick 0 Tag, 3000 Nacht, 4800 Morgen (Gleichstand mit hearthSmoke)', () => {
    const phases = [0, 3000, 4800].map((t) => lightAt(t).phase);
    expect(phases).toEqual(['day', 'night', 'morning']);
    expect(phases.map((p) => hearthSmoke(p, 2))).toEqual([false, false, true]);
  });
});
