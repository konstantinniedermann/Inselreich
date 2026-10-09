import { describe, expect, it } from 'vitest';
import { deriveUnlocks } from '../../src/sim/unlocks';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { goodsBalance } from '../../src/sim/queries';
import { SCENARIOS } from '../sim/scenarios';
import {
  BALANCE_REFRESH_MS,
  balanceDue,
  balanceText,
  balanceView,
  chipRole,
  chipView,
  moneyView,
  popChipView,
  balanceTooltip,
  taxButtonText,
  taxView,
  popChipHidden,
  speedTooltip,
  PAUSE_TOOLTIP,
  stockChipHidden,
  stockPrefix,
  stockTooltip,
  tierPath,
  tierTooltip,
} from '../../src/ui/hud';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { home, createWorld } from '../../src/sim/world';
import { UNLOCK_IDS } from '../../src/sim/defs/unlocks';
import type { Tier } from '../../src/sim/types';
import { houseNearKontor, placeTownhall, setAllTax } from '../sim/helpers';
import { GOODS_BALANCE_TICKS, perMinute, signedNum } from '../../src/ui/time';

describe('Kopfzeile, reine Texte (AK-UX-07)', () => {
  it('AK-UX-07 tierTooltip und tierPath aus TIERS', () => {
    expect(tierTooltip(2)).toBe(
      'Siedler: Einwohner der Stufe 2 · brauchen Nahrung, Stoff, Kapelle',
    );
    expect(tierTooltip(1)).toBe('Pioniere: Einwohner der Stufe 1 · brauchen Nahrung');
    // R226 F-03: Kaufleute brauchen zusätzlich Gewürz
    expect(tierPath()).toBe(
      'Pioniere → Siedler (brauchen Stoff, Kapelle) → Bürger (brauchen Rum, Schule) → Kaufleute (brauchen Glas, Gewürz, Badehaus)',
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
      `Holz ${home(w).stock.wood} / ${STORAGE_CAP} · ${signedNum(pm(b.net))} / min ` +
        `(Erzeugung ${pm(b.produced)} / min, Verbrauch ${pm(b.consumed)} / min)`,
    );
  });
  it('AK-UX-07 speedTooltip', () => {
    expect(speedTooltip(4)).toBe('Spielzeit läuft 4× so schnell');
  });
});

describe('TASTEN-KOMFORT Pause-Tooltip (AK-TK-33)', () => {
  it('nennt P und das Antippen der Leertaste', () => {
    expect(PAUSE_TOOLTIP).toBe('Pause / weiter (P oder Leertaste antippen)');
  });
});

describe('M8 Stufenpfad (AK-S1-18)', () => {
  it('AK-S1-18 tierPath endet mit den Kaufleuten, tierTooltip(4) nennt alle Bedarfe', () => {
    // R226 F-03: Kaufleute brauchen zusätzlich Gewürz
    expect(tierPath()).toBe(
      'Pioniere → Siedler (brauchen Stoff, Kapelle) → Bürger (brauchen Rum, Schule) → Kaufleute (brauchen Glas, Gewürz, Badehaus)',
    );
    expect(tierTooltip(4)).toBe(
      'Kaufleute: Einwohner der Stufe 4 · brauchen Nahrung, Stoff, Rum, Glas, Gewürz, Kapelle, Schule, Badehaus',
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

  it('Spec M8 14.1 Glas-Chip verborgen bis zur Freischaltung oder Glas > 0, Holz, Werkzeug, Stein, Nahrung nie (Vorprüfung AK-U1-04, S11)', () => {
    const w = createWorld(3);
    expect(stockChipHidden(w, 'glass')).toBe(true);
    for (const g of GOOD_IDS.filter((x) => ['wood', 'tools', 'stone', 'food'].includes(x)))
      expect(stockChipHidden(w, g), g).toBe(false);
    home(w).stock.glass = 1;
    expect(stockChipHidden(w, 'glass')).toBe(false);
    home(w).stock.glass = 0;
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
    home(w).stock.wool = 3;
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
    setAllTax(w, 'high');
    expect(balanceTooltip(w)).toContain('Steuer: normal (keine Amtsstube)');
  });
});

describe('M10 Symbole im Einbau (Spec 14)', () => {
  it('AK-U4-01 Chips tragen Symbol; aria-label = bisheriger Text wörtlich', () => {
    const w = createWorld(3);
    expect(chipView(w, 'wood')).toEqual({
      icon: 'wood',
      text: `${home(w).stock.wood} →`,
      label: `Holz ${home(w).stock.wood} →`,
    });
    expect(popChipView(w, 1).label).toBe('Pioniere 0');
    expect(popChipView(w, 3)).toEqual({ icon: 'tier-3', text: '0', label: 'Bürger 0' });
    expect(moneyView(w)).toMatchObject({ icon: 'money', label: `Geld ${w.money}` });
    expect(balanceView(w)).toMatchObject({ icon: 'balance' });
    expect(balanceView(w).label).toBe(balanceText(w.stats).text);
  });
  it('AK-U4-01 jedes Gut hat ein Symbol gleicher Kennung', () => {
    const w = createWorld(3);
    for (const g of GOOD_IDS) expect(chipView(w, g).icon).toBe(g);
  });
});

describe('I-028 Steuer-Chip bei gemischtem Stand (U-7)', () => {
  it('taxView: Text «gemischt», Label «Steuer gemischt»; Bilanz-Tooltip ohne Amtsstube «normal»', () => {
    const w = createWorld(3, { unlockAll: true });
    placeTownhall(w);
    w.taxLevels = { 1: 'low', 2: 'normal', 3: 'normal', 4: 'high' };
    expect(taxView(w)).toEqual({ icon: 'tax', text: 'gemischt', label: 'Steuer gemischt' });
    setAllTax(w, 'high');
    expect(taxView(w)!.text).toBe('hoch');
    const v = createWorld(3);
    v.taxLevels = { 1: 'high', 2: 'normal', 3: 'low', 4: 'high' };
    expect(balanceTooltip(v)).toContain('Steuer: normal (keine Amtsstube)');
  });
});

describe('M10 Kopfzeilen-Chips, Rolle', () => {
  it('Steuer-Knopf bleibt Knopf (keine Rolle img), Lager-Chip bekommt sie', () => {
    const w = SCENARIOS['m10-amtsstube']!();
    expect(taxView(w)).not.toBeNull();
    expect(chipRole('BUTTON')).toBeNull();
    expect(chipRole('SPAN')).toBe('img');
  });
});

describe('M11 Kopfzeile im Fluss (Spec 7)', () => {
  it('AK-UI-02 balanceDue: 400 ms → false, 500 ms → true; erster Aufruf immer fällig', () => {
    expect(BALANCE_REFRESH_MS).toBe(500);
    expect(balanceDue(1000, 600)).toBe(false);
    expect(balanceDue(1100, 600)).toBe(true);
    expect(balanceDue(0, -Infinity)).toBe(true);
  });
});

describe('M12 E2 UI Inseln: Lagerleiste je Insel', () => {
  const seaWorld = () => {
    const w = createWorld(3);
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    return w;
  };
  it('chipView(world, good, island) liest das Lager der Insel', () => {
    const w = createWorld(3);
    home(w).stock.wood = 11;
    w.islands[2]!.stock.wood = 77;
    expect(chipView(w, 'wood').text.startsWith('11 ')).toBe(true);
    expect(chipView(w, 'wood', 0).text.startsWith('11 ')).toBe(true);
    expect(chipView(w, 'wood', 2).text.startsWith('77 ')).toBe(true);
    expect(chipView(w, 'wood', 2).label.startsWith('Holz 77')).toBe(true);
  });
  it('stockTooltip liest Lager und Bilanz der Insel', () => {
    const w = createWorld(3);
    w.islands[2]!.stock.wood = 77;
    expect(stockTooltip(w, 'wood', 2).startsWith('Holz 77 / ')).toBe(true);
  });
  it('D-143 stockPrefix: Name erst mit seafaring, vorher null (auch für Fremdinseln)', () => {
    const w = createWorld(3);
    expect(stockPrefix(w, 2)).toBeNull();
    expect(stockPrefix(w, 0)).toBeNull();
    const s = seaWorld();
    expect(stockPrefix(s, 2)).toBe('Felsbucht');
    expect(stockPrefix(s, 0)).toBe('Heimat');
  });
  it('Gewürz-Chip: verborgen bis U6 oder Gewürz > 0 auf der aktiven Insel', () => {
    const w = createWorld(3);
    expect(stockChipHidden(w, 'spice')).toBe(true);
    w.islands[2]!.stock.spice = 4;
    expect(stockChipHidden(w, 'spice')).toBe(true); // Heimat aktiv, dort 0
    expect(stockChipHidden(w, 'spice', 2)).toBe(false);
    const s = seaWorld();
    expect(stockChipHidden(s, 'spice')).toBe(false);
  });
});
