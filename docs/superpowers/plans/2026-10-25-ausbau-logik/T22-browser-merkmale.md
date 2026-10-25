# T22 Browser-Check Stufenmerkmale (ohne Drehung)

Persona `qa-playtester` · Strang R (in A2) · Tools ≈ 35 · AK-AL-31 (Browser-Teil; «jede Drehung» prüft GV S5/S6 mit AK-GV-17, Plan P-11) · blocked-by T21, T12 (R in A2 gemergt, damit `level` 4 ladbar ist).

**Szene:** Galerie `G` aus `tests/ui/ausbauScenes.ts` (ergänzt in T14): Heimatinsel, elf Typen × Stufen 1 … 4 (Jagdhütte 1 … 3) in Reihen, jeder Typ an gültigem Standort (Fischer an der Küste), `focus` auf die Reihe. Ausgabe `AUSBAU_SCENES_OUT=.studio/qa/ausbau-logik/galerie npx vitest run tests/ui/ausbauScenes.test.ts`, Laden wie T09.

## Prüfschritte

1. **Standardzoom:** je Typ sind Stufe 1 … 4 ohne Panel unterscheidbar (Spec Vorgabe 6); Screenshot je Typgruppe (`merkmale-roh.png`, `merkmale-werk.png`).
2. **Ein Element je Stufe:** Stufe n zeigt das Element der Stufe n − 1 weiter (Sichtvergleich), keine Fahne mehr.
3. **Stufe 3 Stein, Stufe 4 Glas:** Stein an Stufe 3 aller Typen erkennbar; Glasfenster an Stufe 4 der vier Werkstätten.
4. **Zoom 1 und 2, Tag und Nacht:** Merkmal bleibt lesbar, überdeckt das Kennzeichen des Gebäudes nicht (Screenshots `merkmale-zoom1.png`, `merkmale-nacht.png`).
5. **Konsole** fehlerfrei; Bildrate x1 30 s unauffällig.

## Ergebnis

Playtest-Report an den Controller, Screenshots zusätzlich an `lead-art` (Urteil zu den Merkmalen, Start aus dem Art-Budget, Plan «Budget»). Kein Code, keine Commits.
