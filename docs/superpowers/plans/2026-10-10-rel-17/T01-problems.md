# T01 · Reiner Helfer `src/ui/problems.ts` (TDD)

Strang UI · Worktree `.worktrees/rel-17` · Branch `feat/rel-17` · Umsetzer `tech-ui-engineer` (sonnet) · AK-R17-01…07, 10 und der Helfer-Teil von AK-R17-15 (`ak.md`) · blocked-by: REL-16-Merge erledigt (`915d87c5`) · Grösse M (≈ 25 Tools)

**Files:**

- Create: `src/ui/problems.ts`, `tests/ui/problems.test.ts`
- Modify: `src/ui/hover.ts` — nur `export` vor `const HOUSE_TITLES` (Z. 77), sonst nichts
- Lesen, nicht ändern: `src/sim/queries.ts` (`houseDiagnosis`, `missingInputs`, `Diagnosis`), `src/sim/roads.ts` (`needsConnection`), `src/sim/population.ts` (`SERVICE_BUILDING`), `src/sim/islands.ts` (`islandName`), `src/sim/world.ts` (`center`, `HOME`), `src/ui/islandJump.ts` (`jumpTarget`), `src/ui/texts.ts` (`goodList`, `diagnosisText`), `src/ui/hints.ts` (REL-16, **nicht** importieren und nicht ändern)
- Testhilfen: `tests/ui/worlds.ts` (`uxWorld`, `build`, `setHouse`, `connectAll`), synthetische Gebäude wie in `tests/ui/islandJump.test.ts` Z. 20–27

## Schnittstelle

```ts
export type ProblemClass = 1 | 2 | 3 | 4;
/** Sortierschlüssel: [Klasse, Inselrang (Anker = -1, sonst Index), Abstand, Gebäude-ID]. */
export type ProblemSort = readonly [number, number, number, number];
export interface Problem {
  key: string; // `b:<id>` bzw. `g:<insel>:<gut>`
  cls: ProblemClass;
  island: number;
  id: number; // Gebäude, dessen Panel öffnet (Klasse 4: erstes Haus)
  at: { x: number; y: number }; // Archipel-Kacheln, Footprint-Mitte
  text: string; // Eintragstext ohne „Problem n von m: “
  sort: ProblemSort;
}
export interface ProblemCursor {
  key: string;
  sort: ProblemSort;
  anchor: number;
  landed: number;
}
export const NO_PROBLEM_TEXT = 'Alles versorgt, kein Problem offen';
export function problemList(world: World, anchor: number): Problem[];
export function problemStep(
  world: World,
  cursor: ProblemCursor | null,
  activeIsland: number,
  dir: 1 | -1,
): { problem: Problem; index: number; count: number; cursor: Omit<ProblemCursor, 'landed'> } | null;
export function problemMessage(index: number, count: number, p: Problem): string; // „Problem 2 von 5: …“
export function cutOffIds(world: World): Set<number>; // needsConnection && !connected, ohne Brand
export function newlyCut(before: Set<number>, world: World): number;

/** Abhängigkeiten des Sprungs (B1, R453): `app.ts` verdrahtet sie, Tests übergeben protokollierende Fakes. */
export interface ProblemJumpDeps {
  world: World;
  activeIsland(): number; // liest den Stand zum Zeitpunkt des Aufrufs (nach refresh = gefolgte Kamera)
  getCursor(): ProblemCursor | null;
  setCursor(c: ProblemCursor | null): void;
  cancelPointerAction(): void;
  centerOn(x: number, y: number): void; // Archipel-Kacheln, Zoom bleibt
  openPanel(id: number): void; // setPanel inspect, KEIN Werkzeugwechsel
  refresh(): void;
  message(text: string): void; // app.ts: replaceMessage('problem', text)
}
/** Reiner Ablauf des Problem-Sprungs (AK-R17-10, E1, E3, E6). */
export function runProblemJump(deps: ProblemJumpDeps, dir: 1 | -1): void;
```

`runProblemJump`: (1) `cancelPointerAction()`; (2) `problemStep(world, getCursor(), activeIsland(), dir)`; `null` → `setCursor(null)`, `message(NO_PROBLEM_TEXT)`, Ende (kein `centerOn`/`openPanel`/`refresh`); (3) sonst in genau dieser Reihenfolge `centerOn(at.x, at.y)` → `openPanel(id)` → `refresh()` → `setCursor({ ...step.cursor, landed: activeIsland() })` (nach `refresh` gelesen, nicht `problem.island`) → `message(problemMessage(...))`. Es gibt bewusst keinen Hook für ein Werkzeug: ein Werkzeugwechsel ist damit nicht ausdrückbar (E1).

`index` ist 1-basiert. `landed` setzt `app.ts` nach dem Sprung (T02); `problemStep` liest es nur.

## Regeln (aus `ak.md`)

- **Brand zuerst:** `b.outageUntil !== undefined || b.state === 'burning'` → Gebäude fällt ganz raus (auch aus Klasse 1).
- **Klasse 1:** `needsConnection(b.defId) && !b.connected` (Kontore, Haus, Amtsstube fallen damit raus); Haus mit `houseDiagnosis` = `[{ kind: 'supply' }]`.
- **Klasse 2:** nur bei `connected` und `def.produces !== undefined`: `state` ∈ {`waitingInput`, `noForest`, `noService`}. `storageFull`, `ok`, `notConnected` (bei `connected`: Nachlauf eines Ticks, `stateInfo` Z. 62) nicht.
- **Klasse 3:** Haus, Diagnosen `service` (ein Eintrag je Haus, alle fehlenden Dienste im Text).
- **Klasse 4:** Diagnosen `good`, gruppiert je `(island, good)`; Vertreter = Haus mit kleinstem `[Abstand, id]`; Text mit Anzahl.
- **Abstand:** `Math.hypot(at.x - j.x, at.y - j.y)` mit `j = jumpTarget(world, island)`.
- **Sortierung:** lexikografisch über `sort`. `cutOffIds` und Klasse 1 nutzen dasselbe Prädikat (eine Funktion `isCutOff(b)` im Modul).
- **`problemStep`:** Ist `cursor !== null && cursor.landed !== activeIsland`, gilt `cursor = null`. `anchor = cursor?.anchor ?? activeIsland`. Liste = `problemList(world, anchor)`; leer → `null`. Mit Cursor: Index des Schlüssels; gefunden → `(i + dir + m) % m`; nicht gefunden → `+1`: erstes Element mit `sort > cursor.sort`, sonst Index 0; `-1`: letztes mit `sort < cursor.sort`, sonst `m - 1`. Ohne Cursor: `+1` → 0, `-1` → `m - 1`. Rückgabe-Cursor `{ key, sort, anchor }`.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot).** `tests/ui/problems.test.ts`, `describe('REL-17 problems (AK-R17-01…07)')`. Welt: `uxWorld()` bzw. `createWorld(3, { crisisLevel: 'normal', unlockAll: true })` mit `build`, danach `connectAll` und gezielt `b.connected = false` / `b.state = …` / `setHouse`.
  1. `AK-R17-01 Klassen`: Weberei `connected = false` → Klasse 1, Text „Weberei nicht angebunden“; Weberei `waitingInput` ohne Wolle → Klasse 2 „Weberei wartet auf Wolle“; Holzfäller `noForest` → Klasse 2; Haus ausserhalb der Versorgung (weit weg vom Kontor gebaut) → Klasse 1 „… ausserhalb der Versorgung“; Siedlerhaus ohne Kapelle → Klasse 3 „Kapelle fehlt am Siedlerhaus“; drei Häuser ohne Stoff → **ein** Eintrag Klasse 4 „Stoff fehlt in 3 Häusern“, `id` = nächstes Haus zum Kontor.
  2. `AK-R17-02 Ausschlüsse`: `storageFull`; Betrieb mit `outageUntil` und `connected = false`; Kontor; Amtsstube ohne Weg; Haus mit leerer Diagnose → alle nicht in der Liste.
  3. `AK-R17-03 Reihenfolge`: zwei Klasse-2-Betriebe in verschiedenem Abstand → näherer zuerst; gleicher Abstand → kleinere ID zuerst; Klasse vor Abstand; zweimal aufrufen → `toEqual`.
  4. `AK-R17-04 Inseln und Umlauf`: synthetische Betriebe (`state: 'waitingInput'`, `connected: true`, `defId: 'weaver'`) auf Insel 0 und 2 (Insel 2 mit synthetischem `kontor2` wie `islandJump.test.ts`). Anker 2 → Insel-2-Einträge zuerst. Simulierter Umlauf: Cursor `null`, Insel 0 aktiv; Schleife `m` mal `problemStep(…, +1)`, nach jedem Schritt `landed = problem.island` (simuliert die gefolgte Kamera) und `activeIsland = landed` → jede `key` genau einmal, Schritt `m + 1` = erster Eintrag. Dazu: `-1` ohne Cursor = letzter; Umlauf rückwärts; verschwundener Schlüssel (Problem nach dem Sprung behoben: `state = 'ok'`) → nächster nach `sort`; `landed ≠ activeIsland` → Neustart mit neuem Anker (Ergebnis = erster Eintrag der neuen Anker-Insel); leere Welt-Probleme → `null`.
  5. `AK-R17-05 Texte`: `problemMessage(2, 5, p)` = „Problem 2 von 5: Weberei wartet auf Wolle“; `NO_PROBLEM_TEXT`; Fremdinsel-Suffix ` (<islandName>)`; „Stoff fehlt in 1 Haus“; zwei fehlende Dienste „Kapelle und Schule fehlen am Bürgerhaus“.
  6. `AK-R17-06 Sprungpunkt`: Weberei 2 × 2 an `(x, y)` auf Insel 2 → `at` = `{ x: ox + c.cx, y: oy + c.cy }` mit `center(BUILDING_DEFS.weaver, x, y)`.
  7. `AK-R17-07 rein`: `JSON.stringify(world)` vor und nach `problemList` + `problemStep` gleich; `readFileSync('src/ui/problems.ts')` enthält weder `document` noch `window`.
  8. `AK-R17-10 runProblemJump` (B1, ersetzt den Quelltext-Test): Fakes protokollieren in ein Array `log`; `deps` hat **kein** Werkzeug-Feld, `refresh` ändert die vom Fake `activeIsland()` gelieferte Insel auf `problem.island`. Prüfen: Reihenfolge `['cancel','center','panel','refresh','message']`; `centerOn` mit `at`; `openPanel` mit `id`; gespeicherter Cursor hat `landed` = Insel **nach** `refresh` (Fake-Kamera klemmt: `refresh` liefert eine andere Insel als `problem.island` → `landed` folgt `activeIsland()`); Meldung = `problemMessage(…)`; 0 Probleme → `log` = `['cancel','message']`, Cursor `null`, Text `NO_PROBLEM_TEXT`; zwei Aufrufe nacheinander mit gefolgter Kamera besuchen bei zwei Inseln alle Einträge je einmal (wie Test 4, aber über `runProblemJump`).
  9. `AK-R17-15 newlyCut`: `before = cutOffIds(w)` bei angebundener Weberei; Weberei `connected = false` → `newlyCut(before, w) === 1`; schon vorher getrennt → 0; Amtsstube getrennt → 0.

```bash
npx vitest run tests/ui/problems.test.ts; echo EXIT=$?   # rot: Modul fehlt
```

- [ ] **Schritt 2: Umsetzen.** `src/ui/problems.ts` (inkl. `runProblemJump`, nur Funktionsaufrufe über `deps`, kein DOM) mit Kopfkommentar wie `islandJump.ts` („rein: …, nicht im Spielstand; I-042, REL-17“). Texte aus den genannten Quellen zusammensetzen, keine neuen Begriffe; `HOUSE_TITLES` aus `hover.ts` importieren (dafür nur das `export`). Kein Import aus `./hints` oder `./app`.

```bash
npx vitest run tests/ui/problems.test.ts tests/ui/imports.test.ts tests/ui/hover.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 3: Commit.** `feat: Problem-Liste und Umlauf als reiner Helfer (I-042, REL-17)`; Trailer der Session.

## Bericht

Je AK der Testname und die Rot-Ausgabe vor der Umsetzung (eine Zeile), Exit-Codes, Grösse von `problems.ts` in Zeilen, `git diff --stat main...HEAD`. Last: `problemList` läuft nur je Tastendruck, nie je Frame (bei ≈ 400 Häusern × ≈ 30 Dienst-/Versorgungsquellen ≈ 12 000 Abstandsprüfungen, < 1 ms); kein Zeittest.
