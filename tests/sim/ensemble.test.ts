import { describe, expect, it } from 'vitest';
import { serialize } from '../../src/sim/save';
import { createWorld } from '../../src/sim/world';
import { runColony, startColony, type ColonyOptions } from './controller';

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
