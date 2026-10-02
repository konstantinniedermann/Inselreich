import { describe, expect, it } from 'vitest';
import { PAN_PX_PER_S, exceedsDrag, isClick, panDelta, panKeyAllowed } from '../../src/ui/input';

describe('panDelta (Q2, AK-U1a-02)', () => {
  it('Q2: 960 Pixel je Sekunde bei Zoom 1', () => {
    expect(PAN_PX_PER_S).toBe(960);
    expect(panDelta(1000, 1)).toBe(960);
  });

  it('Q2: bei 60 fps und Zoom 2 rund 8 Weltpixel je Frame', () => {
    expect(panDelta(16.67, 2)).toBeCloseTo(8, 1);
  });

  it('Q2: unabhängig von der Aufteilung in Frames', () => {
    expect(2 * panDelta(500, 1)).toBeCloseTo(panDelta(1000, 1), 9);
    expect(60 * panDelta(1000 / 60, 1.5)).toBeCloseTo(panDelta(1000, 1.5), 9);
  });

  it('Q2: Dauer 0 ergibt keine Bewegung', () => {
    expect(panDelta(0, 1)).toBe(0);
  });
});

describe('Eingabe M7-UX (AK-UX-12)', () => {
  it('AK-UX-12 panKeyAllowed', () => {
    for (const tagName of ['BUTTON', 'BODY', 'CANVAS'])
      expect(panKeyAllowed({ tagName }, false)).toBe(true);
    expect(panKeyAllowed(null, false)).toBe(true);
    for (const tagName of ['INPUT', 'SELECT', 'TEXTAREA'])
      expect(panKeyAllowed({ tagName }, false)).toBe(false);
    expect(panKeyAllowed({ tagName: 'DIV', isContentEditable: true }, false)).toBe(false);
    expect(panKeyAllowed({ tagName: 'BUTTON' }, true)).toBe(false);
  });

  it('AK-UX-12 Abstandsmetrik euklidisch in CSS-px, einmal überschritten bleibt Ziehen', () => {
    const s = { x: 0, y: 0 };
    expect(exceedsDrag(s, { x: 4, y: 0 })).toBe(false);
    expect(exceedsDrag(s, { x: 5, y: 0 })).toBe(true);
    expect(exceedsDrag(s, { x: 2, y: 3 })).toBe(false);
    expect(exceedsDrag(s, { x: 3, y: 3 })).toBe(true);
    expect(
      isClick(s, [
        { x: 6, y: 0 },
        { x: 0, y: 0 },
      ]),
    ).toBe(false);
    expect(
      isClick(s, [
        { x: 1, y: 1 },
        { x: 2, y: 2 },
      ]),
    ).toBe(true);
  });
});
