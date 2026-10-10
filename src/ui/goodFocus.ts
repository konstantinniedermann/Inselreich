// goodFocus.ts — rein: Erzeuger und Verbraucher eines Guts auf einer Insel und die Meldungen M1–M3 (I-043); nicht im Spielstand.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS } from '../sim/defs/goods';
import { missingInputs } from '../sim/queries';
import type { Building, GoodId, World } from '../sim/types';
import { buildLock } from '../sim/unlocks';
import { jumpTarget } from './islandJump';
import { compareSort, spot, stepList, type ProblemCursor, type ProblemSort } from './problems';
import { stateInfo } from './texts';

export type FocusRole = 'producer' | 'consumer';
export interface FocusEntry {
  key: string; // `b:<id>`
  role: FocusRole;
  island: number;
  id: number;
  at: { x: number; y: number }; // Archipel-Kacheln, Footprint-Mitte
  sort: ProblemSort; // [Rolle 0|1, 0, Abstand zu jumpTarget, ID]
  building: Building;
}

/** Erzeuger vor Verbrauchern, je Rolle nach Abstand zum Sprungziel, dann ID. Alle Zustände zählen. */
export function focusList(world: World, island: number, good: GoodId): FocusEntry[] {
  const j = jumpTarget(world, island);
  const out: FocusEntry[] = [];
  for (const b of Object.values(world.buildings)) {
    if (b.island !== island || b.house || b.defId === 'kontor') continue;
    const def = BUILDING_DEFS[b.defId];
    const role: FocusRole | null =
      def.produces === good ? 'producer' : def.consumes?.includes(good) ? 'consumer' : null;
    if (role === null) continue;
    const at = spot(world, b);
    out.push({
      key: `b:${b.id}`,
      role,
      island,
      id: b.id,
      at,
      sort: [role === 'producer' ? 0 : 1, 0, Math.hypot(at.x - j.x, at.y - j.y), b.id],
      building: b,
    });
  }
  return out.sort((a, b) => compareSort(a.sort, b.sort));
}

/** M1: `index` ist 1-basiert. */
export function focusMessage(
  world: World,
  good: GoodId,
  index: number,
  count: number,
  e: FocusEntry,
): string {
  const def = BUILDING_DEFS[e.building.defId];
  const role = e.role === 'producer' ? 'Erzeuger' : 'Verbraucher';
  const state = stateInfo(e.building, world.tick, missingInputs(world, e.building)).text;
  return `${GOODS[good].name} ${index} von ${count}: ${def.name} (${role}) · ${state}`;
}

/** M2: kein Erzeuger auf der Insel; nennt die freigeschalteten Erzeuger-Typen. */
export function noProducerMessage(world: World, good: GoodId): string {
  const names = Object.values(BUILDING_DEFS)
    .filter((d) => d.produces === good && buildLock(world, d.id) === null)
    .map((d) => d.name);
  const head = `Noch kein Erzeuger für ${GOODS[good].name} — `;
  if (names.length === 0) return `${head}Erzeuger noch nicht frei`;
  const list =
    names.length === 1
      ? names[0]!
      : `${names.slice(0, -1).join(', ')} oder ${names[names.length - 1]}`;
  return `${head}Bauen: ${list}`;
}

/** M3: der Fokus hat nichts mehr zu markieren. */
export const emptyFocusMessage = (good: GoodId): string =>
  `${GOODS[good].name}: nichts mehr markiert`;

export type FocusState = { good: GoodId; island: number } | null;
export type FocusEvent =
  | { kind: 'toggle'; good: GoodId; island: number } // Chip-Klick
  | { kind: 'clear' }; // Esc, Inselwechsel, Neue Insel, Laden, M3

export function focusReduce(state: FocusState, e: FocusEvent): FocusState {
  if (e.kind === 'clear') return null;
  if (state !== null && state.good === e.good && state.island === e.island) return null;
  return { good: e.good, island: e.island };
}

/** `true`, wenn nach dem Toggle gesprungen werden soll (Fokus an: neu oder anderes Gut/Insel). */
export function toggleStartsJump(before: FocusState, e: FocusEvent): boolean {
  return focusReduce(before, e) !== null;
}

export interface FocusDeps {
  world: World;
  activeIsland(): number;
  getFocus(): FocusState;
  setFocus(f: FocusState): void;
  getCursor(): ProblemCursor | null; // Fokus-Cursor, getrennt vom Problem-Cursor
  setCursor(c: ProblemCursor | null): void;
  cancelPointerAction(): void;
  centerOn(x: number, y: number): void;
  openPanel(id: number): void;
  refresh(): void;
  message(text: string): void;
}

/** Routing von `.`/`,`: Gut-Liste bei aktivem Fokus, sonst Problemliste (AK-GC-08). */
export function stepKeyTarget(focus: FocusState): 'focus' | 'problem' {
  return focus === null ? 'problem' : 'focus';
}

/** `true`, wenn der Fokus nach einem Inselwechsel zu löschen ist (AK-GC-07). */
export function shouldClearFocus(focus: FocusState, activeIsland: number): boolean {
  return focus !== null && focus.island !== activeIsland;
}

function land(deps: FocusDeps, good: GoodId, list: readonly FocusEntry[], dir: 1 | -1): void {
  const step = stepList(() => list, deps.getCursor(), deps.activeIsland(), dir);
  if (step === null) return;
  const { item } = step;
  deps.centerOn(item.at.x, item.at.y);
  deps.openPanel(item.id);
  deps.refresh();
  deps.setCursor({ ...step.cursor, landed: deps.activeIsland() });
  deps.message(focusMessage(deps.world, good, step.index, step.count, item));
}

export function runFocusToggle(deps: FocusDeps, good: GoodId): void {
  deps.cancelPointerAction();
  const island = deps.activeIsland();
  const next = focusReduce(deps.getFocus(), { kind: 'toggle', good, island });
  if (next === null) {
    deps.setFocus(null);
    deps.setCursor(null);
    deps.refresh();
    return;
  }
  const list = focusList(deps.world, island, good);
  if (list.length === 0) {
    deps.message(noProducerMessage(deps.world, good));
    deps.setFocus(null);
    deps.setCursor(null);
    deps.refresh();
    return;
  }
  if (!list.some((e) => e.role === 'producer')) {
    deps.message(noProducerMessage(deps.world, good));
    deps.setFocus(next);
    deps.setCursor(null);
    deps.refresh();
    return;
  }
  deps.setFocus(next);
  deps.setCursor(null);
  land(deps, good, list, 1);
}

export function runFocusStep(deps: FocusDeps, dir: 1 | -1): void {
  const focus = deps.getFocus();
  if (focus === null) return;
  deps.cancelPointerAction();
  const list = focusList(deps.world, focus.island, focus.good);
  if (list.length === 0) {
    deps.message(emptyFocusMessage(focus.good));
    deps.setFocus(null);
    deps.setCursor(null);
    deps.refresh();
    return;
  }
  land(deps, focus.good, list, dir);
}
