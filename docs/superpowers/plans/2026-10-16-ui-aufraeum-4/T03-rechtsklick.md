# T03 · Rechtsklick im Zug, Doku

Umsetzer `tech-ui-engineer` · ≈ 45 Tools · AK-9, 10, 11, 12 · blocked-by: T02

## Dateien

- ändern: `src/ui/input.ts` (`onContextMenu`, Z. ≈ 336 bis 340), `tests/ui/input.test.ts` (neue Fälle neben den «I-098»-Fällen, Z. ≈ 421 bis 450), `README.md` (ein Satz zur Bedienung, falls dort Rechtsklick/Esc beschrieben sind: «Rechtsklick beendet einen laufenden Zug, der nächste legt das Werkzeug ab»), `docs/beobachtungen.md` (Randfälle aus T04; die erledigten Zeilen «eingeplant: UI-AUFRAEUM-4» abhaken), `docs/arc42.md` nur bei Abweichung von der Modulbeschreibung (D1-Dateien, E-017)
- `.studio/qa/ui-aufraeum-4/zeit-nach.json` (gleicher Befehl wie T00, Load ≤ 4) und Vergleichstabelle im Task-Bericht

## Verhalten (D-2)

`onContextMenu`: `e.preventDefault()`; dann `if (drag !== null && !drag.panning) cancelPointerAction();` (ersetzt `drag?.line === true`). Kommentar nennt Chrome-Verhalten und Staffelung. `pointerdown` b2 unverändert. Ein folgendes `pointerup` desselben Zeigers findet `drag === null` und sendet nichts (Z. ≈ 527). Kein Doppel-cancel: `cancelPointerAction` setzt `drag = null`; ein nachfolgendes `contextmenu` ohne Zug sendet nichts.

## Test-first (Rot-Beleg)

Fälle mit `setup()`/`ptr()` wie die I-098-Tests: (a) Weg-Strich, `pointerdown`, Bewegung, `contextmenu`: Aktionen enthalten `dragEnd`, kein `cancel`; danach `pointermove`/`pointerup` ohne weitere `tile`-Aktion. (b) dasselbe mit Werkzeug `demolish` (Abriss-Strich). (c) zweiter `contextmenu` ohne Zug: nichts; zweiter echter Rechtsklick (`pointerdown` b2) sendet `cancel`. (d) Schwenk (`button` 1): `contextmenu` ändert nichts (AK-10). (e) b2 im Strich: bestehende Tests grün. (a) und (b) vorher **rot** (Ausgabe im Ledger).

## Prüfschritte

`npx vitest run tests/ui/input.test.ts; echo EXIT=$?`; `make check; echo EXIT=$?`; Zeitvergleich nach AK-12; Browser-Beleg in T04. Danach opus-Final-Review über die ganze Branch (Spec-Konformität zu AK-1 bis 12, Determinismus, `git diff --stat` ohne `src/sim/`).
