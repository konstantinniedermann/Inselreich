import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, BuildingDefId, Tier } from '../../src/sim/types';
import { spriteBounds } from '../../src/render/iso';
import { SPRITE_CACHE_MAX_BYTES, SPRITE_MAX_BYTES } from '../../src/render/limits';
import { drawBody } from '../../src/render/sprites';
import { createSpriteCache, spriteKey, type SpriteSurface } from '../../src/render/spriteCache';
import { fakeCtx, type FakeCtx } from './fakeCtx';

const mk = (defId: BuildingDefId, x = 10, y = 10, tier?: Tier): Building => {
  const b: Building = { id: 1, defId, x, y, connected: true, progress: 0, state: 'ok', island: 0 };
  if (tier) b.house = { tier } as Building['house'];
  return b;
};

interface Surf extends SpriteSurface {
  log: FakeCtx;
}
function factory(): { make: () => SpriteSurface; made: Surf[] } {
  const made: Surf[] = [];
  return {
    made,
    make: () => {
      const { ctx, log } = fakeCtx();
      const s: Surf = { width: 0, height: 0, log, getContext: () => ctx };
      made.push(s);
      return s;
    },
  };
}
/** Aufzeichnender Zielkontext: nur drawImage-Aufrufe. */
function target(): { ctx: CanvasRenderingContext2D; calls: unknown[][] } {
  const calls: unknown[][] = [];
  const ctx = {
    drawImage: (...a: unknown[]) => calls.push(a),
  } as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}
const cam = (x = 0, y = 0, zoom = 1) => ({ x, y, zoom });

describe('H-R6 AK1 Schlüssel', () => {
  it('AK1 Schlüssel trennt Typ, Stufe, Env, Variante, Zoom, DPR', () => {
    const d = BUILDING_DEFS.house;
    const k = (tier: Tier, z = 1, dpr = 1, env = {}, v = 0) =>
      spriteKey(d, mk('house', 3, 4, tier), env, z, dpr, v);
    expect(k(1)).not.toBe(k(2));
    expect(k(1)).not.toBe(k(1, 2));
    expect(k(1)).not.toBe(k(1, 1, 2));
    expect(k(1)).not.toBe(k(1, 1, 1, { waterLeft: true }));
    expect(k(1)).not.toBe(k(1, 1, 1, {}, 1));
    expect(spriteKey(BUILDING_DEFS.market, mk('market'), {}, 1, 1, 0)).not.toBe(k(1));
  });
  it('AK-RND-02 Cache-Schlüssel enthält level', () => {
    const d = BUILDING_DEFS.fisher;
    const k = (level?: 2 | 3) =>
      spriteKey(d, { ...mk('fisher', 3, 4), ...(level ? { level } : {}) }, {}, 1, 1, 0);
    expect(new Set([k(), k(2), k(3)]).size).toBe(3); // fehlendes level = Stufe 1
  });
  it('AK1 Schlüssel ist positionsfrei (Silhouette liest b.x/b.y nur als Verschiebung)', () => {
    const d = BUILDING_DEFS.market;
    expect(spriteKey(d, mk('market', 1, 2), {}, 1, 1, 0)).toBe(
      spriteKey(d, mk('market', 30, 9), {}, 1, 1, 0),
    );
  });
  it('AK1 nicht schlüsselbare Eingaben (state, progress, id) ändern den Schlüssel nicht, Silhouette bleibt gleich', () => {
    const d = BUILDING_DEFS.sheepfarm;
    const a = mk('sheepfarm');
    const b = { ...a, id: 99, progress: 0.5, state: 'burning' as const };
    expect(spriteKey(d, a, {}, 1, 1, 0)).toBe(spriteKey(d, b, {}, 1, 1, 0));
    const f1 = fakeCtx(),
      f2 = fakeCtx();
    drawBody(f1.ctx, cam(), d, a, 0);
    drawBody(f2.ctx, cam(), d, b, 5000);
    expect(f2.log.events).toEqual(f1.log.events);
  });
});

describe('H-R6 AK2 Bildgleich', () => {
  const ids = Object.keys(BUILDING_DEFS) as BuildingDefId[];
  const cases: [BuildingDefId, Tier | undefined][] = [];
  for (const id of ids) {
    if (id === 'house') for (const t of [1, 2, 3, 4] as Tier[]) cases.push([id, t]);
    else cases.push([id, undefined]);
  }
  for (const [id, tier] of cases) {
    it(`AK2 ${id}${tier ?? ''}: Draw-Log des Befüllens == drawBody bis auf Translation; alles in der Fläche`, () => {
      const f = factory();
      const c = createSpriteCache({ factory: f.make });
      const def = BUILDING_DEFS[id];
      const b = mk(id, 12, 7, tier);
      const env = id === 'kontor' ? { waterLeft: true, waterV0: true } : undefined;
      const view = cam(40.5, 13.25, 1);
      c.beginFrame(1, 1);
      c.beginFrame(1, 1);
      const t = target();
      expect(c.draw(t.ctx, view, def, b, env)).toBe(true);
      const ref = fakeCtx();
      drawBody(ref.ctx, view, def, b, 0, env);
      const fill = f.made[0]!.log;
      // Translation = Ursprung der Fläche in Bildpunkten des ungecachten Wegs
      const o = spriteBounds(def, b);
      const dx = (o.x - view.x - c.margin) * 1 - 0;
      const dy = (o.y - view.y - c.margin) * 1;
      const rp = ref.log.allPoints,
        fp = fill.allPoints;
      expect(fp.length).toBe(rp.length);
      rp.forEach((p, i) => {
        expect(p.x - dx).toBeCloseTo(fp[i]!.x, 6);
        expect(p.y - dy).toBeCloseTo(fp[i]!.y, 6);
      });
      expect(fill.fillSet).toEqual(ref.log.fillSet);
      expect(fill.strokeSet).toEqual(ref.log.strokeSet);
      // Bounding-Box enthält jeden Punkt
      const s = f.made[0]!;
      for (const p of fp) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(s.width);
        expect(p.y).toBeLessThanOrEqual(s.height);
      }
    });
  }
  it('AK2 Stempel liegt auf dem Ursprung des ungecachten Wegs (Rundung auf Gerätepixel, <= 0,5 Pixel Versatz)', () => {
    for (const dpr of [1, 2]) {
      const f = factory();
      const c = createSpriteCache({ factory: f.make });
      const def = BUILDING_DEFS.market;
      const b = mk('market', 12, 7);
      const view = cam(40.37, 13.81, 1.5);
      c.beginFrame(1.5, dpr);
      c.beginFrame(1.5, dpr);
      const t = target();
      c.draw(t.ctx, view, def, b);
      const [, dx, dy, dw, dh] = t.calls[0] as number[];
      const o = spriteBounds(def, b);
      const ex = (o.x - c.margin - view.x) * 1.5,
        ey = (o.y - c.margin - view.y) * 1.5;
      expect(Math.abs(dx! - ex)).toBeLessThanOrEqual(0.5 / dpr + 1e-9);
      expect(Math.abs(dy! - ey)).toBeLessThanOrEqual(0.5 / dpr + 1e-9);
      expect(Math.round(dx! * dpr)).toBeCloseTo(dx! * dpr, 6); // auf Gerätepixel
      expect(dw! * dpr).toBe(f.made[0]!.width);
      expect(dh! * dpr).toBe(f.made[0]!.height);
    }
  });
  it('AK2 erster Frame nach Zoom-/DPR-Wechsel geht den alten Weg (Fallback), danach Cache', () => {
    const f = factory();
    const c = createSpriteCache({ factory: f.make });
    const def = BUILDING_DEFS.market;
    const t = target();
    c.beginFrame(1, 1);
    expect(c.draw(t.ctx, cam(), def, mk('market'))).toBe(false);
    c.beginFrame(1, 1);
    expect(c.draw(t.ctx, cam(), def, mk('market'))).toBe(true);
    c.beginFrame(1.01, 1);
    expect(c.draw(t.ctx, cam(0, 0, 1.01), def, mk('market'))).toBe(false);
  });
  it('AK2 ohne Fabrik (Node, Tests) bleibt der Cache aus', () => {
    const c = createSpriteCache({ factory: null });
    c.beginFrame(1, 1);
    c.beginFrame(1, 1);
    expect(c.draw(target().ctx, cam(), BUILDING_DEFS.market, mk('market'))).toBe(false);
  });
});

describe('H-R6 AK3 Invalidierung', () => {
  it('AK3 Zoom-Wechsel: kein Treffer mit altem Zoom, alter Bestand geräumt', () => {
    const f = factory();
    const c = createSpriteCache({ factory: f.make });
    const def = BUILDING_DEFS.market;
    const t = target();
    c.beginFrame(1, 1);
    c.beginFrame(1, 1);
    c.draw(t.ctx, cam(), def, mk('market'));
    expect(c.stats().entries).toBe(1);
    c.beginFrame(2, 1);
    expect(c.stats().entries).toBe(0);
    expect(c.stats().bytes).toBe(0);
    c.beginFrame(2, 1);
    c.draw(t.ctx, cam(0, 0, 2), def, mk('market'));
    expect(c.stats().hits).toBe(0);
    expect(c.stats().misses).toBe(2);
    c.beginFrame(2, 2); // DPR-Wechsel ebenso
    expect(c.stats().entries).toBe(0);
  });
  it('AK3 Zoom-Wischen erzeugt keine Einträge (nie zwei Frames gleicher Zoom)', () => {
    const f = factory();
    const c = createSpriteCache({ factory: f.make });
    const t = target();
    for (let i = 0; i < 40; i++) {
      const z = 0.5 + i * 0.03;
      c.beginFrame(z, 1);
      c.draw(t.ctx, cam(0, 0, z), BUILDING_DEFS.market, mk('market'));
    }
    expect(c.stats().entries).toBe(0);
    expect(f.made.length).toBe(0);
  });
});

describe('H-R6 AK4 Obergrenze', () => {
  it('AK4 benannte Konstanten: 64 MB gesamt, Einzelsprite kleiner', () => {
    expect(SPRITE_CACHE_MAX_BYTES).toBe(64 * 1024 * 1024);
    expect(SPRITE_MAX_BYTES).toBeLessThan(SPRITE_CACHE_MAX_BYTES);
  });
  it('AK4 Summe überschreitet die Grenze nie; LRU verdrängt den ältesten', () => {
    const f = factory();
    const one = createSpriteCache({ factory: f.make });
    one.beginFrame(1, 1);
    one.beginFrame(1, 1);
    one.draw(target().ctx, cam(), BUILDING_DEFS.market, mk('market'));
    const size = one.stats().bytes;
    const c = createSpriteCache({ factory: f.make, maxBytes: Math.floor(size * 2.5) });
    c.beginFrame(1, 1);
    c.beginFrame(1, 1);
    const t = target();
    const ids: BuildingDefId[] = ['market', 'market', 'market'];
    const envs = [{}, { waterLeft: true }, { waterRight: true }];
    ids.forEach((id, i) => {
      c.draw(t.ctx, cam(), BUILDING_DEFS[id], mk(id), envs[i]);
      expect(c.stats().bytes).toBeLessThanOrEqual(Math.floor(size * 2.5));
    });
    expect(c.stats().entries).toBe(2);
    // ältester (envs[0]) wurde verdrängt, jüngster noch da
    const before = c.stats().hits;
    c.draw(t.ctx, cam(), BUILDING_DEFS.market, mk('market'), envs[2]);
    expect(c.stats().hits).toBe(before + 1);
    c.draw(t.ctx, cam(), BUILDING_DEFS.market, mk('market'), envs[0]);
    expect(c.stats().hits).toBe(before + 1);
  });
  it('AK4 LRU: ein Treffer frischt auf', () => {
    const f = factory();
    const probe = createSpriteCache({ factory: f.make });
    probe.beginFrame(1, 1);
    probe.beginFrame(1, 1);
    probe.draw(target().ctx, cam(), BUILDING_DEFS.market, mk('market'));
    const size = probe.stats().bytes;
    const c = createSpriteCache({ factory: f.make, maxBytes: Math.floor(size * 2.5) });
    c.beginFrame(1, 1);
    c.beginFrame(1, 1);
    const t = target();
    const D = BUILDING_DEFS.market;
    c.draw(t.ctx, cam(), D, mk('market'), {}); // A
    c.draw(t.ctx, cam(), D, mk('market'), { waterLeft: true }); // B
    c.draw(t.ctx, cam(), D, mk('market'), {}); // A frisch
    c.draw(t.ctx, cam(), D, mk('market'), { waterRight: true }); // C verdrängt B
    const h = c.stats().hits;
    c.draw(t.ctx, cam(), D, mk('market'), {});
    expect(c.stats().hits).toBe(h + 1);
    c.draw(t.ctx, cam(), D, mk('market'), { waterLeft: true });
    expect(c.stats().hits).toBe(h + 1);
  });
  it('AK4 Sprite über der Einzelgrenze wird nicht gecacht (Fallback)', () => {
    const f = factory();
    const c = createSpriteCache({ factory: f.make, maxSpriteBytes: 100 });
    c.beginFrame(1, 1);
    c.beginFrame(1, 1);
    expect(c.draw(target().ctx, cam(), BUILDING_DEFS.market, mk('market'))).toBe(false);
    expect(c.stats().entries).toBe(0);
    expect(c.stats().bypassed).toBe(1);
    expect(f.made.length).toBe(0);
  });
  it('AK4 Fläche = Bounding-Box des Körpers, nicht der Bildschirm', () => {
    const f = factory();
    const c = createSpriteCache({ factory: f.make });
    c.beginFrame(1, 1);
    c.beginFrame(1, 1);
    const def = BUILDING_DEFS.chapel;
    c.draw(target().ctx, cam(), def, mk('chapel'));
    const o = spriteBounds(def, mk('chapel'));
    expect(f.made[0]!.width).toBe(Math.ceil(o.w + 2 * c.margin));
    expect(f.made[0]!.height).toBe(Math.ceil(o.h + 2 * c.margin));
  });
});

describe('H-R6 Freigabe', () => {
  it('Fläche hat nach evict und clear Breite und Höhe 0', () => {
    const f = factory();
    const probe = createSpriteCache({ factory: f.make });
    probe.beginFrame(1, 1);
    probe.beginFrame(1, 1);
    probe.draw(target().ctx, cam(), BUILDING_DEFS.market, mk('market'));
    const size = probe.stats().bytes;
    const c = createSpriteCache({ factory: f.make, maxBytes: Math.floor(size * 1.5) });
    c.beginFrame(1, 1);
    c.beginFrame(1, 1);
    const t = target();
    c.draw(t.ctx, cam(), BUILDING_DEFS.market, mk('market'), {});
    const first = f.made[f.made.length - 1]!;
    c.draw(t.ctx, cam(), BUILDING_DEFS.market, mk('market'), { waterLeft: true });
    expect([first.width, first.height]).toEqual([0, 0]); // verdrängt
    const second = f.made[f.made.length - 1]!;
    expect(second.width).toBeGreaterThan(0);
    c.clear();
    expect([second.width, second.height]).toEqual([0, 0]);
    c.draw(t.ctx, cam(), BUILDING_DEFS.market, mk('market'), {});
    const third = f.made[f.made.length - 1]!;
    c.beginFrame(2, 1); // Zoom-Wechsel räumt ebenfalls
    expect([third.width, third.height]).toEqual([0, 0]);
  });
});

describe('H-R6 AK6 Zähler', () => {
  it('AK6 Treffer, Fehlgriffe, Bytes, Einträge', () => {
    const f = factory();
    const c = createSpriteCache({ factory: f.make });
    c.beginFrame(1, 1);
    c.beginFrame(1, 1);
    const t = target();
    c.draw(t.ctx, cam(), BUILDING_DEFS.market, mk('market', 1, 1));
    c.draw(t.ctx, cam(), BUILDING_DEFS.market, mk('market', 20, 5));
    const s = c.stats();
    expect(s.misses).toBe(1);
    expect(s.hits).toBe(1);
    expect(s.entries).toBe(1);
    expect(s.bytes).toBe(f.made[0]!.width * f.made[0]!.height * 4);
    expect(f.made.length).toBe(1);
  });
});
