# T01 — Phase-Option und Streuungsprobe (GE-1, GE-2)

**Dateien:** `tests/sim/controller.ts`, `tests/sim/ensemble.test.ts` (neu, zunächst nur dieser Fall). Nichts anderes ändern.

- [ ] **Schritt 0 (Controller, vor dem Task):** Zeitmessung laut Index („Zeitmessung vor T01“) auf `main`, Zeiten ablegen. Dazu die Dauer eines vollen `buildColony`-Laufs notieren (`VITE_BALANCE_LOG=1 npx vitest run tests/sim/balance.test.ts --silent=false`), sie bestimmt das Laufzeit-Budget in T04.
- [ ] **Schritt 1: Test zuerst.** In `tests/sim/ensemble.test.ts` zwei Fälle mit `startColony(createWorld(3))` und `runColony(w, layout, t, { phase }, (w) => w.tick >= 1500)`, Vergleich über `serialize(w)`:
  - GE-1: `{}` und `{ phase: 0 }` ergeben bis Tick 1500 gleiche Zustände.
  - GE-2: `{ phase: 20 }` ergibt einen anderen Zustand als `{ phase: 0 }` (z. B. andere Gebäudezahl oder anderes Geld).
- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/sim/ensemble.test.ts; echo EXIT=$?` → `EXIT=1` (TypeScript/Laufzeit: Option unbekannt bzw. GE-2 gleich). Ausgabe in den Bericht.
- [ ] **Schritt 3: Umsetzung.** `ColonyOptions` bekommt `phase?: number` (Doku-Kommentar: „Versatz der Entscheidungs-Ticks im Intervall, Robustheitsachse des Gate-Ensembles“). In `runColony`: `const phase = opts.phase ?? 0;` und `if (w.tick % CONTROL_INTERVAL === phase) control(...)`. Sonst nichts ändern; `control` bleibt unberührt.
- [ ] **Schritt 4: Grün.** `npx vitest run tests/sim/ensemble.test.ts; echo EXIT=$?` → 0. Danach `npx vitest related --run tests/sim/controller.ts; echo EXIT=$?` → 0 (alle Importeure unverändert grün).
- [ ] **Schritt 5: Streuungsbeleg.** Im Scratchpad (nicht unter `tests/`) Sieg-Tick, erster Siedler, erster Bürger für Phasen 0/20/40/60/80 ausgeben (zeitweise lokal in Testdatei, dann nicht committen). **Weichen:** mindestens zwei verschiedene Werte in einer Messgrösse → weiter. Alle fünf gleich → stoppen, `blocked` melden, Rückfall aus Index Entscheid 2 an den Controller.
- [ ] **Schritt 6: Commit** `test: Controller-Phase als Robustheitsachse (TOOL-GATE-ENSEMBLE T01)`.
