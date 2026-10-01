import { describe, expect, it } from 'vitest';
import { PALETTE, SIGNAL_NAMES, rgbOf } from '../../src/render/palette';
import {
  drawWaves,
  FOAM_ALPHA,
  FOAM_PERIOD_MS,
  FOAM_CORE_ALPHA,
  WAVE_ALPHA,
} from '../../src/render/water';
import type { World } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { coastValue, terrainFields } from '../../src/render/terrainField';
import { deltaE2000, hexToLab, rgbToLab } from './deltaE';
import { fakeCtx } from './fakeCtx';

/** w = Wasser, g = Gras (Kartengrösse aus den Zeilen). */
const mini = (rows: string[]): World =>
  ({
    width: rows[0]!.length,
    height: rows.length,
    seed: 5,
    tiles: rows
      .join('')
      .split('')
      .map((c) => ({ terrain: c === 'w' ? 'water' : 'grass', buildingId: null, road: false })),
  }) as unknown as World;

const alphaOf = (css: string): number => Number(/,([\d.]+)\)$/.exec(css)![1]);
const foamRgb = rgbOf(PALETTE.foam).join(',');
const isFoam = (css: string) => css.startsWith(`rgba(${foamRgb},`);
const ALL = (w: World) => ({ x0: 0, y0: 0, x1: w.width - 1, y1: w.height - 1 });

function frame(world: World, t: number) {
  const { ctx, log } = fakeCtx();
  drawWaves(ctx, world, ALL(world), t);
  return log;
}
const sea = () =>
  mini(['gwwwwwwww', 'gwwwwwwww', 'gwwwwwwww', 'gwwwwwwww', 'gwwwwwwww', 'gwwwwwwww']);

describe('Wasser (Spec 5.2)', () => {
  it('RF-1e Karte ohne Land: kein Schaum, nur endliche Wellenpunkte; Karte ohne Wasser: nichts', () => {
    const open = frame(mini(['www', 'www']), 1000);
    expect(open.strokeSet.every((s) => alphaOf(s) === WAVE_ALPHA)).toBe(true);
    expect(open.allPoints.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
    expect(frame(mini(['ggg', 'ggg']), 1000).allPoints.length).toBe(0);
  });

  it('Spec 5.2 Schaumsaum: Deckkraft schwankt in [0,35, 0,7] mit Periode 3,2 s, nur foam-Farbe', () => {
    const w = sea();
    const alphas: number[] = [];
    for (let t = 0; t < FOAM_PERIOD_MS; t += 100) {
      const log = frame(w, t);
      const foam = log.strokeSet.filter(isFoam).map(alphaOf);
      expect(foam.length).toBeGreaterThan(0);
      alphas.push(...foam.filter((a) => a !== WAVE_ALPHA && a < 0.8));
    }
    expect(FOAM_ALPHA).toEqual([0.35, 0.7]);
    expect(Math.min(...alphas)).toBeGreaterThanOrEqual(0.35 - 1e-9);
    expect(Math.max(...alphas)).toBeLessThanOrEqual(0.7 + 1e-9);
    expect(Math.max(...alphas) - Math.min(...alphas)).toBeGreaterThan(0.3);
    const a = frame(w, 700),
      b = frame(w, 700 + FOAM_PERIOD_MS);
    expect(b.strokeSet).toEqual(a.strokeSet);
  });

  it('Spec 5.2 Schaumlinie liegt am Strand (Kachelraum) und wandert um höchstens 0,1 Kachel', () => {
    const w = sea();
    let lo = Infinity,
      hi = -Infinity;
    for (let t = 0; t < FOAM_PERIOD_MS; t += 200) {
      const { ctx, log } = fakeCtx();
      drawWaves(ctx, w, { x0: 1, y0: 2, x1: 1, y1: 3 }, t); // nur Küstenspalte x = 1
      const pts = log.allPoints.filter((p) => p.x < 2);
      expect(pts.length).toBeGreaterThan(0);
      for (const p of pts) {
        lo = Math.min(lo, p.x);
        hi = Math.max(hi, p.x);
      }
    }
    expect(lo).toBeGreaterThan(1 - 0.13); // Küste liegt bei x = 1, ± Verschiebung des Terrains
    expect(hi).toBeLessThan(1 + 0.13 + 0.1 + 1e-6);
  });

  it('Spec 5.2 Wellenstriche nur auf Wasser mit Tiefe ≥ 2 (Flachwasser trägt keine Striche), Alpha 0,12', () => {
    const w = sea();
    const { ctx, log } = fakeCtx();
    drawWaves(ctx, w, { x0: 2, y0: 0, x1: 8, y1: 5 }, 500);
    const waves = log.events.filter((e) => e.op === 'stroke' && alphaOf(e.style) === WAVE_ALPHA);
    expect(waves.length).toBeGreaterThan(0);
    for (const e of waves) for (const p of e.points) expect(p.x).toBeGreaterThanOrEqual(2);
    const shallow = fakeCtx();
    drawWaves(shallow.ctx, w, { x0: 1, y0: 0, x1: 1, y1: 5 }, 500);
    expect(
      shallow.log.events.some((e) => e.op === 'stroke' && alphaOf(e.style) === WAVE_ALPHA),
    ).toBe(false);
  });

  it('Spec 4.2 keine Signalfarbe im Wasser, nur foam-Farbe', () => {
    const log = frame(sea(), 900);
    const signals = SIGNAL_NAMES.map((n) => rgbOf(PALETTE[n]).join(','));
    for (const s of log.strokeSet) {
      expect(isFoam(s), s).toBe(true);
      for (const sig of signals) expect(s.includes(sig)).toBe(false);
    }
  });

  it('RF-7 save/restore bleiben ausgeglichen', () => {
    const log = frame(sea(), 0);
    expect(log.saves).toBe(log.restores);
    expect(log.underflow).toBe(0);
  });

  it('AK-ISO-18 I2 Schaumkern ist farbnah zu foam (ΔE2000 ≤ 10 über Flachwasser, Kern-Deckkraft ≥ 0,85)', () => {
    const w = sea();
    const bg = rgbOf(PALETTE.waterShallow);
    const fg = rgbOf(PALETTE.foam);
    let cores = 0;
    for (let t = 0; t < FOAM_PERIOD_MS; t += 100) {
      const log = frame(w, t);
      const core = log.strokeSet
        .filter(isFoam)
        .map(alphaOf)
        .filter((a) => a >= 0.8);
      expect(core.length).toBe(1);
      const a = core[0]!;
      expect(a).toBeGreaterThanOrEqual(FOAM_CORE_ALPHA[0] - 1e-9);
      const mixed = fg.map((v, i) => v * a + bg[i]! * (1 - a)) as [number, number, number];
      expect(deltaE2000(rgbToLab(mixed), hexToLab(PALETTE.foam)), `t=${t}`).toBeLessThanOrEqual(10);
      cores++;
    }
    expect(cores).toBeGreaterThan(0);
  });

  it('Spec 5.2 Schaumlinie ist eine Höhenlinie des Küstenfelds: nach warp an der gezeichneten Küste', () => {
    const w = createWorld(3);
    const f = terrainFields(w);
    let n = 0,
      minF = Infinity,
      maxF = -Infinity;
    for (let t = 0; t < FOAM_PERIOD_MS; t += 400) {
      const { ctx, log } = fakeCtx();
      drawWaves(ctx, w, ALL(w), t);
      for (const e of log.events)
        if (e.op === 'stroke' && alphaOf(e.style) >= 0.35 && alphaOf(e.style) !== WAVE_ALPHA)
          for (const p of e.points) {
            const v = coastValue(f, p.x, p.y);
            minF = Math.min(minF, v);
            maxF = Math.max(maxF, v);
            n++;
          }
    }
    expect(n).toBeGreaterThan(500);
    // 0 = Küste, negativ = Wasser: Linie zwischen Strand und 0,1 Kachel (Gefälle ≈ 2,5 je Kachel) davor
    expect(maxF).toBeLessThanOrEqual(0.05);
    expect(minF).toBeGreaterThanOrEqual(-0.45);
  });

  it('Spec 5.2 Schaumlinie liegt nicht systematisch auf Kachelkanten (keine Kantenstücke)', () => {
    const w = createWorld(3);
    const { ctx, log } = fakeCtx();
    drawWaves(ctx, w, ALL(w), 800);
    const pts = log.events
      .filter(
        (e) => e.op === 'stroke' && alphaOf(e.style) >= 0.35 && alphaOf(e.style) !== WAVE_ALPHA,
      )
      .flatMap((e) => e.points);
    // Segment = zwei aufeinanderfolgende Punkte; ein Kantenstück liegt mit beiden Enden auf derselben Kachelkante
    let segs = 0,
      onEdge = 0;
    for (let k = 0; k + 1 < pts.length; k += 2) {
      const a = pts[k]!,
        b = pts[k + 1]!;
      segs++;
      const same = (u: number, v: number) =>
        Math.abs(u - v) < 0.01 && Math.abs(u - Math.round(u)) < 0.01;
      if (same(a.x, b.x) || same(a.y, b.y)) onEdge++;
    }
    expect(pts.length).toBeGreaterThan(500);
    expect(onEdge / segs).toBeLessThan(0.1);
  });

  it('AK-ISO-18 I2 Schaumkern ist bei Zoom 1 in jeder Richtung ≥ 1,5 px breit (Bodenmatrix, analytisch)', () => {
    const w = createWorld(3);
    const { ctx, log } = fakeCtx();
    const widths: number[] = [];
    const orig = log.stroke.bind(log);
    log.stroke = () => {
      if (alphaOf(log.strokeStyle) >= 0.8) widths.push(log.lineWidth);
      orig();
    };
    drawWaves(ctx, w, ALL(w), 1000);
    expect(widths.length).toBe(1);
    // Bodenmatrix bei Zoom 1: Texturpixel → Bild, Spalten (32, 16) und (−32, 16); Breite senkrecht zur Linie = lw · det / |M d|
    const det = 32 * 16 + 32 * 16;
    let min = Infinity;
    for (let a = 0; a < Math.PI; a += 0.05) {
      const d = [Math.cos(a), Math.sin(a)];
      const md = Math.hypot(32 * d[0]! - 32 * d[1]!, 16 * d[0]! + 16 * d[1]!);
      min = Math.min(min, (widths[0]! * det) / md);
    }
    expect(min).toBeGreaterThanOrEqual(1.5);
  });
});
