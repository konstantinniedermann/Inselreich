// M14-E1 T01: Trait-Faktor (Spec R1, R2), Felsbucht Gebirge+. Felsbucht = Welt-Insel 2, Möweninsel = Welt-Insel 1.
import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { LEVELS } from '../../src/sim/defs/levels';
import { ISLANDS, TRAIT_BUILDINGS, TRAIT_CYCLE_PCT, TRAIT_LABELS } from '../../src/sim/defs/sea';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { STORM_TICK_DIVISOR } from '../../src/sim/defs/crises';
import { demolish, placeBuilding } from '../../src/sim/build';
import { goodsBalance } from '../../src/sim/flow';
import { canPlace } from '../../src/sim/placement';
import { step } from '../../src/sim/tick';
import { upgradeBuilding } from '../../src/sim/upgrade';
import { cycleOf } from '../../src/sim/levels';
import type { Building, BuildingDefId, GoodId, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { foundKontor2Literal } from './seaHelpers';
import { putBuilding } from './helpers';

const HEIMAT = 0;
const MOEWEN = 1;
const FELS = 2;

/** Testwelt Spec §10: alles frei, Kontor II auf der Möweninsel und der Felsbucht, Lager gefüllt. */
function traitWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  foundKontor2Literal(w, MOEWEN);
  foundKontor2Literal(w, FELS);
  w.money = 100_000;
  for (const i of [HEIMAT, MOEWEN, FELS]) {
    const s = w.islands[i]!.stock;
    s.wood = 50;
    s.stone = 50;
    s.tools = 20;
  }
  return w;
}

/** Betrieb auf einer Insel, angebunden (Literal), an einer freien Stelle neben dem Kontor. */
function farm(w: World, island: number, defId: BuildingDefId, slot = 0, level?: 2 | 3): Building {
  const k = w.buildings[w.islands[island]!.kontorId!]!;
  const b = putBuilding(w, island, defId, k.x + 4 + slot * 3, k.y);
  if (level !== undefined) b.level = level;
  return b;
}

function run(w: World, ticks: number): void {
  for (let i = 0; i < ticks; i++) step(w);
}

const stock = (w: World, island: number, g: GoodId): number => w.islands[island]!.stock[g];

/** Erste Kachel der Insel, auf der `defId` baubar ist. */
function firstSite(w: World, island: number, defId: BuildingDefId): { x: number; y: number } {
  const isl = w.islands[island]!;
  for (let y = 0; y < isl.height; y++)
    for (let x = 0; x < isl.width; x++) if (canPlace(w, defId, x, y, island).ok) return { x, y };
  throw new Error('kein Bauplatz');
}

/** Was Geld und Lager einer Insel bei einer Aktion verändern. */
function snapshot(w: World, island: number): Record<string, number> {
  const s = w.islands[island]!.stock;
  return {
    money: w.money,
    wood: s.wood,
    stone: s.stone,
    tools: s.tools,
    cloth: s.cloth,
    rum: s.rum,
  };
}
const delta = (a: Record<string, number>, b: Record<string, number>): Record<string, number> =>
  Object.fromEntries(Object.keys(a).map((k) => [k, b[k]! - a[k]!]));

describe('M14-E1 Defs (AK-01, AK-02)', () => {
  it('AK-M14E1-01: Trait-Defs, Felsbucht, Beschriftungen', () => {
    expect(TRAIT_CYCLE_PCT).toBe(50);
    expect(TRAIT_BUILDINGS).toEqual({
      mountainRich: ['quarry', 'glassworks'],
      fertile: ['canefarm', 'sheepfarm'],
    });
    expect(ISLANDS[0]).toEqual({
      kind: 'A',
      name: 'Möweninsel',
      dMin: 25,
      dMax: 30,
      size: 24,
      traits: ['spice'],
      plantations: 2,
      quarries: 0,
    });
    expect(ISLANDS[1]).toEqual({
      kind: 'B',
      name: 'Felsbucht',
      dMin: 35,
      dMax: 40,
      size: 36,
      traits: ['spice', 'mountain', 'mountainRich'],
      plantations: 3,
      quarries: 3,
    });
    expect(TRAIT_LABELS).toEqual({
      spice: 'Gewürz',
      mountain: 'Gebirge',
      mountainRich: 'Gebirge+',
      fertile: 'Fruchtbar',
    });
  });

  it('AK-M14E1-02: Zyklus x Faktor ist ganzzahlig und mindestens 1', () => {
    for (const ids of Object.values(TRAIT_BUILDINGS)) {
      for (const id of ids) {
        const cycles = [BUILDING_DEFS[id].cycle!, ...(LEVELS[id] ?? []).map((l) => l.cycle)];
        for (const c of cycles) {
          expect((c * TRAIT_CYCLE_PCT) / 100, `${id} ${c}`).toSatisfy(
            (v: number) => Number.isInteger(v) && v >= 1,
          );
        }
      }
    }
  });
});

describe('M14-E1 cycleOf je Insel (AK-03, AK-07)', () => {
  const at = (w: World, island: number, defId: BuildingDefId, level?: 2 | 3): number =>
    cycleOf(w, farm(w, island, defId, 0, level))!;

  it.each([
    ['quarry', [30, 18, 12], [60, 36, 24]],
    ['glassworks', [25, 15, 10], [50, 30, 20]],
  ] as const)('AK-M14E1-03: %s Felsbucht und Heimat', (id, fels, heimat) => {
    for (const [i, level] of ([undefined, 2, 3] as const).entries()) {
      expect(at(traitWorld(), FELS, id, level)).toBe(fels[i]);
      expect(at(traitWorld(), HEIMAT, id, level)).toBe(heimat[i]);
    }
  });

  it('AK-M14E1-03: Betriebe ohne Wirkung auf der Felsbucht und der Möweninsel', () => {
    const w = traitWorld();
    expect(at(w, FELS, 'spicefarm')).toBe(50);
    expect(at(w, FELS, 'lumberjack')).toBe(at(w, HEIMAT, 'lumberjack'));
    expect(at(w, FELS, 'canefarm')).toBe(50);
    expect(at(w, MOEWEN, 'canefarm')).toBe(50);
  });

  it('AK-M14E1-07: Heimat unveränderte Zyklen auf allen Stufen', () => {
    const w = traitWorld();
    for (const def of Object.values(BUILDING_DEFS)) {
      if (def.cycle === undefined) continue;
      const levels = LEVELS[def.id];
      for (const level of [undefined, 2, 3] as const) {
        const expected =
          level === undefined ? def.cycle : (levels?.[level - 2]?.cycle ?? def.cycle);
        const b: Building = {
          id: -1,
          defId: def.id,
          x: 0,
          y: 0,
          connected: true,
          progress: 0,
          state: 'ok',
          island: HEIMAT,
          ...(level === undefined ? {} : { level }),
        };
        expect(cycleOf(w, b), `${def.id} Stufe ${level ?? 1}`).toBe(expected);
      }
    }
  });
});

describe('M14-E1 Ausstoss und Verbrauch (AK-04 … AK-10)', () => {
  it('AK-M14E1-04: Steinbruch Felsbucht 20, Heimat 10 in 600 Ticks', () => {
    const w = traitWorld();
    w.islands[FELS]!.stock.stone = 0;
    w.islands[HEIMAT]!.stock.stone = 0;
    farm(w, FELS, 'quarry');
    farm(w, HEIMAT, 'quarry');
    run(w, 600);
    expect(stock(w, FELS, 'stone')).toBe(20);
    expect(stock(w, HEIMAT, 'stone')).toBe(10);
  });

  it('AK-M14E1-05: Glashütte Felsbucht verbraucht je Stück 1 Stein und 1 Holz', () => {
    const w = traitWorld();
    farm(w, FELS, 'glassworks');
    const glass = stock(w, FELS, 'glass');
    run(w, 600);
    expect(stock(w, FELS, 'glass') - glass).toBe(24);
    expect(stock(w, FELS, 'stone')).toBe(50 - 24);
    expect(stock(w, FELS, 'wood')).toBe(50 - 24);
  });

  it('AK-M14E1-05: ohne Stein wartet die Glashütte', () => {
    const w = traitWorld();
    const b = farm(w, FELS, 'glassworks');
    w.islands[FELS]!.stock.stone = 0;
    const glass = stock(w, FELS, 'glass');
    run(w, 600);
    expect(b.state).toBe('waitingInput');
    expect(stock(w, FELS, 'glass') - glass).toBe(0);
    expect(stock(w, FELS, 'wood')).toBe(50);
  });

  it('AK-M14E1-06: Stufe 3 x Trait liefert 50 Stein in 600 Ticks', () => {
    const w = traitWorld();
    const b = farm(w, FELS, 'quarry');
    w.islands[FELS]!.stock.cloth = 10;
    w.islands[FELS]!.stock.rum = 10;
    expect(upgradeBuilding(w, b.id).ok).toBe(true);
    expect(upgradeBuilding(w, b.id).ok).toBe(true);
    expect(cycleOf(w, b)).toBe(12);
    w.islands[FELS]!.stock.stone = 0;
    run(w, 600);
    expect(stock(w, FELS, 'stone')).toBe(50);
  });

  it('AK-M14E1-08: Altstand-progress 45 schliesst den Zyklus im ersten Schritt', () => {
    const w = traitWorld();
    const b = farm(w, FELS, 'quarry');
    b.progress = 45;
    w.islands[FELS]!.stock.stone = 0;
    step(w);
    expect(stock(w, FELS, 'stone')).toBe(1);
    expect(b.progress).toBe(0);
  });

  it('AK-M14E1-09: Bilanz der Felsbucht meldet 20 Stein je Minute (Bilanzeinheit: je 100 Ticks)', () => {
    const w = traitWorld();
    farm(w, FELS, 'quarry');
    // goodsBalance rechnet je 100 Ticks: 20 Stück / 600 Ticks = 100 / 30 je 100 Ticks (Heimat: 100 / 60)
    expect(goodsBalance(w, FELS).stone.produced).toBeCloseTo(100 / 30, 9);
  });

  it('AK-M14E1-10: volles Lager nach einem Zyklus', () => {
    const w = traitWorld();
    const b = farm(w, FELS, 'quarry');
    w.islands[FELS]!.stock.stone = STORAGE_CAP;
    run(w, 30);
    expect(b.state).toBe('storageFull');
    expect(stock(w, FELS, 'stone')).toBe(STORAGE_CAP);
  });
});

describe('M14-E1 Abriss, Neubau, Ausbau auf der Felsbucht (QA-B10)', () => {
  it('(a) Abriss mit progress 17 erstattet wie in der Heimat', () => {
    const w = traitWorld();
    const results: Record<string, number>[] = [];
    for (const island of [FELS, HEIMAT]) {
      const p = firstSite(w, island, 'quarry');
      const placed = placeBuilding(w, 'quarry', p.x, p.y, island);
      const b = w.buildings[placed.id!]!;
      b.progress = 17;
      const before = snapshot(w, island);
      expect(demolish(w, b.id).ok).toBe(true);
      results.push(delta(before, snapshot(w, island)));
    }
    expect(results[0]).toEqual(results[1]);
  });

  it('(b) Neubau an derselben Stelle startet bei progress 0 und liefert nach 30 Ticks Stein', () => {
    const w = traitWorld();
    const p = firstSite(w, FELS, 'quarry');
    const first = w.buildings[placeBuilding(w, 'quarry', p.x, p.y, FELS).id!]!;
    first.progress = 17;
    expect(demolish(w, first.id).ok).toBe(true);
    const b = w.buildings[placeBuilding(w, 'quarry', p.x, p.y, FELS).id!]!;
    b.connected = true;
    expect(b.progress).toBe(0);
    expect(cycleOf(w, b)).toBe(30);
    w.islands[FELS]!.stock.stone = 0;
    run(w, 30);
    expect(stock(w, FELS, 'stone')).toBe(1);
  });

  it('(c) Ausbau auf Stufe 2 kostet auf der Felsbucht wie in der Heimat', () => {
    const w = traitWorld();
    const results: Record<string, number>[] = [];
    for (const island of [FELS, HEIMAT]) {
      const p = firstSite(w, island, 'quarry');
      const b = w.buildings[placeBuilding(w, 'quarry', p.x, p.y, island).id!]!;
      w.islands[island]!.stock.cloth = 10;
      const before = snapshot(w, island);
      expect(upgradeBuilding(w, b.id).ok).toBe(true);
      results.push(delta(before, snapshot(w, island)));
      if (island === FELS) expect(cycleOf(w, b)).toBe(18);
    }
    expect(results[0]).toEqual(results[1]);
  });
});

// ---------- T03: Insel C «Weidenau» (Welt-Insel 3) ----------

const WEIDEN = 3;

/** Testwelt mit Kontor II auf Weidenau; Lager von Heimat und Weidenau gefüllt. */
function weidenWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  foundKontor2Literal(w, WEIDEN);
  w.money = 100_000;
  for (const i of [HEIMAT, WEIDEN]) {
    const s = w.islands[i]!.stock;
    s.wood = 50;
    s.stone = 50;
    s.tools = 20;
  }
  return w;
}

describe('M14-E1 T03 Weidenau (AK-01, AK-03, AK-04, AK-11)', () => {
  it('AK-M14E1-01: ISLANDS hat drei Einträge, ISLANDS[2] ist Weidenau', () => {
    expect(ISLANDS).toHaveLength(3);
    expect(ISLANDS[2]).toEqual({
      kind: 'C',
      name: 'Weidenau',
      dMin: 30,
      dMax: 35,
      size: 24,
      traits: ['spice', 'fertile'],
      plantations: 6,
      quarries: 0,
    });
  });

  it.each([
    ['canefarm', [25, 15, 10], [50, 30, 20]],
    ['sheepfarm', [25, 15, 10], [50, 30, 20]],
  ] as const)('AK-M14E1-03: %s Weidenau und Heimat', (id, weiden, heimat) => {
    for (const [i, level] of ([undefined, 2, 3] as const).entries()) {
      const w = weidenWorld();
      expect(cycleOf(w, farm(w, WEIDEN, id, 0, level))).toBe(weiden[i]);
      const h = weidenWorld();
      expect(cycleOf(h, farm(h, HEIMAT, id, 0, level))).toBe(heimat[i]);
    }
  });

  it('AK-M14E1-03: Gewürzplantage auf Weidenau 50', () => {
    const w = weidenWorld();
    expect(cycleOf(w, farm(w, WEIDEN, 'spicefarm'))).toBe(50);
  });

  it('AK-M14E1-04: Zuckerrohrplantage Weidenau liefert 24 in 600 Ticks', () => {
    const w = weidenWorld();
    farm(w, WEIDEN, 'canefarm');
    run(w, 600);
    expect(stock(w, WEIDEN, 'cane')).toBe(24);
  });

  it('AK-M14E1-11: Sturm, Weidenau gegen Heimat tickgenau (nach Zyklus-Skalierung)', () => {
    const w = weidenWorld();
    w.crisisLevel = 'off';
    const t0 = w.tick;
    w.crisis = { period: 0, kind: 'storm', from: t0, until: t0 + 700 };
    const heim = farm(w, HEIMAT, 'canefarm', 0);
    const weid = farm(w, WEIDEN, 'canefarm', 0);
    const cycleH = cycleOf(w, heim)!;
    const cycleW = cycleOf(w, weid)!;
    const c0H = stock(w, HEIMAT, 'cane');
    const c0W = stock(w, WEIDEN, 'cane');
    for (let t = 0; t < 600; t++) {
      step(w);
      expect(w.crisis?.kind, `Sturm aktiv bei ${t}`).toBe('storm');
      expect(weid.state, `Tick ${t}`).toBe(heim.state);
      expect(weid.progress, `Tick ${t}`).toBe(heim.progress % cycleW);
    }
    let n = 0;
    for (let t = t0 + 1; t <= t0 + 600; t++) if (t % STORM_TICK_DIVISOR === 0) n++;
    expect(stock(w, HEIMAT, 'cane') - c0H).toBe(Math.floor(n / cycleH));
    expect(stock(w, WEIDEN, 'cane') - c0W).toBe(Math.floor(n / cycleW));
  });
});
