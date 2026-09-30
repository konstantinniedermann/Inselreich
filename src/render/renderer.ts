import { BUILDING_DEFS } from '../sim/defs/buildings';
import { footprint, tileAt } from '../sim/world';
import type { BuildingDefId, World } from '../sim/types';
import { TILE, tileToScreen, type Camera } from './camera';
import { dayNightAlpha, NIGHT_COLOR } from './daynight';
import { drawNeedSymbols, drawPlacementOverlay } from './overlays';
import { drawShip } from './ship';
import { drawWaves } from './water';
import { drawBuilding, drawRoad } from './sprites';

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
}

export interface Hover {
  x: number;
  y: number;
  tool: Tool | null;
  ok: boolean;
}

/**
 * Zeichnet einen Frame. `ctx` muss bereits per devicePixelRatio skaliert sein;
 * `view` ist die Ansichtsgrösse in CSS-Pixeln.
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
  ctx.clearRect(0, 0, view.w, view.h);
  const s = TILE * cam.zoom;

  // Terrain-Ausschnitt (Quell-Rechteck auf die Kartengrenzen begrenzen)
  const sx = Math.max(0, cam.x);
  const sy = Math.max(0, cam.y);
  const sw = Math.min(terrainLayer.width - sx, view.w / cam.zoom);
  const sh = Math.min(terrainLayer.height - sy, view.h / cam.zoom);
  if (sw > 0 && sh > 0) {
    ctx.drawImage(
      terrainLayer,
      sx,
      sy,
      sw,
      sh,
      (sx - cam.x) * cam.zoom,
      (sy - cam.y) * cam.zoom,
      sw * cam.zoom,
      sh * cam.zoom,
    );
  }

  // Sichtbarer Kachelbereich (inklusive, an Kartengrenzen begrenzt)
  const x0 = Math.max(0, Math.floor(cam.x / TILE));
  const y0 = Math.max(0, Math.floor(cam.y / TILE));
  const x1 = Math.min(world.width - 1, Math.floor((cam.x + view.w / cam.zoom) / TILE));
  const y1 = Math.min(world.height - 1, Math.floor((cam.y + view.h / cam.zoom) / TILE));

  drawWaves(ctx, world, cam, { x0, y0, x1, y1 }, fx.timeMs);
  drawShip(ctx, world, cam, fx.timeMs);

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!tileAt(world, x, y)?.road) continue;
      const p = tileToScreen(cam, x, y);
      const q = tileToScreen(cam, x + 1, y + 1);
      drawRoad(ctx, p.x, p.y, q.x - p.x, q.y - p.y, {
        n: tileAt(world, x, y - 1)?.road === true,
        e: tileAt(world, x + 1, y)?.road === true,
        s: tileAt(world, x, y + 1)?.road === true,
        w: tileAt(world, x - 1, y)?.road === true,
      });
    }
  }

  if (hover?.tool?.kind === 'build') {
    drawPlacementOverlay(ctx, world, cam, { x0, y0, x1, y1 }, hover.tool.defId, hover.x, hover.y);
  }

  for (const b of Object.values(world.buildings)) {
    const def = BUILDING_DEFS[b.defId];
    if (b.x > x1 || b.y > y1 || b.x + def.w - 1 < x0 || b.y + def.h - 1 < y0) continue;
    const p = tileToScreen(cam, b.x, b.y);
    const q = tileToScreen(cam, b.x + def.w, b.y + def.h);
    drawBuilding(ctx, def, b, p.x, p.y, q.x - p.x, q.y - p.y, fx.timeMs);
  }

  drawNeedSymbols(ctx, world, cam, { x0, y0, x1, y1 });

  // Tönung über der Karte, unter Auswahl und Hover (Bedienung bleibt lesbar); das HUD ist DOM.
  const night = fx.dayNight === true ? dayNightAlpha(world.tick) : 0;
  if (night > 0) {
    ctx.save();
    ctx.fillStyle = `rgba(${NIGHT_COLOR},${night.toFixed(4)})`;
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.restore();
  }

  const sel = selectedId === null ? undefined : world.buildings[selectedId];
  if (sel) {
    const def = BUILDING_DEFS[sel.defId];
    const p = tileToScreen(cam, sel.x, sel.y);
    ctx.strokeStyle = '#ffe000';
    ctx.lineWidth = 2;
    const q = tileToScreen(cam, sel.x + def.w, sel.y + def.h);
    ctx.strokeRect(p.x + 1, p.y + 1, q.x - p.x - 2, q.y - p.y - 2);
  }

  if (hover?.tool) {
    const p = tileToScreen(cam, hover.x, hover.y);
    if (hover.tool.kind === 'select') {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x + 0.5, p.y + 0.5, s - 1, s - 1);
    } else {
      const def = hover.tool.kind === 'build' ? BUILDING_DEFS[hover.tool.defId] : null;
      let cells = [{ x: hover.x, y: hover.y }];
      if (def) cells = footprint(def, hover.x, hover.y);
      else if (hover.tool.kind === 'demolish') {
        const id = tileAt(world, hover.x, hover.y)?.buildingId;
        const b = id != null ? world.buildings[id] : undefined;
        if (b) cells = footprint(BUILDING_DEFS[b.defId], b.x, b.y);
      }
      ctx.fillStyle = hover.ok ? 'rgba(0,255,0,.35)' : 'rgba(255,0,0,.35)';
      for (const c of cells) {
        const cp = tileToScreen(cam, c.x, c.y);
        const cq = tileToScreen(cam, c.x + 1, c.y + 1);
        ctx.fillRect(cp.x, cp.y, cq.x - cp.x, cq.y - cp.y);
      }
    }
  }
}
