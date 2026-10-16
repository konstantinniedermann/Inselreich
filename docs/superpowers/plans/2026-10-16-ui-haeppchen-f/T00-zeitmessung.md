# T00 · Zeitmessung berührter Tests vorher (R392)

Controller selbst, kein Umsetzer · ≈ 8 Tools · blocked-by: UI-HAEPPCHEN-E auf main gemergt

## Schritte

1. Worktree `.worktrees/ui-haeppchen-f-impl` von `plan/ui-haeppchen-f` anlegen (`git worktree add … -b feat/ui-haeppchen-f`), `main` per Merge holen (kein Rebase), `node_modules` prüfen.
2. Einhängepunkte neu suchen: `grep -n "drawSeaMap(" src/ui/hud.ts`, `grep -n "export function balanceView\|export function balanceTooltip" src/ui/hud.ts`, `grep -n "hud-balance" src/style.css`; Zeilen im Ledger, an T02/T05 weitergeben.
3. `uptime`: 1-min-Load ≤ 4 (Testlock R380), sonst `waiting` melden, nicht messen.
4. `mkdir -p .studio/qa/ui-haeppchen-f` und `npx vitest related --run src/ui/hud.ts src/ui/ships.ts src/ui/farOrder.ts src/ui/seaMapView.ts src/render/seaMap.ts src/sim/flow.ts --reporter=json --outputFile=.studio/qa/ui-haeppchen-f/zeit-vor.json; echo EXIT=$?`
5. Ergebnis (Exit, Dauer je Datei) im Ledger. Kein Code, kein Commit ausser Ledger.

## Prüfschritte

`zeit-vor.json` existiert und enthält `tests/ui/hud.test.ts` und `tests/ui/ships.test.ts`; sonst wiederholen.
