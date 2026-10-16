import { describe, expect, it } from 'vitest';
import { islandName } from '../../src/sim/islands';
import type { Building, BuildingDefId, BuildingState, World } from '../../src/sim/types';
import { createWorld, home } from '../../src/sim/world';
import {
  contractKey,
  contractNoProducerMessage,
  nextContractCursor,
  contractProducers,
  runContractJump,
  type ContractJumpDeps,
} from '../../src/ui/contractJump';
import { focusList, focusMessage, noProducerMessage } from '../../src/ui/goodFocus';
import { jumpTarget } from '../../src/ui/islandJump';
import { spot, type ProblemCursor } from '../../src/ui/problems';

function newWorld(): World {
  return createWorld(3, { crisisLevel: 'off', unlockAll: true });
}

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

function woodWorld(): { w: World; lj1: Building; lj2: Building; lj3: Building } {
  const w = newWorld();
  const k = kontorOf(w);
  const lj2 = synth(w, 1002, 'lumberjack', k.x + 12, k.y, 'noForest');
  const lj1 = synth(w, 1001, 'lumberjack', k.x + 4, k.y, 'noForest');
  const lj3 = synth(w, 1003, 'lumberjack', k.x + 20, k.y, 'ok');
  lj3.paused = true; // stillgelegt, aber Erzeuger
  synth(w, 1004, 'toolmaker', k.x + 8, k.y, 'waitingInput'); // Verbraucher von Holz
  synth(w, 1006, 'lumberjack', 3, 3, 'ok', 2); // andere Insel
  w.contract = { good: 'wood', amount: 5, price: 9, island: 0, deliveries: 0 };
  return { w, lj1, lj2, lj3 };
}

interface Fake {
  deps: ContractJumpDeps;
  calls: string[];
  cursor: ProblemCursor | null;
  msgs: string[];
  island: number;
}
function fake(w: World, island = 0): Fake {
  const f: Fake = { calls: [], cursor: null, msgs: [], island, deps: null as never };
  f.deps = {
    world: w,
    activeIsland: () => f.island,
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

describe('I-090 contractProducers (AK-HC-06)', () => {
  it('nur Erzeuger, Reihenfolge wie focusList, stillgelegte inklusive', () => {
    const { w } = woodWorld();
    const list = contractProducers(w);
    expect(list.map((e) => e.id)).toEqual([1001, 1002, 1003]);
    expect(list.every((e) => e.role === 'producer')).toBe(true);
    expect(list.map((e) => e.id)).toEqual(
      focusList(w, 0, 'wood')
        .filter((e) => e.role === 'producer')
        .map((e) => e.id),
    );
  });
  it('ohne Vertrag leer', () => {
    const { w } = woodWorld();
    w.contract = null;
    expect(contractProducers(w)).toEqual([]);
  });
  it('Vertrag auf anderer Insel nimmt deren Erzeuger', () => {
    const { w } = woodWorld();
    w.contract = { good: 'wood', amount: 5, price: 9, island: 2, deliveries: 0 };
    expect(contractProducers(w).map((e) => e.id)).toEqual([1006]);
  });
});

describe('I-090 runContractJump (AK-HC-07 bis 09)', () => {
  it('Schrittfolge 1., 2., 3., Umlauf', () => {
    const { w, lj1, lj2, lj3 } = woodWorld();
    const f = fake(w);
    const ids: string[] = [];
    for (let i = 0; i < 4; i++) {
      runContractJump(f.deps, 1);
      ids.push(f.calls.filter((c) => c.startsWith('panel:')).at(-1)!);
    }
    expect(ids).toEqual([lj1, lj2, lj3, lj1].map((b) => `panel:${b.id}`));
  });
  it('Landung: Kamera auf spot, Panel, refresh, Meldung wie focusMessage, Cursor landed', () => {
    const { w, lj1 } = woodWorld();
    const f = fake(w);
    runContractJump(f.deps, 1);
    const at = spot(w, lj1);
    expect(f.calls).toEqual([
      'cancel',
      `center:${at.x},${at.y}`,
      'panel:1001',
      'refresh',
      'setCursor:b:1001',
      'msg',
    ]);
    expect(f.cursor?.landed).toBe(0);
    const e = contractProducers(w)[0]!;
    expect(f.msgs[0]).toBe(focusMessage(w, 'wood', 1, 3, e));
    expect(f.msgs[0]).toContain('Holz 1 von 3');
    expect(f.msgs[0]).toContain('(Erzeuger)');
  });
  it('Erzeuger zwischen Klicks weg: stepList-Rückfall auf den Nachfolger', () => {
    const { w } = woodWorld();
    const f = fake(w);
    runContractJump(f.deps, 1); // 1001
    runContractJump(f.deps, 1); // 1002
    delete w.buildings[1002];
    runContractJump(f.deps, 1);
    expect(f.calls.filter((c) => c.startsWith('panel:')).at(-1)).toBe('panel:1003');
  });
  it('Inselwechsel nach dem Sprung: Cursor wird zurückgesetzt, Klick 1 beim ersten', () => {
    const { w } = woodWorld();
    const f = fake(w);
    runContractJump(f.deps, 1);
    runContractJump(f.deps, 1); // 1002
    f.island = 2; // Spieler wechselt die Insel
    runContractJump(f.deps, 1);
    expect(f.calls.filter((c) => c.startsWith('panel:')).at(-1)).toBe('panel:1001');
  });
  it('kein Erzeuger: Meldung, Deps unverändert', () => {
    const { w } = woodWorld();
    for (const id of [1001, 1002, 1003]) delete w.buildings[id];
    const f = fake(w);
    f.cursor = { key: 'b:1', sort: [0, 0, 0, 1], anchor: 0, landed: 0 };
    const before = f.cursor;
    runContractJump(f.deps, 1);
    expect(f.msgs).toEqual([contractNoProducerMessage(w, w.contract!)]);
    expect(f.calls).toEqual(['msg']);
    expect(f.cursor).toBe(before);
  });
  it('ohne Vertrag: tut nichts', () => {
    const { w } = woodWorld();
    w.contract = null;
    const f = fake(w);
    runContractJump(f.deps, 1);
    expect(f.calls).toEqual([]);
    expect(f.msgs).toEqual([]);
    expect(f.cursor).toBeNull();
  });
  it('berührt weder Gut-Fokus noch fullSince (Deps kennen sie nicht)', () => {
    const { w } = woodWorld();
    const f = fake(w);
    expect(Object.keys(f.deps).sort()).toEqual(
      [
        'activeIsland',
        'cancelPointerAction',
        'centerOn',
        'getCursor',
        'message',
        'openPanel',
        'refresh',
        'setCursor',
        'world',
      ].sort(),
    );
  });
});

describe('I-090 contractNoProducerMessage (R607 Punkt 6)', () => {
  it('Heimatinsel: Zusatz «auf <Insel>»', () => {
    const { w } = woodWorld();
    const c = { good: 'wood' as const, island: 0 };
    const base = noProducerMessage(w, 'wood');
    const msg = contractNoProducerMessage(w, c);
    expect(msg).toBe(
      base.replace(
        'Noch kein Erzeuger für Holz',
        'Noch kein Erzeuger für Holz auf der Heimatinsel',
      ),
    );
    expect(msg).toContain('Holz auf der Heimatinsel — Bauen:');
  });
  it('ferne Insel nennt deren Namen', () => {
    const { w } = woodWorld();
    expect(contractNoProducerMessage(w, { good: 'wood', island: 2 })).toContain(
      `auf ${islandName(w, 2)} —`,
    );
  });
});

describe('I-090 contractKey (Cursor-Reset, R607 Punkt 3)', () => {
  it('null ohne Vertrag; ändert sich bei Gut oder Insel', () => {
    const { w } = woodWorld();
    const a = contractKey(w);
    expect(a).not.toBeNull();
    w.contract = { good: 'wood', amount: 9, price: 3, island: 0, deliveries: 0 };
    expect(contractKey(w)).toBe(a); // Menge/Preis egal
    w.contract = { good: 'wood', amount: 5, price: 9, island: 2, deliveries: 0 };
    expect(contractKey(w)).not.toBe(a);
    w.contract = { good: 'tools', amount: 5, price: 9, island: 0, deliveries: 0 };
    expect(contractKey(w)).not.toBe(a);
    w.contract = null;
    expect(contractKey(w)).toBeNull();
  });
});

describe('I-090 Kontrakt AK-HC-12', () => {
  it('Signaturen der genutzten Sim-/UI-Funktionen', () => {
    const { w, lj1 } = woodWorld();
    expect(typeof focusList).toBe('function');
    expect(focusList.length).toBe(3);
    expect(spot.length).toBe(2);
    expect(jumpTarget.length).toBe(2);
    expect(noProducerMessage.length).toBe(2);
    expect(spot(w, lj1)).toEqual({ x: expect.any(Number), y: expect.any(Number) });
    expect(jumpTarget(w, 0)).toEqual({ x: expect.any(Number), y: expect.any(Number) });
    expect(typeof noProducerMessage(w, 'wood')).toBe('string');
    expect(contractProducers.length).toBe(1);
    expect(runContractJump.length).toBe(2);
    expect(contractNoProducerMessage.length).toBe(2);
  });
});

describe('I-090 nextContractCursor (R607-3)', () => {
  const landed = (w: World): { cursor: ProblemCursor | null; key: string | null } => {
    const f = fake(w);
    runContractJump(f.deps, 1);
    runContractJump(f.deps, 1); // Cursor steht auf 1002
    return { cursor: f.cursor, key: contractKey(w) };
  };
  it('gleicher Vertrag: Cursor und Schlüssel bleiben', () => {
    const { w } = woodWorld();
    const st = landed(w);
    w.contract = { good: 'wood', amount: 1, price: 1, island: 0, deliveries: 0 };
    expect(nextContractCursor(w, st)).toBe(st);
  });
  it.each([
    ['anderes Gut', { good: 'tools' as const, amount: 5, price: 9, island: 0, deliveries: 0 }],
    ['andere Insel', { good: 'wood' as const, amount: 5, price: 9, island: 2, deliveries: 0 }],
    ['Vertragsende', null],
  ])('%s: Cursor null, neuer Schlüssel', (_n, next) => {
    const { w } = woodWorld();
    const st = landed(w);
    expect(st.cursor).not.toBeNull();
    w.contract = next;
    expect(nextContractCursor(w, st)).toEqual({ cursor: null, key: contractKey(w) });
  });
  it('nach Wechsel zurück auf Wood beginnt Klick 1 beim ersten Erzeuger', () => {
    const { w } = woodWorld();
    let st = landed(w);
    w.contract = null;
    st = nextContractCursor(w, st);
    w.contract = { good: 'wood', amount: 5, price: 9, island: 0, deliveries: 0 };
    st = nextContractCursor(w, st);
    const f = fake(w);
    f.cursor = st.cursor;
    runContractJump(f.deps, 1);
    expect(f.calls.filter((c) => c.startsWith('panel:')).at(-1)).toBe('panel:1001');
  });
});
