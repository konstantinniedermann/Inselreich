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
import { PALETTE, SHADOW, rgbOfCss } from '../../src/render/palette';
import {
  AIR_COLORS,
  BODY_INSET,
  SHADOW_K,
  chimneyAnchor,
  CHIMNEY_OVER_ROOF,
  bodyColors,
  buildingShadow,
  drawAir,
  drawBody,
  drawGhost,
  wallColors,
} from '../../src/render/sprites';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building, BuildingDefId, Tier } from '../../src/sim/types';
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
const SLICE = new Set<BuildingDefId>(['house', 'kontor', 'lumberjack']);
const PLACEHOLDER = DEFS.filter((d) => !SLICE.has(d.id));
const house = (tier: Tier, x = 10, y = 10): Building =>
  mk('house', x, y, { house: { tier } as unknown as Building['house'] });
/** Die fünf Slice-Fälle: Wohnhaus Stufe 1–3, Kontor, Holzfäller. */
const SLICE_CASES: Building[] = [
  house(1),
  house(2),
  house(3),
  mk('kontor', 10, 10),
  mk('lumberjack', 10, 10),
];
const SIGNALS = [PALETTE.signalRed, PALETTE.signalYellow, PALETTE.signalWarn, PALETTE.signalOk];
const luma = (css: string): number => {
  const [r, g, b] = rgbOfCss(css);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

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
    for (const def of PLACEHOLDER) {
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
    for (const def of PLACEHOLDER) {
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
  it('RF-6a drawAir nur AIR_COLORS; drawBody ohne AIR_COLORS (Platzhalter)', () => {
    const smoke = [AIR_COLORS.smoke];
    const bodyStyles = new Set<string>();
    let airDrawn = 0;
    for (const def of PLACEHOLDER) {
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

describe('Slice-Körper: Wohnhaus (3 Stufen), Kontor, Holzfäller', () => {
  it('AK-ISO-10 Slice-Typen: jeder Körperpunkt in bodyHull (±0,5 px), Höhe ≤ H_MAX, Höhen laut Spec 7.1', () => {
    for (const b of SLICE_CASES) {
      const def = BUILDING_DEFS[b.defId];
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, b, 0);
      expect(log.allPoints.length).toBeGreaterThan(20);
      const hull = bodyHull(def, b);
      for (const p of log.allPoints)
        expect(inHull(hull, p.x, p.y, 0.5), `${def.id}${b.house?.tier ?? ''} ${p.x},${p.y}`).toBe(
          true,
        );
      expect(bodyHeight(def, b)).toBeLessThanOrEqual(H_MAX);
      const box = spriteBounds(def, b);
      for (const p of log.allPoints) {
        expect(p.x).toBeGreaterThanOrEqual(box.x - 0.5);
        expect(p.x).toBeLessThanOrEqual(box.x + box.w + 0.5);
        expect(p.y).toBeGreaterThanOrEqual(box.y - 0.5);
        expect(p.y).toBeLessThanOrEqual(box.y + box.h + 0.5);
      }
    }
    expect([1, 2, 3].map((t) => bodyHeight(BUILDING_DEFS.house, house(t as Tier)))).toEqual([
      0.8 * ISO_H,
      1.2 * ISO_H,
      1.6 * ISO_H,
    ]);
    expect(bodyHeight(BUILDING_DEFS.house, mk('house'))).toBe(0.8 * ISO_H); // ohne Hausdaten: Stufe 1
  });

  it('AK-ISO-10 umgekehrt: mit Höhe bodyHeight − 1 enthält die Hülle nicht alle Körperpunkte (Hülle oben dicht)', () => {
    for (const b of SLICE_CASES) {
      const def = BUILDING_DEFS[b.defId];
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, b, 0);
      const full = hullWithHeight(def.id, b, bodyHeight(def, b));
      const low = hullWithHeight(def.id, b, bodyHeight(def, b) - 1);
      expect(log.allPoints.every((p) => inHull(full, p.x, p.y, 0.5))).toBe(true);
      expect(
        log.allPoints.every((p) => inHull(low, p.x, p.y, 0.5)),
        `${def.id}${b.house?.tier ?? ''}`,
      ).toBe(false);
    }
  });

  it('N1 bodyHull(def, b) ist genau die Footprint-Raute mit der Raute um bodyHeight darüber (alle Typen, echte Höhen)', () => {
    const cases: Building[] = [...DEFS.map((d) => mk(d.id)), ...SLICE_CASES];
    for (const b of cases) {
      const def = BUILDING_DEFS[b.defId];
      expect(bodyHull(def, b), `${def.id}`).toEqual(hullWithHeight(def.id, b, bodyHeight(def, b)));
    }
  });

  it('ISO 7.1 Grundriss je Seite höchstens 0,1 Kachel eingezogen und ≥ 64 % der Raute; Wände links ≥ 1,1 × rechts', () => {
    expect(BODY_INSET).toBeLessThanOrEqual(0.1);
    for (const def of [BUILDING_DEFS.house, BUILDING_DEFS.kontor, BUILDING_DEFS.lumberjack])
      expect(
        ((def.w - 2 * BODY_INSET) * (def.h - 2 * BODY_INSET)) / (def.w * def.h),
      ).toBeGreaterThanOrEqual(0.64);
    for (const wall of [
      PALETTE.wallLime,
      PALETTE.wallStone,
      PALETTE.roofWood,
      PALETTE.wallTimber,
    ]) {
      const w = wallColors(wall);
      expect(luma(w.left)).toBeGreaterThanOrEqual(1.1 * luma(w.right));
    }
  });

  it('AK-R1-09 Körper samt Hof bedecken ≥ 80 % der Footprint-Raute', () => {
    for (const b of SLICE_CASES) {
      const def = BUILDING_DEFS[b.defId];
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, b, 0);
      const polys = log.events.filter((e) => e.op === 'fill').map((e) => e.points);
      const top = project(b.x, b.y),
        c = project(b.x + def.w / 2, b.y + def.h / 2);
      let n = 0,
        hit = 0;
      for (let i = 0; i < 40; i++)
        for (let j = 0; j < 40; j++) {
          const p = project(b.x + ((i + 0.5) / 40) * def.w, b.y + ((j + 0.5) / 40) * def.h);
          n++;
          if (
            polys.some(
              (poly) => inHull(poly, p.x, p.y, 0) || inHull([...poly].reverse(), p.x, p.y, 0),
            )
          )
            hit++;
        }
      expect(top.y).toBeLessThan(c.y);
      expect(hit / n, `${def.id}${b.house?.tier ?? ''}`).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('RF-6b Körper ohne AIR_COLORS und ohne SHADOW; Luft nur AIR_COLORS; AIR_COLORS sind eigene Töne', () => {
    const air = Object.values(AIR_COLORS);
    expect(new Set(air).size).toBe(air.length);
    const bodyStyles = new Set<string>();
    for (const b of [...SLICE_CASES, ...PLACEHOLDER.map((d) => mk(d.id))]) {
      const def = BUILDING_DEFS[b.defId];
      const body = fakeCtx();
      drawBody(body.ctx, CAM, def, b, 700);
      for (const st of [...body.log.fillSet, ...body.log.strokeSet]) {
        bodyStyles.add(st);
        expect(st).not.toBe(SHADOW);
        for (const a of air) expect(st.includes(a), `${def.id}: ${st}`).toBe(false);
        expect(SIGNALS).not.toContain(st);
      }
      const a = fakeCtx();
      drawAir(a.ctx, CAM, def, b, 700);
      expect(a.log.strokeSet).toEqual([]);
      for (const st of a.log.fillSet)
        expect(
          air.some((c) => st.includes(c)),
          `${def.id} Luft: ${st}`,
        ).toBe(true);
      expect(a.log.fillSet).not.toContain(SHADOW);
    }
    for (const c of air) for (const st of bodyStyles) expect(st.includes(c)).toBe(false);
    // Kontor-Flagge: Tuch und Stange
    const flag = fakeCtx();
    drawAir(flag.ctx, CAM, BUILDING_DEFS.kontor, mk('kontor'), 300);
    expect(flag.log.fillSet).toContain(AIR_COLORS.cloth);
    expect(flag.log.fillSet).toContain(AIR_COLORS.pole);
  });

  it('Spec 5.5 Kontor: Kaimauer an jeder Wasserseite, hintere zuerst; ohne Wasser keine Mauer, kein Fallback auf die Landseite', () => {
    const def = BUILDING_DEFS.kontor,
      b = mk('kontor');
    const mauer = wallColors(PALETTE.rockDark);
    const wall = wallColors(PALETTE.wallStone).left;
    const run = (env?: {
      waterLeft?: boolean;
      waterRight?: boolean;
      waterU0?: boolean;
      waterV0?: boolean;
    }) => {
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, b, 0, env);
      for (const p of log.allPoints) expect(inHull(bodyHull(def, b), p.x, p.y, 0.5)).toBe(true);
      const f = log.fillSet;
      const idx = f
        .map((c, i) => (c === mauer.left || c === mauer.right ? i : -1))
        .filter((i) => i >= 0);
      return { idx, shell: f.indexOf(wall) };
    };
    expect(run().idx).toHaveLength(0);
    expect(run({}).idx).toHaveLength(0);
    const front = run({ waterRight: true });
    expect(front.idx.length).toBeGreaterThan(0);
    for (const i of front.idx) expect(i).toBeGreaterThan(front.shell);
    expect(run({ waterLeft: true }).idx.length).toBeGreaterThan(0);
    for (const env of [{ waterU0: true }, { waterV0: true }]) {
      const back = run(env);
      expect(back.idx.length, JSON.stringify(env)).toBeGreaterThan(0);
      for (const i of back.idx) expect(i).toBeLessThan(back.shell); // der Körper überdeckt sie
    }
  });

  it('Kamine: Oberkante höchstens 0,15 · ISO_H über dem Dach; Rauch steigt am Kamin auf', () => {
    expect(CHIMNEY_OVER_ROOF).toBeLessThanOrEqual(0.15 * ISO_H);
    const def = BUILDING_DEFS.lumberjack,
      b = mk('lumberjack');
    const anchor = chimneyAnchor(def, b, CAM)!;
    expect(anchor).not.toBeNull();
    const box = spriteBounds(def, b);
    for (const t of [0, 400, 900, 1300]) {
      const { ctx, log } = fakeCtx();
      drawAir(ctx, CAM, def, b, t);
      expect(log.allPoints.length % 4).toBe(0);
      for (let i = 0; i < log.allPoints.length; i += 4) {
        const q = log.allPoints.slice(i, i + 4);
        const cx = (q[0]!.x + q[1]!.x) / 2,
          cy = (q[2]!.y + q[3]!.y) / 2;
        expect(Math.abs(cx - anchor.x)).toBeLessThanOrEqual(0.04 * box.w + 0.01);
        expect(cy).toBeLessThanOrEqual(anchor.y + 0.01);
        expect(cy).toBeGreaterThanOrEqual(anchor.y - 0.3 * box.h - 0.01);
      }
    }
  });

  it('ISO 7.1 abgeleitete Töne bleiben Töne: wallColors akzeptiert auch gemischte rgb()-Farben, kein Slice-Körper füllt schwarz', () => {
    expect(luma(wallColors('rgb(200,180,150)').right)).toBeGreaterThan(100);
    for (const b of SLICE_CASES) {
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, BUILDING_DEFS[b.defId], b, 0);
      for (const c of log.fillSet)
        expect(luma(c), `${b.defId}${b.house?.tier ?? ''}: ${c}`).toBeGreaterThan(25);
    }
  });

  it('Spec 5.5 Holzfäller: Sägemehlfleck in sandDry-Ton; Wohnhaus Stufe 1 Stroh, 2 Terrakotta, 3 dunkler Ziegel', () => {
    const styles = (b: Building): string[] => {
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, BUILDING_DEFS[b.defId], b, 0);
      return log.fillSet;
    };
    const near = (a: string, hex: string): boolean => {
      const x = rgbOfCss(a),
        y = rgbOfCss(hex);
      return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 45;
    };
    expect(styles(mk('lumberjack')).some((c) => near(c, PALETTE.sandDry))).toBe(true);
    expect(styles(house(1)).some((c) => near(c, PALETTE.roofThatch))).toBe(true);
    expect(styles(house(2)).some((c) => near(c, PALETTE.roofTerracotta))).toBe(true);
    expect(styles(house(2)).some((c) => near(c, PALETTE.wallTimber))).toBe(true); // Fachwerk
    expect(styles(house(3)).some((c) => near(c, PALETTE.roofTerracottaDark))).toBe(true);
    expect(styles(house(3)).some((c) => near(c, PALETTE.wallStone))).toBe(true);
  });
});

describe('Schatten und Bauvorschau', () => {
  const area = (pts: P[]): number =>
    pts.reduce(
      (s, p, i) => s + (p.x * pts[(i + 1) % pts.length]!.y - pts[(i + 1) % pts.length]!.x * p.y),
      0,
    ) / 2;
  const convex = (pts: P[]): boolean => {
    const sign = Math.sign(area(pts));
    return pts.every((p, i) => {
      const q = pts[(i + 1) % pts.length]!,
        r = pts[(i + 2) % pts.length]!;
      return Math.sign((q.x - p.x) * (r.y - q.y) - (q.y - p.y) * (r.x - q.x)) * sign >= 0;
    });
  };

  it('RF-6b buildingShadow ist rein: konvexes Polygon im Kachelraum, gleiche Orientierung, nach (+3, +1) versetzt', () => {
    for (const b of SLICE_CASES) {
      const def = BUILDING_DEFS[b.defId];
      const poly = buildingShadow(def, b);
      expect(poly.length).toBeGreaterThanOrEqual(4);
      expect(convex(poly)).toBe(true);
      expect(area(poly)).toBeGreaterThan(0); // alle Schatten gleich herum (ein Pfad, nonzero)
      const dir = { x: 3 / Math.sqrt(10), y: 1 / Math.sqrt(10) };
      const along = (p: P): number => p.x * dir.x + p.y * dir.y;
      const fpMax = Math.max(
        ...[
          [b.x, b.y],
          [b.x + def.w, b.y],
          [b.x + def.w, b.y + def.h],
          [b.x, b.y + def.h],
        ].map(([x, y]) => along({ x: x!, y: y! })),
      );
      const shift = (SHADOW_K * bodyHeight(def, b)) / ISO_H;
      const polyMax = Math.max(...poly.map(along));
      expect(polyMax).toBeCloseTo(fpMax - (dir.x + dir.y) * BODY_INSET + shift, 6);
      for (const p of poly) {
        expect(p.x).toBeGreaterThanOrEqual(b.x);
        expect(p.x).toBeLessThanOrEqual(b.x + def.w + shift + 1e-9);
      }
    }
    expect(SHADOW_K).toBe(0.4);
  });

  it('D-13 drawGhost: Deckkraft 0,5 in save/restore, alles in der Körperhülle, danach wieder Deckkraft 1', () => {
    for (const def of DEFS) {
      const { ctx, log } = fakeCtx();
      drawGhost(ctx, CAM, def, 12, 9);
      expect(log.alphaSet).toContain(0.5);
      expect(log.globalAlpha).toBe(1);
      expect(log.saves).toBe(log.restores);
      const b = mk(def.id, 12, 9);
      expect(log.events.filter((e) => e.op === 'fill').every((e) => e.alpha === 0.5)).toBe(true);
      for (const p of log.allPoints) expect(inHull(bodyHull(def, b), p.x, p.y, 0.5)).toBe(true);
    }
  });
});
