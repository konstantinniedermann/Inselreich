import { logLine, type LogEntry } from './crisisLog';

/** Ereignis-Log (M6 13.4): Kopf mit Einklappen, Liste neuester oben; Standard offen. */
export function renderEventLog(box: HTMLElement): void {
  const toggle = document.createElement('button');
  toggle.className = 'btn';
  toggle.dataset.field = 'log-toggle';
  const list = document.createElement('ul');
  list.className = 'event-log';
  list.dataset.field = 'event-log';
  // Standard eingeklappt (R112): nur der neueste Eintrag in einer Zeile
  list.classList.add('event-log--collapsed');
  const sync = (): void => {
    const collapsed = list.classList.contains('event-log--collapsed');
    toggle.textContent = collapsed ? 'Ereignisse ▸' : 'Ereignisse ▾';
    toggle.setAttribute('aria-expanded', String(!collapsed));
  };
  toggle.addEventListener('click', () => {
    toggle.blur();
    list.classList.toggle('event-log--collapsed');
    sync();
  });
  sync();
  box.append(toggle, list);
}

/** Schreibt die Log-Einträge in die Liste; nur bei Änderung. Ohne Einträge ist die Box verborgen. */
export function updateEventLog(box: HTMLElement, entries: readonly LogEntry[]): void {
  box.hidden = entries.length === 0;
  const list = box.querySelector<HTMLElement>('[data-field="event-log"]');
  if (!list) return;
  const key = entries.map(logLine).join('\n');
  if (list.dataset.key === key) return;
  list.dataset.key = key;
  list.replaceChildren(
    ...entries.map((e) => {
      const li = document.createElement('li');
      li.className = 'event-log__item';
      li.textContent = logLine(e);
      return li;
    }),
  );
}
