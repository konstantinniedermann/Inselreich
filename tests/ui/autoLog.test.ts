// UI-HAEPPCHEN-D T02: Verfall von Zufallsauftrag und Stammkunden-Angebot im Log (AK-UD-03, 04, 05a).
import { describe, expect, it } from 'vitest';
import { deliverOrder } from '../../src/sim/orders';
import { serialize } from '../../src/sim/save';
import type { StepReport } from '../../src/sim/tick';
import type { Contract, ContractEvent, World } from '../../src/sim/types';
import { autoSnap, contractLogEntries, expiryLogEntries } from '../../src/ui/autoLog';
import { isNotable, nextUnread } from '../../src/ui/crisisLog';
import { contractNotice } from '../../src/ui/order';
import { farLogEntries, farSnap } from '../../src/ui/farOrder';
import { farWorld, periodStart, stepAt } from '../sim/farHelpers';

const P = periodStart(1);

function offerWorld(): World {
  const w = farWorld(3, ['B']);
  stepAt(w, P);
  return w;
}

const contract = (good: Contract['good']): Contract => ({
  good,
  amount: 1,
  price: 1,
  island: 0,
  deliveries: 0,
});

describe('AK-UD-03 Stammkunden-Angebot', () => {
  it('verfallen: ein Eintrag ohne Meldung', () => {
    const w = farWorld(3, []);
    w.contractOffer = { good: 'rum', island: 0 };
    const prev = autoSnap(w);
    w.contractOffer = null;
    w.tick = 5000;
    expect(expiryLogEntries(prev, w)).toEqual([
      { text: 'Stammkunden-Angebot verfallen: Rum', toast: null, tick: 5000 },
    ]);
  });

  it('angenommen (Vertrag da): kein Eintrag', () => {
    const w = farWorld(3, []);
    w.contractOffer = { good: 'rum', island: 0 };
    const prev = autoSnap(w);
    w.contractOffer = null;
    w.contract = contract('rum');
    expect(expiryLogEntries(prev, w)).toEqual([]);
  });

  it('durch neues Angebot ersetzt: Eintrag für das alte', () => {
    const w = farWorld(3, []);
    w.contractOffer = { good: 'rum', island: 0 };
    const prev = autoSnap(w);
    w.contractOffer = { good: 'tools', island: 0 };
    const out = expiryLogEntries(prev, w);
    expect(out).toHaveLength(1);
    expect(out[0]!.text).toBe('Stammkunden-Angebot verfallen: Rum');
  });

  it('unverändertes Angebot: kein Eintrag', () => {
    const w = farWorld(3, []);
    w.contractOffer = { good: 'rum', island: 0 };
    expect(expiryLogEntries(autoSnap(w), w)).toEqual([]);
  });
});

describe('AK-UD-04 Zufallsauftrag', () => {
  it('nach due: Eintrag ohne Meldung', () => {
    const w = farWorld(3, []);
    stepAt(w, P);
    const prev = autoSnap(w);
    stepAt(w, P + 601);
    expect(expiryLogEntries(prev, w)).toEqual([
      { text: 'Auftrag verfallen: 19 Wolle', toast: null, tick: P + 601 },
    ]);
  });

  it('Lieferung: kein Eintrag', () => {
    const w = farWorld(3, []);
    stepAt(w, P);
    w.islands[0]!.stock[w.order!.good] = 999;
    const prev = autoSnap(w);
    expect(deliverOrder(w, 0)).toEqual({ ok: true });
    expect(expiryLogEntries(prev, w)).toEqual([]);
  });

  it('Fernauftrag: kein Eintrag (Sache von farLogEntries)', () => {
    const w = offerWorld();
    const prev = autoSnap(w);
    prev.order = { ...prev.order!, island: 1 };
    stepAt(w, P + 601);
    expect(expiryLogEntries(prev, w)).toEqual([]);
  });
});

describe('AK-UD-05a Zähler und Zusammenspiel', () => {
  it('beide Einträge sind nicht auffällig, Zähler bleibt 0', () => {
    const w = farWorld(3, []);
    stepAt(w, P);
    w.contractOffer = { good: 'rum', island: 0 };
    const prev = autoSnap(w);
    stepAt(w, P + 601);
    w.contractOffer = null;
    const out = expiryLogEntries(prev, w);
    expect(out).toHaveLength(2);
    expect(out[0]!.text).toMatch(/^Stammkunden-Angebot/);
    expect(out[1]!.text).toMatch(/^Auftrag verfallen/);
    expect(out.some(isNotable)).toBe(false);
    expect(nextUnread(0, out, false)).toBe(0);
  });

  it('Fernangebot- und Auftrag-Verfall im selben Frame: beide, kein Doppel', () => {
    const w = offerWorld();
    const a = autoSnap(w);
    const f = farSnap(w);
    stepAt(w, P + 601);
    const all = [...expiryLogEntries(a, w), ...farLogEntries(f, w)];
    expect(all.map((e) => e.text)).toEqual([
      expect.stringMatching(/^Auftrag verfallen/),
      expect.stringMatching(/^Fernangebot verfallen/),
    ]);
  });

  it('Lieferung am letzten Tick: kein Eintrag', () => {
    const w = farWorld(3, []);
    stepAt(w, P);
    w.islands[0]!.stock[w.order!.good] = 999;
    const prev = autoSnap(w);
    w.tick = w.order!.due;
    deliverOrder(w, 0);
    expect(expiryLogEntries(prev, w)).toEqual([]);
  });

  it('verändert die Welt nicht', () => {
    const w = farWorld(3, []);
    stepAt(w, P);
    w.contractOffer = { good: 'rum', island: 0 };
    const prev = autoSnap(w);
    stepAt(w, P + 601);
    const mid = serialize(w);
    expiryLogEntries(prev, w);
    expect(serialize(w)).toBe(mid);
  });
});

describe('AK-UD-05b Vertragsereignisse', () => {
  const delivered: ContractEvent = {
    kind: 'delivered',
    good: 'rum',
    amount: 10,
    pay: 270,
    island: 0,
    loyal: false,
    becameLoyal: false,
  };
  const broken = (reason?: 'stock' | 'kontor'): ContractEvent =>
    ({ kind: 'broken', good: 'rum', reason, penalty: 135, island: 0 }) as ContractEvent;
  const rep = (contract: ContractEvent | null): StepReport => ({
    lost: [],
    contract,
    titheLost: {},
  });

  it('delivered: info, Text wie contractNotice, zählt als neu', () => {
    const w = farWorld(3, []);
    const out = contractLogEntries([rep(delivered)], w, 77);
    expect(out).toEqual([{ text: 'Stammkunde: 10 Rum geliefert, +270', toast: 'info', tick: 77 }]);
    expect(out[0]!.text).toBe(contractNotice(delivered, w).text);
    expect(isNotable(out[0]!)).toBe(true);
    expect(nextUnread(0, out, false)).toBe(1);
  });

  it('broken mit Grund stock, kontor und ohne: warn, Text wie contractNotice', () => {
    const w = farWorld(3, []);
    for (const reason of ['stock', 'kontor', undefined] as const) {
      const ev = broken(reason);
      const out = contractLogEntries([rep(ev)], w, 5);
      expect(out).toHaveLength(1);
      expect(out[0]!.toast).toBe('warn');
      expect(out[0]!.text).toBe(contractNotice(ev, w).text);
      expect(out[0]!.text).toMatch(/^Stammkunde abgesprungen/);
    }
  });

  it('ohne Vertrag: leer; zwei Ereignisse: zwei Einträge in Berichtsreihenfolge', () => {
    const w = farWorld(3, []);
    expect(contractLogEntries([rep(null), rep(null)], w, 1)).toEqual([]);
    const out = contractLogEntries([rep(delivered), rep(null), rep(broken('stock'))], w, 9);
    expect(out.map((e) => e.toast)).toEqual(['info', 'warn']);
  });
});
