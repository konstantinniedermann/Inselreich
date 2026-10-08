import { describe, expect, it } from 'vitest';
import {
  PAN_PX_PER_S,
  exceedsDrag,
  isClick,
  isDragPaintTool,
  isPipetteClick,
  panDelta,
  panKeyAllowed,
  spaceKeyRole,
  visibleViewHeight,
} from '../../src/ui/input';
import { clampToRect, worldToScreen } from '../../src/render/camera';
import { project } from '../../src/render/iso';

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

describe('M10 Zieh-Werkzeuge (Kann K5)', () => {
  it('Weg, Roden und Aufforsten wirken beim Ziehen je Kachel; Bauen, Abriss und Auswahl nicht', () => {
    expect(isDragPaintTool({ kind: 'road' })).toBe(true);
    expect(isDragPaintTool({ kind: 'clearForest' })).toBe(true);
    expect(isDragPaintTool({ kind: 'plantForest' })).toBe(true);
    expect(isDragPaintTool({ kind: 'demolish' })).toBe(false);
    expect(isDragPaintTool({ kind: 'select' })).toBe(false);
    expect(isDragPaintTool({ kind: 'build', defId: 'house' })).toBe(false);
  });
});

describe('TASTEN-KOMFORT Eingabe-Helfer', () => {
  const none = { ctrl: false, meta: false, alt: false };

  it('AK-TK-08 spaceKeyRole', () => {
    expect(spaceKeyRole({ tagName: 'BUTTON' }, false, none)).toBe('button');
    for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT'])
      expect(spaceKeyRole({ tagName }, false, none)).toBe('ignore');
    expect(spaceKeyRole({ tagName: 'DIV', isContentEditable: true }, false, none)).toBe('ignore');
    expect(spaceKeyRole({ tagName: 'CANVAS' }, true, none)).toBe('ignore');
    for (const m of ['ctrl', 'meta', 'alt'])
      expect(spaceKeyRole({ tagName: 'CANVAS' }, false, { ...none, [m]: true })).toBe('ignore');
    expect(spaceKeyRole(null, false, none)).toBe('map');
    expect(spaceKeyRole({ tagName: 'CANVAS' }, false, none)).toBe('map');
    expect(spaceKeyRole({ tagName: 'DIV' }, false, none)).toBe('map');
  });

  it('AK-TK-10 isPipetteClick', () => {
    const no = { ctrl: false, meta: false };
    expect(isPipetteClick(0, { ...no, ctrl: true }, false, false)).toBe(true);
    expect(isPipetteClick(0, { ...no, meta: true }, false, false)).toBe(true);
    expect(isPipetteClick(0, no, false, false)).toBe(false);
    expect(isPipetteClick(1, { ...no, ctrl: true }, false, false)).toBe(false);
    expect(isPipetteClick(2, { ...no, ctrl: true }, false, false)).toBe(false);
    expect(isPipetteClick(0, { ...no, ctrl: true }, true, false)).toBe(false);
    expect(isPipetteClick(0, { ...no, ctrl: true }, false, true)).toBe(false);
  });
});

describe('Kamera-Sicht bei offener Bauleiste (UI-PANEL T5a)', () => {
  it('zieht die Overlay-Höhe von der Kartenhöhe ab', () => {
    expect(visibleViewHeight(574, 36)).toBe(538);
    expect(visibleViewHeight(574, 0)).toBe(574);
  });

  it('klemmt Ausreisser: nie unter 1, kein negatives Overlay', () => {
    expect(visibleViewHeight(30, 100)).toBe(1);
    expect(visibleViewHeight(574, -5)).toBe(574);
  });

  it('südlichste Kachel liegt bei maximal südlicher Kamera über dem Overlay', () => {
    const bounds = { x0: 0, y0: 0, x1: 40, y1: 40 };
    const H = 574;
    const ov = 36;
    const cam = { x: 0, y: 1e6, zoom: 1 };
    clampToRect(cam, bounds, 800, visibleViewHeight(H, ov));
    const south = worldToScreen(cam, project(40, 40));
    expect(south.y).toBeLessThanOrEqual(H - ov);
  });
});
