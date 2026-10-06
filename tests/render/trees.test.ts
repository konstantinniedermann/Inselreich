import { describe, expect, it } from 'vitest';
import { placeBuilding } from '../../src/sim/build';
import { home, createWorld } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import {
  ISO_H,
  ISO_W,
  TREE_VARIANTS,
  ZOOM_STEPS,
  project,
  sortedObjects,
  pointBounds,
} from '../../src/render/iso';
import { PALETTE, SHADOW, SIGNAL_NAMES, mixHex, rgbOfCss } from '../../src/render/palette';
import { deltaE2000, rgbToLab } from './deltaE';
import {
  CONIFER_COLOR,
  LIGHT_CROWN_COLOR,
  LIGHT_TRUNK_COLOR,
  MAPLE_COLOR,
  PINE_COLOR,
  STAMP_BELOW,
  STAMP_W,
  TREE_H,
  crownBase,
  crownCap,
  crownShade,
  crownsFor,
  drawTreeStamp,
  paintStamp,
  setCanvasFactory,
  treeBounds,
  treeCacheSize,
  treeShadow,
  resetTreeCache,
} from '../../src/render/trees';
import { forceRect } from '../sim/helpers';
import { fakeCtx } from './fakeCtx';

const item = (id: number, x: number, y: number, variant: number) =>
  ({ kind: 'tree', id, fp: { x, y, w: 1, h: 1 }, key: 2 * x + 1 + 2 * y + 1, variant }) as const;

describe('Baumstempel', () => {
  it('ISO §6 crownsFor (L1): 2–8 Kronen je Variante, deterministisch, Fusspunkt höchstens 0,35 Kachel über der Kachel', () => {
    for (let v = 0; v < TREE_VARIANTS; v++) {
      const c = crownsFor(3, v);
      expect(c.length).toBeGreaterThanOrEqual(2);
      expect(c.length).toBeLessThanOrEqual(8);
      expect(crownsFor(3, v)).toEqual(c);
      for (const k of c) {
        expect(k.cx - k.r).toBeGreaterThanOrEqual(-0.35 - 1e-9);
        expect(k.cx + k.r).toBeLessThanOrEqual(1.35 + 1e-9);
        expect(k.cy - k.r).toBeGreaterThanOrEqual(-0.35 - 1e-9);
        expect(k.cy + k.r).toBeLessThanOrEqual(1.35 + 1e-9);
      }
    }
    expect(crownsFor(3, 0)).not.toEqual(crownsFor(4, 0));
  });

  it('AK-ISO-10 Baumstempel (L1): jeder Pfadpunkt in treeBounds; Eng-Stempel bleiben in der Spaltenbreite einer Kachel', () => {
    for (const seed of [3, 11, 12588])
      for (const step of ZOOM_STEPS)
        for (let v = 0; v < TREE_VARIANTS; v++) {
          const { ctx, log } = fakeCtx();
          paintStamp(ctx, seed, v, step);
          expect(log.allPoints.length).toBeGreaterThan(8);
          const it0 = item(0, 10, 7, v);
          const box = treeBounds(it0);
          const c = project(10.5, 7.5);
          for (const p of log.allPoints) {
            // Stempelpixel -> Weltpixel: Ursprung (ISO_W/2, TREE_H) liegt auf der Rautenmitte
            const wx = c.x + p.x / step - STAMP_W / 2;
            const wy = c.y + p.y / step - TREE_H;
            expect(wx).toBeGreaterThanOrEqual(box.x - 1e-6);
            expect(wx).toBeLessThanOrEqual(box.x + box.w + 1e-6);
            expect(wy).toBeGreaterThanOrEqual(box.y - 1e-6);
            expect(wy).toBeLessThanOrEqual(box.y + box.h + 1e-6);
            if (v % 8 >= 6) expect(Math.abs(wx - c.x)).toBeLessThanOrEqual(ISO_W / 2 + 1e-6);
          }
        }
  });

  it('AK-ISO-10 treeBounds (L1): Eng ist pointBounds der Kachelmitte mit Höhe TREE_H, Kern und Rand sind breiter', () => {
    const c = project(4.5, 9.5);
    expect(treeBounds(item(0, 4, 9, 7))).toEqual(pointBounds(4.5, 9.5, TREE_H));
    const b = treeBounds(item(0, 4, 9, 0));
    expect(b.w).toBeGreaterThan(ISO_W);
    expect(b.x + b.w / 2).toBeCloseTo(c.x, 9);
    expect(b.y).toBeCloseTo(c.y - TREE_H, 9);
    expect(b.y + b.h).toBeCloseTo(c.y + STAMP_BELOW, 9);
    expect(TREE_H).toBeCloseTo(1.1 * ISO_H, 9);
  });

  it('AK-R1-03 Stempel nutzt nur Palettenfarben (keine Signalfarben, kein Schatten)', () => {
    const allowed = new Set<string>([
      PALETTE.crown,
      crownShade(PALETTE.crown),
      crownCap(PALETTE.crown),
      crownShade(LIGHT_CROWN_COLOR),
      crownCap(LIGHT_CROWN_COLOR),
      crownShade(CONIFER_COLOR),
      crownCap(CONIFER_COLOR),
      mixHex(PALETTE.rockDark, PALETTE.earth, 0.5),
      CONIFER_COLOR,
      LIGHT_CROWN_COLOR,
      LIGHT_TRUNK_COLOR,
      PINE_COLOR,
      MAPLE_COLOR,
      crownShade(PINE_COLOR),
      crownCap(PINE_COLOR),
      crownShade(MAPLE_COLOR),
      crownCap(MAPLE_COLOR),
    ]);
    const signals = new Set<string>(SIGNAL_NAMES.map((n) => PALETTE[n]));
    for (let v = 0; v < TREE_VARIANTS; v++)
      for (const seed of [3, 4, 8, 12]) {
        const { ctx, log } = fakeCtx();
        paintStamp(ctx, seed, v, 1);
        for (const f of log.fillSet) {
          expect(allowed.has(f), f).toBe(true);
          expect(signals.has(f)).toBe(false);
          expect(f).not.toBe(SHADOW);
        }
        expect(
          ([0, 1, 2, 3, 4] as const)
            .map(crownBase)
            .some((base) => log.fillSet.includes(crownCap(base))),
        ).toBe(true);
      }
    // neue Töne: ΔE2000 ≥ 20 zu den Signalfarben
    for (const c of [CONIFER_COLOR, LIGHT_CROWN_COLOR, LIGHT_TRUNK_COLOR, PINE_COLOR, MAPLE_COLOR])
      for (const n of SIGNAL_NAMES)
        expect(
          deltaE2000(rgbToLab(rgbOfCss(c)), rgbToLab(rgbOfCss(PALETTE[n]))),
          `${c} ~ ${n}`,
        ).toBeGreaterThanOrEqual(20);
  });

  it('R149 Baumarten (L1): je Seed ≥ 2 Arten über die Varianten, Radienverhältnis max/min ≥ 2,5, Radien 0,04–0,35', () => {
    for (const seed of [3, 11, 12588, 94108]) {
      const kinds = new Set<number>();
      let lo = Infinity,
        hi = 0;
      for (let v = 0; v < TREE_VARIANTS; v++)
        for (const c of crownsFor(seed, v)) {
          kinds.add(c.kind);
          lo = Math.min(lo, c.r);
          hi = Math.max(hi, c.r);
          expect(c.r).toBeGreaterThanOrEqual(0.04);
          expect(c.r).toBeLessThanOrEqual(0.35);
        }
      expect(kinds.size, `Seed ${seed}`).toBeGreaterThanOrEqual(2);
      expect(hi / lo, `Seed ${seed}`).toBeGreaterThanOrEqual(2.5);
    }
  });

  it('R149 Stempel zeigen die Körperfarben aller fünf Arten (über Seeds mit verschiedenem Waldtyp)', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 40; seed++)
      for (let v = 0; v < TREE_VARIANTS; v++) {
        const { ctx, log } = fakeCtx();
        paintStamp(ctx, seed, v, 1);
        for (const f of log.fillSet) seen.add(f);
      }
    for (const k of [0, 1, 2, 3, 4] as const) expect(seen.has(crownBase(k)), `Art ${k}`).toBe(true);
  });

  it('AK-ISO-10 treeShadow: Polygon im Kachelraum, nach rechts unten versetzt, deterministisch', () => {
    const it0 = item(0, 10, 7, 2);
    const poly = treeShadow(it0);
    expect(poly.length).toBeGreaterThanOrEqual(4);
    expect(treeShadow(it0)).toEqual(poly);
    const mx = poly.reduce((s, p) => s + p.x, 0) / poly.length;
    const my = poly.reduce((s, p) => s + p.y, 0) / poly.length;
    expect(mx).toBeGreaterThan(10.5);
    expect(my).toBeGreaterThan(7.5);
    for (const p of poly) {
      expect(Math.abs(p.x - 10.5)).toBeLessThan(1.2);
      expect(Math.abs(p.y - 7.5)).toBeLessThan(1.2);
    }
  });
});

function forestWorld(): { world: World; ids: number[] } {
  const world = createWorld(3);
  const k = world.buildings[home(world).kontorId]!;
  const x0 = k.x + 4,
    y0 = k.y + 4;
  forceRect(world, x0, y0, 3, 3, 'forest');
  const ids: number[] = [];
  for (let j = 0; j < 3; j++)
    for (let i = 0; i < 3; i++) ids.push((y0 + j) * home(world).width + x0 + i);
  return { world, ids };
}
const treeIds = (w: World) =>
  sortedObjects(w)
    .filter((i) => i.kind === 'tree')
    .map((i) => i.id);

describe('Baumstempel und Bebauung', () => {
  it('AK-R1-06 (ISO, R96) nach Bebauung einer Waldkachel fehlt deren Stempel, die 8 Nachbarn bleiben', () => {
    const { world, ids } = forestWorld();
    const before = new Set(treeIds(world));
    for (const id of ids) expect(before.has(id)).toBe(true);
    // Haus auf die Mitte: placeBuilding verlangt freies Gras; die Wahl der Kachel ändert den Stempel-Test nicht
    const mid = ids[4]!;
    const mx = mid % home(world).width,
      my = (mid / home(world).width) | 0;
    world.money = 100000;
    const r = placeBuilding(world, 'house', mx, my);
    if (!r.ok) {
      // Wald ist nicht bebaubar: Gebäude roh setzen (wie in renderer.test.ts), layoutKey ändert sich trotzdem
      const bid = world.nextBuildingId++;
      world.buildings[bid] = {
        id: bid,
        defId: 'house',
        x: mx,
        y: my,
        connected: false,
        progress: 0,
        state: 'ok',
        island: 0,
      };
      home(world).tiles[mid]!.buildingId = bid;
    }
    const after = new Set(treeIds(world));
    expect(after.has(mid)).toBe(false);
    for (const id of ids) if (id !== mid) expect(after.has(id), `Nachbar ${id}`).toBe(true);
    expect(after.size).toBe(before.size - 1);
  });
});

/** Fake-Offscreen-Canvas für den Cache-Test. */
function fakeCanvasFactory(): () => HTMLCanvasElement {
  return () => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  };
}

describe('Baumstempel-Cache', () => {
  it('ISO §16 Zoom-Cache: nach 200 zufälligen Zoomwerten in [0,5, 2] ≤ TREE_VARIANTS × ZOOM_STEPS.length Einträge', () => {
    setCanvasFactory(fakeCanvasFactory());
    resetTreeCache();
    let s = 12345;
    const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
    for (let i = 0; i < 200; i++) {
      const zoom = 0.5 + rnd() * 1.5;
      const { ctx } = fakeCtx();
      drawTreeStamp(ctx, { x: 0, y: 0, zoom }, item(i, 3, 3, Math.floor(rnd() * TREE_VARIANTS)), 3);
    }
    expect(treeCacheSize()).toBeGreaterThan(0);
    expect(treeCacheSize()).toBeLessThanOrEqual(TREE_VARIANTS * ZOOM_STEPS.length);
    expect(treeCacheSize()).toBeLessThanOrEqual(TREE_VARIANTS * 5); // Stufen 0,5 … 2
  });

  it('ISO §16 neue Welt (anderer Seed) → neuer Cache', () => {
    setCanvasFactory(fakeCanvasFactory());
    resetTreeCache();
    const { ctx } = fakeCtx();
    const cam = { x: 0, y: 0, zoom: 1 };
    drawTreeStamp(ctx, cam, item(0, 3, 3, 1), 3);
    drawTreeStamp(ctx, cam, item(0, 3, 3, 2), 3);
    expect(treeCacheSize()).toBe(2);
    drawTreeStamp(ctx, cam, item(0, 3, 3, 1), 4);
    expect(treeCacheSize()).toBe(1);
  });

  it('ISO §16 Zeichnen mit Faktor z / zoomStep(z): Zielgrösse = Stempel × Faktor (L1: Stempelbreite STAMP_W)', () => {
    setCanvasFactory(fakeCanvasFactory());
    resetTreeCache();
    const calls: number[][] = [];
    const ctx = {
      drawImage: (...a: number[]) => calls.push(a.slice(1)),
    } as unknown as CanvasRenderingContext2D;
    drawTreeStamp(ctx, { x: 0, y: 0, zoom: 1.2 }, item(0, 3, 3, 0), 3); // Stufe 1,5
    const [dx, dy, dw, dh] = calls[0]!;
    expect(dw).toBeCloseTo(STAMP_W * 1.2, 6);
    const c = project(3.5, 3.5);
    expect(dx).toBeCloseTo(c.x * 1.2 - (STAMP_W / 2) * 1.2, 6);
    expect(dy).toBeCloseTo(c.y * 1.2 - TREE_H * 1.2, 6);
    expect(dh!).toBeGreaterThan(0);
  });
});

/** Minimaler Raster-Kontext: save/restore/scale/translate, rect/ellipse, fill – genug, um einen Stempel zu rastern. */
class RasterCtx {
  fillStyle = '#000000';
  private m = { s: 1, tx: 0, ty: 0 };
  private stack: { s: number; tx: number; ty: number }[] = [];
  private shape: { kind: 'rect' | 'ell' | 'poly'; a: number[] } | null = null;
  readonly px: string[];
  constructor(
    readonly w: number,
    readonly h: number,
  ) {
    this.px = new Array<string>(w * h).fill('');
  }
  save() {
    this.stack.push({ ...this.m });
  }
  restore() {
    this.m = this.stack.pop()!;
  }
  scale(s: number) {
    this.m.s *= s;
  }
  translate(x: number, y: number) {
    this.m.tx += x * this.m.s;
    this.m.ty += y * this.m.s;
  }
  beginPath() {
    this.shape = null;
  }
  rect(x: number, y: number, w: number, h: number) {
    this.shape = { kind: 'rect', a: [x, y, w, h] };
  }
  moveTo(x: number, y: number) {
    this.shape = { kind: 'poly', a: [x, y] };
  }
  lineTo(x: number, y: number) {
    this.shape!.a.push(x, y);
  }
  closePath() {}
  ellipse(x: number, y: number, rx: number, ry: number) {
    this.shape = { kind: 'ell', a: [x, y, rx, ry] };
  }
  fill() {
    const sh = this.shape!;
    const { s, tx, ty } = this.m;
    for (let j = 0; j < this.h; j++)
      for (let i = 0; i < this.w; i++) {
        const x = (i + 0.5 - tx) / s,
          y = (j + 0.5 - ty) / s;
        let inside: boolean;
        if (sh.kind === 'poly') {
          inside = false; // Gerade-Ungerade-Regel
          const p = sh.a;
          for (let a = 0, b = p.length - 2; a < p.length; b = a, a += 2) {
            const [xa, ya, xb, yb] = [p[a]!, p[a + 1]!, p[b]!, p[b + 1]!];
            if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
          }
        } else {
          const [a, b, c, d] = sh.a as [number, number, number, number];
          inside =
            sh.kind === 'rect'
              ? x >= a && x <= a + c && y >= b && y <= b + d
              : ((x - a) / c) ** 2 + ((y - b) / d) ** 2 <= 1;
        }
        if (inside) this.px[j * this.w + i] = this.fillStyle;
      }
  }
}

/** 4-zusammenhängende Komponenten einer Farbe mit mindestens `min` Pixeln. */
function components(r: RasterCtx, color: string, min: number): number {
  const seen = new Uint8Array(r.w * r.h);
  let n = 0;
  for (let k = 0; k < r.px.length; k++) {
    if (seen[k] || r.px[k] !== color) continue;
    let size = 0;
    const st = [k];
    seen[k] = 1;
    while (st.length) {
      const q = st.pop()!;
      size++;
      const x = q % r.w,
        y = (q / r.w) | 0;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1],
      ] as const) {
        const u = x + dx,
          v = y + dy;
        if (u < 0 || v < 0 || u >= r.w || v >= r.h) continue;
        const p = v * r.w + u;
        if (!seen[p] && r.px[p] === color) {
          seen[p] = 1;
          st.push(p);
        }
      }
    }
    if (size >= min) n++;
  }
  return n;
}

describe('Baumstempel gerastert', () => {
  it('AK-R1-08 I5 jeder Stempel zeigt bei Zoom 1 ≥ 3 getrennte Lichtkappen (crownCap) (je ≥ 4 px), für alle Varianten und Seeds', () => {
    for (const seed of [3, 11, 12588, 94108])
      for (let v = 0; v < TREE_VARIANTS; v++) {
        const r = new RasterCtx(STAMP_W, Math.ceil(TREE_H + STAMP_BELOW));
        paintStamp(r as unknown as CanvasRenderingContext2D, seed, v, 1);
        // L1: ≥ 2 getrennte Kappen je Stempel (kleine Rand-Jungbäume überdecken sich), die Hauptart zeigt mindestens eine
        const crowns = crownsFor(seed, v).filter((c) => !c.bush);
        let total = 0;
        for (const k of [0, 1, 2, 3, 4] as const) total += components(r, crownCap(crownBase(k)), 4);
        expect(total, `Seed ${seed} Variante ${v}`).toBeGreaterThanOrEqual(2);
        const count = (k: number) => crowns.filter((c) => c.kind === k).length;
        const main = ([0, 1, 2, 3, 4] as const).reduce(
          (a, k) => (count(k) > count(a) ? k : a),
          0 as 0 | 1 | 2 | 3 | 4,
        );
        expect(
          components(r, crownCap(crownBase(main)), 4),
          `Seed ${seed} Variante ${v} Hauptart ${main}`,
        ).toBeGreaterThanOrEqual(1);
      }
  });
});
