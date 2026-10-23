# T03 · Kielwasser: Renderer-Anbindung (≈ 4 Zeilen)

Umsetzer `art-rendering-engineer` (gleiche Instanz, `SendMessage`) · ≈ 35 Tools · AK W9, W12 · blocked-by: T02 **und ORT-A-Merge nach main**; vor Start im Strang-A-Worktree `git merge main` (**kein Rebase**, R830)

## Dateien

- ändern: `src/render/renderer.ts` (ein Import, höchstens vier Aufrufzeilen), `tests/render/renderer*.test.ts` (Datei mit Schiffs-Tests per `rg "drawShip|HULL" tests/render` finden)
- nicht ändern: Schattenblock (ORT-A, Z. ≈ 749–770), `drawWalker`/`drawErrandLoad` (LEBEN-STRASSE)

## Verhalten

1. Block neu lesen (`rg -n "drawShip|drawSeaShip|moving.push" src/render/renderer.ts`); Konflikt-Notiz des Index lesen und `git diff main...feat/leben-strasse -- src/render/renderer.ts` ansehen.
2. Je `drawShip`-Stelle (Insel-Durchgang ≈ Z. 807–808, offene See `drawSeaShip` ≈ Z. 964–974) unmittelbar **davor** `drawWake(...)` für Flottenschiffe (`to !== null`, nicht Heimatschiff id 0); höchstens `WAKE_MAX` Spuren je Frame (Zähler lokal). Wetter-/`reduce`-Zustand aus vorhandenen Renderer-Grössen durchreichen.
3. Fällt im Browser-Check (T04) auf, dass die Spur ein vorderes Gebäude schneidet, wandert der Aufruf in den Bodendurchgang (Designfrage 2); sonst nicht.

## Testfälle (rot zuerst)

- **W9** Renderer-Test mit Fake-Kontext und 4 fahrenden Schiffen: alle Spurstriche eines Schiffs vor dessen Rumpf-`fill`; höchstens `WAKE_MAX` Spuren; liegendes Schiff und id 0 ohne Striche.
- **W12** `tools/render-qa/perf.mjs` (Aufruf aus `tools/render-qa/README.md` entnehmen, Messlast-Regeln R380 beachten): 4 Schiffe, Zoom 1, Median der Frame-Mehrkosten gegen main ≤ 0,2 ms; Zahl im Bericht. Nicht messbar (Sperre belegt): `waiting`, nicht überspringen.

## Prüfschritte / Task-Review

Gezielte Tests (Exit 0), `tsc`, eslint/prettier. Danach Final-Review `qa-code-reviewer` **opus** über den ganzen Strang-A-Branch: Renderer-Diff höchstens Import plus Aufrufe, keine Ringlogik/Schatten verändert, Sim-Diff leer.
