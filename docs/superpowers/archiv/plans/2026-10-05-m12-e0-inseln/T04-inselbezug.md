> **Task-ID:** T04 · **AK-IDs:** AK-E0-10, AK-E0-11, AK-E0-14, AK-E0-21
> **blocked-by:** T03 · **Strang:** `feat/m12-e0`, Worktree `.worktrees/m12-e0` · `tech-sim-engineer` (sonnet)
> **Regeln:** [index.md](index.md) Global Constraints, Entscheide P-2, P-15 · Spec §4.2 R-E0-2 … R-E0-5, Anhang 01 F

## T04: Inselbezug je Zugriff

**Ziel:** Jede Regel liest und schreibt die richtige Insel. Mit einer Insel bleibt alles bitgleich; die Testwelt
mit zwei Inseln (nur im Speicher) zeigt, dass keine Regel über Inselgrenzen greift.

**Code-Fakten (nach T03):** `home(w)`/`islandOf(w, b)` vorhanden; bis hier verwenden Bauplatz, Weg, Handel überall
`home(w)`. `roads.ts` `kontorRoadRoots`/`reachableRoads` arbeiten auf einem Raster; `recomputeConnectivity` setzt
`connected` für alle Gebäude. `supply.ts` `supplyBuildings`, `inSupplyRange`; `population.ts:61`
`serviceAvailable` (naiv, alle Gebäude); `crises.ts` `flammableRect`, `fireTarget`, `isProtected`; `flow.ts`
`goodsBalance`; `orders.ts` `deliverOrder`; `placement.ts` `maxCount` zählt global (bleibt, R-E0-4). Nach dem
H-U1-Merge auch `src/sim/connect.ts` (Pfadsuche Anbinden) auf dem Raster der Gebäude-Insel.

**Dateien:** `src/sim/build.ts`, `placement.ts`, `roads.ts`, `supply.ts`, `population.ts`, `production.ts`,
`trade.ts`, `orders.ts`, `flow.ts`, `crises.ts`, `forest.ts`, `queries.ts`, `upgrade.ts`, ggf. `connect.ts`;
`tests/sim/helpers.ts` (`twoIslandWorld`), `tests/sim/islands.test.ts`. UI/Render nur, falls ein Aufruf durch eine
Signatur bricht (dann Standardwert nutzen, keine Logik).

## Regeln (verbindlich)

- **Letzter Parameter `island = HOME`** (Typ `number`): `placeBuilding`, `placeRoad`, `removeRoad`, `canPlace`,
  `canPlaceRoad`, `siteRuleOk`, `buy`, `sell`, `canClearForest`, `canPlantForest`, `clearForest`, `plantForest`,
  `placementZone`, `coverageMask`. `placeBuilding` setzt `island` im Literal; Raster und Lager über
  `w.islands[island]`; ungültiger Index → `fail('Unbekannte Insel')`, nie werfen.
- **Mit Gebäude → `b.island`:** `demolish`, `upgradeBuilding`, Produktion (`addStock`/`takeStock`, `forestOk`),
  Hausbedarf (`consume`), `upgradeStatus`/`tryUpgrade` (Waren der Hausinsel, Geld global), `missingInputs`,
  `houseDiagnosis`, `isSupplied`, `serviceAvailable`, `isProtected` (nur Wachen mit `s.island === b.island`).
- **Versorgung und Dienste:** `supplyBuildings(world, island)` = Kontor **dieser Insel** (`islands[i].kontorId`) und
  angebundene Märkte mit `b.island === island`; `inSupplyRange(world, island, cx, cy)`; `serviceAvailable` filtert
  `b.island === house.island` (naiv, Index folgt in T05).
- **Wege:** `kontorRoadRoots(world, island)`, `reachableRoads(world, island)`; `recomputeConnectivity` berechnet je
  Insel einmal das Set und setzt `connected` je Gebäude aus dem Set seiner Insel; Reihenfolge der Gebäude-Schleife
  bleibt global nach Id.
- **Heimat (P-15):** `deliverOrder` aus `home(w).stock`; `goodsBalance` zählt nur `b.island === HOME` und prüft
  Versorgung auf `HOME`; `flammableRect` und `fireTarget` nur `HOME`; `layoutKey` alle Inseln in Indexfolge ohne
  Trenner.
- **Global (R-E0-4):** `citizens`, `merchants`, `populationByTier`, `maxHouseTier`, Freischalt-Auslöser, `taxUnits`,
  `totalUpkeep`, `maxCount` — keine Änderung.
- Tick-Reihenfolge und Schleifen über `Object.values(world.buildings)` bleiben global in Id-Reihenfolge (R-E0-2).

## Schritte

- [ ] **0 Basis:** Controller hat `main` gemerged, falls dort neue REL-03-Commits liegen (H-U1 seit T01 im Baum); `npx tsc --noEmit` grün.
- [ ] **1 Helfer** `twoIslandWorld()` in `tests/sim/helpers.ts` nach Anhang 01 F (Insel 1 = Kopie der Heimat-Kacheln
      ohne Belegung und Wege, eigenes Kontor gleiche Position, neue Id, `island 1`, Lager 0 ausser Holz/Werkzeug 50;
      Kacheln des Kontors belegt). Nie speichern.
- [ ] **2 Tests zuerst** `tests/sim/islands.test.ts`, `describe('M12 E0 Inselbezug')`, je Fall ein `it` mit Präfix:
      **AK-E0-10** I01–I12 (Anhang 01 F; „nur Insel 1" = `islands[0].stock` vorher/nachher tief gleich, Geld
      global); **AK-E0-11** I13, I14 (Kontor, Markt, Kapelle auf Insel 1 an Koordinaten im Radius eines Hauses auf
      Insel 0 → `isSupplied` false, `serviceAvailable` false, `houseDiagnosis` meldet `supply`; Weg auf Insel 1 an
      gleicher Koordinate bindet kein Gebäude auf Insel 0 an; **I16** (R229 qa-B5): angebundene Feuerwache auf Insel 1
      an Koordinaten im Radius einer Kapelle auf Insel 0 → `isProtected` false, Brand per `beginCrisis` auf die Kapelle
      endet mit `outcome 'burning'`); **AK-E0-14** (Geld für genau einen Aufstieg; kleinere
      Id auf Insel 1 steigt auf, grössere auf Insel 0 nicht; ein `step` am Wachstumstakt); **AK-E0-21** I15 (30
      Bürger Insel 0 + 20 Insel 1 → `won` nach `step`; `houses`, `tierWish`, `tierReached`, `tierOpen`,
      `maxHouseTier`, `merchants` zählen beide Inseln).
      Rot-Beleg → Commit `test: M12 E0 Inselbezug (rot)`.
- [ ] **3 Umsetzung** nach „Regeln", Datei für Datei; nach jeder Datei `npx vitest run tests/sim` (bitgleich bleibt
      grün).
- [ ] **4 Prüfen:** `make check`, `CI=true make check` grün; AK-E0-16 … -19 unverändert grün; `git diff main --
tests/sim/balance.test.ts src/sim/defs` leer. Commit `feat: M12 E0 Inselbezug je Zugriff`.

**Review-Fokus:** jede Zeile von R-E0-3 hat Code und Test; keine Insel-Vermischung über Koordinaten; Heimat-Zeilen
nur `HOME`; Zählungen unverändert global; kein Wurf bei unbekanntem Inselindex; bitgleich.
