import { BUILDING_DEFS } from '../sim/defs/buildings';
import { tileAt } from '../sim/world';
import type { Building, BuildingDefId, World } from '../sim/types';
import {
  tileCorners,
  tileToScreen,
  visibleTileRange,
  groundMatrix,
  worldToScreen,
  type Camera,
} from './camera';
import { dayNightAlpha, NIGHT_COLOR } from './daynight';
import { TEX, bodyHull, sortedObjects, spriteBounds } from './iso';
import { drawNeedSymbols, drawPlacementOverlay, drawUnconnected } from './overlays';
import { drawShip, shipTile } from './ship';
import { drawTreeStamp } from './trees';
import { drawWaves } from './water';
import { drawAir, drawBody, drawRoads } from './sprites';

/** Meerfarbe hinter der Kartenraute (R1b ersetzt sie durch die Palette). */
const SEA = '#2a628c';
const SELECT_COLOR = '#ffe000';
const HOVER_LINE = '#fff';
const HOVER_OK = 'rgba(0,255,0,.35)';
const HOVER_BAD = 'rgba(255,0,0,.35)';
const RASTER_COLOR = 'rgba(255,255,255,0.35)';

export type Tool =
  | { kind: 'select' }
  | { kind: 'build'; defId: BuildingDefId }
  | { kind: 'road' }
  | { kind: 'demolish' };

/** Darstellungs-Zusatz je Frame; Animation entsteht nur aus `timeMs` und dem Welt-Zustand. */
export interface RenderFx {
  timeMs: number;
  /** Tag-Nacht-Tönung; nur bei explizit `true` (Standard: aus). */
  dayNight?: boolean;
  /** Dev: Rautenraster über der Karte (nur unter `import.meta.env.DEV` gesetzt). */
  raster?: boolean;
}

export interface Hover {
  x: number;
  y: number;
  tool: Tool | null;
  ok: boolean;
}

/** Bodenmatrix: 1 Einheit = 1 Kachel; steht zwischen `save` und `restore` (D-17: nur für Boden, Wasser, Wege). */
export function withGround(ctx: CanvasRenderingContext2D, cam: Camera, fn: () => void): void {
  ctx.save();
  ctx.transform(...groundMatrix(cam, 1));
  fn();
  ctx.restore();
}

/** Raute eines Footprints als Teilpfad (Bildpunkte aus den gerundeten Kachelecken). */
function footprintPath(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  const a = tileToScreen(cam, x, y),
    b = tileToScreen(cam, x + w, y),
    c = tileToScreen(cam, x + w, y + h),
    d = tileToScreen(cam, x, y + h);
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.lineTo(d.x, d.y);
  ctx.closePath();
}

/** Körperumriss als Teilpfad. */
function hullPath(ctx: CanvasRenderingContext2D, cam: Camera, b: Building): void {
  const hull = bodyHull(BUILDING_DEFS[b.defId], b).map((p) => worldToScreen(cam, p));
  hull.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
}

const buildingAt = (world: World, x: number, y: number): Building | undefined => {
  const id = tileAt(world, x, y)?.buildingId;
  return id != null ? world.buildings[id] : undefined;
};

/** Hover nach ISO 8: Bodenraute auf `hover.x/y`; bei Auswählen und Abreissen zusätzlich das Gebäude dort. */
function drawHover(ctx: CanvasRenderingContext2D, world: World, cam: Camera, hover: Hover): void {
  const tool = hover.tool;
  if (!tool) return;
  ctx.save();
  if (tool.kind === 'build') {
    const def = BUILDING_DEFS[tool.defId];
    ctx.beginPath();
    footprintPath(ctx, cam, hover.x, hover.y, def.w, def.h);
    ctx.fillStyle = hover.ok ? HOVER_OK : HOVER_BAD;
    ctx.fill();
  } else if (tool.kind === 'road') {
    ctx.beginPath();
    footprintPath(ctx, cam, hover.x, hover.y, 1, 1);
    ctx.fillStyle = hover.ok ? HOVER_OK : HOVER_BAD;
    ctx.fill();
  } else {
    const b = buildingAt(world, hover.x, hover.y);
    const def = b ? BUILDING_DEFS[b.defId] : null;
    if (tool.kind === 'demolish') {
      ctx.beginPath();
      footprintPath(ctx, cam, hover.x, hover.y, 1, 1);
      if (b && def) footprintPath(ctx, cam, b.x, b.y, def.w, def.h);
      ctx.fillStyle = hover.ok ? HOVER_OK : HOVER_BAD;
      ctx.fill();
    }
    ctx.beginPath();
    footprintPath(ctx, cam, hover.x, hover.y, 1, 1);
    if (b && def) {
      footprintPath(ctx, cam, b.x, b.y, def.w, def.h);
      hullPath(ctx, cam, b);
    }
    ctx.strokeStyle = HOVER_LINE;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Zeichnet einen Frame (Ebenen nach ISO §5, soweit es sie in R0-ISO gibt). `ctx` muss bereits per
 * devicePixelRatio skaliert sein; `view` ist die Ansichtsgrösse in CSS-Pixeln.
 */
export function render(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  terrainLayer: HTMLCanvasElement,
  hover: Hover | null,
  selectedId: number | null,
  view: { w: number; h: number },
  fx: RenderFx = { timeMs: 0 },
): void {
  // 1 Hintergrund
  ctx.fillStyle = SEA;
  ctx.fillRect(0, 0, view.w, view.h);

  const range = visibleTileRange(cam, view, { w: world.width, h: world.height });
  const empty = range.x1 < range.x0 || range.y1 < range.y0;

  if (!empty) {
    // 2 Boden: nur das Quell-Teilrechteck der sichtbaren Kacheln
    const sx = range.x0 * TEX,
      sy = range.y0 * TEX;
    const sw = Math.min(terrainLayer.width - sx, (range.x1 - range.x0 + 1) * TEX);
    const sh = Math.min(terrainLayer.height - sy, (range.y1 - range.y0 + 1) * TEX);
    if (sw > 0 && sh > 0) {
      ctx.save();
      ctx.transform(...groundMatrix(cam, TEX));
      ctx.drawImage(terrainLayer, sx, sy, sw, sh, sx, sy, sw, sh);
      ctx.restore();
    }

    // 3 Wasser, 4 Wege: unter der Bodenmatrix
    withGround(ctx, cam, () => {
      drawWaves(ctx, world, range, fx.timeMs);
      drawRoads(ctx, world, range);
    });

    // 6 Sortierter Objektdurchgang (Gebäude, Baumstempel, Schiff)
    const ship = shipTile(world);
    const items = sortedObjects(
      world,
      ship ? [{ kind: 'ship', id: 0, cx: ship.x + 0.5, cy: ship.y + 0.5 }] : [],
    );
    const left = cam.x,
      top = cam.y,
      right = cam.x + view.w / cam.zoom,
      bottom = cam.y + view.h / cam.zoom;
    const visible: Building[] = [];
    for (const it of items) {
      if (it.kind === 'building') {
        const b = world.buildings[it.id];
        if (!b) continue;
        const def = BUILDING_DEFS[b.defId];
        const box = spriteBounds(def, b);
        if (box.x > right || box.x + box.w < left || box.y > bottom || box.y + box.h < top)
          continue;
        drawBody(ctx, cam, def, b, fx.timeMs);
        visible.push(b);
      } else if (it.kind === 'tree') {
        if (it.fp.x < range.x0 || it.fp.x > range.x1 || it.fp.y < range.y0 || it.fp.y > range.y1)
          continue;
        drawTreeStamp(ctx, cam, it, world.seed);
      } else if (it.kind === 'ship') {
        drawShip(ctx, cam, { x: it.cx - 0.5, y: it.cy - 0.5 }, fx.timeMs);
      }
    }

    // 7 Luft
    for (const b of visible) drawAir(ctx, cam, BUILDING_DEFS[b.defId], b, fx.timeMs);
  }

  // 9 Tönung über der Karte, unter den Signalen; das HUD ist DOM.
  const night = fx.dayNight === true ? dayNightAlpha(world.tick) : 0;
  if (night > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(${NIGHT_COLOR},${night.toFixed(4)})`;
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.restore();
  }

  // 12 Signale (Bildraum, ungetönt, nie unter der Bodenmatrix)
  if (hover?.tool?.kind === 'build') {
    drawPlacementOverlay(ctx, world, cam, range, hover.tool.defId, hover.x, hover.y);
  }
  drawNeedSymbols(ctx, world, cam, range);
  drawUnconnected(ctx, world, cam, range);

  const sel = selectedId === null ? undefined : world.buildings[selectedId];
  if (sel) {
    const def = BUILDING_DEFS[sel.defId];
    ctx.save();
    ctx.beginPath();
    footprintPath(ctx, cam, sel.x, sel.y, def.w, def.h);
    hullPath(ctx, cam, sel);
    ctx.strokeStyle = SELECT_COLOR;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  if (hover) drawHover(ctx, world, cam, hover);

  if (fx.raster === true && !empty) {
    ctx.save();
    ctx.beginPath();
    for (let y = range.y0; y <= range.y1; y++)
      for (let x = range.x0; x <= range.x1; x++) {
        const [a, b, c, d] = tileCorners(cam, x, y);
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.closePath();
      }
    ctx.strokeStyle = RASTER_COLOR;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}
