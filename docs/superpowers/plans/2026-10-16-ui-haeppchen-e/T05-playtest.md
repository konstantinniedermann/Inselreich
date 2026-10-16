# T05 · Browser-Check beider Häppchen

`qa-playtester` · ≈ 30 Tools · I097 AK-6 bis 10; I102 AK-8 · blocked-by: T04

Headless-Chrome, 1280×720 (und einmal 1920×1080), Screenshots nach `.studio/qa/ui-haeppchen-e/`. Dev-Server nach `make help`; kein Code ändern.

## Prüfpunkte

1. **AK-6** ⏸-Knopf, P, Leertaste (antippen): jeweils Rand und Banner «Pause», «P oder 1× setzt fort»; 1×/2×/4× blenden aus. Verzögerung beim Ein-/Ausblenden notieren (O-2: `refresh()`-Takt); sichtbar auffällig (> ≈ 200 ms) → Befund an den Controller.
2. **AK-7** In der Pause: Gebäude bauen, Karte ziehen, Mausrad-Zoom, Rechtsklick (Abbruch) und Pipette funktionieren durch das Overlay.
3. **AK-8** Menü oder Dialog bei Pause öffnen: nur das Modal sichtbar, Overlay verborgen; Schliessen: Overlay wieder da. Menü bei laufendem Spiel: kein Overlay.
4. **AK-9** Spielstand laden: Overlay sofort sichtbar, Toast «Pausiert — P oder 1× setzt fort» erscheint zusätzlich und verschwindet, Overlay bleibt.
5. **AK-10** Banner umbricht bei 1280 px nicht, überdeckt weder Kopfzeile noch Bauleiste noch Ereignis-Log (UI-D); Tab-Reihenfolge unverändert.
6. **I102 AK-8** Auftragskarte: «Nächster Auftrag in … · voraussichtlich {Gut}» schon zu Spielbeginn; nach dem Angebot erscheint genau dieses Gut (gleiche Stufe, Pause und Tempo 4× zum Abwarten nutzen); bei aktivem Auftrag «· danach voraussichtlich {Gut}»; Karte umbricht bei 1280 px nicht; Fernauftrag (falls erreichbar) ohne Vorschau.
7. Ergänzend: Pause mit offener Auftragskarte, Kamera-Schwenk in der Pause (Overlay bleibt am Rand).

## Ergebnis

Playtest-Report (Schlussbericht) mit Befunden je AK, Screenshots benannt. Befunde ausser Scope nach `docs/beobachtungen.md` (nicht der Playtester, sondern Controller trägt ein).
