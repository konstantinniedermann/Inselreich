import { DEFAULT_NEW_GAME_CRISIS_LEVEL } from '../sim/defs/crises';
import { fail, ok, type CrisisLevel, type Result } from '../sim/types';

/** Krisenstufen in der Reihenfolge der Auswahl. */
export const CRISIS_LEVEL_IDS: readonly CrisisLevel[] = ['off', 'mild', 'normal'];

export interface Settings {
  muted: boolean;
  volume: number;
  /** Tag-Nacht-Tönung der Karte (A4). */
  dayNight: boolean;
  /** Krisenstufe für „Neu" (M6 13.1); das laufende Spiel behält seine Stufe. */
  crisisLevel: CrisisLevel;
  /** Fremde Felder des gemeinsamen Formats (M7: master, music, …); unverändert zurückgeschrieben. */
  extra?: Record<string, unknown>;
}

const KNOWN_KEYS: readonly string[] = ['muted', 'volume', 'dayNight', 'crisisLevel'];

export const SETTINGS_KEY = 'inselreich.settings';
export const DEFAULT_SETTINGS: Readonly<Settings> = {
  muted: false,
  volume: 0.4,
  dayNight: true,
  crisisLevel: DEFAULT_NEW_GAME_CRISIS_LEVEL,
};

/** Zahl -> auf 0…1 geklemmt; alles andere (Text, NaN, ±Infinity, fehlend) -> Standard. */
function volumeOf(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return DEFAULT_SETTINGS.volume;
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
    volume: volumeOf(o.volume),
    dayNight: typeof o.dayNight === 'boolean' ? o.dayNight : DEFAULT_SETTINGS.dayNight,
    crisisLevel:
      typeof o.crisisLevel === 'string' &&
      (CRISIS_LEVEL_IDS as readonly string[]).includes(o.crisisLevel)
        ? (o.crisisLevel as CrisisLevel)
        : DEFAULT_SETTINGS.crisisLevel,
  };
  if (Object.keys(extra).length > 0) settings.extra = extra;
  return settings;
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
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({
        ...s.extra,
        muted: s.muted,
        volume: s.volume,
        dayNight: s.dayNight,
        crisisLevel: s.crisisLevel,
      }),
    );
    return ok;
  } catch {
    return fail('Einstellungen nicht gespeichert');
  }
}
