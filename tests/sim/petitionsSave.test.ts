import { describe, expect, it } from 'vitest';
import { PETITION_ANSWER } from '../../src/sim/defs/petitions';
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
