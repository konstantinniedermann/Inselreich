import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PAUSED_UPKEEP_PCT } from '../../src/sim/defs/buildings';
import { createWorld } from '../../src/sim/world';
import { stateInfo } from '../../src/ui/texts';
import type { Building } from '../../src/sim/types';

const EXPECTED = `Stillgelegt — Unterhalt auf ${PAUSED_UPKEEP_PCT} % (aufgerundet)`;
const fisher = (extra: Partial<Building>): Building => ({
  id: 1,
  defId: 'fisher',
  x: 0,
  y: 0,
  connected: true,
  progress: 0,
  state: 'ok',
  island: 0,
  ...extra,
});

describe('AK-UT-01/02 Stilllegen-Text', () => {
  const w = createWorld(3, { unlockAll: true });
  it('beide Pfade liefern den Wortlaut aus der Def', () => {
    expect(stateInfo(fisher({ paused: true }), w.tick)).toEqual({ text: EXPECTED, ok: false });
    expect(stateInfo(fisher({ state: 'paused' }), w.tick)).toEqual({ text: EXPECTED, ok: false });
  });
  it('kein «halber» im UI-Quelltext', () => {
    const dir = 'src/ui/';
    for (const f of readdirSync(dir).filter((n) => n.endsWith('.ts'))) {
      expect(readFileSync(dir + f, 'utf8'), f).not.toContain('halber');
    }
  });
});
