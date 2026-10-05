import { describe, expect, it } from 'vitest';
import { TIERS } from '../../src/sim/defs/tiers';
import { deserialize, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import {
  buildColony,
  layoutFor,
  MAX_TICKS,
  runColony,
  startColony,
  WIN_TICK_LIMIT,
  type ColonyOptions,
} from './controller';
import { RANDOM_SEQUENCE } from './e0Pins';
import { randomSequence } from './fixtureV6';
import { fnv1a32 } from './helpers';

/**
 * Endwelt ohne die M6-Felder (Spec 15): `version` 2, `crisisLevel` und `crisis` entfernt; ohne die M8-Felder
 * (M8-Spec 16.1): `stock.glass`, `sellPct.glass`, `wonMerchants` und je Haus `services.bath` entfernt.
 * M11 (Anhang 02 B): zusätzlich `taxCarry`, `upkeepCarry` und je Gebäude `eff`, `level` entfernt.
 */
function normalized(json: string): string {
  const raw = JSON.parse(json) as Record<string, unknown>;
  raw.version = 2;
  delete raw.crisisLevel;
  delete raw.crisis;
  delete (raw.stock as Record<string, unknown>).glass;
  delete (raw.sellPct as Record<string, unknown>).glass;
  delete raw.wonMerchants;
  delete raw.unlocked;
  delete raw.goodLocks;
  delete raw.upgradeStops;
  delete raw.taxCarry;
  delete raw.upkeepCarry;
  for (const b of Object.values(raw.buildings as Record<string, Record<string, unknown>>)) {
    delete b.eff;
    delete b.level;
    const house = b.house as { services: Record<string, unknown> } | undefined;
    if (house) delete house.services.bath;
  }
  return JSON.stringify(raw);
}

// `off`-Referenz. M11 R185/R187, gemessen auf 7363cb0 (T02) mit
// `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance-crises.test.ts --silent=false`;
// vorher 3850/6050/57/212, `0xbfeac8c6`; Richtwert Anhang 03: `0x701c6da5`.
const OFF_REFERENCE = {
  firstSettler: 350,
  firstCitizen: 4150,
  winTick: 6750,
  minMoney: 117,
  endMoney: 339,
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
const OFF_FINGERPRINT = 0x701c6da5; // M11 (M-06), normalized() mit M11-Feldern (Anhang 02 B)

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
  it('AK-B1-02 Stufe off: Laufdaten und Fingerabdruck der normalisierten Endwelt wie vor M6 (M11 S10)', () => {
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
  it('AK-S1-15 Stufe off bitgleich bis auf die M8-Felder: Sieg 6750, minMoney 117, Fingerabdruck, Hebel null (M11 S10)', () => {
    expect(TIERS[4].unlockCitizens).toBeNull();
    const w = createWorld(3);
    const t = buildColony(w);
    expect(t.winTick).toBe(6750);
    expect(t.minMoney).toBe(117);
    expect(home(w).stock.glass).toBe(0);
    expect(w.wonMerchants).toBe(false);
    expect(fnv1a32(normalized(serialize(w)))).toBe(OFF_FINGERPRINT);
  });
});

// M11 R185/R187, gemessen auf 7363cb0 mit `VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance --silent=false`
const M11_REF = {
  firstSettler: 350,
  firstCitizen: 4150,
  winTick: 6750,
  minMoney: 117,
  endMoney: 339,
}; // M-01…M-04

describe('M11 Baseline (Spec 6, 14)', () => {
  it('AK-BAS-01 Referenz off: Sieg 6750, minMoney 117, endMoney 339, Siedler/Bürger 350/4150; zwei Läufe gleich', () => {
    const [a, b] = [createWorld(3), createWorld(3)];
    expect(buildColony(a)).toMatchObject(M11_REF);
    buildColony(b);
    expect(serialize(a)).toBe(serialize(b));
  });
  it('AK-BAS-02 Schwellen: Sieg ≤ 7500 und Geld > 0; normal + Feuerwache 7850 ≤ 8000; mild 7850', () => {
    const r = createWorld(3);
    expect(buildColony(r).winTick!).toBeLessThanOrEqual(WIN_TICK_LIMIT);
    expect(r.money).toBeGreaterThan(0);
    const n = createWorld(3, { crisisLevel: 'normal' });
    const tn = buildColony(n, NORMAL);
    expect([tn.winTick, tn.winTick! <= CRISIS_WIN_STOP, n.money > 0]).toEqual([7850, true, true]);
    const m = createWorld(3, { crisisLevel: 'mild' });
    expect([buildColony(m).winTick, m.money > 0]).toEqual([7850, true]);
  });
  it('AK-BAS-04 normalized() entfernt taxCarry, upkeepCarry und je Gebäude eff, level', () => {
    const w = createWorld(3);
    Object.assign(w, { taxCarry: 5, upkeepCarry: 7 });
    Object.assign(w.buildings[home(w).kontorId]!, { eff: 1000, level: 2 });
    const raw = JSON.parse(normalized(serialize(w))) as Record<string, unknown>;
    expect('taxCarry' in raw || 'upkeepCarry' in raw).toBe(false);
    for (const b of Object.values(raw.buildings as Record<string, Record<string, unknown>>))
      expect('eff' in b || 'level' in b).toBe(false);
  });
  it('AK-BAS-07 Gebäudezahlen (M-05) und Fingerabdruck (M-06) neu gemessen und gepinnt', () => {
    const w = createWorld(3);
    expect(buildColony(w).buildings).toEqual(OFF_REFERENCE.buildings);
    expect(fnv1a32(normalized(serialize(w)))).toBe(OFF_FINGERPRINT);
  });
  it('AK-SAV-03 Zwilling mit taxCarry 12 345, upkeepCarry 67: Laden, 300 Schritte, serialize gleich', () => {
    const w = createWorld(3, { crisisLevel: 'normal' });
    const { layout, t } = startColony(w);
    expect(runColony(w, layout, t, NORMAL, (x) => x.tick >= 2601)).toBe(true);
    Object.assign(w, { taxCarry: 12345, upkeepCarry: 67 });
    const r = deserialize(serialize(w));
    if (!r.ok) throw new Error(r.reason);
    for (let i = 0; i < 300; i++) {
      step(w);
      step(r.world);
    }
    expect(serialize(r.world)).toBe(serialize(w));
  });
});

describe('M12 E0 Zufallsfolge', () => {
  it('AK-E0-19 Krisen und Aufträge im Lauf normal bis zum Sieg bleiben bitgleich', () => {
    expect(randomSequence()).toEqual(RANDOM_SEQUENCE);
  });
});
