import { fail, ok, type Result } from '../sim/types';

export interface Settings {
  muted: boolean;
  volume: number;
  /** Tag-Nacht-Tönung der Karte (A4). */
  dayNight: boolean;
}

export const SETTINGS_KEY = 'inselreich.settings';
export const DEFAULT_SETTINGS: Readonly<Settings> = { muted: false, volume: 0.4, dayNight: true };

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
  return {
    muted: typeof o.muted === 'boolean' ? o.muted : DEFAULT_SETTINGS.muted,
    volume: volumeOf(o.volume),
    dayNight: typeof o.dayNight === 'boolean' ? o.dayNight : DEFAULT_SETTINGS.dayNight,
  };
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
      JSON.stringify({ muted: s.muted, volume: s.volume, dayNight: s.dayNight }),
    );
    return ok;
  } catch {
    return fail('Einstellungen nicht gespeichert');
  }
}
