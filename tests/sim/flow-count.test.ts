import { describe, expect, it, vi } from 'vitest';

const calls = { goodsBalance: 0 };
vi.mock('../../src/sim/flow', async (orig) => {
  const m = await orig<typeof import('../../src/sim/flow')>();
  return {
    ...m,
    goodsBalance: (w: Parameters<typeof m.goodsBalance>[0]) => {
      calls.goodsBalance++;
      return m.goodsBalance(w);
    },
  };
});

import { step } from '../../src/sim/tick';
import { village } from './helpers';

describe('M11 Budget je Wachstumstakt (Review Focus 3)', () => {
  it('RF-3 tickPopulation rechnet goodsBalance genau einmal je Wachstumstakt, dazwischen nie', () => {
    const { w } = village(3, { unlockAll: true });
    for (let t = 1; t <= 200; t++) {
      const before = calls.goodsBalance;
      step(w);
      expect(calls.goodsBalance - before, `Tick ${t}`).toBe(t % 50 === 0 ? 1 : 0);
    }
  });
});
