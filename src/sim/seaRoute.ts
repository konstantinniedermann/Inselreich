// Fahrlinie zwischen zwei Inselankern nur über Wasser (SEE-F1). Rein lesend, ohne Rng, deterministisch.
import {
  ROUTE_CLEAR,
  ROUTE_DEEP,
  ROUTE_MARGIN,
  ROUTE_MAX_NODES,
  ROUTE_ROUND_RADIUS,
  ROUTE_SHORE_PENALTY,
  ROUTE_STEP,
} from './defs/sea';
import type { Pt } from './islands';
import { seaMask } from './mapgen';
import type { Island } from './types';

interface Grid {
  x0: number;
  y0: number;
  w: number;
  h: number;
  blocked: Uint8Array;
  dist: Int32Array;
}

const DIAG = Math.SQRT2;
const MOVES: readonly (readonly [number, number])[] = [
  [0, -1],
  [-1, 0],
  [1, 0],
  [0, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
];

const cache = new WeakMap<readonly Island[], Map<string, Pt[]>>();

const anchorOf = (i: Island): Pt => ({ x: i.ox + i.anchor.x + 0.5, y: i.oy + i.anchor.y + 0.5 });

/** Blockiert: Land und Binnenseen jeder Insel (nur Meer ist begehbar). */
function buildGrid(islands: readonly Island[]): Grid {
  const x0 = Math.min(...islands.map((i) => i.ox)) - ROUTE_MARGIN;
  const y0 = Math.min(...islands.map((i) => i.oy)) - ROUTE_MARGIN;
  const w = Math.max(...islands.map((i) => i.ox + i.width)) + ROUTE_MARGIN - x0;
  const h = Math.max(...islands.map((i) => i.oy + i.height)) + ROUTE_MARGIN - y0;
  const blocked = new Uint8Array(w * h);
  for (const isl of islands) {
    const sea = seaMask(
      isl.tiles.map((t) => t.terrain),
      isl.width,
      isl.height,
    );
    for (let y = 0; y < isl.height; y++)
      for (let x = 0; x < isl.width; x++)
        if (!sea[y * isl.width + x]) blocked[(isl.oy + y - y0) * w + (isl.ox + x - x0)] = 1;
  }
  return { x0, y0, w, h, blocked, dist: landDistance(blocked, w, h) };
}

/** Multi-Source-BFS (8er) vom Land; Land = 0. Ohne Land überall gross. */
function landDistance(blocked: Uint8Array, w: number, h: number): Int32Array {
  const dist = new Int32Array(w * h).fill(-1);
  const queue = new Int32Array(w * h);
  let head = 0;
  let tail = 0;
  for (let i = 0; i < blocked.length; i++)
    if (blocked[i]) {
      dist[i] = 0;
      queue[tail++] = i;
    }
  while (head < tail) {
    const i = queue[head++]!;
    const x = i % w;
    const y = (i - x) / w;
    for (const [dx, dy] of MOVES) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h || dist[ny * w + nx] !== -1) continue;
      dist[ny * w + nx] = dist[i]! + 1;
      queue[tail++] = ny * w + nx;
    }
  }
  for (let i = 0; i < dist.length; i++) if (dist[i] === -1) dist[i] = ROUTE_DEEP;
  return dist;
}

/** Binärer Min-Heap über (Kosten, Zellindex): feste Tiebreaks. */
class Heap {
  private cost: number[] = [];
  private id: number[] = [];
  get size(): number {
    return this.id.length;
  }
  private less(i: number, j: number): boolean {
    return (
      this.cost[i]! < this.cost[j]! || (this.cost[i] === this.cost[j] && this.id[i]! < this.id[j]!)
    );
  }
  private swap(i: number, j: number): void {
    [this.cost[i], this.cost[j]] = [this.cost[j]!, this.cost[i]!];
    [this.id[i], this.id[j]] = [this.id[j]!, this.id[i]!];
  }
  push(cost: number, id: number): void {
    this.cost.push(cost);
    this.id.push(id);
    let i = this.id.length - 1;
    while (i > 0 && this.less(i, (i - 1) >> 1)) {
      this.swap(i, (i - 1) >> 1);
      i = (i - 1) >> 1;
    }
  }
  pop(): number {
    const top = this.id[0]!;
    const lastCost = this.cost.pop()!;
    const lastId = this.id.pop()!;
    if (this.id.length > 0) {
      this.cost[0] = lastCost;
      this.id[0] = lastId;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < this.id.length && this.less(l, m)) m = l;
        if (r < this.id.length && this.less(r, m)) m = r;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return top;
  }
}

const cellCost = (g: Grid, i: number): number =>
  1 + ROUTE_SHORE_PENALTY * Math.max(0, ROUTE_DEEP - g.dist[i]!);

/** Dijkstra von Zelle `s` nach `t`; Zellfolge oder `null` (nichts gefunden / Deckel). */
function dijkstra(g: Grid, s: number, t: number): number[] | null {
  const best = new Float64Array(g.w * g.h).fill(Infinity);
  const prev = new Int32Array(g.w * g.h).fill(-1);
  const done = new Uint8Array(g.w * g.h);
  const heap = new Heap();
  best[s] = 0;
  heap.push(0, s);
  let nodes = 0;
  while (heap.size > 0) {
    const i = heap.pop();
    if (done[i]) continue;
    done[i] = 1;
    if (i === t) return unwind(prev, s, t);
    if (++nodes > ROUTE_MAX_NODES) return null;
    const x = i % g.w;
    const y = (i - x) / g.w;
    for (const [dx, dy] of MOVES) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= g.w || ny >= g.h) continue;
      const j = ny * g.w + nx;
      if (done[j] || (g.blocked[j] && j !== t)) continue;
      if (dx !== 0 && dy !== 0 && (g.blocked[y * g.w + nx] || g.blocked[ny * g.w + x])) continue;
      const c = best[i]! + cellCost(g, j) * (dx !== 0 && dy !== 0 ? DIAG : 1);
      if (c < best[j]!) {
        best[j] = c;
        prev[j] = i;
        heap.push(c, j);
      }
    }
  }
  return null;
}

function unwind(prev: Int32Array, s: number, t: number): number[] {
  const out = [t];
  for (let i = t; i !== s;) {
    i = prev[i]!;
    out.push(i);
  }
  return out.reverse();
}

const cellAt = (g: Grid, p: Pt): number => {
  const x = Math.floor(p.x) - g.x0;
  const y = Math.floor(p.y) - g.y0;
  return x < 0 || y < 0 || x >= g.w || y >= g.h ? -1 : y * g.w + x;
};

const isWater = (g: Grid, p: Pt): boolean => {
  const c = cellAt(g, p);
  return c < 0 || !g.blocked[c];
};

/** Sichtlinie frei, mit Landabstand mindestens `need` (Zellen ausserhalb des Rasters zählen als frei). */
function sees(g: Grid, a: Pt, b: Pt, need: number): boolean {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  const n = Math.max(1, Math.ceil(len / 0.25));
  for (let k = 0; k <= n; k++) {
    const p = { x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n };
    const c = cellAt(g, p);
    if (c >= 0 && (g.blocked[c] || g.dist[c]! < need)) return false;
  }
  return true;
}

function thin(g: Grid, pts: readonly Pt[]): Pt[] {
  const distAt = (p: Pt): number => g.dist[cellAt(g, p)]!;
  const out = [pts[0]!];
  let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    for (; j > i + 1; j--) {
      const need = Math.min(ROUTE_CLEAR, distAt(pts[i]!), distAt(pts[j]!));
      if (sees(g, pts[i]!, pts[j]!, need)) break;
    }
    out.push(pts[j]!);
    i = j;
  }
  return out;
}

/** Ecken mit quadratischer Bézier-Kurve runden (Radius begrenzt auf halbe Nachbarsegmente). */
function round(pts: readonly Pt[]): Pt[] {
  const out: Pt[] = [pts[0]!];
  for (let i = 1; i < pts.length - 1; i++) {
    const p = pts[i - 1]!;
    const c = pts[i]!;
    const n = pts[i + 1]!;
    const l1 = Math.hypot(c.x - p.x, c.y - p.y);
    const l2 = Math.hypot(n.x - c.x, n.y - c.y);
    const r = Math.min(ROUTE_ROUND_RADIUS, l1 / 2, l2 / 2);
    const a = { x: c.x + ((p.x - c.x) / l1) * r, y: c.y + ((p.y - c.y) / l1) * r };
    const b = { x: c.x + ((n.x - c.x) / l2) * r, y: c.y + ((n.y - c.y) / l2) * r };
    const steps = 8;
    for (let k = 0; k <= steps; k++) {
      const t = k / steps;
      const u = 1 - t;
      out.push({
        x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
        y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
      });
    }
  }
  out.push(pts[pts.length - 1]!);
  return out;
}

/** Polylinie in gleichen Schritten abtasten; Start und Ende exakt. */
function resample(pts: readonly Pt[]): Pt[] {
  const out: Pt[] = [pts[0]!];
  let carry = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]!;
    const b = pts[i]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    let at = ROUTE_STEP - carry;
    for (; at < len; at += ROUTE_STEP)
      out.push({ x: a.x + ((b.x - a.x) * at) / len, y: a.y + ((b.y - a.y) * at) / len });
    carry = len - (at - ROUTE_STEP);
  }
  const end = pts[pts.length - 1]!;
  const last = out[out.length - 1]!;
  if (last.x !== end.x || last.y !== end.y) out.push(end);
  return out;
}

function compute(islands: readonly Island[], a: number, b: number): Pt[] {
  const from = anchorOf(islands[a]!);
  const to = anchorOf(islands[b]!);
  const straight = [from, to];
  const g = buildGrid(islands);
  const cells = dijkstra(g, cellAt(g, from), cellAt(g, to));
  if (cells === null) return straight;
  const centers = cells.map((c) => ({
    x: g.x0 + (c % g.w) + 0.5,
    y: g.y0 + Math.floor(c / g.w) + 0.5,
  }));
  centers[0] = from;
  centers[centers.length - 1] = to;
  const thinned = thin(g, centers);
  for (const candidate of [round(thinned), thinned, centers]) {
    const sampled = resample(candidate);
    if (sampled.every((p) => isWater(g, p))) return sampled;
  }
  return straight;
}

/** Fahrlinie von Anker `a` nach Anker `b` (a < b) über Wasser; Aufrufer können umkehren. */
export function seaRoute(islands: readonly Island[], a: number, b: number): Pt[] {
  let perWorld = cache.get(islands);
  if (perWorld === undefined) cache.set(islands, (perWorld = new Map()));
  const key = `${a}-${b}`;
  let route = perWorld.get(key);
  if (route === undefined) perWorld.set(key, (route = compute(islands, a, b)));
  return route;
}
