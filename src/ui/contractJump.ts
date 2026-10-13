// contractJump.ts — rein: Sprung von der Vertragskarte zum Erzeuger des Vertragsguts (I-090); nicht im Spielstand.
import { islandName } from '../sim/islands';
import type { GoodId, World } from '../sim/types';
import { focusList, focusMessage, noProducerMessage, type FocusEntry } from './goodFocus';
import { stepList, type ProblemCursor } from './problems';

/** Erzeuger des Vertragsguts auf der Vertragsinsel, Reihenfolge wie `focusList`; ohne Vertrag leer. */
export function contractProducers(world: World): FocusEntry[] {
  const c = world.contract;
  if (c === null) return [];
  return focusList(world, c.island, c.good).filter((e) => e.role === 'producer');
}

/** Schlüssel des Vertrags (Gut und Insel); ändert er sich, ist der Sprung-Cursor zu verwerfen. */
export function contractKey(world: World): string | null {
  const c = world.contract;
  return c === null ? null : `${c.good}|${c.island}`;
}

/** Meldung «kein Erzeuger» mit Inselzusatz (auch auf der Heimatinsel). */
export function contractNoProducerMessage(
  world: World,
  c: { good: GoodId; island: number },
): string {
  const base = noProducerMessage(world, c.good);
  const marker = ' — ';
  const at = base.indexOf(marker);
  const suffix = ` auf ${islandName(world, c.island)}`;
  return at < 0 ? base + suffix : base.slice(0, at) + suffix + base.slice(at);
}

export interface ContractJumpDeps {
  world: World;
  activeIsland(): number;
  getCursor(): ProblemCursor | null; // eigener Cursor, getrennt von Problem- und Fokus-Cursor
  setCursor(c: ProblemCursor | null): void;
  cancelPointerAction(): void;
  centerOn(x: number, y: number): void;
  openPanel(id: number): void;
  refresh(): void;
  message(text: string): void;
}

/** Springt zum nächsten Erzeuger des Vertragsguts; setzt keinen Gut-Fokus. Ohne Vertrag: nichts. */
export function runContractJump(deps: ContractJumpDeps, dir: 1 | -1): void {
  const c = deps.world.contract;
  if (c === null) return;
  const list = contractProducers(deps.world);
  if (list.length === 0) {
    deps.message(contractNoProducerMessage(deps.world, c));
    return;
  }
  deps.cancelPointerAction();
  const step = stepList(() => list, deps.getCursor(), deps.activeIsland(), dir);
  if (step === null) return;
  const { item } = step;
  deps.centerOn(item.at.x, item.at.y);
  deps.openPanel(item.id);
  deps.refresh();
  deps.setCursor({ ...step.cursor, landed: deps.activeIsland() });
  deps.message(focusMessage(deps.world, c.good, step.index, step.count, item));
}
