import { describe, expect, it } from 'vitest';
import { PALETTE, SIGNAL_NAMES, rgbOf } from '../../src/render/palette';
import { drawWaves, FOAM_ALPHA, FOAM_PERIOD_MS, WAVE_ALPHA } from '../../src/render/water';
import type { World } from '../../src/sim/types';
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

  it('AK-R1-05 Schaumsaum: Deckkraft schwankt in [0,35, 0,7] mit Periode 3,2 s, nur foam-Farbe', () => {
    const w = sea();
    const alphas: number[] = [];
    for (let t = 0; t < FOAM_PERIOD_MS; t += 100) {
      const log = frame(w, t);
      const foam = log.strokeSet.filter(isFoam).map(alphaOf);
      expect(foam.length).toBeGreaterThan(0);
      alphas.push(...foam.filter((a) => a !== WAVE_ALPHA));
    }
    expect(FOAM_ALPHA).toEqual([0.35, 0.7]);
    expect(Math.min(...alphas)).toBeGreaterThanOrEqual(0.35 - 1e-9);
    expect(Math.max(...alphas)).toBeLessThanOrEqual(0.7 + 1e-9);
    expect(Math.max(...alphas) - Math.min(...alphas)).toBeGreaterThan(0.3);
    const a = frame(w, 700),
      b = frame(w, 700 + FOAM_PERIOD_MS);
    expect(b.strokeSet).toEqual(a.strokeSet);
  });

  it('AK-R1-05 Schaumlinie liegt am Strand (Kachelraum) und wandert um höchstens 0,1 Kachel', () => {
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

  it('AK-R1-05 Wellenstriche nur auf Wasser mit Tiefe ≥ 2 (Flachwasser trägt keine Striche), Alpha 0,12', () => {
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

  it('AK-R1-03 keine Signalfarbe im Wasser, nur foam-Farbe', () => {
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
});
