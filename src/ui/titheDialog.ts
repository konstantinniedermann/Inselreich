// titheDialog.ts — DOM, nur Darstellung: Bestätigung beim Einschalten des Zehnts (I-223). Keine Regeln.
import { openModal } from './modal';

/** Zeigt die Zeilen und die Knöpfe «Zehnt einschalten» / «Abbrechen»; Esc und Hintergrund = Abbrechen. */
export function openTitheConfirm(
  host: HTMLElement,
  lines: string[],
  opener: HTMLElement | null,
  onYes: () => void,
): void {
  const handle = openModal({
    host,
    className: 'card--tithe',
    label: 'Zehnt einschalten',
    opener,
  });
  const title = document.createElement('h2');
  title.textContent = 'Zehnt einschalten?';
  handle.card.append(title);
  for (const text of lines) {
    const p = document.createElement('p');
    p.textContent = text;
    handle.card.append(p);
  }
  const row = document.createElement('div');
  row.className = 'tithe-confirm-row';
  const yes = document.createElement('button');
  yes.type = 'button';
  yes.className = 'btn';
  yes.textContent = 'Zehnt einschalten';
  yes.addEventListener('click', () => {
    handle.close();
    onYes();
  });
  const no = document.createElement('button');
  no.type = 'button';
  no.className = 'btn';
  no.textContent = 'Abbrechen';
  no.addEventListener('click', () => handle.close());
  row.append(yes, no);
  handle.card.append(row);
  no.focus();
}
