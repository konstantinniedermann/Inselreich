import { BUILDING_DEFS } from '../sim/defs/buildings';
import { hash2 } from '../sim/noise';
import { home } from '../sim/world';
import type { World } from '../sim/types';
import { worldToScreen, type Camera, type TileRange } from './camera';
import { phaseAt, type Phase, type WeatherKind } from './daynight';
import { forestClearing } from './forest';
import { flowerTonesFor, flowerVeil } from './groundDecor';
import { ISO_H, ISO_W, project } from './iso';
import { cap, type CapName } from './limits';
import { PALETTE, SHADOW, mixHex, rgbaOfCss, toInk, toLight } from './palette';
import { TREE_H } from './trees';
import { BIRD_COLOR } from './wildlife';
import type { WildlifeEnv } from './wildlife';

// fauna.ts — Tierleben an Land und auf See (ART-STIL-02 L7). Kosmetisch und deterministisch aus `timeMs`, `world.seed`
// und Gelände (nur `hash2`, kein anderer Zufall); kein Zustand ausser Caches je Welt, kein Schreibzugriff auf die Welt.
// `faunaAt` ist die eine Quelle für das Bild (Muster `wildlifeAt`); die Zeichner sind dünn und bündeln je Art und Ton.
// Anker je Welt einmal (WeakMap, ein Eintrag je Welt bzw. Inselansicht, fällt mit ihr weg), global nach Rang auf
// `cap(...)` gekappt, erst danach filtern Bereich, Phase, Wetter, Zoom und der aktuelle Weltzustand (Hasen und Rehe
// weichen Wegen und Gebäuden, Abriss bringt sie zurück). Weitere Arten (T2) sind nur Einträge in `SPECIES` und `SITES`.
// Salze (ART-STIL-02 Anhang 0.2, Belegung 585–594; Spiegel im Kopf von groundDecor.ts):
//   585 Los der seltenen Arten (`faunaLot`, `hash2(seed + 585, k, 0)`, k je Art in `LOT_K`) · 586 Zellenanteil und
//   Ankerschlüssel (je Art `x + 4096 · (k + 1)`) · 587 Posen: Zyklusversatz, Rastplätze, Hasen- und Rehwege ·
//   588 Episoden (Fuchs, Waldvögel): Periode, Versatz, Richtung · 589 Gestalt (Falterton, Hirsch oder Reh, Flugbahn) ·
//   590 Glühwürmchen: Drift und Puls · 591–594 frei für T2 (Gebirge, Küste, Meer).

export type FaunaId = 'butterfly' | 'hare' | 'firefly' | 'deer' | 'fox' | 'forestBird';
/** Alle Arten des Katalogs (T2-Arten sind schon als Zeilen für L8 da, ohne Anker). */
export type FaunaCatalogId =
  FaunaId | 'ibex' | 'fall' | 'eagle' | 'crab' | 'turtle' | 'seal' | 'cormorant' | 'dolphin';
/** `ground`: im sortierten Durchgang · `air`: nach den Objekten · `glow`: im einen additiven Durchgang. */
export type FaunaLayer = 'ground' | 'air' | 'glow';

/**
 * Ein Tier im Bild. `x`, `y` Bodenpunkt im Kachelraum, `z` Höhe in Weltpixeln, `tx`, `ty` Kachel des Bodenpunkts,
 * `key` Tiefenschlüssel dieser Kachel (`depthKey`), `alpha` 0…1, `flip` Blickrichtung im Bild (+1 rechts).
 * `state`/`phase` je Art: Hase 0 sitzt, 1 knabbert, 2 hoppelt (phase = Verlauf des Hoppelns bzw. Knabbertakt) ·
 * Reh 0 rastet, 1 geht (phase = Kopf unten 0…1) · Fuchs phase = Laufzyklus 0…1 · Falter phase = Flügelöffnung 0…1,
 * state = Farbton 0…2 · Waldvogel phase = Flügelschlag −1…1 · Glühwürmchen phase = Puls 0…1. `variant`: Reh 0 / Hirsch 1.
 */
export interface FaunaHit {
  id: FaunaId;
  layer: FaunaLayer;
  x: number;
  y: number;
  z: number;
  tx: number;
  ty: number;
  key: number;
  alpha: number;
  flip: 1 | -1;
  state: number;
  phase: number;
  variant: number;
}

/** Umgebung wie bei `wildlifeAt`; dazu der Zoom (Mindestzoom je Art, Spec §3), ohne Angabe kein Zoomfilter. */
export interface FaunaEnv extends WildlifeEnv {
  zoom?: number;
}

export interface FaunaCatalogRow {
  id: FaunaCatalogId;
  rarity: 'G' | 'S' | 'E';
  /** Das Gelände trägt die Art (vor dem Los). */
  eligible: boolean;
  /** Die Art steht auf dieser Insel (nach Eignung, Los und Kappe; ohne Zeit und Tageszeit). */
  present: boolean;
}

interface Pt2 {
  x: number;
  y: number;
}
interface Anchor {
  tx: number;
  ty: number;
  /** Rang für die Kappung (Hash-Schlüssel plus Abstand zum Kontor). */
  rank: number;
}

// --- Setzungen (Darstellungswerte, keine Spielwerte) ----------------------------------------------------

const FAUNA_SALT = {
  lot: 585,
  site: 586,
  pose: 587,
  episode: 588,
  shape: 589,
  glow: 590,
} as const;
/** Anteil der Inseln, auf denen eine seltene Art vorkommt (Los, bis L8 das Seltenheitsbudget übernimmt). */
export const FAUNA_LOT_SHARE = 0.45;
const LOT_K: Record<FaunaCatalogId, number> = {
  butterfly: 0,
  hare: 1,
  firefly: 2,
  deer: 3,
  fox: 4,
  forestBird: 5,
  ibex: 6,
  fall: 7,
  eagle: 8,
  crab: 9,
  turtle: 10,
  seal: 11,
  cormorant: 12,
  dolphin: 13,
};
/** Mindestabstand (Chebyshev, Kacheln) der Hasen zu Weg und Gebäude; der Ruheplatz liegt bis 1 Kachel neben dem Anker. */
export const HARE_GAP = 3;
const HARE_RADIUS = 0.8;
const DEER_RADIUS = 0.5;
/** Lichtungsfeld ab dem der Fuchs über die Lichtung huscht (`forestClearing`). */
export const FOX_CLEARING = 0.5;
export const FOX_RUN_MS = 2500;
export const FOREST_BIRD_MS = 3200;

const ALL_PHASES: readonly Phase[] = ['morning', 'day', 'evening', 'night'];
const DAYLIGHT: readonly Phase[] = ['morning', 'day', 'evening'];
const FAIR: readonly WeatherKind[] = ['clear', 'cloudy'];

const clampTime = (t: number): number => (Number.isFinite(t) ? Math.max(0, t) : 0);
const sg = (v: number): 1 | -1 => (v < 0 ? -1 : 1);
const smooth = (a: number, b: number, v: number): number => {
  const k = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return k * k * (3 - 2 * k);
};

/** Los einer Art (S-Arten): eine austauschbare Funktion, L8 ersetzt sie durch das Seltenheitsbudget. */
export function faunaLot(seed: number, id: FaunaCatalogId): boolean {
  const def = SPECIES.find((s) => s.id === id);
  if (!def || def.rarity === 'G') return true;
  return hash2(seed + FAUNA_SALT.lot, LOT_K[id], 0) < FAUNA_LOT_SHARE;
}

// --- Gelände --------------------------------------------------------------------------------------------

type Isl = ReturnType<typeof home>;
const terrainAt = (isl: Isl, x: number, y: number): string =>
  x < 0 || y < 0 || x >= isl.width || y >= isl.height
    ? 'out'
    : isl.tiles[y * isl.width + x]!.terrain;
const builtAt = (isl: Isl, x: number, y: number): boolean => {
  if (x < 0 || y < 0 || x >= isl.width || y >= isl.height) return false;
  const t = isl.tiles[y * isl.width + x]!;
  return t.buildingId !== null || t.road;
};
/** Steht in der Chebyshev-Umgebung `r` um (x, y) ein Weg oder Gebäude (heutiger Weltzustand)? */
const builtWithin = (isl: Isl, x: number, y: number, r: number): boolean => {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) if (builtAt(isl, x + dx, y + dy)) return true;
  return false;
};
const anyWithin = (
  isl: Isl,
  x: number,
  y: number,
  r: number,
  pred: (terrain: string) => boolean,
): boolean => {
  for (let dy = -r; dy <= r; dy++)
    for (let dx = -r; dx <= r; dx++) if (pred(terrainAt(isl, x + dx, y + dy))) return true;
  return false;
};
const allWithin = (
  isl: Isl,
  x: number,
  y: number,
  r: number,
  pred: (terrain: string) => boolean,
): boolean => !anyWithin(isl, x, y, r, (t) => !pred(t));
const isForest = (t: string): boolean => t === 'forest';
const isLandGreen = (t: string): boolean => t === 'forest' || t === 'grass';

// --- Orte (statische Eignung, einmal je Welt) -------------------------------------------------------------

interface SiteDef {
  cell: number;
  share: number;
  /** Eignung der Kachel (Gelände zum Zeitpunkt des Cache-Aufbaus). */
  ok: (isl: Isl, seed: number, x: number, y: number) => boolean;
}
const SITES: Partial<Record<FaunaCatalogId, SiteDef>> = {
  // A15 Blumenwiese: Graskachel mit Blumenschleier
  butterfly: {
    cell: 4,
    share: 0.8,
    ok: (isl, seed, x, y) =>
      terrainAt(isl, x, y) === 'grass' &&
      !builtAt(isl, x, y) &&
      flowerVeil(seed, x + 0.5, y + 0.5) > 0.25,
  },
  // A16 Wiesenrand: Gras mit Wald in 3 Kacheln, ringsum Land, nichts Gebautes im Umkreis
  hare: {
    cell: 8,
    share: 0.7,
    ok: (isl, _s, x, y) =>
      terrainAt(isl, x, y) === 'grass' &&
      anyWithin(isl, x, y, 3, isForest) &&
      allWithin(isl, x, y, 1, isLandGreen) &&
      !builtWithin(isl, x, y, HARE_GAP + 1),
  },
  // A17 Wiese am Waldrand
  firefly: {
    cell: 4,
    share: 0.7,
    ok: (isl, _s, x, y) =>
      terrainAt(isl, x, y) === 'grass' &&
      anyWithin(isl, x, y, 2, isForest) &&
      !builtWithin(isl, x, y, 2),
  },
  // B9 Waldrand ↔ Wiese
  deer: {
    cell: 12,
    share: 1,
    ok: (isl, _s, x, y) =>
      terrainAt(isl, x, y) === 'grass' &&
      anyWithin(isl, x, y, 2, isForest) &&
      allWithin(isl, x, y, 1, isLandGreen) &&
      !builtWithin(isl, x, y, 3),
  },
  // B10 Lichtung (B2): Waldkachel im Lichtungsfeld
  fox: {
    cell: 16,
    share: 1,
    ok: (isl, seed, x, y) =>
      terrainAt(isl, x, y) === 'forest' &&
      forestClearing(seed, x + 0.5, y + 0.5) >= FOX_CLEARING &&
      allWithin(isl, x, y, 1, isLandGreen) &&
      !builtWithin(isl, x, y, 1),
  },
  // B11 Waldkern: ringsum Wald
  forestBird: {
    cell: 8,
    share: 0.8,
    ok: (isl, _s, x, y) =>
      isForest(terrainAt(isl, x, y)) && allWithin(isl, x, y, 2, isForest) && !builtAt(isl, x, y),
  },
};

interface Cached {
  /** Gekappte Anker je Art, nach Rang (für reduziert gilt ein Präfix). */
  sites: Partial<Record<FaunaCatalogId, Anchor[]>>;
  eligible: Partial<Record<FaunaCatalogId, number>>;
}
const cache = new WeakMap<World, Cached>();

/** Vögel je Anker (normal, reduziert): die Obergrenze zählt Vögel, nicht Orte. */
const perAnchor = (id: FaunaCatalogId, reduce: boolean): number =>
  id === 'forestBird' ? (reduce ? 2 : 3) : 1;
const limitOf = (sp: SpeciesDef, reduce: boolean): number =>
  Math.floor(cap(sp.capKey, reduce) / perAnchor(sp.id, reduce));

function anchorsOf(world: World): Cached {
  let c = cache.get(world);
  if (c) return c;
  const isl = home(world);
  const seed = world.seed;
  const k = world.buildings[isl.kontorId];
  const kd = k ? BUILDING_DEFS[k.defId] : null;
  const near =
    k && kd ? { x: k.x + kd.w / 2, y: k.y + kd.h / 2 } : { x: isl.width / 2, y: isl.height / 2 };
  c = { sites: {}, eligible: {} };
  for (const sp of SPECIES) {
    const site = SITES[sp.id];
    if (!site) continue;
    const found: Anchor[] = [];
    const lk = LOT_K[sp.id] + 1;
    const cx1 = Math.ceil(isl.width / site.cell),
      cy1 = Math.ceil(isl.height / site.cell);
    for (let cy = 0; cy < cy1; cy++)
      for (let cx = 0; cx < cx1; cx++) {
        if (hash2(seed + FAUNA_SALT.site, cx + 4096 * lk, cy) >= site.share) continue;
        let best: Anchor | null = null;
        for (let y = cy * site.cell; y < Math.min(isl.height, (cy + 1) * site.cell); y++)
          for (let x = cx * site.cell; x < Math.min(isl.width, (cx + 1) * site.cell); x++) {
            if (!site.ok(isl, seed, x, y)) continue;
            const key = hash2(seed + FAUNA_SALT.site, x + 4096 * lk, y + 100000);
            const rank = key + Math.hypot(x + 0.5 - near.x, y + 0.5 - near.y) / isl.width;
            if (!best || rank < best.rank) best = { tx: x, ty: y, rank };
          }
        if (best) found.push(best);
      }
    c.eligible[sp.id] = found.length;
    found.sort((a, b) => a.rank - b.rank);
    c.sites[sp.id] = faunaLot(seed, sp.id) ? found.slice(0, limitOf(sp, false)) : [];
  }
  cache.set(world, c);
  return c;
}

// --- Posen (rein aus Zeit und Seed) ---------------------------------------------------------------------

interface PoseCtx {
  seed: number;
  t: number;
  reduce: boolean;
}
const hit = (
  id: FaunaId,
  layer: FaunaLayer,
  x: number,
  y: number,
  z: number,
  extra: Partial<FaunaHit> = {},
): FaunaHit => {
  const tx = Math.floor(x),
    ty = Math.floor(y);
  return {
    id,
    layer,
    x,
    y,
    z,
    tx,
    ty,
    key: 2 * tx + 2 * ty + 2,
    alpha: 1,
    flip: 1,
    state: 0,
    phase: 0,
    variant: 0,
    ...extra,
  };
};
/** Blickrichtung im Bild für eine Bewegung (dx, dy) im Kachelraum. */
const screenFlip = (dx: number, dy: number): 1 | -1 => sg(dx - dy);

interface Wander extends Pt2 {
  /** −1 rastet, sonst Verlauf 0…1 des Wegs zum nächsten Platz. */
  moving: number;
  flip: 1 | -1;
  /** Zyklusanteil 0…1. */
  u: number;
}
/**
 * Rast- und Wegzyklus am Anker: Die Plätze liegen im Radius `radius` um die Kachelmitte; ein Zyklus rastet bis `rest`
 * und geht dann zum nächsten Platz. Gleichstand der Argumente: Salz 587 mit wechselnden Argumenten.
 */
function wander(
  seed: number,
  a: Anchor,
  t: number,
  period: number,
  rest: number,
  radius: number,
  kk: number,
): Wander {
  const off = hash2(seed + FAUNA_SALT.pose, a.tx * 97 + kk, a.ty * 89) * period;
  const s = t + off;
  const k = Math.floor(s / period);
  const u = (s - k * period) / period;
  const spot = (i: number): Pt2 => {
    const ang = hash2(seed + FAUNA_SALT.pose, a.tx * 97 + kk + i * 3, a.ty * 89 + 1) * Math.PI * 2;
    const r =
      radius * Math.sqrt(hash2(seed + FAUNA_SALT.pose, a.tx * 97 + kk + i * 3 + 1, a.ty * 89 + 2));
    return { x: a.tx + 0.5 + Math.cos(ang) * r, y: a.ty + 0.5 + Math.sin(ang) * r };
  };
  const p0 = spot(k);
  if (u < rest) {
    const pr = spot(k - 1);
    return { x: p0.x, y: p0.y, moving: -1, flip: screenFlip(p0.x - pr.x, p0.y - pr.y), u };
  }
  const p1 = spot(k + 1);
  const q = (u - rest) / (1 - rest);
  const e = q * q * (3 - 2 * q);
  return {
    x: p0.x + (p1.x - p0.x) * e,
    y: p0.y + (p1.y - p0.y) * e,
    moving: q,
    flip: screenFlip(p1.x - p0.x, p1.y - p0.y),
    u,
  };
}

function poseButterfly(a: Anchor, i: number, c: PoseCtx, out: FaunaHit[]): void {
  const { seed, t } = c;
  const hh = (n: number): number => hash2(seed + FAUNA_SALT.shape, a.tx * 13 + n, a.ty);
  const p1 = hh(1) * 6.28,
    p2 = hh(2) * 6.28,
    p3 = hh(3) * 6.28;
  const x =
    a.tx + 0.5 + 0.45 * Math.sin(t / (1300 + 400 * hh(4)) + p1) + 0.2 * Math.sin(t / 530 + p2);
  const y =
    a.ty + 0.5 + 0.45 * Math.cos(t / (1700 + 400 * hh(5)) + p2) + 0.2 * Math.sin(t / 610 + p3);
  const z = ISO_H * (0.2 + 0.3 * (0.5 + 0.5 * Math.sin(t / 900 + p3)));
  const flapMs = 150 + 100 * hh(6);
  const flap = Math.abs(Math.sin((Math.PI * (t + hh(7) * 1000)) / flapMs));
  out.push(
    hit('butterfly', 'air', x, y, z, {
      phase: flap,
      state: Math.min(2, Math.floor(hh(8) * 3)),
      flip: screenFlip(Math.cos(t / 1300 + p1), Math.sin(t / 1700 + p2)),
      variant: i,
    }),
  );
}

function poseHare(a: Anchor, _i: number, c: PoseCtx, out: FaunaHit[]): void {
  const { seed, t } = c;
  const period = 7000 + 3000 * hash2(seed + FAUNA_SALT.pose, a.tx, a.ty * 3);
  const w = wander(seed, a, t, period, 0.88, HARE_RADIUS, 1);
  if (w.moving >= 0) {
    const hops = 2 + Math.floor(hash2(seed + FAUNA_SALT.pose, a.tx * 5, a.ty) * 2);
    const z = Math.abs(Math.sin(Math.PI * w.moving * hops)) * 0.2 * ISO_H;
    out.push(hit('hare', 'ground', w.x, w.y, z, { state: 2, phase: w.moving, flip: w.flip }));
  } else if (w.u < 0.7) out.push(hit('hare', 'ground', w.x, w.y, 0, { state: 0, flip: w.flip }));
  else
    out.push(hit('hare', 'ground', w.x, w.y, 0, { state: 1, phase: (t / 260) % 1, flip: w.flip }));
}

function poseDeer(a: Anchor, _i: number, c: PoseCtx, out: FaunaHit[]): void {
  const { seed, t } = c;
  const period = 14000 + 4000 * hash2(seed + FAUNA_SALT.pose, a.tx * 7, a.ty);
  const w = wander(seed, a, t, period, 0.9, DEER_RADIUS, 2);
  const ph = hash2(seed + FAUNA_SALT.shape, a.tx * 17, a.ty) * 6.28;
  const down =
    w.moving >= 0 ? 0 : smooth(-0.2, 0.4, Math.sin((t / (5200 + 700 * (ph % 1))) * 1 + ph));
  const variant = hash2(seed + FAUNA_SALT.shape, a.tx * 19, a.ty) < 0.4 ? 1 : 0;
  out.push(
    hit('deer', 'ground', w.x, w.y, 0, {
      state: w.moving >= 0 ? 1 : 0,
      phase: down,
      flip: w.flip,
      variant,
    }),
  );
}

function poseFox(a: Anchor, _i: number, c: PoseCtx, out: FaunaHit[]): void {
  const { seed, t } = c;
  const period = 24000 + 12000 * hash2(seed + FAUNA_SALT.episode, a.tx, a.ty);
  const s = t + hash2(seed + FAUNA_SALT.episode, a.tx + 1, a.ty) * period;
  const k = Math.floor(s / period);
  const u = s - k * period;
  if (u >= FOX_RUN_MS) return;
  const dir = Math.floor(hash2(seed + FAUNA_SALT.episode, a.tx * 3 + k, a.ty) * 8) * (Math.PI / 4);
  const dx = Math.cos(dir),
    dy = Math.sin(dir);
  const p = u / FOX_RUN_MS;
  const d = -1.5 + 3 * p;
  const x = a.tx + 0.5 + dx * d,
    y = a.ty + 0.5 + dy * d;
  const alpha = Math.min(1, u / 250, (FOX_RUN_MS - u) / 250);
  out.push(
    hit('fox', 'ground', x, y, Math.abs(Math.sin(u / 90)) * 0.06 * ISO_H, {
      alpha,
      flip: screenFlip(dx, dy),
      phase: (u / 180) % 1,
    }),
  );
}

function poseForestBirds(a: Anchor, i: number, c: PoseCtx, out: FaunaHit[]): void {
  const { seed, t, reduce } = c;
  const period = 16000 + 10000 * hash2(seed + FAUNA_SALT.episode, a.tx * 5, a.ty + 9);
  const s = t + hash2(seed + FAUNA_SALT.episode, a.tx * 5 + 1, a.ty + 9) * period;
  const k = Math.floor(s / period);
  const u = s - k * period;
  if (u >= FOREST_BIRD_MS) return;
  const p = u / FOREST_BIRD_MS;
  const n = perAnchor('forestBird', reduce);
  const base = hash2(seed + FAUNA_SALT.episode, a.tx * 5 + k, a.ty + 10) * Math.PI * 2;
  for (let b = 0; b < n; b++) {
    const ang = base + (b - (n - 1) / 2) * 0.35;
    const reach = 2 * p * (0.85 + 0.15 * hash2(seed + FAUNA_SALT.episode, a.tx * 5 + b, a.ty + 11));
    const rise = TREE_H * (0.9 + 0.9 * Math.sin(Math.PI * Math.min(1, p * 0.9)));
    const x = a.tx + 0.5 + Math.cos(ang) * reach,
      y = a.ty + 0.5 + Math.sin(ang) * reach;
    out.push(
      hit('forestBird', 'air', x, y, rise + 0.15 * ISO_H * b * p, {
        alpha: Math.min(1, p / 0.1, (1 - p) / 0.3),
        flip: screenFlip(Math.cos(ang), Math.sin(ang)),
        phase: Math.sin(t / 85 + b * 1.7 + i),
      }),
    );
  }
}

function poseFirefly(a: Anchor, _i: number, c: PoseCtx, out: FaunaHit[]): void {
  const { seed, t } = c;
  const hh = (n: number): number => hash2(seed + FAUNA_SALT.glow, a.tx * 11 + n, a.ty);
  const x =
    a.tx + 0.5 + 0.7 * Math.sin(t / 3100 + hh(1) * 6.28) + 0.3 * Math.sin(t / 1300 + hh(2) * 6.28);
  const y =
    a.ty + 0.5 + 0.7 * Math.cos(t / 3700 + hh(3) * 6.28) + 0.3 * Math.sin(t / 1500 + hh(4) * 6.28);
  const z = ISO_H * (0.15 + 0.25 * (0.5 + 0.5 * Math.sin(t / 2700 + hh(5) * 6.28)));
  // weiches Pulsieren: nie ganz aus (Minimum 0,3)
  const pulse = 0.5 + 0.5 * Math.sin(t / (1100 + 400 * hh(6)) + hh(7) * 6.28);
  out.push(hit('firefly', 'glow', x, y, z, { alpha: 0.3 + 0.7 * pulse, phase: pulse }));
}

// --- Arten ----------------------------------------------------------------------------------------------

interface SpeciesDef {
  id: FaunaCatalogId;
  rarity: 'G' | 'S';
  capKey: CapName;
  /** Mindestzoom (Spec §3). */
  minZoom: number;
  phases: readonly Phase[];
  /** Erlaubtes Wetter; `null` bei jedem. */
  weather: readonly WeatherKind[] | null;
  /** Der heutige Weltzustand erlaubt den Anker (Hasen und Rehe weichen Wegen und Gebäuden). */
  alive?: (isl: Isl, a: Anchor) => boolean;
  pose?: (a: Anchor, i: number, c: PoseCtx, out: FaunaHit[]) => void;
}
const notBuilt =
  (r: number) =>
  (isl: Isl, a: Anchor): boolean =>
    !builtWithin(isl, a.tx, a.ty, r);

const SPECIES: readonly SpeciesDef[] = [
  {
    id: 'butterfly',
    rarity: 'G',
    capKey: 'butterflies',
    minZoom: 1,
    phases: ['morning', 'day'],
    weather: FAIR,
    alive: (isl, a) => terrainAt(isl, a.tx, a.ty) === 'grass' && !builtAt(isl, a.tx, a.ty),
    pose: poseButterfly,
  },
  {
    id: 'hare',
    rarity: 'G',
    capKey: 'hares',
    minZoom: 1,
    phases: DAYLIGHT,
    weather: null,
    alive: notBuilt(HARE_GAP + 1),
    pose: poseHare,
  },
  {
    id: 'firefly',
    rarity: 'G',
    capKey: 'fireflies',
    minZoom: 0.75,
    phases: ['night'],
    weather: FAIR,
    alive: notBuilt(1),
    pose: poseFirefly,
  },
  {
    id: 'deer',
    rarity: 'S',
    capKey: 'deer',
    minZoom: 0.75,
    phases: ['morning', 'evening'],
    weather: null,
    alive: notBuilt(2),
    pose: poseDeer,
  },
  {
    id: 'fox',
    rarity: 'S',
    capKey: 'fox',
    minZoom: 1,
    phases: DAYLIGHT,
    weather: null,
    alive: (isl, a) => !builtAt(isl, a.tx, a.ty),
    pose: poseFox,
  },
  {
    id: 'forestBird',
    rarity: 'G',
    capKey: 'forestBirds',
    minZoom: 0.75,
    phases: DAYLIGHT,
    weather: FAIR,
    alive: (isl, a) => isForest(terrainAt(isl, a.tx, a.ty)) && !builtAt(isl, a.tx, a.ty),
    pose: poseForestBirds,
  },
  // T2 (Gebirge, Küste, Meer): Zeilen für den Katalog, noch ohne Anker und Pose
  { id: 'ibex', rarity: 'G', capKey: 'ibex', minZoom: 1, phases: DAYLIGHT, weather: null },
  { id: 'fall', rarity: 'G', capKey: 'glitter', minZoom: 0.75, phases: ALL_PHASES, weather: null },
  { id: 'eagle', rarity: 'G', capKey: 'eagle', minZoom: 0.5, phases: DAYLIGHT, weather: FAIR },
  { id: 'crab', rarity: 'G', capKey: 'crabs', minZoom: 1.5, phases: DAYLIGHT, weather: null },
  { id: 'turtle', rarity: 'S', capKey: 'turtle', minZoom: 1, phases: DAYLIGHT, weather: null },
  { id: 'seal', rarity: 'S', capKey: 'seals', minZoom: 0.75, phases: DAYLIGHT, weather: null },
  {
    id: 'cormorant',
    rarity: 'S',
    capKey: 'cormorants',
    minZoom: 1,
    phases: DAYLIGHT,
    weather: null,
  },
  {
    id: 'dolphin',
    rarity: 'S',
    capKey: 'dolphins',
    minZoom: 0.5,
    phases: DAYLIGHT,
    weather: ['clear', 'cloudy', 'rain'],
  },
];

/**
 * Zähl-Schnittstelle für L8 (Seltenheitsbudget): eine Zeile je Art, rein und ohne Zeit. `eligible`: das Gelände trägt
 * die Art; `present`: sie steht nach Los und Kappe auf der Insel.
 */
export function faunaCatalog(world: World): FaunaCatalogRow[] {
  const c = anchorsOf(world);
  return SPECIES.map((sp) => {
    return {
      id: sp.id,
      rarity: sp.rarity,
      eligible: (c.eligible[sp.id] ?? 0) > 0,
      present: (c.sites[sp.id]?.length ?? 0) > 0,
    };
  });
}

const inRange = (r: TileRange, x: number, y: number): boolean =>
  x >= r.x0 && x < r.x1 + 1 && y >= r.y0 && y < r.y1 + 1;

/**
 * Alle Tiere der Ansicht im Bereich zur Zeit `timeMs`, nach `key` sortiert (leerer Bereich → []). Rein, wirft nicht,
 * schreibt nie in die Welt. Die Menge hängt nie vom Bereich ab (Kappe je Welt, danach Filter).
 */
export function faunaAt(
  world: World,
  range: TileRange,
  timeMs: number,
  env: FaunaEnv = {},
): FaunaHit[] {
  if (!(range.x1 >= range.x0) || !(range.y1 >= range.y0)) return [];
  const phase = env.phase ?? phaseAt(world.tick);
  const weather = env.weather ?? 'clear';
  const reduce = env.reduce === true;
  const zoom = env.zoom;
  const c = anchorsOf(world);
  const isl = home(world);
  const pc: PoseCtx = { seed: world.seed, t: clampTime(timeMs), reduce };
  const out: FaunaHit[] = [];
  for (const sp of SPECIES) {
    if (!sp.pose) continue;
    if (!sp.phases.includes(phase)) continue;
    if (sp.weather && !sp.weather.includes(weather)) continue;
    if (zoom !== undefined && zoom < sp.minZoom) continue;
    const list = c.sites[sp.id] ?? [];
    const n = Math.min(list.length, limitOf(sp, reduce));
    for (let i = 0; i < n; i++) {
      const a = list[i]!;
      if (sp.alive && !sp.alive(isl, a)) continue;
      sp.pose(a, i, pc, out);
    }
  }
  return out.filter((h) => inRange(range, h.x, h.y)).sort((a, b) => a.key - b.key);
}

// --- Zeichner (dünn, Bildraum) --------------------------------------------------------------------------

export const HARE_COLOR = mixHex(PALETTE.wallTimber, PALETTE.rockLight, 0.55);
export const HARE_BELLY = toInk(HARE_COLOR, 0.25);
export const DEER_COLOR = mixHex(PALETTE.roofTerracotta, PALETTE.roofTimber, 0.55);
export const DEER_BELLY = toInk(DEER_COLOR, 0.3);
export const ANTLER_COLOR = mixHex(PALETTE.wallTimber, PALETTE.wallLime, 0.4);
export const FOX_COLOR = mixHex(
  mixHex(PALETTE.roofTerracotta, PALETTE.roofThatch, 0.3),
  PALETTE.wallTimber,
  0.25,
);
export const FOX_BELLY = toInk(FOX_COLOR, 0.3);
export const FOX_TIP = PALETTE.wallLime;
export const FIREFLY_COLOR = mixHex(
  mixHex(PALETTE.roofThatch, PALETTE.wallLime, 0.3),
  PALETTE.grassLight,
  0.7,
);
const TAU = Math.PI * 2;
/** Kontaktschatten kleiner Tiere: der Bodenschatten (`SHADOW`) etwas zarter, damit er nicht wie ein Gebäudeschatten liest. */
const FAUNA_SHADOW = SHADOW.replace('0.35', '0.28');

const at = (cam: Camera, x: number, y: number, z: number): Pt2 => {
  const p = project(x, y);
  return worldToScreen(cam, { x: p.x, y: p.y - z });
};
const blob = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  rx: number,
  ry: number,
): void => {
  ctx.moveTo(x + rx, y);
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
};
const tri = (ctx: CanvasRenderingContext2D, a: Pt2, b: Pt2, c: Pt2): void => {
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.lineTo(c.x, c.y);
  ctx.closePath();
};
function shadowOf(ctx: CanvasRenderingContext2D, g: Pt2, rx: number): void {
  ctx.beginPath();
  blob(ctx, g.x, g.y, rx, rx * 0.45);
  ctx.fillStyle = FAUNA_SHADOW;
  ctx.fill();
}

/** Ein Bodentier (Hase, Reh, Fuchs) im sortierten Durchgang: Kontaktschatten, Körper in zwei Tönen, dünner Eigenton. */
export function drawGroundFauna(ctx: CanvasRenderingContext2D, cam: Camera, h: FaunaHit): void {
  if (h.alpha <= 0) return;
  const s = cam.zoom;
  const g = at(cam, h.x, h.y, 0);
  const c = { x: g.x, y: g.y - h.z * s };
  ctx.save();
  if (h.alpha < 1) ctx.globalAlpha = h.alpha;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (h.id === 'hare') drawHare(ctx, g, c, s, h);
  else if (h.id === 'deer') drawDeer(ctx, g, c, s, h);
  else if (h.id === 'fox') drawFox(ctx, g, c, s, h);
  ctx.restore();
}

function drawHare(ctx: CanvasRenderingContext2D, g: Pt2, c: Pt2, s: number, h: FaunaHit): void {
  const f = h.flip;
  shadowOf(ctx, g, 4.6 * s * (1 - Math.min(0.4, h.z / ISO_H)));
  const hop = h.state === 2;
  const nib = h.state === 1 ? 2 * Math.sin(h.phase * TAU) * s : 0;
  const body = hop ? { x: 0, y: -3, rx: 5.2, ry: 2.8 } : { x: 0, y: -3.4, rx: 3.6, ry: 3.4 };
  const head = hop ? { x: f * 5.6, y: -4.4 } : { x: f * 3.2, y: -7.2 + (h.state === 1 ? 2.4 : 0) };
  const hx = c.x + head.x * s,
    hy = c.y + head.y * s + nib;
  ctx.beginPath();
  blob(ctx, c.x + body.x * s, c.y + body.y * s, body.rx * s, body.ry * s);
  blob(ctx, hx, hy, 2.1 * s, 1.9 * s);
  ctx.fillStyle = HARE_COLOR;
  ctx.fill();
  // Ohren: zwei lange schmale Dreiecke, beim Hoppeln nach hinten gelegt
  ctx.beginPath();
  for (let e = 0; e < 2; e++) {
    const o = (e === 0 ? -0.9 : 0.5) * f * s;
    const tip = hop
      ? { x: hx - f * (5 - e) * s, y: hy - (2.4 - e * 0.6) * s }
      : { x: hx + (o > 0 ? 1.1 : -0.3) * f * s, y: hy - (7 - e) * s };
    tri(
      ctx,
      { x: hx + o - 0.8 * s, y: hy - 1.4 * s },
      { x: hx + o + 0.8 * s, y: hy - 1.4 * s },
      tip,
    );
  }
  ctx.fill();
  ctx.beginPath();
  blob(
    ctx,
    c.x + body.x * s,
    c.y + (body.y + body.ry * 0.45) * s,
    body.rx * 0.75 * s,
    body.ry * 0.42 * s,
  );
  ctx.fillStyle = HARE_BELLY;
  ctx.fill();
  ctx.beginPath();
  blob(ctx, c.x - f * (body.rx + 0.4) * s, c.y + (body.y - 0.2) * s, 1.3 * s, 1.3 * s);
  ctx.fillStyle = mixHex(HARE_COLOR, PALETTE.wallLime, 0.6);
  ctx.fill();
  ctx.beginPath();
  blob(ctx, c.x + body.x * s, c.y + body.y * s, body.rx * s, body.ry * s);
  blob(ctx, hx, hy, 2.1 * s, 1.9 * s);
  ctx.strokeStyle = toInk(HARE_COLOR, 0.5);
  ctx.lineWidth = Math.max(0.8, 0.8 * s);
  ctx.stroke();
}

function drawDeer(ctx: CanvasRenderingContext2D, g: Pt2, c: Pt2, s: number, h: FaunaHit): void {
  const f = h.flip;
  shadowOf(ctx, g, 8.5 * s);
  const down = h.phase;
  const head = { x: c.x + f * (9.6 + 0.9 * down) * s, y: c.y + (-19 + 14.8 * down) * s };
  const ink = toInk(DEER_COLOR, 0.55);
  const swing = h.state === 1 ? Math.sin((h.x + h.y) * 3 * TAU) * 2 : 0;
  // Beine: ein Pfad, dünner Eigenton
  ctx.beginPath();
  for (const [lx, sw] of [
    [-5.4, swing],
    [-3.4, -swing],
    [3.4, -swing],
    [5.4, swing],
  ] as const) {
    ctx.moveTo(c.x + lx * s, c.y - 9 * s);
    ctx.lineTo(c.x + (lx + sw) * s, c.y);
  }
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1, 1.3 * s);
  ctx.stroke();
  // Hals
  ctx.beginPath();
  ctx.moveTo(c.x + f * 6.3 * s, c.y - 12.6 * s);
  ctx.lineTo(head.x, head.y);
  ctx.strokeStyle = DEER_COLOR;
  ctx.lineWidth = 3.4 * s;
  ctx.stroke();
  // Rumpf, Kopf
  ctx.beginPath();
  blob(ctx, c.x, c.y - 11 * s, 8.5 * s, 4.2 * s);
  blob(ctx, head.x, head.y, 3 * s, 1.9 * s);
  ctx.fillStyle = DEER_COLOR;
  ctx.fill();
  ctx.beginPath();
  blob(ctx, c.x, c.y - 9 * s, 7 * s, 1.9 * s);
  ctx.fillStyle = DEER_BELLY;
  ctx.fill();
  ctx.beginPath();
  tri(
    ctx,
    { x: head.x - f * 0.6 * s, y: head.y - 1.2 * s },
    { x: head.x + f * 0.8 * s, y: head.y - 1.2 * s },
    { x: head.x - f * 1.6 * s, y: head.y - 4 * s },
  );
  ctx.fillStyle = DEER_COLOR;
  ctx.fill();
  ctx.beginPath();
  blob(ctx, c.x - f * 8.7 * s, c.y - 12.4 * s, 1.3 * s, 1.5 * s);
  ctx.fillStyle = mixHex(DEER_COLOR, PALETTE.wallLime, 0.55);
  ctx.fill();
  if (h.variant === 1) {
    // Hirsch: Geweih mit zwei Zinken
    ctx.beginPath();
    ctx.moveTo(head.x - f * 0.4 * s, head.y - 1.6 * s);
    ctx.lineTo(head.x - f * 1.4 * s, head.y - 8 * s);
    ctx.moveTo(head.x - f * 1 * s, head.y - 5 * s);
    ctx.lineTo(head.x + f * 1 * s, head.y - 7.4 * s);
    ctx.moveTo(head.x - f * 1.3 * s, head.y - 7 * s);
    ctx.lineTo(head.x - f * 3 * s, head.y - 8.6 * s);
    ctx.strokeStyle = ANTLER_COLOR;
    ctx.lineWidth = Math.max(1, 1.1 * s);
    ctx.stroke();
  }
  ctx.beginPath();
  blob(ctx, c.x, c.y - 11 * s, 8.5 * s, 4.2 * s);
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(0.8, 0.8 * s);
  ctx.stroke();
}

function drawFox(ctx: CanvasRenderingContext2D, g: Pt2, c: Pt2, s: number, h: FaunaHit): void {
  const f = h.flip;
  shadowOf(ctx, g, 8 * s);
  const run = Math.sin(h.phase * TAU) * 2.4;
  ctx.beginPath();
  for (const [lx, sw] of [
    [-4.6, run],
    [-3.2, -run],
    [4, -run],
    [5.4, run],
  ] as const) {
    ctx.moveTo(c.x + f * lx * s, c.y - 3.6 * s);
    ctx.lineTo(c.x + f * (lx + sw) * s, c.y);
  }
  ctx.strokeStyle = toInk(FOX_COLOR, 0.55);
  ctx.lineWidth = Math.max(1, 1.2 * s);
  ctx.stroke();
  // Schwanz: buschige Keule, Spitze in Kalk
  ctx.beginPath();
  ctx.ellipse(c.x - f * 11 * s, c.y - 5.8 * s, 6 * s, 2.5 * s, f * -0.25, 0, TAU);
  ctx.fillStyle = FOX_COLOR;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(c.x - f * 15.2 * s, c.y - 6.4 * s, 2.5 * s, 2 * s, f * -0.25, 0, TAU);
  ctx.fillStyle = FOX_TIP;
  ctx.fill();
  ctx.beginPath();
  blob(ctx, c.x, c.y - 4.8 * s, 8 * s, 3 * s);
  blob(ctx, c.x + f * 9.4 * s, c.y - 6.4 * s, 2.5 * s, 2.2 * s);
  tri(
    ctx,
    { x: c.x + f * 10.6 * s, y: c.y - 7 * s },
    { x: c.x + f * 10.6 * s, y: c.y - 5 * s },
    { x: c.x + f * 14 * s, y: c.y - 5.2 * s },
  );
  tri(
    ctx,
    { x: c.x + f * 8.4 * s, y: c.y - 8 * s },
    { x: c.x + f * 9.6 * s, y: c.y - 8 * s },
    { x: c.x + f * 8.6 * s, y: c.y - 11 * s },
  );
  ctx.fillStyle = FOX_COLOR;
  ctx.fill();
  ctx.beginPath();
  blob(ctx, c.x, c.y - 3.4 * s, 6.4 * s, 1.2 * s);
  ctx.fillStyle = FOX_BELLY;
  ctx.fill();
}

/** Quantisiert die Deckkraft in Viertelstufen, damit gleich getönte Tiere in einem Pfad liegen. */
function byAlpha(hits: readonly FaunaHit[]): Map<number, FaunaHit[]> {
  const m = new Map<number, FaunaHit[]>();
  for (const h of hits) {
    const q = Math.round(Math.min(1, Math.max(0, h.alpha)) * 4) / 4;
    if (q <= 0) continue;
    let l = m.get(q);
    if (!l) m.set(q, (l = []));
    l.push(h);
  }
  return m;
}

/** Schmetterlinge (Luft): Flügel je Farbton in einem Pfad, Körper in einem Strich. */
export function drawButterflies(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  hits: readonly FaunaHit[],
  seed: number,
): void {
  const list = hits.filter((h) => h.id === 'butterfly');
  if (list.length === 0) return;
  const tones = flowerTonesFor(seed);
  const s = cam.zoom,
    half = 0.045 * ISO_W * s;
  ctx.save();
  ctx.lineCap = 'round';
  for (let tone = 0; tone < 3; tone++) {
    const mine = list.filter((h) => h.state === tone);
    if (mine.length === 0) continue;
    ctx.beginPath();
    for (const h of mine) {
      const g = at(cam, h.x, h.y, h.z);
      const w = half * (0.3 + 0.7 * h.phase);
      blob(ctx, g.x - w * 0.62, g.y - half * 0.25, w * 0.62, half * 0.62);
      blob(ctx, g.x + w * 0.62, g.y - half * 0.25, w * 0.62, half * 0.62);
      blob(ctx, g.x - w * 0.4, g.y + half * 0.3, w * 0.4, half * 0.4);
      blob(ctx, g.x + w * 0.4, g.y + half * 0.3, w * 0.4, half * 0.4);
    }
    ctx.fillStyle = toLight(tones[tone]!, 0.08);
    ctx.fill();
  }
  ctx.beginPath();
  for (const h of list) {
    const g = at(cam, h.x, h.y, h.z);
    ctx.moveTo(g.x, g.y - half * 0.6);
    ctx.lineTo(g.x, g.y + half * 0.6);
  }
  ctx.strokeStyle = toInk(tones[0]!, 0.7);
  ctx.lineWidth = Math.max(1, 0.9 * s);
  ctx.stroke();
  ctx.restore();
}

/** Waldvögel (Luft): wie ein Vogelschwarm, kleiner; je Deckkraftstufe ein Pfad mit einem Strich. */
export function drawForestBirds(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  hits: readonly FaunaHit[],
): void {
  const list = hits.filter((h) => h.id === 'forestBird');
  if (list.length === 0) return;
  const s = cam.zoom,
    span = 0.085 * ISO_H * s;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = BIRD_COLOR;
  ctx.lineWidth = Math.max(1, 1.2 * s);
  for (const [q, group] of byAlpha(list)) {
    ctx.globalAlpha = q;
    ctx.beginPath();
    for (const h of group) {
      const g = at(cam, h.x, h.y, h.z);
      const lift = h.phase * 0.4 * span;
      ctx.moveTo(g.x - span, g.y - lift);
      ctx.lineTo(g.x, g.y + 0.12 * span);
      ctx.lineTo(g.x + span, g.y - lift);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Luft nach den Objekten: Schmetterlinge und Waldvögel. */
export function drawFaunaAir(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  hits: readonly FaunaHit[],
  seed: number,
): void {
  drawButterflies(ctx, cam, hits, seed);
  drawForestBirds(ctx, cam, hits);
}

/**
 * Glühwürmchen: Kern und weicher Hof als Kreise (kein Verlauf), je Pulsstufe ein Pfad. Läuft im einen additiven
 * Durchgang des Renderers (`lighter` setzt der Aufrufer).
 */
export function drawFireflies(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  hits: readonly FaunaHit[],
): void {
  const list = hits.filter((h) => h.id === 'firefly');
  if (list.length === 0) return;
  const s = cam.zoom;
  ctx.save();
  for (const [q, group] of byAlpha(list)) {
    ctx.beginPath();
    for (const h of group) {
      const g = at(cam, h.x, h.y, h.z);
      blob(ctx, g.x, g.y, (2.4 + 1.8 * h.alpha) * s, (2.4 + 1.8 * h.alpha) * s);
    }
    ctx.fillStyle = rgbaOfCss(FIREFLY_COLOR, 0.12 + 0.1 * q);
    ctx.fill();
    ctx.beginPath();
    for (const h of group) {
      const g = at(cam, h.x, h.y, h.z);
      blob(ctx, g.x, g.y, 1.1 * s, 1.1 * s);
    }
    ctx.fillStyle = rgbaOfCss(FIREFLY_COLOR, 0.45 + 0.5 * q);
    ctx.fill();
  }
  ctx.restore();
}
