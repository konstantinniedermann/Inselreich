> **Task-ID:** T12 (Paket M11-U3) — Teil 2 von 2
> **AK-IDs:** AK-UI-05, -06, -07, -09; AK-R161-01, -02, -03 (siehe Teil 1)
> **blocked-by:** T11, R1 (siehe Teil 1)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-12](orga-12-geaenderte-tests.md) · [orga-14](orga-14-qa-uebersicht.md)
> **Teile:** [T12a-ui-haus-bau.md](T12a-ui-haus-bau.md) · **T12b-ui-haus-bau.md** (diese)

- [ ] **Schritt 1 (Fortsetzung).** `tests/ui/inspect.test.ts` (Importe `deficitText` aus `../../src/ui/texts`,
      `deficitLine` aus `../../src/ui/inspect`; `village`, `setHouse as setHouseTo` sind importiert):

```ts
describe('M11 Haus-Panel Defizit (Spec 7, Anhang 01 E)', () => {
  const pre = 'Rum-Bilanz negativ — Aufstieg verzögert; ';
  it('AK-UI-07 deficitText: X = floor(Lager / −net / 6); leer, über 60, unter 1, genau 1', () => {
    expect(deficitText('rum', 40, -3)).toBe(`${pre}Vorrat reicht noch 2 Minuten`);
    expect(deficitText('rum', 0, -3)).toBe(`${pre}Vorrat leer`);
    expect(deficitText('rum', 100, -0.2)).toBe(`${pre}Vorrat reicht noch über 60 Minuten`);
    expect(deficitText('rum', 10, -3)).toBe(`${pre}Vorrat reicht noch weniger als 1 Minute`);
    expect(deficitText('rum', 20, -3)).toBe(`${pre}Vorrat reicht noch 1 Minute`);
  });
  it('AK-UI-07 deficitLine: volles Siedlerhaus, Rum 40, keine Brennerei → Rum-Zeile; ohne Defizit oder nicht voll keine', () => {
    const { w, houses } = village(1, { unlockAll: true });
    const h = houses[0]!;
    setHouseTo(h, 2, 8);
    const add = (defId: BuildingDefId) => {
      const id = w.nextBuildingId++;
      w.buildings[id] = { id, defId, x: 0, y: 0, connected: true, progress: 0, state: 'ok' };
    };
    for (let i = 0; i < 3; i++) add('fisher'); // Nahrung 7,5 − 4,0 = 3,5 = Δ 3,5 (dämpft nicht)
    add('weaver');
    add('weaver'); // Stoff 4,0 − 1,6 = 2,4 ≥ Δ 1,4
    w.stock.rum = 40;
    expect(deficitLine(w, h)).toBe(`${pre}Vorrat reicht noch 2 Minuten`);
    w.stock.rum = 0;
    expect(deficitLine(w, h)).toBe(`${pre}Vorrat leer`);
    setHouseTo(h, 2, 7);
    expect(deficitLine(w, h)).toBeNull();
    setHouseTo(h, 2, 8);
    add('distillery');
    add('distillery'); // Rum 4,0 ≥ Δ 3,0
    expect(deficitLine(w, h)).toBeNull();
  });
});
```

`tests/ui/hints.test.ts`:

```ts
describe('M11 R161 Stein-Hinweis (Spec 3.7)', () => {
  it('AK-R161-01 „Zu wenig Stein" mit 1 Glashütte → Zusatzzeile; ohne Glashütte oder anderer Grund: keine', () => {
    const w = createWorld(3, { unlockAll: true });
    const text = 'Die Glashütte verbraucht ebenfalls Stein — baue weitere Steinbrüche.';
    expect(glassStoneHint(w, ['Zu wenig Stein'])).toBeNull();
    const id = w.nextBuildingId++;
    w.buildings[id] = {
      id,
      defId: 'glassworks',
      x: 0,
      y: 0,
      connected: true,
      progress: 0,
      state: 'waitingInput',
    };
    expect(glassStoneHint(w, ['Haus nicht voll belegt', 'Zu wenig Stein'])).toBe(text);
    expect(glassStoneHint(w, ['Zu wenig Holz'])).toBeNull();
  });
});
```

- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/ui/hotkeys.test.ts tests/ui/goal.test.ts tests/ui/tooltip.test.ts tests/ui/inspect.test.ts tests/ui/hints.test.ts`.
- [ ] **Schritt 3: Umsetzung.**
  - `hotkeys.ts`: am Ende von `TOOL_HOTKEYS` `y: { kind: 'build', defId: 'hunter' }` (Kommentar: „M11, Spec 13-10:
    Rinderfarm bewusst ohne Taste"). `hotkeyList` filtert über `toolShown` (Y erst nach U2).
  - `goal.ts` `withKey` ohne Taste nur der Name — nur falls T04 (Minimal-Eingriff) es nicht schon getan hat.
  - `buildMenu.ts` `tooltipLines`: nach der „Erzeugt"-Zeile, wenn `LEVELS[def.id]`: „Ausstoss je Stufe: {a} · {b} · {c} / min"
    mit `num(perMinute(1, c))` für `def.cycle`, `LEVELS[id][0].cycle`, `LEVELS[id][1].cycle`. „Erzeugt" bleibt Stufe 1 (AK-UI-10).
  - `texts.ts`: `deficitText(good: GoodId, stock: number, net: number): string` = „{GOODS[good].name}-Bilanz negativ —
    Aufstieg verzögert; " + (stock ≤ 0 ? „Vorrat leer" : „Vorrat reicht noch " + Dauer) mit `x = Math.floor(stock / -net / 6)`:
    `x >= 60` → „über 60 Minuten", `x === 0` → „weniger als 1 Minute", `x === 1` → „1 Minute", sonst „{x} Minuten".
  - `inspect.ts`: `deficitLine(world, b)`: nur volles Haus (`inhabitants === TIERS[tier].maxInhabitants`) mit
    `upgradeCost !== null`; `const d = upgradeDeficit(world, b)`; `d ? deficitText(d.good, world.stock[d.good], d.net) : null`.
    `renderHouse`: Zeilen `deficit` und `stone-hint` im `div.upgrade` nach `upgrade-reasons`; `updateHouse` setzt Text
    und `hidden` (`null` → verborgen); `stone-hint` = `glassStoneHint(world, upgradeStatus(world, b).reasons)`.
  - `hints.ts`: `export function glassStoneHint(world, reasons: readonly string[]): string | null` — Grund roh „Zu wenig Stein"
    in `reasons` und mindestens eine `glassworks` → Text aus Anhang 01 E, sonst `null`.
- [ ] **Schritt 4: Grün.** `npx vitest run tests/ui` · `npx tsc --noEmit` · `make check` · Testzählbefehl (hotkeys +1,
      goal +1, tooltip +1, inspect +2, hints +1). `git diff <BASIS> -- src/sim/production.ts | grep -ci stein` → 0 (AK-R161-03).
- [ ] **Schritt 5: Doku.** `README.md` „Tastatur und Maus": Zeile `Y` „Jagdhütte (erst ab U2)", Satz „Die Rinderfarm
      hat keine Taste"; „Aufstieg": doppelte Wartezeit bei Defizit steht in D1, hier nur der Satz zum Haus-Panel
      (Defizit-Zeile mit Restvorrat; Stein-Hinweis bei Glashütte). `docs/arc42.md` §5 Zeile `inspect.ts` ergänzen.
- [ ] **Schritt 6: Commit und Push.**

```bash
git add src/ui tests/ui README.md docs/arc42.md
git commit -m "feat: M11-U3 Haus-Defizit, Stein-Hinweis, Taste Y, Meldungen U2/U3/U5, Tooltip je Stufe (Spec 7, 3.7, 4)"
git -C .worktrees/m11-ui push -u origin feat/m11-ui
```

### Rot-Beleg

| AK               | Erwartete Meldung vor der Umsetzung                                            |
| ---------------- | ------------------------------------------------------------------------------ |
| AK-UI-05         | `expected null to deeply equal { kind: 'tool', … 'hunter' }`                   |
| AK-UI-09         | U2-Text ohne „(Y)" bzw. mit „(null)" (`expected '…Jagdhütte (null)…' to be …`) |
| AK-UI-06 Tooltip | `expected 'Brennbar' to be 'Ausstoss je Stufe: 15 · 25 · 37.5 / min'`          |
| AK-UI-07         | `TypeError: … deficitText is not a function`                                   |
| AK-R161-01       | `TypeError: … glassStoneHint is not a function`                                |

### Geänderte bestehende Tests (Name je + „(M11 Y)"; Zahl 20 → 21 wegen Y)

`tests/ui/hotkeys.test.ts`: :81 (AK-U2-02 Pan-Tasten) `toHaveLength(21)`; :182–183 (AK-S2-18) `toHaveLength(21)`,
`'rxhkumflbgvzntejoicqy'`; :200 (AK-U1-02) und :219 (AK-S2-16) `toHaveLength(21)`; :244–245 (AK-U1-03)
`slice(0, 21)`, `all[21]`; :258, :261 (AK-U2-12) `slice(0, 21)`, `toHaveLength(21)`. `tests/ui/goal.test.ts` AK-U1-08:
jede Zeile mit der Jagdhütte → „Jagdhütte (Y)" (nur falls Schritt 0 (a) eine andere Fassung zeigt).

### Browser-Check (qa-playtester)

Playtester-Briefing (Pflicht): eigener Vite-Port je Check (`npx vite --port <frei, z. B. 5200 + Task-Nr.> --strictPort`), Port im Bericht nennen; nach dem Check den Server beenden (Teardown: PID/Port schliessen, Chrome-Instanz beenden, `git worktree remove` des QA-Baums) und im Bericht bestätigen.

`m11-wald` (AK-UI-06): Kategorie Produktion zeigt Fischerhütte, Jagdhütte, Rinderfarm in dieser Reihenfolge; Holzfäller
anwählen, letzte freie Waldkachel mit C roden (1×) → `state` „Kein freier Wald in der Nähe" binnen 1 s, Marke aus R1
sichtbar. `m11-defizit` (AK-UI-07): Haus-Panel `deficit` wörtlich „Rum-Bilanz … 2 Minuten". `m11-stein` (AK-R161-02):
`stone-hint` sichtbar; Glashütte-Panel „Wartet auf Stein". **Ohne B1-Szenen:** `m11-wald` → Szene `m10-wald`, die
übrigen Waldkacheln im Radius 2 des Holzfällers per `(await import('/src/sim/forest.ts')).clearForest(w, x, y)` roden;
`m11-defizit`/`m11-stein` per Konsole wie T11b: Haus per `placeBuilding`, `h.house.tier`/`inhabitants` setzen; für
`m11-defizit` **3 Fischer und 2 Webereien** (sonst ist Nahrung das erste Defizitgut), Rum 40; für `m11-stein` `won = true`,
Glashütte bei Stein 20 bauen, danach Stein 4, Bürgerhaus 15 EW.

### Risiken/Randfälle

- B1-Szene `m11-defizit` (Anhang 02 F) nennt keine Nahrungs- und Stoffquellen; ohne sie meldet das Panel Nahrung statt Rum.
- „1 Minute" (Einzahl) ist eine Plan-Setzung zur Spec-Vorlage „{X} Minuten".
- Funktionsreihenfolge in U3/U5 hängt an T01 (`functions` angehängt); Test folgt den Defs.
