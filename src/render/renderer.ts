import { homeBuildings } from './homeBuildings';
import { BUILDING_DEFS } from '../sim/defs/buildings';
import { houseDiagnosis } from '../sim/queries';
import { HOME, home, tileAt } from '../sim/world';
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
import { isLit, lightAt, type Weather } from './daynight';
import {
  drawBoomCoin,
  drawFire,
  drawFireGlow,
  drawRain,
  drawStormEdge,
  drawWarnRing,
  smokePuffs,
  type Rect,
} from './fx';
import {
  HEARTH_PUFFS,
  GLOW_RADIUS,
  anchorRects,
  anchorsFor,
  boxAround,
  buildingClips,
  clipOutOccluders,
  clothesOf,
  coastFor,
  crownPolys,
  drawGull,
  drawHearthSmoke,
  drawWalker,
  drawWindowLight,
  gullAnchors,
  gullPose,
  gullShadow,
  hearthSmoke,
  occludersAfter,
  roadGraph,
  totalInhabitants,
  walkerAt,
  walkerCount,
  walkerShadow,
  type GullPose,
  type LightRect,
  type Occluder,
  type Poly,
  type WalkerPose,
} from './life';
import { cap, rainStreaks } from './limits';
import {
  TEX,
  bodyHull,
  project,
  sortedObjects,
  WOOD_SLICE_MS,
  spriteBounds,
  type Moving,
  type Pt,
  type SortedItem,
} from './iso';
import {
  SYMBOL_MIN_ZOOM,
  drawNeedSymbols,
  drawPlacementOverlay,
  drawUnconnected,
} from './overlays';
import { drawErrandLoad, errandsFrom, tickClock, walkersLeft, type ErrandPose } from './errands';
import { drawProgressRings } from './ring';
import { drawStatusMarks } from './statusMarks';
import { PALETTE, SHADOW, rgbaOf } from './palette';
import { LIGHT_COLORS, mixRgb } from './light';
import { drawShip, shipShadow, shipTile } from './ship';
import { seaShipAfter, shipPose, shipScale, type ShipPose } from './shipLane';
import { halfLayer, quarterLayer, terrainScale, updateTerrainLayer } from './terrain';
import {
  ARCHIPEL_VIEW,
  LOD_ZOOM,
  islandCam,
  islandView,
  visibleIslands,
  type ArchipelView,
} from './archipel';
import { massifBounds, massifCache, massifClips, massifOnScreen, type MassifItem } from './rocks';
import {
  DECOR_MIN_ZOOM,
  decorCacheBytes,
  decorCacheClears,
  decorShadow,
  drawDecorStamp,
  type DecorItem,
} from './decorStamps';
import { drawTreeStamp, treeBounds, treeShadow, type TreeItem } from './trees';
/** Culling-Zuschlag der Wald-Objekte in Kacheln (WALD-02). */
const TREE_CULL = 2;
import { drawWaves } from './water';
import { gradeAt, pickWeather } from './weather';
import { drawFlocks, drawWaterLife, wildlifeAt, type WildlifeEnv } from './wildlife';
import {
  drawFallSparks,
  drawFaunaAir,
  drawFireflies,
  drawGroundFauna,
  fallGlitter,
  faunaAt,
  type FaunaHit,
} from './fauna';
import {
  buildingShadow,
  drawAir,
  drawGhost,
  drawRoads,
  hearthAnchor,
  operatingPuffs,
  type BodyEnv,
} from './sprites';

import { drawBodyCached, spriteCache } from './spriteCache';
import { variantOf } from './variants';

/**
 * Abdunklung eines brennenden Gebäudes (Spec 6.5, S1): Multiplikation mit einem kühlen Faktor. Der Luma-Faktor bleibt
 * bei 0,65 (wie die frühere Schwarzfüllung mit 35 %), der Farbstich stammt aus dem Schattenton der Lichtsprache
 * (dark/cool); `DIM_FIRE_TINT` hält ihn dezent, damit Dachfarbe und Gebäudetyp lesbar bleiben.
 */
export const DIM_FIRE_LUMA = 0.65;
const DIM_FIRE_TINT = 0.3;
export const DIM_FIRE_FACTORS: readonly [number, number, number] = (() => {
  const t = mixRgb(LIGHT_COLORS.dark, LIGHT_COLORS.cool, 0.6);
  const y = 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2];
  return t.map((v) => DIM_FIRE_LUMA * (1 + DIM_FIRE_TINT * (v / y - 1))) as [
    number,
    number,
    number,
  ];
})();
export const DIM_FIRE = `rgb(${DIM_FIRE_FACTORS.map((f) => Math.round(f * 255)).join(',')})`;
const HOVER_LINE = '#fff'; // Umriss Weiss (Signal)
const HOVER_OK = rgbaOf(PALETTE.signalOk, 0.35);
const HOVER_BAD = rgbaOf(PALETTE.signalRed, 0.35);
const RASTER_COLOR = 'rgba(255,255,255,0.35)';

export type Tool =
  | { kind: 'select' }
  | { kind: 'build'; defId: BuildingDefId }
  | { kind: 'road' }
  | { kind: 'demolish' }
  | { kind: 'clearForest' }
  | { kind: 'plantForest' };

/** Darstellungs-Zusatz je Frame (Spec 11.1); Animation entsteht nur aus `timeMs` und dem Welt-Zustand. */
export interface RenderFx {
  timeMs: number;
  /** Krisenwetter bzw. Stimmungswetter (R3). */
  weather?: Weather;
  /** Brennende Betriebe (R3). */
  fire?: { id: number; flames: number; smoke: number }[];
  reduceMotion?: boolean;
  mood?: boolean;
  boom?: boolean;
  /** Tag-Nacht-Tönung; nur bei explizit `true` (Standard: aus). */
  dayNight?: boolean;
  /** Dev: Rautenraster über der Karte (nur unter `import.meta.env.DEV` gesetzt). */
  raster?: boolean;
  /** Archipel-Ansicht (Standard `ARCHIPEL_VIEW`); `jump`: nur die aktive Insel. */
  archipelView?: ArchipelView;
  /** Aktive Insel (Standard 0): Mouse-over, Auswahl und Signale gehören ihr. */
  activeIsland?: number;
}

/** Bodenebenen der Inseln; `get` darf im Notfall synchron rastern, `null` lässt die Insel in diesem Frame aus. */
export interface IslandLayers {
  get(i: number): HTMLCanvasElement | null;
}

/**
 * Umgebung für `wildlifeAt`: Bild und Mouse-over fragen mit derselben Umgebung ab (Spec M10 13.1), sonst nennt
 * der Mouse-over Tiere, die nicht gezeichnet sind.
 */
export function wildlifeEnvOf(world: World, fx: RenderFx): WildlifeEnv {
  return {
    phase: lightAt(world.tick).phase,
    weather: pickWeather(fx.weather, null).kind,
    reduce: fx.reduceMotion === true,
  };
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
  /** Laufweg-Figuren des letzten Frames (H-R4). */
  errands: 0,
  /** Sprite-Cache der Gebäudekörper (H-R6), nach jedem Frame aktualisiert: Treffer/Fehlgriffe seit Start, Bytes jetzt. */
  spriteHits: 0,
  spriteMisses: 0,
  spriteBytes: 0,
  /** Gebirgsmassiv (H-R9): gestempelte Teilstücke im letzten Frame, Flächen-Neubauten seit Start, Cache-Bytes jetzt. */
  massifDraws: 0,
  massifMisses: 0,
  massifBytes: 0,
  /** Deko-Stempel-Cache (L4): Leerungen wegen Seed-Wechsels seit Start und Bytes jetzt. */
  decorClears: 0,
  decorBytes: 0,
  /** Zähler des letzten Frames (M12 E1): gezeichnete Inseln, Wellen-Aufrufe, Figuren, Tiere, Rauchwolken. */
  islandsDrawn: 0,
  wavesDrawn: 0,
  walkersDrawn: 0,
  wildDrawn: 0,
  /** Tiere der Fauna (L7) im letzten Frame. */
  faunaDrawn: 0,
  smokeDrawn: 0,
};
if (import.meta.env.DEV) (globalThis as { __inselRender?: unknown }).__inselRender = renderStats;

export interface Hover {
  /** Insel unter dem Mauszeiger (M12 E2); fehlt sie, gilt die aktive Insel (Standard Heimat). */
  island?: number;
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
  const id = tileAt(home(world), x, y)?.buildingId;
  return id != null ? world.buildings[id] : undefined;
};

/** Bildbox eines Gebäudes in CSS-Pixeln (aus `spriteBounds`); nur für Effekte, nie fürs Picking. */
function screenRect(cam: Camera, b: Building): Rect {
  const box = spriteBounds(BUILDING_DEFS[b.defId], b);
  const a = worldToScreen(cam, { x: box.x, y: box.y }),
    z = worldToScreen(cam, { x: box.x + box.w, y: box.y + box.h });
  return { x: a.x, y: a.y, w: z.x - a.x, h: z.y - a.y };
}

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
  } else if (tool.kind === 'road' || tool.kind === 'clearForest' || tool.kind === 'plantForest') {
    // Forst-Werkzeuge: Rauten-Umriss der Kachel, Farbe wie die Weg-Vorschau (Spec 11.9)
    ctx.beginPath();
    footprintPath(ctx, cam, hover.x, hover.y, 1, 1);
    ctx.fillStyle = hover.ok ? HOVER_OK : HOVER_BAD;
    ctx.fill();
  } else {
    const b = buildingAt(world, hover.x, hover.y);
    const def = b ? BUILDING_DEFS[b.defId] : null;
    if (tool.kind === 'demolish' && hover.ok) {
      ctx.beginPath();
      footprintPath(ctx, cam, hover.x, hover.y, 1, 1);
      if (b && def) footprintPath(ctx, cam, b.x, b.y, def.w, def.h);
      ctx.fillStyle = HOVER_BAD;
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

/** Wasser an den vier Seiten des Footprints (für die Kaimauer): +v links, +u rechts, −u und −v hinten. */
export function waterSides(world: World, b: Building): Required<BodyEnv> {
  const def = BUILDING_DEFS[b.defId];
  const water = (x: number, y: number): boolean => tileAt(home(world), x, y)?.terrain === 'water';
  const r = { waterLeft: false, waterRight: false, waterU0: false, waterV0: false };
  for (let i = 0; i < def.h; i++) {
    r.waterRight ||= water(b.x + def.w, b.y + i);
    r.waterU0 ||= water(b.x - 1, b.y + i);
  }
  for (let i = 0; i < def.w; i++) {
    r.waterLeft ||= water(b.x + i, b.y + def.h);
    r.waterV0 ||= water(b.x + i, b.y - 1);
  }
  return r;
}

/** Reichweite des Schattens über den Bildrand hinaus (Weltpixel): Gebäude knapp ausserhalb werfen ihn noch ins Bild. */
const SHADOW_MARGIN = 64;

/** Reichweite des Feuerscheins in Gebäudebreiten um die Bildbox (Boden-Ellipse `fx.drawFireGlow`: 1,1). */
const FIRE_GLOW_REACH = 1.1;

/** Polygon im Kachelraum als Teilpfad des Schattenpfads. */
function polyPath(ctx: CanvasRenderingContext2D, poly: readonly Pt[]): void {
  poly.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.closePath();
}

/** Bedarfssymbole und rote Punkte des Frames mit Bildpunkt (Dev; spiegelt die Bedingungen aus `overlays.ts`). */
function collectBadges(world: World, cam: Camera, range: TileRange): void {
  for (const b of homeBuildings(world)) {
    if (b.x < range.x0 || b.x > range.x1 || b.y < range.y0 || b.y > range.y1) continue;
    const box = spriteBounds(BUILDING_DEFS[b.defId], b);
    const a = worldToScreen(cam, { x: box.x + box.w / 2, y: box.y });
    if (cam.zoom >= SYMBOL_MIN_ZOOM && b.house && houseDiagnosis(world, b).length > 0)
      renderStats.badges.push({ id: b.id, x: b.x, y: b.y, kind: 'need', sx: a.x, sy: a.y });
    if (!b.connected && b.defId !== 'house' && b.defId !== 'kontor')
      renderStats.badges.push({ id: b.id, x: b.x, y: b.y, kind: 'unconnected', sx: a.x, sy: a.y });
  }
}

/** Fenster und Laternen eines Gebäudes samt den Flächen, die sein Licht verdecken (leer: frei, gebündelt zeichnen). */
interface LightGroup {
  windows: LightRect[];
  lanterns: LightRect[];
  clip: Poly[][];
}

interface WindowLights {
  groups: LightGroup[];
  /** Stärke 0…1 der Fenster (`windows` aus `lightAt`). */
  k: number;
}

/**
 * Fenster leuchtender Gebäude und Laternen in Bildpunkten, je Gebäude; beide nur bei `windows > 0`, Laternen
 * unabhängig von `isLit` (R114). `occ` und `rank` (Gebäude-Id → Rang im sortierten Durchgang) liefern die Verdecker.
 */
function collectWindowLights(
  cam: Camera,
  buildings: readonly Building[],
  windows: number,
  occ: readonly (Occluder | null)[],
  rank: ReadonlyMap<number, number>,
): WindowLights {
  const out: WindowLights = { groups: [], k: windows };
  if (windows <= 0) return out; // Laternen folgen `windows` (R114): am Tag und bei dayNight false aus
  for (const b of buildings) {
    const def = BUILDING_DEFS[b.defId];
    const lit = isLit(def, b);
    const anchors = anchorsFor(def, b);
    if (!lit && !anchors.some((a) => a.always)) continue;
    const box = spriteBounds(def, b);
    const g: LightGroup = { windows: [], lanterns: [], clip: [] };
    anchorRects(cam, box, anchors).forEach((r, i) => {
      if (anchors[i]!.always) g.lanterns.push(r);
      else if (lit) g.windows.push(r);
    });
    const all = [...g.windows, ...g.lanterns];
    if (all.length === 0) continue;
    const at = rank.get(b.id);
    if (at !== undefined) g.clip = occludersAfter(occ, at, boxAround(all, GLOW_RADIUS * cam.zoom));
    out.groups.push(g);
  }
  return out;
}

/** Verdecker je Eintrag von `visible`: Gebäude, Bäume und Massiv-Teilstücke; Figuren und Schiff verdecken nicht. */
function occludersOf(
  world: World,
  cam: Camera,
  visible: readonly SortedItem[],
  shadowOnly: ReadonlySet<number>,
  stampSeed: number,
): (Occluder | null)[] {
  const toScreen = (r: { x: number; y: number; w: number; h: number }): LightRect => {
    const a = worldToScreen(cam, { x: r.x, y: r.y });
    return { x: a.x, y: a.y, w: r.w * cam.zoom, h: r.h * cam.zoom };
  };
  const once = <T>(fn: () => T): (() => T) => {
    let v: T | undefined;
    return () => (v ??= fn());
  };
  return visible.map((it) => {
    if (it.kind === 'building') {
      const b = world.buildings[it.id];
      if (!b || shadowOnly.has(b.id)) return null;
      const def = BUILDING_DEFS[b.defId];
      return {
        box: toScreen(spriteBounds(def, b)),
        clips: once(() => buildingClips(cam, world, b)),
      };
    }
    if (it.kind === 'tree') {
      const t = it as TreeItem;
      return {
        box: toScreen(treeBounds(t)),
        clips: once(() => crownPolys(cam, t, stampSeed).map((c) => [c])),
      };
    }
    if (it.kind === 'massif') {
      const m = it as MassifItem;
      return { box: toScreen(massifBounds(m)), clips: once(() => [[massifClips(cam, m)]]) };
    }
    return null;
  });
}

/** Frame-weite Werte, die jede Insel braucht (einmal je `render` berechnet). */
interface FrameEnv {
  weather: ReturnType<typeof pickWeather>;
  reduce: boolean;
  light: ReturnType<typeof lightAt>;
  /** Detailstufe (Zoom ≤ `LOD_ZOOM`). */
  lod: boolean;
  /** Seed der Welt für den Baumstempel-Cache; die Inselansichten haben eigene Seeds, der Cache gilt je Seed. */
  seed: number;
}

/** Was Schritte 8–12 von einer gezeichneten Insel brauchen. */
interface IslandFrame {
  island: number;
  v: World;
  ci: Camera;
  range: TileRange;
  empty: boolean;
  lit: { f: { id: number; flames: number; smoke: number }; rect: Rect }[];
  fireClips: Poly[][][];
  windowLights: WindowLights;
  /** Glühwürmchen dieser Insel für den einen additiven Durchgang (Schritt 10). */
  fireflies: FaunaHit[];
}

/** Schritte 2–7 (Boden bis Luft) einer Insel; `v` ist die Welt bzw. die Inselansicht, `ci` die Inselkamera. */
function drawIsland(
  ctx: CanvasRenderingContext2D,
  v: World,
  ci: Camera,
  terrainLayer: HTMLCanvasElement,
  view: { w: number; h: number },
  fx: RenderFx,
  env: FrameEnv,
  fleet: readonly { id: number; cx: number; cy: number }[] = [],
): IslandFrame {
  const { weather, reduce, light, lod } = env;
  const world = v;
  const cam = ci;
  const fires = new Map<number, { id: number; flames: number; smoke: number }>();
  for (const f of fx.fire ?? []) if (world.buildings[f.id]) fires.set(f.id, f);

  let windowLights: WindowLights = { groups: [], k: 0 };
  let fireClips: Poly[][][] = []; // je Eintrag von `lit`: Flächen, die sein Feuer verdecken
  let fireflies: FaunaHit[] = [];

  const range = visibleTileRange(cam, view, { w: home(world).width, h: home(world).height });
  const empty = range.x1 < range.x0 || range.y1 < range.y0;

  // sichtbare Feuer-Gebäude (Bildbox schneidet das Bild)
  const lit: { f: { id: number; flames: number; smoke: number }; rect: Rect }[] = [];
  if (!empty)
    for (const f of fires.values()) {
      const rect = screenRect(cam, world.buildings[f.id]!);
      if (rect.x > view.w || rect.x + rect.w < 0 || rect.y > view.h || rect.y + rect.h < 0)
        continue;
      lit.push({ f, rect });
    }

  // 2 Teil-Neuzeichnung der Terrain-Ebene (Belegung geändert), dann Boden
  const patch = updateTerrainLayer(terrainLayer, world);
  if (patch.redrawn) {
    renderStats.terrainPatches++;
    renderStats.terrainPatchMs = patch.ms;
  }

  if (!empty) {
    // Boden: nur das Quell-Teilrechteck der sichtbaren Kacheln; bei Zoom ≤ 0,5 die halbe, ≤ 0,25 die Viertel-Kopie
    const half = cam.zoom <= 0.5;
    const src = lod ? quarterLayer(terrainLayer) : half ? halfLayer(terrainLayer) : terrainLayer;
    if (half) renderStats.halfDraws++;
    const per = (TEX * terrainScale(terrainLayer)) / (lod ? 4 : half ? 2 : 1); // Quellpixel je Kachel
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
      if (!lod) {
        drawWaves(ctx, world, range, fx.timeMs, weather, reduce, true, cam.zoom);
        renderStats.wavesDrawn++;
      }
      drawRoads(ctx, world, range);
    });

    // Wasser- und Luftleben: eine Abfrage für Bild und Name (wildlifeAt); Bereich um 3 Kacheln erweitert
    const wildRange = {
      x0: Math.max(0, range.x0 - 3),
      y0: Math.max(0, range.y0 - 3),
      x1: Math.min(home(world).width - 1, range.x1 + 3),
      y1: Math.min(home(world).height - 1, range.y1 + 3),
    };
    const wild = lod ? [] : wildlifeAt(world, wildRange, fx.timeMs, wildlifeEnvOf(world, fx));
    if (!lod) drawWaterLife(ctx, cam, wild);
    renderStats.wildDrawn += wild.length;
    // Fauna an Land (L7): eine Abfrage; Bodentiere mischen sich nach Tiefe in den sortierten Durchgang, Luft folgt bei den Möwen
    // Glühwürmchen sind Lichter wie die Fenster: ohne Tag-Nacht-Wechsel (dayNight false) bleiben sie aus
    const fauna = lod
      ? []
      : faunaAt(world, wildRange, fx.timeMs, {
          ...wildlifeEnvOf(world, fx),
          zoom: cam.zoom,
        }).filter((h) => h.layer !== 'glow' || fx.dayNight === true);
    renderStats.faunaDrawn += fauna.length;
    const groundFauna = fauna.filter((h) => h.layer === 'ground');
    fireflies = fauna.filter((h) => h.layer === 'glow');
    let gf = 0;

    // Figuren: nur die im Bild; Pose rein aus Zeit und Weggraph (Spec 5.6)
    const poses = new Map<number, WalkerPose>();
    const moving: Moving[] = [];
    const ship = shipTile(world);
    if (ship) moving.push({ kind: 'ship', id: 0, cx: ship.x + 0.5, cy: ship.y + 0.5 });
    // Handelsschiffe im Rechteck dieser Insel (Inselkoordinaten, Tiefe wie jedes bewegte Objekt)
    for (const f of fleet) moving.push({ kind: 'ship', id: f.id, cx: f.cx, cy: f.cy });
    // Laufwege (H-R4) zuerst: sie zählen gegen das Figurenlimit, Spaziergänger bekommen den Rest
    const errands = lod ? [] : errandsFrom(world, range, tickClock(world, fx.timeMs), reduce);
    const errandPoses = new Map<number, ErrandPose>();
    for (const e of errands) {
      const tx = Math.floor(e.x),
        ty = Math.floor(e.y);
      if (tx < range.x0 || tx > range.x1 || ty < range.y0 || ty > range.y1) continue;
      errandPoses.set(e.id, e);
      poses.set(e.id, { x: e.x, y: e.y, alpha: e.alpha });
      moving.push({ kind: 'walker', id: e.id, cx: e.x, cy: e.y });
    }
    renderStats.errands += errandPoses.size;
    const count = lod
      ? 0
      : walkersLeft(walkerCount(totalInhabitants(world), reduce), errandPoses.size, reduce);
    if (count > 0) {
      const graph = roadGraph(world);
      for (let i = 0; i < count; i++) {
        const pose = walkerAt(graph, i, fx.timeMs, world.seed);
        if (!pose || pose.alpha <= 0.01) continue;
        const tx = Math.floor(pose.x),
          ty = Math.floor(pose.y);
        if (tx < range.x0 || tx > range.x1 || ty < range.y0 || ty > range.y1) continue;
        poses.set(i, pose);
        moving.push({ kind: 'walker', id: i, cx: pose.x, cy: pose.y });
      }
    }
    // Möwen: Kreisbahnen über der Küste im Bild, nicht nachts
    // (bei Regen und Sturm bleiben sie am Boden: keine Möwen)
    const gulls: GullPose[] =
      lod || weather.kind === 'rain' || weather.kind === 'storm'
        ? []
        : gullAnchors(coastFor(world), range, world.seed, light.phase, reduce).map((a) =>
            gullPose(a, world.seed, fx.timeMs),
          );

    // Sichtbare Objekte in Zeichenreihenfolge (D-09)
    const items = sortedObjects(world, moving, WOOD_SLICE_MS);
    const left = cam.x,
      top = cam.y,
      right = cam.x + view.w / cam.zoom,
      bottom = cam.y + view.h / cam.zoom;
    const visible: SortedItem[] = [];
    const buildings: Building[] = [];
    const shadowOnly = new Set<number>(); // knapp ausserhalb: nur der Schatten
    for (const it of items) {
      if (it.kind === 'building') {
        const b = world.buildings[it.id];
        if (!b) continue;
        const box = spriteBounds(BUILDING_DEFS[b.defId], b);
        const m = SHADOW_MARGIN;
        if (
          box.x > right + m ||
          box.x + box.w < left - m ||
          box.y > bottom + m ||
          box.y + box.h < top - m
        )
          continue;
        if (box.x > right || box.x + box.w < left || box.y > bottom || box.y + box.h < top)
          shadowOnly.add(b.id);
        else buildings.push(b);
      } else if (it.kind === 'massif') {
        if (!massifOnScreen(cam, view, it as MassifItem)) continue;
      } else if (it.kind === 'tree') {
        // 2 Kacheln Zuschlag (WALD-02): eine Tiefenband-Zelle hält Kronen bis 0,75 Kachel neben ihrer Kachel, die Kronen
        // ragen bis 0,35 Kachel über ihren Fuss hinaus
        if (
          it.fp.x < range.x0 - TREE_CULL ||
          it.fp.x > range.x1 + TREE_CULL ||
          it.fp.y < range.y0 - TREE_CULL ||
          it.fp.y > range.y1 + TREE_CULL
        )
          continue;
      } else if (it.kind === 'decor') {
        // Deko-Stempel: im Kachelbereich mit 1 Kachel Zuschlag (Kronen ragen über die Kachel), unter der Zoomschwelle nicht
        if (cam.zoom < DECOR_MIN_ZOOM[it.stamp]) continue;
        if (
          it.fp.x < range.x0 - 1 ||
          it.fp.x > range.x1 + 1 ||
          it.fp.y < range.y0 - 1 ||
          it.fp.y > range.y1 + 1
        )
          continue;
      } else if (it.kind !== 'ship' && it.kind !== 'walker') continue;
      visible.push(it);
    }

    // Verdecker von Licht und Feuer (BUG-LICHT): Objekte, die im sortierten Durchgang nach der Quelle kommen
    const rank = new Map<number, number>();
    visible.forEach((it, i) => it.kind === 'building' && rank.set(it.id, i));
    const occ = occludersOf(world, cam, visible, shadowOnly, env.seed);
    fireClips = lit.map(({ f, rect }) => {
      const at = rank.get(f.id);
      if (at === undefined) return [];
      return occludersAfter(occ, at, boxAround([rect], rect.w * FIRE_GLOW_REACH));
    });

    // 5 Schatten: alle Polygone in einem Pfad, eine Füllung (überlappende Schatten dunkeln nicht doppelt)
    if (visible.length > 0 || gulls.length > 0) {
      withGround(ctx, cam, () => {
        ctx.beginPath();
        for (const it of visible) {
          if (it.kind === 'building') {
            const b = world.buildings[it.id]!;
            polyPath(ctx, buildingShadow(BUILDING_DEFS[b.defId], b));
          } else if (it.kind === 'tree') polyPath(ctx, treeShadow(it as TreeItem));
          else if (it.kind === 'decor') {
            const sh = decorShadow(it as DecorItem);
            if (sh) polyPath(ctx, sh);
          } else if (it.kind === 'massif')
            continue; // Licht- und Schattenseite liegen im Netz
          else if (it.kind === 'walker') {
            if ((poses.get(it.id)?.alpha ?? 0) >= 0.5)
              polyPath(ctx, walkerShadow({ x: it.cx, y: it.cy }));
          } else polyPath(ctx, shipShadow({ x: it.cx - 0.5, y: it.cy - 0.5 }));
        }
        for (const g of gulls) polyPath(ctx, gullShadow(g));
        ctx.fillStyle = SHADOW;
        ctx.fill();
        renderStats.shadowFills++;
      });
    }

    // 6 Sortierter Objektdurchgang
    for (const it of visible) {
      // Bodentiere vor dem ersten Objekt mit grösserem Schlüssel (Gleichstand: nach dem Objekt)
      while (gf < groundFauna.length && groundFauna[gf]!.key < it.key)
        drawGroundFauna(ctx, cam, groundFauna[gf++]!);
      if (it.kind === 'building') {
        if (shadowOnly.has(it.id)) continue;
        const b = world.buildings[it.id]!;
        const def = BUILDING_DEFS[b.defId];
        drawBodyCached(
          ctx,
          cam,
          def,
          b,
          fx.timeMs,
          def.id === 'kontor' || def.id === 'kontor2' ? waterSides(world, b) : undefined,
          variantOf(world.seed, b.x, b.y),
        );
        // Abdunklung direkt nach dem Körper, damit sie kein Gebäude davor abdunkelt (Plan R3)
        if ((fires.get(b.id)?.flames ?? 0) > 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'multiply';
          ctx.beginPath();
          hullPath(ctx, cam, b);
          ctx.fillStyle = DIM_FIRE;
          ctx.fill();
          ctx.restore();
        }
      } else if (it.kind === 'tree') drawTreeStamp(ctx, cam, it as TreeItem, env.seed);
      else if (it.kind === 'decor') drawDecorStamp(ctx, cam, it as DecorItem, env.seed);
      else if (it.kind === 'massif') massifCache.draw(ctx, cam, it as MassifItem);
      else if (it.kind === 'ship')
        drawShip(ctx, cam, { x: it.cx - 0.5, y: it.cy - 0.5 }, fx.timeMs, shipScale(cam.zoom));
      else if (it.kind === 'walker') {
        const pose = poses.get(it.id);
        if (pose) {
          drawWalker(ctx, cam, pose, clothesOf(world.seed, it.id));
          renderStats.walkersDrawn++;
        }
        const er = errandPoses.get(it.id);
        if (er) drawErrandLoad(ctx, cam, er);
      }
    }

    while (gf < groundFauna.length) drawGroundFauna(ctx, cam, groundFauna[gf++]!);

    const sc = spriteCache.stats();
    renderStats.spriteHits = sc.hits;
    renderStats.spriteMisses = sc.misses;
    renderStats.spriteBytes = sc.bytes;
    const mc = massifCache.stats();
    renderStats.massifDraws = mc.draws;
    renderStats.massifMisses = mc.misses;
    renderStats.massifBytes = mc.bytes;
    renderStats.decorClears = decorCacheClears();
    renderStats.decorBytes = decorCacheBytes();

    // 7 Luft. Rauch-Budget CAP_SMOKE: zuerst Feuer (Krisensignal), dann Betriebe, dann Herdrauch
    let budget = lod ? 0 : cap('smoke', reduce);
    const own = lit.map(({ f }) => {
      const n = Math.min(smokePuffs(f.smoke, reduce), budget);
      budget -= n;
      renderStats.smokeDrawn += n;
      return n;
    });
    for (const b of lod ? [] : buildings) {
      const def = BUILDING_DEFS[b.defId];
      const n = Math.min(operatingPuffs(def, b), budget);
      budget -= n;
      renderStats.smokeDrawn += n;
      drawAir(ctx, cam, def, b, fx.timeMs, n);
    }
    for (const b of lod ? [] : buildings) {
      const inh = b.house?.inhabitants ?? 0;
      if (budget <= 0 || !hearthSmoke(light.phase, inh)) continue;
      const at = hearthAnchor(BUILDING_DEFS[b.defId], b, cam);
      if (!at) continue;
      const n = Math.min(HEARTH_PUFFS, budget);
      budget -= n;
      renderStats.smokeDrawn += n;
      drawHearthSmoke(ctx, cam, at, b.id, fx.timeMs, n);
    }
    for (const g of gulls) drawGull(ctx, cam, g);
    if (!lod) drawFlocks(ctx, cam, wild);
    drawFaunaAir(ctx, cam, fauna, world.seed);
    // Gischt am L6-Wasserfall (nur Heimat; `fallGlitter` lässt Fremdinseln und kleine Zoomstufen leer)
    if (!lod) {
      const sparks = fallGlitter(world, wildRange, fx.timeMs, { zoom: cam.zoom, reduce });
      if (sparks.length > 0) drawFallSparks(ctx, cam, sparks);
    }
    // Feuer im Luftdurchgang: Flammen immer, Rauch im Rahmen seines Anteils am Budget
    lit.forEach(({ f, rect }, i) => {
      const clip = fireClips[i]!;
      if (clip.length > 0) {
        ctx.save();
        clipOutOccluders(ctx, view, clip);
      }
      drawFire(ctx, rect, fx.timeMs, {
        flames: f.flames,
        smoke: f.smoke,
        reduce,
        maxPuffs: own[i]!,
      });
      if (clip.length > 0) ctx.restore();
    });
    windowLights = collectWindowLights(
      cam,
      buildings,
      fx.dayNight === true ? light.windows : 0,
      occ,
      rank,
    );
  }
  return { island: -1, v, ci, range, empty, lit, fireClips, windowLights, fireflies };
}

/**
 * Zeichnet einen Frame (Ebenen nach ISO §5, soweit es sie in R1b gibt). `ctx` muss bereits per
 * devicePixelRatio skaliert sein; `view` ist die Ansichtsgrösse in CSS-Pixeln.
 */
export function render(
  ctx: CanvasRenderingContext2D,
  world: World,
  cam: Camera,
  layers: HTMLCanvasElement | IslandLayers,
  hover: Hover | null,
  selectedId: number | null,
  view: { w: number; h: number },
  fx: RenderFx = { timeMs: 0 },
): void {
  renderStats.multiplyFills = 0;
  renderStats.shadowFills = 0;
  renderStats.badges.length = 0;
  renderStats.islandsDrawn = 0;
  renderStats.wavesDrawn = 0;
  renderStats.walkersDrawn = 0;
  renderStats.wildDrawn = 0;
  renderStats.faunaDrawn = 0;
  renderStats.smokeDrawn = 0;
  renderStats.errands = 0;
  // DPR aus der Basismatrix (app.ts setzt sie per setTransform); ohne getTransform (Fake) gilt 1
  const dpr = ctx.getTransform?.()?.a;
  spriteCache.beginFrame(cam.zoom, dpr && Number.isFinite(dpr) && dpr > 0 ? dpr : 1);
  massifCache.beginFrame(dpr && Number.isFinite(dpr) && dpr > 0 ? dpr : 1);
  const weather = pickWeather(fx.weather, null); // nur Klemmen; die Wahl trifft die UI
  const reduce = fx.reduceMotion === true;
  const light = lightAt(world.tick); // Phase für Leben und Fensterlicht (läuft auch bei dayNight false weiter)

  // 1 Hintergrund
  ctx.fillStyle = PALETTE.waterDeep;
  ctx.fillRect(0, 0, view.w, view.h);

  // 2–7 Boden bis Luft
  const mode = fx.archipelView ?? ARCHIPEL_VIEW;
  const active = world.islands[fx.activeIsland ?? HOME] ? (fx.activeIsland ?? HOME) : HOME;
  const layerOf = (i: number): HTMLCanvasElement | null =>
    'get' in layers && typeof layers.get === 'function'
      ? layers.get(i)
      : i === HOME
        ? (layers as HTMLCanvasElement)
        : null;
  const camOf = (i: number): Camera => (i === HOME ? cam : islandCam(cam, world.islands[i]!));
  const env: FrameEnv = { weather, reduce, light, lod: cam.zoom <= LOD_ZOOM, seed: world.seed };
  const frames: IslandFrame[] = [];
  // Handelsschiffe (M12 E4): im Rechteck einer Insel bewegtes Objekt dieser Insel, sonst auf See (Tiefe nach Inseln)
  const poses = world.ships.map((s) => ({ id: s.id, pose: shipPose(world, s) }));
  const sea = poses
    .filter((p) => p.pose.island === null)
    .sort((a, b) => a.pose.x + a.pose.y - (b.pose.x + b.pose.y) || a.id - b.id);
  let seaNext = 0;
  const drawSea = (until: (p: ShipPose) => boolean): void => {
    while (seaNext < sea.length && until(sea[seaNext]!.pose)) drawSeaShip(sea[seaNext++]!.pose);
  };
  const drawSeaShip = (pose: ShipPose): void => {
    const c = worldToScreen(cam, project(pose.x, pose.y));
    const m = 80; // knapp ausserhalb: nichts zu sehen
    if (c.x < -m || c.y < -m || c.x > view.w + m || c.y > view.h + m) return;
    withGround(ctx, cam, () => {
      ctx.beginPath();
      polyPath(ctx, shipShadow({ x: pose.x - 0.5, y: pose.y - 0.5 }));
      ctx.fillStyle = SHADOW;
      ctx.fill();
    });
    drawShip(ctx, cam, { x: pose.x - 0.5, y: pose.y - 0.5 }, fx.timeMs, shipScale(cam.zoom));
  };
  for (const i of visibleIslands(cam, view, world.islands, active, mode)) {
    const layer = layerOf(i);
    if (!layer) continue;
    drawSea((p) => !seaShipAfter(p, world.islands[i]!)); // See-Schiffe vor dieser Insel
    renderStats.islandsDrawn++;
    const isl = world.islands[i]!;
    const fleet = poses
      .filter((p) => p.pose.island === i)
      .map((p) => ({ id: p.id, cx: p.pose.x - isl.ox, cy: p.pose.y - isl.oy }));
    frames.push({
      ...drawIsland(ctx, islandView(world, i), camOf(i), layer, view, fx, env, fleet),
      island: i,
    });
  }
  drawSea(() => true);
  // Signale, Auswahl und Mouse-over gehören der aktiven Insel; ist sie nicht im Bild, gilt ein leerer Bereich
  const act: IslandFrame = frames.find((f) => f.island === active) ?? {
    island: active,
    v: islandView(world, active),
    ci: camOf(active),
    range: { x0: 0, y0: 0, x1: -1, y1: -1 },
    empty: true,
    lit: [],
    fireClips: [],
    windowLights: { groups: [], k: 0 },
    fireflies: [],
  };
  const { range, empty } = act;
  const lit = frames.flatMap((f) => f.lit);
  const fireClips = frames.flatMap((f) => f.fireClips);
  const windowLights: WindowLights = {
    groups: frames.flatMap((f) => f.windowLights.groups),
    k: frames[0]?.windowLights.k ?? 0,
  };

  // 8 Sturm-Randschatten
  if (weather.kind === 'storm') drawStormEdge(ctx, view, weather.w);

  // 9 Tönung: genau ein Multiply-Durchgang (Licht mal Wetter); bei neutralem Licht entfällt er
  const mul = gradeAt(world.tick, weather, fx.dayNight === true);
  if (mul.some((c) => c < 0.999)) {
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = `rgb(${mul.map((c) => Math.round(c * 255)).join(',')})`;
    ctx.fillRect(0, 0, view.w, view.h);
    ctx.restore();
    renderStats.multiplyFills++;
  }

  // 10 Additiver Durchgang (höchstens einer): Fensterlicht, Laternen, Feuerglühen
  const glowing = lit.some(({ f }) => f.flames > 0);
  const lights = windowLights.groups;
  const glowFlies = frames.some((f) => f.fireflies.length > 0);
  if (glowing || lights.length > 0 || glowFlies) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    // frei stehende Gebäude gebündelt, verdeckte einzeln unter ihren Clips (BUG-LICHT)
    const free = lights.filter((g) => g.clip.length === 0);
    drawWindowLight(
      ctx,
      cam.zoom,
      free.flatMap((g) => g.windows),
      windowLights.k,
    );
    drawWindowLight(
      ctx,
      cam.zoom,
      free.flatMap((g) => g.lanterns),
      windowLights.k,
    );
    for (const g of lights) {
      if (g.clip.length === 0) continue;
      ctx.save();
      clipOutOccluders(ctx, view, g.clip);
      drawWindowLight(ctx, cam.zoom, g.windows, windowLights.k);
      drawWindowLight(ctx, cam.zoom, g.lanterns, windowLights.k);
      ctx.restore();
    }
    lit.forEach(({ f, rect }, i) => {
      const clip = fireClips[i]!;
      if (clip.length > 0) {
        ctx.save();
        clipOutOccluders(ctx, view, clip);
      }
      drawFireGlow(ctx, rect, fx.timeMs, f.flames);
      if (clip.length > 0) ctx.restore();
    });
    for (const f of frames) drawFireflies(ctx, f.ci, f.fireflies);
    ctx.restore();
  }

  // 11 Regen
  if (weather.kind === 'rain' || weather.kind === 'storm')
    drawRain(ctx, view, cam.zoom, weather.kind, rainStreaks(weather.w, reduce), fx.timeMs);

  // 12 Signale (Bildraum, ungetönt, nie unter der Bodenmatrix) der aktiven Insel
  const av = act.v;
  const acam = act.ci;
  // Bau-Vorschau, Zonen, Abdeckung und Mouse-over gehören der Insel unter dem Mauszeiger (M12 E2);
  // fehlt `hover.island`, gilt die aktive Insel. Liegt sie nicht im Bild, entfällt die Anzeige.
  const hf = hover
    ? hover.island === undefined
      ? act
      : frames.find((f) => f.island === hover.island)
    : undefined;
  if (hover && hf && hover.tool?.kind === 'build')
    drawPlacementOverlay(ctx, hf.v, hf.ci, hf.range, hover.tool.defId, hover.x, hover.y);

  for (const { f, rect } of lit) if (f.flames > 0) drawWarnRing(ctx, rect, fx.timeMs);
  const kontor = av.buildings[home(av).kontorId];
  if (fx.boom === true && kontor && !empty) drawBoomCoin(ctx, screenRect(acam, kontor), fx.timeMs);
  drawNeedSymbols(ctx, av, acam, range);
  drawUnconnected(ctx, av, acam, range);
  drawStatusMarks(ctx, av, acam, range, fx.timeMs, reduce);
  drawProgressRings(ctx, av, acam, range, tickClock(av, fx.timeMs).frac);
  if (import.meta.env.DEV) collectBadges(av, acam, range);

  // Auswahl: das Gebäude hebt sich in der Ansicht seiner Insel ab (Id in der Kopie gleich)
  const selB = selectedId === null ? undefined : world.buildings[selectedId];
  const sf = selB ? frames.find((f) => f.island === selB.island) : undefined;
  const sel = sf ? sf.v.buildings[selectedId!] : undefined;
  if (sel && sf) {
    const def = BUILDING_DEFS[sel.defId];
    ctx.save();
    ctx.beginPath();
    footprintPath(ctx, sf.ci, sel.x, sel.y, def.w, def.h);
    hullPath(ctx, sf.ci, sel);
    ctx.strokeStyle = PALETTE.signalYellow;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  }

  if (hover && hf) drawHover(ctx, hf.v, hf.ci, hover);

  if (fx.raster === true && !empty) {
    ctx.save();
    ctx.beginPath();
    for (let y = range.y0; y <= range.y1; y++)
      for (let x = range.x0; x <= range.x1; x++) {
        const [a, b, c, d] = tileCorners(acam, x, y);
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
