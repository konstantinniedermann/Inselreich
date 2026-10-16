import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deriveUnlocks } from '../../src/sim/unlocks';
import { STORAGE_CAP } from '../../src/sim/defs/goods';
import { goodsBalance } from '../../src/sim/queries';
import { SCENARIOS } from '../sim/scenarios';
import {
  BALANCE_REFRESH_MS,
  balanceDue,
  balanceText,
  balanceView,
  bindIslandMenu,
  unbindIslandMenu,
  chipRole,
  chipView,
  reachLine,
  stockChipView,
  createBalanceButton,
  houseConsumers,
  shouldBlurAfterClick,
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
  renderNoticeStack,
  updateNoticeStack,
  tierTooltip,
} from '../../src/ui/hud';
import { GOOD_IDS } from '../../src/sim/defs/goods';
import { HOME, home, createWorld } from '../../src/sim/world';
import { UNLOCK_IDS } from '../../src/sim/defs/unlocks';
import type { Tier } from '../../src/sim/types';
import { houseNearKontor, placeTownhall, setAllTax } from '../sim/helpers';
import { uxWorld } from './worlds';
import type { Building, BuildingDefId, GoodId, World } from '../../src/sim/types';
import { formatGameTime, GOODS_BALANCE_TICKS, perMinute, signedNum } from '../../src/ui/time';
import { tickEconomy } from '../../src/sim/economy';
import { flowLabel } from '../../src/ui/balanceFlow';
import { putBuilding, twoIslandWorld } from '../sim/helpers';
import { renderUpkeepList, UPKEEP_EMPTY_TEXT } from '../../src/ui/upkeepCard';
import { FakeElement, fakeDocument } from './fakeDom';
import { acceptFarOrder } from '../../src/sim/orders';
import { dropKontor, farWorld, islandOf, periodStart, stepAt } from '../sim/farHelpers';
import { deliverLabel, orderCardText, orderVisible } from '../../src/ui/order';
import { farAcceptTooltip, farOfferText, farOrderText } from '../../src/ui/farOrder';

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
        `(Erzeugung ${pm(b.produced)} / min, Verbrauch ${pm(b.consumed)} / min)\n` +
        'Noch kein Erzeuger',
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

describe('I-108 Bilanz-Chip in der Kopfzeile', () => {
  it('AK-5 label und Tooltip als Klartext von Hand (taxes 90, upkeep 130)', () => {
    const w = createWorld(3);
    w.stats.taxes = 90;
    w.stats.upkeep = 130;
    expect(balanceView(w).text).toBe('+540 / −780');
    expect(balanceView(w).label).toBe(
      'Bilanz −240 / min · Steuern +540 / min · Unterhalt −780 / min',
    );
    expect(balanceTooltip(w).startsWith('Bilanz −240 / min\n')).toBe(true);
    expect(balanceTooltip(w)).toContain('Steuern +540 / min · Unterhalt −780 / min');
  });
  it('AK-6 Chip-Text ist bei positivem und negativem Netto gleich aufgebaut', () => {
    const w = createWorld(3);
    w.stats.taxes = 130;
    w.stats.upkeep = 90;
    expect(balanceView(w).text).toBe('+780 / −540');
    w.stats.taxes = 90;
    w.stats.upkeep = 130;
    expect(balanceView(w).text).toBe('+540 / \u2212780');
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
    expect(balanceView(w).label).toBe(flowLabel(w.stats));
    expect(balanceView(w).label).toContain('Bilanz ±0 / min');
    expect(balanceView(w).label).toContain('Steuern +0 / min');
    expect(balanceView(w).label).toContain('Unterhalt \u22120 / min');
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

describe('Inselmenü: Dokument-Listener (REL-15, R437 B1)', () => {
  afterEach(() => vi.unstubAllGlobals());
  type Reg = { type: string; opts?: { signal?: AbortSignal } };
  it('ein erneutes Binden derselben Kopfzeile meldet den alten Satz ab', () => {
    const regs: Reg[] = [];
    vi.stubGlobal('document', {
      addEventListener: (type: string, _fn: unknown, opts?: { signal?: AbortSignal }) =>
        regs.push({ type, opts }),
      removeEventListener: () => {},
    });
    const el = () => ({ addEventListener: () => {}, contains: () => false, hidden: true });
    const box = { ...el(), querySelector: () => el() };
    const header = {
      querySelector: (sel: string) => (sel === '.hud-islands' ? box : null),
    } as unknown as HTMLElement;
    const state = { world: createWorld(3) } as never;
    const actions = {} as never;
    bindIslandMenu(header, state, actions);
    const first = regs.slice();
    bindIslandMenu(header, state, actions);
    expect(regs.map((r) => r.type).sort()).toEqual([
      'keydown',
      'keydown',
      'pointerdown',
      'pointerdown',
    ]);
    const active = regs.filter((r) => r.opts?.signal !== undefined && !r.opts.signal.aborted);
    const permanent = regs.filter((r) => r.opts?.signal === undefined);
    expect(active.length + permanent.length).toBe(2);
    for (const r of first) expect(r.opts?.signal?.aborted).toBe(true);
  });

  const setup = () => {
    const regs: Reg[] = [];
    vi.stubGlobal('document', {
      addEventListener: (type: string, _fn: unknown, opts?: { signal?: AbortSignal }) =>
        regs.push({ type, opts }),
      removeEventListener: () => {},
    });
    const el = () => ({ addEventListener: () => {}, contains: () => false, hidden: true });
    const box = { ...el(), querySelector: () => el() };
    const header = {
      querySelector: (sel: string) => (sel === '.hud-islands' ? box : null),
    } as unknown as HTMLElement;
    return { regs, header, state: { world: createWorld(3) } as never, actions: {} as never };
  };

  it('unbindIslandMenu bricht alle Dokument-Listener der Kopfzeile ab', () => {
    const { regs, header, state, actions } = setup();
    bindIslandMenu(header, state, actions);
    expect(regs.length).toBeGreaterThan(0);
    unbindIslandMenu(header);
    for (const r of regs) expect(r.opts?.signal?.aborted).toBe(true);
  });

  it('unbindIslandMenu ohne Binden und zweimal wirft nicht', () => {
    const { header, state, actions } = setup();
    expect(() => {
      unbindIslandMenu(header);
      unbindIslandMenu(header);
    }).not.toThrow();
    bindIslandMenu(header, state, actions);
    expect(() => {
      unbindIslandMenu(header);
      unbindIslandMenu(header);
    }).not.toThrow();
  });

  it('nach unbind bindet ein neues Spiel wieder', () => {
    const { regs, header, state, actions } = setup();
    bindIslandMenu(header, state, actions);
    unbindIslandMenu(header);
    bindIslandMenu(header, state, actions);
    const active = regs.filter((r) => r.opts?.signal !== undefined && !r.opts.signal.aborted);
    const permanent = regs.filter((r) => r.opts?.signal === undefined);
    expect(active.length + permanent.length).toBe(2);
  });

  // app.ts braucht das DOM und ist in Vitest (Node) nicht startbar: Quelltext prüfen (AK-R16-06).
  it('dispose meldet das Inselmenü ab (Quelltext, AK-R16-06)', () => {
    const src = readFileSync('src/ui/app.ts', 'utf8');
    const start = src.indexOf('const dispose = (): void => {');
    expect(start).toBeGreaterThan(-1);
    const block = src.slice(start, src.indexOf('\n  };', start));
    expect(block).toContain('unbindIslandMenu(hudEl)');
    expect(block.indexOf('unbindIslandMenu(hudEl)')).toBeLessThan(
      block.indexOf('hudEl.replaceChildren()'),
    );
  });
});

/** Klont ein Gebäude unter neuer ID auf dieselbe Insel (nur für die Zählung in focusList). */
function clone(w: World, from: Building, defId: BuildingDefId, n: number): void {
  for (let i = 0; i < n; i++) {
    const id = 9000 + Object.keys(w.buildings).length;
    w.buildings[id] = { ...from, id, defId, house: undefined };
  }
}
const line2 = (w: World, good: GoodId): string => stockTooltip(w, good).split('\n').at(-1)!;

describe('I-043 Chip-Tooltip, Zeile 2 (AK-GC-10)', () => {
  it('AK-GC-10 Erzeuger und Verbraucher', () => {
    const { w, fisher } = uxWorld();
    clone(w, fisher, 'lumberjack', 3);
    clone(w, fisher, 'toolmaker', 1);
    expect(line2(w, 'wood')).toBe('Klick: 3 Erzeuger und 1 Verbraucher zeigen');
  });
  it('AK-GC-10 Einzahl Erzeuger und Verbraucher', () => {
    const { w, fisher } = uxWorld();
    clone(w, fisher, 'lumberjack', 1);
    clone(w, fisher, 'toolmaker', 1);
    expect(line2(w, 'wood')).toBe('Klick: 1 Erzeuger und 1 Verbraucher zeigen');
  });
  it('AK-GC-10 nur Erzeuger', () => {
    const { w, fisher } = uxWorld();
    clone(w, fisher, 'lumberjack', 2);
    expect(line2(w, 'wood')).toBe('Klick: 2 Erzeuger zeigen');
  });
  it('AK-GC-10 kein Erzeuger, auch wenn Verbraucher existieren', () => {
    const { w, fisher } = uxWorld();
    clone(w, fisher, 'toolmaker', 2);
    expect(line2(w, 'wood')).toBe('Noch kein Erzeuger');
  });
  it('AK-GC-10 Hauszusatz mit Mehrzahl, Einzahl und ohne', () => {
    const { w, house } = uxWorld();
    house.house!.tier = 1;
    expect(houseConsumers(w, 0, 'food')).toBe(1);
    expect(line2(w, 'food')).toBe('Klick: 1 Erzeuger zeigen · 1 Haus verbraucht Nahrung');
    clone(w, house, 'house', 2);
    for (const b of Object.values(w.buildings)) {
      if (b.defId === 'house') b.house = { ...house.house! };
    }
    expect(houseConsumers(w, 0, 'food')).toBe(3);
    expect(line2(w, 'food')).toBe('Klick: 1 Erzeuger zeigen · 3 Häuser verbrauchen Nahrung');
    expect(houseConsumers(w, 0, 'cloth')).toBe(0);
    expect(line2(w, 'cloth')).toBe('Noch kein Erzeuger');
  });
  it('AK-GC-14 Mausklick gibt den Fokus ab, Tastatur nicht', () => {
    expect(shouldBlurAfterClick(1)).toBe(true);
    expect(shouldBlurAfterClick(0)).toBe(false);
  });
});

describe('Bilanz-Knopf und Betriebsliste (I-062, AK-8, AK-9)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('AK-8 Bilanz-Chip ist ein echter Knopf (Enter und Leertaste lösen click aus) und öffnet per Klick', () => {
    vi.stubGlobal('document', fakeDocument);
    const opened: unknown[] = [];
    const btn = createBalanceButton((b) => opened.push(b)) as unknown as FakeElement;
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.type).toBe('button');
    expect(btn.dataset.field).toBe('balance');
    expect(btn.getAttribute('aria-haspopup')).toBe('dialog');
    btn.fire('click', { detail: 1 });
    btn.fire('click', { detail: 0 }); // Enter/Leertaste am Knopf: detail 0
    expect(opened).toHaveLength(2);
  });

  const world = () => {
    const w = twoIslandWorld();
    const mk = (island: number, d: 'fisher' | 'toolmaker', n: number) =>
      putBuilding(w, island, d, 2 + n * 3, 2);
    const fisher = mk(0, 'fisher', 0);
    const big = mk(1, 'toolmaker', 1);
    const paused = mk(0, 'toolmaker', 2);
    paused.paused = true;
    tickEconomy(w);
    return { w, big, paused, fisher };
  };
  const rowButtons = (root: FakeElement) =>
    root.descendants().filter((e) => e.tagName === 'BUTTON' && e.dataset.building !== undefined);

  it('AK-8 Zeilen sind Knöpfe mit aria-label; Klick springt zum Gebäude (ferne Insel)', () => {
    vi.stubGlobal('document', fakeDocument);
    const { w, big, paused, fisher } = world();
    const jumps: number[] = [];
    const root = renderUpkeepList(w, (id) => jumps.push(id)) as unknown as FakeElement;
    const rows = rowButtons(root);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.dataset.building)).toEqual([big.id, paused.id, fisher.id].map(String));
    for (const r of rows) {
      expect(r.type).toBe('button');
      expect(r.getAttribute('aria-label')).toMatch(/pro Minute/);
    }
    expect(rows[1]!.getAttribute('aria-label')).toMatch(/stillgelegt/);
    rows[0]!.fire('click');
    expect(jumps).toEqual([big.id]);
  });

  it('AK-7 Fusszeile entspricht dem Unterhalt des Tooltips (stats.upkeep je Minute)', () => {
    vi.stubGlobal('document', fakeDocument);
    const { w } = world();
    const root = renderUpkeepList(w, () => {}) as unknown as FakeElement;
    const foot = root.descendants().find((e) => e.dataset.part === 'total')!;
    expect(foot.textContent).toBe(`Unterhalt −${perMinute(w.stats.upkeep, 100)} / min`);
  });

  it('AK-9 Fusszeile liegt ausserhalb des scrollenden Bereichs', () => {
    vi.stubGlobal('document', fakeDocument);
    const { w } = world();
    const root = renderUpkeepList(w, () => {}) as unknown as FakeElement;
    const scroller = root.descendants().find((e) => e.className === 'upkeep-scroll')!;
    expect(scroller).toBeDefined();
    expect(scroller.descendants().some((e) => e.dataset.part === 'total')).toBe(false);
    expect(root.children.some((e) => e.dataset.part === 'total')).toBe(true);
  });

  it('AK-9 mehr als 20 Betriebe: «und n weitere»; 0 Betriebe: Hinweistext', () => {
    vi.stubGlobal('document', fakeDocument);
    const w = twoIslandWorld();
    for (let i = 0; i < 23; i++)
      putBuilding(w, i % 2, 'fisher', 2 + (i % 8) * 3, 2 + Math.floor(i / 8) * 3);
    tickEconomy(w);
    const root = renderUpkeepList(w, () => {}) as unknown as FakeElement;
    expect(rowButtons(root)).toHaveLength(20);
    const more = root.descendants().find((e) => e.dataset.part === 'more')!;
    expect(more.textContent).toMatch(/^und 3 weitere/);
    const empty = renderUpkeepList(twoIslandWorld(), () => {}) as unknown as FakeElement;
    expect(rowButtons(empty)).toHaveLength(0);
    expect(empty.descendants().some((e) => e.textContent === UPKEEP_EMPTY_TEXT)).toBe(true);
  });

  it('AK-UA3-10 Inselzeilen über der Liste: Text, Aria, Welt unverändert', () => {
    vi.stubGlobal('document', fakeDocument);
    const { w } = world();
    const before = structuredClone(w);
    const root = renderUpkeepList(w, () => {}) as unknown as FakeElement;
    const rows = root.descendants().filter((e) => e.className === 'upkeep-island');
    expect(rows).toHaveLength(2);
    expect(rows[0]!.textContent).toMatch(/^.+ · \d+ Gebäude · \d+ \/ min$/);
    expect(rows[0]!.getAttribute('aria-label')).toMatch(/Unterhalt \d+ pro Minute/);
    const scroll = root.descendants().find((e) => e.className === 'upkeep-scroll')!;
    expect(scroll.children.map((c) => c.className)).toEqual(['upkeep-islands', 'upkeep-rows']);
    expect(w).toEqual(before);
  });
});

describe('Kartenstapel (I-099, AK-UA3-11, AK-UA3-13)', () => {
  it('AK-UA3-11 Stufe aus: Krisenkarte bleibt hidden', () => {
    const el = { textContent: 'Krisen: aus', hidden: false, dataset: {} as Record<string, string> };
    const stack = {
      querySelector: (sel: string) => (sel.includes('crisis-card') ? el : null),
    } as unknown as HTMLElement;
    updateNoticeStack(stack, SCENARIOS['krise-aus']!());
    expect(el.textContent).toBe('');
    expect(el.hidden).toBe(true);
  });

  it('AK-UA3-13 .notice-stack nutzt gap: var(--stack-gap), Variable einmal definiert', () => {
    const css = readFileSync('src/style.css', 'utf8');
    const block = /\.notice-stack \{[^}]*\}/.exec(css)![0];
    expect(block).toMatch(/gap:\s*var\(--stack-gap\)/);
    expect(css.match(/--stack-gap:/g)).toHaveLength(1);
  });
});

describe('Meldungsstapel mit Fernkarte (Handel 2 T08)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const P = periodStart(0);
  const build = (w: World) => {
    vi.stubGlobal('document', fakeDocument);
    const calls = { acceptFar: 0 };
    const actions = {
      deliver: () => {},
      accept: () => {},
      decline: () => {},
      toProducer: () => {},
      cancel: () => {},
      acceptFar: () => {
        calls.acceptFar++;
      },
    };
    const game = new FakeElement('div');
    const stack = renderNoticeStack(
      game as unknown as HTMLElement,
      w,
      actions,
    ) as unknown as FakeElement;
    return { stack, calls };
  };
  const offerWorld = (): World => {
    const w = farWorld(3, ['B']);
    stepAt(w, P);
    return w;
  };

  it('Reihenfolge Auftrag, Fernkarte, Krise; Fernkarte zeigt Text und Tooltip', () => {
    const w = offerWorld();
    const { stack } = build(w);
    expect(stack.children.map((c) => c.dataset.field ?? c.className)).toEqual([
      'order-card',
      'far-card',
      'crisis-card',
    ]);
    const far = stack.querySelector('[data-field="far-card"]')!;
    expect(far.hidden).toBe(false);
    expect(stack.querySelector('[data-field="far-text"]')!.textContent).toBe(farOfferText(w));
    expect(stack.querySelector('[data-field="far-accept"]')!.title).toBe(farAcceptTooltip(w));
  });

  it('Klick auf Annehmen ruft acceptFar genau einmal', () => {
    const { stack, calls } = build(offerWorld());
    stack.querySelector('[data-field="far-accept"]')!.fire('click');
    expect(calls.acceptFar).toBe(1);
  });

  it('nach dem Annehmen: Fernkarte weg, Auftragskarte T-04, Liefern mit Inselname', () => {
    const w = offerWorld();
    const { stack } = build(w);
    const B = islandOf(w, 'B');
    acceptFarOrder(w);
    updateNoticeStack(stack as unknown as HTMLElement, w, HOME);
    expect(stack.querySelector('[data-field="far-card"]')!.hidden).toBe(true);
    expect(stack.querySelector('[data-field="order-text"]')!.textContent).toBe(
      farOrderText(w, w.order!),
    );
    const btn = stack.querySelector('[data-field="order-deliver"]')!;
    expect(btn.textContent).toBe(deliverLabel(w, B));
    expect(btn.classList.contains('unaffordable')).toBe(true);
    w.islands[B]!.stock.rum = 15;
    updateNoticeStack(stack as unknown as HTMLElement, w, HOME);
    expect(btn.classList.contains('unaffordable')).toBe(false);
  });

  it('ohne Angebot ist die Fernkarte verborgen, Auftragskarte unverändert', () => {
    const w = farWorld(3, ['B']);
    const { stack } = build(w);
    expect(stack.querySelector('[data-field="far-card"]')!.hidden).toBe(true);
    expect(stack.querySelector('[data-field="order-text"]')!.textContent).toBe(orderCardText(w));
  });

  it('gesperrte Funktion orders: Fernkarte verborgen', () => {
    const w = createWorld(3);
    w.farOffer = { island: 1, good: 'rum', amount: 15, reward: 450 };
    expect(orderVisible(w)).toBe(false);
    const { stack } = build(w);
    expect(stack.querySelector('[data-field="far-card"]')!.hidden).toBe(true);
  });

  it('Fernauftrag ohne Kontor auf der Fern-Insel: order-card--warn', () => {
    const w = offerWorld();
    const { stack } = build(w);
    acceptFarOrder(w);
    dropKontor(w, islandOf(w, 'B'));
    updateNoticeStack(stack as unknown as HTMLElement, w, HOME);
    const order = stack.querySelector('.order-card')!;
    expect(order.classList.contains('order-card--warn')).toBe(true);
  });
});

describe('I-109 Reichweite am Lager-Chip (AK-UR-04 bis 06)', () => {
  // net -100 bzw. +100 je 100 Ticks: Zeit in Ticks == Bestand bzw. Restplatz
  const t = (ticks: number): string => formatGameTime(ticks);

  it('AK-UR-04 ohne Schwelle: Text und label unverändert', () => {
    const v = stockChipView('wood', 12, -0.05 * 2);
    expect(v.text).toBe('12 ↓');
    expect(v.label).toBe('Holz 12 ↓');
    expect(v.reach).toBeUndefined();
  });

  it('AK-UR-04 mit Schwelle: Suffix im Text und im label, warn', () => {
    // net -1 je 100 Ticks: Zeit in Ticks = Bestand * 100
    const v = stockChipView('wood', 12, -1);
    expect(v.text).toBe(`12 ↓ ${t(1200)}`);
    expect(v.label).toBe(`Holz 12 ↓ ${t(1200)}`);
    expect(v.reach).toBe('warn');
  });

  it('AK-UR-04 alarm bei höchstens 60 s', () => {
    const v = stockChipView('wood', 4, -1);
    expect(v.text).toBe(`4 ↓ ${t(400)}`);
    expect(v.reach).toBe('alarm');
  });

  it('AK-UR-04 «0 ↓ leer»: Text, label, Klasse alarm', () => {
    const v = stockChipView('wood', 0, -1);
    expect(v.text).toBe('0 ↓ leer');
    expect(v.label).toContain('leer');
    expect(v.reach).toBe('alarm');
  });

  it('AK-UR-04 voll nahe: Suffix «↑ Zeit», full-warn, nie alarm', () => {
    // Restplatz 3, net +1 je 100 Ticks: 300 Ticks
    const v = stockChipView('wood', STORAGE_CAP - 3, 1);
    expect(v.text).toBe(`${STORAGE_CAP - 3} ↑ ${t(300)}`);
    expect(v.reach).toBe('full-warn');
    expect(stockChipView('wood', STORAGE_CAP - 1, 100).reach).not.toBe('alarm');
  });

  it('AK-UR-04 voll weit entfernt: ohne Suffix', () => {
    const v = stockChipView('wood', 0, 0.5);
    expect(v.text).toBe('0 ↑');
    expect(v.reach).toBeUndefined();
  });

  it('AK-UR-05 reachLine: Leer/Voll mit Zeit, Rate und Zusatz', () => {
    expect(reachLine(12, -1)).toBe(
      `Leer in ${t(1200)} bei ${signedNum(perMinute(-1, GOODS_BALANCE_TICKS))} / min (ohne Handel und Aufträge)\n`,
    );
    expect(reachLine(STORAGE_CAP - 3, 1)).toBe(
      `Voll in ${t(300)} bei ${signedNum(perMinute(1, GOODS_BALANCE_TICKS))} / min (ohne Handel und Aufträge)\n`,
    );
  });

  it('AK-7 reachLine: leerer Bestand sagt «Jetzt leer», nicht «Leer in 0 s»', () => {
    const rate = signedNum(perMinute(-1, GOODS_BALANCE_TICKS));
    const line = reachLine(0, -1);
    expect(line).toBe(`Jetzt leer bei ${rate} / min (ohne Handel und Aufträge)\n`);
    expect(line).not.toContain('Leer in');
    expect(reachLine(1, -1)).toMatch(/^Leer in /);
  });

  it('AK-UR-05 reachLine: Gleichstand und Sättigung ohne Zeile', () => {
    expect(reachLine(10, 0)).toBe('');
    expect(reachLine(STORAGE_CAP, 100)).toBe('');
  });

  it('AK-UR-05 stockTooltip: Reichweite steht vor der Fokuszeile', () => {
    const w = SCENARIOS['bilanz-nahrung']!();
    const g = GOOD_IDS.find((x) => Math.abs(goodsBalance(w)[x].net) >= 0.05)!;
    expect(g).toBeDefined();
    const lines = stockTooltip(w, g).split('\n');
    expect(lines.length).toBe(3);
    expect(lines[1]).toMatch(/^(Leer|Voll) in .* \(ohne Handel und Aufträge\)$/);
  });

  it('AK-UR-06 gleiche Eingabe liefert gleiche Ansicht, kein Tempo-Einfluss', () => {
    const a = stockChipView('wood', 30, -100);
    const b = stockChipView('wood', 30, -100);
    expect(b).toEqual(a);
    const w = SCENARIOS['bilanz-nahrung']!();
    expect(chipView(w, 'wood')).toEqual(chipView(w, 'wood'));
    expect(stockTooltip(w, 'wood')).toBe(stockTooltip(w, 'wood'));
  });
});
