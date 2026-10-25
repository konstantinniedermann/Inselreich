# T01 · Defs, Kalender, Weltfeld `challenge`, Save versionsneutral, Rückfalt-Helfer

Umsetzer `tech-sim-engineer` · ≈ 60 Tools · AK-IP-01, AK-IP-09 (Kalender, ungültige Zahlen), AK-IP-11, AK-IP-12 a · blocked-by: T00 ·
Worktree `.worktrees/inselproben` (`feat/inselproben` ab `plan/inselproben`, vorher `git merge main`) · Spec §5.1–5.4, §7, Anhang 02 A/B

## Dateien

- neu: `src/sim/defs/challenges.ts`, `src/sim/calendar.ts`, `tests/sim/challenge.test.ts`, `tests/sim/challengePins.ts` (Pins, exportiert)
- ändern: `src/sim/types.ts` (Typen, `World.challenge`, `version`), `src/sim/world.ts` (`version`, `challenge: null` als letztes Feld), `src/sim/save.ts`,
  `tests/sim/helpers.ts`, Aufrufer der äussersten Faltschritte (`rg -n "foldBackTrial\(" tests` heute: `helpers.test.ts`, `farOrder-save.test.ts`, `save-loyalty.test.ts`)
- nicht ändern: `src/sim/tick.ts`, `tests/sim/balance*.test.ts`, übrige Defs

## Interfaces

Produces (`src/sim/types.ts`):

```ts
export type ChallengeKind = 'probe' | 'daily' | 'scenario';
export type ChallengeGoal = 'citizens' | 'merchants' | 'spice' | 'monument';
export interface ChallengeResult {
  outcome: 'passed' | 'failed';
  tick: number;
}
export interface ChallengeState {
  kind: ChallengeKind;
  id: string;
  date: number | null;
  goal: ChallengeGoal;
  debt: number;
  interestPaid: number;
  result: ChallengeResult | null;
}
// World: … trial: TrialState; challenge: ChallengeState | null;   (letztes Feld)
```

Produces (`src/sim/defs/challenges.ts`, Spielwerte nur hier):

- `interface ProbeDef { id: string; nr: number; name: string; seed: number; crisisLevel: CrisisLevel; goal: ChallengeGoal }`
- `PROBES: readonly ProbeDef[]` mit Ids `'p1'…'p5'`, `nr` 1–5, Werte laut Index «Global Constraints» (Namen «Erste Ernte», «Unruhige Küste», «Handelsstadt»,
  «Gewürzstadt», «Feuerschale»).
- `interface DailyRow { goal: ChallengeGoal; crisisLevel: CrisisLevel }`, `DAILY_PLAN: readonly DailyRow[]` (Länge 7, Index 0 = Montag), `DAILY_ID = 'daily'`.
- `interface ScenarioDef { id: string; name: string; story: string; seed: number; crisisLevel: CrisisLevel; goal: ChallengeGoal; startMoney: number;
debt: number; interestPermille: number; deadlineTicks: number; repayStep: number; refundPct: number }`
- `SCENARIOS: Readonly<Record<string, ScenarioDef>>` mit genau `debt`: `name` «Schuldbrief», `seed` 3, `crisisLevel` `'off'`, `goal` `'citizens'`,
  `startMoney` 5000, `debt` 3000, `interestPermille` 5, `deadlineTicks` 18 000, `repayStep` 500, `refundPct` 0, `story` wörtlich: «Die Krone hat dir die
  Insel auf Pfand überlassen. Begleiche die Schuld und bau eine Stadt mit 50 Bürgern, bevor die Frist abläuft.» Kommentar: «Vorschlag bis Ruling nach AK-IP-14 (F7)».
- `CHALLENGE_REV = 1`; `GOAL_TEXT: Readonly<Record<ChallengeGoal, string>>` = «50 Bürger», «Handelsstadt», «Gewürzstadt», «Denkmal».
- `CHALLENGE_GOALS: readonly ChallengeGoal[]`, `CHALLENGE_KINDS: readonly ChallengeKind[]` (für die Ladeprüfung).

Produces (`src/sim/calendar.ts`, reine Kalender-Rechnung, keine Spielwerte, kein `Date`):

- `interface DayParts { y: number; m: number; d: number }`
- `parseDayNumber(n: unknown): DayParts | null` — ganzzahlig, `y = ⌊n / 10000⌋` in 1 … 9999, Monat 1–12, Tag 1 … Monatslänge (Schaltjahr gregorianisch).
- `weekdayOf(p: DayParts): number` — 0 = Montag … 6 = Sonntag (Tageszahl seit Epoche, z. B. «days from civil», mod 7, nie negativ).

Produces (`src/sim/save.ts`): `SAVE_V_CHALLENGE = 19` (Kommentar «main beim Merge + 1, R874 E-A; T14 passt an»), `SAVE_VERSION = SAVE_V_CHALLENGE`,
`migrateToChallenge(raw: Record<string, unknown>): void` (setzt `challenge: null`, `version = SAVE_V_CHALLENGE`, wirft nie), modul-intern `isValidChallenge(raw)`.

Produces (`tests/sim/helpers.ts`): `dropChallenge(x)` (entfernt nur `challenge`, Version bleibt), `foldBackChallenge(x)` (= `dropChallenge` und `version − 1`;
wirft «foldBackChallenge: Probe nicht rückfaltbar», wenn `challenge !== null`). `foldBackToV13` ruft innen `dropChallenge(dropTrial(…))` vor `dropCouncil`.

## Verhalten

1. Kette in `deserialize`: als **letzte** Migrationszeile `if (raw.version === SAVE_V_CHALLENGE - 1) migrateToChallenge(raw);` (nach `migrateV17ToV18`).
2. `isValidChallenge` (in `isWellFormed` nach `isValidTrial`): `null` gültig; sonst Objekt mit `kind` in `CHALLENGE_KINDS`; `id`: `probe` → in `PROBES`,
   `scenario` → Schlüssel in `SCENARIOS`, `daily` → genau `DAILY_ID`; `date`: bei `daily` `parseDayNumber(date) !== null`, sonst `null`; `goal` in
   `CHALLENGE_GOALS`; `debt`, `interestPaid` ganzzahlig ≥ 0; `debt > 0` nur bei `scenario`; `result` `null` oder `{ outcome: 'passed' | 'failed', tick }` mit
   ganzzahligem `tick` in 0 … `raw.tick`. Sonst «Beschädigter Spielstand».
3. `types.ts`/`world.ts`: `version: 19` (Literal wie heute; ein Test pinnt `createWorld(3).version === SAVE_VERSION`).

## Steps

- [ ] **Step 0 Pin vor jeder Änderung (AK-IP-01):** Auf unverändertem Code im Scratchpad (nicht unter `tests/`) messen; **Ausführweg (N5, keine neue Abhängigkeit):** Datei `<Scratchpad>/pin.mess.ts` (Importe mit absolutem Pfad auf `<Worktree>/src/…`, `<Worktree>/tests/sim/helpers.ts`), Konfiguration `<Scratchpad>/mess.config.mjs` mit `export default { test: { dir: '<Scratchpad>', include: ['**/*.mess.ts'] } }`, Lauf `npx vitest run --root <Worktree> --config <Scratchpad>/mess.config.mjs; echo EXIT=$?`; Ausgabe per `console.info`. Messen:
      `fnv1a32(sortedJson({ ...JSON.parse(serialize(createWorld(3))), version: 0 }))` und dasselbe nach `buildColony(createWorld(3))` (Basis-Controller,
      Sieg 6750). Beide Hex-Werte als `PRE_HASH_WORLD`, `PRE_HASH_RUN` in `tests/sim/challenge.test.ts` mit Vermerk «Messwert vor T01, main ec144e82, Version
      neutralisiert» in `tests/sim/challengePins.ts` ablegen (T02 nutzt sie im Spiegel-Test).
- [ ] **Tests rot** in `tests/sim/challenge.test.ts`:
  - `AK-IP-01`: `createWorld(3).challenge === null`; Hash nach `foldBackChallenge` (Version 0 gesetzt) = `PRE_HASH_WORLD`; nach `buildColony` = `PRE_HASH_RUN`.
  - `AK-IP-12 a`: `PROBES` (5 Zeilen, Ids, `nr`, Namen, Seeds 3/21/58/345/777, Ziele, Krisen), `DAILY_PLAN` (7 Zeilen wie Index), `SCENARIOS.debt` (alle
    Felder), `CHALLENGE_REV === 1` gegen die Spec-Werte; Ids eindeutig.
  - `AK-IP-09 Kalender`: `weekdayOf(parseDayNumber(n)!)` gegen feste Tabelle: 20261019 → 0 (Mo), 20261020 → 1, 20261021 → 2, 20261022 → 3, 20261023 → 4,
    20261024 → 5, 20261025 → 6, 20270101 → 4 (Fr), 20280229 → 1 (Di). Ungültig → `null`: 20261301, 20260231, 20270229, 20261000, `1.5`, `'20261023'`, −1.
  - `AK-IP-11 a`: `deserialize(serialize(w))` erhält `challenge` für `null`, laufend (`probe`, `result: null`), bestanden, verloren, Schuldbrief mit
    `debt` 2500 und `interestPaid` 120, Tagesinsel mit `date` 20261023 (Zustände als Literal auf `createWorld(3)` gesetzt, `tick` ≥ `result.tick`).
  - `AK-IP-11 b`: `foldBackChallenge(json(createWorld(3)))` lädt, `challenge === null`, `version === SAVE_VERSION`; `migrateToChallenge({})` und
    `migrateToChallenge({ challenge: 'x', version: 'y' })` werfen nicht (`expect(() => …).not.toThrow()`); danach `challenge === null`.
  - `AK-IP-11 c` (`it.each`): unbekanntes `kind`, `debt` −1, `debt` 1,5, `debt` > 0 bei `probe`, `date` bei `probe`, `daily` mit `date` 20270229,
    `daily` mit `id` `'p1'`, unbekannte Probe-Id, `goal` `'gold'`, `result.outcome` `'won'`, `result.tick` > `tick`, `interestPaid` −1 → je
    `{ ok: false, reason: 'Beschädigter Spielstand' }`, kein Wurf.
  - `AK-IP-11 d`: Stand mit laufender Probe und `version: SAVE_VERSION + 1` → «Unbekannte Version».
  - `AK-IP-11 e`: für `x = json(createWorld(3))`: `foldBackChallenge(foldBackTrial(x))` gleich `foldBackTrial(foldBackChallenge(x))` (`sortedJson`), und
    gleich mit einem Test-Stub `foldBackKey('charter')` (entfernt einen fehlenden Schlüssel, `version − 1`) in beiden Reihenfolgen; Version = `x.version − 2` bzw. − 3.
- [ ] **Lauf rot:** `npx vitest run tests/sim/challenge.test.ts; echo EXIT=$?` → ≠ 0 (Module fehlen).
- [ ] **Umsetzen** nach Interfaces und Verhalten 1–3; Faltschritt-Aufrufer ergänzen: äusserster Schritt `foldBackChallenge(…)` um die bestehenden Ketten
      (z. B. `foldBackDeliveries(foldBackCouncil(foldBackTrial(foldBackChallenge(json(w)))))`). Weitere Treffer: `rg -n "foldBackTrial|'trial'\]|toBe\(18\)" tests` prüfen.
- [ ] **Lauf grün:** `npx vitest run tests/sim/challenge.test.ts tests/sim/save.test.ts tests/sim/trial-save.test.ts tests/sim/helpers.test.ts tests/sim/farOrder-save.test.ts tests/sim/save-loyalty.test.ts tests/sim/scenario-saves.test.ts tests/sim/reserve-bitgleich.test.ts tests/sim/seaGolden.test.ts; echo EXIT=$?` → 0.
- [ ] **Teilbeleg** (Index «Test- und Prüfpflichten»), inkl. `npx vitest run tests/sim/balance*.test.ts; echo EXIT=$?` → 0.
- [ ] **Commit:** `feat: Weltfeld challenge, Defs und Save versionsneutral (Inselproben T01)`.

## Task-Review

Prüfen: `challenge` letztes Feld in `World` und `createWorld`; keine Zahl ausser `SAVE_V_CHALLENGE` an der Version (Tests nur `SAVE_VERSION ± 1`,
`SAVE_V_CHALLENGE − 1`); Kette ruft `migrateToChallenge` nur bei `SAVE_V_CHALLENGE − 1`; `isValidChallenge` kann nicht werfen (läuft in `isWellFormedSafe`);
`calendar.ts` ohne `Date`; Step-0-Pins stammen vom unveränderten Code (Bericht nennt den Befehl); `git diff main -- tests/sim/balance*.test.ts` leer.
