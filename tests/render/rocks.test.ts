import { beforeAll, describe, expect, it, vi } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { createWorld } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import {
  H_MAX,
  ISO_H,
  ISO_W,
  ZOOM_STEPS,
  buildingHulls,
  depthKey,
  pickBuilding,
  project,
  unproject,
  sortedObjects,
  type SortedItem,
} from '../../src/render/iso';
import { ROCK_CAP, rockCap, SPRITE_CACHE_MAX_BYTES } from '../../src/render/limits';
import { PALETTE, SHADOW, SIGNAL_NAMES, rgbOfCss } from '../../src/render/palette';
import {
  ROCK_H,
  ROCK_SHAPES,
  ROCK_VARIANTS,
  ROCK_W,
  drawRockStamp,
  paintRock,
  resetRockCache,
  rockOnScreen,
  rockOffset,
  ROCK_MARGIN,
  rockBounds,
  rockCacheBytes,
  rockCacheSize,
  rockFaces,
  rockShadow,
  rockVariant,
  setRockCanvasFactory,
  thinRocks,
  type RockItem,
} from '../../src/render/rocks';
import { setCanvasFactory as setTreeCanvasFactory } from '../../src/render/trees';
import { render } from '../../src/render/renderer';
import { centerOn } from '../../src/render/camera';
import { fakeCtx } from './fakeCtx';

type Rock = Extract<SortedItem, { kind: 'rock' }>;
const WORLD_SEED = 7; // viel Gebirge (363 Kacheln)
const rocksOf = (w: World): Rock[] => sortedObjects(w).filter((i): i is Rock => i.kind === 'rock');
const mkRock = (id: number, x: number, y: number, variant = 0): RockItem => ({
  kind: 'rock',
  id,
  fp: { x, y, w: 1, h: 1 },
  key: depthKey({ x, y, w: 1, h: 1 }),
  variant,
  shadow: true,
});

beforeAll(() => {
  setTreeCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  setRockCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetRockCache();
});

describe('H-R8 AK1 Determinismus', () => {
  it('AK1 rockVariant ist rein, liegt in [0, ROCK_SHAPES) (klein: +ROCK_SHAPES) und hängt von seed, x, y ab', () => {
    const rnd = vi.spyOn(Math, 'random');
    const seen = new Set<number>();
    for (let x = 0; x < 30; x++)
      for (let y = 0; y < 30; y++) {
        const v = rockVariant(5, x, y);
        expect(v).toBe(rockVariant(5, x, y));
        expect(Number.isInteger(v) && v >= 0 && v < ROCK_SHAPES).toBe(true);
        expect(rockVariant(5, x, y, true)).toBe(v + ROCK_SHAPES);
        seen.add(v);
      }
    expect(seen.size).toBe(ROCK_SHAPES);
    expect(ROCK_VARIANTS).toBe(2 * ROCK_SHAPES);
    const a = [...Array(40).keys()].map((i) => rockVariant(1, i, 3));
    const b = [...Array(40).keys()].map((i) => rockVariant(2, i, 3));
    expect(a).not.toEqual(b);
    expect(rnd).not.toHaveBeenCalled();
    rnd.mockRestore();
  });
  it('AK1 rockFaces: gleiche Eingabe gleiche Gestalt, anderer Seed andere Gestalt', () => {
    for (let v = 0; v < ROCK_VARIANTS; v++) {
      expect(rockFaces(3, v)).toEqual(rockFaces(3, v));
      expect(rockFaces(3, v)).not.toEqual(rockFaces(4, v));
    }
    expect(rockFaces(3, 0)).not.toEqual(rockFaces(3, 1));
  });
  it('AK1 gleiche Welt, gleiche Kamera: zweimal gezeichnet ist die Aufzeichnung gleich', () => {
    const rec = (seed: number) => {
      const { ctx, log } = fakeCtx();
      for (let v = 0; v < ROCK_VARIANTS; v++) paintRock(ctx, seed, v, 1);
      return log.events;
    };
    expect(rec(9)).toEqual(rec(9));
    expect(rec(9)).not.toEqual(rec(10));
  });
});

describe('H-R8 Massivgestalt (Blindtest-Nacharbeit)', () => {
  const peaksOf = (faces: ReturnType<typeof rockFaces>) => {
    const out: (typeof faces)[] = [];
    for (const f of faces) {
      if (f.role === 'base') out.push([]);
      out[out.length - 1]!.push(f);
    }
    return out;
  };
  const area = (pts: { x: number; y: number }[]) =>
    Math.abs(
      pts.reduce(
        (a, p, i) => a + p.x * pts[(i + 1) % pts.length]!.y - pts[(i + 1) % pts.length]!.x * p.y,
        0,
      ),
    ) / 2;
  const apexY = (pk: ReturnType<typeof rockFaces>) =>
    Math.min(...pk.flatMap((f) => f.pts.map((p) => p.y)));
  it('Gipfelhierarchie: 2-3 Gipfel je Massiv, Hauptgipfel deutlich höher, Höhen variiert', () => {
    for (let v = 0; v < ROCK_VARIANTS; v++) {
      const hs = peaksOf(rockFaces(3, v)).map((pk) => -apexY(pk));
      expect(hs.length).toBeGreaterThanOrEqual(2);
      expect(hs.length).toBeLessThanOrEqual(3);
      const sorted = [...hs].sort((a, b) => b - a);
      expect(sorted[0]! / sorted[1]!).toBeGreaterThanOrEqual(1.25);
      expect(sorted[0]! / sorted[sorted.length - 1]!).toBeGreaterThanOrEqual(1.4);
    }
  });
  it('Flanken asymmetrisch, Sockel und Felsband vorhanden, kleine Massive niedriger und schmaler', () => {
    for (let v = 0; v < ROCK_VARIANTS; v++) {
      const faces = rockFaces(3, v);
      const roles = new Set(faces.map((f) => f.role));
      for (const r of ['base', 'light', 'shade', 'cap', 'foot', 'band'] as const)
        expect(roles.has(r), `${v}${r}`).toBe(true);
      const main = peaksOf(faces).sort((a, b) => apexY(a) - apexY(b))[0]!;
      const l = area(main.find((f) => f.role === 'light')!.pts),
        r = area(main.find((f) => f.role === 'shade')!.pts);
      expect(Math.abs(l - r) / Math.max(l, r)).toBeGreaterThan(0.05);
    }
    const top = (v: number) => Math.min(...rockFaces(3, v).flatMap((f) => f.pts.map((p) => p.y)));
    const wide = (v: number) => {
      const xs = rockFaces(3, v).flatMap((f) => f.pts.map((p) => p.x));
      return Math.max(...xs) - Math.min(...xs);
    };
    for (let v = 0; v < ROCK_SHAPES; v++) {
      expect(-top(v + ROCK_SHAPES)).toBeLessThan(-top(v));
      expect(wide(v + ROCK_SHAPES)).toBeLessThan(wide(v));
    }
    const widest = Math.max(...[...Array(ROCK_VARIANTS).keys()].map(wide));
    expect(widest).toBeGreaterThan(1.3 * ISO_W);
    expect(widest).toBeLessThanOrEqual(ROCK_W);
  });
  it('Footprint: gross = freier 2x2-Block (Footprint 2x2), klein = einzelne freie Gebirgskachel (1x1), nie überlappend', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const free = (x: number, y: number) => {
      const t = x < w.width && y < w.height ? w.tiles[y * w.width + x] : undefined;
      return !!t && t.terrain === 'mountain' && t.buildingId === null && !t.road;
    };
    const rocks = rocksOf(w);
    const used = new Set<string>();
    let big = 0;
    for (const r of rocks) {
      expect(r.fp.w).toBe(r.fp.h);
      expect([1, 2]).toContain(r.fp.w);
      expect(r.variant >= ROCK_SHAPES).toBe(r.fp.w === 1);
      if (r.fp.w === 2) {
        big++;
      }
      for (let dy = 0; dy < r.fp.h; dy++)
        for (let dx = 0; dx < r.fp.w; dx++) {
          expect(free(r.fp.x + dx, r.fp.y + dy)).toBe(true);
          const k = `${r.fp.x + dx},${r.fp.y + dy}`;
          expect(used.has(k), k).toBe(false);
          used.add(k);
        }
    }
    expect(big).toBeGreaterThan(10);
    for (const b of Object.values(w.buildings))
      for (const r of rocks)
        expect(
          b.x < r.fp.x + r.fp.w && b.x + 3 > r.fp.x && b.y < r.fp.y + r.fp.h && b.y + 3 > r.fp.y,
        ).toBe(false);
  });
  /** Prüft für alle Felsen: wer nach einer Footprint-Achse eindeutig davor/dahinter liegt, kommt danach/davor. */
  const expectDepthOrder = (
    w: World,
    rocks: Rock[],
    movers: Parameters<typeof sortedObjects>[1],
  ) => {
    const out = sortedObjects(w, movers);
    const pos = new Map<string, number>();
    out.forEach((it, i) => pos.set(`${it.kind}${it.id}`, i));
    let checked = 0;
    for (const r of rocks) {
      const pr = pos.get(`rock${r.id}`)!;
      for (const it of out) {
        if (it === r || it.kind === 'rock') continue;
        if (Math.abs(it.fp.x - r.fp.x) > r.fp.w + 4 || Math.abs(it.fp.y - r.fp.y) > r.fp.h + 4)
          continue;
        const frontX = it.fp.x >= r.fp.x + r.fp.w - 1e-9,
          frontY = it.fp.y >= r.fp.y + r.fp.h - 1e-9;
        const backX = it.fp.x + it.fp.w <= r.fp.x + 1e-9,
          backY = it.fp.y + it.fp.h <= r.fp.y + 1e-9;
        const pi = pos.get(`${it.kind}${it.id}`)!;
        if ((frontX || frontY) && !(backX || backY)) {
          expect(pi, `${it.kind}${it.id} vor ${r.id}`).toBeGreaterThan(pr);
          checked++;
        } else if ((backX || backY) && !(frontX || frontY)) {
          expect(pi, `${it.kind}${it.id} hinter ${r.id}`).toBeLessThan(pr);
          checked++;
        }
      }
    }
    return checked;
  };
  it('Tiefenordnung (Property): Figuren, Schiffe und Boote auf allen Nachbarkacheln der Footprints', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const rocks = rocksOf(w);
    const sample = rocks.filter((_, i) => i % 5 === 0);
    let id = 900;
    const movers: { kind: 'walker' | 'ship' | 'boat'; id: number; cx: number; cy: number }[] = [];
    const kinds = ['walker', 'ship', 'boat'] as const;
    let k = 0;
    for (const r of sample)
      for (let dy = -2; dy <= r.fp.h + 1; dy++)
        for (let dx = -2; dx <= r.fp.w + 1; dx++) {
          const x = r.fp.x + dx,
            y = r.fp.y + dy;
          const inside = dx >= 0 && dy >= 0 && dx < r.fp.w && dy < r.fp.h;
          if (!inside && x >= 0 && y >= 0 && x < w.width && y < w.height)
            movers.push({ kind: kinds[k++ % 3]!, id: ++id, cx: x + 0.5, cy: y + 0.5 });
        }
    expect(expectDepthOrder(w, sample, movers)).toBeGreaterThan(200);
  });
  it('Tiefenordnung (Property): eigene Gebäude (1x1, 2x2, Steinbruch auf Gebirgskachel) rund um 2x2-Blöcke und Einzelfelsen', () => {
    const ref = rocksOf(createWorld(WORLD_SEED, { unlockAll: true })).filter((_, i) => i % 2 === 0);
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    let bid = 900;
    const put = (defId: 'house' | 'quarry' | 'kontor', x: number, y: number): void => {
      const d = BUILDING_DEFS[defId];
      if (x < 0 || y < 0 || x + d.w > w.width || y + d.h > w.height) return;
      const tiles = [];
      for (let dy = 0; dy < d.h; dy++)
        for (let dx = 0; dx < d.w; dx++) tiles.push(w.tiles[(y + dy) * w.width + x + dx]!);
      if (tiles.some((t) => t.buildingId !== null)) return;
      w.buildings[bid] = { id: bid, defId, x, y, connected: true, progress: 0, state: 'ok' };
      for (const t of tiles) t.buildingId = bid;
      w.nextBuildingId = ++bid;
    };
    const defs = ['house', 'quarry', 'kontor'] as const;
    let k = 0;
    for (const r of ref) {
      // Ringposition rund um den Footprint (inkl. Gebirgskacheln selbst: Steinbruch am Berg)
      const ring: [number, number][] = [];
      for (let dy = -2; dy <= r.fp.h + 1; dy++)
        for (let dx = -2; dx <= r.fp.w + 1; dx++) {
          const inside = dx >= 0 && dy >= 0 && dx < r.fp.w && dy < r.fp.h;
          if (!inside) ring.push([r.fp.x + dx, r.fp.y + dy]);
        }
      const [x, y] = ring[k % ring.length]!;
      const def = defs[k++ % 3]!;
      const d = BUILDING_DEFS[def];
      const overlaps =
        x < r.fp.x + r.fp.w && x + d.w > r.fp.x && y < r.fp.y + r.fp.h && y + d.h > r.fp.y;
      if (!overlaps) put(def, x, y);
    }
    expect(Object.keys(w.buildings).length).toBeGreaterThan(40);
    expect(
      Object.values(w.buildings).some(
        (b) => b.id >= 900 && w.tiles[b.y * w.width + b.x]!.terrain === 'mountain',
      ),
    ).toBe(true);
    const rocks = rocksOf(w);
    expect(expectDepthOrder(w, rocks, [])).toBeGreaterThan(200);
    for (const r of rocks)
      for (const b of Object.values(w.buildings)) {
        const d = BUILDING_DEFS[b.defId];
        expect(
          b.x < r.fp.x + r.fp.w &&
            b.x + d.w > r.fp.x &&
            b.y < r.fp.y + r.fp.h &&
            b.y + d.h > r.fp.y,
        ).toBe(false);
      }
  });
  it('rockOnScreen entspricht rockBounds samt Rand (Kamera ungleich 0, Kacheln mit x ungleich y)', () => {
    const view = { w: 800, h: 600 };
    let agree = 0;
    for (const zoom of [0.5, 1, 2])
      for (const cam0 of [
        { x: 300, y: 250 },
        { x: -120, y: 700 },
      ])
        for (let x = 0; x < 40; x += 3)
          for (let y = 0; y < 40; y += 2)
            for (const wdt of [1, 2]) {
              const cam = { ...cam0, zoom };
              const r = { ...mkRock(0, x, y), fp: { x, y, w: wdt, h: wdt } } as RockItem;
              const box = rockBounds(r);
              const m = ROCK_MARGIN;
              const want =
                box.x + box.w >= cam.x - m &&
                box.x <= cam.x + view.w / zoom + m &&
                box.y + box.h >= cam.y - m &&
                box.y <= cam.y + view.h / zoom + m;
              expect(rockOnScreen(cam, view, r), `${zoom} ${x},${y},${wdt}`).toBe(want);
              agree += want ? 1 : 0;
            }
    expect(agree).toBeGreaterThan(20);
  });
});

describe('H-R8 Optik-Runde 3 (Raster, Versatz, Formvielfalt)', () => {
  it('Aperiodisch: grosse Stempel liegen in mehreren Gitterphasen, nicht alle auf geraden Koordinaten', () => {
    for (const seed of [7, 3, 42]) {
      const w = createWorld(seed, { unlockAll: true });
      const big = rocksOf(w).filter((r) => r.fp.w === 2);
      expect(big.length).toBeGreaterThan(10);
      const phases = new Map<string, number>();
      for (const r of big) {
        const k = `${r.fp.x & 1}${r.fp.y & 1}`;
        phases.set(k, (phases.get(k) ?? 0) + 1);
      }
      expect(phases.size, `${seed}`).toBeGreaterThanOrEqual(seed === 7 ? 3 : 2);
      const evenShare = (phases.get('00') ?? 0) / big.length;
      expect(evenShare).toBeLessThan(0.6);
    }
  });
  it('Stempelzahl steigt nicht (Seed 7: höchstens 112 Stempel)', () => {
    expect(rocksOf(createWorld(7, { unlockAll: true })).length).toBeLessThanOrEqual(112);
  });
  it('rockOffset: deterministisch, bis 0,35 Footprint-Breite, Stempel bleibt im Prisma, Versatz streut', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const offs: number[] = [];
    for (const r of rocksOf(w)) {
      const o = rockOffset(w.seed, r);
      expect(o).toBe(rockOffset(w.seed, r));
      expect(Math.abs(o)).toBeLessThanOrEqual(0.35 * r.fp.w * ISO_W + 1e-9);
      const half = (r.fp.w * ISO_W) / 2;
      for (const f of rockFaces(w.seed, r.variant))
        for (const p of f.pts) expect(Math.abs(p.x + o)).toBeLessThanOrEqual(half + 1e-9);
      offs.push(Math.round(o));
    }
    expect(new Set(offs).size).toBeGreaterThan(15);
    expect(offs.some((o) => o < -4) && offs.some((o) => o > 4)).toBe(true);
  });
  it('Formvielfalt: Hauptgipfel 0,5 bis 1,0 ROCK_H, grosse im Mittel höchstens 0,85, abgeflachte Gipfel, Geröllfuss', () => {
    const tops: number[] = [];
    let plateau = 0,
      rubble = 0;
    for (let v = 0; v < ROCK_VARIANTS; v++) {
      const faces = rockFaces(3, v);
      const top = -Math.min(...faces.flatMap((f) => f.pts.map((p) => p.y)));
      expect(top / ROCK_H).toBeGreaterThanOrEqual(0.25);
      expect(top / ROCK_H).toBeLessThanOrEqual(1.0);
      if (v < ROCK_SHAPES) tops.push(top / ROCK_H);
      if (faces.some((f) => f.role === 'cap' && f.pts.length >= 4)) plateau++;
      if (faces.some((f) => f.role === 'rubble')) rubble++;
    }
    expect(Math.max(...tops) - Math.min(...tops)).toBeGreaterThanOrEqual(0.25);
    expect(tops.reduce((a, b) => a + b, 0) / tops.length).toBeLessThanOrEqual(0.85);
    expect(plateau).toBeGreaterThanOrEqual(4);
    expect(rubble).toBeGreaterThanOrEqual(4);
  });
});

describe('H-R8 AK2 Sortierung', () => {
  it('AK2 sortedObjects liefert Felsen nur auf Gebirge ohne Gebäude und Weg, id = Kachelindex', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const rocks = rocksOf(w);
    expect(rocks.length).toBeGreaterThan(50);
    for (const r of rocks) {
      const t = w.tiles[r.id]!;
      expect(t.terrain).toBe('mountain');
      expect(t.buildingId).toBeNull();
      expect(t.road).toBeFalsy();
      expect(r.id).toBe(r.fp.y * w.width + r.fp.x);
      expect(r.variant % ROCK_SHAPES).toBe(rockVariant(w.seed, r.fp.x, r.fp.y));
    }
    expect(sortedObjects(w)).toBe(sortedObjects(w)); // gecacht
  });
  it('AK2 depthKey strikt aufsteigend (nicht fallend) über alle Arten', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const out = sortedObjects(w, [{ kind: 'walker', id: 1, cx: 20.5, cy: 20.5 }]);
    for (let i = 1; i < out.length; i++)
      expect(out[i]!.key).toBeGreaterThanOrEqual(out[i - 1]!.key);
  });
  it('AK2 Gleichstand: Fels < Baum < Gebäude < Schiff < Boot < Figur', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const r = rocksOf(w).find((q) => q.fp.w === 1)!;
    const { x, y } = r.fp;
    const at = (kind: 'ship' | 'boat' | 'walker', id: number) => ({
      kind,
      id,
      cx: x + 0.5,
      cy: y + 0.5,
    });
    const out = sortedObjects(w, [at('walker', 1), at('boat', 2), at('ship', 3)]);
    const same = out.filter((i) => i.key === r.key && i.fp.x === x);
    expect(same.map((i) => i.kind)).toEqual(['rock', 'ship', 'boat', 'walker']);
  });
  it('AK2 benachbart: Figur/Gebäude vor dem Fels (grösserer Schlüssel) kommen danach, dahinter davor', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const r = rocksOf(w)[0]!;
    const { x, y } = r.fp;
    const out = sortedObjects(w, [
      { kind: 'walker', id: 1, cx: x + r.fp.w + 0.5, cy: y + r.fp.h + 0.5 }, // davor
      { kind: 'walker', id: 2, cx: x - 0.5, cy: y - 0.5 }, // dahinter
    ]);
    const idx = (kind: string, id: number) => out.findIndex((i) => i.kind === kind && i.id === id);
    expect(idx('walker', 1)).toBeGreaterThan(idx('rock', r.id));
    expect(idx('walker', 2)).toBeLessThan(idx('rock', r.id));
  });
  it('AK2 Stempelgrenzen: Pfadpunkte in rockBounds, Breite höchstens der Footprint, Höhe höchstens H_MAX', () => {
    expect(ROCK_H).toBeLessThanOrEqual(H_MAX);
    expect(ROCK_W).toBe(2 * ISO_W);
    for (const seed of [3, 7, 12588])
      for (let v = 0; v < ROCK_VARIANTS; v++) {
        const n = v >= ROCK_SHAPES ? 1 : 2; // klein = 1x1-, gross = 2x2-Footprint
        const it0 = { ...mkRock(0, 10, 7, v), fp: { x: 10, y: 7, w: n, h: n } } as RockItem;
        const box = rockBounds(it0);
        const c = project(10 + n / 2, 7 + n / 2);
        expect(box.w).toBe(n * ISO_W);
        expect(c.y - box.y).toBeLessThanOrEqual(H_MAX);
        for (const f of rockFaces(seed, v))
          for (const p of f.pts) {
            expect(Math.abs(p.x)).toBeLessThanOrEqual((n * ISO_W) / 2);
            expect(p.y).toBeGreaterThanOrEqual(-ROCK_H - 1e-9);
            expect(p.y).toBeLessThanOrEqual(ISO_H / 2);
            const q = { x: c.x + p.x, y: c.y + p.y };
            expect(q.x).toBeGreaterThanOrEqual(box.x - 1e-9);
            expect(q.x).toBeLessThanOrEqual(box.x + box.w + 1e-9);
            expect(q.y).toBeGreaterThanOrEqual(box.y - 1e-9);
            expect(q.y).toBeLessThanOrEqual(box.y + box.h + 1e-9);
          }
      }
  });
  it('AK2 rockShadow liegt im Kachelraum nach rechts unten und ist ein Polygon', () => {
    const s = rockShadow(mkRock(0, 10, 7, 2), 3);
    expect(s.length).toBeGreaterThanOrEqual(6);
    const mx = s.reduce((a, p) => a + p.x, 0) / s.length;
    const my = s.reduce((a, p) => a + p.y, 0) / s.length;
    expect(mx + my).toBeGreaterThan(18); // Bildversatz verschiebt entlang (+1, −1), die Summe bleibt
  });
});

describe('H-R8 AK3 kein Picking', () => {
  it('AK3 Felsen erzeugen keine Hülle; Klick auf ein Felsmassiv trifft kein Gebäude', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const hulls = buildingHulls(w);
    expect(hulls.length).toBe(Object.keys(w.buildings).length);
    for (const r of rocksOf(w).slice(0, 60)) {
      const c = project(r.fp.x + 0.5, r.fp.y + 0.5);
      for (const dy of [0, -10, -25, -40]) expect(pickBuilding(hulls, c.x, c.y + dy)).toBeNull();
    }
  });
  it('AK3 Gebäude vor dem Fels wird danach gezeichnet (nicht verdeckt), Gebäude dahinter davor', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const r = rocksOf(w)[0]!;
    const { x, y } = r.fp;
    const mk = (id: number, bx: number, by: number) => {
      w.buildings[id] = {
        id,
        defId: 'house',
        x: bx,
        y: by,
        connected: true,
        progress: 0,
        state: 'ok',
      };
      w.nextBuildingId = Math.max(w.nextBuildingId, id + 1);
    };
    mk(900, x + r.fp.w, y + r.fp.h);
    mk(901, x - 2, y - 2);
    const out = sortedObjects(w);
    const at = (kind: string, id: number) => out.findIndex((i) => i.kind === kind && i.id === id);
    expect(at('building', 900)).toBeGreaterThan(at('rock', r.id));
    expect(at('building', 901)).toBeLessThan(at('rock', r.id));
  });
});

describe('H-R8 AK4 Cap und Cache', () => {
  it('AK4 ROCK_CAP: normal > reduziert > 0, cap() liefert beide Werte', () => {
    expect(ROCK_CAP[0]).toBeGreaterThan(ROCK_CAP[1]);
    expect(ROCK_CAP[1]).toBeGreaterThan(0);
    expect(rockCap()).toBe(ROCK_CAP[0]);
    expect(rockCap(true)).toBe(ROCK_CAP[1]);
  });
  it('AK4 thinRocks: genau cap Felsen, Reihenfolge und andere Arten bleiben, unter dem Limit unverändert', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const all = sortedObjects(w, [{ kind: 'walker', id: 1, cx: 20.5, cy: 20.5 }]).slice();
    const rocks = all.filter((i) => i.kind === 'rock');
    expect(thinRocks(all, rocks.length, w.seed)).toEqual(all);
    const n = Math.floor(rocks.length / 3);
    const out = thinRocks(all, n, w.seed);
    expect(out.filter((i) => i.kind === 'rock').length).toBe(n);
    expect(out.filter((i) => i.kind !== 'rock')).toEqual(all.filter((i) => i.kind !== 'rock'));
    const pos = out.map((i) => all.indexOf(i));
    expect([...pos].sort((a, b) => a - b)).toEqual(pos);
    expect(thinRocks(all, n, w.seed)).toEqual(out);
  });
  it('AK4 thinRocks kamerastabil: ein gewählter Fels bleibt gewählt, wenn der Ausschnitt schrumpft oder wandert', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const rocks = rocksOf(w);
    const n = 20;
    const sel = (items: readonly Rock[]) => new Set(thinRocks(items, n, w.seed).map((i) => i.id));
    const full = sel(rocks);
    expect(full.size).toBe(n);
    // Ausschnitt wandert: jeweils die ersten k Felsen fallen weg, die letzten kommen nie dazu
    for (const k of [5, 20, 60]) {
      const part = rocks.slice(k);
      const s2 = sel(part);
      expect(s2.size).toBe(n);
      for (const r of part) if (full.has(r.id)) expect(s2.has(r.id), `k${k} id${r.id}`).toBe(true);
    }
    // Wahl hängt nur an (Seed, Kachel), nicht an der Position in der Liste
    expect(sel([...rocks].reverse())).toEqual(full);
    expect(sel(rocks)).not.toEqual(new Set(thinRocks(rocks, n, w.seed + 1).map((i) => i.id)));
  });
  it('AK4 Stempel-Cache: ein Stempel je Variante und Zoomstufe, begrenzt und unter SPRITE_CACHE_MAX_BYTES', () => {
    resetRockCache();
    const { ctx } = fakeCtx();
    for (const zoom of [0.5, 0.6, 1, 1.2, 2, 2.5])
      for (let v = 0; v < ROCK_VARIANTS; v++)
        for (let k = 0; k < 3; k++) drawRockStamp(ctx, { x: 0, y: 0, zoom }, mkRock(0, 4, 4, v), 7);
    expect(rockCacheSize()).toBeLessThanOrEqual(ROCK_VARIANTS * ZOOM_STEPS.length);
    expect(rockCacheSize()).toBe(ROCK_VARIANTS * ZOOM_STEPS.length);
    expect(rockCacheBytes()).toBeLessThan(SPRITE_CACHE_MAX_BYTES);
  });
  it('AK4 render zeichnet nur sichtbare Felsen, höchstens cap je Frame (drawImage)', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const VIEW = { w: 1280, h: 720 };
    const layer = { width: 2048, height: 2048 } as unknown as HTMLCanvasElement;
    const r = rocksOf(w)[99]!; // H-S1: Seed 7 hat nach der Gebirgsflecken-Bereinigung 100 Felsen
    const c = project(r.fp.x + 0.5, r.fp.y + 0.5);
    const cam = { x: 0, y: 0, zoom: 1 };
    for (const t of w.tiles) if (t.terrain === 'forest') t.terrain = 'grass'; // nur Felsstempel zählen
    centerOn(cam, r.fp.x + 0.5, r.fp.y + 0.5, VIEW, { w: w.width, h: w.height });
    expect(c.x).toBeDefined();
    resetRockCache();
    const { ctx, log } = fakeCtx();
    render(ctx, w, cam, layer, null, null, VIEW, { timeMs: 0 });
    const n = log.events.filter((e) => e.op === 'drawImage').length;
    expect(n).toBeGreaterThan(0);
    expect(n).toBeLessThanOrEqual(rockCap() + 10); // + Geländeebene und Möwen-/Wellen-Reste
    const full = log.events.filter((e) => e.op === 'drawImage').length;
    const { ctx: c2, log: l2 } = fakeCtx();
    render(c2, w, cam, layer, null, null, VIEW, { timeMs: 0, reduceMotion: true });
    const red = l2.events.filter((e) => e.op === 'drawImage').length;
    expect(red).toBeLessThanOrEqual(full);
  });
});

describe('H-R8 AK4 Frame-Kosten', () => {
  const frame = (zoom: number) => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    for (const t of w.tiles) if (t.terrain === 'forest') t.terrain = 'grass';
    w.buildings = {};
    const VIEW = { w: 1920, h: 1080 };
    const layer = { width: 2048, height: 2048 } as unknown as HTMLCanvasElement;
    const cam = { x: 0, y: 0, zoom };
    centerOn(cam, 32, 32, VIEW, { w: w.width, h: w.height });
    const { ctx, log } = fakeCtx();
    render(ctx, w, cam, layer, null, null, VIEW, { timeMs: 0, dayNight: false });
    return { w, log };
  };
  it('AK4 ROCK_CAP normal höchstens 160, reduziert höchstens 80 (Frame-Budget je drawImage)', () => {
    expect(ROCK_CAP[0]).toBeLessThanOrEqual(160);
    expect(ROCK_CAP[1]).toBeLessThanOrEqual(80);
  });
  it('AK4 rock.shadow (beim Aufbau berechnet): nur Randfelsen (offene Kachel rechts/unten) werfen Schatten, Binnenfelsen nicht', () => {
    const { w } = frame(1);
    const rocks = rocksOf(w);
    const inner = rocks.filter((r) => !r.shadow);
    const edge = rocks.filter((r) => r.shadow);
    expect(inner.length).toBeGreaterThan(0);
    expect(edge.length).toBeGreaterThan(0);
    for (const r of inner)
      for (const [dx, dy] of [
        [1, 0],
        [0, 1],
        [1, 1],
      ] as const)
        expect(w.tiles[(r.fp.y + dy) * w.width + r.fp.x + dx]?.terrain).toBe('mountain');
  });
  it('AK4 Schattenpfad je Frame: Punkte höchstens 8 je Randfels, weniger als bei Schatten für alle sichtbaren', () => {
    const { w, log } = frame(1);
    const pts = log.events
      .filter((e) => e.style === SHADOW)
      .reduce((n, e) => n + e.points.length, 0);
    const edgeAll = rocksOf(w).filter((r) => r.shadow).length;
    expect(pts).toBeLessThanOrEqual(8 * Math.min(edgeAll, ROCK_CAP[0]) + 40); // + Schiffsschatten;
    expect(log.events.filter((e) => e.op === 'drawImage').length).toBeLessThanOrEqual(130);
  });
});

describe('H-R8 AK4 Auswahl und Culling', () => {
  const synth = (ids: number[]) =>
    ids.map((id) => ({ kind: 'rock', id, fp: { x: id * 7, y: id * 3 }, shadow: false }));
  it('AK4 Memo: anderer Ausschnitt mit gleichem n, first, last und gleicher Summe wird neu berechnet', () => {
    const A = [...Array(40).keys()].map((i) => i + 1);
    const B = A.map((i) => (i === 5 ? 4.5 : i === 6 ? 6.5 : i)).map((i) => Math.floor(i * 2) / 2);
    const A2 = A.filter((i) => i !== 5 && i !== 6).concat([5.25, 5.75]);
    for (const [x, y] of [
      [A, B],
      [A, A2],
    ] as const) {
      const sa = synth(x as number[]),
        sb = synth(y as number[]);
      thinRocks(sa, 30, 5);
      const got = thinRocks(sb, 30, 5).map((i) => i.id);
      thinRocks(sb, 30, 6); // Memo verdrängen
      const ref = thinRocks(sb, 30, 5).map((i) => i.id);
      expect(got).toEqual(ref);
      expect(got).toHaveLength(30);
    }
  });
  it('AK4 Randfelsen (shadow) haben Vorrang: passen alle in den Cap, bleiben alle erhalten', () => {
    const w = createWorld(WORLD_SEED, { unlockAll: true });
    const rocks = rocksOf(w);
    const edge = rocks.filter((r) => r.shadow);
    expect(edge.length).toBeLessThan(rocks.length);
    const kept = new Set(thinRocks(rocks, edge.length + 5, w.seed).map((r) => r.id));
    for (const r of edge) expect(kept.has(r.id)).toBe(true);
  });
  it('AK4 rockOnScreen: Stempel im Bild ja, weit links/rechts/oben/unten nein, Stempelspitze ragt von unten ins Bild', () => {
    const view = { w: 1920, h: 1080 };
    const cam = { x: 0, y: 0, zoom: 1 };
    const at = (fx: number, fy: number) => mkRock(0, fx, fy);
    const c = (sx: number, sy: number) => {
      // Kachel, deren Mitte bei Bild (sx, sy) liegt
      const u = unproject(sx, sy);
      return at(Math.floor(u.x), Math.floor(u.y));
    };
    expect(rockOnScreen(cam, view, c(960, 500))).toBe(true);
    expect(rockOnScreen(cam, view, c(-600, 500))).toBe(false);
    expect(rockOnScreen(cam, view, c(2600, 500))).toBe(false);
    expect(rockOnScreen(cam, view, c(960, -300))).toBe(false);
    expect(rockOnScreen(cam, view, c(960, 1080 + 20))).toBe(true); // Spitze ragt ins Bild
    expect(rockOnScreen(cam, view, c(960, 1080 + 200))).toBe(false);
  });
});

describe('H-R8 AK5 Palette', () => {
  it('AK5 jede Felsfarbe kommt aus Palette-Felstönen (Mischung); keine Signalfarben, kein Umriss', () => {
    const sig = SIGNAL_NAMES.map((n) => rgbOfCss(PALETTE[n]).join(','));
    for (const seed of [3, 7])
      for (let v = 0; v < ROCK_VARIANTS; v++) {
        const { ctx, log } = fakeCtx();
        paintRock(ctx, seed, v, 1);
        expect(log.strokeSet).toHaveLength(0);
        expect(log.events.some((e) => e.op === 'stroke')).toBe(false);
        for (const s of log.fillSet) {
          expect(s).not.toBe(SHADOW);
          expect(sig).not.toContain(rgbOfCss(s).join(','));
        }
        for (const f of rockFaces(seed, v)) expect(sig).not.toContain(rgbOfCss(f.fill).join(','));
      }
  });
  it('AK5 Licht von oben links: linke Fläche heller als rechte, Lichtkappe am hellsten', () => {
    const lum = (c: string) => {
      const [r, g, b] = rgbOfCss(c);
      return 0.3 * r + 0.59 * g + 0.11 * b;
    };
    for (let v = 0; v < ROCK_VARIANTS; v++) {
      const f = rockFaces(3, v);
      const tones = f.map((q) => lum(q.fill));
      const left = f.filter((q) => q.role === 'light'),
        right = f.filter((q) => q.role === 'shade');
      expect(left.length).toBeGreaterThan(0);
      expect(right.length).toBeGreaterThan(0);
      expect(Math.min(...left.map((q) => lum(q.fill)))).toBeGreaterThan(
        Math.max(...right.map((q) => lum(q.fill))),
      );
      expect(Math.max(...tones)).toBe(
        Math.max(...f.filter((q) => q.role === 'cap').map((q) => lum(q.fill))),
      );
    }
  });
});
