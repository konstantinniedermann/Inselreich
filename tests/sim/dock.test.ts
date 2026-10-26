import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding } from '../../src/sim/build';
import { dockFor, homeAnchor, laneTicks } from '../../src/sim/islands';
import { seaMask } from '../../src/sim/mapgen';
import { canPlace, siteRuleOk } from '../../src/sim/placement';
import { deserialize, serialize } from '../../src/sim/save';
import { seaRoute } from '../../src/sim/seaRoute';
import { lanePoints, shipPose } from '../../src/render/shipLane';
import type { Terrain, World } from '../../src/sim/types';
import { home } from '../../src/sim/world';
import { SEED_D37 } from './seePins';
import { seaWorld, shipLiteral } from './seaHelpers';

const N = 8;

/** 8 x 8: Rand Wasser, Land innen; `water` setzt weitere Wasserkacheln. */
function island(water: [number, number][] = []): Terrain[] {
  const t: Terrain[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++)
      t.push(x === 0 || y === 0 || x === N - 1 || y === N - 1 ? 'water' : 'grass');
  for (const [x, y] of water) t[y * N + x] = 'water';
  return t;
}

const inRing = (p: { x: number; y: number }, k: { x: number; y: number }): boolean =>
  p.x >= k.x - 1 &&
  p.x <= k.x + 2 &&
  p.y >= k.y - 1 &&
  p.y <= k.y + 2 &&
  !(p.x >= k.x && p.x <= k.x + 1 && p.y >= k.y && p.y <= k.y + 1);

describe('HAFEN S1 dockFor', () => {
  it('AK-HF-01: nimmt die nächste Meer-Ringkachel, Binnensee nie', () => {
    // Kontor (1,1): Binnensee (3,2) liegt im Ring, zählt nicht als Meer.
    const t = island([[3, 2]]);
    const d = dockFor(t, N, N, { x: 1, y: 1 });
    const sea = seaMask(t, N, N);
    expect(sea[2 * N + 3]).toBe(false);
    expect(sea[d.y * N + d.x]).toBe(true);
    expect(inRing(d, { x: 1, y: 1 })).toBe(true);
    // (0,2) und (2,0) sind gleich weit; das kleinere y gewinnt.
    expect(d).toEqual({ x: 2, y: 0 });
  });

  it('AK-HF-01: Gleichstand ergibt kleineres y, dann kleineres x', () => {
    const t = island();
    // Kontor (1,1): (0,2) und (2,0) gleich weit; y gewinnt.
    expect(dockFor(t, N, N, { x: 1, y: 1 })).toEqual({ x: 2, y: 0 });
    // Kontor (5,5): (7,6) und (6,7) gleich weit; kleineres y gewinnt.
    expect(dockFor(t, N, N, { x: 5, y: 5 })).toEqual({ x: 7, y: 6 });
  });

  it('AK-HF-01: Gleichstand bei gleichem y ergibt kleineres x', () => {
    // Kontor (3,3): Meerkanäle von oben bis (3,2) und (5,2), beide gleich weit zu (4,4).
    const t = island([
      [3, 1],
      [3, 2],
      [5, 1],
      [5, 2],
    ]);
    expect(dockFor(t, N, N, { x: 3, y: 3 })).toEqual({ x: 3, y: 2 });
  });

  it('AK-HF-02: ohne Meer im Ring Rückfall auf homeAnchor', () => {
    const t = island();
    const k = { x: 3, y: 3 };
    expect(dockFor(t, N, N, k)).toEqual(homeAnchor(t, N, N, k));
  });

  it('Wächter: für jeden seaCoast-Platz liegt dockFor als Meerkachel im Ring', () => {
    for (const seed of [1, 2, 3, 37]) {
      const w: World = seaWorld(seed);
      for (let i = 1; i < w.islands.length; i++) {
        const isl = w.islands[i]!;
        const terrain = isl.tiles.map((t) => t.terrain);
        const sea = seaMask(terrain, isl.width, isl.height);
        for (let y = 0; y < isl.height - 1; y++)
          for (let x = 0; x < isl.width - 1; x++) {
            const land = [0, 1].every((dy) =>
              [0, 1].every((dx) => terrain[(y + dy) * isl.width + x + dx] !== 'water'),
            );
            if (!land) continue;
            if (!siteRuleOk(w, 'kontor2', x, y, { kind: 'seaCoast' }, i).ok) continue;
            const d = dockFor(terrain, isl.width, isl.height, { x, y });
            expect(inRing(d, { x, y }), `Seed ${seed} Insel ${i} (${x},${y})`).toBe(true);
            expect(sea[d.y * isl.width + d.x]).toBe(true);
          }
      }
    }
  });
});

type Spot = { x: number; y: number };

/** Reich genug für Kontor II (nur im Test). */
function rich(w: World): World {
  w.money = 1e9;
  for (const g of Object.keys(home(w).stock)) (home(w).stock as Record<string, number>)[g] = 1e6;
  return w;
}

const terrainOf = (w: World, i: number): Terrain[] => w.islands[i]!.tiles.map((t) => t.terrain);
const dockAt = (w: World, i: number, p: Spot): Spot =>
  dockFor(terrainOf(w, i), w.islands[i]!.width, w.islands[i]!.height, p);

/** Alle Plätze der Insel, an denen Kontor II baubar ist (feste Scanreihenfolge); Vorfilter spart `canPlace` auf Wasser. */
function sitesOf(w: World, i: number): Spot[] {
  const isl = w.islands[i]!;
  const t = terrainOf(w, i);
  const dry = (x: number, y: number): boolean => t[y * isl.width + x] !== 'water';
  const out: Spot[] = [];
  for (let y = 0; y < isl.height - 1; y++)
    for (let x = 0; x < isl.width - 1; x++) {
      if (!dry(x, y) || !dry(x + 1, y) || !dry(x, y + 1) || !dry(x + 1, y + 1)) continue;
      if (canPlace(w, 'kontor2', x, y, i).ok) out.push({ x, y });
    }
  return out;
}

/** Jeder `n`-te Platz plus erster und letzter (Randplätze). */
const thinned = (sites: Spot[], n: number): Spot[] =>
  sites.filter((_, k) => k % n === 0 || k === sites.length - 1);

const lastPoint = (pts: readonly Spot[]): Spot => pts[pts.length - 1]!;

describe('HAFEN S1 Anker folgt Kontor', () => {
  it('AK-HF-04: Anker = dockFor und höchstens 2,2 Kacheln von der Kontormitte', () => {
    // Eine Welt je Seed: bauen, prüfen, abreissen (R4: Abriss lässt den Anker, der nächste Bau überschreibt ihn).
    for (const seed of [1, 2, 3, 37]) {
      const w = rich(seaWorld(seed));
      for (let i = 1; i < w.islands.length; i++) {
        for (const p of thinned(sitesOf(w, i), 4)) {
          const dock = dockAt(w, i, p);
          const r = placeBuilding(w, 'kontor2', p.x, p.y, i);
          expect(r.ok, `S${seed} I${i}`).toBe(true);
          const a = w.islands[i]!.anchor;
          expect(a).toEqual(dock);
          expect(Math.hypot(a.x + 0.5 - (p.x + 1), a.y + 0.5 - (p.y + 1))).toBeLessThanOrEqual(2.2);
          expect(demolish(w, r.id!).ok).toBe(true);
        }
      }
    }
  });

  it('AK-HF-05: Abriss ändert den Anker nicht, ein neuer Bau verschiebt ihn, das Schiff liegt dort', () => {
    const w = rich(seaWorld(SEED_D37));
    const [p, q] = sitesOf(w, 1).filter((s, k, all) => k === 0 || k === all.length - 1) as [
      Spot,
      Spot,
    ];
    expect(dockAt(w, 1, p)).not.toEqual(dockAt(w, 1, q));
    const r = placeBuilding(w, 'kontor2', p.x, p.y, 1);
    expect(r.ok).toBe(true);
    const before = { ...w.islands[1]!.anchor };
    expect(demolish(w, r.id!).ok).toBe(true);
    expect(w.islands[1]!.anchor).toEqual(before);
    expect(placeBuilding(w, 'kontor2', q.x, q.y, 1).ok).toBe(true);
    const anchor = w.islands[1]!.anchor;
    expect(anchor).toEqual(dockAt(w, 1, q));
    const ship = shipLiteral(w, { port: 1 });
    const pose = shipPose(w, ship);
    const isl = w.islands[1]!;
    expect(pose).toMatchObject({ x: isl.ox + anchor.x + 0.5, y: isl.oy + anchor.y + 0.5 });
  });

  it('AK-HF-06: Seeweg-, Linien- und Fahrzeit-Caches folgen dem neuen Anker', () => {
    const w = rich(seaWorld(SEED_D37));
    const site = sitesOf(w, 1).at(-1)!;
    const old = { ...w.islands[1]!.anchor };
    expect(dockAt(w, 1, site)).not.toEqual(old);
    seaRoute(w.islands, 0, 1);
    lanePoints(w, 0, 1);
    laneTicks(w.islands, 0, 1);
    expect(placeBuilding(w, 'kontor2', site.x, site.y, 1).ok).toBe(true);
    const isl = w.islands[1]!;
    const dock = dockAt(w, 1, site);
    const want = { x: isl.ox + dock.x + 0.5, y: isl.oy + dock.y + 0.5 };
    expect(lastPoint(seaRoute(w.islands, 0, 1))).toEqual(want);
    expect(lastPoint(lanePoints(w, 0, 1))).toEqual(want);
    const loaded = deserialize(serialize(w));
    if (!loaded.ok) throw new Error(loaded.reason);
    expect(laneTicks(w.islands, 0, 1)).toBe(laneTicks(loaded.world.islands, 0, 1));
  });

  it('AK-HF-06: shipPose (Fahrzeit-Cache) eines laufenden Schiffs folgt dem neuen Anker', () => {
    const w = rich(seaWorld(SEED_D37));
    const site = sitesOf(w, 1).at(-1)!;
    const total = laneTicks(w.islands, 0, 1);
    const ship = shipLiteral(w, { port: 0, to: 1, left: 1 });
    const posed = (x: World): Spot => {
      const p = shipPose(x, ship);
      return { x: p.x, y: p.y };
    };
    const before = posed(w);
    expect(total).toBeGreaterThan(1);
    expect(placeBuilding(w, 'kontor2', site.x, site.y, 1).ok).toBe(true);
    const loaded = deserialize(serialize(w));
    if (!loaded.ok) throw new Error(loaded.reason);
    const fresh = loaded.world;
    fresh.ships = w.ships.map((s) => ({ ...s }));
    expect(posed(w)).not.toEqual(before);
    expect(posed(w)).toEqual(posed(fresh));
  });

  it('AK-HF-08: gleicher Seed, gleiche Baufolge, gleiche Anker und Routen', () => {
    const run = (): { anchors: string; route: string } => {
      const w = rich(seaWorld(SEED_D37));
      const site = sitesOf(w, 1).at(-1)!;
      placeBuilding(w, 'kontor2', site.x, site.y, 1);
      return {
        anchors: JSON.stringify(w.islands.map((i) => i.anchor)),
        route: JSON.stringify(seaRoute(w.islands, 0, 1)),
      };
    };
    expect(run()).toEqual(run());
  });

  it('Randfall: Abriss mit Schiff unterwegs bleibt verwehrt, Anker und Kontor bleiben', () => {
    const w = rich(seaWorld(SEED_D37));
    const site = sitesOf(w, 1)[0]!;
    const r = placeBuilding(w, 'kontor2', site.x, site.y, 1);
    const anchor = { ...w.islands[1]!.anchor };
    shipLiteral(w, { port: 0, to: 1, left: 5 });
    expect(demolish(w, r.id!)).toEqual({ ok: false, reason: 'Erst Route auflösen' });
    expect(w.islands[1]!.anchor).toEqual(anchor);
    expect(w.buildings[r.id!]).toBeDefined();
  });
});

describe('HAFEN S1 Neubau rechnet laufende Fahrten um', () => {
  /** Fahrzeit Heimat–Insel 1 je Platz (bauen, lesen, abreissen); Plätze dünn, Zeit nach R392. */
  function extremes(w: World): { far: Spot; near: Spot; tFar: number; tNear: number } {
    const rows = thinned(sitesOf(w, 1), 6).map((s) => {
      const r = placeBuilding(w, 'kontor2', s.x, s.y, 1);
      const t = laneTicks(w.islands, 0, 1);
      demolish(w, r.id!);
      return { s, t };
    });
    rows.sort((a, b) => b.t - a.t);
    const far = rows[0]!;
    const near = rows[rows.length - 1]!;
    return { far: far.s, near: near.s, tFar: far.t, tNear: near.t };
  }

  /** Ankerwechsel P (weit) -> Q (nah) mit einem Schiff; liefert die Welt nach dem Bau. */
  function rebuild(ship: (tFar: number) => Parameters<typeof shipLiteral>[1]) {
    const w = rich(seaWorld(SEED_D37));
    const { far, near, tFar, tNear } = extremes(w);
    expect(tNear).toBeLessThan(tFar);
    const r = placeBuilding(w, 'kontor2', far.x, far.y, 1);
    expect(demolish(w, r.id!).ok).toBe(true);
    const s = shipLiteral(w, ship(tFar));
    expect(placeBuilding(w, 'kontor2', near.x, near.y, 1).ok).toBe(true);
    return { w, s, tFar, tNear };
  }

  it('B1: Heimfahrt mit voller Restzeit bleibt ladbar, left folgt der neuen Fahrzeit', () => {
    const { w, s, tNear } = rebuild((t) => ({
      port: 1,
      to: 0,
      left: t,
      route: null,
      homing: true,
    }));
    expect(s.left).toBe(tNear);
    expect(deserialize(serialize(w)).ok).toBe(true);
  });

  it('B1: Hinfahrt (to = Insel) wird ebenso umgerechnet und bleibt ladbar', () => {
    const { w, s, tNear } = rebuild((t) => ({ port: 0, to: 1, left: t }));
    expect(s.left).toBe(tNear);
    expect(deserialize(serialize(w)).ok).toBe(true);
  });

  it('B1: kleinere Restzeit skaliert nur mit dem Verhältnis, mindestens 1', () => {
    const { w, s, tFar, tNear } = rebuild(() => ({
      port: 1,
      to: 0,
      left: 100,
      route: null,
      homing: true,
    }));
    expect(s.left).toBe(Math.max(1, Math.ceil((100 * tNear) / tFar)));
    expect(s.left).toBeLessThanOrEqual(100);
    expect(deserialize(serialize(w)).ok).toBe(true);
  });

  it('B1: Schiffe anderer Inseln und liegende Schiffe bleiben unberührt', () => {
    const { s: other } = rebuild(() => ({ port: 0, to: 2, left: 7 }));
    expect(other.left).toBe(7);
    const { s: idle } = rebuild(() => ({ port: 1, to: null, left: 0 }));
    expect(idle.left).toBe(0);
  });
});
