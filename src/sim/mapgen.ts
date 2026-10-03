import { valueNoise } from './noise';
import { MIN_MOUNTAIN_PATCH } from './defs/map';
import type { Terrain } from './types';

export const MAP_W = 64;
export const MAP_H = 64;

const MAX_ATTEMPTS = 50;

// Hier definiert (nicht in world.ts): world.ts importiert mapgen.ts, ein Import zurück wäre ein Zyklus.
export const isLand = (t: Terrain | undefined): boolean =>
  t === 'sand' || t === 'grass' || t === 'forest';

export function components(
  terrain: Terrain[],
  w: number,
  h: number,
  pred: (t: Terrain) => boolean,
): { id: Int32Array; sizes: number[] } {
  const id = new Int32Array(w * h).fill(-2); // -2 = noch nicht besucht
  const sizes: number[] = [];
  for (let start = 0; start < w * h; start++) {
    if (!pred(terrain[start]!)) {
      id[start] = -1;
      continue;
    }
    if (id[start] !== -2) continue;
    const comp = sizes.length;
    let size = 0;
    const stack = [start];
    id[start] = comp;
    while (stack.length > 0) {
      const i = stack.pop()!;
      size++;
      const x = i % w;
      const y = (i - x) / w;
      const next = [
        x > 0 ? i - 1 : -1,
        x < w - 1 ? i + 1 : -1,
        y > 0 ? i - w : -1,
        y < h - 1 ? i + w : -1,
      ];
      for (const j of next) {
        if (j < 0 || id[j] !== -2) continue;
        if (pred(terrain[j]!)) {
          id[j] = comp;
          stack.push(j);
        } else id[j] = -1;
      }
    }
    sizes.push(size);
  }
  return { id, sizes };
}

// Meer = Wasser, das 4-zusammenhängend mit dem Kartenrand verbunden ist.
export function seaMask(terrain: Terrain[], w: number, h: number): boolean[] {
  const { id } = components(terrain, w, h, (t) => t === 'water');
  const seaIds = new Set<number>();
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++)
      if (x === 0 || y === 0 || x === w - 1 || y === h - 1) {
        const c = id[y * w + x]!;
        if (c >= 0) seaIds.add(c);
      }
  return Array.from(id, (c) => c >= 0 && seaIds.has(c));
}

function removeSmallMountains(terrain: Terrain[], w: number, h: number): void {
  const { id, sizes } = components(terrain, w, h, (t) => t === 'mountain');
  for (let i = 0; i < terrain.length; i++) {
    const c = id[i]!;
    if (c >= 0 && sizes[c]! < MIN_MOUNTAIN_PATCH) terrain[i] = 'grass';
  }
}

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
  removeSmallMountains(out, w, h);
  return out;
}

export function findKontorSite(
  terrain: Terrain[],
  w: number,
  h: number,
): { x: number; y: number } | null {
  const at = (x: number, y: number): Terrain | undefined =>
    x < 0 || y < 0 || x >= w || y >= h ? undefined : terrain[y * w + x];
  const sea = seaMask(terrain, w, h);
  const isSea = (x: number, y: number): boolean =>
    x >= 0 && y >= 0 && x < w && y < h && sea[y * w + x] === true;
  const cx = (w - 2) / 2;
  const cy = (h - 2) / 2;
  let best: { x: number; y: number } | null = null;
  let bestDist = Infinity;
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      let allLand = true;
      for (let dy = 0; dy < 2 && allLand; dy++)
        for (let dx = 0; dx < 2; dx++)
          if (!isLand(at(x + dx, y + dy))) {
            allLand = false;
            break;
          }
      if (!allLand) continue;
      const touchesSea =
        isSea(x, y - 1) ||
        isSea(x + 1, y - 1) ||
        isSea(x, y + 2) ||
        isSea(x + 1, y + 2) ||
        isSea(x - 1, y) ||
        isSea(x - 1, y + 1) ||
        isSea(x + 2, y) ||
        isSea(x + 2, y + 1);
      if (!touchesSea) continue;
      const dist = Math.hypot(x - cx, y - cy);
      if (dist < bestDist) {
        bestDist = dist;
        best = { x, y };
      }
    }
  }
  return best;
}

// Steinbruch-Platz: Landkachel, 4-angrenzend an Gebirge.
function hasQuarrySite(terrain: Terrain[], w: number, h: number): boolean {
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!isLand(terrain[y * w + x])) continue;
      if (
        (x > 0 && terrain[y * w + x - 1] === 'mountain') ||
        (x < w - 1 && terrain[y * w + x + 1] === 'mountain') ||
        (y > 0 && terrain[(y - 1) * w + x] === 'mountain') ||
        (y < h - 1 && terrain[(y + 1) * w + x] === 'mountain')
      )
        return true;
    }
  return false;
}

export function meetsPostconditions(terrain: Terrain[], w: number, h: number): boolean {
  let land = 0;
  let forest = 0;
  for (const t of terrain) {
    if (isLand(t)) land++;
    if (t === 'forest') forest++;
  }
  if (land < 800 || forest < 40) return false;
  if (
    !components(terrain, w, h, (t) => t === 'mountain').sizes.some((n) => n >= MIN_MOUNTAIN_PATCH)
  )
    return false;
  if (!hasQuarrySite(terrain, w, h)) return false;
  return findKontorSite(terrain, w, h) !== null;
}

export function generateMap(seed: number): {
  terrain: Terrain[];
  kontor: { x: number; y: number };
  seedUsed: number;
} {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const seedUsed = seed + i;
    const terrain = generateTerrain(seedUsed, MAP_W, MAP_H);
    if (!meetsPostconditions(terrain, MAP_W, MAP_H)) continue;
    const kontor = findKontorSite(terrain, MAP_W, MAP_H);
    if (kontor) return { terrain, kontor, seedUsed };
  }
  throw new Error(`generateMap: no valid map after ${MAX_ATTEMPTS} attempts from seed ${seed}`);
}
