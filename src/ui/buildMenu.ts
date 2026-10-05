import { home } from '../sim/world';
import { BUILDING_DEFS, BUILDING_IDS, ROAD_COST, ROAD_COST_OBJ } from '../sim/defs/buildings';
import { unprotectedFlammables } from '../sim/queries';
import { checkAfford } from '../sim/economy';
import { UNLOCKS } from '../sim/defs/unlocks';
import { buildingShown, entryOfBuilding, functionLock } from '../sim/unlocks';
import { CLEAR_FOREST_COST, PLANT_FOREST_COST } from '../sim/defs/forest';
import { GOODS } from '../sim/defs/goods';
import { LEVELS } from '../sim/defs/levels';
import { TIERS } from '../sim/defs/tiers';
import { UPKEEP_INTERVAL } from '../sim/defs/timing';
import type {
  BuildingDefId,
  Category,
  Cost,
  SiteRule,
  Terrain,
  UnlockId,
  World,
} from '../sim/types';
import type { Tool } from '../render/renderer';
import type { GameState } from './app';
import { blurAfterClick, costLine } from './dom';
import { hotkeyLabel, sameTool } from './hotkeys';
import { friendlyReason } from './hints';
import type { IconId } from './icons';
import { iconChip, showMessage } from './messages';
import { perMinute } from './time';

export const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'infrastructure', label: 'Infrastruktur' },
  { id: 'housing', label: 'Wohnen' },
  { id: 'production', label: 'Produktion' },
  { id: 'public', label: 'Öffentlich' },
];

/** Touch-Langdruck, ab dem das Tooltip erscheint (Millisekunden). */
const LONG_PRESS_MS = 500;

const TERRAIN_NAMES: Record<Terrain, string> = {
  water: 'Wasser',
  sand: 'Sand',
  grass: 'Weide',
  forest: 'Wald',
  mountain: 'Gebirge',
};

const SERVICE_NAMES = { faith: 'Glaube', school: 'Bildung', bath: 'Hygiene' } as const;

/** Zahl mit höchstens einer Nachkommastelle, ohne „.0" („3.3", „2"). */
function num(n: number): string {
  return String(Math.round(n * 10) / 10);
}

function perInterval(cycle: number): string {
  return `${num(perMinute(1, cycle))} / min`;
}

export function siteText(rule: SiteRule): string {
  switch (rule.kind) {
    case 'coast':
      return 'Küste (Wasser angrenzend)';
    case 'adjacent':
      return `${TERRAIN_NAMES[rule.terrain]} angrenzend${rule.min > 1 ? ` (mind. ${rule.min})` : ''}`;
    case 'radius':
      return `${TERRAIN_NAMES[rule.terrain]} im Radius ${rule.radius}${rule.min > 1 ? ` (mind. ${rule.min})` : ''}`;
    case 'supply':
      return 'Im Versorgungsradius von Kontor oder Marktplatz';
    case 'islandTrait':
      return 'Nur auf Inseln mit Gewürz';
    case 'foreignNoKontor':
      return 'Nur auf einer fernen Insel ohne Kontor';
  }
}

/** „Ungeschützt: N brennbare Gebäude" (Feuerwache-Tooltip, live). */
export function unprotectedLine(n: number): string {
  return `Ungeschützt: ${n} brennbare Gebäude`;
}

/** Krisen-Zeilen eines Gebäudetyps (M6 13.2): Brandschutz, „Brennbar", „sturmanfällig". */
export function crisisTooltipLines(defId: BuildingDefId): string[] {
  const def = BUILDING_DEFS[defId];
  const lines: string[] = [];
  if (def.fireProtection === true) {
    lines.push(
      `Schützt brennbare Gebäude im Radius ${def.serviceRadius ?? 0} vor Brand (muss angebunden sein)`,
    );
  }
  if (def.flammable === true) lines.push('Brennbar');
  if (def.stormAffected === true) lines.push('sturmanfällig (halbe Leistung im Sturm)');
  return lines;
}

/** Tooltip-Zeilen ohne Sperrgrund (der kommt live dazu); alle Zahlen aus `src/sim/defs/`. */
export function tooltipLines(tool: Tool): string[] {
  const key = hotkeyLabel(tool);
  const withKey = (name: string): string => (key ? `${name} (${key})` : name);
  if (tool.kind === 'select') return [withKey('Auswahl')];
  if (tool.kind === 'demolish') return [withKey('Abriss')];
  if (tool.kind === 'road') {
    return [withKey('Weg'), `Kosten: ${costLine(ROAD_COST_OBJ)}`];
  }
  if (tool.kind === 'clearForest') {
    return [
      withKey('Roden'),
      `Kosten: ${costLine(CLEAR_FOREST_COST)}`,
      'Wald wird Weide — kein Holz',
      'Nur auf unbebautem Wald',
    ];
  }
  if (tool.kind === 'plantForest') {
    return [
      withKey('Aufforsten'),
      `Kosten: ${costLine(PLANT_FOREST_COST)}`,
      'Weide wird Wald',
      'Nur auf unbebauter Weide',
    ];
  }
  const def = BUILDING_DEFS[tool.defId];
  const lines = [
    withKey(def.name),
    `Kosten: ${costLine(def.cost)}`,
    `Unterhalt: ${num(perMinute(def.upkeep, UPKEEP_INTERVAL))} / min`,
  ];
  if (def.id === 'townhall') lines.push('Steuer und Ausgabesperre einstellen');
  if (def.produces && def.cycle) {
    lines.push(`Erzeugt: ${GOODS[def.produces].name} ${perInterval(def.cycle)}`);
    const lv = LEVELS[def.id];
    if (lv) {
      const rates = [def.cycle, lv[0].cycle, lv[1].cycle].map((c) => num(perMinute(1, c)));
      lines.push(`Ausstoss je Stufe: ${rates.join(' · ')} / min`);
    }
  }
  if (def.consumes && def.cycle) {
    const rate = perInterval(def.cycle);
    lines.push(`Braucht: ${def.consumes.map((g) => `${GOODS[g].name} ${rate}`).join(' · ')}`);
  }
  if (def.service) lines.push(`Dienst: ${SERVICE_NAMES[def.service]}`);
  const radius = def.serviceRadius ?? def.supplyRadius;
  if (radius !== undefined) lines.push(`Radius: ${radius}`);
  lines.push(...crisisTooltipLines(def.id));
  lines.push(`Standort: ${def.site.length ? def.site.map(siteText).join(', ') : 'frei'}`);
  if (def.maxCount?.n === 1) lines.push(`Höchstens eine ${def.name}`);
  const preview = tierPreviewLine(def.id);
  if (preview) lines.push(preview);
  return lines;
}

/**
 * Stufen-Zeile (M8 4.3 Punkt 4): für welche Stufe das Gebäude freigeschaltet wird, aus dem Freischalt-Eintrag
 * (Auslöser `tierOpen`); ohne Hebel-Variante, weil der Eintrag vorher nicht in der Bauleiste steht.
 * `null` für Gebäude anderer Einträge. Task 6 ersetzt die Zeile durch den Freischalt-Hinweis.
 */
export function tierPreviewLine(defId: BuildingDefId): string | null {
  const t = entryOfBuilding(defId)?.trigger;
  return t === undefined || t.kind !== 'tierOpen'
    ? null
    : `Für ${TIERS[t.tier].name} (Stufe ${t.tier})`;
}

let tooltipCounter = 0;

/**
 * Zeigt das Tooltip über dem Button; `position: fixed`, damit die Leiste es nicht abschneidet. Bei offener
 * Einträge-Leiste ankert es an deren Oberkante, damit es nie auf der Leiste liegt (AK-UX-16).
 */
function showTooltip(btn: HTMLElement, tip: HTMLElement, anchor: HTMLElement = btn): void {
  tip.classList.add('show');
  const r = btn.getBoundingClientRect();
  const a = anchor.getBoundingClientRect();
  const w = tip.offsetWidth;
  const h = tip.getBoundingClientRect().height;
  const left = Math.max(4, Math.min(r.left, window.innerWidth - w - 4));
  const top = a.top - h - 6 >= 4 ? a.top - h - 6 : a.bottom + 6;
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function hideTooltip(tip: HTMLElement): void {
  tip.classList.remove('show');
}

/** Hängt ein Tooltip-Element an den Button: Hover, Tastaturfokus, Touch-Langdruck. */
function attachTooltip(
  btn: HTMLButtonElement,
  tool: Tool,
  hasCost: boolean,
  nav: HTMLElement,
): void {
  const anchorOf = (): HTMLElement => nav.querySelector<HTMLElement>('.buildbar-sub') ?? btn;
  const tip = document.createElement('span');
  tip.className = 'tooltip';
  tip.id = `tooltip-${(tooltipCounter += 1)}`;
  tip.setAttribute('role', 'tooltip');
  tooltipLines(tool).forEach((text, i) => {
    const line = document.createElement('span');
    line.className = i === 0 ? 'tt-title' : 'tt-line';
    line.textContent = text;
    tip.appendChild(line);
  });
  if (tool.kind === 'build' && BUILDING_DEFS[tool.defId].fireProtection === true) {
    const live = document.createElement('span');
    live.className = 'tt-line tt-unprotected';
    tip.appendChild(live);
  }
  if (hasCost) {
    const reason = document.createElement('span');
    reason.className = 'tt-reason';
    tip.appendChild(reason);
  }
  btn.setAttribute('aria-describedby', tip.id);
  btn.appendChild(tip);

  btn.addEventListener('mouseenter', () => showTooltip(btn, tip, anchorOf()));
  btn.addEventListener('mouseleave', () => hideTooltip(tip));
  btn.addEventListener('focus', () => showTooltip(btn, tip, anchorOf()));
  btn.addEventListener('blur', () => hideTooltip(tip));

  // Touch-Langdruck: Tooltip nach 500 ms; der folgende Klick wählt dann kein Werkzeug
  let timer: ReturnType<typeof setTimeout> | null = null;
  const cancelPress = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
  };
  btn.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    cancelPress();
    delete btn.dataset.longPress;
    timer = setTimeout(() => {
      timer = null;
      btn.dataset.longPress = '1';
      showTooltip(btn, tip, anchorOf());
    }, LONG_PRESS_MS);
  });
  btn.addEventListener('pointerup', () => {
    cancelPress();
    if (btn.dataset.longPress) setTimeout(() => hideTooltip(tip), 1500);
  });
  btn.addEventListener('pointercancel', () => {
    cancelPress();
    hideTooltip(tip);
  });
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
}

/** Merkt sich die Kosten je Bau-Button für die Leistbarkeitsprüfung. */
const buttonCost = new WeakMap<HTMLButtonElement, Cost>();

/** Einträge einer Kategorie in `BUILDING_IDS`-Reihenfolge, ohne Kontor und nur Angezeigtes (Spec 11.1). */
export function buildEntries(world: World, category: Category): BuildingDefId[] {
  return BUILDING_IDS.filter(
    (id) => id !== 'kontor' && BUILDING_DEFS[id].category === category && buildingShown(world, id),
  );
}

/**
 * Einträge der Bauleiste, die seit `prev` frei wurden (K2): Gebäude der neuen Freischalt-Einträge, soweit
 * angezeigt, in der Reihenfolge des Eintrags. Das UI führt die Menge bis zur ersten Wahl (nicht gespeichert).
 */
export function newBuildEntries(prev: readonly UnlockId[], world: World): Set<BuildingDefId> {
  const out = new Set<BuildingDefId>();
  for (const u of UNLOCKS) {
    if (!world.unlocked.includes(u.id) || prev.includes(u.id)) continue;
    for (const id of u.buildings) if (id !== 'kontor' && buildingShown(world, id)) out.add(id);
  }
  return out;
}

/** Kategorien mit mindestens einem Eintrag, in `CATEGORIES`-Reihenfolge. */
export function visibleCategories(world: World): Category[] {
  return CATEGORIES.filter((c) => buildEntries(world, c.id).length > 0).map((c) => c.id);
}

/**
 * Baut die Bauleiste neu auf: Hauptzeile (Auswahl, Weg, Abriss, Kategorien), darüber die Einträge-Leiste der
 * offenen Kategorie. `onSelect` bekommt das Werkzeug, `onToggle` die angeklickte Kategorie.
 */
export function renderBuildMenu(
  nav: HTMLElement,
  state: GameState,
  onSelect: (tool: Tool) => void,
  onToggle: (category: Category) => void,
): void {
  // Per Tastatur ausgelöst bleibt der Fokus im Menü: nach dem Neuaufbau geht er an das gleiche Gegenstück zurück
  const active = document.activeElement;
  const focusKey =
    active instanceof HTMLElement && nav.contains(active) ? active.dataset.key : undefined;
  nav.replaceChildren();
  const addButton = (
    parent: HTMLElement,
    label: string,
    tool: Tool,
    cost?: Cost,
    icon?: IconId,
  ): void => {
    const btn = document.createElement('button');
    if (cost) buttonCost.set(btn, cost);
    btn.className = 'btn' + (sameTool(state.tool, tool) ? ' active' : '');
    btn.setAttribute('aria-label', label);
    btn.textContent = label;
    btn.dataset.key = label;
    if (icon) btn.prepend(iconChip(icon));
    if (tool.kind === 'build' && state.newEntries.has(tool.defId)) {
      const mark = document.createElement('span');
      mark.className = 'badge-new';
      mark.setAttribute('role', 'img');
      mark.setAttribute('aria-label', 'neu');
      mark.textContent = 'neu';
      btn.append(mark);
    }
    attachTooltip(btn, tool, cost !== undefined, nav);
    btn.addEventListener('click', (ev) => {
      if (btn.dataset.longPress) {
        // Langdruck zeigte nur das Tooltip: kein Werkzeugwechsel
        delete btn.dataset.longPress;
        return;
      }
      if (blurAfterClick(ev.detail)) btn.blur();
      onSelect(tool);
      // Werkzeug bleibt wählbar; der Grund erscheint sofort, auch ohne Tooltip (Touch)
      const afford = cost ? checkAfford(state.world, home(state.world), cost) : null;
      if (afford && !afford.ok)
        showMessage(friendlyReason(state.world, afford.reason, { cost }), 'error');
    });
    parent.appendChild(btn);
  };

  // Ist die offene Kategorie leer, schliesst die Einträge-Leiste (Spec 11.1);
  // Seiteneffekt: setzt `state.openCategory` auf null
  if (state.openCategory !== null && buildEntries(state.world, state.openCategory).length === 0)
    state.openCategory = null;
  const main = document.createElement('div');
  main.className = 'buildbar-main';
  addButton(main, 'Auswahl', { kind: 'select' });
  addButton(main, `Weg · ${ROAD_COST} Geld`, { kind: 'road' }, ROAD_COST_OBJ);
  addButton(main, 'Abriss', { kind: 'demolish' });
  if (functionLock(state.world, 'forest') === null) {
    addButton(
      main,
      `Roden · ${CLEAR_FOREST_COST.money} Geld`,
      { kind: 'clearForest' },
      CLEAR_FOREST_COST,
    );
    addButton(
      main,
      `Aufforsten · ${PLANT_FOREST_COST.money} Geld`,
      { kind: 'plantForest' },
      PLANT_FOREST_COST,
    );
  }
  for (const cat of CATEGORIES) {
    const btn = document.createElement('button');
    btn.className = 'btn btn-category' + (state.openCategory === cat.id ? ' active' : '');
    btn.append(iconChip(`cat-${cat.id}`));
    btn.setAttribute('aria-label', cat.label);
    btn.title = cat.label;
    btn.dataset.category = cat.id;
    btn.setAttribute('aria-expanded', String(state.openCategory === cat.id));
    btn.dataset.key = cat.id;
    btn.hidden = buildEntries(state.world, cat.id).length === 0;
    btn.addEventListener('click', (ev) => {
      if (blurAfterClick(ev.detail)) btn.blur();
      onToggle(cat.id);
    });
    main.appendChild(btn);
  }
  nav.appendChild(main);

  if (state.openCategory !== null) {
    const sub = document.createElement('div');
    sub.className = 'buildbar-sub';
    const ids = buildEntries(state.world, state.openCategory);
    for (const id of ids) {
      const def = BUILDING_DEFS[id];
      addButton(
        sub,
        `${def.name} · ${def.cost.money} Geld`,
        { kind: 'build', defId: id },
        def.cost,
        `cat-${def.category}`,
      );
    }
    nav.appendChild(sub);
  }
  updateBuildMenu(nav, state.world);
  if (focusKey !== undefined) {
    nav.querySelector<HTMLElement>(`[data-key="${CSS.escape(focusKey)}"]`)?.focus();
  }
}

/** Markiert Bau-Buttons, deren Kosten gerade nicht bezahlbar sind (bleiben klickbar). */
export function updateBuildMenu(nav: HTMLElement, world: World): void {
  const live = nav.querySelector('.tt-unprotected');
  if (live) {
    const text = unprotectedLine(unprotectedFlammables(world).length);
    if (live.textContent !== text) live.textContent = text;
  }
  for (const btn of nav.querySelectorAll<HTMLButtonElement>('button')) {
    const cost = buttonCost.get(btn);
    if (!cost) continue;
    const r = checkAfford(world, home(world), cost);
    btn.classList.toggle('unaffordable', !r.ok);
    const reason = btn.querySelector('.tt-reason');
    const text = r.ok ? '' : friendlyReason(world, r.reason, { cost });
    if (reason && reason.textContent !== text) reason.textContent = text;
  }
}
