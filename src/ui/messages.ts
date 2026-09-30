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
export function showMessage(text: string, kind: 'info' | 'error' = 'info', sticky = false): void {
  if (!box) return;
  const now = performance.now();
  if (text === lastText && now - lastAt < DEDUPE_MS) return;
  lastText = text;
  lastAt = now;
  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.textContent = text;
  if (sticky) toast.dataset.sticky = '1';
  box.appendChild(toast);
  if (!sticky) setTimeout(() => toast.remove(), 3000);
  if (box.children.length > MAX_TOASTS) {
    const oldest = Array.from(box.children).find(
      (c) => c !== toast && !(c as HTMLElement).dataset.sticky,
    );
    oldest?.remove();
  }
}
