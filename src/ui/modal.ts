// Gemeinsame Modalkarten: ein Stapel, ein Tasten-Listener (Capture), Fokusfalle (Spec L2).
// Keine Regeln: nur Darstellung und Bedienung.

export interface ModalOptions {
  host: HTMLElement;
  className: string;
  label: string;
  /** Auslösender Knopf; bekommt beim Schliessen den Fokus zurück. */
  opener?: HTMLElement | null;
  /** Esc und Klick auf den Hintergrund; ohne Angabe schliesst die Karte. */
  onDismiss?: () => void;
  restoreFocus?: 'opener' | 'body';
}

export interface ModalHandle {
  card: HTMLElement;
  close(): void;
}

/** Ein Eintrag im Karten-Stapel; nur der oberste bekommt Tasten. */
interface Entry {
  card: HTMLElement;
  close(): void;
  dismiss(): void;
}

const stack: Entry[] = [];

/**
 * Element, das beim Schliessen den Fokus zurückbekommt: der auslösende Knopf, sonst das aktive Element.
 * Der Knopf wird ausdrücklich übergeben, weil er vor dem Öffnen den Fokus abgibt (`blur`), das aktive
 * Element dann also nur noch der `body` wäre.
 */
export function pickOpener<T>(explicit: T | null | undefined, active: T | null): T | null {
  return explicit ?? active;
}

/**
 * Der Hintergrund schliesst nur, wenn Druck, Loslassen und Klick-Ziel alle auf ihm lagen. Beim Ziehen vom
 * Hintergrund in den Dialog (oder umgekehrt) meldet `click` den gemeinsamen Vorfahren, also den Hintergrund;
 * deshalb zählt das `pointerup`-Ziel mit.
 */
export function shouldCloseOnClick(
  downOnBackdrop: boolean,
  upOnBackdrop: boolean,
  clickOnBackdrop: boolean,
): boolean {
  return downOnBackdrop && upOnBackdrop && clickOnBackdrop;
}

/** Nächster Fokusindex der Falle (zyklisch); -1 bei keinem Bedienelement. */
export function nextFocusIndex(count: number, current: number, back: boolean): number {
  if (count === 0) return -1;
  if (current < 0) return back ? count - 1 : 0;
  return (current + (back ? -1 : 1) + count) % count;
}

/** Stapel nach Esc: nur die oberste Karte fällt weg. */
export function modalStackAfterEscape<T>(s: readonly T[]): T[] {
  return s.slice(0, -1);
}

export function isModalOpen(): boolean {
  return stack.length > 0;
}

export function closeAllModals(): void {
  while (stack.length > 0) stack[stack.length - 1]!.close();
}

function focusables(card: HTMLElement): HTMLElement[] {
  return Array.from(
    card.querySelectorAll<HTMLElement>(
      'button, input, select, textarea, summary, [href], [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled') && !el.closest('[hidden]'));
}

function onKey(e: KeyboardEvent): void {
  const top = stack[stack.length - 1];
  if (!top) return;
  e.stopImmediatePropagation(); // Spiel-Hotkeys, WASD, Pfeile, Leertaste-Ziehen ruhen (Spec L2)
  if (e.key === 'Escape') {
    e.preventDefault();
    // RF-1: nur die Einträge, die im Stapel nach Esc fehlen (die oberste Karte), werden geschlossen
    const remaining = modalStackAfterEscape(stack);
    for (const entry of stack.filter((x) => !remaining.includes(x))) entry.dismiss();
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const f = focusables(top.card);
    const i = nextFocusIndex(
      f.length,
      f.indexOf(document.activeElement as HTMLElement),
      e.shiftKey,
    );
    f[i]?.focus();
  }
  // Enter, Leertaste, Pfeile am Regler: Browser-Standard (kein preventDefault)
}

export function openModal(o: ModalOptions): ModalHandle {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  const card = document.createElement('div');
  card.className = `card card--modal ${o.className}`;
  card.setAttribute('role', 'dialog');
  card.setAttribute('aria-modal', 'true');
  card.setAttribute('aria-label', o.label);
  backdrop.appendChild(card);
  const opener = pickOpener(o.opener, document.activeElement as HTMLElement | null);
  let closed = false;
  const entry: Entry = {
    card,
    close: () => {
      if (closed) return;
      closed = true;
      stack.splice(stack.indexOf(entry), 1);
      if (stack.length === 0) window.removeEventListener('keydown', onKey, true);
      backdrop.remove();
      if (o.restoreFocus === 'body') (document.activeElement as HTMLElement | null)?.blur?.();
      else opener?.focus?.();
    },
    dismiss: () => (o.onDismiss ?? entry.close)(),
  };
  // Auf click statt pointerdown: sonst nimmt das folgende mousedown dem Knopf den Fokus wieder
  let downOnBackdrop = false;
  let upOnBackdrop = false;
  backdrop.addEventListener('pointerdown', (e) => {
    downOnBackdrop = e.target === backdrop;
    upOnBackdrop = false;
  });
  backdrop.addEventListener('pointerup', (e) => {
    upOnBackdrop = e.target === backdrop;
  });
  backdrop.addEventListener('click', (e) => {
    const down = downOnBackdrop;
    const up = upOnBackdrop;
    downOnBackdrop = false;
    upOnBackdrop = false;
    if (shouldCloseOnClick(down, up, e.target === backdrop)) entry.dismiss();
  });
  if (stack.length === 0) window.addEventListener('keydown', onKey, true);
  stack.push(entry);
  o.host.appendChild(backdrop);
  return { card, close: entry.close };
}

/** Bestätigungszeile (eine Form im ganzen Spiel, kein Zeitlimit; Spec L1). */
export function renderConfirm(
  parent: HTMLElement,
  prompt: string,
  onYes: () => void,
  onCancel: () => void,
): void {
  const row = document.createElement('div');
  row.className = 'confirm-row';
  const text = document.createElement('p');
  text.textContent = prompt;
  const yes = document.createElement('button');
  yes.className = 'btn';
  yes.textContent = 'Ja, neue Insel';
  yes.addEventListener('click', onYes);
  const no = document.createElement('button');
  no.className = 'btn';
  no.textContent = 'Abbrechen';
  no.addEventListener('click', onCancel);
  row.append(text, yes, no);
  parent.replaceChildren(row);
  yes.focus();
}
