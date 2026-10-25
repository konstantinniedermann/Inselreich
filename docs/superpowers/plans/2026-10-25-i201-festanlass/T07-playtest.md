# T07 Browser-Check

Persona `qa-playtester` (Controller-Start) · Strang A (zusammengeführter Stand) · Tools ≈ 35 · AK-FE17 bis FE20 · blocked-by T04, T05, T06.

**Vorlauf (Controller, nicht der Playtester):** `feat/i201-fe1` und `feat/i201-ui` per Merge in `feat/i201` (kein Rebase); Teilbeleg auf dem Ergebnis: `npx vitest run tests/sim/feastKinds.test.ts tests/sim/feastDominance.test.ts tests/sim/feast.test.ts tests/ui/feast.test.ts; echo EXIT=$?`, `npx vitest run tests/sim/balance.test.ts; echo EXIT=$?` (AK-FE16, Dauer gegen T00), `npx tsc --noEmit`, `make lint`, `make zeittests`, `make conflicts`, je `; echo EXIT=$?`.

**Prüfung** (Headless, Desktop 1280 × 800 und 1920 × 1080; Screenshots unter `.studio/qa/i201/`; Spielstand per Entwicklerzugang oder Aufbau im Spiel mit Kapelle, Werkstatt im Radius, Kontor, Rum, Stoff, Glas):

- **AK-FE17:** Kapelle wählen: drei Knöpfe «Aufstiegsfest · 10 Rum», «Erntefest · 10 Rum, 15 Stoff», «Markttag · 10 Rum, 5 Glas». Ohne Stoff: «Erntefest» gesperrt, Zeile «Zu wenig Stoff (x / 15)». Klick «Erntefest»: Statuszeile «Erntefest läuft noch m:ss» zählt herunter; die anderen beiden Knöpfe `disabled` mit `title` «Fest läuft» (P-4, per DOM lesen).
- **AK-FE18:** Werkstatt im Radius zeigt «Erntefest: Zyklus 75 %», eine ausserhalb nicht; nach `FEAST_DURATION` (Zeitraffer) Zeile weg.
- **AK-FE19:** Markttag halten (nach Abklingzeit oder zweite Welt), Handelsfenster der Insel: «Markttag 125 %» und höherer Verkaufspreis am Knopf-Tooltip; nach Festende weg.
- **AK-FE20:** zweite Kapelle derselben Insel: «Erntefest» gesperrt mit «Erntefest auf der Insel: Abklingzeit», «Markttag» frei.
- **Zusatz:** Konsole ohne Fehler; Speichern und Laden während des Erntefests, danach Zeile «Erntefest: Zyklus 75 %» weiter sichtbar; Hausanzeige während Erntefest ohne «Fest: schnellerer Aufstieg».

Ergebnis: Playtest-Report (Urteil, Screenshot-Pfade, Abweichungen) an den Controller. Befunde behebt `tech-ui-engineer` per `SendMessage`, danach Nachprüfung per `SendMessage` an denselben Playtester.
