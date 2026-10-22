import { describe, expect, it } from 'vitest';
import { CONTRACT_LOYAL_AFTER, CONTRACT_WARN_TICKS } from '../../src/sim/defs/goods';
import { FUNCTION_ENTRY } from '../../src/sim/defs/unlocks';
import { ORDER_FIRST_TICK, ORDER_PERIOD } from '../../src/sim/defs/timing';
import {
  contractPenalty,
  contractWarning,
  nextOrderTick,
  nextSettleTick,
} from '../../src/sim/orders';
import { step } from '../../src/sim/tick';
import { HOME, createWorld, home } from '../../src/sim/world';
import { houseNearKontor, setHouse } from './helpers';
import type { World } from '../../src/sim/types';

const SETTLE = ORDER_FIRST_TICK + ORDER_PERIOD;

function withContract(stock = 0, deliveries = 0): World {
  const w = createWorld(3, { unlockAll: true });
  setHouse(houseNearKontor(w), 3, 1);
  w.contract = { good: 'rum', amount: 5, price: 27, island: HOME, deliveries };
  home(w).stock.rum = stock;
  w.tick = SETTLE - CONTRACT_WARN_TICKS;
  return w;
}

describe('AK-W1 nextSettleTick', () => {
  it('Periodenbeginn strikt nach dem Tick', () => {
    const w = createWorld(3, { unlockAll: true });
    for (const [t, want] of [
      [0, ORDER_FIRST_TICK],
      [ORDER_FIRST_TICK - 1, ORDER_FIRST_TICK],
      [ORDER_FIRST_TICK, SETTLE],
    ] as const) {
      w.tick = t;
      expect(nextSettleTick(w)).toBe(want);
    }
  });

  it('ignoriert farSkip', () => {
    const w = createWorld(3, { unlockAll: true });
    w.tick = ORDER_FIRST_TICK;
    const plain = nextSettleTick(w);
    w.farSkip = 1;
    expect(nextSettleTick(w)).toBe(plain);
  });
});

describe('AK-W2 Fenster und Fehlmenge', () => {
  it('am Fensterrand: Fehlmenge und Restzeit', () => {
    const r = contractWarning(withContract(0));
    expect(r).toMatchObject({
      good: 'rum',
      island: HOME,
      amount: 5,
      stock: 0,
      missing: 5,
      reason: 'stock',
      restTicks: CONTRACT_WARN_TICKS,
    });
  });

  it('ausserhalb des Fensters null', () => {
    const w = withContract(0);
    w.tick -= 1;
    expect(contractWarning(w)).toBeNull();
  });

  it('genug Lager: null', () => {
    expect(contractWarning(withContract(5))).toBeNull();
  });

  it('ohne Vertrag: null', () => {
    const w = withContract(0);
    w.contract = null;
    expect(contractWarning(w)).toBeNull();
  });
});

describe('AK-W3 Ausgang', () => {
  it('vor der Treue: break mit Strafe', () => {
    const w = withContract(0, CONTRACT_LOYAL_AFTER - 1);
    expect(contractWarning(w)).toMatchObject({
      outcome: 'break',
      penalty: contractPenalty(w.contract!),
    });
  });

  it('treu: excuse ohne Strafe', () => {
    const r = contractWarning(withContract(0, CONTRACT_LOYAL_AFTER));
    expect(r).toMatchObject({ outcome: 'excuse', penalty: 0 });
  });
});

describe('AK-W4 behebbare Gründe', () => {
  it('Kontor fehlt: kontor', () => {
    const w = withContract(12);
    w.contract!.island = 1;
    w.islands[1]!.kontorId = null;
    expect(contractWarning(w)).toMatchObject({ reason: 'kontor' });
  });

  it('Sperre: null', () => {
    const w = withContract(0);
    w.unlocked = w.unlocked.filter((u) => u !== FUNCTION_ENTRY.orders);
    expect(contractWarning(w)).toBeNull();
  });

  it('fehlende Insel: null', () => {
    const w = withContract(0);
    w.contract!.island = 99;
    expect(contractWarning(w)).toBeNull();
  });
});

describe('AK-W5 reine Lesefunktion', () => {
  it('verändert die Welt nicht', () => {
    const w = withContract(0);
    const before = JSON.stringify(w);
    contractWarning(w);
    nextSettleTick(w);
    expect(JSON.stringify(w)).toBe(before);
  });
});

describe('AK-W6 Konstante', () => {
  it('ganzzahlig und kleiner als eine Periode', () => {
    expect(Number.isInteger(CONTRACT_WARN_TICKS)).toBe(true);
    expect(CONTRACT_WARN_TICKS).toBeGreaterThan(0);
    expect(CONTRACT_WARN_TICKS).toBeLessThan(ORDER_PERIOD);
  });
});

describe('Probe R738 farSkip', () => {
  it('nextOrderTick weicht ab, abgerechnet wird am nextSettleTick', () => {
    const w = withContract(60);
    w.farSkip = 1;
    w.tick = ORDER_FIRST_TICK + 10;
    expect(nextOrderTick(w)).not.toBe(nextSettleTick(w));
    const money = w.money;
    w.tick = nextSettleTick(w) - 1;
    const r = step(w);
    expect(r.contract).toMatchObject({ kind: 'delivered' });
    expect(w.money).toBeGreaterThan(money);
  });
});
