import { HOME } from '../sim/world';
import { councilCycle, serviceRadiusOf } from '../sim/council';
import { BUILDING_DEFS, BUILDING_IDS, ROAD_COST, ROAD_COST_OBJ } from '../sim/defs/buildings';
import { unprotectedFlammables } from '../sim/queries';
import { UNLOCKS } from '../sim/defs/unlocks';
import { buildingShown, entryOfBuilding, functionLock } from '../sim/unlocks';
import { CLEAR_FOREST_COST, PLANT_FOREST_COST } from '../sim/defs/forest';
import { GOODS } from '../sim/defs/goods';
import { MONUMENT_GOODS } from '../sim/defs/monument';
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
import { paidFromHome, toolAfford, toolBlockReason } from './islandTools';
import type { IconId } from './icons';
import { iconChip, showMessage } from './messages';
import { perMinute } from './time';
import { traitBuildLine } from './islandCard';
import { standLine } from './buildStand';
import { balanceAfterBuild, balanceLine } from './balancePreview';

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
    case 'home':
      return 'Nur auf der Heimatinsel';
  }
}

/** Dienst-Reichweite über den Helfer; ohne Welt der Def-Wert (reine Tooltip-Aufrufe ohne Spielstand). */
const serviceRadius = (world: World | undefined, defId: BuildingDefId): number | undefined =>
  world === undefined ? BUILDING_DEFS[defId].serviceRadius : serviceRadiusOf(world, defId);

/** „Ungeschützt: N brennbare Gebäude" (Feuerwache-Tooltip, live). */
export function unprotectedLine(n: number): string {
  return `Ungeschützt: ${n} brennbare Gebäude`;
}

/** Krisen-Zeilen eines Gebäudetyps (M6 13.2): Brandschutz, „Brennbar", „sturmanfällig". */
export function crisisTooltipLines(defId: BuildingDefId, world?: World): string[] {
  const def = BUILDING_DEFS[defId];
  const lines: string[] = [];
  if (def.fireProtection === true) {
    lines.push(
      `Schützt brennbare Gebäude im Radius ${serviceRadius(world, defId) ?? 0} vor Brand (muss angebunden sein)`,
    );
  }
  if (def.flammable === true) lines.push('Brennbar');
  if (def.stormAffected === true) lines.push('sturmanfällig (halbe Leistung im Sturm)');
  return lines;
}

/** U-6: Tooltip-Zeile des Denkmals; Gutnamen aus den Defs. */
function monumentToolLine(): string {
  return `Wahlziel in drei Abschnitten: ${MONUMENT_GOODS.map((g) => GOODS[g].name).join(', ')}`;
}

/** Takt-Zeilen eines Gebäudes je Präfix («Erzeugt», «Ausstoss je Stufe», «Braucht»); folgt dem Ratsbeschluss, rechnet keine Bilanz. */
export function cycleLines(defId: BuildingDefId, world?: World): Record<string, string> {
  const def = BUILDING_DEFS[defId];
  const out: Record<string, string> = {};
  const cyc = (c: number): number => (world === undefined ? c : councilCycle(world, def.id, c));
  if (def.produces && def.cycle) {
    out['Erzeugt'] = `Erzeugt: ${GOODS[def.produces].name} ${perInterval(cyc(def.cycle))}`;
    const lv = LEVELS[def.id];
    if (lv) {
      const rates = [def.cycle, lv[0]!.cycle, lv[1]!.cycle].map((c) => num(perMinute(1, cyc(c))));
      out['Ausstoss je Stufe'] = `Ausstoss je Stufe: ${rates.join(' · ')} / min`;
    }
  }
  if (def.consumes && def.cycle) {
    const rate = perInterval(cyc(def.cycle));
    out['Braucht'] = `Braucht: ${def.consumes.map((g) => `${GOODS[g].name} ${rate}`).join(' · ')}`;
  }
  return out;
}

/** «Radius: n»-Zeile (Dienst- oder Versorgungsradius), sonst null. */
function radiusLine(world: World | undefined, defId: BuildingDefId): string | null {
  const radius = serviceRadius(world, defId) ?? BUILDING_DEFS[defId].supplyRadius;
  return radius === undefined ? null : `Radius: ${radius}`;
}

/** Tooltip-Zeilen ohne Sperrgrund (der kommt live dazu); alle Zahlen aus `src/sim/defs/`. Mit `world` kommt die Inselvorteil-Zeile der aktiven Insel dazu. */
export function tooltipLines(tool: Tool, world?: World, island: number = HOME): string[] {
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
    `Kosten: ${costLine(def.cost)}${paidFromHome(tool) ? ' (aus der Heimat)' : ''}`,
    `Unterhalt: ${num(perMinute(def.upkeep, UPKEEP_INTERVAL))} / min`,
  ];
  if (world !== undefined) lines.push(cachedBalanceLine(world, def.id, island));
  if (def.id === 'townhall') lines.push('Steuer und Ausgabesperre einstellen');
  const cycle = cycleLines(def.id, world);
  if (cycle['Erzeugt'] !== undefined) {
    lines.push(cycle['Erzeugt']);
    const advantage = world === undefined ? null : traitBuildLine(world, island, def.id);
    if (advantage !== null) lines.push(advantage);
    if (cycle['Ausstoss je Stufe'] !== undefined) lines.push(cycle['Ausstoss je Stufe']);
  }
  if (cycle['Braucht'] !== undefined) lines.push(cycle['Braucht']);
  if (def.service) lines.push(`Dienst: ${SERVICE_NAMES[def.service]}`);
  const radius = radiusLine(world, def.id);
  if (radius !== null) lines.push(radius);
  lines.push(...crisisTooltipLines(def.id, world));
  lines.push(`Standort: ${def.site.length ? def.site.map(siteText).join(', ') : 'frei'}`);
  if (def.maxCount?.n === 1) lines.push('Nur einmal je Insel');
  if (def.id === 'monument') lines.push(monumentToolLine());
  const preview = tierPreviewLine(def.id);
  if (preview) lines.push(preview);
  return lines;
}

/** Eigene Vorschau-Zeilen der Seefahrts-Gebäude: sie hängen an U6, sind aber keine Kaufleute-Stufe (T12). */
const SEAFARING_PREVIEW: Readonly<Partial<Record<BuildingDefId, string>>> = {
  kontor2: 'Für Fremdinseln (Seefahrt)',
  spicefarm: 'Für Inseln mit Gewürz (Seefahrt)',
};

/**
 * Stufen-Zeile (M8 4.3 Punkt 4): für welche Stufe das Gebäude freigeschaltet wird, aus dem Freischalt-Eintrag
 * (Auslöser `tierOpen`); ohne Hebel-Variante, weil der Eintrag vorher nicht in der Bauleiste steht.
 * `null` für Gebäude anderer Einträge. Task 6 ersetzt die Zeile durch den Freischalt-Hinweis.
 */
export function tierPreviewLine(defId: BuildingDefId): string | null {
  const own = SEAFARING_PREVIEW[defId];
  if (own !== undefined) return own;
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

/** Welt und Insel des letzten `updateBuildMenu`; Tooltips lesen daraus beim Öffnen (lazy, I-078). */
let liveView: { world: World; island: number } | null = null;

/** Setzt die Bilanz-Zeile(n) der Elemente, die `selector` unter `root` findet. */
function fillBalance(
  root: ParentNode,
  world: World,
  island: number,
  selector = '.tt-balance',
): void {
  for (const el of root.querySelectorAll<HTMLElement>(selector)) {
    const id = el.dataset.defId as BuildingDefId | undefined;
    if (id === undefined) continue;
    const line = cachedBalanceLine(world, id, island);
    if (el.textContent !== line) el.textContent = line;
  }
}

/** Setzt die Bestandszeile(n) (I-167) der Elemente unter `selector`; leer, wenn die Art keine Zeile hat. */
function fillStand(root: ParentNode, world: World, island: number, selector = '.tt-stand'): void {
  for (const el of root.querySelectorAll<HTMLElement>(selector)) {
    const id = el.dataset.defId as BuildingDefId | undefined;
    if (id === undefined) continue;
    const line = standLine(world, id, island) ?? '';
    if (el.textContent !== line) el.textContent = line;
  }
}

/** Aktualisiert Bilanz- und Bestandszeile der gerade sichtbaren Tooltips; ohne sichtbaren Tooltip wird nichts gerechnet. */
export function refreshShownBalance(nav: ParentNode, world: World, island: number): void {
  fillBalance(nav, world, island, '.tooltip.show .tt-balance');
  fillStand(nav, world, island, '.tooltip.show .tt-stand');
}

/** Setzt die Takt-Zeilen unter `selector`; nur sichtbare Tooltips (kein Rechnen für verborgene). */
function fillCycle(root: ParentNode, world: World, selector: string): void {
  const cache = new Map<BuildingDefId, Record<string, string>>();
  for (const el of root.querySelectorAll<HTMLElement>(selector)) {
    const id = el.dataset.defId as BuildingDefId | undefined;
    const prefix = el.dataset.prefix;
    if (id === undefined || prefix === undefined) continue;
    let lines = cache.get(id);
    if (lines === undefined) {
      lines = cycleLines(id, world);
      cache.set(id, lines);
    }
    const text = lines[prefix];
    if (text !== undefined && el.textContent !== text) el.textContent = text;
  }
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
    if (tool.kind === 'build' && (text.startsWith('Radius:') || text.startsWith('Schützt '))) {
      // Reichweite folgt dem Ratsbeschluss: `updateBuildMenu` setzt den Text neu (braucht die Welt)
      line.classList.add(text.startsWith('Radius:') ? 'tt-radius' : 'tt-fireradius');
      line.dataset.defId = tool.defId;
    }
    const taktPrefix = ['Erzeugt', 'Ausstoss je Stufe', 'Braucht'].find((p) =>
      text.startsWith(`${p}:`),
    );
    if (tool.kind === 'build' && taktPrefix !== undefined) {
      // Takt folgt dem Ratsbeschluss (Spec 3.2.3): `updateBuildMenu` setzt den Text neu
      line.classList.add('tt-cycle');
      line.dataset.defId = tool.defId;
      line.dataset.prefix = taktPrefix;
    }
    if (text.startsWith('Unterhalt:') && tool.kind === 'build') {
      // Bilanz-Vorschau: `updateBuildMenu` füllt den Text (braucht die Welt)
      const balance = document.createElement('span');
      balance.className = 'tt-line tt-balance';
      balance.dataset.defId = tool.defId;
      tip.appendChild(balance);
      const stand = document.createElement('span');
      stand.className = 'tt-line tt-stand';
      stand.dataset.defId = tool.defId;
      tip.appendChild(stand);
    }
    if (text.startsWith('Erzeugt:')) {
      // Inselvorteil der aktiven Insel: `updateBuildMenu` füllt Text und Sichtbarkeit
      const advantage = document.createElement('span');
      advantage.className = 'tt-line tt-island';
      advantage.hidden = true;
      tip.appendChild(advantage);
    }
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

  const open = (): void => {
    if (liveView !== null) {
      fillBalance(tip, liveView.world, liveView.island);
      fillStand(tip, liveView.world, liveView.island);
      fillCycle(tip, liveView.world, '.tt-cycle');
    }
    showTooltip(btn, tip, anchorOf());
  };
  btn.addEventListener('mouseenter', open);
  btn.addEventListener('mouseleave', () => hideTooltip(tip));
  btn.addEventListener('focus', open);
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
      open();
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

/** Merkt sich Werkzeug und Kosten je Bau-Button für die Leistbarkeitsprüfung. */
const buttonCost = new WeakMap<HTMLButtonElement, { tool: Tool; cost: Cost }>();

/** Grund, warum das Werkzeug auf der Insel nicht geht (fehlendes Kontor vor Kosten), sonst `null`. */
export function toolReason(world: World, tool: Tool, island: number): string | null {
  const gate = toolBlockReason(world, tool, island);
  if (gate !== null) return gate;
  const r = toolAfford(world, tool, island);
  return r.ok ? null : r.reason;
}

/** Einträge einer Kategorie in `BUILDING_IDS`-Reihenfolge, ohne Kontor und nur Angezeigtes (Spec 11.1). */
export function buildEntries(
  world: World,
  category: Category,
  island: number = HOME,
): BuildingDefId[] {
  return BUILDING_IDS.filter(
    (id) =>
      id !== 'kontor' &&
      !(id === 'kontor2' && island === HOME) && // das zweite Kontor gründet man nur auf einer Fremdinsel
      !(id === 'monument' && island !== HOME) && // das Denkmal steht nur auf der Heimatinsel
      BUILDING_DEFS[id].category === category &&
      buildingShown(world, id),
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
    for (const id of u.buildings)
      if (id !== 'kontor' && id !== 'kontor2' && buildingShown(world, id)) out.add(id); // kontor2 nur auf Fremdinseln
  }
  return out;
}

/** Kategorien mit mindestens einem Eintrag, in `CATEGORIES`-Reihenfolge. */
export function visibleCategories(world: World, island: number = HOME): Category[] {
  return CATEGORIES.filter((c) => buildEntries(world, c.id, island).length > 0).map((c) => c.id);
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
    if (cost) buttonCost.set(btn, { tool, cost });
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
      const reason = cost ? toolReason(state.world, tool, state.activeIsland) : null;
      if (reason !== null)
        showMessage(
          friendlyReason(state.world, reason, { cost, island: state.activeIsland }),
          'error',
        );
    });
    parent.appendChild(btn);
  };

  // Ist die offene Kategorie leer, schliesst die Einträge-Leiste (Spec 11.1);
  // Seiteneffekt: setzt `state.openCategory` auf null
  if (
    state.openCategory !== null &&
    buildEntries(state.world, state.openCategory, state.activeIsland).length === 0
  )
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
    btn.hidden = buildEntries(state.world, cat.id, state.activeIsland).length === 0;
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
    // Overlay über der Karte: Mausrad weder zoomen noch die Seite scrollen lassen (UI-PANEL T5c)
    sub.addEventListener('wheel', (ev) => ev.preventDefault(), { passive: false });
    const ids = buildEntries(state.world, state.openCategory, state.activeIsland);
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
  updateBuildMenu(nav, state.world, state.activeIsland);
  if (focusKey !== undefined) {
    nav.querySelector<HTMLElement>(`[data-key="${CSS.escape(focusKey)}"]`)?.focus();
  }
}

/** Cache der Bilanz-Zeilen: gilt, solange Welt, Tick und Gebäudestand (Zahl, Ausbaustufen, Stilllegung), Schiffe und Edikt gleich sind. */
let balanceCache: { world: World; sig: string; lines: Map<string, string> } | null = null;

function worldSignature(world: World): string {
  let n = 0;
  let levels = 0;
  let paused = 0;
  for (const b of Object.values(world.buildings)) {
    n++;
    levels += b.level ?? 1;
    if (b.paused === true) paused++;
  }
  return [
    world.tick,
    world.nextBuildingId,
    n,
    levels,
    paused,
    world.ships.length,
    world.edict,
    JSON.stringify(world.taxLevels),
  ].join('|');
}

/** Bilanz-Zeile für den Bau-Tooltip; rechnet nur bei geändertem Stand neu, nicht je HUD-Takt. */
export function cachedBalanceLine(world: World, defId: BuildingDefId, island: number): string {
  const sig = worldSignature(world);
  if (balanceCache === null || balanceCache.world !== world || balanceCache.sig !== sig) {
    balanceCache = { world, sig, lines: new Map() };
  }
  const key = `${island}:${defId}`;
  let line = balanceCache.lines.get(key);
  if (line === undefined) {
    line = balanceLine(balanceAfterBuild(world, defId, island));
    balanceCache.lines.set(key, line);
  }
  return line;
}

/** Markiert Bau-Buttons, deren Kosten gerade nicht bezahlbar sind (bleiben klickbar). */
export function updateBuildMenu(nav: HTMLElement, world: World, island: number = HOME): void {
  liveView = { world, island };
  refreshShownBalance(nav, world, island);
  for (const el of nav.querySelectorAll<HTMLElement>('.tt-radius, .tt-fireradius')) {
    const id = el.dataset.defId as BuildingDefId | undefined;
    if (id === undefined) continue;
    const text = el.classList.contains('tt-radius')
      ? (radiusLine(world, id) ?? 'Radius: 0')
      : (crisisTooltipLines(id, world)[0] ?? el.textContent ?? '');
    if (el.textContent !== text) el.textContent = text;
  }
  fillCycle(nav, world, '.tooltip.show .tt-cycle');
  const live = nav.querySelector('.tt-unprotected');
  if (live) {
    const text = unprotectedLine(unprotectedFlammables(world).length);
    if (live.textContent !== text) live.textContent = text;
  }
  for (const btn of nav.querySelectorAll<HTMLButtonElement>('button')) {
    const meta = buttonCost.get(btn);
    if (!meta) continue;
    const { tool, cost } = meta;
    const why = toolReason(world, tool, island);
    btn.classList.toggle('unaffordable', why !== null);
    const advantageEl = btn.querySelector<HTMLElement>('.tt-island');
    if (advantageEl && tool.kind === 'build') {
      const line = traitBuildLine(world, island, tool.defId) ?? '';
      if (advantageEl.textContent !== line) advantageEl.textContent = line;
      if (advantageEl.hidden !== (line === '')) advantageEl.hidden = line === '';
    }
    const reason = btn.querySelector('.tt-reason');
    const text = why === null ? '' : friendlyReason(world, why, { cost, island });
    if (reason && reason.textContent !== text) reason.textContent = text;
  }
}
