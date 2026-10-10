import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  PAN_PX_PER_S,
  exceedsDrag,
  isClick,
  isDragPaintTool,
  isPipetteClick,
  demolishStroke,
  strokeEndNotice,
  strokePickTool,
  panDelta,
  panKeyAllowed,
  spaceKeyRole,
  pointerInRect,
  visibleViewHeight,
} from '../../src/ui/input';
import { clampToRect, worldToScreen } from '../../src/render/camera';
import { project } from '../../src/render/iso';
import { targetTile } from '../../src/ui/target';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { tileAt } from '../../src/sim/world';
import { uxWorld } from './worlds';
import type { Camera } from '../../src/render/camera';

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
  it('Weg, Roden, Aufforsten und (REL-17 Abriss) Abriss wirken beim Ziehen je Kachel; Bauen und Auswahl nicht', () => {
    expect(isDragPaintTool({ kind: 'road' })).toBe(true);
    expect(isDragPaintTool({ kind: 'clearForest' })).toBe(true);
    expect(isDragPaintTool({ kind: 'plantForest' })).toBe(true);
    expect(isDragPaintTool({ kind: 'demolish' })).toBe(true);
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

describe('Zeiger unter dem Overlay (UI-PANEL T5 Fix)', () => {
  const rect = { left: 0, top: 500, right: 800, bottom: 536 };
  it('erkennt einen Zeiger innerhalb der Overlay-Fläche', () => {
    expect(pointerInRect({ x: 100, y: 510 }, rect)).toBe(true);
    expect(pointerInRect({ x: 100, y: 499 }, rect)).toBe(false);
    expect(pointerInRect({ x: 801, y: 510 }, rect)).toBe(false);
  });
  it('ohne Zeiger oder ohne Overlay: nein', () => {
    expect(pointerInRect(null, rect)).toBe(false);
    expect(pointerInRect({ x: 1, y: 1 }, null)).toBe(false);
  });
});

describe('REL-17 Abriss-Zug (AK-R17-12…16)', () => {
  it('AK-R17-12 demolishStroke: Gebäude → false; Weg, Gras, null → true', () => {
    const { w, kx, ky, fisher } = uxWorld();
    expect(demolishStroke(w, { island: 0, x: fisher.x, y: fisher.y })).toBe(false);
    expect(tileAt(w.islands[0]!, kx + 3, ky)!.road).toBe(true);
    expect(demolishStroke(w, { island: 0, x: kx + 3, y: ky })).toBe(true);
    expect(demolishStroke(w, { island: 0, x: kx + 3, y: ky + 6 })).toBe(true);
    expect(demolishStroke(w, null)).toBe(true);
  });

  it('AK-R17-12 strokePickTool: Abriss → Weg, übrige unverändert', () => {
    expect(strokePickTool({ kind: 'demolish' })).toEqual({ kind: 'road' });
    for (const t of [
      { kind: 'road' },
      { kind: 'clearForest' },
      { kind: 'select' },
      { kind: 'build', defId: 'house' },
    ] as const)
      expect(strokePickTool(t)).toBe(t);
  });

  it('AK-R17-12 Bildpunkt über der Hülle: Abriss-Zug-Pick = Bodenkachel wie beim Weg', () => {
    const { w, fisher } = uxWorld();
    const c = BUILDING_DEFS.fisher;
    const p = project(fisher.x + c.w / 2 + 0.5, fisher.y + c.h / 2 + 0.5);
    const cam: Camera = { x: p.x - 400, y: p.y - 300, zoom: 1 };
    const sx = 400;
    const sy = 300;
    const road = targetTile(w, cam, { kind: 'road' }, sx, sy);
    expect(targetTile(w, cam, strokePickTool({ kind: 'demolish' }), sx, sy)).toEqual(road);
    expect(targetTile(w, cam, { kind: 'demolish' }, sx, sy)).toEqual({ x: fisher.x, y: fisher.y });
  });

  it('AK-R17-15 strokeEndNotice', () => {
    expect(strokeEndNotice(2, 3, 5)).toEqual({
      kind: 'warn',
      text: 'Abriss trennt 2 Gebäude vom Kontor',
    });
    expect(strokeEndNotice(1, 1, 1)).toEqual({
      kind: 'warn',
      text: 'Abriss trennt 1 Gebäude vom Kontor',
    });
    expect(strokeEndNotice(0, 0, 1)).toEqual({ kind: 'error', reason: 'Kein Weg' });
    expect(strokeEndNotice(0, 0, 4)).toBeNull();
    expect(strokeEndNotice(0, 2, 2)).toBeNull();
  });

  // bindInput braucht Canvas und Window und ist in Vitest (Node) nicht startbar: Quelltext prüfen.
  it('AK-R17-15 pointercancel und blur beenden den Zug mit dragEnd (Quelltext)', () => {
    const src = readFileSync('src/ui/input.ts', 'utf8');
    const blur = src.indexOf('const onBlur = ');
    const cancel = src.indexOf('const onPointerCancel = ');
    expect(blur).toBeGreaterThan(-1);
    expect(cancel).toBeGreaterThan(-1);
    expect(src.slice(blur, src.indexOf('\n  };', blur))).toContain('cancelPointerAction()');
    expect(src.slice(cancel, src.indexOf('\n  };', cancel))).toContain('cancelPointerAction()');
    const cpa = src.indexOf('const cancelPointerAction = ');
    expect(src.slice(cpa, src.indexOf('\n  };', cpa))).toContain("type: 'dragEnd'");
  });

  // app.ts braucht das DOM und ist in Vitest (Node) nicht startbar: Quelltext prüfen (wie AK-R16-06).
  it('AK-R17-13/15 Abriss-Zug in app.ts (Quelltext)', () => {
    const src = readFileSync('src/ui/app.ts', 'utf8');
    const end = src.indexOf("if (a.type === 'dragEnd') {");
    expect(end).toBeGreaterThan(-1);
    const endBlock = src.slice(end, src.indexOf('\n    }\n', end));
    expect(endBlock).toContain('strokeEndNotice(newlyCut(stroke.before, world)');
    expect(endBlock.indexOf('stroke = null')).toBeGreaterThan(endBlock.indexOf('strokeEndNotice('));
    const z = src.indexOf("tool.kind === 'demolish' && a.dragging");
    expect(z).toBeGreaterThan(-1);
    const zBlock = src.slice(z, src.indexOf('\n    } else', z));
    expect(zBlock).toContain('removeRoad');
    expect(zBlock).not.toContain('demolishBuilding');
  });
});
