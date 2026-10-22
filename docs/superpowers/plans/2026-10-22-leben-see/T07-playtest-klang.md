# T07 · Browser- und Hör-Check Klang

`qa-playtester` (Headless-Chrome, `debugState()`), Bericht `.studio/qa/LEBEN-SEE/` · ≈ 25 Tools · AK K11 · blocked-by: T06 · ändert keine Datei

## Schritte

1. Route zwischen zwei Inseln einrichten, Kamera auf der Heimatinsel, Tempo 4×: `debugState().events.shipDock` steigt je Ankunft um 1, höchstens alle 4 s Echtzeit.
2. Pause: Zähler steht. Spiel laden/neues Spiel: Zähler beim ersten Frame unverändert (K9 im Browser).
3. Stumm und Tab verborgen: Zähler bleibt (kein Baustein).
4. Vier Schiffe auf kurzen Routen: Häufigkeit notieren (Ermüdungsindiz).
5. Hörurteil ist nicht prüfbar (headless): im Bericht ausdrücklich «Hörurteil des Nutzers steht aus» vermerken (R830: «Bitte testen» in der Release-Notiz). Urteil OK/BEDENKEN/ZURÜCK.
