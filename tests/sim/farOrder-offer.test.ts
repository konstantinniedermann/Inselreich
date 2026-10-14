// Handel 2 T04: Fernangebot am Periodenbeginn, Rotation, Sperren (AK-H2-01 bis 07, 32; R633 T3).
import { describe, expect, it } from 'vitest';
import { FUNCTION_ENTRY } from '../../src/sim/defs/unlocks';
import { ORDER_DURATION } from '../../src/sim/defs/timing';
import { cancelContract, maxHouseTier, orderForPeriod } from '../../src/sim/orders';
import { step } from '../../src/sim/tick';
import type { Tier, World } from '../../src/sim/types';
import { dropKontor, farWorld, islandOf, periodStart, stepAt } from './farHelpers';

const woodContract = (w: World): void => {
  w.contract = { good: 'wood', amount: 1, price: 1, island: 0 };
};

/** Läuft per `step` bis Tick `t` (Uhr steht danach auf `t`). */
function runTo(w: World, t: number, each?: () => void): void {
  while (w.tick < t) {
    step(w);
    each?.();
  }
}

describe('AK-H2-01 Angebot neben dem Zufallsauftrag', () => {
  it('Zufallsauftrag unverändert, Fernangebot rum 15 / 450 auf Felsbucht', () => {
    const w = farWorld(3, ['B']);
    stepAt(w, periodStart(2));
    expect(w.order).toEqual({
      period: 2,
      ...orderForPeriod(3, 2, 3),
      due: periodStart(2) + ORDER_DURATION,
    });
    expect('island' in w.order!).toBe(false);
    expect(w.farOffer).toEqual({ island: islandOf(w, 'B'), good: 'rum', amount: 15, reward: 450 });
  });
});

describe('AK-H2-02 kein Angebot ohne Kontor oder bei Sperre', () => {
  it('ohne Fremdkontor kein Angebot, Zufallsauftrag bleibt', () => {
    const w = farWorld(3, []);
    stepAt(w, periodStart(2));
    expect(w.farOffer).toBeNull();
    expect(w.order).toEqual({
      period: 2,
      ...orderForPeriod(3, 2, 3),
      due: periodStart(2) + ORDER_DURATION,
    });
  });
  it('Aufträge gesperrt: kein Angebot', () => {
    const w = farWorld(3, ['B']);
    w.unlocked = w.unlocked.filter((u) => u !== FUNCTION_ENTRY.orders);
    stepAt(w, periodStart(2));
    expect(w.farOffer).toBeNull();
  });
});

describe('AK-H2-03 Stufe und Gut', () => {
  it('Weidenau (Glas, Stufe 4) erst ab Stufe 4', () => {
    const low = farWorld(3, ['C']);
    stepAt(low, periodStart(2));
    expect(low.farOffer).toBeNull();
    const w = farWorld(4, ['C']);
    stepAt(w, periodStart(2));
    expect(w.farOffer).toEqual({
      island: islandOf(w, 'C'),
      good: 'glass',
      amount: 12,
      reward: 444,
    });
  });
  it('Möweninsel (Stoff) ab Stufe 2: 20 Stück, 440', () => {
    const w = farWorld(2, ['A']);
    stepAt(w, periodStart(2));
    expect(w.farOffer).toEqual({
      island: islandOf(w, 'A'),
      good: 'cloth',
      amount: 20,
      reward: 440,
    });
  });
});

describe('AK-H2-04 Rotation ohne Zufall', () => {
  const seq = (tier: Tier): string[] => {
    const w = farWorld(tier, ['A', 'B', 'C']);
    const kind = (i: number): string => w.islands[i]!.kind;
    const out: string[] = [];
    stepAt(w, periodStart(0));
    out.push(kind(w.farOffer!.island));
    for (let k = 1; k <= 5; k++) {
      runTo(w, periodStart(k));
      out.push(kind(w.farOffer!.island));
    }
    return out;
  };
  it('Stufe 4: A B C A B C', () => {
    expect(seq(4)).toEqual(['A', 'B', 'C', 'A', 'B', 'C']);
  });
  it('Stufe 3: A B A B A B', () => {
    expect(seq(3)).toEqual(['A', 'B', 'A', 'B', 'A', 'B']);
  });
  it('Stufe 2: stets A', () => {
    expect(seq(2)).toEqual(['A', 'A', 'A', 'A', 'A', 'A']);
  });
});

describe('AK-H2-05 Vertrag', () => {
  it('erfüllbarer Vertrag: weder Auftrag noch Fernangebot', () => {
    const w = farWorld(3, ['B']);
    woodContract(w);
    w.islands[0]!.stock.wood = 5;
    stepAt(w, periodStart(2));
    expect(w.order).toBeNull();
    expect(w.farOffer).toBeNull();
  });
  it('Vertragsbruch im Tick: Auftrag und Fernangebot', () => {
    const w = farWorld(3, ['B']);
    woodContract(w);
    w.islands[0]!.stock.wood = 0;
    stepAt(w, periodStart(2));
    expect(w.contract).toBeNull();
    expect(w.order).not.toBeNull();
    expect(w.farOffer).not.toBeNull();
  });
});

describe('AK-H2-06 Verfall', () => {
  it('besteht bis P + 600, verfällt mit dem Auftrag bei P + 601', () => {
    const P = periodStart(2);
    const a = farWorld(3, ['B']);
    stepAt(a, P);
    runTo(a, P + 600);
    expect(a.order).not.toBeNull();
    expect(a.farOffer).not.toBeNull();
    const b = farWorld(3, ['B']);
    stepAt(b, P);
    stepAt(b, P + 601);
    expect(b.order).toBeNull();
    expect(b.farOffer).toBeNull();
  });
});

describe('AK-H2-07 Angebot bleibt', () => {
  it('Kontor abgerissen: Angebot unverändert bis P + 600', () => {
    const P = periodStart(2);
    const w = farWorld(3, ['B']);
    stepAt(w, P);
    const offer = { ...w.farOffer! };
    dropKontor(w, islandOf(w, 'B'));
    runTo(w, P + 600);
    expect(w.farOffer).toEqual(offer);
  });
});

describe('AK-H2-32 Vertrag unterdrückt Zufalls- und Fernangebot', () => {
  it('über vier Perioden nie Auftrag oder Angebot; nach Kündigung beides', () => {
    const w = farWorld(3, ['B']);
    woodContract(w);
    w.islands[0]!.stock.wood = 999;
    const k = 2;
    stepAt(w, periodStart(k));
    for (let j = k; j < k + 3; j++) {
      runTo(w, periodStart(j + 1) - 1, () => {
        expect(w.farOffer).toBeNull();
        expect(w.order).toBeNull();
      });
      stepAt(w, periodStart(j + 1));
      expect(w.farOffer).toBeNull();
      expect(w.order).toBeNull();
    }
    expect(w.contract).not.toBeNull();
    runTo(w, periodStart(k + 4) - 1);
    expect(cancelContract(w).ok).toBe(true);
    stepAt(w, periodStart(k + 4));
    expect(w.order).not.toBeNull();
    expect(w.farOffer).not.toBeNull();
  });
});

describe('R13 Zufallsauftrag unabhängig von Fremdkontoren', () => {
  it.each([1, 2, 3, 4] as Tier[])(
    'Stufe %i: Perioden 0 bis 19 gleich mit und ohne Kontore',
    (tier) => {
      for (let k = 0; k < 20; k++) {
        const without = farWorld(tier, []);
        const withKontor = farWorld(tier, ['A', 'B', 'C']);
        stepAt(without, periodStart(k));
        stepAt(withKontor, periodStart(k));
        expect(withKontor.order).toEqual(without.order);
        expect(withKontor.order).toMatchObject(orderForPeriod(3, k, maxHouseTier(withKontor)));
      }
    },
  );
});
