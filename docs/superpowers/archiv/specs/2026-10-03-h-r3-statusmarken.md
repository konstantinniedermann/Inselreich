# H-R3 Statusmarken (Programm S4) — Kurzdesign

Kleine Marke über einem Betrieb, die zeigt, warum er nicht voll produziert. Modul `src/render/statusMarks.ts`.

| Zustand        | Form                              | Farbe          | Bedeutung      |
| -------------- | --------------------------------- | -------------- | -------------- |
| `waitingInput` | Dreieck nach unten (Pfeil)        | `signalWarn`   | Zufuhr fehlt   |
| `storageFull`  | Quadrat mit Deckelstrich und Band | `signalYellow` | Lager voll     |
| alles andere   | keine Marke                       | —              | eigene Signale |

`statusMarkOf(state: string): StatusMark | null` ist rein; unbekannte Zustände (auch künftiges `noService`, `undefined`,
Prototyp-Namen) liefern `null`, nie eine Ausnahme. `drawStatusMarks(ctx, world, cam, range, timeMs, reduce)` liest nur
`b.state`, zeichnet für Gebäude im Bild und liefert die Anzahl.

## Annahmen

- Häuser und Kontor bekommen keine Marke; `burning`, `notConnected`, `ok` ebenso nicht (eigene Signale).
- Unterscheidung über die Form; Farbe zusätzlich. Lesbarkeit: weisser Umriss (3 px) plus dunkle Kontur (`wallTimber`).
- Grösse `clamp(14 px × Zoom, 10, 18)`, also bei Zoom 0,75 mindestens 10 px; Marke sitzt 3 px über der
  Sprite-Oberkante (`spriteBounds`), Mitte der Bildbox.
- Pulsieren: ±1,5 px Auf und Ab, Periode 900 ms; bei `reduce` statisch.
- Reihenfolge: Schritt 12 (Signale), nach Multiply-/Additiv-Durchgang, also ungetönt und nachts lesbar; nach dem
  sortierten Objektdurchgang, nie von Gebäuden verdeckt. Kein Zoom-Mindestwert wie bei Bedarfssymbolen, da die Marke
  bildschirmfest klein bleibt.
- Obergrenze `MAX_MARKS = 60` im Modul statt in `CAPS` (`weather.test.ts` prüft `CAPS` mit `toEqual`; eine Änderung
  dort liegt ausserhalb des Auftrags).
- Prozent-Produktivität bleibt M11 (braucht Sim-Abfrage).
