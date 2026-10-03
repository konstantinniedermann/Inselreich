import type { Building, BuildingDef } from '../sim/types';
import type { Camera } from './camera';
import { spriteBounds } from './iso';
import { SPRITE_CACHE_MAX_BYTES, SPRITE_MAX_BYTES } from './limits';
import { drawMaterial } from './material';
import { bodyFaces, drawBody, type BodyEnv } from './sprites';

// spriteCache.ts — Sprite-Cache der Gebäudekörper (H-R6). Liest die Welt nur, schreibt nie.
//
// Schlüsselaudit (`SILHOUETTES`/`FALLBACKS` in sprites.ts, `bodyHeight` in iso.ts): Die Silhouette liest
//   - `def` (w, h, id, category)                    → Schlüssel: def.id
//   - `b.house.tier` (Wohnhaus-Stufe, Höhe/Dach)    → Schlüssel: Stufe (für Nicht-Häuser 0)
//   - `b.x`, `b.y` nur als Ursprung der Projektion  → reine Verschiebung, nicht im Schlüssel
//   - `env` (Wasserseiten des Kontors)              → Schlüssel: 4 Bits
//   - Zoom und DPR (Kameraabbildung, Pixelraster)   → Schlüssel
//   - Variante (H-R7, `variantOf(seed, x, y)`)      → Schlüssel; Töne und Zubehör, nie der Umriss
// Nicht gelesen: `b.id`, `progress`, `state`, `connected`, `outageUntil`, `timeMs`, Zufall oder Positions-Hash
// (Rauch, Flagge, Wege laufen ausserhalb in `drawAir`/`drawRoads`). Würde eine Silhouette künftig eine davon
// lesen, muss sie hier in den Schlüssel oder aus dem Cache (`UNCACHED`).

/** Typen, deren Körper von nicht schlüsselbaren Eingaben abhängen; sie gehen den alten Weg. Heute leer. */
const UNCACHED: ReadonlySet<string> = new Set<string>();

/** Rand der Fläche in Weltpixeln um `spriteBounds` (Strichbreite, Überstände von Dächern und Zubehör). */
const MARGIN = 8;

/** Minimale Fläche (HTMLCanvasElement oder OffscreenCanvas); im Test ein Fake. */
export interface SpriteSurface {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasRenderingContext2D | null;
}
export type SurfaceFactory = () => SpriteSurface;

export interface SpriteCacheStats {
  hits: number;
  misses: number;
  /** Aufrufe, die den alten Weg gingen (kalter Frame nach Zoom-/DPR-Wechsel, zu gross, ohne Fabrik). */
  bypassed: number;
  entries: number;
  bytes: number;
}

export interface SpriteCacheOptions {
  /** `null` = Cache aus (Node ohne DOM). */
  factory?: SurfaceFactory | null;
  maxBytes?: number;
  maxSpriteBytes?: number;
  /** Materialschicht (Fugen, Stroh, Risse, H-R7) beim Füllen; im Renderer an, in Tests der Fläche aus. */
  material?: boolean;
}

export function spriteKey(
  def: BuildingDef,
  b: Building,
  env: BodyEnv | undefined,
  zoom: number,
  dpr: number,
  variant: number,
): string {
  const tier = def.id === 'house' ? (b.house?.tier ?? 1) : 0;
  const e = env
    ? (env.waterLeft ? 1 : 0) |
      (env.waterRight ? 2 : 0) |
      (env.waterU0 ? 4 : 0) |
      (env.waterV0 ? 8 : 0)
    : 0;
  return `${def.id}|${tier}|${e}|${variant}|${Math.round(zoom * 1000)}|${Math.round(dpr * 1000)}`;
}

interface Entry {
  surface: SpriteSurface;
  bytes: number;
  /** Fläche in CSS-Pixeln und Ursprung relativ zum Körper-Bildursprung (`spriteBounds` − Rand), Weltpixel. */
  w: number;
  h: number;
  ox: number;
  oy: number;
}

const defaultFactory = (): SurfaceFactory | null =>
  typeof document === 'undefined'
    ? null
    : () => document.createElement('canvas') as unknown as SpriteSurface;

export function createSpriteCache(opts: SpriteCacheOptions = {}) {
  const factory = opts.factory === undefined ? defaultFactory() : opts.factory;
  const maxBytes = opts.maxBytes ?? SPRITE_CACHE_MAX_BYTES;
  const maxSprite = opts.maxSpriteBytes ?? SPRITE_MAX_BYTES;
  const material = opts.material ?? false;
  const map = new Map<string, Entry>(); // Einfügereihenfolge = LRU (ältester zuerst)
  let bytes = 0;
  let zoom = NaN,
    dpr = NaN,
    warm = false;
  const st = { hits: 0, misses: 0, bypassed: 0 };

  /** Gibt die Fläche frei: Breite/Höhe 0 lässt Safari den Speicher sofort zurückgeben. */
  function release(e: Entry): void {
    e.surface.width = 0;
    e.surface.height = 0;
  }
  function evict(room: number): void {
    for (const [k, e] of map) {
      if (bytes + room <= maxBytes) break;
      map.delete(k);
      release(e);
      bytes -= e.bytes;
    }
  }

  return {
    margin: MARGIN,
    /**
     * Vor den Körpern eines Frames. Ändert sich Zoom oder DPR, wird der Bestand verworfen und der Frame geht
     * ungecacht (kalt): beim Zoom-Wischen ändert sich der Zoom jeden Frame, ein Raster je Zwischenwert wäre
     * teurer als direktes Zeichnen. Erst ein Frame mit gleichem Zoom/DPR wie der vorige füllt den Cache.
     */
    beginFrame(z: number, d: number): void {
      if (z !== zoom || d !== dpr) {
        this.clear();
        bytes = 0;
        zoom = z;
        dpr = d;
        warm = false;
      } else warm = true;
    },
    /**
     * Stempelt den Körper; `false` = nicht gezeichnet, der Aufrufer nimmt `drawBody`.
     * Subpixel: Der Stempel sitzt auf dem Gerätepixel, der dem ungecachten Ursprung am nächsten liegt
     * (Versatz ≤ 0,5 Gerätepixel, kein Weichzeichnen durch Zwischenpixel); bei ganzzahligem Ursprung
     * (Kamera auf Gerätepixeln) ist er null. Der Rasterphase-Unterschied der Kanten bleibt unter einem Pixel.
     */
    draw(
      ctx: CanvasRenderingContext2D,
      cam: Camera,
      def: BuildingDef,
      b: Building,
      env?: BodyEnv,
      variant = 0,
    ): boolean {
      if (!factory || !warm || UNCACHED.has(def.id) || cam.zoom !== zoom) {
        st.bypassed++;
        return false;
      }
      const key = spriteKey(def, b, env, zoom, dpr, variant);
      const bounds = spriteBounds(def, b);
      const ox = bounds.x - MARGIN,
        oy = bounds.y - MARGIN;
      let e = map.get(key);
      if (e) {
        map.delete(key);
        map.set(key, e);
        st.hits++;
      } else {
        const pw = Math.ceil((bounds.w + 2 * MARGIN) * zoom * dpr),
          ph = Math.ceil((bounds.h + 2 * MARGIN) * zoom * dpr);
        const size = pw * ph * 4;
        if (size > maxSprite || size > maxBytes) {
          st.bypassed++;
          return false;
        }
        const surface = factory();
        surface.width = pw;
        surface.height = ph;
        const sctx = surface.getContext('2d');
        if (!sctx) {
          st.bypassed++;
          return false;
        }
        sctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        // Gleiche Befehle wie ungecacht; nur die Kamera ist um den Ursprung der Fläche verschoben.
        drawBody(sctx, { x: ox, y: oy, zoom }, def, b, 0, env, variant);
        if (material) {
          const sc = { x: ox, y: oy, zoom };
          drawMaterial(sctx, bodyFaces(def, b, variant, sc), def, b, variant, zoom);
        }
        evict(size);
        e = { surface, bytes: size, w: pw / dpr, h: ph / dpr, ox, oy };
        map.set(key, e);
        bytes += size;
        st.misses++;
      }
      const dx = Math.round((ox - cam.x) * zoom * dpr) / dpr,
        dy = Math.round((oy - cam.y) * zoom * dpr) / dpr;
      ctx.drawImage(e.surface as unknown as CanvasImageSource, dx, dy, e.w, e.h);
      return true;
    },
    stats(): SpriteCacheStats {
      return { ...st, entries: map.size, bytes };
    },
    clear(): void {
      for (const e of map.values()) release(e);
      map.clear();
      bytes = 0;
    },
  };
}

export type SpriteCache = ReturnType<typeof createSpriteCache>;

/** Gemeinsamer Cache des Renderers; ohne DOM (Node) bleibt er aus. */
export const spriteCache: SpriteCache = createSpriteCache({ material: true });

/** Körper über den Cache, sonst wie bisher `drawBody`. */
export function drawBodyCached(
  ctx: CanvasRenderingContext2D,
  cam: Camera,
  def: BuildingDef,
  b: Building,
  timeMs: number,
  env?: BodyEnv,
  variant = 0,
): void {
  if (!spriteCache.draw(ctx, cam, def, b, env, variant))
    drawBody(ctx, cam, def, b, timeMs, env, variant);
}
