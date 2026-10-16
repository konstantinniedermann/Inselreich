import { describe, expect, it } from 'vitest';
import { CONTRACT_LOYAL_AFTER } from '../../src/sim/defs/goods';
import { ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import { acceptContract, cancelContract, contractUnitPrice } from '../../src/sim/orders';
import { step } from '../../src/sim/tick';
import type { StepReport } from '../../src/sim/tick';
import { HOME, createWorld, home } from '../../src/sim/world';
import { houseNearKontor, setHouse } from './helpers';
import type { Tier, World } from '../../src/sim/types';

const N = CONTRACT_LOYAL_AFTER;
const periodStart = (k: number): number => ORDER_FIRST_TICK + k * ORDER_PERIOD;

function base(tier: Tier = 3): World {
  const w = createWorld(3, { unlockAll: true });
  setHouse(houseNearKontor(w), tier, 1);
  return w;
}

/** Setzt die Uhr so, dass der nächste Schritt auf Tick `t` fällt, und führt ihn aus. */
function stepAt(w: World, t: number): StepReport {
  w.tick = t - 1;
  return step(w);
}

function withRumContract(tier: Tier = 3): World {
  const w = base(tier);
  w.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries: 0 };
  home(w).stock.rum = 60;
  return w;
}

/** Liefert `count` Mal in aufeinanderfolgenden Perioden. */
function deliver(w: World, count: number): void {
  for (let i = 1; i <= count; i++) stepAt(w, periodStart(i + 1));
}

function expectLoyalSequence(w: World): void {
  for (let i = 1; i <= N + 1; i++) {
    const r = stepAt(w, periodStart(i + 1));
    expect(r.contract).toEqual({
      kind: 'delivered',
      good: 'rum',
      amount: 5,
      pay: 135,
      island: HOME,
      loyal: i >= N,
      becameLoyal: i === N,
    });
    expect(w.contract!.deliveries).toBe(Math.min(i, N));
  }
}

describe('AK-TR-01 Annahme startet bei 0', () => {
  it('acceptContract setzt deliveries 0', () => {
    const w = base();
    w.contractOffer = { good: 'rum', island: HOME };
    expect(acceptContract(w).ok).toBe(true);
    expect(w.contract!.deliveries).toBe(0);
    expect(w.contract).toEqual({
      good: 'rum',
      amount: 5,
      price: contractUnitPrice('rum'),
      island: HOME,
      deliveries: 0,
    });
  });
});

describe('AK-TR-02 Zähler und Bericht', () => {
  it('zählt, sättigt bei N, becameLoyal nur beim Übergang', () => {
    expectLoyalSequence(withRumContract());
  });
});

describe('AK-TR-03 Kündigung setzt zurück', () => {
  it('neuer Vertrag beginnt wieder bei 0, Geld unverändert durch Kündigung', () => {
    const w = withRumContract();
    deliver(w, N);
    expect(w.contract!.deliveries).toBe(N);
    const money = w.money;
    expect(cancelContract(w).ok).toBe(true);
    expect(w.money).toBe(money);
    w.contractOffer = { good: 'rum', island: HOME };
    expect(acceptContract(w).ok).toBe(true);
    expect(w.contract!.deliveries).toBe(0);
  });
});

describe('AK-TR-04 Zähler unabhängig von Boom, Edikt, Stufe', () => {
  it('gleiche Folge bei Boom, Edikt und Stufe 2', () => {
    const w = withRumContract(2);
    w.crisis = { period: 0, kind: 'boom', from: 0, until: 99999, good: 'rum' };
    w.edict = 'trade';
    expectLoyalSequence(w);
  });
});
