import { homeBuildings } from './homeBuildings';
// statusMarks.ts — Statusmarken über Betrieben (H-R3, Programm S4): zeigt, warum ein Betrieb nicht voll
// produziert. Liest nur `b.state`, schreibt nie in die Welt. Unterscheidung über die FORM, nicht nur die Farbe.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import type { Building, World } from '../sim/types';
import { worldToScreen, type Camera, type TileRange } from './camera';
import { spriteBounds } from './iso';
import { PALETTE } from './palette';

// --- Darstellungswerte (keine Spielwerte) ---
/** Kleinste Kantenlänge der Marke in Bildpunkten (bildschirmfest lesbar, auch bei Zoom 0,75). */
export const MARK_MIN_PX = 10;
const MARK_MAX_PX = 18;
const MARK_BASE_PX = 14; // bei Zoom 1
/** Obergrenze gleichzeitig gezeichneter Marken je Frame (Frame-Budget). */
export const MAX_MARKS = 60;
const GAP_PX = 3; // Abstand zur Sprite-Oberkante
const PULSE_PX = 1.5; // Auf-und-ab-Amplitude
const PULSE_MS = 900;
const OUTLINE = 'rgba(255,255,255,0.85)'; // Umriss Weiss (Signalebene)
const DARK = PALETTE.wallTimber; // dunkle Kontur für Lesbarkeit auf hellem Grund

export type MarkShape = 'arrow' | 'crate' | 'stump';
export interface StatusMark {
  shape: MarkShape;
  color: string;
}

const MARKS: Readonly<Record<string, StatusMark>> = Object.freeze({
  waitingInput: { shape: 'arrow', color: PALETTE.signalWarn }, // Zufuhr fehlt
  storageFull: { shape: 'crate', color: PALETTE.signalYellow }, // Lager voll
  noForest: { shape: 'stump', color: PALETTE.signalRed }, // kein freier Wald
});

/** Marke zu einem Betriebszustand; jeder andere (auch künftige) Zustand liefert `null`, nie eine Ausnahme. */
export function statusMarkOf(state: string): StatusMark | null {
  if (typeof state !== 'string' || !Object.hasOwn(MARKS, state)) return null;
  return MARKS[state]!;
}

const markable = (b: Building): boolean => !b.house && b.defId !== 'house' && b.defId !== 'kontor';

function shapePath(
  ctx: CanvasRenderingContext2D,
  shape: MarkShape,
  cx: number,
  by: number,
  s: number,
) {
  ctx.beginPath();
  if (shape === 'arrow') {
    ctx.moveTo(cx - s / 2, by - s);
    ctx.lineTo(cx + s / 2, by - s);
    ctx.lineTo(cx, by);
    ctx.closePath();
  } else if (shape === 'stump') {
    ctx.arc(cx, by - 0.62 * s, 0.34 * s, 0, Math.PI * 2); // Krone
    ctx.rect(cx - 0.08 * s, by - 0.3 * s, 0.16 * s, 0.3 * s); // Stamm
  } else {
    ctx.rect(cx - s / 2, by - s, s, s);
  }
}

/**
 * Zeichnet die Marken im Bildraum (Signalebene, ungetönt, nie unter der Bodenmatrix). Liefert die Anzahl
 * gezeichneter Marken (höchstens `MAX_MARKS`). Pulsiert leicht, ausser bei `reduce`.
 */
export function drawStatusMarks(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  range: TileRange,
  timeMs: number,
  reduce: boolean,
): number {
  const s = Math.min(MARK_MAX_PX, Math.max(MARK_MIN_PX, MARK_BASE_PX * cam.zoom));
  const bob = reduce ? 0 : Math.sin((timeMs / PULSE_MS) * Math.PI * 2) * PULSE_PX;
  let n = 0;
  for (const b of homeBuildings(world)) {
    if (n >= MAX_MARKS) break;
    if (!markable(b) || b.x < range.x0 || b.x > range.x1 || b.y < range.y0 || b.y > range.y1)
      continue;
    const mark = statusMarkOf(b.state);
    if (!mark) continue;
    const box = spriteBounds(BUILDING_DEFS[b.defId], b);
    const top = worldToScreen(cam, { x: box.x + box.w / 2, y: box.y });
    const cx = top.x;
    const by = top.y - GAP_PX - PULSE_PX + bob; // Unterkante der Marke
    ctx.save();
    shapePath(ctx, mark.shape, cx, by, s);
    ctx.lineJoin = 'round';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = mark.color;
    ctx.fill();
    ctx.strokeStyle = DARK;
    ctx.lineWidth = 1;
    ctx.stroke();
    if (mark.shape === 'crate') {
      // Deckelstrich und Band, damit die Kiste auch ohne Farbe lesbar ist
      ctx.beginPath();
      ctx.moveTo(cx - s / 2, by - s * 0.7);
      ctx.lineTo(cx + s / 2, by - s * 0.7);
      ctx.moveTo(cx, by - s * 0.7);
      ctx.lineTo(cx, by);
      ctx.stroke();
    }
    if (mark.shape === 'stump') {
      // Schrägstrich: „kein Baum"
      ctx.beginPath();
      ctx.moveTo(cx - s / 2, by);
      ctx.lineTo(cx + s / 2, by - s);
      ctx.strokeStyle = DARK;
      ctx.stroke();
    }
    ctx.restore();
    n++;
  }
  return n;
}
