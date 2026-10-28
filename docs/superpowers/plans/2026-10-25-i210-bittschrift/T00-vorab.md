# T00 Vorab: Testzeiten, Tickrate, Basis

Persona `tech-sim-engineer` · Strang A · Tools ≈ 25 · blocked-by: Gate Plan. **Last ≤ 4 nötig** für die Messschritte.

- [ ] **Worktree:** zuerst `git worktree list` (R329). Dann `.worktrees/i210`, Branch `feat/i210` von `main` (`git rev-parse main` notieren), danach `git merge plan/i210-bittschrift` (kein Rebase), damit der Plan im Baum liegt. Die Spec liest du aus `design/i210-bittschrift` (`git show design/i210-bittschrift:docs/superpowers/specs/…`, abschnittsweise).
- [ ] **Last:** `uptime`, dann `make messfenster; echo EXIT=$?`. Bei Exit ≠ 0 oder 1-min-Load > 4: Basis-Schritte (unten) erledigen, dann `waiting` an den Controller. Messungen erst im Fenster.
- [ ] **Testzeiten auf main (R392), vor Task 1:** Die Dauer je Testdatei kommt nach `.superpowers/sdd/i210/zeiten-main.json`; je Befehl `…; echo EXIT=$?`, nie in eine Pipe:
  - `npx vitest related --run src/sim/population.ts src/sim/flow.ts src/sim/levels.ts src/sim/economy.ts src/sim/production.ts src/sim/trade.ts src/sim/ships.ts src/sim/queries.ts src/sim/tick.ts src/sim/world.ts src/sim/types.ts src/sim/save.ts --reporter=json --outputFile=.superpowers/sdd/i210/zeiten-main.json`
  - `npx vitest related --run src/ui/settings.ts src/ui/hud.ts src/ui/inspect.ts src/ui/app.ts --reporter=json --outputFile=.superpowers/sdd/i210/zeiten-main-ui.json`
  - `npx vitest run tests/sim/balance.test.ts` dreimal; den Median der Wandzeit für T03 notieren.
  - Ins Ledger: alle Dateien mit Dauer > 500 ms (Name, ms). Diese Liste prüft T15 (R392-Auslegung R905: neu > 500 ms ist verboten, bestehende > 500 ms höchstens +50 %).
- [ ] **Tickrate (Gate B-5):** Probe `tests/sim/zz-tickrate.probe.test.ts`, **nie committen**, nach dem Lauf löschen.

```ts
// Kaufleute-Stadt als Stellvertreter der Anhang-01-Lage (6 Kaufmannshäuser mit Ketten)
const w = createWorld(3, {});
const { layout } = startColony(w); // tests/sim/controller.ts
runMerchants(w, layout, newMerchantTrajectory()); // bis wonMerchants
const t0 = performance.now();
for (let i = 0; i < 6000; i++) step(w);
const ms = performance.now() - t0; // Ticks/s = 6000 / (ms / 1000); dazu Gebäudezahl, Häuser
```

Lauf dreimal einzeln: `npx vitest run tests/sim/zz-tickrate.probe.test.ts --silent=false; echo EXIT=$?`. Ins Ledger kommen der Median der Ticks/s (r) und die Gebäudezahl.

- [ ] **Messregel anwenden** (Ticks je Datei aus dem Index, «Risiken»; 5 s Aufbau-Reserve):
  - r ≥ 11 000 T/s → alle Dominanzdateien mit zwei Seeds `[3, 7]`.
  - 9 000 ≤ r < 11 000 → `-b1b3` mit einem Seed (3), die übrigen mit zwei.
  - r < 9 000 → alle Dominanzdateien mit einem Seed (3), R553-Begründung nach P-9.
  - r < 5 500 → `-b1b3` und `-b6b9` zusätzlich je Bitte eine Datei (`petitionsDominance-b1.test.ts` usw.), Meldung an den Controller **vor** T06.
  - Die Entscheidung kommt ins Ledger. T06 prüft sie an der echten Dateidauer nach.
- [ ] **Basis:** `rg -n "SAVE_VERSION =" src/sim/save.ts` (Wert notieren, T05 setzt + 1); `rg -n "migrateV.*ToV" src/sim/save.ts | tail -2`; `ls src/sim/challenge.ts` (INSELPROBEN in main? → P-12); `ls src/sim/feastEffect.ts` (I-201 in main? → Phase 2); `rg -n "STORAGE_CAP" src` (erwartet: `economy.ts`, `trade.ts`, `ships.ts`, `queries.ts`, `defs/goods.ts`, P-5).
- [ ] **Baseline-Liste:** `ls tests/sim | rg "^balance|baseline|bitgleich"`. Die Liste im Index (Prüfpflichten) ergänzt du im Ledger um weitere Treffer; T03 und T15 nutzen genau diese Liste.
- [ ] **Drift seit Spec:** `git log --oneline 74f3b181..main -- src/sim/population.ts src/sim/flow.ts src/sim/levels.ts src/sim/economy.ts src/sim/trade.ts src/sim/ships.ts src/sim/tick.ts src/sim/save.ts src/sim/feast.ts`. Bei Änderungen nach Symbolen arbeiten (`houseCap`, `consume`, `goodsBalance`, `cycleOf`, `addStock`, `unload`), nicht nach Zeilen.

Beleg: Zeiten, r, Seed-Entscheid, Basiswerte und Drift im Bericht. Kein Commit.
