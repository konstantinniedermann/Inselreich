# T03 Browser-Check (AK-5, AK-6)

Persona `qa-playtester`, Modell sonnet, blocked-by T02. Schätzung ~25 Tools. Eigener Schritt, kein Code; Screenshots unter `.studio/qa/i100/`, Playtest-Report nach `docs/studio/templates/playtest-report.md`. Ändert keinen Code; Fehler gehen als Fix-Runde an den Umsetzer von T02.

## Schritte

- [ ] **AK-5:** Szenario mit Krisen, Tempo 4×, Log eingeklappt: Brand abwarten, Knopf zeigt «Ereignisse ▸ (1 neu)». Klick auf Aufklappen: Zähler weg, Liste zeigt den Eintrag. Zweiter Brand bei aufgeklapptem Log: kein Zähler. Einklappen: Zähler bleibt 0. Zusatz: stille Einträge («wieder in Betrieb») erhöhen den Zähler nicht; Knopf hat `aria-label` mit voller Zahl.
- [ ] **AK-6:** Bei Zähler > 0 Spielstand laden und separat «Neue Insel»: Zähler 0, Box ohne Einträge verborgen.
- [ ] **Randfall:** mehr als 9 ungelesene → «(9+ neu)».
- [ ] **Beleg:** Screenshots je Schritt, Konsole ohne Fehler, Report mit Urteil OK/BEDENKEN/ZURÜCK.
