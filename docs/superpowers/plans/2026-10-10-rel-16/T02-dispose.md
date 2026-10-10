# T02 · `dispose` meldet die Inselmenü-Listener ab

Strang `ui` · Worktree `.worktrees/rel-16-ui` · Branch `fix/rel-16-ui` · Umsetzer `tech-ui-engineer` (sonnet, derselbe Start wie T01, per SendMessage fortgesetzt) · AK-R16-05, 06 · Grundlage R444 (1), Final-Review REL-15 (`docs/beobachtungen.md` „Ausgewertet 2026-10-10“, Kandidat REL-16 (2)) · Grösse S (≈ 12 Tools) · blocked-by T01 (gleiche Datei `app.ts`)

**Files:**

- Modify: `src/ui/hud.ts` (neuer Export neben `bindIslandMenu`, Z. ~335–343)
- Modify: `src/ui/app.ts` (`dispose`, Z. ~1294–1318; Import aus `./hud`)
- Test: `tests/ui/hud.test.ts` (Block „Inselmenü: Dokument-Listener (REL-15, R437 B1)“, Z. ~248–279)

## Ursache

`bindIslandMenu` meldet zwei `document`-Listener (`pointerdown`, `keydown`) mit einem `AbortController` je Kopfzeile an (`islandMenuAbort`, modul-privat, `hud.ts:336`). Ein **erneutes** Binden derselben Kopfzeile bricht den alten Satz ab. `dispose` (`app.ts`) leert `#hud`, bricht aber nichts ab. Startet das neue Spiel nicht (Startfehler, `startGame`-Stub, `app.ts` Z. ~222–235), wird nie neu gebunden: Die alten Listener halten Kopfzeile, Popover und alte Welt (`state`) fest und reagieren weiter auf Esc und Klicks.

## Regel

```ts
/** Meldet die Dokument-Listener des Inselmenüs dieser Kopfzeile ab (Ende eines Spiels, `dispose`). */
export function unbindIslandMenu(header: HTMLElement): void {
  islandMenuAbort.get(header)?.abort();
  islandMenuAbort.delete(header);
}
```

`dispose` ruft `unbindIslandMenu(hudEl)` **vor** `hudEl.replaceChildren()`. Sonst nichts an `bindIslandMenu` ändern.

## Schritte

- [ ] **Schritt 1: Tests zuerst (rot)** im bestehenden `describe` (gleiche Stub-Technik `vi.stubGlobal('document', …)`, Hilfen `el`, `box`, `header` aus dem vorhandenen Test in eine lokale Fabrik ziehen, wenn nötig):
  - `unbindIslandMenu bricht alle Dokument-Listener der Kopfzeile ab`: binden, `unbindIslandMenu(header)`, dann gilt für jeden registrierten Listener `opts.signal.aborted === true`.
  - `unbindIslandMenu ohne Binden und zweimal wirft nicht`: `expect(() => { unbindIslandMenu(header); unbindIslandMenu(header); }).not.toThrow()` auf einer frischen Kopfzeile, danach dasselbe nach einem Binden.
  - `nach unbind bindet ein neues Spiel wieder`: binden, abmelden, erneut binden → genau 2 aktive Listener (nicht abgebrochen).
  - `dispose meldet das Inselmenü ab (Quelltext, AK-R16-06)`: `readFileSync('src/ui/app.ts', 'utf8')`, den Block ab `const dispose = (): void => {` bis zum ersten `\n  };` herausschneiden; erwartet `unbindIslandMenu(hudEl)` darin und `indexOf('unbindIslandMenu(hudEl)') < indexOf('hudEl.replaceChildren()')`. Präzedenz: `tests/ui/panelView.test.ts` Z. ~379 liest Quelltext; `readFileSync` ist in `tests/ui/node-shim.d.ts` typisiert. Begründung im Testkommentar: `app.ts` braucht DOM und ist in Vitest (Node) nicht startbar.
  - Lauf: `npx vitest run tests/ui/hud.test.ts; echo EXIT=$?` → rot (Import `unbindIslandMenu` fehlt bzw. Quelltext-Test), Ausgabe im Bericht.

- [ ] **Schritt 2: Umsetzung** `hud.ts` (Export oben) und `app.ts` (Import, ein Aufruf in `dispose`).

- [ ] **Schritt 3: grün und Gegenproben**

```bash
npx vitest run tests/ui/hud.test.ts tests/ui/imports.test.ts tests/ui/hints.test.ts; echo EXIT=$?
npx tsc --noEmit; echo EXIT=$?
make lint; echo EXIT=$?
```

- [ ] **Schritt 4: Commit** `fix: dispose meldet die Inselmenü-Listener ab (REL-16)` mit Session-Trailer.

- [ ] **Schritt 5 (Controller, nach Review OK T01+T02): Testzeit-Abnahme R392** — dieselben Dateien wie im Index (T00) auf `main` und Branch unmittelbar nacheinander (`npx vitest related --run src/ui/hints.ts src/ui/app.ts src/ui/hud.ts`), Zeiten vorher/nachher im Bericht.

## Abnahme (Reviewer)

- AK-R16-05/06 mit Testnamen; Rot-Beleg zitiert.
- `islandMenuAbort` bleibt modul-privat; nur ein neuer Export; kein Verhalten von `bindIslandMenu` geändert (bestehender Test „ein erneutes Binden … meldet den alten Satz ab“ unverändert grün).
- Der Browser-Nachweis (zwei Neustarts → ein Listener-Satz) läuft in T04 über `tools/render-qa/seekarte.mjs --leck`.
