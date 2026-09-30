# Inselreich — ein Aufbau-Strategiespiel im Stil von Anno 1602

Browser-Spiel (TypeScript + HTML5 Canvas, keine Laufzeit-Abhängigkeiten).
Eigene Grafik, eigene Spielwerte — inspiriert von der Mechanik des Klassikers, kein Nachbau von Originalmaterial.

Stand: Meilenstein 3 (Bevölkerung) — Insel wird generiert, Wege und Gebäude kosten Geld und Waren, Betriebe produzieren ins Kontor-Lager, am Kontor wird gehandelt, Wohnhäuser wachsen, steigen auf und zahlen Steuern.
Speichern folgt im nächsten Meilenstein. Dokumentation entsteht unter `docs/`.

## Spielen

- **Kamera:** Mausrad zoomt, mittlere Maustaste oder Leertaste + Ziehen verschiebt die Ansicht, WASD/Pfeiltasten ebenfalls.
- **Auswahl:** Klick wählt ein Gebäude, Ziehen verschiebt die Karte.
- **Bauen:** Gebäude in der Bauleiste wählen, dann auf die Karte klicken. Grün = Standort passt, rot = nicht möglich (Grund erscheint als Meldung).
- **Weg:** «Weg» wählen, klicken oder mit gedrückter Taste über mehrere Kacheln ziehen.
- **Abriss:** Zuerst das Abriss-Werkzeug wählen, dann Klick auf ein Gebäude oder einen Weg — oder im Info-Panel eines ausgewählten Gebäudes «Abreissen». Die Hälfte der Baukosten (abgerundet) wird zurückerstattet.
- **Abbrechen:** Rechtsklick oder `Esc` wechselt zurück zur Auswahl.
- **Geschwindigkeit:** ⏸ / 1× / 2× / 4× im Kopfbereich.

### Wirtschaft

- **Lager:** Alle Waren liegen im Kontor-Lager (Kapazität je Gut begrenzt). Die Lagerleiste im Kopfbereich zeigt den Bestand.
- **Baukosten:** Gebäude und Wege kosten Geld und teils Holz, Werkzeug oder Stein; die Kosten stehen in der Bauleiste. Was gerade nicht bezahlbar ist, wird blass dargestellt — ein Klick nennt den Grund.
- **Anbindung:** Produktionsbetriebe arbeiten nur, wenn sie per Weg mit dem Kontor verbunden sind. Nicht angebundene Gebäude tragen einen roten Punkt.
- **Info-Panel:** Klick auf ein Gebäude zeigt Zustand (z. B. «In Betrieb», «Wartet auf Wolle», «Lager voll»), Produktion, Fortschritt und Unterhalt.
- **Handel:** Kontor anklicken, dann «Handeln»: Waren zu festen Preisen kaufen und verkaufen.
- **Unterhalt:** In festen Abständen wird der Unterhalt aller Gebäude vom Geld abgezogen; die Kopfzeile zeigt Steuern, Unterhalt und Intervall. Bei negativem Kontostand ist Bauen und Kaufen gesperrt, bis wieder Geld hereinkommt (z. B. durch Verkauf oder Steuern).

### Bevölkerung

- **Stufen:** Wohnhäuser beginnen mit Pionieren und können zu Siedlern und schliesslich zu Bürgern aufsteigen. Jede Stufe fasst mehr Einwohner. Die Kopfzeile zeigt die Einwohner je Stufe.
- **Versorgungsradius:** Ein Wohnhaus lässt sich nur im Radius des Kontors oder eines Marktplatzes bauen und wird nur dort mit Waren aus dem Lager versorgt. Ein Marktplatz versorgt nur, wenn er per Weg angebunden ist.
- **Bedürfnisse:** Jede Stufe verbraucht bestimmte Waren (Pioniere Nahrung, Siedler zusätzlich Stoff, Bürger zusätzlich Rum). Sind alle Bedürfnisse erfüllt, wächst das Haus in regelmässigen Abständen um einen Einwohner, sonst schrumpft es.
- **Dienste:** Siedler brauchen eine Kapelle, Bürger zusätzlich eine Schule in Reichweite; beide müssen per Weg angebunden sein.
- **Aufstieg:** Ist ein Haus voll belegt, sind seine Bedürfnisse eine Weile ununterbrochen erfüllt, stehen die Dienste und Waren der nächsten Stufe bereit und reichen Geld und Baustoffe, steigt es beim nächsten Wachstum auf. Das Info-Panel eines Wohnhauses zeigt Einwohner, Versorgung, Bedürfnisse mit ✓/✗ sowie jede noch fehlende Aufstiegsbedingung und die Kosten.
- **Steuern:** Einwohner zahlen im selben Takt wie der Unterhalt Steuern; höhere Stufen zahlen mehr, unzufriedene Häuser nur die Hälfte.

### Ziel

- **50 Bürger:** Leben insgesamt 50 Bürger auf der Insel, ist das Ziel erreicht; eine Meldung erscheint und das Spiel läuft weiter. Der Chip «Bürger-Ziel» in der Kopfzeile zeigt den Fortschritt.

## Entwicklung

Voraussetzung: Node ≥ 22.

```bash
make install   # Abhängigkeiten installieren
make dev       # Dev-Server starten
make check     # Lint, Tests und Build wie in der CI
```
