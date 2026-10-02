let box: HTMLElement | null = null;
let lastText = '';
let lastAt = -Infinity;

/** Höchstzahl sichtbarer Meldungen. */
const MAX_TOASTS = 3;
/** Gleiche Meldung innerhalb dieses Fensters wird nicht erneut gezeigt (Millisekunden). */
const DEDUPE_MS = 1000;

/** Legt den Meldungsbereich an; die Rückgabe entfernt ihn wieder (beim Neustart). */
export function bindMessages(container: HTMLElement): () => void {
  const el = document.createElement('div');
  el.className = 'messages';
  container.appendChild(el);
  box = el;
  lastText = '';
  lastAt = -Infinity;
  return () => {
    el.remove();
    if (box === el) box = null;
  };
}

/**
 * Zeigt eine Meldung. Höchstens MAX_TOASTS sichtbar: beim vierten fällt die älteste nicht-sticky
 * Meldung raus. Sticky Meldungen zählen mit, werden aber nie verdrängt; sind alle sticky, bleibt
 * die neue trotzdem sichtbar (der Stapel wächst dann über das Limit).
 */
export function showMessage(
  text: string,
  kind: 'info' | 'error' | 'warn' = 'info',
  sticky = false,
  closable = false,
): void {
  if (!box) return;
  const now = performance.now();
  if (text === lastText && now - lastAt < DEDUPE_MS) return;
  lastText = text;
  lastAt = now;
  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.textContent = text;
  if (sticky) toast.dataset.sticky = '1';
  if (closable) {
    toast.dataset.closable = '1';
    toast.title = 'Klicken zum Schliessen';
    toast.classList.add('toast--closable');
    toast.addEventListener('click', () => toast.remove());
  }
  box.appendChild(toast);
  if (!sticky) setTimeout(() => toast.remove(), 3000);
  if (box.children.length > MAX_TOASTS) {
    const oldest = Array.from(box.children).find(
      (c) => c !== toast && !(c as HTMLElement).dataset.sticky,
    );
    oldest?.remove();
  }
}

/** Entfernt den jüngsten schliessbaren Toast; wahr, wenn einer da war (Esc schliesst zuerst ihn). */
export function closeClosableToast(): boolean {
  if (!box) return false;
  const all = box.querySelectorAll<HTMLElement>('[data-closable="1"]');
  const last = all[all.length - 1];
  if (!last) return false;
  last.remove();
  return true;
}
