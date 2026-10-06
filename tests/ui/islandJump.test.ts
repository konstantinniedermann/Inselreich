import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { center, createWorld } from '../../src/sim/world';
import { islandList, jumpTarget, nextIsland } from '../../src/ui/islandJump';

describe('M12 E2 UI Inseln: Inselsprung', () => {
  it('nextIsland reihum 0 → 1 → 2 → 0', () => {
    expect(nextIsland(0, 3)).toBe(1);
    expect(nextIsland(1, 3)).toBe(2);
    expect(nextIsland(2, 3)).toBe(0);
  });
  it('jumpTarget ohne Kontor: Rechteckmitte in Archipel-Kacheln', () => {
    const w = createWorld(3);
    const i = w.islands[2]!;
    expect(jumpTarget(w, 2)).toEqual({ x: i.ox + i.width / 2, y: i.oy + i.height / 2 });
  });
  it('jumpTarget mit Kontor auf der Insel: Kontor-Mitte plus Inselversatz', () => {
    const w = createWorld(3);
    const i = w.islands[2]!;
    w.buildings[900] = {
      id: 900,
      defId: 'kontor2',
      x: 5,
      y: 7,
      island: 2,
    } as unknown as (typeof w.buildings)[number];
    i.kontorId = 900;
    const c = center(BUILDING_DEFS.kontor2, 5, 7);
    expect(jumpTarget(w, 2)).toEqual({ x: i.ox + c.cx, y: i.oy + c.cy });
  });
  it('jumpTarget der Heimat: Kontor-Mitte der Heimat', () => {
    const w = createWorld(3);
    const k = w.buildings[w.islands[0]!.kontorId!]!;
    const c = center(BUILDING_DEFS[k.defId], k.x, k.y);
    expect(jumpTarget(w, 0)).toEqual({ x: c.cx, y: c.cy });
  });
  it('islandList: Heimat, Möweninsel, Felsbucht; „· Kontor" erst mit Kontor', () => {
    const w = createWorld(3);
    expect(islandList(w)).toEqual([
      { index: 0, label: 'Heimat' },
      { index: 1, label: 'Möweninsel' },
      { index: 2, label: 'Felsbucht' },
    ]);
    w.islands[1]!.kontorId = 901;
    expect(islandList(w)[1]).toEqual({ index: 1, label: 'Möweninsel · Kontor' });
  });
});
