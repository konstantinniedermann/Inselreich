# T06 · Browser-Check Panel und Spielstand

Strang A (`.worktrees/i215` @ T08) · Persona `qa-playtester` · Modell sonnet · ≈ 35 Tools · blocked-by: T08 · AK-VL-22, -23

**Ablauf:** Spec Anhang 02 C, Schritte 1–7, wörtlich. Headless-Chrome (Dauerauftrag R922), Fenster 1280 × 800, Screenshot je Schritt nach `.studio/qa/I-215/` (Hauptrepo), Playtest-Report nach `docs/studio/templates/playtest-report.md` als Schlussbericht.

**Last:** Browser-Lauf nur bei **Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

## Prüfpunkte

- **AK-VL-22:** Knopf «Volllast» neben «Stilllegen»; Tooltip-Zeilen gleich Anhang 01 B (Weberei St. 1: «Ausstoss Stoff: 1.2 → 1.6 / min (+32 %)», «Unterhalt: 90 → 138 / min»); nach Klick «Volllast 3:00», sinkt in 10 s um 10 s (1×); Unterhaltszeile «138 / min (+48 / min durch Volllast)»; Knopf gesperrt «Volllast läuft noch …». 4× bis zur Ruhe: «Ruht 2:00», Ausstossrate 0, «48 / min (−42 / min in der Ruhe)», «Ruht noch …»; danach normal, Knopf frei. Sperrtexte stillgelegt, ohne Strasse, brennend (Brand nicht auslösbar → Vermerk, AK-VL-10 genügt); Wolle 0 → «Eingang fehlt: Volllast verpufft».
- **AK-VL-23:** Volllast starten, speichern, Seite neu laden, laden → Restzeit ± 1 s, Uhr läuft. Vorgängerstand (gespeichert mit einem main-Build vor dem Merge, z. B. `.worktrees/i215-base` auf `git merge-base main HEAD`, `npm run build` + `vite preview`) lädt, Volllast normal, Knopf frei. Stand mit `SAVE_VERSION + 1` (Version im Speicher von Hand angehoben) → Hinweis «Unbekannte Version», kein Absturz, Konsole ohne Fehler.
- Zusätzlich: Konsole während des ganzen Laufs ohne Fehler; Panel bei 1280 px ohne Überlauf durch den neuen Knopf.

## Ergebnis

Urteil OK/BEDENKEN/ZURÜCK je AK mit Screenshot-Pfaden. Abweichungen an den Controller; Fix-Runde durch Umsetzer B (`SendMessage`), danach erneuter Check derselben Punkte.
