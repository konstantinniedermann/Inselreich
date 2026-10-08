import { beforeEach, describe, expect, it } from 'vitest';
import {
  TREE_COMPOSITE_MAX_BYTES,
  TREE_COMPOSITE_PER_FRAME,
  TREE_COMPOSITE_WINDOW_MS,
  drawTreeStamp,
  resetTreeCache,
  setCanvasFactory,
  setTreeClock,
  treeBounds,
  treeCompositeBytes,
  treeCompositeCount,
  type Crown,
  type TreeItem,
} from '../../src/render/trees';
import { fakeCtx } from './fakeCtx';
import { fakeCanvasFactory, mkItem } from './woodHelpers';

// trees-composite.test.ts — PERF-L57: Gesamtbild je Wald-Objekt, ein drawImage statt 3–5.

let now = 0;
const crowns = (n: number): Crown[] =>
  Array.from({ length: n }, (_, i) => ({
    kind: (i % 2) as 0 | 1,
    cx: 0.2 + 0.15 * i,
    cy: 0.3 + 0.12 * i,
    r: 0.2,
    h: 9,
    bush: false,
    s: 0.2 + 0.1 * i,
  }));
const cam = { x: 0, y: 0, zoom: 1 };
const frame = (items: TreeItem[], c = cam): number => {
  now += TREE_COMPOSITE_WINDOW_MS + 1;
  const { ctx, log } = fakeCtx();
  for (const it of items) drawTreeStamp(ctx, c, it, 1);
  return log.images.length;
};

beforeEach(() => {
  setCanvasFactory(fakeCanvasFactory());
  now = 1000;
  setTreeClock(() => now);
  resetTreeCache();
});

describe('PERF-L57 Gesamtbild', () => {
  it('RF-PERF-1 wiederholtes Zeichnen: erster Frame je Krone, danach genau ein drawImage je Objekt', () => {
    const items = [0, 1, 2].map((i) => mkItem(crowns(4), 4 + i, 4, i));
    expect(frame(items)).toBe(12); // erstes Zeichnen direkt
    expect(frame(items)).toBe(3); // Aufbau im zweiten Frame, gezeichnet als Gesamtbild
    expect(frame(items)).toBe(3);
    expect(treeCompositeCount()).toBe(3);
  });

  it('RF-PERF-1 Zielrechteck: Gesamtbild sitzt auf der treeBounds des Objekts', () => {
    const it = mkItem(crowns(3), 5, 5);
    const c2 = { x: 10, y: 20, zoom: 2 };
    frame([it], c2);
    frame([it], c2);
    const { ctx, log } = fakeCtx();
    const rec: unknown[][] = [];
    (ctx as unknown as { drawImage: (...a: unknown[]) => void }).drawImage = (...a) => rec.push(a);
    now += 20;
    drawTreeStamp(ctx, c2, it, 1);
    const b = treeBounds(it);
    expect(rec).toHaveLength(1);
    expect(log.images).toHaveLength(0);
    const [, x, y, w, h] = rec[0] as number[];
    expect(x).toBeCloseTo((b.x - 10) * 2, 6);
    expect(y).toBeCloseTo((b.y - 20) * 2, 6);
    expect(w).toBeGreaterThanOrEqual(b.w * 2 - 1e-9);
    expect(w).toBeLessThan(b.w * 2 + 3);
    expect(h).toBeGreaterThanOrEqual(b.h * 2 - 1e-9);
  });

  it('RF-PERF-2 Bytegrenze: Gesamtbilder überschreiten TREE_COMPOSITE_MAX_BYTES nie, Überlauf zeichnet direkt', () => {
    const items = Array.from({ length: 400 }, (_, i) =>
      mkItem(crowns(4), 4 + (i % 20), 4 + Math.floor(i / 20), i),
    );
    const big = { x: 0, y: 0, zoom: 2 };
    for (let f = 0; f < 80; f++) {
      frame(items, big);
      expect(treeCompositeBytes()).toBeLessThanOrEqual(TREE_COMPOSITE_MAX_BYTES);
    }
    expect(treeCompositeCount()).toBeGreaterThan(0);
  });

  it('RF-PERF-3 resetTreeCache leert alle Gesamtbilder', () => {
    const items = [mkItem(crowns(3), 4, 4)];
    frame(items);
    frame(items);
    expect(treeCompositeCount()).toBe(1);
    expect(treeCompositeBytes()).toBeGreaterThan(0);
    resetTreeCache();
    expect(treeCompositeCount()).toBe(0);
    expect(treeCompositeBytes()).toBe(0);
  });

  it('RF-PERF-4 Frame-Budget: höchstens TREE_COMPOSITE_PER_FRAME Aufbauten je Zeitfenster', () => {
    const items = Array.from({ length: 40 }, (_, i) =>
      mkItem(crowns(3), 4 + (i % 10), 4 + (i >> 3), i),
    );
    frame(items);
    frame(items);
    expect(treeCompositeCount()).toBe(TREE_COMPOSITE_PER_FRAME);
    frame(items);
    expect(treeCompositeCount()).toBe(2 * TREE_COMPOSITE_PER_FRAME);
  });

  it('RF-PERF-5 Riesenbaum und Einzelkrone werden nie zum Gesamtbild und zeichnen direkt weiter', () => {
    const g: Crown = { kind: 0, cx: 0.5, cy: 0.5, r: 0.3, h: 20, bush: false, s: 0.5, giant: true };
    const withGiant = mkItem([g, ...crowns(2)], 5, 5);
    const single = mkItem(crowns(1), 8, 5, 2);
    for (let i = 0; i < 3; i++) {
      const { ctx, log } = fakeCtx();
      now += 20;
      drawTreeStamp(ctx, cam, withGiant, 1);
      drawTreeStamp(ctx, cam, single, 1);
      expect(log.images).toHaveLength(3);
      expect(log.fillSet.length).toBeGreaterThan(3);
    }
    expect(treeCompositeCount()).toBe(0);
  });

  it('RF-PERF-6 Zoomstufenwechsel verwirft das Gesamtbild und baut es neu', () => {
    const it = mkItem(crowns(3), 5, 5);
    frame([it]);
    frame([it]);
    expect(frame([it])).toBe(1);
    expect(frame([it], { x: 0, y: 0, zoom: 2 })).toBe(3);
    expect(frame([it], { x: 0, y: 0, zoom: 2 })).toBe(1);
    expect(treeCompositeCount()).toBe(1);
  });
});
