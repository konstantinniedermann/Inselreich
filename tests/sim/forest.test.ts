import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { placeBuilding, placeRoad } from '../../src/sim/build';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { CLEAR_FOREST_COST, PLANT_FOREST_COST } from '../../src/sim/defs/forest';
import { canClearForest, canPlantForest, clearForest, plantForest } from '../../src/sim/forest';
import { totalUpkeep } from '../../src/sim/economy';
import { tickProduction } from '../../src/sim/production';
import { canPlace } from '../../src/sim/placement';
import { layoutKey } from '../../src/sim/queries';
import { deserialize, serialize } from '../../src/sim/save';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { step } from '../../src/sim/tick';
import type { Building, Result, Terrain, World } from '../../src/sim/types';
import { createWorld, idx, tilesInRadius } from '../../src/sim/world';
import { forceGrass, forceRect } from './helpers';

const setTerrain = (w: World, x: number, y: number, t: Terrain): void => {
  forceGrass(w, x, y);
  w.tiles[idx(w, x, y)]!.terrain = t;
};
/** unlockAll-Welt; Prüfkachel (kx+6, ky+2) liegt im Kontor-Radius, Geld 100. */
function site(
  t: Terrain,
  opts: { unlockAll?: boolean } = { unlockAll: true },
): { w: World; x: number; y: number } {
  const w = createWorld(3, { crisisLevel: 'off', unlockAll: opts.unlockAll });
  const k = w.buildings[w.kontorId]!;
  const x = k.x + 6;
  const y = k.y + 2;
  setTerrain(w, x, y, t);
  w.money = 100;
  return { w, x, y };
}
const houseOn = (s: { w: World; x: number; y: number }, t: Terrain): void => {
  s.w.money = 10_000;
  const r = placeBuilding(s.w, 'house', s.x, s.y);
  if (!r.ok) throw new Error(r.reason);
  s.w.tiles[idx(s.w, s.x, s.y)]!.terrain = t; // roh: Gelände unter dem Gebäude
  s.w.money = 100;
};

type Kind = 'clear' | 'plant';
const act = (k: Kind) => (k === 'clear' ? clearForest : plantForest);
const can = (k: Kind) => (k === 'clear' ? canClearForest : canPlantForest);
interface Case {
  name: string;
  kind: Kind;
  prep: () => { w: World; x: number; y: number };
  reason: string;
}

const lockU2 = 'Erst wenn ein Wohnhaus 4 Pioniere hat';
const CASES: Case[] = [
  ...(['water', 'sand', 'mountain', 'grass'] as const).map((t): Case => ({
    name: `Roden auf ${t}`,
    kind: 'clear',
    prep: () => site(t),
    reason: 'Kein Wald',
  })),
  ...(['water', 'sand', 'mountain', 'forest'] as const).map((t): Case => ({
    name: `Aufforsten auf ${t}`,
    kind: 'plant',
    prep: () => site(t),
    reason: 'Keine Weide',
  })),
  {
    name: 'Wald unter Wohnhaus',
    kind: 'clear',
    prep: () => {
      const s = site('grass');
      houseOn(s, 'forest');
      return s;
    },
    reason: 'Bereits bebaut',
  },
  {
    name: 'Wald mit Weg',
    kind: 'clear',
    prep: () => {
      const s = site('forest');
      s.w.tiles[idx(s.w, s.x, s.y)]!.road = true;
      return s;
    },
    reason: 'Bereits bebaut',
  },
  {
    name: 'Kontor-Kachel (Roden)',
    kind: 'clear',
    prep: () => {
      const s = site('forest');
      const k = s.w.buildings[s.w.kontorId]!;
      return { ...s, x: k.x, y: k.y };
    },
    reason: 'Bereits bebaut',
  },
  {
    name: 'Weide unter Wohnhaus',
    kind: 'plant',
    prep: () => {
      const s = site('grass');
      houseOn(s, 'grass');
      return s;
    },
    reason: 'Bereits bebaut',
  },
  {
    name: 'Weide mit Weg',
    kind: 'plant',
    prep: () => {
      const s = site('grass');
      s.w.money = 1000;
      expect(placeRoad(s.w, s.x, s.y).ok).toBe(true);
      s.w.money = 100;
      return s;
    },
    reason: 'Bereits bebaut',
  },
  ...(
    [
      [-1, 0],
      ['W', 0],
      [0, 'H'],
      [1.5, 0],
    ] as const
  ).map(([cx, cy]): Case => ({
    name: `Ausserhalb ${cx}/${cy}`,
    kind: 'clear',
    prep: () => {
      const s = site('forest');
      return { ...s, x: cx === 'W' ? s.w.width : cx, y: cy === 'H' ? s.w.height : cy };
    },
    reason: 'Ausserhalb der Karte',
  })),
  {
    name: 'Geld 9 (Roden)',
    kind: 'clear',
    prep: () => {
      const s = site('forest');
      s.w.money = 9;
      return s;
    },
    reason: 'Zu wenig Geld',
  },
  {
    name: 'Geld 19 (Aufforsten)',
    kind: 'plant',
    prep: () => {
      const s = site('grass');
      s.w.money = 19;
      return s;
    },
    reason: 'Zu wenig Geld',
  },
  {
    name: 'Geld −5 (Roden)',
    kind: 'clear',
    prep: () => {
      const s = site('forest');
      s.w.money = -5;
      return s;
    },
    reason: 'Kein Geld',
  },
  {
    name: 'Geld −5 (Aufforsten)',
    kind: 'plant',
    prep: () => {
      const s = site('grass');
      s.w.money = -5;
      return s;
    },
    reason: 'Kein Geld',
  },
  { name: 'ohne U2, Wald', kind: 'clear', prep: () => site('forest', {}), reason: lockU2 },
  {
    name: 'ohne U2, Wasser (Sperre zuerst)',
    kind: 'clear',
    prep: () => site('water', {}),
    reason: lockU2,
  },
  { name: 'ohne U2, Weide', kind: 'plant', prep: () => site('grass', {}), reason: lockU2 },
];

const others = (w: World, i: number): string =>
  w.tiles
    .filter((_, j) => j !== i)
    .map((t) => t.terrain)
    .join();

describe('M10 Wald roden und aufforsten (Spec 6)', () => {
  it('AK-F1-01 Kosten aus defs/forest.ts', () => {
    expect(CLEAR_FOREST_COST).toEqual({ money: 10, wood: 0, tools: 0, stone: 0 });
    expect(PLANT_FOREST_COST).toEqual({ money: 20, wood: 0, tools: 0, stone: 0 });
  });
  it('AK-F1-02 Roden: Weide, Geld 90, Holz und Tick gleich, sonst keine Kachel geändert, layoutKey neu', () => {
    const { w, x, y } = site('forest');
    const i = idx(w, x, y);
    const [wood, tick, rest, key] = [w.stock.wood, w.tick, others(w, i), layoutKey(w)];
    expect(clearForest(w, x, y)).toEqual({ ok: true });
    expect(w.tiles[i]!.terrain).toBe('grass');
    expect(w.money).toBe(90);
    expect([w.stock.wood, w.tick, others(w, i)]).toEqual([wood, tick, rest]);
    expect(layoutKey(w)).not.toBe(key);
  });
  it('AK-F1-03 Aufforsten 80, dann Roden 70; layoutKey hängt am Gelände, nicht an einem Zähler', () => {
    const { w, x, y } = site('grass');
    const k0 = layoutKey(w);
    expect(plantForest(w, x, y).ok).toBe(true);
    expect(w.tiles[idx(w, x, y)]!.terrain).toBe('forest');
    expect(w.money).toBe(80);
    expect(layoutKey(w)).not.toBe(k0);
    expect(clearForest(w, x, y).ok).toBe(true);
    expect(w.money).toBe(70);
    expect(w.tiles[idx(w, x, y)]!.terrain).toBe('grass');
    expect(layoutKey(w)).toBe(k0);
  });
  it('AK-F1-04 Negativfälle: Grund wie Spec, Welt unverändert', () => {
    for (const c of CASES) {
      const { w, x, y } = c.prep();
      const before = serialize(w);
      expect(act(c.kind)(w, x, y), c.name).toEqual({ ok: false, reason: c.reason });
      expect(serialize(w), c.name).toBe(before);
    }
  });
  it('AK-F1-05 Holzfäller ohne freien Wald steht in noForest, Unterhalt läuft; Schäferei verliert durch Aufforsten nichts (M11 S3)', () => {
    const lumber = (clear: boolean): { wood: number; state: string; money: number } => {
      const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
      const k = w.buildings[w.kontorId]!;
      w.money = 10_000;
      forceRect(w, k.x + 3, k.y - 3, 6, 7, 'forest');
      forceGrass(w, k.x + 3, k.y);
      expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
      const r = placeBuilding(w, 'lumberjack', k.x + 3, k.y);
      if (!r.ok || r.id === undefined) throw new Error('Holzfäller');
      if (clear)
        for (const p of tilesInRadius(w, k.x + 3.5, k.y + 0.5, 2))
          if (w.tiles[idx(w, p.x, p.y)]!.terrain === 'forest')
            expect(clearForest(w, p.x, p.y).ok).toBe(true);
      const wood = w.stock.wood;
      const money = w.money;
      for (let i = 0; i < 300; i++) step(w);
      return { wood: w.stock.wood - wood, state: w.buildings[r.id]!.state, money: w.money - money };
    };
    expect(lumber(false)).toEqual({ wood: 10, state: 'ok', money: -15 });
    expect(lumber(true)).toEqual({ wood: 0, state: 'noForest', money: -15 });
    const sheep = (plant: boolean): number => {
      const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
      const k = w.buildings[w.kontorId]!;
      w.money = 10_000;
      forceRect(w, k.x + 3, k.y - 3, 6, 7, 'grass');
      expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
      const r = placeBuilding(w, 'sheepfarm', k.x + 3, k.y);
      if (!r.ok || r.id === undefined) throw new Error('Schäferei');
      if (plant)
        for (const p of tilesInRadius(w, k.x + 4, k.y + 1, 2)) {
          const t = w.tiles[idx(w, p.x, p.y)]!;
          if (t.terrain === 'grass' && t.buildingId === null && !t.road)
            expect(plantForest(w, p.x, p.y).ok).toBe(true);
        }
      const wool = w.stock.wool;
      for (let i = 0; i < 300; i++) step(w);
      return w.stock.wool - wool;
    };
    expect(sheep(true)).toBe(sheep(false));
  });
  it('AK-F1-06 Vorschau liefert dasselbe wie die Aktion und ändert die Welt nicht', () => {
    const ok: Case[] = [
      { name: 'Roden ok', kind: 'clear', prep: () => site('forest'), reason: '' },
      { name: 'Aufforsten ok', kind: 'plant', prep: () => site('grass'), reason: '' },
    ];
    for (const c of [...CASES, ...ok]) {
      const { w, x, y } = c.prep();
      const before = serialize(w);
      const preview: Result = can(c.kind)(w, x, y);
      expect(serialize(w), c.name).toBe(before);
      expect(preview, c.name).toEqual(act(c.kind)(structuredClone(w), x, y));
    }
  });
  it('AK-F1-07 Roden schafft Weide: Schäferei-Platz mit 3 Weide → nach einer Rodung baubar', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    w.money = 10_000;
    const x = k.x + 8;
    const y = k.y + 4;
    forceRect(w, x - 3, y - 3, 8, 8, 'forest');
    for (const [dx, dy] of [
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ])
      setTerrain(w, x + dx!, y + dy!, 'sand'); // Bauland ohne Weide
    for (const [dx, dy] of [
      [-1, 0],
      [-1, 1],
      [2, 0],
    ])
      setTerrain(w, x + dx!, y + dy!, 'grass');
    expect(canPlace(w, 'sheepfarm', x, y)).toEqual({
      ok: false,
      reason: 'Zu wenig Weide in der Nähe',
    });
    expect(clearForest(w, x + 2, y + 1).ok).toBe(true);
    expect(canPlace(w, 'sheepfarm', x, y).ok).toBe(true);
  });
  it('AK-F1-08 layoutKey: neu nach jedem Erfolg, gleich nach Misserfolg und nach step()', () => {
    const { w, x, y } = site('forest');
    const k0 = layoutKey(w);
    expect(plantForest(w, x, y).ok).toBe(false);
    expect(layoutKey(w)).toBe(k0);
    step(w);
    expect(layoutKey(w)).toBe(k0);
    expect(clearForest(w, x, y).ok).toBe(true);
    const k1 = layoutKey(w);
    expect(k1).not.toBe(k0);
    expect(plantForest(w, x, y).ok).toBe(true);
    expect(layoutKey(w)).not.toBe(k1);
  });
  it('AK-F1-09 (a) Determinismus: gleiche Folge auf zwei Kopien → gleiches serialize; forest.ts ohne RNG', () => {
    const a = site('forest');
    const b = structuredClone(a.w);
    for (const w of [a.w, b]) {
      w.money = 1000;
      expect(clearForest(w, a.x, a.y).ok).toBe(true);
      expect(plantForest(w, a.x, a.y).ok).toBe(true);
      expect(clearForest(w, a.x, a.y).ok).toBe(true);
      for (let i = 0; i < 100; i++) step(w);
    }
    expect(serialize(a.w)).toBe(serialize(b));
    expect(readFileSync('src/sim/forest.ts', 'utf8')).not.toMatch(/rng/);
  });
  it('AK-F1-10 „Alles frei": Roden bei Tick 0', () => {
    const { w, x, y } = site('forest');
    expect(w.tick).toBe(0);
    expect(clearForest(w, x, y).ok).toBe(true);
  });
  it('RF-3 Nicht-Ursprungskachel eines 2×2-Gebäudes und NaN: Grund, Welt unverändert, kein Wurf', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    w.money = 10_000;
    forceRect(w, k.x + 3, k.y + 3, 2, 2, 'grass');
    expect(placeBuilding(w, 'chapel', k.x + 3, k.y + 3).ok).toBe(true);
    w.tiles[idx(w, k.x + 4, k.y + 4)]!.terrain = 'forest'; // roh
    const before = serialize(w);
    expect(clearForest(w, k.x + 4, k.y + 4)).toEqual({ ok: false, reason: 'Bereits bebaut' });
    expect(() => clearForest(w, Number.NaN, 3)).not.toThrow();
    expect(clearForest(w, Number.NaN, 3)).toEqual({ ok: false, reason: 'Ausserhalb der Karte' });
    expect(serialize(w)).toBe(before);
  });
});

function lumberSite(): { w: World; b: Building; forest: { x: number; y: number } } {
  const w = createWorld(3, { unlockAll: true });
  const k = w.buildings[w.kontorId]!;
  w.money = 10_000;
  forceRect(w, k.x + 2, k.y - 3, 7, 7, 'grass');
  const forest = { x: k.x + 4, y: k.y - 1 };
  w.tiles[idx(w, forest.x, forest.y)]!.terrain = 'forest';
  expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
  const r = placeBuilding(w, 'lumberjack', k.x + 3, k.y);
  if (!r.ok || r.id === undefined) throw new Error('Holzfäller');
  return { w, b: w.buildings[r.id]!, forest };
}

function hunterSite(w: World): { b: Building; forest: { x: number; y: number } } {
  const k = w.buildings[w.kontorId]!;
  forceRect(w, k.x + 2, k.y, 5, 1, 'grass');
  forceRect(w, k.x + 3, k.y - 4, 7, 7, 'grass');
  forceRect(w, k.x + 4, k.y - 3, 5, 2, 'forest');
  for (let i = 2; i <= 6; i++) expect(placeRoad(w, k.x + i, k.y).ok).toBe(true);
  const r = placeBuilding(w, 'hunter', k.x + 6, k.y - 1);
  if (!r.ok || r.id === undefined) throw new Error('Jagdhütte');
  return { b: w.buildings[r.id]!, forest: { x: k.x + 4, y: k.y - 3 } };
}

describe('M11 Wald live (Spec 3.4)', () => {
  it('AK-P2S3-01 Holzfäller: Rodung -> noForest, progress bleibt, kein Holz, Unterhalt gebucht; Aufforsten -> weiter', () => {
    const { w, b, forest } = lumberSite();
    for (let i = 0; i < 10; i++) step(w);
    expect([b.state, b.progress]).toEqual(['ok', 10]);
    expect(clearForest(w, forest.x, forest.y).ok).toBe(true);
    const wood = w.stock.wood,
      carry = w.upkeepCarry,
      money = w.money,
      up = totalUpkeep(w);
    step(w);
    expect([b.state, b.progress, w.stock.wood]).toEqual(['noForest', 10, wood]);
    expect(w.upkeepCarry).toBe((carry + up) % 100);
    expect(w.money).toBe(money - Math.floor((carry + up) / 100));
    expect(plantForest(w, forest.x, forest.y).ok).toBe(true);
    step(w);
    expect([b.state, b.progress]).toEqual(['ok', 11]);
  });
  it('AK-P2S3-02 Jagdhütte mit 10 freien Waldkacheln: eine roden -> noForest, aufforsten -> ok', () => {
    const w = createWorld(3, { unlockAll: true });
    w.money = 10_000;
    const { b, forest } = hunterSite(w);
    step(w);
    expect(b.state).toBe('ok');
    expect(clearForest(w, forest.x, forest.y).ok).toBe(true);
    step(w);
    expect(b.state).toBe('noForest');
    expect(plantForest(w, forest.x, forest.y).ok).toBe(true);
    step(w);
    expect(b.state).toBe('ok');
  });
  it('AK-P2S3-03 Vorrang vor noForest: burning, notConnected, noService; ohne sie noForest', () => {
    const { w, b, forest } = lumberSite();
    expect(clearForest(w, forest.x, forest.y).ok).toBe(true);
    b.outageUntil = w.tick + 50;
    tickProduction(w);
    expect(b.state).toBe('burning');
    delete b.outageUntil;
    b.connected = false;
    tickProduction(w);
    expect(b.state).toBe('notConnected');
    b.connected = true;
    const def = BUILDING_DEFS.lumberjack;
    def.requiresService = 'school';
    try {
      tickProduction(w);
      expect(b.state).toBe('noService');
    } finally {
      delete def.requiresService;
    }
    tickProduction(w);
    expect(b.state).toBe('noForest');
  });
  it('AK-P2S3-04 Holzfäller, dessen einziger Wald unter dem eigenen Grundriss liegt: Zu wenig freier Wald', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    w.money = 10_000;
    forceRect(w, k.x + 1, k.y - 3, 7, 7, 'grass');
    w.tiles[idx(w, k.x + 3, k.y)]!.terrain = 'forest';
    expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
    expect(canPlace(w, 'lumberjack', k.x + 3, k.y)).toEqual({
      ok: false,
      reason: 'Zu wenig freier Wald in der Nähe',
    });
  });
  it('RF-6 noForest füllt kein Lager (kein storageFull), Unterhalt läuft; nach Aufforsten läuft progress weiter', () => {
    const { w, b, forest } = lumberSite();
    for (let i = 0; i < 5; i++) step(w);
    expect(b.progress).toBe(5);
    w.stock.wood = STORAGE_CAP;
    expect(clearForest(w, forest.x, forest.y).ok).toBe(true);
    const carry = w.upkeepCarry,
      money = w.money,
      up = totalUpkeep(w);
    for (let i = 0; i < 100; i++) {
      step(w);
      expect(b.state).toBe('noForest');
    }
    expect([b.progress, w.stock.wood]).toEqual([5, STORAGE_CAP]);
    expect(w.money).toBe(money - Math.floor((carry + 100 * up) / 100));
    expect(plantForest(w, forest.x, forest.y).ok).toBe(true);
    step(w);
    expect(b.progress).toBe(6);
  });
  it('RF-7 Stand mit state noForest lädt ok und wird im nächsten Schritt neu bewertet', () => {
    const a = lumberSite();
    expect(clearForest(a.w, a.forest.x, a.forest.y).ok).toBe(true);
    a.b.state = 'noForest';
    const la = deserialize(serialize(a.w));
    if (!la.ok) throw new Error(la.reason);
    step(la.world);
    expect(la.world.buildings[a.b.id]!.state).toBe('noForest');
    expect(la.world.buildings[a.b.id]!.progress).toBe(a.b.progress);
    const c = lumberSite();
    c.b.state = 'noForest';
    const lc = deserialize(serialize(c.w));
    if (!lc.ok) throw new Error(lc.reason);
    step(lc.world);
    expect(lc.world.buildings[c.b.id]!.state).toBe('ok');
    expect(lc.world.buildings[c.b.id]!.progress).toBe(c.b.progress + 1);
  });
});
