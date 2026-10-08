// Fahrlinie über Wasser (SEE-F1 T1): nur Wasserkacheln, Tiefwasser bevorzugt, deterministisch.
import { describe, expect, it } from 'vitest';
import { ROUTE_MAX_NODES } from '../../src/sim/defs/sea';
import { laneTicks, seaLanes, type Pt } from '../../src/sim/islands';
import { seaRoute } from '../../src/sim/seaRoute';
import { deserialize, serialize } from '../../src/sim/save';
import type { Island, World } from '../../src/sim/types';
import { seaWorld } from './seaHelpers';

const SEEDS = Array.from({ length: 20 }, (_, i) => 100 + i * 7);

function isWater(islands: readonly Island[], p: Pt): boolean {
  const X = Math.floor(p.x);
  const Y = Math.floor(p.y);
  for (const isl of islands) {
    const x = X - isl.ox;
    const y = Y - isl.oy;
    if (x >= 0 && y >= 0 && x < isl.width && y < isl.height)
      if (isl.tiles[y * isl.width + x]!.terrain !== 'water') return false;
  }
  return true;
}

const pairs = (w: World): [number, number][] =>
  w.islands.slice(1).map((_, i): [number, number] => [0, i + 1]);

const length = (pts: readonly Pt[]): number =>
  pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i]!.x, p.y - pts[i]!.y), 0);

/** Kleinster Abstand eines Punktes zu einer Landkachel (Mitte), grob, in Kacheln. */
function landDist(islands: readonly Island[], p: Pt): number {
  let best = Infinity;
  for (const isl of islands)
    for (let y = 0; y < isl.height; y++)
      for (let x = 0; x < isl.width; x++)
        if (isl.tiles[y * isl.width + x]!.terrain !== 'water')
          best = Math.min(best, Math.hypot(isl.ox + x + 0.5 - p.x, isl.oy + y + 0.5 - p.y));
  return best;
}

describe('seaRoute', () => {
  it('AK1/AK2: Start und Ende sind die Anker, alle Punkte liegen auf Wasser', () => {
    for (const seed of SEEDS) {
      const w = seaWorld(seed);
      for (const [a, b] of pairs(w)) {
        const r = seaRoute(w.islands, a, b);
        const ia = w.islands[a]!;
        const ib = w.islands[b]!;
        expect(r[0]).toEqual({ x: ia.ox + ia.anchor.x + 0.5, y: ia.oy + ia.anchor.y + 0.5 });
        expect(r[r.length - 1]).toEqual({
          x: ib.ox + ib.anchor.x + 0.5,
          y: ib.oy + ib.anchor.y + 0.5,
        });
        for (const p of r)
          expect(isWater(w.islands, p), `seed ${seed} ${a}-${b} ${p.x},${p.y}`).toBe(true);
      }
    }
  });

  it('AK3: gleiche Eingabe gibt gleiche Route (auch ohne Cache)', () => {
    for (const seed of SEEDS.slice(0, 5)) {
      const w1 = seaWorld(seed);
      const w2 = seaWorld(seed);
      expect(seaRoute(w1.islands, 0, 1)).toEqual(seaRoute(w2.islands, 0, 1));
      expect(seaRoute(w1.islands, 0, 1)).toBe(seaRoute(w1.islands, 0, 1));
    }
  });

  it('AK4: Länge zwischen 1,0 und 1,8 mal Gerade (Gerade quert Land, Umweg ist Geometrie)', () => {
    for (const seed of SEEDS) {
      const w = seaWorld(seed);
      for (const [a, b] of pairs(w)) {
        const straight = seaLanes(w.islands).find((l) => l.a === a && l.b === b)!.points;
        const ratio = length(seaRoute(w.islands, a, b)) / length(straight);
        expect(ratio).toBeGreaterThanOrEqual(1 - 1e-9);
        expect(ratio).toBeLessThanOrEqual(1.8);
      }
    }
  });

  it('AK5: mittlerer Landabstand mindestens so gross wie bei der Geraden', () => {
    let routeSum = 0;
    let straightSum = 0;
    for (const seed of SEEDS.slice(0, 6)) {
      const w = seaWorld(seed);
      const straight = seaLanes(w.islands).find((l) => l.a === 0 && l.b === 1)!.points;
      const sample = (pts: readonly Pt[]): number => {
        const n = 40;
        let sum = 0;
        for (let i = 0; i <= n; i++) {
          const t = (i / n) * length(pts);
          let acc = 0;
          let p = pts[pts.length - 1]!;
          for (let k = 1; k < pts.length; k++) {
            const seg = Math.hypot(pts[k]!.x - pts[k - 1]!.x, pts[k]!.y - pts[k - 1]!.y);
            if (acc + seg >= t) {
              const f = seg === 0 ? 0 : (t - acc) / seg;
              p = {
                x: pts[k - 1]!.x + (pts[k]!.x - pts[k - 1]!.x) * f,
                y: pts[k - 1]!.y + (pts[k]!.y - pts[k - 1]!.y) * f,
              };
              break;
            }
            acc += seg;
          }
          sum += landDist(w.islands, p);
        }
        return sum / (n + 1);
      };
      routeSum += sample(seaRoute(w.islands, 0, 1));
      straightSum += sample(straight);
    }
    expect(routeSum).toBeGreaterThanOrEqual(straightSum);
  });

  it('AK6: Deckel ist eine Knotenzahl, Wanduhr nur grosszügig', () => {
    expect(Number.isInteger(ROUTE_MAX_NODES)).toBe(true);
    expect(ROUTE_MAX_NODES).toBeGreaterThan(0);
    for (const seed of SEEDS.slice(0, 5)) {
      const w = seaWorld(seed);
      const t0 = Date.now();
      for (const [a, b] of pairs(w)) seaRoute(w.islands, a, b);
      expect(Date.now() - t0).toBeLessThan(2000);
    }
  });

  it('AK7: seaLanes, d und laneTicks bleiben von der Route unberührt', () => {
    const w = seaWorld(SEEDS[0]);
    const before = JSON.stringify([seaLanes(w.islands), laneTicks(w.islands, 0, 1)]);
    seaRoute(w.islands, 0, 1);
    expect(JSON.stringify([seaLanes(w.islands), laneTicks(w.islands, 0, 1)])).toBe(before);
  });

  it('AK13: Route nach Speichern und Laden gleich', () => {
    for (const seed of SEEDS.slice(0, 5)) {
      const w = seaWorld(seed);
      const loaded = deserialize(serialize(w));
      if (!loaded.ok) throw new Error(loaded.reason);
      for (const [a, b] of pairs(w))
        expect(seaRoute(loaded.world.islands, a, b)).toEqual(seaRoute(w.islands, a, b));
    }
  });

  it('Richtungswechsel je abgetastetem Schritt höchstens 30 Grad (auch am Anker)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const w = seaWorld(seed);
      for (const [a, b] of pairs(w)) {
        const r = seaRoute(w.islands, a, b);
        for (let i = 2; i < r.length; i++) {
          const h1 = Math.atan2(r[i - 1]!.y - r[i - 2]!.y, r[i - 1]!.x - r[i - 2]!.x);
          const h2 = Math.atan2(r[i]!.y - r[i - 1]!.y, r[i]!.x - r[i - 1]!.x);
          let d = Math.abs(h2 - h1);
          if (d > Math.PI) d = 2 * Math.PI - d;
          expect(
            (d * 180) / Math.PI,
            `seed ${seed} ${a}-${b} Punkt ${i}/${r.length}`,
          ).toBeLessThanOrEqual(30);
        }
      }
    }
  });

  it('Küstenabstand: ausser nahe den Ankern mindestens 1,5 Kacheln zu jeder Landkachelmitte', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const w = seaWorld(seed);
      for (const [a, b] of pairs(w)) {
        const r = seaRoute(w.islands, a, b);
        const ends = [r[0]!, r[r.length - 1]!];
        for (const p of r) {
          if (ends.some((e) => Math.hypot(p.x - e.x, p.y - e.y) <= 1.5)) continue;
          expect(
            landDist(w.islands, p),
            `seed ${seed} ${a}-${b} ${p.x},${p.y}`,
          ).toBeGreaterThanOrEqual(1.5);
        }
      }
    }
  });
});
