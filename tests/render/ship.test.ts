import { describe, expect, it } from 'vitest';
import { drawShip, SAUM, SAUM_PX, shipShadow, shipTile } from '../../src/render/ship';
import { PALETTE, mixHex, rgbOfCss } from '../../src/render/palette';
import { fakeCtx } from './fakeCtx';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { home, adjacentOf, createWorld, tileAt } from '../../src/sim/world';
import type { Order } from '../../src/sim/types';

const order: Order = { period: 1, good: 'wood', amount: 5, reward: 100, due: 999 };

describe('Händlerschiff', () => {
  it('AK-A1-04 ohne Auftrag kein Schiff', () => {
    const world = createWorld(1);
    world.order = null;
    expect(shipTile(world)).toBeNull();
  });
  it('AK-ISO-11 createWorld(1): Schiff auf dem Wasserfeld am Kontor mit dem grössten x + y', () => {
    const world = createWorld(1);
    world.order = order;
    const k = world.buildings[home(world).kontorId];
    if (!k) throw new Error('Kontor fehlt');
    const def = BUILDING_DEFS[k.defId];
    const water = adjacentOf(home(world), k.x, k.y, def.w, def.h).filter(
      (p) => tileAt(home(world), p.x, p.y)?.terrain === 'water',
    );
    expect(water.length).toBeGreaterThan(0);
    const best = Math.max(...water.map((p) => p.x + p.y));
    const ties = water.filter((p) => p.x + p.y === best);
    const expected = ties.reduce((a, b) => (b.x < a.x ? b : a));
    expect(shipTile(world)).toEqual(expected);
  });
  it('AK-ISO-11 Gleichstand (kx + 2, ky + 1) und (kx + 1, ky + 2) → (kx + 1, ky + 2), deterministisch', () => {
    const world = createWorld(1);
    world.order = order;
    const k = world.buildings[home(world).kontorId]!;
    for (const t of home(world).tiles) t.terrain = 'grass';
    for (const [x, y] of [
      [k.x + 2, k.y + 1],
      [k.x + 1, k.y + 2],
    ] as const)
      home(world).tiles[y * home(world).width + x]!.terrain = 'water';
    expect(shipTile(world)).toEqual({ x: k.x + 1, y: k.y + 2 });
    expect(shipTile(world)).toEqual({ x: k.x + 1, y: k.y + 2 });
  });

  it('ISO §5 shipShadow: konvexes Polygon im Kachelraum um die Kachel, nach (+3, +1) versetzt, gleiche Orientierung wie die Baumschatten', () => {
    const poly = shipShadow({ x: 12, y: 9 });
    expect(poly.length).toBeGreaterThanOrEqual(6);
    const cx = poly.reduce((s, p) => s + p.x, 0) / poly.length,
      cy = poly.reduce((s, p) => s + p.y, 0) / poly.length;
    expect(cx).toBeGreaterThan(12.5);
    expect(cy).toBeGreaterThan(9.5);
    expect((cx - 12.5) / (cy - 9.5)).toBeCloseTo(3, 5);
    const area =
      poly.reduce(
        (s, p, i) =>
          s + (p.x * poly[(i + 1) % poly.length]!.y - poly[(i + 1) % poly.length]!.x * p.y),
        0,
      ) / 2;
    expect(area).toBeGreaterThan(0);
    for (const p of poly) expect(Math.hypot(p.x - 12.5, p.y - 9.5)).toBeLessThan(1);
  });

  it('Spec 4.2 Rumpf und Segel nur aus Palettenfarben (keine eigenen Hex-Werte)', () => {
    const { ctx, log } = fakeCtx();
    drawShip(ctx, { x: 0, y: 0, zoom: 1 }, { x: 5, y: 5 }, 0);
    expect(new Set(log.fillSet)).toEqual(
      new Set([mixHex(PALETTE.roofWood, PALETTE.wallTimber, 0.4), PALETTE.wallLime]),
    );
  });

  describe('SEE-F3 Schiffskontrast (R399: Kontrast >= 2,0 auf jeder Meeresfarbe)', () => {
    const lin = (v: number): number => {
      const c = v / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    };
    const lum = (css: string): number => {
      const [r, g, b] = rgbOfCss(css);
      return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
    };
    /** WCAG-Leuchtdichtekontrast zweier Farben (opak). */
    const contrastRatio = (a: string, b: string): number => {
      const x = lum(a),
        y = lum(b);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
    const WATERS = [PALETTE.waterDeep, PALETTE.waterMid, PALETTE.waterShallow];
    const far = { x: 0, y: 0, zoom: 0.5 };
    const strokes = (zoom: number) => {
      const { ctx, log } = fakeCtx();
      drawShip(ctx, { x: 0, y: 0, zoom }, { x: 5, y: 5 }, 0);
      return log.events.filter((e) => e.op === 'stroke' || e.op === 'fill');
    };

    it('AK-S1 contrastRatio: Schwarz/Weiss 21, gleiche Farbe 1', () => {
      expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
      expect(contrastRatio('#336699', '#336699')).toBeCloseTo(1, 5);
    });
    it('AK-S1 Ausgangswert: Rumpf allein verschwindet auf Tief- und Mittelwasser (< 1,5)', () => {
      const hull = mixHex(PALETTE.roofWood, PALETTE.wallTimber, 0.4);
      expect(contrastRatio(hull, PALETTE.waterDeep)).toBeLessThan(1.5);
      expect(contrastRatio(hull, PALETTE.waterMid)).toBeLessThan(1.5);
    });
    it('AK-S2 / R399 gemessen wird der Saumton SAUM (umgibt Rumpf und Segel) gegen jedes Wasser: >= 2,0', () => {
      for (const w of WATERS) expect(contrastRatio(SAUM, w)).toBeGreaterThanOrEqual(2.0);
    });
    it('AK-S2 Saum ist ein Palettenton (foam), kein neuer Ton', () => {
      expect(SAUM).toBe(PALETTE.foam);
    });
    it('AK-S2 Fernzoom (<= 0,5): Saum-Striche (Breite SAUM_PX in Bildpunkten) vor Rumpf und Segel, Aufrufzahl <= +3', () => {
      const near = strokes(1);
      const evs = strokes(far.zoom);
      expect(evs.length - near.length).toBeLessThanOrEqual(3);
      expect(evs.length - near.length).toBeGreaterThanOrEqual(1);
      const saum = evs.filter((e) => e.op === 'stroke' && e.style === SAUM);
      expect(saum.length).toBe(2);
      for (const e of saum) expect(e.lineWidth).toBe(SAUM_PX);
      // Rumpfsaum kommt vor dem ersten Rumpf-Fill, Segelsaum vor dem Segel-Fill
      const fills = evs.map((e, i) => (e.op === 'fill' ? i : -1)).filter((i) => i >= 0);
      expect(evs.indexOf(saum[0]!)).toBeLessThan(fills[0]!);
      expect(evs.indexOf(saum[1]!)).toBeLessThan(fills[1]!);
      expect(evs.indexOf(saum[1]!)).toBeGreaterThan(fills[0]!);
    });
    it('AK-S2 Saumbreite in Bildpunkten gleich bei Zoom 0,25 und 0,5 (nicht mit Schiffsgrösse skaliert)', () => {
      const a = strokes(0.25).find((e) => e.style === SAUM)!;
      const b = strokes(0.5).find((e) => e.style === SAUM)!;
      expect(a.lineWidth).toBe(b.lineWidth);
    });
    it('AK-S2 Nahzoom (> 0,5): kein Saum, Striche nur in Umrissfarbe', () => {
      for (const z of [0.51, 1, 2]) {
        expect(strokes(z).some((e) => e.style === SAUM)).toBe(false);
      }
    });
    it('AK-S2 save/restore ausgeglichen im Fernzoom', () => {
      const { ctx, log } = fakeCtx();
      drawShip(ctx, { x: 0, y: 0, zoom: 0.25 }, { x: 5, y: 5 }, 0);
      expect(log.saves).toBe(log.restores);
    });
  });
});
