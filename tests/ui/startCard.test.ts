import { describe, expect, it } from 'vitest';
import { TICK_MS } from '../../src/sim/defs/timing';
import { UNLOCKS } from '../../src/sim/defs/unlocks';
import type { CrisisLevel } from '../../src/sim/types';
import { createWorld } from '../../src/sim/world';
import { nextStep } from '../../src/ui/guide';
import { placeTownhall, setHouse, village } from '../sim/helpers';
import { nameSegments } from '../../src/ui/messages';
import {
  STORAGE_NOTES,
  helpSections,
  startChoices,
  startDismissAction,
  startGoal,
  startSteps,
} from '../../src/ui/startCard';

const t = (s: number): number => (s * 1000) / TICK_MS;

describe('Startkarte (AK-UX-01)', () => {
  it('AK-UX-01 ohne Spielstand nur „Los geht\'s"', () => {
    expect(startChoices([], 'none')).toEqual({
      choices: [{ kind: 'new', label: "Los geht's", primary: true }],
      note: null,
    });
  });
  it('AK-UX-01 Reihenfolge auto, manual, neu; Autosave ist primär', () => {
    const r = startChoices(
      [
        { slot: 'manual', tick: t(270) },
        { slot: 'auto', tick: t(300) },
      ],
      'none',
    );
    expect(r.choices.map((c) => c.label)).toEqual([
      'Fortsetzen — Autosave (Spielzeit 5:00)',
      'Gespeichertes Spiel laden (Spielzeit 4:30)',
      'Neue Insel',
    ]);
    expect(r.choices.map((c) => c.primary)).toEqual([true, false, false]);
  });
  it('AK-UX-01 nur manual → manual primär', () => {
    const r = startChoices([{ slot: 'manual', tick: t(10) }], 'none');
    expect(r.choices[0]).toMatchObject({ kind: 'load', slot: 'manual', primary: true });
  });
  it('AK-UX-01 Hinweise „beschädigt" und „nicht verfügbar" sind verschieden', () => {
    expect(startChoices([], 'damaged').note).toBe(STORAGE_NOTES.damaged);
    expect(startChoices([], 'unavailable').note).toBe(STORAGE_NOTES.unavailable);
    expect(STORAGE_NOTES.damaged).not.toBe(STORAGE_NOTES.unavailable);
  });
  it('Ziel und drei Schritte aus defs und Hotkeys (Spec L1)', () => {
    expect(startGoal()).toBe('Ziel: 50 Bürger auf deiner Insel');
    expect(startSteps()).toEqual([
      '1 Wohnhaus (H) nahe dem Kontor bauen — dort ziehen Pioniere ein',
      '2 Fischerhütte (F) am Wasser und Holzfäller (L) am Wald bauen',
      '3 Betriebe mit einem Weg (R) zum Kontor verbinden — Wohnhäuser brauchen keinen Weg',
    ]);
  });
});

describe('Startkarte Esc (Spec L1)', () => {
  it('L1 Esc bei offener Bestätigung bricht ab, sonst primärer Knopf', () => {
    expect(startDismissAction(true)).toBe('cancel');
    expect(startDismissAction(false)).toBe('primary');
  });
});

describe('M10 Hilfe-Karte (Spec 12.1)', () => {
  const pioneers = (crisisLevel: CrisisLevel = 'normal') => {
    const { w, houses } = village(4, { crisisLevel }); // tests/sim/helpers.ts
    [3, 2, 1, 1].forEach((n, i) => setHouse(houses[i]!, 1, n));
    return { w, houses };
  };
  it('AK-U2-01 Abschnitte, Als Nächstes, Tipps, Erste Schritte, Alles frei, taxBlocks', () => {
    const { w, houses } = pioneers();
    const s = helpSections(w);
    expect(s.map((x) => x.field)).toEqual([
      'help-now',
      'help-next',
      'help-goal',
      'help-tips',
      'help-signs',
      'help-steps',
    ]);
    expect(s[0]!.lines).toEqual([nextStep(w)]);
    expect(s[1]!.lines).toEqual([
      'Marktplatz — sobald 20 Wohnhäuser stehen (jetzt 4 / 20)',
      'Steinbruch, Schäferei, Weberei, Kapelle, Feuerwache, Roden, Aufforsten — sobald ein Wohnhaus 4 Pioniere hat (jetzt 3 / 4)',
    ]);
    expect(s[3]!.lines[0]).toBe(UNLOCKS[0]!.tip);
    expect(s[5]!.lines).toEqual(startSteps());
    setHouse(houses[0]!, 2, 1);
    expect(helpSections(w).map((x) => x.field)).not.toContain('help-steps');
    expect(
      helpSections(createWorld(3, { unlockAll: true })).find((x) => x.field === 'help-next')!.lines,
    ).toEqual(['Alles freigeschaltet']);
    const t = createWorld(3, { crisisLevel: 'normal' });
    t.unlocked = ['U0', 'U2', 'U3'];
    placeTownhall(t);
    t.taxLevel = 'high';
    const next = helpSections(t).find((x) => x.field === 'help-next')!.lines;
    expect(
      next
        .find((l) => l.startsWith('Zuckerrohrplantage'))!
        .endsWith(" · Steuer ‚hoch' verhindert volle Häuser"),
    ).toBe(true);
  });
});

describe('M10 Symbole im Einbau (Spec 14)', () => {
  it('AK-U4-01 Meldung und Hilfe: Symbol vor Gebäude- und Gutnamen, Text unverändert', () => {
    const text = 'Neu: Steinbruch (Q), Kapelle — Holz und Stein knapp. Glashütte';
    const segs = nameSegments(text);
    expect(segs.map((s) => s.text).join('')).toBe(text);
    const icons = segs.filter((s) => s.icon !== undefined);
    expect(icons.map((s) => [s.text, s.icon])).toEqual([
      ['Steinbruch', 'cat-production'],
      ['Kapelle', 'cat-public'],
      ['Holz', 'wood'],
      ['Stein', 'stone'],
      ['Glashütte', 'cat-production'],
    ]);
  });
  it('AK-U4-01 Teilwörter bekommen kein Symbol; Text ohne Namen bleibt ein Stück', () => {
    expect(nameSegments('Holzweg Steine')).toEqual([{ text: 'Holzweg Steine' }]);
    expect(nameSegments('')).toEqual([]);
  });
});
