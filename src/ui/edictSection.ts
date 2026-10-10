// edictSection.ts — DOM: Abschnitt «Edikt» im Amtsstuben-Panel (M13-E1, Spec 7.2).
// Knoten werden einmal gebaut; update schreibt nur geänderte Werte (Fokus bleibt).
import { EDICTS, EDICT_COST, EDICT_IDS } from '../sim/defs/edicts';
import type { EdictId, World } from '../sim/types';
import {
  edictCardState,
  edictEffectText,
  edictLockText,
  edictStatusLine,
  edictWhenText,
} from './edictView';
import { friendlyReason } from './hints';

const NOT_YET = 'Erst nach dem Bürger-Ziel';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text) e.textContent = text;
  return e;
}

/** Baut den Abschnitt; `onPick(id)` mit null hebt auf. */
export function buildEdictSection(onPick: (id: EdictId | null) => void): HTMLElement {
  const root = el('div', 'edict-section');
  root.dataset.field = 'edict';
  root.append(el('h3', '', 'Edikt'));
  const status = el('p', 'panel-line');
  status.dataset.field = 'edict-status';
  const lock = el('p', 'panel-line tax-lock');
  lock.dataset.field = 'edict-lock';
  lock.hidden = true;
  root.append(status, lock);
  const cards = el('div', 'edict-cards');
  for (const id of EDICT_IDS) {
    const card = el('div', 'edict-card');
    card.dataset.edict = id;
    const btn = el('button', 'btn');
    btn.type = 'button';
    btn.dataset.edictBtn = id;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      btn.blur();
      onPick(card.classList.contains('active') ? null : id);
    });
    card.append(
      el('strong', 'edict-name', EDICTS[id].name),
      el('span', 'edict-effect', edictEffectText(id)),
      el('small', 'edict-when', edictWhenText(id)),
      btn,
    );
    cards.append(card);
  }
  root.append(cards);
  return root;
}

function setText(e: HTMLElement, text: string): void {
  if (e.textContent !== text) e.textContent = text;
}

export function updateEdictSection(root: HTMLElement, w: World): void {
  const status = root.querySelector<HTMLElement>('[data-field="edict-status"]');
  const lock = root.querySelector<HTMLElement>('[data-field="edict-lock"]');
  const unlocked = edictCardState(w, EDICT_IDS[0]!).reason !== NOT_YET;
  if (status) setText(status, unlocked ? edictStatusLine(w) : NOT_YET);
  if (lock) {
    const text = unlocked ? edictLockText(w) : '';
    if (lock.hidden !== (text === '')) lock.hidden = text === '';
    setText(lock, text);
  }
  for (const id of EDICT_IDS) {
    const card = root.querySelector<HTMLElement>(`[data-edict="${id}"]`);
    const btn = root.querySelector<HTMLButtonElement>(`[data-edict-btn="${id}"]`);
    if (!card || !btn) continue;
    const s = edictCardState(w, id);
    const poor = s.reason === 'Zu wenig Geld';
    card.classList.toggle('active', s.active);
    card.classList.toggle('locked', !unlocked);
    btn.classList.toggle('unaffordable', poor);
    setText(btn, s.buttonText);
    const pressed = String(s.active);
    if (btn.getAttribute('aria-pressed') !== pressed) btn.setAttribute('aria-pressed', pressed);
    if (btn.disabled !== s.disabled) btn.disabled = s.disabled;
    const tip =
      s.reason === null
        ? ''
        : friendlyReason(w, s.reason, { cost: { money: EDICT_COST, wood: 0, tools: 0, stone: 0 } });
    if (btn.title !== tip) btn.title = tip;
  }
}
