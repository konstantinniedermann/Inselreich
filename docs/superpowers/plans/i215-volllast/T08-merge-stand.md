# T08 · Merge-Stand: main holen, Kombifälle, Save-Nummer

Strang A · Persona `tech-sim-engineer` (Fortsetzung per `SendMessage`) · Modell sonnet · ≈ 35 Tools · blocked-by: T04, T05 (B in A gemergt) · AK-VL-03 (Kombifälle), -04 (Kombifall Drossel), -17, -18; Plan P-6, P-7, P-8; Rulings R909, R952, R963

**Ziel:** `feat/volllast` steht auf dem aktuellen main; die Volllast ist in `cycleOf` und `buildingUpkeep` der letzte Faktor; jeder auf main vorhandene Nachbarfaktor hat einen verbindlichen Kombifall; `SAVE_VERSION` = main + 1.

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`. **Vorbedingung (P-6):** `git merge-base --is-ancestor feat/i201 main; echo EXIT=$?` → 0. Sonst `waiting` mit Grund «I-201 nicht auf main». **Merge-Reihenfolge: I-201 vor T08** (R974).

## Schritte

- [ ] **Merge:** `git merge --no-edit main; echo EXIT=$?` (kein Rebase). Konflikte nach der Tabelle unten lösen; je gelöstem Konflikt eine Zeile ins Ledger (Datei, Symbol, Lösung).
- [ ] **Delta-Review (R974):** Ist ein Konflikt nicht nach der Tabelle unten lösbar, oder wird mehr als ein Konflikt gelöst, folgt vor dem Final-Review ein Delta-Review, frisch (`model: opus`), aus der Reserve (Budget). Der Controller meldet das mit der Konfliktliste aus dem Ledger.
- [ ] **Merge-Stand notieren:** je `git merge-base --is-ancestor feat/<paket> main; echo EXIT=$?` für `i201`, `i210`, `ausbau-logik`; `rg -n "SAVE_VERSION =" src/sim/save.ts`.
- [ ] **Reihenfolge prüfen:** Rumpf von `cycleOf` lesen; die Volllast-Zeile (`overtimeState(…) … overtimeCycle(c)`) ist die letzte Anweisung. Rumpf von `buildingUpkeep`: Stilllegen zuerst, dann `overtimeUpkeep(world, b, base)` mit `base` = Wert nach Stufe und Drossel.
- [ ] **Kombifälle** in `tests/sim/overtime.test.ts` (je vorhandenes Paket, verbindlich):
  - I-201 (Pflicht): Weberei St. 3 (20) im Radius einer Kapelle mit Erntefest → normal 15 → Volllast **12** (nicht 11). Welt wie `tests/sim/feastKinds.test.ts`.
  - I-210, falls auf main: Betrieb mit Taktlohn (`petitionCycle`) → Volllast auf den Wert **nach** Taktlohn, `ceil`; Erwartung aus den I-210-Defs abgeleitet und als Zahl im Ledger.
  - AUSBAU-LOGIK, falls auf main: (a) laufende Stufe k < g: `cycleOf` in Volllast = `overtimeCycle(Zyklus der Stufe k)`; (b) gedrosselter Betrieb: `buildingUpkeep` in Volllast = `ceil(Drossel-u × OVERTIME_UPKEEP_PCT / 100)`, Ruhe = `ceil(Drossel-u × PAUSED_UPKEEP_PCT / 100)`, stillgelegt = Wert der AL-Regel «Pause vor Drossel».
- [ ] **Save-Nummer (P-8, R909):** `git show main:src/sim/save.ts | rg -n "SAVE_VERSION ="` = M. Steht im Branch nicht M + 1: `SAVE_VERSION` = M + 1, Kettenschritt umbenennen (`migrateV<M>ToV<M+1>`), Aufruf ans Ende der Kette hinter den neuen Schritt von main. Tests unverändert (kein Literal).
- [ ] **Grün:** `npx vitest run tests/sim/overtime.test.ts tests/sim/overtime-save.test.ts tests/sim/overtime-source.test.ts tests/ui/overtime.test.ts tests/ui/overtime-source.test.ts tests/sim/levels.test.ts tests/sim/pause.test.ts tests/sim/imports.test.ts; echo EXIT=$?` → 0; zusätzlich die Tests des gemergten Nachbarpakets in `levels.ts` (z. B. `tests/sim/feastKinds.test.ts`) → 0.
- [ ] **Balancing:** `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` → 0; `git diff main -- tests/sim/balance.test.ts` leer.
- [ ] **Zeiten nachher (R392/R905):** dieselbe Messung wie [`zeiten.md`](zeiten.md) im Branch (Last ≤ 4, Scratchpad), Vergleich je gelistetem Test; neu > 500 ms oder + 50 % über einem Test, der auf main schon > 500 ms lag → Befund an den Controller. Werte ins Ledger und als Nachtrag in den Bericht.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make zeittests; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Commit (Merge-Commit plus) `test: I-215 Kombifälle cycleOf und Unterhalt zum Merge-Stand (T08)`.

## Konflikttabelle `levels.ts` (gilt auch für Pakete, die nach Volllast mergen, P-7)

| Stelle           | Nachbar              | Lösung                                                                                                                                          |
| ---------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `cycleOf`        | I-201 Erntefest      | `const c = …; const h = harvestActive(world, b) ? harvestCycle(c) : c;` dann Volllast auf `h` als letzte Zeile                                  |
| `cycleOf`        | I-210 Taktlohn       | `petitionCycle(…)` bleibt in der Kette vor der Volllast; Reihenfolge Erntefest/Taktlohn laut I-201/I-210                                        |
| `cycleOf`        | AUSBAU-LOGIK Stufe k | Stufenzyklus aus k in der Kette (Schritt 1 der Spec-Tabelle); Volllast bleibt letzte Zeile                                                      |
| `buildingUpkeep` | AUSBAU-LOGIK Drossel | `paused` → `ceil(upkeepOf(b) × PAUSED_UPKEEP_PCT / 100)` (AL: Pause vor Drossel); sonst `overtimeUpkeep(world, b, gedrosselt oder upkeepOf(b))` |
| Signatur         | AUSBAU-LOGIK         | beide `buildingUpkeep(world, b)` (P-2): gleiche Aufruferzeilen, kein inhaltlicher Konflikt                                                      |
| `save.ts`        | jede Save-Kette      | Schritt von main zuerst, Volllast-Schritt zuletzt; `SAVE_VERSION` = main + 1                                                                    |

Nicht lösbar nach Tabelle (z. B. ein Nachbar ändert `advance` an derselben Stelle): `blocked`, Befund an den Controller, kein eigener Entwurf.
