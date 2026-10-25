# T02 · `startChallenge`, `tickChallenge` (Bestehen), Reihenfolge in `step`

Umsetzer `tech-sim-engineer` · ≈ 50 Tools · AK-IP-02, -03, -04, -10 (Probe), -12 b, -13, -31 · blocked-by: T01 · Worktree `.worktrees/inselproben`
(`feat/inselproben`) · Spec §5.1, §5.2, §8, §9, §10; Anhang 02 A

## Dateien

- neu: `src/sim/challenge.ts`, `tests/sim/challenge-mirror.test.ts`
- ändern: `src/sim/tick.ts` (Import, letzter Aufruf, Kommentar Z. 53), `tests/sim/challenge.test.ts`; `src/sim/defs/challenges.ts` nur, falls AK-IP-03 eine
  Karten-Nummer verwirft (nächste Zahl mit `seedUsed === seed`; Umsetzungsentscheid, im Bericht nennen)
- Test-Hilfen: Helfer aus `goal3.test.ts`/`monument.test.ts` dürfen unverändert nach `tests/sim/helpers.ts` bzw. `monumentHelpers.ts` verschoben werden
- nicht ändern: `tests/sim/balance*.test.ts`, `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`

## Interfaces

- Consumes (T01): Typen `ChallengeState`, `ChallengeGoal`, `ChallengeKind`; `PROBES`, `SCENARIOS`, `DAILY_ID`; `PRE_HASH_RUN` aus `tests/sim/challengePins.ts`.
- Produces (`src/sim/challenge.ts`):

```ts
export type ChallengeStart =
  | { kind: 'probe'; id: string }
  | { kind: 'scenario'; id: string }
  | { kind: 'daily'; date: number };
export type ChallengeStartResult = { ok: true; world: World } | { ok: false; reason: string };
export function startChallenge(start: ChallengeStart): ChallengeStartResult;
export function tickChallenge(world: World): void;
export function goalReached(world: World, c: ChallengeState): boolean; // auch für die Ziel-Anzeige der UI
```

## Verhalten

1. `startChallenge` `probe`: Def per Id, sonst `{ ok: false, reason: 'Unbekannte Probe' }`; `scenario`: sonst «Unbekanntes Szenario»; `daily`: in diesem Task
   `{ ok: false, reason: 'Tagesinsel nicht verfügbar' }` (T04 ersetzt). Welt `createWorld(def.seed, { crisisLevel: def.crisisLevel, unlockAll: false })`, danach
   `challenge = { kind, id, date: null, goal: def.goal, debt: 0, interestPaid: 0, result: null }`; Szenario zusätzlich `money = def.startMoney`, `debt = def.debt`.
   Wirft nie (auch bei `undefined`, falschem `kind`).
2. `goalReached`: `probe`/`daily` lesen die einmalige Flagge (`citizens` → `won`, `merchants` → `wonMerchants`, `spice` → `wonSpice`, `monument` →
   `monumentDone`); `scenario` prüft den **aktuellen** Stand `citizens(world) >= WIN_CITIZENS && c.debt === 0`.
3. `tickChallenge`: `challenge === null` → sofort zurück, schreibt nichts. `result !== null` → zurück. (Zins und Frist folgen in T03 an den markierten
   Stellen: Zins vor Bestehen, Frist danach.) Bestehen: `goalReached` → `result = { outcome: 'passed', tick: world.tick }`.
4. `step`: `tickChallenge(world)` als **letzter** Aufruf hinter `tickUnlocks`; Kommentar an `tickUnlocks` wird zu «Bitgleichheit, Spec 4.3, ADR-005-Nachtrag;
   danach nur noch tickChallenge (ohne Probe sofortige Rückkehr, Inselproben AK-IP-31)», am neuen Aufruf «letzter Aufruf (AK-IP-31)».
5. Zahlenliterale in `src/sim/challenge*.ts` nur `0`, `1`, `1000`, `10000`, `100`, `7` (AK-IP-12 b); Werte über die Defs, Zinstakt über `UPKEEP_INTERVAL`.

## Steps

- [ ] **Tests rot** in `tests/sim/challenge.test.ts`:
  - `AK-IP-02` (`it.each(PROBES)` und `SCENARIOS.debt`): `world.seed === def.seed` (nach AK-IP-03), `crisisLevel`, `unlocked` gleich `['U0']`, `challenge` mit
    `kind`, `id`, `goal`, `date: null`, `debt` 0 (Schuldbrief 3000), `interestPaid` 0, `result: null`; Kasse `START_MONEY` (Schuldbrief 5000). Unbekannte Id,
    `{ kind: 'x' }`, `undefined` → `ok: false`, kein Wurf.
  - `AK-IP-03`: für jede Probe `generateMap(def.seed).seedUsed === def.seed`; `new Set(PROBES.map(p => p.seed)).size === 5`.
  - `AK-IP-04` je Ziel-Art (`it.each(['citizens','merchants','spice','monument'])`): Welt per Helfer so aufbauen, dass die Flagge durch `step` kippt (nie
    direkt setzen): `citizens`/`merchants` über `village`/`setHouse`, `spice` über `spiceGoalScenario` (`scenariosSea.ts`), `monument` über
    `monumentHelpers.ts` mit letztem Abschnitt kurz vor dem Ende; `challenge` als Probe-Literal mit passendem `goal` setzen. Schrittweise bis zum Kippen
    (höchstens 2000 Schritte), `t` = `world.tick` im Kipp-Schritt (aus der Welt gelesen). Nach dem Schritt `t − 1`: `result === null`; nach `t`:
    `{ outcome: 'passed', tick: t }`; fünf weitere Schritte: `challenge` unverändert (`toEqual` Kopie). Bevölkerung sinkt danach (Häuser abreissen): bleibt bestanden.
  - `AK-IP-10 Probe`: zwei Läufe `startChallenge({ kind: 'probe', id: 'p1' })`, `startColony` + `runColony` mit `stop = w => w.tick >= 3000` → gleiche
    `fnv1a32(sortedJson(json(w)))`.
  - `AK-IP-12 b`: Textsuche über alle `src/sim/challenge*.ts` (per `readdirSync`), Kommentare und Strings entfernt, Zahl-Token `/\b\d[\d_]*(\.\d+)?\b/g`
    nur aus {0, 1, 100, 1000, 10000, 7}; ausdrücklich kein `18000`, `18_000`, `500`, `5`, `3000`.
  - `AK-IP-13`: Textsuche: `tests/sim/controller.ts`, `tests/sim/merchantsController.ts`, `tests/sim/balance*.test.ts` enthalten kein `startChallenge`.
  - `AK-IP-31 b`: Probe-Welt kurz vor 50 Bürgern: im Schritt, in dem `won` kippt, gilt `result.tick === world.tick`; kippt im selben Schritt eine
    Freischaltung (`unlocked` vorher/nachher), ist sie im selben Schritt sichtbar, in dem `result` gesetzt wird.
  - `AK-IP-31 c`: Dreiklang für AK-IP-04 (oben, `t − 1 / t / t + 1`).
- [ ] **Spiegel-Test** `tests/sim/challenge-mirror.test.ts` (`AK-IP-31 a`): `vi.mock('../../src/sim/challenge', …)` mit `tickChallenge` als No-op; Lauf
      `buildColony(createWorld(3))`, Hash nach `foldBackChallenge` (Version 0) `=== PRE_HASH_RUN`. Gegenstück in `challenge.test.ts` (echter `tickChallenge`) ist
      AK-IP-01 aus T01: beide gleich ⇒ Ein- und Ausschalten ändert nichts.
- [ ] **Lauf rot:** `npx vitest run tests/sim/challenge.test.ts tests/sim/challenge-mirror.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–5.
- [ ] **Lauf grün:** dieselben Dateien plus `tests/sim/tick.test.ts` (falls vorhanden), `tests/sim/unlocks.test.ts`, `tests/sim/goal3.test.ts`,
      `tests/sim/monument.test.ts`; `echo EXIT=$?` → 0.
- [ ] **Teilbeleg** inkl. `npx vitest run tests/sim/balance*.test.ts; echo EXIT=$?` → 0 (AK-IP-13); Determinismus-Beleg: AK-IP-01, -31 a grün.
- [ ] **Commit:** `feat: startChallenge und tickChallenge als letzter Schritt (Inselproben T02)`.

## Task-Review

Prüfen: `tickChallenge` steht als letzte Zeile von `step`, kehrt bei `null` vor jedem Schreibzugriff zurück; `startChallenge` liest Einstellungen nicht
(`unlockAll` fest `false`); Szenario-Bestehen nach aktuellem Stand, nicht über `won`; keine Flagge in Tests direkt gesetzt (AK-IP-04); AK-IP-12 b deckt
neue Dateien `challenge*.ts` automatisch ab; Karten-Nummer-Wechsel (falls) begründet und in `PROBES` eingetragen.
