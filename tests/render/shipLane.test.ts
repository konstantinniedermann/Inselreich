import { describe, expect, it } from 'vitest';
import { laneTicks, seaLanes } from '../../src/sim/islands';
import {
  MIN_SHIP_CSS_PX,
  lanePoints,
  pointAt,
  seaShipAfter,
  shipAt,
  shipPose,
  shipScale,
} from '../../src/render/shipLane';
import { SHIP_W_PX } from '../../src/render/ship';
import { project } from '../../src/render/iso';
import { worldToScreen } from '../../src/render/camera';
import { foundKontor2Literal, seaWorld, shipLiteral } from '../sim/seaHelpers';
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
    expect(seaLanes(w.islands).length).toBeGreaterThan(0);
  });
  it('AK-E4-15 seaShipAfter: südöstlich der Tiefenmitte danach, nordwestlich davor', () => {
    const isl = { ox: 10, oy: 10, width: 8, height: 6 } as Island; // Mitte 10 + 10 + 7 = 27
    expect(seaShipAfter({ x: 20, y: 12, island: null }, isl)).toBe(true);
    expect(seaShipAfter({ x: 13, y: 12, island: null }, isl)).toBe(false);
  });
  it('AK-E4-15 shipScale: ≥ 12 CSS-px bei 0,25 und 0,125; bei Zoom 1 Faktor 1', () => {
    expect(MIN_SHIP_CSS_PX).toBe(12);
    for (const z of [0.25, 0.125]) expect(shipScale(z) * SHIP_W_PX * z).toBeGreaterThanOrEqual(12);
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
