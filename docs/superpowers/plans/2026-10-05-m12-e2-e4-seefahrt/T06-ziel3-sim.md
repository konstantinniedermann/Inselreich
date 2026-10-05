> **Task-ID:** T06 · **AK-IDs:** AK-Z3-02 … AK-Z3-08, AK-Z3-10, AK-Z3-13 (Teil); Pin M8 AK-S3-03 (Anhang 05 I)
> **blocked-by:** T05 · **Strang:** e3, `.worktrees/m12-see-e3` · `tech-sim-engineer` (sonnet)
> **Regeln:** Spec Anhang 05 B, F (`goalView`), G (Randfälle), J.1 … J.5; Index P-8

## T06: Drittes Ziel „Gewürzstadt" — Regel, `goalView`, Szenario

**Ziel:** `checkWin` setzt `wonSpice`, wenn 80 Kaufleute seit 600 Ticks voll versorgt sind (inkl. Gewürz) und eine
Schiffsroute Gewürz von einer Fremdinsel mit eigener Plantage heimholt. Rein lesend, ohne Zufall.

**Code-Fakten:** `tick.ts` `checkWin` (setzt `won`, dann `wonMerchants`), Platz nach `tickCrises`, vor `tickUnlocks`;
`population.ts` `allNeedsMet(house, tier)` (bzw. die Funktion, die `satisfiedSince` steuert — per `grep -n
satisfiedSince src/sim` finden), `merchants(world)`; `queries.ts` `GoalView`, `goalView`; `ui/goal.ts`
`goalTexts` (`switch` ohne `default`). `World.ships`, `Route` (T01); `WIN_SPICE_*` (T02); `seaHelpers.ts`.

**Dateien:** `src/sim/tick.ts` (nur `checkWin`), `src/sim/queries.ts` (`GoalView`, `goalView`), neu
`src/sim/goal3.ts`; `src/ui/goal.ts` (nur Brücke, s. u.); neu `tests/sim/goal3.test.ts`, `tests/sim/scenariosSea.ts`,
`tests/sim/fixtures/z3-scenario-v9.json`; `tests/sim/queries.test.ts`.

## Schnittstellen (Produces)

```ts
// src/sim/goal3.ts — importiert nur ./types, ./defs/*, ./population, ./world
/** Summe der EW aller Häuser Stufe 4 mit allNeedsMet und tick − satisfiedSince ≥ WIN_SPICE_HOLD (Anhang 05 B.1). */
export function spiceMerchants(world: World): number;
/** Es gibt ein Schiff mit Route 0 ↔ i (i ≥ 1), Gewürz in Richtung i → 0, und eine spicefarm auf i (B.2). */
export function spiceLoop(world: World): boolean;
// queries.ts
export type GoalView =
  /* citizens, merchants wie heute */
  | { phase: 'spice'; current: number; target: number; loop: boolean }
  | { phase: 'done'; current: number; target: number };
```

## Regeln (verbindlich)

- `checkWin` (J.4, Reihenfolge unverändert): nach `won`, `wonMerchants`:
  `if (world.wonMerchants && !world.wonSpice && spiceMerchants(world) >= WIN_SPICE_MERCHANTS && spiceLoop(world))
world.wonSpice = true;` — Auswertung nur bei `wonMerchants && !wonSpice` (J.3), nie zurück. Erstes, zweites und
  drittes Ziel im selben Tick möglich.
- `spiceLoop`: `route.a === 0 && route.b === i && ba` enthält `spice`, **oder** `route.a === i && route.b === 0 &&
ab` enthält `spice`; `i ≥ 1`; `homing` hat `route null` → zählt nicht; Route zwischen zwei Fremdinseln zählt nicht;
  `spicefarm` mit `island === i` vorhanden (Zustand, nicht `connected`). Nur „es gibt" und Summen — unabhängig von
  der Iterationsreihenfolge; kein `createRng`; schreibt nichts.
- `goalView`: `wonSpice` → `{ phase: 'done', current: merchants(world), target: WIN_SPICE_MERCHANTS }`;
  `wonMerchants` → `{ phase: 'spice', current: spiceMerchants(world), target: WIN_SPICE_MERCHANTS, loop:
spiceLoop(world) }`; sonst wie heute.
- **Brücke `ui/goal.ts`** (damit `tsc` grün bleibt; T07 ersetzt sie): `case 'spice':` liefert die Texte der Phase
  `merchants` mit `view.current`/`view.target` (Kommentar „Brücke T06, Texte in T07"). Keine weitere UI-Änderung.
- **Szenario (J.5)** `tests/sim/scenariosSea.ts` `spiceGoalScenario(opts?: { houses?: number; withShip?: boolean;
withFarm?: boolean; spiceInStock?: boolean; wonMerchants?: boolean })`: `seaWorld()`, `foundKontor2Literal(w, 2)`,
  1 `spicefarm` auf 2, Schiff (`shipLiteral`) mit Route `{ a: 0, b: 2, ab: [], ba: [{ good: 'spice', reserve: 10 }] }`,
  4 Kaufmannshäuser zu 20 EW in der Heimat mit allen Diensten, alle Bedarfsgüter (inkl. Gewürz 100) im Heimatlager,
  `won = wonMerchants = true`. Häuser per Literal mit `satisfiedSince = tick`; Lager je 100 Ticks nachfüllen ist
  Teil der Testschleife (`refill(w)`), nicht des Helfers.
- **Fixture für AK-Z3-14** `tests/sim/fixtures/z3-scenario-v9.json` = `serialize(spiceGoalScenario())`, einmal per
  Scratch-Test geschrieben; ein Test prüft `deserialize(...).ok` und Gleichheit mit dem Helfer.

## Schritte

- [ ] **1 Tests zuerst** `tests/sim/goal3.test.ts`, `describe('M12 Z3 Gewürzstadt')`, Schleife `step` + `refill`:
  - **AK-Z3-02** Szenario: 599 Ticks nach `satisfiedSince` → `wonSpice false`; 600 → `true`.
  - **AK-Z3-03** `houses: 3` → nach 1000 Ticks `false`; ein Haus ohne Gewürz (`spiceInStock: false` für dessen
    Versorgung: Gewürz 0, kein Nachfüllen) → `false`; 4 Häuser → `true`.
  - **AK-Z3-04** je `false` nach 1000 Ticks: ohne Schiff; Route ohne Gewürz; Gewürz in `ab` (0 → 2); Route A ↔ B
    (`{a: 1, b: 2}`); Schiff `homing` mit `route null`; ohne `spicefarm` auf 2. Szenario → `true`.
  - **AK-Z3-05** ohne Schiff und Plantage, Heimat-Gewürz per `buy` je 100 Ticks nachgekauft → 4 Häuser versorgt
    (`spiceMerchants` = 80 nach 600), nach 2000 Ticks `wonSpice false`.
  - **AK-Z3-06** `wonMerchants: false` → `false`; Szenario mit `wonMerchants false`, aber Kaufleute ≥ `WIN_MERCHANTS`
    und `won true` → `wonMerchants` und `wonSpice` im selben `step` (Haltezeit erfüllt).
  - **AK-Z3-07** nach `true`: alle Plantagen und Häuser per `demolish`, Route `null` (Literal), 1000 Ticks → `true`;
    `goalView(w).phase === 'done'`.
  - **AK-Z3-08** Szenario zweimal → gleicher Setz-Tick, `serialize` gleich; `vi.spyOn` auf `createRng`: in
    `checkWin`/`spiceMerchants`/`spiceLoop` 0 Aufrufe (eigene Datei `goal3-rng.test.ts` falls `vi.mock` nötig).
  - `queries.test.ts` **AK-Z3-10** + Pin **M8 AK-S3-03** (bewusst, R239 (3)): `wonMerchants` ohne `wonSpice` →
    `'spice'` mit `current` (B.1) und `loop` (B.2); `'done'` erst mit `wonSpice`; vorher wie heute.
  - **AK-Z3-13 (Teil)** `balance-merchants.test.ts`: Ende des Controller-Laufs `wonSpice === false`; vorläufiger Pin
    aus T05 **unverändert grün** (J.2: Nachtrag ändert ihn nicht).
- [ ] **2 Rot-Beleg** → Commit `test: M12 Z3 drittes Ziel Sim (rot)`.
- [ ] **3 Umsetzung** nach „Regeln"; Fixture schreiben.
- [ ] **4 Prüfen:** Bitgleich (`OFF_FINGERPRINT`, 7850, AK-E0-19, `balance.test.ts` Diff leer, `balance-merchants`
      = Pin T05); `make check`, `CI=true make check` → Commit `feat: M12 Z3 drittes Ziel Gewürzstadt (Sim)`.

**Review-Fokus:** rein lesend, kein `createRng`; Auswertung nur bei `wonMerchants && !wonSpice`; Reihenfolge in
`checkWin`; Randfälle G; T05-Pin unverändert; Brücke in `goal.ts` minimal.
