import type { Pos } from '../sim/world';
import { tileCorners, type Camera } from './camera';

/** Farben der Pfad-Vorschau „Anbinden" (halbtransparent, hebt sich von Gras und Weg ab). */
const PREVIEW_FILL = 'rgba(255, 214, 102, 0.45)';
const PREVIEW_STROKE = 'rgba(255, 236, 170, 0.9)';

/** Zeichnet je Kachel eine halbtransparente Raute; schreibt nie in die Welt. */
export function drawPathPreview(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  tiles: readonly Pos[],
): void {
  if (tiles.length === 0) return;
  ctx.save();
  ctx.fillStyle = PREVIEW_FILL;
  ctx.strokeStyle = PREVIEW_STROKE;
  ctx.lineWidth = 1;
  for (const t of tiles) {
    const [a, b, c, d] = tileCorners(cam, t.x, t.y);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(c.x, c.y);
    ctx.lineTo(d.x, d.y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
