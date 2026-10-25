# T07 · Browser-Check Ehrenbuch

`qa-playtester` · ≈ 40 Tools · AK-EB-11 · blocked-by: T05 (OK) · Strang A (`.worktrees/i186-ehrenbuch`) · Screenshots `.studio/qa/I-186/`

## Fixture (N8, P-4, ohne neuen Code)

- `SCENARIO_OUT=.studio/qa/I-186/saves npx vitest run tests/sim/scenario-saves.test.ts -t "SCENARIO_OUT"; echo EXIT=$?` → `m8-kurz-vor-sieg.json` (Ziel 1 beim nächsten Wachstumstakt).
- Einspielen: vor dem Laden der Seite den Inhalt unter `inselreich.save.v1` in den `localStorage` legen (wie bei früheren Szenario-Checks), dann Menü → «Gespeichertes Spiel laden».
- «Stand nach Ziel 1»: nach der Meldung Strg+S, Seite neu laden, manuellen Platz laden.

## Schritte (je ein Screenshot)

1. Leerer `localStorage`, Seite laden, «Los geht's», Menü: Zeile «Ehrenbuch: 0 von 9 Meisterstücken».
2. Karte «Ehrenbuch» öffnen: 9 offene Stücke mit Bedingung, gedämpft; Esc schliesst, Fokus zurück auf den Knopf.
3. Fixture laden, auf 1× fortsetzen: Meldung «Meisterstück: Bürgerstadt — ins Ehrenbuch eingetragen» (kein «Flinke Gründung», weil geladen = Merker unbekannt), Menü «1 von 9».
4. Karte: Bürgerstadt mit Datum, «Karte N», Krisenstufe, Spielzeit `mm:ss`; Hinweis «Tempo-Stücke zählen in dieser Partie nicht (Freischaltung unbekannt)».
5. Seite neu laden: Eintrag noch da (Menü «1 von 9»).
6. Stand nach Ziel 1 (siehe oben) laden, 30 s auf 4×: **keine** Meldung, Zähler unverändert.
7. Gesperrter Speicher (`Storage.prototype.setItem` und `getItem` werfen per Skript vor dem Laden): Menü und Karte zeigen «Ehrenbuch wird nicht gespeichert», Spiel läuft, **kein** Konsolenfehler.
8. Fenster 1280 × 800 und ein schmales Fenster (≈ 700 px): Karte scrollbar, kein Absturz.
9. Konsole über alle Schritte: keine Fehler.

Keine Dateiänderung ausser Screenshots und Playtest-Report (Schlussbericht). Abweichung → Urteil ZURÜCK mit Schritt und Screenshot.
