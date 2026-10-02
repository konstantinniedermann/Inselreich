// Einstellungs-Karte (Spec 9.2) und Credits-Dialog (9.3). Keine Regeln: Werte gehen an `actions`.
import { renderCredits, type CreditEntry } from './credits';
import { openModal } from './modal';
import type { ReduceMotion, Settings } from './settings';

type MixBus = 'master' | 'music' | 'ambience' | 'effects';

export interface SettingsActions {
  settings(): Settings;
  setBus(bus: MixBus, value: number): void;
  setDayNight(on: boolean): void;
  setReduceMotion(m: ReduceMotion): void;
  credits(): CreditEntry[];
}

const BUSES: { bus: MixBus; label: string }[] = [
  { bus: 'master', label: 'Gesamt' },
  { bus: 'music', label: 'Musik' },
  { bus: 'ambience', label: 'Umgebung' },
  { bus: 'effects', label: 'Effekte' },
];
const MOTION: { id: ReduceMotion; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'on', label: 'An' },
  { id: 'off', label: 'Aus' },
];

function button(label: string, onClick: () => void, cls = 'btn'): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = cls;
  b.textContent = label;
  b.addEventListener('click', onClick);
  return b;
}

function row(label: string, control: HTMLElement): HTMLElement {
  const r = document.createElement('div');
  r.className = 'field-row';
  const l = document.createElement('span');
  l.textContent = label;
  r.append(l, control);
  return r;
}

/** Öffnet die Karte in `host`; gibt die Schliessen-Funktion zurück (idempotent). */
export function openSettings(
  host: HTMLElement,
  actions: SettingsActions,
  openedBy?: HTMLElement | null,
): () => void {
  const handle = openModal({
    host,
    className: 'card--settings',
    label: 'Einstellungen',
    opener: openedBy,
  });
  const card = handle.card;
  const close = handle.close;

  const showSettings = (): void => {
    const s = actions.settings();
    const title = document.createElement('h2');
    title.textContent = 'Einstellungen';
    card.replaceChildren(title);
    for (const { bus, label } of BUSES) {
      const r = document.createElement('input');
      r.type = 'range';
      r.className = 'range';
      r.min = '0';
      r.max = '1';
      r.step = '0.05';
      r.value = String(s[bus]);
      r.dataset.bus = bus;
      r.setAttribute('aria-label', `Lautstärke ${label}`);
      r.addEventListener('input', () => actions.setBus(bus, Number(r.value)));
      card.appendChild(row(label, r));
    }
    const dn = button('', () => {
      const on = !actions.settings().dayNight;
      actions.setDayNight(on);
      syncDn(on);
    });
    const syncDn = (on: boolean): void => {
      dn.textContent = on ? 'An' : 'Aus';
      dn.classList.toggle('active', on);
      dn.setAttribute('aria-pressed', String(on));
    };
    syncDn(s.dayNight);
    card.appendChild(row('Tag-Nacht', dn));

    const seg = document.createElement('div');
    seg.className = 'segmented';
    seg.setAttribute('role', 'group');
    seg.setAttribute('aria-label', 'Bewegung reduzieren');
    const segBtns = MOTION.map(({ id, label }) => {
      const b = button(
        label,
        () => {
          actions.setReduceMotion(id);
          syncSeg(id);
        },
        'segmented__btn',
      );
      b.dataset.motion = id;
      return b;
    });
    const syncSeg = (cur: ReduceMotion): void => {
      for (const b of segBtns) {
        const on = b.dataset.motion === cur;
        b.classList.toggle('segmented__btn--active', on);
        b.setAttribute('aria-pressed', String(on));
      }
    };
    syncSeg(s.reduceMotion);
    seg.append(...segBtns);
    card.appendChild(row('Bewegung reduzieren', seg));

    const foot = document.createElement('div');
    foot.className = 'field-row';
    foot.append(button('Credits', showCredits), button('Schliessen', close));
    card.appendChild(foot);
  };

  const showCredits = (): void => {
    const title = document.createElement('h2');
    title.textContent = 'Credits';
    card.classList.add('card--credits');
    card.replaceChildren(
      title,
      renderCredits(document, actions.credits()),
      button('Zurück', () => {
        card.classList.remove('card--credits');
        showSettings();
      }),
    );
  };

  showSettings();
  card.querySelector<HTMLElement>('input, button')?.focus();
  return close;
}
