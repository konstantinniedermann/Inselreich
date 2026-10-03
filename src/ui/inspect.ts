import { phaseAt, type Phase } from '../render/daynight';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, STORAGE_CAP } from '../sim/defs/goods';
import { TAX_LEVELS, TIERS } from '../sim/defs/tiers';
import { GROWTH_INTERVAL } from '../sim/defs/timing';
import { isProtected } from '../sim/crises';
import { UPKEEP_INTERVAL, refundCost } from '../sim/economy';
import { SERVICE_BUILDING, isSupplied, upgradeStatus } from '../sim/population';
import { LEVELS } from '../sim/defs/levels';
import { cycleOf, upkeepOf, utilization } from '../sim/levels';
import { paidCost, upgradeBuilding } from '../sim/upgrade';
import { effectiveRefund, goalView, houseDiagnosis, missingInputs } from '../sim/queries';
import { effectiveTaxLevel, townhallActive } from '../sim/townhall';
import { functionLock, goodUnlocked } from '../sim/unlocks';
import type { Building, GoodId, TaxLevel, Tier, World } from '../sim/types';
import { costLine, setField } from './dom';
import { diagnosisText, goodList, producesText, refundText, stateInfo } from './texts';
import { mapSigns, nextStep, remedyText, taxEffect } from './guide';
import { friendlyReason } from './hints';
import { goalTexts } from './goal';
import type { IconId } from './icons';
import { iconChip } from './messages';
import { tierPath } from './hud';
import { formatGameTime, perMinute } from './time';

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
  /** Betrieb um eine Stufe ausbauen; die Ablehnung zeigt der Aufrufer. */
  upgrade(id: number): void;
  /** Amtsstube: Steuerstufe, Ausgabesperre und Aufstiegsstopp setzen; die Ablehnung zeigt der Aufrufer. */
  setTax(level: TaxLevel): void;
  setGoodLock(tier: Tier, good: GoodId, locked: boolean): void;
  setUpgradeStop(tier: Tier, stopped: boolean): void;
}

export interface LockRow {
  tier: Tier;
  goods: { good: GoodId; locked: boolean }[];
}

const TIER_LIST: readonly Tier[] = [1, 2, 3, 4];

/** Einwohner je Stufe (nur Anzeige-Zähler, keine Regel). */
function inhabitantsOf(world: World, tier: Tier): number {
  let n = 0;
  for (const b of Object.values(world.buildings))
    if (b.house?.tier === tier) n += b.house.inhabitants;
  return n;
}

/**
 * Sperr-Matrix des Amtsstuben-Panels (Spec 11.8): Zeilen = Stufen mit Einwohnern > 0, Spalten = freigeschaltete
 * Bedarfsgüter der Stufe; `locked` zeigt die gespeicherte Sperre (sie bleibt auch bei 0 Einwohnern).
 * Vor U5 (Funktion `goodLocks`) leer.
 */
export function lockMatrix(world: World): LockRow[] {
  if (functionLock(world, 'goodLocks') !== null) return [];
  return TIER_LIST.filter((t) => inhabitantsOf(world, t) > 0).map((tier) => ({
    tier,
    goods: (Object.keys(TIERS[tier].needs) as GoodId[])
      .filter((good) => goodUnlocked(world, good))
      .map((good) => ({
        good,
        locked: world.goodLocks.some((l) => l.tier === tier && l.good === good),
      })),
  }));
}

/** Stufen mit Aufstieg und Einwohnern > 0 (Schalter „Häuser dieser Stufe steigen nicht auf", Kann K1). */
function stopTiers(world: World): Tier[] {
  return TIER_LIST.filter((t) => TIERS[t].upgradeCost !== null && inhabitantsOf(world, t) > 0);
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

export function refundLine(world: World, b: Building): string {
  const paid = paidCost(b); // Bau- plus Stufenkosten, ohne Gebühr
  return `Rückerstattung: ${refundText(refundCost(paid), effectiveRefund(world, paid))}`;
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
  /** Symbol statt Text: sichtbar nur Symbol und `mark`, `text` wird zum zugänglichen Namen. */
  icon?: IconId;
  mark?: string;
}

/** Bedarf eines Wohnhauses als Symbol (Spec 14): Gut oder Dienst, erfüllt oder offen, Name für `aria-label`. */
export interface NeedIcon {
  icon: IconId;
  met: boolean;
  label: string;
}

/** Bedarfe des Hauses in Reihenfolge der Stufe: erst Güter, dann Dienste. */
export function needIcons(_world: World, b: Building): NeedIcon[] {
  const house = b.house;
  if (!house) return [];
  const tier = TIERS[house.tier];
  const goods = (Object.keys(tier.needs) as GoodId[]).map((g) => ({
    icon: g as IconId,
    met: house.satisfied[g] === true,
    label: GOODS[g].name,
  }));
  const services = tier.services.map((s) => ({
    icon: s as IconId,
    met: house.services[s] === true,
    label: BUILDING_DEFS[SERVICE_BUILDING[s]].name,
  }));
  return [...goods, ...services];
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
  const key = items.map((i) => `${i.ok ? '1' : '0'}${i.icon ?? ''}${i.text}`).join('\n');
  if (ul.dataset.key === key) return;
  ul.dataset.key = key;
  ul.replaceChildren(
    ...items.map((i) => {
      const li = document.createElement('li');
      li.className = i.ok ? 'ok' : 'bad';
      if (i.icon !== undefined) {
        // Symbol auf dunklem Chip (R181); der Name sitzt am Eintrag
        li.setAttribute('aria-label', i.text);
        li.title = i.text;
        li.append(iconChip(i.icon), document.createTextNode(i.mark ?? ''));
      } else li.textContent = i.text;
      return li;
    }),
  );
}

/** Abhilfe-Zeile (Spec L7), anfangs versteckt; `updateInspect` setzt Text und Sichtbarkeit. */
function addRemedy(parent: HTMLElement): void {
  const p = addLine(parent, '', 'remedy');
  p.classList.add('remedy');
  p.hidden = true;
}

/** Gerüst des Wohnhaus-Panels: Einwohner, Versorgung, Bedürfnisse, Aufstieg. */
function renderHouse(panel: HTMLElement): void {
  addLine(panel, '', 'inhabitants');
  addLine(panel, '', 'supplied');
  addList(panel, 'reasons', 'diagnosis');
  addRemedy(panel);
  addList(panel, 'needs', 'needs');
  addLine(panel, '', 'first-missing').hidden = true;
  const upgrade = document.createElement('div');
  upgrade.className = 'upgrade';
  const heading = document.createElement('h3');
  heading.dataset.field = 'upgrade-title';
  upgrade.appendChild(heading);
  addList(upgrade, 'reasons', 'upgrade-reasons');
  addLine(upgrade, '', 'upgrade-cost');
  panel.appendChild(upgrade);
}

/** Zeile unter den Bedarfen: Symbol und Name des ersten fehlenden Guts oder Dienstes; sonst verborgen. */
function setFirstMissing(panel: HTMLElement, n: NeedIcon | undefined): void {
  const line = panel.querySelector<HTMLElement>('[data-field="first-missing"]');
  if (!line) return;
  const key = n === undefined ? '' : `${n.icon}|${n.label}`;
  if (line.dataset.key === key) return;
  line.dataset.key = key;
  line.hidden = n === undefined;
  if (n === undefined) line.replaceChildren();
  else line.replaceChildren(iconChip(n.icon), document.createTextNode(`Fehlt: ${n.label}`));
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

  const icons = needIcons(world, b);
  setList(
    panel,
    'needs',
    icons.map((n) => ({
      text: `${n.label} ${n.met ? '✓' : '✗'}`,
      ok: n.met,
      icon: n.icon,
      mark: n.met ? '✓' : '✗',
    })),
  );
  setFirstMissing(
    panel,
    icons.find((n) => !n.met),
  );
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

/** Aktionen des Amtsstuben-Panels je Panel-Element (für den Neuaufbau von Matrix und Schaltern im Update). */
const townhallActions = new WeakMap<HTMLElement, InspectActions>();

/** Zeile aus Beschriftung und Knöpfen (Sperr-Matrix, Aufstiegsstopp). */
function toggleRow(label: string): HTMLElement {
  const row = document.createElement('div');
  row.className = 'lock-row';
  row.append(Object.assign(document.createElement('span'), { textContent: `${label} ` }));
  return row;
}

function toggleButton(
  row: HTMLElement,
  label: string,
  attr: 'data-lock' | 'data-stop',
  value: string,
  onClick: () => void,
): void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn';
  btn.textContent = label;
  btn.setAttribute(attr, value);
  btn.setAttribute('aria-pressed', 'false');
  btn.addEventListener('click', () => {
    btn.blur();
    onClick();
  });
  row.append(btn);
}

/** Gerüst des Amtsstuben-Panels (Spec 11.8): Zustand, Steuer, Sperr-Matrix, Aufstiegsstopp. */
function renderTownhall(panel: HTMLElement, actions: InspectActions): void {
  addLine(panel, '', 'townhall-state').classList.add('negative');
  const taxes = document.createElement('div');
  taxes.className = 'panel-actions';
  for (const level of Object.keys(TAX_LEVELS) as TaxLevel[]) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = TAX_LEVELS[level].name;
    btn.dataset.tax = level;
    btn.addEventListener('click', () => {
      btn.blur();
      actions.setTax(level);
    });
    taxes.append(btn);
  }
  panel.append(taxes);
  addLine(panel, '', 'tax-effect');
  addLine(panel, '', 'tax-lock').classList.add('tax-lock');
  const matrix = document.createElement('div');
  matrix.dataset.field = 'lock-matrix';
  panel.append(matrix);
  const stops = document.createElement('div');
  stops.dataset.field = 'upgrade-stops';
  panel.append(stops);
}

/** Führt das Amtsstuben-Panel nach; baut Matrix und Schalter nur bei geänderter Struktur neu. */
function updateTownhall(panel: HTMLElement, world: World): void {
  const actions = townhallActions.get(panel);
  if (!actions) return;
  const active = townhallActive(world);
  const state = panel.querySelector<HTMLElement>('[data-field="townhall-state"]');
  if (state) {
    const hall = Object.values(world.buildings).find((x) => x.defId === 'townhall');
    const text =
      active || !hall
        ? ''
        : hall.outageUntil !== undefined
          ? 'Wirkt nicht: brennt'
          : 'Wirkt nicht: nicht angebunden';
    state.hidden = text === '';
    setField(panel, 'townhall-state', text);
  }
  for (const btn of panel.querySelectorAll<HTMLElement>('[data-tax]')) {
    const on = btn.dataset.tax === world.taxLevel;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-pressed', String(on));
  }
  setField(panel, 'tax-effect', taxEffect(effectiveTaxLevel(world)));
  const left = world.taxLockedUntil - world.tick;
  setField(panel, 'tax-lock', left > 0 ? `Steuer wieder änderbar in ${formatGameTime(left)}` : '');

  const matrixEl = panel.querySelector<HTMLElement>('[data-field="lock-matrix"]');
  const rows = lockMatrix(world);
  if (matrixEl) {
    const key = rows.map((r) => `${r.tier}:${r.goods.map((g) => g.good).join(',')}`).join('|');
    if (matrixEl.dataset.key !== key) {
      matrixEl.dataset.key = key;
      matrixEl.replaceChildren();
      if (rows.length > 0) {
        matrixEl.append(
          Object.assign(document.createElement('h3'), { textContent: 'Ausgabesperre' }),
        );
        for (const r of rows) {
          const row = toggleRow(TIERS[r.tier].name);
          for (const g of r.goods)
            toggleButton(row, GOODS[g.good].name, 'data-lock', `${r.tier}-${g.good}`, () =>
              actions.setGoodLock(
                r.tier,
                g.good,
                !world.goodLocks.some((l) => l.tier === r.tier && l.good === g.good),
              ),
            );
          matrixEl.append(row);
        }
      }
    }
    for (const r of rows)
      for (const g of r.goods)
        matrixEl
          .querySelector(`[data-lock="${r.tier}-${g.good}"]`)
          ?.setAttribute('aria-pressed', String(g.locked));
  }

  const stopsEl = panel.querySelector<HTMLElement>('[data-field="upgrade-stops"]');
  const tiers = stopTiers(world);
  if (stopsEl) {
    const key = tiers.join(',');
    if (stopsEl.dataset.key !== key) {
      stopsEl.dataset.key = key;
      stopsEl.replaceChildren();
      if (tiers.length > 0) {
        stopsEl.append(Object.assign(document.createElement('h3'), { textContent: 'Aufstieg' }));
        for (const t of tiers) {
          const row = toggleRow(TIERS[t].name);
          toggleButton(row, 'Häuser dieser Stufe steigen nicht auf', 'data-stop', String(t), () =>
            actions.setUpgradeStop(t, !world.upgradeStops.includes(t)),
          );
          stopsEl.append(row);
        }
      }
    }
    for (const t of tiers)
      stopsEl
        .querySelector(`[data-stop="${t}"]`)
        ?.setAttribute('aria-pressed', String(world.upgradeStops.includes(t)));
  }
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
  } else if (b.defId === 'townhall') {
    townhallActions.set(panel, actions);
    renderTownhall(panel, actions);
    addRemedy(panel);
    addLine(panel, '', 'upkeep');
    addLine(panel, '', 'fire-protection');
    addButton(buttons, 'Abreissen', () => actions.demolish(id), 'demolish');
  } else {
    if (b.house) {
      renderHouse(panel);
    } else {
      addLine(panel, '', 'state');
      addRemedy(panel);
      if (LEVELS[b.defId] !== undefined) addLine(panel, '', 'level');
      if (def.produces) addLine(panel, '', 'utilization');
      if (def.produces && def.cycle !== undefined) {
        addLine(panel, producesText(def, b.outageUntil !== undefined, cycleOf(b)), 'produces');
        if (def.consumes) addLine(panel, `Verbraucht ${goodList(def.consumes)}`);
        const bar = document.createElement('div');
        bar.className = 'progress';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.dataset.field = 'progress';
        bar.appendChild(fill);
        panel.appendChild(bar);
      }
      addLine(panel, '', 'upkeep');
      if (LEVELS[b.defId] !== undefined) renderUpgradeBox(panel, () => actions.upgrade(id));
      if (def.flammable === true) addLine(panel, '', 'fire-protection');
      if (def.fireProtection === true) addLine(panel, '', 'fire-covers');
    }
    addButton(buttons, 'Abreissen', () => actions.demolish(id), 'demolish');
  }
  panel.appendChild(buttons);
  if (b.defId !== 'kontor') addLine(panel, '', 'refund');
  updateInspect(panel, world, id);
}

/** „Stufe n" nur für ausbaubare Betriebe, sonst `null`. */
export function levelText(b: Building): string | null {
  return LEVELS[b.defId] === undefined ? null : `Stufe ${b.level ?? 1}`;
}

/** „Auslastung n %" nur für Betriebe mit Erzeugung, sonst `null`. */
export function utilizationText(b: Building): string | null {
  const u = utilization(b);
  return u === null ? null : `Auslastung ${Math.floor(u / 10)} %`;
}

export interface UpgradeView {
  title: string;
  cost: string;
  fee: string;
  preview: string;
  reasons: string[];
  ok: boolean;
}

/**
 * Ausbau-Abschnitt des Betriebs-Panels (Spec 7); `null`, wenn der Betrieb nicht ausbaubar oder die Stufe noch
 * nicht freigeschaltet ist. Die Gründe stammen aus einem Probelauf von `upgradeBuilding` auf einer Kopie.
 */
export function upgradeView(world: World, b: Building): UpgradeView | null {
  const levels = LEVELS[b.defId];
  if (levels === undefined) return null;
  const lvl = b.level ?? 1;
  if (lvl >= 3)
    return { title: 'Höchste Stufe', cost: '', fee: '', preview: '', reasons: [], ok: false };
  if (functionLock(world, lvl === 1 ? 'upgrade2' : 'upgrade3') !== null) return null;
  const next = levels[lvl - 1]!;
  const probe = {
    ...world,
    stock: { ...world.stock },
    buildings: { ...world.buildings, [b.id]: { ...b } },
  };
  const r = upgradeBuilding(probe, b.id);
  const out = `${perMinute(1, cycleOf(b) ?? 1)} → ${perMinute(1, next.cycle)}`;
  const upkeep = `${perMinute(upkeepOf(b), UPKEEP_INTERVAL)} → ${perMinute(next.upkeep, UPKEEP_INTERVAL)}`;
  return {
    title: `Ausbau zu Stufe ${lvl + 1}`,
    cost: `Kosten ${costLine(next.cost)}`,
    fee: `Gebühr ${next.fee.amount} ${GOODS[next.fee.good].name}`,
    preview: `Ausstoss ${out} / min · Unterhalt ${upkeep} / min`,
    reasons: r.ok ? [] : [`✗ ${friendlyReason(world, r.reason, { cost: next.cost })}`],
    ok: r.ok,
  };
}

/** Gerüst des Ausbau-Abschnitts; `updateInspect` füllt Texte und Sichtbarkeit. */
function renderUpgradeBox(panel: HTMLElement, onUpgrade: () => void): void {
  const box = document.createElement('div');
  box.className = 'upgrade';
  box.dataset.field = 'upgrade-box';
  const heading = document.createElement('h3');
  heading.dataset.field = 'level-title';
  box.appendChild(heading);
  addLine(box, '', 'level-cost');
  addLine(box, '', 'level-fee');
  addLine(box, '', 'level-preview');
  addList(box, 'reasons', 'level-reasons');
  addButton(box, 'Ausbauen', onUpgrade, 'upgrade');
  panel.appendChild(box);
}

/** Setzt den Ausbau-Abschnitt aus `upgradeView`; ohne Ansicht verborgen. */
function updateUpgradeBox(panel: HTMLElement, world: World, b: Building): void {
  const box = panel.querySelector<HTMLElement>('[data-field="upgrade-box"]');
  if (!box) return;
  const v = upgradeView(world, b);
  box.hidden = v === null;
  if (v === null) return;
  setField(box, 'level-title', v.title);
  const maxed = v.title === 'Höchste Stufe';
  const rows = [
    ['level-cost', v.cost],
    ['level-fee', v.fee],
    ['level-preview', v.preview],
  ] as const;
  for (const [field, text] of rows) {
    const el = setField(box, field, text);
    if (el) el.hidden = maxed;
  }
  setList(
    box,
    'level-reasons',
    v.reasons.map((text) => ({ ok: false, text })),
  );
  const btn = box.querySelector<HTMLElement>('[data-field="upgrade"]');
  if (btn) {
    btn.hidden = maxed;
    btn.classList.toggle('unaffordable', !v.ok);
  }
}

/** Unterhaltszeile des stehenden Betriebs (Stufe berücksichtigt). */
export function upkeepText(b: Building): string {
  return `Unterhalt ${perMinute(upkeepOf(b), UPKEEP_INTERVAL)} / min`;
}

/** Fortschrittsbalken in Prozent, bezogen auf den Zyklus der Stufe. */
export function progressPct(b: Building): number {
  return Math.min(100, Math.round((b.progress / (cycleOf(b) ?? 1)) * 100));
}

/** Aktualisiert nur Zahlen und Zustandstext des bereits aufgebauten Panels. */
export function updateInspect(panel: HTMLElement, world: World, id: number): void {
  const b = world.buildings[id];
  if (!b) return;
  const def = BUILDING_DEFS[b.defId];
  if (b.house) updateHouse(panel, world, b);
  if (b.defId === 'townhall') updateTownhall(panel, world);
  setField(panel, 'refund', refundLine(world, b));
  setField(panel, 'upkeep', upkeepText(b));
  setField(panel, 'level', levelText(b) ?? '');
  setField(panel, 'utilization', utilizationText(b) ?? '');
  updateUpgradeBox(panel, world, b);
  const remedyEl = panel.querySelector<HTMLElement>('[data-field="remedy"]');
  if (remedyEl) {
    const text = remedyText(world, b);
    remedyEl.hidden = text === null;
    setField(panel, 'remedy', text ?? '');
  }
  if (def.produces && def.cycle !== undefined) {
    setField(panel, 'produces', producesText(def, b.outageUntil !== undefined, cycleOf(b)));
  }
  const info = stateInfo(b, world.tick, missingInputs(world, b));
  setField(panel, 'state', info.text)?.classList.toggle('negative', !info.ok);
  if (def.flammable === true) {
    setField(panel, 'fire-protection', `Brandschutz: ${isProtected(world, b) ? 'ja' : 'nein'}`);
  }
  if (def.fireProtection === true) {
    setField(panel, 'fire-covers', `Schützt ${protectedCount(world, b)} brennbare Gebäude`);
  }
  const fill = panel.querySelector<HTMLElement>('[data-field="progress"]');
  if (fill && def.cycle) {
    const width = `${progressPct(b)}%`;
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
  tax: string;
} {
  const phase = phaseAt(world.tick);
  let inhabitants = 0;
  for (const b of Object.values(world.buildings)) inhabitants += b.house?.inhabitants ?? 0;
  const tax =
    taxEffect(effectiveTaxLevel(world)) + (townhallActive(world) ? '' : ' (keine Amtsstube)');
  return { phase, ...PHASE_VIEW[phase], inhabitants, tax };
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
  addLine(panel, '', 'goal-next');
  addLine(panel, tierPath());

  addHeading(panel, 'Nächster Schritt');
  addLine(panel, '', 'next-step');
  addLine(panel, 'Mehr in der Hilfe (?)', 'help-hint');
  addHeading(panel, 'Steuer');
  addLine(panel, '', 'rest-tax');

  const details = document.createElement('details');
  details.className = 'map-signs';
  const summary = document.createElement('summary');
  summary.textContent = 'Kartenzeichen';
  details.appendChild(summary);
  const ul = document.createElement('ul');
  ul.dataset.field = 'map-signs';
  details.appendChild(ul);
  panel.appendChild(details);
  updateRest(panel, world);
}

/** Füllt die Kartenzeichen-Liste; nur bei geänderter Zeilenzahl neu (Brand erst ab der ersten Krisenperiode, K4). */
function fillMapSigns(panel: HTMLElement, world: World): void {
  const ul = panel.querySelector<HTMLElement>('[data-field="map-signs"]');
  const signs = mapSigns(world);
  if (!ul || ul.dataset.count === String(signs.length)) return;
  ul.dataset.count = String(signs.length);
  ul.replaceChildren(
    ...signs.map((s) => {
      const li = document.createElement('li');
      if (s.color !== null) {
        const sw = document.createElement('span');
        sw.className = 'swatch';
        sw.style.background = s.color;
        li.appendChild(sw);
      }
      li.append(`${s.sign} — ${s.meaning}`);
      return li;
    }),
  );
}

/** Führt Zahlen und Texte nach; baut das `details` „Kartenzeichen" nie neu (Auf/Zu bleibt). */
export function updateRest(panel: HTMLElement, world: World): void {
  const v = restView(world);
  setField(panel, 'rest-phase', `${v.symbol} ${v.label}`);
  setField(panel, 'rest-inhabitants', `Einwohner ${v.inhabitants}`);
  const goal = goalTexts(goalView(world));
  setField(panel, 'goal-text', goal.rest);
  const fill = panel.querySelector<HTMLElement>('[data-field="goal-fill"]');
  const width = `${goal.fillPct}%`;
  if (fill && fill.style.width !== width) fill.style.width = width;
  const next = setField(panel, 'goal-next', goal.next ?? '');
  if (next && next.hidden !== (goal.next === null)) next.hidden = goal.next === null;
  setField(panel, 'next-step', nextStep(world));
  setField(panel, 'rest-tax', v.tax);
  fillMapSigns(panel, world);
}
