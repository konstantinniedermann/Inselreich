# Studio-Stand

Übergabe zwischen Sessions. L0 liest diese Datei beim Session-Start und führt sie beim
Session-Ende nach (STUDIO.md, „Session-Start und -Ende"). Nur aktueller Stand, keine Historie —
Historie steht in [rulings.md](rulings.md), Git und im Dashboard-Archiv.

Stand: 2026-09-30

## Aktuelles Projekt und Phase

- Projekt: **Inselreich** (Aufbau-Strategiespiel im Browser).
- MVP-Meilensteine M1–M4 fertig (Fundament, Wirtschaft, Bevölkerung, Persistenz & Feinschliff).
- Studio 1.5 in Betrieb: Verfassung 1.0 (vorläufig bis N-001), Handbuch 1.2, Autonomie mit
  Warteschlange, Guard, Aufwandsmessung, Dashboard mit fünf Reitern, Studio-Coach.
- Nächster Meilenstein: offen — L0 wählt ihn selbst aus dem Spielkonzept (kein Nutzer-Vorbehalt).

## Parallele Sessions

Datei-Eigentum bei gleichzeitig laufenden L0-Sessions (STUDIO.md, „Session-Start und -Ende“,
Experiment E-002). Gegen fremde Pfade wird erst nach deren Merge geplant.

| Session                  | Stand         | besitzt                       | bis                 |
| ------------------------ | ------------- | ----------------------------- | ------------------- |
| Prozess-Graph (baff17bb) | abgeschlossen | nichts mehr (gemergt 723aaee) | –                   |
| M5/S17 (25e8352d)        | aktiv         | `tools/studio/`, `src/sim/`   | ihre Merges M5, S17 |

## Seit letzter Session erledigt

- Meilenstein **Studio-Graph** gemergt (Gate Merge R53, 723aaee): Prozess-Graph im Reiter „Live“
  (Lebensdauer, Auftrag/Bericht/Nachricht, Hierarchie), vereinfachte Organigramm-Kacheln mit
  Namen, Rolle und Emoji aus der Persona-Frontmatter, neues Event `message` (ADR-008-Nachtrag).
  Retro `retros/2026-09-30-meilenstein-studio-graph.md`; Experimente E-001 und E-002 laufen
  (R54, R55, Handbuch 1.2).
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
