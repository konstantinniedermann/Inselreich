# T03 · Schuldbrief: Zins, Frist, `repayDebt`, keine Erstattung bei offener Schuld

Umsetzer `tech-sim-engineer` · ≈ 55 Tools · AK-IP-05, -06, -07, -08, -10 (Szenario), -30 · blocked-by: T02 · Worktree `.worktrees/inselproben`
(`feat/inselproben`) · Spec §5.1 (Verloren), §5.4, §11; Anhang 02 A

## Dateien

- ändern: `src/sim/challenge.ts`, `src/sim/economy.ts` (`demolishRefund`), `src/sim/build.ts` (`removeRoad`, `demolish`), `src/sim/queries.ts`
  (`effectiveRefund`), `tests/sim/challenge.test.ts`
- nicht ändern: `refundCost` (bleibt rein), `grantRefund`, `src/ui/` (Anzeigen folgen in T11), Defs

## Interfaces

- Consumes (T01/T02): `SCENARIOS.debt` (`interestPermille`, `deadlineTicks`, `repayStep`, `refundPct`), `tickChallenge`, `startChallenge`.
- Produces (`src/sim/challenge.ts`):
  - `canRepay(world: World, amount: unknown): Result` — reine Prüfung ohne Schreibzugriff (Gründe wie Verhalten 2); die UI liest daraus Tooltip und Blässe.
  - `repayDebt(world: World, amount: unknown): Result` — `canRepay`, bei `ok` buchen.
  - `repayAll(world: World): Result` — ruft `repayDebt(world, min(repayStep, debt))` wiederholt, solange es `ok` liefert; `ok`, wenn mindestens ein Schritt
    gezahlt wurde, sonst der Grund des ersten Versuchs.
  - `interestDue(world: World): number` — `ceil(debt × interestPermille / 1000)` bei laufendem Schuldbrief (`result === null`) mit Schuld > 0, sonst 0 (UI liest es je 100 Ticks).
  - `challengeDeadline(c: ChallengeState): number | null` — `deadlineTicks` bei `scenario`, sonst `null`.
- Produces (`src/sim/economy.ts`): `demolishRefund(world: World, cost: Cost): Cost` — läuft ein Schuldbrief (`kind === 'scenario'`, `result === null`,
  `debt > 0`), dann `refundCost(cost)` je Feld × `refundPct / 100` abgerundet (bei 0: alles 0); sonst `refundCost(cost)`.

## Verhalten

1. `tickChallenge` (Reihenfolge Anhang 02 A): (1) `null` oder `result` → zurück; (2) **Zins**: `scenario`, Schuld > 0, `world.tick > 0`,
   `world.tick % UPKEEP_INTERVAL === 0` → `money -= interestDue`, `interestPaid += interestDue`; (3) Bestehen (T02); (4) **Frist**: `scenario`, `result === null`,
   `world.tick >= deadlineTicks` → `result = { outcome: 'failed', tick: world.tick }`. Kasse darf negativ werden; kein Bankrott.
2. `repayDebt`, Gründe in dieser Prüfreihenfolge: keine Probe oder `kind !== 'scenario'` → «Kein Schuldbrief»; `result !== null` → «Schuldbrief beendet»;
   Schuld 0 → «Schuld beglichen»; `amount !== min(repayStep, debt)` (inkl. `undefined`, `NaN`, `'500'`, 500,5) → «Ungültiger Betrag»; `money < amount` →
   «Zu wenig Geld». Erfolg: `money -= amount`, `debt -= amount`. Misserfolg: Welt unverändert. Wirft nie.
3. `build.ts`: `removeRoad` und beide Zweige von `demolish` nutzen `demolishRefund`; `effectiveRefund` (`queries.ts`) startet mit `demolishRefund(world, cost)`
   statt `refundCost(cost)`. Gilt auf allen Inseln (Geld und Güter, Gebäude und Strassen).

## Steps

- [ ] **Tests rot** in `tests/sim/challenge.test.ts` (Schuldbrief-Welt `sw()` = `startChallenge({ kind: 'scenario', id: 'debt' })`; Tick, Kasse, Häuser dürfen
      als Testaufbau gesetzt werden, Flaggen `won` nur in 05 c):
  - `AK-IP-05` getrennte `it`: (a) ≥ 50 Bürger, Schuld 3000 → nach `step` kein `result`; (b) bei `world.tick === t` `repayDebt` des Rests (Schuld vorher auf
    300 gesetzt, Kasse 1000) → `step` erzeugt `t + 1` und `result = { passed, t + 1 }`; (c) `won = true`, jetzt < 50 Bürger, Schuld 0 → kein `result`;
    (d) Schuld > 0: Abriss eines Hauses, eines Betriebs, eines Wegs und eines Fernkontors erstattet 0 Geld und 0 Güter; `effectiveRefund(w, cost)` = 0 je Feld;
    (e) Schuld 0 → Erstattung `= refundCost`; ebenso nach `result` (`failed`, Schuld 1500); (f) `createWorld(3)` → `demolishRefund` gleich `refundCost`.
  - `AK-IP-06`: ohne Bestehen Tick auf `T − 2` setzen; nach `step` (`T − 1`) `result === null`; nach `T` `{ failed, T }`; nach `T + 1` unverändert. Bestehen
    genau im Schritt `T` (≥ 50 Bürger, Schuld 0, Tick `T − 1`) → `{ passed, T }`. Danach kein Zins: Zwilling mit `challenge = null` und gleicher Kasse, je
    200 Schritte → gleiche Kasse, `interestPaid` konstant.
  - `AK-IP-07`: Zwilling ohne Probe (gleiche Kasse); Kassen-Differenz nach den Schritten auf 99, 100, 101, 200 = 0, 15, 15, 30 (`ceil(3000 × 5 / 1000)` aus
    den Defs gerechnet, kein Literal 15 ausser im Erwartungswert mit Herleitung); `interestPaid` gleich; Tick 0 nie belastet; Schuld 0 → kein Zins; Kasse 10
    bei Tick 99 → nach `step` negativ; Tick `T − 1` → nach `step`: Zins gebucht **und** `failed` (Zins vor Frist).
  - `AK-IP-08`: Kasse 600 → `repayDebt(w, 500)` ok, Schuld 2500, Kasse 100; Schuld 300 → `repayDebt(w, 300)` ok; Fälle `ok: false` mit Grund und
    `sortedJson` vor/nach gleich: Kasse 499 («Zu wenig Geld»), Schuld 0 («Schuld beglichen»), `createWorld(3)` («Kein Schuldbrief»), Probe `p1` («Kein
    Schuldbrief»), Betrag 400 / 1000 / `undefined` / `NaN` / `'500'` («Ungültiger Betrag»), nach `result` («Schuldbrief beendet»); `expect(() => …).not.toThrow()`; `canRepay` liefert je Fall denselben Grund und ändert die Welt nie (auch bei `ok`).
  - **Review Focus 2** `repayAll`: Kasse −50 / 499 / 500 / 1499 bei Schuld 3000 → gezahlt 0 / 0 / 500 / 1000; Schuld 200, Kasse 300 → gezahlt 200, `ok`.
  - `AK-IP-10 Szenario`: zwei Läufe `sw()` mit `startColony`/`runColony` bis Tick 2000 und `repayDebt(w, 500)` bei Tick 1000 und 1500 (nur wenn ok) → gleiche Hashes.
  - `AK-IP-30`: Lauf A durchgehend 1500 Ticks (Controller-Takt wie oben, `repayDebt` bei 600 und 1200); Lauf B identisch, aber bei Tick 99, 100 und 700 (Schuld > 0)
    `deserialize(serialize(w))` und `layoutFor(w)` neu → nach 1500 gleiche Hashes. Zweiter Fall: Tick auf `T − 3`, Laden bei `T − 1`, Ende `T + 1`: gleich, `result` `failed`.
- [ ] **Lauf rot:** `npx vitest run tests/sim/challenge.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–3.
- [ ] **Lauf grün:** `npx vitest run tests/sim/challenge.test.ts tests/sim/challenge-mirror.test.ts tests/sim/economy.test.ts tests/sim/roads.test.ts tests/sim/queries.test.ts tests/sim/islands.test.ts tests/sim/townhall.test.ts tests/sim/council.test.ts; echo EXIT=$?` → 0.
- [ ] **Teilbeleg** inkl. `npx vitest run tests/sim/balance*.test.ts; echo EXIT=$?` → 0; `git diff main -- tests/sim/balance*.test.ts` leer.
- [ ] **Commit:** `feat: Schuldbrief mit Zins, Frist, Tilgen und ohne Abriss-Erstattung (Inselproben T03)`.

## Task-Review

Prüfen: Reihenfolge Zins → Bestehen → Frist im Code; `demolishRefund` ist die einzige Erstattungsquelle in `build.ts` und `effectiveRefund` (`rg -n
"refundCost\(" src/sim` zeigt nur `economy.ts`); Grundspiel unverändert (AK-IP-05 f, Spiegel AK-IP-31 a, Balancing grün); `repayDebt` prüft `typeof` vor
Vergleich; keine Literale 500/5/3000/18000 in `challenge.ts` (AK-IP-12 b läuft mit).
