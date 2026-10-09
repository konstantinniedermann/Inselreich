import { home, isKontor } from '../sim/world';
import { phaseAt, type Phase } from '../render/daynight';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { GOODS, STORAGE_CAP } from '../sim/defs/goods';
import { TAX_LEVELS, TIERS } from '../sim/defs/tiers';
import { GROWTH_INTERVAL } from '../sim/defs/timing';
import { isProtected } from '../sim/crises';
import { UPKEEP_INTERVAL, refundCost } from '../sim/economy';
import { SERVICE_BUILDING, upgradeStatus } from '../sim/population';
import { LEVELS } from '../sim/defs/levels';
import { upkeepOf, utilization } from '../sim/levels';
import { paidCost } from '../sim/upgrade';
import { effectiveRefund, goalView, houseDiagnosis } from '../sim/queries';
import { townhallActive } from '../sim/townhall';
import { functionLock, goodUnlocked } from '../sim/unlocks';
import { upgradeDeficit } from '../sim/flow';
import { feastView, houseFeastLine } from './feast';
import { glassStoneHint } from './hints';
import type { Building, BuildingDefId, GoodId, TaxLevel, Tier, World } from '../sim/types';
import { costLine, setField } from './dom';
import { deficitText, diagnosisText, refundText } from './texts';
import { mapSigns, nextStep, remedyText, taxEffect } from './guide';
import {
  taxLockText,
  taxStatusLine,
  taxSummary,
  tierTaxPerMinute,
  tierTaxTooltip,
} from './taxView';
import { taxTarget } from '../sim/tax';
import { friendlyReason } from './hints';
import { renderShipSection, updateShipSection, type ShipActions } from './ships';
import { goalTexts } from './goal';
import type { IconId } from './icons';
import { iconChip } from './messages';
import { tierPath } from './hud';
import { toolForBuilding } from './pipette';
import { formatGameTime, perMinute } from './time';
import { needsConnection } from '../sim/roads';
import { connectView } from './connect';
import type { Pos } from '../sim/world';
import {
  TONE_SYMBOL,
  UPGRADE_KEY_LABEL,
  houseTiles,
  levelPips,
  progressView,
  riseCard,
  TILE_LAYOUT,
  statKeys,
  statTiles,
  stateChip,
  supplyChip,
  tierPips,
  upgradeCard,
  type Chip,
  type GainRow,
  type Pips,
  type StatKey,
  type StatTile,
} from './panelView';

export {
  burningText,
  diagnosisText,
  producesText,
  refundText,
  stateInfo,
  stateText,
} from './texts';

export const BUILD_SAME_TITLE =
  'Diesen Gebäudetyp als Bauwerkzeug wählen (Strg/Cmd+Klick auf ein Gebäude)';
export const UPGRADE_TITLE = 'Ausbauen (Umschalt+U)';

/** Knopf «Gleiches bauen» nur für Gebäude mit Bauwerkzeug (nicht beide Kontore). */
export function buildSameShown(defId: BuildingDefId): boolean {
  return toolForBuilding(defId) !== null;
}

export interface InspectActions {
  /** «Gleiches bauen»: Gebäudetyp als Bauwerkzeug wählen (wie die Pipette). */
  buildSame(defId: BuildingDefId): void;
  demolish(id: number): void;
  openTrade(): void;
  /** Betrieb um eine Stufe ausbauen; die Ablehnung zeigt der Aufrufer. */
  upgrade(id: number): void;
  /** Amtsstube: Steuerstufe, Ausgabesperre und Aufstiegsstopp setzen; die Ablehnung zeigt der Aufrufer. */
  setTax(level: TaxLevel): void;
  /** Amtsstube: Regler einer Bevölkerungsstufe setzen; die Ablehnung zeigt der Aufrufer. */
  setTierTax(tier: Tier, level: TaxLevel): void;
  setGoodLock(tier: Tier, good: GoodId, locked: boolean): void;
  setUpgradeStop(tier: Tier, stopped: boolean): void;
  /** Betrieb mit dem Kontor verbinden; die Ablehnung zeigt der Aufrufer. */
  connect(id: number): void;
  /** Kapelle: Fest feiern; die Ablehnung zeigt der Aufrufer. */
  holdFeast(id: number): void;
  /** Pfad-Vorschau auf der Karte setzen (`null` löscht sie). */
  previewConnect(tiles: readonly Pos[] | null): void;
  /** Kontor-Panel: Schiffe kaufen und Routen anlegen (M12 E4). */
  ships: ShipActions;
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
  return upgradeStatus(world, b).reasons.map(
    (r) => `✗ ${friendlyReason(world, r, { cost, island: b.island, tier: b.house!.tier })}`,
  );
}

function addButton(
  parent: HTMLElement,
  label: string,
  onClick: () => void,
  field?: string,
  title?: string,
): void {
  const btn = document.createElement('button');
  btn.className = 'btn';
  btn.textContent = label;
  if (field) btn.dataset.field = field;
  if (title) btn.title = title;
  btn.addEventListener('click', () => {
    btn.blur();
    onClick();
  });
  parent.appendChild(btn);
}

function addBuildSame(parent: HTMLElement, defId: BuildingDefId, actions: InspectActions): void {
  addButton(
    parent,
    'Gleiches bauen',
    () => actions.buildSame(defId),
    'build-same',
    BUILD_SAME_TITLE,
  );
}

/** Aktionen je Panel-Element (für das Nachführen der Vorschau im Update). */
const panelActions = new WeakMap<HTMLElement, InspectActions>();

/** Letzte Vorschau-Kacheln je Anbinden-Knopf und ob er gerade überfahren/fokussiert ist. */
const connectState = new WeakMap<HTMLElement, { tiles: Pos[]; active: boolean }>();

/** Knopf „Anbinden" mit Pfad-Vorschau beim Überfahren; die Grundzeile folgt nach dem Knopfblock. */
function addConnectButton(parent: HTMLElement, id: number, actions: InspectActions): void {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn';
  btn.dataset.field = 'connect';
  btn.textContent = 'Anbinden';
  const st = { tiles: [] as Pos[], active: false };
  connectState.set(btn, st);
  const show = (): void => {
    st.active = true;
    actions.previewConnect(st.tiles.length > 0 ? st.tiles : null);
  };
  const hide = (): void => {
    st.active = false;
    actions.previewConnect(null);
  };
  btn.addEventListener('mouseenter', show);
  btn.addEventListener('focus', show);
  btn.addEventListener('mouseleave', hide);
  btn.addEventListener('blur', hide);
  btn.addEventListener('click', () => {
    btn.blur();
    actions.connect(id);
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

function node<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  field?: string,
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (field) e.dataset.field = field;
  return e;
}

/** Kopf-Zone (G-2, C-1): Titelzeile mit Platz für den Stufen-Chip; im DEV-Build die Positionszeile darunter. */
function addHead(
  panel: HTMLElement,
  b: Building,
  name: string,
): { head: HTMLElement; row: HTMLElement } {
  const head = node('header', 'pv-head');
  head.dataset.zone = 'head';
  const row = node('div', 'pv-head-row');
  const title = node('h2', 'panel-title', 'title');
  title.textContent = name;
  row.appendChild(title);
  head.appendChild(row);
  if (import.meta.env.DEV) addLine(head, `Position (${b.x}, ${b.y})`);
  panel.appendChild(head);
  return { head, row };
}

/** Stufen-Chip: Text und Punkte (Anzahl hängt nur vom Typ ab, G-3). */
function addLevelChip(row: HTMLElement, chipField: string, textField: string, max: number): void {
  const chip = node('span', 'chip pv-level', chipField);
  chip.setAttribute('role', 'group');
  chip.appendChild(node('span', undefined, textField));
  const pips = node('span', 'pv-pips', `${textField}-pips`);
  pips.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < max; i++) pips.appendChild(node('span', 'pv-pip'));
  chip.appendChild(pips);
  row.appendChild(chip);
}

/** Zustands- bzw. Versorgungs-Chip: Symbol (aria-hidden) und Text, Ton über `data-tone`. */
function addToneChip(parent: HTMLElement, chipField: string, textField: string): void {
  const chip = node('div', 'pv-chip', chipField);
  chip.setAttribute('role', 'group');
  const sym = node('span', 'pv-symbol', `${chipField}-symbol`);
  sym.setAttribute('aria-hidden', 'true');
  chip.append(sym, node('span', undefined, textField));
  parent.appendChild(chip);
}

function setAttr(el: HTMLElement, name: string, value: string): void {
  if (el.getAttribute(name) !== value) el.setAttribute(name, value);
}

function setToneChip(panel: HTMLElement, chipField: string, textField: string, c: Chip): void {
  const chip = panel.querySelector<HTMLElement>(`[data-field="${chipField}"]`);
  if (!chip) return;
  setAttr(chip, 'data-tone', c.tone);
  setAttr(chip, 'aria-label', c.label);
  setAttr(chip, 'title', c.label);
  setField(chip, `${chipField}-symbol`, TONE_SYMBOL[c.tone]);
  setField(chip, textField, c.text);
}

function setPips(panel: HTMLElement, chipField: string, textField: string, p: Pips | null): void {
  if (p === null) return;
  const chip = panel.querySelector<HTMLElement>(`[data-field="${chipField}"]`);
  if (!chip) return;
  setAttr(chip, 'aria-label', p.label);
  setAttr(chip, 'title', p.label);
  const dots = chip.querySelectorAll<HTMLElement>(`[data-field="${textField}-pips"] > span`);
  dots.forEach((d, i) => d.classList.toggle('on', i < p.level));
}

/** Kennzahlen-Zone mit Kachel-Grid; die Kacheln hängen nur vom Typ ab. */
function addStats(panel: HTMLElement, keys: StatKey[]): HTMLElement {
  const sec = node('section', 'pv-stats');
  sec.dataset.zone = 'stats';
  sec.setAttribute('aria-label', 'Kennzahlen');
  const grid = node('div', 'pv-grid');
  for (const key of keys) {
    const tile = node('div', 'pv-tile');
    tile.dataset.stat = key;
    tile.append(
      Object.assign(node('span', 'pv-tile-label'), { textContent: TILE_LAYOUT[key].label }),
      node('strong', 'pv-tile-value', `stat-${key}`),
    );
    if (TILE_LAYOUT[key].sub) tile.appendChild(node('small', 'pv-tile-sub', `stat-${key}-sub`));
    grid.appendChild(tile);
  }
  sec.appendChild(grid);
  panel.appendChild(sec);
  return sec;
}

function setTiles(panel: HTMLElement, tiles: StatTile[]): void {
  for (const t of tiles) {
    setField(panel, `stat-${t.key}`, t.value);
    if (t.sub !== null) setField(panel, `stat-${t.key}-sub`, t.sub);
  }
}

/** Gewinn-Zeile «Label a → b / min» mit Delta-Marke; Wurzel ist ein `<p>`, hidden steuert die Sichtbarkeit. */
function addGainRow(parent: HTMLElement, field: string): void {
  const p = node('p', 'pv-gain');
  p.append(node('span', undefined, field), node('span', 'pv-delta', `${field}-delta`));
  p.dataset.gain = field;
  p.setAttribute('role', 'group');
  parent.appendChild(p);
}

function gainAria(g: GainRow): string {
  const d = g.delta.startsWith('+')
    ? `plus ${g.delta.slice(1)}`
    : g.delta.startsWith('−')
      ? `minus ${g.delta.slice(1)}`
      : 'unverändert';
  return `${g.label} von ${g.before} auf ${g.after}, ${d}`;
}

function setGainRow(root: HTMLElement, field: string, g: GainRow | undefined): void {
  const row = root.querySelector<HTMLElement>(`[data-gain="${field}"]`);
  if (!row) return;
  row.hidden = g === undefined;
  if (g === undefined) return;
  setField(row, field, `${g.label} ${g.text}`);
  setField(row, `${field}-delta`, g.delta);
  setAttr(row, 'aria-label', gainAria(g));
}

/** Karten-Wurzel (Ausbau bzw. Aufstieg) mit `data-zone="upgrade"`. */
function cardNode(label: string): HTMLElement {
  const card = node('section', 'upgrade pv-card');
  card.dataset.zone = 'upgrade';
  card.setAttribute('aria-label', label);
  return card;
}

/** Gerüst des Wohnhaus-Panels: Kopf, Kennzahlen, Aufstiegs-Karte (Spec 6). */
function renderHouse(panel: HTMLElement, b: Building): void {
  const { head, row } = addHead(panel, b, BUILDING_DEFS[b.defId].name);
  addLevelChip(row, 'tier-chip', 'tier', Object.keys(TIERS).length);
  addToneChip(head, 'supplied-chip', 'supplied');
  addLine(head, '', 'feast').hidden = true;
  addList(head, 'reasons', 'diagnosis');
  addRemedy(head);
  const stats = addStats(panel, ['inhabitants']);
  addList(stats, 'needs', 'needs');
  addLine(stats, '', 'first-missing').hidden = true;
  const upgrade = cardNode('Aufstieg');
  const heading = document.createElement('h3');
  heading.dataset.field = 'upgrade-title';
  upgrade.appendChild(heading);
  addGainRow(upgrade, 'gain-inhabitants');
  addList(upgrade, 'reasons', 'upgrade-reasons');
  addLine(upgrade, '', 'deficit').hidden = true;
  addLine(upgrade, '', 'stone-hint').hidden = true;
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

/** Defizit-Zeile (Spec 7): nur volles Haus mit möglichem Aufstieg und einem Defizitgut; sonst `null`. */
export function deficitLine(world: World, b: Building): string | null {
  const house = b.house;
  if (!house) return null;
  const tier = TIERS[house.tier];
  if (tier.upgradeCost === null || house.inhabitants !== tier.maxInhabitants) return null;
  const d = upgradeDeficit(world, b);
  return d
    ? deficitText(d.good, (world.islands[b.island] ?? home(world)).stock[d.good], d.net)
    : null;
}

/** Setzt Text und Sichtbarkeit einer optionalen Panel-Zeile (`null` → verborgen). */
function setOptionalLine(panel: HTMLElement, field: string, text: string | null): void {
  const line = panel.querySelector<HTMLElement>(`[data-field="${field}"]`);
  if (!line) return;
  line.hidden = text === null;
  if (text !== null) setField(panel, field, text);
}

function updateHouse(panel: HTMLElement, world: World, b: Building): void {
  const house = b.house;
  if (!house) return;
  const tier = TIERS[house.tier];
  setField(panel, 'tier', tier.name);
  setPips(panel, 'tier-chip', 'tier', tierPips(b));
  setTiles(panel, houseTiles(b));
  const supply = supplyChip(world, b);
  if (supply) setToneChip(panel, 'supplied-chip', 'supplied', supply);

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
    setField(panel, 'upgrade-title', riseCard(world, b)!.title);
    setGainRow(panel, 'gain-inhabitants', undefined);
    setList(panel, 'upgrade-reasons', []);
    setOptionalLine(panel, 'deficit', null);
    setOptionalLine(panel, 'stone-hint', null);
    if (cost) cost.hidden = true;
    return;
  }
  const rise = riseCard(world, b)!;
  setField(panel, 'upgrade-title', rise.title);
  setGainRow(panel, 'gain-inhabitants', rise.gain ?? undefined);
  const status = upgradeStatus(world, b);
  setList(
    panel,
    'upgrade-reasons',
    status.ok
      ? [{ text: upgradeOkText(), ok: true }]
      : upgradeReasonTexts(world, b).map((text) => ({ text, ok: false })),
  );
  setOptionalLine(panel, 'deficit', deficitLine(world, b));
  setOptionalLine(panel, 'stone-hint', glassStoneHint(world, status.reasons));
  setField(panel, 'upgrade-cost', `Kosten ${costLine(tier.upgradeCost)}`);
  if (cost) cost.hidden = false;
}

/** Aktionen des Amtsstuben-Panels je Panel-Element (für den Neuaufbau von Matrix und Schaltern im Update). */

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
  const grid = document.createElement('div');
  grid.className = 'tax-grid';
  const taxBtn = (level: TaxLevel, attrs: Record<string, string>, onClick: () => void): void => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn';
    btn.textContent = TAX_LEVELS[level].name;
    btn.dataset.tax = level;
    for (const [k, v] of Object.entries(attrs)) btn.setAttribute(k, v);
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => {
      btn.blur();
      onClick();
    });
    grid.append(btn);
  };
  const label = (text: string): void => {
    const s = document.createElement('span');
    s.className = 'tax-tier';
    s.textContent = text;
    grid.append(s);
  };
  const levels = Object.keys(TAX_LEVELS) as TaxLevel[];
  label('alle Stufen');
  for (const level of levels) taxBtn(level, { 'data-tax-all': level }, () => actions.setTax(level));
  grid.append(document.createElement('span'));
  for (const t of TIER_LIST) {
    label(TIERS[t].name);
    for (const level of levels)
      taxBtn(level, { 'data-tax-tier': String(t) }, () => actions.setTierTax(t, level));
    const min = document.createElement('span');
    min.className = 'tax-min';
    min.dataset.field = `tax-min-${t}`;
    grid.append(min);
    const lock = document.createElement('span');
    lock.className = 'tax-lock';
    lock.dataset.field = `tax-lock-${t}`;
    lock.hidden = true;
    lock.style.gridColumn = '1 / -1';
    grid.append(lock);
  }
  panel.append(grid);
  addLine(panel, '', 'tax-effect');
  const matrix = document.createElement('div');
  matrix.dataset.field = 'lock-matrix';
  panel.append(matrix);
  const stops = document.createElement('div');
  stops.dataset.field = 'upgrade-stops';
  panel.append(stops);
}

/** Führt das Amtsstuben-Panel nach; baut Matrix und Schalter nur bei geänderter Struktur neu. */
function updateTownhall(panel: HTMLElement, world: World): void {
  const actions = panelActions.get(panel);
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
  const summary = taxSummary(world);
  for (const btn of panel.querySelectorAll<HTMLButtonElement>('[data-tax]')) {
    const level = btn.dataset.tax as TaxLevel;
    const tier = btn.dataset.taxTier === undefined ? null : (Number(btn.dataset.taxTier) as Tier);
    const on = tier === null ? summary === level : world.taxLevels[tier] === level;
    btn.classList.toggle('active', on);
    const pressed = String(on);
    if (btn.getAttribute('aria-pressed') !== pressed) btn.setAttribute('aria-pressed', pressed);
    const disabled = tier !== null && taxTarget(level, tier) !== level;
    if (btn.disabled !== disabled) btn.disabled = disabled;
    const tip = tier === null ? taxEffect(level) : tierTaxTooltip(tier, level);
    if (btn.title !== tip) btn.title = tip;
  }
  for (const t of TIER_LIST) {
    setField(panel, `tax-min-${t}`, `${tierTaxPerMinute(world, t)} / min`);
    const lockEl = panel.querySelector<HTMLElement>(`[data-field="tax-lock-${t}"]`);
    const text = taxLockText(world, t);
    if (lockEl) lockEl.hidden = text === '';
    setField(panel, `tax-lock-${t}`, text);
  }
  setField(panel, 'tax-effect', taxStatusLine(world));

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

/**
 * Knöpfe des Kontor-Panels: beide Kontore handeln; abreissen lässt sich nur das zweite (der Grund
 * „Erst Route auflösen“ kommt aus der Sim). Kein Kontor ergibt `null`.
 */
export function kontorActions(defId: BuildingDefId): { trade: boolean; demolish: boolean } | null {
  if (!isKontor(defId)) return null;
  return { trade: true, demolish: defId === 'kontor2' };
}

/** Gerüst des Betriebs-Panels (Betriebe und Dienste): Kopf, Kennzahlen, Ausbau-Karte (Spec 5). */
function renderBetrieb(panel: HTMLElement, b: Building, onUpgrade: () => void): void {
  const def = BUILDING_DEFS[b.defId];
  const { head, row } = addHead(panel, b, def.name);
  const levels = LEVELS[b.defId];
  if (levels !== undefined) addLevelChip(row, 'level-chip', 'level', levels.length + 1);
  addToneChip(head, 'state-chip', 'state');
  addRemedy(head);
  const stats = addStats(panel, statKeys(b.defId));
  if (progressView(b) !== null) {
    const bar = node('div', 'progress', 'progress-bar');
    bar.setAttribute('role', 'progressbar');
    bar.setAttribute('aria-valuemin', '0');
    bar.setAttribute('aria-valuemax', '100');
    bar.setAttribute('aria-label', 'Fortschritt Zyklus');
    bar.appendChild(node('div', 'progress-fill', 'progress'));
    stats.appendChild(bar);
  }
  if (def.flammable === true) addLine(stats, '', 'fire-protection');
  if (def.fireProtection === true) addLine(stats, '', 'fire-covers');
  if (levels !== undefined) renderUpgradeBox(panel, onUpgrade);
}

/** Baut den Panel-Inhalt für ein Gebäude neu auf (nur bei Auswahlwechsel aufrufen). */
export function renderInspect(
  panel: HTMLElement,
  world: World,
  id: number,
  actions: InspectActions,
): void {
  panel.replaceChildren();
  panelActions.set(panel, actions);
  const b = world.buildings[id];
  if (!b) return;
  const def = BUILDING_DEFS[b.defId];

  const buttons = document.createElement('div');
  buttons.className = 'panel-actions';

  const kontor = kontorActions(b.defId);
  if (kontor !== null || b.defId === 'townhall') addHead(panel, b, def.name);
  if (kontor !== null) {
    addLine(panel, `Lagerkapazität ${STORAGE_CAP} je Gut`);
    addButton(buttons, 'Handeln', () => actions.openTrade());
    if (kontor.demolish) addButton(buttons, 'Abreissen', () => actions.demolish(id), 'demolish');
  } else if (b.defId === 'townhall') {
    renderTownhall(panel, actions);
    addRemedy(panel);
    addLine(panel, '', 'upkeep');
    addLine(panel, '', 'fire-protection');
    if (buildSameShown(b.defId)) addBuildSame(buttons, b.defId, actions);
    addButton(buttons, 'Abreissen', () => actions.demolish(id), 'demolish');
  } else {
    if (b.house) {
      renderHouse(panel, b);
    } else renderBetrieb(panel, b, () => actions.upgrade(id));
    if (def.service === 'faith') addButton(buttons, '', () => actions.holdFeast(id), 'feast');
    if (needsConnection(b.defId)) addConnectButton(buttons, id, actions);
    if (buildSameShown(b.defId)) addBuildSame(buttons, b.defId, actions);
    addButton(buttons, 'Abreissen', () => actions.demolish(id), 'demolish');
  }
  panel.appendChild(buttons);
  if (kontor !== null) renderShipSection(panel, world, b.island, actions.ships);
  if (buttons.querySelector('[data-field="connect"]')) {
    const reason = addLine(panel, '', 'connect-reason');
    reason.classList.add('negative');
    reason.hidden = true;
  }
  if (def.service === 'faith') {
    const hint = addLine(panel, '', 'feast-reason');
    hint.classList.add('negative');
    hint.hidden = true;
  }
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

/** Gerüst der Ausbau-Karte; `updateInspect` füllt Texte und Sichtbarkeit (Kartenart nur über `hidden`, A-14). */
function renderUpgradeBox(panel: HTMLElement, onUpgrade: () => void): void {
  const box = cardNode('Ausbau');
  box.dataset.field = 'upgrade-box';
  const heading = document.createElement('h3');
  heading.dataset.field = 'level-title';
  box.appendChild(heading);
  addGainRow(box, 'gain-output');
  addGainRow(box, 'gain-upkeep');
  addLine(box, '', 'level-lock');
  addLine(box, '', 'level-cost');
  addLine(box, '', 'level-fee');
  addList(box, 'reasons', 'level-reasons');
  const btn = node('button', 'btn', 'upgrade');
  btn.type = 'button';
  btn.title = UPGRADE_TITLE;
  btn.append('Ausbauen ');
  const key = node('kbd', undefined, 'upgrade-key');
  key.textContent = UPGRADE_KEY_LABEL;
  btn.appendChild(key);
  btn.addEventListener('click', () => {
    btn.blur();
    onUpgrade();
  });
  box.appendChild(btn);
  panel.appendChild(box);
}

/** Setzt die Ausbau-Karte aus `upgradeCard`; ohne Karte verborgen. */
function updateUpgradeBox(panel: HTMLElement, world: World, b: Building): void {
  const box = panel.querySelector<HTMLElement>('[data-field="upgrade-box"]');
  if (!box) return;
  const c = upgradeCard(world, b);
  box.hidden = c === null;
  if (c === null) return;
  setField(box, 'level-title', c.title);
  const gains = c.kind === 'max' ? [] : c.gains;
  setGainRow(
    box,
    'gain-output',
    gains.find((g) => g.key === 'output'),
  );
  setGainRow(
    box,
    'gain-upkeep',
    gains.find((g) => g.key === 'upkeep'),
  );
  const lock = setField(box, 'level-lock', c.kind === 'locked' ? c.lock : '');
  if (lock) lock.hidden = c.kind !== 'locked';
  for (const [field, text] of [
    ['level-cost', c.kind === 'next' ? c.cost : ''],
    ['level-fee', c.kind === 'next' ? c.fee : ''],
  ] as const) {
    const el = setField(box, field, text);
    if (el) el.hidden = c.kind !== 'next';
  }
  setList(
    box,
    'level-reasons',
    (c.kind === 'next' ? c.reasons : []).map((text) => ({ ok: false, text })),
  );
  const btn = box.querySelector<HTMLElement>('[data-field="upgrade"]');
  if (btn) {
    btn.hidden = c.kind !== 'next';
    btn.classList.toggle('unaffordable', c.kind !== 'next' || !c.ok);
  }
}

/** Unterhaltszeile des stehenden Betriebs (Stufe berücksichtigt). */
export function upkeepText(b: Building): string {
  return `Unterhalt ${perMinute(upkeepOf(b), UPKEEP_INTERVAL)} / min`;
}

/** Setzt Anbinden-Knopf und Grundzeile; führt die Vorschau nach, solange der Knopf überfahren ist. */
function updateConnect(panel: HTMLElement, world: World, b: Building): void {
  const btn = panel.querySelector<HTMLButtonElement>('[data-field="connect"]');
  if (!btn) return;
  const v = connectView(world, b);
  const st = connectState.get(btn);
  btn.hidden = v === null;
  if (v) {
    btn.textContent = v.label;
    btn.classList.toggle('unaffordable', !v.ok);
  }
  const reason = panel.querySelector<HTMLElement>('[data-field="connect-reason"]');
  if (reason) {
    reason.hidden = v?.reason == null;
    reason.textContent = v?.reason ?? '';
  }
  if (!st) return;
  if (v === null) {
    if (st.active) panelActions.get(panel)?.previewConnect(null);
    st.active = false;
    st.tiles = [];
    return;
  }
  const key = (t: Pos[]): string => t.map((p) => `${p.x},${p.y}`).join(';');
  const tiles = v?.tiles ?? [];
  const changed = key(tiles) !== key(st.tiles);
  st.tiles = tiles;
  if (st.active && changed) {
    panelActions.get(panel)?.previewConnect(tiles.length > 0 ? tiles : null);
  }
}

/** Kapelle: Knopf „Fest feiern" nachführen; Haus: Zeile, solange ein Fest wirkt. */
function updateFeast(panel: HTMLElement, world: World, b: Building): void {
  if (b.house) {
    const line = houseFeastLine(world, b);
    const el = panel.querySelector<HTMLElement>('[data-field="feast"]');
    if (el) {
      el.hidden = line === null;
      el.textContent = line ?? '';
    }
    return;
  }
  const btn = panel.querySelector<HTMLButtonElement>('button[data-field="feast"]');
  if (!btn) return;
  const v = feastView(world, b);
  btn.hidden = v === null;
  if (v) {
    btn.textContent = v.label;
    btn.disabled = v.disabled;
    btn.title = v.reason ?? '';
  }
  const hint = panel.querySelector<HTMLElement>('[data-field="feast-reason"]');
  if (hint) {
    hint.hidden = v?.reason == null;
    hint.textContent = v?.reason ?? '';
  }
}

/** Aktualisiert nur Zahlen und Zustandstext des bereits aufgebauten Panels. */
export function updateInspect(panel: HTMLElement, world: World, id: number): void {
  const b = world.buildings[id];
  if (!b) return;
  const def = BUILDING_DEFS[b.defId];
  if (b.house) updateHouse(panel, world, b);
  if (b.defId === 'townhall') updateTownhall(panel, world);
  if (isKontor(b.defId)) updateShipSection(panel, world);
  setField(panel, 'refund', refundLine(world, b));
  if (b.defId === 'townhall') setField(panel, 'upkeep', upkeepText(b));
  if (!b.house && !isKontor(b.defId) && b.defId !== 'townhall') updateBetrieb(panel, world, b);
  updateUpgradeBox(panel, world, b);
  updateConnect(panel, world, b);
  updateFeast(panel, world, b);
  const remedyEl = panel.querySelector<HTMLElement>('[data-field="remedy"]');
  if (remedyEl) {
    const text = remedyText(world, b);
    remedyEl.hidden = text === null;
    setField(panel, 'remedy', text ?? '');
  }
  if (def.flammable === true) {
    setField(panel, 'fire-protection', `Brandschutz: ${isProtected(world, b) ? 'ja' : 'nein'}`);
  }
  if (def.fireProtection === true) {
    setField(panel, 'fire-covers', `Schützt ${protectedCount(world, b)} brennbare Gebäude`);
  }
}

/** Führt Kopf, Kacheln und Balken des Betriebs-Panels nach (nur Texte und Attribute, G-3). */
function updateBetrieb(panel: HTMLElement, world: World, b: Building): void {
  setToneChip(panel, 'state-chip', 'state', stateChip(world, b));
  setField(panel, 'level', levelText(b) ?? '');
  setPips(panel, 'level-chip', 'level', levelPips(b));
  setTiles(panel, statTiles(b));
  const view = progressView(b);
  const fill = panel.querySelector<HTMLElement>('[data-field="progress"]');
  const bar = panel.querySelector<HTMLElement>('[data-field="progress-bar"]');
  if (view && fill && bar) {
    const width = `${view.pct}%`;
    if (fill.style.width !== width) fill.style.width = width;
    setAttr(bar, 'aria-valuenow', String(view.pct));
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
  const tax = taxStatusLine(world) + (townhallActive(world) ? '' : ' (keine Amtsstube)');
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
