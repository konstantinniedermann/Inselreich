import { describe, expect, it } from 'vitest';
import {
  buyShip,
  clearRoute,
  freeShipAtHome,
  retireShip,
  setRoute,
  tickShips,
  updateRoute,
  validRoute,
} from '../../src/sim/ships';
import { totalUpkeep } from '../../src/sim/economy';
import { functionLock, goodLock } from '../../src/sim/unlocks';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { GoodId, Result, Route, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { laneTicks } from '../../src/sim/islands';
import { foundKontor2Literal, seaWorld, shipLiteral } from './seaHelpers';
import { D_HOME_A_AT_SEED_D37, SEED_D37 } from './seePins';

function richWorld(): World {
  const w = seaWorld();
  w.money = 10000;
  home(w).stock.wood = 200;
  home(w).stock.tools = 100;
  return w;
}

function routeWorld(): World {
  const w = richWorld();
  foundKontor2Literal(w, 1);
  return w;
}

const route = (part: Partial<Route> = {}): Route => ({
  a: 0,
  b: 1,
  ab: [{ good: 'wood', reserve: 10 }],
  ba: [{ good: 'spice', reserve: 0 }],
  ...part,
});

function reason(r: Result): string {
  return r.ok ? '' : r.reason;
}

/** Führt die Aktion aus und prüft, dass sie fehlschlägt und die Welt gleich bleibt. */
function failsWith(w: World, act: () => Result, text: string): void {
  const before = serialize(w);
  expect(reason(act())).toBe(text);
  expect(serialize(w)).toBe(before);
}

describe('M12 E4 Schiffe Aktionen', () => {
  describe('AK-E4-01 Kauf', () => {
    it('bucht Kosten aus dem Heimatlager und legt das Schiff an', () => {
      const w = richWorld();
      const before1 = { ...w.islands[1]!.stock };
      expect(buyShip(w).ok).toBe(true);
      expect(w.money).toBe(10000 - 1200);
      expect(w.islands[1]!.stock).toEqual(before1);
      expect(home(w).stock.wood).toBe(175);
      expect(home(w).stock.tools).toBe(90);
      expect(w.ships).toEqual([
        { id: 1, port: 0, to: null, left: 0, cargo: {}, route: null, homing: false },
      ]);
      expect(Object.keys(w.ships[0]!)).toEqual([
        'id',
        'port',
        'to',
        'left',
        'cargo',
        'route',
        'homing',
      ]);
    });

    it('erlaubt vier Schiffe, das fünfte scheitert', () => {
      const w = richWorld();
      for (let i = 0; i < 4; i++) expect(buyShip(w).ok).toBe(true);
      failsWith(w, () => buyShip(w), 'Höchstens 4 Schiffe');
    });

    it('verlangt die Freischaltung der Seefahrt', () => {
      const w = createWorld(3);
      w.money = 10000;
      const before = serialize(w);
      const lock = functionLock(w, 'seafaring');
      expect(lock).not.toBeNull();
      expect(reason(buyShip(w))).toBe(lock);
      expect(serialize(w)).toBe(before);
    });

    it('scheitert bei zu wenig Geld oder Holz, Welt unverändert', () => {
      const w = richWorld();
      w.money = 1199;
      failsWith(w, () => buyShip(w), 'Zu wenig Geld');
      const v = richWorld();
      home(v).stock.wood = 24;
      failsWith(v, () => buyShip(v), 'Zu wenig Holz');
    });
  });

  describe('AK-E4-02 Unterhalt', () => {
    function diffAfter100(startMoney: number): number {
      const a = seaWorld();
      const b = seaWorld();
      a.money = startMoney;
      b.money = startMoney;
      for (let i = 0; i < 4; i++) shipLiteral(b);
      for (let i = 0; i < 100; i++) {
        step(a);
        step(b);
      }
      return b.money - a.money;
    }

    it('kostet 15 je Schiff und 100 Ticks', () => {
      expect(diffAfter100(5000)).toBe(-60);
    });

    it('läuft auch bei Geld unter null', () => {
      expect(diffAfter100(-500)).toBe(-60);
    });

    it('totalUpkeep zählt Schiffe', () => {
      const w = seaWorld();
      const base = totalUpkeep(w);
      shipLiteral(w);
      expect(totalUpkeep(w)).toBe(base + 15);
    });
  });

  describe('AK-E4-07 Routenprüfung', () => {
    it('legt eine gültige Route als Kopie an', () => {
      const w = routeWorld();
      const s = shipLiteral(w);
      const r = route();
      expect(setRoute(w, s.id, r).ok).toBe(true);
      expect(s.route).toEqual(r);
      expect(s.route).not.toBe(r);
      expect(s.route!.ab).not.toBe(r.ab);
    });

    it.each([
      [
        'Gut in ab und ba',
        { ab: [{ good: 'wood', reserve: 0 }], ba: [{ good: 'wood', reserve: 0 }] },
        'Gut fährt schon in Gegenrichtung',
      ],
      [
        'drei Güter in ab',
        {
          ab: [
            { good: 'wood', reserve: 0 },
            { good: 'tools', reserve: 0 },
            { good: 'food', reserve: 0 },
          ],
        },
        'Höchstens 2 Güter je Richtung',
      ],
      ['a gleich b', { b: 0 }, 'Zwei verschiedene Kontore wählen'],
      ['Ziel ohne Kontor', { b: 2 }, 'Kein Kontor auf Felsbucht'],
      ['leere Listen', { ab: [], ba: [] }, 'Mindestens ein Gut wählen'],
      ['Reserve 15', { ab: [{ good: 'wood', reserve: 15 }] }, 'Reserve in Zehnern 0 bis 90'],
    ] as [string, Partial<Route>, string][])('%s', (_n, part, text) => {
      const w = routeWorld();
      const s = shipLiteral(w);
      failsWith(w, () => setRoute(w, s.id, route(part)), text);
      expect(reason(validRoute(w, route(part)))).toBe(text);
    });

    it('Gründe-Reihenfolge: a gleich b vor fehlendem Kontor', () => {
      const w = routeWorld();
      expect(reason(validRoute(w, route({ a: 2, b: 2 })))).toBe('Zwei verschiedene Kontore wählen');
    });

    it('Gründe-Reihenfolge: Gutsperre vor Reserve 15', () => {
      const w0 = createWorld(SEED_D37);
      foundKontor2Literal(w0, 1);
      const r = route({ ab: [{ good: 'spice', reserve: 15 }], ba: [] });
      expect(goodLock(w0, 'spice')).not.toBeNull();
      expect(reason(validRoute(w0, r))).toBe(goodLock(w0, 'spice'));
    });

    it('Schiff unterwegs', () => {
      const w = routeWorld();
      const s = shipLiteral(w, { to: 2, left: 5 });
      failsWith(w, () => setRoute(w, s.id, route()), 'Schiff ist unterwegs');
    });

    it('Schiff mit Route oder unbekannt', () => {
      const w = routeWorld();
      const s = shipLiteral(w, { homing: true });
      failsWith(w, () => setRoute(w, s.id, route()), 'Schiff hat schon eine Route');
      failsWith(w, () => setRoute(w, 99, route()), 'Unbekanntes Schiff');
    });

    it('Gut nicht freigeschaltet liefert den Sperrtext', () => {
      const w = routeWorld();
      const w0 = createWorld(SEED_D37);
      foundKontor2Literal(w0, 1);
      const spice = route({ ab: [{ good: 'spice', reserve: 0 }], ba: [] });
      expect(goodLock(w0, 'spice')).not.toBeNull();
      expect(reason(validRoute(w0, spice))).toBe(goodLock(w0, 'spice'));
      expect(validRoute(w, route()).ok).toBe(true);
    });
  });

  describe('AK-E4-16 Ausmustern', () => {
    it('entfernt ein leeres Schiff im Heimathafen ohne Erstattung', () => {
      const w = richWorld();
      const s = shipLiteral(w);
      const money = w.money;
      const up = totalUpkeep(w);
      expect(retireShip(w, s.id).ok).toBe(true);
      expect(w.ships).toEqual([]);
      expect(w.money).toBe(money);
      expect(totalUpkeep(w)).toBe(up - 15);
    });

    it('nennt die Gründe wörtlich', () => {
      const w = routeWorld();
      const sea = shipLiteral(w, { to: 1, left: 4 });
      const away = shipLiteral(w, { port: 1 });
      const routed = shipLiteral(w);
      setRoute(w, routed.id, route());
      const homing = shipLiteral(w, { homing: true });
      const loaded = shipLiteral(w, { cargo: { spice: 5 } });
      failsWith(w, () => retireShip(w, sea.id), 'Erst im Heimathafen');
      failsWith(w, () => retireShip(w, away.id), 'Erst im Heimathafen');
      failsWith(w, () => retireShip(w, routed.id), 'Erst Route auflösen');
      failsWith(w, () => retireShip(w, homing.id), 'Erst Route auflösen');
      failsWith(w, () => retireShip(w, loaded.id), 'Erst entladen');
      failsWith(w, () => retireShip(w, 99), 'Unbekanntes Schiff');
    });
  });

  describe('Route ändern und auflösen', () => {
    it('updateRoute ändert Reserve, Ladung bleibt', () => {
      const w = routeWorld();
      const s = shipLiteral(w, { cargo: { wood: 7 } });
      setRoute(w, s.id, route());
      const r = route({ ab: [{ good: 'wood', reserve: 30 }] });
      expect(updateRoute(w, s.id, r).ok).toBe(true);
      expect(s.route!.ab[0]!.reserve).toBe(30);
      expect(s.route).not.toBe(r);
      expect(s.cargo).toEqual({ wood: 7 });
    });

    it('updateRoute verlangt gleiche Kontore und eine Route', () => {
      const w = routeWorld();
      const s = shipLiteral(w);
      failsWith(w, () => updateRoute(w, s.id, route()), 'Keine Route');
      setRoute(w, s.id, route());
      failsWith(
        w,
        () => updateRoute(w, s.id, route({ a: 1, b: 0 })),
        'Route auflösen und neu anlegen',
      );
      failsWith(
        w,
        () => updateRoute(w, s.id, route({ ab: [], ba: [] })),
        'Mindestens ein Gut wählen',
      );
    });

    it('clearRoute setzt homing', () => {
      const w = routeWorld();
      const s = shipLiteral(w);
      failsWith(w, () => clearRoute(w, s.id), 'Keine Route');
      setRoute(w, s.id, route());
      expect(clearRoute(w, s.id).ok).toBe(true);
      expect(s.route).toBeNull();
      expect(s.homing).toBe(true);
    });

    it('freeShipAtHome wählt die kleinste id', () => {
      const w = routeWorld();
      expect(freeShipAtHome(w)).toBeNull();
      shipLiteral(w, { homing: true });
      const b = shipLiteral(w);
      shipLiteral(w);
      expect(freeShipAtHome(w)).toBe(b);
    });

    it('tickShips ist ein Gerüst ohne Verluste', () => {
      expect(tickShips(routeWorld())).toEqual([]);
    });
  });
});

type Stock = Partial<Record<GoodId, number>>;

/** Setzt das Lager der Insel: alle Güter 0, dann die genannten. */
function setStock(w: World, island: number, part: Stock): void {
  const st = w.islands[island]!.stock;
  for (const g of GOOD_IDS) st[g] = 0;
  Object.assign(st, part);
}

function seaRoute(part: Partial<Route> = {}): Route {
  return {
    a: 0,
    b: 2,
    ab: [{ good: 'tools', reserve: 0 }],
    ba: [{ good: 'wood', reserve: 0 }],
    ...part,
  };
}

function twoKontorWorld(): World {
  const w = seaWorld();
  foundKontor2Literal(w, 2);
  setStock(w, 0, {});
  setStock(w, 2, {});
  return w;
}

function calls(w: World, n: number): void {
  for (let i = 0; i < n; i++) tickShips(w);
}

describe('M12 E4 tickShips', () => {
  it('AK-E4-03 Abfahrt sofort, Ankunft nach 370, Rundreise 740', () => {
    const w = twoKontorWorld();
    expect(laneTicks(w.islands, 0, 2)).toBe(370);
    const s = shipLiteral(w);
    expect(setRoute(w, s.id, seaRoute()).ok).toBe(true);
    tickShips(w);
    expect(s).toMatchObject({ port: 0, to: 2, left: 370 });
    calls(w, 369);
    expect(s).toMatchObject({ port: 0, to: 2, left: 1 });
    tickShips(w);
    expect(s).toMatchObject({ port: 2, to: 0, left: 370 });
    calls(w, 369);
    expect(s).toMatchObject({ to: 0, left: 1 });
    tickShips(w);
    expect(s).toMatchObject({ port: 0, to: 2, left: 370 });
  });

  it('AK-E4-04 entlädt zuerst (Kappung bei 100), lädt danach den Rest der Kapazität', () => {
    const w = twoKontorWorld();
    setStock(w, 0, { spice: 80, tools: 100 });
    const s = shipLiteral(w, { cargo: { spice: 30 } });
    setRoute(w, s.id, seaRoute());
    tickShips(w);
    expect(home(w).stock.spice).toBe(100);
    expect(home(w).stock.tools).toBe(60);
    expect(s.cargo).toEqual({ spice: 10, tools: 40 });
    expect(s.to).toBe(2);
  });

  describe('AK-E4-05 Laden in zwei Durchgängen', () => {
    const two = seaRoute({
      ab: [
        { good: 'wood', reserve: 10 },
        { good: 'tools', reserve: 10 },
      ],
      ba: [],
    });
    function load(stock: Stock, r: Route = two) {
      const w = twoKontorWorld();
      setStock(w, 0, stock);
      const s = shipLiteral(w);
      setRoute(w, s.id, r);
      tickShips(w);
      return s;
    }

    it('teilt gleichmässig 25 / 25', () => {
      expect(load({ wood: 100, tools: 100 }).cargo).toEqual({ wood: 25, tools: 25 });
    });

    it('verteilt den Rest im zweiten Durchgang: 12 / 38', () => {
      expect(load({ wood: 22, tools: 100 }).cargo).toEqual({ wood: 12, tools: 38 });
    });

    it('fährt leer im selben Aufruf', () => {
      const s = load({ wood: 0, tools: 0 });
      expect(s.cargo).toEqual({});
      expect(s).toMatchObject({ to: 2, left: 370 });
    });

    it('B3 leere Liste dieser Richtung lädt nichts und fährt', () => {
      const s = load(
        { wood: 100, tools: 100, spice: 100 },
        seaRoute({ ab: [], ba: [{ good: 'spice', reserve: 0 }] }),
      );
      expect(s.cargo).toEqual({});
      expect(s).toMatchObject({ to: 2, left: 370 });
    });
  });

  describe('AK-E4-06 Reserve', () => {
    function loaded(stock: number, reserve: number): Stock {
      const w = twoKontorWorld();
      setStock(w, 0, { tools: stock });
      const s = shipLiteral(w);
      setRoute(w, s.id, seaRoute({ ab: [{ good: 'tools', reserve }], ba: [] }));
      tickShips(w);
      expect(s.to).toBe(2);
      return s.cargo;
    }

    it('lädt nur den Überschuss über der Reserve', () => {
      expect(loaded(15, 10)).toEqual({ tools: 5 });
    });

    it('Bestand unter Reserve lädt nichts, Schiff fährt', () => {
      expect(loaded(8, 10)).toEqual({});
    });

    it('Reserve 0 lädt alles bis zur Kapazität', () => {
      expect(loaded(100, 0)).toEqual({ tools: 50 });
    });
  });

  it('AK-E4-08 clearRoute unterwegs: Ankunft ohne Umladung, heim, Rest verfällt', () => {
    const w = twoKontorWorld();
    setStock(w, 0, { spice: 70 });
    setStock(w, 2, { wood: 5, spice: 5 });
    const s = shipLiteral(w, { to: 2, left: 100, cargo: { spice: 40 }, route: seaRoute() });
    clearRoute(w, s.id);
    calls(w, 99);
    expect(s).toMatchObject({ to: 2, left: 1 });
    expect(tickShips(w)).toEqual([]);
    expect(s).toMatchObject({ port: 2, to: 0, left: 370, cargo: { spice: 40 } });
    expect(w.islands[2]!.stock.spice).toBe(5);
    expect(w.islands[2]!.stock.wood).toBe(5);
    calls(w, 369);
    const lost = tickShips(w);
    expect(lost).toEqual([{ ship: s.id, good: 'spice', n: 10 }]);
    expect(home(w).stock.spice).toBe(100);
    expect(s).toMatchObject({ port: 0, to: null, cargo: {}, homing: false });
    expect(freeShipAtHome(w)).toBe(s);
  });

  it('AK-E4-17 Route zwischen Fremdinseln: Anfahrt ohne Umladung, dann Umschlag', () => {
    const w = twoKontorWorld();
    foundKontor2Literal(w, 1);
    setStock(w, 0, { tools: 100 });
    setStock(w, 1, { tools: 100 });
    const s = shipLiteral(w, { cargo: { food: 5 } });
    expect(setRoute(w, s.id, seaRoute({ a: 1, b: 2 })).ok).toBe(true);
    tickShips(w);
    expect(s).toMatchObject({ to: 1, left: 10 * D_HOME_A_AT_SEED_D37, cargo: { food: 5 } });
    expect(home(w).stock.food).toBe(0);
    calls(w, 10 * D_HOME_A_AT_SEED_D37);
    expect(s).toMatchObject({ port: 1, to: 2, cargo: { tools: 50 } });
    expect(w.islands[1]!.stock.food).toBe(5);
    expect(s.left).toBe(laneTicks(w.islands, 1, 2));
  });

  it('AK-E4-18 updateRoute unterwegs: Ladung bleibt, nächste Umladung nach neuer Liste', () => {
    const w = twoKontorWorld();
    setStock(w, 0, { spice: 100 });
    const s = shipLiteral(w, { port: 2, to: 0, left: 5, cargo: { wood: 20 }, route: seaRoute() });
    const r = seaRoute({ ab: [{ good: 'spice', reserve: 30 }] });
    expect(updateRoute(w, s.id, r).ok).toBe(true);
    expect(s.cargo).toEqual({ wood: 20 });
    calls(w, 5);
    expect(home(w).stock.wood).toBe(20);
    expect(s.cargo).toEqual({ spice: 50 });
    expect(home(w).stock.spice).toBe(50);
  });

  it('AK-E4-19 liegend mit clearRoute: entlädt bis 100, Verlust, frei', () => {
    const w = twoKontorWorld();
    setStock(w, 0, { spice: 70 });
    const s = shipLiteral(w, { cargo: { spice: 40 }, route: seaRoute() });
    clearRoute(w, s.id);
    expect(tickShips(w)).toEqual([{ ship: s.id, good: 'spice', n: 10 }]);
    expect(home(w).stock.spice).toBe(100);
    expect(s.cargo).toEqual({});
    expect(freeShipAtHome(w)).toBe(s);
  });

  it('AK-E4-10 gleicher Seed, 5000 Schritte, drei Schiffe: gleicher Zustand', () => {
    function run(): { text: string; ports: Set<number> } {
      const w = twoKontorWorld();
      foundKontor2Literal(w, 1);
      for (const i of [0, 1, 2]) setStock(w, i, { wood: 100, tools: 100, spice: 100 });
      const defs: [number, number][] = [
        [0, 2],
        [0, 1],
        [1, 2],
      ];
      for (const [a, b] of defs) {
        const s = shipLiteral(w);
        const r = seaRoute({ a, b });
        r.ab = [{ good: 'wood', reserve: 10 }];
        r.ba = [{ good: 'tools', reserve: 10 }];
        expect(setRoute(w, s.id, r).ok).toBe(true);
      }
      const ports = new Set<number>();
      for (let i = 0; i < 5000; i++) {
        step(w);
        if (i % 10 === 0) for (const s of w.ships) ports.add(s.port);
      }
      return { text: serialize(w), ports };
    }
    const a = run();
    const b = run();
    expect(a.text).toBe(b.text);
    expect([...a.ports].sort()).toEqual([0, 1, 2]);
  });
});
