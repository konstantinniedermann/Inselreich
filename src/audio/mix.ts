// Reine Mix-Regeln des Klangs (Spec 7.1, 11.2). Kein DOM, kein Web Audio, kein Import aus sim/render/ui.
// Pegel und Zeiten sind Darstellungswerte (Konstanten), keine Spielwerte.

export type Bus = 'master' | 'music' | 'ambience' | 'effects';

export const BUS_DEFAULTS: Readonly<Record<Bus, number>> = {
  master: 0.4,
  music: 0.5,
  ambience: 0.7,
  effects: 1,
};

/** Ducking von Musik- und Umgebungs-Bus bei Signalen (Spec 7.1). */
export const DUCK = { factor: 0.5, attackS: 0.05, holdS: 0.3, releaseS: 0.6 } as const;

export interface DuckSignal {
  /** Startzeit des Signals (ctx.currentTime in s). */
  t0: number;
  /** Dauer der Figur in s. */
  durS: number;
}

/** Strukturgleich zu den Typen der Render-Schicht; hier bewusst eigene Definition (kein Import). */
export type Phase = 'day' | 'evening' | 'night' | 'morning';

export interface ViewStats {
  water: number;
  green: number;
  forest: number;
  rock: number;
  coast: number;
  inhabitants: number;
  zoom: number;
}

export interface WeatherIn {
  kind: 'clear' | 'cloudy' | 'rain' | 'storm';
  w: number;
}

export interface AmbienceInput {
  view: ViewStats;
  phase: Phase;
  weather: WeatherIn;
  reduced?: boolean;
  fire?: number;
}

export type Layer =
  'sea' | 'wind' | 'birds' | 'gulls' | 'night' | 'town' | 'rain' | 'storm' | 'fire';

/** Ende des Haltens eines Signals (Figurende + Halten). */
export function holdEnd(s: DuckSignal): number {
  return s.t0 + s.durS + DUCK.holdS;
}

/** Ende der Freigabe eines Signals; danach wirkt es nicht mehr. */
export function duckEnd(s: DuckSignal): number {
  return holdEnd(s) + DUCK.releaseS;
}

/**
 * Faktor 0,5…1 für Musik- und Umgebungs-Bus zum Zeitpunkt `nowS`.
 * Überlappende Signale verlängern das Halten, vertiefen aber nicht (Minimum über alle Signale).
 */
export function duckGain(nowS: number, signals: readonly DuckSignal[]): number {
  let g = 1;
  for (const { t0, durS } of signals) {
    const hEnd = t0 + durS + DUCK.holdS;
    let f = 1;
    if (nowS < t0) f = 1;
    else if (nowS < t0 + DUCK.attackS) f = 1 - (1 - DUCK.factor) * ((nowS - t0) / DUCK.attackS);
    else if (nowS <= hEnd) f = DUCK.factor;
    else if (nowS < hEnd + DUCK.releaseS)
      f = DUCK.factor + (1 - DUCK.factor) * ((nowS - hEnd) / DUCK.releaseS);
    g = Math.min(g, f);
  }
  return g;
}
