import { fieldWorld } from '../../src/render/terrainField';
import { describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import { TEX, TREE_VARIANTS } from '../../src/render/iso';
import { LIGHT, TONE_EDGE_PX } from '../../src/render/light';
import { PALETTE, rgbOf } from '../../src/render/palette';
import { crownsFor } from '../../src/render/trees';
import { LAND } from '../../src/render/terrainField';
import {
  GROUND_FLAT,
  buildGrid,
  groundHeight,
  groundToneAt,
  landShares,
  meadowTint,
  paintPixels,
  type TerrainGrid,
} from '../../src/render/terrain';

// H-R11 — Bodenrelief Wiese und Wald in gestuften Tonflächen (Stilrahmen S2, S3, S5, S6, D8, D9).

const NODES = TEX / 4; // Knoten je Kachel (RASTER = 4)
const hslS = (r: number, g: number, b: number): number => {
  const R = r / 255,
    G = g / 255,
    B = b / 255;
  const mx = Math.max(R, G, B),
    mn = Math.min(R, G, B),
    l = (mx + mn) / 2;
  return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
};
const luma = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;
const worlds = [1, 7].map((seed) => {
  const world = createWorld(seed, { unlockAll: true });
  return { seed, world, grid: buildGrid(fieldWorld(world)) };
});
const terr = (w: { width: number; tiles: { terrain: string }[] }, x: number, y: number): string =>
  w.tiles[y * w.width + x]?.terrain ?? 'water';
const stepAt = (g: TerrainGrid, i: number, j: number): number =>
  Math.floor(g.tone[j * g.nx + i]! + 0.5);

describe('H-R11 Hanggrenze (S6)', () => {
  it('H-R11 S6 auf bebaubaren Kacheln ändert sich die Tonstufe innerhalb einer Kachel um höchstens 1 (Seeds 1, 7)', () => {
    let tiles = 0;
    for (const { world, grid } of worlds)
      for (let y = 0; y < home(world).height; y++)
        for (let x = 0; x < home(world).width; x++) {
          const t = terr(fieldWorld(world), x, y);
          if (t !== 'grass' && t !== 'forest' && t !== 'sand') continue;
          let lo = 99,
            hi = -99;
          for (let j = 0; j <= NODES; j++)
            for (let i = 0; i <= NODES; i++) {
              const s = stepAt(grid, x * NODES + i, y * NODES + j);
              lo = Math.min(lo, s);
              hi = Math.max(hi, s);
            }
          tiles++;
          expect(hi - lo, `Kachel ${x},${y} ${t}`).toBeLessThanOrEqual(1);
          if (t !== 'sand') continue;
          // H-R12b K6: auch der Dünenton auf Sand bleibt innerhalb einer Kachel bei höchstens 1 Stufe
          let dlo = 99,
            dhi = -99;
          for (let j = 0; j <= NODES; j++)
            for (let i = 0; i <= NODES; i++) {
              const s = Math.floor(grid.dune[(y * NODES + j) * grid.nx + x * NODES + i]! + 0.5);
              dlo = Math.min(dlo, s);
              dhi = Math.max(dhi, s);
            }
          expect(dhi - dlo, `Kachel ${x},${y} Düne`).toBeLessThanOrEqual(1);
        }
    expect(tiles).toBeGreaterThan(1500);
  });

  it('H-R11 Tonwert liegt in 0…4 und groundToneAt stimmt an Knoten mit dem Raster überein', () => {
    const { world, grid } = worlds[0]!;
    for (const [x, y] of [
      [12, 27],
      [20, 30],
      [8, 25],
    ] as const)
      if (terr(fieldWorld(world), x, y) === 'grass') {
        const i = x * NODES + 3,
          j = y * NODES + 5;
        expect(grid.tone[j * grid.nx + i]).toBeCloseTo(
          groundToneAt(world.seed, i / NODES, j / NODES),
          4,
        );
      }
    for (const v of grid.tone) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(4);
    }
  }, 30_000); // H-T5: CI bis 4,4 s (Default 5 s); lokal CI=true ≈ 1,5 s, Timeout > 3 ×, Reserve für den Runner
});

describe('H-R11 Wiese in Tonstufen (S2, S6)', () => {
  it('H-R11 S6 jeder Hügel zeigt bei Zoom 1 mindestens 2 Tonstufen: ≥ 90 % der 4 × 4-Wiesenfenster, ≥ 25 % mit Licht- und Schattenstufe', () => {
    for (const { world, grid } of worlds) {
      let wins = 0,
        ok = 0,
        both = 0;
      const used = new Set<number>();
      for (let y0 = 0; y0 + 4 <= home(world).height; y0 += 2)
        for (let x0 = 0; x0 + 4 <= home(world).width; x0 += 2) {
          let pure = true;
          for (let y = y0; y < y0 + 4 && pure; y++)
            for (let x = x0; x < x0 + 4; x++)
              if (terr(fieldWorld(world), x, y) !== 'grass') pure = false;
          if (!pure) continue;
          const seen = new Set<number>();
          for (let j = y0 * NODES; j <= (y0 + 4) * NODES; j++)
            for (let i = x0 * NODES; i <= (x0 + 4) * NODES; i++) {
              const s = stepAt(grid, i, j);
              seen.add(s);
              used.add(s);
            }
          wins++;
          if (seen.size >= 2) ok++;
          if (seen.has(1) && seen.has(3)) both++;
        }
      expect(wins, `Seed ${world.seed}`).toBeGreaterThan(8);
      expect(ok / wins, `Seed ${world.seed}`).toBeGreaterThanOrEqual(0.9);
      expect(both / wins, `Seed ${world.seed}`).toBeGreaterThanOrEqual(0.25);
      expect(used.size, `Seed ${world.seed} genutzte Stufen`).toBeGreaterThanOrEqual(3);
    }
  });

  it('H-R11 S2 gestufte Kanten: Übergänge zwischen Tonflächen höchstens 2 px breit, mehrere Plateaus', () => {
    // Gleichmässige Wiese (alle Farbfelder konstant), Tonwert als Rampe: nur die Stufung färbt.
    const { world } = worlds[0]!;
    const grid = buildGrid(fieldWorld(world));
    grid.grass.fill(0.5);
    grid.patch.fill(0);
    grid.warm.fill(0);
    grid.mottle.fill(0);
    grid.veil.fill(0);
    grid.shade.fill(0);
    // Block aus 5 × 3 Wiesenkacheln suchen
    let bx = -1,
      by = -1;
    for (let y = 2; y < home(world).height - 6 && bx < 0; y++)
      for (let x = 2; x < home(world).width - 8 && bx < 0; x++) {
        let ok = true;
        for (let yy = y - 1; yy < y + 4 && ok; yy++)
          for (let xx = x - 1; xx < x + 6; xx++)
            if (terr(fieldWorld(world), xx, yy) !== 'grass') ok = false;
        if (ok) [bx, by] = [x, y];
      }
    expect(bx).toBeGreaterThanOrEqual(0);
    for (let j = 0; j < grid.ny; j++)
      for (let i = 0; i < grid.nx; i++) grid.tone[j * grid.nx + i] = 0.6 + 0.07 * (i - bx * NODES);
    const w = 5 * TEX,
      h = 24;
    const px = paintPixels(grid, 1, bx * TEX, by * TEX + 2 * TEX, w, h);
    // Referenzhelligkeiten der Plateaus (Stufe 1, 2, 3, Korn gemittelt) und Spaltenmittel über h Zeilen (Korn fällt heraus)
    const refOf = (t: number): number => {
      const g2 = { ...grid, tone: grid.tone.map(() => t) as Float32Array };
      const q = paintPixels(g2, 1, bx * TEX, by * TEX + 2 * TEX, w, h);
      let sum = 0;
      for (let i = 0; i < w * h; i++) sum += luma(q[i * 4]!, q[i * 4 + 1]!, q[i * 4 + 2]!);
      return sum / (w * h);
    };
    const refs = [1, 2, 3].map(refOf);
    const gap = Math.min(refs[1]! - refs[0]!, refs[2]! - refs[1]!);
    expect(gap).toBeGreaterThan(0);
    let run = 0,
      maxRun = 0;
    const seen = new Set<number>();
    for (let x = 0; x < w; x++) {
      let m = 0;
      for (let y = 0; y < h; y++)
        m += luma(px[(y * w + x) * 4]!, px[(y * w + x) * 4 + 1]!, px[(y * w + x) * 4 + 2]!);
      m /= h;
      const near = refs.reduce((b, r, k) => (Math.abs(m - r) < Math.abs(m - refs[b]!) ? k : b), 0);
      if (Math.abs(m - refs[near]!) > 0.3 * gap) {
        run++;
        maxRun = Math.max(maxRun, run);
      } else {
        run = 0;
        seen.add(near);
      }
    }
    expect(maxRun).toBeLessThanOrEqual(Math.ceil(TONE_EDGE_PX));
    expect(seen.size).toBeGreaterThanOrEqual(3);
  });

  it('H-R11 D8 Flecken (patch) laufen weich aus: höchstens 10 % der Landknoten gesättigt, 99-%-Knotensprung ≤ 0,3', () => {
    for (const { grid } of worlds) {
      let sat = 0,
        tot = 0;
      const steps: number[] = [];
      for (let j = 0; j < grid.ny; j++)
        for (let i = 0; i < grid.nx - 1; i++) {
          const a = grid.patch[j * grid.nx + i]!,
            b = grid.patch[j * grid.nx + i + 1]!;
          if (a === 0 || b === 0) continue;
          tot++;
          if (Math.abs(a) >= 0.999) sat++;
          steps.push(Math.abs(a - b));
        }
      steps.sort((p, q) => p - q);
      expect(sat / tot).toBeLessThanOrEqual(0.1);
      expect(steps[Math.floor(steps.length * 0.99)]!).toBeLessThanOrEqual(0.3);
    }
  });
});

describe('H-R11 Sättigung (S5)', () => {
  it('H-R11 S5 meadowTint senkt die HSL-Sättigung der Grundfarben um mindestens 15 % relativ', () => {
    for (const hex of [PALETTE.grassDark, PALETTE.grass, PALETTE.grassLight]) {
      const c = rgbOf(hex);
      const t = meadowTint([c[0], c[1], c[2]]);
      expect(hslS(t[0], t[1], t[2])).toBeLessThanOrEqual(hslS(c[0], c[1], c[2]) * 0.85);
      expect(Math.abs(luma(t[0], t[1], t[2]) - luma(c[0], c[1], c[2]))).toBeLessThan(6);
      expect(t[1]).toBeGreaterThan(t[2]); // bleibt grünlich (oliv), nie grau-blau
    }
  });

  it('H-R11 S5 mittlere Sättigung der Wiese (Seed 1, Fenster 12 × 10 Kacheln) ≥ 15 % unter main (0,410)', () => {
    const { world, grid } = worlds[0]!;
    const x0 = 6,
      y0 = 22,
      W = 12,
      H = 10;
    const px = paintPixels(grid, 1, x0 * TEX, y0 * TEX, W * TEX, H * TEX);
    let s = 0,
      n = 0;
    for (let y = 0; y < H * TEX; y++)
      for (let x = 0; x < W * TEX; x++) {
        if (terr(fieldWorld(world), x0 + ((x / TEX) | 0), y0 + ((y / TEX) | 0)) !== 'grass')
          continue;
        const o = (y * W * TEX + x) * 4;
        s += hslS(px[o]!, px[o + 1]!, px[o + 2]!);
        n++;
      }
    expect(n).toBeGreaterThan(50000);
    expect(s / n).toBeLessThanOrEqual(0.41 * 0.85);
  });
});

describe('H-R11 Wald (D9)', () => {
  const FOREST = LAND.indexOf('forest');
  it('H-R11 D9 der Waldboden-Hof endet höchstens 0,5 Kachel hinter der äussersten Krone', () => {
    // Abstand der äussersten Krone zum Kachelrand (innen), über alle Varianten
    let gap = 1;
    for (let v = 0; v < TREE_VARIANTS; v++)
      for (const c of crownsFor(1, v))
        gap = Math.min(gap, c.cx - c.r, 1 - c.cx - c.r, c.cy - c.r, 1 - c.cy - c.r);
    expect(gap).toBeGreaterThan(0);
    let edges = 0,
      worst = 0;
    for (const { world, grid } of worlds)
      for (let y = 1; y < home(world).height - 1; y++)
        for (let x = 1; x < home(world).width - 1; x++) {
          if (terr(fieldWorld(world), x, y) !== 'forest') continue;
          for (const [dx, dy] of [
            [1, 0],
            [-1, 0],
            [0, 1],
            [0, -1],
          ] as const) {
            // freie Kante: zwei Kacheln Wiese davor und daneben, sonst misst man einen Streifen zwischen Wäldern
            let free = true;
            for (const [k, side] of [
              [1, 0],
              [2, 0],
              [1, 1],
              [1, -1],
              [2, 1],
              [2, -1],
            ] as const) {
              const tx = x + dx * k + (dx === 0 ? side : 0),
                ty = y + dy * k + (dy === 0 ? side : 0);
              if (terr(fieldWorld(world), tx, ty) !== 'grass') free = false;
            }
            if (!free) continue;
            edges++;
            // entlang der Aussennormalen ab der Kachelkante, Mitte der Kante
            let reach = 0;
            for (let d = 0; d <= 0.9; d += 0.02) {
              const fx = x + 0.5 + dx * (0.5 + d),
                fy = y + 0.5 + dy * (0.5 + d);
              if (landShares(grid, fx, fy)[FOREST]! >= 0.2) reach = d;
            }
            worst = Math.max(worst, reach);
          }
        }
    expect(edges).toBeGreaterThan(50);
    expect(worst + gap).toBeLessThanOrEqual(0.5);
  });

  it('H-R11 Wald bleibt bei Zoom 1 dunkler als die Wiese (Bodenhelligkeit, Faktor ≤ 0,8)', () => {
    const { world, grid } = worlds[0]!;
    let lf = 0,
      nf = 0,
      lg = 0,
      ng = 0;
    for (let y = 2; y < home(world).height - 2; y += 1)
      for (let x = 2; x < home(world).width - 2; x += 1) {
        const t = terr(fieldWorld(world), x, y);
        if (t !== 'forest' && t !== 'grass') continue;
        const px = paintPixels(grid, 1, x * TEX + 8, y * TEX + 8, 16, 16);
        let l = 0;
        for (let k = 0; k < 256; k++) l += luma(px[k * 4]!, px[k * 4 + 1]!, px[k * 4 + 2]!);
        if (t === 'forest') {
          lf += l / 256;
          nf++;
        } else {
          lg += l / 256;
          ng++;
        }
      }
    expect(nf).toBeGreaterThan(50);
    expect(lf / nf).toBeLessThanOrEqual(0.8 * (lg / ng));
  });
});

describe('H-R11 Licht auf Wald und Wiese (F3 Hügelform)', () => {
  /** Kuppen: lokale Maxima der Bodenhöhe (Abstand 1 Kachel zu allen 8 Nachbarn tiefer). */
  const hills = (seed: number, x0: number, y0: number, x1: number, y1: number) => {
    const out: { x: number; y: number }[] = [];
    for (let y = y0; y <= y1; y += 0.25)
      for (let x = x0; x <= x1; x += 0.25) {
        const h = groundHeight(seed, x, y);
        let top = true;
        for (let k = 0; k < 8 && top; k++) {
          const a = (k * Math.PI) / 4;
          if (groundHeight(seed, x + Math.cos(a), y + Math.sin(a)) >= h) top = false;
        }
        if (top) out.push({ x, y });
      }
    return out;
  };
  it('H-R11 F3 Tonwert kommt aus Gefälle · LIGHT: Kuppen sind links oben heller als rechts unten', () => {
    expect(GROUND_FLAT).toBe(2);
    let n = 0,
      lit = 0,
      sum = 0;
    for (const seed of [1, 7, 3]) {
      for (const h of hills(seed, 3, 3, 60, 60)) {
        const d = 0.9;
        const a = groundToneAt(seed, h.x + LIGHT.x * d, h.y + LIGHT.y * d), // Lichtseite
          b = groundToneAt(seed, h.x - LIGHT.x * d, h.y - LIGHT.y * d); // Schattenseite
        n++;
        sum += a - b;
        if (a > b) lit++;
      }
    }
    expect(n).toBeGreaterThan(100);
    expect(lit / n).toBeGreaterThanOrEqual(0.95);
    expect(sum / n).toBeGreaterThanOrEqual(0.5);
  });

  it('H-R11 F3 Formlesbarkeit: in einem Zoom-1-Ausschnitt (16 × 10 Kacheln) mindestens 3 Kuppen mit hellerer Stufe links oben und dunklerer rechts unten', () => {
    // sichtbare Kuppe = Lichtseite mindestens eine Stufe über der Schattenseite, beide in ganzen Stufen
    const step = (v: number): number => Math.floor(v + 0.5);
    for (const seed of [1, 7]) {
      let wins = 0,
        ok = 0;
      for (let y0 = 4; y0 + 10 <= 58; y0 += 10)
        for (let x0 = 4; x0 + 16 <= 58; x0 += 16) {
          let visible = 0;
          for (const h of hills(seed, x0, y0, x0 + 16, y0 + 10)) {
            const d = 1.0;
            const a = step(groundToneAt(seed, h.x + LIGHT.x * d, h.y + LIGHT.y * d)),
              b = step(groundToneAt(seed, h.x - LIGHT.x * d, h.y - LIGHT.y * d));
            if (a - b >= 1) visible++;
          }
          wins++;
          if (visible >= 3) ok++;
        }
      expect(ok / wins, `Seed ${seed}`).toBeGreaterThanOrEqual(0.6);
    }
  });
});

const SHADE_R1 = 0.182,
  LIGHT_R1 = 0.159;
describe('H-R11 G1 organische Tonkanten, G2 Kontrast', () => {
  it('H-R11 G1 organische Kanten: höchstens 30 % der Kantenpunkte liegen auf einem geraden Stück von 1 Kachel Länge', () => {
    // Kantenpunkt = Tonwert nahe einer Stufengrenze (1,5 bzw. 2,5); gerade, wenn der Tonwert 0,5 Kachel vor und
    // zurück entlang der Tangente (quer zum Gefälle) höchstens 0,03 vom Grenzwert abweicht.
    let n = 0,
      straight = 0;
    const h = 0.05;
    for (const seed of [1, 7, 3])
      for (let y = 6; y < 58; y += 0.5)
        for (let x = 6; x < 58; x += 0.5) {
          const t0 = groundToneAt(seed, x, y);
          const level = Math.abs(t0 - 1.5) < 0.02 ? 1.5 : Math.abs(t0 - 2.5) < 0.02 ? 2.5 : 0;
          if (!level) continue;
          const gx = (groundToneAt(seed, x + h, y) - groundToneAt(seed, x - h, y)) / (2 * h),
            gy = (groundToneAt(seed, x, y + h) - groundToneAt(seed, x, y - h)) / (2 * h);
          const g = Math.hypot(gx, gy);
          if (g < 0.05) continue; // Kamm oder Tal: keine Kante
          const tx = -gy / g,
            ty = gx / g;
          const dev = Math.max(
            Math.abs(groundToneAt(seed, x + 0.5 * tx, y + 0.5 * ty) - level),
            Math.abs(groundToneAt(seed, x - 0.5 * tx, y - 0.5 * ty) - level),
          );
          n++;
          if (dev <= 0.03) straight++;
        }
    expect(n).toBeGreaterThan(200);
    expect(straight / n).toBeLessThanOrEqual(0.3);
  });

  it('H-R11 G2 Kontrast: Schattenstufe höchstens 70 %, Lichtstufe höchstens 85 % des Abstands von Runde 1, beide Stufen unterscheidbar', () => {
    const { world, grid } = worlds[0]!;
    let bx = -1,
      by = -1;
    for (let y = 2; y < home(world).height - 8 && bx < 0; y++)
      for (let x = 2; x < home(world).width - 8 && bx < 0; x++) {
        let ok = true;
        for (let yy = y; yy < y + 3 && ok; yy++)
          for (let xx = x; xx < x + 3; xx++)
            if (terr(fieldWorld(world), xx, yy) !== 'grass') ok = false;
        if (ok) [bx, by] = [x, y];
      }
    const mean = (t: number): number => {
      const g2 = { ...grid, tone: grid.tone.map(() => t) as Float32Array };
      const q = paintPixels(g2, 1, bx * TEX, by * TEX, 3 * TEX, 3 * TEX);
      let s = 0;
      for (let i = 0; i < 9 * TEX * TEX; i++) s += luma(q[i * 4]!, q[i * 4 + 1]!, q[i * 4 + 2]!);
      return s / (9 * TEX * TEX);
    };
    const flatL = mean(2),
      shade = (flatL - mean(1)) / flatL,
      light = (mean(3) - flatL) / flatL;
    // Runde 1 gemessen (relativ zur ebenen Stufe): Schatten SHADE_R1, Licht LIGHT_R1
    expect(shade).toBeLessThanOrEqual(0.7 * SHADE_R1 + 0.003);
    expect(light).toBeLessThanOrEqual(0.85 * LIGHT_R1 + 0.003);
    // bei Zoom 1 unterscheidbar: mindestens 3 % Helligkeitsabstand je Seite
    expect(shade).toBeGreaterThanOrEqual(0.03);
    expect(light).toBeGreaterThanOrEqual(0.03);
  });
});

describe('H-R11 F1 luminanzneutrale Farbvariation, F2 Korn', () => {
  const { world, grid } = worlds[0]!;
  // 6 × 6 Wiesenkacheln finden
  let bx = -1,
    by = -1;
  for (let y = 2; y < home(world).height - 8 && bx < 0; y++)
    for (let x = 2; x < home(world).width - 8 && bx < 0; x++) {
      let ok = true;
      for (let yy = y - 1; yy < y + 7 && ok; yy++)
        for (let xx = x - 1; xx < x + 7; xx++)
          if (terr(fieldWorld(world), xx, yy) !== 'grass') ok = false;
      if (ok) [bx, by] = [x, y];
    }
  const flatTone = { ...grid, tone: grid.tone.map(() => GROUND_FLAT) as Float32Array };
  const W = 6 * TEX;
  const px = paintPixels(flatTone, 1, bx * TEX, by * TEX, W, W);
  const L = (i: number): number => luma(px[i * 4]!, px[i * 4 + 1]!, px[i * 4 + 2]!);

  it('H-R11 F1 bei gleicher Tonstufe schwankt die Helligkeit über die Farbvariation nur um ±2 % (Blockmittel 12 × 12 px)', () => {
    expect(bx).toBeGreaterThanOrEqual(0);
    const B = 12,
      means: number[] = [];
    for (let y = 0; y + B <= W; y += B)
      for (let x = 0; x + B <= W; x += B) {
        let s = 0;
        for (let j = 0; j < B; j++) for (let i = 0; i < B; i++) s += L((y + j) * W + x + i);
        means.push(s / (B * B));
      }
    const mu = means.reduce((p, q) => p + q, 0) / means.length;
    for (const m of means) expect(Math.abs(m / mu - 1)).toBeLessThanOrEqual(0.02);
    // der Farbton variiert trotzdem (nicht eine einzige Farbe)
    const hue = (i: number): number => px[i * 4 + 1]! / (px[i * 4]! + 1);
    let lo = 9,
      hi = 0;
    for (let i = 0; i < W * W; i += 7) {
      lo = Math.min(lo, hue(i));
      hi = Math.max(hi, hue(i));
    }
    expect(hi - lo).toBeGreaterThan(0.03);
  });

  it('H-R11 F2 Pixelkorn: ±2–3 % je Ebenenpixel, deterministisch, Nachbarn unterscheiden sich', () => {
    let s = 0,
      s2 = 0,
      diff = 0;
    const n = W * W;
    for (let i = 0; i < n; i++) {
      s += L(i);
      s2 += L(i) * L(i);
      if (i % W > 0 && Math.abs(L(i) - L(i - 1)) > 0.2) diff++;
    }
    const mu = s / n,
      sd = Math.sqrt(s2 / n - mu * mu);
    expect(sd / mu).toBeGreaterThanOrEqual(0.008);
    expect(sd / mu).toBeLessThanOrEqual(0.02);
    expect(diff / n).toBeGreaterThan(0.6);
    const again = paintPixels(flatTone, 1, bx * TEX, by * TEX, W, W);
    expect(again).toEqual(px);
  });
});
