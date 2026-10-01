import type { RenderFx } from '../render/renderer';
import type { Weather } from '../render/daynight';
import { pickWeather } from '../render/weather';
import { STORM_WARNING } from '../sim/defs/timing';
import type { CrisisView } from '../sim/queries';

/**
 * Abbildung der Krisensicht auf Effekte und Umgebung (M6 12.3, 12.4). Rein und DOM-frei.
 * Die Konstante ist ein Darstellungswert, kein Spielwert.
 */
export const FIRE_SMOKE_TAIL = 80;

/** Letzte Brand-Id und Tick des Ausfallendes; die UI hält sie, die Welt kennt den Brand danach nicht mehr. */
export type FireMemo = { id: number; end: number } | null;

export interface CrisisFx {
  fire?: { id: number; flames: number; smoke: number }[];
  boom?: boolean;
  /** Nur Krisenwetter; den Vorrang regelt `pickWeather`. */
  weather?: { kind: 'cloudy' | 'storm'; w: number };
  /** 0…1 für `setAmbience({ fire })`. */
  ambienceFire: number;
}

const burning = (v: CrisisView): boolean =>
  v.phase !== 'none' &&
  v.kind === 'fire' &&
  v.outcome === 'burning' &&
  v.targetExists &&
  v.target !== undefined;

export function crisisFx(view: CrisisView, tick: number, memo: FireMemo): CrisisFx {
  const out: CrisisFx = { ambienceFire: 0 };
  if (view.phase !== 'none' && burning(view)) {
    out.fire = [{ id: view.target!, flames: 1, smoke: 1 }];
  } else if (memo && tick - memo.end >= 0 && tick - memo.end < FIRE_SMOKE_TAIL) {
    out.fire = [{ id: memo.id, flames: 0, smoke: 1 - (tick - memo.end) / FIRE_SMOKE_TAIL }];
  }
  if (view.phase !== 'none' && view.kind === 'boom') out.boom = true;
  if (view.phase !== 'none' && view.kind === 'storm') {
    out.weather =
      view.phase === 'warning'
        ? { kind: 'cloudy', w: 1 - view.remaining / (STORM_WARNING + 1) }
        : { kind: 'storm', w: 1 };
  }
  out.ambienceFire = Math.max(0, ...(out.fire ?? []).map((f) => f.flames));
  return out;
}

/** Fortschreibung der Merkstruktur je Frame; `prev.until` ist auch bei mehreren Schritten je Frame das Ausfallende. */
export function nextFireMemo(
  memo: FireMemo,
  prev: CrisisView,
  cur: CrisisView,
  tick: number,
  exists: (id: number) => boolean,
): FireMemo {
  if (prev.phase !== 'none' && burning(prev) && !burning(cur)) {
    return exists(prev.target!) ? { id: prev.target!, end: prev.until } : null;
  }
  if (memo && (tick - memo.end >= FIRE_SMOKE_TAIL || !exists(memo.id))) return null;
  return memo;
}

/** Ein Wetter für Render und Umgebung: Krise vor Stimmung (`pickWeather`). */
export function frameInputs(
  fx: CrisisFx,
  mood: Weather | null,
): { render: Partial<RenderFx>; ambience: { weather: Weather; fire: number } } {
  const weather = pickWeather(fx.weather, mood);
  return {
    render: { fire: fx.fire, boom: fx.boom, weather },
    ambience: { weather, fire: fx.ambienceFire },
  };
}
