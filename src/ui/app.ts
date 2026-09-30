import { BUILDING_DEFS } from '../sim/defs/buildings';
import { demolish, placeBuilding, placeRoad, removeRoad } from '../sim/build';
import { step } from '../sim/tick';
import { tileAt, createWorld, center } from '../sim/world';
import type { World } from '../sim/types';
import { TILE, clampCamera, createCamera, type Camera } from '../render/camera';
import { render, type Hover, type Tool } from '../render/renderer';
import { buildTerrainLayer } from '../render/terrain';
import { renderBuildMenu, updateBuildMenu } from './buildMenu';
import { updateHud } from './hud';
import { bindInput, type InputAction } from './input';
import { renderInspect, updateInspect } from './inspect';
import { bindMessages, showMessage } from './messages';
import { renderTrade, updateTrade } from './trade';

export type PanelState = { kind: 'none' } | { kind: 'inspect'; id: number } | { kind: 'trade' };

export interface GameState {
  world: World;
  cam: Camera;
  tool: Tool;
  speed: 0 | 1 | 2 | 4;
  hover: Hover | null;
  selectedId: number | null;
  panel: PanelState;
  terrainLayer: HTMLCanvasElement;
}

const TICK_MS = 100;
const MAX_TICKS_PER_FRAME = 20;
const HUD_EVERY_FRAMES = 10;

function need<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`${selector} fehlt`);
  return el;
}

export function startGame(root: HTMLElement, seed?: number): GameState {
  const canvas = need<HTMLCanvasElement>(root, '#canvas');
  const gameEl = need<HTMLElement>(root, '#game');
  const hudEl = need<HTMLElement>(root, '#hud');
  const navEl = need<HTMLElement>(root, '#buildbar');
  const panelEl = need<HTMLElement>(root, '#panel');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D nicht verfügbar');

  const world = createWorld(seed ?? Date.now() % 100000);
  const state: GameState = {
    world,
    cam: createCamera(),
    tool: { kind: 'select' },
    speed: 1,
    hover: null,
    selectedId: null,
    panel: { kind: 'none' },
    terrainLayer: buildTerrainLayer(world),
  };
  const worldW = world.width * TILE;
  const worldH = world.height * TILE;
  const view = { w: 1, h: 1 };

  bindMessages(gameEl);

  /** Wechselt den Panel-Inhalt; Auswahl-Hervorhebung folgt dem Panel. DOM wird neu gebaut. */
  const setPanel = (panel: PanelState): void => {
    state.panel = panel;
    if (panel.kind === 'inspect') {
      state.selectedId = panel.id;
      renderInspect(panelEl, world, panel.id, {
        demolish: (id) => {
          const r = demolish(world, id);
          if (!r.ok) showMessage(r.reason, 'error');
          else setPanel({ kind: 'none' });
          refresh();
        },
        openTrade: () => setPanel({ kind: 'trade' }),
      });
    } else if (panel.kind === 'trade') {
      state.selectedId = world.kontorId;
      renderTrade(panelEl, world, {
        back: () => setPanel({ kind: 'inspect', id: world.kontorId }),
        changed: () => refresh(),
      });
    } else {
      state.selectedId = null;
      panelEl.replaceChildren();
    }
  };

  /** Aktualisiert HUD, Bauleiste und Panel-Zahlen (ohne DOM-Neuaufbau). */
  const refresh = (): void => {
    updateHud(hudEl, state);
    updateBuildMenu(navEl, world);
    const panel = state.panel;
    if (panel.kind === 'inspect') {
      if (world.buildings[panel.id]) updateInspect(panelEl, world, panel.id);
      else setPanel({ kind: 'none' });
    } else if (panel.kind === 'trade') {
      updateTrade(panelEl, world);
    }
  };

  const selectTool = (tool: Tool): void => {
    state.tool = tool;
    if (tool.kind !== 'select') setPanel({ kind: 'none' });
    state.hover = null;
    renderBuildMenu(navEl, state, selectTool);
  };
  renderBuildMenu(navEl, state, selectTool);

  const selectBuilding = (id: number | null): void => {
    const panel = state.panel;
    if (id === null) {
      setPanel({ kind: 'none' });
    } else if (panel.kind === 'trade' && id === world.kontorId) {
      // Handel bleibt offen, wenn das Kontor erneut angeklickt wird
    } else if (panel.kind !== 'inspect' || panel.id !== id) {
      setPanel({ kind: 'inspect', id });
    }
  };

  const onAction = (a: InputAction): void => {
    if (a.type === 'cancel') {
      setPanel({ kind: 'none' });
      selectTool({ kind: 'select' });
      return;
    }
    const tool = state.tool;
    const tile = tileAt(world, a.x, a.y);
    if (tool.kind === 'select') {
      selectBuilding(tile?.buildingId ?? null);
    } else if (tool.kind === 'build') {
      const r = placeBuilding(world, tool.defId, a.x, a.y);
      if (!r.ok) showMessage(r.reason, 'error');
    } else if (tool.kind === 'road') {
      const r = placeRoad(world, a.x, a.y);
      if (!r.ok && !a.dragging) showMessage(r.reason, 'error');
    } else if (tile?.buildingId != null) {
      const r = demolish(world, tile.buildingId);
      if (!r.ok) showMessage(r.reason, 'error');
    } else {
      const r = removeRoad(world, a.x, a.y);
      if (!r.ok && !a.dragging) showMessage(r.reason, 'error');
    }
    refresh();
  };
  const applyKeys = bindInput(canvas, state, onAction);

  // HUD vor dem Zentrieren aufbauen, damit die Spielfläche ihre endgültige Höhe hat
  refresh();

  // Kamera auf das Kontor zentrieren
  const kontor = world.buildings[world.kontorId];
  const resize = (): void => {
    const w = Math.max(1, gameEl.clientWidth);
    const h = Math.max(1, gameEl.clientHeight);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    view.w = w;
    view.h = h;
    clampCamera(state.cam, worldW, worldH, w, h);
  };
  new ResizeObserver(resize).observe(gameEl);
  resize();
  if (kontor) {
    const c = center(BUILDING_DEFS[kontor.defId], kontor.x, kontor.y);
    state.cam.x = c.cx * TILE - view.w / 2 / state.cam.zoom;
    state.cam.y = c.cy * TILE - view.h / 2 / state.cam.zoom;
    clampCamera(state.cam, worldW, worldH, view.w, view.h);
  }

  let acc = 0;
  let last = performance.now();
  let frame = 0;
  const loop = (now: number): void => {
    try {
      const dt = Math.min(now - last, 1000);
      last = now;
      if (state.speed > 0) {
        acc += dt * state.speed;
        let ticks = 0;
        while (acc >= TICK_MS && ticks < MAX_TICKS_PER_FRAME) {
          step(world);
          acc -= TICK_MS;
          ticks += 1;
        }
        if (ticks === MAX_TICKS_PER_FRAME) acc = 0;
      }
      applyKeys();
      render(ctx, world, state.cam, state.terrainLayer, state.hover, state.selectedId, view);
      if (frame % HUD_EVERY_FRAMES === 0) refresh();
      frame += 1;
      requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      showMessage(`Spiel angehalten: ${msg}`, 'error', true);
    }
  };
  requestAnimationFrame(loop);
  return state;
}
