# T05 · Render: Konturen für Erzeuger und Verbraucher

Strang ui · Umsetzer `tech-ui-engineer` (Render-Datei, E5) · AK-GC-11, Bau für AK-GC-13 · blocked-by T03 · Grösse M (≈ 25 Tools)

**Dateien (exklusiv):** `src/render/focusMarks.ts` (neu), `src/render/palette.ts`, `src/render/renderer.ts`, `tests/render/focusMarks.test.ts` (neu). Lesen: `ak.md`, `src/render/statusMarks.ts` (Vorbild: `MAX_MARKS`, Range-Culling, `markable`), `src/render/renderer.ts` (`footprintPath`, `hullPath`, `frames`, Auswahl-Kontur), `tests/render/fakeCtx.ts`, `tests/render/statusMarks.test.ts` (Testaufbau), `src/render/homeBuildings.ts`.

## Schritt 0: Zeilenstände nach M13-E1-Merge prüfen (Pflicht)

`src/render/` liegt nicht im Ownership von M13-E1-UI; dennoch prüfen (Statusmarke „stillgelegt“ ist ausgelagert, `tests/render/statusMarks.test.ts` wird von T12 geändert):

```bash
git log --oneline 1b723334..HEAD -- src/render/renderer.ts src/render/palette.ts src/render/statusMarks.ts
grep -n "footprintPath\|hullPath\|const selB\|drawStatusMarks(\|export interface RenderFx\|frames.find" src/render/renderer.ts; echo EXIT=$?
```

Auf `1b723334`: `footprintPath` Z. 266, `hullPath` Z. 286, `RenderFx` Z. 166, `drawStatusMarks`-Aufruf Z. 1029, Auswahl-Kontur Z. 1034–1047, `frames` mit `{ island, v, ci, range }`.

## API

```ts
// focusMarks.ts
export const MAX_FOCUS_MARKS = 40; // Darstellungswert, Richtwert MAX_MARKS 60
export interface FocusFx {
  good: GoodId;
  island: number;
}
/** Zeichnet Konturen; liefert die Zahl gezeichneter Gebäude (≤ MAX_FOCUS_MARKS). */
export function drawFocusMarks(
  ctx: CanvasRenderingContext2D,
  frame: { v: World; ci: Camera; range: TileRange },
  focus: FocusFx | null,
  paths: { footprint: PathFn; hull: PathFn },
): number;
```

`footprintPath`/`hullPath` sind in `renderer.ts` privat; entweder in `focusMarks.ts` über einen `paths`-Parameter hereinreichen (Test liefert Fake-Pfade, Empfehlung) oder die beiden Funktionen nach `focusMarks.ts`/`iso.ts` verschieben, falls `renderer.ts` sie nur dort braucht — dann `renderer.ts` importiert sie. Die kleinere Änderung gewinnt.

Regeln: `focus === null` → 0, nichts gezeichnet. Je Gebäude des Frames (`frame.v.buildings`, die Frame-Welt `v` trägt die Gebäude der Fokus-Insel mit `island` HOME, siehe `homeBuildings`-Kommentar): ausserhalb `range` überspringen; `produces === good` → Erzeuger, `consumes?.includes(good)` → Verbraucher; Häuser und Kontor nie. Erzeuger zuerst zeichnen, dann Verbraucher, Abbruch bei `MAX_FOCUS_MARKS`. Erzeuger: `setLineDash([])`, Verbraucher: `setLineDash([6, 4])`, Linienbreite 3, Farbe `PALETTE.signalFocus`, danach `setLineDash([])` und `restore`. Pfad = `footprintPath` + `hullPath` wie bei der Auswahl. Kein `timeMs`, kein Pulsieren, `reduce` ohne Wirkung.

## Schritte

- [ ] **Schritt 1: Roter Test `tests/render/focusMarks.test.ts` (AK-GC-11, fakeCtx).** Der Fake-Kontext protokolliert `stroke`-Ereignisse mit `style`; prüfen:
  - `focus: null` → 0 Zeichenaufrufe, Rückgabe 0;
  - nur Gebäude innerhalb `range` bekommen eine Kontur (ein Erzeuger ausserhalb → keine);
  - Erzeuger durchgezogen (`getLineDash()` leer), Verbraucher gestrichelt (nicht leer) — falls `fakeCtx` `setLineDash` nicht protokolliert, in `tests/render/fakeCtx.ts` minimal ergänzen (erlaubt, nur Protokollfeld);
  - Farbe = `PALETTE.signalFocus`, nicht `signalYellow`;
  - 50 Erzeuger + 10 Verbraucher sichtbar → genau `MAX_FOCUS_MARKS` Konturen, alle 40 sind Erzeuger; 30 Erzeuger + 30 Verbraucher → 30 + 10;
  - Häuser, Kontor, andere Güter: keine Kontur;
  - die Welt ist nach dem Aufruf JSON-gleich (kein Schreiben).
    Lauf `npx vitest run tests/render/focusMarks.test.ts; echo EXIT=$?` → **rot**.
- [ ] **Schritt 2: Palette.** `signalFocus: '#00c8ff'` in `PALETTE` (Darstellungswert, Cyan, unterscheidbar von Gelb der Auswahl, Rot, Orange, Grün). Prüfen, ob Tests `SIGNAL_NAMES` auswerten (`tests/render/life.test.ts:174`, `sprites-kanten.test.ts:292`, `terrainFoothills.test.ts`, `palette.test.ts`, `tests/ui/contrast.test.ts`): `signalFocus` nicht in `SIGNAL_NAMES` aufnehmen, es sei denn alle diese Tests bleiben grün; Entscheidung und Grund als Kommentar in `palette.ts`.
- [ ] **Schritt 3: `drawFocusMarks`** wie oben; `RenderFx.focus?: FocusFx | null` in `renderer.ts`. In `render()` direkt **vor** der Auswahl-Kontur (Z. ≈ 1034): `const ff = fx.focus ? frames.find((f) => f.island === fx.focus!.island) : undefined; if (ff) drawFocusMarks(ctx, ff, fx.focus ?? null, paths)`. Die Auswahl-Kontur wird danach gezeichnet und liegt darüber.
- [ ] **Schritt 4: Prüfen.** `npx vitest run tests/render/focusMarks.test.ts tests/render/renderer.test.ts tests/render/palette.test.ts tests/render/statusMarks.test.ts tests/ui/contrast.test.ts; echo EXIT=$?`, `npx tsc --noEmit; echo EXIT=$?`, `make lint; echo EXIT=$?` → 0. `grep -n "fx.focus\|focus" src/render/renderer.ts` zeigt nur Lesezugriffe.
- [ ] **Schritt 5: Commit** `feat: Render-Konturen für den Gut-Fokus (I-043)`.

## Nicht in dieser Task

Verdrahtung des Fokus aus `app.ts` (T06). Perf-Budget: Schleife über die Gebäude des Frames wie `drawStatusMarks`; keine neue Zwischenspeicherung.
