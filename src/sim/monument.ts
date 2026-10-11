import { MONUMENT_GOODS, MONUMENT_STAGES } from './defs/monument';
import type { Monument, MonumentGood, Result, World } from './types';
import { fail, ok } from './types';

const NO_GOODS = (): Record<MonumentGood, number> => ({ stone: 0, tools: 0, glass: 0, spice: 0 });

export function newMonument(buildingId: number): Monument {
  return {
    buildingId,
    stage: 0,
    running: false,
    delivered: NO_GOODS(),
    paused: false,
    buy: { stone: false, tools: false, glass: false, spice: false },
  };
}

export function isMonumentGood(g: unknown): g is MonumentGood {
  return typeof g === 'string' && (MONUMENT_GOODS as readonly string[]).includes(g);
}

/** Reine Prüfung des Abschnittsstarts (R4.1 (1)–(4)); `null` = Start möglich. */
export function monumentStartReason(w: World): string | null {
  const m = w.monument;
  if (m === null) return 'Kein Denkmal';
  if (m.stage >= MONUMENT_STAGES.length) return 'Denkmal fertig';
  if (m.running) return 'Abschnitt läuft';
  if (w.money < MONUMENT_STAGES[m.stage]!.money) return 'Zu wenig Geld';
  return null;
}

export function startMonumentStage(w: World): Result {
  const reason = monumentStartReason(w);
  if (reason !== null) return fail(reason);
  const m = w.monument!;
  w.money -= MONUMENT_STAGES[m.stage]!.money;
  m.running = true;
  m.delivered = NO_GOODS();
  return ok;
}

export function setMonumentPaused(w: World, paused: unknown): Result {
  if (w.monument === null) return fail('Kein Denkmal');
  if (typeof paused !== 'boolean') return fail('Ungültiger Wert');
  w.monument.paused = paused;
  return ok;
}

export function setMonumentBuy(w: World, good: unknown, on: unknown): Result {
  if (w.monument === null) return fail('Kein Denkmal');
  if (!isMonumentGood(good)) return fail('Ungültiges Gut');
  if (typeof on !== 'boolean') return fail('Ungültiger Wert');
  w.monument.buy[good] = on;
  return ok;
}
