import { createRng } from './rng';
import { BUILDING_DEFS } from './defs/buildings';
import {
  ARCHIPEL_SPAN_MAX,
  FALLBACK_DIRECTIONS,
  FALLBACK_MOUNTAIN_SIDE,
  ISLAND_GAP_MIN,
  ISLAND_RIM,
  ISLAND_TRIES,
  ISLANDS,
  ISLANDS_SALT,
  PLANTATION_SITE,
  SHIP_TICKS_PER_SEA_TILE,
  type IslandDef,
  type IslandKind,
} from './defs/sea';
import { findKontorSite, generateTerrain, isLand, seaMask } from './mapgen';
import type { Terrain } from './types';

export type Pt = { x: number; y: number };
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export interface IslandShape {
  kind: IslandKind;
  width: number;
  height: number;
  terrain: Terrain[];
  kontorSite: Pt;
  plantationSites: Pt[];
  quarrySites: Pt[];
  anchor: Pt;
}
export interface PlacedIsland extends IslandShape {
  ox: number;
  oy: number;
}
export interface LaneIsland {
  ox: number;
  oy: number;
  width: number;
  height: number;
  anchor: Pt;
}
export interface Lane {
  a: number;
  b: number;
  points: Pt[];
  d: number;
}

const EPS = 1e-9;
const NEIGHBORS: readonly Pt[] = [
  { x: 0, y: -1 },
  { x: -1, y: 0 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
];

export const travelTicks = (d: number): number => SHIP_TICKS_PER_SEA_TILE * d;

/** Fahrzeit zwischen zwei Inseln in Ticks (Lane `{min, max}`); `a === b` → 0. */
export function laneTicks(islands: readonly LaneIsland[], a: number, b: number): number {
  if (a === b) return 0;
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  const lane = seaLanes(islands).find((l) => l.a === lo && l.b === hi);
  return lane === undefined ? 0 : travelTicks(lane.d);
}

// ---------- Anker ----------

/** Wasserkachel (Meer, 4er an Land) mit kleinstem Abstand zur Kontormitte; Gleichstand: y, dann x. */
export function homeAnchor(terrain: Terrain[], w: number, h: number, kontor: Pt): Pt {
  const sea = seaMask(terrain, w, h);
  const at = (x: number, y: number): Terrain | undefined =>
    x < 0 || y < 0 || x >= w || y >= h ? undefined : terrain[y * w + x];
  let best: Pt = { x: 0, y: 0 };
  let bestDist = Infinity;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!sea[y * w + x]) continue;
      if (!NEIGHBORS.some((n) => isLand(at(x + n.x, y + n.y)))) continue;
      const dx = x - (kontor.x + 1);
      const dy = y - (kontor.y + 1);
      const dist = dx * dx + dy * dy;
      if (dist < bestDist) {
        bestDist = dist;
        best = { x, y };
      }
    }
  return best;
}

function hasAnchor(terrain: Terrain[], w: number, h: number): boolean {
  const sea = seaMask(terrain, w, h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!sea[y * w + x]) continue;
      const near = NEIGHBORS.some((n) => {
        const nx = x + n.x;
        const ny = y + n.y;
        return nx >= 0 && ny >= 0 && nx < w && ny < h && isLand(terrain[ny * w + nx]);
      });
      if (near) return true;
    }
  return false;
}

// ---------- Bauplätze ----------

const key = (x: number, y: number): string => `${x},${y}`;

function plantationOk(terrain: Terrain[], size: number, occupied: Set<string>, p: Pt): boolean {
  const rule = PLANTATION_SITE.site[0];
  const cx = p.x + PLANTATION_SITE.w / 2;
  const cy = p.y + PLANTATION_SITE.h / 2;
  const r = Math.ceil(rule.radius);
  let n = 0;
  for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      if (x < 0 || y < 0 || x >= size || y >= size) continue;
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (Math.sqrt(dx * dx + dy * dy) > rule.radius) continue;
      if (terrain[y * size + x] === rule.terrain && !occupied.has(key(x, y))) n++;
    }
  return n >= rule.min;
}

function quarryOk(terrain: Terrain[], size: number, p: Pt): boolean {
  const rule = BUILDING_DEFS.quarry.site[0];
  if (rule?.kind !== 'adjacent') return false;
  const n = NEIGHBORS.filter((o) => {
    const x = p.x + o.x;
    const y = p.y + o.y;
    return x >= 0 && y >= 0 && x < size && y < size && terrain[y * size + x] === rule.terrain;
  }).length;
  return n >= rule.min;
}

function footprintFree(
  terrain: Terrain[],
  size: number,
  occupied: Set<string>,
  p: Pt,
  w: number,
  h: number,
): boolean {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) {
      const x = p.x + dx;
      const y = p.y + dy;
      if (x >= size || y >= size || !isLand(terrain[y * size + x]) || occupied.has(key(x, y)))
        return false;
    }
  return true;
}

function claim(occupied: Set<string>, p: Pt, w: number, h: number): void {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) occupied.add(key(p.x + dx, p.y + dy));
}

function release(occupied: Set<string>, p: Pt, w: number, h: number): void {
  for (let dy = 0; dy < h; dy++)
    for (let dx = 0; dx < w; dx++) occupied.delete(key(p.x + dx, p.y + dy));
}

/** Gierig zeilenweise: bis zu `count` freie Plätze; `rule` sieht den Kandidaten schon belegt. */
function findSites(
  terrain: Terrain[],
  size: number,
  occupied: Set<string>,
  count: number,
  w: number,
  h: number,
  rule: (p: Pt) => boolean,
): Pt[] {
  const out: Pt[] = [];
  for (let y = 0; y < size && out.length < count; y++)
    for (let x = 0; x < size && out.length < count; x++) {
      const p = { x, y };
      if (!footprintFree(terrain, size, occupied, p, w, h)) continue;
      claim(occupied, p, w, h);
      if (rule(p)) out.push(p);
      else release(occupied, p, w, h);
    }
  return out;
}

/** Baut die Form samt Plätzen und Anker; `null`, wenn eine Garantie nicht erfüllt ist. */
function buildShape(def: IslandDef, terrain: Terrain[]): IslandShape | null {
  const size = def.size;
  const kontorSite = findKontorSite(terrain, size, size);
  if (!kontorSite || !hasAnchor(terrain, size, size)) return null;
  const occupied = new Set<string>();
  claim(occupied, kontorSite, 2, 2);
  const { w, h } = PLANTATION_SITE;
  const plantationSites: Pt[] = [];
  // Ein neuer Platz darf die freie Weide früherer Plantagen nicht unter das Minimum drücken.
  const plantationsOk = (): boolean =>
    plantationSites.every((q) => plantationOk(terrain, size, occupied, q));
  findSites(terrain, size, occupied, def.plantations, w, h, (p) => {
    plantationSites.push(p);
    const ok = plantationsOk();
    if (!ok) plantationSites.pop();
    return ok;
  });
  const quarrySites = findSites(
    terrain,
    size,
    occupied,
    def.quarries,
    1,
    1,
    (p) => quarryOk(terrain, size, p) && plantationsOk(),
  );
  if (plantationSites.length < def.plantations || quarrySites.length < def.quarries) return null;
  const anchor = homeAnchor(terrain, size, size, kontorSite);
  return {
    kind: def.kind,
    width: size,
    height: size,
    terrain,
    kontorSite,
    plantationSites,
    quarrySites,
    anchor,
  };
}

function clipRim(terrain: Terrain[], size: number, kind: IslandKind): Terrain[] {
  return terrain.map((t, i) => {
    const x = i % size;
    const y = (i - x) / size;
    const inner =
      x >= ISLAND_RIM && y >= ISLAND_RIM && x < size - ISLAND_RIM && y < size - ISLAND_RIM;
    if (!inner) return 'water';
    return kind === 'A' && t === 'mountain' ? 'grass' : t;
  });
}

function fallbackTerrain(size: number, kind: IslandKind): Terrain[] {
  const out: Terrain[] = new Array<Terrain>(size * size);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const inner =
        x >= ISLAND_RIM && y >= ISLAND_RIM && x < size - ISLAND_RIM && y < size - ISLAND_RIM;
      const block =
        kind === 'B' &&
        x < ISLAND_RIM + FALLBACK_MOUNTAIN_SIDE &&
        y < ISLAND_RIM + FALLBACK_MOUNTAIN_SIDE;
      out[y * size + x] = !inner ? 'water' : block ? 'mountain' : 'grass';
    }
  return out;
}

function makeShape(def: IslandDef, rng: () => number, failShapes: boolean): IslandShape {
  for (let i = 0; i < ISLAND_TRIES; i++) {
    const noiseSeed = Math.floor(rng() * 2 ** 31);
    if (failShapes) continue;
    const shape = buildShape(
      def,
      clipRim(generateTerrain(noiseSeed, def.size, def.size), def.size, def.kind),
    );
    if (shape) return shape;
  }
  const shape = buildShape(def, fallbackTerrain(def.size, def.kind));
  if (!shape) throw new Error(`generateForeignIslands: Ersatzform ${def.kind} ungültig`);
  return shape;
}

// ---------- Geometrie ----------

/** Kleinster Strahlparameter t ≥ 0 von p in Richtung u bis zu einer Kante des Rechtecks (p liegt darin). */
export function exitDist(p: Pt, u: Pt, rect: Rect): number {
  let best = Infinity;
  if (u.x > EPS) best = Math.min(best, (rect.x1 - p.x) / u.x);
  else if (u.x < -EPS) best = Math.min(best, (rect.x0 - p.x) / u.x);
  if (u.y > EPS) best = Math.min(best, (rect.y1 - p.y) / u.y);
  else if (u.y < -EPS) best = Math.min(best, (rect.y0 - p.y) / u.y);
  return Math.max(0, best);
}

/** Anteil t ∈ [0, 1] des Segments a→b, der im Rechteck liegt (Liang-Barsky). */
export function clipInside(a: Pt, b: Pt, rect: Rect): number {
  let t0 = 0;
  let t1 = 1;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const checks: [number, number][] = [
    [-dx, a.x - rect.x0],
    [dx, rect.x1 - a.x],
    [-dy, a.y - rect.y0],
    [dy, rect.y1 - a.y],
  ];
  for (const [p, q] of checks) {
    if (p === 0) {
      if (q < 0) return 0;
      continue;
    }
    const r = q / p;
    if (p < 0) t0 = Math.max(t0, r);
    else t1 = Math.min(t1, r);
    if (t0 > t1) return 0;
  }
  return t1 - t0;
}

const dist = (a: Pt, b: Pt): number => Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);

/** Länge der Polylinie ausserhalb aller (disjunkten) Rechtecke. */
export function seaLength(points: readonly Pt[], rects: readonly Rect[]): number {
  let total = 0;
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    let outside = 1;
    for (const r of rects) outside -= clipInside(a, b, r);
    total += dist(a, b) * Math.max(0, outside);
  }
  return total;
}

const rectOf = (i: LaneIsland): Rect => ({
  x0: i.ox,
  y0: i.oy,
  x1: i.ox + i.width,
  y1: i.oy + i.height,
});

const anchorPt = (i: LaneIsland): Pt => ({
  x: i.ox + i.anchor.x + 0.5,
  y: i.oy + i.anchor.y + 0.5,
});

export function seaLanes(islands: readonly LaneIsland[]): Lane[] {
  const rects = islands.map(rectOf);
  const lanes: Lane[] = [];
  for (let a = 0; a < islands.length; a++)
    for (let b = a + 1; b < islands.length; b++) {
      const points = [anchorPt(islands[a]!), anchorPt(islands[b]!)];
      lanes.push({ a, b, points, d: Math.ceil(seaLength(points, rects)) });
    }
  return lanes;
}

// ---------- Lage ----------

function gapBetween(a: LaneIsland, b: LaneIsland): number {
  const gx = Math.max(a.ox - (b.ox + b.width), b.ox - (a.ox + a.width));
  const gy = Math.max(a.oy - (b.oy + b.height), b.oy - (a.oy + a.height));
  return Math.max(gx, gy);
}

function spanOk(all: readonly LaneIsland[]): boolean {
  const x0 = Math.min(...all.map((i) => i.ox));
  const y0 = Math.min(...all.map((i) => i.oy));
  const x1 = Math.max(...all.map((i) => i.ox + i.width));
  const y1 = Math.max(...all.map((i) => i.oy + i.height));
  return x1 - x0 + (y1 - y0) <= ARCHIPEL_SPAN_MAX;
}

function lanesClear(all: readonly LaneIsland[]): boolean {
  const rects = all.map(rectOf);
  return seaLanes(all).every((lane) =>
    rects.every(
      (r, k) =>
        k === lane.a || k === lane.b || clipInside(lane.points[0]!, lane.points[1]!, r) < EPS,
    ),
  );
}

function layoutValid(placed: readonly LaneIsland[], cand: LaneIsland, def: IslandDef): boolean {
  if (placed.some((p) => gapBetween(p, cand) < ISLAND_GAP_MIN)) return false;
  const all = [...placed, cand];
  if (!spanOk(all) || !lanesClear(all)) return false;
  const d = seaLanes(all).find((l) => l.a === 0 && l.b === all.length - 1)!.d;
  return d >= def.dMin && d <= def.dMax;
}

/** Ursprung der Insel, deren Anker `t` Seekacheln vom Heimatanker in Richtung θ liegt. */
function originFor(home: LaneIsland, shape: IslandShape, theta: number, t: number): Pt {
  const u = { x: Math.cos(theta), y: Math.sin(theta) };
  const h = anchorPt(home);
  const s0 = exitDist(h, u, rectOf(home));
  const local: Rect = { x0: 0, y0: 0, x1: shape.width, y1: shape.height };
  const e = exitDist(
    { x: shape.anchor.x + 0.5, y: shape.anchor.y + 0.5 },
    { x: -u.x, y: -u.y },
    local,
  );
  const s = s0 + t + e;
  return {
    x: Math.round(h.x + u.x * s - shape.anchor.x - 0.5),
    y: Math.round(h.y + u.y * s - shape.anchor.y - 0.5),
  };
}

function place(
  home: LaneIsland,
  placed: readonly LaneIsland[],
  shape: IslandShape,
  def: IslandDef,
  rng: () => number,
): PlacedIsland {
  const cand = (o: Pt): PlacedIsland & LaneIsland => ({ ...shape, ox: o.x, oy: o.y });
  for (let i = 0; i < ISLAND_TRIES; i++) {
    const theta = rng() * 2 * Math.PI;
    const t = def.dMin + rng() * (def.dMax - def.dMin + 1);
    const c = cand(originFor(home, shape, theta, t));
    if (layoutValid(placed, c, def)) return c;
  }
  for (let k = 0; k < FALLBACK_DIRECTIONS; k++)
    for (let t = def.dMin; t <= def.dMax; t++) {
      const c = cand(originFor(home, shape, (k * 2 * Math.PI) / FALLBACK_DIRECTIONS, t));
      if (layoutValid(placed, c, def)) return c;
    }
  throw new Error(`generateForeignIslands: keine Lage für Insel ${def.kind}`);
}

export function generateForeignIslands(
  seed: number,
  home: LaneIsland,
  opts: { failShapes?: boolean } = {},
): PlacedIsland[] {
  const rng = createRng((seed ^ ISLANDS_SALT) >>> 0);
  const placed: PlacedIsland[] = [];
  for (const def of ISLANDS) {
    const shape = makeShape(def, rng, opts.failShapes === true);
    placed.push(place(home, [home, ...placed], shape, def, rng));
  }
  return placed;
}
