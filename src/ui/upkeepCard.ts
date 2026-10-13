// upkeepCard.ts — Karte «Unterhalt je Betrieb» (I-062). Nur Darstellung und Bedienung; die Zahlen liefert
// `upkeepSummary` (Sim-Werte, kein zweiter Rechenweg).
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { UPKEEP_INTERVAL } from '../sim/economy';
import { islandName } from '../sim/islands';
import { functionLock } from '../sim/unlocks';
import type { World } from '../sim/types';
import { openModal, type ModalHandle } from './modal';
import { upkeepSummary, type UpkeepRow } from './upkeepRank';
import { perMinute, signedNum } from './time';

export const UPKEEP_EMPTY_TEXT = 'Noch keine Betriebe mit Unterhalt.';

const pm = (x: number): number => perMinute(x, UPKEEP_INTERVAL);

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  text = '',
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  e.className = className;
  if (text !== '') e.textContent = text;
  return e;
}

/** Inselname nur mit Seefahrt (wie der Lager-Präfix); sonst gibt es nur eine Insel. */
const islandLabel = (world: World, island: number): string | null =>
  functionLock(world, 'seafaring') === null ? islandName(world, island) : null;

/** Teile einer Zeile: Name, Insel, Wert, Auslastung, Marke. */
function rowParts(world: World, r: UpkeepRow): { label: string; cells: string[] } {
  const name = BUILDING_DEFS[r.defId].name;
  const isl = islandLabel(world, r.island);
  const value = `${pm(r.upkeep)} / min`;
  const util = r.util === null ? null : `Auslastung ${Math.floor(r.util / 10)} %`;
  const cells = [name, isl, value, util, r.paused ? 'stillgelegt' : null].filter(
    (c): c is string => c !== null,
  );
  const spoken = [
    name,
    isl,
    `Unterhalt ${pm(r.upkeep)} pro Minute`,
    util,
    r.paused ? 'stillgelegt' : null,
  ]
    .filter((c): c is string => c !== null)
    .join(', ');
  return { label: `${spoken}. Springt zum Gebäude`, cells };
}

/** Inhalt der Karte; `onJump` bekommt die Gebäude-ID. Rein DOM-seitig, ohne Modal-Rahmen (testbar). */
export function renderUpkeepList(world: World, onJump: (id: number) => void): HTMLElement {
  const s = upkeepSummary(world);
  const root = el('div', 'upkeep-list');
  if (s.shown.length === 0 && s.ships === null) {
    root.appendChild(el('p', 'note', UPKEEP_EMPTY_TEXT));
  }
  const list = el('ul', 'upkeep-rows');
  for (const r of s.shown) {
    const li = document.createElement('li');
    const btn = el('button', 'upkeep-row');
    btn.type = 'button';
    btn.dataset.building = String(r.id);
    const { label, cells } = rowParts(world, r);
    btn.setAttribute('aria-label', label);
    for (const c of cells) btn.appendChild(el('span', 'upkeep-cell', c));
    btn.addEventListener('click', () => onJump(r.id));
    li.appendChild(btn);
    list.appendChild(li);
  }
  const extra = (part: string, text: string): void => {
    const li = el('li', 'upkeep-extra', text);
    li.dataset.part = part;
    list.appendChild(li);
  };
  if (s.more > 0) extra('more', `und ${s.more} weitere (${pm(s.moreUpkeep)} / min)`);
  if (s.ships) extra('ships', `Schiffe ×${s.ships.count} · ${pm(s.ships.upkeep)} / min`);
  if (s.edict !== 0) extra('edict', `Edikt: ${signedNum(-pm(-s.edict))} / min`);
  root.appendChild(list);
  const foot = el('p', 'upkeep-total', `Unterhalt −${pm(s.total)} / min`);
  foot.dataset.part = 'total';
  root.appendChild(foot);
  return root;
}

/** Öffnet die Karte; Klick auf eine Zeile schliesst sie und springt zum Gebäude. Esc schliesst. */
export function openUpkeepCard(
  host: HTMLElement,
  world: World,
  onJump: (id: number) => void,
  opener?: HTMLElement | null,
): ModalHandle {
  const handle = openModal({
    host,
    className: 'card--upkeep',
    label: 'Unterhalt je Betrieb',
    opener,
  });
  const title = el('h2', '', 'Unterhalt je Betrieb');
  const list = renderUpkeepList(world, (id) => {
    handle.close();
    onJump(id);
  });
  const close = el('button', 'btn', 'Schliessen');
  close.type = 'button';
  close.addEventListener('click', () => handle.close());
  handle.card.append(title, list, close);
  (list.querySelector<HTMLElement>('.upkeep-row') ?? close).focus();
  return handle;
}
