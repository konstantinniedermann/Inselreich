import { describe, expect, it } from 'vitest';
import { placeBuilding } from '../../src/sim/build';
import { RESERVE_STEPS } from '../../src/sim/defs/reserve';
import { deliverOrder } from '../../src/sim/orders';
import { upgradeStatus } from '../../src/sim/population';
import { reservedInputs, reserveHolds } from '../../src/sim/queries';
import { reserveOf, setReserve } from '../../src/sim/reserve';
import { serialize } from '../../src/sim/save';
import { setRoute } from '../../src/sim/ships';
import { tickShips } from '../../src/sim/ships';
import { tickProduction } from '../../src/sim/production';
import { sell } from '../../src/sim/trade';
import { upgradeBuilding } from '../../src/sim/upgrade';
import type { Building, BuildingDefId, World } from '../../src/sim/types';
import { createWorld, home, idx } from '../../src/sim/world';
import { forceGrass, placeService, setHouse, twoIslandWorld, village } from './helpers';
import { foundKontor2Literal, seaWorld, shipLiteral } from './seaHelpers';

/** Seed-3-Welt, Krisen aus; Lager für Holz/Stein frei gesetzt. */
function base(): World {
  return createWorld(3, { unlockAll: true });
}

/** Gebäude direkt eingefügt (Produktion liest nur `connected`), Ids aufsteigend. */
function direct(
  w: World,
  defId: BuildingDefId,
  part: Partial<Building> = {},
  island = 0,
  x = 0,
): Building {
  const b: Building = {
    id: w.nextBuildingId++,
    defId,
    x,
    y: 5,
    connected: true,
    progress: 0,
    state: 'ok',
    island,
    ...part,
  };
  w.buildings[b.id] = b;
  return b;
}

/** Werkzeugmacher mit Schule in Reichweite (Dienst), direkt eingefügt; Heimatinsel. */
function toolmaker(w: World, part: Partial<Building> = {}): Building {
  const k = w.buildings[home(w).kontorId]!;
  placeService(w, 'school', k.x + 2, k.y - 2);
  return direct(w, 'toolmaker', { x: k.x + 3, y: k.y, ...part });
}

const stockOf = (w: World, island = 0) => w.islands[island]!.stock;
const reserveSet = (w: World, wood: 0 | 20 | 40 | 60, stone: 0 | 20 | 40 | 60 = 0): void => {
  home(w).reserve = { wood, stone };
};

describe('AK-SB-02/03/04 Regel in advance', () => {
  it('AK-SB-02 Holz 21 bei Reserve 20: entnimmt 1, Lager 20, nicht waitingReserve', () => {
    const w = base();
    reserveSet(w, 20);
    stockOf(w).wood = 21;
    const tm = toolmaker(w);
    tickProduction(w);
    expect(stockOf(w).wood).toBe(20);
    expect(tm.progress).toBe(1);
    expect(tm.state).not.toBe('waitingReserve');
  });

  it('AK-SB-03 Holz 20 bei Reserve 20: keine Entnahme, progress 0, waitingReserve, reservedInputs [wood]', () => {
    const w = base();
    reserveSet(w, 20);
    stockOf(w).wood = 20;
    const tm = toolmaker(w);
    tickProduction(w);
    expect(stockOf(w).wood).toBe(20);
    expect(tm.progress).toBe(0);
    expect(tm.state).toBe('waitingReserve');
    expect(reservedInputs(w, tm)).toEqual(['wood']);
  });

  it('AK-SB-04 Holz 0 bei Reserve 20: waitingInput, reservedInputs leer', () => {
    const w = base();
    reserveSet(w, 20);
    stockOf(w).wood = 0;
    const tm = toolmaker(w);
    tickProduction(w);
    expect(tm.state).toBe('waitingInput');
    expect(reservedInputs(w, tm)).toEqual([]);
  });

  it('AK-SB-05 Glashütte atomar: Stein 0/Holz 10 -> waitingInput [stone]; Stein 15/Holz 10 -> waitingReserve, Lager gleich', () => {
    const w = base();
    reserveSet(w, 20, 0);
    const gw = direct(w, 'glassworks');
    stockOf(w).stone = 0;
    stockOf(w).wood = 10;
    tickProduction(w);
    expect(gw.state).toBe('waitingInput');
    stockOf(w).stone = 15;
    tickProduction(w);
    expect(gw.state).toBe('waitingReserve');
    expect([stockOf(w).stone, stockOf(w).wood, gw.progress]).toEqual([15, 10, 0]);
    expect(reservedInputs(w, gw)).toEqual(['wood']);
  });

  it('AK-SB-06 laufender Zyklus endet normal; erst die nächste Entnahme wird gesperrt', () => {
    const w = base();
    stockOf(w).wood = 5;
    stockOf(w).tools = 0;
    const tm = toolmaker(w);
    tickProduction(w); // Entnahme, progress 1
    reserveSet(w, 60);
    for (let i = 0; i < 79; i++) tickProduction(w);
    expect(stockOf(w).tools).toBe(1);
    expect(tm.progress).toBe(0);
    tickProduction(w);
    expect(tm.state).toBe('waitingReserve');
    expect(stockOf(w).wood).toBe(4);
  });

  it('AK-SB-08 stillgelegt vor Reserve: paused, nie waitingReserve', () => {
    const w = base();
    reserveSet(w, 20);
    stockOf(w).wood = 5;
    const tm = toolmaker(w, { paused: true });
    tickProduction(w);
    expect(tm.state).toBe('paused');
  });

  it('Reserve ohne Kontor auf der Insel wirkt nicht', () => {
    const w = base();
    reserveSet(w, 60);
    stockOf(w).wood = 5;
    const tm = toolmaker(w);
    home(w).kontorId = null as unknown as number;
    expect(reserveOf(home(w), 'wood')).toBe(0);
    tickProduction(w);
    expect(tm.state).not.toBe('waitingReserve');
    expect(stockOf(w).wood).toBe(4);
  });

  it('reserveOf: Holz/Stein aus der Insel, sonst 0', () => {
    const w = base();
    reserveSet(w, 40, 20);
    expect(reserveOf(home(w), 'wood')).toBe(40);
    expect(reserveOf(home(w), 'stone')).toBe(20);
    expect(reserveOf(home(w), 'tools')).toBe(0);
  });
});

describe('AK-SB-07 Bau-Nachschub bleibt geschützt', () => {
  it('Bauen, Ausbau, Verkauf, Auftrag, Hausaufstieg wie ohne Reserve', () => {
    const run = (reserve: 0 | 20): unknown => {
      const w = base();
      reserveSet(w, reserve);
      w.money = 5000;
      stockOf(w).wood = 15;
      stockOf(w).tools = 10;
      stockOf(w).cloth = 5;
      const k = w.buildings[home(w).kontorId]!;
      const out: unknown[] = [];
      forceGrass(w, k.x + 3, k.y);
      out.push(placeBuilding(w, 'house', k.x + 3, k.y).ok);
      const f = direct(w, 'fisher');
      home(w).tiles[idx(home(w), 0, 5)]!.buildingId = f.id;
      out.push(upgradeBuilding(w, f.id));
      out.push(sell(w, 'wood', 3));
      w.order = { period: 0, good: 'wood', amount: 3, reward: 50, due: 9999 } as World['order'];
      out.push(deliverOrder(w));
      out.push(stockOf(w).wood);
      const v = village(1, { unlockAll: true });
      setHouse(v.houses[0]!, 1, 10);
      reserveSet(v.w, reserve);
      home(v.w).stock.wood = 15;
      out.push(upgradeStatus(v.w, v.houses[0]!));
      return out;
    };
    expect(run(20)).toEqual(run(0));
  });

  it('Schiffsladung mit ROUTE_RESERVE 10 unverändert', () => {
    const load = (reserve: 0 | 20): unknown => {
      const w = seaWorld();
      foundKontor2Literal(w, 2);
      for (const isl of w.islands)
        for (const g of Object.keys(isl.stock)) isl.stock[g as 'wood'] = 0;
      stockOf(w).wood = 15;
      reserveSet(w, reserve);
      const s = shipLiteral(w);
      expect(
        setRoute(w, s.id, {
          a: 0,
          b: 2,
          ab: [{ good: 'wood', reserve: 10 }],
          ba: [],
        }).ok,
      ).toBe(true);
      tickShips(w);
      return [s.cargo, stockOf(w).wood];
    };
    const without = load(0);
    expect(without).toEqual([{ wood: 5 }, 10]);
    expect(load(20)).toEqual(without);
  });
});

describe('AK-SB-09 setReserve', () => {
  it('Erfolg setzt den Wert (kein Tick-Eingriff, keine Sperrzeit)', () => {
    const w = base();
    expect(setReserve(w, 0, 'wood', 40)).toEqual({ ok: true });
    expect(home(w).reserve.wood).toBe(40);
    expect(home(w).reserve.stone).toBe(0);
  });

  it.each([
    ['ungültiges Gut', 0, 'tools', 20, 'Ungültiges Gut'],
    ['Wert ausserhalb der Stufen', 0, 'wood', 30, 'Ungültiger Wert'],
    ['Wert keine Zahl', 0, 'wood', '20', 'Ungültiger Wert'],
    ['unbekannte Insel', 7, 'wood', 20, 'Unbekannte Insel'],
  ] as const)('%s: ok:false, Welt unverändert', (_n, island, good, value, reason) => {
    const w = base();
    const before = serialize(w);
    expect(setReserve(w, island, good as never, value as never)).toEqual({ ok: false, reason });
    expect(serialize(w)).toBe(before);
  });

  it('Insel ohne Kontor: Text wie noKontorTrade, Welt unverändert', () => {
    const w = base();
    w.islands[1]!.kontorId = null;
    const before = serialize(w);
    const r = setReserve(w, 1, 'stone', 20);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.reason).toMatch(/^Kein Kontor auf /);
    expect(serialize(w)).toBe(before);
  });

  it('nimmt alle Stufen an', () => {
    const w = base();
    for (const s of RESERVE_STEPS) expect(setReserve(w, 0, 'stone', s).ok).toBe(true);
  });
});

describe('AK-SB-10 Reserve je Insel; reserveHolds', () => {
  it('Reserve 40 auf der Heimat lässt den Betrieb (Glashütte) der Kolonie mit Holz 30 laufen', () => {
    const w = twoIslandWorld();
    const c = w.islands[1]!;
    reserveSet(w, 40);
    c.stock.wood = 30;
    c.stock.stone = 30;
    const gw = direct(w, 'glassworks', {}, 1);
    tickProduction(w);
    expect(gw.state).not.toBe('waitingReserve');
    expect(c.stock.wood).toBe(29);
  });

  it('reserveHolds zählt nur Betriebe der Insel in waitingReserve mit passendem Input', () => {
    const w = base();
    reserveSet(w, 20, 0);
    stockOf(w).wood = 10;
    stockOf(w).stone = 10;
    toolmaker(w);
    direct(w, 'glassworks', {}, 0, 3);
    direct(w, 'fisher', {}, 0, 6);
    direct(w, 'toolmaker', { paused: true }, 0, 9);
    tickProduction(w);
    expect(reserveHolds(w, 0, 'wood')).toBe(2);
    expect(reserveHolds(w, 0, 'stone')).toBe(0);
    expect(reserveHolds(w, 1, 'wood')).toBe(0);
  });
});
