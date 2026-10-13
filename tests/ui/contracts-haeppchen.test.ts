import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { center, createWorld } from '../../src/sim/world';
import { balanceText } from '../../src/ui/hud';
import { jumpTarget } from '../../src/ui/islandJump';
import { spot } from '../../src/ui/problems';
import { twoIslandWorld, putBuilding } from '../sim/helpers';

/**
 * AK-18 (R577 (4)): Kontrakt der Funktionen, auf die UI-HAEPPCHEN-B aufsetzt. Benennt A oder ein späterer
 * Umbau eine davon um oder ändert ihre Signatur, bricht dieser Test laut.
 */
describe('Kontrakt: Funktionen, die UI-HAEPPCHEN-B nutzt', () => {
  it('balanceText(stats) liefert text und title mit bekannten Werten', () => {
    expect(typeof balanceText).toBe('function');
    expect(balanceText({ taxes: 0, upkeep: 0 }).text).toBe('Bilanz ±0 / min');
    const r = balanceText({ taxes: 100, upkeep: 40 });
    expect(r.text).toMatch(/^Bilanz \+[\d.]+ \/ min$/);
    expect(r.title).toMatch(/^Steuern \+[\d.]+ \/ min · Unterhalt −[\d.]+ \/ min$/);
    expect(balanceText({ taxes: 0, upkeep: 40 }).text).toMatch(/^Bilanz −[\d.]+ \/ min$/);
  });

  it('spot(world, building) liefert die Mitte in Welt-Kacheln (Inselversatz + Gebäudemitte)', () => {
    const w = twoIslandWorld();
    w.islands[1]!.ox = 50;
    w.islands[1]!.oy = 7;
    const b = putBuilding(w, 1, 'fisher', 4, 5);
    const c = center(BUILDING_DEFS.fisher, 4, 5);
    expect(spot(w, b)).toEqual({ x: 50 + c.cx, y: 7 + c.cy });
  });

  it('jumpTarget(world, insel) liefert die Welt-Position des Kontors, ohne Insel (0, 0)', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[w.islands[0]!.kontorId!]!;
    const c = center(BUILDING_DEFS[k.defId], k.x, k.y);
    expect(jumpTarget(w, 0)).toEqual({ x: w.islands[0]!.ox + c.cx, y: w.islands[0]!.oy + c.cy });
    expect(jumpTarget(w, 99)).toEqual({ x: 0, y: 0 });
  });
});
