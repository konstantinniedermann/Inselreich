# T00 · Worktree, main holen, Einhängepunkte, Zeitmessung vorher (R392)

Controller selbst, kein Umsetzer · ≈ 10 Tools · blocked-by: Gate Plan

## Schritte

- [ ] 1. Worktree `.worktrees/i132` (Branch `feat/i132` ab main, `plan/i132` hineingemergt, `node_modules` verlinkt); `git merge main` bei Bedarf (kein Rebase).
- [ ] 2. `grep -n "SAVE_VERSION =" src/sim/save.ts`: ist es nicht 17, Arbeitsannahme in T01 = Wert + 1 (Migration `migrateV<n>ToV<n+1>`), ins Ledger.
- [ ] 3. Einhängepunkte neu suchen (Zeilen verschieben sich), Ergebnis ins Ledger und an T01/T02/T04 weitergeben:
      `rg -n "export function (buy|monumentBuyBlock|buyMonumentUnit)\b|tickPopulation\(world\)|migrateV16ToV17\(raw\)|dropCouncil\(input\)|function dropCouncil" src tests/sim/helpers.ts`
      und `rg -n "rest-monument|council-badge|data-field=\"goal\"|councilEscapeHandled|prevCouncil" src/ui`.
- [ ] 4. `uptime`: 1-min-Last ≤ 4 (Testlock R380), sonst `waiting`, nicht messen.
- [ ] 5. `mkdir -p .studio/qa/i132` und (Lauf > 4 min möglich: Bash mit `run_in_background: true`, Abfrage spätestens alle 4 min, E-037)
      `npx vitest related --run src/sim/types.ts src/sim/world.ts src/sim/save.ts src/sim/trade.ts src/sim/tick.ts src/ui/hud.ts src/ui/inspect.ts src/ui/trade.ts src/ui/monumentView.ts src/ui/app.ts --reporter=json --outputFile=.studio/qa/i132/zeit-vor.json; echo EXIT=$?`
- [ ] 6. Exit und die zehn langsamsten Dateien ins Ledger. Kein Code, kein Commit ausser Ledger.

## Abnahmeregel (gilt in T05)

Kein bestehender Test > 500 ms neu und keiner > +50 % gegenüber `zeit-vor.json` (die +50 %-Regel erst ab Vorwert ≥ 100 ms); `balance*.test.ts`
und Perf-Budget-Tests zählen mit ihrer eigenen Schwelle. Der neue `tests/sim/trial-run.test.ts` zählt nicht gegen die Regel, muss aber
`make zeitreserve` bestehen. Verletzung → Befund an L0 vor dem Final-Review, keine stille Annahme.

## Prüfschritte

`zeit-vor.json` existiert und nennt `tests/sim/save.test.ts`, `tests/sim/balance.test.ts` und `tests/ui/hud.test.ts`; sonst wiederholen.
