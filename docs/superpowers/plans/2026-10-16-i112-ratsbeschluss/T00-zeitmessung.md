# T00 · Worktree, main holen, Einhängepunkte, Zeitmessung vorher (R392)

Controller selbst, kein Umsetzer · ≈ 10 Tools · blocked-by: Gate Plan

## Schritte

1. Worktree `.worktrees/i112` (Branch `feat/i112` ab main, `plan/i112` hineingemergt, `node_modules` verlinkt) steht; `git merge main` bei Bedarf (kein Rebase).
2. `SAVE_VERSION` auf main lesen (`grep -n "SAVE_VERSION =" src/sim/save.ts`); ist sie nicht 16, Arbeitsannahme in T02 = Wert + 1, ins Ledger.
3. Einhängepunkte neu suchen (Zeilen verschieben sich durch Merges), Ergebnis ins Ledger und an T01 weitergeben:
   `rg -n "maxInhabitants|serviceRadius|islandCycle\(|def\.cycle|\.cycle\b" src`
   Abweichungen gegen die Fundstellen-Liste in `T01-lese-helfer.md` ins Ledger (neue Fundstelle = T01 erweitern, kein neuer Task).
4. `uptime`: 1-min-Last ≤ 4 (Testlock R380), sonst `waiting`, nicht messen.
5. `mkdir -p .studio/qa/i112` und
   `npx vitest related --run src/sim/population.ts src/sim/flow.ts src/sim/unlocks.ts src/sim/feast.ts src/sim/crises.ts src/sim/queries.ts src/sim/levels.ts src/sim/tick.ts src/sim/save.ts src/sim/world.ts src/ui/hover.ts src/ui/buildMenu.ts src/ui/panelView.ts src/ui/inspect.ts src/ui/guide.ts src/ui/islandCard.ts src/ui/taxView.ts src/ui/hud.ts src/ui/hotkeys.ts --reporter=json --outputFile=.studio/qa/i112/zeit-vor.json; echo EXIT=$?`
   (Lauf > 4 min möglich: Bash mit `run_in_background: true`, Abfrage spätestens alle 4 min, E-037.)
6. Exit und die zehn langsamsten Dateien ins Ledger. Kein Code, kein Commit ausser Ledger.

## Abnahmeregel (gilt in T08)

Kein bestehender Test > 500 ms und keiner > +50 % gegenüber `zeit-vor.json`; die +50 %-Regel gilt erst ab einem Vorwert ≥ 100 ms (kurze Tests rauschen); `balance.test.ts` und Perf-Budget-Tests zählen mit ihrer
eigenen Schwelle (Wandzeit-Tests laut `make zeittests`). Verletzung → Befund an L0 vor dem Final-Review, keine stille Annahme.

## Prüfschritte

`zeit-vor.json` existiert und nennt `tests/sim/population.test.ts`, `tests/sim/balance.test.ts` und `tests/ui/panelView.test.ts`; sonst wiederholen.
