let box: HTMLElement | null = null;

/** Legt den Meldungsbereich an; die Rückgabe entfernt ihn wieder (beim Neustart). */
export function bindMessages(container: HTMLElement): () => void {
  const el = document.createElement('div');
  el.className = 'messages';
  container.appendChild(el);
  box = el;
  return () => {
    el.remove();
    if (box === el) box = null;
  };
}

export function showMessage(text: string, kind: 'info' | 'error' = 'info', sticky = false): void {
  if (!box) return;
  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.textContent = text;
  box.appendChild(toast);
  if (!sticky) setTimeout(() => toast.remove(), 3000);
}
