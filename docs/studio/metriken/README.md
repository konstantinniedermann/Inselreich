# Metriken

Verdichtete Messwerte des Studios je Session und je Meilenstein
([Verfassung §8](../VERFASSUNG.md#8-transparenz-und-logging), Handbuch [STUDIO.md](../STUDIO.md),
Abschnitt „Messung und Aufwand"). Die Rohdaten (`.studio/`) bleiben lokal; diese Dateien werden
committet, damit das Lernen die lokalen Rohdaten überdauert.

- **Zweck:** Datenbasis für Retros, Experimente und den Verlauf im Dashboard (Reiter „Qualität").
- **Dateiname:** `metriken/<kennung>.md` — Kennung `S-<datum>-<sid8>` für eine Session (Datum und
  die ersten 8 Zeichen der Session-ID) bzw. die Meilenstein-ID (z. B. `M5.md`).
- **Aufbau:** Tabellen für Menschen, am Ende der Abschnitt `## Rohwerte` mit einem JSON-Block für
  Dashboard und Coach.
- **Wer schreibt:** das Werkzeug, nie von Hand. L0 ruft am Session-Ende `make studio-metrics` auf
  (letzte Session), bei Meilenstein-Ende zusätzlich
  `python3 tools/studio/metrics.py --milestone <id>`. Die Befehle überschreiben die Datei derselben
  Kennung (idempotent).
- Fehlt eine Messung, steht im JSON `null` und in der Tabelle „nicht gemessen"; Messwerte werden nie
  geschätzt.
