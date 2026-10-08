// shipLane.ts — Handelsschiffe auf der Fahrlinie (M12 E4, T11): Pose, Tiefe, Mindestgrösse, Treffer.
// Rein und nur lesend: schreibt nie in `world.ships` (render schreibt nie in die Welt).
import { laneTicks, type Pt } from '../sim/islands';
import { seaRoute } from '../sim/seaRoute';
import type { Island, Ship, World } from '../sim/types';
import { worldToScreen, type Camera } from './camera';
import { project } from './iso';
import { SHIP_ASPECT_H, SHIP_DRAWN_FRAC, SHIP_W_PX } from './ship';

/** Pose in Archipel-Kacheln (Mitte der Raute); `island` = Rechteck, in dem sie liegt, sonst null (offene See). */
export interface ShipPose {
  x: number;
  y: number;
  island: number | null;
}

/** Ziel-Mindestbreite der GEZEICHNETEN Silhouette (Rumpf + Segel) in CSS-Pixeln; Spec-Grenze 12 (D-144 Regel 3), Reserve für Neigung. */
export const MIN_SHIP_CSS_PX = 16;

/** Fahrzeit je Paar, je Welt (Schlüssel: `islands`-Array) einmal gerechnet: `laneTicks` rechnet sonst alle Paare je Frame. */
const ticksCache = new WeakMap<readonly Island[], Map<string, number>>();

function cachedTicks(world: World, from: number, to: number): number {
  let per = ticksCache.get(world.islands);
  if (!per) ticksCache.set(world.islands, (per = new Map()));
  const key = `${from}-${to}`;
  let n = per.get(key);
  if (n === undefined) per.set(key, (n = laneTicks(world.islands, from, to)));
  return n;
}

/** Fahrlinien je Richtung, je Welt (Schlüssel: `islands`-Array): ohne Cache kopiert jeder Aufruf die ganze Linie. */
const pointsCache = new WeakMap<readonly Island[], Map<string, readonly Pt[]>>();

/** Fahrlinie (Wasserroute) von `from` nach `to`; für `from > to` umgedreht. Ohne Lane: leer. Nicht verändern. */
export function lanePoints(world: World, from: number, to: number): readonly Pt[] {
  const lo = Math.min(from, to),
    hi = Math.max(from, to);
  if (lo === hi || !world.islands[lo] || !world.islands[hi]) return [];
  let per = pointsCache.get(world.islands);
  if (!per) pointsCache.set(world.islands, (per = new Map()));
  const key = `${from}-${to}`;
  let pts = per.get(key);
  if (pts === undefined) {
    const fwd = seaRoute(world.islands, lo, hi).map((p) => ({ x: p.x, y: p.y }));
    per.set(key, (pts = from > to ? fwd.reverse() : fwd));
  }
  return pts;
}

/** Punkt bei Anteil `t` ∈ [0, 1] der gesamten Polylinienlänge (nicht des Segmentanteils). */
export function pointAt(points: readonly Pt[], t: number): Pt {
  const first = points[0];
  if (!first) return { x: 0, y: 0 };
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!,
      b = points[i]!;
    const l = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
    lens.push(l);
    total += l;
  }
  const last = points[points.length - 1]!;
  if (total === 0 || t <= 0) return { x: first.x, y: first.y };
  if (t >= 1) return { x: last.x, y: last.y };
  let rest = t * total;
  for (let i = 0; i < lens.length; i++) {
    const l = lens[i]!;
    if (rest <= l) {
      const a = points[i]!,
        b = points[i + 1]!;
      const u = l === 0 ? 0 : rest / l;
      return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u };
    }
    rest -= l;
  }
  return { x: last.x, y: last.y };
}

function islandAt(world: World, x: number, y: number): number | null {
  for (let i = 0; i < world.islands.length; i++) {
    const s = world.islands[i]!;
    if (x >= s.ox && y >= s.oy && x < s.ox + s.width && y < s.oy + s.height) return i;
  }
  return null;
}

/** Pose des Schiffs: liegend (`to` null) am Anker von `port`, sonst `t = 1 − left / laneTicks` auf der Lane. */
export function shipPose(world: World, ship: Ship): ShipPose {
  let p: Pt;
  const port = world.islands[ship.port];
  if (ship.to === null || !port) {
    p = port
      ? { x: port.ox + port.anchor.x + 0.5, y: port.oy + port.anchor.y + 0.5 }
      : { x: 0, y: 0 };
  } else {
    const total = cachedTicks(world, ship.port, ship.to);
    const t = total > 0 ? Math.min(1, Math.max(0, 1 - ship.left / total)) : 1;
    p = pointAt(lanePoints(world, ship.port, ship.to), t);
  }
  return { x: p.x, y: p.y, island: islandAt(world, p.x, p.y) };
}

/** Tiefe auf offener See: nach Insel `isl` zeichnen, wenn `x + y` ≥ Mitte ihrer Tiefenspanne. */
export function seaShipAfter(pose: ShipPose, isl: Island): boolean {
  return pose.x + pose.y >= isl.ox + isl.oy + (isl.width + isl.height) / 2;
}

/** Skalierungsfaktor: mindestens 1; bei kleinem Zoom so gross, dass die gezeichnete Breite ≥ `MIN_SHIP_CSS_PX` bleibt. */
export function shipScale(zoom: number): number {
  return Math.max(1, MIN_SHIP_CSS_PX / (SHIP_W_PX * SHIP_DRAWN_FRAC * zoom));
}

/** Schiffs-id unter dem Bildpunkt (oberstes = grösste Tiefe zuerst, dann grösste id); nur lesend. */
export function shipAt(world: World, cam: Camera, sx: number, sy: number): number | null {
  let best: { id: number; depth: number } | null = null;
  const k = shipScale(cam.zoom) * cam.zoom;
  const w = SHIP_W_PX * k,
    h = SHIP_ASPECT_H * k;
  for (const ship of world.ships) {
    const pose = shipPose(world, ship);
    const c = worldToScreen(cam, project(pose.x, pose.y));
    // Bildrechteck wie in drawShip: Rumpf-Breite ±0,38 w, Mast bis Kiel −0,5 h … +0,2 h
    if (sx < c.x - w * 0.38 || sx > c.x + w * 0.38 || sy < c.y - h * 0.5 || sy > c.y + h * 0.2)
      continue;
    const depth = pose.x + pose.y;
    if (!best || depth > best.depth || (depth === best.depth && ship.id > best.id))
      best = { id: ship.id, depth };
  }
  return best ? best.id : null;
}
