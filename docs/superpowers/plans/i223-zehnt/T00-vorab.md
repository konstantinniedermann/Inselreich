# T00 · Vorab: Worktree, Basis, Nachbarn

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 15 Tools · blocked-by: Gate Plan · keine AK (Vorbereitung)

**Files:** keine Änderung im Repo; Ergebnisse ins Ledger (`.superpowers/sdd/i223/ledger.md` im Worktree).

## Schritte

- [ ] **Worktree:** `git worktree add -b feat/i223-zehnt .worktrees/i223 main; echo EXIT=$?` (vom Hauptrepo aus). Prüfen, dass `.gitignore` des Worktrees `.superpowers/` ausschliesst (`git -C .worktrees/i223 check-ignore -v .superpowers/x; echo EXIT=$?`); sonst Befund an den Controller.
- [ ] **Basis notieren:** `git -C .worktrees/i223 log --oneline -1`; `rg -n "SAVE_VERSION =" src/sim/save.ts` (Stand Plan: 19); `rg -n "if \(raw.version === " src/sim/save.ts | tail -2` (letzter Kettenschritt, Stand Plan Z. 1043 `migrateV18ToV19`).
- [ ] **Faltköpfe:** `rg -n "foldBackFarOrders\(dropCouncil\(dropTrial\(input\)\)\)" tests/sim/helpers.ts` → Erwartung 3 Treffer (`foldBackToV13`, `foldBackToV12`, `foldBackToV11`). Aussenketten: `rg -n "foldBackSeerecht\(" tests` → Erwartung `farOrder-save.test.ts`, `save-loyalty.test.ts` (3 Stellen), `helpers.test.ts`.
- [ ] **StepReport-Literale:** `rg -n "contract: null \}" tests src/ui` → Erwartung nur `tests/sim/tick.test.ts`.
- [ ] **Lagergrenze:** `rg -n "STORAGE_CAP|export function addStock" src/sim` → Signatur `addStock(isl, good, n): number` notieren (P-6).
- [ ] **Nachbarn** (je Befehl `; echo EXIT=$?`, Exit 0 = auf main): `git merge-base --is-ancestor feat/i210 main`, `… feat/inselproben main`, `… integrate/rel-34 main`, `… feat/hafen main`, `… feat/ausbau-logik main`; dazu `git log --oneline 07cd8183..main -- src/sim/save.ts tests/sim/helpers.ts src/sim/tick.ts src/sim/population.ts src/sim/types.ts src/ui/inspect.ts`. Ergebnis ins Ledger (für T01, T06).
- [ ] **Messfenster:** `make messfenster; echo EXIT=$?` und `uptime` ins Ledger (nur Information, kein Testlauf in T00).
- [ ] Meldung an den Controller: Basis-Commit, `SAVE_VERSION`, Treffer der drei Prüfungen, Nachbarn. Weicht ein Treffer vom Plan ab: Stopp, Befund.
