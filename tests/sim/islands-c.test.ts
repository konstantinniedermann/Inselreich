import { describe, expect, it } from 'vitest';
import { ISLAND_GAP_MIN, ISLANDS, type IslandKind } from '../../src/sim/defs/sea';
import {
  clipInside,
  fitIsland,
  generateForeignIslands,
  homeAnchor,
  seaLanes,
  type LaneIsland,
  type PlacedIsland,
} from '../../src/sim/islands';
import { generateMap, MAP_H, MAP_W } from '../../src/sim/mapgen';

const SEEDS_50 = Array.from({ length: 50 }, (_, i) => i + 1);

function homeOf(seed: number): LaneIsland {
  const { terrain, kontor } = generateMap(seed);
  return {
    ox: 0,
    oy: 0,
    width: MAP_W,
    height: MAP_H,
    anchor: homeAnchor(terrain, MAP_W, MAP_H, kontor),
  };
}

const gap = (a: LaneIsland, b: LaneIsland): number =>
  Math.max(
    a.ox - (b.ox + b.width),
    b.ox - (a.ox + a.width),
    a.oy - (b.oy + b.height),
    b.oy - (a.oy + a.height),
  );

function stagesOf(seed: number, forceLastStage?: IslandKind): Map<IslandKind, number[]> {
  const calls = new Map<IslandKind, number[]>();
  generateForeignIslands(seed, homeOf(seed), {
    forceLastStage,
    onStage: (k, s) => calls.set(k, [...(calls.get(k) ?? []), s]),
  });
  return calls;
}

describe('Ersatzregel Stufe 3 (M14-E1 T02)', () => {
  it('onStage meldet je Def genau einmal, Stufen 1 oder 2, Mehrheit Stufe 1', () => {
    for (const seed of [1, 3, 7, 13, 42]) {
      const calls = stagesOf(seed);
      for (const def of ISLANDS) {
        expect(calls.get(def.kind)).toHaveLength(1);
        expect([1, 2]).toContain(calls.get(def.kind)![0]);
      }
    }
    let stage1 = 0;
    let total = 0;
    for (const seed of SEEDS_50)
      for (const s of stagesOf(seed).values()) {
        total++;
        if (s[0] === 1) stage1++;
      }
    expect(stage1 / total).toBeGreaterThan(0.5);
  });

  it('erzwungene Stufe 3: gültige Lage, Lücke, Seeweg, A bitgleich', () => {
    const last = ISLANDS[ISLANDS.length - 1]!.kind;
    for (const seed of SEEDS_50) {
      const home = homeOf(seed);
      const free = generateForeignIslands(seed, home);
      const forced = generateForeignIslands(seed, home, { forceLastStage: last });
      expect(forced[0]).toEqual(free[0]);
      expect(stagesOf(seed, last).get(last)).toEqual([3]);
      const b = forced[forced.length - 1]!;
      for (const o of [home, ...forced.slice(0, -1)])
        expect(gap(o, b)).toBeGreaterThanOrEqual(ISLAND_GAP_MIN);
      const lanes = seaLanes([home, ...forced]);
      expect(lanes.find((l) => l.a === 0 && l.b === forced.length)).toBeDefined();
    }
  });

  it('bestehende Seewege kreuzen die erzwungene Insel nicht', () => {
    const last = ISLANDS[ISLANDS.length - 1]!.kind;
    for (const seed of SEEDS_50) {
      const home = homeOf(seed);
      const forced = generateForeignIslands(seed, home, { forceLastStage: last });
      const b = forced[forced.length - 1]!;
      const rect = { x0: b.ox, y0: b.oy, x1: b.ox + b.width, y1: b.oy + b.height };
      const others = [home, ...forced.slice(0, -1)];
      for (const lane of seaLanes(others))
        expect(clipInside(lane.points[0]!, lane.points[1]!, rect)).toBeLessThan(1e-9);
    }
  });

  it('deterministisch; forceLastStage A ändert B nicht in der Form', () => {
    const home = homeOf(5);
    const o = { forceLastStage: 'B' } as const;
    expect(JSON.stringify(generateForeignIslands(5, home, o))).toBe(
      JSON.stringify(generateForeignIslands(5, home, o)),
    );
    const free = generateForeignIslands(5, home);
    const forcedA = generateForeignIslands(5, home, { forceLastStage: 'A' });
    expect(forcedA[1]!.terrain).toEqual(free[1]!.terrain);
  });

  it('fitIsland platziert ohne Wurf gegen dichte Liste', () => {
    const home = homeOf(1);
    const [a, b] = generateForeignIslands(1, home) as [PlacedIsland, PlacedIsland];
    const def = ISLANDS[0]!;
    const placed = fitIsland([home, a, b], { ...a }, def);
    for (const o of [home, a, b]) expect(gap(o, placed)).toBeGreaterThanOrEqual(ISLAND_GAP_MIN);
  });

  it('Spanne protokollieren (Seeds 1..300)', () => {
    const last = ISLANDS[ISLANDS.length - 1]!.kind;
    let max = 0;
    for (let seed = 1; seed <= 300; seed++) {
      const all = [
        homeOf(seed),
        ...generateForeignIslands(seed, homeOf(seed), { forceLastStage: last }),
      ];
      const w = Math.max(...all.map((i) => i.ox + i.width)) - Math.min(...all.map((i) => i.ox));
      const h = Math.max(...all.map((i) => i.oy + i.height)) - Math.min(...all.map((i) => i.oy));
      max = Math.max(max, w + h);
    }
    console.info(`SPANNE_MAX=${max}`);
  });
});
