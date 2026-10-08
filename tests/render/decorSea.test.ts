import { describe, expect, it } from 'vitest';
import { laneTicks } from '../../src/sim/islands';
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
  minStampScale,
  stampWidthPx,
  drawDecorStamp,
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
import { PALETTE, rgbOfCss } from '../../src/render/palette';
import { HULL } from '../../src/render/ship';
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

  it('T6 Wrack und Felseiland haben bei Zoom ≤ 0,25 mindestens ≈ 10 CSS-px Breite, aber weniger als das Schiff (16 px)', () => {
    for (const k of ['wreck', 'islet'] as const)
      for (let v = 0; v < 4; v++)
        for (const z of [0.125, 0.25]) {
          const px = stampWidthPx(k, v) * z * minStampScale(k, v, z);
          expect(px, `${k}${v}@${z}`).toBeGreaterThanOrEqual(10 - 1e-6);
          // die Mindestbreite greift nur, wo der Stempel kleiner wäre, und bleibt unter dem Schiff (16 px)
          if (minStampScale(k, v, z) > 1) expect(px).toBeCloseTo(10, 6);
        }
    expect(minStampScale('wreck', 0, 1)).toBe(1);
    expect(minStampScale('seaRock', 0, 0.25)).toBe(1);
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
  }, 25_000); // lokal bis 2,8 s im Gesamtlauf (REL-07: sortedObjects mit WALD-02-Kronen), Timeout >= 8 x (R270)

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
        for (const e of els) {
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
    const pts = paint('seaRock', v).log.allPoints.map((p) => ({ x: p.x, y: p.y }));
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
