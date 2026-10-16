// I-112 T02: Rat-Defs und Weltfeld (AK-1 Weltteil, AK-10).
import { describe, expect, it } from 'vitest';
import {
  COUNCIL,
  COUNCIL_NOTE,
  COUNCIL_OPEN_MESSAGE,
  COUNCIL_TIERS,
} from '../../src/sim/defs/council';
import { createWorld } from '../../src/sim/world';
import { demolish } from '../../src/sim/build';
import { decree, openCouncilTiers } from '../../src/sim/council';
import { step } from '../../src/sim/tick';
import type { CouncilTier, World } from '../../src/sim/types';
import { putBuilding, setHouse, twoIslandWorld, village } from './helpers';

describe('AK-1 neue Welt (Weltteil)', () => {
  it('council: alle drei Stufen null, feste Schlüsselreihenfolge', () => {
    const w = createWorld(3);
    expect(w.council).toEqual({ 2: null, 3: null, 4: null });
    expect(Object.keys(w.council)).toEqual(['2', '3', '4']);
  });
});

describe('AK-10 Tabelle', () => {
  it('sechs Einträge, je Stufe A und B mit name, text und Zahl', () => {
    expect(COUNCIL_TIERS).toEqual([2, 3, 4]);
    let n = 0;
    for (const t of COUNCIL_TIERS)
      for (const s of ['A', 'B'] as const) {
        const d = COUNCIL[t][s];
        expect(d.name.length).toBeGreaterThan(0);
        expect(d.text).toMatch(/\d/);
        expect(d.lever.value).toBeGreaterThan(0);
        n++;
      }
    expect(n).toBe(6);
  });

  it('Hebel zeigen auf Weberei, Kapelle, Brennerei, Stufe 3, Glashütte, Stufe 4 mit den Spec-Werten', () => {
    expect(COUNCIL[2].A.lever).toEqual({ kind: 'cycle', defId: 'weaver', value: 40 });
    expect(COUNCIL[2].B.lever).toEqual({ kind: 'serviceRadius', defId: 'chapel', value: 13 });
    expect(COUNCIL[3].A.lever).toEqual({ kind: 'cycle', defId: 'distillery', value: 40 });
    expect(COUNCIL[3].B.lever).toEqual({ kind: 'maxInhabitants', tier: 3, value: 16 });
    expect(COUNCIL[4].A.lever).toEqual({ kind: 'cycle', defId: 'glassworks', value: 30 });
    expect(COUNCIL[4].B.lever).toEqual({ kind: 'maxInhabitants', tier: 4, value: 22 });
  });

  it('Namen und Texte wörtlich aus Spec 3.1', () => {
    expect(COUNCIL[2].A.name).toBe('Webordnung');
    expect(COUNCIL[2].B.text).toBe(
      'Kapellen reichen 3 Felder weiter. Spart Kapellen in weiten Städten.',
    );
    expect(COUNCIL[4].B.text).toBe('Kaufmannshäuser fassen 22 statt 20 Kaufleute.');
    expect(COUNCIL_NOTE).toBe('Gilt für die ganze Partie, der andere Beschluss verfällt.');
    expect(COUNCIL_OPEN_MESSAGE).toBe('Der Rat tagt: ein Beschluss steht an');
  });
});

const TIERS_ALL: CouncilTier[] = [2, 3, 4];

function houseWorld(tier: 1 | 2 | 3 | 4): { w: World; id: number } {
  const { w, houses } = village(1);
  setHouse(houses[0]!, tier, 1);
  return { w, id: houses[0]!.id };
}

describe('AK-1 decree auf neue Welt', () => {
  it('jede Stufe: Beschluss nicht offen, Welt unverändert', () => {
    const w = createWorld(3);
    const before = JSON.stringify(w);
    for (const t of TIERS_ALL)
      expect(decree(w, t, 'A')).toEqual({ ok: false, reason: 'Beschluss nicht offen' });
    expect(JSON.stringify(w)).toBe(before);
  });
});

describe('AK-2 Öffnen', () => {
  it('Hausstufe 2 öffnet nur Stufe 2', () => {
    const { w } = houseWorld(2);
    step(w);
    expect(w.council).toEqual({ 2: 'open', 3: null, 4: null });
  });

  it('Hausstufe 3 öffnet 2 und 3', () => {
    const { w } = houseWorld(3);
    step(w);
    expect(w.council).toEqual({ 2: 'open', 3: 'open', 4: null });
  });

  it('Hausstufe 4 öffnet alle', () => {
    const { w } = houseWorld(4);
    step(w);
    expect(w.council).toEqual({ 2: 'open', 3: 'open', 4: 'open' });
  });

  it('Haus auf zweiter Insel zählt', () => {
    const w = twoIslandWorld();
    const h = putBuilding(w, 1, 'house', 2, 2);
    setHouse(h, 2, 1);
    step(w);
    expect(w.council[2]).toBe('open');
  });

  it('openCouncilTiers: aufsteigend nach Stufe', () => {
    const { w } = houseWorld(3);
    step(w);
    expect(openCouncilTiers(w)).toEqual([2, 3]);
    decree(w, 2, 'A');
    expect(openCouncilTiers(w)).toEqual([3]);
  });
});

describe('AK-3 nie zurück auf null', () => {
  it('Abriss schliesst nicht, Abstieg ändert Beschluss nicht', () => {
    const { w, id } = houseWorld(2);
    step(w);
    expect(demolish(w, id).ok).toBe(true);
    step(w);
    expect(w.council[2]).toBe('open');
    expect(decree(w, 2, 'A').ok).toBe(true);
    const { w: w2, id: id2 } = houseWorld(2);
    step(w2);
    decree(w2, 2, 'A');
    setHouse(w2.buildings[id2]!, 1, 1);
    step(w2);
    expect(w2.council[2]).toBe('A');
  });
});

describe('AK-4 decree', () => {
  it('beschliesst einmal, zweiter Versuch scheitert', () => {
    const { w } = houseWorld(2);
    step(w);
    expect(decree(w, 2, 'A')).toEqual({ ok: true });
    expect(w.council[2]).toBe('A');
    expect(decree(w, 2, 'B')).toEqual({ ok: false, reason: 'Schon beschlossen' });
    expect(w.council[2]).toBe('A');
  });

  it('ungültige Eingaben: ok false, wirft nie', () => {
    const { w } = houseWorld(2);
    step(w);
    for (const t of [1, 5, '2', NaN]) expect(() => decree(w, t, 'A')).not.toThrow();
    for (const t of [1, 5, '2', NaN])
      expect(decree(w, t, 'A')).toEqual({ ok: false, reason: 'Ungültige Stufe' });
    for (const s of ['C', undefined, null]) {
      expect(() => decree(w, 2, s)).not.toThrow();
      expect(decree(w, 2, s)).toEqual({ ok: false, reason: 'Ungültige Seite' });
    }
    expect(w.council[2]).toBe('open');
  });
});
