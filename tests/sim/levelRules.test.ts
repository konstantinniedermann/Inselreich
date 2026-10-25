import { describe, expect, it } from 'vitest';
import { LEVELS, type LevelSite } from '../../src/sim/defs/levels';
import type { BuildingDefId, Tier } from '../../src/sim/types';

type Row = {
  id: BuildingDefId;
  c: [number, number];
  u: [number, number];
  cost: [[number, number, number, number], [number, number, number, number]]; // Geld, Holz, Wz, Stein
  site: [LevelSite | undefined, LevelSite | undefined];
};
const fw: LevelSite = { kind: 'fireStation' };
const gras = (radius: number, min: number): LevelSite => ({
  kind: 'freeTerrain',
  terrain: 'grass',
  radius,
  min,
});
const wald = (radius: number, min: number): LevelSite => ({
  kind: 'freeTerrain',
  terrain: 'forest',
  radius,
  min,
});
const berg = (radius: number, min: number): LevelSite => ({
  kind: 'terrainNear',
  terrain: 'mountain',
  radius,
  min,
});
const fischer = (radius: number): LevelSite => ({ kind: 'fisherSpacing', radius, maxOthers: 1 });

// Abgeschrieben aus Anhang 01 (Stufe 2/3) und R4 (Standort-Spalte).
const TABLE: Row[] = [
  {
    id: 'fisher',
    c: [24, 16],
    u: [7, 9],
    cost: [
      [50, 3, 1, 0],
      [65, 4, 2, 2],
    ],
    site: [fischer(2), fischer(3)],
  },
  {
    id: 'hunter',
    c: [30, 20],
    u: [7, 9],
    cost: [
      [85, 1, 1, 0],
      [88, 2, 1, 2],
    ],
    site: [wald(3, 14), wald(3, 18)],
  },
  {
    id: 'cattlefarm',
    c: [12, 8],
    u: [13, 17],
    cost: [
      [215, 8, 2, 0],
      [248, 12, 3, 4],
    ],
    site: [gras(3, 18), gras(3, 20)],
  },
  {
    id: 'lumberjack',
    c: [18, 12],
    u: [7, 9],
    cost: [
      [85, 0, 1, 0],
      [88, 0, 1, 2],
    ],
    site: [wald(2, 4), wald(2, 6)],
  },
  {
    id: 'quarry',
    c: [36, 24],
    u: [13, 17],
    cost: [
      [135, 5, 2, 0],
      [148, 8, 3, 3],
    ],
    site: [berg(2, 3), berg(2, 4)],
  },
  {
    id: 'sheepfarm',
    c: [30, 20],
    u: [13, 17],
    cost: [
      [165, 5, 1, 0],
      [188, 8, 2, 3],
    ],
    site: [gras(3, 8), gras(3, 12)],
  },
  {
    id: 'canefarm',
    c: [30, 20],
    u: [13, 17],
    cost: [
      [165, 5, 1, 0],
      [188, 8, 2, 3],
    ],
    site: [gras(3, 8), gras(3, 12)],
  },
  {
    id: 'weaver',
    c: [30, 20],
    u: [20, 26],
    cost: [
      [190, 8, 2, 0],
      [210, 12, 3, 4],
    ],
    site: [undefined, undefined],
  },
  {
    id: 'toolmaker',
    c: [48, 32],
    u: [33, 43],
    cost: [
      [190, 8, 2, 0],
      [210, 12, 3, 4],
    ],
    site: [undefined, fw],
  },
  {
    id: 'distillery',
    c: [30, 20],
    u: [26, 34],
    cost: [
      [265, 8, 2, 3],
      [278, 12, 3, 6],
    ],
    site: [undefined, fw],
  },
  {
    id: 'glassworks',
    c: [30, 20],
    u: [33, 43],
    cost: [
      [340, 10, 3, 5],
      [315, 15, 5, 10],
    ],
    site: [undefined, fw],
  },
];

describe('AK-AL-01 Ausbau-Defs Stufe 2/3 (Anhang 01)', () => {
  it('elf Typen, je zwei Stufen in T01', () => {
    expect(Object.keys(LEVELS).sort()).toEqual(TABLE.map((r) => r.id).sort());
    for (const lv of Object.values(LEVELS)) expect(lv).toHaveLength(2);
  });
  it.each(TABLE)('$id: Zyklus, Unterhalt, Kosten, Fachkräfte-Stufe, Standort', (row) => {
    const lv = LEVELS[row.id]!;
    for (const i of [0, 1] as const) {
      const [money, wood, tools, stone] = row.cost[i];
      expect(lv[i]!.cycle, `${row.id} c${i + 2}`).toBe(row.c[i]);
      expect(lv[i]!.upkeep, `${row.id} u${i + 2}`).toBe(row.u[i]);
      expect(lv[i]!.cost, `${row.id} cost${i + 2}`).toEqual({ money, wood, tools, stone });
      expect(lv[i]!.workforceTier, `${row.id} tier${i + 2}`).toBe((i + 1) as Tier);
      expect(lv[i]!.site, `${row.id} site${i + 2}`).toEqual(row.site[i]);
    }
  });
  it('fachliche Ware nur beim Fischer (Stoff 2/2), nie Rum, kein Schlüssel fee', () => {
    for (const [id, lv] of Object.entries(LEVELS))
      for (const l of lv!) {
        expect(Object.keys(l), id).not.toContain('fee');
        expect(l.extra?.good, id).not.toBe('rum');
        if (id === 'fisher') expect(l.extra).toEqual({ good: 'cloth', amount: 2 });
        else expect(l.extra, id).toBeUndefined();
      }
  });
});

describe('AK-AL-02 Zyklus und Unterhalt Stufe 2/3 gleich der Liste von heute', () => {
  const HEUTE: Record<string, [number, number, number, number]> = {
    fisher: [24, 7, 16, 9],
    hunter: [30, 7, 20, 9],
    cattlefarm: [12, 13, 8, 17],
    lumberjack: [18, 7, 12, 9],
    quarry: [36, 13, 24, 17],
    sheepfarm: [30, 13, 20, 17],
    canefarm: [30, 13, 20, 17],
    weaver: [30, 20, 20, 26],
    toolmaker: [48, 33, 32, 43],
    distillery: [30, 26, 20, 34],
    glassworks: [30, 33, 20, 43],
  };
  it.each(Object.entries(HEUTE))('%s', (id, [c2, u2, c3, u3]) => {
    const lv = LEVELS[id as BuildingDefId]!;
    expect([lv[0]!.cycle, lv[0]!.upkeep, lv[1]!.cycle, lv[1]!.upkeep]).toEqual([c2, u2, c3, u3]);
  });
});
