# T00 · Zeitmessung berührter Tests vorher (R392)

Controller selbst, kein Umsetzer · ≈ 8 Tools · blocked-by: UI-HAEPPCHEN-D auf main gemergt

## Schritte

1. Worktree `.worktrees/ui-haeppchen-e-impl` von `plan/ui-haeppchen-e` anlegen (`git worktree add … -b feat/ui-haeppchen-e`), `main` per Merge holen (kein Rebase), `node_modules` prüfen.
2. Einhängepunkte neu suchen, da UI-D Zeilen verschoben hat: `grep -n "const refresh" src/ui/app.ts`, `grep -n "need<HTMLElement>(root, '#game')" src/ui/app.ts`, `tail -20 src/style.css`; Befund (Zeilen) im Ledger, an T04 weitergeben.
3. `uptime`: 1-min-Load ≤ 4 (Testlock R380), sonst `waiting` melden, nicht messen.
4. `npx vitest related --run src/sim/orders.ts src/ui/order.ts src/ui/app.ts --reporter=json --outputFile=.studio/qa/ui-haeppchen-e/zeit-vor.json; echo EXIT=$?`
5. Ergebnis (Exit, Dauer je Datei) im Ledger. Kein Code, kein Commit ausser Ledger.

## Prüfschritte

`zeit-vor.json` existiert und enthält `tests/sim/orders.test.ts` und `tests/ui/order.test.ts`; sonst wiederholen.
