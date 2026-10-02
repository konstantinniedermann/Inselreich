// Startkarte (Spec L1): Ziel, erste Schritte, Fortsetzen oder Neu; im Modus `help` nur Nachlesen. Keine Regeln.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import type { BuildingDefId } from '../sim/types';
import { TIERS, WIN_CITIZENS } from '../sim/defs/tiers';
import type { Tool } from '../render/renderer';
import { hotkeyLabel } from './hotkeys';
import { openModal, renderConfirm } from './modal';
import { newIslandPrompt } from './menu';
import type { SaveInfo, Slot, StorageProblem } from './storage';
import { formatClock } from './time';

export type StartChoice =
  | { kind: 'load'; slot: Slot; label: string; primary: boolean }
  | { kind: 'new'; label: string; primary: boolean };

export const STORAGE_NOTES: Record<StorageProblem, string | null> = {
  none: null,
  damaged: 'Ein Spielstand ist beschädigt und kann nicht geladen werden.',
  unavailable:
    'Der Browser-Speicher ist nicht verfügbar — Spielstände lassen sich weder laden noch speichern.',
};

export function startChoices(
  saves: SaveInfo[],
  problem: StorageProblem,
): { choices: StartChoice[]; note: string | null } {
  const auto = saves.find((s) => s.slot === 'auto');
  const manual = saves.find((s) => s.slot === 'manual');
  const choices: StartChoice[] = [];
  if (auto)
    choices.push({
      kind: 'load',
      slot: 'auto',
      label: `Fortsetzen — Autosave (Spielzeit ${formatClock(auto.tick)})`,
      primary: true,
    });
  if (manual)
    choices.push({
      kind: 'load',
      slot: 'manual',
      label: `Gespeichertes Spiel laden (Spielzeit ${formatClock(manual.tick)})`,
      primary: !auto,
    });
  const fresh = choices.length === 0;
  choices.push({ kind: 'new', label: fresh ? "Los geht's" : 'Neue Insel', primary: fresh });
  return { choices, note: STORAGE_NOTES[problem] };
}

const key = (tool: Tool): string => hotkeyLabel(tool) ?? '';
const name = (id: BuildingDefId): string => BUILDING_DEFS[id].name;

export function startGoal(): string {
  return `Ziel: ${WIN_CITIZENS} ${TIERS[3].name} auf deiner Insel`;
}

export function startSteps(): string[] {
  const b = (id: BuildingDefId): string => `${name(id)} (${key({ kind: 'build', defId: id })})`;
  return [
    `1 ${b('house')} nahe dem Kontor bauen — dort ziehen ${TIERS[1].name} ein`,
    `2 ${b('fisher')} am Wasser und ${b('lumberjack')} am Wald bauen`,
    `3 Betriebe mit einem Weg (${key({ kind: 'road' })}) zum Kontor verbinden — Wohnhäuser brauchen keinen Weg`,
  ];
}

/** Esc und Hintergrund: bei offener Bestätigung abbrechen, sonst den primären Knopf wählen (Spec L1). */
export function startDismissAction(confirming: boolean): 'cancel' | 'primary' {
  return confirming ? 'cancel' : 'primary';
}

export interface StartCardOptions {
  mode: 'start' | 'help';
  choices?: StartChoice[];
  note?: string | null;
  hasSlot?: boolean;
  opener?: HTMLElement | null;
  onChoice?: (c: StartChoice) => void;
}

/** Öffnet die Startkarte; die Rückgabe schliesst sie. */
export function openStartCard(host: HTMLElement, o: StartCardOptions): () => void {
  const choices = o.choices ?? [];
  const ref = { primary: null, fresh: null, cancelConfirm: null } as {
    primary: HTMLButtonElement | null;
    fresh: HTMLButtonElement | null;
    cancelConfirm: (() => void) | null;
  };
  const m = openModal({
    host,
    className: 'card--start',
    label: 'Inselreich',
    restoreFocus: o.mode === 'start' ? 'body' : 'opener',
    opener: o.opener,
    onDismiss: () => {
      if (o.mode !== 'start') m.close();
      else if (startDismissAction(ref.cancelConfirm !== null) === 'cancel') ref.cancelConfirm?.();
      else ref.primary?.click();
    },
  });
  const title = Object.assign(document.createElement('h2'), { textContent: 'Inselreich' });
  const goal = Object.assign(document.createElement('p'), { textContent: startGoal() });
  const steps = document.createElement('ol');
  for (const s of startSteps())
    steps.append(Object.assign(document.createElement('li'), { textContent: s }));
  m.card.append(title, goal, steps);

  const btn = (label: string, primary: boolean, onClick: () => void): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = primary ? 'btn btn--primary' : 'btn';
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  };

  if (o.mode === 'help') {
    const more = btn('Weiter spielen', true, () => m.close());
    m.card.append(more);
    more.focus();
    return m.close;
  }

  const row = document.createElement('div');
  row.className = 'start-choices';
  const build = (): void => {
    ref.primary = null;
    ref.fresh = null;
    ref.cancelConfirm = null;
    const buttons = choices.map((c) => {
      const b = btn(c.label, c.primary, () => {
        if (c.kind === 'new' && o.hasSlot) {
          const cancel = (): void => {
            build();
            ref.fresh?.focus();
          };
          ref.cancelConfirm = cancel;
          renderConfirm(row, newIslandPrompt(true), () => o.onChoice?.(c), cancel);
        } else o.onChoice?.(c);
      });
      if (c.primary) ref.primary = b;
      if (c.kind === 'new') ref.fresh = b;
      return b;
    });
    row.replaceChildren(...buttons);
    buttons[choices.findIndex((c) => c.primary)]?.focus();
  };
  m.card.append(row);
  build();
  if (o.note)
    m.card.append(
      Object.assign(document.createElement('p'), { className: 'note', textContent: o.note }),
    );
  return m.close;
}
