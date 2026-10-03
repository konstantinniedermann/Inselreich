> **Task-ID:** T11 (Paket M11-U2) — Teil 1 von 2
> **AK-IDs:** AK-UI-03, AK-UI-04 (Vitest + Browser), AK-UI-08 (Browser, dazu Vitest), AK-UI-10 (Browser; Vitest-Teil in T10); Umschreibung M10:AK-U3-02
> **blocked-by:** T09 (Integration Review OK) und T10; vorher `feat/m11-sim` @ T09 und `feat/m11-render` @ R1 in `feat/m11-ui` mergen (orga-09 W6)
> **Strang:** `feat/m11-ui` · `.worktrees/m11-ui` · Implementierer `tech-ui-engineer` (sonnet)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-06](orga-06-schnittstellen.md) · [orga-07](orga-07-datei-ownership.md) · [orga-12](orga-12-geaenderte-tests.md)
> **Teile:** **T11a-ui-betrieb.md** (diese) · [T11b-ui-betrieb.md](T11b-ui-betrieb.md)

## T11: Betriebs-Panel (Stufe, Auslastung, Ausbau) und Mouse-over

**Ziel:** Das Panel eines Betriebs zeigt Stufe, Auslastung und ab Freischaltung den Abschnitt „Ausbau zu Stufe n" mit
Kosten, Gebühr, Vorschau, Knopf und Gründen; das Mouse-over nennt Stufe und Auslastung (Spec 7, Anhang 01 E).

**Code-Fakten** (Zeilen Ist M10 `801c279`; T10 hat die Unterhaltszeile zu `data-field="upkeep"` gemacht):

- `src/ui/inspect.ts:32–39` `InspectActions`; `:458–477` Betriebszweig von `renderInspect`; `:486–515` `updateInspect`;
  `:170` `setList(root, field, items)` (privat, wiederverwenden); `:199–214` Muster `div.upgrade` des Haus-Panels.
- `src/ui/app.ts:397–421` übergibt die Aktionen an `renderInspect`; `showError` (`:268`) spielt den Fehlerton.
- `src/ui/hover.ts:112–136` `workshopInfo`: Titel `def.name`; `:127–134` rechnet beim Holzfäller live „kein Wald mehr
  in der Nähe" (M10-Hinweis, entfällt: der Zustand `noForest` kommt jetzt aus der Sim, T05).
- `src/ui/texts.ts:44–72` `stateInfo` — **Schritt 0:** prüfen, dass `case 'noForest'` existiert und genau „Kein freier
  Wald in der Nähe" liefert (`ok: false`). T01 muss den Fall als Kompilier-Fix ergänzt haben (sonst TS2366 unter
  `strict`); fehlt er oder weicht der Text ab, hier korrigieren und im Bericht melden.
- `src/ui/hints.ts:39` `REASON_TABLE`; die Gründe „Kann nicht ausgebaut werden" und „Gebäude brennt" (T07, Spec 3.6)
  fehlen dort; „Zu wenig Stoff/Rum" trifft `/^Zu wenig (\S+)$/` und bleibt unverändert, „Zu wenig Geld" nutzt `ctx.cost`.
- Sim (T06, T07, T09): `utilization(b)` (‰ 0…1000, `null` ohne `produces`), `cycleOf`, `upkeepOf` (`src/sim/levels.ts`);
  `LEVELS` (`src/sim/defs/levels.ts`, Index 0 = Stufe 2); `upgradeBuilding(world, id)` (`src/sim/upgrade.ts`);
  `functionLock(world, 'upgrade2' | 'upgrade3')` (`src/sim/unlocks.ts`).

**Erwartete Dateien:** `src/ui/inspect.ts`, `src/ui/hover.ts`, `src/ui/hints.ts`, `src/ui/app.ts`, `src/ui/texts.ts`
(nur falls Schritt 0 es verlangt), `src/style.css` (nur falls der Abschnitt eine Klasse braucht), `tests/ui/inspect.test.ts`,
`tests/ui/hover.test.ts`, `tests/ui/hints.test.ts`, `README.md` („Wirtschaft"/Info-Panel, „Produktionsketten"),
`docs/arc42.md` (§5 Zeilen `inspect.ts`, `hover.ts`).
**Nicht anfassen:** `src/sim/**`, `src/render/**`, `src/ui/buildMenu.ts`, `src/ui/hotkeys.ts`, `src/ui/goal.ts` (T12).

- [ ] **Schritt 1: Tests schreiben.** `tests/ui/inspect.test.ts`, neuer Block (Importe `levelText`, `utilizationText`,
      `upgradeView` aus `../../src/ui/inspect`, `upgradeBuilding` aus `../../src/sim/upgrade`, `serialize` aus
      `../../src/sim/save`, `village` aus `../sim/helpers`):

```ts
describe('M11 Betriebs-Panel (Spec 7)', () => {
  /** Betrieb roh einsetzen (ohne Kachel); das Panel liest nur Gebäude und Welt. */
  const put = (w: World, defId: BuildingDefId, extra: Partial<Building> = {}): Building => {
    const b: Building = {
      id: w.nextBuildingId++,
      defId,
      x: 0,
      y: 0,
      connected: true,
      progress: 0,
      state: 'ok',
      ...extra,
    };
    w.buildings[b.id] = b;
    return b;
  };
  it('AK-UI-03 Auslastung ohne eff 100 %, eff 94 208 → 36 %; Stufe 1/2; Haus und Kapelle ohne Zeilen', () => {
    const w = createWorld(3, { unlockAll: true });
    expect(utilizationText(put(w, 'fisher'))).toBe('Auslastung 100 %');
    expect(utilizationText(put(w, 'fisher', { eff: 94_208 }))).toBe('Auslastung 36 %');
    expect(levelText(put(w, 'fisher'))).toBe('Stufe 1');
    expect(levelText(put(w, 'fisher', { level: 2 }))).toBe('Stufe 2');
    const { houses } = village(1, { unlockAll: true });
    expect(utilizationText(houses[0]!)).toBeNull();
    expect(levelText(houses[0]!)).toBeNull();
    expect(levelText(put(w, 'chapel'))).toBeNull();
  });
  it('AK-UI-04 Ausbau Fischer: vor U3 verborgen, Kosten, Gebühr, Vorschau, ✗-Grund, Stufe 3 „Höchste Stufe"', () => {
    const w0 = createWorld(3);
    expect(upgradeView(w0, put(w0, 'fisher'))).toBeNull();
    const w = createWorld(3, { unlockAll: true });
    w.money = 1000;
    w.stock.cloth = 2;
    w.stock.rum = 2;
    const f = put(w, 'fisher');
    const before = serialize(w);
    expect(upgradeView(w, f)).toEqual({
      title: 'Ausbau zu Stufe 2',
      cost: 'Kosten 50 Geld · 3 Holz · 1 Werkzeug',
      fee: 'Gebühr 2 Stoff',
      preview: 'Ausstoss 15 → 25 / min · Unterhalt 30 → 42 / min',
      reasons: [],
      ok: true,
    });
    expect(serialize(w)).toBe(before); // Vorschau ändert die Welt nicht
    w.stock.cloth = 0;
    expect(upgradeView(w, f)!.reasons).toEqual(['✗ Zu wenig Stoff']);
    w.stock.cloth = 2;
    expect(upgradeBuilding(w, f.id).ok).toBe(true);
    expect(upgradeView(w, f)!.preview).toBe('Ausstoss 25 → 37.5 / min · Unterhalt 42 → 54 / min');
    w.unlocked = w.unlocked.filter((u) => u !== 'U5' && u !== 'U6');
    expect(upgradeView(w, f)).toBeNull(); // Stufe 3 vor U5 verborgen
    const w3 = createWorld(3, { unlockAll: true });
    const f3 = put(w3, 'fisher', { level: 3 });
    expect(upgradeView(w3, f3)).toEqual({
      title: 'Höchste Stufe',
      cost: '',
      fee: '',
      preview: '',
      reasons: [],
      ok: false,
    });
  });
});
```

`tests/ui/hints.test.ts`, neuer Block (Import `upgradeBuilding`):

```ts
describe('M11 Ausbau-Gründe (Spec 3.6)', () => {
  it('AK-UI-04 jeder Grund von upgradeBuilding steht in REASON_TABLE, „Zu wenig Stoff" bleibt wörtlich', () => {
    const w = createWorld(3, { unlockAll: true });
    const add = (defId: BuildingDefId, extra: Partial<Building> = {}) => {
      const b = {
        id: w.nextBuildingId++,
        defId,
        x: 0,
        y: 0,
        connected: true,
        progress: 0,
        state: 'ok',
        ...extra,
      } as Building;
      w.buildings[b.id] = b;
      return b.id;
    };
    const reasons = [
      upgradeBuilding(w, 99_999), // Gebäude nicht gefunden
      upgradeBuilding(w, add('chapel')), // Kann nicht ausgebaut werden
      upgradeBuilding(w, add('fisher', { level: 3 })), // Höchste Stufe erreicht
      upgradeBuilding(w, add('fisher', { outageUntil: w.tick + 200 })), // Gebäude brennt
    ].map((r) => (r.ok ? '' : r.reason));
    w.stock.cloth = 0;
    const r = upgradeBuilding(w, add('fisher'));
    reasons.push(r.ok ? '' : r.reason); // Zu wenig Stoff
    for (const x of reasons)
      expect(
        REASON_TABLE.some((row) => row.pattern.test(x)),
        x,
      ).toBe(true);
    expect(
      friendlyReason(w, 'Zu wenig Stoff', { cost: { money: 50, wood: 3, tools: 1, stone: 0 } }),
    ).toBe('Zu wenig Stoff');
  });
});
```

Weiter mit Schritt 1 (Mouse-over) in [T11b](T11b-ui-betrieb.md).
