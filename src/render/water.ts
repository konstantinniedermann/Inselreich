import { hash2 } from '../sim/noise';
import type { World } from '../sim/types';
import { tileToScreen, type Camera } from './camera';

const WAVE_PERIOD_MS = 2400;
const WAVE_AMPLITUDE = 0.07; // Anteil der Kachelhöhe
const WAVE_COLOR = '255,255,255';
const WAVE_ALPHA = 0.16;
const SHORE_WAVE_ALPHA = 0.4;

interface WaterInfo {
  shore: Uint8Array; // 1 = Wasser mit Landnachbar (4er)
  phase: Float32Array; // Wellenphase je Kachel (0..2π)
  lift: Float32Array; // Lage der Welle in der Kachel (0.25..0.75)
}

// Terrain ändert sich im Spiel nicht: einmal je Welt vorberechnen.
const cache = new WeakMap<World, WaterInfo>();

function infoFor(world: World): WaterInfo {
  const hit = cache.get(world);
  if (hit) return hit;
  const { width: w, height: h } = world;
  const shore = new Uint8Array(w * h);
  const phase = new Float32Array(w * h);
  const lift = new Float32Array(w * h);
  const isLand = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    const t = world.tiles[y * w + x];
    return t !== undefined && t.terrain !== 'water';
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      phase[i] = hash2(world.seed + 101, x, y) * Math.PI * 2;
      lift[i] = 0.25 + hash2(world.seed + 202, x, y) * 0.5;
      if (world.tiles[i]?.terrain !== 'water') continue;
      shore[i] =
        isLand(x, y - 1) || isLand(x + 1, y) || isLand(x, y + 1) || isLand(x - 1, y) ? 1 : 0;
    }
  }
  const info = { shore, phase, lift };
  cache.set(world, info);
  return info;
}

/** Bewegte Wellenlinien auf Wasserkacheln im Bereich x0..x1/y0..y1 (inklusive); Ufer stärker. */
export function drawWaves(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  range: { x0: number; y0: number; x1: number; y1: number },
  timeMs: number,
): void {
  const info = infoFor(world);
  const t = (timeMs / WAVE_PERIOD_MS) * Math.PI * 2;
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  for (const shore of [0, 1]) {
    ctx.beginPath();
    for (let y = range.y0; y <= range.y1; y++) {
      for (let x = range.x0; x <= range.x1; x++) {
        const i = y * world.width + x;
        if (world.tiles[i]?.terrain !== 'water' || info.shore[i] !== shore) continue;
        const p = tileToScreen(cam, x, y);
        const q = tileToScreen(cam, x + 1, y + 1);
        const sw = q.x - p.x;
        const sh = q.y - p.y;
        const ph = info.phase[i] ?? 0;
        const wy = p.y + sh * (info.lift[i] ?? 0.5) + Math.sin(t + ph) * sh * WAVE_AMPLITUDE;
        const x0 = p.x + sw * 0.2;
        const x1 = p.x + sw * 0.8;
        ctx.moveTo(x0, wy);
        ctx.quadraticCurveTo(p.x + sw * 0.5, wy - sh * 0.1 * Math.cos(t + ph), x1, wy);
        if (shore === 1) {
          const wy2 = wy + sh * 0.25;
          ctx.moveTo(x0 + sw * 0.1, wy2);
          ctx.lineTo(x1 - sw * 0.1, wy2);
        }
      }
    }
    ctx.strokeStyle = `rgba(${WAVE_COLOR},${shore === 1 ? SHORE_WAVE_ALPHA : WAVE_ALPHA})`;
    ctx.stroke();
  }
}
