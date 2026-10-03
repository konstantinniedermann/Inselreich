import { describe, expect, it } from 'vitest';
import { deliverOrder } from '../../src/sim/orders';
import { deserialize, serialize } from '../../src/sim/save';
import { setTaxLevel } from '../../src/sim/tax';
import { step } from '../../src/sim/tick';
import { sell } from '../../src/sim/trade';
import type { Result, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { placeTownhall } from './helpers';
import { SCENARIOS } from './scenarios';

describe('M5 15-Minuten-Nachweis', () => {
  it('AK-B1-02 genau 10 Aufträge in 9000 Ticks ohne Eingriff', () => {
    const w = createWorld(3, { unlockAll: true });
    const seen = new Map<number, number>();
    for (let i = 0; i < 9000; i++) {
      step(w);
      if (w.order) seen.set(w.order.period, w.order.due);
    }
    expect([...seen.keys()].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    for (const [k, due] of seen) expect(due).toBe(600 + 900 * k + 600);
  });

  describe('Determinismus mit Spieleraktionen', () => {
    type Action = { tick: number; name: string; run: (w: World) => Result };
    const SCRIPT: Action[] = [
      { tick: 600, name: 'deliverOrder', run: (w) => deliverOrder(w) },
      { tick: 700, name: "setTaxLevel 'high'", run: (w) => setTaxLevel(w, 'high') },
      { tick: 750, name: 'sell wood 10', run: (w) => sell(w, 'wood', 10) },
      { tick: 1100, name: "setTaxLevel 'normal'", run: (w) => setTaxLevel(w, 'normal') },
      { tick: 1600, name: 'deliverOrder', run: (w) => deliverOrder(w) },
    ];
    const END = 3000;
    const SAVE_AT = 1000;

    interface Entry {
      tick: number;
      action: string;
      ok: boolean;
      reason: string | null;
    }

    /** Aktionen laufen, wenn `world.tick` den Skript-Tick erreicht hat, vor dem `step` dieses Ticks. */
    function run(reload: boolean): { log: Entry[]; json: string } {
      let w = SCENARIOS['auftrag']!();
      placeTownhall(w); // M10: Steuerstufen brauchen eine Amtsstube
      const log: Entry[] = [];
      while (w.tick < END) {
        if (reload && w.tick === SAVE_AT) {
          const r = deserialize(serialize(w));
          if (!r.ok) throw new Error(r.reason);
          w = r.world;
        }
        for (const a of SCRIPT.filter((s) => s.tick === w.tick)) {
          const r = a.run(w);
          log.push({ tick: w.tick, action: a.name, ok: r.ok, reason: r.ok ? null : r.reason });
        }
        step(w);
      }
      return { log, json: serialize(w) };
    }

    it('Speichern und Laden mitten in der Partie ändert nichts, Wiederholung liefert dasselbe', () => {
      const a = run(false);
      const b = run(true);
      const c = run(false);
      expect(a.log.map((e) => [e.tick, e.ok, e.reason])).toEqual([
        [600, true, null],
        [700, true, null],
        [750, true, null],
        [1100, true, null],
        [1600, false, 'Nicht genug Ware'],
      ]);
      expect(b.log).toEqual(a.log);
      expect(b.json).toBe(a.json);
      expect(c.log).toEqual(a.log);
      expect(c.json).toBe(a.json);
    });
  });
});
