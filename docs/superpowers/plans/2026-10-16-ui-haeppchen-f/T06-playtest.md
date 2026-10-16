# T06 · Browser-Check aller drei Häppchen

`qa-playtester` · ≈ 30 Tools · AK M8, B9, I108 11 bis 14 · blocked-by: T05

Headless-Chrome, 1280×720 (und einmal 1920×1080), Screenshots nach `.studio/qa/ui-haeppchen-f/`. Dev-Server nach `make help`; kein Code ändern. Spielstände mit Seefahrt, Fern-Kontor und mehreren Gütern über Dev-Parameter/Probes (`src/ui/devParams.ts`, `devProbes.ts`) oder gespeicherten Stand aufbauen.

## Prüfpunkte

1. **AK-M8** Seekarte öffnen: Fernangebot → Marke **hohl** an der Fern-Insel («15 Rum · 1:20»-Muster); annehmen → **gefüllt**; liefern oder verfallen → weg; Kontor der Fern-Insel abreissen → Warnfarbe; Marke nahe Kartenrand: Text nicht abgeschnitten; Hover-Text der Insel endet auf «Fernauftrag: …»; Klick auf die Marke springt wie auf die Insel (kein Mausfang); Pause: Marke steht still.
2. **AK-B9** Kontor-Panel: Route Heimat ⇄ Fremdinsel setzen: Zeile «Warenwert +… / min · Unterhalt 90 → … · nominal»; Route löschen: Zeile weg; zweites Schiff auf demselben Paar: Tooltip-Hinweis; Verlustroute (Quelle ohne Überschuss) in Warnfarbe; Heimfahrt ohne Zeile; Panel offen bei 4× ohne Ruckeln (subjektiv, Frame-Zeit der Konsole als Beleg).
3. **I108 AK-11** frühe Partie und späte Partie (vier Bevölkerungs-Chips, alle Gut-Chips mit Reichweite, Geld, Steuerstufe, Tempo): Kopfzeile bricht bei 1280 px nicht um, nichts abgeschnitten, Bilanz-Chip vollständig.
4. **AK-12** breite Zahl (`12,3k / −9,8k`, über Dev-Parameter oder viele Gebäude): einzeilig bei 1280 px; ist die Zeile voll, wird kein Gut-Chip verdrängt (Reichweite sichtbar). Befund hier: Fallback laut Index «Risiken».
5. **AK-13** Tempo 4× und Pause: Anzeige springt nicht unruhig (höchstens eine Aktualisierung je 500 ms), in Pause steht der Wert.
6. **AK-14** Tooltip bei Maus und Tastaturfokus (Tab), Fokusring sichtbar; Klick/Enter/Leertaste öffnen die Betriebsliste.
7. Wechselwirkung: Karte offen und Kopfzeile gleichzeitig; Konsole ohne Fehler.

## Ergebnis

Playtest-Report (Schlussbericht) mit Befunden je AK, Screenshots benannt. Befunde ausser Scope trägt der Controller in `docs/beobachtungen.md` ein.
