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
import { recomputeConnectivity } from '../../src/sim/roads';
import { deserialize, serialize } from '../../src/sim/save';
import { buyShip } from '../../src/sim/ships';
import { step } from '../../src/sim/tick';
import { buy, buyMonumentUnit, monumentBuyBlock, sell } from '../../src/sim/trade';
import {
  abortTrial,
  startTrial,
  tickTrial,
  trialBuyBlock,
  trialPopulation,
  trialStartBlock,
} from '../../src/sim/trial';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { putBuilding, twoIslandWorld } from './helpers';

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

const BLOCK = 'Auflage Eigenversorgung: kein Zukauf';

function started(n = 60): World {
  const w = merchantWorld(n);
  w.crisisLevel = 'off';
  expect(startTrial(w, 'selfSupply')).toEqual({ ok: true });
  return w;
}

/** Setzt die Einwohner aller Häuser so, dass die Summe genau `n` ist. */
function setPopulation(w: World, n: number): void {
  let left = n;
  for (const b of Object.values(w.buildings)) {
    if (b.house === undefined) continue;
    b.house.inhabitants = Math.min(20, left);
    left -= b.house.inhabitants;
  }
}

function mutated(fn: (w: World) => void): World {
  const w = merchantWorld(60);
  fn(w);
  return w;
}

describe('AK-2 (Aktion) startTrial', () => {
  it('liefert denselben Grund wie trialStartBlock, ohne Weltänderung', () => {
    const cases: [World, unknown][] = [
      [merchantWorld(60), undefined],
      [merchantWorld(60), 42],
      [merchantWorld(60), '__proto__'],
      [merchantWorld(60), 'toString'],
      [mutated((w) => (w.monumentDone = false)), 'selfSupply'],
      [mutated((w) => (w.money = -1)), 'selfSupply'],
      [merchantWorld(59), 'selfSupply'],
      [merchantWorld(151), 'selfSupply'],
      [mutated((w) => (w.trial.active = 'selfSupply')), 'selfSupply'],
      [mutated((w) => (w.trial.passed = [{ id: 'selfSupply', tick: 1 }])), 'selfSupply'],
    ];
    for (const [w, id] of cases) {
      const before = serialize(w);
      const why = trialStartBlock(w, id);
      expect(why).not.toBeNull();
      expect(startTrial(w, id)).toEqual({ ok: false, reason: why });
      expect(serialize(w)).toBe(before);
    }
  });

  it('wirft nie', () => {
    const w = merchantWorld(60);
    for (const x of [undefined, 42, '__proto__']) expect(() => startTrial(w, x)).not.toThrow();
  });
});

describe('AK-3 Start', () => {
  it.each([60, 150])('Start mit %i Kaufleuten', (n) => {
    const w = merchantWorld(n);
    expect(startTrial(w, 'selfSupply')).toEqual({ ok: true });
    expect(w.trial).toEqual({ active: 'selfSupply', ticks: 0, e0: trialPopulation(w), passed: [] });
  });

  it('e0 zählt auch Häuser auf Insel 1', () => {
    const w = twoIslandWorld();
    w.monumentDone = true;
    const k = w.buildings[w.islands[0]!.kontorId!]!;
    for (let i = 0; i < 3; i++) {
      const h = putBuilding(w, 0, 'house', k.x + 3 + i * 2, k.y);
      h.house!.tier = 4;
      h.house!.inhabitants = 20;
    }
    const far = putBuilding(w, 1, 'house', k.x + 3, k.y);
    far.house!.tier = 4;
    far.house!.inhabitants = 20;
    expect(startTrial(w, 'selfSupply')).toEqual({ ok: true });
    expect(w.trial.e0).toBe(trialPopulation(w));
    expect(w.trial.e0).toBeGreaterThanOrEqual(80);
  });
});

describe('AK-4 Sperre', () => {
  function lockedTwo(): World {
    const w = twoIslandWorld();
    w.monumentDone = true;
    w.crisisLevel = 'off';
    w.money = 100_000;
    const k = w.buildings[w.islands[0]!.kontorId!]!;
    for (let i = 0; i < 3; i++) {
      const h = putBuilding(w, 0, 'house', k.x + 3 + i * 2, k.y);
      h.house!.tier = 4;
      h.house!.inhabitants = 20;
    }
    return w;
  }

  it('Zukauf gesperrt, Verkauf und Schiffe frei', () => {
    const w = lockedTwo();
    w.islands[0]!.stock.stone = 10;
    const free = structuredClone(w);
    expect(startTrial(w, 'selfSupply')).toEqual({ ok: true });
    const money = w.money;
    const stocks = structuredClone(w.islands.map((i) => i.stock));
    const lock = { ok: false, reason: BLOCK };
    expect(buy(w, 'spice', 1)).toEqual(lock);
    expect(buy(w, 'spice', 1, 1)).toEqual(lock);
    expect(buyMonumentUnit(w, 'stone')).toBe(0);
    expect(monumentBuyBlock(w, 'stone')).toBe(BLOCK);
    expect(w.money).toBe(money);
    expect(w.islands.map((i) => i.stock)).toEqual(stocks);
    expect(sell(w, 'stone', 1)).toEqual(sell(free, 'stone', 1));
    expect(w.money).toBe(free.money);
    expect(w.islands[0]!.stock).toEqual(free.islands[0]!.stock);
    expect(buyShip(w)).toEqual(buyShip(free));
    expect(w.money).toBe(free.money);
  });

  it('Insel ohne Kontor: Grund der Auflage', () => {
    const w = lockedTwo();
    startTrial(w, 'selfSupply');
    w.islands[1]!.kontorId = null;
    expect(buy(w, 'spice', 1, 1)).toEqual({ ok: false, reason: BLOCK });
  });
});

describe('AK-5 Abbruch', () => {
  it('beendet die Auflage, gibt den Kauf frei', () => {
    const w = started();
    const e0 = w.trial.e0;
    expect(abortTrial(w)).toEqual({ ok: true });
    expect(w.trial).toEqual({ active: null, ticks: 0, e0, passed: [] });
    expect(buy(w, 'wood', 1)).toEqual({ ok: true });
    expect(abortTrial(w)).toEqual({ ok: false, reason: 'Keine Auflage aktiv' });
  });
});

describe('AK-6 Zählen', () => {
  it('9000 Ticks bestehen', () => {
    const w = started();
    for (let i = 0; i < 8999; i++) {
      w.tick += 1;
      tickTrial(w);
    }
    expect(w.trial.active).toBe('selfSupply');
    expect(w.trial.ticks).toBe(8999);
    w.tick += 1;
    tickTrial(w);
    expect(w.trial.active).toBeNull();
    expect(w.trial.ticks).toBe(0);
    expect(w.trial.passed).toEqual([{ id: 'selfSupply', tick: w.tick }]);
  });
});

describe('AK-7 Grenzfall 70 %', () => {
  it('genau 70 bleibt, 69 scheitert', () => {
    const w = started(100);
    w.trial.e0 = 100;
    setPopulation(w, 70);
    tickTrial(w);
    expect(w.trial.active).toBe('selfSupply');
    expect(w.trial.ticks).toBe(1);
    setPopulation(w, 69);
    tickTrial(w);
    expect(w.trial.active).toBeNull();
    expect(w.trial.passed).toEqual([]);
  });
});

describe('AK-8 Zähler', () => {
  it('zählt step-Aufrufe, trial.ts ohne Zeit und Zufall', () => {
    const w = started();
    for (let i = 0; i < 37; i++) step(w);
    expect(w.trial.ticks).toBe(37);
    expect(readFileSync('src/sim/trial.ts', 'utf8')).not.toMatch(
      /Date|performance|setTimeout|Math\.random/,
    );
  });
});

describe('AK-9 Neustart', () => {
  it('nach Bestehen gesperrt, nach Scheitern frei', () => {
    const w = started();
    for (let i = 0; i < 9000; i++) {
      w.tick += 1;
      tickTrial(w);
    }
    expect(startTrial(w, 'selfSupply')).toEqual({ ok: false, reason: 'Bereits bestanden' });

    const f = started(100);
    f.trial.e0 = 100;
    setPopulation(f, 69);
    tickTrial(f);
    expect(startTrial(f, 'selfSupply')).toEqual({ ok: true });
    expect(f.trial.ticks).toBe(0);
  });

  it('nach Abbruch wieder ok', () => {
    const w = started();
    abortTrial(w);
    expect(startTrial(w, 'selfSupply')).toEqual({ ok: true });
    expect(w.trial.ticks).toBe(0);
  });
});

describe('Speichern mitten in der Auflage', () => {
  it('geladener Lauf gleicht dem ununterbrochenen', () => {
    // Ausgangswelt normalisieren: `putBuilding` setzt `connected` ohne Weg, das Laden berechnet es neu.
    const a = merchantWorld(60);
    recomputeConnectivity(a);
    a.crisisLevel = 'off';
    expect(startTrial(a, 'selfSupply')).toEqual({ ok: true });
    for (let i = 0; i < 50; i++) step(a);
    const loaded = deserialize(serialize(a));
    if (!loaded.ok) throw new Error(loaded.reason);
    const b = loaded.world;
    for (let i = 0; i < 200; i++) {
      step(a);
      step(b);
    }
    expect(serialize(b)).toBe(serialize(a));
    expect(b.trial).toEqual(a.trial);
  });
});

describe('Randfall Wachstum und Kasse', () => {
  it('Wachstum über e0 und Minus-Kasse brechen nicht ab', () => {
    const w = started();
    w.trial.e0 = 10;
    tickTrial(w);
    w.money = -500;
    tickTrial(w);
    expect(w.trial.active).toBe('selfSupply');
    expect(w.trial.ticks).toBe(2);
  });
});

describe('AK-10 Denkmal abgerissen', () => {
  it('monumentDone ohne Gebäude startet', () => {
    const w = merchantWorld(60);
    expect(w.monument).toBeNull();
    expect(startTrial(w, 'selfSupply')).toEqual({ ok: true });
  });
});

describe('AK-11 Determinismus', () => {
  const script = (w: World, withTrial: boolean): void => {
    for (let i = 0; i < 10; i++) step(w);
    if (withTrial) expect(startTrial(w, 'selfSupply')).toEqual({ ok: true });
    for (let i = 0; i < 100; i++) step(w);
    if (withTrial) expect(abortTrial(w)).toEqual({ ok: true });
    for (let i = 0; i < 100; i++) step(w);
    if (withTrial) expect(startTrial(w, 'selfSupply')).toEqual({ ok: true });
    for (let i = 0; i < 300; i++) step(w);
  };
  const crisis = (): World => {
    const w = merchantWorld(100); // Reserve, damit der zweite Start nach 210 Schritten noch 60 Kaufleute findet
    w.crisisLevel = 'normal';
    return w;
  };

  it('gleiche Folge, gleicher Zustand', () => {
    const a = crisis();
    const b = crisis();
    script(a, true);
    script(b, true);
    expect(serialize(a)).toBe(serialize(b));
  });

  it('Auflage ändert ausser trial nichts', () => {
    const a = crisis();
    const b = crisis();
    script(a, true);
    script(b, false);
    const ra = JSON.parse(serialize(a)) as Record<string, unknown>;
    const rb = JSON.parse(serialize(b)) as Record<string, unknown>;
    delete ra.trial;
    delete rb.trial;
    expect(ra).toEqual(rb);
  });
});

describe('AK-14 Wächter', () => {
  it.each(['controller.ts', 'merchantsController.ts'])('%s ruft die Auflage nie', (f) => {
    const t = readFileSync(`tests/sim/${f}`, 'utf8');
    expect(t).not.toContain('startTrial');
    expect(t).not.toContain('sim/trial');
  });
});
