import { describe, expect, it } from 'vitest';
import { createWorld } from '../../src/sim/world';
import { houseNearKontor, placeService } from '../sim/helpers';
import { FEAST_COOLDOWN, FEAST_DURATION } from '../../src/sim/defs/timing';
import { feastView, houseFeastLine } from '../../src/ui/feast';
import { formatClock } from '../../src/ui/time';
import type { Building, World } from '../../src/sim/types';

function setup(): { w: World; chapel: Building; house: Building } {
  const w = createWorld(3, { unlockAll: true });
  const house = houseNearKontor(w);
  const chapel = placeService(w, 'chapel', house.x + 5, house.y);
  return { w, chapel, house };
}

describe('feastView (AK-I007-11)', () => {
  it('zeigt bereit: Knopf mit Rumpreis, aktiv', () => {
    const { w, chapel } = setup();
    expect(feastView(w, chapel)).toEqual({ label: 'Fest feiern (10 Rum)', disabled: false });
  });

  it('ist erst ab U4 (Rum) sichtbar', () => {
    const { w, chapel } = setup();
    w.unlocked = ['U0', 'U1', 'U2', 'U3'];
    expect(feastView(w, chapel)).toBeNull();
  });

  it('ist für andere Gebäude null', () => {
    const { w, house } = setup();
    expect(feastView(w, house)).toBeNull();
  });

  it('zeigt laufendes Fest mit Restzeit m:ss, gesperrt', () => {
    const { w, chapel } = setup();
    chapel.feastAt = w.tick;
    const v = feastView(w, chapel)!;
    expect(v.disabled).toBe(true);
    expect(v.label).toBe(`Fest läuft noch ${formatClock(FEAST_DURATION)}`);
    expect(v.label).toMatch(/noch \d+:\d\d$/);
  });

  it('zeigt Abklingzeit nach dem Fest, gesperrt', () => {
    const { w, chapel } = setup();
    chapel.feastAt = w.tick;
    w.tick += FEAST_DURATION + 50;
    const v = feastView(w, chapel)!;
    expect(v.disabled).toBe(true);
    expect(v.label).toBe(`Nächstes Fest in ${formatClock(FEAST_COOLDOWN - FEAST_DURATION - 50)}`);
  });

  it('ist nach der Abklingzeit wieder bereit', () => {
    const { w, chapel } = setup();
    chapel.feastAt = w.tick;
    w.tick += FEAST_COOLDOWN;
    expect(feastView(w, chapel)?.disabled).toBe(false);
  });
});

describe('houseFeastLine', () => {
  it('nennt das Fest nur, solange es auf das Haus wirkt', () => {
    const { w, chapel, house } = setup();
    expect(houseFeastLine(w, house)).toBeNull();
    chapel.feastAt = w.tick;
    expect(houseFeastLine(w, house)).toBe('Fest: schnellerer Aufstieg');
    w.tick += FEAST_DURATION;
    expect(houseFeastLine(w, house)).toBeNull();
  });
});
