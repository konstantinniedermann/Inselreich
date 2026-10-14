import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { TICK_MS } from '../../src/sim/defs/timing';
import type { Building, BuildingDefId, BuildingState, World } from '../../src/sim/types';
import { createWorld, home, idx } from '../../src/sim/world';
import { newHouseState } from '../../src/sim/population';
import {
  problemList,
  problemStep,
  runProblemJump,
  type ProblemCursor,
} from '../../src/ui/problems';
import {
  FULL_PROBLEM_SECONDS,
  FULL_PROBLEM_TICKS,
  storageProblems,
  trackFullSince,
} from '../../src/ui/storageFull';
import { forceGrass } from '../sim/helpers';

const newWorld = (): World => createWorld(3, { crisisLevel: 'off', unlockAll: true });

function raw(w: World, defId: BuildingDefId, x: number, y: number, state: BuildingState): Building {
  const id = w.nextBuildingId++;
  const d = BUILDING_DEFS[defId];
  const b: Building = { id, defId, x, y, connected: true, progress: 0, state, island: 0 };
  w.buildings[id] = b;
  for (let dy = 0; dy < d.h; dy++)
    for (let dx = 0; dx < d.w; dx++) {
      forceGrass(w, x + dx, y + dy);
      home(w).tiles[idx(home(w), x + dx, y + dy)]!.buildingId = id;
    }
  return b;
}

const full = (w: World, stock = STORAGE_CAP): void => {
  home(w).stock.wood = stock;
};
/** Welt mit vollem Holzlager und `n` Holzfällern im Stau. */
function jammed(n = 1): { w: World; lj: Building[]; since: Map<string, number> } {
  const w = newWorld();
  full(w);
  const k = w.buildings[home(w).kontorId]!;
  const lj = Array.from({ length: n }, (_, i) =>
    raw(w, 'lumberjack', k.x + 6 + i * 3, k.y - 6, 'storageFull'),
  );
  return { w, lj, since: new Map() };
}
const keys = (w: World, since: Map<string, number>): string[] =>
  storageProblems(w, since).map((p) => `${p.island}:${p.good}`);

describe('I-085 Lager voll: Zähler und Bedingung', () => {
  it('AK-2 Frist aus TICK_MS: 29,9 s kein Eintrag, 30 s einer', () => {
    expect(FULL_PROBLEM_TICKS).toBe(Math.ceil((FULL_PROBLEM_SECONDS * 1000) / TICK_MS));
    const { w, since } = jammed();
    w.tick = 1000;
    trackFullSince(since, w);
    w.tick = 1000 + Math.round((29.9 * 1000) / TICK_MS);
    trackFullSince(since, w);
    expect(keys(w, since)).toEqual([]);
    w.tick = 1000 + Math.round((30 * 1000) / TICK_MS);
    trackFullSince(since, w);
    expect(keys(w, since)).toEqual(['0:wood']);
  });

  it('AK-2 Pause: ohne Ticks läuft die Frist nicht', () => {
    const { w, since } = jammed();
    w.tick = 500;
    trackFullSince(since, w);
    for (let i = 0; i < 50; i++) trackFullSince(since, w); // Zeit steht, HUD-Takt läuft
    expect(keys(w, since)).toEqual([]);
  });

  it('AK-1 drei Holzfäller ergeben einen Eintrag', () => {
    const { w, since } = jammed(3);
    trackFullSince(since, w);
    w.tick += FULL_PROBLEM_TICKS;
    trackFullSince(since, w);
    const e = storageProblems(w, since);
    expect(e).toHaveLength(1);
    expect(e[0]!.producers).toHaveLength(3);
  });

  it('AK-3 keine Einträge: Stock 99, kein Stau, nur stillgelegt', () => {
    const run = (setup: (j: ReturnType<typeof jammed>) => void): string[] => {
      const j = jammed();
      setup(j);
      trackFullSince(j.since, j.w);
      j.w.tick += FULL_PROBLEM_TICKS;
      trackFullSince(j.since, j.w);
      return keys(j.w, j.since);
    };
    expect(run((j) => full(j.w, STORAGE_CAP - 1))).toEqual([]);
    expect(run((j) => (j.lj[0]!.state = 'ok'))).toEqual([]);
    expect(run((j) => (j.lj[0]!.paused = true))).toEqual([]);
    expect(run((j) => (j.lj[0]!.connected = false))).toEqual([]);
    expect(run(() => {})).toEqual(['0:wood']);
  });

  it('AK-4 Stock unter 100 löscht den Zähler, nächstes „voll" startet neu', () => {
    const { w, since } = jammed();
    trackFullSince(since, w);
    w.tick += FULL_PROBLEM_TICKS - 1;
    full(w, 99);
    trackFullSince(since, w);
    expect(since.size).toBe(0);
    full(w);
    w.tick += 1;
    trackFullSince(since, w);
    w.tick += FULL_PROBLEM_TICKS - 1;
    trackFullSince(since, w);
    expect(keys(w, since)).toEqual([]);
  });

  it('AK-4 sinkender Tick (Laden) leert alle Zähler', () => {
    const { w, since } = jammed();
    w.tick = 900;
    trackFullSince(since, w);
    w.tick = 100;
    trackFullSince(since, w);
    w.tick = 100 + FULL_PROBLEM_TICKS - 1;
    trackFullSince(since, w);
    expect(keys(w, since)).toEqual([]);
  });

  it('R577 (2) andere Welt (Laden mit gleichem/höherem Tick, Neues Spiel) setzt zurück', () => {
    const a = jammed();
    a.w.tick = 500;
    trackFullSince(a.since, a.w);
    const b = jammed(); // frische Welt, gleicher Tick, derselbe Zähler
    b.w.tick = 500 + FULL_PROBLEM_TICKS;
    trackFullSince(a.since, b.w);
    expect(keys(b.w, a.since)).toEqual([]);
    const c = jammed();
    c.w.tick = 9999; // höherer Tick
    trackFullSince(a.since, c.w);
    c.w.tick += FULL_PROBLEM_TICKS - 1;
    trackFullSince(a.since, c.w);
    expect(keys(c.w, a.since)).toEqual([]);
  });

  it('R577 Flackern: ein Tick ohne Stau lässt Zähler und Eintrag stehen', () => {
    const { w, lj, since } = jammed();
    trackFullSince(since, w);
    w.tick += FULL_PROBLEM_TICKS - 1;
    lj[0]!.state = 'ok'; // ein Tick kein Stau
    trackFullSince(since, w);
    lj[0]!.state = 'storageFull';
    w.tick += 1;
    trackFullSince(since, w);
    expect(keys(w, since)).toEqual(['0:wood']);
    // Eintrag bleibt auch im Flacker-Tick selbst sichtbar
    lj[0]!.state = 'ok';
    w.tick += 1;
    trackFullSince(since, w);
    expect(keys(w, since)).toEqual(['0:wood']);
  });

  it('R577 Flackern: echtes Ende des Staus (über die Karenz) löscht den Zähler', () => {
    const { w, lj, since } = jammed();
    trackFullSince(since, w);
    w.tick += FULL_PROBLEM_TICKS;
    lj[0]!.state = 'ok';
    trackFullSince(since, w);
    w.tick += 600; // 60 s ohne Stau
    trackFullSince(since, w);
    expect(since.size).toBe(0);
    expect(keys(w, since)).toEqual([]);
  });
});

describe('I-085 Lager voll: Problemliste', () => {
  const aged = (j: ReturnType<typeof jammed>): void => {
    trackFullSince(j.since, j.w);
    j.w.tick += FULL_PROBLEM_TICKS;
    trackFullSince(j.since, j.w);
  };

  it('AK-5/6 Klasse 5 mit Text, Schlüssel und Erzeuger als Ziel', () => {
    const j = jammed(2);
    aged(j);
    const list = problemList(j.w, 0, j.since);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      cls: 5,
      key: 's:0:wood',
      text: 'Holz-Lager voll (100): Ware verfällt — stilllegen oder verkaufen',
    });
    expect(j.lj.map((b) => b.id)).toContain(list[0]!.id);
  });

  it('AK-6 sortiert hinter den Klassen 1–4', () => {
    const j = jammed();
    const k = j.w.buildings[home(j.w).kontorId]!;
    raw(j.w, 'weaver', k.x + 6, k.y + 6, 'waitingInput');
    aged(j);
    expect(problemList(j.w, 0, j.since).map((p) => p.cls)).toEqual([2, 5]);
  });

  it('AK-9 ohne Zähler (Default) keine Klasse 5', () => {
    const j = jammed();
    aged(j);
    expect(problemList(j.w, 0)).toEqual([]);
  });

  it('AK-7 unter 30 s kein Rauschen', () => {
    const j = jammed();
    trackFullSince(j.since, j.w);
    j.w.tick += FULL_PROBLEM_TICKS - 1;
    trackFullSince(j.since, j.w);
    expect(problemList(j.w, 0, j.since)).toEqual([]);
  });

  it('Klasse 4 und 5 mit demselben Gut: eigene Schlüssel, Umlauf erreicht beide', () => {
    const w = newWorld();
    const k = w.buildings[home(w).kontorId]!;
    home(w).stock.food = STORAGE_CAP;
    raw(w, 'fisher', k.x + 6, k.y - 6, 'storageFull');
    const h = raw(w, 'house', k.x + 3, k.y + 3, 'ok');
    h.house = { ...newHouseState(w), inhabitants: 4, supplied: true, satisfied: { food: false } };
    const since = new Map<string, number>();
    trackFullSince(since, w);
    w.tick += FULL_PROBLEM_TICKS;
    trackFullSince(since, w);
    const list = problemList(w, 0, since);
    expect(list.map((p) => p.cls)).toEqual([4, 5]);
    expect(new Set(list.map((p) => p.key)).size).toBe(2);
    let cur: ProblemCursor | null = null;
    const seen: number[] = [];
    for (let i = 0; i < 4; i++) {
      const st: NonNullable<ReturnType<typeof problemStep>> = problemStep(w, cur, 0, 1, since)!;
      seen.push(st.problem.cls);
      cur = { ...st.cursor, landed: 0 };
    }
    expect(seen).toEqual([4, 5, 4, 5]);
  });

  it('Insel-Suffix für Klasse 5 auf einer Fremdinsel', () => {
    const w = newWorld();
    w.islands[2]!.stock.wood = STORAGE_CAP;
    w.buildings[950] = {
      id: 950,
      defId: 'lumberjack',
      x: 6,
      y: 8,
      island: 2,
      connected: true,
      progress: 0,
      state: 'storageFull',
    } as Building;
    const since = new Map<string, number>();
    trackFullSince(since, w);
    w.tick += FULL_PROBLEM_TICKS;
    trackFullSince(since, w);
    const list = problemList(w, 0, since);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ cls: 5, key: 's:2:wood', island: 2 });
    expect(list[0]!.text).toMatch(/ \(Felsbucht\)$/);
  });

  it('runProblemJump reicht fullSince an die Liste weiter', () => {
    const j = jammed();
    aged(j);
    const panel: number[] = [];
    const msgs: string[] = [];
    let cursor: ProblemCursor | null = null;
    const deps = (fullSince?: Map<string, number>): Parameters<typeof runProblemJump>[0] => ({
      world: j.w,
      fullSince,
      activeIsland: () => 0,
      getCursor: () => cursor,
      setCursor: (c) => (cursor = c),
      cancelPointerAction: () => {},
      centerOn: () => {},
      openPanel: (id) => panel.push(id),
      refresh: () => {},
      message: (t) => msgs.push(t),
    });
    runProblemJump(deps(j.since), 1);
    expect(panel).toEqual([j.lj[0]!.id]);
    expect(msgs[0]).toMatch(/^Problem 1 von 1: Holz-Lager voll/);
    cursor = null;
    runProblemJump(deps(), 1); // ohne Zähler keine Klasse 5
    expect(msgs[1]).toBe('Alles versorgt, kein Problem offen');
  });
});

describe('AK-UA3-19 Zähler-Schlüssel', () => {
  it('kein Schlüssel des Zählers beginnt mit «g:» (Doppelbelegung mit problems.ts)', () => {
    const { w, since } = jammed();
    trackFullSince(since, w);
    expect(since.size).toBeGreaterThan(0);
    expect([...since.keys()].filter((k) => k.startsWith('g:'))).toEqual([]);
    expect([...since.keys()].some((k) => k.startsWith('f:'))).toBe(true);
  });
});
