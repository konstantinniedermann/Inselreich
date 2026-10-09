import { canClearForest, canPlantForest } from '../sim/forest';
import { canPlace, canPlaceRoad } from '../sim/placement';
import { functionLock } from '../sim/unlocks';
import type { World } from '../sim/types';
import { HOME, tileAt } from '../sim/world';
import { cameraBounds } from '../render/archipel';
import { clampToRect, zoomAt } from '../render/camera';
import { makeVisibleHeight } from './cameraView';
import { shipAt } from '../render/shipLane';
import type { Tool } from '../render/renderer';
import type { GameState } from './app';
import { hotkeyAction, type HotkeyAction } from './hotkeys';
import { isModalOpen } from './modal';
import { pickTarget, type IslandTile } from './islandTools';
import { createSpaceTap } from './spaceTap';

export { visibleViewHeight } from './cameraView';

export type InputAction =
  | { type: 'tile'; island: number; x: number; y: number; dragging: boolean }
  | { type: 'ship'; id: number }
  | { type: 'cancel' }
  | { type: 'hotkey'; action: HotkeyAction }
  | { type: 'pipette'; island: number; x: number; y: number }
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

/**
 * Rolle der Leertaste: `button` = Knopf-Aktivierung (bleibt), `ignore` = Eingabefeld, offene Karte
 * oder Strg/Cmd/Alt, `map` = Karte (Schwenken, Antippen = Pause).
 */
export function spaceKeyRole(
  target: KeyTarget | null,
  modalOpen: boolean,
  mods: { ctrl: boolean; meta: boolean; alt: boolean },
): 'button' | 'ignore' | 'map' {
  if (target?.tagName === 'BUTTON') return 'button';
  if (mods.ctrl || mods.meta || mods.alt) return 'ignore';
  return panKeyAllowed(target, modalOpen) ? 'map' : 'ignore';
}

/** Pipetten-Klick: linke Taste mit Strg/Cmd, nicht Touch, Leertaste (Pan) nicht gehalten. */
export function isPipetteClick(
  button: number,
  mods: { ctrl: boolean; meta: boolean },
  spaceDown: boolean,
  touch: boolean,
): boolean {
  return button === 0 && (mods.ctrl || mods.meta) && !spaceDown && !touch;
}

/** Zieht der Zeiger weiter als die Schwelle (euklidisch, CSS-px) vom Startpunkt weg? */
export function exceedsDrag(start: Pt, p: Pt): boolean {
  return Math.hypot(p.x - start.x, p.y - start.y) > DRAG_THRESHOLD;
}

/** Schlüssel einer Zielkachel samt Insel (Weg-Zug: Vergleich mit der letzten Kachel). */
function tileKey(t: IslandTile): string {
  return `${t.island}:${t.x},${t.y}`;
}

/** Klick, wenn der Zeiger auf dem ganzen Weg unter der Schwelle blieb. */
export function isClick(start: Pt, path: readonly Pt[]): boolean {
  return !path.some((p) => exceedsDrag(start, p));
}

/** Abriss-Vorschau rot: Gebäude (ausser Kontor) oder Weg auf der Kachel. */
export function canDemolishTile(
  world: World,
  x: number,
  y: number,
  island: number = HOME,
): boolean {
  const isl = world.islands[island];
  const tile = isl ? tileAt(isl, x, y) : undefined;
  if (!tile || !isl) return false;
  // Das Kontor der Heimat bleibt stehen; das zweite Kontor meldet seinen Grund beim Abriss (Sim)
  if (tile.buildingId !== null && (island !== HOME || tile.buildingId !== isl.kontorId))
    return true;
  return tile.road;
}

/** Schlüssel für den Cursor-Hinweis: der Text ändert sich nur mit Kachel oder Werkzeug. */
export function hintKey(h: { island?: number; x: number; y: number; tool: Tool | null }): string {
  const t = h.tool;
  return `${h.island ?? HOME}:${h.x},${h.y},${t ? `${t.kind}:${t.kind === 'build' ? t.defId : ''}` : 'none'}`;
}

/** Werkzeuge, die beim Ziehen über mehrere Kacheln je Kachel einmal wirken: Weg, Roden, Aufforsten (Spec K5). */
export function isDragPaintTool(tool: Tool): boolean {
  return tool.kind === 'road' || tool.kind === 'clearForest' || tool.kind === 'plantForest';
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
  /** Läuft gerade eine Zeigeraktion mit gedrückter Taste (Ziehen, Schwenken, Weg-Zug)? */
  isDragging(): boolean;
  /** Sichtbare Kartenhöhe (ohne Bauleisten-Overlay), bei jedem Aufruf neu gelesen. */
  visibleHeight(): number;
  /** Entfernt alle Listener, die `bindInput` registriert hat. */
  unbind(): void;
}

/** Liegt der Zeiger (Fensterkoordinaten) in der Fläche `rect`? Ohne Zeiger oder Fläche: nein. */
export function pointerInRect(
  p: { x: number; y: number } | null,
  rect: { left: number; top: number; right: number; bottom: number } | null,
): boolean {
  return (
    p !== null &&
    rect !== null &&
    p.x >= rect.left &&
    p.x <= rect.right &&
    p.y >= rect.top &&
    p.y <= rect.bottom
  );
}

/** Bindet Maus und Tastatur an Canvas und Fenster. */
export function bindInput(
  canvas: HTMLCanvasElement,
  state: GameState,
  onAction: (action: InputAction) => void,
): InputBinding {
  const keys = new Set<string>();
  let spaceDown = false;
  const spaceTap = createSpaceTap();
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
    /** Werkzeug war beim Drücken Weg, Roden oder Aufforsten, also ein Zieh-Werkzeug (unabhängig von späteren Werkzeugwechseln). */
    road: boolean;
    pointerId: number;
    /** Touch: Aktion erst beim Loslassen, und zwar auf der Drück-Kachel. */
    touch: boolean;
    /** Zielkachel beim Drücken; `null` ausserhalb der Karte. */
    downTile: IslandTile | null;
    /** Maus-Auswahl: wirkt erst beim Loslassen, Ziehen ab der Schwelle schwenkt stattdessen. */
    select: boolean;
  } | null = null;
  /** Aktive Finger (nur Touch). Bei zwei Fingern läuft eine Pinch-/Pan-Geste. */
  const touches = new Map<number, { sx: number; sy: number }>();
  let gesture: { dist: number; mx: number; my: number } | null = null;

  /** Overlay-Höhe: gemerkt, neu gemessen nur nach Umbau der Bauleiste oder `resize` (kein Layout je Frame). */
  let lastOverlayH = 0;
  let overlayDirty = true;
  const markOverlayDirty = (): void => {
    overlayDirty = true;
  };
  const buildbar = canvas.ownerDocument.getElementById('buildbar');
  const overlayObserver =
    buildbar && typeof MutationObserver !== 'undefined'
      ? new MutationObserver(markOverlayDirty)
      : null;
  overlayObserver?.observe(buildbar!, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['hidden'],
  });
  window.addEventListener('resize', markOverlayDirty);
  const local = (e: MouseEvent): { sx: number; sy: number } => {
    const r = canvas.getBoundingClientRect();
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  };
  /** Sichtbare Kartenhöhe: bei offener Kategorie ohne das Bauleisten-Overlay. */
  const viewH = makeVisibleHeight(canvas, () => lastOverlayH);
  const clamp = (): void => {
    clampToRect(state.cam, cameraBounds(state.world.islands), canvas.clientWidth, viewH());
  };

  const updateHover = (): void => {
    if (!pointer) {
      state.hover = null;
      return;
    }
    const tool = state.tool;
    const t = pickTarget(state.world, state.cam, tool, pointer.sx, pointer.sy);
    if (!t) {
      state.hover = null;
      return;
    }
    const w = state.world;
    let ok = true;
    if (tool.kind === 'build') ok = canPlace(w, tool.defId, t.x, t.y, t.island).ok;
    else if (tool.kind === 'road') ok = canPlaceRoad(w, t.x, t.y, t.island).ok;
    else if (tool.kind === 'demolish') ok = canDemolishTile(w, t.x, t.y, t.island);
    else if (tool.kind === 'clearForest') ok = canClearForest(w, t.x, t.y, t.island).ok;
    else if (tool.kind === 'plantForest') ok = canPlantForest(w, t.x, t.y, t.island).ok;
    state.hover = { island: t.island, x: t.x, y: t.y, tool, ok };
  };

  const tileAction = (sx: number, sy: number, dragging: boolean): void => {
    const t = pickTarget(state.world, state.cam, state.tool, sx, sy);
    if (!t) return;
    onAction({ type: 'tile', island: t.island, x: t.x, y: t.y, dragging });
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
    if (isPipetteClick(e.button, { ctrl: e.ctrlKey, meta: e.metaKey }, spaceDown, isTouch)) {
      // Pipette (B-6): kein Zieh-Zustand, nichts gebaut oder gewählt; Pan hat Vorrang (oben via spaceDown)
      const t = pickTarget(state.world, state.cam, { kind: 'select' }, p.sx, p.sy);
      if (t) onAction({ type: 'pipette', island: t.island, x: t.x, y: t.y });
      return;
    }
    canvas.setPointerCapture(e.pointerId);
    drag = {
      button: e.button,
      startX: p.sx,
      startY: p.sy,
      lastX: p.sx,
      lastY: p.sy,
      panning: wantsPan,
      lastTile: null,
      road: !wantsPan && isDragPaintTool(state.tool),
      pointerId: e.pointerId,
      touch: isTouch,
      downTile: pickTarget(state.world, state.cam, state.tool, p.sx, p.sy),
      select: !wantsPan && !isTouch && state.tool.kind === 'select',
    };
    if (wantsPan) return;
    if (drag.road && !isTouch) {
      // Maus: erste Weg-Kachel sofort; Touch wartet auf Ziehen oder Loslassen (Zwei-Finger-Geste baut nichts)
      drag.lastTile = drag.downTile ? tileKey(drag.downTile) : null;
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
            { w: canvas.clientWidth, h: viewH() },
            cameraBounds(state.world.islands),
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
          drag.lastTile = tileKey(drag.downTile);
          tileAction(drag.startX, drag.startY, false);
        }
        // Weg-Zug immer über die Bodenkachel; ausserhalb der Karte (Meer) ignorieren
        const t = pickTarget(state.world, state.cam, state.tool, p.sx, p.sy);
        const key = t ? tileKey(t) : null;
        if (t && key !== drag.lastTile) {
          // Start ausserhalb der Karte: erste Kachel im Feld selbst setzen
          if (drag.lastTile === null)
            onAction({ type: 'tile', island: t.island, x: t.x, y: t.y, dragging: true });
          const from =
            drag.lastTile !== null && drag.lastTile.startsWith(`${t.island}:`)
              ? drag.lastTile
                  .slice(drag.lastTile.indexOf(':') + 1)
                  .split(',')
                  .map(Number)
              : [t.x, t.y]; // andere Insel: nicht über das Meer interpolieren
          let cx = from[0] ?? t.x;
          let cy = from[1] ?? t.y;
          // Kachelweise von der letzten zur neuen Kachel laufen, damit keine Lücken entstehen
          while (cx !== t.x || cy !== t.y) {
            if (Math.abs(t.x - cx) >= Math.abs(t.y - cy)) cx += Math.sign(t.x - cx);
            else cy += Math.sign(t.y - cy);
            onAction({ type: 'tile', island: t.island, x: cx, y: cy, dragging: true });
          }
          if (drag.lastTile !== null && !drag.lastTile.startsWith(`${t.island}:`))
            onAction({ type: 'tile', island: t.island, x: t.x, y: t.y, dragging: true });
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
      const ship = exceedsDrag({ x: d.startX, y: d.startY }, { x: up.sx, y: up.sy })
        ? null
        : shipAt(state.world, state.cam, up.sx, up.sy);
      if (ship !== null) {
        onAction({ type: 'ship', id: ship });
      } else if (d.downTile && !exceedsDrag({ x: d.startX, y: d.startY }, { x: up.sx, y: up.sy })) {
        onAction({
          type: 'tile',
          island: d.downTile.island,
          x: d.downTile.x,
          y: d.downTile.y,
          dragging: false,
        });
      }
    } else if (d.road) {
      // Touch-Tippen ohne Ziehen: einzelne Weg-Kachel auf der Drück-Kachel
      if (d.touch && d.lastTile === null && d.downTile) {
        onAction({
          type: 'tile',
          island: d.downTile.island,
          x: d.downTile.x,
          y: d.downTile.y,
          dragging: false,
        });
      }
      onAction({ type: 'dragEnd' });
    } else if (d.touch && d.downTile) {
      // Touch: Aktion beim Loslassen, aber auf der Drück-Kachel
      onAction({
        type: 'tile',
        island: d.downTile.island,
        x: d.downTile.x,
        y: d.downTile.y,
        dragging: false,
      });
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
      { w: canvas.clientWidth, h: viewH() },
      cameraBounds(state.world.islands),
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
    if (
      e.key === ' ' &&
      spaceKeyRole(target, modal, { ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey }) === 'ignore'
    )
      spaceTap.blur(); // A-9: Erkennung verwerfen
    const hot = hotkeyAction(
      e.key,
      { ctrl: e.ctrlKey, meta: e.metaKey, alt: e.altKey, shift: e.shiftKey },
      isTextField(e.target) || modal,
      functionLock(state.world, 'seafaring') === null,
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
      const role = spaceKeyRole(target, modal, {
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        alt: e.altKey,
      });
      if (role === 'button') return;
      spaceDown = true;
      e.preventDefault();
      spaceTap.keyDown(e.timeStamp, e.repeat);
      if (drag !== null) spaceTap.pointerDown(); // A-6: keine Pause mitten in einer Zeigeraktion
    } else if (PAN_KEYS.has(k)) {
      keys.add(k);
      e.preventDefault();
    }
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    // Immer löschen, damit nichts hängen bleibt (z. B. Fokuswechsel während der Taste)
    const k = e.key.toLowerCase();
    if (k === ' ') {
      spaceDown = false;
      const target: KeyTarget | null =
        e.target instanceof HTMLElement
          ? { tagName: e.target.tagName, isContentEditable: e.target.isContentEditable }
          : null;
      const role = spaceKeyRole(target, isModalOpen(), {
        ctrl: e.ctrlKey,
        meta: e.metaKey,
        alt: e.altKey,
      });
      if (role === 'map') {
        if (spaceTap.keyUp(e.timeStamp) === 'toggle')
          onAction({ type: 'hotkey', action: { kind: 'pause' } });
      } else {
        spaceTap.blur();
      }
    }
    keys.delete(k);
  };
  const onWindowPointerDown = (): void => spaceTap.pointerDown();
  const onBlur = (): void => {
    keys.clear();
    spaceDown = false;
    spaceTap.blur();
  };

  canvas.addEventListener('contextmenu', onContextMenu);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', onPointerCancel);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  window.addEventListener('pointerdown', onWindowPointerDown, true);
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
    window.removeEventListener('pointerdown', onWindowPointerDown, true);
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('resize', markOverlayDirty);
    overlayObserver?.disconnect();
  };

  /**
   * Öffnet oder schliesst sich das Bauleisten-Overlay, ändert sich die sichtbare Kartenhöhe: Kamera neu klemmen
   * und Hover neu bestimmen; liegt der ruhende Zeiger nun unter dem Overlay, entfällt der Hover.
   */
  const syncOverlay = (): void => {
    if (!overlayDirty) return;
    overlayDirty = false;
    const sub = canvas.ownerDocument.querySelector<HTMLElement>('.buildbar-sub');
    const h = sub?.offsetHeight ?? 0;
    if (h === lastOverlayH) return;
    lastOverlayH = h;
    clamp();
    if (pointerInRect(client, sub ? sub.getBoundingClientRect() : null)) {
      pointer = null;
      client = null;
      state.hover = null;
    } else {
      updateHover();
    }
  };

  const applyKeys = (dtMs: number): void => {
    syncOverlay();
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
    isDragging: () => drag !== null,
    visibleHeight: viewH,
    unbind,
  };
}
