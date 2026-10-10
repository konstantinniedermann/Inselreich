import { describe, expect, it } from 'vitest';
import {
  createSilhouetteCache,
  hitIsland,
  mapDots,
  mapLayout,
  mapToTile,
  tileToMap,
  type RasterFactory,
} from '../../src/render/seaMap';
import { project } from '../../src/render/iso';
import { shipPose } from '../../src/render/shipLane';
import { createWorld } from '../../src/sim/world';
import { seaWorld, shipLiteral } from '../sim/seaHelpers';
import { fakeCtx, type FakeCtx } from './fakeCtx';

const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const W = 360,
  H = 240,
  PAD = 12;

function fakeFactory(logs: FakeCtx[] = []): RasterFactory {
  return () => {
    const { ctx, log } = fakeCtx();
    logs.push(log);
    return { ctx, image: {} as CanvasImageSource };
  };
}

describe('mapLayout (AK-S1)', () => {
  it('bildet alle Inselrechtecke samt Rand in die Karte ab, Seeds 1-10', () => {
    for (const seed of SEEDS) {
      const w = createWorld(seed);
      const l = mapLayout(w, W, H, PAD);
      for (const s of w.islands) {
        for (const [x, y] of [
          [s.ox, s.oy],
          [s.ox + s.width, s.oy],
          [s.ox, s.oy + s.height],
          [s.ox + s.width, s.oy + s.height],
        ] as const) {
          const m = tileToMap(l, x, y);
          expect(m.x).toBeGreaterThanOrEqual(PAD - 1e-6);
          expect(m.x).toBeLessThanOrEqual(W - PAD + 1e-6);
          expect(m.y).toBeGreaterThanOrEqual(PAD - 1e-6);
          expect(m.y).toBeLessThanOrEqual(H - PAD + 1e-6);
        }
      }
    }
  });
  it('behält das Seitenverhältnis und ist für dieselbe Welt gleich', () => {
    const w = createWorld(3);
    const l = mapLayout(w, W, H, PAD);
    expect(mapLayout(createWorld(3), W, H, PAD)).toEqual(l);
    const a = tileToMap(l, 0, 0),
      b = tileToMap(l, 10, 0),
      p0 = project(0, 0),
      p1 = project(10, 0);
    expect((b.x - a.x) / (p1.x - p0.x)).toBeCloseTo(l.scale, 9);
    expect((b.y - a.y) / (p1.y - p0.y)).toBeCloseTo(l.scale, 9);
  });
  it('hängt nur an der Inselgeometrie, nicht an Schiffen', () => {
    const w = seaWorld();
    const before = mapLayout(w, W, H, PAD);
    shipLiteral(w);
    w.tick += 50;
    expect(mapLayout(w, W, H, PAD)).toEqual(before);
  });
});

describe('tileToMap / mapToTile (AK-S2)', () => {
  it('sind zueinander invers, 200 Punkte', () => {
    const l = mapLayout(createWorld(5), W, H, PAD);
    for (let i = 0; i < 200; i++) {
      const x = ((i * 37) % 211) - 60 + i / 7,
        y = ((i * 53) % 197) - 40 + i / 11;
      const m = tileToMap(l, x, y);
      const t = mapToTile(l, m.x, m.y);
      expect(t.x).toBeCloseTo(x, 6);
      expect(t.y).toBeCloseTo(y, 6);
    }
  });
});

describe('hitIsland (AK-S3)', () => {
  it('liefert die Insel für eine Landkachel jeder Insel, Seeds 1-10', () => {
    for (const seed of SEEDS) {
      const w = createWorld(seed);
      const l = mapLayout(w, W, H, PAD);
      w.islands.forEach((s, i) => {
        const k = s.tiles.findIndex((t) => t.terrain !== 'water');
        const m = tileToMap(l, s.ox + (k % s.width) + 0.5, s.oy + Math.floor(k / s.width) + 0.5);
        expect(hitIsland(w, l, m.x, m.y)).toBe(i);
      });
    }
  });
  it('liefert null auf offenem Wasser (Ecke der Karte)', () => {
    const w = createWorld(2);
    const l = mapLayout(w, W, H, PAD);
    expect(hitIsland(w, l, 0, 0)).toBeNull();
    expect(hitIsland(w, l, W - 1, H - 1)).toBeNull();
  });
  it('liefert null für eine Wasserkachel innerhalb eines Inselrechtecks, Seeds 1-10', () => {
    let found = 0;
    for (const seed of SEEDS) {
      const w = createWorld(seed);
      const l = mapLayout(w, W, H, PAD);
      w.islands.forEach((s, i) => {
        const k = s.tiles.findIndex((t) => t.terrain === 'water');
        if (k < 0) return;
        const x = k % s.width,
          y = Math.floor(k / s.width);
        const m = tileToMap(l, s.ox + x + 0.5, s.oy + y + 0.5);
        // nur prüfen, wenn keine andere Insel dort Land hat
        const other = hitIsland(w, l, m.x, m.y);
        if (other !== null && other !== i) return;
        found++;
        expect(hitIsland(w, l, m.x, m.y)).toBeNull();
      });
    }
    expect(found).toBeGreaterThan(0);
  });
  it('bei überlappenden Rechtecken gewinnt die Insel mit Land unter dem Punkt', () => {
    const w = createWorld(2);
    const a = w.islands[0]!,
      b = w.islands[1]!;
    // Rechtecke künstlich überlagern: b liegt auf a, a hat dort Wasser, b hat Land
    b.ox = a.ox;
    b.oy = a.oy;
    const wa = a.tiles.findIndex((t) => t.terrain === 'water');
    const x = wa % a.width,
      y = Math.floor(wa / a.width);
    const bi = b.tiles.findIndex((t, i) => t.terrain !== 'water' && i === y * b.width + x);
    if (bi < 0) b.tiles[y * b.width + x]!.terrain = 'grass';
    const l = mapLayout(w, W, H, PAD);
    const m = tileToMap(l, a.ox + x + 0.5, a.oy + y + 0.5);
    expect(hitIsland(w, l, m.x, m.y)).toBe(1);
  });
});

describe('mapDots (AK-S4)', () => {
  it('lässt Schiffe ohne Route weg, nach id, Hafenschiff am Anker', () => {
    const w = seaWorld();
    const route = { a: 0, b: 1, ab: [], ba: [] };
    shipLiteral(w, { route: null });
    const s2 = shipLiteral(w, { route, port: 0, to: null });
    const dots = mapDots(w);
    expect(dots.map((d) => d.id)).toEqual([s2.id]);
    const h = w.islands[0]!;
    expect(dots[0]!.x).toBeCloseTo(h.ox + h.anchor.x + 0.5, 9);
    expect(dots[0]!.y).toBeCloseTo(h.oy + h.anchor.y + 0.5, 9);
  });
  it('fahrendes Schiff liegt auf der Linie (shipPose), Reihenfolge nach id, keine Mutation', () => {
    const w = seaWorld();
    const route = { a: 0, b: 1, ab: [], ba: [] };
    const s1 = shipLiteral(w, { route, port: 0, to: 1, left: 1000 });
    const s2 = shipLiteral(w, { route, port: 1, to: 0, left: 5 });
    w.ships.reverse();
    const copy = structuredClone(w);
    const dots = mapDots(w);
    expect(dots.map((d) => d.id)).toEqual([s1.id, s2.id].sort((a, b) => a - b));
    for (const d of dots) {
      const p = shipPose(
        w,
        w.ships.find((s) => s.id === d.id)!,
      );
      expect(d.x).toBe(p.x);
      expect(d.y).toBe(p.y);
    }
    expect(w).toEqual(copy);
  });
});

describe('Silhouetten-Cache (AK-S5, AK-S6)', () => {
  it('rastert je Insel und Skala einmal', () => {
    const w = createWorld(4);
    const cache = createSilhouetteCache(fakeFactory());
    for (let i = 0; i < 3; i++) for (const s of w.islands) cache.get(s, 0.1);
    expect(cache.rasterCount).toBe(w.islands.length);
    cache.get(w.islands[0]!, 0.2);
    expect(cache.rasterCount).toBe(w.islands.length + 1);
  });
  it('rastert eine neue Welt (Laden) neu', () => {
    const cache = createSilhouetteCache(fakeFactory());
    const w1 = createWorld(4);
    w1.islands.forEach((s) => cache.get(s, 0.1));
    const w2 = structuredClone(w1);
    w2.islands.forEach((s) => cache.get(s, 0.1));
    expect(cache.rasterCount).toBe(2 * w1.islands.length);
  });
  it('Roden (forest -> grass) ändert die Maske nicht', () => {
    const w = createWorld(4);
    const cache = createSilhouetteCache(fakeFactory());
    const home = w.islands[0]!;
    const before = cache.get(home, 0.1).land;
    for (const t of home.tiles) if (t.terrain === 'forest') t.terrain = 'grass';
    expect(cache.get(home, 0.1).land).toBe(before);
    expect(cache.rasterCount).toBe(1);
  });
  it('Maske: Landfläche == Anzahl Nicht-Wasser-Kacheln, alle Inselarten, Seeds 1-10', () => {
    const kinds = new Set<string>();
    for (const seed of SEEDS) {
      const w = createWorld(seed);
      for (const s of w.islands) {
        kinds.add(s.kind);
        const logs: FakeCtx[] = [];
        const sil = createSilhouetteCache(fakeFactory(logs)).get(s, 0.1);
        const n = s.tiles.filter((t) => t.terrain !== 'water').length;
        expect(sil.land).toBe(n);
        const area = logs[0]!.events
          .filter((e) => e.op === 'fillRect')
          .reduce(
            (a, e) => a + (e.points[1]!.x - e.points[0]!.x) * (e.points[2]!.y - e.points[1]!.y),
            0,
          );
        expect(area).toBe(n * sil.r * sil.r);
      }
    }
    expect(kinds.size).toBeGreaterThanOrEqual(3);
  });
  it('Erstes Rastern: ein Lauf je Insel, ein fillRect je Landstreifen (Zähler statt Uhr)', () => {
    const w = createWorld(7);
    const logs: FakeCtx[] = [];
    const cache = createSilhouetteCache(fakeFactory(logs));
    w.islands.forEach((s) => cache.get(s, 0.1));
    expect(cache.rasterCount).toBe(w.islands.length);
    let runs = 0,
      land = 0;
    for (const s of w.islands)
      for (let y = 0; y < s.height; y++) {
        const isLand = (x: number) => s.tiles[y * s.width + x]!.terrain !== 'water';
        for (let x = 0; x < s.width; x++)
          if (isLand(x)) {
            land++;
            if (x === 0 || !isLand(x - 1)) runs++;
          }
      }
    const fills = logs.reduce((n, l) => n + l.events.filter((e) => e.op === 'fillRect').length, 0);
    expect(fills).toBe(runs);
    expect(fills).toBeLessThan(land);
  });
});
