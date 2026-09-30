# Inselreich — ein Aufbau-Strategiespiel im Stil von Anno 1602

Browser-Spiel (TypeScript + HTML5 Canvas, keine Laufzeit-Abhängigkeiten).
Eigene Grafik, eigene Spielwerte — inspiriert von der Mechanik des Klassikers, kein Nachbau von Originalmaterial.

Stand: MVP (Meilensteine 1–4) — Insel generieren, Wege und Betriebe bauen, Produktionsketten, Handel am
Kontor, Bevölkerung mit drei Stufen, Steuern und Unterhalt, Siegziel, Speichern und Laden im Browser.

**Online spielen:** GitHub Pages: wird aktiviert, sobald das Repo öffentlich ist (Free-Plan).

## Ziel

Lass **50 Bürger** auf deiner Insel leben. Gezählt werden die Einwohner aller Wohnhäuser der höchsten
Stufe. Ist das Ziel erreicht, erscheint eine Meldung und das Spiel läuft weiter. Der Chip «Bürger-Ziel»
in der Kopfzeile zeigt den Fortschritt.

## Bedienung

### Kamera

- **Zoomen:** Mausrad.
- **Verschieben:** mittlere Maustaste ziehen, Leertaste halten und mit der linken Maustaste ziehen, im
  Werkzeug «Auswahl» einfach mit der linken Maustaste ziehen — oder WASD/Pfeiltasten.

### Werkzeuge (Bauleiste unten)

- **Auswahl:** Klick auf ein Gebäude öffnet das Info-Panel.
- **Weg:** klicken oder mit gedrückter Maustaste über mehrere Kacheln ziehen.
- **Gebäude:** in der Bauleiste wählen (nach Kategorien, mit Kosten), dann auf die Karte klicken. Die
  Vorschau ist grün, wenn der Standort passt, sonst rot; der Grund erscheint als Meldung. Nicht
  bezahlbare Gebäude sind blass dargestellt, ein Klick nennt den Grund.
- **Abriss:** Werkzeug wählen, dann auf ein Gebäude oder einen Weg klicken — oder im Info-Panel
  «Abreissen».

### Tastatur und Maus

| Eingabe                | Wirkung                                 |
| ---------------------- | --------------------------------------- |
| WASD / Pfeiltasten     | Karte verschieben                       |
| Leertaste (halten)     | Linke Maustaste verschiebt die Karte    |
| `Esc` oder Rechtsklick | Zurück zum Werkzeug «Auswahl», Panel zu |
| Mausrad                | Zoomen                                  |

### Geschwindigkeit

⏸ / 1× / 2× / 4× in der Kopfzeile. Ein Tick dauert bei 1× 100 ms; alle Raten unten gelten pro
100 Ticks.

## Wirtschaft

- **Start:** 5000 Geld, 40 Holz, 20 Werkzeug, 10 Stein, 20 Nahrung.
- **Lager:** Alle Waren liegen im Kontor-Lager, höchstens 100 je Gut. Ist das Lager voll, verfällt
  neu erzeugte Ware (Zustand «Lager voll»). Die Lagerleiste in der Kopfzeile zeigt den Bestand.
- **Baukosten:** Geld und teils Holz, Werkzeug oder Stein; sie stehen in der Bauleiste.
- **Anbindung:** Betriebe, Marktplatz, Kapelle und Schule arbeiten nur, wenn ein Weg an sie grenzt,
  der über Wege mit dem Kontor verbunden ist. Nicht angebundene Gebäude tragen einen roten Punkt.
- **Info-Panel:** zeigt Zustand (z. B. «In Betrieb», «Wartet auf Wolle», «Lager voll», «Nicht an Kontor
  angebunden»), Produktion, Fortschritt und Unterhalt.

### Produktionsketten

| Gebäude            | Erzeugt    | Braucht    | Zyklus (Ticks) | Unterhalt | Standort                        |
| ------------------ | ---------- | ---------- | -------------- | --------- | ------------------------------- |
| Fischerhütte       | Nahrung    | —          | 40             | 5         | an Wasser angrenzend            |
| Holzfäller         | Holz       | —          | 30             | 5         | mind. 1 Waldkachel im Radius 2  |
| Steinbruch         | Stein      | —          | 60             | 10        | an Gebirge angrenzend           |
| Schäferei          | Wolle      | —          | 50             | 10        | mind. 4 Graskacheln im Radius 2 |
| Weberei            | Stoff      | Wolle      | 50             | 15        | beliebiges Bauland              |
| Zuckerrohrplantage | Zuckerrohr | —          | 50             | 10        | mind. 4 Graskacheln im Radius 2 |
| Brennerei          | Rum        | Zuckerrohr | 50             | 20        | beliebiges Bauland              |

Werkzeug wird nicht hergestellt, sondern am Kontor gekauft. Bauland sind Sand, Gras und Wald ohne
Gebäude oder Weg; Gebirge und Wasser sind unbebaubar.

### Handel

Kontor anklicken, dann «Handeln»: Waren zu festen Preisen kaufen und verkaufen.

| Gut     | Holz | Werkzeug | Stein | Nahrung | Wolle | Stoff | Zuckerrohr | Rum |
| ------- | ---- | -------- | ----- | ------- | ----- | ----- | ---------- | --- |
| Kauf    | 10   | 40       | 15    | 8       | 12    | 30    | 12         | 40  |
| Verkauf | 4    | 15       | 6     | 3       | 5     | 12    | 5          | 18  |

### Unterhalt und Geld

- Alle 100 Ticks wird der Unterhalt aller Gebäude abgezogen — auch nicht angebundener. Im selben Takt
  kommen die Steuern herein. Die Kopfzeile zeigt Steuern, Unterhalt und die Bilanz (Steuern minus
  Unterhalt) je 100 Ticks; eine negative Bilanz ist hervorgehoben.
- Geld darf negativ werden. Solange es negativ ist, sind Bauen, Kaufen und Aufstieg gesperrt, bis
  wieder Geld hereinkommt (Verkauf oder Steuern).

### Abriss

Die Hälfte der Baukosten (abgerundet) wird zurückerstattet; Waren nur, soweit im Lager Platz ist. Das
Kontor kann nicht abgerissen werden.

## Bevölkerung

### Stufen

| Stufe    | max. Einwohner | Bedürfnisse (je Einwohner pro 100 Ticks) | Dienste         | Steuer je Einwohner pro 100 Ticks | Aufstieg kostet (Geld/Holz/Werkzeug/Stein) |
| -------- | -------------- | ---------------------------------------- | --------------- | --------------------------------- | ------------------------------------------ |
| Pioniere | 4              | Nahrung 0.5                              | —               | 2                                 | zu Siedlern: 100 / 5 / 2 / 0               |
| Siedler  | 8              | Nahrung 0.5, Stoff 0.2                   | Kapelle         | 7                                 | zu Bürgern: 300 / 10 / 5 / 5               |
| Bürger   | 15             | Nahrung 0.5, Stoff 0.2, Rum 0.2          | Kapelle, Schule | 14                                | —                                          |

Ein neues Wohnhaus startet mit einem Pionier. Die Kopfzeile zeigt die Einwohner je Stufe.

### Versorgung

Ein Wohnhaus lässt sich nur im Versorgungsradius (8) des Kontors oder eines angebundenen Marktplatzes
bauen und erhält nur dort Waren aus dem Lager. Liegt es ausserhalb, gelten alle Warenbedürfnisse als
unerfüllt.

### Bedürfnisse und Dienste

- Jedes Haus verbraucht die Waren seiner Stufe aus dem Lager. Fehlt eine Ware, ist das Bedürfnis
  unerfüllt, bis wieder eine Einheit entnommen werden kann.
- **Dienste:** Kapelle und Schule wirken im Radius 10 und nur, wenn sie per Weg angebunden sind.
- **Wachstum:** Alle 50 Ticks wächst ein Haus um einen Einwohner, wenn alle Bedürfnisse und Dienste
  seiner Stufe erfüllt sind; sonst schrumpft es um einen (mindestens einer bleibt).

### Aufstieg

Ein Haus steigt beim nächsten Wachstumstakt auf, wenn

- es voll belegt ist,
- seine Bedürfnisse seit mindestens 300 Ticks ununterbrochen erfüllt sind,
- die Dienste der nächsten Stufe in Reichweite sind,
- von jeder neuen Ware der nächsten Stufe mindestens eine Einheit im Lager liegt und
- die Aufstiegskosten bezahlbar sind (sie werden dann abgezogen).

Die Einwohnerzahl bleibt beim Aufstieg erhalten. Das Info-Panel eines Wohnhauses zeigt Einwohner,
Versorgung, Bedürfnisse mit ✓/✗, jede noch fehlende Aufstiegsbedingung und die Kosten.

### Steuern

Alle 100 Ticks zahlt jedes Haus Einwohner × Steuersatz seiner Stufe. Sind nicht alle Bedürfnisse und
Dienste erfüllt, zahlt es nur die Hälfte.

## Speichern, Laden, Neu

- **Speichern:** legt den Spielstand im Browser ab (ein Speicherplatz, nur in diesem Browser).
- **Laden:** lädt den gespeicherten Stand. Ist er beschädigt oder fehlt er, erscheint eine Meldung und
  das laufende Spiel bleibt unverändert. Hat das Spiel schon begonnen, fragt der Button zuerst «Wirklich
  laden?» (zweimal klicken).
- **Hinweis beim Start:** liegt ein Spielstand vor, weist eine Meldung auf «Laden» hin.
- **Neu:** zweimal klicken — der Button fragt «Wirklich neu?» —, dann entsteht eine neue Insel. Die
  Nummer der Karte steht als kleine Zeile in der Kopfzeile unter der Lagerleiste («Karte: …»).

## Entwicklung

Voraussetzung: Node ≥ 22.

```bash
make help      # Alle Befehle anzeigen
make install   # Abhängigkeiten installieren
make dev       # Dev-Server starten
make check     # Lint, Tests und Build wie in der CI
```

## Dokumentation

Einstieg: [`docs/index.md`](docs/index.md) — Architektur (arc42), Specs, Pläne, ADRs, Beobachtungen.
