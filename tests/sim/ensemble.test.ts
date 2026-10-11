import { describe, expect, it } from 'vitest';
import { serialize } from '../../src/sim/save';
import { createWorld } from '../../src/sim/world';
import { formatTable, judge, PHASES, runEnsemble, summarize, type Row } from './ensemble';
import {
  buySurcharge,
  buyVolume,
  CONTROL_INTERVAL,
  MAX_TICKS,
  runColony,
  startColony,
  WIN_TICK_LIMIT,
  type ColonyOptions,
} from './controller';

function stateAt1500(opts: ColonyOptions): string {
  const w = createWorld(3);
  const { layout, t } = startColony(w);
  runColony(w, layout, t, opts, (x) => x.tick >= 1500);
  return serialize(w);
}

describe('Controller-Phase (Gate-Ensemble)', () => {
  it('GE-1: ohne Option und phase 0 ergeben denselben Zustand', () => {
    expect(stateAt1500({ phase: 0 })).toBe(stateAt1500({}));
  });

  it('GE-2: phase 20 ergibt einen anderen Zustand als phase 0', () => {
    expect(stateAt1500({ phase: 20 })).not.toBe(stateAt1500({ phase: 0 }));
  });
});

describe('Messweg trackedBuy (Gate-Ensemble)', () => {
  it('GE-3: Zukauf-Volumen wird gemessen, Aufpreis ist auf main 0', () => {
    const w = createWorld(3);
    const { layout, t } = startColony(w);
    runColony(w, layout, t, { phase: 0 }, (x) => x.tick >= 1500);
    expect(buyVolume(w)).toBeGreaterThan(0);
    expect(buySurcharge(w)).toBe(0);
  });
});

describe('Ensemble-Statistik (Gate-Ensemble)', () => {
  it('GE-4a: summarize bei ungerader Anzahl nimmt den mittleren Wert', () => {
    expect(summarize([5, 1, 3])).toEqual({ median: 3, min: 1, max: 5, spread: 4, n: 3 });
  });

  it('GE-4b: summarize bei gerader Anzahl mittelt die zwei mittleren Werte', () => {
    expect(summarize([4, 1, 2, 10]).median).toBe(3);
  });

  it('GE-4c: summarize bei einem Wert hat Spannweite 0', () => {
    expect(summarize([7])).toEqual({ median: 7, min: 7, max: 7, spread: 0, n: 1 });
  });

  it('GE-4d: summarize verändert die Eingabe nicht', () => {
    const values = [3, 1, 2];
    summarize(values);
    expect(values).toEqual([3, 1, 2]);
  });

  it('GE-4e: summarize wirft bei leerer Eingabe einen sprechenden Fehler', () => {
    expect(() => summarize([])).toThrow(/keine Werte/);
  });

  it('GE-5a: judge urteilt OK, wenn alle Werte innerhalb liegen (beidseitig)', () => {
    const row = judge({ name: 'x', lo: 1, hi: 5 }, [1, 3, 5]);
    expect(row.verdict).toBe('OK');
    expect(row.held).toBe(3);
  });

  it('GE-5b: judge urteilt AUSREISSER, wenn der Median innerhalb, ein Wert ausserhalb liegt (einseitig)', () => {
    const row = judge({ name: 'x', hi: 10 }, [1, 2, 3, 4, 11]);
    expect(row.verdict).toBe('AUSREISSER');
    expect(row.held).toBe(4);
  });

  it('GE-5c: judge urteilt GERISSEN, wenn der Median ausserhalb liegt', () => {
    const row = judge({ name: 'x', lo: 5 }, [1, 2, 3, 6, 7]);
    expect(row.verdict).toBe('GERISSEN');
    expect(row.held).toBe(2);
  });

  it('GE-5d: formatTable nennt Urteil, k/n und den Hinweis zu Entscheidungszeitpunkten', () => {
    const table = formatTable([judge({ name: 'x', hi: 10 }, [1, 2, 3, 4, 11])]);
    expect(table).toContain('AUSREISSER');
    expect(table).toContain('4/5');
    expect(table).toContain('Robustheit gegen Entscheidungszeitpunkte (Controller-Phase)');
  });

  it('GE-5e: runEnsemble ruft measure je Phase genau einmal in Reihenfolge', () => {
    const calls: number[] = [];
    const out = runEnsemble((phase) => {
      calls.push(phase);
      return phase * 2;
    });
    expect(calls).toEqual([0, 20, 40, 60, 80]);
    expect(out).toEqual([0, 40, 80, 120, 160]);
  });
});

describe('Ensemble-Wächter (Gate-Ensemble)', () => {
  it('GE-6: fünf paarweise verschiedene Phasen unterhalb des Kontrollintervalls', () => {
    expect(PHASES.length).toBe(5);
    expect(new Set(PHASES).size).toBe(PHASES.length);
    for (const p of PHASES) expect(p).toBeLessThan(CONTROL_INTERVAL);
  });
});

// Quelle der Grenzen: balance*.test.ts (balance.test.ts: Sieg-Tick <= WIN_TICK_LIMIT und Geld > 0;
// balance-upgrade.test.ts: minMoney >= 0). Für Siedler, Bürger und Zukauf-Mehrkosten gibt es dort
// keine Grenze; sie werden ohne Grenze mitgemessen.
const LIMIT_WIN_TICK = { name: 'Sieg-Tick', hi: WIN_TICK_LIMIT };
const LIMIT_MIN_MONEY = { name: 'minMoney', lo: 0 };
const LIMIT_END_MONEY = { name: 'endMoney', lo: 1 };

interface Measurement {
  winTick: number;
  firstSettler: number;
  firstCitizen: number;
  minMoney: number;
  endMoney: number;
  surchargePct: number;
}

function measurePhase(phase: number): Measurement {
  const w = createWorld(3);
  const { layout, t } = startColony(w);
  runColony(w, layout, t, { phase });
  const volume = buyVolume(w);
  return {
    winTick: t.winTick ?? MAX_TICKS + 1,
    firstSettler: t.firstSettler ?? MAX_TICKS + 1,
    firstCitizen: t.firstCitizen ?? MAX_TICKS + 1,
    minMoney: t.minMoney,
    endMoney: t.endMoney,
    surchargePct: volume === 0 ? 0 : (100 * buySurcharge(w)) / volume,
  };
}

// Messlauf: nur mit VITE_ENSEMBLE=1 (make gate-ensemble); das Werkzeug misst, die Gates urteilen.
describe.runIf(Boolean(import.meta.env.VITE_ENSEMBLE))('Ensemble-Messlauf (Gate-Ensemble)', () => {
  it('GE-7: misst alle Phasen und gibt die Tabelle aus', () => {
    const ms = runEnsemble(measurePhase);
    const col = (pick: (m: Measurement) => number): number[] => ms.map(pick);
    const rows: Row[] = [
      judge(
        LIMIT_WIN_TICK,
        col((m) => m.winTick),
      ),
      judge(
        { name: 'erster Siedler' },
        col((m) => m.firstSettler),
      ),
      judge(
        { name: 'erster Bürger' },
        col((m) => m.firstCitizen),
      ),
      judge(
        LIMIT_MIN_MONEY,
        col((m) => m.minMoney),
      ),
      judge(
        LIMIT_END_MONEY,
        col((m) => m.endMoney),
      ),
      judge(
        { name: 'Zukauf-Mehrkosten %' },
        col((m) => m.surchargePct),
      ),
    ];
    console.log(`\n${formatTable(rows)}`);
    expect(rows.length).toBeGreaterThan(0);
  });
});
