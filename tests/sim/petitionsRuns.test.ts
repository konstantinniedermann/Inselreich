import { describe, expect, it, vi } from 'vitest';
import { answerPetition } from '../../src/sim/petitions';
import { petitionRng } from '../../src/sim/petitionRng';
import { houseCap } from '../../src/sim/population';
import { serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { runColony, startColony } from './controller';

vi.mock('../../src/sim/petitionRng', async (orig) => {
  const m = await orig<typeof import('../../src/sim/petitionRng')>();
  return { petitionRng: vi.fn(m.petitionRng) };
});

const WON_AT = 100;

interface Draw {
  drawnAt: number;
  id: string;
  amount: number;
  anchor?: number;
}

/** Setzt `won` bei WON_AT, antwortet im Tick nach dem Ziehen Ja (wenn ok) sonst Nein, hält die Folge fest. */
function recorder(draws: Draw[], answer: boolean): (w: World) => boolean {
  const seen = new Set<number>();
  return (w) => {
    if (w.tick === WON_AT) w.won = true;
    if (!answer) return false;
    for (const m of w.petitions.open) {
      if (m.answer !== undefined || seen.has(m.drawnAt) || w.tick <= m.drawnAt) continue;
      seen.add(m.drawnAt);
      draws.push({ drawnAt: m.drawnAt, id: m.id, amount: m.amount, anchor: m.anchor });
      if (!answerPetition(w, m.drawnAt, 'yes').ok) answerPetition(w, m.drawnAt, 'no');
    }
    return false;
  };
}

function play(w: World, until: number, see: (w: World) => boolean): void {
  const { layout, t } = startColony(w);
  runColony(w, layout, t, {}, see);
  while (w.tick < until) {
    step(w);
    see(w);
  }
}

describe('AK-BS-01 Strom', () => {
  it('Baseline (aus): kein Aufruf des Stroms, petitions unverändert über 20 000 T', () => {
    const w = createWorld(3);
    const start = JSON.stringify(w.petitions);
    const see = (x: World): boolean => {
      expect(JSON.stringify(x.petitions)).toBe(start);
      return false;
    };
    vi.mocked(petitionRng).mockClear();
    play(w, 20_000, see);
    expect(w.won).toBe(true);
    expect(petitionRng).toHaveBeenCalledTimes(0);
  });
});

describe('AK-BS-03 Folge', () => {
  it('gleicher Seed, gleiche Antworten: gleiche Folge und gleiches serialize', () => {
    const run = (): { draws: Draw[]; s: string } => {
      const w = createWorld(3, { petitionsOn: true });
      const draws: Draw[] = [];
      play(w, 30_000, recorder(draws, true));
      return { draws, s: serialize(w) };
    };
    const a = run();
    const b = run();
    expect(a.draws.length).toBeGreaterThan(0);
    expect(b.draws).toEqual(a.draws);
    expect(b.s).toBe(a.s);
  }, 30_000);
  it('eigener Strom: Krisenfolge mit Bittschriften an gleich der mit aus', () => {
    const crises = (on: boolean): string[] => {
      const w = createWorld(3, { crisisLevel: 'normal', petitionsOn: on });
      const out: string[] = [];
      let last = -1;
      const base = recorder([], false);
      play(w, 12_000, (x) => {
        if (x.crisis !== null && x.crisis.from !== last) {
          last = x.crisis.from;
          out.push(`${x.crisis.from}:${x.crisis.kind}`);
        }
        return base(x);
      });
      return out;
    };
    const off = crises(false);
    expect(off.length).toBeGreaterThan(0);
    expect(crises(true)).toEqual(off);
  });
});

describe('AK-BS-10 60 000 T', () => {
  it('Ja auf jede Bitte: nie ein Haus über cap plus 15 Prozent, Überbelegung kommt vor', () => {
    const w = createWorld(3, { petitionsOn: true });
    const base = recorder([], true);
    let over = 0;
    const see = (x: World): boolean => {
      base(x);
      for (const b of Object.values(x.buildings)) {
        if (!b.house) continue;
        const cap = houseCap(x, b.house);
        const max = cap + Math.floor((cap * 15 + 50) / 100);
        expect(b.house.inhabitants, `Tick ${x.tick} Haus ${b.id}`).toBeLessThanOrEqual(max);
        if (b.house.inhabitants > cap) over++;
      }
      return false;
    };
    play(w, 60_000, see);
    expect(over).toBeGreaterThan(0);
  }, 30_000);
});
