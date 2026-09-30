import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, STORAGE_CAP } from '../sim/defs/goods';
import { TIERS } from '../sim/defs/tiers';
import { UPKEEP_INTERVAL, refundCost } from '../sim/economy';
import { SERVICE_BUILDING, isSupplied, upgradeStatus } from '../sim/population';
import type { Building, GoodId, Tier, World } from '../sim/types';
import { costLine, setField } from './dom';

export interface InspectActions {
  demolish(id: number): void;
  openTrade(): void;
}

function stateInfo(b: Building): { text: string; ok: boolean } {
  const def = BUILDING_DEFS[b.defId];
  // Anbindung zuerst: `state` wird erst im nächsten Tick nachgeführt (z. B. bei Pause)
  if (!b.connected) return { text: 'Nicht an Kontor angebunden', ok: false };
  if (!def.produces) return { text: 'Angebunden', ok: true };
  switch (b.state) {
    case 'ok':
    case 'notConnected': // wieder angebunden, `state` folgt erst im nächsten Tick
      return { text: 'In Betrieb', ok: true };
    case 'waitingInput':
      return {
        text: `Wartet auf ${def.consumes ? GOODS[def.consumes].name : 'Rohstoff'}`,
        ok: false,
      };
    case 'storageFull':
      return { text: 'Lager voll', ok: false };
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

interface ListItem {
  text: string;
  ok: boolean;
}

/** Leere Liste mit `data-field`; Einträge setzt `setList`. */
function addList(parent: HTMLElement, className: string, field: string): void {
  const ul = document.createElement('ul');
  ul.className = className;
  ul.dataset.field = field;
  parent.appendChild(ul);
}

/** Baut die Einträge einer Liste nur neu auf, wenn sich Texte oder Zustände geändert haben. */
function setList(root: HTMLElement, field: string, items: ListItem[]): void {
  const ul = root.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (!ul) return;
  const key = items.map((i) => `${i.ok ? '1' : '0'}${i.text}`).join('\n');
  if (ul.dataset.key === key) return;
  ul.dataset.key = key;
  ul.replaceChildren(
    ...items.map((i) => {
      const li = document.createElement('li');
      li.className = i.ok ? 'ok' : 'bad';
      li.textContent = i.text;
      return li;
    }),
  );
}

/** Gerüst des Wohnhaus-Panels: Einwohner, Versorgung, Bedürfnisse, Aufstieg. */
function renderHouse(panel: HTMLElement): void {
  addLine(panel, '', 'inhabitants');
  addLine(panel, '', 'supplied');
  addList(panel, 'needs', 'needs');
  const upgrade = document.createElement('div');
  upgrade.className = 'upgrade';
  const heading = document.createElement('h3');
  heading.dataset.field = 'upgrade-title';
  upgrade.appendChild(heading);
  addList(upgrade, 'reasons', 'upgrade-reasons');
  addLine(upgrade, '', 'upgrade-cost');
  panel.appendChild(upgrade);
}

function updateHouse(panel: HTMLElement, world: World, b: Building): void {
  const house = b.house;
  if (!house) return;
  const tier = TIERS[house.tier];
  setField(panel, 'title', `${BUILDING_DEFS[b.defId].name} — ${tier.name}`);
  setField(panel, 'inhabitants', `Einwohner ${house.inhabitants} / ${tier.maxInhabitants}`);
  const supplied = isSupplied(world, b);
  setField(
    panel,
    'supplied',
    supplied ? 'Versorgung: ✓ im Radius' : 'Versorgung: ✗ ausserhalb von Kontor/Markt',
  )?.classList.toggle('negative', !supplied);

  const needs: ListItem[] = (Object.keys(tier.needs) as GoodId[]).map((g) => {
    const ok = house.satisfied[g] === true;
    return { text: `${GOODS[g].name} ${ok ? '✓' : '✗'}`, ok };
  });
  for (const s of tier.services) {
    const ok = house.services[s] === true;
    needs.push({ text: `${BUILDING_DEFS[SERVICE_BUILDING[s]].name} ${ok ? '✓' : '✗'}`, ok });
  }
  setList(panel, 'needs', needs);

  const cost = panel.querySelector<HTMLElement>('[data-field="upgrade-cost"]');
  if (tier.upgradeCost === null) {
    setField(panel, 'upgrade-title', 'Höchste Stufe');
    setList(panel, 'upgrade-reasons', []);
    if (cost) cost.hidden = true;
    return;
  }
  setField(panel, 'upgrade-title', `Aufstieg zu ${TIERS[(house.tier + 1) as Tier].name}`);
  const status = upgradeStatus(world, b);
  setList(
    panel,
    'upgrade-reasons',
    status.ok
      ? [{ text: '✓ Bedingungen erfüllt — Aufstieg im nächsten Wachstums-Tick', ok: true }]
      : status.reasons.map((r) => ({ text: `✗ ${r}`, ok: false })),
  );
  setField(panel, 'upgrade-cost', `Kosten ${costLine(tier.upgradeCost)}`);
  if (cost) cost.hidden = false;
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
  title.dataset.field = 'title';
  panel.appendChild(title);
  addLine(panel, `Position (${b.x}, ${b.y})`);

  const buttons = document.createElement('div');
  buttons.className = 'panel-actions';

  if (b.defId === 'kontor') {
    addLine(panel, `Lagerkapazität ${STORAGE_CAP} je Gut`);
    addButton(buttons, 'Handeln', () => actions.openTrade());
  } else {
    if (b.house) {
      renderHouse(panel);
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
  if (b.house) updateHouse(panel, world, b);
  const info = stateInfo(b);
  setField(panel, 'state', info.text)?.classList.toggle('negative', !info.ok);
  const fill = panel.querySelector<HTMLElement>('[data-field="progress"]');
  if (fill && def.cycle) {
    const width = `${Math.min(100, Math.round((b.progress / def.cycle) * 100))}%`;
    if (fill.style.width !== width) fill.style.width = width;
  }
}
