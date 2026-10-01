import { hash2 } from '../sim/noise';
import type { World } from '../sim/types';
import { PALETTE, rgbaOf } from './palette';
import { coastField, warp } from './terrainField';

// water.ts — Schaumsaum und Wellen (Spec 5.2, ISO §6). Alles im Kachelraum, Aufruf unter der Bodenmatrix.
export const FOAM_PERIOD_MS = 3200; // Spec 5.2: Periode des Schaumsaums
export const FOAM_ALPHA: [number, number] = [0.35, 0.7];
export const WAVE_ALPHA = 0.12;
const FOAM_LINE_WIDTH = 0.06; // Kachel-Einheiten (unter der Bodenmatrix verzerrt, gewollt)
const FOAM_REST = 0.05; // Lage der Linie in Kacheln vor dem Strand (s ≈ −0,1 bei Gefälle 2 je Kachel)
const FOAM_SWING = 0.05; // Spec 5.2: Versatz zum Strand 0,05
const WAVE_PERIOD_MS = 2400;
const WAVE_AMPLITUDE = 0.07;
const WAVE_LINE_WIDTH = 0.04;
/**
 * Tiefe (Kachelmitte, in Kacheln) ab der Wellenstriche liegen. Spec: nur auf Wasser mit −s ≥ 1. Eine Kachel mit
 * Mittenwert 1 enthält Pixel mit −s < 1, also Flachwasser; erst ab 2 liegt jede Lage der Striche im Tiefenbereich.
 */
const WAVE_MIN_DEPTH = 2;
const PIECE = 5; // Punkte je Schaumstück

interface WaterInfo {
  depth: Float32Array; // Tiefe je Kachelmitte (Kacheln, 0 auf Land)
  phase: Float32Array; // Wellenphase je Kachel (0..2π)
  lift: Float32Array; // Lage der Welle in der Kachel (0.25..0.75)
  start: Int32Array; // Index des ersten Schaumstücks je Kachel (n + 1 Einträge)
  pieces: Float32Array; // je Stück PIECE Punkte (x, y) und die Normale ins Wasser (nx, ny)
}

// Terrain ändert sich im Spiel nicht: einmal je Welt vorberechnen.
const cache = new WeakMap<World, WaterInfo>();

function infoFor(world: World): WaterInfo {
  const hit = cache.get(world);
  if (hit) return hit;
  const { width: w, height: h, seed } = world;
  const field = coastField(world);
  const n = w * h;
  const depth = new Float32Array(n);
  const phase = new Float32Array(n);
  const lift = new Float32Array(n);
  const start = new Int32Array(n + 1);
  const flat: number[] = [];
  const isLand = (x: number, y: number): boolean => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return world.tiles[y * w + x]!.terrain !== 'water';
  };
  /** Punkt auf die gezeichnete Küste schieben: Das Terrain verschiebt seine Abtastung um warp(p) − p. */
  const onCoast = (px: number, py: number): [number, number] => {
    const [wx, wy] = warp(seed, px, py);
    return [px - (wx - px), py - (wy - py)];
  };
  const piece = (pts: [number, number][], nx: number, ny: number): void => {
    for (const [px, py] of pts) {
      const [qx, qy] = onCoast(px, py);
      flat.push(qx, qy);
    }
    flat.push(nx, ny);
  };
  const line = (x0: number, y0: number, x1: number, y1: number): [number, number][] =>
    Array.from({ length: PIECE }, (_, k) => [
      x0 + ((x1 - x0) * k) / (PIECE - 1),
      y0 + ((y1 - y0) * k) / (PIECE - 1),
    ]);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      start[i] = flat.length / (PIECE * 2 + 2);
      phase[i] = hash2(seed + 101, x, y) * Math.PI * 2;
      lift[i] = 0.25 + hash2(seed + 202, x, y) * 0.5;
      depth[i] = Math.max(0, -field.v[i]!);
      if (world.tiles[i]!.terrain !== 'water') continue;
      if (isLand(x + 1, y)) piece(line(x + 1, y, x + 1, y + 1), -1, 0);
      if (isLand(x - 1, y)) piece(line(x, y, x, y + 1), 1, 0);
      if (isLand(x, y + 1)) piece(line(x, y + 1, x + 1, y + 1), 0, -1);
      if (isLand(x, y - 1)) piece(line(x, y, x + 1, y), 0, 1);
      for (const dx of [-1, 1])
        for (const dy of [-1, 1]) {
          if (!isLand(x + dx, y + dy) || isLand(x + dx, y) || isLand(x, y + dy)) continue;
          const cx = x + (dx > 0 ? 1 : 0),
            cy = y + (dy > 0 ? 1 : 0);
          const a: [number, number] = [cx - dx * 0.3, cy],
            b: [number, number] = [cx, cy - dy * 0.3],
            m: [number, number] = [cx - dx * 0.1, cy - dy * 0.1];
          const mid = (p: [number, number], q: [number, number]): [number, number] => [
            (p[0] + q[0]) / 2,
            (p[1] + q[1]) / 2,
          ];
          piece([a, mid(a, m), m, mid(m, b), b], -dx * Math.SQRT1_2, -dy * Math.SQRT1_2);
        }
    }
  start[n] = flat.length / (PIECE * 2 + 2);
  const info = { depth, phase, lift, start, pieces: Float32Array.from(flat) };
  cache.set(world, info);
  return info;
}

/**
 * Schaumsaum und Wellenstriche auf Wasserkacheln im Bereich x0..x1/y0..y1 (inklusive).
 * Zeichnet im Kachelraum (1 Einheit = 1 Kachel): Aufruf unter der Bodenmatrix (`withGround`).
 */
export function drawWaves(
  ctx: CanvasRenderingContext2D,
  world: World,
  range: { x0: number; y0: number; x1: number; y1: number },
  timeMs: number,
): void {
  const info = infoFor(world);
  const { width: w, height: h } = world;
  const x0 = Math.max(0, range.x0),
    x1 = Math.min(w - 1, range.x1),
    y0 = Math.max(0, range.y0),
    y1 = Math.min(h - 1, range.y1);
  if (x1 < x0 || y1 < y0) return;
  ctx.lineCap = 'round';

  // Schaumsaum: ein Pfad je Frame
  const swing = Math.sin((2 * Math.PI * timeMs) / FOAM_PERIOD_MS);
  const alpha = FOAM_ALPHA[0] + (FOAM_ALPHA[1] - FOAM_ALPHA[0]) * (0.5 + 0.5 * swing);
  const stride = PIECE * 2 + 2;
  ctx.lineWidth = FOAM_LINE_WIDTH;
  ctx.beginPath();
  let any = false;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      const off =
        FOAM_REST + FOAM_SWING * Math.sin((2 * Math.PI * timeMs) / FOAM_PERIOD_MS + 0.35 * (x + y));
      for (let p = info.start[i]!; p < info.start[i + 1]!; p++) {
        const o = p * stride;
        const nx = info.pieces[o + PIECE * 2]!,
          ny = info.pieces[o + PIECE * 2 + 1]!;
        for (let k = 0; k < PIECE; k++) {
          const px = info.pieces[o + k * 2]! + nx * off,
            py = info.pieces[o + k * 2 + 1]! + ny * off;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        any = true;
      }
    }
  if (any) {
    ctx.strokeStyle = rgbaOf(PALETTE.foam, Number(alpha.toFixed(4)));
    ctx.stroke();
  }

  // Wellenstriche: foam mit Deckkraft 0,12, nur im tiefen Wasser
  const t = (timeMs / WAVE_PERIOD_MS) * Math.PI * 2;
  ctx.lineWidth = WAVE_LINE_WIDTH;
  ctx.beginPath();
  let waves = false;
  for (let y = y0; y <= y1; y++)
    for (let x = x0; x <= x1; x++) {
      const i = y * w + x;
      if (world.tiles[i]!.terrain !== 'water' || info.depth[i]! < WAVE_MIN_DEPTH) continue;
      const ph = info.phase[i]!;
      const wy = y + info.lift[i]! + Math.sin(t + ph) * WAVE_AMPLITUDE;
      ctx.moveTo(x + 0.2, wy);
      ctx.quadraticCurveTo(x + 0.5, wy - 0.1 * Math.cos(t + ph), x + 0.8, wy);
      waves = true;
    }
  if (waves) {
    ctx.strokeStyle = rgbaOf(PALETTE.foam, WAVE_ALPHA);
    ctx.stroke();
  }
}
