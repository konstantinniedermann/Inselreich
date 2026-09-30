import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, idx } from '../../src/sim/world';
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
  effectiveRefund,
  goodsBalance,
  houseDiagnosis,
  layoutKey,
  placementZone,
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
    ];
    for (const call of calls) {
      call();
      expect(serialize(w)).toBe(snapshot);
    }
  });
});
