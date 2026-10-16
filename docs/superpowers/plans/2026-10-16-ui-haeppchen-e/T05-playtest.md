# T05 · Browser-Check beider Häppchen

`qa-playtester` · ≈ 30 Tools · I097 AK-6 bis 10; I102 AK-8 · blocked-by: T04

Headless-Chrome, 1280×720 (und einmal 1920×1080), Screenshots nach `.studio/qa/ui-haeppchen-e/`. Dev-Server nach `make help`; kein Code ändern.

## Prüfpunkte

1. **AK-6** ⏸-Knopf, P, Leertaste (antippen): jeweils Rand und Banner «Pause», «P oder 1× setzt fort»; 1×/2×/4× blenden aus. **Messweg Verzögerung (R668-1, O-2):** je Weg 5 Wiederholungen, Zeit vom Tastendruck (bzw. Klick) bis zum `hidden`-Wechsel des `.pause-overlay` (Zeitstempel im Seitenkontext, z. B. `MutationObserver` auf `hidden` gegen `performance.now()` beim Ereignis); Einblenden und Ausblenden getrennt auswerten, Median und Maximum je Richtung im Report. Schwelle 200 ms: darüber → Befund an den Controller, Fix-Task «Zusatzaufruf `applyPauseOverlay` in `setSpeed`».
2. **AK-7** In der Pause: Gebäude bauen, Karte ziehen, Mausrad-Zoom, Rechtsklick (Abbruch) und Pipette funktionieren durch das Overlay.
3. **AK-8** Menü oder Dialog bei Pause öffnen: nur das Modal sichtbar, Overlay verborgen; Schliessen: Overlay wieder da. Menü bei laufendem Spiel: kein Overlay.
4. **AK-9** Spielstand laden: Overlay sofort sichtbar, Toast «Pausiert — P oder 1× setzt fort» erscheint zusätzlich und verschwindet, Overlay bleibt.
5. **AK-10** Banner umbricht bei 1280 px nicht, überdeckt weder Kopfzeile noch Bauleiste noch Ereignis-Log (UI-D); Tab-Reihenfolge unverändert.
6. **I102 AK-8** Auftragskarte: «Nächster Auftrag in … · voraussichtlich {Gut}» schon zu Spielbeginn; nach dem Angebot erscheint genau dieses Gut (gleiche Stufe, Pause und Tempo 4× zum Abwarten nutzen); bei aktivem Auftrag «· danach voraussichtlich {Gut}»; Karte umbricht bei 1280 px nicht; Fernauftrag (falls erreichbar) ohne Vorschau.
7. **Alle Pausewege (R668-2),** jeweils ohne weitere Eingabe (keine Mausbewegung, kein Klick danach): ⏸-Knopf, P, Leertaste, Tempo-Taste (1/2/4 und zurück), Neustart «Neue Insel» und Laden aus dem Menü. Das Overlay muss in jedem Fall von allein den richtigen Zustand zeigen (Pause: sichtbar; Neustart mit `speed` laut Aufruf; Laden: sichtbar).
8. **Auftragskarte Fernauftrag (R668-3):** Fernangebot annehmen (Kontor/Seefahrt wie in den Fern-Tests): Karte zeigt den Fernauftrag ohne «voraussichtlich»; nach Fernlieferung (Karte «kein Auftrag») zeigt die Vorschau Tick und Gut der Periode nach der Sperrperiode (nicht der gesperrten), Countdown stimmt mit dem tatsächlichen nächsten Angebot überein (4× zum Abwarten).
9. Ergänzend: Pause mit offener Auftragskarte, Kamera-Schwenk in der Pause (Overlay bleibt am Rand).

## Ergebnis

Playtest-Report (Schlussbericht) mit Befunden je AK, Screenshots benannt. Befunde ausser Scope nach `docs/beobachtungen.md` (nicht der Playtester, sondern Controller trägt ein).
