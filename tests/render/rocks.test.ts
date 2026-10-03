import { beforeAll, describe, expect, it, vi } from 'vitest';
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
  ROCK_VARIANTS,
  drawRockStamp,
  paintRock,
  resetRockCache,
  rockOnScreen,
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
  it('AK1 rockVariant ist rein, liegt in [0, ROCK_VARIANTS) und hängt von seed, x, y ab', () => {
    const rnd = vi.spyOn(Math, 'random');
    const seen = new Set<number>();
    for (let x = 0; x < 30; x++)
      for (let y = 0; y < 30; y++) {
        const v = rockVariant(5, x, y);
        expect(v).toBe(rockVariant(5, x, y));
        expect(Number.isInteger(v) && v >= 0 && v < ROCK_VARIANTS).toBe(true);
        seen.add(v);
      }
    expect(seen.size).toBe(ROCK_VARIANTS);
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
      expect(r.variant).toBe(rockVariant(w.seed, r.fp.x, r.fp.y));
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
    const r = rocksOf(w)[0]!;
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
      { kind: 'walker', id: 1, cx: x + 1.5, cy: y + 1.5 }, // davor
      { kind: 'walker', id: 2, cx: x - 0.5, cy: y - 0.5 }, // dahinter
    ]);
    const idx = (kind: string, id: number) => out.findIndex((i) => i.kind === kind && i.id === id);
    expect(idx('walker', 1)).toBeGreaterThan(idx('rock', r.id));
    expect(idx('walker', 2)).toBeLessThan(idx('rock', r.id));
  });
  it('AK2 Stempelgrenzen: Pfadpunkte in rockBounds, Breite höchstens eine Kachel, Höhe höchstens H_MAX', () => {
    expect(ROCK_H).toBeLessThanOrEqual(H_MAX);
    const it0 = mkRock(0, 10, 7);
    const box = rockBounds(it0);
    const c = project(10.5, 7.5);
    expect(box.w).toBe(ISO_W);
    expect(c.y - box.y).toBeLessThanOrEqual(H_MAX);
    for (const seed of [3, 7, 12588])
      for (let v = 0; v < ROCK_VARIANTS; v++)
        for (const f of rockFaces(seed, v))
          for (const p of f.pts) {
            expect(Math.abs(p.x)).toBeLessThanOrEqual(ISO_W / 2);
            expect(p.y).toBeGreaterThanOrEqual(-ROCK_H - 1e-9);
            expect(p.y).toBeLessThanOrEqual(ISO_H / 2);
            const q = { x: c.x + p.x, y: c.y + p.y };
            expect(q.x).toBeGreaterThanOrEqual(box.x - 1e-9);
            expect(q.x).toBeLessThanOrEqual(box.x + box.w + 1e-9);
            expect(q.y).toBeGreaterThanOrEqual(box.y - 1e-9);
            expect(q.y).toBeLessThanOrEqual(box.y + box.h + 1e-9);
          }
  });
  it('AK2 rockShadow liegt im Kachelraum nach rechts unten und ist ein Polygon', () => {
    const s = rockShadow(mkRock(0, 10, 7, 2), 3);
    expect(s.length).toBeGreaterThanOrEqual(6);
    const mx = s.reduce((a, p) => a + p.x, 0) / s.length;
    const my = s.reduce((a, p) => a + p.y, 0) / s.length;
    expect(mx).toBeGreaterThan(10.5);
    expect(my).toBeGreaterThan(7.5);
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
    mk(900, x + 1, y + 1);
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
    const n = 80;
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
    const r = rocksOf(w)[100]!;
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
    expect(log.events.filter((e) => e.op === 'drawImage').length).toBeLessThanOrEqual(
      ROCK_CAP[0] + 10,
    );
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
