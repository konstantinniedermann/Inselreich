import { beforeAll, describe, expect, it } from 'vitest';
import { placeBuilding } from '../../src/sim/build';
import { MONUMENT_GOODS, MONUMENT_STAGES } from '../../src/sim/defs/monument';
import { setEdict } from '../../src/sim/edicts';
import { monumentReserve, startMonumentStage } from '../../src/sim/monument';
import { recomputeConnectivity } from '../../src/sim/roads';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { BuildingDefId, GoodId, MonumentGood, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { layoutFor, startColony } from './controller';
import { placeTownhall } from './helpers';
import { layMonumentRoad, monumentWorld, placeMonument } from './monumentHelpers';
import { newMerchantTrajectory, runMerchants } from './merchantsController';

// Seed-Läufe des Denkmals (M13-E2 T07, Spec Anhang 03). Reihenfolge: messen, prüfen, pinnen.
// Festwerte (R455 T-B2): Messwert, Änderung nur per Ruling.

/** E1-Festwerte aus balance-edicts.test.ts: Ausgangsstand K'-arm (Anhang 03 A). */
const K_ARM = 11_800;
const T0 = 11_800;
const WIN_TICK = 6750;

/** Lauf A: Anhang 01 C (gerechnet, kein Messwert). */
const A_FINISH_TICKS = [3000, 5000, 7000];
const A_COST = 64_200;
const A_COST_TRADE = 54_960;
const A_END_STOCK = 20;

// Messwerte Lauf B (6000 Ticks ab T0, kein Controller, kein Zukauf): Messwert, Änderung nur per Ruling.
// Nichts geliefert: Stein 6 und Werkzeug 0 liegen bei T0 unter der Reserve 20, Glas 27 und Gewürz 0 unter 48.
const B_DELIVERED: Record<MonumentGood, number> = { stone: 0, tools: 0, glass: 0, spice: 0 };
const B_END_STOCK: Record<MonumentGood, number> = { stone: 0, tools: 0, glass: 0, spice: 0 };
const B_MERCHANTS_T0 = 60;
const B_MERCHANTS_END = 3;
// Messwert Reserve-Prüfung AK-20: geprüfte Fälle je Gut (Messwert, Änderung nur per Ruling).
const R_CASES: Record<'glass' | 'spice', number> = { glass: 10, spice: 5 };
// Messwert Lauf C: t1 - t_s (Messwert, Änderung nur per Ruling); bindendes Gut Werkzeug (geloggt, kein Pin).
const C_TICKS = 6720;

/** Grenzen Lauf C (O11, Anhang 01 D): 6720 +- 30 %. */
const C_MIN = 4704;
const C_MAX = 8736;

/** Bauplatz des Denkmals im K'-Stand: Versatz vom Kontor (32, 31), frei, angebunden, versorgt (einmal bestimmt). */
const K_MONUMENT = { x: 31, y: 38 } as const;
const B_TICKS = 6000;
const RESERVE_TICKS = 1000;

const log = (label: string, data: unknown): void => {
  console.info(`[balance-monument] ${label}`, JSON.stringify(data));
};

function load(save: string): World {
  const r = deserialize(save);
  if (!r.ok) throw new Error(r.reason);
  return r.world;
}

/** Versorgung ohne Controller: Nahrung, Stoff, Rum, Holz auf 100, nicht die vier Denkmal-Güter. */
const FEED_GOODS: readonly GoodId[] = ['food', 'cloth', 'rum', 'wood'];
const feed = (w: World): void => {
  for (const g of FEED_GOODS) home(w).stock[g] = 100;
};
/** Schritt mit `feed` alle 10 Ticks. */
function stepFed(w: World): void {
  step(w);
  if (w.tick % 10 === 0) feed(w);
}

/** Setzt ein Gebäude roh: Kosten neutralisiert (Geld und Lager danach wie vorher). */
function placeRaw(w: World, defId: BuildingDefId, x: number, y: number): number {
  const money = w.money;
  const stock = { ...home(w).stock };
  w.money = 1_000_000;
  for (const g of Object.keys(stock) as GoodId[]) home(w).stock[g] = 100;
  const r = placeBuilding(w, defId, x, y);
  if (!r.ok || r.id === undefined)
    throw new Error(`${defId} ${x},${y}: ${r.ok ? 'ohne Id' : r.reason}`);
  w.money = money;
  home(w).stock = stock;
  return r.id;
}

const merchants = (w: World): number =>
  Object.values(w.buildings).reduce(
    (n, b) => (b.house !== undefined && b.house.tier === 4 ? n + b.house.inhabitants : n),
    0,
  );

/** Denkmal im K'-Stand setzen, 4000 gutschreiben, Abschnitt 1 starten. */
function startAtK(w: World): void {
  const id = placeRaw(w, 'monument', K_MONUMENT.x, K_MONUMENT.y);
  if (!w.buildings[id]!.connected) throw new Error('Denkmal nicht angebunden');
  w.money += MONUMENT_STAGES[0]!.money;
  const r = startMonumentStage(w);
  if (!r.ok) throw new Error(r.reason);
}

// ---------- Phase 1 und 2 (K'-arm-Stand), einmal je Datei ----------

let kSave: string;
let kTick: number | null;
let t0: number;

beforeAll(() => {
  const w = createWorld(3);
  const { layout } = startColony(w);
  expect(runMerchants(w, layout, newMerchantTrajectory(), (x) => x.won)).toBe(true);
  expect(w.tick).toBe(WIN_TICK);
  placeTownhall(w);
  const t = newMerchantTrajectory();
  runMerchants(w, layoutFor(w), t);
  kTick = t.wonMerchantsTick;
  while (w.tick % 200 !== 0) step(w);
  t0 = w.tick;
  kSave = serialize(w);
}, 15_000);

// ---------- Lauf A ----------

interface RunA {
  finish: number[];
  diff: number;
  endStock: Record<MonumentGood, number>;
}

/** Synthetische Welt (Krisen aus), Denkmal roh, optional Handel; liefert Welt mit gesetzten buy. */
function worldA(trade: boolean): World {
  const w = monumentWorld({ crisisLevel: 'off' });
  layMonumentRoad(w);
  w.won = true; // der Spielstand-Test verlangt `won`, wo `wonMerchants` gilt
  if (trade) placeTownhall(w);
  const money = w.money;
  const stock = { ...home(w).stock };
  placeMonument(w);
  w.money = money;
  home(w).stock = stock;
  recomputeConnectivity(w);
  if (trade) {
    w.money += 600;
    expect(setEdict(w, 'trade')).toEqual({ ok: true });
  }
  return load(serialize(w));
}

function runA(trade: boolean): RunA {
  const w = worldA(trade);
  const twin = worldA(trade);
  expect(startMonumentStage(w)).toEqual({ ok: true });
  for (const g of MONUMENT_GOODS) w.monument!.buy[g] = true;
  const finish: number[] = [];
  while (!w.monumentDone && w.tick < 12_000) {
    const stage = w.monument!.stage;
    step(w);
    step(twin);
    if (w.monument!.stage > stage) {
      finish.push(w.tick);
      if (!w.monumentDone) expect(startMonumentStage(w)).toEqual({ ok: true });
    }
  }
  const endStock = {} as Record<MonumentGood, number>;
  for (const g of MONUMENT_GOODS) endStock[g] = home(w).stock[g];
  return { finish, diff: twin.money - w.money, endStock };
}

describe('M13-E2 Seed-Läufe Denkmal (Auflage B3)', () => {
  it('AK-M13E2-12 Lauf A: Vollzukauf exakt, ohne und mit Handel', () => {
    const plain = runA(false);
    const trade = runA(true);
    log('A', { plain, trade });
    expect(plain.finish).toEqual(A_FINISH_TICKS);
    expect(plain.diff).toBe(A_COST);
    expect(trade.finish).toEqual(A_FINISH_TICKS);
    expect(trade.diff).toBe(A_COST_TRADE);
    for (const g of MONUMENT_GOODS) {
      expect(plain.endStock[g]).toBe(A_END_STOCK);
      expect(trade.endStock[g]).toBe(A_END_STOCK);
    }
  }, 10_000);

  // ---------- Lauf B ----------

  it('Ausgangsstand: K_ARM und T0 wie in balance-edicts.test.ts', () => {
    expect(kTick).toBe(K_ARM);
    expect(t0).toBe(T0);
  });

  it('AK-M13E2-18 Lauf B: Abschnitt 1 ohne Zusatzausbau, kein Controller', () => {
    const w = load(kSave);
    startAtK(w);
    const m0 = merchants(w);
    const stock0 = { ...home(w).stock };
    while (w.tick < t0 + B_TICKS && w.monument!.stage === 0) stepFed(w);
    const m = w.monument!;
    const goal = MONUMENT_STAGES[0]!.goods;
    const delivered = { ...m.delivered };
    const endStock = {} as Record<MonumentGood, number>;
    for (const g of MONUMENT_GOODS) endStock[g] = home(w).stock[g];
    const elapsed = w.tick - t0;
    const estimate = MONUMENT_GOODS.map((g) => ({
      good: g,
      rate: delivered[g] / elapsed,
      ticks: delivered[g] === 0 ? null : goal[g] / (delivered[g] / elapsed),
    }));
    const open = estimate.filter((e) => delivered[e.good] < goal[e.good]);
    const stuck = open.some((e) => e.ticks === null);
    const minutes = stuck ? null : Math.round(Math.max(0, ...open.map((e) => e.ticks!)) / 600);
    log('B', {
      stage: m.stage,
      elapsed,
      delivered,
      endStock,
      stock0,
      m0,
      m1: merchants(w),
      estimate,
      minutes,
      stuck,
    });
    expect(elapsed).toBe(B_TICKS);
    expect(m.stage).toBe(0);
    expect(delivered).toEqual(B_DELIVERED);
    expect(endStock).toEqual(B_END_STOCK);
    expect(m0).toBe(B_MERCHANTS_T0);
    expect(merchants(w)).toBe(B_MERCHANTS_END);
  }, 10_000);

  it('AK-M13E2-20 Reserve: der Zug unterschreitet die Hausreserve nie', () => {
    const w = load(kSave);
    startAtK(w);
    const s = home(w).stock;
    s.glass = monumentReserve(w, 'glass') + 10;
    s.spice = monumentReserve(w, 'spice') + 10;
    const cases = { glass: 0, spice: 0 };
    while (w.tick < t0 + RESERVE_TICKS) {
      const before = { ...w.monument!.delivered };
      stepFed(w);
      for (const g of ['glass', 'spice'] as const) {
        if (w.monument!.delivered[g] <= before[g]) continue;
        cases[g] += 1;
        expect(home(w).stock[g], `${g} Tick ${w.tick}`).toBeGreaterThanOrEqual(
          monumentReserve(w, g),
        );
      }
    }
    log('Reserve', cases);
    expect(cases.glass).toBeGreaterThan(0);
    expect(cases.spice).toBeGreaterThan(0);
    expect(cases).toEqual(R_CASES);
  }, 10_000);

  // ---------- Lauf C ----------

  it('AK-M13E2-19 Lauf C: R-Ausbau, Abschnitt 1 in der Spanne', () => {
    const r = runC();
    log('C', r);
    expect(r.ticks).not.toBeNull();
    expect(r.ticks!).toBeGreaterThanOrEqual(C_MIN);
    expect(r.ticks!).toBeLessThanOrEqual(C_MAX);
    expect(r.ticks).toBe(C_TICKS);
  }, 10_000);
});

// ---------- Lauf C: synthetische R-Welt ----------

/**
 * Plätze (einmal bestimmt, Seed 3, Kontor (32, 31), Gebirge ab x = 36 in den Zeilen 38 bis 40): Weg (33, 33), dann
 * Spalte x = 34 von y = 33 bis 40; 3 Steinbrüche (35, 38), (35, 39), (35, 40) am Gebirgsrand; Glashütte (35, 34) und
 * Werkzeugmacher (35, 36), beide 2x2 an der Spalte; Schule (32, 35), 2x2, Dienstradius 10 deckt den Werkzeugmacher.
 * Denkmal am festen Platz MONUMENT_AT mit dem Wegstück aus `layMonumentRoad` (Zeilen 28 bis 37 sind Gras).
 */
const GAIN_SPICE_TICKS = 50;
const SWITCH_START = 1000;

function buildRWorld(): World {
  const w = monumentWorld({ crisisLevel: 'off' });
  layMonumentRoad(w);
  w.won = true;
  const isl = w.islands[0]!;
  const road = (x: number, y: number): void => {
    isl.tiles[y * isl.width + x]!.road = true;
  };
  road(33, 33);
  for (let y = 33; y <= 40; y++) road(34, y);
  recomputeConnectivity(w);
  placeRaw(w, 'school', 32, 35);
  placeRaw(w, 'toolmaker', 35, 36);
  placeRaw(w, 'glassworks', 35, 34);
  for (const y of [38, 39, 40]) placeRaw(w, 'quarry', 35, y);
  placeMonument(w);
  recomputeConnectivity(w);
  return w;
}

function runC(): {
  ticks: number | null;
  binding: MonumentGood | null;
  delivered: Record<MonumentGood, number>;
} {
  const w = load(serialize(buildRWorld()));
  const stock = home(w).stock;
  w.money = 100_000;
  for (const g of MONUMENT_GOODS) stock[g] = 20;
  expect(w.tick % 10).toBe(0);
  expect(startMonumentStage(w)).toEqual({ ok: true });
  const ts = w.tick;
  expect(ts).toBe(SWITCH_START);
  const done: Partial<Record<MonumentGood, number>> = {};
  while (w.tick < ts + C_MAX && w.monument!.stage === 0) {
    step(w);
    if (w.tick % 10 === 0) stock.wood = 100;
    if (w.tick % GAIN_SPICE_TICKS === 0) stock.spice += 1;
    for (const g of MONUMENT_GOODS)
      if (done[g] === undefined && w.monument!.delivered[g] >= MONUMENT_STAGES[0]!.goods[g])
        done[g] = w.tick - ts;
  }
  const finished = w.monument!.stage > 0;
  const last = Math.max(...Object.values(done));
  const binding = MONUMENT_GOODS.find((g) => done[g] === last) ?? null;
  return { ticks: finished ? w.tick - ts : null, binding, delivered: { ...w.monument!.delivered } };
}
