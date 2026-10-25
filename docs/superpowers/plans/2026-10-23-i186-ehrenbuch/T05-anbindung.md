# T05 · Anbindung `app.ts`: Schleife, Partie-Merker, Meldung

Umsetzer `tech-ui-engineer` · ≈ 45 Tools · AK-EB-10 (Review-Kriterium), AK-EB-04 (Weg des Merkers) · blocked-by: T04 (OK), T06 (OK) · Strang A (`.worktrees/i186-ehrenbuch`) · Spec §2.1 Je Schritt, §2.3, §3, §4 Meldung; Plan P-1, P-2, P-3

**Erster Schritt:** `git merge feat/i186-buch` (bringt T03 und T06), kein Rebase.

## Dateien

- ändern: `src/ui/app.ts` (nur `launch`: Tracker und `run` nach der Welt; `while`-Schleife; nach der Schleife Eintrag und Meldung; `onChoice`-Zweig `new` der Startkarte; `menuActions.openHonors` auf das aktuelle `run`), `src/ui/honorTracker.ts` (neu: `launchRun`), `tests/ui/honorTracker.test.ts` (Fälle am Ende)
- nicht ändern: `src/sim/`, `src/ui/storage.ts`, `honorBook.ts`, `honorView.ts` (Fehler dort: an den Controller melden)

## Verhalten

1. `launchRun(o: { loaded: boolean; intro: boolean }, stored: HonorRun | null, seed: number, unlockMode: 'stepwise' | 'all'): { run: HonorRun | null; write: boolean }` (rein): Menü-«Neue Insel» (`!loaded && !intro`) → `{ run: { seed, unlockMode }, write: true }`; Laden oder Seitenstart (`loaded || intro`) → `{ run: stored, write: false }`.
2. In `launch` direkt nach Welt und `honorBook` (T06): `const tracker = createHonorTracker(world)` (P-1, deckt Seitenstart, Laden und «Neue Insel» ab); `let run` aus `launchRun(..., honorBook.data().run, world.seed, settings.unlockMode)`; bei `write` `honorBook.setRun(run)`.
3. Startkarte, `onChoice` Zweig `new` (P-2): `run = { seed: world.seed, unlockMode: settings.unlockMode }`, `honorBook.setRun(run)`, `tracker.reset(world)`. Der Zweig `load` bleibt (`loadSlotPaused` → `restart` → neuer Tracker).
4. Schleife (N2, P-3): in `while (acc >= TICK_MS && ticks < MAX_TICKS_PER_FRAME)` **direkt nach** `reports.push(step(world))`: `for (const id of tracker.observe(world, run)) honorHits.push({ id, seed: world.seed, tick: world.tick, crisis: world.crisisLevel })`. `honorHits` ist ein je Frame neues Array.
5. Nach der Schleife, nur wenn `honorHits.length > 0`: `const added = honorBook.record(honorHits, new Date().toISOString())`; bei `added.length > 0` `showMessage(honorMessage(added, honorBook.status() === 'ok' || honorBook.status() === 'damaged'), 'info')` (Art wie das Zielbanner, `rg "goalBanners" src/ui/app.ts`). `damaged` gilt nach dem ersten Schreiben als gespeichert.
6. `menuActions.openHonors` nutzt das aktuelle `run` (nicht mehr `honorBook.data().run`).

## Testfälle (rot zuerst), `tests/ui/honorTracker.test.ts` (Ende)

- `launchRun`: Menü-«Neue Insel» → neuer Merker mit `write: true`; Laden mit gespeichertem Merker → derselbe, `write: false`; Seitenstart (`intro`) → gespeicherter, `write: false`; Seitenstart ohne gespeicherten → `null`.
- Kein eigener Test für die Verdrahtung in `app.ts`; Beleg sind Review (unten) und T07.

## Review-Kriterien für `qa-code-reviewer` (wörtlich ins Review-Briefing)

- AK-EB-10: `tracker.observe` steht in `app.ts` **innerhalb** der `while`-Schleife direkt nach `step(world)`, nicht nach der Schleife.
- P-1: genau eine `createHonorTracker(world)` in `launch`, nach der Welt; kein zweiter Tracker, kein Tracker in der Sim.
- P-2: Seitenstart schreibt den Merker **nicht** vor der Wahl; `onChoice` `new` schreibt ihn.
- `new Date()` nur hier in `app.ts`; `src/sim/` ohne Diff ausser T01-Dateien; keine `innerHTML`-Ausgabe.

## Prüfungen (Teilbeleg)

- `npx vitest run tests/ui/honorTracker.test.ts tests/ui/honorView.test.ts tests/ui/honorBook.test.ts tests/sim/honors.test.ts tests/ui/menu.test.ts tests/ui/startCard.test.ts; echo EXIT=$?` (rot vorher, grün nachher)
- `npx tsc --noEmit; echo EXIT=$?` · `make lint; echo EXIT=$?` · `make zeittests; echo EXIT=$?` · `make conflicts; echo EXIT=$?`
- Kurzer Rauchtest im Dev-Server (`npm run dev`): Seite lädt, Menü zeigt «Ehrenbuch: 0 von 9», keine Konsolenfehler. Der vollständige Check ist T07.

Commit: `feat: Ehrenbuch je Schritt eintragen und melden (I-186)`
