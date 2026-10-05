import { beforeEach, describe, expect, it } from 'vitest';
import { createWorld, idx, home } from '../../src/sim/world';
import { placeBuilding, placeRoad, removeRoad } from '../../src/sim/build';
import {
  isBuildingConnected,
  kontorRoadRoots,
  reachableRoads,
  recomputeConnectivity,
} from '../../src/sim/roads';
import type { Building, World } from '../../src/sim/types';
import { prepareEast } from './helpers';

let w: World;
let k: Building;

beforeEach(() => {
  w = createWorld(3);
  k = w.buildings[home(w).kontorId]!;
  prepareEast(w, k);
});

describe('connectivity', () => {
  it('connects a lumberjack via road to the kontor and disconnects when the road breaks', () => {
    for (let i = 0; i < 4; i++) expect(placeRoad(w, k.x + 2 + i, k.y).ok).toBe(true);
    const res = placeBuilding(w, 'lumberjack', k.x + 6, k.y);
    expect(res.ok).toBe(true);
    const lj = w.buildings[res.id!]!;
    expect(lj.connected).toBe(true);
    expect(lj.state).toBe('ok');

    expect(removeRoad(w, k.x + 4, k.y).ok).toBe(true);
    expect(lj.connected).toBe(false);
    expect(lj.state).toBe('notConnected');

    expect(placeRoad(w, k.x + 4, k.y).ok).toBe(true);
    expect(lj.connected).toBe(true);
    expect(lj.state).toBe('ok');
  });

  it('kontor is always connected, houses never via roads', () => {
    expect(isBuildingConnected(w, k, new Set())).toBe(true);
    for (let i = 0; i < 4; i++) placeRoad(w, k.x + 2 + i, k.y);
    const res = placeBuilding(w, 'house', k.x + 2, k.y - 1);
    expect(res.ok).toBe(true);
    recomputeConnectivity(w);
    expect(w.buildings[res.id!]!.connected).toBe(false);
    expect(k.connected).toBe(true);
  });

  it('building adjacent to kontor without any road is not connected', () => {
    home(w).tiles[idx(home(w), k.x + 2, k.y - 1)]!.terrain = 'forest';
    const res = placeBuilding(w, 'lumberjack', k.x + 2, k.y);
    expect(res.ok).toBe(true);
    const lj = w.buildings[res.id!]!;
    expect(lj.connected).toBe(false);
    expect(lj.state).toBe('notConnected');
  });

  it('reachableRoads only contains roads linked to the kontor', () => {
    placeRoad(w, k.x + 2, k.y);
    placeRoad(w, k.x + 4, k.y); // Lücke bei +3
    expect(kontorRoadRoots(w)).toContain(idx(home(w), k.x + 2, k.y));
    const set = reachableRoads(w);
    expect(set.has(idx(home(w), k.x + 2, k.y))).toBe(true);
    expect(set.has(idx(home(w), k.x + 4, k.y))).toBe(false);
  });

  it('restores only notConnected to ok; other states are not restored', () => {
    for (let i = 0; i < 4; i++) placeRoad(w, k.x + 2 + i, k.y);
    const lj = w.buildings[placeBuilding(w, 'lumberjack', k.x + 6, k.y).id!]!;
    lj.state = 'waitingInput';
    recomputeConnectivity(w);
    expect(lj.state).toBe('waitingInput'); // verbunden: unangetastet
    removeRoad(w, k.x + 4, k.y);
    expect(lj.state).toBe('notConnected');
    placeRoad(w, k.x + 4, k.y);
    // Die Regel stellt nur 'ok' wieder her; der Tick setzt waitingInput bei Bedarf neu.
    expect(lj.state).toBe('ok');
  });
});
