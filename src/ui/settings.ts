import { DEFAULT_NEW_GAME_CRISIS_LEVEL } from '../sim/defs/crises';
import { fail, ok, type CrisisLevel, type Result } from '../sim/types';

/** Krisenstufen in der Reihenfolge der Auswahl. */
export const CRISIS_LEVEL_IDS: readonly CrisisLevel[] = ['off', 'mild', 'normal'];

export type ReduceMotion = 'auto' | 'on' | 'off';
export const REDUCE_MOTION_IDS: readonly ReduceMotion[] = ['auto', 'on', 'off'];

export interface Settings {
  muted: boolean;
  /** Gesamtlautstärke (bis M6 „volume"). */
  master: number;
  music: number;
  ambience: number;
  effects: number;
  /** Tag-Nacht-Tönung der Karte (A4). */
  dayNight: boolean;
  /** Bewegung reduzieren: `auto` folgt `prefers-reduced-motion`. */
  reduceMotion: ReduceMotion;
  /** Krisenstufe für „Neu" (M6 13.1); das laufende Spiel behält seine Stufe. */
  crisisLevel: CrisisLevel;
  /** Fremde Felder des gemeinsamen Formats (M7: master, music, …); unverändert zurückgeschrieben. */
  extra?: Record<string, unknown>;
}

/** `volume` ist Altfeld: nur Quelle für `master`, wird nie mehr geschrieben. */
const KNOWN_KEYS: readonly string[] = [
  'muted',
  'master',
  'music',
  'ambience',
  'effects',
  'dayNight',
  'reduceMotion',
  'crisisLevel',
  'volume',
];

export const SETTINGS_KEY = 'inselreich.settings';
export const DEFAULT_SETTINGS: Readonly<Settings> = {
  muted: false,
  master: 0.4,
  music: 0.5,
  ambience: 0.7,
  effects: 1,
  dayNight: true,
  reduceMotion: 'auto',
  crisisLevel: DEFAULT_NEW_GAME_CRISIS_LEVEL,
};

/** Zahl -> auf 0…1 geklemmt; alles andere (Text, NaN, ±Infinity, fehlend) -> Standard. */
function level(v: unknown, fallback: number): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return fallback;
  return Math.min(1, Math.max(0, v));
}

/** Liest Einstellungs-JSON; ungültige oder fehlende Werte fallen einzeln auf den Standard zurück. */
export function parseSettings(json: string | null): Settings {
  if (json === null) return { ...DEFAULT_SETTINGS };
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return { ...DEFAULT_SETTINGS };
  const o = raw as Record<string, unknown>;
  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) if (!KNOWN_KEYS.includes(k)) extra[k] = v;
  const settings: Settings = {
    muted: typeof o.muted === 'boolean' ? o.muted : DEFAULT_SETTINGS.muted,
    master: level('master' in o ? o.master : o.volume, DEFAULT_SETTINGS.master),
    music: level(o.music, DEFAULT_SETTINGS.music),
    ambience: level(o.ambience, DEFAULT_SETTINGS.ambience),
    effects: level(o.effects, DEFAULT_SETTINGS.effects),
    dayNight: typeof o.dayNight === 'boolean' ? o.dayNight : DEFAULT_SETTINGS.dayNight,
    reduceMotion: REDUCE_MOTION_IDS.includes(o.reduceMotion as ReduceMotion)
      ? (o.reduceMotion as ReduceMotion)
      : DEFAULT_SETTINGS.reduceMotion,
    crisisLevel:
      typeof o.crisisLevel === 'string' &&
      (CRISIS_LEVEL_IDS as readonly string[]).includes(o.crisisLevel)
        ? (o.crisisLevel as CrisisLevel)
        : DEFAULT_SETTINGS.crisisLevel,
  };
  if (Object.keys(extra).length > 0) settings.extra = extra;
  return settings;
}

/** Gemeinsames Format: fremde Felder zuerst, eigene darüber; kein `volume`. */
export function serializeSettings(s: Settings): string {
  const { extra, ...own } = s;
  return JSON.stringify({ ...extra, ...own });
}

/** `auto` folgt der Systemeinstellung, `on`/`off` gelten fest. */
export function resolveReduceMotion(m: ReduceMotion, prefersReduced: boolean): boolean {
  return m === 'auto' ? prefersReduced : m === 'on';
}

/** Liest die Einstellungen aus `localStorage`; ein gesperrter Speicher ergibt den Standard. */
export function loadSettings(): Settings {
  try {
    return parseSettings(localStorage.getItem(SETTINGS_KEY));
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Schreibt die Einstellungen; ein Fehler wird gemeldet, nicht geworfen. */
export function saveSettings(s: Settings): Result {
  try {
    localStorage.setItem(SETTINGS_KEY, serializeSettings(s));
    return ok;
  } catch {
    return fail('Einstellungen nicht gespeichert');
  }
}
