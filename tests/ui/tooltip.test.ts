import { describe, expect, it } from 'vitest';
import { deriveUnlocks } from '../../src/sim/unlocks';
import { BUILDING_IDS } from '../../src/sim/defs/buildings';
import { TIERS } from '../../src/sim/defs/tiers';
import { createWorld } from '../../src/sim/world';
import type { CrisisLevel, UnlockId, World } from '../../src/sim/types';
import { REASON_TABLE, friendlyReason, placementHint } from '../../src/ui/hints';
import { forceRect } from '../sim/helpers';
import {
  CATEGORIES,
  buildEntries,
  visibleCategories,
  crisisTooltipLines,
  newBuildEntries,
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
  it('AK-U2-01 Glashütte und Badehaus wörtlich nach Spec 14.3; Hebel 40; Weberei wie vor M8 (M11 Ausstoss je Stufe)', () => {
    expect(tooltipLines({ kind: 'build', defId: 'glassworks' })).toEqual([
      'Glashütte (O)',
      'Kosten: 300 Geld · 20 Holz · 6 Werkzeug · 10 Stein',
      'Unterhalt: 150 / min',
      'Erzeugt: Glas 12 / min',
      'Ausstoss je Stufe: 12 · 20 · 30 / min',
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

describe('M8 Bauleiste (Änderung S11)', () => {
  it('Spec M8 14.2 (M11 S2) Glashütte und Badehaus erst ab der Freischaltung (Vorprüfung AK-U2-06, AK-U2-10)', () => {
    const w = createWorld(3, { crisisLevel: 'normal', unlockAll: true });
    w.unlocked = ['U0', 'U1', 'U2', 'U3', 'U4', 'U5']; // alles ausser U6, wie M8 vor dem Ziel
    expect(buildEntries(w, 'production')).toHaveLength(10);
    expect(buildEntries(w, 'production')).not.toContain('glassworks');
    expect(buildEntries(w, 'public')).toHaveLength(4); // M10: + Amtsstube (U3)
    expect(buildEntries(w, 'public')).not.toContain('bathhouse');
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    expect(buildEntries(w, 'production')).toHaveLength(11);
    expect(buildEntries(w, 'production')).toContain('glassworks');
    expect(buildEntries(w, 'public')).toHaveLength(5);
    expect(buildEntries(w, 'public')).toContain('bathhouse');
  });
});

describe('M10 Bauleiste nach Freischaltung (Spec 11.1)', () => {
  const count = (w: World) =>
    Object.fromEntries(CATEGORIES.map((c) => [c.id, buildEntries(w, c.id).length]));
  const at = (ids: UnlockId[], crisisLevel: CrisisLevel = 'normal') => {
    const w = createWorld(3, { crisisLevel });
    w.unlocked = ids;
    return w;
  };
  it('AK-U1-01 (M11 S2) Zählung je Stand (Krisen normal und off), leere Kategorien verborgen', () => {
    expect(count(at(['U0']))).toEqual({ infrastructure: 0, housing: 1, production: 2, public: 0 });
    expect(visibleCategories(at(['U0']))).toEqual(['housing', 'production']);
    expect(buildEntries(at(['U0']), 'production')).toEqual(['fisher', 'lumberjack']);
    expect(count(at(['U0', 'U2']))).toEqual({
      infrastructure: 0,
      housing: 1,
      production: 6,
      public: 2,
    });
    expect(count(at(['U0', 'U2'], 'off')).public).toBe(1);
    expect(count(at(['U0', 'U2', 'U3'])).public).toBe(3);
    expect(count(at(['U0', 'U2', 'U3'])).production).toBe(7);
    expect(count(at(['U0', 'U2', 'U3', 'U4']))).toMatchObject({ production: 9, public: 4 });
    expect(count(at(['U0', 'U2', 'U3', 'U4', 'U5'])).production).toBe(10);
    expect(count(at(['U0', 'U2', 'U3', 'U4', 'U5', 'U6']))).toMatchObject({
      production: 11,
      public: 5,
    });
    expect(count(at(['U0', 'U1'])).infrastructure).toBe(1);
    expect(count(createWorld(3, { crisisLevel: 'normal', unlockAll: true }))).toEqual({
      infrastructure: 1,
      housing: 1,
      production: 11,
      public: 5,
    });
    expect(count(createWorld(3, { crisisLevel: 'off', unlockAll: true })).public).toBe(4);
  });
});

describe('M10 Forst-Werkzeuge, Tooltips, Gründe (Spec 11.9)', () => {
  it('AK-U2-07 placementHint und tooltipLines', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    forceRect(w, k.x + 6, k.y + 2, 1, 1, 'forest');
    forceRect(w, k.x + 7, k.y + 2, 1, 1, 'grass');
    expect(placementHint(w, { kind: 'clearForest' }, k.x + 6, k.y + 2)).toMatchObject({
      tone: 'ok',
      text: 'Roden: 10 Geld',
    });
    expect(placementHint(w, { kind: 'clearForest' }, k.x + 7, k.y + 2)).toMatchObject({
      tone: 'bad',
      text: 'Hier ist kein Wald',
    });
    expect(placementHint(w, { kind: 'plantForest' }, k.x + 6, k.y + 2)).toMatchObject({
      tone: 'bad',
      text: 'Aufforsten geht nur auf Weide',
    });
    expect(tooltipLines({ kind: 'build', defId: 'townhall' })).toEqual([
      'Amtsstube (I)',
      'Kosten: 200 Geld · 15 Holz · 2 Werkzeug · 5 Stein',
      'Unterhalt: 120 / min',
      'Steuer und Ausgabesperre einstellen',
      'Brennbar',
      'Standort: frei',
      'Höchstens eine Amtsstube',
    ]);
    expect(tooltipLines({ kind: 'clearForest' })).toEqual([
      'Roden (C)',
      'Kosten: 10 Geld',
      'Wald wird Weide — kein Holz',
      'Nur auf unbebautem Wald',
    ]);
    expect(tooltipLines({ kind: 'plantForest' })).toEqual([
      'Aufforsten (Q)',
      'Kosten: 20 Geld',
      'Weide wird Wald',
      'Nur auf unbebauter Weide',
    ]);
  });
  it('AK-U2-10 friendlyReason je Zeile 11.9; Vollständigkeitsprüfung grün', () => {
    const w = createWorld(3);
    const rows: [string, string][] = [
      ['Es gibt schon eine Amtsstube', 'Es gibt schon eine Amtsstube — höchstens eine wirkt'],
      ['Braucht eine Amtsstube', 'Baue zuerst eine Amtsstube (I)'],
      ['Amtsstube wirkt nicht', 'Die Amtsstube wirkt erst mit Weg und ohne Brand'],
      ['Kein Wald', 'Hier ist kein Wald'],
      ['Keine Weide', 'Aufforsten geht nur auf Weide'],
      ['Erst ab 20 Wohnhäusern', 'Erst ab 20 Wohnhäusern'],
      ['Erst wenn ein Wohnhaus 4 Pioniere hat', 'Erst wenn ein Wohnhaus 4 Pioniere hat'],
      ['Erst mit den ersten Siedlern', 'Erst mit den ersten Siedlern'],
      ['Erst wenn ein Wohnhaus 8 Siedler hat', 'Erst wenn ein Wohnhaus 8 Siedler hat'],
      ['Erst mit den ersten Bürgern', 'Erst mit den ersten Bürgern'],
      ['Stoff für Siedler gesperrt', 'Stoff für Siedler gesperrt'],
      ['Aufstieg in der Amtsstube angehalten', 'Aufstieg in der Amtsstube angehalten'],
      ['Ungültige Sperre', 'Ungültige Sperre'],
      ['Erst nach dem Ziel', 'Erst nach dem Ziel (50 Bürger)'],
    ];
    for (const [r, t] of rows) {
      expect(friendlyReason(w, r), r).toBe(t);
      expect(
        REASON_TABLE.some((row) => row.pattern.test(r)),
        `Tabellenzeile für ${r}`,
      ).toBe(true);
    }
  });
});

describe('M10 Symbole im Einbau (Spec 14)', () => {
  it('AK-U4-04 (M11 S2) (K2) neue Einträge nach U2 tragen „neu" bis zur ersten Wahl; nach Laden keine', () => {
    const w = createWorld(3, { crisisLevel: 'normal' });
    const prev = [...w.unlocked];
    w.unlocked = ['U0', 'U2'];
    const fresh = newBuildEntries(prev, w);
    expect([...fresh]).toEqual([
      'hunter',
      'quarry',
      'sheepfarm',
      'weaver',
      'chapel',
      'firestation',
    ]);
    fresh.delete('chapel'); // erste Wahl
    expect(fresh.has('chapel')).toBe(false);
    expect(newBuildEntries(w.unlocked, w).size).toBe(0); // Laden: Basis = geladener Stand
  });
});

describe('M11 Bauleisten-Tooltip (Spec 7)', () => {
  it('AK-UI-06 Tooltip: „Erzeugt" bleibt Stufe 1, darunter Ausstoss je Stufe; Kapelle ohne', () => {
    const t = tooltipLines({ kind: 'build', defId: 'fisher' });
    const i = t.indexOf('Erzeugt: Nahrung 15 / min');
    expect(i).toBeGreaterThan(0);
    expect(t[i + 1]).toBe('Ausstoss je Stufe: 15 · 25 · 37.5 / min');
    expect(tooltipLines({ kind: 'build', defId: 'hunter' })).toContain(
      'Ausstoss je Stufe: 12 · 20 · 30 / min',
    );
    expect(
      tooltipLines({ kind: 'build', defId: 'chapel' }).some((l) => l.startsWith('Ausstoss')),
    ).toBe(false);
  });
});
