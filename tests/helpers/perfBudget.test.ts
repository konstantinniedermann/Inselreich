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
});
