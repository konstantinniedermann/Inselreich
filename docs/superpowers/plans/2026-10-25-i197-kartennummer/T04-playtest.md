# T04 Browser-Check (`qa-playtester`)

Persona `qa-playtester` · Tools ≈ 35 · AK-K7 bis K11, AK-K12, AK-K13 · blocked-by T03.

Headless-Chrome, `npm run dev`, Screenshots unter `.studio/qa/i197/`. Vergleiche über Text und Koordinate, nicht pixelbasiert (B3).

- **K7** Menü → Neue Insel: Feld sichtbar, leer. «4711» eintippen, bestätigen (Bestätigung nennt «Karte 4711»): Menü zeigt `Karte 4711` (oder Info-Meldung mit genutzter Nummer). Zweimal wiederholen: gleiche `Karte N`-Anzeige und gleiche Kontor-Koordinate (aus der Welt: `window`-Zugriff nur falls vorhanden, sonst über Screenshot des Kontor-Tooltips; Verfahren im Report nennen).
- **K12** Eine Nummer wählen, bei der `seedUsed > n` (vorab per Node-Einzeiler mit `generateMap` suchen, z. B. Schleife n = 1…200): Info-Meldung «Karte n nicht bebaubar, genutzt: m», Menü zeigt `Karte m`; m eintippen gibt dieselbe Karte.
- **K8** Leeres Feld, zwei Starts: zwei verschiedene Nummern (Abstand ≥ 1 s zwischen den Starts).
- **K9** «12a», «1.5» und «99999950»: Hinweis unter dem Feld, keine Bestätigung, Partie läuft weiter (Tick läuft, Gebäude stehen), Fokus im Feld. Karte 0 und «00042» starten ohne Fehler.
- **K10** Enter im Feld wirkt wie der Knopf; Seite neu laden: Feld wieder leer.
- **K13** Nummer 4711 starten, speichern, danach Neue Insel leer (Zufall), Spielstand laden: `Karte 4711`, Nummer des Feldes ohne Wirkung.
- **K11** Mit Inselproben (diese sind vor T03 gemerged): Probe läuft, «Neue Insel» mit Nummer bricht die Probe ab, kein Proben-Eintrag, keine Bestzeit; Nummer 20261025 startet eine normale Partie ohne `challenge`.

Abschlussbericht mit Urteil je AK (OK/FEHLT) und Screenshots.
