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
  const slot = (): void => {
    if (disposed) return;
    const ms = plan.idle();
    if (ms > 0 && !ready()) schedule(slot);
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
