import { describe, expect, it } from 'vitest';
import { deriveUnlocks } from '../../src/sim/unlocks';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { goodsBalance } from '../../src/sim/queries';
import { SCENARIOS } from '../sim/scenarios';
import {
  balanceText,
  balanceTooltip,
  taxButtonText,
  popChipHidden,
  speedTooltip,
  stockChipHidden,
  stockTooltip,
  tierPath,
  tierTooltip,
} from '../../src/ui/hud';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { createWorld } from '../../src/sim/world';
import { UNLOCK_IDS } from '../../src/sim/defs/unlocks';
import type { Tier } from '../../src/sim/types';
import { houseNearKontor, placeTownhall } from '../sim/helpers';
import { taxEffect } from '../../src/ui/guide';
import { GOODS_BALANCE_TICKS, perMinute, signedNum } from '../../src/ui/time';

describe('Kopfzeile, reine Texte (AK-UX-07)', () => {
  it('AK-UX-07 tierTooltip und tierPath aus TIERS', () => {
    expect(tierTooltip(2)).toBe(
      'Siedler: Einwohner der Stufe 2 · brauchen Nahrung, Stoff, Kapelle',
    );
    expect(tierTooltip(1)).toBe('Pioniere: Einwohner der Stufe 1 · brauchen Nahrung');
    expect(tierPath()).toBe(
      'Pioniere → Siedler (brauchen Stoff, Kapelle) → Bürger (brauchen Rum, Schule) → Kaufleute (brauchen Glas, Badehaus)',
    );
  });
  it('AK-UX-07 balanceText je Minute', () => {
    expect(balanceText({ taxes: 8, upkeep: 15 })).toEqual({
      text: 'Bilanz −42 / min',
      title: 'Steuern +48 / min · Unterhalt −90 / min',
    });
    expect(balanceText({ taxes: 5, upkeep: 5 }).text).toBe('Bilanz ±0 / min');
  });
  it('AK-UX-07 stockTooltip mit Werten aus goodsBalance', () => {
    const w = SCENARIOS['bilanz-nahrung']!();
    const b = goodsBalance(w).wood;
    const pm = (x: number): number => perMinute(x, GOODS_BALANCE_TICKS);
    expect(stockTooltip(w, 'wood')).toBe(
      `Holz ${w.stock.wood} / ${STORAGE_CAP} · ${signedNum(pm(b.net))} / min ` +
        `(Erzeugung ${pm(b.produced)} / min, Verbrauch ${pm(b.consumed)} / min)`,
    );
  });
  it('AK-UX-07 speedTooltip', () => {
    expect(speedTooltip(4)).toBe('Spielzeit läuft 4× so schnell');
  });
});

describe('M8 Stufenpfad (AK-S1-18)', () => {
  it('AK-S1-18 tierPath endet mit den Kaufleuten, tierTooltip(4) nennt alle Bedarfe', () => {
    expect(tierPath()).toBe(
      'Pioniere → Siedler (brauchen Stoff, Kapelle) → Bürger (brauchen Rum, Schule) → Kaufleute (brauchen Glas, Badehaus)',
    );
    expect(tierTooltip(4)).toBe(
      'Kaufleute: Einwohner der Stufe 4 · brauchen Nahrung, Stoff, Rum, Glas, Kapelle, Schule, Badehaus',
    );
  });
});

describe('M8 U1 Kopfzeile', () => {
  it('Spec M8 14.1 Kaufleute-Chip verborgen bis zur Freischaltung, Stufen 1–3 nie (Vorprüfung zu AK-U1-04)', () => {
    const w = createWorld(3);
    expect(popChipHidden(w, 4)).toBe(true);
    expect(popChipHidden(w, 1)).toBe(false); // M10: Stufen 2 und 3 erscheinen erst mit U3/U5 (AK-U1-05)
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    w.unlocked = deriveUnlocks(w);
    expect(popChipHidden(w, 4)).toBe(false);
  });

  it('Spec M8 14.1 Glas-Chip verborgen bis zur Freischaltung oder Glas > 0, andere Güter nie (Vorprüfung AK-U1-04, S11)', () => {
    const w = createWorld(3);
    expect(stockChipHidden(w, 'glass')).toBe(true);
    for (const g of GOOD_IDS.filter((x) => ['wood', 'tools', 'stone', 'food'].includes(x)))
      expect(stockChipHidden(w, g), g).toBe(false);
    w.stock.glass = 1;
    expect(stockChipHidden(w, 'glass')).toBe(false);
    w.stock.glass = 0;
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    w.unlocked = deriveUnlocks(w);
    expect(stockChipHidden(w, 'glass')).toBe(false);
  });
});

describe('M10 Kopfzeile nach Freischaltung', () => {
  it('AK-U1-04 Lager-Chips: neues Spiel genau Holz, Werkzeug, Stein, Nahrung; Wolle 3 ohne U2 sichtbar', () => {
    const w = createWorld(3);
    expect(GOOD_IDS.filter((g) => !stockChipHidden(w, g))).toEqual([
      'wood',
      'tools',
      'stone',
      'food',
    ]);
    w.stock.wool = 3;
    expect(stockChipHidden(w, 'wool')).toBe(false);
  });
  it('AK-U1-05 Einwohner-Chips: pop-1 immer; pop-2 ab U3, pop-3 ab U5, pop-4 ab U6; mit Einwohnern immer', () => {
    const w = createWorld(3);
    expect(([1, 2, 3, 4] as Tier[]).map((t) => popChipHidden(w, t))).toEqual([
      false,
      true,
      true,
      true,
    ]);
    w.unlocked = ['U0', 'U2', 'U3'];
    expect(popChipHidden(w, 2)).toBe(false);
    w.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5'];
    expect(popChipHidden(w, 3)).toBe(false);
    expect(popChipHidden(w, 4)).toBe(true);
    w.unlocked = [...UNLOCK_IDS];
    expect(popChipHidden(w, 4)).toBe(false);
    const v = createWorld(3);
    const h = houseNearKontor(v);
    h.house!.tier = 3;
    expect(popChipHidden(v, 3)).toBe(false);
  });
  it('AK-U1-11 taxButtonText: ohne aktive Amtsstube null; mit aktiver „Steuer normal" (wirksame Stufe)', () => {
    const w = createWorld(3, { unlockAll: true });
    expect(taxButtonText(w)).toBeNull();
    placeTownhall(w);
    expect(taxButtonText(w)).toBe('Steuer normal');
  });
  it('AK-U1-13 Bilanz-Tooltip ohne aktive Amtsstube mit „Steuer: normal (keine Amtsstube)"', () => {
    const w = createWorld(3);
    w.taxLevel = 'high';
    expect(balanceTooltip(w)).toContain('Steuer: normal (keine Amtsstube)');
    expect(taxEffect('normal')).toBeTruthy();
  });
});
