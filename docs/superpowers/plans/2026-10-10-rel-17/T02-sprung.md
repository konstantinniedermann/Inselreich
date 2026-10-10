# T02 · Tasten `.`/`,`, Sprung und ersetzende Meldung

Strang UI · Worktree `.worktrees/rel-17` · Umsetzer `tech-ui-engineer` (sonnet, Fortsetzung per SendMessage) · AK-R17-08…11 (`ak.md`) · blocked-by T01 (Review OK) · Grösse S (≈ 20 Tools)

**Files:**

- Modify: `src/ui/hotkeys.ts` (`HotkeyAction`, `hotkeyAction`, `hotkeyList`), `tests/ui/hotkeys.test.ts`, `src/ui/messages.ts` (neue Funktion `replaceMessage`), `src/ui/app.ts` (Importe, neuer `jumpToProblem` neben `jumpToIsland` Z. 420–426, `onHotkey` Z. 771–791)
- Nicht ändern: `src/ui/input.ts` (`e.repeat` wird schon in Z. 505 ignoriert), `src/ui/problems.ts` (T01), `dispose` in `app.ts` (REL-16), `src/ui/hints.ts`

## Teil A · Tasten (AK-R17-08, 09)

- `HotkeyAction` um `| { kind: 'problemNext' } | { kind: 'problemPrev' }` erweitern.
- `hotkeyAction`: nach der Modifier-Prüfung `if (k === '.') return { kind: 'problemNext' }; if (k === ',') return { kind: 'problemPrev' };` (Konstanten `PROBLEM_NEXT_KEY = '.'`, `PROBLEM_PREV_KEY = ','` wie `ISLAND_HOME_KEY`). Keine Bedingung an die Seefahrt.
- `hotkeyList`: direkt nach `{ key: '?', label: 'Hilfe' }` die Einträge `{ key: '.', label: 'Nächstes Problem anspringen' }`, `{ key: ',', label: 'Voriges Problem anspringen' }`.

**Tests zuerst (rot)** in `tests/ui/hotkeys.test.ts`, neuer Block `describe('REL-17 Tasten . und , (AK-R17-08, 09)')`:

- `.` → `problemNext`, `,` → `problemPrev`, mit `seafaring` `false` und `true`.
- stumm: `hotkeyAction('.', NONE, true)`, `{ ...NONE, ctrl: true }`, `meta`, `alt` → `null`.
- `hotkeyList(createWorld(3))` enthält beide Einträge je genau einmal, Index von `.` = Index von `?` + 1.
- **Bestehenden Test anpassen** (bewusst, im Commit nennen): `AK-U1-03` erwartet nach `'?'` jetzt `'.', ','` vor `...NAV_KEYS`. `AK-UX-06` bleibt unverändert grün.

```bash
npx vitest run tests/ui/hotkeys.test.ts; echo EXIT=$?   # rot: neue Fälle und AK-U1-03
```

## Teil B · Ersetzende Meldung (AK-R17-11, Entscheid E7)

In `src/ui/messages.ts` den Toast-Aufbau aus `showMessage` in eine private Funktion ziehen (ohne Verhaltensänderung) und daneben exportieren:

```ts
/** Meldung mit festem Platz: ersetzt den Toast desselben `slot` (kein Dedupe; R449, I-042). */
export function replaceMessage(
  slot: string,
  text: string,
  kind: 'info' | 'error' | 'warn' = 'info',
): void;
```

Ablauf: `if (!box) return;` → `box.querySelector('[data-slot="' + slot + '"]')?.remove()` → Toast wie `showMessage` (nicht sticky, 3 s) mit `toast.dataset.slot = slot` → MAX_TOASTS-Regel wie bisher. `lastText`/`lastAt` nicht anfassen. Kein Vitest möglich (`tests/ui/` ohne DOM): Beleg im Browser (T05 Schritt 2) und im Review; die bestehenden Aufrufer von `showMessage` bleiben byte-gleich im Verhalten.

## Teil C · Sprung in `app.ts` (AK-R17-10, Entscheide E1, E3, E6)

Neben `jumpToIsland`:

```ts
/** Problem-Sprung (I-042): Cursor nur in der Closure, nie im Spielstand. */
let problemCursor: ProblemCursor | null = null;
const jumpToProblem = (dir: 1 | -1): void => {
  input?.cancelPointerAction(); // E6: ein Weg- oder Abriss-Zug endet sauber (dragEnd)
  const step = problemStep(world, problemCursor, state.activeIsland, dir);
  if (step === null) {
    problemCursor = null;
    replaceMessage('problem', NO_PROBLEM_TEXT);
    return; // Kamera und Panel bleiben
  }
  centerOn(state.cam, step.problem.at.x, step.problem.at.y, clampView(), bounds);
  setPanel({ kind: 'inspect', id: step.problem.id }); // E1: Werkzeug bleibt, kein selectTool
  refresh(); // aktive Insel folgt der Kamera
  problemCursor = { ...step.cursor, landed: state.activeIsland };
  replaceMessage('problem', problemMessage(step.index, step.count, step.problem));
};
```

`landed` ist die **nach** `refresh()` berechnete aktive Insel (nicht `problem.island`): klemmt `centerOn` am Rand, bleibt der Umlauf trotzdem stabil.

`onHotkey`: zwei Zweige `problemNext` → `jumpToProblem(1)`, `problemPrev` → `jumpToProblem(-1)` **vor** dem bisherigen `else`; das `else` (Pause) wird zu `else if (h.kind === 'pause')`, damit eine neue Aktion nie still als Pause endet. Das abschliessende `refresh()` in `onHotkey` bleibt (doppeltes `refresh` ist harmlos, ≈ 1 Aufruf je Tastendruck).

Kein Vitest für die Verdrahtung (DOM, Kamera): Beleg T05 Schritte 1–5, Review prüft die Reihenfolge `cancelPointerAction` → `centerOn` → `setPanel` → `refresh` → Cursor → Meldung.

## Prüfbefehle

```bash
npx vitest run tests/ui/hotkeys.test.ts tests/ui/problems.test.ts tests/ui/imports.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

Kurzer Sichtlauf ist **nicht** Teil des Tasks (Browser erst in T05).

## Commits

`feat: Tasten . und , springen zum nächsten Problem (I-042, REL-17)` (hotkeys, app, Tests), `refactor: Toast-Aufbau teilen, replaceMessage mit festem Platz` (messages.ts) — Reihenfolge: zuerst der `refactor`, dann `feat`; Trailer der Session.

## Bericht

Je AK Testname und Rot-Ausgabe, Diff von AK-U1-03 (eine Zeile), Exit-Codes, `git diff --stat main...HEAD`; Hinweis, welche AK erst T05 belegt (10, 11).
