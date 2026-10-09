import { describe, expect, it } from 'vitest';
import { mapLayout, tileToMap } from '../../src/render/seaMap';
import {
  SEA_MAP_H,
  SEA_MAP_PAD,
  SEA_MAP_W,
  seaMapKey,
  seaMapPick,
  seaMapTip,
  seaMapUnavailable,
} from '../../src/ui/seaMapView';
import { laneTicks } from '../../src/sim/islands';
import { islandList } from '../../src/ui/islandJump';
import { createWorld } from '../../src/sim/world';
import { seaWorld, shipLiteral } from '../sim/seaHelpers';

const route = { a: 0, b: 1, ab: [], ba: [] };
const layoutOf = (w: ReturnType<typeof seaWorld>) =>
  mapLayout(w, SEA_MAP_W, SEA_MAP_H, SEA_MAP_PAD);

function landPoint(w: ReturnType<typeof seaWorld>, i: number) {
  const s = w.islands[i]!;
  const k = s.tiles.findIndex((t) => t.terrain !== 'water');
  return tileToMap(layoutOf(w), s.ox + (k % s.width) + 0.5, s.oy + Math.floor(k / s.width) + 0.5);
}

describe('seaMapKey (AK-S10)', () => {
  it('bleibt bei Tick ohne sichtbare Änderung gleich', () => {
    const w = seaWorld();
    shipLiteral(w, { route, port: 0, to: 1, left: 100000 });
    const k = seaMapKey(w, layoutOf(w));
    w.tick += 1;
    expect(seaMapKey(w, layoutOf(w))).toBe(k);
  });
  it('ändert sich bei Schiffsbewegung um mindestens einen Karten-Pixel', () => {
    const w = seaWorld();
    const ship = shipLiteral(w, { route, port: 0, to: 1, left: 1 });
    const l = layoutOf(w);
    const keys = new Set<string>();
    const total = laneTicks(w.islands, 0, 1);
    for (let left = total; left > 0; left -= Math.max(1, Math.floor(total / 400))) {
      ship.left = left;
      keys.add(seaMapKey(w, l));
    }
    expect(keys.size).toBeGreaterThan(5);
    // weniger Schlüssel als Schritte: Redraw wird gespart
    expect(keys.size).toBeLessThan(400);
  });
  it('ändert sich bei Kontorgründung und Inselzahl', () => {
    const w = seaWorld();
    const l = layoutOf(w);
    const k = seaMapKey(w, l);
    w.islands[1]!.kontorId = 99;
    const k2 = seaMapKey(w, l);
    expect(k2).not.toBe(k);
    w.islands.pop();
    expect(seaMapKey(w, l)).not.toBe(k2);
  });
  it('ein Schiff ohne Route verändert den Schlüssel nicht', () => {
    const w = seaWorld();
    const k = seaMapKey(w, layoutOf(w));
    shipLiteral(w, { route: null });
    expect(seaMapKey(w, layoutOf(w))).toBe(k);
  });
});

describe('Hover-Text und Treffer (AK-S11)', () => {
  it('nutzt die Texte von islandList, ohne eigenen Text', () => {
    const w = seaWorld();
    w.islands[1]!.kontorId = 99;
    const list = islandList(w);
    for (let i = 0; i < w.islands.length; i++) {
      const p = landPoint(w, i);
      expect(seaMapTip(w, layoutOf(w), p.x, p.y)).toBe(list[i]!.label);
      expect(seaMapPick(w, layoutOf(w), p.x, p.y)).toBe(i);
    }
    expect(list[0]!.label).toBe('Heimat');
    expect(list[1]!.label).toContain('· Kontor');
  });
  it('Wasser liefert weder Text noch Insel', () => {
    const w = seaWorld();
    expect(seaMapTip(w, layoutOf(w), 0, 0)).toBeNull();
    expect(seaMapPick(w, layoutOf(w), 0, 0)).toBeNull();
  });
});

describe('seaMapUnavailable (AK-S12)', () => {
  it('ohne Seefahrt: Karte nicht verfügbar', () => {
    expect(seaMapUnavailable(createWorld(1))).toBe('Karte nicht verfügbar');
  });
  it('mit Seefahrt: null', () => {
    expect(seaMapUnavailable(seaWorld())).toBeNull();
  });
});
