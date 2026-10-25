# T00 Testzeiten vorab, Worktree, Basis

Persona `tech-sim-engineer` · Strang A · Tools ≈ 12 · blocked-by: Gate Plan.

- [ ] **Worktree:** `git worktree list` zuerst (R329). `.worktrees/i201`, Branch `feat/i201` von `main` (`git rev-parse main` notieren); dann `git merge plan/i201-festanlass` (kein Rebase), damit Spec und Plan im Baum liegen.
- [ ] **Last:** `uptime`. 1-min-Load > 8 → nur dieser Task, dann `waiting`; Tests erst bei Load ≤ 4 ohne fremden `vitest`-Lauf (R380).
- [ ] **Testzeiten vorab** (Dauer und Exit ins Ledger, je Befehl `…; echo EXIT=$?`, nie in eine Pipe):
  - `npx vitest related --run src/sim/feast.ts src/sim/levels.ts src/sim/trade.ts src/sim/save.ts src/sim/types.ts src/sim/defs/timing.ts`
  - `npx vitest related --run src/ui/feast.ts src/ui/inspect.ts src/ui/trade.ts src/ui/panelView.ts`
  - `npx vitest run tests/sim/balance.test.ts` (**Dauer als Basis für P-7**; dreimal, Median notieren)
- [ ] **Basis:** `rg -n "SAVE_VERSION =" src/sim/save.ts` (Wert notieren, P-9); `rg -n "FEAST_RUM" src tests` (erwartet: `defs/timing.ts`, `feast.ts`, `src/ui/feast.ts`, `tests/sim/feast.test.ts`); `rg -n "\b(75|125)\b" src/sim/feast.ts src/sim/levels.ts src/sim/trade.ts` (erwartet leer).
- [ ] **Baseline-Liste festschreiben** (für T03 und T07): `ls tests/sim | rg "^balance|baseline|bitgleich"`; erwartet `tests/sim/balance.test.ts`, `tests/sim/balance-crises.test.ts`, `tests/sim/farOrder-baseline.test.ts`, `tests/sim/reserve-bitgleich.test.ts`. Abweichung ins Ledger, T03 nutzt genau diese Liste (nie ein leeres `$(rg …)`, das den ganzen Bestand liefe).
- [ ] **Hinweis P-7:** Die Dauer von `balance.test.ts` hier ist nur Orientierung; massgeblich ist der Wand-an-Wand-Vergleich nach T03.
- [ ] **Drift seit Spec:** `git log --oneline a8c8fdfb..main -- src/sim/save.ts src/sim/trade.ts src/sim/levels.ts src/sim/feast.ts src/ui/feast.ts src/ui/inspect.ts`. Geändert → Symbole (`isValidFeast`, `sellPrice`, `cycleOf`, `effectiveCycle`, `updateFeast`) statt Zeilen nutzen; berührt eine Änderung die Formel von `sellPrice` oder `cycleOf`, an den Controller melden.

Beleg: Zeiten, Basiswerte und Drift im Bericht. Kein Commit.
