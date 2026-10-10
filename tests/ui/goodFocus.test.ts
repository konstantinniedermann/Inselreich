import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { buildLock } from '../../src/sim/unlocks';
import type { Building, BuildingDefId, BuildingState, World } from '../../src/sim/types';
import { center, createWorld, home } from '../../src/sim/world';
import {
  emptyFocusMessage,
  focusList,
  focusMessage,
  focusReduce,
  noProducerMessage,
  runFocusStep,
  runFocusToggle,
  shouldClearFocus,
  stepKeyTarget,
  toggleStartsJump,
  type FocusDeps,
  type FocusState,
} from '../../src/ui/goodFocus';
import { runProblemJump, type ProblemCursor } from '../../src/ui/problems';
import { serialize } from '../../src/sim/save';
import { jumpTarget } from '../../src/ui/islandJump';

function newWorld(): World {
  return createWorld(3, { crisisLevel: 'off', unlockAll: true });
}

/** Synthetisches Gebäude ohne Kacheln (wie problems.test.ts). */
function synth(
  w: World,
  id: number,
  defId: BuildingDefId,
  x: number,
  y: number,
  state: BuildingState = 'ok',
  island = 0,
): Building {
  const b = { id, defId, x, y, island, connected: true, progress: 0, state } as Building;
  w.buildings[id] = b;
  return b;
}

const kontorOf = (w: World): Building => w.buildings[home(w).kontorId]!;

function woodWorld(): { w: World; lj1: Building; lj2: Building; glass: Building; tool: Building } {
  const w = newWorld();
  home(w).stock.wood = 0;
  const k = kontorOf(w);
  const lj2 = synth(w, 1002, 'lumberjack', k.x + 12, k.y, 'noForest'); // weiter weg
  const lj1 = synth(w, 1001, 'lumberjack', k.x + 4, k.y, 'noForest');
  const tool = synth(w, 1003, 'toolmaker', k.x + 20, k.y, 'waitingInput');
  const glass = synth(w, 1004, 'glassworks', k.x + 8, k.y, 'ok');
  synth(w, 1005, 'house', k.x + 2, k.y); // Haus fehlt
  synth(w, 1006, 'lumberjack', 3, 3, 'ok', 2); // andere Insel
  return { w, lj1, lj2, glass, tool };
}

describe('UI-GUT-CHIP focusList (AK-GC-01…03)', () => {
  it('AK-GC-01 Reihenfolge, Filter', () => {
    const { w } = woodWorld();
    const list = focusList(w, 0, 'wood');
    expect(list.map((e) => [e.id, e.role])).toEqual([
      [1001, 'producer'],
      [1002, 'producer'],
      [1004, 'consumer'],
      [1003, 'consumer'],
    ]);
    expect(list.map((e) => e.key)).toEqual(['b:1001', 'b:1002', 'b:1004', 'b:1003']);
    const j = jumpTarget(w, 0);
    const e = list[0]!;
    const c = center(BUILDING_DEFS.lumberjack, e.building.x, e.building.y);
    expect(e.at).toEqual({ x: w.islands[0]!.ox + c.cx, y: w.islands[0]!.oy + c.cy });
    expect(e.sort).toEqual([0, 0, Math.hypot(e.at.x - j.x, e.at.y - j.y), 1001]);
    expect(focusList(w, 2, 'wood').map((x) => x.id)).toEqual([1006]);
  });

  it('AK-GC-01 gleicher Abstand: nach ID', () => {
    const w = newWorld();
    const k = kontorOf(w);
    synth(w, 2002, 'lumberjack', k.x + 6, k.y);
    synth(w, 2001, 'lumberjack', k.x + 6, k.y);
    expect(focusList(w, 0, 'wood').map((e) => e.id)).toEqual([2001, 2002]);
  });

  it('AK-GC-02 getrennte, brennende, stillgelegte Gebäude bleiben drin', () => {
    const { w, lj1, lj2, glass } = woodWorld();
    lj1.connected = false;
    lj2.outageUntil = w.tick + 50;
    glass.paused = true;
    const list = focusList(w, 0, 'wood');
    expect(list.map((e) => e.id)).toContain(1001);
    expect(list.map((e) => e.id)).toContain(1002);
    const msg = (id: number): string => {
      const i = list.findIndex((e) => e.id === id);
      return focusMessage(w, 'wood', i + 1, list.length, list[i]!);
    };
    expect(msg(1001)).toContain('Nicht an Kontor angebunden');
    expect(msg(1002)).toMatch(/Brand|brenn/i);
    expect(msg(1004)).toContain('Stillgelegt');
  });

  it('AK-GC-03 M1 wörtlich', () => {
    const { w } = woodWorld();
    const list = focusList(w, 0, 'wood');
    expect(focusMessage(w, 'wood', 1, 4, list[0]!)).toBe(
      'Holz 1 von 4: Holzfäller (Erzeuger) · Kein freier Wald in der Nähe',
    );
    expect(focusMessage(w, 'wood', 4, 4, list[3]!)).toBe(
      'Holz 4 von 4: Werkzeugmacher (Verbraucher) · Wartet auf Holz',
    );
  });
});

describe('UI-GUT-CHIP Meldungen M2/M3 (AK-GC-05)', () => {
  const producers = (w: World): string[] =>
    Object.values(BUILDING_DEFS)
      .filter((d) => d.produces === 'food' && buildLock(w, d.id) === null)
      .map((d) => d.name);

  it('drei freie Erzeuger', () => {
    const w = newWorld();
    const names = producers(w);
    expect(names).toHaveLength(3);
    expect(noProducerMessage(w, 'food')).toBe(
      `Noch kein Erzeuger für Nahrung — Bauen: ${names[0]}, ${names[1]} oder ${names[2]}`,
    );
  });

  it('zwei freie Erzeuger', () => {
    const w = newWorld();
    w.unlocked = ['U0', 'U1', 'U2'];
    const names = producers(w);
    expect(names).toHaveLength(2);
    expect(noProducerMessage(w, 'food')).toBe(
      `Noch kein Erzeuger für Nahrung — Bauen: ${names[0]} oder ${names[1]}`,
    );
  });

  it('ein freier Erzeuger', () => {
    const w = newWorld();
    w.unlocked = ['U0'];
    const names = producers(w);
    expect(names).toHaveLength(1);
    expect(noProducerMessage(w, 'food')).toBe(
      `Noch kein Erzeuger für Nahrung — Bauen: ${names[0]}`,
    );
  });

  it('keiner frei', () => {
    const w = newWorld();
    w.unlocked = [];
    expect(producers(w)).toHaveLength(0);
    expect(noProducerMessage(w, 'food')).toBe(
      'Noch kein Erzeuger für Nahrung — Erzeuger noch nicht frei',
    );
  });

  it('M3', () => {
    expect(emptyFocusMessage('wood')).toBe('Holz: nichts mehr markiert');
  });
});

interface Fake {
  deps: FocusDeps;
  calls: string[];
  focus: FocusState;
  cursor: ProblemCursor | null;
  msgs: string[];
}
function fake(w: World, island = 0): Fake {
  const f: Fake = { calls: [], focus: null, cursor: null, msgs: [], deps: null as never };
  f.deps = {
    world: w,
    activeIsland: () => island,
    getFocus: () => f.focus,
    setFocus: (x) => {
      f.focus = x;
      f.calls.push(`setFocus:${x === null ? 'null' : x.good}`);
    },
    getCursor: () => f.cursor,
    setCursor: (c) => {
      f.cursor = c;
      f.calls.push(`setCursor:${c === null ? 'null' : c.key}`);
    },
    cancelPointerAction: () => f.calls.push('cancel'),
    centerOn: (x, y) => f.calls.push(`center:${x},${y}`),
    openPanel: (id) => f.calls.push(`panel:${id}`),
    refresh: () => f.calls.push('refresh'),
    message: (t) => {
      f.msgs.push(t);
      f.calls.push('msg');
    },
  };
  return f;
}

describe('UI-GUT-CHIP Zustand (AK-GC-07, B2)', () => {
  it('focusReduce / toggleStartsJump', () => {
    const on = focusReduce(null, { kind: 'toggle', good: 'wood', island: 0 });
    expect(on).toEqual({ good: 'wood', island: 0 });
    expect(focusReduce(on, { kind: 'toggle', good: 'wood', island: 0 })).toBeNull();
    expect(focusReduce(on, { kind: 'toggle', good: 'tools', island: 0 })).toEqual({
      good: 'tools',
      island: 0,
    });
    expect(focusReduce(on, { kind: 'clear' })).toBeNull();
    const t = { kind: 'toggle', good: 'wood', island: 0 } as const;
    expect(toggleStartsJump(null, t)).toBe(true);
    expect(toggleStartsJump(on, { ...t, good: 'tools' })).toBe(true);
    expect(toggleStartsJump(on, t)).toBe(false);
  });

  it('B2 stepKeyTarget, shouldClearFocus', () => {
    expect(stepKeyTarget(null)).toBe('problem');
    expect(stepKeyTarget({ good: 'wood', island: 0 })).toBe('focus');
    expect(shouldClearFocus(null, 1)).toBe(false);
    expect(shouldClearFocus({ good: 'wood', island: 0 }, 0)).toBe(false);
    expect(shouldClearFocus({ good: 'wood', island: 0 }, 1)).toBe(true);
  });
});

describe('UI-GUT-CHIP Ablauf (AK-GC-05…09, 12)', () => {
  it('Sprung mit 4 Einträgen, zweiter Klick schaltet aus', () => {
    const { w, lj1 } = woodWorld();
    const f = fake(w);
    runFocusToggle(f.deps, 'wood');
    const e = focusList(w, 0, 'wood')[0]!;
    expect(f.calls.slice(0, 4)).toEqual([
      'cancel',
      'setFocus:wood',
      'setCursor:null',
      `center:${e.at.x},${e.at.y}`,
    ]);
    expect(f.calls.slice(4)).toEqual([`panel:${lj1.id}`, 'refresh', 'setCursor:b:1001', 'msg']);
    expect(f.msgs[0]).toContain('1 von 4: ');
    expect(f.cursor?.landed).toBe(0);
    f.calls.length = 0;
    runFocusToggle(f.deps, 'wood');
    expect(f.focus).toBeNull();
    expect(f.cursor).toBeNull();
    expect(f.msgs).toHaveLength(1);
    expect(f.calls.some((c) => c.startsWith('center'))).toBe(false);
  });

  it('B7 leeres Lager verhält sich gleich', () => {
    const { w } = woodWorld();
    home(w).stock.wood = 0;
    const f = fake(w);
    runFocusToggle(f.deps, 'wood');
    expect(f.focus).toEqual({ good: 'wood', island: 0 });
    expect(f.calls.some((c) => c.startsWith('center'))).toBe(true);
  });

  it('AK-GC-05 nur Verbraucher: M2, Fokus an, kein Sprung', () => {
    const w = newWorld();
    synth(w, 3001, 'toolmaker', kontorOf(w).x + 6, kontorOf(w).y);
    const f = fake(w);
    runFocusToggle(f.deps, 'wood');
    expect(f.msgs).toEqual([noProducerMessage(w, 'wood')]);
    expect(f.focus).toEqual({ good: 'wood', island: 0 });
    expect(f.cursor).toBeNull();
    expect(f.calls.some((c) => c.startsWith('center') || c.startsWith('panel'))).toBe(false);
  });

  it('AK-GC-06 weder Erzeuger noch Verbraucher', () => {
    const w = newWorld();
    const f = fake(w);
    runFocusToggle(f.deps, 'wood');
    expect(f.msgs).toEqual([noProducerMessage(w, 'wood')]);
    expect(f.focus).toBeNull();
    expect(f.cursor).toBeNull();
    expect(f.calls.some((c) => c.startsWith('center') || c.startsWith('panel'))).toBe(false);
  });

  it('AK-GC-08 Umlauf vor und zurück, Problem-Cursor unberührt', () => {
    const { w } = woodWorld();
    const f = fake(w);
    const pf = fake(w);
    pf.focus = null;
    const problemTrail = (): string[] => {
      const c: string[] = [];
      let pc: ProblemCursor | null = null;
      runProblemJump(
        {
          world: w,
          activeIsland: () => 0,
          getCursor: () => pc,
          setCursor: (x) => (pc = x),
          cancelPointerAction: () => {},
          centerOn: () => {},
          openPanel: (id) => c.push(`p${id}`),
          refresh: () => {},
          message: () => {},
        },
        1,
      );
      return c;
    };
    const before = problemTrail();
    runFocusToggle(f.deps, 'wood');
    f.focus = { good: 'wood', island: 0 };
    const keys = [f.cursor!.key];
    for (let i = 0; i < 4; i++) {
      runFocusStep(f.deps, 1);
      keys.push(f.cursor!.key);
    }
    expect(keys).toEqual(['b:1001', 'b:1002', 'b:1004', 'b:1003', 'b:1001']);
    runFocusStep(f.deps, -1);
    expect(f.cursor!.key).toBe('b:1003');
    f.focus = null;
    expect(problemTrail()).toEqual(before);
  });

  it('AK-GC-04 Rückfall bei Abriss', () => {
    const { w } = woodWorld();
    const f = fake(w);
    runFocusToggle(f.deps, 'wood');
    runFocusStep(f.deps, 1); // 1002
    delete w.buildings[1002];
    runFocusStep(f.deps, 1);
    expect(f.cursor!.key).toBe('b:1004');
  });

  it('AK-GC-09 Liste leer: M3, Fokus aus', () => {
    const { w } = woodWorld();
    const f = fake(w);
    runFocusToggle(f.deps, 'wood');
    for (const id of [1001, 1002, 1003, 1004]) delete w.buildings[id];
    f.msgs.length = 0;
    runFocusStep(f.deps, 1);
    expect(f.msgs).toEqual(['Holz: nichts mehr markiert']);
    expect(f.focus).toBeNull();
    expect(f.cursor).toBeNull();
  });

  it('AK-GC-12 Welt unverändert', () => {
    const { w } = woodWorld();
    const before = serialize(w);
    const json = JSON.stringify(w);
    const f = fake(w);
    runFocusToggle(f.deps, 'wood');
    runFocusStep(f.deps, 1);
    runFocusStep(f.deps, 1);
    runFocusToggle(f.deps, 'wood');
    runFocusToggle(f.deps, 'wood');
    runFocusToggle(f.deps, 'tools');
    expect(serialize(w)).toBe(before);
    expect(JSON.stringify(w)).toBe(json);
  });
});
