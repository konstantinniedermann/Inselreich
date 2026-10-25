// Ehrenbuch-Tracker (I-186): hält den Schnappschuss der Marken zwischen zwei Schritten.
// Kein DOM, kein localStorage, keine Uhr; schreibt nie in die Welt.
import type { HonorId } from '../sim/defs/honors';
import { honorMarks, newHonors, type HonorMarks, type HonorRun } from '../sim/honors';
import type { World } from '../sim/types';

export interface HonorTracker {
  /** Neuer Ausgangsstand (z. B. nach «Neue Insel» oder Laden). */
  reset(world: World): void;
  /**
   * Neu erreichte Stücke seit dem letzten Aufruf; danach gilt der aktuelle Stand als bekannt.
   * Tick-Bezug (N7): Der Aufrufer liest `world.tick` direkt nach `observe`; das ist der Tick
   * nach dem `step`, in dem der Wechsel geschah. Darum je Schritt aufrufen, nicht je Frame.
   */
  observe(world: World, run: HonorRun | null): HonorId[];
}

export function createHonorTracker(world: World): HonorTracker {
  let snapshot: HonorMarks = honorMarks(world);
  return {
    reset(w) {
      snapshot = honorMarks(w);
    },
    observe(w, run) {
      const found = newHonors(snapshot, w, run);
      snapshot = honorMarks(w);
      return found;
    },
  };
}
