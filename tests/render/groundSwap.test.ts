import { beforeAll, describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import {
  DECOR_REACH,
  groundElements,
  kontorPos,
  rareBudget,
  rareSites,
  type GroundElement,
} from '../../src/render/decor';
import { occupancy } from '../../src/render/terrain';

// ART-L8-SELTEN T4: Boden-Deko neben Neubau wechselt die Art nie (sie entfällt nur); Roden und Aufforsten ändern
// Plan und Budget der S/E-Orte nicht (D1/D2). Aufbau einmal in beforeAll.

const kindsAt = (w: World): Map<number, string> => {
  const isl = home(w);
  const m = new Map<number, string>();
  for (const e of groundElements(
    w.seed,
    isl,
    occupancy(isl),
    undefined,
    kontorPos(isl, w.buildings),
  ))
    if (e.w === 1 && e.h === 1) m.set(e.y * isl.width + e.x, e.kind);
  return m;
};

let w7: World;
let base: Map<number, string>;
beforeAll(() => {
  w7 = createWorld(7);
  base = kindsAt(w7);
});

describe('ART-L8-SELTEN T4 Boden-Deko neben Neubau', () => {
  it('AK9 ein Weg an beliebiger Grasstelle: ausserhalb Fussabdruck + DECOR_REACH gleiche Art, innerhalb gleiche Art oder leer', () => {
    const isl = home(w7);
    const spots: number[] = [];
    for (let i = 0; i < isl.tiles.length && spots.length < 12; i++) {
      const t = isl.tiles[i]!;
      if (t.terrain !== 'grass' || t.road || t.buildingId !== null) continue;
      if (i % 53 === 0) spots.push(i);
    }
    expect(spots.length).toBeGreaterThanOrEqual(8);
    let changedInside = 0;
    for (const s of spots) {
      const sx = s % isl.width,
        sy = (s / isl.width) | 0;
      isl.tiles[s]!.road = true;
      const after = kindsAt(w7);
      isl.tiles[s]!.road = false;
      for (let y = 0; y < isl.height; y++)
        for (let x = 0; x < isl.width; x++) {
          const i = y * isl.width + x;
          const inside = Math.max(Math.abs(x - sx), Math.abs(y - sy)) <= DECOR_REACH;
          const a = base.get(i),
            b = after.get(i);
          if (inside) {
            if (b !== undefined) expect(b, `Kachel ${x},${y} bei Weg ${sx},${sy}`).toBe(a);
            else if (a !== undefined) changedInside++;
          } else expect(b, `Kachel ${x},${y} bei Weg ${sx},${sy}`).toBe(a);
        }
    }
    expect(changedInside).toBeGreaterThan(0);
  });

  it('AK10 Roden/Aufforsten einer Kachel am S/E-Ort ändert Plan und Budget nicht (Seeds 1–20)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      const kontor = kontorPos(isl, w.buildings);
      const before = rareSites(w.seed, isl, kontor).map((s) => ({ ...s }));
      const budget = rareBudget(w.seed);
      for (const s of before) {
        const t = isl.tiles[s.y * isl.width + s.x]!;
        const old = t.terrain;
        t.terrain = old === 'forest' ? 'grass' : 'forest';
        // frisches Inselobjekt: kein Treffer im Plan-Cache, der Plan wird wirklich neu gebildet
        const fresh = structuredClone(isl);
        expect(rareSites(w.seed, fresh, kontor), `Seed ${seed} ${s.id}`).toEqual(before);
        t.terrain = old;
      }
      expect(rareBudget(w.seed)).toBe(budget);
    }
  });

  it('AK10b Bandanteile der Boden-Elemente über Seeds 1–40 ändern sich je Art um höchstens 0,2 pp (gemessen höchstens 0,056 pp)', () => {
    // Anteile (Elemente je Insel-Kachel) vor T4, gemessen auf dem Stand nach T1/T3
    const BEFORE: Record<string, number> = {
      mushRing: 0.0002,
      beachStone: 0.0047,
      ferns: 0.0327,
      pebble: 0.0188,
      clover: 0.006,
      beachGrass: 0.0053,
      shrubs: 0.0338,
      shell: 0.0039,
      tuftTall: 0.0106,
      reeds: 0.0016,
      boulder: 0.0126,
      deadwood: 0.002,
      toadstools: 0.0021,
      tidePool: 0.0009,
      tuftDry: 0.0106,
      driftwood: 0.0017,
      molehills: 0.0017,
      stoneHeap: 0.0016,
      carpet: 0.0024,
      stoneCircle: 0.0001,
      crate: 0,
    };
    const cnt: Record<string, number> = {};
    let tiles = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      tiles += isl.width * isl.height;
      for (const e of groundElements(
        w.seed,
        isl,
        occupancy(isl),
        undefined,
        kontorPos(isl, w.buildings),
      ) as GroundElement[])
        cnt[e.kind] = (cnt[e.kind] ?? 0) + 1;
    }
    for (const k of new Set([...Object.keys(BEFORE), ...Object.keys(cnt)]))
      expect(Math.abs((cnt[k] ?? 0) / tiles - (BEFORE[k] ?? 0)), k).toBeLessThanOrEqual(0.002);
  });
});
