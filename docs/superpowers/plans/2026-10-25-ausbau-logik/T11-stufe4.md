# T11 AL-4 Stufe 4, Freischaltung U7, Ausbau 3 → 4

Persona `tech-sim-engineer` · Strang A2 · Tools ≈ 70 · AK-AL-01 (Stufe 4), Teil 4 von 04, 07, 08, 09, 10, 11, 12; 03 (Wiederholung), 19, 20, 49 (Stufe 4) · blocked-by Merge-Gate 1.

Spec: R1 (U7 wörtlich), R2, R4, Anhang 01 (Zeilen Stufe 4), AK-AL-01, 04, 07–12, 19, 20; Plan P-6, P-8, P-14.

**Worktree:** `.worktrees/ausbau-logik-2`, Branch `feat/ausbau-logik-2` von `main` nach Merge von Etappe 1; `git worktree list` zuerst. `git merge --no-edit plan/ausbau-logik`, falls der Plan nicht auf main liegt.

**Files:** Modify `src/sim/defs/levels.ts` (dritte Einträge ausser `hunter`), `src/sim/defs/unlocks.ts` (U7, `UNLOCK_IDS`, `UNLOCK_CHAIN`, `FUNCTION_LABELS.upgrade4`), `src/sim/types.ts` (`UnlockId` + `'U7'`, `UnlockFunction` + `'upgrade4'`, `Building.level?: 2 | 3 | 4`), `src/sim/levelChecks.ts` (Wissenszeile Stufe 4 → `upgrade4`; Fachkräfte-Text «Verleger»/Kaufmannshaus), `src/sim/upgrade.ts` (nur falls noch ein `level === 3`/Tupel-Rest besteht), Tests `tests/sim/levelRules.test.ts`, `tests/sim/upgrade.test.ts`, `tests/sim/unlock-timeline.test.ts`, `tests/sim/levelDominance.test.ts`, `tests/sim/levelChecks.test.ts`. **Nicht** `src/sim/save.ts` (T12): bis T12 lehnt die Ladeprüfung `level` 4 ab — Tests in T11 laden keine Stände mit Stufe 4.

**Interfaces:** `LEVELS[x].length === 3` für zehn Typen, `2` für `hunter`; `functionLock(world, 'upgrade4')`; U7 `trigger: { kind: 'tierReached', tier: 4 }`, Texte nach R1. `levelChecks(world, b, 4)` nutzt `upgrade4`, Werkstätten-Ware Glas (Weberei/Werkzeugmacher 3, Brennerei/Glashütte 4), Fischer Stoff 3.

## Schritte

- [ ] **Tests zuerst:**
  - **AK-AL-01 (4)** Tabelle im Test um Stufe 4 erweitert (Anhang 01), Länge 3/2, `extra` Glas nur Stufe 4 der vier Werkstätten, Fischer Stoff 2/2/3. **AK-AL-03** läuft unverändert über alle Einträge.
  - **Teil 4:** AK-07 Fischer A g 4 mit einer anderen in Abstand 3 → k 3; AK-08 Steinbruch Ecke (7 Gebirge in r 2) g 4 → k 4; AK-09 Weberei g 4 ohne Feuerwache → k 4; AK-10 k = 4 → Fischer 12; AK-11 Glashütte g 4, k 2 auf Glas-Vorteilsinsel → `effectiveCycle(…, 30)`, mit Rat anteilig; AK-12 Glashütte g 4, k 2 → 44, k = g → 55.
  - **AK-AL-04 Teil 4 / P-14:** Ausbau 3 → 4 mit Kaufmannshaus im Arbeitsweg und Glas → `ok`, bucht Stufe-4-Kosten und Ware; je ✗-Zeile der Stufe 4 der erwartete Text, Welt unverändert. Fischer A g 3 mit genau zwei anderen Hütten B (Abstand 2) und C (Abstand 3), sonst keine in d ≤ 3 (Aufstellung wie AK-AL-17) → k 2 (Stufe 3 erlaubt höchstens eine, Anhang 01). **Beide** Nachbarn B und C im selben Tick abreissen → ohne `step` k 3 und Ausbau 3 → 4 `ok` (Stufe 4 verlangt 0 andere in d ≤ 3; übrige Stufe-4-Bedingungen in der Welt erfüllt: Kaufmannshaus ≤ 8, Stoff 3, Kosten, U7). Gegenprobe: nur B abreissen → k 3, Ausbau 3 → 4 scheitert mit dem Fischgrund-Text, Welt unverändert (Gate-Auflage 1, R942).
  - **AK-AL-19** ohne Kaufmannshaus (`unlockAll` aus, U5 erreicht) → 3 → 4 scheitert mit lockText U7; nach erstem Haus `tier` 4 und Freischalt-Check → `ok`. Jagdhütte g 3 und Fischer g 4 → «Höchste Stufe erreicht».
  - **AK-AL-20** in `unlock-timeline.test.ts`: U7 nach U6 frei, sobald ein Haus `tier` 4 steht, Meldung «die ersten Kaufleute sind da»; `UNLOCK_CHAIN` endet mit `'U7'`; `unlockAll` enthält U7; Tipps U3/U5 ohne «gegen Stoff»/«kostet Rum».
  - **AK-AL-49 (4)** in `levelDominance.test.ts`: Schleife deckt Stufe 4 ab (M > 0; Kontrolle Rechnung (e2) Spalte Stufe 4 als Kommentar).
  - Wissens- und Fachkräfte-Zeile Stufe 4 in `levelChecks.test.ts` (Text «Verleger im Umkreis 8: Kaufmannshaus, …» bzw. ✗-Text N5).
- [ ] **Rot-Lauf:** `npx vitest run tests/sim/levelRules.test.ts tests/sim/upgrade.test.ts tests/sim/unlock-timeline.test.ts tests/sim/levelDominance.test.ts tests/sim/levelChecks.test.ts; echo EXIT=$?` → Exit ≠ 0.
- [ ] **Umsetzen.** Neue U7 darf keine bestehende Freischalt-Reihenfolge verändern (Kaufleute sind `requiresWin`).
- [ ] **Grün:** gleicher Lauf → 0; `npx vitest related --run src/sim/defs/levels.ts src/sim/defs/unlocks.ts src/sim/types.ts src/sim/levelChecks.ts; echo EXIT=$?` → 0.
- [ ] **Balancing:** `npx vitest run tests/sim/balance.test.ts tests/sim/balance-upgrade.test.ts tests/sim/balance-ausbau.test.ts <Baseline-Liste>; echo EXIT=$?` → 0 (Stufe 4 erst nach Ziel 1, Controller baut nie auf 4).
- [ ] **Teilbeleg:** `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.
- [ ] **Commit:** `feat: Ausbau Stufe 4 mit den ersten Kaufleuten (AUSBAU-LOGIK T11)`.
