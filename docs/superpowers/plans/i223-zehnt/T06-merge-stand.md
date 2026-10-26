# T06 · Merge-Stand: main holen, Save-Nummer, Faltung

Strang A · Persona `tech-sim-engineer` (Fortsetzung per `SendMessage`) · Modell sonnet · ≈ 35 Tools · blocked-by: T05 · AK-ZE-01 (Hashes), -08, -16, -27 erneut · Regeln R909, R983; Plan P-6, P-7, P-8

**Testsperre: Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`. Kein Review-Task: das Final-Review prüft T06 mit.

**Files:** alle Dateien der Matrix, nur zum Auflösen von Merge-Konflikten und für die Nachzüge unten. Keine neue Regel.

## Schritte

- [ ] `git -C .worktrees/i223 merge main; echo EXIT=$?` (kein Rebase). Konflikte nach der Tabelle lösen; unklarer Konflikt in `save.ts`, `helpers.ts`, `tick.ts` → Stopp, Befund an den Controller.
- [ ] **Save-Nummer (P-7):** `git show main:src/sim/save.ts | rg -n "SAVE_VERSION ="` → M. `SAVE_VERSION` = M + 1; Migration in `migrateV<M>ToV<M+1>` umbenennen, `raw.version = M + 1`, Aufruf hinter dem letzten Kettenschritt von main. Doc «äusserster Faltschritt v<M+1> → v<M>» in `foldBackTithe` nachziehen.
- [ ] **Faltung (P-8):** Jeder neue `drop*`-Schritt von main (z. B. `dropPetitions`, `dropChallenge`, `dropExpedition`) bleibt; `dropTithe` steht **innen** (zuerst angewendet), z. B. `dropTrial(dropPetitions(dropTithe(input)))`, in allen drei Köpfen. Aussenketten: `foldBackTithe` ganz innen, z. B. `foldBackSeerecht(foldBackPetitions(foldBackTithe(json)))`. `rg -n "foldBackFarOrders\(dropCouncil" tests/sim/helpers.ts` → 3 Treffer, jeder mit `dropTithe(input)`.
- [ ] **StepReport:** neue Felder von main (`petitions`, `expedition`) und `titheLost` beide im Interface und im Rückgabe-Literal von `step`; `rg -n "contract: null \}" tests src/ui` → jedes Literal hat alle Felder.
- [ ] **Lagergrenze (P-6):** `rg -n "export function addStock" src/sim/economy.ts`; geänderte Signatur (z. B. mit `world`) → Aufruf in `tickTaxes` anpassen; `rg -n "STORAGE_CAP" src/sim/population.ts src/sim/tax.ts src/ui/titheView.ts; echo EXIT=$?` → Exit 1. Gibt es auf main einen Wächter für `STORAGE_CAP` (NU-1 AK-40), läuft er grün.
- [ ] **Tick-Reihenfolge:** `rg -n "tick[A-Z]\w*\(world\)" src/sim/tick.ts` → `tickTaxes` weiter nach `tickProduction` und `tickPopulation` (AK-ZE-22).
- [ ] **17 Verbraucher erneut einzeln** (Befehlsschleife aus T01, plus `scenario-saves`/`m5-session` für `scenarios.ts`), Exit je Datei ins Ledger; `git diff main -- tests/sim/seaGolden.test.ts tests/sim/balance.test.ts` leer.
- [ ] Gezielt: `npx vitest run tests/sim/tithe.test.ts tests/sim/tithe-save.test.ts tests/ui/titheView.test.ts tests/ui/tithe-source.test.ts tests/sim/balance.test.ts; echo EXIT=$?` → 0.
- [ ] **AK-ZE-16 voller Lauf** (einmal, einzige Ausnahme von «nie voller Lauf je Task»; Last ≤ 4 vor dem Start): `make test; echo EXIT=$?` → 0 (auf main bekannte rote Tests, z. B. `perf.test.ts` AK-E0-15a, im Ledger mit main-Beleg).
- [ ] **Zeiten (R905):** `npx vitest related --run --maxWorkers=2 --reporter=json --outputFile=<scratch>/times-branch.json <Quelldateien aus zeiten.md>; echo EXIT=$?`; Werte > 200 ms ins Ledger; T08 trägt die Spalte «Branch» in `zeiten.md` ein. Neue Tests > 500 ms oder alte > + 50 % → Befund an den Controller.
- [ ] Teilbeleg: `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?`, `make conflicts; echo EXIT=$?`.
- [ ] Merge-Commit mit Standardtext; Nachzüge als eigener Commit `fix: I-223 Save-Schritt und Faltung nach main-Merge (T06)`.

## Konflikttabelle (erwartet, Stand Plan main `07cd8183`)

| Datei                                                  | Paket                                               | Auflösung                                       |
| ------------------------------------------------------ | --------------------------------------------------- | ----------------------------------------------- |
| `tests/sim/helpers.ts` drei Köpfe                      | I-210, Inselproben, NU-1                            | beide `drop*` behalten, `dropTithe` innen (P-8) |
| `farOrder-save`, `save-loyalty`, `helpers.test`        | Inselproben, NU-1, Stadtplanung                     | `foldBackTithe` innen                           |
| `src/sim/save.ts` `SAVE_VERSION`, Kette, Strukturcheck | I-210, Inselproben, NU-1, I-215, HAFEN, FLAECHE, GV | main + 1, Schritt ans Ende                      |
| `src/sim/tick.ts` `StepReport`, `return`               | I-210, Inselproben, NU-1                            | alle Felder                                     |
| `src/sim/types.ts`, `world.ts`                         | I-210, Inselproben, NU-1, I-215, HAFEN              | Felder beider Seiten                            |
| `src/ui/inspect.ts`, `src/ui/app.ts`                   | I-201, AUSBAU-LOGIK, Inselproben, Stadtplanung      | beide Hunks                                     |

Merged ein weiteres Paket mit Save-Schritt zwischen T06 und der Integration: T06 erneut (ein Fortsetzen), Integrator merged nicht über Konflikte in `save.ts`/`helpers.ts`.
