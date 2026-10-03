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
export const ROCK_VARIANTS = 8;
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

/** Gestaltvariante des Felsmassivs auf (x, y): rein aus Seed und Kachel (Darstellung, kein Spielzustand). */
export const rockVariant = (seed: number, x: number, y: number): number =>
  Math.floor(hash2(seed + 71, x, y) * ROCK_VARIANTS) % ROCK_VARIANTS;

// iso.ts — Fortsetzung
/** Platzhalter-Höhe je Kategorie über der oberen Ecke des vollen Footprints (Weltpixel, Zoom 1, D-12). */
const CATEGORY_HEIGHT: Record<Category, number> = {
  housing: 1.0 * ISO_H,
  production: 1.2 * ISO_H,
  public: 1.6 * ISO_H,
  infrastructure: 1.4 * ISO_H,
};
/** R1b, R2 und R2-FW tragen hier die Höhen der Silhouetten ein; die Signaturen bleiben. */
export const BODY_HEIGHTS: Partial<Record<BuildingDefId, (b: Building) => number>> = {
  // Hütte, Fachwerk, Bürgerhaus mit Gaube, Kaufmannshaus mit Treppengiebel (M8-R1, Spitze 2,08 · ISO_H < H_TOWER)
  house: (b) => [0.8, 1.2, 1.6, 2.0][Math.min(b.house?.tier ?? 1, 4) - 1]! * ISO_H,
  kontor: () => 1.4 * ISO_H, // Lagerhaus
  lumberjack: () => 1.2 * ISO_H, // Hütte mit Stapel
  // R2: übrige Typen (Richthöhen ISO 7.1; Betriebe 2 × 2 zwischen 1,2 und 1,6, Turm bis H_TOWER)
  market: () => 0.8 * ISO_H, // Stände mit Sonnendächern
  fisher: () => 1.0 * ISO_H,
  quarry: () => 1.1 * ISO_H,
  sheepfarm: () => 1.2 * ISO_H,
  weaver: () => 1.3 * ISO_H,
  canefarm: () => 0.6 * ISO_H, // Halme; die Hütte steht vorn
  distillery: () => 1.4 * ISO_H,
  toolmaker: () => 1.3 * ISO_H,
  chapel: () => 2.2 * ISO_H, // Glockenturm: Spitze bis 2,2 + 0,35 = 2,55 · ISO_H, unter H_TOWER
  school: () => 1.5 * ISO_H,
  bathhouse: () => 1.4 * ISO_H, // M8-R1: Kubus mit flacher Kuppel, Portikus, Becken; Kuppelscheitel unter H_TOWER
  glassworks: () => 1.6 * ISO_H, // M8-R1: Werkhalle, Glasofenkegel bis 1,97 · ISO_H, unter H_TOWER
  townhall: () => 2.0 * ISO_H, // M10-R1: Halle mit Uhrturm, Spitze genau auf der Hüllenkante, Höhe = H_MAX
  firestation: () => 1.7 * ISO_H, // Wachhaus mit Glockenstuhl: Spitze bis 1,7 + 0,5 = 2,2 · ISO_H, unter H_TOWER
};
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
  | { kind: 'rock'; id: number; fp: Footprint; key: number; variant: number; shadow: boolean }
  | { kind: Moving['kind']; id: number; fp: Footprint; key: number; cx: number; cy: number };
const RANK = { rock: 0, tree: 1, building: 2, ship: 3, boat: 4, walker: 5 } as const;
const cmp = (a: SortedItem, b: SortedItem): number =>
  a.key - b.key || a.fp.x - b.fp.x || RANK[a.kind] - RANK[b.kind] || a.id - b.id;
const fixed = new WeakMap<World, { key: string; items: SortedItem[] }>();

/** Feste Objekte (Gebäude, Baum- und Felsstempel) gecacht je Welt und `layoutKey`; bewegte je Aufruf eingemischt (D-09). */
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
        if (t.terrain === 'mountain' && t.buildingId === null && !t.road) {
          const fp = { x, y, w: 1, h: 1 };
          const variant = rockVariant(world.seed, x, y);
          // Schatten fällt nach rechts unten: nur sichtbar, wenn dort offenes Gelände liegt (Binnenfelsen sparen ihn)
          const open = (dx: number, dy: number): boolean =>
            x + dx >= world.width ||
            y + dy >= world.height ||
            world.tiles[(y + dy) * world.width + x + dx]!.terrain !== 'mountain';
          const shadow = open(1, 0) || open(0, 1) || open(1, 1);
          items.push({
            kind: 'rock',
            id: y * world.width + x,
            fp,
            key: depthKey(fp),
            variant,
            shadow,
          });
          continue;
        }
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
  /** Gezeichnete Körperpolygone (Weltpixel), lazy: nur für Treffer des Hüllen-Vorfilters (R113). */
  shape?: () => readonly (readonly Pt[])[];
}
type ShapeFn = (def: BuildingDef, b: Building) => readonly (readonly Pt[])[];
let shapeProvider: ShapeFn | null = null;
/** Meldet die Quelle der gezeichneten Körperpolygone an (`sprites.ts` beim Laden; iso.ts importiert sprites nicht, ISO §4). */
export const setBodyShapes = (fn: ShapeFn): void => {
  shapeProvider = fn;
};
/** Körperhüllen aller Gebäude in Zeichenreihenfolge (nur Gebäude, D-14). */
export function buildingHulls(world: World): Hull[] {
  const out: Hull[] = [];
  for (const it of sortedObjects(world))
    if (it.kind === 'building') {
      const b = world.buildings[it.id]!;
      const def = BUILDING_DEFS[b.defId];
      out.push({
        id: b.id,
        hull: bodyHull(def, b),
        ...(shapeProvider ? { shape: () => shapeProvider!(def, b) } : {}),
      });
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
/** Punkt in beliebigem Polygon (Strahlverfahren). */
const inPoly = (poly: readonly Pt[], x: number, y: number): boolean => {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i]!,
      b = poly[j]!;
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
};
/**
 * Vorderstes Gebäude unter dem Weltpunkt (R113): die Körperhülle ist nur Vorfilter; bei Treffern entscheiden die
 * gezeichneten Silhouetten-Polygone (vorn zuerst). Hüllen ohne `shape` gelten als Körper.
 */
export function pickBuilding(hulls: readonly Hull[], wx: number, wy: number): number | null {
  for (let i = hulls.length - 1; i >= 0; i--) {
    const h = hulls[i]!;
    if (!inConvex(h.hull, wx, wy)) continue;
    if (!h.shape || h.shape().some((poly) => inPoly(poly, wx, wy))) return h.id;
  }
  return null;
}
