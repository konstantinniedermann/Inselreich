# Inselreich — ein Aufbau-Strategiespiel im Stil von Anno 1602

Browser-Spiel (TypeScript + HTML5 Canvas, keine Laufzeit-Abhängigkeiten).
Eigene Grafik, eigene Spielwerte — inspiriert von der Mechanik des Klassikers, kein Nachbau von Originalmaterial.

Stand: Meilenstein 1 (Fundament) — Insel wird generiert, Wege und Gebäude lassen sich platzieren und abreissen.
Produktion, Bevölkerung und Speichern folgen in den nächsten Meilensteinen. Dokumentation entsteht unter `docs/`.

## Spielen

- **Kamera:** Mausrad zoomt, mittlere Maustaste oder Leertaste + Ziehen verschiebt die Ansicht, WASD/Pfeiltasten ebenfalls.
- **Auswahl:** Klick wählt ein Gebäude, Ziehen verschiebt die Karte.
- **Bauen:** Gebäude in der Bauleiste wählen, dann auf die Karte klicken. Grün = Standort passt, rot = nicht möglich (Grund erscheint als Meldung).
- **Weg:** «Weg» wählen, klicken oder mit gedrückter Taste über mehrere Kacheln ziehen.
- **Abriss:** Zuerst das Abriss-Werkzeug wählen, dann Klick auf ein Gebäude oder einen Weg. Kosten werden angezeigt, aber erst ab Meilenstein 2 abgezogen.
- **Abbrechen:** Rechtsklick oder `Esc` wechselt zurück zur Auswahl.
- **Geschwindigkeit:** ⏸ / 1× / 2× / 4× im Kopfbereich.

## Entwicklung

Voraussetzung: Node ≥ 22.

```bash
make install   # Abhängigkeiten installieren
make dev       # Dev-Server starten
make check     # Lint, Tests und Build wie in der CI
```
