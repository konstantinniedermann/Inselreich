# T00 Testzeiten vorab, Worktree, Basis

Persona `tech-ui-engineer` · Tools ≈ 10 · blocked-by: Gate Plan und Inselproben-UI-Task gemerged.

1. Worktree `.worktrees/i197` (Branch `feat/i197`) von `main` nach dem Merge des Inselproben-UI-Tasks (`git worktree list` zuerst, R329). Kein Rebase.
2. Testsperre (R380): `uptime` 1-min-Load ≤ 4, kein anderer `vitest`-Lauf, sonst `waiting`.
3. Testzeiten vorab, je Befehl `…; echo EXIT=$?`, Zeiten ins Ledger:
   - `npx vitest run tests/sim/mapgen.test.ts tests/ui/menu.test.ts`
   - `npx vitest run tests/sim/balance.test.ts` (nur Dauer notieren)
4. Basis festhalten: `rg -n "SAVE_VERSION" src/sim` (Wert notieren), `rg -n "newIsland|pickSeed|Date.now\(\) % 100000" src/ui` (Zeilen nach dem Inselproben-Merge; die Plan-Zeilen 125/331/522 sind verschoben).
5. Prüfen, ob Inselproben `StartOptions` oder `MenuActions.newIsland` schon geändert hat; Task T03 baut darauf auf, nicht daneben.

Beleg: Zeiten und Basiswerte im Bericht.
