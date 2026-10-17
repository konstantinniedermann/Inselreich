// I-132 T01: Auflagen-Defs, Weltfeld `trial`, Leser (AK 1, 2 Gründe, 13).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WIN_MERCHANTS } from '../../src/sim/defs/tiers';
import {
  TRIALS,
  TRIAL_DURATION_TICKS,
  TRIAL_FAIL_POP_PCT,
  TRIAL_MAX_MERCHANTS,
  TRIAL_MIN_MERCHANTS,
} from '../../src/sim/defs/trials';
import { serialize } from '../../src/sim/save';
import { trialBuyBlock, trialPopulation, trialStartBlock } from '../../src/sim/trial';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { putBuilding } from './helpers';

const START = { active: null, ticks: 0, e0: 0, passed: [] };

/** Welt mit Denkmal und genau `n` Kaufleuten (Häuser Stufe 4, je höchstens 20 Einwohner). */
function merchantWorld(n: number): World {
  const w = createWorld(3);
  w.monumentDone = true;
  const k = w.buildings[w.islands[0]!.kontorId ?? -1];
  let left = n;
  for (let i = 0; left > 0; i++) {
    const h = putBuilding(
      w,
      0,
      'house',
      (k?.x ?? 3) + 3 + (i % 10) * 2,
      (k?.y ?? 3) + Math.floor(i / 10) * 2,
    );
    h.house!.tier = 4;
    h.house!.inhabitants = Math.min(20, left);
    left -= h.house!.inhabitants;
  }
  return w;
}

describe('AK-1 neue Welt', () => {
  it('trial hat Startwerte', () => {
    expect(createWorld(3).trial).toEqual(START);
    expect(createWorld(3, { unlockAll: true }).trial).toEqual(START);
  });
});

describe('AK-2 (Gründe) trialStartBlock', () => {
  const block = (w: World, id: unknown): string | null => {
    const before = serialize(w);
    const r = trialStartBlock(w, id);
    expect(serialize(w)).toBe(before);
    return r;
  };

  it.each(['genuegsam', undefined, 42, 'toString', '__proto__', 'constructor'])(
    'unbekannte Id %s',
    (id) => {
      expect(block(merchantWorld(60), id)).toBe('Unbekannte Auflage');
    },
  );

  it('ohne Denkmal', () => {
    const w = merchantWorld(60);
    w.monumentDone = false;
    expect(block(w, 'selfSupply')).toBe('Erst nach dem Wahlziel (Denkmal)');
  });

  it('läuft schon', () => {
    const w = merchantWorld(60);
    w.trial.active = 'selfSupply';
    expect(block(w, 'selfSupply')).toBe('Eine Auflage läuft schon');
  });

  it('bereits bestanden', () => {
    const w = merchantWorld(60);
    w.trial.passed = [{ id: 'selfSupply', tick: 1 }];
    expect(block(w, 'selfSupply')).toBe('Bereits bestanden');
  });

  it('Kasse im Minus', () => {
    const w = merchantWorld(60);
    w.money = -1;
    expect(block(w, 'selfSupply')).toBe('Kasse im Minus');
  });

  it('Kaufleute: Grenzen', () => {
    expect(block(merchantWorld(59), 'selfSupply')).toBe('Erst ab 60 Kaufleuten (jetzt 59)');
    expect(block(merchantWorld(151), 'selfSupply')).toBe('Höchstens 150 Kaufleute (jetzt 151)');
    expect(block(merchantWorld(60), 'selfSupply')).toBeNull();
    expect(block(merchantWorld(150), 'selfSupply')).toBeNull();
  });

  it('Reihenfolge: Denkmal vor Kasse', () => {
    const w = merchantWorld(60);
    w.monumentDone = false;
    w.money = -1;
    expect(block(w, 'selfSupply')).toBe('Erst nach dem Wahlziel (Denkmal)');
  });
});

describe('trialBuyBlock und trialPopulation', () => {
  it('Sperrgrund nur mit aktiver Auflage', () => {
    const w = createWorld(3);
    expect(trialBuyBlock(w)).toBeNull();
    w.trial.active = 'selfSupply';
    expect(trialBuyBlock(w)).toBe('Auflage Eigenversorgung: kein Zukauf');
  });

  it('trialPopulation zählt alle Häuser', () => {
    expect(trialPopulation(merchantWorld(45))).toBeGreaterThanOrEqual(45);
  });
});

describe('AK-13 Defs', () => {
  it('Auflagen und Konstanten', () => {
    expect(Object.keys(TRIALS)).toEqual(['selfSupply']);
    for (const d of Object.values(TRIALS)) {
      expect(d.name).not.toBe('');
      expect(d.short).not.toBe('');
      expect(d.rule).not.toBe('');
    }
    expect(TRIAL_DURATION_TICKS).toBe(9000);
    expect(TRIAL_MAX_MERCHANTS).toBe(150);
    expect(TRIAL_FAIL_POP_PCT).toBe(70);
    expect(TRIAL_MIN_MERCHANTS).toBe(WIN_MERCHANTS);
  });

  it('trial.ts enthält keine Spielwert-Literale', () => {
    expect(readFileSync('src/sim/trial.ts', 'utf8')).not.toMatch(/\b(9000|150|70|60)\b/);
  });
});
