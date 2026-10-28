import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { CONTRACT_LOYAL_AFTER as N, GOODS } from '../../src/sim/defs/goods';
import { islandName } from '../../src/sim/islands';
import { HOME, createWorld } from '../../src/sim/world';
import type { Contract, ContractEvent } from '../../src/sim/types';
import type { StepReport } from '../../src/sim/tick';
import { announceContract, contractNotice, loyaltyText, orderCardText } from '../../src/ui/order';

const contract = (deliveries: number): Contract => ({
  good: 'rum',
  amount: 5,
  price: 27,
  island: HOME,
  deliveries,
});

describe('I-091 Treue: Texte (AK-TR-17, 18)', () => {
  it('AK-TR-17a loyaltyText', () => {
    expect(loyaltyText(contract(0))).toBe(`Treue 0/${N}`);
    expect(loyaltyText(contract(N - 1))).toBe(`Treue ${N - 1}/${N}`);
    expect(loyaltyText(contract(N))).toBe('treu: verzeiht einmal');
    expect(loyaltyText(contract(99))).toBe('treu: verzeiht einmal');
  });

  it('AK-TR-17b Karte endet mit dem Treue-Baustein', () => {
    for (const n of [0, N]) {
      const w = createWorld(3, { unlockAll: true });
      w.order = null;
      const c = contract(n);
      w.contract = c;
      const t = orderCardText(w);
      expect(t.endsWith(` · ${loyaltyText(c)}`)).toBe(true);
      expect(t).toContain(`Lager ${w.islands[HOME]!.stock.rum}/${c.amount}`);
    }
  });

  it('AK-TR-17c keine Ziffer im Rumpf von loyaltyText', () => {
    const src = readFileSync('src/ui/order.ts', 'utf8');
    const start = src.indexOf('export function loyaltyText');
    expect(start).toBeGreaterThan(-1);
    const end = src.indexOf('\n}', start);
    expect(src.slice(start, end)).not.toMatch(/\d/);
  });

  const w = createWorld(3, { unlockAll: true });
  const name = GOODS.rum.name;

  it('AK-TR-18a Kulanz: zu wenig Ware', () => {
    expect(
      contractNotice({ kind: 'excused', good: 'rum', reason: 'stock', island: HOME }, w),
    ).toEqual({
      text: `Stammkunde wartet: zu wenig ${name}, diesmal ohne Strafe`,
      kind: 'warn',
      sound: 'error',
    });
  });

  it('AK-TR-18b Kulanz: kein Kontor', () => {
    expect(
      contractNotice({ kind: 'excused', good: 'rum', reason: 'kontor', island: 1 }, w),
    ).toEqual({
      text: `Stammkunde wartet: kein Kontor auf ${islandName(w, 1)}, diesmal ohne Strafe`,
      kind: 'warn',
      sound: 'error',
    });
  });

  const delivered = (loyal: boolean, becameLoyal: boolean): ContractEvent => ({
    kind: 'delivered',
    good: 'rum',
    amount: 5,
    pay: 135,
    island: HOME,
    loyal,
    becameLoyal,
  });

  it('AK-TR-18c Lieferung macht treu', () => {
    expect(contractNotice(delivered(true, true), w)).toEqual({
      text: `Stammkunde: 5 ${name} geliefert, +135 · treu: verzeiht einen Fehlbestand`,
      kind: 'info',
      sound: 'orderDone',
    });
  });

  it('AK-TR-18d sonst der I-047-Text', () => {
    for (const [l, b] of [
      [true, false],
      [false, false],
    ] as const) {
      expect(contractNotice(delivered(l, b), w).text).toBe(`Stammkunde: 5 ${name} geliefert, +135`);
    }
  });

  it('AK-TR-18e announceContract meldet Kulanz einmal', () => {
    const out = { show: vi.fn(), play: vi.fn() };
    const rep: StepReport = {
      lost: [],
      titheLost: {},
      contract: { kind: 'excused', good: 'rum', reason: 'stock', island: HOME },
      petitions: [],
    };
    announceContract([rep], out, w);
    expect(out.show).toHaveBeenCalledTimes(1);
    expect(out.show).toHaveBeenCalledWith(expect.stringContaining('diesmal ohne Strafe'), 'warn');
    expect(out.play).toHaveBeenCalledTimes(1);
    expect(out.play).toHaveBeenCalledWith('error');
  });
});
