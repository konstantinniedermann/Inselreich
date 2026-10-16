# T03 · `pauseOverlay.ts` (reiner Helfer plus Anzeige-Funktion, I-097)

Umsetzer `tech-ui-engineer` · ≈ 30 Tools · I097 AK-1, 2, 3, 4, 5a · blocked-by: T02

## Dateien

- neu: `src/ui/pauseOverlay.ts`, `tests/ui/pauseOverlay.test.ts` (Muster `spaceTap.ts`, `tests/ui/fakeDom` mit `FakeElement`)
- nicht ändern: `hotkeys.ts`, `hud.ts` (`PAUSE_TOOLTIP`), `app.ts` (kommt in T04)

## Inhalt

```ts
export const PAUSE_LABEL = 'Pause';
export const PAUSE_HINT = 'P oder 1× setzt fort';
export function pauseOverlayView(speed: 0 | 1 | 2 | 4, modalOpen: boolean): { visible: boolean }; // visible = speed === 0 && !modalOpen
/** Schreibt Sichtbarkeit und Text nur bei Änderung (Muster `chip.title !== tip`); ruft `isModalOpen` nicht selbst auf. */
export function applyPauseOverlay(el: HTMLElement, speed: 0 | 1 | 2 | 4, modalOpen: boolean): void;
```

`applyPauseOverlay` setzt `el.hidden` nur, wenn `el.hidden !== !visible`; der Text (`PAUSE_LABEL` in einem Kind `.pause-overlay__label`, `PAUSE_HINT` in `.pause-overlay__hint`) wird beim ersten Aufruf gesetzt (Kinder per `dom.ts` `setField`-Muster oder `textContent`, nur bei Änderung). Kein Zugriff auf `document` ausserhalb des übergebenen Elements; kein zweiter Pause-Merker.

## Testfälle (rot zuerst)

- **AK-1** `pauseOverlayView(0,false)` sichtbar; `(1|2|4,false)` verborgen.
- **AK-2** `(0,true)` verborgen; `(0,false)` danach wieder sichtbar.
- **AK-3** `afterPause(1,1).speed === 0` und `afterPause(0,2).speed === 2`; `pauseOverlayView` über diese Tempi: sichtbar bzw. verborgen; Knopf ⏸ und Taste teilen den Weg (`setSpeed` in `app.ts`, im Review per `grep` belegt).
- **AK-4** Tempo-Folge 0 → 1 → 2 → 4 → 0 mit `withSpeed`/`afterPause`: Sichtbarkeit nur bei 0; 4 → 0 → `afterPause` ergibt 4; bestehende `hotkeys.test.ts` bleibt grün.
- **AK-5a** `applyPauseOverlay` auf `FakeElement`: `hidden` korrekt; Text enthält «Pause»; zweiter Aufruf mit gleichem Zustand schreibt nicht (Schreibzähler am Fake); Wechsel 0 → 1 → 0 flackerfrei.

## Prüfschritte / Task-Review

Reviewer: Modul DOM-frei bis auf das übergebene Element; `tsc`, `make lint` Exit 0.
