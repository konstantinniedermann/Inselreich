import { beforeEach, describe, expect, it } from 'vitest';
import { demolish, placeBuilding } from '../../src/sim/build';
import { createWorld, home } from '../../src/sim/world';
import { canPlace } from '../../src/sim/placement';
import type { World } from '../../src/sim/types';
import { islandView } from '../../src/render/archipel';
import { kontorPos, stampPlacements, type StampKind } from '../../src/render/decor';
import {
  DECOR_MIN_ZOOM,
  DECOR_STAMP_TONES,
  RUIN_H_MAX,
  STAMP_BOX,
  decorCacheBytes,
  decorCacheClears,
  decorCacheKeys,
  decorCacheSize,
  decorShadow,
  decorStampFor,
  drawDecorStamp,
  resetDecorCache,
  setDecorCanvasFactory,
  stampHeight,
  type DecorItem,
} from '../../src/render/decorStamps';
import { DECOR_TONES } from '../../src/render/groundDecor';
import { ISO_H, ISO_W, ZOOM_STEPS, buildingHulls, sortedObjects } from '../../src/render/iso';
import { DECOR_CACHE_MAX_BYTES } from '../../src/render/limits';
import { PALETTE, SIGNAL_NAMES, rgbOfCss } from '../../src/render/palette';
import { TREE_H } from '../../src/render/trees';
import { deltaE2000, rgbToLab } from './deltaE';
import { fakeCtx } from './fakeCtx';

const KINDS: StampKind[] = ['solitaire', 'orchard', 'menhir', 'ruin'];
const lab = (css: string) => rgbToLab(rgbOfCss(css));
const decorItems = (w: World): DecorItem[] =>
  sortedObjects(w).filter((i): i is DecorItem => i.kind === 'decor');

beforeEach(() => {
  setDecorCanvasFactory(() => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  });
  resetDecorCache();
});

describe('L4-T1 nur Heimatinsel', () => {
  it('L4-T1 Inselansichten fremder Inseln liefern keine decor-Items in sortedObjects, die Heimat schon', () => {
    for (const seed of [1, 7, 14]) {
      const w = createWorld(seed, { unlockAll: true });
      expect(decorItems(w).length, `Seed ${seed} Heimat`).toBeGreaterThan(0);
      expect(w.islands.length).toBeGreaterThan(1);
      for (let i = 1; i < w.islands.length; i++) {
        const v = islandView(w, i);
        expect(
          sortedObjects(v).some((it) => it.kind === 'decor'),
          `Seed ${seed} Insel ${i}`,
        ).toBe(false);
      }
    }
  });

  it('L4-T1 die decor-Items entsprechen der Stempelliste, stehen im sortierten Durchgang und werden je layoutKey gehalten', () => {
    const w = createWorld(7, { unlockAll: true });
    const items = sortedObjects(w);
    const st = stampPlacements(w.seed, home(w), kontorPos(home(w), w.buildings));
    expect(
      decorItems(w)
        .map((i) => `${i.stamp}@${i.id}`)
        .sort(),
    ).toEqual(st.map((s) => `${s.kind}@${s.id}`).sort());
    for (let i = 1; i < items.length; i++)
      expect(items[i]!.key).toBeGreaterThanOrEqual(items[i - 1]!.key);
    expect(sortedObjects(w)).toBe(items); // je Frame dieselbe Liste: nicht neu berechnet
    // Bau ändert den layoutKey: neue Liste
    const isl = home(w);
    let placed = false;
    for (let y = 20; y < 44 && !placed; y++)
      for (let x = 20; x < 44 && !placed; x++)
        if (canPlace(w, 'house', x, y).ok) placed = placeBuilding(w, 'house', x, y).ok;
    expect(placed).toBe(true);
    expect(sortedObjects(w)).not.toBe(items);
    expect(isl.tiles.length).toBeGreaterThan(0);
  });

  it('L4-T1 Cache-Thrash: abwechselnd Heimat- und Ansicht-Seed über 10 Frames leert den Stempel-Cache höchstens einmal', () => {
    const w = createWorld(7, { unlockAll: true });
    const view = islandView(w, 1);
    const cam = { x: 0, y: 0, zoom: 1 };
    const { ctx } = fakeCtx();
    for (let frame = 0; frame < 10; frame++)
      for (const world of [w, view])
        for (const it of decorItems(world).slice(0, 6)) drawDecorStamp(ctx, cam, it, world.seed);
    expect(decorCacheClears()).toBeLessThanOrEqual(1);
    expect(decorCacheSize()).toBeGreaterThan(0);
  });

  it('Deko-Stempel gehen in kein Picking und in keine Gebäudehülle: Hüllen gleich mit und ohne Deko', () => {
    const w = createWorld(7, { unlockAll: true });
    let n = 0;
    for (let y = 20; y < 44 && n < 3; y++)
      for (let x = 20; x < 44 && n < 3; x++) if (placeBuilding(w, 'house', x, y).ok) n++;
    const withDeco = buildingHulls(w).map((h) => [h.id, h.hull]);
    const plain = createWorld(7, { unlockAll: true });
    for (const b of Object.values(w.buildings)) plain.buildings[b.id] = { ...b };
    for (const t of home(plain).tiles) if (t.terrain === 'grass') t.terrain = 'sand'; // keine Stempel mehr
    for (const b of Object.values(w.buildings))
      for (let i = 0; i < home(w).tiles.length; i++)
        if (home(w).tiles[i]!.buildingId === b.id) home(plain).tiles[i]!.buildingId = b.id;
    plain.nextBuildingId = w.nextBuildingId;
    expect(decorItems(plain)).toHaveLength(0);
    expect(buildingHulls(plain).map((h) => [h.id, h.hull])).toEqual(withDeco);
  });
});

describe('L4-T3 Grenzen der Stempel (R5)', () => {
  it('R5 stehende Deko ≤ TREE_H; Mauerreste ≤ 0,35 ISO_H; Menhir ≈ 0,15 × 0,6 Kachel', () => {
    for (const k of KINDS)
      for (let v = 0; v < 4; v++) {
        expect(stampHeight(k, v), `${k} ${v}`).toBeLessThanOrEqual(TREE_H);
        expect(stampHeight(k, v)).toBeGreaterThan(5);
      }
    for (let v = 0; v < 4; v++)
      expect(stampHeight('ruin', v)).toBeLessThanOrEqual(RUIN_H_MAX + 1e-9);
    expect(RUIN_H_MAX).toBeCloseTo(0.35 * ISO_H, 9);
    for (let v = 0; v < 4; v++) {
      expect(stampHeight('menhir', v)).toBeGreaterThanOrEqual(0.5 * ISO_H);
      expect(stampHeight('menhir', v)).toBeLessThanOrEqual(0.75 * ISO_H);
    }
    expect(STAMP_BOX.y0).toBeLessThanOrEqual(-TREE_H); // die Box fasst die höchste Deko
    expect(STAMP_BOX.x1 - STAMP_BOX.x0).toBeGreaterThanOrEqual(ISO_W);
  });

  it('R5 Solitär ≥ 2 Kacheln vom Wald und ≤ 1 je 3 × 3 (Seeds 1–50, auch nach Rodung)', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      const items = decorItems(w);
      for (const it of items)
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            if (it.stamp !== 'solitaire') continue;
            const x = it.fp.x + dx,
              y = it.fp.y + dy;
            if (x < 0 || y < 0 || x >= isl.width || y >= isl.height) continue;
            expect(isl.tiles[y * isl.width + x]!.terrain, `Seed ${seed}`).not.toBe('forest');
          }
      for (const a of items)
        for (const b of items)
          if (a !== b)
            expect(
              Math.max(Math.abs(a.fp.x - b.fp.x), Math.abs(a.fp.y - b.fp.y)),
            ).toBeGreaterThanOrEqual(3);
    }
  });

  it('R5 Töne: ΔE2000 ≥ 20 zu den Signalfarben, ≥ 10 zu den Wassertönen', () => {
    for (const t of [...Object.values(DECOR_STAMP_TONES), ...Object.values(DECOR_TONES)]) {
      for (const n of SIGNAL_NAMES)
        expect(deltaE2000(lab(t), lab(PALETTE[n])), `${t} ~ ${n}`).toBeGreaterThanOrEqual(20);
      for (const n of ['waterDeep', 'waterMid', 'waterShallow'] as const)
        expect(deltaE2000(lab(t), lab(PALETTE[n])), `${t} ~ ${n}`).toBeGreaterThanOrEqual(10);
    }
  });
});

describe('Zeichnen, Zoomschwellen, Schatten', () => {
  const item = (stamp: StampKind): DecorItem => ({
    kind: 'decor',
    id: 100,
    fp: { x: 4, y: 4, w: 1, h: 1 },
    key: 8,
    stamp,
    variant: 1,
  });

  it('Zoomschwellen nach Katalog: A5/A6 ab 0,5, A9/A14 ab 0,75; save/restore ausgeglichen, Matrix unverändert', () => {
    expect(DECOR_MIN_ZOOM).toEqual({ solitaire: 0.5, orchard: 0.5, menhir: 0.75, ruin: 0.75 });
    for (const k of KINDS)
      for (const zoom of [0.25, 0.5, 0.6, 0.75, 1, 2]) {
        const f = fakeCtx();
        drawDecorStamp(f.ctx, { x: 0, y: 0, zoom }, item(k), 7);
        const drawn = f.log.events.filter((e) => e.op === 'drawImage').length;
        expect(drawn, `${k} @ ${zoom}`).toBe(zoom >= DECOR_MIN_ZOOM[k] ? 1 : 0);
        expect(f.log.saves).toBe(f.log.restores);
        expect(f.log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
      }
  });

  it('Schatten nur für A5/A6 (ein Polygon mit 12 Punkten im Kachelraum), keiner für Menhir und Mauerreste', () => {
    for (const k of ['solitaire', 'orchard'] as const) {
      const s = decorShadow(item(k))!;
      expect(s).toHaveLength(12);
      const cx = s.reduce((a, p) => a + p.x, 0) / 12,
        cy = s.reduce((a, p) => a + p.y, 0) / 12;
      expect(Math.hypot(cx - 4.5, cy - 4.5)).toBeLessThan(0.5);
    }
    expect(decorShadow(item('menhir'))).toBeNull();
    expect(decorShadow(item('ruin'))).toBeNull();
  });

  it('Stempel jeder Art und Variante lassen sich malen (keine Ausnahme, Zeichenaufrufe vorhanden)', () => {
    for (const k of KINDS)
      for (let v = 0; v < 4; v++) {
        const c = decorStampFor(7, k, v, 1)!;
        expect(c.width).toBe(STAMP_BOX.x1 - STAMP_BOX.x0);
        expect(c.height).toBe(STAMP_BOX.y1 - STAMP_BOX.y0);
      }
  });
});

describe('L4-T4 LRU des Deko-Stempel-Caches', () => {
  it('DECOR_CACHE_MAX_BYTES = 8 MiB; alle Arten × Varianten × Zoomstufen bleiben darunter', () => {
    expect(DECOR_CACHE_MAX_BYTES).toBe(8 * 1024 * 1024);
    for (const k of KINDS)
      for (let v = 0; v < 4; v++) for (const s of ZOOM_STEPS) decorStampFor(3, k, v, s);
    expect(decorCacheBytes()).toBeLessThanOrEqual(DECOR_CACHE_MAX_BYTES);
    expect(decorCacheSize()).toBe(KINDS.length * 4 * ZOOM_STEPS.length);
  });

  it('nach Füllen über die Grenze ≤ Grenze; der älteste Eintrag fliegt zuerst, ein Treffer verjüngt', () => {
    const one = decorStampFor(5, 'solitaire', 0, 1)!;
    const bytes = one.width * one.height * 4;
    resetDecorCache();
    const max = bytes * 3 + 1;
    for (const v of [0, 1, 2]) decorStampFor(5, 'solitaire', v, 1, max);
    expect(decorCacheKeys()).toEqual(['solitaire|0|4', 'solitaire|1|4', 'solitaire|2|4']);
    decorStampFor(5, 'solitaire', 0, 1, max); // Treffer: 0 wird der jüngste
    expect(decorCacheKeys()).toEqual(['solitaire|1|4', 'solitaire|2|4', 'solitaire|0|4']);
    decorStampFor(5, 'solitaire', 3, 1, max); // über die Grenze: der älteste (1) fliegt
    expect(decorCacheKeys()).toEqual(['solitaire|2|4', 'solitaire|0|4', 'solitaire|3|4']);
    expect(decorCacheBytes()).toBeLessThanOrEqual(max);
    for (const v of [0, 1, 2, 3]) decorStampFor(5, 'orchard', v, 1, max);
    expect(decorCacheBytes()).toBeLessThanOrEqual(max);
    expect(decorCacheSize()).toBe(3);
  });

  it('Wechsel des Seeds leert den Cache (cacheSeed), derselbe Seed nicht', () => {
    decorStampFor(1, 'menhir', 0, 1);
    decorStampFor(1, 'menhir', 1, 1);
    expect(decorCacheSize()).toBe(2);
    decorStampFor(2, 'menhir', 0, 1);
    expect(decorCacheSize()).toBe(1);
    expect(decorCacheClears()).toBe(1);
  });
});

describe('Abriss und Stempel (R3 im Bild)', () => {
  it('Nach Abriss kommen dieselben decor-Items zurück', () => {
    const w = createWorld(7, { unlockAll: true });
    const before = decorItems(w).map((i) => `${i.stamp}@${i.id}`);
    let id: number | undefined;
    for (let y = 20; y < 44 && id === undefined; y++)
      for (let x = 20; x < 44 && id === undefined; x++)
        if (canPlace(w, 'house', x, y).ok) id = placeBuilding(w, 'house', x, y).id;
    expect(demolish(w, id!).ok).toBe(true);
    expect(decorItems(w).map((i) => `${i.stamp}@${i.id}`)).toEqual(before);
  });
});
