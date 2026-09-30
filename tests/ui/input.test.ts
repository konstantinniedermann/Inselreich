import { describe, expect, it } from 'vitest';
import { PAN_PX_PER_S, panDelta } from '../../src/ui/input';

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
