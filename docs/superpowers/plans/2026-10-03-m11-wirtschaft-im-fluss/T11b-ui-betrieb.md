> **Task-ID:** T11 (Paket M11-U2) — Teil 2 von 2
> **AK-IDs:** AK-UI-03, -04, -08, -10 (siehe Teil 1)
> **blocked-by:** T09, T10 (siehe Teil 1)
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-12](orga-12-geaenderte-tests.md) · [orga-14](orga-14-qa-uebersicht.md)
> **Teile:** [T11a-ui-betrieb.md](T11a-ui-betrieb.md) · **T11b-ui-betrieb.md** (diese)

- [ ] **Schritt 1 (Fortsetzung): Mouse-over.** `tests/ui/hover.test.ts`, neuer Block (eigener Helfer, weil `raw` im
      M10-Block lokal ist):

```ts
describe('M11 Mouse-over Betrieb (Spec 7)', () => {
  const none = { ship: false, animal: null };
  it('AK-UI-08 Fischer Stufe 2: Titel „Fischerhütte, Stufe 2 · Auslastung 100 %"; Kapelle ohne Stufe', () => {
    const w = createWorld(3, { crisisLevel: 'off', unlockAll: true });
    const k = w.buildings[w.kontorId]!;
    const put = (
      defId: BuildingDefId,
      x: number,
      y: number,
      extra: Partial<Building> = {},
    ): Building => {
      const b: Building = {
        id: w.nextBuildingId++,
        defId,
        x,
        y,
        connected: true,
        progress: 0,
        state: 'ok',
        ...extra,
      };
      w.buildings[b.id] = b;
      forceGrass(w, x, y);
      w.tiles[idx(w, x, y)]!.buildingId = b.id;
      return b;
    };
    const f = put('fisher', k.x + 4, k.y - 6, { level: 2 });
    expect(hoverInfo(w, f, 0, none)!.title).toBe('Fischerhütte, Stufe 2 · Auslastung 100 %');
    expect(hoverInfo(w, f, 0, none)!.lines[0]).toBe('arbeitet — 25 Nahrung / min');
    const half = put('fisher', k.x + 6, k.y - 6, { eff: 128_000 });
    expect(hoverInfo(w, half, 0, none)!.title).toBe('Fischerhütte, Stufe 1 · Auslastung 50 %');
    expect(hoverInfo(w, put('chapel', k.x + 8, k.y - 6), 0, none)!.title).toBe('Kapelle');
  });
});
```

**Umschreibung M10:AK-U3-02** (`tests/ui/hover.test.ts:87–117`, Anhang 02 D): Name endet auf „(10 Fälle) (M11 S3)";
Zeile 93 `raw(w, 'lumberjack', ...p(4, 6))` → `raw(w, 'lumberjack', ...p(4, 6), 'noForest')`; Zeile 106
`.toContain('kein Wald mehr in der Nähe')` → `.toContain('Kein freier Wald in der Nähe')`. Sonst nichts ändern.

- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/ui/inspect.test.ts tests/ui/hover.test.ts tests/ui/hints.test.ts`.
- [ ] **Schritt 3: Umsetzung.**
  - `inspect.ts` (rein, exportiert): `levelText(b)` = „Stufe {b.level ?? 1}" nur mit `LEVELS[b.defId]`, sonst `null`;
    `utilizationText(b)` = „Auslastung {Math.floor(u / 10)} %" mit `u = utilization(b)`, `null` ohne `produces`;
    `interface UpgradeView { title; cost; fee; preview: string; reasons: string[]; ok: boolean }`;
    `upgradeView(world, b): UpgradeView | null`:
    1. kein `LEVELS`-Eintrag → `null`; `lvl = b.level ?? 1`; bei 3 → `{ title: 'Höchste Stufe', cost: '', fee: '', preview: '', reasons: [], ok: false }`;
    2. `functionLock(world, lvl === 1 ? 'upgrade2' : 'upgrade3') !== null` → `null` (verborgen, Spec 7);
    3. `next = LEVELS[b.defId]![lvl - 1]`; `cost` = „Kosten {costLine(next.cost)}"; `fee` = „Gebühr {amount} {GOODS[good].name}";
       `preview` = „Ausstoss {perMinute(1, cycleOf(b))} → {perMinute(1, next.cycle)} / min · Unterhalt
       {perMinute(upkeepOf(b), UPKEEP_INTERVAL)} → {perMinute(next.upkeep, UPKEEP_INTERVAL)} / min";
    4. Gründe aus einem Probelauf auf einer flachen Kopie: `const probe = { ...world, stock: { ...world.stock },
buildings: { ...world.buildings, [b.id]: { ...b } } }; const r = upgradeBuilding(probe, b.id);` →
       `reasons = r.ok ? [] : [`✗ ${friendlyReason(world, r.reason, { cost: next.cost })}`]`, `ok = r.ok`. Der Test
       „Vorschau ändert die Welt nicht" sichert, dass `upgradeBuilding` nur `money`, `stock` und das Gebäude schreibt;
       wird er rot, statt der Kopie `structuredClone(world)` nehmen und im Bericht melden.
  - `renderInspect` Betriebszweig (nach Zustand und Abhilfe): `addLine(panel, '', 'level')` (nur mit `LEVELS`-Eintrag),
    `addLine(panel, '', 'utilization')` (nur mit `produces`); nach dem Unterhalt ein `div.upgrade` mit `data-field=
"upgrade-box"`: `h3[data-field=level-title]`, Zeilen `level-cost`, `level-fee`, `level-preview`, Liste
    `level-reasons` (`setList`, `ok: false`), Knopf „Ausbauen" (`data-field="upgrade"`, ruft `actions.upgrade(id)`).
  - `updateInspect`: Texte setzen; Box `hidden`, wenn `upgradeView` `null`; bei „Höchste Stufe" Kosten, Gebühr,
    Vorschau und Knopf `hidden`; Knopf bleibt klickbar und trägt `unaffordable`, wenn `!ok` (wie die Bauleiste).
  - `InspectActions.upgrade(id: number): void`; `app.ts`: `const r = upgradeBuilding(world, id)`; ok → `sound.play('build')`,
    sonst `showError(friendlyReason(world, r.reason, { cost }))` mit `cost` = Kosten der nächsten Stufe aus `LEVELS`; `refresh()`.
  - `hover.ts` `workshopInfo`: Titel `` `${def.name}, ${levelText(b)} · ${utilizationText(b)}` ``, wenn `levelText(b)`
    nicht `null`, sonst `def.name`; neuer Zweig `else if (b.state === 'noForest') lines.push(stateInfo(b, world.tick).text)`;
    den Holzfäller-Block `:127–134` streichen (ungenutzte Importe entfernen).
  - `hints.ts` `REASON_TABLE`: `{ source: 'upgrade', pattern: /^Kann nicht ausgebaut werden$/, show: same }`,
    `{ source: 'upgrade', pattern: /^Gebäude brennt$/, show: same }`.
- [ ] **Schritt 4: Grün.** `npx vitest run tests/ui` · `npx tsc --noEmit` · `make check` · Testzählbefehl
      (`inspect.test.ts` +2, `hover.test.ts` +1, `hints.test.ts` +1). Kein Text mit „Tick" (`tests/ui/time.test.ts` grün).
- [ ] **Schritt 5: Doku.** `README.md` „Wirtschaft", Punkt Info-Panel: Stufe, Auslastung, Ausbau-Abschnitt;
      „Produktionsketten": Absatz **Ausbau** (ab U3 Stufe 2 gegen Kosten und 2–3 Stoff, ab U5 Stufe 3 gegen Rum; Zyklus
      etwa × 0,6 bzw. × 0,4, Unterhalt × 1,3 bzw. × 1,7; die Kette gemeinsam ausbauen; Abriss erstattet die Hälfte von
      Bau- und Stufenkosten ohne Gebühr) und **Auslastung** (gleitender Anteil der Zeit, in der der Betrieb arbeitet).
      Werte nur aus `src/sim/defs/levels.ts` übernehmen. `docs/arc42.md` §5 Zeilen `inspect.ts` (Stufe, Auslastung,
      `upgradeView`) und `hover.ts` (Titel mit Stufe und Auslastung, `noForest`).
- [ ] **Schritt 6: Commit und Push.**

```bash
git add src/ui tests/ui/inspect.test.ts tests/ui/hover.test.ts tests/ui/hints.test.ts README.md docs/arc42.md
git commit -m "feat: M11-U2 Betriebs-Panel mit Stufe, Auslastung und Ausbau, Mouse-over mit Stufe (Spec 7)"
git -C .worktrees/m11-ui push -u origin feat/m11-ui
```

### Rot-Beleg

| AK / Test         | Erwartete Meldung vor der Umsetzung                                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------------- |
| AK-UI-03          | `TypeError: … utilizationText is not a function`                                                                  |
| AK-UI-04 (Panel)  | `TypeError: … upgradeView is not a function`                                                                      |
| AK-UI-04 (Gründe) | `Kann nicht ausgebaut werden: expected false to be true`                                                          |
| AK-UI-08          | `expected 'Fischerhütte' to be 'Fischerhütte, Stufe 2 · Auslastung 100 %'`                                        |
| AK-U3-02 (M11 S3) | `expected [ 'arbeitet — 20 Holz / min', 'kein Wald mehr in der Nähe' ] to include 'Kein freier Wald in der Nähe'` |

### Geänderte bestehende Tests

| Test                                              | Zeile       | Umschreibung                                            |
| ------------------------------------------------- | ----------- | ------------------------------------------------------- |
| `tests/ui/hover.test.ts` :: AK-U3-02 … (10 Fälle) | 87, 93, 106 | Zustand `noForest` statt Live-Rechnung; Name „(M11 S3)" |

### Browser-Check (qa-playtester; Szene `m11-ausbau` aus B1)

Playtester-Briefing (Pflicht): eigener Vite-Port je Check (`npx vite --port <frei, z. B. 5200 + Task-Nr.> --strictPort`), Port im Bericht nennen; nach dem Check den Server beenden (Teardown: PID/Port schliessen, Chrome-Instanz beenden, `git worktree remove` des QA-Baums) und im Bericht bestätigen.

1280 × 800 und 1920 × 1080. **AK-UI-04:** Fischer Stufe 1 anklicken → `level-title` „Ausbau zu Stufe 2", Kosten, Gebühr,
Vorschau „Ausstoss 15 → 25 / min"; „Ausbauen" → `world().buildings[id].level === 2`; Fischer Stufe 3 → „Höchste Stufe";
`world().stock.cloth = 0` → „✗ Zu wenig Stoff". **AK-UI-08:** Mouse-over Fischer Stufe 2 → Titel wörtlich.
**AK-UI-10:** Panel Stufe 2/3 „Erzeugt Nahrung alle 3 s"/„alle 2 s", `upkeep` „Unterhalt 42 / min"/„54 / min",
Balken 50 % bei `progress` 12 (pausiert gesetzt), Mouse-over „25 Nahrung / min", Bauleisten-Tooltip Fischer weiter
„Erzeugt: Nahrung 15 / min". **Ohne B1-Szene** (Test-Aufbau über Dev-Werkzeuge, nur für diesen Check): neues Spiel,
pausieren, dann in der Konsole

```js
const w = __inselDev.world();
const { placeBuilding } = await import('/src/sim/build.ts');
const { upgradeBuilding } = await import('/src/sim/upgrade.ts');
Object.assign(w, { money: 5000, unlocked: ['U0', 'U1', 'U2', 'U3', 'U4', 'U5'] });
Object.assign(w.stock, { cloth: 10, rum: 10, wood: 60, tools: 20 });
const k = w.buildings[w.kontorId],
  ids = [];
for (let d = 2; d < 12 && ids.length < 3; d++)
  for (const [x, y] of [
    [k.x + d, k.y - 3],
    [k.x - d, k.y + 3],
    [k.x + d, k.y + 3],
  ])
    if (ids.length < 3) {
      const r = placeBuilding(w, 'fisher', x, y);
      if (r.ok) ids.push(r.id);
    }
upgradeBuilding(w, ids[1]);
upgradeBuilding(w, ids[2]);
upgradeBuilding(w, ids[2]);
```

und die Kacheln aus `ids` per `centerOn`/`tileCenter` anfahren (Prüfpunkte im Bericht nennen).

### Risiken/Randfälle

- `upgradeView` je Panel-Takt: flache Kopie statt Volltiefe; reicht nur, solange `upgradeBuilding` keine weiteren
  Weltfelder schreibt (Test sichert es).
- Ein abgerissener Betrieb mit offenem Panel: `app.ts` schliesst das Panel wie bisher (`refresh`).
- Höhe des Panels wächst um 5 Zeilen; bei 1280 × 800 auf Überlauf (`scrollHeight`) achten.
