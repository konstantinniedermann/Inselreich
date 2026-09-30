import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { UNLOCK_EVENTS, diffSoundEvents, soundSnapshot } from '../../src/ui/soundEvents';

describe('diffSoundEvents (Spec 9.4)', () => {
  it('AK-U2-06: gleicher Zustand ergibt keine Ereignisse', () => {
    const w = createWorld(1);
    expect(diffSoundEvents(soundSnapshot(w), soundSnapshot(w))).toEqual([]);
  });

  it('AK-U2-06: floor(tick/100) gestiegen ergibt coin, innerhalb des Hunderters nicht', () => {
    const w = createWorld(1);
    w.tick = 99;
    const before = soundSnapshot(w);
    w.tick = 100;
    expect(diffSoundEvents(before, soundSnapshot(w))).toEqual(['coin']);
    const b2 = soundSnapshot(w);
    w.tick = 150;
    expect(diffSoundEvents(b2, soundSnapshot(w))).toEqual([]);
  });

  it('AK-U2-06: neue Auftragsperiode ergibt order; Wechsel auf null nicht', () => {
    const w = createWorld(1);
    const none = soundSnapshot(w);
    w.order = { period: 3, good: 'wood', amount: 20, reward: 100, due: 500 };
    const withOrder = soundSnapshot(w);
    expect(diffSoundEvents(none, withOrder)).toEqual(['order']);
    w.order = null;
    expect(diffSoundEvents(withOrder, soundSnapshot(w))).toEqual([]);
    w.order = { period: 4, good: 'wood', amount: 20, reward: 100, due: 900 };
    expect(diffSoundEvents(withOrder, soundSnapshot(w))).toEqual(['order']);
  });

  it('AK-U2-06: Hausaufstieg ergibt upgrade, neues Haus (Stufe 1) nicht', () => {
    const w = createWorld(1);
    w.buildings[50] = {
      id: 50,
      defId: 'house',
      x: 0,
      y: 0,
      connected: true,
      progress: 0,
      state: 'ok',
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

  it('AK-U2-06: won neu wahr ergibt win, bereits gewonnen nicht', () => {
    const w = createWorld(1);
    const before = soundSnapshot(w);
    w.won = true;
    expect(diffSoundEvents(before, soundSnapshot(w))).toEqual(['win']);
    expect(diffSoundEvents(soundSnapshot(w), soundSnapshot(w))).toEqual([]);
  });
});

describe('UNLOCK_EVENTS (AK-U2-06)', () => {
  it('AK-U2-06: Freischalten auf pointerup und keydown, nicht auf pointerdown (Touch zählt sonst nicht)', () => {
    expect([...UNLOCK_EVENTS]).toEqual(['pointerup', 'keydown']);
    expect(UNLOCK_EVENTS).not.toContain('pointerdown');
  });
});
