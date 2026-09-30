import { UPKEEP_INTERVAL } from '../sim/defs/timing';
import type { Result, World } from '../sim/types';
import type { SoundEvent } from '../audio/sound';

/** Die Grössen, die je Frame verglichen werden (Spec 9.4). */
export interface SoundSnapshot {
  bucket: number;
  orderPeriod: number | null;
  /** Summe von (Stufe − 1) über alle Häuser: ein neues Haus zählt nicht als Aufstieg. */
  upgrades: number;
  won: boolean;
}

export function soundSnapshot(world: World): SoundSnapshot {
  let upgrades = 0;
  for (const b of Object.values(world.buildings)) {
    if (b.house) upgrades += b.house.tier - 1;
  }
  return {
    bucket: Math.floor(world.tick / UPKEEP_INTERVAL),
    orderPeriod: world.order?.period ?? null,
    upgrades,
    won: world.won,
  };
}

/** Zeitbasierte Töne aus dem Vergleich zweier Frames: coin, order, upgrade, win. */
export function diffSoundEvents(prev: SoundSnapshot, cur: SoundSnapshot): SoundEvent[] {
  const out: SoundEvent[] = [];
  if (cur.bucket > prev.bucket) out.push('coin');
  if (cur.orderPeriod !== null && cur.orderPeriod !== prev.orderPeriod) out.push('order');
  if (cur.upgrades > prev.upgrades) out.push('upgrade');
  if (cur.won && !prev.won) out.push('win');
  return out;
}

/**
 * Ereignisse, die den Ton freischalten. `pointerup` statt `pointerdown`: ein Touch-`pointerdown`
 * zählt in Chrome nicht als Nutzeraktivierung, `pointerup` gilt für Maus und Touch.
 */
export const UNLOCK_EVENTS = ['pointerup', 'keydown'] as const;

/** Ton direkt nach einer Sim-Aktion: bei Erfolg der Ton der Aktion (oder keiner), bei Fehlschlag immer `error`. */
export function actionSound(r: Result, onOk: SoundEvent | null): SoundEvent | null {
  return r.ok ? onOk : 'error';
}
