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
import { imageStageOf, monumentImageStage } from '../../src/render/monumentStage';
import { bodyHeight, bodyHull } from '../../src/render/iso';
import { drawBody, drawBodyPlain, drawGhost } from '../../src/render/sprites';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { createWorld } from '../../src/sim/world';
import type { Monument } from '../../src/sim/types';
import { fakeCtx, inHull } from './fakeCtx';

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

describe('M13-E2 T09 Bildstufe in Höhe, Hülle und Ghost', () => {
  const DEF = BUILDING_DEFS.monument;
  const mono = (x = 10, y = 10): Building => ({ ...mk(x, y), defId: 'monument' });
  const mm = (stage: number, running: boolean) => ({ stage, running });

  it('AK-M13E2-36 monumentImageStage: alle sieben erreichbaren Paare', () => {
    const pairs: [number, boolean, number][] = [
      [0, false, 0],
      [0, true, 1],
      [1, false, 2],
      [1, true, 2],
      [2, false, 3],
      [2, true, 3],
      [3, false, 4],
    ];
    for (const [s, r, want] of pairs) expect(monumentImageStage(mm(s, r))).toBe(want);
  });

  it('AK-M13E2-36 imageStageOf: Denkmal aus world.monument, null und andere Gebäude 0', () => {
    const w = createWorld(3, { unlockAll: true });
    const b = mono();
    expect(imageStageOf(w, b)).toBe(0);
    w.monument = { buildingId: b.id, stage: 2, running: true } as Monument;
    expect(imageStageOf(w, b)).toBe(3);
    expect(imageStageOf(w, { ...b, defId: 'townhall' })).toBe(0);
  });

  it('AK-M13E2-36 drawBody mit echter Def: H(s) streng steigend, Spanne, alle Punkte in bodyHull(def, b, s)', () => {
    const b = mono();
    const top = project(b.x, b.y);
    const hs = STAGES.map((s) => {
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, DEF, b, 0, undefined, 0, s);
      const hull = bodyHull(DEF, b, s);
      for (const q of log.allPoints) expect(inHull(hull, q.x, q.y, 0.5)).toBe(true);
      return (top.y - Math.min(...log.allPoints.map((q) => q.y))) / ISO_H;
    });
    for (let i = 1; i < 5; i++) expect(hs[i]!).toBeGreaterThan(hs[i - 1]!);
    expect(hs[4]!).toBeGreaterThanOrEqual(2.8);
    expect(hs[4]!).toBeLessThanOrEqual(3.0);
    expect(hs[0]!).toBeLessThanOrEqual(0.3);
  });

  it('AK-M13E2-36 bodyHeight(def, b, s) streng steigend und Stufe 4 über der Amtsstube', () => {
    const b = mono();
    const hs = STAGES.map((s) => bodyHeight(DEF, b, s));
    for (let i = 1; i < 5; i++) expect(hs[i]!).toBeGreaterThan(hs[i - 1]!);
    expect(hs[4]!).toBeGreaterThan(bodyHeight(BUILDING_DEFS.townhall, mk()));
    expect(bodyHeight(BUILDING_DEFS.townhall, mk())).toBe(2.0 * ISO_H);
  });

  it('AK-M13E2-36 drawGhost(monument) zeichnet dieselbe Aufzeichnung wie Stufe 4', () => {
    const g = fakeCtx();
    drawGhost(g.ctx, CAM, DEF, 10, 10);
    const r = fakeCtx();
    drawBodyPlain(r.ctx, CAM, DEF, { ...mono(), id: -1 }, 0, undefined, 0, 4);
    const rec = (ev: typeof g.log.events) =>
      JSON.stringify(ev.map((e) => [e.op, e.style, e.points]));
    expect(rec(g.log.events)).toBe(rec(r.log.events));
    expect(g.log.events.length).toBeGreaterThan(0);
  });
});
