import { describe, expect, it, vi } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, BuildingDefId, Tier } from '../../src/sim/types';
import { bodyHeight, spriteBounds } from '../../src/render/iso';
import { SPRITE_CACHE_MAX_BYTES } from '../../src/render/limits';
import { bodyFaces, bodyPolygons, drawBody } from '../../src/render/sprites';
import { VARIANT_COUNT, VARIANT_LOOKS, variantOf } from '../../src/render/variants';
import { createSpriteCache, spriteKey, type SpriteSurface } from '../../src/render/spriteCache';
import { drawMaterial, materialDetail } from '../../src/render/material';
import { PALETTE, rgbOfCss } from '../../src/render/palette';
import { fakeCtx } from './fakeCtx';

const mk = (defId: BuildingDefId, x = 10, y = 10, tier?: Tier): Building => {
  const b: Building = { id: 1, defId, x, y, connected: true, progress: 0, state: 'ok', island: 0 };
  if (tier) b.house = { tier } as Building['house'];
  return b;
};
// Stand H-R10 (Ein Licht, R211): Referenzhashes nach der Umstellung auf LIGHT_TONE/SHADE_TONE und Eigenton-Kontur neu gesetzt.
const MAIN_REF: Record<string, string> = {
  kontor: 'a630d7cc',
  market: '61e6db9a',
  house1: '14861ff2',
  house2: '4c80cd28',
  house3: '611f4b70',
  house4: 'ce4a8339',
  fisher: 'a1b70b5a',
  lumberjack: 'b27952d8',
  quarry: '8eff9a26',
  sheepfarm: '10e3ecec',
  weaver: '20175742',
  canefarm: 'c2e5e10',
  distillery: '3a7d2e85',
  toolmaker: 'd5f25f4a',
  chapel: '8ff21308',
  school: 'daa74c30',
  firestation: '36618272',
  bathhouse: '3d41c34f',
  glassworks: 'cf4dd49d',
  townhall: '56e4c56',
};
/**
 * Hash der Aufzeichnung (FNV-1a über JSON, Zahlen auf 1/1000 gerundet). Die Referenzwerte stammten aus dem Stand
 * main @ 4a5130e (vor H-R7) und sind seit H-R8 bewusst neu gesetzt: Dach- und Giebelpfade zeichnen mit
 * lineJoin 'round' (R195, die Aufzeichnung trägt lineJoin). Markt und Badehaus (ohne drawShell) blieben gleich.
 * Gebäude bei (12, 7), Kamera (0, 0, Zoom 1), Variante 0.
 */
function hashEvents(ev: unknown[]): string {
  const s = JSON.stringify(ev, (_k, v) =>
    typeof v === 'number' ? Math.round(v * 1000) / 1000 : v,
  );
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
}

/** Aufzeichnender Kontext für Striche: Teilpfade als Strecken `[Punkt, Punkt]`, nur Pfadbefehle. */
function segmentCtx(): { ctx: CanvasRenderingContext2D; segs: { x: number; y: number }[][] } {
  const segs: { x: number; y: number }[][] = [];
  let last: { x: number; y: number } | null = null;
  let pending: { x: number; y: number }[][] = [];
  const rec: Record<string, unknown> = {
    beginPath: () => {
      pending = [];
      last = null;
    },
    moveTo: (x: number, y: number) => {
      last = { x, y };
    },
    lineTo: (x: number, y: number) => {
      const p = { x, y };
      if (last) pending.push([last, p]);
      last = p;
    },
    stroke: () => {
      segs.push(...pending);
    },
  };
  const ctx = new Proxy(rec, {
    get: (t, k) => (k in t ? t[k as string] : () => undefined),
    set: () => true,
  }) as unknown as CanvasRenderingContext2D;
  return { ctx, segs };
}
const inPolyT = (poly: readonly { x: number; y: number }[], x: number, y: number): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!,
      c = poly[j]!;
    if (a.y > y !== c.y > y && x < ((c.x - a.x) * (y - a.y)) / (c.y - a.y) + a.x) inside = !inside;
  }
  return inside;
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
  it('AK1 Variante 0 zeichnet bytegleich wie die Referenz (lineJoin-Stand H-R8; Hash der Aufzeichnung)', () => {
    for (const [id, tier] of cases) {
      // hunter/cattlefarm (M11) existierten auf 4a5130e nicht; ihr Variante-0-Determinismus ist durch den
      // Zweimal-Test oben gedeckt.
      if (id === 'hunter' || id === 'cattlefarm') continue;
      const b = mk(id, 12, 7, tier);
      expect(hashEvents(events(BUILDING_DEFS[id], b, 0)), `${id}${tier ?? ''}`).toBe(
        MAIN_REF[tier ? id + tier : id],
      );
    }
  });
});

describe('H-R8 AK6 lineJoin round an Dachwinkeln', () => {
  const roofed: [BuildingDefId, Tier?][] = [
    ['house', 1],
    ['house', 2],
    ['house', 3],
    ['house', 4],
    ['kontor'],
    ['lumberjack'],
  ];
  for (const [id, tier] of roofed) {
    it(`AK6 ${id}${tier ?? ''}: Dachstriche mit lineJoin round, Wandstriche und Endzustand miter`, () => {
      const f = fakeCtx();
      const cam = { x: 0, y: 0, zoom: 1 };
      const b = mk(id, 12, 7, tier);
      drawBody(f.ctx, cam, BUILDING_DEFS[id], b, 0, undefined, 0);
      const strokes = f.log.events.filter((e) => e.op === 'stroke');
      const round = strokes.filter((e) => e.lineJoin === 'round');
      expect(round.length).toBeGreaterThan(0);
      expect(round.length).toBeLessThan(strokes.length); // nur Dach-/Giebelpfade, nicht jeder Strich
      expect(f.log.lineJoin).toBe('miter');
      expect(f.log.saves).toBe(f.log.restores);
    });
  }
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
      const vs = new Set<number>();
      for (let i = 0; i < 40; i++) vs.add(variantOf(4242, 3 + i * 2, 5 + i));
      expect(vs.size).toBeGreaterThanOrEqual(2);
      const [va, vb] = [...vs] as [number, number];
      const b = mk(id, 10, 10, tier);
      expect(events(def, b, va)).not.toEqual(events(def, b, vb));
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

/** Mindestabstand (RGB, 0..441) zweier Varianten in mindestens einer Füllfarbe: etwa 12 % Mischung auf mittleren Tönen. */
const MIN_COLOR_DISTANCE = 20;

describe('H-R7 Fix 2 A: Varianz deutlich sichtbar', () => {
  /** Füllfarben je Fläche (Schlüssel = gerundete Eckpunkte), nur Flächen, die in beiden Varianten vorkommen. */
  const fills = (id: BuildingDefId, tier: Tier | undefined, v: number): Map<string, string> => {
    const m = new Map<string, string>();
    for (const e of events(BUILDING_DEFS[id], mk(id, 12, 7, tier), v))
      if (e.op === 'fill')
        m.set(
          e.points.map((p) => `${Math.round(p.x * 10)},${Math.round(p.y * 10)}`).join(';'),
          e.style,
        );
    return m;
  };
  const dist = (a: string, b: string): number => {
    const [p, q] = [rgbOfCss(a), rgbOfCss(b)];
    return Math.hypot(p[0]! - q[0]!, p[1]! - q[1]!, p[2]! - q[2]!);
  };
  for (const [id, tier] of cases) {
    it(`Fix2 A ${id}${tier ?? ''}: alle Varianten-Paare unterscheiden sich in einer Füllfarbe um >= ${MIN_COLOR_DISTANCE}`, () => {
      for (let a = 0; a < VARIANT_COUNT; a++)
        for (let b = a + 1; b < VARIANT_COUNT; b++) {
          const fa = fills(id, tier, a),
            fb = fills(id, tier, b);
          let max = 0;
          for (const [k, c] of fa) if (fb.has(k)) max = Math.max(max, dist(c, fb.get(k)!));
          expect(max, `Varianten ${a}/${b}`).toBeGreaterThanOrEqual(MIN_COLOR_DISTANCE);
        }
    });
  }
});

describe('H-R7 Fix 3: Sättigung bleibt', () => {
  const sat = (css: string): number => {
    const [r, g, b] = rgbOfCss(css) as [number, number, number];
    const mx = Math.max(r, g, b);
    return mx === 0 ? 0 : (mx - Math.min(r, g, b)) / mx;
  };
  /** Ein kräftiger Ton (Sättigung >= 0,25) verliert in einer Variante höchstens 30 % seiner Sättigung (Typ-Identität). */
  const MIN_KEEP = 0.7;
  for (const [id, tier] of cases) {
    it(`Fix3 ${id}${tier ?? ''}: kräftige Töne bleiben in allen Varianten kräftig`, () => {
      const fills = (v: number) => {
        const m = new Map<string, string>();
        for (const e of events(BUILDING_DEFS[id], mk(id, 12, 7, tier), v))
          if (e.op === 'fill')
            m.set(
              e.points.map((p) => `${Math.round(p.x * 10)},${Math.round(p.y * 10)}`).join(';'),
              e.style,
            );
        return m;
      };
      const base = fills(0);
      for (let v = 1; v < VARIANT_COUNT; v++)
        for (const [k, c] of fills(v)) {
          const c0 = base.get(k);
          if (c0 && sat(c0) >= 0.25)
            expect(sat(c), `v${v} ${c0} -> ${c}`).toBeGreaterThanOrEqual(sat(c0) * MIN_KEEP - 1e-9);
        }
    });
  }
});

describe('H-R7 Fix 2 B: Cache-Fläche schneidet nichts ab', () => {
  it('Fix2 B alle Typen: Pfadpunkte samt halber Strichbreite liegen in der Fläche (Zoom 1/1,5/2, DPR 1/2, mit Material)', () => {
    for (const z of [1, 1.5, 2])
      for (const dpr of [1, 2])
        for (const [id, tier] of cases) {
          const logs: ReturnType<typeof fakeCtx>['log'][] = [];
          const surfaces: SpriteSurface[] = [];
          const c = createSpriteCache({
            material: true,
            factory: () => {
              const { ctx, log } = fakeCtx();
              logs.push(log);
              const sf = { width: 0, height: 0, getContext: () => ctx } as SpriteSurface;
              surfaces.push(sf);
              return sf;
            },
          });
          const t = { drawImage: () => undefined } as unknown as CanvasRenderingContext2D;
          c.beginFrame(z, dpr);
          c.beginFrame(z, dpr);
          const b = mk(id, 12, 7, tier);
          c.draw(t, { x: 3.3, y: 4.1, zoom: z }, BUILDING_DEFS[id], b, undefined, 3);
          const sf = surfaces[0]!,
            log = logs[0]!;
          const half = dpr / 2; // Umrissstrich 1 CSS-Pixel
          for (const p of log.allPoints) {
            const m = `${id}${tier ?? ''} z${z} dpr${dpr}`;
            expect(p.x, m).toBeGreaterThanOrEqual(half);
            expect(p.y, m).toBeGreaterThanOrEqual(half);
            expect(p.x, m).toBeLessThanOrEqual(sf.width - half);
            expect(p.y, m).toBeLessThanOrEqual(sf.height - half);
          }
        }
  });
});

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
    });
  }
  it('AK5 kein Materialstrich liegt unter einer später gezeichneten Fläche (alle Typen, Stufen, Varianten, Zoom 0,75/1/1,5)', () => {
    let segsChecked = 0;
    for (const [id, tier] of cases)
      for (let v = 0; v < VARIANT_COUNT; v++)
        for (const z of [0.75, 1, 1.5]) {
          const def = BUILDING_DEFS[id];
          const b = mk(id, 12, 7, tier);
          const fs = bodyFaces(def, b, v, { x: 0, y: 0, zoom: z });
          const r = segmentCtx();
          drawMaterial(r.ctx, fs, def, b, v, z);
          for (const seg of r.segs) {
            const [p, q] = [seg[0]!, seg[1]!];
            // Stützpunkte entlang der Strecke (inneres 90 %, Kanten der Fläche ausgenommen); oberste Fläche je Punkt
            const tops = [0.05, 0.25, 0.5, 0.75, 0.95].map((t) => {
              const x = p.x + (q.x - p.x) * t,
                y = p.y + (q.y - p.y) * t;
              let top = -1;
              fs.forEach((f, i) => {
                // gedeckt nur, wenn auch die Umgebung (±0,1 px) in der Fläche liegt: streifende Ecken zählen nicht
                const e = 0.1;
                if (
                  inPolyT(f.pts, x, y) &&
                  inPolyT(f.pts, x + e, y) &&
                  inPolyT(f.pts, x - e, y) &&
                  inPolyT(f.pts, x, y + e) &&
                  inPolyT(f.pts, x, y - e)
                )
                  top = i;
              });
              return top;
            });
            expect(new Set(tops).size, `${id}${tier ?? ''} v${v} z${z}`).toBe(1);
            expect(tops[0]).toBeGreaterThanOrEqual(0);
            segsChecked++;
          }
        }
    expect(segsChecked).toBeGreaterThan(500);
  });
  it('AK5 drawBody zeichnet in jeder Variante gleich viele Striche wie Variante 0 (Material nur im Cache)', () => {
    const strokes = (id: BuildingDefId, tier: Tier | undefined, v: number) =>
      events(BUILDING_DEFS[id], mk(id, 12, 7, tier), v).filter((e) => e.op === 'stroke').length;
    for (const [id, tier] of cases)
      for (let v = 1; v < VARIANT_COUNT; v++)
        expect(strokes(id, tier, v)).toBe(strokes(id, tier, 0));
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
  it('AK7 bei Zoom 2 / DPR 2 überschreitet die volle Matrix das Limit um höchstens 25 % (dokumentiert in variants.ts)', () => {
    // Volle Matrix 76,1 MB gegen 64 MB (+19 %, M11: hunter und cattlefarm dazu; vorher 66,7 MB); der Cache bleibt per LRU auf
    // SPRITE_CACHE_MAX_BYTES gedeckelt. Alle Kombinationen zugleich im Bild sind möglich, aber selten.
    const margin = createSpriteCache({ factory: null }).margin;
    let total = 0;
    for (const [id, tier] of cases) {
      const sb = spriteBounds(BUILDING_DEFS[id], mk(id, 10, 10, tier));
      const px = Math.ceil((sb.w + 2 * margin) * 4) * Math.ceil((sb.h + 2 * margin) * 4) * 4;
      total += px * VARIANT_COUNT;
    }
    expect(total).toBeGreaterThan(SPRITE_CACHE_MAX_BYTES * 0.9);
    expect(total).toBeLessThanOrEqual(SPRITE_CACHE_MAX_BYTES * 1.25);
  });
  it('AK7 Variantenzahl ist begrenzt (Cache-Speicher)', () => {
    expect(VARIANT_COUNT).toBeLessThanOrEqual(6);
  });
});
