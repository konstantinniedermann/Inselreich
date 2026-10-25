# T08 · DOM-freie UI-Helfer: Uhr, Ablage `inselreich.proben`, Wache, Texte, Datum

Umsetzer `tech-ui-engineer` · ≈ 55 Tools · AK-IP-15, -16, -17, -18, -25, -26, -27, -28, -29 · blocked-by: T03 · Worktree `.worktrees/inselproben-ui`
(`feat/inselproben-ui` ab `feat/inselproben` nach T03) · läuft parallel zu T04 · Spec §4.2, §5.3, §6, §11; Anhang 02 E

## Dateien

- neu: `src/ui/challengeStore.ts`, `src/ui/challengeView.ts`, `tests/ui/challenge.test.ts`
- ändern: `src/ui/time.ts` (`formatClock`), `tests/ui/time.test.ts`
- nicht ändern: `src/ui/app.ts`, `src/ui/storage.ts`, `src/sim/`. Kein DOM, kein globales `localStorage` und kein `new Date()` ohne Argument in den neuen Dateien.

## Interfaces

- Consumes: `ChallengeState`, `ChallengeResult`, `ChallengeGoal` (T01); `ChallengeStart`, `ChallengeStartResult`, `startChallenge`, `challengeDeadline` (T02/T03);
  `PROBES`, `SCENARIOS`, `GOAL_TEXT`, `CHALLENGE_REV`; `Settings` (`settings.ts`).
- Produces (`src/ui/challengeStore.ts`):

```ts
export const PROBES_KEY = 'inselreich.proben';
export interface TimeEntry {
  ticks: number;
  at: number;
}
export interface DailyEntry {
  date: number;
  goal: ChallengeGoal;
  first: number | null;
  best: number | null;
  tries: number;
}
export interface ScenarioEntry {
  best: number | null;
  tries: number;
}
export interface ProbeStore {
  v: 1;
  rev: number;
  probes: Record<string, TimeEntry[]>;
  daily: DailyEntry[];
  scenarios: Record<string, ScenarioEntry>;
}
export type StoreNotice = 'reset' | 'older' | 'unavailable' | null;
export const NOTICE_TEXT: Readonly<Record<Exclude<StoreNotice, null>, string>>;
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function emptyStore(): ProbeStore;
export function parseStore(json: string | null): { store: ProbeStore; notice: StoreNotice };
export function readStore(storage: StorageLike | null): { store: ProbeStore; notice: StoreNotice };
export function writeStore(storage: StorageLike | null, store: ProbeStore): boolean;
export function inDailyWindow(date: number, today: number): boolean; // 0 ≤ Tage(today − date) ≤ 13
export function noteLaunch(
  store: ProbeStore,
  source: 'start' | 'load',
  c: ChallengeState | null,
  today: number,
): ProbeStore;
export function recordResult(
  store: ProbeStore,
  c: ChallengeState,
  ctx: { today: number; launchDay: number },
): ProbeStore;
export function rerun(
  c: ChallengeState,
  today: number,
  list: DailyEntry[],
): { start: ChallengeStart; book: boolean };
export function resultTransition(
  prev: ChallengeResult | null,
  cur: ChallengeResult | null,
): boolean;
export interface ResultWatch {
  reset(w: World): void;
  observe(w: World): ChallengeResult | null;
}
export function createResultWatch(w: World): ResultWatch;
```

- Produces (`src/ui/challengeView.ts`): `todayNumber(d: Date): number`, `formatDay(n: number): string` («23.10.2026»), `shortDay(n: number): string`
  («23.10.»), `crisisText(level: CrisisLevel): string` («aus» | «mild» | «normal»), `chipText(c: ChallengeState, tick: number): string`,
  `shareText(c: ChallengeState, entry?: DailyEntry): string | null`, `launchChallenge(start: ChallengeStart, settings: Settings): ChallengeStartResult`,
  `UNLOCK_NOTE = 'Freischaltung: stufenweise'`.

## Verhalten

1. `formatClock(ticks)`: unter 3600 s «m:ss» wie heute, ab 3600 s «h:mm:ss» (P-3).
2. `NOTICE_TEXT`: `reset` «Bestzeiten zurückgesetzt», `older` «Bestzeiten aus einer älteren Fassung verworfen», `unavailable` «Bestzeiten werden nicht gespeichert».
3. `parseStore`: `null` → leer, kein Hinweis; kein JSON, `v !== 1`, falsche Typen → leer + `reset`; `rev !== CHALLENGE_REV` → leer + `older`. `readStore`: wirft
   `getItem` oder ist `storage` `null` → leer + `unavailable`. `writeStore`: `JSON.stringify` + `setItem` in `try`, Misserfolg `false`, nie ein Wurf.
4. `noteLaunch('load', …)` → unverändert. `'start'`: `daily` (nur `inDailyWindow(c.date, today)`) Eintrag für `c.date` anlegen falls fehlt
   (`first`/`best` `null`), `tries + 1`; `scenario` `tries + 1`; `probe` unverändert. Danach Tagesliste auf Fenster kürzen, neueste zuerst.
5. `recordResult` nur bei `outcome === 'passed'`: `probe` → `{ ticks, at: today }` aufsteigend einfügen, bei Gleichstand **hinter** gleiche Zeiten, auf 5 kappen;
   `daily` → nur im Fenster; `first` nur wenn `null` **und** `launchDay === c.date`; `best = min`; `scenario` → `best = min`. `failed` → unverändert.
6. `rerun`: `start` = gleiche Probe bzw. `{ kind: 'daily', date: c.date }`; `book = kind !== 'daily' || inDailyWindow(c.date, today)`.
7. `createResultWatch(w)`: Ausgangslage = `w.challenge?.result ?? null`; `observe(w)` liefert `result` genau beim Übergang `null → gesetzt`, danach `null`;
   `reset(w)` setzt die Ausgangslage neu (Laden, neuer Start). Ein geladener Stand mit `result` meldet nie.
8. `chipText`: «Probe 3 · 12:40», «Tagesinsel · 12:40», «Schuldbrief · 12:40 · Frist 30:00»; mit `result`: «Probe 3 · bestanden 38:12», «Tagesinsel · bestanden 38:12»,
   «Schuldbrief · bestanden 24:10», «Schuldbrief · verloren».
9. `shareText` (Spec §6.3, ohne Zeilenumbruch, ohne Bauliste): «Inselreich · Probe 3 «Handelsstadt» · 38:12 · Krisen mild»; «Inselreich · Tagesinsel
   23.10.2026 · 50 Bürger · 31:40» (`entry.first`; ist `first` `null`, `entry.best` mit « · Übung»); «Inselreich · Schuldbrief · bestanden 24:10»;
   verloren «Inselreich · Schuldbrief · verloren»; ohne `result` `null`.
10. `launchChallenge` ruft `startChallenge(start)` und liest `settings` nicht (AK-IP-28).

## Steps

- [ ] **Tests rot** in `tests/ui/challenge.test.ts` (Zustände als Literal; Datum nur als `new Date(2026, 9, 23, 23, 59)` u. ä.):
  - `AK-IP-15` (`tests/ui/time.test.ts`): 0 → «0:00», 7230 → «12:03», 35 990 → «59:59», 36 000 → «1:00:00»; bestehende Fälle bleiben.
  - `AK-IP-16`: `parseStore` leer/gültig/`'x'`/`{ v: 2 }`/`rev` 0 → Hinweis je Fall; Einfügen sortiert, Kappung 5 (sechste Zeit fällt) und Tagesfenster 14 (15. Tag
    fällt); Gleichstand: neue Zeit hinter der älteren; `noteLaunch('start')` erhöht `tries`; `first` einmal, `best` folgt jeder besseren Zeit;
    `resultTransition(null, r) === true`, `(r, r)`, `(null, null)`, `(r, null)` `false`.
  - `AK-IP-17`: `shareText` je Art wörtlich wie Verhalten 9; `not.toMatch(/\n/)`.
  - `AK-IP-18`: `todayNumber(new Date(2026, 9, 23, 23, 59)) === 20261023`, `(2026, 9, 24, 0, 1)` → 20261024; `formatDay(20261023) === '23.10.2026'`.
  - `AK-IP-25`: Fake-Storage, dessen `getItem`/`setItem` werfen → `readStore` leer + `unavailable`; `writeStore` `false` ohne Wurf; `launchChallenge` geht.
  - `AK-IP-26`: `noteLaunch(store, 'load', c, today)` gleich `store` für Ladeliste, «Fortsetzen» und Autosave (alle `'load'`); Wache nach `reset` auf Stand mit `result` meldet nie.
  - `AK-IP-27`: `rerun` mit `today` = `date`, `date + 1`, 13 Tage, 14 Tage später → `book` true, true, true, false; `start.date === c.date`; `recordResult`
    ausserhalb des Fensters → unverändert, kein Wurf.
  - `AK-IP-28`: Einstellungen `unlockMode: 'all'` → `launchChallenge` liefert `unlocked` `['U0']` für `p1` und `debt` (der `daily`-Fall folgt in T09 nach T04, H1); `UNLOCK_NOTE` enthält «stufenweise».
  - `AK-IP-29`: `noteLaunch('start')`, dann Wache `reset` auf neue Welt (andere Probe) → `observe` `null`, Ablage ausser `tries` unverändert.
  - **Review Focus 3:** Lauf mit `launchDay = c.date`, Ergebnis bei `today = c.date + 1` → gebucht auf `c.date`, `first` gesetzt.
  - **Review Focus 4:** Welt kurz vor dem Ziel, drei `step` hintereinander, `observe` nach jedem Schritt → genau ein Treffer.
- [ ] **Lauf rot:** `npx vitest run tests/ui/challenge.test.ts tests/ui/time.test.ts; echo EXIT=$?` → ≠ 0.
- [ ] **Umsetzen** nach Verhalten 1–10.
- [ ] **Lauf grün:** dieselben Dateien plus `tests/ui/menu.test.ts tests/ui/startCard.test.ts`; `echo EXIT=$?` → 0.
- [ ] **Teilbeleg** (Index).
- [ ] **Commit:** `feat: Ablage, Wache und Texte der Inselproben (Inselproben T08)`.

## Task-Review

Prüfen: neue Dateien ohne DOM und ohne Uhr; Ablage schreibt nur über injizierten Speicher; `first` folgt Verhalten 5; Texte wörtlich; `formatClock`-Änderung
bricht keinen bestehenden Test (sonst Diff im Bericht begründet).
