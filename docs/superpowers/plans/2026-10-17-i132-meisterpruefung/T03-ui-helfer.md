# T03 · UI-Helfer (rein, DOM-frei)

`tech-ui-engineer` · ≈ 30 Tools · AK 15, 16, 17 · blocked-by: T01 (läuft parallel zu T02 im Worktree `.worktrees/i132-ui`) · Test zuerst

Dateien: `src/ui/trial.ts` (neu), `tests/ui/trial.test.ts` (neu). Keine andere Datei.

## Schnittstellen

- Consumes (T01): `TrialState`, `TRIALS`, `TRIAL_DURATION_TICKS`, `TRIAL_FAIL_POP_PCT`, `trialStartBlock`, `trialPopulation`; vorhanden:
  `goodsBalance` (`src/sim/flow.ts`, je Insel, Einheit 100 Ticks), `formatClock`, `perMinute`, `signedNum`, `GOODS_BALANCE_TICKS` (`src/ui/time.ts`),
  `MonumentChip` (`src/ui/monumentView.ts`), `GOODS`, `GOOD_IDS`, `TICK_MS`.
- Produces (für T04), alle in `src/ui/trial.ts`:

```ts
export function trialChip(world: World): MonumentChip | null;
export interface DeficitLine {
  good: GoodId;
  perMin: number;
} // perMin < 0, eine Nachkommastelle
export function selfSupplyPreview(world: World): DeficitLine[];
export function selfSupplyText(lines: readonly DeficitLine[]): string;
export function trialStartReason(world: World): string | null;
export function trialChronicleLine(world: World): string | null;
export function trialTransition(prev: TrialState | null, next: TrialState): string | null;
export function trialStartMessage(): string; // Klick-Handler in T04
export const TRIAL_ABORT_MESSAGE = 'Meisterprüfung abgebrochen';
export const TRIAL_FIRE_HINT = 'Feuerwachen schützen Kapelle, Schule und Bad';
export type TrialAction =
  { kind: 'start'; reason: string | null } | { kind: 'abort' } | { kind: 'none' };
export interface TrialCardView {
  name: string;
  rule: string;
  condition: string;
  preview: string;
  fireHint: string;
  status: string | null;
  action: TrialAction;
}
export function trialCardView(world: World, preview: readonly DeficitLine[]): TrialCardView;
```

## Schritte

- [ ] 1. **Tests zuerst** (unten), `npx vitest run tests/ui/trial.test.ts; echo EXIT=$?` → rot; FAIL-Zeile ins Ledger.
- [ ] 2. Umsetzen mit diesen festen Texten (`name` = `TRIALS.selfSupply.name`, `D` = `formatClock(TRIAL_DURATION_TICKS)` = «15:00»):
  - `trialChip`: `null` ohne `monumentDone`. Aktiv: `chip` `` `${name} ${formatClock(ticks)} / ${D}` ``, `title`
    `` `Meisterprüfung ${name}: Einwohner nicht unter ${TRIAL_FAIL_POP_PCT} % von ${e0} — Klick für Details` ``, `fillPct` `Math.floor(ticks * 100 / TRIAL_DURATION_TICKS)`.
    Bestanden (`passed` nicht leer, nichts aktiv): `'Meisterprüfung ✓'`, `title` `` `Meisterprüfung bestanden: ${name}` ``, `fillPct` 100. Sonst `'Meisterprüfung'`,
    `title` `'Meisterprüfung: freiwillige Auflage — Klick für Details'`, `fillPct` 0. Aktiv hat Vorrang.
  - `selfSupplyPreview`: je Gut aus `GOOD_IDS` (Reihenfolge) Summe `net` von `goodsBalance(world, i)` über alle `world.islands`; aufnehmen, wenn
    Summe `< -1e-9` (lokale Konstante `DEFICIT_EPS`, Kommentar «Gleitkomma-Toleranz wie flow.ts, kein Spielwert»); `perMin = perMinute(sum, GOODS_BALANCE_TICKS)`.
  - `selfSupplyText`: leer → `'Deine Ketten decken den Bedarf'`; sonst `` `${GOODS[g].name} ${signedNum(perMin)} / min` `` mit `', '` verbunden
    (z. B. «Gewürz −36 / min, Stein −36 / min»; Zahlformat wie `signedNum`).
  - `trialStartReason(world)` = `trialStartBlock(world, 'selfSupply')`.
  - `trialChronicleLine`: `null` ohne `monumentDone`; bestanden `` `Meisterprüfung: ${name} bestanden (${formatClock(p.tick)})` ``; aktiv
    `` `Meisterprüfung: ${name} läuft (${formatClock(ticks)} / ${D})` ``; sonst `'Meisterprüfung: offen'`.
  - `trialTransition`: `prev === null` → `null`. Nur `prev.active !== null && next.active === null` meldet: mehr Einträge in `next.passed` als in
    `prev.passed` → `` `Meisterprüfung bestanden: ${TRIALS[prev.active].name}` ``; sonst `` `Meisterprüfung ${name} nicht bestanden: Einwohner unter ${TRIAL_FAIL_POP_PCT} %` ``.
    Alles andere `null` (Start und Abbruch meldet der Klick-Handler, Plan P-3).
  - `trialStartMessage()` = `` `Meisterprüfung begonnen: ${name} — ${D} ohne Zukauf` ``.
  - `trialCardView`: `condition` `` `${TRIAL_DURATION_TICKS * TICK_MS / 60000} Minuten, Einwohner nicht unter ${TRIAL_FAIL_POP_PCT} % des Starts` ``
    (= «15 Minuten, Einwohner nicht unter 70 % des Starts»); `preview` = `selfSupplyText(preview)`; `status` aktiv
    `` `Läuft: ${formatClock(ticks)} / ${D} · Einwohner ${trialPopulation(world)} von ${e0}` ``, bestanden `` `Bestanden (${formatClock(tick)})` ``, sonst `null`;
    `action` aktiv `{ kind: 'abort' }`, bestanden `{ kind: 'none' }`, sonst `{ kind: 'start', reason: trialStartReason(world) }`.
- [ ] 3. Tests grün, Commit `feat: UI-Helfer Meisterprüfung (I-132)`.

## Tests `tests/ui/trial.test.ts`

Welten über `createWorld(3)` und `putBuilding`/`houseNearKontor` aus `tests/sim/helpers.ts` (Kaufmannshäuser Stufe 4, Einwohner gesetzt).

- «AK-15 trialChip»: ohne `monumentDone` `null`; mit → `chip` `'Meisterprüfung'`; `trial = { active: 'selfSupply', ticks: 2000, e0: 75, passed: [] }` →
  `'Eigenversorgung 3:20 / 15:00'`, `fillPct` 22; `passed = [{ id: 'selfSupply', tick: 30000 }]` → `'Meisterprüfung ✓'`, `fillPct` 100.
- «AK-16 selfSupplyPreview»: neue Welt ohne Häuser → `[]` und Text `'Deine Ketten decken den Bedarf'`; drei Kaufmannshäuser mit je 20 Einwohnern
  im Kontor-Bereich, kein Erzeuger → Eintrag `spice` mit `perMin` = `perMinute(Summe, 100)` (erwartet −36) und kein Eintrag für Güter mit Summe ≥ 0;
  Häuser auf Heimat **und** Fremdinsel (`twoIslandWorld()`) → Summe beider Inseln; Text enthält `'Gewürz −36 / min'`.
- «AK-17 trialStartReason»: die sieben Grundfälle aus T01 (`monumentDone` falsch, aktiv, bestanden, Kasse −1, 59, 151; plus `null` bei 60) liefern
  die T01-Texte wörtlich; `serialize` vorher = nachher. (Gleichheit mit `startTrial` prüft T04 nach dem Merge.)
- «trialChronicleLine»: `null` / `'Meisterprüfung: offen'` / `'Meisterprüfung: Eigenversorgung läuft (3:20 / 15:00)'` /
  `'Meisterprüfung: Eigenversorgung bestanden (50:00)'` (tick 30000).
- «trialTransition»: `prev` `null` → `null` (Laden mitten in der Auflage, Review Focus 3); aktiv → nicht aktiv mit neuem `passed` → «bestanden»-Text;
  ohne neuen Eintrag → «nicht bestanden»-Text; nicht aktiv → aktiv und gleich → gleich → `null`.
- «trialCardView»: `condition` wörtlich wie oben; `action` je Zustand (`start` mit Grund bzw. `null`, `abort`, `none`).
- Literal-Scan: `src/ui/trial.ts` enthält kein `/\b(9000|150|70|60)\b/`.

## Prüfschritte

Allgemeine Prüfungen laut Plan-Index · `npx vitest run tests/ui/trial.test.ts tests/ui/time.test.ts; echo EXIT=$?`.
