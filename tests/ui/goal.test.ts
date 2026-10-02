import { describe, expect, it } from 'vitest';
import { WIN_CITIZENS, WIN_MERCHANTS } from '../../src/sim/defs/tiers';
import { goalView, type GoalView } from '../../src/sim/queries';
import { createWorld } from '../../src/sim/world';
import {
  FIRST_GOAL_BANNER,
  SECOND_GOAL_BANNER,
  goalBanners,
  goalTexts,
  UNLOCK_NOTICE,
  initialGoalShown,
  initialUnlockShown,
  lockedToolText,
  unlockNotice,
} from '../../src/ui/goal';
import { diffSoundEvents, soundSnapshot } from '../../src/ui/soundEvents';

const citizensView = (current: number, unlockCitizens: number | null): GoalView => ({
  phase: 'citizens',
  current,
  target: WIN_CITIZENS,
  next: { tierName: 'Kaufleute', target: WIN_MERCHANTS, unlockCitizens },
});
const merchantsView: GoalView = { phase: 'merchants', current: 15, target: WIN_MERCHANTS };
const doneView: GoalView = { phase: 'done', current: 60, target: WIN_MERCHANTS };

describe('M8 U1 Zielanzeige (Spec 14.1)', () => {
  it('AK-U1-01 Phase citizens: Texte wörtlich wie Tabelle 14.1, fillPct 90 bei 45 / 50', () => {
    expect(goalTexts(citizensView(45, null))).toEqual({
      chip: 'Ziel 45 / 50 Bürger',
      title:
        'Ziel: 50 Bürger — Einwohner der Stufe 3 und höher · Danach: Kaufleute — Handelsstadt 60',
      rest: '45 / 50 Bürger',
      next: 'Danach: Kaufleute — Handelsstadt 60',
      fillPct: 90,
    });
  });

  it('AK-U1-01 Phase citizens mit Hebel 40', () => {
    expect(goalTexts(citizensView(45, 40))).toEqual({
      chip: 'Ziel 45 / 50 Bürger',
      title:
        'Ziel: 50 Bürger — Einwohner der Stufe 3 und höher · Danach: Kaufleute ab 40 Bürgern — Handelsstadt 60',
      rest: '45 / 50 Bürger',
      next: 'Danach: Kaufleute ab 40 Bürgern — Handelsstadt 60',
      fillPct: 90,
    });
  });

  it('AK-U1-01 Phase merchants: 15 / 60, next null, fillPct 25', () => {
    expect(goalTexts(merchantsView)).toEqual({
      chip: 'Ziel 15 / 60 Kaufleute',
      title: 'Zweites Ziel: 60 Kaufleute — Einwohner der Stufe 4',
      rest: '15 / 60 Kaufleute',
      next: null,
      fillPct: 25,
    });
  });

  it('AK-U1-01 Phase done: Handelsstadt, next null, fillPct 100', () => {
    expect(goalTexts(doneView)).toEqual({
      chip: 'Handelsstadt · 60 Kaufleute',
      title: 'Beide Ziele erreicht — freies Spiel',
      rest: 'Handelsstadt erreicht · 60 Kaufleute',
      next: null,
      fillPct: 100,
    });
  });

  it('AK-U1-01 kein Text enthält „Tick"; Ausblick ab Tick 0 über goalView', () => {
    const views = [citizensView(45, null), citizensView(45, 40), merchantsView, doneView];
    for (const v of views) {
      const t = goalTexts(v);
      for (const s of [t.chip, t.title, t.rest, t.next ?? '']) expect(s, s).not.toMatch(/Tick/);
    }
    const start = goalTexts(goalView(createWorld(3)));
    expect(start.chip).toBe('Ziel 0 / 50 Bürger');
    expect(start.next).toBe('Danach: Kaufleute — Handelsstadt 60');
  });
});

describe('M8 U1 Banner (Spec 14.1, Review Focus 4)', () => {
  it('RF-4 beide Ziele im selben Frame: zwei Banner in Reihenfolge, genau ein Ton win, nach Laden keiner', () => {
    const before = createWorld(3);
    const shown = initialGoalShown(before);
    const prevSnap = soundSnapshot(before);
    const w = createWorld(3);
    w.won = true;
    w.wonMerchants = true;
    const r = goalBanners(shown, w);
    expect(r.texts).toEqual([FIRST_GOAL_BANNER, SECOND_GOAL_BANNER]);
    expect(FIRST_GOAL_BANNER).toBe('Ziel erreicht: 50 Bürger! Das Spiel läuft weiter.');
    expect(SECOND_GOAL_BANNER).toBe('Zweites Ziel erreicht: 60 Kaufleute! Das Spiel läuft weiter.');
    expect(r.shown).toEqual({ wonShown: true, wonMerchantsShown: true });
    expect(goalBanners(r.shown, w).texts).toEqual([]);
    expect(diffSoundEvents(prevSnap, soundSnapshot(w)).filter((e) => e === 'win')).toEqual(['win']);
    // Laden: der geladene Stand ist Basis für Merkfelder und Ton
    expect(goalBanners(initialGoalShown(w), w).texts).toEqual([]);
    expect(diffSoundEvents(soundSnapshot(w), soundSnapshot(w))).toEqual([]);
  });

  it('RF-4 zweites Ziel allein nach gezeigtem ersten: nur das zweite Banner, danach keines', () => {
    const w = createWorld(3);
    w.won = true;
    const shown = initialGoalShown(w);
    expect(shown).toEqual({ wonShown: true, wonMerchantsShown: false });
    w.wonMerchants = true;
    const r = goalBanners(shown, w);
    expect(r.texts).toEqual([SECOND_GOAL_BANNER]);
    expect(goalBanners(r.shown, w).texts).toEqual([]);
  });
});

describe('M8 U1 Freischaltung (Änderung S11)', () => {
  it('AK-U1-09 lockedToolText: gesperrt mit Grund, frei oder ohne unlockTier null', () => {
    const w = createWorld(3);
    expect(lockedToolText(w, 'bathhouse')).toBe('Badehaus: Erst nach dem Ziel (50 Bürger)');
    expect(lockedToolText(w, 'glassworks')).toBe('Glashütte: Erst nach dem Ziel (50 Bürger)');
    expect(lockedToolText(w, 'house')).toBeNull();
    w.won = true;
    expect(lockedToolText(w, 'bathhouse')).toBeNull();
    expect(lockedToolText(w, 'glassworks')).toBeNull();
  });
  it('AK-U1-09 unlockNotice nur beim Wechsel gesperrt → frei; kein Text mit „Tick"', () => {
    const w = createWorld(3);
    expect(unlockNotice(true, w)).toBeNull();
    expect(unlockNotice(false, w)).toBeNull();
    w.won = true;
    expect(unlockNotice(true, w)).toBe(
      'Neu freigeschaltet: Badehaus (J) und Glashütte (O) — deine Bürger wollen Kaufleute werden',
    );
    expect(unlockNotice(false, w)).toBeNull();
    expect(UNLOCK_NOTICE).not.toContain('Tick');
  });
  it('AK-U1-09 geladener Stand mit freier Stufe: Merkfeld gesetzt, keine Freischalt-Meldung (Spec 4.3 Punkt 5, R152 B1)', () => {
    const w = createWorld(3);
    expect(initialUnlockShown(w)).toBe(false); // gesperrt: Meldung kommt später genau einmal
    w.won = true; // wie m8-kurz-vor-handelsstadt nach dem Laden
    expect(initialUnlockShown(w)).toBe(true);
    expect(unlockNotice(!initialUnlockShown(w), w)).toBeNull();
  });
});
