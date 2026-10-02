> **Task-ID:** Task 6 (Paket M10-U1) — Teil 2 von 3
> **AK-IDs:** Vitest-Teile von AK-U1-01 … -13 (Browser-Teile in QA-U1), `RF-4`
> **blocked-by:** Task 4
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md)
> **Teile:** [T06a-bedienung-freigeschaltet.md](T06a-bedienung-freigeschaltet.md) · **T06b-bedienung-freigeschaltet.md** (diese) · [T06c-bedienung-freigeschaltet.md](T06c-bedienung-freigeschaltet.md)

- [ ] **Schritt 1: Failing tests** (Testwelten: `createWorld(3, { crisisLevel, unlockAll })`; Stände mit
      `w.unlocked = [...]`):

```ts
// tests/ui/tooltip.test.ts (oder die Datei, die heute buildEntries prüft) — neuer Block
describe('M10 Bauleiste nach Freischaltung (Spec 11.1)', () => {
  const count = (w: World) =>
    Object.fromEntries(CATEGORIES.map((c) => [c.id, buildEntries(w, c.id).length]));
  const at = (ids: UnlockId[], crisisLevel: CrisisLevel = 'normal') => {
    const w = createWorld(3, { crisisLevel });
    w.unlocked = ids;
    return w;
  };
  it('AK-U1-01 Zählung je Stand (Krisen normal und off), leere Kategorien verborgen', () => {
    expect(count(at(['U0']))).toEqual({ infrastructure: 0, housing: 1, production: 2, public: 0 });
    expect(visibleCategories(at(['U0']))).toEqual(['housing', 'production']);
    expect(buildEntries(at(['U0']), 'production')).toEqual(['fisher', 'lumberjack']);
    expect(count(at(['U0', 'U2']))).toEqual({
      infrastructure: 0,
      housing: 1,
      production: 5,
      public: 2,
    });
    expect(count(at(['U0', 'U2'], 'off')).public).toBe(1);
    expect(count(at(['U0', 'U2', 'U3'])).public).toBe(3);
    expect(count(at(['U0', 'U2', 'U3', 'U4']))).toMatchObject({ production: 7, public: 4 });
    expect(count(at(['U0', 'U2', 'U3', 'U4', 'U5'])).production).toBe(8);
    expect(count(at(['U0', 'U2', 'U3', 'U4', 'U5', 'U6']))).toMatchObject({
      production: 9,
      public: 5,
    });
    expect(count(at(['U0', 'U1'])).infrastructure).toBe(1);
    expect(count(createWorld(3, { crisisLevel: 'normal', unlockAll: true }))).toEqual({
      infrastructure: 1,
      housing: 1,
      production: 9,
      public: 5,
    });
    expect(count(createWorld(3, { crisisLevel: 'off', unlockAll: true })).public).toBe(4);
  });
});

// tests/ui/goal.test.ts — neuer Block (T-7: alte unlockNotice-Tests werden zu Fällen hier)
describe('M10 Freischalt-Meldung und gesperrte Werkzeuge (Spec 11.2, 11.6)', () => {
  const w = (ids: UnlockId[], crisisLevel: CrisisLevel = 'normal') => {
    const x = createWorld(3, { crisisLevel });
    x.unlocked = ids;
    return x;
  };
  const tail = '. Mehr unter Hilfe (?)';
  it('AK-U1-08 Texte je Eintrag wörtlich, Kombination, nur U6 = M8-Text, gleich → null, kein „Tick"', () => {
    const t = (prev: UnlockId[], now: UnlockId[], c: CrisisLevel = 'normal') =>
      unlockNoticeText(prev, w(now, c));
    expect(t(['U0'], ['U0', 'U2'])).toBe(
      `Neu: Steinbruch (B), Schäferei (G), Weberei (V), Kapelle (K), Feuerwache (E), Roden (C), Aufforsten (Q) — deine Pioniere wollen Siedler werden${tail}`,
    );
    expect(t(['U0'], ['U0', 'U2'], 'off')).toBe(
      `Neu: Steinbruch (B), Schäferei (G), Weberei (V), Kapelle (K), Roden (C), Aufforsten (Q) — deine Pioniere wollen Siedler werden${tail}`,
    );
    expect(t(['U0'], ['U0', 'U1'])).toBe(
      `Neu: Marktplatz (M) — deine Siedlung wächst über das Kontor hinaus${tail}`,
    );
    expect(t(['U0', 'U2'], ['U0', 'U2', 'U3'])).toBe(
      `Neu: Amtsstube (I), Handelsaufträge — die ersten Siedler sind da${tail}`,
    );
    expect(t(['U0', 'U2', 'U3'], ['U0', 'U2', 'U3', 'U4'])).toBe(
      `Neu: Zuckerrohrplantage (Z), Brennerei (N), Schule (U) — deine Siedler wollen Bürger werden${tail}`,
    );
    expect(t(['U0', 'U2', 'U3', 'U4'], ['U0', 'U2', 'U3', 'U4', 'U5'])).toBe(
      `Neu: Werkzeugmacher (T), Ausgabesperre — die ersten Bürger sind da${tail}`,
    );
    expect(t(['U0', 'U2', 'U3', 'U4', 'U5'], ['U0', 'U2', 'U3', 'U4', 'U5', 'U6'])).toBe(
      UNLOCK_NOTICE,
    );
    expect(UNLOCK_NOTICE).toBe(
      'Neu freigeschaltet: Badehaus (J) und Glashütte (O) — deine Bürger wollen Kaufleute werden',
    );
    expect(t(['U0'], ['U0', 'U2', 'U3'])).toBe(
      `Neu: Steinbruch (B), Schäferei (G), Weberei (V), Kapelle (K), Feuerwache (E), Roden (C), Aufforsten (Q), Amtsstube (I), Handelsaufträge — die ersten Siedler sind da${tail}`,
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
```

Weitere Vitest-Tests (je `describe('M10 …')`, Sollwerte wörtlich aus Spec und AK):

```ts
// tests/ui/hotkeys.test.ts
it('AK-U1-03 hotkeyList(world): neue Welt R, X, H, F, L, dann 1, 2, 3, P, NAV_KEYS; unlockAll normal: 18 Werkzeugtasten', () => {
  const keys = hotkeyList(createWorld(3, { crisisLevel: 'normal' })).map((e) => e.key);
  expect(keys).toEqual([
    'R',
    'X',
    'H',
    'F',
    'L',
    '1',
    '2',
    '3',
    'P',
    ...NAV_KEYS.map((n) => n.key),
  ]);
  const all = hotkeyList(createWorld(3, { crisisLevel: 'normal', unlockAll: true })).map(
    (e) => e.key,
  );
  expect(all.slice(0, 18)).toEqual(Object.keys(TOOL_HOTKEYS).map((k) => k.toUpperCase()));
  expect(all[18]).toBe('1');
});
// tests/ui/hud.test.ts
it('AK-U1-04 Lager-Chips: neues Spiel genau Holz, Werkzeug, Stein, Nahrung; Wolle 3 ohne U2 sichtbar', () => {
  const w = createWorld(3);
  expect(GOOD_IDS.filter((g) => !stockChipHidden(w, g))).toEqual([
    'wood',
    'tools',
    'stone',
    'food',
  ]);
  w.stock.wool = 3;
  expect(stockChipHidden(w, 'wool')).toBe(false);
});
it('AK-U1-05 Einwohner-Chips: pop-1 immer; pop-2 ab U3, pop-3 ab U5, pop-4 ab U6; mit Einwohnern immer', () => {
  const w = createWorld(3);
  expect(([1, 2, 3, 4] as Tier[]).map((t) => popChipHidden(w, t))).toEqual([
    false,
    true,
    true,
    true,
  ]);
  w.unlocked = ['U0', 'U2', 'U3'];
  expect(popChipHidden(w, 2)).toBe(false);
  w.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5'];
  expect(popChipHidden(w, 3)).toBe(false);
  expect(popChipHidden(w, 4)).toBe(true);
  w.unlocked = [...UNLOCK_IDS];
  expect(popChipHidden(w, 4)).toBe(false);
  const v = createWorld(3);
  const h = houseNearKontor(v); // tests/sim/helpers.ts
  h.house!.tier = 3;
  expect(popChipHidden(v, 3)).toBe(false);
});
it('AK-U1-11 taxButtonText: ohne aktive Amtsstube null; mit aktiver „Steuer normal" (wirksame Stufe)', () => {
  const w = createWorld(3, { unlockAll: true });
  expect(taxButtonText(w)).toBeNull();
  placeTownhall(w); // tests/sim/helpers.ts
  expect(taxButtonText(w)).toBe('Steuer normal');
});
it('AK-U1-13 Bilanz-Tooltip ohne aktive Amtsstube mit „Steuer: normal (keine Amtsstube)"; Ruhe-Ansicht rest-tax mit Zusatz', () => {
  const w = createWorld(3);
  w.taxLevel = 'high';
  expect(balanceTooltip(w)).toContain('Steuer: normal (keine Amtsstube)');
  expect(restView(w).tax).toBe(`${taxEffect('normal')} (keine Amtsstube)`);
});
// tests/ui/trade.test.ts
it('AK-U1-06 Handelszeilen: neue Welt Holz, Werkzeug, Stein, Nahrung; Wolle 3 ohne U2: verkaufbar, nicht kaufbar', () => {
  const w = createWorld(3);
  expect(tradeRows(w).map((r) => r.good)).toEqual(['wood', 'tools', 'stone', 'food']);
  w.stock.wool = 3;
  expect(tradeRows(w).find((r) => r.good === 'wool')).toEqual({ good: 'wool', canBuy: false });
});
// tests/ui/order.test.ts
it('AK-U1-07 Auftragskarte vor U3 verborgen, ab U3 sichtbar; weder Meldung noch Ton order vor und beim Wechsel zu U3', () => {
  const prev = createWorld(3);
  prev.order = orderFixture(prev); // Auftrag wie im Szenario m10-siedler-fast
  expect(orderVisible(prev)).toBe(false);
  expect(orderMessageFor(null, false, prev)).toBeNull(); // vor U3: keine Meldung „Neuer Auftrag"
  const cur = structuredClone(prev);
  cur.unlocked = ['U0', 'U2', 'U3'];
  expect(orderVisible(cur)).toBe(true);
  expect(orderMessageFor(prev.order, orderVisible(prev), cur)).toBeNull(); // Wechsel zu U3 mit laufendem Auftrag
  expect(diffSoundEvents(soundSnapshot(prev), soundSnapshot(cur))).not.toContain('order');
});
// tests/ui/settings.test.ts
it('AK-U1-10 unlockMode: Standard stepwise, all gelesen, unbekannt → stepwise', () => {
  expect(parseSettings(null).unlockMode).toBe('stepwise');
  expect(parseSettings(JSON.stringify({ unlockMode: 'all' })).unlockMode).toBe('all');
  expect(parseSettings(JSON.stringify({ unlockMode: 'foo' })).unlockMode).toBe('stepwise');
});
// tests/ui/soundEvents.test.ts
it('AK-U1-12 unlock: wächst → genau ein unlock; zwei Einträge ein Ton; mit won nur win; Laden kein Ton; Rest unverändert', () => {
  const a = createWorld(3);
  const s0 = soundSnapshot(a);
  a.unlocked = ['U0', 'U2'];
  expect(diffSoundEvents(s0, soundSnapshot(a))).toEqual(['unlock']);
  a.unlocked = ['U0', 'U2', 'U3', 'U4'];
  expect(
    diffSoundEvents(soundSnapshot(createWorld(3)), soundSnapshot(a)).filter((e) => e === 'unlock'),
  ).toHaveLength(1);
  const b = createWorld(3);
  const s1 = soundSnapshot(b);
  b.won = true;
  b.unlocked = ['U0', 'U2', 'U3', 'U4', 'U5', 'U6'];
  const ev = diffSoundEvents(s1, soundSnapshot(b));
  expect(ev).toContain('win');
  expect(ev).not.toContain('unlock');
  expect(diffSoundEvents(soundSnapshot(b), soundSnapshot(b))).toEqual([]); // Laden: Basis = geladener Stand
});
```

Hinweise zu den Helfern, die dieser Task anlegt: `orderMessageFor(prevOrder, prevVisible, cur)` = `prevVisible &&
  orderVisible(cur) ? orderMessage(prevOrder, cur.order) : null` (Meldung nur, wenn die Karte im vorigen **und** im
jetzigen Frame sichtbar war; der Wechsel zu U3 mit laufendem Auftrag
zeigt die Karte, aber keine Meldung „Neuer Auftrag" — sonst wäre AK-U1-09 „genau eine Meldung" verletzt);
`SoundSnapshot.orderPeriod` ist `null`, solange `orderVisible` falsch ist, und `diffSoundEvents` meldet `order` nur
bei Wechsel zwischen zwei Nicht-`null`-Werten; `orderFixture(w)` ist ein lokaler Testhelfer (Auftrag aus
`orderForPeriod(w.seed, 1, 1)` mit `offered 1500`, `due 2100`). `balanceTooltip(world)` und `restView(world).tax`
sind die reinen Teile von `hud.ts` bzw. `inspect.ts` (heute `balanceText`/`restView`; Namen an den Bestand
anpassen, Aussage gleich). In `tests/ui/devProbes.test.ts`: `it('AK-U1-11 Dev-Sonde nur unter DEV …')` prüft, dass
`exposeDevProbe` ohne `import.meta.env.DEV` nichts an `window` hängt (Fake-`window`-Objekt wie die bestehenden
Sonden-Tests). In `tests/audio/`: ein `it` „`'unlock'` ist zugeordnet und spielt die `win`-Datei".
