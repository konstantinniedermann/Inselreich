import { beforeAll, describe, expect, it } from 'vitest';
import { deserialize, serialize } from '../../src/sim/save';
import { seaRoute } from '../../src/sim/seaRoute';
import { createWorld, home } from '../../src/sim/world';
import {
  SEA_LANE_GAP,
  seaContext,
  seaKeepOut,
  seaClearance,
  seaPlan,
  seaPlanKeepOut,
  seaElementTiles,
} from '../../src/render/decor';
import { seaTintFor } from '../../src/render/seaFields';

const routeCache = new WeakMap<object, { x: number; y: number }[][]>();
const routesOf = (w: ReturnType<typeof createWorld>): { x: number; y: number }[][] => {
  let r = routeCache.get(w);
  if (!r) routeCache.set(w, (r = allRoutes(w)));
  return r;
};

/** Alle Routenpaare a<b der Welt (wie `routeFar`, fauna.ts) im Heimat-Kachelraum. */
function allRoutes(w: ReturnType<typeof createWorld>): { x: number; y: number }[][] {
  const h = home(w);
  const out: { x: number; y: number }[][] = [];
  for (let a = 0; a < w.islands.length; a++)
    for (let b = a + 1; b < w.islands.length; b++)
      out.push(seaRoute(w.islands, a, b).map((q) => ({ x: q.x - h.ox, y: q.y - h.oy })));
  return out;
}

function distToPolyline(px: number, py: number, pts: { x: number; y: number }[]): number {
  let d = Infinity;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!,
      b = pts[i]!;
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - a.x) * dx + (py - a.y) * dy) / l2));
    d = Math.min(d, Math.hypot(px - a.x - t * dx, py - a.y - t * dy));
  }
  return d;
}

const worlds = new Map<number, ReturnType<typeof createWorld>>();
const worldOf = (seed: number): ReturnType<typeof createWorld> => {
  let w = worlds.get(seed);
  if (!w) worlds.set(seed, (w = createWorld(seed)));
  return w;
};

/** Messung: Meer-Elemente (Wrack, Eiland, Felsen) <= 2 Kacheln von irgendeiner Route, Seeds 1-40. */
function messen(): { near: number; total: number; nearNoNeedle: number; totalNoNeedle: number } {
  let near = 0,
    total = 0,
    nearNoNeedle = 0,
    totalNoNeedle = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const w = worldOf(seed);
    const plan = seaPlan(seed, home(w), seaContext(w));
    const routes = routesOf(w);
    const els: { x: number; y: number; needle: boolean }[] = [];
    if (plan.wreck) els.push({ ...plan.wreck, needle: false });
    if (plan.islet) els.push({ ...plan.islet, needle: false });
    for (const r of plan.rocks) els.push({ x: r.x, y: r.y, needle: r.needle });
    for (const e of els) {
      const hit = routes.some((r) => distToPolyline(e.x + 0.5, e.y + 0.5, r) <= 2);
      total++;
      if (hit) near++;
      if (!e.needle) {
        totalNoNeedle++;
        if (hit) nearNoNeedle++;
      }
    }
  }
  return { near, total, nearNoNeedle, totalNoNeedle };
}

/** Hash (FNV-1a) ueber Tint-Felder, Seeds 1-40. */
function tintHash(): number {
  let h = 2166136261;
  const mix = (v: number): void => {
    h = Math.imul(h ^ (v | 0), 16777619) >>> 0;
  };
  for (let seed = 1; seed <= 40; seed++) {
    const t = seaTintFor(worldOf(seed));
    mix(seed);
    if (!t) {
      mix(-1);
      continue;
    }
    mix(t.w);
    mix(t.h);
    for (const m of t.mask) mix(m);
    for (const f of [t.sand, t.reef, t.kelp]) for (const v of f) mix(Math.round(v * 1e4));
  }
  return h;
}

describe('SEE-F1-KORRIDOR K1', () => {
  beforeAll(() => {
    // Weltbau, Plan, Routen und Toenung waermen (zaehlen nicht zur Testzeit)
    for (let seed = 1; seed <= 40; seed++) {
      const w = worldOf(seed);
      seaPlan(seed, home(w), seaContext(w));
      routesOf(w);
      seaTintFor(w);
    }
  }, 20000);

  it('AK-K1 Meer-Elemente <= 2 Kacheln von einer Route: Anteil <= 5 % (Seeds 1-40)', () => {
    const m = messen();
    // Ausgangswert auf main (Messung dieses Tests, alle Routenpaare a<b, Schwelle <= 2 Kacheln, Kachelmitte):
    // inkl. Felsnadeln 31/265 = 11,7 %, exkl. Nadeln 30/251 = 12,0 %. (lead-qa: 29/275; 39/265 aus R369 nur Obergrenze.)
    // Dieser Test ist vor K3 gewollt ROT.
    expect(m.total).toBeGreaterThan(200);
    expect(m.near / m.total).toBeLessThanOrEqual(0.05);
  });

  it('AK-K1b Pin: Hash seaTintFor Seeds 1-40 (Flaechen bleiben bitgleich zu main)', () => {
    // Auf main aufgenommen; bleibt bis zum Ende von SEE-F1-KORRIDOR unveraendert.
    expect(tintHash()).toBe(683761494);
  });
});

/** Hash ueber seaKeepOut (pad 0/1) und seaClearance (auf 1e-6) einer Kachelstichprobe, Seeds 1-5. */
function clearanceHash(): number {
  let h = 2166136261;
  const mix = (v: number): void => {
    h = Math.imul(h ^ (v | 0), 16777619) >>> 0;
  };
  for (let seed = 1; seed <= 5; seed++) {
    const ctx = seaContext(worldOf(seed));
    for (let y = 0; y < 120; y += 3)
      for (let x = 0; x < 120; x += 3) {
        mix(seaKeepOut(ctx, x, y) ? 1 : 0);
        mix(seaKeepOut(ctx, x, y, 1) ? 1 : 0);
        const c = seaClearance(ctx, x + 0.5, y + 0.5, 0.5);
        mix(Number.isFinite(c) ? Math.round(c * 1e6) : 7);
      }
  }
  return h;
}

describe('SEE-F1-KORRIDOR K2', () => {
  it('AK-K2 seaContext.routes: alle Paare a<b, Heimat-Kachelraum, entspricht der Messmenge', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const w = worldOf(seed);
      expect(seaContext(w).routes).toEqual(allRoutes(w));
    }
  });

  it('AK-K2 seaPlanKeepOut sperrt Kacheln <= GAP+pad an einer Route, davon unabhaengig bleibt seaKeepOut', () => {
    let gesperrt = 0,
      nurRoute = 0;
    for (let seed = 1; seed <= 3; seed++) {
      const w = worldOf(seed);
      const ctx = seaContext(w);
      const isl = home(w);
      for (const pad of [0, 1])
        for (let y = 0; y < isl.height; y += 2)
          for (let x = 0; x < isl.width; x += 2) {
            const d = Math.min(...ctx.routes.map((r) => distToPolyline(x + 0.5, y + 0.5, r)));
            const expected = seaKeepOut(ctx, x, y, pad) || d < SEA_LANE_GAP + pad;
            expect(seaPlanKeepOut(ctx, x, y, pad)).toBe(expected);
            if (d < SEA_LANE_GAP + pad) {
              gesperrt++;
              if (!seaKeepOut(ctx, x, y, pad)) nurRoute++;
            }
          }
    }
    expect(gesperrt).toBeGreaterThan(0);
    expect(nurRoute).toBeGreaterThan(0); // die Route sperrt mehr als die Geraden
  });

  it('AK-K2 seaKeepOut und seaClearance bitgleich zu main (Stichprobe, Hash auf main aufgenommen)', () => {
    expect(clearanceHash()).toBe(1496395851);
  });

  it('AK-K2 routes sind Kopien: Mutation wirkt nicht auf seaRoute', () => {
    const w = createWorld(7);
    const before = JSON.stringify(allRoutes(w));
    const ctx = seaContext(w);
    for (const r of ctx.routes) for (const q of r) q.x += 50;
    ctx.routes.splice(0);
    expect(JSON.stringify(allRoutes(w))).toBe(before);
    expect(JSON.stringify(seaRoute(w.islands, 0, 1))).toBe(
      JSON.stringify(seaRoute(w.islands, 0, 1)),
    );
  });

  it('AK-K2 Punktreihenfolge der Route aendert die Sperrmenge nicht', () => {
    const w = worldOf(3);
    const ctx = seaContext(w);
    const rev = { ...ctx, routes: ctx.routes.map((r) => [...r].reverse()) };
    const isl = home(w);
    for (let y = 0; y < isl.height; y += 2)
      for (let x = 0; x < isl.width; x += 2)
        for (const pad of [0, 1])
          expect(seaPlanKeepOut(rev, x, y, pad)).toBe(seaPlanKeepOut(ctx, x, y, pad));
  });
});

const key = (p: { x: number; y: number }): string => `${p.x},${p.y}`;
const flaechen = (plan: ReturnType<typeof seaPlan>): string =>
  JSON.stringify({ s: plan.sandbanks, r: plan.reefs, k: plan.kelp });

describe('SEE-F1-KORRIDOR K3 seaPlan Zwei-Durchgang', () => {
  it('AK-K3 Elemente halten seaPlanKeepOut ein, meiden Flaechenkacheln samt Rand und halten Abstand >= 3', () => {
    let n = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const w = worldOf(seed);
      const ctx = seaContext(w);
      const plan = seaPlan(seed, home(w), ctx);
      const area = new Set<string>();
      for (const a of [...plan.sandbanks, ...plan.reefs, ...plan.kelp])
        for (const t of a.tiles)
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) area.add(key({ x: t.x + dx, y: t.y + dy }));
      const els = seaElementTiles(plan).filter((e) => ['wreck', 'rock', 'islet'].includes(e.kind));
      els.forEach((e, i) => {
        n++;
        const pad = e.kind === 'wreck' ? 0.5 : e.kind === 'islet' ? 1 : 0;
        expect(seaPlanKeepOut(ctx, e.x, e.y, pad), `Seed ${seed} ${e.kind}`).toBe(false);
        expect(area.has(key(e)), `Seed ${seed} ${e.kind} auf Flaeche`).toBe(false);
        for (const f of els.slice(i + 1))
          expect(
            Math.max(Math.abs(e.x - f.x), Math.abs(e.y - f.y)),
            `Seed ${seed}`,
          ).toBeGreaterThanOrEqual(3);
      });
    }
    expect(n).toBeGreaterThan(200);
  });

  it('AK-K3 Flaechen (Sandbank, Riff, Tang) von seaPlan sind unabhaengig von den Routen (routes=[] gleich)', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const w = createWorld(seed);
      const ctx = seaContext(w);
      const full = seaPlan(seed, home(w), ctx);
      const bare = { ...ctx, routes: [] };
      const other = createWorld(seed);
      const plan0 = seaPlan(seed, home(other), bare);
      expect(flaechen(plan0), `Seed ${seed}`).toBe(flaechen(full));
    }
  });

  it('AK-K3 Speichern -> Laden und kalter Cache geben denselben Plan', () => {
    for (const seed of [3, 7, 21]) {
      const w = worldOf(seed);
      const plan = seaPlan(seed, home(w), seaContext(w));
      const r = deserialize(serialize(w));
      if (!r.ok) throw new Error(r.reason);
      const plan2 = seaPlan(seed, home(r.world), seaContext(r.world));
      expect(JSON.stringify(plan2)).toBe(JSON.stringify(plan));
    }
  });

  it('AK-K3 kalter Cache: frische Insel und frischer Kontext geben denselben Plan wie der gehaltene (voll)', () => {
    for (const seed of [2, 9, 33]) {
      const w = worldOf(seed);
      const ctx = seaContext(w);
      const voll = seaPlan(seed, home(w), ctx);
      expect(seaPlan(seed, home(w), ctx)).toBe(voll); // gehalten
      const frisch = createWorld(seed);
      const ctx2 = { ...ctx, routes: ctx.routes.map((r) => r.map((q) => ({ ...q }))) }; // neues Objekt: leerer ctxKey-Cache
      expect(JSON.stringify(seaPlan(seed, home(frisch), ctx2))).toBe(JSON.stringify(voll));
    }
  });
});
