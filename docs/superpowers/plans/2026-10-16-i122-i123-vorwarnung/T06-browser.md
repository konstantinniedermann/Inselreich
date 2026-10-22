# T06 · Browser-Check, Zeitmessung nachher, `make check`

`qa-playtester` (Browser) + Controller (Zeit, `make check`) · ≈ 30 Tools · blocked-by: T04, T05 (beide in `feat/i122-i123` gemergt)

## Browser-Check (Headless-Chrome, Screenshots `.studio/qa/i122-i123/`)

Dev-Server auf `feat/i122-i123`; Dev-Sonde `contractSounds()` und `world()`. Szenarien (Spec «Browser-Check»): Vertrag mit Lager 0, Spielzeit bis `settle - 300` laufen lassen: Sonde enthält `'contractWarn'` einmal, Karte leuchtet einmal 2,5 s, Zusatz «Fehlt: 5 Rum» sichtbar · Rum nachkaufen: Zusatz weg, kein zweiter Klang · Pause im Fenster: nichts wiederholt · ×4: Warnung kommt vor der Lieferung · Rum-Chip zeigt mit Vertrag kürzere Reichweite, Tooltip nennt «mit Stammkunde» · Kulanz-Fall (`deliveries` 5) und Strafe-Fall (4) · Laden im Fenster: kein Klang · Konsole fehlerfrei bei 1280 und 1024 px; Zeilenumbruch der Vertragskarte bei 1280 px dokumentieren (Fallback siehe Plan «Risiken»). Report `.studio/qa/i122-i123/report.md`.

## Controller

1. `npx vitest related --run … --reporter=json --outputFile=.studio/qa/i122-i123/zeit-nach.json; echo EXIT=$?` (gleiche Dateien wie T00); Vergleich vorher/nachher je Datei im Bericht (R392).
2. `make check; echo EXIT=$?` einmal (Testlock R380, Lauf > 4 min mit `run_in_background: true`, E-037).
3. `git diff --stat main -- src tests` zählen: ≤ 300 Zeilen → ein Final-Review (opus, frisch); sonst Task-Review T01 nachholen (Budgetmeldung).
