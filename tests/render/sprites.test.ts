import { describe, expect, it } from 'vitest';
import {
  H_MAX,
  ISO_H,
  ISO_W,
  bodyHeight,
  bodyHull,
  project,
  spriteBounds,
} from '../../src/render/iso';
import { drawShip, SHIP_H } from '../../src/render/ship';
import { AIR_COLORS, bodyColors, drawAir, drawBody } from '../../src/render/sprites';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, BuildingDefId } from '../../src/sim/types';
import { fakeCtx, inHull, type P } from './fakeCtx';

const CAM = { x: 0, y: 0, zoom: 1 };
const mk = (defId: BuildingDefId, x = 10, y = 10, extra: Partial<Building> = {}): Building => ({
  id: 3,
  defId,
  x,
  y,
  connected: true,
  progress: 0,
  state: 'ok',
  ...extra,
});
const DEFS = Object.values(BUILDING_DEFS);

/** Hülle mit anderer Höhe (Testhelfer für „oben dicht"). */
function hullWithHeight(defId: BuildingDefId, b: Building, h: number): P[] {
  const def = BUILDING_DEFS[defId];
  const t = project(b.x, b.y),
    r = project(b.x + def.w, b.y),
    bo = project(b.x + def.w, b.y + def.h),
    l = project(b.x, b.y + def.h);
  const up = (p: P): P => ({ x: p.x, y: p.y - h });
  return [up(t), up(r), r, bo, l, up(l)];
}

describe('Platzhalter-Körper', () => {
  it('AK-ISO-10 Platzhalter-Körper: jeder Pfadpunkt in bodyHull (±0,5 px), Höhe ≤ H_MAX bzw. H_TOWER', () => {
    for (const def of DEFS) {
      const b = mk(def.id);
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, b, 0);
      expect(log.allPoints.length).toBeGreaterThan(8);
      const hull = bodyHull(def, b);
      for (const p of log.allPoints) expect(inHull(hull, p.x, p.y, 0.5), `${def.id}`).toBe(true);
      // keine Türme in R0-ISO: Grenze ist H_MAX
      expect(bodyHeight(def, b)).toBeLessThanOrEqual(H_MAX);
      // Grundriss je Seite höchstens 0,1 Kachel eingezogen (in Bildpunkten der Raute)
      const top = project(b.x, b.y),
        left = project(b.x, b.y + def.h),
        right = project(b.x + def.w, b.y),
        bottom = project(b.x + def.w, b.y + def.h);
      const xs = log.allPoints.map((p) => p.x),
        ys = log.allPoints.map((p) => p.y);
      expect(Math.min(...xs)).toBeLessThanOrEqual(left.x + 0.2 * (ISO_W / 2) + 1e-6);
      expect(Math.max(...xs)).toBeGreaterThanOrEqual(right.x - 0.2 * (ISO_W / 2) - 1e-6);
      expect(Math.max(...ys)).toBeGreaterThanOrEqual(bottom.y - 0.2 * (ISO_H / 2) - 1e-6);
      expect(Math.min(...ys)).toBeLessThanOrEqual(top.y - bodyHeight(def, b) + 0.2 * ISO_H);
    }
  });

  it('AK-ISO-10 umgekehrt (QA-Hinweis a): die Hülle ist oben dicht — mit Höhe bodyHeight − 1 enthält sie nicht alle Körperpunkte', () => {
    for (const def of DEFS) {
      const b = mk(def.id);
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, b, 0);
      const full = hullWithHeight(def.id, b, bodyHeight(def, b));
      const low = hullWithHeight(def.id, b, bodyHeight(def, b) - 1);
      expect(log.allPoints.every((p) => inHull(full, p.x, p.y, 0.5))).toBe(true);
      expect(
        log.allPoints.every((p) => inHull(low, p.x, p.y, 0.5)),
        def.id,
      ).toBe(false);
      // und der Körper liegt in spriteBounds
      const box = spriteBounds(def, b);
      for (const p of log.allPoints) {
        expect(p.x).toBeGreaterThanOrEqual(box.x - 0.5);
        expect(p.x).toBeLessThanOrEqual(box.x + box.w + 0.5);
        expect(p.y).toBeGreaterThanOrEqual(box.y - 0.5);
        expect(p.y).toBeLessThanOrEqual(box.y + box.h + 0.5);
      }
    }
  });

  it('AK-ISO-10 Schiff: jeder Pfadpunkt in pointBounds und in der Spaltenbreite einer Kachel (Bobbing max.)', () => {
    const tile = { x: 12, y: 9 };
    const c = project(tile.x + 0.5, tile.y + 0.5);
    for (const t of [0, 300, 650, 1300, 1950, 2600 * 0.37]) {
      const { ctx, log } = fakeCtx();
      drawShip(ctx, CAM, tile, t);
      expect(log.allPoints.length).toBeGreaterThan(8);
      for (const p of log.allPoints) {
        expect(Math.abs(p.x - c.x)).toBeLessThanOrEqual(ISO_W / 2);
        expect(p.y).toBeGreaterThanOrEqual(c.y - SHIP_H - 0.5);
        expect(p.y).toBeLessThanOrEqual(c.y + ISO_H / 2 + 0.5);
      }
    }
    expect(SHIP_H).toBeCloseTo(1.2 * ISO_H, 9);
  });
});

describe('Körper und Luft getrennt', () => {
  it('RF-6a drawAir nur AIR_COLORS; drawBody ohne AIR_COLORS', () => {
    const smoke = Object.values(AIR_COLORS);
    expect(smoke.length).toBeGreaterThan(0);
    const bodyStyles = new Set<string>();
    let airDrawn = 0;
    for (const def of DEFS) {
      const b = mk(def.id);
      const body = fakeCtx();
      drawBody(body.ctx, CAM, def, b, 700);
      for (const s of [...body.log.fillSet, ...body.log.strokeSet]) {
        bodyStyles.add(s);
        for (const a of smoke) expect(s.includes(a), `${def.id} Körper: ${s}`).toBe(false);
      }
      const air = fakeCtx();
      drawAir(air.ctx, CAM, def, b, 700);
      expect(air.log.strokeSet).toEqual([]);
      for (const s of air.log.fillSet) {
        airDrawn++;
        expect(
          smoke.some((a) => s.includes(a)),
          `${def.id} Luft: ${s}`,
        ).toBe(true);
      }
      // Körper setzt nur Kategorie-Töne
      const bc = bodyColors(def.category);
      for (const s of body.log.fillSet) expect([bc.left, bc.right, bc.top]).toContain(s);
    }
    expect(airDrawn).toBeGreaterThan(0); // Betriebe rauchen
    // nicht angebunden oder nicht in Betrieb: kein Rauch
    const weaver = BUILDING_DEFS.weaver;
    for (const extra of [{ connected: false }, { state: 'waitingInput' as const }]) {
      const air = fakeCtx();
      drawAir(air.ctx, CAM, weaver, mk('weaver', 10, 10, extra), 700);
      expect(air.log.fillSet).toEqual([]);
    }
  });
});
