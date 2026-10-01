import { phaseAt, type Phase } from '../render/daynight';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, STORAGE_CAP } from '../sim/defs/goods';
import { TIERS } from '../sim/defs/tiers';
import { isProtected } from '../sim/crises';
import { UPKEEP_INTERVAL, refundCost } from '../sim/economy';
import { SERVICE_BUILDING, isSupplied, upgradeStatus } from '../sim/population';
import { effectiveRefund, houseDiagnosis, type Diagnosis } from '../sim/queries';
import type { Building, Cost, GoodId, Tier, World } from '../sim/types';
import { costLine, setField } from './dom';

export interface InspectActions {
  demolish(id: number): void;
  openTrade(): void;
}

/** Text zu einer Diagnose (dieselbe Quelle wie das Kartensymbol). */
export function diagnosisText(d: Diagnosis): string {
  switch (d.kind) {
    case 'supply':
      return 'nicht versorgt';
    case 'good':
      return `${GOODS[d.good].name} fehlt`;
    case 'service':
      return `${BUILDING_DEFS[SERVICE_BUILDING[d.service]].name} fehlt`;
  }
}

/** Erzeugungszeile des Panels; während des Brandausfalls steht dort, dass nichts erzeugt wird. */
export function producesText(def: { produces?: GoodId; cycle?: number }, burning: boolean): string {
  const name = def.produces ? GOODS[def.produces].name : '';
  return burning
    ? `Erzeugt ${name} nicht — Betrieb brennt`
    : `Erzeugt ${name} alle ${def.cycle} Ticks`;
}

/** Text für ein brennendes Gebäude (Betrieb oder Dienst): Restdauer bis `outageUntil`. */
export function burningText(b: Building, tick: number): string {
  const left = Math.max(0, (b.outageUntil ?? tick) - tick);
  return `Brennt — wieder in Betrieb in ${left} Ticks`;
}

/**
 * Anzahl brennbarer Gebäude, die diese Feuerwache schützt (Panel „Schützt N …"). Keine eigene Geometrie:
 * die Sim-Abfrage `isProtected` läuft gegen eine Sicht, in der nur diese Wache steht, damit andere
 * Wachen die Zahl nicht verändern.
 */
export function protectedCount(world: World, station: Building): number {
  const solo: World = { ...world, buildings: { [station.id]: station } };
  return Object.values(world.buildings).filter(
    (o) => BUILDING_DEFS[o.defId].flammable === true && isProtected(solo, o),
  ).length;
}

function stateInfo(b: Building, tick: number): { text: string; ok: boolean } {
  const def = BUILDING_DEFS[b.defId];
  if (b.outageUntil !== undefined) return { text: burningText(b, tick), ok: false };
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
    case 'burning':
      return { text: burningText(b, tick), ok: false };
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

/** Rückerstattungstext: tatsächlicher Betrag, je Gut mit Verfall-Hinweis (nur wenn etwas verfällt). */
export function refundText(nominal: Cost, effective: Cost): string {
  const parts = [`Geld ${effective.money}`];
  for (const [key, label] of REFUND_GOODS) {
    if (!nominal[key]) continue;
    const lost = nominal[key] - effective[key];
    parts.push(
      lost > 0
        ? `${label} ${effective[key]} (${lost} verfallen – Lager voll)`
        : `${label} ${effective[key]}`,
    );
  }
  return parts.join(' · ');
}

const REFUND_GOODS = [
  ['wood', GOODS.wood.name],
  ['tools', GOODS.tools.name],
  ['stone', GOODS.stone.name],
] as const;

function demolishLabel(world: World, b: Building): string {
  const nominal = refundCost(BUILDING_DEFS[b.defId].cost);
  return `Abreissen (Rückerstattung ${refundText(nominal, effectiveRefund(world, BUILDING_DEFS[b.defId].cost))})`;
}

function addButton(parent: HTMLElement, label: string, onClick: () => void, field?: string): void {
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = label;
  if (field) btn.dataset.field = field;
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
  addList(panel, 'reasons', 'diagnosis');
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
  // Reihenfolge wie beim Kartensymbol: das erste Element ist das dort gezeigte
  setList(
    panel,
    'diagnosis',
    houseDiagnosis(world, b).map((d) => ({ text: `Mangel: ${diagnosisText(d)}`, ok: false })),
  );

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
        addLine(panel, producesText(def, b.outageUntil !== undefined), 'produces');
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
      if (def.flammable === true) addLine(panel, '', 'fire-protection');
      if (def.fireProtection === true) addLine(panel, '', 'fire-covers');
    }
    addButton(buttons, demolishLabel(world, b), () => actions.demolish(id), 'demolish');
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
  setField(panel, 'demolish', demolishLabel(world, b));
  if (def.produces && def.cycle !== undefined) {
    setField(panel, 'produces', producesText(def, b.outageUntil !== undefined));
  }
  const info = stateInfo(b, world.tick);
  setField(panel, 'state', info.text)?.classList.toggle('negative', !info.ok);
  if (def.flammable === true) {
    setField(panel, 'fire-protection', `Brandschutz: ${isProtected(world, b) ? 'ja' : 'nein'}`);
  }
  if (def.fireProtection === true) {
    setField(panel, 'fire-covers', `Schützt ${protectedCount(world, b)} brennbare Gebäude`);
  }
  const fill = panel.querySelector<HTMLElement>('[data-field="progress"]');
  if (fill && def.cycle) {
    const width = `${Math.min(100, Math.round((b.progress / def.cycle) * 100))}%`;
    if (fill.style.width !== width) fill.style.width = width;
  }
}

const PHASE_VIEW: Record<Phase, { label: string; symbol: string }> = {
  morning: { label: 'Morgen', symbol: '◒' },
  day: { label: 'Tag', symbol: '☀' },
  evening: { label: 'Abend', symbol: '◓' },
  night: { label: 'Nacht', symbol: '☾' },
};

/** Anzeigedaten der Ruhe-Ansicht (reine Darstellung, keine Regel). */
export function restView(world: World): {
  phase: Phase;
  label: string;
  symbol: string;
  inhabitants: number;
} {
  const phase = phaseAt(world.tick);
  let inhabitants = 0;
  for (const b of Object.values(world.buildings)) inhabitants += b.house?.inhabitants ?? 0;
  return { phase, ...PHASE_VIEW[phase], inhabitants };
}

/** Ruhe-Ansicht „Inselchronik" ohne Auswahl; `updateRest` führt Phase und Einwohner nach. */
export function renderRest(panel: HTMLElement, world: World): void {
  panel.replaceChildren();
  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.textContent = 'Inselchronik';
  panel.appendChild(title);
  addLine(panel, '', 'rest-phase');
  addLine(panel, '', 'rest-inhabitants');
  addLine(panel, 'Gebäude anklicken für Details');
  updateRest(panel, world);
}

export function updateRest(panel: HTMLElement, world: World): void {
  const v = restView(world);
  setField(panel, 'rest-phase', `${v.symbol} ${v.label}`);
  setField(panel, 'rest-inhabitants', `Einwohner ${v.inhabitants}`);
}
