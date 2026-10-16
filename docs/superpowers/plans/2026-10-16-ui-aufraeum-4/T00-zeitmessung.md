# T00 · Zeitmessung berührter Tests vorher (R392)

Controller selbst, kein Umsetzer · ≈ 8 Tools · blocked-by: UI-HAEPPCHEN-F auf main gemergt

## Schritte

1. Worktree `.worktrees/ui-aufraeum-4-impl` von `plan/ui-aufraeum-4` anlegen (`git worktree add … -b feat/ui-aufraeum-4`), `main` per Merge holen (kein Rebase), `node_modules` prüfen (Worktree sieht eigene `.gitignore`).
2. Einhängepunkte neu suchen (F hat `hud.ts` verschoben): `rg -n "export function reachLine" src/ui/hud.ts`, `rg -n "reachLine" tests/ui/hud.test.ts`, `rg -n "const onContextMenu" src/ui/input.ts`; Zeilen im Ledger, an T02/T03 weitergeben.
3. `uptime`: 1-min-Load ≤ 4 (Testlock R380), sonst `waiting` melden, nicht messen.
4. `npx vitest run tests/ui/order.test.ts tests/ui/menu.test.ts tests/ui/hud.test.ts tests/ui/input.test.ts tests/ui/eventLog*.test.ts --reporter=json --outputFile=.studio/qa/ui-aufraeum-4/zeit-vor.json; echo EXIT=$?`
5. Cache-Nutzen für D-1: ein Wegwerf-Skript im Scratchpad (nicht committen) ruft `orderCardText` 1000-mal auf einer Welt mit der grössten Gebäudezahl eines Testfalls auf (mit und ohne Cache), Zeiten im Ledger. Zahl der Gebäude nennen.
6. Ergebnis (Exit, Dauer je Datei, Gebäudezahl, Cache-Faktor) im Ledger. Kein Code, kein Commit ausser Ledger.

## Prüfschritte

`zeit-vor.json` existiert und enthält die vier Testdateien; sonst wiederholen. Liegt der Cache-Faktor unter 2, `waiting` mit der Zahl an L0 (Entscheid Alternative B in D-1).
