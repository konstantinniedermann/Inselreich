import { createWorld } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { depthKey, sortedObjects } from '../../src/render/iso';
import type { Crown, TreeItem } from '../../src/render/trees';
import { groupMembers } from '../../src/render/crown';
import { fakeCtx } from './fakeCtx';

// woodHelpers.ts — WALD-02: gemeinsame Helfer der Wald-Tests (echte Karten, Objekte aus Kronen, Fake-Canvas).

const worlds = new Map<number, World>();
/** Welt zum Seed (unlockAll, wie die Galerie), je Testlauf einmal gebaut. */
export function woodWorld(seed: number): World {
  let w = worlds.get(seed);
  if (!w) worlds.set(seed, (w = createWorld(seed, { unlockAll: true })));
  return w;
}
/** Wald-Objekte einer Welt in Zeichenreihenfolge. */
export const treeItems = (w: World): TreeItem[] =>
  sortedObjects(w).filter((i): i is TreeItem => i.kind === 'tree');
/** Alle Kronen einer Karte mit absolutem Fusspunkt (fx, fy). */
export function crownsOf(w: World): (Crown & { fx: number; fy: number; item: TreeItem })[] {
  return treeItems(w).flatMap((item) =>
    item.crowns.map((c) => ({ ...c, fx: item.fp.x + c.cx, fy: item.fp.y + c.cy, item })),
  );
}
/** Einzelbäume: Gruppen in ihre Bäume aufgelöst (absoluter Fuss), Einzelkronen unverändert. */
export function expand<T extends Crown & { fx: number; fy: number }>(
  cs: T[],
): (T & { inGroup?: boolean })[] {
  return cs.flatMap((c) =>
    c.group === undefined
      ? [c]
      : groupMembers(c).map((m) => ({
          ...c,
          ...m,
          fx: c.fx + m.cx,
          fy: c.fy + m.cy,
          group: undefined,
          inGroup: true,
        })),
  );
}
/** Alle Bäume einer Karte (Gruppen aufgelöst). */
export const treesOf = (w: World) => expand(crownsOf(w));
/** Wald-Objekt aus Kronen an der Kachel (x, y). */
export function mkItem(crowns: Crown[], x: number, y: number, id = 0, own = false): TreeItem {
  const fp = { x, y, w: 1, h: 1 };
  return { kind: 'tree', id, fp, key: depthKey(fp), crowns, own };
}
/** Fake-Offscreen-Canvas für Cache-Tests. */
export function fakeCanvasFactory(): () => HTMLCanvasElement {
  return () => {
    const { ctx } = fakeCtx();
    return { width: 0, height: 0, getContext: () => ctx } as unknown as HTMLCanvasElement;
  };
}
