# T10 · Browser-Check

Strang A (`.worktrees/nu1` @ T09) · Persona `qa-playtester` · Modell sonnet · ≈ 40 Tools · blocked-by: T09 · AK-NU1-31, -32, -47, -48, -49, -50, -51

**Ablauf:** Headless-Chrome (Dauerauftrag R922), Fenster 1280 × 800, Screenshot je Prüfpunkt nach `.studio/qa/NU-1/` (Hauptrepo), Playtest-Report nach `docs/studio/templates/playtest-report.md` als Schlussbericht. Startstand: Szenario `out/nu1-kartenrand.json` (T06), geladen über «Laden aus Datei» wie bei früheren Szenario-Checks.

**Last:** Browser-Lauf nur bei **Last ≤ 4 nötig** (`make messfenster`), sonst `waiting`.

## Prüfpunkte

- **AK-31:** Kartenhaus-Karte zeigt «aufgedeckt 0 / 3», «Fundstücke 0 / 8», «Keine Expedition»; Packansicht: Balken «n / 50» (voll in Warnfarbe), Hinweis-Waren hervorgehoben, Warnung «Einziges Gewürzschiff …» bei Wahl des Routenschiffs; Auslaufen mit dem freien Schiff ins Wrackfeld; Kartendialog mit einer gesperrten Option und Grund «Braucht … an Bord (da …)»; Wahl; Rückkehr; Seekarte zeigt vorher Nebel mit Hinweis-Waren, unterwegs die Marke, danach «Wrackfeld · kein Land, nur Wracks»; Fundstück-Liste mit Kompassrose bzw. Ladebaum und «?»-Plätzen; Leseort sichtbar (Routen-Dialog: Fahrzeit mit «(Fundstück «Kompassrose»)» bzw. «Güter je Richtung 3»).
- **AK-32:** bei 1280 px keine abgeschnittenen Abschnitte, kein horizontales Scrollen (Packansicht, Kartendialog, Kartenhaus-Karte, Popover «Inseln»); bei 800 px kein Absturz, Konsole ohne Fehler; Expeditionsschiff in `leg` nicht in der Weltansicht und nicht als Routenpunkt.
- **AK-47:** bei offener Karte speichern, Seite neu laden, laden → Karte wieder offen bzw. Chip sichtbar, gleiche Sperren.
- **AK-48:** Routenschiff wählen → «Wartet auf Schiff …»; «Abbrechen» gibt die Ladung zurück (Lageranzeige); nach dem Auslaufen fehlt der Knopf.
- **AK-49:** während einer Expedition zeigt der Abriss-Knopf «Erst Expedition beenden».
- **AK-50:** Spielpause bei offener Karte: Wahl möglich, Tickzähler und Marke stehen.
- **AK-51:** `Esc` schliesst den Kartendialog ohne Wahl; Karte bleibt offen, Chip bleibt.
- Zusätzlich: Konsole während des ganzen Laufs ohne Fehler; Stand mit `SAVE_VERSION + 1` (Version im Speicher von Hand angehoben) → Hinweis «Unbekannte Version», kein Absturz.

## Ergebnis

Urteil OK/BEDENKEN/ZURÜCK je AK mit Screenshot-Pfaden. Abweichungen an den Controller; Fix-Runde durch Umsetzer B (`SendMessage`), danach erneuter Check derselben Punkte.
