# T02 — Wortlaute Baumenü, Guide, Denkmal, Abriss (AK-UT-05 bis -08)

Dateien: `src/ui/buildMenu.ts`, `src/ui/guide.ts`, `src/ui/monumentView.ts`, `src/ui/inspect.ts`, `tests/ui/buildMenu.test.ts`, `guide.test.ts`, `monumentView.test.ts`, `inspect.test.ts`.

## Tests zuerst (Rot-Beleg)

- [ ] AK-UT-05 `buildMenu.test.ts`: Schleife über **alle** `BUILDING_DEFS` mit `maxCount?.n === 1` (keine Namensliste): Tooltip-Zeilen enthalten `Nur ein ${def.name} je Insel`; Defs mit `n > 1` enthalten keine «Nur ein»-Zeile; «Höchstens» kommt nicht mehr vor.
- [ ] AK-UT-06 `guide.test.ts`: `wonMerchants && wonSpice`: `monumentDone` offen und im Bau → «Handelsstadt erreicht — spiel frei weiter. Das Denkmal bleibt als eigenes Ziel offen.»; `monumentDone` fertig → nur «Handelsstadt erreicht — spiel frei weiter.» Fälle mit nur einem Ziel unverändert.
- [ ] AK-UT-07 `monumentView.test.ts`: Knopf `text` «Bau anhalten» (Zeile 333 ändern), bei `paused` «Bau fortsetzen»; `monumentStallReason` → «Bau angehalten» (Test Zeile 172/173 anpassen).
- [ ] AK-UT-08 `inspect.test.ts`: Abriss-Knopf trägt Hinweis «Entf / ⌫» (U+232B) an allen vier Stellen (822/829/839/853), Tooltip ebenso (Hinweistext, `addButton`-Parameter `hint`).
- [ ] `npx vitest run tests/ui/buildMenu.test.ts tests/ui/guide.test.ts tests/ui/monumentView.test.ts tests/ui/inspect.test.ts; echo EXIT=$?` → `EXIT=1`, Beleg.

## Umsetzung

- [ ] `buildMenu.ts:152` → `Nur ein ${def.name} je Insel`.
- [ ] `guide.ts:130`: Zweig mit `w.monumentDone` als einzigem Schalter.
- [ ] `monumentView.ts:89, 222` und Kommentar `inspect.ts:113` («anhalten»); `grep -rn 'pausier' src/ui` darf zum Denkmal-Bau nichts mehr treffen (Spielpause bleibt).
- [ ] `inspect.ts` Hinweis-Konstante `DEMOLISH_HINT = 'Entf / ⌫'` statt viermal 'Entf'.
- [ ] Grün, `EXIT=0`, `npx tsc --noEmit; echo EXIT=$?`; Commit `feat: Wortlaute Baumenü, Guide, Denkmal, Abriss (AK-UT-05..08)`.
