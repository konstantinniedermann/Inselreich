// Tastenform Strg/Cmd+S: eigene Datei, damit modal.ts sie ohne hotkeys (und sim/defs) laden kann.
// Keine Regeln, kein DOM.

export type Mods = { ctrl: boolean; meta: boolean; alt: boolean; shift?: boolean };

/** Reine Tastenform Strg/Cmd+S (ohne Alt, ohne Umschalt), unabhängig von Feld und Modal. */
export function isSaveChord(key: string, mods: Mods): boolean {
  return key.toLowerCase() === 's' && (mods.ctrl || mods.meta) && !mods.alt && mods.shift !== true;
}
