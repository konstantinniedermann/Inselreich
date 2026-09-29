import { BUILDING_DEFS } from '../sim/defs/buildings';
import { demolish, placeBuilding, placeRoad, removeRoad } from '../sim/build';
import { step } from '../sim/tick';
import { tileAt, createWorld, center } from '../sim/world';
import type { World } from '../sim/types';
import { TILE, clampCamera, createCamera, type Camera } from '../render/camera';
import { render, type Hover, type Tool } from '../render/renderer';
import { buildTerrainLayer } from '../render/terrain';
import { renderBuildMenu } from './buildMenu';
import { updateHud } from './hud';
import { bindInput, type InputAction } from './input';
import { bindMessages, showMessage } from './messages';

export interface GameState {
  world: World;
  cam: Camera;
  tool: Tool;
  speed: 0 | 1 | 2 | 4;
  hover: Hover | null;
  selectedId: number | null;
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
    terrainLayer: buildTerrainLayer(world),
  };
  const worldW = world.width * TILE;
  const worldH = world.height * TILE;
  const view = { w: 1, h: 1 };

  bindMessages(gameEl);

  const selectTool = (tool: Tool): void => {
    state.tool = tool;
    if (tool.kind !== 'select') state.selectedId = null;
    state.hover = null;
    renderBuildMenu(navEl, state, selectTool);
  };
  renderBuildMenu(navEl, state, selectTool);

  const onAction = (a: InputAction): void => {
    if (a.type === 'cancel') {
      state.selectedId = null;
      selectTool({ kind: 'select' });
      return;
    }
    const tool = state.tool;
    const tile = tileAt(world, a.x, a.y);
    if (tool.kind === 'select') {
      state.selectedId = tile?.buildingId ?? null;
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
  };
  const applyKeys = bindInput(canvas, state, onAction);

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
      if (frame % HUD_EVERY_FRAMES === 0) updateHud(hudEl, state);
      frame += 1;
      requestAnimationFrame(loop);
    } catch (err) {
      showMessage(err instanceof Error ? err.message : String(err), 'error');
    }
  };
  updateHud(hudEl, state);
  requestAnimationFrame(loop);
  return state;
}
