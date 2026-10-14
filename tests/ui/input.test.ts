import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
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
  bindInput,
  type InputAction,
} from '../../src/ui/input';
import type { GameState } from '../../src/ui/app';
import { clampToRect, worldToScreen } from '../../src/render/camera';
import { project } from '../../src/render/iso';
import { targetTile } from '../../src/ui/target';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { tileAt } from '../../src/sim/world';
import { canPlaceRoad } from '../../src/sim/placement';
import { uxWorld } from './worlds';
import type { Camera } from '../../src/render/camera';

const modalFlag = vi.hoisted(() => ({ open: false }));
vi.mock('../../src/ui/modal', () => ({ isModalOpen: () => modalFlag.open }));
const toast = vi.hoisted(() => ({ calls: [] as string[] }));
vi.mock('../../src/ui/messages', () => ({
  showMessage: (t: string) => toast.calls.push(t),
}));

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

  describe('Weg mit Winkel: Zugmodus (AK-17, AK-18, AK-14)', () => {
    type Handler = (e: unknown) => void;
    class FakeEl {
      tagName = 'BODY';
      isContentEditable = false;
    }
    const listeners = new Map<string, Handler[]>();
    const fakeWindow = {
      addEventListener: (t: string, h: Handler) =>
        listeners.set(t, [...(listeners.get(t) ?? []), h]),
      removeEventListener: () => {},
    };
    const canvasHandlers = new Map<string, Handler>();
    const fakeCanvas = {
      ownerDocument: { getElementById: () => null },
      clientWidth: 800,
      clientHeight: 600,
      getBoundingClientRect: () => ({ left: 0, top: 0, right: 800, bottom: 600 }),
      addEventListener: (t: string, h: Handler) => canvasHandlers.set(t, h),
      removeEventListener: () => {},
      setPointerCapture: () => {},
      releasePointerCapture: () => {},
      hasPointerCapture: () => false,
    };

    function setup(tool: { kind: string } = { kind: 'road' }): {
      actions: InputAction[];
      at: (dx: number, dy: number) => { clientX: number; clientY: number };
      ptr: (type: string, init: Record<string, unknown>) => void;
      key: (
        type: 'keydown' | 'keyup',
        init: Record<string, unknown>,
      ) => { defaultPrevented: boolean };
      a: { x: number; y: number };
    } {
      vi.stubGlobal('window', fakeWindow);
      vi.stubGlobal('HTMLElement', FakeEl);
      vi.stubGlobal('HTMLInputElement', class {});
      vi.stubGlobal('HTMLTextAreaElement', class {});
      vi.stubGlobal('HTMLSelectElement', class {});
      const { w } = uxWorld();
      // Drei Wegkacheln in einer Reihe (x, x+1, x+2) auf gleicher Zeile
      const isl = w.islands[0]!;
      let a = { x: 0, y: 0 };
      outer: for (let y = 0; y < isl.height; y++)
        for (let x = 0; x + 3 < isl.width; x++)
          if ([0, 1, 2, 3].every((d) => canPlaceRoad(w, x + d, y, 0).ok)) {
            a = { x, y };
            break outer;
          }
      const p = project(a.x + 0.5, a.y + 0.5);
      const cam: Camera = { x: p.x - 400, y: p.y - 300, zoom: 1 };
      const state = { world: w, cam, tool, hover: null } as unknown as GameState;
      const actions: InputAction[] = [];
      bindInput(fakeCanvas as unknown as HTMLCanvasElement, state, (act) => actions.push(act));
      const at = (dx: number, dy: number): { clientX: number; clientY: number } => {
        const s = worldToScreen(cam, project(a.x + dx + 0.5, a.y + dy + 0.5));
        return { clientX: s.x, clientY: s.y };
      };
      const ptr = (type: string, init: Record<string, unknown>): void =>
        canvasHandlers.get(type)!({
          button: 0,
          pointerType: 'mouse',
          pointerId: 1,
          ctrlKey: false,
          metaKey: false,
          shiftKey: false,
          preventDefault() {},
          ...init,
        });
      const key = (
        type: 'keydown' | 'keyup',
        init: Record<string, unknown>,
      ): { defaultPrevented: boolean } => {
        const e = {
          key: 'x',
          ctrlKey: false,
          metaKey: false,
          altKey: false,
          shiftKey: false,
          repeat: false,
          timeStamp: 0,
          target: new FakeEl(),
          defaultPrevented: false,
          preventDefault() {
            this.defaultPrevented = true;
          },
          ...init,
        };
        for (const h of listeners.get(type) ?? []) h(e);
        return e;
      };
      return { actions, at, ptr, key, a };
    }

    afterEach(() => {
      listeners.clear();
      canvasHandlers.clear();
      toast.calls.length = 0;
      vi.unstubAllGlobals();
    });

    it('AK-17 Umschalt beim Aufsetzen: kein Bau beim Drücken, Vorschau beim Ziehen, Bau beim Loslassen', () => {
      const { actions, at, ptr, a } = setup();
      ptr('pointerdown', { ...at(0, 0), shiftKey: true });
      // nur Vorschau der Start-Kachel, nichts gebaut
      expect(actions).toEqual([{ type: 'roadLine', phase: 'update', island: 0, from: a, to: a }]);
      ptr('pointermove', { ...at(2, 0), shiftKey: true });
      expect(actions.at(-1)).toEqual({
        type: 'roadLine',
        phase: 'update',
        island: 0,
        from: a,
        to: { x: a.x + 2, y: a.y },
      });
      ptr('pointerup', { ...at(2, 0), shiftKey: true });
      expect(actions.at(-1)).toEqual({ type: 'roadLine', phase: 'commit' });
      expect(actions.some((x) => x.type === 'tile')).toBe(false);
    });

    it('AK-17 ohne Umschalt unverändert: Kachel beim Drücken, kein roadLine', () => {
      const { actions, at, ptr } = setup();
      ptr('pointerdown', { ...at(0, 0) });
      ptr('pointermove', { ...at(2, 0) });
      ptr('pointerup', { ...at(2, 0) });
      expect(actions.some((x) => x.type === 'tile')).toBe(true);
      expect(actions.some((x) => x.type === 'roadLine')).toBe(false);
    });

    it('AK-17 Umschalt erst später gedrückt: kein Linienmodus', () => {
      const { actions, at, ptr, key } = setup();
      ptr('pointerdown', { ...at(0, 0) });
      key('keydown', { key: 'Shift', shiftKey: true });
      ptr('pointermove', { ...at(2, 0), shiftKey: true });
      ptr('pointerup', { ...at(2, 0), shiftKey: true });
      expect(actions.some((x) => x.type === 'roadLine')).toBe(false);
      expect(actions.filter((x) => x.type === 'tile').length).toBeGreaterThan(1);
    });

    it('AK-14/17 Umschalt loslassen mitten im Zug ändert den Modus nicht', () => {
      const { actions, at, ptr, key } = setup();
      ptr('pointerdown', { ...at(0, 0), shiftKey: true });
      ptr('pointermove', { ...at(1, 0), shiftKey: true });
      key('keyup', { key: 'Shift' });
      ptr('pointermove', { ...at(3, 0), shiftKey: false });
      ptr('pointerup', { ...at(3, 0), shiftKey: false });
      expect(
        actions.filter((x) => x.type === 'roadLine').map((x) => (x as { phase: string }).phase),
      ).toEqual(['update', 'update', 'update', 'commit']);
      expect(actions.some((x) => x.type === 'tile')).toBe(false);
    });

    it('AK-18 Esc im Zug: Abbruch ohne Bau, späteres Loslassen tut nichts', () => {
      const { actions, at, ptr, key } = setup();
      ptr('pointerdown', { ...at(0, 0), shiftKey: true });
      ptr('pointermove', { ...at(2, 0), shiftKey: true });
      actions.length = 0;
      key('keydown', { key: 'Escape' });
      expect(actions).toEqual([{ type: 'roadLine', phase: 'cancel' }]);
      ptr('pointerup', { ...at(2, 0), shiftKey: true });
      expect(actions).toEqual([{ type: 'roadLine', phase: 'cancel' }]);
    });

    it('AK-UA3-01 Rechtsklick im Linienzug: nur der Zug endet, kein cancel (Werkzeug bleibt)', () => {
      const { actions, at, ptr } = setup();
      ptr('pointerdown', { ...at(0, 0), shiftKey: true });
      ptr('pointermove', { ...at(2, 0), shiftKey: true });
      actions.length = 0;
      ptr('pointerdown', { ...at(2, 0), button: 2, shiftKey: true });
      expect(actions).toContainEqual({ type: 'roadLine', phase: 'cancel' });
      expect(actions.some((x) => x.type === 'cancel')).toBe(false);
    });

    it('AK-UA3-02 zweiter Rechtsklick ohne Zug sendet cancel wie bisher', () => {
      const { actions, at, ptr } = setup();
      ptr('pointerdown', { ...at(0, 0), shiftKey: true });
      ptr('pointerdown', { ...at(0, 0), button: 2 });
      actions.length = 0;
      ptr('pointerdown', { ...at(0, 0), button: 2 });
      expect(actions).toEqual([{ type: 'cancel' }]);
    });

    it('AK-UA3-03 Esc und erster Rechtsklick im Zug haben dieselbe Wirkung', () => {
      const run = (how: 'esc' | 'right'): InputAction[] => {
        const { actions, at, ptr, key } = setup();
        ptr('pointerdown', { ...at(0, 0), shiftKey: true });
        ptr('pointermove', { ...at(2, 0), shiftKey: true });
        actions.length = 0;
        if (how === 'esc') key('keydown', { key: 'Escape' });
        else ptr('pointerdown', { ...at(2, 0), button: 2 });
        const out = [...actions];
        listeners.clear();
        canvasHandlers.clear();
        return out;
      };
      expect(run('right')).toEqual(run('esc'));
    });

    it('I-098 Chrome: contextmenu im Linienzug beendet nur den Zug, danach baut pointerup nichts', () => {
      const { actions, at, ptr } = setup();
      ptr('pointerdown', { ...at(0, 0), shiftKey: true });
      ptr('pointermove', { ...at(2, 0), shiftKey: true });
      actions.length = 0;
      ptr('contextmenu', {});
      expect(actions).toEqual([{ type: 'roadLine', phase: 'cancel' }]);
      ptr('pointerup', { ...at(2, 0), shiftKey: true });
      expect(actions).toEqual([{ type: 'roadLine', phase: 'cancel' }]);
    });

    it('I-098 contextmenu ohne Zug sendet nichts; nach pointerdown b2 im Zug kein Doppel-cancel', () => {
      const { actions, at, ptr } = setup();
      ptr('contextmenu', {});
      expect(actions).toEqual([]);
      ptr('pointerdown', { ...at(0, 0), shiftKey: true });
      actions.length = 0;
      ptr('pointerdown', { ...at(0, 0), button: 2 });
      ptr('contextmenu', {});
      expect(actions).toEqual([{ type: 'roadLine', phase: 'cancel' }]);
    });

    it('Abriss-Strich (drag.demolish): Rechtsklick sendet weiter cancel (unverändert)', () => {
      const { actions, at, ptr } = setup({ kind: 'demolish' });
      ptr('pointerdown', { ...at(0, 0) });
      actions.length = 0;
      ptr('pointerdown', { ...at(0, 0), button: 2 });
      expect(actions.some((x) => x.type === 'cancel')).toBe(true);
    });

    it('Weg-Strich (drag.road): Rechtsklick sendet weiter cancel (unverändert)', () => {
      const { actions, at, ptr } = setup();
      ptr('pointerdown', { ...at(0, 0) });
      actions.length = 0;
      ptr('pointerdown', { ...at(0, 0), button: 2 });
      expect(actions.some((x) => x.type === 'cancel')).toBe(true);
    });

    it('AK-18 pointercancel im Zug: Abbruch ohne Bau', () => {
      const { actions, at, ptr } = setup();
      ptr('pointerdown', { ...at(0, 0), shiftKey: true });
      ptr('pointermove', { ...at(2, 0), shiftKey: true });
      actions.length = 0;
      ptr('pointercancel', {});
      expect(actions).toEqual([{ type: 'roadLine', phase: 'cancel' }]);
    });

    it('AK-14 Umschalt allein löst keine Taste aus; Umschalt+U bleibt Ausbau', () => {
      const { actions, key } = setup();
      key('keydown', { key: 'Shift', shiftKey: true });
      expect(actions).toEqual([]);
      key('keydown', { key: 'U', shiftKey: true });
      expect(actions).toEqual([{ type: 'hotkey', action: { kind: 'upgrade' } }]);
    });

    it('Ziffernhinweis (T01-Review): Toast bei 5, keiner bei e.repeat', () => {
      const { key } = setup();
      key('keydown', { key: '5' });
      expect(toast.calls).toEqual(['Tempo: 1, 2, 3']);
      key('keydown', { key: '5', repeat: true });
      expect(toast.calls).toHaveLength(1);
    });
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

// UI-TASTEN T02: bindInput mit Fake-Fenster (Vitest läuft in Node, ohne DOM).
describe('UI-TASTEN keydown-Verdrahtung (AK-UT-05, 06, 10)', () => {
  class FakeEl {
    tagName = 'BODY';
    isContentEditable = false;
  }
  class FakeInput extends FakeEl {
    override tagName = 'INPUT';
  }
  type Handler = (e: unknown) => void;
  const listeners = new Map<string, Handler[]>();
  const fakeWindow = {
    addEventListener: (t: string, h: Handler) => listeners.set(t, [...(listeners.get(t) ?? []), h]),
    removeEventListener: (t: string, h: Handler) =>
      listeners.set(
        t,
        (listeners.get(t) ?? []).filter((x) => x !== h),
      ),
  };
  const canvasHandlers = new Map<string, Handler>();
  const fakeCanvas = {
    ownerDocument: { getElementById: () => null },
    clientWidth: 800,
    clientHeight: 600,
    getBoundingClientRect: () => ({ left: 0, top: 0, right: 800, bottom: 600 }),
    addEventListener: (t: string, h: Handler) => canvasHandlers.set(t, h),
    removeEventListener: () => {},
    setPointerCapture: () => {},
    releasePointerCapture: () => {},
    hasPointerCapture: () => false,
  };

  function setup(tool: GameState['tool'] = { kind: 'select' }): {
    actions: InputAction[];
    press: (init: Record<string, unknown>) => { defaultPrevented: boolean };
    binding: ReturnType<typeof bindInput>;
  } {
    vi.stubGlobal('window', fakeWindow);
    vi.stubGlobal('HTMLElement', FakeEl);
    vi.stubGlobal('HTMLInputElement', FakeInput);
    vi.stubGlobal('HTMLTextAreaElement', class {});
    vi.stubGlobal('HTMLSelectElement', class {});
    const { w } = uxWorld();
    const state = {
      world: w,
      cam: { x: 0, y: 0, zoom: 1 },
      tool,
      hover: null,
    } as unknown as GameState;
    const actions: InputAction[] = [];
    const binding = bindInput(fakeCanvas as unknown as HTMLCanvasElement, state, (a) =>
      actions.push(a),
    );
    const press = (init: Record<string, unknown>): { defaultPrevented: boolean } => {
      const e = {
        key: 'x',
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
        repeat: false,
        timeStamp: 0,
        target: new FakeEl(),
        defaultPrevented: false,
        preventDefault() {
          this.defaultPrevented = true;
        },
        ...init,
      };
      for (const h of listeners.get('keydown') ?? []) h(e);
      return e;
    };
    return { actions, press, binding };
  }

  afterEach(() => {
    listeners.clear();
    canvasHandlers.clear();
    modalFlag.open = false;
    vi.unstubAllGlobals();
  });

  it('onKeyDown nutzt keyDownVerdict (kein Inline-Duplikat, Quelltext)', () => {
    const src = readFileSync('src/ui/input.ts', 'utf8');
    const a = src.indexOf('const onKeyDown = ');
    const body = src.slice(a, src.indexOf('\n  };', a));
    expect(body).toContain('keyDownVerdict(');
    expect(body).not.toContain('!e.repeat');
  });

  it('Entf ohne Zug löst demolishSelected aus, preventDefault gesetzt', () => {
    const { actions, press } = setup();
    expect(press({ key: 'Delete' }).defaultPrevented).toBe(true);
    expect(actions).toEqual([{ type: 'hotkey', action: { kind: 'demolishSelected' } }]);
  });

  it('Entf mit repeat löst nichts aus (UT-06), Browser-Standard bleibt unterdrückt', () => {
    const { actions, press } = setup();
    expect(press({ key: 'Delete', repeat: true }).defaultPrevented).toBe(true);
    expect(actions).toEqual([]);
  });

  it('Entf im laufenden Abriss-Zug löst nichts aus (UT-05)', () => {
    const { actions, press, binding } = setup({ kind: 'demolish' });
    canvasHandlers.get('pointerdown')!({
      button: 0,
      pointerType: 'mouse',
      pointerId: 1,
      clientX: 5,
      clientY: 5,
      ctrlKey: false,
      metaKey: false,
      preventDefault() {},
    });
    expect(binding.isDragging()).toBe(true);
    actions.length = 0;
    expect(press({ key: 'Delete' }).defaultPrevented).toBe(true);
    expect(actions).toEqual([]);
  });

  it('Strg+S im Modal: defaultPrevented ohne Aktion (UT-10)', () => {
    modalFlag.open = true;
    const { actions, press } = setup();
    expect(press({ key: 's', ctrlKey: true }).defaultPrevented).toBe(true);
    expect(press({ key: 'S', metaKey: true }).defaultPrevented).toBe(true);
    expect(actions).toEqual([]);
  });

  it('Strg+S im Textfeld: defaultPrevented ohne Aktion (UT-10)', () => {
    const { actions, press } = setup();
    expect(press({ key: 's', ctrlKey: true, target: new FakeInput() }).defaultPrevented).toBe(true);
    expect(actions).toEqual([]);
  });

  it('Strg+S sonst: save-Aktion, kein Browser-Dialog', () => {
    const { actions, press } = setup();
    expect(press({ key: 's', ctrlKey: true }).defaultPrevented).toBe(true);
    expect(actions).toEqual([{ type: 'hotkey', action: { kind: 'save' } }]);
  });
});

// app.ts braucht das DOM und ist in Vitest (Node) nicht startbar: Quelltext prüfen (B5, ein Codeweg je Wirkung).
describe('UI-TASTEN app.ts Verdrahtung (Quelltext, B5)', () => {
  const src = readFileSync('src/ui/app.ts', 'utf8');
  const block = (start: string, end: string): string => {
    const a = src.indexOf(start);
    expect(a).toBeGreaterThan(-1);
    return src.slice(a, src.indexOf(end, a));
  };

  it('AK-UT-08 Knopf nach Esc trägt wieder DEMOLISH_LABEL, kein Literal', () => {
    expect(src).toContain('demolishBtn.textContent = DEMOLISH_LABEL');
    expect(src).not.toContain("textContent = 'Abreissen'");
  });

  it('Abreissen-Knopf und Entf teilen demolishFromPanel(id)', () => {
    expect(src).toContain('demolish: (id) => demolishFromPanel(id),');
    const fn = block('const demolishFromPanel = ', '\n  };');
    expect(fn).toContain('demolishBuilding(id)');
    expect(fn).toContain("sound.play('demolish')");
    expect(fn).toContain("setPanel({ kind: 'none' })");
    const hk = block("h.kind === 'demolishSelected'", '} else if');
    expect(hk).toContain('demolishTarget(state.panel, world)');
    expect(hk).toContain('demolishFromPanel(t.id)');
    expect(hk).toContain('showError(t.reason)');
  });

  it('Menü-Speichern und Strg/Cmd+S teilen saveManual()', () => {
    expect(src).toContain('save: () => saveManual(),');
    const fn = block('const saveManual = ', '\n  };');
    expect(fn).toContain('saveToStorage(world)');
    expect(fn).toContain("showMessage('Gespeichert')");
    expect(fn).toContain("showMessage(r.reason, 'error')");
    expect(fn).not.toContain('sound.play');
    const hk = block("h.kind === 'save'", '} else if');
    expect(hk).toContain('saveManual()');
  });
});
