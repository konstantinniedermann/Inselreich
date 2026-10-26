# T02 · `cycleOf` und `buildingUpkeep(world, b)`

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 50 Tools · blocked-by: T01 · AK-VL-02, -03 (ohne Kombifälle), -04, -12, -18, -21 (`levels`-Teil)

**Files:** Modify `src/sim/levels.ts`, `src/sim/economy.ts`, mechanisch (Plan P-3, nur Signatur) `src/ui/inspect.ts`, `src/ui/upkeepRank.ts`, `src/ui/panelView.ts`, `tests/sim/pause.test.ts`, `tests/ui/upkeepRank.test.ts`, `tests/ui/panelView.test.ts`; Test `tests/sim/overtime.test.ts`, `tests/sim/overtime-source.test.ts`.

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

## Inhalt

1. **`cycleOf`:** Die bisherige Kette bleibt unverändert und landet in `const c`; die **letzte** Anweisung ist
   `return overtimeState(world, b).phase === 'overtime' ? overtimeCycle(c) : c;` (Import aus `./overtime`). Steht auf dem
   Merge-Stand von T00 schon ein Faktor von I-201 (`harvestActive`/`harvestCycle`) oder I-210 (`petitionCycle`) in
   `cycleOf`, bleibt er **vor** der Volllast-Zeile. Doc-Kommentar: «Volllast ist der letzte Faktor (`ceil`), Spec
   Abschnitt Schnittstelle `cycleOf`; spätere Faktoren gehören davor.»
2. **`buildingUpkeep(world: World, b: Building): number`** (Signatur wie AUSBAU-LOGIK, P-2):
   `b.paused === true ? ceil(upkeepOf(b) × PAUSED_UPKEEP_PCT / 100) : overtimeUpkeep(world, b, upkeepOf(b))`.
   Stilllegen hat Vorrang, kein Stapeln mit der Ruhe. Doc-Kommentar mit der Reihenfolge Spec «`upkeepOf` (Stufe/Drossel)
   → Stilllegen oder Phase → Summe → Edikt».
3. **Aufrufer mechanisch:** `economy.ts` (`totalUpkeep`: `buildingUpkeep(world, b)`), `ui/inspect.ts`, `ui/upkeepRank.ts`,
   `ui/panelView.ts` und die drei Testdateien: nur das zusätzliche `world`-Argument (`rg -n "buildingUpkeep\(" src tests`
   vorher und nachher, nachher jeder Treffer mit zwei Argumenten).

## Tests (`tests/sim/overtime.test.ts`)

Phase direkt herstellen mit `b.overtimeAt = world.tick − d` (Spec Anhang 02 A), `d` = 0 (Volllast), 1800 (Ruhe).

- **AK-VL-02:** Weberei St. 1 Heimatinsel: `cycleOf` 50 normal, 38 Volllast, 50 Ruhe, 50 ohne Feld. Rinderfarm St. 3: 8 → 6.
- **AK-VL-03 (ohne Kombifälle):** Glashütte St. 3 auf einer Insel mit `mountainRich`: 10 normal, **8** Volllast (nicht 7).
  Schäferei St. 1 auf `fertile`: 25 → 19. Vorbedingung `traitOf(...) !== undefined` im Test. Ist I-201 laut T00 schon auf
  main: zusätzlich Weberei St. 3 (20) mit Erntefest → 15 → **12** (nicht 11), Welt nach `tests/sim/feastKinds.test.ts`
  (Kapelle, `holdFeast(w, id, 'harvest')`). Sonst macht T08 den Fall verbindlich (P-6).
- **AK-VL-04:** `buildingUpkeep` Weberei St. 1 = 15 / 23 / 8 (normal / Volllast / Ruhe), Rinderfarm St. 3 = 17 / 26 / 9.
  Edikt «Sparen» aktiv (Muster der Edikt-Tests): `totalUpkeep(w)` = `⌊(S + 23) × upkeepPct / 100⌋`, `S` = Summe
  `buildingUpkeep` aller anderen Gebäude plus `ships.length × SHIP.upkeep`, `upkeepPct` aus `defs/edicts.ts`.
- **AK-VL-12 (nur Werte):** Weberei St. 1 in Volllast, `upgradeBuilding` mit gefülltem Lager → `ok`; `overtimeAt` und
  `progress` unverändert, `cycleOf` 23, `buildingUpkeep` 30. In der Ruhe ausgebaut: `cycleOf` 30, `buildingUpkeep` 10.
  Erwartungen zusätzlich aus `LEVELS.weaver` und den Defs abgeleitet (`overtimeCycle(level.cycle)`).
- **AK-VL-18:** Tabelle aus den Defs: für jeden Betrieb mit `cycle` und Stufen 1–3 (`LEVELS`), ohne `overtimeAt`, normal
  und stillgelegt: `cycleOf` = `effectiveCycle(w, island, defId, stufenZyklus)` (bzw. Merge-Stand-Kette) und
  `buildingUpkeep` = `upkeepOf` bzw. `ceil(upkeepOf × PAUSED_UPKEEP_PCT / 100)`. Dazu ein abgelaufenes Feld
  (`d` = 3000): Werte gleich wie ohne Feld.

## Quellscan (`tests/sim/overtime-source.test.ts`, AK-VL-21 `levels`-Teil)

`src/sim/levels.ts` importiert `overtimeState`, `overtimeCycle`, `overtimeUpkeep` aus `./overtime`, ruft beide Funktionen
auf und enthält keinen Namen `OVERTIME_` (alle Volllast-Werte laufen über `overtime.ts`). `return overtimeState(` … ist
die letzte `return`-Anweisung im Rumpf von `cycleOf` (Rumpf per Regex zwischen `function cycleOf` und der schliessenden
Klammer auf Zeilenanfang).

## Schritte

- [ ] `rg -n "buildingUpkeep\(" src tests; echo EXIT=$?` (Liste ins Ledger).
- [ ] Tests schreiben; **Rot:** `npx vitest run tests/sim/overtime.test.ts tests/sim/overtime-source.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] Umsetzen (Inhalt 1–3).
- [ ] **Grün:** derselbe Befehl → 0; `npx vitest run tests/sim/levels.test.ts tests/sim/pause.test.ts tests/sim/council.test.ts tests/sim/islandTraits.test.ts tests/sim/upgrade.test.ts tests/ui/upkeepRank.test.ts tests/ui/panelView.test.ts tests/sim/imports.test.ts; echo EXIT=$?` → 0 (Charakterisierung: bestehende Erwartungen unverändert).
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit `feat: I-215 Volllast in cycleOf und buildingUpkeep (T02)`.

Nach dem Review OK zweigt Strang B (`feat/volllast-ui`) von diesem Commit ab (Controller).
