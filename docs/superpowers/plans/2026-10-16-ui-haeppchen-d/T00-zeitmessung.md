# T00 · Zeitmessung berührter Tests vorher (R392)

Controller selbst, kein Umsetzer · ≈ 8 Tools · blocked-by: `make push-check` Exit 0 für REL-23

## Schritte

1. Worktree `.worktrees/ui-haeppchen-d-impl` von `plan/ui-haeppchen-d` anlegen (`git worktree add … -b feat/ui-haeppchen-d`), `main` per Merge holen, `npm ci` bzw. `node_modules` prüfen.
2. 1-min-Load prüfen (`uptime`); Soll ≤ 4 (Testlock R380). Sonst `waiting` melden, nicht messen.
3. `npx vitest related --run src/ui/crisisLog.ts src/ui/app.ts src/ui/order.ts src/ui/farOrder.ts src/ui/hud.ts src/ui/time.ts --reporter=json --outputFile=.studio/qa/ui-haeppchen-d/zeit-vor.json; echo EXIT=$?`
4. Ergebnis (Exit, Dauer je Datei) im Ledger festhalten. Kein Code, kein Commit ausser Ledger.

## Prüfschritte

Datei `zeit-vor.json` existiert und enthält alle berührten Testdateien (`crisisLog`, `farOrder`, `order`, `hud`, `time`); sonst Messung wiederholen.
