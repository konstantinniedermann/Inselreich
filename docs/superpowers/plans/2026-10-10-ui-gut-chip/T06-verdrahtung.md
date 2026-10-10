# T06 · Verdrahtung in `app.ts`

Strang ui · Umsetzer `tech-ui-engineer` · AK-GC-07 (Auslöser), Bau für AK-GC-13, 14, 15 · blocked-by T04, T05 · Grösse M (≈ 35 Tools)

**Dateien (exklusiv):** `src/ui/app.ts`. Lesen: `ak.md`, `src/ui/goodFocus.ts` (`FocusDeps`, `runFocusToggle`, `runFocusStep`, `focusReduce`), `src/ui/hud.ts` (`HudActions`).

## Schritt 0: Zeilenstände nach M13-E1-Merge prüfen (Pflicht)

`app.ts` wurde von M13-E1-UI geändert (T10 Aktion `setEdict`, T12 Aktion `setPaused`, T04 `tradeCtx`); REL-17 hat `jumpToProblem`/`onHotkey` geliefert. Alle Zeilen aus dem Plan sind Richtwerte.

```bash
git log --oneline 1b723334..HEAD -- src/ui/app.ts
grep -n "jumpToProblem\|problemCursor\|const onHotkey\|a.type === 'cancel'\|state.activeIsland = \|toggleGoodFocus\|focusedGood\|const jumpToIsland\|render(ctx, world\|type: 'newGame'\|loadGame\|const fx\b\|fx: RenderFx" src/ui/app.ts; echo EXIT=$?
```

Auf `1b723334`: `jumpToIsland` Z. 423, `problemCursor`/`jumpToProblem` Z. 431–447, `actions: HudActions` ab Z. 449 (Platzhalter aus T04), `selectTool` Z. 729, `onHotkey` Z. 800 (`problemNext`/`problemPrev` Z. 816–819), `cancel`-Zweig Z. 864–868, `refresh` mit `state.activeIsland = active` Z. 692, `render(…)` Z. 1333. Die Stellen für „Neue Insel“ und „Laden“ per `grep -n "world = \|Object.assign(world\|startNewGame\|loadFrom\|deserialize" src/ui/app.ts` finden und im Ledger festhalten.

## Verdrahtung

1. **Closure-Zustand** neben `problemCursor`: `let goodFocus: FocusState = null; let focusCursor: ProblemCursor | null = null;`. Reiner UI-Zustand, nie in `world`, nie in `serialize`.
2. **`focusDeps`** (`FocusDeps`): `world`, `activeIsland: () => state.activeIsland`, `getFocus/setFocus`, `getCursor/setCursor` (auf `focusCursor`), `cancelPointerAction: () => input?.cancelPointerAction()`, `centerOn` (wie `jumpToProblem`), `openPanel: (id) => setPanel({ kind: 'inspect', id })` (kein `selectTool`), `refresh`, `message: (t) => replaceMessage('gut', t)`.
3. **`actions`**: `toggleGoodFocus: (good) => runFocusToggle(focusDeps, good)`, `focusedGood: () => goodFocus?.good ?? null` (ersetzt die Platzhalter aus T04).
4. **`onHotkey`**: `problemNext`/`problemPrev` → `goodFocus !== null ? runFocusStep(focusDeps, ±1) : jumpToProblem(±1)`. Der Problem-Cursor bleibt unberührt, solange der Fokus an ist.
5. **Löschen** (jeweils `goodFocus = null; focusCursor = null`, über eine Funktion `clearGoodFocus()`):
   - `cancel`-Zweig (`Esc`): zusätzlich zu `closeClosableToast`/`setPanel`/`selectTool` — wirkt wie heute **und** löscht (ein Druck genügt; liegt ein schliessbarer Toast offen, schliesst `Esc` zuerst ihn und löscht den Fokus **trotzdem**, damit ein Druck genügt: `clearGoodFocus()` vor dem `closeClosableToast`-Return);
   - `refresh()`: wenn `active !== state.activeIsland` (Inselwechsel durch `0`, `9`, Seekarte, Schwenken, Problem-Sprung auf andere Insel) und `goodFocus !== null && goodFocus.island !== active` → `clearGoodFocus()`;
   - „Neue Insel“ und Laden (die zwei Stellen aus dem Schritt-0-Grep, dort wo auch `problemCursor = null` bzw. der Welt-Austausch passiert).
     `world` ist in `app.ts` evtl. austauschbar (`let world`/`Object.assign`): `focusDeps.world` muss die aktuelle Welt lesen (Getter), sonst zeigt der Fokus auf die alte.
6. **Render:** dem `fx`-Objekt (`render(ctx, world, …, fx)`) `focus: goodFocus` hinzufügen (`{ good, island }` oder `null`).
7. **Chip-Fokus nach Mausklick:** schon in T04 (`blur()` bei `detail > 0`); hier nur verifizieren (Browser T08).

## Schritte

- [ ] **Schritt 1: Test-first-Ersatz.** `app.ts` ist DOM-/Canvas-gebunden und nicht unit-testbar (Projektregel: Renderer/UI zusätzlich im Browser). Rot vorab: ein kleiner reiner Test in `tests/ui/goodFocus.test.ts` ist nicht Teil dieser Task (Dateien gehören T03). Stattdessen: vor der Umsetzung `grep -n "goodFocus" src/ui/app.ts; echo EXIT=$?` → EXIT=1 (Ausgangslage), danach Schritt 4. Ist die Routing-Entscheidung (`.`/`,` mit/ohne Fokus) in eine reine Funktion `stepKeyTarget(focus): 'focus' | 'problem'` fassbar, legt der Umsetzer sie in `goodFocus.ts` an und ergänzt dort einen kleinen Test (Ausnahme zur Ownership, im Ledger vermerken) — empfohlen, weil AK-GC-08 sie sonst nur im Browser prüft.
- [ ] **Schritt 2: Umsetzung** laut Verdrahtung 1–6. Kein Aufruf von `serialize`-Pfaden, keine Welt-Schreibzugriffe.
- [ ] **Schritt 3: Rauchprobe im Entwicklungsserver (kurz).** `make help` für den Befehl; Seite öffnen, Holz-Chip klicken → Meldung „Holz 1 von n: …“, `.` → nächster, `Esc` → Fokus weg. Kein vollständiger Browser-Lauf (T08).
- [ ] **Schritt 4: Prüfen.** `npx vitest run tests/ui tests/render/focusMarks.test.ts; echo EXIT=$?` (ganzes `tests/ui` ist hier gezielt genug), `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?` → 0. `git diff --stat main...HEAD -- src/sim tests/sim` → leer.
- [ ] **Schritt 5: Commit** `feat: Gut-Fokus in app.ts verdrahten (I-043)`.

## Nicht in dieser Task

README (T07), Browser-Lauf (T08).
