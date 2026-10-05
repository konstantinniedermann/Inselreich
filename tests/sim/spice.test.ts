// M12 E3 Gewürz und Kaufleute (AK-E3-02 Produktion, AK-E3-03). Kaufleute brauchen Gewürz, die Plantage liefert es
// ins Lager ihrer Insel.
import { describe, expect, it } from 'vitest';
import { placeBuilding } from '../../src/sim/build';
import { TAX_LEVELS, TAX_UNIT } from '../../src/sim/defs/tiers';
import { taxUnits, upgradeStatus } from '../../src/sim/population';
import { step } from '../../src/sim/tick';
import type { Building, World } from '../../src/sim/types';
import { home } from '../../src/sim/world';
import { placeService, setHouse, village } from './helpers';
import { foundKontor2Literal, plantationSites, seaWorld } from './seaHelpers';

const run = (w: World, n: number): void => {
  for (let i = 0; i < n; i++) step(w);
};

describe('AK-E3-02 Gewürzplantage liefert ins Lager ihrer Insel', () => {
  it('Plantage auf B: nach 50 Schritten Lager B Gewürz +1, Heimat 0', () => {
    const w = seaWorld();
    foundKontor2Literal(w, 2);
    const isl = w.islands[2]!;
    isl.stock.wood = 50;
    isl.stock.tools = 50;
    const site = plantationSites(w, 2)[0]!;
    const r = placeBuilding(w, 'spicefarm', site.x, site.y, 2);
    expect(r).toMatchObject({ ok: true });
    w.buildings[r.id!]!.connected = true;
    const before = isl.stock.spice;
    run(w, 50);
    expect(isl.stock.spice).toBe(before + 1);
    expect(home(w).stock.spice).toBe(0);
  });
});

/** Kaufmannshaus mit 20 EW in der Heimat; Kapelle, Schule und Bad in Reichweite, alle anderen Güter reichlich. */
function merchantTown(spice: number): { w: World; h: Building } {
  const { w, houses } = village(1, { unlockAll: true });
  const k = w.buildings[home(w).kontorId]!;
  for (const [i, id] of (['chapel', 'school', 'bathhouse'] as const).entries())
    placeService(w, id, k.x + 4 + 2 * i, k.y).connected = true;
  const h = houses[0]!;
  setHouse(h, 4, 20);
  w.won = true;
  Object.assign(home(w).stock, { food: 1000, cloth: 1000, rum: 1000, glass: 1000, spice });
  return { w, h };
}

describe('AK-E3-03 Kaufleute verbrauchen Gewürz', () => {
  it('Gewürz 10: nach 100 Schritten 8 (20 EW × 0,1)', () => {
    const { w } = merchantTown(10);
    run(w, 100);
    expect(home(w).stock.spice).toBe(8);
  });
  it('Gewürz 0: Bedarf unerfüllt, halbe Steuer', () => {
    const { w, h } = merchantTown(0);
    run(w, 10);
    expect(h.house!.satisfied.spice).toBe(false);
    expect(taxUnits(w)).toBe(20 * 22 * TAX_LEVELS.normal.pct);
  });
  it('mit allem: 22 Steuer je Einwohner (über taxUnits)', () => {
    const { w, h } = merchantTown(10);
    run(w, 10);
    expect(h.house!.satisfied.spice).toBe(true);
    expect(taxUnits(w)).toBe(20 * 22 * TAX_UNIT * TAX_LEVELS.normal.pct);
  });
  it('Aufstieg 3 → 4 ohne Gewürz im Lager: Grund „Kein Gewürz im Lager“', () => {
    const { w, h } = merchantTown(0);
    setHouse(h, 3, 15);
    expect(upgradeStatus(w, h).reasons).toContain('Kein Gewürz im Lager');
  });
});
