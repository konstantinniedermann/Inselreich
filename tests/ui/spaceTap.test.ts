import { describe, expect, it } from 'vitest';
import { SPACE_TAP_MAX_MS, createSpaceTap } from '../../src/ui/spaceTap';

describe('spaceTap (AK-TK-01..07)', () => {
  it('AK-TK-01 kurzes Tippen löst beim Loslassen aus', () => {
    const s = createSpaceTap();
    s.keyDown(0, false);
    expect(s.keyUp(120)).toBe('toggle');
  });

  it('AK-TK-02 Grenze 299/300 ms', () => {
    expect(SPACE_TAP_MAX_MS).toBe(300);
    const a = createSpaceTap();
    a.keyDown(0, false);
    expect(a.keyUp(299)).toBe('toggle');
    const b = createSpaceTap();
    b.keyDown(0, false);
    expect(b.keyUp(300)).toBe('none');
  });

  it('AK-TK-03 Zeiger-Druck verdirbt den Tipp', () => {
    const s = createSpaceTap();
    s.keyDown(0, false);
    s.pointerDown();
    expect(s.keyUp(100)).toBe('none');
  });

  it('AK-TK-04 Wiederholung setzt den Start nicht neu und startet nichts', () => {
    const s = createSpaceTap();
    s.keyDown(0, false);
    s.keyDown(250, true);
    expect(s.keyUp(320)).toBe('none');
    const r = createSpaceTap();
    r.keyDown(0, true);
    expect(r.keyUp(50)).toBe('none');
  });

  it('AK-TK-05 keyUp ohne keyDown', () => {
    expect(createSpaceTap().keyUp(100)).toBe('none');
  });

  it('AK-TK-06 blur verwirft die Erkennung', () => {
    const s = createSpaceTap();
    s.keyDown(0, false);
    s.blur();
    expect(s.keyUp(100)).toBe('none');
    s.keyDown(200, false);
    expect(s.keyUp(300)).toBe('toggle');
  });

  it('AK-TK-07 zwei Tipps nacheinander; nach verdorbenem Druck wieder frei', () => {
    const s = createSpaceTap();
    s.keyDown(0, false);
    expect(s.keyUp(100)).toBe('toggle');
    s.keyDown(400, false);
    expect(s.keyUp(500)).toBe('toggle');
    s.keyDown(600, false);
    s.pointerDown();
    expect(s.keyUp(650)).toBe('none');
    s.keyDown(700, false);
    expect(s.keyUp(750)).toBe('toggle');
  });

  it('keyUp mit Zeit vor dem Start ergibt nichts', () => {
    const s = createSpaceTap();
    s.keyDown(100, false);
    expect(s.keyUp(50)).toBe('none');
  });
});
