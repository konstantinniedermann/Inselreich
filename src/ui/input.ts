import { canPlace, canPlaceRoad } from '../sim/placement';
import { inBounds, tileAt } from '../sim/world';
import { TILE, clampCamera, screenToTile, zoomAt } from '../render/camera';
import type { GameState } from './app';

export type InputAction =
  { type: 'tile'; x: number; y: number; dragging: boolean } | { type: 'cancel' };

const PAN_PER_FRAME = 16;
const DRAG_THRESHOLD = 4;
const PAN_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowleft', 'arrowdown', 'arrowright']);

/**
 * Bindet Maus und Tastatur. Gibt eine Funktion zurück, die pro Frame aufgerufen wird
 * und die Kamera bei gedrückten Pfeil-/WASD-Tasten verschiebt.
 */
export function bindInput(
  canvas: HTMLCanvasElement,
  state: GameState,
  onAction: (action: InputAction) => void,
): () => void {
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

  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  canvas.addEventListener('pointerdown', (e) => {
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
    }
  });

  canvas.addEventListener('pointermove', (e) => {
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
  });

  const endDrag = (e: PointerEvent): void => {
    if (!drag || e.button !== drag.button) return;
    const p = local(e);
    const d = drag;
    drag = null;
    if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    if (d.panning || d.button !== 0) return;
    // Strassen wurden schon beim Drücken/Ziehen gesetzt
    if (state.tool.kind !== 'road') tileAction(p.sx, p.sy, false);
    updateHover();
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', () => {
    drag = null;
  });

  canvas.addEventListener('pointerleave', () => {
    if (drag) return; // bei Capture ignorieren
    pointer = null;
    state.hover = null;
  });

  canvas.addEventListener(
    'wheel',
    (e) => {
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
    },
    { passive: false },
  );

  window.addEventListener('keydown', (e) => {
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
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === ' ') spaceDown = false;
    keys.delete(k);
  });
  window.addEventListener('blur', () => {
    keys.clear();
    spaceDown = false;
  });

  return () => {
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
}
