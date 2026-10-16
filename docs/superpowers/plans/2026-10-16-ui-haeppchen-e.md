# Plan UI-HAEPPCHEN-E · I-097 «Pause sichtbar» + I-102 «Auftragsvorschau» (Stufe leicht)

Owner `lead-tech` · Quellen: Kurzdesign I-097 `design/i097` @ `70efccc5` (R665, 11 AK), Kurzdesign I-102 `design/i102` @ `ab8ec7a0` (R664, V2, 9 AK; beide per Merge auf diesem Branch), Plan UI-HAEPPCHEN-D `plan/ui-haeppchen-d` @ `3eb97a31` (R662). Plan gegen main `c1343503`, ohne Testläufe (R464).
Spielerwirkung: Der Spieler erkennt die Pause sofort (getönter Kartenrand, Banner «Pause») und liest «Nächster Auftrag in 0:20 · voraussichtlich Rum», um das Lager vorzuplanen.
**Kein Save** (`SAVE_VERSION`, `types.ts` ohne Diff), **kein Spielwert** (`defs/` ohne Diff, `balance.test.ts` unberührt), keine Abhängigkeit (ADR-001), kein ADR. Einzige Sim-Änderung: `previewOrder` in `src/sim/orders.ts`, reine Lesefunktion. **Umsetzung erst nach Merge von UI-HAEPPCHEN-D.**

## Entscheide des Plans

- **O-1 (Rand):** `box-shadow: inset 0 0 0 4px var(--gold), inset 0 0 56px 8px color-mix(in srgb, var(--bg) 55%, transparent)`; Banner: `var(--wood)` Grund, `var(--parchment)` Text, 1 px `var(--gold)`. Nur vorhandene Variablen, kein neuer Farbwert. Fallback laut Kurzdesign: Banner streichen, Rand behalten.
- **O-2 (Einhängen): `syncPauseOverlay` in `refresh()`**, nicht an `setSpeed`/`restart`/Modalen. Gründe: `isModalOpen()` hat keinen Änderungs-Hook (`modal.ts`, Stapel), Einhängen an jedem Öffnen/Schliessen wären ≥ 10 Stellen; `restart()` baut `app` neu auf und ruft `refresh()` (Laden: sofort sichtbar); `setSpeed` ist ein Pfad für Knopf/P/Leertaste/Tempo (`app.ts` Z. ≈ 1024), der Zustand wird also eine Frame-Gruppe später (`HUD_EVERY_FRAMES`, ≈ 100 ms) angezeigt, im Browser-Check zu bestätigen. Eine Einhängestelle, schreibt nur bei Änderung. Umkehrbar: ein Aufruf in `setSpeed` ergänzbar, falls die Latenz auffällt.
- **Markup:** `<div class="pause-overlay" hidden role="status">` fest in `index.html` innerhalb `<main id="game">` (hinter `<canvas>`, kein `tabindex`); Text kommt aus `PAUSE_LABEL`/`PAUSE_HINT` (`pauseOverlay.ts`) per `applyPauseOverlay`. `PAUSE_HINT` = «P oder 1× setzt fort» (Wording von Lade-Toast, `hud.ts` `PAUSE_TOOLTIP` bleibt unberührt, keine Import-Kopplung).
- **I-102 Zeitformat:** `formatGameTime` (unter 1 min «40 s»); Test-Erwartungen nie als Literal (R662 Auflage 3).
- **I-102 Texte:** Zweig «kein Auftrag»: `Nächster Auftrag in ${t} · voraussichtlich ${Gut}`; Zweig Normalauftrag: bestehender Text + ` · danach voraussichtlich ${Gut}`. Fernauftrag (`o.island !== undefined`), Vertrag, Angebot: unverändert.

## Einhängepunkte gegen UI-D

| Datei             | UI-D ändert                                                                                                                          | E ändert                                                                                                                                                                               | Konflikt                                                                                         |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `src/ui/app.ts`   | `crisisLogVisible`, `autoPrev` (≈ Z. 693), Frame-Block nach `farLogged` (≈ 1622), Handler `accept`/`declineContract`/`deliver`/Laden | `refresh()` (≈ Z. 905): ein Aufruf `syncPauseOverlay(pauseEl, state.speed)` am Anfang, ein `need<HTMLElement>(root, '.pause-overlay')` neben `gameEl` (≈ Z. 284 bzw. im `launch`-Kopf) | keine überlappenden Zeilen; nach UI-D-Merge Zeilennummern neu suchen (`grep -n "const refresh"`) |
| `src/style.css`   | `.reach-*` (T07) und Log-Regeln                                                                                                      | abgeschlossener Block `/* Pause-Overlay (I-097) */` **am Dateiende**                                                                                                                   | beide hängen an; Merge-Konflikt am Dateiende trivial, `make conflicts` prüft Marker              |
| `src/ui/order.ts` | nicht berührt (R661)                                                                                                                 | `orderCardText`, Import `previewOrder`                                                                                                                                                 | keine                                                                                            |
| `src/ui/hud.ts`   | `chipView`, `stockTooltip`, Chip-Schleife                                                                                            | nicht berührt (`PAUSE_TOOLTIP` bleibt)                                                                                                                                                 | keine                                                                                            |
| `index.html`      | nicht berührt                                                                                                                        | ein `<div>`                                                                                                                                                                            | keine                                                                                            |

Modul-Rückhalt: `previewOrder` liegt in `orders.ts`, `pauseOverlay.ts` ist DOM-frei bis auf `applyPauseOverlay(el, visible)`; die Entscheidung `visible` bleibt in `pauseOverlayView`.

## Dateimatrix (Ownership)

| Datei                                                                  | T01 | T02 | T03 | T04 | T06 |
| ---------------------------------------------------------------------- | --- | --- | --- | --- | --- |
| `src/sim/orders.ts`, `tests/sim/orders.test.ts`                        | ja  |     |     |     |     |
| `src/ui/order.ts`, `tests/ui/order.test.ts`                            |     | ja  |     |     |     |
| `src/ui/pauseOverlay.ts` (neu), `tests/ui/pauseOverlay.test.ts` (neu)  |     |     | ja  |     |     |
| `index.html`, `src/style.css`, `src/ui/app.ts`                         |     |     |     | ja  |     |
| `README.md`, `docs/arc42.md`, `docs/ideen.md`, `docs/beobachtungen.md` |     |     |     |     | ja  |

Nicht angefasst: `src/sim/types.ts`, `src/sim/defs/`, `src/render/`, `src/audio/`, `docs/studio/`, `docs/superpowers/specs/`. Ein Strang, Worktree `.worktrees/ui-haeppchen-e-impl` ab `plan/ui-haeppchen-e` (`git worktree add … -b feat/ui-haeppchen-e`), main (mit UI-D) per Merge holen. Seriell, weil `app.ts`/`style.css` einzige Berührung ist und Parallelität 1 gilt.

## Tasks

| Task | Titel                                           | Datei                | AK-IDs                                    | Strang | blocked-by   | Modell | Tools |
| ---- | ----------------------------------------------- | -------------------- | ----------------------------------------- | ------ | ------------ | ------ | ----- |
| T00  | Zeitmessung vorher (Controller, R392)           | `T00-zeitmessung.md` | –                                         | 1      | UI-D gemergt | sonnet | 8     |
| T01  | `previewOrder` (Sim-Lesefunktion)               | `T01-preview.md`     | I102 AK-1 bis 5, 7a, 9                    | 1      | T00          | sonnet | 40    |
| T02  | Auftragskarte zeigt Vorschau                    | `T02-karte.md`       | I102 AK-6, 7b                             | 1      | T01          | sonnet | 30    |
| T03  | `pauseOverlay.ts` (Helfer, Anzeige)             | `T03-pausehelfer.md` | I097 AK-1 bis 4, 5a                       | 1      | T02          | sonnet | 30    |
| T04  | Einhängen: HTML, CSS, `refresh()`               | `T04-einhaengen.md`  | I097 AK-5b, 11a                           | 1      | T03          | sonnet | 35    |
| T05  | Browser-Check beider Häppchen (`qa-playtester`) | `T05-playtest.md`    | I097 AK-6 bis 10; I102 AK-8; R668-1 bis 3 | 1      | T04          | sonnet | 30    |
| T06  | Doku (D1, E-017), Zeitmessung nachher           | `T06-doku.md`        | I097 AK-11b; I102 AK-9b                   | 1      | T05          | sonnet | 30    |

Umsetzer: T01 `tech-sim-engineer`, T02–T04, T06 `tech-ui-engineer`; je Task `qa-code-reviewer` (sonnet); T05 `qa-playtester` (1280×720, Screenshots `.studio/qa/ui-haeppchen-e/`); letzter Review über die Branch `model: opus` (Final-Review). Fix-Runden per SendMessage. Summe ≈ 200 Tools Umsetzer.

## AK-Zuordnung (jede AK hat einen Testfall oder einen benannten Browser-/Diff-Beleg)

| AK               | Task                                                                                              | Beleg                                                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I097 AK-1, 2     | T03                                                                                               | `pauseOverlayView`-Tabelle in `pauseOverlay.test.ts`                                                                                                                              |
| I097 AK-3, 4     | T03                                                                                               | `afterPause`/`withSpeed` + `pauseOverlayView` über Tempo-Folge                                                                                                                    |
| I097 AK-5        | T03 + T04                                                                                         | T03: `applyPauseOverlay` auf FakeElement (Text, `hidden`, nur bei Änderung); T04: Stil-/Markup-Test mit `readFileSync` (`pointer-events: none`, `role="status"`, kein `tabindex`) |
| I097 AK-6 bis 10 | T05                                                                                               | Browser-Check                                                                                                                                                                     |
| I097 AK-11       | T04 (`git diff`), T06 (README-Satz)                                                               | Diff leer für `src/sim`, `make check`                                                                                                                                             |
| I102 AK-1 bis 5  | T01                                                                                               | `tests/sim/orders.test.ts`                                                                                                                                                        |
| I102 AK-6        | T02                                                                                               | `tests/ui/order.test.ts`                                                                                                                                                          |
| I102 AK-7        | T01 (7a Weltzustand bitgleich, `balance.test.ts` grün) + T02 (7b gleicher Text bei gleicher Welt) | Vitest                                                                                                                                                                            |
| I102 AK-8        | T05                                                                                               | Browser-Check                                                                                                                                                                     |
| I102 AK-9        | T01/T06                                                                                           | `git diff main -- src/sim/types.ts src/sim/defs` leer, `make check`                                                                                                               |

## Zeitmessung berührter Tests (R392)

**T00** (Controller, nach UI-D-Merge, Load ≤ 4 per `uptime`, Testlock R380): `npx vitest related --run src/sim/orders.ts src/ui/order.ts src/ui/app.ts --reporter=json --outputFile=.studio/qa/ui-haeppchen-e/zeit-vor.json; echo EXIT=$?`; in T06 derselbe Befehl nach `zeit-nach.json` plus Vergleichstabelle (Datei, Dauer vor/nach, Differenz). Abnahme, wenn kein berührter Testfall um mehr als 25 % und kein Lauf über 50 % des Timeouts liegt (R593), sonst Beobachtung oder Fix-Task. `orders.test.ts` ist ein bekannt grösserer Sim-Test; neue Fälle laufen nur kurze Tickstrecken (`runTo`).

## Pflichtläufe

**Je Task mit `.ts`-Änderung (T01–T04):** `npx tsc --noEmit; echo EXIT=$?` und `make lint; echo EXIT=$?`, Exit 0 im Task-Bericht. **Vor «bereit»:** `make zeittests; echo EXIT=$?` und `make conflicts; echo EXIT=$?`. **Rot-Beleg:** je neuem Testfall die rote Ausgabe vor der Umsetzung im Task-Bericht (R395, R410); neue Tests lokal × 3 grün. **Am Ende:** `make check`, `make zeitreserve-gate`, `make docs-check` (je `; echo EXIT=$?`), `git diff main -- src/sim/types.ts src/sim/defs tests/sim/balance.test.ts` leer, `git diff main -- src/sim` nur `orders.ts`.

## Budgetantrag (Umsetzung)

5 Umsetzer-Pakete (T01–T04, T06) × 2 + 1 Playtest + 1 Final-Review = 12, + 30 % Puffer = 15,6 → **16 Starts**, Parallelität 1. T00 macht der Controller selbst. Beide Reviews je Task sind in den × 2 enthalten.

## Risiken

- `refresh()`-Latenz (≈ 100 ms) lässt das Overlay beim Pausieren leicht verzögert erscheinen; Browser-Check AK-6 bestätigt, sonst Aufruf zusätzlich in `setSpeed`.
- Spieler liest «voraussichtlich» als Zusage: Text trägt das Wort; Stufenaufstieg ändert Gut (AK-3 testet es).
- Konflikt am Ende von `style.css` mit UI-D: trivial, `make conflicts`.
