// Handel 2 T03: Fernangebot und Fernsperre im Save (AK-H2-20, -21, -22).
import { describe, expect, it } from 'vitest';
import { ORDER_DURATION, ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { orderUnitReward } from '../../src/sim/orders';
import { SAVE_VERSION, deserialize, serialize } from '../../src/sim/save';
import type { LoadResult } from '../../src/sim/save';
import { step } from '../../src/sim/tick';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import {
  foldBackSeerecht,
  foldBackPetitions,
  foldBackTithe,
  foldBackCouncil,
  foldBackTrial,
  foldBackDeliveries,
} from './helpers';

const P = (k: number): number => ORDER_FIRST_TICK + k * ORDER_PERIOD;
const isl = (w: World, kind: 'A' | 'B' | 'C'): number =>
  w.islands.findIndex((x) => x.kind === kind);
const load = (w: World): LoadResult => deserialize(serialize(w));
const bad = (w: World): void =>
  expect(load(w)).toEqual({ ok: false, reason: 'Beschädigter Spielstand' });
const ok = (w: World): void => expect(load(w).ok).toBe(true);

function farWorldRaw(): World {
  const w = createWorld(3, { unlockAll: true });
  w.tick = P(0) + 10;
  w.order = {
    period: 0,
    good: 'wood',
    amount: 20,
    reward: 20 * orderUnitReward('wood'),
    due: P(0) + ORDER_DURATION,
  };
  w.farOffer = { island: isl(w, 'B'), good: 'rum', amount: 15, reward: 450 };
  return w;
}
function farOrderRaw(due = P(0) + 1700): World {
  const w = createWorld(3, { unlockAll: true });
  w.tick = P(0) + 10;
  w.order = { period: 0, good: 'rum', amount: 15, reward: 450, due, island: isl(w, 'B') };
  w.farSkip = 1;
  return w;
}

describe('AK-H2-21 Version und Migration', () => {
  it('neue Welt: aktuelle Version, leere Felder als letzte Schlüssel', () => {
    const w = createWorld(3);
    expect(w.version).toBe(SAVE_VERSION);
    expect(w.farOffer).toBeNull();
    expect(w.farSkip).toBeNull();
    expect(Object.keys(JSON.parse(serialize(w)) as object).slice(-7)).toEqual([
      'farOffer',
      'farSkip',
      'council',
      'trial',
      'titheOn',
      'titheLockedUntil',
      'titheCarry',
    ]);
  });

  it('Vorversion ohne Felder lädt verlustfrei und läuft 10 Perioden bitgleich', () => {
    const w = createWorld(3, { unlockAll: true });
    const raw = foldBackDeliveries(
      foldBackCouncil(
        foldBackTrial(foldBackSeerecht(foldBackTithe(foldBackPetitions(JSON.parse(serialize(w)))))),
      ),
    );
    delete raw.farOffer;
    delete raw.farSkip;
    raw.version = (raw.version as number) - 1;
    const r = deserialize(JSON.stringify(raw));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.world.farOffer).toBeNull();
    expect(r.world.farSkip).toBeNull();
    expect(serialize(r.world)).toBe(serialize(w));
    while (w.tick < P(10)) step(w);
    while (r.world.tick < P(10)) step(r.world);
    expect(serialize(r.world)).toBe(serialize(w));
  });

  it('höhere Version wird abgewiesen, ohne zu werfen', () => {
    const raw = JSON.parse(serialize(createWorld(3))) as Record<string, unknown>;
    raw.version = SAVE_VERSION + 1;
    const text = JSON.stringify(raw);
    expect(() => deserialize(text)).not.toThrow();
    expect(deserialize(text)).toEqual({ ok: false, reason: 'Unbekannte Version' });
  });
});

describe('AK-H2-20 Fernauftrag: due', () => {
  it('Grenzfälle', () => {
    ok(farOrderRaw());
    ok(farOrderRaw(P(0) + 1500));
    ok(farOrderRaw(P(0) + 601));
    ok(farOrderRaw(P(0) + 1799));
    bad(farOrderRaw(P(0) + 600));
    bad(farOrderRaw(P(0) + 1800));
  });
  it('Zufallsauftrag-Form mit island und kurzem due ist beschädigt', () => {
    bad(farOrderRaw(P(0) + 600));
  });
});

describe('AK-H2-22 Fernangebot und Sperre', () => {
  it('gültiges Angebot lädt, auch ohne Kontor', () => {
    const w = farWorldRaw();
    expect(w.islands[isl(w, 'B')]!.kontorId).toBeNull();
    ok(w);
  });
  it('beschädigte Angebote', () => {
    const mut = (f: (w: World) => void): void => {
      const w = farWorldRaw();
      f(w);
      bad(w);
    };
    mut((w) => (w.farOffer!.island = 0));
    mut((w) => (w.farOffer!.island = w.islands.length));
    mut((w) => ((w.farOffer as unknown as { good: string }).good = 'tools'));
    mut((w) => (w.farOffer!.amount = 0));
    mut((w) => (w.order = null));
    mut((w) => (w.contractOffer = { good: 'rum', amount: 5, price: 27, island: 0 } as never));
    mut((w) => {
      w.order = null;
      w.contract = { good: 'rum', amount: 5, price: 27, island: 0, deliveries: 0 } as never;
    });
  });
  it('Angebot bei Fernauftrag ist beschädigt', () => {
    const w = farOrderRaw();
    w.farOffer = { island: isl(w, 'B'), good: 'rum', amount: 15, reward: 450 };
    bad(w);
  });
  it('order.island 0 ist beschädigt', () => {
    const w = farOrderRaw();
    w.order!.island = 0;
    bad(w);
  });
  it('farSkip: falsche Periode, nicht ganzzahlig, vor erstem Auftrag', () => {
    const a = farOrderRaw();
    a.farSkip = 2;
    bad(a);
    const b = farOrderRaw();
    (b as { farSkip: number | null }).farSkip = 1.5;
    bad(b);
    const c = createWorld(3);
    c.tick = ORDER_FIRST_TICK - 1;
    c.farSkip = 1;
    bad(c);
  });
});
