import { BUILDING_DEFS, BUILDING_IDS, ROAD_COST } from '../sim/defs/buildings';
import type { Category, Cost } from '../sim/types';
import type { Tool } from '../render/renderer';
import type { GameState } from './app';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'infrastructure', label: 'Infrastruktur' },
  { id: 'housing', label: 'Wohnen' },
  { id: 'production', label: 'Produktion' },
  { id: 'public', label: 'Öffentlich' },
];

function costLine(c: Cost): string {
  const parts = [`G ${c.money}`];
  if (c.wood) parts.push(`H ${c.wood}`);
  if (c.tools) parts.push(`W ${c.tools}`);
  if (c.stone) parts.push(`S ${c.stone}`);
  return parts.join(' · ');
}

function isActive(current: Tool, tool: Tool): boolean {
  if (current.kind !== tool.kind) return false;
  return current.kind !== 'build' || (tool.kind === 'build' && current.defId === tool.defId);
}

/** Baut die Bauleiste neu auf; `onSelect` wird mit dem gewählten Werkzeug aufgerufen. */
export function renderBuildMenu(
  nav: HTMLElement,
  state: GameState,
  onSelect: (tool: Tool) => void,
): void {
  nav.replaceChildren();
  const addButton = (parent: HTMLElement, label: string, tool: Tool, sub?: string): void => {
    const btn = document.createElement('button');
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
    });
    parent.appendChild(btn);
  };

  const basics = document.createElement('div');
  basics.className = 'buildbar-group';
  addButton(basics, 'Auswahl', { kind: 'select' });
  addButton(basics, `Weg (${ROAD_COST})`, { kind: 'road' });
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
      addButton(group, def.name, { kind: 'build', defId: id }, costLine(def.cost));
    }
    nav.appendChild(group);
  }
}
