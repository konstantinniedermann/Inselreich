import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, STORAGE_CAP } from '../sim/defs/goods';
import { TIERS } from '../sim/defs/tiers';
import { UPKEEP_INTERVAL, refundCost } from '../sim/economy';
import type { Building, World } from '../sim/types';
import { costLine } from './buildMenu';

export interface InspectActions {
  demolish(id: number): void;
  openTrade(): void;
}

/** Setzt den Text eines `data-field`-Elements, nur wenn er sich geändert hat. */
export function setField(root: HTMLElement, field: string, text: string): HTMLElement | null {
  const el = root.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (el && el.textContent !== text) el.textContent = text;
  return el;
}

function stateInfo(b: Building): { text: string; ok: boolean } {
  const def = BUILDING_DEFS[b.defId];
  // Anbindung zuerst: `state` wird erst im nächsten Tick nachgeführt (z. B. bei Pause)
  if (!b.connected) return { text: 'Nicht an Kontor angebunden', ok: false };
  if (!def.produces) return { text: 'Angebunden', ok: true };
  switch (b.state) {
    case 'ok':
      return { text: 'In Betrieb', ok: true };
    case 'waitingInput':
      return {
        text: `Wartet auf ${def.consumes ? GOODS[def.consumes].name : 'Rohstoff'}`,
        ok: false,
      };
    case 'storageFull':
      return { text: 'Lager voll', ok: false };
    case 'notConnected':
      return { text: 'Nicht an Kontor angebunden', ok: false };
  }
}

function addLine(parent: HTMLElement, text: string, field?: string): HTMLElement {
  const p = document.createElement('p');
  p.className = 'panel-line';
  p.textContent = text;
  if (field) p.dataset.field = field;
  parent.appendChild(p);
  return p;
}

function addButton(parent: HTMLElement, label: string, onClick: () => void): void {
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = label;
  btn.addEventListener('click', () => {
    btn.blur();
    onClick();
  });
  parent.appendChild(btn);
}

/** Baut den Panel-Inhalt für ein Gebäude neu auf (nur bei Auswahlwechsel aufrufen). */
export function renderInspect(
  panel: HTMLElement,
  world: World,
  id: number,
  actions: InspectActions,
): void {
  panel.replaceChildren();
  const b = world.buildings[id];
  if (!b) return;
  const def = BUILDING_DEFS[b.defId];

  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.textContent = def.name;
  panel.appendChild(title);
  addLine(panel, `Position (${b.x}, ${b.y})`);

  const buttons = document.createElement('div');
  buttons.className = 'panel-actions';

  if (b.defId === 'kontor') {
    addLine(panel, `Lagerkapazität ${STORAGE_CAP} je Gut`);
    addButton(buttons, 'Handeln', () => actions.openTrade());
  } else {
    if (b.defId === 'house') {
      addLine(panel, '', 'inhabitants');
    } else {
      addLine(panel, '', 'state');
      if (def.produces && def.cycle !== undefined) {
        addLine(panel, `Erzeugt ${GOODS[def.produces].name} alle ${def.cycle} Ticks`);
        if (def.consumes) addLine(panel, `Verbraucht ${GOODS[def.consumes].name}`);
        const bar = document.createElement('div');
        bar.className = 'progress';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.dataset.field = 'progress';
        bar.appendChild(fill);
        panel.appendChild(bar);
      }
      addLine(panel, `Unterhalt ${def.upkeep} / ${UPKEEP_INTERVAL} Ticks`);
    }
    const refund = costLine(refundCost(def.cost));
    addButton(buttons, `Abreissen (Rückerstattung ${refund})`, () => actions.demolish(id));
  }
  panel.appendChild(buttons);
  updateInspect(panel, world, id);
}

/** Aktualisiert nur Zahlen und Zustandstext des bereits aufgebauten Panels. */
export function updateInspect(panel: HTMLElement, world: World, id: number): void {
  const b = world.buildings[id];
  if (!b) return;
  const def = BUILDING_DEFS[b.defId];
  if (b.house) {
    setField(
      panel,
      'inhabitants',
      `Einwohner: ${b.house.inhabitants} (${TIERS[b.house.tier].name})`,
    );
  }
  const info = stateInfo(b);
  setField(panel, 'state', info.text)?.classList.toggle('negative', !info.ok);
  const fill = panel.querySelector<HTMLElement>('[data-field="progress"]');
  if (fill && def.cycle) {
    const width = `${Math.min(100, Math.round((b.progress / def.cycle) * 100))}%`;
    if (fill.style.width !== width) fill.style.width = width;
  }
}
