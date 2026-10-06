import { hash2, valueNoise } from '../sim/noise';
import { home } from '../sim/world';
import type { World } from '../sim/types';
import { seaContext, seaPlan, type SeaArea } from './decor';
import { PALETTE, mixHex, rgbOfCss } from './palette';

// seaFields.ts — Wasserfelder im Bodenbild (ART-STIL-02 L5 T3): Sandbank D11, Riff E2, Tang E6. Reine Funktionen ohne
// Canvas: aus den `SeaArea`s von `seaPlan` entsteht ein weiches Gewichtsraster (je Art), und `tintWater` mischt es in die
// Wasserfarbe eines Pixels. Statisch und je Welt einmal gebaut; `terrain.ts` ruft `tintWater` im Wasserzweig von
// `paintPixels` und beim Neumalen des Fernwassers (Viertel-Kopie) auf, so liegen die Felder auch in der Fernansicht.
// Salz 569 (Korallenflecken, Tangflecken über verschiedene `hash2`-Argumente).

/** Gewichtsraster je Art mit `SEA_RES` Stützstellen je Kachel; `mask` je Kachel: 1, wenn dort oder daneben ein Gewicht liegt. */
export interface SeaTint {
  seed: number;
  w: number;
  h: number;
  sand: Float32Array;
  reef: Float32Array;
  kelp: Float32Array;
  mask: Uint8Array;
}
export const SEA_RES = 4;
/** Radius des weichen Flecks je Flächenkachel (Kacheln); der Rand fällt über `smoothstep` ab. */
export const SEA_BLOB = 1.05;

const rgb = (css: string): readonly number[] => rgbOfCss(css);
/** Töne (Mischungen aus `palette.ts`). Sandbank: aufgehelltes Flachwasser, nie trockener Sand. */
export const SEA_TONES = {
  sandbank: mixHex(mixHex(PALETTE.waterShallow, PALETTE.sandWet, 0.3), PALETTE.rock, 0.4),
  reef: mixHex(mixHex(PALETTE.waterShallow, PALETTE.foam, 0.22), PALETTE.rock, 0.4),
  coral: mixHex(PALETTE.waterShallow, PALETTE.rockDark, 0.38),
  kelp: mixHex(mixHex(PALETTE.crown, PALETTE.earthEdge, 0.5), PALETTE.waterMid, 0.35),
} as const;
const T = {
  sandbank: rgb(SEA_TONES.sandbank),
  reef: rgb(SEA_TONES.reef),
  coral: rgb(SEA_TONES.coral),
  kelp: rgb(SEA_TONES.kelp),
};
/** Deckkraft im Kern der Fläche. */
export const SEA_ALPHA = { sandbank: 0.78, reef: 0.8, coral: 0.55, kelp: 0.5 } as const;

const smooth01 = (t: number): number => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

function splat(f: Float32Array, w: number, h: number, areas: readonly SeaArea[]): void {
  const sw = w * SEA_RES + 1;
  for (const a of areas)
    for (const t of a.tiles) {
      const cx = t.x + 0.5,
        cy = t.y + 0.5;
      const i0 = Math.max(0, Math.floor((cx - SEA_BLOB) * SEA_RES)),
        i1 = Math.min(w * SEA_RES, Math.ceil((cx + SEA_BLOB) * SEA_RES)),
        j0 = Math.max(0, Math.floor((cy - SEA_BLOB) * SEA_RES)),
        j1 = Math.min(h * SEA_RES, Math.ceil((cy + SEA_BLOB) * SEA_RES));
      for (let j = j0; j <= j1; j++)
        for (let i = i0; i <= i1; i++) {
          const d = Math.hypot(i / SEA_RES - cx, j / SEA_RES - cy);
          const v = smooth01(1 - d / SEA_BLOB);
          if (v > f[j * sw + i]!) f[j * sw + i] = v;
        }
    }
}

/** Gewichtsraster aus Flächen; `seed` für die Flecken. Leer (alle Gewichte 0) ohne Flächen. */
export function buildSeaTint(
  seed: number,
  w: number,
  h: number,
  areas: { sandbanks: readonly SeaArea[]; reefs: readonly SeaArea[]; kelp: readonly SeaArea[] },
): SeaTint {
  const n = (w * SEA_RES + 1) * (h * SEA_RES + 1);
  const t: SeaTint = {
    seed,
    w,
    h,
    sand: new Float32Array(n),
    reef: new Float32Array(n),
    kelp: new Float32Array(n),
    mask: new Uint8Array(w * h),
  };
  splat(t.sand, w, h, areas.sandbanks);
  splat(t.reef, w, h, areas.reefs);
  splat(t.kelp, w, h, areas.kelp);
  for (const list of [areas.sandbanks, areas.reefs, areas.kelp])
    for (const a of list)
      for (const q of a.tiles)
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const x = q.x + dx,
              y = q.y + dy;
            if (x >= 0 && y >= 0 && x < w && y < h) t.mask[y * w + x] = 1;
          }
  return t;
}

const cache = new WeakMap<World, { sig: string; tint: SeaTint | null }>();
/** Wasserfelder der Heimat (statisch, je Welt gehalten); `null` für Fremdinseln und ohne Flächen. */
export function seaTintFor(world: World): SeaTint | null {
  const isl = home(world);
  if (isl.kind !== 'home') return null;
  const ctx = seaContext(world);
  const sig = JSON.stringify(ctx.kontors);
  const c = cache.get(world);
  if (c && c.sig === sig) return c.tint;
  const plan = seaPlan(world.seed, isl, ctx);
  const any = plan.sandbanks.length + plan.reefs.length + plan.kelp.length > 0;
  const tint = any ? buildSeaTint(world.seed, isl.width, isl.height, plan) : null;
  cache.set(world, { sig, tint });
  return tint;
}

function bil(f: Float32Array, sw: number, fx: number, fy: number): number {
  const gx = fx * SEA_RES,
    gy = fy * SEA_RES;
  const i = Math.floor(gx),
    j = Math.floor(gy);
  const tx = gx - i,
    ty = gy - j;
  const a = j * sw + i;
  return (
    f[a]! * (1 - tx) * (1 - ty) +
    f[a + 1]! * tx * (1 - ty) +
    f[a + sw]! * (1 - tx) * ty +
    f[a + sw + 1]! * tx * ty
  );
}

/**
 * Mischt die Wasserfelder am Punkt (`fx`, `fy` in Kacheln) in die Wasserfarbe `o` (RGB, wird verändert). Sandbank: heller,
 * weicher Rand; Riff: heller Türkiston mit dunkleren Korallenflecken; Tang: olivbraune Flecken mit geringer Deckkraft.
 */
export function tintWater(t: SeaTint, fx: number, fy: number, o: number[]): void {
  const tx = Math.floor(fx),
    ty = Math.floor(fy);
  if (tx < 0 || ty < 0 || tx >= t.w || ty >= t.h || !t.mask[ty * t.w + tx]) return;
  const sw = t.w * SEA_RES + 1;
  const s = bil(t.sand, sw, fx, fy);
  if (s > 0) mixInto(o, T.sandbank, s * SEA_ALPHA.sandbank);
  const r = bil(t.reef, sw, fx, fy);
  if (r > 0) {
    mixInto(o, T.reef, r * SEA_ALPHA.reef);
    // unregelmässige dunklere Korallenflecken (Rauschen, Salz 569)
    const nz =
      valueNoise(t.seed + 569, fx * 3.3, fy * 3.3) +
      0.35 * (hash2(t.seed + 569, Math.floor(fx * 9), Math.floor(fy * 9)) - 0.5);
    if (nz > 0.55) mixInto(o, T.coral, r * SEA_ALPHA.coral * Math.min(1, (nz - 0.55) * 5));
  }
  const k = bil(t.kelp, sw, fx, fy);
  if (k > 0) {
    const nz = valueNoise(t.seed + 569, fx * 2.1 + 40, fy * 2.1 + 40);
    mixInto(o, T.kelp, k * SEA_ALPHA.kelp * (0.5 + nz));
  }
}
function mixInto(o: number[], c: readonly number[], a: number): void {
  const k = Math.min(1, a);
  o[0] = o[0]! + (c[0]! - o[0]!) * k;
  o[1] = o[1]! + (c[1]! - o[1]!) * k;
  o[2] = o[2]! + (c[2]! - o[2]!) * k;
}
