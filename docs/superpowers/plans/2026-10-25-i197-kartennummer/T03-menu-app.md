# T03 Menü-Feld, Prompt, Start mit Nummer

Persona `tech-ui-engineer` · Tools ≈ 40 · AK-K4, AK-K12 (Verdrahtung), AK-K13 (Struktur) · blocked-by T02, Inselproben-UI.

Dateien: `src/ui/menu.ts`, `src/ui/app.ts`, `src/style.css` (nur falls das Hinweis-Element eine Klasse braucht), `tests/ui/menu.test.ts`. Nicht anfassen: `src/sim/`, `startCard.ts` (Aufruf `newIslandPrompt(true)` bleibt gültig, zweiter Parameter optional), Inselproben-Knöpfe.

**Rot zuerst** (`npx vitest run tests/ui/menu.test.ts; echo EXIT=$?`, Exit ≠ 0): neuer Test in `menu.test.ts`.

1. `newIslandPrompt(hasAutosave, seed?: number)`: ohne Nummer beide heutigen Texte unverändert (bestehende Tests bleiben grün); mit Nummer beginnt der Text mit «Neue Insel (Karte 4711) beginnen?» und behält den Rest des jeweiligen Textes. **AK-K4** als Test (`toContain('Karte 4711')`, Rest-Text bleibt).
2. `MenuActions.newIsland(level, unlockMode, seed?: number)`; Testdoubles in `menu.test.ts` mit `newIsland: () => {}` bleiben gültig.
3. `menu.ts` Neue-Insel-Block: `<input type="text" inputmode="numeric" placeholder="zufällig">` mit Label «Karte (Nummer, leer = Zufall): » (`aria-label`), im Block neben «Krisen» und «Freischaltung»; immer leer beim Öffnen, nie gespeichert; darunter ein `<p role="alert">` (leer/hidden, bis Fehler). Klick «Neue Insel» und Enter im Feld: `parseSeedInput(input.value)`; ungültig → `reason` ins Alert-Element, **keine** Bestätigung, Fokus ins Feld; gültig → Alert leeren, `renderConfirm(newRow, newIslandPrompt(hasAutosave(...), seed ?? undefined), () => a.newIsland(level, unlock, seed ?? undefined), …)`. `null` (leer) wird als `undefined` weitergereicht.
4. `app.ts`: `StartOptions.seed?: number`; in `launch` `createWorld(pickSeed(opts?.seed, Date.now()), {…})` (nur im `loaded ?? …`-Zweig, **AK-K13 Struktur:** der Ladepfad `restart(root, r.world, {speed, camera})` übergibt nie `seed`, `loaded` gewinnt immer); `newIsland: (level, unlock, seed) => { …; restart(root, undefined, seed === undefined ? undefined : { seed }); }`. Prüfen, dass Inselproben dort nicht schon `opts` setzt; sonst zusammenführen.
5. **AK-K12 Verdrahtung:** nach dem Erzeugen in `launch` (nur wenn `loaded` fehlt und `opts?.seed !== undefined`): `const n = seedNote(opts.seed, world.seed); if (n) showMessage(n, 'info');` (Meldungsfläche ist in `startGame` schon gebunden).
6. Nicht: Speichern der Nummer, Würfelknopf, Feld auf der Startkarte.

Teilbeleg am Ende: `npx vitest run tests/ui/menu.test.ts tests/ui/seedInput.test.ts tests/sim/mapgenSeed.test.ts`, `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts` (je `; echo EXIT=$?`), `git diff main -- src/sim` leer, `SAVE_VERSION` unberührt, `tests/sim/balance.test.ts` grün.
