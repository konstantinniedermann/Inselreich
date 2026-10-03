import { describe, expect, it, vi } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, BuildingDefId, Tier } from '../../src/sim/types';
import { bodyHeight, spriteBounds } from '../../src/render/iso';
import { SPRITE_CACHE_MAX_BYTES } from '../../src/render/limits';
import { bodyFaces, bodyPolygons, drawBody } from '../../src/render/sprites';
import { VARIANT_COUNT, VARIANT_LOOKS, variantOf } from '../../src/render/variants';
import { createSpriteCache, spriteKey, type SpriteSurface } from '../../src/render/spriteCache';
import { drawMaterial, materialDetail } from '../../src/render/material';
import { PALETTE } from '../../src/render/palette';
import { fakeCtx } from './fakeCtx';

const mk = (defId: BuildingDefId, x = 10, y = 10, tier?: Tier): Building => {
  const b: Building = { id: 1, defId, x, y, connected: true, progress: 0, state: 'ok' };
  if (tier) b.house = { tier } as Building['house'];
  return b;
};
const ids = Object.keys(BUILDING_DEFS) as BuildingDefId[];
const cases: [BuildingDefId, Tier | undefined][] = [];
for (const id of ids) {
  if (id === 'house') for (const t of [1, 2, 3, 4] as Tier[]) cases.push([id, t]);
  else cases.push([id, undefined]);
}
const cam = { x: 0, y: 0, zoom: 1 };
const events = (def: (typeof BUILDING_DEFS)[BuildingDefId], b: Building, v: number) => {
  const f = fakeCtx();
  drawBody(f.ctx, cam, def, b, 0, undefined, v);
  return f.log.events;
};

describe('H-R7 AK1 Determinismus', () => {
  it('AK1 variantOf ist rein, liegt in [0, VARIANT_COUNT) und hängt von seed, x, y ab', () => {
    const rnd = vi.spyOn(Math, 'random');
    const seen = new Set<number>();
    for (let x = 0; x < 30; x++)
      for (let y = 0; y < 30; y++) {
        const v = variantOf(7, x, y);
        expect(v).toBe(variantOf(7, x, y));
        expect(Number.isInteger(v) && v >= 0 && v < VARIANT_COUNT).toBe(true);
        seen.add(v);
      }
    expect(seen.size).toBe(VARIANT_COUNT);
    const a: number[] = [],
      b: number[] = [];
    for (let i = 0; i < 40; i++) {
      a.push(variantOf(1, i, 3));
      b.push(variantOf(2, i, 3));
    }
    expect(a).not.toEqual(b);
    expect(rnd).not.toHaveBeenCalled();
    rnd.mockRestore();
  });
  it('AK1 gleiche Welt, gleiche Kamera: zweimal gezeichnet ist die Aufzeichnung gleich', () => {
    for (const [id, tier] of cases) {
      const def = BUILDING_DEFS[id];
      for (let v = 0; v < VARIANT_COUNT; v++) {
        const b = mk(id, 12, 7, tier);
        expect(events(def, b, v)).toEqual(events(def, b, v));
      }
    }
  });
  it('AK1 Variante 0 zeichnet wie bisher (keine Farbmischung)', () => {
    const f = fakeCtx();
    drawBody(f.ctx, cam, BUILDING_DEFS.market, mk('market'), 0);
    expect(events(BUILDING_DEFS.market, mk('market'), 0)).toEqual(f.log.events);
  });
});

describe('H-R7 AK2 Varianz sichtbar', () => {
  it('AK2 mindestens 3 Varianten, Look 0 ist neutral', () => {
    expect(VARIANT_COUNT).toBeGreaterThanOrEqual(3);
    expect(VARIANT_LOOKS).toHaveLength(VARIANT_COUNT);
    expect(VARIANT_LOOKS[0]!.wall).toBeNull();
    expect(VARIANT_LOOKS[0]!.roof).toBeNull();
  });
  for (const [id, tier] of cases) {
    it(`AK2 ${id}${tier ?? ''}: über eine Beispielwelt entstehen >= 2 Varianten, Aufzeichnungen unterscheiden sich`, () => {
      const def = BUILDING_DEFS[id];
      const vs = new Map<number, Building>();
      for (let i = 0; i < 40 && vs.size < 2; i++) {
        const b = mk(id, 3 + i * 2, 5 + i, tier);
        vs.set(variantOf(4242, b.x, b.y), b);
      }
      expect(vs.size).toBeGreaterThanOrEqual(2);
      const [[va, ba], [vb, bb]] = [...vs.entries()] as [number, Building][];
      expect(events(def, mk(id, 10, 10, tier), va)).not.toEqual(
        events(def, mk(id, 10, 10, tier), vb),
      );
      void ba;
      void bb;
    });
  }
  it('AK2 der Variantenindex steckt im Schlüssel', () => {
    const d = BUILDING_DEFS.house;
    const keys = new Set<string>();
    for (let v = 0; v < VARIANT_COUNT; v++)
      keys.add(spriteKey(d, mk('house', 1, 1, 2), {}, 1, 1, v));
    expect(keys.size).toBe(VARIANT_COUNT);
  });
  it('AK2 Cache: draw(…, variant) legt je Variante einen eigenen Eintrag an', () => {
    const c = createSpriteCache({
      factory: () => {
        const { ctx } = fakeCtx();
        return { width: 0, height: 0, getContext: () => ctx } as SpriteSurface;
      },
    });
    const target = { drawImage: () => undefined } as unknown as CanvasRenderingContext2D;
    c.beginFrame(1, 1);
    c.beginFrame(1, 1);
    for (let v = 0; v < VARIANT_COUNT; v++)
      c.draw(target, cam, BUILDING_DEFS.market, mk('market'), undefined, v);
    expect(c.stats().entries).toBe(VARIANT_COUNT);
  });
});

/** Abdeckung der gezeichneten Flächen auf einem Raster (Picking-relevant), als Menge von Zellen. */
function coverage(
  polys: readonly (readonly { x: number; y: number }[])[],
  b: ReturnType<typeof spriteBounds>,
) {
  const inPoly = (poly: readonly { x: number; y: number }[], x: number, y: number): boolean => {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const a = poly[i]!,
        c = poly[j]!;
      if (a.y > y !== c.y > y && x < ((c.x - a.x) * (y - a.y)) / (c.y - a.y) + a.x)
        inside = !inside;
    }
    return inside;
  };
  const out: string[] = [];
  for (let y = b.y - 2; y < b.y + b.h + 2; y += 1.5)
    for (let x = b.x - 2; x < b.x + b.w + 2; x += 1.5)
      if (polys.some((p) => inPoly(p, x, y))) out.push(`${x},${y}`);
  return out;
}

describe('H-R7 AK3/AK4 Silhouette und Picking', () => {
  for (const [id, tier] of cases) {
    it(`AK3 ${id}${tier ?? ''}: Hülle (spriteBounds, bodyHeight) und Gesamtumriss der Flächen sind über alle Varianten gleich`, () => {
      const def = BUILDING_DEFS[id];
      const b = mk(id, 12, 7, tier);
      const bounds = spriteBounds(def, b);
      const h = bodyHeight(def, b);
      const base = coverage(bodyPolygons(def, b, 0), bounds);
      expect(base.length).toBeGreaterThan(20);
      for (let v = 1; v < VARIANT_COUNT; v++) {
        expect(spriteBounds(def, b)).toEqual(bounds);
        expect(bodyHeight(def, b)).toBe(h);
        // AK4: dieselbe überdeckte Fläche, also dasselbe Pick-Ergebnis in jeder Variante
        expect(coverage(bodyPolygons(def, b, v), bounds)).toEqual(base);
      }
    });
  }
  it('AK4 Standardaufruf bodyPolygons(def, b) entspricht Variante 0 (Picking kennt die Variante nicht)', () => {
    const b = mk('house', 5, 5, 3);
    expect(bodyPolygons(BUILDING_DEFS.house, b)).toEqual(bodyPolygons(BUILDING_DEFS.house, b, 0));
  });
  it('AK3 Körperzeichner nutzen nur Pfade: keine Clips, keine Verläufe', () => {
    for (const [id, tier] of cases)
      for (let v = 0; v < VARIANT_COUNT; v++) {
        const f = fakeCtx();
        const grad = vi.spyOn(f.log, 'createLinearGradient');
        drawBody(f.ctx, cam, BUILDING_DEFS[id], mk(id, 12, 7, tier), 0, undefined, v);
        expect(f.log.events.some((e) => e.op === 'clip')).toBe(false);
        expect(grad).not.toHaveBeenCalled();
      }
  });
});

describe('H-R7 AK5 Material', () => {
  const faces = (id: BuildingDefId, tier?: Tier, z = 1) =>
    bodyFaces(BUILDING_DEFS[id], mk(id, 12, 7, tier), 1, { x: 0, y: 0, zoom: z });
  it('AK5 Detailstufe wächst mit dem Zoom, bei kleinem Zoom entfällt das Material', () => {
    expect(materialDetail(0.5)).toBe(0);
    expect(materialDetail(0.75)).toBeLessThan(materialDetail(1.5));
    expect(materialDetail(1)).toBeLessThanOrEqual(materialDetail(1.5));
    expect(materialDetail(2)).toBeGreaterThanOrEqual(materialDetail(1.5));
  });
  it('AK5 bei Zoom 0,5 keine Zeichenaufrufe, bei 1,5 mehr als bei 0,75', () => {
    const run = (z: number) => {
      const f = fakeCtx();
      drawMaterial(f.ctx, faces('house', 2, z), BUILDING_DEFS.house, mk('house', 12, 7, 2), 3, z);
      return f.log.events.length;
    };
    expect(run(0.5)).toBe(0);
    expect(run(0.75)).toBeGreaterThan(0);
    expect(run(1.5)).toBeGreaterThanOrEqual(run(0.75));
  });
  for (const [id, tier] of cases) {
    it(`AK5 ${id}${tier ?? ''}: nur Strich-Pfade, runde Verbindungen, konstante Strichbreite, alle Punkte in den Flächen`, () => {
      const z = 1.5;
      const def = BUILDING_DEFS[id];
      const b = mk(id, 12, 7, tier);
      const fs = bodyFaces(def, b, 2, { x: 0, y: 0, zoom: z });
      const f = fakeCtx();
      drawMaterial(f.ctx, fs, def, b, 2, z);
      const ev = f.log.events;
      expect(ev.every((e) => e.op === 'stroke')).toBe(true);
      expect(new Set(ev.map((e) => e.lineWidth)).size).toBeLessThanOrEqual(1);
      expect((f.log as unknown as { lineJoin?: string }).lineJoin).toBe('round');
      expect((f.log as unknown as { lineCap?: string }).lineCap).toBe('round');
      expect(f.log.saves).toBe(f.log.restores);
      // Punkte liegen in den Umrissen der Flächen (also in spriteBounds, nie am Rand der Fläche abgeschnitten)
      const xs = fs.flatMap((q) => q.pts.map((p) => p.x)),
        ys = fs.flatMap((q) => q.pts.map((p) => p.y));
      for (const p of f.log.allPoints) {
        expect(p.x).toBeGreaterThanOrEqual(Math.min(...xs) - 1e-6);
        expect(p.x).toBeLessThanOrEqual(Math.max(...xs) + 1e-6);
        expect(p.y).toBeGreaterThanOrEqual(Math.min(...ys) - 1e-6);
        expect(p.y).toBeLessThanOrEqual(Math.max(...ys) + 1e-6);
      }
    });
  }
  it('AK5 Material nur im Cache: drawBody selbst zeichnet keine Strich-Fugen mehr als vorher', () => {
    const b = mk('house', 12, 7, 2);
    const f = fakeCtx();
    drawBody(f.ctx, cam, BUILDING_DEFS.house, b, 0, undefined, 2);
    const strokes = f.log.events.filter((e) => e.op === 'stroke').length;
    const fills = f.log.events.filter((e) => e.op === 'fill').length;
    expect(strokes).toBeLessThanOrEqual(fills + 10);
  });
  it('AK5 Material ist deterministisch und nutzt nur Palettenfarben (kein Signal)', () => {
    const def = BUILDING_DEFS.house;
    const b = mk('house', 12, 7, 1);
    const run = () => {
      const f = fakeCtx();
      drawMaterial(f.ctx, bodyFaces(def, b, 3, { x: 0, y: 0, zoom: 1.5 }), def, b, 3, 1.5);
      return f.log;
    };
    expect(run().events).toEqual(run().events);
    const sig = [PALETTE.signalRed, PALETTE.signalYellow, PALETTE.signalWarn, PALETTE.signalOk];
    for (const s of run().strokeSet) for (const c of sig) expect(s.toLowerCase()).not.toBe(c);
  });
  it('AK5 Cache mit Material zeichnet Material in die Fläche, ohne läuft wie bisher', () => {
    const mkCache = (material: boolean) => {
      const logs: ReturnType<typeof fakeCtx>['log'][] = [];
      const c = createSpriteCache({
        material,
        factory: () => {
          const { ctx, log } = fakeCtx();
          logs.push(log);
          return { width: 0, height: 0, getContext: () => ctx } as SpriteSurface;
        },
      });
      const t = { drawImage: () => undefined } as unknown as CanvasRenderingContext2D;
      c.beginFrame(1.5, 2);
      c.beginFrame(1.5, 2);
      c.draw(
        t,
        { x: 3, y: 4, zoom: 1.5 },
        BUILDING_DEFS.house,
        mk('house', 12, 7, 1),
        undefined,
        1,
      );
      return logs[0]!;
    };
    expect(mkCache(true).events.length).toBeGreaterThan(mkCache(false).events.length);
  });
});

describe('H-R7 AK7 Speicher', () => {
  it('AK7 volle Matrix (alle Typen und Stufen x Varianten, Zoom 1, DPR 2) bleibt im Limit', () => {
    const margin = createSpriteCache({ factory: null }).margin;
    let total = 0;
    for (const [id, tier] of cases) {
      const def = BUILDING_DEFS[id];
      const sb = spriteBounds(def, mk(id, 10, 10, tier));
      const px = Math.ceil((sb.w + 2 * margin) * 2) * Math.ceil((sb.h + 2 * margin) * 2) * 4;
      total += px * VARIANT_COUNT;
    }
    expect(total).toBeLessThanOrEqual(SPRITE_CACHE_MAX_BYTES);
  });
  it('AK7 Variantenzahl ist begrenzt (Cache-Speicher)', () => {
    expect(VARIANT_COUNT).toBeLessThanOrEqual(6);
  });
});
