// T03 (c): isSaveChord lebt in saveChord.ts, ohne hotkeys (und damit ohne sim/defs) zu laden.
import { describe, expect, it } from 'vitest';
import { isSaveChord } from '../../src/ui/saveChord';

const NONE = { ctrl: false, meta: false, alt: false, shift: false };

describe('saveChord', () => {
  it('nur Strg/Cmd+S ohne Alt/Umschalt', () => {
    expect(isSaveChord('s', { ...NONE, ctrl: true })).toBe(true);
    expect(isSaveChord('S', { ...NONE, ctrl: true })).toBe(true);
    expect(isSaveChord('s', { ...NONE, meta: true })).toBe(true);
    expect(isSaveChord('s', { ctrl: true, meta: false, alt: false })).toBe(true);
    expect(isSaveChord('s', { ...NONE, ctrl: true, alt: true })).toBe(false);
    expect(isSaveChord('s', { ...NONE, ctrl: true, shift: true })).toBe(false);
    expect(isSaveChord('s', NONE)).toBe(false);
    expect(isSaveChord('a', { ...NONE, ctrl: true })).toBe(false);
  });
});
