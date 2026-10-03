import { describe, expect, it } from 'vitest';
import {
  lockMatrix,
  needIcons,
  burningText,
  producesText,
  protectedCount,
  refundText,
  restView,
  upgradeOkText,
  upgradeReasonTexts,
  levelText,
  refundLine,
  utilizationText,
  upgradeView,
  deficitLine,
} from '../../src/ui/inspect';
import { upgradeBuilding } from '../../src/sim/upgrade';
import { serialize } from '../../src/sim/save';
import type { BuildingDefId, World } from '../../src/sim/types';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building } from '../../src/sim/types';
import { TIERS } from '../../src/sim/defs/tiers';
import { deficitText, demolishText, goodList, stateInfo } from '../../src/ui/texts';
import { GROWTH_INTERVAL } from '../../src/sim/defs/timing';
import { formatGameTime } from '../../src/ui/time';
import { setHouse, uxWorld } from './worlds';
import { createWorld } from '../../src/sim/world';
import { taxEffect } from '../../src/ui/guide';
import { SCENARIOS } from '../sim/scenarios';
import { setGoodLock } from '../../src/sim/tax';
import { placeTownhall, setHouse as setHouseTo, village } from '../sim/helpers';

describe('refundText (AK-U1b-02)', () => {
  it('nennt den tatsächlichen Betrag und den Verfall bei vollem Lager', () => {
    const text = refundText(
      { money: 10, wood: 5, tools: 0, stone: 0 },
      { money: 10, wood: 1, tools: 0, stone: 0 },
    );
    expect(text).toContain('1 Holz');
    expect(text).toContain('4 verfallen – Lager voll');
  });

  it('zeigt ohne Verfall nur die Beträge', () => {
    const c = { money: 10, wood: 5, tools: 0, stone: 0 };
    const text = refundText(c, c);
    expect(text).toBe('10 Geld · 5 Holz');
    expect(text).not.toContain('verfallen');
  });

  it('benennt mehrere Güter mit Verfall einzeln', () => {
    const text = refundText(
      { money: 5, wood: 4, tools: 2, stone: 0 },
      { money: 5, wood: 0, tools: 1, stone: 0 },
    );
    expect(text).toBe(
      '5 Geld · 0 Holz (4 verfallen – Lager voll) · 1 Werkzeug (1 verfallen – Lager voll)',
    );
  });
});

describe('restView (AK-U2-03)', () => {
  it('Tagesphase und Einwohnerzahl', () => {
    const w = SCENARIOS.galerie!();
    w.tick = 3000;
    const sum = Object.values(w.buildings).reduce((n, b) => n + (b.house?.inhabitants ?? 0), 0);
    expect(sum).toBeGreaterThan(0);
    expect(restView(w)).toEqual({
      phase: 'night',
      label: 'Nacht',
      symbol: '☾',
      inhabitants: sum,
      tax: taxEffect('normal'), // galerie hat eine aktive Amtsstube: kein Zusatz
    });
  });
  it('alle vier Phasen', () => {
    const w = SCENARIOS.galerie!();
    const at = (t: number) => {
      w.tick = t;
      return restView(w).label;
    };
    expect([at(0), at(2400), at(3000), at(4700)]).toEqual(['Tag', 'Abend', 'Nacht', 'Morgen']);
  });
});

describe('burningText (M6-AK-U1-08)', () => {
  const base = { id: 1, x: 0, y: 0, connected: true, progress: 0, state: 'burning' as const };
  it('M6-AK-U1-08: Betrieb nennt outageUntil - tick', () => {
    expect(burningText({ ...base, defId: 'lumberjack', outageUntil: 150 }, 100)).toBe(
      'Brennt — wieder in Betrieb in 5 s',
    );
  });
  it('M6-AK-U1-08: Kapelle (Dienst) ebenso, nie negativ', () => {
    expect(burningText({ ...base, defId: 'chapel', outageUntil: 130 }, 100)).toContain('in 3 s');
    expect(burningText({ ...base, defId: 'chapel', outageUntil: 90 }, 100)).toContain('in 0 s');
  });
  it('M6-AK-U1-07: protectedCount zählt brennbare Gebäude im Radius, nur bei Anbindung', () => {
    const w = createWorld(3);
    const mk = (
      id: number,
      defId: 'firestation' | 'distillery' | 'market',
      x: number,
      connected = true,
    ) => {
      w.buildings[id] = { id, defId, x, y: 50, connected, progress: 0, state: 'ok' };
      return w.buildings[id];
    };
    const st = mk(901, 'firestation', 10);
    mk(902, 'distillery', 14); // im Radius 8
    mk(903, 'distillery', 30); // ausserhalb
    mk(904, 'market', 12); // nicht brennbar
    expect(protectedCount(w, st)).toBe(1);
    st.connected = false;
    expect(protectedCount(w, st)).toBe(0);
  });
});

describe('Anzeige bei Brandausfall (QA-M6U1)', () => {
  it('producesText: laufend mit Takt, brennend ohne', () => {
    const def = { produces: 'rum' as const, cycle: 50 };
    expect(producesText(def, false)).toBe('Erzeugt Rum alle 5 s');
    expect(producesText(def, true)).not.toContain('alle 5 s');
    expect(producesText(def, true)).toContain('brennt');
  });
  it('protectedCount: eine zweite Wache ändert die Zahl der ersten nicht', () => {
    const w = createWorld(3);
    const mk = (id: number, defId: 'firestation' | 'distillery', x: number) => {
      w.buildings[id] = { id, defId, x, y: 50, connected: true, progress: 0, state: 'ok' };
      return w.buildings[id];
    };
    const a = mk(901, 'firestation', 10);
    mk(902, 'distillery', 14);
    mk(903, 'firestation', 12);
    expect(protectedCount(w, a)).toBe(1);
  });
});

describe('Inselchronik und Aufstiegszeilen (M7-UX Task 8)', () => {
  it('Aufstiegszeile ohne „Tick" (Spec L8)', () => {
    expect(upgradeOkText()).toBe(
      `✓ Bedingungen erfüllt — Aufstieg in höchstens ${formatGameTime(GROWTH_INTERVAL)}`,
    );
  });
  it('Aufstiegsgründe über friendlyReason mit Aufstiegskosten (Spec L3 Aufrufer)', () => {
    const { w, house } = uxWorld();
    setHouse(house, 1, TIERS[1].maxInhabitants, ['food']);
    w.money = 0;
    const texts = upgradeReasonTexts(w, house);
    expect(texts).toContain(`✗ Zu wenig Geld: ${TIERS[1].upgradeCost!.money} nötig, 0 vorhanden`);
    for (const t of texts) expect(t).not.toContain('Tick');
  });
});

describe('M8 Info-Texte (AK-U2-02)', () => {
  it('AK-U2-02 stateInfo: fehlende Inputs mit „und“, leere Liste → alle Inputs; Weberei; producesText Glashütte', () => {
    const gw: Building = {
      id: 1,
      defId: 'glassworks',
      x: 0,
      y: 0,
      connected: true,
      progress: 0,
      state: 'waitingInput',
    };
    expect(stateInfo(gw, 0, ['wood'])).toEqual({ text: 'Wartet auf Holz', ok: false });
    expect(stateInfo(gw, 0, ['stone', 'wood']).text).toBe('Wartet auf Stein und Holz');
    expect(stateInfo(gw, 0, []).text).toBe('Wartet auf Stein und Holz');
    expect(stateInfo(gw, 0).text).toBe('Wartet auf Stein und Holz');
    const weaver: Building = { ...gw, defId: 'weaver' };
    expect(stateInfo(weaver, 0, ['wool']).text).toBe('Wartet auf Wolle');
    expect(stateInfo(weaver, 0).text).toBe('Wartet auf Wolle');
    expect(producesText(BUILDING_DEFS.glassworks, false)).toBe('Erzeugt Glas alle 5 s');
    expect(goodList(['stone', 'wood'])).toBe('Stein und Holz');
    expect(goodList(['wool'])).toBe('Wolle');
  });
});

describe('M10 noService', () => {
  it('AK-S2-17 stateInfo noService nennt die Schule', () => {
    const tm: Building = {
      id: 1,
      defId: 'toolmaker',
      x: 0,
      y: 0,
      connected: true,
      progress: 0,
      state: 'noService',
    };
    expect(stateInfo(tm, 0)).toEqual({ text: 'Braucht eine Schule in Reichweite', ok: false });
  });
});

describe('M10 Ruhe-Ansicht Steuer', () => {
  it('AK-U1-13 rest-tax: wirksame Stufe, ohne aktive Amtsstube mit Zusatz', () => {
    const w = createWorld(3);
    w.taxLevel = 'high';
    expect(restView(w).tax).toBe(`${taxEffect('normal')} (keine Amtsstube)`);
  });
});

describe('M10 Amtsstuben-Panel (Spec 11.8)', () => {
  it('RF-5 Sperr-Matrix: Zeile verschwindet bei 0 Einwohnern, Sperre bleibt, kehrt gedrückt zurück', () => {
    const { w, houses } = village(2, { unlockAll: true });
    placeTownhall(w);
    setHouseTo(houses[0]!, 1, 2);
    setHouseTo(houses[1]!, 2, 3);
    expect(setGoodLock(w, 2, 'cloth', true).ok).toBe(true);
    expect(lockMatrix(w).map((r) => r.tier)).toEqual([1, 2]);
    expect(lockMatrix(w)[1]!.goods.find((g) => g.good === 'cloth')!.locked).toBe(true);
    setHouseTo(houses[1]!, 1, 3);
    expect(lockMatrix(w).map((r) => r.tier)).toEqual([1]);
    expect(w.goodLocks).toEqual([{ tier: 2, good: 'cloth' }]);
    setHouseTo(houses[1]!, 2, 3);
    expect(lockMatrix(w)[1]!.goods.find((g) => g.good === 'cloth')!.locked).toBe(true);
    expect(lockMatrix(createWorld(3)).length).toBe(0); // vor U5 verborgen
  });
});

describe('M10 Symbole im Einbau (Spec 14)', () => {
  it('AK-U4-01 Haus-Panel: Bedarfe als Symbole mit erfüllt/offen und Gutname', () => {
    const { w, house } = uxWorld();
    setHouse(house, 2, 4, ['food', 'cloth']);
    house.house!.services = { faith: true };
    const items = needIcons(w, house);
    expect(items[0]).toEqual({ icon: 'food', met: true, label: 'Nahrung' });
    expect(items.map((i) => i.icon)).toEqual(['food', 'cloth', 'faith']);
    expect(items.every((i) => i.met)).toBe(true);
    house.house!.satisfied.cloth = false;
    expect(needIcons(w, house)[1]).toEqual({ icon: 'cloth', met: false, label: 'Stoff' });
  });
});

describe('M11 Betriebs-Panel (Spec 7)', () => {
  /** Betrieb roh einsetzen (ohne Kachel); das Panel liest nur Gebäude und Welt. */
  const put = (w: World, defId: BuildingDefId, extra: Partial<Building> = {}): Building => {
    const b: Building = {
      id: w.nextBuildingId++,
      defId,
      x: 0,
      y: 0,
      connected: true,
      progress: 0,
      state: 'ok',
      ...extra,
    };
    w.buildings[b.id] = b;
    return b;
  };
  it('AK-UI-03 Auslastung ohne eff 100 %, eff 94 208 → 36 %; Stufe 1/2; Haus und Kapelle ohne Zeilen', () => {
    const w = createWorld(3, { unlockAll: true });
    expect(utilizationText(put(w, 'fisher'))).toBe('Auslastung 100 %');
    expect(utilizationText(put(w, 'fisher', { eff: 94_208 }))).toBe('Auslastung 36 %');
    expect(levelText(put(w, 'fisher'))).toBe('Stufe 1');
    expect(levelText(put(w, 'fisher', { level: 2 }))).toBe('Stufe 2');
    const { houses } = village(1, { unlockAll: true });
    expect(utilizationText(houses[0]!)).toBeNull();
    expect(levelText(houses[0]!)).toBeNull();
    expect(levelText(put(w, 'chapel'))).toBeNull();
  });
  it('AK-UI-04 Ausbau Fischer: vor U3 verborgen, Kosten, Gebühr, Vorschau, ✗-Grund, Stufe 3 „Höchste Stufe"', () => {
    const w0 = createWorld(3);
    expect(upgradeView(w0, put(w0, 'fisher'))).toBeNull();
    const w = createWorld(3, { unlockAll: true });
    w.money = 1000;
    w.stock.cloth = 2;
    w.stock.rum = 2;
    const f = put(w, 'fisher');
    const before = serialize(w);
    expect(upgradeView(w, f)).toEqual({
      title: 'Ausbau zu Stufe 2',
      cost: 'Kosten 50 Geld · 3 Holz · 1 Werkzeug',
      fee: 'Gebühr 2 Stoff',
      preview: 'Ausstoss 15 → 25 / min · Unterhalt 30 → 42 / min',
      reasons: [],
      ok: true,
    });
    expect(serialize(w)).toBe(before); // Vorschau ändert die Welt nicht
    w.stock.cloth = 0;
    expect(upgradeView(w, f)!.reasons).toEqual(['✗ Zu wenig Stoff']);
    w.stock.cloth = 2;
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    expect(upgradeView(w, f)!.preview).toBe('Ausstoss 25 → 37.5 / min · Unterhalt 42 → 54 / min');
    w.unlocked = w.unlocked.filter((u) => u !== 'U5' && u !== 'U6');
    expect(upgradeView(w, f)).toBeNull(); // Stufe 3 vor U5 verborgen
    const w3 = createWorld(3, { unlockAll: true });
    const f3 = put(w3, 'fisher', { level: 3 });
    expect(upgradeView(w3, f3)).toEqual({
      title: 'Höchste Stufe',
      cost: '',
      fee: '',
      preview: '',
      reasons: [],
      ok: false,
    });
  });
});

describe('M11 Rückerstattung nach Ausbau (paidCost)', () => {
  const stufe2 = () => {
    const w = createWorld(3, { unlockAll: true });
    const b: Building = {
      id: w.nextBuildingId++,
      defId: 'fisher',
      x: 0,
      y: 0,
      connected: true,
      progress: 0,
      state: 'ok',
      level: 2,
    };
    w.buildings[b.id] = b;
    w.stock.wood = 0;
    w.stock.tools = 0;
    return { w, b };
  };
  it('Panelzeile: Fischer Stufe 2 erstattet die Hälfte von Bau plus Stufe (150/8/3)', () => {
    const { w, b } = stufe2();
    expect(refundLine(w, b)).toBe('Rückerstattung: 75 Geld · 4 Holz · 1 Werkzeug');
  });
  it('Abriss-Meldung: gleiche Werte, Stufe 1 weiter 50/2/1', () => {
    const { w, b } = stufe2();
    expect(demolishText(w, b)).toBe(
      'Fischerhütte abgerissen · zurück 75 Geld · 4 Holz · 1 Werkzeug',
    );
    b.level = undefined;
    expect(demolishText(w, b)).toBe(
      'Fischerhütte abgerissen · zurück 50 Geld · 2 Holz · 1 Werkzeug',
    );
  });
});

describe('M11 Haus-Panel Defizit (Spec 7, Anhang 01 E)', () => {
  const pre = 'Rum-Bilanz negativ — Aufstieg verzögert; ';
  it('AK-UI-07 deficitText: X = floor(Lager / −net / 6); leer, über 60, unter 1, genau 1', () => {
    expect(deficitText('rum', 40, -3)).toBe(`${pre}Vorrat reicht noch 2 Minuten`);
    expect(deficitText('rum', 0, -3)).toBe(`${pre}Vorrat leer`);
    expect(deficitText('rum', 100, -0.2)).toBe(`${pre}Vorrat reicht noch über 60 Minuten`);
    expect(deficitText('rum', 10, -3)).toBe(`${pre}Vorrat reicht noch weniger als 1 Minute`);
    expect(deficitText('rum', 20, -3)).toBe(`${pre}Vorrat reicht noch 1 Minute`);
    expect(deficitText('rum', 360, -1)).toBe(`${pre}Vorrat reicht noch über 60 Minuten`); // x = 60
    expect(deficitText('rum', 354, -1)).toBe(`${pre}Vorrat reicht noch 59 Minuten`); // x = 59
  });
  it('AK-UI-07 deficitLine: volles Siedlerhaus, Rum 40, keine Brennerei → Rum-Zeile; ohne Defizit oder nicht voll keine', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const h = houses[0]!;
    setHouseTo(h, 2, 8);
    const add = (defId: BuildingDefId) => {
      const id = w.nextBuildingId++;
      w.buildings[id] = { id, defId, x: 0, y: 0, connected: true, progress: 0, state: 'ok' };
    };
    for (let i = 0; i < 3; i++) add('fisher'); // Nahrung 7,5 − 4,0 = 3,5 = Δ 3,5 (dämpft nicht)
    add('weaver');
    add('weaver'); // Stoff 4,0 − 1,6 = 2,4 ≥ Δ 1,4
    w.stock.rum = 40;
    expect(deficitLine(w, h)).toBe(`${pre}Vorrat reicht noch 2 Minuten`);
    w.stock.rum = 0;
    expect(deficitLine(w, h)).toBe(`${pre}Vorrat leer`);
    setHouseTo(h, 2, 7);
    expect(deficitLine(w, h)).toBeNull();
    setHouseTo(h, 2, 8);
    add('distillery');
    add('distillery'); // Rum 4,0 ≥ Δ 3,0
    expect(deficitLine(w, h)).toBeNull();
  });
});
