import { describe, expect, it } from 'vitest';
import { laneTicks } from '../../src/sim/islands';
import { seaRoute } from '../../src/sim/seaRoute';
import { WHALE_EPISODE_MS, whaleAt } from '../../src/render/wildlife';
import { dolphinSites } from '../../src/render/fauna';
import { createWorld, home } from '../../src/sim/world';
import type { Ship, World } from '../../src/sim/types';
import { project } from '../../src/render/iso';
import {
  kontorPos,
  seaClearance,
  seaContext,
  seaElementTiles,
  seaPlan,
  stampPlacements,
  type StampKind,
} from '../../src/render/decor';
import { seaTintFor, tintWater } from '../../src/render/seaFields';
import { drawWaves, foamShown, seaFoamVisible } from '../../src/render/water';
import type { Building } from '../../src/sim/types';
import {
  DECOR_MIN_ZOOM,
  DECOR_STAMP_TONES,
  STAMP_BOX,
  VARIANT_COUNT,
  decorShadow,
  needleGeom,
  FAR_ROCK_MAX_STEP,
  decorCacheKeys,
  decorStampFor,
  drawDecorStamp,
  farRockGeom,
  paintDecorStamp,
  palmGeom,
  rockHeaps,
  setDecorCanvasFactory,
  stampHeight,
  resetDecorCache,
  wreckGeom,
  type DecorItem,
} from '../../src/render/decorStamps';
import { ISO_H, ISO_W, sortedObjects } from '../../src/render/iso';
import { DECOR_TONES } from '../../src/render/groundDecor';
import { PALETTE, rgbOfCss } from '../../src/render/palette';
import { HULL, drawShip } from '../../src/render/ship';
import { lanePoints, shipAt, shipPose } from '../../src/render/shipLane';
import { worldToScreen } from '../../src/render/camera';
import { TREE_H } from '../../src/render/trees';
import { rgbToLab } from './deltaE';
import { fakeCtx } from './fakeCtx';

const L5: StampKind[] = ['palm', 'wreck', 'seaRock', 'islet'];
const lab = (css: string) => rgbToLab(rgbOfCss(css));
const chroma = (css: string): number => {
  const [, a, b] = lab(css);
  return Math.hypot(a, b);
};
const paint = (kind: StampKind, v: number) => {
  const f = fakeCtx();
  paintDecorStamp(f.ctx, kind, v, 1, 0, 0);
  return f;
};
const item = (stamp: StampKind, variant = 1): DecorItem => ({
  kind: 'decor',
  id: 100,
  fp: { x: 4, y: 4, w: 1, h: 1 },
  key: 8,
  stamp,
  variant,
});

describe('L5 Zeichner: Grenzen und Form', () => {
  it('R5 jede Variante jeder L5-Art ≤ TREE_H hoch (gemessen und tabelliert), liegt in der Stempelbox, save/restore ausgeglichen, Matrix unverändert', () => {
    for (const k of L5)
      for (let v = 0; v < VARIANT_COUNT[k]; v++) {
        const f = paint(k, v);
        const ys = f.log.allPoints.map((p) => p.y),
          xs = f.log.allPoints.map((p) => p.x);
        expect(ys.length, `${k} ${v}`).toBeGreaterThan(10);
        expect(-Math.min(...ys), `${k} ${v} gemessen`).toBeLessThanOrEqual(TREE_H + 1e-9);
        expect(stampHeight(k, v), `${k} ${v} Tabelle`).toBeLessThanOrEqual(TREE_H);
        expect(stampHeight(k, v)).toBeGreaterThan(8);
        expect(Math.min(...xs)).toBeGreaterThanOrEqual(STAMP_BOX.x0);
        expect(Math.max(...xs)).toBeLessThanOrEqual(STAMP_BOX.x1);
        expect(Math.min(...ys)).toBeGreaterThanOrEqual(STAMP_BOX.y0);
        expect(Math.max(...ys)).toBeLessThanOrEqual(STAMP_BOX.y1);
        expect(f.log.saves).toBe(f.log.restores);
        expect(f.log.underflow).toBe(0);
        expect(f.log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
      }
  });

  it('R7 keine Linie und keine Fläche in Schwarz oder Weiss; Signalfarben kommen nicht vor', () => {
    const bad = new Set<string>();
    for (const k of L5)
      for (let v = 0; v < VARIANT_COUNT[k]; v++) {
        const f = paint(k, v);
        for (const c of [...f.log.fillSet, ...f.log.strokeSet]) {
          const [r, g, b] = rgbOfCss(c);
          if ((r + g + b === 0 || r + g + b === 765) && c !== '#000000') bad.add(c);
          if (
            ['signalRed', 'signalYellow', 'signalWarn', 'signalOk'].some(
              (n) => c === PALETTE[n as 'signalRed'],
            )
          )
            bad.add(c);
        }
        // der Fake-Kontext beginnt mit '#000000'; keine Zeichnung darf ihn je als Ton benutzen
        for (const e of f.log.events.filter(
          (x) => x.op === 'fill' || x.op === 'stroke' || x.op === 'fillRect',
        )) {
          const [r, g, b] = rgbOfCss(e.style);
          expect(r + g + b > 0 && r + g + b < 765, `${k} ${v}: ${e.op} ${e.style}`).toBe(true);
        }
      }
    expect([...bad]).toEqual([]);
  });

  it('D1 Palme: 5–7 gefiederte Wedel (Polygone mit Zacken, nicht nur Ellipsen), 3 Formen × 4 Richtungen, neigt zur See', () => {
    const counts = new Set<number>();
    for (let shape = 0; shape < 3; shape++)
      for (let dir = 0; dir < 4; dir++) {
        const g = palmGeom(shape, dir);
        expect(g.fronds.length).toBeGreaterThanOrEqual(5);
        expect(g.fronds.length).toBeLessThanOrEqual(7);
        counts.add(g.fronds.length);
        for (const f of g.fronds) expect(f.outline.length).toBeGreaterThanOrEqual(12);
        // Schopf liegt auf der Seite der Richtung: +x/−y nach rechts, +y/−x nach links (Iso-Projektion)
        const right = dir === 0 || dir === 3;
        expect(Math.sign(g.crown.x), `${shape}/${dir}`).toBe(right ? 1 : -1);
        // schlanker Stamm: unten höchstens 5 px breit
        expect(g.right[0]!.x - g.left[0]!.x).toBeLessThanOrEqual(5);
      }
    expect(counts.size).toBe(3);
    const f = paint('palm', 5);
    const polys = f.log.events.filter((e) => e.op === 'fill' && e.points.length >= 12);
    expect(polys.length).toBeGreaterThanOrEqual(5 * 3); // je Wedel Umriss, Licht, Schatten
    // Wedelfarbe: gelbstichiger (kleinerer Farbwinkel in Lab) und heller als die Kronen der Waldbäume
    const hue = (c: string): number => (Math.atan2(lab(c)[2], lab(c)[1]) * 180) / Math.PI;
    for (const c of [PALETTE.crown, PALETTE.crownLight]) {
      expect(hue(c) - hue(DECOR_STAMP_TONES.palmFrond), c).toBeGreaterThanOrEqual(8);
      expect(lab(DECOR_STAMP_TONES.palmFrond)[0]).toBeGreaterThan(lab(c)[0] + 5);
    }
  });

  it('E1 Wrack: Neigung ≥ 20°, ≤ 1,5 Kacheln, kein Segel (keine helle Fläche, Mastrest ≤ 10 px), entsättigt gegenüber dem Handelsschiff', () => {
    for (let v = 0; v < 4; v++) {
      const g = wreckGeom(v);
      expect(g.tiltDeg).toBeGreaterThanOrEqual(20);
      // gemessen: die Deckkante steigt mit mindestens 20° gegen die Waagrechte
      const [bow, stern] = g.deck;
      const ang =
        (Math.atan2(Math.abs(bow.y - stern.y), Math.abs(bow.x - stern.x)) * 180) / Math.PI;
      expect(ang, `Variante ${v}`).toBeGreaterThanOrEqual(20);
      const xs = g.hull.map((p) => p.x);
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(1.3 * ISO_W);
      // T6: ≈ 1–1,2 Kacheln lang, aufgebrochener Rumpf (gezackte Lücke, 2–4 sichtbare Spanten), Maststumpf mit Bruchkante
      expect(Math.max(...xs) - Math.min(...xs), `Länge ${v}`).toBeGreaterThanOrEqual(0.9 * ISO_W);
      expect(g.gap.length, 'gezackte Lücke').toBeGreaterThanOrEqual(6);
      expect(g.ribs.length).toBeGreaterThanOrEqual(2);
      expect(g.ribs.length).toBeLessThanOrEqual(4);
      expect(g.mast.length, 'Bruchkante').toBeGreaterThanOrEqual(6);
      expect(Math.max(...g.hull.map((p) => p.y)), 'ein Ende unter Wasser').toBeGreaterThan(4);
      const mh = Math.max(...g.mast.map((p) => p.y)) - Math.min(...g.mast.map((p) => p.y));
      expect(mh).toBeLessThanOrEqual(11);
      const f = paint('wreck', v);
      for (const e of f.log.events.filter((x) => x.op === 'fill' || x.op === 'fillRect')) {
        const [r, gg, b] = rgbOfCss(e.style);
        expect(Math.min(r, gg, b), `${e.style}: keine helle Segelfläche`).toBeLessThan(170);
      }
    }
    const t = DECOR_STAMP_TONES;
    for (const k of ['wreckWood', 'wreckLit', 'wreckShade', 'wreckWet'] as const)
      expect(chroma(t[k]), k).toBeLessThan(0.6 * chroma(HULL));
    // unterer Teil in Wasserton gemischt: das nasse Holz liegt näher am Wasser als das trockene
    const d = (a: string, b: string): number => {
      const x = lab(a),
        y = lab(b);
      return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
    };
    expect(d(t.wreckWet, PALETTE.waterMid)).toBeLessThan(d(t.wreckWood, PALETTE.waterMid));
    for (const k of L5) expect(decorShadow(item(k)), k).toBeNull(); // kein Schatten für L5-Stempel
  });

  it('E3 Meeresfelsen: 1–3 Brocken, Felsnadel schmal und hoch (≤ TREE_H), Felstöne aus DECOR_TONES, nasser Fuss', () => {
    for (let v = 0; v < 6; v++) expect(rockHeaps(v).length).toBe((v % 3) + 1);
    const heaps = Math.max(...[0, 1, 2, 3, 4, 5].map((v) => stampHeight('seaRock', v)));
    for (const v of [6, 7]) {
      expect(stampHeight('seaRock', v)).toBeGreaterThan(heaps);
      expect(stampHeight('seaRock', v)).toBeLessThanOrEqual(TREE_H);
    }
    const f = paint('seaRock', 0);
    const styles = new Set(f.log.events.map((e) => e.style));
    expect(styles.has(DECOR_STAMP_TONES.rockWet)).toBe(true);
    expect(f.log.events.some((e) => e.op === 'stroke')).toBe(true);
    for (const v of [6, 7]) {
      const g = needleGeom(v);
      const h = stampHeight('seaRock', v);
      expect(h, 'Nadel ≤ 0,8 TREE_H').toBeLessThanOrEqual(0.8 * TREE_H);
      expect(g.pillar.length, 'kein Dreieck').toBeGreaterThanOrEqual(8);
      const foot = g.pillar.filter((p) => p.y >= -1).map((p) => p.x);
      expect(Math.max(...foot) - Math.min(...foot), 'Fuss ≥ 0,45 × Höhe').toBeGreaterThanOrEqual(
        0.45 * h,
      );
      expect(g.side.length, '1–2 Nebenbrocken').toBeGreaterThanOrEqual(1);
      expect(g.side.length).toBeLessThanOrEqual(2);
      const tops = g.pillar.filter((p) => p.y < -h + 4);
      expect(tops.length, 'abgebrochene Spitze: mehrere Punkte oben').toBeGreaterThanOrEqual(3);
    }
  });

  it('E8 Felseiland: ≤ 1 Kachel, genau eine Palme, keine grüne Grasfläche', () => {
    for (let v = 0; v < 4; v++) {
      const f = paint('islet', v);
      const xs = f.log.allPoints.map((p) => p.x);
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(ISO_W);
      const wedel = f.log.events.filter(
        (e) => e.op === 'fill' && e.style === DECOR_STAMP_TONES.palmFrond,
      );
      expect(wedel.length, `Variante ${v}: genau eine Palme`).toBeGreaterThanOrEqual(5);
      expect(wedel.length).toBeLessThanOrEqual(7);
      for (const e of f.log.events.filter((x) => x.op === 'fill')) {
        const green = [PALETTE.grass, PALETTE.grassLight, PALETTE.grassDark];
        expect(green).not.toContain(e.style);
        // grosse Flächen (Ellipsen, > 30 px breit) sind nie Grasgrün (Lab: a* < −12 bei b* > 20)
        const w = Math.max(...e.points.map((p) => p.x)) - Math.min(...e.points.map((p) => p.x));
        const [, la, lb] = lab(e.style);
        if (w > 30) expect(la < -12 && lb > 20, `${e.style} ist keine Grasfläche`).toBe(false);
      }
    }
  });

  it('T7 Wrack: 1–2 Treibplanken als Teil des Stempels, innerhalb der Stempelbox', () => {
    for (let v = 0; v < 4; v++) {
      const g = wreckGeom(v);
      expect(g.planks.length).toBeGreaterThanOrEqual(1);
      expect(g.planks.length).toBeLessThanOrEqual(2);
      for (const pl of g.planks)
        for (const p of pl) {
          expect(p.x).toBeGreaterThanOrEqual(STAMP_BOX.x0);
          expect(p.x).toBeLessThanOrEqual(STAMP_BOX.x1);
          expect(p.y).toBeLessThanOrEqual(STAMP_BOX.y1);
        }
    }
  });

  it('T6 Palme: weicher Kontaktschatten im Stempel (halbtransparent, am Fuss, Richtung −LIGHT), nicht über decorShadow', () => {
    const f = paint('palm', 0);
    const sh = f.log.events.filter((e) => e.op === 'fill' && e.alpha < 1 && e.alpha > 0.1);
    expect(sh.length).toBeGreaterThan(0);
    const e = sh[0]!;
    const cx = e.points.reduce((a, p) => a + p.x, 0) / e.points.length;
    const cy = e.points.reduce((a, p) => a + p.y, 0) / e.points.length;
    expect(Math.abs(cy)).toBeLessThan(6); // am Fuss
    expect(cx, 'Schatten fällt nach rechts (−LIGHT.x > 0)').toBeGreaterThan(0);
    expect(decorShadow(item('palm'))).toBeNull();
  });

  it('Zoomschwellen und Fern-Pfad: Wrack, Felsen und Eiland ab 0,25, Palme ab 0,5', () => {
    resetDecorCache();
    setDecorCanvasFactory(() => {
      const { ctx } = fakeCtx();
      return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
    });
    for (const k of L5)
      for (const zoom of [0.25, 0.5]) {
        const f = fakeCtx();
        drawDecorStamp(f.ctx, { x: 0, y: 0, zoom }, item(k), 7);
        expect(f.log.events.filter((e) => e.op === 'drawImage').length, `${k}@${zoom}`).toBe(
          zoom >= DECOR_MIN_ZOOM[k] ? 1 : 0,
        );
      }
    setDecorCanvasFactory(null);
  });
});

describe('L5-T1 Fernansicht und Stempelzahl', () => {
  it('L5-T1 Zoom ≤ 0,25: ≤ 300 Stempel je Insel im Fern-Pfad (Seeds 1–50), dort nur Meeresfelsen (Wrack und Eiland ab 0,5, REL-07)', () => {
    let max = 0,
      maxAll = 0;
    const seen = new Set<string>();
    for (let seed = 1; seed <= 50; seed++) {
      const w = createWorld(seed);
      const all = sortedObjects(w).filter((i): i is DecorItem => i.kind === 'decor');
      const far = all.filter((i) => DECOR_MIN_ZOOM[i.stamp] <= 0.25);
      max = Math.max(max, far.length);
      maxAll = Math.max(maxAll, all.length);
      for (const i of far) seen.add(i.stamp);
      expect(far.length, `Seed ${seed}`).toBeLessThanOrEqual(300);
      expect(all.length, `Seed ${seed}`).toBeLessThanOrEqual(300);
    }
    expect([...seen].sort()).toEqual(['seaRock']);
    expect(max).toBeGreaterThan(0);
    expect(maxAll).toBeLessThanOrEqual(300);
  }, 40_000); // lokal bis 4,1 s im Gesamtlauf (REL-10, SEE-F1-KORRIDOR), Timeout >= 8 x (R270)

  it('die Meer-Stempel stehen in sortedObjects auf Wasserkacheln der Heimat und folgen dem Plan', () => {
    const w = createWorld(7);
    const isl = home(w);
    const plan = seaPlan(w.seed, isl, seaContext(w));
    const items = sortedObjects(w).filter((i): i is DecorItem => i.kind === 'decor');
    const sea = items.filter((i) => ['wreck', 'seaRock', 'islet'].includes(i.stamp));
    const want = seaElementTiles(plan).filter((e) => ['wreck', 'rock', 'islet'].includes(e.kind));
    expect(sea.length).toBe(want.length);
    for (const i of sea) expect(isl.tiles[i.fp.y * isl.width + i.fp.x]!.terrain).toBe('water');
  });
});

const segDistTo = (
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
): number => {
  const dx = b.x - a.x,
    dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};

describe('L5-T3 shipAt trifft nie Wrack oder Felsen', () => {
  // Timeout: lokal ≤ 1 s (seriell, Last eher höher), CI bis ~4× (gemessen 3,6 s), R270/R318/R328
  it('L5-T3 Schiffe am Anker und am nächsten Lane-Punkt jedes Elements; Bildpunkte über der Stempelbox bei Zoom 0,25 / 0,5 / 1 (Seeds 1–20)', () => {
    let samples = 0,
      ships = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const w: World = createWorld(seed);
      const isl = home(w);
      const ctx = seaContext(w);
      const plan = seaPlan(seed, isl, ctx);
      const els = seaElementTiles(plan).filter((e) => ['wreck', 'rock', 'islet'].includes(e.kind));
      const place = (to: number | null, u: number): Ship => {
        const total = to === null ? 0 : laneTicks(w.islands, 0, to);
        const s: Ship = {
          id: 1,
          port: 0,
          to,
          left: total * (1 - u),
          cargo: {},
          route: null,
          homing: false,
        };
        w.ships = [s];
        return s;
      };
      const poses: { to: number | null; u: number }[] = [{ to: null, u: 0 }];
      for (let b = 1; b < w.islands.length; b++) {
        const pts = lanePoints(w, 0, b);
        const [p, q] = [pts[0]!, pts[pts.length - 1]!];
        for (const e of els) {
          const c = { x: e.x + 0.5, y: e.y + 0.5 };
          const dx = q.x - p.x,
            dy = q.y - p.y;
          const u = Math.max(
            0,
            Math.min(1, ((c.x - p.x) * dx + (c.y - p.y) * dy) / (dx * dx + dy * dy)),
          );
          poses.push({ to: b, u });
        }
      }
      for (const ps of poses) {
        const ship = place(ps.to, ps.u);
        ships++;
        const pose = shipPose(w, ship);
        const rp = ps.to === null ? [] : lanePoints(w, 0, ps.to);
        for (const e of els) {
          // R367: Wrack und Fels werden nur gegen die gerade Lane freigehalten (die Route wuerde die Heimat-Pins aendern).
          // Gemessen (Seeds 1-40): 39 von 265 Elementen (Paare mit Route) liegen <= 2 Kacheln von einer Route, in 18 Seeds.
          // Solche Elemente prueft dieser Test nicht gegen Schiffe auf dieser Route (Option: Pin neu setzen, docs/beobachtungen.md).
          let near = false;
          for (let i = 1; i < rp.length && !near; i++)
            near = segDistTo({ x: e.x + 0.5, y: e.y + 0.5 }, rp[i - 1]!, rp[i]!) <= 2;
          if (near) continue;
          const c = project(e.x + 0.5, e.y + 0.5);
          for (const z of [0.25, 0.5, 1]) {
            const cam = { x: 0, y: 0, zoom: z };
            const o = worldToScreen(cam, c);
            for (let sx = o.x + STAMP_BOX.x0 * z; sx <= o.x + STAMP_BOX.x1 * z; sx += 4)
              for (let sy = o.y + STAMP_BOX.y0 * z; sy <= o.y + STAMP_BOX.y1 * z; sy += 4) {
                samples++;
                if (shipAt(w, cam, sx, sy) !== null)
                  throw new Error(
                    `Seed ${seed}: Schiff @${pose.x.toFixed(1)},${pose.y.toFixed(1)} trifft ${e.kind}@${e.x},${e.y} bei Zoom ${z}`,
                  );
              }
          }
        }
      }
    }
    expect(ships).toBeGreaterThan(100);
    expect(samples).toBeGreaterThan(10000);
    expect(ISO_H).toBe(32);
  }, 20_000);
});

describe('L5-Review Kontor-Abhängigkeit und Tönung an der Lane', () => {
  it('ein später gebautes Kontor verschiebt nichts: Plan gleich, Stempel und Schaum in < 4 Kacheln entfallen, nach Abriss alles zurück', () => {
    const w = createWorld(7);
    const isl = home(w);
    const k = kontorPos(isl, w.buildings);
    const plan0 = JSON.stringify(seaPlan(w.seed, isl, seaContext(w)));
    const st0 = stampPlacements(w.seed, isl, k, seaContext(w));
    const foam0 = seaFoamVisible(w).rings.length;
    const rock = seaPlan(w.seed, isl, seaContext(w)).rocks[0]!;
    w.buildings[9001] = {
      id: 9001,
      defId: 'kontor2',
      x: rock.x + 2,
      y: rock.y,
      island: 0,
    } as unknown as Building;
    const ctx1 = seaContext(w);
    expect(ctx1.live.length).toBe(ctx1.kontors.length + 1);
    expect(JSON.stringify(seaPlan(w.seed, isl, ctx1)), 'Plan bleibt').toBe(plan0);
    const st1 = stampPlacements(w.seed, isl, k, ctx1);
    expect(st1.some((s) => s.kind === 'seaRock' && s.x === rock.x && s.y === rock.y)).toBe(false);
    expect(st1.length).toBeLessThan(st0.length);
    for (const s of st1) expect(st0.map((q) => q.id)).toContain(s.id); // nichts kommt dazu, nichts rückt nach
    expect(seaFoamVisible(w).rings.length, 'Schaum entfällt mit dem Objekt').toBeLessThan(foam0);
    delete w.buildings[9001];
    expect(stampPlacements(w.seed, isl, k, seaContext(w))).toEqual(st0);
    expect(seaFoamVisible(w).rings.length).toBe(foam0);
  });

  // Timeout: lokal ≤ 1 s (seriell, Last eher höher), CI bis ~4× (gemessen 3,6 s), R270/R318/R328
  it('Tönung der Wasserfelder ist an der R4-Grenze 0: Seeds 1–20 kein getöntes Punkt < 3 Kacheln von einer Lane, < 4 vom Anker oder Kontor, nicht im Kegel', () => {
    let tinted = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const w = createWorld(seed);
      const t = seaTintFor(w);
      if (!t) continue;
      const ctx = seaContext(w);
      const base = [47, 127, 154];
      for (let y = 0; y < 64; y += 0.2)
        for (let x = 0; x < 64; x += 0.2) {
          const o = [...base];
          tintWater(t, x, y, o);
          if (o[0] === base[0] && o[1] === base[1] && o[2] === base[2]) continue;
          tinted++;
          expect(
            seaClearance(ctx, x, y),
            `Seed ${seed} @${x.toFixed(1)},${y.toFixed(1)}`,
          ).toBeGreaterThanOrEqual(0);
        }
    }
    expect(tinted).toBeGreaterThan(5000);
  }, 15_000);
});

describe('T04 Meeresfels bei Zoom 0,5 und Schaum nur an Objekten', () => {
  const sil = (v: number, zoom: number) => {
    const f = fakeCtx();
    paintDecorStamp(f.ctx, 'seaRock', v, 1, 0, 0, zoom <= FAR_ROCK_MAX_STEP);
    const pts = f.log.allPoints.map((p) => ({ x: p.x, y: p.y }));
    // Schaumring (nur wenn bei diesem Zoom gezeichnet), projiziert um den Stempelfuss
    const w = createWorld(3);
    const ring = seaFoamVisible(w).rings.find((r) => r.kind === 'rock');
    if (ring && foamShown('rock', zoom))
      for (const pc of ring.pieces)
        for (let k = 0; k <= 6; k++) {
          const a = pc.a0 + ((pc.a1 - pc.a0) * k) / 6;
          const dx = Math.cos(a) * pc.r,
            dy = Math.sin(a) * pc.r;
          pts.push({ x: ((dx - dy) * ISO_W) / 2, y: ((dx + dy) * ISO_H) / 2 });
        }
    const xs = pts.map((p) => p.x),
      ys = pts.map((p) => p.y);
    return (Math.max(...xs) - Math.min(...xs)) / (Math.max(...ys) - Math.min(...ys));
  };

  it('AK-T04a Meeresfels bei Zoom 0,5: Breite : Höhe der Silhouette inkl. Schaumring ≤ 1,3 : 1 (alle 8 Varianten)', () => {
    for (let v = 0; v < 8; v++) expect(sil(v, 0.5), `Variante ${v}`).toBeLessThanOrEqual(1.3);
  });

  it('AK-T04a Schaum nur an Fels, Wrack, Eiland: jeder Bogen sitzt auf einem Objekt des Plans, Fels-Schaum erst ab Zoom 0,7', () => {
    for (const seed of [1, 2, 3, 7]) {
      const w = createWorld(seed);
      const objs = seaFoamVisible(w).rings.map((r) => `${r.x},${r.y}`);
      for (const zoom of [0.25, 0.5, 1]) {
        const f = fakeCtx();
        const centers: string[] = [];
        const arc = f.log.arc.bind(f.log);
        f.log.arc = (x: number, y: number, r: number) => {
          centers.push(`${x},${y}`);
          arc(x, y, r);
        };
        const isl = home(w);
        drawWaves(
          f.ctx,
          w,
          { x0: 0, y0: 0, x1: isl.width, y1: isl.height },
          0,
          undefined,
          false,
          true,
          zoom,
        );
        for (const c of centers) expect(objs, `seed ${seed} zoom ${zoom}`).toContain(c);
        if (zoom < 0.7)
          for (const r of seaFoamVisible(w).rings.filter((q) => q.kind === 'rock'))
            expect(centers).not.toContain(`${r.x},${r.y}`);
      }
    }
  });
});

describe('SEE-F1 T3 Meeresdeko folgt der Wasserroute', () => {
  const segDist = (
    p: { x: number; y: number },
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => {
    const dx = b.x - a.x,
      dy = b.y - a.y;
    const l2 = dx * dx + dy * dy;
    const t = l2 === 0 ? 0 : Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2));
    return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
  };
  const minRouteDist = (w: World, x: number, y: number): number => {
    let m = Infinity;
    for (let a = 0; a < w.islands.length; a++)
      for (let b = a + 1; b < w.islands.length; b++) {
        const r = seaRoute(w.islands, a, b);
        for (let i = 1; i < r.length; i++) m = Math.min(m, segDist({ x, y }, r[i - 1]!, r[i]!));
      }
    return m;
  };

  it('AK12 (angepasst) seaContext.lanes bleiben die Geraden Anker-Anker: Tönung und Plan der Heimatansicht hängen nicht von der Route um Fremdinseln ab', () => {
    for (let seed = 1; seed <= 5; seed++) {
      const w = createWorld(seed);
      const isl = home(w);
      const lanes = seaContext(w).lanes;
      expect(lanes.length).toBe(w.islands.length - 1);
      for (const l of lanes) {
        expect(l.length).toBe(2);
        expect(l[0]).toEqual({ x: isl.anchor.x + 0.5, y: isl.anchor.y + 0.5 });
      }
    }
  });

  it('AK11 Wal und Delfine bleiben >= 3 Kacheln von jeder Route (Seeds 1-5)', () => {
    let whales = 0,
      dolphins = 0;
    for (let seed = 1; seed <= 5; seed++) {
      const w = createWorld(seed);
      for (let e = 0; e < 40; e++)
        for (let t = 0; t < WHALE_EPISODE_MS; t += 4000) {
          const p = whaleAt(w, e * WHALE_EPISODE_MS + t);
          if (!p) continue;
          whales++;
          expect(
            minRouteDist(w, p.x + home(w).ox, p.y + home(w).oy),
            `Seed ${seed} Wal`,
          ).toBeGreaterThanOrEqual(3);
        }
      const sites = dolphinSites(w);
      const isl = home(w);
      for (const i of sites?.cands ?? []) {
        if (i % 7 !== 0) continue;
        dolphins++;
        const x = (i % sites!.field.w) + 0.5,
          y = Math.floor(i / sites!.field.w) + 0.5;
        expect(
          minRouteDist(w, x + isl.ox, y + isl.oy),
          `Seed ${seed} Delfin`,
        ).toBeGreaterThanOrEqual(3);
      }
    }
    expect(whales).toBeGreaterThan(0);
    expect(dolphins).toBeGreaterThan(0);
  });
});

// ---------- ART-MEERESFELS (REL-11): Silhouettenmass Fels gegen Schiff ----------

type XY = { x: number; y: number };
const polyArea = (p: readonly XY[]): number => {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[(i + 1) % p.length]!;
    a += p[i]!.x * q.y - q.x * p[i]!.y;
  }
  return Math.abs(a) / 2;
};
/** Obere Hüllkurve (kleinstes y je x, Schritt 0,25) über alle Polygone, Kanten linear interpoliert. */
const upperEnvelope = (polys: readonly (readonly XY[])[]): XY[] => {
  const best = new Map<number, number>();
  for (const p of polys)
    for (let i = 0; i < p.length; i++) {
      const a = p[i]!,
        b = p[(i + 1) % p.length]!;
      const lo = Math.ceil(Math.min(a.x, b.x) * 4),
        hi = Math.floor(Math.max(a.x, b.x) * 4);
      for (let k = lo; k <= hi; k++) {
        const x = k / 4,
          t = a.x === b.x ? 0 : (x - a.x) / (b.x - a.x);
        const y = a.x === b.x ? Math.min(a.y, b.y) : a.y + (b.y - a.y) * t;
        best.set(k, Math.min(best.get(k) ?? Infinity, y));
      }
    }
  return [...best.entries()].sort((p, q) => p[0] - q[0]).map(([k, y]) => ({ x: k / 4, y }));
};
/** Winkel (Grad) an der höchsten Stelle: zwischen den Richtungen zu den Hüllpunkten 25 % der Silhouettenhöhe tiefer. */
const tipAngleDeg = (env: readonly XY[]): number => {
  const top = Math.min(...env.map((p) => p.y)),
    bot = Math.max(...env.map((p) => p.y));
  const peak = env.filter((p) => p.y <= top + 0.05);
  const ax = peak.reduce((s, p) => s + p.x, 0) / peak.length;
  const d = 0.25 * (bot - top);
  const deep = (p: XY) => p.y >= top + d;
  const l = env.filter((p) => p.x < ax && deep(p)).pop() ?? env[0]!;
  const r = env.find((p) => p.x > ax && deep(p)) ?? env[env.length - 1]!;
  const u = { x: l.x - ax, y: l.y - top },
    w = { x: r.x - ax, y: r.y - top };
  return (
    (Math.acos((u.x * w.x + u.y * w.y) / (Math.hypot(u.x, u.y) * Math.hypot(w.x, w.y))) * 180) /
    Math.PI
  );
};
export interface SilMetrics {
  /** Breite : Höhe der Gesamtsilhouette. */
  ratio: number;
  /** Spitzenwinkel der Kontur in Grad. */
  tipDeg: number;
  /** Fläche der helleren Teilfläche / Summe beider Teilflächen (Licht gegen Schatten bzw. Segel gegen Rumpf). */
  lightShare: number;
}
const metricsOf = (
  polys: readonly (readonly XY[])[],
  light: readonly XY[][],
  dark: readonly XY[][],
): SilMetrics => {
  const env = upperEnvelope(polys);
  const xs = polys.flat().map((p) => p.x),
    ys = polys.flat().map((p) => p.y);
  const la = light.reduce((s, p) => s + polyArea(p), 0),
    da = dark.reduce((s, p) => s + polyArea(p), 0);
  return {
    ratio: (Math.max(...xs) - Math.min(...xs)) / (Math.max(...ys) - Math.min(...ys)),
    tipDeg: tipAngleDeg(env),
    lightShare: la / (la + da),
  };
};
const fills = (f: ReturnType<typeof fakeCtx>) =>
  f.log.events.filter((e) => e.op === 'fill' && e.points.length >= 3);
/** Silhouettenmass eines Meeresfelsen (Variante, Zoom): Zoom bestimmt die Form (Fern-Form bis 0,5). */
function silhouetteMetrics(variant: number, zoom: number): SilMetrics {
  const f = fakeCtx();
  paintDecorStamp(f.ctx, 'seaRock', variant, 1, 0, 0, zoom <= FAR_ROCK_MAX_STEP);
  const ev = fills(f);
  const pick = (c: string) => ev.filter((e) => e.style === c).map((e) => e.points);
  return metricsOf(
    ev.map((e) => e.points),
    pick(DECOR_TONES.rockLight),
    pick(DECOR_TONES.rockShade),
  );
}
/** Schiff (ship.ts, Zoom 1, ohne Schaukeln und Neigung): Rumpf und Segel. */
function shipMetrics(): SilMetrics {
  const f = fakeCtx();
  const t = ((2 * Math.PI - 1) / (2 * Math.PI)) * 2600; // sin(phase + 1) = 0: keine Neigung
  drawShip(f.ctx, { x: 0, y: 0, zoom: 1 }, { x: 0, y: 0 }, t);
  const ev = fills(f);
  return metricsOf(
    ev.map((e) => e.points),
    ev.filter((e) => e.style === SAIL_FILL).map((e) => e.points),
    ev.filter((e) => e.style === HULL).map((e) => e.points),
  );
}
const SAIL_FILL = PALETTE.wallLime;

/**
 * Ausgangswerte auf main (Stand 3f87f0b, gemessen mit `silhouetteMetrics`): Schiff Breite : Höhe 1,059, Spitzenwinkel 39,3 Grad,
 * Segelanteil 0,25. Fels je Variante 0…7 (Breite : Höhe) 0,708 · 0,996 · 1,195 · 0,708 · 0,996 · 1,195 · 1,041 · 1,041;
 * Spitzenwinkel 82,2 Grad (Haufen) bzw. 63,5 Grad (Nadel); Lichtanteil 0,51…0,52 (Haufen), 0,50 (Nadel): die Lichtfläche
 * halbiert die Silhouette, die Breite liegt bei 0,7…1,2 der Höhe (Einzelbrocken schmaler als das Schiff).
 */
const MAIN_FELS_RATIO = [0.708, 0.996, 1.195, 0.708, 0.996, 1.195, 1.041, 1.041] as const;

describe('ART-MEERESFELS M1 Ausgangswerte Silhouettenmass (Stand main)', () => {
  it('AK-M1 Schiff-Referenz: Breite : Höhe ≈ 1,06, Spitzenwinkel (Segel) < 50 Grad', () => {
    const s = shipMetrics();
    expect(s.ratio).toBeCloseTo(1.059, 2);
    expect(s.tipDeg).toBeLessThan(50);
    expect(s.tipDeg).toBeGreaterThan(30);
    expect(s.lightShare).toBeCloseTo(0.25, 1);
  });

  it('AK-M1 Fels heute: Ausgangswerte aller 8 Varianten (Nahzoom 1, bleibt bitgleich), Lichtanteil um 0,5', () => {
    for (const zoom of [1])
      for (let v = 0; v < 8; v++) {
        const m = silhouetteMetrics(v, zoom);
        expect(m.ratio, `Variante ${v}`).toBeCloseTo(MAIN_FELS_RATIO[v]!, 2);
        expect(m.lightShare, `Variante ${v}`).toBeGreaterThan(0.45);
        expect(m.lightShare, `Variante ${v}`).toBeLessThan(0.55);
      }
  });
});

/** FNV-1a über die Aufrufliste (Art, Stil, Matrix, Punkte) eines Stempels. */
const callHash = (f: ReturnType<typeof fakeCtx>): string => {
  let h = 2166136261;
  const s = JSON.stringify(
    f.log.events.map((e) => [e.op, e.style, e.alpha, e.lineWidth, e.matrix, e.points]),
  );
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(16);
};
/** Aufrufliste-Hashes der 8 Meeresfelsen bei Zoom 1 auf main (3f87f0b); die Nahform darf sich nicht ändern. */
const MAIN_NEAR_HASH = '93fc05a6,a4d4cea9,fb11e4f1,93fc05a6,bcd1daee,4c8bcc60,d4b3d00f,a08396ee';

describe('ART-MEERESFELS M2 Fern-Silhouette der Meeresfelsen (Zoom ≤ 0,5)', () => {
  const FAR_ZOOMS = [0.5, 0.25];

  it('AK-M2 Nahzoom (> 0,5) bitgleich zu main: Aufrufliste-Hash der 8 Varianten, Standard und far = false gleich', () => {
    const hs = Array.from({ length: 8 }, (_, v) => callHash(paint('seaRock', v)));
    expect(hs.join(',')).toBe(MAIN_NEAR_HASH);
    for (let v = 0; v < 8; v++) {
      const f = fakeCtx();
      paintDecorStamp(f.ctx, 'seaRock', v, 1, 0, 0, false);
      expect(callHash(f), `Variante ${v}`).toBe(hs[v]);
    }
  });

  it('AK-M2 Spitzenwinkel der Kontur ≥ 50 Grad und keine einzelne Spitze > 1,25 × Breite (alle Varianten, Zoom 0,5 und 0,25)', () => {
    for (const zoom of FAR_ZOOMS)
      for (let v = 0; v < 8; v++) {
        expect(silhouetteMetrics(v, zoom).tipDeg, `Variante ${v}@${zoom}`).toBeGreaterThanOrEqual(
          50,
        );
        for (const q of farRockGeom(v)) {
          const xs = q.outline.map((p) => p.x);
          const width = Math.max(...xs) - Math.min(...xs);
          expect(-Math.min(...q.outline.map((p) => p.y)), `Buckel ${v}`).toBeLessThanOrEqual(
            1.25 * width,
          );
        }
      }
  });

  // Das Fenster 1,271 (Schiff 1,059 × 1,2) bis 1,3 (T04a) ist absichtlich eng: Fels ≥ 20 % breiter als das Schiff, aber
  // nicht breiter als T04a erlaubt. Feinjustierung der Fern-Form (`farRockGeom`) kippt beide Tests zugleich.
  it('AK-M2 Breite : Höhe hebt sich vom Schiff um ≥ 20 % ab und bleibt ≤ 1,3 (T04a), alle Varianten', () => {
    const ship = shipMetrics().ratio;
    for (const zoom of FAR_ZOOMS)
      for (let v = 0; v < 8; v++) {
        const r = silhouetteMetrics(v, zoom).ratio;
        expect(
          Math.abs(r - ship) / ship,
          `Variante ${v}@${zoom}: ${r.toFixed(3)}`,
        ).toBeGreaterThanOrEqual(0.2);
        expect(r, `Variante ${v}`).toBeLessThanOrEqual(1.3);
      }
  });

  it('AK-M2 keine hell/dunkel-Zweiteilung durch eine senkrechte Mittellinie: gestaffelte, wechselnde Trennlinie', () => {
    for (let v = 0; v < 8; v++)
      for (const q of farRockGeom(v)) {
        const xs = q.seam.map((p) => p.x);
        const width =
          Math.max(...q.outline.map((p) => p.x)) - Math.min(...q.outline.map((p) => p.x));
        expect(q.seam.length, `Variante ${v}`).toBeGreaterThanOrEqual(4);
        expect(Math.max(...xs) - Math.min(...xs), `Variante ${v}: Spanne`).toBeGreaterThanOrEqual(
          0.2 * width,
        );
        const dx = xs.slice(1).map((x, i) => Math.sign(x - xs[i]!));
        expect(new Set(dx).size, `Variante ${v}: Richtungswechsel`).toBeGreaterThan(1);
        // die Trennlinie liegt im Umriss: Licht- und Schattenfläche zusammen decken den Buckel
        expect(polyArea(q.lit) + polyArea(q.shade)).toBeCloseTo(polyArea(q.outline), 0);
      }
  });

  it('AK-M2 Nadel (Varianten 6/7) wird im Fern-Zeichner ein gedrungener Pfeiler mit gebrochener Kuppe (≥ 3 Punkte oben, Höhe < Breite)', () => {
    for (const v of [6, 7]) {
      const [q] = farRockGeom(v);
      const o = q!.outline;
      const top = Math.min(...o.map((p) => p.y));
      const xs = o.map((p) => p.x);
      expect(farRockGeom(v).length).toBe(1);
      expect(o.filter((p) => p.y < top + 4).length, 'gebrochene Kuppe').toBeGreaterThanOrEqual(3);
      expect(-top, 'gedrungen').toBeLessThan(Math.max(...xs) - Math.min(...xs));
      expect(-top).toBeLessThan(stampHeight('seaRock', v));
    }
  });

  it('AK-M2 Fern-Form: ≤ TREE_H hoch, in der Stempelbox, Farben aus DECOR_TONES, save/restore ausgeglichen, Matrix unverändert', () => {
    for (let v = 0; v < 8; v++) {
      const f = fakeCtx();
      paintDecorStamp(f.ctx, 'seaRock', v, 1, 0, 0, true);
      const ys = f.log.allPoints.map((p) => p.y),
        xs = f.log.allPoints.map((p) => p.x);
      expect(-Math.min(...ys), `Variante ${v}`).toBeLessThanOrEqual(TREE_H);
      expect(Math.min(...xs)).toBeGreaterThanOrEqual(STAMP_BOX.x0);
      expect(Math.max(...xs)).toBeLessThanOrEqual(STAMP_BOX.x1);
      expect(f.log.saves).toBe(f.log.restores);
      expect(f.log.matrix).toEqual([1, 0, 0, 1, 0, 0]);
      const styles = new Set(f.log.events.map((e) => e.style));
      for (const t of [DECOR_TONES.rockLight, DECOR_TONES.rockShade, DECOR_STAMP_TONES.rockWet])
        expect(styles.has(t)).toBe(true);
    }
  });

  it('AK-M2 Cache: Fern-Form hat eigenen Schlüssel (nur seaRock, nur Zoomstufe ≤ 0,5), STAMP_VARIANTS unverändert, Nahform unverändert', () => {
    expect(VARIANT_COUNT.seaRock).toBe(8);
    const mk = () =>
      ({ width: 0, height: 0, getContext: () => fakeCtx().ctx }) as unknown as HTMLCanvasElement;
    setDecorCanvasFactory(mk);
    resetDecorCache();
    for (const step of [0.25, 0.5, 0.75, 1]) {
      decorStampFor(5, 'seaRock', 0, step);
      decorStampFor(5, 'palm', 0, step);
    }
    expect(decorCacheKeys()).toEqual([
      'seaRock|0|1|far',
      'palm|0|1',
      'seaRock|0|2|far',
      'palm|0|2',
      'seaRock|0|3',
      'palm|0|3',
      'seaRock|0|4',
      'palm|0|4',
    ]);
    resetDecorCache();
    setDecorCanvasFactory(null);
    expect(FAR_ROCK_MAX_STEP).toBe(0.5);
  });
});
