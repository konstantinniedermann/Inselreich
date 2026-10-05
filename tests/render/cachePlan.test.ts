import { describe, expect, it } from 'vitest';
import { SLICE_MS, createCachePlan, type CacheJob } from '../../src/render/cachePlan';

/** Fake-Uhr: jeder Schritt kostet `cost` ms. */
function setup(costs: { a: number[]; b: number[] }) {
  let t = 0;
  const ran: string[] = [];
  const mk = (island: number, name: string, cs: number[]): CacheJob => ({
    island,
    steps: cs.map((c, i) => () => {
      ran.push(`${name}${i}`);
      t += c;
    }),
  });
  const plan = createCachePlan([mk(1, 'A', costs.a), mk(2, 'B', costs.b)], () => t);
  return { plan, ran };
}
const same = (n: number, c: number): number[] => Array.from({ length: n }, () => c);

describe('M12 E1 Terrain', () => {
  it('AK-E1-11 SLICE_MS ist 8', () => {
    expect(SLICE_MS).toBe(8);
  });

  it('AK-E1-11 nach create läuft kein Schritt', () => {
    const { plan, ran } = setup({ a: same(6, 3), b: same(9, 3) });
    expect(ran).toEqual([]);
    expect(plan.done(1)).toBe(false);
    expect(plan.sliceMs).toEqual([]);
  });

  it('AK-E1-11 idle: jede Scheibe höchstens 8 ms, A vollständig vor dem ersten B-Schritt', () => {
    const { plan, ran } = setup({ a: same(6, 3), b: same(9, 3) });
    let guard = 0;
    while (!plan.done(2) && guard++ < 50) {
      const ms = plan.idle();
      expect(ms).toBeLessThanOrEqual(SLICE_MS);
    }
    expect(plan.done(1)).toBe(true);
    expect(plan.done(2)).toBe(true);
    expect(plan.sliceMs.length).toBe(8); // 3 Scheiben für A, 5 für B
    expect(plan.sliceMs.every((m) => m <= SLICE_MS)).toBe(true);
    expect(ran.indexOf('B0')).toBeGreaterThan(ran.indexOf('A5'));
    expect(ran.length).toBe(15);
    expect(plan.idle()).toBe(0);
    expect(plan.sliceMs.length).toBe(8);
  });

  it('AK-E1-11 finish mitten in B: Rest sofort, Dauer in emergencyMs', () => {
    const { plan, ran } = setup({ a: same(6, 3), b: same(9, 3) });
    for (let i = 0; i < 4; i++) plan.idle(); // A fertig, B 2 Schritte
    expect(plan.done(1)).toBe(true);
    expect(plan.done(2)).toBe(false);
    const before = ran.length;
    const ms = plan.finish(2);
    expect(plan.done(2)).toBe(true);
    expect(ran.length).toBe(15);
    expect(ran.length - before).toBeGreaterThan(0);
    expect(plan.emergencyMs).toEqual([ms]);
    expect(ms).toBe((ran.length - before) * 3);
    expect(plan.finish(2)).toBe(0);
    expect(plan.emergencyMs.length).toBe(1);
  });

  it('AK-E1-11 ein Schritt von 11 ms: die Scheibe ist genau dieser Schritt', () => {
    const { plan, ran } = setup({ a: [11, 1, 1], b: [] });
    expect(plan.idle()).toBe(11);
    expect(ran).toEqual(['A0']);
    expect(plan.sliceMs).toEqual([11]);
  });
});
