import { BUILDING_DEFS } from '../sim/defs/buildings';
import { hash2 } from '../sim/noise';
import { layoutKey } from '../sim/queries';
import type { Building, BuildingDef, BuildingDefId, Category, World } from '../sim/types';

// iso.ts — Kern (Setzung Spec D-01 bis D-05, D-13, D-16)
export const ISO_W = 64;
export const ISO_H = 32;
export const H_MAX = 2 * ISO_H;
export const H_TOWER = 3 * ISO_H;
export const TEX = 32; // Texturpixel je Kachel bei Faktor 1 (ersetzt TILE in terrain.ts)
export const TREE_VARIANTS = 8;
export const ZOOM_STEPS = [0.5, 0.75, 1, 1.5, 2] as const;
export interface Pt {
  x: number;
  y: number;
}
export interface Footprint {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}
export const project = (fx: number, fy: number): Pt => ({
  x: (fx - fy) * (ISO_W / 2),
  y: (fx + fy) * (ISO_H / 2),
});
export const unproject = (X: number, Y: number): Pt => ({
  x: X / ISO_W + Y / ISO_H,
  y: Y / ISO_H - X / ISO_W,
});
export const depthKey = (f: Footprint): number => 2 * f.x + f.w + 2 * f.y + f.h;
export const footprintOrigin = (fx: number, fy: number, w: number, h: number): Pt => ({
  x: Math.floor(fx - w / 2 + 0.5),
  y: Math.floor(fy - h / 2 + 0.5),
});
export const radiusEllipse = (r: number): { rx: number; ry: number } => ({
  rx: r * (ISO_W / 2) * Math.SQRT2,
  ry: r * (ISO_H / 2) * Math.SQRT2,
});
/** Kleinste Zoomstufe ≥ z (Cache-Raster, ISO §16); über 2 bleibt es 2. */
export const zoomStep = (z: number): number => ZOOM_STEPS.find((s) => s >= z - 1e-9) ?? 2;
export const treeVariant = (seed: number, x: number, y: number): number =>
  Math.floor(hash2(seed + 41, x, y) * TREE_VARIANTS) % TREE_VARIANTS;

// iso.ts — Fortsetzung
/** Platzhalter-Höhe je Kategorie über der oberen Ecke des vollen Footprints (Weltpixel, Zoom 1, D-12). */
const CATEGORY_HEIGHT: Record<Category, number> = {
  housing: 1.0 * ISO_H,
  production: 1.2 * ISO_H,
  public: 1.6 * ISO_H,
  infrastructure: 1.4 * ISO_H,
};
/** R1b, R2 und R2-FW tragen hier die Höhen der Silhouetten ein; die Signaturen bleiben. */
export const BODY_HEIGHTS: Partial<Record<BuildingDefId, (b: Building) => number>> = {};
export const bodyHeight = (def: BuildingDef, b: Building): number =>
  BODY_HEIGHTS[def.id]?.(b) ?? CATEGORY_HEIGHT[def.category];

/** Bildbox in Weltpixeln: Rautenbreite des Footprints, von (obere Ecke − Höhe) bis untere Ecke. Nie fürs Picking. */
export function spriteBounds(def: BuildingDef, b: Building): Box {
  const top = project(b.x, b.y),
    left = project(b.x, b.y + def.h),
    right = project(b.x + def.w, b.y),
    bottom = project(b.x + def.w, b.y + def.h);
  const h = bodyHeight(def, b);
  return { x: left.x, y: top.y - h, w: right.x - left.x, h: bottom.y - top.y + h };
}
/** Körperhülle: Footprint-Raute ∪ dieselbe Raute um die Höhe nach oben; konvexes Sechseck im Uhrzeigersinn. */
export function bodyHull(def: BuildingDef, b: Building): Pt[] {
  const h = bodyHeight(def, b);
  const top = project(b.x, b.y),
    right = project(b.x + def.w, b.y),
    bottom = project(b.x + def.w, b.y + def.h),
    left = project(b.x, b.y + def.h);
  const up = (p: Pt): Pt => ({ x: p.x, y: p.y - h });
  return [up(top), up(right), right, bottom, left, up(left)];
}
/** Bildbox eines Punktobjekts: Spaltenbreite einer Kachel, Höhe über der Rautenmitte. */
export function pointBounds(cx: number, cy: number, height: number): Box {
  const c = project(cx, cy);
  return { x: c.x - ISO_W / 2, y: c.y - height, w: ISO_W, h: height + ISO_H / 2 };
}

export interface Moving {
  kind: 'ship' | 'walker' | 'boat';
  id: number;
  cx: number;
  cy: number;
}
export type SortedItem =
  | { kind: 'building'; id: number; fp: Footprint; key: number }
  | { kind: 'tree'; id: number; fp: Footprint; key: number; variant: number }
  | { kind: Moving['kind']; id: number; fp: Footprint; key: number; cx: number; cy: number };
const RANK = { tree: 0, building: 1, ship: 2, boat: 3, walker: 4 } as const;
const cmp = (a: SortedItem, b: SortedItem): number =>
  a.key - b.key || a.fp.x - b.fp.x || RANK[a.kind] - RANK[b.kind] || a.id - b.id;
const fixed = new WeakMap<World, { key: string; items: SortedItem[] }>();

/** Feste Objekte (Gebäude, Baumstempel) gecacht je Welt und `layoutKey`; bewegte je Aufruf eingemischt (D-09). */
export function sortedObjects(world: World, moving: readonly Moving[] = []): readonly SortedItem[] {
  const key = layoutKey(world);
  let c = fixed.get(world);
  if (!c || c.key !== key) {
    const items: SortedItem[] = [];
    for (const b of Object.values(world.buildings)) {
      const d = BUILDING_DEFS[b.defId];
      const fp = { x: b.x, y: b.y, w: d.w, h: d.h };
      items.push({ kind: 'building', id: b.id, fp, key: depthKey(fp) });
    }
    for (let y = 0; y < world.height; y++)
      for (let x = 0; x < world.width; x++) {
        const t = world.tiles[y * world.width + x]!;
        if (t.terrain !== 'forest' || t.buildingId !== null || t.road) continue;
        const fp = { x, y, w: 1, h: 1 };
        const variant = treeVariant(world.seed, x, y);
        items.push({ kind: 'tree', id: y * world.width + x, fp, key: depthKey(fp), variant });
      }
    items.sort(cmp);
    c = { key, items };
    fixed.set(world, c);
  }
  if (moving.length === 0) return c.items;
  const mv: SortedItem[] = moving
    .map((m) => {
      const fp = { x: m.cx - 0.5, y: m.cy - 0.5, w: 1, h: 1 };
      return { ...m, fp, key: depthKey(fp) };
    })
    .sort(cmp);
  const out: SortedItem[] = [];
  let i = 0,
    j = 0;
  while (i < c.items.length || j < mv.length)
    out.push(
      j >= mv.length || (i < c.items.length && cmp(c.items[i]!, mv[j]!) <= 0)
        ? c.items[i++]!
        : mv[j++]!,
    );
  return out;
}

export interface Hull {
  id: number;
  hull: readonly Pt[];
}
/** Körperhüllen aller Gebäude in Zeichenreihenfolge (nur Gebäude, D-14). */
export function buildingHulls(world: World): Hull[] {
  const out: Hull[] = [];
  for (const it of sortedObjects(world))
    if (it.kind === 'building') {
      const b = world.buildings[it.id]!;
      out.push({ id: b.id, hull: bodyHull(BUILDING_DEFS[b.defId], b) });
    }
  return out;
}
const inConvex = (h: readonly Pt[], x: number, y: number): boolean => {
  for (let i = 0; i < h.length; i++) {
    const a = h[i]!,
      b = h[(i + 1) % h.length]!;
    if ((b.x - a.x) * (y - a.y) - (b.y - a.y) * (x - a.x) < 0) return false;
  }
  return true;
};
/** Vorderstes Gebäude, dessen Körperhülle den Weltpunkt enthält; sonst null. */
export function pickBuilding(hulls: readonly Hull[], wx: number, wy: number): number | null {
  for (let i = hulls.length - 1; i >= 0; i--)
    if (inConvex(hulls[i]!.hull, wx, wy)) return hulls[i]!.id;
  return null;
}
