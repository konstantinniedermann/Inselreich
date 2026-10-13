import { ROAD_COST } from '../sim/defs/buildings';
import { placeRoad } from '../sim/build';
import { affordBuild, canPlaceRoad } from '../sim/placement';
import type { World } from '../sim/types';
import { tileAt, type Pos } from '../sim/world';

export type LineState = 'new' | 'exists' | 'blocked';
export interface LineTile extends Pos {
  state: LineState;
}
export interface LinePlan {
  tiles: LineTile[];
  newCount: number;
  cost: number;
  affordable: boolean;
  /** Erster Grund (aus der Sim), warum nicht alles gebaut wird; `null`, wenn alles baubar ist. */
  stopReason: string | null;
}

function run(from: Pos, to: Pos, axis: 'x' | 'y'): Pos[] {
  const out: Pos[] = [];
  const p = { ...from };
  const d = Math.sign(to[axis] - from[axis]);
  while (p[axis] !== to[axis]) {
    p[axis] += d;
    out.push({ ...p });
  }
  return out;
}

/** Kachelpfad von `a` nach `b`, beide Enden inklusive: gerade bei gleicher Achse, sonst L (längerer Schenkel zuerst, bei Gleichstand x). */
export function linePath(a: Pos, b: Pos): Pos[] {
  const xFirst = Math.abs(b.x - a.x) >= Math.abs(b.y - a.y);
  const first = xFirst ? 'x' : 'y';
  const second = xFirst ? 'y' : 'x';
  const corner = { ...a, [first]: b[first] } as Pos;
  return [{ ...a }, ...run(a, corner, first), ...run(corner, b, second)];
}

/** Vorschau eines Linienbaus (nur lesend): was neu entsteht, was schon steht, was blockiert ist. */
export function linePlan(world: World, island: number, path: readonly Pos[]): LinePlan {
  const isl = world.islands[island];
  let stopReason: string | null = null;
  const tiles = path.map((p): LineTile => {
    const tile = isl ? tileAt(isl, p.x, p.y) : undefined;
    if (tile?.road) return { ...p, state: 'exists' };
    const r = canPlaceRoad(world, p.x, p.y, island);
    if (r.ok) return { ...p, state: 'new' };
    stopReason ??= r.reason;
    return { ...p, state: 'blocked' };
  });
  const newCount = tiles.filter((t) => t.state === 'new').length;
  const cost = newCount * ROAD_COST;
  let affordable = true;
  if (newCount > 0) {
    const a = affordBuild(world, island, { money: cost, wood: 0, tools: 0, stone: 0 });
    if (!a.ok) {
      affordable = false;
      stopReason ??= a.reason;
    }
  }
  return { tiles, newCount, cost, affordable, stopReason };
}

/** Baut den Pfad in Reihenfolge mit `placeRoad` (gleiche Einzelaufrufe); endet an der ersten nicht bezahlbaren Kachel. */
export function buildLine(
  world: World,
  island: number,
  path: readonly Pos[],
): { built: number; stopReason: string | null } {
  const isl = world.islands[island];
  let built = 0;
  for (const p of path) {
    if (isl && tileAt(isl, p.x, p.y)?.road) continue;
    if (!canPlaceRoad(world, p.x, p.y, island).ok) continue; // blockiert: übersprungen
    const r = placeRoad(world, p.x, p.y, island);
    if (!r.ok) return { built, stopReason: r.reason };
    built++;
  }
  return { built, stopReason: null };
}

/** Zeile am Zeiger während der Linien-Vorschau (Zählung, Kosten, erster Grund). */
export function lineHintText(
  plan: LinePlan,
  friendly: (reason: string) => string = (r) => r,
): { tone: 'ok' | 'bad'; text: string } {
  const blocked = plan.tiles.filter((t) => t.state === 'blocked').length;
  const head = `Weg-Linie · ${plan.newCount} neue ${plan.newCount === 1 ? 'Weg' : 'Wege'} · ${plan.cost} Geld`;
  if (blocked === 0 && plan.affordable) return { tone: 'ok', text: head };
  const why = plan.stopReason === null ? '' : `: ${friendly(plan.stopReason)}`;
  const lead = blocked > 0 ? `${head} · ${blocked} blockiert` : head;
  return { tone: 'bad', text: `${lead}${why}` };
}
