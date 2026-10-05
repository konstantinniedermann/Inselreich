import { placeRoad } from './build';
import { BUILDING_DEFS, ROAD_COST_OBJ } from './defs/buildings';
import { checkAfford } from './economy';
import { canPlaceRoad } from './placement';
import { needsConnection, reachableRoads } from './roads';
import { fail, ok } from './types';
import type { Result, World } from './types';
import { adjacentOf, idx, inBounds } from './world';
import type { Pos } from './world';

export type ConnectPath = { ok: true; tiles: Pos[] } | { ok: false; reason: string };

const NEIGHBOURS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const;

/** Kosten einer Kachel: vorhandener Weg 0, freie Kachel 1, sonst nicht begehbar (-1). */
function stepCost(world: World, x: number, y: number): number {
  if (world.tiles[idx(world, x, y)]!.road) return 0;
  return canPlaceRoad(world, x, y).ok ? 1 : -1;
}

/** Zielkacheln: erreichbares Netz plus alle Kacheln 4er-angrenzend am Kontor-Grundriss. */
function targetSet(world: World): Set<number> {
  const targets = reachableRoads(world);
  const kontor = world.buildings[world.kontorId];
  if (!kontor) return targets;
  const def = BUILDING_DEFS[kontor.defId];
  for (const p of adjacentOf(world, kontor.x, kontor.y, def.w, def.h))
    targets.add(idx(world, p.x, p.y));
  return targets;
}

/** Neue Kacheln des kürzesten Pfads, vom Gebäude zum Netz; die Welt bleibt unverändert. */
export function connectPath(world: World, id: number): ConnectPath {
  const b = world.buildings[id];
  if (!b) return { ok: false, reason: 'Kein Gebäude' };
  if (!needsConnection(b.defId)) return { ok: false, reason: 'Braucht keinen Weg' };
  if (b.connected) return { ok: false, reason: 'Schon angebunden' };
  const def = BUILDING_DEFS[b.defId];
  const targets = targetSet(world);
  const n = world.width * world.height;
  const dist = new Int32Array(n).fill(-1);
  const prev = new Int32Array(n).fill(-1);
  const done = new Uint8Array(n);
  // Ringpuffer als Deque; jede Kachel wird höchstens je Nachbar einmal eingereiht.
  const cap = 4 * n + 16;
  const buf = new Int32Array(cap);
  let head = 0;
  let size = 0;
  const pushBack = (i: number): void => {
    buf[(head + size++) % cap] = i;
  };
  const pushFront = (i: number): void => {
    head = (head + cap - 1) % cap;
    buf[head] = i;
    size++;
  };

  // Start nach Kosten stabil sortiert (Weg zuerst), damit die Deque monoton bleibt.
  const starts = adjacentOf(world, b.x, b.y, def.w, def.h).map((p) => ({
    i: idx(world, p.x, p.y),
    c: stepCost(world, p.x, p.y),
  }));
  for (const cost of [0, 1]) {
    for (const { i, c } of starts) {
      if (c !== cost || dist[i] !== -1) continue;
      dist[i] = c;
      pushBack(i);
    }
  }

  while (size > 0) {
    const cur = buf[head]!;
    head = (head + 1) % cap;
    size--;
    if (done[cur]) continue;
    done[cur] = 1;
    if (targets.has(cur)) return { ok: true, tiles: collectNew(world, prev, cur) };
    const cx = cur % world.width;
    const cy = Math.floor(cur / world.width);
    for (const [dx, dy] of NEIGHBOURS) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (!inBounds(world, nx, ny)) continue;
      const c = stepCost(world, nx, ny);
      if (c < 0) continue;
      const ni = idx(world, nx, ny);
      const nd = dist[cur]! + c;
      if (dist[ni] !== -1 && dist[ni]! <= nd) continue;
      dist[ni] = nd;
      prev[ni] = cur;
      if (c === 0) pushFront(ni);
      else pushBack(ni);
    }
  }
  return { ok: false, reason: 'Kein Weg zum Kontor möglich' };
}

/** Pfad vom Ziel rückwärts ablaufen, nur freie Kacheln behalten, Reihenfolge Gebäude -> Netz. */
function collectNew(world: World, prev: Int32Array, end: number): Pos[] {
  const tiles: Pos[] = [];
  for (let i = end; i !== -1; i = prev[i]!) {
    if (world.tiles[i]!.road) continue;
    tiles.push({ x: i % world.width, y: Math.floor(i / world.width) });
  }
  return tiles.reverse();
}

/** Baut den Anbindungsweg ganz oder gar nicht; wirft nie. */
export function connectBuilding(world: World, id: number): Result & { built?: number } {
  const path = connectPath(world, id);
  if (!path.ok) return fail(path.reason);
  const n = path.tiles.length;
  const afford = checkAfford(world, { ...ROAD_COST_OBJ, money: ROAD_COST_OBJ.money * n });
  if (!afford.ok) return afford;
  for (const p of path.tiles) {
    const res = placeRoad(world, p.x, p.y);
    if (!res.ok) return res;
  }
  return { ...ok, built: n };
}
