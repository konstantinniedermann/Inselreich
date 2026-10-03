/**
 * Bau-Klanggruppen (H-A1): Daten, keine Logik. Die Gebäudeart ist hier ein String; `src/audio/` kennt
 * `src/sim/` nicht. Pegel sind relativ (vor dem Effekte-Faktor) und liegen höchstens auf dem Pegel
 * des bisherigen Bau-Klangs (`BUILD_PEAK_MAX`).
 */

export type BuildStep =
  | {
      k: 'tone';
      at: number;
      dur: number;
      peak: number;
      freq: number;
      type?: OscillatorType;
      freqEnd?: number;
    }
  | {
      k: 'burst';
      at: number;
      dur: number;
      peak: number;
      from: number;
      to: number;
      filter?: BiquadFilterType;
    };

export interface BuildSoundGroup {
  /** Mindestabstand zwischen zwei Klängen der Gruppe in ms (Wegziehen darf nicht rattern). */
  throttleMs: number;
  steps: readonly BuildStep[];
}

/** Höchster relativer Pegel (bisheriger `build`-Klang: 0,12). */
export const BUILD_PEAK_MAX = 0.12;

/** Holz: zwei gedämpfte Schläge, Tiefpass-Rauschen plus Sinus 150-300 Hz. */
const WOOD: BuildSoundGroup = {
  throttleMs: 80,
  steps: [
    { k: 'burst', at: 0, dur: 0.04, peak: 0.1, from: 900, to: 400 },
    { k: 'tone', at: 0, dur: 0.07, peak: 0.1, freq: 300, freqEnd: 180 },
    { k: 'burst', at: 0.08, dur: 0.04, peak: 0.08, from: 800, to: 350 },
    { k: 'tone', at: 0.08, dur: 0.07, peak: 0.08, freq: 250, freqEnd: 150 },
  ],
};

/** Stein: heller Rauschimpuls plus Ton 600-900 Hz. */
const STONE: BuildSoundGroup = {
  throttleMs: 80,
  steps: [
    { k: 'burst', at: 0, dur: 0.012, peak: 0.12, from: 3000, to: 3000, filter: 'highpass' },
    { k: 'tone', at: 0, dur: 0.06, peak: 0.07, freq: 900, freqEnd: 600 },
  ],
};

/** Wasser: Plankenklopfen und kurzes Plätschern (gefiltertes Rauschen). */
const WATER: BuildSoundGroup = {
  throttleMs: 80,
  steps: [
    { k: 'burst', at: 0, dur: 0.04, peak: 0.09, from: 900, to: 400 },
    { k: 'tone', at: 0, dur: 0.06, peak: 0.08, freq: 260, freqEnd: 170 },
    { k: 'burst', at: 0.06, dur: 0.16, peak: 0.07, from: 700, to: 1800, filter: 'bandpass' },
  ],
};

/** Glocke: kleine, leise Glocke, Partialtöne 1 : 2,76 : 5,4. */
const BELL: BuildSoundGroup = {
  throttleMs: 120,
  steps: [1, 2.76, 5.4].map((m, j): BuildStep => ({
    k: 'tone',
    at: 0,
    dur: 0.3,
    peak: 0.08 / (j + 1),
    freq: 880 * m,
  })),
};

/** Kies: sehr kurzes Knirschen aus drei winzigen Rauschimpulsen. */
const GRAVEL: BuildSoundGroup = {
  throttleMs: 100,
  steps: [0, 0.018, 0.037].map((at, i): BuildStep => ({
    k: 'burst',
    at,
    dur: 0.012,
    peak: 0.06 - i * 0.008,
    from: 2200 + i * 600,
    to: 1500,
    filter: 'highpass',
  })),
};

export const BUILD_GROUPS = { wood: WOOD, stone: STONE, water: WATER, bell: BELL, gravel: GRAVEL };
export type BuildGroupName = keyof typeof BUILD_GROUPS;

/** Zuordnung Gebäude-Id (und 'road') -> Gruppe. */
export const BUILD_SOUND_OF: Readonly<Record<string, BuildGroupName>> = {
  lumberjack: 'wood',
  sheepfarm: 'wood',
  canefarm: 'wood',
  house: 'wood',
  market: 'wood',
  school: 'wood',
  townhall: 'stone',
  weaver: 'wood',
  toolmaker: 'wood',
  quarry: 'stone',
  kontor: 'stone',
  firestation: 'stone',
  glassworks: 'stone',
  distillery: 'stone',
  fisher: 'water',
  bathhouse: 'water',
  chapel: 'bell',
  road: 'gravel',
};

/** Rückfall für unbekannte Arten (auch das bisherige `play('build')`). */
export const BUILD_FALLBACK: BuildGroupName = 'wood';

export function buildGroupName(kind: string): BuildGroupName {
  return Object.hasOwn(BUILD_SOUND_OF, kind) ? BUILD_SOUND_OF[kind]! : BUILD_FALLBACK;
}
