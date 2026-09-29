let box: HTMLElement | null = null;

export function bindMessages(container: HTMLElement): void {
  box = document.createElement('div');
  box.className = 'messages';
  container.appendChild(box);
}

export function showMessage(text: string, kind: 'info' | 'error' = 'info', sticky = false): void {
  if (!box) return;
  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.textContent = text;
  box.appendChild(toast);
  if (!sticky) setTimeout(() => toast.remove(), 3000);
}
