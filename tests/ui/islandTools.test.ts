import { describe, expect, it } from 'vitest';
import { generateForeignIslands } from '../../src/sim/islands';
import { placeBuilding } from '../../src/sim/build';
import { project } from '../../src/render/iso';
import { createCamera } from '../../src/render/camera';
import { HOME, createWorld, home } from '../../src/sim/world';
import type { World } from '../../src/sim/types';
import { placementHint } from '../../src/ui/hints';
import { canDemolishTile } from '../../src/ui/input';
import { pickTarget, toolAfford, toolBlockReason, toolTarget } from '../../src/ui/islandTools';
import { buildEntries } from '../../src/ui/buildMenu';

const NO_KONTOR = 'Erst ein Kontor auf dieser Insel';
const B = 2;

function seaWorld(): World {
  return createWorld(3, { unlockAll: true });
}

function found(w: World, island: number): number {
  const s = generateForeignIslands(w.seed, home(w))[island - 1]!.kontorSite;
  const r = placeBuilding(w, 'kontor2', s.x, s.y, island);
  if (!r.ok) throw new Error(r.reason);
  return r.id!;
}

describe('M12 E2 UI Bauen und Handeln: Zielinsel', () => {
  it('toolTarget übernimmt Insel und inselinterne Kachel, Meer ergibt null', () => {
    expect(toolTarget({ island: 2, x: 3, y: 4 })).toEqual({ island: 2, x: 3, y: 4 });
    expect(toolTarget({ island: 0, x: 1, y: 1 })).toEqual({ island: 0, x: 1, y: 1 });
    expect(toolTarget(null)).toBeNull();
  });

  it('pickTarget trifft eine Fremdinsel mit Inselkoordinaten, das Meer nicht', () => {
    const w = seaWorld();
    const isl = w.islands[B]!;
    const cam = createCamera();
    const p = project(isl.ox + 5.5, isl.oy + 6.5);
    const t = pickTarget(w, cam, { kind: 'road' }, p.x, p.y);
    expect(t).toEqual({ island: B, x: 5, y: 6 });
    const sea = project(isl.ox - 3, isl.oy - 3); // zwischen den Inseln
    const hit = pickTarget(w, cam, { kind: 'road' }, sea.x, sea.y);
    if (hit) expect(hit.island).not.toBe(B);
  });

  it('pickTarget auf der Heimat bleibt Insel 0', () => {
    const w = seaWorld();
    const p = project(10.5, 12.5);
    expect(pickTarget(w, createCamera(), { kind: 'road' }, p.x, p.y)).toEqual({
      island: HOME,
      x: 10,
      y: 12,
    });
  });
});

describe('M12 E2 UI Bauen und Handeln: Bauleisten-Grund', () => {
  it('Insel ohne Kontor: alle Werkzeuge ausser kontor2 nennen den Grund', () => {
    const w = seaWorld();
    expect(toolBlockReason(w, { kind: 'build', defId: 'lumberjack' }, B)).toBe(NO_KONTOR);
    expect(toolBlockReason(w, { kind: 'road' }, B)).toBe(NO_KONTOR);
    expect(toolBlockReason(w, { kind: 'clearForest' }, B)).toBe(NO_KONTOR);
    expect(toolBlockReason(w, { kind: 'build', defId: 'kontor2' }, B)).toBeNull();
    expect(toolBlockReason(w, { kind: 'select' }, B)).toBeNull();
  });
  it('Heimat und Insel mit Kontor: kein Grund', () => {
    const w = seaWorld();
    expect(toolBlockReason(w, { kind: 'build', defId: 'lumberjack' }, HOME)).toBeNull();
    found(w, B);
    expect(toolBlockReason(w, { kind: 'build', defId: 'lumberjack' }, B)).toBeNull();
  });
  it('toolAfford: kontor2 zahlt aus der Heimat, anderes aus dem Insellager mit Ortsnamen', () => {
    const w = seaWorld();
    w.money = 5000;
    home(w).stock.wood = 50;
    home(w).stock.tools = 50;
    home(w).stock.stone = 50;
    expect(toolAfford(w, { kind: 'build', defId: 'kontor2' }, B).ok).toBe(true);
    found(w, B);
    const stock = w.islands[B]!.stock;
    stock.wood = stock.tools = stock.stone = 0;
    const r = toolAfford(w, { kind: 'build', defId: 'lumberjack' }, B);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/^Nicht genug .+ auf Felsbucht$/);
  });
  it('Bauleiste der Fremdinsel führt kontor2, die der Heimat nicht', () => {
    const w = seaWorld();
    const ids = (i: number) => buildEntries(w, 'infrastructure', i);
    expect(ids(B)).toContain('kontor2');
    expect(ids(HOME)).not.toContain('kontor2');
  });
});

describe('M12 E2 UI Bauen und Handeln: Hinweis und Vorschau je Insel', () => {
  it('placementHint nennt auf der Insel ohne Kontor den Grund', () => {
    const w = seaWorld();
    const h = placementHint(w, { kind: 'build', defId: 'lumberjack' }, 5, 5, B);
    expect(h).toEqual({ tone: 'bad', text: NO_KONTOR });
  });
  it('canDemolishTile liest die Kachel der gewählten Insel', () => {
    const w = seaWorld();
    const id = found(w, B);
    const b = w.buildings[id]!;
    expect(canDemolishTile(w, b.x, b.y, B)).toBe(true);
    expect(canDemolishTile(w, b.x, b.y, HOME)).toBe(false);
  });
});
