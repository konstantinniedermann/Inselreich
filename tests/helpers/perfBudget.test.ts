import { describe, expect, it } from 'vitest';
import { perfBudget } from './perfBudget';

describe('RF-H-T1 perfBudget', () => {
  it('RF-H-T1 Faktor 1 ohne CI', () => {
    expect(perfBudget(1500, {})).toBe(1500);
  });
  it('RF-H-T1 Faktor 1,5 bei CI=true', () => {
    expect(perfBudget(1500, { CI: 'true' })).toBe(2250);
  });
  it('RF-H-T1 Faktor 1,5 bei CI=1', () => {
    expect(perfBudget(1500, { CI: '1' })).toBe(2250);
  });
  it('RF-H-T1 Faktor 1 bei CI=false oder leer', () => {
    expect(perfBudget(1500, { CI: 'false' })).toBe(1500);
    expect(perfBudget(1500, { CI: '' })).toBe(1500);
  });
  it('RF-H-T1 R235 eigener Faktor nur bei CI, Default bleibt 1,5', () => {
    expect(perfBudget(8, { CI: 'true' }, 2.5)).toBe(20);
    expect(perfBudget(8, {}, 2.5)).toBe(8);
    expect(perfBudget(8, { CI: 'true' })).toBe(12);
  });
});
