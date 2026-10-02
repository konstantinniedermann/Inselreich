import { BUILDING_DEFS } from '../sim/defs/buildings';
import { TICK_MS } from '../sim/defs/timing';
import { WIN_CITIZENS } from '../sim/defs/tiers';
import { setTaxLevel } from '../sim/tax';
import { deliverOrder } from '../sim/orders';
import { demolish, placeBuilding, placeRoad, removeRoad } from '../sim/build';
import { crisisView } from '../sim/queries';
import { step } from '../sim/tick';
import { tileAt, createWorld, center } from '../sim/world';
import type { Category, World } from '../sim/types';
import { centerOn, clampToMap, createCamera, type Camera } from '../render/camera';
import { createSound } from '../audio/sound';
import { render, type Hover, type Tool } from '../render/renderer';
import { buildTerrainLayer } from '../render/terrain';
import { phaseAt } from '../render/daynight';
import { viewStats } from '../render/viewStats';
import { renderBuildMenu, updateBuildMenu } from './buildMenu';
import { renderNoticeStack, updateHud, updateNoticeStack, type HudActions } from './hud';
import { afterPause, nextOpenCategory, sameTool, withSpeed, type HotkeyAction } from './hotkeys';
import { bindInput, type InputAction, type InputBinding } from './input';
import { renderInspect, renderRest, updateInspect, updateRest } from './inspect';
import { orderChange } from './order';
import { renderEventLog, updateEventLog } from './eventLogView';
import { crisisFx, frameInputs, nextFireMemo, type FireMemo } from './crisisFx';
import { CLEAR } from '../render/weather';
import { crisisLogEntries, pushLog, type LogEntry } from './crisisLog';
import { bindMessages, showMessage } from './messages';
import { MANIFEST } from '../audio/manifest';
import { creditEntries, FONT_CREDITS, type CreditEntry } from './credits';
import { parseDevParams } from './devParams';
import { createPerfProbe, startAudioProbe } from './devProbes';
import { loadSettings, resolveReduceMotion, saveSettings } from './settings';
import { openSettings } from './settingsPanel';
import { openMenu, type MenuActions } from './menu';
import { closeAllModals } from './modal';
import { UNLOCK_EVENTS, actionSound, diffSoundEvents, soundSnapshot } from './soundEvents';
import {
  autosaveOnHide,
  currentStorageProblem,
  listSaves,
  loadSlot,
  saveAuto,
  saveToStorage,
  type Slot,
} from './storage';
import { openStartCard, startChoices, STORAGE_NOTES } from './startCard';
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
  /** Bau-Kategorie, deren Einträge-Leiste offen ist (Spec L2). */
  openCategory: Category | null;
  terrainLayer: HTMLCanvasElement;
  /** Siegbanner bereits gezeigt (ein geladener, gewonnener Stand zeigt es nicht erneut). */
  wonShown: boolean;
  /** Ereignis-Log der Krisen, neuester zuerst; nicht im Spielstand, leer nach Neu und Laden. */
  eventLog: LogEntry[];
}

const MAX_TICKS_PER_FRAME = 20;
const HUD_EVERY_FRAMES = 10;
/** Umgebungsklang höchstens alle 250 ms füttern (Spec 11.2). */
const AMBIENCE_EVERY_MS = 250;
/** Autosave alle 120 s Echtzeit bei laufendem Spiel (Spec 10.8). */
const AUTOSAVE_MS = 120000;

/** Fremde Assets für die Credits-Karte: Quelle ist das Audio-Manifest (Nachweis nach ADR-006). */
const MANIFEST_CREDITS: readonly CreditEntry[] = MANIFEST;

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
  /** Beim Programmstart: Startkarte zeigen (Spec L1). */
  intro?: boolean;
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
    return launch(root, gameEl, unbindMessages, loaded, opts);
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
    openCategory: null,
    terrainLayer: buildTerrainLayer(world),
    wonShown: world.won,
    eventLog: [],
  };
  const sound = createSound({
    muted: settings.muted,
    master: settings.master,
    music: settings.music,
    ambience: settings.ambience,
    effects: settings.effects,
  });
  let closeSettings: (() => void) | null = null;
  let closeMenu: (() => void) | null = null;
  const preview = parseDevParams(location.search, import.meta.env.DEV);
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let prefersReduced = motionQuery.matches;
  const onMotion = (e: MediaQueryListEvent): void => {
    prefersReduced = e.matches;
  };
  motionQuery.addEventListener('change', onMotion);
  const stopAudioProbe = import.meta.env.DEV ? startAudioProbe(sound) : null;
  const perf = import.meta.env.DEV && preview.perf ? createPerfProbe() : null;
  let previewSignalPlayed = false;
  const unlockSound = (): void => {
    audioUnlockedOnce = true;
    sound.unlock();
    removeUnlockListeners();
    playPreviewSignal();
  };
  const playPreviewSignal = (): void => {
    if (preview.signal && !previewSignalPlayed) {
      previewSignalPlayed = true;
      sound.play(preview.signal);
    }
  };
  const removeUnlockListeners = (): void => {
    for (const ev of UNLOCK_EVENTS) window.removeEventListener(ev, unlockSound);
  };
  if (audioUnlockedOnce) {
    sound.unlock();
    playPreviewSignal();
  } else for (const ev of UNLOCK_EVENTS) window.addEventListener(ev, unlockSound);
  const onVisibility = (): void => sound.setHidden(document.hidden);
  document.addEventListener('visibilitychange', onVisibility);

  /** Fehler zeigen und hörbar machen. */
  const showError = (reason: string): void => {
    showMessage(reason, 'error');
    sound.play('error');
  };

  // Ereignis-Log schwebt unten links über der Spielfläche (R112)
  const logBox = document.createElement('div');
  logBox.className = 'log-box';
  renderEventLog(logBox);
  gameEl.appendChild(logBox);

  const noticeStack = renderNoticeStack(gameEl, world, () => actions.deliverOrder());

  const map = { w: world.width, h: world.height };
  const view = { w: 1, h: 1 };

  /** Laden aus Menü oder Startkarte: erst prüfen, dann ersetzen; das neue Spiel startet pausiert. */
  const loadSlotPaused = (slot: Slot): void => {
    const r = loadSlot(slot);
    if (!r.ok) {
      showError(r.reason);
      return;
    }
    // Die Kamera nur bei gleicher Karte (gleicher Seed), sonst aufs Kontor zentrieren
    restart(root, r.world, {
      speed: 0,
      camera: r.world.seed === world.seed ? state.cam : undefined,
    });
    // Kein bleibender Fokusring auf dem alten Knopf
    (document.activeElement as HTMLElement | null)?.blur?.();
    showMessage('Pausiert — P oder 1× setzt fort');
  };

  const menuActions: MenuActions = {
    save: () => {
      const r = saveToStorage(world);
      if (r.ok) showMessage('Gespeichert');
      else showMessage(r.reason, 'error');
    },
    listSaves,
    storageNote: () => STORAGE_NOTES[currentStorageProblem()],
    hasProgress: () => world.tick > 0,
    load: (slot) => loadSlotPaused(slot),
    crisisLevel: () => settings.crisisLevel,
    newIsland: (crisisLevel) => {
      settings = { ...settings, crisisLevel };
      saveSettings(settings);
      restart(root);
    },
    seed: () => world.seed,
    openGuide: (opener) => {
      openStartCard(gameEl, { mode: 'help', opener });
    },
  };

  const actions: HudActions = {
    setSpeed: (speed) => setSpeed(speed),
    settings: () => settings,
    setMuted: (muted) => {
      settings = { ...settings, muted };
      sound.setMuted(muted);
      saveSettings(settings);
    },
    openSettings: (opener) => {
      closeSettings?.();
      closeSettings = openSettings(
        gameEl,
        {
          settings: () => settings,
          setBus: (bus, value) => {
            settings = { ...settings, [bus]: value };
            sound.setBus(bus, value);
            saveSettings(settings);
          },
          setDayNight: (dayNight) => {
            settings = { ...settings, dayNight };
            saveSettings(settings);
          },
          setReduceMotion: (reduceMotion) => {
            settings = { ...settings, reduceMotion };
            saveSettings(settings);
          },
          credits: () => creditEntries(MANIFEST_CREDITS, FONT_CREDITS),
        },
        opener,
      );
    },
    openMenu: (opener) => {
      closeMenu?.();
      closeMenu = openMenu(gameEl, menuActions, opener);
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
    updateNoticeStack(noticeStack, world);
    updateEventLog(logBox, state.eventLog);
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
    state.openCategory = nextOpenCategory(state.openCategory, { kind: 'tool', tool });
    if (tool.kind !== 'select') setPanel({ kind: 'none' });
    // Vorschau an der letzten Zeigerposition neu (ohne Zeiger: keine); keine hängende Drag-Vorschau
    input?.refreshHover();
    renderBuildMenu(navEl, state, selectTool, toggleCategory);
  };
  const toggleCategory = (category: Category): void => {
    state.openCategory = nextOpenCategory(state.openCategory, { kind: 'toggle', category });
    renderBuildMenu(navEl, state, selectTool, toggleCategory);
  };
  renderBuildMenu(navEl, state, selectTool, toggleCategory);

  const selectBuilding = (id: number | null): void => {
    const panel = state.panel;
    if (id === null) {
      setPanel({ kind: 'none' });
    } else if (id === world.kontorId) {
      // P-1: das Kontor öffnet direkt den Handel; erneutes Anklicken lässt ihn offen
      if (panel.kind !== 'trade') setPanel({ kind: 'trade' });
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
  let closeStart: (() => void) | null = null;
  if (opts?.intro) {
    const saves = listSaves();
    const { choices, note } = startChoices(saves, currentStorageProblem());
    closeStart = openStartCard(gameEl, {
      mode: 'start',
      choices,
      note,
      hasSlot: saves.length > 0,
      onChoice: (c) => {
        if (c.kind === 'load') loadSlotPaused(c.slot);
        else {
          closeStart?.();
          setSpeed(1);
          refresh();
        }
      },
    });
  }

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
  // Nach dem Laden ist der geladene Stand die Vergleichsbasis: eine laufende Krise erzeugt keinen Eintrag
  let prevCrisis = crisisView(world);
  let last = performance.now();
  let lastAmbienceMs = -Infinity;
  let fireMemo: FireMemo = null;
  const previewFire = preview.fireIds?.map((id) => ({ id, flames: 1, smoke: 1 }));
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
      const curCrisis = crisisView(world);
      fireMemo = nextFireMemo(
        fireMemo,
        prevCrisis,
        curCrisis,
        world.tick,
        (id) => world.buildings[id] !== undefined,
      );
      const logged = crisisLogEntries(prevCrisis, curCrisis, world, world.tick);
      prevCrisis = curCrisis;
      if (logged.length > 0) {
        state.eventLog = pushLog(state.eventLog, logged);
        for (const e of logged) if (e.toast !== null) showMessage(e.text, e.toast);
      }
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
      perf?.frame(now);
      const reduce = resolveReduceMotion(settings.reduceMotion, prefersReduced);
      const inputs = frameInputs(crisisFx(curCrisis, world.tick, fireMemo), null);
      const weather = preview.weather ?? inputs.render.weather ?? CLEAR;
      if (now - lastAmbienceMs >= AMBIENCE_EVERY_MS) {
        lastAmbienceMs = now;
        const phase = phaseAt(world.tick);
        sound.setAmbience({
          view: viewStats(world, state.cam, view),
          phase,
          weather,
          reduced: reduce,
          fire: previewFire ? 1 : inputs.ambience.fire,
        });
        sound.setPhase(phase);
      }
      const t0 = performance.now();
      render(ctx, world, state.cam, state.terrainLayer, state.hover, state.selectedId, view, {
        timeMs: t0,
        dayNight: settings.dayNight,
        weather,
        reduceMotion: reduce,
        fire: previewFire ?? inputs.render.fire,
        boom: preview.boom ?? inputs.render.boom,
        raster: preview.raster === true,
      });
      perf?.renderDone(performance.now() - t0);
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
  const onPageHide = (): void => autosaveOnHide(world);
  window.addEventListener('pagehide', onPageHide);

  /** Beendet Loop, Beobachter und Listener und leert das DOM, das dieses Spiel aufgebaut hat. */
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(rafId);
    resizeObserver.disconnect();
    input?.unbind();
    closeAllModals();
    closeSettings?.();
    stopAudioProbe?.();
    motionQuery.removeEventListener('change', onMotion);
    removeUnlockListeners();
    window.removeEventListener('pagehide', onPageHide);
    document.removeEventListener('visibilitychange', onVisibility);
    sound.dispose();
    logBox.remove();
    noticeStack.remove();
    unbindMessages();
    hudEl.replaceChildren();
    navEl.replaceChildren();
    panelEl.replaceChildren();
  };
  const game: RunningGame = Object.assign(state, { dispose });
  current = game;
  return game;
}
