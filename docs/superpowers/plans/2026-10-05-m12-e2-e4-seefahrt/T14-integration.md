> **Task-ID:** T14 · **AK-IDs:** AK-E2-03 (Speichern/Laden, R228 (1), R230), AK-E4-09 (mit Gewürz), AK-E4-11,
> AK-E3-05 (Neupin endgültig), AK-Z3-13, AK-M12-B1 … B5 (Nachweis); Auflage J.2; Fixture für AK-E4-13
> **blocked-by:** T07, T09, T11, T13 (je Review OK), Merge-Punkt **M2** · **Strang:** int, `.worktrees/m12-see` ·
> Controller merged; `tech-sim-engineer` (sonnet) für Tests und Messung
> **Regeln:** Index Merge-Fluss, P-8; Spec Anhang 03 D (Neupin mit Befehl und Commit), Anhang 05 J.2

## T14: Integration — Stränge zusammenführen, Querschnittstests, Neupin endgültig

**Ziel:** Auf `feat/m12-see` laufen alle Teile zusammen; Fälle, die mehrere Stränge brauchen, sind getestet; der
`balance-merchants`-Pin ist auf der Integrationsbranch nach Einbau von `checkWin` gemessen (J.2).

## Schritte

- [ ] **0 Ledger (prod-B6):** C7 liest die Strang-Ledger `/Users/KN/CAS/projekte/anno-clone/.superpowers/sdd/m12-see/
{e2,e3,e4,render}.md` und überträgt SHAs, Pins und Befunde ins Ledger `int.md`.
- [ ] **0b Merges (Controller, vor dem Implementierer)** in dieser Reihenfolge, je `make check` danach, SHAs ins Ledger:
      (M2) `feat/m12-e1` Endstand bzw. `main`, wenn E1 dort ist; `feat/m12-see-e2` (enthält `render` bis T10);
      `feat/m12-see-e3` (enthält `e2` bis T04); `feat/m12-see-e4`; `feat/m12-see-render`. Erwartete Berührung: `tick.ts`
      (`checkWin` aus e3, `step` aus e4 — getrennte Funktionen). Ein inhaltlicher Konflikt (beide Seiten ändern
      dieselbe Logik) → nicht selbst entscheiden, Meldung an lead-tech.
- [ ] **1 Tests zuerst** (Implementierer):
  - `save.test.ts` **AK-E2-03 (R228 (1))**: `seaWorld()`, `kontor2` per `placeBuilding` auf 2, Schiff per `buyShip`,
    Route 0 ⇄ 2 (Gewürz holen) per `setRoute`; `step` bis zur Ankunft in 2 (danach `port 2`, `to 0`, Route gesetzt) →
    `demolish(kontor2)` „Erst Route auflösen"; `clearRoute` → `demolish` `ok`; `serialize` → `deserialize` `ok`;
    weiter bis Ankunft in 0 → `homing false`, Ladung entladen, Schiff frei.
  - `save.test.ts` **AK-E4-11**: Lauf mit 2 Schiffen auf Routen bis Tick t (ein Schiff mitten auf der Fahrt, Ladung an
    Bord); Zweig A 1000 `step` weiter; Zweig B `serialize` → `deserialize` → 1000 `step`; `serialize(A) === serialize(B)`;
    Round-trip v9 mit Schiffen zeichengleich (lead-qa Teil B).
  - `tick.test.ts` **AK-E4-09 (Gewürz)**: Kaufmannshaus in der Heimat, Gewürz 0, Schiff kommt im selben `step` mit
    Gewürz an → Bedarf in diesem Schritt gedeckt (`satisfied.spice true`).
  - `goal3.test.ts` läuft jetzt mit `tickShips` (Schiffe im Szenario fahren): AK-Z3-02 … -08 unverändert grün;
    zusätzlich **Ende-zu-Ende**: Szenario mit echter Plantage auf 2 (Lager 2 Gewürz 20) und echtem Schiff → bei der
    ersten Ankunft in der Heimat steigt Heimat-Gewürz um die entladene Menge (Ladung vor minus nach dem Umschlag);
    nach der Haltezeit `wonSpice true`.
  - **qa-B1:** `z3-scenario-v9.json` laden, **ohne** Nachfüllen `WIN_SPICE_HOLD + 100` `step` (mit `tickShips`) →
    `wonSpice true`. Rot → Rezept in `scenariosSea.ts` (Lager, `satisfiedSince`) nachbemessen, Fixture neu schreiben.
  - **qa-B7:** Save/Load in der Haltezeit: `spiceGoalScenario()` 300 Schritte; Zweig A weiter, Zweig B `serialize` →
    `deserialize` → weiter; Ziel im selben Tick gesetzt, `serialize(A) === serialize(B)` nach dem Setzen.
- [ ] **2 Rot-Beleg** (wo rot; Tests, die schon grün sind, im Commit-Text als „Querschnitt, grün nach Merge" nennen)
      → Commit `test: M12 Seefahrt Querschnitt (rot)`.
- [ ] **3 Neupin endgültig (J.2, P-8):** `npx vitest run tests/sim/balance-merchants.test.ts` auf `feat/m12-see`
      mit allen Teilen. Werte müssen **gleich** dem vorläufigen T05-Pin sein (Begründung J.2: die Zielprüfung wirkt
      erst nach `wonMerchants`, der Controller bricht bei `wonMerchants` ab, `tickShips` ist ohne Schiffe leer).
      Gleich → Kommentar auf `// R226 F-03, gemessen auf feat/m12-see @ <sha> mit <Befehl> (Anhang 05 J.2)`;
      **verschieden → anhalten, R74**, nichts nachstellen. **AK-Z3-13:** Ende `wonSpice false`; `OFF_FINGERPRINT
0x701c6da5` mit erweitertem `normalized()`; `git diff main -- tests/sim/balance.test.ts` leer.
- [ ] **4 Nachweis AK-M12-B1 … B5** ins Ledger: Diff `balance.test.ts` leer; `balance-crises` (`OFF_REFERENCE`,
      Fingerabdruck, 7850/7850, M6:AK-B2-05/06); `balance-merchants` = Neupin; AK-E0-19-Folge; Kette `save-v1` …
      `save-v8` → v9, `version 10` unbekannt.
- [ ] **5 Fixture AK-E4-13** `tests/sim/fixtures/see-route-start-v9.json`: Seed 3, `unlockAll`, `kontor2` auf
      Felsbucht (per `placeBuilding`), ein Schiff gekauft und frei im Heimathafen, Lager Felsbucht Gewürz 30; Test
      prüft `deserialize ok` und die vier Bedingungen. Rezept als Funktion `seeRouteStart()` in `scenariosSea.ts`.
- [ ] **6 Prüfen:** `make check`, `CI=true make check` → Commit `test: M12 Seefahrt Integration, Neupin bestätigt`
      (Befehl, SHA und Werte im Commit-Text).

**Review-Fokus:** Merge-Reihenfolge und -Konflikte; Neupin gleich T05 oder Halt; Querschnittsfälle echt über die
Aktionen (nicht nur Literale); Fixture-Rezepte reproduzierbar; Browser-Fixture erreicht das Ziel ohne Nachfüllen.
