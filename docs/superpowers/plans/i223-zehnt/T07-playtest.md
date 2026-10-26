# T07 · Browser-Check Amtsstube

Strang A · Persona `qa-playtester` · Modell sonnet · ≈ 35 Tools · blocked-by: T06 · AK-ZE-17, -18, -19, -20 · Headless-Chrome 1280 × 800, Worktree `.worktrees/i223`

**Testsperre: Last ≤ 4 nötig** (`make messfenster`) vor dem Start des Dev-Servers, sonst `waiting`.

**Files:** nur `.studio/qa/I-223/` (Screenshots, Report). Kein Code.

## Aufbau

Spielstand mit Siedlern und angebundener Amtsstube (U3 frei): Weg über das Dev-Szenario des Projekts (`rg -n "scenario|SCENARIOS" src/ui/app.ts` bzw. URL-Parameter laut README) oder normales Spiel bis U3. Für AK-ZE-18 Lauf 2 Kasse nahe 0: Spielstand speichern, im Export `money` auf 50 setzen, laden (Laden prüft nur Struktur). Für AK-ZE-20: Auflage starten (Ratsbeschluss/Auflage laut README), Kasse ≥ 0.

## Prüfungen

- **AK-ZE-17:** Amtsstube öffnen: Pioniere und Siedler haben je `Geld | Zehnt`; Tooltip zeigt den Spielertext der Stufe; Bürger und Kaufleute ohne Schalter. Screenshot `ak17-panel.png`.
- **AK-ZE-18 Lauf 1:** Pioniere → `Zehnt`: Dialog mit Spielertext, Sperrtext und Kassen-Satz (`ak18-dialog.png`). «Abbrechen» → Schalter bleibt `Geld`, Kasse/Lager gleich. Erneut, «Zehnt einschalten» → Schalter `Zehnt`, darunter «wieder änderbar in 3:00» (zählt herunter, zweiter Screenshot ≥ 10 s später), Steuerzeile «0 / min · n Werkzeug / min», Werkzeug im Lager steigt (Kopfzeile/Kontor, Vorher/Nachher-Wert im Report).
- **AK-ZE-18 Lauf 2:** Kasse 50, Bilanz nach dem Umschalten negativ: Dialog zeigt «Kasse leer in ≈ …» bzw. «Kasse ist leer bei …» und «Im Minus kannst du nicht bauen und nicht zukaufen.» (`ak18-knapp.png`); nach dem Einschalten fällt die Kasse unter 0; ein Bauversuch zeigt «Kein Geld»; Konsole ohne Fehler.
- **AK-ZE-19:** Werkzeug per Zukauf auf 100, Zehnt Pioniere an: Meldung «Lager voll: n Werkzeug verfallen» erscheint, über ≥ 30 s Spielzeit höchstens einmal je 100 Ticks (Zeitstempel der Meldungen im Report).
- **AK-ZE-20:** Während laufender Auflage Zehnt einschalten: Dialog enthält «Auflage läuft: kein Zukauf. Mit leerer Kasse kannst du auch nicht bauen.» (`ak20-auflage.png`).
- Zusatz: Siedler-Zehnt an, Steuerzeile «Geld / min · x Stein / min»; Amtsstube abreissen oder Weg trennen → «Zehnt ruht: …», Schalter bleibt `Zehnt`.

## Abschluss

Report `.studio/qa/I-223/report.md`: je AK OK/FEHLER mit Screenshot-Pfad, Konsolenfehler (Anzahl), Auffälligkeiten. Urteil an den Controller per `SendMessage`.
