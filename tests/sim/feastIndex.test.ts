import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import { demolish } from '../../src/sim/build';
import { deserialize, serialize } from '../../src/sim/save';
import { FEAST_DURATION } from '../../src/sim/defs/timing';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { holdFeast } from '../../src/sim/feast';
import {
  chapelWorks,
  feastActive,
  feastState,
  harvestActive,
  inChapelRadius,
  invalidateFeastIndex,
  marketActive,
} from '../../src/sim/feastEffect';
import type { FeastKind } from '../../src/sim/defs/feast';
import type { Building, World } from '../../src/sim/types';
import { houseNearKontor, placeService } from './helpers';

let w: World;
let house: Building;
let chapel: Building;

/** Naive Referenz: lineare Suche über alle Gebäude, ohne Index. */
function refActive(world: World, kind: FeastKind, b: Building): boolean {
  return Object.values(world.buildings).some(
    (c) =>
      BUILDING_DEFS[c.defId].service === 'faith' &&
      (c.feastKind ?? 'ascension') === kind &&
      c.feastAt !== undefined &&
      chapelWorks(c) &&
      feastState(world, c).phase === 'active' &&
      (kind === 'market' ? c.island === b.island : inChapelRadius(world, c, b)),
  );
}
const refAll = (world: World, b: Building): boolean[] => [
  refActive(world, 'ascension', b),
  refActive(world, 'harvest', b),
  refActive(world, 'market', b),
];
const asked = (world: World, b: Building): boolean[] => [
  feastActive(world, b),
  harvestActive(world, b),
  marketActive(world, b.island),
];

beforeEach(() => {
  w = createWorld(3, { unlockAll: true });
  house = houseNearKontor(w);
  chapel = placeService(w, 'chapel', house.x + 5, house.y);
  w.tick = 1000;
  home(w).stock.rum = 99;
  home(w).stock.food = 99;
  home(w).stock.tools = 99;
});

describe('Festindex (I-201 T03b)', () => {
  it('exportiert invalidateFeastIndex', () => {
    expect(typeof invalidateFeastIndex).toBe('function');
  });
  it('liefert über mehrere Ticks dasselbe wie die naive Suche', () => {
    for (const kind of ['ascension', 'harvest', 'market'] as const) {
      w.tick = 1000;
      delete chapel.feastAt;
      expect(asked(w, house)).toEqual(refAll(w, house));
      chapel.feastKind = kind;
      chapel.feastAt = w.tick;
      for (let i = 0; i < FEAST_DURATION + 5; i += 50) {
        w.tick = 1000 + i;
        expect(asked(w, house)).toEqual(refAll(w, house));
      }
      w.tick = 1000 + FEAST_DURATION + 5;
      expect(asked(w, house)).toEqual([false, false, false]);
      delete chapel.feastAt;
      delete chapel.feastKind;
    }
  });
  it('holdFeast im selben Tick nach einer Abfrage wird sichtbar', () => {
    expect(feastActive(w, house)).toBe(false);
    expect(holdFeast(w, chapel.id).ok).toBe(true);
    expect(feastActive(w, house)).toBe(true);
  });
  it('demolish im selben Tick nimmt die Wirkung weg', () => {
    expect(holdFeast(w, chapel.id).ok).toBe(true);
    expect(feastActive(w, house)).toBe(true);
    expect(demolish(w, chapel.id).ok).toBe(true);
    expect(feastActive(w, house)).toBe(false);
  });
  it('neue Kapelle plus holdFeast im selben Tick wirkt', () => {
    expect(feastActive(w, house)).toBe(false);
    const c2 = placeService(w, 'chapel', house.x, house.y + 5);
    home(w).stock.rum = 99;
    expect(holdFeast(w, c2.id).ok).toBe(true);
    expect(feastActive(w, house)).toBe(true);
    expect(asked(w, house)).toEqual(refAll(w, house));
  });
  it('Brand wirkt ohne Invalidierung', () => {
    expect(holdFeast(w, chapel.id).ok).toBe(true);
    expect(feastActive(w, house)).toBe(true);
    chapel.outageUntil = w.tick + 100;
    expect(feastActive(w, house)).toBe(false);
    delete chapel.outageUntil;
    expect(feastActive(w, house)).toBe(true);
  });
  it('direkt gesetztes feastAt wirkt ohne Invalidierung', () => {
    expect(feastActive(w, house)).toBe(false);
    chapel.feastAt = w.tick;
    expect(feastActive(w, house)).toBe(true);
  });
  it('zwei Welten sind unabhängig', () => {
    const w2 = createWorld(3, { unlockAll: true });
    const h2 = houseNearKontor(w2);
    placeService(w2, 'chapel', h2.x + 5, h2.y);
    w2.tick = 1000;
    expect(holdFeast(w, chapel.id).ok).toBe(true);
    expect(feastActive(w, house)).toBe(true);
    expect(feastActive(w2, h2)).toBe(false);
  });
  it('der Index steht nie im Weltzustand oder Spielstand', () => {
    expect(holdFeast(w, chapel.id).ok).toBe(true);
    feastActive(w, house);
    expect(JSON.stringify(w)).not.toMatch(/chapels|feastIndex/);
    const back = deserialize(serialize(w));
    expect(back.ok).toBe(true);
    expect(JSON.stringify(serialize(w))).not.toMatch(/chapels|feastIndex/);
  });
});
