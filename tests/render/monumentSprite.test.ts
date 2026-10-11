import { describe, expect, it } from 'vitest';
import { ISO_H, project } from '../../src/render/isoBase';
import { cap } from '../../src/render/limits';
import { flareStrength, drawMonumentFlare } from '../../src/render/fx';
import {
  MONUMENT_HEIGHTS,
  drawMonument,
  monumentNightLight,
  type MonumentImageStage,
} from '../../src/render/monumentSprite';
import { IsoPainter } from '../../src/render/sprites';
import type { Building } from '../../src/sim/types';
import { fakeCtx } from './fakeCtx';

const CAM = { x: 0, y: 0, zoom: 1 };
const STAGES: readonly MonumentImageStage[] = [0, 1, 2, 3, 4];
const mk = (x = 10, y = 10): Building =>
  ({
    id: 7,
    defId: 'townhall',
    x,
    y,
    connected: true,
    progress: 0,
    state: 'ok',
    island: 0,
  }) as Building;

function paint(s: MonumentImageStage, b = mk()) {
  const { ctx, log } = fakeCtx();
  drawMonument(new IsoPainter(ctx, CAM, b.x, b.y, 3, 3), b, s);
  return { log, b };
}
const H = (s: MonumentImageStage): number => {
  const { log, b } = paint(s);
  const top = project(b.x, b.y);
  return (top.y - Math.min(...log.allPoints.map((q) => q.y))) / ISO_H;
};
const record = (s: MonumentImageStage): string => {
  const { log } = paint(s);
  return JSON.stringify(log.events.map((e) => [e.op, e.style, e.points]));
};

describe('M13-E2 T08 Denkmal-Maler', () => {
  it('AK-M13E2-36 fünf Stufen ergeben fünf paarweise verschiedene Aufzeichnungen', () => {
    const recs = STAGES.map(record);
    expect(new Set(recs).size).toBe(5);
    for (const s of STAGES) expect(paint(s).log.events.length).toBeGreaterThan(0);
  });

  it('AK-M13E2-36 Höhenmass H(s) streng steigend, H(4) in [2,8; 3,0] und über der Amtsstube, H(0) <= 0,3', () => {
    const hs = STAGES.map(H);
    for (let i = 1; i < 5; i++) expect(hs[i]!).toBeGreaterThan(hs[i - 1]!);
    expect(hs[4]!).toBeGreaterThanOrEqual(2.8);
    expect(hs[4]!).toBeLessThanOrEqual(3.0);
    expect(hs[4]!).toBeGreaterThan(2.0);
    expect(hs[0]!).toBeLessThanOrEqual(0.3);
    for (let i = 1; i < 5; i++)
      expect(MONUMENT_HEIGHTS[i]!).toBeGreaterThan(MONUMENT_HEIGHTS[i - 1]!);
    STAGES.forEach((s) => expect(hs[s]!).toBeCloseTo(MONUMENT_HEIGHTS[s], 2));
  });

  it('AK-M13E2-36 alle Punkte liegen seitlich innerhalb der 3x3-Raute (Toleranz 0,5 px)', () => {
    const half = 3 * (project(1, 0).x - project(0, 0).x) * -1; // 3 Kacheln · 32 px
    for (const s of STAGES) {
      const { log, b } = paint(s);
      const cx = project(b.x, b.y).x;
      expect(log.allPoints.length).toBeGreaterThan(0);
      for (const q of log.allPoints)
        expect(Math.abs(q.x - cx)).toBeLessThanOrEqual(Math.abs(half) + 0.5);
    }
  });

  it('AK-M13E2-36 gleiche Eingabe liefert gleiche Aufzeichnung', () => {
    for (const s of STAGES) expect(record(s)).toBe(record(s));
  });

  it('AK-M13E2-39 flareStrength: 0 bei -1 und ab 3000 ms, dazwischen > 0, 0 bei reduce', () => {
    expect(flareStrength(-1, false)).toBe(0);
    expect(flareStrength(3000, false)).toBe(0);
    expect(flareStrength(9000, false)).toBe(0);
    for (const t of [0, 100, 500, 1500, 2900]) {
      const v = flareStrength(t, false);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThanOrEqual(1);
      expect(flareStrength(t, true)).toBe(0);
    }
  });

  it('AK-M13E2-39 drawMonumentFlare: reduce zeichnet nichts, sonst höchstens cap(flareSparks) Partikel', () => {
    const r = fakeCtx();
    drawMonumentFlare(r.ctx, { x: 100, y: 50 }, 500, true);
    expect(r.log.events).toHaveLength(0);
    expect(r.log.allPoints).toHaveLength(0);
    for (const t of [0, 300, 1000, 2500]) {
      const f = fakeCtx();
      drawMonumentFlare(f.ctx, { x: 100, y: 50 }, t, false);
      expect(f.log.events.length).toBeGreaterThan(0);
      const sparks = f.log.events
        .filter((e) => e.op === 'fill')
        .reduce((n, e) => n + e.points.length / 4, 0);
      expect(sparks).toBeLessThanOrEqual(cap('flareSparks'));
      expect(f.log.saves).toBe(f.log.restores);
    }
    const after = fakeCtx();
    drawMonumentFlare(after.ctx, { x: 0, y: 0 }, 3000, false);
    expect(after.log.events).toHaveLength(0);
  });

  it('AK-M13E2-39 monumentNightLight nur für Stufe 4', () => {
    expect(STAGES.map(monumentNightLight)).toEqual([false, false, false, false, true]);
  });

  it('AK-M13E2-36 Maler hält save/restore ausgeglichen', () => {
    for (const s of STAGES) {
      const { log } = paint(s);
      expect(log.saves).toBe(log.restores);
      expect(log.underflow).toBe(0);
    }
  });
});
