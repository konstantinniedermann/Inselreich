# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-09-30

## Aktuelles Projekt und Phase

- Projekt: **Inselreich** (Aufbau-Strategiespiel im Browser).
- MVP-Meilensteine M1–M4 fertig (Fundament, Wirtschaft, Bevölkerung, Persistenz & Feinschliff).
- Studio 1.5 in Betrieb: Verfassung 1.0 (vorläufig bis N-001), Handbuch 1.0, Autonomie mit
  Warteschlange, Guard, Aufwandsmessung, Dashboard mit fünf Reitern, Studio-Coach.
- Parallel: Die Prozess-Graph-Arbeit (Spec `docs/superpowers/specs/2026-09-30-studio-prozessgraph-design.md`)
  baut auf Studio 1.5 auf; ihre geparkten Rulings liegen unter `.studio/handoffs/` und bekommen die
  nächsten freien Nummern.
- Nächster Meilenstein: offen — L0 wählt ihn selbst aus dem Spielkonzept (kein Nutzer-Vorbehalt).

## Seit letzter Session erledigt

- Studio 1.5 gemergt (Gate Merge R38): Verfassung, Handbuch 1.0 mit Changelog, Warteschlange,
  Experimenten, `lernen.md`, Retro- und Metrik-Ablage; Guard; Aufwandsmessung; Dashboard-Reiter;
  Probelauf-Protokoll `docs/studio/probelauf/2026-09-30.md`.
- Probelauf fand einen Spielfehler (Aufstieg entnimmt keine Ware) → `docs/beobachtungen.md`;
  ungeprüfter Fix-Entwurf lokal unter `.studio/handoffs/2026-09-30-probelauf-m5-01-aufstieg.patch`.

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
