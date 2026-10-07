import { homeBuildings } from './homeBuildings';
import { home } from '../sim/world';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { layoutKey } from '../sim/queries';
import type { Building, BuildingDef, BuildingDefId, Category, World } from '../sim/types';
import { fieldWorld } from './terrainField';
import { massifPieces, type MassifPiece } from './massif';
import { woodLayout, type TileClass } from './forest';
import type { Crown } from './crown';
import { kontorPos, stampPlacements, type StampKind } from './decor';

// iso.ts — Kern (Setzung Spec D-01 bis D-05, D-13, D-16)
import { ISO_H, ISO_W, project, type Pt } from './isoBase';
export { ISO_H, ISO_W, project, type Pt };
export const H_MAX = 2 * ISO_H;
export const H_TOWER = 3 * ISO_H;
export const TEX = 32; // Texturpixel je Kachel bei Faktor 1 (ersetzt TILE in terrain.ts)
export const ZOOM_STEPS = [0.125, 0.25, 0.5, 0.75, 1, 1.5, 2] as const;
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
  kontor2: () => 1.4 * ISO_H, // M12: Aussenkontor, Form des Lagerhauses
  lumberjack: () => 1.2 * ISO_H, // Hütte mit Stapel
  // R2: übrige Typen (Richthöhen ISO 7.1; Betriebe 2 × 2 zwischen 1,2 und 1,6, Turm bis H_TOWER)
  market: () => 0.8 * ISO_H, // Stände mit Sonnendächern
  fisher: () => 1.0 * ISO_H,
  hunter: () => 1.0 * ISO_H, // M11-R2: Blockhütte mit Fellgestell und Holzstapel
  cattlefarm: () => 1.1 * ISO_H, // M11-R2: Stall mit Weide, Gatter und Heuballen
  quarry: () => 1.1 * ISO_H,
  sheepfarm: () => 1.2 * ISO_H,
  weaver: () => 1.3 * ISO_H,
  canefarm: () => 0.6 * ISO_H, // Halme; die Hütte steht vorn
  spicefarm: () => 0.6 * ISO_H, // M12: Zuckerrohr-Form mit eigenem Ton (D-144)
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
  | {
      kind: 'tree';
      id: number;
      fp: Footprint;
      key: number;
      /** Kronen der Zelle, Fusspunkte relativ zur Kachel `fp` (WALD-02, `woodLayout`). */
      crowns: readonly Crown[];
      /** Eng-Kachel (Nachbar eines Objekts): alle Kronen in der eigenen Kachel. */
      own: boolean;
    }
  | { kind: 'massif'; id: number; fp: Footprint; key: number; piece: MassifPiece }
  | { kind: 'decor'; id: number; fp: Footprint; key: number; stamp: StampKind; variant: number }
  | { kind: Moving['kind']; id: number; fp: Footprint; key: number; cx: number; cy: number };
const RANK = { massif: 0, tree: 1, decor: 1, building: 2, ship: 3, boat: 4, walker: 5 } as const;
const cmp = (a: SortedItem, b: SortedItem): number =>
  a.key - b.key || a.fp.x - b.fp.x || RANK[a.kind] - RANK[b.kind] || a.id - b.id;
const fixed = new WeakMap<World, { key: string; items: SortedItem[] }>();

/** Feste Objekte (Gebäude, Baumstempel, Massiv-Teilstücke) gecacht je Welt und `layoutKey`; bewegte je Aufruf eingemischt (D-09). */
export function sortedObjects(world: World, moving: readonly Moving[] = []): readonly SortedItem[] {
  const key = layoutKey(world);
  let c = fixed.get(world);
  if (!c || c.key !== key) {
    const items: SortedItem[] = [];
    for (const b of homeBuildings(world)) {
      const d = BUILDING_DEFS[b.defId];
      const fp = { x: b.x, y: b.y, w: d.w, h: d.h };
      items.push({ kind: 'building', id: b.id, fp, key: depthKey(fp) });
    }
    // Gebirgsmassiv (H-R9, A5): Teilstücke = Läufe freier Gebirgskacheln je Halbstreifen, Schlüssel und Grundfläche
    // der vordersten Kachel; jedes Objekt liegt im Halbstreifen ganz vor oder hinter einem Teilstück
    const isl = home(world);
    for (const piece of massifPieces(fieldWorld(world))) {
      const f = piece.tiles[piece.tiles.length - 1]!;
      const fp = { x: f % isl.width, y: Math.floor(f / isl.width), w: 1, h: 1 };
      items.push({ kind: 'massif', id: piece.id, fp, key: depthKey(fp), piece });
    }
    // Deko-Stempel (ART-STIL-02 L4, A5/A6/A9/A14): nur auf der Heimatinsel (D4); eine Inselansicht fremder Inseln zeigt
    // nur Boden-Deko. Die Liste entsteht hier, je `layoutKey`, nie je Frame; sie rückt bei Bau und Rodung nicht nach.
    const stampTiles = new Set<number>();
    if (!isl.kind || isl.kind === 'home')
      for (const s of stampPlacements(world.seed, isl, kontorPos(isl, world.buildings))) {
        const fp = { x: s.x, y: s.y, w: 1, h: 1 };
        stampTiles.add(s.y * isl.width + s.x);
        items.push({
          kind: 'decor',
          id: s.id,
          fp,
          key: depthKey(fp),
          stamp: s.kind,
          variant: s.variant,
        });
      }
    // Wald (WALD-02): jede Krone einzeln aus dem Saumfeld (`woodLayout`), je Tiefenband-Zelle ein Objekt. Gebäude, Wege
    // und Deko-Stempel sind Objekte (Nachbarkronen bleiben in ihrer Kachel), die Kacheln direkt vor einem Gebäude
    // (+x, +y, +x+y, Spec R3) tragen keinen Vorwald.
    const W = isl.width,
      H = isl.height;
    const tileAt = (x: number, y: number) =>
      x < 0 || y < 0 || x >= W || y >= H ? null : isl.tiles[y * W + x]!;
    const hasBuilding = (x: number, y: number): boolean => tileAt(x, y)?.buildingId != null;
    const cls = (x: number, y: number): TileClass => {
      const t = tileAt(x, y);
      if (!t) return 'blocked';
      if (t.buildingId !== null || t.road || stampTiles.has(y * W + x)) return 'object';
      if (t.terrain === 'forest') return 'forest';
      if (t.terrain !== 'grass') return 'blocked';
      return hasBuilding(x - 1, y) || hasBuilding(x, y - 1) || hasBuilding(x - 1, y - 1)
        ? 'quiet'
        : 'meadow';
    };
    const wood = woodLayout({
      seed: world.seed,
      w: W,
      h: H,
      terrainForest: (x, y) => tileAt(x, y)?.terrain === 'forest',
      cls,
    });
    wood.cells.forEach((c, i) => {
      const fp = { x: c.x, y: c.y, w: 1, h: 1 };
      items.push({ kind: 'tree', id: i, fp, key: depthKey(fp), crowns: c.crowns, own: c.own });
    });
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
