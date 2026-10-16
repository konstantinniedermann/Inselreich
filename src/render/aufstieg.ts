// aufstieg.ts — Erkennung und Deckel der Aufstiegs-Funkeln (I-118). Reine Funktionen: kein DOM, kein Zufall,
// die Gebäudeliste wird nur gelesen.
import type { Building } from '../sim/types';

/** Ein laufender Aufstiegs-Effekt: Haus-Id, Startzeit auf der Funkel-Uhr, erreichte Stufe. */
export interface Rise {
  id: number;
  startMs: number;
  tier: number;
}

/** Dauer des Effekts in ms (Darstellungswert). */
export const RISE_MS = 1500;
/** Höchstschritt der Funkel-Uhr je Frame in ms (Tab-Wechsel springt nicht). Darstellungswert. */
const MAX_DT_MS = 100;

/**
 * Vergleicht den gemerkten Stand (Haus-Id -> Stufe) mit den aktuellen Häusern. Ein Aufstieg ist eine strikt
 * höhere Stufe bei bekannter Id. Eine leere `prev` (erster Frame, nach Laden) merkt nur den Stand.
 * `next` enthält genau die aktuellen Haus-Ids.
 */
export function detectRises(
  prev: ReadonlyMap<number, number>,
  buildings: readonly Building[],
  nowMs: number,
): { next: Map<number, number>; started: Rise[] } {
  const next = new Map<number, number>();
  const started: Rise[] = [];
  for (const b of buildings) {
    if (!b.house) continue;
    const tier = b.house.tier;
    next.set(b.id, tier);
    const before = prev.get(b.id);
    if (prev.size > 0 && before !== undefined && tier > before) {
      started.push({ id: b.id, startMs: nowMs, tier });
    }
  }
  return { next, started };
}

/** Verwirft Abgelaufene und behält die `cap` jüngsten; Verworfene rücken nie nach. */
export function pickRises(active: readonly Rise[], nowMs: number, cap: number): Rise[] {
  const live = active.filter((r) => nowMs - r.startMs >= 0 && nowMs - r.startMs < RISE_MS);
  if (live.length <= cap) return live;
  return [...live].sort((a, b) => b.startMs - a.startMs).slice(0, Math.max(0, cap));
}

/** Schritt der Funkel-Uhr: bei Pause (`speed` 0) steht sie, `dt` ist auf 0…100 ms geklemmt. */
export function advanceRiseClock(clockMs: number, dtMs: number, speed: number): number {
  if (!(speed > 0)) return clockMs;
  const dt = Number.isFinite(dtMs) ? Math.min(MAX_DT_MS, Math.max(0, dtMs)) : 0;
  return clockMs + dt;
}
