# T01 · Defs, Weltfeld, Save v18 mit Migration, Leser

`tech-sim-engineer` · ≈ 45 Tools · AK 1, 2 (Gründe), 12, 13 · blocked-by: T00 · Test zuerst (rot vor Umsetzung)

Dateien: `src/sim/defs/trials.ts` (neu), `src/sim/trial.ts` (neu, nur Leser), `src/sim/types.ts`, `src/sim/world.ts`, `src/sim/save.ts`,
`tests/sim/trial.test.ts` (neu), `tests/sim/trial-save.test.ts` (neu), `tests/sim/helpers.ts`; Tests mit Faltkette oder Versionsrechnung
(bekannt: `farOrder-save`, `save-loyalty`, `helpers.test`, `council-save`; vollständig per `rg -n "foldBackCouncil|SAVE_VERSION - |delete raw.council" tests`).

## Schnittstellen (Produces, für T02 und T03)

```ts
// types.ts
export type TrialId = 'selfSupply';
export interface TrialDef {
  name: string;
  short: string;
  rule: string;
}
export interface TrialPass {
  id: TrialId;
  tick: number;
}
export interface TrialState {
  active: TrialId | null;
  ticks: number;
  e0: number;
  passed: TrialPass[];
}
// World: letztes Feld nach `council`
trial: TrialState;

// defs/trials.ts
export const TRIAL_IDS: readonly TrialId[] = ['selfSupply'];
export const TRIALS: Readonly<Record<TrialId, TrialDef>>;
export const TRIAL_DURATION_TICKS = 9000;
export const TRIAL_MIN_MERCHANTS = WIN_MERCHANTS; // import aus ./tiers
export const TRIAL_MAX_MERCHANTS = 150;
export const TRIAL_FAIL_POP_PCT = 70;

// trial.ts (Leser; Aktionen folgen in T02)
export const TRIAL_REASONS: {
  unknown;
  noGoal;
  running;
  passed;
  debt;
  notActive: string;
  few(n: number): string;
  many(n: number): string;
};
export function trialPopulation(world: World): number; // Einwohner aller Häuser, alle Inseln
export function trialStartBlock(world: World, id: unknown): string | null;
export function trialBuyBlock(world: World): string | null;
```

## Schritte

- [ ] 1. **Tests zuerst** (`trial.test.ts`, `trial-save.test.ts`, Fälle unten), Lauf `npx vitest run tests/sim/trial.test.ts tests/sim/trial-save.test.ts; echo EXIT=$?`
      → rot (Import fehlt bzw. Feld fehlt); FAIL-Zeile ins Ledger.
- [ ] 2. `types.ts`, `defs/trials.ts` mit Kopfkommentar wie `defs/council.ts` («Spielwerte I-132, Spec §3.1; Änderung nur per Ruling»). Texte:
      `name: 'Eigenversorgung'`, `short: 'Kein Zukauf am Kontor'`,
      `rule: 'Kein Zukauf an den Kontoren und für das Denkmal. Verkauf, Aufträge, Stammkunde, Fernangebot, Schiffe und Bauen bleiben frei.'`
- [ ] 3. `world.ts` `createWorld`: `trial: { active: null, ticks: 0, e0: 0, passed: [] }` als letztes Feld (Schlüsselreihenfolge fest).
- [ ] 4. `trial.ts` (Texte wörtlich; Imports nur `./types`, `./defs/*`, `./population`):

```ts
export const TRIAL_REASONS = {
  unknown: 'Unbekannte Auflage',
  noGoal: 'Erst nach dem Wahlziel (Denkmal)',
  running: 'Eine Auflage läuft schon',
  passed: 'Bereits bestanden',
  debt: 'Kasse im Minus',
  notActive: 'Keine Auflage aktiv',
  few: (n: number) => `Erst ab ${TRIAL_MIN_MERCHANTS} ${TIERS[4].name}n (jetzt ${n})`,
  many: (n: number) => `Höchstens ${TRIAL_MAX_MERCHANTS} ${TIERS[4].name} (jetzt ${n})`,
} as const;
```

`trialStartBlock` prüft in **genau dieser Reihenfolge** (Spec §3.2.2) und ändert die Welt nie:
(1) `typeof id === 'string' && Object.hasOwn(TRIALS, id)`, sonst `unknown`;
(2) `world.monumentDone`, sonst `noGoal`;
(3) `world.trial.active === null`, sonst `running`;
(4) `id` nicht in `passed`, sonst `passed`;
(5) `world.money >= 0`, sonst `debt`;
(6) `merchants(world) >= TRIAL_MIN_MERCHANTS`, sonst `few(n)`;
(7) `merchants(world) <= TRIAL_MAX_MERCHANTS`, sonst `many(n)`; dann `null`.
`trialBuyBlock`: ohne aktive Auflage `null`, sonst «Auflage » + `TRIALS[active].name` + «: kein Zukauf»
(= «Auflage Eigenversorgung: kein Zukauf»). `trialPopulation`: Summe der Werte von `populationByTier(world)`.

- [ ] 5. `save.ts`: `SAVE_VERSION = 18` (Arbeitsannahme, endgültig main + 1, R745/R674; im Bericht nennen). `migrateV17ToV18(raw)` setzt
      `raw.trial = { active: null, ticks: 0, e0: 0, passed: [] }`, `raw.version = 18`, wirft nie; eine Zeile in der Kette von `deserialize`.
      `isValidTrial(raw)` in `isWellFormed` (Spec §4): Objekt (kein Array) · `active` ∈ `TRIAL_IDS` oder `null` (`Object.hasOwn`) · `ticks` ganz,
      `0 ≤ ticks < TRIAL_DURATION_TICKS`, bei `active === null` gleich 0 · `e0` ganz ≥ 0, bei `active !== null` zusätzlich `e0 > 0` (R759 Auflage 6) · `passed` Array aus Objekten mit `id` ∈ `TRIAL_IDS`, `tick`
      ganz ≥ 0, keine doppelte Id · `active` nicht in `passed`. Sonst «Beschädigter Spielstand» (bestehender Weg).
- [ ] 6. `tests/sim/helpers.ts`: `dropTrial(x)` entfernt `trial` ohne Umordnen und ohne Versionsänderung; wirft
      `'dropTrial: Auflage nicht rückfaltbar'`, wenn `trial` nicht den Startwerten entspricht. `foldBackTrial(x)` = `dropTrial` + `version − 1`
      (äusserster Faltschritt v18 → v17, Kommentar wie `foldBackCouncil`). In `foldBackToV13`, `foldBackToV12`, `foldBackToV11` jeweils
      `dropCouncil(dropTrial(input))`. Bestehende Aufrufer `foldBackCouncil(json(…))` → `foldBackCouncil(foldBackTrial(json(…)))`; `v16Of` in
      `council-save.test.ts` löscht auch `trial`; Versionsrechnungen (`SAVE_VERSION - 2` → `- 3` usw.) nachziehen. Keine Erwartungswerte ändern.
- [ ] 7. Tests grün (Prüfschritte), Commit `feat: Auflagen-Defs, Weltfeld trial, SAVE_VERSION 18 (I-132)`.

## Tests

`trial.test.ts`:

- «AK-1 neue Welt»: `createWorld(3).trial` und `createWorld(3, { unlockAll: true }).trial` `toEqual({ active: null, ticks: 0, e0: 0, passed: [] })`.
- «AK-2 (Gründe) trialStartBlock»: Basiswelt = `createWorld(3)`, `monumentDone = true`, Kaufmannshäuser (Stufe 4) per `putBuilding` mit
  Einwohnern ≤ 20 je Haus bis zur Zielzahl (Testhelfer `merchantWorld(n)` in der Datei). Erwartungen: `'genuegsam'`, `undefined`, `42`,
  `'toString'`, `'__proto__'`, `'constructor'` → `'Unbekannte Auflage'`; `monumentDone = false` → `'Erst nach dem Wahlziel (Denkmal)'`;
  `trial.active = 'selfSupply'` → `'Eine Auflage läuft schon'`; `passed = [{ id: 'selfSupply', tick: 1 }]` → `'Bereits bestanden'`; `money = -1` →
  `'Kasse im Minus'`; 59 → `'Erst ab 60 Kaufleuten (jetzt 59)'`; 151 → `'Höchstens 150 Kaufleute (jetzt 151)'`; 60 und 150 → `null`.
  Reihenfolge: Welt mit `monumentDone = false` **und** `money = -1` → Grund `noGoal`. Je Fall `serialize` vorher = nachher.
- «trialBuyBlock»: `null` ohne Auflage; `'Auflage Eigenversorgung: kein Zukauf'` mit `active = 'selfSupply'`.
- «AK-13 Defs»: `Object.keys(TRIALS)` = `['selfSupply']`, `name`/`short`/`rule` nicht leer; Konstanten 9000, 150, 70 und
  `TRIAL_MIN_MERCHANTS === WIN_MERCHANTS`. Literal-Scan: `readFileSync('src/sim/trial.ts')` enthält kein `/\b(9000|150|70|60)\b/`.

`trial-save.test.ts` (Muster `council-save.test.ts`, Testnamen «AK-12 …»):

- Rundreise `serialize → deserialize → serialize` gleich und `trial` gleich für: Startwerte; `{ active: 'selfSupply', ticks: 1234, e0: 75, passed: [] }`;
  `{ active: null, ticks: 0, e0: 75, passed: [{ id: 'selfSupply', tick: 20000 }] }`.
- Migration: `v17Of(w)` (ohne `trial`, `version: 17`) lädt mit `version === SAVE_VERSION` und Startwerten; `migrateV17ToV18({ version: 17 })` wirft
  nicht; `fixtures/save-v11.json` läuft die Kette bis `SAVE_VERSION` mit Startwerten; `migrate → serialize → deserialize → serialize` gleich.
- Abweisen: `version: SAVE_VERSION + 1` → `{ ok: false, reason: 'Unbekannte Version' }`. Je `it.each` → `{ ok: false, reason: 'Beschädigter Spielstand' }`
  und `not.toThrow()`: `trial` fehlt · `null` · `[]` · `active: 'genuegsam'` · `active: 'toString'` · `ticks: 9000` · `ticks: -1` · `ticks: 1.5` ·
  `active: null, ticks: 5` · `e0: -1` · `e0: 2.5` · `active: 'selfSupply', e0: 0` · `passed: {}` · `passed: [5]` · `passed: [{ id: 'x', tick: 1 }]` · `passed: [{ id: 'selfSupply', tick: -1 }]` ·
  doppelte Id in `passed` · `active: 'selfSupply'` mit `selfSupply` in `passed`.

## Prüfschritte

Allgemeine Prüfungen laut Plan-Index · `npx vitest run tests/sim/trial.test.ts tests/sim/trial-save.test.ts tests/sim/save*.test.ts tests/sim/*-save.test.ts tests/sim/helpers.test.ts tests/sim/balance-crises.test.ts tests/sim/reserve-bitgleich.test.ts tests/sim/scenario-saves.test.ts; echo EXIT=$?`
(Dateien per `rg -l "SAVE_VERSION|foldBack" tests` bestätigen) · `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?`.
