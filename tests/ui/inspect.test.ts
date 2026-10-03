import { describe, expect, it } from 'vitest';
import {
  lockMatrix,
  burningText,
  producesText,
  protectedCount,
  refundText,
  restView,
  upgradeOkText,
  upgradeReasonTexts,
} from '../../src/ui/inspect';
import { BUILDING_DEFS } from '../../src/sim/defs/buildings';
import type { Building } from '../../src/sim/types';
import { TIERS } from '../../src/sim/defs/tiers';
import { goodList, stateInfo } from '../../src/ui/texts';
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
