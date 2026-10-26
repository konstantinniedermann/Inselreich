import { describe, expect, it, vi } from 'vitest';
import { demolish, placeRoad } from '../../src/sim/build';
import { runningLevel } from '../../src/sim/levelRules';
import { citizens } from '../../src/sim/population';
import { step } from '../../src/sim/tick';
import type { Building, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { forceRect, placeService, putBuilding } from './helpers';

/** Steuert die Kontrolle K: `fixK` hält die laufende Stufe k bei der gebauten Stufe g (nur im Test, keine Hintertür in src/). */
const state = vi.hoisted(() => ({ fixK: false }));
vi.mock('../../src/sim/levelRules', async (orig) => {
  const m = await orig<typeof import('../../src/sim/levelRules')>();
  return {
    ...m,
    runningLevel: (w: World, b: Building, ctx?: Parameters<typeof m.runningLevel>[2]) =>
      state.fixK ? (b.level ?? 1) : m.runningLevel(w, b, ctx),
  };
});

/** AK-AL-48 (Plan T06 Teil 2): feste Seeds, Lauflänge (Plan-Vorschlag aus N6). */
const SEEDS = [3, 7] as const;
const SPIRAL_TICKS = 3000;
/** Ruling R1000: Schwellen der Spiral-Messung (Ist: 0 Häuser, 2 Bürger). */
const MAX_HOUSE_DIFF = 1;
const MAX_CITIZEN_DIFF = 4;
const BURGER_HOUSES = 6;
const BURGER_INHABITANTS = 4; // Rum-Bedarf knapp unter dem Ausstoss einer Brennerei auf Stufe 3
const RUM_START = 20; // Lager ohne Rum-Puffer über 20 Einheiten
const REFILL = 50;

interface Spiral {
  burgerHouses: number;
  citizens: number;
  rum: number;
  firstShrink: number | null;
  distilleryK: number;
}

/** Bürgerviertel (6 Bürgerhäuser), Brennerei g 3 mit Zuckerrohr und Feuerwache, genau ein Bürgerhaus im Arbeitsweg 8; dazu ein Siedlerhaus im Weg. */
function spiralWorld(seed: number): { w: World; inRange: Building } {
  const w = createWorld(seed, { unlockAll: true });
  w.money = 1_000_000;
  const isl = home(w);
  const k = w.buildings[isl.kontorId]!;
  const { x: kx, y: ky } = k;
  forceRect(w, kx + 2, ky - 4, 20, 12, 'grass');
  const stock = isl.stock;
  stock.rum = RUM_START;
  const burger = (x: number, y: number): Building => {
    const h = putBuilding(w, 0, 'house', x, y);
    h.house!.tier = 3;
    h.house!.inhabitants = BURGER_INHABITANTS;
    return h;
  };
  for (let x = kx + 2; x <= kx + 18; x++) expect(placeRoad(w, x, ky).ok).toBe(true); // Hauptstrasse
  const row: [number, number][] = [
    [3, 1],
    [4, 1],
    [5, 1],
    [6, 1],
    [3, -1],
    [4, -1],
  ];
  for (const [dx, dy] of row) burger(kx + dx, ky + dy);
  expect(row.length).toBe(BURGER_HOUSES);
  const inRange = burger(kx + 7, ky + 1); // Mitte 7,5 von der Brennerei (Mitte kx+15): im Arbeitsweg
  putBuilding(w, 0, 'house', kx + 9, ky + 1).house!.tier = 2; // Siedlerhaus: Stufe 2 bleibt möglich
  placeService(w, 'chapel', kx + 6, ky - 2);
  placeService(w, 'school', kx + 8, ky - 2);
  putBuilding(w, 0, 'firestation', kx + 11, ky + 1);
  putBuilding(w, 0, 'distillery', kx + 14, ky + 1).level = 3;
  for (const dx of [12, 14, 16]) putBuilding(w, 0, 'canefarm', kx + dx, ky - 2);
  return { w, inRange };
}

function runSpiral(seed: number, fixK: boolean): Spiral {
  state.fixK = fixK;
  const { w, inRange } = spiralWorld(seed);
  const distillery = Object.values(w.buildings).find((b) => b.defId === 'distillery')!;
  expect(demolish(w, inRange.id).ok).toBe(true); // T0: das einzige Bürgerhaus im Arbeitsweg fällt weg
  let firstShrink: number | null = null;
  let last = citizens(w);
  for (let i = 0; i < SPIRAL_TICKS; i++) {
    home(w).stock.food = REFILL;
    home(w).stock.cloth = REFILL;
    w.money = 1_000_000;
    step(w);
    const now = citizens(w);
    if (firstShrink === null && now < last) firstShrink = w.tick;
    last = now;
  }
  const kRun = runningLevel(w, distillery);
  state.fixK = false;
  const houses = Object.values(w.buildings).filter((b) => (b.house?.tier ?? 0) >= 3).length;
  return {
    burgerHouses: houses,
    citizens: citizens(w),
    rum: home(w).stock.rum,
    firstShrink,
    distilleryK: kRun,
  };
}

describe('AK-AL-48 Spiral-Messung Ausbau-Logik', () => {
  for (const seed of SEEDS) {
    it(`Seed ${seed}: Verlust des Bürgerhauses im Arbeitsweg kostet gegenüber k = g höchstens 4 Bürger und 1 Bürgerhaus`, () => {
      const l = runSpiral(seed, false);
      const k = runSpiral(seed, true);
      if (import.meta.env.VITE_BALANCE_LOG) console.log('AK-AL-48', seed, JSON.stringify({ l, k }));
      // Ruling R1000: Die Sim kennt keinen Haus-Abstieg (tier fällt nie), daher sind die Bürger-Einwohner die Kennzahl.
      expect(k.burgerHouses - l.burgerHouses).toBeLessThanOrEqual(MAX_HOUSE_DIFF);
      expect(k.citizens - l.citizens).toBeLessThanOrEqual(MAX_CITIZEN_DIFF);
      expect(l.distilleryK).toBe(2); // die Messung greift: ohne Bürgerhaus läuft die Brennerei wie Stufe 2
    });
  }
});
