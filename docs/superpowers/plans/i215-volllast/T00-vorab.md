# T00 · Vorab: Worktree, Basis, Zeiten, Drift

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 15 Tools · blocked-by: Gate Plan · AK: –

**Ziel:** Arbeitsbaum steht, Ausgangswerte sind notiert, der Controller kennt den Merge-Stand und die Testzeiten.

**Testsperre: Last ≤ 4 nötig** (1-min-Load, `make messfenster` Exit 0), sonst `waiting` und erneut prüfen.

## Schritte

- [ ] **Worktree** (Controller, nicht der Arbeiter): `git worktree add -b feat/volllast .worktrees/i215 main`; darin `git merge --no-edit design/volllast` und `git merge --no-edit plan/i215-volllast` (nur Doku, ohne Konflikt erwartet). Danach `git log --oneline -3`.
- [ ] **Basis notieren** (Ledger): `rg -n "SAVE_VERSION =" src/sim/save.ts`; `rg -n "export (function|const) (cycleOf|buildingUpkeep|upkeepOf)" src/sim/levels.ts`; `rg -n "buildingUpkeep\(" src tests` (Erwartung Stand Plan: `economy.ts:64`, `ui/inspect.ts:960`, `ui/upkeepRank.ts:30`, `ui/panelView.ts:191`, `tests/sim/pause.test.ts`, `tests/ui/upkeepRank.test.ts`, `tests/ui/panelView.test.ts`).
- [ ] **Merge-Stand der Nachbarpakete** (je Befehl `; echo EXIT=$?`, Exit 0 = auf main): `git merge-base --is-ancestor feat/i201 main`, `git merge-base --is-ancestor feat/i210 main`, `git merge-base --is-ancestor feat/ausbau-logik main`. Ergebnis ins Ledger (für T02 und T08, P-6).
- [ ] **Drift seit Plan:** `git log --oneline 1de17074..main -- src/sim/levels.ts src/sim/production.ts src/sim/save.ts src/sim/economy.ts src/sim/types.ts src/sim/defs/buildings.ts src/sim/defs/timing.ts src/ui/inspect.ts src/ui/panelView.ts src/ui/texts.ts`. Treffer: Symbole statt Zeilennummern verwenden, Abweichung an den Controller.
- [ ] **Zeiten vorher** (nur wenn main seit Plan `1de17074` Commits in den Dateien oben hat; sonst gilt [`zeiten.md`](zeiten.md)): `npx vitest related --run src/sim/levels.ts src/sim/production.ts src/sim/save.ts src/sim/economy.ts src/sim/defs/timing.ts src/sim/defs/buildings.ts src/sim/types.ts src/ui/inspect.ts src/ui/panelView.ts src/ui/texts.ts src/ui/upkeepRank.ts src/ui/app.ts --reporter=json --outputFile=<scratchpad>/t00-times.json; echo EXIT=$?`. Liste der Tests > 200 ms (Datei, Name, ms) und Last vor/nach dem Lauf ins Ledger. Messprobe nie im Hauptcheckout, Ausgabe nur im Scratchpad.
- [ ] **Grundlauf:** `npx vitest run tests/sim/balance.test.ts tests/sim/levels.test.ts tests/sim/pause.test.ts tests/sim/imports.test.ts; echo EXIT=$?` → 0 (Basis grün).

## Ergebnis an den Controller

SAVE_VERSION auf main, drei Merge-Stände (I-201, I-210, AUSBAU-LOGIK), Drift-Treffer, Zeitliste (oder «zeiten.md gilt»), Exit-Codes. Kein Commit in T00.
