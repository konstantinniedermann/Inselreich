import { describe, expect, it } from 'vitest';
import { laneTicks } from '../../src/sim/islands';
import {
  MIN_SHIP_CSS_PX,
  lanePoints,
  pointAt,
  seaShipAfter,
  shipAt,
  shipPose,
  shipScale,
} from '../../src/render/shipLane';
import { drawShip } from '../../src/render/ship';
import { fakeCtx } from './fakeCtx';
import { project } from '../../src/render/iso';
import { worldToScreen } from '../../src/render/camera';
import { decree } from '../../src/sim/council';
import { foundKontor2Literal, laneWorld, seaWorld, shipLiteral } from '../sim/seaHelpers';
import type { Island } from '../../src/sim/types';

describe('M12 E4 Schiffsposition', () => {
  const pts = [
    { x: 0, y: 0 },
    { x: 3, y: 4 }, // Länge 5
    { x: 3, y: 9 }, // Länge 5, gesamt 10
  ];
  it('AK-E4-12 pointAt: t = 0 erster, t = 1 letzter Punkt', () => {
    expect(pointAt(pts, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAt(pts, 1)).toEqual({ x: 3, y: 9 });
  });
  it('AK-E4-12 pointAt: halbe Länge trifft den Wegpunkt exakt (Längenanteil, nicht Segmentanteil)', () => {
    const p = pointAt(pts, 0.5);
    expect(p.x).toBeCloseTo(3, 9);
    expect(p.y).toBeCloseTo(4, 9);
    const q = pointAt(pts, 0.75); // 7,5 → 2,5 im zweiten Segment
    expect(q.x).toBeCloseTo(3, 9);
    expect(q.y).toBeCloseTo(6.5, 9);
  });
  it('AK-E4-12 shipPose: left = laneTicks → Start-Anker, left = 0 → Ziel; liegend am Anker des Hafens', () => {
    const w = seaWorld();
    const anchor = (i: number) => ({
      x: w.islands[i]!.ox + w.islands[i]!.anchor.x + 0.5,
      y: w.islands[i]!.oy + w.islands[i]!.anchor.y + 0.5,
    });
    const total = laneTicks(w.islands, 0, 1);
    expect(total).toBeGreaterThan(0);
    const s = shipLiteral(w, { port: 0, to: 1, left: total });
    expect(shipPose(w, s)).toMatchObject(anchor(0));
    s.left = 0;
    expect(shipPose(w, s)).toMatchObject(anchor(1));
    const idle = shipLiteral(w, { port: 1, to: null });
    expect(shipPose(w, idle)).toEqual({ ...anchor(1), island: 1 });
  });
  it('AK-E4-12 Richtung 2 → 0 nutzt die umgedrehte Lane; nur lesend', () => {
    const w = seaWorld();
    const fwd = lanePoints(w, 0, 2);
    const back = lanePoints(w, 2, 0);
    expect(back).toEqual([...fwd].reverse());
    const total = laneTicks(w.islands, 0, 2);
    const s = shipLiteral(w, { port: 2, to: 0, left: total });
    const before = JSON.stringify(w.ships);
    const a = w.islands[2]!;
    expect(shipPose(w, s)).toMatchObject({
      x: a.ox + a.anchor.x + 0.5,
      y: a.oy + a.anchor.y + 0.5,
    });
    expect(JSON.stringify(w.ships)).toBe(before);
  });
  it('AK-E4-15 seaShipAfter: südöstlich der Tiefenmitte danach, nordwestlich davor', () => {
    const isl = { ox: 10, oy: 10, width: 8, height: 6 } as Island; // Mitte 10 + 10 + 7 = 27
    expect(seaShipAfter({ x: 20, y: 12, island: null }, isl)).toBe(true);
    expect(seaShipAfter({ x: 13, y: 12, island: null }, isl)).toBe(false);
  });
  it('AK-E4-15 shipScale: gezeichnete Silhouette ≥ 12 CSS-px bei 0,25 und 0,125; bei Zoom 1 Faktor 1', () => {
    expect(MIN_SHIP_CSS_PX).toBeGreaterThanOrEqual(12);
    for (const z of [0.25, 0.125]) {
      const { ctx, log } = fakeCtx();
      drawShip(ctx, { x: 0, y: 0, zoom: z }, { x: 0, y: 0 }, 0, shipScale(z));
      const xs = log.events.filter((e) => e.op === 'fill').flatMap((e) => e.points.map((p) => p.x));
      expect(xs.length).toBeGreaterThan(0);
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThanOrEqual(12);
    }
    expect(shipScale(1)).toBe(1);
  });
  it('AK-E4-15 shipAt trifft die Schiffsmitte, verfehlt eine Kachel daneben; das oberste gewinnt', () => {
    const w = seaWorld();
    foundKontor2Literal(w, 1);
    const a = shipLiteral(w, { port: 0, to: null });
    const cam = { x: -300, y: -300, zoom: 1 };
    const pose = shipPose(w, a);
    const c = worldToScreen(cam, project(pose.x, pose.y));
    expect(shipAt(w, cam, c.x, c.y)).toBe(a.id);
    const off = worldToScreen(cam, project(pose.x + 1, pose.y));
    expect(shipAt(w, cam, off.x, off.y)).toBeNull();
    const b = shipLiteral(w, { port: 0, to: null }); // gleiche Tiefe → grössere id oben
    expect(shipAt(w, cam, c.x, c.y)).toBe(b.id);
  });
});

describe('SEE-F1 Schiffspose folgt der Wasserroute', () => {
  const onLand = (w: ReturnType<typeof seaWorld>, x: number, y: number): boolean => {
    const i = w.islands.find(
      (s) => x >= s.ox && y >= s.oy && x < s.ox + s.width && y < s.oy + s.height,
    );
    if (!i) return false;
    const t = i.tiles[(Math.floor(y) - i.oy) * i.width + (Math.floor(x) - i.ox)]!;
    return t.terrain !== 'water';
  };
  const pairs = [
    [0, 1],
    [1, 0],
    [0, 2],
    [2, 0],
    [1, 2],
    [2, 1],
  ] as const;
  const poses = (w: ReturnType<typeof seaWorld>, from: number, to: number) => {
    const total = laneTicks(w.islands, from, to);
    const out = [];
    for (let left = total; left >= 0; left--)
      out.push(shipPose(w, shipLiteral(w, { port: from, to, left })));
    return out;
  };
  it('AK8 Start = Anker, Ende = Anker, nie auf Land', () => {
    const w = seaWorld();
    for (const [from, to] of pairs) {
      const ps = poses(w, from, to);
      const anchor = (i: number) => ({
        x: w.islands[i]!.ox + w.islands[i]!.anchor.x + 0.5,
        y: w.islands[i]!.oy + w.islands[i]!.anchor.y + 0.5,
      });
      expect(ps[0]).toMatchObject(anchor(from));
      expect(ps[ps.length - 1]).toMatchObject(anchor(to));
      for (const p of ps) expect(onLand(w, p.x, p.y), `${from}->${to} @${p.x},${p.y}`).toBe(false);
    }
  });
  it('AK9 Schritt je Tick <= 1,5 Kacheln, Richtungswechsel je Schritt <= 30 Grad', () => {
    const w = seaWorld();
    for (const [from, to] of pairs) {
      const ps = poses(w, from, to);
      let prev: number | null = null;
      for (let i = 1; i < ps.length; i++) {
        const dx = ps[i]!.x - ps[i - 1]!.x,
          dy = ps[i]!.y - ps[i - 1]!.y;
        expect(Math.hypot(dx, dy)).toBeLessThanOrEqual(1.5);
        if (Math.hypot(dx, dy) < 1e-9) continue;
        const ang = Math.atan2(dy, dx);
        if (prev !== null) {
          let d = Math.abs(ang - prev);
          if (d > Math.PI) d = 2 * Math.PI - d;
          expect(d).toBeLessThanOrEqual(Math.PI / 6 + 1e-9);
        }
        prev = ang;
      }
    }
  });
  it('AK10 Rückrichtung = umgekehrte Route; Pose folgt der Route', () => {
    const w = seaWorld();
    for (const [a, b] of [
      [0, 1],
      [0, 2],
      [1, 2],
    ] as const) {
      expect(lanePoints(w, b, a)).toEqual([...lanePoints(w, a, b)].reverse());
      expect(lanePoints(w, a, b).length).toBeGreaterThan(2);
    }
    expect(lanePoints(w, 0, 1)).toBe(lanePoints(w, 0, 1)); // Cache: je Frame keine Kopie
    const fwd = poses(w, 0, 1);
    const back = poses(w, 1, 0);
    expect(back[0]).toMatchObject({ x: fwd[fwd.length - 1]!.x, y: fwd[fwd.length - 1]!.y });
  });
});

describe('I-153 Seerecht Pose und Cache', () => {
  const near = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    expect(a.x).toBeCloseTo(b.x, 9);
    expect(a.y).toBeCloseTo(b.y, 9);
  };
  it('AK-SR-15 a: Beschluss ändert die Pose bei halber Strecke nicht', () => {
    const { w, island } = laneWorld(30);
    const s = shipLiteral(w, { port: 0, to: island, left: 150 });
    const mid = pointAt(lanePoints(w, 0, island), 0.5);
    near(shipPose(w, s), mid); // füllt den Cache
    w.council[4] = 'open';
    decree(w, 4, 'C');
    expect(s.left).toBe(120);
    near(shipPose(w, s), mid);
  });
  it('AK-SR-15 b: kurz vor dem Ziel springt die Pose nicht', () => {
    const { w, island } = laneWorld(30);
    const s = shipLiteral(w, { port: 0, to: island, left: 7 });
    const pts = lanePoints(w, 0, island);
    const before = shipPose(w, s);
    near(before, pointAt(pts, 1 - 7 / 300));
    w.council[4] = 'open';
    decree(w, 4, 'C');
    expect(s.left).toBe(6);
    const after = shipPose(w, s);
    near(after, pointAt(pts, 1 - 6 / 240));
    let len = 0;
    for (let i = 1; i < pts.length; i++)
      len += Math.hypot(pts[i]!.x - pts[i - 1]!.x, pts[i]!.y - pts[i - 1]!.y);
    expect(Math.hypot(after.x - before.x, after.y - before.y)).toBeLessThanOrEqual(len / (8 * 30));
  });
  it('AK-SR-15 c: nach dem Beschluss abgelegtes Schiff liegt am Start-Anker', () => {
    const { w, island } = laneWorld(30);
    const probe = shipLiteral(w, { port: 0, to: island, left: 150 });
    shipPose(w, probe); // Cache mit 10er-Wert füllen
    w.council[4] = 'open';
    decree(w, 4, 'C');
    // mit 10er-Cache wäre t = 1 - 240/300 = 0,2
    const s = shipLiteral(w, { port: 0, to: island, left: 240 });
    near(shipPose(w, s), pointAt(lanePoints(w, 0, island), 0));
  });
  it('AK-SR-15 Review: neue Welt ohne Beschluss rechnet wieder mit 10 je Feld', () => {
    const a = laneWorld(30);
    a.w.council[4] = 'open';
    decree(a.w, 4, 'C');
    shipPose(a.w, shipLiteral(a.w, { port: 0, to: a.island, left: 100 }));
    const b = laneWorld(30);
    const s = shipLiteral(b.w, { port: 0, to: b.island, left: 150 });
    near(shipPose(b.w, s), pointAt(lanePoints(b.w, 0, b.island), 0.5));
  });
});
