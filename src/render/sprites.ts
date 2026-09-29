import type { Building, BuildingDef, BuildingDefId, Category } from '../sim/types';

export const BUILDING_COLORS: Record<Category, string> = {
  infrastructure: '#c9a227',
  housing: '#b5651d',
  production: '#4a7fb5',
  public: '#8e5ab8',
};

export const BUILDING_ABBR: Record<BuildingDefId, string> = {
  kontor: 'K',
  market: 'M',
  house: 'H',
  fisher: 'Fi',
  lumberjack: 'Ho',
  quarry: 'St',
  sheepfarm: 'Sc',
  weaver: 'We',
  canefarm: 'Zu',
  distillery: 'Br',
  chapel: 'Ka',
  school: 'Su',
};

/** px/py = linke obere Ecke in Bildschirm-Pixeln, s = Kantenlänge einer Kachel in Pixeln. */
export function drawBuilding(
  ctx: CanvasRenderingContext2D,
  def: BuildingDef,
  b: Building,
  px: number,
  py: number,
  s: number,
): void {
  const w = def.w * s;
  const h = def.h * s;
  const inset = Math.max(1, s * 0.06);
  ctx.fillStyle = BUILDING_COLORS[def.category];
  ctx.fillRect(px + inset, py + inset, w - 2 * inset, h - 2 * inset);
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(px + inset, py + inset, w - 2 * inset, h - 2 * inset);

  ctx.fillStyle = '#fff';
  ctx.font = `bold ${Math.round(s * 0.5)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(BUILDING_ABBR[def.id], px + w / 2, py + h / 2);

  if (!b.connected && def.id !== 'house' && def.id !== 'kontor') {
    ctx.fillStyle = '#e02020';
    ctx.beginPath();
    ctx.arc(px + w - s * 0.2, py + s * 0.2, s * 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawRoad(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  s: number,
  n: { n: boolean; e: boolean; s: boolean; w: boolean },
): void {
  ctx.fillStyle = '#a0865a';
  ctx.fillRect(px, py, s, s);
  const c = s / 2;
  ctx.strokeStyle = '#c9b48a';
  ctx.lineWidth = Math.max(2, s * 0.25);
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(px + c, py + c);
  if (n.n) ctx.lineTo(px + c, py);
  ctx.moveTo(px + c, py + c);
  if (n.e) ctx.lineTo(px + s, py + c);
  ctx.moveTo(px + c, py + c);
  if (n.s) ctx.lineTo(px + c, py + s);
  ctx.moveTo(px + c, py + c);
  if (n.w) ctx.lineTo(px, py + c);
  ctx.stroke();
  ctx.fillStyle = '#c9b48a';
  ctx.fillRect(px + c - s * 0.125, py + c - s * 0.125, s * 0.25, s * 0.25);
}
