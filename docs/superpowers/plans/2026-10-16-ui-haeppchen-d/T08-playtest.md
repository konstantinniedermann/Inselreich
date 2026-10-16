# T08 · Browser-Check Teil A und B

`qa-playtester` (sonnet), als Controller gestartet · ≈ 30 Tools · AK-UD-07, 08, AK-UR-07, 08 · blocked-by: T07

Auflösungen 1280×720 und 1920×1080, Screenshots unter `.studio/qa/ui-haeppchen-d/`, Playtest-Report als Schlussbericht. Nach dem Review T01–T07, vor T09.

## Schritte

1. **AK-UD-07** «Krisen: aus»: Box anfangs verborgen. Zufallsauftrag verfallen lassen (Dev-Hilfe/Tempo 4×, nicht annehmen) → Box erscheint mit «Auftrag verfallen: …», Knopf «Ereignisse ▸» ohne «neu». Vertragslieferung abwarten (Stammkunde schliessen, Ware vorhalten) → «(1 neu)».
2. **AK-UD-08** Zufallsauftrag per Klick liefern → kein Log-Eintrag. Stammkunden-Angebot annehmen → kein «Angebot verfallen». Angebot unbeantwortet lassen → Eintrag zur nächsten Periode. Laden und «Neue Insel» → Box verborgen.
3. **AK-UR-07** Fischer abreissen: Nahrung-Chip zeigt Suffix, wird warn, dann alarm/«leer»; Fischer neu bauen: Suffix verschwindet; Leiste umbricht bei 1280 px nicht, kein Abschneiden.
4. **AK-UR-08** Holz bei Überproduktion nähert sich der Kapazität: «↑ …» gedämpft, nie rot; Tooltip zeigt «Voll in …».
5. Pause: Chip-Suffix und Tooltip bleiben stehen.

## Urteil

OK/BEDENKEN/ZURÜCK je Teil getrennt (A und B), damit Teil B bei Rückweisung abgespalten werden kann.
