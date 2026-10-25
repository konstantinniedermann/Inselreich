import { describe, expect, it } from 'vitest';
import { TOAST_MS, toastLifetimeMs } from '../../src/ui/messages';

describe('I-176 Toast-Lebensdauer', () => {
  it.each([
    ['warn', 7000],
    ['info', 3000],
    ['error', 3000],
  ] as const)('AK-J1/J1b: %s lebt %i ms', (kind, ms) => {
    expect(toastLifetimeMs(kind)).toBe(ms);
  });

  it('AK-J1b: Tabelle deckt alle Arten ab', () => {
    expect(Object.keys(TOAST_MS).sort()).toEqual(['error', 'info', 'warn']);
  });
});
