import { BUILDING_DEFS, BUILDING_IDS } from '../sim/defs/buildings';
import { GOODS, GOOD_IDS } from '../sim/defs/goods';
import { iconSvg, type IconId } from './icons';

let box: HTMLElement | null = null;
let lastText = '';
let lastAt = -Infinity;

/** Höchstzahl sichtbarer Meldungen. */
const MAX_TOASTS = 3;
/** Gleiche Meldung innerhalb dieses Fensters wird nicht erneut gezeigt (Millisekunden). */
const DEDUPE_MS = 1000;

/**
 * Symbol auf dunklem Chip (`--wood`), reiner Schmuck (`aria-hidden`). Symbole stehen nie direkt auf Pergament
 * (R181): in hellen Karten und Meldungen sitzt der Chip dazwischen.
 */
export function iconChip(id: IconId): HTMLElement {
  const chip = document.createElement('span');
  chip.className = 'icon-chip';
  chip.dataset.icon = id;
  chip.setAttribute('aria-hidden', 'true');
  chip.innerHTML = iconSvg(id);
  return chip;
}

/** Namen (Gebäude, Güter) mit ihrem Symbol; längste zuerst, damit „Steinbruch" vor „Stein" greift. */
const NAME_ICONS: ReadonlyMap<string, IconId> = new Map([
  ...BUILDING_IDS.map((id): [string, IconId] => [
    BUILDING_DEFS[id].name,
    `cat-${BUILDING_DEFS[id].category}`,
  ]),
  ...GOOD_IDS.map((g): [string, IconId] => [GOODS[g].name, g]),
]);
const NAME_PATTERN = new RegExp(
  `(?<![\\p{L}])(${[...NAME_ICONS.keys()]
    .sort((a, b) => b.length - a.length)
    .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')})(?![\\p{L}])`,
  'gu',
);

export interface NameSegment {
  text: string;
  /** Symbol, das vor `text` steht; fehlt bei Fliesstext. */
  icon?: IconId;
}

/** Zerlegt einen Text so, dass die Stücke zusammengesetzt den Text ergeben; Namen tragen ihr Symbol. */
export function nameSegments(text: string): NameSegment[] {
  const out: NameSegment[] = [];
  let at = 0;
  for (const m of text.matchAll(NAME_PATTERN)) {
    if (m.index > at) out.push({ text: text.slice(at, m.index) });
    out.push({ text: m[0], icon: NAME_ICONS.get(m[0])! });
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push({ text: text.slice(at) });
  return out;
}

/** DOM-Knoten zu `nameSegments`: Symbol-Chip (ohne Text) vor jedem Namen, `textContent` unverändert. */
export function decorateNames(text: string): Node[] {
  return nameSegments(text).flatMap((s) =>
    s.icon === undefined
      ? [document.createTextNode(s.text)]
      : [iconChip(s.icon), document.createTextNode(s.text)],
  );
}

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
  action?: { label: string; onClick: () => void },
): void {
  if (!box) return;
  const now = performance.now();
  if (text === lastText && now - lastAt < DEDUPE_MS) return;
  lastText = text;
  lastAt = now;
  const toast = document.createElement('div');
  toast.className = `toast ${kind}`;
  toast.append(...decorateNames(text));
  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-small toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', (ev) => {
      ev.stopPropagation(); // der Toast schliesst sich nicht über seinen eigenen Klick-Handler
      action.onClick();
    });
    toast.appendChild(btn);
  }
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
