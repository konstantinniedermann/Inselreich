import { describe, expect, it } from 'vitest';
import { START_STOCK } from '../../src/sim/defs/goods';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { GROWTH_INTERVAL } from '../../src/sim/defs/timing';
import { WIN_CITIZENS } from '../../src/sim/defs/tiers';
import { demolish, placeBuilding } from '../../src/sim/build';
import { beginCrisis, fireTarget, flammableRect, isProtected } from '../../src/sim/crises';
import { goodsBalance } from '../../src/sim/flow';
import { cycleOf } from '../../src/sim/levels';
import { deliverOrder, maxHouseTier } from '../../src/sim/orders';
import {
  citizens,
  isSupplied,
  merchants,
  populationByTier,
  serviceAvailable,
  tickPopulation,
  tryUpgrade,
} from '../../src/sim/population';
import { tickProduction } from '../../src/sim/production';
import { houseDiagnosis, missingInputs } from '../../src/sim/queries';
import { recomputeConnectivity } from '../../src/sim/roads';
import { inSupplyRange } from '../../src/sim/supply';
import { step } from '../../src/sim/tick';
import { buy, sell } from '../../src/sim/trade';
import { triggeredUnlocks } from '../../src/sim/unlocks';
import { upgradeBuilding } from '../../src/sim/upgrade';
import { center, createWorld, home, idx, islandOf, tileAt } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { houseFar, putBuilding, setHouse, twoIslandWorld } from './helpers';

describe('M12 E0 Helfer', () => {
  it('PLAN-H1 home/islandOf liefern Raster, Lager und Kontor der Heimat', () => {
    const w = createWorld(3);
    expect(home(w).tiles.length).toBe(4096);
    expect(home(w).kontorId).toBe(1);
    expect(home(w).stock).toEqual(START_STOCK);
    expect(islandOf(w, w.buildings[1]!)).toBe(home(w));
    const k = w.buildings[1]!;
    expect(tileAt(home(w), k.x, k.y)!.buildingId).toBe(1);
  });
});

const snap = (w: World, i: number): World['islands'][number]['stock'] => ({
  ...w.islands[i]!.stock,
});
const grass = (w: World, i: number, x: number, y: number): void => {
  const t = w.islands[i]!.tiles[idx(w.islands[i]!, x, y)]!;
  t.terrain = 'grass';
};
const kontorPos = (w: World): { x: number; y: number } => {
  const k = w.buildings[home(w).kontorId]!;
  return { x: k.x, y: k.y };
};

describe('M12 E0 Inselbezug', () => {
  it('AK-E0-10 I00 Testwelt: zwei Inseln, Kontor auf Insel 1 mit eigener Id', () => {
    const w = twoIslandWorld();
    expect(w.islands.length).toBe(2);
    const k1 = w.buildings[w.islands[1]!.kontorId]!;
    expect(k1.island).toBe(1);
    expect(k1.id).not.toBe(home(w).kontorId);
    expect(w.islands[1]!.stock.wood).toBe(50);
    expect(w.islands[1]!.stock.food).toBe(0);
  });

  it('AK-E0-10 I01 Fischer auf Insel 1 liefert nur in Insel 1', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    const b = putBuilding(w, 1, 'fisher', x + 4, y);
    const before0 = snap(w, 0);
    for (let i = 0; i < cycleOf(b)!; i++) tickProduction(w);
    expect(w.islands[1]!.stock.food).toBe(1);
    expect(w.islands[0]!.stock).toEqual(before0);
  });

  it('AK-E0-10 I02 Weberei auf Insel 1 entnimmt Wolle nur aus Insel 1', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    const def = BUILDING_DEFS.weaver;
    const good = def.consumes![0]!;
    const b = putBuilding(w, 1, 'weaver', x + 4, y);
    w.islands[0]!.stock[good] = 5;
    tickProduction(w);
    expect(b.state).toBe('waitingInput');
    expect(w.islands[0]!.stock[good]).toBe(5);
    expect(missingInputs(w, b)).toEqual([good]);
    w.islands[1]!.stock[good] = 3;
    tickProduction(w);
    expect(w.islands[1]!.stock[good]).toBe(2);
    expect(w.islands[0]!.stock[good]).toBe(5);
  });

  it('AK-E0-10 I03 Haus auf Insel 1 entnimmt nur aus Insel 1', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    putBuilding(w, 1, 'house', x + 2, y);
    w.islands[1]!.stock.food = 10;
    w.islands[0]!.stock.food = 10;
    w.tick = 1;
    tickPopulation(w);
    expect(w.islands[1]!.stock.food).toBe(9);
    expect(w.islands[0]!.stock.food).toBe(10);
  });

  function upgradeSetup(island: number): { w: World; id: number } {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    const b = putBuilding(w, island, 'house', x + 2, y);
    putBuilding(w, island, 'chapel', x + 2, y + 3);
    setHouse(b, 1, 4);
    b.house!.satisfiedSince = -100000;
    w.islands[island]!.stock.cloth = 5;
    w.money = 1000;
    return { w, id: b.id };
  }

  it('AK-E0-10 I04 Aufstieg auf Insel 1 zahlt Waren aus Insel 1, Geld global', () => {
    const { w, id } = upgradeSetup(1);
    const before0 = snap(w, 0);
    const before1 = snap(w, 1);
    expect(tryUpgrade(w, w.buildings[id]!)).toBe(true);
    expect(w.money).toBe(900);
    expect(w.islands[1]!.stock.wood).toBe(before1.wood - 5);
    expect(w.islands[1]!.stock.tools).toBe(before1.tools - 2);
    expect(w.islands[1]!.stock.cloth).toBe(4);
    expect(w.islands[0]!.stock).toEqual(before0);
  });

  it('AK-E0-10 I05 Bau auf Insel 1 zahlt aus Insel 1; fehlt Holz dort, scheitert er', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    grass(w, 1, x + 2, y);
    w.money = 1000;
    w.islands[1]!.stock.wood = 0;
    w.islands[0]!.stock.wood = 100;
    const r = placeBuilding(w, 'house', x + 2, y, 1);
    expect(r.ok).toBe(false);
    expect(Object.values(w.buildings).filter((b) => b.defId === 'house').length).toBe(0);
    w.islands[1]!.stock.wood = 50;
    const before0 = snap(w, 0);
    const ok = placeBuilding(w, 'house', x + 2, y, 1);
    expect(ok.ok).toBe(true);
    expect(w.buildings[ok.id!]!.island).toBe(1);
    expect(w.islands[1]!.stock.wood).toBe(47);
    expect(w.islands[0]!.stock).toEqual(before0);
    expect(tileAt(w.islands[1]!, x + 2, y)!.buildingId).toBe(ok.id);
    expect(tileAt(home(w), x + 2, y)!.buildingId).toBeNull();
  });

  it('AK-E0-10 I06 Bau auf Insel 1 an einer Koordinate, die auf Insel 0 belegt ist, gelingt', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    grass(w, 0, x + 2, y);
    grass(w, 1, x + 2, y);
    w.money = 1000;
    expect(placeBuilding(w, 'house', x + 2, y).ok).toBe(true);
    expect(placeBuilding(w, 'house', x + 2, y).ok).toBe(false);
    expect(placeBuilding(w, 'house', x + 2, y, 1).ok).toBe(true);
  });

  it('AK-E0-10 I07 Ausbau eines Betriebs auf Insel 1 zahlt aus Insel 1', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    const b = putBuilding(w, 1, 'fisher', x + 4, y);
    for (const g of GOOD_IDS) {
      w.islands[0]!.stock[g] = 50;
      w.islands[1]!.stock[g] = 50;
    }
    w.money = 1000;
    const before0 = snap(w, 0);
    const before1 = snap(w, 1);
    expect(upgradeBuilding(w, b.id).ok).toBe(true);
    expect(w.islands[0]!.stock).toEqual(before0);
    expect(w.islands[1]!.stock).not.toEqual(before1);
  });

  it('AK-E0-10 I08 Abriss auf Insel 1 erstattet in Insel 1', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    const b = putBuilding(w, 1, 'fisher', x + 4, y);
    const before0 = snap(w, 0);
    const wood1 = w.islands[1]!.stock.wood;
    expect(demolish(w, b.id).ok).toBe(true);
    expect(w.islands[1]!.stock.wood).toBe(wood1 + 2);
    expect(w.islands[0]!.stock).toEqual(before0);
  });

  it('AK-E0-10 I09 Kauf und Verkauf am Kontor von Insel 1 buchen in Insel 1; sellPct sinkt global', () => {
    const w = twoIslandWorld();
    w.money = 10000;
    const before0 = snap(w, 0);
    expect(buy(w, 'wood', 5, 1).ok).toBe(true);
    expect(w.islands[1]!.stock.wood).toBe(55);
    expect(sell(w, 'tools', 5, 1).ok).toBe(true);
    expect(w.islands[1]!.stock.tools).toBe(45);
    expect(w.islands[0]!.stock).toEqual(before0);
    expect(w.sellPct.tools).toBeLessThan(100);
    expect(buy(w, 'wood', 1, 7).ok).toBe(false);
    expect(buy(w, 'wood', 1, -1).ok).toBe(false);
  });

  it('AK-E0-10 I10 Auftrag liefert aus Insel 0, auch wenn Insel 1 genug hat', () => {
    const w = twoIslandWorld();
    w.order = { period: 0, good: 'food', amount: 10, reward: 100, due: 1000 };
    w.islands[0]!.stock.food = 0;
    w.islands[1]!.stock.food = 50;
    expect(deliverOrder(w).ok).toBe(false);
    w.islands[0]!.stock.food = 12;
    expect(deliverOrder(w).ok).toBe(true);
    expect(w.islands[0]!.stock.food).toBe(2);
    expect(w.islands[1]!.stock.food).toBe(50);
  });

  it('AK-E0-10 I11 Bilanz zählt nur Betriebe und Häuser auf Insel 0', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    putBuilding(w, 0, 'fisher', x + 4, y);
    putBuilding(w, 0, 'house', x + 2, y);
    const base = goodsBalance(w);
    putBuilding(w, 1, 'fisher', x + 4, y);
    putBuilding(w, 1, 'house', x + 2, y);
    expect(goodsBalance(w)).toEqual(base);
  });

  it('AK-E0-10 I12 Brandziel umfasst nur brennbare Gebäude auf Insel 0', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    putBuilding(w, 0, 'chapel', x + 2, y + 3);
    const base = flammableRect(w);
    expect(base).toEqual({ x0: x + 2, y0: y + 3, x1: x + 3, y1: y + 4 });
    putBuilding(w, 1, 'chapel', 50, 50);
    expect(flammableRect(w)).toEqual(base);
    expect(fireTarget(w, { x: 50, y: 50 })).toBeNull();
  });

  it('AK-E0-11 I13 Haus auf Insel 0 bleibt ohne Versorgung und Dienst durch Kontor, Markt, Kapelle auf Insel 1', () => {
    const w = twoIslandWorld();
    const house = houseFar(w);
    const k1 = w.buildings[w.islands[1]!.kontorId]!;
    k1.x = house.x;
    k1.y = house.y;
    putBuilding(w, 1, 'market', house.x, house.y + 2);
    putBuilding(w, 1, 'chapel', house.x + 2, house.y);
    const c = center(BUILDING_DEFS.house, house.x, house.y);
    expect(inSupplyRange(w, 1, c.cx, c.cy)).toBe(true);
    expect(inSupplyRange(w, 0, c.cx, c.cy)).toBe(false);
    expect(isSupplied(w, house)).toBe(false);
    expect(serviceAvailable(w, house, 'faith')).toBe(false);
    expect(houseDiagnosis(w, house)).toEqual([{ kind: 'supply' }]);
    putBuilding(w, 0, 'chapel', house.x + 2, house.y);
    expect(serviceAvailable(w, house, 'faith')).toBe(true);
  });

  it('AK-E0-11 I14 Weg auf Insel 1 an gleicher Koordinate bindet kein Gebäude auf Insel 0 an', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    const f0 = putBuilding(w, 0, 'fisher', x + 4, y);
    const f1 = putBuilding(w, 1, 'fisher', x + 4, y);
    f0.connected = false;
    f1.connected = false;
    for (const dx of [2, 3]) tileAt(w.islands[1]!, x + dx, y)!.road = true;
    recomputeConnectivity(w);
    expect(f1.connected).toBe(true);
    expect(f0.connected).toBe(false);
  });

  it('AK-E0-11 I16 Feuerwache auf Insel 1 schützt kein Gebäude auf Insel 0', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    const chapel = putBuilding(w, 0, 'chapel', x + 2, y + 3);
    putBuilding(w, 1, 'firestation', x + 2, y + 3);
    expect(isProtected(w, chapel)).toBe(false);
    beginCrisis(w, 0, { kind: 'fire', tile: { x: x + 2, y: y + 3 } });
    expect(w.crisis!.outcome).toBe('burning');
    const w2 = twoIslandWorld();
    const c2 = putBuilding(w2, 0, 'chapel', x + 2, y + 3);
    putBuilding(w2, 0, 'firestation', x + 2, y + 3);
    expect(isProtected(w2, c2)).toBe(true);
  });

  it('AK-E0-14 Geld für genau einen Aufstieg: kleinere Id auf Insel 1 steigt auf, grössere auf Insel 0 nicht', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    const ids: number[] = [];
    for (const i of [1, 0]) {
      const b = putBuilding(w, i, 'house', x + 2, y);
      putBuilding(w, i, 'chapel', x + 2, y + 3);
      setHouse(b, 1, 4);
      b.house!.satisfiedSince = -100000;
      w.islands[i]!.stock.cloth = 5;
      w.islands[i]!.stock.food = 20;
      w.islands[i]!.stock.wood = 50;
      w.islands[i]!.stock.tools = 50;
      ids.push(b.id);
    }
    expect(ids[0]!).toBeLessThan(ids[1]!);
    w.money = 100;
    w.tick = GROWTH_INTERVAL - 1;
    step(w);
    expect(w.buildings[ids[0]!]!.house!.tier).toBe(2);
    expect(w.buildings[ids[1]!]!.house!.tier).toBe(1);
  });

  it('AK-E0-21 I15 Zählungen sind global über beide Inseln', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    const a = putBuilding(w, 0, 'house', x + 2, y);
    const b = putBuilding(w, 0, 'house', x + 2, y + 1);
    const c = putBuilding(w, 1, 'house', x + 2, y);
    const d = putBuilding(w, 1, 'house', x + 2, y + 1);
    setHouse(a, 3, 15);
    setHouse(b, 3, 15);
    setHouse(c, 3, 15);
    setHouse(d, 3, 5);
    expect(citizens(w)).toBe(WIN_CITIZENS);
    step(w);
    expect(w.won).toBe(true);
    setHouse(a, 4, 10);
    setHouse(c, 4, 10);
    expect(merchants(w)).toBe(20);
    expect(maxHouseTier(w)).toBe(4);
    expect(populationByTier(w)[4]).toBe(20);
    expect(populationByTier(w)[3]).toBe(20);
  });

  it('AK-E0-21 Auslöser houses/tierWish/tierReached/tierOpen zählen beide Inseln', () => {
    const base = (island: number): ReturnType<typeof triggeredUnlocks> => {
      const w = createWorld(3);
      const w2 = twoIslandWorld();
      w.islands = w2.islands;
      w.buildings = w2.buildings;
      w.nextBuildingId = w2.nextBuildingId;
      const { x, y } = kontorPos(w);
      const h = putBuilding(w, island, 'house', x + 2, y);
      setHouse(h, 3, 15);
      return triggeredUnlocks(w);
    };
    expect(base(1)).toEqual(base(0));
    expect(base(1).length).toBeGreaterThan(1);
  });

  it('Unbekannte Insel liefert fail, wirft nie', () => {
    const w = twoIslandWorld();
    const { x, y } = kontorPos(w);
    grass(w, 0, x + 2, y);
    w.money = 1000;
    for (const bad of [9, -1, 1.5]) {
      const r = placeBuilding(w, 'house', x + 2, y, bad);
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.reason).toBe('Unbekannte Insel');
    }
    expect(Object.values(w.buildings).filter((b) => b.defId === 'house').length).toBe(0);
    expect(islandOf(w, w.buildings[w.islands[1]!.kontorId]!)).toBe(w.islands[1]);
  });
});
