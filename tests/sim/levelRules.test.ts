import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  LEVELS,
  LEVEL_RECHECK_TICKS,
  WORKFORCE_RADIUS,
  type LevelSite,
} from '../../src/sim/defs/levels';
import { runningLevel, siteAt, workforceAt } from '../../src/sim/levelRules';
import type {
  Building,
  BuildingDefId,
  CrisisLevel,
  Island,
  Terrain,
  Tier,
  World,
} from '../../src/sim/types';
import { createWorld, home, idx } from '../../src/sim/world';
import { putBuilding, twoIslandWorld } from './helpers';

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
      expect(lv[i]!.workforceTier, `${row.id} tier${i + 2}`).toBe((i + 2) as Tier);
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

// ---------------------------------------------------------------------------------------------
// AL-2a: laufende Stufe k als reine Abfrage (AK-AL-03, 06, 07, 08, 09, 47, 46 Struktur)
// ---------------------------------------------------------------------------------------------

/** Heimat leer räumen: alles ausser Gebäuden wird Wasser ohne Weg; gebaut wird nur, was der Test setzt. */
function emptyWorld(crisisLevel: CrisisLevel = 'off'): World {
  const w = createWorld(3, { unlockAll: true, crisisLevel });
  drain(home(w));
  return w;
}
function drain(isl: Island): void {
  for (const t of isl.tiles) {
    if (t.buildingId !== null) continue;
    t.terrain = 'water';
    t.road = false;
  }
}
const setTerrain = (w: World, x: number, y: number, terrain: Terrain, island = 0): void => {
  w.islands[island]!.tiles[idx(w.islands[island]!, x, y)]!.terrain = terrain;
};
const houseAt = (w: World, x: number, y: number, tier: Tier, island = 0): Building => {
  const h = putBuilding(w, island, 'house', x, y);
  h.house!.tier = tier;
  return h;
};
const shop = (
  w: World,
  defId: BuildingDefId,
  x: number,
  y: number,
  level: 2 | 3,
  island = 0,
): Building => {
  const b = putBuilding(w, island, defId, x, y);
  b.level = level;
  return b;
};
/** Fachkräfte-Haus in Reichweite, damit nur der Standort einer Stufe geprüft wird. */
const crew = (w: World, tier: Tier): void => void houseAt(w, 24, 25, tier);

describe('AK-AL-03 Monotonie der Defs', () => {
  it('Standort ab Stufe n+1 gleiche Art und mindestens so streng; workforceTier = Stufe', () => {
    for (const [id, lv] of Object.entries(LEVELS)) {
      lv!.forEach((l, i) => {
        expect(l.workforceTier, `${id} Stufe ${i + 2}`).toBe((i + 2) as Tier);
        const prev = lv![i - 1]?.site;
        const s = l.site;
        if (prev === undefined) return;
        expect(s?.kind, id).toBe(prev.kind);
        if (s?.kind === 'fisherSpacing' && prev.kind === 'fisherSpacing') {
          expect(s.maxOthers, id).toBeLessThanOrEqual(prev.maxOthers);
          expect(s.radius, id).toBeGreaterThanOrEqual(prev.radius);
        }
        if ((s?.kind === 'freeTerrain' || s?.kind === 'terrainNear') && 'min' in prev) {
          expect(s.min, id).toBeGreaterThanOrEqual(prev.min);
          expect(s.radius, id).toBeGreaterThanOrEqual(prev.radius);
        }
      });
    }
  });
  it('Konstanten der Abfrage stehen in den Defs', () => {
    expect([WORKFORCE_RADIUS, LEVEL_RECHECK_TICKS]).toEqual([8, 10]);
  });
});

describe('AK-AL-06 Fachkräfte', () => {
  const fisherWorld = (): { w: World; f: Building } => {
    const w = emptyWorld();
    return { w, f: shop(w, 'fisher', 20, 20, 2) };
  };
  it('Siedlerhaus im Abstand 8,0 → k 2; im Abstand √65 → k 1', () => {
    const a = fisherWorld();
    houseAt(a.w, 28, 20, 2);
    expect(runningLevel(a.w, a.f)).toBe(2);
    const b = fisherWorld();
    houseAt(b.w, 28, 21, 2);
    expect(runningLevel(b.w, b.f)).toBe(1);
  });
  it('Pionierhaus zu niedrig → k 1; Bürgerhaus genügt → k 2', () => {
    const a = fisherWorld();
    houseAt(a.w, 23, 20, 1);
    expect(runningLevel(a.w, a.f)).toBe(1);
    const b = fisherWorld();
    houseAt(b.w, 25, 20, 3);
    expect(runningLevel(b.w, b.f)).toBe(2);
  });
  it('Haus auf der zweiten Insel zählt nicht, mit Hinweis otherIsland', () => {
    const w = twoIslandWorld();
    const f = shop(w, 'fisher', 20, 20, 2);
    houseAt(w, 24, 20, 2, 1);
    expect(runningLevel(w, f)).toBe(1);
    expect(workforceAt(w, f, 2)).toMatchObject({ ok: false, nearest: null, otherIsland: true });
  });
  it('Hütte auf Insel 1 mit gleichen Koordinaten zählt nicht als Nachbar (Review Focus 3)', () => {
    const w = twoIslandWorld();
    const f = shop(w, 'fisher', 20, 20, 2);
    shop(w, 'fisher', 20, 21, 2, 1);
    shop(w, 'fisher', 21, 20, 2, 1);
    houseAt(w, 24, 20, 2);
    expect(siteAt(w, f, 2)).toMatchObject({ ok: true, have: 0, need: 1 });
    expect(runningLevel(w, f)).toBe(2);
  });
  it('brennendes Siedlerhaus im Abstand 5 zählt', () => {
    const { w, f } = fisherWorld();
    houseAt(w, 25, 20, 2).state = 'burning';
    expect(runningLevel(w, f)).toBe(2);
  });
  it('Kontor, Markt und Dienste zählen nie als Fachkräfte-Haus', () => {
    const { w, f } = fisherWorld();
    const kontor = w.buildings[home(w).kontorId]!;
    kontor.x = 22;
    kontor.y = 20;
    putBuilding(w, 0, 'market', 24, 20);
    expect(runningLevel(w, f)).toBe(1);
  });
  it('Stufe 1 braucht weder Haus noch Standort und wird ohne Suche geliefert', () => {
    const w = emptyWorld();
    const f = putBuilding(w, 0, 'fisher', 20, 20);
    expect(runningLevel(w, f)).toBe(1);
  });
});

describe('AK-AL-47 2×2-Betrieb, Anzeige = aufgerundeter Abstand', () => {
  it.each([
    [28, 20, true, 8], // dx 7,5, dy 0,5
    [29, 20, false, 9], // dx 8,5
    [28, 23, true, 8], // dx 7,5, dy 2,5 ≈ 7,91
    [28, 24, false, 9], // dx 7,5, dy 3,5 ≈ 8,28
  ])('Haus bei (%i, %i) → ok %s, Anzeige %i', (hx, hy, ok, shown) => {
    const w = emptyWorld();
    const weaver = shop(w, 'weaver', 20, 20, 2);
    houseAt(w, hx, hy, 2);
    expect(workforceAt(w, weaver, 2)).toMatchObject({ ok, nearest: shown, tier: 2 });
  });
});

describe('AK-AL-07 Fischgrund', () => {
  it('g 2: eine andere Hütte im Abstand 2 → k 2, zwei → k 1; Stufe 1 und stillgelegt zählen', () => {
    const w = emptyWorld();
    const a = shop(w, 'fisher', 20, 20, 2);
    crew(w, 3);
    putBuilding(w, 0, 'fisher', 22, 20);
    expect(runningLevel(w, a)).toBe(2);
    const second = putBuilding(w, 0, 'fisher', 20, 22);
    second.paused = true;
    expect(runningLevel(w, a)).toBe(1);
  });
  it('g 3: andere Hütte in Abstand 3 → k 3; zweite in Abstand 3 → k 2', () => {
    const w = emptyWorld();
    const a = shop(w, 'fisher', 20, 20, 3);
    crew(w, 3);
    putBuilding(w, 0, 'fisher', 23, 20);
    expect(runningLevel(w, a)).toBe(3);
    putBuilding(w, 0, 'fisher', 20, 23);
    expect(runningLevel(w, a)).toBe(2);
  });
  it('Hütten anderer Insel zählen nicht', () => {
    const w = twoIslandWorld();
    const a = shop(w, 'fisher', 20, 20, 2);
    houseAt(w, 24, 20, 3);
    putBuilding(w, 1, 'fisher', 21, 20);
    putBuilding(w, 1, 'fisher', 20, 21);
    expect(runningLevel(w, a)).toBe(2);
  });
});

describe('AK-AL-08 Wald, Gras, Gebirge', () => {
  const ring: [number, number][] = [
    [19, 20],
    [21, 20],
    [20, 19],
    [20, 21],
    [19, 19],
    [21, 21],
  ];
  const woodWorld = (): { w: World; j: Building } => {
    const w = emptyWorld();
    for (const [x, y] of ring) setTerrain(w, x, y, 'forest');
    const j = shop(w, 'lumberjack', 20, 20, 3);
    crew(w, 3);
    return { w, j };
  };
  it('Holzfäller g 3: genau 6 freie Waldkacheln → k 3', () => {
    const { w, j } = woodWorld();
    expect(siteAt(w, j, 3)).toMatchObject({ ok: true, kind: 'freeTerrain', have: 6, need: 6 });
    expect(runningLevel(w, j)).toBe(3);
  });
  it('ein Weg auf einer Kachel → 5 frei, k 2; zwei weitere bebaut → 3 frei, k 1', () => {
    const { w, j } = woodWorld();
    w.islands[0]!.tiles[idx(home(w), 19, 20)]!.road = true;
    expect(runningLevel(w, j)).toBe(2);
    putBuilding(w, 0, 'house', 21, 20);
    putBuilding(w, 0, 'house', 20, 19);
    expect(siteAt(w, j, 2)).toMatchObject({ ok: false, have: 3, need: 4 });
    expect(runningLevel(w, j)).toBe(1);
  });
  it('zwei Holzfäller teilen dieselben Waldkacheln, beide behalten k', () => {
    const w = emptyWorld();
    for (let y = 18; y <= 22; y++) for (let x = 18; x <= 24; x++) setTerrain(w, x, y, 'forest');
    const a = shop(w, 'lumberjack', 20, 20, 3);
    const b = shop(w, 'lumberjack', 22, 20, 3);
    crew(w, 3);
    expect([runningLevel(w, a), runningLevel(w, b)]).toEqual([3, 3]);
  });
  it('Steinbruch an gerader Gebirgskante (4 in r 2) g 3 → k 3; eine Kachel weniger → k 2', () => {
    const w = emptyWorld();
    for (let y = 14; y <= 26; y++) for (let x = 14; x <= 19; x++) setTerrain(w, x, y, 'mountain');
    const q = shop(w, 'quarry', 20, 20, 3);
    crew(w, 3);
    expect(siteAt(w, q, 3)).toMatchObject({ ok: true, kind: 'terrainNear', have: 4, need: 4 });
    expect(runningLevel(w, q)).toBe(3);
    setTerrain(w, 18, 20, 'water');
    expect(runningLevel(w, q)).toBe(2);
  });
  it('Schäferei g 2: 8 freie Graskacheln in r 3 → k 2, eine bebaut → k 1', () => {
    const w = emptyWorld();
    for (let y = 19; y <= 22; y++) for (let x = 18; x <= 19; x++) setTerrain(w, x, y, 'grass');
    const s = shop(w, 'sheepfarm', 20, 20, 2);
    houseAt(w, 27, 20, 2);
    expect(siteAt(w, s, 2)).toMatchObject({ ok: true, have: 8, need: 8 });
    expect(runningLevel(w, s)).toBe(2);
    putBuilding(w, 0, 'house', 18, 19);
    expect(runningLevel(w, s)).toBe(1);
  });
});

describe('AK-AL-09 Feuerwache und Review Focus 2', () => {
  const still = (level: CrisisLevel): { w: World; d: Building } => {
    const w = emptyWorld(level);
    const d = shop(w, 'distillery', 20, 20, 3);
    crew(w, 3);
    return { w, d };
  };
  it('normal: ohne Wache k 2, mit Wache k 3, Wache abgerissen k 2', () => {
    const { w, d } = still('normal');
    expect(runningLevel(w, d)).toBe(2);
    const fw = putBuilding(w, 0, 'firestation', 24, 20);
    expect(siteAt(w, d, 3)).toMatchObject({ ok: true, kind: 'fireStation', have: 1, need: 1 });
    expect(runningLevel(w, d)).toBe(3);
    delete w.buildings[fw.id];
    expect(siteAt(w, d, 3)).toMatchObject({ ok: false, have: 0, need: 1 });
    expect(runningLevel(w, d)).toBe(2);
  });
  it('Krisen aus: ohne Wache k 3, Bedingung entfällt', () => {
    const { w, d } = still('off');
    expect(siteAt(w, d, 3)).toMatchObject({ ok: true, need: 0 });
    expect(runningLevel(w, d)).toBe(3);
  });
  it('nicht angebundene Wache schützt nicht → k 2', () => {
    const { w, d } = still('normal');
    putBuilding(w, 0, 'firestation', 24, 20).connected = false;
    expect(runningLevel(w, d)).toBe(2);
  });
  it('Stufe ohne Standort liefert null', () => {
    const { w, d } = still('normal');
    expect(siteAt(w, d, 2)).toBeNull();
  });
});

describe('Abfrage ist rein und deterministisch', () => {
  it('zweimal gleich, Welt unverändert', () => {
    const w = emptyWorld('normal');
    const d = shop(w, 'distillery', 20, 20, 3);
    houseAt(w, 24, 25, 3);
    putBuilding(w, 0, 'firestation', 24, 20);
    const before = JSON.stringify(w);
    const first = runningLevel(w, d);
    expect(runningLevel(w, d)).toBe(first);
    expect(JSON.stringify(w)).toBe(before);
  });
});

describe('AK-AL-46 Struktur: keine Spielzahl in levelRules.ts', () => {
  it('Zahlenliterale ohne Kommentare nur aus 0, 1, 2, 100', () => {
    const code = readFileSync('src/sim/levelRules.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '');
    const literals = [...code.matchAll(/(?<![\w.])\d+(?:\.\d+)?(?![\w])/g)].map((m) => m[0]);
    for (const n of literals) expect(['0', '1', '2', '100'], n).toContain(n);
  });
});
