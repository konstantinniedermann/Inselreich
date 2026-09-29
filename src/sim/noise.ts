export function hash2(seed: number, x: number, y: number): number {
  let h = (seed ^ Math.imul(x, 374761393) ^ Math.imul(y, 668265263)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
const smooth = (t: number) => t * t * (3 - 2 * t);
export function valueNoise(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x),
    y0 = Math.floor(y);
  const tx = smooth(x - x0),
    ty = smooth(y - y0);
  const a = hash2(seed, x0, y0),
    b = hash2(seed, x0 + 1, y0);
  const c = hash2(seed, x0, y0 + 1),
    d = hash2(seed, x0 + 1, y0 + 1);
  return (a + (b - a) * tx) * (1 - ty) + (c + (d - c) * tx) * ty;
}
