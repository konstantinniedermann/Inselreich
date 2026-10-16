# T04 · Einhängen: Markup, CSS, `refresh()` (I-097)

Umsetzer `tech-ui-engineer` · ≈ 35 Tools · I097 AK-5b, 11a · blocked-by: T03 (und UI-D gemergt)

## Dateien

- ändern: `index.html` (ein Element in `<main id="game">`), `src/style.css` (Block am **Dateiende**), `src/ui/app.ts` (zwei Zeilen), `tests/ui/pauseOverlay.test.ts` (Markup-/Stil-Fälle)

## Verdrahtung

1. `index.html`: nach `<canvas id="canvas"></canvas>` `<div class="pause-overlay" hidden role="status"><div class="pause-overlay__banner"><span class="pause-overlay__label"></span><span class="pause-overlay__hint"></span></div></div>`. Kein `tabindex`.
2. `app.ts`: `const pauseEl = need<HTMLElement>(root, '.pause-overlay')` dort, wo `gameEl` (`#game`) im `launch`-Kopf gelesen wird; in `refresh()` als erste Zeile `applyPauseOverlay(pauseEl, state.speed, isModalOpen())` (`isModalOpen` ist schon importiert). Zeilen nach dem UI-D-Merge per grep suchen (siehe T00). Keine weiteren Stellen (O-2).
3. `style.css` am Dateiende, Block `/* Pause-Overlay (I-097) */`: `.pause-overlay { position: absolute; inset: 0; pointer-events: none; z-index: 5; box-shadow: inset 0 0 0 4px var(--gold), inset 0 0 56px 8px color-mix(in srgb, var(--bg) 55%, transparent); }` (`z-index` 5: über Canvas, unter Toasts 10 und Modalen 20+; vorhandene Werte Z. ≈ 147, 577 gegenprüfen), `.pause-overlay[hidden] { display: none; }`, Banner `position: absolute; top: 8px; left: 50%; transform: translateX(-50%); white-space: nowrap; pointer-events: none;` mit `var(--wood)`, `var(--parchment)`, 1 px `var(--gold)`; keine Animation. Kopfzeile und Bauleiste liegen ausserhalb `#game`.

## Testfälle (rot zuerst)

- **AK-5b** `readFileSync('src/style.css')` enthält im Block `.pause-overlay` die Zeile `pointer-events: none` und kein `animation`; `readFileSync('index.html')` enthält `class="pause-overlay"` mit `role="status"` und `hidden`, ohne `tabindex` im Element (Muster `tests/ui/contrast.test.ts`).
- **AK-11a** `git diff main -- src/sim tests/sim` nur `orders.ts`/`orders.test.ts` aus T01; Spielstand ohne neues Feld; `make check` grün.
- Verdrahtung selbst ohne grep-Test (brüchig); Abnahme über T05.

## Prüfschritte / Task-Review

Reviewer: genau ein Aufruf von `applyPauseOverlay` in `app.ts`; Kopfzeilen-Pausenknopf unverändert; Block nur am Dateiende; `tsc`, `make lint`, `make zeittests`, `make conflicts` Exit 0.
