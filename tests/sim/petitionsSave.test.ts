import { describe, expect, it } from 'vitest';
import {
  FRUGAL_TICKS,
  PETITIONS,
  PETITION_ANSWER,
  PETITION_IDS,
} from '../../src/sim/defs/petitions';
import { home } from '../../src/sim/world';
import { createWorld } from '../../src/sim/world';
import { tickPetitions } from '../../src/sim/petitions';
import { deserialize, SAVE_VERSION, serialize } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';

const TICK = 500;

/** Welt mit einer beantworteten und einer offenen Marke und je einer Wirkung der vier Phase-1-Arten. */
function busyWorld(): World {
  const w = createWorld(3, { petitionsOn: true });
  w.tick = TICK;
  w.petitions.next = TICK + 100;
  w.petitions.open = [
    { id: 'weavers', drawnAt: 100, amount: 10, answer: 'yes', dueTick: TICK + 50 },
    { id: 'tavern', drawnAt: 300, amount: 10 },
  ];
  w.petitions.effects = [
    { id: 'glaziers', answer: 'yes', until: TICK + 6000 },
    { id: 'bell', answer: 'no', until: TICK + 1800 },
    { id: 'woolMarket', answer: 'yes', until: TICK + 3000 },
    { id: 'granary', answer: 'yes', until: TICK + 6000 },
  ];
  return w;
}

interface RawSave {
  petitions: {
    on: boolean;
    next: unknown;
    open: Record<string, unknown>[];
    effects: Record<string, unknown>[];
  };
}

const load = (w: World) => deserialize(serialize(w));
const edited = (edit: (raw: RawSave) => void) => {
  const raw = JSON.parse(serialize(busyWorld())) as unknown as RawSave;
  edit(raw);
  return deserialize(JSON.stringify(raw));
};
const broken = { ok: false, reason: 'Beschädigter Spielstand' };

describe('AK-BS-15 Rundlauf', () => {
  it('Marken und Wirkungen aller Phase-1-Arten bleiben beim Laden gleich', () => {
    const w = busyWorld();
    const r = load(w);
    expect(r.ok).toBe(true);
    expect(r.ok && serialize(r.world)).toBe(serialize(w));
  });
});

/** B4 und B5 tragen eine Ankerkapelle (`anchor`) in Marke und Wirkung. */
function anchoredWorld(): World {
  const w = createWorld(3, { petitionsOn: true });
  w.tick = TICK;
  w.petitions.next = TICK + 100;
  const chapel = Object.values(w.buildings).find((b) => b.defId === 'chapel');
  const anchor = chapel?.id ?? w.islands[0]!.kontorId!;
  w.petitions.open = [
    { id: 'bell', drawnAt: 100, amount: 0, anchor, answer: 'yes', dueTick: TICK + 50 },
    { id: 'feastDrink', drawnAt: 300, amount: 0, anchor },
  ];
  w.petitions.effects = [
    { id: 'bell', answer: 'yes', until: TICK + 1800, anchor },
    { id: 'feastDrink', answer: 'yes', until: TICK + 6000, anchor },
  ];
  return w;
}

describe('AK-BS-15 Rundlauf B4 und B5 mit Anker', () => {
  it('Marken und Wirkungen mit Ankerkapelle bleiben beim Laden gleich', () => {
    const w = anchoredWorld();
    const r = load(w);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(serialize(r.world)).toBe(serialize(w));
    expect(r.world.petitions.open.map((m) => m.anchor)).toEqual(
      w.petitions.open.map((m) => m.anchor),
    );
    expect(r.world.petitions.effects.map((e) => e.anchor)).toEqual(
      w.petitions.effects.map((e) => e.anchor),
    );
  });
});

describe('AK-BS-15 Migration', () => {
  const oldSave = (): string => {
    const raw = JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
    delete raw.petitions;
    raw.version = SAVE_VERSION - 1;
    return JSON.stringify(raw);
  };
  it('Vorgängerstand lädt mit ausgeschalteten Bittschriften und spielt gleich weiter', () => {
    const r = deserialize(oldSave());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.version).toBe(SAVE_VERSION);
    expect(r.world.petitions).toEqual({ on: false, next: null, open: [], effects: [] });
    const ref = createWorld(3);
    for (let i = 0; i < 2000; i++) {
      step(r.world);
      step(ref);
    }
    expect(serialize(r.world)).toBe(serialize(ref));
  });
  it('v19-Stand läuft über Zehnt (v20) und Bittschrift (v21) und gleicht einer frischen Welt', () => {
    const raw = JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
    for (const k of ['petitions', 'titheOn', 'titheLockedUntil', 'titheCarry']) delete raw[k];
    raw.version = 19;
    const r = deserialize(JSON.stringify(raw));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.version).toBe(21);
    expect(serialize(r.world)).toBe(serialize(createWorld(3)));
  });
  it('v20-Stand mit Zehnt behält ihn, Bittschriften aus', () => {
    const raw = JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
    delete raw.petitions;
    raw.version = 20;
    (raw.titheOn as Record<string, boolean>)['1'] = true;
    const r = deserialize(JSON.stringify(raw));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.titheOn[1]).toBe(true);
    expect(r.world.petitions.on).toBe(false);
  });
  it('mit won zieht der migrierte Stand nie', () => {
    const raw = JSON.parse(oldSave()) as Record<string, unknown>;
    raw.won = true;
    const r = deserialize(JSON.stringify(raw));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    for (let i = 0; i < 60_000; i++) step(r.world);
    expect(r.world.petitions.open).toEqual([]);
  });
});

describe('AK-BS-15 Abweisung', () => {
  it('Stand der aktuellen Version ohne petitions ist beschädigt, kein stilles Auffüllen', () => {
    const raw = JSON.parse(serialize(busyWorld())) as Record<string, unknown>;
    delete raw.petitions;
    expect(deserialize(JSON.stringify(raw))).toEqual(broken);
  });
  it('Stand der aktuellen Version ohne Zehnt-Felder ist beschädigt', () => {
    const raw = JSON.parse(serialize(busyWorld())) as Record<string, unknown>;
    delete raw.titheOn;
    expect(deserialize(JSON.stringify(raw))).toEqual(broken);
  });
  it('drei offene Marken', () =>
    expect(
      edited((r) => {
        r.petitions.open.push({ id: 'glaziers', drawnAt: 400, amount: 5 });
      }),
    ).toEqual(broken));
  it('unbekannte Id', () =>
    expect(edited((r) => (r.petitions.open[1]!.id = 'guild'))).toEqual(broken));
  it('doppelte Id', () =>
    expect(edited((r) => (r.petitions.open[1]!.id = 'weavers'))).toEqual(broken));
  it('unbekannte Antwort', () =>
    expect(edited((r) => (r.petitions.open[0]!.answer = 'maybe'))).toEqual(broken));
  it('dueTick ohne Antwort', () =>
    expect(edited((r) => (r.petitions.open[1]!.dueTick = TICK + 10))).toEqual(broken));
  it('until über der Höchstdauer', () =>
    expect(edited((r) => (r.petitions.effects[0]!.until = TICK + 6001))).toEqual(broken));
  it('aus, aber mit Wirkung', () =>
    expect(
      edited((r) => {
        r.petitions.on = false;
        r.petitions.next = null;
        r.petitions.open = [];
      }),
    ).toEqual(broken));
  it('next als Text', () => expect(edited((r) => (r.petitions.next = 'bald'))).toEqual(broken));
  it('spätere Version', () => {
    const raw = JSON.parse(serialize(busyWorld())) as Record<string, unknown>;
    raw.version = SAVE_VERSION + 1;
    expect(deserialize(JSON.stringify(raw))).toEqual({ ok: false, reason: 'Unbekannte Version' });
  });
});

const MAX_DELAY = Math.max(...PETITION_IDS.map((id) => PETITIONS[id].delay));
const mutate = (edit: (raw: Record<string, unknown>) => void) => {
  const raw = JSON.parse(serialize(busyWorld())) as Record<string, unknown>;
  edit(raw);
  return deserialize(JSON.stringify(raw)).ok;
};
const pet = (raw: Record<string, unknown>): RawSave['petitions'] =>
  (raw as unknown as RawSave).petitions;

describe('AK-BS-15 Abweisung: Ränder und Formen', () => {
  const bad: [string, (raw: Record<string, unknown>) => void][] = [
    ['petitions null', (r) => (r.petitions = null)],
    ['petitions Text', (r) => (r.petitions = 'x')],
    ['Marke als Text', (r) => (pet(r).open[1] = 'x' as unknown as Record<string, unknown>)],
    [
      'drawnAt knapp zu alt',
      (r) => (pet(r).open[0]!.drawnAt = TICK - PETITION_ANSWER - MAX_DELAY - 1),
    ],
    ['dueTick gleich tick', (r) => (pet(r).open[0]!.dueTick = TICK)],
    ['dueTick über tick + Verzögerung', (r) => (pet(r).open[0]!.dueTick = TICK + MAX_DELAY + 1)],
    [
      'until bei Nein über FRUGAL_TICKS',
      (r) => (pet(r).effects[1]!.until = TICK + FRUGAL_TICKS + 1),
    ],
    ['Anker an Marke ohne Anker', (r) => (pet(r).open[0]!.anchor = 1)],
    ['Anker an Wirkung ohne Anker', (r) => (pet(r).effects[0]!.anchor = 1)],
    [
      'zu viele Wirkungen',
      (r) =>
        (pet(r).effects = Array.from(
          { length: 2 * PETITION_IDS.length + 1 },
          () => pet(r).effects[0]!,
        )),
    ],
  ];
  it.each(bad)('%s', (_name, edit) => expect(mutate(edit)).toBe(false));

  const good: [string, (raw: Record<string, unknown>) => void][] = [
    [
      'drawnAt genau am Rand',
      (r) => (pet(r).open[0]!.drawnAt = TICK - PETITION_ANSWER - MAX_DELAY),
    ],
    ['dueTick genau tick + Verzögerung', (r) => (pet(r).open[0]!.dueTick = TICK + MAX_DELAY)],
    ['until bei Nein genau FRUGAL_TICKS', (r) => (pet(r).effects[1]!.until = TICK + FRUGAL_TICKS)],
  ];
  it.each(good)('gültig: %s', (_name, edit) => expect(mutate(edit)).toBe(true));
});

describe('AK-BS-03 Save mitten in der Frist', () => {
  const END = 3000;
  const start = (): World => {
    const w = createWorld(3, { petitionsOn: true });
    w.won = true;
    return w;
  };
  it('Laden bei drawnAt + 600 ändert den Lauf nicht', () => {
    const a = start();
    while (a.tick < END) step(a);
    let b = start();
    while (b.petitions.open.length === 0) step(b);
    const at = b.petitions.open[0]!.drawnAt + 600;
    while (b.tick < at) step(b);
    const r = load(b);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    b = r.world;
    while (b.tick < END) step(b);
    expect(serialize(b)).toBe(serialize(a));
  });
});

describe('Review Focus 2 Lager über der Grenze', () => {
  it('Stoff 117 mit laufendem Speicherbau: Ablauf kappt auf 100 und meldet 17', () => {
    const w = createWorld(3, { petitionsOn: true });
    w.tick = TICK;
    w.petitions.next = TICK + 5000;
    w.petitions.effects = [{ id: 'granary', answer: 'yes', until: TICK + 10 }];
    home(w).stock.cloth = 117;
    const r = load(w);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    r.world.tick = TICK + 10;
    const ended = tickPetitions(r.world).find((e) => e.kind === 'ended');
    expect(ended?.spoiled?.cloth).toBe(17);
    expect(home(r.world).stock.cloth).toBe(100);
    expect(PETITION_ANSWER).toBeGreaterThan(0);
  });
});
