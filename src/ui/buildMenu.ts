import { BUILDING_DEFS, BUILDING_IDS, ROAD_COST, ROAD_COST_OBJ } from '../sim/defs/buildings';
import { checkAfford } from '../sim/economy';
import type { Category, Cost, World } from '../sim/types';
import type { Tool } from '../render/renderer';
import type { GameState } from './app';
import { costLine } from './dom';
import { showMessage } from './messages';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'infrastructure', label: 'Infrastruktur' },
  { id: 'housing', label: 'Wohnen' },
  { id: 'production', label: 'Produktion' },
  { id: 'public', label: 'Öffentlich' },
];

function isActive(current: Tool, tool: Tool): boolean {
  if (current.kind !== tool.kind) return false;
  return current.kind !== 'build' || (tool.kind === 'build' && current.defId === tool.defId);
}

/** Merkt sich die Kosten je Bau-Button für die Leistbarkeitsprüfung. */
const buttonCost = new WeakMap<HTMLButtonElement, Cost>();

/** Baut die Bauleiste neu auf; `onSelect` wird mit dem gewählten Werkzeug aufgerufen. */
export function renderBuildMenu(
  nav: HTMLElement,
  state: GameState,
  onSelect: (tool: Tool) => void,
): void {
  nav.replaceChildren();
  const addButton = (
    parent: HTMLElement,
    label: string,
    tool: Tool,
    sub?: string,
    cost?: Cost,
  ): void => {
    const btn = document.createElement('button');
    if (cost) buttonCost.set(btn, cost);
    btn.className = 'btn' + (isActive(state.tool, tool) ? ' active' : '');
    btn.textContent = label;
    if (sub) {
      const small = document.createElement('small');
      small.textContent = sub;
      btn.appendChild(small);
    }
    btn.addEventListener('click', () => {
      btn.blur();
      onSelect(tool);
      // Werkzeug bleibt wählbar; der Grund erscheint sofort, auch ohne Tooltip (Touch)
      const afford = cost ? checkAfford(state.world, cost) : null;
      if (afford && !afford.ok) showMessage(afford.reason, 'error');
    });
    parent.appendChild(btn);
  };

  const basics = document.createElement('div');
  basics.className = 'buildbar-group';
  addButton(basics, 'Auswahl', { kind: 'select' });
  addButton(basics, `Weg (${ROAD_COST})`, { kind: 'road' }, undefined, ROAD_COST_OBJ);
  addButton(basics, 'Abriss', { kind: 'demolish' });
  nav.appendChild(basics);

  for (const cat of CATEGORIES) {
    const ids = BUILDING_IDS.filter(
      (id) => id !== 'kontor' && BUILDING_DEFS[id].category === cat.id,
    );
    if (ids.length === 0) continue;
    const group = document.createElement('div');
    group.className = 'buildbar-group';
    const heading = document.createElement('h3');
    heading.textContent = cat.label;
    group.appendChild(heading);
    for (const id of ids) {
      const def = BUILDING_DEFS[id];
      addButton(group, def.name, { kind: 'build', defId: id }, costLine(def.cost), def.cost);
    }
    nav.appendChild(group);
  }
  updateBuildMenu(nav, state.world);
}

/** Markiert Bau-Buttons, deren Kosten gerade nicht bezahlbar sind (bleiben klickbar). */
export function updateBuildMenu(nav: HTMLElement, world: World): void {
  for (const btn of nav.querySelectorAll<HTMLButtonElement>('button')) {
    const cost = buttonCost.get(btn);
    if (!cost) continue;
    const r = checkAfford(world, cost);
    btn.classList.toggle('unaffordable', !r.ok);
    const title = r.ok ? '' : r.reason;
    if (btn.title !== title) btn.title = title;
  }
}
