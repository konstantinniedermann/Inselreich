import { describe, expect, it } from 'vitest';
import { dockFor, homeAnchor } from '../../src/sim/islands';
import { seaMask } from '../../src/sim/mapgen';
import { siteRuleOk } from '../../src/sim/placement';
import type { Terrain, World } from '../../src/sim/types';
import { seaWorld } from './seaHelpers';

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
