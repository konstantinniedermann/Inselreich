> **Task-ID:** T04 (Paket M11-P2A) — Teil 2 von 2
> **AK-IDs:** AK-P2S2-01 … -05; AK-UNL-01, -02, -05
> **blocked-by:** T03 (Review OK)
> **Strang:** `feat/m11-sources` · Worktree `.worktrees/m11-sources`
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-07](orga-07-datei-ownership.md) · [orga-12](orga-12-geaenderte-tests.md)
> **Teile:** [T04a-quellen.md](T04a-quellen.md) · **T04b-quellen.md** (diese)

- [ ] **Schritt 1 (Fortsetzung): Freischalt-Tests.**

`tests/sim/unlocks.test.ts`, neuer Block `describe('M11 Freischaltung Jagdhütte, Rinderfarm, Ausbau (Spec 4)')` (Endzustand
inkl. P1-Anteil aus T01):

```ts
it('AK-UNL-01 U2 hunter, U3 cattlefarm und upgrade2, U5 upgrade3; jede Id und Funktion genau einmal; Labels', () => {
  expect(row('U2').buildings).toEqual([
    'hunter',
    'quarry',
    'sheepfarm',
    'weaver',
    'chapel',
    'firestation',
  ]);
  expect(row('U3').buildings).toEqual(['cattlefarm', 'townhall']);
  expect(row('U3').functions).toContain('upgrade2');
  expect(row('U5').functions).toContain('upgrade3');
  const all = UNLOCKS.flatMap((u) => u.buildings);
  for (const id of BUILDING_IDS.filter((b) => b !== 'kontor'))
    expect(
      all.filter((b) => b === id),
      id,
    ).toHaveLength(1);
  const fns = UNLOCKS.flatMap((u) => u.functions);
  for (const f of Object.keys(FUNCTION_LABELS))
    expect(
      fns.filter((x) => x === f),
      f,
    ).toHaveLength(1);
  expect(FUNCTION_LABELS.upgrade2).toEqual(['Ausbau Stufe 2']);
  expect(FUNCTION_LABELS.upgrade3).toEqual(['Ausbau Stufe 3']);
});
it('AK-UNL-02 neue Welt: Jagdhütte erst mit U2, Rinderfarm erst mit U3 (lockText), danach baubar', () => {
  // hunterSite/farmSite auf createWorld(3) (ohne unlockAll); canPlace → { ok: false, reason: unlockText(row('U2'), 'lockText') }
  // bzw. U3; w.unlocked = ['U0', 'U2'] → hunter ok, cattlefarm weiter U3-Grund; ['U0', 'U2', 'U3'] → beide ok
});
it('AK-UNL-05 Tipps U2, U3, U5 enthalten die Sätze aus Anhang 01 A.5; kein Text mit „Tick"', () => {
  expect(row('U2').tip).toContain(
    'Die Jagdhütte liefert Nahrung aus dem Wald; sie braucht 10 freie Waldfelder im Umkreis.',
  );
  expect(row('U3').tip).toContain('Die Rinderfarm braucht viel freie Weide.');
  expect(row('U3').tip).toContain('Betriebe lassen sich jetzt gegen Stoff ausbauen.');
  expect(row('U5').tip).toContain('Ausbau Stufe 3 kostet Rum.');
  for (const u of UNLOCKS)
    for (const k of ['tip', 'lockText', 'whenText', 'notice'] as const)
      expect(u[k]).not.toMatch(/Tick/);
});
```

- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/sim/sources.test.ts tests/sim/placement.test.ts tests/sim/defs.test.ts tests/sim/unlocks.test.ts -t "M11"`:

- AK-P2S2-01: `expected undefined to deeply equal { id: 'hunter', … }`
- AK-P2S2-02…05: `TypeError: Cannot read properties of undefined (reading 'maxCount')` in `canPlace` (`hunter` fehlt); -05: Text „Zu wenig Weide in der Nähe" grün, Fall „Weg auf Weide" grün → **-05 rot nur über den Zusatz** `expect(siteRuleOk).toBeTypeOf('function')` (Import aus `placement.ts`)
- AK-UNL-01: `expected [ 'quarry', … ] to deeply equal [ 'hunter', 'quarry', … ]`
- AK-UNL-02: `TypeError … (reading 'maxCount')` statt U2-Grund
- AK-UNL-05: `expected '…' to contain 'Die Jagdhütte liefert Nahrung …'`

- [ ] **Schritt 3: Umsetzung.**
  - `types.ts`: `BuildingDefId` endet `| 'townhall' | 'hunter' | 'cattlefarm';` (sonst nichts; `free?` liegt seit T01).
  - `defs/buildings.ts`: `hunter`, `cattlefarm` **direkt nach `fisher`** einfügen, Felder exakt wie AK-P2S2-01
    (`flammable: true` beide, `stormAffected: true` nur `cattlefarm`).
  - `placement.ts`: `checkRule` → `export function siteRuleOk(world, defId, x, y, rule): Result` (Parameterfolge Anhang 01 C;
    Aufruf in `canPlace` anpassen). Fall `radius`: `rule.free === true` → zählen nur Kacheln im Radius mit `terrain === rule.terrain`,
    `buildingId === null`, `!road` und nicht in `footprint(def, x, y)`; sonst `countTerrain` wie heute. Grund:
    `radiusReason(terrain, free)` → mit `free` „Zu wenig freier Wald in der Nähe" / „Zu wenig freie Weide in der Nähe", ohne die
    alten Texte. Probe: Live-Zählung und Bauzählung sind gleich, weil der eigene Grundriss im Betrieb `buildingId` trägt.
  - `defs/unlocks.ts`: U2 `buildings: ['hunter', 'quarry', 'sheepfarm', 'weaver', 'chapel', 'firestation']`; U3
    `buildings: ['cattlefarm', 'townhall']`; U2-`tip` + „ Die Jagdhütte liefert Nahrung aus dem Wald; sie braucht 10 freie
    Waldfelder im Umkreis."; U3-`tip`: „ Die Rinderfarm braucht viel freie Weide." **vor** dem T01-Satz.
  - **Minimal-Eingriff** `src/ui/goal.ts:97`: `const withKey = (id) => { const k = hotkeyLabel({ kind: 'build', defId: id }); return k === null ? BUILDING_DEFS[id].name : \`${BUILDING_DEFS[id].name} (${k})\`; };` Grund: sonst zeigt die
    Freischalt-Meldung „Jagdhütte (null)" (Probe); T12 vergibt Y und zieht die Tests nach.
  - `tests/sim/scenarios.ts` `galerie` (Probe grün): nach `put(w, 'townhall', …)`: `roadCol(w, kx + 2, ky - 5, ky - 1); roadRow(w, kx + 3, kx + 11, ky - 5);` Wald `x = kx+2 … kx+5`, `y = ky-9 … ky-6` ausser `(kx+3, ky-6)`;
    `put(w, 'hunter', kx + 3, ky - 6); put(w, 'cattlefarm', kx + 8, ky - 7);` (12 freie Waldkacheln, auch nach T05 `ok`).

**Geänderte bestehende Tests** (Name + „(M11 S2)", nur Erwartungen, Probe auf M10-Code gemessen; Zeilen Ist M10):

- `defs.test.ts` :: has 14 building defs… (`:13`): Länge 17 → 19
- `fire.test.ts` :: AK-S2-10 (`:295`): Brennbar-Liste + `'cattlefarm'`, `'hunter'` (sortiert)
- `glassworks.test.ts` :: AK-S2-01 (`:69`): 13 → 15 brennbare Ids
- `storm.test.ts` :: AK-S3-01 (`:90`): sturmanfällig + `'cattlefarm'`
- `townhall.test.ts` :: AK-S2-01 (`:54`): U3 `buildings` → `['cattlefarm', 'townhall']`
- `unlocks.test.ts` :: AK-S1-01 (`:50`, `:56`), AK-S1-10 (`:218`, `:225`): U2/U3-Listen wie AK-UNL-01; `names` beginnen mit `'Jagdhütte'`
- `tooltip.test.ts` :: M8 14.2 (`:109`), AK-U1-01 (`:134`), AK-U4-04 (`:233`): Produktion 8 → 10, 9 → 11; U0+U2 5 → 6, U3 neu 7, U4 7 → 9, U5 8 → 10, U6/alles 9 → 11; `fresh` beginnt mit `'hunter'`
- `goal.test.ts` :: AK-U1-08 (`:161`): U2-Meldung „Neu: Jagdhütte, Steinbruch (B), …"; U3 „Neu: Rinderfarm, Amtsstube (I), …"
- `startCard.test.ts` :: AK-U2-01 (`:86`): `help-next` „Jagdhütte, Steinbruch, … — sobald …"
- `buildSounds.test.ts` :: deckt alle Gebäude-Ids… (`:68`): `hunter`, `cattlefarm` prüfen `buildGroupName(id) === BUILD_FALLBACK` (`src/audio` bleibt unverändert, Spec 3.1); übrige wie bisher
- `sprites.test.ts` :: AK-R2-03 jede heutige Id… (`:478`): ohne `hunter`, `cattlefarm` (Kommentar „Silhouetten in R2; R2 entfernt den Filter")

Die beiden `galerie`-Tests in `scenario-saves.test.ts` werden über `scenarios.ts` grün (Test unverändert).

- [ ] **Schritt 4: Grün.** `npx vitest run tests/sim tests/ui tests/audio tests/render`; `npx tsc --noEmit`; `make check`;
      Balancing unverändert: `git diff <T03-SHA> -- tests/sim/balance*.test.ts` leer und grün (Controller baut die neuen
      Gebäude nie); Testzählbefehl aus index.md (je Datei nachher ≥ vorher).
- [ ] **Schritt 5: Doku.** `docs/arc42.md`, Bausteintabelle Zeile `placement.ts`: „`siteRuleOk` (exportiert, für die
      Live-Prüfung in `production.ts`); Regelfeld `free` zählt nur freie Kacheln ausserhalb des eigenen Grundrisses".
- [ ] **Schritt 6: Commit und Push.**

```bash
git add src/sim src/ui/goal.ts tests docs/arc42.md
git commit -m "feat: M11-P2A Jagdhütte, Rinderfarm, Regelfeld free, U2/U3 (Spec 3.3, 4)"
git -C .worktrees/m11-sources push -u origin feat/m11-sources
```

**Risiken/Randfälle:**

- **Spec-Widerspruch AK-P2S2-01:** `GOODS.food.sell` = 3 ist **nicht** < Unterhalt je Nahrung (2,0 / 2,5 / 2,0). Der Test
  pinnt die Werte; `goods.ts` bleibt unverändert (Global Constraints). Entscheid L0 (Schlussbericht).
- Ownership: `tests/ui/{goal,startCard,tooltip}.test.ts`, `src/ui/goal.ts` (T04) und `src/ui/hints.ts` (T05) gehören in
  W4 nur diesem Strang; T10 (`feat/m11-ui`) darf sie nicht ändern, sonst Konflikt beim Merge nach T09.
- `hunterSite`-Rechnung hängt an `tilesInRadius` (Mitte `x + 0,5`); der Test zählt die Vorbedingung selbst.
- Jagdhütten in Tests immer mit 10 freien Waldkacheln anlegen: ab T05 werden sie sonst `noForest`.
