import { describe, expect, it } from 'vitest';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { createWorld } from '../../src/sim/world';
import { boomGood } from '../../src/ui/trade';

describe('boomGood (Marke nur am Boom-Gut)', () => {
  it('trifft genau das Boom-Gut, nach dem Boom keines', () => {
    const w = createWorld(3);
    w.crisis = { period: 0, kind: 'boom', from: 0, until: 300, good: 'wood' };
    expect(GOOD_IDS.filter((g) => boomGood(w, g))).toEqual(['wood']);
    w.crisis = { period: 0, kind: 'storm', from: 0, until: 300 };
    expect(GOOD_IDS.filter((g) => boomGood(w, g))).toEqual([]);
    w.crisis = null;
    expect(GOOD_IDS.filter((g) => boomGood(w, g))).toEqual([]);
  });
});
