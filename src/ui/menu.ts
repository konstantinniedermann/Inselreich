// Menü-Karte (Spec L2): Speichern, Laden, Neue Insel, Karte, Hilfe, Tastenkürzel. Keine Regeln.
import { CRISIS_LEVELS } from '../sim/defs/crises';
import type { CrisisLevel } from '../sim/types';
import { openModal, renderConfirm } from './modal';
import { CRISIS_LEVEL_IDS, UNLOCK_MODE_IDS, type UnlockMode } from './settings';
import type { SaveInfo, Slot } from './storage';
import { formatClock } from './time';

export const NO_SAVE_TEXT = 'Noch kein Spielstand gespeichert';
/** Beschriftung der Freischalt-Auswahl für „Neue Insel“ (Spec 10). */
export const UNLOCK_MODE_LABELS: Readonly<Record<UnlockMode, string>> = {
  stepwise: 'Schritt für Schritt (empfohlen)',
  all: 'Alles frei',
};

export const UNSAVED_WARNING = 'Ungespeicherter Fortschritt geht verloren';

/** Beschriftung eines Speicherplatzes in der Laden-Liste. */
export function slotLabel(info: SaveInfo): string {
  return `${info.slot === 'auto' ? 'Autosave' : 'Gespeichert'} — Spielzeit ${formatClock(info.tick)}`;
}

/** Bestätigungstext für „Neue Insel" (P-3): ohne Autosave der Hinweis auf die laufende Insel. */
export function newIslandPrompt(hasAutosave: boolean): string {
  return hasAutosave
    ? 'Neue Insel beginnen? Der bisherige Autosave wird beim nächsten Speichern ersetzt.'
    : 'Neue Insel beginnen? Die laufende Insel ist nicht gespeichert und geht verloren.';
}

export interface MenuActions {
  save(): void;
  listSaves(): SaveInfo[];
  storageNote(): string | null;
  hasProgress(): boolean;
  load(slot: Slot): void;
  crisisLevel(): CrisisLevel;
  unlockMode(): UnlockMode;
  newIsland(level: CrisisLevel, unlockMode: UnlockMode): void;
  /** Tastenliste für das Menü (nur Freigeschaltetes, `hotkeyList(world)`). */
  hotkeys(): { key: string; label: string }[];
  seed(): number;
  openGuide(opener: HTMLElement): void;
}

export function openMenu(host: HTMLElement, a: MenuActions, opener: HTMLElement): () => void {
  const m = openModal({ host, className: 'card--menu', label: 'Menü', opener });
  const h = (text: string): HTMLElement => {
    const el = document.createElement('h3');
    el.textContent = text;
    return el;
  };
  const btn = (label: string, onClick: (b: HTMLButtonElement) => void): HTMLButtonElement => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn';
    b.textContent = label;
    b.addEventListener('click', () => onClick(b));
    return b;
  };
  const title = document.createElement('h2');
  title.textContent = 'Menü';
  // Speichern
  const save = btn('Speichern', () => a.save());
  // Laden: Slot-Liste, ein Klick lädt (pausiert, Task 4)
  const loadBox = document.createElement('div');
  const saves = a.listSaves();
  if (saves.length > 0 && a.hasProgress())
    loadBox.append(Object.assign(document.createElement('p'), { textContent: UNSAVED_WARNING }));
  if (saves.length === 0)
    loadBox.append(Object.assign(document.createElement('p'), { textContent: NO_SAVE_TEXT }));
  for (const s of saves) loadBox.append(btn(slotLabel(s), () => a.load(s.slot)));
  const note = a.storageNote();
  if (note)
    loadBox.append(
      Object.assign(document.createElement('p'), { className: 'note', textContent: note }),
    );
  // Neue Insel: Krisen-Auswahl für diese Insel, Bestätigung immer (P-3)
  const newBox = document.createElement('div');
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Krisen für die neue Insel');
  for (const id of CRISIS_LEVEL_IDS) select.append(new Option(CRISIS_LEVELS[id].name, id));
  select.value = a.crisisLevel();
  const unlockSelect = document.createElement('select');
  unlockSelect.setAttribute('aria-label', 'Freischaltung für die neue Insel');
  for (const id of UNLOCK_MODE_IDS) unlockSelect.append(new Option(UNLOCK_MODE_LABELS[id], id));
  unlockSelect.value = a.unlockMode();
  const newRow = document.createElement('div');
  const showNew = (): void => {
    const start = btn('Neue Insel', () =>
      renderConfirm(
        newRow,
        newIslandPrompt(a.listSaves().some((s) => s.slot === 'auto')),
        () => a.newIsland(select.value as CrisisLevel, unlockSelect.value as UnlockMode),
        () => {
          showNew();
          newRow.querySelector('button')?.focus();
        },
      ),
    );
    newRow.replaceChildren(start);
  };
  showNew();
  const crisisLabel = document.createElement('label');
  crisisLabel.append('Krisen: ', select);
  const unlockLabel = document.createElement('label');
  unlockLabel.append('Freischaltung: ', unlockSelect);
  newBox.append(crisisLabel, unlockLabel, newRow);
  // Karte, Hilfe, Tastenkürzel, Schliessen
  const seed = Object.assign(document.createElement('p'), { textContent: `Karte ${a.seed()}` });
  const guide = btn('Ziel und erste Schritte', (b) => a.openGuide(b));
  const keys = document.createElement('ul');
  keys.className = 'hotkey-list';
  for (const k of a.hotkeys())
    keys.append(
      Object.assign(document.createElement('li'), { textContent: `${k.key} ${k.label}` }),
    );
  const close = btn('Schliessen', () => m.close());
  m.card.append(
    title,
    save,
    h('Laden'),
    loadBox,
    h('Neue Insel'),
    newBox,
    seed,
    guide,
    h('Tastenkürzel'),
    keys,
    close,
  );
  close.focus(); // Spec L2: Fokus beim Öffnen auf „Schliessen"
  return m.close;
}
