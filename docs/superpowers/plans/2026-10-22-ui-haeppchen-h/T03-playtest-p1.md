# T03 · Browser-Check P1 und Grössenmessung

`qa-playtester` (Headless-Chrome, 1280×720), Screenshots `.studio/qa/ui-haeppchen-h/` · ≈ 30 Tools · AK H11 bis H13 · blocked-by: T02 · ändert keine Datei

## Schritte

1. Spiel starten, Tempo 3×, über zwei Autosave-Takte laufen lassen. Menü → «Laden»: «Autosave — Spielzeit …» und «Autosave davor — Spielzeit …», Zeiten um etwa zwei Spielminuten verschieden; «Autosave davor» lädt pausiert mit der kleineren Spielzeit (**H11**).
2. Seite neu laden: «Fortsetzen» trägt die grössere Spielzeit, «Davor laden» ist da; zweimal neu laden ohne Spielzeit: beide Zeiten unverändert (**H12**). «Neue Insel» fragt mit Autosave-Hinweis.
3. Weit fortgeschrittene Partie (mehrere Inseln, per Dev-Parameter oder lange Laufzeit): `localStorage`-Länge von `inselreich.save.auto`, `.auto2` und des manuellen Standes messen und im Bericht nennen; über 1 MB je Stand ausdrücklich melden (**H13**, F4).
4. Konsole ohne Fehler; Bericht nach Vorlage, Urteil OK/BEDENKEN/ZURÜCK.
