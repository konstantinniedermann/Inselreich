let box: HTMLElement | null = null;

export function bindMessages(container: HTMLElement): void {
  box = document.createElement('div');
  box.className = 'messages';
  container.appendChild(box);
}

export function showMessage(text: string, kind: 'info' | 'error' = 'info'): void {
  if (!box) return;
  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.textContent = text;
  box.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}
