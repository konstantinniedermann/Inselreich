import { deserialize, serialize, type LoadResult } from '../sim/save';
import { fail, ok, type Result, type World } from '../sim/types';

/** Manueller Speicherplatz (Schlüssel bleibt v1, das Format ist v2 mit Migration). */
export const SAVE_KEY = 'inselreich.save.v1';
export const AUTO_KEY = 'inselreich.save.auto';

/** Meldung des Ladens (Übergangsbestand eines alten Standes) oder `null`; nichts davon wird gespeichert. */
export function loadNotice(result: LoadResult): string | null {
  return result.ok && result.notice !== undefined ? result.notice : null;
}

export type Slot = 'manual' | 'auto';
export interface SaveInfo {
  slot: Slot;
  tick: number;
}

/** Was `listSavesFrom` vom Speicher braucht (testbar ohne DOM). */
export interface StorageLike {
  getItem(key: string): string | null;
}

const SLOT_KEYS: Record<Slot, string> = { manual: SAVE_KEY, auto: AUTO_KEY };
const SLOTS: Slot[] = ['manual', 'auto'];
const NO_SAVE = 'Kein Spielstand vorhanden';

function write(key: string, world: World, failReason: string): Result {
  try {
    localStorage.setItem(key, serialize(world));
    return ok;
  } catch {
    return fail(failReason);
  }
}

/** Schreibt den manuellen Spielstand; Speicher voll oder gesperrt wird als Fehler gemeldet. */
export function saveToStorage(world: World): Result {
  return write(SAVE_KEY, world, 'Speichern fehlgeschlagen');
}

/** Schreibt den Autosave-Slot. */
export function saveAuto(world: World): Result {
  return write(AUTO_KEY, world, 'Autosave fehlgeschlagen');
}

function readSlot(storage: StorageLike, slot: Slot): LoadResult {
  let json: string | null;
  try {
    json = storage.getItem(SLOT_KEYS[slot]);
  } catch {
    return { ok: false, reason: 'Speicher nicht verfügbar' };
  }
  if (json === null) return { ok: false, reason: NO_SAVE };
  return deserialize(json);
}

/** Nur die Slots, die `deserialize` akzeptiert (kaputte oder fremde Stände fehlen); wirft nie. */
export function listSavesFrom(storage: StorageLike): SaveInfo[] {
  const out: SaveInfo[] = [];
  for (const slot of SLOTS) {
    const r = readSlot(storage, slot);
    if (r.ok) out.push({ slot, tick: r.world.tick });
  }
  return out;
}

/** Wie `listSavesFrom` auf `localStorage`; ein gesperrter Speicher ergibt eine leere Liste. */
export function listSaves(): SaveInfo[] {
  try {
    return listSavesFrom(localStorage);
  } catch {
    return [];
  }
}

/** Liest einen Slot; ein fehlender oder unlesbarer Speicher liefert einen Grund statt Fehler. */
export function loadSlot(slot: Slot): LoadResult {
  try {
    return readSlot(localStorage, slot);
  } catch {
    return { ok: false, reason: 'Speicher nicht verfügbar' };
  }
}

/** Grund, wenn kein Slot ladbar ist: der erste echte Fehler (kaputt), sonst „Kein Spielstand". */
export function noLoadableReason(): string {
  for (const slot of SLOTS) {
    const r = loadSlot(slot);
    if (!r.ok && r.reason !== NO_SAVE) return r.reason;
  }
  return NO_SAVE;
}

export type StorageProblem = 'none' | 'unavailable' | 'damaged';

/** Speicherzustand für Startkarte und Menü: wirft `getItem`, ist er gesperrt; ein belegter, abgelehnter Slot ist kaputt. */
export function storageProblem(storage: StorageLike): StorageProblem {
  let problem: StorageProblem = 'none';
  for (const slot of SLOTS) {
    let json: string | null;
    try {
      json = storage.getItem(SLOT_KEYS[slot]);
    } catch {
      return 'unavailable';
    }
    if (json !== null && !deserialize(json).ok) problem = 'damaged';
  }
  return problem;
}

export function currentStorageProblem(): StorageProblem {
  try {
    return storageProblem(localStorage);
  } catch {
    return 'unavailable';
  }
}

/** `pagehide`: still den Autosave schreiben (nicht bei Tick 0); Fehler bleiben folgenlos (Spec L1, §9 Punkt 7). */
export function autosaveOnHide(world: World, write: (w: World) => Result = saveAuto): void {
  if (world.tick <= 0) return;
  try {
    write(world);
  } catch {
    // bewusst still: die Startkarte bietet dann den älteren Stand an
  }
}
