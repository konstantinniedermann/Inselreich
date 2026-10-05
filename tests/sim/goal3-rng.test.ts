import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls = vi.hoisted(() => ({ n: 0 }));
vi.mock('../../src/sim/rng', async (importOriginal) => {
  const orig = await importOriginal<typeof import('../../src/sim/rng')>();
  return {
    ...orig,
    createRng: (...args: Parameters<typeof orig.createRng>) => {
      calls.n += 1;
      return orig.createRng(...args);
    },
  };
});

import { spiceLoop, spiceMerchants } from '../../src/sim/goal3';
import { checkWin } from '../../src/sim/tick';
import { spiceGoalScenario } from './scenariosSea';

describe('M12 Z3 ohne Zufall (qa-B4)', () => {
  beforeEach(() => {
    calls.n = 0;
  });

  it('AK-Z3-08 checkWin, spiceMerchants, spiceLoop rufen createRng nie auf', () => {
    const w = spiceGoalScenario();
    calls.n = 0; // Aufbau des Szenarios zählt nicht
    for (let i = 0; i < 100; i++) {
      checkWin(w);
      spiceMerchants(w);
      spiceLoop(w);
    }
    expect(calls.n).toBe(0);
  });

  it('AK-Z3-08 goal3.ts enthält kein createRng', () => {
    const src = readFileSync('src/sim/goal3.ts', 'utf8');
    expect(src.split('createRng').length - 1).toBe(0);
  });
});
