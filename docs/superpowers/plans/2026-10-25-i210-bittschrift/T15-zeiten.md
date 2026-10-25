# T15 Zeiten gegen main (R392) und Teilbeleg

Persona `tech-sim-engineer` (Umsetzer A per `SendMessage`) · Strang A · Tools ≈ 20 · AK-BS-01 (Baselines) · blocked-by T12, T13. **Last ≤ 4 nötig.**

**Files:** keine Änderung; nur Messung und Bericht. Ein Befund geht an den Controller, nicht in den Code.

## Schritte

- [ ] `make messfenster; echo EXIT=$?` = 0.
- [ ] Dieselben Befehle wie T00 auf `feat/i210`, Ausgabe nach `.superpowers/sdd/i210/zeiten-branch.json` und `…-ui.json`:
  - `npx vitest related --run src/sim/population.ts src/sim/flow.ts src/sim/levels.ts src/sim/economy.ts src/sim/production.ts src/sim/trade.ts src/sim/ships.ts src/sim/queries.ts src/sim/tick.ts src/sim/world.ts src/sim/types.ts src/sim/save.ts src/sim/feast.ts --reporter=json --outputFile=.superpowers/sdd/i210/zeiten-branch.json; echo EXIT=$?`
  - `npx vitest related --run src/ui/settings.ts src/ui/hud.ts src/ui/inspect.ts src/ui/app.ts src/ui/feast.ts --reporter=json --outputFile=.superpowers/sdd/i210/zeiten-branch-ui.json; echo EXIT=$?`
- [ ] **Vergleich (R392, Auslegung R905):** je bestehender Datei. Eine Datei, die auf main ≤ 500 ms lag und jetzt > 500 ms läuft, ist ein Befund. Eine Datei, die auf main schon > 500 ms lag, darf höchstens +50 % zulegen. Neue Dateien (`petitions*`) zählen nicht dazu, sie haben das Soll < 30 s je Datei (Gate B-5). Die Tabelle (Datei, main ms, Branch ms, Δ %) kommt ins Ledger. Bei einem Treffer folgt eine Wiederholung derselben Datei einzeln; erst die Wiederholung zählt (E-071).
- [ ] **Baseline bitgleich (AK-BS-01):** `npx vitest run tests/sim/balance.test.ts tests/sim/balance-crises.test.ts tests/sim/balance-merchants.test.ts <weitere aus T00-Liste>; echo EXIT=$?`, ohne Diff an diesen Dateien: `git diff --quiet $(git merge-base main HEAD) -- tests/sim/balance*.test.ts tests/sim/controller.ts tests/sim/merchantsController.ts; echo EXIT=$?` = 0.
- [ ] Bericht: Tabelle, Exit-Codes, Last je Lauf.
