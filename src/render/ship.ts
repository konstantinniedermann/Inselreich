import { BUILDING_DEFS } from '../sim/defs/buildings';
import { adjacentOf, tileAt, type Pos } from '../sim/world';
import type { World } from '../sim/types';
import { worldToScreen, type Camera } from './camera';
import { ISO_H, ISO_W, project, type Pt } from './iso';

const BOB_PERIOD_MS = 2600;
/** Höhe des Schiffs über der Rautenmitte (Weltpixel, Zoom 1). */
export const SHIP_H = 1.2 * ISO_H;
const SHIP_W = 0.8 * ISO_W;
const SHIP_SPAN = 0.7; // Anteil der Formhöhe, der über SHIP_H liegt (Mast bis Kiel)
const BOB_AMPLITUDE = 0.04; // Anteil der Kachelhöhe
const TILT_MAX = 0.06; // rad
const HULL = '#6b4423';
const SAIL = '#f2ecdc';
const OUTLINE = 'rgba(0,0,0,0.6)';
const SHADOW_SHIFT = 0.15; // Kachelraum, Richtung (+3, +1) normiert (D-11)
const SHADOW_A = 0.5,
  SHADOW_B = 0.22; // Halbachsen des Rumpfschattens (Kachelraum)
const SHADOW_DIR = { x: 3 / Math.sqrt(10), y: 1 / Math.sqrt(10) };

/** Schattenpolygon des Schiffs im Kachelraum (Ellipse um die Rautenmitte, nach rechts unten versetzt); Schattendurchgang. */
export function shipShadow(tile: Pos): Pt[] {
  const mx = tile.x + 0.5 + SHADOW_DIR.x * SHADOW_SHIFT,
    my = tile.y + 0.5 + SHADOW_DIR.y * SHADOW_SHIFT;
  const pts: Pt[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const u = Math.cos(a) * SHADOW_A,
      v = Math.sin(a) * SHADOW_B;
    pts.push({
      x: mx + SHADOW_DIR.x * u - SHADOW_DIR.y * v,
      y: my + SHADOW_DIR.y * u + SHADOW_DIR.x * v,
    });
  }
  return pts;
}

/** Kachel des Händlerschiffs: vorderes Wasserfeld am Kontor (grösstes x + y, bei Gleichstand kleineres x, D-18); null ohne Auftrag oder Wasser. */
export function shipTile(world: World): Pos | null {
  if (world.order === null) return null;
  const k = world.buildings[world.kontorId];
  if (!k) return null;
  const def = BUILDING_DEFS[k.defId];
  const water = adjacentOf(world, k.x, k.y, def.w, def.h)
    .filter((p) => tileAt(world, p.x, p.y)?.terrain === 'water')
    .sort((a, b) => b.x + b.y - (a.x + a.y) || a.x - b.x);
  return water[0] ?? null;
}

/** Zeichnet das Schiff mit leichtem Schaukeln (nur aus `timeMs`) an der Rautenmitte von `tile`. */
export function drawShip(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  tile: Pos,
  timeMs: number,
): void {
  const c = worldToScreen(cam, project(tile.x + 0.5, tile.y + 0.5));
  const w = SHIP_W * cam.zoom;
  const h = (SHIP_H / SHIP_SPAN) * cam.zoom;
  const phase = (timeMs / BOB_PERIOD_MS) * Math.PI * 2;
  ctx.save();
  ctx.translate(c.x, c.y + Math.sin(phase) * h * BOB_AMPLITUDE);
  ctx.rotate(Math.sin(phase + 1) * TILT_MAX);
  ctx.lineWidth = 1;
  ctx.strokeStyle = OUTLINE;
  // Rumpf
  ctx.beginPath();
  ctx.moveTo(-w * 0.38, -h * 0.05);
  ctx.lineTo(w * 0.38, -h * 0.05);
  ctx.lineTo(w * 0.26, h * 0.2);
  ctx.lineTo(-w * 0.26, h * 0.2);
  ctx.closePath();
  ctx.fillStyle = HULL;
  ctx.fill();
  ctx.stroke();
  // Mast
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.05);
  ctx.lineTo(0, -h * 0.5);
  ctx.stroke();
  // Segel
  ctx.beginPath();
  ctx.moveTo(w * 0.04, -h * 0.47);
  ctx.lineTo(w * 0.34, -h * 0.12);
  ctx.lineTo(w * 0.04, -h * 0.12);
  ctx.closePath();
  ctx.fillStyle = SAIL;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}
