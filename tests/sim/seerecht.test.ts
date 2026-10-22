import { describe, expect, it } from 'vitest';
import { COUNCIL } from '../../src/sim/defs/council';
import { ROUTE_RESERVE, SHIP, SHIP_TICKS_PER_SEA_TILE } from '../../src/sim/defs/sea';
import { TIERS } from '../../src/sim/defs/tiers';
import { decree } from '../../src/sim/council';
import { buyShip, setRoute } from '../../src/sim/ships';
import { step } from '../../src/sim/tick';
import { laneWorld } from './seaHelpers';

interface Run {
  firstIsland: number;
  firstHome: number;
  homeGaps: number[];
  delivered: number;
}

/** Gewürzroute Insel -> Heimat auf Seeweg 35; Insellager wird vor jedem Tick aufgefüllt. */
function spiceRun(seerecht: boolean, ticks: number): Run {
  const { w, island } = laneWorld(35);
  const home = w.islands[0]!.stock;
  const isle = w.islands[island]!.stock;
  home.wood = 500;
  home.tools = 500;
  w.council[4] = 'open';
  if (seerecht) decree(w, 4, 'C');
  expect(buyShip(w).ok).toBe(true);
  const ship = w.ships[0]!;
  const route = {
    a: 0,
    b: island,
    ab: [],
    ba: [{ good: 'spice' as const, reserve: ROUTE_RESERVE.default }],
  };
  expect(setRoute(w, ship.id, route).ok).toBe(true);
  const run: Run = { firstIsland: 0, firstHome: 0, homeGaps: [], delivered: 0 };
  let departAt = 0;
  let lastHome = 0;
  for (let t = 1; t <= ticks; t++) {
    isle.spice = ROUTE_RESERVE.default + SHIP.capacity;
    home.spice = 0;
    const port = ship.port;
    step(w);
    if (departAt === 0 && ship.to !== null) departAt = t;
    if (ship.port === port) continue;
    const at = t - departAt;
    if (ship.port === island) run.firstIsland ||= at;
    else {
      if (run.firstHome === 0) run.firstHome = at;
      else run.homeGaps.push(at - lastHome);
      lastHome = at;
      run.delivered += home.spice;
    }
  }
  return run;
}

describe('I-153 Seerecht Szenario', () => {
  it('AK-SR-7 Gewinnlage: Umlauf 700 ohne, 560 mit Seerecht; 400 gegen 500 Gewürz', () => {
    const plain = spiceRun(false, 5650);
    expect([plain.firstIsland, plain.firstHome]).toEqual([350, 700]);
    expect(new Set(plain.homeGaps)).toEqual(new Set([700]));
    expect(plain.delivered).toBe(8 * SHIP.capacity);
    const sea = spiceRun(true, 5650);
    expect([sea.firstIsland, sea.firstHome]).toEqual([280, 560]);
    expect(new Set(sea.homeGaps)).toEqual(new Set([560]));
    expect(sea.delivered).toBe(10 * SHIP.capacity);
  });
});

describe('I-153 Seerecht Wertewächter', () => {
  it('AK-SR-8 Def-Werte tragen die Gewinnlage. Fällt dieser Test, Seerecht-Wert neu prüfen (R805).', () => {
    const cap = SHIP.capacity;
    const need = TIERS[4].needs.spice! * 80;
    const c = COUNCIL[4].C!.lever.value;
    const t = SHIP_TICKS_PER_SEA_TILE;
    expect((cap * 100) / (2 * c * 35)).toBeGreaterThanOrEqual(need);
    expect((cap * 100) / (2 * t * 35)).toBeLessThan(need);
    expect((cap * 100) / (2 * t * 30)).toBeGreaterThanOrEqual(need);
  });
});
