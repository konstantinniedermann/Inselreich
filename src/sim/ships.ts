import { ROUTE_GOODS_PER_DIRECTION, ROUTE_RESERVE, SHIP, SHIP_MAX } from './defs/sea';
import { GOOD_IDS, STORAGE_CAP } from './defs/goods';
import { checkAfford, pay } from './economy';
import { islandName, laneTicks } from './islands';
import { fail, ok } from './types';
import type { GoodId, Result, Route, RouteGood, Ship, World } from './types';
import { functionLock, goodLock } from './unlocks';
import { home } from './world';

export interface ShipLoss {
  ship: number;
  good: GoodId;
  n: number;
}

const findShip = (world: World, id: number): Ship | undefined =>
  world.ships.find((s) => s.id === id);

const copyRoute = (r: Route): Route => ({
  a: r.a,
  b: r.b,
  ab: r.ab.map((g) => ({ ...g })),
  ba: r.ba.map((g) => ({ ...g })),
});

export function buyShip(world: World): Result {
  const lock = functionLock(world, 'seafaring');
  if (lock !== null) return fail(lock);
  if (world.ships.length >= SHIP_MAX) return fail(`Höchstens ${SHIP_MAX} Schiffe`);
  const afford = checkAfford(world, home(world), SHIP.cost);
  if (!afford.ok) return afford;
  pay(world, home(world), SHIP.cost);
  world.ships.push({
    id: world.nextShipId++,
    port: 0,
    to: null,
    left: 0,
    cargo: {},
    route: null,
    homing: false,
  });
  return ok;
}

export function retireShip(world: World, shipId: number): Result {
  const ship = findShip(world, shipId);
  if (ship === undefined) return fail('Unbekanntes Schiff');
  if (ship.to !== null || ship.port !== 0) return fail('Erst im Heimathafen');
  if (ship.route !== null || ship.homing) return fail('Erst Route auflösen');
  if (Object.values(ship.cargo).some((n) => (n ?? 0) > 0)) return fail('Erst entladen');
  world.ships.splice(world.ships.indexOf(ship), 1);
  return ok;
}

function hasKontor(world: World, island: number): boolean {
  const isl = world.islands[island];
  return isl !== undefined && isl.kontorId !== null;
}

function duplicateGood(route: Route): boolean {
  const all = [...route.ab, ...route.ba].map((g) => g.good);
  return new Set(all).size !== all.length;
}

function goodsReason(world: World, goods: RouteGood[]): string | null {
  for (const g of goods) {
    const lock = goodLock(world, g.good);
    if (lock !== null) return lock;
  }
  return null;
}

const validReserve = (n: number): boolean =>
  Number.isInteger(n) && n >= 0 && n <= ROUTE_RESERVE.max && n % ROUTE_RESERVE.step === 0;

export function validRoute(world: World, route: Route): Result {
  if (route.a === route.b) return fail('Zwei verschiedene Kontore wählen');
  for (const i of [route.a, route.b]) {
    if (!hasKontor(world, i)) return fail(`Kein Kontor auf ${islandName(world, i)}`);
  }
  if (route.ab.length > ROUTE_GOODS_PER_DIRECTION || route.ba.length > ROUTE_GOODS_PER_DIRECTION)
    return fail(`Höchstens ${ROUTE_GOODS_PER_DIRECTION} Güter je Richtung`);
  if (route.ab.length + route.ba.length === 0) return fail('Mindestens ein Gut wählen');
  if (duplicateGood(route)) return fail('Gut fährt schon in Gegenrichtung');
  const lock = goodsReason(world, [...route.ab, ...route.ba]);
  if (lock !== null) return fail(lock);
  if ([...route.ab, ...route.ba].some((g) => !validReserve(g.reserve)))
    return fail(`Reserve in Zehnern 0 bis ${ROUTE_RESERVE.max}`);
  return ok;
}

export function setRoute(world: World, shipId: number, route: Route): Result {
  const ship = findShip(world, shipId);
  if (ship === undefined) return fail('Unbekanntes Schiff');
  if (ship.to !== null) return fail('Schiff ist unterwegs');
  if (ship.route !== null || ship.homing) return fail('Schiff hat schon eine Route');
  const valid = validRoute(world, route);
  if (!valid.ok) return valid;
  ship.route = copyRoute(route);
  return ok;
}

export function updateRoute(world: World, shipId: number, route: Route): Result {
  const ship = findShip(world, shipId);
  if (ship === undefined) return fail('Unbekanntes Schiff');
  if (ship.route === null) return fail('Keine Route');
  if (ship.route.a !== route.a || ship.route.b !== route.b)
    return fail('Route auflösen und neu anlegen');
  const valid = validRoute(world, route);
  if (!valid.ok) return valid;
  const copy = copyRoute(route);
  ship.route.ab = copy.ab;
  ship.route.ba = copy.ba;
  return ok;
}

export function clearRoute(world: World, shipId: number): Result {
  const ship = findShip(world, shipId);
  if (ship === undefined) return fail('Unbekanntes Schiff');
  if (ship.route === null) return fail('Keine Route');
  ship.route = null;
  ship.homing = true;
  return ok;
}

export function freeShipAtHome(world: World): Ship | null {
  let best: Ship | null = null;
  for (const s of world.ships) {
    const free = s.port === 0 && s.to === null && s.route === null && !s.homing;
    if (free && (best === null || s.id < best.id)) best = s;
  }
  return best;
}

type Cargo = Ship['cargo'];

const onBoard = (cargo: Cargo): number =>
  Object.values(cargo).reduce<number>((sum, n) => sum + (n ?? 0), 0);

const otherPort = (route: Route, port: number): number => (port === route.a ? route.b : route.a);

function depart(world: World, ship: Ship, to: number): void {
  ship.to = to;
  ship.left = laneTicks(world.islands, ship.port, to);
}

/** Entlädt jedes Gut ausserhalb `keep` in `GOOD_IDS`-Reihenfolge bis zur Lagergrenze; Rest bleibt an Bord. */
function unload(world: World, ship: Ship, keep: readonly GoodId[]): void {
  const stock = world.islands[ship.port]!.stock;
  for (const good of GOOD_IDS) {
    const have = ship.cargo[good] ?? 0;
    if (have === 0 || keep.includes(good)) continue;
    const n = Math.min(have, Math.max(0, STORAGE_CAP - stock[good]));
    stock[good] += n;
    if (have - n > 0) ship.cargo[good] = have - n;
    else delete ship.cargo[good];
  }
}

function addCargo(ship: Ship, stock: Record<GoodId, number>, good: GoodId, n: number): void {
  if (n <= 0) return;
  stock[good] -= n;
  ship.cargo[good] = (ship.cargo[good] ?? 0) + n;
}

/** Zwei Durchgänge: erst gleiche Anteile `⌊frei₀ / k⌋`, dann Rest der Kapazität in Listenfolge. */
function load(world: World, ship: Ship, list: readonly RouteGood[]): void {
  if (list.length === 0) return;
  const stock = world.islands[ship.port]!.stock;
  const avail = list.map((g) => Math.max(0, stock[g.good] - g.reserve));
  const free0 = SHIP.capacity - onBoard(ship.cargo);
  const share = Math.floor(free0 / list.length);
  let free = free0;
  const taken = list.map(() => 0);
  list.forEach((g, i) => {
    const x = Math.min(avail[i]!, share);
    taken[i] = x;
    free -= x;
    addCargo(ship, stock, g.good, x);
  });
  list.forEach((g, i) => {
    const x = Math.min(avail[i]! - taken[i]!, free);
    free -= x;
    addCargo(ship, stock, g.good, x);
  });
}

/** Heimkehr: entlädt bis zur Lagergrenze, der Rest verfällt und wird gemeldet. */
function unloadAtHome(world: World, ship: Ship, lost: ShipLoss[]): void {
  unload(world, ship, []);
  for (const good of GOOD_IDS) {
    const n = ship.cargo[good] ?? 0;
    if (n > 0) lost.push({ ship: ship.id, good, n });
  }
  ship.cargo = {};
  ship.homing = false;
}

function handleDocked(world: World, ship: Ship, lost: ShipLoss[]): void {
  const route = ship.route;
  if (route !== null) {
    if (ship.port !== route.a && ship.port !== route.b) {
      depart(world, ship, route.a);
      return;
    }
    const list = ship.port === route.a ? route.ab : route.ba;
    unload(
      world,
      ship,
      list.map((g) => g.good),
    );
    load(world, ship, list);
    depart(world, ship, otherPort(route, ship.port));
  } else if (ship.homing) {
    if (ship.port !== 0) depart(world, ship, 0);
    else unloadAtHome(world, ship, lost);
  }
}

/** Fahrt, Umschlag und Abfahrt je Schiff in `id`-Reihenfolge; liefert verfallene Ladung. */
export function tickShips(world: World): ShipLoss[] {
  const lost: ShipLoss[] = [];
  const ordered = [...world.ships].sort((a, b) => a.id - b.id);
  for (const ship of ordered) {
    if (ship.to !== null) {
      ship.left -= 1;
      if (ship.left === 0) {
        ship.port = ship.to;
        ship.to = null;
      }
    }
    if (ship.to === null) handleDocked(world, ship, lost);
  }
  return lost;
}
