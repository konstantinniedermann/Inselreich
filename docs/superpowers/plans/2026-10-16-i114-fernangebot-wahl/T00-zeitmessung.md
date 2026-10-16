# T00 · Blocker prüfen, Zeitmessung vorher (R392)

Controller selbst, kein Umsetzer · ≈ 8 Tools · blocked-by: UI-AUFRAEUM-4 auf main gemergt

## Schritte

1. `git log main --oneline | rg -i "AUFRAEUM-4"`: kein Treffer, `python3 tools/studio/log.py status --role lead-tech --status waiting --task "UI-AUFRAEUM-4 nicht gemergt" --package I-114` und stoppen.
2. Worktree `.worktrees/i114-impl` von `plan/i114` anlegen (`git worktree add .worktrees/i114-impl -b feat/i114 plan/i114`), `git merge main` (kein Rebase), `node_modules` prüfen.
3. Einhängepunkte neu suchen (Zeilen ändern sich durch AUFRAEUM-4): `rg -n "far-card|far-text|far-accept|acceptFar" src/ui/hud.ts src/ui/app.ts src/ui/order.ts`, `rg -n "far-card" src/style.css`; ins Ledger, an T02 weitergeben.
4. `uptime`: 1-min-Load ≤ 4 (Testlock R380), sonst `waiting`, nicht messen.
5. `mkdir -p .studio/qa/i114` und `npx vitest related --run src/sim/orders.ts src/ui/farOrder.ts src/ui/hud.ts src/ui/app.ts --reporter=json --outputFile=.studio/qa/i114/zeit-vor.json; echo EXIT=$?`
6. Exit und Dauer je Datei ins Ledger. Kein Code, kein Commit ausser Ledger.

## Prüfschritte

`zeit-vor.json` existiert und nennt `tests/sim/farOrder-accept.test.ts` und `tests/ui/farOrder.test.ts`; sonst wiederholen.
