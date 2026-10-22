import { SAVE_VERSION, deserialize, serialize, type LoadResult } from '../sim/save';
import { fail, ok, type Result, type World } from '../sim/types';

/** Manueller Speicherplatz (Schlüssel bleibt v1, das Format ist v2 mit Migration). */
export const SAVE_KEY = 'inselreich.save.v1';
export const AUTO_KEY = 'inselreich.save.auto';
/** Zweiter Autosave-Platz («Davor») und Zeiger auf den zuletzt geschriebenen Platz. */
export const AUTO2_KEY = 'inselreich.save.auto2';
export const AUTO_LAST_KEY = 'inselreich.save.auto.last';

/** Meldung des Ladens (Übergangsbestand eines alten Standes) oder `null`; nichts davon wird gespeichert. */
export function loadNotice(result: LoadResult): string | null {
  return result.ok && result.notice !== undefined ? result.notice : null;
}

export type AutoSlot = 'auto' | 'auto2';
export type Slot = 'manual' | AutoSlot;
export interface SaveInfo {
  slot: Slot;
  tick: number;
}

/** Was `listSavesFrom` vom Speicher braucht (testbar ohne DOM). */
export interface StorageLike {
  getItem(key: string): string | null;
}

const SLOT_KEYS: Record<Slot, string> = {
  manual: SAVE_KEY,
  auto: AUTO_KEY,
  auto2: AUTO2_KEY,
};
const SLOTS: Slot[] = ['manual', 'auto', 'auto2'];
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

/** Zeiger auf den zuletzt geschriebenen Autosave-Platz; fehlend, ungültig oder unlesbar ergibt `null`. */
function readPointer(storage: StorageLike): AutoSlot | null {
  try {
    const v = storage.getItem(AUTO_LAST_KEY);
    return v === 'auto' || v === 'auto2' ? v : null;
  } catch {
    return null;
  }
}

/** Spielzeit eines lesbaren Autosave-Platzes, sonst `null` (fehlt, beschädigt, fremd). */
function autoTick(storage: StorageLike, slot: AutoSlot): number | null {
  const r = readSlot(storage, slot);
  return r.ok ? r.world.tick : null;
}

/** Neuester gültiger Autosave-Platz: Zeiger, sonst grössere Spielzeit (Gleichstand `auto`); keiner gültig: `null`. */
export function newestAuto(storage: StorageLike): AutoSlot | null {
  const a = autoTick(storage, 'auto');
  const b = autoTick(storage, 'auto2');
  if (a === null && b === null) return null;
  if (a === null) return 'auto2';
  if (b === null) return 'auto';
  const p = readPointer(storage);
  if (p !== null) return p;
  return b > a ? 'auto2' : 'auto';
}

/** Ziel des nächsten periodischen Autosaves: der Platz ausser dem Zeiger; ohne Zeiger der fehlende oder beschädigte, sonst der ältere (Gleichstand `auto2`). */
export function otherAuto(storage: StorageLike): AutoSlot {
  const a = autoTick(storage, 'auto');
  const b = autoTick(storage, 'auto2');
  const p = readPointer(storage);
  if (p !== null && (p === 'auto' ? a : b) !== null) return p === 'auto' ? 'auto2' : 'auto';
  if (a === null) return 'auto';
  if (b === null) return 'auto2';
  return a < b ? 'auto' : 'auto2';
}

function writeAuto(world: World, target: AutoSlot, moveMarker: boolean): Result {
  const r = write(SLOT_KEYS[target], world, 'Autosave fehlgeschlagen');
  if (r.ok && moveMarker) {
    try {
      localStorage.setItem(AUTO_LAST_KEY, target);
    } catch {
      // Zeiger ist nur Komfort: ohne ihn entscheidet die Spielzeit
    }
  }
  return r;
}

/** Periodischer Autosave: schreibt den anderen Platz und setzt den Zeiger erst nach Erfolg. */
export function saveAuto(world: World): Result {
  let target: AutoSlot;
  try {
    target = otherAuto(localStorage);
  } catch {
    return fail('Autosave fehlgeschlagen');
  }
  return writeAuto(world, target, true);
}

/** Beim Verlassen: überschreibt den neuesten Platz, der Zeiger bleibt, der andere Platz bleibt als «Davor». */
export function saveAutoNewest(world: World): Result {
  let target: AutoSlot;
  try {
    target = newestAuto(localStorage) ?? 'auto';
  } catch {
    return fail('Autosave fehlgeschlagen');
  }
  return writeAuto(world, target, false);
}

/** Nur die Slots, die `deserialize` akzeptiert (kaputte oder fremde Stände fehlen); wirft nie. */
export function listSavesFrom(storage: StorageLike): SaveInfo[] {
  const out: SaveInfo[] = [];
  const newest = newestAuto(storage);
  // Reihenfolge: manuell, neuester Autosave, «Davor»
  const order: Slot[] = SLOTS.filter((s) => s !== 'auto2');
  if (newest === 'auto2') order.splice(order.indexOf('auto'), 1, 'auto2', 'auto');
  else order.push('auto2');
  for (const slot of order) {
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

export type StorageProblem = 'none' | 'unavailable' | 'damaged' | 'newer';

/** Stammt der Stand aus einer neueren Spielversion? Nur Erkennung per `JSON.parse`; defektes JSON ergibt `false`. */
function isNewerSave(json: string): boolean {
  try {
    const v = (JSON.parse(json) as { version?: unknown } | null)?.version;
    return typeof v === 'number' && v > SAVE_VERSION;
  } catch {
    return false;
  }
}

/** Speicherzustand für Startkarte und Menü: wirft `getItem`, ist er gesperrt; ein abgelehnter Slot ist neuer (Version > SAVE_VERSION) oder kaputt. */
export function storageProblem(storage: StorageLike): StorageProblem {
  let problem: StorageProblem = 'none';
  let newer = false;
  for (const slot of SLOTS) {
    let json: string | null;
    try {
      json = storage.getItem(SLOT_KEYS[slot]);
    } catch {
      return 'unavailable';
    }
    if (json !== null && !deserialize(json).ok) {
      if (isNewerSave(json)) newer = true;
      else problem = 'damaged';
    }
  }
  return newer ? 'newer' : problem; // Vorrang: neuere Version vor beschädigt
}

export function currentStorageProblem(): StorageProblem {
  try {
    return storageProblem(localStorage);
  } catch {
    return 'unavailable';
  }
}

/** `pagehide`: still den Autosave schreiben (nicht bei Tick 0); Fehler bleiben folgenlos (Spec L1, §9 Punkt 7). */
export function autosaveOnHide(world: World, write: (w: World) => Result = saveAutoNewest): void {
  if (world.tick <= 0) return;
  try {
    write(world);
  } catch {
    // bewusst still: die Startkarte bietet dann den älteren Stand an
  }
}
