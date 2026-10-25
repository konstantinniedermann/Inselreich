# T05 · Messlauf Schuldbrief: Referenz und Gegenstrategien (Lösbarkeit und Wahl)

Umsetzer `tech-sim-engineer` · ≈ 50 Tools · AK-IP-14 · blocked-by: T03 · Worktree `.worktrees/inselproben-mess` (`feat/inselproben-mess` ab `feat/inselproben`
nach T03) · Spec §5.4, §10; Anhang 02 C; Anhang 01 §d–§g · **Mess-Task (P-2): Ergebnis sofort an L0, F7 gilt erst nach Ruling**

## Dateien

- neu: `tests/sim/challengeControllers.ts` (Controller-Erweiterungen, kein Test), `tests/sim/challenge-solvable.test.ts`
- nicht ändern: `tests/sim/controller.ts`, `tests/sim/merchantsController.ts` (nur importieren), `src/`, Defs (Werte ändern nur per Ruling)

## Interfaces

- Consumes: `startChallenge`, `repayDebt`, `challengeDeadline` (T02/T03); `startColony`, `control`, `layoutFor`, `CONTROL_INTERVAL` (`controller.ts`);
  `BUILDING_DEFS` (Geld-Baukosten).
- Produces (`tests/sim/challengeControllers.ts`):

```ts
export interface DebtPlan {
  kSwitch: number;
  reserve: number;
  demolishAfterWin: boolean;
}
export const DEBT_PLANS: Readonly<Record<'Ref' | 'G1' | 'G2' | 'G3' | 'M53' | 'M70', DebtPlan>>;
export function buildMoneyCost(w: World): number; // Σ Geld-Baukosten aller stehenden Gebäude (ohne Kontor)
export interface DebtRun {
  outcome: 'passed' | 'failed' | null;
  tick: number;
  interestPaid: number;
  switchTick: number | null;
  minMoney: number;
}
export function runDebt(plan: DebtPlan, kEnd: number): DebtRun;
export function measureKEnd(): number; // Basis-Lauf Probe p1 bis Sieg, buildMoneyCost beim Sieg
```

## Verhalten (Anhang 02 C, wörtlich übernommen)

- `DEBT_PLANS`: Ref `kSwitch` 0,63; G1 1,00; G2 0,13; G3 1,00 mit `demolishAfterWin: true`; M53 0,53; M70 0,70; alle `reserve` 150.
- `k = buildMoneyCost(w) / kEnd`, je Takt (`CONTROL_INTERVAL` 100) gemessen. `kEnd = measureKEnd()` (Erwartung ≈ 18 400, Anhang 01; Abweichung > 15 % im Bericht).
- `runDebt`: Welt `startChallenge({ kind: 'scenario', id: 'debt' })`, `startColony`; Schleife bis `result !== null` oder `tick > deadline`:
  bei `tick % CONTROL_INTERVAL === 0` → **Phase A** (Schuld > 0, `k < kSwitch` und nicht `won`): `control(w, layout, {})`, nie tilgen; **Phase B** (Schuld > 0,
  `k ≥ kSwitch` oder `won`): nicht bauen, `repayDebt(w, min(repayStep, debt))` wiederholen, solange `money − reserve ≥` Betrag; **Phase C** (Schuld 0):
  `control(w, layout, {})` bis zum Ziel. G3: beim ersten Takt nach `won` alle Gebäude ausser Kontor per `demolish` und alle Wege per `removeRoad`, danach Phase B.
  Dann `step(w)`. `switchTick` = erster Takt in Phase B.
- Nur Sim-Aktionen und `startColony` (P-5); kein Schreibzugriff auf Kasse, Lager, Flaggen.

## Steps

- [ ] **Erkundung (Worktree, nicht committet):** `runDebt` je Plan einmal mit Log (`VITE_BALANCE_LOG=1`), Werte notieren.
- [ ] **Tests rot** in `tests/sim/challenge-solvable.test.ts`, `describe('AK-IP-14 Schuldbrief')`, Läufe einmal in `beforeAll` (Timeout 60 000 ms):
  - `Ref` besteht: `outcome === 'passed'`, `tick < 0.8 × deadlineTicks` (aus den Defs gerechnet, = 14 400).
  - Rang: `tick(Ref) < tick(G1) < tick(G2)`; alle drei `passed`.
  - Gesamtzins: `interestPaid(Ref) < interestPaid(G1)`.
  - G3: `outcome !== 'passed' || tick(G3) >= tick(Ref)` (Erstattung 0).
  - Flache Mitte: `|tick(M53) − tick(Ref)| ≤ 300` und `|tick(M70) − tick(Ref)| ≤ 300`.
  - Pins nach dem ersten grünen Lauf: `K_END`, `tick` und `interestPaid` je Plan als Konstanten mit Kommentar «Messwert, Änderung nur per Ruling (F7, P-2)»
    und `expect(...).toBe(PIN)`.
  - Erwartung ≈ 8700 ± 600 für Ref: **kein** Assert; Wert und Abweichung im Bericht (Anhang 01 ist ein Modell mit ± 1 min).
- [ ] **Lauf rot:** `npx vitest run tests/sim/challenge-solvable.test.ts; echo EXIT=$?` → ≠ 0 (Datei/Controller fehlen).
- [ ] **Umsetzen** `challengeControllers.ts` nach Verhalten.
- [ ] **Lauf grün:** `npx vitest run tests/sim/challenge-solvable.test.ts; echo EXIT=$?` → 0; Laufzeit der Datei im Bericht.
      **Verletzt ein Lauf eine Bedingung:** keine Werte und keine Strategie anpassen; Task endet `blocked` mit Tabelle (Plan, `outcome`, `tick`, `interestPaid`,
      `switchTick`, `minMoney`) an den Controller; der meldet an L0 (Rückfall S0 3750, Anhang 01 §g). Weiter erst nach Ruling per `SendMessage`.
- [ ] **Teilbeleg** (Index); `make zeittests` (keine Uhr in der Datei).
- [ ] **Commit:** `test: Lösbarkeit Schuldbrief mit Referenz und Gegenstrategien (Inselproben T05)`.

## Meldung an L0 (Controller, sofort nach Grün)

Entwurf (R471): «Inselproben AK-IP-14 grün: Ref {t}/{min}, G1 {t}, G2 {t}, G3 {…}, Zins Ref {z} < G1 {z}, Mitte ±{d}; K_end {k}. Empfehlung: F7 (K0 5000, S0 3000,
z 5 ‰, T 18 000, Schritt 500, Erstattung 0) als Ruling.»

## Task-Review

Prüfen: Phasenwechsel genau nach Anhang 02 C; Reserve 150; keine direkten Zustandsschreibzugriffe (`rg -n "\.money\s*=|stock\.[a-z]+\s*=|won\s*=" tests/sim/challengeControllers.ts` leer);
Pins stammen aus dem Lauf (Bericht zeigt Log); `controller.ts` ohne Diff; Datei nicht in `balance*`.
