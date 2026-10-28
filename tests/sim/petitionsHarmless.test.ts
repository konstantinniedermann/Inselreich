import { describe, expect, it } from 'vitest';
import { goodsBalance } from '../../src/sim/flow';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { runColony, startColony } from './controller';

const TOTAL = 60_000;
const WINDOW = 6000;
const ALLOWED = new Set(['drawn', 'timeout', 'lament', 'ended']);

/** Feste Welt nach Ziel 1: Controller läuft bis zum Sieg, danach nie wieder. */
function wonWorld(): World {
  const w = createWorld(3);
  const { layout, t } = startColony(w);
  runColony(w, layout, t, {});
  expect(w.won).toBe(true);
  return w;
}

/** (a) versorgt: Kaufmanns- und Bürgerhäuser auf Stufe 2 gesetzt, bis kein Gut einen Fehlbetrag hat. */
function suppliedWorld(): World {
  const w = wonWorld();
  for (const b of Object.values(w.buildings)) if (b.house && b.house.tier > 2) b.house.tier = 2;
  return w;
}

const residents = (w: World): number =>
  Object.values(w.buildings).reduce((s, b) => s + (b.house?.inhabitants ?? 0), 0);

interface Run {
  perTick: number[];
  window: { ticks: number; money: number }[];
  crises: string[];
  kinds: Set<string>;
}

function play(json: string, on: boolean): Run {
  const w = JSON.parse(json) as World;
  w.petitions.on = on;
  const run: Run = { perTick: [], window: [], crises: [], kinds: new Set() };
  let sum = 0;
  let last = -1;
  for (let i = 1; i <= TOTAL; i++) {
    const r = step(w);
    for (const e of r.petitions) run.kinds.add(e.kind);
    if (w.crisis !== null && w.crisis.from !== last) {
      last = w.crisis.from;
      run.crises.push(`${w.crisis.from}:${w.crisis.kind}`);
    }
    const n = residents(w);
    run.perTick.push(n);
    sum += n;
    if (i % WINDOW === 0) {
      run.window.push({ ticks: sum, money: w.money });
      sum = 0;
    }
  }
  return run;
}

// Zwei Läufe zu 3,9 s (Last ~5): die Vorgabe von 5 s reicht bei Rechnerlast nicht.
describe('AK-BS-13 Nein ist harmlos', { timeout: 30_000 }, () => {
  it('(a) versorgte Welt: Einwohner je Tick gleich, Geld >= Referenz, Krisenfolge gleich', () => {
    const w = suppliedWorld();
    for (const g of GOOD_IDS) expect(goodsBalance(w)[g].net, g).toBeGreaterThanOrEqual(0);
    const json = serialize(w);
    const ref = play(json, false);
    const on = play(json, true);
    expect([...on.kinds].every((k) => ALLOWED.has(k))).toBe(true);
    expect(on.kinds.has('drawn')).toBe(true);
    expect(on.perTick).toEqual(ref.perTick);
    on.window.forEach((x, i) => expect(x.money).toBeGreaterThanOrEqual(ref.window[i]!.money));
    expect(on.crises).toEqual(ref.crises);
  });
  it('(b) knappe Welt (Rum ü < 0): je Fenster >= 99 Prozent, gesamt >= Referenz', () => {
    const w = wonWorld();
    expect(goodsBalance(w).rum.net).toBeLessThan(0);
    const json = serialize(w);
    const ref = play(json, false);
    const on = play(json, true);
    expect([...on.kinds].every((k) => ALLOWED.has(k))).toBe(true);
    on.window.forEach((x, i) => {
      expect(x.ticks).toBeGreaterThanOrEqual(ref.window[i]!.ticks * 0.99);
      expect(x.money).toBeGreaterThanOrEqual(ref.window[i]!.money * 0.99);
    });
    const sum = (r: Run, k: 'ticks' | 'money'): number => r.window.reduce((s, x) => s + x[k], 0);
    expect(sum(on, 'ticks')).toBeGreaterThanOrEqual(sum(ref, 'ticks'));
    expect(sum(on, 'money')).toBeGreaterThanOrEqual(sum(ref, 'money'));
  });
});
