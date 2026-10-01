import { BUILDING_DEFS } from '../sim/defs/buildings';
import { TICK_MS } from '../sim/defs/timing';
import { WIN_CITIZENS } from '../sim/defs/tiers';
import { setTaxLevel } from '../sim/tax';
import { deliverOrder } from '../sim/orders';
import { demolish, placeBuilding, placeRoad, removeRoad } from '../sim/build';
import { step } from '../sim/tick';
import { tileAt, createWorld, center } from '../sim/world';
import type { World } from '../sim/types';
import { centerOn, clampToMap, createCamera, type Camera } from '../render/camera';
import { createSound } from '../audio/sound';
import { render, type Hover, type Tool } from '../render/renderer';
import { buildTerrainLayer } from '../render/terrain';
import { renderBuildMenu, updateBuildMenu } from './buildMenu';
import { disposeHud, updateHud, type HudActions } from './hud';
import { afterPause, sameTool, withSpeed, type HotkeyAction } from './hotkeys';
import { bindInput, type InputAction, type InputBinding } from './input';
import { renderInspect, renderRest, updateInspect, updateRest } from './inspect';
import { orderChange } from './order';
import { bindMessages, showMessage } from './messages';
import { loadSettings, saveSettings } from './settings';
import { UNLOCK_EVENTS, actionSound, diffSoundEvents, soundSnapshot } from './soundEvents';
import { listSaves, loadSlot, noLoadableReason, saveAuto, saveToStorage } from './storage';
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
  /** Siegbanner bereits gezeigt (ein geladener, gewonnener Stand zeigt es nicht erneut). */
  wonShown: boolean;
}

const MAX_TICKS_PER_FRAME = 20;
const HUD_EVERY_FRAMES = 10;
/** Autosave alle 120 s Echtzeit bei laufendem Spiel (Spec 10.8). */
const AUTOSAVE_MS = 120000;

/** Ein Nutzer-Klick oder -Tastendruck hat den Ton schon einmal freigeschaltet (überlebt Neustarts). */
let audioUnlockedOnce = false;

function need<T extends HTMLElement>(root: HTMLElement, selector: string): T {
  const el = root.querySelector<T>(selector);
  if (!el) throw new Error(`${selector} fehlt`);
  return el;
}

export type RunningGame = GameState & { dispose(): void };

/** Ergebnis von `startGame`: bei einem Startfehler nur ein Stub, dessen `dispose` aufräumt. */
export interface Startable {
  dispose(): void;
}

/** Das laufende Spiel (oder der Fehler-Stub); `restart` beendet es, bevor ein neues startet. */
let current: Startable | null = null;

/** Beendet das laufende Spiel und startet mit `world` bzw. einer neuen Karte. */
function restart(root: HTMLElement, world?: World, opts?: StartOptions): Startable {
  current?.dispose();
  current = null;
  return startGame(root, world, opts);
}

/** Übernahme aus dem vorherigen Spiel beim Laden: Tempo und (bei gleichem Seed) Kamera. */
export interface StartOptions {
  speed?: GameState['speed'];
  camera?: Camera;
}

/**
 * Startet ein Spiel mit `world` (geladener Stand) oder einer neuen Karte. Wirft nie: schlägt der
 * Start fehl (z. B. keine gültige Karte), erscheint ein sticky Toast und `current` zeigt auf einen
 * Stub, der nur die Meldungsfläche wieder entfernt.
 */
export function startGame(root: HTMLElement, loaded?: World, opts?: StartOptions): Startable {
  let unbindMessages = (): void => {};
  try {
    const gameEl = need<HTMLElement>(root, '#game');
    unbindMessages = bindMessages(gameEl);
    const game = launch(root, gameEl, unbindMessages, loaded, opts);
    if (!loaded && listSaves().length > 0) {
      showMessage('Spielstand vorhanden — mit „Laden" fortsetzen', 'info');
    }
    return game;
  } catch (err) {
    console.error(err);
    const msg = err instanceof Error ? err.message : String(err);
    showMessage(`Spiel konnte nicht gestartet werden: ${msg}`, 'error', true);
    const stub: Startable = { dispose: unbindMessages };
    current = stub;
    return stub;
  }
}

function launch(
  root: HTMLElement,
  gameEl: HTMLElement,
  unbindMessages: () => void,
  loaded?: World,
  opts?: StartOptions,
): RunningGame {
  const canvas = need<HTMLCanvasElement>(root, '#canvas');
  const hudEl = need<HTMLElement>(root, '#hud');
  const navEl = need<HTMLElement>(root, '#buildbar');
  const panelEl = need<HTMLElement>(root, '#panel');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D nicht verfügbar');

  let settings = loadSettings();
  const world = loaded ?? createWorld(Date.now() % 100000, { crisisLevel: settings.crisisLevel });
  const state: GameState = {
    world,
    cam: opts?.camera ? { ...opts.camera } : createCamera(),
    tool: { kind: 'select' },
    speed: opts?.speed ?? 1,
    hover: null,
    selectedId: null,
    panel: { kind: 'none' },
    terrainLayer: buildTerrainLayer(world),
    wonShown: world.won,
  };
  const sound = createSound(settings);
  const unlockSound = (): void => {
    audioUnlockedOnce = true;
    sound.unlock();
    removeUnlockListeners();
  };
  const removeUnlockListeners = (): void => {
    for (const ev of UNLOCK_EVENTS) window.removeEventListener(ev, unlockSound);
  };
  if (audioUnlockedOnce) sound.unlock();
  else for (const ev of UNLOCK_EVENTS) window.addEventListener(ev, unlockSound);
  const onVisibility = (): void => sound.setHidden(document.hidden);
  document.addEventListener('visibilitychange', onVisibility);

  /** Fehler zeigen und hörbar machen. */
  const showError = (reason: string): void => {
    showMessage(reason, 'error');
    sound.play('error');
  };

  const map = { w: world.width, h: world.height };
  const view = { w: 1, h: 1 };

  const actions: HudActions = {
    save: () => {
      const r = saveToStorage(world);
      if (r.ok) showMessage('Gespeichert');
      else showMessage(r.reason, 'error');
    },
    listSaves,
    setSpeed: (speed) => setSpeed(speed),
    load: (slot) => {
      // Erst prüfen, dann ersetzen: ein kaputter Stand lässt das laufende Spiel unberührt
      if (!slot) {
        showMessage(noLoadableReason(), 'error');
        return;
      }
      const r = loadSlot(slot);
      if (!r.ok) {
        showMessage(r.reason, 'error');
        return;
      }
      // Tempo bleibt; die Kamera nur bei gleicher Karte (gleicher Seed), sonst aufs Kontor zentrieren
      restart(root, r.world, {
        speed: state.speed,
        camera: r.world.seed === world.seed ? state.cam : undefined,
      });
      showMessage('Spielstand geladen');
    },
    settings: () => settings,
    setMuted: (muted) => {
      settings = { ...settings, muted };
      sound.setMuted(muted);
      saveSettings(settings);
    },
    setVolume: (volume) => {
      settings = { ...settings, volume };
      sound.setVolume(volume);
      saveSettings(settings);
    },
    setDayNight: (dayNight) => {
      settings = { ...settings, dayNight };
      saveSettings(settings);
    },
    setCrisisLevel: (crisisLevel) => {
      settings = { ...settings, crisisLevel };
      const r = saveSettings(settings);
      if (r.ok) showMessage('Krisenstufe gilt ab dem nächsten Spiel');
      else showError(r.reason);
    },
    hasProgress: () => world.tick > 0,
    restart: () => {
      restart(root);
    },
    setTax: (level) => {
      const r = setTaxLevel(world, level);
      if (!r.ok) showError(r.reason);
      refresh();
    },
    deliverOrder: () => {
      const r = deliverOrder(world);
      const ev = actionSound(r, 'orderDone');
      if (!r.ok) showError(r.reason);
      else {
        // Vergleichswert zurücksetzen, damit die Lieferung nicht als „verfallen" gilt
        prevOrderPeriod = null;
        showMessage('Auftrag geliefert');
        if (ev) sound.play(ev);
      }
      refresh();
    },
  };

  /** Auftragsperiode im letzten Frame (zum Erkennen von „Neuer Auftrag" / „Auftrag verfallen"). */
  let prevOrderPeriod: number | null = world.order?.period ?? null;

  /** Wechselt den Panel-Inhalt; Auswahl-Hervorhebung folgt dem Panel. DOM wird neu gebaut. */
  const setPanel = (panel: PanelState): void => {
    state.panel = panel;
    panelEl.classList.toggle('card--rest', panel.kind === 'none');
    if (panel.kind === 'inspect') {
      state.selectedId = panel.id;
      renderInspect(panelEl, world, panel.id, {
        demolish: (id) => {
          const r = demolish(world, id);
          if (!r.ok) showError(r.reason);
          else {
            sound.play('demolish');
            setPanel({ kind: 'none' });
          }
          refresh();
        },
        openTrade: () => setPanel({ kind: 'trade' }),
      });
    } else if (panel.kind === 'trade') {
      state.selectedId = world.kontorId;
      renderTrade(panelEl, world, {
        back: () => setPanel({ kind: 'inspect', id: world.kontorId }),
        changed: (op, r) => {
          if (!r.ok) showError(r.reason);
          else if (op === 'sell') sound.play('coin');
          refresh();
        },
      });
    } else {
      state.selectedId = null;
      renderRest(panelEl, world);
    }
  };

  /** Aktualisiert HUD, Bauleiste und Panel-Zahlen (ohne DOM-Neuaufbau). */
  const refresh = (): void => {
    if (world.won && !state.wonShown) {
      state.wonShown = true;
      showMessage(`Ziel erreicht: ${WIN_CITIZENS} Bürger! Das Spiel läuft weiter.`, 'info', true);
    }
    updateHud(hudEl, state, actions);
    updateBuildMenu(navEl, world);
    const panel = state.panel;
    if (panel.kind === 'inspect') {
      if (world.buildings[panel.id]) updateInspect(panelEl, world, panel.id);
      else setPanel({ kind: 'none' });
    } else if (panel.kind === 'trade') {
      updateTrade(panelEl, world);
    } else {
      updateRest(panelEl, world);
    }
  };

  // Erst nach `bindInput` gesetzt; `selectTool` läuft vorher nie (nur die Callback-Registrierung)
  let input: InputBinding | null = null;

  /** Einzige Stelle für jeden Werkzeugwechsel (Bauleiste, Hotkey, Esc/X, Rechtsklick). */
  const selectTool = (tool: Tool): void => {
    // RF-5: eine laufende Zieh-Aktion endet sauber, bevor das neue Werkzeug gilt
    input?.cancelPointerAction();
    state.tool = tool;
    if (tool.kind !== 'select') setPanel({ kind: 'none' });
    // Vorschau an der letzten Zeigerposition neu (ohne Zeiger: keine); keine hängende Drag-Vorschau
    input?.refreshHover();
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

  // Geld-Fehler beim Strassen-Ziehen nur einmal pro Zug melden; jede Aktion ausserhalb eines Zugs setzt zurück
  let dragMoneyToastShown = false;
  const showRoadFailure = (reason: string, dragging: boolean): void => {
    if (!dragging) {
      showError(reason);
    } else if ((reason === 'Kein Geld' || reason === 'Zu wenig Geld') && !dragMoneyToastShown) {
      dragMoneyToastShown = true;
      showError(reason);
    }
  };

  /** Einzige Stelle für jede Tempo-Änderung (HUD, Hotkey); merkt das letzte laufende Tempo für P. */
  let lastSpeed: 1 | 2 | 4 = state.speed === 0 ? 1 : state.speed;
  const setSpeed = (speed: GameState['speed']): void => {
    const r = withSpeed(speed, lastSpeed);
    state.speed = r.speed;
    lastSpeed = r.last;
  };
  const onHotkey = (h: HotkeyAction): void => {
    if (h.kind === 'tool') {
      // Derselbe Hotkey bei aktivem Werkzeug wechselt zurück zur Auswahl
      selectTool(sameTool(state.tool, h.tool) ? { kind: 'select' } : h.tool);
    } else if (h.kind === 'speed') {
      setSpeed(h.speed);
    } else {
      setSpeed(afterPause(state.speed, lastSpeed).speed);
    }
    refresh();
  };

  const onAction = (a: InputAction): void => {
    if (a.type === 'hotkey') {
      onHotkey(a.action);
      return;
    }
    if (a.type === 'cancel') {
      setPanel({ kind: 'none' });
      selectTool({ kind: 'select' });
      return;
    }
    if (a.type === 'dragEnd') {
      dragMoneyToastShown = false;
      return;
    }
    if (!a.dragging) dragMoneyToastShown = false;
    const tool = state.tool;
    const tile = tileAt(world, a.x, a.y);
    if (tool.kind === 'select') {
      selectBuilding(tile?.buildingId ?? null);
    } else if (tool.kind === 'build') {
      const r = placeBuilding(world, tool.defId, a.x, a.y);
      if (!r.ok) showError(r.reason);
      else sound.play('build');
    } else if (tool.kind === 'road') {
      const r = placeRoad(world, a.x, a.y);
      if (!r.ok) showRoadFailure(r.reason, a.dragging);
      else sound.play('build');
    } else if (tile?.buildingId != null) {
      const r = demolish(world, tile.buildingId);
      if (!r.ok) showError(r.reason);
      else sound.play('demolish');
    } else {
      const r = removeRoad(world, a.x, a.y);
      if (!r.ok) showRoadFailure(r.reason, a.dragging);
      else sound.play('demolish');
    }
    refresh();
  };
  input = bindInput(canvas, state, onAction);

  // HUD vor dem Zentrieren aufbauen, damit die Spielfläche ihre endgültige Höhe hat
  setPanel({ kind: 'none' });
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
    clampToMap(state.cam, map, w, h);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(gameEl);
  resize();
  if (kontor && !opts?.camera) {
    const c = center(BUILDING_DEFS[kontor.defId], kontor.x, kontor.y);
    centerOn(state.cam, c.cx, c.cy, view, map);
  }

  let acc = 0;
  let autoMs = 0;
  let autoErrorShown = false;
  let prevSnap = soundSnapshot(world);
  let last = performance.now();
  let frame = 0;
  let disposed = false;
  let rafId = 0;
  const loop = (now: number): void => {
    if (disposed) return;
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
      input?.applyKeys(dt);
      const snap = soundSnapshot(world);
      for (const e of diffSoundEvents(prevSnap, snap)) sound.play(e);
      prevSnap = snap;
      const change = orderChange(prevOrderPeriod, world.order?.period ?? null);
      if (change === 'new') showMessage('Neuer Auftrag');
      else if (change === 'expired') showMessage('Auftrag verfallen');
      prevOrderPeriod = world.order?.period ?? null;
      if (state.speed > 0) {
        autoMs += dt;
        if (autoMs >= AUTOSAVE_MS) {
          autoMs = 0;
          // Kein Autosave bei Tick 0; ein Schreibfehler wird je laufendem Spiel einmal gemeldet
          if (world.tick > 0) {
            const r = saveAuto(world);
            if (!r.ok && !autoErrorShown) {
              autoErrorShown = true;
              // Normale Meldung, kein Fehlerton (Spiel läuft weiter)
              showMessage(r.reason, 'error');
            }
          }
        }
      }
      render(ctx, world, state.cam, state.terrainLayer, state.hover, state.selectedId, view, {
        timeMs: performance.now(),
        dayNight: settings.dayNight,
        raster: import.meta.env.DEV && location.search.includes('raster=1'),
      });
      if (frame % HUD_EVERY_FRAMES === 0) refresh();
      frame += 1;
      rafId = requestAnimationFrame(loop);
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : String(err);
      showMessage(`Spiel angehalten: ${msg}`, 'error', true);
    }
  };
  rafId = requestAnimationFrame(loop);

  /** Beendet Loop, Beobachter und Listener und leert das DOM, das dieses Spiel aufgebaut hat. */
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    input?.unbind();
    removeUnlockListeners();
    document.removeEventListener('visibilitychange', onVisibility);
    sound.dispose();
    unbindMessages();
    disposeHud(hudEl);
    hudEl.replaceChildren();
    navEl.replaceChildren();
    panelEl.replaceChildren();
  };
  const game: RunningGame = Object.assign(state, { dispose });
  current = game;
  return game;
}
