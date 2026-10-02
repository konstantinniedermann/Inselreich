import { describe, expect, it } from 'vitest';
import { crisisTooltipLines, tooltipLines, unprotectedLine } from '../../src/ui/buildMenu';

describe('tooltipLines (AK-U2-01)', () => {
  it('AK-U2-01: Holzfäller zeigt Taste, Kosten, Unterhalt, Erzeugung und Standort', () => {
    const lines = tooltipLines({ kind: 'build', defId: 'lumberjack' });
    expect(lines[0]).toBe('Holzfäller (L)');
    expect(lines).toContain('Kosten: 50 Geld · 1 Werkzeug');
    expect(lines).toContain('Unterhalt: 5 je 100 Ticks');
    expect(lines).toContain('Erzeugt: Holz 3.3 je 100 Ticks');
    expect(lines).toContain('Standort: Wald im Radius 2');
  });

  it('AK-U2-01: Weberei nennt den Input, Kapelle den Wirkungsradius', () => {
    const weaver = tooltipLines({ kind: 'build', defId: 'weaver' });
    expect(weaver).toContain('Erzeugt: Stoff 2 je 100 Ticks');
    expect(weaver).toContain('Braucht: Wolle 2 je 100 Ticks');
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
    expect(l).toContain('Unterhalt: 10 je 100 Ticks');
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
