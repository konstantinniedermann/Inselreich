import { beforeAll, describe, expect, it } from 'vitest';
import { seaRoute } from '../../src/sim/seaRoute';
import { createWorld, home } from '../../src/sim/world';
import { seaContext, seaPlan } from '../../src/render/decor';
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
