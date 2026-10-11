import {
  MONUMENT_GOODS,
  MONUMENT_RESERVE_MIN,
  MONUMENT_RESERVE_TICKS,
  MONUMENT_STAGES,
} from './defs/monument';
import { TIERS } from './defs/tiers';
import { isSupplied } from './population';
import type { Monument, MonumentGood, Result, World } from './types';
import { fail, ok } from './types';
import { HOME } from './world';

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

/** Sperrbestand je Gut (R6.1). In E2 immer 0; den Rumpf ersetzt I-049 (Fall K1). Signatur nicht ändern. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Signatur fest für I-049
export function monumentLock(_w: World, _g: MonumentGood): number {
  return 0;
}

/** Hausverbrauch der Heimat in Tausendstel je Einwohner und 100 Ticks, ganzzahlig (Spec R6.2, A3). */
function houseUseMilli(w: World, g: MonumentGood): number {
  let sum = 0;
  for (const b of Object.values(w.buildings)) {
    if (b.island !== HOME || b.house === undefined || !isSupplied(w, b)) continue;
    sum += b.house.inhabitants * Math.round((TIERS[b.house.tier].needs[g] ?? 0) * 1000);
  }
  return sum;
}

/** R6.1/R6.2: max(MIN, ⌈TICKS × U_g / 100⌉, lock), ganzzahlig, ohne Gleitkomma-Vergleich. */
export function monumentReserve(w: World, g: MonumentGood): number {
  const a = MONUMENT_RESERVE_TICKS * houseUseMilli(w, g);
  const b = 100 * 1000;
  return Math.max(MONUMENT_RESERVE_MIN, Math.floor((a + b - 1) / b), monumentLock(w, g));
}

/** Σ geliefert / Σ Soll des laufenden Abschnitts als ganze Prozent (abgerundet); ohne laufenden Abschnitt 0. */
export function monumentProgress(w: World): number {
  const m = w.monument;
  if (m === null || !m.running || m.stage >= MONUMENT_STAGES.length) return 0;
  const goal = MONUMENT_STAGES[m.stage]!.goods;
  let got = 0;
  let total = 0;
  for (const g of MONUMENT_GOODS) {
    got += m.delivered[g];
    total += goal[g];
  }
  return total === 0 ? 0 : Math.floor((100 * got) / total);
}
