// focusMarks.ts — Konturen um Erzeuger (durchgezogen) und Verbraucher (gestrichelt) des Gut-Fokus (I-043).
// Liest nur die Frame-Welt, schreibt nie in die Welt. Kein Puls, keine Zeitabhängigkeit.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import type { Building, GoodId, World } from '../sim/types';
import type { Camera, TileRange } from './camera';
import { homeBuildings } from './homeBuildings';
import { PALETTE } from './palette';

/** Obergrenze gezeichneter Konturen je Frame (Darstellungswert, Richtwert `MAX_MARKS` 60). */
export const MAX_FOCUS_MARKS = 40;
const LINE_PX = 3;
const DASH: readonly number[] = [6, 4];

export interface FocusFx {
  good: GoodId;
  island: number;
}

export interface FocusPaths {
  footprint: (
    ctx: CanvasRenderingContext2D,
    cam: Camera,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => void;
  hull: (ctx: CanvasRenderingContext2D, cam: Camera, b: Building) => void;
}

/** Zeichnet die Konturen; liefert die Zahl gezeichneter Gebäude (höchstens `MAX_FOCUS_MARKS`). */
export function drawFocusMarks(
  ctx: CanvasRenderingContext2D,
  frame: { v: World; ci: Camera; range: TileRange },
  focus: FocusFx | null,
  paths: FocusPaths,
): number {
  if (!focus) return 0;
  const { range } = frame;
  const producers: Building[] = [];
  const consumers: Building[] = [];
  for (const b of homeBuildings(frame.v)) {
    if (b.house || b.defId === 'house' || b.defId === 'kontor') continue;
    if (b.x < range.x0 || b.x > range.x1 || b.y < range.y0 || b.y > range.y1) continue;
    const def = BUILDING_DEFS[b.defId];
    if (def.produces === focus.good) producers.push(b);
    else if (def.consumes?.includes(focus.good)) consumers.push(b);
  }
  let n = 0;
  ctx.save();
  ctx.strokeStyle = PALETTE.signalFocus;
  ctx.lineWidth = LINE_PX;
  for (const [list, dash] of [
    [producers, []],
    [consumers, DASH],
  ] as const) {
    ctx.setLineDash([...dash]);
    for (const b of list) {
      if (n >= MAX_FOCUS_MARKS) break;
      const def = BUILDING_DEFS[b.defId];
      ctx.beginPath();
      paths.footprint(ctx, frame.ci, b.x, b.y, def.w, def.h);
      paths.hull(ctx, frame.ci, b);
      ctx.stroke();
      n++;
    }
  }
  ctx.setLineDash([]);
  ctx.restore();
  return n;
}
