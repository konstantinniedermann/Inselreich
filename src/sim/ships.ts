import { ROUTE_GOODS_PER_DIRECTION, ROUTE_RESERVE, SHIP, SHIP_MAX } from './defs/sea';
import { checkAfford, pay } from './economy';
import { islandName } from './islands';
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

/** Gerüst: Bewegung und Umschlag folgen in T09. */
export function tickShips(world: World): ShipLoss[] {
  void world;
  return [];
}
