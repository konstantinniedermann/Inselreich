import { beforeEach, describe, expect, it } from 'vitest';
import {
  GROUND_STABLE_FRAMES,
  drawGround,
  groundCacheSize,
  groundScreenBox,
  groundStats,
  noteGroundPatch,
  resetGroundCache,
  setGroundCanvasFactory,
  type GroundSpec,
} from '../../src/render/groundCache';
import type { Camera } from '../../src/render/camera';

/** Aufzeichnender Mini-Kontext: nur was der Bodencache braucht. */
class Rec {
  log: string[] = [];
  calls: { op: string; args: unknown[] }[] = [];
  imageSmoothingQuality = 'low';
  imageSmoothingEnabled = true;
  constructor(
    public canvas: { width: number; height: number },
    private tr = { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 },
  ) {}
  getTransform() {
    return this.tr;
  }
  private rec(op: string, ...args: unknown[]): void {
    this.calls.push({ op, args });
  }
  save() {
    this.rec('save');
  }
  restore() {
    this.rec('restore');
  }
  transform(...a: number[]) {
    this.rec('transform', ...a);
  }
  setTransform(...a: number[]) {
    this.rec('setTransform', ...a);
  }
  drawImage(...a: unknown[]) {
    this.rec('drawImage', ...a);
  }
  beginPath() {
    this.rec('beginPath');
  }
  rect(...a: number[]) {
    this.rec('rect', ...a);
  }
  clip() {
    this.rec('clip');
  }
  clearRect(...a: number[]) {
    this.rec('clearRect', ...a);
  }
  count(op: string): number {
    return this.calls.filter((c) => c.op === op).length;
  }
}
const asCtx = (r: Rec) => r as unknown as CanvasRenderingContext2D;
const mkCanvas = (): { c: HTMLCanvasElement; ctx: Rec } => {
  const cv = { width: 0, height: 0 } as { width: number; height: number };
  const ctx = new Rec(cv);
  (cv as unknown as { getContext: () => Rec }).getContext = () => ctx;
  return { c: cv as unknown as HTMLCanvasElement, ctx };
};

const cam: Camera = { x: 100, y: 50, zoom: 1 };
const owner = {} as HTMLCanvasElement;
const spec = (over: Partial<GroundSpec> = {}): GroundSpec => ({
  owner,
  src: owner,
  sx: 0,
  sy: 0,
  sw: 400,
  sh: 300,
  per: 32,
  ...over,
});
let made: ReturnType<typeof mkCanvas>[] = [];
const frame = (ctx: Rec, c: Camera = cam, g: GroundSpec = spec(), cacheable = true): void =>
  drawGround(asCtx(ctx), c, g, cacheable);
const affine = (r: Rec): number => r.count('transform');

beforeEach(() => {
  resetGroundCache();
  made = [];
  setGroundCanvasFactory(() => {
    const m = mkCanvas();
    made.push(m);
    return m.c;
  });
});

describe('PERF-L57 Bodencache', () => {
  it('RF-GC-1 Frame 1 und 2 zeichnen direkt, ab Frame 3 genau ein Blit statt des affinen Aufrufs', () => {
    const view = { width: 800, height: 600 };
    const frames: Rec[] = [];
    for (let i = 0; i < GROUND_STABLE_FRAMES + 2; i++) {
      const r = new Rec(view);
      frames.push(r);
      frame(r);
    }
    expect(GROUND_STABLE_FRAMES).toBe(3);
    for (const i of [0, 1]) expect(affine(frames[i]!)).toBe(1);
    for (const i of [3, 4]) {
      const r = frames[i]!;
      expect(affine(r)).toBe(0);
      expect(r.count('drawImage')).toBe(1);
      expect(r.calls.find((c) => c.op === 'setTransform')!.args).toEqual([1, 0, 0, 1, 0, 0]);
      expect(r.count('save')).toBe(r.count('restore'));
    }
    expect(made).toHaveLength(1);
    expect(made[0]!.c.width).toBe(800);
    expect(made[0]!.ctx.count('transform')).toBe(1); // Aufbau einmal, identischer Aufruf
    expect(groundCacheSize()).toBe(1);
  });

  it('RF-GC-2 Kamerabewegung, Zoom, Grösse und Basismatrix verwerfen den Cache', () => {
    const view = { width: 800, height: 600 };
    const run = (c: Camera, r = new Rec(view)): Rec => (frame(r, c), r);
    for (let i = 0; i < 4; i++) run(cam);
    const moved = run({ ...cam, x: 101 });
    expect(affine(moved)).toBe(1);
    expect(groundStats.blits).toBe(2);
    for (let i = 0; i < 3; i++) run({ ...cam, zoom: 2 });
    expect(affine(run({ ...cam, zoom: 1.5 }))).toBe(1);
    for (let i = 0; i < 3; i++) run(cam);
    const resized = new Rec({ width: 900, height: 600 });
    frame(resized);
    expect(affine(resized)).toBe(1);
    for (let i = 0; i < 3; i++) frame(new Rec({ width: 900, height: 600 }));
    const dpr = new Rec({ width: 900, height: 600 }, { a: 2, b: 0, c: 0, d: 2, e: 0, f: 0 });
    frame(dpr);
    expect(affine(dpr)).toBe(1);
  });

  it('RF-GC-3 Patch zeichnet nur die Box neu (Clip) und der Cache bleibt gültig', () => {
    const view = { width: 800, height: 600 };
    for (let i = 0; i < 4; i++) frame(new Rec(view));
    const off = made[0]!.ctx;
    const before = off.count('transform');
    noteGroundPatch(owner, { x0: 3, y0: 3, x1: 4, y1: 4 });
    const r = new Rec(view);
    frame(r);
    expect(affine(r)).toBe(0);
    expect(r.count('drawImage')).toBe(1);
    expect(made).toHaveLength(1);
    expect(off.count('transform')).toBe(before + 1);
    expect(off.count('clip')).toBe(1);
    expect(off.count('clearRect')).toBe(1);
    const box = off.calls.find((c) => c.op === 'rect')!.args as number[]; // dpr 1: Gerät = CSS
    const full = groundScreenBox(cam, 32, { x0: 3, y0: 3, x1: 4, y1: 4 }, 0);
    expect(box[0]!).toBeLessThanOrEqual(full.x - 4);
    expect(box[2]!).toBeGreaterThanOrEqual(full.w + 8);
    expect(box[2]! * box[3]!).toBeLessThan(800 * 600);
    expect(off.count('save')).toBe(off.count('restore'));
    // danach wieder ruhig
    frame(new Rec(view));
    expect(off.count('clip')).toBe(1);
  });

  it('RF-GC-3b Patch ohne Rechteck oder auf Kopie verwirft ganz', () => {
    const view = { width: 800, height: 600 };
    for (let i = 0; i < 4; i++) frame(new Rec(view));
    noteGroundPatch(owner, undefined);
    expect(groundCacheSize()).toBe(0);
    const half = {} as HTMLCanvasElement;
    const g = spec({ src: half });
    for (let i = 0; i < 4; i++) frame(new Rec(view), cam, g);
    expect(groundCacheSize()).toBe(1);
    noteGroundPatch(owner, { x0: 0, y0: 0, x1: 1, y1: 1 });
    expect(groundCacheSize()).toBe(0);
  });

  it('RF-GC-4 nicht cachebare Ebenen (Fremdinsel, unfertig) werden nie gecacht', () => {
    for (let i = 0; i < 6; i++) {
      const r = new Rec({ width: 800, height: 600 });
      frame(r, cam, spec(), false);
      expect(affine(r)).toBe(1);
    }
    expect(made).toHaveLength(0);
    expect(groundCacheSize()).toBe(0);
  });

  it('RF-GC-5 ohne Canvas-Fabrik oder Kontext-Canvas wird direkt gezeichnet', () => {
    setGroundCanvasFactory(null);
    for (let i = 0; i < 5; i++) {
      const r = new Rec({ width: 800, height: 600 });
      frame(r);
      expect(affine(r)).toBe(1);
    }
    setGroundCanvasFactory(() => null);
    for (let i = 0; i < 5; i++) {
      const r = new Rec({ width: 800, height: 600 });
      frame(r);
      expect(affine(r)).toBe(1);
    }
    expect(groundCacheSize()).toBe(0);
  });

  it('RF-GC-6 Glättung kommt vom Ziel-Kontext, steckt im Schlüssel und im Cache-Bild', () => {
    const view = { width: 800, height: 600 };
    const mk = (q: string): Rec => {
      const r = new Rec(view);
      r.imageSmoothingQuality = q;
      return r;
    };
    for (let i = 0; i < 4; i++) frame(mk('high'));
    expect((made[0]!.ctx as Rec).imageSmoothingQuality).toBe('high');
    const low = mk('low');
    frame(low);
    expect(affine(low)).toBe(1); // Wechsel der Qualität verwirft
    for (let i = 0; i < 3; i++) frame(mk('low'));
    expect(made[1]!.ctx.imageSmoothingQuality).toBe('low');
  });

  it('RF-GC-7 Patch-Box liegt bei DPR 1,5 auf ganzen Gerätepixeln, Clip unter Identität, Boden unter Basismatrix', () => {
    const view = { width: 1200, height: 900 };
    const tr = { a: 1.5, b: 0, c: 0, d: 1.5, e: 0, f: 0 };
    for (let i = 0; i < 4; i++) frame(new Rec(view, tr));
    const off = made[0]!.ctx;
    noteGroundPatch(owner, { x0: 3, y0: 3, x1: 4, y1: 4 });
    frame(new Rec(view, tr));
    const rect = off.calls.find((c) => c.op === 'rect')!.args as number[];
    for (const v of rect) expect(Number.isInteger(v)).toBe(true);
    const sets = off.calls.filter((c) => c.op === 'setTransform').map((c) => c.args);
    expect(sets.slice(-2)).toEqual([
      [1, 0, 0, 1, 0, 0],
      [1.5, 0, 0, 1.5, 0, 0],
    ]);
    const ops = off.calls.map((c) => c.op);
    expect(ops.indexOf('clip')).toBeLessThan(ops.lastIndexOf('setTransform'));
  });
});
