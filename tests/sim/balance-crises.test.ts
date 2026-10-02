import { describe, expect, it } from 'vitest';
import { TIERS } from '../../src/sim/defs/tiers';
import { deserialize, serialize } from '../../src/sim/save';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import {
  buildColony,
  layoutFor,
  MAX_TICKS,
  runColony,
  startColony,
  type ColonyOptions,
} from './controller';

/** FNV-1a, 32 Bit, über die UTF-16-Codeeinheiten (Test-Helfer, keine Abhängigkeit). */
function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Endwelt ohne die M6-Felder (Spec 15): `version` 2, `crisisLevel` und `crisis` entfernt; ohne die M8-Felder
 * (M8-Spec 16.1): `stock.glass`, `sellPct.glass`, `wonMerchants` und je Haus `services.bath` entfernt.
 */
function normalized(json: string): string {
  const raw = JSON.parse(json) as Record<string, unknown>;
  raw.version = 2;
  delete raw.crisisLevel;
  delete raw.crisis;
  delete (raw.stock as Record<string, unknown>).glass;
  delete (raw.sellPct as Record<string, unknown>).glass;
  delete raw.wonMerchants;
  for (const b of Object.values(raw.buildings as Record<string, Record<string, unknown>>)) {
    const house = b.house as { services: Record<string, unknown> } | undefined;
    if (house) delete house.services.bath;
  }
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

const CRISIS_WIN_STOP = 8000; // Spec 15: Stopp-Schwelle Krisen-Lauf (R102)
const NORMAL: ColonyOptions = { fireStation: true };

interface CrisisCount {
  fires: number;
  extinguished: number;
  misses: number;
  storms: number;
  booms: number;
}
/** Zählt jede Krise einmal (bei ihrem ersten Auftreten); als `stop`, das nie anhält. */
function counter(): { c: CrisisCount; see: (w: World) => boolean } {
  const c: CrisisCount = { fires: 0, extinguished: 0, misses: 0, storms: 0, booms: 0 };
  let last = -1;
  const see = (w: World): boolean => {
    const k = w.crisis;
    if (k !== null && k.period !== last) {
      last = k.period;
      if (k.kind === 'fire') {
        c.fires += 1;
        if (k.outcome === 'extinguished') c.extinguished += 1;
        if (k.outcome === 'miss') c.misses += 1;
      } else if (k.kind === 'storm') c.storms += 1;
      else c.booms += 1;
    }
    return false;
  };
  return { c, see };
}

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

  it.each([
    ['normal', NORMAL],
    ['mild', {}],
  ] as const)('AK-B2-01 Krisen-Lauf %s: Sieg ≤ 9000, Geld > 0, won', (level, opts) => {
    const w = createWorld(3, { crisisLevel: level });
    const { layout, t } = startColony(w);
    const { c, see } = counter();
    expect(runColony(w, layout, t, opts, see)).toBe(false);
    const hit = c.fires === 0 ? null : (c.fires - c.misses) / c.fires;
    if (import.meta.env.VITE_BALANCE_LOG) console.log({ level, ...t, ...c, hitRate: hit }); // AK-B2-02
    expect(w.won).toBe(true);
    expect(t.winTick).not.toBeNull();
    expect(t.winTick!).toBeLessThanOrEqual(MAX_TICKS);
    expect(t.winTick!).toBeLessThanOrEqual(CRISIS_WIN_STOP);
    expect(w.money).toBeGreaterThan(0);
  });

  /** Lauf mit Halt bei `stop`, Speichern/Laden, Fortsetzen ab geladenem Stand (Layout aus dem Kontor). */
  function reloaded(stop: (w: World) => boolean): { w: World; winTick: number | null; at: number } {
    let w = createWorld(3, { crisisLevel: 'normal' });
    const { layout, t } = startColony(w);
    expect(runColony(w, layout, t, NORMAL, stop)).toBe(true);
    const at = w.tick;
    const r = deserialize(serialize(w));
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error(r.reason);
    w = r.world;
    expect(runColony(w, layoutFor(w), t, NORMAL)).toBe(false);
    return { w, winTick: t.winTick, at };
  }

  it('AK-B2-05 Laden mitten im Brand: gleicher Endzustand, gleicher Sieg-Tick', () => {
    const a = createWorld(3, { crisisLevel: 'normal' });
    const ta = buildColony(a, NORMAL);
    const b = reloaded((w) => Object.values(w.buildings).some((x) => x.state === 'burning'));
    if (import.meta.env.VITE_BALANCE_LOG) console.log({ reloadAtBurning: b.at });
    expect(serialize(b.w)).toBe(serialize(a));
    expect(b.winTick).toBe(ta.winTick);
  });

  it('AK-B2-06 Laden mitten im Sturm (aktiv, Seed 3: Tick 2601): gleicher Endzustand, gleicher Sieg-Tick', () => {
    const a = createWorld(3, { crisisLevel: 'normal' });
    const ta = buildColony(a, NORMAL);
    const b = reloaded((w) => w.crisis?.kind === 'storm' && w.tick >= w.crisis.from);
    expect(b.at).toBe(2601);
    expect(serialize(b.w)).toBe(serialize(a));
    expect(b.winTick).toBe(ta.winTick);
  });
});

describe('M8 Fingerabdruck (AK-S1-15)', () => {
  it('AK-S1-15 Stufe off bitgleich bis auf die M8-Felder: Sieg 6050, minMoney 57, Fingerabdruck, Hebel null', () => {
    expect(TIERS[4].unlockCitizens).toBeNull();
    const w = createWorld(3);
    const t = buildColony(w);
    expect(t.winTick).toBe(6050);
    expect(t.minMoney).toBe(57);
    expect(w.stock.glass).toBe(0);
    expect(w.wonMerchants).toBe(false);
    expect(fnv1a32(normalized(serialize(w)))).toBe(OFF_FINGERPRINT);
  });
});
