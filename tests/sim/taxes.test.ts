import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { UPKEEP_INTERVAL, totalUpkeep } from '../../src/sim/economy';
import { step } from '../../src/sim/tick';
import {
  citizens,
  houseCap,
  newHouseState,
  populationByTier,
  taxUnits,
  tickTaxes,
  totalTaxes,
  tryUpgrade,
  upgradeStatus,
} from '../../src/sim/population';
import { TAX_CARRY_DIVISOR, TAX_LEVELS, TIERS } from '../../src/sim/defs/tiers';
import {
  TAX_SWITCH_LOCK,
  UPGRADE_DEFICIT_WAIT_FACTOR,
  UPGRADE_WAIT,
} from '../../src/sim/defs/timing';
import { setTaxLevel } from '../../src/sim/tax';
import type { Building, GoodId, Tier, World } from '../../src/sim/types';
import { forceGrass, placeService, placeTownhall } from './helpers';

let w: World;
let nextTestId = 9000;

/** Legt ein Wohnhaus direkt an (ohne Kacheln); `met` bestimmt, ob alle Bedürfnisse erfüllt sind. */
function addHouse(world: World, tier: Tier, inhabitants: number, met: boolean): void {
  const def = TIERS[tier];
  const satisfied: Partial<Record<GoodId, boolean>> = {};
  for (const g of Object.keys(def.needs) as GoodId[]) satisfied[g] = met;
  const id = nextTestId++;
  world.buildings[id] = {
    id,
    defId: 'house',
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    house: {
      tier,
      inhabitants,
      demand: {},
      satisfied,
      services: { faith: met, school: met },
      satisfiedSince: 0,
      supplied: met,
    },
  };
}

beforeEach(() => {
  w = createWorld(3, { unlockAll: true });
  placeTownhall(w); // M10 T-10: Steuerstufen wirken nur mit aktiver Amtsstube
});

describe('totalTaxes', () => {
  it('pays full tax when satisfied (4 pioneers = 8)', () => {
    addHouse(w, 1, 4, true);
    expect(totalTaxes(w)).toBe(8);
  });
  it('pays half tax when unsatisfied (4 pioneers = 4)', () => {
    addHouse(w, 1, 4, false);
    expect(totalTaxes(w)).toBe(4);
  });
  it('floors a half-tax sum (3 unsatisfied pioneers = 3)', () => {
    addHouse(w, 1, 3, false);
    expect(totalTaxes(w)).toBe(3);
  });
  it('sums first, floors once (two unsatisfied settler houses: 3.5 + 3.5 = 7, not 6)', () => {
    addHouse(w, 2, 1, false);
    addHouse(w, 2, 1, false);
    expect(totalTaxes(w)).toBe(7);
  });
});

describe('tickTaxes', () => {
  it('always updates stats and books per step with carry, not on a tick boundary (M11 S10)', () => {
    addHouse(w, 1, 4, true);
    const m0 = w.money;
    // Anhang 02 D: money = m0 + floor((n * taxUnits + c0) / TAX_CARRY_DIVISOR), w.tick ist egal
    w.tick = UPKEEP_INTERVAL - 1;
    for (let i = 0; i < UPKEEP_INTERVAL - 1; i++) tickTaxes(w);
    expect(w.stats.taxes).toBe(8);
    expect(w.money).toBe(m0 + 7); // n = 99: floor(99 · 1600 / 20 000)
    tickTaxes(w);
    expect(w.money).toBe(m0 + 8); // n = 100: 160 000 Einheiten
    w.tick = 0;
    tickTaxes(w);
    expect(w.money).toBe(m0 + 8); // n = 101: floor(161 600 / 20 000)
  });
  it('books taxes and upkeep together after 100 steps via step (M11 S10)', () => {
    addHouse(w, 1, 4, true);
    const m0 = w.money;
    const upkeep = totalUpkeep(w);
    for (let i = 0; i < UPKEEP_INTERVAL; i++) step(w);
    // Anhang 02 D, n = 100, c0 = u0 = 0: money = m0 + floor(Σ Steuereinheiten / TAX_CARRY_DIVISOR) − floor(100 · upkeep / 100).
    // Das Haus verliert unterwegs die Versorgung: Σ Einheiten = 69 600 = 3 · 20 000 + Übertrag 9 600.
    expect(w.stats.upkeep).toBe(upkeep);
    expect(upkeep).toBe(20);
    expect(w.upkeepCarry).toBe(0);
    expect(w.taxCarry).toBe(9600);
    expect(w.money).toBe(m0 + 3 - 20);
  });
});

describe('citizens', () => {
  it('counts only inhabitants of tier 3 houses', () => {
    addHouse(w, 1, 4, true);
    addHouse(w, 2, 5, true);
    addHouse(w, 3, 7, true);
    addHouse(w, 3, 2, false);
    expect(citizens(w)).toBe(9);
  });
});

describe('populationByTier', () => {
  it('sums inhabitants per tier, zero for empty tiers', () => {
    expect(populationByTier(w)).toEqual({ 1: 0, 2: 0, 3: 0, 4: 0 });
    addHouse(w, 1, 4, true);
    addHouse(w, 1, 2, false);
    addHouse(w, 3, 7, true);
    expect(populationByTier(w)).toEqual({ 1: 6, 2: 0, 3: 7, 4: 0 });
  });
});

/** Versorgte Kolonie: Kontor, Kapelle und Schule in Reichweite; Häuser werden direkt eingefügt. */
function colony(world: World): void {
  const k = world.buildings[world.kontorId]!;
  const chapel = placeService(world, 'chapel', k.x + 2, k.y + 2);
  const school = placeService(world, 'school', k.x + 4, k.y + 2);
  // Das Platzieren der Schule hat die Anbindung neu berechnet; die Dienste gelten hier als angebunden.
  chapel.connected = true;
  school.connected = true;
  feed(world);
}

/** Lager und Kasse auffüllen, damit Versorgung und Aufstiegskosten nie am Vorrat scheitern. */
function feed(world: World): void {
  for (const g of Object.keys(world.stock) as GoodId[]) world.stock[g] = 100;
  world.money = 1_000_000;
}

function readyHouse(world: World, tier: Tier, inhabitants: number, slot: number): Building {
  const k = world.buildings[world.kontorId]!;
  const x = k.x + (slot % 4);
  const y = k.y - 2 - Math.floor(slot / 4);
  forceGrass(world, x, y);
  const id = nextTestId++;
  const house = newHouseState(world);
  house.tier = tier;
  house.inhabitants = inhabitants;
  // Alle Bedarfsgüter der Stufe gelten als geliefert, sonst dauert es Ticks, bis das Haus zufrieden ist.
  for (const g of Object.keys(TIERS[tier].needs) as GoodId[]) {
    house.demand[g] = 0;
    house.satisfied[g] = true;
  }
  const b: Building = {
    id,
    defId: 'house',
    x,
    y,
    connected: false,
    progress: 0,
    state: 'ok',
    house,
  };
  world.buildings[id] = b;
  world.tiles[y * world.width + x]!.buildingId = id;
  return b;
}

function run(world: World, ticks: number): void {
  for (let i = 0; i < ticks; i++) {
    feed(world);
    step(world);
  }
}

describe('setTaxLevel', () => {
  it('AK-S1-07 sperrt das Umschalten 300 Ticks lang', () => {
    w.tick = 1000;
    expect(setTaxLevel(w, 'low')).toEqual({ ok: true });
    expect(w.taxLockedUntil).toBe(1000 + TAX_SWITCH_LOCK);
    w.tick = 1299;
    expect(setTaxLevel(w, 'high')).toEqual({ ok: false, reason: 'Sperrzeit' });
    expect(w.taxLevel).toBe('low');
    w.tick = 1300;
    expect(setTaxLevel(w, 'high')).toEqual({ ok: true });
    expect(w.taxLevel).toBe('high');
  });
  it('AK-S1-07 gleiche Stufe und ungültige Stufe lassen die Sperre unverändert', () => {
    expect(setTaxLevel(w, 'normal')).toEqual({ ok: false, reason: 'Stufe bereits aktiv' });
    expect(w.taxLockedUntil).toBe(0);
    expect(setTaxLevel(w, 'extrem')).toEqual({ ok: false, reason: 'Ungültige Stufe' });
    expect(setTaxLevel(w, 'toString')).toEqual({ ok: false, reason: 'Ungültige Stufe' });
    expect(w.taxLockedUntil).toBe(0);
  });
  it('RF-3a setTaxLevel ist bei negativem Geld erlaubt', () => {
    w.money = -50;
    expect(setTaxLevel(w, 'low')).toEqual({ ok: true });
  });
});

describe('houseCap', () => {
  it('AK-S1-05 Zielbelegung hoch: Pionier 3, Siedler 6, Bürger 11; sonst Höchstbelegung', () => {
    const caps = ([1, 2, 3] as Tier[]).map((t) => houseCap(w, readyHouse(w, t, 1, t).house!));
    expect(caps).toEqual([4, 8, 15]);
    w.taxLevel = 'high';
    const high = ([1, 2, 3] as Tier[]).map((t) => houseCap(w, readyHouse(w, t, 1, t + 3).house!));
    expect(high).toEqual([3, 6, 11]);
    expect(TAX_LEVELS.low.occupancy).toBe(1);
  });
});

describe('tax levels', () => {
  it('AK-S1-05 Steuer hoch: 4 Bürgerhäuser à 15 enden bei 44 Bürgern und Steuer 800', () => {
    colony(w);
    const houses = [0, 1, 2, 3].map((i) => readyHouse(w, 3, 15, i));
    expect(setTaxLevel(w, 'high').ok).toBe(true);
    run(w, 200);
    expect(houses.map((h) => h.house!.inhabitants)).toEqual([11, 11, 11, 11]);
    expect(citizens(w)).toBe(44);
    expect(totalTaxes(w)).toBe(800);
  });
  it('AK-S1-05 hoch sperrt den Aufstieg mit dem Grund «Steuer zu hoch» (M11 S10)', () => {
    colony(w);
    const pioneer = readyHouse(w, 1, 4, 0);
    w.tick = UPGRADE_WAIT * UPGRADE_DEFICIT_WAIT_FACTOR; // Defizitwelt: doppelte Wartezeit
    expect(upgradeStatus(w, pioneer)).toEqual({ ok: true, reasons: [] });
    w.taxLevel = 'high';
    const status = upgradeStatus(w, pioneer);
    expect(status.ok).toBe(false);
    expect(status.reasons).toEqual(['Steuer zu hoch']);
    expect(tryUpgrade(w, pioneer)).toBe(false);
    expect(pioneer.house!.tier).toBe(1);
  });
  it('AK-S1-06 niedrig steigt ab 300 Ticks auf, normal erst ab 600 (M11 S10, Defizitwelt)', () => {
    const firstUpgradeTick = (level: string): number => {
      const world = createWorld(3, { unlockAll: true });
      placeTownhall(world); // M10 T-10
      colony(world);
      const h = readyHouse(world, 1, 4, 0);
      if (level !== 'normal') expect(setTaxLevel(world, level).ok).toBe(true);
      for (let i = 0; i < 700; i++) {
        feed(world);
        step(world);
        if (h.house!.tier === 2) return world.tick;
      }
      return -1;
    };
    expect(firstUpgradeTick('low')).toBe(300);
    expect(firstUpgradeTick('normal')).toBe(600);
  });
  it('AK-S1-08 Steuerprobe: 4 Siedlerhäuser à 8', () => {
    for (let i = 0; i < 4; i++) addHouse(w, 2, 8, true);
    expect(totalTaxes(w)).toBe(224);
    w.taxLevel = 'low';
    expect(totalTaxes(w)).toBe(156);
    w.taxLevel = 'high';
    expect(totalTaxes(w)).toBe(291);
  });
  it('AK-S1-09 hoch drückt ein volles Siedlerhaus auf 6, zurück auf normal wächst es wieder (M11 S10)', () => {
    colony(w);
    const b = readyHouse(w, 2, 8, 0);
    expect(setTaxLevel(w, 'high').ok).toBe(true);
    run(w, 50);
    expect([b.house!.inhabitants, b.house!.tier]).toEqual([7, 2]);
    run(w, 50);
    expect(b.house!.inhabitants).toBe(6);
    run(w, 200);
    expect([b.house!.inhabitants, b.house!.tier, w.tick]).toEqual([6, 2, 300]);
    expect(b.house!.satisfiedSince).toBe(0);
    expect(setTaxLevel(w, 'normal').ok).toBe(true);
    run(w, 50);
    expect([b.house!.inhabitants, b.house!.tier]).toEqual([7, 2]);
    run(w, 50);
    // Defizitwelt: Wartezeit 600; 8 Einwohner bei Tick 400 genügen noch nicht
    expect([b.house!.inhabitants, b.house!.tier]).toEqual([8, 2]);
    run(w, 200);
    // 600 - satisfiedSince (0) >= 600: Aufstieg im selben Takt, nicht früher
    expect([b.house!.inhabitants, b.house!.tier, w.tick]).toEqual([8, 3, 600]);
  });
  it('AK-S1-10 normal bleibt floor(Σ): 3 unversorgte Siedlerhäuser à 3 = 31', () => {
    for (let i = 0; i < 3; i++) addHouse(w, 2, 3, false);
    expect(totalTaxes(w)).toBe(31);
  });
  it('RF-2 Umschalten bei Tick 99 wirkt im Schritt auf Tick 100 (M11 S10)', () => {
    colony(w);
    for (let i = 0; i < 4; i++) readyHouse(w, 2, 8, i);
    w.tick = 99;
    expect(setTaxLevel(w, 'low').ok).toBe(true);
    const [money, c0, u0] = [w.money, w.taxCarry, w.upkeepCarry];
    step(w);
    expect(w.tick).toBe(100);
    expect(w.stats.taxes).toBe(156);
    const booked =
      Math.floor((c0 + taxUnits(w)) / TAX_CARRY_DIVISOR) -
      Math.floor((u0 + totalUpkeep(w)) / UPKEEP_INTERVAL);
    expect(w.money - money).toBe(booked);
  });
});

describe('M11 Steuer je Tick (Spec 3.1)', () => {
  const sum = (d: number[]): number => d.reduce((a, b) => a + b, 0);
  /** n × tickTaxes; Zuwachs je Aufruf; Übertrag ganzzahlig 0 … 19 999. */
  const run = (n: number): number[] => {
    const d: number[] = [];
    for (let i = 0; i < n; i++) {
      const m = w.money;
      tickTaxes(w);
      d.push(w.money - m);
      expect(
        Number.isInteger(w.taxCarry) && w.taxCarry >= 0 && w.taxCarry < TAX_CARRY_DIVISOR,
      ).toBe(true);
    }
    return d;
  };
  it('AK-P1-02 20 Siedlerhäuser à 8 EW, erfüllt, normal: je Schritt +11 oder +12, nach 100 genau +1120', () => {
    for (let i = 0; i < 20; i++) addHouse(w, 2, 8, true);
    const d = run(100);
    expect(new Set(d)).toEqual(new Set([11, 12]));
    expect(sum(d)).toBe(1120);
    expect(w.stats.taxes).toBe(1120); // Nominalwert je 100 Ticks bleibt
  });
  it('AK-P1-03 niedrig +784; 10 von 20 unerfüllt +840 je 100 Schritte', () => {
    for (let i = 0; i < 20; i++) addHouse(w, 2, 8, true);
    expect(setTaxLevel(w, 'low').ok).toBe(true);
    expect(sum(run(100))).toBe(784);
    w = createWorld(3, { unlockAll: true });
    placeTownhall(w);
    for (let i = 0; i < 20; i++) addHouse(w, 2, 8, i < 10);
    expect(sum(run(100))).toBe(840);
  });
  it('RF-1 Übertrag über Steuerstufen-Wechsel (Amtsstube brennt): kein Verlust, keine Doppelbuchung', () => {
    for (let i = 0; i < 7; i++) addHouse(w, 2, 8, i % 2 === 0);
    expect(setTaxLevel(w, 'low').ok).toBe(true);
    const th = Object.values(w.buildings).find((b) => b.defId === 'townhall')!;
    const m0 = w.money;
    let units = 0;
    for (let i = 0; i < 137; i++) {
      if (i === 41) Object.assign(th, { outageUntil: 1_000_000, state: 'burning' }); // wirksam ab jetzt „normal"
      units += taxUnits(w);
      run(1);
    }
    expect((w.money - m0) * TAX_CARRY_DIVISOR + w.taxCarry).toBe(units);
  });
  it('RF-2 Aufstieg und Buchung im selben Schritt: Steuer des neuen Standes, Geld ganzzahlig', () => {
    colony(w);
    const h = readyHouse(w, 1, 4, 0);
    h.house!.satisfiedSince = 0; // weit zurück: robust gegen die Dämpfung aus T02 (höchstens 600)
    w.tick = 999; // nächster Schritt = Wachstumstakt 1000
    const [m0, c0, u0] = [w.money, w.taxCarry, w.upkeepCarry];
    step(w);
    expect(h.house!.tier).toBe(2);
    expect(w.stats.taxes).toBe(totalTaxes(w));
    const tax = Math.floor((c0 + taxUnits(w)) / TAX_CARRY_DIVISOR);
    const upk = Math.floor((u0 + totalUpkeep(w)) / UPKEEP_INTERVAL);
    expect(w.money).toBe(m0 - TIERS[1].upgradeCost!.money + tax - upk);
    expect(Number.isInteger(w.money)).toBe(true);
  });
});
