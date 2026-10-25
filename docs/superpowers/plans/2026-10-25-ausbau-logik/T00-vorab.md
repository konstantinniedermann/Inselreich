# T00 Testzeiten auf main, Worktree, Basis

Persona `tech-sim-engineer` · Strang A · Tools ≈ 15 · blocked-by: Gate Plan · **Last ≤ 4 nötig** (R920 V1, R392).

- [ ] **Worktree:** `git worktree list` zuerst (R329). `.worktrees/ausbau-logik`, Branch `feat/ausbau-logik` von `main` (`git rev-parse main` notieren); dann `git merge --no-edit plan/ausbau-logik` (kein Rebase), damit Spec, Anhänge und Plan im Baum liegen.
- [ ] **Last und Messfenster:** `uptime`; `make messfenster; echo EXIT=$?`. 1-min-Load > 4 oder fremder `vitest`-Lauf → `waiting`, nicht messen.
- [ ] **Testzeiten vorab (R392)**, je Befehl `…; echo EXIT=$?`, nie in eine Pipe; `mkdir -p .studio/qa/ausbau-logik`:
  - `npx vitest related --run src/sim/defs/levels.ts src/sim/levels.ts src/sim/upgrade.ts src/sim/placement.ts src/sim/crises.ts src/sim/economy.ts src/sim/build.ts src/sim/save.ts src/sim/defs/unlocks.ts --reporter=json --outputFile=.studio/qa/ausbau-logik/zeit-vor-sim.json`
  - `npx vitest related --run src/ui/panelView.ts src/ui/inspect.ts src/ui/upkeepRank.ts src/ui/pipette.ts src/render/sprites.ts --reporter=json --outputFile=.studio/qa/ausbau-logik/zeit-vor-ui.json`
  - `npx vitest run tests/sim/balance-upgrade.test.ts` dreimal, Median notieren (Basis P-3 a).
  - Aus beiden JSON: Liste aller Testdateien > 500 ms mit Dauer ins Ledger (Grenze R905: +50 %).
- [ ] **Basis:** `rg -n "SAVE_VERSION =" src/sim/save.ts` (Wert notieren); `rg -n "\.fee\b|fee:" src tests` (Erwartung: `defs/levels.ts`, `upgrade.ts`, `ui/panelView.ts`, `ui/inspect.ts` und Tests laut Plan-Matrix); `rg -n "level\?: 2 \| 3|readonly \[LevelDef, LevelDef\]" src`.
- [ ] **Baseline-Liste festschreiben:** `ls tests/sim | rg "^balance|baseline|bitgleich"`; Liste ins Ledger, T01/T04/T05 nutzen genau sie (nie ein leeres `$(rg …)`).
- [ ] **Drift seit Plan:** `git log --oneline 9ba7d79b..main -- src/sim/levels.ts src/sim/upgrade.ts src/sim/placement.ts src/sim/crises.ts src/sim/economy.ts src/sim/save.ts src/sim/build.ts src/ui/panelView.ts src/render/sprites.ts`. Geändert → nach Symbolen arbeiten (`cycleOf`, `effectiveCycle`, `buildingUpkeep`, `upgradeBuilding`, `countFreeTerrain`, `isProtected`, `drawLevelTopper`); berührt eine Änderung `cycleOf` oder `buildingUpkeep` (I-201, I-210), an den Controller melden.
- [ ] **Import-Probe (P-2 Index):** `rg -n "^import" src/sim/coverage.ts src/sim/council.ts src/sim/world.ts` — keiner darf `./levels`, `./crises`, `./unlocks`, `./economy` oder `./placement` importieren; Abweichung melden.

Beleg: Zeiten, Basiswerte, Drift im Bericht. Kein Commit (`.studio/` ist nicht versioniert).
