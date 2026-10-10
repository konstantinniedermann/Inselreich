import { beforeAll, describe, expect, it } from 'vitest';
import { placeBuilding } from '../../src/sim/build';
import { setEdict } from '../../src/sim/edicts';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { EdictId, GoodId, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { layoutFor, startColony } from './controller';
import { placeTownhall } from './helpers';
import { MERCHANT_TICK_LIMIT, newMerchantTrajectory, runMerchants } from './merchantsController';

/** Sieg-Tick und Pin des zweiten Ziels ohne Amtsstube (balance-merchants.test.ts), AK-M13E1-21. */
const WIN_TICK = 6750;
const PIN_MERCHANTS = 11_500;

// Festwerte (R455 T-B2): gemessen mit VITE_BALANCE_LOG=1, Anhang 03 A. NaN = noch nicht gemessen.
const K_ARM = 11_800;
const SAVING_ARM = 11_200;
const TRADE_ARM = 11_200;
const WELFARE_ARM = null; // null = nicht bis 12 000
const K_RICH = 7700;
const WELFARE_RICH = 7640;
const T0 = 11_800;
const FULL_K: readonly number[] = [13_850, 13_850, 13_850, 13_850];
const FULL_W: readonly number[] = [13_200, 13_200, 13_200, 13_200];
const MONEY_K = 56_068;
const MONEY_S = 54_706;
const MONEY_W = 60_446;

/** Vier Hausplätze der Welle, Versatz (dx, dy) vom Kontor: frei, an einem Weg, im Kontor- und Dienstradius. */
const WAVE_SLOTS: readonly (readonly [number, number])[] = [
  [3, -3],
  [4, -3],
  [6, -3],
  [1, -1],
];
const WAVE_LENGTH = 3000;
const TOP_UP_GOODS: readonly GoodId[] = [
  'food',
  'cloth',
  'rum',
  'glass',
  'spice',
  'wood',
  'tools',
  'stone',
];

const log = (label: string, data: unknown): void => {
  if (import.meta.env.VITE_BALANCE_LOG) console.log({ case: label, data });
};

function load(save: string): World {
  const r = deserialize(save);
  if (!r.ok) throw new Error(r.reason);
  return r.world;
}

/** Phase 1 bis `won` (erwartet 6750); `bonus` Geld vor der Amtsstube; Amtsstube auf festem Platz; Stand ohne und mit. */
function phase1(bonus: number): { bare: string; withHall: string } {
  const w = createWorld(3);
  const { layout } = startColony(w);
  expect(runMerchants(w, layout, newMerchantTrajectory(), (x) => x.won)).toBe(true);
  expect(w.tick).toBe(WIN_TICK);
  w.money += bonus;
  const bare = serialize(w);
  placeTownhall(w);
  return { bare, withHall: serialize(w) };
}

/** Phase 2 aus einem Stand: optional +600 Geld und Edikt im selben Tick; liefert Tick von `wonMerchants` und die Welt. */
function phase2(save: string, edict: EdictId | null): { tick: number | null; w: World } {
  const w = load(save);
  if (edict !== null) {
    w.money += 600;
    expect(setEdict(w, edict)).toEqual({ ok: true });
  }
  const t = newMerchantTrajectory();
  runMerchants(w, layoutFor(w), t);
  return { tick: t.wonMerchantsTick, w };
}

const topUp = (w: World): void => {
  for (const g of TOP_UP_GOODS) home(w).stock[g] = 100;
};
/** Ohne Controller: Schritt, alle 10 Ticks `topUp`, bis `until`. */
function idle(w: World, until: number): void {
  while (w.tick < until) {
    step(w);
    if (w.tick % 10 === 0) topUp(w);
  }
}

function placeWave(w: World): number[] {
  const k = w.buildings[home(w).kontorId]!;
  const money = w.money;
  const stock = { ...home(w).stock };
  w.money = 1_000_000;
  for (const g of Object.keys(stock) as GoodId[]) home(w).stock[g] = 100;
  const ids = WAVE_SLOTS.map(([dx, dy]) => {
    const r = placeBuilding(w, 'house', k.x + dx, k.y + dy);
    expect(r.ok, `Haus ${dx},${dy}`).toBe(true);
    return r.id!;
  });
  w.money = money;
  home(w).stock = stock;
  return ids;
}

interface WaveResult {
  full: (number | null)[];
  money: number;
  shrank: boolean;
}

function wave(kw: string, t0: number, edict: EdictId | null): WaveResult {
  const w = load(kw);
  if (edict !== null) {
    w.money += 600;
    expect(setEdict(w, edict)).toEqual({ ok: true });
  }
  const ids = placeWave(w);
  const full: (number | null)[] = ids.map(() => null);
  const last = ids.map(() => 1);
  let shrank = false;
  while (w.tick < t0 + WAVE_LENGTH) {
    step(w);
    if (w.tick % 10 === 0) topUp(w);
    ids.forEach((id, i) => {
      const h = w.buildings[id]!.house!;
      if (h.inhabitants < last[i]!) shrank = true;
      last[i] = h.inhabitants;
      if (full[i] === null && h.tier === 4 && h.inhabitants === 20) full[i] = w.tick;
    });
  }
  return { full, money: w.money, shrank };
}

let p1: { bare: string; withHall: string };
let p1Rich: { bare: string; withHall: string };
let kArm: { tick: number | null; w: World };
let kwSave: string;
let t0: number;

beforeAll(() => {
  p1 = phase1(0);
  p1Rich = phase1(20_000);
  kArm = phase2(p1.withHall, null);
  const kw = load(serialize(kArm.w));
  idle(kw, Math.ceil(kw.tick / 200) * 200);
  t0 = kw.tick;
  kwSave = serialize(kw);
}, 15_000);

describe('M13-E1 Seed-Läufe (Auflagen B1, B3)', () => {
  it('AK-M13E1-19 arm: Sparen und Handel früher, Wohlfahrt nicht früher', () => {
    const k = kArm.tick;
    expect(k).not.toBeNull();
    expect(k!).toBeLessThanOrEqual(MERCHANT_TICK_LIMIT);
    const saving = phase2(p1.withHall, 'saving').tick;
    const trade = phase2(p1.withHall, 'trade').tick;
    const welfare = phase2(p1.withHall, 'welfare').tick;
    log('arm', { k, saving, trade, welfare });
    for (const v of [saving, trade]) {
      expect(v).not.toBeNull();
      expect(v!).toBeGreaterThanOrEqual(k! - 600);
      expect(v!).toBeLessThanOrEqual(k! - 100);
    }
    if (welfare !== null) expect(welfare).toBeGreaterThan(k!);
    expect(k).toBe(K_ARM);
    expect(saving).toBe(SAVING_ARM);
    expect(trade).toBe(TRADE_ARM);
    expect(welfare).toBe(WELFARE_ARM);
  }, 15_000);

  it('AK-M13E1-17 reich: Wohlfahrt echt früher', () => {
    const k = phase2(p1Rich.withHall, null).tick;
    const welfare = phase2(p1Rich.withHall, 'welfare').tick;
    log('reich', { k, welfare });
    expect(k).not.toBeNull();
    expect(k!).toBeLessThanOrEqual(8000);
    expect(welfare).not.toBeNull();
    expect(welfare!).toBeLessThan(k!);
    expect(k).toBe(K_RICH);
    expect(welfare).toBe(WELFARE_RICH);
  }, 10_000);

  it('AK-M13E1-18 Welle: vier neue Häuser, Wohlfahrt schneller und reicher', () => {
    const k = wave(kwSave, t0, null);
    const s = wave(kwSave, t0, 'saving');
    const wf = wave(kwSave, t0, 'welfare');
    log('welle', {
      t0,
      fullK: k.full,
      fullW: wf.full,
      moneyK: k.money,
      moneyS: s.money,
      moneyW: wf.money,
    });
    for (const r of [k, wf]) for (const f of r.full) expect(f).not.toBeNull();
    for (let i = 0; i < 4; i++) {
      expect(k.full[i]! - wf.full[i]!).toBeGreaterThanOrEqual(250);
    }
    expect(wf.money - k.money).toBeGreaterThan(0);
    expect(wf.money).toBeGreaterThan(s.money);
    expect([k.shrank, s.shrank, wf.shrank]).toEqual([false, false, false]);
    expect(t0).toBe(T0);
    expect(k.full).toEqual(FULL_K);
    expect(wf.full).toEqual(FULL_W);
    expect([k.money, s.money, wf.money]).toEqual([MONEY_K, MONEY_S, MONEY_W]);
  }, 15_000);

  it('AK-M13E1-21 Baseline: ohne Amtsstube Sieg 6750 und zweites Ziel 11 500', () => {
    const r = phase2(p1.bare, null);
    expect(r.w.won).toBe(true);
    expect(r.tick).toBe(PIN_MERCHANTS);
  }, 15_000);

  it('PLAN-M13-01 Determinismus: Wohlfahrt arm zweimal und mit Laden', () => {
    const a = phase2(p1.withHall, 'welfare');
    const b = phase2(p1.withHall, 'welfare');
    expect(b.tick).toBe(a.tick);
    expect(serialize(b.w)).toBe(serialize(a.w));

    const w = load(p1.withHall);
    w.money += 600;
    expect(setEdict(w, 'welfare')).toEqual({ ok: true });
    const t = newMerchantTrajectory();
    runMerchants(w, layoutFor(w), t, (x) => x.tick >= WIN_TICK + 1000);
    const reloaded = load(serialize(w));
    runMerchants(reloaded, layoutFor(reloaded), t);
    expect(t.wonMerchantsTick).toBe(a.tick);
    expect(serialize(reloaded)).toBe(serialize(a.w));
  }, 15_000);
});
