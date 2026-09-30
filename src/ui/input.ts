import { canPlace, canPlaceRoad } from '../sim/placement';
import { inBounds, tileAt } from '../sim/world';
import { TILE, clampCamera, screenToTile, zoomAt } from '../render/camera';
import type { GameState } from './app';

export type InputAction =
  | { type: 'tile'; x: number; y: number; dragging: boolean }
  | { type: 'cancel' }
  | { type: 'dragEnd' };

const PAN_PER_FRAME = 16;
const DRAG_THRESHOLD = 4;
const PAN_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright']);

export interface InputBinding {
  /** Pro Frame aufrufen: verschiebt die Kamera bei gedrückten Pfeil-/WASD-Tasten. */
  applyKeys(): void;
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
  let drag: {
    button: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    panning: boolean;
    lastTile: string | null;
  } | null = null;

  const local = (e: MouseEvent): { sx: number; sy: number } => {
    const r = canvas.getBoundingClientRect();
    return { sx: e.clientX - r.left, sy: e.clientY - r.top };
  };
  const clamp = (): void => {
    clampCamera(
      state.cam,
      state.world.width * TILE,
      state.world.height * TILE,
      canvas.clientWidth,
      canvas.clientHeight,
    );
  };

  const updateHover = (): void => {
    if (!pointer) {
      state.hover = null;
      return;
    }
    const t = screenToTile(state.cam, pointer.sx, pointer.sy);
    if (!inBounds(state.world, t.x, t.y)) {
      state.hover = null;
      return;
    }
    const tool = state.tool;
    let ok = true;
    if (tool.kind === 'build') ok = canPlace(state.world, tool.defId, t.x, t.y).ok;
    else if (tool.kind === 'road') ok = canPlaceRoad(state.world, t.x, t.y).ok;
    else if (tool.kind === 'demolish') {
      const tile = tileAt(state.world, t.x, t.y);
      ok = !!tile && (tile.buildingId !== null || tile.road);
    }
    state.hover = { x: t.x, y: t.y, tool, ok };
  };

  const tileAction = (sx: number, sy: number, dragging: boolean): void => {
    const t = screenToTile(state.cam, sx, sy);
    if (!inBounds(state.world, t.x, t.y)) return;
    onAction({ type: 'tile', x: t.x, y: t.y, dragging });
  };

  const onContextMenu = (e: MouseEvent): void => e.preventDefault();

  const onPointerDown = (e: PointerEvent): void => {
    const p = local(e);
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
    };
    if (!wantsPan && state.tool.kind === 'road') {
      const t = screenToTile(state.cam, p.sx, p.sy);
      drag.lastTile = `${t.x},${t.y}`;
      tileAction(p.sx, p.sy, false);
      pointer = p;
      updateHover();
    }
  };

  const onPointerMove = (e: PointerEvent): void => {
    const p = local(e);
    pointer = p;
    if (drag) {
      if (!drag.panning && state.tool.kind === 'select') {
        if (Math.hypot(p.sx - drag.startX, p.sy - drag.startY) > DRAG_THRESHOLD) {
          drag.panning = true;
        }
      }
      if (drag.panning) {
        state.cam.x -= (p.sx - drag.lastX) / state.cam.zoom;
        state.cam.y -= (p.sy - drag.lastY) / state.cam.zoom;
        clamp();
      } else if (state.tool.kind === 'road') {
        const t = screenToTile(state.cam, p.sx, p.sy);
        const key = `${t.x},${t.y}`;
        if (key !== drag.lastTile) {
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
    if (!drag || e.button !== drag.button) return;
    const p = local(e);
    const d = drag;
    drag = null;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (d.panning || d.button !== 0) return;
    if (state.tool.kind === 'road') onAction({ type: 'dragEnd' });
    // Strassen wurden schon beim Drücken/Ziehen gesetzt
    if (state.tool.kind !== 'road') tileAction(p.sx, p.sy, false);
    updateHover();
  };
  const onPointerCancel = (): void => {
    const wasRoadDrag = drag !== null && !drag.panning && state.tool.kind === 'road';
    drag = null;
    if (wasRoadDrag) onAction({ type: 'dragEnd' });
  };

  const onPointerLeave = (): void => {
    if (drag) return; // bei Capture ignorieren
    pointer = null;
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
      canvas.clientWidth,
      canvas.clientHeight,
      state.world.width * TILE,
      state.world.height * TILE,
    );
    updateHover();
  };

  const isFormControl = (t: EventTarget | null): boolean =>
    t instanceof HTMLInputElement ||
    t instanceof HTMLTextAreaElement ||
    t instanceof HTMLSelectElement ||
    t instanceof HTMLButtonElement ||
    (t instanceof HTMLElement && t.isContentEditable);

  const onKeyDown = (e: KeyboardEvent): void => {
    if (isFormControl(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key.toLowerCase();
    if (k === 'escape') {
      onAction({ type: 'cancel' });
    } else if (k === ' ') {
      spaceDown = true;
      e.preventDefault();
    } else if (PAN_KEYS.has(k)) {
      keys.add(k);
      e.preventDefault();
    }
  };
  const onKeyUp = (e: KeyboardEvent): void => {
    if (isFormControl(e.target)) return;
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

  const applyKeys = (): void => {
    let dx = 0;
    let dy = 0;
    if (keys.has('a') || keys.has('arrowleft')) dx -= PAN_PER_FRAME;
    if (keys.has('d') || keys.has('arrowright')) dx += PAN_PER_FRAME;
    if (keys.has('w') || keys.has('arrowup')) dy -= PAN_PER_FRAME;
    if (keys.has('s') || keys.has('arrowdown')) dy += PAN_PER_FRAME;
    if (dx !== 0 || dy !== 0) {
      state.cam.x += dx / state.cam.zoom;
      state.cam.y += dy / state.cam.zoom;
      clamp();
      updateHover();
    }
  };

  return { applyKeys, unbind };
}
