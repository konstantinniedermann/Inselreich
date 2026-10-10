# T03 · Abriss-Zug und Trenn-Warnung

Strang UI · Worktree `.worktrees/rel-17` · Umsetzer `tech-ui-engineer` (sonnet, Fortsetzung per SendMessage) · AK-R17-12…16 (`ak.md`) · blocked-by T01, T02 (Review OK; T02 teilt `app.ts`). Zeilenangaben unten stammen aus der Planzeit (vor REL-16-Merge): Stellen per grep neu finden · Grösse M (≈ 25 Tools)

**Files:**

- Modify: `src/ui/input.ts` (`isDragPaintTool` Z. 104, neue Helfer, `onPointerDown` Z. 288–315, Zug-Zweig in `onPointerMove` Z. 355–392, `endDrag` Z. 426–437, `updateHover` Z. 206–225), `tests/ui/input.test.ts` (Block „M10 Zieh-Werkzeuge“ Z. 69–77 und neuer Block), `src/ui/app.ts` (Zug-Zustand bei Z. 749–762, `dragEnd` Z. 836–840, Abriss-Zweig Z. 877–884)
- Lesen: `src/ui/problems.ts` (`cutOffIds`, `newlyCut`, T01), `src/ui/target.ts`, `src/sim/build.ts` (`removeRoad`, Erstattung), `src/audio/sound.ts` (`THROTTLE_MS.demolish` = 80)
- Nicht ändern: `src/sim/`, `src/audio/`, `src/ui/target.ts`, `src/ui/hints.ts`

## Teil A · Reine Helfer in `input.ts` (AK-R17-12, 15, 16)

```ts
/** Werkzeuge, die beim Ziehen je Kachel einmal wirken: Weg, Roden, Aufforsten, Abriss (nur Wege, I-041). */
export function isDragPaintTool(tool: Tool): boolean; // + demolish
/** Abriss beginnt einen Zug, ausser der Druck trifft eine Gebäudehülle (dann Einzelabriss wie bisher). */
export function demolishStroke(world: World, down: IslandTile | null): boolean;
/** Pick-Werkzeug im Zug: Abriss läuft über die Bodenkachel wie der Weg, nicht über die Hülle. */
export function strokePickTool(tool: Tool): Tool;
/** Meldung am Zugende: Trenn-Warnung, sonst „Kein Weg“ beim reinen Klick auf leeren Boden (E5). */
export function strokeEndNotice(
  cut: number,
  removed: number,
  tiles: number,
): { kind: 'warn'; text: string } | { kind: 'error'; reason: 'Kein Weg' } | null;
```

`demolishStroke`: `down === null` → `true`; sonst `tileAt(world.islands[down.island], down.x, down.y)?.buildingId == null`. Text der Warnung: `` `Abriss trennt ${cut} Gebäude vom Kontor` `` (auch bei 1, „Gebäude“ ist Einzahl wie Mehrzahl).

**Tests zuerst (rot)** in `tests/ui/input.test.ts`:

- Block „M10 Zieh-Werkzeuge“: `expect(isDragPaintTool({ kind: 'demolish' })).toBe(true)` (heute `false`, Z. 74 — bewusst umdrehen, Testtitel um „REL-17 Abriss“ ergänzen).
- Neuer Block `describe('REL-17 Abriss-Zug (AK-R17-12…16)')` mit `uxWorld()`: `demolishStroke` auf der Fischerhütte → `false`; auf einer Wegkachel → `true`; auf leerem Gras → `true`; `null` → `true`. `strokePickTool({ kind: 'demolish' })` → `{ kind: 'road' }`, `road`/`clearForest`/`build` unverändert (`toBe` dasselbe Objekt). `strokeEndNotice(2, 3, 5)` → warn „Abriss trennt 2 Gebäude vom Kontor“; `(1, 1, 1)` → warn „… 1 Gebäude …“; `(0, 0, 1)` → `{ kind: 'error', reason: 'Kein Weg' }`; `(0, 0, 4)` → `null`; `(0, 2, 2)` → `null`.
- Zusammenspiel mit `targetTile` (rein, `tests/ui/target.test.ts` als Muster): Bildpunkt über der Hülle der Fischerhütte, aber auf einer Weg-Bodenkachel dahinter → `targetTile(w, cam, strokePickTool(demolish), sx, sy)` liefert die Bodenkachel, `targetTile(w, cam, demolish, …)` den Gebäude-Ursprung. Ist ein solcher Punkt in der `uxWorld` nicht ohne Aufwand zu finden, stattdessen: gleicher Bildpunkt, `road`- und `strokePickTool(demolish)`-Ergebnis gleich.

```bash
npx vitest run tests/ui/input.test.ts; echo EXIT=$?   # rot: demolish false, Helfer fehlen
```

## Teil B · Zug in `bindInput` (AK-R17-12, 14, 16)

- `onPointerDown`: `road: !wantsPan && isDragPaintTool(state.tool) && (state.tool.kind !== 'demolish' || demolishStroke(state.world, downTile))`. `downTile` wie bisher mit `state.tool` (Hüllen-Pick) — so entscheidet der Druck über Einzelabriss oder Zug. Neues Feld `demolish: boolean` im `drag`-Objekt (Werkzeug beim Druck, wie `road`).
- In einem Abriss-Zug meldet **jede** Kachel `dragging: true` — Maus-Erstkachel (Z. 307), Touch-Erstkachel (Z. 365), Touch-Tippen in `endDrag` (Z. 429–435) und die Folgekacheln. Umsetzung: kleiner lokaler Helfer `strokeTile(island, x, y, dragging)` → `onAction({ …, dragging: d.demolish || dragging })`. Weg, Roden, Aufforsten bleiben byte-gleich im Verhalten.
- Folgekacheln (Z. 368): `pickTarget(state.world, state.cam, strokePickTool(state.tool), p.sx, p.sy)`; Erstkachel per Maus ebenfalls mit `strokePickTool` (ohne Gebäude-Treffer ist das dieselbe Bodenkachel).
- `updateHover`: läuft ein Abriss-Zug (`drag?.demolish && drag.road && !drag.panning`), Pick mit `strokePickTool` und `ok = tileAt(...)?.road === true`; sonst unverändert.
- `cancelPointerAction` sendet schon `dragEnd` für `drag.road` (per grep): gilt damit auch für `pointercancel` (`onPointerCancel`), `Esc`, Rechtsklick (`cancel` → `selectTool` → `cancelPointerAction`) und `.` (T02). **Lücke `blur` (B3):** `onBlur` leert heute nur `keys`/`spaceDown`; ein laufender Zug bliebe offen und `stroke` in `app.ts` hinge. Deshalb in `onBlur` zusätzlich `if (drag !== null) cancelPointerAction();` (Weg/Roden/Aufforsten senden dann ebenfalls `dragEnd`, harmlos: setzt nur `dragMoneyToastShown` zurück). Test zuerst (rot): Block `REL-17 Abriss-Zug`, `it('pointercancel und blur beenden den Zug mit dragEnd')` — falls `bindInput` ohne DOM nicht startbar ist, als Quelltext-Test auf `input.ts` (`onBlur` enthält `cancelPointerAction`, `onPointerCancel` ebenso) mit Begründung im Testkommentar; im Review bestätigen.

## Teil C · Wirkung in `app.ts` (AK-R17-13, 15)

Neben `dragMoneyToastShown`:

```ts
/** Abriss-Zug (I-041): Anbindung vor dem Zug, besuchte und entfernte Wegkacheln. */
let stroke: { before: Set<number>; tiles: number; removed: number; island: number } | null = null;
```

Abriss-Zweig in `onAction` (heute Z. 877–884) — vor dem bisherigen Gebäude-/Weg-Zweig:

- `tool.kind === 'demolish' && a.dragging`: `stroke ??= { before: cutOffIds(world), tiles: 0, removed: 0, island: a.island }`; `stroke.tiles++`; hat die Kachel ein Gebäude oder keinen Weg → nichts (still); sonst `removeRoad(world, a.x, a.y, a.island)`, bei `ok` `stroke.removed++` und `sound.play('demolish')`. Kein `showRoadFailure` im Zug.
- `!a.dragging` (Druck auf eine Gebäudehülle, AK-R17-14): bisheriger Code unverändert (`demolishBuilding`, Meldung `demolishText`).
- `dragEnd`-Zweig (Z. 836): zusätzlich, wenn `stroke !== null`: `const n = strokeEndNotice(newlyCut(stroke.before, world), stroke.removed, stroke.tiles)`; `warn` → `showMessage(n.text, 'warn')`; `error` → `showRoadFailure(n.reason, false, stroke.island)`; danach `stroke = null`.

Erstattung und Konnektivität bleiben in `removeRoad` (Sim, unverändert). `refresh()` läuft je Kachel wie beim Weg-Zug (Z. 885). Nach REL-16 hat `showRoadFailure` einen optionalen vierten Parameter `at`; der Abriss-Pfad übergibt ihn nicht (wie REL-16 beim `removeRoad`-Aufruf).

**Quelltext-Test (rot vorher)** wie AK-R16-06 in `tests/ui/input.test.ts`: `it('AK-R17-13/15 Abriss-Zug in app.ts (Quelltext)')` — `app.ts` enthält `strokeEndNotice(newlyCut(stroke.before, world)` im `dragEnd`-Zweig und `stroke = null` danach; im Zweig `tool.kind === 'demolish' && a.dragging` steht `removeRoad` und kein `demolishBuilding`. Testkommentar wie dort.

**Rückfall (B2):** Lässt sich „Weg-Zug + `.`“ oder „Abriss-Zug + `.`“ im Browser nicht herstellen, ist der Rückfall auf den Quelltext-/Vitest-Beleg nur als begründete Ausnahme im Playtest-Report zulässig (T05 Schritt 8 bleibt verbindlich).

## Prüfbefehle

```bash
npx vitest run tests/ui/input.test.ts tests/ui/target.test.ts tests/ui/problems.test.ts tests/ui/islandTools.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

## Commits

`feat: Abriss zieht Wege in einem Zug ab (I-041, REL-17)` (input.ts + Tests), `feat: Warnung, wenn ein Abriss Gebäude vom Kontor trennt (R449 (4))` (app.ts); Trailer der Session.

## Bericht

Je AK Testname und Rot-Ausgabe; Liste der geänderten Stellen in `input.ts` mit Zeilen; Bestätigung, dass `pointercancel` und `blur` den Zug mit `dragEnd` beenden (kein hängender `stroke`), dass `road`/`clearForest`/`plantForest` bei `demolish === false` denselben `dragging`-Wert wie vorher senden; Exit-Codes; `git diff --stat main...HEAD`. AK-R17-13, 16 belegt erst T05 im Browser.
