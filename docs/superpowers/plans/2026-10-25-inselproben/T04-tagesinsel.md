# T04 · Tagesinsel in der Sim: `dailyDef`, Start, 730 Karten

Umsetzer `tech-sim-engineer` · ≈ 35 Tools · AK-IP-09, AK-IP-10 (Tagesinsel) · blocked-by: T03 · Worktree `.worktrees/inselproben` (`feat/inselproben`) ·
läuft parallel zu T08 (anderer Worktree) · Spec §5.3, §8, §11

## Dateien

- ändern: `src/sim/challenge.ts` (`dailyDef`, Zweig `daily` in `startChallenge`), `tests/sim/challenge.test.ts`
- neu: `tests/sim/challenge-daily.test.ts`
- nicht ändern: `src/sim/mapgen.ts` (fällt ein Tag durch: `blocked` mit Datum und Fehlermeldung an den Controller, kein Eingriff), Defs

## Interfaces

- Consumes (T01): `parseDayNumber`, `weekdayOf` (`src/sim/calendar.ts`), `DAILY_PLAN`, `DAILY_ID`.
- Produces (`src/sim/challenge.ts`):

```ts
export interface DailyDef {
  seed: number;
  weekday: number;
  goal: ChallengeGoal;
  crisisLevel: CrisisLevel;
}
export function dailyDef(
  date: unknown,
): { ok: true; def: DailyDef } | { ok: false; reason: string };
```

## Verhalten

1. `dailyDef`: `parseDayNumber(date)` → `null` ergibt `{ ok: false, reason: 'Tagesinsel nicht verfügbar' }`; sonst `seed = date`, `weekday = weekdayOf(...)`,
   `goal`/`crisisLevel` aus `DAILY_PLAN[weekday]`.
2. `startChallenge({ kind: 'daily', date })`: Welt `createWorld(date, { crisisLevel, unlockAll: false })` (`world.seed` = genutzte Nummer, darf von `date`
   abweichen), `challenge = { kind: 'daily', id: DAILY_ID, date, goal, debt: 0, interestPaid: 0, result: null }`; ungültig → Grund aus `dailyDef`.
3. Keine Uhrzeit in der Sim; das Datum kommt nur als Zahl.

## Steps

- [ ] **Step 0 Messprobe (Scratchpad, nicht unter `tests/`):** Laufzeit von `generateMap(n)` für alle 31 Tage im Oktober 2026 messen (bei 1-min-Load ≤ 4; Ausführweg wie T01 Step 0, Uhr `performance.now()` nur in der `.mess.ts`-Datei);
      hochgerechnet auf 730 Tage. Über 60 s → Teststichprobe (Verhalten unten, Variante B); Wert im Bericht.
- [ ] **Tests rot** in `tests/sim/challenge.test.ts`:
  - `AK-IP-09`: `dailyDef(20261023)` → `{ ok: true, def: { seed: 20261023, weekday: 4, goal: 'citizens', crisisLevel: 'mild' } }`; 20261024 → `merchants`,
    `mild`; 20261025 → `merchants`, `normal`; 20261021 → `citizens`, `off`. Ungültig (20261301, 20260231, 20270229, 20261000, `undefined`) → `ok: false`,
    Grund «Tagesinsel nicht verfügbar», kein Wurf.
  - `AK-IP-09 Start`: `startChallenge({ kind: 'daily', date: 20261023 })` → `challenge.kind === 'daily'`, `id === 'daily'`, `date === 20261023`, `goal`
    `citizens`, `crisisLevel` `mild`, `unlocked` `['U0']`, `world.seed === generateMap(20261023).seedUsed`.
  - `AK-IP-10 Tagesinsel`: zwei Läufe gleiches Datum, 1000 Schritte mit Controller-Takt (`startColony`/`runColony`, `stop` bei 1000) → gleiche Hashes; anderes
    Datum → anderer `world.seed` oder andere Karte (Hash verschieden).
- [ ] **Laufzeit-Test** `tests/sim/challenge-daily.test.ts` (`AK-IP-09 Laufzeit`): `it.each` über 24 Monate 2026-01 … 2027-12, je Fall Timeout 30 000 ms:
      für jeden Tag des Monats (Monatslänge aus `parseDayNumber`, Tag 1…31 probieren) `generateMap(n)` wirft nicht, `terrain.length === MAP_W * MAP_H`,
      `Number.isInteger(seedUsed)`, Kontor in den Kartengrenzen. **Variante B** (nur wenn Step 0 > 60 s): jeder 7. Tag plus erster und letzter Tag je Monat;
      Kommentar mit Messwert.
- [ ] **Lauf rot:** `npx vitest run tests/sim/challenge.test.ts tests/sim/challenge-daily.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–3.
- [ ] **Lauf grün:** dieselben Dateien, Laufzeit von `challenge-daily.test.ts` im Bericht; `echo EXIT=$?` → 0.
- [ ] **Teilbeleg** inkl. `npx vitest run tests/sim/balance*.test.ts; echo EXIT=$?` → 0.
- [ ] **Commit:** `feat: Tagesinsel aus der Datumszahl (Inselproben T04)`.

## Task-Review

Prüfen: kein `Date` in `src/sim/` (`rg -n "Date" src/sim` ohne neue Treffer); Wochentag nur über `calendar.ts`; `challenge.date` ist die Datumszahl, nicht
`world.seed`; Laufzeit-Datei liegt nicht in `ZEITTESTS` (keine Uhr im Test); Testdauer ≤ 60 s oder Variante B begründet.
