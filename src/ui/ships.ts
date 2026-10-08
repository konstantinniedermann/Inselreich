// ships.ts — Schiffe und Routen im Kontor-Panel (M12 E4, T15): reine Sicht plus DOM-Abschnitt.
// Keine Spielregel: Gründe kommen aus der Sim (Probelauf auf einer Kopie), Zahlen aus `SHIP`/Defs.
import { GOODS, GOOD_IDS } from '../sim/defs/goods';
import { ROUTE_RESERVE, SHIP } from '../sim/defs/sea';
import { TICK_MS } from '../sim/defs/timing';
import { islandName } from '../sim/islands';
import { buyShip, freeShipAtHome, retireShip } from '../sim/ships';
import type { StepReport } from '../sim/tick';
import type { GoodId, Route, RouteGood, Ship, World } from '../sim/types';
import { goodUnlocked } from '../sim/unlocks';
import { HOME } from '../sim/world';
import { costLine } from './dom';
import { friendlyReason } from './hints';

export interface ShipRow {
  id: number;
  cargo: string;
  target: string;
  rest: string | null;
  route: string | null;
}

export type RouteDir = 'fetch' | 'bring';

/** Aktionen des Schiffsabschnitts; die Ablehnung (`reason`) zeigt der Aufrufer. */
export interface ShipActions {
  buy(): void;
  /** Klick 2 der Routenanlage: freies Schiff im Heimathafen bekommt die Route. */
  startRoute(route: Route): void;
  changeRoute(shipId: number, route: Route): void;
  clearRoute(shipId: number): void;
  retire(shipId: number): void;
  /** Eine blasse Aktion wurde angeklickt: Grund anzeigen. */
  reject(reason: string): void;
}

const ships = (world: World, id: number): Ship | undefined => world.ships.find((s) => s.id === id);

/** Restzeit bei Tempo 1 als „m:ss“, aufgerundet auf volle Sekunden. */
export function restClock(ticks: number): string {
  const s = Math.ceil((Math.max(0, ticks) * TICK_MS) / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

function cargoText(ship: Ship): string {
  const parts = GOOD_IDS.filter((g) => (ship.cargo[g] ?? 0) > 0).map(
    (g) => `${ship.cargo[g]} ${GOODS[g].name}`,
  );
  return parts.length === 0 ? 'leer' : parts.join(', ');
}

/** Güter der Route aus Sicht von `here`: „holen“ = Richtung zu `here`, „bringen“ = von `here` weg. */
function dirLists(route: Route, here: number): { fetch: RouteGood[]; bring: RouteGood[] } {
  return here === route.b
    ? { fetch: route.ab, bring: route.ba }
    : { fetch: route.ba, bring: route.ab };
}

/** Route mit neuen Listen aus Sicht von `here` (kopiert). */
function withLists(route: Route, here: number, fetch: RouteGood[], bring: RouteGood[]): Route {
  const f = fetch.map((g) => ({ ...g }));
  const b = bring.map((g) => ({ ...g }));
  return here === route.b
    ? { a: route.a, b: route.b, ab: f, ba: b }
    : { a: route.a, b: route.b, ab: b, ba: f };
}

/** `„Heimat ⇄ Felsbucht: Gewürz →, ← Werkzeug“`; Pfeile aus Sicht von `here` (steht `here` nicht in der Route: `a`). */
export function routeLine(world: World, route: Route, here: number): string {
  const first = here === route.b ? route.b : route.a;
  const second = first === route.a ? route.b : route.a;
  const out = first === route.a ? route.ab : route.ba; // von `first` weg
  const back = first === route.a ? route.ba : route.ab;
  const goods = [
    ...out.map((g) => `${GOODS[g.good].name} →`),
    ...back.map((g) => `← ${GOODS[g.good].name}`),
  ];
  return `${islandName(world, first)} ⇄ ${islandName(world, second)}: ${goods.join(', ')}`;
}

function related(world: World, ship: Ship, island: number): boolean {
  if (island === HOME) return true; // die Flotte gehört zum Heimatkontor (Kauf, Ausmustern)
  const r = ship.route;
  return (
    ship.port === island || ship.to === island || (r !== null && (r.a === island || r.b === island))
  );
}

/** Schiffe mit Bezug zur Insel (Heimat: die ganze Flotte), nach `id`. */
export function shipRows(world: World, island: number): ShipRow[] {
  return world.ships
    .filter((s) => related(world, s, island))
    .sort((a, b) => a.id - b.id)
    .map((s) => ({
      id: s.id,
      cargo: cargoText(s),
      target:
        s.to !== null
          ? `unterwegs nach ${islandName(world, s.to)}`
          : `liegt in ${islandName(world, s.port)}`,
      rest: s.to !== null ? restClock(s.left) : null,
      route: s.route !== null ? routeLine(world, s.route, island) : s.homing ? 'Heimfahrt' : null,
    }));
}

/** Ziele für „Route nach …“ (Inseln mit Kontor ausser `here`); Grund blass, wenn kein Schiff frei ist. */
export function routeTargets(
  world: World,
  here: number,
): { island: number; label: string; reason: string | null }[] {
  const free = freeShipAtHome(world) !== null;
  const out: { island: number; label: string; reason: string | null }[] = [];
  world.islands.forEach((isl, i) => {
    if (i === here || isl.kontorId === null) return;
    out.push({
      island: i,
      label: `Route nach ${islandName(world, i)}`,
      reason: free ? null : 'Kein freies Schiff',
    });
  });
  return out;
}

/** Wählbare Güter: freigeschaltete, solche mit Bestand über der Standard-Reserve auf der Quellseite zuerst. */
export function goodChoices(
  world: World,
  here: number,
  other: number,
): { fetch: GoodId[]; bring: GoodId[] } {
  const order = (source: number): GoodId[] => {
    const stock = world.islands[source]?.stock;
    const open = GOOD_IDS.filter((g) => goodUnlocked(world, g));
    const rich = (g: GoodId): boolean => stock !== undefined && stock[g] > ROUTE_RESERVE.default;
    return [...open.filter(rich), ...open.filter((g) => !rich(g))];
  };
  return { fetch: order(other), bring: order(here) };
}

/** Route aus den zwei Klicks: `here` = `a`, `other` = `b`; „Holen“ → `ba`, „Bringen“ → `ab`. */
export function routeFromClick(here: number, other: number, good: GoodId, dir: RouteDir): Route {
  const entry = [{ good, reserve: ROUTE_RESERVE.default }];
  return { a: here, b: other, ab: dir === 'bring' ? entry : [], ba: dir === 'fetch' ? entry : [] };
}

const routeSig = (r: Route): string =>
  `${r.a}-${r.b}:${r.ab.map((g) => `${g.good}${g.reserve}`).join(',')}:${r.ba
    .map((g) => `${g.good}${g.reserve}`)
    .join(',')}`;

/** Struktur des Abschnitts (Schiffe, Ziele, freigeschaltete Güter): ändert sich nur, wenn das DOM neu gebaut werden muss (nicht mit `left` oder Ladung). */
export function shipsKey(world: World, island: number): string {
  const rows = world.ships
    .filter((s) => related(world, s, island))
    .sort((a, b) => a.id - b.id)
    .map(
      (s) =>
        `${s.id}${s.route === null ? '-' : routeSig(s.route)}${s.to === null ? 'd' : 'f'}${s.homing ? 'h' : ''}`,
    );
  const targets = routeTargets(world, island).map((t) => t.island);
  const goods = GOOD_IDS.filter((g) => goodUnlocked(world, g)).join(',');
  return `${rows.join('|')}#${targets.join(',')}#${freeShipAtHome(world)?.id ?? '-'}#${goods}`;
}

function shipParts(world: World, ship: Ship): string[] {
  const where =
    ship.to !== null
      ? `nach ${islandName(world, ship.to)}`
      : `liegt in ${islandName(world, ship.port)}`;
  return ship.to !== null
    ? ['Handelsschiff', cargoText(ship), where, restClock(ship.left)]
    : ['Handelsschiff', cargoText(ship), where];
}

/** `„Handelsschiff · 30 Gewürz · nach Heimat · 0:37“`; leer bei unbekannter id. */
export function shipTooltip(world: World, id: number): string {
  const ship = ships(world, id);
  return ship === undefined ? '' : shipParts(world, ship).join(' · ');
}

/** Mouse-over-Karte des Schiffs (Titel und zwei Zeilen); `null` bei unbekannter id. */
export function shipHover(world: World, id: number): { title: string; lines: string[] } | null {
  const ship = ships(world, id);
  if (ship === undefined) return null;
  const [, cargo, where, rest] = shipParts(world, ship);
  return {
    title: 'Handelsschiff',
    lines: [cargo!, rest === undefined ? where! : `${where} · ${rest}`],
  };
}

/** Meldungen „<n> <Gut> verloren“ für alle Verluste eines Frames (je Schiff und Gut summiert; qa-B6). */
export function lossMessages(reports: readonly StepReport[]): string[] {
  const sums = new Map<number, Map<GoodId, number>>();
  for (const r of reports)
    for (const l of r.lost) {
      const per = sums.get(l.ship) ?? new Map<GoodId, number>();
      per.set(l.good, (per.get(l.good) ?? 0) + l.n);
      sums.set(l.ship, per);
    }
  const out: string[] = [];
  for (const id of [...sums.keys()].sort((a, b) => a - b))
    for (const g of GOOD_IDS) {
      const n = sums.get(id)!.get(g) ?? 0;
      if (n > 0) out.push(`${n} ${GOODS[g].name} verloren`);
    }
  return out;
}

/** Probelauf der Sim-Aktionen auf einer flachen Kopie: nur Teile, die die Aktion verändert, werden kopiert. */
function dryWorld(world: World): World {
  return {
    ...world,
    ships: world.ships.map((s) => ({ ...s, cargo: { ...s.cargo } })),
    islands: world.islands.map((isl, i) =>
      i === HOME ? { ...isl, stock: { ...isl.stock } } : isl,
    ),
  };
}

/** Kauf-Knopf: Beschriftung aus `SHIP`, Grund (Sim, roh) oder `null`. */
export function buyShipView(world: World): { label: string; reason: string | null } {
  const r = buyShip(dryWorld(world));
  return {
    label: `Handelsschiff kaufen (${costLine(SHIP.cost)})`,
    reason: r.ok ? null : r.reason,
  };
}

/** Grund (Sim, roh), warum `retireShip` scheitern würde, oder `null`. */
export function retireView(world: World, shipId: number): { reason: string | null } {
  const r = retireShip(dryWorld(world), shipId);
  return { reason: r.ok ? null : r.reason };
}

// ---------------------------------------------------------------- DOM

const el = <K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] => {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
};

const field = (tag: 'span' | 'p' | 'small', name: string, className?: string): HTMLElement => {
  const e = el(tag, className);
  e.dataset.field = name;
  return e;
};

function button(
  label: string,
  onClick: () => void,
  className = 'btn btn-small',
  name?: string,
): HTMLButtonElement {
  const b = el('button', className, label);
  b.type = 'button';
  if (name !== undefined) b.dataset.field = name;
  b.addEventListener('click', () => {
    b.blur();
    onClick();
  });
  return b;
}

interface SectionState {
  picker: number | null;
  highlight: number | null;
  key: string;
  actions: ShipActions;
  island: number;
}

const states = new WeakMap<HTMLElement, SectionState>();

function setText(root: HTMLElement, name: string, text: string): void {
  const e = root.querySelector<HTMLElement>(`[data-field="${name}"]`);
  if (e && e.textContent !== text) e.textContent = text;
}

/** Güterwahl nach Klick 1: „Holen (<Name> → hier)“ und „Bringen (hier → <Name>)“. */
function buildPicker(box: HTMLElement, world: World, st: SectionState, rebuild: () => void): void {
  const other = st.picker!;
  const name = islandName(world, other);
  const choices = goodChoices(world, st.island, other);
  const group = (title: string, goods: GoodId[], dir: RouteDir): void => {
    box.appendChild(el('h4', 'ship-picker-title', title));
    const list = el('div', 'ship-goods');
    for (const g of goods)
      list.appendChild(
        button(GOODS[g].name, () => {
          st.picker = null;
          rebuild();
          st.actions.startRoute(routeFromClick(st.island, other, g, dir));
        }),
      );
    box.appendChild(list);
  };
  group(`Holen (${name} → hier)`, choices.fetch, 'fetch');
  group(`Bringen (hier → ${name})`, choices.bring, 'bring');
  box.appendChild(
    button('Abbrechen', () => {
      st.picker = null;
      rebuild();
    }),
  );
}

function reserveButtons(
  line: HTMLElement,
  ship: Ship,
  st: SectionState,
  dir: RouteDir,
  entry: RouteGood,
): void {
  const route = ship.route!;
  const edit = (change: (list: RouteGood[]) => RouteGood[]): void => {
    const lists = dirLists(route, st.island);
    const next = { ...lists, [dir]: change(lists[dir].map((g) => ({ ...g }))) };
    st.actions.changeRoute(ship.id, withLists(route, st.island, next.fetch, next.bring));
  };
  const setReserve = (delta: number): void =>
    edit((list) =>
      list.map((g) =>
        g.good === entry.good
          ? { ...g, reserve: Math.min(ROUTE_RESERVE.max, Math.max(0, g.reserve + delta)) }
          : g,
      ),
    );
  const minus = button('−', () => setReserve(-ROUTE_RESERVE.step));
  minus.title = `Reserve um ${ROUTE_RESERVE.step} senken`;
  const plus = button('+', () => setReserve(ROUTE_RESERVE.step));
  plus.title = `Reserve um ${ROUTE_RESERVE.step} erhöhen`;
  const drop = button('×', () => edit((list) => list.filter((g) => g.good !== entry.good)));
  drop.title = `${GOODS[entry.good].name} von der Route nehmen`;
  line.append(minus, plus, drop);
}

/** Auswahl „weiteres Gut“ je Richtung; Gut in der Gegenrichtung ist blass mit dem Hinweis. */
function addGoodSelect(
  box: HTMLElement,
  world: World,
  ship: Ship,
  st: SectionState,
  dir: RouteDir,
): void {
  const route = ship.route!;
  const lists = dirLists(route, st.island);
  const other = dir === 'fetch' ? lists.bring : lists.fetch;
  const own = lists[dir];
  const sel = el('select', 'ship-add');
  sel.title = dir === 'fetch' ? 'Weiteres Gut holen' : 'Weiteres Gut bringen';
  sel.appendChild(new Option(dir === 'fetch' ? '+ Holen …' : '+ Bringen …', ''));
  for (const g of GOOD_IDS) {
    if (!goodUnlocked(world, g) || own.some((x) => x.good === g)) continue;
    const opp = other.some((x) => x.good === g);
    const o = new Option(
      opp ? `${GOODS[g].name} — Fährt schon in Gegenrichtung` : GOODS[g].name,
      g,
    );
    o.disabled = opp;
    sel.appendChild(o);
  }
  sel.addEventListener('change', () => {
    if (sel.value === '') return;
    const good = sel.value as GoodId;
    const next = { ...lists, [dir]: [...own, { good, reserve: ROUTE_RESERVE.default }] };
    st.actions.changeRoute(ship.id, withLists(route, st.island, next.fetch, next.bring));
  });
  box.appendChild(sel);
}

function buildRow(world: World, ship: Ship, st: SectionState): HTMLElement {
  const row = el('div', 'ship-row');
  row.dataset.ship = String(ship.id);
  const head = el('div', 'ship-head');
  head.append(
    field('span', `ship-target-${ship.id}`, 'ship-target'),
    field('span', `ship-rest-${ship.id}`, 'ship-rest'),
  );
  row.appendChild(head);
  row.appendChild(field('p', `ship-cargo-${ship.id}`, 'panel-line'));
  if (ship.route !== null || ship.homing)
    row.appendChild(field('p', `ship-route-${ship.id}`, 'panel-line'));
  if (ship.route !== null) {
    const lists = dirLists(ship.route, st.island);
    const other = islandName(world, st.island === ship.route.a ? ship.route.b : ship.route.a);
    for (const dir of ['fetch', 'bring'] as const) {
      for (const g of lists[dir]) {
        const line = el('div', 'ship-good');
        const verb = dir === 'fetch' ? `holen aus ${other}` : `bringen nach ${other}`;
        line.appendChild(el('span', 'ship-good-name', `${GOODS[g.good].name} ${verb}`));
        line.appendChild(el('span', 'ship-reserve', `Reserve ${g.reserve}`));
        reserveButtons(line, ship, st, dir, g);
        row.appendChild(line);
      }
    }
    const adders = el('div', 'ship-adders');
    addGoodSelect(adders, world, ship, st, 'fetch');
    addGoodSelect(adders, world, ship, st, 'bring');
    row.appendChild(adders);
  }
  const actions = el('div', 'panel-actions');
  if (ship.route !== null)
    actions.appendChild(button('Route auflösen', () => st.actions.clearRoute(ship.id), 'btn'));
  if (st.island === HOME) {
    actions.appendChild(
      button('Ausmustern', () => st.actions.retire(ship.id), 'btn', `retire-${ship.id}`),
    );
    actions.appendChild(field('small', `retire-reason-${ship.id}`, 'negative'));
  }
  row.appendChild(actions);
  return row;
}

function build(box: HTMLElement, world: World, st: SectionState): void {
  const rebuild = (): void => {
    build(box, world, st);
  };
  box.replaceChildren();
  box.appendChild(el('h3', 'ships-title', 'Schiffe'));
  const rows = world.ships.filter((s) => related(world, s, st.island)).sort((a, b) => a.id - b.id);
  if (rows.length === 0) box.appendChild(el('p', 'panel-line', 'Kein Schiff'));
  for (const s of rows) box.appendChild(buildRow(world, s, st));
  if (st.island === HOME) {
    const buy = button('', () => st.actions.buy(), 'btn', 'ship-buy');
    box.appendChild(buy);
    box.appendChild(field('p', 'ship-buy-reason', 'negative'));
  }
  const targets = routeTargets(world, st.island);
  if (targets.length > 0) {
    const bar = el('div', 'panel-actions');
    for (const t of targets) {
      const b = button(
        t.label,
        () => {
          if (t.reason !== null) {
            st.actions.reject(t.reason);
            return;
          }
          st.picker = t.island;
          rebuild();
        },
        'btn',
        `route-to-${t.island}`,
      );
      bar.appendChild(b);
    }
    box.appendChild(bar);
    box.appendChild(field('p', 'route-reason', 'negative'));
  }
  if (st.picker !== null) {
    const picker = el('div', 'ship-picker');
    buildPicker(picker, world, st, rebuild);
    box.appendChild(picker);
  }
  st.key = `${shipsKey(world, st.island)}@${st.picker ?? '-'}`;
  applyHighlight(box, st);
}

function applyHighlight(box: HTMLElement, st: SectionState): void {
  for (const row of box.querySelectorAll<HTMLElement>('.ship-row'))
    row.classList.toggle('ship-row--hl', row.dataset.ship === String(st.highlight));
}

/** Hängt den Schiffsabschnitt an das Panel (nur beim Öffnen aufrufen). */
export function renderShipSection(
  panel: HTMLElement,
  world: World,
  island: number,
  actions: ShipActions,
): void {
  const box = el('div', 'ships');
  box.dataset.field = 'ships';
  const st: SectionState = { picker: null, highlight: null, key: '', actions, island };
  states.set(box, st);
  panel.appendChild(box);
  build(box, world, st);
  updateShipSection(panel, world);
}

/** Je Tick: DOM nur bei geänderter Struktur neu, sonst nur Texte (Ladung, Ziel, Restzeit, Gründe). */
export function updateShipSection(panel: HTMLElement, world: World): void {
  const box = panel.querySelector<HTMLElement>('[data-field="ships"]');
  const st = box ? states.get(box) : undefined;
  if (!box || !st) return;
  if (st.key !== `${shipsKey(world, st.island)}@${st.picker ?? '-'}`) build(box, world, st);
  for (const row of shipRows(world, st.island)) {
    setText(box, `ship-target-${row.id}`, row.target);
    setText(box, `ship-rest-${row.id}`, row.rest ?? '');
    setText(box, `ship-cargo-${row.id}`, `Ladung: ${row.cargo}`);
    setText(box, `ship-route-${row.id}`, row.route ?? '');
    const retire = box.querySelector<HTMLElement>(`[data-field="retire-${row.id}"]`);
    if (retire) {
      const why = retireView(world, row.id).reason;
      retire.classList.toggle('unaffordable', why !== null);
      retire.title = why ?? 'Schiff ausmustern';
      setText(box, `retire-reason-${row.id}`, why ?? '');
    }
  }
  const buy = box.querySelector<HTMLElement>('[data-field="ship-buy"]');
  if (buy) {
    const v = buyShipView(world);
    const why =
      v.reason === null ? null : friendlyReason(world, v.reason, { cost: SHIP.cost, island: HOME });
    setText(box, 'ship-buy', v.label);
    buy.classList.toggle('unaffordable', why !== null);
    setText(box, 'ship-buy-reason', why ?? '');
  }
  for (const t of routeTargets(world, st.island)) {
    const b = box.querySelector<HTMLElement>(`[data-field="route-to-${t.island}"]`);
    b?.classList.toggle('unaffordable', t.reason !== null);
    if (b) b.title = t.reason ?? t.label;
  }
  const reasons = routeTargets(world, st.island).find((t) => t.reason !== null)?.reason ?? null;
  setText(box, 'route-reason', reasons ?? '');
}

/** Hebt die Zeile eines Schiffs hervor (Klick auf das Schiff in der Karte) und scrollt sie ins Bild. */
export function highlightShip(panel: HTMLElement, id: number | null): void {
  const box = panel.querySelector<HTMLElement>('[data-field="ships"]');
  const st = box ? states.get(box) : undefined;
  if (!box || !st) return;
  st.highlight = id;
  applyHighlight(box, st);
  if (id !== null)
    box.querySelector<HTMLElement>(`[data-ship="${id}"]`)?.scrollIntoView?.({ block: 'nearest' });
}
