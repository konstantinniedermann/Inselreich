/**
 * Klänge der Wirtschaft (H-A2): Mangel-Doppelton und Arbeitston. Daten und Konstanten, keine Logik.
 * Gut und Gebäudeart sind hier Strings; `src/audio/` kennt `src/sim/` nicht. Pegel und Zeiten sind
 * Darstellungswerte, keine Spielwerte.
 */
import type { BuildStep } from './buildSounds';

/** Mangel: höchstens ein Ton je Gut in dieser Zeit (s, gemessen an ctx.currentTime). */
export const SHORTAGE_PER_GOOD_S = 60;
/** Mangel: Mindestabstand zwischen zwei Mangeltönen, gleich welches Gut (s). */
export const SHORTAGE_GLOBAL_S = 20;
/** Pegel des Mangeltons (Signal, unter `order` mit 0,35). */
export const SHORTAGE_PEAK = 0.3;
/** Dauer eines Einzeltons und Abstand der beiden Töne (s). */
export const SHORTAGE_TONE_S = 0.15;
export const SHORTAGE_GAP_S = 0.18;
/** Länge der Figur bis zum Ende des zweiten Tons (s); Dauer des Duckings. */
export const SHORTAGE_FIGURE_S = SHORTAGE_GAP_S + SHORTAGE_TONE_S;

export interface ShortageVoice {
  /** Erster (höherer) und zweiter (tieferer) Ton in Hz. */
  f1: number;
  f2: number;
  /** Nur weiche Wellenformen (kein Sägezahn: darf nicht wie `error` klingen). */
  type: 'sine' | 'triangle';
}

const BASE_VOICE: ShortageVoice = { f1: 220, f2: 165, type: 'triangle' };

/** Färbung je Gut: Nahrung etwas höher, Stoff und Wolle weicher (Sinus). */
export const SHORTAGE_VOICES: Readonly<Record<string, ShortageVoice>> = {
  food: { f1: 262, f2: 196, type: 'triangle' },
  wool: { f1: 196, f2: 147, type: 'sine' },
  cloth: { f1: 185, f2: 139, type: 'sine' },
  rum: { f1: 208, f2: 156, type: 'sine' },
  glass: { f1: 247, f2: 185, type: 'sine' },
  wood: { f1: 196, f2: 147, type: 'triangle' },
  stone: { f1: 175, f2: 131, type: 'triangle' },
};

export function shortageVoice(good: string): ShortageVoice {
  return Object.hasOwn(SHORTAGE_VOICES, good) ? SHORTAGE_VOICES[good]! : BASE_VOICE;
}

/** Arbeitston: Mindestabstand zwischen zwei Arbeitstönen (ms) und je Gebäudeart (ms). */
export const WORK_GLOBAL_MS = 700;
export const WORK_PER_KIND_MS = 2000;
/** Höchster relativer Pegel (vor dem Effekte-Faktor); deutlich unter dem Bauklang (0,12). */
export const WORK_PEAK_MAX = 0.025;

export type WorkGroup = { steps: readonly BuildStep[] };

/** Holz: dumpfes Klopfen. */
const WOOD: WorkGroup = {
  steps: [
    { k: 'burst', at: 0, dur: 0.05, peak: 0.02, from: 600, to: 300 },
    { k: 'tone', at: 0, dur: 0.07, peak: 0.02, freq: 180, freqEnd: 120 },
  ],
};
/** Stein: kurzer heller Tick. */
const STONE: WorkGroup = {
  steps: [
    { k: 'burst', at: 0, dur: 0.012, peak: 0.02, from: 3000, to: 3000, filter: 'highpass' },
    { k: 'tone', at: 0, dur: 0.04, peak: 0.01, freq: 1200, freqEnd: 900 },
  ],
};
/** Wasser: kleines Plätschern. */
const WATER: WorkGroup = {
  steps: [{ k: 'burst', at: 0, dur: 0.1, peak: 0.015, from: 700, to: 1500, filter: 'bandpass' }],
};
/** Weben: zwei winzige Schiffchen-Schläge. */
const WEAVE: WorkGroup = {
  steps: [
    { k: 'burst', at: 0, dur: 0.02, peak: 0.012, from: 1500, to: 1500, filter: 'bandpass' },
    { k: 'burst', at: 0.05, dur: 0.02, peak: 0.012, from: 1700, to: 1700, filter: 'bandpass' },
  ],
};
/** Werkzeug: kurzer Metall-Pink. */
const TOOL: WorkGroup = {
  steps: [
    { k: 'burst', at: 0, dur: 0.01, peak: 0.015, from: 2500, to: 2500, filter: 'highpass' },
    { k: 'tone', at: 0, dur: 0.05, peak: 0.015, freq: 520, freqEnd: 480 },
  ],
};
/** Glas: heller, kurzer Klingelton. */
const GLASS: WorkGroup = {
  steps: [{ k: 'tone', at: 0, dur: 0.1, peak: 0.008, freq: 1800 }],
};
/** Brennerei: tiefes Blubbern. */
const STILL: WorkGroup = {
  steps: [
    { k: 'tone', at: 0, dur: 0.1, peak: 0.018, freq: 140, freqEnd: 110 },
    { k: 'burst', at: 0.03, dur: 0.06, peak: 0.01, from: 500, to: 900, filter: 'bandpass' },
  ],
};

export const WORK_GROUPS = {
  wood: WOOD,
  stone: STONE,
  water: WATER,
  weave: WEAVE,
  tool: TOOL,
  glass: GLASS,
  still: STILL,
};
export type WorkGroupName = keyof typeof WORK_GROUPS;

/** Zuordnung Gebäudeart -> Gruppe; fehlende Arten fallen auf den Rückfall. */
export const WORK_SOUND_OF: Readonly<Record<string, WorkGroupName>> = {
  lumberjack: 'wood',
  sheepfarm: 'wood',
  canefarm: 'wood',
  hunter: 'wood',
  cattlefarm: 'wood',
  quarry: 'stone',
  fisher: 'water',
  weaver: 'weave',
  toolmaker: 'tool',
  glassworks: 'glass',
  distillery: 'still',
};

export const WORK_FALLBACK: WorkGroupName = 'wood';

export function workGroupName(kind: string): WorkGroupName {
  return Object.hasOwn(WORK_SOUND_OF, kind) ? WORK_SOUND_OF[kind]! : WORK_FALLBACK;
}
