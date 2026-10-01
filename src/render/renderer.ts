import { BUILDING_DEFS } from '../sim/defs/buildings';
import { houseDiagnosis } from '../sim/queries';
import { tileAt } from '../sim/world';
import type { Building, BuildingDefId, World } from '../sim/types';
import {
  tileCorners,
  tileToScreen,
  visibleTileRange,
  groundMatrix,
  worldToScreen,
  type Camera,
  type TileRange,
} from './camera';
import { lightAt, type Weather } from './daynight';
import { TEX, bodyHull, sortedObjects, spriteBounds, type Pt, type SortedItem } from './iso';
import {
  SYMBOL_MIN_ZOOM,
  drawNeedSymbols,
  drawPlacementOverlay,
  drawUnconnected,
} from './overlays';
import { PALETTE, SHADOW, rgbaOf } from './palette';
import { drawShip, shipShadow, shipTile } from './ship';
import { halfLayer, terrainScale, updateTerrainLayer } from './terrain';
import { drawTreeStamp, treeShadow, type TreeItem } from './trees';
import { drawWaves } from './water';
import { buildingShadow, drawAir, drawBody, drawGhost, drawRoads, type BodyEnv } from './sprites';

const HOVER_LINE = '#fff'; // Umriss Weiss (Signal)
const HOVER_OK = rgbaOf(PALETTE.signalOk, 0.35);
const HOVER_BAD = rgbaOf(PALETTE.signalRed, 0.35);
const RASTER_COLOR = 'rgba(255,255,255,0.35)';

export type Tool =
  | { kind: 'select' }
  | { kind: 'build'; defId: BuildingDefId }
  | { kind: 'road' }
  | { kind: 'demolish' };

/** Darstellungs-Zusatz je Frame (Spec 11.1); Animation entsteht nur aus `timeMs` und dem Welt-Zustand. */
export interface RenderFx {
  timeMs: number;
  /** Krisenwetter bzw. Stimmungswetter (R3). */
  weather?: Weather;
  /** Brennende Betriebe (R3). */
  fire?: { id: number; flames: number; smoke: number }[];
  /** Gerade gelöschte Betriebe (R3). */
  extinguished?: { id: number; p: number }[];
  reduceMotion?: boolean;
  mood?: boolean;
  boom?: boolean;
  /** Tag-Nacht-Tönung; nur bei explizit `true` (Standard: aus). */
  dayNight?: boolean;
  /** Dev: Rautenraster über der Karte (nur unter `import.meta.env.DEV` gesetzt). */
  raster?: boolean;
}

/** Signal eines Frames in CSS-Pixeln (Mittelpunkt): Bedarfssymbol oder roter Punkt. */
export interface Badge {
  id: number;
  x: number;
  y: number;
  kind: 'need' | 'unconnected';
  sx: number;
  sy: number;
}
/** Zähler des letzten Frames bzw. seit Start (Dev-Werkzeug; QA liest sie über `globalThis.__inselRender`). */
export const renderStats = {
  /** Multiply-Durchgänge im letzten Frame (0 oder 1). */
  multiplyFills: 0,
  /** Schattenfüllungen im letzten Frame (0 oder 1). */
  shadowFills: 0,
  /** Frames mit halber Boden-Kopie seit Start. */
  halfDraws: 0,
  /** Teil-Neuzeichnungen der Terrain-Ebene seit Start und Dauer der letzten (ms). */
  terrainPatches: 0,
  terrainPatchMs: 0,
  /** Bedarfssymbole und rote Punkte des letzten Frames (nur unter DEV gefüllt). */
  badges: [] as Badge[],
};
if (import.meta.env.DEV) (globalThis as { __inselRender?: unknown }).__inselRender = renderStats;

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
    ctx.strokeStyle = HOVER_LINE;
    ctx.lineWidth = 1;
    ctx.stroke();
    drawGhost(ctx, cam, def, hover.x, hover.y); // D-13: halbtransparenter Geist
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

/** Wasser an der vorderen rechten bzw. linken Seite des Kontors (für die Kaimauer). */
function waterSides(world: World, b: Building): BodyEnv {
  const def = BUILDING_DEFS[b.defId];
  const water = (x: number, y: number): boolean => tileAt(world, x, y)?.terrain === 'water';
  let waterRight = false,
    waterLeft = false;
  for (let i = 0; i < def.h; i++) waterRight ||= water(b.x + def.w, b.y + i);
  for (let i = 0; i < def.w; i++) waterLeft ||= water(b.x + i, b.y + def.h);
  return { waterLeft, waterRight };
}

/** Polygon im Kachelraum als Teilpfad des Schattenpfads. */
function polyPath(ctx: CanvasRenderingContext2D, poly: readonly Pt[]): void {
  poly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
}

/** Bedarfssymbole und rote Punkte des Frames mit Bildpunkt (Dev; spiegelt die Bedingungen aus `overlays.ts`). */
function collectBadges(world: World, cam: Camera, range: TileRange): void {
  for (const b of Object.values(world.buildings)) {
    if (b.x < range.x0 || b.x > range.x1 || b.y < range.y0 || b.y > range.y1) continue;
    const box = spriteBounds(BUILDING_DEFS[b.defId], b);
    const a = worldToScreen(cam, { x: box.x + box.w / 2, y: box.y });
    if (cam.zoom >= SYMBOL_MIN_ZOOM && b.house && houseDiagnosis(world, b).length > 0)
      renderStats.badges.push({ id: b.id, x: b.x, y: b.y, kind: 'need', sx: a.x, sy: a.y });
    if (!b.connected && b.defId !== 'house' && b.defId !== 'kontor')
      renderStats.badges.push({ id: b.id, x: b.x, y: b.y, kind: 'unconnected', sx: a.x, sy: a.y });
  }
}

/**
 * Zeichnet einen Frame (Ebenen nach ISO §5, soweit es sie in R1b gibt). `ctx` muss bereits per
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
  renderStats.multiplyFills = 0;
  renderStats.shadowFills = 0;
  renderStats.badges.length = 0;

  // 1 Hintergrund
  ctx.fillStyle = PALETTE.waterDeep;
  ctx.fillRect(0, 0, view.w, view.h);

  const range = visibleTileRange(cam, view, { w: world.width, h: world.height });
  const empty = range.x1 < range.x0 || range.y1 < range.y0;

  // 2 Teil-Neuzeichnung der Terrain-Ebene (Belegung geändert), dann Boden
  const patch = updateTerrainLayer(terrainLayer, world);
  if (patch.redrawn) {
    renderStats.terrainPatches++;
    renderStats.terrainPatchMs = patch.ms;
  }

  if (!empty) {
    // Boden: nur das Quell-Teilrechteck der sichtbaren Kacheln; bei Zoom ≤ 0,5 die halbe Kopie
    const half = cam.zoom <= 0.5;
    const src = half ? halfLayer(terrainLayer) : terrainLayer;
    if (half) renderStats.halfDraws++;
    const per = (TEX * terrainScale(terrainLayer)) / (half ? 2 : 1); // Quellpixel je Kachel
    const sx = range.x0 * per,
      sy = range.y0 * per;
    const sw = Math.min(src.width - sx, (range.x1 - range.x0 + 1) * per);
    const sh = Math.min(src.height - sy, (range.y1 - range.y0 + 1) * per);
    if (sw > 0 && sh > 0) {
      ctx.save();
      ctx.transform(...groundMatrix(cam, per));
      ctx.drawImage(src, sx, sy, sw, sh, sx, sy, sw, sh);
      ctx.restore();
    }

    // 3 Wasser, 4 Wege: unter der Bodenmatrix
    withGround(ctx, cam, () => {
      drawWaves(ctx, world, range, fx.timeMs);
      drawRoads(ctx, world, range);
    });

    // Sichtbare Objekte in Zeichenreihenfolge (D-09)
    const ship = shipTile(world);
    const items = sortedObjects(
      world,
      ship ? [{ kind: 'ship', id: 0, cx: ship.x + 0.5, cy: ship.y + 0.5 }] : [],
    );
    const left = cam.x,
      top = cam.y,
      right = cam.x + view.w / cam.zoom,
      bottom = cam.y + view.h / cam.zoom;
    const visible: SortedItem[] = [];
    const buildings: Building[] = [];
    for (const it of items) {
      if (it.kind === 'building') {
        const b = world.buildings[it.id];
        if (!b) continue;
        const box = spriteBounds(BUILDING_DEFS[b.defId], b);
        if (box.x > right || box.x + box.w < left || box.y > bottom || box.y + box.h < top)
          continue;
        buildings.push(b);
      } else if (it.kind === 'tree') {
        if (it.fp.x < range.x0 || it.fp.x > range.x1 || it.fp.y < range.y0 || it.fp.y > range.y1)
          continue;
      } else if (it.kind !== 'ship') continue;
      visible.push(it);
    }

    // 5 Schatten: alle Polygone in einem Pfad, eine Füllung (überlappende Schatten dunkeln nicht doppelt)
    if (visible.length > 0) {
      withGround(ctx, cam, () => {
        ctx.beginPath();
        for (const it of visible) {
          if (it.kind === 'building') {
            const b = world.buildings[it.id]!;
            polyPath(ctx, buildingShadow(BUILDING_DEFS[b.defId], b));
          } else if (it.kind === 'tree') polyPath(ctx, treeShadow(it as TreeItem));
          else polyPath(ctx, shipShadow({ x: it.cx - 0.5, y: it.cy - 0.5 }));
        }
        ctx.fillStyle = SHADOW;
        ctx.fill();
        renderStats.shadowFills++;
      });
    }

    // 6 Sortierter Objektdurchgang
    for (const it of visible) {
      if (it.kind === 'building') {
        const b = world.buildings[it.id]!;
        const def = BUILDING_DEFS[b.defId];
        drawBody(
          ctx,
          cam,
          def,
          b,
          fx.timeMs,
          def.id === 'kontor' ? waterSides(world, b) : undefined,
        );
      } else if (it.kind === 'tree') drawTreeStamp(ctx, cam, it as TreeItem, world.seed);
      else if (it.kind === 'ship')
        drawShip(ctx, cam, { x: it.cx - 0.5, y: it.cy - 0.5 }, fx.timeMs);
    }

    // 7 Luft
    for (const b of buildings) drawAir(ctx, cam, BUILDING_DEFS[b.defId], b, fx.timeMs);
  }

  // 9 Tönung: genau ein Multiply-Durchgang; bei neutralem Licht entfällt er
  const mul = fx.dayNight === true ? lightAt(world.tick).mul : [1, 1, 1];
  if (mul.some((c) => c < 0.999)) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgb(${mul.map((c) => Math.round(c * 255)).join(',')})`;
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.restore();
    renderStats.multiplyFills++;
  }

  // 12 Signale (Bildraum, ungetönt, nie unter der Bodenmatrix)
  if (hover?.tool?.kind === 'build') {
    drawPlacementOverlay(ctx, world, cam, range, hover.tool.defId, hover.x, hover.y);
  }
  drawNeedSymbols(ctx, world, cam, range);
  drawUnconnected(ctx, world, cam, range);
  if (import.meta.env.DEV) collectBadges(world, cam, range);

  const sel = selectedId === null ? undefined : world.buildings[selectedId];
  if (sel) {
    const def = BUILDING_DEFS[sel.defId];
    ctx.save();
    ctx.beginPath();
    footprintPath(ctx, cam, sel.x, sel.y, def.w, def.h);
    hullPath(ctx, cam, sel);
    ctx.strokeStyle = PALETTE.signalYellow;
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
