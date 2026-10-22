# T00 · Blocker, Merge main, Zeitmessung vorher (R392)

Controller selbst, kein Umsetzer · ≈ 10 Tools · blocked-by: I-112 auf main gemergt

## Schritte

1. `git log main --oneline | rg -i "I-112"`: kein Merge-Treffer (Branch `feat/i112`), dann `python3 tools/studio/log.py status --role lead-tech --status waiting --task "I-112 nicht gemergt" --package I-122-I-123` und stoppen.
2. Worktree `git worktree add .worktrees/i122-impl -b feat/i122-i123 plan/i122-i123`, dort `git merge main` (kein Rebase), `node_modules` prüfen.
3. Nebenstränge: `git worktree add .worktrees/i122-audio -b feat/i122-audio feat/i122-i123` und `.worktrees/i122-reach -b feat/i122-reach feat/i122-i123`.
4. Einhängepunkte neu suchen (I-112 hat `app.ts`, `hud.ts`, `style.css` verschoben): `rg -n "recordContractSound|announceContract|prevOrderVisible|function launch|const launch" src/ui/app.ts`, `rg -n "export function (chipView|reachLine|stockTooltip)" src/ui/hud.ts`, `rg -n "order-card--warn" src/style.css`; ins Ledger, an T02, T04, T05 weitergeben.
5. `uptime`: 1-min-Load ≤ 4 (Testlock R380), sonst `waiting`, nicht messen.
6. `mkdir -p .studio/qa/i122-i123` und `npx vitest related --run src/sim/orders.ts src/ui/order.ts src/ui/hud.ts src/ui/app.ts src/audio/sound.ts --reporter=json --outputFile=.studio/qa/i122-i123/zeit-vor.json; echo EXIT=$?`; Exit und Dauer je Datei ins Ledger.
7. Kein Code, kein Commit ausser Ledger.

## Prüfschritte

`zeit-vor.json` existiert und nennt `tests/ui/order.test.ts`, `tests/ui/hud.test.ts`, `tests/audio/sound.test.ts`; sonst wiederholen.
