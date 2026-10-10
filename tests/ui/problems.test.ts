import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import { newHouseState } from '../../src/sim/population';
import type {
  Building,
  BuildingDefId,
  BuildingState,
  GoodId,
  Tier,
  World,
} from '../../src/sim/types';
import { center, createWorld, home, idx } from '../../src/sim/world';
import {
  cutOffIds,
  newlyCut,
  NO_PROBLEM_TEXT,
  problemList,
  problemMessage,
  problemStep,
  runProblemJump,
  type Problem,
  type ProblemCursor,
  type ProblemJumpDeps,
} from '../../src/ui/problems';
import { forceGrass } from '../sim/helpers';

function newWorld(): World {
  return createWorld(3, { crisisLevel: 'off', unlockAll: true });
}

/** Gebäude roh einsetzen (ohne Standortregel), wie in hover.test.ts. */
function raw(
  w: World,
  defId: BuildingDefId,
  x: number,
  y: number,
  state: BuildingState = 'ok',
): Building {
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

function rawHouse(w: World, x: number, y: number, tier: Tier, met: GoodId[]): Building {
  const b = raw(w, 'house', x, y);
  b.house = {
    ...newHouseState(w),
    tier,
    inhabitants: 4,
    satisfied: Object.fromEntries(met.map((g) => [g, true])),
  };
  return b;
}

/** Synthetisches Gebäude ohne Kacheln (nur Liste, wie islandJump.test.ts). */
function synth(
  w: World,
  id: number,
  defId: BuildingDefId,
  island: number,
  x: number,
  y: number,
  state: BuildingState = 'waitingInput',
): Building {
  const b = { id, defId, x, y, island, connected: true, progress: 0, state } as Building;
  w.buildings[id] = b;
  return b;
}

function addKontor2(w: World): void {
  w.buildings[900] = {
    id: 900,
    defId: 'kontor2',
    x: 5,
    y: 7,
    island: 2,
    connected: true,
  } as unknown as Building;
  w.islands[2]!.kontorId = 900;
}

const kontorOf = (w: World): Building => w.buildings[home(w).kontorId]!;
const texts = (w: World): string[] => problemList(w, 0).map((p) => p.text);

describe('REL-17 problems (AK-R17-01…07)', () => {
  it('AK-R17-01 Klassen', () => {
    const w = newWorld();
    const k = kontorOf(w);
    const weaver = raw(w, 'weaver', k.x + 6, k.y - 6);
    weaver.connected = false;
    let list = problemList(w, 0);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ cls: 1, text: 'Weberei nicht angebunden', id: weaver.id });

    weaver.connected = true;
    weaver.state = 'waitingInput'; // Wolle 0 im Startlager
    list = problemList(w, 0);
    expect(list.map((p) => [p.cls, p.text])).toEqual([[2, 'Weberei wartet auf Wolle']]);

    weaver.state = 'ok';
    const lj = raw(w, 'lumberjack', k.x + 10, k.y - 6, 'noForest');
    expect(problemList(w, 0)[0]).toMatchObject({
      cls: 2,
      id: lj.id,
      text: 'Holzfäller: kein freier Wald in der Nähe',
    });
    lj.state = 'ok';

    const far = raw(w, 'house', 1, 1);
    far.house = newHouseState(w);
    far.x = home(w).width - 2;
    far.y = home(w).height - 2;
    expect(problemList(w, 0)[0]).toMatchObject({
      cls: 1,
      id: far.id,
      text: 'Pionierhaus ausserhalb der Versorgung',
    });
    delete w.buildings[far.id];

    const sh = rawHouse(w, k.x + 2, k.y - 2, 2, ['food', 'cloth']);
    expect(problemList(w, 0).map((p) => [p.cls, p.text])).toEqual([
      [3, 'Kapelle fehlt am Siedlerhaus'],
    ]);
    delete w.buildings[sh.id];

    const h1 = rawHouse(w, k.x + 2, k.y - 2, 2, ['food']);
    rawHouse(w, k.x + 3, k.y - 2, 2, ['food']);
    rawHouse(w, k.x + 4, k.y - 2, 2, ['food']);
    const cloth = problemList(w, 0).filter((p) => p.cls === 4);
    expect(cloth).toHaveLength(1);
    expect(cloth[0]).toMatchObject({ text: 'Stoff fehlt in 3 Häusern', id: h1.id });
  });

  it('AK-R17-01 noService: braucht eine Dienstgebäude in Reichweite', () => {
    const w = newWorld();
    const k = kontorOf(w);
    raw(w, 'toolmaker', k.x + 6, k.y - 6, 'noService');
    expect(texts(w)).toEqual(['Werkzeugmacher braucht eine Schule in Reichweite']);
  });

  it('AK-R17-02 Ausschlüsse', () => {
    const w = newWorld();
    const k = kontorOf(w);
    raw(w, 'weaver', k.x + 6, k.y - 6, 'storageFull');
    const burnt = raw(w, 'weaver', k.x + 9, k.y - 6, 'waitingInput');
    burnt.outageUntil = 999;
    burnt.connected = false;
    const burning = raw(w, 'weaver', k.x + 12, k.y - 6, 'burning');
    burning.connected = false;
    raw(w, 'townhall', k.x + 6, k.y + 4).connected = false;
    rawHouse(w, k.x + 2, k.y - 2, 1, ['food']);
    expect(k.defId).toBe('kontor');
    expect(problemList(w, 0)).toEqual([]);
    expect(cutOffIds(w).size).toBe(0);
  });

  it('AK-R17-03 Reihenfolge', () => {
    const w = newWorld();
    const far = synth(w, 501, 'weaver', 0, 10, 10);
    const near = synth(w, 502, 'weaver', 0, 4, 4);
    const k = kontorOf(w);
    const nearer = synth(w, 503, 'weaver', 0, k.x + 4, k.y);
    let ids = problemList(w, 0).map((p) => p.id);
    expect(ids[0]).toBe(nearer.id);
    expect(new Set(ids)).toEqual(new Set([far.id, near.id, nearer.id]));

    // gleicher Abstand (Spiegelung um das Kontor): kleinere ID zuerst
    const w2 = newWorld();
    const k2 = kontorOf(w2);
    synth(w2, 610, 'weaver', 0, k2.x + 6, k2.y);
    synth(w2, 605, 'weaver', 0, k2.x - 6 + 0, k2.y);
    const d = (b: Building): number => Math.hypot(b.x - k2.x, b.y - k2.y);
    const a = w2.buildings[610]!;
    const b = w2.buildings[605]!;
    expect(d(a)).toBeCloseTo(d(b), 9);
    expect(problemList(w2, 0).map((p) => p.id)).toEqual([605, 610]);

    // Klasse vor Abstand
    const c1 = synth(w2, 700, 'weaver', 0, k2.x + 40, k2.y, 'ok');
    c1.connected = false;
    expect(problemList(w2, 0)[0]!.id).toBe(700);

    ids = problemList(w, 0).map((p) => p.id);
    expect(problemList(w, 0)).toEqual(problemList(w, 0));
    expect(problemList(w, 0).map((p) => p.id)).toEqual(ids);
  });

  describe('AK-R17-04 Inseln und Umlauf', () => {
    function twoIslands(): World {
      const w = newWorld();
      addKontor2(w);
      synth(w, 801, 'weaver', 0, 20, 20);
      synth(w, 802, 'weaver', 0, 24, 20);
      synth(w, 803, 'weaver', 2, 6, 8);
      synth(w, 804, 'weaver', 2, 9, 8);
      return w;
    }
    const keyIds = (w: World, anchor: number): number[] => problemList(w, anchor).map((p) => p.id);

    it('Anker-Insel zuerst', () => {
      const w = twoIslands();
      expect(keyIds(w, 2).slice(0, 2).sort()).toEqual([803, 804]);
      expect(keyIds(w, 0).slice(0, 2).sort()).toEqual([801, 802]);
    });

    it('+1: jeder Eintrag einmal je Umlauf, danach wieder der erste', () => {
      const w = twoIslands();
      const m = problemList(w, 0).length;
      expect(m).toBe(4);
      let cursor: ProblemCursor | null = null;
      let active = 0;
      const seen: string[] = [];
      for (let i = 0; i < m + 1; i++) {
        const s: NonNullable<ReturnType<typeof problemStep>> = problemStep(w, cursor, active, 1)!;
        expect(s.count).toBe(m);
        expect(s.index).toBe((i % m) + 1);
        seen.push(s.problem.key);
        active = s.problem.island;
        cursor = { ...s.cursor, landed: active };
      }
      expect(new Set(seen.slice(0, m)).size).toBe(m);
      expect(seen[m]).toBe(seen[0]);
      expect(seen[0]).toBe(problemList(w, 0)[0]!.key);
    });

    it('-1: ohne Cursor letzter, Umlauf rückwärts', () => {
      const w = twoIslands();
      const list = problemList(w, 0);
      let s = problemStep(w, null, 0, -1)!;
      expect(s.problem.key).toBe(list.at(-1)!.key);
      expect(s.index).toBe(list.length);
      let cursor: ProblemCursor = { ...s.cursor, landed: s.problem.island };
      s = problemStep(w, cursor, s.problem.island, -1)!;
      expect(s.problem.key).toBe(list.at(-2)!.key);
      // Umlauf am Anfang
      const first = problemStep(w, null, 0, 1)!;
      cursor = { ...first.cursor, landed: first.problem.island };
      expect(problemStep(w, cursor, first.problem.island, -1)!.problem.key).toBe(list.at(-1)!.key);
    });

    it('verschwundener Schlüssel: nächster bzw. vorheriger nach Sortierschlüssel', () => {
      const w = twoIslands();
      const list = problemList(w, 0);
      const s = problemStep(w, null, 0, 1)!; // Eintrag 0
      const s2 = problemStep(w, { ...s.cursor, landed: s.problem.island }, s.problem.island, 1)!;
      const gone = s2.problem;
      w.buildings[gone.id]!.state = 'ok';
      const cur: ProblemCursor = { ...s2.cursor, landed: gone.island };
      expect(problemStep(w, cur, gone.island, 1)!.problem.key).toBe(list[2]!.key);
      expect(problemStep(w, cur, gone.island, -1)!.problem.key).toBe(list[0]!.key);
    });

    it('landed ≠ activeIsland: Neustart mit neuem Anker', () => {
      const w = twoIslands();
      const s = problemStep(w, null, 0, 1)!;
      const cur: ProblemCursor = { ...s.cursor, landed: 0 };
      const r = problemStep(w, cur, 2, 1)!;
      expect(r.problem.key).toBe(problemList(w, 2)[0]!.key);
      expect(r.cursor.anchor).toBe(2);
      expect(r.index).toBe(1);
    });

    it('keine Probleme: null', () => {
      const w = newWorld();
      expect(problemStep(w, null, 0, 1)).toBeNull();
      expect(problemStep(w, null, 0, -1)).toBeNull();
    });
  });

  it('AK-R17-05 Texte', () => {
    const w = newWorld();
    const k = kontorOf(w);
    const weaver = raw(w, 'weaver', k.x + 6, k.y - 6, 'waitingInput');
    const p = problemList(w, 0)[0]!;
    expect(problemMessage(2, 5, p)).toBe('Problem 2 von 5: Weberei wartet auf Wolle');
    expect(NO_PROBLEM_TEXT).toBe('Alles versorgt, kein Problem offen');
    delete w.buildings[weaver.id];

    addKontor2(w);
    synth(w, 810, 'weaver', 2, 6, 8);
    const f = problemList(w, 0)[0]!;
    expect(f.text).toBe('Weberei wartet auf Wolle (Felsbucht)');
    delete w.buildings[810];

    rawHouse(w, k.x + 2, k.y - 2, 2, ['food', 'cloth']);
    const h = rawHouse(w, k.x + 3, k.y - 2, 2, ['food']);
    delete w.buildings[h.id];
    const eins = problemList(w, 0).find((q) => q.cls === 3);
    expect(eins).toBeDefined();
    for (const b of Object.values(w.buildings)) if (b.defId === 'house') delete w.buildings[b.id];

    rawHouse(w, k.x + 2, k.y - 2, 2, ['food']);
    expect(texts(w).some((t) => t === 'Stoff fehlt in 1 Haus')).toBe(true);
    for (const b of Object.values(w.buildings)) if (b.defId === 'house') delete w.buildings[b.id];

    rawHouse(w, k.x + 2, k.y - 2, 3, ['food', 'cloth', 'rum']);
    expect(texts(w)).toEqual(['Kapelle und Schule fehlen am Bürgerhaus']);
  });

  it('AK-R17-06 Sprungpunkt', () => {
    const w = newWorld();
    addKontor2(w);
    const wv = synth(w, 820, 'weaver', 2, 11, 13);
    const isl = w.islands[2]!;
    const c = center(BUILDING_DEFS.weaver, 11, 13);
    const p = problemList(w, 0).find((q) => q.id === wv.id)!;
    expect(p.at).toEqual({ x: isl.ox + c.cx, y: isl.oy + c.cy });
    expect(p.key).toBe(`b:${wv.id}`);
  });

  it('AK-R17-07 rein', () => {
    const w = newWorld();
    const k = kontorOf(w);
    raw(w, 'weaver', k.x + 6, k.y - 6, 'waitingInput');
    rawHouse(w, k.x + 2, k.y - 2, 2, ['food']);
    const before = JSON.stringify(w);
    const list = problemList(w, 0);
    problemStep(w, null, 0, 1);
    problemStep(w, null, 0, -1);
    cutOffIds(w);
    expect(list.length).toBeGreaterThan(0);
    expect(JSON.stringify(w)).toBe(before);
    const src = readFileSync('src/ui/problems.ts', 'utf8');
    expect(src).not.toMatch(/\bdocument\b/);
    expect(src).not.toMatch(/\bwindow\b/);
  });
});

describe('REL-17 runProblemJump (AK-R17-10)', () => {
  function fakeDeps(
    w: World,
    camera: (p: Problem) => number,
  ): {
    deps: ProblemJumpDeps;
    log: string[];
    calls: { center: unknown[]; panel: number[]; messages: string[] };
    state: { cursor: ProblemCursor | null; active: number };
  } {
    const log: string[] = [];
    const calls = { center: [] as unknown[], panel: [] as number[], messages: [] as string[] };
    const state = { cursor: null as ProblemCursor | null, active: 0 };
    let pending: Problem | null = null;
    const deps: ProblemJumpDeps = {
      world: w,
      activeIsland: () => state.active,
      getCursor: () => state.cursor,
      setCursor: (c) => {
        log.push('cursor');
        state.cursor = c;
      },
      cancelPointerAction: () => log.push('cancel'),
      centerOn: (x, y) => {
        log.push('center');
        calls.center.push({ x, y });
        pending = problemList(w, state.cursor?.anchor ?? state.active).find(
          (p) => p.at.x === x && p.at.y === y,
        )!;
      },
      openPanel: (id) => {
        log.push('panel');
        calls.panel.push(id);
      },
      refresh: () => {
        log.push('refresh');
        if (pending) state.active = camera(pending);
      },
      message: (t) => {
        log.push('message');
        calls.messages.push(t);
      },
    };
    return { deps, log, calls, state };
  }

  function twoIslands(): World {
    const w = newWorld();
    addKontor2(w);
    synth(w, 801, 'weaver', 0, 20, 20);
    synth(w, 803, 'weaver', 2, 6, 8);
    return w;
  }

  it('Reihenfolge, Argumente, Cursor-landed nach refresh, Meldung', () => {
    const w = twoIslands();
    const { deps, log, calls, state } = fakeDeps(w, (p) => p.island);
    runProblemJump(deps, 1);
    expect(log).toEqual(['cancel', 'center', 'panel', 'refresh', 'cursor', 'message']);
    const first = problemList(w, 0)[0]!;
    expect(calls.center[0]).toEqual(first.at);
    expect(calls.panel[0]).toBe(first.id);
    expect(state.cursor!.landed).toBe(first.island);
    expect(calls.messages[0]).toBe(problemMessage(1, 2, first));
  });

  it('Kamera klemmt: landed folgt activeIsland, nicht problem.island', () => {
    const w = twoIslands();
    const { deps, state } = fakeDeps(w, () => 1);
    runProblemJump(deps, 1);
    expect(state.cursor!.landed).toBe(1);
  });

  it('0 Probleme: nur cancel und Meldung, Cursor null', () => {
    const w = newWorld();
    const { deps, log, calls, state } = fakeDeps(w, () => 0);
    state.cursor = { key: 'b:1', sort: [1, 0, 0, 1], anchor: 0, landed: 0 };
    runProblemJump(deps, 1);
    expect(log).toEqual(['cancel', 'cursor', 'message']);
    expect(state.cursor).toBeNull();
    expect(calls.messages).toEqual([NO_PROBLEM_TEXT]);
  });

  it('zwei Aufrufe mit gefolgter Kamera besuchen beide Inseln je einmal', () => {
    const w = twoIslands();
    const { deps, calls } = fakeDeps(w, (p) => p.island);
    runProblemJump(deps, 1);
    runProblemJump(deps, 1);
    expect([...calls.panel].sort()).toEqual([801, 803]);
    runProblemJump(deps, 1);
    expect(calls.panel[2]).toBe(calls.panel[0]);
  });
});

describe('REL-17 newlyCut (AK-R17-15)', () => {
  it('zählt nur neu getrennte Betriebe', () => {
    const w = newWorld();
    const k = kontorOf(w);
    const weaver = raw(w, 'weaver', k.x + 6, k.y - 6);
    const before = cutOffIds(w);
    expect(before.size).toBe(0);
    weaver.connected = false;
    expect(newlyCut(before, w)).toBe(1);
    expect(newlyCut(cutOffIds(w), w)).toBe(0);
    const hall = raw(w, 'townhall', k.x + 6, k.y + 4);
    hall.connected = false;
    expect(newlyCut(before, w)).toBe(1);
  });
});
