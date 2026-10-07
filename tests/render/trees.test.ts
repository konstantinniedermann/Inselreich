import { describe, expect, it } from 'vitest';
import { home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { ISO_W, ZOOM_STEPS, project, zoomStep } from '../../src/render/iso';
import { PALETTE, SHADOW, SIGNAL_NAMES, mixHex, rgbOfCss } from '../../src/render/palette';
import { deltaE2000, rgbToLab } from './deltaE';
import { OVERHANG, slotKind } from '../../src/render/forest';
import {
  CONIFER_COLOR,
  DEADWOOD_COLOR,
  LIGHT_CROWN_COLOR,
  LIGHT_TRUNK_COLOR,
  MAPLE_COLOR,
  PINE_COLOR,
  RADIUS_STEPS,
  STUMP_TOP_COLOR,
  TREE_CACHE_MAX_BYTES,
  crownBase,
  crownBox,
  crownCap,
  crownShade,
  drawTreeStamp,
  paintItem,
  setCanvasFactory,
  treeBounds,
  treeCacheBytes,
  treeCacheSize,
  treeShadow,
  resetTreeCache,
  type Crown,
  type TreeItem,
} from '../../src/render/trees';
import { fakeCtx, type P } from './fakeCtx';
import { expand, fakeCanvasFactory, mkItem, treeItems, treesOf, woodWorld } from './woodHelpers';

// trees.test.ts — Bäume zeichnen (ISO §6; WALD-02: Kronen einzeln aus dem Saumfeld, Kronen-Atlas).

/** Alle gemalten Punkte (Pfade und fillRect) eines Objekts bei Faktor `step`, in Weltpixeln. */
function paintedPoints(item: TreeItem, step: number): P[] {
  const { ctx, log } = fakeCtx();
  paintItem(ctx, item, step);
  const c = project(item.fp.x + 0.5, item.fp.y + 0.5);
  const pts = [
    ...log.allPoints,
    ...log.events.filter((e) => e.op === 'fillRect').flatMap((e) => e.points),
  ];
  return pts.map((p) => ({ x: c.x + p.x / step, y: c.y + p.y / step }));
}
const sample = <T>(a: T[], n: number): T[] =>
  a.filter((_, i) => i % Math.max(1, Math.floor(a.length / n)) === 0);

describe('Wald-Objekte', () => {
  it('ISO §6 Kronen (WALD-02): Fussscheibe höchstens OVERHANG = 0,35 Kachel über die eigene Kachel, Radien 0,03–0,35 (ausser Riesenbaum)', () => {
    for (const seed of [3, 7, 11]) {
      const cs = treesOf(woodWorld(seed)).filter((c) => !c.giant);
      expect(cs.length).toBeGreaterThan(300);
      for (const c of cs) {
        const tx = Math.floor(c.fx),
          ty = Math.floor(c.fy);
        expect(c.fx - c.r).toBeGreaterThanOrEqual(tx - OVERHANG - 1e-9);
        expect(c.fx + c.r).toBeLessThanOrEqual(tx + 1 + OVERHANG + 1e-9);
        expect(c.fy - c.r).toBeGreaterThanOrEqual(ty - OVERHANG - 1e-9);
        expect(c.fy + c.r).toBeLessThanOrEqual(ty + 1 + OVERHANG + 1e-9);
        expect(c.r).toBeGreaterThanOrEqual(0.03);
        expect(c.r).toBeLessThanOrEqual(0.35);
      }
    }
  });

  it('AK-ISO-10 Wald-Objekt: jeder gemalte Punkt liegt in treeBounds (alle Zoomstufen, mit Riesenbaum); Eng-Objekte bleiben in der Spaltenbreite einer Kachel', () => {
    for (const seed of [3, 11, 7]) {
      const items = treeItems(woodWorld(seed));
      const pick = [
        ...sample(items, 40),
        ...items.filter((i) => i.own).slice(0, 10),
        ...items.filter((i) => i.crowns.some((c) => c.giant)),
      ];
      for (const item of pick)
        for (const step of ZOOM_STEPS) {
          const box = treeBounds(item);
          const c = project(item.fp.x + 0.5, item.fp.y + 0.5);
          for (const p of paintedPoints(item, step)) {
            expect(p.x).toBeGreaterThanOrEqual(box.x - 1e-6);
            expect(p.x).toBeLessThanOrEqual(box.x + box.w + 1e-6);
            expect(p.y).toBeGreaterThanOrEqual(box.y - 1e-6);
            expect(p.y).toBeLessThanOrEqual(box.y + box.h + 1e-6);
            if (item.own) expect(Math.abs(p.x - c.x)).toBeLessThanOrEqual(ISO_W / 2 + 1e-6);
          }
        }
    }
  }, 40_000); // H-T7: lokal 3,5 s, Timeout >= 8 x lokal (R270)

  it('AK-R1-03 Kronen nutzen nur Palettenmischungen (keine Signalfarben, kein Schatten); neue Töne ΔE2000 ≥ 20 zu den Signalfarben', () => {
    const bases = ([0, 1, 2, 3, 4] as const).flatMap((k) =>
      ([-1.5, -1, -0.5, 0, 0.5, 1, 1.5] as const).map((t) => crownBase(k, t)),
    );
    const trunk = mixHex(PALETTE.rockDark, PALETTE.earth, 0.5);
    const signals = new Set<string>(SIGNAL_NAMES.map((n) => PALETTE[n]));
    for (const seed of [3, 7, 2])
      for (const item of sample(treeItems(woodWorld(seed)), 80)) {
        // erlaubt: Körper, Schatten und Kappe der Baumart im Ton jedes gemalten Baums, Stämme, Totholz
        const allowed = new Set<string>([
          trunk,
          LIGHT_TRUNK_COLOR,
          DEADWOOD_COLOR,
          crownShade(DEADWOOD_COLOR),
          STUMP_TOP_COLOR,
        ]);
        for (const c of expand(item.crowns.map((k) => ({ ...k, fx: 0, fy: 0 })))) {
          const b = crownBase(c.kind, c.tone ?? 0);
          allowed.add(b).add(crownShade(b)).add(crownCap(b));
        }
        const { ctx, log } = fakeCtx();
        paintItem(ctx, item, 1);
        for (const f of log.fillSet) {
          expect(allowed.has(f), f).toBe(true);
          expect(signals.has(f)).toBe(false);
          expect(f).not.toBe(SHADOW);
          for (const n of SIGNAL_NAMES)
            expect(
              deltaE2000(rgbToLab(rgbOfCss(f)), rgbToLab(rgbOfCss(PALETTE[n]))),
              `${f} ~ ${n}`,
            ).toBeGreaterThanOrEqual(20);
        }
      }
    for (const c of [
      CONIFER_COLOR,
      LIGHT_CROWN_COLOR,
      LIGHT_TRUNK_COLOR,
      PINE_COLOR,
      MAPLE_COLOR,
      DEADWOOD_COLOR,
      STUMP_TOP_COLOR,
      ...bases,
    ])
      for (const n of SIGNAL_NAMES)
        expect(
          deltaE2000(rgbToLab(rgbOfCss(c)), rgbToLab(rgbOfCss(PALETTE[n]))),
          `${c} ~ ${n}`,
        ).toBeGreaterThanOrEqual(20);
  });

  it('R149 Baumarten: je Seed ≥ 2 Arten, Radienverhältnis max/min ≥ 2,5; über die Waldtypen alle fünf Arten', () => {
    for (const seed of [3, 11, 7, 2]) {
      const cs = treesOf(woodWorld(seed)).filter((c) => !c.dead && !c.giant);
      const kinds = new Set(cs.map((c) => c.kind));
      const rs = cs.map((c) => c.r);
      expect(kinds.size, `Seed ${seed}`).toBeGreaterThanOrEqual(2);
      expect(Math.max(...rs) / Math.min(...rs), `Seed ${seed}`).toBeGreaterThanOrEqual(2.5);
    }
    const all = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) for (const s of [0, 1, 2]) all.add(slotKind(seed, s));
    expect([...all].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('AK-ISO-10 treeShadow: nur Kronen mit eigenem Schatten (Vorwald, Saum); Polygon im Kachelraum, nach rechts unten versetzt, deterministisch', () => {
    const items = treeItems(woodWorld(7));
    const casting = items.filter((i) => i.crowns.some((c) => c.cast));
    expect(casting.length).toBeGreaterThan(20);
    for (const it0 of sample(casting, 30)) {
      const poly = treeShadow(it0);
      expect(poly.length).toBeGreaterThanOrEqual(8);
      expect(treeShadow(it0)).toEqual(poly);
      const cs = it0.crowns.filter((c) => c.cast);
      const fx = cs.reduce((s, c) => s + it0.fp.x + c.cx, 0) / cs.length,
        fy = cs.reduce((s, c) => s + it0.fp.y + c.cy, 0) / cs.length;
      const mx = poly.reduce((s, p) => s + p.x, 0) / poly.length,
        my = poly.reduce((s, p) => s + p.y, 0) / poly.length;
      if (cs.length === 1) {
        expect(mx).toBeGreaterThan(fx);
        expect(my).toBeGreaterThan(fy);
      }
      for (const p of poly) {
        expect(Math.abs(p.x - fx)).toBeLessThan(1.5);
        expect(Math.abs(p.y - fy)).toBeLessThan(1.5);
      }
    }
    const quiet = items.find((i) => i.crowns.every((c) => !c.cast && !c.giant))!;
    expect(treeShadow(quiet)).toEqual([]);
  });
});

describe('Wald und Bebauung', () => {
  it('AK-R1-06 (ISO, R96) nach Bebauung einer Waldkachel steht dort keine Krone mehr, die 8 Nachbarn tragen weiter ≥ 2 Kronen', () => {
    const world = structuredClone(woodWorld(7)) as World;
    const isl = home(world);
    const w = isl.width;
    // eine Kernkachel: 8 Nachbarn Wald
    let mid = -1;
    for (let i = w + 1; i < isl.tiles.length - w - 1 && mid < 0; i++) {
      const x = i % w,
        y = (i / w) | 0;
      let ok = true;
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++)
          ok &&= isl.tiles[(y + dy) * w + x + dx]!.terrain === 'forest';
      if (ok) mid = i;
    }
    const mx = mid % w,
      my = (mid / w) | 0;
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
    isl.tiles[mid]!.buildingId = bid;
    const on = (x: number, y: number) =>
      treesOf(world).filter((c) => !c.dead && Math.floor(c.fx) === x && Math.floor(c.fy) === y);
    expect(on(mx, my).length).toBe(0);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++)
        if (dx || dy)
          expect(on(mx + dx, my + dy).length, `Nachbar ${dx},${dy}`).toBeGreaterThanOrEqual(2);
  });
});

describe('Kronen-Atlas', () => {
  it('ISO §16 Atlas: nach 200 zufälligen Zoomwerten in [0,125; 2] über viele Objekte bleibt er unter TREE_CACHE_MAX_BYTES, Einträge nur auf ZOOM_STEPS', () => {
    setCanvasFactory(fakeCanvasFactory());
    resetTreeCache();
    const items = treeItems(woodWorld(7));
    let s = 12345;
    const rnd = () => (s = (Math.imul(s, 1103515245) + 12345) >>> 0) / 4294967296;
    for (let i = 0; i < 200; i++) {
      const zoom = 0.125 + rnd() * 1.875;
      const { ctx } = fakeCtx();
      for (let k = 0; k < 40; k++)
        drawTreeStamp(ctx, { x: 0, y: 0, zoom }, items[Math.floor(rnd() * items.length)]!, 7);
      expect(treeCacheBytes()).toBeLessThanOrEqual(TREE_CACHE_MAX_BYTES);
    }
    expect(treeCacheSize()).toBeGreaterThan(0);
  });

  it('Spec §5 Atlas bei Zoom 2: alle Kronen einer ganzen Insel (Seeds 7, 14, 2) passen ohne Verdrängung unter die Obergrenze (Briefing: ≤ 12 MiB)', () => {
    for (const seed of [7, 14, 2]) {
      setCanvasFactory(fakeCanvasFactory());
      resetTreeCache();
      const { ctx } = fakeCtx();
      for (const item of treeItems(woodWorld(seed)))
        drawTreeStamp(ctx, { x: 0, y: 0, zoom: 2 }, item, seed);
      const n = treeCacheSize(),
        bytes = treeCacheBytes();
      // noch einmal: keine neuen Einträge (nichts wurde verdrängt)
      for (const item of treeItems(woodWorld(seed)))
        drawTreeStamp(ctx, { x: 0, y: 0, zoom: 2 }, item, seed);
      expect(treeCacheSize(), `Seed ${seed}`).toBe(n);
      expect(bytes, `Seed ${seed}: ${(bytes / 2 ** 20).toFixed(2)} MiB`).toBeLessThanOrEqual(
        12 * 2 ** 20,
      );
    }
  });

  it('ISO §16 der Atlas hängt nicht vom Seed ab: dieselbe Krone teilt den Eintrag über Inseln', () => {
    setCanvasFactory(fakeCanvasFactory());
    resetTreeCache();
    const c: Crown = { kind: 0, cx: 0.5, cy: 0.5, r: 0.2, h: 10, bush: false, s: 0.3 };
    const { ctx } = fakeCtx();
    const cam = { x: 0, y: 0, zoom: 1 };
    drawTreeStamp(ctx, cam, mkItem([c], 3, 3), 3);
    drawTreeStamp(ctx, cam, mkItem([{ ...c }], 5, 3), 4);
    expect(treeCacheSize()).toBe(1);
    drawTreeStamp(ctx, cam, mkItem([{ ...c, tone: 1 }], 5, 3), 4);
    expect(treeCacheSize()).toBe(2);
  });

  it('ISO §16 Zeichnen mit Faktor z / zoomStep(z) · r / r_b: Fusspunkt der Krone liegt auf dem Fusspunkt im Bild', () => {
    setCanvasFactory(fakeCanvasFactory());
    resetTreeCache();
    const calls: number[][] = [];
    const ctx = {
      drawImage: (...a: number[]) => calls.push(a.slice(1)),
    } as unknown as CanvasRenderingContext2D;
    const c: Crown = { kind: 1, cx: 0.4, cy: 0.7, r: 0.2, h: 9, bush: false, s: 0.5 };
    const z = 1.2,
      step = zoomStep(z);
    drawTreeStamp(ctx, { x: 0, y: 0, zoom: z }, mkItem([c], 3, 3), 3);
    const [dx, dy, dw, dh] = calls[0]!;
    const rb = RADIUS_STEPS.filter((r) => r >= c.r).at(-1)!;
    const k = (z / step) * (c.r / rb);
    const b = crownBox({ ...c, r: rb, h: c.h / (c.r / rb) });
    expect(dw).toBeCloseTo(Math.ceil((b.x1 - b.x0 + 2) * step) * k, 6);
    expect(dh).toBeCloseTo(Math.ceil((b.y1 - b.y0 + 2) * step) * k, 6);
    const f = project(3.4, 3.7);
    expect(dx! + (1 - b.x0) * step * k).toBeCloseTo(f.x * z, 6);
    expect(dy! + (1 - b.y0) * step * k).toBeCloseTo(f.y * z, 6);
  });

  it('Perf drawTreeStamp: ein Objekt ganz ausserhalb des Bildes (Canvas / DPR) kostet keinen Zeichenaufruf, eines im Bild zeichnet je Krone einmal', () => {
    setCanvasFactory(fakeCanvasFactory());
    resetTreeCache();
    const crowns: Crown[] = [
      { kind: 0, cx: 0.3, cy: 0.6, r: 0.2, h: 10, bush: false, s: 0.3 },
      { kind: 1, cx: 0.7, cy: 0.4, r: 0.18, h: 8, bush: false, s: 0.7 },
    ];
    const calls: number[][] = [];
    const ctx = {
      canvas: { width: 1600, height: 1000 },
      getTransform: () => ({ a: 2 }),
      drawImage: (...a: number[]) => calls.push(a.slice(1)),
    } as unknown as CanvasRenderingContext2D;
    const cam = { x: -400, y: -100, zoom: 1 };
    drawTreeStamp(ctx, cam, mkItem(crowns, 5, 5), 1); // Bildmitte bei DPR 2: 800 × 500 CSS-Pixel
    expect(calls).toHaveLength(2);
    calls.length = 0;
    drawTreeStamp(ctx, cam, mkItem(crowns, 40, 2), 1); // weit rechts ausserhalb
    expect(calls).toHaveLength(0);
  });

  it('L1-T4 der Riesenbaum wird direkt gemalt und füllt den Atlas nicht', () => {
    setCanvasFactory(fakeCanvasFactory());
    resetTreeCache();
    const g: Crown = {
      kind: 0,
      cx: 0.5,
      cy: 0.5,
      r: 0.306,
      h: 20,
      bush: false,
      s: 0.5,
      giant: true,
    };
    const { ctx, log } = fakeCtx();
    drawTreeStamp(ctx, { x: 0, y: 0, zoom: 1 }, mkItem([g], 3, 3), 3);
    expect(treeCacheSize()).toBe(0);
    expect(log.saves).toBe(log.restores);
    expect(log.fillSet.length).toBeGreaterThan(3);
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
  fillRect(x: number, y: number, w: number, h: number) {
    this.rect(x, y, w, h);
    this.fill();
  }
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

describe('Kronen gerastert', () => {
  it('AK-R1-08 I5 jedes Kern-Objekt mit ≥ 3 Kronen zeigt bei Zoom 1 ≥ 2 getrennte Lichtkappen (je ≥ 4 px)', () => {
    for (const seed of [3, 11, 7]) {
      const items = treeItems(woodWorld(seed)).filter(
        (i) => i.crowns.filter((c) => !c.bush && !c.dead && !c.young).length >= 3,
      );
      expect(items.length).toBeGreaterThan(20);
      for (const item of sample(items, 25)) {
        const b = treeBounds(item);
        const c = project(item.fp.x + 0.5, item.fp.y + 0.5);
        const r = new RasterCtx(Math.ceil(b.w) + 2, Math.ceil(b.h) + 2);
        r.translate(c.x - b.x + 1, c.y - b.y + 1);
        paintItem(r as unknown as CanvasRenderingContext2D, item, 1);
        let total = 0;
        const caps = new Set(
          expand(item.crowns.map((k) => ({ ...k, fx: 0, fy: 0 }))).map((k) =>
            crownCap(crownBase(k.kind, k.tone ?? 0)),
          ),
        );
        for (const cap of caps) total += components(r, cap, 4);
        expect(total, `Seed ${seed} Objekt ${item.id}`).toBeGreaterThanOrEqual(2);
      }
    }
  }, 10_000); // H-T7: lokal 1,2 s, Timeout >= 8 x lokal (R270)
});
