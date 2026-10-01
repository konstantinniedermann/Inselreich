import { describe, expect, it } from 'vitest';
import { serialize } from '../../src/sim/save';
import { createWorld } from '../../src/sim/world';
import { buildColony } from './controller';

/** FNV-1a, 32 Bit, über die UTF-16-Codeeinheiten (Test-Helfer, keine Abhängigkeit). */
function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/** Endwelt ohne die M6-Felder (Spec 15): `version` 2, `crisisLevel` und `crisis` entfernt. */
function normalized(json: string): string {
  const raw = JSON.parse(json) as Record<string, unknown>;
  raw.version = 2;
  delete raw.crisisLevel;
  delete raw.crisis;
  return JSON.stringify(raw);
}

// `off`-Referenz, gemessen auf dem Code vor M6-S1: main 3fcb678 in .worktrees/m6-balance
// (Plan M6-Sim, Task 1b/2). Vorabmessung im Plan (main 3f66ddd) identisch.
const OFF_REFERENCE = {
  firstSettler: 350,
  firstCitizen: 3850,
  winTick: 6050,
  minMoney: 57,
  endMoney: 212,
  buildings: {
    kontor: 1,
    house: 4,
    lumberjack: 2,
    fisher: 10,
    chapel: 1,
    sheepfarm: 5,
    weaver: 5,
    school: 1,
    canefarm: 3,
    distillery: 3,
  },
};
const OFF_FINGERPRINT = 0xbfeac8c6; // Referenz Plan-Vorabmessung, bestätigt in Task 2

describe('M6 Krisen-Lauf', () => {
  it('AK-B1-02 Stufe off: Laufdaten und Fingerabdruck der normalisierten Endwelt wie vor M6', () => {
    const w = createWorld(3);
    const t = buildColony(w);
    const fp = fnv1a32(normalized(serialize(w)));
    if (import.meta.env.VITE_BALANCE_LOG)
      console.log({ level: 'off', ...t, fingerprint: `0x${fp.toString(16).padStart(8, '0')}` });
    expect(t).toEqual(OFF_REFERENCE);
    expect(fp).toBe(OFF_FINGERPRINT);
  });
});
