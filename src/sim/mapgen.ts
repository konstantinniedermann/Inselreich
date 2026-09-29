import { valueNoise } from './noise';
import type { Terrain } from './types';

export const MAP_W = 64;
export const MAP_H = 64;

const MAX_ATTEMPTS = 50;

// Bewusst lokal (statt aus world.ts): world.ts importiert mapgen.ts, ein Import zurück wäre ein Zyklus.
const isLandTerrain = (t: Terrain | undefined): boolean =>
  t === 'sand' || t === 'grass' || t === 'forest';

export function generateTerrain(seed: number, w: number, h: number): Terrain[] {
  const out: Terrain[] = new Array<Terrain>(w * h);
  const cx = (w - 1) / 2;
  const cy = (h - 1) / 2;
  const R = Math.min(w, h) / 2;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const e =
        0.6 * valueNoise(seed, x / 14, y / 14) +
        0.3 * valueNoise(seed + 1, x / 6, y / 6) +
        0.1 * valueNoise(seed + 2, x / 3, y / 3);
      const d = Math.hypot(x - cx, y - cy) / R; // 0 Mitte … ~1.4 Ecke
      const height = e * (1.15 - d * d); // Inselmaske
      const isBorder = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      let t: Terrain;
      if (isBorder || height < 0.3) t = 'water';
      else if (height < 0.36) t = 'sand';
      else if (height > 0.64) t = 'mountain';
      else if (valueNoise(seed + 3, x / 5, y / 5) > 0.62) t = 'forest';
      else t = 'grass';
      out[y * w + x] = t;
    }
  }
  return out;
}

export function findKontorSite(
  terrain: Terrain[],
  w: number,
  h: number,
): { x: number; y: number } | null {
  const at = (x: number, y: number): Terrain | undefined =>
    x < 0 || y < 0 || x >= w || y >= h ? undefined : terrain[y * w + x];
  const cx = (w - 2) / 2;
  const cy = (h - 2) / 2;
  let best: { x: number; y: number } | null = null;
  let bestDist = Infinity;
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      let allLand = true;
      for (let dy = 0; dy < 2 && allLand; dy++)
        for (let dx = 0; dx < 2; dx++)
          if (!isLandTerrain(at(x + dx, y + dy))) {
            allLand = false;
            break;
          }
      if (!allLand) continue;
      const rim: (Terrain | undefined)[] = [
        at(x, y - 1),
        at(x + 1, y - 1),
        at(x, y + 2),
        at(x + 1, y + 2),
        at(x - 1, y),
        at(x - 1, y + 1),
        at(x + 2, y),
        at(x + 2, y + 1),
      ];
      if (!rim.includes('water')) continue;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < bestDist) {
        bestDist = dist;
        best = { x, y };
      }
    }
  }
  return best;
}

export function generateMap(seed: number): {
  terrain: Terrain[];
  kontor: { x: number; y: number };
  seedUsed: number;
} {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const seedUsed = seed + i;
    const terrain = generateTerrain(seedUsed, MAP_W, MAP_H);
    let land = 0;
    let forest = 0;
    let mountain = 0;
    for (const t of terrain) {
      if (isLandTerrain(t)) land++;
      if (t === 'forest') forest++;
      else if (t === 'mountain') mountain++;
    }
    if (land < 800 || forest < 40 || mountain < 10) continue;
    const kontor = findKontorSite(terrain, MAP_W, MAP_H);
    if (kontor) return { terrain, kontor, seedUsed };
  }
  throw new Error(`generateMap: no valid map after ${MAX_ATTEMPTS} attempts from seed ${seed}`);
}
