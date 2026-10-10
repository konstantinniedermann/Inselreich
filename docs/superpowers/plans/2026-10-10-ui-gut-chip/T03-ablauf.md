# T03 · Fokus-Zustand und Sprungablauf

Strang ui · Umsetzer `tech-ui-engineer` · AK-GC-05 (Ablauf), 06, 07 (Helfer), 08, 09, 12 · blocked-by T02 · Grösse M (≈ 25 Tools)

**Dateien (exklusiv):** `src/ui/goodFocus.ts` (ergänzen), `tests/ui/goodFocus.test.ts` (ergänzen). Lesen: `ak.md`, `src/ui/problems.ts` (`runProblemJump`, `ProblemJumpDeps`, `stepList`, `ProblemCursor`), `tests/ui/problems.test.ts` (Fake-Deps als Vorbild).

## Schritt 0: Zeilenstände nach M13-E1-Merge prüfen (Pflicht)

Diese Task berührt nur Dateien, die M13-E1-UI nicht ändert; geprüft werden die Quellen, gegen die sie baut:

```bash
git log --oneline 1b723334..HEAD -- src/ui/problems.ts src/ui/goodFocus.ts
grep -n "export interface ProblemJumpDeps" -A12 src/ui/problems.ts; echo EXIT=$?
```

(Auf `1b723334`: `ProblemJumpDeps` `problems.ts:225`, `runProblemJump` Z. 238.) Hat T01 `ProblemJumpDeps` geändert, die Feldnamen übernehmen.

## API (`goodFocus.ts`, ergänzen)

```ts
export type FocusState = { good: GoodId; island: number } | null;
export type FocusEvent =
  | { kind: 'toggle'; good: GoodId; island: number } // Chip-Klick
  | { kind: 'clear' }; // Esc, Inselwechsel, Neue Insel, Laden, M3
export function focusReduce(state: FocusState, e: FocusEvent): FocusState; // rein
/** `true`, wenn nach dem Toggle gesprungen werden soll (Fokus an: neu oder anderes Gut/Insel). */
export function toggleStartsJump(before: FocusState, e: FocusEvent): boolean;

export interface FocusDeps {
  world: World;
  activeIsland(): number;
  getFocus(): FocusState;
  setFocus(f: FocusState): void;
  getCursor(): ProblemCursor | null; // Fokus-Cursor, getrennt vom Problem-Cursor
  setCursor(c: ProblemCursor | null): void;
  cancelPointerAction(): void;
  centerOn(x: number, y: number): void;
  openPanel(id: number): void;
  refresh(): void;
  message(text: string): void; // app.ts: replaceMessage('gut', text)
}
/** Routing von `.`/`,`: Gut-Liste bei aktivem Fokus, sonst Problemliste (AK-GC-08, R462 B2). */
export function stepKeyTarget(focus: FocusState): 'focus' | 'problem';
/** `true`, wenn der Fokus nach einem Inselwechsel zu löschen ist (AK-GC-07, R462 B2). */
export function shouldClearFocus(focus: FocusState, activeIsland: number): boolean;
export function runFocusToggle(deps: FocusDeps, good: GoodId): void;
export function runFocusStep(deps: FocusDeps, dir: 1 | -1): void;
```

**`focusReduce`:** `toggle` mit gleichem `good` und `island` wie `state` → `null`; sonst `{ good, island }`. `clear` → `null`.

**`runFocusToggle(deps, good)`:** `cancelPointerAction()`; `island = deps.activeIsland()`; `next = focusReduce(getFocus(), toggle)`. Wird der Fokus ausgeschaltet: `setFocus(null)`, `setCursor(null)`, **keine** Meldung, kein `centerOn`, `refresh()`; Ende. Sonst `list = focusList(world, island, good)`:

- `list` leer: `message(noProducerMessage)`, `setFocus(null)`, `setCursor(null)`, `refresh()`; kein `centerOn`, kein `openPanel` (AK-GC-06).
- kein Erzeuger in `list`, aber Verbraucher (AK-GC-05): `message(noProducerMessage)`, `setFocus(next)`, `setCursor(null)`, **kein** `centerOn`/`openPanel`, `refresh()`.
- sonst: `setFocus(next)`, `setCursor(null)`, Eintrag 1 über `stepList(() => list, null, island, 1)`, `centerOn(at)`, `openPanel(id)`, `refresh()`, `setCursor({ ...step.cursor, landed: activeIsland() })`, `message(focusMessage(…))`.

Der Problem-Cursor wird nie berührt (die Deps haben ihn nicht).

**`runFocusStep(deps, dir)`** (nur aufgerufen, wenn `getFocus() !== null`): `cancelPointerAction()`; `list` frisch aus `focusList(world, focus.island, focus.good)`. Leer → M3 `emptyFocusMessage`, `setFocus(null)`, `setCursor(null)`, `refresh()` (AK-GC-09). Sonst `stepList(() => list, getCursor(), activeIsland(), dir)`, `centerOn`, `openPanel`, `refresh()`, `setCursor(… landed)`, `message(focusMessage(…))`. Der Cursor-Rückfall bei Abriss kommt aus `stepList` (AK-GC-04/08).

Hinweis: Das Löschen des Fokus bei Inselwechsel liegt in `app.ts` (T06). Der Sprung bleibt auf der Fokus-Insel, löst es also nicht aus.

## Schritte

- [ ] **Schritt 1: Roter Test** (Fake-Deps protokollieren Aufrufe in Reihenfolge, wie `problems.test.ts`):
  - AK-GC-07: `focusReduce`: gleicher Chip → `null`; anderes Gut → `{good, island}` direkt; `clear` → `null`; `toggleStartsJump` wahr bei Aus→An und Wechsel, falsch beim Ausschalten. Die Auslöser „Esc, Inselwechsel, Neue Insel/Laden → clear“ verdrahtet T06; hier nur der Reducer.
  - **B2 verbindlich:** `stepKeyTarget(null) === 'problem'`, mit Fokus `'focus'`; `shouldClearFocus(null, n) === false`, `shouldClearFocus({good, island: 0}, 0) === false`, `shouldClearFocus({good, island: 0}, 1) === true`. `app.ts` (T06) ruft beide und enthält keine eigene Entscheidungslogik dazu.
  - **B7:** leeres Lager (Bestand 0, roter Pfeil) bei Klick: gleiches Verhalten wie sonst (Liste unabhängig vom Bestand, Sprung bzw. M2); ein Testfall.
  - AK-GC-12 zusätzlich: `serialize(world)` vor und nach der Folge identisch (R462 B6).
  - AK-GC-05/06: M2 mit Verbrauchern (Fokus an, kein `centerOn`, kein `openPanel`) und ohne alles (Fokus `null`, M2, weder `centerOn` noch `openPanel`, Cursor `null`).
  - Sprung: Toggle mit 4 Einträgen → `cancelPointerAction`, `centerOn(Eintrag 1)`, `openPanel(id)`, `refresh`, M1 „… 1 von 4: …“; zweiter Aufruf gleiches Gut → Fokus `null`, keine Meldung, kein `centerOn`.
  - AK-GC-08: `runFocusStep` `+1` durchläuft 1 → 2 → … → n → 1 (Umlauf), `-1` rückwärts; Problem-Cursor-Fake bleibt in allen Fällen ungerufen; nach Fokus-Ende liefert `runProblemJump` denselben Eintrag wie vor dem Fokus.
  - AK-GC-04 (Rückfall): Cursor-Eintrag zwischen zwei Schritten abgerissen (`delete world.buildings[id]` in der Testwelt) → nächster Schritt landet beim Nachfolger nach `sort`.
  - AK-GC-09: alle Einträge abgerissen, dann `runFocusStep` → M3 „Holz: nichts mehr markiert“, `setFocus(null)`.
  - AK-GC-12: `JSON.stringify(world)` vor und nach einer Folge aus Toggle, Schritt, Schritt, Toggle, Wechsel identisch.
    Lauf `npx vitest run tests/ui/goodFocus.test.ts; echo EXIT=$?` → **rot**.
- [ ] **Schritt 2: Umsetzung** wie oben, Reihenfolge der Deps-Aufrufe wie `runProblemJump` (`cancelPointerAction` → Berechnung → `centerOn` → `openPanel` → `refresh` → `setCursor` → `message`).
- [ ] **Schritt 3: Prüfen.** `npx vitest run tests/ui/goodFocus.test.ts tests/ui/problems.test.ts tests/ui/imports.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?` → 0.
- [ ] **Schritt 4: Commit** `feat: Fokus-Zustand und Sprungablauf des Gut-Chips (I-043)`.

## Nicht in dieser Task

DOM, `app.ts`, Hotkeys, Render. (`stepKeyTarget` und `shouldClearFocus` sind hier Pflicht; T06 verdrahtet sie nur.)
