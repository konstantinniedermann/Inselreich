import { BUILDING_DEFS } from '../sim/defs/buildings';
import { adjacentOf, tileAt, type Pos } from '../sim/world';
import type { World } from '../sim/types';
import { tileToScreen, type Camera } from './camera';

const BOB_PERIOD_MS = 2600;
const BOB_AMPLITUDE = 0.04; // Anteil der Kachelhöhe
const TILT_MAX = 0.06; // rad
const HULL = '#6b4423';
const SAIL = '#f2ecdc';
const OUTLINE = 'rgba(0,0,0,0.6)';

/** Kachel des Händlerschiffs: erste Wasserkachel am Kontor; null ohne Auftrag oder Wasser. */
export function shipTile(world: World): Pos | null {
  if (world.order === null) return null;
  const k = world.buildings[world.kontorId];
  if (!k) return null;
  const def = BUILDING_DEFS[k.defId];
  return (
    adjacentOf(world, k.x, k.y, def.w, def.h).find(
      (p) => tileAt(world, p.x, p.y)?.terrain === 'water',
    ) ?? null
  );
}

/** Zeichnet das Schiff mit leichtem Schaukeln (nur aus `timeMs`). */
export function drawShip(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  timeMs: number,
): void {
  const t = shipTile(world);
  if (!t) return;
  const p = tileToScreen(cam, t.x, t.y);
  const q = tileToScreen(cam, t.x + 1, t.y + 1);
  const w = q.x - p.x;
  const h = q.y - p.y;
  const phase = (timeMs / BOB_PERIOD_MS) * Math.PI * 2;
  ctx.save();
  ctx.translate(p.x + w / 2, p.y + h * 0.6 + Math.sin(phase) * h * BOB_AMPLITUDE);
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
