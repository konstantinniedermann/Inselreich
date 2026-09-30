# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-09-30

## Aktuelles Projekt und Phase

- Projekt: **Inselreich** (Aufbau-Strategiespiel im Browser).
- MVP-Meilensteine M1–M4 fertig (Fundament, Wirtschaft, Bevölkerung, Persistenz & Feinschliff).
- Studio eingerichtet (Handbuch, Personas, Dashboard); Studio 1.5 (Verfassung, Handbuch 1.0,
  Autonomie, Messung, Verbesserungsschleife) auf Branch `feat/studio-autonomie`.
- Nächster Meilenstein: offen — L0 wählt ihn selbst aus dem Spielkonzept (kein Nutzer-Vorbehalt).

## Seit letzter Session erledigt

- Verfassung 1.0 (vorläufig in Kraft) und Handbuch 1.0 mit Changelog, Warteschlange, Experimenten,
  `lernen.md`, Retro- und Metrik-Ablage; Guard gegen irreversible Aktionen; Aufwandsmessung und
  Dashboard-Reiter.

## Laufende Pakete

keine

## Pausierte Pakete

keine

## Budget

keine Freigaben

## Offene Entscheide

- L0: keine
- Nutzer: siehe [warteschlange.md](warteschlange.md)

## Nächste Schritte

1. `lead-production` wertet `docs/beobachtungen.md` mit dem Skill `beobachtungen-auswerten` aus und
   legt L0 das Ergebnis vor.
2. L0 wählt danach den nächsten Meilenstein selbst aus dem Spielkonzept (Ruling, kein
   Nutzer-Vorbehalt), startet ihn mit `log.py milestone --status start` und gibt Design ein Budget
   frei.
