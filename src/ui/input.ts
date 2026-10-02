import { canPlace, canPlaceRoad } from '../sim/placement';
import type { World } from '../sim/types';
import { tileAt } from '../sim/world';
import { clampToMap, zoomAt } from '../render/camera';
import type { Tool } from '../render/renderer';
import type { GameState } from './app';
import { hotkeyAction, type HotkeyAction } from './hotkeys';
import { isModalOpen } from './modal';
import { targetTile } from './target';

export type InputAction =
  | { type: 'tile'; x: number; y: number; dragging: boolean }
  | { type: 'cancel' }
  | { type: 'hotkey'; action: HotkeyAction }
  | { type: 'dragEnd' };

/** Tastatur-Pan in Bildschirm-Pixeln je Sekunde (= 16 px je Frame bei 60 fps). */
export const PAN_PX_PER_S = 960;
export const DRAG_THRESHOLD = 4;
export type KeyTarget = { tagName: string; isContentEditable?: boolean };
export type Pt = { x: number; y: number };
const PAN_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright']);

/** Kamera- und Abbruch-Tasten wirken auch bei fokussiertem Knopf, nicht in Eingabefeldern oder bei offener Karte. */
export function panKeyAllowed(target: KeyTarget | null, modalOpen: boolean): boolean {
  if (modalOpen) return false;
  if (target === null) return true;
  if (target.isContentEditable === true) return false;
  return !['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Zieht der Zeiger weiter als die Schwelle (euklidisch, CSS-px) vom Startpunkt weg? */
export function exceedsDrag(start: Pt, p: Pt): boolean {
  return Math.hypot(p.x - start.x, p.y - start.y) > DRAG_THRESHOLD;
}

/** Klick, wenn der Zeiger auf dem ganzen Weg unter der Schwelle blieb. */
export function isClick(start: Pt, path: readonly Pt[]): boolean {
  return !path.some((p) => exceedsDrag(start, p));
}

/** Abriss-Vorschau rot: Gebäude (ausser Kontor) oder Weg auf der Kachel. */
export function canDemolishTile(world: World, x: number, y: number): boolean {
  const tile = tileAt(world, x, y);
  return !!tile && ((tile.buildingId !== null && tile.buildingId !== world.kontorId) || tile.road);
}

/** Schlüssel für den Cursor-Hinweis: der Text ändert sich nur mit Kachel oder Werkzeug. */
export function hintKey(h: { x: number; y: number; tool: Tool | null }): string {
  const t = h.tool;
  return `${h.x},${h.y},${t ? `${t.kind}:${t.kind === 'build' ? t.defId : ''}` : 'none'}`;
}

/** Weltpixel, um die die Kamera bei gedrückter Pan-Taste in `dtMs` wandert (unabhängig von der Framerate). */
export function panDelta(dtMs: number, zoom: number): number {
  return (PAN_PX_PER_S * dtMs) / 1000 / zoom;
}

export interface InputBinding {
  /** Pro Frame aufrufen (`dtMs` = Frame-Dauer): verschiebt die Kamera bei gedrückten Pfeil-/WASD-Tasten. */
  applyKeys(dtMs: number): void;
  /** Bricht eine laufende Pointer-Aktion (Ziehen, Touch-Geste) ab, ohne dass etwas gebaut wird. */
  cancelPointerAction(): void;
  /** Berechnet die Vorschau an der letzten Zeigerposition neu (nach einem Werkzeugwechsel). */
  refreshHover(): void;
  /** Letzte Zeigerposition in Fensterkoordinaten; `null`, wenn der Zeiger die Karte verlassen hat. */
  pointerClient(): { x: number; y: number } | null;
  /** Entfernt alle Listener, die `bindInput` registriert hat. */
  unbind(): void;
}

/** Bindet Maus und Tastatur an Canvas und Fenster. */
export function bindInput(
  canvas: HTMLCanvasElement,
  state: GameState,
  onAction: (action: InputAction) => void,
): InputBinding {
  const keys = new Set<string>();
  let spaceDown = false;
  let pointer: { sx: number; sy: number } | null = null;
  let client: { x: number; y: number } | null = null;
  let drag: {
    button: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    panning: boolean;
    lastTile: string | null;
    /** Werkzeug war beim Drücken "Weg" (unabhängig von späteren Werkzeugwechseln). */
    road: boolean;
    pointerId: number;
    /** Touch: Aktion erst beim Loslassen, und zwar auf der Drück-Kachel. */
    touch: boolean;
    /** Zielkachel beim Drücken; `null` ausserhalb der Karte. */
    downTile: { x: number; y: number } | null;
    /** Maus-Auswahl: wirkt erst beim Loslassen, Ziehen ab der Schwelle schwenkt stattdessen. */
    select: boolean;
  } | null = null;
  /** Aktive Finger (nur Touch). Bei zwei Fingern läuft eine Pinch-/Pan-Geste. */
  const touches = new Map<number, { sx: number; sy: number }>();
  let gesture: { dist: number; mx: number; my: number } | null = null;

  const local = (e: MouseEvent): { sx: number; sy: number } => {
    const r = canvas.getBoundingClientRect();
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  };
  const clamp = (): void => {
    clampToMap(
      state.cam,
      { w: state.world.width, h: state.world.height },
      canvas.clientWidth,
      canvas.clientHeight,
    );
  };

  const updateHover = (): void => {
    if (!pointer) {
      state.hover = null;
      return;
    }
    const tool = state.tool;
    const t = targetTile(state.world, state.cam, tool, pointer.sx, pointer.sy);
    if (!t) {
      state.hover = null;
      return;
    }
    let ok = true;
    if (tool.kind === 'build') ok = canPlace(state.world, tool.defId, t.x, t.y).ok;
    else if (tool.kind === 'road') ok = canPlaceRoad(state.world, t.x, t.y).ok;
    else if (tool.kind === 'demolish') ok = canDemolishTile(state.world, t.x, t.y);
    state.hover = { x: t.x, y: t.y, tool, ok };
  };

  const tileAction = (sx: number, sy: number, dragging: boolean): void => {
    const t = targetTile(state.world, state.cam, state.tool, sx, sy);
    if (!t) return;
    onAction({ type: 'tile', x: t.x, y: t.y, dragging });
  };

  /** Bricht Ein-Zeiger-Aktion ab; eine Weg-Zug-Serie wird mit `dragEnd` sauber beendet. */
  const cancelPointerAction = (): void => {
    const wasRoadDrag = drag !== null && !drag.panning && drag.road;
    drag = null;
    gesture = null;
    if (wasRoadDrag) onAction({ type: 'dragEnd' });
    updateHover();
  };

  const twoFingers = (): [{ sx: number; sy: number }, { sx: number; sy: number }] | null => {
    const it = touches.values();
    const a = it.next().value;
    const b = it.next().value;
    return a && b ? [a, b] : null;
  };
  const gestureOf = (): { dist: number; mx: number; my: number } | null => {
    const two = twoFingers();
    if (!two) return null;
    const [a, b] = two;
    return {
      dist: Math.hypot(a.sx - b.sx, a.sy - b.sy),
      mx: (a.sx + b.sx) / 2,
      my: (a.sy + b.sy) / 2,
    };
  };

  const onContextMenu = (e: MouseEvent): void => e.preventDefault();

  const onPointerDown = (e: PointerEvent): void => {
    const p = local(e);
    const isTouch = e.pointerType === 'touch';
    if (isTouch) {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      touches.set(e.pointerId, p);
      if (touches.size >= 2) {
        // Zweiter Finger: Ein-Finger-Aktion abbrechen, Geste starten
        cancelPointerAction();
        gesture = gestureOf();
        return;
      }
    }
    if (e.button === 2) {
      onAction({ type: 'cancel' });
      return;
    }
    const wantsPan = e.button === 1 || (e.button === 0 && spaceDown);
    if (e.button !== 0 && e.button !== 1) return;
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    drag = {
      button: e.button,
      startX: p.sx,
      startY: p.sy,
      lastX: p.sx,
      lastY: p.sy,
      panning: wantsPan,
      lastTile: null,
      road: !wantsPan && state.tool.kind === 'road',
      pointerId: e.pointerId,
      touch: isTouch,
      downTile: targetTile(state.world, state.cam, state.tool, p.sx, p.sy),
      select: !wantsPan && !isTouch && state.tool.kind === 'select',
    };
    if (wantsPan) return;
    if (drag.road && !isTouch) {
      // Maus: erste Weg-Kachel sofort; Touch wartet auf Ziehen oder Loslassen (Zwei-Finger-Geste baut nichts)
      drag.lastTile = drag.downTile ? `${drag.downTile.x},${drag.downTile.y}` : null;
      tileAction(p.sx, p.sy, false);
      pointer = p;
      updateHover();
    } else if (!isTouch && !drag.select) {
      // Maus: Bau und Abriss wirken sofort auf der Drück-Kachel (Auswahl erst beim Loslassen)
      tileAction(p.sx, p.sy, false);
      pointer = p;
      updateHover();
    }
  };

  const onPointerMove = (e: PointerEvent): void => {
    const p = local(e);
    client = { x: e.clientX, y: e.clientY };
    if (e.pointerType === 'touch' && touches.has(e.pointerId)) {
      touches.set(e.pointerId, p);
      if (touches.size >= 2) {
        const g = gestureOf();
        if (g && gesture && gesture.dist > 0 && g.dist > 0) {
          state.cam.x -= (g.mx - gesture.mx) / state.cam.zoom;
          state.cam.y -= (g.my - gesture.my) / state.cam.zoom;
          zoomAt(
            state.cam,
            g.dist / gesture.dist,
            g.mx,
            g.my,
            { w: canvas.clientWidth, h: canvas.clientHeight },
            { w: state.world.width, h: state.world.height },
          );
          clamp();
        }
        gesture = g;
        return;
      }
    }
    pointer = p;
    if (drag && drag.pointerId === e.pointerId) {
      if (
        !drag.panning &&
        drag.select &&
        exceedsDrag({ x: drag.startX, y: drag.startY }, { x: p.sx, y: p.sy })
      ) {
        drag.panning = true;
      }
      if (drag.panning) {
        state.cam.x -= (p.sx - drag.lastX) / state.cam.zoom;
        state.cam.y -= (p.sy - drag.lastY) / state.cam.zoom;
        clamp();
      } else if (drag.road) {
        if (drag.touch && drag.lastTile === null && drag.downTile) {
          // Touch: erst über der Zieh-Schwelle beginnt die Serie auf der Drück-Kachel
          if (Math.hypot(p.sx - drag.startX, p.sy - drag.startY) <= DRAG_THRESHOLD) {
            drag.lastX = p.sx;
            drag.lastY = p.sy;
            updateHover();
            return;
          }
          drag.lastTile = `${drag.downTile.x},${drag.downTile.y}`;
          tileAction(drag.startX, drag.startY, false);
        }
        // Weg-Zug immer über die Bodenkachel; ausserhalb der Karte ignorieren
        const t = targetTile(state.world, state.cam, state.tool, p.sx, p.sy);
        const key = t ? `${t.x},${t.y}` : null;
        if (t && key !== drag.lastTile) {
          // Start ausserhalb der Karte: erste Kachel im Feld selbst setzen
          if (drag.lastTile === null) onAction({ type: 'tile', x: t.x, y: t.y, dragging: true });
          const from = drag.lastTile?.split(',').map(Number) ?? [t.x, t.y];
          let cx = from[0] ?? t.x;
          let cy = from[1] ?? t.y;
          // Kachelweise von der letzten zur neuen Kachel laufen, damit keine Lücken entstehen
          while (cx !== t.x || cy !== t.y) {
            if (Math.abs(t.x - cx) >= Math.abs(t.y - cy)) cx += Math.sign(t.x - cx);
            else cy += Math.sign(t.y - cy);
            onAction({ type: 'tile', x: cx, y: cy, dragging: true });
          }
          drag.lastTile = key;
        }
      }
      drag.lastX = p.sx;
      drag.lastY = p.sy;
    }
    updateHover();
  };

  const endDrag = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') {
      touches.delete(e.pointerId);
      gesture = null;
    }
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (!drag || drag.pointerId !== e.pointerId || e.button !== drag.button) return;
    const d = drag;
    drag = null;
    if (d.panning || d.button !== 0) return;
    if (d.select && !d.touch) {
      const up = local(e);
      if (d.downTile && !exceedsDrag({ x: d.startX, y: d.startY }, { x: up.sx, y: up.sy })) {
        onAction({ type: 'tile', x: d.downTile.x, y: d.downTile.y, dragging: false });
      }
    } else if (d.road) {
      // Touch-Tippen ohne Ziehen: einzelne Weg-Kachel auf der Drück-Kachel
      if (d.touch && d.lastTile === null && d.downTile) {
        onAction({ type: 'tile', x: d.downTile.x, y: d.downTile.y, dragging: false });
      }
      onAction({ type: 'dragEnd' });
    } else if (d.touch && d.downTile) {
      // Touch: Aktion beim Loslassen, aber auf der Drück-Kachel
      onAction({ type: 'tile', x: d.downTile.x, y: d.downTile.y, dragging: false });
    }
    // Maus: Bau/Abriss/Strassen liefen schon beim Drücken; Auswahl beim Loslassen (oben)
    updateHover();
  };
  const onPointerCancel = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') touches.delete(e.pointerId);
    if (drag && drag.pointerId !== e.pointerId) return;
    cancelPointerAction();
  };

  const onPointerLeave = (): void => {
    if (drag) return; // bei Capture ignorieren
    pointer = null;
    client = null;
    state.hover = null;
  };

  const onWheel = (e: WheelEvent): void => {
    if (e.deltaY === 0) return;
    e.preventDefault();
    const p = local(e);
    pointer = p;
    zoomAt(
      state.cam,
      e.deltaY < 0 ? 1.1 : 1 / 1.1,
      p.sx,
      p.sy,
      { w: canvas.clientWidth, h: canvas.clientHeight },
      { w: state.world.width, h: state.world.height },
    );
    updateHover();
  };

  /** Eingabefelder (ohne Buttons: ein fokussierter Knopf soll Hotkeys und Kamera-Tasten erlauben). */
  const isTextField = (t: EventTarget | null): boolean =>
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement ||
    (t instanceof HTMLElement && t.isContentEditable);

  const onKeyDown = (e: KeyboardEvent): void => {
    const target: KeyTarget | null =
      e.target instanceof HTMLElement
        ? { tagName: e.target.tagName, isContentEditable: e.target.isContentEditable }
        : null;
    const modal = isModalOpen();
    const hot = hotkeyAction(
      e.key,
      { ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey },
      isTextField(e.target) || modal,
    );
    if (hot) {
      if (!e.repeat) onAction({ type: 'hotkey', action: hot });
      e.preventDefault();
      return;
    }
    if (!panKeyAllowed(target, modal)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') {
      onAction({ type: 'cancel' });
    } else if (k === ' ') {
      // Auf Knöpfen bleibt die Leertaste deren Aktivierung (R121 Punkt 3)
      if (target?.tagName === 'BUTTON') return;
      spaceDown = true;
      e.preventDefault();
    } else if (PAN_KEYS.has(k)) {
      keys.add(k);
      e.preventDefault();
    }
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    // Immer löschen, damit nichts hängen bleibt (z. B. Fokuswechsel während der Taste)
    const k = e.key.toLowerCase();
    if (k === ' ') spaceDown = false;
    keys.delete(k);
  };
  const onBlur = (): void => {
    keys.clear();
    spaceDown = false;
  };

  canvas.addEventListener('contextmenu', onContextMenu);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);

  const unbind = (): void => {
    canvas.removeEventListener('contextmenu', onContextMenu);
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', endDrag);
    canvas.removeEventListener('pointercancel', onPointerCancel);
    canvas.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('wheel', onWheel);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
  };

  const applyKeys = (dtMs: number): void => {
    const step = panDelta(Math.max(0, dtMs), 1);
    let dx = 0;
    let dy = 0;
    if (keys.has('a') || keys.has('arrowleft')) dx -= step;
    if (keys.has('d') || keys.has('arrowright')) dx += step;
    if (keys.has('w') || keys.has('arrowup')) dy -= step;
    if (keys.has('s') || keys.has('arrowdown')) dy += step;
    if (dx !== 0 || dy !== 0) {
      state.cam.x += dx / state.cam.zoom;
      state.cam.y += dy / state.cam.zoom;
      clamp();
      updateHover();
    }
  };

  return {
    applyKeys,
    cancelPointerAction,
    refreshHover: updateHover,
    pointerClient: () => client,
    unbind,
  };
}
