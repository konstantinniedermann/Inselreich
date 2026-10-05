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
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { Result, Route, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { foundKontor2Literal, seaWorld, shipLiteral } from './seaHelpers';

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
      expect(buyShip(w).ok).toBe(true);
      expect(w.money).toBe(10000 - 1200);
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
      expect(reason(buyShip(w))).toContain('Seefahrt mit den Kaufleuten');
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
      const w0 = createWorld(3);
      const lock = reason(validRoute(w0, route({ ab: [{ good: 'spice', reserve: 0 }], ba: [] })));
      expect(lock).not.toBe('');
      expect(lock).not.toContain('Kein Kontor');
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
