// I-112 T02: Rat-Defs und Weltfeld (AK-1 Weltteil, AK-10).
import { describe, expect, it } from 'vitest';
import {
  COUNCIL,
  COUNCIL_NOTE,
  COUNCIL_OPEN_MESSAGE,
  COUNCIL_TIERS,
} from '../../src/sim/defs/council';
import { createWorld } from '../../src/sim/world';

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
