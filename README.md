# Inselreich — ein Aufbau-Strategiespiel im Stil von Anno 1602

Browser-Spiel (TypeScript + HTML5 Canvas, keine Laufzeit-Abhängigkeiten).
Eigene Grafik, eigene Spielwerte — inspiriert von der Mechanik des Klassikers, kein Nachbau von Originalmaterial.

Stand: Meilenstein 2 (Wirtschaft) — Insel wird generiert, Wege und Gebäude kosten Geld und Waren, Betriebe produzieren ins Kontor-Lager, am Kontor wird gehandelt.
Bevölkerung und Speichern folgen in den nächsten Meilensteinen. Dokumentation entsteht unter `docs/`.

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
- **Unterhalt:** In festen Abständen wird der Unterhalt aller Gebäude vom Geld abgezogen; die Kopfzeile zeigt Betrag und Intervall. Bei negativem Kontostand ist Bauen und Kaufen gesperrt, bis wieder Geld hereinkommt (z. B. durch Verkauf).

## Entwicklung

Voraussetzung: Node ≥ 22.

```bash
make install   # Abhängigkeiten installieren
make dev       # Dev-Server starten
make check     # Lint, Tests und Build wie in der CI
```
