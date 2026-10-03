> **Task-ID:** R1 (Paket M11-R1) — ein Teil
> **AK-IDs:** AK-RND-03, AK-RND-04 (Vitest); Browser-Teil des Rings in AK-RND-05 (QA-ART nach R2)
> **blocked-by:** T01 (Review OK; `cycleOf`, `BuildingState` + `'noForest'`) — orga-02 E4
> **Strang:** `feat/m11-render` · Worktree `.worktrees/m11-render` (Controller legt ihn am T01-SHA an) · Implementierer `art-rendering-engineer` (sonnet), Controller lead-art
> **Gemeinsame Regeln:** [index.md](index.md) (Global Constraints) · [orga-06](orga-06-schnittstellen.md) · [orga-07](orga-07-datei-ownership.md)

## R1: Fortschrittsring, Marke `noForest`, Tageslicht

**Ziel:** Jeder Betrieb zeigt seinen Zyklus als Ring (läuft bei `ok`, sonst grau eingefroren); `noForest` bekommt eine
eigene Statusmarke und gilt nachts als stillstehend (Spec 8). Der Renderer liest nur, schreibt nie in die Welt.

**Code-Fakten (Ist M10 `801c279`, H-R3/H-R4 gemergt):**

- `src/render/statusMarks.ts:22` `MarkShape = 'arrow' | 'crate'`; `:28–31` `MARKS` (nur `waitingInput`, `storageFull`);
  `:34` `statusMarkOf(state)`; `:41–57` `shapePath`; `:63–108` `drawStatusMarks(ctx, world, cam, range, timeMs, reduce)`
  mit `MARK_MIN_PX` 10, `MAX_MARKS` 60, Culling über `range`, Position über `spriteBounds` + `worldToScreen`.
- `src/render/daynight.ts:62–65` `isLit`: Betrieb leuchtet nur bei `b.state === 'ok'` — `noForest` ist damit schon
  stillstehend (Ist erfüllt AK-RND-03, Teil Tageslicht; nur der Kommentar `:60` nennt die Zustände).
- `src/render/errands.ts:304` `tickClock(world, timeMs)` → `{ frac, fast }` (in der Pause `frac` 1); `:351` Muster
  `Math.min(0.99999, (b.progress + clock.frac) / cycle)` (nach T01 über `cycleOf`).
- `src/render/renderer.ts:719–721` Signalebene: `drawNeedSymbols`, `drawUnconnected`, `drawStatusMarks`; R1 ist der
  einzige M11-Task in `renderer.ts` (serielle Ownership; R2 ändert ihn nicht).
- `src/render/palette.ts`: Signal `signalOk`/`signalRed`/`signalWarn`/`signalYellow`; Grau `rockLight`; Kontur `wallTimber`.

**Erwartete Dateien:** `src/render/ring.ts` (neu), `src/render/statusMarks.ts`, `src/render/daynight.ts` (nur
Kommentar), `src/render/renderer.ts` (Import + ein Aufruf), `tests/render/ring.test.ts` (neu),
`tests/render/statusMarks.test.ts`, `tests/render/daynight.test.ts`, `docs/arc42.md` (§5 Render-Bausteine: `ring.ts`,
`statusMarks.ts`; §6 Ebene 12), `README.md` („Karte lesen": Ring, Marke „kein freier Wald").
**Nicht anfassen:** `src/sim/**`, `src/ui/**`, `src/render/sprites.ts`, `src/render/iso.ts` (R2), `src/audio/**`.

- [ ] **Schritt 1: Tests schreiben.** `tests/render/ring.test.ts` (neu; `LEVELS` gemockt wie T10, da R1 vor T07/T09
      läuft — gleicher `vi.mock`-Block mit den Fischer-Werten aus Anhang 01 A.4):

```ts
// Importe: ringFraction, ringView, drawProgressRings, MAX_RINGS (src/render/ring), fakeCtx, PALETTE, createWorld,
// center, centerOn, BUILDING_DEFS, serialize; Testhelfer worldWith/camAt wie in statusMarks.test.ts (kopieren).
describe('M11 Fortschrittsring (Spec 8)', () => {
  const mk = (defId: BuildingDefId, extra: Partial<Building> = {}): Building => ({
    id: 1,
    defId,
    x: 0,
    y: 0,
    connected: true,
    progress: 0,
    state: 'ok',
    ...extra,
  });
  it('AK-RND-04 ringFraction: Fischer progress 20 → 0,5; Stufe 2 progress 12 → 0,5; höchstens 0,99999', () => {
    expect(ringFraction(mk('fisher', { progress: 20 }), 0)).toBe(0.5);
    expect(ringFraction(mk('fisher', { progress: 12, level: 2 }), 0)).toBe(0.5);
    expect(ringFraction(mk('fisher', { progress: 39 }), 1)).toBe(0.99999);
    expect(ringFraction(mk('fisher', { progress: 10 }), 0.5)).toBeCloseTo(10.5 / 40, 12);
  });
  it('AK-RND-04 ringView: läuft nur bei ok und angebunden, sonst eingefroren ohne Bruchteil; ohne produces null', () => {
    expect(ringView(mk('fisher', { progress: 20 }), 0.6)).toEqual({
      fraction: 20.6 / 40,
      running: true,
    });
    expect(ringView(mk('fisher', { progress: 20, state: 'waitingInput' }), 0.6)).toEqual({
      fraction: 0.5,
      running: false,
    });
    expect(ringView(mk('lumberjack', { progress: 15, state: 'noForest' }), 0.6)).toEqual({
      fraction: 0.5,
      running: false,
    });
    expect(ringView(mk('fisher', { progress: 20, connected: false }), 0.6)!.running).toBe(false);
    expect(ringView(mk('chapel'), 0.6)).toBeNull();
  });
  it('AK-RND-04 drawProgressRings: Farben laufend/grau, Culling, MAX_RINGS, save/restore, Welt unverändert', () => {
    // worldWith([['fisher', 5, 5, 'ok'], ['weaver', 9, 5, 'waitingInput'], ['chapel', 13, 5, 'ok']])
    // → fillSet/strokeSet enthalten PALETTE.signalOk und PALETTE.rockLight; Rückgabe 2 (Kapelle ohne Ring);
    // Range ohne die Gebäude → 0; 80 Fischer → MAX_RINGS (60); log.saves === log.restores; JSON.stringify(world) gleich;
    // alle Farben ⊂ PALETTE ∪ {'rgba(255,255,255,0.85)'}.
  });
});
```

`tests/render/statusMarks.test.ts`, neuer Block (Importe da; `isLit` aus `../../src/render/daynight`):

```ts
describe('M11 Marke noForest (Spec 8)', () => {
  it('AK-RND-03 noForest: eigene Marke (Form ≠ waitingInput), wird gezeichnet, gilt nachts als stillstehend', () => {
    const m = statusMarkOf('noForest');
    expect(m?.shape).toBe('stump');
    expect(m!.shape).not.toBe(statusMarkOf('waitingInput')!.shape);
    expect(m!.color).toBe(PALETTE.signalRed);
    const world = worldWith([['lumberjack', 5, 5, 'noForest']]);
    const { ctx, log } = fakeCtx();
    expect(drawStatusMarks(ctx, world, camAt(world, 1), FULL, 0, true)).toBe(1);
    expect(log.fillSet).toContain(PALETTE.signalRed);
    const b = world.buildings[1001]!;
    expect(isLit(BUILDING_DEFS.lumberjack, b)).toBe(false);
  });
});
```

- [ ] **Schritt 2: Rot-Beleg.** `npx vitest run tests/render/ring.test.ts tests/render/statusMarks.test.ts`.
- [ ] **Schritt 3: Umsetzung.**
  - `src/render/ring.ts` (neu, rein bis auf das Zeichnen): `ringFraction(b, frac)` = `Math.min(0.99999, (b.progress + frac) / cycleOf(b))`
    (0 ohne Zyklus); `ringView(b, frac): { fraction: number; running: boolean } | null` (`null` ohne `produces`;
    `running = b.state === 'ok' && b.connected`; eingefroren `frac = 0`); `MAX_RINGS = 60`;
    `drawProgressRings(ctx, world, cam, range, frac): number` — Culling und Obergrenze wie `drawStatusMarks`; Grösse
    `s` wie die Marken (`MARK_MIN_PX` … 18 px nach Zoom), Mittelpunkt rechts neben der Marke: `top.x + s`,
    `top.y − 3 − s / 2`; Spur als voller Kreis (`PALETTE.wallTimber`, Linie `max(2, s / 6) + 2`), darüber der Bogen
    ab −π/2 im Uhrzeigersinn um `2π × fraction` (`signalOk` laufend, `rockLight` eingefroren); `save`/`restore` je Ring.
  - `statusMarks.ts`: `MarkShape` + `'stump'`; `MARKS.noForest = { shape: 'stump', color: PALETTE.signalRed }`
    (Kommentar „kein freier Wald"); `shapePath` für `stump`: Krone `arc(cx, by − 0.62 s, 0.34 s)`, Stamm `rect(cx −
0.08 s, by − 0.3 s, 0.16 s, 0.3 s)`; nach Füllung und Kontur ein Schrägstrich von `(cx − s/2, by)` nach `(cx + s/2, by − s)` in `DARK`.
  - `renderer.ts`: nach `drawStatusMarks(…)` (`:721`) `drawProgressRings(ctx, world, cam, range, tickClock(world, fx.timeMs).frac);`
    (zweiter Aufruf von `tickClock` im Frame ist ohne Wirkung, gleicher Zeitpunkt).
  - `daynight.ts:60`: Kommentar um `noService`, `noForest` ergänzen; Code unverändert.
- [ ] **Schritt 4: Grün.** `npx vitest run tests/render` · `npx tsc --noEmit` · `make check` · Testzählbefehl
      (`ring.test.ts` neu 3, `statusMarks.test.ts` +1). `grep -n "def\.cycle" src/render/ring.ts` → leer.
- [ ] **Schritt 5: Doku.** `docs/arc42.md` §5 Render-Tabelle: Zeile `ring.ts` (Fortschrittsring, `ringFraction`,
      Culling, `MAX_RINGS`) und `statusMarks.ts` (Pfeil, Kiste, Baumstumpf; fehlt bisher, H-R3); §6 Ebene 12 um
      „Statusmarken, Fortschrittsringe". `README.md` „Karte lesen": Ring über jedem Betrieb (läuft grün mit dem Zyklus,
      grau bei Stillstand); Marke durchgestrichener Baum = kein freier Wald in der Nähe.
- [ ] **Schritt 6: Commit und Push.**

```bash
git add src/render/ring.ts src/render/statusMarks.ts src/render/daynight.ts src/render/renderer.ts tests/render/ring.test.ts tests/render/statusMarks.test.ts docs/arc42.md README.md
git commit -m "feat: M11-R1 Fortschrittsring, Marke noForest (Spec 8)"
git -C .worktrees/m11-render push -u origin feat/m11-render
```

### Rot-Beleg

| AK        | Erwartete Meldung vor der Umsetzung                                        |
| --------- | -------------------------------------------------------------------------- |
| AK-RND-04 | `Failed to resolve import "../../src/render/ring"` (ganze Datei rot)       |
| AK-RND-03 | `expected undefined to be 'stump'` (`statusMarkOf('noForest')` ist `null`) |

Der Tageslicht-Teil (`isLit`) ist im Ist schon erfüllt; er steht im selben `it` wie die Marke und zählt mit deren Rot-Beleg.

### Risiken/Randfälle

- 60 Ringe plus 60 Marken je Frame: Frame-Budget mit `renderStats`/Perf-Sonde im QA-ART prüfen; sonst Ringe erst ab Zoom ≥ 0,75.
- Bei Tempo 4× springt der Ring kurz; `frac` stammt aus `tickClock` und ist geglättet.
- Mock von `defs/levels` nur in `ring.test.ts`; nach T09 gleich dem echten Eintrag.
