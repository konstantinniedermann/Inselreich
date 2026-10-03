import { UPKEEP_INTERVAL } from '../sim/defs/timing';
import { orderVisible } from './order';
import type { CrisisKind, Result, World } from '../sim/types';
import type { SoundEvent } from '../audio/sound';

/** Die Grössen, die je Frame verglichen werden (Spec 9.4). */
export interface SoundSnapshot {
  bucket: number;
  /** `null`, solange die Auftragskarte verborgen ist (vor U3): kein Ton `order` beim Wechsel zu U3. */
  orderPeriod: number | null;
  /** Auftragskarte sichtbar (ab U3); der erste Auftrag nach dem Freischalten ist kein Ton wert. */
  orderShown: boolean;
  /** Zahl der freien Einträge (`world.unlocked.length`). */
  unlocked: number;
  /** Summe von (Stufe − 1) über alle Häuser: ein neues Haus zählt nicht als Aufstieg. */
  upgrades: number;
  won: boolean;
  /** Zweites Ziel (Spec M8 14.1): derselbe Ton `win`, höchstens einer je Frame. */
  wonMerchants: boolean;
  /** Laufende Krise (M6 13.5); `burning` nur bei einem Brand mit Ausfall. */
  crisis: { period: number; kind: CrisisKind; burning: boolean } | null;
}

export function soundSnapshot(world: World): SoundSnapshot {
  let upgrades = 0;
  for (const b of Object.values(world.buildings)) {
    if (b.house) upgrades += b.house.tier - 1;
  }
  return {
    bucket: Math.floor(world.tick / UPKEEP_INTERVAL),
    orderPeriod: orderVisible(world) ? (world.order?.period ?? null) : null,
    orderShown: orderVisible(world),
    unlocked: world.unlocked.length,
    upgrades,
    won: world.won,
    wonMerchants: world.wonMerchants,
    crisis: world.crisis
      ? {
          period: world.crisis.period,
          kind: world.crisis.kind,
          burning: world.crisis.outcome === 'burning',
        }
      : null,
  };
}

/**
 * Signaltöne für eine neue Krisenperiode (M6 13.5): Brand nur bei `burning` (gelöscht und leer ohne Ton),
 * Sturm `stormWarning`, Boom `boom`. Derselbe Brand meldet sich nicht erneut, auch wenn `burning` erst
 * im Folgeframe sichtbar wird.
 */
function crisisSignals(prev: SoundSnapshot['crisis'], cur: SoundSnapshot['crisis']): SoundEvent[] {
  if (!cur) return [];
  const same = prev !== null && prev.period === cur.period;
  switch (cur.kind) {
    case 'fire':
      return cur.burning && !(prev !== null && same && prev.burning) ? ['alarm'] : [];
    case 'storm':
      return same ? [] : ['stormWarning'];
    case 'boom':
      return same ? [] : ['boom'];
  }
}

/** Zeitbasierte Töne aus dem Vergleich zweier Frames: coin, order, upgrade, win, unlock. */
export function diffSoundEvents(prev: SoundSnapshot, cur: SoundSnapshot): SoundEvent[] {
  const out: SoundEvent[] = [];
  if (cur.bucket > prev.bucket) out.push('coin');
  if (prev.orderShown && cur.orderPeriod !== null && cur.orderPeriod !== prev.orderPeriod)
    out.push('order');
  if (cur.upgrades > prev.upgrades) out.push('upgrade');
  const won = (cur.won && !prev.won) || (cur.wonMerchants && !prev.wonMerchants);
  if (won) out.push('win');
  else if (cur.unlocked > prev.unlocked) out.push('unlock');
  out.push(...crisisSignals(prev.crisis, cur.crisis));
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

/**
 * Bauklang-Schlüssel nach erfolgreichem Platzieren: Gebäude-Id bzw. 'road'; sonst keiner.
 * Die Zuordnung zur Klanggruppe liegt in `src/audio/buildSounds.ts`.
 */
export function buildSoundKey(
  tool: { kind: 'build'; defId: string } | { kind: 'road' } | { kind: string },
): string | null {
  if (tool.kind === 'road') return 'road';
  if (tool.kind === 'build' && 'defId' in tool && typeof tool.defId === 'string') return tool.defId;
  return null;
}
