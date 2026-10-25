import { describe, expect, it, vi } from 'vitest';
import { runningLevel } from '../../src/sim/levelRules';
import { createWorld } from '../../src/sim/world';
import { putBuilding } from './helpers';

vi.mock('../../src/sim/defs/levels', async (orig) => ({
  ...(await orig<typeof import('../../src/sim/defs/levels')>()),
  WORKFORCE_RADIUS: 7,
}));

describe('AK-AL-46 Radius kommt aus den Defs', () => {
  it('Siedlerhaus im Abstand 8: mit Radius 7 gibt Fischer g 2 k 1 (echter Wert 8: k 2)', () => {
    const w = createWorld(3, { unlockAll: true, crisisLevel: 'off' });
    const f = putBuilding(w, 0, 'fisher', 20, 20);
    f.level = 2;
    putBuilding(w, 0, 'house', 28, 20).house!.tier = 2;
    expect(runningLevel(w, f)).toBe(1);
  });
});
