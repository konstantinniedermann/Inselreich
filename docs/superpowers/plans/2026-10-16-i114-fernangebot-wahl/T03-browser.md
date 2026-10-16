# T03 · Browser-Check und Zeitmessung nachher

`qa-playtester` (Browser) und Controller (Zeitmessung) · ≈ 25 Tools · AK-11 · blocked-by: T02

Headless-Chrome 1280×720, Screenshots nach `.studio/qa/i114/`; Dev-Server nach `make help`; kein Code ändern. Spielstand mit zwei Fremdkontoren, Seefahrt und offenem Fernangebot über Dev-Parameter/Probes (`src/ui/devParams.ts`, `devProbes.ts`) oder gespeicherten Stand.

## Prüfpunkte

1. Ein Fremdkontor: eine Fernkarte wie heute. Zwei Kontore: Auftragskarte plus zwei Fernkarten ohne Überlappung mit Nachbarkarten und Krisenkarte (AK-11).
2. Annehmen der Zweitkarte: Auftrag zeigt die Zweitinsel («Fernauftrag Felsbucht …»), beide Fernkarten weg, Karte der Folgeperiode gesperrt wie bisher.
3. Tooltip je Karte nennt die jeweilige Insel; Lager `x/y` rot/normal je Insel.
4. Kontor der Zweitinsel abreissen, Karte verschwindet oder wechselt nach Refresh, kein Fehler in der Konsole.
5. Überlappt der Stapel bei 1280 px: Befund an Controller, Fallback P-3 in T02 (Fix-Runde per SendMessage), erneut prüfen.

## Zeitmessung nachher (Controller)

`npx vitest related --run src/sim/orders.ts src/ui/farOrder.ts src/ui/hud.ts src/ui/app.ts --reporter=json --outputFile=.studio/qa/i114/zeit-nach.json; echo EXIT=$?` (Load ≤ 4 prüfen). Vergleich vor/nach im Bericht (R392); Abweichung > 20 % je Datei als Beobachtung.
