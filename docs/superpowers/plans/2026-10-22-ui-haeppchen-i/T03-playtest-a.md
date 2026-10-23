# T03 · Browser-Check Strang A (P1 und P3 Grundteil)

`qa-playtester` · ≈ 35 Tools · AK I9, I27, I28 · blocked-by: T02 · Screenshots `.studio/qa/ui-haeppchen-i/`

- **I9** Neue Insel, Betriebe ohne Häuser bauen bis die Bilanz negativ ist: Zeiger auf `Geld` zeigt «Kasse leer in ≈ …»; Betrieb stilllegen: Zeit wächst; ab 3:00 Gelb, ab 1:00 Rot; Tempo 4× ändert den Text nicht.
- **I27** Partie mit ≥ 200 Häusern (weite Partie, Dev-Server). Messung einer `growthBrakes`-Rechnung im Browser, Median aus 20 (Weg: vorhandene `devProbes`, `rg devProbes src/ui`; sonst dynamischer Import `/src/ui/growthBrake.ts` im Dev-Server). Zahl berichten; **über 4 ms: Status `blocked`, Bericht an Lead, P3 geht an L0 zurück**. Bildrate bei geöffnetem Tooltip nicht sichtbar schlechter (Perf-Probe wie bisher).
- **I28** Pioniere ohne Marktplatz in Reichweite: Chip-Tooltip nennt «ausserhalb der Versorgung»; Marktplatz bauen: Zahl sinkt innerhalb von 1 bis 2 s; Kapelle fehlt bei Stufe 2: «ohne Kapelle».
- Keine Dateiänderung ausser den Screenshots und dem Playtest-Report (Schlussbericht).
