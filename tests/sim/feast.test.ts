import { beforeEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createWorld, home, islandOf } from '../../src/sim/world';
import { demolish } from '../../src/sim/build';
import { deserialize, serialize } from '../../src/sim/save';
import { newHouseState, upgradeStatus } from '../../src/sim/population';
import { FEAST_COOLDOWN, FEAST_DURATION, FEAST_RUM } from '../../src/sim/defs/timing';
import { TIERS } from '../../src/sim/defs/tiers';
import { feastActive, feastBlockReason, feastState, holdFeast } from '../../src/sim/feast';
import type { Building, TaxLevel, Tier, World } from '../../src/sim/types';
import {
  houseFar,
  houseNearKontor,
  placeService,
  placeTownhall,
  putBuilding,
  setAllTax,
  twoIslandWorld,
} from './helpers';

let w: World;
let house: Building;
let chapel: Building;

/** Genug Güter im Budget: kein Defizit, die Grundwartezeit gilt. */
const NO_DEFICIT = { food: 99, cloth: 99, rum: 99, glass: 99, wood: 99, tools: 99, stone: 99 };
const waitReason = (b: Building, budget?: typeof NO_DEFICIT): string | undefined =>
  upgradeStatus(w, b, budget).reasons.find((r) => r.startsWith('Bedürfnisse'));
const waited = (b: Building, n: number): void => {
  b.house!.satisfiedSince = w.tick - n;
};
const reasonOf = (r: ReturnType<typeof holdFeast>): string => (r.ok ? '' : r.reason);

beforeEach(() => {
  w = createWorld(3, { unlockAll: true });
  house = houseNearKontor(w);
  chapel = placeService(w, 'chapel', house.x + 5, house.y);
  w.tick = 1000;
  home(w).stock.rum = 30;
});

describe('AK-I007-01 Fest feiern', () => {
  it('zieht FEAST_RUM Rum ab und setzt feastAt auf den Tick', () => {
    expect(holdFeast(w, chapel.id)).toEqual({ ok: true });
    expect(home(w).stock.rum).toBe(30 - FEAST_RUM);
    expect(chapel.feastAt).toBe(1000);
  });
  it('liefert bei unbekannter Id oder Nicht-Kapelle ok:false statt zu werfen', () => {
    expect(holdFeast(w, 987654).ok).toBe(false);
    expect(holdFeast(w, house.id).ok).toBe(false);
    expect(home(w).stock.rum).toBe(30);
  });
  it('negatives Geld sperrt nicht', () => {
    w.money = -50;
    expect(holdFeast(w, chapel.id).ok).toBe(true);
  });
});

describe('AK-I007-05 Sperren', () => {
  const blocked = (reason: string): void => {
    const r = holdFeast(w, chapel.id);
    expect(r.ok).toBe(false);
    expect(reasonOf(r)).toBe(reason);
    expect(chapel.feastAt).toBeUndefined();
  };
  it('zu wenig Rum', () => {
    home(w).stock.rum = 9;
    blocked('Zu wenig Rum (9 / 10)');
    expect(home(w).stock.rum).toBe(9);
  });
  it('Steuer hoch', () => {
    placeTownhall(w);
    chapel.connected = true; // placeTownhall berechnet die Anbindung neu
    setAllTax(w, 'high');
    blocked('Steuer «hoch»: kein Aufstieg');
    expect(home(w).stock.rum).toBe(30);
  });
  it('Steuer niedrig', () => {
    placeTownhall(w);
    chapel.connected = true; // placeTownhall berechnet die Anbindung neu
    setAllTax(w, 'low');
    blocked('Steuer «niedrig»: Fest ohne Wirkung');
    expect(home(w).stock.rum).toBe(30);
  });
  it('Steuerstufe ohne Amtsstube gilt als normal', () => {
    setAllTax(w, 'high');
    expect(holdFeast(w, chapel.id).ok).toBe(true);
  });
  it('Kapelle nicht angebunden', () => {
    chapel.connected = false;
    blocked('Kapelle nicht angebunden');
    expect(home(w).stock.rum).toBe(30);
  });
  it('Kapelle brennt', () => {
    chapel.outageUntil = w.tick + 100;
    chapel.state = 'burning';
    blocked('Kapelle brennt');
    expect(home(w).stock.rum).toBe(30);
  });
  it('Fest läuft und Abklingzeit, danach wieder frei', () => {
    expect(holdFeast(w, chapel.id).ok).toBe(true);
    home(w).stock.rum = 30;
    w.tick = 1000 + FEAST_DURATION - 1;
    expect(reasonOf(holdFeast(w, chapel.id))).toBe('Fest läuft');
    w.tick = 1000 + FEAST_DURATION;
    expect(reasonOf(holdFeast(w, chapel.id))).toBe('Abklingzeit');
    w.tick = 1000 + FEAST_COOLDOWN - 1;
    expect(reasonOf(holdFeast(w, chapel.id))).toBe('Abklingzeit');
    expect(home(w).stock.rum).toBe(30);
    w.tick = 1000 + FEAST_COOLDOWN;
    expect(holdFeast(w, chapel.id).ok).toBe(true);
    expect(chapel.feastAt).toBe(w.tick);
  });
});

describe('feastState', () => {
  it('bereit, läuft mit Restzeit, Abklingzeit mit Restzeit, wieder bereit', () => {
    expect(feastState(w, chapel)).toEqual({ phase: 'ready', remaining: 0 });
    holdFeast(w, chapel.id);
    w.tick += 100;
    expect(feastState(w, chapel)).toEqual({ phase: 'active', remaining: FEAST_DURATION - 100 });
    w.tick += FEAST_DURATION;
    expect(feastState(w, chapel)).toEqual({
      phase: 'cooldown',
      remaining: FEAST_COOLDOWN - FEAST_DURATION - 100,
    });
    w.tick = 1000 + FEAST_COOLDOWN;
    expect(feastState(w, chapel).phase).toBe('ready');
  });
});

describe('AK-I007-02 Wartezeit im Dienstradius', () => {
  it('Haus im Radius steigt nach 150 Ticks auf, ausserhalb nach 300', () => {
    const far = houseFar(w);
    holdFeast(w, chapel.id);
    expect(feastActive(w, house)).toBe(true);
    expect(feastActive(w, far)).toBe(false);
    waited(house, 149);
    expect(waitReason(house, NO_DEFICIT)).toBe('Bedürfnisse noch nicht 150 Ticks erfüllt');
    waited(house, 150);
    expect(waitReason(house, NO_DEFICIT)).toBeUndefined();
    waited(far, 299);
    expect(waitReason(far, NO_DEFICIT)).toBe('Bedürfnisse noch nicht 300 Ticks erfüllt');
    waited(far, 300);
    expect(waitReason(far, NO_DEFICIT)).toBeUndefined();
  });
  it('ohne Fest gilt die normale Wartezeit', () => {
    waited(house, 299);
    expect(waitReason(house, NO_DEFICIT)).toBe('Bedürfnisse noch nicht 300 Ticks erfüllt');
  });
});

describe('AK-I007-03 mit Defizit', () => {
  it('300 statt 600', () => {
    waited(house, 599);
    expect(waitReason(house)).toBe('Bedürfnisse noch nicht 600 Ticks erfüllt');
    holdFeast(w, chapel.id);
    waited(house, 299);
    expect(waitReason(house)).toBe('Bedürfnisse noch nicht 300 Ticks erfüllt');
    waited(house, 300);
    expect(waitReason(house)).toBeUndefined();
  });
});

describe('AK-I007-04 Ende des Fests', () => {
  it('ab feastAt + FEAST_DURATION wieder 300', () => {
    holdFeast(w, chapel.id);
    w.tick = 1000 + FEAST_DURATION - 1;
    waited(house, 150);
    expect(waitReason(house, NO_DEFICIT)).toBeUndefined();
    w.tick = 1000 + FEAST_DURATION;
    waited(house, 150);
    expect(waitReason(house, NO_DEFICIT)).toBe('Bedürfnisse noch nicht 300 Ticks erfüllt');
  });
});

describe('Steuer nach Festbeginn', () => {
  it('hoch: keine Wirkung; niedrig: kein Zusatz', () => {
    holdFeast(w, chapel.id);
    placeTownhall(w);
    chapel.connected = true; // placeTownhall berechnet die Anbindung neu
    setAllTax(w, 'high');
    expect(upgradeStatus(w, house, NO_DEFICIT).reasons).toContain('Steuer zu hoch');
    setAllTax(w, 'low');
    waited(house, 149);
    expect(waitReason(house, NO_DEFICIT)).toBe('Bedürfnisse noch nicht 150 Ticks erfüllt');
  });
});

describe('AK-I007-06 mehrere Kapellen', () => {
  it('zwei Feste über demselben Haus ergeben 150, nicht weniger', () => {
    const second = placeService(w, 'chapel', house.x + 5, house.y + 3);
    holdFeast(w, chapel.id);
    w.tick += 100;
    expect(holdFeast(w, second.id).ok).toBe(true);
    waited(house, 149);
    expect(waitReason(house, NO_DEFICIT)).toBe('Bedürfnisse noch nicht 150 Ticks erfüllt');
    waited(house, 150);
    expect(waitReason(house, NO_DEFICIT)).toBeUndefined();
  });
});

describe('AK-I007-07 Abriss und Brand', () => {
  it('Abriss beendet die Wirkung', () => {
    holdFeast(w, chapel.id);
    expect(demolish(w, chapel.id).ok).toBe(true);
    expect(feastActive(w, house)).toBe(false);
  });
  it('Brand pausiert die Wirkung, die Uhr läuft weiter', () => {
    holdFeast(w, chapel.id);
    chapel.outageUntil = w.tick + 100;
    chapel.state = 'burning';
    expect(feastActive(w, house)).toBe(false);
    delete chapel.outageUntil;
    chapel.state = 'ok';
    expect(feastActive(w, house)).toBe(true);
    w.tick = 1000 + FEAST_DURATION;
    expect(feastActive(w, house)).toBe(false);
  });
  it('nicht angebundene Kapelle wirkt nicht', () => {
    holdFeast(w, chapel.id);
    chapel.connected = false;
    expect(feastActive(w, house)).toBe(false);
  });
});

describe('AK-I007-08 Fest ersetzt keine Ware', () => {
  it('fehlende Ware bleibt Aufstiegsgrund, nur die Wartezeit ändert sich', () => {
    holdFeast(w, chapel.id);
    house.house!.inhabitants = TIERS[1].maxInhabitants;
    home(w).stock.cloth = 0;
    waited(house, 150);
    const s = upgradeStatus(w, house, NO_DEFICIT);
    expect(s.ok).toBe(false);
    expect(s.reasons).toContain('Kein Stoff im Lager');
    expect(s.reasons.some((r) => r.startsWith('Bedürfnisse'))).toBe(false);
    chapel.connected = false;
    expect(upgradeStatus(w, house, NO_DEFICIT).reasons).toContain('Kapelle fehlt in Reichweite');
  });
});

describe('AK-I007-09 Save', () => {
  it('Rundlauf erhält feastAt', () => {
    holdFeast(w, chapel.id);
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.world.buildings[chapel.id]!.feastAt).toBe(1000);
  });
  it('alter Spielstand ohne Feld lädt ohne Fest, Knopf frei', () => {
    const json = serialize(w);
    expect(json).not.toContain('feastAt');
    const r = deserialize(json);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const loaded = r.world.buildings[chapel.id]!;
    expect(loaded.feastAt).toBeUndefined();
    expect(feastState(r.world, loaded).phase).toBe('ready');
    loaded.connected = true;
    expect(holdFeast(r.world, loaded.id).ok).toBe(true);
  });
  it('neue Welten haben nirgends feastAt', () => {
    const fresh = createWorld(3);
    expect(Object.values(fresh.buildings).some((b) => b.feastAt !== undefined)).toBe(false);
  });
});

describe('AK-I007-10 Save-Prüfung', () => {
  const load = (mutate: (b: Record<string, unknown>) => void, id: number): boolean => {
    const raw = JSON.parse(serialize(w)) as { buildings: Record<string, Record<string, unknown>> };
    mutate(raw.buildings[id]!);
    return deserialize(JSON.stringify(raw)).ok;
  };
  it('gültiges feastAt an der Kapelle', () => {
    expect(load((b) => (b.feastAt = 1000), chapel.id)).toBe(true);
    expect(load((b) => (b.feastAt = 0), chapel.id)).toBe(true);
  });
  it('feastAt an Nicht-Kapelle ist ungültig', () => {
    expect(load((b) => (b.feastAt = 500), house.id)).toBe(false);
  });
  it('nicht ganzzahlig, negativ, Text oder in der Zukunft ist ungültig', () => {
    expect(load((b) => (b.feastAt = 10.5), chapel.id)).toBe(false);
    expect(load((b) => (b.feastAt = -1), chapel.id)).toBe(false);
    expect(load((b) => (b.feastAt = '5'), chapel.id)).toBe(false);
    expect(load((b) => (b.feastAt = 1001), chapel.id)).toBe(false);
  });
});

describe('Aufbau von feast.ts', () => {
  const src = readFileSync('src/sim/feast.ts', 'utf8');
  it('importiert weder unlocks noch population', () => {
    expect(src).not.toMatch(/from '\.\/(unlocks|population)'/);
  });
  it('greift nur an einer Stelle auf Rum zu', () => {
    expect(src.match(/'rum'/g)).toHaveLength(1);
  });
});

describe('feastBlockReason', () => {
  it('liefert denselben Grund wie holdFeast und ändert die Welt nicht', () => {
    home(w).stock.rum = 3;
    const before = JSON.stringify(w);
    const reason = feastBlockReason(w, chapel);
    expect(JSON.stringify(w)).toBe(before);
    expect(reason).toBe(reasonOf(holdFeast(w, chapel.id)));
    home(w).stock.rum = 30;
    expect(feastBlockReason(w, chapel)).toBeNull();
  });
});

describe('M12 E1 Fest bei mehreren Inseln', () => {
  /** Kapelle direkt in den Weltzustand gesetzt (nicht über placeBuilding), gehört zu islands[1]. */
  const foreignChapel = (): Building => {
    const id = w.nextBuildingId++;
    const b: Building = {
      id,
      defId: 'chapel',
      x: 5,
      y: 5,
      connected: true,
      progress: 0,
      state: 'ok',
      island: 1,
    };
    w.buildings[id] = b;
    return b;
  };
  it('Fest zieht Rum vom Lager der Kapellen-Insel', () => {
    const c = foreignChapel();
    expect(islandOf(w, c)).toBe(w.islands[1]);
    home(w).stock.rum = 0;
    w.islands[1]!.stock.rum = 40;
    w.islands[2]!.stock.rum = 50;
    expect(holdFeast(w, c.id)).toEqual({ ok: true });
    expect(w.islands[1]!.stock.rum).toBe(40 - FEAST_RUM);
    expect(home(w).stock.rum).toBe(0);
    expect(w.islands[2]!.stock.rum).toBe(50);
    expect(c.feastAt).toBe(1000);
  });
  it('Rum nur im Heimatlager: Fest der Fremdinsel-Kapelle scheitert', () => {
    const c = foreignChapel();
    home(w).stock.rum = 99;
    w.islands[1]!.stock.rum = 0;
    const r = holdFeast(w, c.id);
    expect(r.ok).toBe(false);
    expect(reasonOf(r)).toContain('Zu wenig Rum');
    expect(home(w).stock.rum).toBe(99);
    expect(c.feastAt).toBeUndefined();
  });
});

describe('AK-T14 + QA-a Fest je Steuerstufe (I-028 R7.3)', () => {
  const lv = (a: TaxLevel, b: TaxLevel, c: TaxLevel, d: TaxLevel): World['taxLevels'] => ({
    1: a,
    2: b,
    3: c,
    4: d,
  });
  /** Wohnhaus roh neben der Kapelle (im Dienstradius), ohne Kacheln. */
  const addNear = (tier: Tier, dy: number): Building => {
    const id = w.nextBuildingId++;
    const b: Building = {
      id,
      defId: 'house',
      x: chapel.x + 1,
      y: chapel.y + dy,
      connected: true,
      progress: 0,
      state: 'ok',
      island: 0,
      house: { ...newHouseState(w), tier },
    };
    w.buildings[id] = b;
    return b;
  };
  const setup = (): void => {
    placeTownhall(w);
    chapel.connected = true; // placeTownhall berechnet die Anbindung neu
  };
  const refused = (reason: string): void => {
    const r = holdFeast(w, chapel.id);
    expect(r).toEqual({ ok: false, reason });
    expect(home(w).stock.rum).toBe(30);
    expect(chapel.feastAt).toBeUndefined();
  };

  it('Siedler normal + Bürger hoch: Fest ok, Siedler 150, Bürger Steuer zu hoch', () => {
    setup();
    house.house!.tier = 2;
    const citizen = addNear(3, 1);
    w.taxLevels = lv('high', 'normal', 'high', 'normal'); // Stufe 1 hoch zählt nicht
    expect(holdFeast(w, chapel.id)).toEqual({ ok: true });
    waited(house, 149);
    expect(waitReason(house, NO_DEFICIT)).toBe('Bedürfnisse noch nicht 150 Ticks erfüllt');
    waited(house, 150);
    expect(waitReason(house, NO_DEFICIT)).toBeUndefined();
    expect(upgradeStatus(w, citizen, NO_DEFICIT).reasons).toContain('Steuer zu hoch');
  });
  it('nur hoch im Radius: kein Aufstieg', () => {
    setup();
    house.house!.tier = 2;
    w.taxLevels = lv('normal', 'high', 'normal', 'normal');
    refused('Steuer «hoch»: kein Aufstieg');
  });
  it('nur niedrig im Radius: ohne Wirkung', () => {
    setup();
    house.house!.tier = 2;
    w.taxLevels = lv('normal', 'low', 'normal', 'normal');
    refused('Steuer «niedrig»: Fest ohne Wirkung');
  });
  it('niedrig + hoch: Fest wirkt auf kein Haus', () => {
    setup();
    addNear(3, 1);
    w.taxLevels = lv('low', 'normal', 'high', 'normal');
    refused('Steuer: Fest wirkt auf kein Haus');
  });
  it('Haus normal ausserhalb des Radius ändert nichts', () => {
    setup();
    house.house!.tier = 2;
    const far = houseFar(w); // Pioniere, normal, ausserhalb des Radius
    expect(feastActive(w, far)).toBe(false);
    w.taxLevels = lv('normal', 'high', 'normal', 'normal');
    refused('Steuer «hoch»: kein Aufstieg');
  });
  it('kein Haus im Radius und alle hoch: ok', () => {
    setup();
    expect(demolish(w, house.id).ok).toBe(true);
    chapel.connected = true; // der Abriss berechnet die Anbindung neu
    setAllTax(w, 'high');
    expect(holdFeast(w, chapel.id)).toEqual({ ok: true });
  });
  it('QA-a: ein Kaufleute-Haus normal im Radius, Stufen 1-3 hoch: Fest ok', () => {
    setup();
    house.house!.tier = 4;
    w.taxLevels = lv('high', 'high', 'high', 'normal');
    expect(holdFeast(w, chapel.id)).toEqual({ ok: true });
    expect(home(w).stock.rum).toBe(30 - FEAST_RUM);
    expect(chapel.feastAt).toBe(w.tick);
  });
});

describe('SIM-FEST-INSEL: Fest wirkt nur auf der Kapellen-Insel', () => {
  let tw: World;
  let homeHouse: Building;
  let colonyHouse: Building;
  let homeChapel: Building;

  beforeEach(() => {
    tw = twoIslandWorld();
    homeHouse = houseNearKontor(tw);
    homeChapel = placeService(tw, 'chapel', homeHouse.x + 5, homeHouse.y);
    // Insel 1 liegt im Kachelraster deckungsgleich zur Heimat: gleiche Koordinaten, andere Insel
    colonyHouse = putBuilding(tw, 1, 'house', homeHouse.x, homeHouse.y);
    tw.tick = 1000;
    home(tw).stock.rum = 30;
  });

  it('B1 feastActive: Heimathaus wahr, Kolonie-Haus mit gleichen Koordinaten falsch', () => {
    expect([colonyHouse.island, colonyHouse.x, colonyHouse.y]).toEqual([
      1,
      homeHouse.x,
      homeHouse.y,
    ]);
    expect(holdFeast(tw, homeChapel.id)).toEqual({ ok: true });
    expect(feastActive(tw, homeHouse)).toBe(true);
    expect(feastActive(tw, colonyHouse)).toBe(false);
  });

  it('B3 Kolonie-Kapelle wirkt auf das Kolonie-Haus, nicht auf die Heimat; Rum aus der Kolonie', () => {
    const colonyChapel = putBuilding(tw, 1, 'chapel', homeHouse.x + 5, homeHouse.y);
    tw.islands[1]!.stock.rum = 30;
    expect(holdFeast(tw, colonyChapel.id)).toEqual({ ok: true });
    expect(tw.islands[1]!.stock.rum).toBe(30 - FEAST_RUM);
    expect(home(tw).stock.rum).toBe(30);
    expect(feastActive(tw, colonyHouse)).toBe(true);
    expect(feastActive(tw, homeHouse)).toBe(false);
  });

  it('B2 Steuerprüfung zählt nur Häuser der Kapellen-Insel', () => {
    placeTownhall(tw);
    homeChapel.connected = true; // placeTownhall berechnet die Anbindung neu
    colonyHouse.house!.tier = 2;
    tw.taxLevels = { 1: 'high', 2: 'normal', 3: 'high', 4: 'high' };
    expect(feastBlockReason(tw, homeChapel)).toBe('Steuer «hoch»: kein Aufstieg');
    const r = holdFeast(tw, homeChapel.id);
    expect(reasonOf(r)).toBe('Steuer «hoch»: kein Aufstieg');
    expect(homeChapel.feastAt).toBeUndefined();
    expect(home(tw).stock.rum).toBe(30);
  });

  it('B2 Gegenprobe: daheim «normal», Kolonie «hoch» → kein Sperrgrund', () => {
    placeTownhall(tw);
    homeChapel.connected = true;
    colonyHouse.house!.tier = 2;
    tw.taxLevels = { 1: 'normal', 2: 'high', 3: 'normal', 4: 'normal' };
    expect(feastBlockReason(tw, homeChapel)).toBeNull();
  });
});
