# T02 · Schild weicht der Karte (Helfer + `app.ts`)

Strang UI · Worktree `.worktrees/rel-15-ui` · Branch `fix/rel-15-ui` · Umsetzer `tech-ui-engineer` (sonnet, Fortsetzung des T01-Umsetzers per SendMessage) · AK-Entwürfe B1–B3 (`ak-entwuerfe.md`) · blocked-by T01 (Review OK)

**Ziel (R435):** Erscheint die Mouse-over-Karte, verschwindet das Cursor-Schild ganz. Kachelwechsel, Ziehen, Werkzeugwechsel oder Dialog bringen es sofort zurück. Kein Stapeln, kein neuer Abstand, keine neue Position.

**Files (nur diese):**

- Modify: `src/ui/hover.ts` (neuer Export nach `hoverVisible`, Z. ~52)
- Modify: `src/ui/app.ts` (`updateHint` Z. 892–928, Aufrufe im Loop Z. 1272–1273, Import aus `./hover` Z. ~86)
- Test: `tests/ui/hover.test.ts` (Import Z. 12–18; neuer Block am Dateiende)

**Interfaces:** Consumes `hoverVisible(s: HoverState): boolean`, `HOVER_DELAY_MS`, `type HoverState` (bestehend, `src/ui/hover.ts`). Produces `cursorHintVisible(hasHint: boolean, cardShown: boolean): boolean` in `src/ui/hover.ts`; `updateHint` bekommt den zweiten Parameter `cardShown: boolean`.

**Hintergrund:** Die Karte erscheint nur mit dem Auswahl-Werkzeug (`hoverVisible`). Schild und Karte sitzen beide bei Zeiger + 16 px auf z-index 20; nach 400 ms deckt die Karte das Schild bis auf einen Rest ab. Das Schild sagt bei der Auswahl nichts, was die Karte nicht auch sagt.

## Schritte

- [ ] **Schritt 1: Test zuerst (rot)**

`tests/ui/hover.test.ts`: im Import aus `../../src/ui/hover` (Z. 12–18) `cursorHintVisible` und `HOVER_DELAY_MS` ergänzen. Block am Dateiende:

```ts
describe('UI-HOVER-SCHILD: Schild weicht der Karte (R435)', () => {
  const base: HoverState = {
    restMs: 0,
    sameTile: true,
    dragging: false,
    modalOpen: false,
    tool: { kind: 'select' },
  };
  const card = (s: Partial<HoverState>): boolean => hoverVisible({ ...base, ...s });
  it('B1 sichtbar genau dann, wenn ein Hinweis da ist und keine Karte offen ist', () => {
    expect(cursorHintVisible(true, false)).toBe(true);
    expect(cursorHintVisible(true, true)).toBe(false);
    expect(cursorHintVisible(false, false)).toBe(false);
    expect(cursorHintVisible(false, true)).toBe(false);
  });
  it('B2 Ablauf über einem Wohnhaus: Schild, nach 400 ms nur Karte, Wechsel bringt das Schild', () => {
    expect(cursorHintVisible(true, card({ restMs: 0 }))).toBe(true);
    expect(cursorHintVisible(true, card({ restMs: HOVER_DELAY_MS - 1 }))).toBe(true);
    expect(cursorHintVisible(true, card({ restMs: HOVER_DELAY_MS }))).toBe(false);
    const rest = { restMs: HOVER_DELAY_MS };
    expect(cursorHintVisible(true, card({ ...rest, sameTile: false }))).toBe(true); // Kachelwechsel
    expect(cursorHintVisible(true, card({ ...rest, dragging: true }))).toBe(true); // Ziehen
    expect(cursorHintVisible(true, card({ ...rest, tool: { kind: 'road' } }))).toBe(true); // Werkzeug
  });
  it('B3 beim Bauen nie eine Karte, das Schild bleibt', () => {
    const tools: Tool[] = [
      { kind: 'build', defId: 'house' },
      { kind: 'road' },
      { kind: 'demolish' },
      { kind: 'clearForest' },
      { kind: 'plantForest' },
    ];
    for (const tool of tools) {
      expect(card({ restMs: 10_000, tool }), tool.kind).toBe(false);
      expect(cursorHintVisible(true, card({ restMs: 10_000, tool })), tool.kind).toBe(true);
    }
  });
});
```

Run: `npx vitest run tests/ui/hover.test.ts; echo EXIT=$?`
Expected: FAIL („cursorHintVisible is not a function“ bzw. Import fehlt), `EXIT=1`.

- [ ] **Schritt 2: Helfer in `src/ui/hover.ts`** (direkt nach `hoverVisible`)

```ts
/** Cursor-Schild sichtbar? Nur mit Hinweis und solange keine Mouse-over-Karte offen ist (R435, UI-HOVER-SCHILD). */
export function cursorHintVisible(hasHint: boolean, cardShown: boolean): boolean {
  return hasHint && !cardShown;
}
```

Run: `npx vitest run tests/ui/hover.test.ts; echo EXIT=$?` → PASS, `EXIT=0`.

- [ ] **Schritt 3: `src/ui/app.ts` verdrahten**

a) Import aus `./hover` um `cursorHintVisible` ergänzen (Z. ~86, neben `hoverVisible`); `type Hint` aus `./hints` importieren, falls nicht vorhanden.

b) `updateHint` (Z. 892–928) so umbauen, dass der Hinweis gemerkt und die Sichtbarkeit jedes Frame über den Helfer gesetzt wird:

```ts
let hintFor: string | null = null;
let hintNow: Hint | null = null;
const updateHint = (force: boolean, cardShown: boolean): void => {
  const pos = input?.pointerClient() ?? null;
  const hover = state.hover;
  if (!hover || !pos || isModalOpen()) {
    hintEl.hidden = true;
    hintFor = null;
    hintNow = null;
    return;
  }
  const key = hintKey(hover);
  if (force || key !== hintFor) {
    hintFor = key;
    hintNow = placementHint(
      world,
      hover.tool ?? state.tool,
      hover.x,
      hover.y,
      hover.island ?? state.activeIsland,
    );
    if (hintNow) {
      hintEl.textContent = hintNow.text;
      hintEl.className = `cursor-hint cursor-hint--${hintNow.tone}`;
    }
  }
  // Erscheint die Mouse-over-Karte, weicht das Schild (R435)
  hintEl.hidden = !cursorHintVisible(hintNow !== null, cardShown);
  if (hintEl.hidden) return;
  // … Positionierung (hintPosition, style.left/top) unverändert …
};
```

Den Kommentar über `hintEl` (Z. 887) ergänzen: „… weicht der Mouse-over-Karte (R435)“.

c) Im Loop (Z. 1272–1273) Reihenfolge tauschen, damit das Schild den Kartenzustand desselben Frames sieht:

```ts
updateHoverCard(fx, t0);
updateHint(frame % HUD_EVERY_FRAMES === 0, !hoverEl.hidden);
```

`updateHoverCard` bleibt unverändert: Kachelwechsel ruft `hideHoverCard()`, Ziehen ebenso, Werkzeug ≠ Auswahl und offener Dialog verstecken die Karte; damit kommt das Schild im selben Frame zurück. Bei offenem Dialog bleibt das Schild wie bisher aus (Gate-Entscheid E5); nach dem Schliessen startet die 400-ms-Ruhe neu (`hoverTile = null`), also zuerst das Schild.

- [ ] **Schritt 4: Prüfen**

Run: `npx vitest run tests/ui/hover.test.ts tests/ui/cursorHint.test.ts tests/ui/hints.test.ts tests/ui/input.test.ts; echo EXIT=$?` → PASS, `EXIT=0`
Run: `npx tsc --noEmit; echo EXIT=$?` → `EXIT=0`
Run: `make lint; echo EXIT=$?` → `EXIT=0`
Run: `grep -n "updateHint(" src/ui/app.ts; echo EXIT=$?` → genau zwei Treffer (Definition und ein Aufruf mit zwei Argumenten).

- [ ] **Schritt 5: Kurzer Sichtcheck (optional, ohne Screenshot-Pflicht):** nur falls der Controller ihn verlangt; der Browser-Check ist T06.

- [ ] **Schritt 6: Commit**

```bash
git add src/ui/hover.ts src/ui/app.ts tests/ui/hover.test.ts
git commit -m "fix: Cursor-Schild weicht der Mouse-over-Karte (UI-HOVER-SCHILD, R435)"
```

## Abnahme für den Review

- `cursorHintVisible` rein, DOM-frei, in `hover.ts` neben `hoverVisible`; keine neue Position, kein neuer Abstand, kein CSS-Diff.
- Reihenfolge im Loop: erst Karte, dann Schild; `hintNow` wird bei Modal/ohne Hover zurückgesetzt.
- README und arc42 schreibt T05 (nicht hier).
