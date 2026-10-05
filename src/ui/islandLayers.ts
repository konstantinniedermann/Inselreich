// islandLayers.ts — Ebenen der Fremdinseln mit Leerlauf-Rasterung (Spec M12 Anhang 02 D). Rein, ohne DOM:
// Plan, Ebenen und Zeitplaner werden eingespeist. Die Heimatebene liegt sofort vor; Fremdinseln entstehen erst nach
// dem ersten gezeichneten Frame, ein Slot je Leerlauf; fehlt eine Ebene im Bild, rastert `finish` sie sofort (Notfall).
import type { CachePlan } from '../render/cachePlan';

export interface IslandLayerSet<C> {
  get(i: number): C | null;
  /** Nach jedem gezeichneten Frame aufrufen: startet beim ersten Aufruf die Leerlauf-Planung. */
  frameDone(): void;
  dispose(): void;
  /** Anzahl Frames, in denen eine Ebene sofort gerastert werden musste. */
  readonly emergencyFrames: number;
  /** War der zuletzt abgeschlossene Frame ein Notfall-Frame? */
  readonly lastFrameEmergency: boolean;
  /** Alle Fremdinseln fertig? */
  ready(): boolean;
}

const MAX_IDLE_ZERO = 200;

export function createIslandLayers<C>(opts: {
  home: C;
  plan: Pick<CachePlan, 'idle' | 'finish' | 'done'>;
  layerOf: (i: number) => C;
  islands: number;
  schedule: (cb: () => void) => void;
}): IslandLayerSet<C> {
  const { home, plan, layerOf, islands, schedule } = opts;
  let started = false;
  let disposed = false;
  let emergencyFrames = 0;
  let flagged = false;
  let lastFrameEmergency = false;
  const ready = (): boolean => {
    for (let i = 1; i < islands; i++) if (!plan.done(i)) return false;
    return true;
  };
  const doneCount = (): number => {
    let n = 0;
    for (let i = 1; i < islands; i++) if (plan.done(i)) n++;
    return n;
  };
  // Neuplanung hängt an `ready()`, nicht an der Dauer: eine schnelle Scheibe kann bei grober Uhr 0 ms messen.
  // Abbruch gegen Endlosschleifen: `idle()` meldet 0 ms und es wird keine Insel fertig, MAX_IDLE_ZERO Slots lang
  // (Plan ohne Arbeit); jede Dauer > 0 oder jede neu fertige Insel setzt den Zähler zurück. Danach greift der Notfall.
  let zeroRun = 0;
  let doneSeen = doneCount();
  const slot = (): void => {
    if (disposed) return;
    const ms = plan.idle();
    const d = doneCount();
    zeroRun = ms > 0 || d > doneSeen ? 0 : zeroRun + 1;
    doneSeen = d;
    if (d < islands - 1 && zeroRun < MAX_IDLE_ZERO) schedule(slot);
  };
  return {
    get(i) {
      if (i === 0) return home;
      if (i < 0 || i >= islands) return null;
      if (!plan.done(i)) {
        plan.finish(i);
        if (!flagged) {
          flagged = true;
          emergencyFrames++;
        }
      }
      return layerOf(i);
    },
    frameDone() {
      lastFrameEmergency = flagged;
      flagged = false;
      if (started || disposed) return;
      started = true;
      if (!ready()) schedule(slot);
    },
    dispose() {
      disposed = true;
    },
    get emergencyFrames() {
      return emergencyFrames;
    },
    get lastFrameEmergency() {
      return lastFrameEmergency;
    },
    ready,
  };
}

/** Obergrenze (ms), nach der ein Leerlauf-Slot trotz voller Hauptlast läuft (Darstellungswert). Ohne sie käme bei
 * Dauerlast (z. B. 1920 × 1080, DPR 2) nie ein Leerlauf und der Plan nie voran; jede Scheibe bleibt ≤ SLICE_MS. */
export const IDLE_TIMEOUT_MS = 100;

/** Zeitplaner für `createIslandLayers`: `requestIdleCallback` mit Timeout, sonst `setTimeout(0)`. */
export function idleSchedule(win: {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => unknown;
  setTimeout: (cb: () => void, ms: number) => unknown;
}): (cb: () => void) => void {
  return (cb) => {
    if (typeof win.requestIdleCallback === 'function')
      win.requestIdleCallback(() => cb(), { timeout: IDLE_TIMEOUT_MS });
    else win.setTimeout(cb, 0);
  };
}
