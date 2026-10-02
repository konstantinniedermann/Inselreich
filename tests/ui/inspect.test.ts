import { describe, expect, it } from 'vitest';
import {
  burningText,
  producesText,
  protectedCount,
  refundText,
  restView,
  upgradeOkText,
  upgradeReasonTexts,
} from '../../src/ui/inspect';
import { TIERS } from '../../src/sim/defs/tiers';
import { GROWTH_INTERVAL } from '../../src/sim/defs/timing';
import { formatGameTime } from '../../src/ui/time';
import { setHouse, uxWorld } from './worlds';
import { createWorld } from '../../src/sim/world';
import { SCENARIOS } from '../sim/scenarios';

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
    expect(restView(w)).toEqual({ phase: 'night', label: 'Nacht', symbol: '☾', inhabitants: sum });
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
      'Brennt — wieder in Betrieb in 50 Ticks',
    );
  });
  it('M6-AK-U1-08: Kapelle (Dienst) ebenso, nie negativ', () => {
    expect(burningText({ ...base, defId: 'chapel', outageUntil: 130 }, 100)).toContain(
      'in 30 Ticks',
    );
    expect(burningText({ ...base, defId: 'chapel', outageUntil: 90 }, 100)).toContain('in 0 Ticks');
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
    expect(producesText(def, false)).toBe('Erzeugt Rum alle 50 Ticks');
    expect(producesText(def, true)).not.toContain('alle 50 Ticks');
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
