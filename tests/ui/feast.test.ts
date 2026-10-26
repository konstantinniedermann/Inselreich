import { describe, expect, it } from 'vitest';
import { createWorld, home, HOME } from '../../src/sim/world';
import {
  houseNearKontor,
  placeService,
  placeTownhall,
  putBuilding,
  setAllTax,
} from '../sim/helpers';
import { holdFeast } from '../../src/sim/feast';
import { upgradeGain } from '../../src/ui/panelView';
import { marketDayTag, sellTexts } from '../../src/ui/trade';
import { TAX_LEVELS } from '../../src/sim/defs/tiers';
import { FEAST_COOLDOWN, FEAST_DURATION } from '../../src/sim/defs/timing';
import { feastButtons, feastStatusLine, harvestLine, houseFeastLine } from '../../src/ui/feast';
import { formatClock } from '../../src/ui/time';
import type { Building, World } from '../../src/sim/types';

function setup(): { w: World; chapel: Building; house: Building } {
  const w = createWorld(3, { unlockAll: true });
  const house = houseNearKontor(w);
  const chapel = placeService(w, 'chapel', house.x + 5, house.y);
  return { w, chapel, house };
}

function rich(w: World): void {
  const st = home(w).stock;
  st.rum = 100;
  st.cloth = 100;
  st.glass = 100;
}

describe('feastButtons (AK-FE17, AK-I007-11)', () => {
  it('AK-FE17: bereit, drei Knöpfe mit Preis, alle frei', () => {
    const { w, chapel } = setup();
    rich(w);
    putBuilding(w, HOME, 'quarry', chapel.x, chapel.y + 3);
    chapel.connected = true;
    const v = feastButtons(w, chapel)!;
    expect(v.map((x) => x.label)).toEqual([
      'Aufstiegsfest · 10 Rum',
      'Erntefest · 10 Rum, 15 Stoff',
      'Markttag · 10 Rum, 5 Glas',
    ]);
    expect(v.map((x) => x.kind)).toEqual(['ascension', 'harvest', 'market']);
    expect(v.every((x) => !x.disabled && x.reason === null && x.title === '')).toBe(true);
  });

  it('AK-FE17: eigener Sperrgrund je Knopf', () => {
    const { w, chapel } = setup();
    rich(w);
    putBuilding(w, HOME, 'quarry', chapel.x, chapel.y + 3);
    chapel.connected = true;
    home(w).stock.cloth = 4;
    const v = feastButtons(w, chapel)!;
    expect(v[1]).toMatchObject({
      disabled: true,
      reason: 'Zu wenig Stoff (4 / 15)',
      title: 'Zu wenig Stoff (4 / 15)',
    });
    expect(v[0]!.disabled).toBe(false);
    expect(v[2]!.disabled).toBe(false);
  });

  it('AK-FE17: laufendes Fest sperrt alle, Statuszeile nennt Art und Restzeit', () => {
    const { w, chapel } = setup();
    rich(w);
    putBuilding(w, HOME, 'quarry', chapel.x, chapel.y + 3);
    chapel.connected = true;
    expect(feastStatusLine(w, chapel)).toBeNull();
    expect(holdFeast(w, chapel.id, 'harvest').ok).toBe(true);
    expect(feastStatusLine(w, chapel)).toBe(`Erntefest läuft noch ${formatClock(FEAST_DURATION)}`);
    const v = feastButtons(w, chapel)!;
    expect(v.every((x) => x.disabled && x.title === 'Fest läuft' && x.reason === null)).toBe(true);
  });

  it('AK-FE17: Abklingzeit in der Statuszeile', () => {
    const { w, chapel } = setup();
    chapel.feastAt = w.tick;
    w.tick += FEAST_DURATION + 50;
    expect(feastStatusLine(w, chapel)).toBe(
      `Nächstes Fest in ${formatClock(FEAST_COOLDOWN - FEAST_DURATION - 50)}`,
    );
    expect(feastButtons(w, chapel)!.every((x) => x.disabled)).toBe(true);
  });

  it('nach der Abklingzeit wieder bereit', () => {
    const { w, chapel } = setup();
    chapel.feastAt = w.tick;
    w.tick += FEAST_COOLDOWN;
    rich(w);
    chapel.connected = true;
    expect(feastButtons(w, chapel)![0]!.disabled).toBe(false);
    expect(feastStatusLine(w, chapel)).toBeNull();
  });

  describe('Sperrgrund im Zustand bereit', () => {
    const reasonOf = (w: World, c: Building): string | null => feastButtons(w, c)![0]!.reason;
    it('zu wenig Rum', () => {
      const { w, chapel } = setup();
      chapel.connected = true;
      home(w).stock.rum = 3;
      expect(feastButtons(w, chapel)![0]).toMatchObject({
        disabled: true,
        reason: 'Zu wenig Rum (3 / 10)',
      });
    });
    it('Kapelle nicht angebunden', () => {
      const { w, chapel } = setup();
      home(w).stock.rum = 30;
      chapel.connected = false;
      expect(reasonOf(w, chapel)).toBe('Kapelle nicht angebunden');
    });
    it('Kapelle brennt', () => {
      const { w, chapel } = setup();
      home(w).stock.rum = 30;
      chapel.outageUntil = w.tick + 100;
      expect(reasonOf(w, chapel)).toBe('Kapelle brennt');
    });
    it.each(['low', 'high'] as const)('Steuer %s', (level) => {
      const { w, chapel } = setup();
      home(w).stock.rum = 30;
      placeTownhall(w);
      chapel.connected = true;
      setAllTax(w, level);
      expect(reasonOf(w, chapel)).toContain(`«${TAX_LEVELS[level].name}»`);
      expect(feastButtons(w, chapel)![0]!.disabled).toBe(true);
    });
  });

  it('ist erst ab U4 (Rum) sichtbar', () => {
    const { w, chapel } = setup();
    w.unlocked = ['U0', 'U1', 'U2', 'U3'];
    expect(feastButtons(w, chapel)).toBeNull();
  });

  it('ist für andere Gebäude null', () => {
    const { w, house } = setup();
    expect(feastButtons(w, house)).toBeNull();
  });

  it('AK-FE20: zweite Kapelle: Erntefest Inselsperre, Markttag frei', () => {
    const { w, chapel } = setup();
    rich(w);
    putBuilding(w, HOME, 'quarry', chapel.x, chapel.y + 3);
    chapel.connected = true;
    const second = placeService(w, 'chapel', chapel.x, chapel.y + 6);
    rich(w);
    second.connected = true;
    chapel.connected = true;
    expect(holdFeast(w, chapel.id, 'harvest')).toEqual({ ok: true });
    const v = feastButtons(w, second)!;
    expect(v[1]!.reason).toBe('Erntefest auf der Insel: Abklingzeit');
    expect(v[2]!.disabled).toBe(false);
  });
});

describe('harvestLine (AK-FE18)', () => {
  it('nennt den Zyklus im Radius, sonst null', () => {
    const { w, chapel } = setup();
    const near = putBuilding(w, HOME, 'quarry', chapel.x, chapel.y + 3);
    const far = putBuilding(w, HOME, 'quarry', chapel.x + 60, chapel.y);
    chapel.feastKind = 'harvest';
    chapel.feastAt = w.tick;
    expect(harvestLine(w, near)).toBe('Erntefest: Zyklus 75 %');
    expect(harvestLine(w, far)).toBeNull();
    w.tick += FEAST_DURATION;
    expect(harvestLine(w, near)).toBeNull();
  });
});

describe('marketDayTag (AK-FE19)', () => {
  it('Marke nur während des Markttags, Preis steigt', () => {
    const { w, chapel } = setup();
    expect(marketDayTag(w, HOME)).toBe('');
    const before = sellTexts(w, 'rum', 10).price;
    chapel.feastKind = 'market';
    chapel.feastAt = w.tick;
    expect(marketDayTag(w, HOME)).toBe('Markttag 125 %');
    expect(parseInt(sellTexts(w, 'rum', 10).price)).toBeGreaterThan(parseInt(before));
    w.tick += FEAST_DURATION;
    expect(marketDayTag(w, HOME)).toBe('');
  });
});

describe('upgradeGain unter Erntefest (P-10)', () => {
  it('after unverändert, before schneller', () => {
    const { w, chapel } = setup();
    const b = putBuilding(w, HOME, 'quarry', chapel.x, chapel.y + 3);
    b.level = 2;
    const calm = upgradeGain(w, b, 3)[0]!;
    chapel.feastKind = 'harvest';
    chapel.feastAt = w.tick;
    const fest = upgradeGain(w, b, 3)[0]!;
    expect(fest.after).toBe(calm.after);
    expect(fest.before).toBeGreaterThan(calm.before);
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

describe('Festtrunk (B5) an den Festknöpfen', () => {
  it('Gutschein: Knöpfe tragen den Hinweis und keinen Rum; nach dem Fest weg', () => {
    const { w, chapel } = setup();
    rich(w);
    putBuilding(w, HOME, 'quarry', chapel.x, chapel.y + 3);
    chapel.connected = true;
    w.petitions.effects.push({
      id: 'feastDrink',
      answer: 'yes',
      until: w.tick + 6000,
      anchor: chapel.id,
    });
    const v = feastButtons(w, chapel)!;
    expect(v.map((x) => x.label)).toEqual([
      'Aufstiegsfest · Festtrunk: ohne Rum, ohne Abklingzeit',
      'Erntefest · 15 Stoff · Festtrunk: ohne Rum, ohne Abklingzeit',
      'Markttag · 5 Glas · Festtrunk: ohne Rum, ohne Abklingzeit',
    ]);
    expect(holdFeast(w, chapel.id, 'ascension').ok).toBe(true);
    expect(feastButtons(w, chapel)!.some((x) => x.label.includes('Festtrunk'))).toBe(false);
  });
});
