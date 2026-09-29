import { hash2 } from '../sim/noise';
import type { Terrain, World } from '../sim/types';
import { TILE } from './camera';

const COLORS: Record<Terrain, string> = {
  water: '#2f6f9f',
  sand: '#d8c78a',
  grass: '#6aa84f',
  forest: '#3d7a3a',
  mountain: '#8b8b8b',
};

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawDetail(
  ctx: CanvasRenderingContext2D,
  terrain: Terrain,
  seed: number,
  tx: number,
  ty: number,
): void {
  const px = tx * TILE;
  const py = ty * TILE;
  const r = (k: number): number => hash2(seed + k, tx, ty);
  switch (terrain) {
    case 'water': {
      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1;
      const wy = py + 8 + r(1) * 16;
      const wx = px + 4 + r(2) * 8;
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.lineTo(wx + 10, wy);
      ctx.stroke();
      break;
    }
    case 'sand': {
      ctx.fillStyle = 'rgba(150,120,60,0.35)';
      for (let i = 0; i < 3; i++) ctx.fillRect(px + r(i + 1) * 28, py + r(i + 10) * 28, 2, 2);
      break;
    }
    case 'grass': {
      ctx.strokeStyle = 'rgba(40,90,30,0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 2; i++) {
        const gx = px + 4 + r(i + 1) * 24;
        const gy = py + 6 + r(i + 5) * 22;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx, gy - 4);
        ctx.stroke();
      }
      break;
    }
    case 'forest': {
      ctx.fillStyle = '#2a5c29';
      const n = 2 + Math.floor(r(1) * 2); // 2 oder 3 Baumkronen
      for (let i = 0; i < n; i++) {
        circle(ctx, px + 7 + r(i + 2) * 18, py + 7 + r(i + 8) * 18, 5 + r(i + 14) * 2);
      }
      break;
    }
    case 'mountain': {
      ctx.fillStyle = '#c4c4c4';
      const bx = px + 6 + r(1) * 6;
      ctx.beginPath();
      ctx.moveTo(bx, py + 24);
      ctx.lineTo(bx + 9, py + 8);
      ctx.lineTo(bx + 18, py + 24);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}

/** Zeichnet die ganze Karte einmal in ein Offscreen-Canvas (Welt-Pixel, 1 Kachel = TILE px). */
export function buildTerrainLayer(world: World): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = world.width * TILE;
  canvas.height = world.height * TILE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D-Kontext nicht verfügbar');
  for (let y = 0; y < world.height; y++) {
    for (let x = 0; x < world.width; x++) {
      const tile = world.tiles[y * world.width + x];
      if (!tile) continue;
      ctx.fillStyle = COLORS[tile.terrain];
      ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      drawDetail(ctx, tile.terrain, world.seed, x, y);
    }
  }
  return canvas;
}
