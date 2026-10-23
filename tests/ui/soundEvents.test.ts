import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { serialize } from '../../src/sim/save';
import { tickShips } from '../../src/sim/ships';
import type { Ship, World } from '../../src/sim/types';
import { UNLOCK_EVENTS, diffSoundEvents, soundSnapshot } from '../../src/ui/soundEvents';

describe('diffSoundEvents (Spec 9.4)', () => {
  it('gleicher Zustand ergibt keine Ereignisse', () => {
    const w = createWorld(1);
    expect(diffSoundEvents(soundSnapshot(w), soundSnapshot(w))).toEqual([]);
  });

  it('floor(tick/100) gestiegen ergibt coin, innerhalb des Hunderters nicht', () => {
    const w = createWorld(1);
    w.tick = 99;
    const before = soundSnapshot(w);
    w.tick = 100;
    expect(diffSoundEvents(before, soundSnapshot(w))).toEqual(['coin']);
    const b2 = soundSnapshot(w);
    w.tick = 150;
    expect(diffSoundEvents(b2, soundSnapshot(w))).toEqual([]);
  });

  it('neue Auftragsperiode ergibt order; Wechsel auf null nicht', () => {
    const w = createWorld(1);
    w.unlocked = ['U0', 'U2', 'U3']; // Auftragskarte sichtbar (M10, Spec 11.4)
    const none = soundSnapshot(w);
    w.order = { period: 3, good: 'wood', amount: 20, reward: 100, due: 500 };
    const withOrder = soundSnapshot(w);
    expect(diffSoundEvents(none, withOrder)).toEqual(['order']);
    w.order = null;
    expect(diffSoundEvents(withOrder, soundSnapshot(w))).toEqual([]);
    w.order = { period: 4, good: 'wood', amount: 20, reward: 100, due: 900 };
    expect(diffSoundEvents(withOrder, soundSnapshot(w))).toEqual(['order']);
  });

  it('Hausaufstieg ergibt upgrade, neues Haus (Stufe 1) nicht', () => {
    const w = createWorld(1);
    w.buildings[50] = {
      id: 50,
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
        demand: {},
        satisfied: {},
        services: {},
        satisfiedSince: 0,
        supplied: true,
      },
    };
    const before = soundSnapshot(w);
    const house = w.buildings[50]?.house;
    if (!house) throw new Error('Haus fehlt');
    house.tier = 2;
    expect(diffSoundEvents(before, soundSnapshot(w))).toEqual(['upgrade']);
    const b2 = soundSnapshot(w);
    house.tier = 1;
    expect(diffSoundEvents(b2, soundSnapshot(w))).toEqual([]);
  });

  it('won neu wahr ergibt win, bereits gewonnen nicht', () => {
    const w = createWorld(1);
    const before = soundSnapshot(w);
    w.won = true;
    expect(diffSoundEvents(before, soundSnapshot(w))).toEqual(['win']);
    expect(diffSoundEvents(soundSnapshot(w), soundSnapshot(w))).toEqual([]);
  });
});

describe('UNLOCK_EVENTS (AK-U2-06, Browser-Teil)', () => {
  it('AK-U2-06: Freischalten auf pointerup und keydown, nicht auf pointerdown (Touch zählt sonst nicht)', () => {
    expect([...UNLOCK_EVENTS]).toEqual(['pointerup', 'keydown']);
    expect(UNLOCK_EVENTS).not.toContain('pointerdown');
  });
});

describe('Krisen-Signaltöne (M6-AK-U3-01)', () => {
  const snap = (crisis: ReturnType<typeof soundSnapshot>['crisis']) => {
    const s = soundSnapshot(createWorld(1));
    return { ...s, crisis };
  };
  const fire = (period: number, burning: boolean) => ({ period, kind: 'fire' as const, burning });
  it('neue Periode Brand burning ergibt alarm, gleiche Periode nichts', () => {
    expect(diffSoundEvents(snap(null), snap(fire(1, true)))).toEqual(['alarm']);
    expect(diffSoundEvents(snap(fire(1, true)), snap(fire(1, true)))).toEqual([]);
    expect(diffSoundEvents(snap(fire(1, true)), snap(null))).toEqual([]);
    expect(diffSoundEvents(snap(fire(1, true)), snap(fire(2, true)))).toEqual(['alarm']);
  });
  it('gelöscht und leer ohne Ton', () => {
    expect(diffSoundEvents(snap(null), snap(fire(1, false)))).toEqual([]);
  });
  it('Sturm und Boom', () => {
    expect(diffSoundEvents(snap(null), snap({ period: 2, kind: 'storm', burning: false }))).toEqual(
      ['stormWarning'],
    );
    expect(diffSoundEvents(snap(null), snap({ period: 3, kind: 'boom', burning: false }))).toEqual([
      'boom',
    ]);
    const st = snap({ period: 2, kind: 'storm', burning: false });
    expect(diffSoundEvents(st, st)).toEqual([]);
  });
  it('Laden: geladener Stand als Basis ergibt nichts', () => {
    const w = createWorld(1);
    w.crisis = { period: 4, kind: 'boom', from: 0, until: 300, good: 'wood' };
    expect(diffSoundEvents(soundSnapshot(w), soundSnapshot(w))).toEqual([]);
  });
});

describe('M8 U1 Ton (Spec 14.1)', () => {
  it('AK-U1-03 wonMerchants false → true ergibt genau ein win', () => {
    const w = createWorld(1);
    w.won = true;
    const before = soundSnapshot(w);
    w.wonMerchants = true;
    expect(diffSoundEvents(before, soundSnapshot(w))).toEqual(['win']);
  });
  it('AK-U1-03 won und wonMerchants im selben Frame: genau ein win', () => {
    const w = createWorld(1);
    const before = soundSnapshot(w);
    w.won = true;
    w.wonMerchants = true;
    expect(diffSoundEvents(before, soundSnapshot(w))).toEqual(['win']);
  });
  it('AK-U1-03 Laden mit wonMerchants true (Basis = geladener Stand): kein Ton', () => {
    const w = createWorld(1);
    w.won = true;
    w.wonMerchants = true;
    expect(diffSoundEvents(soundSnapshot(w), soundSnapshot(w))).toEqual([]);
  });
});

import { buildSoundKey } from '../../src/ui/soundEvents';

describe('buildSoundKey', () => {
  it('liefert Gebäude-Id, road oder nichts', () => {
    expect(buildSoundKey({ kind: 'build', defId: 'chapel' })).toBe('chapel');
    expect(buildSoundKey({ kind: 'road' })).toBe('road');
    expect(buildSoundKey({ kind: 'select' })).toBeNull();
    expect(buildSoundKey({ kind: 'demolish' })).toBeNull();
  });
});

describe('M10 Ton unlock', () => {
  it('AK-U1-12 unlock: wächst → genau ein unlock; zwei Einträge ein Ton; mit won nur win; Laden kein Ton; Rest unverändert', () => {
    const a = createWorld(3);
    const s0 = soundSnapshot(a);
    a.unlocked = ['U0', 'U2'];
    expect(diffSoundEvents(s0, soundSnapshot(a))).toEqual(['unlock']);
    a.unlocked = ['U0', 'U2', 'U3', 'U4'];
    expect(
      diffSoundEvents(soundSnapshot(createWorld(3)), soundSnapshot(a)).filter(
        (e) => e === 'unlock',
      ),
    ).toHaveLength(1);
    const b = createWorld(3);
    const s1 = soundSnapshot(b);
    b.won = true;
    b.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5', 'U6'];
    const ev = diffSoundEvents(s1, soundSnapshot(b));
    expect(ev).toContain('win');
    expect(ev).not.toContain('unlock');
    expect(diffSoundEvents(soundSnapshot(b), soundSnapshot(b))).toEqual([]);
  });
});

describe('M13-E2 Ton monumentDone (AK-M13E2-33, U-12)', () => {
  it('genau beim Übergang false → true', () => {
    const w = createWorld(1);
    const before = soundSnapshot(w);
    w.monumentDone = true;
    expect(diffSoundEvents(before, soundSnapshot(w))).toEqual(['monumentDone']);
  });

  it('geladener Stand mit monumentDone true: nichts', () => {
    const w = createWorld(1);
    w.monumentDone = true;
    expect(diffSoundEvents(soundSnapshot(w), soundSnapshot(w))).toEqual([]);
  });

  it('QA-B1 Einmal-Beweis: false,false,true,true,true → genau einmal; nach Laden keines', () => {
    const w = createWorld(1);
    const seq: boolean[] = [false, false, true, true, true];
    let prev = soundSnapshot(w);
    const heard: string[] = [];
    for (const done of seq) {
      w.monumentDone = done;
      const cur = soundSnapshot(w);
      heard.push(...diffSoundEvents(prev, cur));
      prev = cur;
    }
    expect(heard.filter((e) => e === 'monumentDone')).toHaveLength(1);
    // «Laden»: neue Basis mit true, danach gleicher Stand
    const loaded = soundSnapshot(w);
    expect(diffSoundEvents(loaded, soundSnapshot(w))).toEqual([]);
  });
});

describe('shipDock (LEBEN-SEE T06, AK-K1..K4, K9)', () => {
  const withShips = (ports: Record<number, number>) => ({
    ...soundSnapshot(createWorld(1)),
    ships: ports,
  });
  const ship = (id: number, over: Partial<Ship>): Ship => ({
    id,
    port: 0,
    to: null,
    left: 0,
    cargo: {},
    route: null,
    homing: false,
    ...over,
  });

  it('K1: Portwechsel einer id ergibt genau einmal shipDock, auch bei zwei Schiffen', () => {
    expect(diffSoundEvents(withShips({ 1: 0 }), withShips({ 1: 2 }))).toEqual(['shipDock']);
    expect(diffSoundEvents(withShips({ 1: 0, 2: 0 }), withShips({ 1: 2, 2: 3 }))).toEqual([
      'shipDock',
    ]);
  });

  it('K2: gleicher Port, neue oder fehlende id ergeben nichts', () => {
    expect(diffSoundEvents(withShips({ 1: 2 }), withShips({ 1: 2 }))).toEqual([]);
    expect(diffSoundEvents(withShips({}), withShips({ 5: 2 }))).toEqual([]);
    expect(diffSoundEvents(withShips({ 5: 2 }), withShips({}))).toEqual([]);
  });

  it('K2/K3: Abfahrt (to ändert sich, port nicht) ergibt nichts', () => {
    const w = createWorld(1);
    w.ships.push(ship(1, { port: 0, to: null }));
    const before = soundSnapshot(w);
    w.ships[0]!.to = 1;
    expect(diffSoundEvents(before, soundSnapshot(w))).toEqual([]);
  });

  const arrive = (w: World): ReturnType<typeof diffSoundEvents> => {
    const before = soundSnapshot(w);
    tickShips(w);
    return diffSoundEvents(before, soundSnapshot(w));
  };

  it('K3: Ankunft auf Route ergibt shipDock, Ablegen im selben Tick ändert nichts', () => {
    const w = createWorld(1);
    const route = { a: 0, b: 1, ab: [], ba: [] };
    w.ships.push(ship(1, { port: 0, to: 1, left: 2, route }));
    expect(arrive(w)).toEqual([]);
    expect(arrive(w)).toEqual(['shipDock']);
    expect(w.ships[0]!.to).toBe(0);
    expect(arrive(w)).toEqual([]);
  });

  it('K3: Heimkehr ohne Route (Port wird 0) ergibt shipDock', () => {
    const w = createWorld(1);
    w.ships.push(ship(1, { port: 1, to: 0, left: 1, homing: true }));
    expect(arrive(w)).toEqual(['shipDock']);
  });

  it('K4: soundSnapshot verändert die Welt nicht', () => {
    const w = createWorld(1);
    w.ships.push(ship(1, { port: 1 }));
    const before = serialize(w);
    expect(soundSnapshot(w).ships).toEqual({ 1: 1 });
    expect(serialize(w)).toBe(before);
  });

  it('K9: Snapshot einer geladenen Welt gegen sich selbst ist still (Priming)', () => {
    const w = createWorld(1);
    w.ships.push(ship(1, { port: 1 }), ship(2, { port: 0 }));
    expect(diffSoundEvents(soundSnapshot(w), soundSnapshot(w))).toEqual([]);
  });
});
