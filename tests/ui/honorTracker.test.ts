import { describe, expect, it } from 'vitest';
import { GROWTH_INTERVAL } from '../../src/sim/defs/timing';
import { HONOR_SWIFT_CITIZEN_TICK, type HonorId } from '../../src/sim/defs/honors';
import type { HonorRun } from '../../src/sim/honors';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { createHonorTracker, launchRun } from '../../src/ui/honorTracker';
import { SCENARIOS } from '../sim/scenarios';

const S = 3;
const KURZ = 'm8-kurz-vor-sieg';

function kurz(): World {
  return SCENARIOS[KURZ]!();
}
function runOf(w: World): HonorRun {
  return { seed: w.seed, unlockMode: 'stepwise' };
}

describe('AK-EB-09 Tracker ohne Fehlalarm', () => {
  it('a: alles schon erreicht, ein Schritt, nichts neu', () => {
    const w = createWorld(S);
    w.won = true;
    w.wonMerchants = true;
    w.wonSpice = true;
    w.monumentDone = true;
    for (const i of w.islands) i.kontorId = 1;
    w.trial.passed.push({ id: 'selfSupply' } as World['trial']['passed'][number]);
    const t = createHonorTracker(w);
    step(w);
    expect(t.observe(w, runOf(w))).toEqual([]);
  });

  it('b: Wechsel zu won liefert genau einmal citizenTown (und swiftFound)', () => {
    const w = kurz();
    const run = runOf(w);
    const t = createHonorTracker(w);
    const got: HonorId[] = [];
    for (let i = 0; i < 200 && !w.won; i++) {
      step(w);
      got.push(...t.observe(w, run));
    }
    expect(w.won).toBe(true);
    expect(got.filter((id) => id === 'citizenTown')).toHaveLength(1);
    expect(got).toContain('swiftFound');
    expect(t.observe(w, run)).toEqual([]);
  });

  it('c: frische Welt liefert nichts', () => {
    const w = createWorld(S);
    const t = createHonorTracker(w);
    expect(t.observe(w, runOf(w))).toEqual([]);
  });
});

describe('AK-EB-09 reset', () => {
  function nachSieg(): World {
    const w = kurz();
    for (let i = 0; i < 200 && !w.won; i++) step(w);
    return w;
  }
  it('reset übernimmt den Stand der neuen Welt als bekannt', () => {
    const won = nachSieg();
    expect(won.won).toBe(true);
    const t = createHonorTracker(createWorld(S));
    t.reset(won);
    step(won);
    expect(t.observe(won, runOf(won))).toEqual([]);
  });
  it('Gegenprobe: ohne reset meldet derselbe Ablauf citizenTown', () => {
    const won = nachSieg();
    const t = createHonorTracker(createWorld(S));
    step(won);
    expect(t.observe(won, runOf(won))).toContain('citizenTown');
  });
});

describe('AK-EB-10 Tick je Schritt', () => {
  it('Eintrag trägt den Tick nach dem Wechsel-Schritt, nicht nach dem Frame', () => {
    const w = kurz();
    w.tick = GROWTH_INTERVAL * 20 - 3; // Wechsel im 3. Schritt
    const run = runOf(w);
    const t = createHonorTracker(w);
    const start = w.tick;
    const hits: { id: HonorId; tick: number }[] = [];
    for (let i = 0; i < 8; i++) {
      step(w);
      hits.push(...t.observe(w, run).map((id) => ({ id, tick: w.tick })));
    }
    const hit = hits.find((h) => h.id === 'citizenTown');
    expect(hit).toBeDefined();
    expect(hit!.tick).toBe(start + 3);
    expect(w.tick).toBe(start + 8);
  });
});

describe('AK-EB-03 Tick-Bezug (N7)', () => {
  function swiftAfter(startTick: number): HonorId[] {
    const w = kurz();
    w.tick = startTick;
    const t = createHonorTracker(w);
    const run = runOf(w);
    const got: HonorId[] = [];
    for (let i = 0; i < 3; i++) {
      step(w);
      got.push(...t.observe(w, run));
    }
    return got;
  }
  it('Wechsel bei Tick == Schwelle zählt', () => {
    const got = swiftAfter(HONOR_SWIFT_CITIZEN_TICK - 1);
    expect(got).toContain('citizenTown');
    expect(got).toContain('swiftFound');
  });
  it('Wechsel im nächsten Wachstumstakt nach der Schwelle zählt nicht', () => {
    // Gewinn fällt nur auf Wachstumstakte; der nächste liegt ein GROWTH_INTERVAL später.
    const got = swiftAfter(HONOR_SWIFT_CITIZEN_TICK + GROWTH_INTERVAL - 1);
    expect(got).toContain('citizenTown');
    expect(got).not.toContain('swiftFound');
  });
});

describe('AK-EB-06 Beobachten ändert die Welt nicht', () => {
  it('1000 Schritte frische Welt bitgleich', () => {
    const a = createWorld(S);
    const b = createWorld(S);
    const t = createHonorTracker(a);
    for (let i = 0; i < 1000; i++) {
      step(a);
      t.observe(a, runOf(a));
      step(b);
    }
    expect(serialize(a)).toBe(serialize(b));
  });

  it('Szenario über den Treffer bitgleich', () => {
    const a = kurz();
    const b = kurz();
    const t = createHonorTracker(a);
    const got: HonorId[] = [];
    for (let i = 0; i < 200 && !(a.won && b.won); i++) {
      step(a);
      got.push(...t.observe(a, runOf(a)));
      step(b);
    }
    expect(got).toContain('citizenTown');
    expect(serialize(a)).toBe(serialize(b));
  });
});

describe('AK-EB-04 launchRun', () => {
  const stored: HonorRun = { seed: 5, unlockMode: 'all' };
  it('Menü «Neue Insel» schreibt einen neuen Merker', () => {
    expect(launchRun({ loaded: false, intro: false }, stored, 9, 'stepwise')).toEqual({
      run: { seed: 9, unlockMode: 'stepwise' },
      write: true,
    });
  });
  it('Laden behält den gespeicherten Merker, ohne Schreiben', () => {
    expect(launchRun({ loaded: true, intro: false }, stored, 9, 'stepwise')).toEqual({
      run: stored,
      write: false,
    });
  });
  it('Seitenstart nimmt den gespeicherten Merker, ohne Schreiben', () => {
    expect(launchRun({ loaded: false, intro: true }, stored, 9, 'stepwise')).toEqual({
      run: stored,
      write: false,
    });
  });
  it('Seitenstart ohne gespeicherten Merker liefert null', () => {
    expect(launchRun({ loaded: false, intro: true }, null, 9, 'stepwise')).toEqual({
      run: null,
      write: false,
    });
  });
});
