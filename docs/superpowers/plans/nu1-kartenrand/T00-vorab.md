# T00 · Vorab: Worktree, Basis, Nachbarn, Pin-Liste

Strang A · Persona `tech-sim-engineer` · Modell sonnet · ≈ 20 Tools · blocked-by: Gate Plan · AK: –

**Ziel:** Arbeitsbaum steht, Ausgangswerte und Merge-Stand der Nachbarpakete sind notiert, die Pin-Liste ist gegen den Stand geprüft.

**Testsperre: Last ≤ 4 nötig** (1-min-Load, `make messfenster` Exit 0), sonst `waiting` und erneut prüfen.

## Schritte

- [ ] **Worktree** (Controller, nicht der Arbeiter): `git worktree add -b feat/nu1-kartenrand .worktrees/nu1 main`; darin `git merge --no-edit design/neue-ufer` und `git merge --no-edit plan/nu1-kartenrand` (nur Doku). Danach `git log --oneline -3`.
- [ ] **Basis notieren** (Ledger): `rg -n "SAVE_VERSION =" src/sim/save.ts`; `rg -n "version: [0-9]+" src/sim/world.ts src/sim/types.ts`; `rg -n "STORAGE_CAP|ROUTE_GOODS_PER_DIRECTION" src` (Erwartung Stand Plan: Sim `save.ts:692`, `ships.ts:81–82,153`, `economy.ts:13`, `trade.ts:127`, `queries.ts:209`; UI `trade.ts:292`, `storageFull.ts:52,80`, `hud.ts:92,131,841`, `hints.ts:238`, `inspect.ts:824`).
- [ ] **Nachbarn** (je Befehl `; echo EXIT=$?`, Exit 0 = auf main): `git merge-base --is-ancestor feat/hafen main`, `… feat/i210 main`, `… feat/volllast main`, `… feat/ausbau-logik main`; dazu `git log --oneline 07cd8183..main -- src/sim/ships.ts src/sim/islands.ts src/sim/save.ts src/sim/levels.ts src/sim/tick.ts src/sim/types.ts tests/sim/helpers.ts`. Ergebnis ins Ledger (für T03, T04, T09).
- [ ] **Pin-Liste:** die Suchbefehle aus [`pins.md`](pins.md) ausführen; Treffer, die dort fehlen, an den Controller (nicht selbst ergänzen).
- [ ] **Zeiten vorher** (nur wenn main seit Plan `07cd8183` Commits in den Dateien oben hat; sonst gilt [`zeiten.md`](zeiten.md)): Befehl aus `zeiten.md`, Ausgabe nur im Scratchpad, Last vor/nach ins Ledger. Lauf vorher bei main anmelden (E-080).
- [ ] **Grundlauf:** `npx vitest run tests/sim/balance.test.ts tests/sim/unlocks.test.ts tests/sim/ships.test.ts tests/sim/imports.test.ts tests/sim/helpers.test.ts; echo EXIT=$?` → 0.

## Ergebnis an den Controller

`SAVE_VERSION` auf main, vier Merge-Stände, Drift-Treffer, Pin-Abweichungen, Zeitliste (oder «zeiten.md gilt»), Exit-Codes. Kein Commit in T00.
