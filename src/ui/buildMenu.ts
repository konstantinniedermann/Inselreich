import { BUILDING_DEFS, BUILDING_IDS, ROAD_COST, ROAD_COST_OBJ } from '../sim/defs/buildings';
import { unprotectedFlammables } from '../sim/queries';
import { checkAfford } from '../sim/economy';
import { GOODS } from '../sim/defs/goods';
import { UPKEEP_INTERVAL } from '../sim/defs/timing';
import type { BuildingDefId, Category, Cost, SiteRule, Terrain, World } from '../sim/types';
import type { Tool } from '../render/renderer';
import type { GameState } from './app';
import { costLine } from './dom';
import { hotkeyLabel, sameTool } from './hotkeys';
import { showMessage } from './messages';

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

const SERVICE_NAMES = { faith: 'Glaube', school: 'Bildung' } as const;

/** Zahl mit höchstens einer Nachkommastelle, ohne „.0" („3.3", „2"). */
function num(n: number): string {
  return String(Math.round(n * 10) / 10);
}

function perInterval(cycle: number): string {
  return `${num(UPKEEP_INTERVAL / cycle)} je ${UPKEEP_INTERVAL} Ticks`;
}

function siteText(rule: SiteRule): string {
  switch (rule.kind) {
    case 'coast':
      return 'Küste (Wasser angrenzend)';
    case 'adjacent':
      return `${TERRAIN_NAMES[rule.terrain]} angrenzend${rule.min > 1 ? ` (mind. ${rule.min})` : ''}`;
    case 'radius':
      return `${TERRAIN_NAMES[rule.terrain]} im Radius ${rule.radius}${rule.min > 1 ? ` (mind. ${rule.min})` : ''}`;
    case 'supply':
      return 'Im Versorgungsradius von Kontor oder Marktplatz';
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
  const def = BUILDING_DEFS[tool.defId];
  const lines = [
    withKey(def.name),
    `Kosten: ${costLine(def.cost)}`,
    `Unterhalt: ${def.upkeep} je ${UPKEEP_INTERVAL} Ticks`,
  ];
  if (def.produces && def.cycle) {
    lines.push(`Erzeugt: ${GOODS[def.produces].name} ${perInterval(def.cycle)}`);
  }
  if (def.consumes && def.cycle) {
    lines.push(`Braucht: ${GOODS[def.consumes].name} ${perInterval(def.cycle)}`);
  }
  if (def.service) lines.push(`Dienst: ${SERVICE_NAMES[def.service]}`);
  const radius = def.serviceRadius ?? def.supplyRadius;
  if (radius !== undefined) lines.push(`Radius: ${radius}`);
  lines.push(...crisisTooltipLines(def.id));
  lines.push(`Standort: ${def.site.length ? def.site.map(siteText).join(', ') : 'frei'}`);
  return lines;
}

let tooltipCounter = 0;

/** Zeigt das Tooltip über dem Button; `position: fixed`, damit die scrollende Leiste es nicht abschneidet. */
function showTooltip(btn: HTMLElement, tip: HTMLElement): void {
  tip.classList.add('show');
  const r = btn.getBoundingClientRect();
  const w = tip.offsetWidth;
  const h = tip.offsetHeight;
  const left = Math.max(4, Math.min(r.left, window.innerWidth - w - 4));
  const top = r.top - h - 6 >= 4 ? r.top - h - 6 : r.bottom + 6;
  tip.style.left = `${left}px`;
  tip.style.top = `${top}px`;
}

function hideTooltip(tip: HTMLElement): void {
  tip.classList.remove('show');
}

/** Hängt ein Tooltip-Element an den Button: Hover, Tastaturfokus, Touch-Langdruck. */
function attachTooltip(btn: HTMLButtonElement, tool: Tool, hasCost: boolean): void {
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

  btn.addEventListener('mouseenter', () => showTooltip(btn, tip));
  btn.addEventListener('mouseleave', () => hideTooltip(tip));
  btn.addEventListener('focus', () => showTooltip(btn, tip));
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
      showTooltip(btn, tip);
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
    btn.className = 'btn' + (sameTool(state.tool, tool) ? ' active' : '');
    btn.setAttribute('aria-label', label);
    btn.appendChild(document.createTextNode(label));
    if (sub) {
      const small = document.createElement('small');
      small.textContent = sub;
      btn.appendChild(small);
    }
    attachTooltip(btn, tool, cost !== undefined);
    btn.addEventListener('click', () => {
      if (btn.dataset.longPress) {
        // Langdruck zeigte nur das Tooltip: kein Werkzeugwechsel
        delete btn.dataset.longPress;
        return;
      }
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
  const live = nav.querySelector('.tt-unprotected');
  if (live) {
    const text = unprotectedLine(unprotectedFlammables(world).length);
    if (live.textContent !== text) live.textContent = text;
  }
  for (const btn of nav.querySelectorAll<HTMLButtonElement>('button')) {
    const cost = buttonCost.get(btn);
    if (!cost) continue;
    const r = checkAfford(world, cost);
    btn.classList.toggle('unaffordable', !r.ok);
    const reason = btn.querySelector('.tt-reason');
    const text = r.ok ? '' : r.reason;
    if (reason && reason.textContent !== text) reason.textContent = text;
  }
}
