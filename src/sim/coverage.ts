import { BUILDING_DEFS } from './defs/buildings';
import type { Building, ServiceId, World } from './types';
import { center, isKontor } from './world';

/** Alle Dienste; Schlüssel von `Coverage.service` (Bezeichner, keine Spielwerte). */
const SERVICES: readonly ServiceId[] = ['faith', 'school', 'bath'];

/** Abstand der Gebäudemitten (Mitte zu Mitte). */
export function distance(a: Building, b: Building): number {
  const ca = center(BUILDING_DEFS[a.defId], a.x, a.y);
  const cb = center(BUILDING_DEFS[b.defId], b.x, b.y);
  return Math.hypot(ca.cx - cb.cx, ca.cy - cb.cy);
}

/** Versorgt `b` seine Insel: ihr Kontor immer, ein Markt nur, wenn er angebunden ist. */
export function isSupplySource(world: World, b: Building): boolean {
  const kontorId = world.islands[b.island]?.kontorId;
  return (isKontor(b.defId) && b.id === kontorId) || (b.defId === 'market' && b.connected);
}

/** Erbringt `b` den Dienst: angebunden und ohne Ausfall. */
function isServiceSource(b: Building, service: ServiceId): boolean {
  return BUILDING_DEFS[b.defId].service === service && b.connected && b.outageUntil === undefined;
}

/** Dienstgebäude einer Insel in Id-Reihenfolge, angebunden und ohne Ausfall. */
export function serviceBuildings(world: World, island: number, service: ServiceId): Building[] {
  return Object.values(world.buildings).filter(
    (b) => b.island === island && isServiceSource(b, service),
  );
}

/** Quellen je Inselindex, einmal gesammelt; lebt nur innerhalb eines Aufrufs (kein Zwischenspeicher). */
export interface Coverage {
  supply: Building[][];
  service: Record<ServiceId, Building[]>[];
}

/** Ein Durchlauf über alle Gebäude (Id-Reihenfolge); je Insel die Versorgungs- und Dienstquellen. */
export function buildCoverage(world: World): Coverage {
  const supply: Building[][] = world.islands.map(() => []);
  const service = world.islands.map(
    () =>
      Object.fromEntries(SERVICES.map((s) => [s, [] as Building[]])) as Record<
        ServiceId,
        Building[]
      >,
  );
  for (const b of Object.values(world.buildings)) {
    if (supply[b.island] === undefined) continue;
    if (isSupplySource(world, b)) supply[b.island]!.push(b);
    const svc = BUILDING_DEFS[b.defId].service;
    if (svc !== undefined && isServiceSource(b, svc)) service[b.island]![svc].push(b);
  }
  return { supply, service };
}
