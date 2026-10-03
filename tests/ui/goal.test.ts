import { describe, expect, it } from 'vitest';
import { deriveUnlocks } from '../../src/sim/unlocks';
import { WIN_CITIZENS, WIN_MERCHANTS } from '../../src/sim/defs/tiers';
import { goalView, type GoalView } from '../../src/sim/queries';
import { createWorld } from '../../src/sim/world';
import type { CrisisLevel, UnlockId } from '../../src/sim/types';
import type { Tool } from '../../src/render/renderer';
import {
  FIRST_GOAL_BANNER,
  SECOND_GOAL_BANNER,
  goalBanners,
  goalTexts,
  UNLOCK_NOTICE,
  initialGoalShown,
  frameUnlock,
  lockedToolText,
  unlockNoticeText,
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
    w.unlocked = deriveUnlocks(w);
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
    w.unlocked = deriveUnlocks(w);
    const shown = initialGoalShown(w);
    expect(shown).toEqual({ wonShown: true, wonMerchantsShown: false });
    w.wonMerchants = true;
    const r = goalBanners(shown, w);
    expect(r.texts).toEqual([SECOND_GOAL_BANNER]);
    expect(goalBanners(r.shown, w).texts).toEqual([]);
  });
});

describe('M8 U1 Freischaltung (Änderung S11)', () => {
  it('AK-U1-09 lockedToolText: gesperrt mit Grund, frei oder ohne Sperre null', () => {
    const w = createWorld(3);
    const tool = (defId: 'bathhouse' | 'glassworks' | 'house'): Tool => ({ kind: 'build', defId });
    expect(lockedToolText(w, tool('bathhouse'))).toBe('Badehaus: Erst nach dem Ziel (50 Bürger)');
    expect(lockedToolText(w, tool('glassworks'))).toBe('Glashütte: Erst nach dem Ziel (50 Bürger)');
    expect(lockedToolText(w, tool('house'))).toBeNull();
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    expect(lockedToolText(w, tool('bathhouse'))).toBeNull();
    expect(lockedToolText(w, tool('glassworks'))).toBeNull();
  });
  it('AK-U1-09 unlockNoticeText nur beim Wechsel gesperrt → frei; kein Text mit „Tick"', () => {
    const w = createWorld(3);
    const before = [...w.unlocked];
    expect(unlockNoticeText(before, w)).toBeNull();
    w.won = true;
    w.unlocked = deriveUnlocks(w);
    expect(unlockNoticeText(['U0', 'U2', 'U3', 'U4', 'U5'], w)).toBe(
      'Neu freigeschaltet: Badehaus (J) und Glashütte (O) — deine Bürger wollen Kaufleute werden',
    );
    expect(unlockNoticeText(w.unlocked, w)).toBeNull();
    expect(UNLOCK_NOTICE).not.toContain('Tick');
  });
  it('AK-U1-09 geladener Stand mit freier Stufe: Basis = geladener Stand, keine Freischalt-Meldung (Spec 4.3 Punkt 5, R152 B1)', () => {
    const w = createWorld(3);
    w.won = true; // wie m8-kurz-vor-handelsstadt nach dem Laden
    w.unlocked = deriveUnlocks(w);
    expect(frameUnlock([...w.unlocked], w).text).toBeNull();
  });
});

describe('M10 Freischalt-Meldung und gesperrte Werkzeuge (Spec 11.2, 11.6)', () => {
  const w = (ids: UnlockId[], crisisLevel: CrisisLevel = 'normal') => {
    const x = createWorld(3, { crisisLevel });
    x.unlocked = ids;
    return x;
  };
  const tail = '. Mehr unter Hilfe (?)';
  it('AK-U1-08 (M11 S2) Texte je Eintrag wörtlich, Kombination, nur U6 = M8-Text, gleich → null, kein „Tick" (M11 S10)', () => {
    const t = (prev: UnlockId[], now: UnlockId[], c: CrisisLevel = 'normal') =>
      unlockNoticeText(prev, w(now, c));
    expect(t(['U0'], ['U0', 'U2'])).toBe(
      `Neu: Jagdhütte (Y), Steinbruch (B), Schäferei (G), Weberei (V), Kapelle (K), Feuerwache (E), Roden (C), Aufforsten (Q) — deine Pioniere wollen Siedler werden${tail}`,
    );
    expect(t(['U0'], ['U0', 'U2'], 'off')).toBe(
      `Neu: Jagdhütte (Y), Steinbruch (B), Schäferei (G), Weberei (V), Kapelle (K), Roden (C), Aufforsten (Q) — deine Pioniere wollen Siedler werden${tail}`,
    );
    expect(t(['U0'], ['U0', 'U1'])).toBe(
      `Neu: Marktplatz (M) — deine Siedlung wächst über das Kontor hinaus${tail}`,
    );
    expect(t(['U0', 'U2'], ['U0', 'U2', 'U3'])).toBe(
      `Neu: Rinderfarm, Amtsstube (I), Handelsaufträge, Ausbau Stufe 2 — die ersten Siedler sind da${tail}`,
    );
    expect(t(['U0', 'U2', 'U3'], ['U0', 'U2', 'U3', 'U4'])).toBe(
      `Neu: Zuckerrohrplantage (Z), Brennerei (N), Schule (U) — deine Siedler wollen Bürger werden${tail}`,
    );
    expect(t(['U0', 'U2', 'U3', 'U4'], ['U0', 'U2', 'U3', 'U4', 'U5'])).toBe(
      `Neu: Werkzeugmacher (T), Ausgabesperre, Ausbau Stufe 3 — die ersten Bürger sind da${tail}`,
    );
    expect(t(['U0', 'U2', 'U3', 'U4', 'U5'], ['U0', 'U2', 'U3', 'U4', 'U5', 'U6'])).toBe(
      UNLOCK_NOTICE,
    );
    expect(UNLOCK_NOTICE).toBe(
      'Neu freigeschaltet: Badehaus (J) und Glashütte (O) — deine Bürger wollen Kaufleute werden',
    );
    expect(t(['U0'], ['U0', 'U2', 'U3'])).toBe(
      `Neu: Jagdhütte (Y), Steinbruch (B), Schäferei (G), Weberei (V), Kapelle (K), Feuerwache (E), Roden (C), Aufforsten (Q), Rinderfarm, Amtsstube (I), Handelsaufträge, Ausbau Stufe 2 — die ersten Siedler sind da${tail}`,
    );
    expect(t(['U0', 'U2'], ['U0', 'U2'])).toBeNull();
    for (const s of [t(['U0'], ['U0', 'U1', 'U2', 'U3', 'U4', 'U5', 'U6'])])
      expect(s).not.toMatch(/Tick/);
  });
  it('AK-U1-02 lockedToolText: Grund in neuer Welt; Feuerwache bei Krisen off; freie Werkzeuge null', () => {
    expect(lockedToolText(w(['U0']), { kind: 'build', defId: 'chapel' })).toBe(
      'Kapelle: Erst wenn ein Wohnhaus 4 Pioniere hat',
    );
    const off = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    expect(lockedToolText(off, { kind: 'build', defId: 'firestation' })).toBe(
      'Feuerwache: ohne Krisen nicht nötig',
    );
    for (const tool of [
      { kind: 'road' },
      { kind: 'demolish' },
      { kind: 'select' },
      { kind: 'build', defId: 'house' },
    ] as Tool[])
      expect(lockedToolText(w(['U0']), tool)).toBeNull();
  });
  it('RF-4 zwei Freischaltungen in verschiedenen Ticks eines Frames → eine Meldung mit beiden, Basis = Frame-Anfang', () => {
    const x = w(['U0']);
    const seen: UnlockId[] = [...x.unlocked];
    x.unlocked = ['U0', 'U2']; // Tick 1 des Frames
    x.unlocked = ['U0', 'U2', 'U3']; // Tick 2 des Frames
    const r = frameUnlock(seen, x);
    expect(r.text).toBe(unlockNoticeText(['U0'], x));
    expect(r.seen).toEqual(['U0', 'U2', 'U3']);
    expect(frameUnlock(r.seen, x).text).toBeNull();
    const a = soundSnapshot(w(['U0']));
    expect(diffSoundEvents(a, soundSnapshot(x)).filter((e) => e === 'unlock')).toHaveLength(1);
  });
});

describe('M11 Freischalt-Meldungen (Spec 4)', () => {
  const at = (ids: UnlockId[]) =>
    Object.assign(createWorld(3, { crisisLevel: 'normal' }), { unlocked: ids });
  const tail = '. Mehr unter Hilfe (?)';
  it('AK-UI-09 U3 nennt Rinderfarm und Ausbau Stufe 2, U5 Ausbau Stufe 3; U2 mit Jagdhütte (Y); kein „null", kein „Tick"', () => {
    const u2 = unlockNoticeText(['U0'], at(['U0', 'U2']))!;
    const u3 = unlockNoticeText(['U0', 'U2'], at(['U0', 'U2', 'U3']))!;
    const u5 = unlockNoticeText(['U0', 'U2', 'U3', 'U4'], at(['U0', 'U2', 'U3', 'U4', 'U5']))!;
    expect(u2).toBe(
      `Neu: Jagdhütte (Y), Steinbruch (B), Schäferei (G), Weberei (V), Kapelle (K), Feuerwache (E), Roden (C), Aufforsten (Q) — deine Pioniere wollen Siedler werden${tail}`,
    );
    expect(u3).toBe(
      `Neu: Rinderfarm, Amtsstube (I), Handelsaufträge, Ausbau Stufe 2 — die ersten Siedler sind da${tail}`,
    );
    expect(u5).toBe(
      `Neu: Werkzeugmacher (T), Ausgabesperre, Ausbau Stufe 3 — die ersten Bürger sind da${tail}`,
    );
    for (const s of [u2, u3, u5]) expect(s).not.toMatch(/null|Tick/);
  });
});
