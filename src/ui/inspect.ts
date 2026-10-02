import { phaseAt, type Phase } from '../render/daynight';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, STORAGE_CAP } from '../sim/defs/goods';
import { TIERS, WIN_CITIZENS } from '../sim/defs/tiers';
import { GROWTH_INTERVAL } from '../sim/defs/timing';
import { isProtected } from '../sim/crises';
import { UPKEEP_INTERVAL, refundCost } from '../sim/economy';
import { SERVICE_BUILDING, citizens, isSupplied, upgradeStatus } from '../sim/population';
import { effectiveRefund, houseDiagnosis } from '../sim/queries';
import type { Building, GoodId, Tier, World } from '../sim/types';
import { costLine, setField } from './dom';
import { diagnosisText, producesText, refundText, stateInfo } from './texts';
import { MAP_SIGNS, nextStep, remedyText, taxEffect } from './guide';
import { friendlyReason } from './hints';
import { tierPath } from './hud';
import { formatGameTime } from './time';

export {
  burningText,
  diagnosisText,
  producesText,
  refundText,
  stateInfo,
  stateText,
} from './texts';

export interface InspectActions {
  demolish(id: number): void;
  openTrade(): void;
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

function addLine(parent: HTMLElement, text: string, field?: string): HTMLElement {
  const p = document.createElement('p');
  p.className = 'panel-line';
  p.textContent = text;
  if (field) p.dataset.field = field;
  parent.appendChild(p);
  return p;
}

function refundLine(world: World, b: Building): string {
  const nominal = refundCost(BUILDING_DEFS[b.defId].cost);
  return `Rückerstattung: ${refundText(nominal, effectiveRefund(world, BUILDING_DEFS[b.defId].cost))}`;
}

/** Aufstiegszeile bei erfüllten Bedingungen (Spec L8: Zeit statt „Tick"). */
export function upgradeOkText(): string {
  return `✓ Bedingungen erfüllt — Aufstieg in höchstens ${formatGameTime(GROWTH_INTERVAL)}`;
}

/** Gründe, warum das Haus nicht aufsteigt, als Klartext mit Aufstiegskosten. */
export function upgradeReasonTexts(world: World, b: Building): string[] {
  const cost = TIERS[b.house!.tier].upgradeCost!;
  return upgradeStatus(world, b).reasons.map((r) => `✗ ${friendlyReason(world, r, { cost })}`);
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
/** Abhilfe-Zeile (Spec L7), anfangs versteckt; `updateInspect` setzt Text und Sichtbarkeit. */
function addRemedy(parent: HTMLElement): void {
  const p = addLine(parent, '', 'remedy');
  p.classList.add('remedy');
  p.hidden = true;
}

function renderHouse(panel: HTMLElement): void {
  addLine(panel, '', 'inhabitants');
  addLine(panel, '', 'supplied');
  addList(panel, 'reasons', 'diagnosis');
  addRemedy(panel);
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
      ? [{ text: upgradeOkText(), ok: true }]
      : upgradeReasonTexts(world, b).map((text) => ({ text, ok: false })),
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
  if (import.meta.env.DEV) addLine(panel, `Position (${b.x}, ${b.y})`);

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
      addRemedy(panel);
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
    addButton(buttons, 'Abreissen', () => actions.demolish(id), 'demolish');
  }
  panel.appendChild(buttons);
  if (b.defId !== 'kontor') addLine(panel, '', 'refund');
  updateInspect(panel, world, id);
}

/** Aktualisiert nur Zahlen und Zustandstext des bereits aufgebauten Panels. */
export function updateInspect(panel: HTMLElement, world: World, id: number): void {
  const b = world.buildings[id];
  if (!b) return;
  const def = BUILDING_DEFS[b.defId];
  if (b.house) updateHouse(panel, world, b);
  setField(panel, 'refund', refundLine(world, b));
  const remedyEl = panel.querySelector<HTMLElement>('[data-field="remedy"]');
  if (remedyEl) {
    const text = remedyText(world, b);
    remedyEl.hidden = text === null;
    setField(panel, 'remedy', text ?? '');
  }
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

function addHeading(parent: HTMLElement, text: string): void {
  const h = document.createElement('h3');
  h.textContent = text;
  parent.appendChild(h);
}

/** Ruhe-Ansicht „Inselchronik": Ziel, nächster Schritt, Steuer, Kartenzeichen; `updateRest` führt nach. */
export function renderRest(panel: HTMLElement, world: World): void {
  panel.replaceChildren();
  const title = document.createElement('h2');
  title.className = 'panel-title';
  title.textContent = 'Inselchronik';
  panel.appendChild(title);
  addLine(panel, '', 'rest-phase');
  addLine(panel, '', 'rest-inhabitants');

  addHeading(panel, 'Ziel');
  const bar = document.createElement('div');
  bar.className = 'goal-bar';
  const fill = document.createElement('span');
  fill.dataset.field = 'goal-fill';
  bar.appendChild(fill);
  const label = document.createElement('div');
  label.className = 'goal-label';
  label.dataset.field = 'goal-text';
  bar.appendChild(label);
  panel.appendChild(bar);
  addLine(panel, tierPath());

  addHeading(panel, 'Nächster Schritt');
  addLine(panel, '', 'next-step');
  addHeading(panel, 'Steuer');
  addLine(panel, '', 'rest-tax');

  const details = document.createElement('details');
  details.className = 'map-signs';
  const summary = document.createElement('summary');
  summary.textContent = 'Kartenzeichen';
  details.appendChild(summary);
  const ul = document.createElement('ul');
  for (const s of MAP_SIGNS) {
    const li = document.createElement('li');
    if (s.color !== null) {
      const sw = document.createElement('span');
      sw.className = 'swatch';
      sw.style.background = s.color;
      li.appendChild(sw);
    }
    li.append(`${s.sign} — ${s.meaning}`);
    ul.appendChild(li);
  }
  details.appendChild(ul);
  panel.appendChild(details);
  updateRest(panel, world);
}

/** Führt Zahlen und Texte nach; baut das `details` „Kartenzeichen" nie neu (Auf/Zu bleibt). */
export function updateRest(panel: HTMLElement, world: World): void {
  const v = restView(world);
  setField(panel, 'rest-phase', `${v.symbol} ${v.label}`);
  setField(panel, 'rest-inhabitants', `Einwohner ${v.inhabitants}`);
  const n = citizens(world);
  setField(panel, 'goal-text', `${n} / ${WIN_CITIZENS} ${TIERS[3].name}`);
  const fill = panel.querySelector<HTMLElement>('[data-field="goal-fill"]');
  const width = `${Math.min(100, (n / WIN_CITIZENS) * 100)}%`;
  if (fill && fill.style.width !== width) fill.style.width = width;
  setField(panel, 'next-step', nextStep(world));
  setField(panel, 'rest-tax', taxEffect(world.taxLevel));
}
