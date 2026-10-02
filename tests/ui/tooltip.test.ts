import { describe, expect, it } from 'vitest';
import { BUILDING_IDS } from '../../src/sim/defs/buildings';
import { TIERS } from '../../src/sim/defs/tiers';
import {
  crisisTooltipLines,
  tierPreviewLine,
  tooltipLines,
  unprotectedLine,
} from '../../src/ui/buildMenu';

describe('tooltipLines (AK-U2-01)', () => {
  it('AK-U2-01: Holzfäller zeigt Taste, Kosten, Unterhalt, Erzeugung und Standort', () => {
    const lines = tooltipLines({ kind: 'build', defId: 'lumberjack' });
    expect(lines[0]).toBe('Holzfäller (L)');
    expect(lines).toContain('Kosten: 50 Geld · 1 Werkzeug');
    expect(lines).toContain('Unterhalt: 30 / min');
    expect(lines).toContain('Erzeugt: Holz 20 / min');
    expect(lines).toContain('Standort: Wald im Radius 2');
  });

  it('AK-U2-01: Weberei nennt den Input, Kapelle den Wirkungsradius', () => {
    const weaver = tooltipLines({ kind: 'build', defId: 'weaver' });
    expect(weaver).toContain('Erzeugt: Stoff 12 / min');
    expect(weaver).toContain('Braucht: Wolle 12 / min');
    const chapel = tooltipLines({ kind: 'build', defId: 'chapel' });
    expect(chapel).toContain('Radius: 10');
  });

  it('AK-U2-01: Werkzeuge ohne Gebäudedefinition haben Name und Taste', () => {
    expect(tooltipLines({ kind: 'road' })[0]).toBe('Weg (R)');
    expect(tooltipLines({ kind: 'demolish' })[0]).toBe('Abriss (X)');
    expect(tooltipLines({ kind: 'select' })[0]).toBe('Auswahl (Esc)');
  });
});

describe('Krisen-Tooltip (M6-AK-U1-05)', () => {
  it('M6-AK-U1-05: Feuerwache zeigt E, Kosten, Unterhalt, Radius und Schutztext', () => {
    const l = tooltipLines({ kind: 'build', defId: 'firestation' });
    expect(l[0]).toBe('Feuerwache (E)');
    expect(l).toContain('Kosten: 150 Geld · 10 Holz · 2 Werkzeug');
    expect(l).toContain('Unterhalt: 60 / min');
    expect(l).toContain('Radius: 8');
    expect(l).toContain('Schützt brennbare Gebäude im Radius 8 vor Brand (muss angebunden sein)');
    expect(unprotectedLine(1)).toBe('Ungeschützt: 1 brennbare Gebäude');
  });
  it('M6-AK-U1-05: Brennerei brennbar, Fischerhütte auch sturmanfällig, Markt keins', () => {
    expect(crisisTooltipLines('distillery')).toEqual(['Brennbar']);
    expect(crisisTooltipLines('fisher')).toEqual([
      'Brennbar',
      'sturmanfällig (halbe Leistung im Sturm)',
    ]);
    expect(crisisTooltipLines('market')).toEqual([]);
  });
});

describe('M8 Tooltips (AK-U2-01)', () => {
  it('AK-U2-01 Glashütte und Badehaus wörtlich nach Spec 14.3; Hebel 40; Weberei wie vor M8', () => {
    expect(tooltipLines({ kind: 'build', defId: 'glassworks' })).toEqual([
      'Glashütte (O)',
      'Kosten: 300 Geld · 20 Holz · 6 Werkzeug · 10 Stein',
      'Unterhalt: 150 / min',
      'Erzeugt: Glas 12 / min',
      'Braucht: Stein 12 / min · Holz 12 / min',
      'Brennbar',
      'Standort: frei',
      'Für Kaufleute (Stufe 4)',
    ]);
    expect(tooltipLines({ kind: 'build', defId: 'bathhouse' })).toEqual([
      'Badehaus (J)',
      'Kosten: 500 Geld · 30 Holz · 10 Werkzeug · 20 Stein',
      'Unterhalt: 180 / min',
      'Dienst: Hygiene',
      'Radius: 10',
      'Brennbar',
      'Standort: frei',
      'Für Kaufleute (Stufe 4)',
    ]);
    try {
      TIERS[4].unlockCitizens = 40; // Änderung S11: keine Hebel-Variante mehr
      expect(tooltipLines({ kind: 'build', defId: 'glassworks' }).at(-1)).toBe(
        'Für Kaufleute (Stufe 4)',
      );
      expect(tierPreviewLine('bathhouse')).toBe('Für Kaufleute (Stufe 4)');
    } finally {
      TIERS[4].unlockCitizens = null;
    }
    expect(tooltipLines({ kind: 'build', defId: 'weaver' })).toContain('Braucht: Wolle 12 / min');
    for (const id of BUILDING_IDS.filter((x) => x !== 'glassworks' && x !== 'bathhouse'))
      expect(tierPreviewLine(id), id).toBeNull();
    for (const id of BUILDING_IDS)
      for (const line of tooltipLines({ kind: 'build', defId: id }))
        expect(line).not.toContain('Tick');
  });
});
