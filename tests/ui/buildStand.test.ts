import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import type { Building, BuildingDefId, World } from '../../src/sim/types';
import { standLine } from '../../src/ui/buildStand';

let nextId = 9000;
function add(w: World, defId: BuildingDefId, island: number, extra: Partial<Building> = {}): void {
  const id = (nextId += 1);
  w.buildings[id] = {
    id,
    defId,
    x: 0,
    y: 0,
    connected: true,
    progress: 1,
    state: 'ok',
    island,
    ...extra,
  } as Building;
}

describe('standLine (I-167)', () => {
  it('AK-I10 zählt stillgelegte mit Zusatz, ohne Stillgelegte nur die Zahl, sonst noch keins', () => {
    const w = createWorld(3);
    expect(standLine(w, 'fisher', 0)).toBe('Steht: noch keins');
    for (let i = 0; i < 3; i++) add(w, 'fisher', 0);
    add(w, 'fisher', 0, { paused: true });
    expect(standLine(w, 'fisher', 0)).toBe('Steht: 4 (1 still)');
    const v = createWorld(3);
    for (let i = 0; i < 4; i++) add(v, 'fisher', 0);
    expect(standLine(v, 'fisher', 0)).toBe('Steht: 4');
  });

  it('AK-I11 Zusatz alle Inseln nur bei Gebäuden auf anderen Inseln', () => {
    const w = createWorld(3);
    for (let i = 0; i < 2; i++) add(w, 'fisher', 0);
    expect(standLine(w, 'fisher', 0)).toBe('Steht: 2');
    for (let i = 0; i < 3; i++) add(w, 'fisher', 1);
    expect(standLine(w, 'fisher', 0)).toBe('Steht: 2 · alle Inseln: 5');
  });

  it('nur auf anderer Insel: Steht: 0 · alle Inseln: 1', () => {
    const w = createWorld(3);
    add(w, 'fisher', 1);
    expect(standLine(w, 'fisher', 0)).toBe('Steht: 0 · alle Inseln: 1');
  });

  it('AK-I12 null für Kontor, Kontor II, Amtsstube, Denkmal', () => {
    const w = createWorld(3);
    for (const id of ['kontor', 'kontor2', 'townhall', 'monument'] as const) {
      expect(standLine(w, id as BuildingDefId, 0)).toBeNull();
    }
  });

  it('brennende und nicht angebundene zählen als stehend', () => {
    const w = createWorld(3);
    add(w, 'fisher', 0, { state: 'burning', connected: false });
    expect(standLine(w, 'fisher', 0)).toBe('Steht: 1');
  });

  it('AK-I15 verändert die Welt nicht', () => {
    const w = createWorld(3);
    add(w, 'fisher', 0);
    const before = JSON.stringify(w);
    standLine(w, 'fisher', 0);
    expect(JSON.stringify(w)).toBe(before);
  });
});
