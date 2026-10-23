# T01 · Kielwasser: `wakeTrail` (Punkte, Form, Deckkraft)

Umsetzer `art-rendering-engineer` · ≈ 40 Tools · AK W1 bis W7 · blocked-by: – (sofort; Worktree `.worktrees/leben-see-kielwasser`, `git merge main` vor Start) · Spec: Teil P1 «Gestaltung»

## Dateien

- neu: `src/render/wake.ts`, `tests/render/wake.test.ts`
- nicht ändern: `src/sim/`, `shipLane.ts`, `ship.ts`, `limits.ts`, `renderer.ts` (T03)

## Verhalten

1. Konstanten oben in `wake.ts`: `WAKE_LEN = 3`, `WAKE_MAX = SHIP_MAX` (aus `src/sim/defs/sea.ts`), Versatz `0,06 + 0,09·d`, Deckkraft-Stufen `[0,40, 0,28, 0,16, 0,06]`, Sturm-Faktoren ×1,5 / ×1,15 (Deckel 0,5), `reduce`: Länge 1,5, Versatz `0,06 + 0,05·d`, Ausblendfenster 20 Ticks.
2. `wakeTrail(world, ship, opts: { storm: boolean; reduce: boolean })` ohne Zeitparameter: `to === null` → leere Spur. Sonst Punkte `shipPose(world, { ...ship, left: ship.left + k*5 })`, `k = 1..8`; erster Punkt = `shipPose(world, ship)`; nach Bogenlänge auf `WAKE_LEN` (bzw. 1,5) kürzen; ist das Schiff weniger gefahren, endet die Spur dort (Punkte klemmen am Start der Lane).
3. Reine Hilfen: `wakeSides(trail, opts)` → je Seite 4 Abschnitte mit Seitenversatz zur lokalen Fahrtrichtung (Kachelraum), `wakeAlpha(section, left, opts)` mit Ausblendfaktor `min(1, left/20)` in den letzten 20 Ticks.
4. `wakeTrail` schreibt nie in die Welt, keine Zufallszahl, kein `Date`/`performance`.

## Testfälle (rot zuerst; Fixture: handgebaute Welt mit Lane, Vorbild `tests/render/shipLane.test.ts`)

- **W1** 2 bis 9 Punkte, Punkt 0 = `shipPose`, alle auf der Polylinie (< 1e-6), Bogenlänge genau 3; kurz gefahren → gefahrene Strecke. **W2** `to === null` leer. **W3** Fahrlinie mit Knick: mindestens ein Punkt auf dem ersten Abschnitt. **W4** Fahrzeit-Variante: Länge 3 bei 10 und (falls Fixture vorhanden, P-5 des Index) bei 8 Ticks. **W5** Versatz `d = 0` → 0,06, `d = 3` → 0,33 (±1e-9), Sturm ×1,5, `reduce` Länge 1,5, Versatz `0,06 + 0,05·d`, Sturm bei `reduce` ohne Verbreiterung. **W6** Deckkraft `0,40/0,28/0,16/0,06`, Sturm ×1,15 Deckel 0,5, `left = 20` → Faktor 1, `left = 1` → 0,05. **W7** `JSON.stringify(world)` vor/nach gleich; zwei Aufrufe bitgleich; `wakeTrail.length` (Arität) = 3 oder Typ ohne Zeit.

## Prüfschritte / Task-Review

Gezielter Test (Exit 0), `tsc`, eslint/prettier. Reviewer: nur `shipPose` als Quelle, Konstanten zentral, keine Uhr.
