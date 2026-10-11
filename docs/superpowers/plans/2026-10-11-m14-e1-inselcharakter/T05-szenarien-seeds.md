# T05 · Seed-Läufe C, Controller-Test, Szenario-Stände, Fixture-Slot (TDD)

Strang SIM · Worktree `.worktrees/m14-e1` · Umsetzer `tech-sim-engineer` (sonnet) · AK-M14E1-13, -14, -16, -18,
Stände für -34 … -41 · Auflagen QA-B3 (Controller-Test), QA-B11 (Fixture-Slot Pflicht) · blocked-by T04 (gleicher
Baum, seriell) · ≈ 40 Tools · Spec §6.1, §10.2, §10.4, Anhang 02 E

## Files

- Modify: `tests/sim/islands-seeds-a.test.ts`, `tests/sim/islands-seeds-b.test.ts` (AK-13, -14, -16 im
  bestehenden Seed-Durchlauf aus T01, kein zweites `createWorld` je Seed), `tests/sim/scenarios.ts` (vier Stände),
  `tests/sim/scenario-saves.test.ts` (nur falls die Liste der Stände dort steht).
- Create: `tests/sim/islandTraits-controller.test.ts`, `tests/sim/fixtures/save-v12-felsbucht.json`.

## Schritte

- [ ] 0. `grep -n "m13-vor-ziel\|SCENARIOS\|writeScenarios\|writeExtraSaves" tests/sim/scenarios.ts`;
      `grep -n "runMerchants\|startColony\|buildColony" tests/sim/balance-merchants.test.ts`.
- [ ] 1. Rote bzw. neue Tests:
  - **AK-13/-14** (Seed-Dateien, Blöcke je 100 Seeds über 1…1000, dazu 963): `createWorld(seed)` wirft nicht,
    `islands.length === 4`, Insel 3 `'C'` 24 × 24; Seeweg 0–3 in [30, 35] für alle Seeds, deren `onStage` für C
    Stufe 1 oder 2 meldet; Zahl der Seeds mit Stufe 3 ≤ 3 (gemessen 1: Seed 963). Die Stufe liefert ein zweiter Aufruf
    `generateForeignIslands(seed, homeLayout, { onStage })` mit der Heimat-Lage aus der Welt.
  - **AK-16** (Seeds 1…300 und `failShapes`): keine Kachel `mountain` auf C; ≥ 6 freie Plätze nach
    `PLANTATION_SITE` (Helfer `plantationSites` aus `seaHelpers.ts`).
  - **QA-B3** (`islandTraits-controller.test.ts`): Controller wie `balance-merchants.test.ts` (`startColony`,
    `runMerchants`, ohne Änderung an `controller.ts`/`merchantsController.ts`) für Seed 3 und Seed 963 (zwei
    unabhängige Fremdinsel-Lagen, E7): am Ende `islands[2].kontorId === null`, `islands[3].kontorId === null`, kein
    Gebäude mit `island ≥ 2`, keine Route mit Insel 2 oder 3.
  - **AK-18:** im Bericht `git diff 9113e574 -- 'tests/sim/balance*.test.ts' tests/sim/e0Pins.ts tests/sim/e1Pins.ts
tests/sim/seePins.ts; echo EXIT=$?` leer, Exit 0.
- [ ] 2. Szenario-Stände in `scenarios.ts` (Spec §10.4, Namen fest): `m14e1-start` (Seed 3, `unlockAll`, Geld
      20 000, keine Fremdkontore), `m14e1-felsbucht` (plus Kontor II Felsbucht, 1 Steinbruch und 1 Glashütte angebunden,
      Lager Felsbucht Stein 20, Holz 20), `m14e1-weidenau` (Kontor II Weidenau, 1 Zuckerrohrplantage, 1 Schäferei),
      `m14e1-altstand` (`foldBackToV12(serialize(m14e1-felsbucht))`, also v12 mit 3 Inseln). Die Stände laufen über
      `writeScenarios`/`writeExtraSaves` wie die übrigen Browser-Szenarien.
- [ ] 3. **QA-B11:** `m14e1-altstand` zusätzlich als Datei `tests/sim/fixtures/save-v12-felsbucht.json` ablegen
      (einmal erzeugt, dann fest); Test: Datei lädt als v13, 4 Inseln, Felsbucht-Betriebe mit `cycleOf` 30 bzw. 25,
      Weidenau ohne Kontor; und Datei gleich der Rückfaltung des Rezepts (`JSON.stringify`), damit beide nicht auseinanderlaufen.
- [ ] 4. `npx vitest run tests/sim/islands-seeds-a.test.ts tests/sim/islands-seeds-b.test.ts
tests/sim/islandTraits-controller.test.ts tests/sim/scenario-saves.test.ts; echo EXIT=$?`. `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`.
      Commit `test: Seed-Läufe C, Controller-Test, Szenarien (M14-E1 T05)`.

## Testzeit (Budget, R392)

- AK-13/-14 im Seed-Durchlauf von T01: + ein `generateForeignIslands` je Seed; Budget je Block weiter 3 s
  (Messung: [testzeiten.md](testzeiten.md)). Überschreitet ein Block 3 s, Rückfall E8 (nur `generateForeignIslands` mit
  Heimat-Lage aus `generateMap`), im Bericht nennen.
- AK-16 in den Blöcken 1…3 von `islands-seeds-a`, im selben Budget.
- QA-B3: zwei Controller-Läufe; Budget zusammen ≤ 2,5 s (`balance-merchants.test.ts` ≈ 1 s je Lauf, [testzeiten.md](testzeiten.md)). Ist das zu teuer, bleibt nur Seed 3 (Pflicht aus QA-B3); der Controller begründet das im Bericht und nennt es
  als Risiko (ein Lauf, R553 V1; Rückfall: Seed 963 in den nächtlichen bzw. vollen Lauf).
