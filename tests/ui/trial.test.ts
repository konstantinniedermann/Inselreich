// I-132 T03: reine UI-Helfer der Meisterprüfung (AK 15, 16, 17).
import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { startTrial } from '../../src/sim/trial';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { goodsBalance } from '../../src/sim/flow';
import { serialize } from '../../src/sim/save';
import type { TrialState, World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { perMinute } from '../../src/ui/time';
import {
  TRIAL_ABORT_MESSAGE,
  TRIAL_FIRE_HINT,
  selfSupplyPreview,
  selfSupplyText,
  trialCardView,
  trialChip,
  trialChronicleLine,
  trialStartMessage,
  trialStartReason,
  trialTransition,
} from '../../src/ui/trial';
import { putBuilding, twoIslandWorld } from '../sim/helpers';

// Test-Schalter: überschreibt die Bilanz eines Guts, sonst echte Bilanz.
const balanceOverride = vi.hoisted(() => ({ spice: null as number | null }));
vi.mock('../../src/sim/flow', async (orig) => {
  const actual = await orig<typeof import('../../src/sim/flow')>();
  return {
    ...actual,
    goodsBalance: (...args: Parameters<typeof actual.goodsBalance>) => {
      const b = actual.goodsBalance(...args);
      if (balanceOverride.spice !== null) b.spice = { ...b.spice, net: balanceOverride.spice };
      return b;
    },
  };
});

function worldWith(trial: Partial<TrialState> = {}, done = true): World {
  const w = createWorld(3);
  w.monumentDone = done;
  w.trial = { active: null, ticks: 0, e0: 0, passed: [], ...trial };
  return w;
}

/** `count` Kaufmannshäuser (Stufe 4, je 20 Einwohner) auf `island`, im Kontor-Bereich. */
function addHouses(w: World, island: number, count: number): void {
  const k = w.buildings[w.islands[island]!.kontorId ?? -1]!;
  for (let i = 0; i < count; i++) {
    const h = putBuilding(w, island, 'house', k.x + 3 + i * 2, k.y);
    h.house!.tier = 4;
    h.house!.inhabitants = 20;
  }
}

function merchantWorld(n: number): World {
  const w = worldWith();
  const k = w.buildings[w.islands[0]!.kontorId ?? -1]!;
  let left = n;
  for (let i = 0; left > 0; i++) {
    const h = putBuilding(w, 0, 'house', k.x + 3 + (i % 10) * 2, k.y + Math.floor(i / 10) * 2);
    h.house!.tier = 4;
    h.house!.inhabitants = Math.min(20, left);
    left -= h.house!.inhabitants;
  }
  return w;
}

describe('AK-15 trialChip', () => {
  it('ohne Denkmal null, sonst offen', () => {
    expect(trialChip(worldWith({}, false))).toBeNull();
    const c = trialChip(worldWith())!;
    expect(c.chip).toBe('Meisterprüfung');
    expect(c.fillPct).toBe(0);
    expect(c.title).toBe('Meisterprüfung: freiwillige Auflage — Klick für Details');
  });
  it('aktiv', () => {
    const c = trialChip(worldWith({ active: 'selfSupply', ticks: 2000, e0: 75 }))!;
    expect(c.chip).toBe('Eigenversorgung 3:20 / 15:00');
    expect(c.fillPct).toBe(22);
    expect(c.title).toBe(
      'Meisterprüfung Eigenversorgung: Einwohner nicht unter 70 % von 75 — Klick für Details',
    );
  });
  it('bestanden; aktiv hat Vorrang', () => {
    const passed = [{ id: 'selfSupply' as const, tick: 30000 }];
    const c = trialChip(worldWith({ passed }))!;
    expect(c.chip).toBe('Meisterprüfung ✓');
    expect(c.fillPct).toBe(100);
    expect(c.title).toBe('Meisterprüfung bestanden: Eigenversorgung');
    const a = trialChip(worldWith({ passed, active: 'selfSupply', ticks: 2000, e0: 75 }))!;
    expect(a.chip).toBe('Eigenversorgung 3:20 / 15:00');
  });
});

describe('AK-16 selfSupplyPreview', () => {
  it('neue Welt: leer, Text', () => {
    const w = worldWith();
    expect(selfSupplyPreview(w)).toEqual([]);
    expect(selfSupplyText([])).toBe('Deine Ketten decken den Bedarf');
  });
  it('drei Kaufmannshäuser: fünf Bedarfsgüter in GOOD_IDS-Reihenfolge', () => {
    const w = worldWith();
    addHouses(w, 0, 3);
    const lines = selfSupplyPreview(w);
    const bal = goodsBalance(w, 0);
    const expected = GOOD_IDS.filter((g) => bal[g].net < -1e-9);
    expect(expected).toEqual(['food', 'cloth', 'rum', 'glass', 'spice']);
    expect(lines.map((l) => l.good)).toEqual(expected);
    for (const l of lines) {
      expect(l.perMin).toBe(perMinute(bal[l.good].net, 100));
      expect(l.perMin).toBeLessThan(0);
    }
    expect(lines.find((l) => l.good === 'spice')!.perMin).toBe(-36);
    expect(selfSupplyText(lines)).toContain('Gewürz −36 / min');
  });
  it('Erzeuger-Überschuss: Gut fehlt in der Liste', () => {
    const w = worldWith();
    addHouses(w, 0, 3);
    const k = w.buildings[w.islands[0]!.kontorId ?? -1]!;
    for (let i = 0; i < 12; i++) putBuilding(w, 0, 'spicefarm', k.x - 12 + i * 3, k.y + 6);
    expect(goodsBalance(w, 0).spice.net).toBeGreaterThanOrEqual(0);
    expect(selfSupplyPreview(w).map((l) => l.good)).not.toContain('spice');
  });
  it('zwei Inseln: Summe beider', () => {
    const w = twoIslandWorld();
    w.monumentDone = true;
    addHouses(w, 0, 3);
    const one = selfSupplyPreview(w).find((l) => l.good === 'spice')!.perMin;
    addHouses(w, 1, 3);
    const both = selfSupplyPreview(w).find((l) => l.good === 'spice')!.perMin;
    expect(both).toBe(one * 2);
  });
  it('Text: Komma-getrennt', () => {
    expect(
      selfSupplyText([
        { good: 'spice', perMin: -36 },
        { good: 'stone', perMin: -36 },
      ]),
    ).toBe('Gewürz −36 / min, Stein −36 / min');
  });
});

describe('AK-17 trialStartReason', () => {
  const reason = (w: World): string | null => {
    const before = serialize(w);
    const r = trialStartReason(w);
    expect(serialize(w)).toBe(before);
    return r;
  };
  it('Grundfälle wörtlich', () => {
    expect(reason(worldWith({}, false))).toBe('Erst nach dem Wahlziel (Denkmal)');
    expect(reason(worldWith({ active: 'selfSupply' }))).toBe('Eine Auflage läuft schon');
    expect(reason(worldWith({ passed: [{ id: 'selfSupply', tick: 1 }] }))).toBe(
      'Bereits bestanden',
    );
    const m = merchantWorld(60);
    m.money = -1;
    expect(reason(m)).toBe('Kasse im Minus');
    expect(reason(merchantWorld(59))).toBe('Erst ab 60 Kaufleuten (jetzt 59)');
    expect(reason(merchantWorld(151))).toBe('Höchstens 150 Kaufleute (jetzt 151)');
    expect(reason(merchantWorld(60))).toBeNull();
  });
});

describe('AK-17 Abgleich mit startTrial', () => {
  it('Grund gleich startTrial-Grund, null bei ok', () => {
    const m = merchantWorld(60);
    m.money = -1;
    const cases = [
      worldWith({}, false),
      worldWith({ active: 'selfSupply' }),
      worldWith({ passed: [{ id: 'selfSupply', tick: 1 }] }),
      m,
      merchantWorld(59),
      merchantWorld(151),
      merchantWorld(60),
    ];
    for (const w of cases) {
      const r = startTrial(structuredClone(w), 'selfSupply');
      expect(trialStartReason(w)).toBe(r.ok ? null : r.reason);
    }
  });
});

describe('Vorschau-Rundung', () => {
  it('Fehlmenge, die auf -0 / min rundet, erscheint nie', () => {
    balanceOverride.spice = -1e-6;
    try {
      const w = worldWith();
      expect(selfSupplyPreview(w).map((l) => l.good)).not.toContain('spice');
      expect(selfSupplyText(selfSupplyPreview(w))).not.toMatch(/[−-]0 \/ min/);
    } finally {
      balanceOverride.spice = null;
    }
  });
});

describe('trialChronicleLine', () => {
  it('Zustände', () => {
    expect(trialChronicleLine(worldWith({}, false))).toBeNull();
    expect(trialChronicleLine(worldWith())).toBe('Meisterprüfung: offen');
    expect(trialChronicleLine(worldWith({ active: 'selfSupply', ticks: 2000, e0: 75 }))).toBe(
      'Meisterprüfung: Eigenversorgung läuft (3:20 / 15:00)',
    );
    expect(trialChronicleLine(worldWith({ passed: [{ id: 'selfSupply', tick: 30000 }] }))).toBe(
      'Meisterprüfung: Eigenversorgung bestanden (bei Spielzeit 50:00)',
    );
  });
});

describe('trialTransition', () => {
  const run: TrialState = { active: 'selfSupply', ticks: 100, e0: 75, passed: [] };
  const idle: TrialState = { active: null, ticks: 0, e0: 0, passed: [] };
  it('Laden: prev null', () => {
    expect(trialTransition(null, run)).toBeNull();
  });
  it('bestanden und nicht bestanden', () => {
    const done = { ...idle, passed: [{ id: 'selfSupply' as const, tick: 9 }] };
    expect(trialTransition(run, done)).toBe('Meisterprüfung bestanden: Eigenversorgung');
    expect(trialTransition(run, idle)).toBe(
      'Meisterprüfung Eigenversorgung nicht bestanden: Einwohner unter 70 %',
    );
  });
  it('Start, gleich: null', () => {
    expect(trialTransition(idle, run)).toBeNull();
    expect(trialTransition(run, run)).toBeNull();
    expect(trialTransition(idle, idle)).toBeNull();
  });
});

describe('Meldungen und Karte', () => {
  it('feste Texte', () => {
    expect(trialStartMessage()).toBe(
      'Meisterprüfung begonnen: Eigenversorgung — 15:00 ohne Zukauf',
    );
    expect(TRIAL_ABORT_MESSAGE).toBe('Meisterprüfung abgebrochen');
    expect(TRIAL_FIRE_HINT).toBe('Feuerwachen schützen Kapelle, Schule und Bad');
  });
  it('trialCardView', () => {
    const prev = [{ good: 'spice' as const, perMin: -36 }];
    const open = trialCardView(merchantWorld(60), prev);
    expect(open.name).toBe('Eigenversorgung');
    expect(open.condition).toBe('15 Minuten, Einwohner nicht unter 70 % des Starts');
    expect(open.preview).toBe('Gewürz −36 / min');
    expect(open.fireHint).toBe(TRIAL_FIRE_HINT);
    expect(open.status).toBeNull();
    expect(open.action).toEqual({ kind: 'start', reason: null });
    expect(trialCardView(worldWith(), []).action).toEqual({
      kind: 'start',
      reason: 'Erst ab 60 Kaufleuten (jetzt 0)',
    });
    const run = trialCardView(worldWith({ active: 'selfSupply', ticks: 2000, e0: 75 }), []);
    expect(run.action).toEqual({ kind: 'abort' });
    expect(run.status).toBe('Läuft: 3:20 / 15:00 · Einwohner 0 von 75');
    const ok = trialCardView(worldWith({ passed: [{ id: 'selfSupply', tick: 30000 }] }), []);
    expect(ok.action).toEqual({ kind: 'none' });
    expect(ok.status).toBe('Bestanden (bei Spielzeit 50:00)');
  });
  it('Literal-Scan', () => {
    expect(readFileSync('src/ui/trial.ts', 'utf8')).not.toMatch(/\b(9000|150|70|60)\b/);
  });
});
