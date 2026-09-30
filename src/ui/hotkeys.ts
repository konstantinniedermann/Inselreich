import type { Tool } from '../render/renderer';

/** Werkzeug-Hotkeys (Spec 10.6), Schlüssel klein. W/A/S/D bleiben beim Schwenken. */
export const TOOL_HOTKEYS: Partial<Record<string, Tool>> = {
  r: { kind: 'road' },
  x: { kind: 'demolish' },
  h: { kind: 'build', defId: 'house' },
  k: { kind: 'build', defId: 'chapel' },
  u: { kind: 'build', defId: 'school' },
  m: { kind: 'build', defId: 'market' },
  f: { kind: 'build', defId: 'fisher' },
  l: { kind: 'build', defId: 'lumberjack' },
  b: { kind: 'build', defId: 'quarry' },
  g: { kind: 'build', defId: 'sheepfarm' },
  v: { kind: 'build', defId: 'weaver' },
  z: { kind: 'build', defId: 'canefarm' },
  n: { kind: 'build', defId: 'distillery' },
  t: { kind: 'build', defId: 'toolmaker' },
};

const SPEED_KEYS: Partial<Record<string, 1 | 2 | 4>> = { '1': 1, '2': 2, '3': 4 };

export type HotkeyAction =
  { kind: 'tool'; tool: Tool } | { kind: 'speed'; speed: 1 | 2 | 4 } | { kind: 'pause' };

/**
 * Wirkung einer Taste, oder `null` (Modifier gedrückt, Formularfeld, Pan-Taste, Esc, unbekannt).
 * Esc und das Schwenken behandelt `input.ts` wie bisher.
 */
export function hotkeyAction(
  key: string,
  mods: { ctrl: boolean; meta: boolean; alt: boolean },
  inFormField: boolean,
): HotkeyAction | null {
  if (inFormField || mods.ctrl || mods.meta || mods.alt) return null;
  const k = key.toLowerCase();
  if (k === 'p') return { kind: 'pause' };
  const speed = SPEED_KEYS[k];
  if (speed !== undefined) return { kind: 'speed', speed };
  const tool = TOOL_HOTKEYS[k];
  return tool ? { kind: 'tool', tool } : null;
}

/** Gleiches Werkzeug (Art und Gebäudetyp). */
export function sameTool(a: Tool, b: Tool): boolean {
  if (a.kind !== b.kind) return false;
  return a.kind !== 'build' || (b.kind === 'build' && a.defId === b.defId);
}

/** Taste fürs Tooltip („L", „Esc" für die Auswahl) oder `null`, wenn keine belegt ist. */
export function hotkeyLabel(tool: Tool): string | null {
  if (tool.kind === 'select') return 'Esc';
  for (const [key, t] of Object.entries(TOOL_HOTKEYS)) {
    if (t && sameTool(t, tool)) return key.toUpperCase();
  }
  return null;
}

/** Tempo nach einer Änderung: `last` merkt das letzte laufende Tempo (> 0), P setzt es fort. */
export function withSpeed(
  speed: 0 | 1 | 2 | 4,
  last: 1 | 2 | 4,
): { speed: 0 | 1 | 2 | 4; last: 1 | 2 | 4 } {
  return { speed, last: speed === 0 ? last : speed };
}

/** Tempo nach P: pausiert ein laufendes Spiel, setzt sonst das gemerkte Tempo fort. */
export function afterPause(
  speed: 0 | 1 | 2 | 4,
  last: 1 | 2 | 4,
): { speed: 0 | 1 | 2 | 4; last: 1 | 2 | 4 } {
  return speed === 0 ? withSpeed(last, last) : withSpeed(0, speed);
}
