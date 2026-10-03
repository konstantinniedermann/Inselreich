import type { Tool } from '../render/renderer';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { buildingShown } from '../sim/unlocks';
import type { Category, World } from '../sim/types';

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
  e: { kind: 'build', defId: 'firestation' },
  j: { kind: 'build', defId: 'bathhouse' },
  o: { kind: 'build', defId: 'glassworks' },
  i: { kind: 'build', defId: 'townhall' },
};

export const SPEED_KEYS: Partial<Record<string, 1 | 2 | 4>> = { '1': 1, '2': 2, '3': 4 };

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

/** Feste Bedien-Tasten ohne Werkzeug (Menü „Tastenkürzel", Spec L2). */
export const NAV_KEYS: readonly { key: string; label: string }[] = [
  { key: 'W A S D / Pfeile', label: 'Karte schwenken' },
  { key: 'Leertaste + Ziehen', label: 'Karte schwenken mit der Maus' },
  { key: 'Mausrad', label: 'Zoomen' },
  { key: 'Esc', label: 'Werkzeug ablegen, Karte schliessen' },
  { key: 'Rechtsklick', label: 'Werkzeug ablegen' },
];

export function toolName(tool: Tool): string {
  if (tool.kind === 'select') return 'Auswahl';
  if (tool.kind === 'road') return 'Weg';
  if (tool.kind === 'demolish') return 'Abriss';
  return BUILDING_DEFS[tool.defId].name;
}

/** Bau-Kategorie eines Werkzeugs (öffnet die Einträge-Leiste), sonst `null`. */
export function categoryOf(tool: Tool): Category | null {
  return tool.kind === 'build' && tool.defId !== 'kontor'
    ? BUILDING_DEFS[tool.defId].category
    : null;
}

/** Werkzeug ist in der Bedienung sichtbar: Bau-Werkzeuge nur, wenn das Gebäude angezeigt wird (Spec 11.2). */
export function toolShown(world: World, tool: Tool): boolean {
  return tool.kind !== 'build' || buildingShown(world, tool.defId);
}

/** Einzige Liste aller Tasten für das Menü (keine zweite Liste, Spec L2); nur Freigeschaltetes. */
export function hotkeyList(world: World): { key: string; label: string }[] {
  const tools = Object.entries(TOOL_HOTKEYS)
    .filter(([, t]) => toolShown(world, t!))
    .map(([k, t]) => ({
      key: k.toUpperCase(),
      label: toolName(t!),
    }));
  const speeds = Object.entries(SPEED_KEYS).map(([k, s]) => ({ key: k, label: `Tempo ${s}×` }));
  return [...tools, ...speeds, { key: 'P', label: 'Pause / weiter' }, ...NAV_KEYS];
}

export type CategoryEvent = { kind: 'toggle'; category: Category } | { kind: 'tool'; tool: Tool };

/** Welche Kategorie die Einträge-Leiste nach einem Klick oder Werkzeugwechsel offen zeigt. */
export function nextOpenCategory(open: Category | null, ev: CategoryEvent): Category | null {
  if (ev.kind === 'toggle') return open === ev.category ? null : ev.category;
  return categoryOf(ev.tool);
}
