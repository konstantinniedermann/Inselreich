import { describe, expect, it } from 'vitest';
import { GOODS } from '../../src/sim/defs/goods';
import { SHIP, SHIP_MAX } from '../../src/sim/defs/sea';
import { TICK_MS } from '../../src/sim/defs/timing';
import { upgradeDeficit } from '../../src/sim/flow';
import { laneTicks } from '../../src/sim/islands';
import { buyShip, clearRoute, freeShipAtHome, setRoute } from '../../src/sim/ships';
import { step, type StepReport } from '../../src/sim/tick';
import type { Building, Route, World } from '../../src/sim/types';
import { deficitLine } from '../../src/ui/inspect';
import { friendlyReason } from '../../src/ui/hints';
import {
  buyShipView,
  goodChoices,
  lossMessages,
  retireView,
  routeFromClick,
  routeLine,
  routeTargets,
  shipRows,
  shipTooltip,
  shipsKey,
} from '../../src/ui/ships';
import { deficitText } from '../../src/ui/texts';
import { seeRouteStart } from '../sim/scenariosSea';
import { setHouse } from '../sim/helpers';

const FELS = 2;

const report = (lost: { ship: number; good: 'spice' | 'wood' | 'tools'; n: number }[]): StepReport =>
  ({ lost }) as StepReport;

describe('M12 E4 UI Schiffe', () => {
  it('routeTargets: Felsbucht ohne Grund; ohne freies Schiff „Kein freies Schiff“', () => {
    const w = seeRouteStart();
    const t = routeTargets(w, 0);
    expect(t.map((x) => x.island)).toEqual([FELS]);
    expect(t[0]).toEqual({ island: FELS, label: 'Route nach Felsbucht', reason: null });
    w.ships[0]!.route = { a: 0, b: FELS, ab: [], ba: [{ good: 'spice', reserve: 10 }] };
    expect(freeShipAtHome(w)).toBeNull();
    expect(routeTargets(w, 0)[0]!.reason).toBe('Kein freies Schiff');
  });

  it('routeTargets: vom Panel der Felsbucht aus Ziel Heimat', () => {
    const w = seeRouteStart();
    expect(routeTargets(w, FELS).map((x) => [x.island, x.label])).toEqual([[0, 'Route nach Heimat']]);
  });

  it('goodChoices: Gewürz zuerst bei „Holen“ (30 > 10 auf der Quellseite)', () => {
    const w = seeRouteStart();
    const c = goodChoices(w, 0, FELS);
    expect(c.fetch[0]).toBe('spice');
    expect(c.bring).toContain('wood');
    expect(new Set(c.fetch).size).toBe(c.fetch.length);
  });

  it('routeFromClick: Holen in ba, Bringen in ab, Reserve aus ROUTE_RESERVE', () => {
    expect(routeFromClick(0, FELS, 'spice', 'fetch')).toEqual({
      a: 0,
      b: FELS,
      ab: [],
      ba: [{ good: 'spice', reserve: 10 }],
    });
    expect(routeFromClick(0, FELS, 'tools', 'bring')).toEqual({
      a: 0,
      b: FELS,
      ab: [{ good: 'tools', reserve: 10 }],
      ba: [],
    });
  });

  it('shipRows: liegend, dann unterwegs mit Ziel, Restzeit m:ss und Route', () => {
    const w = seeRouteStart();
    expect(shipRows(w, 0)[0]!.target).toBe('liegt in Heimat');
    expect(shipRows(w, 0)[0]!.rest).toBeNull();
    const r = setRoute(w, w.ships[0]!.id, routeFromClick(0, FELS, 'spice', 'fetch'));
    expect(r.ok).toBe(true);
    step(w);
    const row = shipRows(w, 0)[0]!;
    expect(row.target).toBe('unterwegs nach Felsbucht');
    const left = w.ships[0]!.left;
    expect(left).toBe(laneTicks(w.islands, 0, FELS) - 1);
    const s = Math.ceil((left * TICK_MS) / 1000);
    expect(row.rest).toBe(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);
    expect(row.route).toBe(routeLine(w, w.ships[0]!.route!, 0));
    expect(row.cargo).toBe('leer');
  });

  it('shipRows: Fremdinsel zeigt nur Schiffe mit Bezug, Heimat die ganze Flotte', () => {
    const w = seeRouteStart();
    expect(shipRows(w, FELS)).toEqual([]);
    expect(shipRows(w, 0)).toHaveLength(1);
    setRoute(w, w.ships[0]!.id, routeFromClick(0, FELS, 'spice', 'fetch'));
    expect(shipRows(w, FELS)).toHaveLength(1);
  });

  it('routeLine: Pfeile aus Sicht der aktuellen Insel', () => {
    const w = seeRouteStart();
    const route: Route = {
      a: 0,
      b: FELS,
      ab: [{ good: 'spice', reserve: 10 }],
      ba: [{ good: 'tools', reserve: 10 }],
    };
    expect(routeLine(w, route, 0)).toBe('Heimat ⇄ Felsbucht: Gewürz →, ← Werkzeug');
    expect(routeLine(w, route, FELS)).toBe('Felsbucht ⇄ Heimat: Gewürz ←, → Werkzeug');
  });

  it('shipTooltip: Ladung, Ziel, Restzeit; liegend ohne Restzeit', () => {
    const w = seeRouteStart();
    const ship = w.ships[0]!;
    expect(shipTooltip(w, ship.id)).toBe('Handelsschiff · leer · liegt in Heimat');
    ship.cargo = { spice: 30 };
    ship.port = FELS;
    ship.to = 0;
    ship.left = 370;
    expect(shipTooltip(w, ship.id)).toBe('Handelsschiff · 30 Gewürz · nach Heimat · 0:37');
    expect(shipTooltip(w, 999)).toBe('');
  });

  it('shipsKey: ändert sich bei Route an/aus und Abfahrt, nicht bei left', () => {
    const w = seeRouteStart();
    const k0 = shipsKey(w, 0);
    setRoute(w, w.ships[0]!.id, routeFromClick(0, FELS, 'spice', 'fetch'));
    const k1 = shipsKey(w, 0);
    expect(k1).not.toBe(k0);
    step(w);
    const k2 = shipsKey(w, 0);
    expect(k2).not.toBe(k1); // liegend → fahrend
    step(w);
    expect(shipsKey(w, 0)).toBe(k2);
    w.ships[0]!.left -= 5;
    expect(shipsKey(w, 0)).toBe(k2);
    clearRoute(w, w.ships[0]!.id);
    expect(shipsKey(w, 0)).not.toBe(k2);
  });

  it('buyShipView: Zahlen aus SHIP; Gründe aus der Sim (Geld, Höchstzahl)', () => {
    const w = seeRouteStart();
    const v = buyShipView(w);
    expect(v.label).toContain(String(SHIP.cost.money));
    expect(v.label).toContain(`${SHIP.cost.wood} ${GOODS.wood.name}`);
    expect(v.reason).toBeNull();
    w.money = 0;
    const real = buyShip(structuredClone(w));
    expect(real.ok).toBe(false);
    expect(buyShipView(w).reason).toBe(real.ok ? null : real.reason);
    w.money = 100_000;
    while (w.ships.length < SHIP_MAX) buyShip(w);
    const full = buyShip(structuredClone(w));
    expect(buyShipView(w).reason).toBe(full.ok ? null : full.reason);
  });

  it('retireView: Grund aus der Sim, Welt bleibt unverändert', () => {
    const w = seeRouteStart();
    const ship = w.ships[0]!;
    expect(retireView(w, ship.id).reason).toBeNull();
    setRoute(w, ship.id, routeFromClick(0, FELS, 'spice', 'fetch'));
    const before = JSON.stringify(w);
    expect(retireView(w, ship.id).reason).toBe('Erst Route auflösen');
    expect(JSON.stringify(w)).toBe(before);
    expect(w.ships).toHaveLength(1);
  });
});

describe('M12 E4 lossMessages (qa-B6)', () => {
  it('leere Reports → []', () => {
    expect(lossMessages([])).toEqual([]);
    expect(lossMessages([report([]), report([])])).toEqual([]);
  });

  it('Tempo 2: gleiches Schiff und Gut summiert, Reihenfolge Schiff-id, dann GOOD_IDS', () => {
    const msgs = lossMessages([
      report([
        { ship: 2, good: 'spice', n: 5 },
        { ship: 1, good: 'spice', n: 4 },
      ]),
      report([
        { ship: 1, good: 'spice', n: 6 },
        { ship: 1, good: 'wood', n: 3 },
      ]),
    ]);
    expect(msgs).toEqual([
      `3 ${GOODS.wood.name} verloren`,
      `10 ${GOODS.spice.name} verloren`,
      `5 ${GOODS.spice.name} verloren`,
    ]);
  });
});

describe('M12 E4 Inselbestand in Ausbau-Gründen (Pflichtzusatz B)', () => {
  it('friendlyReason „Zu wenig Holz“ nennt den Bestand der angegebenen Insel', () => {
    const w = seeRouteStart();
    w.islands[FELS]!.stock.wood = 7;
    w.islands[0]!.stock.wood = 100;
    const cost = { money: 0, wood: 25, tools: 0, stone: 0 };
    expect(friendlyReason(w, 'Zu wenig Holz', { cost, island: FELS })).toBe(
      'Zu wenig Holz: 25 nötig, 7 vorhanden · kaufbar am Kontor',
    );
    expect(friendlyReason(w, 'Zu wenig Holz', { cost })).toBe(
      'Zu wenig Holz: 25 nötig, 100 vorhanden · kaufbar am Kontor',
    );
  });

  it('friendlyReason „Nicht genug Ware“ nennt den Bestand der angegebenen Insel', () => {
    const w = seeRouteStart();
    w.islands[FELS]!.stock.wood = 3;
    w.islands[0]!.stock.wood = 100;
    expect(
      friendlyReason(w, 'Nicht genug Ware', { good: 'wood', amount: 20, island: FELS }),
    ).toBe('Nicht genug Holz: 20 nötig, 3 vorhanden');
  });

  it('deficitLine nennt den Bestand der Insel des Hauses', () => {
    const sea = seeRouteStart();
    const id = sea.nextBuildingId++;
    const h: Building = {
      id,
      defId: 'house',
      x: 0,
      y: 0,
      connected: true,
      progress: 0,
      state: 'ok',
      island: FELS,
    };
    sea.buildings[id] = h;
    setHouse(h, 2, 8);
    const d = upgradeDeficit(sea, h);
    expect(d).not.toBeNull();
    sea.islands[0]!.stock[d!.good] = 500;
    sea.islands[FELS]!.stock[d!.good] = 0;
    expect(deficitLine(sea, h)).toBe(deficitText(d!.good, 0, d!.net));
  });
});
