import { describe, expect, it } from 'vitest';
import { summarize } from '../../src/ui/devProbes';

describe('summarize', () => {
  it('Median und p95', () => {
    const v = Array.from({ length: 100 }, (_, i) => i + 1);
    expect(summarize(v)).toEqual({ median: 50, p95: 95 });
  });
  it('leer und ein Wert', () => {
    expect(summarize([])).toEqual({ median: 0, p95: 0 });
    expect(summarize([7])).toEqual({ median: 7, p95: 7 });
  });
  it('ändert die Eingabe nicht', () => {
    const v = [3, 1, 2];
    summarize(v);
    expect(v).toEqual([3, 1, 2]);
  });
});
