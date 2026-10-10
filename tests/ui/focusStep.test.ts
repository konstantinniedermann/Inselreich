import { describe, expect, it } from 'vitest';
import { stepList, type ProblemCursor, type ProblemSort } from '../../src/ui/problems';

interface Item {
  key: string;
  sort: ProblemSort;
}
const it_ = (key: string, n: number): Item => ({ key, sort: [1, 0, n, n] });
const A = it_('a', 1);
const B = it_('b', 2);
const C = it_('c', 3);
const list = [A, B, C];
const cur = (item: Item, anchor = 0, landed = 0): ProblemCursor => ({
  key: item.key,
  sort: item.sort,
  anchor,
  landed,
});

describe('stepList', () => {
  it('ohne Cursor: vorwärts erster, rückwärts letzter Eintrag', () => {
    expect(stepList(() => list, null, 0, 1)?.item).toBe(A);
    expect(stepList(() => list, null, 0, -1)?.item).toBe(C);
    expect(stepList(() => list, null, 0, 1)).toMatchObject({ index: 1, count: 3 });
  });

  it('leere Liste liefert null', () => {
    expect(stepList(() => [] as Item[], null, 0, 1)).toBeNull();
  });

  it('Nachfolger und Vorgänger mit Umlauf', () => {
    expect(stepList(() => list, cur(A), 0, 1)?.item).toBe(B);
    expect(stepList(() => list, cur(C), 0, 1)?.item).toBe(A);
    expect(stepList(() => list, cur(A), 0, -1)?.item).toBe(C);
    expect(stepList(() => list, cur(B), 0, -1)?.item).toBe(A);
  });

  it('Rückfall nach entferntem Cursor-Eintrag', () => {
    const gone = it_('x', 2.5);
    expect(stepList(() => list, cur(gone), 0, 1)?.item).toBe(C);
    expect(stepList(() => list, cur(gone), 0, -1)?.item).toBe(B);
    const hi = it_('y', 9);
    expect(stepList(() => list, cur(hi), 0, 1)?.item).toBe(A);
    const lo = it_('z', 0);
    expect(stepList(() => list, cur(lo), 0, -1)?.item).toBe(C);
  });

  it('Cursor mit fremdem landed wird wie null behandelt', () => {
    expect(stepList(() => list, cur(B, 0, 5), 0, 1)?.item).toBe(A);
    expect(stepList(() => list, cur(B, 0, 5), 0, -1)?.item).toBe(C);
  });

  it('reicht anchor des Cursors an listFor, sonst activeIsland', () => {
    const seen: number[] = [];
    const f = (a: number): Item[] => {
      seen.push(a);
      return list;
    };
    const r = stepList(f, cur(A, 7, 2), 2, 1);
    stepList(f, null, 4, 1);
    expect(seen).toEqual([7, 4]);
    expect(r?.cursor).toEqual({ key: 'b', sort: B.sort, anchor: 7 });
  });
});
