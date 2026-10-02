> **Task-ID:** Task 2 (Paket M10-S1B) — Teil 1 von 2
> **AK-IDs:** AK-S1-06, -07, -08, -09, -16 (BG-1), -17, -18, -19
> **blocked-by:** Task 1 (Review OK)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · Orga: [orga-06-schnittstellen.md](orga-06-schnittstellen.md) · [orga-07-datei-ownership.md](orga-07-datei-ownership.md) · [orga-11-bitgleich.md](orga-11-bitgleich.md) · [orga-12-geaenderte-tests.md](orga-12-geaenderte-tests.md)
> **Teile:** **T02a-sperren.md** (diese) · [T02b-sperren.md](T02b-sperren.md)

## Task 2: S1b — Sperren in Bau, Handel und Aufträgen, „Alles frei" in Tests, `nextStep`-Filter

**Paket** M10-S1B · **Implementierer** `tech-sim-engineer` (sonnet) · **Worktree/Branch** `.worktrees/m10-sim` ·
`feat/m10-sim` · **blocked-by** Task 1 (Review OK) · **AK** AK-S1-06, -07, -08, -09, -16 (BG-1), -17, -18, -19
· parallel zu Task 3

**Files:**

- Modify: `src/sim/placement.ts`, `src/sim/trade.ts`, `src/sim/orders.ts`, `src/sim/types.ts` (`unlockTier`
  entfernen), `src/sim/defs/buildings.ts` (nur `unlockTier: 4` bei `bathhouse`/`glassworks` entfernen),
  `src/sim/build.ts` (nur falls nötig), `src/ui/guide.ts` (nur Filter 12.3), `tests/sim/helpers.ts`,
  `tests/sim/scenarios.ts`
- Test: `tests/sim/unlocks.test.ts` (neue `describe`), `tests/ui/guide.test.ts` (AK-S1-19); bewusst geändert nach
  T-4, T-5, T-6, T-11 (per Lauf)

**Interfaces:**

- Consumes: `buildLock`, `goodLock`, `functionLock`, `buildingShown`, `deriveUnlocks`, `unlockText`,
  `entryOfBuilding` (Task 1).
- Produces: `placement.ts` re-exportiert `buildLock` aus `./unlocks` (M8-Importe in `src/ui` bleiben gültig);
  `canPlace` prüft `buildLock` zuerst; `buy` prüft `goodLock` zuerst; `deliverOrder` prüft `functionLock(w, 'orders')`
  zuerst; Test-Helfer `finishUnlocks(w)` in `tests/sim/scenarios.ts` (`w.unlocked = deriveUnlocks(w)`);
  `BuildingDef.unlockTier` und `withUnlock` gibt es nicht mehr.

- [ ] **Schritt 1: Failing tests** — in `tests/sim/unlocks.test.ts` (Importe `canPlace` aus
      `../../src/sim/placement`, `buy`, `sell`, `sellPrice` aus `../../src/sim/trade`, `deliverOrder`, `tickOrders`
      aus `../../src/sim/orders`, `buildColony` aus `./controller`, `forceRect`, `placeService` aus `./helpers`):

```ts
describe('M10 Sperren in der Sim (Spec 4.4)', () => {
  it('AK-S1-06 Bausperre zuerst, auch auf Wasser; nichts gebucht; frei nach U2; U0-Gebäude und Kontor nie gesperrt', () => {
    const w = createWorld(3);
    const k = w.buildings[w.kontorId]!;
    forceRect(w, k.x + 3, k.y, 2, 2, 'grass');
    const reason = 'Erst wenn ein Wohnhaus 4 Pioniere hat';
    expect(buildLock(w, 'chapel')).toBe(reason);
    expect(canPlace(w, 'chapel', k.x + 3, k.y)).toEqual({ ok: false, reason });
    expect(canPlace(w, 'chapel', 0, 0)).toEqual({ ok: false, reason }); // (0,0) ist Wasser
    const before = serialize(w);
    expect(placeBuilding(w, 'chapel', k.x + 3, k.y).ok).toBe(false);
    expect(serialize(w)).toBe(before);
    expect(buildLock(w, 'market')).toBe('Erst ab 20 Wohnhäusern');
    expect(buildLock(w, 'school')).toBe('Erst wenn ein Wohnhaus 8 Siedler hat');
    expect(buildLock(w, 'toolmaker')).toBe('Erst mit den ersten Bürgern');
    expect(buildLock(w, 'bathhouse')).toBe('Erst nach dem Ziel');
    for (const id of ['house', 'fisher', 'lumberjack', 'kontor'] as const)
      expect(buildLock(w, id)).toBeNull();
    w.unlocked = ['U0', 'U2'];
    expect(buildLock(w, 'chapel')).toBeNull();
    expect(placeBuilding(w, 'chapel', k.x + 3, k.y).ok).toBe(true);
  });
  it('AK-S1-07 roh gesetzte Schule ohne U4 versorgt, lässt sich abreissen, zweiter Bau scheitert mit U4-Grund', () => {
    const w = createWorld(3, { unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    forceGrass(w, k.x + 2, k.y);
    const r = placeBuilding(w, 'house', k.x + 2, k.y);
    if (!r.ok || r.id === undefined) throw new Error('Haus');
    const h = w.buildings[r.id]!;
    const school = placeService(w, 'school', k.x + 4, k.y); // nach dem Haus: Platzieren setzt `connected` zurück
    w.unlocked = ['U0'];
    setHouse(h, 2, 8);
    step(w);
    expect(h.house!.services.school).toBe(true);
    const money = w.money;
    expect(demolish(w, school.id).ok).toBe(true);
    expect(w.money).toBeGreaterThan(money); // Erstattung wie heute
    forceRect(w, k.x + 4, k.y, 2, 2, 'grass');
    expect(canPlace(w, 'school', k.x + 4, k.y)).toEqual({
      ok: false,
      reason: 'Erst wenn ein Wohnhaus 8 Siedler hat',
    });
  });
  it('AK-S1-08 Kauf gesperrt bis U2, Verkauf aus dem Lager immer', () => {
    const w = createWorld(3);
    const before = serialize(w);
    expect(buy(w, 'wool', 1)).toEqual({
      ok: false,
      reason: 'Erst wenn ein Wohnhaus 4 Pioniere hat',
    });
    expect(serialize(w)).toBe(before);
    expect(buy(w, 'wood', 1).ok).toBe(true);
    w.stock.wool = 5;
    const price = sellPrice(w, 'wool', 5);
    const m = w.money;
    expect(sell(w, 'wool', 5).ok).toBe(true);
    expect(w.money - m).toBe(price);
    w.stock.wool = 5;
    expect(sell(w, 'wool', 6)).toEqual({ ok: false, reason: 'Nicht genug Ware' });
    w.unlocked = ['U0', 'U2'];
    expect(buy(w, 'wool', 1).ok).toBe(true);
  });
  it('AK-S1-09 Auftrag entsteht vor U3, Lieferung gesperrt, mit U3 möglich; gleiche Aufträge in beiden Welten', () => {
    const a = createWorld(3);
    const b = createWorld(3, { unlockAll: true });
    for (const w of [a, b]) {
      w.tick = 599;
      w.tick += 1;
      tickOrders(w);
    }
    expect(a.order).not.toBeNull();
    expect(a.order).toEqual(b.order);
    a.stock[a.order!.good] = 99;
    const before = serialize(a);
    expect(deliverOrder(a)).toEqual({ ok: false, reason: 'Erst mit den ersten Siedlern' });
    expect(serialize(a)).toBe(before);
    a.unlocked = ['U0', 'U2', 'U3'];
    expect(deliverOrder(a).ok).toBe(true);
  });
  it('AK-S1-17 „Alles frei" bitgleich: buildColony liefert denselben Trajectory', () => {
    expect(buildColony(createWorld(3, { unlockAll: true }))).toEqual(buildColony(createWorld(3)));
  });
  it('AK-S1-18 Feuerwache bei Krisen off: nicht angezeigt, aber baubar; bei mild angezeigt', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    forceRect(w, k.x + 3, k.y, 2, 2, 'grass');
    expect(buildingShown(w, 'firestation')).toBe(false);
    expect(buildLock(w, 'firestation')).toBeNull();
    expect(canPlace(w, 'firestation', k.x + 3, k.y).ok).toBe(true);
    expect(
      buildingShown(createWorld(3, { crisisLevel: 'mild', unlockAll: true }), 'firestation'),
    ).toBe(true);
  });
});
```

(Falls `tickOrders` den Auftrag an anderer Stelle erzeugt als bei `tick % ORDER_PERIOD`: Testaufbau an
`orders.test.ts` angleichen, Aussage gleich; im Bericht nennen.) In `tests/ui/guide.test.ts`, neuer Block:

```ts
describe('M10 nextStep-Filter (Spec 12.3)', () => {
  it('AK-S1-19 gesperrter Marktplatz: „Marktplatz kommt, …"; mit U1 wörtlich wie heute', () => {
    const w = createWorld(3);
    const far = houseFar(w); // Haus ausserhalb der Versorgung, roh gesetzt (tests/sim/helpers.ts)
    expect(far.house).toBeDefined();
    expect(nextStep(w)).toBe('Marktplatz kommt, sobald 20 Wohnhäuser stehen');
    w.unlocked = ['U0', 'U1'];
    expect(nextStep(w)).toBe(
      'Ein Wohnhaus liegt ausserhalb der Versorgung: baue einen Marktplatz (M)',
    );
  });
});
```

- [ ] **Schritt 2: Rot prüfen.** `npx vitest run tests/sim/unlocks.test.ts tests/ui/guide.test.ts -t "M10"` —
      erwartet FAIL bei AK-S1-06 (`canPlace` ok statt Sperre), -08 (`buy` ok), -09 (`deliverOrder` ok), -19
      (alter Satz). **Vor der Umsetzung grün erlaubt:** AK-S1-07 (Sperre bleibt ohne Wirkung auf stehende
      Gebäude), AK-S1-17 (Regressionsschutz), AK-S1-18 (`buildingShown` aus Task 1).
