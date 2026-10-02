import { describe, expect, it } from 'vitest';
import { openSettings } from '../../src/ui/settingsPanel';

describe('Einstellungs-Karte', () => {
  it('exportiert openSettings (Karte nutzt den gemeinsamen Modal-Stapel)', () => {
    expect(typeof openSettings).toBe('function');
  });
});
