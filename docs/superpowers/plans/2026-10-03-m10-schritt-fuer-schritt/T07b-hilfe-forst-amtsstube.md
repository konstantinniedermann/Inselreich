> **Task-ID:** Task 7 (Paket M10-U2) — Teil 2 von 3
> **AK-IDs:** Vitest-Teile AK-U2-01, -02, -07, -10, -11, -12 (Browser-Teile in QA-U2), `RF-5`
> **blocked-by:** QA-U1 (OK), R1 (Review OK, gemergt), **M9 H-R3 und H-R4 auf `main`** (R159)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-08-abhaengigkeiten-extern.md](orga-08-abhaengigkeiten-extern.md)
> **Teile:** [T07a-hilfe-forst-amtsstube.md](T07a-hilfe-forst-amtsstube.md) · **T07b-hilfe-forst-amtsstube.md** (diese) · [T07c-hilfe-forst-amtsstube.md](T07c-hilfe-forst-amtsstube.md)

- [ ] **Schritt 1: Failing tests.**

```ts
// tests/ui/startCard.test.ts
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

// tests/ui/guide.test.ts
describe('M10 nextStep und remedyText mit Amtsstube (Spec 12.3)', () => {
  it('AK-U2-02 Kassen-Satz je Stand; gespeichertes hoch ohne Amtsstube ohne Steuer-Satz; Abhilfen', () => {
    const broke = (ids: UnlockId[], townhall: boolean) => {
      const { w } = village(1, { unlockAll: true });
      w.unlocked = ids;
      if (townhall) placeTownhall(w);
      w.money = -10;
      return nextStep(w);
    };
    expect(broke(['U0'], false)).toBe(
      'Deine Kasse schrumpft: versorge mehr Wohnhäuser oder verkaufe Waren am Kontor',
    );
    expect(broke(['U0', 'U2', 'U3'], false)).toBe(
      'Deine Kasse schrumpft: versorge mehr Wohnhäuser, verkaufe Waren am Kontor oder baue eine Amtsstube (I)',
    );
    expect(broke(['U0', 'U2', 'U3'], true)).toBe(
      'Deine Kasse schrumpft: versorge mehr Wohnhäuser, verkaufe Waren am Kontor oder erhöhe die Steuer',
    );
    const high = createWorld(3);
    high.taxLevel = 'high';
    expect(nextStep(high)).not.toMatch(/Steuer/);
    // Werkzeugmacher noService: Schule gesperrt (Stand AK-S1-14 c) bzw. frei
    const tm = toolmakerWorld(); // lokaler Helfer: angebundener Werkzeugmacher wie tests/sim/toolmaker.test.ts, 1 Schritt → noService
    tm.w.unlocked = ['U0', 'U5'];
    expect(remedyText(tm.w, tm.b)).toBe('Schule kommt, sobald ein Wohnhaus 8 Siedler hat');
    tm.w.unlocked = [...UNLOCK_IDS];
    expect(remedyText(tm.w, tm.b)).toBe('Baue eine Schule (U) in Reichweite');
    const lj = lumberjackFull(); // lokaler Helfer: Holzfäller im Zustand storageFull
    lj.w.unlocked = ['U0', 'U2', 'U3', 'U4'];
    expect(remedyText(lj.w, lj.b)).toBe('Verkaufe Holz am Kontor');
    lj.w.unlocked = [...UNLOCK_IDS];
    expect(remedyText(lj.w, lj.b)).toBe(REMEDY_TODAY); // Wortlaut heute (vor M10) für Holz mit freiem Abnehmer
  });
});
```

`REMEDY_TODAY` ist der bestehende Erwartungswert aus dem M7/M8-Test für den Holzfäller `storageFull` (dort
abschreiben); M7:AK-UX-08 und M8:AK-U2-08 bleiben grün (Testwelten mit `unlockAll`, Steuerfälle mit
`placeTownhall`).

```ts
// tests/ui/tooltip.test.ts bzw. hints.test.ts
describe('M10 Forst-Werkzeuge, Tooltips, Gründe (Spec 11.9)', () => {
  it('AK-U2-07 placementHint und tooltipLines', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    forceRect(w, k.x + 6, k.y + 2, 1, 1, 'forest');
    forceRect(w, k.x + 7, k.y + 2, 1, 1, 'grass');
    expect(placementHint(w, { kind: 'clearForest' }, k.x + 6, k.y + 2)).toMatchObject({
      ok: true,
      text: 'Roden: 10 Geld',
    });
    expect(placementHint(w, { kind: 'clearForest' }, k.x + 7, k.y + 2)).toMatchObject({
      ok: false,
      text: 'Hier ist kein Wald',
    });
    expect(placementHint(w, { kind: 'plantForest' }, k.x + 6, k.y + 2)).toMatchObject({
      ok: false,
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
    for (const [r, t] of rows) expect(friendlyReason(w, r), r).toBe(t);
  });
});

// tests/ui/hotkeys.test.ts und goal.test.ts
describe('M10 Tasten C, Q, ? (Spec 11.2)', () => {
  it('AK-U2-12 lockedToolText Roden; Liste mit „? Hilfe" nach P; unlockAll 20 Werkzeugtasten; ? ist Hilfe', () => {
    expect(lockedToolText(createWorld(3), { kind: 'clearForest' })).toBe(
      'Roden: Erst wenn ein Wohnhaus 4 Pioniere hat',
    );
    const keys = hotkeyList(createWorld(3)).map((e) => `${e.key} ${e.label}`);
    expect(keys[keys.indexOf('P Pause / weiter') + 1]).toBe('? Hilfe');
    expect(keys.some((k) => k.startsWith('C ') || k.startsWith('Q '))).toBe(false);
    const all = hotkeyList(createWorld(3, { crisisLevel: 'normal', unlockAll: true }));
    expect(all.slice(0, 20).map((e) => e.key)).toEqual(
      Object.keys(TOOL_HOTKEYS).map((k) => k.toUpperCase()),
    );
    expect(Object.keys(TOOL_HOTKEYS)).toHaveLength(20);
    expect(hotkeyAction('?', { ctrl: false, meta: false, alt: false }, false)).toEqual({
      kind: 'help',
    });
    expect(hotkeyAction('?', { ctrl: true, meta: false, alt: false }, false)).toBeNull();
    expect(hotkeyAction('?', { ctrl: false, meta: false, alt: false }, true)).toBeNull();
    expect(hotkeyAction('c', { ctrl: false, meta: false, alt: false }, false)).toEqual({
      kind: 'tool',
      tool: { kind: 'clearForest' },
    });
    expect(hotkeyAction('q', { ctrl: false, meta: false, alt: false }, false)).toEqual({
      kind: 'tool',
      tool: { kind: 'plantForest' },
    });
  });
});

// tests/ui/crisisLog.test.ts bzw. guide.test.ts (K4)
describe('M10 Krisen-Log ab erster Periode (Spec 11.10, Kann K4)', () => {
  it('AK-U2-11 normal: bei 2399 verborgen, bei 2400 sichtbar; off nie', () => {
    const w = createWorld(3, { crisisLevel: 'normal' });
    w.tick = CRISIS_FIRST_TICK - 1;
    expect(crisisLogVisible(w)).toBe(false);
    expect(
      mapSigns(w)
        .map((s) => s.meaning)
        .join(),
    ).not.toMatch(/Brand|Sturm/);
    w.tick = CRISIS_FIRST_TICK;
    expect(crisisLogVisible(w)).toBe(true);
    expect(mapSigns(w)).toEqual(MAP_SIGNS);
    const off = createWorld(3, { crisisLevel: 'off' });
    off.tick = 9000;
    expect(crisisLogVisible(off)).toBe(false);
  });
});

// tests/ui/inspect.test.ts
describe('M10 Amtsstuben-Panel (Spec 11.8)', () => {
  it('RF-5 Sperr-Matrix: Zeile verschwindet bei 0 Einwohnern, Sperre bleibt, kehrt gedrückt zurück', () => {
    const { w, houses } = village(2, { unlockAll: true });
    placeTownhall(w);
    setHouse(houses[0]!, 1, 2);
    setHouse(houses[1]!, 2, 3);
    expect(setGoodLock(w, 2, 'cloth', true).ok).toBe(true);
    expect(lockMatrix(w).map((r) => r.tier)).toEqual([1, 2]);
    expect(lockMatrix(w)[1]!.goods.find((g) => g.good === 'cloth')!.locked).toBe(true);
    setHouse(houses[1]!, 1, 3);
    expect(lockMatrix(w).map((r) => r.tier)).toEqual([1]);
    expect(w.goodLocks).toEqual([{ tier: 2, good: 'cloth' }]);
    setHouse(houses[1]!, 2, 3);
    expect(lockMatrix(w)[1]!.goods.find((g) => g.good === 'cloth')!.locked).toBe(true);
    expect(lockMatrix(createWorld(3)).length).toBe(0); // vor U5 verborgen
  });
});
```

(`MAP_SIGNS`-Zeilen für Brand und Sturm erkennt `mapSigns` an ihrem `sign`-Schlüssel; der Test prüft die
Bedeutungstexte so, wie sie in `MAP_SIGNS` stehen — Wortlaut dort nachsehen. Lokale Helfer `toolmakerWorld`,
`lumberjackFull` folgen `tests/sim/toolmaker.test.ts` bzw. dem bestehenden `storageFull`-Fall in `guide.test.ts`.)
