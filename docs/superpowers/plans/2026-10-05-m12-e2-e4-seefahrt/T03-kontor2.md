> **Task-ID:** T03 · **AK-IDs:** AK-E2-01, AK-E2-02, AK-E2-03 (Sim-Teil), AK-E2-12, AK-E2-13
> **blocked-by:** T02 · **Strang:** e2, `feat/m12-see-e2` (von `feat/m12-see` nach T02), Worktree
> `.worktrees/m12-see-e2` · `tech-sim-engineer` (sonnet)
> **Regeln:** Spec §6, Anhang 03 C.2, C.3; F-P8 (Abriss erstattet die Hälfte ins Heimatlager); Index P-6

## T03: Kontor II gründen, auf Fremdinseln bauen, Kontor II abreissen

**Ziel:** Mit `seafaring` gründet der Spieler auf A oder B ein `kontor2` mit Kosten aus dem Heimatlager; danach baut
er dort wie in der Heimat aus dem Insellager. Abriss ist gesperrt, solange Schiffe die Insel brauchen.

**Code-Fakten:** `placement.ts` `canPlace(world, defId, x, y, island = HOME)`; `build.ts` `placeBuilding(…, island)`,
`placeRoad(…, island)`, `demolish(world, id)`; `forest.ts` `canClearForest`/`canPlantForest(…, island)`; `world.ts`
`checkAfford(world, isl, cost)`, `pay`, `grantRefund`, `isKontor`; `queries.ts` `effectiveRefund`; `roads.ts`
`kontorRoadRoots(world, island)`; `supply.ts` `supplyBuildings(world, island)`; `unlocks.ts` `functionLock`;
`islands.ts` `islandName`. Testwelt: `tests/sim/seaHelpers.ts`.

**Dateien:** `src/sim/placement.ts`, `build.ts`, `world.ts` (nur `checkAfford`-Zusatz), `roads.ts`, `supply.ts`,
`forest.ts` (nur Kontor-Gate); neu `tests/sim/kontor2.test.ts`.

## Regeln (verbindlich)

1. **Reihenfolge in `canPlace`** für `island ≥ 1`: (a) `defId === 'kontor2'` und `functionLock(world, 'seafaring')`
   → **„Seefahrt mit den Kaufleuten"** (vor dem allgemeinen `buildLock`); (b) `defId !== 'kontor2'` und
   `islands[island].kontorId === null` → **„Erst ein Kontor auf dieser Insel"**; dann wie heute (Freischaltung,
   Platzregeln, Kosten). Auf der Heimat ändert sich nichts.
2. **Kosten:** `kontor2` prüft und zahlt Waren aus `home(world).stock` (Geld global); Grund **„Nicht genug <Gut> in
   der Heimat"**. Jeder andere Bau auf `island ≥ 1` zahlt aus `islands[island].stock`; Grund **„Nicht genug <Gut> auf
   <Name>"**. Auf der Heimat bleibt der heutige Text. Umsetzung: `checkAfford(world, isl, cost, where?: string)` hängt
   `where` an den Grund an; ohne `where` unverändert.
3. **Wege und Forst** auf `island ≥ 1` ohne Kontor (`placeRoad`, `clearForest`, `plantForest`): Grund (b).
4. **Gründen:** `placeBuilding` setzt bei `kontor2` `islands[island].kontorId = id`; das vorhandene Insellager bleibt
   (übernimmt ein früheres); `recomputeConnectivity`. Anbindung über Wege zum Kontor der eigenen Insel; Versorgung
   (`supplyRadius 8`) über `supplyBuildings(world, island)` mit `isKontor` statt `=== 'kontor'`.
5. **Abriss `kontor2`:** gesperrt (Grund **„Erst Route auflösen"**), wenn ein Schiff `route.a === i` oder
   `route.b === i` oder `to === i` hat. Sonst wie heutiger Abriss: Erstattung (`effectiveRefund`, Hälfte) ins
   **Heimatlager**, `kontorId = null`, Insellager bleibt, Gebäude der Insel bleiben stehen und werden durch
   `recomputeConnectivity` `notConnected`. Ein Schiff mit `port === i` sperrt nicht. Heimat-`kontor` bleibt unabreissbar.
6. `grep -rn "'kontor'" src/sim` — jede Stelle prüfen: „ein Kontor" → `isKontor`; „das Heimatkontor" bleibt.

## Schritte

- [ ] **1 Tests zuerst** `tests/sim/kontor2.test.ts`, `describe('M12 E2 Kontor II')`; Welt `seaWorld()`, Insel B = 2:
  - **AK-E2-01** ohne `unlockAll` (U6 nicht erreicht): `canPlace(w, 'kontor2', site, 2)` → „Seefahrt mit den
    Kaufleuten"; mit `unlockAll`: `placeBuilding` `ok`, Geld −800, Heimat Holz −20, Werkzeug −8, Stein −10, Lager B
    unverändert, `islands[2].kontorId` = neue Id; zweites `kontor2` auf B → „Auf dieser Insel steht schon ein Kontor";
    auf der Heimat → „Nur auf einer fernen Insel".
  - **AK-E2-02** B ohne Kontor: `lumberjack`, `placeRoad`, `plantForest` → „Erst ein Kontor auf dieser Insel"; nach
    Gründung und Lager B Holz/Werkzeug 50: Holzfäller zahlt aus Lager B (Heimat unverändert); Weg vom Holzfäller zum
    `kontor2` → `connected true`; dieselben Koordinaten-Wege auf der Heimat binden ihn nicht an.
  - **AK-E2-12** Heimat Stein 9, Lager B Stein 10 → „Nicht genug Stein in der Heimat"; `serialize` vorher = nachher.
  - **AK-E2-13** nach Gründung, Lager B leer, Heimat Holz 100 → Holzfäller auf B → „Nicht genug Holz auf Felsbucht".
  - **AK-E2-03 (Sim)** (a) Schiff (`shipLiteral`) mit Route `{a: 0, b: 2}` → `demolish(kontor2)` „Erst Route
    auflösen"; (b) Route `null`, `to: 2` → gleich; (c) ohne Bezug: `ok`, Heimatlager + Hälfte der Kosten
    (`effectiveRefund`), Lager B unverändert, `kontorId null`, Holzfäller auf B `connected false`; neues `kontor2` →
    übernimmt Lager B (Bestand gleich); (d) **R228 (1):** Schiff `port 2`, `to 0`, `left 10`, `route null`,
    `homing true` → Abriss `ok` (Speichern/Laden dieses Falls in T14).
  - Heimat bitgleich: Bauen auf Insel 0 gibt dieselben Gründe wie vorher (drei Stichproben mit Text).
- [ ] **2 Rot-Beleg** `npx vitest run tests/sim/kontor2.test.ts` → Commit `test: M12 E2 Kontor II (rot)`.
- [ ] **3 Umsetzung** nach „Regeln".
- [ ] **4 Prüfen:** Bitgleich (AK-M12-B1…B4; `balance-merchants [6750, 11200, 320]`), `make check`,
      `CI=true make check` → Commit `feat: M12 E2 Kontor II gründen, bauen, abreissen`.

**Review-Fokus:** Reihenfolge der Gründe; Kosten des `kontor2` nie aus dem Insellager; Abriss-Sperre liest nur
`ships`; Heimat-Texte unverändert; `isKontor` nur, wo „ein Kontor" gemeint ist.
