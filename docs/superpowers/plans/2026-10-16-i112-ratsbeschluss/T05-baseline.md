# T05 · Determinismus und Baseline

`tech-sim-engineer` · ≈ 20 Tools · AK 8, 11 · blocked-by: T04 · Test zuerst (rot vor Umsetzung)

Dateien: `tests/sim/council.test.ts`, `tests/sim/leverReads.test.ts` (Controller-Wächter), `tests/sim/balance.test.ts` (genau eine Zusicherung).
Kein `src/`-Diff.

## Umsetzung und Tests

1. «AK-8 Determinismus»: zwei Welten gleicher Seed, gleiche Aktionsfolge (Häuser setzen, `step` bis `council[2] === 'open'`, `decree(w, 2, 'B')`,
   weitere 300 `step`) → `serialize` beider Welten gleich; dazu ein Lauf mit `'A'` ≠ Lauf mit `'B'` (Wirkung belegt).
2. «AK-11 Wächter»: `leverReads.test.ts` ergänzt: `tests/sim/controller.ts` und `tests/sim/merchantsController.ts` enthalten weder `decree`
   noch einen Import aus `src/sim/council` (Textscan über eine Prüffunktion `importsDecree(text)`). Rot-Beleg: Testfall mit der
   Zeichenkette `import { decree } from '../../src/sim/council'` gegen die Prüffunktion, vor deren Umsetzung.
3. «AK-11 Endzustand»: in `balance.test.ts` am Ende des **bestehenden** Laufs eine Zusicherung: kein Eintrag von `world.council` ist `'A'`
   oder `'B'`; Sollwert aus dem Endzustand abgeleitet (R713 B-5): höchste Hausstufe `m` am Ende ⇒ `council[n] === 'open'` für `n ≤ m`, sonst `null`.
   Der Bericht nennt, welche Stufe `m` der Lauf erreicht. Rot-Beleg: vor T02 ist `council` `undefined`.
   Kein zweiter Controller-Lauf (Zeitbudget R392), keine Zahl der Baseline ändert sich (Diff zeigt nur die neue Zeile).

## Prüfschritte

Allgemeine Prüfungen laut Plan-Index · `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` (Zahlen gleich wie auf main) ·
`git diff main -- tests/sim/balance.test.ts` zeigt nur Zusätze · Strangende S: `make check; echo EXIT=$?` (Bash im Hintergrund, E-037).
Commit `test: Determinismus und Baseline Rat (I-112)`.
