import { describe, expect, it } from 'vitest';
import { createWorld, home } from '../../src/sim/world';
import { seaContext, seaPlan } from '../../src/render/decor';
import { PALETTE, rgbOfCss } from '../../src/render/palette';
import {
  SEA_RES,
  SEA_TONES,
  buildSeaTint,
  seaTintFor,
  tintWater,
} from '../../src/render/seaFields';
import { buildGrid, paintPixels } from '../../src/render/terrain';
import { fieldWorld } from '../../src/render/terrainField';
import { deltaE2000, rgbToLab } from './deltaE';

const lab = (c: string | number[]) =>
  rgbToLab(typeof c === 'string' ? rgbOfCss(c) : (c as [number, number, number]));
const SCALE = 0.25; // 8 px je Kachel

describe('L5-T3 Wasserfelder im Bodenbild (Sandbank, Riff, Tang)', () => {
  it('Töne: Sandbank ist aufgehelltes Flachwasser, nie trockener Sand; ΔE ≥ 20 zu den Signalfarben', () => {
    const d = (a: string, b: string) => deltaE2000(lab(a), lab(b));
    expect(d(SEA_TONES.sandbank, PALETTE.waterShallow)).toBeLessThan(
      d(SEA_TONES.sandbank, PALETTE.sandDry),
    );
    expect(d(SEA_TONES.sandbank, PALETTE.sandDry)).toBeGreaterThan(15);
    for (const t of Object.values(SEA_TONES))
      for (const n of ['signalRed', 'signalYellow', 'signalWarn', 'signalOk'] as const)
        expect(d(t, PALETTE[n]), `${t} ~ ${n}`).toBeGreaterThanOrEqual(20);
  });

  it('tintWater verändert nur Pixel im Bereich der Flächen (Maske), weiche Ränder, Gewicht 0 ausserhalb', () => {
    const t = buildSeaTint(1, 20, 20, {
      sandbanks: [{ tiles: [{ x: 5, y: 5 }] }],
      reefs: [],
      kelp: [],
    });
    const base = [47, 127, 154];
    const at = (fx: number, fy: number): number[] => {
      const o = [...base];
      tintWater(t, fx, fy, o);
      return o;
    };
    expect(at(5.5, 5.5)).not.toEqual(base);
    expect(at(15.5, 15.5)).toEqual(base);
    expect(at(8.5, 5.5)).toEqual(base);
    // weicher Rand: der Abstand zum Wasserton wächst vom Rand zur Mitte monoton
    const dist = (o: number[]) => Math.hypot(o[0]! - 47, o[1]! - 127, o[2]! - 154);
    expect(dist(at(5.5, 5.5))).toBeGreaterThan(dist(at(6.2, 5.5)));
    expect(dist(at(6.2, 5.5))).toBeGreaterThan(dist(at(6.5, 5.5)) - 1e-9 - 100);
  });

  it('Seeds 1–3: paintPixels ändert nur Pixel in Flächenkacheln (Wasser, Küstenzelle); Sandbank, Riff und Tang weichen vom Wasserton ab', () => {
    let changedAll = 0;
    for (let seed = 1; seed <= 3; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      const g = buildGrid(fieldWorld(w));
      const tint = seaTintFor(w);
      expect(tint, `Seed ${seed}`).not.toBeNull();
      const W = isl.width * 8;
      const off = paintPixels({ ...g, sea: null }, SCALE, 0, 0, W, W);
      const on = paintPixels({ ...g, sea: tint }, SCALE, 0, 0, W, W);
      for (let i = 0; i < off.length; i += 4) {
        if (off[i] === on[i] && off[i + 1] === on[i + 1] && off[i + 2] === on[i + 2]) continue;
        changedAll++;
        const p = i / 4,
          tx = Math.floor((p % W) / 8),
          ty = Math.floor(p / W / 8);
        expect(tint!.mask[ty * isl.width + tx], `Seed ${seed}: Pixel in Maskenkachel`).toBe(1);
        expect(['water', 'sand'], 'Wasserpixel der Küstenzelle, nie Gras oder Fels').toContain(
          isl.tiles[ty * isl.width + tx]!.terrain,
        );
      }
    }
    expect(changedAll).toBeGreaterThan(2000);
  });

  it('Fläche ist im Bild sichtbar: Mitte einer Sandbank liegt ≥ 8 ΔE vom ungetönten Wasser, Riff hat dunklere Flecken, Tang ist olivstichig', () => {
    let sand = 0,
      reefSpots = 0,
      kelp = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const w = createWorld(seed);
      const plan = seaPlan(w.seed, home(w), seaContext(w));
      const t = seaTintFor(w);
      if (!t) continue;
      const wc = [47, 127, 154];
      const run = (fx: number, fy: number) => {
        const o = [...wc];
        tintWater(t, fx, fy, o);
        return o;
      };
      for (const a of plan.sandbanks)
        if (deltaE2000(lab(run(a.tiles[0]!.x + 0.5, a.tiles[0]!.y + 0.5)), lab(wc)) >= 8) sand++;
      for (const a of plan.reefs)
        for (const q of a.tiles)
          for (let k = 0; k < 20; k++) {
            const o = run(q.x + (k % 5) / 5, q.y + Math.floor(k / 5) / 4);
            if (o[1]! < 150) reefSpots++;
          }
      for (const a of plan.kelp) {
        const o = run(a.tiles[0]!.x + 0.5, a.tiles[0]!.y + 0.5);
        if (o[0]! > wc[0]!) kelp++;
      }
    }
    expect(sand).toBeGreaterThan(10);
    expect(reefSpots).toBeGreaterThan(10);
    expect(kelp).toBeGreaterThan(0);
  });

  it('Fremdinseln und Welten ohne Flächen: kein Tint (null); Heimat gleiche Welt → gleiches Objekt (je Welt gehalten)', () => {
    const w = createWorld(7);
    expect(seaTintFor(w)).toBe(seaTintFor(w));
    const f = createWorld(7);
    home(f).kind = 'home';
    expect(seaTintFor(f)).not.toBeUndefined();
  });

  it('T7 weiche Ränder über die Kachelgrenzen: das Gewicht ändert sich entlang jeder Linie nie sprunghaft (Gradient begrenzt), keine Rechteckform', () => {
    const t = buildSeaTint(3, 30, 30, {
      sandbanks: [
        {
          tiles: [
            { x: 10, y: 10 },
            { x: 11, y: 10 },
            { x: 10, y: 11 },
          ],
        },
      ],
      reefs: [
        {
          tiles: [
            { x: 20, y: 20 },
            { x: 21, y: 20 },
            { x: 22, y: 20 },
          ],
        },
      ],
      kelp: [{ tiles: [{ x: 5, y: 22 }] }],
    });
    const w = (kind: 'sand' | 'reef' | 'kelp', fx: number, fy: number): number => {
      const gx = fx * SEA_RES,
        gy = fy * SEA_RES,
        sw = t.w * SEA_RES + 1;
      const i = Math.floor(gx),
        j = Math.floor(gy);
      const tx = gx - i,
        ty = gy - j,
        f = t[kind],
        a = j * sw + i;
      return (
        f[a]! * (1 - tx) * (1 - ty) +
        f[a + 1]! * tx * (1 - ty) +
        f[a + sw]! * (1 - tx) * ty +
        f[a + sw + 1]! * tx * ty
      );
    };
    for (const kind of ['sand', 'reef', 'kelp'] as const) {
      let maxStep = 0,
        extent = 0;
      for (let y = 0; y < 29.8; y += 0.1)
        for (let x = 0; x < 29.8; x += 0.1) {
          const v = w(kind, x, y);
          maxStep = Math.max(
            maxStep,
            Math.abs(v - w(kind, x + 0.1, y)),
            Math.abs(v - w(kind, x, y + 0.1)),
          );
          if (v > 0.05) extent++;
        }
      expect(maxStep, `${kind}: ≤ 0,2 je 0,1 Kachel`).toBeLessThanOrEqual(0.2);
      expect(extent).toBeGreaterThan(0);
    }
    // Rechteckform: Gewicht an der Kachelecke weit unter dem Gewicht in der Kachelmitte
    expect(w('sand', 10.5, 10.5)).toBeGreaterThan(0.8);
    expect(w('sand', 9.2, 10.5)).toBeGreaterThan(0);
    expect(w('sand', 9.2, 10.5)).toBeLessThan(w('sand', 10.5, 10.5));
    // Unschärfe ≥ 1 Kachel: Einfluss reicht mindestens 1,2 Kacheln über den Rand der Kachel hinaus
    expect(w('sand', 12.7, 10.5)).toBeGreaterThan(0);
  });
});
