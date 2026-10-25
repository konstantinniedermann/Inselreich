# T03 · Ablage `honorBook` (lesen, zusammenführen, schreiben)

Umsetzer `tech-ui-engineer` · ≈ 55 Tools · AK-EB-07, AK-EB-08 (Muster-Teil von AK-EB-01) · blocked-by: T00 · Strang B (`.worktrees/i186-buch`, `feat/i186-buch`) · Spec §2.4, §3 «Zwei Browserfenster»

## Dateien

- neu: `src/ui/honorBook.ts`, `tests/ui/honorBook.test.ts`
- nicht ändern: `src/ui/storage.ts`, `src/ui/app.ts`, `src/sim/`. Kein DOM, kein globales `localStorage` in der Datei.

## Schnittstelle (Namen verbindlich, T05/T06 bauen darauf)

- `HONOR_BOOK_KEY = 'inselreich.ehrenbuch'`, `HONOR_BOOK_DEFECT_KEY = 'inselreich.ehrenbuch.defekt'`.
- `isHonorKey(k: string): boolean`: Muster `^[a-z][A-Za-z]*(:[a-z][A-Za-z]*)?$` und nicht `constructor`/`prototype`.
- `interface HonorEntry { at: string; seed: number; tick: number; crisis: CrisisLevel }` (`CrisisLevel` per `import type` aus `src/sim/types`).
- `interface RunMark { seed: number; unlockMode: 'stepwise' | 'all' }` (strukturgleich mit `HonorRun` aus T01, kein Import nötig).
- `interface BookData { earned: Map<string, HonorEntry>; run: RunMark | null }`.
- `type BookStatus = 'ok' | 'damaged' | 'newer' | 'unavailable'`.
- `parseBook(raw: string | null): { data: BookData; status: 'ok' | 'damaged' | 'newer' }` (rein).
- `mergeBooks(stored: BookData, mine: BookData, newIsland: boolean): BookData` (rein).
- `serializeBook(d: BookData): string` (Format v1, Spec §2.4; unbekannte gültige Kennungen bleiben erhalten).
- `interface BookStorage { getItem(k: string): string | null; setItem(k: string, v: string): void }`.
- `openHonorBook(storage: () => BookStorage | null): HonorBook` mit `data()`, `status()`, `session(): ReadonlySet<string>` (in dieser Sitzung erreicht, nicht gespeichert), `record(hits: { id: string; seed; tick; crisis }[], at: string): string[]` (liefert die **neu** eingetragenen Kennungen, schon vorhandene fehlen) und `setRun(run: RunMark): void`.

## Verhalten

1. Lesen: fehlend → leer, `ok`. Kaputtes JSON, kein Objekt, fehlendes `v`, `earned` kein einfaches Objekt (`null`, Array, Zahl) → leer, `damaged`, Rohtext merken. `v > 1` → `newer` (lesbare Einträge nach denselben Regeln übernehmen). `run` ungültig (kein Objekt, Seed keine ganze Zahl ≥ 0, Modus unbekannt) → `null`, ohne Statuswechsel. Einträge per `Object.keys` in eine `Map`, nie per Zuweisung in ein Objekt; ungültige Kennung oder ungültiger Eintrag (`at` nicht per `Date.parse` lesbar, `seed`/`tick` keine ganze Zahl ≥ 0, `crisis` unbekannt) → verworfen, Rest bleibt.
2. Schreiben (jede Art, also `record` und `setRun`): vorher neu lesen und `mergeBooks` (Vereinigung, je Kennung kleineres `at`, Gleichstand: Eintrag aus dem Speicher; `run` aus dem Speicher, ausser `setRun` = «Neue Insel»). Ist der gelesene Stand `damaged`: einmal Rohtext unter `HONOR_BOOK_DEFECT_KEY` ablegen (überschreibt alte Kopie), dann ersetzen. Ist er `newer`: nie schreiben; `record` trägt in `session()` ein und liefert die Kennungen trotzdem; `setRun` nur im Speicher der Sitzung.
3. Gesperrter Speicher: `storage()` liefert `null`, `getItem` oder `setItem` wirft → `unavailable`, Buch lebt nur in der Sitzung (`session()`), nichts wirft nach aussen.
4. Einmalig: Kennung schon in `earned` → `record` ändert nichts, auch `at` nicht.

## Testfälle (rot zuerst), Fake-Speicher als `Map`

- **EB-07** je Spiegelstrich der Spec ein Test, keiner wirft: fehlend; kaputtes JSON, `earned: null`, `earned: []` → leer, `damaged`, nach `setRun` Kopie unter `.defekt` und Inhalt ersetzt; `v: 2` → `newer`, `record`/`setRun` schreiben nicht (Fake zählt `setItem`), `record` liefert die Kennung, `session()` enthält sie; ungültiges `run` → `null`, Einträge bleiben; Kennungen `__proto__`, `constructor`, `a b` → verworfen und `Object.prototype` ohne neue Schlüssel; ungültiger Einzeleintrag → verworfen, Rest bleibt; unbekannte gültige Kennung (`zukunft`) bleibt nach `record` im geschriebenen JSON.
- Gesperrt: `storage = () => null` und Fake mit werfendem `setItem` → `unavailable`, kein Wurf, `record` liefert Kennungen.
- **EB-08:** zweites `record` derselben Kennung → `at` unverändert; `mergeBooks` Vereinigung, kleineres `at`, Gleichstand bleibt Speicher; `run` bleibt wie im Speicher, ausser über `setRun`; Zwei-Fenster-Fall: Fake wird zwischen zwei `record` von «Fenster B» beschrieben → beide Kennungen bleiben.
- **Muster (Gate-Befund, P-6):** für jedes `id` aus `TRIAL_IDS` gilt `isHonorKey(\`trial:${id}\`)`.

## Prüfungen (Teilbeleg)

- `npx vitest run tests/ui/honorBook.test.ts; echo EXIT=$?` (rot vorher, grün nachher)
- `npx tsc --noEmit; echo EXIT=$?` · `make lint; echo EXIT=$?` · `make zeittests; echo EXIT=$?` · `make conflicts; echo EXIT=$?`

Commit: `feat: Ehrenbuch-Ablage mit Zusammenführen und Schreibschutz (I-186)`
