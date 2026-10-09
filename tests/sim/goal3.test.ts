import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { demolish } from '../../src/sim/build';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { WIN_SPICE_HOLD, WIN_SPICE_MERCHANTS } from '../../src/sim/defs/tiers';
import { spiceLoop, spiceMerchants } from '../../src/sim/goal3';
import { goalView } from '../../src/sim/queries';
import { deserialize, serialize } from '../../src/sim/save';
import { foldBackToV9 } from './helpers';
import { step } from '../../src/sim/tick';
import { buy } from '../../src/sim/trade';
import type { World } from '../../src/sim/types';
import { home } from '../../src/sim/world';
import { MERCHANT_NEEDS, spiceGoalScenario, type SpiceGoalOptions } from './scenariosSea';
import { shipLiteral } from './seaHelpers';

/** Füllt die Bedarfsgüter der Heimat auf 100 (Gewürz nur mit `spice`). */
function refill(w: World, spice = true): void {
  for (const g of MERCHANT_NEEDS) if (g !== 'spice' || spice) home(w).stock[g] = STORAGE_CAP;
}

/** `ticks` Schritte; je 100 Ticks wird nachgefüllt. Liefert den Tick, in dem `wonSpice` zuerst galt, sonst null. */
function run(w: World, ticks: number, spice = true): number | null {
  let wonAt: number | null = null;
  for (let i = 0; i < ticks; i++) {
    if (w.tick % 100 === 0) refill(w, spice);
    step(w);
    if (wonAt === null && w.wonSpice) wonAt = w.tick;
  }
  return wonAt;
}

const spiceWon = (opts: SpiceGoalOptions, ticks = 1000, spice = true): boolean => {
  const w = spiceGoalScenario(opts);
  run(w, ticks, spice);
  return w.wonSpice;
};

describe('M12 Z3 Gewürzstadt', () => {
  it('AK-Z3-02 Haltezeit: 599 Ticks nach satisfiedSince nein, 600 ja', () => {
    const w = spiceGoalScenario();
    const since = w.tick;
    run(w, WIN_SPICE_HOLD - 1);
    expect(w.tick - since).toBe(599);
    expect(w.wonSpice).toBe(false);
    run(w, 1);
    expect(w.tick - since).toBe(600);
    expect(w.wonSpice).toBe(true);
  });

  it('AK-Z3-03 zu wenige Kaufleute oder ohne Gewürz: kein Ziel; 4 Häuser: Ziel', () => {
    expect(spiceWon({ houses: 3 })).toBe(false);
    expect(spiceWon({ spiceInStock: false }, 1000, false)).toBe(false);
    expect(spiceWon({ houses: 4 })).toBe(true);
    expect(WIN_SPICE_MERCHANTS).toBe(80);
  });

  it('AK-Z3-04 Schleife: jede fehlende Zutat verhindert das Ziel', () => {
    expect(spiceWon({ withShip: false })).toBe(false);
    expect(spiceWon({ withFarm: false })).toBe(false);
    const noSpice = spiceGoalScenario();
    shipLiteral(noSpice); // zweites, leeres Schiff ändert nichts
    noSpice.ships[0]!.route = { a: 0, b: 2, ab: [{ good: 'food', reserve: 5 }], ba: [] };
    run(noSpice, 1000);
    expect(noSpice.wonSpice).toBe(false);
    const wrongWay = spiceGoalScenario();
    wrongWay.ships[0]!.route = { a: 0, b: 2, ab: [{ good: 'spice', reserve: 5 }], ba: [] };
    run(wrongWay, 1000);
    expect(wrongWay.wonSpice).toBe(false);
    const between = spiceGoalScenario();
    between.ships[0]!.route = { a: 1, b: 2, ab: [], ba: [{ good: 'spice', reserve: 5 }] };
    run(between, 1000);
    expect(between.wonSpice).toBe(false);
    const homing = spiceGoalScenario();
    homing.ships[0]!.route = null;
    homing.ships[0]!.homing = true;
    run(homing, 1000);
    expect(homing.wonSpice).toBe(false);
    expect(spiceWon({})).toBe(true);
  });

  it('AK-Z3-04 Richtung i → 0 zählt in beiden Schreibweisen', () => {
    const w = spiceGoalScenario();
    w.ships[0]!.route = { a: 2, b: 0, ab: [{ good: 'spice', reserve: 5 }], ba: [] };
    expect(spiceLoop(w)).toBe(true);
    w.ships[0]!.route = { a: 2, b: 0, ab: [], ba: [{ good: 'spice', reserve: 5 }] };
    expect(spiceLoop(w)).toBe(false);
  });

  it('AK-Z3-05 nur Zukauf: Kaufleute versorgt, aber kein Ziel', () => {
    const w = spiceGoalScenario({ withShip: false, withFarm: false });
    for (let i = 0; i < 2000; i++) {
      if (w.tick % 100 === 0) {
        refill(w, false);
        const missing = STORAGE_CAP - home(w).stock.spice;
        if (missing > 0) expect(buy(w, 'spice', missing).ok).toBe(true);
      }
      step(w);
      if (w.tick === 449 + WIN_SPICE_HOLD) expect(spiceMerchants(w)).toBe(80);
    }
    expect(w.wonSpice).toBe(false);
    expect(w.money).toBeGreaterThan(0);
  });

  it('AK-Z3-06 nach wonMerchants, im selben Schritt möglich', () => {
    const w = spiceGoalScenario({ wonMerchants: false });
    step(w);
    expect(w.wonMerchants).toBe(true);
    expect(w.wonSpice).toBe(false); // Haltezeit noch nicht erfüllt
    const late = spiceGoalScenario({ wonMerchants: false });
    for (const b of Object.values(late.buildings))
      if (b.house) b.house.satisfiedSince = late.tick - WIN_SPICE_HOLD;
    step(late);
    expect(late.wonMerchants).toBe(true);
    expect(late.wonSpice).toBe(true);
  });

  it('AK-Z3-07 einmal erreicht, bleibt erreicht', () => {
    const w = spiceGoalScenario();
    run(w, WIN_SPICE_HOLD);
    expect(w.wonSpice).toBe(true);
    for (const b of Object.values(w.buildings))
      if (b.defId === 'spicefarm' || b.house) expect(demolish(w, b.id).ok).toBe(true);
    w.ships[0]!.route = null;
    run(w, 1000);
    expect(w.wonSpice).toBe(true);
    expect(goalView(w).phase).toBe('done');
  });

  it('AK-Z3-08 gleiches Szenario, gleicher Setz-Tick, gleicher Zustand', () => {
    const a = spiceGoalScenario();
    const b = spiceGoalScenario();
    expect(run(a, 800)).toBe(run(b, 800));
    expect(serialize(a)).toBe(serialize(b));
  });

  it('AK-Z3-02 Fixture z3-scenario-v9 ist ladbar und gleicht dem Browser-Rezept', () => {
    const json = readFileSync('tests/sim/fixtures/z3-scenario-v9.json', 'utf8');
    expect(deserialize(json).ok).toBe(true);
    expect(json).toBe(
      JSON.stringify(foldBackToV9(JSON.parse(serialize(spiceGoalScenario({ forBrowser: true }))))),
    );
  });

  it('forBrowser: erreicht das Ziel ohne Nachfüllen', () => {
    const w = spiceGoalScenario({ forBrowser: true });
    for (let i = 0; i < WIN_SPICE_HOLD + 100; i++) step(w);
    expect(w.wonSpice).toBe(true);
  });

  it('qa-B1 z3-scenario-v9 ohne Nachfüllen: wonSpice nach Haltezeit plus 100', () => {
    const json = readFileSync('tests/sim/fixtures/z3-scenario-v9.json', 'utf8');
    const loaded = deserialize(json);
    if (!loaded.ok) throw new Error('Fixture nicht ladbar');
    for (let i = 0; i < WIN_SPICE_HOLD + 100; i++) step(loaded.world);
    expect(loaded.world.wonSpice).toBe(true);
  });

  it('qa-B7 Save/Load in der Haltezeit: gleicher Zustand, Ziel im selben Tick', () => {
    const a = spiceGoalScenario();
    run(a, 300);
    expect(a.wonSpice).toBe(false);
    const loaded = deserialize(serialize(a));
    if (!loaded.ok) throw new Error('Laden schlug fehl');
    const b = loaded.world;
    const wonA = run(a, WIN_SPICE_HOLD);
    const wonB = run(b, WIN_SPICE_HOLD);
    expect(wonA).not.toBeNull();
    expect(wonB).toBe(wonA);
    expect(serialize(b)).toBe(serialize(a));
  });

  it('Ende-zu-Ende: echtes Schiff bringt Gewürz, Heimat steigt um die Ladung, danach wonSpice', () => {
    const w = spiceGoalScenario();
    w.islands[2]!.stock.spice = 20;
    let delivered = 0;
    let wonAt: number | null = null;
    for (let i = 0; i < 1000; i++) {
      if (w.tick % 100 === 0) refill(w, false);
      const ship = w.ships[0]!;
      const arriving = delivered === 0 && ship.to === 0 && ship.left === 1;
      const cargo = ship.cargo.spice ?? 0;
      const before = home(w).stock.spice;
      step(w);
      if (arriving) {
        delivered = cargo;
        expect(home(w).stock.spice - before).toBe(cargo);
      }
      if (wonAt === null && w.wonSpice) wonAt = w.tick;
    }
    expect(delivered).toBeGreaterThan(0);
    expect(wonAt).not.toBeNull();
    expect(w.wonSpice).toBe(true);
  });
});
