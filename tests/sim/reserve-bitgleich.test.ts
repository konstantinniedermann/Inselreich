// I-049 AK-SB-12: Ohne gesetzte Reserve verhält sich die Sim bitgleich wie vor der Änderung.
// Golden (Länge, FNV-1a) aus unverändertem main (ohne Island.reserve) erzeugt: Seed 3, Controller bis Sieg,
// dazu eine Szene mit Werkzeugmachern und Glashütten, deren Holz-/Steinlager leerläuft.
import { describe, expect, it } from 'vitest';
import { reservedInputs } from '../../src/sim/queries';
import { serialize } from '../../src/sim/save';
import type { Building, BuildingDefId, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import { step } from '../../src/sim/tick';
import { runColony, startColony } from './controller';
import { fnv1a32, foldBackToV11, foldBackToV12 } from './helpers';

const SEED = 3;
const GOLD = { tick: 6750, length: 310877, hash: '28bf89ff' };
const SCENE_GOLD = { length: 307073, hash: '7aca09aa' };
const SCENE_TICKS = 1500;

interface Run {
  world: World;
  waiting: number;
  reservedSeen: number;
  buildings: Record<string, number>;
}

function colonyRun(): Run {
  const world = createWorld(SEED);
  const { layout, t } = startColony(world);
  const run: Run = { world, waiting: 0, reservedSeen: 0, buildings: {} };
  runColony(world, layout, t, {}, () => {
    tally(run);
    return false;
  });
  run.buildings = t.buildings;
  return run;
}

/** Werkzeugmacher und Glashütten direkt eingefügt; knappes Holz und Stein, damit Lager leerlaufen. */
function sceneRun(): Run {
  const world = createWorld(3, { unlockAll: true });
  home(world).stock = { ...home(world).stock, wood: 12, stone: 6, glass: 0, tools: 0 };
  const defs: BuildingDefId[] = [
    'toolmaker',
    'glassworks',
    'toolmaker',
    'glassworks',
    'lumberjack',
  ];
  defs.forEach((defId, i) => {
    const b: Building = {
      id: world.nextBuildingId++,
      defId,
      x: 2 + 4 * i,
      y: 5,
      connected: true,
      progress: 0,
      state: 'ok',
      island: 0,
    };
    world.buildings[b.id] = b;
  });
  const run: Run = { world, waiting: 0, reservedSeen: 0, buildings: {} };
  for (let i = 0; i < SCENE_TICKS; i++) {
    step(world);
    tally(run);
  }
  return run;
}

function tally(run: Run): void {
  for (const b of Object.values(run.world.buildings)) {
    if (b.state === 'waitingReserve') run.waiting++;
    run.reservedSeen += reservedInputs(run.world, b).length;
  }
}

/**
 * Serialisierter Zustand ohne die neuen Felder `islands[*].reserve` (I-049) und `buyPct` (I-048). Das Golden stammt
 * aus main vor beiden Paketen; `buyPct` wird vor dem Hash entfernt, nur wenn alle Anteile 100 sind (sonst Fehler).
 */
function withoutReserve(world: World): string {
  // M14-E1: erst auf die v12-Form (ohne unberührte Insel C) falten, dann wie bisher
  const raw = foldBackToV12(JSON.parse(serialize(world)) as Record<string, unknown>) as {
    islands: Record<string, unknown>[];
    buyPct?: Record<string, number>;
  };
  for (const isl of raw.islands) delete isl.reserve;
  if (Object.values(raw.buyPct ?? {}).some((p) => p !== 100))
    throw new Error('withoutReserve: Kaufanteil nicht rückfaltbar');
  delete raw.buyPct;
  return JSON.stringify(raw);
}

describe('Sperrbestand: Bitgleichheit ohne Reserve (AK-SB-12)', () => {
  const colony = colonyRun();
  const scene = sceneRun();

  it('die Szene lässt Glashütte und Werkzeugmacher arbeiten und Lager leerlaufen', () => {
    const st = home(scene.world).stock;
    expect(st.glass + st.tools).toBeGreaterThan(0);
    const states = Object.values(scene.world.buildings).map((b) => b.state);
    expect(states.some((s) => s !== 'ok')).toBe(true);
  });

  it.each([
    ['Kolonie', colony],
    ['Szene', scene],
  ])('%s: alle Reserven 0, kein Betrieb wartet je auf die Reserve', (_n, run) => {
    for (const isl of run.world.islands) expect(isl.reserve).toEqual({ wood: 0, stone: 0 });
    expect(run.waiting).toBe(0);
    expect(run.reservedSeen).toBe(0);
  });

  it('Kolonie: Zustand ohne reserve entspricht dem Stand vor der Änderung (Golden aus main)', () => {
    const s = withoutReserve(colony.world);
    expect(colony.world.tick).toBe(GOLD.tick);
    expect(s.length).toBe(GOLD.length);
    expect(fnv1a32(s).toString(16)).toBe(GOLD.hash);
  });

  it('Szene: Zustand ohne reserve entspricht dem Stand vor der Änderung (Golden aus main)', () => {
    const s = withoutReserve(scene.world);
    expect(s.length).toBe(SCENE_GOLD.length);
    expect(fnv1a32(s).toString(16)).toBe(SCENE_GOLD.hash);
  });

  it('Rückfaltung auf v11 gelingt und entspricht dem Zustand ohne reserve', () => {
    const full = JSON.parse(serialize(scene.world)) as Record<string, unknown>;
    const folded = foldBackToV11(full);
    const stripped = JSON.parse(withoutReserve(scene.world)) as Record<string, unknown>;
    expect(folded.version).toBe(11);
    expect(folded.islands).toEqual(stripped.islands);
  });
});
