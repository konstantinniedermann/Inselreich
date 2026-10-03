// ring.ts — Fortschrittsring je Betrieb (M11 R1, Spec 8): zeigt den Zyklus als Bogen (grün = läuft, grau =
// steht). Liest nur die Welt, schreibt nie hinein. Signalebene: Bildraum, ungetönt, nie unter der Bodenmatrix.
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { cycleOf } from '../sim/levels';
import type { Building, World } from '../sim/types';
import { worldToScreen, type Camera, type TileRange } from './camera';
import { spriteBounds } from './iso';
import { PALETTE } from './palette';
import { MARK_MIN_PX } from './statusMarks';

// --- Darstellungswerte (keine Spielwerte) ---
/** Obergrenze gleichzeitig gezeichneter Ringe je Frame (Frame-Budget). */
export const MAX_RINGS = 60;
const RING_MAX_PX = 18;
const RING_BASE_PX = 14; // bei Zoom 1
const GAP_PX = 3; // Abstand zur Sprite-Oberkante
const TRACK = PALETTE.wallTimber;
const MAX_FRACTION = 0.99999;

/** Anteil des laufenden Zyklus 0 … 0,99999; 0 ohne Zyklus. `frac` = Bruchteil des aktuellen Ticks. */
export function ringFraction(b: Building, frac: number): number {
  const cycle = cycleOf(b);
  if (cycle === undefined || cycle <= 0) return 0;
  return Math.min(MAX_FRACTION, (b.progress + frac) / cycle);
}

/** Ringzustand; `null` ohne `produces`. Eingefroren (nicht `ok`/angebunden): ohne Tick-Bruchteil. */
export function ringView(b: Building, frac: number): { fraction: number; running: boolean } | null {
  if (!BUILDING_DEFS[b.defId].produces) return null;
  const running = b.state === 'ok' && b.connected;
  return { fraction: ringFraction(b, running ? frac : 0), running };
}

/** Zeichnet die Ringe (höchstens `MAX_RINGS`); liefert die Anzahl gezeichneter Ringe. */
export function drawProgressRings(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  range: TileRange,
  frac: number,
): number {
  const s = Math.min(RING_MAX_PX, Math.max(MARK_MIN_PX, RING_BASE_PX * cam.zoom));
  const w = Math.max(2, s / 6);
  let n = 0;
  for (const b of Object.values(world.buildings)) {
    if (n >= MAX_RINGS) break;
    if (b.x < range.x0 || b.x > range.x1 || b.y < range.y0 || b.y > range.y1) continue;
    const view = ringView(b, frac);
    if (!view) continue;
    const box = spriteBounds(BUILDING_DEFS[b.defId], b);
    const top = worldToScreen(cam, { x: box.x + box.w / 2, y: box.y });
    const cx = top.x + s;
    const cy = top.y - GAP_PX - s / 2;
    const r = s / 2 - w / 2;
    ctx.save();
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = TRACK;
    ctx.lineWidth = w + 2;
    ctx.stroke();
    if (view.fraction > 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * view.fraction);
      ctx.strokeStyle = view.running ? PALETTE.signalOk : PALETTE.rockLight;
      ctx.lineWidth = w;
      ctx.stroke();
    }
    ctx.restore();
    n++;
  }
  return n;
}
