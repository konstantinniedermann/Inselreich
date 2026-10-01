import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, idx, tilesInRadius } from '../../src/sim/world';
import { beginCrisis, isProtected } from '../../src/sim/crises';
import { demolish, placeBuilding, placeRoad, removeRoad } from '../../src/sim/build';
import { totalUpkeep } from '../../src/sim/economy';
import { recomputeConnectivity } from '../../src/sim/roads';
import { serialize } from '../../src/sim/save';
import { inSupplyRange } from '../../src/sim/supply';
import { serviceAvailable } from '../../src/sim/population';
import { step } from '../../src/sim/tick';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { GOOD_IDS, STORAGE_CAP } from '../../src/sim/defs/goods';
import {
  coverageMask,
  crisisView,
  effectiveRefund,
  goodsBalance,
  houseDiagnosis,
  layoutKey,
  placementZone,
  unprotectedFlammables,
} from '../../src/sim/queries';
import type { Building, BuildingDefId, World } from '../../src/sim/types';
import {
  forceGrass,
  forceRect,
  houseFar,
  houseNearKontor,
  placeService,
  prepareEast,
} from './helpers';

let w: World;
let k: Building;
let nextTestId = 9000;

/** Legt ein Gebäude direkt an (ohne Kacheln), damit Bilanz-Tests keine Geländeregeln brauchen. */
function direct(world: World, defId: BuildingDefId, connected: boolean): Building {
  const b: Building = {
    id: nextTestId++,
    defId,
    x: 0,
    y: 0,
    connected,
    progress: 0,
    state: 'ok',
  };
  world.buildings[b.id] = b;
  return b;
}

/** Wohnhaus direkt eingefügt (Mitte im Kontor-Radius, sofern x/y nah am Kontor liegen). */
function directHouse(world: World, x: number, y: number, tier: 1 | 2 | 3, supplied: boolean) {
  const b: Building = {
    id: nextTestId++,
    defId: 'house',
    x,
    y,
    connected: false,
    progress: 0,
    state: 'ok',
    house: {
      tier,
      inhabitants: 4,
      demand: {},
      satisfied: {},
      services: {},
      satisfiedSince: 0,
      supplied,
    },
  };
  world.buildings[b.id] = b;
  return b;
}

beforeEach(() => {
  w = createWorld(3);
  k = w.buildings[w.kontorId]!;
});

describe('queries', () => {
  it('AK-S3-01 goodsBalance zählt angebundene Betriebe und versorgte Häuser', () => {
    const empty = goodsBalance(w);
    expect(empty.wood).toEqual({ produced: 0, consumed: 0, net: 0 });

    const lj = direct(w, 'lumberjack', true);
    direct(w, 'lumberjack', false); // nicht angebunden: zählt nicht
    expect(goodsBalance(w).wood.produced).toBeCloseTo(100 / 30, 10);
    expect(goodsBalance(w).wood.net).toBeCloseTo(100 / 30, 10);
    delete w.buildings[lj.id];

    direct(w, 'fisher', true);
    for (let i = 0; i < 4; i++) directHouse(w, k.x + 2, k.y + i, 1, true);
    houseFar(w); // unversorgt: verbraucht nichts
    const food = goodsBalance(w).food;
    expect(food.produced).toBeCloseTo(2.5, 10);
    expect(food.consumed).toBeCloseTo(8, 10);
    expect(food.net).toBeCloseTo(-5.5, 10);

    direct(w, 'weaver', true);
    const b = goodsBalance(w);
    expect(b.wool.consumed).toBeCloseTo(2, 10);
    expect(b.cloth.produced).toBeCloseTo(2, 10);
    expect(Object.keys(b).sort()).toEqual([...GOOD_IDS].sort());
  });

  it('AK-S3-02 houseDiagnosis nennt fehlende Versorgung, Güter und Dienste in fester Reihenfolge', () => {
    const far = houseFar(w);
    expect(houseDiagnosis(w, far)).toEqual([{ kind: 'supply' }]);

    const h = directHouse(w, k.x + 2, k.y, 2, true);
    h.house!.satisfied = { food: true, cloth: false };
    expect(houseDiagnosis(w, h)).toEqual([
      { kind: 'good', good: 'cloth' },
      { kind: 'service', service: 'faith' },
    ]);

    placeService(w, 'chapel', k.x + 3, k.y + 3);
    h.house!.satisfied = { food: true, cloth: true };
    expect(houseDiagnosis(w, h)).toEqual([]);
  });

  it('AK-S3-03 coverageMask stimmt für alle Kacheln mit inSupplyRange und serviceAvailable überein', () => {
    const mask = coverageMask(w, 'supply');
    expect(mask).toHaveLength(w.width * w.height);
    for (let y = 0; y < w.height; y++)
      for (let x = 0; x < w.width; x++)
        expect(mask[y * w.width + x], `${x},${y}`).toBe(inSupplyRange(w, x + 0.5, y + 0.5));
    const chapel = placeService(w, 'chapel', k.x + 3, k.y + 3);
    const faith = coverageMask(w, 'faith');
    for (let y = 0; y < w.height; y++)
      for (let x = 0; x < w.width; x++) {
        const probe = {
          id: -1,
          defId: 'house',
          x,
          y,
          connected: false,
          progress: 0,
          state: 'ok',
        } as Building;
        expect(faith[y * w.width + x], `${x},${y}`).toBe(serviceAvailable(w, probe, 'faith'));
      }
    expect(chapel.connected).toBe(true);
    // Schule fehlt: Maske leer
    expect(coverageMask(w, 'school').some(Boolean)).toBe(false);
    // Nicht angebundene Quelle zählt nicht
    chapel.connected = false;
    expect(coverageMask(w, 'faith').some(Boolean)).toBe(false);
  });

  it('AK-S3-04 placementZone liefert Kreis und Kacheln je Gebäudeart', () => {
    const market = placementZone(w, 'market', 20, 20)!;
    expect(market.radius).toBe(BUILDING_DEFS.market.supplyRadius);
    expect([market.cx, market.cy]).toEqual([21, 21]);
    expect(market.tiles.length).toBeGreaterThan(100);
    expect(placementZone(w, 'school', 20, 20)!.radius).toBe(BUILDING_DEFS.school.serviceRadius);
    expect(placementZone(w, 'chapel', 20, 20)!.radius).toBe(BUILDING_DEFS.chapel.serviceRadius);

    forceRect(w, 30, 30, 5, 5, 'grass');
    w.tiles[idx(w, 31, 31)]!.terrain = 'forest';
    w.tiles[idx(w, 32, 30)]!.terrain = 'forest';
    const lj = placementZone(w, 'lumberjack', 31, 30)!;
    expect(lj.radius).toBe(2);
    expect(lj.tiles.length).toBeGreaterThan(0);
    for (const p of lj.tiles) expect(w.tiles[idx(w, p.x, p.y)]!.terrain).toBe('forest');
    expect(lj.tiles).toContainEqual({ x: 31, y: 31 });

    const sheep = placementZone(w, 'sheepfarm', 30, 30)!;
    expect(sheep.radius).toBe(2);
    expect(sheep.tiles.length).toBeGreaterThan(0);
    for (const p of sheep.tiles) expect(w.tiles[idx(w, p.x, p.y)]!.terrain).toBe('grass');
    expect(placementZone(w, 'canefarm', 30, 30)!.radius).toBe(2);
    expect(placementZone(w, 'fisher', 30, 30)).toBeNull();
  });

  it('AK-S3-05 effectiveRefund kappt Güter am Lagerplatz, Geld nicht', () => {
    w.stock.wood = STORAGE_CAP - 1;
    const r = effectiveRefund(w, { money: 200, wood: 14, tools: 6, stone: 0 });
    expect(r).toEqual({ money: 100, wood: 1, tools: 3, stone: 0 });
    w.money = 1_000_000;
    expect(effectiveRefund(w, { money: 200, wood: 14, tools: 6, stone: 0 }).money).toBe(100);
  });

  it('AK-S3-06 Abriss während Produktion: Input verloren, kein Output, 50 % zurück, kein Unterhalt', () => {
    prepareEast(w, k);
    expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
    forceRect(w, k.x + 3, k.y, 2, 2, 'grass');
    const r = placeBuilding(w, 'weaver', k.x + 3, k.y);
    expect(r.ok).toBe(true);
    const weaver = w.buildings[r.id!]!;
    expect(weaver.connected).toBe(true);
    w.stock.wool = 10;
    w.stock.cloth = 0;
    for (let i = 0; i < 20; i++) step(w);
    expect(w.stock.wool).toBe(9);
    expect(weaver.progress).toBe(20);

    const expected = effectiveRefund(w, BUILDING_DEFS.weaver.cost);
    expect(expected).toEqual({ money: 100, wood: 7, tools: 1, stone: 0 });
    const before = { money: w.money, wood: w.stock.wood, tools: w.stock.tools };
    const upkeepBefore = totalUpkeep(w);
    expect(demolish(w, weaver.id).ok).toBe(true);
    expect(w.money - before.money).toBe(expected.money);
    expect(w.stock.wood - before.wood).toBe(expected.wood);
    expect(w.stock.tools - before.tools).toBe(expected.tools);
    expect(w.stock.wool).toBe(9);
    expect(totalUpkeep(w)).toBe(upkeepBefore - BUILDING_DEFS.weaver.upkeep);
    for (let i = 0; i < 100; i++) step(w);
    expect(w.stock.cloth).toBe(0);
    expect(w.stock.wool).toBe(9);
    expect(w.stats.upkeep).toBe(upkeepBefore - BUILDING_DEFS.weaver.upkeep);
  });

  it('AK-S3-07 layoutKey ändert sich nur durch Bau, Abriss, Weg und Anbindung', () => {
    prepareEast(w, k);
    const k0 = layoutKey(w);
    for (let i = 0; i < 100; i++) step(w);
    expect(layoutKey(w)).toBe(k0);

    expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
    const k1 = layoutKey(w);
    expect(k1).not.toBe(k0);

    forceGrass(w, k.x + 3, k.y - 1);
    forceGrass(w, k.x + 3, k.y);
    const p = placeBuilding(w, 'lumberjack', k.x + 3, k.y);
    // Holzfäller braucht Wald im Radius: prepareEast setzt Wald bei k.x+6,k.y-1 (Abstand 3): nicht genug
    w.tiles[idx(w, k.x + 3, k.y - 1)]!.terrain = 'forest';
    const p2 = p.ok ? p : placeBuilding(w, 'lumberjack', k.x + 3, k.y);
    expect(p2.ok).toBe(true);
    const k2 = layoutKey(w);
    expect(k2).not.toBe(k1);

    // Anbindungsänderung ohne Bau: Weg entfernen trennt den Holzfäller
    expect(w.buildings[p2.id!]!.connected).toBe(true);
    expect(removeRoad(w, k.x + 2, k.y).ok).toBe(true);
    const k3 = layoutKey(w);
    expect(k3).not.toBe(k2);
    // reine Anbindungsänderung (Weg-Summe gleich): connected manuell kippen und neu berechnen
    w.tiles[idx(w, k.x + 2, k.y)]!.road = true;
    const k4 = layoutKey(w);
    recomputeConnectivity(w);
    expect(layoutKey(w)).not.toBe(k4);

    const k5 = layoutKey(w);
    expect(demolish(w, p2.id!).ok).toBe(true);
    expect(layoutKey(w)).not.toBe(k5);
  });

  it('layoutKey kollidiert nicht bei gleicher Wegindex-Summe (5+10 gegen 15)', () => {
    const a = createWorld(3);
    const b = createWorld(3);
    for (const i of [5, 10]) a.tiles[i]!.road = true;
    b.tiles[15]!.road = true;
    expect(layoutKey(a)).not.toBe(layoutKey(b));
  });

  it('layoutKey kollidiert nicht bei gleicher Wegzahl und -summe an anderen Kacheln (1+4 gegen 2+3)', () => {
    const a = createWorld(3);
    const b = createWorld(3);
    for (const i of [1, 4]) a.tiles[i]!.road = true;
    for (const i of [2, 3]) b.tiles[i]!.road = true;
    expect(layoutKey(a)).not.toBe(layoutKey(b));
  });

  it('layoutKey erkennt ein verschobenes Gebäude bei gleicher Anzahl und gleicher ID', () => {
    const a = createWorld(3);
    const b = createWorld(3);
    const ka = a.buildings[a.kontorId]!;
    const kb = b.buildings[b.kontorId]!;
    expect(layoutKey(a)).toBe(layoutKey(b));
    kb.x = ka.x + 1;
    expect(layoutKey(a)).not.toBe(layoutKey(b));
  });

  it('reine Funktionen: serialize(w) bleibt vor und nach jedem Aufruf gleich', () => {
    houseNearKontor(w);
    placeService(w, 'chapel', k.x + 3, k.y + 3);
    const house = houseNearKontor(w);
    const snapshot = serialize(w);
    const calls: Array<() => unknown> = [
      () => goodsBalance(w),
      () => houseDiagnosis(w, house),
      () => coverageMask(w, 'supply'),
      () => coverageMask(w, 'faith'),
      () => placementZone(w, 'market', 10, 10),
      () => placementZone(w, 'lumberjack', 10, 10),
      () => effectiveRefund(w, BUILDING_DEFS.chapel.cost),
      () => layoutKey(w),
      () => crisisView(w),
      () => unprotectedFlammables(w),
      () => coverageMask(w, 'fire'),
    ];
    for (const call of calls) {
      call();
      expect(serialize(w)).toBe(snapshot);
    }
  });
});

/** Feuerwache direkt eingefügt (Abdeckung liest nur `connected` und Lage). */
function station(world: World, x: number, y: number, connected: boolean): Building {
  const b: Building = {
    id: nextTestId++,
    defId: 'firestation',
    x,
    y,
    connected,
    progress: 0,
    state: 'ok',
  };
  world.buildings[b.id] = b;
  return b;
}

describe('M6 Abfragen', () => {
  it('AK-S4-01 crisisView für off, Leerlauf, Sturm, Brand, Boom', () => {
    expect(crisisView(createWorld(3))).toEqual({ phase: 'none', next: null });
    const n = createWorld(3, { crisisLevel: 'normal' });
    expect(crisisView(n)).toEqual({ phase: 'none', next: 2400 });
    n.tick = 2400;
    beginCrisis(n, 0, { kind: 'storm' });
    expect(crisisView(n)).toMatchObject({ phase: 'warning', kind: 'storm', remaining: 201 });
    n.tick = 2601;
    expect(crisisView(n)).toMatchObject({
      phase: 'active',
      remaining: 299,
      from: 2601,
      until: 2900,
    });
    const f = createWorld(3, { crisisLevel: 'normal' });
    const chapel = placeService(
      f,
      'chapel',
      f.buildings[f.kontorId]!.x + 3,
      f.buildings[f.kontorId]!.y + 3,
    );
    f.tick = 2400;
    beginCrisis(f, 0, { kind: 'fire', tile: { x: chapel.x, y: chapel.y } });
    expect(crisisView(f)).toMatchObject({
      phase: 'active',
      kind: 'fire',
      remaining: 200,
      from: 2400,
      target: chapel.id,
      targetExists: true,
      outcome: 'burning',
    });
    delete f.buildings[chapel.id];
    expect(crisisView(f)).toMatchObject({ targetExists: false });
    const bm = createWorld(3, { crisisLevel: 'normal' });
    bm.tick = 2400;
    beginCrisis(bm, 0, { kind: 'boom', good: 'food' });
    expect(crisisView(bm)).toMatchObject({
      phase: 'active',
      good: 'food',
      remaining: 300,
      targetExists: false,
    });
  });

  it('AK-S4-02 Maske fire gleich isProtected für jedes 1×1-Gebäude; nicht angebunden → leer', () => {
    const s = station(w, k.x + 6, k.y + 4, true);
    const mask = coverageMask(w, 'fire');
    expect(mask).toHaveLength(4096);
    for (let y = 0; y < w.height; y++)
      for (let x = 0; x < w.width; x++) {
        const probe = {
          id: -1,
          defId: 'fisher',
          x,
          y,
          connected: true,
          progress: 0,
          state: 'ok',
        } as Building;
        expect(mask[y * w.width + x], `${x},${y}`).toBe(isProtected(w, probe));
      }
    s.connected = false;
    expect(coverageMask(w, 'fire').some(Boolean)).toBe(false);
  });

  it('AK-S4-03 brennende Kapelle liefert keine Abdeckung faith', () => {
    const chapel = placeService(w, 'chapel', k.x + 3, k.y + 3);
    w.crisisLevel = 'normal';
    w.tick = 2400;
    beginCrisis(w, 0, { kind: 'fire', tile: { x: chapel.x, y: chapel.y } });
    expect(chapel.outageUntil).toBeDefined();
    expect(coverageMask(w, 'faith').some(Boolean)).toBe(false);
    const faith = coverageMask(w, 'faith');
    for (let y = 0; y < w.height; y++)
      for (let x = 0; x < w.width; x++) {
        const probe = {
          id: -1,
          defId: 'house',
          x,
          y,
          connected: false,
          progress: 0,
          state: 'ok',
        } as Building;
        expect(faith[y * w.width + x], `${x},${y}`).toBe(serviceAvailable(w, probe, 'faith'));
      }
  });

  it('AK-S4-04 layoutKey enthält die Ausfälle: Brand ändert, Ende stellt wieder her', () => {
    prepareEast(w, k);
    expect(placeRoad(w, k.x + 2, k.y).ok).toBe(true);
    forceGrass(w, k.x + 3, k.y - 1);
    forceGrass(w, k.x + 3, k.y);
    w.tiles[idx(w, k.x + 3, k.y - 1)]!.terrain = 'forest';
    const lj = placeBuilding(w, 'lumberjack', k.x + 3, k.y);
    expect(lj.ok).toBe(true);
    w.crisisLevel = 'normal';
    w.tick = 2400;
    const k0 = layoutKey(w);
    beginCrisis(w, 0, { kind: 'fire', tile: { x: k.x + 3, y: k.y } });
    const k1 = layoutKey(w);
    expect(k1).not.toBe(k0);
    for (let i = 0; i < 200; i++) step(w);
    expect(layoutKey(w)).not.toBe(k1);
    expect(layoutKey(w)).toBe(k0);

    const calm = createWorld(3);
    const kc = calm.buildings[calm.kontorId]!;
    prepareEast(calm, kc);
    const c0 = layoutKey(calm);
    for (let i = 0; i < 100; i++) step(calm);
    expect(layoutKey(calm)).toBe(c0);
  });

  it('AK-S4-05 unprotectedFlammables aufsteigend; Wache schützt nur im Radius', () => {
    const chapel = placeService(w, 'chapel', k.x + 3, k.y + 3);
    const sheep: Building = {
      id: nextTestId++,
      defId: 'sheepfarm',
      x: k.x + 30,
      y: k.y,
      connected: true,
      progress: 0,
      state: 'ok',
    };
    w.buildings[sheep.id] = sheep;
    houseNearKontor(w);
    direct(w, 'market', true);
    expect(unprotectedFlammables(w).map((b) => b.id)).toEqual([chapel.id, sheep.id]);
    station(w, k.x + 4, k.y + 6, true);
    expect(unprotectedFlammables(w).map((b) => b.id)).toEqual([sheep.id]);
  });

  it('AK-S4-06 placementZone der Feuerwache: Kreis mit serviceRadius', () => {
    const z = placementZone(w, 'firestation', 20, 20)!;
    expect(z).toMatchObject({ cx: 20.5, cy: 20.5, radius: 8 });
    expect(z.tiles).toEqual(tilesInRadius(w, 20.5, 20.5, 8));
  });
});
