import { deserialize, serialize, type LoadResult } from '../sim/save';
import { fail, ok, type Result, type World } from '../sim/types';

export const SAVE_KEY = 'inselreich.save.v1';

/** Schreibt den Spielstand; Speicher voll oder gesperrt wird als Fehler gemeldet. */
export function saveToStorage(world: World): Result {
  try {
    localStorage.setItem(SAVE_KEY, serialize(world));
    return ok;
  } catch {
    return fail('Speichern fehlgeschlagen');
  }
}

/** Liest den Spielstand; ein fehlender oder unlesbarer Speicher liefert einen Grund statt Fehler. */
export function loadFromStorage(): LoadResult {
  let json: string | null;
  try {
    json = localStorage.getItem(SAVE_KEY);
  } catch {
    return { ok: false, reason: 'Kein Spielstand vorhanden' };
  }
  if (json === null) return { ok: false, reason: 'Kein Spielstand vorhanden' };
  return deserialize(json);
}
