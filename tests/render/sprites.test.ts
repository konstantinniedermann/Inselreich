import { describe, expect, it } from 'vitest';
import {
  BODY_HEIGHTS,
  H_MAX,
  H_TOWER,
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
  buildingShadow,
  drawAir,
  drawBody,
  drawGhost,
  drawRoads,
  hearthAnchor,
  lightAnchors,
  roadCenter,
  wallColors,
  wallPolygon,
  SILHOUETTES,
  FALLBACKS,
  LAMP,
  WINDOW,
  type LightAnchor,
} from '../../src/render/sprites';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { LEVELS } from '../../src/sim/defs/levels';
import { serialize } from '../../src/sim/save';
import type { Building, BuildingDefId, Tier } from '../../src/sim/types';
import { createWorld, idx } from '../../src/sim/world';
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
const OTHERS = DEFS.filter((d) => !SLICE.has(d.id));
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

describe('Übrige Typen als Körper (R2)', () => {
  it('AK-ISO-10 übrige Typen: jeder Pfadpunkt in bodyHull (±0,5 px), Höhe ≤ H_MAX, Kapelle ≤ H_TOWER', () => {
    for (const def of OTHERS) {
      const b = mk(def.id);
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, b, 0);
      expect(log.allPoints.length).toBeGreaterThan(8);
      const hull = bodyHull(def, b);
      for (const p of log.allPoints) expect(inHull(hull, p.x, p.y, 0.5), `${def.id}`).toBe(true);
      expect(bodyHeight(def, b)).toBeLessThanOrEqual(def.id === 'chapel' ? H_TOWER : H_MAX);
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
      // Das Firstende sitzt bei Hallen entlang u in der Tiefe vm ≤ 1 Kachel; dichter prüft der Test „umgekehrt“
      expect(Math.min(...ys), def.id).toBeLessThanOrEqual(top.y - bodyHeight(def, b) + 0.5 * ISO_H);
    }
  });

  it('AK-ISO-10 umgekehrt (QA-Hinweis a): die Hülle ist oben dicht — mit Höhe bodyHeight − 1 enthält sie nicht alle Körperpunkte', () => {
    for (const def of OTHERS) {
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
  it('RF-6a drawAir nur AIR_COLORS; drawBody ohne AIR_COLORS (übrige Typen)', () => {
    const smoke = [AIR_COLORS.smoke];
    const bodyStyles = new Set<string>();
    let airDrawn = 0;
    for (const def of OTHERS) {
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
    for (const b of [...SLICE_CASES, ...OTHERS.map((d) => mk(d.id))]) {
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

describe('R2: Silhouetten-Tabelle, Kategorie-Fallback, Fensteranker, Erdwege', () => {
  /** Unbekannte Ids je Kategorie und Grösse (die Feuerwache nutzt bis R2-FW diesen Weg). */
  const fallbackDefs = (['housing', 'production', 'public', 'infrastructure'] as const).flatMap(
    (category) =>
      [
        { ...BUILDING_DEFS.house, w: 1, h: 1 },
        { ...BUILDING_DEFS.chapel, w: 2, h: 2 },
      ].map((d) => ({ ...d, id: 'unbekannt' as never, category })),
  );
  const unknown = (def: (typeof fallbackDefs)[number]): Building => ({
    ...mk('house'),
    defId: def.id,
  });

  it('AK-R1-04 Amtsstube zeichnet eine eigene Form, nicht den public-Rückfall', () => {
    // gleicher Footprint (2 × 2) und gleicher Standort: nur die Silhouette darf den Unterschied machen
    const pub = fallbackDefs.find((d) => d.category === 'public' && d.w === 2)!;
    const drawLog = (
      def: (typeof fallbackDefs)[number] | typeof BUILDING_DEFS.townhall,
      b: Building,
    ) => {
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def as never, b, 0);
      return log.events;
    };
    expect(drawLog(BUILDING_DEFS.townhall, mk('townhall'))).not.toEqual(drawLog(pub, unknown(pub)));
  });

  it('AK-R2-03 jede heutige BuildingDefId hat eine eigene Silhouette (M11 S2)', () => {
    for (const id of Object.keys(BUILDING_DEFS))
      expect(SILHOUETTES[id as keyof typeof SILHOUETTES], id).toBeDefined();
  });

  it('AK-R2-03 unbekannte Id zeichnet den Kategorie-Fallback ohne Fehler und in der Hülle', () => {
    for (const def of fallbackDefs) {
      const b = unknown(def);
      const { ctx, log } = fakeCtx();
      expect(() => drawBody(ctx, CAM, def, b, 0), def.category).not.toThrow();
      expect(log.allPoints.length).toBeGreaterThan(20);
      const hullOfDef = bodyHull(def, b);
      for (const p of log.allPoints)
        expect(inHull(hullOfDef, p.x, p.y, 0.5), `${def.category} ${def.w}x${def.h}`).toBe(true);
      expect(bodyHeight(def, b)).toBeLessThanOrEqual(H_MAX);
    }
  });

  it('AK-ISO-10 Fallback umgekehrt: mit Höhe bodyHeight − 1 enthält die Hülle nicht alle Körperpunkte', () => {
    for (const def of fallbackDefs) {
      const b = unknown(def);
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, b, 0);
      const h = bodyHeight(def, b);
      const t = project(b.x, b.y),
        r = project(b.x + def.w, b.y),
        bo = project(b.x + def.w, b.y + def.h),
        l = project(b.x, b.y + def.h);
      const up = (q: P): P => ({ x: q.x, y: q.y - (h - 1) });
      const low = [up(t), up(r), r, bo, l, up(l)];
      expect(
        log.allPoints.every((q) => inHull(low, q.x, q.y, 0.5)),
        `${def.category} ${def.w}x${def.h}`,
      ).toBe(false);
    }
  });

  it('Spec 5.5 Fallback trägt die Dachfamilie der Kategorie; Öffentlich mit Glockenstuhl (Schiefer + Holz im Aufbau)', () => {
    const near = (a: string, hex: string): boolean => {
      const x = rgbOfCss(a),
        y = rgbOfCss(hex);
      return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 45;
    };
    const family: Record<string, string> = {
      housing: PALETTE.roofThatch,
      production: PALETTE.roofWood,
      public: PALETTE.roofSlate,
      infrastructure: PALETTE.roofTimber,
    };
    for (const def of fallbackDefs) {
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, unknown(def), 0);
      expect(
        log.fillSet.some((c) => near(c, family[def.category]!)),
        def.category,
      ).toBe(true);
    }
    const pub = fakeCtx();
    drawBody(pub.ctx, CAM, fallbackDefs[4]!, unknown(fallbackDefs[4]!), 0);
    expect(pub.log.fillSet.some((c) => near(c, PALETTE.wallTimber))).toBe(true); // Glockenstuhl
  });

  it('AK-ISO-10 Kapelle: Glockenturm, Spitze genau auf der Hüllenkante und höher als 2,3 · ISO_H, nicht über H_TOWER', () => {
    const chapel = BUILDING_DEFS.chapel,
      cb = mk('chapel');
    const { ctx, log } = fakeCtx();
    drawBody(ctx, CAM, chapel, cb, 0);
    const minY = Math.min(...log.allPoints.map((q) => q.y));
    expect(minY).toBeCloseTo(project(cb.x, cb.y).y - bodyHeight(chapel, cb), 6);
    // Spitze über ihrem Fusspunkt im Turm (Mitte des Turm-Grundrisses)
    const foot = project(cb.x + 0.35, cb.y + 0.35).y;
    expect(foot - minY).toBeGreaterThan(2.3 * ISO_H);
    expect(foot - minY).toBeLessThanOrEqual(H_TOWER);
  });

  it('AK-R2-03 (ISO) jeder Fensteranker liegt in bodyHull und ganz auf seiner Wand', () => {
    const cases: [Parameters<typeof lightAnchors>[0], Building][] = [
      ...DEFS.map((d) => [d, mk(d.id)] as [(typeof DEFS)[number], Building]),
      ...[1, 2, 3].map(
        (t) => [BUILDING_DEFS.house, house(t as Tier)] as [(typeof DEFS)[number], Building],
      ),
      ...fallbackDefs.map((d) => [d, unknown(d)] as [(typeof DEFS)[number], Building]),
    ];
    let total = 0;
    for (const [def, b] of cases) {
      const box = spriteBounds(def, b);
      const hull = bodyHull(def, b);
      for (const a of lightAnchors(def, b)) {
        total++;
        expect(a.w, `${def.id} Breite`).toBeGreaterThan(0);
        expect(a.h, `${def.id} Höhe`).toBeGreaterThan(0);
        const wall = wallPolygon(def, b, a.wall, a.plane);
        const x0 = box.x + a.x * box.w,
          y0 = box.y + a.y * box.h;
        for (const [x, y] of [
          [x0, y0],
          [x0 + a.w * box.w, y0],
          [x0 + a.w * box.w, y0 + a.h * box.h],
          [x0, y0 + a.h * box.h],
        ] as const) {
          expect(inHull(wall, x, y, 1e-6), `${def.id} ${a.wall} Wand`).toBe(true);
          expect(inHull(hull, x, y, 1e-6), `${def.id} Hülle`).toBe(true);
        }
      }
    }
    expect(total).toBeGreaterThan(20);
  });

  it('AK-R2-03 (ISO) Fensteranker und gezeichnete Fensterfüllungen stimmen überein (beide Richtungen)', () => {
    const glass = new Set([WINDOW, LAMP, wallColors(LAMP).left]);
    // Fenster ausserhalb der Wandanker: Gaube (Bürgerhaus), Schallöffnungen von Dachreiter und Turm (Kapelle, Schule, öffentlicher Fallback)
    const roofOnly: Record<string, number> = {
      house3: 1,
      chapel: 2,
      school: 2,
      firestation: 2,
      townhall: 2, // Rückfall public (M10-S2, T-12)
      'fallback public 1': 2,
      'fallback public 2': 2,
    };
    const area = (q: P[]): number =>
      q.reduce((a, p, i) => a + p.x * q[(i + 1) % q.length]!.y - q[(i + 1) % q.length]!.x * p.y, 0);
    const cases: [string, (typeof DEFS)[number], Building][] = [
      ...DEFS.filter((d) => d.id !== 'house').map((d) => [d.id, d, mk(d.id)] as never),
      ...([1, 2, 3] as Tier[]).map((t) => [`house${t}`, BUILDING_DEFS.house, house(t)] as never),
      ...fallbackDefs.map((d) => [`fallback ${d.category} ${d.w}`, d, unknown(d)] as never),
    ];
    for (const [name, def, b] of cases) {
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, b, 0);
      const quads = log.events
        .filter((e) => e.op === 'fill' && glass.has(e.style) && e.points.length === 4)
        .map((e) => (area(e.points) < 0 ? [...e.points].reverse() : e.points));
      const box = spriteBounds(def, b);
      const anchors = lightAnchors(def, b);
      const used = new Set<number>();
      for (const a of anchors) {
        const x0 = box.x + a.x * box.w,
          x1 = x0 + a.w * box.w,
          y0 = box.y + a.y * box.h,
          y1 = y0 + a.h * box.h;
        const k = quads.findIndex(
          (q) =>
            Math.abs(Math.min(...q.map((p) => p.x)) - x0) < 0.5 &&
            Math.abs(Math.max(...q.map((p) => p.x)) - x1) < 0.5 &&
            [
              [x0, y0],
              [x1, y0],
              [x1, y1],
              [x0, y1],
            ].every(([x, y]) => inHull(q, x!, y!, 0.5)),
        );
        expect(k, `${name}: Anker ${a.wall} ohne gezeichnetes Fenster`).toBeGreaterThanOrEqual(0);
        used.add(k);
      }
      expect(quads.length - used.size, `${name}: Fenster ohne Anker`).toBe(roofOnly[name] ?? 0);
    }
  });

  it('AK-ISO-10 Feuerwache: Glockenstuhl, Spitze genau auf der Hüllenkante, höher als ihr Dach, nicht über H_TOWER; zwei Fensteranker', () => {
    const def = BUILDING_DEFS.firestation,
      fb = mk('firestation');
    const { ctx, log } = fakeCtx();
    drawBody(ctx, CAM, def, fb, 0);
    const minY = Math.min(...log.allPoints.map((q) => q.y));
    expect(minY).toBeCloseTo(project(fb.x, fb.y).y - bodyHeight(def, fb), 6);
    expect(bodyHeight(def, fb)).toBeLessThanOrEqual(H_TOWER);
    expect(bodyHeight(def, fb)).toBeGreaterThan(1.5 * ISO_H);
    expect(lightAnchors(def, fb).filter((a) => !a.always)).toHaveLength(2);
  });

  it('Spec 5.6 hearthAnchor: Kaminmündung der Häuser liegt in bodyHull, über dem Dach; andere Typen keinen', () => {
    for (const t of [1, 2, 3] as Tier[]) {
      const b = house(t),
        def = BUILDING_DEFS.house;
      const a = hearthAnchor(def, b, CAM)!;
      expect(a, `Stufe ${t}`).not.toBeNull();
      expect(inHull(bodyHull(def, b), a.x, a.y, 0.5), `Stufe ${t}`).toBe(true);
      // dort steht der Kamin: ein gezeichneter Punkt liegt (fast) an der Mündung
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, b, 0);
      expect(
        log.allPoints.some((p) => Math.abs(p.x - a.x) < 4 && Math.abs(p.y - a.y) < 0.5),
        `Stufe ${t} Kaminkante`,
      ).toBe(true);
    }
    for (const d of DEFS) if (d.id !== 'house') expect(hearthAnchor(d, mk(d.id), CAM)).toBeNull();
  });

  it('Spec 6.2 Laternen: Kontor und Marktplatz haben einen Anker mit always, sonst keiner', () => {
    const always = (id: BuildingDefId): LightAnchor[] =>
      lightAnchors(BUILDING_DEFS[id], mk(id)).filter((a) => a.always);
    expect(always('kontor')).toHaveLength(1);
    expect(always('market')).toHaveLength(1);
    for (const d of DEFS)
      if (d.id !== 'kontor' && d.id !== 'market') expect(always(d.id), d.id).toHaveLength(0);
    for (const d of DEFS) expect(lightAnchors(d, mk(d.id)).length, d.id).toBeGreaterThan(0);
  });

  it('RF-6c drawAir nur AIR_COLORS, drawBody ohne AIR_COLORS und SHADOW (alle Typen, Fallback)', () => {
    const air = Object.values(AIR_COLORS);
    const all: [(typeof DEFS)[number], Building][] = [
      ...DEFS.map((d) => [d, mk(d.id)] as [(typeof DEFS)[number], Building]),
      ...fallbackDefs.map((d) => [d, unknown(d)] as [(typeof DEFS)[number], Building]),
    ];
    for (const [def, b] of all) {
      const body = fakeCtx();
      drawBody(body.ctx, CAM, def, b, 700);
      for (const st of [...body.log.fillSet, ...body.log.strokeSet]) {
        expect(st).not.toBe(SHADOW);
        for (const a of air) expect(st.includes(a), `${def.id}: ${st}`).toBe(false);
      }
      const a = fakeCtx();
      drawAir(a.ctx, CAM, def, b, 700);
      expect(a.log.strokeSet).toEqual([]);
      for (const st of a.log.fillSet)
        expect(
          air.some((c) => st.includes(c)),
          `${def.id} Luft: ${st}`,
        ).toBe(true);
    }
  });

  it('Spec 4.3.2 keine Signalfarbe in Silhouetten und Wegen; kein Körper füllt schwarz', () => {
    const styles: string[] = [];
    for (const d of DEFS) {
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, d, mk(d.id), 0);
      styles.push(...log.fillSet, ...log.strokeSet);
      for (const c of log.fillSet) expect(luma(c), `${d.id}: ${c}`).toBeGreaterThan(25);
    }
    for (const d of fallbackDefs) {
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, d, unknown(d), 0);
      styles.push(...log.fillSet, ...log.strokeSet);
    }
    const w = roadWorld([
      [3, 3],
      [4, 3],
      [4, 4],
      [8, 8],
    ]);
    const road = fakeCtx();
    drawRoads(road.ctx, w, { x0: 0, y0: 0, x1: 15, y1: 15 });
    styles.push(...road.log.fillSet, ...road.log.strokeSet);
    expect(styles.length).toBeGreaterThan(100);
    for (const s of styles) expect(SIGNALS, s).not.toContain(s);
  });

  it('Spec 5.5 Marktplatz: gestreifte Sonnendächer in roofTimber und wallLime; Wohnhaus ist weiter 1×1', () => {
    const { ctx, log } = fakeCtx();
    drawBody(ctx, CAM, BUILDING_DEFS.market, mk('market'), 0);
    const near = (a: string, hex: string): boolean => {
      const x = rgbOfCss(a),
        y = rgbOfCss(hex);
      return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 45;
    };
    expect(log.fillSet.some((c) => near(c, PALETTE.roofTimber))).toBe(true);
    expect(log.fillSet.some((c) => near(c, PALETTE.wallLime))).toBe(true);
    expect([BUILDING_DEFS.house.w, BUILDING_DEFS.house.h]).toEqual([1, 1]);
  });

  it('Spec 5.5 Schäferei: helle Schafpunkte im eigenen Körper-Aufruf (nicht in der Luft)', () => {
    const { ctx, log } = fakeCtx();
    drawBody(ctx, CAM, BUILDING_DEFS.sheepfarm, mk('sheepfarm'), 0);
    const light = log.fillSet.filter((c) => luma(c) > 200);
    expect(light.length).toBeGreaterThan(0);
  });

  it('AK-R1-09 (ISO) Körper samt Hof bedecken ≥ 80 % der Footprint-Raute (übrige Typen und Fallback)', () => {
    const all: [(typeof DEFS)[number], Building][] = [
      ...OTHERS.map((d) => [d, mk(d.id)] as [(typeof DEFS)[number], Building]),
      ...fallbackDefs.map((d) => [d, unknown(d)] as [(typeof DEFS)[number], Building]),
    ];
    for (const [def, b] of all) {
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, def, b, 0);
      const polys = log.events.filter((e) => e.op === 'fill').map((e) => e.points);
      let n = 0,
        hit = 0;
      for (let i = 0; i < 30; i++)
        for (let j = 0; j < 30; j++) {
          const q = project(b.x + ((i + 0.5) / 30) * def.w, b.y + ((j + 0.5) / 30) * def.h);
          n++;
          if (polys.some((pl) => inHull(pl, q.x, q.y, 0) || inHull([...pl].reverse(), q.x, q.y, 0)))
            hit++;
        }
      expect(hit / n, `${def.id} ${def.category}`).toBeGreaterThanOrEqual(0.8);
    }
  });

  it('Kamine: Rauchanker für Brennerei und Werkzeugmacher liegt über dem Dach in der Hülle', () => {
    for (const id of ['distillery', 'toolmaker', 'lumberjack'] as const) {
      const def = BUILDING_DEFS[id],
        b = mk(id);
      const a = chimneyAnchor(def, b, CAM)!;
      expect(a, id).not.toBeNull();
      expect(inHull(bodyHull(def, b), a.x, a.y, 0.5), id).toBe(true);
    }
    expect(chimneyAnchor(BUILDING_DEFS.market, mk('market'), CAM)).toBeNull();
  });

  // --- Erdwege (Spec 5.4, ISO §6): Aufruf im Kachelraum unter der Bodenmatrix ---
  function roadWorld(tiles: [number, number][]) {
    const w = createWorld(3);
    for (const t of w.tiles) t.road = false;
    for (const [x, y] of tiles) w.tiles[idx(w, x, y)]!.road = true;
    return w;
  }
  function recordWidths(ctx: CanvasRenderingContext2D): {
    widths: number[];
    caps: string[];
    ctx: CanvasRenderingContext2D;
  } {
    const widths: number[] = [],
      caps: string[] = [];
    const proxy = new Proxy(ctx, {
      set(t, k, v) {
        if (k === 'lineWidth') widths.push(v as number);
        if (k === 'lineCap' || k === 'lineJoin') caps.push(String(v));
        return Reflect.set(t, k, v);
      },
      get(t, k) {
        const v: unknown = Reflect.get(t, k);
        return typeof v === 'function' ? (v as (...a: unknown[]) => unknown).bind(t) : v;
      },
    });
    return { widths, caps, ctx: proxy };
  }

  it('AK-R2-04 Erdpfad: zwei Striche earthEdge 0,62 und earth 0,5 Kachel, runde Enden, Steinchen in rockLight', () => {
    const w = roadWorld([
      [5, 5],
      [6, 5],
      [7, 5],
    ]);
    const { ctx, log } = fakeCtx();
    const rec = recordWidths(ctx);
    drawRoads(rec.ctx, w, { x0: 0, y0: 0, x1: 15, y1: 15 });
    const strokes = log.events.filter((e) => e.op === 'stroke');
    expect(strokes.map((e) => e.style)).toEqual([PALETTE.earthEdge, PALETTE.earth]);
    expect(rec.widths.slice(0, 2)).toEqual([0.62, 0.5]);
    expect(rec.caps).toContain('round');
    expect(rec.caps.filter((c) => c === 'round').length).toBeGreaterThanOrEqual(2);
    // einheitlich im Kachelraum: Punkte liegen nahe den Kachelmitten (Rauschen ≤ ±0,04)
    for (const q of strokes[0]!.points) {
      expect(Math.abs((q.x % 1) - 0.5)).toBeLessThanOrEqual(0.04 + 1e-9);
      expect(Math.abs((q.y % 1) - 0.5)).toBeLessThanOrEqual(0.04 + 1e-9);
    }
  });

  it('AK-R2-04 Nähte lückenlos: jedes Nachbarpaar (Ost, Süd) hat ein Segment, Enden teilen den Mittelpunkt', () => {
    const tiles: [number, number][] = [
      [5, 5],
      [6, 5],
      [7, 5],
      [7, 6],
      [7, 7],
      [6, 7],
    ];
    const w = roadWorld(tiles);
    const { ctx, log } = fakeCtx();
    drawRoads(ctx, w, { x0: 0, y0: 0, x1: 15, y1: 15 });
    const pts = log.events.find((e) => e.op === 'stroke')!.points;
    // Pfad besteht aus (moveTo, lineTo)-Paaren
    expect(pts.length % 2).toBe(0);
    const segs: (readonly [P, P])[] = [];
    for (let i = 0; i < pts.length; i += 2) segs.push([pts[i]!, pts[i + 1]!] as const);
    expect(segs).toHaveLength(5); // (5,5)-(6,5), (6,5)-(7,5), (7,5)-(7,6), (7,6)-(7,7), (7,7)-(6,7)
    const centers = new Map(tiles.map(([x, y]) => [`${x},${y}`, roadCenter(w.seed, x, y)]));
    const has = (a: P, b: P): boolean =>
      segs.some(
        ([p, q]) =>
          (Math.hypot(p.x - a.x, p.y - a.y) < 1e-9 && Math.hypot(q.x - b.x, q.y - b.y) < 1e-9) ||
          (Math.hypot(q.x - a.x, q.y - a.y) < 1e-9 && Math.hypot(p.x - b.x, p.y - b.y) < 1e-9),
      );
    for (const [ax, ay] of tiles)
      for (const [bx, by] of tiles)
        if ((bx === ax + 1 && by === ay) || (bx === ax && by === ay + 1))
          expect(
            has(centers.get(`${ax},${ay}`)!, centers.get(`${bx},${by}`)!),
            `${ax},${ay}-${bx},${by}`,
          ).toBe(true);
  });

  it('AK-R2-04 einzelne Wegkachel ohne Nachbar ist ein Kreis; Kante pro Tile deterministisch; Rauschen ≤ ±0,04', () => {
    const w = roadWorld([[8, 8]]);
    const { ctx, log } = fakeCtx();
    drawRoads(ctx, w, { x0: 0, y0: 0, x1: 15, y1: 15 });
    expect(log.events.some((e) => e.op === 'fill' && e.style === PALETTE.earthEdge)).toBe(true);
    expect(log.events.some((e) => e.op === 'fill' && e.style === PALETTE.earth)).toBe(true);
    for (let x = 0; x < 20; x++)
      for (let y = 0; y < 20; y++) {
        const c = roadCenter(7, x, y);
        expect(Math.abs(c.x - x - 0.5)).toBeLessThanOrEqual(0.04 + 1e-12);
        expect(Math.abs(c.y - y - 0.5)).toBeLessThanOrEqual(0.04 + 1e-12);
        expect(roadCenter(7, x, y)).toEqual(c);
      }
    // ohne Wege nichts gezeichnet
    const empty = fakeCtx();
    drawRoads(empty.ctx, roadWorld([]), { x0: 0, y0: 0, x1: 15, y1: 15 });
    expect(empty.log.events).toEqual([]);
  });
});

describe('M8 Render-Mindestpflicht (AK-S1-17)', () => {
  it('AK-S1-17 Kaufmannshaus: Höhe endlich und ungleich Stufe 3; Badehaus hat einen Silhouetten-Eintrag und zeichnet in der Hülle', () => {
    const h4 = bodyHeight(BUILDING_DEFS.house, house(4));
    expect(Number.isFinite(h4)).toBe(true);
    expect(h4).not.toBe(bodyHeight(BUILDING_DEFS.house, house(3)));
    expect(() => drawBody(fakeCtx().ctx, CAM, BUILDING_DEFS.house, house(4), 0)).not.toThrow();
    expect(SILHOUETTES.bathhouse).toBeDefined();
    const bath = mk('bathhouse');
    const { ctx, log } = fakeCtx();
    drawBody(ctx, CAM, BUILDING_DEFS.bathhouse, bath, 0);
    const hull = bodyHull(BUILDING_DEFS.bathhouse, bath);
    for (const p of log.allPoints) expect(inHull(hull, p.x, p.y, 0.5)).toBe(true);
  });
});

describe('M8 Render-Rückfall Glashütte (AK-S2-17)', () => {
  it('AK-S2-17 Glashütte hat einen Silhouetten-Eintrag und zeichnet in der Hülle', () => {
    expect(SILHOUETTES.glassworks).toBeDefined();
    const gw = mk('glassworks');
    const { ctx, log } = fakeCtx();
    drawBody(ctx, CAM, BUILDING_DEFS.glassworks, gw, 0);
    expect(log.allPoints.length).toBeGreaterThan(20);
    const hull = bodyHull(BUILDING_DEFS.glassworks, gw);
    for (const p of log.allPoints) expect(inHull(hull, p.x, p.y, 0.5)).toBe(true);
  });
});

describe('M10 Rückfall Amtsstube', () => {
  it('AK-S2-15 SILHOUETTES.townhall definiert (Rückfall public)', () => {
    expect(SILHOUETTES.townhall).toBeDefined();
  });
});

describe('M8 R1 Silhouetten', () => {
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
  const roof = (css: string): boolean => near(css, PALETTE.roofCopper);

  it('AK-R1-01 Kaufmannshaus: eigener Dachwert, eigene endliche Höhe', () => {
    expect(styles(house(4)).some(roof)).toBe(true);
    // H-R10: Fachwerk liegt mit warmem Licht näher an roofTerracottaDark als zuvor; der Dachton selbst bleibt fern (< 30)
    const d30 = (a: string): boolean => {
      const x = rgbOfCss(a),
        y = rgbOfCss(PALETTE.roofTerracottaDark);
      return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]) < 30;
    };
    expect(styles(house(4)).some(d30)).toBe(false);
    for (const t of [1, 2, 3] as Tier[])
      expect(styles(house(t)).some(roof), `Stufe ${t}`).toBe(false);
    const h4 = bodyHeight(BUILDING_DEFS.house, house(4));
    expect(Number.isFinite(h4)).toBe(true);
    expect(h4).not.toBe(bodyHeight(BUILDING_DEFS.house, house(3)));
  });

  it('AK-R1-01 Wohnhaus-Höhen steigen streng über die Stufen 1 bis 4, Stufe 4 unter H_TOWER', () => {
    const hs = ([1, 2, 3, 4] as Tier[]).map((t) => bodyHeight(BUILDING_DEFS.house, house(t)));
    for (let i = 1; i < hs.length; i++) expect(hs[i]!).toBeGreaterThan(hs[i - 1]!);
    expect(hs[3]).toBeLessThan(H_TOWER);
  });

  it('AK-R1-01 Kaufmannshaus zeichnet in der Hülle; mindestens so viele Fensteranker wie Stufe 3; Herdrauch-Mündung vorhanden', () => {
    const b = house(4);
    const { ctx, log } = fakeCtx();
    drawBody(ctx, CAM, BUILDING_DEFS.house, b, 0);
    const hull = bodyHull(BUILDING_DEFS.house, b);
    for (const p of log.allPoints) expect(inHull(hull, p.x, p.y, 0.5)).toBe(true);
    expect(lightAnchors(BUILDING_DEFS.house, b).length).toBeGreaterThanOrEqual(
      lightAnchors(BUILDING_DEFS.house, house(3)).length,
    );
    const a = hearthAnchor(BUILDING_DEFS.house, b, CAM);
    expect(a).not.toBeNull();
    expect(inHull(hull, a!.x, a!.y, 0.5)).toBe(true);
  });

  it('AK-R1-01 Kaufmannshaus: jeder Fensteranker liegt auf seiner Wand und in bodyHull; Anker und gezeichnete Fenster stimmen überein', () => {
    const def = BUILDING_DEFS.house,
      b = house(4);
    const box = spriteBounds(def, b);
    const hull = bodyHull(def, b);
    const anchors = lightAnchors(def, b);
    expect(anchors.length).toBeGreaterThan(10);
    const rect = (a: LightAnchor): [number, number][] => {
      const x0 = box.x + a.x * box.w,
        y0 = box.y + a.y * box.h;
      return [
        [x0, y0],
        [x0 + a.w * box.w, y0],
        [x0 + a.w * box.w, y0 + a.h * box.h],
        [x0, y0 + a.h * box.h],
      ];
    };
    for (const a of anchors) {
      expect(a.w).toBeGreaterThan(0);
      expect(a.h).toBeGreaterThan(0);
      const wall = wallPolygon(def, b, a.wall, a.plane);
      for (const [x, y] of rect(a)) {
        expect(inHull(wall, x, y, 1e-6), `${a.wall} Wand`).toBe(true);
        expect(inHull(hull, x, y, 1e-6), 'Hülle').toBe(true);
      }
    }
    // Gezeichnete Fensterfüllungen (WINDOW-Farbe) gegen Anker, beide Richtungen; Giebel und Luke nutzen DOOR bzw. Wandfarben,
    // daher keine Fenster ohne Anker (roofOnly house4 = 0)
    const area = (q: P[]): number =>
      q.reduce((s, p, i) => s + p.x * q[(i + 1) % q.length]!.y - q[(i + 1) % q.length]!.x * p.y, 0);
    const { ctx, log } = fakeCtx();
    drawBody(ctx, CAM, def, b, 0);
    const quads = log.events
      .filter((e) => e.op === 'fill' && e.style === WINDOW && e.points.length === 4)
      .map((e) => (area(e.points) < 0 ? [...e.points].reverse() : e.points));
    const used = new Set<number>();
    for (const a of anchors) {
      const r = rect(a);
      const k = quads.findIndex(
        (q) =>
          Math.abs(Math.min(...q.map((p) => p.x)) - r[0]![0]) < 0.5 &&
          Math.abs(Math.max(...q.map((p) => p.x)) - r[1]![0]) < 0.5 &&
          r.every(([x, y]) => inHull(q, x, y, 0.5)),
      );
      expect(k, `Anker ${a.wall} ohne gezeichnetes Fenster`).toBeGreaterThanOrEqual(0);
      used.add(k);
    }
    expect(quads.length - used.size, 'Fenster ohne Anker').toBe(0);
  });

  it('AK-R1-01 Glashütte und Badehaus haben eigene Silhouetten, nicht den Kategorie-Rückfall', () => {
    expect(SILHOUETTES.glassworks).toBeDefined();
    expect(SILHOUETTES.glassworks).not.toBe(FALLBACKS.production);
    expect(SILHOUETTES.bathhouse).toBeDefined();
    expect(SILHOUETTES.bathhouse).not.toBe(FALLBACKS.public);
  });

  it('AK-R1-01 Glashütte: Ofenmaul glüht, Sandhaufen, Höhe unter H_TOWER; Badehaus: Becken mit Schaumrand', () => {
    const gw = mk('glassworks');
    expect(styles(gw).some((c) => near(c, PALETTE.window))).toBe(true);
    expect(styles(gw).some((c) => near(c, PALETTE.sandDry))).toBe(true);
    const hg = bodyHeight(BUILDING_DEFS.glassworks, gw);
    expect(hg).toBeGreaterThanOrEqual(1.2 * ISO_H);
    expect(hg).toBeLessThanOrEqual(1.6 * ISO_H);
    const bh = mk('bathhouse');
    expect(styles(bh).some((c) => near(c, PALETTE.waterShallow))).toBe(true);
    expect(styles(bh).some((c) => near(c, PALETTE.foam))).toBe(true);
    expect(bodyHeight(BUILDING_DEFS.bathhouse, bh)).toBeLessThan(H_TOWER);
  });

  it('AK-R1-01 Glashütte und Badehaus unterscheiden sich im Bild von Brennerei, Werkzeugmacher, Kapelle, Schule', () => {
    const sig = (id: BuildingDefId): string => {
      const { ctx, log } = fakeCtx();
      drawBody(ctx, CAM, BUILDING_DEFS[id], mk(id), 0);
      return JSON.stringify(
        log.events.filter((e) => e.op === 'fill').map((e) => [e.style, e.points]),
      );
    };
    const all = ['glassworks', 'bathhouse', 'distillery', 'toolmaker', 'chapel', 'school'] as const;
    expect(new Set(all.map(sig)).size).toBe(all.length);
  });
});

describe('M11 Silhouetten und Stufen-Aufsatz (Spec 8)', () => {
  const draw = (id: BuildingDefId, extra: Partial<Building> = {}) => {
    const { ctx, log } = fakeCtx();
    drawBody(ctx, CAM, BUILDING_DEFS[id], mk(id, 10, 10, extra), 0);
    return log;
  };
  it('AK-RND-01 hunter, cattlefarm: eigene Höhe, in bodyHull (± 0,5 px), ≤ H_MAX, Pfad ≠ Fischer bzw. Schäferei', () => {
    for (const [id, other] of [
      ['hunter', 'fisher'],
      ['cattlefarm', 'sheepfarm'],
    ] as const) {
      expect(BODY_HEIGHTS[id], id).toBeDefined();
      const log = draw(id);
      const hull = bodyHull(BUILDING_DEFS[id], mk(id));
      for (const p of log.allPoints) expect(inHull(hull, p.x, p.y, 0.5), id).toBe(true);
      expect(bodyHeight(BUILDING_DEFS[id], mk(id))).toBeLessThanOrEqual(H_MAX);
      expect(JSON.stringify(log.events)).not.toBe(JSON.stringify(draw(other).events));
    }
  });
  it('AK-RND-02 je LEVELS-Typ: Stufe 1, 2, 3 verschieden, alles in bodyHull, keine Fensterfarben im Aufsatz; Welt unverändert', () => {
    const glass = new Set([WINDOW, LAMP]);
    const glassFills = (l: ReturnType<typeof draw>) =>
      l.events.filter((e) => e.op === 'fill' && glass.has(e.style)).length;
    const ids = Object.keys(LEVELS) as BuildingDefId[];
    expect(ids).toHaveLength(11);
    for (const id of ids) {
      const logs = ([undefined, 2, 3] as const).map((level) => draw(id, level ? { level } : {}));
      expect(new Set(logs.map((l) => JSON.stringify(l.events))).size, id).toBe(3);
      for (const [i, l] of logs.entries()) {
        const hull = bodyHull(
          BUILDING_DEFS[id],
          mk(id, 10, 10, i ? { level: (i + 1) as 2 | 3 } : {}),
        );
        for (const p of l.allPoints)
          expect(inHull(hull, p.x, p.y, 0.5), `${id} ${i + 1}`).toBe(true);
        expect(glassFills(l), `${id} ${i + 1}`).toBe(glassFills(logs[0]!));
      }
    }
    const w = createWorld(3, { unlockAll: true });
    const b = mk('fisher', 10, 10, { id: w.nextBuildingId++, level: 3 });
    w.buildings[b.id] = b;
    const before = serialize(w);
    drawBody(fakeCtx().ctx, CAM, BUILDING_DEFS.fisher, b, 0);
    expect(serialize(w)).toBe(before);
  });
});

describe('M11 Abgrenzung kleiner Bauten', () => {
  const N = 16;
  const pointInPoly = (pts: readonly P[], x: number, y: number): boolean => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i]!,
        b = pts[j]!;
      if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x)
        inside = !inside;
    }
    return inside;
  };
  /** Silhouetten-Rasterfüllung 16 x 16 über der Bildbox (Footprint-Raute bis H_MAX) und Ereignis-Hash. */
  const shape = (id: BuildingDefId) => {
    const def = BUILDING_DEFS[id];
    const { ctx, log } = fakeCtx();
    drawBody(ctx, CAM, def, mk(id), 0);
    const top = project(10, 10),
      left = project(10, 10 + def.h),
      right = project(10 + def.w, 10),
      bottom = project(10 + def.w, 10 + def.h);
    const [x0, x1, y0, y1] = [left.x, right.x, top.y - H_MAX, bottom.y];
    const polys = log.events.filter((e) => e.op === 'fill').map((e) => e.points);
    const mask: boolean[] = [];
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const x = x0 + ((i + 0.5) * (x1 - x0)) / N,
          y = y0 + ((j + 0.5) * (y1 - y0)) / N;
        mask.push(polys.some((p) => pointInPoly(p, x, y)));
      }
    return { hash: JSON.stringify(log.events), mask };
  };
  const hamming = (a: boolean[], b: boolean[]): number => a.filter((v, i) => v !== b[i]).length;
  const matrix = (ids: BuildingDefId[]) => {
    const s = new Map(ids.map((id) => [id, shape(id)]));
    const pairs: { a: BuildingDefId; b: BuildingDefId; d: number; same: boolean }[] = [];
    for (const [i, a] of ids.entries())
      for (const b of ids.slice(i + 1))
        pairs.push({
          a,
          b,
          d: hamming(s.get(a)!.mask, s.get(b)!.mask),
          same: s.get(a)!.hash === s.get(b)!.hash,
        });
    return pairs;
  };
  // Kalibrierung am Ist-Stand (Hamming-Abstand der 16 x 16 Rasterfüllung, 256 Zellen): alte 1x1-Paare 11 (house-fisher,
  // engste) bis 61; hunter zu den alten 1x1: 15 (house) bis 70; cattlefarm zu den 2x2: 13 (market, engste) bis 39.
  // Schwelle alt >= 10 (knapp unter dem engsten Altpaar), neu >= 14 (1x1) bzw. >= 12 (2x2, grösseres Raster je Zelle).
  const NEW = new Set<BuildingDefId>(['hunter', 'cattlefarm']);
  const small = DEFS.filter((d) => d.w * d.h <= 2).map((d) => d.id);
  const quad = DEFS.filter((d) => d.w * d.h === 4).map((d) => d.id);
  it('M11 Abgrenzung kleiner Bauten (1x1): Aufzeichnung verschieden, Umriss >= 10 Zellen, neue Typen >= 14', () => {
    const pairs = matrix(small);
    expect(small).toEqual(expect.arrayContaining(['hunter', 'fisher', 'firestation']));
    for (const p of pairs) {
      expect(p.same, `${p.a}-${p.b}`).toBe(false);
      expect(p.d, `${p.a}-${p.b}`).toBeGreaterThanOrEqual(NEW.has(p.a) || NEW.has(p.b) ? 14 : 10);
    }
  });
  it('M11 Abgrenzung kleiner Bauten (2x2): cattlefarm weicht von jedem 2x2-Bau um >= 12 Zellen ab (engste Paarung Markt, 13)', () => {
    const pairs = matrix(quad).filter((p) => p.a === 'cattlefarm' || p.b === 'cattlefarm');
    expect(pairs.length).toBeGreaterThan(5);
    for (const p of pairs) {
      expect(p.same, `${p.a}-${p.b}`).toBe(false);
      expect(p.d, `${p.a}-${p.b}`).toBeGreaterThanOrEqual(12);
    }
  });
});

describe('M11 Stufe 3 deutlich lesbar (R199)', () => {
  it('RF-R199 je LEVELS-Typ: Fahne >= 9 x 8 px (Auftrag >= 6 x 5), Mast >= 5 px breit, >= 10 px über dem Anbau und bis zur Hüllenkante', () => {
    const bbox = (pts: P[]) => {
      const xs = pts.map((q) => q.x),
        ys = pts.map((q) => q.y);
      return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    };
    for (const id of Object.keys(LEVELS) as BuildingDefId[]) {
      const f2 = fakeCtx(),
        f3 = fakeCtx();
      const b2 = mk(id, 10, 10, { level: 2 }),
        b3 = mk(id, 10, 10, { level: 3 });
      drawBody(f2.ctx, CAM, BUILDING_DEFS[id], b2, 0);
      drawBody(f3.ctx, CAM, BUILDING_DEFS[id], b3, 0);
      const extra = f3.log.events.slice(f2.log.events.length);
      const flag = extra.filter((e) => e.op === 'fill' && e.style === PALETTE.roofTerracotta);
      expect(flag.length, id).toBe(1);
      const fb = bbox(flag[0]!.points);
      expect(fb.x1 - fb.x0, `${id} Fahne Breite`).toBeGreaterThanOrEqual(9);
      expect(fb.y1 - fb.y0, `${id} Fahne Höhe`).toBeGreaterThanOrEqual(8);
      const mast = extra.filter(
        (e) =>
          e.op === 'fill' &&
          (e.style === PALETTE.wallTimber ||
            e.style === wallColors(PALETTE.wallTimber).left ||
            e.style === wallColors(PALETTE.wallTimber).right),
      );
      expect(mast.length, id).toBeGreaterThan(0);
      const mb = bbox(mast.flatMap((e) => e.points));
      expect(mb.y1 - mb.y0, `${id} Mast`).toBeGreaterThanOrEqual(10 + 0.35 * ISO_H);
      expect(mb.x1 - mb.x0, `${id} Mastbreite`).toBeGreaterThanOrEqual(5);
      const top = mast.flatMap((e) => e.points).find((q) => q.y === mb.y0)!;
      const hull = bodyHull(BUILDING_DEFS[id], b3);
      expect(inHull(hull, top.x, top.y, 0), `${id} in Hülle`).toBe(true);
      expect(inHull(hull, top.x, top.y - 4, 0), `${id} bis zur Kante`).toBe(false);
    }
  });
});
