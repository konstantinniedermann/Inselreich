import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { demolish, removeRoad } from '../../src/sim/build';
import { refundCost, tickEconomy, totalUpkeep } from '../../src/sim/economy';
import {
  activeEdict,
  activeEdictDef,
  edictReason,
  edictTaxPoints,
  effectiveTaxPct,
  growthInterval,
  setEdict,
} from '../../src/sim/edicts';
import { upgradeDeficit } from '../../src/sim/flow';
import { taxUnits, tickPopulation, tickTaxes, upgradeStatus } from '../../src/sim/population';
import { TIERS } from '../../src/sim/defs/tiers';
import { GOODS, GOOD_IDS } from '../../src/sim/defs/goods';
import { orderUnitReward } from '../../src/sim/orders';
import { deserialize, serialize } from '../../src/sim/save';
import { buy, buyPrice, sellPrice } from '../../src/sim/trade';
import { recomputeConnectivity } from '../../src/sim/roads';
import { paidCost } from '../../src/sim/upgrade';
import type {
  Building,
  BuildingDefId,
  EdictId,
  GoodId,
  TaxLevel,
  Tier,
  World,
} from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import {
  foldBackToV10,
  houseNearKontor,
  placeService,
  placeTownhall,
  putBuilding,
  setHouse,
} from './helpers';
import { shipLiteral } from './seaHelpers';

/** Testwelt (Spec §10): freigeschaltet, gewonnen, Amtsstube, 1000 Geld, Tick 1000. */
export function edictWorld(): World {
  const w = createWorld(3, { unlockAll: true });
  w.won = true;
  placeTownhall(w);
  w.money = 1000;
  w.tick = 1000;
  return w;
}

const townhallOf = (w: World): Building =>
  Object.values(w.buildings).find((b) => b.defId === 'townhall')!;

describe('M13-E1 Edikte: Aktion', () => {
  it('AK-M13E1-03 Ablauf: erlassen, Sperre, wechseln, aufheben', () => {
    const w = edictWorld();
    expect(setEdict(w, 'saving').ok).toBe(true);
    expect([w.money, w.edict, w.edictLockedUntil]).toEqual([400, 'saving', 4000]);
    w.tick = 3999;
    expect(setEdict(w, 'trade')).toEqual({ ok: false, reason: 'Edikt-Sperrzeit' });
    w.tick = 4000;
    expect(setEdict(w, 'trade')).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    w.money = 600;
    expect(setEdict(w, 'trade').ok).toBe(true);
    expect([w.money, w.edict, w.edictLockedUntil]).toEqual([0, 'trade', 7000]);
    w.tick = 7000;
    expect(setEdict(w, null).ok).toBe(true);
    expect([w.money, w.edict, w.edictLockedUntil]).toEqual([0, null, 10000]);
  });

  it('AK-M13E1-04 Gründe und Reihenfolge', () => {
    const w = edictWorld();
    for (const id of ['x', 3, {}])
      expect(setEdict(w, id)).toEqual({ ok: false, reason: 'Ungültiges Edikt' });
    expect(setEdict(w, null)).toEqual({ ok: false, reason: 'Kein Edikt aktiv' });

    const noWon = createWorld(3, { unlockAll: true });
    expect(setEdict(noWon, 'saving')).toEqual({ ok: false, reason: 'Erst nach dem Bürger-Ziel' });
    const noHall = createWorld(3, { unlockAll: true });
    noHall.won = true;
    expect(setEdict(noHall, 'saving')).toEqual({ ok: false, reason: 'Braucht eine Amtsstube' });

    const fire = edictWorld();
    townhallOf(fire).outageUntil = fire.tick + 100;
    expect(setEdict(fire, 'saving')).toEqual({ ok: false, reason: 'Amtsstube wirkt nicht' });

    const same = edictWorld();
    setEdict(same, 'saving');
    same.tick = 1500;
    expect(setEdict(same, 'saving')).toEqual({ ok: false, reason: 'Edikt bereits aktiv' });

    const poor = edictWorld();
    poor.money = -50;
    expect(setEdict(poor, 'trade')).toEqual({ ok: false, reason: 'Zu wenig Geld' });
    const rich = edictWorld();
    setEdict(rich, 'saving');
    rich.money = -50;
    rich.tick = 4000;
    expect(setEdict(rich, null).ok).toBe(true);
  });

  it('AK-M13E1-05 wirft nie, ändert bei Ablehnung nichts, kein RNG', () => {
    const ids: unknown[] = [null, undefined, '', 'saving', 'trade', 'welfare', 'x', 0, NaN, []];
    for (const won of [true, false])
      for (const hall of [true, false])
        for (const id of ids) {
          const w = createWorld(3, { unlockAll: true });
          w.won = won;
          if (hall) placeTownhall(w);
          w.money = 1000;
          w.tick = 1000;
          const before = serialize(w);
          const reason = edictReason(w, id);
          expect(serialize(w)).toBe(before);
          const r = setEdict(w, id);
          expect(typeof r.ok).toBe('boolean');
          expect(r.ok).toBe(reason === null);
          if (!r.ok) expect(serialize(w)).toBe(before);
        }
    const src = readFileSync('src/sim/edicts.ts', 'utf8');
    expect(src).not.toContain('./rng');
    expect(src).not.toContain('Math.random');
  });

  it('AK-M13E1-14 Abriss der Amtsstube hebt das Edikt auf, Sperre bleibt', () => {
    const w = edictWorld();
    setEdict(w, 'saving');
    w.tick = 2000;
    const hall = townhallOf(w);
    const before = w.money;
    const refund = refundCost(paidCost(hall)).money;
    expect(demolish(w, hall.id).ok).toBe(true);
    expect(w.edict).toBeNull();
    expect(w.edictLockedUntil).toBe(4000);
    expect(w.money).toBe(before + refund);
    w.tick = 2500;
    placeTownhall(w);
    expect(setEdict(w, 'trade')).toEqual({ ok: false, reason: 'Edikt-Sperrzeit' });
    w.tick = 4000;
    w.money = 600;
    expect(setEdict(w, 'trade').ok).toBe(true);
  });

  it('AK-M13E1-15 Freischaltung über won und v10-Stand', () => {
    const w = edictWorld();
    w.won = false;
    expect(setEdict(w, 'saving').ok).toBe(false);
    w.won = true;
    expect(setEdict(w, 'saving').ok).toBe(true);

    const old = edictWorld();
    const res = deserialize(JSON.stringify(foldBackToV10(JSON.parse(serialize(old)))));
    if (!res.ok) throw new Error(res.reason);
    const loaded = res.world;
    expect(loaded.won).toBe(true);
    expect(edictReason(loaded, 'saving')).toBeNull();
    expect(setEdict(loaded, 'saving').ok).toBe(true);
  });

  it('activeEdict ruht bei Brand und fehlender Anbindung, Zustand bleibt', () => {
    const w = edictWorld();
    setEdict(w, 'saving');
    expect(activeEdict(w)).toBe('saving');
    expect(activeEdictDef(w)?.id).toBe('saving');
    const hall = townhallOf(w);
    hall.outageUntil = w.tick + 100;
    expect(activeEdict(w)).toBeNull();
    expect(activeEdictDef(w)).toBeNull();
    expect(w.edict).toBe('saving');
    hall.outageUntil = undefined;
    expect(activeEdict(w)).toBe('saving');

    const k = w.buildings[w.islands[0]!.kontorId!]!;
    expect(removeRoad(w, k.x, k.y + 2).ok).toBe(true);
    recomputeConnectivity(w);
    expect(hall.connected).toBe(false);
    expect(activeEdict(w)).toBeNull();
    expect(w.edict).toBe('saving');
  });
});

describe('M13-E1 Kaufpreis Handel', () => {
  const tradeWorld = (): World => {
    const w = edictWorld();
    setEdict(w, 'trade');
    return w;
  };

  it('AK-M13E1-09 Handel senkt den Kaufpreis, aufgerundet über die Gesamtmenge', () => {
    const w = tradeWorld();
    expect(buyPrice(w, 'food', 1)).toBe(7);
    expect(buyPrice(w, 'food', 10)).toBe(64);
    expect(buyPrice(w, 'glass', 10)).toBe(400);
    expect(buyPrice(w, 'spice', 1)).toBe(32);
    const before = w.money;
    expect(buy(w, 'food', 10).ok).toBe(true);
    expect(w.money).toBe(before - 64);
  });

  it('AK-M13E1-09 ohne wirkendes Edikt gilt n × buy (auch AK-M13E1-13)', () => {
    const plain = edictWorld();
    expect(buyPrice(plain, 'food', 10)).toBe(80);
    const w = tradeWorld();
    w.edict = null;
    expect(buyPrice(w, 'food', 10)).toBe(80);
    const out = tradeWorld();
    townhallOf(out).outageUntil = out.tick + 100;
    expect(buyPrice(out, 'food', 10)).toBe(80);
    const loose = tradeWorld();
    const k = loose.buildings[loose.islands[0]!.kontorId!]!;
    removeRoad(loose, k.x, k.y + 2);
    recomputeConnectivity(loose);
    expect(buyPrice(loose, 'food', 10)).toBe(80);
  });

  it('AK-M13E1-10 Arbitrage: Kaufpreis n = 1 laut Tabelle', () => {
    const w = tradeWorld();
    const expected = {
      wood: 8,
      tools: 32,
      stone: 12,
      food: 7,
      wool: 10,
      cloth: 24,
      cane: 10,
      rum: 32,
      glass: 40,
      spice: 32,
    };
    for (const g of GOOD_IDS) expect(buyPrice(w, g, 1)).toBe(expected[g as keyof typeof expected]);
  });

  it('AK-M13E1-10 Arbitrage: Kauf teurer als Prämie und Boom-Verkauf', () => {
    const w = tradeWorld();
    for (const g of GOOD_IDS) {
      const boom = tradeWorld();
      boom.crisis = { period: 1, kind: 'boom', from: 0, until: 9999, good: g };
      boom.sellPct[g] = 100;
      for (const n of [1, 10, 100]) {
        if (GOODS[g].order !== undefined)
          expect(buyPrice(w, g, n)).toBeGreaterThan(n * orderUnitReward(g));
        expect(buyPrice(w, g, n)).toBeGreaterThan(sellPrice(boom, g, n));
      }
    }
  });
});

describe('M13-E1 Steuer und Unterhalt', () => {
  const SPOT = { x: 20, y: 20 };
  let spotN = 0;
  const spot = (w: World): { x: number; y: number } => {
    const isl = w.islands[0]!;
    const per = Math.floor((isl.width - SPOT.x) / 2);
    const n = spotN++;
    return { x: SPOT.x + (n % per) * 2, y: SPOT.y + Math.floor(n / per) * 2 };
  };
  const put = (w: World, defId: Parameters<typeof putBuilding>[2]): Building => {
    const p = spot(w);
    return putBuilding(w, 0, defId, p.x, p.y);
  };
  const house = (w: World, tier: Tier, n: number, met: boolean): void => {
    const b = put(w, 'house');
    const h = b.house!;
    const def = TIERS[tier];
    setHouse(b, tier, n);
    for (const g of Object.keys(def.needs) as GoodId[]) h.satisfied[g] = met;
    for (const s of def.services) h.services[s] = met;
    h.supplied = met;
  };
  /** Welt A.1 (Anhang 01 A): fünf Häuser, gemischte Steuerstufen. */
  const worldA1 = (): World => {
    spotN = 0;
    const w = edictWorld();
    w.taxLevels = { 1: 'low', 2: 'normal', 3: 'high', 4: 'high' };
    house(w, 1, 4, true);
    house(w, 2, 8, true);
    house(w, 2, 8, false);
    house(w, 3, 11, true);
    house(w, 4, 15, true);
    w.taxCarry = 0;
    w.money = 0;
    return w;
  };
  /** Welt A.2: vier Kaufleute-Häuser à 20, erfüllt, «normal». */
  const worldA2 = (): World => {
    spotN = 0;
    const w = edictWorld();
    for (let i = 0; i < 4; i++) house(w, 4, 20, true);
    w.taxCarry = 0;
    w.money = 0;
    return w;
  };
  /** Welt B Zeile 1: Kontor, Amtsstube, 2 Fischer, Glashütte. */
  const worldB = (): World => {
    spotN = 0;
    const w = edictWorld();
    put(w, 'fisher');
    put(w, 'fisher');
    put(w, 'glassworks');
    w.money = 0;
    return w;
  };
  const withEdict = (w: World, id: EdictId | null): World => {
    w.edict = id;
    return w;
  };
  const runTaxes = (w: World): [number, number] => {
    for (let i = 0; i < 100; i++) tickTaxes(w);
    return [w.money, w.taxCarry];
  };

  it('AK-M13E1-06 taxUnits und wirksamer Satz je Edikt', () => {
    const expected: [EdictId | null, number][] = [
      [null, 133_860],
      ['saving', 125_796],
      ['welfare', 128_100],
      ['trade', 133_860],
    ];
    for (const [id, units] of expected) expect(taxUnits(withEdict(worldA1(), id))).toBe(units);
    expect(effectiveTaxPct(withEdict(worldA1(), 'saving'), 4)).toBe(108);
    expect(edictTaxPoints(withEdict(worldA1(), 'welfare'))).toBe(5);
    expect(edictTaxPoints(worldA1())).toBe(0);
  });

  it('AK-M13E1-07 100 Ticks Steuern: Geld und Übertrag je Edikt', () => {
    expect(runTaxes(worldA1())).toEqual([669, 6000]);
    expect(runTaxes(withEdict(worldA1(), 'saving'))).toEqual([628, 19_600]);
    expect(runTaxes(withEdict(worldA1(), 'welfare'))).toEqual([640, 10_000]);
    expect(runTaxes(worldA2())).toEqual([1760, 0]);
    expect(runTaxes(withEdict(worldA2(), 'saving'))[0]).toBe(1636);
    expect(runTaxes(withEdict(worldA2(), 'saving'))[1]).toBe(16_000);
    expect(runTaxes(withEdict(worldA2(), 'welfare'))).toEqual([1672, 0]);
  });

  it('AK-M13E1-08 Unterhalt mit Edikt, Schiff und gebuchter Wert', () => {
    expect(totalUpkeep(worldB())).toBe(55);
    expect(totalUpkeep(withEdict(worldB(), 'saving'))).toBe(44);
    expect(totalUpkeep(withEdict(worldB(), 'trade'))).toBe(55);
    expect(totalUpkeep(withEdict(worldB(), 'welfare'))).toBe(55);
    const ship = worldB();
    shipLiteral(ship);
    expect(totalUpkeep(ship)).toBe(70);
    expect(totalUpkeep(withEdict(ship, 'saving'))).toBe(56);
    const w = withEdict(worldB(), 'saving');
    w.upkeepCarry = 0;
    for (let i = 0; i < 100; i++) tickEconomy(w);
    expect(w.money).toBe(-44);
    expect(w.stats.upkeep).toBe(44);
  });

  it('AK-M13E1-13 Ausfall oder Trennung der Amtsstube: Werte wie ohne Edikt', () => {
    const w = withEdict(worldA1(), 'saving');
    const hall = townhallOf(w);
    hall.outageUntil = w.tick + 100;
    const noEdict = withEdict(worldA1(), null);
    townhallOf(noEdict).outageUntil = noEdict.tick + 100;
    expect(taxUnits(w)).toBe(taxUnits(noEdict));
    expect(totalUpkeep(w)).toBe(totalUpkeep(withEdict(worldA1(), null)));
    expect([w.edict, w.edictLockedUntil]).toEqual(['saving', 0]);
    delete hall.outageUntil;
    expect(taxUnits(w)).toBe(125_796);
    expect(totalUpkeep(w)).toBeLessThan(totalUpkeep(withEdict(worldA1(), null)));

    const loose = withEdict(worldB(), 'saving');
    townhallOf(loose).connected = false;
    expect(totalUpkeep(loose)).toBe(55);
    townhallOf(loose).connected = true;
    expect(totalUpkeep(loose)).toBe(44);
  });

  it('AK-M13E1-20 Edikt im Endzustand wirkt bewusst klein', () => {
    const balance = (id: EdictId | null): number => {
      spotN = 0;
      const w = withEdict(worldA2(), id);
      for (let i = 0; i < 32; i++) put(w, 'school');
      expect(totalUpkeep(withEdict(w, null))).toBe(820);
      w.edict = id;
      w.taxCarry = 0;
      w.upkeepCarry = 0;
      w.money = 0;
      for (let i = 0; i < 600; i++) {
        tickTaxes(w);
        tickEconomy(w);
      }
      return w.money;
    };
    expect(balance(null)).toBe(5640);
    expect(balance('saving')).toBe(5884);
    expect(balance('welfare')).toBe(5112);
    expect(balance('trade')).toBe(5640);
    const trade = withEdict(edictWorld(), 'trade');
    expect(buyPrice(trade, 'stone', 48)).toBe(576);
    expect(buyPrice(edictWorld(), 'stone', 48)).toBe(720);
  });
});

describe('M13-E1 Takt und Wartezeit', () => {
  const FILL: GoodId[] = ['food', 'cloth', 'rum', 'glass', 'spice', 'wood', 'tools', 'stone'];
  const fill = (w: World, except: GoodId[] = []): void => {
    for (const g of FILL) if (!except.includes(g)) home(w).stock[g] = 100;
    w.money = 1_000_000;
  };

  /** Welt mit Haus am Kontor und Kapelle, Schule, Badehaus in Reichweite. */
  const townWorld = (): { w: World; house: Building; chapel: Building } => {
    const w = edictWorld();
    const house = houseNearKontor(w);
    const k = w.buildings[home(w).kontorId]!;
    const chapel = placeService(w, 'chapel', k.x + 4, k.y);
    const school = placeService(w, 'school', k.x + 6, k.y);
    const bath = placeService(w, 'bathhouse', k.x + 8, k.y);
    for (const s of [chapel, school, bath]) s.connected = true; // Platzieren setzt die Anbindung zurück
    fill(w);
    return { w, house, chapel };
  };
  const full = (b: Building, tier: Tier, n: number): void => {
    setHouse(b, tier, n);
    const h = b.house!;
    for (const g of Object.keys(TIERS[tier].needs) as GoodId[]) h.satisfied[g] = true;
    h.supplied = true;
  };
  /** Ein Tick der Bevölkerung (ohne Produktion und Krisen). */
  const pop = (w: World, except: GoodId[] = []): void => {
    fill(w, except);
    w.tick++;
    tickPopulation(w);
  };
  const runTo = (w: World, tick: number, except: GoodId[] = []): void => {
    while (w.tick < tick) pop(w, except);
  };

  it('AK-M13E1-11 Wachsen: Takt 50 ohne, Takt 40 mit Wohlfahrt', () => {
    for (const [id, at150, at149] of [
      [null, 2150, 2149],
      ['welfare', 2120, 2119],
    ] as const) {
      const { w, house } = townWorld();
      w.tick = 2000;
      full(house, 1, 1);
      house.house!.satisfiedSince = 2000;
      w.edict = id;
      runTo(w, at149);
      expect(house.house!.inhabitants).toBe(3);
      runTo(w, at150);
      expect(house.house!.inhabitants).toBe(4);
    }
  });

  it('AK-M13E1-11 Schrumpfen: Kaufleute ohne Nahrung nach 400 Ticks', () => {
    for (const [id, left] of [
      [null, 12],
      ['welfare', 10],
    ] as const) {
      const { w, house } = townWorld();
      w.tick = 2000;
      full(house, 4, 20);
      w.edict = id;
      home(w).stock.food = 0;
      runTo(w, 2400, ['food']);
      expect(house.house!.inhabitants).toBe(left);
    }
  });

  it('AK-M13E1-11 Takt ist Phase des Ticks: Erlass bei 2010, erster Schritt 2040', () => {
    const { w, house } = townWorld();
    w.tick = 2000;
    full(house, 1, 1);
    house.house!.satisfiedSince = 2000;
    runTo(w, 2010);
    w.edictLockedUntil = 0;
    expect(setEdict(w, 'welfare').ok).toBe(true);
    runTo(w, 2039);
    expect(house.house!.inhabitants).toBe(1);
    runTo(w, 2040);
    expect(house.house!.inhabitants).toBe(2);
  });

  it('AK-M13E1-11 growthInterval: 40 mit Wohlfahrt, 50 bei Ausfall oder ohne', () => {
    const { w } = townWorld();
    expect(growthInterval(w)).toBe(50);
    w.edict = 'welfare';
    expect(growthInterval(w)).toBe(40);
    townhallOf(w).outageUntil = w.tick + 100;
    expect(growthInterval(w)).toBe(50);
  });

  const D_ROWS: [string, TaxLevel, boolean, boolean, number | null][] = [
    ['normal', 'normal', false, false, 300],
    ['normal Wohlfahrt', 'normal', false, true, 200],
    ['normal Fest', 'normal', true, false, 150],
    ['normal Fest Wohlfahrt', 'normal', true, true, 150],
    ['niedrig', 'low', false, false, 150],
    ['niedrig Wohlfahrt', 'low', false, true, 150],
    ['niedrig Fest Wohlfahrt', 'low', true, true, 150],
    ['hoch Fest Wohlfahrt', 'high', true, true, null],
  ];
  const waitReason = (w: World, b: Building, budget?: Record<string, number>): string | undefined =>
    upgradeStatus(w, b, budget).reasons.find(
      (r) => r.startsWith('Bedürfnisse') || r === 'Steuer zu hoch',
    );
  const NO_DEFICIT = { food: 99, cloth: 99, rum: 99, glass: 99, wood: 99, tools: 99, stone: 99 };
  const DEFICIT = { ...NO_DEFICIT, rum: -99 };

  it.each(D_ROWS)('AK-M13E1-12 Stapelregel %s', (_n, level, feast, welfare, wait) => {
    const { w, house, chapel } = townWorld();
    full(house, 2, 8);
    w.taxLevels[2] = level;
    w.edict = welfare ? 'welfare' : null;
    house.house!.satisfiedSince = w.tick - 100;
    if (feast) {
      chapel.feastAt = w.tick;
    }
    fill(w);
    if (wait === null) {
      expect(waitReason(w, house, NO_DEFICIT)).toBe('Steuer zu hoch');
      return;
    }
    expect(waitReason(w, house, NO_DEFICIT)).toBe(`Bedürfnisse noch nicht ${wait} Ticks erfüllt`);
    expect(waitReason(w, house, DEFICIT)).toBe(`Bedürfnisse noch nicht ${wait * 2} Ticks erfüllt`);
  });

  it('AK-M13E1-13 Ausfall oder Trennung: Wartezeit wie ohne Edikt, danach 200', () => {
    for (const mode of ['outage', 'loose'] as const) {
      const { w, house } = townWorld();
      full(house, 2, 8);
      house.house!.satisfiedSince = w.tick - 100;
      w.edict = 'welfare';
      const hall = townhallOf(w);
      if (mode === 'outage') hall.outageUntil = w.tick + 100;
      else hall.connected = false;
      expect(growthInterval(w)).toBe(50);
      expect(waitReason(w, house, NO_DEFICIT)).toBe('Bedürfnisse noch nicht 300 Ticks erfüllt');
      if (mode === 'outage') delete hall.outageUntil;
      else hall.connected = true;
      expect(growthInterval(w)).toBe(40);
      expect(waitReason(w, house, NO_DEFICIT)).toBe('Bedürfnisse noch nicht 200 Ticks erfüllt');
      expect(w.edict).toBe('welfare');
    }
  });

  /** Erzeuger roh und angebunden einsetzen, bis ein Aufstieg ins Kaufleute-Haus kein Defizit auslöst. */
  const supplyProducers = (w: World, house: Building): void => {
    const maker: Partial<Record<GoodId, BuildingDefId>> = {
      food: 'fisher',
      cloth: 'weaver',
      rum: 'distillery',
      glass: 'glassworks',
    };
    const saved = { tier: house.house!.tier, n: house.house!.inhabitants };
    setHouse(house, 3, 15);
    for (let i = 0; i < 40; i++) {
      const d = upgradeDeficit(w, house);
      if (d === null) break;
      putBuilding(w, 0, maker[d.good]!, 4 + (i % 12) * 4, 40 + Math.floor(i / 12) * 4);
    }
    setHouse(house, saved.tier, saved.n);
  };

  const PATHS: [string, EdictId | null, TaxLevel, number[]][] = [
    ['keins, alle normal', null, 'normal', [300, 600, 950, 1200]],
    ['keins, P+S niedrig', null, 'low', [150, 350, 700, 950]],
    ['Wohlfahrt, alle normal', 'welfare', 'normal', [200, 400, 680, 880]],
    ['Wohlfahrt, P+S niedrig', 'welfare', 'low', [160, 320, 600, 800]],
  ];
  it.each(PATHS)('AK-M13E1-16 Pfadzeit %s', (_n, id, level, expected) => {
    const { w, house } = townWorld();
    w.tick = 2000;
    w.edict = id;
    w.taxLevels = { 1: level, 2: level, 3: 'normal', 4: 'normal' };
    supplyProducers(w, house);
    full(house, 1, 1);
    house.house!.satisfiedSince = 2000;
    const reached: number[] = [];
    let tier = 1;
    for (let i = 0; i < 1300 && !(tier === 4 && house.house!.inhabitants === 20); i++) {
      if (tier < 4) expect(upgradeDeficit(w, house)).toBeNull();
      pop(w);
      if (house.house!.tier !== tier) {
        tier = house.house!.tier;
        reached.push(w.tick - 2000);
      }
    }
    expect(house.house!.inhabitants).toBe(20);
    expect(reached).toEqual(expected.slice(0, 3));
    expect(w.tick - 2000).toBe(expected[3]);
  });
});
