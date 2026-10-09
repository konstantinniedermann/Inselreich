// Goldwerte des Seewegs vor SEE-F1: Fahrlinien, Fahrzeiten und Weltzustand nach 2000 Ticks.
// SEE-F1 darf Sim und Save nicht verändern; dieser Test belegt es. Werte aus unverändertem main erzeugt.
import { describe, expect, it } from 'vitest';
import { laneTicks, seaLanes } from '../../src/sim/islands';
import { buyShip, setRoute } from '../../src/sim/ships';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { home } from '../../src/sim/world';
import { foundKontor2Literal, seaWorld } from './seaHelpers';
import { SEED_D37 } from './seePins';
import { foldBackToV9 } from './helpers';

const TICKS = 2000;

/** FNV-1a, 32 Bit, über die UTF-16-Code-Einheiten des Textes. */
function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

function sailedWorld(seed: number): { world: World; sailed: boolean } {
  const w = seaWorld(seed);
  w.money = 10000;
  home(w).stock.wood = 200;
  home(w).stock.tools = 100;
  foundKontor2Literal(w, 1);
  buyShip(w);
  setRoute(w, w.ships[0]!.id, {
    a: 0,
    b: 1,
    ab: [{ good: 'wood', reserve: 10 }],
    ba: [{ good: 'spice', reserve: 0 }],
  });
  let sailed = false;
  for (let t = 0; t < TICKS; t++) {
    step(w);
    if (w.ships.some((s) => s.to !== null)) sailed = true;
  }
  return { world: w, sailed };
}

type Gold = { lanes: unknown; ticks: Record<string, number>; hash: string };

const GOLD: Record<number, Gold> = {
  13: {
    lanes: [
      {
        a: 0,
        b: 1,
        points: [
          { x: 30.5, y: 21.5 },
          { x: -47.5, y: 34.5 },
        ],
        d: 29,
      },
      {
        a: 0,
        b: 2,
        points: [
          { x: 30.5, y: 21.5 },
          { x: -31.5, y: -33.5 },
        ],
        d: 37,
      },
      {
        a: 1,
        b: 2,
        points: [
          { x: -47.5, y: 34.5 },
          { x: -31.5, y: -33.5 },
        ],
        d: 36,
      },
    ],
    ticks: {
      '0-0': 0,
      '0-1': 290,
      '0-2': 370,
      '1-0': 290,
      '1-1': 0,
      '1-2': 360,
      '2-0': 370,
      '2-1': 360,
      '2-2': 0,
    },
    hash: 'e13a5ab2',
  },
  7: {
    lanes: [
      {
        a: 0,
        b: 1,
        points: [
          { x: 40.5, y: 39.5 },
          { x: 24.5, y: 95.5 },
        ],
        d: 27,
      },
      {
        a: 0,
        b: 2,
        points: [
          { x: 40.5, y: 39.5 },
          { x: -51.5, y: 15.5 },
        ],
        d: 36,
      },
      {
        a: 1,
        b: 2,
        points: [
          { x: 24.5, y: 95.5 },
          { x: -51.5, y: 15.5 },
        ],
        d: 87,
      },
    ],
    ticks: {
      '0-0': 0,
      '0-1': 270,
      '0-2': 360,
      '1-0': 270,
      '1-1': 0,
      '1-2': 870,
      '2-0': 360,
      '2-1': 870,
      '2-2': 0,
    },
    hash: '980bc9c9',
  },
  42: {
    lanes: [
      {
        a: 0,
        b: 1,
        points: [
          { x: 20.5, y: 42.5 },
          { x: 102.5, y: 5.5 },
        ],
        d: 28,
      },
      {
        a: 0,
        b: 2,
        points: [
          { x: 20.5, y: 42.5 },
          { x: 49.5, y: 115.5 },
        ],
        d: 39,
      },
      {
        a: 1,
        b: 2,
        points: [
          { x: 102.5, y: 5.5 },
          { x: 49.5, y: 115.5 },
        ],
        d: 88,
      },
    ],
    ticks: {
      '0-0': 0,
      '0-1': 280,
      '0-2': 390,
      '1-0': 280,
      '1-1': 0,
      '1-2': 880,
      '2-0': 390,
      '2-1': 880,
      '2-2': 0,
    },
    hash: '9dfb908f',
  },
};

describe('SEE-F1 T0 Goldwerte Seeweg', () => {
  it.each([SEED_D37, 7, 42])('Seed %i', (seed) => {
    const w = seaWorld(seed);
    const lanes = seaLanes(w.islands);
    const ticks: Record<string, number> = {};
    for (let a = 0; a < w.islands.length; a++)
      for (let b = 0; b < w.islands.length; b++) ticks[`${a}-${b}`] = laneTicks(w.islands, a, b);
    const run = sailedWorld(seed);
    expect(run.sailed).toBe(true);
    const gold = GOLD[seed]!;
    expect(JSON.parse(JSON.stringify(lanes))).toEqual(gold.lanes);
    expect(ticks).toEqual(gold.ticks);
    expect(fnv1a(JSON.stringify(foldBackToV9(JSON.parse(JSON.stringify(run.world)))))).toBe(
      gold.hash,
    );
  });
});
