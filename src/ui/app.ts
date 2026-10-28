import { BUILDING_DEFS, ROAD_COST_OBJ } from '../sim/defs/buildings';
import { TICK_MS } from '../sim/defs/timing';
import { crisisView } from '../sim/queries';
import { setReserve } from '../sim/reserve';
import {
  acceptContract,
  acceptFarOrder,
  cancelContract,
  contractWarning,
  declineContract,
  deliverOrder,
} from '../sim/orders';
import { autoSnap, contractLogEntries, expiryLogEntries } from './autoLog';
import {
  deliverTarget,
  farAcceptedMessage,
  farDeliveredEntry,
  farLogEntries,
  farSnap,
} from './farOrder';
import { demolish, placeBuilding, placeRoad, removeRoad } from '../sim/build';
import { connectBuilding } from '../sim/connect';
import { step, type StepReport } from '../sim/tick';
import { SHIP } from '../sim/defs/sea';
import {
  buyShip,
  clearRoute,
  freeShipAtHome,
  retireShip,
  setRoute,
  updateRoute,
} from '../sim/ships';
import { shipAt } from '../render/shipLane';
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
import { applyGoalShown, goalBanners, initialGoalShown, frameUnlock, lockedToolText } from './goal';
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
import {
  runFocusStep,
  runFocusToggle,
  shouldClearFocus,
  stepKeyTarget,
  type FocusDeps,
  type FocusState,
} from './goodFocus';
import { contractKey, nextContractCursor, runContractJump } from './contractJump';
import { cutOffIds, newlyCut, runProblemJump, spot, type ProblemCursor } from './problems';
import { trackFullSince } from './storageFull';
import { openUpkeepCard } from './upkeepCard';
import { openResumeCard } from './resumeCard';
import { createCachePlan, type CachePlan } from '../render/cachePlan';
import { buildTerrainLayer, defaultTerrainScale, terrainJob } from '../render/terrain';
import { createIslandLayers, idleSchedule } from './islandLayers';
import { drawPathPreview } from '../render/pathPreview';
import { connectView } from './connect';
import { buildLine, linePath, linePlan, lineHintText, type LinePlan } from './roadLine';
import { phaseAt } from '../render/daynight';
import { viewStats } from '../render/viewStats';
import { advanceRiseClock, detectRises, pickRises, type Rise } from '../render/aufstieg';
import { cap } from '../render/limits';
import { homeBuildings } from '../render/homeBuildings';
import { newBuildEntries, renderBuildMenu, updateBuildMenu } from './buildMenu';
import {
  renderNoticeStack,
  updateHud,
  updateMoney,
  unbindIslandMenu,
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
  demolishTarget,
  upgradeTarget,
} from './hotkeys';
import { applyPauseOverlay } from './pauseOverlay';
import { buildingDefAt, pipetteResult } from './pipette';
import {
  foreignBuildingHover,
  foreignHover,
  hoverInfo,
  hoverPosition,
  hoverVisible,
  cursorHintVisible,
} from './hover';
import { highlightShip, homeKontorPanel, lossMessages, shipHover, type ShipActions } from './ships';
import { targetTile } from './target';
import {
  CONFIRM_TEXT,
  MAP_SKIP_TEXT,
  confirmStep,
  mapDemolishAllowed,
  type ConfirmState,
} from './demolishConfirm';
import { bindInput, hintKey, strokeEndNotice, type InputAction, type InputBinding } from './input';
import { clearForest, plantForest } from '../sim/forest';
import { setGoodLock, setTaxLevel, setTierTaxLevel, setTithe, setUpgradeStop } from '../sim/tax';
import { openTitheConfirm } from './titheDialog';
import {
  collectTitheLoss,
  newTitheLossState,
  titheClickChangesState,
  titheConfirmLines,
} from './titheView';
import { lockedTierFor } from './taxView';
import { setEdict } from '../sim/edicts';
import { decree } from '../sim/council';
import { abortTrial, startTrial } from '../sim/trial';
import { COUNCIL, COUNCIL_OPEN_MESSAGE } from '../sim/defs/council';
import {
  councilEscapeHandled,
  councilOpenNext,
  councilDecidedEntries,
  councilOpened,
  councilToggleAllowed,
} from './council';
import { createCouncilCard } from './councilCard';
import { createTrialCard } from './trialCard';
import { TRIAL_ABORT_MESSAGE, trialChip, trialStartMessage, trialTransition } from './trial';
import { setMonumentBuy, setMonumentPaused, startMonumentStage } from '../sim/monument';
import { monumentStageCost, monumentStartedText } from './monumentView';
import { setPaused } from '../sim/pause';
import { EDICT_COST } from '../sim/defs/edicts';
import { edictSuccessText } from './edictView';
import { DEMOLISH_LABEL, renderInspect, renderRest, updateInspect, updateRest } from './inspect';
import {
  CONTRACT_CANCELLED,
  announceContract,
  contractAgreedMessage,
  deliveredMessage,
  flashOrderCard,
  orderMessageFor,
  orderVisible,
  runContractAction,
  warnPeriod,
} from './order';
import { warnStep } from './warnStep';
import {
  friendlyReason,
  hintPosition,
  newlyConnected,
  placementHint,
  unconnectedIds,
  type Hint,
  type ReasonCtx,
} from './hints';
import { resolveLogClick } from './logTarget';
import { isEventLogExpanded, renderEventLog, updateEventLog } from './eventLogView';
import { crisisFx, frameInputs, nextFireMemo, type FireMemo } from './crisisFx';
import { CLEAR } from '../render/weather';
import { monumentEvents, monumentSnapshot } from './monumentView';
import { crisisLogEntries, eventLogVisible, nextUnread, pushLog, type LogEntry } from './crisisLog';
import { bindMessages, closeClosableToast, replaceMessage, showMessage } from './messages';
import { MANIFEST } from '../audio/manifest';
import { creditEntries, FONT_CREDITS, type CreditEntry } from './credits';
import { parseDevParams } from './devParams';
import { createPerfProbe, exposeDevProbe, startAudioProbe } from './devProbes';
import { loadSettings, resolveReduceMotion, saveSettings } from './settings';
import { openSettings } from './settingsPanel';
import { openHonorBook } from './honorBook';
import { openHonorCard } from './honorCard';
import { honorCount, honorHints, honorMessage, honorRows, menuLine } from './honorView';
import { createHonorTracker, launchRun } from './honorTracker';
import type { HonorHit } from './honorBook';
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
  loadNotice,
  saveAuto,
  saveToStorage,
  type Slot,
} from './storage';
import { openStartCard, startChoices, STORAGE_NOTES } from './startCard';
import { renderTrade, tradeReasonCtx, updateTrade } from './trade';

export type PanelState =
  { kind: 'none' } | { kind: 'inspect'; id: number } | { kind: 'trade'; island: number };

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
  /** Banner des dritten Ziels (Gewürzstadt) bereits gezeigt (M12 Z3). */
  wonSpiceShown: boolean;
  /** Einträge, die die Freischalt-Meldung schon kennt: beim Start/Laden und bei „Neu“ = `world.unlocked` (Spec 11.6). */
  unlockedSeen: UnlockId[];
  /** Neu freigeschaltete Bau-Einträge bis zur ersten Wahl (Zeichen neu, K2); nur UI-Zustand, nicht gespeichert. */
  newEntries: Set<BuildingDefId>;
  /** Ereignis-Log der Krisen, neuester zuerst; nicht im Spielstand, leer nach Neu und Laden. */
  eventLog: LogEntry[];
  /** Auffällige Ereignisse seit dem letzten Aufklappen des Logs; nur UI-Zustand, nicht gespeichert. */
  logUnread: number;
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
  const pauseEl = need<HTMLElement>(root, '.pause-overlay');
  const hudEl = need<HTMLElement>(root, '#hud');
  const navEl = need<HTMLElement>(root, '#buildbar');
  const panelEl = need<HTMLElement>(root, '#panel');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D nicht verfügbar');

  let settings = loadSettings();
  const honorBook = openHonorBook(() => {
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  });
  const world =
    loaded ??
    createWorld(Date.now() % 100000, {
      crisisLevel: settings.crisisLevel,
      unlockAll: settings.unlockMode === 'all',
    });
  // Ehrenbuch (I-186): ein Tracker je Spiel (P-1); der Partie-Merker wird nur bei «Neue Insel» geschrieben (P-2)
  const tracker = createHonorTracker(world);
  const launched = launchRun(
    { loaded: loaded !== undefined, intro: opts?.intro === true },
    honorBook.data().run,
    world.seed,
    settings.unlockMode,
  );
  let run = launched.run;
  if (launched.write && run !== null) honorBook.setRun(run);
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
    logUnread: 0,
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
  const contractOut = { showError, show: (text: string): void => showMessage(text) };
  /** Letzte Auftrags- und Vertragsklänge (höchstens 20), nur für die Dev-Sonde. */
  const contractSoundLog: string[] = [];
  const recordContractSound = (e: string): void => {
    contractSoundLog.push(e);
    if (contractSoundLog.length > 20) contractSoundLog.shift();
  };

  // Ereignis-Log schwebt unten links über der Spielfläche (R112)
  const logBox = document.createElement('div');
  logBox.className = 'log-box';
  renderEventLog(logBox, () => {
    state.logUnread = 0;
  });
  gameEl.appendChild(logBox);

  const noticeStack = renderNoticeStack(gameEl, world, {
    deliver: () => actions.deliverOrder(),
    acceptFar: (pick = 0) => {
      const r = acceptFarOrder(world, pick);
      if (!r.ok) showError(r.reason);
      else showMessage(farAcceptedMessage(world, world.order!));
      farPrev = farSnap(world);
      autoPrev = autoSnap(world);
      prevOrder = world.order ? { ...world.order } : null;
      refresh();
    },
    accept: () => {
      runContractAction(acceptContract(world), () => contractAgreedMessage(world), contractOut);
      autoPrev = autoSnap(world);
      refresh();
    },
    decline: () => {
      runContractAction(declineContract(world), () => null, contractOut);
      autoPrev = autoSnap(world);
      refresh();
    },
    toProducer: () => jumpToContractProducer(),
    cancel: () => {
      runContractAction(cancelContract(world), () => CONTRACT_CANCELLED, contractOut);
      autoPrev = autoSnap(world);
      refresh();
    },
  });

  const map = { w: home(world).width, h: home(world).height };
  const bounds = cameraBounds(world.islands); // Kamera-Rahmen: Archipel + Rand
  const view = { w: 1, h: 1 };
  /** Sichtfenster für Klemmung und Zentrierung: volle Breite, nur die sichtbare Höhe (ohne Bauleisten-Overlay). */
  const clampView = (): { w: number; h: number } => ({
    w: view.w,
    h: input?.visibleHeight() ?? view.h,
  });

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
    // Hinweis eines alten Standes: einmal je Laden, nicht im Spielstand (Anhang 03 D)
    const notice = loadNotice(r);
    if (notice !== null) showMessage(notice, 'info', true, true);
    openResumeCard(gameEl, r.world);
  };

  /** Manuelles Speichern: Menü-Knopf und Strg/Cmd+S gehen hier durch (kein Ton, Zustand bleibt). */
  const saveManual = (): void => {
    const r = saveToStorage(world);
    if (r.ok) showMessage('Gespeichert');
    else showMessage(r.reason, 'error');
  };

  const menuActions: MenuActions = {
    save: () => saveManual(),
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
    honors: () => ({
      line: menuLine(honorCount(honorBook.data(), honorBook.session())),
      note:
        honorBook.status() === 'ok'
          ? null
          : (honorHints(honorBook.status(), run, world.seed)[0] ?? null),
    }),
    openHonors: (opener) =>
      openHonorCard(gameEl, {
        rows: honorRows(honorBook.data(), honorBook.session()),
        count: honorCount(honorBook.data(), honorBook.session()),
        hints: honorHints(honorBook.status(), run, world.seed),
        opener,
      }),
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
    centerOn(state.cam, t.x, t.y, clampView(), bounds);
    refresh();
  };

  /** Problem-Sprung (I-042): Cursor nur in der Closure, nie im Spielstand. */
  let problemCursor: ProblemCursor | null = null;
  /** «Lager voll» (I-085): Zähler nur hier; Laden/Neues Spiel bauen über `restart` eine frische Closure, `trackFullSince` verwirft zudem Zähler fremder Welten. */
  const fullSince = new Map<string, number>();
  const jumpToProblem = (dir: 1 | -1): void =>
    runProblemJump(
      {
        world,
        fullSince,
        activeIsland: () => state.activeIsland,
        getCursor: () => problemCursor,
        setCursor: (c) => {
          problemCursor = c;
        },
        cancelPointerAction: () => input?.cancelPointerAction(),
        centerOn: (x, y) => centerOn(state.cam, x, y, clampView(), bounds),
        openPanel: (id) => setPanel({ kind: 'inspect', id }), // E1: kein selectTool
        refresh,
        message: (t) => replaceMessage('problem', t),
      },
      dir,
    );

  /** Gut-Fokus (I-043): Zustand nur in der Closure, nie im Spielstand. Neue Insel/Laden starten über `restart` eine frische Closure. */
  let goodFocus: FocusState = null;
  let focusCursor: ProblemCursor | null = null;
  const clearGoodFocus = (): void => {
    goodFocus = null;
    focusCursor = null;
  };
  const focusDeps: FocusDeps = {
    world,
    activeIsland: () => state.activeIsland,
    getFocus: () => goodFocus,
    setFocus: (f) => {
      goodFocus = f;
    },
    getCursor: () => focusCursor,
    setCursor: (c) => {
      focusCursor = c;
    },
    cancelPointerAction: () => input?.cancelPointerAction(),
    centerOn: (x, y) => centerOn(state.cam, x, y, clampView(), bounds),
    openPanel: (id) => setPanel({ kind: 'inspect', id }), // kein selectTool
    refresh: () => refresh(),
    message: (t) => replaceMessage('gut', t),
  };

  /** Vertragssprung (I-090): eigener Cursor nur in der Closure; Laden/Neues Spiel starten über `restart` neu. */
  let contractCursor: ProblemCursor | null = null;
  let contractCursorKey: string | null = contractKey(world);
  const jumpToContractProducer = (): void => {
    syncContractCursor();
    runContractJump(
      {
        world,
        activeIsland: () => state.activeIsland,
        getCursor: () => contractCursor,
        setCursor: (c) => {
          contractCursor = c;
        },
        cancelPointerAction: () => input?.cancelPointerAction(),
        centerOn: (x, y) => centerOn(state.cam, x, y, clampView(), bounds),
        openPanel: (id) => setPanel({ kind: 'inspect', id }), // kein selectTool
        refresh,
        message: (t) => replaceMessage('vertrag', t),
      },
      1,
    );
  };
  const syncContractCursor = (): void => {
    const next = nextContractCursor(world, { cursor: contractCursor, key: contractCursorKey });
    contractCursor = next.cursor;
    contractCursorKey = next.key;
  };

  /** Betriebsliste (I-062): Sprung zum Gebäude wie beim Problem-Sprung (Kamera, Panel, gefolgte Insel). */
  const jumpToBuilding = (id: number): void => {
    const b = world.buildings[id];
    if (!b) return; // inzwischen abgerissen
    input?.cancelPointerAction();
    const at = spot(world, b);
    centerOn(state.cam, at.x, at.y, clampView(), bounds);
    setPanel({ kind: 'inspect', id }); // kein selectTool
    refresh();
  };

  /** Rats-Karte (I-112): kein Modal, keine Pause; `prevCouncil` ab Start = geladener Stand (kein Hinweis für Altes). */
  let prevCouncil: World['council'] | null = { ...world.council };
  const councilCard = createCouncilCard(
    gameEl,
    (tier, side) => {
      const r = decree(world, tier, side);
      if (r.ok) {
        showMessage(`Beschluss gefasst: ${COUNCIL[tier][side]?.name ?? side}`);
        sound.play('build');
      } else showError(friendlyReason(world, r.reason));
      refresh();
    },
    () => {
      councilCard.setOpen(councilOpenNext(true, 'escape'));
    },
  );

  /** Auflagen-Karte der Meisterprüfung (I-132); `prevTrial` ab Start = geladener Stand (keine Meldung für Geladenes). */
  const cloneTrial = (t: World['trial']): World['trial'] => ({ ...t, passed: [...t.passed] });
  let prevTrial: World['trial'] | null = cloneTrial(world.trial);
  const trialCard = createTrialCard(
    gameEl,
    () => {
      const r = startTrial(world, 'selfSupply');
      if (r.ok) showMessage(trialStartMessage());
      else showError(friendlyReason(world, r.reason));
      prevTrial = cloneTrial(world.trial);
      refresh();
    },
    () => {
      const r = abortTrial(world);
      if (r.ok) showMessage(TRIAL_ABORT_MESSAGE);
      else showError(friendlyReason(world, r.reason));
      prevTrial = cloneTrial(world.trial);
      refresh();
    },
    () => trialCard.setOpen(false),
  );

  const actions: HudActions = {
    toggleCouncil: () => {
      trialCard.setOpen(false);
      councilCard.setOpen(councilOpenNext(councilCard.isOpen, 'toggle'));
    },
    toggleTrial: () => {
      if (trialChip(world) === null) return;
      const next = !trialCard.isOpen;
      if (next) councilCard.setOpen(false);
      trialCard.setOpen(next);
    },
    jumpToIsland,
    openUpkeep: (opener) => openUpkeepCard(gameEl, world, jumpToBuilding, opener),
    toggleGoodFocus: (good) => runFocusToggle(focusDeps, good),
    focusedGood: () => goodFocus?.good ?? null,
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
      const target = deliverTarget(world, state.activeIsland);
      const r = deliverOrder(world, target);
      const ev = actionSound(r, 'orderDone');
      if (!r.ok)
        showError(
          friendlyReason(
            world,
            r.reason,
            o ? { good: o.good, amount: o.amount, island: target } : { island: target },
          ),
        );
      else {
        // Vergleichswert zurücksetzen, damit die Lieferung nicht als „verfallen" gilt
        prevOrder = null;
        if (o && o.island !== undefined) {
          const e = farDeliveredEntry(o, world.tick);
          state.eventLog = pushLog(state.eventLog, [e]);
          state.logUnread = nextUnread(state.logUnread, [e], isEventLogExpanded(logBox));
          showMessage(e.text);
        } else if (o) showMessage(deliveredMessage(o));
        if (ev) {
          sound.play(ev);
          recordContractSound(ev);
        }
        farPrev = farSnap(world);
        autoPrev = autoSnap(world);
      }
      refresh();
    },
  };

  /** Auftrag im letzten Frame (zum Erkennen von „Neuer Auftrag" / „Auftrag verfallen"). */
  let prevOrder: Order | null = world.order ? { ...world.order } : null;
  /** Fernangebot und -auftrag im letzten Frame (Log bei Verfall). */
  let farPrev = farSnap(world);
  /** Zufallsauftrag, Stammkunden-Angebot im letzten Frame (Log bei Verfall). */
  let autoPrev = autoSnap(world);

  /** Pfad-Vorschau des Knopfs „Anbinden" (nur beim Überfahren), wird nach dem Zeichnen der Karte gemalt. */
  let connectPreview: readonly Pos[] | null = null;

  /** Schiffe und Routen im Kontor-Panel (M12 E4): Sim-Aktion, bei Ablehnung der Grund der Sim. */
  const shipActions: ShipActions = {
    buy: () => {
      const r = buyShip(world);
      if (r.ok) sound.play('build');
      else showError(friendlyReason(world, r.reason, { cost: SHIP.cost, island: HOME }));
      refresh();
    },
    startRoute: (route) => {
      const ship = freeShipAtHome(world);
      const r =
        ship === null
          ? { ok: false as const, reason: 'Kein freies Schiff' }
          : setRoute(world, ship.id, route);
      if (r.ok) sound.play('build');
      else showError(friendlyReason(world, r.reason));
      refresh();
    },
    changeRoute: (id, route) => {
      const r = updateRoute(world, id, route);
      if (!r.ok) showError(friendlyReason(world, r.reason));
      refresh();
    },
    clearRoute: (id) => {
      const r = clearRoute(world, id);
      if (!r.ok) showError(friendlyReason(world, r.reason));
      refresh();
    },
    retire: (id) => {
      const r = retireShip(world, id);
      if (!r.ok) showError(friendlyReason(world, r.reason));
      refresh();
    },
    reject: (reason) => showError(friendlyReason(world, reason)),
  };

  /** Ausbau eines Gebäudes: gemeinsamer Weg für den Knopf «Ausbauen» und Umschalt+U (C-5). */
  const upgradeSelected = (id: number): void => {
    const b = world.buildings[id];
    const next = b ? LEVELS[b.defId]?.[(b.level ?? 1) - 1] : undefined;
    const r = upgradeBuilding(world, id);
    if (r.ok) sound.play('build');
    else
      showError(
        friendlyReason(
          world,
          r.reason,
          next ? { cost: next.cost, island: b?.island } : { island: b?.island },
        ),
      );
    refresh();
  };
  /** Pipette und Knopf «Gleiches bauen»: Gebäudetyp als Bauwerkzeug (B-3, B-4, B-7). */
  const pipette = (defId: BuildingDefId): void => {
    const r = pipetteResult(world, defId);
    if (!r.ok) {
      showError(r.reason);
      return;
    }
    if (sameTool(state.tool, r.tool)) return; // B-7: bleibt aktiv, Panel unberührt
    selectTool(r.tool);
  };
  /** Wechselt den Panel-Inhalt; Auswahl-Hervorhebung folgt dem Panel. DOM wird neu gebaut. */
  const setPanel = (panel: PanelState): void => {
    state.panel = panel;
    demolishConfirm = confirmStep(world, demolishConfirm, { kind: 'reset' }).state;
    connectPreview = null;
    panelEl.classList.toggle('card--rest', panel.kind === 'none');
    if (panel.kind === 'inspect') {
      state.selectedId = panel.id;
      renderInspect(panelEl, world, panel.id, {
        demolish: (id) => demolishFromPanel(id),
        openTrade: () => {
          const b = world.buildings[panel.id];
          if (b) setPanel({ kind: 'trade', island: b.island });
        },
        upgrade: (id) => upgradeSelected(id),
        buildSame: (defId) => pipette(defId),
        setTax: (level) => {
          const tier = lockedTierFor(world, level);
          const r = setTaxLevel(world, level);
          if (!r.ok) showError(friendlyReason(world, r.reason, { tier }));
          refresh();
        },
        setTierTax: (tier, level) => {
          const r = setTierTaxLevel(world, tier, level);
          if (!r.ok) showError(friendlyReason(world, r.reason, { tier }));
          refresh();
        },
        setTithe: (tier, on, opener) => {
          if (tier !== 1 && tier !== 2) return;
          if (!titheClickChangesState(world, tier, on)) return;
          const apply = (value: boolean): void => {
            const r = setTithe(world, tier, value);
            if (!r.ok) showError(friendlyReason(world, r.reason, { tier }));
            refresh();
          };
          if (on)
            openTitheConfirm(gameEl, titheConfirmLines(world, tier), opener, () => apply(true));
          else apply(false);
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
              showError(friendlyReason(world, r.reason, { cost: v.cost, island: b?.island }));
            }
          }
          refresh();
        },
        holdFeast: (id, kind) => {
          const r = holdFeast(world, id, kind);
          if (r.ok) sound.play('build');
          else showError(friendlyReason(world, r.reason));
          refresh();
        },
        previewConnect: (tiles) => {
          connectPreview = tiles;
        },
        ships: shipActions,
        setPaused: (id, paused) => {
          const r = setPaused(world, id, paused);
          if (!r.ok) showError(friendlyReason(world, r.reason));
          refresh();
        },
        setEdict: (id) => {
          const r = setEdict(world, id);
          if (r.ok) {
            showMessage(edictSuccessText(world, id));
            sound.play('build');
          } else
            showError(
              friendlyReason(world, r.reason, {
                cost: { money: EDICT_COST, wood: 0, tools: 0, stone: 0 },
              }),
            );
          refresh();
        },
        startMonumentStage: () => {
          const stage = world.monument?.stage ?? 0;
          const r = startMonumentStage(world);
          if (r.ok) {
            showMessage(monumentStartedText(stage));
            sound.play('build');
          } else
            showError(
              friendlyReason(world, r.reason, {
                cost: {
                  money: monumentStageCost(world.monument),
                  wood: 0,
                  tools: 0,
                  stone: 0,
                },
              }),
            );
          refresh();
        },
        setMonumentPaused: (paused) => {
          const r = setMonumentPaused(world, paused);
          if (!r.ok) showError(friendlyReason(world, r.reason));
          refresh();
        },
        setMonumentBuy: (good, on) => {
          const r = setMonumentBuy(world, good, on);
          if (!r.ok) showError(friendlyReason(world, r.reason));
          refresh();
        },
        setUpgradeStop: (tier, stopped) => {
          const r = setUpgradeStop(world, tier, stopped);
          if (!r.ok) showError(friendlyReason(world, r.reason));
          refresh();
        },
      });
    } else if (panel.kind === 'trade') {
      const tradeIsland = panel.island;
      state.selectedId = world.islands[tradeIsland]!.kontorId;
      renderTrade(
        panelEl,
        world,
        {
          back: () => {
            const k = world.islands[tradeIsland]!.kontorId;
            setPanel(k === null ? { kind: 'none' } : { kind: 'inspect', id: k });
          },
          changed: (op, r, good, n) => {
            if (!r.ok)
              showError(friendlyReason(world, r.reason, tradeCtx(op, good, n, tradeIsland)));
            else if (op === 'sell') sound.play('coin');
            refresh();
          },
          reserve: (good, value) => {
            const r = setReserve(world, tradeIsland, good, value);
            if (!r.ok) showError(friendlyReason(world, r.reason));
            refresh();
          },
        },
        tradeIsland,
      );
    } else {
      state.selectedId = null;
      renderRest(panelEl, world);
    }
  };

  /** Aktualisiert HUD, Bauleiste und Panel-Zahlen (ohne DOM-Neuaufbau). */
  const refresh = (): void => {
    applyPauseOverlay(pauseEl, state.speed, isModalOpen());
    // Aktive Insel aus der Bildmitte (D-143: vor der Seefahrt immer die Heimat); bei Wechsel Bauleiste neu aufbauen
    const mid = screenToTileF(state.cam, view.w / 2, view.h / 2);
    const active = activeIsland(islandRects(world), mid, functionLock(world, 'seafaring') === null);
    if (active !== state.activeIsland) {
      state.activeIsland = active;
      renderBuildMenu(navEl, state, selectTool, toggleCategory);
    }
    if (shouldClearFocus(goodFocus, active)) clearGoodFocus();
    const goal = goalBanners(state, world);
    applyGoalShown(state, goal.shown);
    for (const text of goal.texts) showMessage(text, 'info', true, true);
    for (const id of newBuildEntries(state.unlockedSeen, world)) state.newEntries.add(id);
    const unlock = frameUnlock(state.unlockedSeen, world);
    state.unlockedSeen = unlock.seen;
    if (unlock.text !== null) {
      showMessage(unlock.text, 'info', true, true, { label: 'Hilfe', onClick: () => openHelp() });
      renderBuildMenu(navEl, state, selectTool, toggleCategory); // neue Einträge ohne Kategoriewechsel
    }
    trackFullSince(fullSince, world);
    syncContractCursor();
    updateHud(hudEl, state, actions);
    if (councilOpened(prevCouncil, world.council).length > 0) showMessage(COUNCIL_OPEN_MESSAGE);
    const councilLogged = councilDecidedEntries(prevCouncil, world.council, world.tick);
    if (councilLogged.length > 0) {
      state.eventLog = pushLog(state.eventLog, councilLogged);
      state.logUnread = nextUnread(state.logUnread, councilLogged, isEventLogExpanded(logBox));
    }
    prevCouncil = { ...world.council };
    councilCard.update(world);
    const trialMsg = trialTransition(prevTrial, world.trial);
    if (trialMsg !== null) showMessage(trialMsg, 'info', true, true);
    prevTrial = cloneTrial(world.trial);
    if (trialCard.isOpen && trialChip(world) === null) trialCard.setOpen(false);
    trialCard.update(world);
    updateNoticeStack(noticeStack, world, state.activeIsland);
    updateEventLog(
      logBox,
      state.eventLog,
      eventLogVisible(world, state.eventLog),
      (t) => {
        const r = resolveLogClick(t, world);
        centerOn(state.cam, r.tile.x + 0.5, r.tile.y + 0.5, clampView(), bounds);
        if (!r.exists) showMessage('Gebäude nicht mehr vorhanden', 'info');
      },
      state.logUnread,
    );
    updateBuildMenu(navEl, world, state.activeIsland);
    const panel = state.panel;
    if (panel.kind === 'inspect') {
      if (world.buildings[panel.id]) updateInspect(panelEl, world, panel.id);
      else setPanel({ kind: 'none' });
    } else if (panel.kind === 'trade') {
      if (world.islands[panel.island]?.kontorId == null) setPanel({ kind: 'none' });
      else updateTrade(panelEl, world, panel.island);
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
      // P-1: das Kontor der Heimat öffnet den Handel; mit freier Seefahrt und Schiff/Kaufmöglichkeit
      // stattdessen das Kontor-Panel (Schiffsabschnitt, „Handeln“ bleibt Knopf). Erneutes Anklicken lässt das passende Panel
      // offen; bei offenem Handel springt es ins Kontor-Panel, wenn homeKontorPanel 'inspect' liefert.
      const next = homeKontorPanel(world);
      const open =
        next === 'trade'
          ? panel.kind === 'trade' && panel.island === HOME
          : panel.kind === 'inspect' && panel.id === id;
      if (!open)
        setPanel(next === 'trade' ? { kind: 'trade', island: HOME } : { kind: 'inspect', id });
    } else if (panel.kind !== 'inspect' || panel.id !== id) {
      setPanel({ kind: 'inspect', id });
    }
  };

  // Geld-Fehler beim Strassen-Ziehen nur einmal pro Zug melden; jede Aktion ausserhalb eines Zugs setzt zurück
  let dragMoneyToastShown = false;
  let dragForestFailureShown = false;
  let dragMapSkipShown = false; // Meldung «Denkmal nur im Panel abreissen» einmal je Zug (U-15)
  let demolishConfirm: ConfirmState = { armedId: null }; // Zwei-Klick-Abriss des Denkmals (U-14)
  /** Abriss-Zug (I-041): Anbindung vor dem Zug, besuchte und entfernte Wegkacheln. */
  let stroke: { before: Set<number>; tiles: number; removed: number; island: number } | null = null;
  const forestCost = (tool: { kind: 'clearForest' | 'plantForest' }): Cost =>
    tool.kind === 'clearForest' ? CLEAR_FOREST_COST : PLANT_FOREST_COST;
  const showRoadFailure = (
    reason: string,
    dragging: boolean,
    island: number,
    at?: { x: number; y: number; w: number; h: number },
  ): void => {
    const text = friendlyReason(world, reason, { cost: ROAD_COST_OBJ, island, at });
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
    applyPauseOverlay(pauseEl, state.speed, isModalOpen());
  };
  const onHotkey = (h: HotkeyAction): void => {
    if (h.kind === 'tool') {
      // Derselbe Hotkey bei aktivem Werkzeug wechselt zurück zur Auswahl
      selectTool(sameTool(state.tool, h.tool) ? { kind: 'select' } : h.tool);
    } else if (h.kind === 'speed') {
      setSpeed(h.speed);
    } else if (h.kind === 'upgrade') {
      const t = upgradeTarget(state.panel, world);
      if (t.ok) upgradeSelected(t.id);
      else showError(t.reason);
    } else if (h.kind === 'council' && councilToggleAllowed(world)) {
      trialCard.setOpen(false);
      councilCard.setOpen(councilOpenNext(councilCard.isOpen, 'toggle'));
    } else if (h.kind === 'help') {
      openHelp();
    } else if (h.kind === 'islandHome') {
      jumpToIsland(HOME);
    } else if (h.kind === 'islandCycle') {
      jumpToIsland(nextIsland(state.activeIsland, world.islands.length));
    } else if (h.kind === 'problemNext') {
      if (stepKeyTarget(goodFocus) === 'focus') runFocusStep(focusDeps, 1);
      else jumpToProblem(1);
    } else if (h.kind === 'problemPrev') {
      if (stepKeyTarget(goodFocus) === 'focus') runFocusStep(focusDeps, -1);
      else jumpToProblem(-1);
    } else if (h.kind === 'demolishSelected') {
      const t = demolishTarget(state.panel, world);
      if (t.ok) demolishFromPanel(t.id);
      else showError(t.reason);
    } else if (h.kind === 'save') {
      saveManual();
    } else if (h.kind === 'pause') {
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
  /** Abriss aus dem Info-Panel: Knopf «Abreissen» und Taste Entf gehen hier durch. */
  const demolishFromPanel = (id: number): void => {
    const step = confirmStep(world, demolishConfirm, { kind: 'press', id });
    demolishConfirm = step.state;
    if (!step.demolish) {
      // Denkmal mit Fortschritt: erster Druck macht scharf (Knopf und Taste gleich)
      const btn = panelEl.querySelector<HTMLElement>('[data-field="demolish"]');
      if (btn) btn.textContent = step.buttonText ?? CONFIRM_TEXT;
      refresh();
      return;
    }
    const r = demolishBuilding(id);
    if (r.ok) {
      sound.play('demolish');
      setPanel({ kind: 'none' });
    }
    refresh();
  };
  const tradeCtx = (op: 'buy' | 'sell', good: GoodId, n: number, island: number): ReasonCtx =>
    tradeReasonCtx(world, op, good, n, island);

  /** Weg mit Winkel (Umschalt-Zug): Pfad und Plan der laufenden Vorschau; gebaut wird erst beim Loslassen. */
  let roadLine: { island: number; path: Pos[]; plan: LinePlan } | null = null;
  const clearRoadLine = (): void => {
    roadLine = null;
    connectPreview = null;
  };
  const onRoadLine = (a: Extract<InputAction, { type: 'roadLine' }>): void => {
    if (a.phase === 'update') {
      const path = linePath(a.from, a.to);
      const plan = linePlan(world, a.island, path);
      roadLine = { island: a.island, path, plan };
      // Fallback ohne Rotfärbung im Pfad-Overlay: nur neue Kacheln zeigen, Blockaden stehen in der Zeigerzeile
      connectPreview = plan.tiles.filter((t) => t.state === 'new');
      return;
    }
    const line = roadLine;
    clearRoadLine();
    if (a.phase === 'cancel' || line === null) return;
    const before = unconnectedIds(world);
    const r = buildLine(world, line.island, line.path);
    if (r.built > 0) {
      sound.playBuild('road');
      reportConnections(before);
    }
    if (r.stopReason !== null) showRoadFailure(r.stopReason, false, line.island);
    refresh();
  };

  const onAction = (a: InputAction): void => {
    if (a.type === 'roadLine') {
      onRoadLine(a);
      return;
    }
    if (a.type === 'ship') {
      // Klick auf ein Schiff: Panel des Heimatkontors mit hervorgehobener Schiffszeile
      const k = home(world).kontorId;
      if (k !== null) {
        setPanel({ kind: 'inspect', id: k });
        highlightShip(panelEl, a.id);
        refresh();
      }
      return;
    }
    if (a.type === 'hotkey') {
      onHotkey(a.action);
      return;
    }
    if (a.type === 'pipette') {
      const defId = buildingDefAt(world, a.island, a.x, a.y);
      if (defId !== null) pipette(defId);
      return;
    }
    if (a.type === 'cancel') {
      if (trialCard.isOpen) {
        trialCard.setOpen(false); // offene Auflagen-Karte zuerst
        return;
      }
      if (councilEscapeHandled(councilCard.isOpen)) {
        councilCard.setOpen(councilOpenNext(true, 'escape')); // offene Rats-Karte zuerst
        return;
      }
      clearRoadLine();
      clearGoodFocus();
      demolishConfirm = confirmStep(world, demolishConfirm, { kind: 'reset' }).state; // auch wenn nur ein Toast schliesst
      const demolishBtn = panelEl.querySelector<HTMLElement>('[data-field="demolish"]');
      if (demolishBtn) demolishBtn.textContent = DEMOLISH_LABEL; // Knopf zurück, falls das Panel offen bleibt
      if (closeClosableToast()) return;
      setPanel({ kind: 'none' });
      selectTool({ kind: 'select' });
      return;
    }
    if (a.type === 'dragEnd') {
      dragMoneyToastShown = false;
      dragForestFailureShown = false;
      dragMapSkipShown = false;
      if (stroke !== null) {
        const n = strokeEndNotice(newlyCut(stroke.before, world), stroke.removed, stroke.tiles);
        if (n?.kind === 'warn') showMessage(n.text, 'warn');
        else if (n?.kind === 'error') showRoadFailure(n.reason, false, stroke.island);
        stroke = null;
      }
      return;
    }
    if (!a.dragging) {
      dragMoneyToastShown = false;
      dragForestFailureShown = false;
      dragMapSkipShown = false;
    }
    const tool = state.tool;
    const tile = tileAt(world.islands[a.island]!, a.x, a.y);
    if (tool.kind === 'select') {
      selectBuilding(tile?.buildingId ?? null);
    } else if (tool.kind === 'build') {
      const before = unconnectedIds(world);
      const r = placeBuilding(world, tool.defId, a.x, a.y, a.island);
      if (!r.ok)
        showError(
          friendlyReason(world, r.reason, {
            defId: tool.defId,
            island: a.island,
            at: {
              x: a.x,
              y: a.y,
              w: BUILDING_DEFS[tool.defId].w,
              h: BUILDING_DEFS[tool.defId].h,
            },
          }),
        );
      else {
        sound.playBuild(buildSoundKey(tool) ?? 'build');
        reportConnections(before);
      }
    } else if (tool.kind === 'road') {
      const before = unconnectedIds(world);
      const r = placeRoad(world, a.x, a.y, a.island);
      if (!r.ok) showRoadFailure(r.reason, a.dragging, a.island, { x: a.x, y: a.y, w: 1, h: 1 });
      else {
        sound.playBuild(buildSoundKey(tool) ?? 'road');
        reportConnections(before);
      }
    } else if (tool.kind === 'clearForest' || tool.kind === 'plantForest') {
      const r =
        tool.kind === 'clearForest'
          ? clearForest(world, a.x, a.y, a.island)
          : plantForest(world, a.x, a.y, a.island);
      if (r.ok) sound.play('build');
      else if (!dragForestFailureShown) {
        // Ziehen: eine Meldung je Zug mit dem ersten Grund (Spec K5)
        dragForestFailureShown = true;
        showError(friendlyReason(world, r.reason, { cost: forestCost(tool), island: a.island }));
      }
    } else if (tool.kind === 'demolish' && a.dragging) {
      // Abriss-Zug: je Kachel nur ein Weg; Gebäude und Boden ohne Weg still überspringen (AK-R17-13)
      stroke ??= { before: cutOffIds(world), tiles: 0, removed: 0, island: a.island };
      stroke.tiles++;
      if (tile?.buildingId == null && tile?.road === true) {
        if (removeRoad(world, a.x, a.y, a.island).ok) {
          stroke.removed++;
          sound.play('demolish');
        }
      } else if (tile?.buildingId != null && !mapDemolishAllowed(world, tile.buildingId)) {
        if (!dragMapSkipShown) showMessage(MAP_SKIP_TEXT, 'warn');
        dragMapSkipShown = true;
      }
    } else if (tile?.buildingId != null) {
      if (!mapDemolishAllowed(world, tile.buildingId)) {
        if (!dragMapSkipShown) showMessage(MAP_SKIP_TEXT, 'warn');
        dragMapSkipShown = true; // Zug, der auf dem Denkmal beginnt: Meldung nur einmal
      } else if (demolishBuilding(tile.buildingId).ok) sound.play('demolish');
    } else {
      const r = removeRoad(world, a.x, a.y, a.island);
      if (!r.ok) showRoadFailure(r.reason, a.dragging, a.island);
      else sound.play('demolish');
    }
    refresh();
  };
  input = bindInput(canvas, state, onAction);

  // Cursor-Hinweis: Schild am Zeiger mit dem Grund; Zielkachel ausserhalb der Karte = kein Hover = kein Schild;
  // weicht der Mouse-over-Karte (R435)
  const hintEl = document.createElement('div');
  hintEl.className = 'cursor-hint';
  hintEl.hidden = true;
  document.body.appendChild(hintEl);
  let hintFor: string | null = null;
  let hintNow: Hint | null = null;
  const updateHint = (force: boolean, cardShown: boolean): void => {
    const pos = input?.pointerClient() ?? null;
    const hover = state.hover;
    if (!hover || !pos || isModalOpen()) {
      hintEl.hidden = true;
      hintFor = null;
      hintNow = null;
      return;
    }
    const lineNow = roadLine;
    if (lineNow !== null) {
      // Linien-Vorschau: Zählung, Kosten und erster Grund statt der Einzelkachel-Zeile
      hintFor = null;
      hintNow = lineHintText(lineNow.plan, (r) =>
        friendlyReason(world, r, { cost: ROAD_COST_OBJ, island: lineNow.island }),
      );
      hintEl.textContent = hintNow.text;
      hintEl.className = `cursor-hint cursor-hint--${hintNow.tone}`;
    } else if (force || hintKey(hover) !== hintFor) {
      hintFor = hintKey(hover);
      hintNow = placementHint(
        world,
        hover.tool ?? state.tool,
        hover.x,
        hover.y,
        hover.island ?? state.activeIsland,
      );
      if (hintNow) {
        hintEl.textContent = hintNow.text;
        hintEl.className = `cursor-hint cursor-hint--${hintNow.tone}`;
      }
    }
    // Erscheint die Mouse-over-Karte, weicht das Schild (R435)
    hintEl.hidden = !cursorHintVisible(hintNow !== null, cardShown);
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
    const shipId = shipAt(world, state.cam, sx, sy);
    const t = targetTile(world, state.cam, sel, sx, sy);
    const foreign =
      t || shipId !== null
        ? null
        : (foreignBuildingHover(world, state.cam, sx, sy) ??
          foreignHover(world, state.cam, sx, sy));
    if (!t && !foreign && shipId === null) {
      hoverTile = null;
      hideHoverCard();
      return;
    }
    const f = screenToTileF(state.cam, sx, sy);
    const gx = Math.floor(f.x),
      gy = Math.floor(f.y);
    const key =
      shipId !== null
        ? `s${shipId}`
        : foreign
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
      (shipId !== null ? shipHover(world, shipId) : null) ??
      foreign?.info ??
      (t
        ? hoverInfo(world, t, fx.timeMs, {
            ship: ship !== null && ship.x === gx && ship.y === gy,
            animal: animalAt(fx, sx, sy, gx, gy),
          })
        : null);
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
          run = { seed: world.seed, unlockMode: settings.unlockMode };
          honorBook.setRun(run);
          tracker.reset(world);
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
    const cv = clampView();
    clampToRect(state.cam, bounds, cv.w, cv.h);
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(gameEl);
  resize();
  // DPR-Wechsel (Monitorwechsel, Browser-Zoom) ändert die Grösse nicht; die Media-Query gilt nur für den
  // aktuellen Wert und wird deshalb nach jedem Wechsel neu angelegt.
  let dprQuery: MediaQueryList | null = null;
  const onDprChange = (): void => {
    dprQuery?.removeEventListener('change', onDprChange);
    resize();
    watchDpr();
  };
  const watchDpr = (): void => {
    dprQuery =
      typeof window.matchMedia === 'function'
        ? window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`)
        : null;
    dprQuery?.addEventListener('change', onDprChange);
  };
  watchDpr();
  if (kontor && !opts?.camera) {
    const c = center(BUILDING_DEFS[kontor.defId], kontor.x, kontor.y);
    centerOn(state.cam, c.cx, c.cy, clampView(), bounds);
  }

  let acc = 0;
  let autoMs = 0;
  let autoErrorShown = false;
  let prevSnap = soundSnapshot(world);
  let prevShortage = shortageSnapshot(world);
  let prevWork = workProgress(world);
  let prevEconTick = world.tick;
  let prevOrderVisible = orderVisible(world);
  // Vorwarnung (I-122): Priming beim Laden, damit ein Stand im Fenster keinen Klang auslöst
  let warnedPeriod: number | null = contractWarning(world) !== null ? warnPeriod(world) : null;
  let cancelFlash: () => void = () => {};
  // Nach dem Laden ist der geladene Stand die Vergleichsbasis: eine laufende Krise erzeugt keinen Eintrag
  let prevCrisis = crisisView(world);
  let prevMonument = monumentSnapshot(world);
  /** Start des Aufflammens (U-12): nur beim Übergang monumentDone false → true, nie nach dem Laden. */
  let monumentFlareStart: number | undefined;
  // Aufstiegs-Funkeln (I-118): Stand der Stufen, laufende Effekte, Spielzeit-Uhr (steht bei Pause). Laden und
  // «Neue Insel» rufen `launch()` neu auf: der leere Stand merkt nur, es startet kein Funkeln, kein Reset-Code nötig.
  let riseTiers = new Map<number, number>();
  let rises: Rise[] = [];
  let riseClockMs = 0;
  let last = performance.now();
  let lastAmbienceMs = -Infinity;
  let fireMemo: FireMemo = null;
  const previewFire = preview.fireIds?.map((id) => ({ id, flames: 1, smoke: 1 }));
  let frame = 0;
  if (import.meta.env.DEV) {
    exposeDevProbe({
      world: () => state.world,
      contractSounds: () => [...contractSoundLog],
      // Mitte der Raute (obere und untere Ecke) in CSS-Pixeln der Seite
      tileCenter: (x, y) => {
        const c = tileCorners(state.cam, x, y);
        const r = canvas.getBoundingClientRect();
        return { x: r.left + (c[0].x + c[2].x) / 2, y: r.top + (c[0].y + c[2].y) / 2 };
      },
      camera: () => ({
        x: state.cam.x,
        y: state.cam.y,
        zoom: state.cam.zoom,
        bounds: { ...bounds },
        view: clampView(),
      }),
      centerOn: (x, y) => centerOn(state.cam, x + 0.5, y + 0.5, clampView(), bounds),
      setZoom: (z) => {
        zoomAt(state.cam, z / state.cam.zoom, view.w / 2, view.h / 2, view, bounds);
        const cv = clampView();
        clampToRect(state.cam, bounds, cv.w, cv.h);
      },
      focus: (kind) => {
        if (kind === 'archipel')
          centerOn(
            state.cam,
            (bounds.x0 + bounds.x1) / 2,
            (bounds.y0 + bounds.y1) / 2,
            clampView(),
            bounds,
          );
        else if (kontor) {
          const c = center(BUILDING_DEFS[kontor.defId], kontor.x, kontor.y);
          centerOn(state.cam, c.cx, c.cy, clampView(), bounds);
        }
      },
      cachesReady: () => layers.ready(),
      slices: () => [...(cachePlan?.sliceMs ?? [])],
      emergency: () => [...(cachePlan?.emergencyMs ?? [])],
    });
  }
  let disposed = false;
  let rafId = 0;
  const titheLoss = newTitheLossState();
  const loop = (now: number): void => {
    if (disposed) return;
    try {
      const dt = Math.min(now - last, 1000);
      last = now;
      const reports: StepReport[] = [];
      const honorHits: HonorHit[] = [];
      if (state.speed > 0) {
        acc += dt * state.speed;
        let ticks = 0;
        while (acc >= TICK_MS && ticks < MAX_TICKS_PER_FRAME) {
          const rep = step(world);
          reports.push(rep);
          for (const text of collectTitheLoss(titheLoss, rep, world.tick))
            showMessage(text, 'warn');
          for (const id of tracker.observe(world, run))
            honorHits.push({ id, seed: world.seed, tick: world.tick, crisis: world.crisisLevel });
          acc -= TICK_MS;
          ticks += 1;
        }
        if (honorHits.length > 0) {
          const added = honorBook.record(honorHits, new Date().toISOString());
          if (added.length > 0) {
            const saved = honorBook.status() === 'ok' || honorBook.status() === 'damaged';
            showMessage(honorMessage(added, saved), 'info');
          }
        }
        for (const text of lossMessages(reports)) showMessage(text, 'warn');
        announceContract(
          reports,
          {
            show: (t, k) => showMessage(t, k),
            play: (e) => {
              recordContractSound(e);
              sound.play(e);
            },
          },
          world,
        );
        if (ticks > 0) {
          const w = warnStep(warnedPeriod, world);
          warnedPeriod = w.warnedPeriod;
          if (w.fire) {
            recordContractSound('contractWarn');
            sound.play('contractWarn');
            const card = document.querySelector<HTMLElement>('.order-card');
            cancelFlash();
            if (card) cancelFlash = flashOrderCard(card);
          }
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
        state.logUnread = nextUnread(state.logUnread, logged, isEventLogExpanded(logBox));
        for (const e of logged) if (e.toast !== null) showMessage(e.text, e.toast);
      }
      const curMonument = monumentSnapshot(world);
      const monumentLogged = monumentEvents(prevMonument, curMonument, world.tick);
      if (!prevMonument.monumentDone && curMonument.monumentDone)
        monumentFlareStart = performance.now();
      prevMonument = curMonument;
      if (monumentLogged.length > 0) {
        state.eventLog = pushLog(state.eventLog, monumentLogged);
        state.logUnread = nextUnread(state.logUnread, monumentLogged, isEventLogExpanded(logBox));
        for (const e of monumentLogged) {
          if (e.tag === 'monument-done') showMessage(e.text, 'info', true, true);
          else if (e.toast !== null) showMessage(e.text, e.toast);
        }
      }
      const farLogged = farLogEntries(farPrev, world);
      farPrev = farSnap(world);
      if (farLogged.length > 0) {
        state.eventLog = pushLog(state.eventLog, farLogged);
        state.logUnread = nextUnread(state.logUnread, farLogged, isEventLogExpanded(logBox));
        for (const e of farLogged) if (e.toast !== null) showMessage(e.text, e.toast);
      }
      // Verfall und Vertrag: Meldung kommt schon aus orderMessage bzw. announceContract, hier kein showMessage
      const autoLogged = [
        ...expiryLogEntries(autoPrev, world),
        ...contractLogEntries(reports, world, world.tick),
      ];
      autoPrev = autoSnap(world);
      if (autoLogged.length > 0) {
        state.eventLog = pushLog(state.eventLog, autoLogged);
        state.logUnread = nextUnread(state.logUnread, autoLogged, isEventLogExpanded(logBox));
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
      riseClockMs = advanceRiseClock(riseClockMs, dt, state.speed);
      const rd = detectRises(riseTiers, homeBuildings(world), riseClockMs);
      riseTiers = rd.next;
      rises = pickRises([...rises, ...rd.started], riseClockMs, cap('riseGlow'));
      const t0 = performance.now();
      const fx: RenderFx = {
        timeMs: t0,
        tickFrac: state.speed > 0 ? Math.min(1, acc / TICK_MS) : 0,
        dayNight: settings.dayNight,
        weather,
        reduceMotion: reduce,
        fire: previewFire ?? inputs.render.fire,
        boom: preview.boom ?? inputs.render.boom,
        raster: preview.raster === true,
        focus: goodFocus,
        rises,
        riseClockMs,
        ...(monumentFlareStart === undefined ? {} : { monumentFlareStart }),
      };
      render(ctx, world, state.cam, layers, state.hover, state.selectedId, view, fx);
      if (connectPreview) drawPathPreview(ctx, state.cam, connectPreview);
      perf?.renderDone(performance.now() - t0);
      layers.frameDone();
      updateMoney(hudEl, world);
      updateHoverCard(fx, t0);
      updateHint(frame % HUD_EVERY_FRAMES === 0, !hoverEl.hidden);
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
    cancelFlash();
    cancelAnimationFrame(rafId);
    layers.dispose();
    councilCard.dispose();
    trialCard.dispose();
    resizeObserver.disconnect();
    dprQuery?.removeEventListener('change', onDprChange);
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
    unbindIslandMenu(hudEl);
    hudEl.replaceChildren();
    navEl.replaceChildren();
    panelEl.replaceChildren();
  };
  const game: RunningGame = Object.assign(state, { dispose });
  current = game;
  return game;
}
