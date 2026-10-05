import { describe, expect, it } from 'vitest';
import { home, createWorld } from '../../src/sim/world';
import type { BuildingDefId, GoodId, World } from '../../src/sim/types';
import {
  shortageEvents,
  shortageSnapshot,
  workCycleKinds,
  workProgress,
} from '../../src/ui/soundEvents';

let nextId = 900;
function addHouse(w: World, demand: Partial<Record<GoodId, number>>): void {
  const id = nextId++;
  w.buildings[id] = {
    id,
    defId: 'house',
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    island: 0,
    house: {
      tier: 1,
      inhabitants: 1,
      demand,
      satisfied: {},
      services: {},
      satisfiedSince: 0,
      supplied: true,
    },
  };
}
function addWorker(w: World, defId: BuildingDefId, x: number, y: number, progress: number): number {
  const id = nextId++;
  w.buildings[id] = { id, defId, x, y, connected: true, progress, state: 'ok', island: 0 };
  return id;
}

describe('shortageEvents (H-A2)', () => {
  it('Übergang Bestand > 0 nach 0 bei nachgefragtem Gut ergibt das Gut', () => {
    const w = createWorld(1);
    addHouse(w, { food: 0.5 });
    home(w).stock.food = 3;
    const before = shortageSnapshot(w);
    home(w).stock.food = 0;
    expect(shortageEvents(before, shortageSnapshot(w))).toEqual(['food']);
  });
  it('ohne Vorgänger (erster Snapshot) und bei schon leerem Gut kein Ereignis', () => {
    const w = createWorld(1);
    addHouse(w, { food: 0.5 });
    home(w).stock.food = 0;
    const a = shortageSnapshot(w);
    expect(shortageEvents(null, a)).toEqual([]);
    expect(shortageEvents(a, shortageSnapshot(w))).toEqual([]);
  });
  it('nicht nachgefragtes Gut und Gut ohne Haus-Bedürfnis: kein Ereignis', () => {
    const w = createWorld(1);
    addHouse(w, { food: 0.5 });
    home(w).stock.wood = 5;
    const before = shortageSnapshot(w);
    home(w).stock.wood = 0;
    expect(shortageEvents(before, shortageSnapshot(w))).toEqual([]);
    const w2 = createWorld(1);
    home(w2).stock.food = 5;
    const b2 = shortageSnapshot(w2);
    home(w2).stock.food = 0; // noch kein Haus mit diesem Bedürfnis
    expect(shortageEvents(b2, shortageSnapshot(w2))).toEqual([]);
  });
  it('Nachfrage 0 zählt nicht; Nachfrage erst im aktuellen Frame zählt nicht', () => {
    const w = createWorld(1);
    addHouse(w, { food: 0 });
    home(w).stock.food = 2;
    const a = shortageSnapshot(w);
    home(w).stock.food = 0;
    expect(shortageEvents(a, shortageSnapshot(w))).toEqual([]);
    const w2 = createWorld(1);
    home(w2).stock.food = 2;
    const b = shortageSnapshot(w2);
    addHouse(w2, { food: 1 });
    home(w2).stock.food = 0;
    expect(shortageEvents(b, shortageSnapshot(w2))).toEqual([]);
  });
  it('Wiederauffüllen ist kein Ereignis', () => {
    const w = createWorld(1);
    addHouse(w, { food: 0.5 });
    home(w).stock.food = 0;
    const a = shortageSnapshot(w);
    home(w).stock.food = 4;
    expect(shortageEvents(a, shortageSnapshot(w))).toEqual([]);
  });
});

describe('Absicherung (Fix-Runde 1)', () => {
  it('Bestand >0 nach 0 nach >0 innerhalb eines Frames ergibt kein Ereignis', () => {
    const w = createWorld(1);
    addHouse(w, { food: 0.5 });
    home(w).stock.food = 3;
    const before = shortageSnapshot(w);
    home(w).stock.food = 0;
    home(w).stock.food = 2;
    expect(shortageEvents(before, shortageSnapshot(w))).toEqual([]);
  });
  it('Zyklusende bei storageFull wird gemeldet (Arbeit lief)', () => {
    const w = createWorld(1);
    const id = addWorker(w, 'lumberjack', 5, 5, 7);
    const prev = workProgress(w);
    w.buildings[id]!.progress = 0;
    w.buildings[id]!.state = 'storageFull';
    expect(workCycleKinds(prev, w, { x0: 0, y0: 0, x1: 20, y1: 20 })).toEqual(['lumberjack']);
  });
  it('mehrere Zyklen in einem Frame ergeben höchstens ein Ereignis je Gebäude', () => {
    const w = createWorld(1);
    const id = addWorker(w, 'lumberjack', 5, 5, 9);
    const prev = workProgress(w);
    w.buildings[id]!.progress = 3; // zwei Zyklen übersprungen, wieder angestiegen
    expect(workCycleKinds(prev, w, { x0: 0, y0: 0, x1: 20, y1: 20 })).toEqual(['lumberjack']);
  });
});

describe('workCycleKinds (H-A2)', () => {
  const view = { x0: 0, y0: 0, x1: 20, y1: 20 };
  it('progress fällt: Zyklusende, Rückgabe ist die Gebäudeart', () => {
    const w = createWorld(1);
    const id = addWorker(w, 'lumberjack', 5, 5, 7);
    const prev = workProgress(w);
    w.buildings[id]!.progress = 0;
    expect(workCycleKinds(prev, w, view)).toEqual(['lumberjack']);
  });
  it('steigender oder gleicher progress (Pause) ergibt nichts', () => {
    const w = createWorld(1);
    const id = addWorker(w, 'lumberjack', 5, 5, 7);
    const prev = workProgress(w);
    expect(workCycleKinds(prev, w, view)).toEqual([]);
    w.buildings[id]!.progress = 8;
    expect(workCycleKinds(prev, w, view)).toEqual([]);
  });
  it('Brand ausgeschlossen', () => {
    const w = createWorld(1);
    const id = addWorker(w, 'quarry', 5, 5, 7);
    const prev = workProgress(w);
    w.buildings[id]!.progress = 0;
    w.buildings[id]!.state = 'burning';
    expect(workCycleKinds(prev, w, view)).toEqual([]);
  });
  it('ausserhalb des Ausschnitts ausgeschlossen', () => {
    const w = createWorld(1);
    const id = addWorker(w, 'quarry', 40, 40, 7);
    const prev = workProgress(w);
    w.buildings[id]!.progress = 0;
    expect(workCycleKinds(prev, w, view)).toEqual([]);
  });
  it('nicht produzierende Gebäude, neue und abgerissene Gebäude ergeben nichts', () => {
    const w = createWorld(1);
    const h = addWorker(w, 'chapel', 5, 5, 7);
    const gone = addWorker(w, 'fisher', 6, 6, 7);
    const prev = workProgress(w);
    w.buildings[h]!.progress = 0;
    delete w.buildings[gone];
    addWorker(w, 'fisher', 7, 7, 0); // neu: nicht in prev
    expect(workCycleKinds(prev, w, view)).toEqual([]);
  });
  it('mehrere Betriebe: je ein Eintrag', () => {
    const w = createWorld(1);
    const a = addWorker(w, 'lumberjack', 1, 1, 3);
    const b = addWorker(w, 'fisher', 2, 2, 3);
    const prev = workProgress(w);
    w.buildings[a]!.progress = 0;
    w.buildings[b]!.progress = 0;
    expect(workCycleKinds(prev, w, view).sort()).toEqual(['fisher', 'lumberjack']);
  });
});
