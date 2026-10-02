import { describe, expect, it } from 'vitest';
import { demolish, placeBuilding } from '../../src/sim/build';
import { TIERS } from '../../src/sim/defs/tiers';
import {
  citizens,
  merchants,
  populationByTier,
  tierLock,
  upgradeStatus,
} from '../../src/sim/population';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Building, GoodId, Tier, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { forceGrass, placeService } from './helpers';

interface Town {
  w: World;
  houses: Building[];
  chapel: Building;
  school: Building;
  bath: Building;
}

/**
 * Seed-3-Welt, Krisen aus. Häuser in der Spalte x = kx+2 ab y = ky (versorgt durch das Kontor), Kapelle,
 * Schule und Badehaus 2×2 in der Zeile y = ky ab x = kx+4 (alle im Radius 10 jedes Hauses), `connected`
 * von Hand gesetzt. Tick 449: der nächste Schritt ist der Wachstumstakt 450 (≡ 50 mod 100, keine Buchung).
 */
function town(houseCount: number): Town {
  const w = createWorld(3);
  const k = w.buildings[w.kontorId]!;
  const houses: Building[] = [];
  for (let i = 0; i < houseCount; i++) {
    forceGrass(w, k.x + 2, k.y + i);
    const r = placeBuilding(w, 'house', k.x + 2, k.y + i);
    if (!r.ok || r.id === undefined) throw new Error('house not placed');
    houses.push(w.buildings[r.id]!);
  }
  const chapel = placeService(w, 'chapel', k.x + 4, k.y);
  const school = placeService(w, 'school', k.x + 6, k.y);
  const bath = placeService(w, 'bathhouse', k.x + 8, k.y);
  for (const s of [chapel, school, bath]) s.connected = true; // Platzieren setzt die Anbindung zurück
  w.tick = 449;
  w.money = 1000;
  w.stock = {
    ...w.stock,
    food: 100,
    cloth: 100,
    rum: 100,
    wood: 15,
    tools: 8,
    stone: 10,
    glass: 1,
  };
  return { w, houses, chapel, school, bath };
}

/** Setzt ein Haus direkt auf Stufe `tier` mit `n` Einwohnern; alle Güter der Stufe erfüllt ausser `unmet`. */
function setHouse(w: World, b: Building, tier: Tier, n: number, unmet: GoodId[] = []): void {
  const goods = Object.keys(TIERS[tier].needs) as GoodId[];
  b.house = {
    tier,
    inhabitants: n,
    demand: Object.fromEntries(goods.map((g) => [g, 0])),
    satisfied: Object.fromEntries(goods.map((g) => [g, !unmet.includes(g)])),
    services: {},
    satisfiedSince: w.tick - 300,
    supplied: true,
  };
}

/** Volles Bürgerhaus, seit 300 Ticks zufrieden (bereit für den Aufstieg, ausser der Sperre). */
const readyCitizen = (w: World, b: Building): void => setHouse(w, b, 3, 15);

const run = (w: World, n: number): void => {
  for (let i = 0; i < n; i++) step(w);
};

describe('M8 Stufe 4: Zählung', () => {
  it('AK-S1-03 Häuser Stufe 2 (8), 3 (15), 4 (20): citizens 35, merchants 20, populationByTier mit Schlüssel 4', () => {
    const { w, houses } = town(3);
    setHouse(w, houses[0]!, 2, 8);
    setHouse(w, houses[1]!, 3, 15);
    setHouse(w, houses[2]!, 4, 20);
    expect(citizens(w)).toBe(35);
    expect(merchants(w)).toBe(20);
    expect(populationByTier(w)).toEqual({ 1: 0, 2: 8, 3: 15, 4: 20 });
  });
});

describe('M8 Stufe 4: Sperre und Aufstieg', () => {
  it('AK-S1-04 vor dem Sieg: einziger Grund „Erst nach dem Ziel“, kein Aufstieg, Geld und Lager unverändert', () => {
    const { w, houses } = town(1);
    const h = houses[0]!;
    readyCitizen(w, h);
    expect(w.won).toBe(false);
    expect(upgradeStatus(w, h).reasons).toEqual(['Erst nach dem Ziel']);
    step(w);
    expect(w.tick).toBe(450);
    expect(h.house!.tier).toBe(3);
    expect(w.money).toBe(1000);
    expect([w.stock.wood, w.stock.tools, w.stock.stone, w.stock.glass]).toEqual([15, 8, 10, 1]);
  });

  it('AK-S1-05 nach dem Sieg: Aufstieg 3 → 4 auf Tick ≡ 50 mod 100, Kosten und Glas, danach Steuer 300 (ohne Aufstieg 210)', () => {
    const make = (won: boolean): { w: World; h: Building } => {
      const { w, houses } = town(1);
      readyCitizen(w, houses[0]!);
      w.won = won;
      return { w, h: houses[0]! };
    };
    const { w, h } = make(true);
    step(w);
    expect(w.tick % 100).toBe(50);
    const hs = h.house!;
    expect(hs.tier).toBe(4);
    expect(w.money).toBe(400);
    expect([w.stock.wood, w.stock.tools, w.stock.stone, w.stock.glass]).toEqual([0, 0, 0, 0]);
    expect(hs.demand.glass).toBe(0);
    expect(hs.satisfied.glass).toBe(true);
    expect(hs.satisfiedSince).toBe(450);
    step(w);
    expect(w.tick % 100).toBe(51);
    expect(w.stats.taxes).toBe(300);
    const twin = make(false);
    run(twin.w, 2);
    expect(twin.h.house!.tier).toBe(3);
    expect(twin.w.stats.taxes).toBe(210);
  });

  it('AK-S1-06 Gründe: ohne Bad, ohne Glas, Steuer hoch; vor dem Sieg Sperrgrund zuerst', () => {
    const noBath = town(1);
    readyCitizen(noBath.w, noBath.houses[0]!);
    noBath.w.won = true;
    noBath.bath.connected = false;
    expect(upgradeStatus(noBath.w, noBath.houses[0]!).reasons).toEqual([
      'Badehaus fehlt in Reichweite',
    ]);
    const noGlass = town(1);
    readyCitizen(noGlass.w, noGlass.houses[0]!);
    noGlass.w.won = true;
    noGlass.w.stock.glass = 0;
    expect(upgradeStatus(noGlass.w, noGlass.houses[0]!).reasons).toEqual(['Kein Glas im Lager']);
    const high = town(1);
    readyCitizen(high.w, high.houses[0]!);
    high.w.won = true;
    high.w.taxLevel = 'high';
    expect(upgradeStatus(high.w, high.houses[0]!).reasons).toEqual(['Steuer zu hoch']);
    const locked = town(1);
    readyCitizen(locked.w, locked.houses[0]!);
    locked.bath.connected = false;
    locked.w.stock.glass = 0;
    expect(upgradeStatus(locked.w, locked.houses[0]!).reasons).toEqual([
      'Erst nach dem Ziel',
      'Badehaus fehlt in Reichweite',
      'Kein Glas im Lager',
    ]);
  });

  it('AK-S1-07 nach dem Aufstieg, alle Güter reichlich: 20 EW nach 5 Wachstumstakten (250 Ticks)', () => {
    const { w, houses } = town(1);
    const h = houses[0]!;
    readyCitizen(w, h);
    w.won = true;
    step(w);
    expect(h.house!.tier).toBe(4);
    expect(h.house!.inhabitants).toBe(15);
    w.stock = { ...w.stock, food: 100, cloth: 100, rum: 100, glass: 100 };
    run(w, 249);
    expect(h.house!.inhabitants).toBe(19);
    step(w);
    expect(w.tick).toBe(700);
    expect(h.house!.inhabitants).toBe(20);
  });

  it('AK-S1-08 Kaufleute ohne Glas: halbe Steuer 200, schrumpfen bis 1 in 19 Takten, Stufe 4 und won bleiben', () => {
    const { w, houses } = town(1);
    const h = houses[0]!;
    w.won = true;
    w.tick = 450;
    setHouse(w, h, 4, 20, ['glass']);
    w.stock.glass = 0;
    expect(h.house!.satisfied.glass).toBe(false);
    step(w);
    expect(w.tick % 50).not.toBe(0);
    expect(w.stats.taxes).toBe(200);
    while (w.tick < 1399) step(w);
    expect(h.house!.inhabitants).toBe(2);
    step(w);
    expect(w.tick).toBe(1400);
    expect(h.house!.inhabitants).toBe(1);
    run(w, 100);
    expect(h.house!.inhabitants).toBe(1);
    expect(h.house!.tier).toBe(4);
    expect(w.won).toBe(true);
  });

  it('AK-S1-09 Hebel 40: Aufstieg vor dem Sieg mit 45 Bürgern; mit 39 gesperrt; zurück auf null wie AK-S1-04', () => {
    try {
      TIERS[4].unlockCitizens = 40;
      const a = town(3);
      for (const b of a.houses) setHouse(a.w, b, 3, 15);
      for (const b of a.houses.slice(1)) b.house!.satisfiedSince = a.w.tick; // nur das erste ist bereit
      expect(citizens(a.w)).toBe(45);
      step(a.w);
      expect(a.houses.map((b) => b.house!.tier)).toEqual([4, 3, 3]);
      expect(a.w.won).toBe(false);
      expect(citizens(a.w)).toBe(45);

      // 39 Bürger (15 / 15 / 9): das Haus mit 9 EW hat die grösste Id und wird nach dem Kandidaten
      // iteriert, so wächst es erst nach dessen Aufstiegsversuch auf 10.
      const b = town(3);
      setHouse(b.w, b.houses[0]!, 3, 15);
      setHouse(b.w, b.houses[1]!, 3, 15);
      setHouse(b.w, b.houses[2]!, 3, 9);
      b.houses[1]!.house!.satisfiedSince = b.w.tick;
      expect(b.houses[2]!.id).toBeGreaterThan(b.houses[0]!.id);
      expect(upgradeStatus(b.w, b.houses[0]!).reasons).toEqual(['Erst ab 40 Bürgern (jetzt 39)']);
      expect(tierLock(b.w, 4)).toBe('Erst ab 40 Bürgern (jetzt 39)');
      step(b.w);
      expect(b.houses[0]!.house!.tier).toBe(3);
      expect(b.houses[2]!.house!.inhabitants).toBe(10);
    } finally {
      TIERS[4].unlockCitizens = null;
    }
    const c = town(1);
    readyCitizen(c.w, c.houses[0]!);
    expect(upgradeStatus(c.w, c.houses[0]!).reasons).toEqual(['Erst nach dem Ziel']);
    step(c.w);
    expect(c.houses[0]!.house!.tier).toBe(3);
  });

  it('AK-S1-09 tierLock: Stufen 1–3 und 5 frei, Stufe 4 vor dem Sieg gesperrt, nach dem Sieg frei', () => {
    const { w } = town(0);
    expect([1, 2, 3, 5, 0].map((t) => tierLock(w, t))).toEqual([null, null, null, null, null]);
    expect(tierLock(w, 4)).toBe('Erst nach dem Ziel');
    w.won = true;
    expect(tierLock(w, 4)).toBeNull();
  });

  it('AK-S1-10 Massenaufstieg: Glas und Geld entscheiden in Id-Reihenfolge', () => {
    const make = (glass: number, money: number): Town => {
      const t = town(2);
      for (const b of t.houses) readyCitizen(t.w, b);
      t.w.won = true;
      t.w.stock = { ...t.w.stock, wood: 30, tools: 16, stone: 20, glass };
      t.w.money = money;
      return t;
    };
    const both = make(2, 1300);
    step(both.w);
    expect(both.houses.map((b) => b.house!.tier)).toEqual([4, 4]);
    expect(both.w.money).toBe(100);
    const oneGlass = make(1, 1300);
    step(oneGlass.w);
    expect(oneGlass.houses[0]!.id).toBeLessThan(oneGlass.houses[1]!.id);
    expect(oneGlass.houses.map((b) => b.house!.tier)).toEqual([4, 3]);
    const poor = make(2, 1000);
    step(poor.w);
    expect(poor.houses.map((b) => b.house!.tier)).toEqual([4, 3]);
    expect(upgradeStatus(poor.w, poor.houses[1]!).reasons).toContain('Zu wenig Geld');
  });
});

describe('M8 Review Focus S1', () => {
  it('RF-1 Badehaus abgerissen, Kaufleute im Radius: bath false, halbe Steuer, Stufe 4, „Höchste Stufe erreicht“', () => {
    const { w, houses, chapel, school, bath } = town(1);
    const h = houses[0]!;
    w.won = true;
    w.tick = 450;
    setHouse(w, h, 4, 20);
    w.stock.glass = 10;
    step(w);
    expect(h.house!.services.bath).toBe(true);
    expect(w.stats.taxes).toBe(400);
    expect(demolish(w, bath.id).ok).toBe(true);
    chapel.connected = true; // Abriss berechnet die Anbindung neu (keine Wege im Test)
    school.connected = true;
    step(w);
    expect(h.house!.services.bath).toBe(false);
    expect(w.stats.taxes).toBe(200);
    expect(h.house!.tier).toBe(4);
    expect(upgradeStatus(w, h)).toEqual({ ok: false, reasons: ['Höchste Stufe erreicht'] });
  });

  it('RF-3 Hebel aktiv, Bürger unter N nach einem Aufstieg: Kaufleute bleiben, kein weiterer Aufstieg, Stand lädt', () => {
    try {
      TIERS[4].unlockCitizens = 40;
      const { w, houses } = town(2);
      setHouse(w, houses[0]!, 4, 20);
      readyCitizen(w, houses[1]!);
      w.stock.glass = 5;
      expect(citizens(w)).toBe(35);
      expect(upgradeStatus(w, houses[1]!).reasons[0]).toBe('Erst ab 40 Bürgern (jetzt 35)');
      step(w);
      expect(houses.map((b) => b.house!.tier)).toEqual([4, 3]);
      expect(w.won).toBe(false);
      const r = deserialize(serialize(w));
      expect(r.ok).toBe(true);
      if (r.ok) expect(r.world.buildings[houses[0]!.id]!.house!.tier).toBe(4);
    } finally {
      TIERS[4].unlockCitizens = null;
    }
  });
});
