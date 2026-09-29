import { BUILDING_DEFS } from '../sim/defs/buildings';
import { footprint, tileAt } from '../sim/world';
import type { BuildingDefId, World } from '../sim/types';
import { TILE, tileToScreen, type Camera } from './camera';
import { drawBuilding, drawRoad } from './sprites';

export type Tool =
  | { kind: 'select' }
  | { kind: 'build'; defId: BuildingDefId }
  | { kind: 'road' }
  | { kind: 'demolish' };

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

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (!tileAt(world, x, y)?.road) continue;
      const p = tileToScreen(cam, x, y);
      drawRoad(ctx, p.x, p.y, s, {
        n: tileAt(world, x, y - 1)?.road === true,
        e: tileAt(world, x + 1, y)?.road === true,
        s: tileAt(world, x, y + 1)?.road === true,
        w: tileAt(world, x - 1, y)?.road === true,
      });
    }
  }

  for (const b of Object.values(world.buildings)) {
    const def = BUILDING_DEFS[b.defId];
    if (b.x > x1 || b.y > y1 || b.x + def.w - 1 < x0 || b.y + def.h - 1 < y0) continue;
    const p = tileToScreen(cam, b.x, b.y);
    drawBuilding(ctx, def, b, p.x, p.y, s);
  }

  const sel = selectedId === null ? undefined : world.buildings[selectedId];
  if (sel) {
    const def = BUILDING_DEFS[sel.defId];
    const p = tileToScreen(cam, sel.x, sel.y);
    ctx.strokeStyle = '#ffe000';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x + 1, p.y + 1, def.w * s - 2, def.h * s - 2);
  }

  if (hover?.tool) {
    const p = tileToScreen(cam, hover.x, hover.y);
    if (hover.tool.kind === 'select') {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x + 0.5, p.y + 0.5, s - 1, s - 1);
    } else {
      const def = hover.tool.kind === 'build' ? BUILDING_DEFS[hover.tool.defId] : null;
      const cells = def ? footprint(def, hover.x, hover.y) : [{ x: hover.x, y: hover.y }];
      ctx.fillStyle = hover.ok ? 'rgba(0,255,0,.35)' : 'rgba(255,0,0,.35)';
      for (const c of cells) {
        const cp = tileToScreen(cam, c.x, c.y);
        ctx.fillRect(cp.x, cp.y, s, s);
      }
    }
  }
}
