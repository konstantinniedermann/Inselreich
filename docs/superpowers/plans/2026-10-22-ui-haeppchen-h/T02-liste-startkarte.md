# T02 · P1 Ladeliste, Startkarte, «Neue Insel», `app.ts` (I-147)

Umsetzer `tech-ui-engineer` (Fortsetzung der T01-Instanz per `SendMessage` erlaubt) · ≈ 45 Tools · AK H4, H7, H9 · blocked-by: T01 · Spec: Teil P1 (Regeln 5 bis 7)

## Dateien

- ändern: `src/ui/menu.ts` (`slotLabel`, Liste, Reihenfolge), `src/ui/startCard.ts` (`startChoices`), `src/ui/app.ts` (Import, `newIslandPrompt`-Argument, Typ von `loadSlotPaused`; **eigener Commit**), `tests/ui/menu.test.ts`, `tests/ui/startCard.test.ts`
- nicht ändern: `src/ui/storage.ts` (T01), `src/style.css`, `src/sim/`

## Verhalten

1. Alle Vergleiche `slot === 'auto'` in `src/ui/` per `rg "'auto'" src/ui` finden und umstellen (Liste im Bericht). «Neuester» = `newestAuto(storage)`; der andere gültige Platz = «Davor».
2. `slotLabel`: neuester Platz «Autosave — Spielzeit m:ss», anderer «Autosave davor — Spielzeit m:ss», manuell unverändert; Reihenfolge Autosave, Autosave davor, Gespeichert. Ein einziger Autosave heisst «Autosave».
3. `startChoices`: «Fortsetzen — Autosave (Spielzeit …)» mit `slot` des neuesten Platzes; bei zwei gültigen Plätzen Nebenwahl `{ kind: 'load', slot: andere, label: 'Davor laden — Autosave (Spielzeit …)', primary: false }` zwischen «Fortsetzen» und «Gespeichertes Spiel laden»; `primary`-Logik für `manual` unverändert. Die Signatur darf um den Zeiger-Platz erweitert werden (z. B. `newest` im `SaveInfo` oder Parameter), bevorzugt reine Daten statt `StorageLike` in `startCard.ts`.
4. `newIslandPrompt(hasAuto)`: `hasAuto` = irgendein Autosave-Platz vorhanden (`auto` oder `auto2`).
5. `app.ts`: nur Import/Typ und das Argument; Autosave-Takt (`AUTOSAVE_MS`) und `onPageHide` nutzen die T01-Funktionen ohne Umbau. Eigener Commit, damit der Merge mit UI-G, Stadtplanung und ORT-A klein bleibt.

## Testfälle (rot zuerst)

- **H4** `slotLabel`/Liste: Zeiten über `formatGameTime`; mit einem Autosave nur «Autosave — …».
- **H7** `startChoices`: Fortsetzen-Spielzeit und `slot` des neuesten; Nebenwahl nur mit zwei Plätzen, `primary: false`; `manual` primär wie bisher.
- **H9** `newIslandPrompt` fragt mit «Autosave» auch, wenn nur `auto2` besteht.

## Prüfschritte / Task-Review

Gezielte Tests laut index.md, `tsc`, eslint/prettier. Reviewer: keine verbliebene `=== 'auto'`-Stelle; `app.ts`-Diff in eigenem Commit und klein; Karte «Wo war ich?» (UI-G) lädt «Davor» über `loadSlotPaused` ohne Zusatzcode.
