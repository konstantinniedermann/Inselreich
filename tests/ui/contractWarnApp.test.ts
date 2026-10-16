import { describe, expect, it } from 'vitest';
import { ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { CONTRACT_WARN_TICKS } from '../../src/sim/defs/goods';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { HOME, createWorld } from '../../src/sim/world';
import { warnPeriod } from '../../src/ui/order';
import { warnStep } from '../../src/ui/warnStep';

const SETTLE = ORDER_FIRST_TICK + ORDER_PERIOD;

function world(tick: number): World {
  const w = createWorld(3, { unlockAll: true });
  w.order = null;
  w.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries: 0 };
  w.islands[HOME]!.stock.rum = 0;
  w.tick = tick;
  return w;
}

/** Spiegelt die Schleife in app.ts: je Frame `perFrame` Ticks, danach ein warnStep (nur bei ticks > 0). */
function run(w: World, until: number, perFrame: number, prime: number | null, log: string[]) {
  let warned = prime;
  while (w.tick < until) {
    for (let i = 0; i < perFrame && w.tick < until; i++) step(w);
    const r = warnStep(warned, w);
    warned = r.warnedPeriod;
    if (r.fire) log.push('contractWarn');
  }
  return warned;
}

describe('I-122 Vorwarn-Verdrahtung (AK-W9)', () => {
  it('genau einmal im Fenster, auch bei weiteren Ticks und fallendem Lager', () => {
    const w = world(SETTLE - CONTRACT_WARN_TICKS - 20);
    const log: string[] = [];
    let warned = run(w, SETTLE - CONTRACT_WARN_TICKS - 1, 1, null, log);
    expect(log).toEqual([]);
    warned = run(w, SETTLE - 100, 1, warned, log);
    expect(log).toEqual(['contractWarn']);
    w.islands[HOME]!.stock.rum = 9;
    w.islands[HOME]!.stock.rum = 0;
    run(w, SETTLE - 5, 1, warned, log);
    expect(log).toEqual(['contractWarn']);
  });

  it('nächste Periode meldet erneut', () => {
    const w = world(SETTLE - 100);
    const log: string[] = [];
    const warned = run(w, SETTLE - 50, 1, null, log);
    w.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries: 0 };
    w.islands[HOME]!.stock.rum = 0;
    w.tick = SETTLE + ORDER_PERIOD - 100;
    run(w, SETTLE + ORDER_PERIOD - 50, 1, warned, log);
    expect(log).toHaveLength(2);
  });

  it('x4 über die Fenstergrenze: einmal', () => {
    const w = world(SETTLE - CONTRACT_WARN_TICKS - 2);
    const log: string[] = [];
    run(w, SETTLE - 50, 4, null, log);
    expect(log).toEqual(['contractWarn']);
  });

  it('Laden im Fenster (Priming): kein Eintrag', () => {
    const w = world(SETTLE - 100);
    const log: string[] = [];
    run(w, SETTLE - 20, 1, warnPeriod(w), log);
    expect(log).toEqual([]);
  });

  it('Pause: warnStep wird nicht gerufen, nichts ändert sich', () => {
    const w = world(SETTLE - 100);
    const log: string[] = [];
    run(w, SETTLE - 100, 1, null, log);
    expect(log).toEqual([]);
  });
});
