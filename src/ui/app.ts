import { BUILDING_DEFS, ROAD_COST_OBJ } from '../sim/defs/buildings';
import { TICK_MS } from '../sim/defs/timing';
import { crisisView } from '../sim/queries';
import { buyPrice } from '../sim/trade';
import { deliverOrder } from '../sim/orders';
import { demolish, placeBuilding, placeRoad, removeRoad } from '../sim/build';
import { connectBuilding } from '../sim/connect';
import { step } from '../sim/tick';
import { LEVELS } from '../sim/defs/levels';
import { holdFeast } from '../sim/feast';
import { upgradeBuilding } from '../sim/upgrade';
import { HOME, home, tileAt, createWorld, center, type Pos } from '../sim/world';
import { functionLock } from '../sim/unlocks';
import { CLEAR_FOREST_COST, PLANT_FOREST_COST } from '../sim/defs/forest';
import type {
  BuildingDefId,
  Category,
  Cost,
  GoodId,
  Order,
  Result,
  UnlockId,
  World,
} from '../sim/types';
import { demolishText } from './texts';
import { goalBanners, initialGoalShown, frameUnlock, lockedToolText } from './goal';
import {
  centerOn,
  clampToRect,
  createCamera,
  zoomAt,
  screenToTileF,
  tileCorners,
  visibleTileRange,
  worldToScreen,
  type Camera,
} from '../render/camera';
import { ISO_W, project } from '../render/iso';
import { shipTile } from '../render/ship';
import { wildlifeAt } from '../render/wildlife';
import { createSound } from '../audio/sound';
import { render, wildlifeEnvOf, type Hover, type RenderFx, type Tool } from '../render/renderer';
import { cameraBounds, islandView } from '../render/archipel';
import { activeIsland, islandRects } from './activeIsland';
import { jumpTarget, nextIsland } from './islandJump';
import { createCachePlan, type CachePlan } from '../render/cachePlan';
import { buildTerrainLayer, defaultTerrainScale, terrainJob } from '../render/terrain';
import { createIslandLayers, idleSchedule } from './islandLayers';
import { drawPathPreview } from '../render/pathPreview';
import { connectView } from './connect';
import { phaseAt } from '../render/daynight';
import { viewStats } from '../render/viewStats';
import { newBuildEntries, renderBuildMenu, updateBuildMenu } from './buildMenu';
import {
  renderNoticeStack,
  updateHud,
  updateMoney,
  updateNoticeStack,
  type HudActions,
} from './hud';
import {
  afterPause,
  hotkeyList,
  nextOpenCategory,
  sameTool,
  withSpeed,
  type HotkeyAction,
} from './hotkeys';
import { foreignHover, hoverInfo, hoverPosition, hoverVisible } from './hover';
import { targetTile } from './target';
import { bindInput, hintKey, type InputAction, type InputBinding } from './input';
import { clearForest, plantForest } from '../sim/forest';
import { setGoodLock, setTaxLevel, setUpgradeStop } from '../sim/tax';
import { renderInspect, renderRest, updateInspect, updateRest } from './inspect';
import { deliveredMessage, orderMessageFor, orderVisible } from './order';
import {
  friendlyReason,
  hintPosition,
  newlyConnected,
  placementHint,
  unconnectedIds,
  type ReasonCtx,
} from './hints';
import { resolveLogClick } from './logTarget';
import { renderEventLog, updateEventLog } from './eventLogView';
import { crisisFx, frameInputs, nextFireMemo, type FireMemo } from './crisisFx';
import { CLEAR } from '../render/weather';
import { crisisLogEntries, crisisLogVisible, pushLog, type LogEntry } from './crisisLog';
import { bindMessages, closeClosableToast, showMessage } from './messages';
import { MANIFEST } from '../audio/manifest';
import { creditEntries, FONT_CREDITS, type CreditEntry } from './credits';
import { parseDevParams } from './devParams';
import { createPerfProbe, exposeDevProbe, startAudioProbe } from './devProbes';
import { loadSettings, resolveReduceMotion, saveSettings } from './settings';
import { openSettings } from './settingsPanel';
import { openMenu, type MenuActions } from './menu';
import { closeAllModals, isModalOpen } from './modal';
import {
  UNLOCK_EVENTS,
  actionSound,
  buildSoundKey,
  diffSoundEvents,
  shortageEvents,
  shortageSnapshot,
  soundSnapshot,
  workCycleKinds,
  workProgress,
} from './soundEvents';
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
  /** Banner des zweiten Ziels bereits gezeigt (Spec M8 14.1; ein geladener Stand zeigt es nicht erneut). */
  wonMerchantsShown: boolean;
  /** Einträge, die die Freischalt-Meldung schon kennt: beim Start/Laden und bei „Neu“ = `world.unlocked` (Spec 11.6). */
  unlockedSeen: UnlockId[];
  /** Neu freigeschaltete Bau-Einträge bis zur ersten Wahl (Zeichen neu, K2); nur UI-Zustand, nicht gespeichert. */
  newEntries: Set<BuildingDefId>;
  /** Ereignis-Log der Krisen, neuester zuerst; nicht im Spielstand, leer nach Neu und Laden. */
  eventLog: LogEntry[];
  /** Insel, die der Spieler gerade ansieht (aus der Bildmitte, D-143); nur UI-Zustand, nicht gespeichert. */
  activeIsland: number;
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
  const world =
    loaded ??
    createWorld(Date.now() % 100000, {
      crisisLevel: settings.crisisLevel,
      unlockAll: settings.unlockMode === 'all',
    });
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
    ...initialGoalShown(world),
    unlockedSeen: [...world.unlocked],
    newEntries: new Set(),
    eventLog: [],
    activeIsland: 0,
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
  let closeHelp: (() => void) | null = null;
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

  const map = { w: home(world).width, h: home(world).height };
  const bounds = cameraBounds(world.islands); // Kamera-Rahmen: Archipel + Rand
  const view = { w: 1, h: 1 };

  // Fremdinsel-Ebenen: Plan erst nach dem ersten Frame (Erstbild nur Heimat), je Leerlauf-Slot eine Scheibe
  let cachePlan: CachePlan | null = null;
  const fremd = new Map<number, HTMLCanvasElement>();
  const planOf = (): CachePlan => {
    if (!cachePlan) {
      const scale = defaultTerrainScale();
      const jobs = world.islands.flatMap((_, i) => {
        if (i === 0) return [];
        const job = terrainJob(islandView(world, i), scale);
        fremd.set(i, job.layer);
        return [{ island: i, steps: job.steps }];
      });
      cachePlan = createCachePlan(jobs, () => performance.now());
    }
    return cachePlan;
  };
  const layers = createIslandLayers<HTMLCanvasElement>({
    // Laden und „Neue Insel" bauen das Spiel immer über `restart`/`launch` neu auf: Heimatebene und Plan gelten
    // je Spiel, die hier einmal erfasste Heimatebene wird nie ersetzt.
    home: state.terrainLayer,
    // Der Plan entsteht erst bei `idle`/`finish` (nach dem ersten Frame bzw. im Notfall); `done` legt ihn nie an,
    // damit `cachesReady()` der Dev-Sonde vorher `false` meldet und das Erstbild nur die Heimat zeichnet.
    plan: {
      idle: () => planOf().idle(),
      finish: (i) => planOf().finish(i),
      done: (i) => cachePlan?.done(i) ?? false,
    },
    layerOf: (i) => (planOf(), fremd.get(i)!),
    islands: world.islands.length,
    schedule: idleSchedule(window),
  });

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
    unlockMode: () => settings.unlockMode,
    hotkeys: () => hotkeyList(world),
    newIsland: (crisisLevel, unlockMode) => {
      settings = { ...settings, crisisLevel, unlockMode };
      saveSettings(settings);
      restart(root);
    },
    seed: () => world.seed,
    openGuide: (opener) => openHelp(opener),
  };
  /** Hilfe-Karte (Spec 12.1): HUD-Knopf, Taste `?`, Menü und Freischalt-Meldung; Esc schliesst, Fokus zurück zum Öffner. */
  const openHelp = (opener?: HTMLElement): void => {
    closeHelp?.();
    closeHelp = openStartCard(gameEl, { mode: 'help', opener, world });
  };

  /** Kamera auf die Insel `i` (Kontor-Mitte bzw. Inselmitte), Zoom bleibt; ohne Seefahrt stumm. */
  const jumpToIsland = (i: number): void => {
    if (functionLock(world, 'seafaring') !== null || !world.islands[i]) return;
    const t = jumpTarget(world, i);
    centerOn(state.cam, t.x, t.y, view, bounds);
    refresh();
  };

  const actions: HudActions = {
    jumpToIsland,
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
    openHelp: (opener) => openHelp(opener),
    openMenu: (opener) => {
      closeMenu?.();
      closeMenu = openMenu(gameEl, menuActions, opener);
    },
    openTownhall: () => {
      // Erste aktive Amtsstube, sonst irgendeine (Spec 11.8); ohne Amtsstube ist der Knopf verborgen
      const halls = Object.values(world.buildings).filter((b) => b.defId === 'townhall');
      const hall = halls.find((b) => b.connected && b.outageUntil === undefined) ?? halls[0];
      if (hall) {
        setPanel({ kind: 'inspect', id: hall.id });
        refresh();
      }
    },
    deliverOrder: () => {
      const o = world.order ? { ...world.order } : null;
      const r = deliverOrder(world);
      const ev = actionSound(r, 'orderDone');
      if (!r.ok)
        showError(friendlyReason(world, r.reason, o ? { good: o.good, amount: o.amount } : {}));
      else {
        // Vergleichswert zurücksetzen, damit die Lieferung nicht als „verfallen" gilt
        prevOrder = null;
        if (o) showMessage(deliveredMessage(o));
        if (ev) sound.play(ev);
      }
      refresh();
    },
  };

  /** Auftrag im letzten Frame (zum Erkennen von „Neuer Auftrag" / „Auftrag verfallen"). */
  let prevOrder: Order | null = world.order ? { ...world.order } : null;

  /** Pfad-Vorschau des Knopfs „Anbinden" (nur beim Überfahren), wird nach dem Zeichnen der Karte gemalt. */
  let connectPreview: readonly Pos[] | null = null;

  /** Wechselt den Panel-Inhalt; Auswahl-Hervorhebung folgt dem Panel. DOM wird neu gebaut. */
  const setPanel = (panel: PanelState): void => {
    state.panel = panel;
    connectPreview = null;
    panelEl.classList.toggle('card--rest', panel.kind === 'none');
    if (panel.kind === 'inspect') {
      state.selectedId = panel.id;
      renderInspect(panelEl, world, panel.id, {
        demolish: (id) => {
          const r = demolishBuilding(id);
          if (r.ok) {
            sound.play('demolish');
            setPanel({ kind: 'none' });
          }
          refresh();
        },
        openTrade: () => setPanel({ kind: 'trade' }),
        upgrade: (id) => {
          const b = world.buildings[id];
          const next = b ? LEVELS[b.defId]?.[(b.level ?? 1) - 1] : undefined;
          const r = upgradeBuilding(world, id);
          if (r.ok) sound.play('build');
          else showError(friendlyReason(world, r.reason, next ? { cost: next.cost } : {}));
          refresh();
        },
        setTax: (level) => {
          const r = setTaxLevel(world, level);
          if (!r.ok) showError(friendlyReason(world, r.reason));
          refresh();
        },
        setGoodLock: (tier, good, locked) => {
          const r = setGoodLock(world, tier, good, locked);
          if (!r.ok) showError(friendlyReason(world, r.reason));
          refresh();
        },
        connect: (id) => {
          connectPreview = null;
          const b = world.buildings[id];
          const v = b ? connectView(world, b) : null;
          if (v && !v.ok) showError(v.reason ?? v.label);
          else if (v) {
            const before = unconnectedIds(world);
            const r = connectBuilding(world, id);
            if (r.ok) {
              sound.playBuild(buildSoundKey({ kind: 'road' }) ?? 'road');
              reportConnections(before);
            } else {
              showError(friendlyReason(world, r.reason, { cost: v.cost }));
            }
          }
          refresh();
        },
        holdFeast: (id) => {
          const r = holdFeast(world, id);
          if (r.ok) sound.play('build');
          else showError(friendlyReason(world, r.reason));
          refresh();
        },
        previewConnect: (tiles) => {
          connectPreview = tiles;
        },
        setUpgradeStop: (tier, stopped) => {
          const r = setUpgradeStop(world, tier, stopped);
          if (!r.ok) showError(friendlyReason(world, r.reason));
          refresh();
        },
      });
    } else if (panel.kind === 'trade') {
      state.selectedId = home(world).kontorId;
      renderTrade(panelEl, world, {
        back: () => setPanel({ kind: 'inspect', id: home(world).kontorId }),
        changed: (op, r, good, n) => {
          if (!r.ok) showError(friendlyReason(world, r.reason, tradeCtx(op, good, n)));
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
    // Aktive Insel aus der Bildmitte (D-143: vor der Seefahrt immer die Heimat); bei Wechsel Bauleiste neu aufbauen
    const mid = screenToTileF(state.cam, view.w / 2, view.h / 2);
    const active = activeIsland(islandRects(world), mid, functionLock(world, 'seafaring') === null);
    if (active !== state.activeIsland) {
      state.activeIsland = active;
      renderBuildMenu(navEl, state, selectTool, toggleCategory);
    }
    const goal = goalBanners(state, world);
    state.wonShown = goal.shown.wonShown;
    state.wonMerchantsShown = goal.shown.wonMerchantsShown;
    for (const text of goal.texts) showMessage(text, 'info', true, true);
    for (const id of newBuildEntries(state.unlockedSeen, world)) state.newEntries.add(id);
    const unlock = frameUnlock(state.unlockedSeen, world);
    state.unlockedSeen = unlock.seen;
    if (unlock.text !== null) {
      showMessage(unlock.text, 'info', true, true, { label: 'Hilfe', onClick: () => openHelp() });
      renderBuildMenu(navEl, state, selectTool, toggleCategory); // neue Einträge ohne Kategoriewechsel
    }
    updateHud(hudEl, state, actions);
    updateNoticeStack(noticeStack, world);
    updateEventLog(logBox, state.eventLog, crisisLogVisible(world), (t) => {
      const r = resolveLogClick(t, world);
      centerOn(state.cam, r.tile.x + 0.5, r.tile.y + 0.5, view, bounds);
      if (!r.exists) showMessage('Gebäude nicht mehr vorhanden', 'info');
    });
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
    const locked = lockedToolText(state.world, tool);
    if (locked !== null) {
      showError(locked); // R151 W10: Weg der Bau-Ablehnungen, Meldung `error` plus Ton `error`
      return; // kein Werkzeug (Spec 11.2, AK-U1-02)
    }
    // RF-5: eine laufende Zieh-Aktion endet sauber, bevor das neue Werkzeug gilt
    input?.cancelPointerAction();
    state.tool = tool;
    if (tool.kind === 'build') state.newEntries.delete(tool.defId); // erste Wahl löscht das Zeichen „neu“
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
    } else if (id === home(world).kontorId) {
      // P-1: das Kontor öffnet direkt den Handel; erneutes Anklicken lässt ihn offen
      if (panel.kind !== 'trade') setPanel({ kind: 'trade' });
    } else if (panel.kind !== 'inspect' || panel.id !== id) {
      setPanel({ kind: 'inspect', id });
    }
  };

  // Geld-Fehler beim Strassen-Ziehen nur einmal pro Zug melden; jede Aktion ausserhalb eines Zugs setzt zurück
  let dragMoneyToastShown = false;
  let dragForestFailureShown = false;
  const forestCost = (tool: { kind: 'clearForest' | 'plantForest' }): Cost =>
    tool.kind === 'clearForest' ? CLEAR_FOREST_COST : PLANT_FOREST_COST;
  const showRoadFailure = (reason: string, dragging: boolean): void => {
    const text = friendlyReason(world, reason, { cost: ROAD_COST_OBJ });
    if (!dragging) {
      showError(text);
    } else if ((reason === 'Kein Geld' || reason === 'Zu wenig Geld') && !dragMoneyToastShown) {
      dragMoneyToastShown = true;
      showError(text);
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
    } else if (h.kind === 'help') {
      openHelp();
    } else if (h.kind === 'islandHome') {
      jumpToIsland(HOME);
    } else if (h.kind === 'islandCycle') {
      jumpToIsland(nextIsland(state.activeIsland, world.islands.length));
    } else {
      setSpeed(afterPause(state.speed, lastSpeed).speed);
    }
    refresh();
  };

  const reportConnections = (before: Set<number>): void => {
    for (const name of newlyConnected(before, world))
      showMessage(`${name} ist jetzt mit dem Kontor verbunden`);
  };
  const demolishBuilding = (id: number): Result => {
    const b = world.buildings[id];
    const text = b ? demolishText(world, b) : ''; // vor dem Abriss, solange Stufe und Welt stehen
    const r = demolish(world, id);
    if (r.ok) showMessage(text);
    else showError(friendlyReason(world, r.reason));
    return r;
  };
  const tradeCtx = (op: 'buy' | 'sell', good: GoodId, n: number): ReasonCtx =>
    op === 'buy'
      ? { cost: { money: buyPrice(good, n), wood: 0, tools: 0, stone: 0 }, good }
      : { good, amount: n };

  const onAction = (a: InputAction): void => {
    if (a.type === 'hotkey') {
      onHotkey(a.action);
      return;
    }
    if (a.type === 'cancel') {
      if (closeClosableToast()) return;
      setPanel({ kind: 'none' });
      selectTool({ kind: 'select' });
      return;
    }
    if (a.type === 'dragEnd') {
      dragMoneyToastShown = false;
      dragForestFailureShown = false;
      return;
    }
    if (!a.dragging) {
      dragMoneyToastShown = false;
      dragForestFailureShown = false;
    }
    const tool = state.tool;
    const tile = tileAt(home(world), a.x, a.y);
    if (tool.kind === 'select') {
      selectBuilding(tile?.buildingId ?? null);
    } else if (tool.kind === 'build') {
      const before = unconnectedIds(world);
      const r = placeBuilding(world, tool.defId, a.x, a.y);
      if (!r.ok) showError(friendlyReason(world, r.reason, { defId: tool.defId }));
      else {
        sound.playBuild(buildSoundKey(tool) ?? 'build');
        reportConnections(before);
      }
    } else if (tool.kind === 'road') {
      const before = unconnectedIds(world);
      const r = placeRoad(world, a.x, a.y);
      if (!r.ok) showRoadFailure(r.reason, a.dragging);
      else {
        sound.playBuild(buildSoundKey(tool) ?? 'road');
        reportConnections(before);
      }
    } else if (tool.kind === 'clearForest' || tool.kind === 'plantForest') {
      const r =
        tool.kind === 'clearForest' ? clearForest(world, a.x, a.y) : plantForest(world, a.x, a.y);
      if (r.ok) sound.play('build');
      else if (!dragForestFailureShown) {
        // Ziehen: eine Meldung je Zug mit dem ersten Grund (Spec K5)
        dragForestFailureShown = true;
        showError(friendlyReason(world, r.reason, { cost: forestCost(tool) }));
      }
    } else if (tile?.buildingId != null) {
      const r = demolishBuilding(tile.buildingId);
      if (r.ok) sound.play('demolish');
    } else {
      const r = removeRoad(world, a.x, a.y);
      if (!r.ok) showRoadFailure(r.reason, a.dragging);
      else sound.play('demolish');
    }
    refresh();
  };
  input = bindInput(canvas, state, onAction);

  // Cursor-Hinweis: Schild am Zeiger mit dem Grund; Zielkachel ausserhalb der Karte = kein Hover = kein Schild
  const hintEl = document.createElement('div');
  hintEl.className = 'cursor-hint';
  hintEl.hidden = true;
  document.body.appendChild(hintEl);
  let hintFor: string | null = null;
  const updateHint = (force: boolean): void => {
    const pos = input?.pointerClient() ?? null;
    const hover = state.hover;
    if (!hover || !pos || isModalOpen()) {
      hintEl.hidden = true;
      hintFor = null;
      return;
    }
    const key = hintKey(hover);
    if (force || key !== hintFor) {
      hintFor = key;
      const h = placementHint(world, hover.tool ?? state.tool, hover.x, hover.y);
      hintEl.hidden = h === null;
      if (h) {
        hintEl.textContent = h.text;
        hintEl.className = `cursor-hint cursor-hint--${h.tone}`;
      }
    }
    if (hintEl.hidden) return;
    const p = hintPosition(
      pos.x,
      pos.y,
      hintEl.offsetWidth,
      hintEl.offsetHeight,
      innerWidth,
      innerHeight,
    );
    hintEl.style.left = `${p.left}px`;
    hintEl.style.top = `${p.top}px`;
  };

  // Mouse-over-Karte (Spec M10 13): nach 400 ms Ruhe über derselben Kachel, nur mit dem Auswahl-Werkzeug
  const hoverEl = document.createElement('div');
  hoverEl.className = 'hover-card';
  hoverEl.setAttribute('role', 'tooltip');
  hoverEl.hidden = true;
  document.body.appendChild(hoverEl);
  const hoverTitle = document.createElement('strong');
  hoverTitle.className = 'hover-card__title';
  const hoverLines = document.createElement('div');
  hoverLines.className = 'hover-card__lines';
  hoverEl.append(hoverTitle, hoverLines);
  let hoverTile: string | null = null;
  let hoverSince = 0;
  let hoverShown: string | null = null;
  const hideHoverCard = (): void => {
    hoverEl.hidden = true;
    hoverShown = null;
  };
  /** Tier unter dem Zeiger: Treffer im Bildraum gegen `project(x, y) − z` und `r` (wildlifeAt-Vertrag). */
  const animalAt = (
    fx: RenderFx,
    sx: number,
    sy: number,
    tx: number,
    ty: number,
  ): string | null => {
    const range = {
      x0: Math.max(0, tx - 6),
      y0: Math.max(0, ty - 6),
      x1: Math.min(home(world).width - 1, tx + 6),
      y1: Math.min(home(world).height - 1, ty + 6),
    };
    let best: { name: string; d: number } | null = null;
    for (const h of wildlifeAt(world, range, fx.timeMs, wildlifeEnvOf(world, fx))) {
      const p = project(h.x, h.y);
      const c = worldToScreen(state.cam, { x: p.x, y: p.y - h.z });
      const d = Math.hypot(c.x - sx, c.y - sy);
      if (d <= h.r * (ISO_W / 2) * state.cam.zoom && (!best || d < best.d))
        best = { name: h.name, d };
    }
    return best?.name ?? null;
  };
  const updateHoverCard = (fx: RenderFx, now: number): void => {
    const client = input?.pointerClient() ?? null;
    const sel: Tool = { kind: 'select' };
    if (!client || state.tool.kind !== 'select' || isModalOpen()) {
      hoverTile = null;
      hideHoverCard();
      return;
    }
    const r = canvas.getBoundingClientRect();
    const sx = client.x - r.left,
      sy = client.y - r.top;
    const t = targetTile(world, state.cam, sel, sx, sy);
    const foreign = t ? null : foreignHover(world, state.cam, sx, sy);
    if (!t && !foreign) {
      hoverTile = null;
      hideHoverCard();
      return;
    }
    const f = screenToTileF(state.cam, sx, sy);
    const gx = Math.floor(f.x),
      gy = Math.floor(f.y);
    const key = foreign
      ? `i${foreign.island},${foreign.x},${foreign.y}`
      : `${t!.x},${t!.y},${gx},${gy}`;
    const sameTile = key === hoverTile;
    if (!sameTile) {
      hoverTile = key;
      hoverSince = now;
      hideHoverCard();
    }
    if (
      !hoverVisible({
        restMs: now - hoverSince,
        sameTile,
        dragging: input?.isDragging() ?? false,
        modalOpen: false,
        tool: state.tool,
      })
    ) {
      if (input?.isDragging()) hideHoverCard();
      return;
    }
    const ship = shipTile(world);
    const info =
      foreign?.info ??
      hoverInfo(world, t!, fx.timeMs, {
        ship: ship !== null && ship.x === gx && ship.y === gy,
        animal: animalAt(fx, sx, sy, gx, gy),
      });
    if (!info) {
      hideHoverCard();
      return;
    }
    const text = `${info.title}\n${info.lines.join('\n')}`;
    if (text !== hoverShown) {
      hoverShown = text;
      hoverTitle.textContent = info.title;
      hoverLines.replaceChildren(
        ...info.lines.map((l) => {
          const p = document.createElement('p');
          p.textContent = l;
          return p;
        }),
      );
    }
    hoverEl.hidden = false;
    const pos = hoverPosition(
      client,
      { w: hoverEl.offsetWidth, h: hoverEl.offsetHeight },
      { w: innerWidth, h: innerHeight },
    );
    hoverEl.style.left = `${pos.x}px`;
    hoverEl.style.top = `${pos.y}px`;
  };

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
  const kontor = world.buildings[home(world).kontorId];
  const resize = (): void => {
    const w = Math.max(1, gameEl.clientWidth);
    const h = Math.max(1, gameEl.clientHeight);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    view.w = w;
    view.h = h;
    clampToRect(state.cam, bounds, w, h);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(gameEl);
  resize();
  if (kontor && !opts?.camera) {
    const c = center(BUILDING_DEFS[kontor.defId], kontor.x, kontor.y);
    centerOn(state.cam, c.cx, c.cy, view, bounds);
  }

  let acc = 0;
  let autoMs = 0;
  let autoErrorShown = false;
  let prevSnap = soundSnapshot(world);
  let prevShortage = shortageSnapshot(world);
  let prevWork = workProgress(world);
  let prevEconTick = world.tick;
  let prevOrderVisible = orderVisible(world);
  // Nach dem Laden ist der geladene Stand die Vergleichsbasis: eine laufende Krise erzeugt keinen Eintrag
  let prevCrisis = crisisView(world);
  let last = performance.now();
  let lastAmbienceMs = -Infinity;
  let fireMemo: FireMemo = null;
  const previewFire = preview.fireIds?.map((id) => ({ id, flames: 1, smoke: 1 }));
  let frame = 0;
  if (import.meta.env.DEV) {
    exposeDevProbe({
      world: () => state.world,
      // Mitte der Raute (obere und untere Ecke) in CSS-Pixeln der Seite
      tileCenter: (x, y) => {
        const c = tileCorners(state.cam, x, y);
        const r = canvas.getBoundingClientRect();
        return { x: r.left + (c[0].x + c[2].x) / 2, y: r.top + (c[0].y + c[2].y) / 2 };
      },
      centerOn: (x, y) => centerOn(state.cam, x + 0.5, y + 0.5, view, bounds),
      setZoom: (z) => zoomAt(state.cam, z / state.cam.zoom, view.w / 2, view.h / 2, view, bounds),
      focus: (kind) => {
        if (kind === 'archipel')
          centerOn(
            state.cam,
            (bounds.x0 + bounds.x1) / 2,
            (bounds.y0 + bounds.y1) / 2,
            view,
            bounds,
          );
        else if (kontor) {
          const c = center(BUILDING_DEFS[kontor.defId], kontor.x, kontor.y);
          centerOn(state.cam, c.cx, c.cy, view, bounds);
        }
      },
      cachesReady: () => layers.ready(),
      slices: () => [...(cachePlan?.sliceMs ?? [])],
      emergency: () => [...(cachePlan?.emergencyMs ?? [])],
    });
  }
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
      // Wirtschaftstöne nur auswerten, wenn die Sim weitergelaufen ist (Pause und Stillstand allozieren nichts)
      if (world.tick !== prevEconTick) {
        prevEconTick = world.tick;
        const shortage = shortageSnapshot(world);
        for (const g of shortageEvents(prevShortage, shortage)) sound.playShortage(g);
        prevShortage = shortage;
        for (const k of workCycleKinds(prevWork, world, visibleTileRange(state.cam, view, map)))
          sound.playWork(k);
        prevWork = workProgress(world);
      }
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
      const msg = orderMessageFor(prevOrder, prevOrderVisible, world);
      if (msg) showMessage(msg);
      prevOrderVisible = orderVisible(world);
      prevOrder = world.order ? { ...world.order } : null;
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
      perf?.frame(now, layers.lastFrameEmergency, layers.emergencyFrames);
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
      const fx: RenderFx = {
        timeMs: t0,
        dayNight: settings.dayNight,
        weather,
        reduceMotion: reduce,
        fire: previewFire ?? inputs.render.fire,
        boom: preview.boom ?? inputs.render.boom,
        raster: preview.raster === true,
      };
      render(ctx, world, state.cam, layers, state.hover, state.selectedId, view, fx);
      if (connectPreview) drawPathPreview(ctx, state.cam, connectPreview);
      perf?.renderDone(performance.now() - t0);
      layers.frameDone();
      updateMoney(hudEl, world);
      updateHint(frame % HUD_EVERY_FRAMES === 0);
      updateHoverCard(fx, t0);
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
    layers.dispose();
    resizeObserver.disconnect();
    input?.unbind();
    closeAllModals();
    closeSettings?.();
    stopAudioProbe?.();
    if (import.meta.env.DEV) delete window.__inselDev;
    motionQuery.removeEventListener('change', onMotion);
    removeUnlockListeners();
    window.removeEventListener('pagehide', onPageHide);
    document.removeEventListener('visibilitychange', onVisibility);
    sound.dispose();
    logBox.remove();
    hintEl.remove();
    hoverEl.remove();
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
