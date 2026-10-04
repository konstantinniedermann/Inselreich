import { logLine, type LogEntry } from './crisisLog';
import type { LogTarget } from './logTarget';

/** Ereignis-Log (M6 13.4): Kopf mit Einklappen, Liste neuester oben; Standard eingeklappt (R112). */
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

/**
 * Schreibt die Log-Einträge in die Liste; nur bei Änderung. Ohne Einträge oder vor der ersten Krisenperiode
 * (`visible` false, Spec 11.10) ist die Box verborgen.
 */
export function updateEventLog(
  box: HTMLElement,
  entries: readonly LogEntry[],
  visible = true,
  onTarget?: (target: LogTarget) => void,
): void {
  box.hidden = !visible || entries.length === 0;
  const list = box.querySelector<HTMLElement>('[data-field="event-log"]');
  if (!list) return;
  // Ort gehört in den Schlüssel, sonst ginge die Klickbarkeit beim Cachen verloren
  const key = entries
    .map((e) =>
      e.target ? `${logLine(e)}@${e.target.id}:${e.target.x},${e.target.y}` : logLine(e),
    )
    .join('\n');
  if (list.dataset.key === key) return;
  list.dataset.key = key;
  list.replaceChildren(
    ...entries.map((e) => {
      const li = document.createElement('li');
      li.className = 'event-log__item';
      const target = e.target;
      if (target && onTarget) {
        // Mit Ort: echter Button im li, per Tastatur erreichbar
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'event-log__link';
        btn.textContent = logLine(e);
        btn.title = 'Auf der Karte zeigen';
        btn.addEventListener('click', () => onTarget(target));
        li.appendChild(btn);
      } else li.textContent = logLine(e);
      return li;
    }),
  );
}
