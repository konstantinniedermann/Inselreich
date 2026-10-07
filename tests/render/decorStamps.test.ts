import { beforeEach, describe, expect, it } from 'vitest';
import { demolish, placeBuilding } from '../../src/sim/build';
import { clearForest, plantForest } from '../../src/sim/forest';
import { createWorld, home } from '../../src/sim/world';
import { canPlace } from '../../src/sim/placement';
import type { GoodId, World } from '../../src/sim/types';
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
  ruinBlocks,
  setDecorCanvasFactory,
  stampHeight,
  treeShape,
  type DecorItem,
} from '../../src/render/decorStamps';
import { DECOR_TONES } from '../../src/render/groundDecor';
import { ISO_H, ISO_W, ZOOM_STEPS, buildingHulls, sortedObjects } from '../../src/render/iso';
import { DECOR_CACHE_MAX_BYTES } from '../../src/render/limits';
import { PALETTE, SIGNAL_NAMES, rgbOfCss } from '../../src/render/palette';
import { TREE_H, crownScreen } from '../../src/render/trees';
import { treesOf, woodWorld } from './woodHelpers';
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

  it('R5 Solitär ≥ 2 Kacheln vom Wald und ≤ 1 je 3 × 3 (Seeds 1–50), auch nach Roden und Aufforsten', () => {
    /** Prüft R5 am jetzigen Stand und liefert die Stempel. */
    const check = (w: World, label: string): DecorItem[] => {
      const isl = home(w);
      const items = decorItems(w);
      for (const it of items) {
        if (it.stamp !== 'solitaire') continue;
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const x = it.fp.x + dx,
              y = it.fp.y + dy;
            if (x < 0 || y < 0 || x >= isl.width || y >= isl.height) continue;
            if (isl.tiles[y * isl.width + x]!.terrain === 'forest')
              throw new Error(`${label}: Solitär ${it.fp.x},${it.fp.y} nahe Wald ${x},${y}`);
          }
      }
      for (const a of items)
        for (const b of items)
          if (a !== b)
            expect(
              Math.max(Math.abs(a.fp.x - b.fp.x), Math.abs(a.fp.y - b.fp.y)),
              label,
            ).toBeGreaterThanOrEqual(3);
      return items;
    };
    let rodungen = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const w = createWorld(seed, { unlockAll: true });
      w.money = 1e9;
      const isl = home(w);
      for (const k of Object.keys(isl.stock)) isl.stock[k as GoodId] = 500;
      const start = check(w, `Seed ${seed}`);
      const key = (l: DecorItem[]): string[] => l.map((i) => `${i.stamp}@${i.id}`);
      // Roden: bis zu 5 Waldkacheln um die Mitte; bestehende Stempel bleiben, R5 gilt weiter
      const cx = isl.width >> 1,
        cy = isl.height >> 1;
      const woods: number[] = [];
      for (let i = 0; i < isl.tiles.length && woods.length < 5; i++) {
        const x = (i + cx * 7) % isl.width,
          y = (((i / isl.width) | 0) + cy) % isl.height;
        if (isl.tiles[y * isl.width + x]!.terrain === 'forest') woods.push(y * isl.width + x);
      }
      for (const t of woods) if (clearForest(w, t % isl.width, (t / isl.width) | 0).ok) rodungen++;
      const cut = check(w, `Seed ${seed} nach Roden`);
      for (const k of key(start))
        expect(key(cut), `Seed ${seed}: Roden entfernt keinen Stempel`).toContain(k);
      // Aufforsten: eine Wiesenkachel neben einem Stempel; R5 gilt weiter, andere Stempel bleiben
      const target = cut.find((i) => i.stamp === 'solitaire');
      if (target) {
        const px = target.fp.x + 1,
          py = target.fp.y;
        if (plantForest(w, px, py).ok) {
          const planted = check(w, `Seed ${seed} nach Aufforsten`);
          expect(key(planted)).not.toContain(`solitaire@${target.id}`);
          for (const k of key(planted))
            expect(key(cut), `Seed ${seed}: Aufforsten fügt nichts hinzu`).toContain(k);
        }
      }
    }
    expect(rodungen).toBeGreaterThan(20);
  }, 40_000); // H-T7: lokal bis 4,7 s (WALD-02: Wald je Roden/Aufforsten neu gelegt), Timeout >= 8 x (R270)

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

describe('Bild-Fix 3: Kronensprache und Mauerreste', () => {
  it('A5/A6 Krone aus 5–7 überlappenden Lappen, Höhe ≈ 0,75 × Breite; Solitär ×1,3–1,5 breiter als eine Waldkrone, Obstbaum kleiner', () => {
    // mittlere Breite einer Waldkrone (Laubbäume einer echten Karte, WALD-02)
    let sum = 0,
      n = 0;
    for (const c of treesOf(woodWorld(7)))
      if (c.kind === 0 && !c.bush && !c.dead) {
        sum += 2 * crownScreen(c).rx;
        n++;
      }
    const forestW = sum / n;
    expect(n).toBeGreaterThan(5);
    for (let v = 0; v < 4; v++) {
      const sol = treeShape('solitaire', v),
        orc = treeShape('orchard', v);
      for (const t of [sol, orc]) {
        expect(t.lobes).toBeGreaterThanOrEqual(5);
        expect(t.lobes).toBeLessThanOrEqual(7);
        expect(t.hh / t.hw, `Verhältnis Höhe/Breite ${v}`).toBeGreaterThan(0.6);
        expect(t.hh / t.hw).toBeLessThan(0.85);
      }
      expect((2 * sol.hw) / forestW, `Solitär ${v}: Breite gegen Waldkrone`).toBeGreaterThanOrEqual(
        1.3,
      );
      expect(2 * orc.hw).toBeLessThan(2 * sol.hw);
      expect(sol.cy - sol.hh, 'Stamm sichtbar unter der Krone').toBeGreaterThan(2);
    }
    expect(
      new Set([0, 1, 2, 3].map((v) => treeShape('solitaire', v).crown.s)).size,
    ).toBeGreaterThanOrEqual(3);
  });

  it('A14 niedrige, lange, gebrochene Linie aus 4 ungleich hohen Segmenten mit Lücken; Kontrast zum Gras gesenkt', () => {
    for (let v = 0; v < 4; v++) {
      const b = ruinBlocks(v);
      expect(b).toHaveLength(4);
      const hs = new Set(b.map((x) => x.h));
      expect(hs.size).toBeGreaterThanOrEqual(3);
      for (const x of b) expect(x.h).toBeLessThanOrEqual(0.35 * ISO_H);
      // Lücken: entlang der Linie überlappen sich die Segmente nicht
      const alongY = (v & 2) !== 0;
      const seg = b
        .map((x) => (alongY ? [x.y0, x.y1] : [x.x0, x.x1]) as [number, number])
        .sort((p, q) => p[0] - q[0]);
      for (let i = 1; i < seg.length; i++)
        expect(seg[i]![0] - seg[i - 1]![1], `Lücke ${v}/${i}`).toBeGreaterThan(0.02);
      const len = seg[seg.length - 1]![1] - seg[0]![0];
      expect(len).toBeGreaterThan(0.7); // lang
    }
    // Kontrast: die Mauertöne liegen näher am Gras als die Felstöne
    const grass = lab(PALETTE.grass);
    expect(deltaE2000(lab(DECOR_STAMP_TONES.ruinTop), grass)).toBeLessThan(
      deltaE2000(lab(DECOR_TONES.rockLight), grass),
    );
    expect(deltaE2000(lab(DECOR_STAMP_TONES.ruinSide), grass)).toBeLessThan(
      deltaE2000(lab(DECOR_TONES.rockMid), grass),
    );
  });
});
